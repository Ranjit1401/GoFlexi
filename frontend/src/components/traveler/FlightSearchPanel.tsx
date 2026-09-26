import React, { useState, useEffect, useRef } from 'react';
import {
  Plane,
  Calendar,
  Users,
  Search,
  ArrowRight,
  ExternalLink,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingState } from '../ui/LoadingState';
import { EmptyState } from '../ui/EmptyState';
import { useToast } from '../../context/ToastContext';
import { searchAirports, searchFlights } from '../../services/travel-search';
import { parseApiError } from '../../services/api-client';
import { AirportSuggestion, FlightOption } from '../../types/travel-search';

export interface FlightSearchPanelProps {
  initialOrigin?: string;
  initialDestination?: string;
  initialDepartDate?: string;
  initialReturnDate?: string;
  initialAdults?: number;
  onSelectFlight?: (flight: FlightOption) => void;
  selectedFlightId?: string;
}

export const FlightSearchPanel: React.FC<FlightSearchPanelProps> = ({
  initialOrigin = 'Mumbai',
  initialDestination = 'Goa',
  initialDepartDate = '2026-10-15',
  initialReturnDate = '2026-10-19',
  initialAdults = 1,
  onSelectFlight,
  selectedFlightId,
}) => {
  const { showToast } = useToast();

  const [origin, setOrigin] = useState(initialOrigin);
  const [destination, setDestination] = useState(initialDestination);
  const [departDate, setDepartDate] = useState(initialDepartDate);
  const [returnDate, setReturnDate] = useState(initialReturnDate);
  const [adults, setAdults] = useState(initialAdults);
  const [cabinClass, setCabinClass] = useState('economy');

  const [originSuggestions, setOriginSuggestions] = useState<AirportSuggestion[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<AirportSuggestion[]>([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [flights, setFlights] = useState<FlightOption[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const originDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const destDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync initial props when they change
  useEffect(() => {
    if (initialDestination) setDestination(initialDestination);
  }, [initialDestination]);

  useEffect(() => {
    if (initialDepartDate) setDepartDate(initialDepartDate);
    if (initialReturnDate) setReturnDate(initialReturnDate);
  }, [initialDepartDate, initialReturnDate]);

  useEffect(() => {
    if (initialAdults) setAdults(initialAdults);
  }, [initialAdults]);

  // Debounced airport search for origin
  const handleOriginChange = (val: string) => {
    setOrigin(val);
    if (originDebounceRef.current) clearTimeout(originDebounceRef.current);
    if (val.trim().length >= 2) {
      originDebounceRef.current = setTimeout(async () => {
        try {
          const suggestions = await searchAirports(val.trim());
          setOriginSuggestions(suggestions);
          setShowOriginDropdown(true);
        } catch {
          setOriginSuggestions([]);
        }
      }, 350);
    } else {
      setOriginSuggestions([]);
      setShowOriginDropdown(false);
    }
  };

  // Debounced airport search for destination
  const handleDestChange = (val: string) => {
    setDestination(val);
    if (destDebounceRef.current) clearTimeout(destDebounceRef.current);
    if (val.trim().length >= 2) {
      destDebounceRef.current = setTimeout(async () => {
        try {
          const suggestions = await searchAirports(val.trim());
          setDestSuggestions(suggestions);
          setShowDestDropdown(true);
        } catch {
          setDestSuggestions([]);
        }
      }, 350);
    } else {
      setDestSuggestions([]);
      setShowDestDropdown(false);
    }
  };

  const handleSearch = async () => {
    if (!origin.trim()) {
      showToast('warning', 'Please enter a departure city or airport');
      return;
    }
    if (!destination.trim()) {
      showToast('warning', 'Please enter a destination city or airport');
      return;
    }
    if (!departDate) {
      showToast('warning', 'Please select a departure date');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setShowOriginDropdown(false);
    setShowDestDropdown(false);

    try {
      const response = await searchFlights({
        origin: origin.trim(),
        destination: destination.trim(),
        depart_date: departDate,
        return_date: returnDate || null,
        adults: Math.max(1, adults),
        cabin_class: cabinClass,
        currency: 'INR',
      });
      setFlights(response.results);
      if (response.results.length === 0) {
        showToast('info', 'No direct or connecting flights found for these dates.', 'Search Results');
      } else {
        showToast('success', `Found ${response.results.length} flight options!`, 'Flights Available');
      }
    } catch (err) {
      const parsed = parseApiError(err);
      let friendlyMsg = parsed.message;
      if (parsed.status === 502) {
        friendlyMsg = 'Flight search is temporarily unavailable. Please try again in a few moments.';
      } else if (parsed.status === 404) {
        friendlyMsg = parsed.message || 'Could not resolve the specified airport or city.';
      }
      setErrorMessage(friendlyMsg);
      setFlights([]);
      showToast('error', friendlyMsg, 'Flight Search');
    } finally {
      setIsLoading(false);
    }
  };

  const hasSearchedInitialRef = useRef(false);
  useEffect(() => {
    if (!hasSearchedInitialRef.current && origin.trim() && destination.trim() && departDate) {
      hasSearchedInitialRef.current = true;
      handleSearch();
    }
  }, [origin, destination, departDate]);

  const formatDuration = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const remainder = mins % 60;
    if (hours === 0) return `${remainder}m`;
    if (remainder === 0) return `${hours}h`;
    return `${hours}h ${remainder}m`;
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '--:--';
    // If ISO timestamp e.g. 2026-10-15T08:30:00
    if (timeStr.includes('T')) {
      const parts = timeStr.split('T')[1];
      return parts ? parts.substring(0, 5) : timeStr;
    }
    return timeStr;
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-wider mb-2">
          <Plane className="w-3.5 h-3.5" />
          Live Flight Search
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-navy-950">
          Search Available Flights
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Real-time airline routes, fares, and transit durations powered by Sky Scrapper.
        </p>
      </div>

      {/* Flight Search Form */}
      <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/90 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Origin Autocomplete */}
          <div className="relative">
            <Input
              label="Origin City / Airport"
              placeholder="e.g. Mumbai (BOM), Delhi"
              value={origin}
              onChange={(e) => handleOriginChange(e.target.value)}
              onFocus={() => originSuggestions.length > 0 && setShowOriginDropdown(true)}
              icon={<Plane className="w-4 h-4 rotate-45 text-slate-400" />}
            />
            {showOriginDropdown && originSuggestions.length > 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 max-h-56 overflow-y-auto divide-y divide-slate-100">
                {originSuggestions.map((item) => (
                  <button
                    key={`${item.skyId}-${item.entityId}`}
                    type="button"
                    onClick={() => {
                      setOrigin(item.city ? `${item.city} (${item.skyId})` : item.name);
                      setShowOriginDropdown(false);
                    }}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-navy-950">{item.name}</span>
                      <span className="text-slate-500 block text-[11px]">
                        {item.city}, {item.country}
                      </span>
                    </div>
                    <Badge variant="primary" size="sm">
                      {item.skyId}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Destination Autocomplete */}
          <div className="relative">
            <Input
              label="Destination City / Airport"
              placeholder="e.g. Goa (GOI), Jaipur"
              value={destination}
              onChange={(e) => handleDestChange(e.target.value)}
              onFocus={() => destSuggestions.length > 0 && setShowDestDropdown(true)}
              icon={<Plane className="w-4 h-4 rotate-90 text-slate-400" />}
            />
            {showDestDropdown && destSuggestions.length > 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 max-h-56 overflow-y-auto divide-y divide-slate-100">
                {destSuggestions.map((item) => (
                  <button
                    key={`${item.skyId}-${item.entityId}`}
                    type="button"
                    onClick={() => {
                      setDestination(item.city ? `${item.city} (${item.skyId})` : item.name);
                      setShowDestDropdown(false);
                    }}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-navy-950">{item.name}</span>
                      <span className="text-slate-500 block text-[11px]">
                        {item.city}, {item.country}
                      </span>
                    </div>
                    <Badge variant="primary" size="sm">
                      {item.skyId}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dates & Passengers */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Input
            label="Departure Date"
            type="date"
            value={departDate}
            onChange={(e) => setDepartDate(e.target.value)}
            icon={<Calendar className="w-4 h-4 text-slate-400" />}
          />
          <Input
            label="Return Date (Optional)"
            type="date"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            icon={<Calendar className="w-4 h-4 text-slate-400" />}
          />
          <Input
            label="Adults"
            type="number"
            min={1}
            max={9}
            value={adults}
            onChange={(e) => setAdults(parseInt(e.target.value, 10) || 1)}
            icon={<Users className="w-4 h-4 text-slate-400" />}
          />
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Cabin Class</label>
            <select
              value={cabinClass}
              onChange={(e) => setCabinClass(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="economy">Economy</option>
              <option value="premium_economy">Premium Economy</option>
              <option value="business">Business</option>
              <option value="first">First Class</option>
            </select>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <Button
            variant="primary"
            onClick={handleSearch}
            isLoading={isLoading}
            className="rounded-xl px-6 bg-navy-900 hover:bg-navy-800 text-xs"
            icon={<Search className="w-4 h-4" />}
          >
            Search Flights
          </Button>
        </div>
      </div>

      {/* Results Area */}
      {isLoading && (
        <LoadingState message="Fetching live flights from Sky Scrapper..." />
      )}

      {!isLoading && errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-900">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">Search Notice</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {!isLoading && flights !== null && flights.length === 0 && !errorMessage && (
        <EmptyState
          icon={<Plane className="w-7 h-7 text-slate-400" />}
          title="No flights found"
          description="Try broadening your search dates or selecting nearby major airports."
          action={
            <Button variant="outline" size="sm" onClick={handleSearch}>
              Retry Search
            </Button>
          }
        />
      )}

      {!isLoading && flights !== null && flights.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Sorted by price (lowest first)</span>
            <span className="font-bold text-navy-900">{flights.length} flights available</span>
          </div>

          <div className="space-y-3">
            {flights.map((flight) => {
              const isSelected = selectedFlightId === flight.id;
              return (
                <Card
                  key={flight.id}
                  padding="md"
                  variant="interactive"
                  onClick={() => onSelectFlight && onSelectFlight(flight)}
                  className={`transition-all ${
                    isSelected
                      ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Airline & Route Info */}
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 flex-shrink-0">
                        <Plane className="w-5 h-5 text-brand-600" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-navy-950">{flight.airline}</span>
                          <Badge
                            variant={flight.stops === 0 ? 'success' : 'neutral'}
                            size="sm"
                          >
                            {flight.stops === 0 ? 'Non-stop' : `${flight.stops} Stop${flight.stops > 1 ? 's' : ''}`}
                          </Badge>
                        </div>

                        {/* Timing */}
                        <div className="flex items-center gap-3 text-xs text-slate-600">
                          <span className="font-semibold text-slate-900">
                            {formatTime(flight.depart_time)}
                          </span>
                          <span className="text-slate-400">({flight.origin_airport || origin})</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-900">
                            {formatTime(flight.arrive_time)}
                          </span>
                          <span className="text-slate-400">({flight.destination_airport || destination})</span>
                        </div>

                        {flight.duration_minutes > 0 && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{formatDuration(flight.duration_minutes)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price & Selection */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <span className="text-xs text-slate-400 block">Total fare</span>
                        <span className="text-lg font-extrabold text-navy-950">
                          ₹{flight.price.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        {flight.booking_deeplink && (
                          <a
                            href={flight.booking_deeplink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                            title="View booking portal"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <Button
                          size="sm"
                          variant={isSelected ? 'primary' : 'outline'}
                          className="rounded-xl text-xs py-1 px-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectFlight) onSelectFlight(flight);
                          }}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-3.5 h-3.5 mr-1 text-emerald-300" />
                              Selected
                            </>
                          ) : (
                            'Select'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
