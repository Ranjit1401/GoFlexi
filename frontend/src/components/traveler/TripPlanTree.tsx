import React, { useState } from 'react';
import {
  Plane,
  Building2,
  Calendar,
  Compass,
  Utensils,
  MapPin,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { TripPlan, TripPlanNode, TripLocation } from '../../types/trip-planner';

interface TripPlanTreeProps {
  plan: TripPlan | null;
  selectedLocation: TripLocation | null;
  onSelectLocation: (location: TripLocation) => void;
  isLoading?: boolean;
}

export const TripPlanTree: React.FC<TripPlanTreeProps> = ({
  plan,
  selectedLocation,
  onSelectLocation,
  isLoading = false,
}) => {
  // Collapsed state map for node IDs
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  const toggleNode = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const getNodeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'flight':
      case 'transport':
        return <Plane className="w-4 h-4 text-sky-400" />;
      case 'hotel':
      case 'accommodation':
        return <Building2 className="w-4 h-4 text-emerald-400" />;
      case 'day':
        return <Calendar className="w-4 h-4 text-amber-400" />;
      case 'restaurant':
        return <Utensils className="w-4 h-4 text-rose-400" />;
      case 'destination':
        return <MapPin className="w-4 h-4 text-indigo-400" />;
      case 'activity':
      default:
        return <Compass className="w-4 h-4 text-indigo-400" />;
    }
  };

  const renderNode = (node: TripPlanNode, depth: number = 0) => {
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const isCollapsed = Boolean(collapsedNodes[node.id]);
    const isLocationSelected =
      node.location && selectedLocation && node.location.id === selectedLocation.id;

    return (
      <div key={node.id} className="relative group/node select-none">
        {/* Connector vertical line for hierarchy */}
        {depth > 0 && (
          <div
            className="absolute left-[-16px] top-0 bottom-0 w-[1.5px] bg-slate-800 group-hover/node:bg-slate-700 transition-colors"
          />
        )}

        <div
          onClick={() => {
            if (node.location) {
              onSelectLocation(node.location);
            }
          }}
          className={`flex items-start gap-2.5 p-2 rounded-lg text-sm transition-all duration-150 cursor-pointer ${
            isLocationSelected
              ? 'bg-indigo-950/60 border border-indigo-500/50 shadow-sm shadow-indigo-500/10'
              : 'hover:bg-slate-800/60 border border-transparent'
          }`}
          style={{ marginLeft: `${depth * 14}px` }}
        >
          {/* Collapse/Expand chevron or placeholder */}
          <div className="pt-0.5 flex-shrink-0">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleNode(node.id, e)}
                className="p-0.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <div className="w-4 h-4 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover/node:bg-indigo-400 transition-colors" />
              </div>
            )}
          </div>

          {/* Node Icon */}
          <div className="pt-0.5 flex-shrink-0">
            <div className="p-1 rounded bg-slate-800 border border-slate-700/80">
              {getNodeIcon(node.type)}
            </div>
          </div>

          {/* Node Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-medium truncate ${isLocationSelected ? 'text-indigo-200' : 'text-slate-200'}`}>
                {node.title}
              </span>

              {/* Status Badge */}
              {node.status && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full uppercase tracking-wider font-semibold border ${
                    node.status === 'confirmed'
                      ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/40'
                      : 'bg-indigo-950/40 text-indigo-300 border-indigo-800/40'
                  }`}
                >
                  {node.status}
                </span>
              )}
            </div>

            {node.subtitle && (
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {node.subtitle}
              </p>
            )}

            {(node.date || node.time) && (
              <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                {node.date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {node.date}
                  </span>
                )}
                {node.time && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {node.time}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Child Nodes */}
        {hasChildren && !isCollapsed && (
          <div className="relative pl-3 mt-1 space-y-1">
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <Sparkles className="w-5 h-5 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-200">Building Trip Plan Hierarchy</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
            Synthesizing destination knowledge base & multi-agent route nodes...
          </p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
        <div className="w-12 h-12 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mb-3 text-slate-500">
          <Layers className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-medium text-slate-300">No Trip Plan Generated</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-[220px]">
          Describe your dream trip in the Co-Pilot panel to assemble an interactive itinerary tree.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900 border-r border-slate-800">
      {/* Header Summary */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Structured Trip Hierarchy</span>
        </div>
        <h3 className="font-semibold text-slate-100 text-base leading-tight truncate">
          {plan.title}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1.5">
          <span className="font-medium text-slate-300">{plan.origin}</span>
          <ArrowRight className="w-3 h-3 text-slate-500" />
          <span className="font-medium text-indigo-300">{plan.destination}</span>
          <span className="mx-1 text-slate-600">•</span>
          <span>{plan.duration_days} Days</span>
        </div>

        {/* Quick Meta Pills */}
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {plan.travel_style && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {plan.travel_style}
            </span>
          )}
          {plan.estimated_budget && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
              {plan.estimated_budget}
            </span>
          )}
        </div>
      </div>

      {/* Scrollable Tree View */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
        {plan.nodes.map((node) => renderNode(node, 0))}
      </div>

      {/* Tree Footer / Quick stats */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between text-xs text-slate-500">
        <span>{plan.locations.length} Waypoints mapped</span>
        <span>{plan.routes.length} Flight corridors</span>
      </div>
    </div>
  );
};
