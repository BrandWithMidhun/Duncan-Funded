import { all, get, run } from '../lib/db.js';
import { ApiError, genId, now } from '../lib/helpers.js';
import { DEFAULT_TRADE_ZONE_TOOLS } from '../data/defaultTradeZoneTools.js';

/**
 * Trader Arsenal tools — formerly known as "Trade Zone". Each tool
 * is a card on the public /trade-zone page with a name, description,
 * icon, optional Launch button URL, and its own /trade-zone/<slug>
 * detail page rendered from markdown stored in detail_content.
 */

/** Allow-list of icon keys. Anything outside this set is treated as
 *  'activity' on the public page. We keep the list narrow on purpose
 *  to prevent admins from typing random lucide names that don't
 *  exist on the frontend — fail soft, not loud. */
export const VALID_ICON_KEYS = [
  'activity',
  'calendar',
  'calculator',
  'book',
  'library',
  'shield',
  'chart',
  'trending-up',
  'target',
  'lock',
  'zap',
  'compass',
  'gauge',
  'bell',
  'bookmark',
  'briefcase',
];

/** Turn a free-form name into a URL-safe slug. Lowercase, alnum +
 *  dashes only, collapse repeated dashes, trim leading/trailing dashes.
 *  Returns empty string if input is empty/garbage. */
export function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 80);
}

/** Find an unused slug, appending -2, -3, … if the base is taken.
 *  Excludes a given id so updates that keep the same slug succeed. */
async function ensureUniqueSlug(base, excludeId = null) {
  const root = slugify(base) || 'tool';
  let candidate = root;
  let n = 2;
  // Cap at 50 attempts so a runaway loop on a corrupted DB doesn't
  // hang the request — extremely unlikely in practice.
  for (let i = 0; i < 50; i += 1) {
    const row = excludeId
      ? await get(
          'SELECT id FROM trade_zone_tools WHERE slug = ? AND id <> ?',
          [candidate, excludeId],
        )
      : await get('SELECT id FROM trade_zone_tools WHERE slug = ?', [candidate]);
    if (!row) return candidate;
    candidate = `${root}-${n}`;
    n += 1;
  }
  // Last resort: include a short random suffix
  return `${root}-${Math.random().toString(36).slice(2, 6)}`;
}

function rowToTool(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug || '',
    name: row.name,
    description: row.description,
    iconKey: row.icon_key,
    launchUrl: row.launch_url || '',
    launchLabel: row.launch_label || 'Launch',
    detailContent: row.detail_content || '',
    order: Number(row.order) || 0,
    enabled: row.enabled === true || row.enabled === 't',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function normalizeInput(input) {
  const out = {};
  if (typeof input.name === 'string') {
    const v = input.name.trim();
    if (!v) throw new ApiError(400, 'Name is required.');
    if (v.length > 120) throw new ApiError(400, 'Name is too long (max 120 chars).');
    out.name = v;
  }
  if (typeof input.description === 'string') {
    const v = input.description.trim();
    if (!v) throw new ApiError(400, 'Description is required.');
    if (v.length > 600) throw new ApiError(400, 'Description is too long (max 600 chars).');
    out.description = v;
  }
  if (typeof input.iconKey === 'string') {
    const v = input.iconKey.trim().toLowerCase();
    out.iconKey = VALID_ICON_KEYS.includes(v) ? v : 'activity';
  }
  if (typeof input.launchUrl === 'string') {
    out.launchUrl = input.launchUrl.trim().slice(0, 500);
  }
  if (typeof input.launchLabel === 'string') {
    out.launchLabel = input.launchLabel.trim().slice(0, 40) || 'Launch';
  }
  // Slug — admin can supply explicitly; we slugify whatever they type
  // so we never accept malformed slugs into the DB. Empty string is
  // allowed at this stage — create/update will fill it in.
  if (typeof input.slug === 'string') {
    out.slug = slugify(input.slug);
  }
  if (typeof input.detailContent === 'string') {
    // Hard cap to keep DB rows reasonable. 100KB of markdown is plenty
    // for a marketing detail page — anything longer probably belongs
    // in a blog post, not a tool card.
    out.detailContent = input.detailContent.slice(0, 100_000);
  }
  if (input.order !== undefined) {
    const n = Number(input.order);
    out.order = Number.isFinite(n) ? Math.max(0, Math.min(9999, Math.trunc(n))) : 0;
  }
  if (input.enabled !== undefined) {
    out.enabled = !!input.enabled;
  }
  return out;
}

/** Public read — enabled only, ordered. */
export async function listPublic() {
  const rows = await all(
    `SELECT * FROM trade_zone_tools
     WHERE enabled = TRUE
     ORDER BY "order" ASC, "createdAt" ASC`,
  );
  return rows.map(rowToTool);
}

/** Admin read — everything, including disabled. */
export async function listAll() {
  const rows = await all(
    `SELECT * FROM trade_zone_tools
     ORDER BY "order" ASC, "createdAt" ASC`,
  );
  return rows.map(rowToTool);
}

export async function getById(id) {
  const row = await get('SELECT * FROM trade_zone_tools WHERE id = ?', [id]);
  if (!row) throw new ApiError(404, 'Tool not found.');
  return rowToTool(row);
}

/** Public lookup by slug for the detail page. */
export async function getBySlug(slug) {
  const clean = slugify(slug);
  if (!clean) throw new ApiError(404, 'Tool not found.');
  const row = await get(
    'SELECT * FROM trade_zone_tools WHERE slug = ? AND enabled = TRUE',
    [clean],
  );
  if (!row) throw new ApiError(404, 'Tool not found.');
  return rowToTool(row);
}

export async function create(input) {
  const fields = normalizeInput(input);
  if (!fields.name) throw new ApiError(400, 'Name is required.');
  if (!fields.description) throw new ApiError(400, 'Description is required.');

  const slug = await ensureUniqueSlug(fields.slug || fields.name);
  const id = genId();
  const t = now();
  await run(
    `INSERT INTO trade_zone_tools
       (id, slug, name, description, icon_key, launch_url, launch_label,
        detail_content, "order", enabled, "createdAt", "updatedAt")
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      slug,
      fields.name,
      fields.description,
      fields.iconKey ?? 'activity',
      fields.launchUrl ?? '',
      fields.launchLabel ?? 'Launch',
      fields.detailContent ?? '',
      fields.order ?? 0,
      fields.enabled === undefined ? true : fields.enabled,
      t,
      t,
    ],
  );
  return getById(id);
}

export async function update(id, input) {
  const existing = await getById(id);
  const fields = normalizeInput(input);

  // If admin supplied a slug, normalize + dedupe it. If they cleared
  // it, regenerate from the (possibly new) name. Otherwise keep the
  // existing slug to preserve any inbound links.
  let nextSlug = existing.slug;
  if (input.slug !== undefined) {
    nextSlug = fields.slug
      ? await ensureUniqueSlug(fields.slug, id)
      : await ensureUniqueSlug(fields.name || existing.name, id);
  }

  const next = { ...existing, ...fields, slug: nextSlug };
  await run(
    `UPDATE trade_zone_tools SET
       slug = ?,
       name = ?,
       description = ?,
       icon_key = ?,
       launch_url = ?,
       launch_label = ?,
       detail_content = ?,
       "order" = ?,
       enabled = ?,
       "updatedAt" = ?
     WHERE id = ?`,
    [
      next.slug,
      next.name,
      next.description,
      next.iconKey,
      next.launchUrl,
      next.launchLabel,
      next.detailContent,
      next.order,
      next.enabled,
      now(),
      id,
    ],
  );
  return getById(id);
}

export async function remove(id) {
  const res = await run('DELETE FROM trade_zone_tools WHERE id = ?', [id]);
  if (!res) throw new ApiError(404, 'Tool not found.');
  return { id };
}

/** Seed the table with defaults only if it's currently empty.
 *  Idempotent — safe to call on every boot. */
export async function seedIfEmpty() {
  const row = await get('SELECT COUNT(*) AS n FROM trade_zone_tools');
  if (Number(row?.n || 0) > 0) return { seeded: 0 };
  for (const t of DEFAULT_TRADE_ZONE_TOOLS) {
    await create(t);
  }
  return { seeded: DEFAULT_TRADE_ZONE_TOOLS.length };
}

/**
 * Backfill: any row created before the slug column existed will have
 * a NULL/empty slug. Generate one from the name so the detail-page
 * route works. Runs on every boot; no-ops once everything has a slug.
 *
 * Critical for production: this is what migrates the 6 rows that the
 * previous deploy already inserted without a slug.
 */
export async function backfillSlugsIfMissing() {
  const rows = await all(
    `SELECT id, name FROM trade_zone_tools WHERE slug IS NULL OR slug = ''`,
  );
  if (rows.length === 0) return { backfilled: 0 };
  for (const r of rows) {
    const s = await ensureUniqueSlug(r.name, r.id);
    await run(`UPDATE trade_zone_tools SET slug = ?, "updatedAt" = ? WHERE id = ?`, [
      s,
      now(),
      r.id,
    ]);
  }
  return { backfilled: rows.length };
}

/**
 * Backfill: rows that were seeded with empty detail_content (before
 * we added markdown content to the defaults) get patched with the
 * matching default content. Matches by slug — only fills tools that
 * still have empty detail content, so admin edits are never overwritten.
 *
 * Idempotent — once a tool has any detail content, this never touches
 * it again.
 */
export async function backfillDetailContentIfMissing() {
  let patched = 0;
  for (const def of DEFAULT_TRADE_ZONE_TOOLS) {
    const row = await get(
      `SELECT id FROM trade_zone_tools
       WHERE slug = ? AND (detail_content IS NULL OR detail_content = '')`,
      [def.slug],
    );
    if (!row) continue;
    await run(
      `UPDATE trade_zone_tools
       SET detail_content = ?, launch_label = ?, "updatedAt" = ?
       WHERE id = ?`,
      [def.detailContent, def.launchLabel, now(), row.id],
    );
    patched += 1;
  }
  return { patched };
}

/**
 * One-shot migration: rename the nav menu label "Trade Zone" → "Trader
 * Arsenal" if it's still using the old label for the /trade-zone href.
 * Idempotent — only fires when the exact old label is present.
 */
export async function renameMenuLabelIfNeeded() {
  const row = await get(`SELECT value FROM settings WHERE key = 'menu_items'`);
  if (!row?.value) return { renamed: false };

  let menu;
  try {
    menu = JSON.parse(row.value);
  } catch {
    return { renamed: false };
  }
  if (!Array.isArray(menu)) return { renamed: false };

  let changed = false;
  const next = menu.map((item) => {
    if (
      item &&
      typeof item === 'object' &&
      item.href === '/trade-zone' &&
      item.label === 'Trade Zone'
    ) {
      changed = true;
      return { ...item, label: 'Trader Arsenal' };
    }
    return item;
  });

  if (!changed) return { renamed: false };

  await run(`UPDATE settings SET value = ?, "updatedAt" = ? WHERE key = 'menu_items'`, [
    JSON.stringify(next),
    now(),
  ]);
  return { renamed: true };
}
