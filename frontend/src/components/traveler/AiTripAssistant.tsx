import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  RefreshCw,
  Compass,
  ArrowRight,
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import { CopilotChatMessage } from '../../types/trip-planner';

interface AiTripAssistantProps {
  messages: CopilotChatMessage[];
  onSendMessage: (messageText: string) => void;
  isLoading: boolean;
  error: string | null;
}

const QUICK_PROMPTS = [
  'Plan a 3-day luxury beach escape to Goa',
  '5-day mountain adventure in Manali',
  '4-day royal heritage & culture tour of Jaipur',
  '3-day romantic retreat to Dal Lake Srinagar'
];

export const AiTripAssistant: React.FC<AiTripAssistantProps> = ({
  messages,
  onSendMessage,
  isLoading,
  error,
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
              AI Trip Co-Pilot
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Multi-agent trip planner & route optimizer
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-[10px] text-emerald-300 font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Active</span>
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

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-slate-800/80 border border-slate-700/60 text-slate-200 rounded-tl-sm shadow-md'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                <div
                  className={`text-[10px] mt-1.5 text-right ${
                    isUser ? 'text-indigo-200' : 'text-slate-500'
                  }`}
                >
                  {msg.timestamp}
                </div>
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
                <span className="animate-pulse">Synthesizing Itinerary...</span>
              </div>
              <p className="text-slate-400 text-xs">
                Querying Neon Destination Knowledge Base and calculating flight coordinates...
              </p>
              <div className="flex gap-1 pt-1">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block mb-0.5">Planning Request Notice</span>
              {error}
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
            placeholder="e.g. Plan a 3-day luxury trip to Goa..."
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
