import React from 'react';
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> { children: React.ReactNode; }
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className || ''}`} {...props}>{children}</div>
  )
);
Card.displayName = 'Card';
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> { children: React.ReactNode; }
export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={`p-6 ${className || ''}`} {...props}>{children}</div>
  )
);
CardContent.displayName = 'CardContent';
