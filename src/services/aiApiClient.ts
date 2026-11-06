const ALLOWED_OPERATIONS = ['health-chat'] as const;

export type AiOperation = (typeof ALLOWED_OPERATIONS)[number];

export type ApiErrorCode =
  | 'AI_API_UNCONFIGURED'
  | 'AI_API_INVALID_CONFIG'
  | 'AI_API_INVALID_INPUT'
  | 'AI_API_REQUEST_FAILED'
  | 'AI_API_INVALID_RESPONSE';

export class ApiClientError extends Error {
  readonly code: ApiErrorCode;
  readonly retryable: boolean;

  constructor(code: ApiErrorCode, message: string, retryable = false) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.retryable = retryable;
  }
}

type ApiSuccess<T> = { ok: true; data: T };
type ApiFailure = {
  ok: false;
  error: { code: string; message: string; retryable: boolean };
};

interface RequestOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RESPONSE_BYTES = 64_000;

const isLocalHostname = (hostname: string) =>
  hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';

export const resolveApiBase = (
  rawValue: string | undefined,
  origin = globalThis.location?.origin ?? 'http://localhost',
): URL => {
  const value = rawValue?.trim();
  if (!value) {
    throw new ApiClientError('AI_API_UNCONFIGURED', 'AI 服务端点尚未配置。');
  }

  let url: URL;
  try {
    url = new URL(value, origin);
  } catch {
    throw new ApiClientError('AI_API_INVALID_CONFIG', 'AI 服务端点配置无效。');
  }

  if (
    (url.protocol !== 'https:' && url.protocol !== 'http:') ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.protocol === 'http:' && !isLocalHostname(url.hostname))
  ) {
    throw new ApiClientError('AI_API_INVALID_CONFIG', 'AI 服务端点配置无效。');
  }

  url.pathname = `${url.pathname.replace(/\/+$/, '')}/`;
  return url;
};

export const getConfiguredApiBase = () =>
  resolveApiBase(import.meta.env.VITE_AI_API_BASE_URL);

export const getAiServiceStatus = (): { configured: boolean; message: string } => {
  try {
    getConfiguredApiBase();
    return { configured: true, message: '服务端点已配置，尚未验证连接。' };
  } catch (error) {
    if (error instanceof ApiClientError) {
      return { configured: false, message: error.message };
    }
    return { configured: false, message: 'AI 服务端点配置无效。' };
  }
};

const isApiFailure = (value: unknown): value is ApiFailure => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ApiFailure>;
  return candidate.ok === false
    && typeof candidate.error?.code === 'string'
    && typeof candidate.error.message === 'string'
    && typeof candidate.error.retryable === 'boolean';
};

const isApiSuccess = <T>(value: unknown): value is ApiSuccess<T> =>
  Boolean(value && typeof value === 'object' && (value as Partial<ApiSuccess<T>>).ok === true && 'data' in value);

const readBoundedResponse = async (response: Response): Promise<string> => {
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
    await response.body?.cancel().catch(() => undefined);
    throw new ApiClientError('AI_API_INVALID_RESPONSE', 'AI 服务响应过大。');
  }
  if (!response.body) return '';

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let body = '';
  let completed = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_RESPONSE_BYTES) {
        throw new ApiClientError('AI_API_INVALID_RESPONSE', 'AI 服务响应过大。');
      }
      body += decoder.decode(value, { stream: true });
    }
    completed = true;
    return body + decoder.decode();
  } finally {
    if (!completed) await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
};

export const postOperation = async <TInput, TOutput>(
  operation: AiOperation,
  input: TInput,
  options: RequestOptions = {},
): Promise<TOutput> => {
  if (!ALLOWED_OPERATIONS.includes(operation)) {
    throw new ApiClientError('AI_API_INVALID_INPUT', 'AI 操作不受支持。');
  }

  const baseUrl = getConfiguredApiBase();
  const endpoint = new URL(`v1/operations/${operation}`, baseUrl);
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  try {
    const response = await (options.fetchImpl ?? globalThis.fetch)(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
      body: JSON.stringify({ version: 1, input }),
      signal: controller.signal,
    });

    const body = await readBoundedResponse(response);

    let payload: unknown;
    try {
      payload = JSON.parse(body);
    } catch {
      throw new ApiClientError('AI_API_INVALID_RESPONSE', 'AI 服务返回了无效响应。');
    }

    if (isApiFailure(payload)) {
      throw new ApiClientError(
        'AI_API_REQUEST_FAILED',
        '暂时无法获取 AI 回复。',
        payload.error.retryable,
      );
    }
    if (!response.ok || !isApiSuccess<TOutput>(payload)) {
      throw new ApiClientError('AI_API_INVALID_RESPONSE', 'AI 服务返回了无效响应。');
    }

    return payload.data;
  } catch (error) {
    if (error instanceof ApiClientError) throw error;
    throw new ApiClientError(
      'AI_API_REQUEST_FAILED',
      '暂时无法连接 AI 服务。',
      true,
    );
  } finally {
    globalThis.clearTimeout(timeout);
  }
};
