import { Router } from 'express';
import { requireAdmin } from '../middleware/index.js';
import * as posts from '../controllers/postController.js';
import * as misc from '../controllers/miscController.js';
import { getPublishedSlugs } from '../services/postService.js';

const router = Router();

// ---- Health ----
router.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ---- Blog (public, read-only) ----
router.get('/posts', posts.getPosts);
router.get('/posts/:slug', posts.getPost);
router.get('/categories', posts.getCategories);
router.get('/tags', posts.getTags);

// ---- Blog (admin, write — protected by x-api-key) ----
router.get('/admin/posts', requireAdmin, posts.adminGetPosts);
router.post('/admin/posts', requireAdmin, posts.createPost);
router.put('/admin/posts/:id', requireAdmin, posts.updatePost);
router.delete('/admin/posts/:id', requireAdmin, posts.deletePost);

// ---- Newsletter ----
router.post('/newsletter/subscribe', misc.subscribe);
router.get('/newsletter/unsubscribe/:token', misc.unsubscribe);
router.get('/admin/subscribers', requireAdmin, misc.listSubscribers);

// ---- Contact ----
router.post('/contact', misc.submitContact);
router.get('/admin/messages', requireAdmin, misc.listMessages);

// ---- SEO: sitemap data feed (frontend builds the XML) ----
router.get('/sitemap-data', (_req, res, next) => {
  try {
    res.json({ posts: getPublishedSlugs() });
  } catch (e) {
    next(e);
  }
});

export default router;
