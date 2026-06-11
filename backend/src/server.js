import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import apiRoutes from './routes/api.js';
import { notFound, errorHandler } from './middleware/index.js';
import { initDb, closeDb } from './lib/db.js';
import { autoSeedIfEmpty as autoSeedPrograms } from './services/programService.js';
import {
  seedIfEmpty as autoSeedTradeZone,
  backfillSlugsIfMissing as backfillTradeZoneSlugs,
  backfillDetailContentIfMissing as backfillTradeZoneDetail,
  renameMenuLabelIfNeeded as renameTradeZoneMenuLabel,
} from './services/tradeZoneService.js';

const app = express();
const PORT = process.env.PORT || 4000;

// We're behind Railway's edge proxy. Trust ONE hop so req.ip and
// req.headers['x-forwarded-for'] reflect the real client without
// trusting arbitrary forwarded headers from anywhere downstream.
app.set('trust proxy', 1);

// --- Security headers (hardened from defaults) ---
//
// HSTS: 6 months to start. After we've run on HTTPS without incident
// for 6 months we should bump this to 2 years and add `preload`. Don't
// add `preload` yet — once submitted, removing the domain from the
// preload list takes weeks.
//
// CSP: GTM-friendly variant. We allow 'unsafe-inline' for scripts and
// styles because GTM injects inline tags at runtime. Stricter CSP
// (nonce-based) would require a much larger refactor of GTM setup.
// Still meaningful: blocks arbitrary script-src/connect-src origins,
// blocks frames embedding us, locks down object/embed.
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': [
          "'self'",
          "'unsafe-inline'", // GTM and Meta Pixel inline tags
          "'unsafe-eval'", // some analytics libs evaluate strings
          'https://www.googletagmanager.com',
          'https://www.google-analytics.com',
          'https://connect.facebook.net',
        ],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
        'img-src': [
          "'self'",
          'data:',
          'blob:',
          'https:', // images can come from anywhere on https (blog covers, etc.)
        ],
        'connect-src': [
          "'self'",
          'https://www.google-analytics.com',
          'https://stats.g.doubleclick.net',
          'https://www.googletagmanager.com',
          'https://connect.facebook.net',
          'https://www.facebook.com',
          ...((process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean)),
        ],
        'frame-src': ["'self'", 'https://www.googletagmanager.com'],
        'frame-ancestors': ["'none'"], // nobody embeds our pages
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'upgrade-insecure-requests': [],
      },
    },
    crossOriginEmbedderPolicy: false, // would block GTM iframes
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: {
      maxAge: 60 * 60 * 24 * 180, // 180 days
      includeSubDomains: true,
      preload: false, // do not enable until we're confident
    },
    // X-Frame-Options is set by Helmet by default. frame-ancestors above
    // is the modern replacement; both being set is fine.
  }),
);

// Permissions policy — deny camera/microphone/geolocation everywhere.
// Helmet doesn't set this by default; we add it ourselves.
app.use((_req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  );
  next();
});

app.use(compression());

// Body parsing — 1MB for general JSON requests, but the chat endpoint
// is already capped at 2000 chars in the service. We add an explicit
// 100KB limit on chat to make abuse impossible at the HTTP layer.
app.use('/api/chat', express.json({ limit: '100kb' }));
app.use(express.json({ limit: '1mb' }));

// Reject malformed JSON with a clean 400 instead of stack-traced 500.
app.use((err, _req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body.' });
  }
  next(err);
});

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS — restrict to configured frontend origins. Unknown origins get
// a clean response (no CORS headers) rather than a 500 stack trace.
const origins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      // No Origin header (same-origin, curl, server-to-server) — allow.
      if (!origin) return cb(null, true);
      if (origins.includes(origin)) return cb(null, true);
      // Unknown origin: don't emit CORS headers. The browser will
      // block the request on its end with the proper CORS error.
      // We DON'T throw, so the server doesn't return a confusing 500.
      return cb(null, false);
    },
    credentials: false,
  }),
);

// Rate limiting — protects public write endpoints from abuse
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — slow down and try again later.' },
});
app.use(['/api/newsletter', '/api/contact'], writeLimiter);

// Login-specific limiter — extra defence on top of the per-IP /
// per-email brute-force guard in the auth service. This catches
// flood attempts before they hit the DB at all.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 login requests per IP per 15 min — leaves room for
  //         legitimate retries while still capping floods
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts from your network. Wait 15 minutes and try again.',
  },
});
app.use('/api/auth/login', loginLimiter);

// --- Routes ---
app.get('/', (_req, res) =>
  res.json({ name: 'Duncan Funded API', version: '1.0.0', docs: '/api/health' }),
);
app.use('/api', apiRoutes);

// --- Errors ---
app.use(notFound);
app.use(errorHandler);

// Initialise the database, then start listening.
initDb()
  .then(async () => {
    // First-boot seeding — only acts when the programs table is empty
    // so it's safe to keep on every restart in production.
    try {
      const r = await autoSeedPrograms();
      if (r.seeded) console.log(`✓ Auto-seeded ${r.seeded} default programs.`);
    } catch (e) {
      console.warn('Program auto-seed skipped:', e.message);
    }

    // Trader Arsenal tools — same idempotent pattern.
    try {
      const r = await autoSeedTradeZone();
      if (r.seeded) console.log(`✓ Auto-seeded ${r.seeded} default Trader Arsenal tools.`);
    } catch (e) {
      console.warn('Trade Zone auto-seed skipped:', e.message);
    }

    // Backfill: any row created before slug+detail_content existed
    // gets patched up so its detail page works. Both are idempotent —
    // once everything has a slug + content, these no-op.
    try {
      const r = await backfillTradeZoneSlugs();
      if (r.backfilled) console.log(`✓ Backfilled slugs on ${r.backfilled} Trader Arsenal tool(s).`);
    } catch (e) {
      console.warn('Trade Zone slug backfill skipped:', e.message);
    }
    try {
      const r = await backfillTradeZoneDetail();
      if (r.patched) console.log(`✓ Backfilled detail content on ${r.patched} Trader Arsenal tool(s).`);
    } catch (e) {
      console.warn('Trade Zone detail backfill skipped:', e.message);
    }

    // One-shot rename: nav menu "Trade Zone" → "Trader Arsenal".
    // Idempotent — only fires if the old label is still in place.
    try {
      const r = await renameTradeZoneMenuLabel();
      if (r.renamed) console.log('✓ Renamed nav menu "Trade Zone" → "Trader Arsenal".');
    } catch (e) {
      console.warn('Menu label migration skipped:', e.message);
    }

    const server = app.listen(PORT, () => {
      console.log(`⚔  Duncan Funded API running on port ${PORT}`);
    });

    // Graceful shutdown — close the HTTP server and the Postgres pool.
    const shutdown = async (signal) => {
      console.log(`\n${signal} received — shutting down...`);
      server.close(async () => {
        await closeDb();
        process.exit(0);
      });
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  })
  .catch((err) => {
    console.error('Failed to initialise database:', err);
    process.exit(1);
  });

export default app;
