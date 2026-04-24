# ADR-0010: Reserved Enum States for Phase 2 Workflow Affordances

## Status

Accepted

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

## Scope bound

This ADR codifies the schema-shape discipline for reserving
Phase 2 workflow states in Phase 1. It does NOT address Phase 2
workflow subsystems themselves — approver queue UI, state-
transition machines, maker-checker enforcement rules, per-
transition audit trail shape, approver-permission gating — any of
which may require their own ADRs at the time Phase 2 ships. This
ADR's scope is the schema-ready affordance, not the workflow
behavior that will eventually consume the affordance.
