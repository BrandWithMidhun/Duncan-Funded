# Deploying to Railway

A complete, step-by-step guide to deploying Duncan Funded on
[Railway](https://railway.app) — one PostgreSQL database and two services
(backend API + Next.js frontend) from a single GitHub repository.

---

## Overview

```
Railway Project: "duncan-funded"
├── Postgres            managed database  (Railway provides DATABASE_URL)
├── backend  service    root dir: backend/   →  public URL: api.<...>.railway.app
└── frontend service    root dir: frontend/  →  public URL: <...>.railway.app
```

The frontend talks to the backend over its public URL. The backend talks to
Postgres over Railway's private network.

---

## Before you start

You will need:

- A **GitHub account** with this project pushed to a repository
  (see `GIT_WORKFLOW.md`).
- A **Railway account** — sign up at railway.app (GitHub login is easiest).
- A strong **JWT secret** for signing admin sessions. Generate one and keep it handy:

  ```bash
  openssl rand -hex 32
  ```

- An **admin email and password** of your choosing — used to create the
  admin login account after deployment.

> Account creation and authorising Railway against your GitHub are steps only
> you can perform — they require your own credentials.

---

## Step 1 — Push the repo to GitHub

From the project root:

```bash
git add .
git commit -m "Configure for Railway deployment (PostgreSQL)"
git push origin main
```

If you have not created a remote yet, follow `GIT_WORKFLOW.md` first.

---

## Step 2 — Create the Railway project

1. Log in to Railway and click **New Project**.
2. Choose **Deploy from GitHub repo**.
3. Authorise Railway to access your GitHub account if prompted, then select the
   **duncan-funded** repository.

Railway may auto-create one service from the repo. That is fine — you will
configure it as the backend in Step 4, and add the frontend in Step 5.

---

## Step 3 — Add the PostgreSQL database

1. Inside the project, click **New** → **Database** → **Add PostgreSQL**.
2. Railway provisions a managed Postgres instance and exposes a `DATABASE_URL`
   variable on it. **You do not copy this manually** — Step 4 references it.

---

## Step 4 — Configure the backend service

Open the service that will be the backend (rename it to **backend** for clarity:
service → Settings → rename).

### 4a. Root directory

Settings → **Root Directory** → set to:

```
backend
```

This tells Railway to build and run only the `backend/` folder. The included
`backend/railway.json` supplies the build and start commands and a health check
on `/api/health`.

### 4b. Environment variables

Service → **Variables** → add the following:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` — reference the Postgres service |
| `JWT_SECRET` | the secret you generated with `openssl rand -hex 32` |
| `ADMIN_EMAIL` | the email you will log in to the admin panel with |
| `ADMIN_PASSWORD` | a strong admin password (min. 8 characters) |
| `ADMIN_NAME` | a display name for the admin (optional) |
| `CORS_ORIGINS` | the frontend's public URL (fill in after Step 5) |
| `SITE_URL` | the frontend's public URL (fill in after Step 5) |

For `DATABASE_URL`, use Railway's **variable reference** feature: type
`${{Postgres.DATABASE_URL}}` and Railway links it to the database service
automatically. (If you named the database service something other than
`Postgres`, use that name.)

Leave `CORS_ORIGINS` and `SITE_URL` blank for now — you will set them once the
frontend has a URL.

> `PORT` is provided by Railway automatically; the app reads it. Do not set it.
> SSL is enabled automatically because `NODE_ENV=production`.

### 4c. Generate a public domain

Service → Settings → **Networking** → **Generate Domain**.
Railway gives the backend a URL such as:

```
https://backend-production-xxxx.up.railway.app
```

Copy it — you need it for the frontend in Step 5.

### 4d. Deploy, seed the database, and create the admin

The backend will deploy automatically. The schema is created on first start.
Two one-time commands populate it — run them via the Railway CLI from inside
the `backend/` folder on your machine:

```bash
npm i -g @railway/cli
railway login
railway link                       # select the duncan-funded project

cd backend
npm install                        # local deps — railway run executes locally
railway run --service backend npm run seed         # 6 sample blog posts
railway run --service backend npm run setup:admin  # creates the admin login
```

`railway run` executes the command on your machine but with the service's
environment variables injected (including `DATABASE_URL`, `ADMIN_EMAIL`,
`ADMIN_PASSWORD`), so both commands act on the production database.

After `setup:admin` succeeds, you can sign in to the admin panel at
`https://<frontend-url>/admin/login` using the `ADMIN_EMAIL` /
`ADMIN_PASSWORD` you configured.

You can confirm the API is live by visiting:

```
https://<backend-url>/api/health      → {"status":"ok",...}
https://<backend-url>/api/posts        → the seeded posts
```

---

## Step 5 — Configure the frontend service

Add the second service: project → **New** → **GitHub Repo** → select the same
**duncan-funded** repository again. Rename this service to **frontend**.

### 5a. Root directory

Settings → **Root Directory** → set to:

```
frontend
```

The included `frontend/railway.json` supplies the build (`npm run build`) and
start (`npm start`) commands.

### 5b. Environment variables

Service → **Variables** → add:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | the backend's public URL from Step 4c |
| `NEXT_PUBLIC_SITE_URL` | the frontend's own public URL (Step 5c) |

`NEXT_PUBLIC_*` variables are read at **build time**, so the frontend must be
rebuilt if you change them (Railway redeploys on a variable change).

### 5c. Generate a public domain

Settings → **Networking** → **Generate Domain**. Railway gives the frontend a
URL such as:

```
https://frontend-production-yyyy.up.railway.app
```

Set `NEXT_PUBLIC_SITE_URL` to this value.

---

## Step 6 — Connect the two services

Now that both URLs exist, finish the cross-references:

1. **Backend** service → Variables:
   - `CORS_ORIGINS` → the frontend URL (Step 5c)
   - `SITE_URL` → the frontend URL (Step 5c)
2. **Frontend** service → Variables:
   - `NEXT_PUBLIC_API_URL` → the backend URL (Step 4c)
   - `NEXT_PUBLIC_SITE_URL` → the frontend URL (Step 5c)

Each variable change triggers an automatic redeploy. Wait for both services to
finish deploying.

---

## Step 7 — Verify

Visit the frontend URL:

- `https://<frontend-url>/` — homepage loads with the trading theme
- `https://<frontend-url>/blog` — the 6 seeded posts appear
- `https://<frontend-url>/blog/<a-post-slug>` — a post renders fully
- `https://<frontend-url>/sitemap.xml` — lists all pages including posts
- `https://<frontend-url>/robots.txt` — references the sitemap

Test the forms:

- Submit the **newsletter** form in the footer.
- Submit the **contact** form on `/contact`.

Confirm they were stored by signing in to the admin panel at
`https://<frontend-url>/admin/login` and opening the **Subscribers** and
**Messages** pages.

---

## Custom domain (optional)

To use `duncanfunded.com` instead of the `.railway.app` URLs:

1. **Frontend** service → Settings → Networking → **Custom Domain** → enter your
   domain. Railway shows a CNAME record to add at your DNS provider.
2. After DNS propagates, update the environment variables to the custom domain:
   - Frontend: `NEXT_PUBLIC_SITE_URL`
   - Backend: `CORS_ORIGINS`, `SITE_URL`
3. Optionally give the backend its own subdomain (e.g. `api.duncanfunded.com`)
   the same way, and update `NEXT_PUBLIC_API_URL`.

---

## Ongoing deployments

Railway redeploys automatically on every push to the `main` branch. A typical
update:

```bash
git add .
git commit -m "feat: add new blog post management endpoint"
git push origin main
```

Both services rebuild and redeploy. Use a `develop` branch and pull requests
(see `GIT_WORKFLOW.md`) to keep `main` always deployable.

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Backend crash-loops on deploy | `DATABASE_URL` not set or not referencing the Postgres service. Check the backend's Variables. |
| Blog pages empty on the live site | The database was never seeded — run `railway run --service backend npm run seed`. |
| Browser console shows CORS errors | `CORS_ORIGINS` on the backend does not exactly match the frontend URL (no trailing slash). |
| Frontend calls `localhost:4000` in production | `NEXT_PUBLIC_API_URL` was not set before the build. Set it, then redeploy the frontend. |
| `self-signed certificate` DB error | Ensure `NODE_ENV=production` on the backend so SSL is enabled. |
| Health check failing | The backend health check path is `/api/health`; confirm the service is the `backend/` root directory. |

---

## Cost note

Railway bills by usage. Two small services plus a Postgres database are
inexpensive for a low-traffic site, but there is no permanent free tier — review
Railway's current pricing. If you prefer, the frontend can instead be deployed to
Vercel (which has a usable free tier and is purpose-built for Next.js) while the
backend and database stay on Railway; only `NEXT_PUBLIC_API_URL` /
`NEXT_PUBLIC_SITE_URL` and the backend's `CORS_ORIGINS` need to point at the
right places.
