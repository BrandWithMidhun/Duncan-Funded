import slugify from 'slugify';
import crypto from 'crypto';
import { get } from './db.js';

/** Collision-resistant id (cuid-style: timestamp + random). */
export function genId() {
  return 'c' + Date.now().toString(36) + crypto.randomBytes(8).toString('hex');
}

/** Wraps async route handlers so thrown errors hit the error middleware. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/** Typed application error with an HTTP status. */
export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** Estimate reading time in minutes from raw content (~200 wpm). */
export function estimateReadingTime(text = '') {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** URL-safe slug. */
export function toSlug(str) {
  return slugify(str, { lower: true, strict: true, trim: true });
}

/**
 * Generate a slug unique within `table` (column `slug`).
 * Appends -1, -2, ... on collision.
 */
export function uniqueSlug(table, base, excludeId = null) {
  const slug = toSlug(base);
  let candidate = slug;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const row = get(`SELECT id FROM ${table} WHERE slug = ?`, [candidate]);
    if (!row || row.id === excludeId) return candidate;
    candidate = `${slug}-${n++}`;
  }
}

/** Current ISO timestamp. */
export const now = () => new Date().toISOString();
