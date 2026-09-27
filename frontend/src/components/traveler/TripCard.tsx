import React, { useState } from 'react';
import { Trip } from '../../types/traveler';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Calendar, Users, MapPin, ArrowRight } from 'lucide-react';
import { getDestinationImage } from '../../utils/placeImages';

export interface TripCardProps {
  trip: Trip;
  onViewDetails?: (trip: Trip) => void;
}

export const TripCard: React.FC<TripCardProps> = ({ trip, onViewDetails }) => {
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
      className="bg-white rounded-2xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden flex flex-col md:flex-row group hover:-translate-y-0.5 w-full max-w-lg cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="md:w-36 lg:w-40 h-36 md:h-auto relative overflow-hidden bg-slate-100 flex-shrink-0">
        <img
          src={displayImage}
          alt={trip.destination}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 md:hidden">
          {statusBadge}
          {paymentBadge}
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <div>
              <div className="hidden md:flex items-center gap-1.5 mb-1.5">
                {statusBadge}
                {paymentBadge}
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors leading-snug">
                {trip.title}
              </h3>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{trip.destination}</span>
                <span className="text-slate-300">•</span>
                <span>{trip.days} Days</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none mb-0.5">Est. Budget</div>
              <div className="text-sm font-bold text-navy-900 leading-none">{trip.budget}</div>
            </div>
          </div>

          <p className="text-xs text-slate-600 line-clamp-2 my-2 leading-relaxed">
            {trip.itinerarySummary}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-1.5">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{trip.startDate} — {trip.endDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{trip.travelersCount} Travelers</span>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex gap-1">
            {trip.tags?.slice(0, 2).map((t) => (
              <Badge key={t} variant="neutral" size="sm" className="bg-slate-50 text-slate-500 text-[10px] px-1.5 py-0.5">
                {t}
              </Badge>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails?.(trip);
            }}
            className="h-8 px-3 text-xs group-hover:bg-slate-900 group-hover:text-white transition-colors"
          >
            <span>View Trip</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};
