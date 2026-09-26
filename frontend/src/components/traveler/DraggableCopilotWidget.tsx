import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'voyara_copilot_fab_pos';
const WIDGET_SIZE = 56; // 56px (w-14 h-14)
const PADDING = 16;

export const DraggableCopilotWidget: React.FC = () => {
  const navigate = useNavigate();

  // Position state (pixels from top-left of viewport)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // References for drag calculation
  const isPointerDownRef = useRef(false);
  const startPointerRef = useRef({ x: 0, y: 0 });
  const startWidgetPosRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  // Compute safe initial position or load from storage
  useEffect(() => {
    const updateInitialPosition = () => {
      const maxX = window.innerWidth - WIDGET_SIZE - PADDING;
      const maxY = window.innerHeight - WIDGET_SIZE - PADDING;

      try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            const clampedX = Math.max(PADDING, Math.min(maxX, parsed.x));
            const clampedY = Math.max(PADDING, Math.min(maxY, parsed.y));
            setPosition({ x: clampedX, y: clampedY });
            return;
          }
        }
      } catch {
        // fallback
      }

      // Default: Bottom-right corner
      setPosition({
        x: Math.max(PADDING, maxX - 12),
        y: Math.max(PADDING, maxY - 16),
      });
    };

    updateInitialPosition();

    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return null;
        const maxX = window.innerWidth - WIDGET_SIZE - PADDING;
        const maxY = window.innerHeight - WIDGET_SIZE - PADDING;
        return {
          x: Math.max(PADDING, Math.min(maxX, prev.x)),
          y: Math.max(PADDING, Math.min(maxY, prev.y)),
        };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only respond to main button
    if (e.button !== 0) return;

    isPointerDownRef.current = true;
    hasMovedRef.current = false;
    startPointerRef.current = { x: e.clientX, y: e.clientY };
    if (position) {
      startWidgetPosRef.current = { x: position.x, y: position.y };
    }

    // Capture pointer events so dragging outside the element still works
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;

    const deltaX = e.clientX - startPointerRef.current.x;
    const deltaY = e.clientY - startPointerRef.current.y;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance > 5) {
      hasMovedRef.current = true;
      if (!isDragging) {
        setIsDragging(true);
      }

      const maxX = window.innerWidth - WIDGET_SIZE - PADDING;
      const maxY = window.innerHeight - WIDGET_SIZE - PADDING;

      const newX = Math.max(PADDING, Math.min(maxX, startWidgetPosRef.current.x + deltaX));
      const newY = Math.max(PADDING, Math.min(maxY, startWidgetPosRef.current.y + deltaY));

      setPosition({ x: newX, y: newY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (hasMovedRef.current) {
      // Save dragged position
      setIsDragging(false);
      hasMovedRef.current = false;
      if (position) {
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(position));
        } catch {
          // ignore
        }
      }
    } else {
      // Was a tap / click!
      setIsDragging(false);
      navigate('/user/ai-trip-copilot');
    }
  };

  const handlePointerCancel = () => {
    isPointerDownRef.current = false;
    setIsDragging(false);
    hasMovedRef.current = false;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate('/user/ai-trip-copilot');
    }
  };

  if (!position) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Open AI Trip Co-Pilot"
      title="Open AI Trip Co-Pilot (Drag anywhere)"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onKeyDown={handleKeyDown}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: 'none',
      }}
      className={`fixed z-50 select-none group focus:outline-none focus:ring-4 focus:ring-brand-400/40 rounded-full ${
        isDragging
          ? 'cursor-grabbing scale-105 shadow-2xl'
          : 'cursor-grab hover:scale-105 active:scale-95 transition-transform duration-200'
      }`}
    >
      {/* Outer ambient glow pulse */}
      <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-500 opacity-60 blur-md group-hover:opacity-90 animate-pulse pointer-events-none" />

      {/* Main button circle */}
      <div className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-brand-600 via-indigo-600 to-violet-600 p-[1.5px] shadow-xl shadow-brand-600/30 flex items-center justify-center border border-white/20">
        <div className="w-full h-full rounded-full bg-navy-950/20 backdrop-blur-xs flex items-center justify-center relative overflow-hidden">
          {/* Subtle sheen highlight */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-transparent pointer-events-none" />

          {/* Icon */}
          <div className="relative flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white drop-shadow" />
            <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1.5 -right-1.5 drop-shadow animate-pulse" />
          </div>
        </div>

        {/* Live indicator dot */}
        <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white shadow-sm"></span>
        </span>
      </div>

      {/* Dynamic Tooltip on Hover */}
      <div
        className={`absolute right-full mr-3 top-1/2 -translate-y-1/2 pointer-events-none whitespace-nowrap bg-navy-950/90 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg border border-slate-700/60 backdrop-blur-md flex items-center gap-1.5 transition-all duration-200 ${
          isDragging ? 'opacity-0 scale-90' : 'opacity-0 group-hover:opacity-100 group-hover:scale-100'
        }`}
      >
        <Sparkles className="w-3.5 h-3.5 text-brand-400" />
        <span>AI Trip Co-Pilot</span>
        <span className="text-[10px] text-slate-400 font-normal">| Drag anywhere</span>
      </div>
    </div>
  );
};
