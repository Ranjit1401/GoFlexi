import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Calendar,
  Users,
  Search,
  Star,
  MapPin,
  Check,
  AlertCircle,
  DoorOpen,
  Sparkles,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingState } from '../ui/LoadingState';
import { EmptyState } from '../ui/EmptyState';
import { useToast } from '../../context/ToastContext';
import { searchHotelDestinations, searchHotels } from '../../services/travel-search';
import { parseApiError } from '../../services/api-client';
import { HotelDestinationSuggestion, HotelOption } from '../../types/travel-search';

export interface HotelSearchPanelProps {
  initialDestination?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialAdults?: number;
  initialRooms?: number;
  onSelectHotel?: (hotel: HotelOption) => void;
  selectedHotelId?: string;
  budgetMax?: number;
  travelStyle?: string;
}

export const HotelSearchPanel: React.FC<HotelSearchPanelProps> = ({
  initialDestination = 'Goa',
  initialCheckIn = '2026-10-15',
  initialCheckOut = '2026-10-19',
  initialAdults = 2,
  initialRooms = 1,
  onSelectHotel,
  selectedHotelId,
  budgetMax,
  travelStyle = 'Balanced',
}) => {
  const { showToast } = useToast();

  const [destination, setDestination] = useState(initialDestination);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [adults, setAdults] = useState(initialAdults);
  const [rooms, setRooms] = useState(initialRooms);

  const [destSuggestions, setDestSuggestions] = useState<HotelDestinationSuggestion[]>([]);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [hotels, setHotels] = useState<HotelOption[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initialDestination) setDestination(initialDestination);
  }, [initialDestination]);

  useEffect(() => {
    if (initialCheckIn) setCheckIn(initialCheckIn);
    if (initialCheckOut) setCheckOut(initialCheckOut);
  }, [initialCheckIn, initialCheckOut]);

  useEffect(() => {
    if (initialAdults) setAdults(initialAdults);
    if (initialRooms) setRooms(initialRooms);
  }, [initialAdults, initialRooms]);

  const handleDestinationChange = (val: string) => {
    setDestination(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length >= 2) {
      debounceRef.current = setTimeout(async () => {
        try {
          const suggestions = await searchHotelDestinations(val.trim());
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
    if (!destination.trim()) {
      showToast('warning', 'Please enter a destination city or hotel name');
      return;
    }
    if (!checkIn) {
      showToast('warning', 'Please select a check-in date');
      return;
    }
    if (!checkOut) {
      showToast('warning', 'Please select a check-out date');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setShowDestDropdown(false);

    try {
      const response = await searchHotels({
        destination: destination.trim(),
        check_in: checkIn,
        check_out: checkOut,
        adults: Math.max(1, adults),
        rooms: Math.max(1, rooms),
        currency: 'INR',
      });
      const rawResults = response.results;
      const weights = {
        Budget: { price: 0.6, quality: 0.1 },
        Balanced: { price: 0.35, quality: 0.35 },
        Premium: { price: 0.2, quality: 0.5 },
        Luxury: { price: 0.1, quality: 0.6 },
      }[travelStyle] || { price: 0.35, quality: 0.35 };

      const inBudget = budgetMax
        ? rawResults.filter((h) => h.price_per_night <= budgetMax)
        : rawResults;
      const pool = inBudget.length > 0 ? inBudget : rawResults;

      const prices = pool.map((h) => h.price_per_night);
      const minP = prices.length ? Math.min(...prices) : 0;
      const maxP = prices.length ? Math.max(...prices) : 1;
      const range = maxP - minP || 1;

      const scored = pool.map((h) => {
        const normPrice = (h.price_per_night - minP) / range;
        const normRating = (h.star_rating || 3.0) / 5.0;
        const score = weights.quality * normRating - weights.price * normPrice;
        return { hotel: h, score };
      });
      scored.sort((a, b) => b.score - a.score);
      const ranked = scored.map((s) => s.hotel);

      setHotels(ranked);
      if (ranked.length > 0 && !selectedHotelId && onSelectHotel) {
        onSelectHotel(ranked[0]);
      }
      if (response.results.length === 0) {
        showToast('info', 'No hotels available for these dates and criteria.', 'Search Results');
      } else {
        showToast(
          'success',
          `Found and ranked ${response.results.length} stays for ${travelStyle} style!`,
          'Accommodations'
        );
      }
    } catch (err) {
      const parsed = parseApiError(err);
      let friendlyMsg = parsed.message;
      if (parsed.status === 502) {
        friendlyMsg = 'Hotel search is temporarily unavailable. Please try again in a few moments.';
      } else if (parsed.status === 404) {
        friendlyMsg = parsed.message || 'Could not resolve hotel destination.';
      }
      setErrorMessage(friendlyMsg);
      setHotels([]);
      showToast('error', friendlyMsg, 'Hotel Search');
    } finally {
      setIsLoading(false);
    }
  };

  const hasSearchedInitialRef = useRef(false);
  useEffect(() => {
    if (!hasSearchedInitialRef.current && destination.trim() && checkIn && checkOut) {
      hasSearchedInitialRef.current = true;
      handleSearch();
    }
  }, [destination, checkIn, checkOut]);

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
          <Building2 className="w-3.5 h-3.5" />
          Live Hotel Search
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-navy-950">
          Explore Stays & Resorts
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Real-time rates, star ratings, and property reviews via Sky Scrapper.
        </p>
      </div>

      {/* Hotel Search Form */}
      <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/90 space-y-4">
        {/* Destination Autocomplete */}
        <div className="relative">
          <Input
            label="Destination / City"
            placeholder="e.g. Goa, Manali, Jaipur..."
            value={destination}
            onChange={(e) => handleDestinationChange(e.target.value)}
            onFocus={() => destSuggestions.length > 0 && setShowDestDropdown(true)}
            icon={<MapPin className="w-4 h-4 text-slate-400" />}
          />
          {showDestDropdown && destSuggestions.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 max-h-56 overflow-y-auto divide-y divide-slate-100">
              {destSuggestions.map((item) => (
                <button
                  key={item.entityId}
                  type="button"
                  onClick={() => {
                    setDestination(item.name);
                    setShowDestDropdown(false);
                  }}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-navy-950">{item.name}</span>
                  <Badge variant="neutral" size="sm">
                    {item.entityType || 'Destination'}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dates & Rooms/Guests */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Input
            label="Check-in Date"
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            icon={<Calendar className="w-4 h-4 text-slate-400" />}
          />
          <Input
            label="Check-out Date"
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            icon={<Calendar className="w-4 h-4 text-slate-400" />}
          />
          <Input
            label="Adult Guests"
            type="number"
            min={1}
            max={20}
            value={adults}
            onChange={(e) => setAdults(parseInt(e.target.value, 10) || 1)}
            icon={<Users className="w-4 h-4 text-slate-400" />}
          />
          <Input
            label="Rooms"
            type="number"
            min={1}
            max={10}
            value={rooms}
            onChange={(e) => setRooms(parseInt(e.target.value, 10) || 1)}
            icon={<DoorOpen className="w-4 h-4 text-slate-400" />}
          />
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
            Search Hotels
          </Button>
        </div>
      </div>

      {/* Results Area */}
      {isLoading && (
        <LoadingState message="Fetching available hotels and rates..." />
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

      {!isLoading && hotels !== null && hotels.length === 0 && !errorMessage && (
        <EmptyState
          icon={<Building2 className="w-7 h-7 text-slate-400" />}
          title="No accommodations found"
          description="Try modifying your travel dates or searching for a broader destination."
          action={
            <Button variant="outline" size="sm" onClick={handleSearch}>
              Retry Search
            </Button>
          }
        />
      )}

      {!isLoading && hotels !== null && hotels.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Ranked by <strong className="font-semibold text-slate-700">{travelStyle}</strong> style &amp; rating
              {budgetMax ? ` • Budget target ₹${budgetMax.toLocaleString('en-IN')}` : ''}
            </span>
            <span className="font-bold text-navy-900">{hotels.length} stays available</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {hotels.map((hotel, idx) => {
              const isSelected = selectedHotelId === hotel.id;
              const isRecommended = idx === 0;
              return (
                <Card
                  key={hotel.id}
                  padding="none"
                  variant="interactive"
                  onClick={() => onSelectHotel && onSelectHotel(hotel)}
                  className={`overflow-hidden transition-all ${
                    isSelected
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
                      : isRecommended
                      ? 'border-amber-300/80 bg-amber-50/10 hover:border-amber-400'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Thumbnail / Image */}
                    <div className="w-full sm:w-44 h-36 bg-slate-100 flex-shrink-0 relative overflow-hidden flex items-center justify-center">
                      {hotel.thumbnail_url ? (
                        <img
                          src={hotel.thumbnail_url}
                          alt={hotel.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Building2 className="w-10 h-10 text-slate-400" />
                      )}
                      {hotel.star_rating && (
                        <div className="absolute top-2 left-2 bg-navy-950/80 backdrop-blur-xs text-amber-300 px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-300" />
                          <span>{hotel.star_rating}★</span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        {isRecommended && (
                          <div className="mb-1.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs">
                              <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400" />
                              Recommended for you • Top {travelStyle} Stay
                            </span>
                          </div>
                        )}
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-base font-bold text-navy-950">
                            {hotel.name}
                          </h3>
                        </div>

                        {hotel.address && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{hotel.address}</span>
                          </div>
                        )}

                        {hotel.rating_score && (
                          <div className="flex items-center gap-2 pt-1">
                            <Badge variant="accent" size="sm">
                              {hotel.rating_score.toFixed(1)} / 5
                            </Badge>
                            {hotel.review_count && (
                              <span className="text-[11px] text-slate-500">
                                ({hotel.review_count.toLocaleString()} reviews)
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Pricing & Selection */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-3">
                        <div>
                          <span className="text-xs text-slate-400 block">Nightly rate</span>
                          <span className="text-lg font-extrabold text-navy-950">
                            ₹{hotel.price_per_night.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <Button
                          size="sm"
                          variant={isSelected ? 'primary' : 'outline'}
                          className="rounded-xl text-xs py-1 px-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectHotel) onSelectHotel(hotel);
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
