import { all, get, run } from '../lib/db.js';
import { ApiError, genId, now } from '../lib/helpers.js';

/**
 * Manages admin-editable restricted patterns for the chat compliance
 * filter. Core patterns live in chatCompliance.js and cannot be
 * touched from this service.
 *
 * The list of enabled custom patterns is cached in-process for 30
 * seconds so we don't hit the DB on every chat request. Cache is
 * invalidated immediately on any create/update/delete.
 */

const CACHE_TTL_MS = 30_000;
let cache = { value: null, expiresAt: 0 };

function invalidateCache() {
  cache = { value: null, expiresAt: 0 };
}

/**
 * Get the active custom patterns (enabled = true only), as a small
 * array suitable for passing to enforceCompliance().
 */
export async function getActiveCustomPatterns() {
  if (cache.value && Date.now() < cache.expiresAt) return cache.value;
  const rows = await all(
    `SELECT id, pattern, "isRegex", enabled
     FROM chat_restrictions
     WHERE enabled = TRUE
     ORDER BY "createdAt" ASC`,
  );
  const value = rows.map((r) => ({
    id: r.id,
    pattern: r.pattern,
    isRegex: r.isRegex === true || r.isRegex === 't',
    enabled: true,
  }));
  cache = { value, expiresAt: Date.now() + CACHE_TTL_MS };
  return value;
}

// ---- Admin CRUD ----

export async function listAll() {
  const rows = await all(
    `SELECT id, pattern, notes, "isRegex", enabled, "createdAt", "updatedAt"
     FROM chat_restrictions
     ORDER BY "createdAt" DESC`,
  );
  return rows.map((r) => ({
    id: r.id,
    pattern: r.pattern,
    notes: r.notes || '',
    isRegex: r.isRegex === true || r.isRegex === 't',
    enabled: r.enabled === true || r.enabled === 't',
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

function validate(input, { partial = false } = {}) {
  const out = {};
  if (input.pattern !== undefined) {
    const p = String(input.pattern).trim();
    if (p.length < 2) throw new ApiError(400, 'Pattern must be at least 2 characters.');
    if (p.length > 200) throw new ApiError(400, 'Pattern is too long (max 200).');
    out.pattern = p;
  } else if (!partial) {
    throw new ApiError(400, 'pattern is required');
  }
  if (input.notes !== undefined) out.notes = String(input.notes).slice(0, 500);
  if (input.isRegex !== undefined) out.isRegex = !!input.isRegex;
  if (input.enabled !== undefined) out.enabled = !!input.enabled;
  // If isRegex is true, validate the pattern compiles
  if ((out.isRegex || input.isRegex) && out.pattern) {
    try {
      new RegExp(out.pattern, 'gi');
    } catch (e) {
      throw new ApiError(400, `Invalid regex: ${e.message}`);
    }
  }
  return out;
}

export async function create(input) {
  const clean = validate(input, { partial: false });
  const id = genId();
  const ts = now();
  await run(
    `INSERT INTO chat_restrictions (id, pattern, notes, "isRegex", enabled, "createdAt", "updatedAt")
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      clean.pattern,
      clean.notes || '',
      clean.isRegex ?? false,
      clean.enabled ?? true,
      ts,
      ts,
    ],
  );
  invalidateCache();
  return getOne(id);
}

export async function getOne(id) {
  const row = await get(
    'SELECT id, pattern, notes, "isRegex", enabled, "createdAt", "updatedAt" FROM chat_restrictions WHERE id = ?',
    [id],
  );
  if (!row) return null;
  return {
    id: row.id,
    pattern: row.pattern,
    notes: row.notes || '',
    isRegex: row.isRegex === true || row.isRegex === 't',
    enabled: row.enabled === true || row.enabled === 't',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function update(id, input) {
  const existing = await getOne(id);
  if (!existing) throw new ApiError(404, 'Restriction not found');
  const clean = validate(input, { partial: true });
  const merged = { ...existing, ...clean };
  await run(
    `UPDATE chat_restrictions SET
       pattern = ?, notes = ?, "isRegex" = ?, enabled = ?, "updatedAt" = ?
     WHERE id = ?`,
    [merged.pattern, merged.notes, merged.isRegex, merged.enabled, now(), id],
  );
  invalidateCache();
  return getOne(id);
}

export async function remove(id) {
  const res = await run('DELETE FROM chat_restrictions WHERE id = ?', [id]);
  if (!res) throw new ApiError(404, 'Restriction not found');
  invalidateCache();
  return { id };
}
