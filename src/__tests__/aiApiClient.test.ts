import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ApiClientError,
  getAiServiceStatus,
  postOperation,
  resolveApiBase,
} from '@/services/aiApiClient';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('AI API client boundary', () => {
  it('fails before fetch when the public endpoint is not configured', async () => {
    vi.stubEnv('VITE_AI_API_BASE_URL', '');
    const fetchMock = vi.fn();

    await expect(postOperation('health-chat', { question: '睡眠' }, { fetchImpl: fetchMock }))
      .rejects.toMatchObject({ code: 'AI_API_UNCONFIGURED' });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getAiServiceStatus()).toEqual({
      configured: false,
      message: 'AI 服务端点尚未配置。',
    });
  });

  it('rejects credentials, fragments, and remote plaintext endpoints in every mode', () => {
    expect(() => resolveApiBase('https://user:pass@example.com/api'))
      .toThrowError(ApiClientError);
    expect(() => resolveApiBase('https://example.com/api#debug'))
      .toThrowError(ApiClientError);
    expect(() => resolveApiBase('http://example.com/api', 'http://localhost:5174'))
      .toThrowError(ApiClientError);
    expect(resolveApiBase('http://127.0.0.1:8787/api').toString())
      .toBe('http://127.0.0.1:8787/api/');
  });

  it('sends only the versioned operation input to the fixed path', async () => {
    vi.stubEnv('VITE_AI_API_BASE_URL', 'https://api.example.com/ai');
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({
      ok: true,
      data: { answer: '保持规律作息。', confidence: 0.8, suggestions: [] },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const result = await postOperation(
      'health-chat',
      { question: '怎样改善睡眠？' },
      { fetchImpl: fetchMock },
    );

    expect(result).toMatchObject({ answer: '保持规律作息。' });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(init).toBeDefined();
    if (!init) throw new Error('request init missing');
    expect(String(url)).toBe('https://api.example.com/ai/v1/operations/health-chat');
    expect(init.credentials).toBe('omit');
    expect(JSON.parse(String(init.body))).toEqual({
      version: 1,
      input: { question: '怎样改善睡眠？' },
    });
    expect(String(init.body)).not.toMatch(/provider|model|api.?key/i);
  });

  it('rejects provider failures and malformed success payloads', async () => {
    vi.stubEnv('VITE_AI_API_BASE_URL', '/api/ai');
    const providerFailure = vi.fn(async () => new Response(JSON.stringify({
      ok: false,
      error: { code: 'SERVICE_UNAVAILABLE', message: 'internal detail', retryable: true },
    }), { status: 503 }));
    await expect(postOperation('health-chat', { question: '运动' }, { fetchImpl: providerFailure }))
      .rejects.toMatchObject({ code: 'AI_API_REQUEST_FAILED', retryable: true });

    const malformed = vi.fn(async () => new Response('{"ok":true}', { status: 200 }));
    await expect(postOperation('health-chat', { question: '运动' }, { fetchImpl: malformed }))
      .rejects.toMatchObject({ code: 'AI_API_INVALID_RESPONSE' });

    const oversized = vi.fn(async () => new Response('x', {
      status: 200,
      headers: { 'Content-Length': '64001' },
    }));
    await expect(postOperation('health-chat', { question: '运动' }, { fetchImpl: oversized }))
      .rejects.toMatchObject({ code: 'AI_API_INVALID_RESPONSE' });
  });
});
