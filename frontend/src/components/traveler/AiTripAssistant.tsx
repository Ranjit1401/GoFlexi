import React, { useEffect, useRef, useState } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  Compass,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Plus,
  MessageCircle,
  Route,
  BarChart3,
  CalendarDays,
  Users,
  Clock3,
} from 'lucide-react';
import { CopilotChatMessage, DiscoveredPlace, TripLocation, TripPlan } from '../../types/trip-planner';
import { TripMapPanel } from './TripMapPanel';
import { WeatherDigitalTwin } from './WeatherDigitalTwin';

interface AiTripAssistantProps {
  messages: CopilotChatMessage[];
  onSendMessage: (messageText: string) => void;
  onAddPlace?: (place: DiscoveredPlace) => void;
  selectedPlaces?: DiscoveredPlace[];
  selectedLocation?: TripLocation | null;
  tripPlan?: TripPlan | null;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
}

type AssistantTab = 'chat' | 'map' | 'insights';

export const AiTripAssistant: React.FC<AiTripAssistantProps> = ({
  messages,
  onSendMessage,
  onAddPlace,
  selectedPlaces = [],
  selectedLocation = null,
  tripPlan = null,
  isLoading,
  error,
  onRetry,
}) => {
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<AssistantTab>('chat');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;
    onSendMessage(trimmed);
    setInputText('');
  };

  const handleChipClick = (text: string) => {
    if (!isLoading) onSendMessage(text);
  };

  const renderInlineBold = (text: string) =>
    text.split(/(\*\*.*?\*\*)/g).map((part, index) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={index} className="font-semibold text-[#071225]">
          {part.slice(2, -2)}
        </strong>
      ) : (
        part
      ),
    );

  const renderFormattedText = (text: string) => (
    <div className="space-y-1.5 leading-relaxed">
      {text.split('\n').map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={index} className="h-1" />;

        if (/^[•*-]\s/.test(trimmed)) {
          return (
            <div key={index} className="flex items-start gap-1.5 text-slate-600">
              <span className="font-bold text-[#1683F7]">•</span>
              <span>{renderInlineBold(trimmed.replace(/^[•*-]\s/, ''))}</span>
            </div>
          );
        }

        return <p key={index}>{renderInlineBold(trimmed)}</p>;
      })}
    </div>
  );

  const totalDistance = (tripPlan?.routes || []).reduce(
    (sum, route) => sum + (route.distance_km || 0),
    0,
  );

  const tabs = [
    { id: 'chat' as const, label: 'Chat', icon: MessageCircle },
    { id: 'map' as const, label: 'Trip Map', icon: Route },
    { id: 'insights' as const, label: 'Insights', icon: BarChart3 },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1683F7]/10 text-[#1683F7]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#071225]">GoFlexi AI Assistant</h3>
            <p className="mt-0.5 text-[11px] text-slate-500">Your personal travel co-pilot</p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-600">
          Online
        </span>
      </div>

      <div className="grid grid-cols-3 border-b border-slate-200">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center justify-center gap-1.5 border-b-2 px-2 py-3.5 text-[11px] font-semibold transition ${
              activeTab === id
                ? 'border-[#1683F7] text-[#1683F7]'
                : 'border-transparent text-slate-500 hover:text-[#071225]'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'chat' && (
        <>
          <div className="flex-1 min-h-0 overflow-y-auto p-5">
            {messages.length === 0 && !isLoading ? (
              <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1683F7]/10 text-[#1683F7]">
                  <Bot className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-semibold text-[#071225]">Start planning with GoFlexi AI</h4>
                <p className="mt-1 max-w-[230px] text-[11px] leading-relaxed text-slate-500">
                  Tell me where you want to go, what you want to experience, or ask me to build a trip.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div key={msg.id} className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
                      <div
                        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${
                          isUser ? 'bg-[#1683F7] text-white' : 'border border-slate-200 bg-slate-50 text-[#1683F7]'
                        }`}
                      >
                        {isUser ? <UserIcon className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                      </div>

                      <div className={`max-w-[88%] space-y-2 ${isUser ? 'items-end' : ''}`}>
                        <div
                          className={`rounded-2xl p-3 text-[11px] ${
                            isUser
                              ? 'rounded-tr-sm bg-[#1683F7] text-white'
                              : 'rounded-tl-sm border border-slate-200 bg-slate-50 text-slate-700'
                          }`}
                        >
                          {isUser ? <div className="whitespace-pre-wrap">{msg.text}</div> : renderFormattedText(msg.text)}
                          <div className={`mt-2 text-right text-[9px] ${isUser ? 'text-blue-100' : 'text-slate-400'}`}>
                            {msg.timestamp}
                          </div>
                        </div>

                        {!isUser && msg.places && msg.places.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
                              <Compass className="h-3.5 w-3.5 text-[#1683F7]" />
                              Verified places
                            </div>
                            {msg.places.map((place, index) => {
                              const added = selectedPlaces.some(
                                (selected) => selected.name.toLowerCase() === place.name.toLowerCase(),
                              );
                              return (
                                <div key={`${place.name}-${index}`} className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
                                  <div className="flex items-center gap-2.5">
                                    {place.image_url ? (
                                      <img src={place.image_url} alt={place.name} className="h-11 w-12 rounded-lg object-cover" />
                                    ) : (
                                      <div className="flex h-11 w-12 items-center justify-center rounded-lg bg-[#1683F7]/5 text-[#1683F7]">
                                        <MapPin className="h-4 w-4" />
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <h4 className="truncate text-[11px] font-semibold text-[#071225]">{place.name}</h4>
                                      <p className="mt-0.5 line-clamp-2 text-[9px] text-slate-500">{place.description}</p>
                                      {place.source && <span className="text-[8px] uppercase tracking-wide text-slate-400">{place.source}</span>}
                                    </div>
                                    <button
                                      type="button"
                                      disabled={added || isLoading}
                                      onClick={() => onAddPlace?.(place)}
                                      className={`rounded-lg px-2 py-1.5 text-[9px] font-semibold ${
                                        added
                                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-600'
                                          : 'bg-[#1683F7] text-white hover:bg-[#0f72dc]'
                                      }`}
                                    >
                                      {added ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {!isUser && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {msg.suggestedActions.map((action, index) => (
                              <button
                                key={`${action}-${index}`}
                                type="button"
                                disabled={isLoading}
                                onClick={() => handleChipClick(action)}
                                className="rounded-lg border border-[#1683F7]/20 bg-[#1683F7]/5 px-2.5 py-1.5 text-[9px] font-medium text-[#1683F7] hover:bg-[#1683F7]/10"
                              >
                                {action}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {isLoading && (
              <div className="mt-4 rounded-xl border border-[#1683F7]/20 bg-[#1683F7]/5 p-3 text-[10px] text-[#1683F7]">
                GoFlexi AI is retrieving live destination and trip data…
              </div>
            )}

            {error && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[10px] text-rose-600">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="font-semibold">Request issue</span>
                    <p className="mt-0.5">{error}</p>
                    {onRetry && (
                      <button type="button" onClick={onRetry} className="mt-2 font-semibold underline">
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-200 p-4">
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                disabled={isLoading}
                placeholder="Ask anything about your next trip…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-11 text-[12px] text-[#071225] outline-none focus:border-[#1683F7] focus:ring-2 focus:ring-[#1683F7]/10"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg bg-[#1683F7] text-white disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </>
      )}

      {activeTab === 'map' && (
        <div className="flex-1 overflow-y-auto p-3.5">
          {!tripPlan ? (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <Route className="h-7 w-7 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-[#071225]">Your trip map will appear here</p>
              <p className="mt-1 text-[10px] text-slate-500">Build a trip with the AI assistant to map its real locations.</p>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#1683F7]">Your trip route</p>
                  <h4 className="mt-1 text-sm font-semibold text-[#071225]">{tripPlan.title}</h4>
                </div>
                <span className="rounded-lg bg-[#1683F7]/5 px-2 py-1 text-[9px] font-semibold text-[#1683F7]">
                  {tripPlan.duration_days} days
                </span>
              </div>

              <div className="mb-3 space-y-2">
                {tripPlan.locations
                  .filter((location) => location.day)
                  .sort((a, b) => (a.day || 0) - (b.day || 0))
                  .slice(0, 6)
                  .map((location, index) => (
                    <div key={location.id} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1683F7] text-[9px] font-bold text-white">
                        {location.day || index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[10px] font-semibold text-[#071225]">{location.name}</p>
                        <p className="text-[9px] text-slate-500">{location.type}</p>
                      </div>
                    </div>
                  ))}
              </div>

              <TripMapPanel plan={tripPlan} selectedLocation={selectedLocation} />
            </>
          )}
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="flex-1 overflow-y-auto p-3.5">
          {!tripPlan ? (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <BarChart3 className="h-7 w-7 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-[#071225]">Trip insights will appear here</p>
              <p className="mt-1 text-[10px] text-slate-500">Insights are calculated from your actual trip plan and live data.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tripPlan.estimated_budget && (
                <div className="rounded-2xl border border-slate-200 bg-[#F7F9FC] p-4">
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#1683F7]">Estimated budget</p>
                  <p className="mt-1 text-2xl font-semibold text-[#071225]">{tripPlan.estimated_budget}</p>
                  <p className="mt-1 text-[9px] text-slate-500">From the current trip plan; final billing uses available live pricing.</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Duration', value: `${tripPlan.duration_days} days`, icon: CalendarDays },
                  { label: 'Mapped places', value: `${tripPlan.locations.length}`, icon: MapPin },
                  { label: 'Route distance', value: totalDistance ? `${Math.round(totalDistance)} km` : '—', icon: Route },
                  { label: 'Selected places', value: `${selectedPlaces.length}`, icon: Compass },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-xl border border-slate-200 bg-white p-3">
                    <Icon className="h-4 w-4 text-[#1683F7]" />
                    <p className="mt-2 text-[10px] text-slate-500">{label}</p>
                    <p className="mt-0.5 text-xs font-semibold text-[#071225]">{value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#1683F7]" />
                  <div>
                    <p className="text-[9px] text-slate-500">Travellers</p>
                    <p className="text-xs font-semibold text-[#071225]">Set in trip planning</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-slate-400" />
                  <span className="text-[10px] text-slate-500">
                    {tripPlan.start_date && tripPlan.end_date
                      ? `${tripPlan.start_date} → ${tripPlan.end_date}`
                      : 'Dates not set yet'}
                  </span>
                </div>
              </div>

              <WeatherDigitalTwin plan={tripPlan} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiTripAssistant;
