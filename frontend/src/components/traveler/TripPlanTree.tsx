import React, { useState } from 'react';
import {
  Plane,
  Building2,
  Calendar,
  Compass,
  Utensils,
  MapPin,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
  Sun,
  SunMedium,
  Moon,
  Trash2,
  ListPlus
} from 'lucide-react';
import { TripPlan, TripPlanNode, TripLocation, DiscoveredPlace } from '../../types/trip-planner';

interface TripPlanTreeProps {
  destination?: string;
  selectedPlaces?: DiscoveredPlace[];
  plan: TripPlan | null;
  selectedLocation: TripLocation | null;
  onSelectLocation: (location: TripLocation) => void;
  onRemovePlace?: (place: DiscoveredPlace) => void;
  onCreateItineraryRequest?: () => void;
  isLoading?: boolean;
}

export const TripPlanTree: React.FC<TripPlanTreeProps> = ({
  destination = 'Choose destination',
  selectedPlaces = [],
  plan,
  selectedLocation,
  onSelectLocation,
  onRemovePlace,
  onCreateItineraryRequest,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<'places' | 'itinerary' | 'hotels' | 'transport'>(
    plan ? 'itinerary' : 'places'
  );
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | 'all'>('all');
  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>({});

  const toggleDayCollapse = (dayKey: string) => {
    setCollapsedDays((prev) => ({
      ...prev,
      [dayKey]: !prev[dayKey],
    }));
  };

  const getTimeBlockIcon = (block?: string) => {
    switch (block?.toLowerCase()) {
      case 'morning':
        return <Sun className="w-3.5 h-3.5 text-amber-400" />;
      case 'afternoon':
        return <SunMedium className="w-3.5 h-3.5 text-sky-400" />;
      case 'evening':
        return <Moon className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getTimeBlockBadge = (block?: string) => {
    switch (block?.toLowerCase()) {
      case 'morning':
        return 'bg-amber-950/40 text-amber-300 border-amber-800/40';
      case 'afternoon':
        return 'bg-sky-950/40 text-sky-300 border-sky-800/40';
      case 'evening':
        return 'bg-indigo-950/40 text-indigo-300 border-indigo-800/40';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-4 bg-slate-900 border-r border-slate-800">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <Sparkles className="w-5 h-5 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-200">Assembling GoFlexi Itinerary</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-[220px]">
            Organizing your selected places and verifying 3D flight routes...
          </p>
        </div>
      </div>
    );
  }

  // Extract day nodes, hotel nodes, and transport nodes if plan exists
  const dayNodes = plan ? plan.nodes.filter((n) => n.type === 'day') : [];
  const hotelNodes = plan ? plan.nodes.filter((n) => n.type === 'hotel' || n.type === 'accommodation') : [];
  const transportNodes = plan ? plan.nodes.filter((n) => n.type === 'flight' || n.type === 'transport') : [];

  const visibleDays = selectedDayFilter === 'all'
    ? dayNodes
    : dayNodes.filter((_, idx) => idx + 1 === selectedDayFilter);

  const displayDestination = plan?.destination || destination || 'Choose destination';

  return (
    <div className="h-full flex flex-col bg-slate-900 border-r border-slate-800 select-none">
      {/* Panel Top Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-900/95 backdrop-blur flex-shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white tracking-wide uppercase">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>GoFlexi Trip Plan</span>
          </div>

          <div className="text-[11px] font-semibold text-indigo-400 px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40">
            {displayDestination}
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-1 mt-2.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
          <button
            type="button"
            onClick={() => setActiveTab('places')}
            className={`flex-1 py-1 rounded-lg text-[11px] font-medium transition-colors text-center ${
              activeTab === 'places'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Selected ({selectedPlaces.length})
          </button>

          {plan && (
            <button
              type="button"
              onClick={() => setActiveTab('itinerary')}
              className={`flex-1 py-1 rounded-lg text-[11px] font-medium transition-colors text-center ${
                activeTab === 'itinerary'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Itinerary
            </button>
          )}

          {plan && hotelNodes.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('hotels')}
              className={`flex-1 py-1 rounded-lg text-[11px] font-medium transition-colors text-center ${
                activeTab === 'hotels'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Stays
            </button>
          )}

          {plan && transportNodes.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('transport')}
              className={`flex-1 py-1 rounded-lg text-[11px] font-medium transition-colors text-center ${
                activeTab === 'transport'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Transit
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Selected Places List (Section 11) */}
      {activeTab === 'places' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
              Selected Places
            </span>
            <span className="text-[11px] text-slate-500">
              {selectedPlaces.length} added
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
            {selectedPlaces.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-slate-500">
                <Compass className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs font-medium text-slate-400">No places selected yet.</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
                  Places you add to your trip from the assistant will appear here.
                </p>
              </div>
            ) : (
              selectedPlaces.map((place, idx) => {
                const isSelected = selectedLocation?.name.toLowerCase() === place.name.toLowerCase();
                return (
                  <div
                    key={idx}
                    onClick={() =>
                      onSelectLocation({
                        id: place.poi_id || `loc_${idx}`,
                        name: place.name,
                        type: 'activity',
                        latitude: place.latitude,
                        longitude: place.longitude,
                        description: place.description,
                        preview_image: place.image_url
                      })
                    }
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-white truncate">
                          {place.name}
                        </div>
                        {place.description && (
                          <div className="text-[10px] text-slate-400 line-clamp-1">
                            {place.description}
                          </div>
                        )}
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                          {place.latitude.toFixed(2)}°N, {place.longitude.toFixed(2)}°E
                        </div>
                      </div>
                    </div>

                    {onRemovePlace && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemovePlace(place);
                        }}
                        title="Remove from trip"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Action: Create Itinerary from Selected Places */}
          {selectedPlaces.length > 0 && onCreateItineraryRequest && (
            <div className="p-3 border-t border-slate-800 bg-slate-900/90">
              <button
                type="button"
                onClick={onCreateItineraryRequest}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/30 transition-all hover:scale-[1.01]"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                <span>Create Itinerary from Selected Places</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Day-by-Day Itinerary (Only active when an itinerary is generated) */}
      {activeTab === 'itinerary' && plan && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Day Filter Pills */}
          <div className="p-2.5 border-b border-slate-800/60 bg-slate-900 flex items-center gap-1.5 overflow-x-auto flex-shrink-0 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedDayFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                selectedDayFilter === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              All Days ({plan.duration_days})
            </button>
            {dayNodes.map((_, idx) => {
              const dayNum = idx + 1;
              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => setSelectedDayFilter(dayNum)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                    selectedDayFilter === dayNum
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Day {dayNum}
                </button>
              );
            })}
          </div>

          {/* Day Nodes Tree */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3.5 custom-scrollbar">
            {visibleDays.map((dayNode, dayIdx) => {
              const dayKey = `day_${dayIdx}`;
              const isCollapsed = collapsedDays[dayKey];

              return (
                <div key={dayNode.id} className="rounded-xl border border-slate-800 bg-slate-800/40 overflow-hidden">
                  <div
                    onClick={() => toggleDayCollapse(dayKey)}
                    className="p-2.5 bg-slate-800/80 hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs text-white font-semibold transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>{dayNode.title}</span>
                    </div>
                    {isCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>

                  {!isCollapsed && dayNode.children && (
                    <div className="p-2.5 space-y-2">
                      {dayNode.children.map((act) => {
                        const isSelected = selectedLocation?.name.toLowerCase() === act.title.toLowerCase();
                        return (
                          <div
                            key={act.id}
                            onClick={() =>
                              act.location && onSelectLocation(act.location)
                            }
                            className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-sm'
                                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1.5 mb-1">
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded border font-medium flex items-center gap-1 ${getTimeBlockBadge(
                                  act.time_block
                                )}`}
                              >
                                {getTimeBlockIcon(act.time_block)}
                                <span className="capitalize">{act.time_block || 'Activity'}</span>
                              </span>
                              {act.time && (
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {act.time}
                                </span>
                              )}
                            </div>
                            <div className="font-semibold text-white truncate">{act.title}</div>
                            {act.subtitle && (
                              <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                {act.subtitle}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Accommodations / Hotels */}
      {activeTab === 'hotels' && plan && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
          {hotelNodes.map((hotel) => (
            <div
              key={hotel.id}
              onClick={() => hotel.location && onSelectLocation(hotel.location)}
              className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 text-xs text-white cursor-pointer hover:border-indigo-500 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1 text-amber-400">
                <Building2 className="w-4 h-4" />
                <span className="font-semibold">{hotel.title}</span>
              </div>
              <p className="text-[11px] text-slate-400">{hotel.subtitle}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Transport / Flights */}
      {activeTab === 'transport' && plan && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
          {transportNodes.map((trans) => (
            <div
              key={trans.id}
              onClick={() => trans.location && onSelectLocation(trans.location)}
              className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 text-xs text-white cursor-pointer hover:border-indigo-500 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1 text-sky-400">
                <Plane className="w-4 h-4" />
                <span className="font-semibold">{trans.title}</span>
              </div>
              <p className="text-[11px] text-slate-400">{trans.subtitle}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TripPlanTree;
