import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Viewer, Entity, PointGraphics, PolylineGraphics, LabelGraphics } from 'resium';
import {
  Cartesian2,
  Cartesian3,
  Color,
  ArcType,
  ImageryLayer,
  UrlTemplateImageryProvider,
  Math as CesiumMath,
} from 'cesium';
import { Maximize2, MapPin, RotateCcw, ZoomIn, ZoomOut, Satellite, Map as MapIcon } from 'lucide-react';
import { TripLocation, TripRoute } from '../../types/trip-planner';
import { getActivityImage } from '../../utils/placeImages';

type GlobeMode = 'normal' | 'satellite';

function generateArc(lon1: number, lat1: number, lon2: number, lat2: number, maxHeight: number, segments = 50) {
  const points: Cartesian3[] = [];
  for (let i = 0; i <= segments; i += 1) {
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
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [mode, setMode] = useState<GlobeMode>('normal');

  const imageryLayer = useMemo(() => {
    const provider = mode === 'satellite'
      ? new UrlTemplateImageryProvider({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          credit: 'Esri World Imagery',
          maximumLevel: 19,
        })
      : new UrlTemplateImageryProvider({
            url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            credit: '© OpenStreetMap contributors',
            maximumLevel: 19,
          });

    return new ImageryLayer(provider);
  }, [mode]);

  const target = selectedLocation || locations.find((location) => location.type === 'destination') || locations[0];

  // Keep the whole Earth visible instead of zooming into a cropped hemisphere.
  const cameraDestination = useMemo(
    () => target
      ? Cartesian3.fromDegrees(target.longitude, target.latitude, 8200000)
      : Cartesian3.fromDegrees(78.9629, 20.5937, 9500000),
    [target?.id, target?.latitude, target?.longitude],
  );

  useEffect(() => {
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer) return;
    viewer.camera.flyTo({
      destination: cameraDestination,
      orientation: {
        heading: 0,
        pitch: CesiumMath.toRadians(-90),
        roll: 0,
      },
      duration: 0.9,
    });
  }, [target?.id, cameraDestination]);

  const zoom = (amount: number) => {
    const camera = viewerRef.current?.camera;
    if (!camera) return;
    amount > 0 ? camera.zoomIn(amount) : camera.zoomOut(Math.abs(amount));
  };

  const resetCamera = () => {
    viewerRef.current?.camera.flyTo({
      destination: cameraDestination,
      orientation: { heading: 0, pitch: CesiumMath.toRadians(-90), roll: 0 },
      duration: 0.8,
    });
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await containerRef.current.requestFullscreen();
  };

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-slate-950">
      <Viewer
        ref={(instance) => { viewerRef.current = instance?.cesiumElement || null; }}
        animation={false}
        timeline={false}
        baseLayerPicker={false}
        geocoder={false}
        homeButton={false}
        infoBox={false}
        sceneModePicker={false}
        navigationHelpButton={false}
        fullscreenButton={false}
        baseLayer={imageryLayer}
        className="h-full w-full"
      >
        {locations.map((location) => {
          const isSelected = selectedLocation?.id === location.id;
          const color =
            location.type === 'origin' ? '#1683F7' :
            location.type === 'destination' ? '#22C55E' :
            location.type === 'stay' || location.type === 'hotel' ? '#F59E0B' : '#64748B';

          return (
            <Entity
              key={location.id}
              position={Cartesian3.fromDegrees(location.longitude, location.latitude, 12000)}
              onClick={() => onSelectLocation?.(location)}
            >
              <PointGraphics
                pixelSize={isSelected ? 18 : 13}
                color={Color.fromCssColorString(color)}
                outlineColor={Color.WHITE}
                outlineWidth={isSelected ? 3 : 2}
              />
              <LabelGraphics
                text={location.name}
                font={isSelected ? 'bold 15px Inter' : '13px Inter'}
                pixelOffset={new Cartesian2(0, -26)}
                fillColor={Color.WHITE}
                showBackground
                backgroundColor={Color.fromCssColorString('#071225').withAlpha(0.86)}
                backgroundPadding={new Cartesian2(7, 5)}
              />
            </Entity>
          );
        })}

        {routes.map((route, index) => {
          const origin = locations.find((location) => location.id === route.origin_id);
          const destination = locations.find((location) => location.id === route.destination_id);
          if (!origin || !destination) return null;
          return (
            <Entity key={`${route.id || 'route'}-${index}`}>
              <PolylineGraphics
                positions={generateArc(origin.longitude, origin.latitude, destination.longitude, destination.latitude, 150000)}
                width={3}
                material={Color.fromCssColorString('#1683F7')}
                arcType={ArcType.NONE}
              />
            </Entity>
          );
        })}
      </Viewer>

      <div className="absolute left-4 top-4 z-10 rounded-xl border border-slate-200/70 bg-white/95 px-3 py-2 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#1683F7]" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#1683F7]">Interactive Trip Globe</p>
            <p className="text-[10px] text-slate-500">{locations.length} selected place{locations.length === 1 ? '' : 's'}</p>
          </div>
        </div>
      </div>

      <div className="absolute right-4 top-4 z-10 flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {([
          ['normal', MapIcon, 'Normal map'],
          ['satellite', Satellite, 'Satellite view'],
        ] as const).map(([value, Icon, title]) => (
          <button
            key={value}
            type="button"
            title={title}
            onClick={() => setMode(value)}
            className={`p-2.5 ${mode === value ? 'bg-[#1683F7] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      <div className="absolute right-4 top-16 z-10 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <button type="button" onClick={() => zoom(500000)} title="Zoom in" className="p-2.5 text-slate-600 hover:bg-slate-50"><ZoomIn className="h-4 w-4" /></button>
        <button type="button" onClick={() => zoom(-500000)} title="Zoom out" className="border-t border-slate-100 p-2.5 text-slate-600 hover:bg-slate-50"><ZoomOut className="h-4 w-4" /></button>
        <button type="button" onClick={resetCamera} title="Reset globe" className="border-t border-slate-100 p-2.5 text-slate-600 hover:bg-slate-50"><RotateCcw className="h-4 w-4" /></button>
      </div>

      {selectedLocation && (
        <div className="absolute bottom-4 left-4 z-10 w-[min(420px,calc(100%-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex gap-3 p-3">
            <img src={getActivityImage(selectedLocation.name, selectedLocation.type)} alt={selectedLocation.name} className="h-16 w-20 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#1683F7]"><MapPin className="h-3 w-3" />Selected place</div>
              <h4 className="mt-1 truncate text-sm font-semibold text-[#071225]">{selectedLocation.name}</h4>
              <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">{selectedLocation.description || 'Verified location from the current trip plan.'}</p>
              <p className="mt-1 text-[10px] font-mono text-slate-400">{selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}</p>
            </div>
          </div>
        </div>
      )}

      <button type="button" onClick={toggleFullscreen} className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#071225] shadow-sm hover:border-[#1683F7] hover:text-[#1683F7]">
        <Maximize2 className="h-3.5 w-3.5" />Go Fullscreen
      </button>
    </div>
  );
};

export default TripGlobe;
