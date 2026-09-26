import React, { useState } from 'react';
import { RecommendationItem } from '../../services/recommendations';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Sparkles, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';
import { getDestinationImage } from '../../utils/placeImages';

export interface RecommendationCardProps {
  recommendation: RecommendationItem;
  onExplore?: (recommendation: RecommendationItem) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onExplore,
}) => {
  const [imgError, setImgError] = useState(false);

  const authenticImage = getDestinationImage(recommendation.name || recommendation.city);
  const imageUrl = imgError ? getDestinationImage(recommendation.city || recommendation.state) : authenticImage;

  const budgetDisplay =
    recommendation.budget_min > 0 && recommendation.budget_max > 0
      ? `₹${(recommendation.budget_min / 1000).toFixed(0)}k – ₹${(recommendation.budget_max / 1000).toFixed(0)}k`
      : 'Flexible Budget';

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden flex flex-col hover:-translate-y-1">
      {/* Image Container with Match Badge */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-slate-100">
        <img
          src={imageUrl}
          alt={recommendation.name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-transparent opacity-75" />

        {/* Top Badges: Match % & Popularity */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-brand-500 text-white shadow-sm">
            <Sparkles className="w-3 h-3" />
            <span>{recommendation.match_percentage}% Match</span>
          </div>

          <Badge
            variant="neutral"
            size="sm"
            className="bg-white/90 backdrop-blur-md text-slate-800 border-white/40 shadow-xs font-semibold py-0.5 px-2 text-[11px]"
          >
            ★ {recommendation.popularity_score.toFixed(1)}
          </Badge>
        </div>

        {/* Bottom Title & Location */}
        <div className="absolute bottom-2.5 left-3.5 right-3.5">
          <h3 className="text-lg font-bold text-white tracking-tight drop-shadow-md leading-tight">
            {recommendation.name}
          </h3>
          <div className="flex items-center gap-1 text-[11px] text-slate-200 mt-0.5 drop-shadow">
            <MapPin className="w-3 h-3 text-brand-300 shrink-0" />
            <span className="truncate">
              {recommendation.city}, {recommendation.state}
            </span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-2.5">
            {recommendation.short_description || recommendation.description}
          </p>

          {/* Matched Preferences Chips */}
          {recommendation.matched_preferences.length > 0 && (
            <div className="mb-2.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Matches</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {recommendation.matched_preferences.slice(0, 3).map((pref) => (
                  <Badge
                    key={pref}
                    variant="neutral"
                    size="sm"
                    className="bg-brand-50/80 text-brand-700 border-brand-200/70 font-semibold text-[10px] px-1.5 py-0.5"
                  >
                    {pref}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* "Why This Matches" Explanation Box */}
          <div className="p-2 sm:p-2.5 bg-gradient-to-br from-slate-50 to-brand-50/20 rounded-xl border border-slate-100 text-[11px] text-slate-600 leading-snug">
            <div className="font-bold text-navy-950 text-[10px] uppercase tracking-wider mb-0.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-brand-500 shrink-0" />
              <span>Why this matches</span>
            </div>
            <p className="italic text-slate-700 line-clamp-2">"{recommendation.explanation}"</p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between mt-auto">
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none mb-0.5">
              Est. Budget
            </div>
            <div className="text-xs font-bold text-navy-900 leading-none">{budgetDisplay}</div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onExplore?.(recommendation)}
            className="h-8 px-3 text-xs group-hover:bg-navy-900 group-hover:text-white group-hover:border-navy-900 transition-colors"
          >
            <span>Explore</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
