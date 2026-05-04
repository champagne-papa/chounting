# ADR-0012: ProposedMutationBundle — Atomicity, Lifecycle, Logic Receipt, Q28 Surface 4

## Status

Drafted 2026-05-03. Not yet ratified. CTO ratifies per Phase 0
governance plan Decision 3.

## Date

2026-05-03

## Triggered by

Phase 0 governance plan Task C3 (Tier 3 — depends on ADR-0011
ratification 2026-05-03 and ADR-0007 ratification 2026-05-03).
The 2026-05-02 Document Platform reframe spec
(`docs/09_briefs/phase-2/document_platform_reframe_design.md`)
absorbed the original Bundle Atomicity ADR into ProposedMutationBundle
per §7 ("ProposedMutationBundle ADR (includes bundle atomicity —
DB-transaction-atomic enforcement is part of the bundle semantics)"),
so this ADR carries one mechanism — the bundle envelope — and three
specifications attached to that mechanism: atomicity at the DB
transaction layer, lifecycle of a bundle through the six canonical
states from `mutation_lifecycle.md`, and Logic Receipt shape for
compound mutations. The first concrete consumer is the born-paid bill
bundle (`post_bill` + `record_bill_payment`) per spec §15 and the
Spend Initiative brief; ADR-0015 specifies which bundle types ship in
v1 and per-bundle-type child composition. This ADR specifies the
bundle mechanism.

## Context

### Why a Bundle envelope exists

Single `ProposedMutation` objects flow through the proposal queue
unchanged from `intent_model.md` §3. Most workflows produce one
mutation. But several workflows produce **two or more** mutations
that must commit together or not at all — the canonical example is
the born-paid bill, where the bill posting (`Dr Expense / Cr AP`)
and the matching payment (`Dr AP / Cr Bank-or-Card`) are
economically a single transaction even though they emit two journal
entries. If the bill posts but the payment fails, the system holds
an open AP line for a bill that has already been paid in the real
world. The reverse failure leaves a Bank credit against an empty AP
control account. The fix is mechanical: both children commit inside
the same DB transaction, or neither does.

### Why this is not a separate "Bundle Atomicity" ADR

Reframe spec §7 explicitly merged Bundle Atomicity into
ProposedMutationBundle: atomicity is part of bundle commit
semantics, not a separate concern. ADR-0012 is the single home for
bundle shape, bundle commit-flow contract, bundle atomicity, bundle
lifecycle, and bundle Logic Receipt. Per-bundle-type child
composition lives in ADR-0015.

### Phase 0 dependency and Reading B preservation

This ADR sits in Tier 3 alongside ADR-0013 and ADR-0014. All three
depend on ADR-0011 (spine) and ADR-0007 (three-tier agent
architecture) and do not inherit from each other. ADR-0015 (Tier 4)
is the first downstream consumer that activates a concrete bundle
type; ADR-0017 receives the auto-post calibration deferral.

Per ADR-0011 §8, the Document Platform proposes, domain services
produce ledger operations, and the ledger service is the sole
writer of journal entries. Bundles inherit Reading B verbatim. The
bundle envelope is platform-level handoff vocabulary; the bundle
commit runs through a domain service (e.g.,
`billService.postWithImmediatePayment(...)`) that orchestrates each
child's domain logic and routes each child's ledger operation
through the ledger service inside one `withInvariants()`
transaction. No bundle commit path writes to `journal_entries`
directly; no bundle commit path bypasses `ledgerService.post(...)`.

## Decision

The Decision is presented as thirteen items, each of which is a
contract that downstream ADRs and v1 implementation depend on. The
items are not optional; they form a coherent envelope.

### 1. ProposedMutationBundle shape and contract

A `ProposedMutationBundle` is a typed envelope around two or more
child `ProposedMutation` objects with declared ordering, declared
atomicity (`single_db_transaction` for v1), and declared invariant
scope. The bundle has its own identity and metadata distinct from any
child:

```typescript
type ProposedMutationBundle = {
  id: string;                              // UUID, bundle-level
  bundle_type: BundleType;                 // closed enum — see §12
  proposed_at: string;                     // ISO 8601
  approved_at: string | null;              // set on Approved (transient)
  posted_at: string | null;                // set on Posted

  bundle_lifecycle_state: LifecycleState;  // single shared state — see §5
  effective_ceiling: CeilingTier;          // computed = max(child ceilings)
  bundle_idempotency_key: string;          // see §4

  justification: {
    rule_id: string | null;                // null = novel pattern
    pipeline_trace: PipelineStageRecord[]; // per ADR-0007 Q30
    bundle_rationale: string;              // why this is bundled, not separate
    source_document_ids: string[];         // FK references
    user_utterance: string | null;         // verbatim chat input; null otherwise
  };

  children: ProposedMutation[];            // ordered; ordering is semantic
};
```

**Atomicity declaration.** v1 ships `single_db_transaction`. The
declaration is part of the bundle's contract surface so a future
contributor reading the type cannot assume cross-org or external-
provider atomicity is supported without an ADR amendment.

**Ordering is semantic.** Even though the DB transaction is atomic,
the order of children is meaningful for reasoning, audit, and Layer 3
display — for born-paid the order is `post_bill` then
`record_bill_payment`, not the reverse. The ordered `children` array
preserves this for the Logic Receipt and the ProposedBundleCard
rendering. Implementations MUST commit children in the declared order
inside the bundle transaction; reordering is not a free choice.

**Bundle metadata is composite, not derived.** The bundle's
`effective_ceiling`, `bundle_idempotency_key`, and `justification`
fields are populated at proposal time by the domain service or
classifier that built the bundle. They are not recomputed at commit
time from child values; commit-time re-verification (§7) re-checks
the values match the children, but the bundle's own metadata is the
audit record of what was proposed.

**Riding `intent_model.md` Primitive 1.** Per reframe spec §20, the
ProposedMutationBundle is also Primitive 1 (Proposal) with a
composite payload — no new primitive is introduced. The same
proposal queue surfaces handle bundles and single-mutation proposals
without bespoke routing per the canonical rule from
`intent_model.md` ("No entry path has bespoke routing").

### 2. Children compose ProposedMutations only — not ProposedAttachments

The `children` array contains `ProposedMutation` objects. It does
**not** contain `ProposedAttachment` objects. The two have different
commit paths: `ProposedMutation` commits through a domain service and
produces ledger operations via `ledgerService.post(...)`;
`ProposedAttachment` commits through `documentLinkService.create()`
per ADR-0011 §7 and produces no journal entry. Bundling these
together would conflate two commit paths and break the all-or-nothing
property at the level the bundle promises it: the bundle promises
DB-transaction atomicity across ledger writes, not across ledger
writes plus an unrelated polymorphic-link write. Document this
exclusion explicitly.

**If a workflow needs both** — for example, a born-paid bundle whose
classifier-routed receipt should also attach as `payment_evidence` to
the resulting bill — the attachment commit happens **after** the
bundle commit succeeds, not as part of the bundle's transaction. The
attachment's existence is contingent on the bundle's success; the
attachment is not an atomic peer of the bundle's children. The
practical sequencing: domain service runs the bundle; on COMMIT
success, domain service (or its caller) invokes
`documentLinkService.create()` with the new bill's ID. If the post-
bundle attachment fails, the bundle is already committed; the
attachment failure routes to the exception queue per ADR-0011 §13.

### 3. DB-transaction-atomic enforcement

All children of a bundle commit inside a single Postgres database
transaction. The bundle commit method (`bundleService.post(bundle)`
or, for born-paid, `billService.postWithImmediatePayment(bundle)`)
opens one transaction, runs each child's domain-service commit logic
in declared order inside `withInvariants()`, and either commits the
whole transaction or rolls back the whole transaction. **No partial
commits.** This is the v1 enforcement mechanism, named
`single_db_transaction` in §1.

The mechanical surface:

1. Domain service receives a validated `ProposedMutationBundle`.
2. Domain service opens a single DB transaction (Postgres `BEGIN`)
   wrapped in `withInvariants()` per Service Communication Rule 1
   (`docs/02_specs/ledger_truth_model.md`).
3. For each child in declared order, the domain service runs the
   child's commit logic — vendor lookup, account lookup, period
   check, invariant pre-flight, `ledgerService.post(...)` for the
   child's journal entry, child-level `audit_log` write through the
   canonical audit-log writer per ADR-0011 §1.
4. Bundle-level invariant fires inside the same transaction (§7).
5. If every step succeeds, Postgres `COMMIT` lands all child journal
   entries together.
6. If any step raises an error — `ServiceError`, invariant violation,
   RLS denial, FK miss, period-locked, balance-check fail, stale-state
   fail, deferred-constraint-trigger fail — Postgres `ROLLBACK`
   removes all journal entries from the transaction. No child commits
   in isolation; no partial-bundle visible state exists at any read
   isolation level.

The Postgres rollback is the **mechanical** all-or-nothing guarantee.
Service-layer code wraps the orchestration but cannot replace the
rollback; if the service layer ever drifted from one-transaction to
two-transactions, the all-or-nothing property would be unverifiable
from the database side, and the bundle's contract would be silently
broken.

**Operational retry mechanics.** Bundle retry uses the existing
`trace_id` + `idempotency_key` discipline from
`ledger_truth_model.md` (Service Communication Rules; INV-AUDIT-001;
the `(org_id, idempotency_key)` constraint on `ai_actions`). The
bundle-level idempotency key (§4) is the new piece this ADR adds; the
retry pattern itself inherits unchanged.

### 4. Bundle-level idempotency key

The bundle carries a bundle-level idempotency key in addition to each
child's own key. Reason: a network failure between the client and
the bundle service must not result in posting child 1 again on retry,
nor in creating a second bundle that holds duplicate journal entries.

**Form (illustrative; final hash composition is implementation-
owned):**

```
bundle_idempotency_key = hash(
  org_id,
  bundle_type,
  ordered child idempotency keys,
  source_document_ids
)
```

Do not specify the exact formula in this ADR; the implementation owns
the hash composition. The contract this ADR establishes:

- The key is computed at proposal time, not commit time.
- The key is stored on the bundle row alongside `id`.
- Bundle service first checks `(org_id, bundle_idempotency_key)` in
  the bundle ledger before opening the transaction; a duplicate match
  returns the prior bundle's outcome (Posted, Voided, or pending) and
  does not retry the commit.
- The check rides the same pattern as the existing `ai_actions`
  `(org_id, idempotency_key)` constraint. Operational retry mechanics
  live in `ledger_truth_model.md`'s existing trace_id + idempotency_key
  pattern; this ADR inherits that pattern unchanged and adds the
  bundle-level key as a parallel check.

**Child keys still apply.** Each `ProposedMutation` child carries its
own idempotency key per the standard pattern. Bundle-level
idempotency does not replace child-level idempotency; both exist.
The bundle-level key prevents bundle-level duplication; the child-
level keys prevent child-level duplication if a future post-v1
workflow ever extracts a child from its bundle (this is not a v1
pattern but the discipline costs nothing to preserve).

### 5. Bundle lifecycle

A bundle has a single shared `bundle_lifecycle_state` field mapping
to the six canonical states from `mutation_lifecycle.md`:

```
Pending → (may go to Needs Attention) → Approved (transient) →
Posted → (may later become Voided or Reversed)
```

The state transitions:

- **Pending → Approved.** Human approves on the
  ProposedBundleCard. Per §13, born-paid bundles are Always
  Confirm in v1. Approved is **transient** (milliseconds before
  Posted); the state exists so the audit log records approval as
  a separate event from commit.
- **Pending → Needs Attention.** Per `mutation_lifecycle.md` §4
  triggers (limit violation, ceiling flag, novel pattern,
  stale-state detection). The bundle's ceiling is bundle-effective
  per §9; a child's ceiling-flag elevates the whole bundle.
- **Needs Attention → Approved.** Human resolves and approves.
- **Approved → Posted.** Atomic across all children per §3.
- **Pending or Needs Attention → Rejected.** Human rejects.
  Terminal; no children commit.
- **Posted → Voided.** Per `mutation_lifecycle.md`'s
  rejected-with-reversal terminal state, applies within the
  24-hour reversible window. The undo creates reversal entries
  per ADR-0001; per-child vs bundle-level reversal strategy is
  owned by ADR-0015 / ADR-0001 (ADR-0012 names the distinction
  in §8).
- **Posted → Reversed.** Per ADR-0001, applies post-window or to
  manually-posted bundles. Per-child reversal of an individual
  child within a committed bundle is allowed (reversals are
  individual ledger operations); the bundle lifecycle reflects
  the reversal status. Bundle-level reverse-all is an ADR-0015
  convenience.

**Per-child lifecycle states are NOT separate audit surfaces.** The
audit log records bundle-level state transitions (`bundle_proposed`,
`bundle_approved`, `bundle_committed`, `bundle_rejected`,
`bundle_commit_attempt_failed`, `bundle_voided`) and per-child commit
details inside the same audit event (the per-child journal-entry
references, the per-child invariant results). A child within a bundle
does not carry an independent `lifecycle_state` field that drifts from
the bundle's; the bundle's state is the canonical state for all its
children.

The exception is **post-Posted reversal**. After successful commit,
an individual child's underlying journal entry can be reversed per
ADR-0001 — at which point the bundle's lifecycle reflects "one or
more children reversed" via the audit trail, not via per-child
lifecycle drift.

**Lifecycle state is immutable post-commit per ADR-0011 §9.** A
committed bundle's audit trail is immutable; subsequent reversals
produce new audit events, not in-place state mutations on the prior
bundle row.

### 6. Logic Receipt for bundles

**Preferred shape: one bundle-level INV-AGENT-002 event with nested
per-child traces.** The Logic Receipt for a bundle is a single
audit-log event whose payload includes:

- `bundle_id`
- `bundle_type`
- `proposed_at`
- `approved_at` (Approved transient timestamp)
- `posted_at`
- `effective_ceiling`
- `bundle_balance_check` result (the §7 invariant evaluation)
- `transaction_id` (Postgres txid for the commit)
- `child_mutations` (array, in committed order), where each entry
  carries:
  - `child_index` (zero-based position in the bundle)
  - `intent_type` (e.g., `post_bill`, `record_bill_payment`)
  - `input_hash` (per ADR-0007 Q30 PipelineStageRecord shape)
  - `output_hash` (the child's resulting ledger operation hash)
  - `pipeline_trace` (per-child Tier 2 / Tier 2.5 trace records)
  - `ledger_operation_ids` (the journal_entry_ids the child produced)
  - `invariant_results` (per-child invariant evaluations)

This is the canonical shape. Layer 3 (review) consumes this single
event to render the ProposedBundleCard with all child mutations
together — the user sees one card, not N stacked cards.

**Layer 3 user-facing requirement: aggregate Four Questions
grammar.** The ProposedBundleCard renders the Four Questions
(`intent_model.md` §5) at the bundle level, not per-child:

- **Why is this happening?** One bundle-level rule_id explanation
  (e.g., "Born-paid bill: invoice arrived with payment receipt").
- **What changes?** Aggregate delta — combined debit/credit table
  with all children's ledger lines, subtotals per child if helpful,
  single bundle-level total.
- **Who triggered it?** Single bundle-level attribution per the
  existing `created_by` pattern.
- **What evidence backs it?** Aggregate `source_document_ids`.

A naive implementation that stacks N single-mutation cards inside a
bundle dialog violates this contract — the user makes one
bundle-level approval decision and the UI must reflect that.

**Fallback: per-child receipts linked by `bundle_id` plus a bundle
summary event.** If the existing INV-AGENT-002 implementation
materially constrains the event shape (audit log designed around
event-per-mutation, schema cannot accommodate nested children
without disruptive change), emit one INV-AGENT-002 event per child
carrying a `bundle_id` FK plus a single bundle-summary event. The
fallback preserves the same information; Layer 3 rendering still
aggregates into a single ProposedBundleCard. Bundle-level shape is
preferred; the fallback is acceptable only if forced.

### 7. Q28 Surface 4 (bundle re-verification) — authoritative source

The bundle balance check fires at commit time inside
`withInvariants()`. ADR-0012 is the authoritative source for what
this check evaluates; `agent_architecture_policy.md` §2.4 cites this
ADR for the surface 4 row.

**Generic phrasing — debit side is owned by child-mutation logic
per ADR-0015.** For a born-paid bill bundle, the `post_bill` child
credits the AP control account; the `record_bill_payment` child
debits AP for the same amount; AP **nets to zero** at the end of
the bundle. The bill's debit side (Expense / Tax-Recoverable /
Asset / Prepaid / Inventory across one or more bill lines, with
department / project allocations as applicable) and the payment's
credit side (Bank or Credit Card Liability) are owned by
child-mutation logic per ADR-0015 — ADR-0012 does not hardcode
"Dr Expense / Cr Bank."

The bundle-level invariant evaluates four conditions:

1. **Each child entry balances** (per-child INV-LEDGER-001).
2. **The bundle as a whole balances** (sum of all child
   journal-line debits = sum of all child journal-line credits).
3. **The control account net effect is zero** for the bundle's
   primary subject — for born-paid, AP. For reserved bundle types
   (`final_invoice_with_applied_deposit`,
   `vendor_credit_applied_to_bill`), the "net-to-zero" account
   differs; ADR-0015 owns the per-bundle-type net-account
   specification.
4. **The payment-side credit equals the total payment amount.**
   Catches extraction errors where the receipt total doesn't match
   the bill amount.

**Layer mapping per `agent_architecture_policy.md` §3.** Layer 1a
is authoritative for the per-child balance (INV-LEDGER-001) and
for DB-transaction-atomic enforcement (Postgres ROLLBACK).
Layer 2 is authoritative for the bundle-level orchestration —
the domain service's `postWithImmediatePayment()` and the
bundle-level balance / AP-nets-to-zero check inside
`withInvariants()`. The Layer 2 bundle check is a reinforcement of
the Layer 1a per-child guarantee, not the sole enforcement.

### 8. Pre-commit failure vs post-commit reversal — distinct paths

These two paths look superficially similar but are mechanically
different. Document the distinction so future contributors don't
conflate them.

**Pre-commit failure** — any child fails before `COMMIT` due to
invariant violation, RLS rejection, period-locked detection,
stale-state fail (vendor master mutated, period locked,
prepayment balance changed since proposal), bundle-balance fail,
FK miss, or deferred-constraint-trigger fail:

- The entire bundle's transaction rolls back via Postgres
  `ROLLBACK`. No journal entries land at any isolation level.
- **No reversal entry is created** — there is no committed state
  to reverse. Calling reversal a "rollback" is a category error.
- The canonical audit-log writer per ADR-0011 §1 emits a
  `bundle_commit_attempt_failed` event recording failure cause
  (typed `ServiceError` code) and per-child error details — not
  a `bundle_committed` event. The event lives on the
  document/bundle layer, not on `journal_entries`.
- Bundle `lifecycle_state` returns to `Pending` (not stuck in
  `Approved`); `approved_at` is preserved as historical record.
- Retry uses a fresh transaction with the same
  `bundle_idempotency_key` (§4); the idempotency check finds no
  prior commit and the retry runs.

**Post-commit reversal** — the bundle posts successfully and is
later discovered wrong (wrong vendor, wrong amount, wrong period,
fraudulent receipt, etc.):

- Reversal follows ADR-0001 — a new `journal_entries` row with
  swapped debits/credits, non-empty `reversal_reason`, and
  `reverses_journal_entry_id` self-FK.
- Bundle-level reversal vs child-level reversal — strategy is
  owned by **ADR-0015 / ADR-0001**. Per ADR-0001, reversals are
  individual ledger operations; whether AP/Spend exposes a
  bundle-level reverse-all convenience is an ADR-0015 choice.
- Bundle `lifecycle_state` reflects reversal status (Posted with
  one-or-more-children-reversed, or Reversed if all reversed).
- Q78 cross-reference: payment failure (wire bounced, ACH
  returned, card disputed) is a post-commit reversal scenario
  whose lifecycle is owned by ADR-0015.

### 9. Vendor bank-detail / composition-ceiling discipline

`bundle_effective_ceiling = max(child_mutation.ceiling)`. Bundles
inherit the strictest approval / autonomy requirement of any child.

**A bundle may never reduce, mask, or average child-level ceiling
requirements.** A bundle whose children include an `update_vendor`
mutation that changes bank-detail fields is **System ceiling** per
`agent_autonomy_model.md` §6 Item 2 — the bundle inherits the
ceiling. Always Confirm at the bundle level. The controller (Tier 1
human) confirms the bundle on the ProposedBundleCard, and the
confirmation transitively confirms the bank-detail change.

**Composition-bypass prevention.** Not redundant with ADR-0007 —
this is a real failure mode the bundle ADR is in the best position
to prevent. The hazard: a bundle advertised as "low-ceiling" (a
routine born-paid bill) could hide a high-ceiling child (an
`update_vendor` that flips the bank account number), bypassing
System-ceiling enforcement through composition. The rule:
`bundle_effective_ceiling` is mechanically computed as the maximum
of child ceilings, enforced at both proposal time (bundle is
classified at max child ceiling) and commit time (the approval-gate
check uses the max, not the nominal `bundle_type` ceiling).

### 10. Stale-state re-verification (Q28 surface 3) per child

Each child's stale-state checks fire at commit time inside the
bundle's single transaction. ADR-0012 inherits the surface 3 framing
from ADR-0007 Amendment and from `agent_architecture_policy.md` §2.3;
this section names the **bundle-specific stale-state checks** that
apply to the born-paid bundle.

For a born-paid bundle the stale-state checks include:

- **Vendor still exists** with the same identity at commit time
  (vendor_id resolves; vendor not soft-deleted; vendor not merged into
  another vendor since the bundle was Approved).
- **Vendor's `bank_detail_confirmed_flag` has not flipped** since the
  bundle was Approved (when the payment_method requires bank-detail —
  eft / wire / ach).
- **Ledger period containing accounting_date is still open** — the
  `trg_enforce_period_not_locked` trigger (INV-LEDGER-002) fires per
  child during INSERT, so a period that locked between Approved and
  Posted is caught by Layer 1a.
- **Prepayment-balance / credit-balance unchanged** — for bundle
  types that consume a prepayment or credit (reserved per §12), the
  balance read at commit must match the balance assumed at proposal
  time. (Born-paid does not consume a prepayment, so this check does
  not apply to v1 active bundles; reserved bundle types in §12
  activate it.)

Failure of any stale-state check causes the whole bundle to roll
back per §8 (pre-commit failure path). Per-child stale-state checks
fire at the child commit step inside the bundle transaction;
bundle-wide stale-state checks fire after all children's logic has
run but before `COMMIT`. Forward-point to
`agent_architecture_policy.md` §2.3 for the per-check matrix.

### 11. Manual vs automated path uniformity (Reading B preservation)

The manual born-paid workflow per reframe spec §15 callout uses the
same `billService.postWithImmediatePayment(bundle)` domain service
as the automated path. Manual differs from automated in **how the
bundle was proposed** (human-authored Four Questions vs
classifier-routed extraction), not in **what commits to the
ledger**.

Specify this explicitly so a downstream implementer doesn't post a
direct generic journal entry that bypasses the bill / payment
subledger. A direct `Dr Expense / Cr Bank` write would skip the
`bills` / `bill_lines` / `payments` / `bill_payment_allocations`
rows, bypass reconciliation-metadata preservation per ADR-0011
§14, and produce a journal entry that looks economically right but
loses subledger detail (AP aging, vendor balance, paid-bills
history) — and the same scenario taken twice (once manual, once
automated) would produce structurally different ledger states. The
rule: **manual and automated born-paid paths produce identical
ledger outcomes**, both running through
`billService.postWithImmediatePayment(bundle)`.

### 12. Bundle types — v1 active set and reserved set

Per ADR-0010 reserved-enum-states discipline, the `bundle_type` enum
has a closed full membership shipped at v1 schema time, with v1
active values emitted by v1 service write paths and reserved values
defined-but-not-emitted.

**v1 active value:**

- `born_paid_bill` — the born-paid bill bundle. Children:
  `post_bill` followed by `record_bill_payment`. The first concrete
  bundle type; ADR-0015 owns the per-bundle-type child composition
  details.

**Reserved values (ratified by ADR-0015 in Tier 4):**

- `final_invoice_with_applied_deposit` — final invoice arrives, a
  prior `vendor_prepayment` row applies. Children include the bill
  posting and the prepayment-application mutation, with a balance-
  check sub-rule that the prepayment has remaining balance sufficient
  for the application amount. Reserved at v1 schema time.
- `vendor_credit_applied_to_bill` — bill posting alongside the
  application of an existing vendor credit. Reserved at v1 schema
  time.

**Other reserved candidates** (named here for forward-pointing; their
schema reservation lands when their respective ADRs scope, not in
v1):

- `intercompany_due_to_due_from` — intercompany bundles posting
  matched due-to / due-from entries across legal entities. Post-v1.
- `multi_entity_payment_split` — a payment that benefits multiple
  legal entities, splitting allocation by entity. Post-v1.
- `vendor_credit_with_refund` — vendor credit that is refunded as
  cash rather than applied to a future bill. Post-v1.

ADR-0012 names the discriminator (`bundle_type`) and the v1 active
value (`born_paid_bill`). **Per-bundle-type child-mutation
composition** — which `ProposedMutation` types compose each
`bundle_type`, in what order, with what per-child stale-state rules
— lives in **ADR-0015**. ADR-0012 is the mechanism; ADR-0015 picks
which bundle types ship in v1 and what their children look like.

### 13. Approval gate framework

Bundle approval gates inherit from ADR-0007 Tier 1 commit-time
confirmation discipline. For v1, **`born_paid_bill` is Always Confirm**
per reframe spec §11 — auto-post is deferred past v1 and the deferral
applies to bundles. Every born-paid bundle in v1 flows through human
approval on the ProposedBundleCard.

Q60 (born-paid approval rules — clean-approval-count thresholds,
vendor-rule applicability, controller authority for promotion) lands
in:

- **ADR-0015 v1 portion** — what the v1 approval rules look like
  (Always Confirm).
- **ADR-0017 post-v1 portion** — auto-post calibration (the
  `clean_approval_count` column on `vendor_rules`, promotion
  thresholds, vendor-rule promotion authority).

**ADR-0012 closes the framework**, not the per-bundle-type rules.
The framework: bundles inherit per-child approval gates;
`bundle_effective_ceiling` is the max of child ceilings (§9); the
bundle approval gate fires at the bundle-effective level; auto-post
calibration for any bundle type is owned by ADR-0017 post-v1.

A future contributor proposing auto-post for any bundle type in v1
is proposing a deviation from reframe spec §11 — the deferral is
explicit and applies to bundles equally with single-mutation
proposals.

## Consequences

### What this enables

- **Born-paid bills ship in v1 with mechanical all-or-nothing
  guarantees.** Postgres ROLLBACK is the load-bearing safety
  property; service-layer code wraps the orchestration but cannot
  weaken it.
- **Bundle types are extensible without ADR-0012 amendment.**
  Reserved values ship in the enum at v1; ADR-0015 (or post-v1
  successors) promotes them to active without touching the bundle
  envelope. New bundle types extend linearly.
- **The Logic Receipt is a single audit event.** Auditors get one
  event per bundle commit with nested per-child detail; the
  fallback (per-child events with `bundle_id`) preserves the same
  information if the existing audit-log shape forces it.
- **The user sees one ProposedBundleCard.** Aggregate Four
  Questions grammar collapses N children into one approval
  decision; bundle UI complexity stays at the rendering layer.
- **Composition-bypass is mechanically prevented.** The
  bundle-effective-ceiling rule (§9) closes the failure mode where
  a bundle hides a high-ceiling child among low-ceiling siblings.
- **Manual and automated paths cannot drift.** Both run through
  `billService.postWithImmediatePayment(bundle)` (§11), preventing
  the failure mode where manual workflows post directly and bypass
  the subledger structure downstream reporting depends on.

### What this constrains

- **Saga-with-compensating-reversals is rejected for v1** with a
  named future-reopening condition (cross-org / cross-provider /
  async external-payment). See Alternative 1.
- **Children are ProposedMutations only.** A bundle including a
  `ProposedAttachment` child mixes two commit paths and is
  rejected; §2.
- **Bundle-effective-ceiling = max(child ceilings) is
  non-negotiable.** No averaging, discounting, or
  bundle-type-metadata override is permitted; §9.
- **Per-bundle-type composition is owned by ADR-0015.**
  Activating a reserved bundle type in v1 is an ADR-0015
  amendment, not an ADR-0012 amendment.
- **Auto-post calibration for bundles is owned by ADR-0017.** §13.
- **Pre-commit and post-commit paths cannot be conflated.**
  Reversal is post-commit per ADR-0001; rollback is pre-commit per
  Postgres. The audit-log shape distinguishes them.

### What this costs

- One `bundle_idempotency_key` column and one `(org_id,
  bundle_idempotency_key)` constraint, parallel to the existing
  `ai_actions` `(org_id, idempotency_key)` pattern.
- A bundle-level audit-event vocabulary (`bundle_proposed`,
  `bundle_approved`, `bundle_committed`,
  `bundle_commit_attempt_failed`, `bundle_voided`,
  `bundle_rejected`) routed through the canonical audit-log
  writer.
- A new ProposedBundleCard rendering surface implementing
  aggregate Four Questions grammar.
- Integration tests for transactional rollback — fail one child
  (period lock, bank-detail-confirmation flipped, balance check
  fail) and verify zero journal entries land.
- A coupling between the bundle service and the per-mutation
  ceiling resolver so `max(child ceilings)` can be computed at
  proposal time.

## Closes

This ADR closes the following questions from
`docs/02_specs/open_questions.md`:

- **Q58 — ProposedMutationBundle atomicity at the DB transaction
  layer.** Resolution: single-transaction enforcement (option a, not
  saga). All children commit inside one Postgres transaction wrapped
  in `withInvariants()`; either the whole transaction commits or
  Postgres ROLLBACK leaves no trace. No partial commits. No saga;
  saga is hard-rejected for v1 (see Alternatives). Logic Receipt
  represents bundle children as an ordered array with per-child
  `input_hash` / `output_hash` / `pipeline_trace` /
  `ledger_operation_ids` / `invariant_results` inside one bundle-
  level INV-AGENT-002 event (preferred) or per-child events linked
  by `bundle_id` plus a bundle summary event (acceptable fallback).

## Forward-pointed (do NOT close in this ADR)

The following questions are bundle-adjacent but are forward-pointed
to a downstream ADR; ADR-0012 cites them but does not close them:

- **Q60** (born-paid bill bundle approval gate) — v1 portion lands
  in **ADR-0015** (clean-approval-count, vendor-rule applicability,
  controller authority); post-v1 portion lands in **ADR-0017**
  (auto-post calibration, promotion thresholds). ADR-0012 closes the
  framework (bundle-effective-ceiling = max child ceiling); specific
  approval rules per `bundle_type` live in the receiving ADRs.

- **Q78** (payment failure / reversal lifecycle) — for bundle children
  that have already committed when the payment subsequently fails
  (wire bounced, ACH returned, card disputed). Lands in **ADR-0015
  v1 portion** (paid → failed → bill returns to approved_for_payment
  via reversal entry; the ledger semantics of failure;
  proposal-and-confirm vs auto-reverse) and **ADR-0001 reversal
  mechanics** (reversal-as-mirror discipline). ADR-0012 names the
  pre-commit-vs-post-commit distinction (§8) and forward-points the
  post-commit reversal lifecycle to the receiving ADRs.

## Cross-reference (already updated by ADR-0007, do NOT re-update)

- **Q77** — Q28 expansion scope. Already updated by ADR-0007;
  remains open until the expanded Q28 matrix in
  `docs/02_specs/agent_architecture_policy.md` ratifies. ADR-0012 is
  the authoritative source for surface 4 (bundle re-verification)
  referenced in `agent_architecture_policy.md` §2.4. Cross-reference
  only; ADR-0012 does not re-update Q77.

## Updates

None.

(Note for future ADR writers: `agent_architecture_policy.md` §4's
"ADR-0012 forthcoming" status marker becomes "ADR-0012 ratified
[date]" at D3 ratification per Phase 0 governance plan Decision 3.
That is a one-line follow-up at D3 time, not an `## Updates` entry
in this ADR.)

## Alternatives considered

### Alternative 1 — Saga with compensating reversals

**Rejected — hard rejection for v1.** A saga splits the bundle into
multiple sequential transactions, with each child's commit followed
by a compensating-reversal step that rolls back already-committed
children if a later child fails. Standard in
distributed-transaction literature for cases where a single
transaction is impossible (cross-database commits, external API
calls to non-transactional services).

The architectural cost: a saga creates a **second failure mode** —
the compensating reversal can itself fail. If child 1 commits, child
2 fails, and the compensation for child 1 then fails, child 1's
effects are visible and have to be manually corrected. The
reasoning surface goes from two states (succeeded / rolled back) to
three (succeeded / fully-compensated / partially-compensated). The
third state produces ledger inconsistencies that look right but are
wrong; auditors spend hours reconstructing the actual sequence.
Single-DB-transaction enforcement has no third state.

**Future-reopening condition.** A future ADR may reconsider saga
semantics only for **cross-org, cross-provider, or async external-
payment bundles where a single DB transaction cannot cover the
whole operation**. Examples of triggers: children belonging to
different `org_id` scopes; a write to a non-Postgres backing store
alongside a ledger commit; async payment-gateway callbacks where
the ledger transaction cannot block waiting for confirmation. None
of these apply to v1; v1 born-paid bundles are single-org,
single-database, and synchronous.

### Alternative 2 — Flatten bundles into single composite ProposedMutations

**Rejected.** Collapsing every multi-mutation workflow into one
larger ProposedMutation whose `delta` carries multiple journal
entries violates the one-mutation-equals-one-journal-entry shape
`intent_model.md` §3 establishes. `ProposedMutation.delta` carries
one before/after state and one set of affected accounts;
flattening would require redefining the delta shape and propagate
through every consumer (audit log shape, ProposedEntryCard
rendering, Logic Receipt extraction). The bundle envelope is the
cleaner separation: a bundle is a collection of mutations; a
mutation is one ledger-touching change.

### Alternative 3 — Per-child transactions with application-level rollback

**Rejected.** Each child commits in its own DB transaction; the
bundle service tracks success/failure and manually issues reversal
entries for already-committed children if a later child fails. This
is Alternative 1 reframed: same three-state failure mode, plus the
added cost that "manually issuing reversal entries" routes through
ADR-0001 reversal-as-mirror discipline — the application now writes
reversal entries inside its own error-handling code, making the
failure path itself a state-mutation path that can fail. Single-DB-
transaction avoids all of this.

### Alternative 4 — Bundle children include ProposedAttachments

**Rejected.** The §2 exclusion rule. Bundling a polymorphic-link
write with ledger writes inside the same transaction conflates two
commit paths with different invariant scopes (ledger writes
participate in INV-LEDGER-001 / 002 and the AP-nets-to-zero check;
polymorphic-link writes participate in ADR-0011 §4 service-layer
integrity validation). A failed link-write would roll back the
ledger writes — a coupling that serves no safety property since
the link write is contingent on the ledger commit, not an atomic
peer of it. Clean separation: bundle commits ledger writes
atomically; post-commit attachment failures route to the exception
queue per ADR-0011 §13.

## Cross-references

- **ADR-0001** (`0001-reversal-semantics.md`) — post-commit
  reversal/correction mechanics. Cited by §5 (lifecycle —
  Posted → Voided / Reversed transitions), §8 (post-commit reversal
  path uses reversal-as-mirror discipline), §13 (per-child reversal
  is an individual ledger operation per ADR-0001), and Alternative 3
  (the rejected per-child-transactions path's reversal mechanics).
- **ADR-0007** (`0007-three-tier-agent-architecture.md`) — Tier 1
  commit-path inheritance (every bundle commit happens at Tier 1
  inside `withInvariants()`); Q28 surface 4 inheritance (bundle
  re-verification framing); Q30 pipeline_trace (per-child trace
  records in the Logic Receipt). Carried prerequisite for this ADR.
- **ADR-0010** (`0010-reserved-enum-states.md`) — applied to the
  `bundle_type` enum (§12 — `born_paid_bill` active in v1; reserved
  set defined-but-not-emitted per the discipline).
- **ADR-0011** (`0011-document-platform.md`) — spine; handoff
  vocabulary (§7 ProposedMutationBundle handoff); Reading B
  preservation (§8 three-layer separation; ADR-0012 inherits
  verbatim); canonical audit-log writer per §1; ProposedAttachment
  exclusion rationale (§7 — bundles compose ProposedMutations only,
  not ProposedAttachments). Carried prerequisite for this ADR.
- **ADR-0013** (forthcoming, Tier 3 — `storage-provider.md`) —
  parallel within Tier 3. No inheritance either direction.
  Cross-referenced for completeness.
- **ADR-0014** (forthcoming, Tier 3 — `tier-2-document-pipeline.md`)
  — parallel within Tier 3. No inheritance either direction.
  Cross-referenced for completeness.
- **ADR-0015** (forthcoming, Tier 4 — `ap-spend-subdomain.md`) —
  receives per-bundle-type child-mutation composition deferral
  (§12); receives Q60 v1 portion (born-paid approval rules);
  receives Q78 v1 portion (payment failure lifecycle); owns
  `final_invoice_with_applied_deposit` and
  `vendor_credit_applied_to_bill` activation; owns the per-bundle-
  type net-account specification (§7); owns
  `billService.postWithImmediatePayment()` orchestration (§3, §11);
  owns the `payments` schema with reconciliation-metadata
  preservation (per ADR-0011 §14).
- **ADR-0017** (forthcoming, Tier 4 —
  `vendor-template-substrate-reservation.md`) — receives auto-post
  calibration deferral (§13); owns `clean_approval_count`,
  promotion thresholds, vendor-rule promotion authority post-v1.
- **ADR-0019** (forthcoming, Tier 6 — `confidence-calibration-policy.md`)
  — confidence threshold deferral if a bundle classifier emits
  per-bundle-type confidence; cross-referenced for completeness.
- **`docs/02_specs/intent_model.md`** — `ProposedMutation` shape
  (§3); Four Questions grammar (§5). ProposedMutationBundle rides
  Primitive 1 (Proposal) per spec §20 with composite payload — no
  new primitive.
- **`docs/02_specs/mutation_lifecycle.md`** — six canonical states
  (Pending / Needs Attention / Approved / Posted / Voided /
  Reversed). Bundle lifecycle reuses these states unchanged (§5).
- **`docs/02_specs/ledger_truth_model.md`** — Service Communication
  Rules; `withInvariants()` discipline; trace_id + idempotency_key
  pattern; INV-LEDGER-001 (per-child balance enforced at Layer 1a);
  INV-LEDGER-002 (period-lock trigger fires per child during
  INSERT); INV-AUDIT-001 (audit-log row in same transaction).
- **`docs/02_specs/agent_autonomy_model.md`** §6 — System ceiling
  list. Cited by §9 (composition-ceiling discipline; vendor
  bank-detail rule per §6 Item 2 — Always Confirm / System
  ceiling).
- **`docs/02_specs/agent_architecture_policy.md`** — Q28 matrix
  authoritative source for surfaces 1–3; ADR-0012 is the
  authoritative source for surface 4 (bundle re-verification)
  referenced in §2.4 and §4 of that file.
- **`docs/02_specs/invariants.md`** — INV-LEDGER-001..006
  (per-child invariants fire inside the bundle transaction);
  INV-AGENT-001 (no auto-post across System ceilings — bundles
  inherit); INV-AGENT-002 (every auto-post produces a Logic Receipt
  — bundles produce a single bundle-level receipt per §6, with the
  per-child fallback if forced by implementation).
- **`docs/09_briefs/phase-2/document_platform_reframe_design.md`** —
  §7 (ADR-0012 absorbs Bundle Atomicity); §11 (auto-post deferred
  past v1); §12 (Q28 surface 4 framing); §14 (ProposedAttachment
  is NOT a bundle child); §15 (born-paid receipt matrix; manual
  born-paid workflow callout — manual + automated paths use the
  same `billService.postWithImmediatePayment(...)`); §16 (lifecycle
  immutability rules); §18 (scenario categories — born-paid sits in
  the receipts category).

## Notes for future ADR writers

- **Saga rejection + future-reopening condition.** Saga is
  hard-rejected for v1; the three-state failure mode (succeeded /
  fully-compensated / partially-compensated) is harder to reason
  about than transactional rollback's two-state failure mode.
  Reopening is permitted only for cross-org, cross-provider, or
  async external-payment bundles where a single DB transaction
  cannot cover the whole operation (Alternative 1 names the
  triggers). A saga proposal that does not match one of those
  triggers is misplaced and should be re-scoped to fit
  single-transaction enforcement.

- **Children-are-ProposedMutations-only.** The §2 exclusion is
  mechanical, not conventional. A bundle that includes a
  `ProposedAttachment` child mixes two commit paths with different
  invariant scopes — the link write is contingent on the ledger
  commit, not an atomic peer. The rule is bundle-specific and is
  not subsumed by ADR-0011's general Reading B separation.

- **Bundle-effective-ceiling = max(child ceilings).** §9's
  composition-bypass prevention rule must stay mechanical. A
  "smart" formula (averaging, discounting for trusted types,
  overriding by `bundle_type` metadata) is a composition-bypass
  vulnerability. The hazard is real: a born-paid-bundle classifier
  could plausibly include an `update_vendor` mutation that flips
  bank-detail (System ceiling per `agent_autonomy_model.md` §6 Item
  2) as a side-effect of vendor-master extraction. The max-of-child-
  ceilings rule blocks that path.

- **AP-nets-to-zero generic phrasing — debit side is child/domain
  logic owned by ADR-0015.** ADR-0012 specifies that the AP control
  account nets to zero for born-paid bills (§7) but does not
  hardcode "Dr Expense / Cr Bank." The debit side (Expense /
  Tax-Recoverable / Asset / Prepaid / Inventory across one or more
  bill lines, with department / project allocations) and the
  credit side (Bank or Credit Card Liability) are owned by
  child-mutation logic per ADR-0015. ADR-0012 is the mechanism;
  ADR-0015 is the policy.

- **Pre-commit / post-commit distinction is load-bearing.**
  Pre-commit failure rolls back via Postgres — no journal entries
  land, no reversal entry is created. Post-commit reversal follows
  ADR-0001 — a new `journal_entries` row with
  `reverses_journal_entry_id` FK and non-empty `reversal_reason`.
  The audit-log shape distinguishes the two
  (`bundle_commit_attempt_failed` vs `bundle_voided` / reversal
  events); future implementations preserve the distinction.
