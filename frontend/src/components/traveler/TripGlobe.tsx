import React, { useEffect, useState } from 'react';
import { Viewer, Entity, PointGraphics, PolylineGraphics, LabelGraphics, CameraFlyTo } from 'resium';
import { Cartesian3, Color, ArcType, Ion, createWorldTerrainAsync, Math as CesiumMath, Cartesian2 } from 'cesium';
import { MapPin } from 'lucide-react';
import { TripLocation, TripRoute } from '../../types/trip-planner';

// Generate a parabolic arc of Cartesian3 points
function generateArc(lon1: number, lat1: number, lon2: number, lat2: number, maxHeight: number, segments = 50) {
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const fraction = i / segments;
    const lon = lon1 + (lon2 - lon1) * fraction;
    const lat = lat1 + (lat2 - lat1) * fraction;
    const altitude = 4 * maxHeight * fraction * (1 - fraction);
    points.push(Cartesian3.fromDegrees(lon, lat, altitude));
  }
  return points;
}

interface TripGlobeProps {
  locations: TripLocation[];
  routes: TripRoute[];
  selectedLocation: TripLocation | null;
  onSelectLocation?: (location: TripLocation) => void;
}

export const TripGlobe: React.FC<TripGlobeProps> = ({ locations, routes, selectedLocation, onSelectLocation }) => {
  const [terrainProvider, setTerrainProvider] = useState<any>(null);

  useEffect(() => {
    Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN || '';
    createWorldTerrainAsync().then(terrain => {
      setTerrainProvider(terrain);
    }).catch(console.error);
  }, []);

  // Determine initial camera view
  let dest = Cartesian3.fromDegrees(1.0, 48.0, 1500000);
  if (locations.length > 0) {
      const target = locations.find(l => l.type === 'destination') || locations[0];
      dest = Cartesian3.fromDegrees(target.longitude, target.latitude, 1500000);
  }

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-950 flex flex-col items-center justify-center">
      <Viewer 
        full 
        animation={false} 
        timeline={false} 
        baseLayerPicker={false} 
        geocoder={false} 
        homeButton={false} 
        infoBox={false} 
        sceneModePicker={false}
        navigationHelpButton={false}
        terrainProvider={terrainProvider}
        className="w-full h-full"
      >
        <CameraFlyTo 
          destination={dest}
          orientation={{
            heading: CesiumMath.toRadians(0.0),
            pitch: CesiumMath.toRadians(-65.0),
          }}
          duration={2}
        />

        {locations.map((loc) => {
            const isSelected = selectedLocation?.id === loc.id;
            const colorStr = loc.type === 'origin' ? '#38bdf8' : 
                             loc.type === 'destination' ? '#34d399' :
                             loc.type === 'stay' ? '#fbbf24' : '#818cf8';

            return (
              <Entity 
                key={loc.id} 
                position={Cartesian3.fromDegrees(loc.longitude, loc.latitude, 0)}
                onClick={() => onSelectLocation && onSelectLocation(loc)}
              >
                <PointGraphics 
                    pixelSize={isSelected ? 16 : 12} 
                    color={Color.fromCssColorString(colorStr)} 
                    outlineColor={Color.WHITE} 
                    outlineWidth={isSelected ? 3 : 2} 
                />
                <LabelGraphics 
                    text={loc.name} 
                    font={isSelected ? "bold 16px sans-serif" : "14px sans-serif"}
                    pixelOffset={new Cartesian2(0, -25)} 
                    fillColor={Color.WHITE} 
                    showBackground 
                    backgroundColor={new Color(0.1, 0.1, 0.1, 0.8)} 
                    backgroundPadding={new Cartesian2(7, 5)}
                />
              </Entity>
            );
        })}

        {routes.map((route, i) => {
            const origin = locations.find(l => l.id === route.origin_id);
            const destination = locations.find(l => l.id === route.destination_id);
            if (!origin || !destination) return null;

            const arcPositions = generateArc(origin.longitude, origin.latitude, destination.longitude, destination.latitude, 150000);

            return (
              <Entity key={`route-${i}`}>
                <PolylineGraphics 
                  positions={arcPositions} 
                  width={4} 
                  material={Color.fromCssColorString('#8b5cf6')} 
                  arcType={ArcType.NONE} 
                />
              </Entity>
            );
        })}
      </Viewer>

      {/* Floating Route Badge in Top-Left */}
      {routes.length > 0 && (
        <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-2 shadow-lg flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div className="text-xs">
            <span className="text-slate-400">Active Flight Corridor: </span>
            <span className="font-semibold text-slate-100">{routes[0].label}</span>
            {routes[0].distance_km && (
              <span className="text-slate-500 ml-1">({routes[0].distance_km} km)</span>
            )}
          </div>
        </div>
      )}

      {/* Legend Bar at Bottom-Left */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/70 backdrop-blur-md border border-slate-800 rounded-lg px-3 py-1.5 shadow-md flex items-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-sky-400" />
          <span>Origin Hub</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span>Destination</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span>Stay</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
          <span>Sights & Activities</span>
        </div>
      </div>

      {/* Selected Location Quick Card at Bottom-Right */}
      {selectedLocation && (
        <div className="absolute bottom-4 right-4 z-10 max-w-xs bg-slate-900/90 backdrop-blur-md border border-indigo-500/40 rounded-xl p-3 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
              {selectedLocation.type}
            </span>
          </div>
          <h4 className="text-sm font-semibold text-white leading-tight">
            {selectedLocation.name}
          </h4>
          {selectedLocation.description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              {selectedLocation.description}
            </p>
          )}
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            {selectedLocation.latitude.toFixed(4)}°N, {selectedLocation.longitude.toFixed(4)}°E
          </div>
        </div>
      )}
    </div>
  );
};

export default TripGlobe;
