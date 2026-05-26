import { Router } from 'express';
import { requireAuth } from '../middleware/index.js';
import * as posts from '../controllers/postController.js';
import * as misc from '../controllers/miscController.js';
import * as auth from '../controllers/authController.js';
import { getPublishedSlugs } from '../services/postService.js';

const router = Router();

// ---- Health ----
router.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ---- Auth ----
router.post('/auth/login', auth.login);
router.get('/auth/me', requireAuth, auth.me);

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
