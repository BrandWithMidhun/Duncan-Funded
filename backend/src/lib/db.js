import pg from 'pg';

const { Pool } = pg;

// Postgres connection pool. Railway injects DATABASE_URL automatically when a
// Postgres plugin is attached to the service.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    '[db] DATABASE_URL is not set. Set it in your environment (Railway provides it automatically when a Postgres database is attached).',
  );
}

const pool = new Pool({
  connectionString,
  // Railway's managed Postgres requires SSL in production.
  ssl:
    process.env.PGSSL === 'disable'
      ? false
      : process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('[db] Unexpected pool error:', err);
});

/** Schema — Postgres dialect. Created on first run via initDb(). */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT,
  role TEXT NOT NULL DEFAULT 'EDITOR',
  "createdAt" TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  "coverImage" TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  "readingTime" INTEGER NOT NULL DEFAULT 1,
  views INTEGER NOT NULL DEFAULT 0,
  "metaTitle" TEXT,
  "metaDescription" TEXT,
  "ogImage" TEXT,
  "canonicalUrl" TEXT,
  "publishedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL,
  "authorId" TEXT REFERENCES users(id),
  "categoryId" TEXT REFERENCES categories(id)
);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status, "publishedAt");
CREATE INDEX IF NOT EXISTS idx_posts_featured ON posts(featured);

CREATE TABLE IF NOT EXISTS tags_on_posts (
  "postId" TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  "tagId" TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY ("postId", "tagId")
);

CREATE TABLE IF NOT EXISTS subscribers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  source TEXT,
  "confirmedAt" TIMESTAMPTZ,
  "unsubToken" TEXT UNIQUE NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(status);

CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  handled BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS seo_pages (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  "ogImage" TEXT NOT NULL DEFAULT '',
  "updatedAt" TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS faq_categories (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS faq_items (
  id TEXT PRIMARY KEY,
  "categoryId" TEXT NOT NULL REFERENCES faq_categories(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS faq_items_category_idx ON faq_items("categoryId");

CREATE TABLE IF NOT EXISTS content_blocks (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  "updatedAt" TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  popular BOOLEAN NOT NULL DEFAULT FALSE,
  platforms JSONB NOT NULL DEFAULT '[]'::jsonb,
  sizes JSONB NOT NULL DEFAULT '[]'::jsonb,
  prices JSONB NOT NULL DEFAULT '{}'::jsonb,
  rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  addons JSONB NOT NULL DEFAULT '[]'::jsonb,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS programs_category_idx ON programs(category);
CREATE INDEX IF NOT EXISTS programs_order_idx ON programs("order");

CREATE TABLE IF NOT EXISTS chat_sessions (
  id TEXT PRIMARY KEY,
  "visitorId" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL,
  "lastMessageAt" TIMESTAMPTZ NOT NULL,
  flagged BOOLEAN NOT NULL DEFAULT FALSE,
  exemplar BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS chat_sessions_visitor_idx ON chat_sessions("visitorId");
CREATE INDEX IF NOT EXISTS chat_sessions_last_message_idx ON chat_sessions("lastMessageAt" DESC);

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  "sessionId" TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  "tokensIn" INTEGER NOT NULL DEFAULT 0,
  "tokensOut" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS chat_messages_session_idx ON chat_messages("sessionId", "createdAt" ASC);

CREATE TABLE IF NOT EXISTS chat_usage (
  "yearMonth" TEXT PRIMARY KEY,
  "tokensIn" BIGINT NOT NULL DEFAULT 0,
  "tokensOut" BIGINT NOT NULL DEFAULT 0,
  "messageCount" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_rate_limit (
  id BIGSERIAL PRIMARY KEY,
  "ipAddress" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS chat_rate_limit_ip_idx ON chat_rate_limit("ipAddress", "createdAt" DESC);

CREATE TABLE IF NOT EXISTS chat_restrictions (
  id TEXT PRIMARY KEY,
  pattern TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  "isRegex" BOOLEAN NOT NULL DEFAULT FALSE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS chat_restrictions_enabled_idx ON chat_restrictions(enabled);
`;

/**
 * Convert SQLite-style `?` placeholders to Postgres `$1, $2, ...`.
 * Lets the service layer keep writing portable `?` SQL.
 */
function toPgParams(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

/** Initialise the database — creates tables if they do not exist. */
export async function initDb() {
  await pool.query(SCHEMA);
  return pool;
}

/** Run a query returning all rows. */
export async function all(sql, params = []) {
  const res = await pool.query(toPgParams(sql), params);
  return res.rows;
}

/** Run a query returning the first row (or null). */
export async function get(sql, params = []) {
  const res = await pool.query(toPgParams(sql), params);
  return res.rows[0] || null;
}

/** Run a write statement. */
export async function run(sql, params = []) {
  const result = await pool.query(toPgParams(sql), params);
  // Return rowCount so callers can check if any rows were affected
  // (relevant for DELETE / UPDATE statements).
  return result.rowCount;
}

/**
 * Run a set of statements inside a transaction.
 * The callback receives a scoped { all, get, run } bound to one client.
 */
export async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const scoped = {
      all: async (sql, params = []) => (await client.query(toPgParams(sql), params)).rows,
      get: async (sql, params = []) => {
        const r = await client.query(toPgParams(sql), params);
        return r.rows[0] || null;
      },
      run: async (sql, params = []) => {
        await client.query(toPgParams(sql), params);
      },
    };
    const result = await fn(scoped);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

/** Close the pool (graceful shutdown). */
export async function closeDb() {
  await pool.end();
}
