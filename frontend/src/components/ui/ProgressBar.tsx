import React from 'react';

export interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  label?: string;
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps,
  label,
  showPercentage = true
}) => {
  const percentage = Math.min(100, Math.round((currentStep / totalSteps) * 100));

  return (
    <div className="w-full">
      <div className="flex justify-between items-center text-xs font-semibold text-slate-600 mb-2">
        <span>{label || `Step ${currentStep} of ${totalSteps}`}</span>
        {showPercentage && <span className="text-brand-600">{percentage}%</span>}
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-navy-700 via-brand-500 to-brand-400 h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
