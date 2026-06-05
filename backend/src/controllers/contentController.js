import * as contentService from '../services/contentService.js';
import { asyncHandler } from '../lib/helpers.js';

export const getContent = asyncHandler(async (_req, res) => {
  res.json({ data: await contentService.getAllContent() });
});

export const adminList = asyncHandler(async (_req, res) => {
  res.json({ data: await contentService.adminListSections() });
});

export const adminUpdate = asyncHandler(async (req, res) => {
  const result = await contentService.updateMany(req.body || {});
  res.json({ message: 'Content updated.', data: result });
});
