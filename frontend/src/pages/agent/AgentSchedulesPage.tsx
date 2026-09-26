import React, { useState } from 'react';
import { mockSchedules } from '../../data/schedules';
import { ScheduleItem } from '../../types/agent';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import {
  CalendarDays,
  Plane,
  Car,
  Clock,
  Compass,
  MapPin,
  CheckCircle2,
  Building,
  AlertCircle
} from 'lucide-react';

export const AgentSchedulesPage: React.FC = () => {
  const { showToast } = useToast();
  const [filterType, setFilterType] = useState<string>('all');

  const filteredItems = filterType === 'all'
    ? mockSchedules
    : mockSchedules.filter((s) => s.type === filterType);

  const getTypeIcon = (type: ScheduleItem['type']) => {
    switch (type) {
      case 'departure':
        return <Plane className="w-4 h-4 text-brand-600" />;
      case 'transfer':
        return <Car className="w-4 h-4 text-purple-600" />;
      case 'checkin':
        return <Building className="w-4 h-4 text-amber-600" />;
      case 'activity':
      default:
        return <Compass className="w-4 h-4 text-emerald-600" />;
    }
  };

  const getTypeBadge = (type: ScheduleItem['type']) => {
    switch (type) {
      case 'departure':
        return <Badge variant="primary" size="sm">Departure</Badge>;
      case 'transfer':
        return <Badge variant="neutral" size="sm" className="bg-purple-50 text-purple-700">Transfer</Badge>;
      case 'checkin':
        return <Badge variant="warning" size="sm">Hotel Check-in</Badge>;
      case 'activity':
      default:
        return <Badge variant="success" size="sm">Activity</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
            Dispatch & Field Operations
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
            Operational Schedules
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Synchronized calendar timeline of departures, excursions, transfers, and accommodations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => showToast('info', 'Refreshing live flight and traffic telematics...')}
            className="rounded-xl"
          >
            <span>Refresh Timeline</span>
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200">
        {[
          { id: 'all', label: 'All Scheduled Events' },
          { id: 'departure', label: 'Upcoming Departures' },
          { id: 'transfer', label: 'Transfers & Chauffeurs' },
          { id: 'activity', label: 'Activities & Excursions' },
          { id: 'checkin', label: 'Hotel Check-ins' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterType === tab.id
                ? 'bg-navy-950 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timeline List */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 space-y-6 ml-3 sm:ml-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="relative bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 hover:border-slate-300 transition-all"
          >
            {/* Timeline node */}
            <div className="absolute -left-[35px] sm:-left-[43px] top-6 w-8 h-8 rounded-full bg-white border-2 border-navy-950 flex items-center justify-center shadow-xs">
              {getTypeIcon(item.type)}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {item.time} ({item.date})
                  </span>
                  {getTypeBadge(item.type)}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-navy-950">{item.title}</h3>
              </div>

              <Badge
                variant={item.status === 'On Track' ? 'success' : 'neutral'}
                size="sm"
                className="self-start"
              >
                {item.status}
              </Badge>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              {item.details}
            </p>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-4 text-slate-500">
                <span className="font-semibold text-slate-800">Assigned: {item.travelerOrGroup}</span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {item.location}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => showToast('info', `Notified ground coordinator for ${item.title}`)}
                  className="font-bold text-brand-600 hover:underline"
                >
                  Notify Ground Team
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
