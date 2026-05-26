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
function hydrate(row) {
  if (!row) return null;
  const author = row.authorId
    ? get('SELECT id, name FROM users WHERE id = ?', [row.authorId])
    : null;
  const category = row.categoryId
    ? get('SELECT id, name, slug FROM categories WHERE id = ?', [row.categoryId])
    : null;
  const tags = all(
    `SELECT t.id, t.name, t.slug FROM tags t
     JOIN tags_on_posts tp ON tp.tagId = t.id
     WHERE tp.postId = ? ORDER BY t.name`,
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

/** Resolve (or create) a category by name; returns its id. */
function resolveCategory(name) {
  if (!name) return null;
  const slug = toSlug(name);
  const existing = get('SELECT id FROM categories WHERE slug = ?', [slug]);
  if (existing) return existing.id;
  const id = genId();
  run('INSERT INTO categories (id, slug, name, createdAt) VALUES (?, ?, ?, ?)', [
    id,
    slug,
    name,
    now(),
  ]);
  return id;
}

/** Resolve (or create) tags by name; returns array of tag ids. */
function resolveTags(names = []) {
  const ids = [];
  for (const name of names) {
    const slug = toSlug(name);
    let row = get('SELECT id FROM tags WHERE slug = ?', [slug]);
    if (!row) {
      const id = genId();
      run('INSERT INTO tags (id, slug, name, createdAt) VALUES (?, ?, ?, ?)', [
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
function resolveAuthor(name) {
  if (!name) return null;
  const email = `${toSlug(name)}@duncanfunded.com`;
  const existing = get('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) return existing.id;
  const id = genId();
  run('INSERT INTO users (id, email, name, role, createdAt) VALUES (?, ?, ?, ?, ?)', [
    id,
    email,
    name,
    'EDITOR',
    now(),
  ]);
  return id;
}

/**
 * List posts with pagination + filtering.
 * Public callers only see PUBLISHED posts; admins pass includeAll.
 */
export function listPosts({
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
    where.push('publishedAt <= ?');
    params.push(now());
  } else if (status) {
    where.push('status = ?');
    params.push(status);
  }
  if (category) {
    where.push('categoryId = (SELECT id FROM categories WHERE slug = ?)');
    params.push(category);
  }
  if (tag) {
    where.push(
      'id IN (SELECT tp.postId FROM tags_on_posts tp JOIN tags t ON t.id = tp.tagId WHERE t.slug = ?)',
    );
    params.push(tag);
  }
  if (featured !== undefined) {
    where.push('featured = ?');
    params.push(featured ? 1 : 0);
  }
  if (search) {
    where.push('(title LIKE ? OR excerpt LIKE ? OR content LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const take = Math.min(Math.max(Number(limit) || 9, 1), 50);
  const pageNum = Math.max(Number(page) || 1, 1);
  const offset = (pageNum - 1) * take;

  const total = get(`SELECT COUNT(*) AS n FROM posts ${whereSql}`, params).n;
  const rows = all(
    `SELECT * FROM posts ${whereSql}
     ORDER BY COALESCE(publishedAt, createdAt) DESC
     LIMIT ? OFFSET ?`,
    [...params, take, offset],
  );

  return {
    data: rows.map(hydrate),
    pagination: {
      total,
      page: pageNum,
      limit: take,
      totalPages: Math.ceil(total / take) || 1,
    },
  };
}

/** Get a single post by slug. Optionally increments the view counter. */
export function getPostBySlug(slug, { includeAll = false, countView = false } = {}) {
  const row = get('SELECT * FROM posts WHERE slug = ?', [slug]);
  if (!row) throw new ApiError(404, 'Post not found');
  if (!includeAll && row.status !== 'PUBLISHED') throw new ApiError(404, 'Post not found');
  if (countView && row.status === 'PUBLISHED') {
    run('UPDATE posts SET views = views + 1 WHERE id = ?', [row.id]);
    row.views += 1;
  }
  return hydrate(row);
}

/** Create a post. */
export function createPost(input) {
  const id = genId();
  const slug = uniqueSlug('posts', input.title);
  const ts = now();
  const status = input.status || 'DRAFT';
  const publishedAt =
    status === 'PUBLISHED' ? input.publishedAt || ts : null;

  let categoryId = null;
  let authorId = null;
  let tagIds = [];

  tx(() => {
    categoryId = resolveCategory(input.categoryName);
    authorId = resolveAuthor(input.authorName);
    tagIds = resolveTags(input.tags || []);

    run(
      `INSERT INTO posts
        (id, slug, title, excerpt, content, coverImage, status, featured,
         readingTime, views, metaTitle, metaDescription, ogImage, canonicalUrl,
         publishedAt, createdAt, updatedAt, authorId, categoryId)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id,
        slug,
        input.title,
        input.excerpt,
        input.content,
        input.coverImage || null,
        status,
        input.featured ? 1 : 0,
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
      run('INSERT OR IGNORE INTO tags_on_posts (postId, tagId) VALUES (?, ?)', [id, tagId]);
    }
  });

  return getPostBySlug(slug, { includeAll: true });
}

/** Update a post by id. */
export function updatePost(id, input) {
  const existing = get('SELECT * FROM posts WHERE id = ?', [id]);
  if (!existing) throw new ApiError(404, 'Post not found');

  const fields = [];
  const params = [];
  const set = (col, val) => {
    fields.push(`${col} = ?`);
    params.push(val);
  };

  if (input.title !== undefined) {
    set('title', input.title);
    set('slug', uniqueSlug('posts', input.title, id));
  }
  if (input.excerpt !== undefined) set('excerpt', input.excerpt);
  if (input.content !== undefined) {
    set('content', input.content);
    set('readingTime', estimateReadingTime(input.content));
  }
  if (input.coverImage !== undefined) set('coverImage', input.coverImage);
  if (input.featured !== undefined) set('featured', input.featured ? 1 : 0);
  if (input.metaTitle !== undefined) set('metaTitle', input.metaTitle);
  if (input.metaDescription !== undefined) set('metaDescription', input.metaDescription);
  if (input.ogImage !== undefined) set('ogImage', input.ogImage);
  if (input.canonicalUrl !== undefined) set('canonicalUrl', input.canonicalUrl);

  if (input.status !== undefined) {
    set('status', input.status);
    if (input.status === 'PUBLISHED' && !existing.publishedAt) {
      set('publishedAt', input.publishedAt || now());
    }
  }
  if (input.publishedAt !== undefined && input.publishedAt) {
    set('publishedAt', input.publishedAt);
  }

  tx(() => {
    if (input.categoryName !== undefined) {
      set('categoryId', resolveCategory(input.categoryName));
    }
    if (input.authorName !== undefined) {
      set('authorId', resolveAuthor(input.authorName));
    }
    set('updatedAt', now());

    run(`UPDATE posts SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);

    if (input.tags !== undefined) {
      run('DELETE FROM tags_on_posts WHERE postId = ?', [id]);
      for (const tagId of resolveTags(input.tags)) {
        run('INSERT OR IGNORE INTO tags_on_posts (postId, tagId) VALUES (?, ?)', [id, tagId]);
      }
    }
  });

  const updated = get('SELECT slug FROM posts WHERE id = ?', [id]);
  return getPostBySlug(updated.slug, { includeAll: true });
}

/** Delete a post by id. */
export function deletePost(id) {
  const existing = get('SELECT id FROM posts WHERE id = ?', [id]);
  if (!existing) throw new ApiError(404, 'Post not found');
  tx(() => {
    run('DELETE FROM tags_on_posts WHERE postId = ?', [id]);
    run('DELETE FROM posts WHERE id = ?', [id]);
  });
  return { id };
}

/** All categories with published post counts. */
export function listCategories() {
  return all(
    `SELECT c.id, c.name, c.slug, c.description,
            (SELECT COUNT(*) FROM posts p
             WHERE p.categoryId = c.id AND p.status = 'PUBLISHED') AS postCount
     FROM categories c ORDER BY c.name`,
  );
}

/** All tags. */
export function listTags() {
  return all('SELECT id, name, slug FROM tags ORDER BY name');
}

/** Slugs + timestamps of every published post — used to build sitemap.xml. */
export function getPublishedSlugs() {
  return all(
    `SELECT slug, updatedAt FROM posts
     WHERE status = 'PUBLISHED' AND publishedAt <= ?
     ORDER BY publishedAt DESC`,
    [now()],
  );
}
