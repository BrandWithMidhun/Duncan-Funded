import * as seoService from '../services/seoService.js';
import { asyncHandler, ApiError } from '../lib/helpers.js';

/** GET /api/seo/:slug — public, used by frontend generateMetadata(). */
export const getSeoPage = asyncHandler(async (req, res) => {
  const page = await seoService.getSeoPage(req.params.slug);
  if (!page) throw new ApiError(404, 'Page not found');
  res.json({ data: page });
});

/** GET /api/admin/seo — list all pages with current content (admin). */
export const listSeoPages = asyncHandler(async (_req, res) => {
  res.json({ data: await seoService.listSeoPages() });
});

/** PUT /api/admin/seo/:slug — update a page's SEO (admin). */
export const updateSeoPage = asyncHandler(async (req, res) => {
  const page = await seoService.updateSeoPage(req.params.slug, req.body || {});
  res.json({ message: 'SEO updated.', data: page });
});
