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

const app = express();
const PORT = process.env.PORT || 4000;

// --- Security & infra middleware ---
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS — restrict to configured frontend origins
const origins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());
app.use(
  cors({
    origin: (origin, cb) => {
      // allow same-origin / curl (no Origin header)
      if (!origin || origins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS blocked: ${origin}`));
    },
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
  .then(() => {
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
