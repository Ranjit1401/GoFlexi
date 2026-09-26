import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { mockTrips } from '../../data/trips';
import { RecommendationCard } from '../../components/traveler/RecommendationCard';
import { TripCard } from '../../components/traveler/TripCard';
import { DraggableCopilotWidget } from '../../components/traveler/DraggableCopilotWidget';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Trip } from '../../types/traveler';
import {
  RecommendationItem,
  getRecommendations,
  getCachedRecommendations,
} from '../../services/recommendations';
import {
  Sparkles,
  Sliders,
  PlusCircle,
  Search,
  ArrowRight,
  MapPin,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Compass,
} from 'lucide-react';

export const TravelerDashboardPage: React.FC = () => {
  const { user, preferences } = useAuth();
  const navigate = useNavigate();

  const [recommendations, setRecommendations] = useState<RecommendationItem[]>(() =>
    getCachedRecommendations()
  );
  const [loadingRecommendations, setLoadingRecommendations] = useState<boolean>(() =>
    getCachedRecommendations().length === 0
  );
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<RecommendationItem | null>(null);

  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [quickDestinationInput, setQuickDestinationInput] = useState('');

  // Upcoming trips (includes Goa Escape)
  const upcomingTrips = mockTrips.filter((t) => t.status === 'Upcoming');

  const fetchRecommendations = useCallback(async (forceRefresh: boolean = false) => {
    const cached = getCachedRecommendations();
    if (cached.length === 0 || forceRefresh) {
      setLoadingRecommendations(true);
    }
    setRecommendationError(null);
    try {
      const data = await getRecommendations(8, forceRefresh);
      setRecommendations(data.recommendations);
    } catch {
      if (cached.length === 0) {
        setRecommendationError('Unable to load personalized recommendations right now.');
      }
    } finally {
      setLoadingRecommendations(false);
    }
  }, []);

  useEffect(() => {
    if (getCachedRecommendations().length === 0) {
      fetchRecommendations(false);
    }
  }, [fetchRecommendations]);

  const handleQuickCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickDestinationInput.trim()) {
      navigate(`/user/trips/new?dest=${encodeURIComponent(quickDestinationInput.trim())}`);
    } else {
      navigate('/user/trips/new');
    }
  };

  return (
    <div className="space-y-10 pb-12">
      {/* Top Greeting & Headline */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Traveler Overview
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
            Good morning, {user?.name || 'Explorer'}
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            Ready to plan your next journey? Your preferences are tuned for seamless travel.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/user/trips/new')}
          className="rounded-xl shadow-md bg-navy-900 hover:bg-navy-800"
          icon={<PlusCircle className="w-4 h-4" />}
        >
          <span>Create New Trip</span>
        </Button>
      </div>

      {/* Grid: Search/Create Card + Profile Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Large search/create card (8 cols) */}
        <div className="lg:col-span-8 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl flex flex-col justify-between">
          <div className="absolute right-0 top-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <Badge variant="accent" className="bg-brand-500/20 text-brand-300 border-brand-500/30 mb-3">
              Dynamic Itinerary Builder
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
              Where do you want to go?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mb-6 leading-relaxed">
              Tell us your target destination. We'll harmonize your preferred travel pace, companion setup, and budget limit.
            </p>
          </div>

          <form onSubmit={handleQuickCreate} className="relative z-10 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter destination (e.g. Goa, Manali, Kerala)..."
                value={quickDestinationInput}
                onChange={(e) => setQuickDestinationInput(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 backdrop-blur-md transition-all"
              />
            </div>
            <Button
              type="submit"
              variant="accent"
              size="lg"
              className="rounded-2xl px-6 bg-brand-500 hover:bg-brand-400 text-white font-bold"
            >
              <span>Create Trip</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>
        </div>

        {/* Small Card: Profile Summary (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Profile Summary</span>
              <Badge variant="success" size="sm">Active</Badge>
            </div>

            <h3 className="text-lg font-bold text-navy-950 mb-1">Your Travel Style</h3>
            <p className="text-xs text-slate-500 mb-4">
              Curated from your personal onboarding selections:
            </p>

            {/* Badges based on onboarding */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              <Badge variant="neutral" className="bg-brand-50 text-brand-700 border-brand-200">
                {preferences?.travelStyle || 'Balanced'}
              </Badge>
              <Badge variant="neutral" className="bg-purple-50 text-purple-700 border-purple-200">
                {preferences?.companions || 'Couple'}
              </Badge>
              <Badge variant="neutral" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                {preferences?.pacing || 'Balanced'} Pace
              </Badge>
              {preferences?.experiences?.slice(0, 2).map((exp) => (
                <Badge key={exp} variant="neutral" className="bg-slate-100 text-slate-700 border-slate-200">
                  {exp}
                </Badge>
              ))}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100">
              <span className="font-semibold text-slate-800">Budget Tier:</span> {preferences?.budgetRange || '₹25,000 – ₹50,000'}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/user/onboarding')}
              className="w-full justify-center rounded-xl"
              icon={<Sliders className="w-3.5 h-3.5" />}
            >
              <span>Edit Preferences</span>
            </Button>
          </div>
        </div>
      </div>

      {/* SECTION: RECOMMENDED FOR YOU (Real Recommendation Engine) */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-600 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personalized Matching</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-navy-950">
              Recommended for You
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Personalized destinations tailored directly to your landscapes, experiences, and travel style.
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/user/explore')}
            className="text-brand-600 hover:text-brand-700 font-semibold"
          >
            <span>View All Destinations</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* LOADING STATE */}
        {loadingRecommendations && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden flex flex-col animate-pulse"
              >
                <div className="w-full aspect-[16/9] bg-slate-200 shrink-0" />
                <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                    <div className="h-3 bg-slate-200 rounded w-full" />
                    <div className="h-3 bg-slate-200 rounded w-4/5" />
                    <div className="h-10 bg-slate-100 rounded-xl mt-2.5" />
                  </div>
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between mt-auto">
                    <div className="space-y-1">
                      <div className="h-2.5 bg-slate-200 rounded w-12" />
                      <div className="h-3.5 bg-slate-200 rounded w-16" />
                    </div>
                    <div className="h-8 bg-slate-200 rounded-xl w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ERROR STATE */}
        {!loadingRecommendations && recommendationError && (
          <div className="bg-red-50/70 border border-red-200 rounded-3xl p-8 text-center space-y-3 shadow-sm">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-sm font-semibold text-red-900">{recommendationError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchRecommendations(true)}
              className="bg-white rounded-xl shadow-sm"
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              <span>Retry</span>
            </Button>
          </div>
        )}

        {/* EMPTY STATE: Incomplete Onboarding */}
        {!loadingRecommendations && !recommendationError && recommendations.length === 0 && (!preferences || preferences.attractions?.length === 0) && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
              <Compass className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-bold text-navy-950">
                Complete your travel preferences
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Tell us about your favorite landscapes, travel styles, and pace to unlock tailored destination recommendations.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/user/onboarding')}
              className="rounded-xl bg-navy-900 hover:bg-navy-800"
            >
              Complete Preferences
            </Button>
          </div>
        )}

        {/* EMPTY STATE: No Matching Destinations */}
        {!loadingRecommendations && !recommendationError && recommendations.length === 0 && preferences && preferences.attractions?.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
              <Compass className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-bold text-navy-950">
                No matching destinations found yet
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                We couldn't find a strong match for your current filters. Try adjusting your travel preferences.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/user/onboarding')}
              className="rounded-xl"
            >
              Edit Preferences
            </Button>
          </div>
        )}

        {/* REAL RECOMMENDATION CARDS */}
        {!loadingRecommendations && !recommendationError && recommendations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {recommendations.map((rec) => (
              <RecommendationCard
                key={rec.destination_id}
                recommendation={rec}
                onExplore={(r) => setSelectedRecommendation(r)}
              />
            ))}
          </div>
        )}
      </section>

      {/* SECTION: MY TRIPS (Upcoming Trips) */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-navy-950">
              Upcoming Trips
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Keep track of locked departures, day plans, and itinerary syncs.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/user/trips')}
            className="text-brand-600 hover:text-brand-700 font-semibold"
          >
            <span>View All Trips</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {upcomingTrips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 max-w-4xl">
            {upcomingTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onViewDetails={(t) => setSelectedTrip(t)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center space-y-3">
            <p className="text-sm text-slate-500">
              You haven't scheduled any upcoming journeys yet. Explore recommendations or build a custom route.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/user/trips/new')}
              className="rounded-xl"
            >
              Plan Your First Trip
            </Button>
          </div>
        )}
      </section>

      {/* Recommendation Detail Modal */}
      {selectedRecommendation && (
        <Modal
          isOpen={Boolean(selectedRecommendation)}
          onClose={() => setSelectedRecommendation(null)}
          title={selectedRecommendation.name}
          subtitle={`${selectedRecommendation.city}, ${selectedRecommendation.state} • ${selectedRecommendation.match_percentage}% Match`}
          maxWidth="lg"
        >
          <div className="space-y-5">
            <div className="p-4 bg-brand-50/50 rounded-2xl border border-brand-100/70 text-xs text-brand-900 leading-relaxed">
              <div className="font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 text-brand-700">
                <Sparkles className="w-3.5 h-3.5" />
                Why this destination was selected for you
              </div>
              <p className="italic text-slate-700 text-xs font-medium">"{selectedRecommendation.explanation}"</p>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              {selectedRecommendation.description || selectedRecommendation.short_description}
            </p>

            {/* Matched Attributes */}
            {selectedRecommendation.matched_preferences.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Matched Preferences
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedRecommendation.matched_preferences.map((pref) => (
                    <Badge
                      key={pref}
                      variant="neutral"
                      size="sm"
                      className="bg-brand-50 text-brand-700 border-brand-200"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 mr-1" />
                      {pref}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Relevant Destination Tags */}
            {selectedRecommendation.relevant_tags.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Destination Highlights
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedRecommendation.relevant_tags.map((tag) => (
                    <Badge key={tag} variant="neutral" size="sm" className="bg-slate-100 text-slate-700">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Est. Budget: <span className="font-bold text-slate-800">
                  {selectedRecommendation.budget_min > 0
                    ? `₹${(selectedRecommendation.budget_min / 1000).toFixed(0)}k – ₹${(selectedRecommendation.budget_max / 1000).toFixed(0)}k`
                    : 'Flexible'}
                </span>
              </div>
              <Button
                variant="primary"
                onClick={() => {
                  const rec = selectedRecommendation;
                  setSelectedRecommendation(null);
                  navigate(`/user/trips/new?dest=${encodeURIComponent(rec.name)}`);
                }}
                className="rounded-xl bg-navy-900 hover:bg-navy-800"
              >
                Plan Trip to {selectedRecommendation.name}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Trip Detail Modal */}
      {selectedTrip && (
        <Modal
          isOpen={Boolean(selectedTrip)}
          onClose={() => setSelectedTrip(null)}
          title={selectedTrip.title}
          subtitle={`${selectedTrip.destination} • ${selectedTrip.days} Days`}
          maxWidth="lg"
        >
          <div className="space-y-5">
            <div className="rounded-2xl overflow-hidden aspect-[16/9] relative">
              <img
                src={selectedTrip.imageUrl}
                alt={selectedTrip.destination}
                className="w-full h-full object-cover"
              />
              <Badge variant="success" className="absolute top-3 left-3 shadow">
                {selectedTrip.status}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Dates</span>
                <div className="text-xs font-bold text-slate-800 mt-0.5">{selectedTrip.startDate}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Travelers</span>
                <div className="text-xs font-bold text-slate-800 mt-0.5">{selectedTrip.travelersCount} Pax</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Budget</span>
                <div className="text-xs font-bold text-navy-950 mt-0.5">{selectedTrip.budget}</div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                Itinerary Summary
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedTrip.itinerarySummary}
              </p>
            </div>

            {selectedTrip.stops && (
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Key Stops & Activities
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTrip.stops.map((stop, i) => (
                    <Badge key={i} variant="neutral" className="bg-slate-100 text-slate-700">
                      <MapPin className="w-3 h-3 text-brand-500 mr-1" />
                      {stop}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button
                variant="secondary"
                onClick={() => setSelectedTrip(null)}
                className="rounded-xl"
              >
                Close Itinerary
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Floating Draggable AI Copilot Widget */}
      <DraggableCopilotWidget />
    </div>
  );
};
