import React from 'react';
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => {
    const variants: Record<string, string> = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-green-600 text-white hover:bg-green-700',
      outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
      ghost: 'text-gray-700 hover:bg-gray-100',
    };
    const sizes: Record<string, string> = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };
    const base = 'inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
    return (
      <button ref={ref} className={`${base} ${variants[variant]} ${sizes[size]} ${className || ''}`} {...props}>{children}</button>
    );
  }
);
Button.displayName = 'Button';
