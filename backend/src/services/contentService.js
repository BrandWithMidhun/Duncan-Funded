import { all, get, run } from '../lib/db.js';
import { now } from '../lib/helpers.js';

/**
 * Content blocks are admin-editable text snippets keyed by stable IDs.
 * Frontend reads them with sensible defaults, so missing keys never
 * break the site.
 *
 * Keys are dot-namespaced by page and field, e.g.
 *   home.hero.title
 *   home.hero.subtitle
 *   home.hero.cta_primary_label
 *   home.hero.cta_primary_href
 *
 * The CONTENT_REGISTRY below is the source of truth for which keys
 * the admin UI exposes and what their default values are.
 */

// page: human label shown in admin UI
// blocks: ordered list of { key, label, kind, default, help? }
//   kind: 'text' (single line), 'textarea' (multi-line), 'url' (link target)
export const CONTENT_REGISTRY = [
  {
    page: 'home',
    label: 'Homepage — Hero Section',
    blocks: [
      { key: 'home.hero.title.line1', label: 'Title — gold line', kind: 'text', default: 'Capital Funding', help: 'The bold gold portion of the headline.' },
      { key: 'home.hero.title.line2', label: 'Title — white line', kind: 'text', default: 'for Disciplined Traders', help: 'The lighter, white portion of the headline.' },
      { key: 'home.hero.tagline', label: 'Tagline (italic)', kind: 'text', default: 'discere pati — learn to endure.' },
      { key: 'home.hero.paragraph', label: 'Hero paragraph', kind: 'textarea', default: 'A premium capital allocation firm built on discipline, transparency, and trader excellence.' },
      { key: 'home.hero.cta_primary_label', label: 'Primary CTA — label', kind: 'text', default: 'Start Your Journey' },
      { key: 'home.hero.cta_primary_href', label: 'Primary CTA — link', kind: 'url', default: '/programs', help: 'Use a path like /programs for internal, or a full URL for external.' },
      { key: 'home.hero.cta_secondary_label', label: 'Secondary CTA — label', kind: 'text', default: 'Explore Capital Funding' },
      { key: 'home.hero.cta_secondary_href', label: 'Secondary CTA — link', kind: 'url', default: '/programs' },
      { key: 'home.hero.stat1_value', label: 'Metric 1 — value', kind: 'text', default: '$400K' },
      { key: 'home.hero.stat1_label', label: 'Metric 1 — label', kind: 'text', default: 'Maximum Capital Allocation' },
      { key: 'home.hero.stat2_value', label: 'Metric 2 — value', kind: 'text', default: '90%' },
      { key: 'home.hero.stat2_label', label: 'Metric 2 — label', kind: 'text', default: 'Profit Split' },
      { key: 'home.hero.stat3_value', label: 'Metric 3 — value', kind: 'text', default: '4' },
      { key: 'home.hero.stat3_label', label: 'Metric 3 — label', kind: 'text', default: 'Asset Classes' },
      { key: 'home.hero.stat4_value', label: 'Metric 4 — value', kind: 'text', default: 'Available' },
      { key: 'home.hero.stat4_label', label: 'Metric 4 — label', kind: 'text', default: 'Payout Protection' },
    ],
  },
  {
    page: 'home',
    label: 'Homepage — Asset Classes Section',
    blocks: [
      { key: 'home.programs.eyebrow', label: 'Eyebrow', kind: 'text', default: 'Asset Class Overview' },
      { key: 'home.programs.title.line1', label: 'Title — gold', kind: 'text', default: 'Choose Your' },
      { key: 'home.programs.title.line2', label: 'Title — white', kind: 'text', default: 'Trading Domain' },
      { key: 'home.programs.paragraph', label: 'Section paragraph', kind: 'textarea', default: 'Duncan Funded provides capital access across four major asset classes. Each class offers unique account types, evaluation paths, and add-ons designed for disciplined traders.' },
      { key: 'home.programs.forex_desc', label: 'Forex — description', kind: 'textarea', default: 'Trade global currencies with flexible evaluation models and capital scaling opportunities.' },
      { key: 'home.programs.futures_desc', label: 'Futures — description', kind: 'textarea', default: 'Access exchange-connected futures markets across CME, CBOT, NYMEX, and COMEX.' },
      { key: 'home.programs.crypto_desc', label: 'Crypto — description', kind: 'textarea', default: 'Trade digital assets with instant funding options and payout protection.' },
      { key: 'home.programs.equities_desc', label: 'Equities — description', kind: 'textarea', default: 'Trade S&P 100 equities in a structured, session-based environment on GooeyPro.' },
    ],
  },
  {
    page: 'home',
    label: 'Homepage — How It Works',
    blocks: [
      { key: 'home.how.eyebrow', label: 'Eyebrow', kind: 'text', default: 'The Duncan Pathway' },
      { key: 'home.how.title.line1', label: 'Title — gold', kind: 'text', default: 'How It' },
      { key: 'home.how.title.line2', label: 'Title — white', kind: 'text', default: 'Works' },
      { key: 'home.how.step1_title', label: 'Step 1 — title', kind: 'text', default: 'Choose Your Capital' },
      { key: 'home.how.step1_desc', label: 'Step 1 — description', kind: 'textarea', default: 'Select your capital size and asset class to begin your journey.' },
      { key: 'home.how.step2_title', label: 'Step 2 — title', kind: 'text', default: 'Select Your Asset Class' },
      { key: 'home.how.step2_desc', label: 'Step 2 — description', kind: 'textarea', default: 'Each asset class offers its own account types, sizes, and add-ons.' },
      { key: 'home.how.step3_title', label: 'Step 3 — title', kind: 'text', default: 'Prove Your Skill' },
      { key: 'home.how.step3_desc', label: 'Step 3 — description', kind: 'textarea', default: 'Trade within defined parameters, meet profit targets, and demonstrate disciplined risk management.' },
      { key: 'home.how.step4_title', label: 'Step 4 — title', kind: 'text', default: 'Receive Trading Capital' },
      { key: 'home.how.step4_desc', label: 'Step 4 — description', kind: 'textarea', default: 'Successful traders access real trading capital with up to a 90% profit split and payout protection.' },
      { key: 'home.how.step5_title', label: 'Step 5 — title', kind: 'text', default: 'Scale & Earn' },
      { key: 'home.how.step5_desc', label: 'Step 5 — description', kind: 'textarea', default: "Advance through Duncan's progressive scaling framework as you demonstrate consistency." },
    ],
  },
  {
    page: 'home',
    label: 'Homepage — Why Duncan',
    blocks: [
      { key: 'home.why.eyebrow', label: 'Eyebrow', kind: 'text', default: 'The Duncan Standard' },
      { key: 'home.why.title.line1', label: 'Title — gold', kind: 'text', default: 'Why' },
      { key: 'home.why.title.line2', label: 'Title — white', kind: 'text', default: 'Duncan Funded' },
      { key: 'home.why.r1_title', label: 'Reason 1 — title', kind: 'text', default: 'Institutional-Grade Trading Infrastructure' },
      { key: 'home.why.r1_desc', label: 'Reason 1 — description', kind: 'textarea', default: 'Built on proven, exchange-connected technology with stable execution, transparent pricing, and multi-asset support.' },
      { key: 'home.why.r2_title', label: 'Reason 2 — title', kind: 'text', default: 'Performance-Based Profit Split' },
      { key: 'home.why.r2_desc', label: 'Reason 2 — description', kind: 'textarea', default: 'Earn up to 90% of profits with payout protection and scaling incentives.' },
      { key: 'home.why.r3_title', label: 'Reason 3 — title', kind: 'text', default: 'Trade Without Deadlines' },
      { key: 'home.why.r3_desc', label: 'Reason 3 — description', kind: 'textarea', default: 'No artificial time limits. Focus on performance, not pressure.' },
      { key: 'home.why.r4_title', label: 'Reason 4 — title', kind: 'text', default: 'Flexible Payouts' },
      { key: 'home.why.r4_desc', label: 'Reason 4 — description', kind: 'textarea', default: 'Withdraw profits on a bi-weekly schedule or under payout protection terms.' },
      { key: 'home.why.r5_title', label: 'Reason 5 — title', kind: 'text', default: 'Progressive Scaling' },
      { key: 'home.why.r5_desc', label: 'Reason 5 — description', kind: 'textarea', default: 'Consistent traders qualify for increased capital allocation across supported asset classes.' },
      { key: 'home.why.r6_title', label: 'Reason 6 — title', kind: 'text', default: 'Trader-Focused Assistance' },
      { key: 'home.why.r6_desc', label: 'Reason 6 — description', kind: 'textarea', default: 'Support designed around real trader needs — clear answers, fast resolutions, and a commitment to transparency.' },
    ],
  },
  {
    page: 'home',
    label: 'Homepage — FAQ Section',
    blocks: [
      { key: 'home.faq.eyebrow', label: 'Eyebrow', kind: 'text', default: 'Questions' },
      { key: 'home.faq.title', label: 'Title (single-word)', kind: 'text', default: 'FAQ' },
    ],
  },
  {
    page: 'about',
    label: 'About Page',
    blocks: [
      { key: 'about.subtitle', label: 'Header subtitle', kind: 'text', default: '"Disce ferenda pati" — Learn to endure what must be borne.' },
      { key: 'about.paragraph1', label: 'Paragraph 1', kind: 'textarea', default: 'Duncan Funded was built on discipline and legacy. Founded by Tommy Duncan, a U.S. Army Colonel (Ret.), aerospace graduate, and lifelong trader, the firm reflects a lifetime of service, mastery, and uncompromising standards.' },
      { key: 'about.paragraph2', label: 'Paragraph 2', kind: 'textarea', default: "Tommy's journey began in the rigor of military life and the precision of aerospace engineering. That same rigor now defines how Duncan Funded operates: every program, every account, every payout — measured against the standard of a clan that does not yield." },
      { key: 'about.paragraph3', label: 'Paragraph 3', kind: 'textarea', default: 'We exist to fund the disciplined trader. The one who studies the chart, controls the risk, and earns the right to scale. Our programs reward consistency, not luck.' },
      { key: 'about.value1_title', label: 'Value 1 — title', kind: 'text', default: 'Heritage' },
      { key: 'about.value1_desc', label: 'Value 1 — description', kind: 'textarea', default: 'Rooted in Scottish tradition — discipline, honor, and the relentless pursuit of mastery.' },
      { key: 'about.value2_title', label: 'Value 2 — title', kind: 'text', default: 'Integrity' },
      { key: 'about.value2_desc', label: 'Value 2 — description', kind: 'textarea', default: 'Transparent rules, fair payouts, and no hidden conditions. The Duncan word is the Duncan bond.' },
      { key: 'about.value3_title', label: 'Value 3 — title', kind: 'text', default: 'Excellence' },
      { key: 'about.value3_desc', label: 'Value 3 — description', kind: 'textarea', default: 'We fund traders who refuse to settle. Mastery is the only currency that compounds.' },
    ],
  },
  {
    page: 'contact',
    label: 'Contact Page',
    blocks: [
      { key: 'contact.subtitle', label: 'Header subtitle', kind: 'text', default: 'Speak with the clan. Send a message or visit our headquarters.' },
      { key: 'contact.address_line1', label: 'Address line 1', kind: 'text', default: '1200 North Federal Highway' },
      { key: 'contact.address_line2', label: 'Address line 2', kind: 'text', default: 'Suite 300' },
      { key: 'contact.address_line3', label: 'City / State / ZIP', kind: 'text', default: 'Boca Raton, FL 33432' },
      { key: 'contact.hours', label: 'Hours', kind: 'text', default: 'Open 24/7 — Elite Trader Support' },
      { key: 'contact.email', label: 'Public email', kind: 'text', default: 'support@duncanfunded.com' },
    ],
  },
  {
    page: 'trade-zone',
    label: 'Trade Zone Page',
    blocks: [
      { key: 'tradezone.subtitle', label: 'Header subtitle', kind: 'text', default: 'Tools, dashboards, and disciplined frameworks for Duncan-funded traders.' },
      { key: 'tradezone.t1_name', label: 'Tool 1 — name', kind: 'text', default: 'Live Dashboard' },
      { key: 'tradezone.t1_desc', label: 'Tool 1 — description', kind: 'textarea', default: 'Real-time P&L, drawdown, and rule monitoring for your funded accounts.' },
      { key: 'tradezone.t2_name', label: 'Tool 2 — name', kind: 'text', default: 'Economic Calendar' },
      { key: 'tradezone.t2_desc', label: 'Tool 2 — description', kind: 'textarea', default: 'Stay ahead of high-impact news that moves the markets you trade.' },
      { key: 'tradezone.t3_name', label: 'Tool 3 — name', kind: 'text', default: 'Position Sizer' },
      { key: 'tradezone.t3_desc', label: 'Tool 3 — description', kind: 'textarea', default: 'Calculate precise lot sizes based on your daily and overall loss limits.' },
      { key: 'tradezone.t4_name', label: 'Tool 4 — name', kind: 'text', default: 'Trade Journal' },
      { key: 'tradezone.t4_desc', label: 'Tool 4 — description', kind: 'textarea', default: 'Log, tag, and review every setup. The clan rewards reflection.' },
      { key: 'tradezone.t5_name', label: 'Tool 5 — name', kind: 'text', default: 'Strategy Library' },
      { key: 'tradezone.t5_desc', label: 'Tool 5 — description', kind: 'textarea', default: 'Curated playbooks from funded Duncan traders, refreshed regularly.' },
      { key: 'tradezone.t6_name', label: 'Tool 6 — name', kind: 'text', default: 'Risk Console' },
      { key: 'tradezone.t6_desc', label: 'Tool 6 — description', kind: 'textarea', default: 'Pre-trade checks, max-exposure alerts, and kill-switch style protections.' },
    ],
  },
  {
    page: 'footer',
    label: 'Footer',
    blocks: [
      { key: 'footer.newsletter_heading', label: 'Newsletter heading', kind: 'text', default: 'Join the Duncan Roll' },
      { key: 'footer.newsletter_paragraph', label: 'Newsletter paragraph', kind: 'textarea', default: 'Trading insight, evaluation tips, and clan updates — straight to your inbox.' },
      { key: 'footer.copyright', label: 'Copyright line', kind: 'text', default: '© 2026 Duncan Funded. Built on institutional-grade trading technology. All rights reserved.' },
      { key: 'footer.disclaimer', label: 'Disclaimer paragraph', kind: 'textarea', default: 'Disclaimer: Duncan Funded is an affiliate of Prop Account, LLC. All live assessments are provided by Prop Account, LC and all assessment fees are paid to Prop Account, LLC. If you qualify for a Live Account, you will be required to enter into a Trader Agreement with Prop Account LC. Neither Prop Account, LLC nor Prop Account LC provides any trading education or other services. All such services are provided by Duncan Funded. Duncan Funded is a trade name of Superb Choice LLC.' },
    ],
  },
];

/** Flatten the registry into a defaults map. */
function defaultsMap() {
  const map = {};
  for (const section of CONTENT_REGISTRY) {
    for (const block of section.blocks) {
      map[block.key] = block.default;
    }
  }
  return map;
}

/** Public — get all content blocks as a key->value map (with defaults applied). */
export async function getAllContent() {
  const rows = await all('SELECT key, value FROM content_blocks');
  const stored = {};
  for (const r of rows) stored[r.key] = r.value;
  const defaults = defaultsMap();
  return { ...defaults, ...stored };
}

/** Admin — return registry sections with each block's current value resolved. */
export async function adminListSections() {
  const current = await getAllContent();
  return CONTENT_REGISTRY.map((section) => ({
    page: section.page,
    label: section.label,
    blocks: section.blocks.map((b) => ({ ...b, value: current[b.key] ?? b.default })),
  }));
}

/** Admin — upsert a single block. Empty string is allowed (means "fall back to default"). */
export async function updateBlock(key, rawValue) {
  // Reject unknown keys to keep the table tidy.
  const registry = defaultsMap();
  if (!(key in registry)) {
    const err = new Error(`Unknown content key: ${key}`);
    err.status = 400;
    throw err;
  }
  const value = String(rawValue ?? '').slice(0, 4000);
  await run(
    `INSERT INTO content_blocks (key, value, "updatedAt")
     VALUES (?, ?, ?)
     ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value,
           "updatedAt" = EXCLUDED."updatedAt"`,
    [key, value, now()],
  );
  return get('SELECT key, value FROM content_blocks WHERE key = ?', [key]);
}

/** Admin — bulk update; { key: value, key: value } */
export async function updateMany(input) {
  if (!input || typeof input !== 'object') {
    const err = new Error('Expected an object of { key: value } pairs.');
    err.status = 400;
    throw err;
  }
  const registry = defaultsMap();
  const updates = [];
  for (const [key, rawValue] of Object.entries(input)) {
    if (!(key in registry)) continue; // silently skip unknown keys
    updates.push({ key, value: String(rawValue ?? '').slice(0, 4000) });
  }
  for (const u of updates) {
    await run(
      `INSERT INTO content_blocks (key, value, "updatedAt")
       VALUES (?, ?, ?)
       ON CONFLICT (key) DO UPDATE
         SET value = EXCLUDED.value,
             "updatedAt" = EXCLUDED."updatedAt"`,
      [u.key, u.value, now()],
    );
  }
  return { updated: updates.length };
}
