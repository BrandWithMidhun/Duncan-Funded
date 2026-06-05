import * as searchService from '../services/searchService.js';
import { asyncHandler } from '../lib/helpers.js';

export const search = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').toString();
  const result = await searchService.search(q);
  res.json({ data: result });
});
