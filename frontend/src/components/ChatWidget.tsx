'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Send, RefreshCcw, ArrowUpRight } from 'lucide-react';
import {
  sendChatMessage,
  getSettings,
  DEFAULT_SETTINGS,
  type SiteSettings,
  type ChatAction,
} from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  actions?: ChatAction[];
}

const STORAGE_KEY = 'df.chat.v2'; // bumped to drop pre-actions cache shape

// Quick-reply chips shown only when no user messages exist yet. These
// are intentionally on-brand and compliance-safe — no investment or
// risk language. Click sends the text as a real message.
const QUICK_REPLIES = [
  'Show me your programs',
  'How do payouts work?',
  'Which platforms do you support?',
];

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

/** Small "D" avatar used on the launcher and beside every Duncan message. */
function DuncanAvatar({ size = 26, dim = false }: { size?: number; dim?: boolean }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-full flex items-center justify-center shrink-0 font-display font-bold text-pine ${
        dim ? 'opacity-70' : ''
      }`}
    >
      <div
        className="w-full h-full rounded-full flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #D4AF37 0%, #F4D165 50%, #D4AF37 100%)',
          fontSize: Math.round(size * 0.42),
        }}
      >
        D
      </div>
    </div>
  );
}

/**
 * Lightweight inline renderer: turns **bold** markers into <strong>,
 * preserves newlines, and strips other simple markdown that might
 * sneak through (single _italic_, leading bullet hyphens). Cheaper
 * and safer for chat than pulling in a full markdown library.
 */
function renderInline(text: string): React.ReactNode[] {
  if (!text) return [];
  // Strip leading "- " or "* " on lines (bot sometimes returns bullets)
  const cleaned = text.replace(/^[ \t]*[*\-]\s+/gm, '');
  // Split on **bold** segments
  const parts = cleaned.split(/(\*\*[^*\n]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong
          key={i}
          className="font-semibold"
          style={{ color: 'inherit' }}
        >
          {part.slice(2, -2)}
        </strong>
      );
    }
    // Also strip stray single asterisks (e.g. *word*)
    const stripped = part.replace(/\*([^*\n]+)\*/g, '$1');
    return <span key={i}>{stripped}</span>;
  });
}

/** Renders action chips below an assistant message. */
function ActionChips({ actions }: { actions: ChatAction[] }) {
  if (!actions || actions.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2 ml-[34px]">
      {actions.map((a, i) => {
        const className =
          'inline-flex items-center gap-1 font-body text-[11.5px] px-3 py-1.5 rounded-full transition-colors';
        const style =
          a.type === 'signup'
            ? {
                background: 'linear-gradient(135deg, #D4AF37, #F4D165)',
                color: '#0A1418',
              }
            : {
                background: 'rgba(212,175,55,0.08)',
                border: '1px solid rgba(212,175,55,0.35)',
                color: '#F4D165',
              };
        const label = (
          <>
            {a.label}
            {a.external && <ArrowUpRight className="w-3 h-3" strokeWidth={2} />}
          </>
        );
        if (a.external) {
          return (
            <a
              key={i}
              href={a.href}
              target="_blank"
              rel="noopener noreferrer"
              className={className}
              style={style}
            >
              {label}
            </a>
          );
        }
        return (
          <Link key={i} href={a.href} className={className} style={style}>
            {label}
          </Link>
        );
      })}
    </div>
  );
}

export default function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [state, setState] = useState<PersistedState>(() => loadState());
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let active = true;
    getSettings().then((s) => {
      if (active) setSettings(s);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state.messages, open, sending]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  if (!settings.chatbot.enabled) return null;
  // Chat is for visitors, not admins. Hide it across the admin portal.
  if (pathname && pathname.startsWith('/admin')) return null;

  const openingMessage =
    settings.chatbot.openingMessage ||
    "Welcome. I'm Duncan — your guide to our capital funding challenges. Ask me about programs, evaluation rules, payouts, or platforms. I can't provide financial or investment advice.";

  // Build display list. When no user messages exist we show the opening
  // and the quick-reply chips below it.
  const userHasSent = state.messages.some((m) => m.role === 'user');
  const displayMessages: Message[] =
    state.messages.length === 0
      ? [{ role: 'assistant', content: openingMessage }]
      : state.messages;

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
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
        messages: [
          ...s.messages,
          { role: 'assistant', content: res.data.reply, actions: res.data.actions || [] },
        ],
      }));
    } else {
      setError(res.error);
    }
  };

  const handleSend = () => sendMessage(input);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setState({ visitorId: state.visitorId, sessionId: null, messages: [] });
    setError('');
  };

  return (
    <>
      {/* Launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Chat with Duncan"
          className="fixed bottom-6 right-6 z-50 group"
        >
          <div className="relative">
            <div
              className="w-[60px] h-[60px] rounded-full flex items-center justify-center font-display font-bold text-pine shadow-lg shadow-black/40 transition-transform group-hover:scale-105 group-active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #F4D165 50%, #D4AF37 100%)',
                border: '1px solid rgba(244,209,101,0.5)',
                fontSize: 22,
              }}
            >
              D
            </div>
            <span
              className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full"
              style={{ background: '#4ADE80', border: '2px solid #0A1418' }}
            />
          </div>
        </button>
      )}

      {/* Open panel */}
      {open && (
        <div
          className="fixed inset-x-4 bottom-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[380px] z-50 flex flex-col rounded-lg overflow-hidden shadow-2xl shadow-black/60"
          style={{
            background: 'linear-gradient(180deg, #0A1418 0%, #0F1A1F 100%)',
            border: '1px solid rgba(212,175,55,0.25)',
            maxHeight: 'min(80vh, 640px)',
            height: '640px',
          }}
        >
          {/* Top accent line */}
          <div
            style={{
              height: 2,
              background:
                'linear-gradient(90deg, transparent, rgba(212,175,55,0.6), transparent)',
            }}
          />

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gold/10 bg-highland/20">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <DuncanAvatar size={38} />
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                  style={{ background: '#4ADE80', border: '2px solid #0F1A1F' }}
                />
              </div>
              <div className="min-w-0">
                <div
                  className="font-display text-[15px] truncate"
                  style={{ letterSpacing: '0.12em', color: '#F4D165' }}
                >
                  Duncan
                </div>
                <div
                  className="font-body text-[10.5px] truncate"
                  style={{ color: 'rgba(245,241,228,0.45)', letterSpacing: '0.04em' }}
                >
                  Your capital funding guide
                </div>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={handleReset}
                aria-label="Start over"
                title="Reset conversation"
                className="w-[30px] h-[30px] rounded-md flex items-center justify-center text-wool-muted/60 hover:text-gold hover:bg-gold/5 transition-colors"
              >
                <RefreshCcw className="w-3.5 h-3.5" strokeWidth={1.8} />
              </button>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="w-[30px] h-[30px] rounded-md flex items-center justify-center text-wool-muted/60 hover:text-gold hover:bg-gold/5 transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={1.8} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3.5 py-4 flex flex-col gap-3.5">
            {displayMessages.map((m, i) => {
              if (m.role === 'user') {
                return (
                  <div key={i} className="flex justify-end">
                    <div
                      className="max-w-[78%] px-3.5 py-2.5 font-body text-[13.5px] leading-relaxed whitespace-pre-wrap"
                      style={{
                        background: 'linear-gradient(135deg, #D4AF37, #F4D165)',
                        color: '#0A1418',
                        borderRadius: '16px 16px 4px 16px',
                      }}
                    >
                      {m.content}
                    </div>
                  </div>
                );
              }
              return (
                <div key={i}>
                  <div className="flex gap-2 items-end">
                    <DuncanAvatar size={26} />
                    <div
                      className="max-w-[78%] px-3.5 py-2.5 font-body text-[13.5px] leading-relaxed whitespace-pre-wrap text-wool"
                      style={{
                        background: 'rgba(30,52,52,0.55)',
                        border: '1px solid rgba(212,175,55,0.12)',
                        borderRadius: '16px 16px 16px 4px',
                      }}
                    >
                      {renderInline(m.content)}
                    </div>
                  </div>
                  {m.actions && m.actions.length > 0 && <ActionChips actions={m.actions} />}
                </div>
              );
            })}

            {/* Quick replies — only before the user sends anything */}
            {!userHasSent && !sending && (
              <div className="flex flex-col gap-1.5 ml-[34px] mt-0.5">
                <div
                  className="font-body uppercase"
                  style={{
                    fontSize: 9.5,
                    letterSpacing: '0.18em',
                    color: 'rgba(212,175,55,0.45)',
                    marginBottom: 4,
                  }}
                >
                  Try asking
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_REPLIES.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="font-body text-[12px] px-3 py-1.5 rounded-full transition-colors hover:bg-gold/10"
                      style={{
                        border: '1px solid rgba(212,175,55,0.3)',
                        color: '#F4D165',
                        background: 'rgba(212,175,55,0.05)',
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {sending && (
              <div className="flex gap-2 items-end mt-0.5">
                <DuncanAvatar size={26} dim />
                <div
                  className="px-3.5 py-3 flex items-center gap-1"
                  style={{
                    background: 'rgba(30,52,52,0.55)',
                    border: '1px solid rgba(212,175,55,0.12)',
                    borderRadius: '16px 16px 16px 4px',
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: 'rgba(244,209,101,0.7)' }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: 'rgba(244,209,101,0.5)', animationDelay: '0.15s' }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: 'rgba(244,209,101,0.35)', animationDelay: '0.3s' }}
                  />
                  <span
                    className="ml-1.5 font-body italic"
                    style={{
                      fontSize: 10,
                      color: 'rgba(245,241,228,0.4)',
                    }}
                  >
                    Duncan is typing
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex gap-2 items-end">
                <DuncanAvatar size={26} dim />
                <div className="font-body text-xs text-heritage bg-heritage/10 border border-heritage/30 px-3 py-2 rounded-md">
                  {error}
                </div>
              </div>
            )}
          </div>

          {/* Compliance strip */}
          <div className="px-4 py-1.5 border-t border-gold/5 bg-highland/15">
            <p
              className="font-body text-center m-0"
              style={{ fontSize: 9.5, color: 'rgba(245,241,228,0.35)' }}
            >
              Product information only — not financial advice.
            </p>
          </div>

          {/* Input */}
          <div className="border-t border-gold/15 px-3 py-3 bg-pine/95">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Duncan anything…"
                rows={1}
                maxLength={2000}
                disabled={sending}
                className="flex-1 bg-pine/60 border border-gold/20 focus:border-gold/60 px-3.5 py-2.5 rounded-lg font-body text-[13px] text-wool placeholder:text-wool-muted/45 outline-none transition-colors resize-none max-h-24"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                aria-label="Send"
                className="shrink-0 w-[38px] h-[38px] rounded-lg flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-transform hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37, #F4D165)',
                  color: '#0A1418',
                }}
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
