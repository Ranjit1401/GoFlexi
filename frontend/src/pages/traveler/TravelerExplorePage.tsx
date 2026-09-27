import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getDestinations, DestinationListItem } from '../../services/destinations';
import { DestinationCard } from '../../components/traveler/DestinationCard';
import { DestinationDetailModal } from '../../components/traveler/DestinationDetailModal';
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Destination } from '../../types/traveler';
import { Search, CheckCircle2, X, MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import { getDestinationImage } from '../../utils/placeImages';

interface EnhancedDestination extends Destination {
  rawBudgetMin: number;
  rawBudgetMax: number;
}

const mapItemToDestination = (item: DestinationListItem): EnhancedDestination => {
  const minBudget = item.budget_min || 15000;
  const maxBudget = item.budget_max || 45000;
  const rating = Number((4.3 + ((item.popularity_score || 8.0) % 0.6)).toFixed(1));
  const reviewsCount = Math.round((item.popularity_score || 8.0) * 80 + 35);
  const locationTag = [item.city, item.state].filter(Boolean).join(', ') || item.country || 'India';
  const allTags = Array.from(new Set([...(item.places || []), ...(item.experiences || [])]));

  return {
    id: item.id,
    name: item.name,
    tagline: locationTag,
    description: item.short_description || `Discover the beauty and attractions of ${item.name}.`,
    imageUrl: getDestinationImage(item.name),
    tags: allTags.length > 0 ? allTags : ['Travel', 'Explore'],
    estimatedBudget: `₹${minBudget.toLocaleString('en-IN')} – ₹${maxBudget.toLocaleString('en-IN')}`,
    rawBudgetMin: minBudget,
    rawBudgetMax: maxBudget,
    travelStyle: item.travel_styles && item.travel_styles.length > 0 ? item.travel_styles : ['Balanced'],
    durationDays: 4,
    highlightExperiences: item.experiences && item.experiences.length > 0 ? item.experiences : allTags.slice(0, 4),
    rating,
    reviewsCount,
    bestSeason: item.best_months && item.best_months.length > 0
      ? `Best Months: ${item.best_months.slice(0, 4).join(', ')}`
      : 'Oct - Mar',
  };
};

export const TravelerExplorePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') || '';

  const [destinations, setDestinations] = useState<EnhancedDestination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedBudget, setSelectedBudget] = useState<string>('All');
  const [selectedStyle, setSelectedStyle] = useState<string>('All');
  const [selectedExperience, setSelectedExperience] = useState<string>('All');
  const [selectedDuration, setSelectedDuration] = useState<string>('All');
  const [selectedDestination, setSelectedDestination] = useState<EnhancedDestination | null>(null);

  // Filter options
  const budgetOptions = ['All', 'Under ₹30k', '₹30k – ₹50k', '₹50k+'];
  const styleOptions = ['All', 'Budget', 'Balanced', 'Premium', 'Luxury'];
  const experienceOptions = ['All', 'Adventure', 'Relaxation', 'Culture', 'Nature', 'Beaches'];
  const durationOptions = ['All', 'Short (3-4 Days)', 'Medium (5-6 Days)', 'Long (7+ Days)'];

  const fetchDestinations = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await getDestinations({ size: 100 });
      const mapped = response.items.map(mapItemToDestination);
      setDestinations(mapped);
    } catch (err) {
      console.error('Failed to load destinations:', err);
      setErrorMessage('Unable to connect to destinations catalog. Please check your connection and retry.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]);

  // Filtered logic
  const filteredDestinations = useMemo(() => {
    return destinations.filter((dest) => {
      // Search term
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = dest.name.toLowerCase().includes(query);
        const matchesDesc = dest.description.toLowerCase().includes(query);
        const matchesTagline = dest.tagline.toLowerCase().includes(query);
        const matchesTags = dest.tags.some((t) => t.toLowerCase().includes(query));
        if (!matchesName && !matchesDesc && !matchesTagline && !matchesTags) return false;
      }

      // Budget filter based on actual numeric values
      if (selectedBudget === 'Under ₹30k' && dest.rawBudgetMin > 30000) {
        return false;
      }
      if (selectedBudget === '₹30k – ₹50k' && (dest.rawBudgetMax < 30000 || dest.rawBudgetMin > 50000)) {
        return false;
      }
      if (selectedBudget === '₹50k+' && dest.rawBudgetMax < 50000) {
        return false;
      }

      // Travel Style filter
      if (selectedStyle !== 'All' && !dest.travelStyle.some((s) => s.toLowerCase() === selectedStyle.toLowerCase())) {
        return false;
      }

      // Experience filter
      if (selectedExperience !== 'All' && !dest.tags.some((t) => t.toLowerCase() === selectedExperience.toLowerCase())) {
        return false;
      }

      // Duration filter
      if (selectedDuration === 'Short (3-4 Days)' && dest.durationDays > 4) return false;
      if (selectedDuration === 'Medium (5-6 Days)' && (dest.durationDays < 5 || dest.durationDays > 6)) return false;
      if (selectedDuration === 'Long (7+ Days)' && dest.durationDays < 7) return false;

      return true;
    });
  }, [destinations, searchQuery, selectedBudget, selectedStyle, selectedExperience, selectedDuration]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedBudget('All');
    setSelectedStyle('All');
    setSelectedExperience('All');
    setSelectedDuration('All');
  };

  const hasActiveFilters =
    searchQuery ||
    selectedBudget !== 'All' ||
    selectedStyle !== 'All' ||
    selectedExperience !== 'All' ||
    selectedDuration !== 'All';

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-1">
          Discovery Catalog
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
          Explore destinations
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1">
          Discover coastal beaches, alpine peaks, backwaters, and cultural havens curated for personalized itineraries.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search destinations by name, location, or attraction..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Budget */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Budget
            </label>
            <select
              value={selectedBudget}
              onChange={(e) => setSelectedBudget(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand-500"
            >
              {budgetOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Travel Style */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Travel Style
            </label>
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand-500"
            >
              {styleOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Experience */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Experience
            </label>
            <select
              value={selectedExperience}
              onChange={(e) => setSelectedExperience(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand-500"
            >
              {experienceOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Duration
            </label>
            <select
              value={selectedDuration}
              onChange={(e) => setSelectedDuration(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand-500"
            >
              {durationOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters Button if active */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>Showing {filteredDestinations.length} of {destinations.length} destinations</span>
            <button
              onClick={clearFilters}
              className="font-semibold text-brand-600 hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset all filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Content Area: Loading, Error, Empty, or Destinations Grid */}
      {isLoading ? (
        <LoadingState message="Discovering verified destinations from catalog..." />
      ) : errorMessage ? (
        <div className="bg-red-50/70 border border-red-200 rounded-3xl p-8 text-center max-w-lg mx-auto">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Unable to load destinations</h3>
          <p className="text-xs text-slate-600 mt-1 mb-5">{errorMessage}</p>
          <Button variant="primary" onClick={fetchDestinations} className="rounded-xl inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </Button>
        </div>
      ) : filteredDestinations.length === 0 ? (
        <EmptyState
          icon={<MapPin className="w-7 h-7 text-slate-400" />}
          title={hasActiveFilters ? "No destinations match your filters" : "No destinations available"}
          description={
            hasActiveFilters
              ? "Try adjusting your budget, style, or search terms to uncover more journeys."
              : "Check back soon for new curated destinations."
          }
          action={
            hasActiveFilters ? (
              <Button variant="secondary" onClick={clearFilters} className="rounded-xl">
                Clear all filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredDestinations.map((destination) => (
            <DestinationCard
              key={destination.id}
              destination={destination}
              onExplore={(d) => setSelectedDestination(d as EnhancedDestination)}
            />
          ))}
        </div>
      )}

      {/* Destination Big Screen Experience with Travel Blog & Pinterest-Style Related Places */}
      {selectedDestination && (
        <DestinationDetailModal
          destination={selectedDestination}
          onClose={() => setSelectedDestination(null)}
          onSelectDestination={(d) => setSelectedDestination(d as EnhancedDestination)}
        />
      )}
    </div>
  );
};
