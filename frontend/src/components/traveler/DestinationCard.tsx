import React, { useState } from 'react';
import { Destination } from '../../types/traveler';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Star, Clock, ArrowRight } from 'lucide-react';
import { getDestinationImage } from '../../utils/placeImages';

export interface DestinationCardProps {
  destination: Destination;
  onExplore?: (destination: Destination) => void;
}

export const DestinationCard: React.FC<DestinationCardProps> = ({ destination, onExplore }) => {
  const [imgError, setImgError] = useState(false);

  const authenticImage = getDestinationImage(destination.name);
  const displayImage = imgError ? authenticImage : (destination.imageUrl || authenticImage);

  return (
    <div
      onClick={() => onExplore?.(destination)}
      className="group bg-white rounded-3xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden flex flex-col hover:-translate-y-1 cursor-pointer"
    >
      {/* Image container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <img
          src={displayImage}
          alt={destination.name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-transparent to-transparent opacity-60" />

        {/* Top Badges */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
          <Badge variant="neutral" className="bg-white/90 backdrop-blur-md text-slate-800 border-white/40 shadow-sm font-semibold">
            <Clock className="w-3 h-3 text-slate-500 mr-1" />
            {destination.durationDays} Days
          </Badge>
          <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/40 shadow-sm text-xs font-bold text-slate-800">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{destination.rating}</span>
            <span className="text-slate-400 font-normal">({destination.reviewsCount})</span>
          </div>
        </div>

        {/* Bottom overlay title */}
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="text-xl font-bold text-white tracking-tight drop-shadow-md">{destination.name}</h3>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium line-clamp-1 mb-2">
            {destination.tagline}
          </p>
          <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed mb-4">
            {destination.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {destination.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="neutral" size="sm" className="bg-slate-50 text-slate-600 border-slate-200">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Est. Budget</div>
            <div className="text-sm font-bold text-navy-900">{destination.estimatedBudget}</div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onExplore?.(destination)}
            className="group-hover:bg-navy-800 group-hover:text-white group-hover:border-navy-800 transition-colors"
          >
            <span>Explore</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
