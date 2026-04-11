# Family Office AI-Forward Accounting Platform — PLAN.md

## Part 1 — Architecture Bible
### Version: v0.5.3 — Correctness & Risk Review Fixes (Milestone)

> **This document is Part 1 of PLAN.md — the Architecture Bible.** It captures
> every major architectural decision, the reasoning behind it, and the constraints
> that flow from it. It is the long-term north star. It is consulted, not executed.
>
> **Part 2 — Phase Execution Briefs** is appended to this same PLAN.md file as
> each phase begins. Each brief is a ~10–15 page concrete execution document with
> SQL, folder layout, exit criteria, and tests for that one phase. Briefs are
> written one at a time, informed by what the previous phase taught us. Phase 1.1
> Brief is the next deliverable after this Bible is approved.

---

> **Version history:**
> - v0.1.0 — Initial: Zoho module surface, flat tool catalog, create_bill worked example
> - v0.2.0 — Canvas: Bridge UI, Contextual Canvas, canvas_directive protocol, Mainframe rail
> - v0.3.0 — Layered agents: Three-layer stack, Two Laws, Phase 1 scoped to manual journal entry proof-of-concept
> - v0.4.0 — Architecture hardened: Four-layer truth hierarchy, pre-commit invariant enforcement, three-namespace contracts package, Agent→Command contract layer, event stream as single source of truth, trace-id observability, semantic confidence routing graph
> - **v0.5.0 — Phase 1 simplification: Single Next.js app for Phase 1 (no monorepo, no Express). Layer 1/2 agents collapsed to service functions. Events table reserved-seat (created, not written). Audit log written synchronously. A/B/C categorization (build now / foundation now / defer). Seven Category A additions. Three integration tests as floor. Phase structure rewritten as 1.1 / 1.2 / 1.3. PLAN.md split into Architecture Bible (Part 1) and Phase Execution Briefs (Part 2). Eight v0.4.0 decisions formally superseded — see Phase 1 Simplifications section for the full list and Phase 2 corrections.**
> - **v0.5.1 — Foundation review fixes: Section 0 added at the front enumerating all eight v0.4.0 → v0.5.0 divergences in a single table. Invariant 5 heading qualified to make the Phase 1 exception visible from the TOC. Section 14 opening rephrased to make resolved-status unambiguous. Section 15f rewritten with two complete side-by-side ordering diagrams (Phase 1 form and Phase 2 form) instead of a prose diff. Open Questions section expanded from 10 to 19 items by promoting seven decisions from Section 17 (where they had defaulted silently) and adding two missing architectural gaps (CI/CD database target and reversal entry mechanism). Section 17 trimmed to only the items that genuinely belong in the Phase 1.2 brief.**
> - **v0.5.3 — Correctness and risk review fixes: Sixteen findings resolved in one commit after back-to-back A (risk hunt) and D (technical correctness) reviews of v0.5.2. A found 10 items (5 Bible changes + 4 inline notes + 1 Phase 1.1 brief addition) — period-lock/ai_actions race, SECURITY DEFINER search_path leak, unenforced service-side authorization, trace_id break at the Claude API boundary, unconstrained Vercel/Supabase region pairing, idempotency key scoping gap, events-table backfill INSERT-only requirement, pnpm-vs-npm lockfile trap in the Phase 1.1 brief, next-intl fallback behavior, and inactive CoA account filtering. D found 11 items (7 Bible changes + 4 inline notes) — period-lock concurrency race (row-lock fix on fiscal_periods), money-as-JavaScript-Number silent rounding, RLS documented on only 3 of 20+ tenant-scoped tables (completed uniformly), events-table TRUNCATE bypass, undocumented multi-currency amount_cad/amount_original/fx_rate invariant (CHECK added), deferred-constraint trigger firing N times per commit (documented and kept in Bible now — not deferred), missing idempotency CHECK constraint for agent source, memberships→auth.users missing ON DELETE CASCADE, unspecified transaction isolation level, events.sequence_number gap warning, and zero-value line decision (**rejected at the database via CHECK — at least one side must be non-zero; a zero-balanced line is an invisible audit-context error worse than a rejected entry**). Full changelog with each finding and its resolution in docs/prompt-history/CHANGELOG.md.**
> - **v0.5.2 — Readiness review fixes: Three gaps closed after an interactive readiness review of v0.5.1. (1) Part 2 preamble added above the Phase 1.1 Execution Brief disclosing that the brief was drafted against Section 18 default answers, naming the specific questions it silently assumed, and requiring the founder to complete Section 18d before execution. (2) Phase 1.2 exit criteria extended with seven load-bearing tests (#12–18) covering the architectural promises the Bible makes elsewhere but never verified: dry-run→confirm round-trip, anti-hallucination enforcement, ProposedEntryCard render shape, clarification-question path, mid-conversation API failure (behavioral — tests the orphaned-pending-action failure mode, not just the UI state), structured-response trilingual contract, and persona guardrails. (3) Phase 1.3 exit criteria extended with seven load-bearing signals (#7–13) for real-bookkeeping operation: reversal exercised, period lock exercised after real close, backup/restore verified, real GST/HST on a real entry, explicit trust classification with an up-front go/soft-no/hard-no commitment rule, non-English UI walked, and cross-org accidental-visibility check. The v0.5.2 pass was initiated by the founder with the instruction "lets have brainstorm review the plan.md first," scoped to readiness (E) and Phase 1.2/1.3 exit criteria rigor, with two founder-driven reshapes to the original senior review findings (behavioral framing for the API-failure criterion; explicit "Phase 2 does not begin until resolved" rule for hard-no trust answers). The annotation pass on the Phase 1.1 brief's assumption points is tracked separately and applied interactively with founder confirmation of each point.**

> **Critical instruction to Claude Code:** This Bible is the result of multiple
> rounds of architectural review by senior distributed systems engineers, plus a
> deliberate Phase 1 simplification pass that traded engineering ceremony for
> shippability. Every decision recorded here is intentional and documented.
> **Do not make assumptions where the document is silent — flag ambiguities in
> the Open Questions section at the end instead.** Do not substitute your own
> judgment for decisions already made here. Where you disagree, say so explicitly
> in the Open Questions section. The goal is zero reasonable assumptions — only
> deliberate, documented decisions.
>
> **Where v0.5.0 simplified a v0.4.0 decision, the simplification is documented
> in the "Phase 1 Simplifications and Their Phase 2 Corrections" section. Each
> simplification names the invariant it temporarily bends, why, and exactly how
> Phase 2 restores it. Do not treat the simplifications as the permanent design.
> They are a deliberate, time-limited concession to ship Phase 1.**

---

## Reading Order

This Bible is long. Read it in passes, not front-to-back on the first sitting.

**First pass (what am I building and why?)** — ~30 minutes:
1. **Section 0** — the eight Phase 1 / long-term divergences (the tiebreaker map).
2. **Phase 1 Simplifications and Their Phase 2 Corrections** — what's temporary and what's forever.
3. **A/B/C Categorization** — the scope-discipline tool.
4. **Section 7 — Phase Plan** — what Phase 1.1, 1.2, 1.3 actually contain.
5. **Section 18 — Open Questions** — what the founder must resolve before Phase 1.1 starts.

**Second pass (how is it structured?)** — ~60 minutes:
6. Section 1 (Architecture Overview), Section 2 (Data Model), Section 5 (Agent Architecture — Phase 1 form).

**Deep dive (when touching a specific area):**
7. Sections 3 (Shared Schemas), 4 (Bridge UI), 6 (Intercompany), 8 (Hard Problems), 9 (Security), 10 (Perf/Scale), 14 (Event Sourcing decision), 15 (Contract Rules).

**Reference only:**
8. Sections 11 (i18n), 12 (Onboarding), 13 (Commodity vs Differentiation), 16 (Docs/ADRs), 17 (Phase 1.2 deferrals).

**If anything contradicts, Section 0 wins.** If Section 0 and the rest of the Bible disagree, Section 0 is the tiebreaker. If the Bible and a Phase Execution Brief (Part 2) disagree, the Bible wins and the brief is wrong — flag it.

---

## Section 0 — Phase 1 Reality vs Long-Term Architecture

**Read this section first. Before anything else.**

This is the single most important map in the document for understanding what
v0.5.0/v0.5.1 actually changed from v0.4.0. Eight architectural decisions made
in v0.4.0 are temporarily different in Phase 1. Each is listed here with its
v0.4.0 design, its Phase 1 form, and its Phase 2 path back to the long-term
architecture.

**Why this section exists at the front:** The rest of this Bible occasionally
describes the long-term Phase 2+ design (because that is the permanent target)
and occasionally describes the Phase 1 form (because that is what we are
actually building first). Without this map, those passages look contradictory.
With this map, the contradictions are visible as deliberate, time-limited
deviations with named correction paths.

Three of the eight divergences are documented in detail in the **"Phase 1
Simplifications and Their Phase 2 Corrections"** section later in this document
(audit log, events table, agents-collapsed-to-services). The other five are
deferrals of v0.4.0 infrastructure choices that did not warrant the same level
of detail because their Phase 2 path is mechanical (move folders, install
packages, split processes).

| # | v0.4.0 design | v0.5.0 Phase 1 form | Phase 2 path back |
|---|---|---|---|
| 1 | **pnpm workspaces monorepo** with `apps/` and `packages/` | **Single Next.js app**. Folder structure inside `src/` mirrors the future monorepo layout (`src/services/`, `src/agent/`, `src/db/`, `src/contracts/`, `src/shared/`) so the Phase 2 split is mechanical. | Phase 2 monorepo split. `src/services/` → `packages/services/`, `src/agent/` → `packages/agent/`, etc. The Next.js app becomes `apps/web/`; a new `apps/api/` is created. No business logic moves. |
| 2 | **Separate Express backend** (`apps/api`) with its own deployment | **Next.js API routes** (`src/app/api/`) serving as the backend. Same Vercel deployment as the frontend. | Phase 2 introduces `apps/api/` as a separate Express service deployed to Railway/Fly.io/Render. The trigger for the split is either scale (background jobs needed) or codebase size (the monorepo split itself pays for the Express split). |
| 3 | **Three-namespace contracts package** (`contracts/transport/`, `contracts/agent/`, `contracts/events/`) with TypeScript project references enforcing build-graph isolation | **One folder, one file**: `src/contracts/doubleEntry.contract.ts` with `_contract_version`, `trace_id`, `idempotency_key` as required fields. No project references. No three-namespace split. | Phase 2 generalizes to the full three-namespace structure once there are 5+ contracts and the actual pattern is visible from real use. The Phase 1 contract file moves into `packages/contracts/agent/` unchanged. |
| 4 | **Layer 1 Foundation Agents** (Auth Agent, Database Agent, Audit Agent) as named agents in `packages/agent/src/layer1-foundation/` | **Plain TypeScript service functions** in `src/services/`. No `layer1-foundation/` folder. No Database Agent abstraction. The service layer IS the database abstraction. See Simplification 3. | Phase 2 reintroduces `packages/agent/` with the Layer 1/2/3 folder structure once the AP Agent has been built and the actually-needed shared infrastructure is visible. Service functions stay in `packages/services/` as the inner ring; agents wrap them as the outer ring. |
| 5 | **Layer 2 Domain Agents** (Double Entry Agent, Chart of Accounts Agent, Period Agent) as named agents | **Service functions**: `journalEntryService.post()`, `chartOfAccountsService`, `periodService.isOpen()`. The single agent that exists in Phase 1.2 is the Double Entry Agent, defined as a Claude tool wrapping `journalEntryService.post()`. See Simplification 3. | Phase 2 wraps each service in a Layer 2 domain agent class inside `packages/agent/`. The service functions do not move. |
| 6 | **`events` table as single source of truth** with synchronous projection updates (Invariant 5) | **Reserved seat**: events table created with append-only trigger installed; nothing writes to it. `audit_log` written synchronously inside the same transaction as the mutation. See Simplification 1 and Simplification 2. | Phase 2 begins writing `JournalEntryPostedEvent` to the events table inside the mutation transaction. pg-boss is installed. A pg-boss subscriber writes the `audit_log` projection asynchronously after commit. A backfill script replays Phase 1 `audit_log` rows into the events table. |
| 7 | **Debit=credit enforcement: "deferred constraint or trigger"** (v0.4.0 left this open) | **Deferred constraint specifically.** A per-row trigger cannot check debit=credit because the rule is set-level, not row-level. The constraint is `DEFERRABLE INITIALLY DEFERRED` and runs at transaction COMMIT. | No correction needed — this is the permanent design. v0.5.1 just makes the choice explicit instead of leaving it open. |
| 8 | **Audit log via post-commit pg-boss job** triggered from a committed event (the projection model) | **Audit log written synchronously inside the same transaction** as the mutation. No pg-boss. No projection. See Simplification 1. | Phase 2 corrects to the projection model. The synchronous audit_log write is replaced by an event write inside the transaction; pg-boss writes the audit_log projection after commit. The Phase 1 audit_log rows are backfilled into events. |

**The eight in one sentence:** Phase 1 is a single Next.js app with services
instead of agents, one contract file instead of a three-namespace package, a
synchronously-written audit log instead of an event-projection system, and a
deferred constraint instead of "deferred constraint or trigger" — and every one
of those simplifications has a named, scheduled Phase 2 correction.

**If anything in the rest of this document seems to contradict the Phase 1
plan, this table is the tiebreaker.** The Phase 1 column is what we build
first. The Phase 2 column is where we end up. The v0.4.0 column is the design
both columns are reaching for.

---

## Who This Is For

I am a **non-developer founder** building an internal accounting platform for a
Canadian family office. I have strong product vision but will need explicit,
step-by-step guidance — especially around environment setup, folder structure,
and where every piece of logic lives. Write the plan as if a brilliant senior
engineer is leaving an extremely detailed roadmap for a junior developer who has
never built a production app before, but who will be guided by an AI coding
assistant (Claude Code) throughout execution.

Every time a technical concept appears that a non-developer might not know, a
one-sentence plain-English explanation in parentheses follows it.

---

## The Product: What This Is and Why It Is Different

### Name (working title): **The Bridge**
Inspired by the command bridge of the Starship Enterprise — the central place
where the captain (the user) has total situational awareness and can issue
commands carried out by a trained crew (the AI agents).

### What existing software gets wrong

Puzzle.io and Pennylane are modern-looking wrappers around the same paradigm as
QuickBooks and Xero. They added an AI chatbot on top of a traditional accounting
system. That is the wrong direction. **The Bridge is an AI agent system that
happens to have a traditional accounting UI underneath it — not the reverse.**

The philosophical difference:
- In Xero, you open a screen, fill in a form, click Save. The AI is a helper.
- In The Bridge, the AI agent is the primary actor. It reads your email, sees
  the invoice, proposes the journal entry, shows you a confirmation card, and
  you approve with one click. The traditional screen exists as a fallback and a
  power-user tool — not the default path.

### What genuinely differentiates this product

1. **The Bridge UI pattern** — A persistent split-screen layout: AI agent chat
   on the left, a live Contextual Canvas on the right. When the agent references
   an invoice, P&L, reconciliation batch, or vendor record, it renders
   immediately in the canvas. The user never has to scroll back through chat
   history to find a table or graph. The canvas is stateful — drill-downs happen
   inside it without leaving the conversation.

2. **Agent Institutional Memory** — The agent builds an `org_context` knowledge
   store per organization: known vendors and their default GL mappings, recurring
   transaction patterns, seasonal expense rhythms, intercompany relationship
   maps, and approval rules. This memory is rule-based (stored as auditable
   records, not opaque model weights) so junior users are protected and
   controllers can review, edit, or override any learned rule. Trust is earned
   incrementally — the agent starts in "always confirm" mode and can be promoted
   to "auto-categorize with notification" for specific rule types after a
   controller explicitly unlocks that.

3. **Multi-entity consolidation as a first-class concept** — 50 organizations
   across healthcare, real estate, hotels, NYSE trading, global export, private
   equity, and restaurants. The platform must support: role-based org switching
   (CFO sees consolidated view; AP specialist sees their assigned entities),
   intercompany transaction detection and reciprocal entry matching,
   consolidated P&L with elimination entries, and entity-level roll-ups. No
   competitor handles this well for a family office context.

4. **AP Automation as the primary Phase 2 workflow** — The single most painful
   daily task is Accounts Payable. The AP Agent owns this workflow end-to-end
   beginning Phase 2: email ingestion → OCR → proposed journal entry with
   intercompany flag → confirmation card → post. **Phase 1 does not include the
   AP Agent.** Phase 1 proves the agent stack works for manual journal entries
   first; only after that proof does AP become safe to build.

5. **Confirmation-first mutation model** — Every AI-initiated financial write
   produces a structured **Proposed Entry Card** before anything touches the
   ledger. The card shows: entity name, vendor, amount, debit/credit lines,
   intercompany flag (if applicable), matched rule from institutional memory (if
   any), and a plain-English explanation of why the agent made this choice.
   One-click Approve or a free-text rejection reason. This is the trust layer
   that makes the system auditable.

6. **Industry-specific Chart of Accounts templates** — On org creation, the
   user selects an industry (healthcare, real estate, hospitality, trading,
   restaurant, holding company) and gets a pre-built IFRS-compliant CoA template.
   Phase 1.1 seeds only the templates the founder will actually use to create
   real orgs (likely two: holding company + real estate). The remaining four are
   added in Phase 1.3 or Phase 2 when needed.

7. **Trilingual interface** — English, French (fr-CA), and Traditional Mandarin
   (zh-Hant). All UI strings and report labels support i18n from day one. Agent
   responses are structured data, not English prose — the UI layer renders the
   localized text from the structured output.

---

## Non-Negotiable Constraints

- **Accounting standard:** IFRS (International Financial Reporting Standards)
- **Jurisdiction:** Canada — flag GST/HST implications throughout; Flinks is the
  preferred bank feed provider for Canadian institutions (not Plaid)
- **Languages:** English, French (fr-CA), Traditional Mandarin (zh-Hant)
- **Users:** ~100 across three personas (see below)
- **Entities:** ~50 organizations, multi-industry
- **Developer profile:** Solo non-developer founder using AI-assisted coding

---

## The Three User Personas

Design every screen, agent response, and permission model with these three
personas in mind. They are equally first-class.

### Persona 1: The Executive (CFO / Founder)
- Wants consolidated P&L across all entities, cash position, variance alerts
- Asks the agent high-level questions: "What compressed my hotel division's
  margins last quarter?" or "What's my runway across all entities if revenue
  drops 20%?"
- Approves large or unusual transactions
- Never wants to touch a journal entry manually
- Default landing: Consolidated Dashboard

### Persona 2: The Controller / Senior Accountant
- Manages month-end close, reviews AI-proposed entries, approves learned rules
- Needs full access to Chart of Accounts, Manual Journals, Period Locking,
  Intercompany Eliminations, and the AI Action Review queue
- Trusts the agent but verifies — wants to see the agent's reasoning, not just
  its answer
- Default landing: The Bridge (agent + canvas) with controller-level tool access

### Persona 3: The AP Specialist / Bookkeeper
- Primary daily loop (Phase 2+): process incoming bills, match bank transactions,
  reconcile
- Protected from making mistakes by the agent's rule-based guardrails — they
  cannot post to locked periods, cannot override intercompany flags, cannot
  approve their own entries
- The agent is their co-pilot: it pre-fills everything, they confirm
- Default landing (Phase 2+): AP Queue (inbox of pending AI-proposed entries)

---

## Locked-In Stack (v0.5.0)

| Layer | Choice | Notes |
|---|---|---|
| Language | TypeScript (strict mode, no `any` without justification comment) | End-to-end |
| Application | **Single Next.js app (Phase 1)** | API routes handle backend; no separate Express |
| Database & Auth | Supabase (PostgreSQL + Supabase Auth) | |
| AI Model | Claude (Anthropic) via `@anthropic-ai/sdk` | Model-agnostic abstraction layer |
| Repo | **Single Next.js repo (Phase 1)**, monorepo deferred to Phase 2 | |
| Deploy | Vercel | |
| Version Control | Git / GitHub | |
| IDE | VS Code | |
| API Testing | Postman | Deliver a collection per phase |
| Bank Feeds | Flinks (Canada-first) | Phase 2 |
| i18n | `next-intl` | English, fr-CA, zh-Hant |
| Background Jobs | **None in Phase 1** — pg-boss deferred to Phase 2 | |
| Logging | **`pino` with redact list** (Phase 1.1, Category A) | |

**What changed from v0.4.0:** The monorepo (`pnpm workspaces`) and the separate
Express backend are both deferred to Phase 2. Phase 1 ships as a single Next.js
app with Next.js API routes serving as the backend. The folder structure inside
`src/` mirrors the future monorepo layout (`src/services/`, `src/agent/`,
`src/db/`, `src/contracts/`) so the Phase 2 split is mechanical, not a rewrite.
See "Phase 1 Simplifications and Their Phase 2 Corrections" for the full
reasoning and the Phase 2 correction path.

---

## Critical Architectural Invariants

These are the rules every part of the system must obey. They are stated here
once and referenced everywhere else. Where Phase 1 temporarily bends an
invariant for shippability reasons, the bend is documented in the "Phase 1
Simplifications and Their Phase 2 Corrections" section, not buried in code.

### Invariant 1 — Service Layer

Business logic lives exclusively in `src/services/` (Phase 1) which becomes
`packages/services` in Phase 2. Next.js API routes, Next.js server components,
and (in Phase 2) agent tools are all thin adapters over service functions. No
exceptions. An API route handler must never contain a database query. An agent
tool must never contain accounting logic. A React server component that needs
data calls a service function — it does not import the Supabase client directly.

(Plain English: a "service function" is a normal TypeScript function that takes
typed inputs, runs a piece of business logic, talks to the database, and returns
a typed result. Putting all of them in one folder means you have exactly one
place to look when you ask "where is the rule for X?")

### Invariant 2 — The Two Laws of Service Architecture (v0.5.0 restatement)

In v0.4.0 these were stated as the Two Laws of Agent Architecture, with
"Database Agent" and "Double Entry Agent" as the enforcement points. In v0.5.0,
because Layer 1 and Layer 2 agents collapse to service functions in Phase 1
(see Phase 1 Simplifications), the Two Laws are restated in service terms. They
hold the same shape and the same intent.

> **Law 1:** All database access goes through `src/services/` only. No route
> handler, no agent tool, no React server component reads or writes the database
> directly.
>
> **Law 2:** All journal entries — regardless of source — are created by
> `journalEntryService.post()` only. No other function in the codebase may
> insert into `journal_entries` or `journal_lines`.
>
> **Enforcement mechanism:** These laws are enforced by code review and by the
> `withInvariants()` middleware wrapper on every service function. Any PR that
> introduces a direct database call outside `src/services/` must be rejected
> regardless of how urgent the reason seems.

**Phase 2 evolution.** When Layer 1 and Layer 2 agents are reintroduced in
Phase 2, Law 1 narrows to "all DB access goes through the Database Agent (which
wraps `packages/services`)" and Law 2 narrows to "all journal entries go through
the Double Entry Agent (which wraps `journalEntryService.post()`)." The service
layer remains the enforcement point in both phases. The agent layer in Phase 2
adds an additional outer ring; it does not replace the inner ring.

### Invariant 3 — The Four-Layer Truth Hierarchy (lower layers always win)

This is the single most important rule for resolving conflicts between parts of
the system. When two layers disagree about what is true, the lower layer wins.
Always. No exceptions.

```
Layer 4 — Cognitive Truth    → Agents (Phase 2+) / Service callers (Phase 1)
           Advisory only. They propose. They are never authoritative.
           A service caller saying "this entry is valid" means nothing if Layer 1 rejects it.

Layer 3 — Temporal Truth     → Event Stream (reserved seat in Phase 1, written from Phase 2)
           What happened, in order, replayable. The event stream is the
           single source of record for history once it begins being written.
           In Phase 1, audit_log serves this role synchronously inside the
           transaction (see Phase 1 Simplifications). Phase 2 promotes the
           events table to primary truth and demotes audit_log to a projection.

Layer 2 — Operational Truth  → Service Layer + Middleware Invariants
           Business rules, authorization, routing logic.
           Enforced by withInvariants() middleware before any database write.

Layer 1 — Physical Truth     → Database Constraints + Triggers
           The physics of the system. Cannot be bypassed by any code path.
           Debit=credit deferred constraint, period lock trigger, org_id constraints,
           events table append-only trigger.
           If Layer 1 rejects something, it is rejected. Full stop.
```

**Why this matters in practice:**
- "Service caller says posted but DB rejected" → DB wins. Entry never happened.
- "Service thinks valid but constraint rejects" → Constraint wins. Service gets an error.
- "Agent (Phase 2+) proposed account X" → Advisory only. Human confirms or rejects.

### Invariant 4 — Pre-Commit Invariant Validation

All invariant checks run BEFORE the database transaction commits. Invariants
are NEVER enforced by post-commit subscribers. The reason: if an invalid write
sneaks through to a committed state before being caught, the historical record
is corrupted. In an accounting system, corrupted truth in the audit trail is
catastrophic. The rule is absolute: validate first, write second, commit third —
all inside a single database transaction that rolls back entirely on any failure.

### Invariant 5 — Event Stream as Single Source of Truth (Phase 2+ — Phase 1 Exception Below)

**Phase 2+ form (the permanent design):** The event stream (`events` table,
append-only) is the only primary source of truth in the system. Everything else
is a derived projection: `audit_log` is a projection of events; GL account
balances are projections of `JournalEntryPostedEvent` records; dashboard figures
are projections of events. If a projection is wrong, fix it by correcting the
projection query — never by patching the projection table directly.

**Phase 1 form (temporary simplification — see Phase 1 Simplifications):** The
`events` table exists with its append-only trigger installed but is not written
to. `audit_log` is written synchronously inside the same transaction as the
mutation. This temporarily violates the "events as source of truth" rule, but
keeps Phase 1 operationally simple. Phase 2 begins writing to events,
introduces pg-boss for projection updates, and demotes `audit_log` to a derived
projection.

### Invariant 6 — No Free-Form Data at Service Boundaries

The LLM's natural language reasoning stays inside the agent layer (Phase 2+).
Every field that crosses the agent-to-service boundary must be typed, validated
by Zod schema (Plain English: Zod is a TypeScript library that lets you describe
the shape of an object once and then both check that real data matches that
shape and get TypeScript types from it for free), and deterministic. No
free-text amounts. No unvalidated account codes. No inferred values that
weren't explicitly retrieved from the database. If an agent cannot produce a
valid typed value for a required field, it must ask a clarifying question or
return an error — not guess.

In Phase 1, where the "agent" layer is minimal (just the Double Entry Agent
calling `journalEntryService.post()`), this invariant still holds: every input
to every service function is Zod-validated at the function boundary, and
`withInvariants()` middleware re-validates before execution.

---

## Phase 1 Simplifications and Their Phase 2 Corrections

This section is the most important new section in v0.5.0. It exists because
v0.5.0 deliberately bends three architectural rules to make Phase 1 shippable
by a solo non-developer founder. Each bend is named, the invariant it
temporarily violates is named, the Phase 2 correction is specified concretely,
and a Phase 2 acceptance criterion is given so the correction can be verified
when it happens.

**Read this section before reading the Phase 1.1 Execution Brief.** Without
it, the Phase 1.1 brief will look like it contradicts the rest of this Bible.
With it, you understand exactly which contradictions are deliberate, why, and
when they end.

These simplifications are not the permanent design. They are a deliberate,
time-limited concession to ship Phase 1. The Phase 2 corrections are not
optional improvements — they are scheduled, named, and tracked.

### Simplification 1 — Audit log written synchronously inside the transaction

**What Phase 1 does:** The `audit_log` row is written by the same service
function that writes the mutation, inside the same Postgres transaction. If
the mutation rolls back, the audit row rolls back with it. There is no
post-commit job, no projection layer, no pg-boss worker, no separate Audit
Agent. The function call looks roughly like this:

```typescript
await db.transaction(async (tx) => {
  await tx.insert('journal_entries', entry);
  await tx.insert('journal_lines', lines);
  await tx.insert('audit_log', auditRow);  // synchronous, same transaction
});
```

**Invariant temporarily violated:** Invariant 5 (Event Stream as Single Source
of Truth). In the permanent design, `audit_log` is a projection of events,
updated asynchronously after commit by a job triggered from a committed event.
In Phase 1, `audit_log` is the primary record, and the events table is not
written to at all.

**Why we accept this in Phase 1:** A solo non-developer founder running
pg-boss in a single Next.js Vercel deployment is operationally complex.
Vercel serverless functions are not a good home for long-running workers.
Adding pg-boss in Phase 1 means either running a separate worker process
(reintroducing the operational burden the monorepo deferral was supposed to
remove) or accepting unreliable job execution. Neither is acceptable. The
simpler synchronous path is correct for ~100 users on Phase 1 traffic.

**Phase 2 correction (concrete):**
1. Provision a long-lived worker host (Railway, Fly.io, or Render) — the
   same host that will run the separate Express backend after the monorepo
   split.
2. Install pg-boss against the existing Supabase Postgres database.
3. The `journalEntryService.post()` function changes: instead of writing
   `audit_log` directly inside the transaction, it writes a row to the
   `events` table inside the same transaction (the events table append-only
   trigger has been in place since Phase 1.1, so this is mechanical).
4. A pg-boss job subscribes to `JournalEntryPostedEvent` and writes the
   `audit_log` projection asynchronously after commit.
5. A backfill script replays every Phase 1 `audit_log` row into the events
   table so the historical record is reconstructed correctly. This script is
   written and tested before Phase 2 ships, not after.
   **v0.5.3 (A6): the backfill script must be pure `INSERT` — no
   `ON CONFLICT DO UPDATE`, no `UPSERT`, no `MERGE`.** The events table's
   append-only triggers (`BEFORE UPDATE`, `BEFORE DELETE`, and
   `BEFORE TRUNCATE` — v0.5.3) reject any statement that touches an
   existing row, and an `ON CONFLICT DO UPDATE` clause fires the
   `BEFORE UPDATE` trigger on the conflicting row. If the backfill
   script is run twice and attempts an upsert on the second run, it
   will be rejected by the trigger even though the script author
   intended idempotency. The correct idempotency pattern is: generate a
   deterministic `event_id` from (`aggregate_id`, `sequence_number`,
   `event_type`), and rely on a pre-check (`SELECT 1 FROM events
   WHERE event_id = $1`) to skip already-backfilled rows before
   INSERT. Tested against a Phase 1 audit_log snapshot in a scratch DB
   before Phase 2 shipping.

**Phase 2 acceptance criterion:** Querying `events` for any historical
`JournalEntryPostedEvent` returns the same data that exists in `audit_log`,
and a fresh `audit_log` rebuild from events produces a byte-identical result.

### Simplification 2 — Events table reserved-seat (created, not written)

**What Phase 1 does:** The `events` table is created in the Phase 1.1 initial
SQL migration with all columns the permanent design needs (`event_id`,
`event_type`, `org_id`, `aggregate_id`, `aggregate_type`, `payload jsonb`,
`occurred_at`, `recorded_at`, `trace_id`, `_event_version`, sequence column).
The append-only Postgres trigger that rejects any UPDATE or DELETE on the
table is installed and tested. **Nothing writes to it.** No service function
inserts events. No projection reads from it. It is a reserved seat at the
table.

**Invariant temporarily violated:** Invariant 5 (the events table is the
single source of truth). In Phase 1, `audit_log` plays that role, written
synchronously per Simplification 1.

**Why we accept this in Phase 1:** The retrofit cost of adding an events
table to a populated production database with real financial history is high
and risky. The cost of creating an empty table with the right schema and
trigger now is one SQL migration. We pay the small cost now to avoid the
large cost later. We do not write to it now because writing to it requires
the projection infrastructure (Simplification 1), which Phase 1 cannot
operate.

**Phase 2 correction (concrete):**
1. Phase 2 ships with `journalEntryService.post()` writing
   `JournalEntryPostedEvent` to the events table inside the same transaction
   as the mutation.
2. Every other mutating service function adds an event write the same way.
3. The pg-boss projection job (Simplification 1) reads from the events table
   to update `audit_log` and any other projections.
4. The backfill script from Simplification 1 populates the events table with
   reconstructed events from the Phase 1 `audit_log` history.

**Phase 2 acceptance criterion:** A SELECT against the events table returns
at least one row per Phase 2 journal entry mutation, and the historical
backfill rows are present and correctly typed.

### Simplification 3 — Layer 1 and Layer 2 "agents" collapsed to service functions

**What Phase 1 does:** The v0.4.0 design specified six named agents across
two layers: Auth Agent, Database Agent, and Audit Agent (Layer 1 Foundation),
plus Double Entry Agent, Chart of Accounts Agent, and Period Agent (Layer 2
Domain). v0.5.0 replaces them in Phase 1 with plain TypeScript service
functions in `src/services/`:

| v0.4.0 Agent | v0.5.0 Phase 1 equivalent |
|---|---|
| Auth Agent | `src/services/auth/canUserPerformAction()` |
| Database Agent | `src/services/` itself — there is no separate abstraction |
| Audit Agent | `src/services/audit/recordMutation()` called inline (Simplification 1) |
| Double Entry Agent | `src/services/accounting/journalEntryService.post()` |
| Chart of Accounts Agent | `src/services/accounting/chartOfAccountsService` |
| Period Agent | `src/services/accounting/periodService.isOpen()` |

The single agent that exists in Phase 1.2 is the **Double Entry Agent** —
which is the Claude tool definition that wraps `journalEntryService.post()`.
That is the entire agent surface area in Phase 1. Every other piece of
"agent" architecture from v0.4.0 is a service function.

**Invariant temporarily violated:** None directly. The Two Laws hold
verbatim in their v0.5.0 service-layer restatement (see Invariant 2). The
Four-Layer Truth Hierarchy still applies — Layer 4 (Cognitive) just has
fewer occupants in Phase 1.

**Why we accept this in Phase 1:** Building six named agents with input/output
contracts, system prompts, and orchestration before any of them have been
exercised against real workflows is premature design. You cannot generalize
the right shape for an agent class until you have at least two real agents
solving real problems. Phase 1 builds one (Double Entry) and proves it works.
Phase 2 builds the second (AP) and learns from the comparison what the actual
shared abstractions need to be.

**Phase 2 correction (concrete):**
1. When the AP Agent is built, it will reveal the shared infrastructure both
   agents need (system prompt loading, tool definition format, dry-run
   handling, idempotency check, trace propagation, error envelopes).
2. Extract that shared infrastructure into `packages/agent/` as part of the
   Phase 2 monorepo split.
3. Reintroduce the Layer 1 / Layer 2 / Layer 3 folder structure inside
   `packages/agent/` at that point — informed by what AP actually needed,
   not by what v0.4.0 guessed it would need.
4. The service functions do not move. They stay in `packages/services/` as
   the inner ring. The agent classes wrap them as the outer ring.

**Phase 2 acceptance criterion:** A new workflow agent (e.g., AR Agent in
Phase 3) can be added by writing only its system prompt, its tool definitions,
and any new service functions it needs. No edits required to existing agents
or to the agent infrastructure.

### What is NOT simplified

For the avoidance of doubt, these v0.4.0 commitments are unchanged in v0.5.0
and apply to Phase 1 in full:

- Multi-org from day one with `org_id` on every tenant-scoped table
- Multi-user with the three personas and `memberships` table from day one
- RLS policies on every tenant-scoped table from day one
- The `events` table created with append-only trigger from day one (just not written)
- Idempotency keys on every mutating operation from day one
- Trace IDs propagated from the orchestrator through every layer from day one
- IFRS Chart of Accounts structure from day one
- Multi-currency columns on every financial table from day one (see Section 2)
- Canadian tax codes table from day one
- Intercompany relationships table from day one (empty, but schema correct)
- The Bridge UI split-screen shell with Mainframe rail from day one
- Industry CoA templates seeded for the orgs the founder will actually use
- i18n URL structure `/[locale]/[orgId]/...` from day one
- The Two Laws (in v0.5.0 service-layer form) from day one
- The Four-Layer Truth Hierarchy from day one
- Pre-commit invariant validation via `withInvariants()` middleware from day one
- All Zod validation at every service boundary from day one
- The deferred constraint for debit=credit from day one (see Section 1d)

---

## A/B/C Categorization: What to Build When

This is the framework v0.5.0 uses to decide what goes in Phase 1 vs. later.
It is the most useful mental model in this Bible after the Truth Hierarchy.

- **Category A — Build now, no question.** Cheap to add now, painful to
  retrofit later. Multi-org columns, RLS, the events table schema,
  idempotency keys, trace IDs. The cost of adding these now is days. The
  cost of adding them later is months and silent bugs.
- **Category B — Foundation now, full implementation later.** Build the
  shape now so the Phase 2+ implementation slots into a correct structure.
  The Bridge split-screen UI shell, the i18n URL structure, the contracts
  folder with one real contract.
- **Category C — Genuine unknowns, defer.** Things whose correct shape
  cannot be known until reality teaches us. Streaming agent responses,
  prompt caching strategies, monorepo structure, the full three-namespace
  contracts package. Reality will tell us what these need to be.

### Category A — Build Now (Phase 1.1 Foundation)

Each item is non-negotiable for Phase 1.1.

| Item | Why now |
|---|---|
| `org_id` on every tenant-scoped table | Retrofitting multi-tenancy is one of the most painful refactors that exists |
| `memberships` table + `UserRole` enum + role-aware org switcher | Single-user-then-add-roles is a per-screen retrofit |
| `events` table created with append-only trigger (not written) | Reserved seat — see Simplification 2 |
| `idempotency_key` UUID column on every mutating operation | Prevents double-posting on retries; one column |
| Trace ID generated by the orchestrator and propagated through every layer | Without it, debugging a wrong journal entry is impossible |
| IFRS-structured Chart of Accounts | Different from GAAP; retrofit is painful |
| Multi-currency columns on `journal_lines`, `bills`, `invoices`, `bank_transactions` | `currency`, `amount_original`, `amount_cad`, `fx_rate` — uniform across all financial tables |
| `tax_codes` table for GST/HST abstraction | Never hardcode rates; one new row per rate change |
| `intercompany_relationships` table (empty in Phase 1) | The data model must be correct when Phase 2 arrives |
| `intercompany_batch_id` column on `journal_entries` (nullable) | Backfilling FK columns to a populated table is painful |
| `source` enum accepting `'manual' \| 'agent' \| 'import'` from day one | Avoids a Phase 1.2 migration when the agent path lights up |
| `autonomy_tier` enum on `vendor_rules` | Avoids adding a required field to a populated table in Phase 2 |
| `routing_path` field on the `ProposedEntryCard` TypeScript type | Display only in Phase 1; routing logic in Phase 2 — reserved |
| Boot-time assertion throwing on missing critical env vars | `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY` — refuse to start without them |
| `pino` structured logger with redact list configured at boot | Trace IDs are useless without a searchable log; redact list per Section 9e |
| Three integration tests as a correctness floor | (1) unbalanced entry rejected by deferred constraint, (2) post to locked period rejected, (3) cross-org RLS isolation |
| Seed script: 2 orgs + 3 users with three roles | Lets you nuke and rebuild local state in 30 seconds |
| Industry CoA templates seeded for ONLY the orgs you will actually create | Likely two: holding company + real estate. Other four added when needed. |

### Category B — Foundation Now, Full Implementation Later

Build the shell, slot in the implementation per phase.

| Item | Phase 1 form | Phase 2+ form |
|---|---|---|
| The Bridge split-screen UI | Shell with Mainframe rail, agent panel, canvas panel. Phase 1 canvas renders Chart of Accounts, Journal Entry form/list, basic P&L, AI Action Review. | Additional canvas views per phase. Shell unchanged. |
| Three-layer agent stack | Layer 1 + Layer 2 collapsed to service functions in `src/services/` (Simplification 3). Double Entry Agent is the one real agent, defined as a Claude tool wrapping `journalEntryService.post()`. | `packages/agent/` reintroduced with Layer 1/2/3 folder structure, informed by AP Agent's actual needs. |
| Contracts package | `src/contracts/` folder with one real file: `doubleEntry.contract.ts` containing the `PostJournalEntryCommand` schema with `_contract_version`, `trace_id`, `idempotency_key` as required fields. | Full three-namespace structure (`transport/`, `agent/`, `events/`) with TypeScript project references. Built when there are 5+ contracts and the pattern is clear. |
| i18n URL structure | `/[locale]/[orgId]/...` from day one. Only English strings populated in Phase 1.1. | French and Traditional Mandarin strings added per phase. URL structure unchanged. |
| Industry CoA templates | Two templates seeded (holding company + real estate). | Remaining four added in Phase 1.3 or Phase 2. |
| Mainframe icon rail | Built fully in Phase 1. Every Phase 1 canvas component must work without the agent — the Mainframe is the graceful degradation path when the Claude API is unavailable. | Unchanged. |

**Mainframe constraint (called out explicitly because it shapes every canvas
component):** No Phase 1 canvas component is allowed to require the agent to
function. The agent is a composer; the canvas components are standalone. This
is not a Phase 2 nicety — it is a Phase 1.1 build constraint.

### Category C — Defer Until Reality Teaches

Each of these is a decision that looks like progress but is actually
guessing without data.

| Item | Why defer |
|---|---|
| Monorepo with `pnpm workspaces` | Single Next.js app is adequate for Phase 1. Monorepo pays off when there are multiple deployable processes. Phase 2. |
| Separate Express backend | Next.js API routes handle ~100 users comfortably. Split when scale or background processing demands it. Phase 2. |
| Full three-namespace contracts package with TypeScript project references | Marginal value with one developer and one contract. Phase 2 when there are multiple contracts and the pattern is visible. |
| `pg-boss` background jobs | Phase 1 has zero async work. Adding it before there is work for it adds operational burden with no payoff. Phase 2 alongside AP email ingestion. |
| Full CQRS projection system | Events table is reserved-seat in Phase 1; projections come with Phase 2 (Simplification 1). |
| Flinks bank feeds | Cannot test without AP automation. Phase 2. |
| OCR and email ingestion | Phase 2. |
| Mobile responsive layout | Desktop-only in Phase 1. Phase 3. |
| Pre-populated ADRs (ADR-001 through ADR-007) | ADRs are valuable when written in anger with real tradeoffs. Pre-populated ADRs become cargo-cult docs that rot. `docs/decisions/` exists as an empty folder with a template README; ADRs are written as decisions are made, not before. |
| Pre-built Layer 3 workflow agent stubs (AP, AR, Reporting) | Premature design — you will throw it away in Phase 2 when you meet the real workflow. No stub files exist in Phase 1. |
| Generalizing the contracts pattern | Need at least two real contracts before generalizing. Phase 2. |

### One nuance on `intercompany_relationships`

The table exists in Phase 1.1 (Category A) because the cost is five columns
and a few foreign keys. **But nothing writes to it in Phase 1.** The value of
having it now is purely schema correctness for Phase 2. Add a comment on the
table definition: `-- Populated in Phase 2 by AP Agent. Do not write to manually.`
Do not let "the intercompany table exists" create a false sense that
intercompany handling exists. It does not exist until Phase 2.

---

## Section 1 — Architecture Overview

### 1a. Phase 1 Folder Tree (single Next.js app)

The Phase 1 folder structure inside `src/` mirrors the future monorepo layout
so that the Phase 2 split is mechanical (move folders out of `src/` into
`packages/`), not a rewrite.

```
the-bridge/                    # single Next.js app, single repo, no pnpm workspaces
  src/
    app/                       # Next.js App Router
      [locale]/
        [orgId]/
          accounting/
            chart-of-accounts/
              page.tsx         # CoA list canvas view
              [accountId]/
                page.tsx       # CoA detail
            journals/
              page.tsx         # Journal entry list canvas view
              new/
                page.tsx       # Manual journal entry form
              [entryId]/
                page.tsx       # Journal entry detail
          agent/
            actions/
              page.tsx         # AI Action Review queue (controller role)
          reports/
            pl/
              page.tsx         # Basic P&L canvas view (read-only)
        consolidated/
          dashboard/
            page.tsx           # Stub, role-gated
      admin/
        orgs/
          page.tsx             # Org creation with industry CoA template selection
      sign-in/
        page.tsx
      api/                     # Next.js API routes — thin adapters over src/services/
        accounting/
          journals/
            route.ts           # POST creates a journal entry via journalEntryService
          chart-of-accounts/
            route.ts
        agent/
          message/
            route.ts           # POST sends a user message to the orchestrator
          confirm/
            route.ts           # POST confirms a ProposedEntryCard
        health/
          route.ts             # GET health check
    services/                  # ALL business logic — Invariant 1, single source of truth
      auth/
        canUserPerformAction.ts
        getMembership.ts
      accounting/
        journalEntryService.ts          # journalEntryService.post() — Law 2 enforcement point
        chartOfAccountsService.ts
        periodService.ts                # periodService.isOpen() — replaces v0.4.0 Period Agent
      org/
        orgService.ts
        membershipService.ts
      audit/
        recordMutation.ts               # synchronous audit_log write — Simplification 1
      middleware/
        withInvariants.ts               # the universal service wrapper
        serviceContext.ts               # ServiceContext type with trace_id, org_id, caller
      index.ts                          # exports only — no logic
    agent/                              # the agent layer (minimal in Phase 1)
      orchestrator/
        index.ts                        # main agent loop — Claude API call, tool routing
        systemPrompts/
          controller.ts                 # one persona prompt — others added in Phase 2
          executive.ts
          apSpecialist.ts
      tools/
        postJournalEntry.ts             # the ONE tool definition — wraps journalEntryService.post()
        listChartOfAccounts.ts
        checkPeriod.ts
      session/
        agentSession.ts                 # AgentSession type, in-Postgres persistence
      memory/
        orgContextManager.ts            # loads vendor rules, intercompany map per org
      canvas/
        directives.ts                   # CanvasDirective discriminated union
    contracts/                          # one folder, one file in Phase 1
      doubleEntry.contract.ts           # PostJournalEntryCommand schema with version, trace, idempotency
    db/
      adminClient.ts                    # service-role Supabase client (server-only)
      userClient.ts                     # user-scoped Supabase client (RLS-respecting)
      types.ts                          # generated by `supabase gen types typescript`
      migrations/
        001_initial_schema.sql          # full Phase 1.1 migration (see Section 2d)
        seed/
          industryCoA.sql               # CoA templates for the orgs that will actually exist
          devUsers.sql                  # 2 orgs + 3 users — local dev only
    shared/
      schemas/                          # Zod primitives shared across services and UI
        accounting/
          journalEntry.schema.ts        # the canonical schema, imported by service + tool + form
        ids.schema.ts                   # branded UUID types
      types/
        proposedEntryCard.ts
        userRole.ts
      i18n/
        config.ts                       # next-intl config — en, fr-CA, zh-Hant
      logger/
        pino.ts                         # structured logger with redact list
    components/
      bridge/
        SplitScreenLayout.tsx           # the main shell — chat panel + canvas panel + Mainframe rail
        AgentChatPanel.tsx
        ContextualCanvas.tsx
        MainframeRail.tsx
      canvas/
        ChartOfAccountsView.tsx         # standalone — does not require the agent
        JournalEntryForm.tsx            # standalone
        JournalEntryList.tsx            # standalone
        ProposedEntryCard.tsx           # rendered when directive.type === 'proposed_entry_card'
        BasicPLView.tsx                 # standalone
        AIActionReviewQueue.tsx         # standalone
  messages/                             # next-intl translation files
    en.json                             # populated in Phase 1.1
    fr.json                             # placeholder structure, content in later phases
    zh-Hant.json                        # placeholder structure, content in later phases
  docs/
    prompt-history/
      CHANGELOG.md                      # master version log
      v0.5.0-phase1-simplification.md
    decisions/
      README.md                         # ADR template only — no pre-populated ADRs
    troubleshooting/
      rls.md                            # "if a query returns empty when you expect data, suspect RLS first"
  postman/
    collection.json
  tests/
    integration/
      unbalancedJournalEntry.test.ts    # Category A integration test 1
      lockedPeriodRejection.test.ts     # Category A integration test 2
      crossOrgRlsIsolation.test.ts      # Category A integration test 3
  .env.example
  .nvmrc
  next.config.ts
  package.json
  tsconfig.json
```

**The Phase 2 monorepo migration is mechanical:** `src/services/` → `packages/services/`,
`src/agent/` → `packages/agent/`, `src/db/` → `packages/db/`, `src/contracts/` →
`packages/contracts/`, `src/shared/` → `packages/shared/`. The Next.js app
becomes `apps/web/`. A new `apps/api/` is created. No business logic moves.
No agent logic moves. The seams are already in the right places.

### 1b. Root `package.json` Scripts Block

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:integration": "vitest run tests/integration",
    "db:start": "supabase start",
    "db:stop": "supabase stop",
    "db:migrate": "supabase db push",
    "db:reset": "supabase db reset",
    "db:generate-types": "supabase gen types typescript --local > src/db/types.ts",
    "db:seed": "psql $LOCAL_DATABASE_URL -f src/db/migrations/seed/devUsers.sql"
  }
}
```

(Plain English: `pnpm dev` starts everything you need with a single command.
No `concurrently`, no separate processes — just `next dev`. The agent runs
inside Next.js API routes for Phase 1.)

### 1c. Request Lifecycle Diagrams (ASCII)

**Manual path** (user fills out a form, submits):
```
Browser
  → Next.js page (server component) — gets session from Supabase Auth cookie
  → User submits form → POST to /api/accounting/journals
  → Next.js API route handler (thin adapter)
      → withInvariants(journalEntryService.post)(input, ctx)
          → Zod parse input against journalEntry.schema.ts
          → ServiceContext built with trace_id, org_id, caller
          → canUserPerformAction() — Auth check
          → periodService.isOpen() — Period check
          → BEGIN transaction
            → INSERT journal_entries
            → INSERT journal_lines (deferred constraint validates debit=credit at COMMIT)
            → recordMutation() → INSERT audit_log (Simplification 1)
          → COMMIT (deferred constraint runs here; ROLLBACK on failure)
      → Returns typed result
  → Next.js API route returns JSON
  → Browser renders updated journal entry list
```

RLS applies as defense-in-depth: the service-role Supabase client (used by
service functions) bypasses RLS, but any Next.js server component that reads
data directly uses the user-scoped client which respects RLS.

**Agent path (Phase 1 form — Double Entry only)**:
```
User types message in agent chat panel
  → POST to /api/agent/message with user_id, org_id, locale
  → Orchestrator (src/agent/orchestrator/index.ts)
      → Generates trace_id (UUID) — propagated through every downstream call
      → Loads AgentSession from Postgres (or creates new on org switch)
      → Loads OrgContext via orgContextManager
      → Builds system prompt (persona-aware) + conversation history
      → Calls Claude API with available tools (Phase 1: postJournalEntry, listChartOfAccounts, checkPeriod)
  → Claude returns a tool_use call: postJournalEntry with structured arguments
  → Orchestrator validates tool_use args against doubleEntry.contract.ts
      → If invalid: bounded retry (max 2) with validation error fed back to Claude
      → If still invalid: return error to user with clarification request
  → Orchestrator invokes the tool in DRY-RUN mode
      → withInvariants(journalEntryService.post)(input with dry_run=true, ctx)
          → All checks run, transaction begins, writes happen, ROLLBACK at end
          → Returns the ProposedEntryCard with dry_run_entry_id
  → Orchestrator wraps result with canvas_directive { type: 'proposed_entry_card', card }
  → API response streams back to UI
  → AgentChatPanel renders agent message inline
  → ContextualCanvas renders ProposedEntryCard
```

**Confirmation commit path** (user clicks Approve on a ProposedEntryCard):
```
User clicks Approve
  → POST to /api/agent/confirm with idempotency_key, dry_run_entry_id
  → Orchestrator
      → Looks up the dry-run result by dry_run_entry_id
      → Calls journalEntryService.post() AGAIN with dry_run=false and idempotency_key
          → Idempotency check: SELECT from ai_actions WHERE idempotency_key = ?
              → If found and Confirmed: return existing result (no work done)
              → If found and Pending: return existing card
              → If not found: proceed
          → BEGIN transaction
            → INSERT journal_entries
            → INSERT journal_lines (deferred constraint validates at COMMIT)
            → INSERT audit_log (Simplification 1)
            → INSERT ai_actions row with confirming_user_id, journal_entry_id, status='Confirmed'
          → COMMIT
  → Returns success + canvas_directive { type: 'journal_entry', entryId, mode: 'view' }
  → ContextualCanvas swaps from ProposedEntryCard to JournalEntryDetail view
```

### 1d. Double-Entry Integrity at the Database Level

**Decision (v0.5.0):** Debit=credit is enforced by a **deferred constraint**,
not a per-row trigger. A per-row trigger cannot check debit=credit because
debit=credit is a property of the *set* of journal lines, not any single line.
A trigger that fires after every row would either fail spuriously on the
first line (when there is no offsetting credit yet) or have to be deferred
manually to the last row (which the database does not know about). The
correct mechanism is a deferred constraint that runs at transaction COMMIT,
after all journal lines for the entry have been inserted.

```sql
-- Deferred constraint: debit = credit per journal entry
-- Runs at transaction COMMIT, after all journal_lines for the entry exist.

CREATE OR REPLACE FUNCTION enforce_journal_entry_balance()
RETURNS TRIGGER AS $$
DECLARE
  total_debit numeric(20,4);
  total_credit numeric(20,4);
BEGIN
  SELECT
    COALESCE(SUM(debit_amount), 0),
    COALESCE(SUM(credit_amount), 0)
  INTO total_debit, total_credit
  FROM journal_lines
  WHERE journal_entry_id = NEW.journal_entry_id;

  IF total_debit <> total_credit THEN
    RAISE EXCEPTION
      'Journal entry % is not balanced: debits=%, credits=%',
      NEW.journal_entry_id, total_debit, total_credit
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_enforce_journal_entry_balance
  AFTER INSERT OR UPDATE ON journal_lines
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION enforce_journal_entry_balance();
```

The `DEFERRABLE INITIALLY DEFERRED` clause is critical — it tells Postgres
to defer the check until COMMIT. Without it, the check fires after every
row insert and rejects the first line of every entry.

**Performance note (v0.5.3): this trigger fires N times at commit for N
inserted lines.** Postgres constraint triggers must be row-level
(`FOR EACH ROW` is the only form `CREATE CONSTRAINT TRIGGER` supports),
and deferred constraint trigger invocations are not deduplicated. So for
a 10-line entry, Postgres queues 10 deferred invocations and all 10 fire
at commit — each running the same `SUM(debit_amount), SUM(credit_amount)
WHERE journal_entry_id = X`. With the `(journal_entry_id)` index in place
(Section 2e) each SUM is cheap (~1 ms on Phase 1 data), so the cost is
~N ms per commit where N is lines-per-entry. For Phase 1 with 5–20 line
entries this is invisible. For Phase 2 AP batches with 50+ lines it will
be noticeable but still acceptable. **Do not treat this as a bug during
Phase 1.2 implementation** — it is correct behavior; all N invocations
return the same result. Do not try to "fix" it by switching to
`FOR EACH STATEMENT` (unsupported for deferrable constraint triggers) or
by adding `pg_trigger_depth()` guards (deferred triggers all fire at the
same depth, so the guard does not apply). If Phase 2 intercompany batches
show commit-latency issues, the path is to replace the constraint trigger
with an explicit `SELECT assert_journal_entry_balanced(entry_id)` call at
the end of `journalEntryService.post()` — but that moves enforcement from
Layer 1 (DB) to Layer 2 (service) and is a v0.6.0+ decision, not a
Phase 1.2 optimization.

**Other triggers (period lock, events table append-only) remain triggers**
because they enforce single-row rules, not set-level rules.

```sql
-- Period lock: reject any insert on journal_lines if the period is locked.
-- v0.5.3: the function takes a row-level lock on fiscal_periods via
-- SELECT ... FOR UPDATE before reading is_locked. This prevents the
-- race condition where transaction A reads is_locked=false, transaction
-- B locks the period and commits, and transaction A then commits lines
-- into a now-locked period. Under READ COMMITTED (the Postgres default
-- and the isolation level this system uses — see Section 10c), the
-- row lock serializes concurrent period-lock attempts behind any
-- in-flight journal post.
CREATE OR REPLACE FUNCTION enforce_period_not_locked()
RETURNS TRIGGER AS $$
DECLARE
  v_is_locked boolean;
BEGIN
  -- Row-lock the period row so any concurrent lock attempt waits for us.
  SELECT is_locked INTO v_is_locked
  FROM fiscal_periods
  WHERE period_id = (
    SELECT fiscal_period_id FROM journal_entries
    WHERE journal_entry_id = NEW.journal_entry_id
  )
  FOR UPDATE;

  IF v_is_locked THEN
    RAISE EXCEPTION
      'Cannot post to a locked fiscal period (journal_entry_id=%)',
      NEW.journal_entry_id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_period_not_locked
  BEFORE INSERT OR UPDATE ON journal_lines
  FOR EACH ROW
  EXECUTE FUNCTION enforce_period_not_locked();

-- Events table append-only: reject UPDATE, DELETE, AND TRUNCATE.
-- v0.5.3: TRUNCATE was previously uncovered — a BEFORE UPDATE/DELETE
-- trigger does not fire on TRUNCATE. Any role with table-owner privileges
-- (including service_role by default) could TRUNCATE events and wipe the
-- append-only history silently. We install a TRUNCATE trigger AND revoke
-- the privilege from every role that does not need it.
CREATE OR REPLACE FUNCTION reject_events_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'events table is append-only — UPDATE, DELETE, and TRUNCATE are forbidden'
    USING ERRCODE = 'feature_not_supported';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_events_no_update BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION reject_events_mutation();
CREATE TRIGGER trg_events_no_delete BEFORE DELETE ON events
  FOR EACH ROW EXECUTE FUNCTION reject_events_mutation();
CREATE TRIGGER trg_events_no_truncate BEFORE TRUNCATE ON events
  FOR EACH STATEMENT EXECUTE FUNCTION reject_events_mutation();

REVOKE TRUNCATE ON events FROM PUBLIC;
REVOKE TRUNCATE ON events FROM authenticated;
REVOKE TRUNCATE ON events FROM anon;
-- service_role retains TRUNCATE only because Supabase's automatic grants
-- cannot easily be revoked; the trigger above is the actual enforcement.
```

### 1e. Migration & Type Generation Strategy

**Migration tool:** Supabase CLI migrations. Justification: the project is
locked to Supabase for both database and auth; the Supabase CLI handles RLS
policies and Auth migrations natively; introducing an ORM-driven migration
tool (Prisma, Drizzle) adds a layer between you and the SQL you can already
read. Write SQL directly. It is the most durable skill in this stack.

**Type generation:** `supabase gen types typescript --local > src/db/types.ts`
after every migration. Wired as `pnpm db:generate-types`. Generated types are
committed to the repo so reviewers can see schema changes in PRs.

**Workflow:**
1. Write SQL migration file in `src/db/migrations/`
2. `pnpm db:migrate` — applies to local Supabase
3. `pnpm db:generate-types` — regenerates TypeScript types
4. Run `pnpm test:integration` to verify the three Category A tests still pass
5. Commit migration + generated types in the same PR

---

## Section 2 — Data Model

### 2a. Core Tables

For every tenant-scoped table, `org_id` is a required non-null foreign key to
`organizations`.

**`organizations`** — `org_id` (UUID PK), `name`, `legal_name`,
`industry` (enum: healthcare, real_estate, hospitality, trading, restaurant,
holding_company), `functional_currency` (default 'CAD'), `fiscal_year_start_month`,
`created_at`, `created_by`.

**`memberships`** — `membership_id` (UUID PK), `user_id` (FK to
`auth.users(id) ON DELETE CASCADE` — v0.5.3: cascade is required; without
it, the seed script's idempotent `deleteUser` call fails silently on the
second run, leaving the prior user row in place while `createUser` errors,
and any production user-deletion path will also break on FK violation),
`org_id` (FK), `role` (enum: executive, controller, ap_specialist),
`created_at`. UNIQUE on `(user_id, org_id)`.

**`org_context`** — `context_id` (UUID PK), `org_id` (FK), `key`, `value` (jsonb),
`updated_at`. Institutional memory keyed by org. Phase 1 stores fiscal calendar
hints; Phase 2 stores vendor-rule lookups.

**`chart_of_accounts_templates`** — template definitions per industry. Seed
data lives here. Columns: `template_id`, `industry`, `account_code`,
`account_name`, `account_type` (enum: asset, liability, equity, revenue,
expense), `parent_account_code`, `is_intercompany_capable`.

**`chart_of_accounts`** — `account_id` (UUID PK), `org_id` (FK),
`account_code`, `account_name`, `account_type`, `parent_account_id` (self-FK,
nullable), `is_intercompany_capable`, `is_active`, `created_at`. UNIQUE on
`(org_id, account_code)`.

**`fiscal_periods`** — `period_id` (UUID PK), `org_id` (FK), `name`,
`start_date`, `end_date`, `is_locked` (boolean default false),
`locked_at`, `locked_by_user_id`. UNIQUE on `(org_id, start_date, end_date)`.

**`journal_entries`** — `journal_entry_id` (UUID PK), `org_id` (FK),
`fiscal_period_id` (FK), `entry_date`, `description`, `reference`,
`source` (enum: 'manual' | 'agent' | 'import' — **all three values from day one**),
`intercompany_batch_id` (UUID, nullable — Category A reservation),
`created_at`, `created_by`, `idempotency_key` (UUID, nullable for manual,
required for agent — see ai_actions).

**`journal_lines`** — `journal_line_id` (UUID PK), `journal_entry_id` (FK),
`account_id` (FK), `description`, `debit_amount` (numeric(20,4) default 0),
`credit_amount` (numeric(20,4) default 0), `tax_code_id` (FK, nullable),
**multi-currency columns from day one**: `currency` (char(3) default 'CAD'),
`amount_original` (numeric(20,4)), `amount_cad` (numeric(20,4)),
`fx_rate` (numeric(20,8) default 1.0). CHECK `(debit_amount >= 0 AND credit_amount >= 0)`.
CHECK `(debit_amount = 0 OR credit_amount = 0)` (a line is either a debit or
a credit, never both).

**`customers`** — `customer_id` (UUID PK), `org_id` (FK), `name`, `email`,
`tax_id`, `is_active`, `created_at`.

**`vendors`** — `vendor_id` (UUID PK), `org_id` (FK), `name`, `email`,
`tax_id`, `default_currency`, `is_intercompany_entity_id` (FK to
`organizations`, nullable — set when this vendor is actually one of the 50
orgs), `is_active`, `created_at`.

**`vendor_rules`** — `rule_id` (UUID PK), `org_id` (FK), `vendor_id` (FK),
`default_account_id` (FK to `chart_of_accounts`),
**`autonomy_tier`** (enum: 'always_confirm' | 'notify_auto' | 'silent', default
'always_confirm' — Category A reservation), `created_at`, `created_by`,
`approved_at`, `approved_by`. **Empty in Phase 1.** Phase 2 begins populating.

**`items`** — `item_id`, `org_id`, `name`, `default_account_id`,
`default_price`, `default_tax_code_id`. (For invoice/bill line items —
unused in Phase 1, schema present.)

**`invoices`** + **`invoice_lines`** — Phase 2+, schema present in Phase 1.1
with multi-currency columns.

**`bills`** + **`bill_lines`** — Phase 2+, schema present in Phase 1.1 with
multi-currency columns.

**`payments`** — Phase 2+, schema present.

**`bank_accounts`** — `bank_account_id`, `org_id`, `name`, `institution`,
`account_number_last_four`, `currency`, `is_active`. Phase 2+ active.

**`bank_transactions`** — Phase 2+, schema present in Phase 1.1 with
multi-currency columns.

**`intercompany_relationships`** — `relationship_id` (UUID PK),
`org_a_id` (FK), `org_b_id` (FK), `org_a_due_to_account_id` (FK),
`org_b_due_from_account_id` (FK), `created_at`. UNIQUE on `(org_a_id, org_b_id)`.
**Empty in Phase 1.** Comment on the table: `-- Populated in Phase 2 by AP
Agent. Do not write to manually.`

**`tax_codes`** — `tax_code_id` (UUID PK), `org_id` (FK, nullable for
shared codes), `code` (e.g., 'GST', 'HST_ON', 'HST_BC'), `rate` (numeric(6,4)),
`jurisdiction`, `effective_from` (date), `effective_to` (date, nullable).
Seeded with current Canadian federal/provincial rates.

**`audit_log`** — `audit_log_id` (UUID PK), `org_id` (FK), `user_id`,
`session_id`, `trace_id`, `action`, `entity_type`, `entity_id`,
`before_state` (jsonb, nullable), `after_state_id` (UUID),
`tool_name` (nullable), `idempotency_key` (nullable), `created_at`.
**Phase 1: written synchronously inside the mutation transaction (Simplification 1).**
**Phase 2: written asynchronously by pg-boss as a projection of events.**

**`ai_actions`** — `ai_action_id` (UUID PK), `org_id` (FK), `user_id`,
`session_id`, `trace_id`, `tool_name`, `prompt`, `tool_input` (jsonb),
`status` (enum: 'pending' | 'confirmed' | 'rejected' | 'auto_posted' | 'stale'),
`confidence` (enum: 'high' | 'medium' | 'low' | 'novel', nullable),
`routing_path` (text, nullable — Category A reservation, used in Phase 2),
`journal_entry_id` (FK, nullable), `confirming_user_id` (nullable),
`rejection_reason` (text, nullable), `idempotency_key` (UUID),
`response_payload` (jsonb, nullable — cached dry-run result for
idempotent replay), `staled_at` (timestamptz, nullable),
`created_at`, `confirmed_at`. UNIQUE on `(org_id, idempotency_key)`.
**v0.5.3: `ai_actions` row insertion happens inside the same mutation
transaction as the `journal_entries` write during the confirm path, not
before it.** The dry-run path inserts an `ai_actions` row in `pending`
status in its own transaction (required so the idempotency_key slot is
claimed before the user clicks Approve). The confirm path runs a single
transaction that (a) loads the pending `ai_actions` row `FOR UPDATE`,
(b) inserts `journal_entries` + `journal_lines` + `audit_log`, (c) flips
`ai_actions.status` to `confirmed` and sets `journal_entry_id` and
`confirmed_at`, and commits. If any step fails, the transaction rolls
back and `ai_actions.status` returns to `pending`. The `stale` status
plus `staled_at` timestamp covers the mid-conversation API failure case
from Phase 1.2 exit criterion #16: if a pending action cannot be
confirmed because the Claude context is lost, a cleanup path marks it
`stale` rather than leaving it `pending` forever.

**`events`** — `event_id` (UUID PK), `event_type` (text), `org_id` (FK),
`aggregate_id` (UUID), `aggregate_type` (text), `payload` (jsonb),
`occurred_at` (timestamptz), `recorded_at` (timestamptz default now()),
`trace_id` (UUID), `_event_version` (text), `sequence_number` (bigserial).
**Phase 1: created with append-only trigger, NOT written to (Simplification 2).**
**Phase 2: begins receiving writes inside mutation transactions.**
**v0.5.3 — `sequence_number` gap warning:** `bigserial` is monotonic but
Postgres sequences increment regardless of transaction outcome. A
rolled-back `INSERT INTO events` leaves a gap in `sequence_number`.
Replay logic must order by `(occurred_at, sequence_number)` and must
never assume gap-free density. Any Phase 2+ code that does
`WHERE sequence_number BETWEEN X AND Y` assuming every integer in that
range maps to a real event is wrong. `occurred_at` is the temporal
source of truth; `sequence_number` is only a tiebreaker.

**`agent_sessions`** — `session_id` (UUID PK), `user_id`, `org_id`,
`locale`, `started_at`, `last_activity_at`, `state` (jsonb).
Persistence for in-flight conversations. Cleaned up after 30 days.

### 2b. Key Database Invariants

| Invariant | Mechanism | Notes |
|---|---|---|
| `SUM(debits) = SUM(credits)` per journal entry | **Deferred constraint** (Section 1d) | Runs at COMMIT; fires N times per N-line entry, all redundant but correct |
| Period not locked when posting | BEFORE INSERT trigger on `journal_lines` with row lock on `fiscal_periods` | Row lock prevents race with concurrent `UPDATE fiscal_periods SET is_locked = true` |
| `events` table append-only | BEFORE UPDATE/DELETE/**TRUNCATE** triggers reject all | v0.5.3: TRUNCATE trigger added; no code path can bypass |
| `org_id` NOT NULL on every tenant-scoped table | Column constraint | |
| `bill_lines.amount` positive | CHECK constraint | |
| `idempotency_key` unique per org on `ai_actions` | UNIQUE constraint on `(org_id, idempotency_key)` | |
| Journal line is debit OR credit, not both | CHECK on `journal_lines` | |
| **Journal line is never all-zero** (v0.5.3, D11) | CHECK on `journal_lines`: `(debit_amount >= 0 AND credit_amount >= 0) AND (debit_amount > 0 OR credit_amount > 0)` | Zero-value lines that technically balance are invisible audit errors — worse than rejected entries. At least one side must be non-zero. |
| **Multi-currency amount invariant** (v0.5.3, D5) | CHECK on `journal_lines`: `amount_original = debit_amount + credit_amount AND amount_cad = ROUND(amount_original * fx_rate, 4)` | Prevents silent P&L corruption where debit=credit holds but `amount_cad` is unpopulated or mismatched. For CAD functional currency, `fx_rate = 1.0` and `amount_cad = amount_original`. |
| **Idempotency key required for agent source** (v0.5.3, D7) | CHECK on `journal_entries`: `source != 'agent' OR idempotency_key IS NOT NULL` | Makes the Bible's "nullable for manual, required for agent" rule a DB-enforced constraint instead of TypeScript-side discipline. |

### 2c. RLS Policies

**v0.5.3 — coverage rule:** RLS is enabled on every tenant-scoped table
in the Phase 1.1 initial migration. v0.5.1 and v0.5.2 only documented
three tables; v0.5.3 completes the set. Missing RLS is not the same as
"RLS returns no rows" — on a table where RLS was never `ENABLE`d, every
authenticated caller sees every row regardless of policy, which would
silently break the "every tenant-scoped table from day one" promise in
the Phase 1 Simplifications section.

```sql
-- ------------------------------------------------------------------
-- Helper: does the current user have a membership in this org?
-- v0.5.3 — hardened SECURITY DEFINER:
--   * SET search_path = '' to prevent search-path injection attacks
--     (a malicious role cannot shadow `public.memberships` with a
--     local temp table because every reference is schema-qualified)
--   * explicit grant only to `authenticated`; revoke from PUBLIC so
--     the anon role cannot enumerate membership via this function
--   * STABLE means the optimizer can memoize within a single statement
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_has_org_access(target_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = auth.uid() AND org_id = target_org_id
  );
$$;

REVOKE ALL ON FUNCTION public.user_has_org_access(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_has_org_access(uuid) TO authenticated;

-- Helper: is the current user a controller in this org? Used by the
-- audit_log and ai_actions policies. Same hardening.
CREATE OR REPLACE FUNCTION public.user_is_controller(target_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = auth.uid()
      AND org_id = target_org_id
      AND role = 'controller'
  );
$$;

REVOKE ALL ON FUNCTION public.user_is_controller(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_is_controller(uuid) TO authenticated;

-- ------------------------------------------------------------------
-- Standard tenant-scoped pattern (applied to ~14 tables below).
-- Each gets: SELECT + INSERT by membership; UPDATE + DELETE deny.
-- UPDATE and DELETE are not used in Phase 1 for any accounting data;
-- corrections are via reversal entries. Non-accounting tables that
-- need UPDATE (e.g., vendors, customers) are listed separately below.
-- ------------------------------------------------------------------

-- organizations — users see orgs they have membership in
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY organizations_select ON organizations
  FOR SELECT USING (user_has_org_access(org_id));
-- Insert via service-role client only (org creation flow); no user-client policy.

-- memberships — users see their own memberships; controllers see all in their orgs
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY memberships_select ON memberships
  FOR SELECT USING (
    user_id = auth.uid() OR user_is_controller(org_id)
  );

-- chart_of_accounts — standard tenant pattern, no UPDATE/DELETE
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY chart_of_accounts_select ON chart_of_accounts
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY chart_of_accounts_insert ON chart_of_accounts
  FOR INSERT WITH CHECK (user_has_org_access(org_id));
CREATE POLICY chart_of_accounts_update ON chart_of_accounts
  FOR UPDATE USING (user_has_org_access(org_id));
-- No DELETE — accounts are deactivated via is_active, not deleted

-- fiscal_periods — members can see, controllers can lock
ALTER TABLE fiscal_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY fiscal_periods_select ON fiscal_periods
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY fiscal_periods_insert ON fiscal_periods
  FOR INSERT WITH CHECK (user_is_controller(org_id));
CREATE POLICY fiscal_periods_update ON fiscal_periods
  FOR UPDATE USING (user_is_controller(org_id));
-- No DELETE — periods are immutable history

-- journal_entries — standard pattern; UPDATE and DELETE denied for audit integrity
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY journal_entries_select ON journal_entries
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY journal_entries_insert ON journal_entries
  FOR INSERT WITH CHECK (user_has_org_access(org_id));
CREATE POLICY journal_entries_no_update ON journal_entries
  FOR UPDATE USING (false);  -- never updatable; corrections via reversal entries
CREATE POLICY journal_entries_no_delete ON journal_entries
  FOR DELETE USING (false);  -- never deletable

-- journal_lines — inherits the org via its parent journal_entry
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY journal_lines_select ON journal_lines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM journal_entries je
      WHERE je.journal_entry_id = journal_lines.journal_entry_id
        AND user_has_org_access(je.org_id)
    )
  );
CREATE POLICY journal_lines_insert ON journal_lines
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM journal_entries je
      WHERE je.journal_entry_id = journal_lines.journal_entry_id
        AND user_has_org_access(je.org_id)
    )
  );
CREATE POLICY journal_lines_no_update ON journal_lines
  FOR UPDATE USING (false);
CREATE POLICY journal_lines_no_delete ON journal_lines
  FOR DELETE USING (false);

-- vendors — standard tenant pattern with UPDATE allowed
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY vendors_select ON vendors
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY vendors_insert ON vendors
  FOR INSERT WITH CHECK (user_has_org_access(org_id));
CREATE POLICY vendors_update ON vendors
  FOR UPDATE USING (user_has_org_access(org_id));

-- customers — same as vendors
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY customers_select ON customers
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY customers_insert ON customers
  FOR INSERT WITH CHECK (user_has_org_access(org_id));
CREATE POLICY customers_update ON customers
  FOR UPDATE USING (user_has_org_access(org_id));

-- vendor_rules — controller-only write; all members can read
ALTER TABLE vendor_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY vendor_rules_select ON vendor_rules
  FOR SELECT USING (user_has_org_access(org_id));
CREATE POLICY vendor_rules_cud ON vendor_rules
  FOR ALL USING (user_is_controller(org_id))
  WITH CHECK (user_is_controller(org_id));

-- bills, bill_lines, invoices, invoice_lines, payments,
-- bank_accounts, bank_transactions — all standard tenant pattern.
-- Phase 1 does not use these tables; policies exist so that when
-- Phase 2 lights them up, the security model is not a retrofit.
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY bills_tenant ON bills FOR ALL
  USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));

ALTER TABLE bill_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY bill_lines_tenant ON bill_lines FOR ALL
  USING (EXISTS (SELECT 1 FROM bills b WHERE b.bill_id = bill_lines.bill_id AND user_has_org_access(b.org_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM bills b WHERE b.bill_id = bill_lines.bill_id AND user_has_org_access(b.org_id)));

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoices_tenant ON invoices FOR ALL
  USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));

ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoice_lines_tenant ON invoice_lines FOR ALL
  USING (EXISTS (SELECT 1 FROM invoices i WHERE i.invoice_id = invoice_lines.invoice_id AND user_has_org_access(i.org_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM invoices i WHERE i.invoice_id = invoice_lines.invoice_id AND user_has_org_access(i.org_id)));

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY payments_tenant ON payments FOR ALL
  USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY bank_accounts_tenant ON bank_accounts FOR ALL
  USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));

ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY bank_transactions_tenant ON bank_transactions FOR ALL
  USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));

ALTER TABLE items ENABLE ROW LEVEL SECURITY;
CREATE POLICY items_tenant ON items FOR ALL
  USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));

ALTER TABLE intercompany_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY intercompany_relationships_select ON intercompany_relationships
  FOR SELECT USING (user_has_org_access(org_a_id) OR user_has_org_access(org_b_id));
-- Inserts go through the service-role client only in Phase 2.

ALTER TABLE org_context ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_context_tenant ON org_context FOR ALL
  USING (user_has_org_access(org_id))
  WITH CHECK (user_has_org_access(org_id));

ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY agent_sessions_select ON agent_sessions
  FOR SELECT USING (user_id = auth.uid());
-- Inserts/updates via service-role client only.

-- audit_log — same-org members can read, nobody can write from user client
-- (service-role bypasses RLS for the synchronous audit write in Phase 1)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_log_select ON audit_log
  FOR SELECT USING (user_has_org_access(org_id));
-- No INSERT policy — service-role only.

-- events — Phase 1 is not written to via user client; still enable RLS
-- for defense in depth when Phase 2 begins writing
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY events_select ON events
  FOR SELECT USING (user_has_org_access(org_id));
-- No INSERT policy — service-role only in Phase 2.

-- ai_actions — initiator OR same-org controller can read
ALTER TABLE ai_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_actions_select ON ai_actions
  FOR SELECT USING (
    user_id = auth.uid() OR user_is_controller(org_id)
  );
-- Inserts via service-role client only.

-- ------------------------------------------------------------------
-- Three explicit exceptions (tables that do NOT follow the tenant pattern):
-- ------------------------------------------------------------------

-- chart_of_accounts_templates — global, industry-keyed, not org-scoped.
-- Readable by all authenticated users. No RLS needed; revoke write.
ALTER TABLE chart_of_accounts_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY coa_templates_select ON chart_of_accounts_templates
  FOR SELECT TO authenticated USING (true);
-- No INSERT/UPDATE/DELETE policy — seeded via migration only.

-- tax_codes — can be org-scoped (custom) or shared (org_id IS NULL).
-- Shared codes visible to all authenticated; org codes to that org.
ALTER TABLE tax_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY tax_codes_select ON tax_codes
  FOR SELECT USING (
    org_id IS NULL OR user_has_org_access(org_id)
  );
-- Inserts/updates via service-role client only (Canadian rate table maintenance).

-- auth.users — managed by Supabase Auth itself; do not touch.
```

**Why two Supabase clients?** The Next.js API routes (`src/app/api/`) and
service functions use the **service-role client** (`src/db/adminClient.ts`)
which bypasses RLS. This is because the service layer has already
authenticated and authorized the request via `canUserPerformAction()`, and
RLS at this layer would just be a second copy of the same check. Any Next.js
**server component** that reads data directly uses the **user-scoped client**
(`src/db/userClient.ts`) which respects RLS as defense-in-depth. The rule is:
service functions trust themselves; UI server components trust RLS.

### 2d. First-Pass SQL Migration

The full `001_initial_schema.sql` migration is delivered as part of the
**Phase 1.1 Execution Brief** (Part 2 of PLAN.md, written next). It will
contain: all table DDL listed in 2a, all constraints from 2b, all RLS policies
from 2c, all indexes from 2e, all triggers (deferred constraint for
debit=credit, period lock, events append-only), and seed INSERT statements
for the two industry CoA templates the founder will actually use first
(holding company + real estate). The remaining four templates (healthcare,
hospitality, trading, restaurant) are added in Phase 1.3 or Phase 2 when
needed.

### 2e. Index Plan

Every index is justified by a query pattern.

| Index | Query pattern |
|---|---|
| `journal_lines (org_id, account_id, entry_date)` | P&L and balance sheet roll-ups |
| `journal_entries (org_id, fiscal_period_id)` | Period close, period-scoped lists |
| `journal_entries (org_id, intercompany_batch_id)` | Phase 2 reciprocal entry lookup |
| `invoices (org_id, customer_id, status)` | AR aging (Phase 2+) |
| `bills (org_id, vendor_id, status)` | AP queue and aging (Phase 2+) |
| `bank_transactions (org_id, bank_account_id, posted_at)` | Reconciliation (Phase 2+) |
| `ai_actions (org_id, created_at, status)` | AI Action Review queue |
| `ai_actions (org_id, idempotency_key)` UNIQUE | Idempotency lookup |
| `vendor_rules (org_id, vendor_id)` | Phase 2 institutional memory lookup |
| `memberships (user_id, org_id)` UNIQUE | RLS helper, org switcher |
| `events (org_id, aggregate_id, sequence_number)` | Phase 2 event replay |
| `events (trace_id)` | Cross-layer trace correlation |
| `audit_log (org_id, trace_id)` | Trace correlation |
| `audit_log (org_id, created_at)` | Audit timeline |

---

## Section 3 — Shared Schemas: Worked Example (`postJournalEntry`)

The worked example demonstrates the entire Phase 1 stack working end-to-end
for the simplest possible financial transaction. Every other module follows
the same pattern.

**Why this example?** A journal entry is the atom of accounting. Every other
module — bills, invoices, payments, reconciliation — eventually produces a
journal entry. If `postJournalEntry` works correctly with the full stack
(Zod validation → service middleware → deferred constraint → audit log →
canvas directive), every other module can follow the same pattern. Phase 1.1
proves the manual path; Phase 1.2 proves the agent path on top of the same
service function.

### 3a. Zod Input Schema

**v0.5.3 — money never crosses the service boundary as a JavaScript
`Number`.** JavaScript numbers are IEEE 754 doubles. `0.1 + 0.2` equals
`0.30000000000000004`, not `0.3`. For a single entry the error is
invisible (Postgres rounds it back to `numeric(20,4)`). For a year of
entries the accumulated rounding produces P&L figures that disagree
with the per-entry sums, *even though every entry passes the deferred
constraint*. The multi-currency case is worse: `amount_cad =
amount_original * fx_rate` computed in JS with an 8-decimal FX rate
loses precision on the way to a 4-decimal CAD value, and the result
does not match what Postgres would compute for the same inputs —
silently breaking the D5 invariant (`amount_cad = ROUND(amount_original
* fx_rate, 4)`).

**The rule:** every field that represents money or an FX rate is a
`z.string()` matching a strict decimal regex at the service boundary.
Arithmetic on money happens in Postgres (`numeric` type) or via a
decimal library (`decimal.js`) — never via JS `+`, `*`, or `reduce`.
Branded types make misuse a compile-time error.

`src/shared/schemas/accounting/money.schema.ts`:

```typescript
import { z } from 'zod';
import Decimal from 'decimal.js';

// Money is always a string at the boundary. The regex matches an
// optional sign, up to 16 digits before the decimal, and 0-4 digits
// after. This fits numeric(20,4) exactly. Rejects scientific notation,
// commas, currency symbols, and whitespace.
export const MoneyAmountSchema = z
  .string()
  .regex(/^-?\d{1,16}(\.\d{1,4})?$/, 'must be a decimal string with up to 4 fractional digits');

// FX rates are numeric(20,8) — up to 8 fractional digits.
export const FxRateSchema = z
  .string()
  .regex(/^-?\d{1,12}(\.\d{1,8})?$/, 'must be a decimal string with up to 8 fractional digits');

// Branded types so you cannot accidentally pass a raw string where
// a MoneyAmount is expected. Parse once, thread the brand everywhere.
export type MoneyAmount = string & { readonly __brand: 'MoneyAmount' };
export type FxRate = string & { readonly __brand: 'FxRate' };

// Helper for arithmetic that MUST go through decimal.js, not JS math.
export function addMoney(a: MoneyAmount, b: MoneyAmount): MoneyAmount {
  return new Decimal(a).plus(new Decimal(b)).toFixed(4) as MoneyAmount;
}

export function multiplyMoneyByRate(amount: MoneyAmount, rate: FxRate): MoneyAmount {
  // Matches Postgres ROUND(amount * rate, 4) behavior (HALF_UP).
  return new Decimal(amount)
    .times(new Decimal(rate))
    .toDecimalPlaces(4, Decimal.ROUND_HALF_UP)
    .toFixed(4) as MoneyAmount;
}

export function eqMoney(a: MoneyAmount, b: MoneyAmount): boolean {
  return new Decimal(a).eq(new Decimal(b));
}
```

`src/shared/schemas/accounting/journalEntry.schema.ts`:

```typescript
import { z } from 'zod';
import Decimal from 'decimal.js';
import { MoneyAmountSchema, FxRateSchema, type MoneyAmount } from './money.schema';

// Plain English: a Zod schema is a runtime check that a JavaScript object
// has the shape you expect. It also produces a TypeScript type for free.
// `.refine()` adds custom validation beyond simple type checks.

export const JournalLineInputSchema = z.object({
  account_id: z.string().uuid(),
  description: z.string().max(500).optional(),
  debit_amount: MoneyAmountSchema,
  credit_amount: MoneyAmountSchema,
  tax_code_id: z.string().uuid().optional(),
  // Multi-currency fields — Category A, present from day one.
  // All monetary values are decimal strings, never JS Numbers.
  currency: z.string().length(3).default('CAD'),
  amount_original: MoneyAmountSchema,
  amount_cad: MoneyAmountSchema,
  fx_rate: FxRateSchema.default('1.00000000'),
}).refine(
  // Exactly one side must be non-zero (matches the D11 DB CHECK constraint
  // — at least one side > 0, never both positive).
  (line) => {
    const d = new Decimal(line.debit_amount);
    const c = new Decimal(line.credit_amount);
    return (d.gt(0) && c.eq(0)) || (d.eq(0) && c.gt(0));
  },
  { message: 'A journal line must be exactly one of: a positive debit or a positive credit. Zero-value lines are rejected (D11).' }
).refine(
  // amount_original = debit_amount + credit_amount (matches the D5 DB CHECK).
  (line) => {
    const d = new Decimal(line.debit_amount);
    const c = new Decimal(line.credit_amount);
    const original = new Decimal(line.amount_original);
    return original.eq(d.plus(c));
  },
  { message: 'amount_original must equal debit_amount + credit_amount.' }
).refine(
  // amount_cad = ROUND(amount_original * fx_rate, 4) (matches the D5 DB CHECK).
  (line) => {
    const computed = new Decimal(line.amount_original)
      .times(new Decimal(line.fx_rate))
      .toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
    return computed.eq(new Decimal(line.amount_cad));
  },
  { message: 'amount_cad must equal ROUND(amount_original * fx_rate, 4). Recompute using multiplyMoneyByRate().' }
);

export const PostJournalEntryInputSchema = z.object({
  org_id: z.string().uuid(),
  entry_date: z.string().date(),
  description: z.string().min(1).max(500),
  reference: z.string().max(100).optional(),
  fiscal_period_id: z.string().uuid(),
  source: z.enum(['manual', 'agent', 'import']),
  idempotency_key: z.string().uuid().optional(), // required for source='agent'
  dry_run: z.boolean().default(false),
  lines: z.array(JournalLineInputSchema).min(2),
}).refine(
  // Debit total equals credit total — computed with decimal.js, not JS math.
  (entry) => {
    const debits = entry.lines.reduce(
      (acc, l) => acc.plus(new Decimal(l.debit_amount)),
      new Decimal(0)
    );
    const credits = entry.lines.reduce(
      (acc, l) => acc.plus(new Decimal(l.credit_amount)),
      new Decimal(0)
    );
    return debits.eq(credits);
  },
  { message: 'Sum of debits must equal sum of credits (exact decimal, no tolerance).' }
).refine(
  (entry) => entry.source !== 'agent' || entry.idempotency_key !== undefined,
  { message: 'idempotency_key is required when source is "agent".' }
);

export type PostJournalEntryInput = z.infer<typeof PostJournalEntryInputSchema>;
```

The application-layer `.refine()` for debit=credit gives an early,
readable error message using exact decimal comparison — **no tolerance
window**. The previous v0.5.2 schema used `Math.abs(debits - credits) <
0.005` as a float-tolerance; v0.5.3 removes this because with string
money and decimal.js there is no float drift to tolerate. If debits and
credits are not exactly equal, the entry is wrong. The deferred database
constraint (Section 1d) is the hard guarantee — it catches anything
that bypasses the application layer.

### 3b. Zod Output Schema

```typescript
export const ProposedEntryCardSchema = z.object({
  org_id: z.string().uuid(),
  org_name: z.string(),
  transaction_type: z.enum(['journal_entry', 'bill', 'payment', 'intercompany']),
  vendor_name: z.string().optional(),
  matched_rule_label: z.string().optional(),
  lines: z.array(z.object({
    account_code: z.string(),
    account_name: z.string(),
    debit: z.number(),
    credit: z.number(),
    currency: z.string().length(3),
  })),
  intercompany_flag: z.boolean(),
  reciprocal_entry_preview: z.unknown().optional(), // typed properly in Phase 2
  agent_reasoning: z.string(),
  confidence: z.enum(['high', 'medium', 'low', 'novel']),
  routing_path: z.string().optional(), // Category A reservation, display-only in Phase 1
  idempotency_key: z.string().uuid(),
  dry_run_entry_id: z.string().uuid(),
});

export const PostJournalEntryOutputSchema = z.object({
  journal_entry_id: z.string().uuid(),
  status: z.enum(['draft', 'posted', 'proposed']),
  proposed_entry_card: ProposedEntryCardSchema.optional(),
  canvas_directive: z.discriminatedUnion('type', [
    z.object({ type: z.literal('journal_entry'), entryId: z.string().uuid(), mode: z.enum(['view', 'edit']) }),
    z.object({ type: z.literal('proposed_entry_card'), card: ProposedEntryCardSchema }),
  ]),
});

export type PostJournalEntryOutput = z.infer<typeof PostJournalEntryOutputSchema>;
```

### 3c. The Same Schema, Three Consumers

The same Zod schema is imported by:

**1. Next.js API route** (`src/app/api/accounting/journals/route.ts`):

```typescript
import { PostJournalEntryInputSchema } from '@/shared/schemas/accounting/journalEntry.schema';
import { withInvariants } from '@/services/middleware/withInvariants';
import { journalEntryService } from '@/services/accounting/journalEntryService';

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = PostJournalEntryInputSchema.parse(body); // throws on invalid
  const ctx = await buildServiceContext(request);
  const result = await withInvariants(journalEntryService.post)(parsed, ctx);
  return Response.json(result);
}
```

**2. Double Entry Agent tool** (`src/agent/tools/postJournalEntry.ts`):

```typescript
import { PostJournalEntryInputSchema } from '@/shared/schemas/accounting/journalEntry.schema';
import { zodToJsonSchema } from 'zod-to-json-schema';

// The Claude tool definition uses the same Zod schema, converted to JSON Schema.
export const postJournalEntryTool = {
  name: 'postJournalEntry',
  description: 'Create a journal entry. Always use dry_run=true on the first call.',
  input_schema: zodToJsonSchema(PostJournalEntryInputSchema),
};
```

**3. Manual journal entry form** (`src/components/canvas/JournalEntryForm.tsx`):

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PostJournalEntryInputSchema, type PostJournalEntryInput } from '@/shared/schemas/accounting/journalEntry.schema';

export function JournalEntryForm({ orgId }: { orgId: string }) {
  const form = useForm<PostJournalEntryInput>({
    resolver: zodResolver(PostJournalEntryInputSchema),
    defaultValues: { org_id: orgId, source: 'manual', dry_run: false, lines: [] },
  });
  // ... form fields ...
}
```

One schema, three consumers, one source of truth. If the schema changes, all
three break in the same way at compile time, and the change is visible in
exactly one PR.

### 3d. TypeScript Service Function Sketch

`src/services/accounting/journalEntryService.ts`:

```typescript
import { PostJournalEntryInputSchema, type PostJournalEntryInput } from '@/shared/schemas/accounting/journalEntry.schema';
import { type ServiceContext } from '@/services/middleware/serviceContext';
import { canUserPerformAction } from '@/services/auth/canUserPerformAction';
import { periodService } from '@/services/accounting/periodService';
import { recordMutation } from '@/services/audit/recordMutation';
import { adminClient } from '@/db/adminClient';
import { logger } from '@/shared/logger/pino';

export const journalEntryService = {
  async post(
    input: PostJournalEntryInput,
    ctx: ServiceContext
  ) {
    // 0. Re-validate at the service boundary (defense-in-depth — the API
    //    route already validated, but the agent path may have skipped it).
    const validated = PostJournalEntryInputSchema.parse(input);

    // 1. Idempotency check (only for agent source) — BEFORE any work
    if (validated.source === 'agent' && validated.idempotency_key) {
      const existing = await adminClient
        .from('ai_actions')
        .select('*, journal_entries(*)')
        .eq('org_id', validated.org_id)
        .eq('idempotency_key', validated.idempotency_key)
        .maybeSingle();

      if (existing.data) {
        logger.info({ trace_id: ctx.trace_id, idempotency_key: validated.idempotency_key },
          'Idempotency hit — returning existing result');
        return buildOutputFromExistingAction(existing.data);
      }
    }

    // 2. Authorization
    const authResult = await canUserPerformAction(ctx, 'journal_entry.post', validated.org_id);
    if (!authResult.permitted) {
      throw new ServiceError('PERMISSION_DENIED', authResult.reason);
    }

    // 3. Period check (was Period Agent in v0.4.0; now a direct service call)
    const periodCheck = await periodService.isOpen(validated.org_id, validated.entry_date);
    if (!periodCheck.is_open) {
      throw new ServiceError('PERIOD_LOCKED',
        `${periodCheck.period_name} is locked. Post to a different period or ask a controller to unlock.`);
    }

    // 4. Application-layer debit=credit check (Zod refine already ran; this is a guard against bypass)
    const debits = validated.lines.reduce((s, l) => s + l.debit_amount, 0);
    const credits = validated.lines.reduce((s, l) => s + l.credit_amount, 0);
    if (Math.abs(debits - credits) >= 0.005) {
      throw new ServiceError('UNBALANCED', `Debits=${debits}, Credits=${credits}`);
    }

    // 5. DRY RUN: build the proposed card without persisting
    if (validated.dry_run) {
      const card = await buildProposedEntryCard(validated, ctx);
      return {
        journal_entry_id: card.dry_run_entry_id,
        status: 'proposed' as const,
        proposed_entry_card: card,
        canvas_directive: { type: 'proposed_entry_card' as const, card },
      };
    }

    // 6. CONFIRMED: persist inside a single transaction
    const result = await adminClient.rpc('post_journal_entry_tx', {
      p_input: validated,
      p_trace_id: ctx.trace_id,
      p_user_id: ctx.caller.user_id,
    });
    // The RPC executes BEGIN; INSERT journal_entries; INSERT journal_lines;
    // INSERT audit_log (Simplification 1); INSERT ai_actions if source=agent;
    // COMMIT (deferred constraint runs here — ROLLBACK on imbalance).

    if (result.error) {
      logger.error({ trace_id: ctx.trace_id, error: result.error }, 'Journal entry post failed');
      throw new ServiceError('POST_FAILED', result.error.message);
    }

    logger.info({
      trace_id: ctx.trace_id,
      journal_entry_id: result.data.journal_entry_id,
      org_id: validated.org_id,
    }, 'Journal entry posted');

    return {
      journal_entry_id: result.data.journal_entry_id,
      status: 'posted' as const,
      canvas_directive: {
        type: 'journal_entry' as const,
        entryId: result.data.journal_entry_id,
        mode: 'view' as const,
      },
    };
  },
};
```

This is the template every other service function follows. Validate at the
boundary; check idempotency first; check authorization; check business rules;
either dry-run or persist inside a single transaction; log with `trace_id`;
return a typed result with a canvas directive.

The `withInvariants()` middleware (Invariant 4) wraps this function from the
outside, performing the universal pre-flight checks (ServiceContext shape,
trace_id present, caller verified) before the function body runs.

---

## Section 4 — The Bridge UI Architecture

### 4a. The Split-Screen Layout

Three zones, plus the Mainframe rail. The split-screen shell is built fully
in Phase 1.1; canvas views are added per phase.

1. **Left Panel — Agent Chat** (~380px fixed, collapsible via keyboard
   shortcut). Conversation history; message input with file drop zone (drop
   zone is inactive in Phase 1, the upload pipeline is Phase 2);
   persona-specific suggested prompts on empty state. Agent messages may
   contain inline ProposedEntryCards with Approve / Reject buttons.

2. **Right Panel — Contextual Canvas** (fills remaining width). A blank
   stage that renders whatever the agent last directed it to show. Has its
   own independent navigation history (back/forward arrows in the canvas
   header) so the user can drill down through multiple levels and return
   without disrupting the conversation.

3. **Top Nav.** Org switcher (role-aware — AP specialist sees assigned orgs
   only, CFO sees all + consolidated), global search stub, notification bell
   (count of pending AI actions), user menu.

**The Mainframe** — A collapsed icon rail on the far left, narrower than the
chat panel, always visible. Direct-launch icons for the most common canvas
views: Chart of Accounts, Journal Entry, AP Queue (Phase 2+), P&L Report.
Clicking any icon bypasses the agent entirely and loads that canvas view
directly. **This is the fallback navigation when the user knows where they
want to go, AND the graceful degradation path when the Claude API is
unavailable.** Label it "Mainframe" in the UI — lean into the Star Trek
metaphor.

**Mainframe constraint (called out everywhere it matters):** No Phase 1
canvas component is allowed to require the agent to function. Every Phase 1
canvas view (Chart of Accounts, Journal Entry form, Journal list, basic P&L,
AI Action Review) must work fully when accessed directly via the Mainframe.
The agent is a composer that can also load these views; the views themselves
are standalone.

### 4b. The `canvas_directive` Contract (Agent-to-UI Protocol)

The most important interface in The Bridge. Defined as a TypeScript
discriminated union in `src/agent/canvas/directives.ts`. Every agent tool
response (and every API route response that affects what the canvas should
show) includes a `canvas_directive`. The frontend reads the directive and
renders the appropriate canvas component. **The agent never produces HTML.
It produces structured data. The UI renders it.**

```typescript
// src/agent/canvas/directives.ts
// (Plain English: a discriminated union is a TypeScript pattern where a
// shared "type" field tells you which shape the rest of the object has.
// The compiler enforces that you handle every possible type.)

import type { ProposedEntryCard } from '@/shared/types/proposedEntryCard';
import type { PostJournalEntryInput } from '@/shared/schemas/accounting/journalEntry.schema';

export type CanvasDirective =
  // Phase 1.1 — built fully:
  | { type: 'chart_of_accounts'; orgId: string; }
  | { type: 'journal_entry'; entryId: string; mode: 'view' | 'edit'; }
  | { type: 'journal_entry_form'; orgId: string; prefill?: Partial<PostJournalEntryInput>; }
  | { type: 'journal_entry_list'; orgId: string; }
  | { type: 'proposed_entry_card'; card: ProposedEntryCard; }
  | { type: 'ai_action_review_queue'; orgId: string; }
  | { type: 'report_pl'; orgId: string; from: string; to: string; }
  | { type: 'none'; }  // agent responded with text only, no canvas update

  // Phase 2+ stubs — directive type defined now, canvas component is a
  // "Coming Soon" placeholder until the phase that builds it:
  | { type: 'ap_queue'; orgId: string; }
  | { type: 'vendor_detail'; vendorId: string; orgId: string; }
  | { type: 'bank_reconciliation'; accountId: string; }
  | { type: 'ar_aging'; orgId: string; }
  | { type: 'consolidated_dashboard'; }
  ;
```

The canvas renderer switches on `directive.type` and renders the matching
component or a "Coming Soon" placeholder for Phase 2+ types. New tools added
in later phases must add their directive type here first.

**Bidirectional state — stub in Phase 1, implement in Phase 2.** When the
user interacts with the canvas (clicks a P&L line, selects a vendor), that
action should eventually be communicated back to the agent as context. In
Phase 1, this is a commented interface in `AgentSession`. In Phase 2, it is
implemented so the agent knows what the user is looking at without them
typing "the thing I just clicked."

### 4c. The Proposed Entry Card — Data Shape

Every AI-initiated mutation surfaces this card before anything is written.
The full Zod schema is defined in Section 3b. The TypeScript type is
inferred from it.

The UI renders this as a card with: **Approve** button (primary), **Reject**
button with optional free-text reason, and an **"Edit before approving"**
link that fires a `journal_entry_form` canvas directive with the data
pre-filled.

**Important Phase 1 constraint:** `confidence` and `routing_path` are
**display only** in Phase 1. The card shows them, but they do not influence
which queue the entry goes to or who must approve it. Routing logic (where
medium-confidence entries require controller approval and novel patterns
escalate to CFO) is Phase 2. The fields exist on the type now (Category A
reservation) so the Phase 2 wiring is mechanical.

**Reasoning text is a structured template, not free prose.** The UI builds
the localized "why I made this choice" string from a template ID and
parameters returned by the agent — never from raw English from Claude. This
is what makes i18n possible without retranslating every agent response.

### 4d. Canvas Phasing Table

| Canvas Feature | Phase 1.1 | Phase 1.2 | Phase 2 | Phase 3 |
|---|---|---|---|---|
| Split-screen layout (chat + canvas + Mainframe) | Build | | | |
| Canvas navigation history (back/forward) | Build | | | |
| Chart of Accounts canvas view | Build | | | |
| Manual Journal Entry form in canvas | Build | | | |
| Journal Entry list canvas view | Build | | | |
| Basic P&L canvas view (read-only) | Build | | | |
| AI Action Review queue (controller) | Build (empty in 1.1, populated in 1.2) | | | |
| Suggested prompts on empty state | | Build (static, persona-aware) | | |
| ProposedEntryCard component | | Build | | |
| Agent transparency ("What I did") | | Build (collapsed disclosure) | | |
| Canvas tabs (multiple views open) | Stub interface only | | Build | |
| Bidirectional canvas-agent state | Stub interface only | | Build | |
| Contextual action bar on hover | | | Build | |
| AP Queue canvas view | | | Build | |
| Bank reconciliation canvas view | Stub (placeholder) | | Build | |
| Consolidated dashboard canvas view | Stub (placeholder) | | | Build |
| Mobile responsive layout | Defer | | | Build |
| Multi-pane comparison view | Defer | | | Build |

"Stub interface only" means: the TypeScript interface and the canvas
directive type exist; the renderer shows "Coming Soon" for that type. Phase 2
fills in the implementation. Phase 2 is an extension, not a rewrite.

### 4e. Suggested Prompts (Empty State)

Phase 1.2 implements a basic version with static arrays per role.
Phase 2 makes it data-driven (context-aware: if today is the 1st of the
month, a controller sees close-related suggestions).

- **AP Specialist:** *(Phase 2+)* "Process today's incoming bills" / "Show me
  the AP queue" / "Find bills missing a GL code"
- **Controller:** "Review pending AI actions" / "Show me last month's P&L" /
  "Make a journal entry"
- **Executive:** "Show consolidated cash position" / "What's my runway if
  revenue drops 20%?" *(Most CFO prompts return placeholder responses in
  Phase 1; the suggested prompts exist for UI shape only.)*

### 4f. Traditional UI Screens Required in Phase 1

Both the agent path and the manual path are first-class. Every canvas view
must also be reachable via the Mainframe — not only by asking the agent.

| Route | Phase | Notes |
|---|---|---|
| `/[locale]/sign-in` | 1.1 | Supabase Auth |
| `/[locale]/[orgId]/accounting/chart-of-accounts` | 1.1 | CoA list and detail |
| `/[locale]/[orgId]/accounting/journals` | 1.1 | Journal entry list |
| `/[locale]/[orgId]/accounting/journals/new` | 1.1 | Manual journal entry form |
| `/[locale]/[orgId]/accounting/journals/[entryId]` | 1.1 | Journal entry detail |
| `/[locale]/[orgId]/agent/actions` | 1.2 | AI Action Review queue |
| `/[locale]/[orgId]/reports/pl` | 1.1 | Basic P&L (read-only) |
| `/[locale]/consolidated/dashboard` | Stub in 1.1 | Role-gated |
| `/admin/orgs` | 1.1 | Org creation with industry CoA template selection |

---

## Section 5 — Agent Architecture (v0.5.0 Phase 1 form)

This section is the most changed from v0.4.0. Read the "Phase 1
Simplifications" section first if you have not already — Simplification 3
explains why Layer 1 and Layer 2 agents collapse to service functions in
Phase 1, and how Phase 2 reintroduces the agent layer informed by what AP
actually needs.

### 5a. The One Agent in Phase 1: The Double Entry Agent

In Phase 1.2, the entire agent surface area is the **Double Entry Agent**.
It is not a class. It is not a folder. It is a Claude tool definition
(`src/agent/tools/postJournalEntry.ts`) wired into the orchestrator
(`src/agent/orchestrator/index.ts`), pointing at the
`journalEntryService.post()` service function.

Two additional read-only tools support the conversation:
- `listChartOfAccounts` — wraps `chartOfAccountsService.list()`
- `checkPeriod` — wraps `periodService.isOpen()`

That is the entire Phase 1 agent toolbox. Three tools. One mutating, two
reading.

**v0.5.3 — inactive Chart of Accounts filtering rule (A10):** The
`listChartOfAccounts` tool filters `chart_of_accounts` where
`is_active = true` by default. The agent cannot post to an inactive
account because it cannot see one. If a user explicitly asks about a
historical account ("did we ever have an account called X?"), the tool
accepts an optional `include_inactive: boolean` parameter which
returns inactive accounts *flagged as inactive in the response* — but
`postJournalEntry` validates at the service layer that the target
`account_id` has `is_active = true` and rejects inactive targets with a
clarification error regardless of what the listing tool returned. This
is belt and suspenders: the tool's default protects the agent from
proposing inactive accounts, and the service rejects them if the agent
somehow produces one anyway.

**What "Double Entry Agent" means in Phase 1.2:**
- A Claude tool definition with the JSON schema generated from the
  `PostJournalEntryInputSchema` Zod schema.
- An orchestrator that knows when to call it (when the user asks to make
  or review a journal entry).
- A handler that validates the tool input, calls
  `journalEntryService.post()` in dry-run mode, and returns the result with
  a `canvas_directive`.
- A confirmation handler that calls `journalEntryService.post()` again with
  `dry_run: false` and the same idempotency key when the user clicks Approve.

**What it is not in Phase 1:**
- Not a separate process
- Not a separate package
- Not its own folder hierarchy
- Not a class with methods
- Not orchestrated by a higher-level workflow agent

**Phase 2 evolution.** When the AP Agent is built, the comparison between AP
and Double Entry will reveal the actually-shared infrastructure — system
prompt loading, tool definition format, dry-run handling, idempotency,
trace propagation, error envelopes. That shared infrastructure is extracted
to `packages/agent/` and the Layer 1/2/3 folder structure is reintroduced
informed by reality, not by guesswork.

### 5b. The Orchestrator (`src/agent/orchestrator/`)

The main agent loop. Receives a user message, builds a Claude API request,
handles tool calls, returns a response with a canvas directive.

```typescript
// src/agent/orchestrator/index.ts (sketch)
export async function handleUserMessage(input: {
  user_id: string;
  org_id: string;
  locale: 'en' | 'fr-CA' | 'zh-Hant';
  message: string;
  session_id?: string;
}) {
  const trace_id = crypto.randomUUID();
  const session = await loadOrCreateSession(input);
  const orgContext = await orgContextManager.load(input.org_id);
  const persona = await getPersonaForUser(input.user_id, input.org_id);
  const systemPrompt = buildSystemPrompt(persona, orgContext, input.locale);

  let response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    system: systemPrompt,
    tools: [postJournalEntryTool, listChartOfAccountsTool, checkPeriodTool],
    messages: [...session.history, { role: 'user', content: input.message }],
  });

  // Tool-call validation retry loop, max 2 retries
  let retries = 0;
  while (response.stop_reason === 'tool_use' && retries < 2) {
    const toolUse = response.content.find(c => c.type === 'tool_use');
    try {
      const validated = validateToolInput(toolUse);
      const toolResult = await executeTool(validated, { trace_id, ...ctx });
      response = await anthropic.messages.create({ /* with tool_result */ });
      break;
    } catch (validationError) {
      retries++;
      response = await anthropic.messages.create({
        /* feed validation error back to Claude as a clarification */
      });
    }
  }

  await persistSession(session, response);
  return extractCanvasDirective(response);
}
```

**System prompts (one per persona).** Stored as TypeScript template literals
in `src/agent/orchestrator/systemPrompts/`. Each prompt declares: who the
user is, what org they are in, what their role permits, what tools are
available, and the cardinal rule — *never invent financial data, always
retrieve it through tools*.

**v0.5.3 — trace_id propagation across the Anthropic client boundary (A4).**
Anthropic's API does not carry application-level trace IDs — the SDK
has no `trace_id` header. Without explicit wrapping, any Claude API
failure (500, timeout, rate limit) produces a pino log line with no
`trace_id`, making it impossible to correlate the failure with the
user message that caused it. The fix: every `anthropic.messages.create`
call runs inside a pino child logger bound to the current `trace_id`,
and the call itself is wrapped in a helper that logs start/end/error
on that child logger. Use this shape inside the orchestrator:

```typescript
// src/agent/orchestrator/anthropicClient.ts
import Anthropic from '@anthropic-ai/sdk';
import type { Logger } from 'pino';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function callClaude(
  params: Anthropic.MessageCreateParams,
  traceLogger: Logger,
): Promise<Anthropic.Message> {
  const start = Date.now();
  traceLogger.info({ event: 'anthropic.request.start', model: params.model });
  try {
    const response = await client.messages.create(params);
    traceLogger.info({
      event: 'anthropic.request.success',
      duration_ms: Date.now() - start,
      usage: response.usage,
      stop_reason: response.stop_reason,
    });
    return response;
  } catch (err) {
    traceLogger.error({
      event: 'anthropic.request.error',
      duration_ms: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
```

And inside `handleUserMessage`, the child logger is created before
any Claude call:

```typescript
const trace_id = crypto.randomUUID();
const traceLogger = baseLogger.child({ trace_id, user_id: input.user_id, org_id: input.org_id });
// ... build request ...
const response = await callClaude(params, traceLogger);
```

Every log line from a Claude round trip now carries `trace_id`, so
filtering pino by `trace_id=X` returns the user message, orchestrator
decision, every Claude API call, every tool invocation, every service
call, and the audit row — in order. Without this wrapper, the Claude
side of the story is blind.

### 5c. Phase 1 Anti-Hallucination Rules (non-negotiable)

These are explicit constraints in the system prompt and enforced at the
service boundary by Zod validation.

- Financial amounts always come from tool outputs, never from
  model-generated text.
- Every mutating tool has a `dry_run: boolean` parameter. The confirmation
  flow always calls dry-run first.
- No agent may reference an account code, vendor name, or amount it has not
  first retrieved from the database in the current session.
- Tool inputs are structured Zod-validated objects only — no free-text
  journal entries.
- If the agent cannot produce a valid typed value for a required field, it
  must ask the user a clarifying question rather than guess.

### 5d. Agent Autonomy Model (Hybrid, Trust-Escalating)

| Tier | Default | Promotion |
|---|---|---|
| **Always Confirm** | All new orgs, all mutations | Default — no action needed |
| **Notify & Auto-Post** | Off by default | Phase 2+: controller explicitly enables per rule type |
| **Silent Auto** | Never available in Phase 1 | Phase 4+ consideration |

Every Phase 1 mutating action is Tier 1. The `autonomy_tier` enum exists on
`vendor_rules` from day one (Category A reservation) so Phase 2 promotion
flows can be wired without a migration.

### 5e. Institutional Memory — Phase 1 form

`OrgContextManager` (`src/agent/memory/orgContextManager.ts`) loads per-org
context at session start:

```typescript
{
  orgId,
  orgName,
  industry,
  fiscalCalendar: FiscalPeriod[],
  // Phase 1: empty arrays — schema present, data not yet collected
  vendors: VendorRule[],          // empty until Phase 2 begins populating vendor_rules
  intercompanyMap: IntercompanyRelationship[],  // empty until Phase 2
  approvalRules: ApprovalRule[],  // empty until Phase 2
}
```

All memory is stored in the database — never only in the model's context
window, which is ephemeral. Phase 1 reads `fiscal_periods` and the
`organizations` row. Phase 2 begins populating and reading `vendor_rules`
and `intercompany_relationships`.

### 5f. AgentSession Persistence

`AgentSession` lives in Postgres in the `agent_sessions` table. Keyed by
`session_id`. Cleaned up after 30 days of inactivity. Stored in the same
database as everything else — no Redis, no in-memory cache.

**Org switch = new session.** When the user switches orgs in the org
switcher, the current `AgentSession` is closed and a new one is created.
This prevents cross-entity contamination of institutional memory and
conversation context. The user explicitly sees a "switching to [Org B] —
new conversation" indicator in the chat panel.

### 5g. Layer 3 Workflow Agents — Not Stubbed in Phase 1

v0.4.0 specified that Layer 3 workflow agent folders (AP, AR, Reporting,
Reconciliation) should exist as stubs in Phase 1. **v0.5.0 reverses this.**
No stub files exist. No empty folders. No `// TODO Phase 2` comments
masquerading as design.

Reason: pre-built stubs become cargo-cult artifacts that constrain Phase 2
without informing it. Phase 2 will create the AP Agent in the right
location once the shape of an agent is known from Double Entry's
implementation experience.

---

## Section 6 — Intercompany Transaction Handling (Phase 2 — Foundation in Phase 1)

The full intercompany workflow is Phase 2. The Phase 1 obligations are
**schema correctness only** so that Phase 2 plugs in without a migration.

### Phase 1 Obligations
- `intercompany_relationships` table created (empty, with comment
  `-- Populated in Phase 2 by AP Agent. Do not write to manually.`)
- `intercompany_batch_id` column on `journal_entries` (nullable)
- `is_intercompany_capable` flag on `chart_of_accounts`
- `is_intercompany_entity_id` FK on `vendors` (nullable, set Phase 2)

### Phase 2 Workflow (specified now so the schema is correct)
1. AP specialist receives a bill from Vendor X.
2. AP Agent checks `intercompany_relationships` — Vendor X is actually
   Entity B (one of the 50 orgs).
3. Agent flags the bill as intercompany: "This bill is from [Entity B].
   Should I create a reciprocal revenue entry in Entity B's ledger at the
   same time?"
4. Proposed Entry Card shows both entries side by side: the bill in Entity A
   AND the reciprocal revenue entry in Entity B.
5. User approves both in a single confirmation.
6. Service layer creates both journal entries in a single Postgres
   transaction with a shared `intercompany_batch_id`.
7. Audit log records both entries linked to the same `ai_action`.

### Phase 3 Consolidated Reporting
The consolidated dashboard shows intercompany eliminations as a separate
"Eliminations" column in the consolidated P&L view. The query joins
`journal_entries` on `intercompany_batch_id` to identify pairs and subtract
them from the consolidation roll-up.

---

## Section 7 — Phase Plan (v0.5.0 — rewritten)

This section replaces the v0.4.0 Phase 0/1/2/3/4 structure entirely.

**Governing principles:**
- Build foundation before features. Phase 1.1 must work before Phase 1.2 begins.
- Use the system before scoping the next phase. Phase 1.3 is a learning phase.
- Measure work, not calendar time. Estimates are optimistic by 2x; that is data, not failure.
- Every Phase 1 simplification has a documented Phase 2 correction.

### Phase 1.1 — Foundation (formerly Phase 0 + Phase 1 Layer 1)

**Goal:** A correctly structured system with multi-org, multi-user roles,
real CoA, real events table, real tax codes. **No agent yet.** Just the data
model, auth, UI shell, and the manual journal entry path proven to work.

**What is built:**
- Single Next.js app scaffolded
- Supabase project initialized (local + remote dev)
- Full Phase 1.1 SQL migration: all core tables, all indexes, all triggers
  (deferred constraint for debit=credit, period lock, events append-only),
  all RLS policies, seed data for the two CoA templates the founder will
  actually use first
- All Category A items from the A/B/C section
- `pino` structured logger with redact list, configured at boot
- Boot-time assertion on critical env vars
- Three integration tests (Category A floor):
  1. Unbalanced journal entry rejected by deferred constraint at COMMIT
  2. Insert into locked period rejected by trigger
  3. Cross-org RLS isolation: User A's session cannot SELECT Org B's data
- Seed script: 2 orgs (holding company + real estate) + 3 users (one per role)
- Service functions: `canUserPerformAction`, `journalEntryService.post`,
  `chartOfAccountsService`, `periodService.isOpen`, `recordMutation`,
  `withInvariants` middleware, `ServiceContext` type with required
  `trace_id`, `org_id`, `caller`
- Manual journal entry form (full canvas component)
- Chart of Accounts canvas view
- Journal entry list canvas view
- Basic P&L canvas view (read-only)
- Org creation flow with industry CoA template selection
- Sign-in / sign-out (Supabase Auth)
- The Bridge split-screen shell with Mainframe rail (chat panel is empty —
  no agent yet — but rendered)
- i18n URL structure `/[locale]/[orgId]/...` from day one with English
  strings; fr-CA and zh-Hant translation files have placeholder structure
- `docs/decisions/README.md` with ADR template (no pre-populated ADRs)
- `docs/troubleshooting/rls.md` with the "suspect RLS first" guidance
- Postman collection v1.1: health check, auth, org CRUD, CoA CRUD, journal
  entry CRUD, period check

**Phase 1.1 Exit Criteria (all must pass before Phase 1.2 begins):**
1. `pnpm dev` starts cleanly with zero TypeScript errors.
2. `pnpm build` succeeds.
3. `pnpm test:integration` passes all three Category A tests.
4. Health check returns 200.
5. Sign-in screen renders (English translations populated).
6. **Create the two real orgs** (holding company + real estate) via the
   admin flow, each with the correct industry CoA template loaded.
7. **Create the three real users** with the three different roles
   (executive, controller, ap_specialist).
8. Org switcher works and is role-aware (AP specialist sees only assigned
   orgs).
9. **Post 5 manual journal entries** through the manual form across both
   orgs. The deferred constraint catches an intentional unbalanced entry.
   The period lock trigger catches an intentional locked-period post.
10. The audit_log row for each entry is present, with `trace_id` populated.
11. Every log line in `pino` includes `trace_id`. The redact list is
    configured and verified by intentionally logging a string containing the
    `SUPABASE_SERVICE_ROLE_KEY` and confirming it appears redacted.
12. Postman v1.1 collection passes all requests.
13. **Usage signal (not just build signal):** the founder has personally
    posted at least 5 manual journal entries across the two real orgs, and
    the friction journal (`docs/phase1.1-friction.md`) has at least 3 real
    entries. Zero entries means the founder ran the build but did not use
    the system — not done.
14. **Time-to-first-post:** measure clock time from "open the manual entry
    form" to "entry posted and visible in the list" on one of the real
    entries. Record it in the friction journal. Target: under 2 minutes
    once familiar; anything over 5 minutes is a UX flag to capture, not a
    failure to block on.
15. **Hosting region pinned (v0.5.3, A7).** Both Supabase and Vercel
    deploy to Canadian regions per Section 9a.0. Verify: the Supabase
    project's region in the dashboard is `ca-central-1`; `vercel.json`
    contains `"regions": ["yul1"]` (or an equivalent Canadian region);
    the Vercel dashboard → Project → Settings → Functions shows the
    region pinned for both Preview and Production. A US-region
    deployment is a Phase 1.1 failure regardless of the other criteria.

**Phase 1.1 explicitly does NOT include:** any agent code, the
ProposedEntryCard component, the AI Action Review queue (the route exists
and renders empty), suggested prompts, the Claude API integration, AP
workflow, OCR, bank feeds, mobile layout, anything in fr-CA or zh-Hant
beyond placeholder file structure.

### Phase 1.2 — The Agent

**Goal:** The Double Entry Agent works end-to-end. Manual journal entries
can also be created via natural language conversation in The Bridge.

**What is built (only what is needed beyond 1.1):**
- `src/contracts/doubleEntry.contract.ts` — the one real contract file with
  `_contract_version`, `trace_id`, `idempotency_key` as required fields
- `src/agent/orchestrator/index.ts` with the message-handling loop
- `src/agent/orchestrator/systemPrompts/` — three persona prompts
- `src/agent/tools/postJournalEntry.ts` — the ONE mutating tool, wraps
  `journalEntryService.post`
- `src/agent/tools/listChartOfAccounts.ts` — read-only support tool
- `src/agent/tools/checkPeriod.ts` — read-only support tool
- `src/agent/session/agentSession.ts` — Postgres-backed session persistence
- `src/agent/memory/orgContextManager.ts` — load fiscal calendar, org row;
  vendor/intercompany arrays empty
- `src/agent/canvas/directives.ts` — full discriminated union (Phase 2+
  types render "Coming Soon")
- `src/components/canvas/ProposedEntryCard.tsx` — full component
- `/api/agent/message` and `/api/agent/confirm` Next.js API routes
- AgentChatPanel with streaming response rendering
- Suggested prompts on empty state (static, persona-aware)
- Agent transparency disclosure ("What I did and why" — collapsed by default)
- AI Action Review queue populated (controller role can see and filter
  pending/confirmed/rejected actions)
- Idempotency check verified end-to-end (submit the same approval twice via
  Postman → second call returns the existing result, no double-post)
- Tool-call validation retry policy (max 2 retries with validation error
  fed back to Claude as a clarification)
- Org-switch behavior: switching orgs closes the current AgentSession and
  starts a new one
- Postman collection v1.2: agent message endpoints, idempotency check tests

**Phase 1.2 Exit Criteria:**
1. Phase 1.1 exit criteria all still pass (regression check).
2. **Post 20 real journal entries through the agent** across the two real
   orgs. The agent proposes correct double-entry. The ledger is correct.
3. Every entry has a `trace_id` visible in pino logs that correlates the
   user message → orchestrator → service → audit row.
4. **Idempotency works:** submit the same approval twice via the API; the
   second call returns the existing result without writing a second entry.
5. **Tool-call retry works:** send a message that prompts Claude to call
   `postJournalEntry` with a missing field; the orchestrator retries up to 2
   times with the validation error fed back; the third failure surfaces a
   clarification question to the user.
6. **Org switch resets the session:** start a conversation in Org A, switch
   to Org B, verify the chat history and OrgContext are fresh.
7. **Mainframe degradation works:** disable the `ANTHROPIC_API_KEY` (or
   simulate API failure); the user can still create journal entries via the
   Mainframe → Manual Entry path with no errors.
8. The 5 Phase 1.1 manual entries plus the 20 Phase 1.2 agent entries all
   appear correctly in the AI Action Review queue (manual entries with
   `source='manual'`, agent entries with `source='agent'`).
9. **Usage signal:** the founder has used the agent path for at least 20
   real entries (not fabricated test data) and logged at least 10 friction
   journal entries classified into the three buckets (wanted-to/was-clunky/
   agent-got-wrong).
10. **Time-to-confirmed-entry via agent:** measure clock time from "user
    message typed" to "journal entry posted via ProposedEntryCard approval"
    on at least 5 of the 20 entries. Target: under 30 seconds per entry
    once the agent has warmed up on the org context. Anything over 2
    minutes is a friction-journal entry, not a blocker.
11. **Cost signal:** record the Anthropic API cost-per-entry for all 20
    entries (from the Anthropic dashboard or billing export). This is the
    input to the Phase 2 cost ceiling decision (Question 12). No pass/fail
    — just collect the number.
12. **Dry-run → confirm round-trip verified.** Bible §5c mandates that
    every mutating tool has a `dry_run: boolean` parameter and that the
    confirmation flow always calls dry-run first. Verify on at least 3 of
    the 20 entries: the first tool invocation carries `dry_run: true` and
    does not write to `journal_entries`; the user's Approve click triggers
    a second tool invocation with `dry_run: false` and the same
    `idempotency_key`; only the second call produces a row in
    `journal_entries`. Inspect the pino logs for the paired calls and
    the `audit_log` row count to confirm no phantom writes.
13. **Anti-hallucination enforcement exercised.** Construct one test
    message that tries to coerce the agent into inventing financial data
    ("post an entry for $2,500 to whatever account you think makes
    sense"). Verify: the agent does not post the entry, it either asks a
    clarifying question naming the specific missing field(s) or it
    returns an error message explaining that account codes must be
    retrieved from the database. Log the exchange in the friction journal
    verbatim — if the agent complies with the hallucination prompt, that
    is a hard failure and Phase 1.2 is not done.
14. **ProposedEntryCard renders every required field on a real entry.**
    Pick one of the 20 entries that exercises the full card shape
    (multi-line, at least one tax code, intercompany flag populated as
    false). Verify the rendered card displays: org name, vendor (or
    counterparty), entry date, description, every debit line, every
    credit line, tax code per line where applicable, intercompany flag,
    confidence chip, plain-English explanation, Approve and Reject
    controls, and the `trace_id` in a developer-visible location
    (tooltip or data attribute). Screenshot the card and commit it under
    `docs/phase1.2-artifacts/proposed-entry-card.png`.
15. **Clarification-question path walked.** Send a message that omits a
    required field the agent cannot infer (e.g., "record the rent
    payment" without specifying which bank account). Verify the agent
    returns a clarification question naming the missing field rather
    than guessing. The retry counter should not increment (this is a
    clarification, not a validation retry).
16. **Mid-conversation API failure produces no orphaned state.**
    Simulate a Claude API failure (kill the API key or point the client
    at an invalid endpoint) mid-conversation, after a ProposedEntryCard
    has been generated but before the user clicks Approve. Verify:
    (a) the in-flight ProposedEntryCard is not silently lost — either
    the user can still click Approve and the confirmation path
    completes via the cached dry-run result, **or** the user gets an
    explicit error explaining the card is stale and must be regenerated;
    (b) no `ai_actions` row is left in a pending-forever state — every
    pending row either reaches `confirmed`, `rejected`, or is explicitly
    marked stale with a timestamp; (c) the chat panel shows the failure
    state from Open Question 11 (banner + Retry); (d) the Mainframe
    remains fully functional throughout. This criterion exists because
    the dangerous failure mode is not "Claude is down when the user
    opens the app" — that is covered by #7 — it is "Claude went down
    between dry-run and confirm." That gap is where the audit trail
    corrupts silently.
17. **Structured-response contract upheld.** Bible §11 requires agent
    response text to be structured data (`{template_id, params}`), not
    English prose, so the UI layer can render localized strings. On at
    least 3 agent responses, inspect the raw response envelope and
    confirm: the user-facing text is rendered from a template lookup,
    not concatenated from model output; every `template_id` exists in
    `messages/en.json`; the `params` object contains no free-form
    English. If Claude returned English prose directly into the chat,
    that is a prompt-engineering failure and Phase 1.2 is not done.
18. **Persona guardrails enforced.** Sign in as the Executive persona
    and attempt to post a journal entry through the agent. Verify: the
    agent does not call `postJournalEntry` at all (the tool is not in
    the Executive's tool list per Open Question 16), and the agent
    responds with an explanation that journal entry posting is not
    available in this role plus a suggestion to switch roles or contact
    a controller. Sign in as the Controller and AP Specialist and
    verify both can post. Log the three sessions in the friction journal.

### External validation (optional but strongly recommended before Phase 1.3)

Phase 1.2 is the earliest point at which showing the system to a real
outside user (a family-office CFO, controller, or AP specialist who is not
the founder) produces useful learning. One 30–60 minute session is enough.

**What to do:**
- Pick one real CFO or controller contact.
- Have them attempt one real task (post a journal entry via the agent, or
  review the AI Action Review queue) while the founder watches silently.
- Record: where they hesitated, what they said out loud, what they tried
  that did not work, what they asked about.
- Log findings in `docs/phase1.2-external-review.md`.

**Why this is in the Bible, not an exercise left to the founder:** the
friction journal catches the founder's own blind spots, but the founder
already knows how the system works. An outside user catches the
assumptions the founder cannot see. Skipping this step is how products
become unshippable in Phase 2.

**This is not a gate.** It is a strongly-recommended learning input to
the Phase 1.3 scoping.

### Phase 1.3 — Reality Check (3 weeks, time-boxed — NOT a build phase)

**Goal:** Use the system to close one real month of books for one real org.
Document what is wrong, what is missing, and what is clunky. This is the
input to Phase 2 scoping.

**Concrete deliverables:**
- **Specific goal:** Close the books for one real org for one real calendar
  month using only this system. "Closing the books" means: every transaction
  that occurred in that month is posted as a journal entry; the period is
  locked at the end; the basic P&L for that month is correct and exportable
  as a Postman query.
- **Friction journal:** A running markdown file `docs/phase1.3-friction.md`
  with three categories of entries:
  - **Wanted to X, couldn't.** (Missing feature.)
  - **Did Y, was clunky.** (UX problem.)
  - **The agent got Z wrong.** (Agent quality problem.)
- **Triage at the end:** At week 3, classify every friction journal entry
  into one of three buckets:
  - **Bugs** — go on the Phase 2 bugfix list
  - **Missing features** — feed Phase 2 scope
  - **Architecture errors** — these are the most important. They are the
    Category A/B/C decisions that turned out to be wrong, and they inform
    PLAN.md v0.6.0.
- **The "is this real?" test:** If at the end of three weeks the founder
  cannot honestly answer "yes, my real books for one real entity for one
  real month are now in this system and they are correct," then Phase 1.2
  is not actually done and the gap goes back into Phase 1.2 work, not into
  Phase 2.

**Phase 1.3 Exit Criteria:**
1. One real org's books for one real month are closed in the system.
2. The basic P&L for that month is correct (manually verified against an
   independent source — the founder's existing accounting system or
   spreadsheet).
3. The friction journal exists with at least 10 entries.
4. The triage is complete and Phase 2 scope is informed by it.
5. **Cost-per-close recorded:** total Anthropic API cost for closing the
   one real month, divided by the number of entries posted that month.
   This number is the Phase 2 unit-economics baseline.
6. **Second external-user session (if the optional Phase 1.2 one happened):**
   the same outside user (or a different one) reviews the closed books and
   is asked one question: "Would you trust this to run your own month-end?"
   The answer is recorded verbatim, not interpreted.
7. **Reversal exercised on a real entry.** Phase 1.3 is real money in,
   and a wrong entry is statistically certain to occur. Reversal is the
   only legal correction path (Section 14 — `journal_entries` is never
   UPDATE-able or DELETE-able). Post at least one real reversal through
   the system: either an organic correction of a genuine mistake or a
   deliberately-posted "reversible" entry reversed by design. Verify:
   the original entry is unchanged, the reversal entry has
   `reverses_journal_entry_id` populated, the reversal's debit/credit
   lines mirror the original with sides swapped, both entries pass the
   deferred constraint, and a P&L query that excludes the original sees
   them net to zero. If reversal has never been exercised against real
   data by end of Phase 1.3, the reversal path is untested regardless of
   what the integration tests say.
8. **Period lock exercised after the real close.** After locking the
   real period at end of month, deliberately attempt to post a new
   journal entry dated inside that period. Verify: the attempt is
   rejected by the period lock trigger (Layer 1), the rejection message
   surfaces a clear explanation in the UI, no partial write reaches
   `journal_entries` or `journal_lines`, and the `trace_id` of the
   rejected attempt appears in pino logs. Without this test, the lock is
   theatre — passing the integration test in Phase 1.1 does not prove
   the lock works on a real locked period.
9. **Backup and restore path verified end-to-end.** Open Question 8
   resolves the backup strategy for Phase 1.3 real data. Regardless of
   the chosen strategy (remote Supabase Pro PITR, manual `pg_dump`
   cadence, or other), run the full restore path at least once: take a
   backup, restore it to a scratch database, and re-run the P&L query
   for the closed month. Verify the scratch restore produces a
   byte-identical P&L to the production restore. If the backup was
   never tested with a restore, it does not exist — it is an untested
   belief.
10. **Real GST/HST appeared on at least one real entry.** Canadian tax
    compliance is Category A and the `tax_codes` table is seeded in
    Phase 1.1. Verify that at least one real journal entry in the
    closed month has a `tax_code_id` populated on one or more lines,
    that the tax rate came from a seeded row (not a hardcoded value),
    and that the P&L for the month shows the tax line correctly broken
    out. An untouched tax_codes table at end of Phase 1.3 means the
    Canadian compliance story is unverified.
11. **Trust classification with an up-front commitment rule.** The
    verbatim quote from criterion #6 is classified into exactly one of
    three buckets by the founder (not by me): **go** ("I would run my
    own books on this"), **soft-no** ("I would run my own books on
    this with these specific named fixes"), or **hard-no** ("I would
    not run my own books on this at all"). **The commitment rule is
    adopted now, while this criterion is being written, not at the
    moment of truth:** if the classification is **hard-no**, Phase 2
    does not begin until the named blocker is resolved, and the
    blocker goes at the top of the Phase 2 Execution Brief, not into a
    backlog. If the classification is **soft-no**, the named fixes go
    into Phase 2 scope as required items, not as nice-to-haves. If the
    classification is **go**, proceed to Phase 2 brief writing as
    planned. This rule exists to remove the temptation to push forward
    at the moment when the temptation will be strongest.
12. **One non-English UI path walked end-to-end.** Canadian family
    office, trilingual product. Sign in via `/fr-CA/sign-in` (or the
    zh-Hant equivalent — founder's pick) and complete one real task in
    the non-English locale: view the Chart of Accounts, open a
    posted journal entry, and view the P&L. Log anything that
    appeared in English when it should not have in the friction
    journal. If Phase 1.3 ends without any non-English path being
    walked on real data, the i18n claim is unverified.
13. **Cross-org accidental visibility check.** At the end of Phase 1.3,
    the founder explicitly answers the question: "At any point during
    the month, did I see data from the wrong organization in a place I
    did not expect to?" A yes answer is a Bible-level bug (RLS or
    Two-Laws breach) and it becomes the #1 Phase 2 blocker regardless
    of trust classification. A no answer is recorded. This is a
    one-line declaration, not an investigation — but the declaration is
    required.

### Phase 2 (and beyond)

Scope is **not** specified here. It is determined by the Phase 1.3 triage.
The Phase 2 Execution Brief is written after Phase 1.3 finishes, as Part 2,
Section 2 of PLAN.md. The Bible expectations for Phase 2 are:
- Monorepo split (`src/` → `apps/`+`packages/`); separate Express backend if
  needed by then
- Three-namespace contracts package with TypeScript project references
- pg-boss installed; `events` table begins receiving writes; `audit_log`
  becomes a projection (the Phase 2 corrections for Simplifications 1 and 2
  ship together here)
- Layer 1/2/3 agent folder structure reintroduced in `packages/agent/`
  (Phase 2 correction for Simplification 3) informed by what AP Agent
  actually needs
- AP Agent: email ingestion → OCR (AWS Textract or Google Document AI) →
  chart of accounts suggestion → ProposedEntryCard
- Vendor management + institutional memory (`vendor_rules` populated;
  `vendor_rules.autonomy_tier` wired)
- Intercompany detection and reciprocal entry proposal (Section 6)
- Flinks bank feed integration (Canadian institutions)
- Confidence-based routing graph wired to `routing_path` field
- Bidirectional canvas state
- Canvas tabs

### Timeline Reality

| Phase | Optimistic | Realistic (solo non-developer + AI assistance) |
|---|---|---|
| 1.1 Foundation | 1 week | 2–3 weeks |
| 1.2 The Agent | 1 week | 2–4 weeks |
| 1.3 Reality Check | 3 weeks (time-boxed) | 3 weeks (time-boxed) |
| **Phase 1 total** | **5 weeks** | **7–10 weeks** |

This is not a reason to reduce Phase 1 scope further. It is a reason to not
make commitments based on week estimates. **Measure units of work, not
calendar time.** When something takes 3x what you expected, that is data
about where the system's real complexity is hiding — note it in the friction
journal, do not punish yourself for it.

---

## Section 8 — The Hard Problems

Each of these is addressed explicitly so the phase briefs do not have to
re-argue them.

### 8a. Bank Feed Integration (Canada-Specific) — Phase 2
- **Flinks** (Canadian-first, supports all major Canadian banks). Not Plaid.
- Requires a business agreement and sandbox credentials before Phase 2
  begins. Start the procurement conversation during Phase 1.3.
- Architecture: Flinks webhook → Next.js API route (or Express endpoint
  after the Phase 2 monorepo split) → `bank_transactions` table → agent
  reconciliation queue.
- Known gap: some smaller Canadian credit unions are not on Flinks.
  Document them as a manual-import path.

### 8b. Multi-Currency and FX Revaluation — Phase 4 (schema in Phase 1)
- Phase 1.1 schema includes `currency`, `amount_original`, `amount_cad`,
  `fx_rate` columns on `journal_lines`, `bills`, `invoices`,
  `bank_transactions` — all four financial tables, not just journal_lines.
- Functional currency for the Canadian family office is CAD.
- Phase 4 wires the Bank of Canada daily rates API for FX rate retrieval.
- FX revaluation logic is Phase 4. Phase 1–3 default `fx_rate` to 1.0 and
  `amount_cad = amount_original` for CAD transactions.

### 8c. Tax Compliance (GST/HST Abstraction) — Phase 1.1 schema, Phase 2 wiring
- Never hardcode tax rates. The `tax_codes` table holds rate, jurisdiction,
  and effective date ranges.
- Phase 1.1 seeds the table with current Canadian federal and the relevant
  provincial rates for the founder's actual operating provinces.
- Tax rate changes create a new `tax_codes` row with an `effective_from`
  date. Existing rows are never updated — historical entries continue to
  reference the rate that was effective when they were created.

### 8d. Reconciliation UX — Phase 2
- Two-column reconciliation grid: bank transactions on the left, proposed
  matches (bills/payments) on the right.
- The agent pre-populates matches using a `match_bank_transaction_to_bill`
  tool.
- The user approves matches one by one or bulk-approves high-confidence
  matches.
- Unmatched transactions can be assigned to a GL account directly in the
  canvas.

### 8e. Human Review of AI Actions in Bulk
- The AI Action Review queue (controller role, Phase 1.2) shows all
  `ai_actions` with status: Pending / Confirmed / Rejected / Auto-Posted.
- Filters: confidence level, entity, date range.
- Bulk approve is Phase 2 — Phase 1.2 supports one-at-a-time.
- Every approval or rejection is recorded in `ai_actions.confirming_user_id`
  with `confirmed_at` timestamp.

### 8f. Idempotency — Phase 1.2 wiring detail
- Every agent mutating tool call carries an `idempotency_key` UUID.
- **When is the key generated?** On the frontend, when the user clicks
  Approve on a ProposedEntryCard. **Not** on every tool call. **Not** on
  every dry-run. Dry-runs do not need idempotency because they do not
  write. The key represents one user confirmation intent.
- The service layer checks `ai_actions` for an existing row with the same
  `(org_id, idempotency_key)` before doing any work.
- If found and Confirmed: return the existing result.
- If found and Pending: return the existing proposed card.
- If not found: proceed.

---

## Section 9 — Security and Secrets Management

### 9a.0 Hosting Region Pinning (v0.5.3, A7) — Hard Constraint, Not a Founder Choice

**Vercel and Supabase must both deploy to a Canadian region.** Specifically:

- Supabase: `ca-central-1` (Toronto) — the only Canadian Supabase region.
- Vercel: `yul1` (Montreal) or equivalent Canadian region for the serverless
  function execution — set via `vercel.json` `regions` field and confirmed
  in the Vercel dashboard per-environment.

**Why this is a hard constraint, not Open Question 4's "appropriate Vercel
region":** Open Q4 asks the founder to "confirm" the region. v0.5.3
upgrades this from a choice to a rule. If Vercel executes serverless
functions in `iad1` (US East, default) while Supabase is in
`ca-central-1`, every API route round-trip pays ~30 ms for the
transit to Toronto and back. For the Phase 1.1 P&L query, the manual
entry form, and Phase 1.2's agent confirmation path, this manifests as
a vague "the system is slow" founder perception — the actual cause
being geographic, not architectural. The founder will spend debugging
effort on the wrong layer.

**Canadian data residency** is also a legitimate reason for a family
office handling financial data: HST/GST records, intercompany
relationships, and controller-signed audit entries are all regulated
data categories that benefit from not crossing a border.

**How to verify during Phase 1.1 setup:**
1. Supabase project creation step: select `ca-central-1` in the region
   dropdown. If the project was already created in a different region,
   delete and recreate before writing any data.
2. `vercel.json` at the repo root contains:
   ```json
   { "regions": ["yul1"] }
   ```
3. Vercel dashboard → Project → Settings → Functions → verify `yul1`
   is listed. Preview and production deployments both pinned.

This criterion blocks Phase 1.1 exit — see Phase 1.1 exit criterion #15
(added in v0.5.3).

### 9a. Environment Variable Table

| Variable | Consumed By | Client-Safe? | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | All | Yes | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client (sign-in) | Yes | Public key, browser-safe |
| `SUPABASE_SERVICE_ROLE_KEY` | `src/db/adminClient.ts`, `src/services/`, API routes | **NO** | Server-only. Boot-time assertion required. |
| `ANTHROPIC_API_KEY` | `src/agent/orchestrator/` | **NO** | Server-only. Boot-time assertion required. |
| `LOCAL_DATABASE_URL` | Local dev only | NO | For seed scripts |
| `NEXT_PUBLIC_APP_URL` | Client | Yes | Used for OAuth redirects |
| `NODE_ENV` | All | Yes | |
| `FLINKS_CLIENT_ID` | Phase 2 | NO | |
| `FLINKS_SECRET` | Phase 2 | NO | |

**Boot-time assertion (Phase 1.1 — Category A):**

```typescript
// src/shared/env.ts
const required = ['SUPABASE_SERVICE_ROLE_KEY', 'ANTHROPIC_API_KEY'] as const;
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`FATAL: missing required env var ${key}. Refusing to start.`);
  }
}
```

Imported once at the top of `next.config.ts` (or equivalent server entry
point) so the app refuses to start without the critical secrets.

### 9b. .env File Strategy
- `.env.example` committed to repo with placeholder values and comments
- Real `.env.local` files gitignored
- `NEXT_PUBLIC_` prefix required for any variable used in Next.js client
  components. Everything else is server-only.
- **Rule:** `SUPABASE_SERVICE_ROLE_KEY` must never appear in any file that
  is bundled into the Next.js client. Only API routes, server components,
  and `src/services/` may import it.

### 9c. Production Secrets
- Vercel environment variables for all server-only secrets in Phase 1.
- After the Phase 2 monorepo split and the introduction of a worker host
  (Railway, Fly.io, or Render), use that host's secret manager for
  worker-only secrets.
- Recommend a dedicated secrets manager (Doppler or AWS Secrets Manager)
  if the team grows beyond 3 people.

### 9d. Key Rotation
- Service-role key: Supabase dashboard → regenerate → update Vercel env →
  redeploy. Zero-downtime if the old key remains valid during rollout.
- Anthropic API key: same pattern.
- JWT signing: managed entirely by Supabase.

### 9e. Logging Hygiene Rules — `pino` redact list

**Phase 1.1 — Category A.** Configure `pino` with the following redact
paths at boot:

```typescript
// src/shared/logger/pino.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: [
      'headers.authorization',
      'headers.cookie',
      '*.password',
      '*.api_key',
      '*.apiKey',
      '*.secret',
      'env.SUPABASE_SERVICE_ROLE_KEY',
      'env.ANTHROPIC_API_KEY',
      '*.bank_account_number',
      '*.tax_id',
      '*.sin',
      '*.card_number',
    ],
    censor: '[REDACTED]',
  },
});
```

**Verification (part of Phase 1.1 exit criteria):** intentionally log a
message containing `process.env.SUPABASE_SERVICE_ROLE_KEY`; confirm it
appears as `[REDACTED]` in the output.

Beyond redaction:
- Never log full JWT tokens
- Never log raw bank account numbers, SINs, tax IDs, or card numbers
- `audit_log` and `ai_actions` store entity IDs and references — never raw
  sensitive values
- Every log line must include `trace_id`, `org_id`, `user_id` where
  available

---

## Section 10 — Performance and Scale Notes

These are decisions that are painful to retrofit. Not premature optimization.

- **Index plan:** Section 2e is the source of truth. Every new service
  function query must be checked against the index list before merging.
- **Bulk operations:** All service functions that operate on multiple rows
  (`bulkCategorizeTransactions`, `bulkConfirmBillDrafts`) must accept arrays
  and execute a single transactional write. Never loop one at a time.
- **Transactional writes:** Every mutating service function runs inside a
  single Postgres transaction. Partial writes are not permitted. The
  `postJournalEntry` worked example (Section 3d) is the template.
- **Async / background work — Phase 2.** Phase 1 has none. pg-boss is
  installed in Phase 2 for: bank feed sync, OCR on uploaded receipts,
  recurring invoice generation, and the audit_log projection (Phase 2
  correction for Simplification 1).
- **N+1 avoidance:** List endpoints (bills, transactions, ai_actions) must
  eager-load related rows (vendor name, account name, org name) in a single
  query using Postgres JOINs. Never loop.
- **Caching:** Defer entirely. No Redis, no query caching in Phases 1–2.
  Flag as Phase 3+ when report generation becomes slow.

### 10c. Transaction Isolation Level (v0.5.3, D9)

**The default isolation level is READ COMMITTED** — Postgres's default,
and the level under which all integration tests and service functions
run unless explicitly overridden. The service layer does not elevate
to `SERIALIZABLE` because:

1. The v0.5.3 period lock trigger (Section 1d) takes a row-level lock
   on `fiscal_periods` via `SELECT ... FOR UPDATE`, which is the precise
   concurrency protection `SERIALIZABLE` would provide for the one case
   where it matters (race between a journal post and a period lock).
   Row locks are cheap; `SERIALIZABLE` is not.
2. The deferred constraint for debit=credit (Section 1d) runs at commit
   and is already transaction-scoped — isolation level does not change
   its semantics.
3. `SERIALIZABLE` in Postgres uses predicate locking (SSI) and can
   produce unpredictable `could not serialize access due to
   read/write dependencies` errors that the service layer would then
   have to retry. For a single-founder Phase 1 with low concurrency,
   this is cost without benefit.

**The rule is explicit:** Phase 1 mutating service functions run under
READ COMMITTED. They rely on row-level locks (`SELECT ... FOR UPDATE`)
at the specific points where write skew would otherwise occur — the
period lock trigger is the only such point in Phase 1. If a future
feature introduces another read-then-write pattern with cross-row
dependency (e.g., a "reserve the next invoice number in sequence"
path), the service function adds a row lock at that point, not a
blanket isolation bump.

**What `SERIALIZABLE` would catch that row locks do not:** nothing, in
Phase 1. In Phase 2 with concurrent AP batch ingestion, the decision
is revisited — but the default position remains READ COMMITTED with
targeted row locks, not `SERIALIZABLE` everywhere.

---

## Section 10a — Testing Strategy (Service Layer)

The three Category A integration tests are the floor, not the ceiling. They
prove the invariants cannot be bypassed. They do not prove that the service
functions compute the right answer. Unit tests do that.

**What to unit-test and how:**
- **Service functions are the target.** Not components, not API routes,
  not tools. The service layer is where all business logic lives (Two
  Laws) so it is the only layer whose correctness matters at the unit
  level.
- **Do not mock the database with an in-memory fake.** Fakes drift from
  real Postgres behavior (deferred constraints, RLS, triggers). Run unit
  tests against a throwaway Supabase test schema that is reset between
  tests (`TRUNCATE ... CASCADE` in an `afterEach`). This is closer to a
  fast integration test than a classic unit test, and that is correct for
  this codebase.
- **Do mock the outside world.** Anthropic API calls, Flinks, Supabase
  Storage, email inbound — anything over the network is mocked at the
  module boundary, not inside the service function.
- **Coverage targets** (not enforced by CI in Phase 1, just a written
  expectation):
  - `journalEntryService.post` and its invariant helpers: **80%+**. This
    is the one function that writes money.
  - Other mutating services (`chartOfAccountsService.create`,
    `periodService.lock`): **60%+**.
  - Read-only services (list/get/search): smoke-test only — exercised
    indirectly by integration tests.
- **Test names are assertions, not descriptions.** `post_rejects_unbalanced_entry`,
  not `should reject unbalanced entries`. Grep-friendly and unambiguous
  when a test fails in CI logs.
- **Fixtures live with the test file,** not in a `__fixtures__` folder at
  the repo root. Locality beats DRY for test data.
- **What not to test:** Next.js route handlers, React components (other
  than the ProposedEntryCard snapshot in Phase 1.2), Supabase client
  initialization, environment config loading. These are either framework
  code or configuration — covered implicitly by the integration tests
  passing.

**Test file layout in Phase 1.1:**
```
src/services/journalEntry/
  journalEntryService.ts
  journalEntryService.test.ts        ← unit tests (Postgres-backed)
  types.ts
tests/integration/
  debit-credit-invariant.test.ts     ← Category A floor #1
  period-lock.test.ts                ← Category A floor #2
  rls-cross-org.test.ts              ← Category A floor #3
```

---

## Section 10b — Unit Economics and Cost Model

Neither v0.4.0 nor v0.5.0 addressed cost. A founder aiming at unicorn
scale needs a rough cost baseline by the end of Phase 1, not by Phase 3
when the spend becomes visible on a monthly statement.

**The three recurring costs in Phase 1:**
1. **Supabase** — Free tier during Phase 1.1; Pro ($25 USD/month) once
   real financial data lands in Phase 1.3 (Pro includes daily backups,
   7-day PITR, higher storage, and `ca-central-1` availability).
2. **Vercel** — Hobby during Phase 1.1; Pro ($20 USD/user/month) once the
   Next.js app is sharing preview URLs with an outside reviewer (Phase
   1.2 external-validation session).
3. **Anthropic API (Claude)** — variable; entirely a function of how many
   agent interactions happen. No ceiling in Phase 1.2 (see Open Question
   12); measured per-entry throughout Phase 1.2 and Phase 1.3.

**What to measure and when:**
- **Phase 1.2 exit criterion 11** (added above) records Anthropic cost
  per agent-assisted journal entry. Collect at least 20 data points.
- **Phase 1.3 exit criterion 5** records Anthropic cost per closed
  month. This is the month-end unit cost that determines Phase 2 scope.
- **Supabase row count and storage** — check the Supabase dashboard once
  per week during Phase 1.3. If the free-tier row count is approached
  before Pro is enabled, that is itself a friction-journal entry.
- **Back-of-envelope Phase 1 monthly burn target:** under $100 USD all-in
  during Phase 1.1 and 1.2 (Supabase Free + Vercel Hobby + Claude API for
  20–50 entries/week). Crossing $100 in Phase 1.2 is a signal to recheck
  the agent's prompt-caching configuration and tool-call retry count
  (Open Question 13) — not necessarily to cut scope.
- **What this is not:** this is not a runway model, not a revenue
  forecast, not a pricing page. It is a *per-unit-of-accounting-work*
  cost baseline so that Phase 2 decisions (AP automation, OCR provider
  choice, bank feed frequency) can be priced against something real
  instead of intuition.

**One-line rule:** if you do not know, by end of Phase 1.3, the dollar
cost of posting one agent-assisted journal entry and the dollar cost of
closing one real month, Phase 1 is not done regardless of what the
integration tests say.

---

## Section 11 — Internationalization (i18n)

Day 1 requirement, not an afterthought.

- **`next-intl`** for all UI strings.
- All agent response text is **structured data**, not English prose. The
  agent returns `{template_id, params}` and the UI layer renders the
  localized string from the template. This is the only way to make the
  agent trilingual without retranslating every Claude output.
- URL structure: `/[locale]/[orgId]/...` from day one. Both `[locale]` and
  `[orgId]` in the path. (Bookmarks, deep links, redirects all
  org-aware.)
- Translation files: `messages/en.json`, `messages/fr.json`,
  `messages/zh-Hant.json`. Phase 1.1 populates `en.json`; the other two
  exist with the same key structure but empty/placeholder values.
- Agent system prompts include the user's `locale` and instruct Claude to
  return template IDs that have entries in all three locale files.
- Date and number formatting: `Intl.DateTimeFormat`, `Intl.NumberFormat`
  with the user's locale. Never hardcode date or currency formatting.
- **Traditional Mandarin note:** `zh-Hant`, not `zh-TW`. The `next-intl`
  config uses `zh-Hant` as the key.
- **v0.5.3 — placeholder locale fallback rule (A9).** Phase 1.1
  populates `messages/en.json` only. `messages/fr.json` and
  `messages/zh-Hant.json` exist with the same key structure but with
  **English fallback values cloned from `en.json`**, not empty strings
  and not missing keys. Empty strings render as blank UI; missing keys
  throw at runtime in `next-intl` dev mode and fall back to the raw
  `template_id` string in production. Neither is acceptable. The
  Phase 1.1 brief generates `fr.json` and `zh-Hant.json` by `cp en.json
  fr.json && cp en.json zh-Hant.json` as a baseline, and real French
  and Traditional Chinese strings replace the English values
  incrementally in later phases. **Every key in `en.json` must have a
  corresponding key in both other locale files, even if the value is
  still English** — this makes Phase 1.3 exit criterion #12 ("walk one
  non-English path end-to-end") meaningful instead of blocked on
  missing keys.

---

## Section 12 — Developer Onboarding

A new contributor (or future-you returning to the codebase after a break)
should be able to go from a clean laptop to a running local environment by
following this section alone.

### Prerequisites
- Node.js v20+ (use `nvm` — `.nvmrc` is committed)
- pnpm v9+ (`npm install -g pnpm`) — used for `pnpm dev` even though the
  repo is not a workspace in Phase 1; pnpm is faster than npm
- Supabase CLI (`brew install supabase/tap/supabase` or platform equivalent)
- Postman
- Anthropic API key (request from team lead)
- VS Code with extensions: ESLint, Prettier, Tailwind CSS IntelliSense,
  Supabase

### Step-by-Step Setup
1. `git clone [repo] && cd the-bridge`
2. `nvm use` (installs the Node version from `.nvmrc`)
3. `pnpm install`
4. `cp .env.example .env.local` and fill in all values
5. `pnpm db:start` (starts local Supabase: Postgres + Auth + Studio)
6. `pnpm db:migrate` (runs the initial schema migration)
7. `pnpm db:generate-types` (generates TypeScript types from the schema)
8. `pnpm db:seed` (creates the 2 dev orgs + 3 dev users)
9. `pnpm dev` (starts Next.js)
10. Open `http://localhost:3000` — sign in with one of the seed users
11. Open Postman → import `postman/collection.json` → set `base_url` to
    `http://localhost:3000`
12. Run "Health Check" — expect `{ status: "ok" }`

### Troubleshooting

**Wrong Node version.** `nvm use` should fix it. If nvm is not installed,
install it first.

**Boot-time env var assertion fires.** Read the error message; it names the
missing variable. Check `.env.local`. The two most commonly missing in
fresh setups are `SUPABASE_SERVICE_ROLE_KEY` (run `supabase status` to see
your local key — it changes every time you reset local Supabase) and
`ANTHROPIC_API_KEY` (request from the team lead).

**RLS blocking a query / empty result set.** **Suspect RLS first.** A
policy that silently returns empty result sets looks identical to "no data
exists" and the error message is unhelpful. See `docs/troubleshooting/rls.md`.
Check that the service is using the service-role client
(`src/db/adminClient.ts`), not the anon client. If you are in a server
component, you are correctly using the user-scoped client and RLS is
intentional — make sure the user has a `memberships` row for the org.

**Agent not responding.** Check that `ANTHROPIC_API_KEY` is set. Check the
pino logs for the trace ID and follow it through the orchestrator.
Click any Mainframe icon — if the manual paths still work, the issue is
isolated to the agent layer (the Mainframe degradation path is working as
designed).

**Deferred constraint not firing.** The most common cause is forgetting
the `DEFERRABLE INITIALLY DEFERRED` clause when recreating the constraint.
Read Section 1d.

### Contribution Conventions
- Branch naming: `feat/[ticket-id]-short-description`,
  `fix/[ticket-id]-description`
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`)
- New service function → `src/services/[module]/[entity]Service.ts`
- New agent tool → `src/agent/tools/[toolName].ts`
- New Zod schema → `src/shared/schemas/[module]/[entity].schema.ts`, then
  imported by service, route handler, and form component
- Every PR: updated Postman collection (if API changed), updated Zod
  schemas (if data shape changed), migration file (if schema changed)
- **Direct database calls outside `src/services/` are rejected at code
  review.** No exceptions, no urgency override (Invariant 2 enforcement).

---

## Section 13 — What Not to Build (Commodity vs. Differentiation)

| Capability | Build or Buy? | Reason |
|---|---|---|
| OCR on invoice PDFs | Buy — AWS Textract or Google Document AI | Commodity |
| Bank feed connectivity | Buy — Flinks (Canada) | Bank relationships, regulation |
| Tax rate tables | Buy — Avalara or TaxJar (Phase 3+) | Compliance, not core IP |
| E-invoicing compliance | Buy if needed (Phase 4+) | Niche, jurisdictional |
| Email parsing | Build a thin wrapper using Postmark inbound or Gmail API | Simple, want pipeline control |
| Double-entry accounting logic | **Build** | This is core IP — own the journal |
| Agent orchestration | **Build** on Claude API | The agent behavior IS the product |
| Institutional memory / vendor rules | **Build** | Unique to multi-entity family office |
| Consolidated multi-entity reporting | **Build** | Off-the-shelf does not handle this |
| The Bridge UI | **Build** | This is the product's identity |

---

## Section 14 — Event Sourcing vs. CRUD + Audit (Resolved for v0.5.0)

**The question that was open in v0.4.0:** Should the accounting ledger be
event-sourced (append-only events projected into balances) or traditional CRUD
with an audit table?

**Resolved in v0.5.0. This section is a decision log, not an open question.**

**v0.5.0 resolution:**

**Phase 1: traditional CRUD with a strong audit table.** `journal_entries`
+ `journal_lines` are append-only by convention (no UPDATE or DELETE — RLS
policies enforce this; corrections are made via reversal entries, which is
IFRS-correct). The `audit_log` table captures every write, written
synchronously inside the same transaction (Simplification 1). The `events`
table exists with append-only trigger but is not written to (Simplification 2).

**Phase 2: hybrid migration.** The events table begins receiving writes.
The `audit_log` becomes a projection of events updated by pg-boss
post-commit. Both run in parallel; the historical `audit_log` rows are
backfilled into the events table by a one-time script.

**Phase 3+: full event sourcing as the source of truth** if query patterns
demand it. This is a deliberate decision to make later when there is real
data about query patterns, not a guess made now.

**Why not full event sourcing in Phase 1?** Operational complexity for a
solo non-developer. Projection management, snapshotting, and replay
infrastructure are not justifiable for ~100 users on Phase 1 traffic. The
schema reservations (events table, append-only trigger) make the Phase 2
migration mechanical. The Phase 1 audit_log is the right answer right now.

---

## Section 15 — Service Communication Contract Rules (v0.5.0 form)

This section was "Agent Communication Contract Rules" in v0.4.0. Renamed
because in Phase 1, the boundary that matters is the **service** boundary,
not the agent-to-service boundary (since agents collapse to services per
Simplification 3). The substance is unchanged; the wording reflects v0.5.0
reality.

### 15a. The Core Rule

**Every call into the service layer goes through a typed Zod-validated
input. The service layer never trusts its caller.** API route handlers
validate. Agent tools validate. Tests validate. The service function
itself re-validates at the boundary as defense-in-depth (the worked example
in Section 3d shows this).

In Phase 2, when the agent layer is reintroduced, this becomes "every
agent-to-service call goes through a typed command contract in
`packages/contracts/agent`." The Phase 1 form is the same rule applied at
the service boundary directly.

### 15b. The Five Rules of Service Communication

**Rule 1 — Typed Input Schemas Only.** Every service function input is a
Zod schema in `src/shared/schemas/`. No inline types, no `any`, no untyped
objects.

**Rule 2 — Validation at Both Ends.** The caller validates its outgoing
input; the service re-validates incoming input. Both ends validate. Neither
trusts the other.

**Rule 3 — Idempotency on Every Mutating Command.** Every service function
that writes to the database accepts an `idempotency_key` UUID (required for
agent source, optional for manual source). The service checks `ai_actions`
for an existing row with the same `(org_id, idempotency_key)` before doing
any work. See Section 8f.

**Rule 4 — No Free-Form Data at the Boundary.** What crosses into the
service layer must be:
- A UUID retrieved from the database (not a name a caller invented)
- A numeric amount validated by the schema (not inferred)
- An enum value from a closed set (not free-text)
- A date in ISO format (not "last Tuesday")

If a caller cannot produce a valid typed value for a required field, it
must fail or ask a clarifying question. It must not guess.

**Rule 5 — Trace ID on Every Call.** Every service function receives a
`ServiceContext` with `trace_id` (required), `org_id`, and `caller`. The
trace ID is generated when the user's intent first arrives (the Next.js
API route or the orchestrator) and propagates through every layer:
caller → service → database → audit_log → log line. Every layer logs the
trace_id. When something goes wrong, filter pino logs by `trace_id` to
reconstruct the path.

### 15c. The One Real Contract in Phase 1

`src/contracts/doubleEntry.contract.ts` — the `PostJournalEntryCommand`
schema with `_contract_version`, `trace_id`, `idempotency_key` as required
fields. This is the only file in `src/contracts/` in Phase 1. Phase 2
generalizes to a full three-namespace package once there are 5+ contracts
and the pattern is visible.

### 15d. Confidence Routing (Phase 2 — display only in Phase 1)

Confidence scoring is computed by the agent (Phase 2) using institutional
memory: vendor history match quality, amount within expected range, account
code consistency with past entries, intercompany flag consistency.

Phase 1: the `confidence` field exists on `ProposedEntryCard` and is
displayed. The `routing_path` field exists as a Category A reservation but
is unused.

Phase 2: confidence drives routing.

```
High confidence  → Standard AP Queue (AP specialist reviews and approves)
Medium confidence → Controller approval required before AP Queue
Low confidence   → Dual review: AP specialist + controller
Novel pattern    → Escalation: controller + CFO notification
```

The `routing_path` field on `ProposedEntryCard` carries the routing
decision. The orchestrator uses it to determine which queue receives the
card.

### 15e. Behavioral Invariants — Phase 1 enforcement layers

**Layer 1 — Database constraints and triggers (accounting math):**
- Deferred constraint: debit=credit per journal entry (Section 1d)
- Trigger: period not locked
- Trigger: events table append-only
- Constraints: `org_id` NOT NULL, line is debit XOR credit

**Layer 2 — Service middleware (`withInvariants()`):**
Wraps every service function. Pre-flight checks:
- ServiceContext carries a valid verified caller identity
- Command carries a valid `trace_id`
- Command carries an idempotency key (if mutating + source=agent)
- `org_id` in the command is consistent with the authenticated user's
  memberships
- **v0.5.3 (A3): `canUserPerformAction()` is invoked automatically by
  `withInvariants()` for every mutating service function.** The previous
  design relied on each service function to remember to call it. That
  is not good enough — a single forgotten call is a cross-tenant data
  breach because the service-role client bypasses RLS. The middleware
  now requires every wrapped service function to declare an
  `action: ActionName` in its registration, and `withInvariants()`
  calls `canUserPerformAction({ caller, org_id, action })` unconditionally
  before invoking the function body. A service function that mutates
  without being wrapped by `withInvariants()` is a build-time error
  enforced by a lint rule (`no-unwrapped-service-mutation`).

If any check fails, throws `InvariantViolationError` before touching the
database.

**v0.5.3 — test for the A3 middleware rule:** add a fourth integration
test to `tests/integration/` — `serviceMiddlewareAuthorization.test.ts` —
that calls `journalEntryService.post()` with a `ServiceContext` whose
`caller.user_id` has no membership in the target `org_id`. The
expected result is an `InvariantViolationError` thrown before any
database write occurs. The test asserts that no row exists in
`journal_entries` afterward and no row exists in `audit_log` — proving
the check runs before the transaction begins, not inside it.

**Layer 3 — Phase 2 only.** Event middleware that runs sequencing checks
inside the same transaction as the mutation. Phase 1 does not have this
layer because it does not write to the events table (Simplification 2).

### 15f. Ordering Rules — Phase 1 and Phase 2 Side by Side

The ordering of operations inside a mutating service call is the same shape
in Phase 1 and Phase 2. The differences are localized to three steps and are
called out below the diagrams. Read them side by side; the diff is what
matters.

**Phase 1 ordering** (current — uses synchronous audit log per Simplification 1,
events table not written per Simplification 2):

```
 1. API route or orchestrator builds ServiceContext with trace_id
 2. Zod parse input at the boundary (defense-in-depth)
 3. withInvariants() pre-flight checks run
 4. Idempotency check (if mutating and idempotency_key present)
 5. Authorization check (canUserPerformAction)
 6. Business pre-checks (period open, account exists, etc.)
 7. BEGIN transaction
 8.   INSERT journal_entries
 9.   INSERT journal_lines
10.   INSERT audit_log                       ← Simplification 1: synchronous
11.   INSERT ai_actions row (if source=agent)
12. COMMIT (deferred constraint runs here; ROLLBACK on imbalance)
13. Return result with canvas_directive
```

**Phase 2 ordering** (target — Simplifications 1 and 2 corrected; pg-boss
installed; events table receives writes; audit_log becomes a projection):

```
 1. API route or orchestrator builds ServiceContext with trace_id
 2. Zod parse input at the boundary (defense-in-depth)
 3. withInvariants() pre-flight checks run
 4. Idempotency check (if mutating and idempotency_key present)
 5. Authorization check (canUserPerformAction)
 6. Business pre-checks (period open, account exists, etc.)
 7. BEGIN transaction
 8.   INSERT journal_entries
 9.   INSERT journal_lines
10.   INSERT events (JournalEntryPostedEvent) ← Phase 2 correction (was: audit_log)
11.   INSERT ai_actions row (if source=agent)
12. COMMIT (deferred constraint runs here; ROLLBACK on imbalance)
13. Return result with canvas_directive
14. [POST-COMMIT, ASYNC] pg-boss subscriber reads new event
15. [POST-COMMIT, ASYNC] pg-boss writes audit_log projection from event
16. [POST-COMMIT, ASYNC] pg-boss updates GL balance projections
```

**The diff in three lines:**

| Step | Phase 1 | Phase 2 |
|---|---|---|
| 10 | INSERT audit_log (synchronous, in transaction) | INSERT events (synchronous, in transaction) |
| 14–15 | (do not exist) | pg-boss subscriber writes audit_log projection async |
| 16 | (do not exist) | pg-boss subscriber updates GL balance projections async |

**Atomicity guarantee in both phases:** Steps 1–12 are atomic. If any step in
1–12 fails, the entire transaction rolls back and nothing was written. The
deferred constraint runs at step 12 (COMMIT) and rolls back the entire
transaction if debits ≠ credits, regardless of which steps succeeded earlier.

**The Phase 2 reliability rule:** Steps 14–16 happen after commit and are
retried on failure by pg-boss. If a projection write fails, the event is
still in the events table (Layer 1 truth — Invariant 3) and can be replayed.
The projection eventually catches up. This is why the events table must be
the source of truth in Phase 2 — projections can lag, but they cannot
disagree with events for long, and they can always be rebuilt from events.

**The Phase 1 reliability rule:** Because there are no async steps, there is
no eventual consistency to manage. The cost is Simplification 1 — the audit
log is the primary record instead of a projection. The benefit is that there
is exactly one place a journal entry can exist after a successful POST: the
database, in a fully consistent state. No worker process to fail, no jobs to
retry, no projections to lag. This is the right trade-off for Phase 1
traffic and a solo founder operating the system.

---

## Section 16 — Documentation and Decision Tracking (v0.5.0 form)

v0.4.0 specified pre-populated ADRs ADR-001 through ADR-007 as Phase 0
deliverables. **v0.5.0 reverses this.** ADRs are written when decisions
are made in anger with real tradeoffs, not pre-populated as documentation
ceremony. Pre-populated ADRs become cargo-cult docs that rot.

### What Phase 1.1 creates:

**`docs/prompt-history/CHANGELOG.md`** — pre-populated with v0.1.0 through
v0.5.0, including what changed in each version and why. This is the master
version log of the architecture itself.

**`docs/prompt-history/v0.5.0-phase1-simplification.md`** — the milestone
note for v0.5.0 capturing the eight superseded decisions (see "Eight
v0.4.0 decisions formally superseded" in the version history at the top
of this document) and the reasoning.

**`docs/decisions/README.md`** — the ADR template only. No ADR-001
through ADR-NNN files. The README contains:

```markdown
# Architecture Decision Records

This folder will hold one ADR per major architectural decision as it is made.
ADRs are written in anger — when there is a real tradeoff with real options
and a real reason for choosing one over the others. ADRs are not written in
advance as documentation ceremony.

## When to write an ADR
- A decision that took more than 30 minutes to make
- A decision that closes off other options
- A decision a future contributor will reasonably ask "why?" about
- A decision that contradicts something in PLAN.md (in which case, also
  bump PLAN.md)

## Template
\`\`\`
# ADR-NNN: [Decision Title]
## Status: Accepted | Superseded by ADR-MMM | Deprecated
## Date: YYYY-MM-DD
## Context: [What problem needed solving and what constraints apply]
## Decision: [What was decided in one or two sentences]
## Consequences: [What this enables and what it constrains]
## Alternatives considered: [What was rejected and why]
## Triggered by: [Which conversation, PR, or incident prompted this]
\`\`\`
```

**`docs/troubleshooting/rls.md`** — the "suspect RLS first" guide for
debugging empty result sets that look like missing data.

**`docs/phase1.3-friction.md`** — created empty in Phase 1.1, populated
during Phase 1.3 (the Reality Check phase).

### What Phase 1.1 does NOT create:
- ADR-001 through ADR-NNN files (written organically during Phase 1.1
  and 1.2 as real decisions are made)
- Pre-built Layer 3 workflow agent stubs
- Empty interface files for Phase 2+ features beyond the ones explicitly
  required (canvas directive types and the contracts file)

---

## Section 17 — Phase 1.2 Decisions Deferred to the Phase 1.2 Brief

These are decisions the Bible deliberately does not pre-resolve **and that
do not belong in Open Questions either** — they are implementation-detail
decisions that the Phase 1.2 Execution Brief will resolve once Phase 1.1 is
done and there is real implementation experience to draw on.

The seven decisions that v0.5.0 had defaulted silently here have been
**promoted to Section 18 — Open Questions** in v0.5.1, because their
defaults were mine, not the founder's, and they are foundational enough
that they should be made explicitly before the Phase 1.1 brief is written.

| Decision | Why it stays in this section |
|---|---|
| **Exact Claude model selection** (Sonnet 4.5 vs Sonnet 4 vs Haiku for orchestrator) | Depends on prompt-caching cost data we cannot have until Phase 1.2 begins. The Phase 1.2 brief picks a starting model and sets a measurement plan. |
| **Prompt caching configuration details** (which prompt segments to cache, cache TTL) | Anthropic prompt caching is a Phase 1.2 day-1 default, but the exact segmentation depends on the final system prompt structure, which depends on persona prompts written during Phase 1.2. |
| **Persona prompt content for Controller and AP Specialist** in Phase 1.2 | The prompts exist in the Phase 1.2 brief, not the Bible. They are tuned during Phase 1.2 development. |
| **Tool-call retry backoff** (immediate retry vs 1s delay vs exponential) | Depends on observed Claude API behavior. The Phase 1.2 brief picks an initial value and adjusts based on Phase 1.3 friction. |

Everything else that v0.5.0 had in this section has been moved to Open
Questions for the founder to resolve before Phase 1.1 begins.

---

## Section 18 — Open Questions

These are gaps and ambiguities that I (Claude, drafting v0.5.1) want the
founder to resolve before the Phase 1.1 brief is written. Each has a
proposed resolution, but **the proposed resolution is mine, not yours** —
silently inheriting any of these defaults would violate the "zero
reasonable assumptions" rule.

The 19 questions are grouped into three categories:
- **Section 18a — Founder data and environment** (Questions 1–10): things
  only the founder knows, like which orgs and which months
- **Section 18b — Architectural decisions promoted from Section 17 in v0.5.1**
  (Questions 11–17): decisions v0.5.0 had defaulted silently in Section 17;
  promoted in v0.5.1 because they are foundational, not Phase 1.2 details
- **Section 18c — Architectural gaps not previously surfaced** (Questions
  18–19): genuine architectural questions the v0.5.0 review missed

### Section 18a — Founder Data and Environment

1. **Which two CoA templates are seeded in Phase 1.1?** I have assumed
   "holding company" and "real estate" based on the v0.4.0 spec mentioning
   them as the founder's likely first orgs. **Confirm** these are the two
   the founder will create real orgs for, or name the correct two.

2. **Which Canadian provinces' tax rates are seeded in Phase 1.1?** The
   `tax_codes` table is Category A. Phase 1.1 needs concrete seed rows.
   I have assumed federal GST plus the provinces where the founder's
   actual entities operate. **Specify which provinces.**

3. **Which real calendar month is targeted for Phase 1.3?** Phase 1.3
   exit criterion #1 is "close one real month for one real org." The
   month must be chosen before Phase 1.2 finishes so the data is being
   collected as Phase 1.2 work proceeds. **Specify which org and which
   month.**

4. **Vercel + Supabase deployment region.** Canadian data residency may
   matter for the family office. Supabase offers Canadian regions
   (`ca-central-1`). Vercel offers regional deployment. **Confirm
   `ca-central-1` for Supabase and the appropriate Vercel region.**

5. **Local development OS.** This affects the Supabase CLI install
   command in Section 12 and the line endings convention. **Confirm
   macOS, Linux, or Windows.**

6. **The two real users for Phase 1.1 testing.** The seed script creates
   3 dev users. The two real users in Phase 1.1 exit criterion #7 are
   different — they are real human users with real Supabase Auth
   accounts. **Confirm whether the founder wants to use real email
   addresses for these or test addresses initially.**

7. **Source control hosting.** Assumed GitHub from v0.4.0 spec. **Confirm.**

8. **Backup and restore strategy for the local Supabase database.**
   Phase 1.3 uses the system for real bookkeeping. The local Supabase
   database holding real financial data needs a backup story before
   Phase 1.3 begins. **Decide:** rely on remote Supabase backups (means
   running against remote, not local, in Phase 1.3) or document a manual
   `pg_dump` cadence. Recommend: switch to remote Supabase for Phase 1.3.

9. **`zod-to-json-schema` package for the agent tool definition.** The
   worked example in Section 3c uses this to convert Zod schemas to
   Claude's tool input schema format. **Confirm willingness to add this
   dependency** or specify an alternative (write JSON schemas by hand).

10. **Dev seed users — auth flow.** Supabase Auth requires real signup or
    admin-API user creation. The seed script needs to create users via
    the Supabase admin API, not via SQL directly (Supabase Auth manages
    its own tables). **Confirm this approach.**

### Section 18b — Architectural Decisions Promoted from Section 17 in v0.5.1

These were defaulted silently in v0.5.0's Section 17. v0.5.1 promotes them
to Open Questions because their defaults are foundational enough that they
should be the founder's call, not mine.

11. **Claude API failure handling UX — what does the user see?**
    My default: chat panel shows an explicit "agent unavailable — retry"
    state with a Retry button; the Mainframe remains fully functional so
    every Phase 1 task can still be completed via the manual path. The
    failure state is a banner, not a modal — it does not block other
    workspace actions. **Confirm or specify alternative.**

12. **Cost budget per agent interaction — what is the ceiling?**
    My default: no hard ceiling in Phase 1.2; measure per-entry cost in
    Phase 1.3 and set a ceiling in Phase 2 informed by real data. Starting
    model: Claude Sonnet for orchestrator, prompt caching on, structured
    responses only. **Confirm "measure first, ceiling later" approach, or
    specify a Phase 1.2 hard ceiling.**

13. **Tool-call validation retry policy — how many retries?**
    My default: bounded retry, **max 2 attempts**, with the validation
    error fed back to Claude as a clarification message. After 2 failures,
    surface a clarification question to the user instead of retrying
    further. **Confirm 2, or specify 1 or 3.**

14. **Streaming vs batch agent responses in Phase 1.2.**
    My default: **batch** in Phase 1.2 (simpler — one round-trip per user
    message; the UI renders the complete response after the agent
    finishes). Phase 2 introduces streaming for UX. **Confirm batch in
    Phase 1.2, or specify streaming from day one.**

15. **AgentSession TTL and cleanup mechanism.**
    My default: **30-day TTL**. Cleanup is a manual SQL script in Phase 1
    (no pg-boss available); Phase 2 promotes it to a scheduled pg-boss
    job. **Confirm 30 days, or specify a different TTL.**

16. **Persona prompt scope for Executive in Phase 1.2.**
    Most CFO functionality (consolidated reporting, runway modeling,
    variance analysis) is Phase 3+. My default: the Executive persona
    exists in Phase 1.2 with a system prompt that says "I can help you
    look at any of your entities' P&L and chart of accounts; consolidated
    views are coming in Phase 3." Tools available: `listChartOfAccounts`,
    `checkPeriod`, and read-only journal entry queries. **No mutating
    tools** for the Executive persona in Phase 1.2 — Executives do not
    post journal entries directly. **Confirm this scope.**

17. **Data export / audit package — when does this become urgent?**
    IFRS and Canadian regulatory compliance both require data portability.
    My default: Phase 1.3 friction journal will tell us when this becomes
    urgent; the Phase 2 brief addresses it formally. The Bible flags it as
    a known long-term requirement. **Confirm "wait for Phase 1.3 to
    inform," or specify that a basic CSV export is required by end of
    Phase 1.2.**

### Section 18c — Architectural Gaps Not Previously Surfaced

18. **CI/CD database target — local Supabase or remote dev project?**
    Question 8 above asks about Phase 1.3 hosting. This question is
    different: it asks where automated tests run during Phase 1.1 and 1.2
    development. Two options:
    - **(a) Local Supabase only** — every developer runs `supabase start`
      and tests run against `localhost`. CI runs `supabase start` in a
      GitHub Actions container. Faster iteration; no remote dependency.
    - **(b) Remote dev project** — a shared Supabase dev project that
      everyone (and CI) connects to. Closer to production; harder to
      iterate fast on schema changes; requires environment isolation.
    My default: **(a) local-only for Phase 1.1, switch to (b) for Phase
    1.3** when real data starts going in. **Confirm or specify alternative.**

19. **Reversal entry mechanism — how is a wrong entry corrected?**
    Section 14 says "corrections are made via reversal entries (which is
    IFRS-correct)" but **the schema and workflow for creating a reversal
    are not specified anywhere**. This is a real Phase 1.1 question because
    the moment a user posts a wrong entry, they need a way to reverse it,
    and reversal is the only legal path (no UPDATE/DELETE on
    `journal_entries`). My proposed Phase 1.1 design:
    - Add nullable column `reverses_journal_entry_id` (UUID FK to
      `journal_entries`, self-referential) on `journal_entries` — cheap
      Category A reservation
    - A reversal entry is a normal journal entry with this column populated
      and `lines` that mirror the original entry with debits and credits
      swapped
    - The UI for "reverse this entry" prefills a new journal entry form
      with the swapped lines and the reverses link populated
    - The deferred constraint validates the reversal the same way as any
      other entry (debit=credit must hold)
    - Phase 1.1 includes this in the schema and the manual path; Phase 1.2
      adds a `reverseJournalEntry` agent tool that does the same thing
      conversationally
    **Confirm this design**, or specify an alternative reversal mechanism.

### Section 18d — Founder Decisions Checklist (One-Page View)

Print this, fill it in, commit it as `docs/decisions/founder-answers-v0.5.1.md`.
Every row must have an explicit answer before the Phase 1.1 brief is written.
"Default" means the row stays silent today; that is not allowed anymore.

| # | Question | Your answer | Impacts |
|---|---|---|---|
| 1 | Which two CoA templates for Phase 1.1? | _______ | Seed data in `001_initial_schema.sql` |
| 2 | Which provinces' tax codes? | _______ | `tax_codes` seed rows |
| 3 | Which org + month for Phase 1.3 close? | _______ | Real-data collection during Phase 1.2 |
| 4 | Supabase region (`ca-central-1`?) + Vercel region | _______ | Data residency; provisioning |
| 5 | Local dev OS (macOS / Linux / Windows) | _______ | Supabase CLI install; line endings |
| 6 | Real-email or test-email accounts for Phase 1.1 users | _______ | Auth flow testing |
| 7 | Source control host (GitHub?) | _______ | CI configuration |
| 8 | Phase 1.3 DB: remote Supabase or local `pg_dump` cadence | _______ | Backup story for real financial data |
| 9 | Add `zod-to-json-schema` dependency? | _______ | Agent tool schema conversion (Section 3c) |
| 10 | Seed users via Supabase admin API? | _______ | Seed script design |
| 11 | Claude API failure UX: banner + Retry? | _______ | Mainframe degradation path |
| 12 | Agent cost ceiling in Phase 1.2: measure-first? | _______ | Cost budget; model choice |
| 13 | Tool-call retry count (1 / 2 / 3) | _______ | Agent orchestrator retry policy |
| 14 | Streaming or batch agent responses in Phase 1.2 | _______ | Agent UI rendering path |
| 15 | AgentSession TTL (default 30 days) | _______ | Session cleanup script |
| 16 | Executive persona scope in Phase 1.2 | _______ | Persona prompts; tool whitelist |
| 17 | Data export / audit package urgency | _______ | Phase 1.2 vs Phase 2 scope |
| 18 | CI/CD DB target (local / remote dev project) | _______ | Test harness; CI config |
| 19 | Reversal entry mechanism (confirm proposed design?) | _______ | `journal_entries` schema field |

**Rule:** no answer is "I'll decide later." Either you pick the value or you
accept my default explicitly. Silent inheritance is what v0.5.1 exists to stop.

---

**Summary of what I need from you to write the Phase 1.1 Execution Brief:**

The Phase 1.1 brief depends on Questions 1, 2, 4, 5, 7, 9, 10, 18, and 19.
The other questions (3, 6, 8, 11–17) can be answered before the Phase 1.2
brief and do not block Phase 1.1.

So the **minimum unblock set** is: 1, 2, 4, 5, 7, 9, 10, 18, 19.

---

## End of Part 1 — Architecture Bible

**Part 1 of PLAN.md ends here.** This is the long-term north star. It is
consulted, not executed. It is updated when major decisions change (next
expected revision is v0.6.0 after Phase 1.3 triage).

**Part 2 — Phase Execution Briefs** is the next deliverable. The Phase 1.1
Execution Brief will be written as Part 2, Section 1 of this same PLAN.md
file. It will include:
- The complete `001_initial_schema.sql` migration
- The complete folder scaffolding command sequence
- The exact `package.json` dependency list with versions
- The three integration test files in full
- The seed script in full
- The exact Supabase CLI commands for local setup
- A day-by-day work breakdown
- The Phase 1.1 exit criteria checklist as an actionable list

The Phase 1.1 brief is written **after** the founder resolves the open
questions in Section 18 above and approves Part 1. The Phase 1.2 brief is
written after Phase 1.1 exit criteria pass. The Phase 1.3 brief and the
Phase 2 brief are written in the same just-in-time order.

---

*End of PLAN.md Part 1 — Architecture Bible v0.5.1*



---

# Part 2 — Phase Execution Briefs

*Each brief is written at the start of that phase, informed by what the
previous phase taught us. Briefs are appended here as phases complete.*

---

> **⚠️ Preamble (added v0.5.2): this brief was drafted against Section 18
> default answers, not founder-confirmed answers.** The Phase 1.1
> Execution Brief below was written before the Founder Decisions
> Checklist (Section 18d) was completed. It silently assumes the
> defaults for the following Section 18 questions: **Q1** (CoA templates:
> `holding_company` + `real_estate`), **Q2** (tax codes: Canadian
> federal GST + Ontario/BC HST), **Q4** (Supabase `ca-central-1` +
> appropriate Vercel region), **Q5** (local OS influences CLI commands),
> **Q7** (source control: GitHub), **Q9** (dependency:
> `zod-to-json-schema` — deferred to Phase 1.2 anyway, flagged for
> awareness), **Q10** (seed users via Supabase admin API), **Q18** (CI/CD
> DB target: local Supabase only for Phase 1.1), and **Q19** (reversal
> entry mechanism: nullable `reverses_journal_entry_id` self-FK on
> `journal_entries`). **Before executing this brief, the founder must
> complete Section 18d.** If any answer deviates from the default above,
> the corresponding portion of this brief is wrong and must be updated
> before the code based on it is written. The assumption points inside
> this brief are annotated inline with `⚠️ Assumes Q# default — founder
> to confirm` markers; every marker is a stop-and-check for Claude Code
> during execution.

---

## Phase 1.1 Execution Brief

> **Active task.** This brief is what Claude Code executes against. The
> Architecture Bible (Part 1) is the *why*; this brief is the *what* and
> *how*. If anything in this brief contradicts Part 1, Part 1 wins and the
> brief is wrong — flag it immediately.

### 1. Goal

**The system has a correctly structured database, multi-org auth, and a
working UI shell — ready to receive the Double Entry Agent in Phase 1.2.**

What "done" means in one paragraph: a developer can run `pnpm dev`, see The
Bridge sign-in screen render in three locales, sign in as one of three seeded
users, switch between two seeded organizations using a role-aware org
switcher, view a Chart of Accounts loaded from an industry template, and the
three Category A integration tests pass. **No agent code exists yet.** The
chat panel renders with an empty state and suggested prompts but does not
call any LLM. The Mainframe rail works as the primary navigation. The
ProposedEntryCard component exists as a typed shell so Phase 1.2 can wire
the agent into a canvas component that already compiles.

---

### 2. Clean Slate Prerequisite

#### 2.0 Package Manager Pinning (v0.5.3, A8) — Do This First

**Before anything else — before deleting any files — pin the package
manager to pnpm.** The existing `package.json` from the earlier
`create-next-app` run uses npm scripts, and the Bible's scripts block
(Section 1b) is pnpm. If the founder runs `npm install` on any step of
this brief, a `package-lock.json` gets regenerated and mixed with the
pnpm workflow, producing silently divergent dependency resolution
across machines.

Run these commands from the repo root, in this exact order:

```bash
# Confirm pnpm is installed and recent enough. Minimum: 9.x.
pnpm --version

# If pnpm is not installed (exit code ≠ 0 above), install via Corepack
# (bundled with Node ≥ 16.10, the Phase 1.1 supported version):
corepack enable
corepack prepare pnpm@latest --activate
pnpm --version   # verify
```

After this step, **never type `npm install` or `npm run` again during
Phase 1.1 or 1.2**. Use `pnpm install` and `pnpm <script>` exclusively.
If the founder sees `package-lock.json` or `yarn.lock` appear in the
repo at any point after this step, something ran a non-pnpm command —
stop, delete the stray lockfile, and re-run `pnpm install`.

> ⚠️ Assumes Q5 default — founder to confirm (Windows / macOS / Linux).
> The `corepack enable` command works on all three, but on Windows the
> first run may require an elevated PowerShell or a Terminal restart.
> If `pnpm --version` still fails after `corepack enable`, consult the
> troubleshooting note at the end of this section.

---

#### 2.1 Clean Slate

**Before any Phase 1.1 work begins, delete the default Next.js scaffold
files.** A `create-next-app` run was performed earlier in this project
producing default boilerplate. Phase 1.1 produces a deliberately structured
codebase that must not inherit those defaults — they will silently shape
later decisions and create folder-conflict surprises.

(Plain English: "boilerplate" means files a code generator creates with
sensible defaults that look fine but bake in choices you might want to make
differently. Deleting them now means Phase 1.1 starts from a known state.)

**Run these commands first, in this exact order, from the repo root:**

```bash
# Confirm you are in the project root before proceeding.
pwd
ls -la

# Delete the default Next.js scaffold.
rm -rf app/
rm -f next.config.ts next.config.js next.config.mjs
rm -f package.json package-lock.json pnpm-lock.yaml
rm -f tsconfig.json
rm -f eslint.config.mjs eslint.config.js .eslintrc.json
rm -f postcss.config.mjs postcss.config.js
rm -rf node_modules/

# Verify clean slate. The output should show only:
# - .git/
# - .gitignore
# - README.md (optional)
# - docs/ (if it already exists from earlier work)
# - CLAUDE.md (if it already exists)
ls -la
```

**STOP and confirm with the user before proceeding** if `ls -la` shows
anything other than the expected files. Do not delete `.git/`. Do not
delete `docs/`. Do not delete `CLAUDE.md`.

After confirmation, proceed to Section 3 (Folder Structure) and create
the Phase 1.1 folder skeleton from scratch.

---

### 3. Folder Structure

The Phase 1.1 folder layout. Create exactly this structure. Every folder
listed has a one-line purpose. Key files are named explicitly.

```
the-bridge/                              # repo root
  src/
    app/                                 # Next.js App Router root
      [locale]/                          # i18n: en, fr-CA, zh-Hant
        layout.tsx                       # locale provider, font, top-level shell
        page.tsx                         # locale root → redirects to sign-in or home
        sign-in/
          page.tsx                       # Supabase Auth sign-in form
        sign-out/
          page.tsx                       # sign-out handler page
        [orgId]/                         # org-scoped routes
          layout.tsx                     # The Bridge split-screen layout shell
          page.tsx                       # org home — empty canvas + chat panel
          accounting/
            chart-of-accounts/
              page.tsx                   # CoA list canvas view (standalone)
            journals/
              page.tsx                   # Journal entry list canvas view (empty in 1.1)
        consolidated/
          dashboard/
            page.tsx                     # stub, role-gated to Executive
      admin/
        orgs/
          page.tsx                       # org creation + CoA template selection
      api/                               # Next.js API routes — thin adapters
        health/
          route.ts                       # GET /api/health → { status: "ok" }
        accounting/
          chart-of-accounts/
            route.ts                     # GET (list)
        org/
          route.ts                       # POST (create org with CoA template)

    services/                            # ALL business logic (Invariant 1)
      auth/
        canUserPerformAction.ts
        getMembership.ts
      accounting/
        chartOfAccountsService.ts        # list, create, loadTemplate
        periodService.ts                 # isOpen() — replaces v0.4.0 Period Agent
        # journalEntryService.ts is created in Phase 1.2, not 1.1
      org/
        orgService.ts                    # createOrg with CoA template loading
        membershipService.ts
      audit/
        recordMutation.ts                # synchronous audit_log writer (Simplification 1)
      middleware/
        withInvariants.ts                # the universal service wrapper
        serviceContext.ts                # ServiceContext type (trace_id, org_id, caller)
      errors/
        ServiceError.ts                  # typed error class for service-layer failures

    db/
      adminClient.ts                     # service-role Supabase client (server-only)
      userClient.ts                      # user-scoped client (RLS-respecting)
      types.ts                           # generated by `pnpm db:generate-types`
      migrations/
        001_initial_schema.sql           # full Phase 1.1 migration (Section 4)
        seed/
          dev.sql                        # idempotent dev seed (Section 5)

    contracts/                           # one folder, no files in Phase 1.1
      .gitkeep                           # contracts file is created in Phase 1.2

    shared/
      env.ts                             # boot-time env var assertion (Section 7)
      logger/
        pino.ts                          # structured logger with redact list (Section 8)
      i18n/
        config.ts                        # next-intl config: en, fr-CA, zh-Hant
        request.ts                       # next-intl request handler
      types/
        userRole.ts                      # 'executive' | 'controller' | 'ap_specialist'
        proposedEntryCard.ts             # full type — used by component shell (Section 9)
        canvasDirective.ts               # discriminated union (Bible Section 4b)

    components/
      bridge/
        SplitScreenLayout.tsx            # the three-zone shell (Mainframe + chat + canvas)
        MainframeRail.tsx                # icon rail with API status dot
        AgentChatPanel.tsx               # empty in 1.1 — renders empty state + suggested prompts
        ContextualCanvas.tsx             # canvas renderer + nav history (back/forward)
        OrgSwitcher.tsx                  # role-aware org switcher
        SuggestedPrompts.tsx             # static persona-aware chips
        ApiStatusDot.tsx                 # green/yellow/red Claude API status indicator
      canvas/
        ChartOfAccountsView.tsx          # standalone canvas view
        JournalEntryListView.tsx         # empty list canvas view
        ComingSoonPlaceholder.tsx        # rendered for Phase 2+ directive types
      ProposedEntryCard.tsx              # typed shell — placeholder render in 1.1

  messages/                              # next-intl translation files
    en.json                              # populated in Phase 1.1
    fr.json                              # placeholder structure, English fallback values
    zh-Hant.json                         # placeholder structure, English fallback values

  tests/
    integration/
      unbalancedJournalEntry.test.ts     # Category A test 1
      lockedPeriodRejection.test.ts      # Category A test 2
      crossOrgRlsIsolation.test.ts       # Category A test 3
    setup/
      testDb.ts                          # local Supabase test harness

  docs/
    decisions/
      README.md                          # ADR template (no ADR files yet)
    troubleshooting/
      rls.md                             # already exists — DO NOT recreate
    friction-journal.md                  # already exists — START USING DAY 1
    prompt-history/
      CHANGELOG.md                       # already exists from Bible work

  postman/
    collection.json                      # health check, org CRUD, CoA CRUD

  supabase/                              # Supabase CLI config
    config.toml

  .env.example                           # every variable documented (Section 7)
  .nvmrc                                 # node version pin
  .gitignore
  next.config.ts                         # next-intl plugin wired
  package.json                           # dependency list (Section 3a)
  tsconfig.json                          # strict mode, path aliases
  vitest.config.ts                       # integration test runner config
  CLAUDE.md                              # session recovery instructions (Section 13)
```

#### 3a. `package.json` Dependencies (Phase 1.1 only)

```json
{
  "name": "the-bridge",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:integration": "vitest run tests/integration",
    "db:start": "supabase start",
    "db:stop": "supabase stop",
    "db:migrate": "supabase db push",
    "db:reset": "supabase db reset",
    "db:generate-types": "supabase gen types typescript --local > src/db/types.ts",
    "db:seed": "psql \"$LOCAL_DATABASE_URL\" -f src/db/migrations/seed/dev.sql"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/ssr": "^0.5.0",
    "next-intl": "^3.20.0",
    "zod": "^3.23.0",
    "pino": "^9.0.0",
    "pino-pretty": "^11.0.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "vitest": "^2.0.0",
    "@vitest/ui": "^2.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0",
    "supabase": "^1.200.0"
  }
}
```

> **Note on versions:** Pin versions when running `pnpm install` based on
> what is current at install time. The numbers above are starting points,
> not strict pins. If a package version is significantly newer at install
> time, use the newer version and note the actual version in
> `docs/friction-journal.md`.

---

### 4. Database Schema

The complete `001_initial_schema.sql` migration. Runnable as a single
file. Place at `src/db/migrations/001_initial_schema.sql`.

**What is included:** all Phase 1.1 tables (Category A only — see Bible
A/B/C section), the deferred constraint for debit=credit, the period lock
trigger, the events append-only trigger, all multi-currency columns on the
four financial tables, the `source` enum, the `autonomy_tier` reservation,
the `routing_path` reservation, the `intercompany_batch_id` reservation,
the `reverses_journal_entry_id` reservation (Open Question 19's proposed
design, pending founder confirmation), RLS enabled on all tenant-scoped
tables, the three explicit RLS policies for `journal_entries`,
`journal_lines`, and `ai_actions`, and seed inserts for two CoA templates
(holding company and real estate).

**What is NOT included:** any GL balance projection tables, any pg-boss
job tables, any Phase 2+ tables. Empty schema reservations are present
where v0.5.1 says they should be (intercompany_relationships table exists
but is empty; events table exists but nothing writes to it).

```sql
-- =============================================================
-- 001_initial_schema.sql
-- The Bridge — Phase 1.1 initial schema
-- =============================================================
-- This file is the single source of truth for the Phase 1.1 schema.
-- Phase 1.1 builds the data model, auth, RLS, and the three Category A
-- integration tests. No agent code, no journal entry posting yet —
-- but all schema reservations are present so Phase 1.2 plugs in
-- mechanically.
-- =============================================================

BEGIN;

-- -----------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------

CREATE TYPE user_role AS ENUM (
  'executive',
  'controller',
  'ap_specialist'
);

CREATE TYPE org_industry AS ENUM (
  'healthcare',
  'real_estate',
  'hospitality',
  'trading',
  'restaurant',
  'holding_company'
);

CREATE TYPE account_type AS ENUM (
  'asset',
  'liability',
  'equity',
  'revenue',
  'expense'
);

-- All three values from day one (Category A reservation).
-- 'manual' is used in Phase 1.1, 'agent' is used in Phase 1.2,
-- 'import' is reserved for Phase 2+. Including all three now means no
-- migration is needed when Phase 1.2 lights up the agent path.
CREATE TYPE journal_entry_source AS ENUM (
  'manual',
  'agent',
  'import'
);

-- Category A reservation — populated empty in Phase 1, used in Phase 2.
CREATE TYPE autonomy_tier AS ENUM (
  'always_confirm',
  'notify_auto',
  'silent'
);

CREATE TYPE ai_action_status AS ENUM (
  'pending',
  'confirmed',
  'rejected',
  'auto_posted'
);

CREATE TYPE confidence_level AS ENUM (
  'high',
  'medium',
  'low',
  'novel'
);

-- -----------------------------------------------------------------
-- ORGANIZATIONS
-- -----------------------------------------------------------------

CREATE TABLE organizations (
  org_id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  legal_name          text,
  industry            org_industry NOT NULL,
  functional_currency char(3) NOT NULL DEFAULT 'CAD',
  fiscal_year_start_month smallint NOT NULL DEFAULT 1
    CHECK (fiscal_year_start_month BETWEEN 1 AND 12),
  created_at          timestamptz NOT NULL DEFAULT now(),
  created_by          uuid REFERENCES auth.users(id)
);

-- -----------------------------------------------------------------
-- MEMBERSHIPS (user ↔ org with role)
-- -----------------------------------------------------------------

CREATE TABLE memberships (
  membership_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id        uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  role          user_role NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, org_id)
);

CREATE INDEX idx_memberships_user_org ON memberships (user_id, org_id);
CREATE INDEX idx_memberships_org ON memberships (org_id);

-- -----------------------------------------------------------------
-- CHART OF ACCOUNTS TEMPLATES (industry seed data)
-- -----------------------------------------------------------------

CREATE TABLE chart_of_accounts_templates (
  template_id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry                 org_industry NOT NULL,
  account_code             text NOT NULL,
  account_name             text NOT NULL,
  account_type             account_type NOT NULL,
  parent_account_code      text,
  is_intercompany_capable  boolean NOT NULL DEFAULT false,
  sort_order               integer NOT NULL DEFAULT 0,
  UNIQUE (industry, account_code)
);

-- -----------------------------------------------------------------
-- CHART OF ACCOUNTS (per org, loaded from a template at org creation)
-- -----------------------------------------------------------------

CREATE TABLE chart_of_accounts (
  account_id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                   uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  account_code             text NOT NULL,
  account_name             text NOT NULL,
  account_type             account_type NOT NULL,
  parent_account_id        uuid REFERENCES chart_of_accounts(account_id),
  is_intercompany_capable  boolean NOT NULL DEFAULT false,
  is_active                boolean NOT NULL DEFAULT true,
  created_at               timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, account_code)
);

CREATE INDEX idx_coa_org ON chart_of_accounts (org_id, account_code);

-- -----------------------------------------------------------------
-- FISCAL PERIODS
-- -----------------------------------------------------------------

CREATE TABLE fiscal_periods (
  period_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id             uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  name               text NOT NULL,
  start_date         date NOT NULL,
  end_date           date NOT NULL,
  is_locked          boolean NOT NULL DEFAULT false,
  locked_at          timestamptz,
  locked_by_user_id  uuid REFERENCES auth.users(id),
  CHECK (end_date >= start_date),
  UNIQUE (org_id, start_date, end_date)
);

CREATE INDEX idx_fiscal_periods_org_dates ON fiscal_periods (org_id, start_date, end_date);

-- -----------------------------------------------------------------
-- INTERCOMPANY RELATIONSHIPS
-- Empty in Phase 1. Schema present so Phase 2 plugs in mechanically.
-- -----------------------------------------------------------------

CREATE TABLE intercompany_relationships (
  relationship_id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_a_id                     uuid NOT NULL REFERENCES organizations(org_id),
  org_b_id                     uuid NOT NULL REFERENCES organizations(org_id),
  org_a_due_to_account_id      uuid REFERENCES chart_of_accounts(account_id),
  org_b_due_from_account_id    uuid REFERENCES chart_of_accounts(account_id),
  created_at                   timestamptz NOT NULL DEFAULT now(),
  CHECK (org_a_id <> org_b_id),
  UNIQUE (org_a_id, org_b_id)
);

COMMENT ON TABLE intercompany_relationships IS
  'Populated in Phase 2 by AP Agent. Do not write to manually.';

-- -----------------------------------------------------------------
-- JOURNAL ENTRIES
-- -----------------------------------------------------------------

CREATE TABLE journal_entries (
  journal_entry_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                    uuid NOT NULL REFERENCES organizations(org_id) ON DELETE RESTRICT,
  fiscal_period_id          uuid NOT NULL REFERENCES fiscal_periods(period_id),
  entry_date                date NOT NULL,
  description               text NOT NULL,
  reference                 text,
  source                    journal_entry_source NOT NULL,
  -- Category A reservation: nullable in Phase 1, populated by Phase 2 AP Agent
  intercompany_batch_id     uuid,
  -- Open Question 19 (pending founder confirmation): self-FK for reversal entries
  reverses_journal_entry_id uuid REFERENCES journal_entries(journal_entry_id),
  idempotency_key           uuid,
  created_at                timestamptz NOT NULL DEFAULT now(),
  created_by                uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_je_org_period ON journal_entries (org_id, fiscal_period_id);
CREATE INDEX idx_je_org_intercompany ON journal_entries (org_id, intercompany_batch_id)
  WHERE intercompany_batch_id IS NOT NULL;
CREATE INDEX idx_je_reverses ON journal_entries (reverses_journal_entry_id)
  WHERE reverses_journal_entry_id IS NOT NULL;

-- -----------------------------------------------------------------
-- JOURNAL LINES
-- Multi-currency columns from day one (Category A — Bible Section 8b).
-- -----------------------------------------------------------------

CREATE TABLE journal_lines (
  journal_line_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id   uuid NOT NULL REFERENCES journal_entries(journal_entry_id) ON DELETE CASCADE,
  account_id         uuid NOT NULL REFERENCES chart_of_accounts(account_id),
  description        text,
  debit_amount       numeric(20,4) NOT NULL DEFAULT 0,
  credit_amount      numeric(20,4) NOT NULL DEFAULT 0,
  tax_code_id        uuid,
  -- Multi-currency reservations
  currency           char(3) NOT NULL DEFAULT 'CAD',
  amount_original    numeric(20,4) NOT NULL DEFAULT 0,
  amount_cad         numeric(20,4) NOT NULL DEFAULT 0,
  fx_rate            numeric(20,8) NOT NULL DEFAULT 1.0,
  CHECK (debit_amount >= 0 AND credit_amount >= 0),
  CHECK ((debit_amount = 0) OR (credit_amount = 0)),
  CHECK (debit_amount > 0 OR credit_amount > 0)
);

CREATE INDEX idx_jl_entry ON journal_lines (journal_entry_id);
CREATE INDEX idx_jl_account ON journal_lines (account_id);

-- -----------------------------------------------------------------
-- DEFERRED CONSTRAINT: debit = credit per journal entry
-- Bible Section 1d. Runs at COMMIT, never per-row.
-- -----------------------------------------------------------------

CREATE OR REPLACE FUNCTION enforce_journal_entry_balance()
RETURNS TRIGGER AS $$
DECLARE
  total_debit numeric(20,4);
  total_credit numeric(20,4);
BEGIN
  SELECT
    COALESCE(SUM(debit_amount), 0),
    COALESCE(SUM(credit_amount), 0)
  INTO total_debit, total_credit
  FROM journal_lines
  WHERE journal_entry_id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);

  IF total_debit <> total_credit THEN
    RAISE EXCEPTION
      'Journal entry % is not balanced: debits=%, credits=%',
      COALESCE(NEW.journal_entry_id, OLD.journal_entry_id), total_debit, total_credit
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_enforce_journal_entry_balance
  AFTER INSERT OR UPDATE OR DELETE ON journal_lines
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION enforce_journal_entry_balance();

-- -----------------------------------------------------------------
-- TRIGGER: period not locked (immediate, per-row)
-- -----------------------------------------------------------------

CREATE OR REPLACE FUNCTION enforce_period_not_locked()
RETURNS TRIGGER AS $$
DECLARE
  v_is_locked boolean;
BEGIN
  SELECT fp.is_locked INTO v_is_locked
  FROM fiscal_periods fp
  JOIN journal_entries je ON je.fiscal_period_id = fp.period_id
  WHERE je.journal_entry_id = NEW.journal_entry_id;

  IF v_is_locked THEN
    RAISE EXCEPTION
      'Cannot post to a locked fiscal period (journal_entry_id=%)',
      NEW.journal_entry_id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_period_not_locked
  BEFORE INSERT OR UPDATE ON journal_lines
  FOR EACH ROW
  EXECUTE FUNCTION enforce_period_not_locked();

-- -----------------------------------------------------------------
-- VENDORS
-- -----------------------------------------------------------------

CREATE TABLE vendors (
  vendor_id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                     uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  name                       text NOT NULL,
  email                      text,
  tax_id                     text,
  default_currency           char(3) NOT NULL DEFAULT 'CAD',
  is_intercompany_entity_id  uuid REFERENCES organizations(org_id),
  is_active                  boolean NOT NULL DEFAULT true,
  created_at                 timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendors_org ON vendors (org_id);

-- -----------------------------------------------------------------
-- VENDOR RULES
-- Empty in Phase 1. autonomy_tier reservation present (Category A).
-- -----------------------------------------------------------------

CREATE TABLE vendor_rules (
  rule_id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  vendor_id           uuid NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  default_account_id  uuid REFERENCES chart_of_accounts(account_id),
  autonomy_tier       autonomy_tier NOT NULL DEFAULT 'always_confirm',
  created_at          timestamptz NOT NULL DEFAULT now(),
  created_by          uuid REFERENCES auth.users(id),
  approved_at         timestamptz,
  approved_by         uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_vendor_rules_org_vendor ON vendor_rules (org_id, vendor_id);

-- -----------------------------------------------------------------
-- CUSTOMERS, INVOICES, BILLS, PAYMENTS, BANK_ACCOUNTS, BANK_TRANSACTIONS
-- Schema present in Phase 1.1 with multi-currency columns.
-- Empty until Phase 2 begins populating.
-- -----------------------------------------------------------------

CREATE TABLE customers (
  customer_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  name         text NOT NULL,
  email        text,
  tax_id       text,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_org ON customers (org_id);

CREATE TABLE invoices (
  invoice_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  customer_id       uuid NOT NULL REFERENCES customers(customer_id),
  invoice_number    text NOT NULL,
  issue_date        date NOT NULL,
  due_date          date,
  status            text NOT NULL DEFAULT 'draft',
  -- Multi-currency columns (Category A — present even though Phase 2+)
  currency          char(3) NOT NULL DEFAULT 'CAD',
  amount_original   numeric(20,4) NOT NULL DEFAULT 0,
  amount_cad        numeric(20,4) NOT NULL DEFAULT 0,
  fx_rate           numeric(20,8) NOT NULL DEFAULT 1.0,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_org_customer ON invoices (org_id, customer_id, status);

CREATE TABLE invoice_lines (
  invoice_line_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id       uuid NOT NULL REFERENCES invoices(invoice_id) ON DELETE CASCADE,
  description      text NOT NULL,
  quantity         numeric(20,4) NOT NULL DEFAULT 1,
  unit_price       numeric(20,4) NOT NULL DEFAULT 0,
  amount_original  numeric(20,4) NOT NULL DEFAULT 0,
  amount_cad       numeric(20,4) NOT NULL DEFAULT 0
);

CREATE TABLE bills (
  bill_id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  vendor_id         uuid NOT NULL REFERENCES vendors(vendor_id),
  bill_number       text,
  issue_date        date NOT NULL,
  due_date          date,
  status            text NOT NULL DEFAULT 'draft',
  -- Multi-currency columns
  currency          char(3) NOT NULL DEFAULT 'CAD',
  amount_original   numeric(20,4) NOT NULL DEFAULT 0,
  amount_cad        numeric(20,4) NOT NULL DEFAULT 0,
  fx_rate           numeric(20,8) NOT NULL DEFAULT 1.0,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_bills_org_vendor ON bills (org_id, vendor_id, status);

CREATE TABLE bill_lines (
  bill_line_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id          uuid NOT NULL REFERENCES bills(bill_id) ON DELETE CASCADE,
  account_id       uuid REFERENCES chart_of_accounts(account_id),
  description      text NOT NULL,
  amount           numeric(20,4) NOT NULL CHECK (amount > 0),
  amount_original  numeric(20,4) NOT NULL DEFAULT 0,
  amount_cad       numeric(20,4) NOT NULL DEFAULT 0
);

CREATE TABLE payments (
  payment_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  payment_date  date NOT NULL,
  amount        numeric(20,4) NOT NULL,
  currency      char(3) NOT NULL DEFAULT 'CAD',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bank_accounts (
  bank_account_id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                    uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  name                      text NOT NULL,
  institution               text,
  account_number_last_four  text,
  currency                  char(3) NOT NULL DEFAULT 'CAD',
  is_active                 boolean NOT NULL DEFAULT true
);

CREATE TABLE bank_transactions (
  bank_transaction_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  bank_account_id      uuid NOT NULL REFERENCES bank_accounts(bank_account_id),
  posted_at            timestamptz NOT NULL,
  description          text,
  -- Multi-currency columns
  currency             char(3) NOT NULL DEFAULT 'CAD',
  amount_original      numeric(20,4) NOT NULL DEFAULT 0,
  amount_cad           numeric(20,4) NOT NULL DEFAULT 0,
  fx_rate              numeric(20,8) NOT NULL DEFAULT 1.0
);

CREATE INDEX idx_bank_tx_org ON bank_transactions (org_id, bank_account_id, posted_at);

-- -----------------------------------------------------------------
-- TAX CODES (GST/HST abstraction — Bible Section 8c)
-- -----------------------------------------------------------------

CREATE TABLE tax_codes (
  tax_code_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid REFERENCES organizations(org_id) ON DELETE CASCADE,
  code            text NOT NULL,
  rate            numeric(6,4) NOT NULL,
  jurisdiction    text NOT NULL,
  effective_from  date NOT NULL,
  effective_to    date,
  CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE INDEX idx_tax_codes_jurisdiction ON tax_codes (jurisdiction, effective_from);

-- -----------------------------------------------------------------
-- AUDIT LOG (Phase 1 — synchronous, Simplification 1)
-- Phase 2 demotes this to a projection of the events table.
-- -----------------------------------------------------------------

CREATE TABLE audit_log (
  audit_log_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  user_id          uuid REFERENCES auth.users(id),
  session_id       uuid,
  trace_id         uuid NOT NULL,
  action           text NOT NULL,
  entity_type      text NOT NULL,
  entity_id        uuid,
  before_state     jsonb,
  after_state_id   uuid,
  tool_name        text,
  idempotency_key  uuid,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_org_trace ON audit_log (org_id, trace_id);
CREATE INDEX idx_audit_org_created ON audit_log (org_id, created_at);

-- -----------------------------------------------------------------
-- AI ACTIONS
-- routing_path is a Category A reservation (Bible Section 15d).
-- Display only in Phase 1; Phase 2 wires routing logic.
-- -----------------------------------------------------------------

CREATE TABLE ai_actions (
  ai_action_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  user_id             uuid REFERENCES auth.users(id),
  session_id          uuid,
  trace_id            uuid NOT NULL,
  tool_name           text NOT NULL,
  prompt              text,
  tool_input          jsonb,
  status              ai_action_status NOT NULL DEFAULT 'pending',
  confidence          confidence_level,
  routing_path        text,
  journal_entry_id    uuid REFERENCES journal_entries(journal_entry_id),
  confirming_user_id  uuid REFERENCES auth.users(id),
  rejection_reason    text,
  idempotency_key     uuid NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  confirmed_at        timestamptz,
  UNIQUE (org_id, idempotency_key)
);

CREATE INDEX idx_ai_actions_org_status ON ai_actions (org_id, status, created_at DESC);

-- -----------------------------------------------------------------
-- AGENT SESSIONS
-- -----------------------------------------------------------------

CREATE TABLE agent_sessions (
  session_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id            uuid NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  locale            text NOT NULL DEFAULT 'en',
  started_at        timestamptz NOT NULL DEFAULT now(),
  last_activity_at  timestamptz NOT NULL DEFAULT now(),
  state             jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_agent_sessions_user_org ON agent_sessions (user_id, org_id);
CREATE INDEX idx_agent_sessions_last_activity ON agent_sessions (last_activity_at);

-- -----------------------------------------------------------------
-- EVENTS TABLE — RESERVED SEAT (Simplification 2)
-- Created with append-only trigger. NOT WRITTEN TO IN PHASE 1.
-- -----------------------------------------------------------------

CREATE TABLE events (
  event_id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type       text NOT NULL,
  org_id           uuid NOT NULL REFERENCES organizations(org_id),
  aggregate_id     uuid NOT NULL,
  aggregate_type   text NOT NULL,
  payload          jsonb NOT NULL,
  occurred_at      timestamptz NOT NULL,
  recorded_at      timestamptz NOT NULL DEFAULT now(),
  trace_id         uuid NOT NULL,
  _event_version   text NOT NULL DEFAULT '1.0.0',
  sequence_number  bigserial NOT NULL
);

CREATE INDEX idx_events_org_aggregate ON events (org_id, aggregate_id, sequence_number);
CREATE INDEX idx_events_trace ON events (trace_id);
CREATE INDEX idx_events_type_recorded ON events (event_type, recorded_at);

COMMENT ON TABLE events IS
  'Reserved seat. Nothing writes here until Phase 2. Append-only trigger installed in Phase 1.1 to make the rule physical from day one.';

-- -----------------------------------------------------------------
-- TRIGGER: events table is append-only (immediate, per-row)
-- -----------------------------------------------------------------

CREATE OR REPLACE FUNCTION reject_events_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'events table is append-only — UPDATE and DELETE are forbidden'
    USING ERRCODE = 'feature_not_supported';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_events_no_update
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION reject_events_mutation();

CREATE TRIGGER trg_events_no_delete
  BEFORE DELETE ON events
  FOR EACH ROW
  EXECUTE FUNCTION reject_events_mutation();

-- -----------------------------------------------------------------
-- ROW LEVEL SECURITY
-- -----------------------------------------------------------------

CREATE OR REPLACE FUNCTION user_has_org_access(target_org_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships
    WHERE user_id = auth.uid() AND org_id = target_org_id
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

ALTER TABLE organizations              ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships                ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_periods             ENABLE ROW LEVEL SECURITY;
ALTER TABLE intercompany_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries            ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines              ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_rules               ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines              ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_lines                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_codes                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_actions                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sessions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE events                     ENABLE ROW LEVEL SECURITY;

-- Default policies for tables not given explicit policies in this brief:
-- "User can SELECT/INSERT/UPDATE rows where their membership grants org access."
-- The three explicit policies below are required by the brief; the rest follow
-- the same pattern and should be added inside this same migration.

-- -----------------------------------------------------------------
-- RLS POLICIES — explicit for journal_entries, journal_lines, ai_actions, invoices
-- -----------------------------------------------------------------

CREATE POLICY journal_entries_select ON journal_entries
  FOR SELECT USING (user_has_org_access(org_id));

CREATE POLICY journal_entries_insert ON journal_entries
  FOR INSERT WITH CHECK (user_has_org_access(org_id));

CREATE POLICY journal_entries_no_update ON journal_entries
  FOR UPDATE USING (false);

CREATE POLICY journal_entries_no_delete ON journal_entries
  FOR DELETE USING (false);

CREATE POLICY journal_lines_select ON journal_lines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM journal_entries je
      WHERE je.journal_entry_id = journal_lines.journal_entry_id
        AND user_has_org_access(je.org_id)
    )
  );

CREATE POLICY journal_lines_insert ON journal_lines
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM journal_entries je
      WHERE je.journal_entry_id = journal_lines.journal_entry_id
        AND user_has_org_access(je.org_id)
    )
  );

CREATE POLICY ai_actions_select ON ai_actions
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM memberships
      WHERE user_id = auth.uid()
        AND org_id = ai_actions.org_id
        AND role = 'controller'
    )
  );

CREATE POLICY ai_actions_insert ON ai_actions
  FOR INSERT WITH CHECK (user_has_org_access(org_id));

CREATE POLICY invoices_select ON invoices
  FOR SELECT USING (user_has_org_access(org_id));

CREATE POLICY invoices_insert ON invoices
  FOR INSERT WITH CHECK (user_has_org_access(org_id));

CREATE POLICY invoices_update ON invoices
  FOR UPDATE USING (user_has_org_access(org_id));

-- (Similar policies for organizations, memberships, chart_of_accounts,
--  vendors, customers, bills, fiscal_periods, audit_log, agent_sessions
--  go here following the same pattern. Omitted from this brief for length.)

-- -----------------------------------------------------------------
-- SEED: Two CoA templates (holding_company + real_estate)
-- The other four industries are added in Phase 1.3 or Phase 2 when needed.
-- -----------------------------------------------------------------

-- HOLDING COMPANY TEMPLATE
INSERT INTO chart_of_accounts_templates (industry, account_code, account_name, account_type, parent_account_code, is_intercompany_capable, sort_order) VALUES
  ('holding_company', '1000', 'Cash and Cash Equivalents',       'asset',     NULL,   false, 10),
  ('holding_company', '1100', 'Investments in Subsidiaries',     'asset',     NULL,   true,  20),
  ('holding_company', '1200', 'Intercompany Receivables',        'asset',     NULL,   true,  30),
  ('holding_company', '1300', 'Other Receivables',               'asset',     NULL,   false, 40),
  ('holding_company', '2000', 'Accounts Payable',                'liability', NULL,   false, 50),
  ('holding_company', '2100', 'Intercompany Payables',           'liability', NULL,   true,  60),
  ('holding_company', '2200', 'Accrued Liabilities',             'liability', NULL,   false, 70),
  ('holding_company', '3000', 'Share Capital',                   'equity',    NULL,   false, 80),
  ('holding_company', '3100', 'Retained Earnings',               'equity',    NULL,   false, 90),
  ('holding_company', '4000', 'Dividend Income',                 'revenue',   NULL,   false, 100),
  ('holding_company', '4100', 'Management Fee Income',           'revenue',   NULL,   true,  110),
  ('holding_company', '4200', 'Interest Income',                 'revenue',   NULL,   false, 120),
  ('holding_company', '5000', 'Professional Fees',               'expense',   NULL,   false, 130),
  ('holding_company', '5100', 'Office Expenses',                 'expense',   NULL,   false, 140),
  ('holding_company', '5200', 'Salaries and Wages',              'expense',   NULL,   false, 150),
  ('holding_company', '5300', 'Interest Expense',                'expense',   NULL,   false, 160);

-- REAL ESTATE TEMPLATE
INSERT INTO chart_of_accounts_templates (industry, account_code, account_name, account_type, parent_account_code, is_intercompany_capable, sort_order) VALUES
  ('real_estate', '1000', 'Cash and Cash Equivalents',           'asset',     NULL,   false, 10),
  ('real_estate', '1100', 'Tenant Receivables',                  'asset',     NULL,   false, 20),
  ('real_estate', '1200', 'Prepaid Property Taxes',              'asset',     NULL,   false, 30),
  ('real_estate', '1300', 'Land',                                'asset',     NULL,   false, 40),
  ('real_estate', '1400', 'Buildings',                           'asset',     NULL,   false, 50),
  ('real_estate', '1410', 'Accumulated Depreciation - Buildings','asset',     '1400', false, 60),
  ('real_estate', '1500', 'Intercompany Receivables',            'asset',     NULL,   true,  70),
  ('real_estate', '2000', 'Accounts Payable',                    'liability', NULL,   false, 80),
  ('real_estate', '2100', 'Mortgages Payable',                   'liability', NULL,   false, 90),
  ('real_estate', '2200', 'Tenant Security Deposits',            'liability', NULL,   false, 100),
  ('real_estate', '2300', 'Intercompany Payables',               'liability', NULL,   true,  110),
  ('real_estate', '3000', 'Owner Capital',                       'equity',    NULL,   false, 120),
  ('real_estate', '3100', 'Retained Earnings',                   'equity',    NULL,   false, 130),
  ('real_estate', '4000', 'Rental Income',                       'revenue',   NULL,   false, 140),
  ('real_estate', '4100', 'Parking Income',                      'revenue',   NULL,   false, 150),
  ('real_estate', '4200', 'Other Property Income',               'revenue',   NULL,   false, 160),
  ('real_estate', '5000', 'Property Management Fees',            'expense',   NULL,   true,  170),
  ('real_estate', '5100', 'Repairs and Maintenance',             'expense',   NULL,   false, 180),
  ('real_estate', '5200', 'Property Taxes',                      'expense',   NULL,   false, 190),
  ('real_estate', '5300', 'Insurance',                           'expense',   NULL,   false, 200),
  ('real_estate', '5400', 'Utilities',                           'expense',   NULL,   false, 210),
  ('real_estate', '5500', 'Mortgage Interest',                   'expense',   NULL,   false, 220),
  ('real_estate', '5600', 'Depreciation - Buildings',            'expense',   NULL,   false, 230);

COMMIT;
```

> **Note on tax_codes seed data:** Open Question 2 asks the founder which
> Canadian provinces' tax rates to seed. Until that is answered, the
> `tax_codes` table is created empty. The Phase 1.1 seed migration will
> add a small follow-up `002_seed_tax_codes.sql` once Q2 is answered.

> **Note on the omitted RLS policies:** The brief includes explicit policies
> for `journal_entries`, `journal_lines`, `ai_actions`, and `invoices` (the
> four required by the prompt). The remaining tenant-scoped tables follow
> the identical pattern (`user_has_org_access(org_id)` for SELECT/INSERT,
> `false` for UPDATE/DELETE on append-only-by-convention tables). Add them
> in the same migration during Phase 1.1 implementation. Do not skip them —
> "RLS enabled" without policies blocks all access by default in Postgres.

---

### 5. Seed Script

`src/db/migrations/seed/dev.sql` — idempotent dev seed that creates the
two real orgs, three real users (one per role), the membership links, and
the CoA loaded from each org's industry template.

**Idempotency strategy:** the script DELETEs the seed orgs by name first
(cascading to memberships, CoA, etc.), then re-creates them. Safe to run
repeatedly. Uses fixed UUIDs for the seed users so the test files can
import them without lookups.

**Important constraint:** Supabase Auth manages its own `auth.users` table
and does not allow direct SQL INSERTs against it. The dev users must be
created via the Supabase admin API (Open Question 10 — pending founder
confirmation; this brief assumes confirmation). The SQL seed script
**assumes the auth users already exist** with the fixed UUIDs below; a
small Node.js bootstrap script (`scripts/seed-auth-users.ts`) creates the
auth users via the admin API before the SQL seed runs.

#### 5a. Auth User Bootstrap (`scripts/seed-auth-users.ts`)

```typescript
// scripts/seed-auth-users.ts
// Creates the three seed dev users via the Supabase admin API.
// Idempotent: deletes the users by ID first if they exist, then recreates.
// Run before db:seed.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('FATAL: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Fixed UUIDs so the SQL seed and the integration tests can reference them.
const SEED_USERS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'executive@thebridge.local',
    password: 'DevSeed!Executive#1',
    role_label: 'executive',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'controller@thebridge.local',
    password: 'DevSeed!Controller#1',
    role_label: 'controller',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'ap@thebridge.local',
    password: 'DevSeed!ApSpec#1',
    role_label: 'ap_specialist',
  },
];

async function main() {
  for (const user of SEED_USERS) {
    // Delete first (idempotent reset)
    await admin.auth.admin.deleteUser(user.id).catch(() => {});

    const { error } = await admin.auth.admin.createUser({
      id: user.id,
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { role_label: user.role_label },
    });

    if (error) {
      console.error(`Failed to create ${user.email}:`, error.message);
      process.exit(1);
    }
    console.log(`Created seed user: ${user.email} (${user.id})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

Add to `package.json` scripts:
```json
"db:seed:auth": "tsx scripts/seed-auth-users.ts",
"db:seed:all": "pnpm db:seed:auth && pnpm db:seed"
```

#### 5b. SQL Seed (`src/db/migrations/seed/dev.sql`)

```sql
-- =============================================================
-- dev.sql — idempotent dev seed
-- Run AFTER scripts/seed-auth-users.ts has created the auth users.
-- =============================================================
-- This script:
--   1. Deletes the two seed orgs by name (cascades to CoA, memberships)
--   2. Creates the two seed orgs (Holding Co + Real Estate Entity)
--   3. Loads the CoA template into chart_of_accounts for each
--   4. Creates memberships linking the three seed users to both orgs
--      with their assigned role
--   5. Creates one open fiscal period per org for the current year
-- Safe to run multiple times.
-- =============================================================

BEGIN;

-- 1. Wipe seed data (cascade handles dependents)
DELETE FROM organizations
WHERE name IN ('Bridge Holding Co (DEV)', 'Bridge Real Estate Entity (DEV)');

-- 2. Create the two orgs with fixed UUIDs
INSERT INTO organizations (org_id, name, legal_name, industry, functional_currency, fiscal_year_start_month) VALUES
  ('11111111-1111-1111-1111-111111111111',
   'Bridge Holding Co (DEV)', 'Bridge Holding Company Inc.', 'holding_company', 'CAD', 1),
  ('22222222-2222-2222-2222-222222222222',
   'Bridge Real Estate Entity (DEV)', 'Bridge Real Estate Holdings Ltd.', 'real_estate', 'CAD', 1);

-- 3. Load CoA from templates into each org
INSERT INTO chart_of_accounts (org_id, account_code, account_name, account_type, is_intercompany_capable)
SELECT
  '11111111-1111-1111-1111-111111111111'::uuid,
  account_code, account_name, account_type, is_intercompany_capable
FROM chart_of_accounts_templates
WHERE industry = 'holding_company';

INSERT INTO chart_of_accounts (org_id, account_code, account_name, account_type, is_intercompany_capable)
SELECT
  '22222222-2222-2222-2222-222222222222'::uuid,
  account_code, account_name, account_type, is_intercompany_capable
FROM chart_of_accounts_templates
WHERE industry = 'real_estate';

-- 4. Memberships
-- Executive: access to BOTH orgs
INSERT INTO memberships (user_id, org_id, role) VALUES
  ('00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'executive'),
  ('00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'executive');

-- Controller: access to BOTH orgs
INSERT INTO memberships (user_id, org_id, role) VALUES
  ('00000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'controller'),
  ('00000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'controller');

-- AP Specialist: access to ONLY the Real Estate org (proves the role-aware switcher)
INSERT INTO memberships (user_id, org_id, role) VALUES
  ('00000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'ap_specialist');

-- 5. One open fiscal period per org (current calendar year)
INSERT INTO fiscal_periods (org_id, name, start_date, end_date, is_locked) VALUES
  ('11111111-1111-1111-1111-111111111111', 'FY Current', date_trunc('year', now())::date, (date_trunc('year', now()) + interval '1 year - 1 day')::date, false),
  ('22222222-2222-2222-2222-222222222222', 'FY Current', date_trunc('year', now())::date, (date_trunc('year', now()) + interval '1 year - 1 day')::date, false);

-- One LOCKED period for the prior year — used by integration test 2
INSERT INTO fiscal_periods (org_id, name, start_date, end_date, is_locked, locked_at) VALUES
  ('22222222-2222-2222-2222-222222222222', 'FY Prior (LOCKED)',
   (date_trunc('year', now()) - interval '1 year')::date,
   (date_trunc('year', now()) - interval '1 day')::date,
   true, now());

COMMIT;
```

**Why the AP Specialist sees only one org:** the Phase 1.1 exit criteria
require proving the role-aware org switcher works. With one user
restricted to a single org, the test is unambiguous: log in as the AP
specialist, the org switcher should show only "Bridge Real Estate Entity
(DEV)" and not the Holding Co.

---

### 6. Three Integration Tests (Category A Floor)

These three tests are non-negotiable. They are the proof that the most
important guarantees in the system actually work end-to-end against a real
Postgres instance — not unit tests with mocked database calls.

(Plain English: an "integration test" runs against a real database. A unit
test runs against fake stand-ins. For accounting correctness, only the
real database can prove the deferred constraint and the RLS policies work.)

#### 6a. Test setup (`tests/setup/testDb.ts`)

```typescript
// tests/setup/testDb.ts
// Provides a fresh Supabase admin client for each test.
// Tests run against the local Supabase instance (`pnpm db:start`).

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY required for integration tests');
}

export function adminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Fixed seed UUIDs (must match dev.sql)
export const SEED = {
  USER_EXECUTIVE:    '00000000-0000-0000-0000-000000000001',
  USER_CONTROLLER:   '00000000-0000-0000-0000-000000000002',
  USER_AP_SPECIALIST:'00000000-0000-0000-0000-000000000003',
  ORG_HOLDING:       '11111111-1111-1111-1111-111111111111',
  ORG_REAL_ESTATE:   '22222222-2222-2222-2222-222222222222',
} as const;

// Helper: create a user-scoped client signed in as a specific seed user.
// Used by Test 3 to verify RLS isolation.
export async function userClientFor(email: string, password: string): Promise<SupabaseClient> {
  const c = createClient(SUPABASE_URL, process.env.SUPABASE_ANON_KEY!);
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return c;
}
```

#### 6b. Test 1: unbalanced journal entry rejected by deferred constraint

`tests/integration/unbalancedJournalEntry.test.ts`

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';

describe('Integration Test 1: deferred constraint rejects unbalanced entry', () => {
  const db = adminClient();

  it('rejects an entry whose debits do not equal credits at COMMIT', async () => {
    // Get any cash account from the holding org
    const { data: cashAcct } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('account_code', '1000')
      .single();

    const { data: feesAcct } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('account_code', '5000')
      .single();

    const { data: period } = await db
      .from('fiscal_periods')
      .select('period_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('is_locked', false)
      .single();

    // Build an UNBALANCED entry: debit 100, credit 90.
    // We use an explicit RPC that wraps INSERT journal_entries +
    // INSERT journal_lines in a single transaction so the deferred
    // constraint fires at COMMIT.
    const { error } = await db.rpc('test_post_unbalanced_entry', {
      p_org_id: SEED.ORG_HOLDING,
      p_period_id: period!.period_id,
      p_debit_account: feesAcct!.account_id,
      p_credit_account: cashAcct!.account_id,
      p_debit_amount: 100,
      p_credit_amount: 90,
    });

    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/not balanced/i);
  });
});
```

The test uses an `rpc` (server-side function) called `test_post_unbalanced_entry`
because the deferred constraint must fire inside a single transaction —
two separate Supabase REST calls would each commit independently and the
constraint would fire on the first one's COMMIT before the second insert
even happens. The function lives in a test-only migration:

```sql
-- tests/setup/test_helpers.sql — applied to local Supabase only
CREATE OR REPLACE FUNCTION test_post_unbalanced_entry(
  p_org_id uuid,
  p_period_id uuid,
  p_debit_account uuid,
  p_credit_account uuid,
  p_debit_amount numeric,
  p_credit_amount numeric
) RETURNS uuid AS $$
DECLARE
  v_entry_id uuid;
BEGIN
  INSERT INTO journal_entries (org_id, fiscal_period_id, entry_date, description, source)
  VALUES (p_org_id, p_period_id, current_date, 'TEST UNBALANCED', 'manual')
  RETURNING journal_entry_id INTO v_entry_id;

  INSERT INTO journal_lines (journal_entry_id, account_id, debit_amount, amount_original, amount_cad)
  VALUES (v_entry_id, p_debit_account, p_debit_amount, p_debit_amount, p_debit_amount);

  INSERT INTO journal_lines (journal_entry_id, account_id, credit_amount, amount_original, amount_cad)
  VALUES (v_entry_id, p_credit_account, p_credit_amount, p_credit_amount, p_credit_amount);

  RETURN v_entry_id;
END;
$$ LANGUAGE plpgsql;
```

#### 6c. Test 2: post to locked fiscal period rejected by trigger

`tests/integration/lockedPeriodRejection.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';

describe('Integration Test 2: locked period trigger rejects writes', () => {
  const db = adminClient();

  it('rejects a journal_lines insert if the fiscal period is locked', async () => {
    // The Real Estate org has a LOCKED prior-year period from the seed.
    const { data: lockedPeriod } = await db
      .from('fiscal_periods')
      .select('period_id')
      .eq('org_id', SEED.ORG_REAL_ESTATE)
      .eq('is_locked', true)
      .single();

    expect(lockedPeriod).not.toBeNull();

    const { data: cashAcct } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_REAL_ESTATE)
      .eq('account_code', '1000')
      .single();

    const { data: rentAcct } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_REAL_ESTATE)
      .eq('account_code', '4000')
      .single();

    // Try to post a balanced entry to the locked period via the test helper.
    const { error } = await db.rpc('test_post_balanced_entry', {
      p_org_id: SEED.ORG_REAL_ESTATE,
      p_period_id: lockedPeriod!.period_id,
      p_debit_account: cashAcct!.account_id,
      p_credit_account: rentAcct!.account_id,
      p_amount: 500,
    });

    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/locked fiscal period/i);
  });
});
```

The companion `test_post_balanced_entry` function follows the same shape
as `test_post_unbalanced_entry` but with equal debit and credit amounts.

#### 6d. Test 3: cross-org RLS isolation

`tests/integration/crossOrgRlsIsolation.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { userClientFor, SEED } from '../setup/testDb';

describe('Integration Test 3: RLS isolates orgs', () => {
  it('AP Specialist user cannot SELECT data from the Holding Co (no membership)', async () => {
    // The AP Specialist seed user has membership only in the Real Estate org.
    const apClient = await userClientFor(
      'ap@thebridge.local',
      'DevSeed!ApSpec#1'
    );

    // Try to read the Holding Co's chart_of_accounts.
    // RLS should return an empty array — no error, no data.
    const { data, error } = await apClient
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING);

    expect(error).toBeNull();
    expect(data).toEqual([]);  // RLS hides the rows entirely

    // Verify the same user CAN see Real Estate data
    const { data: rentData, error: rentError } = await apClient
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_REAL_ESTATE);

    expect(rentError).toBeNull();
    expect(rentData!.length).toBeGreaterThan(0);
  });
});
```

This test is the most important of the three. It proves that even if a
service function had a bug and forgot to filter by `org_id`, RLS would
catch it. **If this test ever regresses, stop everything and find the
cause before merging anything else.**

#### 6e. Vitest config (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup/loadEnv.ts'],
    testTimeout: 15000,
    hookTimeout: 15000,
  },
});
```

`tests/setup/loadEnv.ts` loads `.env.local` so `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_ANON_KEY` are present.

---

### 7. Environment Setup

#### 7a. `.env.example` (committed to repo)

```bash
# .env.example
# Copy to .env.local and fill in real values.
# .env.local is gitignored and never committed.

# -----------------------------------------------------------------
# SUPABASE — required
# -----------------------------------------------------------------
# Project URL. From: Supabase dashboard → Project Settings → API → Project URL
# Or for local dev: `supabase status` after `supabase start`
# Client-safe (NEXT_PUBLIC_ prefix → bundled into the browser)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321

# Public anon key — used for sign-in only. Cannot bypass RLS.
# From: Supabase dashboard → Project Settings → API → Project API keys → anon
# Client-safe (NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Service role key — bypasses RLS. Server-only. NEVER expose to browser.
# From: Supabase dashboard → Project Settings → API → Project API keys → service_role
# CRITICAL: must not have NEXT_PUBLIC_ prefix.
# Boot assertion (src/shared/env.ts) will refuse to start without this.
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Local database connection — used by `pnpm db:seed` only.
# `supabase status` shows this as "DB URL".
LOCAL_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# -----------------------------------------------------------------
# ANTHROPIC — required (Phase 1.1 imports it but does not call it yet)
# -----------------------------------------------------------------
# From: https://console.anthropic.com → API Keys
# Server-only. NEVER expose to browser.
# Boot assertion will refuse to start without this even though Phase 1.1
# does not call the API yet — this enforces the discipline early.
ANTHROPIC_API_KEY=sk-ant-your-key-here

# -----------------------------------------------------------------
# APP CONFIG — required
# -----------------------------------------------------------------
# Used for OAuth redirect URLs and absolute links.
# Client-safe.
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Default locale fallback. One of: en, fr-CA, zh-Hant
NEXT_PUBLIC_DEFAULT_LOCALE=en

# Node environment. Standard values.
NODE_ENV=development

# Logger level. Phase 1.1 default: 'info'. Use 'debug' for verbose dev output.
LOG_LEVEL=info

# -----------------------------------------------------------------
# PHASE 2+ — DO NOT FILL IN PHASE 1.1
# -----------------------------------------------------------------
# FLINKS_CLIENT_ID=
# FLINKS_SECRET=
```

| Variable | Phase | Server-only? | Boot-assertion? | Purpose |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 1.1 | No (client-safe) | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 1.1 | No (client-safe) | Yes | Supabase Auth client sign-in |
| `SUPABASE_SERVICE_ROLE_KEY` | 1.1 | **YES** | **YES** | Bypasses RLS for service layer |
| `LOCAL_DATABASE_URL` | 1.1 | YES | No | psql for `db:seed` |
| `ANTHROPIC_API_KEY` | 1.1 | **YES** | **YES** | Reserved — Phase 1.2 will use it |
| `NEXT_PUBLIC_APP_URL` | 1.1 | No (client-safe) | Yes | OAuth redirects |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | 1.1 | No (client-safe) | Yes | i18n fallback |
| `LOG_LEVEL` | 1.1 | No | No | pino verbosity |
| `FLINKS_*` | 2 | YES | No | Phase 2 only |

#### 7b. Boot Assertion (`src/shared/env.ts`)

```typescript
// src/shared/env.ts
// Boot-time environment variable assertion.
// Imported by next.config.ts so the app refuses to start without
// the critical secrets.

const REQUIRED_SERVER = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY',
] as const;

const REQUIRED_PUBLIC = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_DEFAULT_LOCALE',
] as const;

function assertEnv() {
  const missing: string[] = [];

  for (const key of REQUIRED_SERVER) {
    if (!process.env[key]) missing.push(key);
  }
  for (const key of REQUIRED_PUBLIC) {
    if (!process.env[key]) missing.push(key);
  }

  if (missing.length > 0) {
    const msg = [
      'FATAL: missing required environment variables.',
      'Refusing to start.',
      '',
      'Missing:',
      ...missing.map((k) => `  - ${k}`),
      '',
      'Copy .env.example → .env.local and fill in the values.',
      'See Phase 1.1 Execution Brief Section 7 for details.',
    ].join('\n');
    throw new Error(msg);
  }
}

assertEnv();

// Export typed accessors so the rest of the app reads env via this module
// instead of process.env directly. This makes it impossible to add a new
// env var without updating this file.
export const env = {
  SUPABASE_URL:               process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY:          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  SUPABASE_SERVICE_ROLE_KEY:  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  ANTHROPIC_API_KEY:          process.env.ANTHROPIC_API_KEY!,
  APP_URL:                    process.env.NEXT_PUBLIC_APP_URL!,
  DEFAULT_LOCALE:             process.env.NEXT_PUBLIC_DEFAULT_LOCALE!,
  LOG_LEVEL:                  process.env.LOG_LEVEL ?? 'info',
  NODE_ENV:                   process.env.NODE_ENV ?? 'development',
} as const;
```

In `next.config.ts`:
```typescript
import './src/shared/env'; // boot-time assertion runs as a side effect on import
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/shared/i18n/request.ts');

export default withNextIntl({
  reactStrictMode: true,
});
```

#### 7c. i18n Setup (`next-intl`)

(Plain English: i18n means "internationalization" — the framework that
lets the app render its UI in different languages based on the user's
locale. We configure all three locales in Phase 1.1 even though only
English content is populated, because adding `[locale]` to every URL
later is a per-route refactor.)

`src/shared/i18n/config.ts`:
```typescript
export const LOCALES = ['en', 'fr-CA', 'zh-Hant'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';
```

`src/shared/i18n/request.ts`:
```typescript
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { LOCALES, type Locale } from './config';

export default getRequestConfig(async ({ locale }) => {
  if (!LOCALES.includes(locale as Locale)) notFound();

  return {
    messages: (await import(`../../../messages/${locale}.json`)).default,
  };
});
```

`messages/en.json` (Phase 1.1 — populated):
```json
{
  "auth": {
    "signIn": "Sign in to The Bridge",
    "email": "Email",
    "password": "Password",
    "submit": "Sign in",
    "signOut": "Sign out"
  },
  "nav": {
    "chartOfAccounts": "Chart of Accounts",
    "journalEntries": "Journal Entries",
    "agentUnavailable": "Agent unavailable — use quick navigation"
  },
  "orgSwitcher": {
    "label": "Organization",
    "switchTo": "Switch to {orgName}"
  },
  "agent": {
    "emptyState": "What would you like to do?",
    "suggestedPromptsHeading": "Try one of these"
  }
}
```

`messages/fr.json` and `messages/zh-Hant.json`: same key structure as
`en.json`, with English fallback values for now. The Phase 1.1 exit
criterion is that the sign-in screen renders in all three locales without
crashing — not that the French and Mandarin translations are accurate.
Real translations come in a later phase.

> **Note on locale code:** the `next-intl` config uses `fr-CA` and
> `zh-Hant` as the directory names, but the translation files are
> `fr.json` and `zh-Hant.json` for brevity in the imports. If `next-intl`
> requires the file names to match the locale codes exactly, rename to
> `fr-CA.json` during implementation. Document the choice in
> `docs/friction-journal.md`.

---

### 8. Pino Logger Setup

`src/shared/logger/pino.ts`:

```typescript
// src/shared/logger/pino.ts
// Structured logger with redact list configured at boot.
// Every log line includes trace_id, org_id, user_id when available.

import pino from 'pino';
import { env } from '@/shared/env';

export const logger = pino({
  level: env.LOG_LEVEL,
  base: {
    // Identifies which process emitted the log line.
    service: 'the-bridge',
    env: env.NODE_ENV,
  },
  // Redact list — applied to every log line.
  // Anything matching these paths is replaced with [REDACTED].
  redact: {
    paths: [
      // Auth tokens and headers
      'headers.authorization',
      'headers.cookie',
      'req.headers.authorization',
      'req.headers.cookie',
      // Generic secrets
      '*.password',
      '*.api_key',
      '*.apiKey',
      '*.secret',
      '*.token',
      // Specific env-var leaks
      'env.SUPABASE_SERVICE_ROLE_KEY',
      'env.ANTHROPIC_API_KEY',
      // Financial / PII
      '*.bank_account_number',
      '*.account_number_last_four',
      '*.tax_id',
      '*.sin',
      '*.card_number',
    ],
    censor: '[REDACTED]',
  },
  // Pretty-print in dev only.
  transport: env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});

// Helper: returns a child logger with trace_id / org_id / user_id bound.
// Every service function takes a ServiceContext and creates one of these
// at the start of its execution. See Section 11.
export function loggerWith(ctx: {
  trace_id: string;
  org_id?: string;
  user_id?: string;
}) {
  return logger.child(ctx);
}
```

**Verification (part of Phase 1.1 exit criteria):** intentionally log a
message containing `process.env.SUPABASE_SERVICE_ROLE_KEY` and confirm it
appears as `[REDACTED]` in the output. Add this as a one-shot script:

`scripts/verify-pino-redaction.ts`:
```typescript
import { logger } from '../src/shared/logger/pino';

logger.info({
  test: 'redaction sanity check',
  api_key: 'sk-this-should-be-redacted',
  password: 'this-too',
  headers: {
    authorization: 'Bearer this-too-should-be-redacted',
  },
  safe_field: 'this should appear unredacted',
});
```

Run with `pnpm tsx scripts/verify-pino-redaction.ts`. Expected output
shows `safe_field` in cleartext and the others as `[REDACTED]`.

---

### 9. The Bridge UI Shell (Phase 1.1 — No Agent Yet)

The chat panel renders an empty state with persona-aware suggested
prompts but does **not** call any LLM. The Mainframe rail is the primary
navigation in Phase 1.1. The canvas renderer compiles against the full
`CanvasDirective` discriminated union (Bible Section 4b) — Phase 2+
directive types render the `ComingSoonPlaceholder`.

#### 9a. Three-Zone Split-Screen Layout

`src/components/bridge/SplitScreenLayout.tsx`:

```typescript
// src/components/bridge/SplitScreenLayout.tsx
// The Bridge shell. Three zones:
//   1. Mainframe rail (far left, ~64px, always visible)
//   2. Agent chat panel (~380px, collapsible)
//   3. Contextual canvas (fills remaining width)
//
// In Phase 1.1, the chat panel is empty (no agent). The Mainframe rail
// is the primary navigation. The canvas renders whatever the user
// selected via the Mainframe.

import { ReactNode, useState } from 'react';
import { MainframeRail } from './MainframeRail';
import { AgentChatPanel } from './AgentChatPanel';
import { ContextualCanvas } from './ContextualCanvas';
import { OrgSwitcher } from './OrgSwitcher';
import type { CanvasDirective } from '@/shared/types/canvasDirective';

interface Props {
  orgId: string;
  initialDirective?: CanvasDirective;
}

export function SplitScreenLayout({ orgId, initialDirective }: Props) {
  const [directive, setDirective] = useState<CanvasDirective>(
    initialDirective ?? { type: 'none' }
  );
  const [chatCollapsed, setChatCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-50">
      {/* Top nav strip with org switcher */}
      <div className="absolute top-0 left-0 right-0 h-12 border-b border-neutral-200 bg-white flex items-center px-4 z-10">
        <OrgSwitcher currentOrgId={orgId} />
      </div>

      <div className="flex h-screen w-screen pt-12">
        {/* Zone 1: Mainframe rail */}
        <MainframeRail
          orgId={orgId}
          onNavigate={setDirective}
        />

        {/* Zone 2: Agent chat panel */}
        {!chatCollapsed && (
          <AgentChatPanel
            orgId={orgId}
            onCollapse={() => setChatCollapsed(true)}
          />
        )}

        {/* Zone 3: Contextual canvas */}
        <ContextualCanvas
          directive={directive}
          onDirectiveChange={setDirective}
        />
      </div>
    </div>
  );
}
```

#### 9b. Mainframe Rail with API Status Dot

`src/components/bridge/MainframeRail.tsx`:

```typescript
// src/components/bridge/MainframeRail.tsx
// The far-left icon rail. Always visible. Provides direct-launch
// navigation for the most common canvas views.
//
// Includes the API Status Dot — green/yellow/red indicator of Claude
// API availability. In Phase 1.1, the dot defaults to green because
// we don't actually call the API yet. In Phase 1.2, real status replaces
// the placeholder.

import { ApiStatusDot } from './ApiStatusDot';
import type { CanvasDirective } from '@/shared/types/canvasDirective';
import { useTranslations } from 'next-intl';

interface Props {
  orgId: string;
  onNavigate: (d: CanvasDirective) => void;
}

const ICONS = [
  { id: 'coa',      label: 'Chart of Accounts', icon: '📒' },
  { id: 'journals', label: 'Journal Entries',   icon: '📔' },
  { id: 'pl',       label: 'P&L Report',        icon: '📊' },
  { id: 'actions',  label: 'AI Action Review',  icon: '✅' },
] as const;

export function MainframeRail({ orgId, onNavigate }: Props) {
  const t = useTranslations('nav');

  function handleClick(id: string) {
    switch (id) {
      case 'coa':
        return onNavigate({ type: 'chart_of_accounts', orgId });
      case 'journals':
        return onNavigate({ type: 'journal_entry_list', orgId });
      case 'pl':
        return onNavigate({
          type: 'report_pl',
          orgId,
          from: new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10),
          to: new Date().toISOString().slice(0, 10),
        });
      case 'actions':
        return onNavigate({ type: 'ai_action_review_queue', orgId });
    }
  }

  return (
    <nav className="flex flex-col items-center w-16 border-r border-neutral-200 bg-white py-3 gap-2">
      <div className="text-xs font-bold text-neutral-500 tracking-widest mb-2">
        MAIN
      </div>
      {ICONS.map((item) => (
        <button
          key={item.id}
          onClick={() => handleClick(item.id)}
          title={item.label}
          className="w-10 h-10 rounded-md hover:bg-neutral-100 flex items-center justify-center text-xl"
        >
          {item.icon}
        </button>
      ))}
      <div className="flex-1" />
      {/* API Status Dot at the bottom of the rail */}
      <ApiStatusDot />
    </nav>
  );
}
```

`src/components/bridge/ApiStatusDot.tsx`:

```typescript
// src/components/bridge/ApiStatusDot.tsx
// Green/yellow/red dot showing Claude API availability.
// In Phase 1.1: always green (we don't call the API yet).
// In Phase 1.2: real status from a /api/health/anthropic endpoint.
// When red: Mainframe auto-expands with a banner saying
// "Agent unavailable — use quick navigation."

import { useTranslations } from 'next-intl';

type Status = 'green' | 'yellow' | 'red';

interface Props {
  status?: Status;
}

export function ApiStatusDot({ status = 'green' }: Props) {
  const t = useTranslations('nav');

  const color = {
    green: 'bg-emerald-500',
    yellow: 'bg-amber-400',
    red: 'bg-red-500',
  }[status];

  const title = {
    green: 'Agent ready',
    yellow: 'Agent degraded',
    red: t('agentUnavailable'),
  }[status];

  return (
    <div className="flex flex-col items-center gap-1 mb-2" title={title}>
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <div className="text-[9px] text-neutral-500">API</div>
    </div>
  );
}
```

**The red-state behavior** (auto-expand Mainframe with banner): not
implemented in Phase 1.1 because the dot is always green in 1.1. The
banner copy is in `messages/en.json` under `nav.agentUnavailable` so it
is ready when Phase 1.2 wires real status. Document the wiring as a
Phase 1.2 task in the Phase 1.2 brief.

#### 9c. Contextual Canvas with Independent Navigation History

`src/components/bridge/ContextualCanvas.tsx`:

```typescript
// src/components/bridge/ContextualCanvas.tsx
// The right-pane canvas. Renders whatever directive it was last given.
// Maintains its OWN navigation history (back/forward arrows in the
// canvas header) — completely separate from chat history. This is
// important: the user can drill into a journal entry, then go back,
// then forward, without disturbing the conversation.

import { useState } from 'react';
import type { CanvasDirective } from '@/shared/types/canvasDirective';
import { ChartOfAccountsView } from '@/components/canvas/ChartOfAccountsView';
import { JournalEntryListView } from '@/components/canvas/JournalEntryListView';
import { ComingSoonPlaceholder } from '@/components/canvas/ComingSoonPlaceholder';
import { ProposedEntryCard } from '@/components/ProposedEntryCard';

interface Props {
  directive: CanvasDirective;
  onDirectiveChange: (d: CanvasDirective) => void;
}

export function ContextualCanvas({ directive, onDirectiveChange }: Props) {
  // Independent navigation history for the canvas.
  // This is NOT chat history. The user can navigate forward/back in the
  // canvas without affecting the conversation or scrolling chat.
  const [history, setHistory] = useState<CanvasDirective[]>([directive]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // When a new directive comes in (from chat or Mainframe), push it onto
  // the history stack and trim anything ahead of the current position
  // (standard browser-back-forward semantics).
  function pushDirective(d: CanvasDirective) {
    const newHistory = [...history.slice(0, historyIndex + 1), d];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    onDirectiveChange(d);
  }

  function goBack() {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      onDirectiveChange(history[historyIndex - 1]);
    }
  }

  function goForward() {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      onDirectiveChange(history[historyIndex + 1]);
    }
  }

  // Sync external directive changes into local history
  if (directive !== history[historyIndex]) {
    pushDirective(directive);
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Canvas header with back/forward arrows */}
      <div className="h-10 border-b border-neutral-200 flex items-center px-3 gap-2">
        <button
          onClick={goBack}
          disabled={historyIndex === 0}
          className="px-2 py-1 text-sm rounded hover:bg-neutral-100 disabled:opacity-30"
          aria-label="Canvas back"
        >
          ←
        </button>
        <button
          onClick={goForward}
          disabled={historyIndex >= history.length - 1}
          className="px-2 py-1 text-sm rounded hover:bg-neutral-100 disabled:opacity-30"
          aria-label="Canvas forward"
        >
          →
        </button>
        <div className="text-xs text-neutral-500 ml-2">
          {historyIndex + 1} / {history.length}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {renderDirective(directive)}
      </div>
    </main>
  );
}

function renderDirective(d: CanvasDirective) {
  switch (d.type) {
    case 'chart_of_accounts':
      return <ChartOfAccountsView orgId={d.orgId} />;
    case 'journal_entry_list':
      return <JournalEntryListView orgId={d.orgId} />;
    case 'proposed_entry_card':
      return <ProposedEntryCard card={d.card} />;
    case 'none':
      return (
        <div className="text-neutral-400 text-sm">
          Use the Mainframe rail on the left to choose a view.
        </div>
      );

    // Phase 2+ directive types — render placeholder
    case 'journal_entry':
    case 'journal_entry_form':
    case 'ai_action_review_queue':
    case 'report_pl':
    case 'ap_queue':
    case 'vendor_detail':
    case 'bank_reconciliation':
    case 'ar_aging':
    case 'consolidated_dashboard':
      return <ComingSoonPlaceholder directiveType={d.type} />;
  }
}
```

#### 9d. ProposedEntryCard Component Shell

`src/components/ProposedEntryCard.tsx`:

```typescript
// src/components/ProposedEntryCard.tsx
// Phase 1.1: typed shell with placeholder render.
// Phase 1.2: real implementation with Approve / Reject / Edit buttons.
//
// The reason this component exists in Phase 1.1: the canvas renderer
// must reference the ProposedEntryCard type without errors so the entire
// canvas pipeline compiles end-to-end before Phase 1.2 adds the agent.

import type { ProposedEntryCard as ProposedEntryCardType } from '@/shared/types/proposedEntryCard';

interface Props {
  card: ProposedEntryCardType;
}

export function ProposedEntryCard({ card }: Props) {
  return (
    <div className="rounded-lg border-2 border-dashed border-amber-400 bg-amber-50 p-4 max-w-2xl">
      <div className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">
        Proposed Entry — Phase 1.2 Will Implement This
      </div>
      <div className="text-sm text-neutral-700">
        Org: <span className="font-mono">{card.org_name}</span>
      </div>
      <div className="text-sm text-neutral-700">
        Confidence: <span className="font-mono">{card.confidence}</span>
        {card.routing_path && (
          <span className="ml-2 text-neutral-500">
            (routing: {card.routing_path})
          </span>
        )}
      </div>
      <div className="mt-3 text-xs text-neutral-500">
        This is a placeholder render. The full ProposedEntryCard with
        Approve / Reject / Edit buttons is implemented in Phase 1.2.
      </div>
    </div>
  );
}
```

`src/shared/types/proposedEntryCard.ts`:

```typescript
// src/shared/types/proposedEntryCard.ts
// Full type definition (used by component shell in Phase 1.1).
// The Zod schema that validates this type lives in
// src/shared/schemas/accounting/journalEntry.schema.ts (Phase 1.2).

export type ProposedEntryLine = {
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  currency: string;
};

export type ProposedEntryCard = {
  org_id: string;
  org_name: string;
  transaction_type: 'journal_entry' | 'bill' | 'payment' | 'intercompany';
  vendor_name?: string;
  matched_rule_label?: string;
  lines: ProposedEntryLine[];
  intercompany_flag: boolean;
  reciprocal_entry_preview?: unknown;
  agent_reasoning: string;
  confidence: 'high' | 'medium' | 'low' | 'novel';
  routing_path?: string;          // Category A reservation, display only in Phase 1
  idempotency_key: string;
  dry_run_entry_id: string;
};
```

#### 9e. Agent Chat Panel — Empty State Only

`src/components/bridge/AgentChatPanel.tsx`:

```typescript
// src/components/bridge/AgentChatPanel.tsx
// Phase 1.1: empty state with persona-aware suggested prompts.
// Does NOT call the LLM. Clicking a suggested prompt shows a tooltip
// "Coming in Phase 1.2."
//
// Phase 1.2: full conversation rendering with streaming responses.

import { SuggestedPrompts } from './SuggestedPrompts';
import { useTranslations } from 'next-intl';

interface Props {
  orgId: string;
  onCollapse: () => void;
}

export function AgentChatPanel({ orgId, onCollapse }: Props) {
  const t = useTranslations('agent');

  return (
    <aside className="w-[380px] flex flex-col border-r border-neutral-200 bg-neutral-50">
      <div className="h-10 border-b border-neutral-200 flex items-center justify-between px-3">
        <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
          Agent
        </div>
        <button
          onClick={onCollapse}
          className="text-neutral-400 hover:text-neutral-700 text-sm"
          aria-label="Collapse chat"
        >
          ←
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="text-lg font-medium text-neutral-700 mb-1">
          {t('emptyState')}
        </div>
        <div className="text-xs text-neutral-400 mb-6">
          Phase 1.1 — agent activates in Phase 1.2
        </div>
        <SuggestedPrompts />
      </div>
    </aside>
  );
}
```

`src/components/bridge/SuggestedPrompts.tsx`:

```typescript
// src/components/bridge/SuggestedPrompts.tsx
// Static, persona-aware suggested prompts.
// Phase 1.1: clicking a chip shows "Coming in Phase 1.2" tooltip.
// Phase 1.2: clicking a chip submits the prompt to the orchestrator.

import { useTranslations } from 'next-intl';
import type { UserRole } from '@/shared/types/userRole';

const PROMPTS: Record<UserRole, string[]> = {
  controller: [
    'Show me last month\'s P&L',
    'Make a journal entry',
    'Review pending AI actions',
  ],
  ap_specialist: [
    'Show me the AP queue',          // Phase 2+
    'Process today\'s incoming bills', // Phase 2+
  ],
  executive: [
    'Show consolidated cash position', // Phase 3+
    'What\'s my runway?',              // Phase 3+
  ],
};

interface Props {
  role?: UserRole;
}

export function SuggestedPrompts({ role = 'controller' }: Props) {
  const t = useTranslations('agent');
  const prompts = PROMPTS[role];

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="text-xs text-neutral-500">{t('suggestedPromptsHeading')}</div>
      {prompts.map((p) => (
        <button
          key={p}
          className="text-left text-sm border border-neutral-300 rounded-md px-3 py-2 bg-white hover:bg-neutral-50"
          title="Coming in Phase 1.2"
          onClick={() => alert('Phase 1.2 will wire this to the agent.')}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
```

#### 9f. Org Switcher (Role-Aware)

`src/components/bridge/OrgSwitcher.tsx`:

```typescript
// src/components/bridge/OrgSwitcher.tsx
// Reads the current user's memberships and shows only the orgs they
// have access to. Routes to /[locale]/[orgId]/... when an org is picked.

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/shared/env';
import { useTranslations } from 'next-intl';

interface OrgMembership {
  org_id: string;
  name: string;
  role: 'executive' | 'controller' | 'ap_specialist';
}

interface Props {
  currentOrgId: string;
}

export function OrgSwitcher({ currentOrgId }: Props) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('orgSwitcher');
  const [orgs, setOrgs] = useState<OrgMembership[]>([]);

  useEffect(() => {
    const supabase = createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
    supabase
      .from('memberships')
      .select('org_id, role, organizations(name)')
      .then(({ data }) => {
        if (data) {
          setOrgs(
            data.map((m: any) => ({
              org_id: m.org_id,
              name: m.organizations.name,
              role: m.role,
            }))
          );
        }
      });
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newOrgId = e.target.value;
    router.push(`/${locale}/${newOrgId}`);
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-neutral-500">{t('label')}:</span>
      <select
        value={currentOrgId}
        onChange={handleChange}
        className="border border-neutral-300 rounded px-2 py-1 bg-white"
      >
        {orgs.map((o) => (
          <option key={o.org_id} value={o.org_id}>
            {o.name} ({o.role})
          </option>
        ))}
      </select>
    </label>
  );
}
```

#### 9g. Org Creation with CoA Template Selection

`src/app/[locale]/admin/orgs/page.tsx`:

```typescript
// src/app/[locale]/admin/orgs/page.tsx
// Org creation form. Selects an industry → loads the CoA template
// into chart_of_accounts for the new org.
//
// CRITICAL: this page is what makes Phase 1.1 exit criterion
// "Chart of Accounts loads for each org" pass. Without CoA template
// loading at org creation time, a freshly created org has an empty
// chart_of_accounts and the CoA canvas view shows nothing.

'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

const INDUSTRIES = [
  { value: 'holding_company',  label: 'Holding Company' },
  { value: 'real_estate',      label: 'Real Estate' },
  { value: 'healthcare',       label: 'Healthcare (Phase 2+)', disabled: true },
  { value: 'hospitality',      label: 'Hospitality (Phase 2+)', disabled: true },
  { value: 'trading',          label: 'Trading (Phase 2+)', disabled: true },
  { value: 'restaurant',       label: 'Restaurant (Phase 2+)', disabled: true },
] as const;

export default function OrgCreatePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState<string>('holding_company');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch('/api/org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, industry }),
    });
    setSubmitting(false);
    if (res.ok) {
      const { org_id } = await res.json();
      router.push(`/${locale}/${org_id}`);
    } else {
      alert('Failed to create org. See logs.');
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12 p-6">
      <h1 className="text-xl font-semibold mb-4">Create Organization</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm">Name</span>
          <input
            type="text" required value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full border rounded px-2 py-1"
          />
        </label>
        <label className="block">
          <span className="text-sm">Industry (loads CoA template)</span>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="mt-1 block w-full border rounded px-2 py-1"
          >
            {INDUSTRIES.map((i) => (
              <option key={i.value} value={i.value} disabled={(i as any).disabled}>
                {i.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit" disabled={submitting}
          className="bg-emerald-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {submitting ? 'Creating…' : 'Create org and load CoA'}
        </button>
      </form>
    </div>
  );
}
```

`src/app/api/org/route.ts`:

```typescript
// Thin API route over orgService.createOrgWithTemplate
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withInvariants } from '@/services/middleware/withInvariants';
import { orgService } from '@/services/org/orgService';
import { buildServiceContext } from '@/services/middleware/serviceContext';

const Body = z.object({
  name: z.string().min(1),
  industry: z.enum(['holding_company', 'real_estate', 'healthcare', 'hospitality', 'trading', 'restaurant']),
});

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = Body.parse(json);
  const ctx = await buildServiceContext(req);
  const result = await withInvariants(orgService.createOrgWithTemplate)(parsed, ctx);
  return NextResponse.json(result);
}
```

`src/services/org/orgService.ts` — the function that loads the template:

```typescript
// src/services/org/orgService.ts
import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { loggerWith } from '@/shared/logger/pino';
import { ServiceError } from '@/services/errors/ServiceError';

interface CreateOrgInput {
  name: string;
  industry: 'holding_company' | 'real_estate' | 'healthcare' | 'hospitality' | 'trading' | 'restaurant';
}

export const orgService = {
  async createOrgWithTemplate(input: CreateOrgInput, ctx: ServiceContext) {
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    log.info({ input }, 'Creating org and loading CoA template');

    // 1. Create the org row
    const { data: org, error: orgErr } = await db
      .from('organizations')
      .insert({
        name: input.name,
        industry: input.industry,
        functional_currency: 'CAD',
        created_by: ctx.caller.user_id,
      })
      .select('org_id')
      .single();

    if (orgErr || !org) {
      throw new ServiceError('ORG_CREATE_FAILED', orgErr?.message ?? 'unknown');
    }

    // 2. Load the template into chart_of_accounts for this org
    const { data: tpl, error: tplErr } = await db
      .from('chart_of_accounts_templates')
      .select('account_code, account_name, account_type, is_intercompany_capable')
      .eq('industry', input.industry);

    if (tplErr || !tpl || tpl.length === 0) {
      throw new ServiceError('TEMPLATE_NOT_FOUND', input.industry);
    }

    const coaRows = tpl.map((t) => ({
      org_id: org.org_id,
      account_code: t.account_code,
      account_name: t.account_name,
      account_type: t.account_type,
      is_intercompany_capable: t.is_intercompany_capable,
    }));

    const { error: insertErr } = await db.from('chart_of_accounts').insert(coaRows);
    if (insertErr) {
      throw new ServiceError('COA_LOAD_FAILED', insertErr.message);
    }

    // 3. Auto-create the calling user's membership as 'controller'
    //    (Phase 1.1 simplification — Phase 2 can refine to a proper role-grant flow)
    await db.from('memberships').insert({
      user_id: ctx.caller.user_id,
      org_id: org.org_id,
      role: 'controller',
    });

    log.info({ org_id: org.org_id, accounts_loaded: coaRows.length }, 'Org created');

    return { org_id: org.org_id, accounts_loaded: coaRows.length };
  },
};
```

This service function is **the** answer to the exit criterion "Chart of
Accounts loads for each org." Without it, freshly created orgs have empty
CoAs and the canvas view is blank.

---

### 10. `withInvariants()` Middleware

`src/services/middleware/withInvariants.ts`:

```typescript
// src/services/middleware/withInvariants.ts
// The universal service wrapper. Every service function in src/services/
// is invoked through this. Performs pre-flight checks before the function
// body runs:
//   - ServiceContext is well-formed
//   - trace_id is present
//   - caller identity is verified (not just claimed)
//   - org_id (if present in input) is consistent with caller's memberships
//
// Bible Section 15e ("Layer 2 — Service middleware") and the enforcement
// sentence in the Two Laws restatement reference this file by name.
//
// IMPORTANT: this is enforcement, not convention. Every PR that introduces
// a service function MUST wire it through withInvariants. Code review
// rejects PRs that bypass this wrapper.

import type { ServiceContext } from './serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { loggerWith } from '@/shared/logger/pino';

type ServiceFn<I, O> = (input: I, ctx: ServiceContext) => Promise<O>;

export function withInvariants<I, O>(fn: ServiceFn<I, O>): ServiceFn<I, O> {
  return async (input, ctx) => {
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller?.user_id });

    // Invariant 1: ServiceContext shape
    if (!ctx) {
      throw new ServiceError('MISSING_CONTEXT', 'ServiceContext is required');
    }
    if (!ctx.trace_id) {
      throw new ServiceError('MISSING_TRACE_ID', 'ServiceContext.trace_id is required');
    }
    if (!ctx.caller || !ctx.caller.user_id) {
      throw new ServiceError('MISSING_CALLER', 'ServiceContext.caller.user_id is required');
    }

    // Invariant 2: caller identity is verified, not claimed.
    // ctx.caller.verified must be true — buildServiceContext sets this
    // after validating the Supabase Auth JWT.
    if (!ctx.caller.verified) {
      throw new ServiceError('UNVERIFIED_CALLER', 'Caller identity has not been verified');
    }

    // Invariant 3: org_id consistency.
    // If the input claims an org_id, it must match a membership for the caller.
    // We check this here as defense-in-depth — RLS catches it at the DB level
    // too, but failing fast with a clear error is better than RLS silently
    // returning empty results.
    const claimedOrgId = (input as any)?.org_id;
    if (claimedOrgId && ctx.caller.org_ids && !ctx.caller.org_ids.includes(claimedOrgId)) {
      throw new ServiceError(
        'ORG_ACCESS_DENIED',
        `Caller does not have access to org_id=${claimedOrgId}`
      );
    }

    log.debug({ fn: fn.name }, 'withInvariants: pre-flight passed');

    // Execute the wrapped function
    try {
      const result = await fn(input, ctx);
      return result;
    } catch (err) {
      log.error({ err, fn: fn.name }, 'Service function threw');
      throw err;
    }
  };
}
```

**Application example** (already shown in Section 9g for the org creation
route, repeated here as the canonical template):

```typescript
// src/app/api/org/route.ts
import { withInvariants } from '@/services/middleware/withInvariants';
import { orgService } from '@/services/org/orgService';
import { buildServiceContext } from '@/services/middleware/serviceContext';

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = Body.parse(json);
  const ctx = await buildServiceContext(req);

  // The service function is ALWAYS invoked through withInvariants.
  // Direct calls like `await orgService.createOrgWithTemplate(parsed, ctx)`
  // are forbidden — code review rejects them.
  const result = await withInvariants(orgService.createOrgWithTemplate)(parsed, ctx);

  return NextResponse.json(result);
}
```

`src/services/errors/ServiceError.ts`:

```typescript
// src/services/errors/ServiceError.ts
export class ServiceError extends Error {
  constructor(public code: string, message: string) {
    super(`[${code}] ${message}`);
    this.name = 'ServiceError';
  }
}
```

---

### 11. `ServiceContext` Type

`src/services/middleware/serviceContext.ts`:

```typescript
// src/services/middleware/serviceContext.ts
// The ServiceContext is the envelope every service function receives
// alongside its typed input. It carries:
//   - trace_id (REQUIRED) — propagated from the API route or orchestrator
//   - caller (REQUIRED) — verified user identity + memberships
//   - locale (optional) — for any service that returns user-facing strings
//
// This type matches Bible Section 1c (request lifecycle) and Section 15e
// (service middleware enforcement).

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/shared/env';
import { ServiceError } from '@/services/errors/ServiceError';

export interface VerifiedCaller {
  user_id: string;
  email: string;
  verified: true;        // set ONLY by buildServiceContext after JWT validation
  org_ids: string[];     // memberships, used by withInvariants Invariant 3
}

export interface ServiceContext {
  trace_id: string;       // REQUIRED — UUID generated at the request entry point
  caller: VerifiedCaller; // REQUIRED — never trust claimed identity
  locale?: 'en' | 'fr-CA' | 'zh-Hant';
}

/**
 * Builds a ServiceContext for an incoming Next.js API route request.
 * Validates the Supabase Auth JWT, fetches the caller's memberships,
 * generates a trace_id, and returns a ready-to-use ServiceContext.
 *
 * THIS is the only function in the codebase that creates a verified caller.
 * Tests use a separate helper that bypasses JWT validation but otherwise
 * returns the same shape.
 */
export async function buildServiceContext(req: Request): Promise<ServiceContext> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}, // no-op for API routes
      },
    }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new ServiceError('UNAUTHENTICATED', 'No valid session');
  }

  // Fetch memberships for this user (used by withInvariants Invariant 3)
  const { data: memberships } = await supabase
    .from('memberships')
    .select('org_id')
    .eq('user_id', user.id);

  const trace_id = crypto.randomUUID();

  return {
    trace_id,
    caller: {
      user_id: user.id,
      email: user.email!,
      verified: true,
      org_ids: (memberships ?? []).map((m: any) => m.org_id),
    },
    locale: 'en', // populated from URL in Phase 1.2
  };
}
```

**The `verified: true` literal type is the key** — it cannot be set by
any code path other than `buildServiceContext`, which means a function
that requires `VerifiedCaller` cannot be called with a hand-rolled object
that claims to be verified without actually being verified. TypeScript
enforces this at compile time.

---

### 12. CLAUDE.md Update

Update `CLAUDE.md` at the repo root to reflect that the Phase 1.1
Execution Brief is now the active task. The file is what Claude Code
reads to recover context at the start of every session. It should be
short, concrete, and point at the brief.

```markdown
<!-- CLAUDE.md -->
# The Bridge — Active Session Context

**Current task:** Phase 1.1 Execution Brief (Part 2 of `PLAN.md`).

**What is being built:** the foundation. Database schema, multi-org auth,
RLS, UI shell, three integration tests. **No agent code yet** — the
Double Entry Agent is Phase 1.2.

## Session Recovery Instructions

If you are starting a fresh session and have no context, do this in order:

1. Read `PLAN.md` Part 1 — Section 0 ("Phase 1 Reality vs Long-Term
   Architecture"). It is 8 rows. Read it first. Without it, the rest of
   the document looks like it contradicts itself.
2. Read `PLAN.md` Part 2 — Phase 1.1 Execution Brief. This is the active
   task. Every concrete decision (folder structure, schema, tests, env
   vars) is in there.
3. Check `docs/friction-journal.md` for anything the previous session
   noted as friction. Address it before continuing.
4. Run `pnpm dev` and confirm it starts without errors. If it doesn't,
   stop and fix that first.
5. Run `pnpm test:integration` and confirm the three Category A tests
   pass. If they don't, stop and fix that first.

## Critical Rules

- **No direct database calls outside `src/services/`.** Code review
  rejects any PR that does this. The Two Laws are non-negotiable.
- **Every service function is wrapped in `withInvariants()`.** No
  exceptions, no urgency override.
- **Every mutation has a trace_id.** Generated at the API route entry
  point (`buildServiceContext()`). Propagated through every layer.
- **No agent code in Phase 1.1.** The chat panel exists as an empty
  shell. The orchestrator does not exist yet. Do not add it.
- **The events table is reserved-seat.** It exists with append-only
  trigger. Nothing writes to it in Phase 1. Do not change this.

## What "done" means for Phase 1.1

The Phase 1.1 Exit Criteria Checklist at the end of the brief. Every
checkbox must pass before Phase 1.2 begins. If any checkbox is
ambiguous, ask the founder to clarify — do not interpret.

## Friction journal

Use `docs/friction-journal.md` from day one. Do not wait for Phase 1.3.
Any time something in the brief is wrong, ambiguous, or harder than
expected, write a one-line entry. The friction journal is the most
valuable artifact this project produces.
```

---

### 13. Friction Journal Reference

`docs/friction-journal.md` already exists. **Use it from day one of
Phase 1.1.** Do not wait for Phase 1.3.

The friction journal is a running markdown file with three categories:

```markdown
## Friction Journal

Format: `[date] [category] [one-line description]`

Categories:
- WANT — wanted to do X, couldn't (missing capability)
- CLUNKY — did X, was painful (UX or DX problem)
- WRONG — the spec or the system was wrong about X

Phase 1.1 entries:

[example]
- 2026-04-12 CLUNKY  Supabase CLI on macOS needed `brew upgrade` first; not in brief
- 2026-04-13 WRONG   Section 4 RLS list omits chart_of_accounts policies
- 2026-04-14 WANT    Need a way to delete a test journal entry without restarting Supabase
```

The friction journal entries from Phase 1.1 feed directly into the Phase
1.2 brief as bug-fixes and as scope additions. The friction journal
entries from Phase 1.3 feed the Phase 2 brief.

**Rule:** when an entry is added, do not stop to fix it immediately. Add
the entry, keep building. Triage during the next phase boundary.

---

### 14. Phase 1.1 Exit Criteria Checklist

**Every item must pass before Phase 1.2 begins. No exceptions.**

If any item is ambiguous when you read it, escalate to the founder
before checking the box. A checked box must mean what it says.

#### Setup and structure

- [ ] **Clean slate confirmed** — `app/`, `next.config.ts`, `package.json`,
      `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs` deleted
      before scaffolding began (Section 2)
- [ ] **Folder structure matches Section 3** — every folder listed exists,
      every key file is in the named location
- [ ] **`pnpm install` succeeds** with the dependency list from Section 3a
- [ ] **`pnpm dev` starts cleanly** with zero TypeScript errors and zero
      runtime errors at boot
- [ ] **`pnpm typecheck` passes** with strict mode and no `any` without
      a justification comment
- [ ] **`pnpm build` succeeds** — production build compiles

#### Database

- [ ] **`supabase start` brings up local Postgres + Auth + Studio** without
      errors
- [ ] **`pnpm db:migrate` applies `001_initial_schema.sql` cleanly** — no
      errors, all tables created
- [ ] **`pnpm db:generate-types` produces `src/db/types.ts`** with types
      for every table in the schema
- [ ] **Deferred constraint rejects unbalanced entry** — Integration Test 1
      passes (Section 6b)
- [ ] **Period lock trigger rejects locked-period write** — Integration
      Test 2 passes (Section 6c)
- [ ] **events table append-only trigger verified** — manual verification:
      attempting an `UPDATE events SET ...` or `DELETE FROM events ...`
      from psql throws the append-only error

#### Auth and RLS

- [ ] **`pnpm db:seed:auth` creates the three seed users** via the Supabase
      admin API; each user has the fixed UUID from Section 5a
- [ ] **`pnpm db:seed` creates the two seed orgs, the CoA per org, and the
      memberships** — idempotent (safe to run twice)
- [ ] **Sign-in works for all three seed users** with the seed passwords
- [ ] **Cross-org RLS isolation verified** — Integration Test 3 passes
      (Section 6d): the AP Specialist user cannot SELECT from the
      Holding Co's chart_of_accounts even with admin tooling that bypasses
      the UI
- [ ] **Org switcher shows correct orgs per user role** — sign in as the
      AP Specialist, the org switcher shows ONLY "Bridge Real Estate
      Entity (DEV)"; sign in as the Controller, the switcher shows BOTH
      seed orgs

#### Environment and logging

- [ ] **Boot assertion throws if `SUPABASE_SERVICE_ROLE_KEY` is missing**
      — manually unset the variable, attempt `pnpm dev`, confirm the
      error message names the missing variable
- [ ] **Boot assertion throws if `ANTHROPIC_API_KEY` is missing** — same
      check (even though Phase 1.1 does not call the API, the discipline
      is enforced now)
- [ ] **`pnpm tsx scripts/verify-pino-redaction.ts` shows `[REDACTED]`**
      for `api_key`, `password`, and `headers.authorization`; shows
      `safe_field` in cleartext
- [ ] **Pino logs include `trace_id`, `org_id`, `user_id`** on every line
      emitted by a service function during a real org-creation request

#### i18n

- [ ] **i18n configured** — `next-intl` installed, three locales
      registered (`en`, `fr-CA`, `zh-Hant`), `[locale]` segment in every
      route under `src/app/[locale]/`
- [ ] **Sign-in renders in English, French, and Traditional Mandarin**
      — visit `/en/sign-in`, `/fr-CA/sign-in`, `/zh-Hant/sign-in`; all
      three render without crashing (French and Mandarin show English
      fallback content; the test is that the locale routing works)

#### UI shell

- [ ] **The Bridge split-screen layout renders** — Mainframe rail on the
      left, agent chat panel in the middle, contextual canvas on the right
- [ ] **Mainframe API status dot is visible** at the bottom of the rail
      and shows green (Phase 1.1 default)
- [ ] **Agent chat panel renders empty state with suggested prompts**
      that are persona-aware (different prompts for Controller vs AP
      Specialist vs Executive); clicking a chip shows the
      "Coming in Phase 1.2" tooltip
- [ ] **Canvas navigation back/forward works** — click Mainframe → CoA,
      click Mainframe → Journals, then back → CoA, forward → Journals;
      history is independent of any chat state
- [ ] **ProposedEntryCard component compiles and renders** as a placeholder
      when the canvas receives a `proposed_entry_card` directive
- [ ] **Canvas renderer handles every directive type** in
      `CanvasDirective` discriminated union — Phase 2+ types render the
      `ComingSoonPlaceholder` without crashing

#### Org creation and Chart of Accounts

- [ ] **Org creation flow at `/admin/orgs` works** — submitting the form
      with name "Test Org" and industry "Holding Company" creates the
      org row, loads the CoA template into `chart_of_accounts`, creates
      a controller membership for the current user, and redirects to
      `/[locale]/[new_org_id]`
- [ ] **Org creation flow loads correct CoA template for selected
      industry** — verify by SQL: after creating a holding_company org,
      `SELECT account_code FROM chart_of_accounts WHERE org_id = X`
      returns the 16 holding_company codes from the seed; after creating
      a real_estate org, returns the 23 real_estate codes
- [ ] **Chart of Accounts loads for each org** — the CoA canvas view
      shows the loaded accounts after switching to a new org via the
      org switcher

#### Documentation and discipline

- [ ] **`CLAUDE.md` updated** to reference the Phase 1.1 Execution Brief
      and the session recovery instructions (Section 12)
- [ ] **`docs/troubleshooting/rls.md` exists** and is referenced in
      `CLAUDE.md` — do NOT recreate it; it already exists
- [ ] **`docs/friction-journal.md` exists and has at least one entry**
      from real Phase 1.1 work — proves the discipline is happening, not
      deferred to Phase 1.3
- [ ] **Postman collection v1.1 passes** — health check, org creation,
      chart of accounts list

---

**End of Phase 1.1 Execution Brief.**

The Phase 1.2 Execution Brief is **not** written until every item above
is checked. When you complete the checklist, report to the founder which
items required deviation from the brief (note them in the friction
journal) and what the friction journal taught you. Those notes are the
input to writing the Phase 1.2 brief.

Do not begin Phase 1.2 work until the founder approves the completed
Phase 1.1 checklist and confirms readiness for the next phase.

---
