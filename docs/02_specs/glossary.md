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

[A](#a) · [B](#b) · [C](#c) · [D](#d) · [E](#e) · [F](#f) · [I](#i) · [J](#j) · [L](#l) · [M](#m) · [N](#n) · [P](#p) · [Q](#q) · [R](#r) · [S](#s) · [T](#t) · [U](#u) · [V](#v) · [W](#w) · [Workflow Vocabulary](#workflow-vocabulary)

---

## A

**ActionType.** The gate's typed decision output — the `action_type`
DB enum, 5 values: `auto_post_at_rung_2`, `auto_post_at_rung_3`,
`block_with_reason`, `route_to_exception_queue_with_reason`,
`suggest_with_required_approval`. This is the **one typed decision
contract** ("what the gate directs"), produced by the Autonomy Gate
(`gate(): ActionType`) — the pure-core evaluator deliberately does
*not* produce it (no `effective_action` on `MatchResult`). Reconciled
to **Disposition** ([D](#d)) — the outcome label — via
`dispositionForAction()`. Distinct layers: ActionType = command,
Disposition = outcome. (The proposed 5-value gate-disposition
vocabulary is a Decision-11-OPEN gloss over ActionType, not a separate
contract — see deferred entry below.)

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

**Disposition.** The shipped outcome label of a rule evaluation —
4 values: `auto_posted`, `blocked`, `routed`, `pending` — written to
`rule_evaluation_log.disposition` (CHECK-constrained). Derived from
**ActionType** ([A](#a)) via `dispositionForAction()` (the two
auto-post arms collapse to `auto_posted`; at V1 the only emitted
value is `pending`, since `current_rung` is always `always_confirm`).
"What happened," as distinct from ActionType's "what the gate
directs." Charter INV-4 names the typed contract as *reconciled with*
Disposition — the contract is ActionType; Disposition is its
reconciled outcome.

**dry_run.** A boolean parameter on every mutating agent tool.
The confirmation flow always calls dry-run first; only the
second call (after the user's Approve click) writes to
`journal_entries`. Phase 1.1 rejects `dry_run: true` at the Zod
schema (the agent path lands in Phase 1.2).

## E

**Evidence object.** The canonical artifact a committed AP
posting hangs its evidence off — source document, extraction,
decision, approver, receipt — replacing today's fragmentation
across `proposedAttachment`, `document_cases`,
`source_document_links`, audit rows, and the partial Logic
Receipt. Net-new for V1 (reserved ADR-0033); shaped general
(not AP-only) so V2 workflow-learning and first-class Logic
Receipts can read it. Extends the existing `billService.post`
evidence-completeness gate (INV-DOC-001) rather than duplicating
it. The `core/evidence/` + `services/evidence/` homes are empty
reserved directories at V1.

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
AUDIT. NNN is a three-digit sequence. There are 18 INV-IDs in
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

**Layer 1 — Physical Truth.** The database enforces. Split by
ADR-0008 into two sub-layers that differ in evaluation latency
(not in rigor): **Layer 1a — commit-time physical** (Postgres
CHECK constraints, triggers, RLS policies — violations are
prevented at commit) and **Layer 1b — scheduled physical / audit
scan** (SQL queries stored under `docs/07_governance/audits/`
run on a published cadence — violations are detected). 11
invariants in Phase 1.1, all Layer 1a; Phase 2 adds Layer 1b
members (see the "Phase 2 Reserved Invariants" subsection at the
end of Layer 1 in `ledger_truth_model.md`). The layer that
cannot be bypassed by a bug in any higher layer.

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

**Logic Receipt.** The structured justification a committing
agent produces for an autonomous posting — a justification tuple
with no raw LLM reasoning (INV-AGENT-002, reserved). Partially
codified today as `ProposalJustificationSchema`
(`shared/schemas/accounting/proposalJustification.schema.ts`) +
the `rule_evaluation_log.evaluation_trace` column; the producer
side is deferred (proposalBuilder omits `justification` at V1),
so the schema is a forward contract, not yet a populated artifact.
First-class substrate (table/API/query surface) is a V2 item
(reserved ADR-0035). Distinct from **QueryTrace** ([Q](#q)) — the
read-path artifact is lightweight and is *not* a Logic Receipt.

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

## N

**needs_review.** A `document_case_state` value — the holding
state an AP proposal lands in for human approval (NOT
"waiting_for_approval," which does not exist). At V1 the Wave -1
bleed-stop parks matched proposals in `received` rather than
`needs_review` (the `received → needs_review` transition is
illegal in the ADR-0011 §3 matrix, and no review UI exists yet);
routing to `needs_review` + the approve→post surface is Wave 6.
See **parked_unposted** ([P](#p)).

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

**parked_unposted.** An `IngestDocumentOutput.status` value
added by the Wave -1 A-now bleed-stop (ADR-0007 §Tier 2 Q78
V1-rescoping, commit `de607fdb`): a matched
`proposed_entry_card` / `proposed_mutation_bundle` was built but
deliberately NOT posted — the ungoverned auto-commit is disabled.
No ledger write; `proposal_id` is null; the `document_case` stays
`state='received'` (parked). Distinct from **needs_review**
([N](#n)) — parking is the Wave -1 stop; routing to needs_review
for human approve→post is Wave 6 (`received → needs_review` is
not yet a legal transition).

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

## Q

**QueryTrace.** The lightweight read-path artifact — a record of
how a grounded answer / report / drill-down was produced on the
read path. Deliberately NOT a full **Logic Receipt** ([L](#l)):
reads emit a QueryTrace so the read path stays separated from the
write path and does not bloat the audit corpus. Read/write
separation is a V1 control invariant; QueryTrace substrate is
V1-planned.

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

**system actor.** A non-human service identity that the
document pipeline runs as (`SystemActorServiceContext`:
`caller.user_id = null`, `caller.system_actor` set, e.g.
`'pipeline_orchestrator'`). Per ADR-0007 Q78 (Option A),
`withInvariants` admits a system actor and bypasses the
identity-coupled invariants, attributing the write to a seeded
service-account `auth.users` identity (`SYSTEM_ACTOR_USER_ID`,
Path X). The trust boundary is the route/job-queue/orchestrator
that constructs the context. (The Q78 auth *mechanism* is live;
its *exercise* for auto-commit is gated to post-V1 by the Q78
V1-rescoping amendment — see **parked_unposted** ([P](#p)).)

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

**Tier 2 (data-layer entity ownership).** Where the entity
columns live in the Document Platform data layer per ADR-0011 §1
entity ownership boundary. NOT to be confused with Tier 2
(agent-tier execution).

**Tier 2 (agent-tier execution).** Which agent tier executes a
write per ADR-0007 §Tier 2 strict no-write rule. NOT to be
confused with Tier 2 (data-layer entity ownership).

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

## Workflow Vocabulary

Phase is the primary planning unit; arcs are execution
threads that may cross phase boundaries. The two are
complementary: phases bound scope, arcs bound continuous
bodies of work.

**Note on "Phase" disambiguation.** Where this glossary uses
"Phase" without qualifier, it means **Delivery Phase** (the
numbered scope-bounded chunk crossing the project — Phase
1.1, 1.2, 1.5A/B/C, 2). A separate concept of **Workflow
Stage** describes user-journey position within a Workflow Arc
(Document Intake → Review → Posting); see
`docs/03_architecture/product-workflow-delivery-mapping.md`
for the four-maps separation. Historical docs may retain
"Workflow Phase" terminology; new docs use "Stage" for
workflow chapters and reserve "Phase" for delivery /
governance timing.

**Top-level work units:**

- **Arc.** A continuous body of work spanning one or more
  sessions; bounded by an objective and a closeout.
  Examples: Arc A (Phase 0–1.1 Control Foundations), the
  Coordination Arc (2026-04-22), the O3 Arc (2026-04-22).
  May cross phase boundaries. Has its own retrospective
  at close (e.g., `arc-A-retrospective.md`).
- **Phase.** A numbered scope-bounded chunk of work
  crossing the whole project (Phase 1.1, 1.2, 1.5A/B/C,
  2). Has a master brief, exit criteria matrix, and a
  phase retrospective. May contain multiple Arcs; an Arc
  may also span Phases.
- **Session.** One focused chat conversation against a
  brief or sub-brief. Has a session label (per Session
  Labeling Convention). Often produces 1–N commits.
  Bounded by context-window or by founder pause.
- **Sub-session.** A session carved mid-thread when scope
  expands or context budget compresses. Use only when the
  carve is durable. Example: Session 7.1 was a sub-
  session because it carved Commits 4–5 from Session 7
  mid-thread when scope expanded to 7.1.1 and 7.1.2. A
  within-session pivot from one task to another is not a
  sub-session.
- **Step.** A numbered unit within an Arc's brief (Arc A
  Step 7, Step 12b). Arc-specific vocabulary; Phases use
  Sessions instead of Steps.
- **Commit.** Atomic change, one per logical unit.
  Carries a session label as Git trailer per Session
  Labeling Convention.

**Product Vocabulary:**

Product vocabulary describes WHAT exists in the software,
separate from where the code lives. Per ADR-0020 (Decision
item 1), source code is organized by authority layer
(`agent/`, `services/`, `core/`, `db/`, `contracts/`), not
by product module. Module names are documentation concepts
that live in `docs/00_product/`, not source folders.

- **Product.** The user-facing system. CHOUnting is the
  product; "The Bridge" is its UI metaphor.
- **Product Module.** A coherent area of product
  capability. Examples per
  `docs/00_product/product-map.md`: Document Core, Double
  Entry, Client Core, Identity & Access, Audit, Reporting,
  Agent Control Surface. Modules are documentation
  concepts, not source folders. A feature implementation
  slices through authority layers; the module is where the
  feature is documented, not where its code lives.
- **Feature.** A user-visible capability within a module.
  Example: Document Upload (within Document Core); Post
  Journal Entry (within Double Entry).
- **Requirement.** A specific behavioral constraint a
  feature must satisfy. Example: "Users can upload bank
  statements up to 10MB in PDF format."
- **Task.** A unit of implementation work that delivers
  part of a requirement. Tasks usually correspond to one
  or more commits within a Session.

**Delivery Vocabulary:**

Delivery vocabulary describes WHEN and WHERE work happens.
Builds on the existing Top-level work units (Phase, Session)
with branch and worktree concepts. Per ADR-0020-ratified
`branching-and-feature-flag-strategy.md`, phase branches are
the integration unit between sessions and staging.

- **Phase Branch.** The git branch a Phase's work lives
  on while in flight. Naming:
  `phase/N-short-description` going forward (e.g.,
  `phase/1-storage-evidence-core`). Existing branches
  retain their current names. Phase branches merge to
  staging at ratification with `--no-ff` to preserve arc
  topology. See
  `docs/03_architecture/branching-and-feature-flag-strategy.md`.
- **Worktree.** An on-disk checkout of a Phase Branch
  parallel to the main checkout. Per ADR-0020, the target
  location is
  `~/projects/chounting-worktrees/<phase-name>/`
  (aspirational; the current Phase 0 worktree at
  `.claude/worktrees/phase-0-governance/` is grandfathered).
  Used for long-lived ratification-gated arcs, not short
  feature work. See `docs/04_engineering/worktree-rules.md`.
- **Build Chunk.** A logically coherent slice of work
  within a Phase, larger than a Session, smaller than the
  Phase itself. Example: "Phase 1 Chunk 1 —
  `storageProviderService` substrate." A Build Chunk
  usually spans 1–3 Sessions and produces one PR.
- **Ratification Gate.** A founder-review checkpoint
  where work-in-progress on a Phase Branch is reviewed
  before merging to staging. Phase 0 used six gates
  (D1–D6); smaller phases may use fewer. Not every Phase
  needs gates — only those with ratification-shape
  outputs (governance, conventions, ADRs, architecture
  decisions). Already partially defined under
  "Process/coordination units → Gate" below; this entry
  adds the ratification-specific shape.

**Process/coordination units:**

- **Brief.** The spec a session executes against. Master
  briefs at `09_briefs/phase-X/brief.md`; sub-briefs at
  `09_briefs/phase-X/session-N-brief.md`. Scoping docs
  are a special class of brief authored mid-phase for
  unscoped work (e.g.,
  `oi-3-class-2-fix-stack-scoping.md`).
- **Gate.** A verification checkpoint. Named gates in
  current use: ratification gate, screenshot gate, push-
  readiness gate, founder review gate. Gates are
  checkpoints with explicit pass/fail criteria.
- **Tripwire.** A write-time check that triggers when a
  discipline is violated (10-second rule, file-top
  staleness check, `[ROUTE?]` tag survival past session
  close). Gates are checkpoints; tripwires are
  continuous.

**Quality/discipline units:**

- **Convention.** A codified rule earned by 2–3 fires of
  the same pattern. Lives in
  `04_engineering/conventions.md`. See Documentation
  Routing (this commit) for codification thresholds.
- **ADR.** Already defined in §A above. Cross-reference:
  ADRs are for architectural decisions crossing more than
  one arc; conventions are for repeatable execution rules
  within or across arcs.
- **Invariant.** Already defined implicitly via INV-*
  identifiers in `ledger_truth_model.md` and
  `invariants.md`. A system property enforced by code.
- **Exit Criterion (EC).** A numbered acceptance test for
  a phase. The Phase 1.2 EC matrix
  (`docs/09_briefs/phase-1.2/ec-matrix.md`) is the
  reference shape.

**Issue/observation units:**

- **Friction entry.** A single short observation in
  `friction-journal.md`. Tagged WANT/CLUNKY/WRONG/NOTE
  per the file header.
- **Pattern.** A recurring observation across 2+
  datapoints; below codification threshold but worth
  tracking. Promotes to Convention at N=3 fires.
- **Datapoint.** One specific instance of a pattern
  firing. Conventions cite codification-trigger
  datapoints inline (typically 3 for first codification).
- **Open question.** An unresolved question logged in
  `02_specs/open_questions.md`. Carries forward across
  sessions; resolved via ADR, Convention, or explicit
  closeout entry.
- **Obligation.** A carry-forward item promoted from one
  phase to the next via
  `09_briefs/phase-N/obligations.md`.

**Failure/finding units:**

- **Bug.** A defect in shipped code. Identified by
  description, not number.
- **Finding.** An audit observation. Has a UF-NNN
  identifier (e.g., UF-001 in the Phase 1.1 audit).
- **Class.** A categorized failure mode (Class 1 OI-2
  stall, Class 2 structural-response-invalid). Class
  numbers are scoped to a phase or workstream; not
  globally unique.
- **OI (Output Issue).** An observed agent-behavior issue
  requiring investigation. Numbered OI-N within a phase
  (OI-2, OI-3). Bigger than a Bug, smaller than a
  Workstream.
- **Workstream.** A Phase-2-style named opening (OI-3
  fix-stack, Class 2 fix-stack). Bigger than an EC,
  smaller than a Phase. Has its own scoping doc and exit
  criteria.

**V1 workflow-native vocabulary (V1 governance arc, 2026-05-31):**

- **Workflow Core.** The process engine (Layer 2.5) —
  "where is this process, and what happens next?" Advances
  process state across long-running tasks (instances,
  timers, signals, retries, compensation); cannot bypass
  Services or write the ledger. Net-new for V1; substrate
  authored at ADR-0028. Distinct from Accounting Core (the
  truth engine — "what is true?").
- **Decision modules.** The composable evaluation units a
  service consults — Rules Core (= Rule Type Core),
  Authorization Core, Autonomy Core, Workflow Routing,
  Receipt Assembly. "Decision modules, not a Decision
  Core": services compose them; there is no god-object
  decision folder. The composition principle is the Part-1
  decision of ADR-0030 (spec stage; ratifies with ADR-0030,
  which is parked on Decision 11 — not yet ratified).
- **Autonomy Ladder.** The graduated-authority concept —
  how independently a rule may act on the commit path.
  Three rungs (`always_confirm` → `notify_and_auto_post` →
  `silent_auto`), materialized as the `rule_autonomy_rung`
  enum on `rule_registry.current_rung`. Rule-attached, not
  agent-global (trust attaches per rule). Consolidated at
  ADR-0029; lives on the Trust Spine, is not the whole
  spine. See **ActionType** ([A](#a)) for the gate output
  it caps toward.
- **Autonomy Gate.** The seam that resolves a matched rule
  to an action and emits the typed contract **ActionType**
  ([A](#a)) — capping the rule's branch outcome by its
  `current_rung` (the capping table,
  `shared/rules/capping.ts`). The Gate produces the contract;
  ActionType *is* it. At V1,
  records a disposition diagnostically; gate-driven
  auto-commit is post-V1 (see **governed auto-commit**,
  deferred below).
- **WorkflowStartRequest.** *(Net-new / reserved — ADR-0028.)*
  A domain command (UI- or agent-produced) that starts a
  workflow instance. NOT a fourth Intent (the three-path
  Intent schema is unchanged); a command consumed by
  Workflow Core (which does not exist yet — so this is not
  a live artifact, reserved with Workflow Core ⚫).

**V1 deferred / decision-pending vocabulary.** Definitions are
held pending — defining them as settled now would lock in
ambiguity before the underlying concept ratifies (the same
discipline as the Governance Vocabulary's *Tier 2 — deferred*
subsection, applied to the V1 arc's open items):

- **governed auto-commit.** *(Post-V1.)* The Autonomy Gate
  *deciding* on the live commit path (not just recording) so a
  matched rule at a promoted rung auto-commits without a human.
  Disabled at V1 (the Wave -1 bleed-stop); returns per-rule
  post-V1, hard-gated on the evaluation harness establishing
  match/extraction precision (ADR-0007 Q78 V1-rescoping; seam at
  reserved ADR-0032). Not defined further until that track opens.
- **Learning Trichotomy.** *(V2.)* The three artifact classes
  workflow-learning may propose — TaskPlan, WorkflowDefinition,
  AutonomyParameter — each with its own ratification ceremony.
  Named, not defined: zero code, no consumer, no trace data yet;
  authored when the V2 learning track opens (ADR-0028 / V2
  learning-substrate territory). Define-by-pointer per
  Simplification-3.
- **Trust Spine.** *(Proposal concept — not yet repo substrate.)*
  The cross-cutting governance framing from the V1 Final System
  Proposal (v2) §3.3: a vertical band through every layer
  (Authorization · Autonomy Ladder · Audit · Evidence ·
  Reversibility · Observability · Eval/Replay · Domain Events ·
  Outbox), of which only some bands are shipped (Authorization,
  Audit, Reversibility, Observability) while others are
  reserved/V2 (Evidence object, Eval/Replay, Domain Events,
  Outbox). Defined-as-pending because it traces only to the
  container-side proposal, not to a ratified ADR or code artifact;
  promotes to a defined term if/when a V1 ADR adopts it. The
  Autonomy Ladder lives on the spine; it is not the entire spine.
- **proposed 5-value gate disposition.** *(Decision 11 — OPEN,
  see ADR-0030.)* A proposed vocabulary
  (`allow` / `deny` / `require_approval` / `require_more_evidence`
  / `queue_manual_review`) glossing the shipped **ActionType**
  ([A](#a)); `require_more_evidence` is the one value with no
  ActionType home (evidence-gating, post-V1). Reconciliation
  (which vocabulary is canonical) is OPEN — not defined as an
  outcome until ADR-0030 ratifies.

## Governance Vocabulary

Terms used across the project's governance flow — push gates,
verification sessions, deviation documentation, codification
discipline. Some terms are stable production use (Tier 1) with
definitions ratified during Phase 2 of pre-Session-4 cleanup
(2026-05-08). Other terms are still in motion (Tier 2) with
definitions deferred to Session 7 alongside the `conventions.md`
entries that codify the underlying patterns.

### Tier 1 — defined

**push-readiness gate.** The three-condition checklist applied
before a working-branch HEAD is pushed to a shared branch
(`main` / `staging`). Each condition (Condition 1 test-suite
health; Condition 2 doc-sync reconciled; Condition 3 governance
closeout) must be met OR formally documented as a deviation.
Codified in `CLAUDE.md` § "Push readiness three-condition gate."

**Condition 1 (test-suite health).** First condition of the
push-readiness gate. EITHER `pnpm test` full-suite green at HEAD
OR deviations documented per the [three-artifact framing](#tier-1--defined)
((a) mechanism, (b) fix shape, (c) explicit carry-forward
framing — retrospective, friction-journal, or filed queue
item). "Acceptable baseline" without all three artifacts is
not a met condition.

**Condition 2 (doc-sync reconciled).** Second condition of the
push-readiness gate. `invariants.md` ↔ `control_matrix.md` ↔
`ledger_truth_model.md` ↔ shipped code all consistent;
bidirectional reachability diff clean (or flagged exceptions
documented as Phase 2 stubs); `types.ts` regenerated against
the post-arc schema; ADRs, obligations, and any other arc-
affected governance docs reconciled. Deviation-documentation
shape for Condition 2 is the "Phase 2 stub" pattern — distinct
from Condition 1's three-artifact framing.

**Condition 3 (governance closeout).** Third condition of the
push-readiness gate. Retrospective written; friction-journal
updated with arc-scope entries; any conventions earned by fire
count codified in `CLAUDE.md` (or `conventions.md` per
Documentation Routing) or filed for future codification with
provenance.

**three-artifact framing.** The deviation-documentation
discipline specific to [Condition 1](#tier-1--defined) of the
push-readiness gate: a deviation from "full-suite green at HEAD"
is a met condition only if accompanied by all three of (a)
mechanism, (b) fix shape, (c) explicit carry-forward framing
(retrospective, friction-journal, or filed queue item).
"Acceptable baseline" handwaving without all three is not a
met condition. The phrase is specific to Condition 1; Conditions
2 and 3 use distinct deviation-documentation shapes (Phase 2
stub framing for Condition 2; codification-or-filing framing
for Condition 3).

**STRUCTURAL-OBJECTION.** A verification-session status taxonomy
member (rev 3 verification prompt status taxonomy). Used when a
verified claim's underlying facts check out, but the workstream's
framing or cut is questionable. Verifier flags; operator decides
resolution; verifier still does not propose a fix.
Distinguished from sibling status members:
- **AMBIGUOUS** — claim true under one reading, false under
  another; verifier states both readings.
- **DRIFTED** — claim was likely correct at plan-write time but
  state has moved; evidence shows current divergence.
- **WRONG** — claim factually incorrect against current state at
  any time.
- **CONFIRMED** / **UNVERIFIABLE** — descriptive of fact-check
  outcomes.

STRUCTURAL-OBJECTION is the only taxonomy member that addresses
framing questions while accepting the underlying facts.

**filesystem-not-prompt rule.** A round-2 verification discipline:
every `CONFIRMED` status in a verification-session findings
block must cite filesystem evidence (path:line reference, grep
result, or directory listing), not quote the dispatch prompt
back. The dispatch prompt is the hypothesis; the filesystem is
the ground truth. The rule applies recursively to subagents —
the rule does not weaken because it's a subagent. "Verify
against the dispatch prompt's claim list" is the exact failure
mode the rule is designed to prevent.

### Tier 2 — deferred

Round-2 design vocabulary; definitions land with `conventions.md`
entries in Session 7 alongside the V1→V2 paired-ratification
elevation. Defining these terms now risks locking in ambiguity
before the underlying concepts ratify.

- **Outcome A / B / C** — filesystem-not-prompt rule outcome
  categories (dispatch-time prevented all violations / self-
  checks fired and caught real violations / self-checks fired
  on false positives). N=1 evidence captured at Session 2
  verification; codification deferred.
- **three-category codification taxonomy** — architectural
  principle (N=1 sufficient; ratification IS codification) /
  procedural pattern at workflow grain (N=1 if codification
  artifact = workflow it describes) / process meta-pattern (N=2
  with shape match; artifact decoupled from codification).
  Round-2 design context; `conventions.md` addition deferred to
  Session 7.
- **round-N restructure plan workflow** — V1+V2 paired
  ratification structure. Round-2 design context;
  `conventions.md` addition deferred to Session 7.
