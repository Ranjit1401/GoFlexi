import React, { useState } from 'react';
import {
  Sparkles,
  Bookmark,
  Check,
  RotateCcw,
  Compass,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Wallet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TripPlan, TripLocation, CopilotChatMessage } from '../../types/trip-planner';
import { generateTripPlan } from '../../services/trip-planner';
import { createTrip } from '../../services/trips';
import { TripPlanTree } from '../../components/traveler/TripPlanTree';
import { TripGlobe } from '../../components/traveler/TripGlobe';
import { AiTripAssistant } from '../../components/traveler/AiTripAssistant';

export const AiTripCopilotPage: React.FC = () => {
  const { user } = useAuth();

  const [tripPlan, setTripPlan] = useState<TripPlan | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<TripLocation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Chat message state
  const [messages, setMessages] = useState<CopilotChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'assistant',
      text: "Welcome to GoFlexi AI Trip Co-Pilot! 🌍\n\nI'm your multi-agent travel planner. Tell me where you'd like to travel, your preferred duration, companions, or pacing, and I'll synthesize your Neon preferences into a complete interactive itinerary with 3D flight arcs and mapped waypoints.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const handleSendMessage = async (userPrompt: string) => {
    const userMsg: CopilotChatMessage = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      text: userPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);
    setIsSaved(false);

    try {
      const response = await generateTripPlan({ message: userPrompt });

      setTripPlan(response.trip_plan);

      // Select destination waypoint as default
      const defaultLoc =
        response.trip_plan.locations.find((l) => l.type === 'destination') ||
        response.trip_plan.locations[0] ||
        null;
      setSelectedLocation(defaultLoc);

      const assistantMsg: CopilotChatMessage = {
        id: `msg_a_${Date.now()}`,
        sender: 'assistant',
        text: response.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        plan: response.trip_plan,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorDetail =
        err.response?.data?.detail ||
        err.message ||
        'Unable to synthesize itinerary for this destination. Please try mentioning a destination like Goa, Manali, Jaipur, or Srinagar.';
      setError(errorDetail);

      const errorMsg: CopilotChatMessage = {
        id: `msg_err_${Date.now()}`,
        sender: 'assistant',
        text: `Notice: ${errorDetail}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLocation = (loc: TripLocation) => {
    setSelectedLocation(loc);
  };

  const handleSaveTrip = async () => {
    if (!tripPlan) return;
    setIsSaved(true);
    try {
      await createTrip({
        title: tripPlan.title || `${tripPlan.destination} Journey`,
        destination: tripPlan.destination || 'Custom Destination',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + (tripPlan.duration_days || 4) * 86400000).toISOString().split('T')[0],
        days: tripPlan.duration_days || 4,
        travelers_count: 2,
        budget: tripPlan.estimated_budget || '₹35,000',
        status: 'Upcoming',
        itinerary_summary: `${tripPlan.duration_days || 4}-day curated AI journey to ${tripPlan.destination}.`,
        tags: ['AI Co-Pilot', tripPlan.destination],
        stops: tripPlan.locations?.map((l) => l.name) || [],
      });
    } catch (err) {
      console.error('Failed to persist AI Co-Pilot trip:', err);
    }
    setTimeout(() => {
      setIsSaved(false);
    }, 4000);
  };

  const handleReset = () => {
    setTripPlan(null);
    setSelectedLocation(null);
    setError(null);
    setIsSaved(false);
    setMessages([
      {
        id: `msg_reset_${Date.now()}`,
        sender: 'assistant',
        text: "Workspace reset. Where would you like to plan your next journey?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* Top Navigation Bar */}
      <header className="h-14 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-white leading-none">
                AI Trip Co-Pilot
              </h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-700/50 font-medium">
                Phase 6A
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Multi-agent trip planner & 3D route workspace
            </p>
          </div>
        </div>

        {/* Dynamic Trip Summary Badge (if plan is loaded) */}
        {tripPlan && (
          <div className="hidden md:flex items-center gap-3 bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="font-semibold text-white">{tripPlan.origin}</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span className="font-semibold text-indigo-400">{tripPlan.destination}</span>
            </div>
            <div className="h-3 w-[1px] bg-slate-700" />
            <div className="flex items-center gap-1 text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{tripPlan.duration_days} Days</span>
            </div>
            {tripPlan.estimated_budget && (
              <>
                <div className="h-3 w-[1px] bg-slate-700" />
                <div className="flex items-center gap-1 text-slate-400">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{tripPlan.estimated_budget}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {tripPlan && (
            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveTrip}
            disabled={!tripPlan}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm ${
              isSaved
                ? 'bg-emerald-600 text-white'
                : tripPlan
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
            }`}
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Trip Saved!</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" />
                <span>Save Trip</span>
              </>
            )}
          </button>

          {/* Traveler User Indicator */}
          {user && (
            <div className="ml-1 pl-2 border-l border-slate-800 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 3-Panel Planning Workspace */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* LEFT PANEL (~22%): Hierarchical Trip Plan Tree */}
        <div className="w-[300px] xl:w-[340px] flex-shrink-0 h-full overflow-hidden">
          <TripPlanTree
            plan={tripPlan}
            selectedLocation={selectedLocation}
            onSelectLocation={handleSelectLocation}
            isLoading={isLoading}
          />
        </div>

        {/* CENTER PANEL (~52%): Interactive 3D Globe & Route Map */}
        <div className="flex-1 h-full relative overflow-hidden bg-slate-950">
          <TripGlobe
            locations={tripPlan?.locations || []}
            routes={tripPlan?.routes || []}
            selectedLocation={selectedLocation}
            onSelectLocation={handleSelectLocation}
          />
        </div>

        {/* RIGHT PANEL (~26%): AI Trip Assistant Chat & Prompt Engine */}
        <div className="w-[320px] xl:w-[380px] flex-shrink-0 h-full overflow-hidden">
          <AiTripAssistant
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>
    </div>
  );
};
export default AiTripCopilotPage;
