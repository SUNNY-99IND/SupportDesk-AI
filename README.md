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

## Getting Started

### 1. Backend

```bash
cd SupportDesk/backend
npm install
npm run dev
```

The API starts on <http://localhost:5001> (or 5000).

### 2. Frontend

```bash
cd SupportDesk/frontend
npm install
npm run dev
```

The app starts on <http://localhost:5173>. Open it in a browser to use the full application.

---

## Verifying the Setup

```bash
curl -i http://localhost:5001/api/health
```

Expected — HTTP 200 with:

```json
{ "success": true, "message": "SupportDesk AI API is running" }
```

---

## Project Structure

```text
SupportDesk/
├── backend/              Express REST API
│   └── src/
│       ├── config/       env loading and validation
│       ├── controllers/  HTTP controllers (auth, tickets, ai, admin)
│       ├── db/           PostgreSQL & MongoDB adapters, SQL schema, memoryStore
│       ├── middleware/   auth (JWT), rbac, rateLimiter, errorHandler, validate
│       ├── models/       Mongoose Ticket and Message models
│       ├── routes/       REST endpoints
│       ├── services/     business logic (auth, ticket, ai)
│       └── validators/   Zod validation schemas
│
├── frontend/             React single-page app
│   └── src/
│       ├── components/   Navbar, Sidebar, TicketTable, TicketCard, ChatBox, Modal
│       ├── context/      AuthContext (JWT, user state, demo switcher)
│       ├── pages/        Login, Register, Dashboard, Tickets, Detail, Chat, Profile, Admin
│       ├── services/     API client, auth, ticket, ai, admin
│       └── types/        Domain TypeScript interfaces
│
├── docs/                 PRD, Architecture, Database, API, Deployment
└── docker-compose.yml    Local PostgreSQL + MongoDB
```
