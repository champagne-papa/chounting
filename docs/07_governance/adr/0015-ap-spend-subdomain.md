# ADR-0015: AP/Spend Subdomain — Vendor Prepayments, Born-Paid Bundle Approval, Tax Timing, Vendor Balance, Backfill, Receipt v1, Payment Failure Lifecycle

## Status

Ratified 2026-05-04 by CTO with named follow-ups per D4 ratification package §3.1.

## Date

2026-05-03

## Triggered by

Phase 0 governance plan Task C7 (Tier 4 — depends on ADR-0011
ratification 2026-05-03, ADR-0012 ratification 2026-05-03,
ADR-0013 ratification 2026-05-03, ADR-0014 ratification
2026-05-03, ADR-0007 ratification 2026-05-03, and the Layer-4
amendment at commit `84691d5` registering INV-AGENT-006 + §6 row 7
of `agent_autonomy_model.md`). The 2026-05-02 Document Platform
reframe spec (`docs/09_briefs/phase-2/document_platform_reframe_design.md`)
named AP/Spend Subdomain as the seventh ADR in the eight-ADR
Phase 0 set per §7. ADR-0011 ratified 2026-05-03 and
forward-pointed Q59, Q60 (v1 portion), Q61, Q62, Q63, Q64, Q74
(AP/Spend domain rows portion), and Q78 to this ADR per ADR-0011
§Forward-pointed and Cross-references entries. ADR-0012 ratified
2026-05-03 with §12 reserving the `final_invoice_with_applied_deposit`
and `vendor_credit_applied_to_bill` `bundle_type` enum values for
ADR-0015 to activate; §7 defers per-bundle-type net-account
specification to ADR-0015; §13 defers Q60 v1-portion approval rules
to ADR-0015 and Q60 post-v1 portion to ADR-0017. ADR-0014 ratified
2026-05-03 closing the OCR/pipeline-rows portion of Q74; this ADR
closes the AP/Spend domain-rows portion of Q74 forward-pointed by
ADR-0014.

ADR-0015 carries one mechanism — the AP/Spend subdomain — and a
small suite of specifications attached to that mechanism: the
vendor prepayment object shape and lifecycle (Q59), the v1
born-paid bill bundle approval gate (Q60 v1-portion only,
post-v1 forward-pointed to ADR-0017), the bifurcated vendor
prepayment approval gate (Q61), deposit / retainer tax-timing
defaults and overrides (Q62), the vendor balance view composition
for v1 reporting (Q63), the routing of final invoices that
reference deposits not previously captured in CHOUnting (Q64),
the AP/Spend domain-rows portion of the receipt v1 path (Q74) —
born-paid bundle workflow, manual workflow, and Scenario A/B/C
lifecycle — and the payment failure / reversal lifecycle (Q78,
proposal-and-confirm and **NOT** auto-reverse, per Reading B).

## Context

### Why an AP/Spend Subdomain ADR exists

ADR-0011 §1 established the Document Platform as a substrate that
proposes; domain services as the consumers that produce ledger
operations; the ledger service as the sole writer of journal
entries per Reading B. AP/Spend is the **first domain consumer**
of the Document Platform. The substrate ADRs (ADR-0011, ADR-0012,
ADR-0013, ADR-0014) collectively shape what the platform produces;
ADR-0015 specifies what the AP/Spend domain consumes from those
proposals and how it commits.

The reframe spec §3.2 enumerated AP/Spend's domain surface: AP
foundation (manual bill creation, payment approval queue, payment
recording, AP aging, open bills, vendor balance, paid-bills
history); the new vendor prepayment / deposit / retainer
subdomain; vendor credits; receipts and born-paid bills; payment
evidence attachments; vendor master mutations (with vendor
bank-detail change as a System ceiling per INV-AGENT-006); the
`payment_purpose` discriminator; and Spend-domain reporting.
ADR-0015 is the first ADR that activates these workflows under the
substrate ADRs and closes the eight Q-numbers gating v1 ship of
the Spend Initiative brief.

### Phase 0 dependency context and Reading B preservation

ADR-0015 sits in Tier 4 alongside ADR-0016 (Document Relationship
Graph) and ADR-0017 (Vendor Template substrate). All three depend
on ADR-0011 (the spine — entity ownership, `source_documents`
schema, `source_document_links` discipline, exception-queue routing,
audit-log writer boundary, lifecycle immutability, vendor-matcher
read boundary, document-type discriminator, ProposedAttachment
contract); on ADR-0012 (bundle envelope, atomicity, lifecycle
vocabulary, Q28 surface 4 bundle re-verification, bundle-effective
ceiling = max child ceilings); on ADR-0013 (storage provider
abstraction, drift detection, integrity policy); on ADR-0014 (Tier
2 pipeline, OCR engine, classification, replay/dedup/vendor-matcher
implementation); and on ADR-0007 (three-tier agent architecture)
as a carried prerequisite. ADR-0015 inherits the upstream
contracts verbatim and does not re-litigate any upstream decision.

ADR-0015 is bookended in Tier 4 by ADR-0016 (the document
relationship graph that gives ADR-0015 the link-role enum to
attach receipts, payments, prepayment-applications, and
credit-applications to bills) and ADR-0017 (the vendor-template
substrate that holds the post-v1 calibration column for born-paid
bundle promotion per Q60 post-v1 portion). ADR-0015 cites both as
forward-pointers but does not depend on either ratifying first;
the Tier 4 trio ratifies as a package.

Per ADR-0011 §8 and Reading B from `ledger_truth_model.md` Service
Communication Rules: domain services own domain logic; the ledger
service is the sole writer of `journal_entries` and `journal_lines`;
both run inside `withInvariants()` per Service Communication
Rule 1. ADR-0015 inherits this as a non-negotiable architectural
constraint. Every commit path described below — born-paid bundle,
manual born-paid workflow, vendor prepayment recording, vendor
prepayment application, vendor credit posting, vendor credit
application, payment failure reversal — routes through a domain
service that produces ledger operations via `ledgerService.post(...)`.
No AP/Spend code path writes to `journal_entries` directly; no
AP/Spend code path bypasses the ledger service; no AP/Spend code
path auto-reverses on its own initiative.

### What ADR-0011 / ADR-0012 / ADR-0013 / ADR-0014 already nailed down (do not redraft)

- **ADR-0011 §1** — entity ownership boundary. AP/Spend owns
  `bills`, `bill_lines`, `payments`, `bill_payment_allocations`,
  `vendor_prepayments`, `vendor_prepayment_applications`,
  `vendor_credits`, `vendor_credit_applications`, and `vendors`.
  Document Platform owns `source_documents`, `source_document_links`,
  `document_cases`, and the rest of the substrate. Ledger service
  owns `journal_entries` and `journal_lines`. ADR-0015 inherits
  this split verbatim.
- **ADR-0011 §7** — `ProposedMutation` / `ProposedMutationBundle`
  / `ProposedAttachment` handoff vocabulary. ADR-0015 consumes all
  three at the domain-service entry points; AP/Spend does not
  introduce a fourth proposal primitive.
- **ADR-0011 §11** — vendor-matcher read boundary inherited from
  ADR-0007. The Tier 2 vendor matcher reads vendor
  identity-and-matching fields ONLY. The Relationship Router at
  Tier 2.5 may read vendor control / payment-risk fields when
  producing payment-readiness candidates. **Tier 1 re-verifies all
  vendor-control fields at commit.** The System ceiling rule for
  vendor bank-detail changes per INV-AGENT-006 / `agent_autonomy_model.md`
  §6 row 7 governs vendor master mutations regardless of rung,
  limit, or rule maturity.
- **ADR-0011 §15** — `DOC` invariant prefix introduction.
  INV-DOC-001 (evidence-completeness) reserves controller-override
  on bills without a `primary_invoice` link role. ADR-0015 ships
  the schema-level seat (`override_evidence_completeness` flag on
  `bills`) and consumes the platform-side invariant for the
  service-layer enforcement at `billService.post()`.
- **ADR-0012 §1 + §3** — bundle shape (typed envelope, ordered
  children, declared atomicity = `single_db_transaction`); Postgres
  ROLLBACK is the mechanical all-or-nothing guarantee.
- **ADR-0012 §5** — bundle lifecycle uses canonical
  `mutation_lifecycle.md` states. ADR-0015 inherits the canonical
  states verbatim and adds the `failed` payment-state value (Q78)
  which is **payment-state, not mutation-lifecycle state** —
  details in §10 below.
- **ADR-0012 §7** — Q28 Surface 4 bundle re-verification. ADR-0012
  states the generic "AP nets to zero" rule; ADR-0015 owns the
  per-bundle-type net-account specification per §6 below.
- **ADR-0012 §9** — bundle-effective ceiling = max(child
  ceilings); vendor bank-detail change is a separate System-ceiling
  proposal, not a bundle child. ADR-0015 inherits this verbatim.
- **ADR-0012 §11** — manual born-paid path runs through the same
  `billService.postWithImmediatePayment(bundle)` as the automated
  path. ADR-0015 inherits this verbatim and specifies the manual
  workflow path against the same domain service.
- **ADR-0012 §12** — `bundle_type` enum membership. v1 active
  value: `born_paid_bill`. Reserved (ratified by ADR-0015 in Tier
  4): `final_invoice_with_applied_deposit` and
  `vendor_credit_applied_to_bill`. ADR-0015 names per-bundle-type
  child composition per §6 below; reserved bundle types remain
  reserved at v1 even though their composition is specified here.
- **ADR-0013 §1** — `storageProviderService` interface. AP/Spend
  reads no bytes directly; payment-evidence rendering and
  ProposedAttachment commits route through the platform service
  layer.
- **ADR-0014 §11** — pipeline output → ProposedMutation /
  ProposedMutationBundle / ProposedAttachment routing. ADR-0014
  ships the routing logic against the AP/Spend variant set
  enumerated below; ADR-0015 owns the consumer side.

### Reading B as load-bearing constraint for ADR-0015

Reading B is the single most important architectural constraint
on ADR-0015. The reframe spec §5 named Reading B as the canonical
service architecture; ADR-0011 §8 codified it as the three-layer
separation (Document Platform proposes; domain services produce
ledger operations; ledger service writes). ADR-0015 is the first
domain ADR — it is the place where Reading B either holds at the
domain layer or breaks. Specifically, Q78 (payment failure /
reversal lifecycle) introduces a hazard: a naive implementation
might wire the AP/Spend payment service to **auto-reverse** when a
payment provider returns a failed-wire / NSF / chargeback signal.
Auto-reverse is rejected as a Reading B violation. Per the Service
Communication Rules in `ledger_truth_model.md`: the ledger service
is the sole writer of journal entries. The agent (or any
Spend-domain service detecting the failure signal) **proposes** a
reversal via a `ProposedMutation`; the ledger service applies its
invariants and writes inside `withInvariants()`. The §10 closure
of Q78 below states this discipline explicitly inline; the
Alternatives section records the auto-reverse rejection in full.

## Decision

The Decision is presented as eleven items. Items 1–8 are the
substantive Q-closures (Q59, Q60 v1-portion, Q61, Q62, Q63, Q64,
Q74 domain-rows portion, Q78). Item 9 covers vendor master
integration with INV-AGENT-006. Item 10 covers schema deltas. Item
11 covers reserved enums and audit events.

### 1. Vendor prepayment object shape (Q59 closure)

The `vendor_prepayments` table is the AP/Spend-owned record of any
cash that has left the bank for a vendor purpose **before** a
final invoice exists. It is the load-bearing primitive for
retainers, deposits, and advances; it links to a future final
invoice via `vendor_prepayment_applications` rows.

**Schema shape (new — owned by ADR-0015).**

```
vendor_prepayments (
  id                          uuid primary key,
  org_id                      uuid not null references orgs,
  legal_entity_id             uuid null references legal_entities,    -- ADR-0011 §10 reservation
  vendor_id                   uuid not null references vendors,
  prepayment_type             vendor_prepayment_type not null,        -- closed enum, see below
  status                      vendor_prepayment_status not null,      -- closed enum, see below
  payment_id                  uuid not null references payments,      -- the cash-out movement
  amount_original             money_amount not null,
  amount_cad                  money_amount not null,
  fx_rate                     fx_rate null,
  currency                    text not null,
  recognized_at               date not null,                          -- when the prepayment was recorded
  expected_application_date   date null,                              -- optional; when invoice is expected
  tax_timing_choice           tax_timing_choice not null,             -- see Q62 closure (item 4)
  tax_amount_at_payment       money_amount null,                      -- recoverable tax recognized at payment, if any
  description                 text null,
  created_at                  timestamptz not null default now(),
  created_by                  text not null,                          -- 'agent' or user_id
  trace_id                    uuid not null
);

vendor_prepayment_applications (
  id                          uuid primary key,
  org_id                      uuid not null references orgs,
  vendor_prepayment_id        uuid not null references vendor_prepayments,
  bill_id                     uuid not null references bills,
  amount_original             money_amount not null,
  amount_cad                  money_amount not null,
  applied_at                  date not null,
  created_at                  timestamptz not null default now(),
  created_by                  text not null,
  trace_id                    uuid not null
);
```

**Closed enum: `vendor_prepayment_type`.** Per ADR-0010
reserved-enum-states discipline. Full membership at v1 schema time:
`retainer`, `deposit`, `advance`, `security_deposit`,
`prepaid_service`, `inventory_deposit`, `fixed_asset_deposit`,
`other`. **v1 active subset:** `retainer`, `deposit`, `advance`,
`other`. Reserved values (`security_deposit`, `prepaid_service`,
`inventory_deposit`, `fixed_asset_deposit`) ship in the enum at v1
schema time per ADR-0010 — defined-but-not-emitted by any v1
service write path. Activation lands when their respective
post-v1 workflow briefs scope.

The four v1 active types correspond to the Spend brief's
recognized prepayment shapes: a **retainer** is a vendor-held
asset against future services (often professional-services
engagements); a **deposit** is a partial down-payment against a
specific future invoice (deposit on a build, deposit on equipment
order); an **advance** is cash paid forward against undefined
future work; **other** absorbs prepayment-shaped cases that don't
fit the first three categorizations cleanly.

**Closed enum: `vendor_prepayment_status`.** Per ADR-0010
discipline. Full membership at v1 schema time: `open`,
`partially_applied`, `fully_applied`, `refunded`, `written_off`,
`forfeited`. **v1 active subset:** `open`, `partially_applied`,
`fully_applied`, `refunded`. Reserved (`written_off`, `forfeited`)
defer activation to a post-v1 workflow brief covering write-off and
forfeiture rules; v1 cases that conceptually correspond to those
states route through manual ledger entries with controller-stamped
audit reasons.

**Payment-purpose discriminator linkage.** The cash-out movement
that creates a vendor_prepayment row is a `payments` row with
`payment_purpose = vendor_prepayment` (per the closed
`payment_purpose` enum on `payments` introduced in §10 schema
deltas below). The link is enforced at the service layer:
`vendorPrepaymentService.create()` validates that the referenced
`payment_id` carries `payment_purpose = vendor_prepayment` before
inserting the prepayment row. A `payments` row's `payment_purpose`
is immutable post-insert (Layer 1 CHECK); changing the meaning of
a recorded payment requires reversing the original payment and
recording a new one with the corrected `payment_purpose`.

**`payment_purpose` per-flow assignment.** The four v1 active
values (`bill_payment`, `vendor_prepayment`, `vendor_refund`,
`other`) bind to specific flow paths: `bill_payment` is the
default for `paymentService.record(bill_id, ...)` (the canonical
bill-payment flow per item 7 Scenario B); `vendor_prepayment` is
the value emitted by `vendorPrepaymentService.create()` per the
discriminator linkage above; `vendor_refund` is the value emitted
by the refund flow on `vendorPrepaymentService.refund(...)` (the
refund creates a new `payments` row with negative cash movement
and `payment_purpose = vendor_refund`); `other` is the explicit
controller-stamped value for cash movements that don't fit the
first three (an out-of-scope deposit per item 6 path 2's
`bill_recorded_with_out_of_scope_deposit` audit event may
correspond to a manually-recorded `payments` row with
`payment_purpose = other`). Each flow's `payment_purpose`
emission is governed at Layer 3 by the corresponding service
function; the immutability post-insert (Layer 1 CHECK) prevents
silent reclassification across flows.

**Refund preconditions (Q80 ratification, D4-α v1 disposition; 2026-05-10 amendment).** The v1 `vendorPrepaymentService.refund(...)` mutation rejects when the parent `vendor_prepayments` row has any rows in `vendor_prepayment_applications`. Conservative posture under Reading B (single-purpose-per-mutation: refund concerns the prepayment lifecycle; application reversal concerns the bill lifecycle and belongs to a separate reversal-of-application mutation that does not exist at v1). Cascade semantics (D4-β: refund auto-reverses applications) defer activation to a post-v1 workflow brief covering refund-with-applications mechanics alongside the write-off + forfeiture rules deferral above. v1 cases that conceptually require cascade route through manual application reversal first, then refund. See `docs/07_governance/friction-journal.md` Phase 5 chunk B5-1 closeout retrospective entry (2026-05-10) Adjudication 7 for the disposition history.

**Application logic.** `apply_vendor_prepayment_to_bill` is a
`ProposedMutation` variant that creates a
`vendor_prepayment_applications` row inside the ledger transaction
that posts the corresponding journal entry. The ledger entry shape
depends on the `tax_timing_choice` recorded on the prepayment
(item 4 below). The application's `amount_original` cannot exceed
the prepayment's remaining open balance; the bundle-level
re-verification per ADR-0012 §7 / §10 fires the
`prepayment_remaining_balance_unchanged` stale-state check (per
ADR-0012 §10 — the reserved bundle-types' stale-state check that
activates here).

A vendor_prepayment row's status flips per the application sums:
remaining balance > 0 with no applications = `open`; > 0 with at
least one application = `partially_applied`; = 0 with
applications = `fully_applied`; refund recorded =
`refunded`. Status transitions happen at the service layer inside
the same transaction as the application/refund commit; the schema
holds the value but the transition rules are Layer 2.

### 2. Born-paid bill bundle approval gate — v1 portion (Q60 v1 closure)

Per reframe spec §11 and ADR-0012 §13: **v1 born-paid bundles are
Always Confirm.** Auto-post calibration for `born_paid_bill` is
deferred past v1 to ADR-0017 (Vendor Template substrate). Every
born-paid bundle in v1 — both the manual workflow path
(human-authored Four Questions) and the automated path
(classifier-routed receipt) — flows through the ProposedBundleCard
with a controller approval gate before commit.

**v1 approval rules in detail:**

- **No auto-post for `born_paid_bill` in v1.** Every bundle
  surfaces as Pending (or Needs Attention if a §4 trigger from
  `mutation_lifecycle.md` fires — limit violation, ceiling flag,
  novel pattern, stale-state). Bundle effective ceiling per
  ADR-0012 §9 = max(child ceilings); a born-paid bundle child that
  carries a System-ceiling flag (e.g., a sibling vendor master
  mutation that touches bank details — handled as a separate
  proposal per ADR-0012 §9, **not** a bundle child) does not
  reduce the gate.
- **No vendor-rule applicability for v1 promotion.** A
  `vendor_rules` row may exist for a vendor (per the substrate
  reservation in ADR-0017) but is not consulted by the v1 approval
  gate for promotion of `born_paid_bill`. v1 ignores
  `vendor_rules.clean_approval_count` for bundle promotion; the
  column ships at v1 schema time per ADR-0017 substrate
  reservation, but no v1 service write path reads it for autonomy
  decisions. The full enforcement (clean-approval-count
  thresholds, vendor-rule promotion authority, controller
  promotion ceremonies for bundles) lands in **ADR-0017 post-v1
  portion**.
- **Controller authority for approval.** The bundle approval gate
  fires at the bundle-effective ceiling per ADR-0012 §9. For
  `born_paid_bill` this is the AP-specialist rung
  (`mutation_lifecycle.md` Pending → Approved → Posted (manual)).
  Controller authority is required for any bundle that hits a
  System-ceiling flag (e.g., posting against a locked period,
  intercompany, equity, first-time vendor above floor, or — per
  INV-AGENT-006 — a sibling vendor bank-detail change proposal).
- **Manual workflow uses the same domain service.** Per ADR-0012
  §11 (manual + automated path uniformity for Reading B
  preservation): both paths run through
  `billService.postWithImmediatePayment(bundle)`. The v1 manual
  workflow's user-experience entry point — the controller-authored
  born-paid form per the Spend Initiative brief — produces a
  `ProposedMutationBundle` with the same shape as the automated
  path; the bundle flows through the same approval gate and the
  same commit path. A controller authoring the bundle does NOT
  bypass the Always Confirm gate; the gate exists for the
  automated-path proposals, but the manual-path proposals also
  flow through the ProposedBundleCard so the user-facing review
  surface is consistent and the audit trail records the same
  bundle-level events.

**Forward-pointer to ADR-0017 (post-v1 portion).** The post-v1
calibration — under what specific clean-approval-count threshold
does a vendor's born-paid bundle become eligible for auto-post,
who has authority to promote a vendor's bundle rule from Always
Confirm to Notify & Auto-Post, what's the per-rule rejection-rate
demotion threshold for a promoted bundle rule — lands in
**ADR-0017** (Vendor Template substrate-only v1; full enforcement
post-v1). ADR-0015 closes Q60's v1 portion only and forward-points
the post-v1 portion explicitly. The split was set by ADR-0011
§Forward-pointed Q60 entry and ADR-0012 §13.

### 3. Vendor prepayment approval gate — bifurcated rule (Q61 closure)

The gate bifurcates on **whether cash has already left the bank**
at the time the prepayment proposal is recorded. The bifurcation
hinges on a single discriminator: does the proposal authorize a
future cash movement, or does it classify a cash movement that has
already occurred?

**Future-cash retainer authorization → controller required.** The
controller-required rule fires when the
`record_vendor_prepayment` mutation precedes the bank/card movement
— i.e., the agent (or AP specialist) is proposing that CHOUnting
authorize a payment for a retainer that has not yet been wired,
written by cheque, or charged. This is a payment-authorization
event. It carries the same risk profile as a wire-transfer payment
authorization: cash is about to leave the bank for vendor purposes
on CHOUnting's say-so. The approval gate is **controller-only**
regardless of amount, vendor track record, or rule rung. Bypass
via AP-specialist rung is not permitted. The proposal flows
through the canonical Pending → Approved transition with
controller authentication required at the Approved step.

**After-the-fact retainer classification → controller bypass
allowed.** The bypass-allowed rule fires when the
`record_vendor_prepayment` mutation **follows** the bank/card
movement — i.e., a `payments` row already exists (created by
manual recording, by bank/card statement reconciliation post-v1,
or by an upstream AP foundation cash-recording workflow) and the
proposal classifies that already-recorded payment as a vendor
prepayment rather than a bill payment, owner reimbursement, or
other purpose. This is a classification event, not an
authorization event. The cash has already left the bank; the
classification choice affects the accounting destination
(prepayment vs bill payment vs other) but does not authorize new
cash movement. AP-specialist authority is sufficient for the
classification; controller approval is not required for
after-the-fact classification of an already-recorded payment.

**Discriminator at the service layer.**
`vendorPrepaymentService.create()` receives the proposal payload
with the `payment_id` reference. The service reads the referenced
`payments` row's `created_at` and `recorded_at` (the latter being
the actual cash movement date the payment claims) and the row's
`payment_purpose` value. If the `payments` row does not exist (the
proposal includes a payment-creation child), the proposal is
treated as future-cash authorization; controller required. If the
`payments` row exists with `payment_purpose = unspecified` or
`payment_purpose = bill_payment` and the proposal is to reclassify
it as `vendor_prepayment`, the proposal is after-the-fact
classification; AP-specialist authority is sufficient. The
discriminator is computed in the service layer and surfaced as
`policy_evaluation.required_action = approve` (with controller
ceiling flag) or `approve` (with no ceiling) on the
ProposedMutation per `intent_model.md`.

**Audit treatment.** Both paths emit audit events through the
canonical audit-log writer per ADR-0011 §1. The future-cash
authorization path emits `vendor_prepayment_authorized_future_cash`
with controller_user_id; the after-the-fact path emits
`vendor_prepayment_classified_after_the_fact` with the
classifying_user_id. The two events distinguish the audit history
so a future review can tell which approval pathway each prepayment
took.

### 4. Deposit / retainer tax timing (Q62 closure)

Tax recognition timing for prepayments is a jurisdiction question
with per-org and per-document override surfaces. v1 ships a
three-layer default-and-override system with the resolution rule
explicit at the service layer.

**Resolution rule (computed at proposal time):**

1. **Per-document override** (highest priority). The
   ProposedMutation payload may carry an explicit
   `tax_timing_choice` value chosen by the controller authoring
   the proposal (or by the agent if the document carries an
   explicit timing indication, e.g., a vendor-supplied invoice
   states "GST recognized at deposit payment"). When present, this
   value wins.
2. **Per-org override** (mid priority). Each org may configure a
   default tax-timing policy via `org_settings.deposit_tax_timing_default`
   (reserved column at v1 schema time per ADR-0010 discipline; NOT
   NULL DEFAULT to `review_required`). When the per-document
   override is absent and the per-org default is set to a specific
   value, the per-org value wins.
3. **Jurisdiction default** (low priority). For Canadian orgs, the
   v1-fixed jurisdiction default is `review_required` (no
   automatic recognition; controller must explicitly pick a
   timing). For other jurisdictions, the v1-fixed default is also
   `review_required` (v1 covers Canadian customers; multi-
   jurisdiction tax timing is a post-v1 concern). The
   `review_required` value forces the proposal into Needs
   Attention so the controller picks `at_payment` or
   `at_final_invoice` explicitly before the prepayment commits.

**Closed enum: `tax_timing_choice`.** Per ADR-0010 discipline.
Full membership at v1 schema time: `at_payment`,
`at_final_invoice`, `controller_chooses_per_invoice`,
`review_required`. **v1 active subset:** `at_payment`,
`at_final_invoice`, `review_required`. Reserved
(`controller_chooses_per_invoice`) ships in the enum but is not
emitted by v1 paths; it activates when post-v1 workflow allows
per-final-invoice deferred selection.

The three v1 active values mean:

- **`at_payment`** — recoverable tax (GST/HST/PST) on the
  prepayment is recognized at the time the deposit payment posts.
  The `tax_amount_at_payment` column on `vendor_prepayments` is
  populated; the prepayment posting includes a debit to the
  recoverable-tax control account for the named amount. When the
  final invoice arrives and the prepayment applies, the
  application accounts only for the net (after-tax) prepaid
  portion against the invoice's tax-recoverable line.
- **`at_final_invoice`** — recoverable tax is not recognized at
  prepayment time; `tax_amount_at_payment` is null. The full
  prepayment posts as a non-tax-bearing asset (debit
  prepaid-vendor-asset, credit bank). When the final invoice
  arrives, the recoverable-tax line on the invoice is recognized
  in full at that point and the prepayment applies against the net
  (before-tax) invoice amount.
- **`review_required`** — the prepayment cannot post without
  controller selection of `at_payment` or `at_final_invoice`. The
  proposal sits in Needs Attention with the typed reason
  "deposit/retainer tax timing requires controller selection." The
  controller resolves the proposal by editing the
  `tax_timing_choice` field on the ProposedMutation and
  re-approving; the editing step is itself audited.

**Reasoning trail.** The default is `review_required` because tax
timing is a judgment call with audit consequences (a misclassified
recoverable-tax recognition timing produces a P&L misstatement and
an audit-trail mismatch with vendor records). v1 is conservative;
post-v1 may allow per-org defaults to default away from
`review_required` once vendor-rule learning produces evidence of
per-vendor patterns. The conservative default is the right v1
choice because the "founder + 2 real users" cohort in v1 is small
enough that a controller-resolution gate is operationally
tractable.

### 5. Vendor balance view composition (Q63 closure)

The v1 vendor balance view composes from four components. The
reporting view is computed at read time from the underlying tables
— no materialized vendor balance is maintained as a separate
column on `vendors` (which would create a denormalization-drift
hazard).

**v1 vendor balance composition:**

```
vendor_balance(vendor_id) = open_AP
                          + unapplied_vendor_credits
                          + open_vendor_deposits_and_retainers
                          + accrued_unbilled
```

**`open_AP`** — sum of `bills.amount_due` for `bills.vendor_id =
vendor_id` and `bills.lifecycle_state IN
('approved_for_payment', 'partially_paid')`. Excludes paid bills
(`fully_paid` state) and rejected/voided bills. Excludes bills in
`Pending` or `Needs Attention` states (those are not yet
committed to AP).

**`unapplied_vendor_credits`** — sum of
`vendor_credits.remaining_balance` for
`vendor_credits.vendor_id = vendor_id` and
`vendor_credits.status IN ('open', 'partially_applied')`. The
`remaining_balance` column is computed as `original_amount` minus
sum of `vendor_credit_applications.amount_original` for that
credit. Reported as a **negative contribution** to vendor balance
(an unapplied credit reduces what's owed to the vendor).

**`open_vendor_deposits_and_retainers`** — sum of
`vendor_prepayments.amount_original` minus sum of
`vendor_prepayment_applications.amount_original` for prepayments
where `vendor_prepayments.vendor_id = vendor_id` and
`vendor_prepayments.status IN ('open', 'partially_applied')`.
Reported as a **negative contribution** (an open deposit
represents cash CHOUnting has paid the vendor that has not yet
applied to a bill — the vendor "owes" CHOUnting that amount in
goods or services).

**`accrued_unbilled`** — sum of bills in `Posted` or `Posted
(manual)` lifecycle state but with no `bill_lines.matched_to_vendor_invoice_at`
timestamp set (i.e., AP accruals where CHOUnting has recorded an
expense liability but the vendor has not yet sent the formal
invoice). Reserved for v1 — the accrual workflow is part of the AP
foundation; if Phase 5 ships before the accrual workflow lands,
this component is zero by construction. Reported as a **positive
contribution**.

**Reporting surface.** The v1 vendor balance view ships as a
read-only composite report under `vendorReportService.balance(vendor_id)`.
The result returns the four component sums, the net total, and the
as-of timestamp. The Spend brief's vendor-balance UI surface
renders the four components separately so the controller can see
"open AP $1,200; unapplied credits -$300; open deposits -$500;
accrued unbilled $200; net $600" rather than a single bottom-line
number.

**Net vs partial balance.** The composite view returns both:
`net_balance` (the four-component sum) and `partial_balances`
(named breakouts). UI surfaces that need only the bottom line read
`net_balance`; surfaces that need the breakdown (vendor statement
reconciliation, exception queue routing for vendor-statement
classification per ADR-0011 §13's reserved resolution actions)
read `partial_balances`. The v1-active surface is the breakdown
view; the bottom-line view is reserved for post-v1 dashboard
contexts where the breakdown is too detailed.

### 6. Final invoice with prior deposit not in CHOUnting (Q64 closure)

A final invoice arrives with "$X paid as deposit, balance owing
$Y" but no `vendor_prepayment` row exists in CHOUnting. The
deposit was paid before the org adopted CHOUnting, paid via a
channel that did not ingest, or paid by a different entity (per
ADR-0011 §10 multi-entity reservation).

**v1 routing: route to exception queue with backfill suggestion.**
The classifier (per ADR-0014 §7) detects the "deposit applied"
language and the absence of a matching `vendor_prepayment` row in
CHOUnting (computed via the Relationship Router at Tier 2.5 per
ADR-0007 / ADR-0011 §11 — the Router reads
`vendor_prepayments.remaining_balance` for the matched vendor and
finds no candidate). The classifier emits a typed exception
through the exception queue per ADR-0011 §13 with
`resolution_action = backfill_vendor_prepayment_suggested` (a
**reserved** value per ADR-0010; ADR-0015 specifies the value
shape; full enum membership extension is owned by the exception-
queue resolution-action enum at ADR-0011 §13).

**Why route to exception queue, not silently treat as discount /
vendor credit.** The reframe spec §13 Q64 explicitly rejects
silent discount or vendor-credit treatment. A deposit that exists
in the real world but not in CHOUnting is a **gap** in CHOUnting's
record, not a discount on the invoice. Treating the deposit
amount as a discount (recording the bill at the net `$Y` rather
than the gross `$X + $Y`) misstates the expense; treating it as a
vendor credit (creating a `vendor_credits` row from thin air)
misclassifies a prepayment as a credit, with downstream effect on
the vendor balance composition (item 5 above). The exception
queue route preserves auditable visibility: the controller sees
the gap, has the option to backfill, and the backfill action is
itself audited.

**Resolution paths from the exception queue:**

1. **Backfill the missing prepayment** — controller approves the
   `backfill_vendor_prepayment_suggested` action; the platform
   creates a back-dated `vendor_prepayment` row referencing the
   bank/card transaction (or a controller-stamped manual payment
   row if no bank/card transaction exists in CHOUnting). The
   back-dated prepayment then applies against the final invoice in
   the same workflow. Audit event:
   `vendor_prepayment_backfilled_from_exception` with
   `controller_user_id`, the original missing-deposit context, and
   the resulting prepayment_id.
2. **Treat as out-of-scope / record bill at net** — the
   controller may explicitly choose to record the bill at the net
   amount with an audit-stamped reason ("deposit was paid by
   personal account; treat as out-of-scope"). This is **not** an
   automated path; it requires a controller-stamped reason on the
   bill row. The audit event is `bill_recorded_with_out_of_scope_deposit`.
3. **Defer / leave open** — the controller may leave the
   exception open for future resolution. The exception persists in
   the queue with a reminder cadence (handled by the queue UI per
   ADR-0011 §13).

The default suggestion in the exception-queue UI is path 1
(backfill); paths 2 and 3 require explicit controller action. The
exception routes through ADR-0011's ProposedAttachment exception-
queue surface — the final invoice itself is a `source_document`
that the platform routes through the queue, and the resolution
becomes a `ProposedMutation` (backfill) or a `ProposedAttachment`
(attach to bill at net) per the resolution path chosen.

### 7. Receipt v1 path — AP/Spend domain rows portion (Q74 closure)

ADR-0014 closed the OCR/pipeline-rows portion of Q74 (image
ingestion, image OCR extraction, single-engine OCR, classifier
strategy). ADR-0015 closes the AP/Spend domain-rows portion: the
born-paid bundle workflow (Scenario C), the manual workflow, and
the lifecycle for Scenarios A / B / C from the reframe spec §15
decision matrix.

**Scenario A — Receipt as payment evidence.** The receipt arrives
after a payment is already recorded in CHOUnting. The classifier
identifies the receipt as a `payment_confirmation` document type;
the Relationship Router matches the receipt to the existing
`payments` row by amount, date, vendor, and (when available)
authorization/reference number. The output is a
`ProposedAttachment(attach_payment_evidence)` per ADR-0011 §7. No
ledger mutation — the attachment commit goes through
`documentLinkService.create()` and produces a
`source_document_links` row with `link_role = payment_evidence`.
The bill itself, the payment row, and the journal entries are all
unchanged. v1 active per the reframe spec §15 matrix.

**Scenario B — Receipt as payment trigger.** The receipt arrives
for a bill that is already recorded in CHOUnting but not yet
marked paid. The classifier identifies the receipt as a
`payment_confirmation` or `receipt`; the Relationship Router
matches the receipt to an open bill (`bills.lifecycle_state IN
('approved_for_payment', 'partially_paid')`) by vendor, amount,
date, and supporting context. The output is a
`ProposedMutation(record_bill_payment)` that produces a `payments`
row, a `bill_payment_allocations` row, and the corresponding
journal entry (`Dr AP / Cr Bank-or-Card`) through
`paymentService.record(...)` which routes the ledger operation
through `ledgerService.post(...)` per Reading B. The receipt
itself attaches as `payment_evidence` via the same proposal flow
(the proposal carries both the mutation and the attachment as a
post-commit step per ADR-0012 §2 — attachments are not bundle
children). v1 active per the reframe spec §15 matrix.

**Scenario C — Standalone POS receipt → born-paid bundle.** The
receipt arrives for a vendor purchase with no pre-existing bill
in CHOUnting (a credit-card receipt for office supplies; a
restaurant receipt for a client meal). The classifier identifies
the receipt; the Relationship Router does not find a matching
open bill. **v1 routing: exception queue with manual born-paid
workflow available** per the reframe spec §15 matrix and the
"Manual born-paid workflow" callout. The exception emits a
typed exception through the queue per ADR-0011 §13 with
`resolution_action = manual_born_paid_workflow` (a reserved value
per ADR-0010; full enum membership owned by ADR-0011 §13).

The manual born-paid workflow is the controller-authored path:
the controller opens the exception, reviews the receipt, and
authors a born-paid bundle proposal (the bill side and the
payment side together) using the same `billService.postWithImmediatePayment(bundle)`
domain service that the automated path uses. Per ADR-0012 §11
manual + automated path uniformity, manual differs from
automated only in **how the bundle was proposed** (controller-
authored vs classifier-routed); the commit path is identical.
The v1 manual workflow surfaces the bundle as Pending → Approved
(by the same controller in the same session) → Posted (manual)
→ Finalized via the canonical lifecycle states from
`mutation_lifecycle.md`.

**Reconciliation-metadata preservation requirement (Scenario C
born-paid bundles).** Per the reframe spec §15
"Reconciliation-metadata preservation requirement" callout: v1
born-paid bundles **must** preserve enough metadata on the
resulting `payments` row to support post-v1 bank/card
reconciliation without backfill. The `payments` schema
(item 10 below) carries `payment_method` (already present),
`bank_or_card_last4` (new column on `payments`),
`merchant_identifier` (new), `authorization_reference` (new), and
`statement_appearance_date` (new). The fields are populated by
the receipt extraction (when present in the OCR output) or by
controller manual entry (manual workflow). Without these fields,
post-v1 Banking domain reconciliation per the Domain Boundary Map
(ADR-0011 §14) becomes a backfill operation against records
already in production. ADR-0011 §14 named the cross-domain
contract; ADR-0015 holds the schema-side obligation.

**Lifecycle for Scenarios A / B / C.** All three scenarios use the
canonical `mutation_lifecycle.md` states (Pending, Needs
Attention, Approved, Posted (auto), Posted (manual), Finalized;
Rejected, Rejected-with-reversal). v1 has no auto-post for
`born_paid_bill` (Scenario C) per Q60 v1 closure; Scenarios A
and B follow the same Pending → Approved (Always Confirm v1) →
Posted (manual) → Finalized path under v1 ProposedAttachment and
ProposedMutation rules from ADR-0011 §7. Scenario A's commit is
through `documentLinkService.create()` (no ledger mutation);
Scenario B's commit is through `paymentService.record(...)`
(produces ledger mutation); Scenario C's commit is through
`billService.postWithImmediatePayment(bundle)` (produces bundle
ledger mutation per ADR-0012 §3). Per ADR-0011 §7's
ProposedAttachment v1 approval policy, Scenario A's approval gate
is Always Confirm **except** the user-initiated direct-upload
variant (a controller dragging a receipt directly onto a specific
payment row, where the upload action itself is the implicit
approval); Scenarios B and C are always Always Confirm in v1.

**Forward-pointer to ADR-0014 (already closed for OCR/pipeline
rows).** ADR-0014 owns the rows-already-closed portion of Q74:
image ingestion, image OCR extraction (PaddleOCR engine, Modal
sidecar), single-engine OCR strategy, classifier strategy (Tier A
rule-based + Tier C AI fallback active in v1), AI fallback
contract. ADR-0015 closes only the AP/Spend domain-rows portion.
The split was set by ADR-0011 §Forward-pointed Q74 entry:
"AP/Spend domain rows in ADR-0015; OCR-engine row in ADR-0014."

### 8. Payment failure / reversal lifecycle (Q78 closure) — proposal-and-confirm, NOT auto-reverse (Reading B)

**Reading B compliance is non-negotiable: the ledger service is
the sole writer of journal entries, and payment failure handling
goes through proposal-and-confirm, NOT auto-reverse.** Per
`docs/02_specs/ledger_truth_model.md` Service Communication Rules
(specifically Rule 1 — typed input schemas at the service
boundary; Rule 4 — no free-form data at the boundary) and per
ADR-0011 §8's three-layer separation, the ledger service is the
only caller that inserts into `journal_entries` / `journal_lines`.
Any code path that detects a failed payment signal (a wire
bouncing back, an ACH return, a card chargeback, a cheque NSF,
a bank-side reversal for compliance) must propose a reversal via
a `ProposedMutation`; the ledger service applies its invariants
and writes the reversal entry inside `withInvariants()`.
Auto-reverse — i.e., a Spend-domain or banking-integration path
that writes `journal_entries` rows directly upon receiving a
failure signal — is rejected categorically as a Reading B
violation. The Alternatives section below records the rejection
in full.

**v1 phase decision (ship-or-defer): ship in v1.** The reframe
spec §13 Q78 noted: "the founder + 2 real users will hit payment
failures within months of going live, so the absence of an
explicit path means manual reversal entries that violate Reading
B." v1 ships the payment-failure handling path because the
absence of a structured path forces controllers to author manual
reversal entries through generic journal-entry forms, which
bypasses the bill / payment subledger structure that downstream
reporting depends on. ADR-0011 §11 (manual + automated path
uniformity) anticipated this: the same reasoning that led to
manual born-paid workflows running through
`billService.postWithImmediatePayment(bundle)` applies to
payment-failure reversals — the manual path must produce the same
ledger structure as the future-automated path.

**Failed payment state addition.** A new closed-enum value
`failed` on the `payments.payment_state` column. The full
`payment_state` enum (per ADR-0010 reserved-enum-states
discipline) carries: `pending`, `paid`, `failed`,
`partially_returned`, `refunded`. **v1 active subset:**
`pending`, `paid`, `failed`. Reserved (`partially_returned`,
`refunded`) ship in the enum at v1 schema time but are not
emitted by v1 paths; activation lands in post-v1 workflows
covering partial returns and full refunds.

**`failed` is a payment-state value, NOT a mutation-lifecycle
state.** Per `docs/02_specs/mutation_lifecycle.md`, the canonical
mutation-lifecycle states are Pending, Needs Attention, Approved,
Posted (auto), Posted (manual), Finalized, plus terminal Rejected
and Rejected-with-reversal. The `failed` value lives on the
`payments` row (a domain entity), not on the `ProposedMutation`'s
`lifecycle_state` field. The distinction matters: a payment in
`failed` state is a domain-entity state (the cash movement was
attempted and did not complete); the `ProposedMutation` that
records the failure (the proposal to reverse the original payment
posting) flows through canonical mutation-lifecycle states the
same way any other proposal does. ADR-0015 does NOT amend
`mutation_lifecycle.md`; the canonical mutation-lifecycle vocabulary
is unchanged.

**Transition rules:**

- **`pending → paid`** — the payment posts successfully.
  Standard v1 path.
- **`pending → failed`** — the payment posting itself fails at
  the bank/card backend (rejected at submission, e.g., invalid
  account number caught at wire submission). Post-v1 cases are
  more common (v1 has no automated bank submission); v1's narrow
  case is a controller-authored payment that the controller marks
  as failed before the journal entry posts (in which case the
  proposal exits the lifecycle as Rejected, no `payments` row
  exists, and there is no payment_state to flip). v1 active path
  for this transition is therefore **the post-failure
  reclassification**: a `payments` row that posted successfully
  is later marked `failed` because the bank reversed the
  transaction.
- **`paid → failed`** — the payment posted to the ledger
  successfully (the wire was sent; the cheque was issued; the
  card charge went through), but later returns from the bank/card
  with a failure signal (wire bounced; ACH returned; NSF; card
  chargeback; bank reversal). This is the **load-bearing v1
  transition** — the one Q78 was filed to address.
- **`failed → bill returns to approved_for_payment`** — when a
  `paid → failed` transition fires, the bill that the failed
  payment was applied to needs to return to the
  `approved_for_payment` state so it can be re-paid. The
  `bill_payment_allocations` row that linked the bill to the
  failed payment is reversed; the bill's `lifecycle_state` flips
  back from `partially_paid` (or `fully_paid`) to
  `approved_for_payment`. Both transitions happen via reversal
  entries through `ledgerService.post(...)`, NOT via direct
  `UPDATE` statements on the journal entries (which would violate
  the append-only ledger rule from `ledger_truth_model.md`).

**The proposal-and-confirm flow:**

1. **Failure signal arrives** — a controller manually marks a
   payment as failed (v1 path), or a future banking integration
   detects the failure (post-v1 path). The signal is a typed
   payload at the service-layer boundary per Service Communication
   Rule 4.
2. **`paymentService.proposeFailureReversal(payment_id,
   failure_reason)`** is called. The service constructs a
   `ProposedMutation` of type `reverse_failed_payment` with the
   payload describing: the original `payments` row, the original
   journal entry the payment posted, the bill(s) the payment was
   applied to, the failure reason (free-form text on the
   ProposedMutation `description` field per Service Communication
   Rule 4's free-form text exception for human-readable fields),
   and the proposed reversal-entry shape (mirror of the original
   journal entry per ADR-0001 reversal semantics).
3. **The ProposedMutation flows through the canonical lifecycle
   per `mutation_lifecycle.md`.** v1 is Always Confirm at
   AP-specialist or controller authority (the bundle-effective
   ceiling considers payment-failure-reversal a high-risk
   proposal; the v1 default is controller-required given the
   downstream effect on bill state). The controller reviews the
   ProposedMutation via the standard ProposedEntryCard with the
   Four Questions grammar:
   - **What changed?** The reversal entry's debit/credit table
     (mirrored from the original payment posting); the affected
     bill's lifecycle state transition.
   - **Why?** "Payment failure detected: [failure_reason]."
   - **Track record?** "First time doing this for this vendor /
     payment method" or the rule's history if a per-vendor
     pattern has emerged.
   - **What if I reject?** "The payment will remain in `paid`
     state in CHOUnting; you must record the reversal manually
     through the generic journal entry form, which will not
     update the bill's lifecycle state automatically."
4. **Controller approves.** `paymentService.commitFailureReversal()`
   runs inside `withInvariants()`: the ledger service writes the
   reversal entry per ADR-0001 (a new `journal_entries` row with
   swapped debits/credits, non-empty `reversal_reason`,
   `reverses_journal_entry_id` self-FK); the
   `bill_payment_allocations` row is reversed (the allocation row
   itself is an immutable record per the append-only ledger rule;
   a new allocation row with negative amount lands referencing
   the original); the bill's `lifecycle_state` transitions back to
   `approved_for_payment`; the `payments.payment_state` flips to
   `failed`; the audit log records `payment_failure_reversed`
   with the controller_user_id, original payment_id, reversal
   journal_entry_id, and trace_id. All of these happen inside one
   `withInvariants()` transaction; partial failure rolls back via
   Postgres `ROLLBACK` per ADR-0012 §3 (the failure-reversal
   commit is itself a single-transaction operation, not a
   bundle).

**Why this is NOT auto-reverse.** A naive auto-reverse
implementation would have `paymentService.markFailed()` directly
write the reversal entry upon receiving the failure signal —
without controller approval and without flowing through the
ledger-service write path. This pattern would:

- **Violate Reading B** — the Spend-domain service would be the
  caller writing journal entries, not the ledger service.
- **Bypass the audit-trail's approval-gate visibility** — the
  reversal would land without a `ProposedMutation` lifecycle
  record, so a forensic query "show me every reversal and the
  user who approved it" would return empty for auto-reversed
  failures.
- **Conflate signal handling with ledger authority** — a
  bank-side notification of failure is a signal that something
  changed in the world; the accounting consequence (a reversal
  entry) is a domain decision that the controller (not the
  banking integration) should authorize. The proposal-and-confirm
  flow makes this distinction explicit and auditable.

The Alternatives section below records the auto-reverse rejection
in full. The Reading B preservation here is the same architectural
constraint that drove the manual + automated path uniformity rule
in ADR-0012 §11; both rules ensure that the ledger structure is
identical regardless of whether the originating signal is human or
machine.

### 9. Vendor master integration — INV-AGENT-006 + ADR-0007 three-category split + ADR-0011 §11 read-boundary

The vendor master (`vendors` table) is owned by AP/Spend per
ADR-0011 §1. Vendor master mutations (`create_vendor`,
`update_vendor`) flow through `vendorService.create(...)` and
`vendorService.update(...)`. The vendor master integration carries
three load-bearing constraints inherited from upstream ADRs:

**Constraint 1 — Three-category vendor-master read-boundary
split (per ADR-0007).** ADR-0007 amended the Tier 2 / Tier 2.5
read boundaries to split vendor master fields into three
categories: (a) **reference / matching fields** — name, aliases,
tax ID, email/domain, address, default account mapping, historical
template association — readable by Tier 2 stages including the
vendor matcher; (b) **vendor control / payment-risk fields** —
bank account, payment instructions, bank-detail-confirmed flag,
payment hold status, blocked-vendor status — readable by Tier 2.5
stages (the Relationship Router producing payment-readiness
candidates) but **prohibited** from Tier 2 reads; (c) **all
vendor-control fields** are re-verified by Tier 1 at commit
regardless of which Tier 2 / Tier 2.5 stage produced the proposal.
ADR-0011 §11 quoted the rule verbatim. ADR-0015 inherits the
split: AP/Spend's Tier 1 commit path
(`billService.post(...)`, `paymentService.record(...)`,
`vendorService.update(...)`) re-verifies all vendor-control fields
at commit time — no exception.

**Constraint 2 — System ceiling rule for vendor bank-detail
changes per INV-AGENT-006.** The System ceiling rule for vendor
bank-detail changes per INV-AGENT-006 / `agent_autonomy_model.md`
§6 row 7 governs vendor master mutations that change
`bank_account`, `payment_instructions`, or the
`bank_detail_confirmed_flag` column. Per the registered
invariant: "any mutation to `vendor.bank_account`,
`vendor.payment_instructions`, or `vendor.bank_detail_confirmed_flag`
is System ceiling, requiring controller confirmation. Out-of-band
verification (independent confirmation with the vendor through a
separate channel) is required for the controller to proceed.
Extracted invoice or payment instructions may suggest a
bank-detail change but may never update the vendor master
automatically." ADR-0015 ships the schema-side enforcement: the
`vendorService.update()` service function detects mutations to any
of the three named columns and routes the proposal as a System
ceiling (per `agent_autonomy_model.md` §6 row 7) regardless of
rung, limit, or rule maturity. The controller's approval surface
includes an explicit "I have verified the bank-detail change with
the vendor through an independent channel" checkbox; the audit
event `vendor_bank_detail_change_confirmed` records the
controller_user_id, the prior bank-detail values (truncated for
audit/security), the new bank-detail values (truncated), the
out-of-band verification claim timestamp, and the trace_id.

**Constraint 3 — Vendor matcher inheritance from ADR-0011 §11.**
The Tier 2 vendor matcher (per ADR-0014 §9) reads vendor
identity-and-matching fields ONLY. AP/Spend domain consumers MUST
NOT extend the vendor matcher to read bank/payment-risk fields.
ADR-0015 ships no vendor-matcher logic that reads bank details; if
a future ADR-0015 amendment proposes such a read, the proposal is
a Reading-boundary violation and must be rejected unless ADR-0007
/ ADR-0011 §11 amend their respective read-boundary contracts
first.

**No silent vendor bank-detail mutation rule.** Per INV-AGENT-006
+ `agent_autonomy_model.md` §6 row 7, NO code path may mutate
`vendor.bank_account`, `vendor.payment_instructions`, or
`vendor.bank_detail_confirmed_flag` without (a) flowing through
`vendorService.update()`, (b) presenting the controller approval
surface with the explicit out-of-band-verification checkbox, (c)
emitting the `vendor_bank_detail_change_confirmed` audit event.
This rule is mechanical at the architectural layer: extracted
invoice data MAY suggest a bank-detail change in a
ProposedMutation payload, but the bank-detail change ITSELF
proposes through `vendorService.proposeBankDetailChange()` and
commits through `vendorService.confirmBankDetailChange()` only
after controller out-of-band verification — never as a side
effect of any other proposal commit. A future contributor
implementing a vendor-update flow that mutates bank-detail
columns inside any other service path (e.g., a "smart vendor
update" that infers bank details from the latest invoice
extraction and writes them in `billService.post()`) is proposing
a System ceiling reduction that is out of scope for ADR-0015
amendments. The rule is the load-bearing fraud control surface
preservation per Constraints 1–3 above.

**Audit treatment for vendor master mutations.** Every
vendorService write emits an audit event through the canonical
audit-log writer per ADR-0011 §1. The events: `vendor_created`,
`vendor_updated`, `vendor_bank_detail_change_proposed` (when the
proposal carries a bank-detail change but has not yet committed),
`vendor_bank_detail_change_confirmed` (controller approval with
out-of-band verification claim), `vendor_blocked`,
`vendor_unblocked`. The `bank_detail_change_proposed` event fires
even when the proposal is rejected, so the audit trail records
that a bank-detail change was attempted regardless of resolution.

### 10. Schema deltas

Per the schema-decision discipline (C4/C5 lesson per ADR-0013 +
ADR-0014 schema-decision callouts): every new column on
platform-owned tables OR on AP/Spend-owned tables surfaces
explicitly in this section. Zero silent introductions. The pattern
from ADR-0013's `original_storage_key` is the precedent.

**AP/Spend-owned table additions (new in ADR-0015):**

- **`vendor_prepayments`** (new table) — full schema per item 1
  above.
- **`vendor_prepayment_applications`** (new table) — full schema
  per item 1 above.
- **`vendor_credits`** (new table) — schema parallel to
  `vendor_prepayments` with adjusted lifecycle (`open`,
  `partially_applied`, `fully_applied`, `expired`); columns:
  `id`, `org_id`, `legal_entity_id` (ADR-0011 §10 reservation),
  `vendor_id`, `original_amount`, `remaining_balance` (computed),
  `currency`, `recognized_at`, `expires_at` (nullable; reserved
  for v1, not exercised), `description`, `created_at`,
  `created_by`, `trace_id`. Reserved-enum discipline applies to
  the `vendor_credits.status` column.
- **`vendor_credit_applications`** (new table) — schema parallel
  to `vendor_prepayment_applications`; columns: `id`, `org_id`,
  `vendor_credit_id`, `bill_id`, `amount_original`, `amount_cad`,
  `applied_at`, `created_at`, `created_by`, `trace_id`.
- **`payments.payment_state`** (new column) — closed enum per
  item 8 above. v1 active subset: `pending`, `paid`, `failed`.
  NOT NULL DEFAULT `pending` for newly-inserted rows.
- **`payments.payment_purpose`** (new column) — closed enum per
  the reframe spec §3.2 and item 1's payment-purpose discriminator
  rule. Full membership at v1 schema time per ADR-0010 discipline:
  `bill_payment`, `vendor_prepayment`, `vendor_refund`,
  `customer_payment`, `employee_reimbursement`,
  `owner_reimbursement`, `tax_payment`, `other`. **v1 active
  subset:** `bill_payment`, `vendor_prepayment`, `vendor_refund`,
  `other`. Reserved (`customer_payment`, `employee_reimbursement`,
  `owner_reimbursement`, `tax_payment`) ship in the enum but are
  not emitted by v1 paths; activation lands when their respective
  domain workflows scope. Immutable post-insert (Layer 1 CHECK).
- **`payments.bank_or_card_last4`** (new column, nullable text) —
  reconciliation-metadata preservation per the reframe spec §15
  callout. Captured at payment recording (extracted from receipt
  via OCR or manually entered).
- **`payments.merchant_identifier`** (new column, nullable text)
  — reconciliation-metadata preservation. Captured at payment
  recording.
- **`payments.authorization_reference`** (new column, nullable
  text) — reconciliation-metadata preservation. Captured at
  payment recording.
- **`payments.statement_appearance_date`** (new column, nullable
  date) — reconciliation-metadata preservation. May differ from
  the `payments.recorded_at` posting date.
- **`bills.override_evidence_completeness`** (new column, boolean,
  NOT NULL DEFAULT false) — reserved schema seat for INV-DOC-001
  (Document Platform's evidence-completeness invariant per
  ADR-0011 §15). The platform-side enforcement at
  `billService.post()` refuses to commit bills without an
  attached `primary_invoice` link role unless this flag is set
  on the bill row by a controller. ADR-0015 ships the schema
  seat; the Layer 2 enforcement lands when the AP foundation
  phase ships.
- **`bills.lifecycle_state`** — domain entity state column
  carrying canonical AP states (per the Spend brief's bill
  lifecycle): `draft`, `pending_approval`, `approved_for_payment`,
  `partially_paid`, `fully_paid`, `voided`, `cancelled`. Per
  ADR-0010 reserved-enum-states discipline.

**Platform-owned table extensions (NOT owned by ADR-0015 — listed
for cross-reference only):**

- `source_documents.legal_entity_id` (per ADR-0011 §10
  reservation) — owned by ADR-0011.
- `source_document_links.link_role` enum membership — owned by
  ADR-0016. ADR-0015 consumes the v1 active subset (`primary_invoice`,
  `payment_evidence`, `receipt`, `supporting`) but does not own
  the enum.
- Exception-queue resolution-action enum extensions
  (`backfill_vendor_prepayment_suggested`,
  `manual_born_paid_workflow`) — owned by ADR-0011 §13. ADR-0015
  specifies the values' shape but the enum membership lives in
  ADR-0011's resolution-action enum.

**Reserved `org_settings.*` columns for tax-timing overrides
(introduced by ADR-0015):**

- `org_settings.deposit_tax_timing_default` (per item 4) — closed
  enum aligned with `tax_timing_choice`; v1 NOT NULL DEFAULT
  `review_required`.

This is the only `org_settings.*` column ADR-0015 introduces.
ADR-0013 introduced six `org_settings.*` columns for storage
configurability; ADR-0014 introduced additional
`org_settings.*` columns for OCR / dedup / retention. ADR-0015
adds one column scoped to its tax-timing concern.

### 11. Reserved enums and audit events

**Reserved enums introduced by ADR-0015** (full list per ADR-0010
discipline; v1 active vs reserved explicit):

| Enum | Full membership | v1 active subset |
|---|---|---|
| `vendor_prepayment_type` | `retainer`, `deposit`, `advance`, `security_deposit`, `prepaid_service`, `inventory_deposit`, `fixed_asset_deposit`, `other` | `retainer`, `deposit`, `advance`, `other` |
| `vendor_prepayment_status` | `open`, `partially_applied`, `fully_applied`, `refunded`, `written_off`, `forfeited` | `open`, `partially_applied`, `fully_applied`, `refunded` |
| `vendor_credit_status` | `open`, `partially_applied`, `fully_applied`, `expired` | `open`, `partially_applied`, `fully_applied` |
| `tax_timing_choice` | `at_payment`, `at_final_invoice`, `controller_chooses_per_invoice`, `review_required` | `at_payment`, `at_final_invoice`, `review_required` |
| `payment_state` | `pending`, `paid`, `failed`, `partially_returned`, `refunded` | `pending`, `paid`, `failed` |
| `payment_purpose` | `bill_payment`, `vendor_prepayment`, `vendor_refund`, `customer_payment`, `employee_reimbursement`, `owner_reimbursement`, `tax_payment`, `other` | `bill_payment`, `vendor_prepayment`, `vendor_refund`, `other` |

Reserved values ship in the enum at v1 schema time per ADR-0010 —
defined in the type, not emitted by any v1 service write path.
Service-layer Zod rejects client-provided reserved values (Layer 2
defense); service-layer write paths emit only active values
(Layer 3 defense); the DB CHECK restricts non-active values for
v1 rows where applicable (Layer 1 defense — scoped per ADR-0010).
The `bundle_type` enum extensions (`final_invoice_with_applied_deposit`,
`vendor_credit_applied_to_bill`) are reserved by ADR-0012 §12;
ADR-0015 specifies their per-bundle-type child composition but
does NOT activate them in v1. Their activation lands in a future
ADR-0015 amendment when post-v1 scope adopts them.

**New audit events for AP/Spend lifecycle** (cross-references
INV-AUDIT-001 from `ledger_truth_model.md` — every event below
flows through the canonical audit-log writer per ADR-0011 §1; no
service inserts into `audit_log` directly):

| Event | Fields |
|---|---|
| `vendor_prepayment_created` | `org_id`, `vendor_prepayment_id`, `payment_id`, `vendor_id`, `prepayment_type`, `amount_original`, `tax_timing_choice`, `created_by`, `trace_id` |
| `vendor_prepayment_authorized_future_cash` | `vendor_prepayment_id`, `controller_user_id`, `proposal_id`, `trace_id` |
| `vendor_prepayment_classified_after_the_fact` | `vendor_prepayment_id`, `classifying_user_id`, `payment_id`, `prior_payment_purpose`, `new_payment_purpose`, `trace_id` |
| `vendor_prepayment_applied` | `vendor_prepayment_id`, `vendor_prepayment_application_id`, `bill_id`, `amount_original`, `applied_by`, `trace_id` |
| `vendor_prepayment_refunded` | `vendor_prepayment_id`, `payment_id` (refund), `amount_original`, `refunded_by`, `trace_id` |
| `vendor_prepayment_backfilled_from_exception` | `vendor_prepayment_id`, `controller_user_id`, `original_missing_deposit_context`, `trace_id` |
| `vendor_credit_created` | `org_id`, `vendor_credit_id`, `vendor_id`, `original_amount`, `created_by`, `trace_id` |
| `vendor_credit_applied` | `vendor_credit_id`, `vendor_credit_application_id`, `bill_id`, `amount_original`, `applied_by`, `trace_id` |
| `bill_recorded_with_out_of_scope_deposit` | `bill_id`, `controller_user_id`, `out_of_scope_reason`, `trace_id` |
| `payment_failure_reversed` | `original_payment_id`, `reversal_journal_entry_id`, `failure_reason`, `bill_ids_affected`, `controller_user_id`, `trace_id` |
| `vendor_created` | `org_id`, `vendor_id`, `created_by`, `trace_id` |
| `vendor_updated` | `vendor_id`, `field_set_changed`, `updated_by`, `trace_id` |
| `vendor_bank_detail_change_proposed` | `vendor_id`, `proposal_id`, `proposed_by`, `trace_id` |
| `vendor_bank_detail_change_confirmed` | `vendor_id`, `controller_user_id`, `prior_bank_detail_truncated`, `new_bank_detail_truncated`, `out_of_band_verification_claim_at`, `trace_id` |
| `vendor_blocked` | `vendor_id`, `reason`, `blocked_by`, `trace_id` |
| `vendor_unblocked` | `vendor_id`, `unblocked_by`, `trace_id` |

Each audit event row references INV-AUDIT-001 (audit-log writer
discipline) and INV-AUDIT-002 (immutable audit log) from
`ledger_truth_model.md`; the trace_id propagates per Service
Communication Rule 5 (`docs/02_specs/ledger_truth_model.md`). The
AP/Spend service layer never inserts into `audit_log` directly;
every event routes through `recordMutation()` (or its successor)
per the canonical audit-log writer contract from ADR-0011 §1.

## Cross-references

- **ADR-0001** (`0001-reversal-semantics.md`) — reversal-as-mirror
  semantics. Cited by item 8 (Q78 closure) — the
  `payment_failure_reversed` flow produces a reversal entry per
  ADR-0001 with swapped debits/credits, non-empty
  `reversal_reason`, and `reverses_journal_entry_id` self-FK.
- **ADR-0007** (`0007-three-tier-agent-architecture.md`) — Tier 1
  commit-path inheritance for every AP/Spend domain service; Tier
  2 / Tier 2.5 vendor-master read boundary (three-category split)
  cited verbatim in item 9. Carried prerequisite for this ADR.
- **ADR-0010** (`0010-reserved-enum-states.md`) — discipline
  applied to every closed enum this ADR introduces (full list in
  item 11): `vendor_prepayment_type`, `vendor_prepayment_status`,
  `vendor_credit_status`, `tax_timing_choice`, `payment_state`,
  `payment_purpose`. Plus the bundle_type enum extensions
  (`final_invoice_with_applied_deposit`,
  `vendor_credit_applied_to_bill`) reserved by ADR-0012 §12 with
  per-bundle-type child composition specified here.
- **ADR-0011** (`0011-document-platform.md`) — the spine. ADR-0015
  inherits §1 (entity ownership boundary — AP/Spend owns
  bills/payments/prepayments/credits/vendors), §7 (ProposedMutation /
  ProposedMutationBundle / ProposedAttachment handoff vocabulary),
  §8 (Reading B preservation — three-layer separation), §10
  (multi-entity reservations on `bills.legal_entity_id`,
  `payments.paying_entity_id`, etc.), §11 (vendor-matcher
  read-boundary verbatim quotation; Tier 1 re-verification
  obligation), §13 (exception queue first-class — backfill and
  manual born-paid workflow exceptions route here), §14 (Domain
  Boundary Map — ADR-0015 inherits the metadata-preservation
  obligation for born-paid bundles), §15 (DOC invariant prefix —
  ADR-0015 ships the `bills.override_evidence_completeness` schema
  seat for INV-DOC-001). Carried prerequisite for this ADR.
- **ADR-0012** (`0012-proposed-mutation-bundle.md`) — bundle
  envelope, atomicity, lifecycle vocabulary, Q28 surface 4 bundle
  re-verification, bundle-effective ceiling = max(child ceilings).
  Cited by item 2 (Q60 v1 closure — `born_paid_bill` is Always
  Confirm), item 6 (final invoice with prior deposit → bundle
  type `final_invoice_with_applied_deposit` reserved by ADR-0012
  §12), item 7 (born-paid bundle workflow uses
  `billService.postWithImmediatePayment(bundle)` per ADR-0012 §11
  manual + automated path uniformity), item 9 (vendor bank-detail
  change is a separate System-ceiling proposal NOT a bundle child
  per ADR-0012 §9). Carried prerequisite for this ADR.
- **ADR-0013** (`0013-storage-provider.md`) — `storageProviderService`
  interface. ADR-0015 reads no bytes directly; payment-evidence
  rendering and ProposedAttachment commits route through the
  platform layer. Carried prerequisite for this ADR.
- **ADR-0014** (`0014-tier-2-document-pipeline.md`) — Tier 2
  pipeline, OCR engine, classification strategy, vendor matcher,
  proposal routing. Cited by item 7 (Q74 OCR/pipeline-rows portion
  already closed by ADR-0014; AP/Spend domain-rows portion closed
  here). Carried prerequisite for this ADR.
- **ADR-0016** (forthcoming, Tier 4 — `document-relationship-graph.md`)
  — full `linked_entity_type` and `link_role` enum membership;
  (entity_type, role) pair-validity matrix; cascade behavior per
  `linked_entity_type`. ADR-0015 consumes the v1 active link_role
  subset (`primary_invoice`, `payment_evidence`, `receipt`,
  `supporting`) but does not own the enum. Sibling Tier 4 ADR.
- **ADR-0017** (forthcoming, Tier 4 —
  `vendor-template-substrate-reservation.md`) — substrate-only
  portion (`clean_approval_count` column on `vendor_rules`); full
  template-as-autonomy-rule enforcement deferred post-v1. Cited
  by item 2 (Q60 post-v1 portion lands here). Sibling Tier 4 ADR.
- **ADR-0018** (forthcoming, Tier 5 — `relationship-router.md`) —
  Relationship Router behavior, three-subsystem decomposition,
  Tier 2.5 read-boundary specifics. Cited by item 6 (final invoice
  with prior deposit detection — Router reads
  `vendor_prepayments.remaining_balance` to detect the absence of
  a matching prepayment) and item 7 (receipt-to-bill matching for
  Scenarios A / B / C).
- **ADR-0019** (forthcoming, Tier 6 —
  `confidence-calibration-policy.md`) — confidence thresholds and
  calibration governance for classification routing. ADR-0015
  consumes the calibration policy at runtime (Scenarios A / B / C
  routing depends on classification confidence) but does not own
  the calibration governance.
- **INV-AGENT-006** (registered in `agent_autonomy_model.md` §10
  + System ceiling table §6 row 7 at commit `84691d5`) — vendor
  bank-detail changes are System ceiling. Cited directly by item 9
  (vendor master integration — System ceiling rule for vendor
  bank-detail changes per INV-AGENT-006 / `agent_autonomy_model.md`
  §6 row 7). Direct citation, NOT positional.
- **`docs/02_specs/intent_model.md`** — `ProposedMutation` shape
  (§3); Four Questions grammar (§5); Logic Receipt (§6). ADR-0015
  consumes all three: every AP/Spend service write path produces
  a `ProposedMutation` (or `ProposedMutationBundle` /
  `ProposedAttachment`); every commit-time confirmation surface
  renders the Four Questions (item 8 includes a worked example
  for the payment-failure-reversal proposal); every committed
  mutation produces a Logic Receipt per INV-AGENT-002.
- **`docs/02_specs/mutation_lifecycle.md`** — six canonical
  states (Pending, Needs Attention, Approved, Posted (auto),
  Posted (manual), Finalized) plus terminal Rejected and
  Rejected-with-reversal. ADR-0015 inherits the canonical
  vocabulary unchanged. The new `failed` value introduced for Q78
  closure is a **payment-state** value on the `payments` row, NOT
  a mutation-lifecycle state — distinction explicit in item 8.
  ADR-0015 does NOT amend `mutation_lifecycle.md`.
- **`docs/02_specs/ledger_truth_model.md`** — Service
  Communication Rules (Reading B inherited by item 8; Rule 1
  typed input schemas; Rule 4 no free-form data at the boundary
  except for human-readable fields like `description` /
  `reversal_reason`; Rule 5 trace_id on every call). INV-LEDGER-001
  through INV-LEDGER-006 (per-child invariants fire inside every
  bundle / commit transaction). INV-AUDIT-001 (audit-log row in
  same transaction). INV-AUDIT-002 (immutable audit log).
- **`docs/02_specs/agent_autonomy_model.md`** — System ceiling
  table §6 (row 7 — vendor bank-detail change → INV-AGENT-006);
  Reserved INV-IDs §10 (INV-AGENT-006 — vendor bank-detail
  changes are System ceiling). Both registered at commit
  `84691d5`. Cited by item 9 directly via INV-AGENT-006 /
  `agent_autonomy_model.md` §6 row 7.
- **`docs/02_specs/agent_architecture_policy.md`** — Q28
  re-verification matrix authoritative source for surfaces 1–3;
  ADR-0012 is the authoritative source for surface 4 (bundle
  re-verification). ADR-0015 inherits the matrix; the AP/Spend
  domain rows in the per-document-type matrix land in
  `agent_architecture_policy.md` per ADR-0007 Q77 (matrix
  expansion is a v1-ship gate, not a v1-code gate).
- **`docs/02_specs/invariants.md`** — INV-LEDGER-001..006,
  INV-AUDIT-001/002, INV-AGENT-001 (ceiling enforcement),
  INV-AGENT-002 (Logic Receipt), INV-AGENT-006 (vendor bank-
  detail), INV-DOC-001 (evidence-completeness, registered at
  Phase 0 Task E1 per ADR-0011 §15).
- **`docs/02_specs/open_questions.md`** — Q59, Q60 (v1 portion),
  Q61, Q62, Q63, Q64, Q74 (AP/Spend domain rows), Q78 (closed by
  this ADR per the Closes section below). Q60 post-v1 portion
  forward-pointed to ADR-0017; Q74 OCR/pipeline-rows portion
  already closed by ADR-0014.
- **`docs/09_briefs/phase-2/document_platform_reframe_design.md`**
  — the canonical 21-section design spec. ADR-0015 inherits
  decisions from §3.2 (Spend Initiative scope), §11 (auto-post
  deferred past v1; v1 is Always Confirm for `born_paid_bill`),
  §13 (Q-list — Q59/Q60 v1/Q61/Q62/Q63/Q64/Q74 domain
  rows/Q78 closed here), §15 (receipt v1 decision matrix —
  Scenarios A / B / C; reconciliation-metadata preservation
  requirement; manual born-paid workflow callout; vendor
  bank-detail-change hard rule callout), §17 (multi-entity
  reservations on `bills` / `bill_lines` / `payments`), §18
  (scenario coverage — receipts / retainers / vendor credits).
- **`docs/09_briefs/phase-2/spend_initiative.md`** (forthcoming —
  renamed from `ap_ingestion_initiative.md` per the reframe
  spec §3.2 plan) — ADR-0015 inherits the brief's domain shape;
  §1, §3, §5, §7, §10 of the brief inherit verbatim from this
  ADR. The brief drafts as part of B3 (Session 3) per the Phase 0
  governance plan.

## Closes

This ADR closes the following AP/Spend-scope questions from
`docs/02_specs/open_questions.md`:

| Q | Closure scope | Disposition |
|---|---|---|
| **Q59** | Vendor prepayment object shape | **Closed.** Type enum (`retainer`, `deposit`, `advance`, `other` active v1; `security_deposit`, `prepaid_service`, `inventory_deposit`, `fixed_asset_deposit` reserved per ADR-0010); status enum (`open`, `partially_applied`, `fully_applied`, `refunded` active v1; `written_off`, `forfeited` reserved); payment-purpose discriminator linkage to `payments.payment_purpose = vendor_prepayment` enforced at the service layer. Per item 1. |
| **Q60** | Born-paid bill bundle approval gate | **PARTIAL closure — v1 portion only.** v1: Always Confirm for `born_paid_bill` per reframe spec §11 + ADR-0012 §13; no auto-post; no vendor-rule applicability for promotion; controller authority for ceiling-flagged bundles. **Post-v1 portion (auto-post calibration, clean-approval-count thresholds, vendor-rule promotion authority) → ADR-0017** (Vendor Template substrate). Per item 2. |
| **Q61** | Vendor prepayment approval gate | **Closed.** Bifurcated rule: future-cash retainer authorization → controller-required; after-the-fact retainer classification → AP-specialist authority sufficient (controller bypass allowed). Bifurcation discriminator computed at the service layer based on whether the referenced `payments` row exists at proposal time and its `payment_purpose` value. Per item 3. |
| **Q62** | Deposit / retainer tax timing | **Closed.** Three-layer resolution: per-document override > per-org override > jurisdiction default. v1 jurisdiction default: `review_required`. Closed enum `tax_timing_choice` (`at_payment`, `at_final_invoice`, `review_required` active v1; `controller_chooses_per_invoice` reserved). Per item 4. |
| **Q63** | Vendor balance view composition | **Closed.** Four-component composition: `open_AP + unapplied_vendor_credits + open_vendor_deposits_and_retainers + accrued_unbilled`. Computed at read time, no materialized column. v1 reporting surface returns both `net_balance` and `partial_balances`. Per item 5. |
| **Q64** | Final invoice with prior deposit not in CHOUnting | **Closed.** Route to exception queue with `backfill_vendor_prepayment_suggested` resolution action; explicitly NOT silent discount or vendor-credit treatment. Three resolution paths: backfill / record-at-net-with-stamped-reason / defer. Routes through ADR-0011 §13 ProposedAttachment exception-queue surface. Per item 6. |
| **Q74** | Receipt v1 path | **PARTIAL closure — AP/Spend domain rows portion only** (OCR/pipeline rows already closed by ADR-0014). Scenario A (`ProposedAttachment(attach_payment_evidence)`); Scenario B (`ProposedMutation(record_bill_payment)`); Scenario C (exception queue with manual born-paid workflow available — uses `billService.postWithImmediatePayment(bundle)`). Reconciliation-metadata preservation requirement on `payments` schema. Lifecycle for all three scenarios uses canonical `mutation_lifecycle.md` states. **OCR/pipeline-rows portion (image ingestion, OCR engine, sidecar topology, classification strategy, AI fallback) already closed by ADR-0014.** Per item 7. |
| **Q78** | Payment failure / reversal lifecycle | **Closed.** New `failed` value on `payments.payment_state` (closed enum per ADR-0010); transition rules for `pending → paid → failed` and `failed → bill returns to approved_for_payment via reversal entry`; ledger semantics: **proposal-and-confirm, NOT auto-reverse — Reading B compliance, the ledger service is the sole writer of journal entries**. v1 ships failure handling (not deferred) because the absence of a structured path forces controllers to author manual reversal entries that bypass the bill / payment subledger. The `failed` value is a payment-state (domain entity state on `payments`), NOT a mutation-lifecycle state — `mutation_lifecycle.md` is unchanged. Per item 8. |

## Anti-overscope discipline

ADR-0015 owns AP/Spend domain decisions only. The following are
explicitly NOT ADR-0015 scope. Future readers (and future ADR
amendment authors) are warned: if a proposed amendment to ADR-0015
drifts into the territories below, the proposal is misplaced and
should be re-scoped to the owning ADR.

- **Full `source_document_links` role matrix** — owned by
  **ADR-0016** (Document Relationship Graph). ADR-0015 consumes
  the v1 active link_role subset (`primary_invoice`,
  `payment_evidence`, `receipt`, `supporting`) per ADR-0011 §4
  but does NOT enumerate the full `link_role` enum membership or
  the (entity_type, role) pair-validity matrix. Both live in
  ADR-0016.
- **Relationship Router matching algorithm** — owned by
  **ADR-0018** (Relationship Router). ADR-0015 consumes Router
  output (`DocumentRelationshipCandidate` objects per ADR-0011 §1
  and ADR-0007 Tier 2.5) at the proposal-routing step (item 7
  Scenarios A / B / C), but does NOT specify the matching
  algorithm, scoring rules, ambiguity-resolution behavior, or
  re-evaluation triggers. All of those live in ADR-0018 (per Q56
  forward-pointed by ADR-0011).
- **Confidence threshold calibration governance** — owned by
  **ADR-0019** (Confidence Calibration Policy). ADR-0015 consumes
  calibration outcomes at runtime (item 7's Scenario A / B / C
  routing depends on classification confidence per ADR-0014's
  classifier output), but does NOT specify confidence threshold
  values, per-document-type calibration policy, or the governance
  process for tuning thresholds. All of those live in ADR-0019
  (per Q57, Q65 forward-pointed by ADR-0011 / ADR-0014).
- **Vendor template promotion / learning loop** — owned by
  **ADR-0017** (substrate-only v1) and post-v1 vendor template
  enforcement. ADR-0015 closes Q60's v1 portion (Always Confirm
  for `born_paid_bill`); the post-v1 portion (clean-approval-count
  thresholds, vendor-rule promotion authority, per-rule rejection
  rate demotion thresholds for promoted bundle rules) lives in
  ADR-0017 / a future ADR-0019 amendment. ADR-0015 does NOT
  specify auto-post calibration for any AP/Spend mutation type;
  the v1 default is Always Confirm (per `agent_autonomy_model.md`
  §4 default) and post-v1 promotion is owned by ADR-0017.
- **OCR / extraction behavior** — owned by **ADR-0014** (already
  ratified). ADR-0015 closes only the AP/Spend domain-rows portion
  of Q74; OCR engine selection, sidecar topology, classification
  strategy, AI fallback contract, dedup-by-hash, vendor-matcher
  pipeline integration, replay policy, and orphan-blob GC all live
  in ADR-0014 and are NOT subject to ADR-0015 amendments. If a
  future amendment to ADR-0015 proposes adjustment to any of
  those areas, the amendment is misplaced and should be re-scoped
  to ADR-0014.

Where ADR-0015 needs to reference any of the above areas, it does
so by ADR number with the boundary explicit (e.g., "the matching
algorithm is owned by ADR-0018 — ADR-0015 consumes the output,
not the algorithm"). The forward-pointers in items 6 (final
invoice / Router detection), 7 (Scenarios A / B / C / classification
confidence), 9 (vendor matcher / read-boundary inheritance), and
the Closes table (Q60 / Q74 partial closures) are the load-bearing
boundary callouts.

## Consequences

### What this enables

- **The first AP/Spend domain consumer of the Document Platform
  ships in v1 with a complete contract.** Vendor prepayments,
  vendor credits, born-paid bills, vendor master mutations, and
  payment failure reversal all carry a structured path that
  preserves Reading B and inherits the substrate ADRs verbatim.
- **The Spend Initiative brief drafts cleanly against this ADR.**
  ADR-0015's section structure aligns with the brief's planned
  section headings (per the reframe spec §3.2 disposition table)
  so B3 (Session 3) brief authoring can fill in cleanly without
  re-deriving domain decisions.
- **Vendor prepayments / deposits / retainers ship with a
  bifurcated approval gate that matches real-world risk
  profiles.** Future-cash authorization (controller-only) and
  after-the-fact classification (AP-specialist sufficient) are
  distinct workflows with distinct audit events; this matches the
  bookkeeper analogy from `agent_autonomy_model.md` Principle 1.
- **Payment failure reversal is a structured workflow, not an
  ad-hoc manual journal entry.** The proposal-and-confirm flow
  produces the same ledger structure as the future-automated
  banking-integration path; the `payments` and bill states
  transition correctly; the audit trail records the failure with
  controller authorization.
- **Born-paid bundles inherit the Always Confirm gate from
  ADR-0012 §13 + reframe spec §11.** No v1 promotion path; the
  controller reviews every bundle. Post-v1 promotion authority
  lands in ADR-0017 with the calibration substrate already in
  place.
- **Vendor master integration preserves the System ceiling for
  bank-detail changes.** INV-AGENT-006 enforcement at the service
  layer prevents extracted invoice data from auto-updating vendor
  bank details — the most important AP fraud control the system
  has, per the reframe spec §15 callout.
- **The receipt v1 path covers Scenarios A / B / C with the
  manual born-paid workflow as the bridge to the post-v1
  Scenario C automation.** Scenario A and B ship as automated v1
  workflows; Scenario C ships as the exception-queue + manual
  workflow path that uses the same domain service the future
  automated path will use, preventing implementation drift per
  ADR-0012 §11.
- **Vendor balance view composes from the four real-world
  components.** Reporting surfaces consume the breakdown rather
  than a single bottom line, giving controllers the visibility
  to spot AP/credit/prepayment imbalances during month-end.
- **The exception-queue routing for missing-deposit cases
  (Q64) prevents silent discount / vendor-credit
  misclassification.** A deposit that exists in the real world
  but not in CHOUnting becomes a visible gap with explicit
  resolution paths, not a silent accounting drift.

### What this constrains

- **No auto-post for any AP/Spend mutation type in v1.** Every
  bill, payment, prepayment recording, prepayment application,
  credit posting, credit application, vendor master mutation, and
  payment failure reversal flows through Always Confirm in v1.
  Post-v1 promotion authority lands in ADR-0017.
- **No bypass of the System ceiling for vendor bank-detail
  changes.** Per INV-AGENT-006, every mutation to
  `vendor.bank_account`, `vendor.payment_instructions`, or
  `vendor.bank_detail_confirmed_flag` requires controller
  confirmation with out-of-band verification. No rung, no limit,
  no rule maturity, no v1 auto-acceptance path.
- **No auto-reverse for payment failures.** Per Reading B, the
  Spend-domain service may NOT directly write reversal journal
  entries on receiving a failure signal. Every failure-reversal
  flows through `ProposedMutation(reverse_failed_payment)` and
  the ledger service writes inside `withInvariants()`. A future
  contributor proposing auto-reverse is proposing a Reading B
  violation.
- **No silent treatment of missing deposits as discount or
  vendor credit.** Per Q64 closure, the routing is to the
  exception queue with explicit controller resolution paths.
- **No reading of vendor control / payment-risk fields by Tier 2
  stages.** Per ADR-0007 + ADR-0011 §11 read boundary, the Tier 2
  vendor matcher reads vendor identity-and-matching fields ONLY.
  AP/Spend code paths inherit this constraint. Tier 1 re-verifies
  all vendor-control fields at commit.
- **No silent activation of reserved enum values.** The reserved
  values in every closed enum introduced by ADR-0015
  (`vendor_prepayment_type`, `vendor_prepayment_status`,
  `vendor_credit_status`, `tax_timing_choice`, `payment_state`,
  `payment_purpose`) ship in the schema at v1 but are not emitted
  by v1 service write paths. Activating a reserved value requires
  an ADR-0015 amendment per ADR-0010 discipline; silent activation
  is a discipline violation caught by the Layer 2 / Layer 3
  defenses.

### What this costs

- **Schema scope.** Five new tables (`vendor_prepayments`,
  `vendor_prepayment_applications`, `vendor_credits`,
  `vendor_credit_applications`) plus column additions on
  `payments` (`payment_state`, `payment_purpose`,
  `bank_or_card_last4`, `merchant_identifier`,
  `authorization_reference`, `statement_appearance_date`) and on
  `bills` (`override_evidence_completeness`, `lifecycle_state`).
  Each closed enum ships at v1 schema time per ADR-0010
  reserved-enum-states discipline. Per `org_settings.*`, ADR-0015
  adds one column (`deposit_tax_timing_default`).
- **Reserved-enum migrations.** Six closed enums introduced by
  ADR-0015 ship at v1 with full reserved membership; activation of
  reserved values is a future ADR amendment, not a schema
  migration. Migrations beyond the v1 schema-time addition are
  zero unless a future amendment activates a reserved value.
- **Service surface.** New domain services:
  `vendorPrepaymentService` (`create`, `apply`, `refund`,
  `proposeBackfillFromException`); `vendorCreditService`
  (`create`, `apply`); extensions to `paymentService` (`record`,
  `proposeFailureReversal`, `commitFailureReversal`); extensions
  to `billService` (`post`, `postWithImmediatePayment` for the
  born-paid bundle flow); extensions to `vendorService` (`create`,
  `update` with INV-AGENT-006 enforcement,
  `proposeBankDetailChange`, `confirmBankDetailChange`).
  Reporting service additions: `vendorReportService.balance(vendor_id)`
  per item 5.
- **Test surface.** Integration tests for: born-paid bundle
  atomicity (per ADR-0012 §3 all-or-nothing); payment failure
  reversal (proposal-and-confirm flow producing correct ledger
  shape and bill state transitions); vendor prepayment application
  with all three `tax_timing_choice` values; vendor balance
  composition with non-trivial component values; exception-queue
  routing for missing-deposit cases; vendor bank-detail change
  System-ceiling enforcement (Tier 1 re-verification + controller
  confirmation gate); reserved-enum-value rejection at the service
  boundary.
- **Audit-log volume.** ADR-0015 adds 16 new audit event types
  (item 11). v1 volume is bounded by the "founder + 2 real users"
  cohort; post-v1 scaling depends on AP/Spend workflow throughput.
  All events route through the canonical audit-log writer per
  ADR-0011 §1; the audit table itself is owned by INV-AUDIT-001.

## Alternatives considered

### Alternative 1 — Saga rejection for payment failure reversal

**Rejected — hard rejection per ADR-0012 §Alternative 1.** The
saga pattern (split the failure-reversal into multiple sequential
transactions with compensating reversals if a later step fails)
was considered for the payment-failure-reversal flow because the
flow touches multiple entities (payment row, journal entries,
bill_payment_allocations, bill row). The rejection inherits
ADR-0012's reasoning verbatim: a saga creates a three-state
failure mode (succeeded / fully-compensated /
partially-compensated) instead of the two-state failure mode
(succeeded / rolled back) that single-DB-transaction enforcement
provides. The `paymentService.commitFailureReversal()` runs as a
single Postgres transaction wrapped in `withInvariants()`; the
ledger entry, the allocation reversal, the bill state transition,
and the payment_state flip all commit together or all roll back
together. No saga, no compensation, no third state.

The future-reopening condition from ADR-0012 §Alternative 1 (saga
reconsidered for cross-org, cross-provider, or async external-
payment bundles) does not apply to v1 payment-failure reversal:
v1 is single-org, single-database, and the failure signal is
either controller-authored (manual) or — post-v1 — a banking
integration that produces a typed payload at the service-layer
boundary. Neither case requires saga semantics.

### Alternative 2 — Centralized vs distributed vendor-master ownership

**Distributed (per-domain) rejected; centralized (AP/Spend-owned)
adopted.** The decision is to keep `vendors` ownership in
AP/Spend per ADR-0011 §1, not to split it across multiple
domains (one per channel / per workflow). Distributed ownership
would have produced inconsistent vendor master state — the AP
domain could see a vendor with one bank account, the AR domain
could see the same vendor with a different bank account, the
Banking domain could see a third — and the System ceiling rule for
bank-detail changes (INV-AGENT-006) would fragment across domains
with no single enforcement point.

The centralized model preserves a single source of truth: the
`vendors` table is owned by AP/Spend; future domains (AR,
Banking, Tax) read vendor identity-and-matching fields per the
read-boundary discipline; only AP/Spend writes to `vendors`. The
read boundary inherited from ADR-0007 + ADR-0011 §11 makes this
mechanical: a future Banking-domain service that needed to write
to `vendors` would have to either (a) call AP/Spend's
`vendorService.update(...)` (which routes the change through
INV-AGENT-006 enforcement), or (b) propose an ADR amendment that
explicitly authorizes Banking-domain writes to `vendors` (a
read-boundary expansion that requires ADR-0007 / ADR-0011
amendment first).

The trade-off: AP/Spend "owns" a piece of master data that other
domains consume read-only. The cost is the conceptual coupling
(`vendors` lives in the AP/Spend ADR rather than a hypothetical
"shared master data" ADR); the benefit is that the System-ceiling
enforcement has exactly one place to live and exactly one set of
service paths to govern.

### Alternative 3 — Auto-reverse vs proposal-and-confirm for payment failure

**Auto-reverse rejected — Reading B violation.** A naive
auto-reverse implementation would have the
Spend-domain `paymentService.markFailed(payment_id, failure_reason)`
function directly write the reversal entry upon receiving the
failure signal — without controller approval and without flowing
through the ledger-service write path. The pattern was considered
because it minimizes the number of round-trips between detection
and ledger correction (a banking integration that detects an ACH
return wants to "fix" the ledger immediately to keep the AP aging
view accurate).

**Reasons for rejection:**

1. **Reading B violation** — the Spend-domain service would be
   the caller writing journal entries, not the ledger service.
   Per `docs/02_specs/ledger_truth_model.md` Service Communication
   Rules, the ledger service is the sole writer of
   `journal_entries` / `journal_lines`. ADR-0011 §8's three-layer
   separation explicitly states this; ADR-0015 cannot violate the
   inherited rule.
2. **Audit-trail visibility loss** — auto-reverse produces a
   reversal journal entry without a corresponding `ProposedMutation`
   lifecycle record, so a forensic query "show me every reversal
   and the user who approved it" would return empty for
   auto-reversed failures. The `bookkeeper analogy` from
   `agent_autonomy_model.md` Principle 1 holds here: a real
   bookkeeper would not silently undo a posted payment because
   the bank returned a notification; the bookkeeper would
   propose the reversal, document the failure reason, and get a
   controller's sign-off. The proposal-and-confirm flow makes
   this explicit and auditable.
3. **Conflation of signal handling with ledger authority** — a
   bank-side notification of failure is a signal that something
   changed in the world; the accounting consequence (a reversal
   entry) is a domain decision that the controller should
   authorize. The proposal-and-confirm flow makes this distinction
   explicit and adds the controller gate (with the Four Questions
   surface — "What changed? Why? Track record? What if I
   reject?") that the auto-reverse path bypasses.
4. **Latency is acceptable** — the v1 cohort is "founder + 2
   real users." A controller-approval gate on payment failures
   adds minutes-to-hours of latency between failure-signal arrival
   and ledger correction; for a small cohort this is operationally
   tractable. Post-v1 scale may increase the value of low-latency
   correction; if so, a future ADR amendment could introduce
   per-vendor / per-rule auto-reverse calibration through the
   ADR-0017 vendor template substrate (the same way Q60
   post-v1 portion handles auto-post calibration). v1 ships the
   conservative path that preserves Reading B without requiring
   the calibration substrate to be ready.

The proposal-and-confirm flow per item 8 is the architecturally
correct path. The auto-reverse rejection is a hard rejection for
v1; reopening requires an ADR amendment that addresses the
Reading B preservation explicitly.

## Notes for future ADR writers

- **Q60 split pattern with ADR-0017 (post-v1 portion).** The
  pattern this ADR establishes — closing the v1 portion of a
  question while explicitly forward-pointing the post-v1 portion
  to a separate ADR — is the same pattern ADR-0011 used for Q73's
  four-piece closure. Q60's v1 portion (Always Confirm for
  `born_paid_bill`) closes here; the post-v1 portion (auto-post
  calibration, clean-approval-count thresholds, vendor-rule
  promotion authority) closes in ADR-0017. A future contributor
  who attempts a single-ADR full closure of Q60 is misframing the
  question — Q60's full decision space is split between v1
  (governance choice: defer auto-post) and post-v1 (calibration
  and substrate). The split is intentional and matches ADR-0012
  §13's framework / specifics partition.

- **Q74 split pattern with ADR-0014 (already established).**
  ADR-0014 closed the OCR/pipeline-rows portion of Q74 (image
  ingestion, OCR engine, classification strategy, AI fallback);
  ADR-0015 closes the AP/Spend domain-rows portion (Scenarios A /
  B / C lifecycle, born-paid bundle workflow, manual workflow,
  reconciliation-metadata preservation). The split was set by
  ADR-0011 §Forward-pointed Q74 entry. A future contributor who
  proposes consolidating the Q74 closure into a single ADR would
  fragment the substrate / domain boundary that ADR-0011's
  three-layer Reading B preservation depends on.

- **AP/Spend intent map (which Decision item closes which
  Q-number).** The eight Q-closures map to Decision items as
  follows: Q59 → item 1 (vendor prepayment object shape); Q60
  v1 portion → item 2 (born-paid bundle approval gate v1);
  Q61 → item 3 (vendor prepayment approval gate, bifurcated);
  Q62 → item 4 (deposit / retainer tax timing); Q63 → item 5
  (vendor balance view composition); Q64 → item 6 (final invoice
  with prior deposit not in CHOUnting); Q74 AP/Spend domain-rows
  portion → item 7 (receipt v1 path Scenarios A / B / C); Q78 →
  item 8 (payment failure / reversal lifecycle, proposal-and-
  confirm). Items 9–11 carry cross-cutting concerns (item 9
  vendor master integration with INV-AGENT-006; item 10 schema
  deltas; item 11 reserved enums and audit events) that span
  multiple Q-closures. A future contributor reviewing ADR-0015's
  Q-closure provenance can read this map for an at-a-glance index
  before diving into the Decision items themselves.

- **Future-amendment expectations.** ADR-0015 is expected to
  receive amendments as the post-v1 phases scope. The expected
  amendment vectors:
  - **Activation of reserved bundle types.** When the
    `final_invoice_with_applied_deposit` and
    `vendor_credit_applied_to_bill` bundle types activate (per
    ADR-0012 §12), ADR-0015 amends item 6 to specify the v1
    active subset extension and the per-bundle-type child
    composition becomes load-bearing. The `bundle_type` enum
    membership itself does NOT need amendment — the values were
    reserved at v1 schema time per ADR-0012 §12.
  - **Activation of reserved prepayment / credit status values.**
    Activation of `written_off`, `forfeited`, `expired` ships
    with a workflow brief per the reserved-enum-states
    discipline.
  - **Per-org tax-timing default override surface.** When the
    org-settings UI ships, the per-org default flips from
    system-fixed `review_required` to per-org configurable.
    ADR-0015 amends item 4 to flip the configurability switch
    and add the per-org override audit event.
  - **Multi-jurisdiction tax-timing defaults.** When non-Canadian
    customer scope opens, ADR-0015 amends item 4 to add the
    per-jurisdiction default lookup table.

- **What ADR-0015 will NOT amend (boundary discipline).**
  Per the Anti-overscope discipline section: ADR-0015 amendments
  must NOT extend into ADR-0016 (relationship graph), ADR-0017
  (vendor template post-v1 enforcement), ADR-0018 (Relationship
  Router matching algorithm), ADR-0019 (confidence calibration
  governance), or ADR-0014 (OCR / extraction behavior). If a
  future amendment proposes content in any of those areas, the
  amendment is misplaced and should be re-scoped to the owning
  ADR. The Tier 4 / Tier 5 / Tier 6 dependency chain is
  load-bearing; ADR-0015 absorbing decisions from those tiers
  would invert the dependency direction and break the Phase 0
  ratification ordering.

- **The Reading B preservation in item 8 is the architectural
  load-bearing decision of this ADR.** A future contributor who
  proposes auto-reverse for payment failures (or auto-write of
  any reversal entry from a Spend-domain service) is proposing a
  Reading B violation and the rejection is hard. The auto-reverse
  alternative was considered explicitly (Alternative 3) and
  rejected on four grounds (Reading B violation, audit-trail
  visibility loss, conflation of signal handling with ledger
  authority, acceptable v1 latency). Post-v1 calibration of the
  proposal-and-confirm flow's controller-gate latency may flow
  through the ADR-0017 vendor template substrate (the same path
  Q60 post-v1 portion takes); but auto-reverse without the
  calibration substrate is rejected categorically.

- **Failure-notice link-role gap (forward-pointed to post-v1
  Banking domain ADR).** A bank/card failure event per item 8
  produces a notice document (ACH return notice, wire-bounce
  notification, NSF letter, card chargeback report, etc.). v1
  has no typed `link_role` for this attachment: the notice
  either attaches via `payment_evidence` (semantically incorrect
  — `payment_evidence` describes "the payment occurred," not
  "the payment failed") or remains unattached, with the
  controller pasting a free-form pointer into the
  `payment_failure_reversed` audit event's `failure_reason`
  field. Per the post-D4 mini-decision dispatch
  (`docs/09_briefs/phase-2/2026-05-04-evidence-link-coordination.md`,
  Question 2 Option 2A ratified), `link_role = 'failure_notice'`
  is reserved post-v1 in ADR-0016 §2; v1 emits the value via no
  service path. Activation lands when the post-v1 Banking domain
  ADR scopes — at which point `paymentService.commitFailureReversal()`
  extends to include a `ProposedAttachment(attach_failure_notice)`
  step in the proposal lifecycle. v1 cohort volume (estimated
  fewer than five payment failures across v1 duration) makes the
  inline-pointer interim path operationally tractable. A future
  contributor implementing post-v1 Banking domain enforcement
  who sees this gap should activate `failure_notice` at that
  time per ADR-0016's validity-matrix activation discipline.

- **Manual + automated path uniformity (per ADR-0012 §11).**
  ADR-0015 inherits the rule: manual born-paid workflows run
  through the same `billService.postWithImmediatePayment(bundle)`
  the automated path uses; manual payment-failure-reversal runs
  through the same `paymentService.commitFailureReversal()` the
  future banking-integration path will use. A future contributor
  who proposes a "manual fallback" path that bypasses the domain
  service (e.g., authoring journal entries directly from a
  generic form) is proposing a manual / automated path
  divergence; the divergence creates the failure mode where the
  same scenario taken twice (once manual, once automated)
  produces structurally different ledger states.

- **Manual born-paid workflow uses existing
  `route_to_manual_entry` resolution-action with subtype
  payload.** A future contributor implementing Scenario C's
  manual workflow (item 7) might be tempted to introduce a new
  `manual_born_paid_workflow` value on ADR-0011 §13's
  exception-queue resolution-action enum to discriminate the
  manual born-paid case from other manual-entry cases. **Do not
  extend the resolution-action enum for this purpose.** The
  manual born-paid workflow is a UI / form discriminator, not a
  new resolution-action category: the queue routes to manual
  entry via the existing `route_to_manual_entry` resolution
  action; the form subtype payload (e.g.,
  `manualBornPaidBundleEntry`) determines that the manual entry
  is a born-paid bundle; the form commit produces the canonical
  `billService.postWithImmediatePayment(bundle)` path per
  ADR-0012 §11 manual + automated path uniformity. ADR-0011 §13
  closed its v1 active resolution-action subset; extending that
  subset to add a UI-discriminator value would re-litigate D2
  ratification's enum-membership decision. The form-subtype
  payload is the correct extension point.

- **The `failed` payment-state vs mutation-lifecycle state
  distinction is load-bearing.** Item 8's distinction — `failed`
  is a payment-state (domain entity state on `payments`), NOT a
  mutation-lifecycle state — must be preserved by every future
  amendment. The canonical mutation-lifecycle vocabulary from
  `mutation_lifecycle.md` is unchanged; AP/Spend domain entities
  carry their own state columns with their own transition
  vocabularies. A future contributor who proposes to "unify" the
  two by adding `failed` to the mutation-lifecycle states is
  conflating two distinct vocabularies. The distinction is
  necessary because a failure-reversal `ProposedMutation` flows
  through canonical mutation-lifecycle states (Pending → Approved
  → Posted (manual) → Finalized) while the underlying
  `payments.payment_state` flips from `paid` to `failed` as a
  result of that mutation committing. Both states change as part
  of the same workflow, but they live on different entities and
  use different vocabularies.

- **The vendor master integration item 9 is the load-bearing
  fraud control.** INV-AGENT-006 enforcement at the service
  layer is the most important AP fraud control in v1. A future
  contributor who proposes loosening the System-ceiling rule
  (e.g., allowing AP-specialist authority to approve bank-detail
  changes for vendors with high clean-approval-count) is
  proposing a fraud-control reduction that is out of scope for
  ADR-0015 amendments. The System-ceiling rule is registered in
  `agent_autonomy_model.md` §6 row 7 and §10 INV-AGENT-006; any
  reduction requires amending those two locations first, with
  controller-and-founder review at the governance layer, before
  ADR-0015 can amend the corresponding service-layer enforcement
  surface. This is the same pattern as Q60: governance amendment
  first (in `agent_autonomy_model.md`), domain ADR amendment
  second (in ADR-0015) — never in reverse order.

- **Bank-detail-evidence link-target gap (forward-pointed to
  post-Phase-0 ADR).** A controller authoring a vendor
  bank-detail change per item 9 has out-of-band verification
  documentation (an email confirming new bank details with the
  vendor; a screenshot of a phone-call confirmation; a signed
  change form). v1 has no defined attachment target for this
  documentation in the link graph: the
  `vendor_bank_detail_change_confirmed` audit event captures
  the controller_user_id, prior values, new values,
  out-of-band-verification claim timestamp, and trace_id, but
  the supporting source document attaches inline-in-form only
  (controller pastes verification context into the audit
  event's `description` field, or attaches the document through
  ad-hoc means outside the structured link graph). Per the
  post-D4 mini-decision dispatch
  (`docs/09_briefs/phase-2/2026-05-04-evidence-link-coordination.md`,
  Question 1 Option 1C ratified), the architectural decision
  between (a) introducing a `vendor_change_proposal` entity
  with its own attachment surface, and (b) activating
  `vendor_master` in the v1 active `linked_entity_type` subset
  with a new `bank_detail_evidence` link-role, is forward-
  pointed to a post-Phase-0 ADR (likely the Banking domain ADR
  or a vendor-master-workflow ADR). v1 cohort volume (estimated
  fewer than ten bank-detail changes across v1 duration) makes
  the inline-in-form interim path operationally tractable. The
  v1 INV-AGENT-006 fraud control gate is mechanical regardless
  of structured-link evidence presence — the missing typed link
  is an audit-trail polish gap, not a fraud-control gap. A
  future contributor implementing the post-Phase-0 vendor-
  master-workflow ADR should resolve the entity-vs-direct-link
  question at that time with full Banking-domain context.
