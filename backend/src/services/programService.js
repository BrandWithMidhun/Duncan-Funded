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
    // Rules can come in two shapes:
    //   - { color: 'green' | 'red', text: string }   (new, preferred)
    //   - string                                      (legacy)
    // Always normalize to the object shape on the way in. Unknown
    // colors default to 'green'. Empty/whitespace text is dropped.
    out.rules = input.rules
      .map((r) => {
        if (typeof r === 'string') {
          const t = r.trim().slice(0, 240);
          return t ? { color: 'green', text: t } : null;
        }
        if (r && typeof r === 'object' && typeof r.text === 'string') {
          const t = r.text.trim().slice(0, 240);
          if (!t) return null;
          const color = r.color === 'red' ? 'red' : 'green';
          return { color, text: t };
        }
        return null;
      })
      .filter(Boolean);
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

/**
 * Migration: convert any program whose `rules` is still an array of
 * raw strings into the new `{ color, text }` shape. Idempotent —
 * rules already in the new format are left alone.
 *
 * Strings are converted to green by default (the most common case in
 * the old format). After this migration, the refresh-default-rules
 * pass below overwrites the 8 default programs with the richer
 * colored rules from defaultPrograms.js.
 */
export async function migrateRulesFormat() {
  const rows = await all('SELECT id, rules FROM programs');
  let converted = 0;
  for (const row of rows) {
    let parsed = row.rules;
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        continue;
      }
    }
    if (!Array.isArray(parsed) || parsed.length === 0) continue;
    const looksLegacy = parsed.every((r) => typeof r === 'string');
    if (!looksLegacy) continue;

    const next = parsed
      .map((s) => String(s).trim().slice(0, 240))
      .filter(Boolean)
      .map((text) => ({ color: 'green', text }));

    await run(`UPDATE programs SET rules = ?, "updatedAt" = ? WHERE id = ?`, [
      JSON.stringify(next),
      now(),
      row.id,
    ]);
    converted += 1;
  }
  return { converted };
}

/**
 * One-shot migration: refresh the rule list on each of our 8 default
 * programs from defaultPrograms.js.
 *
 * We only update a row when its current rules look like the OLD
 * default seed (5-7 simple green entries, all from our original
 * default set). This catches production rows that were seeded before
 * the colored-rules format existed without touching custom rules an
 * admin may have written.
 *
 * Heuristic — current rules count <= 7 AND all texts match the old
 * default rule list for that program's slug. If admin has added even
 * one custom rule or changed wording, the heuristic fails and we
 * leave the row alone.
 */
const OLD_DEFAULT_RULES_BY_SLUG = {
  'forex-one-step': new Set([
    'Max Drawdown: 6%',
    'Daily Drawdown: 5%',
    'Profit Target: 10%',
    'Base Profit Split: 80%',
    'Choose from multiple trading platforms',
  ]),
  'forex-two-step': new Set([
    'Max Drawdown: 7%',
    'Daily Drawdown: 5%',
    'Profit Target: 8% (Phase 1), 5% (Phase 2)',
    'Base Profit Split: 85%',
    'Choose from multiple trading platforms',
  ]),
  'instant-funded-forex': new Set([
    'Max Drawdown: 8% (Trailing)',
    'Daily Max Loss Limit: 5%',
    'No Profit Target',
    'Base Profit Split: 80%',
    'Complete KYC and sign the trader contract to become eligible for withdrawals',
  ]),
  'instant-funded-forex-lite': new Set([
    'Max Drawdown: 5% (Trailing)',
    'Daily Max Loss Limit: 3%',
    'No Profit Target',
    'Base Profit Split: 80%',
    'Consistency Requirement: 25%',
    'Profit Buffer: 3%',
  ]),
  'crypto-one-step': new Set([
    '1-Step Evaluation',
    'Profit Target: 10%',
    'Max Drawdown: 6%',
    'Daily Drawdown: 4%',
    'Base Profit Split: 80%',
    '24/7 Crypto Markets',
  ]),
  'crypto-two-step': new Set([
    '2-Phase Evaluation',
    'Profit Target: 8% (Phase 1), 5% (Phase 2)',
    'Max Daily Loss: 5%',
    'Max Total Loss: 10%',
    'Base Profit Split: 85%',
    'Major + Altcoin Pairs, Weekend Trading',
  ]),
  'futures-assessment': new Set([
    'Single-Phase Evaluation',
    'Trailing Drawdown',
    'CME, COMEX, NYMEX',
    'Base Profit Split: 80%',
    'Payouts Every 30 Days',
    'Reset Available',
  ]),
  'equities-one-step': new Set([
    'One Step Equities Assessment',
    'Profit Target: 8%',
    'Max Drawdown: 5%',
    'Base Profit Split: 80%',
    'US Equities & ETFs',
    'Pre/Post Market',
  ]),
};

export async function refreshDefaultProgramRules() {
  const { DEFAULT_PROGRAMS } = await import('../data/defaultPrograms.js');
  let refreshed = 0;

  for (const def of DEFAULT_PROGRAMS) {
    const oldSet = OLD_DEFAULT_RULES_BY_SLUG[def.slug];
    if (!oldSet) continue;

    const row = await get('SELECT id, rules FROM programs WHERE slug = ?', [def.slug]);
    if (!row) continue;

    let current = row.rules;
    if (typeof current === 'string') {
      try {
        current = JSON.parse(current);
      } catch {
        continue;
      }
    }
    if (!Array.isArray(current) || current.length === 0) continue;

    // Get the plain text of each current rule (handles both legacy
    // string-format and post-migration object-format).
    const currentTexts = current
      .map((r) => (typeof r === 'string' ? r : r?.text))
      .filter(Boolean)
      .map((t) => String(t).trim());

    // Only refresh when the row still looks like the old default —
    // every rule must be one we originally seeded, and the count
    // must be in the old range.
    const isUnmodifiedDefault =
      currentTexts.length > 0 &&
      currentTexts.length <= 8 &&
      currentTexts.every((t) => oldSet.has(t));

    if (!isUnmodifiedDefault) continue;

    await run(`UPDATE programs SET rules = ?, "updatedAt" = ? WHERE id = ?`, [
      JSON.stringify(def.rules),
      now(),
      row.id,
    ]);
    refreshed += 1;
  }

  return { refreshed };
}
