import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  Compass,
  ArrowRight,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  Tag,
  MapPin,
  Plus
} from 'lucide-react';
import { CopilotChatMessage, DiscoveredPlace } from '../../types/trip-planner';

interface AiTripAssistantProps {
  messages: CopilotChatMessage[];
  onSendMessage: (messageText: string) => void;
  onAddPlace?: (place: DiscoveredPlace) => void;
  selectedPlaces?: DiscoveredPlace[];
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
}

const QUICK_PROMPTS = [
  'I want to visit Jaipur',
  'What can I do in Jaipur?',
  'Where should I go?',
  'Explore beaches in Goa'
];

export const AiTripAssistant: React.FC<AiTripAssistantProps> = ({
  messages,
  onSendMessage,
  onAddPlace,
  selectedPlaces = [],
  isLoading,
  error,
  onRetry,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;
    onSendMessage(trimmed);
    setInputText('');
  };

  const handleChipClick = (chipText: string) => {
    if (isLoading) return;
    onSendMessage(chipText);
  };

  // Helper to format simple markdown-like elements (bullets, bold)
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={idx} className="h-1" />;
          }

          // Bullet item
          if (trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const content = trimmed.replace(/^(\s*[-*•]\s*)/, '');
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1 text-slate-300">
                <span className="text-indigo-400 font-bold">•</span>
                <span>{renderInlineBold(content)}</span>
              </div>
            );
          }

          // Numbered item (e.g. "1.", "2.")
          const matchNum = trimmed.match(/^(\d+)\.\s+(.*)/);
          if (matchNum) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1 text-slate-300">
                <span className="text-indigo-400 font-medium text-[11px] min-w-[14px]">
                  {matchNum[1]}.
                </span>
                <span>{renderInlineBold(matchNum[2])}</span>
              </div>
            );
          }

          return <p key={idx}>{renderInlineBold(trimmed)}</p>;
        })}
      </div>
    );
  };

  const renderInlineBold = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-800">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white leading-none">
              GoFlexi AI Assistant
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Real-time Groq LLM & Neon DB Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-[10px] text-emerald-300 font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Groq Online</span>
        </div>
      </div>

      {/* Message History Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs leading-relaxed ${
                isUser ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center ${
                  isUser
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 border border-slate-700 text-indigo-400'
                }`}
              >
                {isUser ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              {/* Message Content Container */}
              <div className={`max-w-[88%] space-y-2.5 ${isUser ? 'items-end' : 'items-start'}`}>
                {/* Bubble */}
                <div
                  className={`rounded-2xl p-3.5 ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md'
                      : 'bg-slate-800/90 border border-slate-700/70 text-slate-200 rounded-tl-sm shadow-md'
                  }`}
                >
                  {isUser ? (
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  ) : (
                    renderFormattedText(msg.text)
                  )}

                  <div
                    className={`text-[10px] mt-2 text-right ${
                      isUser ? 'text-indigo-200' : 'text-slate-500'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {/* Real Discovered Place Cards */}
                {!isUser && msg.places && msg.places.length > 0 && (
                  <div className="space-y-2 pt-1 w-full">
                    <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Verified Sights & Attractions ({msg.places.length})</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {msg.places.map((place, pIdx) => {
                        const isAdded = selectedPlaces.some(
                          (sp) => sp.name.toLowerCase() === place.name.toLowerCase()
                        );
                        return (
                          <div
                            key={pIdx}
                            className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-between gap-3 hover:border-indigo-500/50 transition-all shadow-sm"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {place.image_url ? (
                                <img
                                  src={place.image_url}
                                  alt={place.name}
                                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-slate-700"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 flex-shrink-0">
                                  <MapPin className="w-5 h-5 text-indigo-400" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <h4 className="text-xs font-semibold text-white truncate">
                                  {place.name}
                                </h4>
                                <p className="text-[10px] text-slate-400 line-clamp-1">
                                  {place.description}
                                </p>
                                <span className="text-[9px] text-slate-500 font-mono">
                                  📍 {place.latitude.toFixed(2)}°, {place.longitude.toFixed(2)}°
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={isAdded || isLoading}
                              onClick={() => onAddPlace && onAddPlace(place)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 flex-shrink-0 transition-colors ${
                                isAdded
                                  ? 'bg-emerald-950/70 border border-emerald-700/50 text-emerald-300 cursor-default'
                                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                              }`}
                            >
                              {isAdded ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>In Trip</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add to trip</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Suggested Action Chips (for Assistant responses) */}
                {!isUser && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.suggestedActions.map((action, aIdx) => (
                      <button
                        key={aIdx}
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleChipClick(action)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/50 text-[11px] text-indigo-300 hover:text-indigo-100 transition-colors disabled:opacity-50"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                        <span>{action}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Real-time Thinking Bubble */}
        {isLoading && (
          <div className="flex gap-3 text-xs">
            <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            </div>
            <div className="bg-slate-800/90 border border-indigo-500/30 rounded-2xl rounded-tl-sm p-3.5 text-slate-200 space-y-2 shadow-lg">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-[11px] uppercase tracking-wider">
                <span className="animate-pulse">Consulting GoFlexi Knowledge & Groq LLM...</span>
              </div>
              <p className="text-slate-400 text-xs">
                Retrieving authentic destination coordinates and verified OpenTripMap sights...
              </p>
              <div className="flex gap-1 pt-1">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Error Alert with Retry State */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block mb-0.5">Notice</span>
              <p>{error}</p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-2 px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-[11px] font-medium transition-colors"
                >
                  Retry Request
                </button>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="p-3 border-t border-slate-800/70 bg-slate-900/60">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mb-2">
          <Lightbulb className="w-3 h-3 text-amber-400" />
          <span>Quick Inspiration</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={() => handleChipClick(chip)}
              className="text-[11px] text-left px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/90">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder="Ask GoFlexi AI... (e.g. 'I want to visit Jaipur', 'Add City Palace', 'Plan 3 days')"
            className="w-full pl-3.5 pr-10 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="absolute right-1.5 p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-40 disabled:hover:bg-indigo-600"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AiTripAssistant;
