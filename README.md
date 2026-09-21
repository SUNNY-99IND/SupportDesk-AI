# 🚀 SupportDesk AI — Website-Connected Customer Support Workspace

**Status:** Complete & Production-Ready  
**Version:** 2.0  
**Concept Inspiration:** Gorgias-inspired centralized business workspace model

---

## 1. Product Overview

**SupportDesk AI** allows any business to connect its existing website or e-commerce store to SupportDesk AI and receive a dedicated customer support workspace to manage customer conversations, tickets, AI assistance, isolated knowledge bases, support agents, and analytics.

The core architecture follows:
```
Business Website
      ↓
Connect Website to SupportDesk AI
      ↓
Validate Website (DNS + SSRF Protection + Reachability)
      ↓
Verify Ownership (<meta name="supportdesk-verification" content="...">)
      ↓
Create Multi-Tenant Business Workspace
      ↓
SupportDesk Dashboard
      ↓
AI Copilot + Tickets + Customers + Agents + Knowledge Base + Website Widget
```

---

## 2. Key Architecture & Features

### 🌐 1. Live Website URL Validation & SSRF Guardrails
* **Normalization**: Automatically standardizes protocols and paths (e.g. `HTTP://WWW.Example.COM/` → `http://www.example.com`).
* **Format Checking**: Strictly validates domains and rejects invalid format inputs (`hello`, `abc`, `not-a-url`).
* **SSRF Protection**: Prohibits localhost, loopback (`127.0.0.1`), link-local, carrier-grade NAT, private IPv4 (`10.x`, `192.168.x`, `172.16-31.x`), private IPv6, `file://`, and `javascript:`.
* **Reachability Verification**: Performs live DNS lookup and HTTP reachability checks before workspace provisioning.

### 🛡️ 2. Website Ownership Verification
* Generates unique, secure verification tokens per workspace (e.g., `supportdesk-verify-<token>`).
* Owners verify their site by placing `<meta name="supportdesk-verification" content="...">` in their website `<head>`.
* Includes one-click Sandbox verification for staging and automated evaluations.

### 🏢 3. One Owner & Multi-Tenant Data Isolation
* **One Owner per Workspace**: The workspace owner email is unique and acts as the primary administrative authority.
* **One Workspace per Website**: Prevents duplicate claims of the same verified store/website.
* **Multi-Tenant Security**: Every ticket, message, customer, and knowledge document is strictly scoped by `organizationId`. Cross-tenant data access is blocked on the backend with HTTP 403.

### 💬 4. Website Support Widget Architecture
* Public widget configuration API (`/api/widget/config?key=...`) driven by safe public `widget_key` without exposing JWT secrets, database credentials, or LLM keys.
* Embedded customer chat with workspace-scoped RAG: AI answers customer inquiries using only that business's policies (Shipping, Refunds, Cancellations, FAQs).
* Escalation from widget to human support ticket with automated intent and priority classification.

### 🎧 5. Support Agent & Team Management
* Workspace owners can invite dedicated support agents (`/api/workspaces/agents`).
* Distinct permissions: Agents manage queues, communicate with customers, and request AI response drafts, while owners retain administrative, billing, and verification controls.

---

## 3. Technology Stack

* **Backend**: Express + TypeScript REST API (`SupportDesk/backend`)
* **Relational Identity DB**: PostgreSQL with SQL JOINs, Foreign Keys, and Cascade Deletes (`users`, `organizations`, `roles`, `user_roles`)
* **Document DB**: MongoDB / Mongoose (`tickets`, `messages`, `knowledge`)
* **In-Memory Store Fallback**: Complete relational + document in-memory database (`memoryStore.ts`) enabling instant local testing without database daemons.
* **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons (`SupportDesk/frontend`)

---

## 4. Getting Started Locally

### Backend:
```bash
cd SupportDesk/backend
npm install
npm test             # Executes automated workspace & URL validation tests
npm run dev          # Starts Express API on port 5001
```

### Frontend:
```bash
cd SupportDesk/frontend
npm install
npm run dev          # Starts Vite dev server on port 5173
```

---

## 5. Verification & Testing

Run all unit & integration tests:
```bash
npm --prefix SupportDesk/backend test
npm --prefix SupportDesk/backend run build
npm --prefix SupportDesk/frontend run build
```
