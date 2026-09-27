import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Users,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  Sun,
  CloudRain,
  CloudSun,
  Snowflake,
  AlertCircle,
  AlertTriangle,
  Wallet,
  Compass,
  Star,
  Plane,
  Train,
  Building2,
  RefreshCw,
  Bookmark,
  Share2,
  Info,
  ExternalLink,
  LocateFixed,
  X,
  Navigation,
  CreditCard,
} from 'lucide-react';
import { getCurrentLocationCity } from '../../utils/geolocation';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { FlightSearchPanel } from '../../components/traveler/FlightSearchPanel';
import { TrainSearchPanel } from '../../components/traveler/TrainSearchPanel';
import { HotelSearchPanel } from '../../components/traveler/HotelSearchPanel';
import { ActivityCard } from '../../components/traveler/ActivityCard';
import { TripPlanTree } from '../../components/traveler/TripPlanTree';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  TripWizardProvider,
  useTripWizard,
} from '../../context/TripWizardContext';
import {
  searchDestinations,
  searchActivities,
  getDateInsight,
  getBudgetPreview,
  getWikivoyageSummary,
  recommendTrip,
} from '../../services/trip-wizard';
import { createTrip, CreateTripPayload } from '../../services/trips';
import { initiateRazorpayPayment } from '../../services/razorpay';
import {
  GeoResult,
  POIResult,
  WizardActivity,
  DateInsight,
  TripLocation,
  WikivoyageSummary,
} from '../../types/trip-planner';
import { getDestinationImage, getActivityImage } from '../../utils/placeImages';
import {
  DEFAULT_FLIGHT_BUDGET_RATIO,
  DEFAULT_HOTEL_BUDGET_RATIO,
  calculateTripDays,
  calculateTripDuration,
} from '../../utils/tripDuration';

export {
  DEFAULT_FLIGHT_BUDGET_RATIO,
  DEFAULT_HOTEL_BUDGET_RATIO,
  calculateTripDays,
  calculateTripDuration,
};

// -------------------------------------------------------------
// Inner Wizard Component (Consumes TripWizardContext)
// -------------------------------------------------------------
const TravelerNewTripWizardContent: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const { user } = useAuth();

  const destParam = searchParams.get('dest');
  const originParam = searchParams.get('origin');

  const [isLocatingDeparture, setIsLocatingDeparture] = useState(false);
  const [detectedLocationLabel, setDetectedLocationLabel] = useState<string | null>(null);

  const {
    step,
    totalSteps,
    setStep,
    nextStep,
    prevStep,
    destination,
    destinationGeo,
    departureCity,
    startDate,
    endDate,
    travelersCount,
    travelersType,
    budgetMin,
    budgetMax,
    budgetPreview,
    activities,
    travelStyle,
    transportMode,
    setTransportMode,
    selectedFlight,
    selectedTrain,
    setSelectedFlight,
    setSelectedTrain,
    selectedHotel,
    generatedTripPlan,
    dateInsight,
    setDestination,
    setDestinationGeo,
    setDepartureCity,
    setDates,
    setTravelers,
    setBudgetRange,
    setBudgetPreview,
    toggleActivity,
    setTravelStyle,
    setSelectedHotel,
    setGeneratedTripPlan,
    setDateInsight,
    resetWizard,
  } = useTripWizard();

  const flightBudgetRatio = budgetPreview?.flight_budget_ratio ?? DEFAULT_FLIGHT_BUDGET_RATIO;
  const hotelBudgetRatio = budgetPreview?.hotel_budget_ratio ?? DEFAULT_HOTEL_BUDGET_RATIO;

  const INTERNATIONAL_CITIES = useMemo(
    () => [
      'dubai', 'abu dhabi', 'singapore', 'bangkok', 'bali', 'denpasar',
      'london', 'paris', 'tokyo', 'new york', 'phuket', 'kuala lumpur',
      'san francisco', 'maldives', 'rome', 'amsterdam', 'zurich', 'berlin',
      'istanbul', 'doha', 'sydney', 'toronto', 'chicago', 'los angeles',
      'vietnam', 'hanoi', 'thailand', 'malaysia', 'indonesia', 'switzerland',
    ],
    []
  );

  const isDomesticIndia = useMemo(() => {
    if (
      destinationGeo?.country_code?.toUpperCase() === 'IN' ||
      destinationGeo?.country?.toLowerCase() === 'india'
    ) {
      return true;
    }
    const cleanDest = (destination || '').toLowerCase();
    for (const intl of INTERNATIONAL_CITIES) {
      if (cleanDest.includes(intl)) return false;
    }
    return true;
  }, [destination, destinationGeo, INTERNATIONAL_CITIES]);

  // If destination changed to international and mode was train, revert to flight
  useEffect(() => {
    if (!isDomesticIndia && transportMode === 'train') {
      setTransportMode('flight');
    }
  }, [isDomesticIndia, transportMode, setTransportMode]);

  // Set default departure city from user profile if not customized
  useEffect(() => {
    if (user?.location && departureCity === 'Mumbai' && !originParam) {
      setDepartureCity(user.location);
    }
  }, [user?.location, originParam]);

  const handleDetectCurrentLocation = async () => {
    setIsLocatingDeparture(true);
    try {
      const loc = await getCurrentLocationCity();
      setDepartureCity(loc.city);
      setDetectedLocationLabel(loc.formatted || loc.city);
      showToast('success', `Departure origin set to ${loc.city}`, '📍 Location Detected');
    } catch (err: any) {
      console.error('Failed to get current location:', err);
      showToast(
        'error',
        err?.message || 'Unable to detect GPS position. Please enter your city manually.',
        'Location Error'
      );
    } finally {
      setIsLocatingDeparture(false);
    }
  };

  // Featured destinations and instant presets
  const FEATURED_GEO_PRESETS: Record<string, GeoResult> = {
    Goa: { name: 'Goa', country: 'India', admin1: 'Goa', latitude: 15.2993, longitude: 74.1240, country_code: 'IN' },
    Manali: { name: 'Manali', country: 'India', admin1: 'Himachal Pradesh', latitude: 32.2432, longitude: 77.1892, country_code: 'IN' },
    Kerala: { name: 'Kerala', country: 'India', admin1: 'Kerala', latitude: 9.9312, longitude: 76.2673, country_code: 'IN' },
    Meghalaya: { name: 'Meghalaya', country: 'India', admin1: 'Meghalaya', latitude: 25.5788, longitude: 91.8933, country_code: 'IN' },
    Rajasthan: { name: 'Rajasthan', country: 'India', admin1: 'Rajasthan', latitude: 26.9124, longitude: 75.7873, country_code: 'IN' },
    Andaman: { name: 'Andaman', country: 'India', admin1: 'Andaman and Nicobar', latitude: 11.6234, longitude: 92.7265, country_code: 'IN' },
    Kashmir: { name: 'Kashmir', country: 'India', admin1: 'Jammu and Kashmir', latitude: 34.0837, longitude: 74.7973, country_code: 'IN' },
    Sikkim: { name: 'Sikkim', country: 'India', admin1: 'Sikkim', latitude: 27.3389, longitude: 88.6065, country_code: 'IN' },
  };

  const popularDestinations = Object.keys(FEATURED_GEO_PRESETS);

  // -----------------------------------------------------------
  // Step 1: Destination Autocomplete & Popular Activities
  // -----------------------------------------------------------
  const [destSuggestions, setDestSuggestions] = useState<GeoResult[]>([]);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [loadingDestSearch, setLoadingDestSearch] = useState(false);
  const [popularPois, setPopularPois] = useState<POIResult[]>([]);
  const [loadingPopularPois, setLoadingPopularPois] = useState(false);
  const destSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDestinationInputChange = (val: string) => {
    setDestination(val);
    if (destSearchDebounceRef.current) {
      clearTimeout(destSearchDebounceRef.current);
    }

    if (val.trim().length >= 2) {
      setLoadingDestSearch(true);
      destSearchDebounceRef.current = setTimeout(async () => {
        try {
          const results = await searchDestinations(val.trim());
          setDestSuggestions(results);
          setShowDestDropdown(results.length > 0);
        } catch {
          setDestSuggestions([]);
        } finally {
          setLoadingDestSearch(false);
        }
      }, 300);
    } else {
      setDestSuggestions([]);
      setShowDestDropdown(false);
      setLoadingDestSearch(false);
    }
  };

  const handleSelectGeocodedDest = (geo: GeoResult) => {
    setDestination(geo.name, geo);
    setShowDestDropdown(false);
    loadPopularActivities(geo.latitude, geo.longitude);
  };

  const handleSelectFeaturedDest = async (destName: string) => {
    const preset = FEATURED_GEO_PRESETS[destName];
    if (preset) {
      setDestination(preset.name, preset);
      loadPopularActivities(preset.latitude, preset.longitude);
      return;
    }

    setDestination(destName);
    try {
      const results = await searchDestinations(destName);
      if (results.length > 0) {
        const best = results[0];
        setDestination(best.name, best);
        loadPopularActivities(best.latitude, best.longitude);
        return;
      }
    } catch {
      // Fallback
    }
    loadPopularActivities(15.2993, 74.124);
  };

  const loadPopularActivities = async (lat: number, lon: number) => {
    setLoadingPopularPois(true);
    try {
      const results = await searchActivities(lat, lon, 'popular', 25000);
      setPopularPois(results);
    } catch {
      setPopularPois([]);
    } finally {
      setLoadingPopularPois(false);
    }
  };

  // Initial load for Step 1 default destination & search params
  const hasLoadedStep1Ref = useRef(false);
  useEffect(() => {
    if (!hasLoadedStep1Ref.current) {
      hasLoadedStep1Ref.current = true;
      if (destParam && destParam.trim()) {
        handleSelectFeaturedDest(destParam.trim());
      } else if (destinationGeo) {
        loadPopularActivities(destinationGeo.latitude, destinationGeo.longitude);
      } else {
        handleSelectFeaturedDest(destination || 'Goa');
      }

      if (originParam && originParam.trim()) {
        setDepartureCity(originParam.trim());
      }
    }
  }, [destParam, originParam]);

  // If destParam changes in URL (e.g. from Explore navigation)
  useEffect(() => {
    if (destParam && destParam.trim() && destParam.trim().toLowerCase() !== destination.toLowerCase()) {
      handleSelectFeaturedDest(destParam.trim());
    }
  }, [destParam]);

  // -----------------------------------------------------------
  // Step 2: Date Insights (Weather + Crowd Heuristic)
  // -----------------------------------------------------------
  const [loadingDateInsight, setLoadingDateInsight] = useState(false);

  useEffect(() => {
    if (step === 2 && destinationGeo && startDate && endDate) {
      const fetchInsight = async () => {
        setLoadingDateInsight(true);
        try {
          const insight = await getDateInsight(
            destinationGeo.latitude,
            destinationGeo.longitude,
            startDate,
            endDate,
            destinationGeo.country_code || 'IN'
          );
          setDateInsight(insight);
        } catch {
          // Graceful fallback date insight
          setDateInsight({
            weather: {
              temp_max: 29.5,
              temp_min: 22.0,
              precipitation_probability: 20,
              condition: 'Pleasant & Sunny',
              is_forecast: false,
              daily_summary: 'Typical seasonal outlook for this time of year',
            },
            crowd_score: 55,
            crowd_label: 'Moderate',
            crowd_disclaimer:
              'Crowd level is a seasonal + public-holiday estimate, not live occupancy data.',
            holiday_overlap: false,
            holidays: [],
          });
        } finally {
          setLoadingDateInsight(false);
        }
      };
      fetchInsight();
    }
  }, [step, destinationGeo?.latitude, destinationGeo?.longitude, startDate, endDate]);

  const calculateDuration = () => {
    return calculateTripDuration(startDate, endDate).formatted;
  };

  const getWeatherIcon = (cond: string) => {
    const lower = cond.toLowerCase();
    if (lower.includes('rain') || lower.includes('shower')) {
      return <CloudRain className="w-6 h-6 text-sky-500" />;
    }
    if (lower.includes('snow')) {
      return <Snowflake className="w-6 h-6 text-indigo-400" />;
    }
    if (lower.includes('cloud')) {
      return <CloudSun className="w-6 h-6 text-amber-500" />;
    }
    return <Sun className="w-6 h-6 text-amber-500" />;
  };

  const getCrowdBadgeColor = (label: string) => {
    switch (label) {
      case 'Low':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'High':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'Moderate':
      default:
        return 'bg-amber-50 text-amber-800 border-amber-200';
    }
  };

  // -----------------------------------------------------------
  // Step 4: Live Budget Preview Bounds
  // -----------------------------------------------------------
  const [loadingBudgetPreview, setLoadingBudgetPreview] = useState(false);
  const lastBudgetDestRef = useRef<string | null>(null);

  useEffect(() => {
    if (step === 4 && (!budgetPreview || lastBudgetDestRef.current !== destination)) {
      const fetchBudget = async () => {
        lastBudgetDestRef.current = destination;
        setLoadingBudgetPreview(true);
        try {
          const preview = await getBudgetPreview(
            destination,
            startDate,
            endDate,
            travelersCount,
            departureCity
          );
          setBudgetPreview(preview);
        } catch {
          // Fallback budget preview
          setBudgetPreview({
            min_price: 15000 * travelersCount,
            max_price: 65000 * travelersCount,
            flight_min: 7000 * travelersCount,
            flight_max: 22000 * travelersCount,
            hotel_min: 6000 * travelersCount,
            hotel_max: 35000 * travelersCount,
            currency: 'INR',
          });
        } finally {
          setLoadingBudgetPreview(false);
        }
      };
      fetchBudget();
    }
  }, [step, destination, startDate, endDate, travelersCount, departureCity]);

  // -----------------------------------------------------------
  // Step 5: Hidden Gems Activities + Wikivoyage Summary
  // -----------------------------------------------------------
  const [hiddenPois, setHiddenPois] = useState<POIResult[]>([]);
  const [loadingHiddenPois, setLoadingHiddenPois] = useState(false);
  const [wikiSummary, setWikiSummary] = useState<WikivoyageSummary | null>(null);
  const [loadingWiki, setLoadingWiki] = useState(false);

  useEffect(() => {
    if (step === 5 && destinationGeo) {
      // 1. Fetch Wikivoyage summary
      setLoadingWiki(true);
      getWikivoyageSummary(destination)
        .then((res) => setWikiSummary(res))
        .finally(() => setLoadingWiki(false));

      // 2. Fetch Hidden Gems POIs
      setLoadingHiddenPois(true);
      searchActivities(destinationGeo.latitude, destinationGeo.longitude, 'hidden', 30000)
        .then((res) => setHiddenPois(res))
        .catch(() => setHiddenPois([]))
        .finally(() => setLoadingHiddenPois(false));
    }
  }, [step, destinationGeo?.latitude, destinationGeo?.longitude, destination]);

  // -----------------------------------------------------------
  // Step 8: Generate Trip Recommendation & Display Plan Tree
  // -----------------------------------------------------------
  const [isRecommending, setIsRecommending] = useState(false);
  const [selectedPlanLocation, setSelectedPlanLocation] = useState<TripLocation | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleGenerateRecommendation = async () => {
    setIsRecommending(true);
    try {
      const resp = await recommendTrip({
        destination,
        destination_lat: destinationGeo?.latitude || 15.2993,
        destination_lon: destinationGeo?.longitude || 74.124,
        country_code: destinationGeo?.country_code || 'IN',
        departure_city: departureCity || 'Mumbai',
        start_date: startDate,
        end_date: endDate,
        travelers: travelersCount,
        budget_min: budgetMin,
        budget_max: budgetMax,
        activities,
        travel_style: travelStyle,
        selected_flight: selectedFlight,
        selected_hotel: selectedHotel,
      });

      setGeneratedTripPlan(resp.trip_plan);
      if (resp.recommended_flight && !selectedFlight) {
        setSelectedFlight(resp.recommended_flight);
      }
      if (resp.recommended_hotel && !selectedHotel) {
        setSelectedHotel(resp.recommended_hotel);
      }
      showToast('success', 'Your custom trip plan has been generated!', 'Trip Ready');
    } catch {
      showToast(
        'error',
        'Unable to complete recommendation generation. Please try again.',
        'Generation Error'
      );
    } finally {
      setIsRecommending(false);
    }
  };

  const computeTripCostBreakdown = () => {
    let transportCost = 0;
    if (transportMode === 'train' && isDomesticIndia) {
      transportCost = selectedTrain?.price
        ? selectedTrain.price * travelersCount
        : Math.round(budgetMax * 0.12);
    } else {
      transportCost = selectedFlight?.price
        ? selectedFlight.price * travelersCount
        : Math.round(budgetMax * flightBudgetRatio);
    }

    const durationDays = calculateTripDays(startDate, endDate);
    const hotelCost = selectedHotel?.price_per_night
      ? selectedHotel.price_per_night * Math.max(1, durationDays - 1)
      : Math.round(budgetMax * hotelBudgetRatio);
    const activitiesCost = activities.reduce((sum, a) => sum + (a.cost || 500), 0) * travelersCount;
    const taxesCost = Math.round((transportCost + hotelCost + activitiesCost) * 0.08);
    const totalCost = transportCost + hotelCost + activitiesCost + taxesCost;

    return {
      flights: transportCost,
      hotel: hotelCost,
      activities: activitiesCost,
      taxes: taxesCost,
      total: totalCost,
    };
  };

  const handleSaveTrip = async (payNow: boolean = false) => {
    setIsSaved(true);
    const breakdown = computeTripCostBreakdown();
    const tripPayload: CreateTripPayload = {
      title: `${destination} Custom Journey`,
      destination: destination,
      start_date: startDate,
      end_date: endDate,
      days: calculateTripDays(startDate, endDate),
      travelers_count: travelersCount,
      budget: `₹${breakdown.total.toLocaleString('en-IN')}`,
      status: 'Upcoming',
      payment_status: 'Pending',
      cost_breakdown: breakdown,
      image_url: activities[0]?.preview_image || getDestinationImage(destination),
      itinerary_summary: `${travelStyle} personalized journey with stay at ${selectedHotel?.name || 'Curated Resort'} and ${
        transportMode === 'train' && isDomesticIndia && selectedTrain
          ? `Indian Railways (${selectedTrain.train_name} #${selectedTrain.train_number})`
          : `flight with ${selectedFlight?.airline || 'Express Carrier'}`
      }.`,
      tags: [
        travelStyle,
        transportMode === 'train' && isDomesticIndia ? 'Indian Railways' : 'Air Travel',
        `${travelersCount} Traveler${travelersCount > 1 ? 's' : ''}`,
      ],
      stops: activities.map((a) => a.name).slice(0, 5),
    };

    let createdId = '';
    try {
      const created = await createTrip(tripPayload);
      createdId = created.id;
    } catch (err) {
      console.error('Failed to save trip to backend:', err);
      // Fallback to localStorage just in case network is down
      try {
        const localTrip = { id: `trip-${Date.now()}`, ...tripPayload };
        createdId = localTrip.id;
        const existing = JSON.parse(localStorage.getItem('goflexi_custom_trips') || '[]');
        localStorage.setItem('goflexi_custom_trips', JSON.stringify([localTrip, ...existing]));
      } catch {
        // Ignore
      }
    }

    if (payNow) {
      initiateRazorpayPayment({
        amount: breakdown.total,
        tripId: createdId,
        title: `${destination} Custom Journey`,
        destination: destination,
        user: user ? { name: user.name, email: user.email } : null,
        onSuccess: async (paymentId: string) => {
          showToast(
            'success',
            `Payment confirmed for ${destination}! Ref: ${paymentId}`,
            'Payment Confirmed'
          );
          setTimeout(() => {
            navigate(`/user/billing?tripId=${createdId || ''}&paid=true`);
          }, 800);
        },
        onError: (errorMsg: string) => {
          setIsSaved(false);
          showToast('error', errorMsg, 'Payment Failed');
        },
        onDismiss: () => {
          setIsSaved(false);
          showToast(
            'info',
            'Trip plan saved as pending! You can pay whenever you are ready in the Billing section.',
            'Payment Closed'
          );
          setTimeout(() => {
            navigate(`/user/billing?tripId=${createdId || ''}`);
          }, 800);
        },
      });
    } else {
      showToast(
        'info',
        `Payment skipped. Your trip is saved as pending and queued in your Billing section!`,
        'Trip Saved (Pay Later)'
      );
      setTimeout(() => {
        navigate(`/user/billing?tripId=${createdId || ''}`);
      }, 1000);
    }
  };

  // -----------------------------------------------------------
  // Navigation Handler
  // -----------------------------------------------------------
  const handleNext = () => {
    if (step < totalSteps) {
      nextStep();
    } else {
      if (!generatedTripPlan) {
        handleGenerateRecommendation();
      } else {
        handleSaveTrip(false);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          8-Step Recommendation Engine
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
          Plan Your Next Journey
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Real-time weather insights, flight matching, curated stays, and local activities tailored to your style.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
          <span>
            Step {step} of {totalSteps}: {
              [
                'Destination & Activities',
                'Dates & Weather Outlook',
                'Party Size',
                'Budget Range',
                'Hidden Gems Discovery',
                'Travel Style',
                'Recommended Flights',
                'Recommended Stays & Itinerary',
              ][step - 1]
            }
          </span>
          <span className="text-brand-600">{Math.round((step / totalSteps) * 100)}% Complete</span>
        </div>
        <ProgressBar currentStep={step} totalSteps={totalSteps} />
      </div>

      {/* Wizard Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-10 min-h-[460px] flex flex-col justify-between">
        {/* ========================================================= */}
        {/* STEP 1: DESTINATION & POPULAR ACTIVITIES */}
        {/* ========================================================= */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-1">
                Step 1 of {totalSteps}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-navy-950">
                Where are you heading?
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Type any destination worldwide or pick a popular region to reveal iconic sights.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Destination Input with Live Autocomplete & Manual Clear */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Destination City or Region
                  </label>
                  <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-100">
                    Manual Entry Supported
                  </span>
                </div>
                <div className="relative">
                  <Input
                    placeholder="Type any city e.g. Goa, Manali, Paris, Tokyo..."
                    value={destination}
                    onChange={(e) => handleDestinationInputChange(e.target.value)}
                    onFocus={() => destSuggestions.length > 0 && setShowDestDropdown(true)}
                    icon={<MapPin className="w-4 h-4 text-brand-600" />}
                    rightElement={
                      destination ? (
                        <button
                          type="button"
                          onClick={() => {
                            setDestination('');
                            setDestSuggestions([]);
                            setShowDestDropdown(false);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                          title="Clear to enter custom destination"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      ) : undefined
                    }
                  />
                  {loadingDestSearch && (
                    <div className="absolute right-9 top-1/2 -translate-y-1/2 text-slate-400">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    </div>
                  )}
                </div>
                {showDestDropdown && destSuggestions.length > 0 && (
                  <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 max-h-56 overflow-y-auto divide-y divide-slate-100">
                    {destSuggestions.map((item) => (
                      <button
                        key={`${item.latitude}-${item.longitude}-${item.name}`}
                        type="button"
                        onClick={() => handleSelectGeocodedDest(item)}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-navy-950">{item.name}</span>
                          <span className="text-slate-500 block text-[11px]">
                            {[item.admin1, item.country].filter(Boolean).join(', ')}
                          </span>
                        </div>
                        <Badge variant="neutral" size="sm">
                          {item.country_code || 'GEO'}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Enter any custom place name or choose from popular hubs below.
                </span>
              </div>

              {/* Departing From Field with Option 1: Manual Input & Option 2: Current Location Button */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Departing From (Origin City)
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectCurrentLocation}
                    disabled={isLocatingDeparture}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
                    title="Track my GPS location and auto-fill current city"
                  >
                    <LocateFixed className={`w-3.5 h-3.5 ${isLocatingDeparture ? 'animate-spin text-brand-600' : 'text-brand-600'}`} />
                    <span>{isLocatingDeparture ? 'Tracking GPS...' : '📍 Use Current Location'}</span>
                  </button>
                </div>
                <Input
                  placeholder="e.g. Mumbai, Delhi, Bengaluru, London..."
                  value={departureCity}
                  onChange={(e) => {
                    setDepartureCity(e.target.value);
                    if (detectedLocationLabel) setDetectedLocationLabel(null);
                  }}
                  icon={<Plane className="w-4 h-4 text-slate-400" />}
                  rightElement={
                    departureCity ? (
                      <button
                        type="button"
                        onClick={() => {
                          setDepartureCity('');
                          setDetectedLocationLabel(null);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                        title="Clear to enter custom departure city"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : undefined
                  }
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>
                    {detectedLocationLabel ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Auto-detected: {detectedLocationLabel}
                      </span>
                    ) : (
                      'Used for live flight route matching & pricing.'
                    )}
                  </span>
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-slate-400">Hubs:</span>
                    {['Mumbai', 'Delhi', 'Bengaluru'].map((hub) => (
                      <button
                        key={hub}
                        type="button"
                        onClick={() => {
                          setDepartureCity(hub);
                          setDetectedLocationLabel(null);
                        }}
                        className="text-brand-600 hover:underline font-semibold cursor-pointer"
                      >
                        {hub}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Destinations Chips */}
            <div>
              <span className="text-xs font-semibold text-slate-500 block mb-2">
                Or select a featured destination:
              </span>
              <div className="flex flex-wrap gap-2">
                {popularDestinations.map((dest) => (
                  <button
                    key={dest}
                    type="button"
                    onClick={() => handleSelectFeaturedDest(dest)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      destination.toLowerCase() === dest.toLowerCase()
                        ? 'bg-navy-950 text-white border-navy-950 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <img
                      src={getDestinationImage(dest)}
                      alt={dest}
                      className="w-4 h-4 rounded-full object-cover shrink-0 shadow-2xs"
                    />
                    <span>{dest}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Activities & Sights Grid */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-navy-950">
                    Iconic Attractions in {destination}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Select highlights you'd like woven into your day-by-day plan.
                  </p>
                </div>
                {activities.length > 0 && (
                  <Badge variant="accent" size="sm">
                    {activities.length} activity selected
                  </Badge>
                )}
              </div>

              {loadingPopularPois ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="h-44 rounded-2xl bg-slate-100 animate-pulse border border-slate-200"
                    />
                  ))}
                </div>
              ) : popularPois.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[380px] overflow-y-auto p-1">
                  {popularPois.map((poi) => (
                    <ActivityCard
                      key={poi.xid}
                      poi={poi}
                      isSelected={activities.some((a) => a.xid === poi.xid || a.name === poi.name)}
                      onToggle={(p) => {
                        toggleActivity({
                          xid: p.xid,
                          name: p.name,
                          popularity: p.popularity,
                          kinds: p.kinds,
                          latitude: p.latitude,
                          longitude: p.longitude,
                          description: `${p.popularity} attraction in ${destination}`,
                        });
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-500">
                  Select a destination above to discover iconic attractions.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: DATES & DATE INSIGHT */}
        {/* ========================================================= */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-1">
                Step 2 of {totalSteps}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-navy-950">
                When do you plan to travel?
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Choose dates to see live weather outlooks and crowd heuristics for {destination}.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Departure Date"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={startDate}
                onChange={(e) => {
                  const newStart = e.target.value;
                  if (newStart && newStart > endDate) {
                    const s = new Date(newStart);
                    s.setDate(s.getDate() + 4);
                    setDates(newStart, s.toISOString().split('T')[0]);
                  } else {
                    setDates(newStart, endDate);
                  }
                }}
                icon={<Calendar className="w-4 h-4" />}
              />
              <Input
                label="Return Date"
                type="date"
                min={startDate || new Date().toISOString().split('T')[0]}
                value={endDate}
                onChange={(e) => setDates(startDate, e.target.value)}
                icon={<Calendar className="w-4 h-4" />}
              />
            </div>

            {/* Trip Duration Banner */}
            <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-100 flex items-center gap-3 text-xs text-brand-900">
              <Clock className="w-5 h-5 text-brand-600 flex-shrink-0" />
              <span>
                Estimated Trip Duration: <strong className="font-bold">{calculateDuration()}</strong>.
                Tailored for balanced pacing and comfortable travel.
              </span>
            </div>

            {/* Date Insight Panel (Weather & Crowd Heuristics) */}
            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/90 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-navy-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Live Travel Climate &amp; Crowd Outlook
                </span>
                {loadingDateInsight && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Fetching climate data...
                  </span>
                )}
              </div>

              {dateInsight && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Weather Card */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Weather Outlook</span>
                      <Badge variant="neutral" size="sm">
                        {dateInsight.weather.is_forecast ? '16-Day Forecast' : 'Typical Seasonal Weather'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      {getWeatherIcon(dateInsight.weather.condition)}
                      <div>
                        <div className="text-lg font-extrabold text-navy-950">
                          {dateInsight.weather.temp_min}°C – {dateInsight.weather.temp_max}°C
                        </div>
                        <div className="text-xs text-slate-600 font-medium">
                          {dateInsight.weather.condition}
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 pt-1">
                      Precipitation Probability: {dateInsight.weather.precipitation_probability}%
                    </div>
                  </div>

                  {/* Crowd Level Card */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Crowd Level Estimate</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${getCrowdBadgeColor(
                          dateInsight.crowd_label
                        )}`}
                      >
                        {dateInsight.crowd_label} Density ({dateInsight.crowd_score}/100)
                      </span>
                    </div>

                    {dateInsight.holiday_overlap ? (
                      <div className="flex items-start gap-2 pt-1 text-xs text-amber-900 bg-amber-50/60 p-2 rounded-lg border border-amber-200/60">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-semibold">Public Holiday Overlap</strong>
                          <span className="text-[11px] text-amber-800">
                            {dateInsight.holidays.length > 0
                              ? `National holiday: ${dateInsight.holidays.join(', ')}`
                              : 'High visitor demand expected over holiday dates.'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600 pt-1">
                        Regular travel period without major public holiday congestion detected.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* MANDATORY DISCLAIMER: Visible in small muted type */}
              <div className="pt-1 text-[11px] text-slate-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                <span>
                  {dateInsight?.crowd_disclaimer ||
                    'Crowd level is a seasonal + public-holiday estimate, not live occupancy data.'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: TRAVELERS */}
        {/* ========================================================= */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-1">
                Step 3 of {totalSteps}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-navy-950">
                How many travelers are in your party?
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Sets flight seat counts, hotel room allocations, and itinerary pacing.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { count: 1, label: 'Solo Traveler', desc: '1 Person' },
                { count: 2, label: 'Couple / Pair', desc: '2 People' },
                { count: 4, label: 'Small Group', desc: '3-4 People' },
                { count: 6, label: 'Family / Party', desc: '5+ People' },
              ].map((item) => (
                <button
                  key={item.count}
                  type="button"
                  onClick={() => setTravelers(item.count, item.label)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    travelersCount === item.count
                      ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <Users
                    className={`w-5 h-5 mb-2 ${
                      travelersCount === item.count ? 'text-brand-600' : 'text-slate-400'
                    }`}
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-900">{item.label}</div>
                    <div className="text-[11px] text-slate-500">{item.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            <Input
              label="Exact number of travelers"
              type="number"
              min={1}
              max={25}
              value={travelersCount}
              onChange={(e) => setTravelers(parseInt(e.target.value, 10) || 1)}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 4: BUDGET (LIVE PREVIEW BOUNDS & SLIDER) */}
        {/* ========================================================= */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-1">
                Step 4 of {totalSteps}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-navy-950">
                What is your estimated total budget?
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Calibrated with live price previews for flights ({departureCity} → {destination}) and stays for {travelersCount} traveler{travelersCount > 1 ? 's' : ''}.
              </p>
            </div>

            {loadingBudgetPreview ? (
              <div className="p-8 text-center text-xs text-slate-500 animate-pulse bg-slate-50 rounded-2xl border border-slate-200">
                Calculating live flight &amp; hotel price preview bounds...
              </div>
            ) : (
              <div className="space-y-6">
                {/* Live Preview Bounds Overview */}
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Live Market Estimate
                    </span>
                    <span className="text-sm font-bold text-navy-950">
                      ₹{(budgetPreview?.min_price || budgetMin).toLocaleString('en-IN')} – ₹
                      {(budgetPreview?.max_price || budgetMax).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-right text-[11px] text-slate-500">
                    <div>Flights: ~₹{(budgetPreview?.flight_min || 7000).toLocaleString('en-IN')}</div>
                    <div>Stays: ~₹{(budgetPreview?.hotel_min || 6000).toLocaleString('en-IN')}</div>
                  </div>
                </div>

                {/* Slider / Range Selector */}
                <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/90 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Selected Target Budget:</span>
                    <span className="font-extrabold text-navy-950 text-base">
                      ₹{budgetMin.toLocaleString('en-IN')} – ₹{budgetMax.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="range"
                      min={budgetPreview?.min_price || 10000}
                      max={budgetPreview?.max_price || 120000}
                      step={1000}
                      value={budgetMax}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setBudgetRange(budgetMin, Math.max(budgetMin + 2000, val));
                      }}
                      className="w-full accent-navy-950 cursor-pointer"
                    />

                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Min: ₹{(budgetPreview?.min_price || 10000).toLocaleString('en-IN')}</span>
                      <span>Max: ₹{(budgetPreview?.max_price || 120000).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Budget Presets based on live bounds */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    {[
                      {
                        label: 'Value',
                        min: budgetPreview?.min_price || 15000,
                        max: Math.round((budgetPreview?.min_price || 15000) * 1.4),
                      },
                      {
                        label: 'Comfort',
                        min: Math.round((budgetPreview?.min_price || 15000) * 1.3),
                        max: Math.round((budgetPreview?.max_price || 60000) * 0.7),
                      },
                      {
                        label: 'Premium',
                        min: Math.round((budgetPreview?.max_price || 60000) * 0.6),
                        max: Math.round((budgetPreview?.max_price || 60000) * 0.9),
                      },
                      {
                        label: 'Bespoke',
                        min: Math.round((budgetPreview?.max_price || 60000) * 0.8),
                        max: budgetPreview?.max_price || 90000,
                      },
                    ].map((tier) => (
                      <button
                        key={tier.label}
                        type="button"
                        onClick={() => setBudgetRange(tier.min, tier.max)}
                        className={`p-3 rounded-xl border text-center transition-all text-xs ${
                          budgetMin === tier.min && budgetMax === tier.max
                            ? 'border-brand-500 bg-brand-50/70 font-bold text-brand-900 ring-2 ring-brand-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="font-bold">{tier.label}</div>
                        <div className="text-[10px] text-slate-500">
                          ₹{tier.min.toLocaleString('en-IN')}–₹{tier.max.toLocaleString('en-IN')}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 5: HIDDEN GEMS & WIKIVOYAGE LOCAL TIP */}
        {/* ========================================================= */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-1">
                Step 5 of {totalSteps}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-navy-950">
                Hidden gems near {destination}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Discover lesser-known vantage points, historic corners, and regional secrets.
              </p>
            </div>

            {/* Wikivoyage Local Tip Blurb */}
            {wikiSummary && wikiSummary.extract && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3.5 text-xs text-amber-950">
                <Compass className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-900 uppercase text-[10px] tracking-wider">
                      Wikivoyage Local Guide Blurb
                    </span>
                    <span className="text-[10px] text-amber-700 font-semibold">• {wikiSummary.title}</span>
                  </div>
                  <p className="text-xs text-amber-900/90 leading-relaxed line-clamp-3">
                    {wikiSummary.extract}
                  </p>
                </div>
              </div>
            )}

            {/* Hidden Gems Activity Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>Select off-the-beaten-path experiences:</span>
                <span className="font-bold text-navy-900">{activities.length} total experiences selected</span>
              </div>

              {loadingHiddenPois ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="h-44 rounded-2xl bg-slate-100 animate-pulse border border-slate-200"
                    />
                  ))}
                </div>
              ) : hiddenPois.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[380px] overflow-y-auto p-1">
                  {hiddenPois.map((poi) => (
                    <ActivityCard
                      key={poi.xid}
                      poi={poi}
                      isSelected={activities.some((a) => a.xid === poi.xid || a.name === poi.name)}
                      onToggle={(p) => {
                        toggleActivity({
                          xid: p.xid,
                          name: p.name,
                          popularity: p.popularity,
                          kinds: p.kinds,
                          latitude: p.latitude,
                          longitude: p.longitude,
                          description: `${p.popularity} spot near ${destination}`,
                        });
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-500">
                  No hidden gems currently available for this coordinate radius.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 6: TRAVEL STYLE */}
        {/* ========================================================= */}
        {step === 6 && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-1">
                Step 6 of {totalSteps}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-navy-950">
                Confirm your travel style
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Your selection weights flight scoring, airline cabin class, and accommodation star rating.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  name: 'Budget',
                  desc: 'Hostels, local transit, economy cabins, and high value-for-money.',
                  weightNote: '60% price weighting, economy cabin priority',
                },
                {
                  name: 'Balanced',
                  desc: '3-4 star boutique stays, private cab transfers, reliable flight routes.',
                  weightNote: 'Equal price & quality balance, non-stop preference',
                },
                {
                  name: 'Premium',
                  desc: '4-5 star resorts, premium excursions, private guides, and top airlines.',
                  weightNote: '50% quality weighting, premium economy/upgrades',
                },
                {
                  name: 'Luxury',
                  desc: 'Bespoke 5-star suites, private catamaran, VIP hospitality, and maximum comfort.',
                  weightNote: '60% quality weighting, business class priority',
                },
              ].map((style) => (
                <button
                  key={style.name}
                  type="button"
                  onClick={() => setTravelStyle(style.name)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    travelStyle === style.name
                      ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-slate-900">{style.name}</span>
                      {travelStyle === style.name && (
                        <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{style.desc}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-brand-700 font-semibold">
                    {style.weightNote}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 7: RECOMMENDED TRANSIT (FLIGHT OR TRAIN) */}
        {/* ========================================================= */}
        {step === 7 && (
          <div className="space-y-6">
            {/* Conditional Transport Mode Selector for India */}
            {isDomesticIndia ? (
              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Preferred Transit Mode for {destination}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Domestic route within India: Choose between Flights or Indian Railways.
                  </div>
                </div>

                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setTransportMode('flight')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      transportMode === 'flight'
                        ? 'bg-white text-navy-950 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Plane className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Flight / Air</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTransportMode('train')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      transportMode === 'train'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Train className="w-3.5 h-3.5" />
                    <span>Indian Railways</span>
                  </button>
                </div>
              </div>
            ) : null}

            {transportMode === 'train' && isDomesticIndia ? (
              <TrainSearchPanel
                initialOrigin={departureCity}
                initialDestination={destination}
                initialDepartDate={startDate}
                initialAdults={travelersCount}
                budgetMax={Math.round(budgetMax * 0.15)}
                travelStyle={travelStyle}
                selectedTrainId={selectedTrain?.id}
                onSelectTrain={(train) => {
                  setSelectedTrain(train);
                  showToast(
                    'success',
                    `Selected ${train.train_name} #${train.train_number} (₹${train.price.toLocaleString('en-IN')})`,
                    'Train Selected'
                  );
                }}
              />
            ) : (
              <FlightSearchPanel
                initialOrigin={departureCity}
                initialDestination={destination}
                initialDepartDate={startDate}
                initialReturnDate={endDate}
                initialAdults={travelersCount}
                budgetMax={Math.round(budgetMax * flightBudgetRatio)}
                travelStyle={travelStyle}
                selectedFlightId={selectedFlight?.id}
                onSelectFlight={(flight) => {
                  setSelectedFlight(flight);
                  showToast(
                    'success',
                    `Selected ${flight.airline} flight (₹${flight.price.toLocaleString('en-IN')})`,
                    'Flight Chosen'
                  );
                }}
              />
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 8: RECOMMENDED STAYS & FINAL TRIP PLAN */}
        {/* ========================================================= */}
        {step === 8 && (
          <div className="space-y-6">
            {!generatedTripPlan ? (
              <div className="space-y-6">
                <HotelSearchPanel
                  initialDestination={destination}
                  initialCheckIn={startDate}
                  initialCheckOut={endDate}
                  initialAdults={travelersCount}
                  initialRooms={Math.max(1, Math.ceil(travelersCount / 2))}
                  budgetMax={Math.round(budgetMax * hotelBudgetRatio)}
                  travelStyle={travelStyle}
                  selectedHotelId={selectedHotel?.id}
                  onSelectHotel={(hotel) => {
                    setSelectedHotel(hotel);
                    showToast(
                      'success',
                      `Selected ${hotel.name} (₹${hotel.price_per_night.toLocaleString('en-IN')}/night)`,
                      'Accommodation Chosen'
                    );
                  }}
                />

                {/* Generate Recommendation CTA */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-navy-950 via-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[11px] font-bold uppercase tracking-wider">
                      <Sparkles className="w-3 h-3 text-indigo-300" />
                      Final Recommendation Step
                    </div>
                    <h3 className="text-lg font-bold">Ready to assemble your complete itinerary?</h3>
                    <p className="text-xs text-slate-300">
                      Synthesizes your selected flights, accommodation, {activities.length} activities, and {travelStyle} pacing.
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleGenerateRecommendation}
                    disabled={isRecommending}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl px-6 flex-shrink-0 shadow-lg shadow-indigo-600/30"
                  >
                    {isRecommending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating Graph...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate My Trip Plan
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              /* Generated Itinerary Plan Display */
              <div className="space-y-6">
                {/* Celebration Header */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-900/90 to-teal-950 text-white border border-emerald-700/50 shadow-lg space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                        <Check className="w-4 h-4 text-emerald-300 stroke-[3]" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                          Your Custom Trip Plan is Ready!
                        </h2>
                        <span className="text-xs text-emerald-200">
                          {generatedTripPlan.origin} → {generatedTripPlan.destination} • {generatedTripPlan.duration_days} Days
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSaveTrip(false)}
                        disabled={isSaved}
                        className="rounded-xl text-xs bg-white text-emerald-950 hover:bg-emerald-50 font-semibold"
                      >
                        <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                        {isSaved ? 'Saved!' : 'Skip Payment (Pay Later)'}
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleSaveTrip(true)}
                        disabled={isSaved}
                        className="rounded-xl text-xs bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-bold shadow-md"
                      >
                        <CreditCard className="w-3.5 h-3.5 mr-1" />
                        Proceed to Payment
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setGeneratedTripPlan(null)}
                        className="rounded-xl text-xs text-emerald-200 hover:text-white hover:bg-emerald-800/40"
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1" />
                        Adjust Selections
                      </Button>
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-700/40 text-xs text-emerald-100">
                    <div>
                      <span className="text-[10px] text-emerald-300 block uppercase">Travelers</span>
                      <span className="font-bold">{travelersCount} Person{travelersCount > 1 ? 's' : ''}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-300 block uppercase">Travel Style</span>
                      <span className="font-bold">{travelStyle}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-300 block uppercase">
                        {transportMode === 'train' && isDomesticIndia ? 'Indian Railways' : 'Flight'}
                      </span>
                      <span className="font-bold truncate block">
                        {transportMode === 'train' && isDomesticIndia
                          ? (selectedTrain ? `${selectedTrain.train_name} (#${selectedTrain.train_number})` : 'Recommended Train Route')
                          : (selectedFlight ? `${selectedFlight.airline} (₹${selectedFlight.price.toLocaleString('en-IN')})` : 'Recommended Route')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-300 block uppercase">Accommodation</span>
                      <span className="font-bold truncate block">
                        {selectedHotel ? selectedHotel.name : 'Curated Resort'}
                      </span>
                    </div>
                  </div>

                  {/* Estimated Cost Breakdown Strip */}
                  <div className="p-3 bg-emerald-950/60 rounded-xl border border-emerald-700/40 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                      <Wallet className="w-4 h-4" />
                      <span>Total Estimated Cost:</span>
                      <span className="text-white text-sm font-extrabold ml-1">
                        ₹{computeTripCostBreakdown().total.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-emerald-200/80">
                      <span>{transportMode === 'train' && isDomesticIndia ? 'Trains' : 'Flights'}: ₹{computeTripCostBreakdown().flights.toLocaleString('en-IN')}</span>
                      <span>•</span>
                      <span>Stays: ₹{computeTripCostBreakdown().hotel.toLocaleString('en-IN')}</span>
                      <span>•</span>
                      <span>Activities: ₹{computeTripCostBreakdown().activities.toLocaleString('en-IN')}</span>
                      <span>•</span>
                      <span>Taxes: ₹{computeTripCostBreakdown().taxes.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Day-by-day Itinerary Tree Container */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl h-[520px] flex flex-col">
                  <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      Day-by-Day Timeline Graph
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {generatedTripPlan.nodes.length} plan nodes • Click any item to inspect coordinates
                    </span>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <TripPlanTree
                      plan={generatedTripPlan}
                      selectedLocation={selectedPlanLocation}
                      onSelectLocation={(loc) => setSelectedPlanLocation(loc)}
                      isLoading={isRecommending}
                    />
                  </div>
                </div>

                {/* Selected Node Details Callout */}
                {selectedPlanLocation && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start justify-between gap-4">
                    <div>
                      <div className="font-bold text-navy-950">{selectedPlanLocation.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {selectedPlanLocation.description || selectedPlanLocation.city}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        GPS: {selectedPlanLocation.latitude.toFixed(4)}, {selectedPlanLocation.longitude.toFixed(4)}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedPlanLocation(null)}
                      className="text-xs"
                    >
                      Dismiss
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-8 mt-8 border-t border-slate-100 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={step === 1}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>

          {step === totalSteps && generatedTripPlan ? (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleSaveTrip(false)}
                disabled={isSaved}
                className="rounded-xl px-5 border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
              >
                <span>Skip Payment (Pay Later)</span>
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => handleSaveTrip(true)}
                disabled={isSaved}
                className="rounded-xl px-6 bg-emerald-600 hover:bg-emerald-500 font-bold shadow-lg shadow-emerald-600/20 text-white inline-flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Proceed to Payment (₹{computeTripCostBreakdown().total.toLocaleString('en-IN')})</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              size="lg"
              onClick={handleNext}
              disabled={isRecommending}
              className="rounded-xl px-6 bg-navy-900 hover:bg-navy-800"
            >
              <span>
                {step === totalSteps
                  ? 'Generate My Trip Plan'
                  : 'Continue'}
              </span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Root Export: Wraps Content with TripWizardProvider
// -------------------------------------------------------------
export const TravelerNewTripPage: React.FC = () => {
  return (
    <TripWizardProvider>
      <TravelerNewTripWizardContent />
    </TripWizardProvider>
  );
};

export default TravelerNewTripPage;
