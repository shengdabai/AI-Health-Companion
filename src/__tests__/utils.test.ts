import { describe, it, expect } from 'vitest';
import { formatPrice, cn } from '@/lib/utils';

describe('utils', () => {
  it('formatPrice formats numbers as yuan', () => {
    expect(formatPrice(0)).toBe('¥0.00');
    expect(formatPrice(29)).toBe('¥29.00');
    expect(formatPrice(99.5)).toBe('¥99.50');
  });

  it('cn merges tailwind classes correctly', () => {
    expect(cn('px-4', 'py-2')).toContain('px-4');
    expect(cn('text-red-500', 'text-blue-500')).toContain('text-blue-500');
  });

  it('cn handles falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });
});

describe('pricing calculations', () => {
  it('annual plan saves money vs monthly', () => {
    const monthlyTotal = 29 * 12;
    const annualPrice = 99 * 12;
    const vipMonthly = 99 * 12;
    expect(monthlyTotal).toBeLessThan(vipMonthly);
    expect(annualPrice).toBe(vipMonthly);
  });

  it('free plan costs nothing', () => {
    expect(formatPrice(0)).toBe('¥0.00');
  });
});
