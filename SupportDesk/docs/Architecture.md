# Architecture

## Current state (Phase 1)

Only the request path marked **built** below exists today.

```text
Browser (React 19 + Vite, :5173)
   │  fetch('/api/health')
   │  dev only: Vite proxies /api -> :5000, so the browser sees one origin
   ▼
Express app (:5000)                                    [built]
   │  helmet  -> security headers
   │  cors    -> allow the frontend origin
   │  json    -> parse body, 1 MB cap
   │  morgan  -> request log
   ▼
Router  /api/health                                    [built]
   ▼
Controller  health.controller.ts                       [built]
   ▼
Response envelope  { success, message }                [built]
   │
   ├─ no route matched -> notFound middleware -> 404
   └─ anything thrown  -> errorHandler -> 4xx/5xx
```

## Target state

```text
Frontend
   ▼
Express REST API
   ▼
Authentication / middleware        (Phase 3)
   ▼
Controllers                        thin: HTTP in, HTTP out
   ▼
Services                           business logic lives here
   ▼
PostgreSQL │ MongoDB │ AI service
```

The layering rule is worth stating plainly: **controllers never query a database.** They validate
input, call a service, and shape the response. Services own the logic and are the only code that
talks to a database or to the LLM. This is what makes the logic testable without an HTTP server and
replaceable without touching routes.

## AI request path (Phase 7 onward, not built)

```text
User message
   ▼
Input validation (Zod)             reject before spending tokens
   ▼
AI service
   ▼
Classify: intent / sentiment / priority / requiresHuman
   ▼
Knowledge base or backend tools, only when needed
   ▼
LLM call
   ▼
Validate the structured output
   ▼
Frontend
```

The model is never given database credentials. It can only ask for a named tool such as
`searchKnowledgeBase()` or `getTicket()`. For every such request the backend validates the tool
name, checks that *this* user is allowed to call it, validates the parameters, executes, and returns
only the resulting data. Retrieved documents are inserted as data, clearly delimited, never as
instructions.

## Key decisions made so far

**Vite dev proxy instead of cross-origin calls.** The frontend calls `/api/...` with no host. In
development Vite forwards that to Express, so the browser never makes a cross-origin request and
CORS cannot surprise us. In production `VITE_API_BASE_URL` points at the deployed API and CORS on
the server does the real work.

**`app.ts` separate from `server.ts`.** `createApp()` returns a configured Express app without
binding a port, so Phase 19 tests can drive it in-process.

**Environment validated at boot.** `config/env.ts` parses `process.env` through a Zod schema and
exits with a readable error if anything is missing. Misconfiguration fails at startup instead of
producing `undefined` deep inside a request.

**Pinned dependency versions.** Exact versions, not ranges, so `npm install` produces the same tree
on every machine and CI. Upgrade deliberately.

**Tailwind v4 with CSS-based config.** There is no `tailwind.config.js`; design tokens live in
`frontend/src/index.css` under `@theme`. Dark mode is class-based via `@custom-variant` so the app
can offer a real toggle instead of only following the OS.

## Open decisions

Two choices need resolving before Phase 10. Both come from picking Anthropic as the LLM provider.

**Embeddings provider.** Anthropic has no embeddings endpoint, and RAG needs one. Options: Voyage AI
(the provider Anthropic recommends), OpenAI `text-embedding-3-small` (cheapest, best documented), or
a local model via `@xenova/transformers` (no API key, no cost, slower, weaker quality). Leaning
toward OpenAI embeddings for reliability, with the embedding call isolated behind one service
function so it can be swapped.

**Where vectors live.** MongoDB Atlas Vector Search only exists on Atlas — it does not work against
the Mongo container in `docker-compose.yml`. So either development uses Atlas for MongoDB instead of
Docker, or the knowledge base stores embeddings as plain arrays and similarity is computed in the
service layer. For a knowledge base of a few hundred chunks, in-service cosine similarity is fast
enough and keeps development fully local; Atlas Vector Search is the better answer if the corpus
grows. Decide at Phase 10, not before.
