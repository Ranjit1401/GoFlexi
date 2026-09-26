import React, { useRef } from 'react';
import {
  Compass,
  UtensilsCrossed,
  Umbrella,
  Trees,
  Footprints,
  Camera,
  Landmark,
  Sparkles,
  Smile,
  ShoppingBag,
  Trophy,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface ExperienceSelectorProps {
  selectedExperiences: string[];
  onToggleExperience: (experience: string) => void;
}

interface ExperienceItem {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bgGradient: string;
}

const EXPERIENCES: ExperienceItem[] = [
  { id: 'Adventure', label: 'Adventure', icon: Compass, color: 'text-amber-600', bgGradient: 'from-amber-500/10 to-orange-500/20' },
  { id: 'Food', label: 'Food', icon: UtensilsCrossed, color: 'text-rose-600', bgGradient: 'from-rose-500/10 to-red-500/20' },
  { id: 'Beaches', label: 'Beaches', icon: Umbrella, color: 'text-cyan-600', bgGradient: 'from-cyan-500/10 to-blue-500/20' },
  { id: 'Nature', label: 'Nature', icon: Trees, color: 'text-emerald-600', bgGradient: 'from-emerald-500/10 to-teal-500/20' },
  { id: 'Wildlife', label: 'Wildlife', icon: Footprints, color: 'text-lime-600', bgGradient: 'from-lime-500/10 to-green-500/20' },
  { id: 'Photography', label: 'Photography', icon: Camera, color: 'text-purple-600', bgGradient: 'from-purple-500/10 to-indigo-500/20' },
  { id: 'Culture', label: 'Culture', icon: Landmark, color: 'text-yellow-700', bgGradient: 'from-yellow-500/10 to-amber-500/20' },
  { id: 'Nightlife', label: 'Nightlife', icon: Sparkles, color: 'text-fuchsia-600', bgGradient: 'from-fuchsia-500/10 to-pink-500/20' },
  { id: 'Relaxation', label: 'Relaxation', icon: Smile, color: 'text-teal-600', bgGradient: 'from-teal-500/10 to-sky-500/20' },
  { id: 'Shopping', label: 'Shopping', icon: ShoppingBag, color: 'text-violet-600', bgGradient: 'from-violet-500/10 to-purple-500/20' },
  { id: 'Sports', label: 'Sports', icon: Trophy, color: 'text-orange-600', bgGradient: 'from-orange-500/10 to-amber-500/20' },
];

export const ExperienceSelector: React.FC<ExperienceSelectorProps> = ({
  selectedExperiences,
  onToggleExperience,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -240 : 240;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Select Your Experience
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click to discover destinations curated around your travel mood
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="p-1.5 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-500 transition-colors"
            title="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="p-1.5 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-500 transition-colors"
            title="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent scroll-smooth focus:outline-none"
      >
        {EXPERIENCES.map((exp) => {
          const isSelected = selectedExperiences.includes(exp.id);
          const Icon = exp.icon;

          return (
            <button
              key={exp.id}
              type="button"
              onClick={() => onToggleExperience(exp.id)}
              className={`group flex flex-col items-center min-w-[76px] sm:min-w-[84px] py-2 px-1 rounded-xl transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-indigo-50 border-2 border-indigo-600 shadow-sm scale-[1.02]'
                  : 'hover:bg-slate-50 border-2 border-transparent hover:border-slate-200'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : `bg-gradient-to-br ${exp.bgGradient} ${exp.color} group-hover:scale-105`
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`mt-2 text-xs font-semibold text-center truncate max-w-[80px] ${
                  isSelected ? 'text-indigo-900 font-bold' : 'text-slate-600 group-hover:text-slate-900'
                }`}
              >
                {exp.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
