import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { get, run } from '../lib/db.js';
import { ApiError, genId, now } from '../lib/helpers.js';

const JWT_EXPIRY = '7d';

/** The JWT secret — must be set in the environment. */
function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new ApiError(500, 'JWT_SECRET is not configured on the server');
  }
  return secret;
}

/** Hash a plaintext password. */
export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

/**
 * Authenticate an admin by email + password.
 * Returns { token, user } on success; throws 401 on failure.
 */
export async function login(email, password) {
  const normalized = String(email || '').trim().toLowerCase();
  const user = await get('SELECT * FROM users WHERE email = ?', [normalized]);

  // Generic message — do not reveal whether the email exists.
  if (!user || !user.password) {
    throw new ApiError(401, 'Invalid email or password');
  }
  const ok = await bcrypt.compare(String(password || ''), user.password);
  if (!ok) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (user.role !== 'ADMIN' && user.role !== 'EDITOR') {
    throw new ApiError(403, 'This account does not have admin access');
  }

  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    jwtSecret(),
    { expiresIn: JWT_EXPIRY },
  );

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}

/** Verify a JWT and return its payload, or throw 401. */
export function verifyToken(token) {
  try {
    return jwt.verify(token, jwtSecret());
  } catch {
    throw new ApiError(401, 'Invalid or expired session — please sign in again');
  }
}

/** Look up the current user from a verified token payload. */
export async function getUserById(id) {
  const user = await get('SELECT id, name, email, role FROM users WHERE id = ?', [id]);
  if (!user) throw new ApiError(401, 'Account no longer exists');
  return user;
}

/**
 * Create or update an admin account (used by the setup script).
 * Idempotent — re-running updates the password.
 */
export async function upsertAdmin({ email, password, name }) {
  const normalized = email.trim().toLowerCase();
  const hashed = await hashPassword(password);
  const existing = await get('SELECT id FROM users WHERE email = ?', [normalized]);

  if (existing) {
    await run('UPDATE users SET password = ?, name = ?, role = ? WHERE id = ?', [
      hashed,
      name,
      'ADMIN',
      existing.id,
    ]);
    return { id: existing.id, email: normalized, created: false };
  }

  const id = genId();
  await run(
    'INSERT INTO users (id, email, name, password, role, "createdAt") VALUES (?,?,?,?,?,?)',
    [id, normalized, name, hashed, 'ADMIN', now()],
  );
  return { id, email: normalized, created: true };
}
