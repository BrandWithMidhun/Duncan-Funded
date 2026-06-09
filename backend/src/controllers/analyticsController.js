import * as svc from '../services/analyticsService.js';
import { asyncHandler } from '../lib/helpers.js';

/** Extract client IP, honouring proxy headers. */
function clientIp(req) {
  const fwd = (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim();
  return fwd || req.socket?.remoteAddress || null;
}

function shouldHonorDnt(req) {
  // DNT header: 1 = "do not track". Honor it as policy even though it's
  // not legally binding in most jurisdictions.
  return req.headers.dnt === '1' || req.headers.dnt === 'yes';
}

// ============================================================
// Public ingestion (no auth)
// ============================================================

/** POST /api/analytics/pageview
 *  Always returns 204 so the tracker never blocks page navigation
 *  on errors. Errors are logged but never surfaced to the client. */
export const trackPageview = asyncHandler(async (req, res) => {
  if (shouldHonorDnt(req)) return res.status(204).end();
  try {
    const { path, referrer, utm } = req.body || {};
    await svc.ingestPageview({
      ipAddress: clientIp(req),
      userAgent: req.headers['user-agent'] || '',
      headers: req.headers,
      path,
      referrer,
      utm,
    });
  } catch (e) {
    console.error('analytics ingest pageview error:', e.message || e);
  }
  res.status(204).end();
});

/** POST /api/analytics/event */
export const trackEvent = asyncHandler(async (req, res) => {
  if (shouldHonorDnt(req)) return res.status(204).end();
  try {
    const { name, path, properties } = req.body || {};
    await svc.ingestEvent({
      ipAddress: clientIp(req),
      userAgent: req.headers['user-agent'] || '',
      name,
      path,
      properties,
    });
  } catch (e) {
    console.error('analytics ingest event error:', e.message || e);
  }
  res.status(204).end();
});

// ============================================================
// Admin endpoints (JWT-guarded)
// ============================================================

export const summary = asyncHandler(async (req, res) => {
  res.json({
    data: await svc.getSummary({ from: req.query.from, to: req.query.to }),
  });
});

export const timeseries = asyncHandler(async (req, res) => {
  res.json({
    data: await svc.getTimeseries({
      from: req.query.from,
      to: req.query.to,
      granularity: req.query.granularity,
    }),
  });
});

export const topPages = asyncHandler(async (req, res) => {
  res.json({
    data: await svc.getTopPages({
      from: req.query.from,
      to: req.query.to,
      limit: req.query.limit,
    }),
  });
});

export const referrers = asyncHandler(async (req, res) => {
  res.json({
    data: await svc.getReferrers({
      from: req.query.from,
      to: req.query.to,
      limit: req.query.limit,
    }),
  });
});

export const devices = asyncHandler(async (req, res) => {
  res.json({
    data: await svc.getDevices({ from: req.query.from, to: req.query.to }),
  });
});

export const countries = asyncHandler(async (req, res) => {
  res.json({
    data: await svc.getCountries({
      from: req.query.from,
      to: req.query.to,
      limit: req.query.limit,
    }),
  });
});

export const events = asyncHandler(async (req, res) => {
  res.json({
    data: await svc.getEventCounts({
      from: req.query.from,
      to: req.query.to,
      limit: req.query.limit,
    }),
  });
});

export const recent = asyncHandler(async (req, res) => {
  res.json({ data: await svc.getRecentActivity({ limit: req.query.limit }) });
});

export const internal = asyncHandler(async (req, res) => {
  res.json({
    data: await svc.getInternalMetrics({ from: req.query.from, to: req.query.to }),
  });
});

export const journeys = asyncHandler(async (req, res) => {
  res.json({
    data: await svc.getSessionJourneys({
      from: req.query.from,
      to: req.query.to,
      limit: req.query.limit,
    }),
  });
});

export const eventAttribution = asyncHandler(async (req, res) => {
  res.json({
    data: await svc.getEventAttribution({
      eventName: req.query.eventName || req.query.name,
      from: req.query.from,
      to: req.query.to,
      limit: req.query.limit,
    }),
  });
});

export const topPaths = asyncHandler(async (req, res) => {
  res.json({
    data: await svc.getTopPaths({
      from: req.query.from,
      to: req.query.to,
      limit: req.query.limit,
    }),
  });
});
