'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Mounted once in the root layout. Fires a pageview event:
 *   - On initial page load
 *   - On every client-side route change (App Router pathname change)
 *
 * Skipped on /admin pages. Uses navigator.sendBeacon so the request
 * doesn't block navigation. Always succeeds silently (the backend
 * returns 204 regardless).
 *
 * UTM parameters are pulled from the URL on first load and forwarded.
 * Referrer is taken from document.referrer for the very first hit
 * only — subsequent in-app navigations send the previous in-app path
 * as the "referrer" via the lastPathRef so we can see internal flows.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function isTrackable(path: string) {
  if (!path) return false;
  if (path.startsWith('/admin')) return false;
  return true;
}

function getUtmParams(): { source?: string; medium?: string; campaign?: string } {
  if (typeof window === 'undefined') return {};
  try {
    const params = new URLSearchParams(window.location.search);
    const out: { source?: string; medium?: string; campaign?: string } = {};
    const s = params.get('utm_source');
    const m = params.get('utm_medium');
    const c = params.get('utm_campaign');
    if (s) out.source = s;
    if (m) out.medium = m;
    if (c) out.campaign = c;
    return out;
  } catch {
    return {};
  }
}

/** Internal: send the actual beacon. */
function sendPageview(path: string, referrer: string, utm: ReturnType<typeof getUtmParams>) {
  const url = `${API_URL}/api/analytics/pageview`;
  const body = JSON.stringify({ path, referrer, utm });
  // navigator.sendBeacon is fire-and-forget and won't block navigation.
  // Fall back to fetch with keepalive if sendBeacon isn't available.
  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
      return;
    }
  } catch {
    /* fall through to fetch */
  }
  try {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {
      /* ignore */
    });
  } catch {
    /* ignore */
  }
}

/** Public helper for in-app code to track a custom event. */
export function trackEvent(name: string, properties?: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/admin')) return;
  const url = `${API_URL}/api/analytics/event`;
  const body = JSON.stringify({
    name,
    path: window.location.pathname,
    properties: properties || undefined,
  });
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
      return;
    }
  } catch {
    /* fall through */
  }
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    /* ignore */
  });
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);
  const isFirstHitRef = useRef(true);

  useEffect(() => {
    if (!pathname) return;
    if (!isTrackable(pathname)) {
      lastPathRef.current = pathname;
      return;
    }

    // For the first hit on this tab, use document.referrer (external).
    // For subsequent in-app navigations, the previous in-app path.
    let referrer = '';
    if (isFirstHitRef.current) {
      referrer = typeof document !== 'undefined' ? document.referrer : '';
      isFirstHitRef.current = false;
    } else if (lastPathRef.current) {
      referrer = typeof window !== 'undefined'
        ? `${window.location.origin}${lastPathRef.current}`
        : '';
    }

    sendPageview(pathname, referrer, getUtmParams());
    lastPathRef.current = pathname;
  }, [pathname]);

  return null; // no DOM
}
