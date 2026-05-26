import * as authService from '../services/authService.js';
import { asyncHandler } from '../lib/helpers.js';
import { loginSchema, validate } from '../lib/validation.js';

/** POST /api/auth/login — exchange email + password for a JWT. */
export const login = asyncHandler(async (req, res) => {
  const input = validate(loginSchema, req.body);
  const result = await authService.login(input.email, input.password);
  res.json({
    message: 'Signed in successfully.',
    token: result.token,
    user: result.user,
  });
});

/** GET /api/auth/me — return the current authenticated user. */
export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});
