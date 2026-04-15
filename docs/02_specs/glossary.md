# Glossary

Vocabulary reference for The Bridge codebase. The single place to
look up what a term means in this project.

This file defines terms *that have specific meanings in this
codebase*. It does not redefine generic accounting terms (debit,
credit, general ledger — those are GAAP/IFRS standard) or generic
software terms (RLS, type system, SECURITY DEFINER — those are
Postgres/TypeScript standard). When the codebase uses a generic
term in a project-specific way, the project-specific meaning is
the entry.

For the rules these terms participate in, see
`docs/02_specs/ledger_truth_model.md`. For the schema shape, see
`docs/02_specs/data_model.md`. For the INV-ID index, see
`docs/02_specs/invariants.md`.

## Index

[A](#a) · [B](#b) · [C](#c) · [D](#d) · [F](#f) · [I](#i) · [J](#j) · [L](#l) · [M](#m) · [P](#p) · [R](#r) · [S](#s) · [T](#t) · [U](#u) · [V](#v) · [W](#w)

---

## A

**ADR (Architecture Decision Record).** A document capturing a
single architectural decision with its alternatives, the chosen
path, and the reasoning. Lives under
`docs/07_governance/adr/`. Written *in anger* — when a real
tradeoff is being made — not preemptively. ADR-001
(reversal semantics) is currently the only ADR.

**adminClient.** The Supabase service-role client, defined at
`src/db/adminClient.ts`. Bypasses RLS and is the only DB client
used by the service layer (INV-SERVICE-002). Pairs with
[userClient](#u) which is for paths where RLS enforcement is
desired.

**Audit log.** The `audit_log` table — a generic mutation log
written synchronously inside the same transaction as the
mutation it records (Phase 1.1 Simplification 1). Distinct from
[audit trail](#a). See
[INV-AUDIT-001](ledger_truth_model.md#inv-audit-001--every-mutating-service-call-writes-an-audit_log-row-in-the-same-transaction).

**Audit trail.** The broader concept that includes
`journal_entries` columns (like `reversal_reason`) alongside
`audit_log` rows. The audit trail tells the full story of a
ledger event; the [audit log](#a) is one row per mutation. The
distinction is load-bearing: ADR-001 placed `reversal_reason` on
`journal_entries` rather than `audit_log` because the reason is
a property of the reversal entry itself, not of the mutation
that created it. See
`docs/07_governance/adr/0001-reversal-semantics.md`.

**Authority Gradient.** *Agents propose, services decide, the
database enforces.* The permanent contract between the three
actors in the system. Authority flows down; structured errors
flow up. Does not change across phases. See the Authority
Gradient section in `ledger_truth_model.md`.

## B

**Bidirectional reachability.** The verification that every
INV-ID documented in `ledger_truth_model.md` has at least one
annotation site in code (`src/` + `supabase/migrations/`), and
every INV-ID annotated in code has a corresponding leaf in the
doc. As of commit `65bcfe0`: 17/17 with empty symmetric diff.
See `invariants.md` for the verification command.

**Bridge UI pattern.** The persistent split-screen layout: AI
agent chat on the left, a live [ContextualCanvas](#c) on the
right. When the agent references an invoice, P&L, or vendor
record, it renders immediately in the canvas. The user never
scrolls back through chat history to find a table or graph.

## C

**Category A / B / C.** Scope-discipline categorization for
features and tests. Category A is the floor — required for
phase exit, no exceptions. Category B is "ship if cheap." Category
C is deferred. The five Category A floor integration tests are
the mechanical proof that the load-bearing invariants hold.

**Confirmation-first model.** Every AI-initiated financial
write produces a structured [ProposedEntryCard](#p) before
anything touches the ledger. The user reviews and clicks
Approve; only then does the service execute. The model is what
makes [Layer 4](#l) able to have no enforcement invariants
safely — agents can be wrong because lower layers catch the
mistake before it commits.

**ContextualCanvas.** The right-hand pane of the
[Bridge UI pattern](#b). Stateful — drill-downs happen inside
it without leaving the conversation. Implemented as
`ContextualCanvas` in
`src/components/canvas/ContextualCanvas.tsx`.

## D

**Deferred constraint.** A Postgres CONSTRAINT TRIGGER
declared `DEFERRABLE INITIALLY DEFERRED`, evaluated at COMMIT
rather than per statement. Used by INV-LEDGER-001 (debit =
credit per journal entry) so multi-line entries can be inserted
line-by-line without transient unbalance rejecting the first
INSERT.

**Discipline backstop.** A database-level enforcement
mechanism that catches the failure mode of a deliberately
race-prone or laxly-checked implementation pattern, but
deliberately does NOT carry its own INV-ID. Two such sites
exist in Phase 1.1: the `unique_entry_number_per_org_period`
UNIQUE constraint and the `journal_entry_attachments` RLS
policy. See `invariants.md` for the non-promotion rationale.

**dry_run.** A boolean parameter on every mutating agent tool.
The confirmation flow always calls dry-run first; only the
second call (after the user's Approve click) writes to
`journal_entries`. Phase 1.1 rejects `dry_run: true` at the Zod
schema (the agent path lands in Phase 1.2).

## F

**Fiscal period.** A row in `fiscal_periods`. Phase 1.1 seeds
12 monthly periods per org per year. A locked period
(`is_locked = true`) cannot accept new postings — corrections
are made via reversal entries posted to a currently-open
period.

**Friction journal.** `docs/07_governance/friction-journal.md`
— the war diary. Append-only entries dated and tagged WANT /
CLUNKY / WRONG / NOTE. Records decisions made with rationale,
incidents and their fixes, and patterns observed during phase
work. The right home for "why is this thing this way?"
questions when the answer doesn't yet warrant an ADR.

**Functional currency.** The currency in which an org's
financial reporting is denominated. Phase 1.1 hard-codes
functional currency to CAD across all orgs. The `amount_cad`
column name encodes this assumption.

**FxRate.** A branded TypeScript type for foreign exchange
rates: `string & { __brand: 'FxRate' }`. Validated by
`FxRateSchema` (regex: 1-12 integer digits + optional 1-8
decimal digits). Defined in
`src/shared/schemas/accounting/money.schema.ts`. Pairs with
[MoneyAmount](#m) — both are the service-layer enforcement of
[INV-MONEY-001](ledger_truth_model.md#inv-money-001--money-at-the-service-boundary-is-string-typed-never-javascript-number).

## I

**Idempotency_key.** A UUID required on every agent-sourced
journal entry (INV-IDEMPOTENCY-001). The mechanism that makes
agent retries safe: the service layer's idempotency lookup
checks `(org_id, idempotency_key)` in `ai_actions` before any
DML, and a hit returns the existing result instead of posting a
duplicate. Optional for `source = 'manual'` and `source =
'import'`.

**INV-ID.** A stable identifier for an invariant in this
codebase. Format: `INV-DOMAIN-NNN` where DOMAIN is one of
LEDGER, MONEY, IDEMPOTENCY, RLS, REVERSAL, AUTH, SERVICE, or
AUDIT. NNN is a three-digit sequence. There are 17 INV-IDs in
Phase 1.1 — see `invariants.md` for the full index.

**InvariantViolationError.** A typed error subclass in
`src/services/middleware/errors.ts`, thrown by
[withInvariants](#w) when one of the four pre-flight checks
fails. Carries one of: `MISSING_CONTEXT`, `MISSING_TRACE_ID`,
`MISSING_CALLER`, `UNVERIFIED_CALLER`, `ORG_ACCESS_DENIED`,
`PERMISSION_DENIED`.

**Intercompany.** A transaction or relationship between two
orgs in the same family office. Phase 1.1 reserves the schema
(`intercompany_relationships` table, `intercompany_batch_id`
column on `journal_entries`) but does not yet implement the
agent-driven reciprocal entry matching — that's Phase 2 AP
Agent scope.

## J

**Journal entry.** A row in `journal_entries`. Represents a
single bookkeeping event with one or more
[journal lines](#j). Created only by
`journalEntryService.post()` (Two Laws of Service Architecture,
Law 2). Never updated or deleted — corrections are made via
reversal entries.

**Journal line.** A row in `journal_lines`. The atomic unit of
the double-entry ledger: one `account_id`, one direction
(debit XOR credit per INV-LEDGER-004), one amount. Multiple
lines belong to one parent journal entry; they must balance
(INV-LEDGER-001) when the transaction commits.

## L

**Layer 1 — Physical Truth.** The database enforces. Postgres
CHECK constraints, triggers, RLS policies. 11 invariants in
Phase 1.1. The layer that cannot be bypassed by a bug in any
higher layer.

**Layer 2 — Operational Truth.** Services decide. TypeScript
service functions wrapped in [withInvariants](#w), Zod schemas
at every boundary, typed [ServiceError](#s) codes. 6
invariants in Phase 1.1.

**Layer 3 — Temporal Truth.** Events as source of truth.
Append-only event stream (`events` table with triggers). 0
invariants in Phase 1.1: the `events` table is a
[reserved seat](#r). The Layer 3 *role* of "events as source
of truth" is a Phase 2 obligation.

**Layer 4 — Cognitive Truth.** Agents propose. Structured-
response contracts, [confirmation-first model](#c),
anti-hallucination rules. 0 invariants by design — agents are
allowed to be wrong because lower layers catch mistakes before
they touch the ledger.

**Lower-wins rule.** When two layers would disagree, the lower
layer wins. A service function calling the database with an
unbalanced journal entry will have its transaction rolled back
by the deferred constraint at COMMIT regardless of what the
service function "thought" it was doing. Authority only flows
down.

## M

**Mainframe.** The non-AI fallback UI. Every Phase 1 task can
be completed via the manual path, independent of agent
availability. When the Claude API fails, the chat panel shows
a degradation banner; the Mainframe remains fully functional.

**MoneyAmount.** A branded TypeScript type for monetary
values: `string & { __brand: 'MoneyAmount' }`. Validated by
`MoneyAmountSchema` (regex: 1-16 integer digits + optional 1-4
decimal digits, matching Postgres `numeric(20,4)`). Defined in
`src/shared/schemas/accounting/money.schema.ts`. Money never
crosses the service boundary as a JavaScript Number
([INV-MONEY-001](ledger_truth_model.md#inv-money-001--money-at-the-service-boundary-is-string-typed-never-javascript-number)).

## P

**Paired invariants.** Two INV-IDs that participate in each
other's enforcement — same rule expressed at two layers, or
two complementary rules that together enforce a single
contract. Six paired relationships exist in Phase 1.1; see the
"Cross-layer pairings" table in `invariants.md`. The "only
paired invariants may cross-reference across layers" rule
established in Waypoint E.1 means these are the only INV-IDs
that legitimately appear annotated in code at sites belonging
to a different layer than their primary.

**Phase 1.1 / 1.2 / 1.3.** The three sub-phases of Phase 1.
1.1 is the foundation (database, auth, RLS, manual journal
entries) — currently complete. 1.2 introduces the agent stack.
1.3 closes one real month of books for one real org.

**ProposedEntryCard.** The UI component that renders a
proposed journal entry from an agent before the user clicks
Approve. Shows entity, vendor, amount, debit/credit lines,
intercompany flag, matched rule from institutional memory,
plain-English explanation. The artifact of the
[confirmation-first model](#c).

## R

**recordMutation.** The service-side audit-write helper at
`src/services/audit/recordMutation.ts`. Called inside the same
database transaction as the mutation it records. The primary
enforcement site for
[INV-AUDIT-001](ledger_truth_model.md#inv-audit-001--every-mutating-service-call-writes-an-audit_log-row-in-the-same-transaction).

**Reserved seat.** A schema or code structure created in Phase
1.1 to make a Phase 2 feature mechanical to add. Examples: the
`events` table with append-only triggers but no writes today;
`journal_entry_attachments` table empty in Phase 1.1; the
`intercompany_batch_id` column on `journal_entries`. Reserved
seats let Phase 2 plug in without schema migrations.

**Reversal entry.** A journal entry that reverses another (has
`reverses_journal_entry_id IS NOT NULL`). Mirrors the original
with debits and credits swapped (INV-REVERSAL-001) and carries
a non-empty `reversal_reason` (INV-REVERSAL-002). The only
legal way to correct a posted entry — the codebase does not
support void or amendment paths.

## S

**ServiceContext.** The context object passed to every service
function: `{ trace_id, caller: { user_id, verified, org_ids } }`.
Built by `buildServiceContext()` from the API request. The
"verified" flag distinguishes claimed identity from
JWT-verified identity — INV-AUTH-001 rejects unverified
callers.

**ServiceError.** The typed error class returned by service
functions for caller-facing failures. 19 codes in 6 categories
(authorization, period, reversal, persistence, read,
not-found). Defined in `src/services/errors/ServiceError.ts`.
Distinct from [InvariantViolationError](#i) (a subclass for
middleware pre-flight failures) and the `AUDIT_WRITE_FAILED`
sentinel (a plain `Error`, not a ServiceError).

**Simplification.** A Phase 1 deviation from the long-term
v0.4.0 architecture, with a named and scheduled Phase 2
correction. Three Phase 1 simplifications: synchronous audit
log (Simplification 1), reserved-seat events table
(Simplification 2), agents-collapsed-to-services
(Simplification 3). Documented in
`docs/03_architecture/phase_simplifications.md`. Not permanent
design — every simplification has a Phase 2 path back.

**Subagent task.** A delegated coding task executed by Claude
Code with a structured brief. The Phase 1.1 closeout proved
the "literal-for-interfaces, descriptive-for-behaviors" brief
structure produces zero structural drift across five
consecutive invocations. Brief-writing quality is the
bottleneck, not subagent execution. Candidate for ADR-002
formalization (see `open_questions.md`).

## T

**Three-layers-for-the-same-rule.** The Phase 1.1 discipline
of enforcing critical rules at multiple layers: UI form
validation + service layer Zod refine + database CHECK
constraint. Examples: the reversal_reason rule
(form / service / DB CHECK), the balance rule (Zod refine /
deferred constraint), the idempotency rule (Zod refine / DB
CHECK + service idempotency lookup). Each layer catches a
different failure mode; the database is always the
authoritative enforcement.

**Throwaway-work test.** The inclusion criterion for
`CLAUDE.md` non-negotiable rules: does a violation cause work
the user has to throw away or redo? If a "rule" is just style
preference or catchable by review, it doesn't belong in
CLAUDE.md.

**trace_id.** A UUID generated at the request entry point
(API route or orchestrator) that propagates through every
layer: caller → service → database → audit_log → every log
line. Required by INV-AUTH-001's pre-flight Invariant 1
("MISSING_TRACE_ID" if absent). When something goes wrong,
filter pino logs by trace_id to reconstruct the path.

**Two Laws of Service Architecture.** *Law 1: All database
access goes through `src/services/` only.* *Law 2: All journal
entries are created by `journalEntryService.post()` only.*
The first two non-negotiable rules in CLAUDE.md. Encoded in
the codebase by INV-SERVICE-001 and INV-SERVICE-002.

## U

**userClient.** The Supabase anon-key-plus-JWT client.
Respects RLS. Used by Next.js server components and any read
path where RLS enforcement is desired as defense-in-depth.
Never imported by the service layer — that path is
[adminClient](#a) only (INV-SERVICE-002).

## V

**validateReversalMirror.** The service function in
`journalEntryService.ts` that runs the 5-step reversal mirror
algorithm before any database transaction begins. The primary
enforcement site for
[INV-REVERSAL-001](ledger_truth_model.md#inv-reversal-001--reversal-lines-must-mirror-the-original).

## W

**Waypoint.** A unit of work within a multi-commit closeout.
Each waypoint is a single commit with a clear scope and
verification criteria. The Phase 1.1 closeout used waypoints
A through F across commits 4b and 5 to add INV-ID annotations
across the codebase. The waypoint discipline is what kept
17 commits' worth of work from devolving into one giant
unreviewable change.

**withInvariants.** The universal service wrapper at
`src/services/middleware/withInvariants.ts`. A higher-order
function that takes a raw service function and returns a
wrapped version that runs four pre-flight invariants
(context shape, caller verification, org access, role
authorization). Every mutating service call goes through it
— see
[INV-SERVICE-001](ledger_truth_model.md#inv-service-001--every-mutating-service-function-is-invoked-through-withinvariants)
and
[INV-AUTH-001](ledger_truth_model.md#inv-auth-001--every-mutating-service-call-is-authorized).
