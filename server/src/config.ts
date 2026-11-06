export type ServerConfig = {
  enabled: boolean;
  host: '127.0.0.1' | '::1';
  port: number;
  allowedHosts: ReadonlySet<string>;
  allowedOrigins: ReadonlySet<string>;
  maxBodyBytes: number;
  maxConcurrent: number;
  requestsPerMinute: number;
  providerTimeoutMs: number;
  liveMaxMs: number;
  liveMessagesPerSecond: number;
  liveInputBytes: number;
  liveOutputBytes: number;
  anthropicKey?: string;
  anthropicModel?: string;
  geminiKey?: string;
  geminiModel?: string;
  geminiTtsModel?: string;
  geminiLiveModel?: string;
};

const integer = (value: string | undefined, fallback: number, min: number, max: number, name: string) => {
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) throw new Error(`${name} is invalid`);
  return parsed;
};
const optional = (value: string | undefined, max: number, name: string) => {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > max || /[\x00-\x1f\x7f]/.test(trimmed)) throw new Error(`${name} is invalid`);
  return trimmed;
};
const localOrigin = (raw: string): string => {
  const url = new URL(raw);
  if (url.protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('AI_ALLOWED_ORIGINS must contain exact loopback HTTP origins');
  return url.origin;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const hostValue = env.AI_HOST?.trim() || '127.0.0.1';
  if (hostValue !== '127.0.0.1' && hostValue !== '::1') throw new Error('AI_HOST must be a loopback address');
  const port = integer(env.AI_PORT, 8787, 1024, 65535, 'AI_PORT');
  const originValues = (env.AI_ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174').split(',').map(value => value.trim()).filter(Boolean);
  if (originValues.length === 0 || originValues.length > 32) throw new Error('AI_ALLOWED_ORIGINS is invalid');
  const allowedOrigins = new Set(originValues.map(localOrigin));
  const allowedHosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`, `[::1]:${port}`]);
  return {
    enabled: env.AI_SERVICE_ENABLED === 'true',
    host: hostValue,
    port,
    allowedHosts,
    allowedOrigins,
    maxBodyBytes: integer(env.AI_MAX_BODY_BYTES, 12_000_000, 1024, 12_000_000, 'AI_MAX_BODY_BYTES'),
    maxConcurrent: integer(env.AI_MAX_CONCURRENT, 4, 1, 16, 'AI_MAX_CONCURRENT'),
    requestsPerMinute: integer(env.AI_REQUESTS_PER_MINUTE, 20, 1, 120, 'AI_REQUESTS_PER_MINUTE'),
    providerTimeoutMs: integer(env.AI_PROVIDER_TIMEOUT_MS, 25_000, 1000, 120_000, 'AI_PROVIDER_TIMEOUT_MS'),
    liveMaxMs: integer(env.AI_LIVE_MAX_MS, 600_000, 10_000, 1_800_000, 'AI_LIVE_MAX_MS'),
    liveMessagesPerSecond: integer(env.AI_LIVE_MESSAGES_PER_SECOND, 30, 1, 60, 'AI_LIVE_MESSAGES_PER_SECOND'),
    liveInputBytes: integer(env.AI_LIVE_INPUT_BYTES, 20_000_000, 64_000, 100_000_000, 'AI_LIVE_INPUT_BYTES'),
    liveOutputBytes: integer(env.AI_LIVE_OUTPUT_BYTES, 20_000_000, 64_000, 100_000_000, 'AI_LIVE_OUTPUT_BYTES'),
    anthropicKey: optional(env.ANTHROPIC_API_KEY, 512, 'ANTHROPIC_API_KEY'),
    anthropicModel: optional(env.ANTHROPIC_MODEL, 200, 'ANTHROPIC_MODEL'),
    geminiKey: optional(env.GEMINI_API_KEY, 512, 'GEMINI_API_KEY'),
    geminiModel: optional(env.GEMINI_MODEL, 200, 'GEMINI_MODEL'),
    geminiTtsModel: optional(env.GEMINI_TTS_MODEL, 200, 'GEMINI_TTS_MODEL'),
    geminiLiveModel: optional(env.GEMINI_LIVE_MODEL, 200, 'GEMINI_LIVE_MODEL'),
  };
}

export function providerReady(config: ServerConfig, provider: 'anthropic' | 'gemini', mode: 'json' | 'text' | 'audio' | 'live'): boolean {
  if (!config.enabled) return false;
  if (provider === 'anthropic') return Boolean(config.anthropicKey && config.anthropicModel);
  if (!config.geminiKey) return false;
  if (mode === 'audio') return Boolean(config.geminiTtsModel);
  if (mode === 'live') return Boolean(config.geminiLiveModel);
  return Boolean(config.geminiModel);
}
