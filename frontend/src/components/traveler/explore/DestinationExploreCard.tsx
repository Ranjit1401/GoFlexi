import React from 'react';
import { MapPin, Sparkles, Star, Wallet, Compass, Bot } from 'lucide-react';
import { RecommendationItem } from '../../../services/recommendations';

interface DestinationExploreCardProps {
  destination: RecommendationItem;
  onViewDetails: (destination: RecommendationItem) => void;
  onPlanTrip: (destination: RecommendationItem) => void;
}

export const DestinationExploreCard: React.FC<DestinationExploreCardProps> = ({
  destination,
  onViewDetails,
  onPlanTrip,
}) => {
  // Gradient generator for visual header placeholder based on name hash
  const getGradientByName = (name: string) => {
    const gradients = [
      'from-blue-600 via-indigo-600 to-violet-700',
      'from-emerald-600 via-teal-600 to-cyan-700',
      'from-amber-500 via-orange-600 to-rose-600',
      'from-rose-500 via-pink-600 to-purple-700',
      'from-indigo-600 via-purple-600 to-pink-600',
      'from-teal-600 via-emerald-600 to-green-700',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const bgGradient = getGradientByName(destination.name);

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1">
      {/* Visual Header Banner */}
      <div className={`relative h-40 w-full bg-gradient-to-tr ${bgGradient} p-4 flex flex-col justify-between overflow-hidden`}>
        <div className="absolute inset-0 bg-black/15 group-hover:bg-black/10 transition-colors" />

        {/* Decorative backdrop shapes */}
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />

        {/* Top Badges */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          {/* Match Score Badge */}
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white/95 text-indigo-700 shadow-sm backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
            <span>{Math.round(destination.match_percentage)}% Match</span>
          </div>

          {/* Popularity Badge */}
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-black/40 text-white backdrop-blur-xs">
            <Star className="w-3 h-3 text-amber-300 fill-amber-300" />
            <span>{(destination.popularity_score / 10).toFixed(1)}</span>
          </div>
        </div>

        {/* Bottom Destination Title */}
        <div className="relative z-10">
          <h3 className="text-xl font-bold text-white tracking-tight drop-shadow-sm truncate">
            {destination.name}
          </h3>
          <div className="flex items-center gap-1 text-white/90 text-xs font-medium mt-0.5">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {destination.city ? `${destination.city}, ` : ''}
              {destination.state}
            </span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
        {/* Short Description */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {destination.short_description || destination.description}
        </p>

        {/* AI Explanation / Why Recommended snippet */}
        {destination.explanation && (
          <div className="text-[11px] font-medium text-indigo-900/80 bg-indigo-50/70 border border-indigo-100 rounded-lg p-2 leading-snug">
            <span className="font-bold text-indigo-700">Why for you: </span>
            {destination.explanation}
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {destination.places?.slice(0, 2).map((place) => (
            <span
              key={place}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60"
            >
              {place}
            </span>
          ))}
          {destination.experiences?.slice(0, 2).map((exp) => (
            <span
              key={exp}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60"
            >
              {exp}
            </span>
          ))}
          {destination.travel_styles?.slice(0, 1).map((st) => (
            <span
              key={st}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60"
            >
              {st}
            </span>
          ))}
        </div>

        {/* Price & Actions Footer */}
        <div className="border-t border-slate-100 pt-3 mt-1 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 text-slate-400" />
              Est. Budget
            </span>
            <span className="text-xs font-bold text-slate-800">
              {formatPrice(destination.budget_min)} – {formatPrice(destination.budget_max)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onViewDetails(destination)}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-slate-500" />
              <span>Details</span>
            </button>

            <button
              type="button"
              onClick={() => onPlanTrip(destination)}
              className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Plan AI Trip</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
