import React, { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass' | 'interactive' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}) => {
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const variants = {
    default: 'bg-white border border-slate-200/80 shadow-card rounded-2xl',
    elevated: 'bg-white border border-slate-100 shadow-card-hover rounded-2xl',
    glass: 'glass-panel rounded-2xl',
    interactive: 'bg-white border border-slate-200/80 shadow-card rounded-2xl transition-all duration-300 hover:shadow-card-hover hover:border-slate-300 cursor-pointer hover:-translate-y-0.5',
    bordered: 'bg-white border-2 border-slate-200 rounded-2xl'
  };

  return (
    <div className={`${variants[variant]} ${paddings[padding]} ${className}`} {...props}>
      {children}
    </div>
  );
};
