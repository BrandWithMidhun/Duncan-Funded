# Duncan Funded — Dynamic Website

A dynamic, SEO-friendly website for **Duncan Funded**, a proprietary trading firm.
The original design (a Lovable-built single-page React app) has been migrated into a
production architecture: a **Next.js 16** SEO frontend and a **Node.js / Express**
backend that powers the blog and newsletter, with a clear path to a full CMS.

```
duncan-funded/
├── backend/      Node.js + Express API (blogs, newsletter, contact)
└── frontend/     Next.js 16 App Router site (SSR/SSG, full SEO)
```

---

## Why this architecture

| Requirement | How it is met |
|---|---|
| Same design & assets as the original | Design tokens, fonts (Cinzel / Cormorant / Raleway), the trading-candle canvas, tartan textures, and the original crest / hero images are ported 1:1 from the source project. |
| Same content as duncanfunded.com | All page copy — Hero, Programs, How It Works, Why Duncan, FAQ, About, Trade Zone, Contact — is reproduced from the source. |
| Backend for blogs & newsletter | Express API with full blog CRUD, newsletter subscribe/unsubscribe, and a contact endpoint. |
| SEO-friendly blogs | Blog pages are server-rendered / statically generated. Each post emits per-page `<title>`, meta description, canonical URL, OpenGraph + Twitter tags, and JSON-LD `BlogPosting` + `BreadcrumbList` structured data. A dynamic `sitemap.xml` and `robots.txt` are generated. |
| Dynamic & best-practice | ISR (incremental static regeneration) keeps blog content fresh; security middleware (helmet, CORS, rate limiting) and input validation (Zod) protect the API. |
| Node.js backend, CMS-ready | The backend is plain Node.js + Express with a clean service/repository layer. A `users` table and API-key auth are already in place as the foundation for Phase 2 (full CMS with an admin UI). |

### The database

The backend uses **PostgreSQL**. Locally you run your own Postgres instance;
in production (Railway) a managed Postgres database is attached to the service
and the connection string is injected automatically.

The data-access layer is isolated in `backend/src/lib/db.js` — a thin wrapper
over the `pg` driver. The schema is created automatically on first start, so
there is no separate migration step for Phase 1; `npm run seed` then loads the
sample blog content.

---

## Prerequisites

- **Node.js 18+** (developed and tested on Node 22)
- npm

---

## Quick start

Open two terminals.

### 1. Backend

Requires a local PostgreSQL database. Create one (e.g. `createdb duncan_funded`),
then:

```bash
cd backend
cp .env.example .env        # set DATABASE_URL + a strong ADMIN_API_KEY
npm install
npm run seed                # creates the schema + loads 6 sample blog posts
npm run dev                 # API on http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local  # points at the backend (defaults are fine for local)
npm install
npm run dev                 # site on http://localhost:3000
```

Visit **http://localhost:3000** — and **http://localhost:3000/blog** for the blog.

### Production build

```bash
# backend
cd backend && npm start

# frontend (backend must be running so blog pages can be generated)
cd frontend && npm run build && npm start
```

---

## Backend API

Base URL: `http://localhost:4000`

### Public endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/posts` | List published posts. Query: `page`, `limit`, `category`, `tag`, `search`, `featured` |
| `GET` | `/api/posts/:slug` | Single post (`?view=true` increments the view count) |
| `GET` | `/api/categories` | Categories with post counts |
| `GET` | `/api/tags` | All tags |
| `GET` | `/api/sitemap-data` | Published slugs + timestamps (consumed by the frontend sitemap) |
| `POST` | `/api/newsletter/subscribe` | Body: `{ email, source? }` |
| `GET` | `/api/newsletter/unsubscribe/:token` | Unsubscribe via emailed token |
| `POST` | `/api/contact` | Body: `{ name, email, message }` |

### Admin endpoints (require `x-api-key` header)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/posts` | List posts of any status (drafts included) |
| `POST` | `/api/admin/posts` | Create a post |
| `PUT` | `/api/admin/posts/:id` | Update a post |
| `DELETE` | `/api/admin/posts/:id` | Delete a post |
| `GET` | `/api/admin/subscribers` | List newsletter subscribers |
| `GET` | `/api/admin/messages` | List contact submissions |

Example — create a post:

```bash
curl -X POST http://localhost:4000/api/admin/posts \
  -H "Content-Type: application/json" \
  -H "x-api-key: change-me-to-a-long-random-string" \
  -d '{
    "title": "My New Post",
    "excerpt": "A short summary used in listings and meta tags.",
    "content": "## Heading\n\nMarkdown body of the article.",
    "categoryName": "Strategy",
    "tags": ["forex", "tips"],
    "status": "PUBLISHED"
  }'
```

Newsletter signups are created through the footer form on every page and the
`POST /api/newsletter/subscribe` endpoint.

---

## SEO features

- **Server-side rendering / static generation** — every blog post is prerendered
  to static HTML at build time, then kept fresh with ISR.
- **Per-page metadata** — unique title, description, canonical URL, OpenGraph and
  Twitter Card tags for every route, driven by the post's own SEO fields.
- **Structured data (JSON-LD)** — `Organization` and `WebSite` site-wide;
  `BlogPosting`, `BreadcrumbList` on posts; `FAQPage` on the FAQ and homepage.
- **`sitemap.xml`** — generated dynamically at `/sitemap.xml`, including every
  published post with its last-modified date.
- **`robots.txt`** — generated at `/robots.txt`, referencing the sitemap.
- **Semantic HTML & accessibility** — one `<h1>` per page, labelled form inputs,
  descriptive `alt` text.

---

## Environment variables

### `backend/.env`

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `4000` | API port |
| `NODE_ENV` | `development` | Environment |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated allowed origins |
| `SITE_URL` | `http://localhost:3000` | Public site URL (unsubscribe links) |
| `ADMIN_API_KEY` | — | Key protecting admin endpoints — **change this** |

### `frontend/.env.local`

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Backend base URL |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Public site URL (canonical, sitemap, OG) |

---

## Roadmap — Phase 2: full CMS

The backend is intentionally structured so the next phase drops in cleanly:

1. **Authentication** — replace the `x-api-key` guard with JWT sessions for the
   existing `users` table (`ADMIN` / `EDITOR` roles already modelled).
2. **Admin UI** — an authenticated dashboard for posts, categories, subscribers,
   and contact messages.
3. **Rich editing** — a markdown / WYSIWYG editor plus image uploads
   (e.g. to S3 / Cloudflare R2).
4. **Database migrations** — introduce a migration tool (e.g. `node-pg-migrate`)
   so schema changes are versioned rather than applied on boot.
5. **Newsletter delivery** — connect an email provider (e.g. Resend, SES) to send
   campaigns to subscribers, with double opt-in confirmation.

PostgreSQL is already in place from Phase 1, so the CMS work builds directly on
the existing schema and service layer — no data-layer rewrite is needed.

## Deployment

See **`DEPLOY_RAILWAY.md`** for a complete, step-by-step guide to deploying both
services and a managed PostgreSQL database on Railway.

---

## Tech stack

**Backend:** Node.js, Express, PostgreSQL (pg), Zod, Helmet, CORS,
express-rate-limit, Morgan.

**Frontend:** Next.js 16 (App Router), React 18, Tailwind CSS, Framer Motion,
react-markdown.

---

## License

Proprietary — © Duncan Funded. All rights reserved.
