# Agent Architecture Policy — Q28 Re-verification Matrix

The authoritative re-verification matrix that the Tier 1
committing agent uses to validate Tier 2 / Tier 2.5 outputs at the
commit boundary. ADR-0007 (Three-Tier Agent Architecture) defines
the framework and its four expansion surfaces; this file holds the
operational matrix. ADR-0011 (Document Platform) §12 forward-points
here as the authoritative location for the per-document-type matrix
and explicitly does not duplicate it. Q29's ESLint rule design is
selected by ADR-0007 but reserved for a later policy amendment in
this same file (see §6).

**Source materials.**
- `docs/07_governance/adr/0007-three-tier-agent-architecture.md` —
  framework definer; Closes § Q28 (five-row framework matrix);
  Amendment § "Q28 expansion to four re-verification surfaces"
  (the four surfaces with concrete sub-rules); Tier 2 / Tier 2.5 /
  Tier 1 safety contracts.
- `docs/07_governance/adr/0011-document-platform.md` — spine ADR
  that delegates here; §6 (document-type discriminator with v1
  active set), §3 (case lifecycle), §7 (ProposedMutation /
  ProposedMutationBundle / ProposedAttachment handoff), §12 (Q28
  expansion forward-pointer), §14 (Domain Boundary Map).
- `docs/09_briefs/phase-2/document_platform_reframe_design.md` §12
  (canonical four-surface framing), §3.1 (document-type
  discriminator), §15 (receipt v1 decision matrix), §16
  (immutability rules).
- `docs/02_specs/intent_model.md` §3 (`ProposedMutation` shape and
  justification fields) and §5 (Four Questions grammar).
- `docs/02_specs/ledger_truth_model.md` — canonical four-layer
  taxonomy (Layer 1a / Layer 1b / Layer 2 / Layer 3 / Layer 4).
  Layer language used here is exactly the language used there.
- `docs/02_specs/open_questions.md` — Q28 (matrix's home), Q29
  (ESLint rule, out of E2 scope), Q66 (Tier 2.5 placement, closed
  by ADR-0007 amendment), Q77 (matrix-expansion-scope obligation).
- Phase 0 governance plan Task E2 — drafting cycle.

**Scope.** Documents the four re-verification surfaces, the
per-row matrix content for each surface, the Layer mapping per
surface, the per-commit-path index, and the maintenance discipline
that keeps the matrix coherent as new document types and downstream
ADRs land. Out of scope: Q29 ESLint rule design (placeholder only
in §6); OCR engine selection and confidence threshold values
(deferred to ADR-0014 / ADR-0019); bundle types beyond born-paid
(deferred to ADR-0012); cross-org / multi-entity matrix rows
(deferred per spec §17, post-v1).

**Cross-references.**
- ADR-0007 (Three-Tier Agent Architecture) — framework definer.
- ADR-0011 (Document Platform) — spine ADR with §12 forward-pointer.
- ADR-0012 (forthcoming, ProposedMutationBundle) — bundle
  re-verification (surface 4) cites ADR-0012 for the
  DB-transaction-atomic enforcement contract.
- ADR-0014 (forthcoming, Tier 2 Document Pipeline) — owns OCR
  engine choice, classification threshold mechanism, replay /
  supersession semantics; this file references the threshold
  mechanism but not the values.
- ADR-0015 (forthcoming, AP/Spend Subdomain) — owns the v1
  manual-only-in-v1 policy for vendor-credit-application and
  vendor-prepayment-application that this file inherits in
  §2.2 / §4.
- `docs/02_specs/intent_model.md` — `ProposedMutation` shape; the
  matrix's field set is the shape's field set.
- `docs/02_specs/ledger_truth_model.md` — Layer taxonomy and
  Service Communication Rules.
- `docs/02_specs/open_questions.md` — Q28 (this file's home), Q29
  (ESLint rule, out of E2 scope), Q66 (closed by ADR-0007
  amendment), Q77 (this file's ratification gate).

**Status.** Drafted 2026-05-03 under Phase 0 governance plan Task
E2. Awaiting ratification; ratification gates v1 ship, not Phase 1
start, per Q77.

---

## 1. Why this file exists

The Tier 1 committing agent is the single agent in the system that
mutates ledger state. Tier 2 stateless pipelines and Tier 2.5
read-only ledger-aware pipelines produce typed proposals
(`ProposedMutation`, `ProposedMutationBundle`, `ProposedAttachment`,
`DocumentRelationshipCandidate`) that flow into Tier 1. The
**re-verification at the commit boundary** rule from ADR-0007's
Tier 2 safety contract requires Tier 1 to re-fetch and re-validate
the upstream pipeline's outputs with financial semantics before
committing. Without a per-field, per-relationship, per-stale-state,
per-bundle specification of exactly what re-verification means,
the rule becomes a convention rather than a control.

This file is the operational artifact. It enumerates, for each
v1 document type and each v1 commit path, which fields Tier 1
re-fetches, which relationship claims Tier 1 re-checks, which
stale-state windows Tier 1 closes inside `withInvariants()`, and
which bundle balances Tier 1 enforces atomically. The matrix is
the load-bearing safety control under the ADR-0007 architecture;
when the matrix is incomplete or stale, the Tier 2 / Tier 2.5 →
Tier 1 boundary loses its compensating control and the
semantic-telephone failure mode reopens.

ADR-0007 framework-closes Q28 with the original five-field
framework matrix; the Amendment section names the four expansion
surfaces and forward-points here. ADR-0011 §12 forward-points here
for the per-document-type matrix and explicitly does not duplicate
it. The ratification of this file gates v1 ship (per Q77), not
Phase 1 start: downstream Phase 1+ implementation work proceeds
against this file as a draft reference, and the matrix is expected
to evolve as new document types and downstream ADRs (ADR-0014,
ADR-0015, ADR-0018, ADR-0019) ratify.

---

## 2. The four re-verification surfaces

ADR-0007 Amendment § "Q28 expansion to four re-verification
surfaces" enumerates the four surfaces verbatim. Each surface
below ships a per-row matrix in the row-shape template established
by ADR-0007's framework matrix (§ Closes Q28).

### 2.1 Document-type-aware field re-verification matrix

**Section preamble.** Different fields matter for invoices vs
receipts vs credit memos vs vendor statements; the matrix is
per-document-type, not generic. The row shape is the
framework-matrix row shape from ADR-0007 § Closes Q28: `Field /
Source / Re-verification at Tier 1 / Failure mode / Layer`.

**Scope note.** v1 active types only — no rows for reserved types. The matrix populates four rows for the v1 active document types (`vendor_invoice`, `receipt`, `payment_confirmation`, `unknown`). The obligation to extend at promotion-time (when a reserved type is promoted from reserved to active in its respective downstream phase) is captured in §5 maintenance discipline, not in the matrix as placeholder rows. This keeps the ratification surface narrow — CTO ratifying the matrix at v1 ship does not accidentally ratify what reserved-type rows should look like.

**Receipt nuance.** Receipt field re-verification is
document-type-level (merchant / vendor, date, amount, currency,
payment method, last-4 / auth ref if available, tax amount if
present), but receipt **relationship-path** re-verification differs
by route. A receipt may flow through three routes (per spec §15
and ADR-0011 §7): receipt-as-payment-evidence-only (Scenario A,
ships as `ProposedAttachment`); receipt-as-payment-trigger
(Scenario B, ships as `ProposedMutation(record_bill_payment)`);
receipt-as-born-paid-bundle (Scenario C, exception queue in v1
with manual-bundle path available). The field-level row for
`receipt` appears once below. Per-route relationship-path
re-verification appears in §2.2 and §4.

**Unknown nuance.** For `unknown`, no fake field checks are
listed. Field re-verification is **human classification required**;
relationship re-verification is N/A until classified; stale-state
is N/A; bundle is N/A; default v1 path is the **exception queue**.
The row keeps the matrix honest by refusing to invent checks for
documents whose type is undetermined.

#### 2.1.1 v1 active document types — field-level rows

##### `vendor_invoice`

| Field | Source | Re-verification at Tier 1 | Failure mode | Layer |
|---|---|---|---|---|
| `amount` (per line + total) | LLM extraction from document | Human confirms on ProposedEntryCard; tax-inclusive vs tax-exclusive labeled per AP-domain extraction policy (per ADR-0014) | User edit before approve, or reject | Layer 4 discipline + Layer 2 schema validation |
| `currency` | LLM extraction; defaults to org currency if absent | Must match `vendor.default_currency` or be an org-supported currency; if ambiguous, route to needs_review | Reject if absent and cannot be defaulted | Layer 2 (`billService.post()` pre-flight) |
| `vendor_id` | Tier 2 vendor-matcher stage (against vendor master per ADR-0007 Tier 2 Read boundary) | Re-call `getVendor(id)`; verify `org_id` scope; verify vendor not in `blocked` payment-hold status | Reject if not found, cross-org, or blocked | Layer 2 (`billService.post()` calls vendor-service read) |
| `vendor_invoice_number` | LLM extraction from document | Verify `(org_id, vendor_id, vendor_invoice_number)` does not already exist in `bills` (duplicate guard) | Reject as `DUPLICATE_VENDOR_INVOICE`; route case to needs_review | Layer 1a (unique constraint, per ADR-0015) + Layer 2 pre-flight |
| `accounting_date` | LLM extraction; falls back to receipt date | Re-call `checkPeriod(accounting_date)` to verify period is open (period_id resolution at commit) | Period-locked → reject with `PERIOD_LOCKED` | Layer 1a (`trg_enforce_period_not_locked`) + Layer 2 pre-flight |
| `account_code` (per line) | Tier 2 account-suggestion stage | Must exist in `listChartOfAccounts(org_id)` and be active; cross-reference `vendor.default_account_mapping` | Reject if absent or inactive | Layer 1a (FK) + Layer 2 pre-flight |
| `tax_code_id` (per line, if present) | LLM extraction from document | Must exist in seeded `tax_codes` for `org_id`; jurisdiction-match per ADR-0015's tax scope | Reject if absent or wrong jurisdiction | Layer 1a (FK) + Layer 2 pre-flight |
| `due_date` | LLM extraction; falls back to vendor terms | Verify `due_date >= accounting_date`; warn if `> 365` days out (likely OCR error) | Soft reject with operator override on warn; hard reject on `< accounting_date` | Layer 2 |
| `bank_detail`-related fields (account number, routing, etc.) | **Never sourced by Tier 2** per ADR-0007 Tier 2 Read boundary; Tier 2.5 may surface in payment-readiness candidates | Tier 1 re-verifies all vendor-control fields at commit per ADR-0007 § Tier 2 Read boundary; vendor master is **not** auto-updated from extracted invoice content. Always Confirm / System ceiling per `agent_autonomy_model.md` §6 Item 2 | Reject any auto-update path; route to controller out-of-band confirmation | Layer 2 (`vendorService.update()`) + Layer 4 discipline |

**Sources.** Field set from `intent_model.md` §3
(`ProposedMutation` shape) projected onto the bill domain; row
shape from ADR-0007 § Closes Q28; bank-detail rule from
`agent_autonomy_model.md` §6 Item 2 and ADR-0007 Tier 2 Read
boundary; uniqueness guard from ADR-0015 (forthcoming, AP/Spend
Subdomain).

##### `receipt`

| Field | Source | Re-verification at Tier 1 | Failure mode | Layer |
|---|---|---|---|---|
| `merchant` / `vendor` (free-text or vendor_id) | LLM extraction | If vendor-master match: `getVendor(vendor_id)` + org-scope + non-blocked check. If free-text only (no vendor_id): keep as `merchant_text` and route to needs_review for vendor classification (no vendor master mutation from receipt extraction) | Reject vendor_id if unmatched / cross-org; needs_review if free-text remains unclassified | Layer 2 |
| `date` (transaction date) | LLM extraction | Re-call `checkPeriod(date)`; verify period open at commit | Period-locked → reject | Layer 1a + Layer 2 |
| `amount` (subtotal + total) | LLM extraction | Human confirms on ProposedEntryCard / ProposedAttachment card; subtotal + tax = total arithmetic check | User edit; reject if arithmetic mismatch beyond rounding tolerance | Layer 4 discipline + Layer 2 |
| `currency` | LLM extraction; defaults to org currency | Must match an org-supported currency | Reject if absent and cannot be defaulted | Layer 2 |
| `payment_method` | LLM extraction (cash / card / EFT / etc.) | Must be in the `payment_method` enum (cash, cheque, eft, wire, credit_card, ach, other) per ADR-0011 §14 / ADR-0015 | Reject if outside enum | Layer 1a (enum) + Layer 2 |
| `last_4` / card-account identifier | LLM extraction (optional) | Validation that the `last_4` matches a known org-side payment-method tail when available; otherwise capture-and-preserve only (per ADR-0015 reconciliation-metadata preservation requirement, spec §15) | Soft warn on mismatch; never reject (post-v1 Banking domain consumes) | Layer 2 (capture only) |
| `merchant_identifier` / `auth_ref` / `transaction_reference` | LLM extraction (optional) | Capture-and-preserve only per spec §15 reconciliation-metadata preservation | N/A in v1 | Layer 2 (capture only) |
| `tax_amount` (if present) | LLM extraction | Subtotal + tax = total arithmetic check (rounding tolerance per ADR-0014); `tax_code_id` resolution if applicable per ADR-0015's tax scope | Reject on arithmetic mismatch beyond tolerance | Layer 2 |

**Receipt relationship-path note.** The receipt's three routes
(Scenario A / B / C per spec §15) carry different relationship-claim
re-verification obligations and different commit paths; see §2.2
and §4. Field-level row above is route-independent.

**Sources.** Spec §15 receipt v1 decision matrix; ADR-0011 §7
ProposedAttachment vs ProposedMutation routing; ADR-0015
(forthcoming) for `payment_method` enum, tax scope, and
reconciliation-metadata preservation requirement; ADR-0014
(forthcoming) for rounding-tolerance value.

##### `payment_confirmation`

| Field | Source | Re-verification at Tier 1 | Failure mode | Layer |
|---|---|---|---|---|
| `vendor` (vendor_id or free-text) | LLM extraction; usually deterministic from a payment-confirmation email or transaction confirmation | If vendor-master match: `getVendor(vendor_id)` + org-scope + non-blocked check | Reject if unmatched / cross-org; needs_review if free-text remains unclassified | Layer 2 |
| `payment_date` | LLM extraction | Re-call `checkPeriod(payment_date)`; verify open at commit | Period-locked → reject | Layer 1a + Layer 2 |
| `amount` | LLM extraction | Human confirms; arithmetic check against any cited bill / invoice total in the confirmation | User edit; reject on arithmetic mismatch | Layer 4 discipline + Layer 2 |
| `currency` | LLM extraction | Must match the candidate bill's currency (relationship-claim, see §2.2) and an org-supported currency | Reject if mismatch | Layer 2 |
| `payment_method` | LLM extraction | Must be in the `payment_method` enum | Reject if outside enum | Layer 1a (enum) + Layer 2 |
| `payment_reference` / `auth_ref` / `transaction_id` | LLM extraction | Capture-and-preserve only per spec §15 reconciliation-metadata preservation | N/A in v1 | Layer 2 (capture only) |
| `cited_invoice_number` / `cited_bill_id` (if present in confirmation) | LLM extraction | Relationship-claim — see §2.2 surface 2 (a) | N/A field-level; reject relationship-claim per §2.2 | (relationship surface) |

**Sources.** Spec §14 (Scenario A: receipt as payment evidence
generalizes to payment confirmation); ADR-0011 §7
ProposedAttachment + ProposedMutation routing; ADR-0015
(forthcoming) for `payment_method` enum.

##### `unknown`

| Field | Source | Re-verification at Tier 1 | Failure mode | Layer |
|---|---|---|---|---|
| (any) | (any) | **Human classification required** | Default v1 path: **exception queue** (`needs_review` case state per ADR-0011 §3 lifecycle); no field re-verification because field set is undefined | (relationship / stale-state / bundle: N/A until classified) |

**Sources.** ADR-0011 §6 v1 active set; ADR-0011 §13 exception
queue first-class deliverable.

### 2.2 Relationship-claim re-verification matrix

**Section preamble.** ADR-0007 Amendment surface 2 names this
surface: *"Was the receipt-to-bill match correct? The Router can
produce plausible-but-wrong matches."* Tier 2.5's Relationship
Router (per ADR-0007 § Tier 2.5 and ADR-0011 §1) reads against
committed ledger state to produce `DocumentRelationshipCandidate`
objects. Tier 1 re-verifies every relationship claim before
commit. Row shape: `Check / Triggered when / Re-verification
mechanism / Failure mode / Layer`.

**Scope note — vendor-credit and vendor-prepayment application.**
Vendor-credit-application and vendor-prepayment-application are
**manual-only-in-v1** per ADR-0015 (forthcoming, AP/Spend
Subdomain) and per spec §11 (auto-post deferred past v1). The
relationship-claim rows for those candidates ship as
**reserved-with-explicit-deferral-note**: the Tier 2.5 Router does
not produce automated `apply_vendor_prepayment_to_bill` or
`apply_vendor_credit_to_bill` proposals in v1; manual workflows
route through the AP/Spend domain service form. The rows below
are kept in the matrix as the future-active shape so the matrix
is forward-extensible without retrofit.

| Check | Triggered when | Re-verification mechanism | Failure mode | Layer |
|---|---|---|---|---|
| (a) Receipt-to-bill match: receipt still matches the candidate Bill #N | Tier 2.5 produces a `DocumentRelationshipCandidate` of route Scenario B (`record_bill_payment` proposal) | Re-call `getBill(bill_id)` at commit; verify `(vendor_id, bill_amount, bill_currency)` still match the receipt's extracted values within tolerance; verify bill `payment_status != 'paid'` | Reject with `RELATIONSHIP_MISMATCH`; case routes to needs_review for re-evaluation per Q56 | Layer 2 (inside `withInvariants()` of `paymentService.recordBillPayment()`) |
| (b) Vendor-prepayment-application: candidate `vendor_prepayment` still has remaining balance ≥ application amount | Tier 2.5 produces an `apply_vendor_prepayment_to_bill` candidate (**reserved — manual-only in v1 per ADR-0015**; row carried forward for future automation) | Re-call `getVendorPrepayment(prepayment_id)`; verify `remaining_balance >= application_amount`; verify status not `fully_applied` or `refunded` | Reject with `PREPAYMENT_INSUFFICIENT_BALANCE` or `PREPAYMENT_INVALID_STATE` | Layer 2 (inside `withInvariants()` of `vendorPrepaymentService.applyToBill()`) |
| (c) Vendor-credit-application: candidate credit memo still applies to the selected bill | Tier 2.5 produces an `apply_vendor_credit_to_bill` candidate (**reserved — manual-only in v1 per ADR-0015**; row carried forward for future automation) | Re-call `getVendorCredit(credit_id)`; verify `unapplied_balance >= application_amount`; verify `(credit.vendor_id == bill.vendor_id)`; verify credit status not `void` or `fully_applied` | Reject with `CREDIT_INVALID_STATE` or `CREDIT_VENDOR_MISMATCH` | Layer 2 (inside `withInvariants()` of `vendorCreditService.applyToBill()`) |
| (d) Vendor-match stability: Tier-2 vendor match still resolves to the same vendor at commit time | Any commit path that consumed a Tier 2 vendor-matcher result | Re-call `getVendor(vendor_id)`; verify the vendor row exists, has not been merged into another vendor (no `merged_into_vendor_id` set), and has not been renamed in a way that invalidates the match logic; if merged, reject and re-route | Reject with `VENDOR_MERGED_OR_RENAMED`; case routes to needs_review | Layer 2 (inside `withInvariants()` of every commit path that consumed a vendor match) |
| (e) Attachment relationship: linked entity exists and matches the proposed `link_role` | `ProposedAttachment` flowing through `documentLinkService.create()` per ADR-0011 §7 | Validate `(linked_entity_type, linked_entity_id)` exists in the named table per ADR-0011 §4 service-layer integrity validation; validate `(linked_entity_type, link_role)` pair is valid per ADR-0016 (forthcoming) | Reject with `LINK_ENTITY_NOT_FOUND` or `LINK_ROLE_INVALID` | Layer 2 (`documentLinkService.create()`) |

**Sources.** ADR-0007 Amendment §"Q28 expansion" surface 2;
ADR-0011 §4 (polymorphic-link discipline), §7 (ProposedAttachment
contract); ADR-0015 (forthcoming, manual-only-in-v1 policy);
spec §11 (auto-post deferred past v1).

### 2.3 Stale-state TOCTOU re-verification matrix

**Section preamble.** ADR-0007 Amendment surface 3 names the
hazard: *"a proposal sits in the queue while underlying state
changes."* This is the surface that prevents "same prepayment
applied twice" / "same bill paid twice" / "stale-period bill
posted into a since-locked period" failure modes. Stale-state
checks fire at commit time **inside `withInvariants()`** (Layer 2),
unless the underlying check is enforced at Layer 1a (DB-level
trigger). Row shape: `Check / Triggered when / Re-verification
mechanism / Failure mode / Layer`.

| Check | Triggered when | Re-verification mechanism | Failure mode | Layer |
|---|---|---|---|---|
| (a) Bill #N is still in `posted` state (not paid by another mutation while the proposal was pending) | `record_bill_payment` commit path | Re-call `getBill(bill_id) FOR UPDATE` (row-locked) inside the commit transaction; verify `payment_status == 'posted'`; reject if `paid` / `partially_paid_blocked` / `reversed` | Reject with `BILL_INVALID_STATE_FOR_PAYMENT`; case re-routes per Q56 | Layer 2 (inside `withInvariants()`); row lock prevents concurrent double-pay |
| (b) `vendor_prepayment` row still has the same `remaining_balance` (not applied by another mutation in the meantime) | `apply_vendor_prepayment_to_bill` commit path (manual-only in v1) | Re-call `getVendorPrepayment(prepayment_id) FOR UPDATE`; verify `remaining_balance >= application_amount` at commit; the application row insert + balance recompute happen in the same transaction | Reject with `PREPAYMENT_INSUFFICIENT_BALANCE`; case re-routes | Layer 2 (inside `withInvariants()`); INV-AP-001 (allocation sums per ADR-0015) backstops at Layer 2 |
| (c) `vendor_credit` row still has unapplied balance | `apply_vendor_credit_to_bill` commit path (manual-only in v1) | Re-call `getVendorCredit(credit_id) FOR UPDATE`; verify `unapplied_balance >= application_amount` | Reject with `CREDIT_INSUFFICIENT_BALANCE`; case re-routes | Layer 2 (inside `withInvariants()`); INV-AP-001 backstops |
| (d) Ledger period containing the bill's `accounting_date` is still open | Every commit path that posts to a fiscal period (`post_bill`, `record_bill_payment`, `post_bill_with_payment`, `post_vendor_credit`, `record_vendor_prepayment`, `apply_vendor_prepayment_to_bill`, `apply_vendor_credit_to_bill`) | DB trigger `trg_enforce_period_not_locked` runs `SELECT ... FOR UPDATE` on the `fiscal_periods` row at insert time; service-layer pre-flight `checkPeriod(accounting_date)` for ergonomics | Reject with `PERIOD_LOCKED` (`check_violation` at DB; pre-flight at service) | **Layer 1a** (`trg_enforce_period_not_locked`, INV-LEDGER-002) + Layer 2 pre-flight |
| (e) Vendor's `bank_detail_confirmed` flag has not flipped (since the proposal was generated) | Every payment commit path that targets a vendor with bank-detail-dependent payment method (eft, wire, ach) | Re-call `getVendor(vendor_id)` at commit; verify `bank_detail_confirmed_at` is non-null and not invalidated since the proposal was generated; verify no pending bank-detail change in `vendor_change_proposals` (the controller-confirmation path per `agent_autonomy_model.md` §6 Item 2) | Reject with `VENDOR_BANK_DETAIL_UNCONFIRMED` or `VENDOR_BANK_DETAIL_PENDING`; route to controller out-of-band confirmation | Layer 2 (inside `withInvariants()` of `paymentService.recordBillPayment()` and adjacent commit paths) |

**Sources.** ADR-0007 Amendment §"Q28 expansion" surface 3;
INV-LEDGER-002 (`docs/02_specs/ledger_truth_model.md` Layer 1a)
for the DB-level period-lock trigger; INV-AP-001 (forthcoming,
ADR-0015) for allocation-sum invariant; `agent_autonomy_model.md`
§6 Item 2 for vendor bank-detail Always Confirm / System ceiling
hard rule.

### 2.4 Bundle re-verification matrix

**Section preamble.** ADR-0007 Amendment surface 4 names the
hazard: *"compound mutations balance to zero."* Bundles commit
all-or-nothing per ADR-0012 (forthcoming, ProposedMutationBundle).
The row set is per-bundle-type. **v1 active bundle: born-paid only.**
The matrix below specifies bundle-level checks. Each child
mutation in a bundle additionally carries its own surface-1 /
surface-2 / surface-3 obligations from §2.1 / §2.2 / §2.3 — the
bundle-level checks **do not substitute for per-child checks**;
both fire.

| Bundle | Child mutations | Balance check | Rollback semantics | Layer |
|---|---|---|---|---|
| `post_bill_with_payment` (born-paid bill) — v1 active | (1) `post_bill` (Dr Expense / Cr AP); (2) `record_bill_payment` (Dr AP / Cr Bank-or-Card) | At commit: each child journal entry balances (debit = credit per child via INV-LEDGER-001); the bundle as a whole nets to (Dr Expense / Cr Bank-or-Card) — i.e., AP zero at end of bundle. Bundle-level invariant: sum of all child journal-line debits == sum of all child journal-line credits == bill_amount × 2 | DB-transaction-atomic enforcement per ADR-0012: both child entries commit in the same `withInvariants()` transaction; if either child fails (period lock, FK miss, balance mismatch, RLS denial), the entire transaction rolls back via Postgres ROLLBACK. No partial-bundle visible state. | **Layer 1a** (INV-LEDGER-001 per child + DB transaction atomicity per ADR-0012) + Layer 2 (`billService.postWithImmediatePayment()` orchestrates inside one `withInvariants()`) |
| (post-v1 bundle types — reserved) | (varies per bundle type as defined by ADR-0012 / Spend Initiative brief / future domain briefs) | Reserved | Reserved | Reserved — extend per §5 when each bundle type promotes to active |

**Per-child obligation reminder.** A born-paid bundle's
`post_bill` child carries the full `vendor_invoice` field-level
re-verification from §2.1 (vendor_id, account_code, accounting_date,
tax_code_id, etc.); its `record_bill_payment` child carries the
relationship-claim re-verification from §2.2 (a) (receipt-to-bill
match, when triggered by a Scenario B / C receipt) and the
stale-state checks from §2.3 (period-still-open, vendor's
bank_detail_confirmed when applicable). Bundle-level atomicity is
the additional fourth check, not a replacement for the first three.

**Sources.** ADR-0007 Amendment §"Q28 expansion" surface 4;
ADR-0012 (forthcoming) for DB-transaction-atomic enforcement
contract; spec §15 receipt v1 decision matrix (Scenario C / manual
born-paid workflow); ADR-0011 §7 ProposedMutationBundle handoff;
INV-LEDGER-001 (`docs/02_specs/ledger_truth_model.md` Layer 1a)
for per-entry balance.

---

## 3. Layer mapping per surface

The four-layer taxonomy used here is the canonical taxonomy from
`docs/02_specs/ledger_truth_model.md` (§ "How the Gradient Is
Implemented"). The mapping below refers to that file's exact layer
language: Layer 1a (commit-time DB enforcement), Layer 1b
(scheduled-audit DB enforcement), Layer 2 (service-layer
enforcement inside `withInvariants()`), Layer 3 (events as source
of truth — Phase 2 active), Layer 4 (cognitive truth — discipline,
no enforcement invariants by design).

| Surface | Primary layer | Secondary layer(s) | Notes |
|---|---|---|---|
| 2.1 — Document-type-aware field re-verification | **Layer 2** (most checks fire inside the commit-path service's `withInvariants()` body — Zod boundary validation, vendor / account / period read-and-verify, duplicate guards) | **Layer 1a** for FK-backed fields (`account_code` exists in chart of accounts; `tax_code_id` exists in seeded `tax_codes`) and the period-lock trigger. **Layer 4** discipline for `amount` (human confirms on ProposedEntryCard — no enforcement invariant by design, per ADR-0007 § Tier 1 safety contract and `ledger_truth_model.md` Layer 4). | The Layer 4 confirmation is the structural rule that makes amount-correctness safe; LLM-extracted amounts cannot be trusted without human confirmation. |
| 2.2 — Relationship-claim re-verification | **Layer 2** (every relationship check is a service-layer read-and-verify inside `withInvariants()`) | None at Layer 1a (relationship claims are inter-aggregate; Postgres FKs alone cannot express "this receipt's amount matches this bill's amount within tolerance"). | All relationship checks fire in the commit-path service's transaction so a failure rolls back atomically, matching the invariant-violation rollback shape. |
| 2.3 — Stale-state TOCTOU re-verification | **Layer 2** (most checks: re-call read-with-row-lock inside the commit transaction) | **Layer 1a** for the period-lock check (`trg_enforce_period_not_locked`, INV-LEDGER-002) — DB-level trigger that takes a row-level lock on `fiscal_periods` via `SELECT ... FOR UPDATE`. INV-AP-001 (forthcoming, ADR-0015) backstops allocation-sum checks at Layer 2. | The period-lock check is the one stale-state check that lives at Layer 1a because it has a DB-side enforcement point already (INV-LEDGER-002); the others rely on row locks taken inside `withInvariants()` to close the TOCTOU window. |
| 2.4 — Bundle re-verification | **Layer 1a** for the per-child balance (INV-LEDGER-001) **and** for DB-transaction-atomic enforcement per ADR-0012 (Postgres ROLLBACK is the mechanical guarantee that "all-or-nothing" holds) | **Layer 2** for the orchestration (the domain service's `postWithImmediatePayment()` orchestrates both children inside one `withInvariants()` transaction); per-child surface-1 / surface-2 / surface-3 checks fire as their own Layer mapping above | Bundle-level atomicity is fundamentally a DB-transaction property; service-layer code wraps the orchestration but cannot replace the rollback guarantee. |

**Layer-mapping discipline.** A check that fires at Layer 1a is
authoritative regardless of any Layer 2 pre-flight; the Layer 2
pre-flight exists for ergonomics (fast error to caller) but the
Layer 1a check is the single source of truth (per
`ledger_truth_model.md` §"one enforcement point per rule"). For
Layer-2-only checks (most relationship and stale-state checks),
the row lock or read-and-verify inside `withInvariants()` is the
sole enforcement point — there is no DB-side backstop for those,
because the rule is inter-aggregate or business-logic-shaped.

---

## 4. Per-commit-path re-verification index

Cross-reference table — for each v1 commit path, which surfaces
apply. **This is a usability / safety index**, not a second policy
matrix. The authoritative content lives in §2.1 / §2.2 / §2.3 /
§2.4; this table tells a code reviewer or implementer which
surfaces to consult for a given commit path.

Columns: `Commit path | Domain owner | Status | Surface 1 |
Surface 2 | Surface 3 | Surface 4 | Notes`

| Commit path | Domain owner | Status | Surface 1 | Surface 2 | Surface 3 | Surface 4 | Notes |
|---|---|---|---|---|---|---|---|
| `post_bill` (manual + extracted) | AP/Spend (`billService.post()`) | **Active** | `vendor_invoice` row from §2.1 | (d) vendor-match stability | (d) period open | N/A | Manual path: human-authored ProposedMutation. Extracted path: Tier 2 pipeline produces ProposedMutation; same Tier 1 re-verification fires for both. |
| `record_bill_payment` | AP/Spend (`paymentService.recordBillPayment()`) | **Active** | `payment_confirmation` or `receipt` row from §2.1 (depending on evidence) | (a) receipt-to-bill match (if Scenario B); (d) vendor-match stability | (a) bill in `posted` state; (d) period open; (e) vendor `bank_detail_confirmed` (when payment_method ∈ {eft, wire, ach}) | N/A | Triggers from Scenario B receipt or directly by an operator. |
| `post_bill_with_payment` (born-paid bundle) | AP/Spend (`billService.postWithImmediatePayment()`) | **Active** | `vendor_invoice` field row + `receipt` field row (both children) | (a) receipt-to-bill match (if from Scenario C); (d) vendor-match stability | (d) period open; (e) vendor `bank_detail_confirmed` (when applicable) | (born-paid bundle row from §2.4) | Manual born-paid workflow per spec §15: "manual differs from automated only in *how the bundle was proposed*, not in *what commits to the ledger*." Same domain service for both. |
| `record_vendor_prepayment` | AP/Spend (`vendorPrepaymentService.record()`) | **Manual-only in v1** per ADR-0015 / spec §11 | `retainer_request` / `deposit_request` rows (reserved per §2.1.2) — v1 manual entry uses operator-typed fields, not extraction | (d) vendor-match stability (when vendor is selected from master) | (d) period open; (e) vendor `bank_detail_confirmed` (when payment_method ∈ {eft, wire, ach}) | N/A | Manual path only; extracted retainer-request classification + automation reserved for ADR-0015's automation phase. |
| `apply_vendor_prepayment_to_bill` | AP/Spend (`vendorPrepaymentService.applyToBill()`) | **Manual-only in v1** per ADR-0015 / spec §11 | N/A (no field extraction; operator selects existing rows) | (b) prepayment has remaining balance; (d) vendor-match stability | (b) prepayment row balance unchanged; (d) period open | N/A | Tier 2.5 Router does not produce automated proposals for this in v1; the row is reserved-with-deferral-note in §2.2. |
| `post_vendor_credit` | AP/Spend (`vendorCreditService.post()`) | **Manual-only in v1** per ADR-0015 / spec §11 | `credit_memo` row (reserved per §2.1.2) — v1 manual entry uses operator-typed fields | (d) vendor-match stability | (d) period open | N/A | Classification + manual workflow only in v1; automation reserved. |
| `apply_vendor_credit_to_bill` | AP/Spend (`vendorCreditService.applyToBill()`) | **Manual-only in v1** per ADR-0015 / spec §11 | N/A (no field extraction; operator selects existing rows) | (c) credit applies to bill; (d) vendor-match stability | (c) credit unapplied balance; (d) period open | N/A | Tier 2.5 Router does not produce automated proposals for this in v1; the row is reserved-with-deferral-note in §2.2. |
| `attach_payment_evidence` (ProposedAttachment) | Document Platform (`documentLinkService.create()`) | **Active** | `receipt` or `payment_confirmation` row from §2.1 | (e) attachment relationship: linked entity exists, link_role valid | Capture-and-preserve metadata only; no period-affecting commit | **N/A** (no ledger commit) | Per ADR-0011 §7: ProposedAttachment commits via `documentLinkService.create()` and produces no journal entry. Surface 4 is N/A because there's no compound ledger mutation. Audit-log entry is on the document layer (`attachment_link_created`) per ADR-0011 §1. |

**Reading the table.** A row's "Surface N" cell names the
specific check(s) from §2.N that apply, not "all of them"; a
commit path may consume only a subset of a surface's rows. When
the surface does not apply to the commit path (e.g., bundle
re-verification for a single-mutation path), the cell reads "N/A."

**Sources.** ADR-0011 §7 (handoff vocabulary); ADR-0015
(forthcoming, AP/Spend Subdomain) for the manual-only-in-v1 policy
on prepayment / credit; spec §11 (auto-post deferred past v1);
spec §15 (manual born-paid workflow callout).

---

## 5. Maintenance discipline

This file's coherence depends on per-event maintenance obligations
attached to each kind of change in the surrounding system. The
obligations live with the brief or ADR that introduces the change,
not with this file alone.

**Reserved document-type promotion rule.** A reserved document type cannot be promoted from reserved to active until this matrix is amended with:

1. Document-type-aware field re-verification rows (§2.1) — what fields matter for this document type, what each field's source is, what Tier 1 re-verifies, what the failure mode is, and which Layer the check fires at.
2. Relationship-claim rows (§2.2), if the type can match against existing committed state.
3. Stale-state rows (§2.3), if the type touches committed balances or status.
4. Bundle rows (§2.4), if the type can produce a `ProposedMutationBundle` (e.g. born-paid variants for new payment-evidence types).

The promoting brief or ADR — typically the one that activates the type for its domain — owns the matrix amendment. Promotion without amendment is a governance violation surfaced by the §4 per-commit-path index review at PR time.

**When new bundle types ship.** A new bundle type beyond born-paid
(per ADR-0012's bundle-type catalog or the Spend Initiative brief's
v1.x bundle list) extends §2.4 with a new row carrying child
mutations, balance check, and rollback semantics. The bundle's
owning ADR (typically ADR-0012 amendment or a new bundle-specific
ADR) is responsible for the extension.

**When new domain entities are added.** A new domain entity that
participates in relationship claims (vendor master extension,
new domain object — e.g., AR `customer_invoice`, Banking
`bank_transaction`) extends §2.2 (relationship claims) and §2.3
(stale-state checks) as relevant. The new entity's owning domain
ADR (ADR-0015 for AP/Spend extensions; future Banking / AR / Tax
ADRs for new domains) is responsible for the extension.

**When downstream ADRs ratify and surface new fields.** The
forthcoming ADRs that intersect this file's contract:

- **ADR-0014 (Tier 2 Document Pipeline).** Owns OCR engine choice,
  classification confidence threshold values, replay /
  supersession semantics. When ADR-0014 ratifies, §2.1 rows that
  reference rounding-tolerance values (currently "per ADR-0014")
  resolve to the specific thresholds; the ADR-0014 ratification
  cycle includes a §2.1 update obligation.
- **ADR-0015 (AP/Spend Subdomain).** Owns the v1 manual-only
  policy for vendor-credit-application and
  vendor-prepayment-application that this file inherits in §2.2
  and §4. When ADR-0015 ratifies, the §2.2 reserved-with-deferral
  rows and the §4 "manual-only in v1" status cells are
  cross-checked; subsequent ADR-0015 amendments (post-v1
  automation phases) flip the status cells to "active" and remove
  the deferral notes — those amendments carry the §2.2 / §4 update
  obligation.
- **ADR-0018 (Relationship Router).** Owns the candidate
  versioning and re-evaluation triggers (Q56). When ADR-0018
  ratifies, §2.2 (relationship-claim) re-verification mechanism
  cells may need refinement to name specific candidate-row reads
  (e.g., `getCurrentRelationshipCandidate(case_id)` vs the
  immutable supersession chain); the ADR-0018 ratification cycle
  includes a §2.2 update obligation.
- **ADR-0019 (Confidence Calibration Policy).** Owns the
  classification-confidence threshold mechanism (per Q57, Q65).
  When ADR-0019 ratifies, the §2.1 row for `unknown` and the
  routing references to "classification_confidence below threshold"
  resolve to specific thresholds; the ADR-0019 ratification cycle
  includes a §2.1 update obligation.

**Codification rule.** When this file extends in any of the four
ways above, the extending brief / ADR includes a friction-journal
entry recording the extension and the obligation it satisfied (per
the canonical-doc maintenance rule in `docs/07_governance/adr/README.md`).
Failure to extend the matrix when an obligation fires is itself a
governance issue — flag it in `docs/02_specs/open_questions.md`
rather than guessing what the row should say.

---

## 6. Q77 disposition + Q29 placeholder

### 6.1 Q77 disposition

**Q77 — Q28 re-verification matrix expansion scope** is the
ratification gate for this file. Per ADR-0007 § Updates and the
file-header status, **the matrix is drafted under Phase 0
governance plan Task E2; ratification gates v1 ship, not Phase 1
start.** Downstream Phase 1+ implementation work proceeds against
this file as a draft reference. The matrix is expected to evolve
as new document types and downstream ADRs (ADR-0014, ADR-0015,
ADR-0018, ADR-0019) ratify; final ratification is a Phase 2
deliverable that closes Q77 and updates Q28's disposition.

When this file ratifies (at v1 ship time), Q77 closes and Q28's
disposition updates from "framework-closed by ADR-0007; expanded
matrix drafted under E2" to "fully closed." That ratification is a
future cycle, not this drafting cycle.

### 6.2 Q29 placeholder

**Q29 — Tier 2 boundary enforcement mechanism** was selected by
ADR-0007 (ESLint rule on `src/agent/pipelines/**/*` derived from
the existing `no-unwrapped-service-mutation` rule's allowlist; per
ADR-0007 § Closes Q29). Implementation detail — the concrete
ESLint rule design, the configuration file location, the rule's
test fixtures, and the failure-message text — is **reserved for a
later policy amendment in this same file.** This drafting cycle
does **not** draft the lint rule; it lands when the AP Agent (the
first Tier 2 system per ADR-0007 § Feature mapping) begins
implementation and the rule's first concrete consumer is in scope.

The placeholder here ensures Q29's policy home is established
without forcing the rule design into this E2 cycle. When the rule
is drafted, it lands as §7 (or a renumbered section) under this
file, and Q29's open-question disposition updates from "selected
by ADR-0007; implementation reserved" to "fully closed."

---

## 7. Closes / Updates discipline note

`agent_architecture_policy.md` is a **draft reference**, not an
ADR. It does not have Closes / Updates sections in the ADR sense.
Specifically:

- **This file does not close Q28 by itself.** Q28 was
  framework-closed by ADR-0007 § Closes; the expanded-matrix
  obligation that ADR-0007 forward-pointed here is operational,
  not gating. ADR-0007 carries the closure record; this file
  carries the operational matrix the closure depends on.
- **This file does not close Q77 by itself.** Q77 closes only when
  this matrix ratifies, at v1 ship time. The drafting of the
  matrix (this cycle) does not close Q77; ratification (a future
  cycle) does.
- **This file does not close Q29 by itself.** Q29 was selected by
  ADR-0007; implementation detail is reserved for a later policy
  amendment in this same file (per §6.2). The amendment will
  close Q29 when it lands.
- **The matrix's eventual ratification (at v1 ship time) is a
  future cycle.** That cycle closes Q77 and updates Q28's
  disposition; the drafting cycle (this one) does not.

When the ratification cycle runs, the friction-journal records the
ratification, the file-header status updates from "Drafted" to
"Ratified," and `docs/02_specs/open_questions.md` Q77 is moved to
the closed-questions section with a pointer back to this file.
Until then, this file ships as drafted-and-operational: Phase 1+
implementation reads it as authoritative reference, but the
governance closure remains pending the final ratification.
