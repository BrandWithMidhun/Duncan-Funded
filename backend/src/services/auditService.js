import { all, run } from '../lib/db.js';
import { genId, now } from '../lib/helpers.js';

/**
 * Append-only audit log of admin write actions. Captures who did what,
 * when, and the HTTP status that resulted. We deliberately DON'T log
 * the request body — that would balloon the table and could store
 * sensitive content (passwords during password change, etc.). The
 * combination of user + path + timestamp is enough to investigate
 * incidents and answer "who changed X?".
 *
 * Use the middleware: auditMiddleware() — attaches an after-response
 * hook that writes the log row only on success (2xx) and only for
 * write methods (POST/PUT/PATCH/DELETE). Read traffic (GET) is not
 * logged because it would be huge and rarely useful.
 */

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Express middleware. Mount AFTER requireAuth so req.user is populated. */
export function auditMiddleware() {
  return (req, res, next) => {
    // Capture on response finish so we can record the actual status.
    res.on('finish', () => {
      try {
        if (!WRITE_METHODS.has(req.method)) return;
        // Only log successful writes — failed validation errors are noise
        if (res.statusCode >= 400) return;
        // Skip the auth endpoint itself; login attempts have their own log
        if (req.path.startsWith('/auth/')) return;

        const userId = req.user?.id || null;
        const userEmail = req.user?.email || null;
        const ipAddress =
          (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim() ||
          req.socket?.remoteAddress ||
          null;
        const ua = (req.headers['user-agent'] || '').slice(0, 500);

        // Don't await — best-effort, errors swallowed.
        run(
          `INSERT INTO admin_audit_log
           (id, "userId", "userEmail", method, path, status, "ipAddress", "userAgent", "createdAt")
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            genId(),
            userId,
            userEmail,
            req.method,
            // baseUrl + path gives us the full API route
            (req.baseUrl + req.path).slice(0, 500),
            res.statusCode,
            ipAddress,
            ua,
            now(),
          ],
        ).catch(() => {
          /* swallow */
        });
      } catch {
        /* never break the response cycle on logging error */
      }
    });
    next();
  };
}

/** Admin API: list entries paginated by created_at desc. */
export async function listEntries({ limit = 100, offset = 0 } = {}) {
  const n = Math.min(Math.max(Number(limit) || 100, 1), 500);
  const o = Math.max(Number(offset) || 0, 0);
  return all(
    `SELECT id, "userId", "userEmail", method, path, status, "ipAddress",
            "userAgent", "createdAt"
     FROM admin_audit_log
     ORDER BY "createdAt" DESC
     LIMIT ? OFFSET ?`,
    [n, o],
  );
}
