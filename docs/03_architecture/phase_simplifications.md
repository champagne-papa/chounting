# Phase 1 Reality vs Long-Term Architecture

This is the single most important architectural document in the project.
It explains why Phase 1 looks the way it does — where it diverges from
the long-term v0.4.0 design, why each divergence exists, and exactly
how Phase 2 corrects it.

If two documents seem to contradict each other about how the system
works, this document resolves it. The Phase 1 column is what we build
first. The Phase 2 column is where we end up.

Source: extracted from PLAN.md §0, "Phase 1 Simplifications and Their
Phase 2 Corrections," §14, and §15f during Phase 1.1 closeout
restructure.

---

## The Eight Divergences

Eight architectural decisions made in v0.4.0 are temporarily different
in Phase 1. Three of them (audit log, events table, agents→services)
are documented in detail in the Simplifications section below. The
other five are deferrals of v0.4.0 infrastructure choices whose
Phase 2 path is mechanical (move folders, install packages, split
processes).

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

**The eight in one sentence:** Phase 1 is a single Next.js app with
services instead of agents, one contract file instead of a three-
namespace package, a synchronously-written audit log instead of an
event-projection system, and a deferred constraint instead of
"deferred constraint or trigger" — and every one of those
simplifications has a named, scheduled Phase 2 correction.

**If anything in the rest of the documentation seems to contradict
the Phase 1 plan, this table is the tiebreaker.** The Phase 1 column
is what we build first. The Phase 2 column is where we end up. The
v0.4.0 column is the design both columns are reaching for.

---

## Phase 1 Simplifications and Their Phase 2 Corrections

Three of the eight divergences are documented in detail here because
their Phase 2 correction is non-trivial. Each names the invariant it
temporarily violates, explains why the violation is acceptable in
Phase 1, specifies the concrete correction path, and gives a Phase 2
acceptance criterion.

These simplifications are not the permanent design. They are a
deliberate, time-limited concession to ship Phase 1. The Phase 2
corrections are not optional improvements — they are scheduled, named,
and tracked.

### Simplification 1 — Audit log written synchronously inside the transaction

**What Phase 1 does:** The `audit_log` row is written by the same
service function that writes the mutation, inside the same Postgres
transaction. If the mutation rolls back, the audit row rolls back
with it. There is no post-commit job, no projection layer, no pg-boss
worker, no separate Audit Agent. The function call looks roughly like
this:

```typescript
await db.transaction(async (tx) => {
  await tx.insert('journal_entries', entry);
  await tx.insert('journal_lines', lines);
  await tx.insert('audit_log', auditRow);  // synchronous, same transaction
});
```

**Invariant temporarily violated:** Invariant 5 (Event Stream as
Single Source of Truth — see `docs/02_specs/ledger_truth_model.md`).
In the permanent design, `audit_log` is a projection of events,
updated asynchronously after commit by a job triggered from a
committed event. In Phase 1, `audit_log` is the primary record, and
the events table is not written to at all.

**Why we accept this in Phase 1:** A solo non-developer founder
running pg-boss in a single Next.js Vercel deployment is operationally
complex. Vercel serverless functions are not a good home for long-
running workers. Adding pg-boss in Phase 1 means either running a
separate worker process (reintroducing the operational burden the
monorepo deferral was supposed to remove) or accepting unreliable job
execution. Neither is acceptable. The simpler synchronous path is
correct for ~100 users on Phase 1 traffic.

**Phase 2 correction (concrete):**
1. Provision a long-lived worker host (Railway, Fly.io, or Render) —
   the same host that will run the separate Express backend after the
   monorepo split.
2. Install pg-boss against the existing Supabase Postgres database.
3. The `journalEntryService.post()` function changes: instead of
   writing `audit_log` directly inside the transaction, it writes a
   row to the `events` table inside the same transaction (the events
   table append-only trigger has been in place since Phase 1.1, so
   this is mechanical).
4. A pg-boss job subscribes to `JournalEntryPostedEvent` and writes
   the `audit_log` projection asynchronously after commit.
5. A backfill script replays every Phase 1 `audit_log` row into the
   events table so the historical record is reconstructed correctly.
   This script is written and tested before Phase 2 ships, not after.
   **The backfill script must be pure `INSERT`** — no
   `ON CONFLICT DO UPDATE`, no `UPSERT`, no `MERGE`. The events
   table's append-only triggers reject any statement that touches an
   existing row. The correct idempotency pattern is: generate a
   deterministic `event_id` from (`aggregate_id`, `sequence_number`,
   `event_type`), and rely on a pre-check (`SELECT 1 FROM events
   WHERE event_id = $1`) to skip already-backfilled rows before
   INSERT. Tested against a Phase 1 audit_log snapshot in a scratch
   DB before Phase 2 shipping.

**Phase 2 acceptance criterion:** Querying `events` for any historical
`JournalEntryPostedEvent` returns the same data that exists in
`audit_log`, and a fresh `audit_log` rebuild from events produces a
byte-identical result.

### Simplification 2 — Events table reserved-seat (created, not written)

**What Phase 1 does:** The `events` table is created in the Phase 1.1
initial SQL migration with all columns the permanent design needs
(`event_id`, `event_type`, `org_id`, `aggregate_id`,
`aggregate_type`, `payload jsonb`, `occurred_at`, `recorded_at`,
`trace_id`, `_event_version`, sequence column). The append-only
Postgres trigger that rejects any UPDATE, DELETE, or TRUNCATE on the
table is installed and tested. **Nothing writes to it.** No service
function inserts events. No projection reads from it. It is a
reserved seat at the table.

**Invariant temporarily violated:** Invariant 5 (the events table is
the single source of truth). In Phase 1, `audit_log` plays that role,
written synchronously per Simplification 1.

**Why we accept this in Phase 1:** The retrofit cost of adding an
events table to a populated production database with real financial
history is high and risky. The cost of creating an empty table with
the right schema and trigger now is one SQL migration. We pay the
small cost now to avoid the large cost later. We do not write to it
now because writing to it requires the projection infrastructure
(Simplification 1), which Phase 1 cannot operate.

**Phase 2 correction (concrete):**
1. Phase 2 ships with `journalEntryService.post()` writing
   `JournalEntryPostedEvent` to the events table inside the same
   transaction as the mutation.
2. Every other mutating service function adds an event write the same
   way.
3. The pg-boss projection job (Simplification 1) reads from the
   events table to update `audit_log` and any other projections.
4. The backfill script from Simplification 1 populates the events
   table with reconstructed events from the Phase 1 `audit_log`
   history.

**Phase 2 acceptance criterion:** A SELECT against the events table
returns at least one row per Phase 2 journal entry mutation, and the
historical backfill rows are present and correctly typed.

### Simplification 3 — Layer 1 and Layer 2 "agents" collapsed to service functions

**What Phase 1 does:** The v0.4.0 design specified six named agents
across two layers: Auth Agent, Database Agent, and Audit Agent
(Layer 1 Foundation), plus Double Entry Agent, Chart of Accounts
Agent, and Period Agent (Layer 2 Domain). v0.5.0 replaces them in
Phase 1 with plain TypeScript service functions in `src/services/`:

| v0.4.0 Agent | v0.5.0 Phase 1 equivalent |
|---|---|
| Auth Agent | `src/services/auth/canUserPerformAction()` |
| Database Agent | `src/services/` itself — there is no separate abstraction |
| Audit Agent | `src/services/audit/recordMutation()` called inline (Simplification 1) |
| Double Entry Agent | `src/services/accounting/journalEntryService.post()` |
| Chart of Accounts Agent | `src/services/accounting/chartOfAccountsService` |
| Period Agent | `src/services/accounting/periodService.isOpen()` |

The single agent that exists in Phase 1.2 is the **Double Entry
Agent** — which is the Claude tool definition that wraps
`journalEntryService.post()`. That is the entire agent surface area
in Phase 1. Every other piece of "agent" architecture from v0.4.0 is
a service function.

**Invariant temporarily violated:** None directly. The Two Laws hold
verbatim in their v0.5.0 service-layer restatement (see
`docs/02_specs/ledger_truth_model.md` INV-SERVICE-001 and
INV-SERVICE-002). The Four-Layer Truth Hierarchy still applies —
Layer 4 (Cognitive) just has fewer occupants in Phase 1.

**Why we accept this in Phase 1:** Building six named agents with
input/output contracts, system prompts, and orchestration before any
of them have been exercised against real workflows is premature
design. You cannot generalize the right shape for an agent class
until you have at least two real agents solving real problems.
Phase 1 builds one (Double Entry) and proves it works. Phase 2
builds the second (AP) and learns from the comparison what the
actual shared abstractions need to be.

**Phase 2 correction (concrete):**
1. When the AP Agent is built, it will reveal the shared
   infrastructure both agents need (system prompt loading, tool
   definition format, dry-run handling, idempotency check, trace
   propagation, error envelopes).
2. Extract that shared infrastructure into `packages/agent/` as part
   of the Phase 2 monorepo split.
3. Reintroduce the Layer 1 / Layer 2 / Layer 3 folder structure
   inside `packages/agent/` at that point — informed by what AP
   actually needed, not by what v0.4.0 guessed it would need.
4. The service functions do not move. They stay in
   `packages/services/` as the inner ring. The agent classes wrap
   them as the outer ring.

**Phase 2 acceptance criterion:** A new workflow agent (e.g., AR
Agent in Phase 3) can be added by writing only its system prompt, its
tool definitions, and any new service functions it needs. No edits
required to existing agents or to the agent infrastructure.

### What is NOT simplified

For the avoidance of doubt, these v0.4.0 commitments are unchanged
in v0.5.0 and apply to Phase 1 in full:

- Multi-org from day one with `org_id` on every tenant-scoped table
- Multi-user with the three personas and `memberships` table from
  day one
- RLS policies on every tenant-scoped table from day one
- The `events` table created with append-only trigger from day one
  (just not written)
- Idempotency keys on every mutating operation from day one
- Trace IDs propagated from the orchestrator through every layer
  from day one
- IFRS Chart of Accounts structure from day one
- Multi-currency columns on every financial table from day one
- Canadian tax codes table from day one
- Intercompany relationships table from day one (empty, but schema
  correct)
- The Bridge UI split-screen shell with Mainframe rail from day one
- Industry CoA templates seeded for the orgs the founder will
  actually use
- i18n URL structure `/[locale]/[orgId]/...` from day one
- The Two Laws (in v0.5.0 service-layer form) from day one
- The Four-Layer Truth Hierarchy from day one
- Pre-commit invariant validation via `withInvariants()` middleware
  from day one
- All Zod validation at every service boundary from day one
- The deferred constraint for debit=credit from day one (see
  `docs/02_specs/ledger_truth_model.md` INV-LEDGER-001)

---

## Event Sourcing vs CRUD + Audit (Resolved Decision)

This section is a decision log, not an open question.

**The question that was open in v0.4.0:** Should the accounting
ledger be event-sourced (append-only events projected into balances)
or traditional CRUD with an audit table?

**v0.5.0 resolution:**

**Phase 1: traditional CRUD with a strong audit table.**
`journal_entries` + `journal_lines` are append-only by convention
(no UPDATE or DELETE — RLS policies enforce this; corrections are
made via reversal entries, which is IFRS-correct). The `audit_log`
table captures every write, written synchronously inside the same
transaction (Simplification 1). The `events` table exists with
append-only trigger but is not written to (Simplification 2).

**Phase 2: hybrid migration.** The events table begins receiving
writes. The `audit_log` becomes a projection of events updated by
pg-boss post-commit. Both run in parallel; the historical
`audit_log` rows are backfilled into the events table by a one-time
script.

**Phase 3+: full event sourcing as the source of truth** if query
patterns demand it. This is a deliberate decision to make later when
there is real data about query patterns, not a guess made now.

**Why not full event sourcing in Phase 1?** Operational complexity
for a solo non-developer. Projection management, snapshotting, and
replay infrastructure are not justifiable for ~100 users on Phase 1
traffic. The schema reservations (events table, append-only trigger)
make the Phase 2 migration mechanical. The Phase 1 audit_log is the
right answer right now.

---

## Mutation Ordering — Phase 1 and Phase 2 Side by Side

The ordering of operations inside a mutating service call is the same
shape in Phase 1 and Phase 2. The differences are localized to three
steps and are called out below the diagrams. Read them side by side;
the diff is what matters.

**Phase 1 ordering** (current — uses synchronous audit log per
Simplification 1, events table not written per Simplification 2):

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

**Phase 2 ordering** (target — Simplifications 1 and 2 corrected;
pg-boss installed; events table receives writes; audit_log becomes a
projection):

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

**Atomicity guarantee in both phases:** Steps 1-12 are atomic. If any
step in 1-12 fails, the entire transaction rolls back and nothing was
written. The deferred constraint runs at step 12 (COMMIT) and rolls
back the entire transaction if debits != credits, regardless of which
steps succeeded earlier.

**The Phase 2 reliability rule:** Steps 14-16 happen after commit and
are retried on failure by pg-boss. If a projection write fails, the
event is still in the events table (Layer 1 truth — Invariant 3, see
`docs/02_specs/ledger_truth_model.md`) and can be replayed. The
projection eventually catches up. This is why the events table must
be the source of truth in Phase 2 — projections can lag, but they
cannot disagree with events for long, and they can always be rebuilt
from events.

**The Phase 1 reliability rule:** Because there are no async steps,
there is no eventual consistency to manage. The cost is
Simplification 1 — the audit log is the primary record instead of a
projection. The benefit is that there is exactly one place a journal
entry can exist after a successful POST: the database, in a fully
consistent state. No worker process to fail, no jobs to retry, no
projections to lag. This is the right trade-off for Phase 1 traffic
and a solo founder operating the system.
