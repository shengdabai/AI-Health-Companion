import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import HealthChatPage from '@/pages/HealthChatPage';
import { SettingsPage } from '@/pages/SettingsPage';

beforeEach(() => {
  vi.stubEnv('VITE_AI_API_BASE_URL', '');
  vi.stubGlobal('fetch', vi.fn());
  Element.prototype.scrollIntoView = vi.fn();
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('AI boundary UI', () => {
  it('shows the unconfigured state and labels local fallback content', async () => {
    const user = userEvent.setup();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(<MemoryRouter><HealthChatPage /></MemoryRouter>);

    expect(screen.getByText('AI 服务未配置')).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('请输入您的健康问题...'), '如何改善睡眠？');
    await user.click(screen.getByRole('button', { name: '发送健康问题' }));

    await waitFor(() => {
      expect(screen.getByText(/【离线规则资料】/)).toBeInTheDocument();
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('replaces key entry with read-only service status without storage writes', async () => {
    const user = userEvent.setup();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);

    await user.click(screen.getByRole('button', { name: /AI 服务/ }));
    expect(screen.getByText('端点未配置')).toBeInTheDocument();
    expect(screen.queryByText(/API Key/i)).not.toBeInTheDocument();
    expect(setItem).not.toHaveBeenCalled();
  });
});
