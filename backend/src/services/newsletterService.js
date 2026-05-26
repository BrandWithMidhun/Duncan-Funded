import { all, get, run } from '../lib/db.js';
import { ApiError, genId, now } from '../lib/helpers.js';

/**
 * Subscribe an email. Idempotent: re-subscribing a previously
 * unsubscribed address reactivates it instead of erroring.
 */
export async function subscribe({ email, source }) {
  const normalized = email.trim().toLowerCase();
  const existing = await get('SELECT * FROM subscribers WHERE email = ?', [normalized]);

  if (existing) {
    if (existing.status === 'ACTIVE') {
      return { email: normalized, status: 'ACTIVE', alreadySubscribed: true };
    }
    await run('UPDATE subscribers SET status = ?, source = ? WHERE email = ?', [
      'ACTIVE',
      source || existing.source,
      normalized,
    ]);
    return { email: normalized, status: 'ACTIVE', reactivated: true };
  }

  await run(
    `INSERT INTO subscribers (id, email, status, source, "confirmedAt", "unsubToken", "createdAt")
     VALUES (?, ?, 'ACTIVE', ?, ?, ?, ?)`,
    [genId(), normalized, source || null, now(), genId(), now()],
  );
  return { email: normalized, status: 'ACTIVE', alreadySubscribed: false };
}

/** Unsubscribe by token (used in email footer links). */
export async function unsubscribe(token) {
  const subscriber = await get('SELECT * FROM subscribers WHERE "unsubToken" = ?', [token]);
  if (!subscriber) throw new ApiError(404, 'Invalid unsubscribe token');
  await run('UPDATE subscribers SET status = ? WHERE id = ?', ['UNSUBSCRIBED', subscriber.id]);
  return { email: subscriber.email, status: 'UNSUBSCRIBED' };
}

/** Admin: list subscribers. */
export async function listSubscribers({ status } = {}) {
  const where = status ? 'WHERE status = ?' : '';
  const params = status ? [status] : [];
  const totalRow = await get(`SELECT COUNT(*) AS n FROM subscribers ${where}`, params);
  const data = await all(
    `SELECT * FROM subscribers ${where} ORDER BY "createdAt" DESC`,
    params,
  );
  return { total: Number(totalRow.n), data };
}
