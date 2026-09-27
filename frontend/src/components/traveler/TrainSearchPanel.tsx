import React, { useState, useEffect } from 'react';
import {
  Train,
  Calendar,
  Users,
  Search,
  Clock,
  Sparkles,
  Check,
  AlertCircle,
  MapPin,
  CalendarCheck,
  CalendarX,
  SlidersHorizontal,
  Info,
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
import { TrainOption, TrainScheduleStop, TrainSearchResponse } from '../../types/travel-search';

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
  const [onlyRunningToday, setOnlyRunningToday] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState(false);
  const [searchResponse, setSearchResponse] = useState<TrainSearchResponse | null>(null);
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

  // Formatter for readable Date & Day
  const getFormattedDateDisplay = (dateString: string) => {
    try {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('en-IN', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  const getDayNameOnly = (dateString: string) => {
    try {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('en-IN', { weekday: 'long' });
      }
      return '';
    } catch {
      return '';
    }
  };

  const executeTrainSearch = async (
    origQuery = origin,
    destQuery = destination,
    dateQuery = departDate,
    paxQuery = adults,
    onlyToday = onlyRunningToday
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
        only_running_today: onlyToday,
      });

      setSearchResponse(response);
      setIsDomesticIndia(response.is_domestic_india);
      if (!response.is_domestic_india) {
        setTrains([]);
        setErrorMessage(
          'Train journeys are only available within India. Please switch to Flight search for international destinations.'
        );
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

  // Trigger search on mount and when origin, destination, departDate change
  useEffect(() => {
    executeTrainSearch(origin, destination, departDate, adults, onlyRunningToday);
  }, [origin, destination, departDate, onlyRunningToday]);

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

  const selectedDayName = getDayNameOnly(departDate);

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
              <h2 className="text-base sm:text-lg font-bold">Indian Railways Live Timetable</h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Official Timetable
              </span>
            </div>
            <p className="text-xs text-amber-200/80 mt-0.5">
              Live date-specific schedules, Vande Bharat expresses, and day-of-week operation.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:items-end gap-1 shrink-0">
          <div className="text-xs text-amber-300 font-semibold flex items-center gap-1.5">
            <span>{origin}</span>
            <span>↔</span>
            <span>{destination}</span>
          </div>
          <div className="text-[11px] text-amber-200/70 font-mono">
            {getFormattedDateDisplay(departDate)}
          </div>
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
            {selectedDayName && (
              <span className="text-[10px] text-amber-700 font-bold block mt-1">
                Day: {selectedDayName}
              </span>
            )}
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

        {/* Travel Class Quick Filter Pills & Operating Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Class:
            </span>
            {[
              { id: 'ALL', label: 'All Classes' },
              { id: 'CC', label: 'AC Chair (CC)' },
              { id: 'EC', label: 'Exec. Chair (EC)' },
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

          {/* Toggle: Only show trains running on this date */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 font-medium">
            <input
              type="checkbox"
              checked={onlyRunningToday}
              onChange={(e) => setOnlyRunningToday(e.target.checked)}
              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
            />
            <span>
              Only show trains running on <strong>{selectedDayName || 'selected day'}</strong>
            </span>
          </label>
        </div>
      </Card>

      {/* Notice Banner */}
      {searchResponse?.notice && (
        <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/90 text-xs text-amber-900 flex items-start gap-2.5 shadow-2xs">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{searchResponse.notice}</p>
            <p className="text-[11px] text-amber-800/80 mt-0.5">
              Timetable and train schedules are actively synchronized with Indian Railway running days for{' '}
              <strong>{getFormattedDateDisplay(departDate)}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Results Section */}
      {isLoading ? (
        <LoadingState message={`Fetching Indian Railway schedules for ${getFormattedDateDisplay(departDate)}...`} />
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
          title={`No Trains Operating on ${selectedDayName || 'This Date'}`}
          description={`No direct trains scheduled between ${origin} and ${destination} on ${getFormattedDateDisplay(
            departDate
          )}. Try turning off the "Only show trains running today" filter or pick an alternate journey date.`}
          action={
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setOnlyRunningToday(false)}
                className="rounded-xl text-xs"
              >
                Show All Days Trains
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => executeTrainSearch()}
                className="rounded-xl text-xs bg-amber-600 hover:bg-amber-500 text-white"
              >
                Retry Search
              </Button>
            </div>
          }
        />
      ) : (
        <div className="space-y-3.5">
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 px-1 gap-2">
            <div>
              Showing <strong>{filteredTrains.length}</strong> trains on {origin} ↔ {destination} for{' '}
              <strong className="text-slate-800">{getFormattedDateDisplay(departDate)}</strong>
              {searchResponse && searchResponse.operating_today_count !== undefined && (
                <span className="text-amber-800 font-semibold ml-1.5">
                  ({searchResponse.operating_today_count} operating on {selectedDayName})
                </span>
              )}
            </div>
            <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Live day schedule active
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredTrains.map((train) => {
              const isSelected = selectedTrainId === train.id;
              const isVandeBharat = train.train_type?.includes('Vande');
              const isRajdhani = train.train_type?.includes('Rajdhani');
              const isTejas = train.train_type?.includes('Tejas');
              const runsToday = train.runs_on_selected_day ?? true;

              return (
                <div
                  key={train.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 bg-white ${
                    isSelected
                      ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md bg-amber-50/20'
                      : runsToday
                      ? 'border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-sm'
                      : 'border-slate-200/60 bg-slate-50/50 opacity-80'
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
                          variant={isVandeBharat ? 'accent' : isRajdhani || isTejas ? 'primary' : 'neutral'}
                          size="sm"
                          className={
                            isVandeBharat
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : isRajdhani
                              ? 'bg-red-100 text-red-900 border-red-300'
                              : isTejas
                              ? 'bg-orange-100 text-orange-900 border-orange-300'
                              : ''
                          }
                        >
                          {train.train_type}
                        </Badge>

                        {/* Day-of-week Running Status Badge */}
                        {runsToday ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <CalendarCheck className="w-3 h-3 text-emerald-600" />
                            Runs on {selectedDayName || 'Today'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                            <CalendarX className="w-3 h-3 text-rose-600" />
                            Does Not Run on {selectedDayName || 'Today'}
                          </span>
                        )}
                      </div>

                      {/* Timetable Flow with Dates and Days */}
                      <div className="flex items-center gap-3 sm:gap-6 pt-1">
                        <div>
                          <div className="text-base sm:text-lg font-extrabold text-slate-900">
                            {train.depart_time}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-600">
                            {train.origin_station_name} ({train.origin_station_code})
                          </div>
                          <div className="text-[10px] text-amber-800/80 font-medium">
                            {train.journey_day ? `${train.journey_day.slice(0, 3)}, ${train.journey_date}` : 'Departs'}
                          </div>
                        </div>

                        <div className="flex-1 max-w-[160px] text-center">
                          <span className="text-[10px] text-slate-500 font-bold block">
                            {train.duration_formatted}
                          </span>
                          <div className="h-0.5 bg-amber-400 relative my-1.5">
                            <Train className="w-3.5 h-3.5 text-amber-600 absolute -top-1.5 left-1/2 -translate-x-1/2 bg-white rounded-full" />
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate">
                            Runs: {train.run_days.join(', ')}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-base sm:text-lg font-extrabold text-slate-900">
                              {train.arrive_time}
                            </span>
                            {train.days_offset !== undefined && train.days_offset > 0 && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                +{train.days_offset} Day
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-600">
                            {train.destination_station_name} ({train.destination_station_code})
                          </div>
                          <div className="text-[10px] text-amber-800/80 font-medium">
                            {train.arrival_day ? `${train.arrival_day.slice(0, 3)}, ${train.arrival_date}` : 'Arrives'}
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
                        <div className="text-base sm:text-xl font-extrabold text-slate-900">
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
                          disabled={!runsToday}
                          className={`rounded-xl text-xs font-bold px-4 ${
                            isSelected
                              ? 'bg-amber-100 text-amber-950 border-amber-300'
                              : !runsToday
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-3.5 h-3.5 mr-1" />
                              Selected
                            </>
                          ) : !runsToday ? (
                            'Not Running Today'
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
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-bold">Total Duration:</span> {scheduleModalTrain.duration_formatted}
              </div>
              <div>
                <span className="font-bold">Runs On:</span> {scheduleModalTrain.run_days.join(', ')}
              </div>
              <div>
                <span className="font-bold">Journey Date:</span> {getFormattedDateDisplay(departDate)}
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
                disabled={scheduleModalTrain.runs_on_selected_day === false}
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
