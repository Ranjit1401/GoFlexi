import React, { useState } from 'react';
import {
  Compass,
  Star,
  Sparkles,
  Info,
  Check,
  Plus,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { POIResult, POIDetail } from '../../types/trip-planner';
import { getActivityDetail } from '../../services/trip-wizard';
import { getActivityImage } from '../../utils/placeImages';

interface ActivityCardProps {
  poi: POIResult;
  isSelected: boolean;
  onToggle: (poi: POIResult) => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  poi,
  isSelected,
  onToggle,
}) => {
  const [showDetail, setShowDetail] = useState(false);
  const [detail, setDetail] = useState<POIDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const handleOpenDetail = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetail(true);
    if (!detail) {
      setLoadingDetail(true);
      try {
        const d = await getActivityDetail(poi.xid);
        setDetail(d);
      } catch {
        // Fallback detail
        setDetail({
          xid: poi.xid,
          name: poi.name,
          kinds: poi.kinds,
          description: 'A scenic regional landmark celebrating regional heritage, sights, and architecture.',
          preview_image: poi.preview_image,
        });
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  const getBadgeConfig = () => {
    switch (poi.popularity) {
      case 'Iconic':
        return {
          variant: 'accent' as const,
          icon: <Star className="w-3 h-3 fill-amber-400 text-amber-500" />,
          label: 'Iconic',
          borderClass: 'border-amber-200 bg-amber-50/70 text-amber-900',
        };
      case 'Hidden Gem':
        return {
          variant: 'neutral' as const,
          icon: <Sparkles className="w-3 h-3 text-emerald-500" />,
          label: 'Hidden Gem',
          borderClass: 'border-emerald-200 bg-emerald-50/70 text-emerald-900',
        };
      case 'Popular':
      default:
        return {
          variant: 'brand' as const,
          icon: <Compass className="w-3 h-3 text-brand-500" />,
          label: 'Popular',
          borderClass: 'border-brand-200 bg-brand-50/70 text-brand-900',
        };
    }
  };

  const badge = getBadgeConfig();

  return (
    <>
      <Card
        padding="none"
        variant="interactive"
        onClick={() => onToggle(poi)}
        className={`overflow-hidden transition-all text-left flex flex-col justify-between ${
          isSelected
            ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/15'
            : 'border-slate-200 hover:border-slate-300 bg-white'
        }`}
      >
        <div>
          {/* Card Top: Image / Banner */}
          <div className="h-32 bg-slate-100 relative overflow-hidden flex items-center justify-center">
            <img
              src={poi.preview_image || getActivityImage(poi.name, poi.kinds)}
              alt={poi.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                const fallback = getActivityImage(poi.name, poi.kinds);
                if (target.src !== fallback) {
                  target.src = fallback;
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 via-transparent to-transparent opacity-30 pointer-events-none" />

            {/* Popularity Badge */}
            <div className="absolute top-2.5 left-2.5">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border backdrop-blur-xs shadow-xs ${badge.borderClass}`}
              >
                {badge.icon}
                {badge.label}
              </span>
            </div>

            {/* Quick Info Button */}
            <button
              type="button"
              onClick={handleOpenDetail}
              title="View Attraction Details"
              className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-navy-950/70 hover:bg-navy-950 text-white flex items-center justify-center backdrop-blur-xs transition-colors shadow-xs"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card Body */}
          <div className="p-3.5 space-y-1.5">
            <h4 className="text-sm font-bold text-navy-950 line-clamp-1">
              {poi.name}
            </h4>
            <p className="text-[11px] text-slate-500 line-clamp-2">
              {poi.kinds ? poi.kinds.replace(/_/g, ' ').split(',').slice(0, 3).join(' • ') : 'Sightseeing & Excursions'}
            </p>
          </div>
        </div>

        {/* Card Footer: Add Button */}
        <div className="p-3.5 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
          {poi.dist_meters ? (
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {(poi.dist_meters / 1000).toFixed(1)} km
            </span>
          ) : (
            <span />
          )}

          <Button
            size="sm"
            variant={isSelected ? 'primary' : 'outline'}
            className="rounded-xl text-xs py-1 px-3"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(poi);
            }}
          >
            {isSelected ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1" />
                Added
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title={poi.name}
        subtitle={`${badge.label} Attraction`}
        maxWidth="md"
      >
        <div className="space-y-4">
          {/* Detail Preview Image */}
          <div className="h-48 rounded-xl overflow-hidden bg-slate-100 relative">
            <img
              src={detail?.preview_image || poi.preview_image || getActivityImage(poi.name, poi.kinds)}
              alt={poi.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                const fallback = getActivityImage(poi.name, poi.kinds);
                if (target.src !== fallback) {
                  target.src = fallback;
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 via-transparent to-transparent opacity-40 pointer-events-none" />
          </div>

          {loadingDetail ? (
            <div className="py-6 text-center text-xs text-slate-500 animate-pulse">
              Loading attraction details...
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                {detail?.description || 'A notable regional point of interest with historical or scenic prominence.'}
              </p>

              {detail?.kinds && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {detail.kinds.split(',').slice(0, 5).map((k) => (
                    <Badge key={k} variant="neutral" size="sm">
                      {k.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              )}

              {detail?.wikipedia_url && (
                <div className="pt-2">
                  <a
                    href={detail.wikipedia_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-brand-600 font-semibold hover:underline"
                  >
                    <span>Read on Wikipedia</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setShowDetail(false)}>
              Close
            </Button>
            <Button
              variant={isSelected ? 'primary' : 'outline'}
              size="sm"
              onClick={() => {
                onToggle(poi);
                setShowDetail(false);
              }}
            >
              {isSelected ? 'Remove from Trip' : 'Add to Trip'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
