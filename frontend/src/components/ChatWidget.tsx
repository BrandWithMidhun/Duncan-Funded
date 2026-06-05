'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { sendChatMessage, getSettings, DEFAULT_SETTINGS, type SiteSettings } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const STORAGE_KEY = 'df.chat.v1';

interface PersistedState {
  visitorId: string;
  sessionId: string | null;
  messages: Message[];
}

function loadState(): PersistedState {
  if (typeof window === 'undefined') {
    return { visitorId: '', sessionId: null, messages: [] };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      if (parsed && typeof parsed.visitorId === 'string') return parsed;
    }
  } catch {
    // ignore
  }
  const visitorId =
    'v_' +
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2);
  return { visitorId, sessionId: null, messages: [] };
}

function saveState(s: PersistedState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // ignore quota issues
  }
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [state, setState] = useState<PersistedState>(() => loadState());
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load settings (for opening message + enabled flag)
  useEffect(() => {
    let active = true;
    getSettings().then((s) => {
      if (active) setSettings(s);
    });
    return () => {
      active = false;
    };
  }, []);

  // Persist state on every change
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state.messages, open, sending]);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  if (!settings.chatbot.enabled) return null;

  const openingMessage =
    settings.chatbot.openingMessage ||
    'Welcome to Duncan Funded. How can I help?';

  const displayMessages: Message[] =
    state.messages.length === 0
      ? [{ role: 'assistant', content: openingMessage }]
      : state.messages;

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setError('');
    setInput('');
    const userMsg: Message = { role: 'user', content: trimmed };
    setState((s) => ({ ...s, messages: [...s.messages, userMsg] }));
    setSending(true);

    const res = await sendChatMessage({
      visitorId: state.visitorId,
      sessionId: state.sessionId || undefined,
      message: trimmed,
    });
    setSending(false);

    if (res.ok) {
      setState((s) => ({
        ...s,
        sessionId: res.data.sessionId,
        messages: [...s.messages, { role: 'assistant', content: res.data.reply }],
      }));
    } else {
      setError(res.error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    const fresh = {
      visitorId: state.visitorId,
      sessionId: null,
      messages: [],
    };
    setState(fresh);
    setError('');
  };

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open chat"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-gold to-gold-light text-pine flex items-center justify-center shadow-lg shadow-black/40 hover:scale-105 active:scale-95 transition-transform"
        >
          <MessageCircle className="w-6 h-6" strokeWidth={1.8} />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed inset-x-4 bottom-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[24rem] z-50 max-h-[80vh] flex flex-col bg-pine border border-gold/30 rounded-sm shadow-2xl shadow-black/60 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gold/20 bg-highland/40">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-sm bg-gradient-to-br from-gold to-gold-light flex items-center justify-center font-display text-pine font-bold text-xs">
                D
              </div>
              <div className="min-w-0">
                <div className="font-display text-sm tracking-[0.15em] text-gold truncate">
                  Duncan Assistant
                </div>
                <div className="font-body text-[10px] tracking-wide text-wool-muted/70">
                  Programs · Rules · Payouts
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                aria-label="Start over"
                className="font-body text-[10px] tracking-wider text-wool-muted/70 hover:text-gold px-2 py-1 uppercase"
              >
                Reset
              </button>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="text-wool-muted hover:text-gold p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-pine">
            {displayMessages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-sm font-body text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-gradient-to-br from-gold to-gold-light text-pine'
                      : 'bg-highland/60 text-wool border border-gold/15'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-highland/60 border border-gold/15 px-3.5 py-2.5 rounded-sm">
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-gold/60 rounded-full animate-pulse" />
                    <span
                      className="w-1.5 h-1.5 bg-gold/60 rounded-full animate-pulse"
                      style={{ animationDelay: '0.15s' }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-gold/60 rounded-full animate-pulse"
                      style={{ animationDelay: '0.3s' }}
                    />
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="flex justify-start">
                <div className="font-body text-xs text-heritage bg-heritage/10 border border-heritage/30 px-3 py-2 rounded-sm">
                  {error}
                </div>
              </div>
            )}
          </div>

          {/* Compliance note */}
          <div className="px-4 py-1.5 border-t border-gold/10 bg-highland/30">
            <p className="font-body text-[9px] text-wool-muted/50 tracking-wide text-center leading-tight">
              I provide product information only — not financial or investment advice.
            </p>
          </div>

          {/* Input */}
          <div className="border-t border-gold/20 bg-pine/95 px-3 py-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about challenges, rules, payouts…"
                rows={1}
                maxLength={2000}
                disabled={sending}
                className="flex-1 bg-pine/60 border border-gold/20 focus:border-gold/60 px-3 py-2 rounded-sm font-body text-sm text-wool placeholder:text-wool-muted/50 outline-none transition-colors resize-none max-h-24"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                aria-label="Send"
                className="shrink-0 w-9 h-9 rounded-sm bg-gradient-to-br from-gold to-gold-light text-pine flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-transform"
              >
                <Send className="w-4 h-4" strokeWidth={1.8} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
