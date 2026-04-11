# PLAN.md
# The Bridge — Family Office AI-Forward Accounting Platform
## Part 1 — Architecture Bible
### v0.5.0 — Architecture Bible (Part 1 of PLAN.md)

> **Document structure:** This file has two parts.
> - **Part 1 (this document) — Architecture Bible.** The long-form "why" of the system. Updated rarely, consulted often. Describes invariants, data model, agent architecture, security model, and the eight places where Phase 1 reality deliberately diverges from the long-term target.
> - **Part 2 — Phase Execution Briefs.** Written one phase at a time, appended to this file as phases complete. Each brief is concrete, short, executable. Phase 1.1 is the next document to be written. **Part 2 does not yet exist.**
>
> **Version history:**
> - v0.1.0 — Initial: Zoho module surface, flat tool catalog, `create_bill` worked example
> - v0.2.0 — Canvas: Bridge UI, Contextual Canvas, `canvas_directive` protocol, Mainframe rail
> - v0.3.0 — Layered agents: Three-layer stack, Two Laws, Phase 1 scoped to manual journal entry proof-of-concept
> - v0.4.0 — Architecture hardened: Four-layer truth hierarchy, pre-commit invariant enforcement, three-namespace contracts package, Agent→Command contract layer, event stream as single source of truth, trace-id observability, semantic confidence routing graph
> - **v0.5.0 (this version) — Phase 1 reality alignment:** Bible rewritten to describe what is actually being built in Phase 1. Eight long-term architectural targets documented as Phase 2+ evolution rather than Phase 1 requirements. PLAN.md split into Architecture Bible (Part 1) and Phase Execution Briefs (Part 2). Category A/B/C scope discipline introduced. Four resolved decisions: events table is a reserved seat; confidence is display-only in Phase 1; Auth/Period/Database collapse from agents to service functions; debit=credit enforced by deferred constraint not trigger. Audit log written synchronously inside the mutation transaction in Phase 1 (Invariant 5 deferred to Phase 2). No ADRs scaffolded.
>
> **Full changelog:** `docs/prompt-history/CHANGELOG.md`

> **How to use this document:** Read Section 0 first. Always. It tells you which parts of this Bible describe Phase 1 reality and which parts describe Phase 2+ target architecture. Without Section 0, you will read this document and build the wrong thing.

---

## Who This Plan Is Written For

I am a **non-developer founder** building an internal accounting platform for a Canadian family office. I have strong product vision but will need explicit, step-by-step guidance — especially around environment setup, folder structure, and where every piece of logic lives. Write the plan as if a brilliant senior engineer is leaving an extremely detailed roadmap for a junior developer who has never built a production system before, but who will be guided by an AI coding assistant throughout execution.

Every time a technical concept is introduced that a non-developer might not know, a one-sentence plain-English explanation is included in parentheses immediately after.

---

## Section 0 — Phase 1 Reality vs Long-Term Architecture

> **Read this section first. Every time.** This Bible describes both what Phase 1 actually builds and what the long-term system will look like. The two are different in eight specific places. If you read the Bible without knowing which is which, you will either over-build (try to scaffold the long-term architecture in Phase 1 and never finish) or under-build (skip foundations that retrofit painfully).

### The governing principle

Phase 1 is deliberately simpler than the long-term target. Every simplification was made because the cost of building the long-term version now exceeds its Phase 1 value, AND because the simplified version is structured so the long-term version can be added later without painful retrofit. **When a simplification fails that "no painful retrofit" test, it does not get simplified.** This is why multi-org, multi-currency columns, RLS, the events table, idempotency keys, and trace-id propagation are all in Phase 1 — they pass the cheap-now-expensive-later test. It is also why the monorepo, the contracts package, the layered agent stack, and pg-boss are deferred — they fail it (the cost now is real and the cost later is manageable).

### The eight Phase 1 divergences

Each row names a place where Phase 1 reality differs from the long-term Bible content, a one-line explanation of why, and a pointer to where the long-term design lives in this document.

| # | Phase 1 reality | Long-term target | Why simplified | Long-term design lives in |
|---|---|---|---|---|
| 1 | **Single Next.js app**. All code in one app under `src/`. API routes handle backend work. | pnpm workspaces monorepo with `apps/api` (Express), `apps/web` (Next.js), `packages/*` shared libraries | Monorepo + Express split adds value at multiple deployable processes and team scale. Phase 1 has neither. Cost-now is real (build setup, project references, three deploy targets). Cost-later is manageable because folder structure inside `src/` mirrors the future package layout. | Section 1f (Long-Term Architecture Targets) |
| 2 | **Service functions for auth, period, database access**. `authService`, `periodService`, `journalEntryService` — plain TypeScript modules called by the Double Entry agent tool. | Three Layer 1 Foundation Agents (Auth Agent, Database Agent, Audit Agent) and two Layer 2 Domain Agents (Chart of Accounts Agent, Period Agent), each with their own folder, prompt, and contract. | The agent abstraction adds value when multiple agents share infrastructure. Phase 1 has one agent (Double Entry). Treating its dependencies as agents is ceremony. | Section 5e (Long-Term Three-Layer Agent Stack) |
| 3 | **One contract file**: `src/contracts/post-journal-entry.contract.ts`. Everything else is plain TypeScript types in `src/services/*/types.ts`. | Three-namespace contracts package (`contracts/transport`, `contracts/agent`, `contracts/events`) with TypeScript project references enforcing isolation at build-graph level. | The three-namespace structure pays off when the codebase has multiple consumers per contract and a team that needs build-time enforcement. Phase 1 has one consumer per contract (the Double Entry agent tool ↔ the journal entry service) and one developer. | Section 1f (Long-Term Architecture Targets) and Section 15f (Contracts Package Evolution) |
| 4 | **`audit_log` written synchronously** inside the same database transaction as the mutation. | `audit_log` is a projection updated by the Audit Agent in response to events on the event stream, processed by a pg-boss job after commit. | No pg-boss in Phase 1 means no async workers. Synchronous audit inside the transaction is simpler, atomic, and gives the same auditability guarantee. The cost is that the projection model is not exercised — but the events table exists as a reserved seat so Phase 2 can switch over without table changes. | Invariant 5 (Phase 2+ form) and Section 15e (Phase 2 ordering diagram) |
| 5 | **Events table is a reserved seat.** Table exists with append-only trigger installed. Nothing reads from it. Nothing writes to it. | Event stream is the single source of truth. `audit_log`, GL balances, dashboards, and canvas state are all projections derived from events. | Building the projection infrastructure in Phase 1 doubles the work for zero immediate benefit. Reserving the table now means Phase 2 can start writing events without a schema change. The append-only trigger guarantees that whatever Phase 2 writes cannot be retroactively corrupted. | Invariant 5 (Phase 2+ form) and Section 14 (Resolved Decision Log entry) |
| 6 | **No pg-boss.** No async work. No background jobs. | pg-boss (Postgres-backed job queue) runs Audit Agent projection updates, AP email ingestion, OCR, bank feed sync, recurring invoice generation. | Phase 1 has zero async work to run. Installing a worker process for nothing is operational debt. pg-boss lands in Phase 2 alongside the AP Agent which is the first thing that genuinely needs it. | Section 10 (Performance & Scale Notes — Phase 2 row) |
| 7 | **Confidence is a display property only.** The ProposedEntryCard shows `confidence: 'high' \| 'medium' \| 'low'`. The user sees it. Nothing routes on it. | Confidence is a routing input. High confidence → standard AP queue. Medium → controller approval first. Low → dual review. Novel pattern → CFO escalation. | The routing graph requires the AP Queue to exist. The AP Queue is Phase 2. Reserving the `routing_path` field on the type now means Phase 2 wires routing without changing the type. | Section 15d (Semantic Confidence Routing Graph — Phase 2+ form) |
| 8 | **One agent: the Double Entry Agent.** Plus the orchestrator that routes user messages to it. The Chart of Accounts lookup is a tool the agent calls — it is a service function, not an agent. | Three-layer stack: Foundation (Auth/Database/Audit) → Domain (Double Entry/CoA/Period) → Workflow (AP/AR/Reporting/Reconciliation). | Workflow agents are Phase 2+. Without workflow agents, there is nothing that needs the layered abstraction. One agent calling typed service functions is the right shape for Phase 1. | Section 5e (Long-Term Three-Layer Agent Stack) |

### What this means for reading the rest of the Bible

When you reach a section that describes one of the eight items above, **the section will state explicitly which form (Phase 1 or Phase 2+) it is describing**. Where both forms are documented in the same section, the Phase 1 form comes first and is labeled "**PHASE 1 (CURRENT)**" and the Phase 2 form is labeled "**PHASE 2+ (TARGET)**". No section silently mixes the two.

---

## The Product: What This Is and Why It Is Different

### Name (working title): **The Bridge**
Inspired by the command bridge of the Starship Enterprise — the central place where the captain (the user) has total situational awareness and can issue commands that are carried out by a trained crew (the AI agents).

### What existing software gets wrong

Puzzle.io and Pennylane are modern-looking wrappers around the same paradigm as QuickBooks and Xero. They added an AI chatbot on top of a traditional accounting system. That is the wrong direction. **The Bridge is an AI agent system that happens to have a traditional accounting UI underneath it — not the reverse.**

The philosophical difference:
- In Xero, you open a screen, fill in a form, click Save. The AI is a helper.
- In The Bridge, the AI agent is the primary actor. It reads your email, sees the invoice, proposes the journal entry, shows you a confirmation card, and you approve with one click. The traditional screen exists as a fallback and a power-user tool — not the default path.

### What genuinely differentiates this product

1. **The Bridge UI pattern** — A persistent split-screen layout: AI agent chat on the left, a live Contextual Canvas on the right. When the agent references an invoice, P&L, reconciliation batch, or vendor record, it renders immediately in the canvas. The user never has to scroll back through chat history to find a table or graph. The canvas is stateful — drill-downs happen inside it without leaving the conversation.

2. **Agent Institutional Memory** — The agent builds an `org_context` knowledge store per organization: known vendors and their default GL mappings, recurring transaction patterns, seasonal expense rhythms, intercompany relationship maps, and approval rules. This memory is rule-based (stored as auditable records, not opaque model weights) so junior users are protected and controllers can review, edit, or override any learned rule. Trust is earned incrementally — the agent starts in "always confirm" mode and can be promoted to "auto-categorize with notification" for specific rule types after a controller explicitly unlocks that.

3. **Multi-entity consolidation as a first-class concept** — 50 organizations across healthcare, real estate, hotels, NYSE trading, global export, private equity, and restaurants. The platform must support: role-based org switching (CFO sees consolidated view; AP specialist sees their assigned entities), intercompany transaction detection and reciprocal entry matching, consolidated P&L with elimination entries, and entity-level roll-ups. No competitor handles this well for a family office context.

4. **AP Automation as the primary Day 1 workflow (Phase 2)** — The single most painful daily task is Accounts Payable. The agent must own this workflow end-to-end: email ingestion → OCR → proposed journal entry with intercompany flag → confirmation card → post. **Phase 1 does not build this.** Phase 1 builds the manual journal entry path that AP automation will eventually call into.

5. **Confirmation-first mutation model** — Every AI-initiated financial write produces a structured **Proposed Entry Card** before anything touches the ledger. The card shows: entity name, vendor, amount, debit/credit lines, intercompany flag (if applicable), matched rule from institutional memory (if any), and a plain-English explanation of why the agent made this choice. One-click Approve or a free-text rejection reason. This is the trust layer that makes the system auditable.

6. **Industry-specific Chart of Accounts templates** — On org creation, the user selects an industry and gets a pre-built IFRS-compliant CoA template. **Phase 1.1 seeds two templates: `holding_company` and `real_estate`.** The other four (healthcare, hospitality, trading, restaurant) are added when those orgs are first created in Phase 2.

7. **Trilingual interface** — English, French (fr-CA), and Traditional Mandarin (zh-Hant). All UI strings, agent responses, and report labels must support i18n from day one.

---

## Non-Negotiable Constraints

- **Accounting standard:** IFRS (International Financial Reporting Standards)
- **Jurisdiction:** Canada — flag GST/HST implications throughout; Flinks is the preferred bank feed provider for Canadian institutions (not Plaid)
- **Languages:** English, French (fr-CA), Traditional Mandarin (zh-Hant)
- **Users:** ~100 across three personas
- **Entities:** ~50 organizations, multi-industry
- **Developer profile:** Solo non-developer founder using AI-assisted coding

---

## The Three User Personas

### Persona 1: The Executive (CFO / Founder)
- Wants consolidated P&L across all entities, cash position, variance alerts
- Asks the agent high-level questions: "What compressed my hotel division's margins last quarter?"
- Approves large or unusual transactions
- Never wants to touch a journal entry manually
- Default landing: Consolidated Dashboard (stub in Phase 1)

### Persona 2: The Controller / Senior Accountant
- Manages month-end close, reviews AI-proposed entries, approves learned rules
- Needs full access to Chart of Accounts, Manual Journals, Period Locking, Intercompany Eliminations, and the AI Action Review queue
- Trusts the agent but verifies — wants to see the agent's reasoning, not just its answer
- Default landing: The Bridge (agent + canvas) with controller-level tool access

### Persona 3: The AP Specialist / Bookkeeper
- Primary daily loop: process incoming bills, match bank transactions, reconcile (Phase 2)
- Protected from making mistakes by the agent's rule-based guardrails — they cannot post to locked periods, cannot override intercompany flags, cannot approve their own entries
- The agent is their co-pilot: it pre-fills everything, they confirm
- Default landing in Phase 1: The Bridge with manual journal entry capability. Default landing in Phase 2: AP Queue.

---

## Locked-In Stack (Phase 1)

| Layer | Phase 1 Choice | Phase 2+ Evolution |
|---|---|---|
| Language | TypeScript (strict mode, no `any` without justification comment) | Same |
| App framework | **Next.js (single app)** — handles UI and API routes | Split into `apps/web` (Next.js) + `apps/api` (Express) when horizontal scaling or background processing demands it |
| Database & Auth | Supabase (PostgreSQL + Supabase Auth) | Same |
| AI Model | Claude (Anthropic) via `@anthropic-ai/sdk` | Same; model-agnostic abstraction layer added when a second model is needed |
| Repo | **Single repo, single Next.js app** | pnpm workspaces monorepo with packages split |
| Deploy | Vercel | Vercel + Railway/Fly.io when backend splits |
| Version Control | Git / GitHub | Same |
| IDE | VS Code | Same |
| API Testing | Postman | Same |
| Bank Feeds | (none) | Flinks — Phase 2 |
| i18n | `next-intl` — English, fr-CA, zh-Hant | Same |
| Background jobs | (none) | pg-boss — Phase 2 |
| Logging | `pino` with redact list | Same |

---

## Critical Architectural Invariants

These six invariants are the constitution of the system. Every line of code in Phase 1 and beyond must respect them. Where an invariant has a different Phase 1 form than its long-term form, both are stated explicitly.

### Invariant 1 — Service Layer (PHASE 1 form)

Business logic lives exclusively in `src/services/`. Next.js API routes, Next.js server components, and the Double Entry agent tool are all thin adapters over service functions. **No exceptions.** A route handler must never contain a database query. An agent tool must never contain accounting logic.

In Phase 2, when the monorepo split lands, this becomes "business logic lives exclusively in `packages/services`" — same rule, different folder.

### Invariant 2 — The Two Laws (PHASE 1 form, restated in service terms)

- **Law 1 — All database access goes through `src/services/`.** No Next.js API route, no Next.js server component, no agent tool, and no script may query Supabase directly. All reads and writes go through a service function. The service layer is the only abstraction that touches the database.
- **Law 2 — All journal entries are created by `journalEntryService.post()`.** Regardless of source (manual UI form, agent tool, future import path), every journal entry flows through this single function. No other code path constructs `journal_entries` rows.

These two laws ensure that accounting correctness and data integrity are enforced in exactly one place each. **Enforcement mechanism:** ESLint rule prohibits importing the Supabase client from anywhere outside `src/db/` and `src/services/`. Code review confirms every journal entry mutation flows through `journalEntryService.post()`. Phase 2 adds build-time enforcement via TypeScript project references when the monorepo splits.

In Phase 2, Law 1 narrows: "All database access goes through `packages/services`, and all agent-side database access goes through the Database Agent which wraps `packages/services`." Law 2 narrows: "All journal entries go through the Double Entry Agent which wraps `journalEntryService.post()`." The spirit is identical.

### Invariant 3 — The Four-Layer Truth Hierarchy

This is the single most important rule for resolving conflicts between parts of the system. When two layers disagree about what is true, the lower layer wins. Always. No exceptions.

```
Layer 4 — Cognitive Truth    → Agent (Double Entry, in Phase 1)
           Advisory only. The agent proposes. It is never authoritative.
           An agent saying "this entry is valid" means nothing if Layer 1 rejects it.

Layer 3 — Temporal Truth     → Event Stream (PHASE 2+ — reserved seat in Phase 1)
           What happened, in order, replayable. In Phase 2 the event stream is
           the single source of record for history. In Phase 1 the table exists
           but is empty; audit_log carries this responsibility temporarily.

Layer 2 — Operational Truth  → Service Layer + Middleware Invariants
           Business rules, authorization, routing logic.
           Enforced by service middleware before any database write.

Layer 1 — Physical Truth     → Database Constraints + Triggers
           The physics of the system. Cannot be bypassed by any code path.
           Debit=credit deferred constraint, period lock trigger, org_id NOT NULL,
           events table append-only trigger.
           If Layer 1 rejects something, it is rejected. Full stop.
```

**Why this matters in practice:**
- "Agent says posted but DB rejected" → DB wins. Entry never happened.
- "Service thinks valid but constraint rejects" → Constraint wins. Service gets an error.
- "Agent proposed account X" → Advisory only. Human confirms or rejects.

The hierarchy is unchanged from v0.4.0. The only Phase 1 caveat is that Layer 3 (event stream) is a reserved seat — see Invariant 5.

### Invariant 4 — Pre-Commit Invariant Validation

All invariant checks run BEFORE the database transaction commits. Invariants are NEVER enforced in code that runs after commit. The reason: in an accounting system, any code path that allows an invalid mutation to commit and then "fixes it up afterward" produces a window where the ledger is wrong and any concurrent reader sees the wrong number. The rule is absolute: validate first, mutate second, commit third — all inside a single database transaction that rolls back entirely on any failure.

**PHASE 1 form:** validation happens in service-layer middleware before the mutation, the mutation happens, the `audit_log` row is written, and the entire sequence commits as one transaction. If anything fails, everything rolls back.

**PHASE 2+ form:** validation happens in service-layer middleware, the mutation happens, the event is written to the events table, and the entire sequence commits as one transaction. The Audit Agent (now a real agent) is notified post-commit by pg-boss and updates the `audit_log` projection asynchronously. If the mutation or event write fails, the transaction rolls back and no event is ever written. The append-only trigger on the events table guarantees that whatever does get written cannot be retroactively rewritten.

The Phase 1→Phase 2 transition is non-breaking because:
1. The events table already exists in Phase 1 (reserved seat).
2. The append-only trigger is already installed.
3. The `audit_log` table continues to exist; it changes from "primary record" to "projection" but its schema does not change.
4. Service middleware grows an event-emit step but its existing pre-flight checks are unchanged.

### Invariant 5 — Event Stream as Single Source of Truth (PHASE 2+ form — DEFERRED IN PHASE 1)

> ⚠️ **PHASE 1 EXCEPTION:** This invariant does not hold in Phase 1. It is documented here so that all Phase 1 code is structured to make the Phase 2 transition non-breaking. **Do not write code in Phase 1 that assumes Invariant 5 holds.** Specifically: do not read from the events table, do not assume `audit_log` is a projection, do not build query patterns that depend on event replay.

**PHASE 2+ statement:** The event stream (`events` table, append-only) is the only primary source of truth in the system. Everything else is a derived projection:
- `audit_log` is a projection of events — never written to directly
- GL account balances are projections of `JournalEntryPostedEvent` records
- Dashboard figures are projections of events
- Canvas state is a projection of events

If a projection is wrong in Phase 2, fix it by correcting the projection query — never by patching the projection table directly. If you need to know what happened, read the event stream, not the projections.

**PHASE 1 reality:**
- The `events` table exists with all columns and the append-only trigger installed.
- Nothing writes to the events table in Phase 1.
- Nothing reads from the events table in Phase 1.
- `audit_log` is the actual record of what happened. It is written synchronously inside the same transaction as every mutation. It is the primary source of mutation history in Phase 1.
- This is a deliberate, documented, time-boxed simplification. It is not technical debt — it is scope discipline.

**Why deferring Invariant 5 is safe:**
- The append-only trigger on the events table means Phase 2 cannot retroactively corrupt the event stream when it starts writing.
- The `audit_log` schema is designed to be reconstructible from events in Phase 2 (every column maps to a field that will exist on the corresponding event type).
- When Phase 2 starts writing events, the existing `audit_log` rows from Phase 1 remain valid as historical records. New `audit_log` rows are then derived from events. There is no migration of existing audit rows.

**Why deferring Invariant 5 is NOT safe to do silently:**
- If a Phase 1 developer reads Invariant 5 as written and assumes the event stream exists, they will write code that breaks. This is why Section 0 lists this divergence and why this invariant is explicitly labeled "PHASE 2+".

### Invariant 6 — No Free-Form Data at Service Boundaries

The LLM's natural language reasoning stays inside the agent. Every field that crosses the agent-tool to service boundary must be typed, validated by Zod schema, and deterministic. No free-text amounts. No unvalidated account codes. No inferred values that weren't explicitly retrieved from the database. If the agent cannot produce a valid typed value for a required field, it must ask a clarifying question or return an error — not guess.

In Phase 1 this rule applies at exactly one boundary: the Double Entry agent tool calling `journalEntryService.post()`. In Phase 2 it generalizes to every agent-to-service call across the layered stack.

---

## Section 1 — Architecture Overview

### 1a. Folder Structure (PHASE 1 — Single Next.js App)

The folder structure inside `src/` deliberately mirrors what the future monorepo will look like. When Phase 2 splits the monorepo, each top-level `src/` folder becomes a `packages/*` directory with minimal code movement.

```
the-bridge/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── [locale]/                 # i18n: en, fr, zh-Hant
│   │   │   ├── (auth)/
│   │   │   │   ├── sign-in/
│   │   │   │   └── sign-out/
│   │   │   ├── [orgId]/              # Org-aware routes
│   │   │   │   ├── bridge/           # The Bridge UI (chat + canvas)
│   │   │   │   ├── accounting/
│   │   │   │   │   ├── chart-of-accounts/
│   │   │   │   │   ├── journals/
│   │   │   │   │   │   ├── new/      # Manual journal entry form
│   │   │   │   │   │   └── [id]/     # Journal entry detail
│   │   │   │   ├── reports/
│   │   │   │   │   └── pl/           # Basic P&L (read-only)
│   │   │   │   └── agent/
│   │   │   │       └── actions/      # AI Action Review queue (controller)
│   │   │   ├── consolidated/
│   │   │   │   └── dashboard/        # Stub, role-gated to Executive/Controller
│   │   │   └── admin/
│   │   │       └── orgs/             # Org creation with industry CoA template
│   │   ├── api/                      # Next.js API routes (the "backend" in Phase 1)
│   │   │   ├── health/
│   │   │   ├── orgs/
│   │   │   ├── accounting/
│   │   │   │   ├── journals/
│   │   │   │   ├── chart-of-accounts/
│   │   │   │   └── periods/
│   │   │   ├── agent/
│   │   │   │   ├── chat/             # Orchestrator entry point
│   │   │   │   └── actions/          # AI Action Review queries
│   │   │   └── ai-actions/
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── services/                     # ALL business logic — the only DB access path
│   │                                 # Phase 2: becomes packages/services
│   │   ├── context.ts                # ServiceContext type (trace_id, org_id, caller)
│   │   ├── middleware/
│   │   │   ├── invariants.ts         # withInvariants() wrapper
│   │   │   └── trace.ts              # Trace ID generation and propagation
│   │   ├── auth/
│   │   │   ├── auth.service.ts       # canUserPerformAction(), getUserMemberships()
│   │   │   └── types.ts
│   │   ├── orgs/
│   │   │   ├── org.service.ts        # CRUD for organizations
│   │   │   ├── membership.service.ts
│   │   │   └── types.ts
│   │   ├── accounting/
│   │   │   ├── journal-entry.service.ts        # postJournalEntry() — the heart
│   │   │   ├── chart-of-accounts.service.ts    # CoA CRUD + template loading
│   │   │   ├── period.service.ts               # isOpen(), lock(), unlock()
│   │   │   ├── tax-codes.service.ts            # GST/HST lookup
│   │   │   └── types.ts
│   │   ├── audit/
│   │   │   ├── audit.service.ts      # writeAuditLog() — called inside transaction
│   │   │   └── types.ts
│   │   └── reports/
│   │       ├── pl.service.ts         # Basic P&L for Phase 1
│   │       └── types.ts
│   │
│   ├── agent/                        # The Double Entry Agent and orchestrator
│   │                                 # Phase 2: becomes packages/agent with layers
│   │   ├── orchestrator/
│   │   │   ├── index.ts              # Main loop: receives message, routes to tools
│   │   │   ├── system-prompts/       # One per persona
│   │   │   │   ├── ap-specialist.ts
│   │   │   │   ├── controller.ts
│   │   │   │   └── executive.ts
│   │   │   └── tools.ts              # Tool registry: lists tools available to Claude
│   │   ├── tools/
│   │   │   ├── post-journal-entry.tool.ts      # The ONE agent tool that mutates
│   │   │   ├── list-chart-of-accounts.tool.ts  # Read-only lookup tool
│   │   │   ├── check-period-status.tool.ts     # Read-only lookup tool
│   │   │   └── suggest-account.tool.ts         # Reads from institutional memory
│   │   ├── session/
│   │   │   ├── agent-session.ts      # AgentSession type, persistence in Postgres
│   │   │   └── types.ts
│   │   ├── memory/
│   │   │   └── org-context.ts        # OrgContextManager — loads vendor rules etc.
│   │   ├── canvas/
│   │   │   └── directives.ts         # CanvasDirective discriminated union
│   │   └── client.ts                 # Anthropic SDK client wrapper
│   │
│   ├── contracts/                    # Phase 1: ONE FILE ONLY
│   │                                 # Phase 2: three-namespace package
│   │   └── post-journal-entry.contract.ts      # The one contract that exists
│   │
│   ├── db/                           # Supabase clients, types, migrations index
│   │                                 # Phase 2: becomes packages/db
│   │   ├── admin-client.ts           # Service-role client (server-only)
│   │   ├── user-client.ts            # User-scoped client (RLS-enforced)
│   │   ├── types.generated.ts        # Output of `supabase gen types`
│   │   └── README.md                 # Migration workflow
│   │
│   ├── shared/                       # Primitives, constants, i18n keys
│   │                                 # Phase 2: becomes packages/shared
│   │   ├── locales.ts                # ['en', 'fr', 'zh-Hant'] constant
│   │   ├── roles.ts                  # UserRole enum
│   │   ├── currencies.ts             # CAD as functional currency
│   │   ├── proposed-entry-card.ts    # ProposedEntryCard type
│   │   └── canvas-directive-types.ts # Types referenced by directives.ts
│   │
│   ├── lib/                          # Cross-cutting utilities
│   │   ├── logger.ts                 # pino instance with redact list
│   │   ├── env.ts                    # Boot-time env var assertion
│   │   └── i18n/                     # next-intl config
│   │
│   └── components/                   # React components
│       ├── bridge/
│       │   ├── BridgeLayout.tsx      # Three-zone split-screen
│       │   ├── ChatPanel.tsx
│       │   ├── CanvasPanel.tsx
│       │   ├── MainframeRail.tsx
│       │   └── canvas/               # Canvas view components
│       │       ├── ProposedEntryCard.tsx
│       │       ├── ChartOfAccountsView.tsx
│       │       ├── JournalEntryForm.tsx
│       │       ├── JournalEntryView.tsx
│       │       ├── JournalEntryList.tsx
│       │       ├── PLReportView.tsx
│       │       └── PlaceholderView.tsx        # For Phase 2+ stub directives
│       ├── ui/                       # Shared UI primitives
│       └── auth/
│
├── supabase/
│   ├── migrations/                   # SQL migrations applied via Supabase CLI
│   │   └── 001_initial_schema.sql
│   ├── seed.sql                      # 2 orgs + 3 users + 2 CoA templates
│   └── config.toml
│
├── tests/                            # The Three Tests floor
│   ├── integration/
│   │   ├── debit-credit-rejection.test.ts
│   │   ├── locked-period-rejection.test.ts
│   │   └── rls-cross-org-isolation.test.ts
│   └── helpers/
│       └── test-db.ts                # Local Supabase test harness
│
├── docs/
│   ├── prompt-history/
│   │   ├── CHANGELOG.md              # Master version log — every prompt version
│   │   ├── v0.1.0-initial.md
│   │   ├── v0.2.0-canvas-ux.md
│   │   ├── v0.3.0-layered-agents.md
│   │   ├── v0.4.0-architecture-hardened.md
│   │   └── v0.5.0-phase1-reality.md  # Current
│   └── troubleshooting/
│       └── rls.md                    # "If a query returns empty when you expect data..."
│
├── postman/
│   └── collection.json               # Updated per phase
│
├── messages/                         # next-intl translation files
│   ├── en.json
│   ├── fr.json
│   └── zh-Hant.json
│
├── .env.example
├── .nvmrc
├── package.json
├── tsconfig.json
├── next.config.js
└── PLAN.md                           # This file
```

**Why no `apps/` or `packages/` directory in Phase 1:** This is divergence #1 from Section 0. Single Next.js app, single `src/` tree. Folder names inside `src/` are chosen to mirror the future package layout so the Phase 2 split is mechanical: `src/services/` → `packages/services/src/`, `src/agent/` → `packages/agent/src/`, etc.

### 1b. Root `package.json` Scripts Block

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:start": "supabase start",
    "db:stop": "supabase stop",
    "db:reset": "supabase db reset",
    "db:migrate": "supabase db push",
    "db:seed": "supabase db reset && supabase db push && psql $LOCAL_DB_URL -f supabase/seed.sql",
    "db:generate-types": "supabase gen types typescript --local > src/db/types.generated.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

In Phase 2, when the monorepo splits, this becomes a workspace root with `concurrently` running `apps/web`, `apps/api`, and an agent worker. In Phase 1 there is one process: `next dev`.

### 1c. Request Lifecycle Diagrams

**Manual path** (user fills in a form, clicks Save):

```
Browser
  → Next.js page (form submission)
  → Next.js API route POST /api/accounting/journals
      → Supabase Auth JWT verified (middleware in src/middleware.ts)
      → ServiceContext constructed { trace_id, user_id, org_id, caller: 'manual_ui' }
      → journalEntryService.postJournalEntry(input, ctx)
          → withInvariants() middleware:
              ├─ trace_id present?
              ├─ idempotency_key present?
              ├─ user has membership in org_id?
              └─ org_id in input matches ctx.org_id?
          → BEGIN TRANSACTION
          ├─ idempotency check on ai_actions table
          ├─ periodService.isOpen(orgId, entryDate, ctx)
          ├─ Application-layer debit=credit check (early readable error)
          ├─ INSERT journal_entries
          ├─ INSERT journal_lines (deferred constraint checks debit=credit at COMMIT)
          ├─ INSERT audit_log (synchronous, inside same transaction)
          ├─ INSERT ai_actions (status: 'manual_post', confirming_user_id: user_id)
          └─ COMMIT — deferred constraint fires here; if debits ≠ credits, rollback
      → Returns JournalEntryResult
  → Next.js API route returns 200 with proposed_entry_card + canvas_directive
  → Browser updates UI
```

Notes on the manual path:
- Supabase Auth JWT verification happens in Next.js middleware (`src/middleware.ts`), not inside the API route handler.
- RLS applies as defense-in-depth: even though API routes use the service-role client, any Next.js server component reading directly uses the user-scoped client and is subject to RLS.
- The `audit_log` row is written inside the same transaction as the mutation (Phase 1 simplification — Invariant 5 deferred to Phase 2).

**Agent path (PHASE 1 — single agent, service-function tools):**

```
User types message in The Bridge chat panel
  → POST /api/agent/chat with message + agent_session_id
  → Orchestrator receives message
      ├─ Loads AgentSession from Postgres (session table)
      ├─ Loads OrgContext (vendor rules, fiscal calendar, approval rules)
      ├─ Generates trace_id if this is a new user intent
      └─ Sends message to Claude API with:
          ├─ Persona-specific system prompt
          ├─ Tool definitions: post_journal_entry (mutating, dry_run capable),
          │                    list_chart_of_accounts (read-only),
          │                    check_period_status (read-only),
          │                    suggest_account (reads institutional memory)
          └─ Conversation history from AgentSession

  Claude responds with a tool_use block (e.g., post_journal_entry with dry_run=true)
  → Orchestrator validates tool input against Zod contract
      ├─ If invalid: return validation error to Claude as tool_result
      │              (bounded retry: max 2 — see Section 5g)
      └─ If valid: invoke the service function
          → journalEntryService.postJournalEntry(input, ctx)
              with ctx.caller = 'agent_dry_run' and dry_run = true
          → Service runs all pre-flight checks
          → BEGIN TRANSACTION (read-only — no INSERTs)
          → Builds the proposed entry in memory (no DB writes)
          → ROLLBACK
          → Returns ProposedEntryCard + canvas_directive

  → Orchestrator sends tool_result back to Claude
  → Claude responds with text + the canvas_directive
  → API route returns to client with:
      ├─ Assistant message (text)
      └─ canvas_directive: { type: 'proposed_entry_card', card: {...} }
  → UI renders the ProposedEntryCard in the canvas panel
```

**Confirmation commit path:**

```
User clicks Approve on the ProposedEntryCard
  → Frontend generates idempotency_key UUID at this moment
    (one key per user confirmation intent — see Section 8f)
  → POST /api/agent/actions/confirm with { dry_run_entry_id, idempotency_key, trace_id }
  → API route constructs ServiceContext { trace_id, user_id, org_id, caller: 'agent_confirmed' }
  → journalEntryService.postJournalEntry(input, ctx) with dry_run = false
      → withInvariants() middleware
      → BEGIN TRANSACTION
      ├─ Idempotency check: SELECT FROM ai_actions WHERE idempotency_key = $1
      │   ├─ If found and status = 'confirmed': return existing result, COMMIT, done
      │   └─ If not found: proceed
      ├─ periodService.isOpen() — re-check (period may have been locked since dry-run)
      ├─ Application-layer debit=credit check
      ├─ INSERT journal_entries
      ├─ INSERT journal_lines
      ├─ INSERT audit_log (synchronous, inside same transaction)
      ├─ INSERT ai_actions with status='confirmed', confirming_user_id, trace_id
      └─ COMMIT — deferred constraint fires
  → Returns success
  → API returns updated canvas_directive (now type: 'journal_entry' with the new entry_id)
  → UI updates canvas to show the posted journal entry
```

### 1d. Double-Entry Integrity at the Database Level — Deferred Constraint, Not Trigger

This is one of the four resolved decisions. Specifying it precisely:

**Why deferred constraint, not trigger:** A per-row trigger on `journal_lines` cannot check `SUM(debits) = SUM(credits)` because at the moment any individual row is inserted, the other rows of the same entry have not been inserted yet. The trigger would have to look at a half-built entry. A deferred constraint, by contrast, runs at `COMMIT` time — by which point all lines of the entry have been inserted — and runs once for the entire transaction. This is the correct mechanism.

```sql
-- Inside the journal_lines table definition or as a separate constraint:

ALTER TABLE journal_lines
  ADD CONSTRAINT journal_entry_balanced
  CHECK (...) DEFERRABLE INITIALLY DEFERRED;

-- The actual implementation uses a constraint trigger because Postgres CHECK
-- constraints can only reference columns within a single row. A constraint
-- trigger declared as DEFERRABLE INITIALLY DEFERRED achieves the same effect
-- and runs once at COMMIT for the entire transaction:

CREATE OR REPLACE FUNCTION check_journal_entry_balanced()
RETURNS TRIGGER AS $$
DECLARE
  total_debit  NUMERIC;
  total_credit NUMERIC;
BEGIN
  SELECT
    COALESCE(SUM(debit_amount), 0),
    COALESCE(SUM(credit_amount), 0)
  INTO total_debit, total_credit
  FROM journal_lines
  WHERE journal_entry_id = NEW.journal_entry_id;

  IF total_debit <> total_credit THEN
    RAISE EXCEPTION 'Journal entry % is unbalanced: debits=%, credits=%',
      NEW.journal_entry_id, total_debit, total_credit
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER journal_entry_balanced_trg
  AFTER INSERT OR UPDATE ON journal_lines
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION check_journal_entry_balanced();
```

Period lock and events-table append-only enforcement remain as immediate triggers (not deferred). Only debit=credit needs deferral because only it requires looking at multiple rows.

### 1e. Migration & Type Generation Strategy

**Migration tool:** Supabase CLI migrations. Justification: keeps migrations close to Supabase Auth and RLS, no ORM dependency, plain SQL is the right level of abstraction for a financial system where the exact constraints matter.

**Type generation:** `supabase gen types typescript --local` after every migration. Justification: stays in sync with the actual schema, no hand-written database types to drift.

**Workflow:**
1. Write SQL migration file in `supabase/migrations/`
2. `pnpm db:migrate` (runs `supabase db push` against local Supabase)
3. `pnpm db:generate-types` (regenerates `src/db/types.generated.ts`)
4. Commit both the migration file and the regenerated types
5. Run the three integration tests
6. If tests pass, commit and push

### 1f. Long-Term Architecture Targets (PHASE 2+)

This subsection documents the long-term shape of the system. Phase 1 does not build any of this. It is captured here so future-you and future-developers know what the eventual target is.

**Target #1 — Monorepo split:**
```
apps/
  api/                 # Express backend
  web/                 # Next.js frontend (no API routes — calls api/)
packages/
  services/            # Lifted from src/services/
  agent/               # Lifted from src/agent/, with layers added
  contracts/
    transport/         # API boundary shapes
    agent/             # Agent-to-agent contracts
    events/            # Event schemas
  db/                  # Lifted from src/db/
  shared/              # Lifted from src/shared/
```
Trigger to do this split: any one of (a) the codebase exceeds ~25k LOC and search/refactor becomes painful, (b) a second deployable process is needed (background worker, dedicated agent service), (c) a second developer joins and needs build-time isolation between layers.

**Target #2 — Three-namespace contracts package:** When the monorepo splits, the single `src/contracts/post-journal-entry.contract.ts` file becomes the seed of `packages/contracts/agent/double-entry-agent.contract.ts`. New contracts are added as new agents are built. TypeScript project references enforce that `contracts/transport`, `contracts/agent`, and `contracts/events` cannot import from each other.

**Target #3 — pg-boss background worker:** Lands in Phase 2 alongside AP email ingestion. Runs the Audit Agent projection updater, OCR jobs, Flinks bank feed sync, and recurring invoice generation. Postgres-backed (no extra infrastructure beyond Supabase).

**Target #4 — Three-layer agent stack:** When the first workflow agent (AP) is built in Phase 2, the layered model is realized. See Section 5e for the full long-term agent architecture.

---

## Section 2 — Data Model

### 2a. Core Tables

The full table list. Every tenant-scoped table has `org_id` as a non-null foreign key to `organizations`. Multi-currency columns are present from day one even though Phase 1 only uses CAD. Multi-currency lands in Phase 4 but the columns exist now to avoid the painful retrofit.

| Table | Purpose | Phase 1 use? |
|---|---|---|
| `organizations` | The 50 family office entities | Yes |
| `memberships` | User ↔ org with role enum | Yes |
| `org_context` | Per-org institutional memory metadata | Yes (mostly empty) |
| `chart_of_accounts` | Per-org GL accounts | Yes |
| `chart_of_accounts_templates` | Industry templates seeded once | Yes (2 templates) |
| `fiscal_periods` | Per-org fiscal periods with `is_locked` | Yes |
| `journal_entries` | Header rows; one per accounting transaction | Yes |
| `journal_lines` | Debit/credit lines; multi-currency columns | Yes |
| `customers` | Per-org customer master | Schema only |
| `vendors` | Per-org vendor master | Schema only |
| `vendor_rules` | Learned GL mappings; `autonomy_tier` column | Schema only |
| `items` | Product/service catalog | Schema only |
| `invoices` | AR invoices (multi-currency cols) | Schema only |
| `invoice_lines` | AR invoice lines | Schema only |
| `bills` | AP bills (multi-currency cols) | Schema only |
| `bill_lines` | AP bill lines | Schema only |
| `payments` | Payment records | Schema only |
| `bank_accounts` | Per-org bank accounts | Schema only |
| `bank_transactions` | Bank feed transactions (multi-currency cols) | Schema only |
| `intercompany_relationships` | Which orgs transact with which; reciprocal account map | Schema only — populated in Phase 2 |
| `tax_codes` | GST/HST abstraction with effective dates | Yes (seeded) |
| `audit_log` | **PRIMARY mutation history in Phase 1.** Becomes a projection in Phase 2. | Yes — written synchronously |
| `ai_actions` | Every agent-initiated action with prompt, tool call, idempotency key, confirming user | Yes |
| `agent_sessions` | Persistent conversation state for the orchestrator | Yes |
| `events` | **Reserved seat in Phase 1.** Empty. Append-only trigger installed. | Yes (table exists, no writes) |

Schema notes:

**`journal_lines` multi-currency columns** (present from day one):
- `currency` TEXT NOT NULL DEFAULT 'CAD'
- `amount_original` NUMERIC(20,4) NOT NULL — the original currency amount
- `amount_cad` NUMERIC(20,4) NOT NULL — translated to functional currency
- `fx_rate` NUMERIC(20,8) NOT NULL DEFAULT 1.0

The same four columns exist on `bills`, `invoices`, and `bank_transactions`. In Phase 1, `currency` is always `'CAD'`, `amount_original = amount_cad`, and `fx_rate = 1.0`. Phase 4 starts using them for real.

**`journal_entries.intercompany_batch_id`** UUID nullable. Used in Phase 2 by the AP Agent to link reciprocal entries across orgs. In Phase 1 it is always NULL.

**`journal_entries.source`** ENUM accepts `'manual' | 'agent' | 'import'` from day one. Phase 1.1 only writes `'manual'` (manual UI form). Phase 1.2 adds `'agent'`. Phase 2+ adds `'import'`. The constraint is permissive from day one to avoid a Phase 1.2 migration.

**`vendor_rules.autonomy_tier`** ENUM `'always_confirm' | 'notify_auto' | 'silent_auto'` NOT NULL DEFAULT `'always_confirm'`. Reserved for the Phase 5e autonomy model. Phase 1 has no vendor rules — table is empty — but the column exists.

**`agent_sessions`** persistence: org switch = full session reset (new session row). Cleaned up after 30 days by a manual maintenance query (no scheduled job until pg-boss arrives in Phase 2).

### 2b. Key Database Invariants

State each as a named Postgres constraint or trigger:

| Invariant | Mechanism | Notes |
|---|---|---|
| `SUM(debits) = SUM(credits)` per journal entry | Constraint trigger `journal_entry_balanced_trg`, DEFERRABLE INITIALLY DEFERRED | Fires at COMMIT, not per row |
| Period must be open | Trigger on `journal_lines` INSERT/UPDATE; checks `fiscal_periods.is_locked` | Fires immediately |
| `org_id` NOT NULL on every tenant-scoped table | Column NOT NULL constraint | Per-table |
| `bill_lines.amount_original > 0` | CHECK constraint | |
| `journal_lines.amount_cad >= 0` (signed via debit/credit columns) | CHECK constraint | Prevents negative amounts; sign comes from which column |
| `ai_actions.idempotency_key` unique per org | UNIQUE INDEX `(org_id, idempotency_key)` | Enables idempotency checks |
| `events` table append-only | Trigger that raises exception on UPDATE or DELETE | Reserved seat |
| `journal_entries.entry_date` within `fiscal_periods` range | Trigger | |
| `chart_of_accounts.code` unique per org | UNIQUE INDEX `(org_id, code)` | |
| `memberships.role` from closed enum | Postgres ENUM type | |

### 2c. RLS Policies

Row Level Security is on for every tenant-scoped table. The pattern is the same: a user can read/write rows where they have a membership in that `org_id`.

```sql
-- Enable RLS
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_actions      ENABLE ROW LEVEL SECURITY;
-- (and every other tenant-scoped table)

-- journal_entries SELECT
CREATE POLICY journal_entries_select ON journal_entries
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM memberships
      WHERE user_id = auth.uid()
    )
  );

-- journal_entries INSERT
CREATE POLICY journal_entries_insert ON journal_entries
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM memberships
      WHERE user_id = auth.uid()
    )
  );

-- journal_entries UPDATE — only if period is not locked
CREATE POLICY journal_entries_update ON journal_entries
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM memberships
      WHERE user_id = auth.uid()
    )
    AND NOT EXISTS (
      SELECT 1 FROM fiscal_periods
      WHERE id = journal_entries.fiscal_period_id
        AND is_locked = true
    )
  );

-- ai_actions SELECT — initiator OR controller in the same org
CREATE POLICY ai_actions_select ON ai_actions
  FOR SELECT
  USING (
    initiating_user_id = auth.uid()
    OR org_id IN (
      SELECT org_id FROM memberships
      WHERE user_id = auth.uid()
        AND role IN ('controller', 'cfo')
    )
  );
```

**Service-role vs user-scoped clients (the rule):**

The Next.js API routes use the **Supabase service-role key** (which bypasses RLS) when writing on behalf of the user, because the service layer has already verified the user's permissions and is the trusted abstraction for DB writes. RLS exists as defense-in-depth.

Any Next.js server component that reads directly from Supabase uses the **user-scoped client** (the user's JWT, subject to RLS). This means if the service layer has a permission bug, RLS still catches it. Two layers, neither relies on the other.

**The rule:** `SUPABASE_SERVICE_ROLE_KEY` is imported only in `src/db/admin-client.ts` and is referenced only by code under `src/services/` and `src/app/api/`. It is never imported by anything under `src/app/[locale]/` (UI server components) or `src/components/`.

### 2d. First-Pass SQL Migration

The full `001_initial_schema.sql` is referenced here at high level — it will be written in full as part of the Phase 1.1 Execution Brief, not in the Bible. The Bible commits to the structure and constraints; the brief commits to the exact SQL.

The migration includes:
- All table DDL from Section 2a
- All constraints and triggers from Section 2b
- All RLS `ENABLE ROW LEVEL SECURITY` and `CREATE POLICY` statements from Section 2c
- All indexes from Section 2e
- Append-only trigger on `events` table
- Seed data: two industry CoA templates (`holding_company`, `real_estate`) inserted into `chart_of_accounts_templates`. Comment in the migration: `-- Phase 1.1 seeds two templates. Healthcare, hospitality, trading, restaurant added in Phase 2 when those orgs are created. If this needs to change before Phase 1.1 migration runs, flag in Open Questions.`

### 2e. Index Plan

Every index with the query pattern it serves:

| Index | Query pattern |
|---|---|
| `journal_lines(org_id, account_id, entry_date)` | P&L and balance sheet roll-ups |
| `journal_entries(org_id, fiscal_period_id, status)` | Period-scoped journal listing |
| `journal_entries(org_id, entry_date DESC)` | Recent activity feed |
| `invoices(org_id, customer_id, status)` | AR aging (Phase 2) |
| `bills(org_id, vendor_id, status)` | AP queue (Phase 2) |
| `bank_transactions(org_id, bank_account_id, posted_at)` | Bank reconciliation (Phase 2) |
| `ai_actions(org_id, created_at DESC, status)` | AI Action Review queue |
| `ai_actions(org_id, idempotency_key) UNIQUE` | Idempotency check |
| `vendor_rules(org_id, vendor_id)` | Institutional memory lookup (Phase 2) |
| `memberships(user_id, org_id) UNIQUE` | Permission check (called on every request) |
| `audit_log(org_id, created_at DESC)` | Audit trail browsing |
| `agent_sessions(user_id, org_id, last_message_at DESC)` | Session lookup |
| `chart_of_accounts(org_id, code) UNIQUE` | Account lookup by code |
| `fiscal_periods(org_id, start_date, end_date)` | Period lookup by date |

---

## Section 3 — The One Contract: Worked Example (`post_journal_entry`)

This is the single contract file in Phase 1. It mediates the boundary between the Double Entry agent tool (the function Claude calls) and the journal entry service. **Everything else in `src/services/*/types.ts` is plain TypeScript types — not contracts.**

Why this is the right place to draw the contract line: this is the only place in Phase 1 where untrusted LLM-generated input reaches a deterministic system. Every other service-to-service call inside Phase 1 is between trusted code paths and does not need bidirectional Zod validation. When Phase 2 adds more agents, more contracts get added — but only at agent-tool ↔ service boundaries.

### 3a. Zod Input Schema

Location: `src/contracts/post-journal-entry.contract.ts`

```typescript
import { z } from 'zod';

// (Plain English: Zod is a TypeScript library that validates that data
// matches an expected shape at runtime, not just at compile time.)

export const JournalLineSchema = z.object({
  account_id: z.string().uuid(),         // Retrieved from the database, never invented
  description: z.string().min(1).max(500),
  debit_amount: z.number().nonnegative(),
  credit_amount: z.number().nonnegative(),
  tax_code_id: z.string().uuid().nullable(),
}).refine(
  (line) => (line.debit_amount > 0) !== (line.credit_amount > 0),
  { message: 'Each line must have exactly one of debit_amount or credit_amount > 0' }
);

export const PostJournalEntryCommandSchema = z.object({
  // Required on every command
  _contract_version: z.literal('1.0.0'),
  trace_id: z.string().uuid(),
  idempotency_key: z.string().uuid(),

  // Business fields
  org_id: z.string().uuid(),
  entry_date: z.string().date(),         // ISO date format
  description: z.string().min(1).max(1000),
  reference: z.string().max(100).optional(),  // External reference number
  currency: z.literal('CAD'),            // Phase 1: CAD only
  fiscal_period_id: z.string().uuid(),
  lines: z.array(JournalLineSchema).min(2),
  source: z.enum(['manual', 'agent', 'import']),
  dry_run: z.boolean(),
}).refine(
  (cmd) => {
    const totalDebit  = cmd.lines.reduce((s, l) => s + l.debit_amount, 0);
    const totalCredit = cmd.lines.reduce((s, l) => s + l.credit_amount, 0);
    return Math.abs(totalDebit - totalCredit) < 0.001;
  },
  { message: 'Total debits must equal total credits' }
);

export type PostJournalEntryCommand = z.infer<typeof PostJournalEntryCommandSchema>;
```

The `.refine()` validator at the application layer is a readability optimization — it gives early, clear error messages. The hard guarantee comes from the deferred constraint at the database level (Section 1d). Both layers exist; neither relies on the other.

### 3b. Zod Output Schema

```typescript
export const ProposedEntryCardSchema = z.object({
  org_id: z.string().uuid(),
  org_name: z.string(),
  transaction_type: z.enum(['journal_entry', 'bill', 'payment', 'intercompany']),
  vendor_name: z.string().nullable(),
  matched_rule_label: z.string().nullable(),
  lines: z.array(z.object({
    account_code: z.string(),
    account_name: z.string(),
    debit_amount: z.number(),
    credit_amount: z.number(),
    currency: z.literal('CAD'),
  })),
  intercompany_flag: z.boolean(),
  reciprocal_entry_preview: z.unknown().nullable(),  // Phase 2
  agent_reasoning: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
  routing_path: z.enum(['standard', 'controller_review', 'dual_review', 'cfo_escalation'])
                 .nullable(),  // Phase 1: always null. Phase 2: populated.
  idempotency_key: z.string().uuid(),
  dry_run_entry_id: z.string().uuid(),
});

export const PostJournalEntryResultSchema = z.object({
  journal_entry_id: z.string().uuid().nullable(),  // null in dry-run
  status: z.enum(['draft', 'posted']),
  proposed_entry_card: ProposedEntryCardSchema,
  canvas_directive: z.discriminatedUnion('type', [
    z.object({ type: z.literal('proposed_entry_card'), card: ProposedEntryCardSchema }),
    z.object({ type: z.literal('journal_entry'), entryId: z.string().uuid(), mode: z.literal('view') }),
  ]),
});

export type ProposedEntryCard = z.infer<typeof ProposedEntryCardSchema>;
export type PostJournalEntryResult = z.infer<typeof PostJournalEntryResultSchema>;
```

### 3c. The Three Consumers

The same schema is imported by exactly three places in Phase 1:

1. **Next.js API route** at `src/app/api/accounting/journals/route.ts`:
   ```typescript
   import { PostJournalEntryCommandSchema } from '@/contracts/post-journal-entry.contract';
   const cmd = PostJournalEntryCommandSchema.parse(await req.json());
   ```

2. **Double Entry agent tool** at `src/agent/tools/post-journal-entry.tool.ts`:
   ```typescript
   import { PostJournalEntryCommandSchema } from '@/contracts/post-journal-entry.contract';
   // Tool definition for Claude function-calling uses the JSON Schema
   // generated from this Zod schema
   export const postJournalEntryTool = {
     name: 'post_journal_entry',
     description: 'Create a journal entry. Use dry_run=true first to preview.',
     input_schema: zodToJsonSchema(PostJournalEntryCommandSchema),
   };
   ```

3. **Manual journal entry form** at `src/app/[locale]/[orgId]/accounting/journals/new/page.tsx`:
   ```typescript
   import { PostJournalEntryCommandSchema } from '@/contracts/post-journal-entry.contract';
   // Used as a React Hook Form resolver for client-side validation
   const form = useForm({ resolver: zodResolver(PostJournalEntryCommandSchema) });
   ```

All three import from the same file. If the contract changes, all three break at compile time. This is the entire purpose of the contracts directory in Phase 1.

### 3d. Service Function Sketch

Location: `src/services/accounting/journal-entry.service.ts`

```typescript
import { withInvariants } from '@/services/middleware/invariants';
import { PostJournalEntryCommand, PostJournalEntryResult } from '@/contracts/post-journal-entry.contract';
import { ServiceContext } from '@/services/context';
import { periodService } from '@/services/accounting/period.service';
import { auditService } from '@/services/audit/audit.service';
import { adminClient } from '@/db/admin-client';
import { logger } from '@/lib/logger';

// (Plain English: a service function is a TypeScript function that contains
// the business logic for one operation. It is the only place where the database
// is touched. Routes and tools call services; services call the database.)

export const postJournalEntry = withInvariants(
  async (
    cmd: PostJournalEntryCommand,
    ctx: ServiceContext
  ): Promise<PostJournalEntryResult> => {
    const log = logger.child({
      trace_id: ctx.trace_id,
      org_id: cmd.org_id,
      caller: ctx.caller,
      idempotency_key: cmd.idempotency_key,
    });

    log.info('postJournalEntry: start');

    // 1. Idempotency check — before any work
    const existingAction = await adminClient
      .from('ai_actions')
      .select('id, status, result_journal_entry_id')
      .eq('org_id', cmd.org_id)
      .eq('idempotency_key', cmd.idempotency_key)
      .maybeSingle();

    if (existingAction.data?.status === 'confirmed') {
      log.info('postJournalEntry: idempotent replay, returning existing result');
      return loadExistingResult(existingAction.data.result_journal_entry_id, ctx);
    }

    // 2. Period lock check — call periodService directly (no Period Agent in Phase 1)
    const periodStatus = await periodService.isOpen(
      cmd.org_id,
      cmd.entry_date,
      ctx
    );
    if (!periodStatus.is_open) {
      throw new Error(
        `Period ${periodStatus.period_name} is locked. ` +
        `Post to a different date or ask a controller to unlock the period.`
      );
    }

    // 3. Application-layer debit=credit check (early readable error)
    const totalDebit  = cmd.lines.reduce((s, l) => s + l.debit_amount, 0);
    const totalCredit = cmd.lines.reduce((s, l) => s + l.credit_amount, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new Error(
        `Debits (${totalDebit}) do not equal credits (${totalCredit})`
      );
    }

    // 4. Build the proposed entry card (used in both dry-run and confirmed paths)
    const proposedCard = await buildProposedEntryCard(cmd, ctx);

    // 5. Dry-run path — return the card without writing
    if (cmd.dry_run) {
      log.info('postJournalEntry: dry-run, returning card without commit');
      return {
        journal_entry_id: null,
        status: 'draft',
        proposed_entry_card: proposedCard,
        canvas_directive: { type: 'proposed_entry_card', card: proposedCard },
      };
    }

    // 6. Confirmed path — write everything inside ONE transaction
    //
    //    PHASE 1 ORDERING:
    //    1. BEGIN
    //    2. INSERT journal_entries
    //    3. INSERT journal_lines (deferred constraint pending)
    //    4. INSERT audit_log    ← synchronous in Phase 1
    //    5. INSERT ai_actions
    //    6. COMMIT              ← deferred constraint fires here
    //
    //    PHASE 2 ORDERING (target — see Section 15e):
    //    1. BEGIN
    //    2. INSERT journal_entries
    //    3. INSERT journal_lines
    //    4. INSERT events       ← replaces direct audit_log write
    //    5. INSERT ai_actions
    //    6. COMMIT
    //    7. pg-boss notifies Audit Agent → updates audit_log projection

    const result = await adminClient.rpc('post_journal_entry_transactional', {
      p_command: cmd,
      p_user_id: ctx.user_id,
      p_trace_id: ctx.trace_id,
    });

    if (result.error) {
      log.error({ err: result.error }, 'postJournalEntry: transaction failed');
      throw result.error;
    }

    log.info({ journal_entry_id: result.data.journal_entry_id }, 'postJournalEntry: committed');

    return {
      journal_entry_id: result.data.journal_entry_id,
      status: 'posted',
      proposed_entry_card: proposedCard,
      canvas_directive: {
        type: 'journal_entry',
        entryId: result.data.journal_entry_id,
        mode: 'view',
      },
    };
  }
);
```

The actual `BEGIN`/`COMMIT` happens inside the Postgres function `post_journal_entry_transactional` so the entire mutation, audit log write, and ai_actions write are atomic. The function definition is part of the migration in Section 2d.

This is the template every other service function follows. Future service functions copy this shape: idempotency check, pre-flight validation, dry-run capability if mutating, transactional commit with audit_log inside, structured logging with `trace_id`.

---

## Section 4 — The Bridge UI Architecture

### 4a. The Three-Zone Layout

The Bridge is always rendered in three zones:

1. **Mainframe Rail** (~64px fixed, far left, always visible). Icon-only navigation. Contains direct-launch icons for Chart of Accounts, Journal Entry, AP Queue (placeholder in Phase 1), and P&L Report. Clicking any icon bypasses the agent and loads the canvas view directly. **This is the graceful degradation path when the Claude API is unavailable.** Labeled "Mainframe" in the UI — the Star Trek metaphor is intentional.

2. **Chat Panel** (~380px, collapsible via keyboard shortcut). Conversation history with the Double Entry Agent, message input with file drop zone, persona-specific suggested prompts on empty state. Agent messages may contain inline ProposedEntryCards with Approve/Reject buttons.

3. **Canvas Panel** (fills remaining width). Renders whatever the agent last directed it to show. Has its own back/forward navigation history independent of the chat. Also rendered when a Mainframe icon is clicked.

**The Mainframe constraint (CRITICAL):** Every Phase 1 canvas component must work without the agent. The Mainframe icon for Chart of Accounts loads the CoA view directly with no agent involvement. The Mainframe icon for Journal Entry loads the manual entry form with no agent involvement. **No canvas component is allowed to require the agent to function.** The agent is a composer of canvas views; the canvas views are standalone. This guarantees the entire system remains usable when Claude is rate-limited, slow, or down.

### 4b. The `canvas_directive` Contract

This is the most important UI interface in the system. Defined as a TypeScript discriminated union in `src/agent/canvas/directives.ts`. Every agent tool response includes a `canvas_directive` alongside its data. The frontend reads the directive and renders the matching component. **The agent never produces HTML. It produces structured data. The UI renders it.**

```typescript
// src/agent/canvas/directives.ts
//
// (Plain English: a discriminated union is a TypeScript pattern where a shared
// "type" field tells you which shape the rest of the object has. The frontend
// switches on `directive.type` and renders the matching component.)

import { ProposedEntryCard } from '@/shared/proposed-entry-card';

export type CanvasDirective =
  // Phase 1 — implemented:
  | { type: 'chart_of_accounts'; orgId: string }
  | { type: 'journal_entry'; entryId: string; mode: 'view' | 'edit' }
  | { type: 'journal_entry_form'; prefill?: Record<string, unknown> }
  | { type: 'journal_entry_list'; orgId: string }
  | { type: 'proposed_entry_card'; card: ProposedEntryCard }
  | { type: 'report_pl'; orgId: string; from: string; to: string }
  | { type: 'none' }  // Agent responded with text only

  // Phase 2+ — STUB types. The directive is defined now so adding the
  // canvas component later does not change any contract. The frontend
  // renders a "Coming in Phase 2" placeholder for these in Phase 1.
  | { type: 'ap_queue'; orgId: string }
  | { type: 'vendor_detail'; vendorId: string; orgId: string }
  | { type: 'bank_reconciliation'; accountId: string }
  | { type: 'ar_aging'; orgId: string }
  | { type: 'consolidated_dashboard' };
```

Adding any new agent tool in Phase 2+ requires adding its directive type here first. The canvas renderer is a single switch statement that maps each `type` to a component or to `<PlaceholderView />` for Phase 2+ types.

**Bidirectional state (Phase 2+):** When the user interacts with the canvas (clicks a P&L line, selects a vendor), that action should eventually be communicated back to the agent as context. **Phase 1: stub this as a commented field on `AgentSession`.** Phase 2: implement so the agent knows what the user is looking at without them typing "the thing I just clicked."

### 4c. The ProposedEntryCard — Data Shape

Defined in `src/shared/proposed-entry-card.ts`. The same type is used by the contract output (Section 3b), the canvas directive, and the React component that renders the card.

Fields:
- `org_id`, `org_name`
- `transaction_type`: `'journal_entry' | 'bill' | 'payment' | 'intercompany'`
- `vendor_name` (nullable) + `matched_rule_label` (e.g. "Learned from 12 previous entries — Office Supplies")
- `lines`: array of `{ account_code, account_name, debit_amount, credit_amount, currency }`
- `intercompany_flag` (boolean) + `reciprocal_entry_preview` (Phase 2 — always null in Phase 1)
- `agent_reasoning`: string, 1-2 sentences plain English, **localizable template with parameters not free text**
- `confidence`: `'high' | 'medium' | 'low'` — **display only in Phase 1.** The card shows it but no system uses it for routing.
- `routing_path`: nullable enum — **reserved field, always null in Phase 1.** Phase 2 populates and routes.
- `idempotency_key`: string
- `dry_run_entry_id`: string

The UI renders this as a card with: Approve button (primary), Reject button with optional free-text reason, "Edit before approving" link that fires a `journal_entry_form` directive with the data pre-filled.

**Note on `agent_reasoning` localization:** The agent does not produce English prose for this field. It produces a structured object like `{ template_key: 'matched_vendor_rule', params: { vendor: 'Acme Corp', rule_count: 12, account: 'Office Supplies' } }` and the UI renders the localized version using `next-intl`. This is required so French and Mandarin users see correct localized reasoning. The full template format is finalized in the Phase 1.2 brief.

### 4d. Canvas Phasing Table

Build what proves the concept. Stub everything else.

| Canvas Feature | Phase 1.1 | Phase 1.2 | Phase 2 | Phase 3 |
|---|---|---|---|---|
| Three-zone layout (Mainframe + Chat + Canvas) | Build | | | |
| Mainframe icon rail | Build | | | |
| Canvas navigation history (back/forward) | Build | | | |
| Chart of Accounts canvas view | Build | | | |
| Manual Journal Entry form | Build | | | |
| Journal Entry list | Build | | | |
| Journal Entry detail view | Build | | | |
| Basic P&L canvas view (read-only) | Build | | | |
| Chat Panel shell (Claude API not yet wired) | Build | | | |
| Suggested prompts on empty state (static) | Build | | | |
| ProposedEntryCard component | | Build | | |
| Agent transparency disclosure ("What I did") | | Build | | |
| AI Action Review queue | | Build | | |
| Canvas tabs (multiple views open) | Stub interface only | | Build | |
| Bidirectional canvas-agent state | Stub interface only | | Build | |
| Contextual action bar on hover | | | Build | |
| AP Queue canvas view | Stub (placeholder) | | Build | |
| Bank reconciliation canvas view | Stub (placeholder) | | Build | |
| Vendor detail canvas view | Stub (placeholder) | | Build | |
| Consolidated dashboard canvas view | Stub (placeholder) | | Build | |
| Mobile responsive layout | | | | Build |
| Multi-pane comparison view | | | | Build |

"Stub interface only" means: define the TypeScript interface and the canvas directive type, render `<PlaceholderView />` that says "Coming in Phase 2", but do not implement the feature.

### 4e. Suggested Prompts (Empty State)

When a user opens The Bridge with an empty chat, show persona-appropriate suggested actions as clickable chips — not a blank input.

- **AP Specialist (Phase 1):** "Make a journal entry" / "Show me the chart of accounts" / "Is this period locked?" *(AP-specific prompts arrive in Phase 2)*
- **Controller:** "Review pending AI actions" / "Show me last month's P&L" / "Open the chart of accounts"
- **Executive:** "Show consolidated cash position" *(stub)* / "Show me the P&L" / "What entities do I have?"

Static arrays per role in Phase 1, keyed off `AgentSession.role`. Data-driven in Phase 2.

### 4f. Traditional UI Screens Required in Phase 1

Both the agent path and the manual path are first-class. Every canvas view must also be reachable through the Mainframe — not just by asking the agent. Phase 1 minimum:

| Route | Phase | Notes |
|---|---|---|
| `/[locale]/(auth)/sign-in` | 1.1 | Supabase Auth |
| `/[locale]/(auth)/sign-out` | 1.1 | |
| `/[locale]/[orgId]/bridge` | 1.1 (shell) / 1.2 (chat live) | The Bridge UI |
| `/[locale]/[orgId]/accounting/chart-of-accounts` | 1.1 | CoA list and detail |
| `/[locale]/[orgId]/accounting/journals` | 1.1 | Journal entry list |
| `/[locale]/[orgId]/accounting/journals/new` | 1.1 | Manual journal entry form |
| `/[locale]/[orgId]/accounting/journals/[id]` | 1.1 | Journal entry detail view |
| `/[locale]/[orgId]/reports/pl` | 1.1 | Basic P&L (read-only) |
| `/[locale]/[orgId]/agent/actions` | 1.2 | AI Action Review queue (controller) |
| `/[locale]/consolidated/dashboard` | 1.1 (stub only) | Role-gated to Executive/Controller |
| `/[locale]/admin/orgs` | 1.1 | Org creation with industry CoA template |

---

## Section 5 — AI Agent Design

> **Read this section against Section 0.** This section describes both the Phase 1 reality (one agent, service-function tools) and the Phase 2+ target (three-layer stack). Subsections 5a–5d describe Phase 1. Subsection 5e describes the Phase 2+ target.

### 5a. The Phase 1 Agent: One Orchestrator, One Mutating Agent

Phase 1 has exactly one agent: the **Double Entry Agent**, plus the orchestrator that routes user messages to it. Everything the agent calls — chart of accounts lookup, period status check, permission check — is a plain TypeScript service function, not another agent.

**Why this is the right shape for Phase 1:** the agent abstraction (folder, prompt template, contract, dedicated process) earns its keep when multiple agents share infrastructure or coordinate workflows. Phase 1 has one agent doing one job. Treating its dependencies as agents would be ceremony with no benefit. When Phase 2 builds the AP Workflow Agent — which orchestrates multiple operations — the layered model becomes correct. See Section 5e for the long-term target.

### 5b. The Orchestrator (Phase 1)

Location: `src/agent/orchestrator/`

The orchestrator is the main loop. Receives a user message, loads `AgentSession` and `OrgContext`, decides what to do, calls the appropriate tools, returns the response.

In Phase 1.2 the orchestrator handles exactly four intents:
- "Make a journal entry for..." → Double Entry Agent (`post_journal_entry` tool)
- "Show me the chart of accounts" → `list_chart_of_accounts` tool
- "Is this period locked?" → `check_period_status` tool
- "What can I do here?" → returns suggested prompts based on persona

It does NOT handle: AP workflow, AR workflow, bank reconciliation, reporting beyond basic P&L view (those are Phase 2 — they require workflow agents that don't exist yet).

**System prompt template** (one per persona — full prompts written in the Phase 1.2 brief):
- Tells the model: who the user is, what org they are in, what role permits, what tools are available
- Cardinal rule: never invent financial data, always retrieve through tools
- Cardinal rule: when uncertain, ask a clarifying question
- Cardinal rule: respond in the user's locale

### 5c. The Double Entry Agent (Phase 1)

This is the only agent in Phase 1. It exists as a tool definition the orchestrator passes to Claude for function-calling. The "agent" is the combination of:

1. The tool definition (`src/agent/tools/post-journal-entry.tool.ts`) — the JSON schema Claude sees
2. The handler (calls `journalEntryService.postJournalEntry()`)
3. The contract (`src/contracts/post-journal-entry.contract.ts`) that validates input

Pre-flight checks happen inside the service function (Section 3d), not inside the agent tool. The agent tool is a thin handler that:
1. Validates the Zod input
2. Constructs the `ServiceContext` with `trace_id`, `org_id`, `user_id`, `caller: 'agent_dry_run'` or `'agent_confirmed'`
3. Calls the service
4. Returns the result

**Dry-run flow:** Every mutating call goes dry-run first. The agent calls `post_journal_entry` with `dry_run: true`, gets back a `ProposedEntryCard`, sends it to the user via the canvas. Only after the user clicks Approve does the orchestrator call the same tool with `dry_run: false` and the same `idempotency_key`.

**What the agent does NOT do directly:**
- Read or write the database (goes through the service)
- Construct journal entries (the service does it; the agent provides input)
- Compute confidence (the service computes it from institutional memory)
- Compute account suggestions (the `suggest_account` tool reads from `vendor_rules` via the service)

This satisfies the Two Laws (Invariant 2) at the agent boundary.

### 5d. Institutional Memory (Phase 1 — minimal)

Location: `src/agent/memory/org-context.ts`

The `OrgContextManager` loads per-org context at session start. In Phase 1.2 it loads:
- Vendor rules (empty in Phase 1 — table exists, populated in Phase 2)
- Fiscal calendar (which periods exist, which are locked)
- Approval rules (Phase 2 — empty in Phase 1)

In Phase 1, the agent uses very little institutional memory because there are no learned vendor rules yet. The `suggest_account` tool falls back to keyword matching against the chart of accounts when `vendor_rules` is empty. **The agent never invents an account code.** It either retrieves one from `vendor_rules`, retrieves a candidate from the CoA via keyword match (and presents it as a suggestion in the ProposedEntryCard), or asks the user.

All memory is stored in the database. Never only in the model context window — that is ephemeral.

### 5e. Long-Term Three-Layer Agent Stack (PHASE 2+ TARGET)

> This subsection describes where the agent architecture is going. Phase 1 does not build any of this. It is documented here so the eventual evolution is non-breaking.

The long-term vision is a three-layer agent stack where each layer has clear responsibilities and the layers below it can be built and tested independently.

```
Layer 3 — Workflow Agents (Phase 2+: orchestrate business workflows)
          AP Agent, AR Agent, Reporting Agent, Reconciliation Agent
          They coordinate Layer 2 agents. They do NOT touch the database
          or construct journal entries themselves.

Layer 2 — Domain Agents (Phase 2+: encapsulate accounting concepts)
          Double Entry Agent   → ONLY thing that creates journal entries
          Chart of Accounts Agent → ONLY thing that manages account structure
          Period Agent         → enforces fiscal period rules and locking
          (In Phase 1, the Double Entry Agent already exists in this role.
           Chart of Accounts and Period are service functions that get
           promoted to agents only when Layer 3 needs them.)

Layer 1 — Foundation Agents (Phase 2+: shared infrastructure)
          Auth Agent      → permission checking, wraps Supabase Auth + memberships
          Database Agent  → ONLY component that imports packages/services
          Audit Agent     → receives MutationEvent post-commit via pg-boss,
                            updates audit_log projection from events
          (In Phase 1, all three are service functions: authService,
           journalEntryService et al, and auditService. They get promoted
           to agents in Phase 2 when shared cross-agent infrastructure
           justifies the abstraction.)
```

**The promotion criterion:** A service function gets promoted to a "Layer 1 agent" when it has multiple cross-agent consumers AND benefits from being in a separate process (e.g., the Audit Agent benefits from running as a pg-boss worker rather than synchronously). Until both conditions hold, it stays a service function.

**Two Laws under the layered model:**
- Law 1: No workflow agent (Layer 3) reads or writes the database directly. All DB access goes through the Database Agent (Layer 1) which wraps `packages/services`.
- Law 2: No workflow agent constructs a journal entry directly. All journal entries go through the Double Entry Agent (Layer 2) which wraps `journalEntryService.post()`.

These are the same Two Laws restated for the multi-agent world. Phase 1's Two Laws (Invariant 2) collapse into these in Phase 2 with no spirit change.

### 5f. Anti-Hallucination Rules (non-negotiable)

These rules apply in Phase 1 and forever:
- Financial amounts always come from service tool outputs, never from model-generated text
- Every mutating tool has `dry_run: boolean` — confirmation flow always calls dry-run first
- No agent may reference an account code, vendor name, or amount it has not first retrieved from the database in the current session
- Structured outputs only — no free-text journal entries, ever
- The agent never invents an `account_id`, `org_id`, `fiscal_period_id`, or any other database identifier
- When the agent does not know a required value, it asks a clarifying question — it does not guess

### 5g. Tool-Call Validation Retry Policy

When the agent produces a tool call that fails Zod validation:
- The validation error is returned to Claude as the `tool_result` content
- The error message includes the specific field that failed and the expected shape
- Claude is given the opportunity to retry — **bounded at maximum 2 retries per user intent**
- After 2 failed retries, the orchestrator returns an error to the user: "I'm having trouble interpreting this. Can you try rephrasing?"

This policy is finalized in the Phase 1.2 brief alongside Claude API failure handling.

### 5h. Agent Autonomy Model (PHASE 1 = Always Confirm)

| Tier | Phase 1 | Phase 2+ |
|---|---|---|
| **Always Confirm** | Default and only option | Default for new orgs |
| **Notify & Auto-Post** | Not available | Controller can enable per vendor rule |
| **Silent Auto** | Not available | Phase 4+ consideration |

Every agent-initiated mutation in Phase 1 requires explicit user confirmation. The `vendor_rules.autonomy_tier` column exists from day one with default `'always_confirm'`, but no UI exposes the higher tiers in Phase 1.

---

## Section 6 — Intercompany Transaction Handling

> **PHASE 2 — table exists in Phase 1.1, workflow lands in Phase 2**
>
> The full intercompany workflow is described here for completeness, but no part of this workflow runs in Phase 1. The `intercompany_relationships` table exists in the Phase 1.1 migration as a Category A foundation (cheap to add now, painful to retrofit later) but it is empty and unread until Phase 2.

This is called out as the primary source of errors and inefficiency in family office accounting. It gets its own section so the data model is correct from day one.

**The full Phase 2 workflow:**
1. AP specialist receives a bill from Vendor X
2. The AP Agent calls a `detect_intercompany` service function which checks `intercompany_relationships` — Vendor X is actually Entity B, one of the 50 orgs
3. Agent flags the bill as intercompany: "This bill is from [Entity B]. Should I create a reciprocal revenue entry in Entity B's ledger at the same time?"
4. The ProposedEntryCard shows both entries side by side — the bill in Entity A AND the reciprocal revenue entry in Entity B
5. User approves both in a single confirmation
6. Service layer creates both journal entries in a single Postgres transaction with a shared `intercompany_batch_id` (the column already exists on `journal_entries` from Phase 1)
7. Audit log records both entries linked to the same `ai_action`

The `intercompany_relationships` table stores: which pairs of orgs transact, the default GL account mapping (Entity A's "Due To Entity B" account ↔ Entity B's "Due From Entity A" account), and which controller role approves these entries.

The consolidated dashboard (Phase 3) shows intercompany eliminations as a separate "Eliminations" column in the consolidated P&L view.

**Phase 1 commitment:** the table exists with a comment in the migration: `-- Populated in Phase 2 by AP Agent. Do not write to manually.`

---

## Section 7 — Phase Structure

> Section 7 is rewritten in v0.5.0. The old Phase 0/1/2/3/4 structure is replaced with a phased reality-driven model: Phase 1.1 (Foundation, includes former Phase 0), Phase 1.2 (The Agent), Phase 1.3 (Reality Check, time-boxed 3 weeks), then Phase 2+ informed by what Phase 1.3 teaches.

### The governing principle

Each sub-phase has concrete exit criteria. **No sub-phase begins until the previous sub-phase's exit criteria pass.** No timeline commitments — measure units of work, not calendar time. Expect every estimate to be 2x what the founder initially thinks. When something takes 3x what you expected, the signal is "this task is harder than it looks" — that is data about where the system's real complexity is hiding.

The detailed Phase 1.1 Execution Brief is **Part 2 of PLAN.md and is written separately after the Bible is approved**. This Bible commits to the structure and exit criteria; the brief commits to the exact SQL, file paths, test specifications, and seed script.

### Phase 1.1 — Foundation (no agent yet)

**Goal:** A correctly structured system with real multi-org, multi-user roles, real Chart of Accounts, real `events` table (reserved seat), real `tax_codes` table. No agent yet. Just the data model, auth, UI shell, and the Mainframe path proven to work.

**Includes the former Phase 0 scaffolding** — there is no separate Phase 0 anymore. Project setup, env vars, Supabase initialization, the first migration, the seed script, and the three integration tests are all part of Phase 1.1.

**What gets built (high-level):**
- Single Next.js app scaffold with the folder structure from Section 1a
- Supabase project (local + remote dev) with the first migration
- All Category A tables: organizations, memberships, chart_of_accounts, fiscal_periods, journal_entries, journal_lines, ai_actions, audit_log, agent_sessions, events (reserved seat with append-only trigger), tax_codes, intercompany_relationships, plus Phase 2 schema-only tables
- All Category A constraints: deferred constraint for debit=credit, period lock trigger, append-only trigger on events, RLS on every tenant-scoped table
- Two industry CoA templates seeded: `holding_company` and `real_estate`
- Boot-time env var assertion (`src/lib/env.ts`)
- `pino` structured logger with redact list (`src/lib/logger.ts`)
- `ServiceContext` type with `trace_id`, `org_id`, `caller` as required fields
- `withInvariants()` middleware wrapper (skeleton, validates trace_id and org_id presence)
- `next-intl` configured for `en`, `fr`, `zh-Hant`
- URL structure `/[locale]/[orgId]/...` from day one
- Sign-in / sign-out via Supabase Auth
- Org switcher in nav (role-aware)
- Manual journal entry form (the manual path, no agent)
- Chart of Accounts canvas view
- Journal entry list and detail canvas views
- Basic P&L canvas view (read-only)
- Three-zone Bridge layout shell with the Mainframe rail (chat panel exists but the Claude API is not yet wired)
- Org creation flow with industry CoA template selection
- Seed script: 2 orgs (one of each industry), 3 users (one per role), memberships
- The Three Tests:
  1. Integration test: insert an unbalanced journal entry, assert the deferred constraint rejects it at COMMIT
  2. Integration test: try to post to a locked period, assert the trigger rejects it
  3. Integration test: query from User A's session, assert User A cannot see Org B's data (RLS works)
- `docs/troubleshooting/rls.md` written
- `docs/prompt-history/CHANGELOG.md` populated through v0.5.0
- Postman collection v1: health check, org CRUD, CoA CRUD, journal entry CRUD, period check

**Phase 1.1 Exit Criteria (all must pass before Phase 1.2 begins):**
- `pnpm dev` starts cleanly, zero TypeScript errors
- `pnpm typecheck` passes
- All three integration tests pass
- Sign-in works in all three locales
- Two real organizations created using the seed script
- Three real users created with different roles via the seed script
- Org switcher correctly shows different orgs based on role
- Chart of Accounts loads correctly for each org from its industry template
- A manual journal entry can be posted via the form, appears in the journal entry list, appears in the audit log
- Posting an unbalanced journal entry produces a clear error
- Posting to a locked period produces a clear error
- Logs show `trace_id`, `org_id`, `user_id` on every request
- Boot fails clearly if `SUPABASE_SERVICE_ROLE_KEY` or `ANTHROPIC_API_KEY` is missing
- Mainframe icons load all Phase 1.1 canvas views without involving the agent
- Postman v1 collection runs end-to-end against local Supabase

### Phase 1.2 — The Agent

**Goal:** The Double Entry Agent is wired into the chat panel. A user can type "make a journal entry for $500 debit Office Supplies and credit Accounts Payable", the orchestrator routes to the Double Entry Agent tool, the service runs in dry-run mode, the ProposedEntryCard appears in the canvas, the user clicks Approve, the journal entry posts, the controller can see it in the AI Action Review queue.

**What gets built (high-level):**
- `src/contracts/post-journal-entry.contract.ts` — the one contract file
- `src/agent/orchestrator/` — main loop, system prompts per persona
- `src/agent/tools/post-journal-entry.tool.ts` — agent tool wrapping the service
- `src/agent/tools/list-chart-of-accounts.tool.ts`
- `src/agent/tools/check-period-status.tool.ts`
- `src/agent/tools/suggest-account.tool.ts` (falls back to keyword match in Phase 1)
- `src/agent/session/` — `agent_sessions` table integration
- `src/agent/memory/org-context.ts` — minimal Phase 1 form
- `src/agent/canvas/directives.ts` — full discriminated union with Phase 2 stubs
- `src/agent/client.ts` — Anthropic SDK wrapper
- ProposedEntryCard React component with Approve / Reject / Edit buttons
- Agent transparency disclosure ("What I did and why" — collapsed by default)
- AI Action Review queue screen (controller role) at `/[locale]/[orgId]/agent/actions`
- Suggested prompts on empty state (static, persona-aware)
- Tool-call validation retry policy implementation (max 2 retries)
- Claude API failure handling: explicit "agent unavailable" state in chat panel with retry button; Mainframe still works
- Prompt caching enabled by default for system prompts
- Postman collection v1.1: agent chat endpoint, action confirm endpoint

**Phase 1.2 Exit Criteria (all must pass before Phase 1.3 begins):**
- 20 real journal entries posted through the agent across at least two real organizations
- Every entry shows correct double-entry (debit=credit)
- Every entry appears in `audit_log` with the correct `trace_id`
- Idempotency works: submit the same entry twice, get one result
- A controller can see every agent action in the AI Action Review queue
- Posting to a locked period via the agent path produces a clear error in the chat
- Killing the Anthropic API key (forcing failure) leaves the Mainframe path fully functional
- All Phase 1.1 exit criteria still pass

### Phase 1.3 — Reality Check (time-boxed: 3 weeks)

**Goal:** Use it for real. Find what's wrong. Document it. This is the input to Phase 2 scoping.

**This is the most important phase.** Architecture decisions made in Phases 1.1 and 1.2 are based on assumptions. Phase 1.3 tests them against reality.

**Concrete deliverables:**
1. **Concrete goal:** Close one full month of books for one real entity (recommended: the holding company) using only this system. Definition of done: month-end trial balance in The Bridge matches the corresponding figures in whatever shadow system is currently used.
2. **Friction journal:** A running markdown file at `docs/friction-journal.md`. Every time the founder wants to do X and can't, it goes in the journal. Every time something is clunky. Every time the agent gets something wrong. Categories: "missing feature", "bug", "agent error", "workflow friction", "architecture problem".
3. **Triage at the end:** At the 3-week mark, every entry in the friction journal is categorized as one of: bug (fix in current phase), missing feature (Phase 2 scope), agent error (Phase 2 prompt/contract refinement), architecture problem (the Bible was wrong about something — propose v0.6.0).

**No new code is built in Phase 1.3 except critical bug fixes.** Resist the urge. The point is to learn, not to build.

**Time-box: 3 weeks.** Not "ongoing." At the end, the friction journal is the input to the Phase 2 Execution Brief.

**Phase 1.3 Exit Criteria:**
- One full month of books closed for one real entity
- Friction journal contains at least 20 entries (if it has fewer, the founder isn't using the system enough)
- Every friction journal entry is triaged
- The architecture-problem category is reviewed: any entries here trigger a v0.6.0 Bible update before Phase 2 begins

### Phase 2 and beyond — informed by Phase 1.3

The Phase 2 brief is written after Phase 1.3 triage. At a high level Phase 2 will include:
- Monorepo split (Section 1f Target #1)
- Three-namespace contracts package (Section 1f Target #2)
- pg-boss background worker (Section 1f Target #3)
- AP Agent: email ingestion → OCR (AWS Textract) → Chart of Accounts Agent → Double Entry Agent → confirmation
- Intercompany detection workflow (Section 6)
- Vendor management + institutional memory (vendor rules, autonomy tier promotion)
- AP Queue canvas view, Bill list, Vendor detail
- Flinks bank feed integration (Canadian banks)
- Bank reconciliation canvas view
- Layer 1/2/3 agent stack realized (Section 5e)
- Confidence becomes routing input (Section 15d)
- Events table starts being written; Audit Agent becomes a pg-boss worker; `audit_log` becomes a projection (Invariant 5 finally holds)
- Canvas tabs, bidirectional canvas-agent state
- Contextual action bar
- AR Agent (customers, invoices, payments received)

But these are **target items**, not commitments. The actual Phase 2 brief is informed by the friction journal. Items that the friction journal proves matter most go first; items that the friction journal proves don't matter get deprioritized.

**Phase 3+ targets** (consolidated dashboard, GST/HST filing, multi-currency activation, mobile responsive, autonomy tier promotion, variance analysis, cash flow forecasting, audit-ready export) are deferred until at least one full Phase 2 cycle has happened.

---

## Section 8 — The Hard Problems

### 8a. Bank Feed Integration (Canada-Specific) — PHASE 2

- **Flinks** (Canadian-first, supports all major Canadian banks) — not Plaid. Requires a business agreement and sandbox credentials.
- Architecture: Flinks webhook → Next.js API route (Phase 1) or Express endpoint (Phase 2 monorepo) → `bank_transactions` table → agent reconciliation queue
- Known gap: smaller Canadian credit unions may not be on Flinks. Document on first encounter.

### 8b. Multi-Currency and FX Revaluation — PHASE 4 activation, PHASE 1 schema

- Activation in Phase 4 but the data model supports it from Phase 1
- `journal_lines`, `bills`, `invoices`, `bank_transactions` all have `currency`, `amount_original`, `amount_cad`, `fx_rate` columns from day one
- CAD is the functional currency (Canadian family office)
- FX rate source recommendation: Bank of Canada daily rates API (Phase 4)

### 8c. Tax Compliance (GST/HST Abstraction) — PHASE 1 schema, PHASE 2 enforcement

- Never hardcode tax rates. The `tax_codes` table stores rate, jurisdiction, and effective date ranges from day one.
- Phase 1.1 seeds the table with current Canadian federal/provincial rates
- Tax rate changes require a new `tax_codes` row with an `effective_from` date — never an UPDATE to an existing row

### 8d. Reconciliation UX — PHASE 2

- Two-column canvas: bank transactions on the left, proposed matches on the right
- Agent pre-populates matches via `match_bank_transaction_to_bill`
- User approves matches one by one or bulk-approves high-confidence matches
- Unmatched transactions can be assigned to a GL account directly in the canvas

### 8e. Human Review of AI Actions in Bulk — PHASE 1 (basic) + PHASE 2 (bulk operations)

- Phase 1: AI Action Review queue exists, controllers can filter and approve/reject one at a time
- Phase 2: bulk approve for pending high-confidence items
- Every approval or rejection is recorded in `ai_actions.confirming_user_id` from Phase 1

### 8f. Idempotency — PHASE 1 from day one

- Every mutating tool call carries an `idempotency_key` UUID
- **The frontend generates a new key when the user clicks Approve on a ProposedEntryCard** — one key per user confirmation intent. Dry-runs do not need idempotency keys because they write nothing.
- The service layer checks `ai_actions` for an existing row with the same key before doing any work
- If found and status is Confirmed: return the existing result
- If found and status is Pending: return the existing proposed card (this case mostly applies to Phase 2 async workflows)

### 8g. Claude API Failure Handling — PHASE 1.2

- Chat panel has explicit states: ready, sending, agent_thinking, agent_error, agent_unavailable
- On API error: chat panel shows error with retry button. Mainframe rail remains fully functional. **The user can always reach every Phase 1 canvas view directly through the Mainframe.**
- On rate limit: same behavior with a "Try again in a moment" message
- Detailed error categorization and retry policy finalized in the Phase 1.2 brief

### 8h. AgentSession Persistence — PHASE 1.2

- `AgentSession` lives in Postgres in the `agent_sessions` table — same database as everything else
- One row per session, keyed by `session_id`
- **Org switch = new session.** Full reset. Prevents cross-entity contamination of institutional memory and conversation context.
- Cleaned up after 30 days. In Phase 1, cleanup is a manual maintenance query. In Phase 2, pg-boss runs it on a schedule.

### 8i. Cost Budget Posture — PHASE 1.2

- Default model: Claude Sonnet
- Structured outputs only (JSON via tool use, not free text)
- Prompt caching enabled by default for system prompts
- No per-user-per-day cost cap in Phase 1
- Exact cost tracking and budgets revisited after Phase 1.3 reality check

### 8j. Streaming vs Batch Agent Responses — PHASE 1.2 batch, PHASE 2 streaming

- Phase 1.2 uses non-streaming (batch) responses. Simpler, easier to debug.
- Phase 2 adds streaming for better UX
- Decision deferred explicitly so it is not a silent default

### 8k. Data Export / Audit Package — PHASE 3+

- IFRS and Canadian compliance both require data portability
- Users must be able to export their ledger
- Not Phase 1 but documented here as a known requirement so the data model supports it

---

## Section 9 — Security & Secrets Management

### 9a. Environment Variable Table

| Variable | Consumed By | Client-Safe? | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | UI components, server, services | Yes | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | UI components (client-side Supabase Auth) | Yes | Public key, safe for browser |
| `SUPABASE_SERVICE_ROLE_KEY` | `src/db/admin-client.ts`, services, API routes | **NO** | Never expose to browser |
| `ANTHROPIC_API_KEY` | `src/agent/client.ts` only | **NO** | Never expose to browser |
| `NODE_ENV` | all | Yes | |
| `LOCAL_DB_URL` | seed script only | **NO** | Local development only |

**Boot-time assertion** in `src/lib/env.ts`:

```typescript
const REQUIRED_SERVER_ENV = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

export function assertEnv(): void {
  const missing = REQUIRED_SERVER_ENV.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(
      `FATAL: Missing required environment variables: ${missing.join(', ')}. ` +
      `App cannot start. See .env.example.`
    );
  }
}
```

This is called in `src/app/layout.tsx` and in any standalone script entry point. The app does not start without the required vars.

### 9b. .env File Strategy

- `.env.example` committed to repo with placeholder values and comments
- Real `.env.local` files gitignored (Next.js convention)
- `NEXT_PUBLIC_` prefix required for any variable used in client components
- **Rule:** `SUPABASE_SERVICE_ROLE_KEY` must never appear in any file under `src/app/[locale]/`, `src/components/`, or anywhere else that compiles into the client bundle. Only `src/db/admin-client.ts`, `src/services/`, and `src/app/api/` may import the admin client.

### 9c. Production Secrets

- Vercel environment variables for production deployments
- Recommend upgrading to a dedicated secrets manager (Doppler, AWS Secrets Manager) when the team grows beyond 3 people

### 9d. Key Rotation

- Service-role key: Supabase dashboard → regenerate → update Vercel env → redeploy
- Anthropic API key: same pattern
- JWT signing: managed entirely by Supabase

### 9e. Logging Hygiene Rules

Enforced by the `pino` redact list configured at boot in `src/lib/logger.ts`:

```typescript
import pino from 'pino';

export const logger = pino({
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.api_key',
      '*.service_role_key',
      '*.anthropic_api_key',
      '*.bank_account_number',
      '*.routing_number',
      '*.sin',
      '*.tax_id',
      '*.card_number',
      'jwt',
      'access_token',
      'refresh_token',
    ],
    censor: '[REDACTED]',
  },
  base: {
    env: process.env.NODE_ENV,
  },
});
```

Rules enforced by code review:
- Never log a full JWT
- Never log `SUPABASE_SERVICE_ROLE_KEY` or `ANTHROPIC_API_KEY`
- Never log bank account numbers, SINs, tax IDs, or full card numbers
- `audit_log` and `ai_actions` store entity IDs and references — never raw sensitive values
- Every log line includes `trace_id`, `org_id`, and `user_id` (where available) for cross-correlation

---

## Section 10 — Performance & Scale Notes

| Concern | Phase 1 approach | Phase 2+ approach |
|---|---|---|
| Index plan | Section 2e covers all known query patterns | Add as new patterns emerge |
| Bulk operations | None in Phase 1 | All bulk service functions accept arrays and execute single transactional writes |
| Transactional writes | Every mutating service runs in a single Postgres transaction; partial writes not permitted | Same |
| Async / background work | **None.** Phase 1 has no async work. | pg-boss with workers for Audit Agent projection updates, OCR, bank feed sync, recurring invoices |
| N+1 avoidance | List endpoints use Postgres JOINs to eager-load related rows | Same |
| Caching | None. No Redis. No query caching. | Defer until report generation becomes slow (Phase 3+) |

The "no async work in Phase 1" decision is deliberate. Adding pg-boss now means running a worker process that does nothing. It lands in Phase 2 alongside AP email ingestion, which is the first thing that genuinely needs it.

---

## Section 11 — Internationalisation (i18n)

i18n is a Day 1 requirement, not an afterthought.

- **`next-intl`** for all UI strings
- All agent response text must be localizable: agent tools return structured data (template_key + params), not English prose; the UI layer renders localized text from the structured output using `next-intl`
- URL structure: `/[locale]/[orgId]/...` — locale is always the first segment, orgId is always the second
- Translation files: `messages/en.json`, `messages/fr.json`, `messages/zh-Hant.json`
- `AgentSession` includes the user's locale; the agent system prompt instructs Claude to respond in that locale
- Date/number formatting: `Intl.DateTimeFormat` and `Intl.NumberFormat` with the user's locale — never hardcode date or currency formatting
- **Traditional Mandarin uses `zh-Hant`, not `zh-TW`**. Ensure the `next-intl` locale config uses `zh-Hant` as the key.

**The "structured agent responses" rule** — this is non-negotiable for trilingual support. The agent does not produce English prose for any user-visible field. It produces a structured object that the UI renders. The `agent_reasoning` field on the ProposedEntryCard, the assistant's chat message, the error messages — all are template_key + params, not free text. Phase 1.2 brief defines the exact template format.

---

## Section 12 — Developer Onboarding

### Prerequisites

- Node.js v20+ (use `nvm`; `.nvmrc` is in the repo)
- pnpm v9+ (`npm install -g pnpm`)
- Supabase CLI (`brew install supabase/tap/supabase` or platform equivalent)
- Postman
- Anthropic API key (request from team lead)
- VS Code with extensions: ESLint, Prettier, Tailwind CSS IntelliSense

### Step-by-Step Setup

1. `git clone [repo] && cd [repo]`
2. `nvm use` (installs correct Node version from `.nvmrc`)
3. `pnpm install`
4. `cp .env.example .env.local` and fill in all values:
   - `NEXT_PUBLIC_SUPABASE_URL` — from `supabase status`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from `supabase status`
   - `SUPABASE_SERVICE_ROLE_KEY` — from `supabase status` (changes on every reset)
   - `ANTHROPIC_API_KEY` — from team lead
5. `pnpm db:start` (starts local Supabase)
6. `pnpm db:migrate` (runs all SQL migrations)
7. `pnpm db:generate-types` (generates TypeScript types)
8. `pnpm db:seed` (creates 2 orgs, 3 users, loads CoA templates)
9. `pnpm dev` (starts Next.js)
10. Open `http://localhost:3000` — should see The Bridge sign-in screen
11. Sign in as one of the seeded users (credentials in seed script output)
12. `pnpm test` — should see all three integration tests pass
13. Import `postman/collection.json` into Postman, run the Health Check request

### Troubleshooting

- **Wrong Node version:** `nvm use`. If nvm not installed, install it first.
- **`SUPABASE_SERVICE_ROLE_KEY` error at boot:** Run `supabase status`. The local key changes every reset. Update `.env.local`.
- **RLS blocking a query (empty results where data should exist):** See `docs/troubleshooting/rls.md`. First suspect: you're using the user-scoped client where you should be using the admin client.
- **Agent not responding:** Check `ANTHROPIC_API_KEY` is set. Check the chat panel error state.
- **Tests fail with "deferred constraint":** The test is correctly catching an unbalanced entry. Check the test expectation.

### Contribution Conventions

- Branch naming: `feat/[ticket-id]-short-description`, `fix/[ticket-id]-description`
- Commit style: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`)
- New service function → `src/services/[module]/[entity].service.ts`
- New agent tool (Phase 1.2+) → `src/agent/tools/[tool-name].tool.ts`
- New Zod schema → if it's an agent-tool ↔ service contract, it goes in `src/contracts/`. Otherwise it's a plain TypeScript type in `src/services/[module]/types.ts`. **Resist the urge to put everything in `src/contracts/`** — only the agent boundary belongs there in Phase 1.
- Every PR must include: updated Postman collection (if API changed), updated migration file (if schema changed), updated `docs/prompt-history/CHANGELOG.md` (if a Bible-level decision changed)

---

## Section 13 — What Not to Build (Commodity vs. Differentiation)

| Capability | Build or Buy? | Reason |
|---|---|---|
| OCR on invoice PDFs | Buy — AWS Textract or Google Document AI (Phase 2) | Commodity, unreliable to build from scratch |
| Bank feed connectivity | Buy — Flinks (Canada) — Phase 2 | Regulatory and bank relationship problem |
| Tax rate tables | Buy — Avalara or TaxJar — Phase 3+ | Jurisdictional compliance, not your core IP |
| E-invoicing compliance | Buy if needed — Phase 4+ | Niche, complex |
| Email parsing | Build a thin wrapper — Postmark inbound or Gmail API — Phase 2 | Simple enough; you want control |
| Double-entry accounting logic | **Build** — core IP | Do not use an accounting library; own the journal |
| Agent orchestration | **Build** on Claude API | Agent behavior IS the product |
| Institutional memory / vendor rules | **Build** | Unique to your multi-entity family office context |
| Consolidated multi-entity reporting | **Build** | No off-the-shelf tool handles your structure well |
| The Bridge UI | **Build** | This is the product's identity |

---

## Section 14 — Resolved Decision Log

> v0.4.0 carried this section as an "Open Architectural Question." v0.5.0 resolves it. The section is kept in place — short — so future-you doesn't re-litigate the decision when the audit_log/events question comes up again in Phase 2.

### Decision: CRUD + audit_log in Phase 1, event sourcing as Phase 2+ target

**Question asked in v0.4.0:** Should the accounting ledger be event-sourced (append-only events that are projected into balances) or traditional CRUD with an audit table?

**Arguments for event sourcing (full):**
- Immutability is natural — no UPDATE or DELETE on financial records, ever
- Point-in-time balance queries are trivial (replay events up to any timestamp)
- Natural fit for AI agent actions (each action is an event)
- Easier to audit, easier to reverse (a reversal is just another event)
- Better alignment with how accountants actually think (transactions are events)

**Arguments against full event sourcing in Phase 1:**
- Projection queries (current balance of account X) require aggregating all events — expensive without a materialized view strategy
- Supabase has no native event store pattern; you'd be building infrastructure
- Solo developer, the operational complexity of managing projections and snapshots is significant
- The audit table approach achieves 80% of the benefit with 20% of the complexity

**Decision (v0.5.0):**

Phase 1 uses **traditional CRUD with a strong audit table**, written synchronously inside the mutation transaction. The `journal_entries` + `journal_lines` model is append-only by convention (no UPDATE or DELETE — corrections are made via reversal entries, which is IFRS-correct). The `audit_log` table captures every write inside the same transaction.

The `events` table exists from Phase 1.1 as a **reserved seat**: the table is created with all columns and the append-only trigger installed, but nothing writes to it. This means the Phase 2 transition to event sourcing requires no schema migration — Phase 2 just starts writing events.

Phase 2 makes the events table the primary source of truth, demotes `audit_log` to a projection updated by the Audit Agent via pg-boss, and Invariant 5 becomes true. See Invariant 5 (Phase 2+ form) and Section 15e (Phase 2 ordering diagram).

**Why this is the right answer:** It captures all the long-term benefit of event sourcing (the reserved table, the append-only guarantee, the schema designed to support events) without any of the Phase 1 complexity (no projection updaters, no async workers, no replay logic). The cost of switching in Phase 2 is one migration that adds the event-write step to the service middleware — no table changes, no data migration.

**Status:** RESOLVED. Do not re-litigate without evidence from Phase 1.3 friction journal that the synchronous audit_log approach is causing real problems.

---

## Section 15 — Agent Communication Contract Rules

> This section defines the formal interface between the agent and the deterministic system beneath it. **In Phase 1, this applies at exactly one boundary: the Double Entry agent tool calling `journalEntryService.postJournalEntry()`.** When Phase 2 adds more agents, these rules generalize to every agent-to-service call.

### 15a. The Core Rule

**Agent tools never call services directly without going through a typed command contract.** In Phase 1, this means: the Double Entry agent tool's input and output are validated by `src/contracts/post-journal-entry.contract.ts` at both the agent side and the service side.

A command contract is not just a type. It is an enforced gate. Before any command reaches the service layer, it must pass Zod `.parse()` validation against its contract schema. If it fails, the error returns to the agent with a clear typed message. Nothing proceeds. The service layer never sees malformed input.

### 15b. The Five Rules (Phase 1 form)

**Rule 1 — Typed Command Contracts at the Agent Boundary**
The single agent-to-service boundary in Phase 1 (Double Entry agent tool ↔ journal entry service) is mediated by a contract in `src/contracts/`. The contract is the source of truth for the input shape. The agent tool imports it. The service imports it. The frontend form imports it.

**Rule 2 — Schema Validation at Both Ends**
The agent tool validates its input against the contract before sending. The service validates the incoming command against the same contract before processing. Both ends validate. Neither trusts the other.

**Rule 3 — Idempotency on Every Mutating Command**
Every command that writes to the database carries an `idempotency_key` UUID. `idempotency_key` is required at the contract level, not optional. The Database Agent (Phase 2) or `journalEntryService` (Phase 1) checks `ai_actions` for an existing row with the same key before doing any work.

**Rule 4 — No Free-Form Data at the Boundary**
The LLM's reasoning stays inside the agent. What crosses the boundary into the deterministic system must be:
- A UUID retrieved from the database (not a name the LLM invented)
- A numeric amount parsed from a validated source (not inferred)
- An enum value from a closed set (not a free-text category)
- A date in ISO format (not "last Tuesday")

If the agent cannot produce a valid typed value for a required field, it asks a clarifying question.

**Rule 5 — Trace ID on Every Call**
Every command carries a `trace_id` UUID generated when the user's intent first reaches the orchestrator. This ID propagates through every layer: Agent → Contract → Service → Database → audit_log (Phase 1) or Event → Projection (Phase 2). Every layer logs the trace_id. When something goes wrong, filter logs by trace_id.

### 15c. Contract Versioning Strategy

**Additive changes (adding optional fields):** never breaking. Deploy freely. No version bump required.

**Required field additions:** make the field optional with a sensible default first. Deploy callers to use it. Then make it required in the next version.

**Removals or renames:** create a new contract version (`PostJournalEntryCommand_v2`). Run both in parallel. Set a deprecation date. Delete v1 only after all callers migrated. Document in `docs/prompt-history/CHANGELOG.md`.

**The `_contract_version` field:** every contract includes a literal version field. This makes the contract version visible in every log entry and database record, making version drift debuggable after the fact.

### 15d. The Semantic Confidence Routing Graph (PHASE 2+ TARGET)

> **PHASE 1 form: confidence is display only.** The ProposedEntryCard shows `confidence: 'high' | 'medium' | 'low'`. The user sees it. Nothing routes on it. The `routing_path` field exists on the ProposedEntryCard type but is always `null` in Phase 1.

**Phase 2 target:**

```
High confidence  → Standard AP Queue (AP specialist reviews and approves)
Medium confidence → Controller approval required before AP Queue
Low confidence   → Dual review: AP specialist + controller must both approve
Novel pattern    → Escalation: controller + CFO notification, no auto-queue
```

Confidence is computed by the Chart of Accounts Agent and Double Entry Agent using institutional memory: vendor history match quality, amount within expected range, account code consistency with past entries, intercompany flag consistency. The routing graph is enforced at the command level — the `proposed_entry_card` output's `routing_path` field tells the orchestrator which queue receives the card.

**Why this is Phase 2:** Routing requires the AP Queue to exist. The AP Queue is Phase 2. Reserving the field on the type now means Phase 2 wires routing without changing the type or the contract.

### 15e. Behavioral Invariants Implementation — Two Ordering Diagrams

The ordering of validation, mutation, audit, and (eventually) event emission is the most important sequence in the system. Phase 1 and Phase 2 use different orderings. Both are documented here side by side so the difference is impossible to miss.

#### PHASE 1 (CURRENT) — Synchronous audit_log inside the transaction

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1 ORDERING                                            │
│                                                             │
│  1. Service middleware invariants run (pre-flight)          │
│     ├─ trace_id present?                                    │
│     ├─ idempotency_key present (mutating)?                  │
│     ├─ caller identity verified?                            │
│     └─ org_id matches user's memberships?                   │
│         │                                                   │
│         ▼                                                   │
│  2. BEGIN TRANSACTION                                       │
│     │                                                       │
│  3. Idempotency check (SELECT ai_actions)                   │
│     │                                                       │
│  4. Period lock check (SELECT fiscal_periods)               │
│     │                                                       │
│  5. INSERT journal_entries                                  │
│     │                                                       │
│  6. INSERT journal_lines                                    │
│     │                                                       │
│  7. INSERT audit_log    ◄──── synchronous, same txn         │
│     │                                                       │
│  8. INSERT ai_actions                                       │
│     │                                                       │
│  9. COMMIT              ◄──── deferred constraint fires     │
│     │                       (debit=credit checked here)     │
│     ▼                                                       │
│  Done                                                       │
│                                                             │
│  If anything in steps 1-9 fails: ROLLBACK. The mutation,    │
│  the audit_log row, and the ai_actions row are all          │
│  reverted. Atomicity is guaranteed. The events table is     │
│  not touched in Phase 1.                                    │
└─────────────────────────────────────────────────────────────┘
```

#### PHASE 2+ (TARGET) — Event-sourced with async projections

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE 2 ORDERING                                            │
│                                                             │
│  1. Service middleware invariants run (pre-flight)          │
│     │                                                       │
│  2. BEGIN TRANSACTION                                       │
│     │                                                       │
│  3. Idempotency check                                       │
│     │                                                       │
│  4. Period lock check                                       │
│     │                                                       │
│  5. INSERT journal_entries                                  │
│     │                                                       │
│  6. INSERT journal_lines                                    │
│     │                                                       │
│  7. Event middleware invariants run (sequencing)            │
│     ├─ Is this event a legal transition?                    │
│     └─ Will the Audit Agent be notified? (always true)      │
│     │                                                       │
│  8. INSERT events       ◄──── append-only, same txn         │
│     │                                                       │
│  9. INSERT ai_actions                                       │
│     │                                                       │
│ 10. COMMIT              ◄──── deferred constraint fires     │
│     │                                                       │
│ 11. pg-boss publishes JournalEntryPostedEvent  (POST-COMMIT)│
│     │                                                       │
│ 12. Audit Agent worker receives event                       │
│     ├─ Updates audit_log projection                         │
│     └─ Retries on failure                                   │
│     │                                                       │
│ 13. Other projection workers run (balances, dashboards)     │
│                                                             │
│  Steps 1-10 are atomic. If anything fails, the entire       │
│  transaction rolls back. The event is never written.        │
│  The mutation never happened.                               │
│                                                             │
│  Steps 11-13 happen after commit. They are retried on       │
│  failure by pg-boss. The event stream is never corrupted    │
│  because the event is written in the same transaction as    │
│  the mutation.                                              │
└─────────────────────────────────────────────────────────────┘
```

**The critical difference:** In Phase 1, the audit_log is written synchronously inside the mutation transaction (step 7). In Phase 2, the events table is written inside the transaction (step 8) and the audit_log is updated asynchronously by a pg-boss worker after commit (step 12). Both orderings preserve atomicity of the mutation. The Phase 2 ordering also makes the event stream the primary record and the audit_log a projection.

**Why Phase 1 is acceptable:** The Phase 1 ordering is strictly simpler. It does not use the events table at all. It does not use pg-boss. It does not have async projection updaters. The audit_log row is in the same transaction as the mutation, so atomicity is guaranteed. The only thing Phase 1 lacks compared to Phase 2 is the event stream — which is acceptable because Phase 1 doesn't read from the event stream either.

**Why the Phase 1 → Phase 2 transition is non-breaking:**
- The events table already exists (Phase 1.1 reserved seat)
- The append-only trigger is already installed
- The audit_log table schema does not change — Phase 2 just stops writing it directly and starts writing it from the worker
- The existing Phase 1 audit_log rows remain valid as historical records
- No data migration is required

### 15f. Contracts Package Evolution (PHASE 2+ TARGET)

In Phase 1, `src/contracts/` contains exactly one file: `post-journal-entry.contract.ts`. This is sufficient because Phase 1 has exactly one agent-tool ↔ service boundary.

In Phase 2, when the monorepo splits and workflow agents arrive, `packages/contracts/` becomes a three-namespace package:

```
packages/contracts/
├── transport/        # API boundary shapes (REST request/response)
├── agent/            # Agent-to-agent and agent-tool ↔ service contracts
└── events/           # Event schemas (JournalEntryPostedEvent, etc.)
```

Each namespace has its own `tsconfig.json` and compiles independently. TypeScript project references enforce that the namespaces cannot import from each other — if an agent contract tries to import a transport type, the build fails at graph resolution time. ESLint is a second layer of enforcement, not the primary one.

**Why this is Phase 2, not Phase 1:** Three-namespace project references add real value when (a) there are multiple consumers per contract, (b) cross-namespace import is a real risk, and (c) the team needs build-time enforcement. Phase 1 has none of these. Adding the three-namespace structure now is ceremony.

**The migration when Phase 2 arrives:** `src/contracts/post-journal-entry.contract.ts` becomes `packages/contracts/agent/post-journal-entry.contract.ts`. New contracts are added in their appropriate namespace as new agents and events are built.

---

## Section 16 — Documentation

> v0.5.0 removes the ADR scaffolding from this section. ADRs are not pre-populated. The prompt history changelog is the only documentation file required by the Bible.

### `docs/prompt-history/CHANGELOG.md` — required, populated through v0.5.0

This is the master version log. Every prompt version is documented with what changed and why. Pre-populated in Phase 1.1 with v0.1.0 through v0.5.0:

- **v0.1.0** — Initial Zoho-style module surface and flat tool catalog
- **v0.2.0** — Bridge UI introduced; canvas_directive protocol; Mainframe rail
- **v0.3.0** — Three-layer agent stack proposed; Two Laws; Phase 1 scoped to manual journal entry
- **v0.4.0** — Architecture hardened; four-layer truth hierarchy; pre-commit invariants; three-namespace contracts; trace-id observability; semantic confidence routing
- **v0.5.0** — Phase 1 reality alignment; eight long-term targets deferred to Phase 2+; PLAN.md split into Bible (Part 1) + Phase Briefs (Part 2); Category A/B/C scope discipline; four resolved decisions

### Why no ADRs in Phase 1

ADRs are valuable when they document decisions made in real engineering tradeoffs with the participants present. Pre-populated ADRs become cargo-cult docs that rot. The Bible itself (this document) is the source of architectural decisions in Phase 1. When Phase 1.1, 1.2, or 1.3 generates a real architectural decision worth recording — for example, "we tried X and it failed, here's what we changed and why" — that decision is added to the Bible as a v0.5.x point release, with the changelog entry explaining what changed and why. ADRs as a separate format may be added later, but only when there is a real decision to record.

### Why the prompt history changelog stays

The prompt history is genuinely valuable independent of ADRs. It tells future-you (and future contributors) how the architecture evolved and why each version made the changes it did. It is cheap to maintain — one entry per Bible version — and it answers the question "why is the system shaped this way?" which is the most common question that comes up six weeks into a project.

---

## Section 17 — Category A / B / C Scope Discipline

> v0.5.0 introduces this section. It is the rule for deciding what goes into Phase 1 and what gets deferred. Every Phase 1.1, Phase 1.2, and Phase 1.3 deliverable can be checked against this rule.

### The categories

**Category A — Build Now, No Question.** Things that are cheap to add now and painful to retrofit later. They go into Phase 1.1 unconditionally.

**Category B — Foundation Now, Full Implementation Later.** Things where the structure or interface must exist now (because retrofitting it is painful) but the full implementation can wait.

**Category C — Genuine Unknowns: Defer.** Things whose value depends on conditions that don't yet hold (team size, real usage patterns, second example to generalize from). Defer until reality teaches us we need them.

### What goes in each category

**Category A (Phase 1.1):**
- Multi-org from day one (`org_id` on every tenant-scoped table)
- Multi-user with roles from day one (`memberships`, `UserRole` enum, role-aware org switcher)
- Events table as a reserved seat with append-only trigger
- Idempotency keys on mutations
- Trace-id propagation through every layer
- IFRS-compliant Chart of Accounts structure
- Multi-currency columns on `journal_lines`, `bills`, `invoices`, `bank_transactions` (CAD only in Phase 1, schema supports the rest)
- Canadian tax codes table (GST/HST abstraction)
- `intercompany_relationships` table (empty in Phase 1, populated in Phase 2)
- `intercompany_batch_id` on `journal_entries` (nullable, unused in Phase 1)
- `source` enum accepting `'manual' | 'agent' | 'import'` from day one
- `autonomy_tier` column on `vendor_rules`
- `routing_path` field reserved on ProposedEntryCard type
- Boot-time env var assertion
- `pino` structured logger with redact list
- The Three Tests (debit=credit rejection, locked period rejection, RLS cross-org isolation)
- Seed script (2 orgs, 3 users, 2 industry CoA templates)
- `docs/troubleshooting/rls.md`
- RLS on every tenant-scoped table

**Category B (Phase 1.1 foundation, Phase 1.2 or later for full implementation):**
- The Bridge UI shell (Mainframe rail + chat panel + canvas panel) — shell in 1.1, chat live in 1.2
- The agent (Double Entry Agent and orchestrator) — folder structure and tool stubs in 1.1, full implementation in 1.2
- The contracts directory — single file with the Double Entry contract in 1.2
- i18n URL structure `/[locale]/[orgId]/...` — full structure in 1.1 even though only English is fully translated
- Industry CoA templates — two templates in 1.1, the other four when those orgs are created in Phase 2
- CanvasDirective discriminated union — full union with all Phase 2+ stub types in 1.1, components built per phase
- AgentSession persistence — table in 1.1, used in 1.2
- Mainframe constraint (every canvas component works without the agent) — built into 1.1 from the start

**Category C (defer):**
- Monorepo split (Phase 2 — see Section 1f Target #1)
- Three-namespace contracts package with TypeScript project references (Phase 2 — Section 15f)
- Express backend separate from Next.js (Phase 2)
- Layer 1 Foundation Agents as actual agents (Phase 2 — Section 5e)
- Period Agent as an actual agent (Phase 2)
- pg-boss background worker (Phase 2 — lands with AP email ingestion)
- Full CQRS projection system (Phase 2 — Invariant 5 becomes true)
- Audit Agent as an async post-commit worker (Phase 2)
- Confidence as routing input (Phase 2 — Section 15d)
- Streaming agent responses (Phase 2)
- Flinks bank feeds (Phase 2)
- OCR and email ingestion (Phase 2)
- AP, AR, Reconciliation, Reporting workflow agents (Phase 2+)
- Multi-currency activation (Phase 4)
- Mobile responsive layout (Phase 3)
- ADR scaffolding (defer indefinitely until there's a real decision to record)
- Pre-populated ADR templates (never — see Section 16)

### How to use this section

When a feature, refactor, or library is being considered for Phase 1, check it against the three categories:

1. **Is it cheap now and painful later?** → Category A. Build it.
2. **Does the structure need to exist now even if the implementation doesn't?** → Category B. Build the structure.
3. **Does its value depend on conditions that don't yet hold?** → Category C. Defer.

When in doubt, default to deferring. The Phase 1.3 friction journal is the mechanism for promoting Category C items to Category B or A in later phases.

---

## Open Questions

These are gaps or ambiguities that v0.5.0 deliberately does not resolve. They will be resolved in the Phase 1.1 or Phase 1.2 Execution Brief, or in a v0.5.x point release of the Bible.

1. **Industry CoA template content.** v0.5.0 commits to seeding two templates (`holding_company` and `real_estate`) in Phase 1.1. The actual GL account structure for each template needs to be drafted before the Phase 1.1 migration runs. This is a content question (which accounts, what numbering scheme) not an architecture question. Recommend: founder drafts the two templates as a separate document; Phase 1.1 brief incorporates them as INSERT statements.

2. **Exact Postgres function for `post_journal_entry_transactional`.** Section 3d shows the service function calling `adminClient.rpc('post_journal_entry_transactional', ...)`. The exact body of this RPC function is part of the Phase 1.1 migration but is not specified in the Bible. The brief commits to it.

3. **ServiceContext caller enum values.** Section 1c shows callers like `'manual_ui'`, `'agent_dry_run'`, `'agent_confirmed'`. The full enum is finalized in the Phase 1.1 brief. Phase 2 will add `'ap_workflow'`, `'import'`, etc.

4. **Exact system prompt content per persona.** Section 5b commits to one system prompt per persona but the actual prompt text is finalized in the Phase 1.2 brief, not the Bible.

5. **Tool-call validation retry behavior on the second failure.** Section 5g commits to "max 2 retries" but does not specify what happens after retry 2 fails — does the orchestrator return a generic error, or attempt a fallback strategy? Finalized in Phase 1.2 brief.

6. **`agent_reasoning` template format.** Section 4c commits to a structured template + params model but the exact format (which template keys exist, what params each takes) is finalized in the Phase 1.2 brief.

7. **Anthropic SDK version pinning.** Not specified. Recommend: pin to a specific version in Phase 1.1, document upgrade process.

8. **Local vs remote Supabase strategy for Phase 1.3 reality check.** Phase 1.1 and 1.2 work against local Supabase. Phase 1.3 ("close one month of real books") needs to work against a real remote Supabase project with real data. The promotion path (when do we move from local to remote?) is not specified. Recommend: addressed in Phase 1.3 brief.

9. **Backup and disaster recovery posture.** Not addressed in v0.5.0. Supabase has automatic backups on paid plans but no policy is documented. Recommend: addressed before Phase 1.3 begins because Phase 1.3 puts real data into the system.

10. **Audit log retention policy.** Not specified. IFRS and Canadian tax law have minimum retention requirements (typically 6-7 years). Audit log is append-only by convention but no retention policy is set. Recommend: documented as a Phase 3+ concern but flagged so it's not forgotten.

11. **The five Phase 1.2 deferred decisions list.** The Bible mentions Claude API failure handling (Section 8g), prompt caching (Section 8i), cost budget posture (Section 8i), tool-call retry policy (Section 5g), streaming vs batch (Section 8j) as decisions deferred to the Phase 1.2 brief. This is intentional — they should be made when Phase 1.2 starts, not now. Listed here so they are not lost.

---

## End of Part 1 — Architecture Bible v0.5.0

Part 2 (Phase Execution Briefs) does not yet exist. The next document to be written is the **Phase 1.1 Execution Brief**, which will be appended to PLAN.md as Part 2 Section 1 once this Bible is approved.

The Phase 1.1 brief will contain:
- Complete `001_initial_schema.sql` migration
- Exact folder scaffolding commands
- Exact `package.json`
- Exact `tsconfig.json`
- Exact `next.config.js` with i18n config
- Exact seed script
- Exact specifications for the three integration tests
- Exact contents of `docs/troubleshooting/rls.md`
- Exact Postman collection v1
- Exact Phase 1.1 exit criteria checklist
- Estimated unit-of-work breakdown (no calendar timeline)

**The Bible stops here. Wait for review before generating the Phase 1.1 Execution Brief.**


---

# Part 2 — Phase Execution Briefs

*Each brief is written at the start of that phase, informed by what the previous phase taught us. Briefs are appended here as phases complete.*

---

## Phase 1.1 Execution Brief

> **Status:** Active. This is the first brief in Part 2. It is the concrete, executable counterpart to the Architecture Bible's Phase 1.1 description (Section 7). Where the Bible says *what* and *why*, this brief says *how* and *exactly which lines*.
>
> **Read this against the Bible.** Every decision in this brief traces back to a Bible section. Where they appear to disagree, the Bible wins — flag the discrepancy as a v0.5.x point release issue rather than silently diverging.
>
> **Do not skip the Clean Slate step.** Section 2 of this brief deletes files. It is the first action, before any scaffolding. Skipping it produces a half-converted project that takes longer to debug than starting fresh.

---

### 1. Goal

**The system has a correctly structured database, multi-org auth, and a working UI shell — ready to receive the Double Entry Agent in Phase 1.2.**

When Phase 1.1 is done, a developer can: sign in as any of three seeded users, see only the orgs they have membership in, browse the Chart of Accounts for each org, view the (empty) journal entry list, and create a new org with an industry CoA template — all without an agent involved. The three integration tests pass. The events table exists with an append-only trigger but is empty. The audit_log writes synchronously inside every mutation transaction.

**What Phase 1.1 explicitly does NOT include** (these come in Phase 1.2):
- The Double Entry Agent or any agent
- The Anthropic SDK wired into the chat panel (the chat panel renders as a shell with placeholder content)
- The ProposedEntryCard component
- The AI Action Review queue
- The `src/contracts/post-journal-entry.contract.ts` file
- Any tool definitions in `src/agent/tools/`
- The manual journal entry posting flow (the form exists in Phase 1.2 — Phase 1.1 only renders the journal entry list, which is empty until Phase 1.2 lands)

This last point is the most important scope discipline in Phase 1.1: **the manual journal entry form is Phase 1.2, not Phase 1.1.** The journalEntryService exists in Phase 1.1 (so the integration tests can call it), but no UI form posts through it. This keeps Phase 1.1 honestly scoped to "data model + auth + UI shell" and lets Phase 1.2 prove the agent path and the manual form path together.

---

### 2. Clean Slate Prerequisite

> **First action of Phase 1.1. Before any scaffolding. No exceptions.**

The repo currently contains the output of `npx create-next-app` or similar. That scaffolding does not match the folder structure in Bible Section 1a and will cause confusion if left in place. Delete it cleanly first.

**Exact commands to run from the repo root:**

```bash
# Verify you are in the repo root
pwd
ls -la

# Confirm with the founder before running this block.
# These deletes are destructive but recoverable via git if committed.

rm -rf app/
rm -rf pages/                  # in case pages router scaffolding exists
rm -rf public/                 # will be recreated; current contents are placeholder
rm -f next.config.ts
rm -f next.config.js
rm -f next.config.mjs
rm -f package.json
rm -f package-lock.json
rm -f pnpm-lock.yaml
rm -f tsconfig.json
rm -f eslint.config.mjs
rm -f .eslintrc.json
rm -f postcss.config.mjs
rm -f postcss.config.js
rm -f tailwind.config.ts
rm -f tailwind.config.js
rm -rf node_modules/

# Verify the slate is clean. The only things that should remain are:
# .git/, .gitignore, README.md (if present), PLAN.md, docs/, supabase/ (if present)
ls -la
```

**What is preserved:**
- `.git/` — version history
- `.gitignore` — keeps sensible defaults
- `README.md` — if present
- `PLAN.md` — this document
- `docs/` — if any documentation is already in place
- `supabase/` — if a supabase init has already happened (otherwise will be created in Section 4)

**Sanity check after running the deletes:** `git status` should show a long list of deleted files. Commit the clean slate as its own commit before scaffolding begins:

```bash
git add -A
git commit -m "chore: clean slate before Phase 1.1 scaffolding"
```

This commit is the rollback point if anything goes wrong during scaffolding.

---

### 3. Folder Structure

Phase 1.1 creates this exact structure inside the repo. Every folder and key file is named. **Do not invent additional folders.** If something doesn't have a place in this structure, it doesn't belong in Phase 1.1.

```
the-bridge/
├── .env.example                     # Documented in Section 7
├── .env.local                       # gitignored — created from .env.example
├── .gitignore                       # See below
├── .nvmrc                           # "20"
├── package.json                     # See below
├── tsconfig.json                    # Strict TypeScript config
├── next.config.js                   # next-intl plugin wired
├── tailwind.config.ts
├── postcss.config.js
├── PLAN.md                          # This document
│
├── src/
│   ├── app/                                    # Next.js App Router
│   │   ├── layout.tsx                          # Root layout, calls assertEnv()
│   │   ├── globals.css                         # Tailwind base
│   │   │
│   │   ├── [locale]/                           # i18n: en, fr, zh-Hant
│   │   │   ├── layout.tsx                      # Locale provider
│   │   │   ├── page.tsx                        # Locale root → redirect to first org
│   │   │   │
│   │   │   ├── (auth)/
│   │   │   │   ├── sign-in/page.tsx
│   │   │   │   └── sign-out/page.tsx
│   │   │   │
│   │   │   ├── [orgId]/                        # Org-aware routes
│   │   │   │   ├── layout.tsx                  # Org switcher in nav
│   │   │   │   │
│   │   │   │   ├── bridge/
│   │   │   │   │   └── page.tsx                # The Bridge UI shell
│   │   │   │   │
│   │   │   │   └── accounting/
│   │   │   │       ├── chart-of-accounts/
│   │   │   │       │   └── page.tsx            # CoA list and detail
│   │   │   │       └── journals/
│   │   │   │           └── page.tsx            # Journal entry list (empty until 1.2)
│   │   │   │
│   │   │   └── admin/
│   │   │       └── orgs/
│   │   │           └── page.tsx                # Org creation with CoA template picker
│   │   │
│   │   └── api/                                # Next.js API routes
│   │       ├── health/route.ts                 # GET /api/health → { status: 'ok' }
│   │       ├── orgs/
│   │       │   ├── route.ts                    # POST create org
│   │       │   └── [orgId]/route.ts            # GET single org
│   │       ├── memberships/route.ts            # GET memberships for current user
│   │       └── accounting/
│   │           └── chart-of-accounts/route.ts  # GET CoA for org
│   │
│   ├── services/                               # ALL business logic
│   │   ├── context.ts                          # ServiceContext type — Section 11
│   │   ├── middleware/
│   │   │   ├── invariants.ts                   # withInvariants() — Section 10
│   │   │   └── trace.ts                        # generateTraceId(), getTraceId()
│   │   ├── auth/
│   │   │   ├── auth.service.ts                 # canUserPerformAction, getUserMemberships
│   │   │   └── types.ts
│   │   ├── orgs/
│   │   │   ├── org.service.ts                  # createOrg, getOrg, listUserOrgs
│   │   │   ├── membership.service.ts           # listMembershipsForUser
│   │   │   └── types.ts
│   │   ├── accounting/
│   │   │   ├── journal-entry.service.ts        # post() — used only by tests in 1.1
│   │   │   ├── chart-of-accounts.service.ts    # list, get, loadFromTemplate
│   │   │   ├── period.service.ts               # isOpen(), lockPeriod()
│   │   │   ├── tax-codes.service.ts            # listActive(orgId, asOf)
│   │   │   └── types.ts
│   │   ├── audit/
│   │   │   ├── audit.service.ts                # writeAuditLog() — called inside txn
│   │   │   └── types.ts
│   │   └── reports/
│   │       └── types.ts                        # P&L type stubs (Phase 1.1 has no P&L)
│   │
│   ├── agent/                                  # Folder structure only — empty in 1.1
│   │   └── README.md                           # "Wired in Phase 1.2. See Bible Section 5."
│   │
│   ├── contracts/                              # Empty in 1.1
│   │   └── README.md                           # "First contract added in Phase 1.2."
│   │
│   ├── db/
│   │   ├── admin-client.ts                     # Service-role Supabase client (server only)
│   │   ├── user-client.ts                      # User-scoped Supabase client (RLS)
│   │   ├── types.generated.ts                  # Output of supabase gen types
│   │   └── README.md                           # Migration workflow
│   │
│   ├── shared/
│   │   ├── locales.ts                          # ['en', 'fr', 'zh-Hant'] as const
│   │   ├── roles.ts                            # UserRole enum
│   │   ├── currencies.ts                       # CAD constant
│   │   ├── proposed-entry-card.ts              # Type stub for Phase 1.2
│   │   └── canvas-directive-types.ts           # Types referenced by directives
│   │
│   ├── lib/
│   │   ├── env.ts                              # assertEnv() — Section 7
│   │   ├── logger.ts                           # pino instance — Section 8
│   │   ├── supabase-server.ts                  # Server-side Supabase helper
│   │   └── i18n/
│   │       ├── config.ts                       # next-intl config
│   │       └── request.ts                      # next-intl request handler
│   │
│   ├── components/
│   │   ├── bridge/
│   │   │   ├── BridgeLayout.tsx                # Three-zone split-screen
│   │   │   ├── ChatPanel.tsx                   # Shell only — no agent in 1.1
│   │   │   ├── CanvasPanel.tsx                 # Switches on directive.type
│   │   │   ├── MainframeRail.tsx               # Icon rail with API status dot
│   │   │   ├── SuggestedPrompts.tsx            # Static, persona-aware
│   │   │   └── canvas/
│   │   │       ├── CanvasRenderer.tsx          # The switch on directive.type
│   │   │       ├── ChartOfAccountsView.tsx
│   │   │       ├── JournalEntryListView.tsx    # Empty list in 1.1
│   │   │       └── PlaceholderView.tsx         # For Phase 2+ stub directives
│   │   ├── auth/
│   │   │   ├── SignInForm.tsx
│   │   │   └── SignOutButton.tsx
│   │   ├── nav/
│   │   │   └── OrgSwitcher.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       └── StatusDot.tsx                   # Used by MainframeRail
│   │
│   └── middleware.ts                           # Next.js middleware: i18n + auth
│
├── supabase/
│   ├── config.toml                             # Generated by supabase init
│   ├── migrations/
│   │   └── 001_initial_schema.sql              # Section 4
│   └── seed.sql                                # Section 5
│
├── tests/
│   ├── integration/
│   │   ├── debit-credit-rejection.test.ts      # Section 6, Test 1
│   │   ├── locked-period-rejection.test.ts     # Section 6, Test 2
│   │   └── rls-cross-org-isolation.test.ts     # Section 6, Test 3
│   ├── helpers/
│   │   ├── test-db.ts                          # Local Supabase test harness
│   │   └── test-users.ts                       # Helpers to sign in as seeded users
│   └── vitest.config.ts
│
├── docs/
│   ├── prompt-history/
│   │   ├── CHANGELOG.md                        # Pre-populated through v0.5.0
│   │   ├── v0.1.0-initial.md
│   │   ├── v0.2.0-canvas-ux.md
│   │   ├── v0.3.0-layered-agents.md
│   │   ├── v0.4.0-architecture-hardened.md
│   │   └── v0.5.0-phase1-reality.md
│   └── troubleshooting/
│       └── rls.md                              # "If a query returns empty..."
│
├── postman/
│   └── collection.json                         # Phase 1.1 endpoints
│
└── messages/                                   # next-intl translation files
    ├── en.json
    ├── fr.json
    └── zh-Hant.json
```

**What is deliberately empty or stubbed in Phase 1.1:**
- `src/agent/` — folder with README only. Wired in Phase 1.2.
- `src/contracts/` — folder with README only. First contract added in Phase 1.2.
- `src/components/bridge/canvas/PlaceholderView.tsx` — renders "Coming in Phase 2" for stub directive types.
- The journal entry list at `/[locale]/[orgId]/accounting/journals/page.tsx` — renders empty list with "No journal entries yet" message. The form for creating entries lands in Phase 1.2.
- `src/services/reports/` — only the types file. No P&L service in 1.1.
- The chat panel (`ChatPanel.tsx`) — renders the layout shell with "Agent arrives in Phase 1.2" placeholder text. No Anthropic SDK call.

**Key conventions:**
- Path alias: `@/*` maps to `src/*` (configured in `tsconfig.json`)
- All service functions are pure functions exported by name — no classes
- All React components are functional with TypeScript props
- All Tailwind classes are used directly — no CSS modules

---

### 4. Database Schema — `001_initial_schema.sql`

Complete migration. Runnable as-is via `supabase db push` against a local Supabase instance.

```sql
-- ============================================================================
-- 001_initial_schema.sql
-- The Bridge — Phase 1.1 Initial Schema
--
-- Includes only Category A tables and constraints.
-- Phase 2 schema additions (vendors, bills, invoices full workflow, etc.)
-- exist as schema-only tables here so the data model is correct from day one.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Extensions
-- ----------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Enums
-- ----------------------------------------------------------------------------

CREATE TYPE user_role AS ENUM (
  'executive',     -- CFO / founder
  'controller',    -- senior accountant
  'ap_specialist'  -- bookkeeper
);

CREATE TYPE journal_entry_source AS ENUM (
  'manual',  -- Phase 1.2 — written by manual UI form
  'agent',   -- Phase 1.2 — written by Double Entry Agent
  'import'   -- Phase 2+ — written by import workflow
);

CREATE TYPE journal_entry_status AS ENUM (
  'draft',
  'posted',
  'reversed'
);

CREATE TYPE ai_action_status AS ENUM (
  'pending',
  'confirmed',
  'rejected',
  'manual_post'  -- used when source is manual UI, not agent
);

CREATE TYPE autonomy_tier AS ENUM (
  'always_confirm',
  'notify_auto',
  'silent_auto'
);

CREATE TYPE industry_template AS ENUM (
  'holding_company',
  'real_estate',
  'healthcare',     -- seeded in Phase 2 when first healthcare org created
  'hospitality',    -- seeded in Phase 2
  'trading',        -- seeded in Phase 2
  'restaurant'      -- seeded in Phase 2
);

CREATE TYPE account_type AS ENUM (
  'asset',
  'liability',
  'equity',
  'income',
  'expense'
);

-- ----------------------------------------------------------------------------
-- 2. Core: organizations and memberships
-- ----------------------------------------------------------------------------

CREATE TABLE organizations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  industry        industry_template NOT NULL,
  functional_currency TEXT NOT NULL DEFAULT 'CAD',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id)
);

CREATE TABLE memberships (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role        user_role NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, org_id)
);

CREATE INDEX idx_memberships_user ON memberships(user_id, org_id);
CREATE INDEX idx_memberships_org ON memberships(org_id, role);

-- ----------------------------------------------------------------------------
-- 3. Org context (institutional memory metadata)
-- ----------------------------------------------------------------------------

CREATE TABLE org_context (
  org_id          UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  fiscal_year_start_month SMALLINT NOT NULL DEFAULT 1 CHECK (fiscal_year_start_month BETWEEN 1 AND 12),
  default_locale  TEXT NOT NULL DEFAULT 'en',
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ----------------------------------------------------------------------------
-- 4. Chart of accounts and templates
-- ----------------------------------------------------------------------------

CREATE TABLE chart_of_accounts_templates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  industry    industry_template NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT
);

CREATE TABLE chart_of_accounts_template_lines (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id   UUID NOT NULL REFERENCES chart_of_accounts_templates(id) ON DELETE CASCADE,
  code          TEXT NOT NULL,
  name          TEXT NOT NULL,
  account_type  account_type NOT NULL,
  parent_code   TEXT,
  sort_order    INT NOT NULL DEFAULT 0,
  UNIQUE (template_id, code)
);

CREATE TABLE chart_of_accounts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code          TEXT NOT NULL,
  name          TEXT NOT NULL,
  account_type  account_type NOT NULL,
  parent_id     UUID REFERENCES chart_of_accounts(id),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, code)
);

CREATE INDEX idx_coa_org_code ON chart_of_accounts(org_id, code);
CREATE INDEX idx_coa_org_type ON chart_of_accounts(org_id, account_type);

-- ----------------------------------------------------------------------------
-- 5. Fiscal periods
-- ----------------------------------------------------------------------------

CREATE TABLE fiscal_periods (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,                    -- e.g. "March 2026"
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  is_locked   BOOLEAN NOT NULL DEFAULT false,
  locked_at   TIMESTAMPTZ,
  locked_by   UUID REFERENCES auth.users(id),
  CHECK (end_date >= start_date),
  UNIQUE (org_id, start_date, end_date)
);

CREATE INDEX idx_fiscal_periods_org_dates ON fiscal_periods(org_id, start_date, end_date);

-- ----------------------------------------------------------------------------
-- 6. Tax codes (GST/HST abstraction)
-- ----------------------------------------------------------------------------

CREATE TABLE tax_codes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code            TEXT NOT NULL,                   -- e.g. "GST_5", "HST_ON_13"
  name            TEXT NOT NULL,                   -- e.g. "GST 5%"
  jurisdiction    TEXT NOT NULL,                   -- e.g. "CA-FED", "CA-ON"
  rate            NUMERIC(8,5) NOT NULL,           -- e.g. 0.05000 for 5%
  effective_from  DATE NOT NULL,
  effective_to    DATE,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  CHECK (rate >= 0 AND rate <= 1),
  CHECK (effective_to IS NULL OR effective_to > effective_from)
);

CREATE INDEX idx_tax_codes_org_active ON tax_codes(org_id, is_active, effective_from);

-- ----------------------------------------------------------------------------
-- 7. Intercompany relationships
--    Reserved Phase 2 table — schema only.
-- ----------------------------------------------------------------------------

CREATE TABLE intercompany_relationships (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_a_id                    UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  org_b_id                    UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  org_a_due_to_account_code   TEXT NOT NULL,  -- "Due To Org B" account in Org A's CoA
  org_b_due_from_account_code TEXT NOT NULL,  -- "Due From Org A" account in Org B's CoA
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (org_a_id <> org_b_id),
  UNIQUE (org_a_id, org_b_id)
);

COMMENT ON TABLE intercompany_relationships IS
  'Populated in Phase 2 by AP Agent. Do not write manually.';

-- ----------------------------------------------------------------------------
-- 8. Journal entries and lines
-- ----------------------------------------------------------------------------

CREATE TABLE journal_entries (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id                UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  entry_date            DATE NOT NULL,
  description           TEXT NOT NULL,
  reference             TEXT,
  fiscal_period_id      UUID NOT NULL REFERENCES fiscal_periods(id) ON DELETE RESTRICT,
  source                journal_entry_source NOT NULL,
  status                journal_entry_status NOT NULL DEFAULT 'posted',
  intercompany_batch_id UUID,                            -- nullable; populated in Phase 2
  trace_id              UUID NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by            UUID NOT NULL REFERENCES auth.users(id),
  reversed_by_entry_id  UUID REFERENCES journal_entries(id)
);

CREATE INDEX idx_journal_entries_org_period ON journal_entries(org_id, fiscal_period_id, status);
CREATE INDEX idx_journal_entries_org_date ON journal_entries(org_id, entry_date DESC);
CREATE INDEX idx_journal_entries_intercompany ON journal_entries(intercompany_batch_id)
  WHERE intercompany_batch_id IS NOT NULL;

CREATE TABLE journal_lines (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_entry_id  UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  org_id            UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  account_id        UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
  description       TEXT,
  -- Multi-currency columns: present from day one (Bible Section 8b)
  currency          TEXT NOT NULL DEFAULT 'CAD',
  amount_original   NUMERIC(20,4) NOT NULL,
  amount_cad        NUMERIC(20,4) NOT NULL,
  fx_rate           NUMERIC(20,8) NOT NULL DEFAULT 1.0,
  -- Debit / credit signing: exactly one of these is > 0 per line
  debit_amount      NUMERIC(20,4) NOT NULL DEFAULT 0,
  credit_amount     NUMERIC(20,4) NOT NULL DEFAULT 0,
  tax_code_id       UUID REFERENCES tax_codes(id),
  CHECK (debit_amount >= 0),
  CHECK (credit_amount >= 0),
  CHECK ((debit_amount > 0 AND credit_amount = 0) OR (debit_amount = 0 AND credit_amount > 0)),
  CHECK (amount_original >= 0),
  CHECK (amount_cad >= 0),
  CHECK (fx_rate > 0)
);

CREATE INDEX idx_journal_lines_org_account_date ON journal_lines(org_id, account_id);
CREATE INDEX idx_journal_lines_entry ON journal_lines(journal_entry_id);

-- ----------------------------------------------------------------------------
-- 9. Debit=credit deferred constraint (Bible Section 1d)
--    Implemented as a constraint trigger declared DEFERRABLE INITIALLY DEFERRED.
--    Fires once at COMMIT for the entire transaction, after all lines are inserted.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION check_journal_entry_balanced()
RETURNS TRIGGER AS $$
DECLARE
  total_debit  NUMERIC;
  total_credit NUMERIC;
BEGIN
  SELECT
    COALESCE(SUM(debit_amount), 0),
    COALESCE(SUM(credit_amount), 0)
  INTO total_debit, total_credit
  FROM journal_lines
  WHERE journal_entry_id = NEW.journal_entry_id;

  IF ABS(total_debit - total_credit) > 0.0001 THEN
    RAISE EXCEPTION
      'Journal entry % is unbalanced: debits=%, credits=%',
      NEW.journal_entry_id, total_debit, total_credit
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER journal_entry_balanced_trg
  AFTER INSERT OR UPDATE ON journal_lines
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION check_journal_entry_balanced();

-- ----------------------------------------------------------------------------
-- 10. Period lock trigger (immediate, per-row) — Bible Section 2b
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION check_period_not_locked()
RETURNS TRIGGER AS $$
DECLARE
  period_locked BOOLEAN;
  period_name   TEXT;
BEGIN
  SELECT is_locked, name
  INTO period_locked, period_name
  FROM fiscal_periods
  WHERE id = (
    SELECT fiscal_period_id FROM journal_entries
    WHERE id = NEW.journal_entry_id
  );

  IF period_locked THEN
    RAISE EXCEPTION
      'Cannot post to locked fiscal period: %', period_name
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER journal_lines_period_lock_trg
  BEFORE INSERT OR UPDATE ON journal_lines
  FOR EACH ROW
  EXECUTE FUNCTION check_period_not_locked();

-- Also block updates to journal_entries that reference a locked period.
CREATE OR REPLACE FUNCTION check_journal_entry_period_not_locked()
RETURNS TRIGGER AS $$
DECLARE
  period_locked BOOLEAN;
  period_name   TEXT;
BEGIN
  SELECT is_locked, name
  INTO period_locked, period_name
  FROM fiscal_periods
  WHERE id = NEW.fiscal_period_id;

  IF period_locked THEN
    RAISE EXCEPTION
      'Cannot post to locked fiscal period: %', period_name
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER journal_entries_period_lock_trg
  BEFORE INSERT OR UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION check_journal_entry_period_not_locked();

-- ----------------------------------------------------------------------------
-- 11. Audit log (PRIMARY mutation history in Phase 1)
--     Bible Invariant 5: written synchronously inside the mutation transaction.
-- ----------------------------------------------------------------------------

CREATE TABLE audit_log (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  trace_id      UUID NOT NULL,
  action        TEXT NOT NULL,                  -- e.g. "journal_entry.posted"
  entity_type   TEXT NOT NULL,                  -- e.g. "journal_entry"
  entity_id     UUID NOT NULL,
  caller        TEXT NOT NULL,                  -- ServiceContext.caller value
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_org_created ON audit_log(org_id, created_at DESC);
CREATE INDEX idx_audit_log_trace ON audit_log(trace_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);

-- ----------------------------------------------------------------------------
-- 12. AI actions (every agent-initiated action; Phase 1.1 has none)
-- ----------------------------------------------------------------------------

CREATE TABLE ai_actions (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id                   UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  initiating_user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  confirming_user_id       UUID REFERENCES auth.users(id),
  trace_id                 UUID NOT NULL,
  idempotency_key          UUID NOT NULL,
  status                   ai_action_status NOT NULL DEFAULT 'pending',
  tool_name                TEXT NOT NULL,         -- e.g. "post_journal_entry"
  prompt_text              TEXT,                  -- the user message that triggered this
  proposed_card            JSONB,                 -- snapshot of the ProposedEntryCard
  result_journal_entry_id  UUID REFERENCES journal_entries(id),
  routing_path             TEXT,                  -- reserved field, NULL in Phase 1
  rejection_reason         TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at             TIMESTAMPTZ,
  UNIQUE (org_id, idempotency_key)
);

CREATE INDEX idx_ai_actions_org_status ON ai_actions(org_id, status, created_at DESC);
CREATE INDEX idx_ai_actions_trace ON ai_actions(trace_id);

COMMENT ON COLUMN ai_actions.routing_path IS
  'Reserved field. Always NULL in Phase 1. Phase 2 populates with semantic confidence routing path.';

-- ----------------------------------------------------------------------------
-- 13. Agent sessions (persistent conversation state)
-- ----------------------------------------------------------------------------

CREATE TABLE agent_sessions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id            UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  locale            TEXT NOT NULL DEFAULT 'en',
  messages          JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_message_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_sessions_user_org ON agent_sessions(user_id, org_id, last_message_at DESC);

-- ----------------------------------------------------------------------------
-- 14. Events table — RESERVED SEAT
--     Bible Section 0 divergence #5 / Invariant 5 / Section 14.
--     Append-only trigger installed. Nothing writes to this table in Phase 1.
-- ----------------------------------------------------------------------------

CREATE TABLE events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  event_type      TEXT NOT NULL,
  event_version   TEXT NOT NULL,
  trace_id        UUID NOT NULL,
  user_id         UUID REFERENCES auth.users(id),
  payload         JSONB NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_org_created ON events(org_id, created_at DESC);
CREATE INDEX idx_events_type ON events(event_type, created_at DESC);
CREATE INDEX idx_events_trace ON events(trace_id);

COMMENT ON TABLE events IS
  'Reserved seat. Nothing writes here until Phase 2. Append-only trigger enforces immutability.';

-- Append-only enforcement: reject all UPDATE and DELETE operations.
CREATE OR REPLACE FUNCTION reject_event_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION
    'Events table is append-only. % is not permitted.', TG_OP
    USING ERRCODE = 'check_violation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_no_update_trg
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION reject_event_modification();

CREATE TRIGGER events_no_delete_trg
  BEFORE DELETE ON events
  FOR EACH ROW
  EXECUTE FUNCTION reject_event_modification();

-- ----------------------------------------------------------------------------
-- 15. Phase 2 schema-only tables
--     These exist so the data model is correct from day one.
--     Phase 1.1 does not write to them.
-- ----------------------------------------------------------------------------

CREATE TABLE vendors (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE vendor_rules (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id            UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id         UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  default_account_id UUID REFERENCES chart_of_accounts(id),
  autonomy_tier     autonomy_tier NOT NULL DEFAULT 'always_confirm',
  match_count       INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendor_rules_org_vendor ON vendor_rules(org_id, vendor_id);

CREATE TABLE customers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE bills (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id            UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  vendor_id         UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
  bill_number       TEXT,
  bill_date         DATE NOT NULL,
  due_date          DATE,
  -- Multi-currency from day one
  currency          TEXT NOT NULL DEFAULT 'CAD',
  amount_original   NUMERIC(20,4) NOT NULL,
  amount_cad        NUMERIC(20,4) NOT NULL,
  fx_rate           NUMERIC(20,8) NOT NULL DEFAULT 1.0,
  status            TEXT NOT NULL DEFAULT 'draft',
  journal_entry_id  UUID REFERENCES journal_entries(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (amount_original >= 0)
);

CREATE TABLE bill_lines (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id         UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  account_id      UUID NOT NULL REFERENCES chart_of_accounts(id),
  description     TEXT,
  amount_original NUMERIC(20,4) NOT NULL CHECK (amount_original > 0),
  amount_cad      NUMERIC(20,4) NOT NULL CHECK (amount_cad > 0)
);

CREATE TABLE invoices (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id            UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  customer_id       UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  invoice_number    TEXT,
  invoice_date      DATE NOT NULL,
  due_date          DATE,
  currency          TEXT NOT NULL DEFAULT 'CAD',
  amount_original   NUMERIC(20,4) NOT NULL,
  amount_cad        NUMERIC(20,4) NOT NULL,
  fx_rate           NUMERIC(20,8) NOT NULL DEFAULT 1.0,
  status            TEXT NOT NULL DEFAULT 'draft',
  journal_entry_id  UUID REFERENCES journal_entries(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE invoice_lines (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  account_id      UUID NOT NULL REFERENCES chart_of_accounts(id),
  description     TEXT,
  amount_original NUMERIC(20,4) NOT NULL CHECK (amount_original > 0),
  amount_cad      NUMERIC(20,4) NOT NULL CHECK (amount_cad > 0)
);

CREATE TABLE bank_accounts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'CAD',
  gl_account_id   UUID REFERENCES chart_of_accounts(id),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE bank_transactions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id            UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  bank_account_id   UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  posted_at         TIMESTAMPTZ NOT NULL,
  description       TEXT,
  currency          TEXT NOT NULL DEFAULT 'CAD',
  amount_original   NUMERIC(20,4) NOT NULL,
  amount_cad        NUMERIC(20,4) NOT NULL,
  fx_rate           NUMERIC(20,8) NOT NULL DEFAULT 1.0,
  matched_journal_entry_id UUID REFERENCES journal_entries(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bank_tx_org_account_date ON bank_transactions(org_id, bank_account_id, posted_at DESC);

CREATE TABLE payments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id            UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  bill_id           UUID REFERENCES bills(id),
  invoice_id        UUID REFERENCES invoices(id),
  paid_at           DATE NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'CAD',
  amount_original   NUMERIC(20,4) NOT NULL CHECK (amount_original > 0),
  amount_cad        NUMERIC(20,4) NOT NULL CHECK (amount_cad > 0),
  fx_rate           NUMERIC(20,8) NOT NULL DEFAULT 1.0,
  journal_entry_id  UUID REFERENCES journal_entries(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((bill_id IS NOT NULL) <> (invoice_id IS NOT NULL))
);

-- ----------------------------------------------------------------------------
-- 16. Row Level Security (Bible Section 2c)
--     Enabled on every tenant-scoped table. Service-role key bypasses RLS.
--     User-scoped client respects RLS as defense-in-depth.
-- ----------------------------------------------------------------------------

ALTER TABLE organizations               ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_context                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_periods              ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_codes                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE intercompany_relationships  ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries             ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines               ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_actions                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sessions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE events                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_rules                ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_lines                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines               ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments                    ENABLE ROW LEVEL SECURITY;

-- Helper view: orgs the current user has membership in
-- Used inside RLS policies to keep them readable
CREATE OR REPLACE FUNCTION user_org_ids()
RETURNS SETOF UUID
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT org_id FROM memberships WHERE user_id = auth.uid();
$$;

-- organizations: user can SELECT orgs they have membership in
CREATE POLICY organizations_select ON organizations
  FOR SELECT
  USING (id IN (SELECT user_org_ids()));

-- memberships: user can SELECT their own memberships
CREATE POLICY memberships_select ON memberships
  FOR SELECT
  USING (user_id = auth.uid());

-- chart_of_accounts: user can SELECT for their orgs
CREATE POLICY chart_of_accounts_select ON chart_of_accounts
  FOR SELECT
  USING (org_id IN (SELECT user_org_ids()));

-- ============================================================================
-- INVOICES — exact policies (Brief Section 4 requirement)
-- ============================================================================

CREATE POLICY invoices_select ON invoices
  FOR SELECT
  USING (org_id IN (SELECT user_org_ids()));

CREATE POLICY invoices_insert ON invoices
  FOR INSERT
  WITH CHECK (org_id IN (SELECT user_org_ids()));

CREATE POLICY invoices_update ON invoices
  FOR UPDATE
  USING (org_id IN (SELECT user_org_ids()))
  WITH CHECK (org_id IN (SELECT user_org_ids()));

-- ============================================================================
-- JOURNAL_ENTRIES — exact policies
-- ============================================================================

CREATE POLICY journal_entries_select ON journal_entries
  FOR SELECT
  USING (org_id IN (SELECT user_org_ids()));

CREATE POLICY journal_entries_insert ON journal_entries
  FOR INSERT
  WITH CHECK (org_id IN (SELECT user_org_ids()));

CREATE POLICY journal_entries_update ON journal_entries
  FOR UPDATE
  USING (
    org_id IN (SELECT user_org_ids())
    AND NOT EXISTS (
      SELECT 1 FROM fiscal_periods
      WHERE id = journal_entries.fiscal_period_id
        AND is_locked = true
    )
  );

-- journal_lines piggybacks on journal_entries via FK; same pattern.
CREATE POLICY journal_lines_select ON journal_lines
  FOR SELECT
  USING (org_id IN (SELECT user_org_ids()));

CREATE POLICY journal_lines_insert ON journal_lines
  FOR INSERT
  WITH CHECK (org_id IN (SELECT user_org_ids()));

-- ============================================================================
-- AI_ACTIONS — initiator OR controller in same org
-- ============================================================================

CREATE POLICY ai_actions_select ON ai_actions
  FOR SELECT
  USING (
    initiating_user_id = auth.uid()
    OR org_id IN (
      SELECT org_id FROM memberships
      WHERE user_id = auth.uid()
        AND role IN ('controller', 'executive')
    )
  );

CREATE POLICY ai_actions_insert ON ai_actions
  FOR INSERT
  WITH CHECK (org_id IN (SELECT user_org_ids()));

-- Remaining tenant tables: read for org members, no client-side writes (server-only via service role)
CREATE POLICY fiscal_periods_select ON fiscal_periods FOR SELECT USING (org_id IN (SELECT user_org_ids()));
CREATE POLICY tax_codes_select      ON tax_codes      FOR SELECT USING (org_id IN (SELECT user_org_ids()));
CREATE POLICY audit_log_select      ON audit_log      FOR SELECT USING (org_id IN (SELECT user_org_ids()));
CREATE POLICY agent_sessions_select ON agent_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY org_context_select    ON org_context    FOR SELECT USING (org_id IN (SELECT user_org_ids()));
CREATE POLICY vendors_select        ON vendors        FOR SELECT USING (org_id IN (SELECT user_org_ids()));
CREATE POLICY vendor_rules_select   ON vendor_rules   FOR SELECT USING (org_id IN (SELECT user_org_ids()));
CREATE POLICY customers_select      ON customers      FOR SELECT USING (org_id IN (SELECT user_org_ids()));
CREATE POLICY bills_select          ON bills          FOR SELECT USING (org_id IN (SELECT user_org_ids()));
CREATE POLICY bill_lines_select     ON bill_lines     FOR SELECT USING (
  bill_id IN (SELECT id FROM bills WHERE org_id IN (SELECT user_org_ids()))
);
CREATE POLICY invoice_lines_select  ON invoice_lines  FOR SELECT USING (
  invoice_id IN (SELECT id FROM invoices WHERE org_id IN (SELECT user_org_ids()))
);
CREATE POLICY bank_accounts_select  ON bank_accounts  FOR SELECT USING (org_id IN (SELECT user_org_ids()));
CREATE POLICY bank_tx_select        ON bank_transactions FOR SELECT USING (org_id IN (SELECT user_org_ids()));
CREATE POLICY payments_select       ON payments       FOR SELECT USING (org_id IN (SELECT user_org_ids()));
CREATE POLICY events_select         ON events         FOR SELECT USING (org_id IN (SELECT user_org_ids()));
CREATE POLICY intercompany_rel_select ON intercompany_relationships FOR SELECT USING (
  org_a_id IN (SELECT user_org_ids()) OR org_b_id IN (SELECT user_org_ids())
);

-- ----------------------------------------------------------------------------
-- 17. Industry CoA template seed data
--     Phase 1.1 seeds two templates: holding_company and real_estate.
--     The other four (healthcare, hospitality, trading, restaurant) are added
--     in Phase 2 when their first orgs are created.
--     If this needs to change before the migration runs, flag in Open Questions.
-- ----------------------------------------------------------------------------

INSERT INTO chart_of_accounts_templates (id, industry, name, description) VALUES
  ('11111111-1111-1111-1111-111111111111', 'holding_company', 'Holding Company (IFRS)',
   'Generic IFRS chart of accounts for a holding company entity.'),
  ('22222222-2222-2222-2222-222222222222', 'real_estate', 'Real Estate (IFRS)',
   'IFRS chart of accounts for a real estate operating entity.');

-- Holding company template lines
INSERT INTO chart_of_accounts_template_lines (template_id, code, name, account_type, parent_code, sort_order) VALUES
  ('11111111-1111-1111-1111-111111111111', '1000', 'Assets',                 'asset',     NULL,   100),
  ('11111111-1111-1111-1111-111111111111', '1100', 'Cash and Equivalents',   'asset',     '1000', 110),
  ('11111111-1111-1111-1111-111111111111', '1200', 'Investments',            'asset',     '1000', 120),
  ('11111111-1111-1111-1111-111111111111', '1300', 'Due From Affiliates',    'asset',     '1000', 130),
  ('11111111-1111-1111-1111-111111111111', '2000', 'Liabilities',            'liability', NULL,   200),
  ('11111111-1111-1111-1111-111111111111', '2100', 'Accounts Payable',       'liability', '2000', 210),
  ('11111111-1111-1111-1111-111111111111', '2200', 'Due To Affiliates',      'liability', '2000', 220),
  ('11111111-1111-1111-1111-111111111111', '2300', 'GST/HST Payable',        'liability', '2000', 230),
  ('11111111-1111-1111-1111-111111111111', '3000', 'Equity',                 'equity',    NULL,   300),
  ('11111111-1111-1111-1111-111111111111', '3100', 'Share Capital',          'equity',    '3000', 310),
  ('11111111-1111-1111-1111-111111111111', '3200', 'Retained Earnings',      'equity',    '3000', 320),
  ('11111111-1111-1111-1111-111111111111', '4000', 'Income',                 'income',    NULL,   400),
  ('11111111-1111-1111-1111-111111111111', '4100', 'Dividend Income',        'income',    '4000', 410),
  ('11111111-1111-1111-1111-111111111111', '4200', 'Interest Income',        'income',    '4000', 420),
  ('11111111-1111-1111-1111-111111111111', '4300', 'Management Fee Income',  'income',    '4000', 430),
  ('11111111-1111-1111-1111-111111111111', '5000', 'Expenses',               'expense',   NULL,   500),
  ('11111111-1111-1111-1111-111111111111', '5100', 'Professional Fees',      'expense',   '5000', 510),
  ('11111111-1111-1111-1111-111111111111', '5200', 'Office Supplies',        'expense',   '5000', 520),
  ('11111111-1111-1111-1111-111111111111', '5300', 'Bank Charges',           'expense',   '5000', 530),
  ('11111111-1111-1111-1111-111111111111', '5400', 'Travel',                 'expense',   '5000', 540);

-- Real estate template lines
INSERT INTO chart_of_accounts_template_lines (template_id, code, name, account_type, parent_code, sort_order) VALUES
  ('22222222-2222-2222-2222-222222222222', '1000', 'Assets',                  'asset',     NULL,   100),
  ('22222222-2222-2222-2222-222222222222', '1100', 'Cash and Equivalents',    'asset',     '1000', 110),
  ('22222222-2222-2222-2222-222222222222', '1200', 'Tenant Receivables',      'asset',     '1000', 120),
  ('22222222-2222-2222-2222-222222222222', '1300', 'Investment Property',     'asset',     '1000', 130),
  ('22222222-2222-2222-2222-222222222222', '1310', 'Property Improvements',   'asset',     '1300', 131),
  ('22222222-2222-2222-2222-222222222222', '1400', 'Due From Affiliates',     'asset',     '1000', 140),
  ('22222222-2222-2222-2222-222222222222', '2000', 'Liabilities',             'liability', NULL,   200),
  ('22222222-2222-2222-2222-222222222222', '2100', 'Accounts Payable',        'liability', '2000', 210),
  ('22222222-2222-2222-2222-222222222222', '2200', 'Mortgages Payable',       'liability', '2000', 220),
  ('22222222-2222-2222-2222-222222222222', '2300', 'Tenant Deposits Held',    'liability', '2000', 230),
  ('22222222-2222-2222-2222-222222222222', '2400', 'Due To Affiliates',       'liability', '2000', 240),
  ('22222222-2222-2222-2222-222222222222', '2500', 'GST/HST Payable',         'liability', '2000', 250),
  ('22222222-2222-2222-2222-222222222222', '3000', 'Equity',                  'equity',    NULL,   300),
  ('22222222-2222-2222-2222-222222222222', '3100', 'Owner Capital',           'equity',    '3000', 310),
  ('22222222-2222-2222-2222-222222222222', '3200', 'Retained Earnings',       'equity',    '3000', 320),
  ('22222222-2222-2222-2222-222222222222', '4000', 'Income',                  'income',    NULL,   400),
  ('22222222-2222-2222-2222-222222222222', '4100', 'Rental Income',           'income',    '4000', 410),
  ('22222222-2222-2222-2222-222222222222', '4200', 'Parking Income',          'income',    '4000', 420),
  ('22222222-2222-2222-2222-222222222222', '4300', 'Other Property Income',   'income',    '4000', 430),
  ('22222222-2222-2222-2222-222222222222', '5000', 'Expenses',                'expense',   NULL,   500),
  ('22222222-2222-2222-2222-222222222222', '5100', 'Property Management Fees','expense',   '5000', 510),
  ('22222222-2222-2222-2222-222222222222', '5200', 'Repairs and Maintenance', 'expense',   '5000', 520),
  ('22222222-2222-2222-2222-222222222222', '5300', 'Property Insurance',      'expense',   '5000', 530),
  ('22222222-2222-2222-2222-222222222222', '5400', 'Property Taxes',          'expense',   '5000', 540),
  ('22222222-2222-2222-2222-222222222222', '5500', 'Utilities',               'expense',   '5000', 550),
  ('22222222-2222-2222-2222-222222222222', '5600', 'Mortgage Interest',       'expense',   '5000', 560),
  ('22222222-2222-2222-2222-222222222222', '5700', 'Depreciation',            'expense',   '5000', 570);

-- Note: the actual GL account content of these templates is Open Question #1
-- in the Bible. The structure above is a reasonable starting point that can be
-- replaced before the migration runs in production. For Phase 1.1 local development
-- and integration tests, this content is sufficient.

-- ============================================================================
-- END OF 001_initial_schema.sql
-- ============================================================================
```

---

### 5. Seed Script

Location: `supabase/seed.sql`. Run via `pnpm db:seed`.

The seed script must be **idempotent** — safe to run multiple times. It uses fixed UUIDs and `ON CONFLICT DO NOTHING` so re-runs do not duplicate data.

```sql
-- ============================================================================
-- supabase/seed.sql
-- The Bridge — Phase 1.1 Seed Data
--
-- Creates: 2 organizations, 3 users, memberships, fiscal periods,
-- chart of accounts loaded from templates, tax codes.
--
-- IDEMPOTENT: safe to run multiple times. Uses fixed UUIDs and
-- ON CONFLICT DO NOTHING.
--
-- Usage: pnpm db:seed
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Auth users
--    NOTE: In Supabase, auth.users is managed by GoTrue. We use the
--    auth.users() admin API via a Postgres function for local seeding.
--    For local development, the Supabase CLI exposes a way to create
--    users directly. The seed script below uses INSERT INTO auth.users
--    which works against local Supabase only.
-- ----------------------------------------------------------------------------

-- Fixed UUIDs for the three seeded users
-- Executive: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa  (cfo@thebridge.local)
-- Controller: bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb (controller@thebridge.local)
-- AP Specialist: cccccccc-cccc-cccc-cccc-cccccccccccc (ap@thebridge.local)
--
-- Default password for all three: TheBridge2026!
-- (LOCAL DEVELOPMENT ONLY — real users are created via Supabase Auth flow)

INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, aud, role,
  created_at, updated_at
) VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '00000000-0000-0000-0000-000000000000',
    'cfo@thebridge.local',
    crypt('TheBridge2026!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Test CFO"}'::jsonb,
    'authenticated', 'authenticated',
    now(), now()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '00000000-0000-0000-0000-000000000000',
    'controller@thebridge.local',
    crypt('TheBridge2026!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Test Controller"}'::jsonb,
    'authenticated', 'authenticated',
    now(), now()
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '00000000-0000-0000-0000-000000000000',
    'ap@thebridge.local',
    crypt('TheBridge2026!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Test AP Specialist"}'::jsonb,
    'authenticated', 'authenticated',
    now(), now()
  )
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. Organizations
-- ----------------------------------------------------------------------------

INSERT INTO organizations (id, name, industry, functional_currency, created_by) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Acme Holdings Ltd.',     'holding_company', 'CAD',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('22222222-0000-0000-0000-000000000002', '123 Main Street Realty', 'real_estate',     'CAD',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
ON CONFLICT (id) DO NOTHING;

INSERT INTO org_context (org_id, fiscal_year_start_month, default_locale) VALUES
  ('11111111-0000-0000-0000-000000000001', 1, 'en'),
  ('22222222-0000-0000-0000-000000000002', 1, 'en')
ON CONFLICT (org_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. Memberships
--    CFO: both orgs
--    Controller: both orgs
--    AP Specialist: real estate org only (proves RLS isolation in Test 3)
-- ----------------------------------------------------------------------------

INSERT INTO memberships (user_id, org_id, role) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-0000-0000-0000-000000000001', 'executive'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-0000-0000-0000-000000000002', 'executive'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-0000-0000-0000-000000000001', 'controller'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-0000-0000-0000-000000000002', 'controller'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-0000-0000-0000-000000000002', 'ap_specialist')
ON CONFLICT (user_id, org_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. Load Chart of Accounts from templates into each org
-- ----------------------------------------------------------------------------

-- Acme Holdings → holding_company template
INSERT INTO chart_of_accounts (org_id, code, name, account_type)
SELECT
  '11111111-0000-0000-0000-000000000001',
  tl.code, tl.name, tl.account_type
FROM chart_of_accounts_template_lines tl
JOIN chart_of_accounts_templates t ON tl.template_id = t.id
WHERE t.industry = 'holding_company'
ON CONFLICT (org_id, code) DO NOTHING;

-- 123 Main Street Realty → real_estate template
INSERT INTO chart_of_accounts (org_id, code, name, account_type)
SELECT
  '22222222-0000-0000-0000-000000000002',
  tl.code, tl.name, tl.account_type
FROM chart_of_accounts_template_lines tl
JOIN chart_of_accounts_templates t ON tl.template_id = t.id
WHERE t.industry = 'real_estate'
ON CONFLICT (org_id, code) DO NOTHING;

-- Backfill parent_id pointers using parent_code
-- (Done in a second pass because parent rows must exist first)
WITH parent_lookup AS (
  SELECT
    coa.id AS child_id,
    parent.id AS parent_id
  FROM chart_of_accounts coa
  JOIN chart_of_accounts_template_lines tl
    ON coa.code = tl.code
   AND coa.org_id IN ('11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002')
   AND tl.template_id IN (
     SELECT id FROM chart_of_accounts_templates
     WHERE industry IN ('holding_company', 'real_estate')
   )
  JOIN chart_of_accounts parent
    ON parent.code = tl.parent_code
   AND parent.org_id = coa.org_id
  WHERE tl.parent_code IS NOT NULL
)
UPDATE chart_of_accounts
SET parent_id = parent_lookup.parent_id
FROM parent_lookup
WHERE chart_of_accounts.id = parent_lookup.child_id
  AND chart_of_accounts.parent_id IS NULL;

-- ----------------------------------------------------------------------------
-- 5. Fiscal periods (current calendar year, monthly)
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  org_ids UUID[] := ARRAY[
    '11111111-0000-0000-0000-000000000001'::UUID,
    '22222222-0000-0000-0000-000000000002'::UUID
  ];
  current_org UUID;
  m INT;
  period_start DATE;
  period_end DATE;
  period_name_text TEXT;
BEGIN
  FOREACH current_org IN ARRAY org_ids LOOP
    FOR m IN 1..12 LOOP
      period_start := make_date(EXTRACT(YEAR FROM CURRENT_DATE)::INT, m, 1);
      period_end := (period_start + INTERVAL '1 month - 1 day')::DATE;
      period_name_text := to_char(period_start, 'Mon YYYY');

      INSERT INTO fiscal_periods (org_id, name, start_date, end_date, is_locked)
      VALUES (current_org, period_name_text, period_start, period_end, false)
      ON CONFLICT (org_id, start_date, end_date) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 6. Tax codes (current Canadian rates)
-- ----------------------------------------------------------------------------

INSERT INTO tax_codes (org_id, code, name, jurisdiction, rate, effective_from, is_active)
SELECT id, 'GST_5',     'GST 5%',           'CA-FED', 0.05000, '2008-01-01', true FROM organizations
UNION ALL
SELECT id, 'HST_ON_13', 'HST Ontario 13%',  'CA-ON',  0.13000, '2010-07-01', true FROM organizations
UNION ALL
SELECT id, 'GST_BC_5',  'GST BC 5%',        'CA-BC',  0.05000, '2013-04-01', true FROM organizations
UNION ALL
SELECT id, 'PST_BC_7',  'PST BC 7%',        'CA-BC',  0.07000, '2013-04-01', true FROM organizations
UNION ALL
SELECT id, 'EXEMPT',    'Tax Exempt',       'CA',     0.00000, '2000-01-01', true FROM organizations
ON CONFLICT DO NOTHING;

-- ============================================================================
-- END OF seed.sql
--
-- After running this, you can sign in locally as:
--   cfo@thebridge.local        / TheBridge2026!  (Executive — both orgs)
--   controller@thebridge.local / TheBridge2026!  (Controller — both orgs)
--   ap@thebridge.local         / TheBridge2026!  (AP Specialist — real estate only)
-- ============================================================================
```

**The `pnpm db:seed` script in `package.json` runs:**
```
supabase db reset && supabase db push && psql "$LOCAL_DB_URL" -f supabase/seed.sql
```

This sequence guarantees a clean state every time: drop the local DB, re-run all migrations, then load seed data.

---

### 6. Three Integration Tests

Location: `tests/integration/`. Run via `pnpm test`. Uses Vitest plus a thin test harness in `tests/helpers/test-db.ts`.

**Test harness** (`tests/helpers/test-db.ts`):

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Local Supabase instance — values come from `supabase status` output
const LOCAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function adminClient(): SupabaseClient {
  return createClient(LOCAL_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function userClient(email: string, password: string): Promise<SupabaseClient> {
  const client = createClient(LOCAL_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`signIn failed for ${email}: ${error.message}`);
  return client;
}

// Fixed seed UUIDs
export const SEED = {
  ORG_HOLDING:    '11111111-0000-0000-0000-000000000001',
  ORG_REAL_ESTATE:'22222222-0000-0000-0000-000000000002',
  USER_CFO:       'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  USER_CONTROLLER:'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  USER_AP:        'cccccccc-cccc-cccc-cccc-cccccccccccc',
  EMAIL_CFO:        'cfo@thebridge.local',
  EMAIL_CONTROLLER: 'controller@thebridge.local',
  EMAIL_AP:         'ap@thebridge.local',
  PASSWORD:         'TheBridge2026!',
} as const;

// Helper: get the first open fiscal period for an org
export async function getOpenPeriod(orgId: string): Promise<{ id: string; start_date: string; end_date: string }> {
  const admin = adminClient();
  const { data, error } = await admin
    .from('fiscal_periods')
    .select('id, start_date, end_date')
    .eq('org_id', orgId)
    .eq('is_locked', false)
    .order('start_date', { ascending: true })
    .limit(1)
    .single();
  if (error || !data) throw new Error(`No open period for org ${orgId}: ${error?.message}`);
  return data;
}

// Helper: get a chart of accounts entry by code
export async function getAccount(orgId: string, code: string): Promise<{ id: string }> {
  const admin = adminClient();
  const { data, error } = await admin
    .from('chart_of_accounts')
    .select('id')
    .eq('org_id', orgId)
    .eq('code', code)
    .single();
  if (error || !data) throw new Error(`Account ${code} not found in org ${orgId}: ${error?.message}`);
  return data;
}
```

**Test 1 — Unbalanced journal entry rejected by deferred constraint:**

```typescript
// tests/integration/debit-credit-rejection.test.ts
import { describe, it, expect } from 'vitest';
import { v4 as uuid } from 'uuid';
import { adminClient, getOpenPeriod, getAccount, SEED } from '../helpers/test-db';

describe('Deferred constraint: debit must equal credit', () => {
  it('rejects an unbalanced journal entry at COMMIT', async () => {
    const admin = adminClient();
    const period = await getOpenPeriod(SEED.ORG_HOLDING);
    const cashAccount = await getAccount(SEED.ORG_HOLDING, '1100');         // Cash
    const officeSuppliesAccount = await getAccount(SEED.ORG_HOLDING, '5200'); // Office Supplies

    const traceId = uuid();
    const entryId = uuid();

    // Attempt: $500 debit to Office Supplies + $400 credit to Cash (UNBALANCED)
    // We need to do this inside an explicit transaction so the deferred
    // constraint actually fires at COMMIT.
    //
    // Supabase JS client does not expose explicit transactions, so we use
    // an RPC to a small test helper function defined in the test setup.
    //
    // For simplicity here we use the supabase-js insert chain and rely on
    // the fact that the constraint trigger fires on the second INSERT
    // (not at COMMIT — see note below).

    const insertEntry = await admin
      .from('journal_entries')
      .insert({
        id: entryId,
        org_id: SEED.ORG_HOLDING,
        entry_date: period.start_date,
        description: 'TEST: unbalanced entry',
        fiscal_period_id: period.id,
        source: 'manual',
        trace_id: traceId,
        created_by: SEED.USER_CFO,
      });

    expect(insertEntry.error).toBeNull();

    // Insert two unbalanced lines via a single batch insert.
    // Because the constraint is DEFERRABLE INITIALLY DEFERRED, the rejection
    // happens when the implicit per-statement transaction commits.
    const insertLines = await admin
      .from('journal_lines')
      .insert([
        {
          journal_entry_id: entryId,
          org_id: SEED.ORG_HOLDING,
          account_id: officeSuppliesAccount.id,
          description: 'Test debit',
          amount_original: 500,
          amount_cad: 500,
          debit_amount: 500,
          credit_amount: 0,
        },
        {
          journal_entry_id: entryId,
          org_id: SEED.ORG_HOLDING,
          account_id: cashAccount.id,
          description: 'Test credit',
          amount_original: 400,
          amount_cad: 400,
          debit_amount: 0,
          credit_amount: 400,
        },
      ]);

    expect(insertLines.error).not.toBeNull();
    expect(insertLines.error?.message).toMatch(/unbalanced/i);

    // Cleanup: the failed transaction rolled back, so the journal_entries
    // row also does not exist. Confirm:
    const check = await admin
      .from('journal_entries')
      .select('id')
      .eq('id', entryId);
    expect(check.data).toEqual([]);
  });

  it('accepts a balanced journal entry', async () => {
    const admin = adminClient();
    const period = await getOpenPeriod(SEED.ORG_HOLDING);
    const cashAccount = await getAccount(SEED.ORG_HOLDING, '1100');
    const officeSuppliesAccount = await getAccount(SEED.ORG_HOLDING, '5200');

    const traceId = uuid();
    const entryId = uuid();

    const insertEntry = await admin
      .from('journal_entries')
      .insert({
        id: entryId,
        org_id: SEED.ORG_HOLDING,
        entry_date: period.start_date,
        description: 'TEST: balanced entry',
        fiscal_period_id: period.id,
        source: 'manual',
        trace_id: traceId,
        created_by: SEED.USER_CFO,
      });
    expect(insertEntry.error).toBeNull();

    const insertLines = await admin
      .from('journal_lines')
      .insert([
        {
          journal_entry_id: entryId,
          org_id: SEED.ORG_HOLDING,
          account_id: officeSuppliesAccount.id,
          amount_original: 500,
          amount_cad: 500,
          debit_amount: 500,
          credit_amount: 0,
        },
        {
          journal_entry_id: entryId,
          org_id: SEED.ORG_HOLDING,
          account_id: cashAccount.id,
          amount_original: 500,
          amount_cad: 500,
          debit_amount: 0,
          credit_amount: 500,
        },
      ]);

    expect(insertLines.error).toBeNull();

    // Cleanup
    await admin.from('journal_entries').delete().eq('id', entryId);
  });
});
```

> **Note for the developer:** the supabase-js client does not expose explicit `BEGIN/COMMIT`. Multi-row inserts run inside an implicit single statement transaction, which is sufficient for the deferred constraint to fire. If the test ever needs explicit multi-statement transaction control, add a small Postgres helper function (`test_post_unbalanced_entry()`) and call it via `admin.rpc()`. The current shape is sufficient because the failure case is a single batch insert.

**Test 2 — Post to locked fiscal period rejected:**

```typescript
// tests/integration/locked-period-rejection.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { v4 as uuid } from 'uuid';
import { adminClient, getAccount, SEED } from '../helpers/test-db';

describe('Period lock trigger', () => {
  let lockedPeriodId: string;
  let lockedPeriodStart: string;

  beforeAll(async () => {
    const admin = adminClient();
    // Lock the first fiscal period of the holding org
    const { data, error } = await admin
      .from('fiscal_periods')
      .select('id, start_date')
      .eq('org_id', SEED.ORG_HOLDING)
      .order('start_date', { ascending: true })
      .limit(1)
      .single();
    if (error || !data) throw error ?? new Error('no period');

    lockedPeriodId = data.id;
    lockedPeriodStart = data.start_date;

    await admin
      .from('fiscal_periods')
      .update({ is_locked: true, locked_at: new Date().toISOString(), locked_by: SEED.USER_CONTROLLER })
      .eq('id', lockedPeriodId);
  });

  afterAll(async () => {
    // Unlock so re-runs of the test suite work
    const admin = adminClient();
    await admin
      .from('fiscal_periods')
      .update({ is_locked: false, locked_at: null, locked_by: null })
      .eq('id', lockedPeriodId);
  });

  it('rejects insert into a journal entry in a locked period', async () => {
    const admin = adminClient();
    const traceId = uuid();
    const entryId = uuid();

    const insertEntry = await admin
      .from('journal_entries')
      .insert({
        id: entryId,
        org_id: SEED.ORG_HOLDING,
        entry_date: lockedPeriodStart,
        description: 'TEST: should be rejected — period locked',
        fiscal_period_id: lockedPeriodId,
        source: 'manual',
        trace_id: traceId,
        created_by: SEED.USER_CFO,
      });

    expect(insertEntry.error).not.toBeNull();
    expect(insertEntry.error?.message).toMatch(/locked fiscal period/i);
  });
});
```

**Test 3 — RLS cross-org isolation:**

```typescript
// tests/integration/rls-cross-org-isolation.test.ts
import { describe, it, expect } from 'vitest';
import { userClient, SEED } from '../helpers/test-db';

describe('RLS: a user cannot see orgs they have no membership in', () => {
  it('AP Specialist can see real estate org but NOT holding org', async () => {
    const ap = await userClient(SEED.EMAIL_AP, SEED.PASSWORD);

    // The AP Specialist has membership only in the real estate org.
    const orgs = await ap
      .from('organizations')
      .select('id, name');

    expect(orgs.error).toBeNull();
    expect(orgs.data).toBeDefined();

    const visibleOrgIds = (orgs.data ?? []).map((o) => o.id);
    expect(visibleOrgIds).toContain(SEED.ORG_REAL_ESTATE);
    expect(visibleOrgIds).not.toContain(SEED.ORG_HOLDING);
  });

  it('AP Specialist cannot read chart_of_accounts for the holding org', async () => {
    const ap = await userClient(SEED.EMAIL_AP, SEED.PASSWORD);

    const accounts = await ap
      .from('chart_of_accounts')
      .select('id, code')
      .eq('org_id', SEED.ORG_HOLDING);

    expect(accounts.error).toBeNull();
    // RLS produces empty result, not an error
    expect(accounts.data).toEqual([]);
  });

  it('Controller can see both orgs', async () => {
    const ctrl = await userClient(SEED.EMAIL_CONTROLLER, SEED.PASSWORD);
    const orgs = await ctrl
      .from('organizations')
      .select('id');
    const ids = (orgs.data ?? []).map((o) => o.id);
    expect(ids).toContain(SEED.ORG_HOLDING);
    expect(ids).toContain(SEED.ORG_REAL_ESTATE);
  });
});
```

> **Important RLS gotcha to document in `docs/troubleshooting/rls.md`:** RLS produces **empty result sets**, not errors. A query that returns `data: []` and `error: null` looks identical to "no rows match" — but it might mean RLS is filtering everything out. The first thing to suspect when a query returns empty unexpectedly is that you are using the user-scoped client where you should be using the admin client. See `docs/troubleshooting/rls.md`.

---

### 7. Environment Setup

**`.env.example`** — committed to repo:

```bash
# ============================================================================
# .env.example
# Copy to .env.local and fill in real values.
# .env.local is gitignored. Never commit real secrets.
# ============================================================================

# ----------------------------------------------------------------------------
# Supabase — local development
# Get values from `supabase status` after running `pnpm db:start`.
# These change every time you reset local Supabase.
# ----------------------------------------------------------------------------

# CLIENT-SAFE: included in browser bundle. NEXT_PUBLIC_ prefix required.
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.PLACEHOLDER

# SERVER-ONLY: must NEVER appear in client bundle.
# Bypasses RLS. Used by services and API routes only.
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.PLACEHOLDER

# Local Postgres direct URL — used by seed script only
LOCAL_DB_URL=postgresql://postgres:postgres@localhost:54322/postgres

# ----------------------------------------------------------------------------
# Anthropic — Phase 1.2+
# Get from team lead. Phase 1.1 sets this but does not call it yet.
# Boot will fail if missing — set a placeholder for Phase 1.1 or
# request the real key from the team lead.
# ----------------------------------------------------------------------------

# SERVER-ONLY: must NEVER appear in client bundle.
ANTHROPIC_API_KEY=sk-ant-PLACEHOLDER

# ----------------------------------------------------------------------------
# Node environment
# ----------------------------------------------------------------------------

NODE_ENV=development
```

**Boot assertion** (`src/lib/env.ts`):

```typescript
// src/lib/env.ts
//
// Validates required environment variables at startup.
// Throws a clear error before any other code runs.
// Called from src/app/layout.tsx and from any standalone script entry point.

const REQUIRED_SERVER_ENV = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY',
] as const;

const REQUIRED_CLIENT_SAFE_ENV = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

let envAsserted = false;

export function assertEnv(): void {
  if (envAsserted) return;

  const missing: string[] = [];

  for (const key of REQUIRED_SERVER_ENV) {
    if (!process.env[key]) missing.push(key);
  }
  for (const key of REQUIRED_CLIENT_SAFE_ENV) {
    if (!process.env[key]) missing.push(key);
  }

  if (missing.length > 0) {
    throw new Error(
      `FATAL: Missing required environment variables: ${missing.join(', ')}. ` +
      `App cannot start. See .env.example for the full list and where to get each value.`
    );
  }

  envAsserted = true;
}

// Call at module load to fail fast on the server.
// (On the client, server-only vars are undefined by design — only NEXT_PUBLIC_*
// variables exist there. The check above only flags missing client-safe vars on
// the client, which is the correct behavior.)
if (typeof window === 'undefined') {
  assertEnv();
}
```

Imported once at the top of `src/app/layout.tsx`:

```typescript
import '@/lib/env'; // boot assertion runs at module load
```

If `SUPABASE_SERVICE_ROLE_KEY` or `ANTHROPIC_API_KEY` is missing, `pnpm dev` will fail at startup with the explicit message above.

---

### 8. Pino Logger Setup

Location: `src/lib/logger.ts`.

```typescript
// src/lib/logger.ts
//
// Structured logger for the entire application.
// Every log line includes trace_id, org_id, user_id where available.
// Sensitive fields are redacted at the logger level — never logged in cleartext.

import pino, { Logger } from 'pino';

export const logger: Logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  base: {
    env: process.env.NODE_ENV,
    service: 'the-bridge',
  },
  redact: {
    paths: [
      // Auth tokens
      'req.headers.authorization',
      'req.headers.cookie',
      'jwt',
      'access_token',
      'refresh_token',
      '*.jwt',
      '*.access_token',
      '*.refresh_token',
      // API keys
      '*.api_key',
      '*.apiKey',
      '*.service_role_key',
      '*.serviceRoleKey',
      '*.anthropic_api_key',
      '*.anthropicApiKey',
      'SUPABASE_SERVICE_ROLE_KEY',
      'ANTHROPIC_API_KEY',
      // PII / financial
      '*.password',
      '*.bank_account_number',
      '*.bankAccountNumber',
      '*.routing_number',
      '*.routingNumber',
      '*.sin',
      '*.tax_id',
      '*.taxId',
      '*.card_number',
      '*.cardNumber',
      '*.cvv',
    ],
    censor: '[REDACTED]',
  },
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Helper to create a child logger pre-bound to request/operation context.
// Every service function and API route uses this so trace_id is on every line.
export function loggerWithContext(ctx: {
  trace_id: string;
  org_id?: string;
  user_id?: string;
  caller?: string;
}): Logger {
  return logger.child(ctx);
}
```

**Usage example inside a service function:**

```typescript
import { loggerWithContext } from '@/lib/logger';

export async function exampleService(input: SomeInput, ctx: ServiceContext) {
  const log = loggerWithContext({
    trace_id: ctx.trace_id,
    org_id: ctx.org_id,
    user_id: ctx.user_id,
    caller: ctx.caller,
  });

  log.info({ input_summary: { /* non-sensitive fields */ } }, 'exampleService: start');
  // ... business logic ...
  log.info({ result_id: result.id }, 'exampleService: done');
  return result;
}
```

**Verification during Phase 1.1 exit criteria:** every API route logs at least one structured line per request that includes `trace_id`, `org_id`, and `user_id`. Verified by hitting `/api/health` and `/api/orgs` in the local environment and confirming the log output.

---

### 9. The Bridge UI Shell (Phase 1.1 — no agent yet)

This section enumerates exactly what UI gets built in Phase 1.1. **The chat panel exists as a shell only — no Anthropic SDK call, no agent logic.**

**9a. Three-zone split-screen layout** — `src/components/bridge/BridgeLayout.tsx`

```
┌──────┬───────────────┬─────────────────────────────────┐
│ Main │   Chat Panel  │         Canvas Panel            │
│frame │  (380px wide) │   (fills remaining width)       │
│ Rail │               │                                 │
│ 64px │               │                                 │
│      │               │                                 │
│ [📊] │   placeholder │   <CanvasRenderer               │
│ [📋] │   "Agent      │       directive={current} />    │
│ [💵] │    arrives in │                                 │
│ [📈] │    Phase 1.2" │                                 │
│      │               │                                 │
│ [🟢] │               │                                 │
└──────┴───────────────┴─────────────────────────────────┘
```

**9b. Mainframe rail with API status dot** — `src/components/bridge/MainframeRail.tsx`
- Fixed 64px wide, full height, far left
- Icons (top to bottom): Chart of Accounts, Journals, Reports (placeholder), Bridge home
- Each icon is a Next.js `<Link>` that navigates to the canvas view directly — no agent involvement
- **API status dot** at the bottom: green = Anthropic API reachable, gray = not reachable, red = error. In Phase 1.1 the dot is **always gray with tooltip "Agent arrives in Phase 1.2"** because there is no agent yet. The dot component (`<StatusDot />`) is built so Phase 1.2 can flip it to green/red based on a real health probe.

**9c. Canvas renderer** — `src/components/bridge/canvas/CanvasRenderer.tsx`
- Switches on `directive.type` from the `CanvasDirective` discriminated union (Bible Section 4b)
- Phase 1.1 implements components for: `chart_of_accounts`, `journal_entry_list`, `none`
- All other directive types render `<PlaceholderView type={directive.type} />` — a card that says "Coming in Phase 2"
- Phase 1.1 mostly uses `none` (chat panel placeholder) and the Mainframe-driven views

**9d. Auth pages** — `src/app/[locale]/(auth)/sign-in/page.tsx`, `src/app/[locale]/(auth)/sign-out/page.tsx`
- Sign-in: email + password form using Supabase Auth client (`@supabase/auth-helpers-nextjs` or the equivalent for the App Router)
- After successful sign-in, redirect to `/[locale]/[firstOrgId]/bridge`
- Sign-out: calls `supabase.auth.signOut()` and redirects to sign-in
- Renders correctly in all three locales (verified as exit criterion)

**9e. Org switcher** — `src/components/nav/OrgSwitcher.tsx`
- Dropdown in the top nav of every `/[locale]/[orgId]/...` page
- Lists only orgs the current user has membership in (via the `memberships` table — service-role query through `/api/memberships`)
- Switching orgs navigates to the same page slug under the new orgId
- For users with only one org (the AP Specialist in seeds), the dropdown shows a static label, not a selector

**9f. Suggested prompts component** — `src/components/bridge/SuggestedPrompts.tsx`
- Static arrays per persona (Bible Section 4e)
- AP Specialist Phase 1.1 suggestions: "Show me the chart of accounts" / "Open the journal entry list" / "What can I do here?"
- Controller: "Show me the chart of accounts" / "Open the journal entry list" / "Open admin"
- Executive: "Show me the chart of accounts for Acme Holdings" / "Show me the chart of accounts for 123 Main Street Realty" / "Open admin"
- In Phase 1.1 clicking a chip does **not** send a message to the agent (no agent). Each chip is a `<Link>` that navigates directly to the corresponding Mainframe destination. Phase 1.2 rewires them to send messages.

**9g. Chart of Accounts page** — `src/app/[locale]/[orgId]/accounting/chart-of-accounts/page.tsx`
- Server component
- Fetches CoA via the service-role client through `chartOfAccountsService.list(orgId, ctx)`
- Renders a hierarchical tree grouped by `account_type`
- Read-only in Phase 1.1 — no edit/create UI yet

**9h. Journal entry list page** — `src/app/[locale]/[orgId]/accounting/journals/page.tsx`
- Server component
- Fetches entries via `journalEntryService.list(orgId, ctx)` (which is empty in Phase 1.1)
- Renders empty state: "No journal entries yet. Phase 1.2 brings the manual entry form and the agent path."

**9i. Org creation page** — `src/app/[locale]/admin/orgs/page.tsx`
- Form with fields: name, industry (dropdown of `industry_template` enum values), functional currency
- On submit: POST `/api/orgs` → `orgService.createOrg()` → creates the org row, copies the chosen template's CoA lines into `chart_of_accounts`, creates fiscal periods for the current calendar year
- Phase 1.1 only enables `holding_company` and `real_estate` in the dropdown — the other four are disabled with a tooltip "Available in Phase 2"

---

### 10. `withInvariants()` Middleware

Location: `src/services/middleware/invariants.ts`.

```typescript
// src/services/middleware/invariants.ts
//
// Wraps service functions with pre-flight invariant checks.
// Bible Section 15e Phase 1 ordering, step 1: "Service middleware invariants
// run (pre-flight)" before any database mutation.
//
// Phase 1.1 checks:
//   - trace_id present and well-formed
//   - org_id present
//   - caller present
//   - user_id present (for any non-test caller)
//
// Phase 1.2 will add: idempotency_key required for mutating commands
// Phase 2 will add: caller-membership consistency check via authService

import { ServiceContext } from '@/services/context';
import { loggerWithContext } from '@/lib/logger';

export class InvariantViolationError extends Error {
  constructor(message: string, public readonly invariant: string) {
    super(`Invariant violation: ${invariant} — ${message}`);
    this.name = 'InvariantViolationError';
  }
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertInvariants(ctx: ServiceContext): void {
  if (!ctx) {
    throw new InvariantViolationError('ServiceContext is missing', 'context_present');
  }
  if (!ctx.trace_id || !UUID_REGEX.test(ctx.trace_id)) {
    throw new InvariantViolationError(
      'trace_id must be a valid UUID',
      'trace_id_valid'
    );
  }
  if (!ctx.org_id || !UUID_REGEX.test(ctx.org_id)) {
    throw new InvariantViolationError(
      'org_id must be a valid UUID',
      'org_id_present'
    );
  }
  if (!ctx.caller) {
    throw new InvariantViolationError('caller is required on ServiceContext', 'caller_present');
  }
  if (ctx.caller !== 'test' && !ctx.user_id) {
    throw new InvariantViolationError(
      'user_id is required on ServiceContext for all non-test callers',
      'user_id_present'
    );
  }
}

/**
 * Wraps a service function with pre-flight invariant checks.
 *
 * Usage:
 *   export const myService = withInvariants(
 *     async (input: MyInput, ctx: ServiceContext): Promise<MyResult> => {
 *       // business logic
 *     }
 *   );
 */
export function withInvariants<TInput, TResult>(
  fn: (input: TInput, ctx: ServiceContext) => Promise<TResult>
): (input: TInput, ctx: ServiceContext) => Promise<TResult> {
  return async (input: TInput, ctx: ServiceContext): Promise<TResult> => {
    assertInvariants(ctx);

    const log = loggerWithContext({
      trace_id: ctx.trace_id,
      org_id: ctx.org_id,
      user_id: ctx.user_id,
      caller: ctx.caller,
    });

    log.debug({ fn: fn.name }, 'service: pre-flight invariants passed');

    try {
      const result = await fn(input, ctx);
      log.debug({ fn: fn.name }, 'service: complete');
      return result;
    } catch (err) {
      log.error({ fn: fn.name, err }, 'service: error');
      throw err;
    }
  };
}
```

**Template usage** in a service function (`src/services/orgs/org.service.ts`):

```typescript
// src/services/orgs/org.service.ts
import { withInvariants } from '@/services/middleware/invariants';
import { ServiceContext } from '@/services/context';
import { adminClient } from '@/db/admin-client';

export interface CreateOrgInput {
  name: string;
  industry: 'holding_company' | 'real_estate';
  functional_currency: 'CAD';
}

export interface CreateOrgResult {
  org_id: string;
}

export const createOrg = withInvariants(
  async (input: CreateOrgInput, ctx: ServiceContext): Promise<CreateOrgResult> => {
    const admin = adminClient();

    // Insert the org
    const { data: org, error: orgErr } = await admin
      .from('organizations')
      .insert({
        name: input.name,
        industry: input.industry,
        functional_currency: input.functional_currency,
        created_by: ctx.user_id,
      })
      .select('id')
      .single();

    if (orgErr || !org) throw orgErr ?? new Error('createOrg failed');

    // (additional logic: copy CoA template, seed fiscal periods, write audit_log)
    // — full implementation in Phase 1.1 source

    return { org_id: org.id };
  }
);
```

This is the template every other service function follows in Phase 1.1.

---

### 11. ServiceContext Type

Location: `src/services/context.ts`.

```typescript
// src/services/context.ts
//
// ServiceContext is the trusted operation context that flows through every
// service function call. It is constructed at the API route boundary, never
// inside a service. Bible Section 15 Rule 5: trace_id is required on every call.

export type ServiceCaller =
  | 'manual_ui'        // Next.js form submission via API route
  | 'agent_dry_run'    // Phase 1.2: Double Entry Agent dry-run
  | 'agent_confirmed'  // Phase 1.2: Double Entry Agent confirmed write
  | 'system'           // Internal system caller (e.g. seed script, scheduled jobs)
  | 'test';            // Integration tests only

export interface ServiceContext {
  /** UUID generated at the start of the user's intent. Required. */
  trace_id: string;

  /** Organization the operation is scoped to. Required. */
  org_id: string;

  /** Authenticated Supabase user id. Required for all non-test callers. */
  user_id?: string;

  /** Where the operation originated. Required. */
  caller: ServiceCaller;

  /** User's locale at the time of the operation. Used for error message localization. */
  locale?: 'en' | 'fr' | 'zh-Hant';
}

/**
 * Helper to construct a ServiceContext at an API route boundary.
 * Every API route uses this — no manual ServiceContext construction.
 */
export function buildServiceContext(args: {
  org_id: string;
  user_id: string;
  caller: ServiceCaller;
  locale?: 'en' | 'fr' | 'zh-Hant';
  trace_id?: string;  // Optional — generates one if not provided
}): ServiceContext {
  return {
    trace_id: args.trace_id ?? crypto.randomUUID(),
    org_id: args.org_id,
    user_id: args.user_id,
    caller: args.caller,
    locale: args.locale,
  };
}
```

**Phase 1.1 callers used:** `manual_ui`, `system`, `test`. Phase 1.2 adds `agent_dry_run` and `agent_confirmed`.

---

### 12. Phase 1.1 Exit Criteria Checklist

**Every item below must be verified to pass before Phase 1.2 begins.** No item is skippable. If any item fails, do not proceed — fix it first or escalate.

```
CLEAN SLATE
[ ] Old scaffolding deleted (app/, package.json, tsconfig.json, next.config.*, etc.)
[ ] Clean slate committed to git as its own commit
[ ] git status shows only the new src/ and supporting files

BUILD AND TYPECHECK
[ ] pnpm install completes with zero errors
[ ] pnpm typecheck passes (zero TypeScript errors)
[ ] pnpm lint passes
[ ] pnpm build completes successfully
[ ] pnpm dev starts cleanly and serves http://localhost:3000

ENVIRONMENT
[ ] .env.example committed to repo
[ ] .env.local present locally (gitignored)
[ ] Boot assertion throws clear error if SUPABASE_SERVICE_ROLE_KEY missing
[ ] Boot assertion throws clear error if ANTHROPIC_API_KEY missing
[ ] All required NEXT_PUBLIC_ vars present and the app loads

DATABASE
[ ] supabase start runs cleanly
[ ] pnpm db:migrate applies 001_initial_schema.sql with zero errors
[ ] pnpm db:generate-types produces src/db/types.generated.ts
[ ] All Phase 1.1 tables exist (verified via supabase studio or psql \dt)
[ ] events table exists with append-only trigger installed
[ ] Verified: attempting UPDATE on events raises "append-only" exception
[ ] Verified: attempting DELETE on events raises "append-only" exception
[ ] Deferred constraint trigger journal_entry_balanced_trg exists
[ ] Period lock triggers exist on journal_entries and journal_lines
[ ] RLS enabled on every tenant-scoped table (verified)
[ ] Two CoA templates seeded: holding_company and real_estate

SEED SCRIPT
[ ] pnpm db:seed runs successfully on a fresh local DB
[ ] pnpm db:seed runs successfully a second time without error (idempotent)
[ ] After seeding, two organizations exist
[ ] After seeding, three users exist in auth.users
[ ] After seeding, memberships are correct:
    [ ] CFO has membership in both orgs (executive role)
    [ ] Controller has membership in both orgs (controller role)
    [ ] AP Specialist has membership ONLY in real estate org
[ ] After seeding, both orgs have full Chart of Accounts loaded
[ ] After seeding, fiscal periods exist for the current calendar year
[ ] After seeding, tax codes (GST, HST ON, etc.) exist for both orgs

INTEGRATION TESTS
[ ] pnpm test runs all three integration tests
[ ] Test 1 (debit-credit-rejection) passes
[ ] Test 1 also verifies the balanced-entry case succeeds
[ ] Test 2 (locked-period-rejection) passes
[ ] Test 2 unlocks the period in afterAll so re-runs work
[ ] Test 3 (rls-cross-org-isolation) passes
[ ] Test 3 confirms AP Specialist sees real estate but NOT holding
[ ] Test 3 confirms Controller sees both orgs

SERVICE LAYER
[ ] src/services/context.ts exports ServiceContext type
[ ] ServiceContext requires trace_id, org_id, caller (verified by typecheck)
[ ] withInvariants() wrapper exists and is applied to at least one service function
[ ] Calling a service function with a missing trace_id throws InvariantViolationError
[ ] Calling a service function with an invalid org_id throws InvariantViolationError

LOGGING
[ ] src/lib/logger.ts exports configured pino instance
[ ] Logger redact list includes service_role_key, JWTs, bank account numbers
[ ] At least one API route logs trace_id, org_id, user_id on every request
[ ] Verified: hitting /api/health emits a structured log line with env field
[ ] Verified: a log statement that includes a redacted field shows [REDACTED]

UI SHELL
[ ] /[locale]/(auth)/sign-in renders in en, fr, and zh-Hant
[ ] Sign-in works for all three seeded users with the seed password
[ ] After sign-in, user is redirected to their first org's Bridge page
[ ] Three-zone Bridge layout renders (Mainframe + Chat + Canvas)
[ ] Mainframe rail icons render with correct labels
[ ] Mainframe API status dot is gray with the "Agent arrives in Phase 1.2" tooltip
[ ] Org switcher lists only orgs the current user has membership in
[ ] Org switcher shows correct orgs per role:
    [ ] CFO: both orgs visible
    [ ] Controller: both orgs visible
    [ ] AP Specialist: only real estate visible
[ ] Switching org navigates to the same page slug under the new orgId
[ ] Chart of Accounts page loads accounts for the current org
[ ] Chart of Accounts shows correct accounts for holding_company template
[ ] Chart of Accounts shows correct accounts for real_estate template
[ ] Journal entry list page renders empty state ("No entries yet")
[ ] Suggested prompts render as static chips (no agent calls)
[ ] /admin/orgs renders the org creation form
[ ] Creating a new org via the form succeeds and copies the CoA template

CONTRACTS DIRECTORY
[ ] src/contracts/ exists with README only
[ ] README states "First contract added in Phase 1.2"
[ ] No .ts files in src/contracts/ in Phase 1.1

AGENT DIRECTORY
[ ] src/agent/ exists with README only
[ ] README states "Wired in Phase 1.2. See Bible Section 5."
[ ] No agent code in Phase 1.1

DOCUMENTATION
[ ] docs/prompt-history/CHANGELOG.md exists with v0.1.0 through v0.5.0 entries
[ ] docs/troubleshooting/rls.md exists and explains the empty-result gotcha
[ ] PLAN.md (Part 1 + this brief) committed to repo

POSTMAN
[ ] postman/collection.json exists
[ ] Health check request returns 200 with { status: "ok" }
[ ] List orgs request (authenticated) returns the seeded orgs
[ ] List CoA request returns the loaded chart of accounts

PHASE BOUNDARY DISCIPLINE
[ ] No agent code exists outside src/agent/README.md
[ ] No contract files exist outside src/contracts/README.md
[ ] No ProposedEntryCard component implementation (only the type stub)
[ ] No manual journal entry form (Phase 1.2)
[ ] No AI Action Review queue (Phase 1.2)
[ ] No P&L report page (deferred to Phase 1.2 or 1.3)
```

When every checkbox is ticked, Phase 1.1 is complete and Phase 1.2 may begin. Phase 1.2 does not begin while any checkbox is unchecked.

---

---

## Phase 1.1 Brief — v1.1 Additions

> **Status:** These additions are appended to the Phase 1.1 brief above, not merged into it. They are kept as a separate sub-section so the original brief remains an auditable record of the first pass and the additions are visible as their own decision. Where an addition modifies or refines an item from the original brief, the original section number is referenced explicitly.
>
> **All nine additions below are part of Phase 1.1 scope.** They are not optional. The exit criteria checklist at the end of this section folds them into the existing checklist (Section 12 of the original brief) — completion of Phase 1.1 now requires both the original 85 items plus the 2 new items in Addition 9.

### Addition 1 — i18n Setup (`next-intl`, en + fr-CA + zh-Hant)

**Refines:** Brief Section 3 (Folder Structure), Section 7 (Environment Setup), Section 9 (UI Shell — auth pages)

`next-intl` is installed and configured in Phase 1.1. All three locales are wired from day one. Only English content is translated; French and Traditional Mandarin files exist with placeholder content that falls back to English keys. The `/[locale]/[orgId]/...` URL structure is enforced from day one — there is no non-locale-prefixed route in the app.

**Why now:** retrofitting the locale segment into every route, every link, and every redirect is one of the most painful refactors in the system. Adding the segment from day one costs almost nothing. Translating content can wait until users in those locales actually need it. Wiring the URL structure cannot.

**Install command:**

```bash
pnpm add next-intl
```

**Folder structure additions** (incorporate into Brief Section 3):

```
the-bridge/
├── src/
│   ├── i18n.ts                                 # next-intl request config
│   ├── middleware.ts                           # Updated: i18n middleware + auth
│   ├── lib/
│   │   └── i18n/
│   │       ├── config.ts                       # Locale constants and helpers
│   │       └── routing.ts                      # next-intl routing helpers
│   └── app/
│       └── [locale]/
│           └── layout.tsx                      # NextIntlClientProvider wraps children
│
└── messages/
    ├── en.json                                 # English — fully populated in Phase 1.1
    ├── fr.json                                 # French (fr-CA) — placeholder, falls back to en
    └── zh-Hant.json                            # Traditional Mandarin — placeholder, falls back to en
```

**`src/lib/i18n/config.ts`:**

```typescript
// src/lib/i18n/config.ts
//
// Locale configuration for next-intl.
// Bible Section 11: Traditional Mandarin uses zh-Hant, NOT zh-TW.

export const locales = ['en', 'fr', 'zh-Hant'] as const;
export type Locale = typeof locales[number];

export const defaultLocale: Locale = 'en';

export const localeLabels: Record<Locale, string> = {
  en: 'English',
  fr: 'Français (Canada)',
  'zh-Hant': '繁體中文',
};

export function isValidLocale(locale: string): locale is Locale {
  return (locales as readonly string[]).includes(locale);
}
```

**`src/i18n.ts`** (next-intl request config — Next.js App Router pattern):

```typescript
// src/i18n.ts
import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { locales, isValidLocale } from '@/lib/i18n/config';

export default getRequestConfig(async ({ locale }) => {
  if (!isValidLocale(locale)) notFound();

  return {
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

**`next.config.js` update** (replaces the placeholder mention in Brief Section 3):

```javascript
// next.config.js
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = withNextIntl(nextConfig);
```

**`src/middleware.ts`** (handles both i18n routing and auth):

```typescript
// src/middleware.ts
import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from '@/lib/i18n/config';

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',  // every URL has /[locale]/ prefix — enforced
});

export default function middleware(req: NextRequest) {
  // Pass through health check and API routes — no locale prefix on /api/*
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  return intlMiddleware(req);
}

export const config = {
  matcher: [
    // Match all paths except API, _next, _vercel, static files, and favicon
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
```

**`src/app/[locale]/layout.tsx`:**

```typescript
// src/app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/lib/i18n/config';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!isValidLocale(params.locale)) notFound();

  const messages = await getMessages();

  return (
    <html lang={params.locale}>
      <body>
        <NextIntlClientProvider locale={params.locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

**Translation files** — `messages/en.json` is the source of truth for Phase 1.1. `messages/fr.json` and `messages/zh-Hant.json` exist with the same key structure but English values as placeholders.

`messages/en.json`:

```json
{
  "auth": {
    "signIn": {
      "title": "Sign in to The Bridge",
      "emailLabel": "Email",
      "passwordLabel": "Password",
      "submitButton": "Sign in",
      "errorInvalid": "Invalid email or password"
    },
    "signOut": {
      "button": "Sign out"
    }
  },
  "bridge": {
    "chatPanel": {
      "placeholder": "Agent arrives in Phase 1.2"
    },
    "mainframe": {
      "tooltipChartOfAccounts": "Chart of Accounts",
      "tooltipJournals": "Journal Entries",
      "tooltipReports": "Reports",
      "statusDot": {
        "tooltipPhase11": "Agent arrives in Phase 1.2",
        "tooltipReady": "Agent ready",
        "tooltipDegraded": "Agent slow or rate-limited",
        "tooltipUnavailable": "Agent unavailable",
        "bannerUnavailable": "Agent unavailable — use quick navigation"
      }
    },
    "canvas": {
      "navBack": "Back",
      "navForward": "Forward",
      "placeholderPhase2": "Coming in Phase 2"
    }
  },
  "accounting": {
    "chartOfAccounts": {
      "title": "Chart of Accounts"
    },
    "journals": {
      "title": "Journal Entries",
      "emptyState": "No journal entries yet. Phase 1.2 brings the manual entry form and the agent path."
    }
  },
  "admin": {
    "createOrg": {
      "title": "Create Organization",
      "nameLabel": "Organization name",
      "industryLabel": "Industry",
      "industryHoldingCompany": "Holding Company",
      "industryRealEstate": "Real Estate",
      "industryDisabledTooltip": "Available in Phase 2",
      "submitButton": "Create organization"
    }
  },
  "orgSwitcher": {
    "label": "Organization"
  }
}
```

`messages/fr.json` and `messages/zh-Hant.json` use the **same key structure** but with English values as placeholders for Phase 1.1. They exist so:

1. The locale picker works in all three locales
2. Sign-in renders cleanly in all three locales (the Phase 1.1 exit criterion)
3. Phase 2+ translation work is a content task, not a structural task

A linter check (added in Phase 1.1) verifies all three files have identical key structures. If a key is added to `en.json` and not to the others, build fails.

**Environment update** (Brief Section 7): no new env vars. `next-intl` is configured entirely via files.

---

### Addition 2 — Canvas Navigation History

**Refines:** Brief Section 9c (Canvas renderer)

The canvas maintains its own independent navigation stack — completely separate from the chat history. Users can drill into a record from the canvas, then back out, without disrupting their conversation with the agent. The chat panel and the canvas panel have independent histories.

**Why Phase 1.1, not 1.2:** the navigation history pattern is a structural property of the canvas component. Adding it after the canvas has shipped would mean rewriting every canvas view to participate in the history stack. Building it now means every Phase 1.1 canvas view (CoA, journal list, org admin) participates in the history from the start, and Phase 1.2's ProposedEntryCard and journal entry detail views inherit it for free.

**Implementation:**

`src/components/bridge/canvas/CanvasHistory.tsx` — a React context provider that wraps the canvas panel and exposes a stack-based navigation API:

```typescript
// src/components/bridge/canvas/CanvasHistory.tsx
'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { CanvasDirective } from '@/shared/canvas-directive-types';

interface CanvasHistoryState {
  current: CanvasDirective;
  canGoBack: boolean;
  canGoForward: boolean;
  push: (directive: CanvasDirective) => void;
  back: () => void;
  forward: () => void;
}

const CanvasHistoryContext = createContext<CanvasHistoryState | null>(null);

export function CanvasHistoryProvider({
  initial,
  children,
}: {
  initial: CanvasDirective;
  children: ReactNode;
}) {
  // Stack-based history: array of directives + index pointer
  const [stack, setStack] = useState<CanvasDirective[]>([initial]);
  const [index, setIndex] = useState(0);

  const push = useCallback((directive: CanvasDirective) => {
    // When pushing from a non-tail position, truncate forward history
    setStack((prev) => {
      const truncated = prev.slice(0, index + 1);
      return [...truncated, directive];
    });
    setIndex((i) => i + 1);
  }, [index]);

  const back = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const forward = useCallback(() => {
    setIndex((i) => Math.min(stack.length - 1, i + 1));
  }, [stack.length]);

  const value: CanvasHistoryState = {
    current: stack[index],
    canGoBack: index > 0,
    canGoForward: index < stack.length - 1,
    push,
    back,
    forward,
  };

  return (
    <CanvasHistoryContext.Provider value={value}>
      {children}
    </CanvasHistoryContext.Provider>
  );
}

export function useCanvasHistory(): CanvasHistoryState {
  const ctx = useContext(CanvasHistoryContext);
  if (!ctx) throw new Error('useCanvasHistory must be used inside CanvasHistoryProvider');
  return ctx;
}
```

**Canvas panel header** (added to `src/components/bridge/CanvasPanel.tsx`):

```typescript
// src/components/bridge/CanvasPanel.tsx (excerpt)
'use client';

import { useTranslations } from 'next-intl';
import { useCanvasHistory } from './canvas/CanvasHistory';
import { CanvasRenderer } from './canvas/CanvasRenderer';

export function CanvasPanel() {
  const t = useTranslations('bridge.canvas');
  const { current, canGoBack, canGoForward, back, forward } = useCanvasHistory();

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-2 px-4 py-2 border-b">
        <button
          onClick={back}
          disabled={!canGoBack}
          aria-label={t('navBack')}
          className="px-2 py-1 disabled:opacity-30"
        >
          ←
        </button>
        <button
          onClick={forward}
          disabled={!canGoForward}
          aria-label={t('navForward')}
          className="px-2 py-1 disabled:opacity-30"
        >
          →
        </button>
        {/* Optional: breadcrumb of current directive type */}
      </header>
      <div className="flex-1 overflow-auto">
        <CanvasRenderer directive={current} />
      </div>
    </div>
  );
}
```

**Mainframe rail integration:** clicking a Mainframe icon calls `push()` on the canvas history with the corresponding directive. Phase 1.2's agent responses also call `push()` when they include a `canvas_directive`. The history stack does not care which source pushed — Mainframe and agent are equal participants.

**Verification (Phase 1.1):** open the CoA canvas, click the Mainframe Journals icon, click back arrow → CoA reappears. Click forward → journals list reappears. The chat panel content is unchanged through all of this.

---

### Addition 3 — Mainframe API Status Dot (with degraded-state auto-expand)

**Refines:** Brief Section 9b (Mainframe rail with API status dot)

The status dot has three states. When the dot enters the **red (unavailable)** state, the Mainframe rail automatically expands and a banner appears at the top: "Agent unavailable — use quick navigation." This guarantees the user always has a path forward when Claude is down.

**The three states:**

| Color | Meaning | Trigger |
|---|---|---|
| 🟢 Green | Agent ready | Last health probe succeeded within the last 30 seconds |
| 🟡 Yellow | Agent slow or rate-limited | Last probe took >2s, or last call was rate-limited |
| 🔴 Red | Agent unavailable | Last probe failed, OR Anthropic API key is missing/invalid, OR (Phase 1.1) always |

**Phase 1.1 behavior:** the Anthropic SDK is not yet wired (the agent arrives in 1.2). The status dot in 1.1 is **always gray** with the tooltip "Agent arrives in Phase 1.2". The component is built so Phase 1.2 only needs to flip a single prop to start showing real green/yellow/red states based on a health probe.

**However**, the **expand-and-banner behavior** is fully implemented in Phase 1.1 with a manual trigger so it can be tested. A dev-mode toggle in the Mainframe rail (visible only when `NODE_ENV === 'development'`) lets a developer manually flip the dot to red and verify the auto-expand banner renders correctly. This proves the degraded-state UX works before Phase 1.2 wires the real probe.

**Implementation:**

`src/components/bridge/MainframeStatus.tsx`:

```typescript
// src/components/bridge/MainframeStatus.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type AgentStatus = 'phase1' | 'ready' | 'degraded' | 'unavailable';

interface AgentStatusState {
  status: AgentStatus;
  setStatus: (s: AgentStatus) => void;  // Phase 1.2 wires this to a real probe
}

const AgentStatusContext = createContext<AgentStatusState | null>(null);

export function AgentStatusProvider({ children }: { children: ReactNode }) {
  // Phase 1.1: always 'phase1' (no agent yet)
  // Phase 1.2: a useEffect hook polls /api/agent/health and sets status
  const [status, setStatus] = useState<AgentStatus>('phase1');
  return (
    <AgentStatusContext.Provider value={{ status, setStatus }}>
      {children}
    </AgentStatusContext.Provider>
  );
}

export function useAgentStatus(): AgentStatusState {
  const ctx = useContext(AgentStatusContext);
  if (!ctx) throw new Error('useAgentStatus must be used inside AgentStatusProvider');
  return ctx;
}
```

`src/components/ui/StatusDot.tsx`:

```typescript
// src/components/ui/StatusDot.tsx
import { useTranslations } from 'next-intl';
import type { AgentStatus } from '@/components/bridge/MainframeStatus';

const colorClass: Record<AgentStatus, string> = {
  phase1: 'bg-gray-400',
  ready: 'bg-green-500',
  degraded: 'bg-yellow-500',
  unavailable: 'bg-red-500',
};

const tooltipKey: Record<AgentStatus, string> = {
  phase1: 'tooltipPhase11',
  ready: 'tooltipReady',
  degraded: 'tooltipDegraded',
  unavailable: 'tooltipUnavailable',
};

export function StatusDot({ status }: { status: AgentStatus }) {
  const t = useTranslations('bridge.mainframe.statusDot');
  return (
    <div
      className={`w-3 h-3 rounded-full ${colorClass[status]}`}
      title={t(tooltipKey[status])}
      aria-label={t(tooltipKey[status])}
      role="status"
    />
  );
}
```

`src/components/bridge/MainframeRail.tsx` (excerpt — the auto-expand-on-red logic):

```typescript
// src/components/bridge/MainframeRail.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useAgentStatus } from './MainframeStatus';
import { StatusDot } from '@/components/ui/StatusDot';

export function MainframeRail() {
  const t = useTranslations('bridge.mainframe.statusDot');
  const { status, setStatus } = useAgentStatus();

  // When status is 'unavailable', the rail auto-expands and shows the banner.
  const isExpanded = status === 'unavailable';
  const widthClass = isExpanded ? 'w-64' : 'w-16';

  return (
    <aside className={`${widthClass} h-full border-r flex flex-col transition-all`}>
      {status === 'unavailable' && (
        <div role="alert" className="p-3 bg-red-50 border-b text-red-800 text-sm">
          {t('bannerUnavailable')}
        </div>
      )}
      <nav className="flex-1 p-2">
        {/* Mainframe icons — render labels when expanded */}
        {/* ChartOfAccounts, Journals, Reports, Bridge home */}
      </nav>
      <footer className="p-2 border-t flex items-center gap-2">
        <StatusDot status={status} />
        {isExpanded && <span className="text-xs">{t(`tooltip${status === 'phase1' ? 'Phase11' : status[0].toUpperCase() + status.slice(1)}`)}</span>}
      </footer>
      {/* Dev-mode toggle — only in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-2 border-t text-xs">
          <label className="block mb-1">Dev: agent status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full text-xs"
          >
            <option value="phase1">phase1 (gray)</option>
            <option value="ready">ready (green)</option>
            <option value="degraded">degraded (yellow)</option>
            <option value="unavailable">unavailable (red)</option>
          </select>
        </div>
      )}
    </aside>
  );
}
```

**Verification (Phase 1.1):**
1. Default state: dot is gray, rail is collapsed at 64px, no banner.
2. In dev mode, flip the dot to "unavailable" via the dropdown.
3. Rail expands to 256px, red banner appears at top reading "Agent unavailable — use quick navigation."
4. All Mainframe icons remain clickable. The user can still navigate to every Phase 1.1 canvas view.
5. Flip the dot back to "phase1". Rail collapses, banner disappears.

**Phase 1.2 will replace** the dev-mode dropdown with a real health probe useEffect that polls `/api/agent/health` (an endpoint that does a cheap Anthropic API call) every 30 seconds. The dropdown is removed in Phase 1.2.

---

### Addition 4 — ProposedEntryCard Shell

**Refines:** Brief Section 3 (Folder Structure — `src/shared/proposed-entry-card.ts`)

The full TypeScript type definition for `ProposedEntryCard` exists in Phase 1.1 along with a placeholder render component. This means:

1. The canvas renderer can `import { ProposedEntryCard }` and reference the type without TypeScript errors before the agent arrives.
2. Phase 1.2 only needs to fill in the placeholder render — the type, the file location, and the canvas integration are all already in place.
3. The `routing_path` field is on the type from day one (always `null` in Phase 1, populated by Phase 2 routing — Bible Section 15d).

**Type definition** (`src/shared/proposed-entry-card.ts`):

```typescript
// src/shared/proposed-entry-card.ts
//
// The single most important UI data shape in the system.
// Phase 1.1: type defined, placeholder render only.
// Phase 1.2: real render with Approve/Reject/Edit buttons wired to the agent confirmation flow.
// Phase 2: routing_path field populated based on semantic confidence routing graph (Bible Section 15d).

export type Confidence = 'high' | 'medium' | 'low';

export type RoutingPath =
  | 'standard'           // High confidence → AP Queue (Phase 2)
  | 'controller_review'  // Medium → controller approval first
  | 'dual_review'        // Low → AP + controller both approve
  | 'cfo_escalation';    // Novel pattern → CFO notification

export type TransactionType = 'journal_entry' | 'bill' | 'payment' | 'intercompany';

export interface ProposedEntryCardLine {
  account_code: string;
  account_name: string;
  debit_amount: number;
  credit_amount: number;
  currency: 'CAD';  // Phase 1: CAD only. Phase 4 generalizes.
}

/**
 * Localizable agent reasoning. The agent NEVER produces English prose.
 * It produces a structured object: a template key + parameters.
 * The UI renders the localized string using next-intl.
 *
 * Example: { template_key: 'matched_vendor_rule', params: { vendor: 'Acme', rule_count: 12 } }
 *
 * Bible Section 4c: "agent_reasoning is a localizable template with parameters, not free text."
 */
export interface AgentReasoning {
  template_key: string;
  params: Record<string, string | number | boolean>;
}

export interface ProposedEntryCard {
  org_id: string;
  org_name: string;
  transaction_type: TransactionType;

  vendor_name: string | null;
  matched_rule_label: string | null;

  lines: ProposedEntryCardLine[];

  intercompany_flag: boolean;
  reciprocal_entry_preview: ProposedEntryCard | null;  // Phase 2 — always null in Phase 1

  agent_reasoning: AgentReasoning;
  confidence: Confidence;

  // RESERVED FIELD — Bible Section 15d
  // Always null in Phase 1. Phase 2 populates based on confidence routing graph.
  routing_path: RoutingPath | null;

  idempotency_key: string;
  dry_run_entry_id: string;
}
```

**Placeholder render component** (`src/components/ProposedEntryCard.tsx`):

```typescript
// src/components/ProposedEntryCard.tsx
//
// Phase 1.1: placeholder render. The type is defined above; this component
// renders a recognizable card shape so the canvas renderer can reference it
// without errors before the agent arrives.
//
// Phase 1.2: replace the placeholder JSX with the real card (Approve/Reject/Edit
// buttons, intercompany side-by-side rendering, agent_reasoning expansion, etc.).

import type { ProposedEntryCard as ProposedEntryCardType } from '@/shared/proposed-entry-card';

export interface ProposedEntryCardProps {
  card: ProposedEntryCardType;
  onApprove?: (idempotency_key: string) => void;
  onReject?: (reason: string) => void;
  onEdit?: () => void;
}

/**
 * Phase 1.1 placeholder. Renders a card-shaped div with the org name and a
 * "wired in Phase 1.2" notice. Phase 1.2 implements the full card.
 */
export function ProposedEntryCard({ card }: ProposedEntryCardProps) {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm" data-phase="1.1-placeholder">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold">{card.org_name}</span>
        <span className="text-xs uppercase tracking-wide text-gray-500">
          {card.transaction_type}
        </span>
      </div>
      <div className="text-xs text-gray-600 italic">
        ProposedEntryCard placeholder — full implementation in Phase 1.2
      </div>
    </div>
  );
}
```

**Canvas renderer integration** (Brief Section 9c — `CanvasRenderer.tsx`):

```typescript
// src/components/bridge/canvas/CanvasRenderer.tsx
import type { CanvasDirective } from '@/shared/canvas-directive-types';
import { ChartOfAccountsView } from './ChartOfAccountsView';
import { JournalEntryListView } from './JournalEntryListView';
import { PlaceholderView } from './PlaceholderView';
import { ProposedEntryCard } from '@/components/ProposedEntryCard';

export function CanvasRenderer({ directive }: { directive: CanvasDirective }) {
  switch (directive.type) {
    case 'chart_of_accounts':
      return <ChartOfAccountsView orgId={directive.orgId} />;
    case 'journal_entry_list':
      return <JournalEntryListView orgId={directive.orgId} />;
    case 'proposed_entry_card':
      // Phase 1.1: this directive type is defined and renders the placeholder.
      // Phase 1.2: the agent will produce real ProposedEntryCard data and this branch lights up.
      return <ProposedEntryCard card={directive.card} />;
    case 'none':
      return null;
    // Phase 2+ stub directive types render the placeholder
    case 'ap_queue':
    case 'vendor_detail':
    case 'bank_reconciliation':
    case 'ar_aging':
    case 'consolidated_dashboard':
      return <PlaceholderView type={directive.type} />;
    default:
      // Exhaustiveness check: TypeScript will fail compilation if a directive type is missed
      const _exhaustive: never = directive;
      return <PlaceholderView type="unknown" />;
  }
}
```

**Verification (Phase 1.1):**
- `pnpm typecheck` passes — `ProposedEntryCard` type and component both compile.
- The `proposed_entry_card` case in `CanvasRenderer` is reachable in code (TypeScript exhaustiveness check passes).
- A unit test (or storybook story) can render `<ProposedEntryCard card={mockCard} />` with a mock card and see the placeholder. No need to actually wire it into the canvas in Phase 1.1.

---

### Addition 5 — `docs/troubleshooting/rls.md` Already Exists

**Refines:** Brief Section 6 (Three Integration Tests — RLS gotcha note)

`docs/troubleshooting/rls.md` exists at the start of Phase 1.1. **Reference it; do not recreate it.** The original Phase 1.1 brief listed it under documentation scaffolding to be created — that instruction is rescinded. The file is already in place from Bible work.

**What to do instead:** the integration test in Brief Section 6 (Test 3 — RLS cross-org isolation) and the canvas pages that use the user-scoped client should both link to `docs/troubleshooting/rls.md` in their inline comments. Example:

```typescript
// tests/integration/rls-cross-org-isolation.test.ts (header comment)
//
// RLS gotcha: empty result sets, not errors. See docs/troubleshooting/rls.md.
```

If during Phase 1.1 a developer discovers a new RLS gotcha (e.g., a specific Supabase quirk), append it to the existing file rather than creating a new one. The file is the single source of truth for RLS troubleshooting.

**No file creation step required for `docs/troubleshooting/rls.md` in Phase 1.1.**

---

### Addition 6 — `CLAUDE.md` Update

**New:** This is not a refinement of any existing brief section — it is a new requirement.

`CLAUDE.md` is the file that tells the next Claude Code session (or human developer returning after a break) what the current active task is and where to start reading. It is **not** the same as `PLAN.md` — `PLAN.md` is the architectural source of truth (Bible + briefs); `CLAUDE.md` is the orientation pointer.

**Action:** create or update `CLAUDE.md` at the repo root with the content below. This is the **first file a fresh session reads** to know where it is in the project.

**`CLAUDE.md`:**

```markdown
# CLAUDE.md — Session Orientation

> **Read this first.** Then read `PLAN.md` for the full context.

## Current active task

**Phase 1.1 Execution Brief** — see `PLAN.md` Part 2, "Phase 1.1 Execution Brief" section.

The brief contains:
- The exact folder structure to scaffold
- The complete `001_initial_schema.sql` migration
- The seed script for 2 orgs / 3 users / 2 CoA templates
- Three integration tests that must pass before Phase 1.2 begins
- Environment setup, pino logger setup, withInvariants() middleware
- The exit criteria checklist (87 items including i18n + CoA template loading)
- v1.1 Additions covering i18n, canvas history, status dot auto-expand, ProposedEntryCard shell, friction journal, CoA template loading

**Phase 1.2 has not started.** Do not write Phase 1.2 code. Do not write the Phase 1.2 brief.
The Phase 1.2 brief is written *after* every Phase 1.1 exit criterion passes and is *informed by what Phase 1.1 taught us*.

## Session recovery instructions

If you are a fresh Claude Code session and you need to pick up where the previous session left off:

1. Read this file (`CLAUDE.md`) — you are doing that now.
2. Read `PLAN.md` Section 0 (Phase 1 Reality vs Long-Term Architecture) — this is the most important section in the entire document. It tells you which parts of the Bible describe Phase 1 reality and which describe Phase 2+ targets. Without this, you will build the wrong thing.
3. Read `PLAN.md` Part 2 → "Phase 1.1 Execution Brief" → start at Section 1 (Goal) and read through Section 12 (Exit Criteria Checklist). Then read the v1.1 Additions section.
4. Run `git log --oneline -20` to see what has actually been built so far in this repo.
5. Run `pnpm typecheck && pnpm test` to see what currently passes.
6. Cross-reference (4) and (5) against the Phase 1.1 Exit Criteria Checklist. Whatever is unchecked is your work.
7. Read `docs/friction-journal.md` to see what the developer has flagged as painful or confusing so far. Do not dismiss these notes — they are the most important signal about what is actually hard.

## What NOT to do

- Do not invent new architecture. The Bible is the source of truth. If the Bible is silent on something, flag it as an Open Question — do not guess.
- Do not skip the Clean Slate step (Brief Section 2) if it has not been done yet.
- Do not write the manual journal entry form. That is Phase 1.2.
- Do not write any agent code. That is Phase 1.2. `src/agent/` and `src/contracts/` contain READMEs only in Phase 1.1.
- Do not write Phase 1.2 brief content. Wait until Phase 1.1 exit criteria pass.
- Do not change Bible content (Part 1 of PLAN.md) without explicit founder approval. Bible changes are versioned (v0.5.x) and require a changelog entry.

## Bible version

Current: **v0.5.0 — Architecture Bible (Part 1 of PLAN.md)**
Current brief: **Phase 1.1 Execution Brief** (with v1.1 Additions)

## Friction journal

`docs/friction-journal.md` exists. Add entries as you encounter friction. Do not wait for Phase 1.3.
```

**Verification:** the file exists at the repo root after Phase 1.1 scaffolding. A fresh Claude Code session opening the repo for the first time should be able to read `CLAUDE.md`, then `PLAN.md` Section 0, and immediately know what to do next.

---

### Addition 7 — Friction Journal: Start Now, Not Phase 1.3

**Refines:** Bible Section 7 (Phase 1.3 description)

The Bible says Phase 1.3 is when the friction journal becomes the central artifact. **That is wrong about timing.** The friction journal exists from the start of Phase 1.1 and the developer is expected to log friction as soon as it occurs — not retroactively reconstruct it later.

**Why earlier is better:** friction is a perishable signal. The thing that confused you on Tuesday is the thing you will explain away by Friday and have completely forgotten by the time Phase 1.3 starts. Logging it in the moment captures the rawness — "I expected X but got Y" — which is the signal that informs Phase 2 scope. Reconstructing it later produces a sanitized list that misses the most important entries.

**Action:** create `docs/friction-journal.md` as part of Phase 1.1 scaffolding with the template below. Instruct the developer to add entries throughout Phase 1.1 — every time something is confusing, slow, surprising, or broken in a way that took longer than expected to understand.

**`docs/friction-journal.md`:**

```markdown
# Friction Journal

> Started in Phase 1.1. Updated continuously. Triaged at the end of Phase 1.3.
>
> **Purpose:** capture every moment of friction — confusion, surprise, slowness, broken expectation — as it happens. Do not edit for grammar. Do not sanitize. The raw, in-the-moment voice is the signal.
>
> **The rule:** if something took longer than you thought it would, or you had to look something up that you thought you would already know, or the system did something you didn't expect — write it down. **Now.** Not later.

## Categories

When you triage at the end of Phase 1.3, every entry will be tagged as one of:

- **bug** — something that should work and doesn't (fix in current phase)
- **missing_feature** — something the system should do but doesn't (Phase 2 scope)
- **agent_error** — the agent got something wrong (Phase 2 prompt/contract refinement)
- **workflow_friction** — the right thing happens but it's clunky (UX work)
- **architecture_problem** — the Bible was wrong about something (triggers a v0.5.x or v0.6.0 update)

But during Phase 1.1 and 1.2, **do not pre-categorize**. Just write down what happened.

## Entry template

```
### YYYY-MM-DD HH:MM — short title
**Context:** what I was trying to do
**What happened:** what actually happened
**Time lost:** rough estimate (5 min, 30 min, 2 hours, etc.)
**My reaction:** the in-the-moment thought (literally — "wait, why did that..." is a valid entry)
**Status:** open / resolved / will-revisit-in-triage
```

## Entries

(empty — start adding entries here as Phase 1.1 progresses)
```

**Verification (Phase 1.1):** the file exists at the start of Phase 1.1. By the time Phase 1.1 exit criteria are reviewed, the file should have **at least 5 entries**. If it has zero, that is itself a signal — either the developer hit no friction (extremely unlikely) or the developer is not logging it (the actual issue). A friction-journal-with-zero-entries fails the spirit of this addition even if it passes the letter.

The exit criteria checklist (Addition 9) does not include a hard count of friction journal entries — that would incentivize make-work. But the brief reviewer should look at the file before signing off on Phase 1.1.

---

### Addition 8 — CoA Template Loading at Org Creation

**Refines:** Brief Section 9i (Org creation page) and Brief Section 5 (Seed script)

The original brief mentioned that the `/admin/orgs` form should "create the org row, copy the chosen template's CoA lines into `chart_of_accounts`". This addition makes that explicit and complete: the template loading is a real service-layer function (`chartOfAccountsService.loadFromTemplate`), it is wired to the org creation flow, and it is the single mechanism by which any org's CoA gets populated — including the seeded orgs.

**Why this is non-negotiable for Phase 1.1:** without it, the exit criterion "Chart of Accounts loads for each org" cannot pass. The seeded orgs would have empty CoAs and the canvas would render an empty tree.

**Service function** — `src/services/accounting/chart-of-accounts.service.ts`:

```typescript
// src/services/accounting/chart-of-accounts.service.ts
import { withInvariants } from '@/services/middleware/invariants';
import { ServiceContext } from '@/services/context';
import { adminClient } from '@/db/admin-client';
import { loggerWithContext } from '@/lib/logger';

export type IndustryTemplate = 'holding_company' | 'real_estate';

export interface LoadFromTemplateInput {
  org_id: string;
  industry: IndustryTemplate;
}

export interface LoadFromTemplateResult {
  accounts_loaded: number;
}

/**
 * Copy a Chart of Accounts template into a target org's chart_of_accounts table.
 *
 * Steps:
 * 1. Look up the template by industry
 * 2. Read all template lines
 * 3. Insert each as a chart_of_accounts row for the org
 * 4. Backfill parent_id pointers using parent_code
 * 5. Write an audit_log entry
 *
 * Idempotent at the DB level: chart_of_accounts UNIQUE (org_id, code) means
 * re-running this on a populated org is a no-op (ON CONFLICT DO NOTHING).
 */
export const loadFromTemplate = withInvariants(
  async (
    input: LoadFromTemplateInput,
    ctx: ServiceContext
  ): Promise<LoadFromTemplateResult> => {
    const log = loggerWithContext({
      trace_id: ctx.trace_id,
      org_id: ctx.org_id,
      user_id: ctx.user_id,
      caller: ctx.caller,
    });

    const admin = adminClient();

    // 1. Find the template
    const { data: template, error: tErr } = await admin
      .from('chart_of_accounts_templates')
      .select('id')
      .eq('industry', input.industry)
      .single();

    if (tErr || !template) {
      throw new Error(`Template not found for industry ${input.industry}`);
    }

    // 2. Read template lines
    const { data: lines, error: lErr } = await admin
      .from('chart_of_accounts_template_lines')
      .select('code, name, account_type, parent_code, sort_order')
      .eq('template_id', template.id)
      .order('sort_order', { ascending: true });

    if (lErr || !lines) {
      throw new Error(`Failed to load template lines: ${lErr?.message}`);
    }

    // 3. Insert into target org's chart_of_accounts
    const rows = lines.map((tl) => ({
      org_id: input.org_id,
      code: tl.code,
      name: tl.name,
      account_type: tl.account_type,
      is_active: true,
    }));

    const { error: insertErr } = await admin
      .from('chart_of_accounts')
      .upsert(rows, { onConflict: 'org_id,code', ignoreDuplicates: true });

    if (insertErr) throw insertErr;

    // 4. Backfill parent_id pointers
    //    Two-pass: first insert all rows (no parent_id), then UPDATE
    //    parent_id by joining on parent_code from the template lines.
    const { error: parentErr } = await admin.rpc('backfill_coa_parents', {
      p_org_id: input.org_id,
      p_template_id: template.id,
    });

    if (parentErr) {
      log.warn({ err: parentErr }, 'parent_id backfill failed (non-fatal)');
    }

    // 5. Audit log
    await admin.from('audit_log').insert({
      org_id: input.org_id,
      user_id: ctx.user_id!,
      trace_id: ctx.trace_id,
      action: 'chart_of_accounts.template_loaded',
      entity_type: 'organization',
      entity_id: input.org_id,
      caller: ctx.caller,
      metadata: { industry: input.industry, accounts_loaded: rows.length },
    });

    log.info({ accounts_loaded: rows.length }, 'CoA template loaded');

    return { accounts_loaded: rows.length };
  }
);
```

**Helper Postgres function for parent backfill** — added to `001_initial_schema.sql` (or as a follow-up migration):

```sql
-- Helper: backfill parent_id pointers on chart_of_accounts after a template load
CREATE OR REPLACE FUNCTION backfill_coa_parents(p_org_id UUID, p_template_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE chart_of_accounts coa
  SET parent_id = parent.id
  FROM chart_of_accounts_template_lines tl
  JOIN chart_of_accounts parent
    ON parent.code = tl.parent_code
   AND parent.org_id = p_org_id
  WHERE coa.code = tl.code
    AND coa.org_id = p_org_id
    AND tl.template_id = p_template_id
    AND tl.parent_code IS NOT NULL
    AND coa.parent_id IS NULL;
END;
$$ LANGUAGE plpgsql;
```

**Org creation flow** — `src/services/orgs/org.service.ts` (refines the `createOrg` template from Brief Section 10):

```typescript
// src/services/orgs/org.service.ts
import { withInvariants } from '@/services/middleware/invariants';
import { ServiceContext } from '@/services/context';
import { adminClient } from '@/db/admin-client';
import { loadFromTemplate, IndustryTemplate } from '@/services/accounting/chart-of-accounts.service';

export interface CreateOrgInput {
  name: string;
  industry: IndustryTemplate;
  functional_currency: 'CAD';
}

export interface CreateOrgResult {
  org_id: string;
  accounts_loaded: number;
}

export const createOrg = withInvariants(
  async (input: CreateOrgInput, ctx: ServiceContext): Promise<CreateOrgResult> => {
    const admin = adminClient();

    // 1. Insert the org
    const { data: org, error: orgErr } = await admin
      .from('organizations')
      .insert({
        name: input.name,
        industry: input.industry,
        functional_currency: input.functional_currency,
        created_by: ctx.user_id!,
      })
      .select('id')
      .single();

    if (orgErr || !org) throw orgErr ?? new Error('createOrg failed');

    // 2. Insert org_context row
    await admin.from('org_context').insert({
      org_id: org.id,
      fiscal_year_start_month: 1,
      default_locale: ctx.locale ?? 'en',
    });

    // 3. Load CoA template into the new org
    //    This is the critical step that makes "Chart of Accounts loads for each org" pass.
    const newCtx: ServiceContext = { ...ctx, org_id: org.id };
    const coaResult = await loadFromTemplate(
      { org_id: org.id, industry: input.industry },
      newCtx
    );

    // 4. Seed fiscal periods for current calendar year
    //    (12 monthly periods, all open)
    const year = new Date().getFullYear();
    const periods = [];
    for (let m = 1; m <= 12; m++) {
      const start = new Date(year, m - 1, 1);
      const end = new Date(year, m, 0);
      periods.push({
        org_id: org.id,
        name: start.toLocaleString('en-US', { month: 'short' }) + ' ' + year,
        start_date: start.toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10),
        is_locked: false,
      });
    }
    await admin.from('fiscal_periods').insert(periods);

    // 5. Audit log
    await admin.from('audit_log').insert({
      org_id: org.id,
      user_id: ctx.user_id!,
      trace_id: ctx.trace_id,
      action: 'organization.created',
      entity_type: 'organization',
      entity_id: org.id,
      caller: ctx.caller,
      metadata: { name: input.name, industry: input.industry },
    });

    return {
      org_id: org.id,
      accounts_loaded: coaResult.accounts_loaded,
    };
  }
);
```

**Seed script alignment:** the seed script in Brief Section 5 already loads CoA from templates via direct SQL. That is fine for the seed path (it runs once at DB reset). The org creation flow uses the same underlying template tables but goes through the service function so it gets the audit_log entry, the fiscal period seeding, and the trace_id-aware logging.

**Verification (Phase 1.1):**
1. Create a new org via `/admin/orgs` → "Test Holdings" with industry "holding_company"
2. Navigate to the new org's Chart of Accounts page → 20 accounts visible (matching the holding_company template)
3. Check `audit_log` for `chart_of_accounts.template_loaded` action linked to the new org
4. Check `fiscal_periods` for 12 monthly periods linked to the new org
5. Repeat for "real_estate" industry and verify 27 accounts (matching the real_estate template)

---

### Addition 9 — Exit Criteria Checklist Additions

**Refines:** Brief Section 12 (Phase 1.1 Exit Criteria Checklist)

The exit criteria checklist in Section 12 has 85 items. Add the following two items. They are not "nice to have" — they are gates, identical in weight to the original 85.

**Add to the i18n / UI shell area of the checklist:**

```
[ ] i18n configured — sign-in renders in English, French (fr-CA),
    and Traditional Mandarin (zh-Hant) without fallback errors.
    Switching the URL locale segment changes the page locale.
    next-intl middleware enforces /[locale]/ prefix on all non-API routes.
```

**Add to the database / org creation area of the checklist:**

```
[ ] Org creation flow loads correct CoA template for selected industry.
    Creating a new org via /admin/orgs with industry=holding_company
    populates 20 chart_of_accounts rows for the new org.
    Creating with industry=real_estate populates 27 rows.
    audit_log records the chart_of_accounts.template_loaded action.
    fiscal_periods table has 12 monthly periods for the new org.
```

**Updated total:** Phase 1.1 has **87 exit criteria items** (85 original + 2 from this addition).

In addition, the v1.1 additions imply several verifications that should be folded into the relevant sections of the existing checklist (these are not new top-line items, they are tightenings of items already present):

- **Canvas history (Addition 2):** the "three-zone Bridge layout renders" item now also requires "canvas back/forward arrows render in the canvas header and navigate through the history stack correctly."
- **Status dot auto-expand (Addition 3):** the "Mainframe API status dot is gray" item now also requires "in dev mode, flipping the status to 'unavailable' expands the rail and shows the red banner; flipping back collapses the rail."
- **ProposedEntryCard shell (Addition 4):** the "pnpm typecheck passes" item is unchanged but it now implicitly verifies that `src/components/ProposedEntryCard.tsx` and `src/shared/proposed-entry-card.ts` compile and that the canvas renderer's `proposed_entry_card` case type-checks.
- **CLAUDE.md (Addition 6):** add `[ ] CLAUDE.md exists at repo root and points to the active Phase 1.1 brief.`
- **Friction journal (Addition 7):** add `[ ] docs/friction-journal.md exists with the entry template populated.` (No hard count of entries — see Addition 7 rationale.)

So the **final Phase 1.1 exit criteria count is 87 top-line items plus 5 tightenings** of existing items. All must pass before Phase 1.2 begins.

---

### End of v1.1 Additions

The nine additions above are part of Phase 1.1 scope. They are not deferred and not optional. The original brief plus these additions together define what Phase 1.1 builds.

---

### End of Phase 1.1 Execution Brief

**Stop here.** Do not write the Phase 1.2 brief. The Phase 1.2 brief is written *after* Phase 1.1 exit criteria all pass and *informed by what Phase 1.1 taught you* — specifically, anything that turned out to be harder than expected or any architectural assumption that proved wrong. Until then, Phase 1.2 is a sketch in the Bible (Section 7), not a brief.

The next document to be written is the **Phase 1.2 Execution Brief**, and only after every checkbox above passes.
