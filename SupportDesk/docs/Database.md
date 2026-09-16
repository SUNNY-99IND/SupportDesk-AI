# Database design

> **Status: Implemented**
> PostgreSQL tables (`organizations`, `users`, `roles`, `user_roles`), foreign keys, and multi-table SQL JOINs
> are implemented in `backend/src/db/postgres.ts` and `schema.sql`. MongoDB document models (`tickets`, `messages`)
> are implemented in `backend/src/models/` and `backend/src/db/mongo.ts`, with resilient memory store fallback.

## Which database owns what

Two databases, and the split is not arbitrary.

**PostgreSQL owns identity and relationships.** Users, organizations, roles, and the links between
them. This data is highly relational, changes rarely, and must never be inconsistent — a user
belonging to no organization or holding a role that does not exist would be a serious bug.
Foreign key constraints make those states impossible rather than merely unlikely.

**MongoDB owns support content.** Tickets, messages, conversations, knowledge-base documents, and AI
logs. These are naturally document-shaped: a ticket is read as a whole, messages are appended, and
the fields on an AI log will keep evolving as AI features grow. Rigid columns would fight that.

The seam between the two: MongoDB documents reference PostgreSQL users by storing the user's UUID as
a plain field. There is no cross-database join — the application fetches from each and combines. That
is the accepted cost of using two stores, and the reason the boundary is drawn at "identity" versus
"content" rather than somewhere messier.

## PostgreSQL — planned schema

Three tables plus one join table. Nothing more until something needs it.

```text
organizations
  id              UUID        PRIMARY KEY
  name            TEXT        NOT NULL
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()

users
  id              UUID        PRIMARY KEY
  organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
  email           TEXT        NOT NULL UNIQUE
  password_hash   TEXT        NOT NULL      -- bcrypt; never a plaintext password
  full_name       TEXT        NOT NULL
  is_active       BOOLEAN     NOT NULL DEFAULT true
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()

roles
  id              SERIAL      PRIMARY KEY
  name            TEXT        NOT NULL UNIQUE   -- CUSTOMER | AGENT | ADMIN

user_roles                                       -- many-to-many join table
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE
  role_id         INTEGER     NOT NULL REFERENCES roles(id) ON DELETE RESTRICT
  PRIMARY KEY (user_id, role_id)                 -- composite key blocks duplicates
```

Why a join table rather than a `role` column on `users`: an agent who is also an admin is a real
situation, and a composite primary key on `(user_id, role_id)` makes assigning the same role twice
impossible at the database level.

`ON DELETE CASCADE` on `user_roles.user_id` means deleting a user cleans up their role assignments.
`ON DELETE RESTRICT` on `role_id` refuses to delete a role that is still assigned to anyone.

### The JOIN this design exists to support

Loading a user with their organization and roles in one query:

```sql
SELECT
  u.id,
  u.email,
  u.full_name,
  o.name                        AS organization,
  COALESCE(ARRAY_AGG(r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles
FROM users u
INNER JOIN organizations o ON o.id = u.organization_id
LEFT  JOIN user_roles  ur ON ur.user_id = u.id
LEFT  JOIN roles        r ON r.id = ur.role_id
WHERE u.email = $1
GROUP BY u.id, u.email, u.full_name, o.name;
```

`INNER JOIN` for the organization because every user must have one. `LEFT JOIN` for roles because a
freshly created user may have none yet, and an inner join would make that user vanish from the
result entirely.

Note `$1` rather than string interpolation: every query is parameterized, which is what prevents SQL
injection.

## MongoDB — planned collections

```text
tickets
  _id, organizationId, customerId (PG user UUID), assignedAgentId | null,
  title, description, category,
  priority: LOW | MEDIUM | HIGH | URGENT,
  status:   OPEN | IN_PROGRESS | WAITING | RESOLVED | CLOSED,
  aiClassification: { intent, sentiment, requiresHuman } | null,
  createdAt, updatedAt

messages
  _id, ticketId, senderId | null, senderType: CUSTOMER | AGENT | AI,
  body, attachments[], createdAt

knowledgeDocuments
  _id, organizationId, title, type: FAQ | POLICY | PRODUCT | TROUBLESHOOTING,
  content, chunks[{ text, embedding[] }], createdAt, updatedAt

aiLogs
  _id, userId, ticketId | null, operation, model,
  promptTokens, completionTokens, estimatedCostUsd, latencyMs, createdAt
```

Messages are a separate collection rather than an array inside the ticket. A support thread can grow
without bound, and Mongo documents have a 16 MB ceiling — embedding an unbounded array in a document
that is read on every ticket view is the classic modelling mistake here.

Planned indexes: `tickets` on `{ organizationId, status }` and `{ assignedAgentId, status }`;
`messages` on `{ ticketId, createdAt }`; `aiLogs` on `{ createdAt }`.

The `chunks[].embedding` shape assumes similarity is computed in the service layer. If Phase 10
adopts Atlas Vector Search instead, chunks move to their own collection with a vector index — see
the open decision in [Architecture.md](./Architecture.md#open-decisions).
