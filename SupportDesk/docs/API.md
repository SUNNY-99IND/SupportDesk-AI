# API reference

Base URL in development: `http://localhost:5001`
All endpoints live under `/api`.

## Response envelope

Every response follows the unified JSON envelope:

Success:
```json
{ "success": true, "data": {}, "message": "..." }
```

Failure:
```json
{ "success": false, "message": "Ticket not found", "errors": [] }
```

## HTTP Status Codes

| Code | Meaning |
| ---- | ------- |
| 200  | Successful request |
| 201  | Resource created |
| 400  | Invalid request (Zod validation failure) |
| 401  | Authentication required / invalid token |
| 403  | Access denied / insufficient permissions |
| 404  | Resource not found |
| 409  | Conflict (e.g. email already registered) |
| 429  | Rate limit exceeded |
| 500  | Internal server error |

---

## 1. System Endpoints

### `GET /api/health`
Public liveness probe.
```bash
curl -s http://localhost:5001/api/health
```

---

## 2. Authentication Endpoints

### `POST /api/auth/register`
Creates new user, assigns role, links organization, and returns JWT.
```bash
curl -s -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Jane Doe","email":"jane@company.com","password":"Password123!","organizationName":"Acme Inc.","role":"CUSTOMER"}'
```

### `POST /api/auth/login`
Authenticates user, verifies bcrypt hash, and returns JWT token and user profile.
```bash
curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@supportdesk.ai","password":"Password123!"}'
```

### `GET /api/auth/me`
Fetches current authenticated user profile using SQL JOIN across `users`, `organizations`, and `roles`.
*Requires `Authorization: Bearer <token>`.*

---

## 3. Ticket Management Endpoints

### `GET /api/tickets`
Lists tickets with role-based filtering:
- Customers see their own tickets
- Agents see unassigned tickets and tickets assigned to them
- Admins see all tickets
Query params: `?status=OPEN&priority=HIGH&search=invoice`

### `POST /api/tickets`
Creates a new support ticket and automatically runs AI pre-classification.
```bash
curl -s -X POST http://localhost:5001/api/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Double charged for subscription","description":"Please issue refund for duplicate billing","category":"Billing"}'
```

### `GET /api/tickets/:id`
Retrieves a single ticket by ID.

### `PATCH /api/tickets/:id`
Updates ticket status, priority, or assigned agent.
```bash
curl -s -X PATCH http://localhost:5001/api/tickets/:id \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"IN_PROGRESS","priority":"URGENT"}'
```

### `DELETE /api/tickets/:id`
Deletes a ticket. Restricted to Admin or ticket creator.

### `GET /api/tickets/:id/messages`
Retrieves chronological message thread for a ticket.

### `POST /api/tickets/:id/messages`
Appends a message to the ticket conversation.
```bash
curl -s -X POST http://localhost:5001/api/tickets/:id/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"body":"Reviewing your invoice right now."}'
```

---

## 4. AI Assistant Endpoints

### `POST /api/ai/chat`
Conversational support assistant providing answers and structured classification.
```bash
curl -s -X POST http://localhost:5001/api/ai/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"How do I configure SSO with Okta?"}'
```

### `POST /api/ai/classify`
Classifies a support request into structured JSON (intent, priority, sentiment, requiresHuman, suggestedAction).
```bash
curl -s -X POST http://localhost:5001/api/ai/classify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Server threw 500 error","description":"When uploading CSV file server crashes."}'
```

### `POST /api/ai/suggest-reply`
Drafts an empathetic, resolution-focused response for agents to review. Restricted to `AGENT` and `ADMIN`.

---

## 5. Administration Endpoints

### `GET /api/admin/users`
Lists all workspace users with their organization and roles. (ADMIN only)

### `PATCH /api/admin/users/:id/role`
Updates a user's role in the relational database. (ADMIN only)

### `GET /api/admin/stats`
Returns system telemetry, process memory, and ticket breakdown. (ADMIN only)
