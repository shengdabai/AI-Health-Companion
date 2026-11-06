import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WebSocket } from 'ws';
import { HTTP_OPERATIONS, LIVE_OPERATIONS, OPERATIONS } from '../src/contracts.js';
import { createLocalAiServer } from '../src/server.js';
import type { ServerConfig } from '../src/config.js';
import type { LiveEvents, LiveProviderSession, ProviderAdapter } from '../src/providers.js';
import type { LiveOperation, ModelTask } from '../src/contracts.js';

const ORIGIN = 'http://localhost:5174';
const config = (overrides: Partial<ServerConfig> = {}): ServerConfig => ({
  enabled: true, host: '127.0.0.1', port: 8787, allowedHosts: new Set(), allowedOrigins: new Set([ORIGIN]),
  maxBodyBytes: 12_000_000, maxConcurrent: 2, requestsPerMinute: 50, providerTimeoutMs: 100,
  liveMaxMs: 10_000, liveMessagesPerSecond: 30, liveInputBytes: 1_000_000, liveOutputBytes: 1_000_000,
  anthropicKey: 'fixture', anthropicModel: 'fixture-model', geminiKey: 'fixture', geminiModel: 'fixture-model', geminiTtsModel: 'fixture-tts', geminiLiveModel: 'fixture-live',
  ...overrides,
});
class FakeProvider implements ProviderAdapter {
  invokes = 0; connects = 0; closed = 0; audio = 0; events?: LiveEvents;
  output: unknown = { answer: '一般健康信息', confidence: 0.8, suggestions: ['咨询医生'] };
  invokeImpl?: (signal: AbortSignal) => Promise<unknown>;
  async invoke(_task: ModelTask, _config: ServerConfig, signal: AbortSignal) { this.invokes++; return this.invokeImpl ? this.invokeImpl(signal) : this.output; }
  async connectLive(_operation: LiveOperation, _input: Record<string, unknown>, _config: ServerConfig, _signal: AbortSignal, events: LiveEvents): Promise<LiveProviderSession> {
    this.connects++; this.events = events; events.ready();
    return { sendAudio: () => { this.audio++; }, sendImage: () => {}, close: () => { this.closed++; } };
  }
}
async function start(provider = new FakeProvider(), overrides: Partial<ServerConfig> = {}) {
  const cfg = config(overrides); const hosts = cfg.allowedHosts as Set<string>;
  const server = createLocalAiServer(cfg, provider); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const port = (server.address() as net.AddressInfo).port; hosts.add(`127.0.0.1:${port}`); hosts.add(`localhost:${port}`);
  return { server, provider, port, close: async () => { server.close(); await once(server, 'close'); } };
}
function post(port: number, operation: string, input: unknown, headers: Record<string, string> = {}) {
  const body = JSON.stringify({ version: 1, input });
  return new Promise<{ status: number; body: any; headers: http.IncomingHttpHeaders }>((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path: `/v1/operations/${operation}`, method: 'POST', headers: { Host: `127.0.0.1:${port}`, Origin: ORIGIN, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), ...headers } }, res => {
      const chunks: Buffer[] = []; res.on('data', c => chunks.push(c)); res.on('end', () => resolve({ status: res.statusCode!, body: JSON.parse(Buffer.concat(chunks).toString()), headers: res.headers }));
    }); req.on('error', reject); req.end(body);
  });
}

const image = { mimeType: 'image/png', data: 'YQ==' };
const audio = { mimeType: 'audio/webm', data: 'YQ==' };
const inputFixtures: Record<string, unknown> = {
  'health-chat': { question: '如何睡得更好？' }, 'practice-material': { level: 'Beginner (HSK 1-2)', topic: 'Daily Life' },
  'pronunciation-evaluation': { originalText: '你好', audio }, 'word-in-context': { word: 'run', contextSentence: 'I run daily.' },
  'sentence-grammar': { sentence: 'I run daily.' }, 'translate-to-chinese': { text: 'Hello' }, 'text-to-speech': { text: '你好' },
  'image-language-analysis': { image }, 'reader-tts': { text: 'Hello', voice: 'Kore' }, 'clean-reader-text': { text: 'Clean me' },
  'english-word-context': { word: 'run', sentence: 'I run daily.' }, 'refine-english-script': { draft: 'I happy.', context: '' },
  'shadowing-text': { topic: 'travel' }, 'image-language-analysis-extended': { image },
};
const baseImage = { chinese: '猫', pinyin: 'māo', english: 'cat', sentence: '这是一只猫。', sentencePinyin: 'Zhè shì yì zhī māo.', sentenceEnglish: 'This is a cat.' };
const outputFixtures: Record<string, unknown> = {
  'health-chat': { answer: '回答', confidence: 0.8, suggestions: ['建议'] },
  'practice-material': { chinese: '你好', pinyin: 'nǐ hǎo', translation: 'hello', vocabulary: [{ word: '你', pinyin: 'nǐ', meaning: 'you' }] },
  'pronunciation-evaluation': { score: 90, feedback: '好', pronunciationTips: ['声调'], toneAnalysis: '准确' },
  'word-in-context': { word: 'run', definition: 'move', collocation: 'run daily', phonetic: '/rʌn/', type: 'verb' },
  'sentence-grammar': { sentence: 'I run.', summary: 'simple', parts: [{ text: 'I', role: 'subject', explanation: 'subject' }] },
  'translate-to-chinese': { chinese: '你好', pinyin: 'nǐ hǎo', breakdown: [{ chinese: '你', pinyin: 'nǐ', literal: 'you' }] },
  'text-to-speech': { mimeType: 'audio/pcm;rate=24000', data: 'YQ==' }, 'image-language-analysis': baseImage,
  'reader-tts': { mimeType: 'audio/pcm;rate=24000', data: 'YQ==' }, 'clean-reader-text': { text: 'Clean' },
  'english-word-context': { text: 'Meaning' }, 'refine-english-script': { text: 'Better' }, 'shadowing-text': { text: 'Passage' },
  'image-language-analysis-extended': { ...baseImage, hskLevel: 1, funFact: 'fact', commonMistake: 'mistake', radicals: ['犭'] },
};

test('all 14 HTTP and 3 Live contracts accept representative client/provider fixtures', () => {
  assert.equal(HTTP_OPERATIONS.length, 14); assert.equal(LIVE_OPERATIONS.length, 3);
  for (const operation of HTTP_OPERATIONS) {
    const spec = OPERATIONS[operation]; const input = spec.validateInput(inputFixtures[operation]); const task = spec.task(input);
    assert.ok(task.system); assert.ok(task.prompt); assert.doesNotThrow(() => spec.validateOutput(outputFixtures[operation]));
  }
  assert.deepEqual([...LIVE_OPERATIONS], ['language-live', 'roleplay-live', 'multimodal-live']);
});

test('disabled service and rejected origin make zero provider calls', async () => {
  const x = await start(new FakeProvider(), { enabled: false });
  try {
    assert.equal((await post(x.port, 'health-chat', inputFixtures['health-chat'])).status, 503);
    assert.equal((await post(x.port, 'health-chat', inputFixtures['health-chat'], { Origin: 'http://evil.test' })).status, 403);
    assert.equal(x.provider.invokes, 0);
  } finally { await x.close(); }
});

test('HTTP success is exact, TTS works with TTS-only model, and invalid provider output is rejected', async () => {
  const provider = new FakeProvider(); const x = await start(provider);
  try {
    const ok = await post(x.port, 'health-chat', inputFixtures['health-chat']); assert.equal(ok.status, 200); assert.equal(ok.headers['access-control-allow-origin'], ORIGIN);
    provider.output = outputFixtures['text-to-speech'];
    const tts = await post(x.port, 'text-to-speech', { text: '你好' }); assert.equal(tts.status, 200); assert.equal(tts.body.data.mimeType, 'audio/pcm;rate=24000');
    provider.output = { answer: 'bad', confidence: null, suggestions: [] };
    assert.equal((await post(x.port, 'health-chat', inputFixtures['health-chat'])).status, 502);
  } finally { await x.close(); }
  const p2 = new FakeProvider(); p2.output = outputFixtures['text-to-speech']; const y = await start(p2, { geminiModel: undefined });
  try { assert.equal((await post(y.port, 'text-to-speech', { text: '你好' })).status, 200); } finally { await y.close(); }
});

test('timeout wins even when adapter ignores AbortSignal and capacity remains reserved', async () => {
  const provider = new FakeProvider(); provider.invokeImpl = async () => new Promise(() => {});
  const x = await start(provider, { maxConcurrent: 1, providerTimeoutMs: 30 });
  try {
    assert.equal((await post(x.port, 'health-chat', inputFixtures['health-chat'])).status, 504);
    assert.equal((await post(x.port, 'health-chat', inputFixtures['health-chat'])).body.error.code, 'BUSY');
  } finally { await x.close(); }
});

test('client disconnect aborts provider signal', async () => {
  let aborted = false; const provider = new FakeProvider();
  provider.invokeImpl = signal => new Promise((_resolve, reject) => signal.addEventListener('abort', () => { aborted = true; reject(signal.reason); }, { once: true }));
  const x = await start(provider, { providerTimeoutMs: 1000 });
  try {
    const socket = net.connect(x.port, '127.0.0.1'); await once(socket, 'connect');
    const body = JSON.stringify({ version: 1, input: inputFixtures['health-chat'] });
    socket.write(`POST /v1/operations/health-chat HTTP/1.1\r\nHost: 127.0.0.1:${x.port}\r\nOrigin: ${ORIGIN}\r\nContent-Type: application/json\r\nContent-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);
    while (provider.invokes === 0) await new Promise(r => setTimeout(r, 5)); socket.destroy();
    for (let i = 0; i < 50 && !aborted; i++) await new Promise(r => setTimeout(r, 5)); assert.equal(aborted, true);
  } finally { await x.close(); }
});

test('Live relay validates frames, forwards bounded media, and closes provider on client close', async () => {
  const provider = new FakeProvider(); const x = await start(provider);
  try {
    const ws = new WebSocket(`ws://127.0.0.1:${x.port}/v1/live/language-live`, { headers: { Origin: ORIGIN } }); await once(ws, 'open');
    ws.send(JSON.stringify({ type: 'start', version: 1, input: {} }));
    const [ready] = await once(ws, 'message'); assert.equal(JSON.parse(ready.toString()).type, 'ready');
    ws.send(JSON.stringify({ type: 'audio', mimeType: 'audio/pcm;rate=16000', data: 'YQ==' }));
    for (let i = 0; i < 50 && provider.audio === 0; i++) await new Promise(r => setTimeout(r, 5)); assert.equal(provider.audio, 1);
    provider.events!.audio('YQ==', 'audio/pcm;rate=24000'); const [audioFrame] = await once(ws, 'message'); assert.equal(JSON.parse(audioFrame.toString()).mimeType, 'audio/pcm;rate=24000');
    ws.close(); await once(ws, 'close'); for (let i = 0; i < 50 && provider.closed === 0; i++) await new Promise(r => setTimeout(r, 5)); assert.ok(provider.closed >= 1);
  } finally { await x.close(); }
});

test('Live disabled service makes zero connects and oversized provider audio closes relay', async () => {
  const disabled = await start(new FakeProvider(), { enabled: false });
  try {
    const ws = new WebSocket(`ws://127.0.0.1:${disabled.port}/v1/live/language-live`, { headers: { Origin: ORIGIN } }); await once(ws, 'open'); ws.send(JSON.stringify({ type: 'start', version: 1, input: {} }));
    const [message] = await once(ws, 'message'); assert.equal(JSON.parse(message.toString()).code, 'SERVICE_UNAVAILABLE'); await once(ws, 'close'); assert.equal(disabled.provider.connects, 0);
  } finally { await disabled.close(); }
  const x = await start();
  try {
    const ws = new WebSocket(`ws://127.0.0.1:${x.port}/v1/live/language-live`, { headers: { Origin: ORIGIN } }); await once(ws, 'open'); ws.send(JSON.stringify({ type: 'start', version: 1, input: {} })); await once(ws, 'message');
    x.provider.events!.audio(Buffer.alloc(256_001).toString('base64'), 'audio/pcm;rate=24000'); const [msg] = await once(ws, 'message'); assert.equal(JSON.parse(msg.toString()).code, 'LIVE_OUTPUT_LIMIT'); await once(ws, 'close');
  } finally { await x.close(); }
});

test('server shutdown terminates an active Live socket and cleans the provider session', async () => {
  const x = await start();
  const ws = new WebSocket(`ws://127.0.0.1:${x.port}/v1/live/language-live`, { headers: { Origin: ORIGIN } }); await once(ws, 'open');
  ws.send(JSON.stringify({ type: 'start', version: 1, input: {} })); await once(ws, 'message');
  const closed = once(ws, 'close'); await x.close(); await closed;
  for (let i = 0; i < 50 && x.provider.closed === 0; i++) await new Promise(r => setTimeout(r, 5)); assert.ok(x.provider.closed >= 1);
});

import { loadConfig } from '../src/config.js';
import { OFFICIAL_ENDPOINTS, anthropicClientOptions, anthropicSystem, geminiClientOptions, liveModelConfig } from '../src/providers.js';

test('configuration is disabled by default, rejects non-loopback origins, and pins official endpoints', () => {
  const defaults = loadConfig({}); assert.equal(defaults.enabled, false); assert.equal(defaults.host, '127.0.0.1');
  assert.equal(defaults.allowedOrigins.has('http://localhost:3000'), true);
  assert.equal(defaults.allowedOrigins.has('http://127.0.0.1:3000'), true);
  assert.equal([...defaults.allowedOrigins].some(origin => origin.includes('*')), false);
  assert.throws(() => loadConfig({ AI_ALLOWED_ORIGINS: 'https://example.com' }));
  assert.throws(() => loadConfig({ AI_ALLOWED_ORIGINS: 'http://*.localhost:3000' }));
  assert.deepEqual(OFFICIAL_ENDPOINTS, { anthropic: 'https://api.anthropic.com', gemini: 'https://generativelanguage.googleapis.com' });
  assert.deepEqual(anthropicClientOptions('k'), { apiKey: 'k', authToken: null, baseURL: OFFICIAL_ENDPOINTS.anthropic });
  assert.deepEqual(geminiClientOptions('k', 1234), { apiKey: 'k', vertexai: false, httpOptions: { baseUrl: OFFICIAL_ENDPOINTS.gemini, timeout: 1234 } });
  const live = liveModelConfig('language-live', new AbortController().signal); assert.equal('httpOptions' in live, false);
  const healthTask = OPERATIONS['health-chat'].task(OPERATIONS['health-chat'].validateInput(inputFixtures['health-chat']));
  assert.match(anthropicSystem(healthTask), /JSON Schema/); assert.match(anthropicSystem(healthTask), /confidence/);
});

test('chunked oversized body and absolute-form target fail without provider calls', async () => {
  const x = await start(new FakeProvider(), { maxBodyBytes: 40 });
  try {
    const oversized = await new Promise<number>((resolve, reject) => {
      const req = http.request({ hostname: '127.0.0.1', port: x.port, path: '/v1/operations/health-chat', method: 'POST', headers: { Host: `127.0.0.1:${x.port}`, Origin: ORIGIN, 'Content-Type': 'application/json' } }, res => { res.resume(); res.on('end', () => resolve(res.statusCode!)); });
      req.on('error', reject); req.write('{"version":1,"input":{"question":"'); req.end('x'.repeat(100) + '"}}');
    });
    assert.equal(oversized, 413);
    const rawStatus = await new Promise<string>((resolve, reject) => {
      const socket = net.connect(x.port, '127.0.0.1'); let data = ''; socket.on('error', reject); socket.on('data', c => { data += c; }); socket.on('end', () => resolve(data.split('\r\n')[0]!));
      socket.on('connect', () => socket.end(`POST http://evil.test/v1/operations/health-chat HTTP/1.1\r\nHost: 127.0.0.1:${x.port}\r\nOrigin: ${ORIGIN}\r\nContent-Type: application/json\r\nContent-Length: 2\r\nConnection: close\r\n\r\n{}`));
    });
    assert.match(rawStatus, / 400 /); assert.equal(x.provider.invokes, 0);
  } finally { await x.close(); }
});

test('Live lifetime and message-rate limits close sessions', async () => {
  const lifetime = await start(new FakeProvider(), { liveMaxMs: 25 });
  try {
    const ws = new WebSocket(`ws://127.0.0.1:${lifetime.port}/v1/live/language-live`, { headers: { Origin: ORIGIN } }); await once(ws, 'open'); ws.send(JSON.stringify({ type: 'start', version: 1, input: {} })); await once(ws, 'message');
    const [limit] = await once(ws, 'message'); assert.equal(JSON.parse(limit.toString()).code, 'LIVE_SESSION_LIMIT'); await once(ws, 'close');
  } finally { await lifetime.close(); }
  const rate = await start(new FakeProvider(), { liveMessagesPerSecond: 1 });
  try {
    const ws = new WebSocket(`ws://127.0.0.1:${rate.port}/v1/live/language-live`, { headers: { Origin: ORIGIN } }); await once(ws, 'open'); ws.send(JSON.stringify({ type: 'start', version: 1, input: {} })); await once(ws, 'message');
    ws.send(JSON.stringify({ type: 'audio', mimeType: 'audio/pcm;rate=16000', data: 'YQ==' })); const [limited] = await once(ws, 'message'); assert.equal(JSON.parse(limited.toString()).code, 'LIVE_RATE_LIMITED'); await once(ws, 'close');
  } finally { await rate.close(); }
});

test('late Live connect after client close is immediately closed and releases safely', async () => {
  let resolveSession!: (value: LiveProviderSession) => void; let closes = 0; let connects = 0;
  const delayed: ProviderAdapter = {
    invoke: async () => ({}),
    connectLive: () => { connects++; return new Promise(resolve => { resolveSession = resolve; }); },
  };
  const x = await start(delayed as FakeProvider);
  try {
    const ws = new WebSocket(`ws://127.0.0.1:${x.port}/v1/live/language-live`, { headers: { Origin: ORIGIN } }); await once(ws, 'open'); ws.send(JSON.stringify({ type: 'start', version: 1, input: {} }));
    while (connects === 0) await new Promise(r => setTimeout(r, 5)); ws.close(); await once(ws, 'close');
    resolveSession({ sendAudio() {}, sendImage() {}, close() { closes++; } });
    for (let i = 0; i < 50 && closes === 0; i++) await new Promise(r => setTimeout(r, 5)); assert.equal(closes, 1);
  } finally { await x.close(); }
});

test('synchronous adapter throws become stable failures without leaking capacity', async () => {
  const throwing: ProviderAdapter = { invoke() { throw new Error('sync'); }, connectLive() { throw new Error('sync'); } };
  const x = await start(throwing as FakeProvider, { maxConcurrent: 1 });
  try {
    assert.equal((await post(x.port, 'health-chat', inputFixtures['health-chat'])).status, 502);
    assert.equal((await post(x.port, 'health-chat', inputFixtures['health-chat'])).status, 502);
    const ws = new WebSocket(`ws://127.0.0.1:${x.port}/v1/live/language-live`, { headers: { Origin: ORIGIN } }); await once(ws, 'open'); ws.send(JSON.stringify({ type: 'start', version: 1, input: {} }));
    const [message] = await once(ws, 'message'); assert.equal(JSON.parse(message.toString()).code, 'LIVE_PROVIDER_FAILED'); await once(ws, 'close');
  } finally { await x.close(); }
});

test('process-local request rate budget rejects before a second provider call', async () => {
  const x = await start(new FakeProvider(), { requestsPerMinute: 1 });
  try {
    assert.equal((await post(x.port, 'health-chat', inputFixtures['health-chat'])).status, 200);
    assert.equal((await post(x.port, 'health-chat', inputFixtures['health-chat'])).status, 429);
    assert.equal(x.provider.invokes, 1);
  } finally { await x.close(); }
});

test('production npm start runs compiled entry disabled, returns 503, and exits on SIGTERM', async () => {
  const reservation = net.createServer(); reservation.listen(0, '127.0.0.1'); await once(reservation, 'listening');
  const port = (reservation.address() as net.AddressInfo).port; await new Promise<void>((resolve, reject) => reservation.close(error => error ? reject(error) : resolve()));
  const home = await mkdtemp(join(tmpdir(), 'local-ai-start-'));
  const child = spawn('npm', ['start'], {
    cwd: new URL('..', import.meta.url),
    env: {
      PATH: process.env.PATH || '/usr/bin:/bin', HOME: home, TMPDIR: home, LANG: 'C',
      npm_config_userconfig: '/dev/null', npm_config_cache: join(home, 'npm-cache'), npm_config_update_notifier: 'false',
      AI_SERVICE_ENABLED: 'false', AI_HOST: '127.0.0.1', AI_PORT: String(port),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = ''; let stderr = ''; child.stdout.on('data', chunk => { stdout += chunk; }); child.stderr.on('data', chunk => { stderr += chunk; });
  try {
    const deadline = Date.now() + 5000;
    while (!stdout.includes('Local AI server listening')) {
      if (child.exitCode !== null) throw new Error(`npm start exited early: ${stderr}`);
      if (Date.now() > deadline) throw new Error(`npm start did not become ready: ${stdout}\n${stderr}`);
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    const response = await post(port, 'health-chat', inputFixtures['health-chat']);
    assert.equal(response.status, 503); assert.equal(response.body.error.code, 'SERVICE_UNAVAILABLE');
    child.kill('SIGTERM'); const [code, signal] = await once(child, 'exit'); assert.equal(code, 0); assert.equal(signal, null);
  } finally {
    if (child.exitCode === null && child.signalCode === null) { child.kill('SIGKILL'); await once(child, 'exit'); }
    await rm(home, { recursive: true, force: true });
  }
});
