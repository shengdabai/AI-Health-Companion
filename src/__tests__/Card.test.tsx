import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardContent } from '@/components/ui/Card';

describe('Card', () => {
  it('renders children correctly', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies base classes', () => {
    render(<Card data-testid="card">Content</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('bg-white', 'rounded-lg', 'border', 'border-gray-200', 'shadow-sm');
  });

  it('merges custom className', () => {
    render(<Card className="custom-class" data-testid="card">Content</Card>);
    expect(screen.getByTestId('card')).toHaveClass('custom-class', 'bg-white');
  });

  it('forwards ref', () => {
    const ref = vi.fn();
    render(<Card ref={ref}>Ref test</Card>);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement));
  });
});

describe('CardContent', () => {
  it('renders children with padding', () => {
    render(<CardContent data-testid="content">Inner</CardContent>);
    const el = screen.getByTestId('content');
    expect(el).toHaveClass('p-6');
    expect(el).toHaveTextContent('Inner');
  });

  it('merges custom className', () => {
    render(<CardContent className="extra-padding" data-testid="content">Inner</CardContent>);
    expect(screen.getByTestId('content')).toHaveClass('p-6', 'extra-padding');
  });
});
