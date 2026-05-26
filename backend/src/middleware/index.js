import { ApiError } from '../lib/helpers.js';
import { verifyToken, getUserById } from '../services/authService.js';

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
 * Require a valid admin session (JWT).
 * Expects an `Authorization: Bearer <token>` header.
 * Attaches the resolved user to req.user.
 */
export async function requireAuth(req, _res, next) {
  try {
    const header = req.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      throw new ApiError(401, 'Authentication required — please sign in');
    }
    const payload = verifyToken(token);
    req.user = await getUserById(payload.sub);
    next();
  } catch (e) {
    next(e);
  }
}
