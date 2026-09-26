import React from 'react';
import { X, RotateCcw } from 'lucide-react';

export interface ActiveFilterItem {
  id: string;
  category: string;
  label: string;
  value: string;
}

interface ActiveFilterChipsProps {
  activeFilters: ActiveFilterItem[];
  onRemoveFilter: (filter: ActiveFilterItem) => void;
  onClearAll: () => void;
}

export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  activeFilters,
  onRemoveFilter,
  onClearAll,
}) => {
  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      <span className="text-xs font-medium text-slate-500 mr-1">Active Filters:</span>

      {activeFilters.map((filter) => (
        <span
          key={`${filter.category}-${filter.value}`}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-xs hover:bg-indigo-100 transition-colors"
        >
          <span>{filter.label}</span>
          <button
            type="button"
            onClick={() => onRemoveFilter(filter)}
            className="p-0.5 rounded-full hover:bg-indigo-200/80 text-indigo-600 transition-colors cursor-pointer"
            title={`Remove ${filter.label}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      ))}

      <button
        type="button"
        onClick={onClearAll}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-all cursor-pointer ml-1"
        title="Clear all active filters"
      >
        <RotateCcw className="w-3 h-3" />
        <span>Clear All</span>
      </button>
    </div>
  );
};
