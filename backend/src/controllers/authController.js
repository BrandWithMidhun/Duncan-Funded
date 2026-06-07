import * as authService from '../services/authService.js';
import * as loginGuard from '../services/loginGuardService.js';
import { asyncHandler, ApiError } from '../lib/helpers.js';
import { loginSchema, validate } from '../lib/validation.js';

/** Extract the client IP, honouring trusted proxy headers. */
function clientIp(req) {
  const fwd = (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim();
  return fwd || req.socket?.remoteAddress || null;
}

/** POST /api/auth/login — exchange email + password for a JWT.
 *  Wrapped in brute-force protection: IP rate limit + per-email lockout. */
export const login = asyncHandler(async (req, res) => {
  const input = validate(loginSchema, req.body);
  const ipAddress = clientIp(req);

  // Guard runs BEFORE password check so an attacker can't tell whether
  // their guess was right via timing or response shape.
  await loginGuard.ensureLoginAllowed({ email: input.email, ipAddress });

  try {
    const result = await authService.login(input.email, input.password);
    await loginGuard.recordAttempt({
      email: input.email,
      ipAddress,
      success: true,
      reason: 'ok',
    });
    res.json({
      message: 'Signed in successfully.',
      token: result.token,
      user: result.user,
    });
  } catch (err) {
    // Log every failure with a generic reason — never expose whether
    // the email existed or whether the password was wrong specifically.
    await loginGuard.recordAttempt({
      email: input.email,
      ipAddress,
      success: false,
      reason: err instanceof ApiError ? `${err.status}` : 'error',
    });
    throw err;
  }
});

/** GET /api/auth/me — return the current authenticated user. */
export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});
