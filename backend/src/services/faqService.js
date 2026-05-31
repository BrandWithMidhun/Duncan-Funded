import { all, get, run, tx } from '../lib/db.js';
import { ApiError, genId, now, toSlug } from '../lib/helpers.js';

/**
 * FAQ data — categories (e.g. "General FAQs") each containing items
 * (Q&A pairs). Categories and items both have an "order" field used
 * for display ordering. Slugs are derived from labels.
 */

/** Public — fetch all categories with their items, ordered. */
export async function listCategoriesWithItems() {
  const cats = await all(
    'SELECT id, slug, label, "order" FROM faq_categories ORDER BY "order" ASC, "createdAt" ASC',
  );
  if (cats.length === 0) return [];
  const items = await all(
    `SELECT id, "categoryId", question, answer, "order"
     FROM faq_items
     ORDER BY "order" ASC, "createdAt" ASC`,
  );
  const byCat = new Map();
  for (const it of items) {
    if (!byCat.has(it.categoryId)) byCat.set(it.categoryId, []);
    byCat.get(it.categoryId).push({
      id: it.id,
      q: it.question,
      a: it.answer,
      order: it.order,
    });
  }
  return cats.map((c) => ({
    id: c.id,
    slug: c.slug,
    label: c.label,
    order: c.order,
    faqs: byCat.get(c.id) || [],
  }));
}

/** Admin — same shape, but used internally for the admin UI. */
export const adminListCategoriesWithItems = listCategoriesWithItems;

// ---- Category CRUD ----

export async function createCategory({ label, order }) {
  const cleanLabel = String(label || '').trim();
  if (cleanLabel.length < 2) throw new ApiError(400, 'Category label is too short');
  const id = genId();
  // Ensure unique slug
  let slug = toSlug(cleanLabel);
  let n = 2;
  while (await get('SELECT 1 FROM faq_categories WHERE slug = ?', [slug])) {
    slug = `${toSlug(cleanLabel)}-${n++}`;
  }
  await run(
    `INSERT INTO faq_categories (id, slug, label, "order", "createdAt")
     VALUES (?, ?, ?, ?, ?)`,
    [id, slug, cleanLabel, Number(order) || 0, now()],
  );
  return get('SELECT * FROM faq_categories WHERE id = ?', [id]);
}

export async function updateCategory(id, { label, order }) {
  const existing = await get('SELECT * FROM faq_categories WHERE id = ?', [id]);
  if (!existing) throw new ApiError(404, 'Category not found');
  const cleanLabel =
    typeof label === 'string' ? label.trim() : existing.label;
  if (cleanLabel.length < 2) throw new ApiError(400, 'Category label is too short');
  await run(
    'UPDATE faq_categories SET label = ?, "order" = ? WHERE id = ?',
    [cleanLabel, order !== undefined ? Number(order) || 0 : existing.order, id],
  );
  return get('SELECT * FROM faq_categories WHERE id = ?', [id]);
}

export async function deleteCategory(id) {
  // ON DELETE CASCADE removes items automatically
  const res = await run('DELETE FROM faq_categories WHERE id = ?', [id]);
  if (!res) throw new ApiError(404, 'Category not found');
  return { id };
}

// ---- Item CRUD ----

export async function createItem({ categoryId, question, answer, order }) {
  const cat = await get('SELECT id FROM faq_categories WHERE id = ?', [categoryId]);
  if (!cat) throw new ApiError(400, 'Unknown categoryId');
  const cleanQ = String(question || '').trim();
  const cleanA = String(answer || '').trim();
  if (cleanQ.length < 3) throw new ApiError(400, 'Question is too short');
  if (cleanA.length < 2) throw new ApiError(400, 'Answer is too short');
  const id = genId();
  await run(
    `INSERT INTO faq_items (id, "categoryId", question, answer, "order", "createdAt")
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, categoryId, cleanQ, cleanA, Number(order) || 0, now()],
  );
  return get('SELECT * FROM faq_items WHERE id = ?', [id]);
}

export async function updateItem(id, { question, answer, order, categoryId }) {
  const existing = await get('SELECT * FROM faq_items WHERE id = ?', [id]);
  if (!existing) throw new ApiError(404, 'Item not found');
  if (categoryId && categoryId !== existing.categoryId) {
    const cat = await get('SELECT id FROM faq_categories WHERE id = ?', [categoryId]);
    if (!cat) throw new ApiError(400, 'Unknown categoryId');
  }
  const cleanQ =
    typeof question === 'string' ? question.trim() : existing.question;
  const cleanA = typeof answer === 'string' ? answer.trim() : existing.answer;
  if (cleanQ.length < 3) throw new ApiError(400, 'Question is too short');
  if (cleanA.length < 2) throw new ApiError(400, 'Answer is too short');
  await run(
    `UPDATE faq_items SET
       "categoryId" = ?, question = ?, answer = ?, "order" = ?
     WHERE id = ?`,
    [
      categoryId || existing.categoryId,
      cleanQ,
      cleanA,
      order !== undefined ? Number(order) || 0 : existing.order,
      id,
    ],
  );
  return get('SELECT * FROM faq_items WHERE id = ?', [id]);
}

export async function deleteItem(id) {
  const res = await run('DELETE FROM faq_items WHERE id = ?', [id]);
  if (!res) throw new ApiError(404, 'Item not found');
  return { id };
}

// ---- Seeding from the legacy hardcoded data ----

/**
 * Seed the faq_categories / faq_items tables from the static data in
 * `frontend/src/lib/faq.ts`. Skips seeding if the tables already have
 * any rows — call with { force: true } to wipe and reseed.
 */
export async function seedFromStatic(staticCategories, { force = false } = {}) {
  return tx(async (t) => {
    if (force) {
      await t.run('DELETE FROM faq_items');
      await t.run('DELETE FROM faq_categories');
    } else {
      const existing = await t.get('SELECT COUNT(*) AS n FROM faq_categories');
      if (Number(existing.n) > 0) return { skipped: true };
    }
    let i = 0;
    for (const cat of staticCategories) {
      const catId = genId();
      let slug = toSlug(cat.label);
      let n = 2;
      while (await t.get('SELECT 1 FROM faq_categories WHERE slug = ?', [slug])) {
        slug = `${toSlug(cat.label)}-${n++}`;
      }
      await t.run(
        `INSERT INTO faq_categories (id, slug, label, "order", "createdAt")
         VALUES (?, ?, ?, ?, ?)`,
        [catId, slug, cat.label, i++, now()],
      );
      let j = 0;
      for (const f of cat.faqs) {
        await t.run(
          `INSERT INTO faq_items (id, "categoryId", question, answer, "order", "createdAt")
           VALUES (?, ?, ?, ?, ?, ?)`,
          [genId(), catId, f.q, f.a, j++, now()],
        );
      }
    }
    return { seeded: i };
  });
}
