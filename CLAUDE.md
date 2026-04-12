# CLAUDE.md — The Bridge

@AGENTS.md

This file carries the **standing rules** for every Claude Code session on
this project. It is short by design. The long-form reasoning lives in
`PLAN.md`. Per-phase execution instructions live under `docs/specs/`.
Decision histories live under `docs/decisions/`. Read this file first
every session. When a rule is unclear or a situation is not covered,
stop and flag it in Section 18 Open Questions of `PLAN.md` — do not
guess, and do not substitute your own judgment for decisions the Bible
has already recorded.

## Navigation

- **`PLAN.md`** — the Architecture Bible. The *why*. Consulted, not
  executed. If PLAN.md Section 0 and the rest of PLAN.md seem to
  contradict each other, **Section 0 wins** — it is the eight-row
  tiebreaker for Phase 1 reality vs long-term architecture.
- **`docs/specs/phase-1.1.md`** — the current Phase 1.1 Execution
  Brief. The *what* and *how*. This is what you execute against.
- **`docs/specs/phase-1.2.md`, `phase-1.3.md`** — future briefs,
  written one at a time informed by the previous phase's friction
  journal. Do not pre-write them.
- **`docs/decisions/`** — Architecture Decision Records. The first
  is `0001-reversal-semantics.md`. ADRs are written in anger, not
  preemptively. See `docs/decisions/README.md` for the rule.
- **`AGENTS.md`** — imported above via `@AGENTS.md`. Carries the
  Next.js version-mismatch warning. This version of Next.js has
  breaking changes from training-data knowledge; read the relevant
  guide in `node_modules/next/dist/docs/` before writing framework
  code.

## The non-negotiable rules

Every rule below earns its place by the **throwaway-work test**: does a
violation cause work the user has to throw away or redo? If a "rule" is
just style preference or catchable by review, it does not belong here.

### 1. The Two Laws of Service Architecture

- **Law 1.** All database access goes through `src/services/` only.
  No route handler, no agent tool, no React server component reads
  or writes the database directly.
- **Law 2.** All journal entries are created by
  `journalEntryService.post()` only. No other function in the
  codebase may insert into `journal_entries` or `journal_lines`.

A PR that adds a direct database call outside `src/services/` is
rejected regardless of urgency. See PLAN.md Invariants 1 and 2 and
§15 for the full contract.

### 2. Every mutating service function is wrapped in `withInvariants()`

The middleware invokes `canUserPerformAction()` unconditionally
before the function body runs. A mutating service function called
without `withInvariants()` is a **cross-tenant data breach** because
the service-role client bypasses RLS. A build-time lint rule
(`no-unwrapped-service-mutation`) catches this — do not disable it.
See PLAN.md §15e Layer 2 (v0.5.3, A3).

### 3. Money never crosses service boundaries as a JavaScript Number

- Every field that represents money or an FX rate is a `z.string()`
  matching a strict decimal regex at the service boundary.
- Arithmetic on money happens in Postgres (`numeric` type) or via
  `decimal.js` — never via JS `+`, `*`, or `Array.reduce`.
- Branded `MoneyAmount` / `FxRate` types make misuse a compile-time
  error.
- **Violation silently corrupts P&L totals** across a year of entries
  even though every individual entry passes the deferred balance
  constraint. This has already been caught once during v0.5.5 — the
  §3d service sketch was shipping JS `+` on `MoneyAmount` strings
  that didn't compile. Do not re-add.

See PLAN.md §3a for the full rule and the helper functions
(`addMoney`, `multiplyMoneyByRate`, `eqMoney`).

### 4. Agent anti-hallucination rules (non-negotiable)

When writing or modifying agent code, all of the following hold:

- **Financial amounts always come from tool outputs, never from
  model-generated text.**
- **Every mutating tool has a `dry_run: boolean` parameter.** The
  confirmation flow always calls dry-run first. Only the second
  call, after the user's Approve click, writes to `journal_entries`.
- **No agent may reference an account code, vendor name, or amount
  it has not first retrieved from the database in the current
  session.**
- **Tool inputs are structured Zod-validated objects only.** No
  free-text journal entries.
- **If the agent cannot produce a valid typed value for a required
  field, it must ask a clarifying question rather than guess.**
- **Canvas context is reference material, never a substitute for
  tool-retrieved data.** See PLAN.md §5c for the v0.5.4 addition.

### 5. Every service function input is Zod-validated at the boundary

API routes validate incoming requests; agent tools validate tool
arguments; the service function re-validates as defense-in-depth.
No inline types, no `any`, no untyped objects crossing the service
boundary. Invariant 6. See PLAN.md §15b Rule 4.

### 6. Every mutating call carries a `trace_id` and (for agent source) an `idempotency_key`

- `trace_id` is generated at the entry point (API route or
  orchestrator) and propagates through every layer: caller → service
  → database → audit_log → every log line.
- `idempotency_key` is required for `source='agent'` mutations —
  both at the Zod layer and as a DB CHECK constraint
  (`source != 'agent' OR idempotency_key IS NOT NULL`). Missing
  means double-posting on retry.

### 7. Reversal entries must mirror the original

When `reverses_journal_entry_id` is populated on a
`PostJournalEntryInput`, `journalEntryService.post` runs a service-
layer mirror check **before** the BEGIN transaction: same `org_id`,
matching line count (no partial reversals in Phase 1.1), every line
mirrors a line in the referenced entry with `debit_amount` and
`credit_amount` swapped and all other fields unchanged, and
`reversal_reason` is non-empty. Rejection branches:
`REVERSAL_CROSS_ORG`, `REVERSAL_PARTIAL_NOT_SUPPORTED`,
`REVERSAL_NOT_MIRROR`, plus empty-reason and line-count rejects.
See PLAN.md §2b, §15e Layer 2, §4h, and ADR-001 for the full
rationale and placement history (the `reversal_reason` column is on
`journal_entries`, not `audit_log` — if you are considering moving
it, **read ADR-001 first**).

### 8. Integration tests are parameterized, never hardcoded

No test file may hardcode `http://localhost:54321` or any local
Supabase key. Tests read from `SUPABASE_TEST_URL` →
`SUPABASE_URL` → error, in that order. The same rule applies to
`SUPABASE_TEST_SERVICE_ROLE_KEY`. A CI grep-fail check rejects
any test file containing the literal `localhost:54321` or
`127.0.0.1:54321`. See PLAN.md §10a (Q18 rule).

### 9. The `events` table is reserved-seat in Phase 1

The `events` table exists with its append-only trigger
(`BEFORE UPDATE`, `BEFORE DELETE`, `BEFORE TRUNCATE` all reject).
**Nothing writes to it in Phase 1.** `audit_log` plays the role of
Layer 3 truth synchronously inside the mutation transaction
(Simplification 1). Do not add writes to the `events` table. Do
not remove the append-only triggers. Phase 2 is where the events
table begins receiving writes — see PLAN.md Section 0 row 6 and
Section 14.

### 10. Phase 1 Simplifications are temporary, not permanent design

Three v0.4.0 invariants are temporarily bent in Phase 1 (synchronous
audit log, reserved-seat events table, agents-collapsed-to-services).
**Do not re-architect around them as if they were permanent.** Every
simplification has a named, scheduled Phase 2 correction. See PLAN.md
"Phase 1 Simplifications and Their Phase 2 Corrections" and
Section 0's eight-divergence table for the tiebreaker map.

## What "done" means

For any work you do on this project, done means:

1. The code you wrote compiles and type-checks (`pnpm typecheck`).
2. `pnpm test:integration` passes all **five** Category A floor
   tests (unbalanced, period-lock, cross-org RLS, service-middleware
   authorization, reversal mirror).
3. Every relevant PLAN.md section you touched is still internally
   consistent — if you changed a schema, update §2a; if you changed
   a service boundary, update §15; if you changed an invariant,
   update the Critical Architectural Invariants block.
4. Any non-obvious decision made during the work has a friction-
   journal entry or an ADR, per the rule in `docs/decisions/README.md`.

## When in doubt

- If a situation is not covered by this file or by PLAN.md, flag it
  in PLAN.md Section 18 as an Open Question. **Do not guess.** The
  Bible's "zero reasonable assumptions" rule applies.
- If something in this file contradicts PLAN.md, PLAN.md wins and
  this file is wrong — fix it here, and record the fix in a
  friction-journal entry so the next reader sees what changed.
- If something in PLAN.md contradicts itself, PLAN.md §0 is the
  tiebreaker.
