import { afterEach, describe, expect, it, vi } from 'vitest';
import { askHealthQuestion } from '@/services/healthChatApi';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('health chat API contract', () => {
  it('returns a bounded valid response from the owned endpoint', async () => {
    vi.stubEnv('VITE_AI_API_BASE_URL', 'https://api.example.com/health');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      ok: true,
      data: {
        answer: '一般健康建议',
        confidence: 0.7,
        suggestions: ['下一个问题'],
      },
    }), { status: 200 })));

    await expect(askHealthQuestion('  如何休息？  ')).resolves.toEqual({
      answer: '一般健康建议',
      confidence: 0.7,
      suggestions: ['下一个问题'],
    });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('rejects oversized input without a network call', async () => {
    vi.stubEnv('VITE_AI_API_BASE_URL', 'https://api.example.com/health');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(askHealthQuestion('x'.repeat(2_001)))
      .rejects.toMatchObject({ code: 'AI_API_INVALID_INPUT' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects out-of-contract health responses', async () => {
    vi.stubEnv('VITE_AI_API_BASE_URL', 'https://api.example.com/health');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      ok: true,
      data: { answer: '', confidence: 9, suggestions: 'not-an-array' },
    }), { status: 200 })));

    await expect(askHealthQuestion('如何休息？'))
      .rejects.toMatchObject({ code: 'AI_API_INVALID_RESPONSE' });
  });
});
