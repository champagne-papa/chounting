# Spend Initiative — Phase 2 Brief

**Status:** Ratified per Phase 0 closure verification 2026-05-04 (Session 2F). Canonical Phase 2 planning artifact for the Spend subdomain (AP bills + payments + vendor prepayments + vendor credits). Renamed from `ap_ingestion_initiative.md` per the 2026-05-02 Document Platform reframe; substrate-shaped sections moved to `document_platform_initiative.md`. NOT authorized for code outside Phase 5 (Spend / AP foundation) scope per the Phase 0 closure verification artifact's Phase 1 code-start gate authorization framing.

**Date:** 2026-05-01

**Resolution path:** Two Spend-Initiative-owned ADRs (AP/Spend Subdomain — ADR-0015; Vendor Template Substrate — ADR-0017) plus the seven Document-Platform-owned ADRs (per `docs/09_briefs/phase-2/document_platform_initiative.md` §16) ratified across D1–D6 gates 2026-05-03 / 2026-05-04. Open questions Q35–Q52 are retired (see `docs/02_specs/open_questions.md` Section 3 supersession note); Q53–Q79 are filed; the Spend-domain subset is Q59, Q60, Q61, Q62, Q63, Q64, Q74, Q78 (closed by ADR-0015 D4 ratification 2026-05-04).

**Relationship to existing architecture:** First domain consumer of the Document Platform substrate (per `docs/09_briefs/phase-2/document_platform_initiative.md` and `docs/09_briefs/phase-2/document_platform_reframe_design.md`). Operationalizes Simplification 3 from `docs/03_architecture/phase_simplifications.md` (AP Agent as the second real agent). Adopts the existing reserved Phase 2+ tables (`bills`, `bill_lines`, `payments`, `vendors`, `vendor_rules`) from `docs/02_specs/data_model.md`. Does not change the Authority Gradient, the Agent Ladder, the Two Laws, the Service Communication Rules, or any existing invariant in `docs/02_specs/invariants.md`.

**Section locator note.** A brief-writer scanning by expected
section number per the T2 review prompt should note three
deliberate departures from the §1–§21 default layout: the ADR list
lives at §13 (not §17), the screenshot-gate UI surface inventory
lives at §11.5 nested under Phase A acceptance criteria (not §18),
and the verification-against-canonical-docs section lives at §18
(not at the tail). The narrative ordering — acceptance criteria →
hard prerequisites → ADRs → open questions → deferred → friction-
journal → NOT-do → verification → review history — was chosen so
the document reads top-to-bottom as a Phase 2 brief rather than a
checklist; the locator note is the trade-off.

---

## 1. Why this initiative exists

The Spend Initiative is the first domain consumer of the Document Platform substrate. It implements the AP/Spend subdomain — bills, payments, vendor prepayments, vendor credits, payment evidence — that turns vendor invoices and POS receipts into ledger entries and ledger entries into payments. The Document Platform brief (`docs/09_briefs/phase-2/document_platform_initiative.md`) provides the document-shaped substrate (storage, ingestion, extraction, classification, relationship routing); the Spend Initiative provides the accounting-shaped destination (manual AP foundation first, then automated routing as later phases ship).

The Phase 2 plan (`docs/03_architecture/phase_plan.md`) names the AP Agent as the first concrete Phase 2 deliverable. Simplification 3 commits to using the AP Agent as the comparison point that reveals what shared agent infrastructure is actually needed. The 2026-05-02 reframe (`docs/09_briefs/phase-2/document_platform_reframe_design.md`) operationalized that simplification by separating the substrate (Document Platform) from the first domain (Spend / AP).

> **Document Platform is the foundation.**
> **AP/Spend is the first domain.**
> **Extraction is a feeder.**
> **Domain services produce ledger operations; the ledger service
> is the only writer of journal entries.**
> **Existing CHOUnting mutation and invariant discipline remains
> the authority.**

> **History footnote (2026-05-02 reframe).** Prior to the reframe,
> this brief was the AP Ingestion Initiative and its lede sentence
> read: *"Extraction is a feeder. AP is the foundation. The payment
> approval gate is separate. The existing CHOUnting
> mutation/invariant system remains the authority."* That sentence
> was correct under the assumption that B2B PDF invoices are the
> only v1 ingestion shape. The reframe surfaced that receipts,
> retainers, deposits, vendor statements, credit memos, and other
> document types do not fit the AP bill lifecycle, regardless of
> volume. The new five-sentence canonical lede above replaces the
> old one in all forward-looking work; the original is preserved
> here for traceability.

## Conceptual anchor

Documents are evidence. Bills, payments, prepayments, credits,
and applications are accounting/domain objects. The Spend
Initiative implements the AP/Spend subdomain as the first
consumer of the Document Platform substrate.

## 2. Locked v1 scope

Internal-only audience (founder + two real users from the Phase 1.3
exit criteria). AP bills only — AR invoices are Phase 3+ and
explicitly deferred. The manual AP-bill lifecycle is Phase A and is
the foundation; everything else (extraction, drag-drop, forwarded
mailbox, auto-post) gates on Phase A shipping. Phase 0 (the
ADR-and-questions block) gates Phase A. Drag-drop and forwarded
mailbox (Phases C and D) are independent of each other once the
Phase B extraction pipeline ships and may run in parallel. Drag-
drop PDF and forwarded mailbox are the only v1 ingestion channels.
Storage uses the `storage_provider` discriminator from day one with
Supabase Storage as the default and SharePoint as opt-in per-org.
Deterministic TypeScript extraction only — no Python sidecar in v1.

**V1 deliverables:**

- `ProposedMutation` with the three AP intent-type variants (§3).
- `bills` records (the existing reserved table, adopted as-is per
  §5.1).
- Payment approval workflow (`approve_bill_for_payment` mutation per
  §3).
- `payments` records for bill-payment recording (existing reserved
  table, adopted as-is with payment-allocation columns added per
  §5.1).
- Attachment / evidence chain via the storage_provider abstraction
  (§6).
- AP aging view, open bills view, vendor balance view, payment
  approval queue, paid bills history, exception queue (§11.4 — all
  six surfaces ride the screenshot gate; enumerated in §11.5).

**V1 explicitly excludes:** Python OCR sidecar, linked Outlook /
Gmail OAuth ingestion, photo / mobile receipt capture, receipt-bill
matching, first-class batch ingestion, auto-pay (the agent never
debits cash without a separate human approval), AR invoices, and
multi-currency on bills (Q42 deferred).

## 3. Two lifecycles, named explicitly

Two distinct lifecycles operate on every AP bill flow. The
**mutation lifecycle** (the six states from
`docs/02_specs/mutation_lifecycle.md` — Pending, Needs Attention,
Approved, Posted (auto), Posted (manual), Finalized) governs *the
action* — what state is the proposed mutation in, what can happen
to it next. The **AP bill lifecycle** (a domain enum on
`bills.status` — `draft`, `posted`, `approved_for_payment`,
`scheduled`, `partially_paid`, `paid`, `voided`, `reversed`,
`disputed`, `duplicate`) governs *the entity* — what state is this
specific bill in.

The two lifecycles are orthogonal but coupled. A single AP bill
state transition is produced by a single completed mutation
lifecycle.

**`ProposedMutation` variants for the Spend subdomain.** All variants
ride the existing `ProposedMutation` shape from
`docs/02_specs/intent_model.md` §3 — there is no parallel
`ProposedBill` system. The v1 variants are:

```typescript
ProposedMutation {
  intent_type: "post_bill" | "approve_bill_for_payment" | "record_bill_payment",
  domain: "accounts_payable",
  payload: ProposedBillPayload | ProposedBillApprovalPayload | ProposedBillPaymentPayload,
  // ... existing ProposedMutation fields (delta, justification, policy_evaluation,
  // lifecycle_state, created_at, created_by) per intent_model.md §3
}
```

**Spend-domain extensions (per the 2026-05-02 reframe).** The
following intent variants extend the v1 surface beyond the
original three. Each rides the existing `ProposedMutation` shape;
`post_bill_with_payment` is a `ProposedMutationBundle` per the
Document Platform brief; `attach_payment_evidence` is a
`ProposedAttachment` per the reframe spec §14:

- `record_vendor_prepayment` — record a vendor prepayment / deposit / retainer (creates a `vendor_prepayments` row).
- `apply_vendor_prepayment_to_bill` — apply an open vendor prepayment to a posted bill (creates a `vendor_prepayment_applications` row).
- `record_vendor_prepayment_refund` — record a vendor refund of an unused prepayment.
- `write_off_vendor_prepayment` — write off a forfeited prepayment.
- `post_vendor_credit` — post a vendor credit memo (creates a `vendor_credits` row).
- `apply_vendor_credit_to_bill` — apply an open vendor credit to a bill (creates a `vendor_credit_applications` row).
- `post_bill_with_payment` — born-paid bundle: posts a bill and immediately records its payment in one atomic ProposedMutationBundle. The domain service is `billService.postWithImmediatePayment(...)`. See spec §15 for the receipt-driven workflow that produces this bundle and the manual-born-paid workflow callout.
- `attach_payment_evidence` (`ProposedAttachment` variant — no ledger mutation; per spec §14): attach a receipt / payment-confirmation document to an already-recorded payment via `documentLinkService.create()`. Distinct from `record_bill_payment` because no journal entry is produced.

Rendering uses **`ProposedBillCard`** as a *specialization* of
`ProposedEntryCard`, not a replacement. The card honors the Four
Questions grammar from `intent_model.md` §5 unchanged; what differs
is the payload shape it renders (vendor, bill number, due date,
line allocations, attached evidence). Ghost-row rendering of the
proposed bill (during the Pending and Needs Attention mutation
states) honors the four-signal contract from ADR-0004 unchanged.
Sibling specialization cards (`ProposedPrepaymentCard`,
`ProposedCreditCard`, `ProposedBundleCard`,
`ProposedAttachmentCard`) ship under the same shape rules.

### 3.1 The explicit mapping table

Each AP bill state transition is produced by a single
`ProposedMutation` running through the six-state mutation lifecycle.
The table is the load-bearing reference any future schema or
service work consults to answer "which mutation produces this
transition?":

| Mutation `intent_type`       | Mutation lifecycle path                              | AP bill / vendor_prepayment / vendor_credit lifecycle transition                                                                |
|---|---|---|
| `post_bill`                  | Pending → Approved → Posted (manual or auto)         | bill: `draft` → `posted`                                                                           |
| `approve_bill_for_payment`   | Pending → Approved → Posted (manual or auto)         | bill: `posted` → `approved_for_payment`                                                            |
| `record_bill_payment`        | Pending → Approved → Posted (manual or auto)         | bill: `approved_for_payment` → `paid` (full) or `partially_paid` (partial)                         |
| `record_vendor_prepayment`   | Pending → Approved → Posted (manual; Always Confirm v1) | vendor_prepayment: (none) → `open` (creates row); `payments` row created with `payment_purpose = 'vendor_prepayment'` |
| `apply_vendor_prepayment_to_bill` | Pending → Approved → Posted (manual; Always Confirm v1) | vendor_prepayment: `open` → `partially_applied` or `fully_applied`; bill: applied amount reduces open balance via `vendor_prepayment_applications` |
| `record_vendor_prepayment_refund` | Pending → Approved → Posted (manual; Always Confirm v1) | vendor_prepayment: `open` → `refunded`; `payments` row created with `payment_purpose = 'vendor_refund'` (negative-direction) |
| `write_off_vendor_prepayment` | Pending → Approved → Posted (manual; Always Confirm v1) | vendor_prepayment: `open` → `written_off` (terminal); JE writes off remaining balance |
| `post_vendor_credit`         | Pending → Approved → Posted (manual; Always Confirm v1) | vendor_credit: (none) → `open` (creates row); JE recognizes credit per credit-memo path |
| `apply_vendor_credit_to_bill` | Pending → Approved → Posted (manual; Always Confirm v1) | vendor_credit: `open` → `partially_applied` or `fully_applied`; bill: applied amount reduces open balance via `vendor_credit_applications` |
| `post_bill_with_payment` (`ProposedMutationBundle`) | Pending → Approved → Posted (manual; Always Confirm v1) | bill: (none) → `paid` atomically via `billService.postWithImmediatePayment(...)`; both legs (Dr Expense / Cr AP, then Dr AP / Cr Bank-or-Card) commit in a single DB transaction |
| `attach_payment_evidence` (`ProposedAttachment`) | Pending → Approved → Posted (manual; Always Confirm v1) | no entity-state transition; writes `source_document_links` row with `link_role = 'payment_evidence'` against an existing `payments` row |

Three notes on this table:

- **Reversal of a posted bill** travels through the existing reversal
  path per ADR-0001. The bill's status updates to `reversed` after
  the reversal entry posts. The reversal mutation itself is Always
  Confirm (System ceiling per `agent_autonomy_model.md` §6 Item 2);
  no auto-undo, even within the 24-hour reversible window — see §9.2.
- **Reversed vs voided.** Both terminal states produce reversal
  entries under ADR-0001; the bill-status flag distinguishes
  *intent*. Status `reversed` is set when a posted bill is
  corrected via reversal (e.g., wrong amount, wrong vendor,
  wrong tax code — the operator wants the entry to disappear so
  a corrected re-post can take its place). Status `voided` is
  set when a posted bill is deliberately terminated without
  correction (e.g., bill posted, never paid, vendor relationship
  ended; or duplicate detected post-posting and the controller
  chooses to leave the duplicate ledger trail rather than
  re-post). The downstream JE shape is identical; the status
  flag is what reporting and the AP aging view use to classify
  the bill. Voiding flow is a v1 fast-follow if scope permits;
  otherwise deferred to a post-v1 phase.
- **Duplicate** is set by the exception-queue triage path; see §11.3.

The bill states `scheduled` (between approved-for-payment and the
actual cash movement) and `disputed` (manual override) are reserved
under `ADR-0010` reserved-enum-states discipline. Their transitions
are a v1 fast-follow if scope permits; otherwise deferred to a
post-v1 phase. Their specific autonomy-rung calibration is filed
as Q36 (see §14).

## 4. Tier 1 / Tier 2 / Tier 3 placement

The Spend Initiative consumes the Document Platform's Tier 2 / Tier 2.5 output (extraction artifacts and routed `ProposedMutation` / `ProposedMutationBundle` / `ProposedAttachment` proposals) and commits them at Tier 1. The Tier 1 commit-boundary discussion is load-bearing for everything that follows and cannot be re-litigated in any Spend subdomain session.

**Tier 1 — Commit Path.** The single committing agent and the
deterministic services it calls (`billService.post`,
`billService.postWithImmediatePayment`, `billService.approveForPayment`,
`billService.recordPayment`, `vendorPrepaymentService.record`,
`vendorPrepaymentService.applyToBill`, `vendorCreditService.post`,
`vendorCreditService.applyToBill`, `vendorService.create`,
`vendorService.update`, `documentLinkService.create`). Every Tier 1
mutation flows through `withInvariants()` per Service Communication
Rule 1 (`docs/02_specs/ledger_truth_model.md` §Service Communication
Rules). Every domain service produces ledger operations via the
ledger service (Reading B per the reframe spec §5) — domain services
never insert into `journal_entries` or `journal_lines` directly.
The Agent Ladder (Always Confirm / Notify & Auto-Post / Silent Auto)
governs autonomy on this path — see §9. Auto-post is deferred past
v1 per the reframe spec §11; all v1 proposals are Always Confirm.

**Tier 1 commit-boundary constraints (Spend brief scope):**

1. **Tier 1 commits via `withInvariants()`** per Service
   Communication Rule 1 in `ledger_truth_model.md`. Every Spend-domain
   service mutation passes through the same wrapper that journal
   entries do today.
2. **Confidence is internal-only** per ADR-0002. Confidence scores
   from upstream extraction / classification / routing feed the
   autonomy decision tree but never appear on `ProposedBillCard`,
   `ProposedPrepaymentCard`, `ProposedCreditCard`, or any other
   user-facing surface, error message, or export format. The
   user-facing surface is policy-outcome language — see ADR-0002
   Principle 2.

**Tier 3 — Interface Path.** The user sees one agent (the same
"unnamed senior bookkeeper" voice from ADR-0006). The internal
decomposition does not leak. When the Document Platform has
produced a Spend-domain proposal, the chat surface presents it as
the agent's proposal — Tier 2 stage names never appear in
user-facing text.

**Tier 2 extraction pipeline.** Moved to `docs/09_briefs/phase-2/document_platform_initiative.md` §4 per the 2026-05-02 reframe. Tier 2 stages (PDF probe, text extraction, OCR, field extraction, table extraction, validation) and the Tier 2 / Tier 2.5 placement question (per Q66) live entirely in the Document Platform brief. The Spend Initiative consumes Tier 2 output via the ProposedMutation / ProposedMutationBundle / ProposedAttachment handoff; Tier 1 commit through `withInvariants()` and the ledger service stays in this brief.

## 5. Data model

The schema for v1 is a small, deliberate extension of the existing
Phase 2+ reserved tables. Every money column is a branded
`MoneyAmount` text per **INV-MONEY-001** (Layer 2; see
`ledger_truth_model.md`). Idempotency reuses the existing
`ai_actions` slot per **INV-IDEMPOTENCY-001** — no new
`idempotency_key` columns are introduced on AP tables. Actor
identity for every mutation is read from `audit_log.actor_id` per
the Phase 1.5A convention; **no `_by` denormalization columns**
(no `created_by`, `posted_by`, `approved_for_payment_by`, or
`paid_by` on AP rows).

Reserved-enum-states discipline per **ADR-0010** governs every
status enum: pre-allocate the full Phase 2 value set at initial
shipping; default to the terminal Phase A state; scope CHECK
constraints to the discriminator that motivates the reservation;
defend at three layers (DB CHECK, Zod boundary rejection of
client-provided values, service no-emit rule).

### 5.1 Reservation reconciliation

`docs/02_specs/data_model.md` already reserves five Phase 2+ AP-
adjacent tables: `bills`, `bill_lines`, `payments`, `vendors`,
`vendor_rules`. The CTO source document used `ap_bills` and
`bill_payments`. **This brief recommends adopting the reserved
names as-is**, with one minor extension to `payments`:

| Reserved name (data_model.md) | CTO source name | Brief recommendation | Justification |
|---|---|---|---|
| `bills`             | `ap_bills`        | **Adopt `bills`**            | Reservation is AP-shaped (`vendor_id`, `bill_number`, `due_date`); reusing avoids a redundant `ap_bills` table that would duplicate the reservation. Phase 3 AR uses `invoices`, also reserved.                                                              |
| `bill_lines`        | `bill_lines`     | **Adopt `bill_lines`**       | Names match.                                                                                                                                                                                                                                                |
| `payments`          | `bill_payments`  | **Adopt `payments`** with an explicit `applied_to` discriminator | Reservation is intentionally generic (`payment_id`, `payment_date`, `amount`); Phase 2 extends with bill-matching/allocation columns per the existing `data_model.md` note. A future AR receipt path will share the table. The CTO's `bill_payments` semantics live in the discriminator + allocation table introduced below; keeping the table name `payments` matches the reservation. |
| `vendors`           | `vendors`        | **Adopt `vendors`**          | Names match.                                                                                                                                                                                                                                                |
| `vendor_rules`      | `vendor_rules`   | **Adopt `vendor_rules`**     | Names match. Already RLS-scoped to controllers per `data_model.md` Part 2.                                                                                                                                                                                  |

The schema work in Phase A activates each table by extending columns
on top of the existing reservation, not by creating new tables. A
deviation from this recommendation requires its own friction-journal
entry and ADR section before code lands.

### 5.2 New columns and tables

**`bills` extensions (Phase A migration).** Add `status
bill_status NOT NULL DEFAULT 'draft'` (the AP bill lifecycle enum
from §3); `due_date` (already in reservation, marked NOT NULL on
`post_bill`); `payment_terms_days`; `purchase_order_id` reserved as
nullable column for the Phase F PO module — see §15. All money
columns convert to `MoneyAmount` text per INV-MONEY-001
(`amount_original`, `amount_cad`, `tax_amount_total`).

**`bill_lines` extensions.** Add `account_id` (already in
reservation; populate at post time); `tax_code_id` for Canadian
GST/HST/PST single-rate per line per §8.1; `line_number` for stable
ordering in the UI.

**`payments` extensions (the big one).** The reserved table needs:
`applied_to` discriminator (`'bill' | 'invoice'` — invoice path is
Phase 3+ but the column ships day one); `payment_method` enum
(`cheque`, `eft`, `wire`, `credit_card`, `cash`, `other`);
`reference_number` text. Plus an explicit allocation table to
support partial payments and one-payment-many-bills:

```sql
CREATE TABLE bill_payment_allocations (
  bill_payment_allocation_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id                  uuid NOT NULL REFERENCES payments(payment_id) ON DELETE CASCADE,
  bill_id                     uuid NOT NULL REFERENCES bills(bill_id),
  amount_cad                  text NOT NULL,  -- MoneyAmount per INV-MONEY-001
  amount_original             text NOT NULL,
  fx_rate                     text NOT NULL,
  created_at                  timestamptz NOT NULL DEFAULT now()
);
```

This is a junction table. Bill status updates from
`approved_for_payment` to `partially_paid` or `paid` at allocation
time, computed from the sum of allocations against the bill.
Service-layer constraint: the sum of allocations cannot exceed the
bill's `amount_cad`.

**`vendors` and `vendor_rules`.** Reserved tables ship as-is for v1
with two new columns each: on `vendors`, `default_storage_path`
(nullable, used by SharePoint per-vendor folder structure — owned
by the Document Platform brief); on `vendor_rules`,
`clean_approval_count` (driver of the substrate-portion vendor-
template ADR — see §7).

**`payment_purpose` discriminator on `payments`.** Distinct from `payment_method` (which is a physical channel: cash / cheque / EFT / wire / credit_card / ACH / other). `payment_purpose` is accounting intent: `bill_payment | vendor_prepayment | vendor_refund | customer_payment | employee_reimbursement | owner_reimbursement | tax_payment | other`. A wire can pay a bill or fund a retainer; a credit card charge can be a POS expense or a deposit. Method does not determine accounting intent. Reserved per ADR-0010 discipline.

**`vendor_prepayments`** (new table, reserved schema seats; manual workflow in v1). Records vendor deposits, retainers, advances, and security deposits paid before the underlying bill exists. Tracks remaining balance, allocation history (via `vendor_prepayment_applications`), and refund / write-off terminal paths. Final shape (active vs reserved type values, status enum) closes on the AP/Spend Subdomain ADR (Q59).

**`vendor_prepayment_applications`** (new junction table, reserved schema seats; manual workflow in v1). Allocates open `vendor_prepayments` against posted `bills` through `apply_vendor_prepayment_to_bill`. Service-layer constraint: sum of allocations cannot exceed the prepayment's original amount.

**`vendor_credits`** (new table, reserved schema seats; manual workflow in v1). Records vendor-issued credit memos (memo-shaped credits issued by the vendor against prior bills, distinct from credit memos that reverse a bill). Tracks remaining balance and allocation history (via `vendor_credit_applications`). Replaces the §8.3 deferral in the original brief; v1 ships the manual workflow.

**`vendor_credit_applications`** (new junction table, reserved schema seats; manual workflow in v1). Allocates open `vendor_credits` against posted `bills` through `apply_vendor_credit_to_bill`. Service-layer constraint: sum of applications cannot exceed the credit's original amount.

**`source_documents` and evidence linking.** Moved to `docs/09_briefs/phase-2/document_platform_initiative.md` per the reframe. The original brief's per-domain `bill_attachments` table is superseded by the polymorphic `source_document_links` table in the Document Platform brief. Spend-domain code consumes `source_document_links` rows where `linked_entity_type IN ('bill', 'payment', 'bill_payment_allocation', 'vendor_prepayment', 'vendor_prepayment_application', 'vendor_credit', 'vendor_credit_application')`.

### 5.3 Bill autonomy rule shape (`vendor_rules` consumer)

Every AP-bill auto-post decision routes through the existing Agent
Ladder per `agent_autonomy_model.md`. The matched rule is a
`vendor_rules` row keyed on `vendor_id` with the Phase 2 columns
already named in the reservation (`autonomy_tier`, default account
mappings) plus the new `clean_approval_count` integer. Vendor
templates promote rules per §7. Auto-post is deferred past v1 per
the reframe spec §11; the substrate ships under ADR-0010 reserved-
enum-states discipline alone, and the full enforcement / promotion
/ auto-post calibration ADR is drafted and ratified post-v1.

### 5.4 Multi-entity reservation

Per the reframe spec §17, four entity-related reservations land in v1 Spend schema even though full multi-entity support is post-v1:

- **`bills.legal_entity_id`** (nullable, reserved). The legal entity that owns the AP bill.
- **`bill_lines.benefiting_entity_id`** (nullable, reserved). Allocation-level entity for line-level intercompany due-to / due-from.
- **`payments.paying_entity_id`** (nullable, reserved). The entity whose bank account moved cash.
- **`payments.benefiting_entity_id`** (nullable, reserved). The entity that carries the expense.

Reserved exception type: `wrong_entity_exception` — document addressed to a legal entity not currently configured in the org. Routes to controller review. Full intercompany due-to / due-from postings are post-v1.

## 6. Storage abstraction

Moved to `docs/09_briefs/phase-2/document_platform_initiative.md` §6 per the 2026-05-02 reframe. The Document Platform brief is the canonical home for the `storage_provider` discriminator, Supabase + SharePoint per-org configuration, drift detection, queue-and-retry policy, and the controller-override path. The Spend Initiative consumes that substrate; bill / payment / prepayment evidence rides through it via `source_documents` and `source_document_links` (also in the Document Platform brief).

## 7. Vendor onboarding workflow

Vendor creation and update are themselves **`ProposedMutation`** —
not silent service-layer side effects of bill ingestion. Two
specific shapes ship in v1:

- `intent_type = "create_vendor"` — proposed at the moment a
  bill arrives from a vendor not in `vendors`. The pipeline
  produces a vendor proposal with the extracted vendor name,
  contact details, and (if visible on the invoice) bank details.
  The user reviews and approves on a `ProposedVendorCard`
  (specialization of `ProposedEntryCard`, same shape rules as
  `ProposedBillCard`).
- `intent_type = "update_vendor"` — proposed when extraction
  finds vendor master changes (e.g., new bank details on this
  invoice differ from the stored vendor record).

Both mutation shapes are v1 candidate variants; the final shape is
**Q50** (filed in §14). The list of variants in §3 is the AP-bill-
posting subset; the vendor-onboarding subset is filed for Q50
resolution before code.

> **Hard rule (callout).** Vendor bank-detail changes are Always
> Confirm / System ceiling. Extracted invoice or payment
> instructions may suggest a bank-detail change but may never
> update the vendor master automatically. Independent verification
> (out-of-band confirmation with the vendor) is required.
> This is the most important AP fraud control the system has;
> it deserves callout visibility, not parenthetical visibility.
> See `docs/02_specs/agent_autonomy_model.md` §6 Item 2 for the
> System ceiling rule.

**Bank-detail changes are System ceiling — Always Confirm.** Per
`agent_autonomy_model.md` §6 Item 2, modifications to a vendor's
bank-detail fields can never auto-post regardless of the rule's
rung, the per-vendor track record, or the org's policy
configuration. Extraction may suggest bank details on the
`ProposedVendorCard`, but the agent never silently mutates the
vendor master. This is a hard ceiling because bank-detail
substitution is the textbook AP fraud vector.

**Vendor template = autonomy rule with clean-approval semantics.**
A "vendor template" in this initiative is operationally the same
thing as a `vendor_rules` row. When a controller approves N clean
bills from a vendor (the N is configurable per vendor, defaults to
the existing Agent Ladder thresholds), the rule's
`clean_approval_count` increments. At the threshold, the rule
becomes promotion-eligible (per `agent_autonomy_model.md` §4.2),
and the controller may promote it through the existing promotion
ceremony. The "vendor template" framing is product vocabulary; the
implementation is the existing autonomy-rule machinery. Q43 (in
§14) is the open question on whether the clean-approval semantics
need calibration that diverges from journal-entry-style rules.

## 8. Subdomain scoping decisions

Eight specific scoping choices that materially shape v1.

### 8.1 Tax scope locked

V1 = **Canadian GST/HST/PST single-rate per line.** Every
`bill_lines` row carries one `tax_code_id`; the tax amount is
computed from the line's `amount_original` and the seeded tax code's
rate. The `tax_codes` table is already seeded with Canadian
provincial codes from Phase 1.1; v1 reuses it as-is.

**Explicitly deferred:**

- Multi-rate per line (e.g., a single line with both HST and a
  city-level levy).
- Withholding tax (US 1099, payments to non-residents under Reg
  105/116).
- Reverse-charge VAT (international supplier, Canadian recipient
  liable for input/output offset).
- Tax-point vs accounting-date split (tax recognition date differs
  from posting date).

Each of these has its own future-phase shape. Filing as a
sub-question if the founder wants explicit traceability is left to
the §14 prompt cycle; the locked-now-deferred-then frame stays.

### 8.2 Three-way matching deferred

PO-receipt-bill matching is deferred to Phase F (post-v1).
`bills.purchase_order_id` ships day one as a nullable column so
the Phase F PO module activates by populating it without a schema
migration. v1 has no PO module, no goods-receipt module, no
matching tolerance bands; bills post against accounts, not POs.

### 8.3 Vendor credits deferred

Vendor credits (memo-shaped credits issued by the vendor against
prior bills, distinct from credit memos that reverse a bill) are
deferred. The future allocation-against-open-bills semantics are
named here so the schema work in Phase A doesn't accidentally
preclude them: vendor credits will be a `payments`-table sibling
that allocates against `bills` via `bill_payment_allocations` with
a negative-allocation flag. Schema impact in v1: zero.

### 8.4 Document version handling

Five new columns on `source_documents` (already shown in §5.2):
`version`, `supersedes_document_id`, `superseded_by_document_id`,
`correction_reason`, plus `bill_revision_status` on `bills`
(reserved-enum-states under ADR-0010, Phase A terminal `current`).

**Behavior matrix by current bill state:**

- **Bill not yet posted (status = `draft`):** A newer document
  silently supersedes the older one. The pipeline re-runs against
  the new bytes; the `ProposedMutation` updates in place if still
  in Pending, or a new one is produced and the old one is
  discarded if the previous run completed. No human-confirm
  required for the supersession itself; the user is reviewing the
  proposal anyway and sees the latest version.
- **Bill posted but not paid (status = `posted` or
  `approved_for_payment`):** A revision comes in as a separate
  `ProposedMutation` of `intent_type = "edit_bill"` (a v1 candidate
  shape; final structure filed under Q51). The controller approves
  on a `ProposedBillCard` with diff highlighting against the
  current state. On approval, the bill row updates in place
  (a non-ledger update — the journal entry behind the bill stays
  unchanged unless the line amounts changed); the version chain on
  `source_documents` records both copies.
- **Bill paid (status = `paid` or `partially_paid`):** A revision
  cannot edit-in-place. Two `ProposedMutation` operations are
  required: (a) a reversal of the original posting per ADR-0001
  reversal semantics (Always Confirm; reason field captures the
  correction context), and (b) a fresh `post_bill` mutation against
  the corrected document. Both are Always Confirm — the System
  ceiling (`agent_autonomy_model.md` §6) covers the reversal; the
  fresh post inherits the bill's autonomy rule on the new posting.

Filed as **Q51** (full document-version handling matrix) in §14
because the corner cases (a revision that arrives during
mid-payment-batch, a revision against a bill that is itself a
correction of a prior bill) need explicit decision before code.

### 8.5 i18n named-as-deferred

V1 ships **EN-only field anchors** for the extraction pipeline.
The existing chounting i18n infrastructure from Phase 1.2 Session
3 (`messages/{en,fr-CA,zh-Hant}.json`) handles user-facing copy on
`ProposedBillCard` and the AP views — that does not change; it's
already there. What's deferred is **field-level extraction
anchors** for FR/bilingual invoices: the regex / NLP patterns the
extraction pipeline uses to find "Invoice Number," "Total,"
"Tax," "Due Date," etc. on a PDF.

This is a concrete deferral, not a feature request. The
deterministic TypeScript extraction approach for v1 means the
anchor set is enumerable; adding FR anchors is mechanical work
that lands as a v1 fast-follow if scope permits, otherwise
deferred to a post-v1 phase. Quebec customers in v1 either use
the manual-bill path or accept English-anchor extraction with
manual corrections.

### 8.6 Forwarded-mailbox v1 security narrowed

The forwarded-mailbox channel for v1 accepts mail **only from a
hardcoded internal-sender allowlist**. The allowlist is seed data
in the AP subdomain migration; controllers cannot edit it via UI
in v1. The full sender-policy design (per-org allowlists, SPF/DKIM
enforcement, mailbox-rotation, DMARC alignment, retention policy)
is **Q41** (filed for the §14 prompt cycle) and deferred to
Phase 2.5 or whenever external customers cross the threshold.

The implication: forwarded-mailbox in v1 serves the founder + two
real users only. Production-grade sender policy is downstream.

## 9. Trust thresholds and reversal-of-auto-post visibility

Two related but distinct topics: how AP-bill autonomy gets earned
(§9.1), and how auto-posted bills are reversed when something goes
wrong (§9.2).

### 9.1 Trust threshold (Q35 decomposed)

The CTO source decomposed the founder's "3–5 approvals" framing
into three distinct categories. The decomposition is correct; this
brief preserves it semantically and lifts it into the §14 question
filing as **Q35** with its sub-parts:

- **3–5 clean approvals can promote AUTO-FILL / SUGGESTED CODING**
  on the extraction side. This is the low-risk, narrow promotion:
  after 3–5 bills from a vendor where the controller approved the
  agent's coding without edit, the agent surfaces the same coding
  on subsequent bills as a default (still requiring approval). No
  ledger writes happen autonomously; only the form pre-fill
  changes.
- **Auto-post requires the existing Agent Ladder thresholds** from
  `agent_autonomy_model.md` §4.2 — ≥15 clean matches, ≥95% approval
  rate, 30-day window. This is the higher bar: the agent posts the
  bill autonomously into the 24-hour reversible window. **OR** an
  AP-bill-specific calibration if the CTO approves divergence at
  ADR-time (filed under Q35).
- **Payment approval is NEVER implied by bill auto-post.** This is
  §14.2 of the CTO source preserved verbatim semantically: a bill
  on Notify & Auto-Post for posting is on Always Confirm for
  payment by default. Auto-pay (auto-`record_bill_payment`) is
  Phase E (post-v1) and even there will require an explicit
  separate promotion ceremony. The decoupling is deliberate; the
  fraud-defense properties of the chounting autonomy model depend
  on it.

### 9.2 Reversal-of-auto-post visibility

Per `mutation_lifecycle.md` §6, an entry posted via
Notify & Auto-Post enters a 24-hour reversible window. The window
is real — the entry shows the "recently auto-posted" pill, the
controller can click Undo, the system creates a reversal entry per
ADR-0001 — but **the reversal action itself is Always Confirm**.

The chain for reversing an auto-posted bill is:

1. Controller clicks Undo on the auto-posted bill within the
   24-hour window.
2. The system computes the reversal mirror per
   `validateReversalMirror` (INV-REVERSAL-001 in
   `ledger_truth_model.md`).
3. A `ProposedMutation` of `intent_type = "reverse_journal_entry"`
   is produced — the reversal path inherited from Phase 1.1's
   `ProposedEntryCard` shell, expressed in `ProposedMutation`
   shape per `intent_model.md` §3 — with the pre-filled mirror
   lines and `reversal_reason = "User undo within session"` (the
   same default text from `cmd_z_as_reversal.md`).
4. The controller confirms the reversal. **No auto-undo.** The
   24-hour window names the legal undo path; the user must still
   confirm the reversal before the reversal entry posts.

The "Undo within 24 hours" UI copy must be unambiguous on this:
clicking Undo opens the pre-filled reversal form, it does not
post the reversal in a single click. This is the System ceiling
from `agent_autonomy_model.md` §6 Item 2 ("reversal entries"
listed as a class that can never auto-post). Filing for Q45 (in
§14) confirms the routing.

## 10. Phase sequencing

The Document Platform reframe (2026-05-02) restructured phase
sequencing across two briefs. **Open: spec/plan phase-numbering
inconsistency to reconcile.** The reframe spec
(`docs/09_briefs/phase-2/document_platform_reframe_design.md`)
contains two phase numberings that disagree by one position:

- **§2 + §3.2 migration table:** Phases 1–3 are Document Platform
  substrate (Storage / Document Core / Document Relationship
  Graph); **Phase 4 = Spend / AP foundation**; Phases 5–8 are
  additive Spend work (receipts, retainers, statements, credits).
- **§7 ADR-table phase column + Phase 0 governance plan
  (`docs/09_briefs/phase-2/2026-05-03-phase-0-governance-plan.md`)
  §"Subsequent plans needed":** Phases 1–3 substrate; **Phase 4
  = Relationship Router; Phase 5 = Spend / AP foundation**;
  Phases 6–8 are additive Spend work.

This brief uses the **8-phase scheme** below (Phase 5 = Spend
foundation, matching the governance plan's "subsequent plans"
list) because that's the scheme the Phase 0 governance plan
schedules subsequent code-implementation plans against. The
spec §2 vs §7 inconsistency is filed as a post-Session-1
reconciliation item — either §2 + §3.2 migration table need
to be amended to match (and one Phase reassigned), or §7 + the
governance plan need to be amended. The choice does not change
the work; it changes the numbering only. Until reconciliation,
this brief's "Phase N" references the 8-phase scheme.

**Phase 0 prerequisite (governance only).** Per the Phase 0
governance plan (`docs/09_briefs/phase-2/2026-05-03-phase-0-governance-plan.md`)
§7, Phase 0 closes when its nine exit criteria are met: two
ratified briefs (Document Platform + Spend), the Phase 0 ADR set
ratified (ADR-0007 amendment carried prerequisite + ADR-0011
through ADR-0019 per Decision 7 of the governance plan, with the
substrate-only portion of ADR-0017 sufficient for v1), Q53–Q78
filed in `docs/02_specs/open_questions.md` (Q35–Q52 retired per
the supersession note), DOC invariant prefix registered in
`docs/02_specs/invariants.md`, Q28 re-verification expansion
drafted in `docs/02_specs/agent_architecture_policy.md`, Storage
Provider and Tier 2 Document Pipeline ADRs resolving the
substrate decisions. The governance plan §7 is the authoritative
source on the ratification gating; this brief's Phase 5 cannot
start code until those gates close.

**Phase 5 — Spend / AP foundation (manual only).** Spend
subdomain shipping: `bills`, `bill_lines`, `payments`,
`bill_payment_allocations`, `vendor_prepayments`,
`vendor_prepayment_applications`, `vendor_credits`,
`vendor_credit_applications`, `vendors`, `vendor_rules`. Manual
bill UI, payment approval queue, AP aging view, open bills view,
vendor balance view, paid bills history, exception queue
(consumed from Document Platform). **No drag-drop, no email,
no extraction.** Phase 5 exit criteria are §11.

**Phase 6 — Ingestion channels.** Drag-drop + forwarded mailbox
land here (per Document Platform brief §3.1). The Spend domain
consumes the resulting `ProposedMutation` / `ProposedMutationBundle`
/ `ProposedAttachment` handoffs.

**Phase 7 — Extraction pipeline.** OCR engine + Python sidecar
+ DocumentArtifact contract land here (per Document Platform
brief §4 and the Tier 2 Document Pipeline ADR).

**Phase 8 — Proposal handoff + Tier 1 commit.** The wiring that
takes Document-Platform-produced proposals through Spend domain
services to the ledger. Born-paid bundle workflow ships here
via `billService.postWithImmediatePayment(...)`.

**Post-v1 — Controlled Spend auto-post rules.** Promotion
ceremony UI lands under the Vendor Template ADR's full
enforcement portion (drafted post-v1 per reframe spec §11).
Always Confirm in v1; auto-post explicitly deferred. Phase
number assigned at the post-v1 brief-drafting cycle, not now.

**Post-v1 — Three-way matching, first-class batch ingestion,
linked Outlook / Gmail OAuth, photo / mobile receipt capture.**
Listed for scope clarity. Owned by future domain initiatives
(Banking, AR, Procurement) or by post-v1 Spend phases. Phase
numbers and ownership assigned at the future brief-drafting
cycles, not now. The original AP brief used letter-suffixed
phases (E / F / G / H / I) for these post-v1 items; the reframe
retires the letter scheme in favor of explicitly-numbered phases
once each post-v1 initiative drafts its own brief.

The discipline that motivates this sequencing: **do not build
extraction before Spend exists.** Phase 5 is the domain foundation.
The Document Platform brief's substrate phases (1–4) ship before
Phase 5 begins. Phase 5's manual-bill flow is also the fallback
path that every later phase preserves — if Phase 7's pipeline has
a bad day, the controller can still create bills the hard way.

## 11. Phase A acceptance criteria mapped to INV-IDs

This is the §11 with the most operational weight. Every Phase A
acceptance criterion names the chounting invariants it satisfies,
so the Phase A session brief authors can write integration tests
that exercise specific INV-IDs rather than write tests against a
reformulated rule set.

### 11.1 Bill posting acceptance criterion

**Criterion EC-A-1.** Posting a bill produces a journal entry of
the shape `Dr <expense account, per bill_line>` / `Cr <AP control
account>` that is correctly balanced, correctly tax-coded, and
correctly audited.

**Invariants exercised:**

- **INV-LEDGER-001** — debit = credit per journal entry (deferred
  CONSTRAINT TRIGGER `enforce_journal_entry_balance`). The
  multi-line bill must produce a balanced journal_entry.
- **INV-LEDGER-002** — posting to a locked period rejected. The
  bill's `issue_date` must fall in an open period; period-locked
  bills route to the exception queue with reason "Period locked
  — adjust issue_date or unlock period."
- **INV-LEDGER-004** — journal line is debit XOR credit. Each
  posted line is one or the other.
- **INV-LEDGER-005** — journal line is never all-zero. A
  zero-amount bill_line cannot generate a zero-amount
  journal_line.
- **INV-LEDGER-006** — line amounts non-negative. Negative bill
  amounts route through credit-memo path (deferred), not
  `post_bill`.
- **INV-MONEY-001** — money is branded string at the service
  boundary. The `billService.post` Zod schema parses
  `MoneyAmount` per the existing
  `src/shared/schemas/accounting/money.schema.ts`.
- **INV-AUTH-001** — every mutating service call is authorized.
  The `post_bill` ActionName is gated through
  `canUserPerformAction`.
- **INV-SERVICE-001** — every mutating service function is
  invoked through `withInvariants`. Yes; `billService.post` is
  wrapped exactly the way `journalEntryService.post` is.
- **INV-SERVICE-002** — `adminClient` discipline. The bill
  service uses `adminClient`; no `userClient` writes.
- **INV-AUDIT-001** — every mutating call writes an `audit_log`
  row in the same transaction. The bill post writes both the
  `bills` row and the corresponding journal_entry row, with one
  `audit_log` row capturing the mutation per the
  `before_state` capture convention (ADR-0009).
- **INV-IDEMPOTENCY-001** — agent-sourced entries require
  idempotency key. AP-pipeline-sourced posts carry the
  idempotency key from the existing `ai_actions` slot machinery;
  no new column.

### 11.2 Reversal acceptance criterion

**Criterion EC-A-2.** Reversing a posted bill exercises the full
reversal path per ADR-0001.

**Invariants exercised:**

- **INV-REVERSAL-001** — reversal lines mirror the original.
  `validateReversalMirror` runs unchanged against the bill's
  underlying journal_entry.
- **INV-REVERSAL-002** — reversal entries require non-empty
  reason. The bill-reversal flow surfaces the same
  required-reason field as the journal-entry reversal flow.
- All Layer-2 invariants from EC-A-1 apply to the reversal entry
  itself.

### 11.3 State-transition acceptance criteria

Each AP-bill state transition (`posted → approved_for_payment`,
`approved_for_payment → paid` or `partially_paid`) names the same
Layer-2 invariant set as EC-A-1 (the underlying ledger writes
exercise the same rules). Bill-specific reserved INV-IDs may name
rules that **do not yet exist** in `invariants.md` per the
spec-without-enforcement rule from `docs/02_specs/README.md`. Two
candidates for reserved INV-AP-NNN entries (not registered in
`invariants.md` until enforcement lands; documented in the AP
subdomain ADR alongside the schema work):

- **INV-AP-001 (reserved)** — bill_payment_allocation sums never
  exceed bill amount. Layer 2 service-layer enforcement.
- **INV-AP-002 (reserved)** — bill state transitions follow the
  domain enum's allowed paths. Layer 2 service-layer enforcement;
  ADR-0010 reserved-enum-states discipline applies.

**New domain prefix introduced.** INV-AP-NNN registers a new
domain prefix `AP` for the AP subdomain. Existing registered
prefixes per `invariants.md` are LEDGER, MONEY, IDEMPOTENCY, RLS,
AUTH, SERVICE, AUDIT, REVERSAL, ADJUSTMENT, RECURRING; reserved-
in-spec-only prefixes are AGENT, INTENT, LIFECYCLE, CHECKPOINT,
SUBLEDGER-LINK, SUBLEDGER-TIEOUT. The AP-subdomain ADR (§13) is
the artifact that registers `AP` as a recognized prefix.

**One reclassification.** A third candidate the brief originally
filed under `AP` — vendor bank-detail change requires controller
confirmation — is structurally a System-ceiling rule (per
`agent_autonomy_model.md` §6 Item 2), not an AP-domain rule. It
is reclassified to a candidate **INV-AGENT-NNN** (specifically a
sibling of the reserved INV-AGENT-001 "no auto-post across
System ceilings" rule from `agent_autonomy_model.md` §10) because
INV-AGENT already covers System-ceiling enforcement and the AUTH
prefix is broader than the bank-detail-specific case. The AP
subdomain ADR (§13) cross-references this rule but does not
register it; the registration lands when the AGENT prefix
itself activates.

These candidates surface in the AP subdomain ADR; whether each
gets a registered INV-ID at Phase A shipping or stays reserved
until subsequent phases is a per-INV decision the ADR makes.

### 11.4 AP read-side reporting

Six read-side surfaces ship as part of Phase A — they are not
optional polish, they are exit criteria:

| Surface                           | Phase A exit criterion ID | Screenshot gate? |
|---|---|---|
| AP aging view (current / 30 / 60 / 90+)        | EC-A-3 | Yes |
| Open bills view                                | EC-A-4 | Yes |
| Vendor balance view                            | EC-A-5 | Yes |
| Payment approval queue                         | EC-A-6 | Yes |
| Paid bills history                             | EC-A-7 | Yes |
| Exception queue (storage failures, hash mismatches, period-locked posts, etc.) — UI surface owned by Document Platform brief; this row tracks Spend-domain exit criterion EC-A-8 (the *behavioral* requirement that exception routing works for AP-domain failures). The Document Platform brief's §11 owns the UI screenshot gate. | EC-A-8 | Yes (consumed from Document Platform substrate) |

Each surface is computed from `bills`, `bill_lines`,
`bill_payment_allocations`, and `payments` via SQL — no new
projection tables in Phase A.

### 11.5 Screenshot-gate surface inventory

Per the UI-session screenshot gate convention codified in
`CLAUDE.md`, every shipping UI surface in the initiative requires
the orchestrator to plan a 2–5 shot capture sequence. The bounded
inventory for the Spend initiative is **seven AP/Spend-domain
surfaces**:

1. Manual bill creation form (Phase A)
2. `ProposedBillCard` — both in chat and in canvas (Phase B/C)
3. Payment approval card — exit criterion EC-A-6 in §11.4 (Phase A)
4. AP aging view — exit criterion EC-A-3 in §11.4 (Phase A)
5. Open bills view — exit criterion EC-A-4 in §11.4 (Phase A;
   tabular, but a distinct view from AP aging because its
   filters and column shape differ)
6. Vendor balance view — exit criterion EC-A-5 in §11.4 (Phase A)
7. Paid bills history — exit criterion EC-A-7 in §11.4 (Phase A)

Surfaces 5–7 are tabular variants that share styling with surface
4 (AP aging) but ship as distinct views; the screenshot gate
captures each independently to verify column shapes, filter
controls, and totals on each. The list is bounded so orchestrator
capture-sequence planning has a known scope to work against.

**Substrate-shaped surfaces moved.** Per the reframe, the Triage Bucket / drag-drop zone, Forwarded-email arrival notification, Exception queue UI, and Auto-post chat notification surfaces moved to `docs/09_briefs/phase-2/document_platform_initiative.md` §11. The remaining surfaces in this brief are AP/Spend-domain only.

### 11.6 Closeout discipline per CLAUDE.md

Each phase closeout invokes two conventions from the `CLAUDE.md`
"Session execution conventions" block:

- The **UI-session screenshot gate** per §11.5 surfaces in
  scope. The orchestrator drafts the prescribed capture sequence;
  the founder captures against a fresh
  `pnpm db:reset:clean && pnpm db:seed:all` state; the
  orchestrator spot-checks; the gate blocks closeout until
  passed.
- The **push-readiness three-condition gate** from `CLAUDE.md`.
  Phase A's exit criteria EC-A-1 through EC-A-8 are necessary but
  not sufficient — the three-condition gate is the actual push
  gate. Specifically, before Phase A's working branch pushes to
  `staging` or `main`, all three conditions must hold: (1) test-
  suite health (`pnpm test` full-suite green at HEAD, or
  documented carry-forward); (2) doc-sync reconciled
  (`invariants.md` ↔ `control_matrix.md` ↔
  `ledger_truth_model.md` ↔ shipped code; `types.ts` regenerated
  against the post-arc schema; ADRs and obligations reconciled);
  (3) governance closeout (retrospective written; friction-
  journal updated with arc-scope entries; conventions earned by
  fire count codified).

The same pattern applies to every subsequent phase (B, C, D, and
E within v1). The screenshot-gate-only fallback is not
sufficient; phases that ship code without ratifying all three
push-readiness conditions carry forward an obligation to the
next phase's closeout.

## 12. Hard prerequisites

This initiative cannot start coding until **ADR-0007 lands**, which
requires Q27–Q31 resolution. Each prerequisite is a specific item
with a specific scope; together they define the operational
specificity the Tier 2 architecture needs before any Tier 2 system
codes.

| Q | Summary | File pointer |
|---|---|---|
| **Q27** | CLAUDE.md §4 amendment for Tier 2 stateless sub-agents (governance language, not reinterpretation; either §4 sub-bullet (a) or ADR-0007 exception clause (b))                | `docs/02_specs/open_questions.md` Q27 |
| **Q28** | Re-verification matrix at the Tier 2 → Tier 1 boundary (concrete field-level: source / re-verification method / failure mode for each `ProposedMutation` field)               | `docs/02_specs/open_questions.md` Q28 |
| **Q29** | Tier 2 boundary enforcement mechanism (build-time lint preventing `src/agent/pipelines/**` from importing mutating service entry points; ESLint or grep-fail CI check)        | `docs/02_specs/open_questions.md` Q29 |
| **Q30** | Logic Receipt reproducibility under Tier 2 pipelines (extend `justification` with `pipeline_trace` field — option (a) — vs. accept step-level reproducibility loss — option (b)). The CTO mandate is option (a). | `docs/02_specs/open_questions.md` Q30 |
| **Q31** | LLM-planned orchestration prohibition (verbatim rule for ADR-0007's safety contract: "Orchestration between Tier 2 stages MUST be deterministic TypeScript. LLM-planned orchestration is prohibited.")          | `docs/02_specs/open_questions.md` Q31 |

ADR-0007 itself resolves these into a single coherent agent-
architecture-policy document and ships alongside
`docs/02_specs/agent_architecture_policy.md` (the field-level
re-verification matrix). All five questions are operational
specificity, not architectural disagreement; the
`agent_architecture_proposal.md` was already CTO-approved in
principle on 2026-04-19.

## 13. ADRs this initiative produces

Per `docs/09_briefs/phase-2/document_platform_reframe_design.md` §7,
two ADRs land in the Spend Initiative scope:

1. **ADR-0015 — AP/Spend Subdomain.** Bill / payment / prepayment / credit lifecycles. Closes Q59 (vendor prepayment shape), Q60 (born-paid bundle approval), Q61 (vendor prepayment approval), Q62 (deposit tax timing), Q63 (vendor balance composition), Q64 (final invoice + prior credit), Q74 (receipt v1 path), Q78 (payment failure lifecycle).
2. **ADR-0017 — Vendor Template Substrate.** Ratified D4 (2026-05-04). Reserves `clean_approval_count` column on `vendor_rules` and the table shape under ADR-0010 reserved-enum-states discipline. Full enforcement / promotion / auto-post calibration ADR is drafted and ratified post-v1 when auto-post lands. Closes Q43 substrate portion.

The seven Document-Platform-owned ADRs (ADR-0011 Document Platform, ADR-0012 ProposedMutationBundle, ADR-0013 Storage Provider, ADR-0014 Tier 2 Document Pipeline, ADR-0016 Document Relationship Graph, ADR-0018 Relationship Router, ADR-0019 Confidence Calibration Policy) live in `docs/09_briefs/phase-2/document_platform_initiative.md` and gate this brief.

ADR-0007 (three-tier agent architecture, amended for the reframe) is a carried prerequisite that gates all Phase 0 work.

## 14. Open questions

Q35–Q52 from the original AP brief are **retired** per the 2026-05-02 reframe (see `docs/02_specs/open_questions.md` Section 3 Q35–Q52 supersession note). Q53–Q78 file against the reframe scope; the Spend-domain subset is:

| Q | Topic | Disposition (Phase 0 closure 2026-05-04) |
|---|---|---|
| **Q59** | Vendor prepayment object shape | Closed by ADR-0015 D4 ratification (2026-05-04) |
| **Q60** | Born-paid bundle approval gate | Closed by ADR-0015 D4 ratification (Always Confirm in v1; full auto-post calibration deferred post-v1) |
| **Q61** | Vendor prepayment approval gate | Closed by ADR-0015 D4 ratification |
| **Q62** | Deposit / retainer tax timing | Closed by ADR-0015 D4 ratification (default `review_required`) |
| **Q63** | Vendor balance view composition | Closed by ADR-0015 D4 ratification |
| **Q64** | Final invoice + prior deposit credit unrecorded | Closed by ADR-0015 D4 ratification (route to exception with backfill suggestion) |
| **Q74** | Receipt v1 path (decision matrix confirm) | Closed by ADR-0015 D4 ratification |
| **Q78** | Payment failure / reversal lifecycle | Closed by ADR-0015 D4 ratification |

Document-Platform-scope questions (Q53, Q54, Q55, Q56, Q57, Q58, Q65, Q66, Q67, Q68, Q69, Q70, Q71, Q72, Q73, Q75, Q76, Q77, Q79) live in `docs/09_briefs/phase-2/document_platform_initiative.md` §17.

## 15. Deferred to post-v1

A consolidated list of Spend-domain items deferred from v1, with
their intended phase. Phase 2 brief authors who scan this section
get the full Spend-domain out-of-scope picture without re-reading
every preceding section.

- **Auto-pay** (auto-`record_bill_payment`) — post-v1. Decoupled
  from auto-post per §9.1.
- **Auto-post calibration** for AP bills, vendor prepayments,
  vendor credits, and born-paid bundles — post-v1 per the reframe
  spec §11. v1 ships all proposals as Always Confirm.
- **Three-way matching (PO-receipt-bill)** — post-v1. Schema seat
  reserved (`bills.purchase_order_id`).
- **Vendor credits automation** (auto-application against open
  bills) — post-v1. v1 ships the manual workflow per §5.2.
- **Multi-rate tax per line, withholding tax, reverse-charge VAT,
  tax-point/accounting-date split** — per §8.1, all post-v1.
- **Approval delegation / out-of-office for the controller** —
  post-v1 explicitly. The v1 limitation: controller-only
  payment-approval path. If the controller is unavailable, payments
  wait.
- **FR / bilingual invoice anchor matching** for the extraction
  pipeline — v1 fast-follow if scope permits; otherwise deferred
  to a post-v1 phase (per §8.5).
- **AR invoices** — Phase 3+. Reserved tables `invoices`,
  `invoice_lines`, `customers` already in `data_model.md`.
- **Multi-currency on bills** — v1 ships CAD only.
- **Full multi-entity intercompany due-to / due-from postings** —
  post-v1. v1 reserves the four entity columns per §5.4.

**Substrate deferrals moved.** Python OCR sidecar, EDI / Peppol, vendor portal scraping, LayoutLM / ML-based OCR, linked Outlook / Gmail OAuth ingestion, and photo / mobile receipt capture deferrals moved to `docs/09_briefs/phase-2/document_platform_initiative.md` §15 per the reframe.

## 16. Friction-journal scope

Spend Initiative entries land under the **Spend Initiative arc**
(arc identifier `arc-spend-initiative` confirmed at first
session-kickoff 2026-05-07 per Phase 5 first-domain consumer
arc-onset planning-lock). The arc retrospective at close follows
the existing retrospective discipline from
`docs/07_governance/retrospectives/` (Pattern 8 file-top staleness
review applies; Pattern 2 UI screenshot gate applies).

The arc may span multiple Phase 2 phases (A through E within v1)
and may carry Arc-style continuity across the phase boundaries. The
Workflow Vocabulary distinction from `glossary.md` §Workflow
Vocabulary applies: phases bound scope, arcs bound continuous
bodies of work; the AP arc threads the AP subdomain through every
phase that touches it.

## 17. What this initiative does NOT do

- Does not change Phase 1.2 scope, Phase 1.3 Reality Check plan,
  or any prior-phase exit criteria.
- Does not authorize building any v1 Spend code yet. The two
  Spend-Initiative-owned ADRs (ADR-0015 AP/Spend Subdomain and
  ADR-0017 Vendor Template substrate) plus the seven Document-
  Platform-owned ADRs (per `docs/09_briefs/phase-2/document_platform_initiative.md`
  §16) plus the carried prerequisite ADR-0007 are hard
  prerequisites. ADR drafted ≠ ADR ratified per Decision 3 of the
  Phase 0 governance plan; ratification is what releases code.
- Does not modify ADR-0001, ADR-0002, ADR-0003, ADR-0005,
  ADR-0006, ADR-0008, ADR-0009, ADR-0010, the Agent Ladder, the
  Authority Gradient, the Two Laws, the Service Communication
  Rules, or any existing invariant in `docs/02_specs/invariants.md`.
- Does not own the substrate. Storage abstraction, document
  ingestion, document classification, polymorphic source-document
  links, the Relationship Router, the exception queue, and the
  Tier 2 Document Pipeline all live in
  `docs/09_briefs/phase-2/document_platform_initiative.md`. This
  brief consumes that substrate; it does not duplicate or
  contradict its decisions.
- Does not amend `CLAUDE.md` §4 — that work is governance work
  deferred to ADR-0007 per Q27.
- Does not edit `docs/09_briefs/phase-2/triage_bucket_intake.md`.
  That brief is now a UX-surface reference for the **Document
  Platform** brief (per the 2026-05-02 reframe, the triage bucket
  is substrate-shaped). The cross-reference update on the
  triage-bucket file is a follow-on prompt; not in scope here.
- Does not edit `docs/02_specs/open_questions.md` (filing happens
  in the Phase 0 governance Stream A). Q35–Q52 are retired per
  the supersession note in that file's Section 3.
- Does not edit `docs/09_briefs/phase-2/interaction_model_extraction.md`.
  That file is preserved verbatim per the phase-2 README.
- Does not commit to an AR initiative or any non-Spend subdomain.
  Banking / AR / Tax / Assets are future initiative briefs that
  will consume the same Document Platform substrate.
- Does not commit accounting state from extraction, classification,
  or routing layers. Only Spend domain services
  (`billService.post`, `billService.approveForPayment`,
  `billPaymentService.record`, `vendorPrepaymentService.record`,
  `vendorPrepaymentService.applyToBill`, `vendorCreditService.post`,
  `vendorCreditService.applyToBill`, `vendorService.create`,
  `vendorService.update`) commit. Per Reading B (per
  `docs/09_briefs/phase-2/document_platform_reframe_design.md` §5),
  domain services produce ledger operations via the ledger
  service; the ledger service is the only writer of journal
  entries.

## 18. Verification against canonical docs

Verified by direct read against every file the prompt named, in
the order named:

- `CLAUDE.md`, `AGENTS.md`, `docs/INDEX.md`, `docs/02_specs/README.md`
  — orientation. The "ADR before code" discipline and the
  spec-without-enforcement rule both apply to this brief.
- `docs/02_specs/ledger_truth_model.md` — Authority Gradient,
  Layer 4 — Cognitive Truth (Agents Propose), Service
  Communication Rules, and the cited INV leaves
  (LEDGER-001/002/003/004/005/006, MONEY-001/002/003,
  IDEMPOTENCY-001, RLS-001, AUTH-001, SERVICE-001/002,
  AUDIT-001/002, REVERSAL-001/002). Every citation in §11 is a
  real INV-ID with a real leaf and a real enforcement site.
- `docs/02_specs/agent_autonomy_model.md` — full read. The Agent
  Ladder, the System ceiling list (§6), the policy decision tree
  (§7). The §6 Item 2 reversal-as-System-ceiling rule is
  load-bearing for §9.2.
- `docs/02_specs/intent_model.md` — full read. The
  `ProposedMutation` shape (§3), the Four Questions grammar (§5),
  Logic Receipts (§6). The variant extension in §3 of this brief
  rides the existing shape.
- `docs/02_specs/mutation_lifecycle.md` — full read. The six
  states, the elevation triggers, the 24-hour window mechanics.
- `docs/02_specs/data_model.md` — full read with attention to the
  Phase 2+ reserved tables (`bills`, `bill_lines`, `payments`,
  `vendors`, `vendor_rules`). §5.1 of this brief reconciles the
  CTO source's naming against the reservations.
- `docs/02_specs/invariants.md` — the canonical 20 INV-IDs and
  the bidirectional reachability rule. All §11 citations are
  registered IDs; the two reserved INV-AP-NNN candidates and the
  reclassified INV-AGENT-NNN bank-detail-confirmation candidate
  per §11.3 are spec-without-enforcement and do not register
  here until enforcement lands. The AP-subdomain ADR (§13)
  registers the new `AP` domain prefix.
- `docs/02_specs/glossary.md` — Workflow Vocabulary (Arc / Phase /
  Session / Sub-session). The §16 framing of the AP-ingestion
  arc uses this vocabulary correctly.
- `docs/02_specs/open_questions.md` — read for Q-number
  verification. Q35 is the next available number; Q27–Q31 are the
  Tier 2 prerequisites; Q33–Q34 are unrelated. **Not modified.**
- `docs/04_engineering/conventions.md` — Documentation Routing
  convention (§ Documentation Routing), naming conventions,
  Permission Catalog Count Drift, ADR-0010 reserved-enum-states
  three-layer defense. The brief follows the routing rule
  (canonical home in `phase-2/` for the planning artifact).
- `docs/07_governance/adr/README.md` — ADR format and when-to-write
  rules. §13 names the four ADRs without drafting them.
- `docs/07_governance/adr/0001-reversal-semantics.md` — reversal
  semantics. §3.1 footnote and §9.2 cite this directly.
- `docs/07_governance/adr/0002-confidence-as-policy-input.md` —
  confidence-as-internal-only. §4 constraint 4 cites this.
- `docs/07_governance/adr/0003-one-voice-agent-architecture.md` —
  the one-voice rule that `ProposedBillCard` rendering and Tier 3
  preserve.
- `docs/07_governance/adr/0004-ghost-rows-visual-contract.md` —
  ghost rows. The triage-bucket → ProposedBillCard path produces
  ghost rows; the four-signal contract applies unchanged.
- `docs/07_governance/adr/0005-three-path-intent-schema.md` — the
  three intent paths. AP `ProposedMutation` variants are mutations,
  same path as journal-entry mutations.
- `docs/07_governance/adr/0006-agent-persona-unnamed.md` — agent
  persona. AP-pipeline output flows through the same unnamed
  bookkeeper voice.
- `docs/07_governance/adr/0008-layer-1-enforcement-modes.md` —
  Layer 1a vs. 1b. The two INV-AP-NNN candidates and the
  reclassified INV-AGENT-NNN bank-detail-confirmation candidate
  (per §11.3) all classify as Layer 2 (service enforcement); not
  1a or 1b.
- `docs/07_governance/adr/0009-before-state-capture-convention.md` —
  before_state convention. AP service writes follow it: INSERT
  passes `before_state: undefined`, UPDATE issues a pre-`SELECT`
  through `adminClient`.
- `docs/07_governance/adr/0010-reserved-enum-states.md` — reserved
  enum states. `bill_status`, `attachment_status`,
  `bill_revision_status` all follow the four-element pattern.
- `docs/09_briefs/phase-2/README.md` — folder rules.
  `interaction_model_extraction.md` is preserved verbatim and not
  modified.
- `docs/09_briefs/phase-2/agent_architecture_proposal.md` — full
  read. Q27–Q31 are this brief's hard prerequisites per §12; the
  Tier 2 safety contract is repeated verbatim in §4.
- `docs/09_briefs/phase-2/triage_bucket_intake.md` — full read.
  Becomes a UX-surface reference; this brief supersedes it as the
  planning artifact. **Not modified.**
- `docs/09_briefs/phase-2/interaction_model_extraction.md` — full
  read. **Not modified.**
- `docs/09_briefs/phase-2/cmd_z_as_reversal.md` — full read. The
  24-hour reversible window UX in §9.2 inherits the
  pre-filled-reversal-form pattern; the System-ceiling rule
  (§9.2) makes the "click Undo" UI copy unambiguous about the
  Always-Confirm reversal path.
- `docs/09_briefs/phase-2/obligations.md` — Phase 2 carry-forward
  queue. Several items align: the multi-stage approval state
  machine (§6 obligations) is the underlying machinery this
  initiative consumes; the source ↔ JE linkage and subsidiary
  tie-out invariants are AP-relevant prerequisites for Phase 2+.
- `docs/03_architecture/phase_plan.md` — Phase 2 scope. The "AP
  Agent: email ingestion → OCR → chart of accounts suggestion →
  ProposedEntryCard" line is what this brief operationalizes.
- `docs/03_architecture/phase_simplifications.md` — Simplification 3
  (AP Agent as the second real agent). This brief is the
  realization of that simplification's Phase 2 correction shape.
- `docs/09_briefs/CURRENT_STATE.md` — read for project state. The
  brief opens against Phase 1.2 closeout state (post-2026-04-26)
  and Arc A closeout state (post-2026-04-24). No conflicts found.

No architectural conflicts surfaced. The 22 CTO-mandated changes
are folded in. The 12 gap closures are folded in. The Most
Important Sentence is preserved verbatim in §1. The triage-bucket
brief is not modified. `open_questions.md` is not modified.

## 19. Review history

- **2026-05-01** — CTO consolidated-action document received
  (founder paste). Translated into this brief on the same day.
  No ADRs drafted in this prompt cycle. No questions filed in
  this prompt cycle.
- **2026-05-02** — T2 review pass + T3 finalize pass applied.
  Conformance issues addressed: section-locator preamble note
  added; "CHOUnting" restored verbatim in the Most Important
  Sentence; AP-as-new-INV-domain-prefix statement added in §11.3;
  §18 line-number citations dropped per agent_architecture_proposal
  precedent. Semi-contradictions reconciled: §9.2 reversal-path
  language tightened to cite `intent_model.md` §3 ProposedMutation
  shape; §10 phase prose updated to reflect Phase 0 governance
  block and the (Phase C ∥ Phase D) parallelism after Phase B.
  Substantive amendments: Phase 0 row added to §10 table; three
  deferred items added to §15 (EDI/Peppol, vendor portal scraping,
  LayoutLM); push-readiness three-condition gate codified in new
  §11.6; INV-AP-003 reclassified to a candidate INV-AGENT-NNN per
  the System-ceiling reading; "Phase 2 within v1 follow-up"
  wording standardized across five sites to "v1 fast-follow if
  scope permits, otherwise deferred to a post-v1 phase";
  reversed-vs-voided distinction expanded with examples in §3.1;
  EC-A-8 ↔ surface 5 cross-references added; §11.5 expanded from
  eight to eleven surfaces to reconcile with §11.4's six read-side
  surfaces; ADR-0004 ghost-row contract invocation added to §3
  ProposedBillCard description.

The prompt-cycle sequencing the CTO document specified post-brief:
(1) Q35–Q52 filing cycle, (2) ADR-0007 closeout cycle, (3)
AP-subdomain ADR + storage_provider ADR + autonomy-rule ADR
cycles, (4) Phase A session brief. This brief is item zero in
that sequence; nothing in items 1–4 happens before this brief
lands.

- **2026-05-04** — Ratified at Phase 0 closure verification
  (Session 2F). Status header updated from CTO-reviewed-pre-
  finalization to Ratified-per-Phase-0-closure framing. Resolution
  path corrected for ADR-0017 content-naming drift ("substrate
  reservation" → "Substrate" matching on-disk filename
  `0017-vendor-template-substrate.md`) + Q53–Q79 filing range +
  D1–D6 ratification chain. §13 ADR-0017 entry corrected for the
  same content-naming drift + Ratified D4 status added. §14 Q-
  disposition table refined to mark Q59–Q64 + Q74 + Q78 closed by
  ADR-0015 D4 ratification (2026-05-04); Document-Platform-scope
  question list updated to include Q79 (filed post-skeleton at
  Session 2B `29aacf5`). NOT authorized for code outside Phase 5
  (Spend / AP foundation) scope per the Phase 0 closure verification
  artifact's Phase 1 code-start gate authorization framing.
