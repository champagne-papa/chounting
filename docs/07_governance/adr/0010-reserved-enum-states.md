# ADR-0010: Reserved Enum States for Phase 2 Workflow Affordances

## Status

Accepted; amended 2026-05-04 per Phase 0 reserved-enum variants
identified at Session 2F closure verification check 8 (per
docs/09_briefs/phase-2/2026-05-03-phase-0-governance-plan.md
Task E4 anticipation). Amendment integrates Phase 0 ADR-0019 +
ADR-0016 reserved-enum patterns as recognized variants of the
four-element pattern.

## Date

2026-04-24

## Triggered by

Phase 0–1.1 Control Foundations brief §3.4 — ADR-B paired with
Step 9's `adjustment_status` enum, the first deliberately-
designed consumer of the reserved-enum-states discipline. Per
CLAUDE.md's "ADR before code" discipline, ADR-0010 lands
alongside Step 9a's data/service artifacts (`adjustment_status`
is the ADR's first live consumer at its first enforcement site;
Step 10's `recurring_journal_runs.status` is the second, now
shipped at `supabase/migrations/20240131000000_recurring_journal_templates.sql`).

## Context

Phase 1 of this platform ships two features whose schema shape
needs to be stable across the Phase 1 → Phase 2 boundary without
shipping the Phase 2 workflow behavior upfront. **Adjusting
entries** (Step 9) are controller-only postings that in Phase 1
ship in a single terminal state (`posted`) but in Phase 2 will
route through a maker-checker workflow with `pending_approval`,
`approved`, and `rejected` intermediate states. **Recurring
journal runs** (Step 10) ship in Phase 1 as template-only rows
with a similar terminal-state-only shape (`generated` or
equivalent) but need Phase 2 state transitions for approval gates
on generated entries.

Both features face the same question: should Phase 1's schema
pre-allocate the Phase 2 states, or should Phase 2 add them later
via migration? The answer this ADR codifies — pre-allocate —
derives from a retroactive example that has been latent in the
schema since Phase 1.1's earliest migrations.

**The retroactive founding example.** Migration
`20240105000000_add_entry_type.sql` defines the `entry_type` enum
with four values: `regular`, `adjusting`, `closing`, `reversing`.
Only three of those — `regular`, `adjusting`, `reversing` — are
written by any Phase 1 code path; grep-verified at Step 9a's
state-check returns zero write sites for `closing`. The value was
reserved in the enum from the start because close-process
operations (a Phase 2 subsystem) need `closing` as a distinct
entry_type to separate year-end close entries from routine
adjusting entries. The reservation was shipped informally — no
ADR, no discipline statement — because the pattern seemed
obvious at the time. This ADR codifies what was already true
informally, so the next two consumers (`adjustment_status` in
Step 9, `recurring_journal_runs.status` in Step 10) apply the
discipline deliberately rather than re-deriving it from scratch.

Without a shared ADR, future reviewers encountering a new
enum-with-reserved-values schema will re-derive the discipline
inconsistently. Some will pre-allocate and defend at three layers
(the shape this ADR locks); some will ship a tighter enum and
migrate on the Phase 2 cutover (the shape this ADR rejects); some
will ship a tight enum with a plan to ALTER TYPE ADD VALUE at
Phase 2 (the shape that works for small cases but doesn't compose
with scoped CHECKs on pre-Phase-2 rows). A shared decision record
prevents the drift.

## Decision

Features that reserve workflow states for a future phase SHALL
follow the four-element pattern:

1. **Postgres enum defines all reserved values from initial
   shipping.** Matches the existing codebase convention for
   `entry_type`, `journal_entry_source`, and `org_role`. Enum
   labels are visible in `\dT+`, `SELECT enum_range(...)`, and
   generated TypeScript types — the schema becomes
   self-documenting about the planned Phase 2 shape. Adding new
   values via `ALTER TYPE ADD VALUE` in Phase 2 is technically
   possible but loses the "Phase 1 readers see the planned shape"
   benefit and opens the "was this shipped or reserved?"
   archaeology question.

2. **NOT NULL DEFAULT the Phase 1 terminal state.** Every row has
   a well-defined value from the moment it is inserted, including
   rows inserted before the Phase 2 workflow activates. Picking
   the terminal state as the default means Phase 2's cutover
   needs no existing-row backfill — every Phase 1 row is in a
   valid post-workflow state by construction.

3. **Scoped CHECK restricts reserved values to the feature's
   discriminator.** The scope matches the discriminator that
   motivates the reservation. For `adjustment_status`, the
   CHECK fires only on `entry_type = 'adjusting'` rows; non-
   adjusting rows carry `adjustment_status = 'posted'` by the
   default and the CHECK predicate is trivially true for them.
   Scoping matters because it narrows the Phase 2 migration
   surface: activating the workflow means loosening or dropping
   the CHECK, which affects only the discriminator's rows.

4. **Three-layer Phase 1 defense.** No Phase 1 write path emits
   a reserved value; each layer catches an escape from the layer
   above it:

   - **Layer 1 — DB CHECK.** Database enforcement is
     authoritative; cannot be bypassed by a service bug or a
     client trick. This is the final guard.
   - **Layer 2 — Zod boundary.** Service input schemas reject
     client-provided values for the reserved column via
     `z.undefined().optional()`. No client path can propose a
     reserved state; the route rejects the payload with a
     ZodError before the service executes.
   - **Layer 3 — Service emission.** Service-layer write paths
     omit the column from INSERT on the feature's branch; the
     DEFAULT handles assignment. No service code writes anything
     other than the terminal value — the path literally does not
     exist in the codebase.

The three layers are defense-in-depth, not redundant gates with
matching semantics. A Layer 2 bypass (someone writing directly
against the Zod-less DB client) is still caught by Layer 1; a
Layer 3 bug (service synthesizes a reserved value instead of
relying on the DEFAULT) is still caught by Layer 1. The DB is
the authoritative floor under whatever defenses the service and
schema layers provide above it.

### Recognized variants of the four-element pattern (2026-05-04 amendment)

Phase 0 governance work surfaced three reserved-enum variants
that share the four-element pattern's defense-in-depth philosophy
but diverge structurally on elements 1–3. Each variant is a
recognized application of this ADR; future contributors
encountering a similar shape SHALL apply the variant's discipline
as canonically documented here.

**Variant A — NULL-default forward-compatible config-column
reservation.** Per ADR-0019 Decision item 2 Path γ
(`docs/07_governance/adr/0019-confidence-calibration-policy.md`),
the calibration governance pattern reserves six per-org
configuration columns on `org_settings` (e.g.,
`confidence_threshold_vendor_invoice`, `calibration_cadence`)
that ship NULL-default at v1 with per-org operational activation
forward-pointed to post-v1 amendment-or-new-ADR. The variant
diverges from the canonical four-element pattern on elements 1
(numeric/string columns, not enums) and 2 (NULL-default rather
than NOT NULL DEFAULT terminal state). Element 3 (scoped CHECK
restricting reserved values; here Layer 1 DB CHECK admits only
NULL or legal value) and element 4 (three-layer defense) MATCH
the canonical pattern. Future contributors reserving per-org
configuration values for post-v1 operational activation SHALL
follow Variant A's three-layer defense:

- **Layer 1 — DB CHECK admits NULL or legal value range** (e.g.,
  `confidence_threshold_vendor_invoice IS NULL OR
  confidence_threshold_vendor_invoice BETWEEN 0 AND 1`).
- **Layer 2 — Zod boundary rejects non-NULL at v1** (the
  `org_settings` writer's Zod schema rejects any client-provided
  non-NULL value for the reserved column).
- **Layer 3 — Service emission filter prevents non-NULL writes**
  at v1 (the `org_settings.*` writer per ADR-0011 §1 entity
  ownership — `orgService` per Sub-verification 1 Outcome A —
  literally does not have a code path that writes non-NULL to
  the reserved column).

The Phase 1 → post-v1 transition activates the variant via per-
org-operational-activation amendment-or-new-ADR per ADR-0017
Decision item 4 substrate-now-enforcement-later precedent. The
NULL-default choice closes the existing-row backfill question:
post-v1 activation SETs columns from NULL to operational values
on a per-org per-activation basis, NOT a global migration.

**Variant B — Enum-array reservation.** Per ADR-0019 Schema
deltas, the new closed enum `amendment_cascades_fired` (used as
enum array on Event 2 audit-event records) reserves the full
set of amendment-cascade-target ADRs with v1 active subset
limited to `{ADR_0014_DOCUMENT_TYPE_THRESHOLDS,
ADR_0018_AMBIGUITY_MARGIN}`. Future post-v1 ADRs that become
amendment-cascade targets activate by extending the v1 active
subset. The variant matches element 1 (closed enum defines all
reserved values) and element 4 (three-layer defense — DB CHECK
on enum values + canonical audit-log writer per ADR-0011 §1 +
Zod schema validation). Element 2 (terminal state default) is
reinterpreted as **empty array `{}` represents "no cascades
fired"** — the empty-array form is the cycle-emission terminal
state. Element 3 (scoped CHECK on discriminator) is
reinterpreted as **the audit-event schema itself constitutes the
scope** — the enum array is only valid on the
`calibration_run_completed` audit-event type, NOT on other
audit-event types. Future contributors reserving enum-array
fields for forward-compatibility SHALL follow Variant B's
empty-array-as-terminal-state + audit-event-schema-scoped
discipline.

**Variant C — Pair-validity matrix reservation (two-dimensional
reservation).** Per ADR-0016 Decision item 3
(`docs/07_governance/adr/0016-document-relationship-graph.md`),
the `(linked_entity_type, link_role)` pair-validity matrix
reserves a two-dimensional joint-validity space at 756 cells with
v1 active subset narrow. The variant extends element 1 to
**multi-dimensional** (closed enum per dimension) and element 3
to **joint-validity scoped CHECK** (the CHECK fires on the joint
pair, not on either dimension independently). Element 2 (NOT
NULL DEFAULT terminal state) does not directly apply — pair-
validity matrices have no single "terminal" cell; instead, the
v1 active subset defines the allowed-pairs scope. Element 4
(three-layer defense) MATCHES the canonical pattern: Layer 1 DB
CHECK on joint pair validity + Layer 2 documentLinkService Zod
boundary + Layer 3 service emission filter. Future contributors
reserving multi-dimensional joint-validity pair spaces SHALL
follow Variant C's joint-CHECK + dimensional-extension
discipline.

**Variant evaluation discipline.** When a future feature reserves
schema shape for a later phase, contributors SHALL evaluate which
variant (canonical four-element, Variant A, Variant B, or
Variant C) best fits the substantive concern. If none fits, the
feature warrants a new variant addition to this ADR via a
follow-up amendment, NOT divergent inline discipline. The
canonical-evidence anchor for Phase 0 reserved-enum patterns is
this ADR; future contributors discovering a fifth pattern SHALL
amend this ADR rather than re-deriving discipline inconsistently.

The substrate-now-enforcement-later pattern (codified as Phase 0
governance lesson per
`docs/09_briefs/phase-2/2026-05-04-d6-ratification-package.md`
§6.8) is the cross-pattern reference for all four variants
(canonical + A + B + C). Phase 0 ratified six instances of
substrate-now-enforcement-later: ADR-0011 reserved
exception-resolution-actions; ADR-0014 Tier B classifier
reserved post-v1; ADR-0014 reserved `org_settings.*` columns
from Q73's other portion; ADR-0017 vendor-rules enforcement;
ADR-0019 calibration substrate (Variant A); ADR-0018 T7 + T9 +
ADR-0019 T11 reserved triggers. This ADR is the canonical
reference for the substrate-shape mechanism; the substrate-now-
enforcement-later pattern is the canonical reference for the
forward-compatibility mechanism.

### Phase 2 upgrade path

When a Phase 2 workflow subsystem activates, the migration
loosens the scoped CHECK (or drops it entirely if the workflow
replaces the constraint with trigger-based state-transition
enforcement). No existing-row backfill is required — every
Phase 1 row has `<column> = '<terminal_state>'`, which remains
a valid post-workflow state. The enum values are already
present; `ALTER TYPE ADD VALUE` is not needed. The Zod schema
evolves to accept the new values on the relevant write paths
(subject to Phase 2's own auth rules). The service gains the new
write paths; the old no-emit rule on the Phase 1 adjusting branch
continues to govern rows created by that branch.

The migration cost is low because the Phase 1 → Phase 2
transition does not have to carry the "existing rows need
reclassification" question. That question is closed at Phase 1
shipping time by the NOT NULL DEFAULT choice.

## Consequences

**What this enables.** Phase 2 workflow subsystems activate by
loosening a CHECK constraint and adding service write paths, not
by migrating existing rows. The Phase 1 → Phase 2 cutover becomes
a schema-and-code change, not a data-migration change. Future
contributors reading Phase 1 schemas see the planned Phase 2
shape directly in the enum definitions; no external doc
archaeology required to answer "what is the future state space
of this column?"

Defense-in-depth composes cleanly with the four-layer invariant
model. Layer 1 (database CHECK) composes with Layer 2 (Zod) and
Layer 3 (service emission) the same way INV-AUDIT-001 (service-
layer) composes with INV-AUDIT-002 (database-layer append-only
triggers) — multiple enforcement points for the same rule, with
the database as the authoritative floor. The pattern matches
ADR-0008's enforcement-mode framing: Layer 1 is commit-time
physical enforcement that cannot be silently bypassed.

**What this constrains.** Every future feature that needs to
reserve workflow states for a later phase must follow this
four-element pattern. A feature that ships a tight enum "to be
safe" and plans to ALTER TYPE ADD VALUE at Phase 2 diverges from
this ADR and deserves a code-review rejection. A feature that
ships a wide enum without the scoped CHECK similarly diverges —
the CHECK is the load-bearing defense, not the enum definition.

Contributors adding a new reserved-enum-state column must also
add a Layer 2 Zod rejection (client cannot override), a Layer 3
service no-emit rule, and targeted integration tests that pin
each layer's behavior. The test surface is roughly two tests per
feature: one that demonstrates Layer 2 rejects a client override
with a ZodError, one that demonstrates the DB CHECK rejects a
non-terminal value if someone bypasses Layer 2 (for example,
direct DB client from a test harness).

The informal `closing` reservation in `entry_type` predates this
ADR and remains informal — no Layer 2 or Layer 3 defense is
required because no Phase 1 write path uses the value and no
Phase 2 consumer has yet been built. When the close-process
subsystem ships, its brief will cite this ADR and add the three
defenses around `closing` at that time. The ADR does not
retroactively require closing-related tests to be written now.

## Alternatives considered

### Alternative 1 — String column + CHECK-list constraint

Rejected. A string column with a `CHECK (value IN ('posted',
'pending_approval', ...))` constraint is semantically equivalent
to a narrowly-scoped enum but diverges from the existing codebase
convention (`entry_type`, `journal_entry_source`, `org_role` are
all enums). The migration cost is identical to the enum path —
each new reserved value requires a schema change either way — but
the string-plus-CHECK shape loses the `\dT+` discoverability,
loses the generated TypeScript literal-type narrowing, and
becomes harder to reason about in `EXPLAIN` plans because the
query planner doesn't see the value space as a fixed enumeration.
The cost of the divergence is not offset by any semantic benefit.

### Alternative 2 — Separate workflow-state table

Rejected. Moving `adjustment_status` (or similar) into a separate
`adjustment_workflow_state` table with a foreign key from
`journal_entries` normalizes the workflow-state concern into its
own table. The shape is defensible for heavy Phase 2 workflow
semantics where state transitions carry rich metadata (timestamps
per transition, approver references, comment threads). For
Phase 1, where the column carries a single enum value with no
per-transition metadata, the normalization is premature. Every
read that wants to know "what's the approval state of this
entry?" becomes a JOIN. Phase 2 can still extract the column into
a separate table if richer state-transition metadata materializes
— but shipping the extraction now forces Phase 1 to pay the join
cost for a column that has one value.

### Alternative 3 — No reservation; add states in Phase 2 via migration

Rejected. The Phase 2 migration under this approach would need to
backfill the new column for existing Phase 1 rows. For
`adjustment_status` specifically, the backfill is not a
mechanical question — it is a semantic one: Phase 1 adjusting
entries were `posted` without going through an approval workflow.
Are they retroactively `approved`? They were not actually
approved by any approver. Are they `pending_approval`? They were
already posted; calling them pending is wrong. Are they a fourth
state, `legacy_posted`? Then the enum grows a Phase-1-transitional
value that complicates Phase 2's state machine. Pre-allocating
`posted` as the Phase 1 default closes this question before it is
asked — `posted` is the terminal state under Phase 2 semantics
too, so existing rows are already in a valid post-workflow state
and the migration has nothing to backfill.

The deferred-allocation approach also forfeits the
schema-visible-future benefit. Phase 1 readers cannot see that
Phase 2 plans to add workflow states; they can only see the
Phase 1 shape and have to consult external docs to understand
the future shape. Pre-allocation makes the future shape
self-documenting.

### Alternative 4 — Ship reservations only in Phase 2; Phase 1 ships a tight enum

Rejected. This is a restatement of Alternative 3 from the
Phase 1 shipping perspective. Shipping a tight enum (only
`posted`) in Phase 1 and widening it with `ALTER TYPE ADD VALUE`
in Phase 2 is technically possible but interacts poorly with
scoped CHECKs on Phase 1 rows. The Phase 2 migration would need
to drop and recreate the CHECK (or add a new CHECK that tolerates
the new values only on post-Phase-2 rows, using a timestamp
discriminator), which is architectural churn at the cutover. Pre-
allocation with a Phase-1 scoped CHECK that restricts usage to
`posted` — and a Phase-2 migration that loosens the CHECK —
requires a smaller migration footprint at the cutover.

## Cross-references

- **`docs/09_briefs/phase-1.1/control-foundations-brief.md`** —
  §3.2 (adjusting-entry design carrying `adjustment_status`),
  §3.3 (recurring-journal design carrying a parallel status
  column), §3.4 (this ADR's obligation), §6 (discipline backstop
  registration anticipated in Step 12).
- **`docs/02_specs/ledger_truth_model.md`** — the INV-AUDIT-001
  and INV-ADJUSTMENT-001 leaves use the same "DB + service + Zod"
  three-layer defense shape; this ADR generalizes the shape for
  the reserved-state class of invariants.
- **`supabase/migrations/20240129000000_adjustment_status_enum.sql`**
  — the first deliberate consumer. Defines `adjustment_status`
  with four values; scoped CHECK restricts non-`posted` on
  adjusting rows (discriminator-scoped form: `entry_type <>
  'adjusting' OR adjustment_status = 'posted'`).
- **`supabase/migrations/20240131000000_recurring_journal_templates.sql`**
  — the second deliberate consumer. Defines
  `recurring_run_status` with four values; unconditional scoped
  CHECK `recurring_run_status_phase1_allowed` restricts
  `status IN ('pending_approval', 'posted', 'rejected')` on all
  runs (distinct form from 20240129000000 because the runs
  table has no row-level discriminator — every row is a run, so
  the CHECK applies unconditionally). The same migration ships
  INV-RECURRING-001 (deferred CONSTRAINT TRIGGER on template
  lines) — orthogonal enforcement concern in the same data
  model.
- **`supabase/migrations/20240128000000_add_adjustment_reason.sql`**
  — sibling Step 9a migration enforcing INV-ADJUSTMENT-001. Uses
  the same Layer 1 DB-CHECK pattern for a different invariant
  shape (non-empty text rather than reserved value rejection).
- **`supabase/migrations/20240105000000_add_entry_type.sql`** —
  retroactive founding example. Defines `entry_type` with
  `closing` reserved but never written by any Phase 1 code path.
  The informal precedent this ADR codifies.
- **`src/shared/schemas/accounting/journalEntry.schema.ts`** —
  `AdjustmentInputSchema` carries the Layer 2 defense for
  `adjustment_status` (rejects client override via
  `z.undefined().optional()`).
- **`src/services/accounting/journalEntryService.ts`** — the
  `post()` function's adjusting branch implements the Layer 3
  defense: `adjustment_status` is omitted from INSERT; the DB
  DEFAULT handles assignment.
- **ADR-0008** (`0008-layer-1-enforcement-modes.md`) — the
  four-layer enforcement-mode framing. Layer 1a (commit-time
  physical — the CHECK constraints here) composes with Layer 2
  (service-layer invariants) and Layer 3 (schema-boundary
  validation) the same way this ADR's three-layer defense is
  structured.
- **ADR-0009** (`0009-before-state-capture-convention.md`) — the
  before_state capture convention, which uses a similar "DB +
  service" dual-layer shape for a different class of rule
  (positive capture rather than reserved-state rejection). This
  ADR follows 0009's voice and structure conventions (prose-
  heavy, bullets only for rule enumeration and alternatives).
- **ADR-0019** (`0019-confidence-calibration-policy.md`) — the
  first consumer of Variant A (NULL-default forward-compatible
  config-column reservation) at Decision item 2 Path γ + Schema
  deltas (six reserved `org_settings.*` columns) and the first
  consumer of Variant B (enum-array reservation) at Schema
  deltas (`amendment_cascades_fired` enum array on Event 2).
- **ADR-0016** (`0016-document-relationship-graph.md`) — the
  first consumer of Variant C (pair-validity matrix
  reservation) at Decision item 3 + Schema deltas
  (`(linked_entity_type, link_role)` 756-cell pair-validity
  matrix).
- **ADR-0017** (`0017-vendor-template-substrate.md`) Decision
  item 4 — substrate-now-enforcement-later forward-pointer
  framing inherited by ADR-0019 Variant A's per-org operational
  activation deferral. The substrate-now-enforcement-later
  pattern is the cross-pattern Phase 0 governance lesson
  formalized in
  `docs/09_briefs/phase-2/2026-05-04-d6-ratification-package.md`
  §6.8.

## Scope bound

This ADR codifies the schema-shape discipline for reserving
Phase 2 workflow states in Phase 1, plus the recognized variants
identified at Session 2F closure verification (Variant A
NULL-default config-column reservation; Variant B enum-array
reservation; Variant C pair-validity matrix reservation). It
does NOT address Phase 2 workflow subsystems themselves —
approver queue UI, state-transition machines, maker-checker
enforcement rules, per-transition audit trail shape,
approver-permission gating — any of which may require their own
ADRs at the time Phase 2 ships. It does NOT address per-org
operational activation governance for Variant A consumers
(ADR-0019 forward-pointed this to post-v1 amendment-or-new-ADR).
It does NOT address amendment-cascade-target governance for
Variant B (the audit-event-anchored governance event-driven ADR
amendment cascade discipline lives in Framing α per
`docs/07_governance/adr/0019-confidence-calibration-policy.md`
Decision item 8 + Notes for future ADR writers item h, codified
as Z1 #13 per Session 2E Task 10). This ADR's scope is the
schema-ready affordance + recognized variants, not the workflow
behavior or activation governance that will eventually consume
the affordance.

## Amendment — Phase 6.5 retrospective (2026-05-17, commit [Commit A SHA — set post-commit])

Two sub-clarifications surfaced at Phase 6.5 close, ratified per
founder routing rule 2026-05-17.

### N=4 catalog of functionally-independent-substrate UI-layer instances

The substrate-now-enforcement-later cross-pattern (this ADR's
canonical territory per the Cross-references section above and
the `D6 §6.8` formalization) shipped at Phase 6.5 with four
functionally-independent-substrate UI-layer instances stable at
chunk-3 close. Each carries independent meaning at the storage /
contract / persistence layer regardless of whether a v1 consumer
emits against the substrate; each names a post-v1 upgrade path
without blocking the v1 ship.

1. **Sub-Q7.4.α′ Region 7.4 hidden with structural reservation**
   (chunk 1 commit `5a9492b`). Region 7.4 ships as a zero-render
   empty `<div data-region="7.4">` with `display: none` at v1; the
   structural placeholder reserves the layout slot for post-v1
   multi-session-chat without exposing UI. A single-row
   `agent_sessions` per org backs the surface at v1 — schema-
   ready for the future N-session shape per the substrate-now-
   enforcement-later discipline.
2. **Sub-Q8.c.α₁→α₂ localStorage→DB column post-v1** (chunk 1
   commit `5a9492b`). Shell-state persistence ships as
   localStorage at v1 (per-browser scope; SSR-safe hydration via
   pure-helper extraction at
   `apps/web/src/shared/storage/shellStateStorage.ts` + thin
   React hooks). Post-v1 cross-browser sync upgrades to a DB
   column with the same logical contract; the pure-helper
   boundary preserves the upgrade path without v1 lock-in.
3. **Sub-Q9.d.α→δ session-only→IndexedDB attachments post-v1**
   (chunk 3 commit `29e2ba1`). Staged attachments persist as
   session-only in-memory state at v1; IndexedDB substrate
   (localStorage infeasible for File objects; FileReader
   serialization deferred) ships post-v1 as the
   enforcement-later half. The session-only v1 surface is
   functionally independent — File-shape contract holds at the
   in-memory boundary regardless of which persistence layer
   eventually backs it.
4. **EC1.β v1-default `window.confirm()` → React modal post-v1**
   (chunk 2 commit `c5d7e89`). Pattern γ source-driven routing's
   edge case EC1 ("replace active drop on tab collision") fires
   `window.confirm()` always-prompt as v1 default; the prompt's
   contract (operator confirms replace; service-layer routing
   honors the decision) holds regardless of UI shell. Post-v1
   upgrade to per-form dirty-state detection + React modal
   substrate is the enforcement-later half; the v1 prompt
   contract carries forward unchanged.

Catalog stable at N=4 post-chunk-3. The `onDropEvent` prop
proposed at chunk 2 brief as a candidate N=5 instance was
recognized at chunk 2 implementation as an additive-interface-
requiring-consumer surface and reclassified out of this catalog
per the boundary refinement below.

### Substrate-now-enforcement-later vs RI-1 strict atomic ship — boundary refinement

Phase 6.5 chunk 2 surfaced a discrimination clarifying when an
additive surface belongs in this ADR's "substrate-now-
enforcement-later" territory vs RI-1's "strict atomic ship with
consumer" territory (`CLAUDE.md ## Verify-forward-at-scope-lock
for computational-shape chunks` §RI-1):

- **Functionally-independent substrate (this ADR's territory).**
  A database column, RPC parameter, enum value, table
  reservation, or type definition with independent meaning at
  the storage / schema / contract layer regardless of whether a
  v1 consumer exists. Example: reserving `cancelled` in the
  `exception_status` enum at chunk 6.2 close preserves the
  value's identity for chunk 6.3+ consumers without emitting any
  v1 code path that depends on the value. The substrate has
  meaning at the schema layer even when no service reads or
  writes the reserved value at v1.

- **Additive interface requiring consumer presence (RI-1
  territory).** A function parameter, component prop, callback
  signature, or any surface whose interface contract is
  meaningless without a v1 consumer reading or invoking it.
  Example: the `onDropEvent` prop proposed at the chunk 2 brief
  as a candidate substrate-now-enforcement-later N=5 instance —
  recognized at chunk 2 implementation as cosmetic-only (a prop
  nothing reads is dead surface area, not deferred substrate;
  the prop's interface contract is meaningless without a v1
  consumer wiring its invocation). Chunk 2 deferred `onDropEvent`
  to chunk 3 atomic shipping per RI-1; chunk 3 Commit 1 `29e2ba1`
  shipped BOTH the prop signature AND the consumer wave at the
  same commit (Pattern γ Rule 1 `routeNewTab` consumer + EC3.β
  one-tab-per-batch semantics).

The discriminator: ask whether the surface holds contract meaning
at the storage / schema / persistence layer in absence of any v1
consumer. If yes (DB column, enum value, RPC parameter, table
reservation, type definition, session-scoped persistence layer),
this ADR's substrate-now-enforcement-later territory applies. If
no (function parameter, component prop, callback signature whose
contract is meaningless without invocation), RI-1's strict
atomic ship discipline applies — ship the interface with its v1
consumer at the same commit.

**Cross-references.**

- Phase 6.5 retrospective at `docs/07_governance/retrospectives/phase-6-5-retrospective.md`
  §3 Candidate #1 + Candidate #2 for full empirical narrative.
- `CLAUDE.md ## Verify-forward-at-scope-lock for computational-shape chunks`
  §RI-1 (Consumer-presence verification before substrate
  addition) — sibling discipline at additive-interface grain.
- `CLAUDE.md ### Substrate-now-enforcement-later cross-pattern` —
  parent codification of the discipline this ADR's Phase 6.5 N=4
  catalog instantiates.
- ADR-0011 Amendment 2026-05-15 — `ingest_items` deferral as the
  parallel substrate-grain "land schema with consumer code"
  precedent in the substrate-now-enforcement-later territory.
