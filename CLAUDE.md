# CLAUDE.md — The Bridge

@AGENTS.md

This file carries the **standing rules** for every Claude Code session
on this project. It is short by design. The long-form reasoning lives
in the canonical docs under `docs/02_specs/`. ADRs live under
`docs/07_governance/adr/`. Read this file first every session. When
a rule is unclear or a situation is not covered, stop and flag it in
`docs/02_specs/open_questions.md` — do not guess, and do not
substitute your own judgment for decisions the canonical docs have
already recorded.

## Navigation

- **`docs/02_specs/ledger_truth_model.md`** — the rules. 17 Phase
  1.1 invariants with full leaves, Phase 2 evolution notes, and
  interactions. Single source of truth for "what is legal in the
  ledger and who stops what is illegal."
- **`docs/02_specs/data_model.md`** — the schema (table-by-table
  reference).
- **`docs/02_specs/invariants.md`** — the INV-ID rollup index.
  Contributor-facing. The single place to look up "is X already a
  rule, and if so where is it enforced?"
- **`docs/02_specs/glossary.md`** — vocabulary reference. Defines
  terms that have specific meanings in this codebase.
- **`docs/02_specs/open_questions.md`** — unresolved questions and
  formalization candidates. The replacement for what PLAN.md §18
  used to be.
- **`docs/06_audit/control_matrix.md`** — auditor-facing evidence
  table mapping each INV-ID to its tests and code enforcement
  mechanism.
- **`docs/07_governance/adr/`** — Architecture Decision Records.
  ADR-001 (`0001-reversal-semantics.md`) is currently the only one.
  ADRs are written in anger, not preemptively.
- **`docs/07_governance/friction-journal.md`** — the war diary.
  Decisions made with rationale, incidents and their fixes. The
  right home for "why is this thing this way?" questions when the
  answer doesn't yet warrant an ADR.
- **`docs/09_briefs/CURRENT_STATE.md`** — where we are in the
  project.
- **`docs/09_briefs/phase-1.2/obligations.md`** — what Phase 1.2
  inherits from Phase 1.1 closeout.
- **`docs/99_archive/PLAN_v0.5.6.md`** — the archived
  pre-restructure PLAN.md, preserved for historical context. Not
  consulted for current rules.
- **`AGENTS.md`** — imported above via `@AGENTS.md`. Carries the
  Next.js version-mismatch warning. This version of Next.js has
  breaking changes from training-data knowledge; read the relevant
  guide in `node_modules/next/dist/docs/` before writing framework
  code.

## The non-negotiable rules

Every rule below earns its place by the **throwaway-work test**: does
a violation cause work the user has to throw away or redo? If a
"rule" is just style preference or catchable by review, it does not
belong here.

### 1. The Two Laws of Service Architecture

- **Law 1.** All database access goes through `src/services/` only.
  No route handler, no agent tool, no React server component reads
  or writes the database directly.
- **Law 2.** All journal entries are created by
  `journalEntryService.post()` only. No other function in the
  codebase may insert into `journal_entries` or `journal_lines`.

A PR that adds a direct database call outside `src/services/` is
rejected regardless of urgency. See INV-SERVICE-001 and
INV-SERVICE-002 in `docs/02_specs/ledger_truth_model.md` for the
full contract.

### 2. Every mutating service function is wrapped in `withInvariants()`

The middleware invokes `canUserPerformAction()` unconditionally
before the function body runs. A mutating service function called
without `withInvariants()` is a **cross-tenant data breach** because
the service-role client bypasses RLS. A build-time lint rule
(`no-unwrapped-service-mutation`) catches this — do not disable it.
See INV-AUTH-001 and INV-SERVICE-001 in
`docs/02_specs/ledger_truth_model.md`.

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
  service sketch was shipping JS `+` on `MoneyAmount` strings that
  didn't compile. Do not re-add.

See INV-MONEY-001 in `docs/02_specs/ledger_truth_model.md` for the
full rule and the helper functions (`addMoney`,
`multiplyMoneyByRate`, `eqMoney`).

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
  tool-retrieved data.**

### 5. Every service function input is Zod-validated at the boundary

API routes validate incoming requests; agent tools validate tool
arguments; the service function re-validates as defense-in-depth.
No inline types, no `any`, no untyped objects crossing the service
boundary. See the Service Communication Rules section of
`docs/02_specs/ledger_truth_model.md`.

### 6. Every mutating call carries a `trace_id` and (for agent source) an `idempotency_key`

- `trace_id` is generated at the entry point (API route or
  orchestrator) and propagates through every layer: caller → service
  → database → audit_log → every log line.
- `idempotency_key` is required for `source='agent'` mutations —
  both at the Zod layer and as a DB CHECK constraint
  (`source != 'agent' OR idempotency_key IS NOT NULL`). Missing
  means double-posting on retry. See INV-IDEMPOTENCY-001 in
  `docs/02_specs/ledger_truth_model.md`.

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
See INV-REVERSAL-001 (Layer 2 mirror check) and INV-REVERSAL-002
(Layer 1 reason CHECK) in `docs/02_specs/ledger_truth_model.md`,
and `docs/07_governance/adr/0001-reversal-semantics.md` for the
placement history (the `reversal_reason` column is on
`journal_entries`, not `audit_log` — if you are considering moving
it, **read ADR-001 first**).

### 8. Integration tests are parameterized, never hardcoded

No test file may hardcode `http://localhost:54321` or any local
Supabase key. Tests read from `SUPABASE_TEST_URL` →
`SUPABASE_URL` → error, in that order. The same rule applies to
`SUPABASE_TEST_SERVICE_ROLE_KEY`. A CI grep-fail check rejects
any test file containing the literal `localhost:54321` or
`127.0.0.1:54321`. See `docs/04_engineering/testing_strategy.md`.

### 9. The `events` table is reserved-seat in Phase 1

The `events` table exists with its append-only trigger
(`BEFORE UPDATE`, `BEFORE DELETE`, `BEFORE TRUNCATE` all reject).
**Nothing writes to it in Phase 1.** `audit_log` plays the role of
Layer 3 truth synchronously inside the mutation transaction
(Simplification 1). Do not add writes to the `events` table. Do
not remove the append-only triggers. Phase 2 is where the events
table begins receiving writes — see INV-LEDGER-003 in
`docs/02_specs/ledger_truth_model.md` and
`docs/03_architecture/phase_simplifications.md`.

### 10. Phase 1 Simplifications are temporary, not permanent design

Three v0.4.0 invariants are temporarily bent in Phase 1 (synchronous
audit log, reserved-seat events table, agents-collapsed-to-services).
**Do not re-architect around them as if they were permanent.** Every
simplification has a named, scheduled Phase 2 correction. See
`docs/03_architecture/phase_simplifications.md` for the full
simplification table and Phase 2 evolution paths.

## What "done" means

For any work you do on this project, done means:

1. The code you wrote compiles and type-checks (`pnpm typecheck`).
2. `pnpm test:integration` passes all **five** Category A floor
   tests (unbalanced, period-lock, cross-org RLS, service-middleware
   authorization, reversal mirror).
3. Every relevant doc you touched is still internally consistent:
   the leaf in `docs/02_specs/ledger_truth_model.md`, the rollup row
   in `docs/02_specs/invariants.md`, the audit row in
   `docs/06_audit/control_matrix.md` if applicable, and any
   cross-references between them.
4. Any non-obvious decision made during the work has a friction-
   journal entry (`docs/07_governance/friction-journal.md`) or an
   ADR (`docs/07_governance/adr/`), per the rule in
   `docs/07_governance/adr/README.md`.

## When in doubt

- If a situation is not covered by this file or by the canonical
  docs in `docs/02_specs/`, flag it in
  `docs/02_specs/open_questions.md`. **Do not guess.** The "zero
  reasonable assumptions" rule applies.
- If something in this file contradicts the canonical docs in
  `docs/02_specs/` or an ADR in `docs/07_governance/adr/`, the
  canonical doc or ADR wins — this file is wrong and should be
  fixed here, with a friction-journal entry recording the fix so
  the next reader sees what changed.
- Code that deviates from the canonical docs during a session is
  wrong unless an ADR is written to update them first. The ADR
  comes before the code, not after.
- The leaves in `ledger_truth_model.md` and the ADRs in
  `docs/07_governance/adr/` are the tiebreakers for their
  respective domains: leaves win for invariant questions, ADRs
  win for architectural decisions.
- If you knew this project before the April 2026 docs restructure,
  see the friction-journal entry dated 2026-04-14 ("Docs
  restructure completed (commits 3 through 5)") for what moved
  where. PLAN.md is archived at `docs/99_archive/PLAN_v0.5.6.md`
  and is no longer consulted for current rules.
