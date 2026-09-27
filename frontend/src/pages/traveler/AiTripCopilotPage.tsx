import React, { useState } from 'react';
import {
  Sparkles,
  Bookmark,
  Check,
  RotateCcw,
  Compass,
  ArrowRight,
  Calendar,
  Wallet,
  Users,
  MapPin,
  ChevronDown,
  Layers,
  Plane
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TripPlan, TripLocation, CopilotChatMessage, DiscoveredPlace } from '../../types/trip-planner';
import { sendCopilotChat } from '../../services/trip-planner';
import { TripPlanTree } from '../../components/traveler/TripPlanTree';
import { TripGlobe } from '../../components/traveler/TripGlobe';
import { AiTripAssistant } from '../../components/traveler/AiTripAssistant';

const POPULAR_DESTINATIONS = ['Jaipur', 'Goa', 'Manali', 'Srinagar', 'Udaipur', 'Kerala'];
const DURATION_OPTIONS = [
  { label: '3 Days', days: 3 },
  { label: '4 Days', days: 4 },
  { label: '5 Days', days: 5 },
  { label: '7 Days', days: 7 }
];
const TRAVELER_OPTIONS = [
  { label: 'Solo (1)', count: 1 },
  { label: 'Couple (2)', count: 2 },
  { label: 'Family (4)', count: 4 },
  { label: 'Group (6)', count: 6 }
];
const BUDGET_OPTIONS = ['Budget-Friendly', 'Balanced Comfort', 'Luxury Heritage'];

export const AiTripCopilotPage: React.FC = () => {
  const { user } = useAuth();

  // Authoritative Shared Trip State
  const [selectedPlaces, setSelectedPlaces] = useState<DiscoveredPlace[]>([]);
  const [tripPlan, setTripPlan] = useState<TripPlan | null>(null);
  const [locations, setLocations] = useState<TripLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<TripLocation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Top Header Context Filter State
  const [destinationQuery, setDestinationQuery] = useState<string>('Jaipur');
  const [selectedDuration, setSelectedDuration] = useState<number>(3);
  const [travelersCount, setTravelersCount] = useState<number>(2);
  const [budgetTier, setBudgetTier] = useState<string>('Balanced Comfort');

  // Popover menus state
  const [activeMenu, setActiveMenu] = useState<'where' | 'when' | 'who' | 'budget' | null>(null);

  // Chat message thread state
  const [messages, setMessages] = useState<CopilotChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'assistant',
      text: "Welcome to GoFlexi AI Trip Co-Pilot! 🌍\n\nI'm your real-time travel planning assistant powered by Groq LLM and GoFlexi's verified destination database. Ask me to discover destinations, explore verified places, add them to your trip, and build an itinerary when you're ready.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        'I want to visit Jaipur',
        'What can I do in Jaipur?',
        'Where should I go?',
        'Explore beaches in Goa'
      ]
    },
  ]);

  const handleSendMessage = async (userPrompt: string) => {
    const userMsg: CopilotChatMessage = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      text: userPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);
    setIsSaved(false);

    try {
      const response = await sendCopilotChat({
        message: userPrompt,
        trip_id: tripPlan?.id,
        trip_state: tripPlan,
        selected_places: selectedPlaces,
        trip_context: {
          destinations: [destinationQuery],
          travelers: travelersCount,
        }
      });

      // Synchronize Selected Places
      if (response.selected_places !== undefined) {
        setSelectedPlaces(response.selected_places);
      }

      // Synchronize 3D Globe Locations
      if (response.locations && response.locations.length > 0) {
        setLocations(response.locations);
        const defaultLoc =
          response.locations.find((l) => l.type === 'destination') ||
          response.locations[0] ||
          null;
        setSelectedLocation(defaultLoc);
      }

      // Synchronize Authoritative Trip Plan state (only if itinerary was created/modified)
      if (response.trip_plan) {
        setTripPlan(response.trip_plan);
        if (response.trip_plan.destination) {
          setDestinationQuery(response.trip_plan.destination);
        }
        if (response.trip_plan.duration_days) {
          setSelectedDuration(response.trip_plan.duration_days);
        }
      }

      // Add Assistant Message with Discovered Places & Suggested Actions
      const assistantMsg: CopilotChatMessage = {
        id: `msg_a_${Date.now()}`,
        sender: 'assistant',
        text: response.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        places: response.places || [],
        suggestedActions: response.suggested_actions || [],
        plan: response.trip_plan || undefined,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorDetail =
        err.response?.data?.detail?.message ||
        err.response?.data?.detail ||
        err.message ||
        'GoFlexi AI is temporarily unavailable. Please try again.';
      setError(errorDetail);

      const errorMsg: CopilotChatMessage = {
        id: `msg_err_${Date.now()}`,
        sender: 'assistant',
        text: `Notice: ${errorDetail}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPlace = (place: DiscoveredPlace) => {
    handleSendMessage(`Add ${place.name} to my trip`);
  };

  const handleRemovePlace = (place: DiscoveredPlace) => {
    handleSendMessage(`Remove ${place.name}`);
  };

  const handleCreateItinerary = () => {
    handleSendMessage(`Create a ${selectedDuration}-day itinerary from these places`);
  };

  const handleSelectLocation = (loc: TripLocation) => {
    setSelectedLocation(loc);
  };

  const handleSaveTrip = () => {
    if (!tripPlan && selectedPlaces.length === 0) {
      handleSendMessage(`I want to visit ${destinationQuery}`);
      return;
    }
    if (!tripPlan) {
      handleSendMessage(`Create a ${selectedDuration}-day itinerary from these places`);
      return;
    }
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 4000);
  };

  const handleReset = () => {
    setTripPlan(null);
    setSelectedPlaces([]);
    setLocations([]);
    setSelectedLocation(null);
    setError(null);
    setIsSaved(false);
    setMessages([
      {
        id: `msg_reset_${Date.now()}`,
        sender: 'assistant',
        text: "Workspace reset. Where would you like to plan your next journey?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: [
          'I want to visit Jaipur',
          'Explore beaches in Goa',
          '5-day adventure in Manali',
          'Where should I go?'
        ]
      },
    ]);
  };

  const applyHeaderFilter = (filterType: 'where' | 'when' | 'who' | 'budget', val: any) => {
    setActiveMenu(null);
    if (filterType === 'where') {
      setDestinationQuery(val);
      handleSendMessage(`I want to visit ${val}`);
    } else if (filterType === 'when') {
      setSelectedDuration(val);
      if (tripPlan) {
        handleSendMessage(`Adjust this trip to ${val} days with a balanced itinerary.`);
      } else {
        handleSendMessage(`I want to plan a ${val}-day trip to ${destinationQuery}.`);
      }
    } else if (filterType === 'who') {
      setTravelersCount(val);
      if (tripPlan) {
        handleSendMessage(`Update itinerary for ${val} travelers.`);
      }
    } else if (filterType === 'budget') {
      setBudgetTier(val);
      if (tripPlan) {
        handleSendMessage(`Recalculate trip pacing for a ${val.toLowerCase()} budget.`);
      }
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* Top Header / Context Navigation Bar */}
      <header className="h-16 px-4 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 flex items-center justify-between flex-shrink-0 z-30">
        {/* Brand & Workspace Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-white leading-none">
                GoFlexi Trip Planning
              </h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/60 font-semibold tracking-wide uppercase">
                AI Co-Pilot
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
              Conversational destination discovery & 3D visual route engine
            </p>
          </div>
        </div>

        {/* Structured Trip Context Controls: [Where] [When] [Who] [Budget] */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-2xl p-1 shadow-inner relative">
          {/* [Where] Button & Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveMenu(activeMenu === 'where' ? null : 'where')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-800/80 text-xs transition-colors text-slate-200"
            >
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              <div className="text-left leading-tight">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold block">Where</span>
                <span className="font-semibold text-white truncate max-w-[90px]">
                  {tripPlan?.destination || destinationQuery}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {activeMenu === 'where' && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1 border-b border-slate-800">
                  Select Destination
                </div>
                {POPULAR_DESTINATIONS.map((dest) => (
                  <button
                    key={dest}
                    type="button"
                    onClick={() => applyHeaderFilter('where', dest)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-indigo-600/30 text-slate-200 hover:text-white transition-colors flex items-center justify-between"
                  >
                    <span>{dest}</span>
                    {destinationQuery === dest && <Check className="w-3 h-3 text-indigo-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-6 w-[1px] bg-slate-800" />

          {/* [When] Button & Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveMenu(activeMenu === 'when' ? null : 'when')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-800/80 text-xs transition-colors text-slate-200"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <div className="text-left leading-tight">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold block">When</span>
                <span className="font-semibold text-white">
                  {tripPlan ? `${tripPlan.duration_days} Days` : `${selectedDuration} Days`}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {activeMenu === 'when' && (
              <div className="absolute top-full left-0 mt-2 w-40 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1 border-b border-slate-800">
                  Trip Duration
                </div>
                {DURATION_OPTIONS.map((item) => (
                  <button
                    key={item.days}
                    type="button"
                    onClick={() => applyHeaderFilter('when', item.days)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-amber-500/20 text-slate-200 hover:text-white transition-colors flex items-center justify-between"
                  >
                    <span>{item.label}</span>
                    {selectedDuration === item.days && <Check className="w-3 h-3 text-amber-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-6 w-[1px] bg-slate-800" />

          {/* [Who] Button & Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveMenu(activeMenu === 'who' ? null : 'who')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-800/80 text-xs transition-colors text-slate-200"
            >
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <div className="text-left leading-tight">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold block">Who</span>
                <span className="font-semibold text-white">
                  {travelersCount} Traveler{travelersCount > 1 ? 's' : ''}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {activeMenu === 'who' && (
              <div className="absolute top-full left-0 mt-2 w-44 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1 border-b border-slate-800">
                  Party Size
                </div>
                {TRAVELER_OPTIONS.map((item) => (
                  <button
                    key={item.count}
                    type="button"
                    onClick={() => applyHeaderFilter('who', item.count)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-sky-500/20 text-slate-200 hover:text-white transition-colors flex items-center justify-between"
                  >
                    <span>{item.label}</span>
                    {travelersCount === item.count && <Check className="w-3 h-3 text-sky-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-6 w-[1px] bg-slate-800" />

          {/* [Budget] Button & Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveMenu(activeMenu === 'budget' ? null : 'budget')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-800/80 text-xs transition-colors text-slate-200"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <div className="text-left leading-tight">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold block">Budget</span>
                <span className="font-semibold text-white truncate max-w-[90px]">
                  {tripPlan?.estimated_budget || budgetTier}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {activeMenu === 'budget' && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1 border-b border-slate-800">
                  Budget Style
                </div>
                {BUDGET_OPTIONS.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => applyHeaderFilter('budget', style)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-emerald-500/20 text-slate-200 hover:text-white transition-colors flex items-center justify-between"
                  >
                    <span>{style}</span>
                    {budgetTier === style && <Check className="w-3 h-3 text-emerald-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Controls: Reset & Save Trip */}
        <div className="flex items-center gap-2">
          {(tripPlan || selectedPlaces.length > 0) && (
            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveTrip}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md ${
              isSaved
                ? 'bg-slate-800 text-slate-200 border border-slate-600 shadow-none'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/40 hover:scale-[1.02]'
            }`}
            title={tripPlan ? "Trip state active in current session (cloud persistence coming in future phase)" : "Plan your trip"}
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Saved in Session</span>
              </>
            ) : tripPlan ? (
              <>
                <Bookmark className="w-4 h-4" />
                <span>Save to Session</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Plan Trip</span>
              </>
            )}
          </button>

          {/* Traveler Avatar */}
          {user && (
            <div className="ml-1 pl-2 border-l border-slate-800 hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200 shadow-inner">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 3-Panel Mindtrip-Inspired Planning Workspace */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* LEFT PANEL (~24%): Authoritative Structured Selected Places & Itinerary Tree */}
        <div className="w-[310px] xl:w-[350px] flex-shrink-0 h-full overflow-hidden border-r border-slate-800">
          <TripPlanTree
            destination={destinationQuery}
            selectedPlaces={selectedPlaces}
            plan={tripPlan}
            selectedLocation={selectedLocation}
            onSelectLocation={handleSelectLocation}
            onRemovePlace={handleRemovePlace}
            onCreateItineraryRequest={handleCreateItinerary}
            isLoading={isLoading}
          />
        </div>

        {/* CENTER PANEL (~50%): Existing Interactive 3D Globe & Route Map */}
        <div className="flex-1 h-full relative overflow-hidden bg-slate-950">
          <TripGlobe
            locations={locations.length > 0 ? locations : (tripPlan?.locations || [])}
            routes={tripPlan?.routes || []}
            selectedLocation={selectedLocation}
            onSelectLocation={handleSelectLocation}
          />
        </div>

        {/* RIGHT PANEL (~26%): Real Groq Conversational AI Assistant */}
        <div className="w-[330px] xl:w-[390px] flex-shrink-0 h-full overflow-hidden">
          <AiTripAssistant
            messages={messages}
            onSendMessage={handleSendMessage}
            onAddPlace={handleAddPlace}
            selectedPlaces={selectedPlaces}
            isLoading={isLoading}
            error={error}
            onRetry={() => handleSendMessage(messages[messages.length - 1]?.text || 'I want to visit Jaipur')}
          />
        </div>
      </div>
    </div>
  );
};

export default AiTripCopilotPage;
