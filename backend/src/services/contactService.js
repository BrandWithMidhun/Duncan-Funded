import { all, run } from '../lib/db.js';
import { genId, now } from '../lib/helpers.js';

/** Store a contact form submission. */
export function createMessage({ name, email, message }) {
  const id = genId();
  const ts = now();
  run(
    'INSERT INTO contact_messages (id, name, email, message, handled, createdAt) VALUES (?,?,?,?,0,?)',
    [id, name.trim(), email.trim().toLowerCase(), message.trim(), ts],
  );
  return { id, createdAt: ts };
}

/** Admin: list contact messages. */
export function listMessages() {
  const data = all('SELECT * FROM contact_messages ORDER BY createdAt DESC');
  return { total: data.length, data };
}
