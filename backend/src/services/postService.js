import { all, get, run, tx } from '../lib/db.js';
import {
  ApiError,
  estimateReadingTime,
  uniqueSlug,
  toSlug,
  genId,
  now,
} from '../lib/helpers.js';

/** Attach author, category and tags to a raw post row, and shape for the API. */
async function hydrate(row) {
  if (!row) return null;
  const author = row.authorId
    ? await get('SELECT id, name FROM users WHERE id = ?', [row.authorId])
    : null;
  const category = row.categoryId
    ? await get('SELECT id, name, slug FROM categories WHERE id = ?', [row.categoryId])
    : null;
  const tags = await all(
    `SELECT t.id, t.name, t.slug FROM tags t
     JOIN tags_on_posts tp ON tp."tagId" = t.id
     WHERE tp."postId" = ? ORDER BY t.name`,
    [row.id],
  );
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    coverImage: row.coverImage || null,
    status: row.status,
    featured: !!row.featured,
    readingTime: row.readingTime,
    views: row.views,
    seo: {
      metaTitle: row.metaTitle || row.title,
      metaDescription: row.metaDescription || row.excerpt,
      ogImage: row.ogImage || row.coverImage || null,
      canonicalUrl: row.canonicalUrl || null,
    },
    publishedAt: row.publishedAt || null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    author,
    category,
    tags,
  };
}

/** Resolve (or create) a category by name; returns its id. Uses a scoped db client. */
async function resolveCategory(client, name) {
  if (!name) return null;
  const slug = toSlug(name);
  const existing = await client.get('SELECT id FROM categories WHERE slug = ?', [slug]);
  if (existing) return existing.id;
  const id = genId();
  await client.run('INSERT INTO categories (id, slug, name, "createdAt") VALUES (?, ?, ?, ?)', [
    id,
    slug,
    name,
    now(),
  ]);
  return id;
}

/** Resolve (or create) tags by name; returns array of tag ids. */
async function resolveTags(client, names = []) {
  const ids = [];
  for (const name of names) {
    const slug = toSlug(name);
    let row = await client.get('SELECT id FROM tags WHERE slug = ?', [slug]);
    if (!row) {
      const id = genId();
      await client.run('INSERT INTO tags (id, slug, name, "createdAt") VALUES (?, ?, ?, ?)', [
        id,
        slug,
        name,
        now(),
      ]);
      row = { id };
    }
    ids.push(row.id);
  }
  return ids;
}

/** Resolve (or create) an author by name; returns its id. */
async function resolveAuthor(client, name) {
  if (!name) return null;
  const email = `${toSlug(name)}@duncanfunded.com`;
  const existing = await client.get('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) return existing.id;
  const id = genId();
  await client.run(
    'INSERT INTO users (id, email, name, role, "createdAt") VALUES (?, ?, ?, ?, ?)',
    [id, email, name, 'EDITOR', now()],
  );
  return id;
}

/**
 * List posts with pagination + filtering.
 * Public callers only see PUBLISHED posts; admins pass includeAll.
 */
export async function listPosts({
  page = 1,
  limit = 9,
  category,
  tag,
  search,
  featured,
  status,
  includeAll = false,
} = {}) {
  const where = [];
  const params = [];

  if (!includeAll) {
    where.push("status = 'PUBLISHED'");
    where.push('"publishedAt" <= ?');
    params.push(now());
  } else if (status) {
    where.push('status = ?');
    params.push(status);
  }
  if (category) {
    where.push('"categoryId" = (SELECT id FROM categories WHERE slug = ?)');
    params.push(category);
  }
  if (tag) {
    where.push(
      'id IN (SELECT tp."postId" FROM tags_on_posts tp JOIN tags t ON t.id = tp."tagId" WHERE t.slug = ?)',
    );
    params.push(tag);
  }
  if (featured !== undefined) {
    where.push('featured = ?');
    params.push(!!featured);
  }
  if (search) {
    where.push('(title ILIKE ? OR excerpt ILIKE ? OR content ILIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const take = Math.min(Math.max(Number(limit) || 9, 1), 50);
  const pageNum = Math.max(Number(page) || 1, 1);
  const offset = (pageNum - 1) * take;

  const totalRow = await get(`SELECT COUNT(*) AS n FROM posts ${whereSql}`, params);
  const total = Number(totalRow.n);
  const rows = await all(
    `SELECT * FROM posts ${whereSql}
     ORDER BY COALESCE("publishedAt", "createdAt") DESC
     LIMIT ? OFFSET ?`,
    [...params, take, offset],
  );

  const data = [];
  for (const row of rows) data.push(await hydrate(row));

  return {
    data,
    pagination: {
      total,
      page: pageNum,
      limit: take,
      totalPages: Math.ceil(total / take) || 1,
    },
  };
}

/** Get a single post by slug. Optionally increments the view counter. */
export async function getPostBySlug(slug, { includeAll = false, countView = false } = {}) {
  const row = await get('SELECT * FROM posts WHERE slug = ?', [slug]);
  if (!row) throw new ApiError(404, 'Post not found');
  if (!includeAll && row.status !== 'PUBLISHED') throw new ApiError(404, 'Post not found');
  if (countView && row.status === 'PUBLISHED') {
    await run('UPDATE posts SET views = views + 1 WHERE id = ?', [row.id]);
    row.views += 1;
  }
  return hydrate(row);
}

/** Create a post. */
export async function createPost(input) {
  const id = genId();
  const ts = now();
  const status = input.status || 'DRAFT';
  const publishedAt = status === 'PUBLISHED' ? input.publishedAt || ts : null;

  const slug = await tx(async (client) => {
    const postSlug = await uniqueSlug('posts', input.title, null, client.get);
    const categoryId = await resolveCategory(client, input.categoryName);
    const authorId = await resolveAuthor(client, input.authorName);
    const tagIds = await resolveTags(client, input.tags || []);

    await client.run(
      `INSERT INTO posts
        (id, slug, title, excerpt, content, "coverImage", status, featured,
         "readingTime", views, "metaTitle", "metaDescription", "ogImage", "canonicalUrl",
         "publishedAt", "createdAt", "updatedAt", "authorId", "categoryId")
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id,
        postSlug,
        input.title,
        input.excerpt,
        input.content,
        input.coverImage || null,
        status,
        !!input.featured,
        estimateReadingTime(input.content),
        0,
        input.metaTitle || null,
        input.metaDescription || null,
        input.ogImage || null,
        input.canonicalUrl || null,
        publishedAt,
        ts,
        ts,
        authorId,
        categoryId,
      ],
    );
    for (const tagId of tagIds) {
      await client.run(
        'INSERT INTO tags_on_posts ("postId", "tagId") VALUES (?, ?) ON CONFLICT DO NOTHING',
        [id, tagId],
      );
    }
    return postSlug;
  });

  return getPostBySlug(slug, { includeAll: true });
}

/** Update a post by id. */
export async function updatePost(id, input) {
  const existing = await get('SELECT * FROM posts WHERE id = ?', [id]);
  if (!existing) throw new ApiError(404, 'Post not found');

  await tx(async (client) => {
    const fields = [];
    const params = [];
    const set = (col, val) => {
      fields.push(`${col} = ?`);
      params.push(val);
    };

    if (input.title !== undefined) {
      set('title', input.title);
      set('slug', await uniqueSlug('posts', input.title, id, client.get));
    }
    if (input.excerpt !== undefined) set('excerpt', input.excerpt);
    if (input.content !== undefined) {
      set('content', input.content);
      set('"readingTime"', estimateReadingTime(input.content));
    }
    if (input.coverImage !== undefined) set('"coverImage"', input.coverImage);
    if (input.featured !== undefined) set('featured', !!input.featured);
    if (input.metaTitle !== undefined) set('"metaTitle"', input.metaTitle);
    if (input.metaDescription !== undefined) set('"metaDescription"', input.metaDescription);
    if (input.ogImage !== undefined) set('"ogImage"', input.ogImage);
    if (input.canonicalUrl !== undefined) set('"canonicalUrl"', input.canonicalUrl);

    if (input.status !== undefined) {
      set('status', input.status);
      if (input.status === 'PUBLISHED' && !existing.publishedAt) {
        set('"publishedAt"', input.publishedAt || now());
      }
    }
    if (input.publishedAt !== undefined && input.publishedAt) {
      set('"publishedAt"', input.publishedAt);
    }
    if (input.categoryName !== undefined) {
      set('"categoryId"', await resolveCategory(client, input.categoryName));
    }
    if (input.authorName !== undefined) {
      set('"authorId"', await resolveAuthor(client, input.authorName));
    }
    set('"updatedAt"', now());

    await client.run(`UPDATE posts SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);

    if (input.tags !== undefined) {
      await client.run('DELETE FROM tags_on_posts WHERE "postId" = ?', [id]);
      for (const tagId of await resolveTags(client, input.tags)) {
        await client.run(
          'INSERT INTO tags_on_posts ("postId", "tagId") VALUES (?, ?) ON CONFLICT DO NOTHING',
          [id, tagId],
        );
      }
    }
  });

  const updated = await get('SELECT slug FROM posts WHERE id = ?', [id]);
  return getPostBySlug(updated.slug, { includeAll: true });
}

/** Delete a post by id. */
export async function deletePost(id) {
  const existing = await get('SELECT id FROM posts WHERE id = ?', [id]);
  if (!existing) throw new ApiError(404, 'Post not found');
  await tx(async (client) => {
    await client.run('DELETE FROM tags_on_posts WHERE "postId" = ?', [id]);
    await client.run('DELETE FROM posts WHERE id = ?', [id]);
  });
  return { id };
}

/** All categories with published post counts. */
export async function listCategories() {
  return all(
    `SELECT c.id, c.name, c.slug, c.description,
            (SELECT COUNT(*) FROM posts p
             WHERE p."categoryId" = c.id AND p.status = 'PUBLISHED') AS "postCount"
     FROM categories c ORDER BY c.name`,
  );
}

/** All tags. */
export async function listTags() {
  return all('SELECT id, name, slug FROM tags ORDER BY name');
}

/** Slugs + timestamps of every published post — used to build sitemap.xml. */
export async function getPublishedSlugs() {
  return all(
    `SELECT slug, "updatedAt" FROM posts
     WHERE status = 'PUBLISHED' AND "publishedAt" <= ?
     ORDER BY "publishedAt" DESC`,
    [now()],
  );
}
