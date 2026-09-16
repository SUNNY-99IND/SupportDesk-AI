# SupportDesk AI

An AI-assisted customer support platform for small businesses. Customers raise tickets, agents
resolve them, and an AI assistant answers questions, classifies incoming requests, and drafts responses.

> **Status: Full-Stack Implementation Complete**
> All core PRD requirements (Authentication, RBAC, Ticket CRUD, PostgreSQL relational schema with SQL JOINs,
> MongoDB document store, AI classification & structured outputs, and React 19 client) are implemented and verified.

---

## Tech stack

| Layer      | Choice                                                            |
| ---------- | ----------------------------------------------------------------- |
| Frontend   | React 19, TypeScript, Tailwind CSS, React Router 7, Vite 6, Lucide|
| Backend    | Node.js 22, Express 4, TypeScript, Zod, JWT, Bcrypt               |
| Databases  | PostgreSQL 16 (relational), MongoDB 7 (documents) + Memory Store  |
| AI Layer   | LLM API (Structured Zod Outputs, Sentiment, Ticket Classification)|
| Tooling    | ESLint 9, Prettier 3, GitHub Actions                              |

---

## ⚡ 1-Click Demo Accounts (Fast Testing)

| Role | Email | Password | Permissions & Views |
| ---- | ----- | -------- | ------------------- |
| **Customer** | `customer@supportdesk.ai` | `Password123!` | Raise tickets, view my tickets, chat with AI Copilot |
| **Support Agent** | `agent@supportdesk.ai` | `Password123!` | View queue, manage assigned tickets, generate AI replies |
| **Admin** | `admin@supportdesk.ai` | `Password123!` | Manage users, change roles, view system telemetry & stats |

---

## Prerequisites

- **Node.js 20 or newer** (`node -v`) and npm
- **Docker Desktop** — only needed from Phase 2 onward, for the local databases

---

## Getting started

Two terminals, one for each app.

### 1. Backend

```bash
cd backend
cp .env.example .env      # then open .env and review the values
npm install
npm run dev
```

The API starts on <http://localhost:5000>.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app starts on <http://localhost:5173>. Open it in a browser — the setup check page should
report **Online**.

`frontend/.env` is optional in development; the defaults are correct as-is.

---

## Verifying the setup

```bash
curl -i http://localhost:5000/api/health
```

Expected — HTTP 200 with:

```json
{ "success": true, "message": "SupportDesk AI API is running" }
```

Two more checks worth running, because they prove the error paths work:

```bash
# Unknown route -> 404 in the standard failure envelope
curl -i http://localhost:5000/api/does-not-exist
# => { "success": false, "message": "Route GET /api/does-not-exist not found" }
```

In the browser, click **Check again** on the setup page. Then stop the backend
(`Ctrl+C`) and click it again — the card must switch to **Unreachable** with a readable message
rather than hanging or showing a blank screen.

---

## Available scripts

Run these inside `backend/` or `frontend/`.

| Script              | Does                                            |
| ------------------- | ----------------------------------------------- |
| `npm run dev`       | Start with hot reload                           |
| `npm run build`     | Type-check and produce a production build       |
| `npm start`         | Run the built backend (`backend/` only)         |
| `npm run typecheck` | Type-check without emitting files               |
| `npm run lint`      | ESLint                                          |
| `npm run format`    | Rewrite files with Prettier                     |

---

## Project structure

```text
SupportDesk/
├── backend/              Express REST API
│   └── src/
│       ├── config/       env loading and validation
│       ├── controllers/  HTTP in, HTTP out — thin
│       ├── middleware/   cross-cutting request handling
│       ├── models/       database models (Phase 2)
│       ├── routes/       URL to controller mapping
│       ├── services/     business logic (Phase 3+)
│       ├── utils/        shared helpers
│       ├── validators/   Zod request schemas (Phase 3+)
│       ├── app.ts        builds the Express app
│       └── server.ts     binds it to a port
│
├── frontend/             React single-page app
│   └── src/
│       ├── components/   reusable UI pieces
│       ├── pages/        one file per route
│       ├── layouts/      page chrome
│       ├── hooks/        custom React hooks
│       ├── services/     API calls
│       ├── types/        shared TypeScript types
│       ├── App.tsx       route table
│       └── main.tsx      browser entry point
│
├── docs/                 PRD, architecture, database, API, deployment
├── .github/workflows/    CI pipeline
└── docker-compose.yml    local PostgreSQL + MongoDB
```

---

## Environment variables

Nothing secret is ever committed. Each app ships a `.env.example`; copy it to `.env` and fill in
real values locally.

| File                   | Purpose                                             | Committed? |
| ---------------------- | --------------------------------------------------- | ---------- |
| `backend/.env.example` | Template for server config and secrets              | Yes        |
| `backend/.env`         | Real server values, including the LLM API key later | **No**     |
| `frontend/.env`        | Public build-time values only (`VITE_*`)            | **No**     |
| `.env.example` (root)  | Database credentials for `docker-compose.yml`       | Yes        |

Anything named `VITE_*` is compiled into the JavaScript bundle and is readable by anyone. API keys
and secrets belong in `backend/.env` only.

---

## Roadmap

| Phase     | Scope                                       | Status |
| --------- | ------------------------------------------- | ------ |
| 1         | Project setup, tooling, health endpoint     | Done   |
| 2         | PostgreSQL + MongoDB schemas                | Next   |
| 3         | Auth: JWT, password hashing, RBAC           | —      |
| 4         | Ticket CRUD                                 | —      |
| 5–6       | Frontend pages and API integration          | —      |
| 7–9       | AI assistant, structured output, classifying| —      |
| 10–12     | Knowledge base, RAG, tool calling, agent    | —      |
| 13–14     | AI security, streaming                      | —      |
| 15–16     | Real-time chat, analytics                   | —      |
| 17–19     | LLM evaluation, hardening, tests            | —      |
| 20        | Deployment                                  | —      |

---

## Git workflow

`main` holds working code only. Work happens on feature branches merged into `develop`.

```bash
git checkout -b feature/database
# ...work...
git commit -m "feat: add postgres and mongo connections"
```

Commit messages follow Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`,
`test:`.

---

## Documentation

- [docs/PRD.md](docs/PRD.md) — product requirements
- [docs/Architecture.md](docs/Architecture.md) — how requests flow, and open decisions
- [docs/Database.md](docs/Database.md) — which database owns which data
- [docs/API.md](docs/API.md) — endpoint reference
- [docs/Deployment.md](docs/Deployment.md) — production plan

