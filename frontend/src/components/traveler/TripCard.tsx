import React, { useState } from 'react';
import { Trip } from '../../types/traveler';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Calendar, Users, MapPin, ArrowRight, Edit3, Trash2 } from 'lucide-react';
import { getDestinationImage } from '../../utils/placeImages';

export interface TripCardProps {
  trip: Trip;
  onViewDetails?: (trip: Trip) => void;
  onEdit?: (trip: Trip) => void;
  onDelete?: (trip: Trip) => void;
  className?: string;
}

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  onViewDetails,
  onEdit,
  onDelete,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);
  const authenticImage = getDestinationImage(trip.destination || trip.title);
  const displayImage = imgError ? authenticImage : (trip.imageUrl || authenticImage);

  let statusBadge = <Badge variant="success" size="sm">Upcoming</Badge>;
  if (trip.status === 'Past') {
    statusBadge = <Badge variant="neutral" size="sm">Past</Badge>;
  } else if (trip.status === 'Draft') {
    statusBadge = <Badge variant="warning" size="sm">Draft</Badge>;
  }

  const isPaid = trip.paymentStatus === 'Paid';
  const paymentBadge = isPaid ? (
    <Badge variant="success" size="sm" className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
      ✓ Paid
    </Badge>
  ) : (
    <Badge variant="warning" size="sm" className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
      Pending Payment
    </Badge>
  );

  return (
    <div
      onClick={() => onViewDetails?.(trip)}
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden flex flex-col sm:flex-row group hover:-translate-y-0.5 w-full cursor-pointer ${className}`}
    >
      {/* Thumbnail */}
      <div className="w-full sm:w-40 md:w-44 h-40 sm:h-auto relative overflow-hidden bg-slate-100 flex-shrink-0">
        <img
          src={displayImage}
          alt={trip.destination}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 sm:hidden">
          {statusBadge}
          {paymentBadge}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <div className="min-w-0 flex-1">
              <div className="hidden sm:flex items-center gap-1.5 mb-2">
                {statusBadge}
                {paymentBadge}
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors leading-snug truncate">
                {trip.title}
              </h3>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mt-1">
                <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                <span className="truncate">{trip.destination}</span>
                <span className="text-slate-300">•</span>
                <span className="shrink-0">{trip.days} Days</span>
              </div>
            </div>
            <div className="text-right shrink-0 pl-2">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none mb-1">Est. Budget</div>
              <div className="text-sm font-bold text-navy-900 leading-none">{trip.budget}</div>
            </div>
          </div>

          <p className="text-xs text-slate-600 line-clamp-2 my-2.5 leading-relaxed">
            {trip.itinerarySummary}
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-2">
            <div className="flex items-center gap-1.5 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="whitespace-nowrap">{trip.startDate} — {trip.endDate}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="whitespace-nowrap">{trip.travelersCount} Travelers</span>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex gap-1 min-w-0 overflow-hidden flex-1">
            {trip.tags?.slice(0, 2).map((t) => (
              <Badge key={t} variant="neutral" size="sm" className="bg-slate-50 text-slate-500 text-[10px] px-2 py-0.5 truncate max-w-[90px]">
                {t}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onEdit && trip.paymentStatus !== 'Paid' && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(trip);
                }}
                title="Edit trip details"
                className="h-8 px-2 text-xs font-semibold text-slate-700 hover:text-navy-950 hover:bg-slate-100 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            )}

            {onDelete && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(trip);
                }}
                title="Delete trip"
                className="h-8 px-2 text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 hover:border-rose-600 border-rose-200 bg-rose-50/50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500 hover:text-white shrink-0" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails?.(trip);
              }}
              className="h-8 px-3 text-xs shrink-0 whitespace-nowrap group-hover:bg-navy-900 group-hover:text-white transition-colors"
            >
              <span>View</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 shrink-0" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
