import React from 'react';
import { Search, Calendar, X } from 'lucide-react';

interface ExploreSearchBarProps {
  searchTerm: string;
  travelDate: string;
  onSearchChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onSearchSubmit: () => void;
}

export const ExploreSearchBar: React.FC<ExploreSearchBarProps> = ({
  searchTerm,
  travelDate,
  onSearchChange,
  onDateChange,
  onSearchSubmit,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearchSubmit();
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-lg border border-slate-200/80 p-2 sm:p-3 transition-all duration-200 hover:shadow-xl">
      <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3">
        {/* Destination / Activity Search */}
        <div className="relative flex-1 w-full flex items-center min-w-0 px-3 py-2 bg-slate-50 hover:bg-slate-100/80 focus-within:bg-white rounded-xl border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
          <Search className="w-5 h-5 text-indigo-500 shrink-0 mr-2.5" />
          <div className="flex-1 min-w-0">
            <label htmlFor="explore-search-input" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Where to?
            </label>
            <input
              id="explore-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Destination, city, state, or activity..."
              className="w-full bg-transparent text-slate-800 text-sm font-medium placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60"
              title="Clear destination"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Travel Date (Optional) */}
        <div className="relative w-full md:w-56 shrink-0 flex items-center px-3 py-2 bg-slate-50 hover:bg-slate-100/80 focus-within:bg-white rounded-xl border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
          <Calendar className="w-5 h-5 text-indigo-500 shrink-0 mr-2.5" />
          <div className="flex-1 min-w-0">
            <label htmlFor="explore-date-input" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Travel Date (Optional)
            </label>
            <input
              id="explore-date-input"
              type="date"
              value={travelDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full bg-transparent text-slate-800 text-sm font-medium focus:outline-none cursor-pointer"
            />
          </div>
          {travelDate && (
            <button
              type="button"
              onClick={() => onDateChange('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60"
              title="Clear date"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Submit Button */}
        <button
          type="button"
          onClick={onSearchSubmit}
          className="w-full md:w-auto px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-indigo-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <Search className="w-4 h-4" />
          <span>Search</span>
        </button>
      </div>
    </div>
  );
};
