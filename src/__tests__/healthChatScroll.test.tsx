import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import HealthChatPage from '@/pages/HealthChatPage';

const scrollIntoView = vi.fn();
const scrollTo = vi.fn();

beforeEach(() => {
  vi.stubEnv('VITE_AI_API_BASE_URL', '');
  vi.stubGlobal('fetch', vi.fn());
  scrollIntoView.mockClear();
  scrollTo.mockClear();
  Element.prototype.scrollIntoView = scrollIntoView;
  Element.prototype.scrollTo = scrollTo as unknown as typeof Element.prototype.scrollTo;
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('chat scrolling', () => {
  it('does not scroll on first render and never scrolls the window via scrollIntoView', async () => {
    const user = userEvent.setup();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(<MemoryRouter><HealthChatPage /></MemoryRouter>);

    expect(scrollTo).not.toHaveBeenCalled();
    expect(scrollIntoView).not.toHaveBeenCalled();

    await user.type(screen.getByPlaceholderText('请输入您的健康问题...'), '如何改善睡眠？');
    await user.click(screen.getByRole('button', { name: '发送健康问题' }));

    await waitFor(() => {
      expect(screen.getByText(/【离线规则资料】/)).toBeInTheDocument();
    });
    expect(scrollTo).toHaveBeenCalled();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
