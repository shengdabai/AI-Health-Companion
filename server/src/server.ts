import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { WebSocket, WebSocketServer, type RawData } from 'ws';
import { ContractError, decodedBase64Size, isHttpOperation, isLiveOperation, OPERATIONS, validateLiveInput, type LiveOperation, type MediaPart } from './contracts.js';
import { providerReady, type ServerConfig } from './config.js';
import type { LiveProviderSession, ProviderAdapter } from './providers.js';

const RESPONSE_LIMIT_BYTES = 2_000_000;
const LIVE_START_LIMIT_BYTES = 16_000;
const AUDIO_LIMIT_BYTES = 64_000;
const IMAGE_LIMIT_BYTES = 750_000;
const LIVE_OUTPUT_CHUNK_BYTES = 256_000;
const SOCKET_BACKPRESSURE_BYTES = 1_000_000;

type ErrorCode = 'BAD_REQUEST' | 'FORBIDDEN' | 'NOT_FOUND' | 'METHOD_NOT_ALLOWED' | 'UNSUPPORTED_MEDIA_TYPE' | 'PAYLOAD_TOO_LARGE' | 'RATE_LIMITED' | 'BUSY' | 'SERVICE_UNAVAILABLE' | 'PROVIDER_TIMEOUT' | 'PROVIDER_FAILED' | 'INVALID_PROVIDER_RESPONSE';
const failure = (code: ErrorCode, message: string, retryable: boolean) => ({ ok: false as const, error: { code, message, retryable } });

class Semaphore {
  private active = 0;
  constructor(private readonly max: number) {}
  tryAcquire(): (() => void) | undefined {
    if (this.active >= this.max) return undefined;
    this.active++;
    let released = false;
    return () => { if (!released) { released = true; this.active--; } };
  }
}
class MinuteBudget {
  private readonly entries = new Map<string, { start: number; count: number }>();
  constructor(private readonly limit: number) {}
  take(key: string, now = Date.now()): boolean {
    const current = this.entries.get(key);
    if (!current || now - current.start >= 60_000) { this.entries.set(key, { start: now, count: 1 }); return true; }
    if (current.count >= this.limit) return false;
    current.count++;
    return true;
  }
}

const remoteKey = (request: IncomingMessage) => request.socket.remoteAddress || 'loopback';
const originFor = (request: IncomingMessage, config: ServerConfig): string | undefined => {
  const host = request.headers.host;
  if (!host || !config.allowedHosts.has(host)) return undefined;
  const origin = request.headers.origin;
  if (origin !== undefined && !config.allowedOrigins.has(origin)) return undefined;
  return origin;
};
const setCors = (response: ServerResponse, origin?: string) => {
  if (!origin) return;
  response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Vary', 'Origin');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Access-Control-Max-Age', '600');
};
const sendJson = (response: ServerResponse, status: number, value: unknown, origin?: string) => {
  if (response.destroyed || response.writableEnded) return;
  const body = JSON.stringify(value);
  setCors(response, origin);
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  response.end(body);
};
const readJson = async (request: IncomingMessage, limit: number): Promise<unknown> => {
  if (request.headers['content-encoding']) throw new ContractError('INVALID_INPUT', 'content encoding is not supported');
  const declared = Number(request.headers['content-length'] || 0);
  if (Number.isFinite(declared) && declared > limit) throw new ContractError('INVALID_INPUT', 'request is too large');
  const chunks: Buffer[] = []; let total = 0;
  for await (const raw of request) { const chunk = Buffer.from(raw); total += chunk.length; if (total > limit) { request.resume(); throw new ContractError('INVALID_INPUT', 'request is too large'); } chunks.push(chunk); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new ContractError('INVALID_INPUT', 'invalid JSON'); }
};
const requestEnvelope = (raw: unknown): unknown => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new ContractError('INVALID_INPUT', 'request must be an object');
  const value = raw as Record<string, unknown>;
  if (value.version !== 1 || !('input' in value) || Object.keys(value).some(key => key !== 'version' && key !== 'input')) throw new ContractError('INVALID_INPUT', 'request contract is invalid');
  return value.input;
};
const providerError = (error: unknown) => error instanceof ContractError
  ? { status: 502, body: failure('INVALID_PROVIDER_RESPONSE', 'AI provider returned an invalid response.', true) }
  : { status: 502, body: failure('PROVIDER_FAILED', 'AI provider request failed.', true) };
const abortPromise = (signal: AbortSignal): Promise<never> => new Promise((_, reject) => {
  if (signal.aborted) reject(signal.reason);
  else signal.addEventListener('abort', () => reject(signal.reason), { once: true });
});
const safePath = (value: string | undefined): string | undefined => {
  try {
    const parsed = new URL(value || '/', 'http://local');
    if (parsed.origin !== 'http://local') return undefined;
    return parsed.pathname;
  } catch { return undefined; }
};

export function createLocalAiServer(config: ServerConfig, providers: ProviderAdapter): Server {
  const semaphore = new Semaphore(config.maxConcurrent);
  const bodySemaphore = new Semaphore(config.maxConcurrent * 2);
  const budget = new MinuteBudget(config.requestsPerMinute);
  const server = createServer(async (request, response) => {
    const origin = originFor(request, config);
    if (!request.headers.host || !config.allowedHosts.has(request.headers.host) || (request.headers.origin !== undefined && !origin)) { sendJson(response, 403, failure('FORBIDDEN', 'Request origin is not allowed.', false)); return; }
    if (request.method === 'OPTIONS') { setCors(response, origin); response.writeHead(204, { 'Cache-Control': 'no-store' }); response.end(); return; }
    if (request.method !== 'POST') { sendJson(response, 405, failure('METHOD_NOT_ALLOWED', 'Only POST is supported.', false), origin); return; }
    const pathname = safePath(request.url);
    if (!pathname) { sendJson(response, 400, failure('BAD_REQUEST', 'Request target is invalid.', false), origin); return; }
    const match = /^\/v1\/operations\/([a-z0-9-]+)$/.exec(pathname);
    if (!match || !isHttpOperation(match[1]!)) { sendJson(response, 404, failure('NOT_FOUND', 'Operation not found.', false), origin); return; }
    if (!(request.headers['content-type'] || '').toLowerCase().startsWith('application/json')) { sendJson(response, 415, failure('UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json.', false), origin); return; }
    if (!budget.take(remoteKey(request))) { sendJson(response, 429, failure('RATE_LIMITED', 'Local request budget exceeded.', true), origin); return; }
    const operation = match[1]; const spec = OPERATIONS[operation];
    const releaseBody = bodySemaphore.tryAcquire();
    if (!releaseBody) { sendJson(response, 503, failure('BUSY', 'AI service is busy.', true), origin); return; }
    let input: Record<string, unknown>;
    try { input = spec.validateInput(requestEnvelope(await readJson(request, config.maxBodyBytes))); }
    catch (error) { const tooLarge = error instanceof ContractError && error.message.includes('too large'); sendJson(response, tooLarge ? 413 : 400, failure(tooLarge ? 'PAYLOAD_TOO_LARGE' : 'BAD_REQUEST', tooLarge ? 'Request body is too large.' : 'Request body is invalid.', false), origin); return; }
    finally { releaseBody(); }
    const task = spec.task(input);
    if (!providerReady(config, task.provider, task.mode)) { sendJson(response, 503, failure('SERVICE_UNAVAILABLE', 'AI service is not configured.', true), origin); return; }
    const release = semaphore.tryAcquire();
    if (!release) { sendJson(response, 503, failure('BUSY', 'AI service is busy.', true), origin); return; }
    const controller = new AbortController();
    let timedOut = false; let actualSettled = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(new DOMException('timeout', 'TimeoutError')); }, config.providerTimeoutMs);
    const disconnect = () => { if (!response.writableEnded) controller.abort(new DOMException('client disconnected', 'AbortError')); };
    response.once('close', disconnect);
    const actual = Promise.resolve().then(() => providers.invoke(task, config, controller.signal)).then(
      value => { actualSettled = true; return value; },
      error => { actualSettled = true; throw error; },
    );
    try {
      const raw = await Promise.race([actual, abortPromise(controller.signal)]);
      const data = spec.validateOutput(raw);
      const envelope = { ok: true as const, data };
      if (Buffer.byteLength(JSON.stringify(envelope)) > RESPONSE_LIMIT_BYTES) throw new ContractError('INVALID_PROVIDER_RESPONSE', 'response is too large');
      sendJson(response, 200, envelope, origin);
    } catch (error) {
      if (timedOut) sendJson(response, 504, failure('PROVIDER_TIMEOUT', 'AI provider timed out.', true), origin);
      else if (!controller.signal.aborted) { const mapped = providerError(error); sendJson(response, mapped.status, mapped.body, origin); }
    } finally {
      clearTimeout(timer); response.off('close', disconnect);
      if (actualSettled) release(); else void actual.then(release, release);
    }
  });
  server.headersTimeout = Math.min(15_000, config.providerTimeoutMs);
  server.requestTimeout = Math.min(30_000, config.providerTimeoutMs + 5_000);

  const webSockets = new WebSocketServer({ noServer: true, maxPayload: 1_100_000 });
  server.on('upgrade', (request, socket, head) => {
    const origin = originFor(request, config);
    const pathname = safePath(request.url);
    const match = pathname ? /^\/v1\/live\/([a-z0-9-]+)$/.exec(pathname) : null;
    if (!origin || !match || !isLiveOperation(match[1]!) || !budget.take(remoteKey(request))) { socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); socket.destroy(); return; }
    webSockets.handleUpgrade(request, socket, head, ws => webSockets.emit('connection', ws, request, match[1]));
  });
  webSockets.on('connection', (socket: WebSocket, _request: IncomingMessage, operation: LiveOperation) => handleLive(socket, operation, config, providers, semaphore));
  const closeHttp = server.close.bind(server);
  server.close = callback => {
    for (const client of webSockets.clients) client.terminate();
    webSockets.close();
    return closeHttp(callback);
  };
  return server;
}

function handleLive(socket: WebSocket, operation: LiveOperation, config: ServerConfig, providers: ProviderAdapter, semaphore: Semaphore) {
  let providerSession: LiveProviderSession | undefined; let started = false; let closed = false; let connecting = false; let release: (() => void) | undefined;
  let inputBytes = 0; let outputBytes = 0; let messageWindow = Date.now(); let messageCount = 0;
  const controller = new AbortController();
  const releaseNow = () => { release?.(); release = undefined; };
  const send = (value: unknown): boolean => {
    if (closed || socket.readyState !== WebSocket.OPEN || socket.bufferedAmount > SOCKET_BACKPRESSURE_BYTES) return false;
    const data = JSON.stringify(value); outputBytes += Buffer.byteLength(data);
    if (outputBytes > config.liveOutputBytes) return false;
    socket.send(data); return true;
  };
  const cleanup = () => {
    if (closed) return;
    closed = true; clearTimeout(startTimer); clearTimeout(lifetimeTimer); controller.abort(new DOMException('relay closed', 'AbortError'));
    try { providerSession?.close(); } catch {}
    if (!connecting) releaseNow();
  };
  const fail = (code: string, closeCode = 4400) => { if (!closed) send({ type: 'error', code }); cleanup(); if (socket.readyState === WebSocket.OPEN) socket.close(closeCode, 'relay rejected'); };
  const startTimer = setTimeout(() => fail('LIVE_START_TIMEOUT', 4408), 5000);
  const lifetimeTimer = setTimeout(() => fail('LIVE_SESSION_LIMIT', 4408), config.liveMaxMs);
  socket.on('message', async (raw: RawData, binary: boolean) => {
    const now = Date.now(); if (now - messageWindow >= 1000) { messageWindow = now; messageCount = 0; }
    if (++messageCount > config.liveMessagesPerSecond) { fail('LIVE_RATE_LIMITED', 4429); return; }
    if (binary) { fail('INVALID_FRAME'); return; }
    const text = raw.toString(); inputBytes += Buffer.byteLength(text);
    if (inputBytes > config.liveInputBytes) { fail('LIVE_INPUT_LIMIT', 4409); return; }
    if (!started) {
      started = true; clearTimeout(startTimer);
      if (Buffer.byteLength(text) > LIVE_START_LIMIT_BYTES) { fail('INVALID_START'); return; }
      let frame: unknown; try { frame = JSON.parse(text); } catch { fail('INVALID_START'); return; }
      if (!frame || typeof frame !== 'object' || Array.isArray(frame)) { fail('INVALID_START'); return; }
      const value = frame as Record<string, unknown>;
      if (value.type !== 'start' || value.version !== 1 || !('input' in value) || Object.keys(value).some(key => !['type', 'version', 'input'].includes(key))) { fail('INVALID_START'); return; }
      let input: Record<string, unknown>; try { input = validateLiveInput(operation, value.input); } catch { fail('INVALID_START'); return; }
      if (!providerReady(config, 'gemini', 'live')) { fail('SERVICE_UNAVAILABLE', 4503); return; }
      release = semaphore.tryAcquire(); if (!release) { fail('BUSY', 4503); return; }
      let opened = false; connecting = true; let timeout = false;
      const connectTimer = setTimeout(() => { timeout = true; controller.abort(new DOMException('timeout', 'TimeoutError')); }, config.providerTimeoutMs);
      const underlying = Promise.resolve().then(() => providers.connectLive(operation, input, config, controller.signal, {
        ready: () => { opened = true; },
        audio: (data, mimeType) => {
          if (closed || mimeType !== 'audio/pcm;rate=24000' || decodedBase64Size(data) > LIVE_OUTPUT_CHUNK_BYTES || !send({ type: 'audio', data, mimeType })) fail('LIVE_OUTPUT_LIMIT', 4409);
        },
        text: value => { if (!send({ type: 'text', text: value.slice(0, 20_000) })) fail('LIVE_OUTPUT_LIMIT', 4409); },
        interrupted: () => { if (!send({ type: 'interrupted' })) fail('LIVE_OUTPUT_LIMIT', 4409); },
        error: () => fail('LIVE_PROVIDER_FAILED', 4511),
        closed: () => { if (!closed) send({ type: 'closed' }); cleanup(); if (socket.readyState === WebSocket.OPEN) socket.close(1000, 'provider closed'); },
      }));
      try {
        const candidate = await Promise.race([underlying, abortPromise(controller.signal)]);
        connecting = false; clearTimeout(connectTimer);
        if (closed || !opened || controller.signal.aborted) { try { candidate.close(); } catch {} releaseNow(); if (!closed) fail('LIVE_PROVIDER_FAILED', 4511); return; }
        providerSession = candidate;
        if (!send({ type: 'ready' })) fail('LIVE_OUTPUT_LIMIT', 4409);
      } catch {
        clearTimeout(connectTimer); fail(timeout ? 'LIVE_PROVIDER_TIMEOUT' : 'LIVE_PROVIDER_FAILED', timeout ? 4508 : 4511);
        void underlying.then(session => { try { session.close(); } catch {} connecting = false; releaseNow(); }, () => { connecting = false; releaseNow(); });
      }
      return;
    }
    if (!providerSession || closed || Buffer.byteLength(text) > 1_050_000) { fail('INVALID_FRAME'); return; }
    let frame: unknown; try { frame = JSON.parse(text); } catch { fail('INVALID_FRAME'); return; }
    if (!frame || typeof frame !== 'object' || Array.isArray(frame)) { fail('INVALID_FRAME'); return; }
    const value = frame as Record<string, unknown>; const type = value.type;
    if ((type !== 'audio' && type !== 'image') || typeof value.data !== 'string' || typeof value.mimeType !== 'string' || Object.keys(value).some(key => !['type', 'data', 'mimeType'].includes(key))) { fail('INVALID_FRAME'); return; }
    const allowed = type === 'audio' ? value.mimeType === 'audio/pcm;rate=16000' : ['image/jpeg', 'image/png', 'image/webp'].includes(value.mimeType);
    const limit = type === 'audio' ? AUDIO_LIMIT_BYTES : IMAGE_LIMIT_BYTES;
    if (!allowed || decodedBase64Size(value.data) > limit) { fail('INVALID_FRAME'); return; }
    const media: MediaPart = { mimeType: value.mimeType, data: value.data };
    try { if (type === 'audio') providerSession.sendAudio(media); else providerSession.sendImage(media); } catch { fail('LIVE_PROVIDER_FAILED', 4511); }
  });
  socket.on('close', cleanup); socket.on('error', cleanup);
}
