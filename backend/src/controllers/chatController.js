import * as chatService from '../services/chatService.js';
import { asyncHandler } from '../lib/helpers.js';

// ---- Public ----

export const sendMessage = asyncHandler(async (req, res) => {
  const ipAddress =
    (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    null;
  const userAgent = req.headers['user-agent'] || '';
  const { sessionId, visitorId, message } = req.body || {};
  const result = await chatService.chat({
    sessionId,
    visitorId,
    message,
    ipAddress,
    userAgent,
  });
  res.json({ data: result });
});

// ---- Admin ----

export const listSessions = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  res.json({ data: await chatService.adminListSessions({ limit, offset }) });
});

export const getSession = asyncHandler(async (req, res) => {
  res.json({ data: await chatService.adminGetSession(req.params.id) });
});

export const setFlags = asyncHandler(async (req, res) => {
  res.json({
    data: await chatService.adminSetFlags(req.params.id, req.body || {}),
    message: 'Updated.',
  });
});

export const deleteSession = asyncHandler(async (req, res) => {
  await chatService.adminDeleteSession(req.params.id);
  res.json({ message: 'Deleted.' });
});

export const usage = asyncHandler(async (_req, res) => {
  res.json({ data: await chatService.adminUsageThisMonth() });
});
