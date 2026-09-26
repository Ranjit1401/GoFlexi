import React from 'react';
import {
  X,
  MapPin,
  Sparkles,
  Star,
  Wallet,
  Calendar,
  Compass,
  Users,
  Car,
  Clock,
  Bot,
} from 'lucide-react';
import { RecommendationItem } from '../../../services/recommendations';

interface DestinationDetailModalProps {
  destination: RecommendationItem | null;
  onClose: () => void;
  onPlanTrip: (destination: RecommendationItem) => void;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const DestinationDetailModal: React.FC<DestinationDetailModalProps> = ({
  destination,
  onClose,
  onPlanTrip,
}) => {
  if (!destination) return null;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

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

  const bgGradient = getGradientByName(destination.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header Hero */}
        <div className={`relative h-44 sm:h-52 w-full bg-gradient-to-tr ${bgGradient} p-6 flex flex-col justify-between overflow-hidden shrink-0`}>
          <div className="absolute inset-0 bg-black/20" />

          {/* Top Row: Badges & Close Button */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-indigo-700 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
                {Math.round(destination.match_percentage)}% Match
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-black/40 text-white backdrop-blur-xs">
                <Star className="w-3 h-3 text-amber-300 fill-amber-300" />
                {(destination.popularity_score / 10).toFixed(1)} Popularity
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-xs transition-colors cursor-pointer"
              title="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Bottom Title */}
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
              {destination.name}
            </h2>
            <div className="flex items-center gap-1.5 text-white/90 text-sm font-medium mt-1">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>
                {destination.city ? `${destination.city}, ` : ''}
                {destination.state}, {destination.country}
              </span>
            </div>
          </div>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* AI Explanation Banner */}
          {destination.explanation && (
            <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-indigo-950 leading-relaxed">
                <span className="font-bold text-indigo-800">Why GoFlexi Recommends This: </span>
                {destination.explanation}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              About This Destination
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed">
              {destination.description || destination.short_description}
            </p>
          </div>

          {/* Key Attributes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            {/* Budget */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 uppercase">Estimated Budget</span>
                <span className="text-sm font-bold text-slate-800">
                  {formatPrice(destination.budget_min)} – {formatPrice(destination.budget_max)}
                </span>
              </div>
            </div>

            {/* Best Months */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-[11px] font-semibold text-slate-400 uppercase">Best Season</span>
                <span className="text-xs font-bold text-slate-800 truncate block">
                  {destination.best_months && destination.best_months.length > 0
                    ? destination.best_months.map((m) => MONTH_NAMES[m - 1]).join(', ')
                    : 'Year-round'}
                </span>
              </div>
            </div>

            {/* Travel Style */}
            {destination.travel_styles && destination.travel_styles.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100/70 text-purple-700 flex items-center justify-center shrink-0">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase">Travel Style</span>
                  <span className="text-xs font-bold text-slate-800">
                    {destination.travel_styles.join(', ')}
                  </span>
                </div>
              </div>
            )}

            {/* Companions */}
            {destination.companions && destination.companions.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100/70 text-amber-700 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase">Ideal For</span>
                  <span className="text-xs font-bold text-slate-800">
                    {destination.companions.join(', ')}
                  </span>
                </div>
              </div>
            )}

            {/* Transport Options */}
            {destination.transport_options && destination.transport_options.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100/70 text-sky-700 flex items-center justify-center shrink-0">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase">Transport</span>
                  <span className="text-xs font-bold text-slate-800">
                    {destination.transport_options.join(', ')}
                  </span>
                </div>
              </div>
            )}

            {/* Pace */}
            {destination.paces && destination.paces.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100/70 text-rose-700 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase">Pace</span>
                  <span className="text-xs font-bold text-slate-800">
                    {destination.paces.join(', ')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Place & Experience Tags */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Tags & Experiences
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {destination.places?.map((p) => (
                <span
                  key={p}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                >
                  {p}
                </span>
              ))}
              {destination.experiences?.map((e) => (
                <span
                  key={e}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-200/80"
                >
                  {e}
                </span>
              ))}
              {destination.relevant_tags?.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 border border-slate-200"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => onPlanTrip(destination)}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-indigo-500/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Bot className="w-4 h-4" />
            <span>Plan with AI Co-Pilot</span>
          </button>
        </div>
      </div>
    </div>
  );
};
