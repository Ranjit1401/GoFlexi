import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { mockDestinations } from '../../data/destinations';
import { DestinationCard } from '../../components/traveler/DestinationCard';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Destination } from '../../types/traveler';
import { Search, SlidersHorizontal, CheckCircle2, X, MapPin } from 'lucide-react';
import { getDestinationImage } from '../../utils/placeImages';

export const TravelerExplorePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedBudget, setSelectedBudget] = useState<string>('All');
  const [selectedStyle, setSelectedStyle] = useState<string>('All');
  const [selectedExperience, setSelectedExperience] = useState<string>('All');
  const [selectedDuration, setSelectedDuration] = useState<string>('All');
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);

  // Filter options
  const budgetOptions = ['All', 'Under ₹30k', '₹30k – ₹50k', '₹50k+'];
  const styleOptions = ['All', 'Budget', 'Balanced', 'Premium', 'Luxury'];
  const experienceOptions = ['All', 'Adventure', 'Relaxation', 'Culture', 'Nature', 'Beaches'];
  const durationOptions = ['All', 'Short (3-4 Days)', 'Medium (5-6 Days)', 'Long (7+ Days)'];

  // Filtered logic
  const filteredDestinations = useMemo(() => {
    return mockDestinations.filter((dest) => {
      // Search term
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = dest.name.toLowerCase().includes(query);
        const matchesDesc = dest.description.toLowerCase().includes(query);
        const matchesTags = dest.tags.some((t) => t.toLowerCase().includes(query));
        if (!matchesName && !matchesDesc && !matchesTags) return false;
      }

      // Budget filter
      if (selectedBudget === 'Under ₹30k' && !dest.estimatedBudget.includes('₹22') && !dest.estimatedBudget.includes('₹26') && !dest.estimatedBudget.includes('₹28')) {
        return false;
      }
      if (selectedBudget === '₹50k+' && !dest.estimatedBudget.includes('₹60') && !dest.estimatedBudget.includes('₹75') && !dest.estimatedBudget.includes('₹85')) {
        return false;
      }

      // Travel Style filter
      if (selectedStyle !== 'All' && !dest.travelStyle.includes(selectedStyle)) {
        return false;
      }

      // Experience filter
      if (selectedExperience !== 'All' && !dest.tags.includes(selectedExperience)) {
        return false;
      }

      // Duration filter
      if (selectedDuration === 'Short (3-4 Days)' && dest.durationDays > 4) return false;
      if (selectedDuration === 'Medium (5-6 Days)' && (dest.durationDays < 5 || dest.durationDays > 6)) return false;
      if (selectedDuration === 'Long (7+ Days)' && dest.durationDays < 7) return false;

      return true;
    });
  }, [searchQuery, selectedBudget, selectedStyle, selectedExperience, selectedDuration]);

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
            placeholder="Search destinations..."
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
            <span>Showing {filteredDestinations.length} of {mockDestinations.length} destinations</span>
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

      {/* Destinations Grid */}
      {filteredDestinations.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
          <MapPin className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No destinations match your filters.</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-6">
            Try adjusting your budget, style, or search terms to uncover more journeys.
          </p>
          <Button variant="secondary" onClick={clearFilters} className="rounded-xl">
            Clear all filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredDestinations.map((destination) => (
            <DestinationCard
              key={destination.id}
              destination={destination}
              onExplore={(d) => setSelectedDestination(d)}
            />
          ))}
        </div>
      )}

      {/* Destination Quick Preview Modal */}
      {selectedDestination && (
        <Modal
          isOpen={Boolean(selectedDestination)}
          onClose={() => setSelectedDestination(null)}
          title={selectedDestination.name}
          subtitle={selectedDestination.tagline}
          maxWidth="lg"
        >
          <div className="space-y-5">
            <div className="rounded-2xl overflow-hidden aspect-[16/9] relative bg-slate-100">
              <img
                src={selectedDestination.imageUrl || getDestinationImage(selectedDestination.name)}
                alt={selectedDestination.name}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = getDestinationImage(selectedDestination.name);
                }}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold text-slate-800 shadow">
                Est. {selectedDestination.estimatedBudget}
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              {selectedDestination.description}
            </p>

            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Highlighted Experiences
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {selectedDestination.highlightExperiences?.map((exp, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{exp}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Best season: <span className="font-semibold text-slate-800">{selectedDestination.bestSeason}</span>
              </div>
              <Button
                variant="primary"
                onClick={() => {
                  const dest = selectedDestination;
                  setSelectedDestination(null);
                  navigate(`/user/trips/new?dest=${encodeURIComponent(dest.name)}`);
                }}
                className="rounded-xl"
              >
                Plan Trip to {selectedDestination.name}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
