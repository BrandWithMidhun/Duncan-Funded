import { all, get, run } from '../lib/db.js';
import { now } from '../lib/helpers.js';

/**
 * Per-page SEO content. Stored by slug (the route path without the
 * leading slash, or 'home' for /). Defaults are returned for any
 * page slug not yet customized.
 */

// Default SEO content per page — used until an admin overrides any field.
const PAGE_DEFAULTS = {
  home: {
    title: 'Duncan Funded — Trade with Honour. Profit with Legacy.',
    description:
      'A premium proprietary trading firm built on discipline, transparency, and trader excellence. Prove your skill, earn your funding, and rise under the Duncan standard.',
    ogImage: '',
  },
  about: {
    title: 'About — Duncan Funded',
    description:
      'Duncan Funded was built on discipline and legacy. Learn about the firm, its founder, and the standard we hold every trader to.',
    ogImage: '',
  },
  programs: {
    title: 'Funded Programs — Duncan Funded',
    description:
      'Explore our funded programs: 1-Step and 2-Step accounts across Forex, Equities, Crypto, and Futures, on institutional-grade infrastructure.',
    ogImage: '',
  },
  faq: {
    title: 'Frequent Questions — Duncan Funded',
    description:
      'Answers to common questions about evaluations, payouts, scaling plans, supported platforms, and tradable instruments.',
    ogImage: '',
  },
  contact: {
    title: 'Contact — Duncan Funded',
    description:
      'Get in touch with Duncan Funded. Send a message, view our address, or reach our 24/7 elite support.',
    ogImage: '',
  },
  'trade-zone': {
    title: 'Trade Zone — Duncan Funded',
    description:
      'A trader-first environment built on transparency and structured discipline. Where Duncan-funded traders gather.',
    ogImage: '',
  },
  blog: {
    title: 'Blog — Duncan Funded',
    description:
      'Insights, strategy, and disciplined thinking from the Duncan Funded team. Read the latest articles for funded traders.',
    ogImage: '',
  },
};

/** List of slugs the admin UI exposes for editing. */
export const SEO_PAGE_SLUGS = Object.keys(PAGE_DEFAULTS);

/** Get all SEO pages, merging defaults with any stored overrides. */
export async function listSeoPages() {
  const rows = await all('SELECT * FROM seo_pages');
  const stored = {};
  for (const r of rows) stored[r.slug] = r;

  return SEO_PAGE_SLUGS.map((slug) => {
    const def = PAGE_DEFAULTS[slug];
    const s = stored[slug] || {};
    return {
      slug,
      title: s.title || def.title,
      description: s.description || def.description,
      ogImage: s.ogImage || def.ogImage,
    };
  });
}

/** Get a single page's SEO (with defaults applied). */
export async function getSeoPage(slug) {
  const def = PAGE_DEFAULTS[slug];
  if (!def) return null;
  const s = await get('SELECT * FROM seo_pages WHERE slug = ?', [slug]);
  return {
    slug,
    title: (s && s.title) || def.title,
    description: (s && s.description) || def.description,
    ogImage: (s && s.ogImage) || def.ogImage,
  };
}

/** Upsert a page's SEO content. Empty strings fall back to defaults at read time. */
export async function updateSeoPage(slug, input) {
  if (!PAGE_DEFAULTS[slug]) {
    const err = new Error(`Unknown page slug: ${slug}`);
    err.status = 400;
    throw err;
  }
  const title = String(input.title || '').trim().slice(0, 200);
  const description = String(input.description || '').trim().slice(0, 500);
  const ogImage = String(input.ogImage || '').trim().slice(0, 500);

  await run(
    `INSERT INTO seo_pages (slug, title, description, "ogImage", "updatedAt")
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (slug) DO UPDATE
       SET title = EXCLUDED.title,
           description = EXCLUDED.description,
           "ogImage" = EXCLUDED."ogImage",
           "updatedAt" = EXCLUDED."updatedAt"`,
    [slug, title, description, ogImage, now()],
  );
  return getSeoPage(slug);
}
