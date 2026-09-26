import React from 'react';
import { ArrowUpDown } from 'lucide-react';

export type SortOption = 'recommended' | 'match_score' | 'popularity' | 'budget_asc' | 'budget_desc';

interface ExploreSortProps {
  sortBy: SortOption;
  onChangeSort: (sort: SortOption) => void;
  totalCount: number;
}

export const ExploreSort: React.FC<ExploreSortProps> = ({
  sortBy,
  onChangeSort,
  totalCount,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
      <div className="text-sm text-slate-600 font-medium">
        Showing <span className="font-bold text-slate-900">{totalCount}</span> {totalCount === 1 ? 'destination' : 'destinations'} curated for you
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        <label htmlFor="explore-sort-select" className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span>Sort By:</span>
        </label>
        <select
          id="explore-sort-select"
          value={sortBy}
          onChange={(e) => onChangeSort(e.target.value as SortOption)}
          className="text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer shadow-xs"
        >
          <option value="recommended">Best Recommended</option>
          <option value="match_score">Highest Match Score</option>
          <option value="popularity">Most Popular</option>
          <option value="budget_asc">Budget: Low to High</option>
          <option value="budget_desc">Budget: High to Low</option>
        </select>
      </div>
    </div>
  );
};
