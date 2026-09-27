import React, { useState, useEffect, useRef } from 'react';
import {
  Train,
  Calendar,
  Users,
  Search,
  ArrowRight,
  Clock,
  Sparkles,
  Check,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Info,
  MapPin,
  X,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingState } from '../ui/LoadingState';
import { EmptyState } from '../ui/EmptyState';
import { Modal } from '../ui/Modal';
import { useToast } from '../../context/ToastContext';
import { searchTrains, getTrainSchedule } from '../../services/travel-search';
import { TrainOption, TrainScheduleStop } from '../../types/travel-search';

export interface TrainSearchPanelProps {
  initialOrigin?: string;
  initialDestination?: string;
  initialDepartDate?: string;
  initialAdults?: number;
  onSelectTrain?: (train: TrainOption) => void;
  selectedTrainId?: string;
  budgetMax?: number;
  travelStyle?: string;
}

export const TrainSearchPanel: React.FC<TrainSearchPanelProps> = ({
  initialOrigin = 'Mumbai',
  initialDestination = 'Goa',
  initialDepartDate = '2026-10-15',
  initialAdults = 1,
  onSelectTrain,
  selectedTrainId,
  budgetMax,
  travelStyle = 'Balanced',
}) => {
  const { showToast } = useToast();

  const [origin, setOrigin] = useState(initialOrigin);
  const [destination, setDestination] = useState(initialDestination);
  const [departDate, setDepartDate] = useState(initialDepartDate);
  const [adults, setAdults] = useState(initialAdults);
  const [selectedClass, setSelectedClass] = useState<string>('ALL');

  const [isLoading, setIsLoading] = useState(false);
  const [trains, setTrains] = useState<TrainOption[] | null>(null);
  const [isDomesticIndia, setIsDomesticIndia] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal for inspecting train station timetable / halts
  const [scheduleModalTrain, setScheduleModalTrain] = useState<TrainOption | null>(null);
  const [stopsList, setStopsList] = useState<TrainScheduleStop[] | null>(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Sync props when parent updates
  useEffect(() => {
    if (initialOrigin) setOrigin(initialOrigin);
  }, [initialOrigin]);

  useEffect(() => {
    if (initialDestination) setDestination(initialDestination);
  }, [initialDestination]);

  useEffect(() => {
    if (initialDepartDate) setDepartDate(initialDepartDate);
  }, [initialDepartDate]);

  useEffect(() => {
    if (initialAdults) setAdults(initialAdults);
  }, [initialAdults]);

  const executeTrainSearch = async (
    origQuery = origin,
    destQuery = destination,
    dateQuery = departDate,
    paxQuery = adults
  ) => {
    if (!origQuery.trim() || !destQuery.trim()) {
      showToast('error', 'Please provide both origin and destination', 'Validation');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await searchTrains({
        origin: origQuery.trim(),
        destination: destQuery.trim(),
        depart_date: dateQuery,
        travelers: paxQuery,
        train_class: selectedClass !== 'ALL' ? selectedClass : undefined,
      });

      setIsDomesticIndia(response.is_domestic_india);
      if (!response.is_domestic_india) {
        setTrains([]);
        setErrorMessage('Train journeys are only available within India. Please switch to Flight search for international destinations.');
      } else {
        setTrains(response.results);
      }
    } catch (err: any) {
      console.error('Failed to search trains:', err);
      setErrorMessage(
        err?.response?.data?.detail || 'Could not fetch Indian Railway schedules. Please check connection.'
      );
      setTrains([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial search on mount
  useEffect(() => {
    executeTrainSearch();
  }, [origin, destination, departDate]);

  // Open schedule modal
  const handleOpenSchedule = async (train: TrainOption) => {
    setScheduleModalTrain(train);
    if (train.schedule && train.schedule.length > 0) {
      setStopsList(train.schedule);
      return;
    }

    setLoadingSchedule(true);
    try {
      const liveStops = await getTrainSchedule(train.train_number);
      setStopsList(liveStops);
    } catch (e) {
      console.warn('Could not load detailed halts:', e);
      setStopsList(null);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const filteredTrains = (trains || []).filter((train) => {
    if (selectedClass === 'ALL') return true;
    return train.available_classes.includes(selectedClass);
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950 via-orange-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-amber-800/40 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center shrink-0">
            <Train className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold">Indian Railways (IRCTC) Timetable</h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                India Rail
              </span>
            </div>
            <p className="text-xs text-amber-200/80 mt-0.5">
              Live timetables, Vande Bharat expresses, and IRCTC station schedules.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-amber-300 font-semibold">
            {origin} → {destination}
          </span>
        </div>
      </div>

      {/* Search Bar & Class Filter */}
      <Card className="p-4 sm:p-5 bg-white border border-slate-200/90 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Origin Station / City
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <Input
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="e.g. Mumbai CSMT"
                className="pl-9 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Destination Station / City
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <Input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Goa (Madgaon MAO)"
                className="pl-9 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Date of Journey
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <Input
                type="date"
                value={departDate}
                onChange={(e) => setDepartDate(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
          </div>

          <div className="flex items-end">
            <Button
              variant="primary"
              onClick={() => executeTrainSearch()}
              disabled={isLoading}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs h-10 rounded-xl inline-flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Searching...' : 'Search Trains'}</span>
            </Button>
          </div>
        </div>

        {/* Travel Class Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Class:
          </span>
          {[
            { id: 'ALL', label: 'All Classes' },
            { id: 'CC', label: 'AC Chair Car (CC)' },
            { id: 'EC', label: 'Exec. Chair Car (EC)' },
            { id: '3A', label: '3-Tier AC (3A)' },
            { id: '2A', label: '2-Tier AC (2A)' },
            { id: '1A', label: '1st AC (1A)' },
            { id: 'SL', label: 'Sleeper (SL)' },
            { id: '2S', label: 'Second Sitting (2S)' },
          ].map((cls) => (
            <button
              key={cls.id}
              type="button"
              onClick={() => setSelectedClass(cls.id)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all text-xs ${
                selectedClass === cls.id
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cls.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Results Section */}
      {isLoading ? (
        <LoadingState message="Fetching Indian Railway schedules & timings..." />
      ) : !isDomesticIndia ? (
        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
          <h3 className="text-sm font-bold text-amber-900">
            Indian Railways Not Available for International Routes
          </h3>
          <p className="text-xs text-amber-700 max-w-md mx-auto">
            Train scheduling is exclusive to journeys within India. For trips to {destination},
            please select the <strong>Flight</strong> tab above.
          </p>
        </div>
      ) : filteredTrains.length === 0 ? (
        <EmptyState
          title="No Trains Found for This Date"
          description={`No direct trains scheduled between ${origin} and ${destination} on ${departDate}. Try an alternate date or adjust station names.`}
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => executeTrainSearch()}
              className="rounded-xl"
            >
              Retry Search
            </Button>
          }
        />
      ) : (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Showing <strong>{filteredTrains.length}</strong> trains on {origin} ↔ {destination}
            </span>
            <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Live time schedule available
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredTrains.map((train) => {
              const isSelected = selectedTrainId === train.id;
              const isVandeBharat = train.train_type?.includes('Vande');
              const isRajdhani = train.train_type?.includes('Rajdhani');

              return (
                <div
                  key={train.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 bg-white ${
                    isSelected
                      ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md bg-amber-50/20'
                      : 'border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-sm'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Train details & Badges */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-900 text-white">
                          #{train.train_number}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">
                          {train.train_name}
                        </h3>
                        <Badge
                          variant={isVandeBharat ? 'accent' : isRajdhani ? 'primary' : 'neutral'}
                          size="sm"
                          className={
                            isVandeBharat
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : isRajdhani
                              ? 'bg-red-100 text-red-900 border-red-300'
                              : ''
                          }
                        >
                          {train.train_type}
                        </Badge>
                      </div>

                      {/* Timetable Flow */}
                      <div className="flex items-center gap-3 sm:gap-6 pt-1">
                        <div>
                          <div className="text-base sm:text-lg font-extrabold text-slate-900">
                            {train.depart_time}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-500">
                            {train.origin_station_name} ({train.origin_station_code})
                          </div>
                        </div>

                        <div className="flex-1 max-w-[140px] text-center">
                          <span className="text-[10px] text-slate-400 font-semibold block">
                            {train.duration_formatted}
                          </span>
                          <div className="h-0.5 bg-amber-400 relative my-1">
                            <Train className="w-3.5 h-3.5 text-amber-600 absolute -top-1.5 left-1/2 -translate-x-1/2 bg-white rounded-full" />
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate">
                            Runs: {train.run_days.join(', ')}
                          </span>
                        </div>

                        <div>
                          <div className="text-base sm:text-lg font-extrabold text-slate-900">
                            {train.arrive_time}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-500">
                            {train.destination_station_name} ({train.destination_station_code})
                          </div>
                        </div>
                      </div>

                      {/* Classes */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Available:</span>
                        {train.available_classes.map((cls) => (
                          <span
                            key={cls}
                            className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {cls}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Right: Fare, Timetable Inspector, Selection */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                      <div className="text-left lg:text-right">
                        <div className="text-[10px] uppercase font-semibold text-slate-400">
                          Estimated Fare
                        </div>
                        <div className="text-base sm:text-xl font-extrabold text-navy-950">
                          ₹{train.price.toLocaleString('en-IN')}
                          <span className="text-xs text-slate-400 font-normal"> / person</span>
                        </div>
                        {adults > 1 && (
                          <div className="text-[10px] text-slate-500 font-medium">
                            ₹{(train.price * adults).toLocaleString('en-IN')} for {adults} Travelers
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenSchedule(train)}
                          className="rounded-xl text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        >
                          <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                          <span>View Halts</span>
                        </Button>

                        <Button
                          size="sm"
                          variant={isSelected ? 'secondary' : 'primary'}
                          onClick={() => onSelectTrain?.(train)}
                          className={`rounded-xl text-xs font-bold px-4 ${
                            isSelected
                              ? 'bg-amber-100 text-amber-950 border-amber-300'
                              : 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-3.5 h-3.5 mr-1" />
                              Selected
                            </>
                          ) : (
                            'Select Train'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Train Schedule / Intermediate Halts Modal */}
      {scheduleModalTrain && (
        <Modal
          isOpen={Boolean(scheduleModalTrain)}
          onClose={() => setScheduleModalTrain(null)}
          title={`Train #${scheduleModalTrain.train_number} — ${scheduleModalTrain.train_name}`}
          subtitle={`${scheduleModalTrain.origin_station_name} (${scheduleModalTrain.origin_station_code}) to ${scheduleModalTrain.destination_station_name} (${scheduleModalTrain.destination_station_code})`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
              <div>
                <span className="font-bold">Total Duration:</span> {scheduleModalTrain.duration_formatted}
              </div>
              <div>
                <span className="font-bold">Runs On:</span> {scheduleModalTrain.run_days.join(', ')}
              </div>
            </div>

            {loadingSchedule ? (
              <LoadingState message="Fetching station halts and arrival times..." />
            ) : stopsList && stopsList.length > 0 ? (
              <div className="max-h-[380px] overflow-y-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Station</th>
                      <th className="p-2.5">Arrival</th>
                      <th className="p-2.5">Departure</th>
                      <th className="p-2.5">Halt</th>
                      <th className="p-2.5">Distance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stopsList.map((stop, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-slate-800">
                          {stop.station_name}{' '}
                          <span className="text-[10px] text-amber-700 font-mono font-semibold">
                            ({stop.station_code})
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-600 font-mono">{stop.arrival_time}</td>
                        <td className="p-2.5 text-slate-600 font-mono">{stop.departure_time}</td>
                        <td className="p-2.5 text-slate-500">
                          {stop.halt_minutes > 0 ? `${stop.halt_minutes} min` : '--'}
                        </td>
                        <td className="p-2.5 text-slate-500 font-mono text-[11px]">{stop.distance_km} km</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-500">
                Direct express service timetable: Departs {scheduleModalTrain.origin_station_name} at {scheduleModalTrain.depart_time} and arrives {scheduleModalTrain.destination_station_name} at {scheduleModalTrain.arrive_time}.
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setScheduleModalTrain(null)}
                className="text-xs"
              >
                Close Timetable
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  onSelectTrain?.(scheduleModalTrain);
                  setScheduleModalTrain(null);
                }}
                className="text-xs bg-amber-600 hover:bg-amber-500 text-white font-bold"
              >
                Choose This Train
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
