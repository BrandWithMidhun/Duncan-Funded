'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { X, ArrowUpRight } from 'lucide-react';
import { getSettings, DEFAULT_SETTINGS, type SiteSettings } from '@/lib/api';

/**
 * Exit-intent popup. Triggers ONCE per visit when the visitor's mouse
 * cursor leaves the top of the viewport (a strong signal they're
 * about to close the tab or switch to a bookmark).
 *
 * Desktop only — mobile has no equivalent gesture, so we detect touch
 * devices and bail. After dismissal we set a localStorage cooldown
 * for `cooldownDays` so we don't pester the same visitor every visit.
 *
 * Suppressed on /admin/* and when settings.popups.exitIntent.enabled
 * is false. Auto-suppresses if a newsletter popup is already open
 * (we never stack — newsletter has priority on the off-chance both
 * fire on the same tick).
 */

const STORAGE_KEY = 'df.popup.exitIntent.v1';
// Set by NewsletterPopup so we don't stack — it sets this on its own
// dialog open. We just read it here.
const NEWSLETTER_DIALOG_SELECTOR = 'div[role="dialog"][aria-labelledby="newsletter-popup-title"]';

interface StoredState {
  hiddenUntil?: number;
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

function isTouchDevice() {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)
  );
}

export default function ExitIntentPopup() {
  const pathname = usePathname();
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [open, setOpen] = useState(false);
  const triggeredRef = useRef(false);

  useEffect(() => {
    let active = true;
    getSettings().then((s) => active && setSettings(s));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (pathname && pathname.startsWith('/admin')) return;
    if (!settings.popups.exitIntent.enabled) return;
    if (isTouchDevice()) return;

    const state = loadState();
    if (state.hiddenUntil && Date.now() < state.hiddenUntil) return;
    if (triggeredRef.current) return;

    // Wait a short grace period after mount so visitors who land and
    // immediately bounce don't get an instant popup.
    let armed = false;
    const armTimer = window.setTimeout(() => {
      armed = true;
    }, 5000);

    const onMouseLeave = (e: MouseEvent) => {
      if (!armed) return;
      if (triggeredRef.current) return;
      // Only trigger when cursor leaves the TOP edge — leaving the side
      // is usually just reaching for the scrollbar.
      if (e.clientY > 0) return;
      // Don't stack on top of the newsletter popup
      if (document.querySelector(NEWSLETTER_DIALOG_SELECTOR)) return;
      triggeredRef.current = true;
      setOpen(true);
    };

    document.addEventListener('mouseleave', onMouseLeave);
    return () => {
      window.clearTimeout(armTimer);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [pathname, settings.popups.exitIntent.enabled]);

  const handleClose = () => {
    setOpen(false);
    const cooldown = (settings.popups.exitIntent.cooldownDays || 30) * 86400_000;
    saveState({ hiddenUntil: Date.now() + cooldown });
  };

  if (!open) return null;
  const p = settings.popups.exitIntent;
  const isExternalCta = /^https?:\/\//i.test(p.ctaUrl);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-intent-popup-title"
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
            id="exit-intent-popup-title"
            className="font-display text-xl tracking-[0.12em] mb-3"
            style={{ color: '#F4D165' }}
          >
            {p.title}
          </h2>
          <p className="font-body text-sm text-wool-muted leading-relaxed mb-6">{p.body}</p>

          <div className="flex flex-col gap-2">
            {isExternalCta ? (
              <a
                href={p.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClose}
                className="inline-flex items-center justify-center gap-2 font-body text-xs tracking-[0.2em] uppercase font-bold px-5 py-3 rounded-sm transition-transform hover:scale-[1.02] active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37, #F4D165)',
                  color: '#0A1418',
                }}
              >
                {p.ctaLabel}
                <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
              </a>
            ) : (
              <Link
                href={p.ctaUrl}
                onClick={handleClose}
                className="inline-flex items-center justify-center font-body text-xs tracking-[0.2em] uppercase font-bold px-5 py-3 rounded-sm transition-transform hover:scale-[1.02] active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37, #F4D165)',
                  color: '#0A1418',
                }}
              >
                {p.ctaLabel}
              </Link>
            )}
            <button
              onClick={handleClose}
              className="font-body text-xs tracking-wider uppercase text-wool-muted/70 hover:text-wool px-5 py-2"
            >
              No thanks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
