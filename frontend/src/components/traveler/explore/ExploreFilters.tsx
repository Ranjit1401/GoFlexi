import React, { useState } from 'react';
import {
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  MapPin,
  Compass,
  Wallet,
  Users,
  Car,
  Clock,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

export interface FilterState {
  search: string;
  travelStyle: string;
  companions: string[];
  transport: string[];
  pace: string;
  budgetRange: string;
  places: string[];
  experiences: string[];
  state: string;
}

interface ExploreFiltersProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  availableStates: string[];
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const TRAVEL_STYLES = ['Budget', 'Balanced', 'Premium', 'Luxury'];
const COMPANIONS = ['Solo', 'Couple', 'Family', 'Friends'];
const TRANSPORTS = ['Flight', 'Train', 'Bus', 'Car', 'Flexible'];
const PACES = ['Relaxed', 'Balanced', 'Packed'];
const BUDGET_OPTIONS = [
  'Under ₹10k',
  '₹10k–₹25k',
  '₹25k–₹50k',
  '₹50k–₹1L',
  '₹1L+',
];
const PLACES = [
  'Mountains',
  'Beaches',
  'Nature',
  'Cities',
  'Historical',
  'Cultural',
  'Islands',
];
const EXPERIENCES = [
  'Adventure',
  'Food',
  'Nightlife',
  'Shopping',
  'Relaxation',
  'Wildlife',
  'Photography',
  'Culture',
  'Sports',
];

export const ExploreFilters: React.FC<ExploreFiltersProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  availableStates,
  isMobileOpen,
  onCloseMobile,
}) => {
  // Accordion collapsed state for dense viewing
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    search: false,
    places: false,
    experiences: false,
    budget: false,
    style: false,
    companions: false,
    transport: false,
    pace: false,
    state: false,
  });

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleArrayToggle = (category: 'companions' | 'transport' | 'places' | 'experiences', item: string) => {
    const current = filters[category];
    const exists = current.includes(item);
    const updated = exists ? current.filter((x) => x !== item) : [...current, item];
    onFilterChange({ [category]: updated });
  };

  const hasAnyFilterActive =
    Boolean(filters.search) ||
    Boolean(filters.travelStyle) ||
    filters.companions.length > 0 ||
    filters.transport.length > 0 ||
    Boolean(filters.pace) ||
    Boolean(filters.budgetRange) ||
    filters.places.length > 0 ||
    filters.experiences.length > 0 ||
    Boolean(filters.state);

  const content = (
    <div className="flex flex-col gap-5 p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-600" />
          <h2 className="font-bold text-sm text-slate-800 tracking-wide uppercase">
            Refine Your Search
          </h2>
        </div>
        {hasAnyFilterActive && (
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Filter 1: In-Sidebar Quick Search */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="sidebar-dest-search" className="text-xs font-bold text-slate-700 flex items-center justify-between">
          <span>Search Destinations</span>
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="sidebar-dest-search"
            type="text"
            placeholder="E.g. Manali, beaches..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Filter 2: Budget */}
      <div className="border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => toggleSection('budget')}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-slate-400" />
            <span>Budget</span>
            {filters.budgetRange && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
            )}
          </span>
          {collapsedSections.budget ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {!collapsedSections.budget && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {BUDGET_OPTIONS.map((opt) => {
              const active = filters.budgetRange === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onFilterChange({ budgetRange: active ? '' : opt })}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter 3: Places */}
      <div className="border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => toggleSection('places')}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>Places</span>
            {filters.places.length > 0 && (
              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 rounded-full">
                {filters.places.length}
              </span>
            )}
          </span>
          {collapsedSections.places ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {!collapsedSections.places && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {PLACES.map((place) => {
              const active = filters.places.includes(place);
              return (
                <button
                  key={place}
                  type="button"
                  onClick={() => handleArrayToggle('places', place)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {place}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter 4: Experiences */}
      <div className="border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => toggleSection('experiences')}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-slate-400" />
            <span>Experiences</span>
            {filters.experiences.length > 0 && (
              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 rounded-full">
                {filters.experiences.length}
              </span>
            )}
          </span>
          {collapsedSections.experiences ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {!collapsedSections.experiences && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {EXPERIENCES.map((exp) => {
              const active = filters.experiences.includes(exp);
              return (
                <button
                  key={exp}
                  type="button"
                  onClick={() => handleArrayToggle('experiences', exp)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {exp}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter 5: Travel Style */}
      <div className="border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => toggleSection('style')}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-slate-400" />
            <span>Travel Style</span>
            {filters.travelStyle && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
            )}
          </span>
          {collapsedSections.style ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {!collapsedSections.style && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {TRAVEL_STYLES.map((style) => {
              const active = filters.travelStyle === style;
              return (
                <button
                  key={style}
                  type="button"
                  onClick={() => onFilterChange({ travelStyle: active ? '' : style })}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {style}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter 6: Companions */}
      <div className="border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => toggleSection('companions')}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>Companions</span>
            {filters.companions.length > 0 && (
              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 rounded-full">
                {filters.companions.length}
              </span>
            )}
          </span>
          {collapsedSections.companions ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {!collapsedSections.companions && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {COMPANIONS.map((comp) => {
              const active = filters.companions.includes(comp);
              return (
                <button
                  key={comp}
                  type="button"
                  onClick={() => handleArrayToggle('companions', comp)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {comp}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter 7: Transport */}
      <div className="border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => toggleSection('transport')}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-slate-400" />
            <span>Transport</span>
            {filters.transport.length > 0 && (
              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 rounded-full">
                {filters.transport.length}
              </span>
            )}
          </span>
          {collapsedSections.transport ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {!collapsedSections.transport && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {TRANSPORTS.map((tr) => {
              const active = filters.transport.includes(tr);
              return (
                <button
                  key={tr}
                  type="button"
                  onClick={() => handleArrayToggle('transport', tr)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {tr}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter 8: Itinerary Pace */}
      <div className="border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => toggleSection('pace')}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Itinerary Pace</span>
            {filters.pace && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
            )}
          </span>
          {collapsedSections.pace ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {!collapsedSections.pace && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {PACES.map((p) => {
              const active = filters.pace === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onFilterChange({ pace: active ? '' : p })}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter 9: State (Indian State from real KB) */}
      <div className="border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => toggleSection('state')}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>State (India)</span>
            {filters.state && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
            )}
          </span>
          {collapsedSections.state ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {!collapsedSections.state && (
          <div className="mt-2.5">
            <select
              value={filters.state}
              onChange={(e) => onFilterChange({ state: e.target.value })}
              className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
            >
              <option value="">All States</option>
              {availableStates.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl overflow-y-auto p-4 flex flex-col z-10">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <span className="font-bold text-sm text-slate-800">Filters</span>
              <button
                type="button"
                onClick={onCloseMobile}
                className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
              >
                Close
              </button>
            </div>
            {content}
          </div>
        </div>
      )}
    </>
  );
};
