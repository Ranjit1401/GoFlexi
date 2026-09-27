import React, { useMemo } from 'react';
import { ExternalLink, MapPin, Route } from 'lucide-react';
import { TripLocation, TripPlan } from '../../types/trip-planner';

interface TripMapPanelProps {
  plan: TripPlan | null;
  selectedLocation: TripLocation | null;
}

export const TripMapPanel: React.FC<TripMapPanelProps> = ({ plan, selectedLocation }) => {
  const locations = useMemo(
    () =>
      (plan?.locations || []).filter(
        (location) =>
          Number.isFinite(location.latitude) &&
          Number.isFinite(location.longitude),
      ),
    [plan],
  );

  const mapUrl = useMemo(() => {
    if (!locations.length) {
      return 'https://www.openstreetmap.org/export/embed.html?bbox=68%2C7%2C98%2C36&layer=mapnik';
    }

    const lats = locations.map((location) => location.latitude);
    const lons = locations.map((location) => location.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const padLat = Math.max((maxLat - minLat) * 0.18, 0.08);
    const padLon = Math.max((maxLon - minLon) * 0.18, 0.08);

    const bbox = [
      minLon - padLon,
      minLat - padLat,
      maxLon + padLon,
      maxLat + padLat,
    ]
      .map((value) => value.toFixed(6))
      .join('%2C');

    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;
  }, [locations]);

  const routeUrl = useMemo(() => {
    if (locations.length < 2) return null;
    const route = locations
      .slice(0, 8)
      .map((location) => `${location.latitude},${location.longitude}`)
      .join(';');
    return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${encodeURIComponent(route)}`;
  }, [locations]);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <iframe
        title="OpenStreetMap trip map"
        src={mapUrl}
        className="h-56 w-full border-0"
        loading="lazy"
      />

      <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-2">
        <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <MapPin className="h-3 w-3 text-[#1683F7]" />
          {locations.length ? `${locations.length} mapped stops` : 'Map appears after locations are found'}
        </span>

        {routeUrl && (
          <a
            href={routeUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#1683F7] hover:underline"
          >
            <Route className="h-3 w-3" />
            Open route
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {selectedLocation && (
        <div className="border-t border-slate-100 bg-[#F7F9FC] px-3 py-2 text-[10px] text-slate-600">
          Selected: <span className="font-semibold text-[#071225]">{selectedLocation.name}</span>
        </div>
      )}
    </div>
  );
};

export default TripMapPanel;
