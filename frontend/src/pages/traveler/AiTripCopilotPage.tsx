import React, { useState } from 'react';
import {
  Sparkles,
  Bookmark,
  Check,
  RotateCcw,
  Calendar,
  Wallet,
  Users,
  MapPin,
  ChevronDown,
  Car,
  Bike,
  TrainFront,
  BusFront,
  Plane,
  Truck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TripPlan, TripLocation, CopilotChatMessage, DiscoveredPlace } from '../../types/trip-planner';
import { sendCopilotChat } from '../../services/trip-planner';
import { createTrip } from '../../services/trips';
import { searchFlights, searchHotels } from '../../services/travel-search';
import { TripGlobe } from '../../components/traveler/TripGlobe';
import { AiTripAssistant } from '../../components/traveler/AiTripAssistant';

const DURATION_OPTIONS = [
  { label: '3 Days', days: 3 },
  { label: '4 Days', days: 4 },
  { label: '5 Days', days: 5 },
  { label: '7 Days', days: 7 },
];

const TRAVELER_OPTIONS = [
  { label: 'Solo (1)', count: 1 },
  { label: 'Couple (2)', count: 2 },
  { label: 'Family (4)', count: 4 },
  { label: 'Group (6)', count: 6 },
];

const BUDGET_OPTIONS = ['Budget-Friendly', 'Balanced Comfort', 'Luxury Heritage'];

const VEHICLES = [
  { label: 'Car', icon: Car },
  { label: 'Bike', icon: Bike },
  { label: 'Train', icon: TrainFront },
  { label: 'Bus', icon: BusFront },
  { label: 'Flight', icon: Plane },
  { label: 'Van', icon: Truck },
];

export const AiTripCopilotPage: React.FC = () => {
  const { user } = useAuth();

  const [selectedPlaces, setSelectedPlaces] = useState<DiscoveredPlace[]>([]);
  const [tripPlan, setTripPlan] = useState<TripPlan | null>(null);
  const [locations, setLocations] = useState<TripLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<TripLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const [destinationQuery, setDestinationQuery] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(3);
  const [travelersCount, setTravelersCount] = useState(1);
  const [budgetTier, setBudgetTier] = useState('');
  const [vehicle, setVehicle] = useState('Car');
  const [activeMenu, setActiveMenu] = useState<'where' | 'when' | 'who' | 'budget' | null>(null);

  const [messages, setMessages] = useState<CopilotChatMessage[]>([]);

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
          destinations: destinationQuery ? [destinationQuery] : undefined,
          travelers: travelersCount,
        },
      });

      let newDest = destinationQuery;

      if (response.trip_updates?.destination) {
        newDest = response.trip_updates.destination;
      } else if (response.trip_plan?.destination) {
        newDest = response.trip_plan.destination;
      } else {
        const destinationLocation = response.locations?.find((location) => location.type === 'destination');
        if (destinationLocation) newDest = destinationLocation.name;
      }

      if (newDest) setDestinationQuery(newDest);

      if (
        tripPlan?.destination &&
        newDest &&
        tripPlan.destination.toLowerCase() !== newDest.toLowerCase()
      ) {
        setTripPlan(null);
      }

      if (response.selected_places !== undefined) {
        setSelectedPlaces(response.selected_places);
      }

      if (response.locations?.length) {
        setLocations(response.locations);
        const latestPlace = response.locations[response.locations.length - 1];
        const destinationLocation =
          response.locations.find((location) => location.type === 'destination') || response.locations[0];
        setSelectedLocation(response.intent === 'ADD_PLACE' ? latestPlace : destinationLocation);
      } else if (response.intent === 'CASUAL_CHAT' && !newDest) {
        setLocations([]);
        setSelectedLocation(null);
      }

      if (response.trip_plan) {
        setTripPlan(response.trip_plan);
        if (response.trip_plan.duration_days) {
          setSelectedDuration(response.trip_plan.duration_days);
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `msg_a_${Date.now()}`,
          sender: 'assistant',
          text: response.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          places: response.places || [],
          suggestedActions: response.suggested_actions || [],
          plan: response.trip_plan || undefined,
        },
      ]);
    } catch (err: any) {
      const errorDetail =
        err.response?.data?.detail?.message ||
        err.response?.data?.detail ||
        err.message ||
        'GoFlexi AI is temporarily unavailable. Please try again.';

      setError(errorDetail);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          sender: 'assistant',
          text: `Notice: ${errorDetail}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
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


  const handleSaveTrip = async () => {
    if (!tripPlan && selectedPlaces.length === 0) {
      if (destinationQuery.trim()) {
        await handleSendMessage(`I want to visit ${destinationQuery.trim()}`);
      }
      return;
    }

    if (!tripPlan) {
      await handleSendMessage(`Create a ${selectedDuration}-day itinerary from these places`);
      return;
    }

    setIsSaved(true);
    const startDate =
      tripPlan.start_date ||
      new Date().toISOString().split('T')[0];

    const endDate =
      tripPlan.end_date ||
      new Date(Date.parse(startDate) + Math.max(1, tripPlan.duration_days - 1) * 86400000)
        .toISOString()
        .split('T')[0];

    let costBreakdown: { flights?: number; hotel?: number; total?: number } | undefined;

    try {
      const pricingTasks = await Promise.allSettled([
        tripPlan.origin
          ? searchFlights({
              origin: tripPlan.origin,
              destination: tripPlan.destination,
              depart_date: startDate,
              return_date: endDate,
              adults: travelersCount,
              currency: 'INR',
            })
          : Promise.reject(new Error('Trip origin is not available')),
        searchHotels({
          destination: tripPlan.destination,
          check_in: startDate,
          check_out: endDate,
          adults: travelersCount,
          rooms: Math.max(1, Math.ceil(travelersCount / 2)),
          currency: 'INR',
        }),
      ]);

      const flightResult = pricingTasks[0].status === 'fulfilled'
        ? pricingTasks[0].value.results
        : [];
      const hotelResult = pricingTasks[1].status === 'fulfilled'
        ? pricingTasks[1].value.results
        : [];

      const cheapestFlight = [...flightResult].sort((a, b) => a.price - b.price)[0];
      const cheapestHotel = [...hotelResult].sort((a, b) => a.price_per_night - b.price_per_night)[0];

      const flightCost = cheapestFlight?.price;
      const nights = Math.max(1, Math.round(
        (Date.parse(endDate) - Date.parse(startDate)) / 86400000,
      ));
      const hotelCost = cheapestHotel ? cheapestHotel.price_per_night * nights : undefined;

      if (flightCost || hotelCost) {
        costBreakdown = {
          ...(flightCost ? { flights: flightCost } : {}),
          ...(hotelCost ? { hotel: hotelCost } : {}),
          total: (flightCost || 0) + (hotelCost || 0),
        };
      }

      await createTrip({
        title: tripPlan.title || `${tripPlan.destination} Journey`,
        destination: tripPlan.destination,
        start_date: startDate,
        end_date: endDate,
        days: tripPlan.duration_days,
        travelers_count: travelersCount,
        budget: tripPlan.estimated_budget || budgetTier,
        status: 'Upcoming',
        payment_status: 'Pending',
        cost_breakdown: costBreakdown,
        itinerary_summary: `${tripPlan.duration_days}-day AI-planned journey to ${tripPlan.destination}.`,
        tags: ['AI Co-Pilot', tripPlan.destination],
        stops: tripPlan.locations?.map((location) => location.name) || [],
      });
    } catch (err) {
      console.error('Failed to persist AI Co-Pilot trip:', err);
      setError('The trip could not be saved. Please try again.');
      setIsSaved(false);
      return;
    }

    window.setTimeout(() => setIsSaved(false), 2500);
  };

  const handleReset = () => {
    setTripPlan(null);
    setSelectedPlaces([]);
    setLocations([]);
    setSelectedLocation(null);
    setDestinationQuery('');
    setError(null);
    setIsSaved(false);
    setMessages([]);
  };

  const applyHeaderFilter = (
    filterType: 'where' | 'when' | 'who' | 'budget',
    value: string | number,
  ) => {
    setActiveMenu(null);

    if (filterType === 'where') {
      const destination = String(value).trim();
      setDestinationQuery(destination);
      if (destination) handleSendMessage(`I want to visit ${destination}`);
    }

    if (filterType === 'when') {
      const days = Number(value);
      setSelectedDuration(days);
      handleSendMessage(
        tripPlan
          ? `Adjust this trip to ${days} days.`
          : `I want to plan a ${days}-day trip${destinationQuery ? ` to ${destinationQuery}` : ''}.`,
      );
    }

    if (filterType === 'who') {
      const travelers = Number(value);
      setTravelersCount(travelers);
      if (tripPlan) handleSendMessage(`Update itinerary for ${travelers} travelers.`);
    }

    if (filterType === 'budget') {
      const budget = String(value);
      setBudgetTier(budget);
      if (tripPlan) handleSendMessage(`Recalculate this trip for a ${budget} budget.`);
    }
  };

  const globeLocations = locations.length > 0 ? locations : tripPlan?.locations || [];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#F7F9FC] text-[#071225]">
      <header className="z-30 flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1683F7] text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold">GoFlexi Trip Planning</h1>
              <span className="rounded-full bg-[#1683F7]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#1683F7]">
                AI Co-Pilot
              </span>
            </div>
            <p className="mt-0.5 hidden text-[10px] text-slate-500 sm:block">
              Conversational destination discovery & visual route planning
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-1 rounded-2xl border border-slate-200 bg-[#F7F9FC] p-1 lg:flex">
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveMenu(activeMenu === 'where' ? null : 'where')}
              className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-left hover:bg-white"
            >
              <MapPin className="h-3.5 w-3.5 text-[#1683F7]" />
              <div>
                <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Where</span>
                <span className="block max-w-[120px] truncate text-[10px] font-semibold">
                  {tripPlan?.destination || destinationQuery || 'Choose destination'}
                </span>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>
            {activeMenu === 'where' && (
              <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                <input
                  autoFocus
                  value={destinationQuery}
                  onChange={(event) => setDestinationQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') applyHeaderFilter('where', destinationQuery);
                  }}
                  placeholder="Enter a destination"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs outline-none focus:border-[#1683F7]"
                />
                <p className="px-2 pt-2 text-[9px] text-slate-400">Press Enter to ask GoFlexi AI.</p>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-slate-200" />

          <div className="relative">
            <button type="button" onClick={() => setActiveMenu(activeMenu === 'when' ? null : 'when')} className="flex items-center gap-2 rounded-xl px-3 py-1.5 hover:bg-white">
              <Calendar className="h-3.5 w-3.5 text-[#1683F7]" />
              <div>
                <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">When</span>
                <span className="text-[10px] font-semibold">{tripPlan?.duration_days || selectedDuration} Days</span>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>
            {activeMenu === 'when' && (
              <div className="absolute left-0 top-full z-50 mt-2 w-36 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                {DURATION_OPTIONS.map((item) => (
                  <button key={item.days} type="button" onClick={() => applyHeaderFilter('when', item.days)} className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs hover:bg-[#1683F7]/5">
                    {item.label}
                    {selectedDuration === item.days && <Check className="h-3 w-3 text-[#1683F7]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-slate-200" />

          <div className="relative">
            <button type="button" onClick={() => setActiveMenu(activeMenu === 'who' ? null : 'who')} className="flex items-center gap-2 rounded-xl px-3 py-1.5 hover:bg-white">
              <Users className="h-3.5 w-3.5 text-[#1683F7]" />
              <div>
                <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Who</span>
                <span className="text-[10px] font-semibold">{travelersCount} Traveler{travelersCount !== 1 ? 's' : ''}</span>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>
            {activeMenu === 'who' && (
              <div className="absolute left-0 top-full z-50 mt-2 w-40 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                {TRAVELER_OPTIONS.map((item) => (
                  <button key={item.count} type="button" onClick={() => applyHeaderFilter('who', item.count)} className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs hover:bg-[#1683F7]/5">
                    {item.label}
                    {travelersCount === item.count && <Check className="h-3 w-3 text-[#1683F7]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-slate-200" />

          <div className="relative">
            <button type="button" onClick={() => setActiveMenu(activeMenu === 'budget' ? null : 'budget')} className="flex items-center gap-2 rounded-xl px-3 py-1.5 hover:bg-white">
              <Wallet className="h-3.5 w-3.5 text-[#1683F7]" />
              <div>
                <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Budget</span>
                <span className="max-w-[90px] truncate text-[10px] font-semibold">{tripPlan?.estimated_budget || budgetTier || 'Set budget'}</span>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>
            {activeMenu === 'budget' && (
              <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                {BUDGET_OPTIONS.map((item) => (
                  <button key={item} type="button" onClick={() => applyHeaderFilter('budget', item)} className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs hover:bg-[#1683F7]/5">
                    {item}
                    {budgetTier === item && <Check className="h-3 w-3 text-[#1683F7]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(tripPlan || selectedPlaces.length > 0) && (
            <button type="button" onClick={handleReset} className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-50">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={handleSaveTrip}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold ${
              isSaved ? 'border border-emerald-200 bg-emerald-50 text-emerald-600' : 'bg-[#1683F7] text-white hover:bg-[#0f72dc]'
            }`}
          >
            {isSaved ? <Check className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
            {isSaved ? 'Saved' : tripPlan ? 'Save Trip' : 'Plan Trip'}
          </button>
          {user && (
            <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-[#071225] text-xs font-semibold text-white sm:flex">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden xl:flex-row">
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-3">
          <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1683F7]">AI Co-Pilot</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#071225]">
                Explore the world <span className="text-[#1683F7]">your way.</span>
              </h2>
              <p className="mt-1 max-w-xl text-xs text-slate-500">
                Plan smarter. Ask GoFlexi AI to discover destinations, build a route, and organize a trip from live travel data.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
              <p className="mb-1.5 px-1 text-[9px] font-bold uppercase tracking-wider text-[#071225]">Choose your vehicle</p>
              <div className="grid grid-cols-6 gap-1">
                {VEHICLES.map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setVehicle(label)}
                    className={`flex min-w-14 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[9px] font-semibold transition ${
                      vehicle === label
                        ? 'bg-[#1683F7] text-white shadow-sm'
                        : 'bg-[#F7F9FC] text-slate-500 hover:text-[#071225]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <TripGlobe
              locations={globeLocations}
              routes={tripPlan?.routes || []}
              selectedLocation={selectedLocation}
              onSelectLocation={setSelectedLocation}
            />
            {error && (
              <div className="absolute bottom-20 left-1/2 z-20 w-[min(460px,calc(100%-2rem))] -translate-x-1/2 rounded-xl border border-rose-200 bg-white p-3 text-xs text-rose-600 shadow-lg">
                {error}
              </div>
            )}
          </div>
        </main>

        <aside className="h-[46%] w-full flex-shrink-0 overflow-hidden p-3 pt-0 xl:h-full xl:w-[390px] xl:pl-0 xl:pt-3">
          <AiTripAssistant
            messages={messages}
            onSendMessage={handleSendMessage}
            onAddPlace={handleAddPlace}
            selectedPlaces={selectedPlaces}
            selectedLocation={selectedLocation}
            tripPlan={tripPlan}
            isLoading={isLoading}
            error={error}
            onRetry={() => {
              const lastUserMessage = [...messages].reverse().find((message) => message.sender === 'user');
              if (lastUserMessage) handleSendMessage(lastUserMessage.text);
            }}
          />
        </aside>
      </div>
    </div>
  );
};

export default AiTripCopilotPage;
