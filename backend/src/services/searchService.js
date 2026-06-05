import { all } from '../lib/db.js';

/**
 * Site-wide search across three content types:
 *   - blog posts (published only) — title, excerpt, content
 *   - FAQ items — question, answer
 *   - programs — name, rules
 *
 * Uses PostgreSQL ILIKE for case-insensitive substring matching. Cheap,
 * good enough for the catalog sizes we have (dozens of posts/FAQs,
 * <20 programs). Can be upgraded to tsvector + GIN later if needed.
 */

const MAX_PER_TYPE = 8;
const MIN_QUERY_LENGTH = 2;

function escapeLike(s) {
  // Escape underscore and percent so a search for "5%" doesn't match
  // everything containing a 5. Backslash is also reserved.
  return String(s).replace(/[\\%_]/g, (m) => '\\' + m);
}

function rank(text, q) {
  if (!text) return 0;
  const lower = text.toLowerCase();
  const ql = q.toLowerCase();
  // Higher score = better match: exact whole-word > startswith > substring.
  if (lower === ql) return 100;
  if (lower.startsWith(ql)) return 50;
  const idx = lower.indexOf(ql);
  if (idx === -1) return 0;
  return Math.max(1, 30 - idx); // earlier match scores higher
}

export async function search(rawQuery) {
  const q = String(rawQuery || '').trim();
  if (q.length < MIN_QUERY_LENGTH) {
    return { query: q, posts: [], faqs: [], programs: [], total: 0 };
  }
  const like = `%${escapeLike(q)}%`;

  // --- Blog posts ---
  const posts = await all(
    `SELECT id, slug, title, excerpt, "coverImage", "publishedAt"
     FROM posts
     WHERE status = 'PUBLISHED'
       AND "publishedAt" IS NOT NULL
       AND "publishedAt" <= NOW()
       AND (title ILIKE ? OR excerpt ILIKE ? OR content ILIKE ?)
     ORDER BY "publishedAt" DESC
     LIMIT ?`,
    [like, like, like, MAX_PER_TYPE * 2],
  );
  const postsScored = posts
    .map((p) => ({
      ...p,
      _score: rank(p.title, q) * 2 + rank(p.excerpt, q),
    }))
    .sort((a, b) => b._score - a._score)
    .slice(0, MAX_PER_TYPE)
    .map(({ _score, ...rest }) => rest);

  // --- FAQ items (with their category labels for context) ---
  const faqs = await all(
    `SELECT i.id, i.question, i.answer,
            c.id AS "categoryId", c.slug AS "categorySlug", c.label AS "categoryLabel"
     FROM faq_items i
     JOIN faq_categories c ON c.id = i."categoryId"
     WHERE i.question ILIKE ? OR i.answer ILIKE ?
     ORDER BY c."order" ASC, i."order" ASC
     LIMIT ?`,
    [like, like, MAX_PER_TYPE * 2],
  );
  const faqsScored = faqs
    .map((f) => ({ ...f, _score: rank(f.question, q) * 2 + rank(f.answer, q) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, MAX_PER_TYPE)
    .map(({ _score, ...rest }) => rest);

  // --- Programs (search across name + rules JSON text + category) ---
  const programs = await all(
    `SELECT id, slug, category, name, popular, rules
     FROM programs
     WHERE name ILIKE ? OR rules::text ILIKE ? OR category ILIKE ?
     ORDER BY "order" ASC
     LIMIT ?`,
    [like, like, like, MAX_PER_TYPE * 2],
  );
  const programsClean = programs
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      category: p.category,
      name: p.name,
      popular: p.popular === true || p.popular === 't',
      // pull out the rule lines that contain the query, for snippet display
      matchingRules: (() => {
        const rules = Array.isArray(p.rules)
          ? p.rules
          : typeof p.rules === 'string'
            ? (() => {
                try {
                  return JSON.parse(p.rules);
                } catch {
                  return [];
                }
              })()
            : [];
        return rules
          .filter((r) => String(r).toLowerCase().includes(q.toLowerCase()))
          .slice(0, 3);
      })(),
      _score: rank(p.name, q) * 2 + (p.popular ? 5 : 0),
    }))
    .sort((a, b) => b._score - a._score)
    .slice(0, MAX_PER_TYPE)
    .map(({ _score, ...rest }) => rest);

  const total = postsScored.length + faqsScored.length + programsClean.length;
  return { query: q, posts: postsScored, faqs: faqsScored, programs: programsClean, total };
}
