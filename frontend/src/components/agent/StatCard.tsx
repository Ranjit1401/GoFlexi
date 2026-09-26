import React, { ReactNode } from 'react';
import { Card } from '../ui/Card';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  accentColor?: 'blue' | 'emerald' | 'amber' | 'purple';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon,
  trend,
  accentColor = 'blue'
}) => {
  const iconBgs = {
    blue: 'bg-brand-50 text-brand-600 border-brand-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100'
  };

  return (
    <Card className="hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
            {title}
          </span>
          <div className="text-3xl font-extrabold text-navy-950 tracking-tight">
            {value}
          </div>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs ${iconBgs[accentColor]}`}>
          {icon}
        </div>
      </div>

      {(subtext || trend) && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {subtext && <span className="text-slate-500 font-medium">{subtext}</span>}
          {trend && (
            <span
              className={`font-semibold ml-auto ${
                trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {trend.isPositive ? '+' : ''}{trend.value}
            </span>
          )}
        </div>
      )}
    </Card>
  );
};
