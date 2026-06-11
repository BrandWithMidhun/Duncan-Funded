import { all, get, run } from '../lib/db.js';
import { ApiError, asyncHandler, genId, now } from '../lib/helpers.js';
import { DEFAULT_TRADE_ZONE_TOOLS } from '../data/defaultTradeZoneTools.js';

/**
 * Trader Arsenal tools — formerly known as "Trade Zone". Each tool
 * is a card on the public /trade-zone page with a name, description,
 * icon, and an optional Launch button URL.
 *
 * The schema is small and the surface is straightforward CRUD; this
 * service is structured the same way as programService for
 * consistency. Public reads return enabled tools only, ordered.
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

function rowToTool(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    iconKey: row.icon_key,
    launchUrl: row.launch_url || '',
    launchLabel: row.launch_label || 'Launch',
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

export async function create(input) {
  const fields = normalizeInput(input);
  if (!fields.name) throw new ApiError(400, 'Name is required.');
  if (!fields.description) throw new ApiError(400, 'Description is required.');

  const id = genId();
  const t = now();
  await run(
    `INSERT INTO trade_zone_tools
       (id, name, description, icon_key, launch_url, launch_label,
        "order", enabled, "createdAt", "updatedAt")
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      fields.name,
      fields.description,
      fields.iconKey ?? 'activity',
      fields.launchUrl ?? '',
      fields.launchLabel ?? 'Launch',
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
  const next = { ...existing, ...fields };
  await run(
    `UPDATE trade_zone_tools SET
       name = ?,
       description = ?,
       icon_key = ?,
       launch_url = ?,
       launch_label = ?,
       "order" = ?,
       enabled = ?,
       "updatedAt" = ?
     WHERE id = ?`,
    [
      next.name,
      next.description,
      next.iconKey,
      next.launchUrl,
      next.launchLabel,
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

/** Seed the table with the 6 defaults only if it's currently empty.
 *  Called on backend boot — idempotent. */
export async function seedIfEmpty() {
  const row = await get('SELECT COUNT(*) AS n FROM trade_zone_tools');
  if (Number(row?.n || 0) > 0) return { seeded: 0 };
  for (const t of DEFAULT_TRADE_ZONE_TOOLS) {
    await create(t);
  }
  return { seeded: DEFAULT_TRADE_ZONE_TOOLS.length };
}

/**
 * One-shot migration: rename the nav menu label "Trade Zone" → "Trader
 * Arsenal" if it's still using the old label for the /trade-zone href.
 * Idempotent — only fires when the exact old label is present, so it
 * won't clobber a custom rename the admin may have already made.
 *
 * Called from server.js boot. Safe to keep running on every restart.
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
