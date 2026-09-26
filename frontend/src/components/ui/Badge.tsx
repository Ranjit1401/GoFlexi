import React, { HTMLAttributes } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'accent' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  ...props
}) => {
  const variants = {
    primary: 'bg-navy-50 text-navy-800 border-navy-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    accent: 'bg-brand-50 text-brand-700 border-brand-200',
    outline: 'bg-transparent text-slate-600 border-slate-300'
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 font-medium rounded-md border',
    md: 'text-xs px-2.5 py-1 font-medium rounded-lg border'
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
