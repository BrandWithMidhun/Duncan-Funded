import { Router } from 'express';
import { requireAuth } from '../middleware/index.js';
import * as posts from '../controllers/postController.js';
import * as misc from '../controllers/miscController.js';
import * as auth from '../controllers/authController.js';
import * as settings from '../controllers/settingsController.js';
import * as seo from '../controllers/seoController.js';
import * as faq from '../controllers/faqController.js';
import { getPublishedSlugs } from '../services/postService.js';

const router = Router();

// ---- Health ----
router.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ---- Auth ----
router.post('/auth/login', auth.login);
router.get('/auth/me', requireAuth, auth.me);

// ---- Site settings ----
router.get('/settings', settings.getSettings);
router.put('/admin/settings', requireAuth, settings.updateSettings);

// ---- Per-page SEO ----
router.get('/seo/:slug', seo.getSeoPage);
router.get('/admin/seo', requireAuth, seo.listSeoPages);
router.put('/admin/seo/:slug', requireAuth, seo.updateSeoPage);

// ---- FAQ ----
router.get('/faq', faq.listPublic);
router.get('/admin/faq', requireAuth, faq.adminList);
router.post('/admin/faq/categories', requireAuth, faq.createCategory);
router.put('/admin/faq/categories/:id', requireAuth, faq.updateCategory);
router.delete('/admin/faq/categories/:id', requireAuth, faq.deleteCategory);
router.post('/admin/faq/items', requireAuth, faq.createItem);
router.put('/admin/faq/items/:id', requireAuth, faq.updateItem);
router.delete('/admin/faq/items/:id', requireAuth, faq.deleteItem);

// ---- Blog (public, read-only) ----
router.get('/posts', posts.getPosts);
router.get('/posts/:slug', posts.getPost);
router.get('/categories', posts.getCategories);
router.get('/tags', posts.getTags);

// ---- Blog (admin, write — protected by JWT) ----
router.get('/admin/posts', requireAuth, posts.adminGetPosts);
router.post('/admin/posts', requireAuth, posts.createPost);
router.put('/admin/posts/:id', requireAuth, posts.updatePost);
router.delete('/admin/posts/:id', requireAuth, posts.deletePost);

// ---- Newsletter ----
router.post('/newsletter/subscribe', misc.subscribe);
router.get('/newsletter/unsubscribe/:token', misc.unsubscribe);
router.get('/admin/subscribers', requireAuth, misc.listSubscribers);

// ---- Contact ----
router.post('/contact', misc.submitContact);
router.get('/admin/messages', requireAuth, misc.listMessages);

// ---- SEO: sitemap data feed (frontend builds the XML) ----
router.get('/sitemap-data', async (_req, res, next) => {
  try {
    res.json({ posts: await getPublishedSlugs() });
  } catch (e) {
    next(e);
  }
});

export default router;
