# Product Requirements Document (PRD)

# SupportDesk AI — Intelligent Customer Support Platform

**Version:** 1.0  
**Status:** In Development / Capstone Project  
**Author:** SupportDesk AI Team  

---

## 1. Executive Summary & Product Overview

**SupportDesk AI** is an enterprise-grade, full-stack customer support platform designed to streamline customer query resolution for modern small and medium businesses. 

By unifying ticket lifecycle management, real-time messaging, multi-tier Role-Based Access Control (RBAC), and generative AI capabilities, SupportDesk AI eliminates fragmented communication across emails and spreadsheets. The system combines a React frontend, Node.js/Express backend, PostgreSQL (for relational identities and RBAC), MongoDB (for semi-structured tickets and chat logs), and an LLM API for automated classification, sentiment analysis, and agent response suggestions.

---

## 2. Problem Statement

Small businesses struggle with disjointed, manual customer support operations:
* **Slow Response Times:** Inquiries scattered across multiple email accounts and chat tools get missed or delayed.
* **Repetitive Support Inquiries:** Up to 60% of tier-1 support tickets inquire about repetitive information (operating hours, refund policies, setup guides).
* **Agent Fatigue:** Agents spend excessive time drafting manual responses and classifying tickets.
* **Lack of Visibility:** Managers lack unified visibility into ticket volumes, team resolution times, and customer sentiment.

---

## 3. Solution Overview

SupportDesk AI centralizes all customer support interactions into a single intelligent platform:
1. **Customer Portal:** Allows users to submit, track, update, and search tickets, as well as converse with an AI virtual assistant.
2. **Support Agent Workspace:** Equips agents with prioritized ticket queues, customer context, and one-click AI response drafting.
3. **Admin Telemetry & Operations:** Provides administrative control over users, role assignments, system-wide ticket oversight, and AI token/cost monitoring.
4. **Intelligent AI Co-Pilot:** Automatically classifies tickets by category, priority, and sentiment upon submission, providing structured JSON outputs.

---

## 4. User Personas & Permissions

| Persona | Primary Needs & Responsibilities | Key Capabilities |
| :--- | :--- | :--- |
| **Customer** | Needs fast resolution of issues, easy ticket tracking, and self-service support. | • Register & log in<br>• Create and track support tickets<br>• Chat with AI virtual assistant<br>• Add messages to ticket threads<br>• View ticket resolution history |
| **Support Agent** | Needs organized queue management, relevant customer context, and fast response generation. | • Log in & view assigned tickets<br>• Update ticket status (`OPEN` → `IN_PROGRESS` → `RESOLVED` → `CLOSED`)<br>• Adjust priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`)<br>• Generate & review AI suggested responses<br>• Communicate directly with customers |
| **Admin** | Needs full system oversight, role management, knowledge-base curation, and operational analytics. | • Manage users, agents, and role assignments<br>• View system-wide metrics and ticket queues<br>• Manage knowledge base entries<br>• Monitor AI token consumption and system health |

---

## 5. Core Functional Requirements

### 5.1 Authentication & Authorization
* **Secure Registration & Login:** Email/password authentication using `bcrypt` (10 salt rounds) and standard JSON Web Tokens (JWT) stored in HTTP-only/secure client state.
* **Role-Based Access Control (RBAC):** Three discrete roles (`Customer`, `Agent`, `Admin`) enforced via modular backend middleware.
* **Route Protection:** Protected API endpoints and frontend route guards (`ProtectedRoute`).

### 5.2 Ticket Management (CRUD)
* **Ticket Creation:** Customers can file tickets specifying Title, Description, Category, and initial Priority.
* **Ticket Retrieval & Filtering:** Filter tickets by Status, Priority, Category, and search by keyword.
* **Ticket Updates:** Agents and Admins can reassign tickets, update status, change priority, and append resolution notes.
* **Message Threading:** Real-time conversation thread attached to each ticket.

### 5.3 AI Assistant & Intelligent Automation
* **Automatic Ticket Classification:** On ticket creation, the backend analyzes description text and extracts:
  * `intent` (e.g., Billing, Technical, Account, Feature Request)
  * `priority` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`)
  * `sentiment` (`Positive`, `Neutral`, `Negative`, `Frustrated`)
  * `requiresHuman` (Boolean flag)
  * `suggestedAction` (Next best action)
* **Structured Output Guarantee:** All AI classification and extraction is enforced and validated through strict Zod schemas before being committed to the database.
* **Agent Response Suggestions:** Agents can request AI to draft a polite, context-aware reply based on the full ticket history.
* **Security & Prompt Guardrails:** System prompts are strictly separated from user inputs; user content is treated as untrusted text to prevent prompt injection attacks.

### 5.4 Dual-Database Architecture
* **PostgreSQL (Relational Identity):** Normal forms for `users`, `roles`, `organizations`, and `user_roles` with relational foreign keys and SQL `JOIN` queries.
* **MongoDB (Document Store):** High-write, schema-flexible document store for `tickets`, `messages`, and `conversations`.
* **In-Memory Fallback Adapter:** Resilient fallback allowing seamless local demonstration when external database daemons are inactive.

---

## 6. Non-Functional Requirements

* **Security:**
  * Strict JWT expiry and verification.
  * Input validation using Zod on every incoming HTTP body.
  * Rate limiting applied to `/api/auth/*` and `/api/ai/*`.
  * Secrets stored exclusively in server-side `.env` files; never committed to git.
* **Performance:**
  * REST API response time < 150ms for cached/CRUD operations.
  * LLM response latency < 2.5s with timeout fallbacks.
* **Scalability:**
  * Stateless Express server architecture allowing horizontal scaling.
  * Connection pooling configured for PostgreSQL (`pg.Pool`) and MongoDB (`mongoose`).
* **Usability & Design:**
  * Responsive, modern SaaS interface built with React 19, Tailwind CSS, and Lucide icons.
  * Accessible color contrast and mobile-friendly touch targets.

---

## 7. Success Criteria

1. **User Authentication:** Customers, Agents, and Admins can securely register and log in, receiving valid JWT tokens and distinct role permissions.
2. **Ticket Workflow:** A customer can create a ticket, see it in their dashboard, receive an automated AI classification, and observe an agent resolve it.
3. **AI Accuracy & Reliability:** Ticket classification consistently produces validated JSON without crashing backend controllers.
4. **Relational & Document DB Compliance:** PostgreSQL handles relational identity queries via SQL `JOIN`s, while MongoDB stores ticket threads.
5. **Code Quality & Verification:** 100% typecheck passing in both frontend and backend TypeScript configurations with zero lint/build errors.
