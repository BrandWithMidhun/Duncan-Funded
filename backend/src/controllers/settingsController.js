import * as settingsService from '../services/settingsService.js';
import { asyncHandler } from '../lib/helpers.js';

/** GET /api/settings — public; frontend reads URLs, logo, and menu. */
export const getSettings = asyncHandler(async (_req, res) => {
  res.json({ data: await settingsService.getSettings() });
});

/** PUT /api/admin/settings — admin only; update site settings. */
export const updateSettings = asyncHandler(async (req, res) => {
  const data = await settingsService.updateSettings(req.body || {});
  res.json({ message: 'Settings updated.', data });
});
