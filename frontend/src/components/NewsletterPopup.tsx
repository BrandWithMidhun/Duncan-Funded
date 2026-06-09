'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { getSettings, DEFAULT_SETTINGS, type SiteSettings, subscribeNewsletter } from '@/lib/api';
import { trackEvent } from './AnalyticsTracker';

/**
 * Newsletter popup. Shows after either:
 *   - delaySeconds since first mount, OR
 *   - the visitor scrolls past scrollThreshold% of the document
 * whichever first. Once dismissed or successfully submitted, sets a
 * localStorage cooldown for `cooldownDays` so it doesn't reappear.
 *
 * Suppressed on /admin/* and when settings.popups.newsletter.enabled
 * is false. Also suppressed if the exit-intent popup is currently
 * open — they never stack.
 */

const STORAGE_KEY = 'df.popup.newsletter.v1';

interface StoredState {
  hiddenUntil?: number; // epoch ms
  subscribed?: boolean;
}

function loadState(): StoredState {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveState(s: StoredState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export default function NewsletterPopup() {
  const pathname = usePathname();
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const triggeredRef = useRef(false);

  // Load settings
  useEffect(() => {
    let active = true;
    getSettings().then((s) => active && setSettings(s));
    return () => {
      active = false;
    };
  }, []);

  // Set up timers + scroll listener for trigger
  useEffect(() => {
    if (pathname && pathname.startsWith('/admin')) return;
    if (!settings.popups.newsletter.enabled) return;

    const state = loadState();
    if (state.subscribed) return;
    if (state.hiddenUntil && Date.now() < state.hiddenUntil) return;
    if (triggeredRef.current) return;

    const trigger = () => {
      if (triggeredRef.current) return;
      triggeredRef.current = true;
      setOpen(true);
    };

    const delayMs = (settings.popups.newsletter.delaySeconds || 30) * 1000;
    const timer = window.setTimeout(trigger, delayMs);

    const threshold = settings.popups.newsletter.scrollThreshold || 50;
    const onScroll = () => {
      const doc = document.documentElement;
      const scrolled = doc.scrollTop;
      const max = doc.scrollHeight - doc.clientHeight;
      if (max <= 0) return;
      const pct = (scrolled / max) * 100;
      if (pct >= threshold) trigger();
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, [pathname, settings.popups.newsletter.enabled, settings.popups.newsletter.delaySeconds, settings.popups.newsletter.scrollThreshold]);

  const handleClose = () => {
    setOpen(false);
    const cooldown = (settings.popups.newsletter.cooldownDays || 14) * 86400_000;
    saveState({ hiddenUntil: Date.now() + cooldown });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email.');
      return;
    }
    setBusy(true);
    const res = await subscribeNewsletter(email.trim());
    setBusy(false);
    if (res.ok) {
      setSuccess(true);
      saveState({ subscribed: true });
      trackEvent('newsletter_signup', { source: 'popup' });
      // Auto-close after a moment so the user sees the confirmation
      window.setTimeout(() => setOpen(false), 2200);
    } else {
      setError(res.message || 'Subscription failed.');
    }
  };

  if (!open) return null;
  const p = settings.popups.newsletter;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="newsletter-popup-title"
    >
      <div
        className="relative w-full max-w-md rounded-sm border overflow-hidden shadow-2xl shadow-black/60"
        style={{
          background: 'linear-gradient(180deg, #0A1418 0%, #0F1A1F 100%)',
          borderColor: 'rgba(212,175,55,0.3)',
        }}
      >
        <div
          style={{
            height: 2,
            background:
              'linear-gradient(90deg, transparent, rgba(212,175,55,0.6), transparent)',
          }}
        />
        <button
          onClick={handleClose}
          aria-label="Close"
          className="absolute top-3 right-3 text-wool-muted hover:text-gold p-1 z-10"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="px-7 py-8">
          <h2
            id="newsletter-popup-title"
            className="font-display text-xl tracking-[0.12em] mb-3"
            style={{ color: '#F4D165' }}
          >
            {p.title}
          </h2>
          <p className="font-body text-sm text-wool-muted leading-relaxed mb-6">{p.body}</p>

          {success ? (
            <div className="font-body text-sm text-[hsl(150,55%,55%)] bg-[hsl(150,40%,15%)] border border-[hsl(150,40%,30%)] px-4 py-3 rounded-sm">
              Thanks. Check your inbox to confirm.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full bg-pine/60 border border-gold/25 focus:border-gold/60 px-4 py-3 rounded-sm font-body text-sm text-wool placeholder:text-wool-muted/50 outline-none transition-colors"
                maxLength={200}
                autoFocus
              />
              {error && (
                <p className="font-body text-xs text-heritage bg-heritage/10 border border-heritage/30 px-3 py-2 rounded-sm">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="w-full font-body text-xs tracking-[0.2em] uppercase font-bold px-5 py-3 rounded-sm disabled:opacity-50 transition-transform hover:scale-[1.02] active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37, #F4D165)',
                  color: '#0A1418',
                }}
              >
                {busy ? 'Sending…' : p.buttonLabel || 'Subscribe'}
              </button>
              <p className="font-body text-[10px] text-wool-muted/50 text-center mt-2">
                No spam. Unsubscribe anytime.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
