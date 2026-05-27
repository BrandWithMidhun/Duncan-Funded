import { all, get, run } from '../lib/db.js';
import { now } from '../lib/helpers.js';

/**
 * Site settings — a small key/value store for editable site configuration:
 * button URLs, logo, and navigation menu items.
 *
 * Values are stored as text; JSON-shaped values (e.g. the menu) are
 * stringified. Defaults are applied when a key has not been set.
 */

const DEFAULTS = {
  // Call-to-action button URLs
  url_get_funded: '/programs',
  url_begin_challenge: 'https://duncanfundeddashboard.propaccount.com/en/sign-up',
  url_sign_in: 'https://duncanfundeddashboard.propaccount.com/en/sign-in',
  // Logo image URL (empty string => frontend uses the bundled default crest)
  logo_url: '',
  // Navigation menu — JSON array of { label, href }
  menu_items: JSON.stringify([
    { label: 'Home', href: '/' },
    { label: 'Programs', href: '/programs' },
    { label: 'Trade Zone', href: '/trade-zone' },
    { label: 'Blog', href: '/blog' },
    { label: 'About', href: '/about' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact', href: '/contact' },
  ]),
};

/** Ensure the settings table exists (called from initDb's schema, but safe here too). */
export async function ensureSettingsTable() {
  await run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      "updatedAt" TIMESTAMPTZ NOT NULL
    )
  `);
}

/**
 * Get all settings, merged over defaults, with the menu parsed to an array.
 * This is the public shape consumed by the frontend.
 */
export async function getSettings() {
  const rows = await all('SELECT key, value FROM settings');
  const stored = {};
  for (const r of rows) stored[r.key] = r.value;

  const merged = { ...DEFAULTS, ...stored };

  // Parse menu_items into a real array; fall back to defaults if invalid.
  let menu;
  try {
    menu = JSON.parse(merged.menu_items);
    if (!Array.isArray(menu)) throw new Error('not an array');
  } catch {
    menu = JSON.parse(DEFAULTS.menu_items);
  }

  return {
    urls: {
      getFunded: merged.url_get_funded,
      beginChallenge: merged.url_begin_challenge,
      signIn: merged.url_sign_in,
    },
    logoUrl: merged.logo_url || null,
    menu,
  };
}

/**
 * Update settings from an admin payload.
 * Accepts the same shape getSettings returns; only provided fields change.
 */
export async function updateSettings(input) {
  const updates = {};

  if (input.urls) {
    if (typeof input.urls.getFunded === 'string')
      updates.url_get_funded = input.urls.getFunded.trim();
    if (typeof input.urls.beginChallenge === 'string')
      updates.url_begin_challenge = input.urls.beginChallenge.trim();
    if (typeof input.urls.signIn === 'string')
      updates.url_sign_in = input.urls.signIn.trim();
  }
  if (typeof input.logoUrl === 'string') {
    updates.logo_url = input.logoUrl.trim();
  }
  if (Array.isArray(input.menu)) {
    // Keep only well-formed { label, href } entries.
    const clean = input.menu
      .filter(
        (m) =>
          m &&
          typeof m.label === 'string' &&
          typeof m.href === 'string' &&
          m.label.trim() &&
          m.href.trim(),
      )
      .map((m) => ({ label: m.label.trim(), href: m.href.trim() }))
      .slice(0, 20);
    updates.menu_items = JSON.stringify(clean);
  }

  for (const [key, value] of Object.entries(updates)) {
    await run(
      `INSERT INTO settings (key, value, "updatedAt") VALUES (?, ?, ?)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = EXCLUDED."updatedAt"`,
      [key, value, now()],
    );
  }

  return getSettings();
}
