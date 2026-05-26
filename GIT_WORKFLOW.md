# Git Workflow

Step-by-step git setup for the Duncan Funded project.

## 1. Initialise the repository

From the project root (`duncan-funded/`):

```bash
git init
git branch -M main
```

A root `.gitignore` is already in place — it excludes `node_modules/`,
build output (`.next/`), environment files, the generated SQLite database, and
log files.

## 2. First commit

```bash
git add .
git status            # review what will be committed
git commit -m "Initial commit: Duncan Funded site (Next.js frontend + Node.js backend)"
```

The SQLite database (`backend/data/duncan.db`) is intentionally **not**
committed — it is generated locally with `cd backend && npm run seed`.

## 3. Connect a remote

Create an empty repository on your git host (GitHub, GitLab, etc.), then:

```bash
git remote add origin <your-repository-url>
git push -u origin main
```

## 4. Suggested branch model

```
main          production-ready code
develop       integration branch
feature/*     one branch per feature, e.g. feature/cms-auth
```

Feature workflow:

```bash
git checkout -b feature/blog-search develop
# ... make changes ...
git add .
git commit -m "Add full-text blog search"
git push -u origin feature/blog-search
# open a pull request into develop
```

## 5. Commit message convention

A lightweight Conventional Commits style keeps history readable:

```
feat:     a new feature
fix:      a bug fix
docs:     documentation only
style:    formatting, no code change
refactor: code change that neither fixes a bug nor adds a feature
chore:    build process, tooling, dependencies
```

Examples:

```bash
git commit -m "feat: add newsletter double opt-in confirmation"
git commit -m "fix: correct canonical URL on paginated blog pages"
git commit -m "chore: bump Next.js to latest patch"
```

## 6. Recommended `.gitignore` checks before pushing

Confirm these are **never** committed:

- `node_modules/` in both `backend/` and `frontend/`
- `.env` and `.env.local` (contain the admin API key)
- `backend/data/*.db` (the local database)
- `frontend/.next/` (build output)

Verify with:

```bash
git status --ignored
```

## 7. Deployment notes

- **Frontend** (Next.js) deploys cleanly to Vercel or any Node host.
  Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SITE_URL` in the host's
  environment settings.
- **Backend** (Express) deploys to any Node host (Railway, Render, Fly.io, a VPS).
  Set `ADMIN_API_KEY`, `CORS_ORIGINS`, and `SITE_URL`. Run `npm run seed` once
  on first deploy, or migrate to PostgreSQL for the CMS phase.
- Never commit production secrets — use the host's environment variable store.
