import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HealthNutritionPage from '@/pages/HealthNutritionPage';

afterEach(() => { cleanup(); vi.useRealTimers(); });

function openPreferences(gender = 'male') {
  render(<MemoryRouter><HealthNutritionPage /></MemoryRouter>);
  fireEvent.change(screen.getByLabelText('年龄 *'), { target: { value: '30' } });
  fireEvent.change(screen.getByLabelText('身高 (cm) *'), { target: { value: '170' } });
  fireEvent.change(screen.getByLabelText('体重 (kg) *'), { target: { value: '65' } });
  fireEvent.change(screen.getByLabelText('性别 *'), { target: { value: gender } });
  fireEvent.click(screen.getByRole('button', { name: '下一步' }));
  fireEvent.click(screen.getByRole('button', { name: /维持体重/ }));
  fireEvent.click(screen.getByRole('button', { name: '下一步' }));
}

it.each(['糖尿病', '严格素食', '牛奶'])(
  'blocks the unadapted sample menu for synthetic selection: %s', (selection) => {
    vi.useFakeTimers();
    openPreferences();
    fireEvent.click(screen.getByRole('button', { name: selection }));
    expect(screen.getByRole('alert')).toHaveTextContent('尚未适配');
    const generate = screen.getByRole('button', { name: '生成营养方案' });
    expect(generate).toBeDisabled();
    fireEvent.click(generate);
    expect(vi.getTimerCount()).toBe(0);
    expect(screen.queryByText('燕麦粥配蓝莓')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: selection }));
    expect(generate).toBeEnabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  },
);

it('does not substitute a female formula for the unsupported other option', () => {
  openPreferences('other');
  expect(screen.getByRole('alert')).toHaveTextContent('未实现所选性别');
  expect(screen.getByRole('button', { name: '生成营养方案' })).toBeDisabled();
});

it('labels the supported synthetic result as a fixed example', async () => {
  vi.useFakeTimers();
  openPreferences();
  fireEvent.click(screen.getByRole('button', { name: '生成营养方案' }));
  await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
  expect(screen.getByRole('heading', { name: '示例营养方案' })).toBeInTheDocument();
  expect(screen.getByText(/餐食为固定示例/)).toBeInTheDocument();
});
