'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { playClick, playSuccess, playError } from '@/lib/sounds';
import type { CareerRoadmap } from '@/lib/types';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface RoadmapChatProps {
  roadmaps: CareerRoadmap[];
  selectedPath?: string;
}

/** Client-side fallback: strip any <think> blocks that slipped through */
function sanitizeContent(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^<think>[\s\S]*/i, '')
    .replace(/<\/?think>/gi, '')
    .trim();
}

function formatMessage(text: string) {
  const cleaned = sanitizeContent(text);
  const lines = cleaned.split('\n');
  return lines.map((line, i) => {
    const sourceMatch = line.match(/^(📹|📄|📚)\s*(.+)/);
    if (sourceMatch) {
      return (
        <div key={i} className="flex gap-2 items-start mt-1 p-2 bg-white/60 rounded-lg text-xs">
          <span className="flex-shrink-0 text-sm">{sourceMatch[1]}</span>
          <span className="text-slate-700">{sourceMatch[2]}</span>
        </div>
      );
    }
    if (line.trim() === '') return <br key={i} />;
    // Markdown headers: # ## ### -> styled headings
    const h1Match = line.match(/^#\s+(.+)$/);
    if (h1Match) return <h1 key={i} className="font-bold text-slate-900 mt-3 mb-1 text-base">{h1Match[1]}</h1>;
    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) return <h2 key={i} className="font-semibold text-slate-800 mt-2 mb-1 text-sm">{h2Match[1]}</h2>;
    const h3Match = line.match(/^###\s+(.+)$/);
    if (h3Match) return <h3 key={i} className="font-medium text-slate-700 mt-1.5 mb-0.5 text-sm">{h3Match[1]}</h3>;
    return <p key={i} className="mb-1">{line}</p>;
  });
}

const STEAM_PARTICLES = [
  { delay: 0, x: -6, drift: 4 },
  { delay: 0.8, x: 2, drift: -3 },
  { delay: 1.6, x: 8, drift: 5 },
  { delay: 0.4, x: -2, drift: -4 },
];

function WaffleSvg() {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full" style={{ filter: 'drop-shadow(0 2px 4px rgba(120,70,0,0.35))' }}>
      <defs>
        <linearGradient id="waffleBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#EAA520" />
          <stop offset="50%" stopColor="#D4930A" />
          <stop offset="100%" stopColor="#B87A08" />
        </linearGradient>
        <linearGradient id="butterPat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="100%" stopColor="#FCD34D" />
        </linearGradient>
        <linearGradient id="syrupDrip" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#92400E" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
        <radialGradient id="pocketShade">
          <stop offset="0%" stopColor="rgba(0,0,0,0.08)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      {/* Waffle body */}
      <rect x="6" y="10" width="52" height="46" rx="7" fill="url(#waffleBody)" />
      <rect x="6" y="10" width="52" height="46" rx="7" fill="none" stroke="#9A6B08" strokeWidth="1.5" />

      {/* Crust highlight (top edge) */}
      <path d="M13 10.5 h38 a7 7 0 0 1 0 0" stroke="#F0BD4A" strokeWidth="1" fill="none" opacity="0.5" />

      {/* Grid lines — 4x4 waffle pockets */}
      <g stroke="#9A6B08" strokeWidth="1.2" opacity="0.45">
        <line x1="19" y1="12" x2="19" y2="54" />
        <line x1="32" y1="12" x2="32" y2="54" />
        <line x1="45" y1="12" x2="45" y2="54" />
        <line x1="8" y1="21" x2="56" y2="21" />
        <line x1="8" y1="33" x2="56" y2="33" />
        <line x1="8" y1="44" x2="56" y2="44" />
      </g>

      {/* Pocket depth dots */}
      {[12.5, 25.5, 38.5, 51.5].map((cx) =>
        [15.5, 27, 38.5, 49].map((cy) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" fill="url(#pocketShade)" />
        ))
      )}

      {/* Butter pat */}
      <rect x="22" y="15" width="20" height="9" rx="3" fill="url(#butterPat)" />
      <rect x="22" y="15" width="20" height="9" rx="3" fill="none" stroke="#FBBF24" strokeWidth="0.6" opacity="0.6" />

      {/* Syrup drip on the side */}
      <path d="M50 33 q4 2 3 8 q-1 3 -3 2" fill="url(#syrupDrip)" opacity="0.6" />
    </svg>
  );
}

function WaffleButton({ isOpen, onClick, showPulse }: { isOpen: boolean; onClick: () => void; showPulse: boolean }) {
  const controls = useAnimationControls();
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (isOpen) return;
    const interval = setInterval(async () => {
      await controls.start({ rotate: [0, -6, 6, -3, 0], transition: { duration: 0.6, ease: 'easeInOut' } });
    }, 4000);
    return () => clearInterval(interval);
  }, [isOpen, controls]);

  const handleClick = async () => {
    await controls.start({
      scale: [1, 1.35, 0.85, 1.1, 1],
      rotate: [0, -8, 6, -2, 0],
      transition: { duration: 0.5, ease: 'easeOut' },
    });
    onClick();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Steam wisps */}
      <AnimatePresence>
        {!isOpen && (
          <div className="absolute pointer-events-none" style={{ bottom: '100%', left: '50%', transform: 'translateX(-50%)' }}>
            {STEAM_PARTICLES.map((p, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 6,
                  height: 6,
                  left: p.x,
                  bottom: 0,
                  background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%)',
                }}
                initial={{ y: 0, opacity: 0, scale: 0.3 }}
                animate={{
                  y: [-2, -30],
                  x: [0, p.drift],
                  opacity: [0, 0.7, 0],
                  scale: [0.4, 1.4],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  delay: p.delay,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Warm glow behind the button */}
      {!isOpen && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ margin: -6, background: 'radial-gradient(circle, rgba(245,158,11,0.3) 0%, transparent 70%)' }}
          animate={hovered ? { scale: 1.6, opacity: 1 } : { scale: [1.1, 1.3, 1.1], opacity: [0.4, 0.7, 0.4] }}
          transition={hovered ? { duration: 0.2 } : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* The waffle / close button */}
      <motion.button
        type="button"
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        animate={controls}
        whileHover={{ scale: 1.15, transition: { type: 'spring', stiffness: 400, damping: 15 } }}
        className="relative w-16 h-16 flex items-center justify-center cursor-pointer focus:outline-none"
        aria-label={isOpen ? 'Close chat' : 'Open roadmap assistant'}
        style={{ transformOrigin: 'center center' }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="w-14 h-14 bg-gradient-to-br from-slate-600 to-slate-800 rounded-2xl flex items-center justify-center shadow-lg"
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </motion.div>
          ) : (
            <motion.div
              key="waffle"
              initial={{ scale: 0, rotate: 90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: -90 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="w-16 h-16"
            >
              <WaffleSvg />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Notification pulse */}
      {showPulse && !isOpen && (
        <>
          <span className="absolute -top-1 -right-1 flex h-4 w-4 pointer-events-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-300 border-2 border-white" />
          </span>
          <motion.span
            className="absolute inset-0 rounded-2xl border-2 border-amber-400/30 pointer-events-none"
            animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          />
        </>
      )}
    </div>
  );
}

export function RoadmapChat({ roadmaps, selectedPath }: RoadmapChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setPulse(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const buildContext = useCallback(() => {
    const active = roadmaps.find((r) => r.pathType === selectedPath) ?? roadmaps[0];
    if (!active) return '';
    const weekSummary = (active.weeklyPlan ?? [])
      .slice(0, 6)
      .map((w) => `Week ${w.weekNumber ?? w.week}: ${w.theme} (${(w.tasks ?? []).map((t) => t.title).join(', ')})`)
      .join('\n');
    return `Path: ${active.title} (${active.pathType})\nTimeline: ${active.timeline}\nGoal: ${active.targetOutcome}\nWeeks:\n${weekSummary}`;
  }, [roadmaps, selectedPath]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    playClick();
    const userMsg: ChatMessage = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated.slice(-10),
          roadmapContext: buildContext(),
        }),
      });
      const data = await res.json();
      if (data.success && data.reply) {
        playSuccess();
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        playError();
        setMessages((prev) => [...prev, { role: 'assistant', content: `Sorry, I couldn't process that. ${data.error || 'Please try again.'}` }]);
      }
    } catch {
      playError();
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Something went wrong. Please check your connection and try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      <WaffleButton
        isOpen={open}
        onClick={() => { setOpen(!open); playClick(); }}
        showPulse={pulse}
      />

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
            style={{ maxHeight: 'min(520px, calc(100vh - 8rem))' }}
          >
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-lg leading-none">
                🧇
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Roadmap Assistant</h3>
                <p className="text-amber-100 text-xs">Ask me anything about your plan</p>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ minHeight: '200px' }}>
              {messages.length === 0 && (
                <div className="text-center py-6">
                  <div className="text-3xl mb-3">💡</div>
                  <p className="text-sm text-slate-600 font-medium mb-1">Need help with your roadmap?</p>
                  <p className="text-xs text-slate-400 mb-4">
                    Ask me anything — I&apos;ll explain concepts, suggest resources, and help you take the next step.
                  </p>
                  <div className="space-y-2">
                    {[
                      'How do I start Week 1?',
                      'What does this skill mean?',
                      'Where can I learn this for free?',
                    ].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => { setInput(q); inputRef.current?.focus(); }}
                        className="block w-full text-left text-xs px-3 py-2 bg-slate-50 hover:bg-amber-50 rounded-lg text-slate-600 hover:text-amber-700 transition-colors border border-slate-100"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-br-md'
                      : 'bg-slate-100 text-slate-800 rounded-bl-md'
                  }`}>
                    {msg.role === 'assistant' ? formatMessage(msg.content) : msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-slate-100">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your roadmap..."
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 placeholder:text-slate-400"
                  style={{ maxHeight: '80px' }}
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={!input.trim() || loading}
                  className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center justify-center disabled:opacity-40 hover:from-amber-600 hover:to-amber-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
