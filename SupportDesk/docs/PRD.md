# Product Requirements — SupportDesk AI

## Problem

Small businesses handle support across scattered email threads and chat apps. Requests get lost,
response times are inconsistent, and the same questions get answered by hand over and over. There
is no single view of what customers are asking or how quickly they are being helped.

## Solution

One platform where customers raise tickets, agents resolve them, and an AI assistant handles
repetitive questions using the company's own documented knowledge — escalating to a human when it
should.

## Users and what they can do

**Customer** — register and log in, create tickets, track status, chat with the AI assistant,
message agents, upload files, review past conversations.

**Support agent** — log in, see assigned tickets, view customer context, reply, change status and
priority, use AI-suggested replies (always reviewed before sending), read AI conversation
summaries.

**Admin** — manage users and agents, oversee all tickets, maintain the knowledge base, view support
and AI analytics, monitor AI usage and cost, adjust system settings.

## Ticket model

A ticket carries a title, description, customer, assigned agent, category, priority, status, and
created/updated timestamps.

Status moves through `OPEN` → `IN_PROGRESS` → `WAITING` → `RESOLVED` → `CLOSED`.
Priority is one of `LOW`, `MEDIUM`, `HIGH`, `URGENT`.

## AI requirements

The assistant must classify an incoming message (intent, sentiment, priority, whether a human is
needed), answer from the knowledge base rather than from guesswork, draft replies for agents to
approve, and summarise long threads.

Hard rules, no exceptions:

- The model never touches a database directly. It may only request a named backend tool, and the
  backend validates the request, checks the caller's authorization, validates parameters, then
  executes.
- System instructions stay separate from user input.
- Retrieved knowledge-base content is treated as untrusted data, not as instructions.
- The API key lives on the server. It is never sent to the browser.
- Structured model output is validated before it is trusted or stored.

## Non-goals

This is a capstone-scope MVP. Out of scope: multi-tenancy beyond a single organization per
deployment, billing and subscriptions, native mobile apps, phone or SMS channels, and
human-agent workforce scheduling.

## Success criteria

- A customer can register, create a ticket, and see it change status.
- An agent sees only their assigned tickets and can resolve one end to end.
- The AI answers a knowledge-base-covered question correctly and escalates one it cannot answer.
- An admin can see ticket volume, resolution counts, and AI token cost.
- Prompt-injection attempts in the evaluation set do not cause unauthorized tool use.

## Delivery approach

Twenty phases, built and verified one at a time. A phase is finished only when its feature runs and
has been tested — not when the code merely exists. Phase status is tracked in the
[README roadmap](../README.md#roadmap).
