import { all, get, run } from '../lib/db.js';
import { ApiError, genId, now } from '../lib/helpers.js';

/**
 * Brute-force protection for the admin login endpoint.
 *
 * Two layers, evaluated BEFORE we even check the password:
 *   1. Per-IP rate limit: 5 failed attempts in 15 min from one IP -> 429.
 *      Stops simple distributed attempts from a single attacker box.
 *   2. Per-email lockout: 10 failed attempts in 1 hour for the same
 *      email -> account locked for 30 min from THAT email. Stops a
 *      slow-distributed attack against a specific known admin.
 *
 * Both layers operate on the login_attempts table, which is an append-
 * only log of every attempt (success and failure, with reason). The
 * service GCs rows older than 24h on each write so the table stays
 * small even under attack.
 *
 * Successful logins reset nothing — the next attempt starts a fresh
 * window. That's intentional: we don't want a successful login to
 * "absolve" recent failures, because an attacker who finally guesses
 * right shouldn't get a clean slate for the next victim.
 */

const FIFTEEN_MIN_MS = 15 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const LOCKOUT_MS = 30 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const IP_FAIL_LIMIT = 5;          // per 15min window
const EMAIL_FAIL_LIMIT = 10;      // per 1hr window before lockout kicks in

/**
 * Check whether a login attempt should be allowed to proceed.
 * Throws ApiError(429) if blocked. Returns silently if OK.
 *
 * Call this BEFORE password verification, so a banned attacker can't
 * even tell whether their guess was correct.
 */
export async function ensureLoginAllowed({ email, ipAddress }) {
  const normalized = String(email || '').trim().toLowerCase();
  const ipSince = new Date(Date.now() - FIFTEEN_MIN_MS).toISOString();
  const emailSince = new Date(Date.now() - HOUR_MS).toISOString();

  if (ipAddress) {
    const ipFails = await get(
      `SELECT COUNT(*) AS n FROM login_attempts
       WHERE "ipAddress" = ? AND success = FALSE AND "createdAt" >= ?`,
      [ipAddress, ipSince],
    );
    if (Number(ipFails?.n || 0) >= IP_FAIL_LIMIT) {
      throw new ApiError(
        429,
        'Too many failed attempts from your network. Wait 15 minutes and try again.',
      );
    }
  }

  if (normalized) {
    const emailFails = await get(
      `SELECT COUNT(*) AS n FROM login_attempts
       WHERE "email" = ? AND success = FALSE AND "createdAt" >= ?`,
      [normalized, emailSince],
    );
    if (Number(emailFails?.n || 0) >= EMAIL_FAIL_LIMIT) {
      // Lockout: check whether the last failure was within LOCKOUT_MS
      const last = await get(
        `SELECT "createdAt" FROM login_attempts
         WHERE "email" = ? AND success = FALSE
         ORDER BY "createdAt" DESC LIMIT 1`,
        [normalized],
      );
      if (last) {
        const ageMs = Date.now() - new Date(last.createdAt).getTime();
        if (ageMs < LOCKOUT_MS) {
          const minsLeft = Math.ceil((LOCKOUT_MS - ageMs) / 60000);
          throw new ApiError(
            429,
            `This account is temporarily locked. Try again in ${minsLeft} minute${
              minsLeft === 1 ? '' : 's'
            }.`,
          );
        }
      }
    }
  }
}

/** Log an attempt and opportunistically GC old rows. */
export async function recordAttempt({ email, ipAddress, success, reason }) {
  const normalized = String(email || '').trim().toLowerCase() || null;
  await run(
    `INSERT INTO login_attempts ("email", "ipAddress", success, reason, "createdAt")
     VALUES (?, ?, ?, ?, ?)`,
    [normalized, ipAddress || null, !!success, (reason || '').slice(0, 200), now()],
  );

  // Best-effort GC. Don't fail the request if cleanup errors.
  try {
    await run(
      `DELETE FROM login_attempts WHERE "createdAt" < ?`,
      [new Date(Date.now() - DAY_MS).toISOString()],
    );
  } catch {
    /* ignore */
  }
}

/** Optional admin view — list recent attempts. */
export async function listRecentAttempts(limit = 100) {
  return all(
    `SELECT id, "email", "ipAddress", success, reason, "createdAt"
     FROM login_attempts
     ORDER BY "createdAt" DESC
     LIMIT ?`,
    [Math.min(Math.max(Number(limit) || 100, 1), 500)],
  );
}
