import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '../../data/duncan.db');

let db = null;
let SQL = null;
let saveTimer = null;

/** SQLite schema — mirrors the original Prisma model design. */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT,
  role TEXT NOT NULL DEFAULT 'EDITOR',
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  coverImage TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  featured INTEGER NOT NULL DEFAULT 0,
  readingTime INTEGER NOT NULL DEFAULT 1,
  views INTEGER NOT NULL DEFAULT 0,
  metaTitle TEXT,
  metaDescription TEXT,
  ogImage TEXT,
  canonicalUrl TEXT,
  publishedAt TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  authorId TEXT REFERENCES users(id),
  categoryId TEXT REFERENCES categories(id)
);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status, publishedAt);
CREATE INDEX IF NOT EXISTS idx_posts_featured ON posts(featured);

CREATE TABLE IF NOT EXISTS tags_on_posts (
  postId TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tagId TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (postId, tagId)
);

CREATE TABLE IF NOT EXISTS subscribers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  source TEXT,
  confirmedAt TEXT,
  unsubToken TEXT UNIQUE NOT NULL,
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(status);

CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  handled INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL
);
`;

/** Initialise the database — loads the file from disk if it exists. */
export async function initDb() {
  if (db) return db;
  SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  db.run('PRAGMA foreign_keys = ON;');
  db.run(SCHEMA);
  persist();
  return db;
}

/** Persist the in-memory database to disk (debounced to coalesce writes). */
export function persist() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (!db) return;
    const data = Buffer.from(db.export());
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, data);
  }, 50);
}

/** Persist synchronously (used by the seed script before exit). */
export function persistNow() {
  if (saveTimer) clearTimeout(saveTimer);
  if (!db) return;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

/** Run a query returning all rows as plain objects. */
export function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

/** Run a query returning the first row (or null). */
export function get(sql, params = []) {
  const rows = all(sql, params);
  return rows[0] || null;
}

/** Run a write statement and persist. */
export function run(sql, params = []) {
  db.run(sql, params);
  persist();
}

/** Run multiple statements inside a transaction. */
export function tx(fn) {
  db.run('BEGIN');
  try {
    fn();
    db.run('COMMIT');
    persist();
  } catch (e) {
    db.run('ROLLBACK');
    throw e;
  }
}

export { DB_PATH };
