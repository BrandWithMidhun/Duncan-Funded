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
  // ---- Marketing / Integrations ----
  // Google Tag Manager container ID (e.g. "GTM-XXXXXXX"); empty => not loaded.
  gtm_id: '',
  // Meta (Facebook) Pixel ID (numeric, e.g. "1234567890123456"); empty => not loaded.
  meta_pixel_id: '',
  // WhatsApp phone in international format with no leading + (e.g. "971501234567")
  // Empty => floating button hidden.
  whatsapp_phone: '',
  // Pre-filled message for the WhatsApp chat
  whatsapp_message: 'Hi, I would like to know more about Duncan Funded.',
  // ---- Chatbot ----
  chatbot_enabled: 'true',
  chatbot_model: 'claude-haiku-4-5-20251001',
  chatbot_monthly_token_budget: '15000000', // ~$50 with Haiku 4.5
  chatbot_rate_per_hour: '20',
  chatbot_rate_per_day: '100',
  chatbot_max_messages_per_session: '40',
  chatbot_opening_message:
    "Welcome. I'm Duncan — your guide to our capital funding challenges. Ask me about programs, evaluation rules, payouts, or platforms. I can't provide financial or investment advice.",
  chatbot_system_extras: '',
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
    integrations: {
      gtmId: merged.gtm_id || '',
      metaPixelId: merged.meta_pixel_id || '',
      whatsappPhone: merged.whatsapp_phone || '',
      whatsappMessage: merged.whatsapp_message || '',
    },
    chatbot: {
      enabled: merged.chatbot_enabled !== 'false',
      model: merged.chatbot_model || 'claude-haiku-4-5-20251001',
      monthlyTokenBudget: Number(merged.chatbot_monthly_token_budget) || 15_000_000,
      ratePerHour: Number(merged.chatbot_rate_per_hour) || 20,
      ratePerDay: Number(merged.chatbot_rate_per_day) || 100,
      maxMessagesPerSession: Number(merged.chatbot_max_messages_per_session) || 40,
      openingMessage: merged.chatbot_opening_message || '',
      systemExtras: merged.chatbot_system_extras || '',
    },
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

  if (input.integrations) {
    const i = input.integrations;
    // Strict allow-list: GTM IDs are "GTM-XXXXXXX"; Meta Pixel is numeric.
    if (typeof i.gtmId === 'string') {
      const v = i.gtmId.trim();
      updates.gtm_id = /^(GTM-[A-Z0-9]+)?$/i.test(v) ? v.toUpperCase() : '';
    }
    if (typeof i.metaPixelId === 'string') {
      const v = i.metaPixelId.trim();
      updates.meta_pixel_id = /^\d{0,20}$/.test(v) ? v : '';
    }
    if (typeof i.whatsappPhone === 'string') {
      // Strip everything except digits (international format expected, no leading +)
      updates.whatsapp_phone = i.whatsappPhone.replace(/\D/g, '').slice(0, 20);
    }
    if (typeof i.whatsappMessage === 'string') {
      updates.whatsapp_message = i.whatsappMessage.trim().slice(0, 500);
    }
  }

  if (input.chatbot) {
    const cb = input.chatbot;
    if (cb.enabled !== undefined) updates.chatbot_enabled = cb.enabled ? 'true' : 'false';
    if (typeof cb.model === 'string') {
      // Allow only Anthropic model strings we support
      const allowed = ['claude-haiku-4-5-20251001', 'claude-sonnet-4-5-20250929'];
      if (allowed.includes(cb.model)) updates.chatbot_model = cb.model;
    }
    if (cb.monthlyTokenBudget !== undefined) {
      const n = Math.max(0, Math.min(1_000_000_000, Number(cb.monthlyTokenBudget) || 0));
      updates.chatbot_monthly_token_budget = String(n);
    }
    if (cb.ratePerHour !== undefined) {
      const n = Math.max(1, Math.min(500, Number(cb.ratePerHour) || 20));
      updates.chatbot_rate_per_hour = String(n);
    }
    if (cb.ratePerDay !== undefined) {
      const n = Math.max(1, Math.min(5000, Number(cb.ratePerDay) || 100));
      updates.chatbot_rate_per_day = String(n);
    }
    if (cb.maxMessagesPerSession !== undefined) {
      const n = Math.max(2, Math.min(200, Number(cb.maxMessagesPerSession) || 40));
      updates.chatbot_max_messages_per_session = String(n);
    }
    if (typeof cb.openingMessage === 'string') {
      updates.chatbot_opening_message = cb.openingMessage.trim().slice(0, 2000);
    }
    if (typeof cb.systemExtras === 'string') {
      updates.chatbot_system_extras = cb.systemExtras.trim().slice(0, 8000);
    }
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
