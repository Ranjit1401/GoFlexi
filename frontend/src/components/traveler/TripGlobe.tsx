import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Compass,
  MapPin,
  Play,
  Pause,
  Navigation,
  Layers
} from 'lucide-react';
import { TripLocation, TripRoute } from '../../types/trip-planner';

interface TripGlobeProps {
  locations: TripLocation[];
  routes: TripRoute[];
  selectedLocation: TripLocation | null;
  onSelectLocation?: (location: TripLocation) => void;
}

// Simplified coastlines and major continental landmass paths (lat, lon pairs)
const CONTINENT_POLYGONS: [number, number][][] = [
  // India & South Asia subcontinent
  [
    [8.0, 77.5], [10.5, 76.0], [13.0, 74.8], [15.5, 73.8], [18.9, 72.8], [20.5, 72.8],
    [22.5, 69.5], [24.0, 68.5], [27.0, 71.0], [31.0, 74.5], [34.5, 74.5], [35.5, 77.0],
    [32.5, 79.0], [28.5, 81.0], [27.5, 88.5], [26.0, 90.0], [24.0, 92.0], [22.0, 89.5],
    [20.5, 87.0], [17.5, 83.0], [13.0, 80.2], [10.0, 79.8], [8.0, 77.5]
  ],
  // Sri Lanka
  [
    [9.5, 80.2], [8.5, 81.2], [6.0, 80.6], [7.0, 79.8], [9.5, 80.2]
  ],
  // Southeast Asia & Indochina
  [
    [22.0, 100.0], [21.0, 106.0], [16.0, 108.0], [11.0, 109.0], [9.0, 104.0],
    [13.0, 100.5], [7.0, 100.0], [1.3, 103.8], [3.5, 101.0], [10.0, 98.5],
    [16.0, 96.0], [20.0, 93.0], [22.0, 100.0]
  ],
  // East Asia & Japan
  [
    [22.0, 114.0], [25.0, 119.0], [31.0, 122.0], [37.0, 122.5], [40.0, 124.0],
    [41.0, 130.0], [45.0, 135.0], [35.0, 129.0], [30.0, 120.0], [22.0, 114.0]
  ],
  [
    [31.0, 130.5], [35.0, 136.0], [38.0, 141.0], [43.0, 145.0], [45.0, 142.0],
    [39.0, 139.5], [34.0, 132.0], [31.0, 130.5]
  ],
  // Middle East & Arabian Peninsula
  [
    [30.0, 32.5], [31.0, 35.5], [28.0, 35.0], [22.0, 39.0], [13.0, 43.5],
    [12.5, 45.0], [17.0, 54.0], [24.0, 58.0], [26.0, 56.5], [26.0, 50.5],
    [30.0, 48.0], [33.0, 44.0], [36.0, 36.0], [30.0, 32.5]
  ],
  // Europe
  [
    [36.0, -5.5], [43.0, -9.0], [48.0, -4.5], [51.0, 2.0], [54.0, 8.0],
    [58.0, 11.0], [60.0, 25.0], [55.0, 21.0], [45.0, 14.0], [40.0, 18.0],
    [38.0, 24.0], [36.0, 28.0], [36.5, -5.0]
  ],
  // Africa
  [
    [37.0, 10.0], [32.0, 25.0], [31.0, 32.0], [22.0, 37.0], [12.0, 51.0],
    [-4.0, 39.0], [-26.0, 33.0], [-34.5, 20.0], [-23.0, 14.0], [-5.0, 12.0],
    [4.0, 9.0], [5.0, -1.0], [14.0, -17.0], [28.0, -13.0], [35.5, -6.0], [37.0, 10.0]
  ],
  // Australia
  [
    [-12.0, 131.0], [-15.0, 136.0], [-11.0, 142.5], [-23.0, 151.0], [-33.0, 152.0],
    [-38.0, 145.0], [-35.0, 117.0], [-22.0, 114.0], [-15.0, 124.0], [-12.0, 131.0]
  ]
];

export const TripGlobe: React.FC<TripGlobeProps> = ({
  locations,
  routes,
  selectedLocation,
  onSelectLocation,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Rotation angles (radians)
  // Default centered roughly on India (lat 20°N, lon 77°E)
  const [rotX, setRotX] = useState<number>(0.35); // pitch (tilt)
  const [rotY, setRotY] = useState<number>(-1.35); // yaw (longitude)
  const [zoom, setZoom] = useState<number>(1.0);
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(true);
  const [hoveredLocation, setHoveredLocation] = useState<TripLocation | null>(null);

  // Drag interaction state
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animFrameIdRef = useRef<number | null>(null);
  const pulsePhaseRef = useRef<number>(0);

  // Camera target interpolation state
  const targetRotationRef = useRef<{ rotX: number; rotY: number } | null>(null);

  // Fly camera to a specific lat/lon
  const flyTo = useCallback((lat: number, lon: number) => {
    // Convert to target rotX, rotY
    const targetX = (lat * Math.PI) / 180;
    const targetY = -((lon * Math.PI) / 180) - Math.PI / 2;
    targetRotationRef.current = { rotX: targetX, rotY: targetY };
    setIsAutoRotate(false);
  }, []);

  // When selectedLocation changes from props, fly to it
  useEffect(() => {
    if (selectedLocation) {
      flyTo(selectedLocation.latitude, selectedLocation.longitude);
    }
  }, [selectedLocation, flyTo]);

  // When locations first load, center on the first destination or route
  useEffect(() => {
    if (locations.length > 0 && !selectedLocation) {
      const dest = locations.find((l) => l.type === 'destination') || locations[0];
      flyTo(dest.latitude, dest.longitude);
    }
  }, [locations, selectedLocation, flyTo]);

  // Coordinate transformation: (lat, lon, altitudeRatio) -> 3D screen (x, y, visible, zDepth)
  const projectPoint = useCallback(
    (
      lat: number,
      lon: number,
      radius: number,
      centerX: number,
      centerY: number,
      currentRotX: number,
      currentRotY: number,
      altRatio: number = 1.0
    ) => {
      const phi = (lat * Math.PI) / 180;
      const lambda = (lon * Math.PI) / 180;
      const r = radius * altRatio;

      // 3D Cartesian coords
      const x0 = Math.cos(phi) * Math.sin(lambda);
      const y0 = -Math.sin(phi);
      const z0 = Math.cos(phi) * Math.cos(lambda);

      // Y-axis rotation (yaw / longitude)
      const x1 = x0 * Math.cos(currentRotY) + z0 * Math.sin(currentRotY);
      const y1 = y0;
      const z1 = -x0 * Math.sin(currentRotY) + z0 * Math.cos(currentRotY);

      // X-axis rotation (pitch / latitude tilt)
      const x2 = x1;
      const y2 = y1 * Math.cos(currentRotX) - z1 * Math.sin(currentRotX);
      const z2 = y1 * Math.sin(currentRotX) + z1 * Math.cos(currentRotX);

      // Visible if z2 > 0 (front facing hemisphere)
      const isVisible = z2 > -0.05;
      const screenX = centerX + r * x2;
      const screenY = centerY + r * y2;

      return { x: screenX, y: screenY, isVisible, z: z2 };
    },
    []
  );

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    targetRotationRef.current = null; // cancel camera interpolation on manual drag
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      setRotY((prev) => prev + dx * 0.006);
      setRotX((prev) => {
        const next = prev - dy * 0.006;
        // Clamp pitch to avoid gimbal flipping
        return Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, next));
      });
      return;
    }

    // Hit-testing locations on hover
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;
    const radius = (Math.min(w, h) / 2) * 0.65 * zoom;
    const cx = w / 2;
    const cy = h / 2;

    let found: TripLocation | null = null;
    for (const loc of locations) {
      const p = projectPoint(loc.latitude, loc.longitude, radius, cx, cy, rotX, rotY, 1.0);
      if (p.isVisible) {
        const dist = Math.hypot(mouseX - p.x, mouseY - p.y);
        if (dist < 18) {
          found = loc;
          break;
        }
      }
    }
    setHoveredLocation(found);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((prev) => {
      const delta = e.deltaY * -0.001;
      return Math.max(0.6, Math.min(2.5, prev + delta));
    });
  };

  const handleClick = () => {
    if (hoveredLocation && onSelectLocation) {
      onSelectLocation(hoveredLocation);
    }
  };

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localRotX = rotX;
    let localRotY = rotY;

    const render = () => {
      // 1. Interpolate to target if flyTo active
      if (targetRotationRef.current) {
        const speed = 0.08;
        const diffX = targetRotationRef.current.rotX - localRotX;
        let diffY = (targetRotationRef.current.rotY - localRotY) % (Math.PI * 2);
        if (diffY > Math.PI) diffY -= Math.PI * 2;
        if (diffY < -Math.PI) diffY += Math.PI * 2;

        localRotX += diffX * speed;
        localRotY += diffY * speed;

        if (Math.abs(diffX) < 0.002 && Math.abs(diffY) < 0.002) {
          localRotX = targetRotationRef.current.rotX;
          localRotY = targetRotationRef.current.rotY;
          targetRotationRef.current = null;
        }
        setRotX(localRotX);
        setRotY(localRotY);
      } else if (isAutoRotate && !isDraggingRef.current) {
        // Slow peaceful spin
        localRotY += 0.0018;
        setRotY(localRotY);
      }

      pulsePhaseRef.current = (pulsePhaseRef.current + 0.02) % 1;

      // Handle retina / high DPI displays
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }
      ctx.save();
      ctx.scale(dpr, dpr);

      const w = rect.width;
      const h = rect.height;
      const cx = w / 2;
      const cy = h / 2;
      const radius = (Math.min(w, h) / 2) * 0.68 * zoom;

      // Clear Canvas & draw cosmic background
      ctx.clearRect(0, 0, w, h);

      // Cosmic background glow
      const bgGrad = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 2.5);
      bgGrad.addColorStop(0, '#090d16');
      bgGrad.addColorStop(0.6, '#040711');
      bgGrad.addColorStop(1, '#020408');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Starfield particles (deterministic subtle twinkle)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 60; i++) {
        const sx = ((i * 137.5) % w);
        const sy = ((i * 293.1) % h);
        const sz = (i % 3 === 0) ? 1.5 : 0.8;
        ctx.fillRect(sx, sy, sz, sz);
      }

      // Outer atmospheric aura / halo
      const atmosGrad = ctx.createRadialGradient(cx, cy, radius * 0.95, cx, cy, radius * 1.25);
      atmosGrad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
      atmosGrad.addColorStop(0.3, 'rgba(99, 102, 241, 0.15)');
      atmosGrad.addColorStop(0.7, 'rgba(79, 70, 229, 0.04)');
      atmosGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = atmosGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.25, 0, Math.PI * 2);
      ctx.fill();

      // Globe sphere base with 3D spherical lighting gradient
      const globeGrad = ctx.createRadialGradient(
        cx - radius * 0.35,
        cy - radius * 0.35,
        radius * 0.1,
        cx,
        cy,
        radius
      );
      globeGrad.addColorStop(0, '#1e293b');
      globeGrad.addColorStop(0.5, '#0f172a');
      globeGrad.addColorStop(0.85, '#090d16');
      globeGrad.addColorStop(1, '#020617');

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip(); // clip contents inside the sphere boundary

      ctx.fillStyle = globeGrad;
      ctx.fill();

      // Draw Graticule Lines (Parallels & Meridians)
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.3)';
      ctx.lineWidth = 0.8;

      // Parallels (latitude lines)
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        let first = true;
        for (let lon = -180; lon <= 180; lon += 5) {
          const pt = projectPoint(lat, lon, radius, cx, cy, localRotX, localRotY);
          if (pt.isVisible) {
            if (first) {
              ctx.moveTo(pt.x, pt.y);
              first = false;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          } else {
            first = true;
          }
        }
        ctx.stroke();
      }

      // Meridians (longitude lines)
      for (let lon = -180; lon < 180; lon += 30) {
        ctx.beginPath();
        let first = true;
        for (let lat = -80; lat <= 80; lat += 5) {
          const pt = projectPoint(lat, lon, radius, cx, cy, localRotX, localRotY);
          if (pt.isVisible) {
            if (first) {
              ctx.moveTo(pt.x, pt.y);
              first = false;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          } else {
            first = true;
          }
        }
        ctx.stroke();
      }

      // Draw Continental Landmass Outlines & Fills
      ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1.2;

      for (const poly of CONTINENT_POLYGONS) {
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < poly.length; i++) {
          const [plat, plon] = poly[i];
          const pt = projectPoint(plat, plon, radius, cx, cy, localRotX, localRotY);
          if (pt.isVisible) {
            if (!started) {
              ctx.moveTo(pt.x, pt.y);
              started = true;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          }
        }
        if (started) {
          ctx.stroke();
          ctx.fill();
        }
      }

      // 3D Inner edge shading / vignette for depth
      const innerVignette = ctx.createRadialGradient(cx, cy, radius * 0.7, cx, cy, radius);
      innerVignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      innerVignette.addColorStop(1, 'rgba(2, 6, 23, 0.8)');
      ctx.fillStyle = innerVignette;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // End sphere clip
      ctx.restore();

      // Draw Sphere Outer Ring
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw Flight Arcs & Routes in 3D Space (Above Globe Surface)
      for (const route of routes) {
        const [fromLat, fromLon] = route.from_coords;
        const [toLat, toLon] = route.to_coords;

        const steps = 40;
        const arcPoints: { x: number; y: number; isVisible: boolean; z: number }[] = [];

        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          // Spherical interpolation for coordinates
          const curLat = fromLat + (toLat - fromLat) * t;
          const curLon = fromLon + (toLon - fromLon) * t;

          // Parabolic arc elevation above globe (max 1.25x radius at midpoint)
          const elevation = 1.0 + Math.sin(Math.PI * t) * 0.18;
          const pt = projectPoint(curLat, curLon, radius, cx, cy, localRotX, localRotY, elevation);
          arcPoints.push(pt);
        }

        // Draw curved flight route path
        ctx.beginPath();
        let routeStarted = false;
        for (const p of arcPoints) {
          if (p.isVisible) {
            if (!routeStarted) {
              ctx.moveTo(p.x, p.y);
              routeStarted = true;
            } else {
              ctx.lineTo(p.x, p.y);
            }
          } else {
            routeStarted = false;
          }
        }

        ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
        ctx.lineWidth = 2.2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Animated Pulse / Flying Jet along the arc
        const pulseT = pulsePhaseRef.current;
        const pulseIdx = Math.floor(pulseT * (arcPoints.length - 1));
        const pulsePt = arcPoints[pulseIdx];
        if (pulsePt && pulsePt.isVisible) {
          // Glow around pulse
          const pGrad = ctx.createRadialGradient(pulsePt.x, pulsePt.y, 0, pulsePt.x, pulsePt.y, 10);
          pGrad.addColorStop(0, '#38bdf8');
          pGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.6)');
          pGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
          ctx.fillStyle = pGrad;
          ctx.beginPath();
          ctx.arc(pulsePt.x, pulsePt.y, 10, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(pulsePt.x, pulsePt.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Location Markers & Pins
      for (const loc of locations) {
        const pt = projectPoint(loc.latitude, loc.longitude, radius, cx, cy, localRotX, localRotY, 1.0);
        if (!pt.isVisible) continue;

        const isHovered = hoveredLocation?.id === loc.id;
        const isSelected = selectedLocation?.id === loc.id;

        // Pin styling based on location type
        let baseColor = '#6366f1'; // Indigo for activities
        let pinRadius = 4;

        if (loc.type === 'origin') {
          baseColor = '#38bdf8'; // Sky blue
          pinRadius = 5.5;
        } else if (loc.type === 'destination') {
          baseColor = '#10b981'; // Emerald
          pinRadius = 6.5;
        } else if (loc.type === 'hotel') {
          baseColor = '#f59e0b'; // Amber
          pinRadius = 5;
        } else if (loc.type === 'restaurant') {
          baseColor = '#f43f5e'; // Rose
          pinRadius = 4.5;
        }

        // Draw pulsing outer ring for destination or selected node
        if (isSelected || loc.type === 'destination' || isHovered) {
          const expand = 6 + Math.sin(pulsePhaseRef.current * Math.PI * 2) * 3;
          ctx.strokeStyle = baseColor;
          ctx.lineWidth = isSelected ? 2 : 1.2;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pinRadius + expand, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Pin center core
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pinRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Location Label for key locations or when hovered/selected
        const shouldShowLabel = isSelected || isHovered || loc.type === 'origin' || loc.type === 'destination';
        if (shouldShowLabel) {
          const labelText = loc.name;
          ctx.font = isSelected || isHovered ? 'bold 12px Inter, sans-serif' : '11px Inter, sans-serif';
          const textMetrics = ctx.measureText(labelText);
          const padding = 5;
          const boxWidth = textMetrics.width + padding * 2;
          const boxHeight = 18;
          const boxX = pt.x - boxWidth / 2;
          const boxY = pt.y - pinRadius - 22;

          // Tooltip card background
          ctx.fillStyle = isSelected ? 'rgba(79, 70, 229, 0.95)' : 'rgba(15, 23, 42, 0.9)';
          ctx.strokeStyle = isSelected ? '#a5b4fc' : 'rgba(56, 189, 248, 0.5)';
          ctx.lineWidth = 1;

          // Rounded tooltip box
          ctx.beginPath();
          ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 4);
          ctx.fill();
          ctx.stroke();

          // Small connector pointer
          ctx.beginPath();
          ctx.moveTo(pt.x - 3, boxY + boxHeight);
          ctx.lineTo(pt.x, pt.y - pinRadius - 1);
          ctx.lineTo(pt.x + 3, boxY + boxHeight);
          ctx.fillStyle = isSelected ? 'rgba(79, 70, 229, 0.95)' : 'rgba(15, 23, 42, 0.9)';
          ctx.fill();

          // Tooltip text
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(labelText, pt.x, boxY + boxHeight / 2);
        }
      }

      ctx.restore();
      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [
    rotX,
    rotY,
    zoom,
    isAutoRotate,
    locations,
    routes,
    selectedLocation,
    hoveredLocation,
    projectPoint,
    onSelectLocation,
  ]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden bg-slate-950 flex flex-col items-center justify-center"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleClick}
      style={{ cursor: isDraggingRef.current ? 'grabbing' : 'grab' }}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Floating Controls HUD in Top-Right */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-1.5 shadow-xl">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => Math.min(2.5, z + 0.2));
          }}
          title="Zoom In"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => Math.max(0.6, z - 0.2));
          }}
          title="Zoom Out"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <div className="w-full h-[1px] bg-slate-800 my-0.5" />

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsAutoRotate((r) => !r);
          }}
          title={isAutoRotate ? 'Pause Rotation' : 'Resume Auto-Rotate'}
          className={`p-2 rounded-lg transition-colors ${
            isAutoRotate
              ? 'text-indigo-400 bg-indigo-950/40 hover:bg-indigo-900/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          {isAutoRotate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setZoom(1.0);
            if (locations.length > 0) {
              const dest = locations.find((l) => l.type === 'destination') || locations[0];
              flyTo(dest.latitude, dest.longitude);
            } else {
              setRotX(0.35);
              setRotY(-1.35);
            }
          }}
          title="Reset Globe View"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

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
