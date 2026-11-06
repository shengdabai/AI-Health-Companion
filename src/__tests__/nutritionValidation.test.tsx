import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HealthNutritionPage from '@/pages/HealthNutritionPage';

afterEach(cleanup);

function fillProfile(age: string, height: string, weight: string) {
  render(<MemoryRouter><HealthNutritionPage /></MemoryRouter>);
  fireEvent.change(screen.getByPlaceholderText('请输入年龄'), { target: { value: age } });
  fireEvent.change(screen.getByPlaceholderText('请输入身高'), { target: { value: height } });
  fireEvent.change(screen.getByPlaceholderText('请输入体重'), { target: { value: weight } });
  return screen.getByRole('button', { name: '下一步' });
}

describe('nutrition profile validation (synthetic inputs only)', () => {
  it.each([
    ['0', '170', '65'], ['121', '170', '65'], ['30.5', '170', '65'],
    ['30', '99', '65'], ['30', '251', '65'],
    ['30', '170', '29'], ['30', '170', '301'], ['', '170', '65'],
  ])('blocks inputs outside the existing form limits: %s/%s/%s', (age, height, weight) => {
    expect(fillProfile(age, height, weight)).toBeDisabled();
  });

  it.each([['30', '170', '65.5'], ['1', '100', '30'], ['120', '250', '300']])(
    'accepts inputs within the existing form limits: %s/%s/%s', (age, height, weight) => {
      const next = fillProfile(age, height, weight);
      expect(next).toBeEnabled();
      fireEvent.click(next);
      expect(screen.getByRole('heading', { name: '健康目标' })).toBeInTheDocument();
    },
  );

  it('associates numeric inputs and gender with their visible labels', () => {
    fillProfile('30', '170', '65');
    expect(screen.getByRole('spinbutton', { name: '年龄 *' })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: '身高 (cm) *' })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: '体重 (kg) *' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '性别 *' })).toBeInTheDocument();
  });
});
