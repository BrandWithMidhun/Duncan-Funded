import { ApiError } from '../lib/helpers.js';

/** 404 for unmatched routes. */
export function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

/** Centralised error responder. */
export function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    ...(err.details ? { details: err.details } : {}),
  });
}

/**
 * Protects write endpoints with a shared admin API key.
 * Phase 2 (CMS) replaces this with JWT-based user sessions.
 */
export function requireAdmin(req, _res, next) {
  const key = req.get('x-api-key');
  if (!process.env.ADMIN_API_KEY) {
    return next(new ApiError(500, 'ADMIN_API_KEY not configured on server'));
  }
  if (key !== process.env.ADMIN_API_KEY) {
    return next(new ApiError(401, 'Unauthorized — valid x-api-key header required'));
  }
  next();
}
