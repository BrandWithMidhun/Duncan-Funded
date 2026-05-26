import { all, get, run } from '../lib/db.js';
import { ApiError, genId, now } from '../lib/helpers.js';

/**
 * Subscribe an email. Idempotent: re-subscribing a previously
 * unsubscribed address reactivates it instead of erroring.
 */
export function subscribe({ email, source }) {
  const normalized = email.trim().toLowerCase();
  const existing = get('SELECT * FROM subscribers WHERE email = ?', [normalized]);

  if (existing) {
    if (existing.status === 'ACTIVE') {
      return { email: normalized, status: 'ACTIVE', alreadySubscribed: true };
    }
    run('UPDATE subscribers SET status = ?, source = ? WHERE email = ?', [
      'ACTIVE',
      source || existing.source,
      normalized,
    ]);
    return { email: normalized, status: 'ACTIVE', reactivated: true };
  }

  run(
    `INSERT INTO subscribers (id, email, status, source, confirmedAt, unsubToken, createdAt)
     VALUES (?, ?, 'ACTIVE', ?, ?, ?, ?)`,
    [genId(), normalized, source || null, now(), genId(), now()],
  );
  return { email: normalized, status: 'ACTIVE', alreadySubscribed: false };
}

/** Unsubscribe by token (used in email footer links). */
export function unsubscribe(token) {
  const subscriber = get('SELECT * FROM subscribers WHERE unsubToken = ?', [token]);
  if (!subscriber) throw new ApiError(404, 'Invalid unsubscribe token');
  run('UPDATE subscribers SET status = ? WHERE id = ?', ['UNSUBSCRIBED', subscriber.id]);
  return { email: subscriber.email, status: 'UNSUBSCRIBED' };
}

/** Admin: list subscribers. */
export function listSubscribers({ status } = {}) {
  const where = status ? 'WHERE status = ?' : '';
  const params = status ? [status] : [];
  const total = get(`SELECT COUNT(*) AS n FROM subscribers ${where}`, params).n;
  const data = all(`SELECT * FROM subscribers ${where} ORDER BY createdAt DESC`, params);
  return { total, data };
}
