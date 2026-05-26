import { all, run } from '../lib/db.js';
import { genId, now } from '../lib/helpers.js';

/** Store a contact form submission. */
export async function createMessage({ name, email, message }) {
  const id = genId();
  const ts = now();
  await run(
    'INSERT INTO contact_messages (id, name, email, message, handled, "createdAt") VALUES (?,?,?,?,FALSE,?)',
    [id, name.trim(), email.trim().toLowerCase(), message.trim(), ts],
  );
  return { id, createdAt: ts };
}

/** Admin: list contact messages. */
export async function listMessages() {
  const data = await all('SELECT * FROM contact_messages ORDER BY "createdAt" DESC');
  return { total: data.length, data };
}
