# Low-Level Design (LLD)

# SupportDesk AI — Component & Database Specification

**Version:** 1.0  
**Status:** Approved / In Implementation  
**Document Owner:** SupportDesk AI Engineering Team  

---

## 1. Database Schema Design

SupportDesk AI employs a dual-database architecture: PostgreSQL for identity and role management, and MongoDB for ticket lifecycle documents.

### 1.1 PostgreSQL Relational Schema (DDL)

```sql
-- Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,       -- 'Customer', 'Agent', 'Admin'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Roles Junction Table (Many-to-Many / Explicit RBAC)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- Indexes for Fast Lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id);
```

#### Key Relational Query (User Profile + Role JOIN):
```sql
SELECT 
    u.id, u.email, u.name, u.org_id, o.name AS org_name, r.name AS role
FROM users u
LEFT JOIN organizations o ON u.org_id = o.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.id = $1;
```

---

### 1.2 MongoDB Schema Specification (Mongoose)

#### `Ticket` Document Schema
```typescript
interface ITicket {
  _id: string;
  title: string;
  description: string;
  customerId: string;           // Maps to PostgreSQL User UUID
  customerName: string;
  customerEmail: string;
  assignedAgentId?: string;     // Maps to PostgreSQL Agent UUID
  assignedAgentName?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: 'Billing' | 'Technical' | 'Account' | 'General';
  aiMetadata?: {
    intent?: string;
    sentiment?: 'Positive' | 'Neutral' | 'Negative' | 'Frustrated';
    confidence?: number;
    requiresHuman?: boolean;
    suggestedAction?: string;
    classifiedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

#### `Message` Document Schema
```typescript
interface IMessage {
  _id: string;
  ticketId: string;             // References Ticket _id
  senderId: string;             // PostgreSQL User UUID or 'AI_ASSISTANT'
  senderName: string;
  senderRole: 'Customer' | 'Agent' | 'Admin' | 'AI';
  content: string;
  isAiGenerated: boolean;
  createdAt: Date;
}
```

---

## 2. API Endpoint Specifications

All API responses strictly adhere to the unified envelope:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable status"
}
```

### 2.1 Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Access | Request Body | Success Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | `{ email, password, name, role? }` | `201 Created` + `{ token, user }` |
| `POST` | `/api/auth/login` | Public | `{ email, password }` | `200 OK` + `{ token, user }` |
| `GET` | `/api/auth/me` | Authenticated | *Header: Bearer Token* | `200 OK` + `{ user }` |

### 2.2 Ticket Management Endpoints (`/api/tickets`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tickets` | Authenticated | List tickets. Filter by `status`, `priority`, `search`. Customers view only their tickets; Agents/Admins view all. |
| `POST` | `/api/tickets` | Customer, Admin | Creates a ticket. Triggers AI classification automatically. |
| `GET` | `/api/tickets/:id` | Authenticated | Retrieve single ticket by ID along with its message thread. |
| `PATCH` | `/api/tickets/:id` | Agent, Admin | Update ticket status (`OPEN`, `RESOLVED`, etc.), priority, or assigned agent. |
| `POST` | `/api/tickets/:id/messages` | Authenticated | Post a reply to the ticket discussion thread. |

### 2.3 AI Assistant Endpoints (`/api/ai`)

| Method | Endpoint | Access | Request Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/ai/classify` | Authenticated | `{ text, title? }` | Analyzes ticket text and returns structured Zod-validated intent, priority, and sentiment. |
| `POST` | `/api/ai/suggest-reply`| Agent, Admin | `{ ticketId, draftContext? }` | Generates a context-aware proposed reply based on full ticket history for agent approval. |
| `POST` | `/api/ai/chat` | Customer | `{ message, history? }` | Real-time conversational AI support assistant. |

### 2.4 Admin Operations Endpoints (`/api/admin`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/users` | Admin | List all registered users with their assigned roles and status. |
| `PATCH` | `/api/admin/users/:id/role` | Admin | Update a user's role (`Customer`, `Agent`, `Admin`). |
| `GET` | `/api/admin/stats` | Admin | Return ticket counts by status, priority, and AI classification analytics. |

---

## 3. Middleware Pipeline

```
Incoming Request
       │
       ▼
1. Security Headers (Helmet)
       │
       ▼
2. CORS (Origin validation)
       │
       ▼
3. Body Parser (express.json() with 1MB limit)
       │
       ▼
4. Rate Limiter (express-rate-limit)
       │
       ▼
5. Authentication Middleware (verify JWT signature & decode user payload)
       │
       ▼
6. RBAC Middleware (check user.role against endpoint required roles)
       │
       ▼
7. Schema Validation Middleware (validate req.body against Zod schema)
       │
       ▼
Controller Handler
       │
       ▼
8. Global Error Handler (catch errors, format unified error response)
```

---

## 4. AI Structured Output Specification

AI classifications are strictly enforced using the following Zod schema:

```typescript
import { z } from 'zod';

export const TicketClassificationSchema = z.object({
  intent: z.string().describe("Main purpose of the customer ticket"),
  category: z.enum(['Billing', 'Technical', 'Account', 'General']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  sentiment: z.enum(['Positive', 'Neutral', 'Negative', 'Frustrated']),
  requiresHuman: z.boolean().describe("Whether this inquiry mandates human agent intervention"),
  suggestedAction: z.string().describe("Recommended initial action for the support team"),
  confidence: z.number().min(0).max(1).describe("Classification confidence score")
});

export type TicketClassification = z.infer<typeof TicketClassificationSchema>;
```

---

## 5. HTTP Error Response Envelope & Status Codes

All errors returned by the backend follow the consistent structure:
```json
{
  "success": false,
  "message": "Specific error explanation",
  "errors": []
}
```

| HTTP Code | Description | Typical Scenario |
| :--- | :--- | :--- |
| **`200 OK`** | Request succeeded | Successful GET, PATCH, or login |
| **`201 Created`** | Resource successfully created | Successful ticket or user creation |
| **`400 Bad Request`** | Input validation failed | Missing required fields or schema violation |
| **`401 Unauthorized`** | Missing or invalid authentication token | Expired JWT or missing Bearer header |
| **`403 Forbidden`** | Insufficient role permissions | Customer trying to access Admin endpoint |
| **`404 Not Found`** | Resource does not exist | Ticket ID or User ID not found |
| **`409 Conflict`** | Resource conflict | Email already registered |
| **`500 Internal Error`**| Unhandled server-side failure | Unexpected exception handled gracefully |
