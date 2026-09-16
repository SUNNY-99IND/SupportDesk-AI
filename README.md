# Product Requirements Document (PRD)

# SupportDesk AI

## 1. Product Overview

SupportDesk AI is a full-stack customer support platform designed to help small businesses manage customer queries and support tickets through a centralized web application.

The system combines a React frontend, Node.js/Express backend, MongoDB, PostgreSQL, and an LLM API to provide AI-assisted customer support.

---

## 2. Problem

Small businesses often manage customer support manually through messages, emails, calls, and spreadsheets.

This can cause:

* Slow responses
* Difficult ticket tracking
* Repetitive support work
* Poor organization of customer information
* Limited visibility into support activity

---

## 3. Solution

SupportDesk AI provides a single platform where customers can create support tickets and communicate with support agents.

The system uses AI to understand customer requests and assist agents with responses and ticket information.

---

## 4. Users

### Customer

* Register and login
* Create support tickets
* View tickets
* Update tickets
* Communicate with support agents
* Ask the AI assistant questions

### Support Agent

* Login
* View assigned tickets
* View customer information
* Respond to customers
* Update ticket status
* Get AI-assisted responses

### Admin

* Manage users
* Manage agents
* Manage tickets
* View basic system information

---

## 5. Core Features

### Authentication

* User registration
* User login
* Password hashing
* JWT authentication
* Role-based authorization
* Protected API routes

---

### Ticket Management

Customers can create tickets.

Agents can manage tickets.

Ticket information includes:

* Title
* Description
* Customer
* Assigned agent
* Status
* Priority
* Created date
* Updated date

Ticket operations:
* Create
* Read
* Update
* Delete

---

### AI Assistant

The AI assistant will use an LLM API to help with customer support.

It will:

* Understand customer questions
* Generate support responses
* Classify customer requests
* Provide structured results
* Assist support agents

---

## 6. AI Requirements

The AI implementation will demonstrate:

### LLM API Integration

The backend communicates with an external LLM API.

```
React
 ↓
Express API
 ↓
LLM API
 ↓
Express
 ↓
React
```

The API key must remain on the backend.

---

### Prompt Engineering

Create specific prompts for tasks such as:

* Customer support response
* Ticket classification
* Customer sentiment
* Agent response suggestion

---

### Structured Outputs

AI responses should return structured data when required.

Example:

```json
{
  "intent": "refund",
  "priority": "high",
  "response": "I can help you with your refund request."
}
```

The backend validates the returned structure before using it.

---

## 7. Backend Requirements

The backend will use:

* Node.js
* Express.js
* TypeScript
* REST APIs

### Middleware

Middleware will be used for:

* Authentication
* Authorization
* Request validation
* Error handling
* Rate limiting

---

### REST API

Example endpoints:

* `POST /api/auth/register`
* `POST /api/auth/login`
* `GET /api/tickets`
* `POST /api/tickets`
* `GET /api/tickets/:id`
* `PATCH /api/tickets/:id`
* `DELETE /api/tickets/:id`
* `POST /api/ai/chat`
* `POST /api/ai/classify`

Endpoints should follow REST principles and use appropriate HTTP status codes.

---

### HTTP Status Codes

The API should correctly use:

* `200` → Successful request
* `201` → Resource created
* `400` → Invalid request
* `401` → Authentication required
* `403` → Access denied
* `404` → Resource not found
* `409` → Conflict
* `500` → Server error

---

### Server-Side Error Handling

The backend should have centralized error handling.

Example:

```json
{
  "success": false,
  "message": "Ticket not found"
}
```

Internal errors should not expose sensitive information.

---

## 8. Database Requirements

The project will use both MongoDB and PostgreSQL.

### MongoDB

MongoDB will be used for document-based application data.

Example collections:
* `tickets`
* `messages`
* `conversations`

The project must demonstrate:
* MongoDB CRUD
* MongoDB schema modeling

---

### PostgreSQL

PostgreSQL will be used for relational data.

Example tables:
* `users`
* `roles`
* `organizations`

The project must demonstrate:
* Primary keys
* Foreign keys
* Relational schema design
* SQL JOINs

Example relationship:

```
Organization
      │
      └── Users
             │
             └── Roles
```

---

## 9. Frontend Requirements

The frontend will use:

* React
* TypeScript
* Tailwind CSS

### Client-Side Routing

Pages should include:

* `/login`
* `/register`
* `/dashboard`
* `/tickets`
* `/tickets/:id`
* `/chat`
* `/profile`

---

### React Components

Use reusable components such as:

* `Navbar`
* `Sidebar`
* `TicketCard`
* `TicketTable`
* `ChatBox`
* `Button`
* `Modal`

Components should be composed rather than putting the entire application into one component.

---

### State Management

Use `useState` for appropriate UI and application state:
* Ticket data
* Form state
* Loading state
* Chat messages
* Filters

---

### Side Effects

Use `useEffect` where appropriate for:
* API data fetching
* Updating external systems
* Event subscriptions

---

### Async API Communication

Frontend API requests should use asynchronous programming.

Example:

```
React
 ↓
async/await
 ↓
REST API
 ↓
JSON response
 ↓
React state
```

The application should properly handle:
* Loading
* Success
* Error

---

## 10. JavaScript Concepts

The project development should provide practical examples of:

* Async/await
* Promises
* Event loop
* Closures
* Hoisting
* Promise-based asynchronous operations

These concepts should appear naturally in the application code rather than being added as unnecessary features.

---

## 11. Security Requirements

The application should implement:

### JWT
* JWT issuance during login
* JWT verification on protected routes

### Password Security
Passwords must be hashed before being stored.

### Role-Based Authorization
Example:
* Customer → Customer resources
* Agent → Assigned support resources
* Admin → Administrative resources

### Rate Limiting
Protect login and AI endpoints from excessive requests.

### Environment Variables
Sensitive values must be stored in environment variables.

Example:
* `DATABASE_URL`
* `MONGODB_URI`
* `JWT_SECRET`
* `LLM_API_KEY`

Never commit secrets to GitHub.

---

## 12. System Architecture

The basic system architecture:

```
                React Frontend
                      │
                      ▼
               Express Backend
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
      MongoDB     PostgreSQL    LLM API
          │           │           │
          └───────────┼───────────┘
                      ▼
                 Application
```

The frontend communicates with the backend through REST APIs.

The backend manages authentication, business logic, databases, and communication with the LLM API.

---

## 13. Git Workflow

The project will use Git and GitHub.

Feature branches:
* `main`
* `develop`
* `feature/authentication`
* `feature/tickets`
* `feature/ai-assistant`
* `feature/frontend`

Example commits:
* `feat: add user registration`
* `feat: add ticket CRUD`
* `feat: integrate LLM API`
* `fix: handle invalid ticket request`

Each feature should be tested before merging.

---

## 14. Basic UI

The application should have a clean, modern SaaS design.

Main areas:

```
Customer
 ├── Dashboard
 ├── Tickets
 ├── Chat
 └── Profile

Agent
 ├── Dashboard
 ├── Tickets
 └── Customers

Admin
 ├── Dashboard
 ├── Users
 └── Tickets
```

The UI should be:
* Responsive
* Simple
* Consistent
* Easy to navigate

---

## 15. Development Order

The project will be developed in this order:

* Phase 1: Project setup
* Phase 2: Database setup
* Phase 3: Authentication
* Phase 4: Ticket CRUD
* Phase 5: Backend API
* Phase 6: React frontend
* Phase 7: Frontend/API integration
* Phase 8: LLM API integration
* Phase 9: Prompt engineering and structured outputs
* Phase 10: Security and error handling
* Phase 11: Testing
* Phase 12: Deployment

---

## 16. Success Criteria

The project is successful when:

* Users can register and login.
* JWT authentication works.
* Passwords are securely hashed.
* Roles are enforced.
* Customers can create and manage tickets.
* Agents can manage tickets.
* MongoDB CRUD works.
* MongoDB schemas are properly modeled.
* PostgreSQL PK/FK relationships work.
* SQL JOINs are implemented.
* React communicates with the backend.
* Client-side routing works.
* React state and side effects are implemented correctly.
* REST APIs follow proper conventions.
* HTTP status codes are appropriate.
* Server-side errors are handled.
* LLM API integration works.
* Prompts are properly designed.
* AI can return structured output.
* Secrets are managed using environment variables.
* The project follows a Git workflow.
* The application is deployed successfully.

---

## 17. Project Status

* **Status:** Complete
* **Implementation:** Full-Stack React + Node.js/Express + PostgreSQL + MongoDB + LLM API
