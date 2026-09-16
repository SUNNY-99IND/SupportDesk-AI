# Deployment

> **Not deployed yet.** This is the Phase 20 plan. It is written down now because a few decisions
> (environment variables, CORS, the API base URL) are easier to get right from the start than to
> retrofit. Nothing here has been executed or verified.

## Target topology

```text
Browser
   │
   ├── React build (static files)   -> static host: Vercel / Netlify / Cloudflare Pages
   │
   └── HTTPS /api/*                 -> Node host: Render / Railway / Fly.io
                                          │
                                          ├── PostgreSQL  -> Neon / Supabase / RDS
                                          ├── MongoDB     -> MongoDB Atlas
                                          └── Anthropic API
```

## Build commands

| App      | Build                | Output       | Start                |
| -------- | -------------------- | ------------ | -------------------- |
| Backend  | `npm ci && npm run build` | `dist/`  | `npm start`          |
| Frontend | `npm ci && npm run build` | `dist/`  | served as static files |

The frontend build produces plain static assets — there is no Node process in production for it.

## Environment variables in production

Set these in the host's dashboard or secret manager. Never in a committed file.

Backend:

```text
NODE_ENV=production
PORT=<usually injected by the host>
CORS_ORIGIN=https://<frontend-domain>
POSTGRES_URL=<connection string, TLS required>
MONGO_URL=<connection string, TLS required>
JWT_SECRET=<48+ random bytes, unique per environment>
ANTHROPIC_API_KEY=<server-side only>
```

Frontend (build-time, and public — these end up in the bundle):

```text
VITE_API_BASE_URL=https://<api-domain>
```

Two things that reliably break on first deploy: `CORS_ORIGIN` still pointing at `localhost:5173`, and
`VITE_API_BASE_URL` left empty so the built app requests `/api` from the static host, which has no
API. Check both.

## Single-page app routing

The frontend uses client-side routing, so the static host must serve `index.html` for any unmatched
path. Otherwise a page refresh on a nested route returns the host's own 404 instead of the app.
Netlify/Vercel/Cloudflare all express this as a rewrite of `/*` to `/index.html`.

## Pre-deploy checklist

- [ ] `npm run build` passes for both apps locally
- [ ] CI is green on the branch being deployed
- [ ] No `.env` file is tracked by git (`git ls-files | grep -E '\.env$'` returns nothing)
- [ ] Production secrets are distinct from development ones — never reuse a `JWT_SECRET`
- [ ] Database connection strings use TLS
- [ ] `CORS_ORIGIN` names the real frontend domain
- [ ] Rate limiting is enabled (Phase 18)
- [ ] SPA rewrite is configured on the static host
- [ ] `GET /api/health` answers over HTTPS on the deployed API

## Rollback

Both a static host and a Node host keep previous builds. If a deploy misbehaves, promote the previous
release rather than debugging in production. Database migrations are the exception — they need a
forward fix, which is a good reason to keep each migration small and additive.
