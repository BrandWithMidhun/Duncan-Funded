import crypto from 'node:crypto';
import { all, get, run } from '../lib/db.js';
import { now } from '../lib/helpers.js';

/**
 * First-party analytics service.
 *
 * Privacy posture:
 *   - sessionHash = sha256(ip + ua + daily_salt). The daily salt is
 *     deterministically derived from JWT_SECRET + today's date so it
 *     survives server restarts within a day but rotates at midnight UTC.
 *     This gives us session counting WITHIN a day without enabling any
 *     cross-day tracking even if the DB leaks.
 *   - Raw IP is never stored. Only the hash.
 *   - UA is parsed into device/browser then discarded — no fingerprint
 *     surface stored.
 *   - Referrer is truncated to its host (`https://twitter.com/x/y/z` ->
 *     `twitter.com`) so we never persist URLs that might contain PII
 *     in query strings.
 *   - DNT header is honored at the controller level — requests with
 *     `DNT: 1` are dropped silently before reaching this service.
 */

function todayUtcKey() {
  // YYYY-MM-DD UTC
  return new Date().toISOString().slice(0, 10);
}

let cachedSalt = { key: '', value: '' };

function dailySalt() {
  const key = todayUtcKey();
  if (cachedSalt.key !== key) {
    const secret = process.env.JWT_SECRET || 'fallback-salt';
    cachedSalt = {
      key,
      value: crypto.createHash('sha256').update(`${secret}|${key}`).digest('hex'),
    };
  }
  return cachedSalt.value;
}

export function hashSession(ipAddress, userAgent) {
  const salt = dailySalt();
  return crypto
    .createHash('sha256')
    .update(`${ipAddress || 'unknown'}|${userAgent || 'unknown'}|${salt}`)
    .digest('hex');
}

/** Extract host from referrer URL string; null on invalid/missing. */
export function extractReferrerHost(raw) {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const url = new URL(raw);
    return url.host.toLowerCase().replace(/^www\./, '') || null;
  } catch {
    return null;
  }
}

/** Very lightweight UA classifier — broad bucket, not a fingerprint. */
export function classifyUserAgent(ua) {
  const s = (ua || '').toLowerCase();
  if (!s) return { device: 'unknown', browser: 'unknown' };

  // Common bot patterns — we discard these via isBot() before reaching here,
  // but as a defence-in-depth, label them clearly if anything slips through.
  if (/bot|crawl|spider|slurp|fetch|monitoring/.test(s)) {
    return { device: 'bot', browser: 'bot' };
  }

  // Device
  let device = 'desktop';
  if (/tablet|ipad/.test(s)) device = 'tablet';
  else if (/mobile|android|iphone|ipod/.test(s)) device = 'mobile';

  // Browser — order matters (Edge mentions Chrome, etc.)
  let browser = 'other';
  if (/edg\//.test(s)) browser = 'Edge';
  else if (/opr\/|opera/.test(s)) browser = 'Opera';
  else if (/firefox/.test(s)) browser = 'Firefox';
  else if (/chrome|crios/.test(s)) browser = 'Chrome';
  else if (/safari/.test(s) && !/chrome/.test(s)) browser = 'Safari';

  return { device, browser };
}

export function isBot(ua) {
  if (!ua) return false;
  return /bot|crawl|spider|slurp|fetch|monitoring|preview|googlebot|bingbot|yandex|baidu/i.test(
    ua,
  );
}

/** Read country from edge/proxy headers; fall back to 'Unknown'. */
export function extractCountry(headers) {
  return (
    headers['cf-ipcountry'] ||
    headers['x-vercel-ip-country'] ||
    headers['x-railway-edge-country'] ||
    'Unknown'
  );
}

// ============================================================
// Ingestion
// ============================================================

export async function ingestPageview({
  ipAddress,
  userAgent,
  headers,
  path,
  referrer,
  utm = {},
}) {
  if (isBot(userAgent)) return { skipped: 'bot' };
  if (!path || typeof path !== 'string') return { skipped: 'no-path' };
  // Path normalization: strip query string for storage. Query stays in
  // referrer_host parse if any. This keeps `/programs` and `/programs?p=X`
  // as one row in aggregates.
  const cleanPath = path.split('?')[0].split('#')[0].slice(0, 500);
  // Skip admin pages — defensive, the tracker also skips them
  if (cleanPath.startsWith('/admin')) return { skipped: 'admin' };

  const { device, browser } = classifyUserAgent(userAgent);
  const sessionHash = hashSession(ipAddress, userAgent);
  const referrerHost = extractReferrerHost(referrer);
  const country = extractCountry(headers || {});

  await run(
    `INSERT INTO pageviews
       ("sessionHash", path, referrer_host, country, device, browser,
        utm_source, utm_medium, utm_campaign, "createdAt")
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      sessionHash,
      cleanPath,
      referrerHost,
      country,
      device,
      browser,
      (utm.source || '').toString().slice(0, 100) || null,
      (utm.medium || '').toString().slice(0, 100) || null,
      (utm.campaign || '').toString().slice(0, 100) || null,
      now(),
    ],
  );
  return { ok: true };
}

export async function ingestEvent({ ipAddress, userAgent, name, path, properties }) {
  if (isBot(userAgent)) return { skipped: 'bot' };
  if (!name || typeof name !== 'string') return { skipped: 'no-name' };
  const cleanName = name.trim().slice(0, 100);
  if (!cleanName) return { skipped: 'no-name' };

  const sessionHash = hashSession(ipAddress, userAgent);
  const cleanPath = path ? path.split('?')[0].split('#')[0].slice(0, 500) : null;

  // Properties — accept only flat JSON, cap each string value at 500
  let safeProps = null;
  if (properties && typeof properties === 'object' && !Array.isArray(properties)) {
    safeProps = {};
    for (const [k, v] of Object.entries(properties)) {
      if (Object.keys(safeProps).length >= 20) break; // hard cap
      const key = String(k).slice(0, 50);
      if (typeof v === 'string') safeProps[key] = v.slice(0, 500);
      else if (typeof v === 'number' || typeof v === 'boolean') safeProps[key] = v;
    }
  }

  await run(
    `INSERT INTO analytics_events ("sessionHash", name, path, properties, "createdAt")
     VALUES (?, ?, ?, ?, ?)`,
    [sessionHash, cleanName, cleanPath, safeProps ? JSON.stringify(safeProps) : null, now()],
  );
  return { ok: true };
}

// ============================================================
// Aggregations — admin queries
// ============================================================

function parseRange(from, to) {
  const toDate = to ? new Date(to) : new Date();
  const fromDate = from
    ? new Date(from)
    : new Date(toDate.getTime() - 30 * 86400_000); // default last 30 days
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    throw new Error('Invalid date range');
  }
  return { from: fromDate.toISOString(), to: toDate.toISOString() };
}

/** Top-line numbers for the dashboard cards. */
export async function getSummary({ from, to } = {}) {
  const r = parseRange(from, to);
  const row = await get(
    `SELECT
       COUNT(*) AS pageviews,
       COUNT(DISTINCT "sessionHash") AS sessions
     FROM pageviews
     WHERE "createdAt" BETWEEN ? AND ?`,
    [r.from, r.to],
  );
  // Bounce rate: sessions with exactly 1 pageview / total sessions
  const bounceRow = await get(
    `SELECT COUNT(*) AS bouncers FROM (
       SELECT "sessionHash" FROM pageviews
       WHERE "createdAt" BETWEEN ? AND ?
       GROUP BY "sessionHash"
       HAVING COUNT(*) = 1
     ) t`,
    [r.from, r.to],
  );
  const pageviews = Number(row?.pageviews || 0);
  const sessions = Number(row?.sessions || 0);
  const bouncers = Number(bounceRow?.bouncers || 0);
  return {
    pageviews,
    sessions,
    avgPagesPerSession: sessions > 0 ? pageviews / sessions : 0,
    bounceRate: sessions > 0 ? bouncers / sessions : 0,
    from: r.from,
    to: r.to,
  };
}

/** Time-series of sessions and pageviews per bucket. */
export async function getTimeseries({ from, to, granularity = 'day' } = {}) {
  const r = parseRange(from, to);
  const trunc = granularity === 'hour' ? 'hour' : 'day';
  const rows = await all(
    `SELECT
       date_trunc(?, "createdAt") AS bucket,
       COUNT(*) AS pageviews,
       COUNT(DISTINCT "sessionHash") AS sessions
     FROM pageviews
     WHERE "createdAt" BETWEEN ? AND ?
     GROUP BY bucket
     ORDER BY bucket ASC`,
    [trunc, r.from, r.to],
  );
  return rows.map((row) => ({
    bucket: new Date(row.bucket).toISOString(),
    pageviews: Number(row.pageviews),
    sessions: Number(row.sessions),
  }));
}

export async function getTopPages({ from, to, limit = 10 } = {}) {
  const r = parseRange(from, to);
  const n = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const rows = await all(
    `SELECT path,
            COUNT(*) AS pageviews,
            COUNT(DISTINCT "sessionHash") AS sessions
     FROM pageviews
     WHERE "createdAt" BETWEEN ? AND ?
     GROUP BY path
     ORDER BY pageviews DESC
     LIMIT ?`,
    [r.from, r.to, n],
  );
  return rows.map((row) => ({
    path: row.path,
    pageviews: Number(row.pageviews),
    sessions: Number(row.sessions),
  }));
}

export async function getReferrers({ from, to, limit = 10 } = {}) {
  const r = parseRange(from, to);
  const n = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const rows = await all(
    `SELECT
       COALESCE(referrer_host, 'direct') AS source,
       COUNT(DISTINCT "sessionHash") AS sessions,
       COUNT(*) AS pageviews
     FROM pageviews
     WHERE "createdAt" BETWEEN ? AND ?
     GROUP BY COALESCE(referrer_host, 'direct')
     ORDER BY sessions DESC
     LIMIT ?`,
    [r.from, r.to, n],
  );
  return rows.map((row) => ({
    source: row.source,
    sessions: Number(row.sessions),
    pageviews: Number(row.pageviews),
  }));
}

export async function getDevices({ from, to } = {}) {
  const r = parseRange(from, to);
  const devicesRows = await all(
    `SELECT device, COUNT(DISTINCT "sessionHash") AS sessions
     FROM pageviews
     WHERE "createdAt" BETWEEN ? AND ?
     GROUP BY device
     ORDER BY sessions DESC`,
    [r.from, r.to],
  );
  const browsersRows = await all(
    `SELECT browser, COUNT(DISTINCT "sessionHash") AS sessions
     FROM pageviews
     WHERE "createdAt" BETWEEN ? AND ?
     GROUP BY browser
     ORDER BY sessions DESC`,
    [r.from, r.to],
  );
  return {
    devices: devicesRows.map((r) => ({ name: r.device, sessions: Number(r.sessions) })),
    browsers: browsersRows.map((r) => ({ name: r.browser, sessions: Number(r.sessions) })),
  };
}

export async function getCountries({ from, to, limit = 10 } = {}) {
  const r = parseRange(from, to);
  const n = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const rows = await all(
    `SELECT country, COUNT(DISTINCT "sessionHash") AS sessions
     FROM pageviews
     WHERE "createdAt" BETWEEN ? AND ?
     GROUP BY country
     ORDER BY sessions DESC
     LIMIT ?`,
    [r.from, r.to, n],
  );
  return rows.map((row) => ({
    country: row.country || 'Unknown',
    sessions: Number(row.sessions),
  }));
}

export async function getEventCounts({ from, to, limit = 10 } = {}) {
  const r = parseRange(from, to);
  const n = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const rows = await all(
    `SELECT name,
            COUNT(*) AS total,
            COUNT(DISTINCT "sessionHash") AS sessions
     FROM analytics_events
     WHERE "createdAt" BETWEEN ? AND ?
     GROUP BY name
     ORDER BY total DESC
     LIMIT ?`,
    [r.from, r.to, n],
  );
  return rows.map((row) => ({
    name: row.name,
    total: Number(row.total),
    sessions: Number(row.sessions),
  }));
}

/** Recent activity — last N pageviews. */
export async function getRecentActivity({ limit = 20 } = {}) {
  const n = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const rows = await all(
    `SELECT path, referrer_host, country, device, browser, "createdAt"
     FROM pageviews
     ORDER BY "createdAt" DESC
     LIMIT ?`,
    [n],
  );
  return rows.map((row) => ({
    path: row.path,
    referrer: row.referrer_host || 'direct',
    country: row.country || 'Unknown',
    device: row.device,
    browser: row.browser,
    createdAt: row.createdAt,
  }));
}

// ============================================================
// Internal metrics (no new tracking — uses existing tables)
// ============================================================

/** Engagement metrics pulled from existing tables. */
export async function getInternalMetrics({ from, to } = {}) {
  const r = parseRange(from, to);

  const chatRow = await get(
    `SELECT COUNT(DISTINCT id) AS conversations,
            (SELECT COUNT(*) FROM chat_messages WHERE "createdAt" BETWEEN ? AND ?) AS messages
     FROM chat_sessions
     WHERE "lastMessageAt" BETWEEN ? AND ?`,
    [r.from, r.to, r.from, r.to],
  );
  const subsRow = await get(
    `SELECT COUNT(*) AS n FROM subscribers WHERE "createdAt" BETWEEN ? AND ?`,
    [r.from, r.to],
  );
  const contactsRow = await get(
    `SELECT COUNT(*) AS n FROM contact_messages WHERE "createdAt" BETWEEN ? AND ?`,
    [r.from, r.to],
  );
  const loginRow = await get(
    `SELECT
       COUNT(*) FILTER (WHERE success = TRUE) AS successes,
       COUNT(*) FILTER (WHERE success = FALSE) AS failures
     FROM login_attempts
     WHERE "createdAt" BETWEEN ? AND ?`,
    [r.from, r.to],
  );

  return {
    chat: {
      conversations: Number(chatRow?.conversations || 0),
      messages: Number(chatRow?.messages || 0),
    },
    newsletterSignups: Number(subsRow?.n || 0),
    contactSubmissions: Number(contactsRow?.n || 0),
    logins: {
      successes: Number(loginRow?.successes || 0),
      failures: Number(loginRow?.failures || 0),
    },
  };
}

// ============================================================
// Customer journey aggregations
// ============================================================

/**
 * Recent session journeys — each row is one session with its ordered
 * path of pages. Truncated to the first 15 hops per session so a
 * pathological refresher doesn't blow up the response.
 */
export async function getSessionJourneys({ from, to, limit = 30 } = {}) {
  const r = parseRange(from, to);
  const n = Math.min(Math.max(Number(limit) || 30, 1), 100);
  const rows = await all(
    `WITH ordered AS (
       SELECT
         "sessionHash",
         path,
         referrer_host,
         country,
         device,
         browser,
         "createdAt",
         ROW_NUMBER() OVER (PARTITION BY "sessionHash" ORDER BY "createdAt" ASC) AS rn
       FROM pageviews
       WHERE "createdAt" BETWEEN ? AND ?
     )
     SELECT
       "sessionHash",
       array_agg(path ORDER BY rn) FILTER (WHERE rn <= 15) AS path,
       MIN("createdAt") AS started_at,
       MAX("createdAt") AS ended_at,
       COUNT(*) AS pageview_count,
       MAX(referrer_host) FILTER (WHERE rn = 1) AS entry_referrer,
       MAX(country) FILTER (WHERE rn = 1) AS country,
       MAX(device) FILTER (WHERE rn = 1) AS device,
       MAX(browser) FILTER (WHERE rn = 1) AS browser
     FROM ordered
     GROUP BY "sessionHash"
     ORDER BY started_at DESC
     LIMIT ?`,
    [r.from, r.to, n],
  );
  return rows.map((row) => ({
    sessionHash: row.sessionHash.slice(0, 12), // truncate — we never show full hash
    path: row.path || [],
    startedAt: row.started_at,
    endedAt: row.ended_at,
    pageviewCount: Number(row.pageview_count),
    entryReferrer: row.entry_referrer || 'direct',
    country: row.country || 'Unknown',
    device: row.device || 'unknown',
    browser: row.browser || 'unknown',
  }));
}

/**
 * Event attribution — for a named event, find the most common
 * pageview paths that preceded the event within the same session.
 * Paths are truncated to the last 6 pageviews before the event so
 * we focus on what's recent and relevant rather than the whole
 * session history.
 */
export async function getEventAttribution({ eventName, from, to, limit = 10 } = {}) {
  if (!eventName) return [];
  const r = parseRange(from, to);
  const n = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const rows = await all(
    `WITH event_paths AS (
       SELECT
         e.id AS event_id,
         e."sessionHash",
         e."createdAt" AS event_at,
         (
           SELECT array_agg(p.path ORDER BY p."createdAt" ASC)
           FROM (
             SELECT path, "createdAt"
             FROM pageviews
             WHERE "sessionHash" = e."sessionHash"
               AND "createdAt" <= e."createdAt"
             ORDER BY "createdAt" DESC
             LIMIT 6
           ) p
         ) AS path
       FROM analytics_events e
       WHERE e.name = ? AND e."createdAt" BETWEEN ? AND ?
     )
     SELECT path, COUNT(*) AS count
     FROM event_paths
     WHERE path IS NOT NULL AND array_length(path, 1) > 0
     GROUP BY path
     ORDER BY count DESC
     LIMIT ?`,
    [eventName, r.from, r.to, n],
  );
  return rows.map((row) => ({
    path: row.path || [],
    count: Number(row.count),
  }));
}

/**
 * Top paths — the most common multi-page sequences. We truncate each
 * session's path to its first 4 hops, then count distinct truncated
 * paths. Sessions with only 1 pageview are excluded (a single page
 * isn't really a "path"). This gives us a lightweight view of how
 * visitors flow through the site without needing a Sankey diagram.
 */
export async function getTopPaths({ from, to, limit = 10 } = {}) {
  const r = parseRange(from, to);
  const n = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const rows = await all(
    `WITH session_paths AS (
       SELECT
         "sessionHash",
         (array_agg(path ORDER BY "createdAt" ASC))[1:4] AS path,
         COUNT(*) AS pv_count
       FROM pageviews
       WHERE "createdAt" BETWEEN ? AND ?
       GROUP BY "sessionHash"
       HAVING COUNT(*) >= 2
     )
     SELECT path, COUNT(*) AS sessions
     FROM session_paths
     GROUP BY path
     ORDER BY sessions DESC
     LIMIT ?`,
    [r.from, r.to, n],
  );
  return rows.map((row) => ({
    path: row.path || [],
    sessions: Number(row.sessions),
  }));
}
