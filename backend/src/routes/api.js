import { Router } from 'express';
import { requireAuth } from '../middleware/index.js';
import * as posts from '../controllers/postController.js';
import * as misc from '../controllers/miscController.js';
import * as auth from '../controllers/authController.js';
import * as settings from '../controllers/settingsController.js';
import * as seo from '../controllers/seoController.js';
import * as faq from '../controllers/faqController.js';
import * as content from '../controllers/contentController.js';
import * as programs from '../controllers/programController.js';
import * as search from '../controllers/searchController.js';
import * as chat from '../controllers/chatController.js';
import * as restrictions from '../controllers/chatRestrictionController.js';
import * as audit from '../controllers/auditController.js';
import * as analytics from '../controllers/analyticsController.js';
import { auditMiddleware } from '../services/auditService.js';
import { getPublishedSlugs } from '../services/postService.js';

const router = Router();

// Mount audit middleware once — it only writes a row for authenticated
// admin write requests (POST/PUT/PATCH/DELETE under /admin/*), so
// applying it router-wide is cheap and safe.
router.use(auditMiddleware());

// ---- Health ----
router.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ---- Site-wide search ----
router.get('/search', search.search);

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

// ---- Content blocks ----
router.get('/content', content.getContent);
router.get('/admin/content', requireAuth, content.adminList);
router.put('/admin/content', requireAuth, content.adminUpdate);

// ---- Programs ----
router.get('/programs', programs.listPublic);
router.get('/admin/programs', requireAuth, programs.adminList);
router.get('/admin/programs/:id', requireAuth, programs.adminGet);
router.post('/admin/programs', requireAuth, programs.adminCreate);
router.put('/admin/programs/:id', requireAuth, programs.adminUpdate);
router.delete('/admin/programs/:id', requireAuth, programs.adminDelete);

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

// ---- Chatbot ----
router.post('/chat', chat.sendMessage);
router.get('/admin/chats', requireAuth, chat.listSessions);
router.get('/admin/chats/usage', requireAuth, chat.usage);
router.get('/admin/chats/:id', requireAuth, chat.getSession);
router.put('/admin/chats/:id/flags', requireAuth, chat.setFlags);
router.delete('/admin/chats/:id', requireAuth, chat.deleteSession);

// ---- Chat restrictions (admin-editable filter words) ----
router.get('/admin/chat-restrictions', requireAuth, restrictions.listAll);
router.post('/admin/chat-restrictions', requireAuth, restrictions.create);
router.put('/admin/chat-restrictions/:id', requireAuth, restrictions.update);
router.delete('/admin/chat-restrictions/:id', requireAuth, restrictions.remove);

// ---- Admin audit log + login attempts ----
router.get('/admin/audit', requireAuth, audit.list);
router.get('/admin/audit/login-attempts', requireAuth, audit.recentLoginAttempts);

// ---- Analytics (public ingestion + admin views) ----
router.post('/analytics/pageview', analytics.trackPageview);
router.post('/analytics/event', analytics.trackEvent);
router.get('/admin/analytics/summary', requireAuth, analytics.summary);
router.get('/admin/analytics/timeseries', requireAuth, analytics.timeseries);
router.get('/admin/analytics/top-pages', requireAuth, analytics.topPages);
router.get('/admin/analytics/referrers', requireAuth, analytics.referrers);
router.get('/admin/analytics/devices', requireAuth, analytics.devices);
router.get('/admin/analytics/countries', requireAuth, analytics.countries);
router.get('/admin/analytics/events', requireAuth, analytics.events);
router.get('/admin/analytics/recent', requireAuth, analytics.recent);
router.get('/admin/analytics/internal', requireAuth, analytics.internal);
router.get('/admin/analytics/journeys', requireAuth, analytics.journeys);
router.get('/admin/analytics/event-attribution', requireAuth, analytics.eventAttribution);
router.get('/admin/analytics/top-paths', requireAuth, analytics.topPaths);

export default router;
