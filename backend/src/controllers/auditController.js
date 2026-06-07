import * as auditService from '../services/auditService.js';
import * as loginGuard from '../services/loginGuardService.js';
import { asyncHandler } from '../lib/helpers.js';

export const list = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  res.json({ data: await auditService.listEntries({ limit, offset }) });
});

export const recentLoginAttempts = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
  res.json({ data: await loginGuard.listRecentAttempts(limit) });
});
