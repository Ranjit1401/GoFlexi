import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  SlidersHorizontal,
  Compass,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  getExploreRecommendations,
  RecommendationItem,
  ExploreFilterParams,
} from '../../services/recommendations';
import { getDestinationStates } from '../../services/destinations';
import { ExploreSearchBar } from '../../components/traveler/explore/ExploreSearchBar';
import { ExperienceSelector } from '../../components/traveler/explore/ExperienceSelector';
import { ActiveFilterChips, ActiveFilterItem } from '../../components/traveler/explore/ActiveFilterChips';
import { ExploreSort, SortOption } from '../../components/traveler/explore/ExploreSort';
import { ExploreFilters, FilterState } from '../../components/traveler/explore/ExploreFilters';
import { DestinationExploreCard } from '../../components/traveler/explore/DestinationExploreCard';
import { DestinationDetailModal } from '../../components/traveler/explore/DestinationDetailModal';

export const TravelerExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Primary Search Bar State
  const [searchTerm, setSearchTerm] = useState<string>(searchParams.get('search') || '');
  const [travelDate, setTravelDate] = useState<string>(searchParams.get('date') || '');

  // Sidebar & Explore Filter State
  const [filterState, setFilterState] = useState<FilterState>({
    search: searchParams.get('q') || '',
    travelStyle: searchParams.get('style') || '',
    companions: searchParams.get('companions') ? searchParams.get('companions')!.split(',') : [],
    transport: searchParams.get('transport') ? searchParams.get('transport')!.split(',') : [],
    pace: searchParams.get('pace') || '',
    budgetRange: searchParams.get('budget') || '',
    places: searchParams.get('places') ? searchParams.get('places')!.split(',') : [],
    experiences: searchParams.get('experiences') ? searchParams.get('experiences')!.split(',') : [],
    state: searchParams.get('state') || '',
  });

  // Sorting & Modal State
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get('sort') as SortOption) || 'recommended'
  );
  const [selectedDestinationModal, setSelectedDestinationModal] = useState<RecommendationItem | null>(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState<boolean>(false);

  // Data fetching state
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load distinct Indian states from Neon KB on mount
  useEffect(() => {
    let isMounted = true;
    getDestinationStates()
      .then((states) => {
        if (isMounted) setAvailableStates(states);
      })
      .catch((err) => {
        console.error('Failed to load destination states:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch recommendations from Backend Engine
  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const activeSearch = searchTerm.trim() || filterState.search.trim();

      const params: ExploreFilterParams = {
        limit: 30,
        search: activeSearch || undefined,
        travel_date: travelDate || undefined,
        places: filterState.places.length > 0 ? filterState.places : undefined,
        experiences: filterState.experiences.length > 0 ? filterState.experiences : undefined,
        travel_style: filterState.travelStyle || undefined,
        companions: filterState.companions.length > 0 ? filterState.companions : undefined,
        transport: filterState.transport.length > 0 ? filterState.transport : undefined,
        pace: filterState.pace || undefined,
        budget_range: filterState.budgetRange || undefined,
        state: filterState.state || undefined,
        sort_by: sortBy,
      };

      const response = await getExploreRecommendations(params);
      setRecommendations(response.recommendations || []);
      setTotalCount(response.total || (response.recommendations ? response.recommendations.length : 0));
    } catch (err: any) {
      console.error('Error fetching explore recommendations:', err);
      setError('Unable to load destination recommendations. Please check your connection or try again.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, travelDate, filterState, sortBy]);

  // Trigger search on mount and when filter criteria change
  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Synchronize URL query params non-destructively
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (travelDate) params.set('date', travelDate);
    if (filterState.search) params.set('q', filterState.search);
    if (filterState.travelStyle) params.set('style', filterState.travelStyle);
    if (filterState.companions.length) params.set('companions', filterState.companions.join(','));
    if (filterState.transport.length) params.set('transport', filterState.transport.join(','));
    if (filterState.pace) params.set('pace', filterState.pace);
    if (filterState.budgetRange) params.set('budget', filterState.budgetRange);
    if (filterState.places.length) params.set('places', filterState.places.join(','));
    if (filterState.experiences.length) params.set('experiences', filterState.experiences.join(','));
    if (filterState.state) params.set('state', filterState.state);
    if (sortBy !== 'recommended') params.set('sort', sortBy);

    setSearchParams(params, { replace: true });
  }, [searchTerm, travelDate, filterState, sortBy, setSearchParams]);

  // Handlers for Top Search Bar
  const handleTopSearchSubmit = () => {
    fetchRecommendations();
  };

  // Handlers for Experience Horizontal Selector
  const handleToggleExperience = (expId: string) => {
    setFilterState((prev) => {
      const exists = prev.experiences.includes(expId);
      const updated = exists
        ? prev.experiences.filter((e) => e !== expId)
        : [...prev.experiences, expId];
      return { ...prev, experiences: updated };
    });
  };

  // Handlers for Sidebar Filters
  const handleFilterChange = (partial: Partial<FilterState>) => {
    setFilterState((prev) => ({ ...prev, ...partial }));
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setTravelDate('');
    setFilterState({
      search: '',
      travelStyle: '',
      companions: [],
      transport: [],
      pace: '',
      budgetRange: '',
      places: [],
      experiences: [],
      state: '',
    });
    setSortBy('recommended');
  };

  // Convert active filters to chips
  const activeChips = useMemo<ActiveFilterItem[]>(() => {
    const chips: ActiveFilterItem[] = [];

    if (searchTerm) {
      chips.push({ id: 'top-search', category: 'search', label: `"${searchTerm}"`, value: searchTerm });
    }
    if (travelDate) {
      chips.push({ id: 'travel-date', category: 'date', label: `Date: ${travelDate}`, value: travelDate });
    }
    if (filterState.search) {
      chips.push({ id: 'side-search', category: 'search', label: `Keyword: "${filterState.search}"`, value: filterState.search });
    }
    if (filterState.budgetRange) {
      chips.push({ id: 'budget', category: 'budget', label: filterState.budgetRange, value: filterState.budgetRange });
    }
    filterState.places.forEach((p) => {
      chips.push({ id: `place-${p}`, category: 'places', label: p, value: p });
    });
    filterState.experiences.forEach((e) => {
      chips.push({ id: `exp-${e}`, category: 'experiences', label: e, value: e });
    });
    if (filterState.travelStyle) {
      chips.push({ id: 'style', category: 'travelStyle', label: filterState.travelStyle, value: filterState.travelStyle });
    }
    filterState.companions.forEach((c) => {
      chips.push({ id: `comp-${c}`, category: 'companions', label: c, value: c });
    });
    filterState.transport.forEach((t) => {
      chips.push({ id: `trans-${t}`, category: 'transport', label: t, value: t });
    });
    if (filterState.pace) {
      chips.push({ id: 'pace', category: 'pace', label: `${filterState.pace} Pace`, value: filterState.pace });
    }
    if (filterState.state) {
      chips.push({ id: 'state', category: 'state', label: filterState.state, value: filterState.state });
    }

    return chips;
  }, [searchTerm, travelDate, filterState]);

  const handleRemoveChip = (chip: ActiveFilterItem) => {
    if (chip.id === 'top-search') {
      setSearchTerm('');
    } else if (chip.id === 'travel-date') {
      setTravelDate('');
    } else if (chip.id === 'side-search') {
      setFilterState((prev) => ({ ...prev, search: '' }));
    } else if (chip.category === 'budget') {
      setFilterState((prev) => ({ ...prev, budgetRange: '' }));
    } else if (chip.category === 'places') {
      setFilterState((prev) => ({ ...prev, places: prev.places.filter((p) => p !== chip.value) }));
    } else if (chip.category === 'experiences') {
      setFilterState((prev) => ({ ...prev, experiences: prev.experiences.filter((e) => e !== chip.value) }));
    } else if (chip.category === 'travelStyle') {
      setFilterState((prev) => ({ ...prev, travelStyle: '' }));
    } else if (chip.category === 'companions') {
      setFilterState((prev) => ({ ...prev, companions: prev.companions.filter((c) => c !== chip.value) }));
    } else if (chip.category === 'transport') {
      setFilterState((prev) => ({ ...prev, transport: prev.transport.filter((t) => t !== chip.value) }));
    } else if (chip.category === 'pace') {
      setFilterState((prev) => ({ ...prev, pace: '' }));
    } else if (chip.category === 'state') {
      setFilterState((prev) => ({ ...prev, state: '' }));
    }
  };

  const handlePlanTrip = (dest: RecommendationItem) => {
    navigate(`/user/copilot?destination=${encodeURIComponent(dest.name)}`);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Voyara Discovery Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
          Explore Destinations
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1 max-w-3xl">
          Discover hand-crafted destinations personalized to your travel persona and instant search intent.
        </p>
      </div>

      {/* Top Unified Search Bar */}
      <ExploreSearchBar
        searchTerm={searchTerm}
        travelDate={travelDate}
        onSearchChange={setSearchTerm}
        onDateChange={setTravelDate}
        onSearchSubmit={handleTopSearchSubmit}
      />

      {/* Horizontal Experience Selector */}
      <ExperienceSelector
        selectedExperiences={filterState.experiences}
        onToggleExperience={handleToggleExperience}
      />

      {/* Mobile Filter Toggle Button */}
      <div className="lg:hidden flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
        <button
          type="button"
          onClick={() => setIsMobileFiltersOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 font-semibold text-xs rounded-lg border border-indigo-200"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Refine Filters ({activeChips.length})</span>
        </button>

        <span className="text-xs text-slate-500 font-medium">
          {totalCount} results
        </span>
      </div>

      {/* Two Column Discovery Workspace: Left Filters + Right Results */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Left Sticky Filters Sidebar */}
        <ExploreFilters
          filters={filterState}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          availableStates={availableStates}
          isMobileOpen={isMobileFiltersOpen}
          onCloseMobile={() => setIsMobileFiltersOpen(false)}
        />

        {/* Right Main Results Area */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          {/* Active Chips & Sort Bar */}
          <div className="space-y-3">
            <ExploreSort
              sortBy={sortBy}
              onChangeSort={setSortBy}
              totalCount={totalCount}
            />

            <ActiveFilterChips
              activeFilters={activeChips}
              onRemoveFilter={handleRemoveChip}
              onClearAll={handleResetFilters}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={fetchRecommendations}
                className="flex items-center gap-1 px-3 py-1 bg-white border border-rose-200 text-rose-700 font-semibold rounded-lg hover:bg-rose-100 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 animate-pulse"
                >
                  <div className="h-40 bg-slate-200 rounded-xl" />
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded-sm w-3/4" />
                    <div className="h-3 bg-slate-100 rounded-sm w-1/2" />
                  </div>
                  <div className="h-12 bg-slate-50 rounded-lg" />
                  <div className="flex gap-2">
                    <div className="h-8 bg-slate-200 rounded-xl flex-1" />
                    <div className="h-8 bg-slate-200 rounded-xl flex-1" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Zero Results State */}
          {!isLoading && !error && recommendations.length === 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-8 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <Compass className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                No matching destinations found
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
                We couldn't find destinations matching your exact filter combinations. Try loosening some filters or broadening your search parameters.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Destination Cards Grid */}
          {!isLoading && !error && recommendations.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {recommendations.map((dest) => (
                <DestinationExploreCard
                  key={dest.destination_id}
                  destination={dest}
                  onViewDetails={setSelectedDestinationModal}
                  onPlanTrip={handlePlanTrip}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Destination Detail Quick View Modal */}
      <DestinationDetailModal
        destination={selectedDestinationModal}
        onClose={() => setSelectedDestinationModal(null)}
        onPlanTrip={(dest) => {
          setSelectedDestinationModal(null);
          handlePlanTrip(dest);
        }}
      />
    </div>
  );
};
