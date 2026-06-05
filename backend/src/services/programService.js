import { all, get, run } from '../lib/db.js';
import { ApiError, genId, now, toSlug } from '../lib/helpers.js';

/**
 * Programs power the /programs configurator. Each program belongs to a
 * category (forex/crypto/futures/equities). Sizes, prices, rules,
 * platforms and addons are JSON columns so the admin UI can edit lists
 * without separate child tables.
 *
 * Addon shape: { id, label, percent, group? }
 *   percent: portion of base price added when selected
 *   group:   optional mutual-exclusion group key
 */

export const ALLOWED_CATEGORIES = ['forex', 'crypto', 'futures', 'equities'];

function rowToProgram(row) {
  if (!row) return null;
  // pg returns JSONB as parsed objects already; tolerate strings just in case
  const parse = (v) => {
    if (v == null) return null;
    if (typeof v === 'string') {
      try {
        return JSON.parse(v);
      } catch {
        return null;
      }
    }
    return v;
  };
  return {
    id: row.id,
    slug: row.slug,
    category: row.category,
    name: row.name,
    popular: row.popular === true || row.popular === 't' || row.popular === 1,
    platforms: parse(row.platforms) || [],
    sizes: parse(row.sizes) || [],
    prices: parse(row.prices) || {},
    rules: parse(row.rules) || [],
    addons: parse(row.addons) || [],
    order: row.order,
  };
}

export async function listPrograms() {
  const rows = await all(
    `SELECT * FROM programs ORDER BY "order" ASC, "createdAt" ASC`,
  );
  return rows.map(rowToProgram);
}

export async function getProgram(id) {
  return rowToProgram(await get('SELECT * FROM programs WHERE id = ?', [id]));
}

function validateInput(input, { partial = false } = {}) {
  const out = {};
  if (input.category !== undefined) {
    if (!ALLOWED_CATEGORIES.includes(input.category)) {
      throw new ApiError(400, `Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}`);
    }
    out.category = input.category;
  } else if (!partial) {
    throw new ApiError(400, 'category is required');
  }

  if (input.name !== undefined) {
    const n = String(input.name).trim();
    if (n.length < 2) throw new ApiError(400, 'name is too short');
    out.name = n;
  } else if (!partial) {
    throw new ApiError(400, 'name is required');
  }

  if (input.popular !== undefined) out.popular = !!input.popular;
  if (input.platforms !== undefined) {
    if (!Array.isArray(input.platforms))
      throw new ApiError(400, 'platforms must be an array');
    out.platforms = input.platforms.map((p) => String(p).slice(0, 60)).filter(Boolean);
  }
  if (input.sizes !== undefined) {
    if (!Array.isArray(input.sizes)) throw new ApiError(400, 'sizes must be an array');
    out.sizes = input.sizes.map((s) => Number(s)).filter((n) => Number.isFinite(n) && n > 0);
  }
  if (input.prices !== undefined) {
    if (typeof input.prices !== 'object' || Array.isArray(input.prices))
      throw new ApiError(400, 'prices must be an object { size: price }');
    const cleaned = {};
    for (const [k, v] of Object.entries(input.prices)) {
      const size = Number(k);
      const price = Number(v);
      if (Number.isFinite(size) && size > 0 && Number.isFinite(price) && price >= 0) {
        cleaned[size] = Math.round(price);
      }
    }
    out.prices = cleaned;
  }
  if (input.rules !== undefined) {
    if (!Array.isArray(input.rules)) throw new ApiError(400, 'rules must be an array');
    out.rules = input.rules.map((r) => String(r).slice(0, 200)).filter(Boolean);
  }
  if (input.addons !== undefined) {
    if (!Array.isArray(input.addons)) throw new ApiError(400, 'addons must be an array');
    out.addons = input.addons
      .filter((a) => a && typeof a === 'object' && a.label && Number.isFinite(Number(a.percent)))
      .map((a) => ({
        id: String(a.id || toSlug(a.label) || genId()),
        label: String(a.label).slice(0, 120),
        percent: Number(a.percent),
        ...(a.group ? { group: String(a.group).slice(0, 40) } : {}),
      }));
  }
  if (input.order !== undefined) {
    out.order = Number(input.order) || 0;
  }
  return out;
}

export async function createProgram(input) {
  const clean = validateInput(input, { partial: false });
  const id = genId();
  let slug = toSlug(clean.name);
  let n = 2;
  while (await get('SELECT 1 FROM programs WHERE slug = ?', [slug])) {
    slug = `${toSlug(clean.name)}-${n++}`;
  }
  const nowIso = now();
  await run(
    `INSERT INTO programs
     (id, slug, category, name, popular, platforms, sizes, prices, rules, addons, "order", "createdAt", "updatedAt")
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      slug,
      clean.category,
      clean.name,
      clean.popular ?? false,
      JSON.stringify(clean.platforms || []),
      JSON.stringify(clean.sizes || []),
      JSON.stringify(clean.prices || {}),
      JSON.stringify(clean.rules || []),
      JSON.stringify(clean.addons || []),
      clean.order ?? 0,
      nowIso,
      nowIso,
    ],
  );
  return getProgram(id);
}

export async function updateProgram(id, input) {
  const existing = await getProgram(id);
  if (!existing) throw new ApiError(404, 'Program not found');
  const clean = validateInput(input, { partial: true });

  const merged = { ...existing, ...clean };
  await run(
    `UPDATE programs SET
       category = ?, name = ?, popular = ?,
       platforms = ?, sizes = ?, prices = ?, rules = ?, addons = ?,
       "order" = ?, "updatedAt" = ?
     WHERE id = ?`,
    [
      merged.category,
      merged.name,
      merged.popular,
      JSON.stringify(merged.platforms),
      JSON.stringify(merged.sizes),
      JSON.stringify(merged.prices),
      JSON.stringify(merged.rules),
      JSON.stringify(merged.addons),
      merged.order,
      now(),
      id,
    ],
  );
  return getProgram(id);
}

export async function deleteProgram(id) {
  const res = await run('DELETE FROM programs WHERE id = ?', [id]);
  if (!res) throw new ApiError(404, 'Program not found');
  return { id };
}

/**
 * Seed the 8 default programs if and only if the programs table is empty.
 * Called from the server boot sequence — safe to call every start since
 * it short-circuits on any existing row. Admins can edit or delete the
 * seeded entries afterwards.
 */
export async function autoSeedIfEmpty() {
  const existing = await get('SELECT COUNT(*) AS n FROM programs', []);
  if (Number(existing.n) > 0) return { skipped: true, existing: Number(existing.n) };

  const { DEFAULT_PROGRAMS } = await import('../data/defaultPrograms.js');
  let i = 0;
  for (const p of DEFAULT_PROGRAMS) {
    const id = genId();
    let slug = toSlug(p.name);
    let n = 2;
    // Defensive against rerun-race conditions: dedupe slug.
    while (await get('SELECT 1 FROM programs WHERE slug = ?', [slug])) {
      slug = `${toSlug(p.name)}-${n++}`;
    }
    const ts = now();
    await run(
      `INSERT INTO programs
       (id, slug, category, name, popular, platforms, sizes, prices, rules, addons, "order", "createdAt", "updatedAt")
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        slug,
        p.category,
        p.name,
        p.popular || false,
        JSON.stringify(p.platforms || []),
        JSON.stringify(p.sizes || []),
        JSON.stringify(p.prices || {}),
        JSON.stringify(p.rules || []),
        JSON.stringify(p.addons || []),
        i++,
        ts,
        ts,
      ],
    );
  }
  return { seeded: i };
}
