# ADR-0016: Document Relationship Graph

## Status

Drafted 2026-05-04; awaiting D4 ratification.

## Date

2026-05-04

## Triggered by

Phase 0 governance plan Task C8 (Tier 4 — depends on ADR-0007
ratification 2026-05-03, ADR-0010 (already accepted 2026-04-24),
ADR-0011 ratification 2026-05-03, ADR-0012 ratification
2026-05-03, ADR-0013 ratification 2026-05-03, and ADR-0014
ratification 2026-05-03; sibling to ADR-0015 drafted at commit
`c036c31` on 2026-05-03 and ADR-0017 forthcoming). The
2026-05-02 Document Platform reframe spec
(`docs/09_briefs/phase-2/document_platform_reframe_design.md`)
named the Document Relationship Graph as the eighth ADR in the
eight-ADR Phase 0 set per §7. ADR-0011 §4 reserved the
`source_document_links` table at the spine layer and explicitly
forward-pointed Q55 to this ADR per its Forward-pointed and
Cross-references entries; ADR-0014 §6 (Q70 closure) reserved
`link_role = 'duplicate_arrival'` post-v1 and named ADR-0016 as
the owner of full `link_role` membership; ADR-0015 §10 declared
its consumption of the v1 active link_role subset
(`primary_invoice`, `payment_evidence`, `receipt`, `supporting`)
and explicitly disclaimed ownership of the enum, naming ADR-0016
as the owner.

ADR-0016 carries one mechanism — the document relationship graph
schema — and a tightly-scoped suite of specifications attached
to that mechanism: the full closed `linked_entity_type` enum
membership with v1 active vs reserved subset, the full closed
`link_role` enum membership with v1 active vs reserved subset
(including the four values ADR-0015 consumes), the full
two-dimensional `(linked_entity_type, link_role)` pair-validity
matrix with each cell flagged active v1 / reserved post-v1 /
invalid, the `documentLinkService` rejection rules for invalid
and reserved pairs at all three defense layers, the cascade
behavior per `linked_entity_type` when the linked entity is
reversed / voided / cancelled, and the schema-side enforcement of
ADR-0011 §16 lifecycle immutability via the pre-commit vs
post-commit boundary.

## Context

### Why a Document Relationship Graph ADR exists

ADR-0011 §1 established the Document Platform as the substrate
that owns `source_documents`, `source_document_links`,
`document_cases`, `document_case_sources`, and the rest of the
substrate-tier tables; §4 reserved the `source_document_links`
spine but explicitly handed off the (entity_type, role)
pair-validity matrix, the full enum membership for both columns,
and the per-`linked_entity_type` cascade matrix to "the ADR-0016
ADR." ADR-0011 §4's three discipline constraints — closed enum
on `linked_entity_type`, closed enum on `link_role`,
service-layer integrity validation in `documentLinkService` —
are the spine; ADR-0016 fills in the full membership for both
columns, the validity matrix that determines which (entity_type,
role) pairs the service accepts at v1 vs reserves for post-v1 vs
rejects categorically, and the cascade contract that determines
what happens to link rows when the linked entity changes state.

The document relationship graph is the schema substrate that
ADR-0011 §6 reserved and that ADR-0018 (Relationship Router,
forthcoming) will traverse at runtime. ADR-0016 owns the schema
and the validity rules; ADR-0018 owns the matching algorithm
that produces candidate link rows from classifier output and
domain state. The split is intentional and load-bearing: the
schema defines the shape of what can be stored and the validity
of what gets inserted; the algorithm defines how candidate
matches are produced, scored, and re-evaluated. A future
contributor who adds a new `linked_entity_type` or a new
`link_role` value, or who proposes a new (entity_type, role)
pair in the validity matrix, is amending ADR-0016. A future
contributor who changes how the Router scores a match candidate
or when it triggers re-evaluation is amending ADR-0018.

### Phase 0 dependency context and Reading B preservation

ADR-0016 sits in Tier 4 alongside ADR-0015 (AP/Spend Subdomain,
drafted at commit `c036c31`) and ADR-0017 (Vendor Template
substrate, forthcoming). All three depend on ADR-0011 (the
spine — entity ownership, `source_documents` schema,
`source_document_links` discipline at the spine level,
exception-queue routing, audit-log writer boundary, lifecycle
immutability, ProposedAttachment contract); on ADR-0010
(reserved-enum-states discipline applied verbatim to both enums
this ADR introduces); on ADR-0007 (three-tier agent architecture,
particularly the Tier 2 / Tier 2.5 read-boundary rules that
constrain when `documentLinkService` rows may be read by
classifier or matcher stages). ADR-0016 is a sibling to
ADR-0015 and ADR-0017 — none of the three depends on either
other ratifying first; the Tier 4 trio ratifies as a package per
the Phase 0 sequencing.

ADR-0016 inherits the upstream contracts verbatim and does not
re-litigate any upstream decision. Specifically: ADR-0011 §1's
entity-ownership boundary determines the membership of
`linked_entity_type` (only entity types the platform can
legitimately link to are eligible for inclusion); ADR-0011 §4's
three discipline constraints are inherited verbatim; ADR-0011
§16's lifecycle immutability rules govern the pre-commit vs
post-commit boundary that ADR-0016 enforces at the schema layer;
ADR-0011 §7's ProposedAttachment handoff vocabulary is the only
path by which consumers propose link creations; ADR-0010's
three-layer reserved-enum defense applies verbatim to both
enums; ADR-0007's Tier 2 / Tier 2.5 read-boundary rules
constrain matcher reads of link rows.

Per ADR-0011 §8 and Reading B from `ledger_truth_model.md`
Service Communication Rules: domain services own domain logic;
the ledger service is the sole writer of `journal_entries` and
`journal_lines`; both run inside `withInvariants()` per Service
Communication Rule 1. ADR-0016 inherits this as a non-negotiable
architectural constraint and adds its own corresponding
single-writer rule: **`documentLinkService` is the sole writer
of `source_document_links`**. No domain code path writes to
`source_document_links` directly. No Tier 2 stage writes to
`source_document_links` directly. No agent tool writes to
`source_document_links` directly. Consumers propose link
creations through the ProposedAttachment handoff per ADR-0011
§7; the proposal commits via `documentLinkService.create()`,
which is the only function that inserts rows into
`source_document_links`.

### What ADR-0011 / ADR-0010 / ADR-0014 / ADR-0015 already nailed down (do not redraft)

- **ADR-0011 §1** — entity ownership boundary. The Document
  Platform owns `source_document_links` as substrate; AP/Spend
  owns the bills / payments / prepayments / credits / vendors
  tables that are the v1 link targets; the ledger service owns
  `journal_entries` and `journal_lines`. ADR-0016 inherits this
  split verbatim and uses it to derive the v1 active subset of
  `linked_entity_type`.
- **ADR-0011 §4** — the three discipline constraints. Closed
  enum on `linked_entity_type`, closed enum on `link_role`, and
  service-layer integrity validation in `documentLinkService` —
  ADR-0016 inherits all three verbatim and fills in the full
  membership for both enums.
- **ADR-0011 §6** — `source_document_links` table existence and
  base columns. ADR-0011 reserved the table at the spine; ADR-0016
  does NOT introduce the table — it specifies the enum membership
  and validity rules for columns the table already has. Adding new
  columns to `source_document_links` is NOT in ADR-0016's scope;
  see Schema deltas (item 5 below) for the explicit boundary.
- **ADR-0011 §7** — ProposedAttachment handoff vocabulary.
  Consumers propose link creations via ProposedAttachment;
  ADR-0016 specifies the service-side commit path
  (`documentLinkService.create()`) but does NOT introduce a new
  proposal primitive.
- **ADR-0011 §13** — exception queue first-class. Pre-commit
  re-routing of unmatched documents flows through the exception
  queue; ADR-0016's pre-commit-side cascade rules cite the
  exception-queue surface as the destination for re-routed
  documents.
- **ADR-0011 §16** — lifecycle immutability rules. Post-commit,
  committed `source_document_links` rows require reversal or
  supersession to change; pre-commit, the case can re-route as
  the Router learns more. ADR-0016 inherits this verbatim and
  encodes it as the pre-commit / post-commit boundary in item 6
  below.
- **ADR-0010** — reserved-enum-states discipline. Three-layer
  defense (DB CHECK, Zod boundary, service emission) applied
  verbatim to both `linked_entity_type` and `link_role`. ADR-0016
  does NOT redraft the discipline; it applies it.
- **ADR-0014 §6** (Q70 closure) — `link_role = 'duplicate_arrival'`
  is reserved post-v1 for capturing dedup short-circuit metadata
  as a `source_document_links` row when post-v1 scope adopts the
  capture pattern. ADR-0016 includes `duplicate_arrival` in the
  full reserved set per ADR-0010 discipline; v1 does not emit it.
- **ADR-0015 §10** — AP/Spend's consumption of the v1 active
  link_role subset (`primary_invoice`, `payment_evidence`,
  `receipt`, `supporting`). ADR-0016 ratifies this consumption
  by including the four values in the v1 active subset of the
  `link_role` enum.

### Reading B preservation as load-bearing constraint for ADR-0016

Reading B is the architectural constraint that ADR-0016 holds at
the document-link layer. The corresponding rule for ADR-0016 is
the **single-writer rule for `source_document_links`**:
`documentLinkService` is the only function that inserts rows
into `source_document_links`. No domain service path writes to
the table directly. No Tier 2 stage writes to the table
directly. No agent tool writes to the table directly. Consumers
propose link creations through the ProposedAttachment handoff
per ADR-0011 §7; the proposal commits via
`documentLinkService.create()`; the service applies the
pair-validity matrix, the integrity check (referenced entity
exists), and the post-commit immutability rule before inserting.

The single-writer rule is the document-link analog of Reading B
for the ledger. Just as Reading B prevents domain services from
writing journal entries directly (only `ledgerService.post(...)`
inserts into `journal_entries`), the single-writer rule for
`source_document_links` prevents domain services from writing
link rows directly (only `documentLinkService.create()` inserts
into `source_document_links`). The two rules compose: a domain
service that needs to attach a document to a bill produces a
`ProposedAttachment` (per ADR-0011 §7) and routes it through the
proposal queue; the proposal commits via
`documentLinkService.create()`; the link row lands; no
domain-service path bypassed the single-writer rule. The
parallel structure makes the single-writer rule mechanical, not
conventional — a future contributor who proposes a domain service
that writes to `source_document_links` directly is proposing a
single-writer-rule violation, with the same shape and the same
hard rejection as a Reading B violation.

The single-writer rule is restated explicitly in items 4, 5,
and 6 of the Decision below, and reinforced in the Notes for
future ADR writers. It is the architectural decision most likely
to drift in future amendments and the most important to preserve.

## Decision

The Decision is presented as six items. Items 1 and 2 specify
the full closed enum membership for `linked_entity_type` and
`link_role` respectively (Q55 sub-items (a) and (b)). Item 3
specifies the full two-dimensional pair-validity matrix (Q55
sub-item (c)). Item 4 specifies the `documentLinkService`
rejection rules at all three defense layers per ADR-0010 (Q55
sub-item (d)). Item 5 specifies the per-`linked_entity_type`
cascade behavior when the linked entity is reversed / voided /
cancelled (Q55 sub-item (e)). Item 6 specifies the pre-commit vs
post-commit boundary as the schema-side enforcement of ADR-0011
§16 lifecycle immutability (Q55 sub-item (f)). All six items
are scoped to the document relationship graph schema; the
Relationship Router matching algorithm, the re-evaluation
triggers, the confidence thresholds, and the AP/Spend domain
decisions are explicitly out of scope per the Anti-overscope
discipline section below.

Throughout this Decision section, the **single-writer rule for
`source_document_links`** is in force: `documentLinkService` is
the sole function that inserts rows into the table. No domain
service path writes to `source_document_links` directly; no Tier
2 stage writes to it directly; no agent tool writes to it
directly. Consumers propose link creations via ProposedAttachment
per ADR-0011 §7; the proposal commits via
`documentLinkService.create()`. This rule is restated in items
4, 5, and 6 below where the rule is load-bearing for the
specific decision.

### 1. `linked_entity_type` enum membership (Q55 sub-item (a) closure)

The `linked_entity_type` column on `source_document_links`
discriminates which domain table the polymorphic `linked_entity_id`
column references. The full closed enum at v1 schema time per
ADR-0010 reserved-enum-states discipline:

**Full reserved set:**

`bill`, `bill_line`, `payment`, `bill_payment_allocation`,
`vendor_prepayment`, `vendor_prepayment_application`,
`vendor_credit`, `vendor_credit_application`, `bank_transaction`,
`card_transaction`, `bank_account`, `card_account`,
`customer_invoice`, `customer_invoice_line`, `customer_payment`,
`customer_credit`, `vendor_statement_line`,
`bank_reconciliation`, `card_reconciliation`,
`fixed_asset`, `tax_filing`, `payroll_run`, `payroll_employee`,
`journal_entry`, `journal_line`, `vendor_master`,
`customer_master`, `period_close`.

**v1 active subset:**

`bill`, `bill_line`, `payment`, `bill_payment_allocation`,
`vendor_prepayment`, `vendor_prepayment_application`,
`vendor_credit`, `vendor_credit_application`.

**Reserved post-v1 (defined in the enum, not emitted by any v1
service write path):**

`bank_transaction`, `card_transaction`, `bank_account`,
`card_account`, `customer_invoice`, `customer_invoice_line`,
`customer_payment`, `customer_credit`, `vendor_statement_line`,
`bank_reconciliation`, `card_reconciliation`, `fixed_asset`,
`tax_filing`, `payroll_run`, `payroll_employee`,
`journal_entry`, `journal_line`, `vendor_master`,
`customer_master`, `period_close`.

The v1 active subset is constrained by ADR-0011 §1's entity
ownership boundary: only entity types whose owning domain ships
in v1 (Document Platform substrate, AP/Spend per ADR-0015,
ledger service) appear in the active set. The reserved post-v1
set anticipates Banking (per ADR-0011 §14 Domain Boundary Map),
AR (post-v1), payroll (post-v1), tax filing (post-v1), and
vendor / customer master mutations (post-v1 expansion of the
v1 vendor-master rules in ADR-0015 §9). `journal_entry` and
`journal_line` are reserved for post-v1 patterns that may need
to attach evidence directly to a journal-level artifact (a
controller-authored adjusting entry whose evidence is a memo
PDF, for example) — v1 attaches evidence at the bill / payment
level, not at the journal-entry level.

**Notable absences from the full reserved set.** `vendor_master`
and `customer_master` are reserved but do NOT appear in the
v1 active set even though `vendors` is a v1 AP/Spend-owned
table per ADR-0011 §1. The reasoning: vendor-master mutations
in v1 do not produce `source_document_links` rows. Per ADR-0011
§6 entity-type membership and the AP/Spend integration in
ADR-0015 §9, vendor-master changes (including the
System-ceiling bank-detail change per INV-AGENT-006) flow
through audit events on the `audit_log` table, not through
link rows on `source_document_links`. A vendor-master change
proposal carries no document attachment in v1; the audit trail
is the record. Reserving `vendor_master` post-v1 enables a
future scope where a vendor-onboarding document (a W-9 or
vendor-setup form) may be attached to the vendor master record
itself; v1 does not exercise that path. The same reasoning
applies to `customer_master`.

The reserved set ships in the enum at v1 schema time per
ADR-0010 discipline — defined in the type, not emitted by any
v1 service write path. Layer 2 Zod rejects client-provided
reserved values; Layer 3 service emission omits reserved
values from INSERT (for the v1 active subset, the service
emits only the active values; for any path that would emit a
reserved value, the path literally does not exist in the
codebase); Layer 1 DB CHECK restricts insertion to the v1
active subset (scoped per ADR-0010 — the CHECK predicate is
trivially true for any row in the v1 active subset; rows
attempting reserved values are rejected at the database).

### 2. `link_role` enum membership (Q55 sub-item (b) closure)

The `link_role` column on `source_document_links` describes the
semantic role of the link — what evidence relationship the link
represents. The full closed enum at v1 schema time per ADR-0010
reserved-enum-states discipline:

**Full reserved set:**

`primary_invoice`, `payment_evidence`, `receipt`, `supporting`,
`duplicate_arrival`, `superseded_version`, `vendor_credit_memo`,
`vendor_statement_excerpt`, `purchase_order`,
`receiving_document`, `retainer_agreement`, `deposit_request`,
`bank_statement_excerpt`, `card_statement_excerpt`,
`reconciliation_evidence`, `customer_invoice_attachment`,
`customer_remittance`, `tax_form`, `contract`,
`payroll_document`, `asset_purchase_support`,
`prior_period_evidence`, `correction_memo`,
`controller_override_memo`, `audit_evidence`, `email_thread`.

**v1 active subset:**

`primary_invoice`, `payment_evidence`, `receipt`, `supporting`.

**Reserved post-v1 (defined in the enum, not emitted by any v1
service write path):**

`duplicate_arrival`, `superseded_version`, `vendor_credit_memo`,
`vendor_statement_excerpt`, `purchase_order`,
`receiving_document`, `retainer_agreement`, `deposit_request`,
`bank_statement_excerpt`, `card_statement_excerpt`,
`reconciliation_evidence`, `customer_invoice_attachment`,
`customer_remittance`, `tax_form`, `contract`,
`payroll_document`, `asset_purchase_support`,
`prior_period_evidence`, `correction_memo`,
`controller_override_memo`, `audit_evidence`, `email_thread`.

The v1 active subset is the four values ADR-0015 §10 declared
its consumption of: `primary_invoice` (the dominant invoice
PDF for a bill), `payment_evidence` (the receipt or
transaction confirmation attached to a payment), `receipt`
(the standalone receipt-as-document attached to a bill or
payment in the receipt v1 path per ADR-0015 §7 Scenarios A /
B / C), and `supporting` (secondary evidence — correspondence
excerpts, delivery notes, or any other document that does not
fit one of the three primary roles).

The distinction between `payment_evidence` and `receipt`
deserves explicit framing. `payment_evidence` is the role for a
document attached to a `payment` row as proof that the payment
occurred (Scenario A in ADR-0015 §7 — the receipt arrives after
the payment is already recorded; the document attaches as
evidence). `receipt` is the role for a document attached to a
`bill` row as the standalone receipt that triggered the bill
record (Scenario C in ADR-0015 §7 — the standalone POS receipt
becomes the primary evidence for a born-paid bundle). The two
roles have distinct cell entries in the validity matrix (item 3
below): `(payment, payment_evidence)` is active v1; `(bill,
receipt)` is active v1; `(payment, receipt)` is also active v1
(a receipt may attach directly to a payment when the receipt is
the primary payment evidence and no separate payment-confirmation
document exists). The semantic distinction is: `payment_evidence`
implies "this document confirms the payment row exists";
`receipt` implies "this document is the receipt-as-document
artifact." The same physical PDF may carry either role
depending on which entity the link attaches to.

The reserved post-v1 set anticipates document-type expansions
forward-pointed by ADR-0011 §6 (the `document_type`
discriminator's reserved set is broader than v1 active),
ADR-0014 §6 Q70 closure (`duplicate_arrival` for post-v1
dedup-arrival capture), and the Banking / AR / payroll / tax
post-v1 phases. `superseded_version` is reserved for the
versioning model in ADR-0011 §2's current-pointer + immutable
anchor pattern — when a re-uploaded document supersedes a
prior version, the prior version's link row is preserved with
the `superseded_version` role; v1's versioning model captures
the supersession through the `current_version_id` pointer
on `source_documents` rather than through a link-role row, so
the role is reserved at v1 schema time but not emitted.
`controller_override_memo` is reserved for the
INV-DOC-001 (ADR-0011 §15) override path — when a controller
overrides the evidence-completeness invariant via the
`bills.override_evidence_completeness` flag (ADR-0015 §10),
post-v1 may capture the override justification as a memo PDF
linked with this role; v1 captures the override through the
boolean flag and audit event only.

The reserved set ships in the enum at v1 schema time per
ADR-0010 discipline. Three-layer defense applies: Layer 2 Zod
rejects client-provided reserved values; Layer 3 service
emission emits only the four active values; Layer 1 DB CHECK
restricts insertion to the v1 active subset.

### 3. `(linked_entity_type, link_role)` pair-validity matrix (Q55 sub-item (c) closure)

The pair-validity matrix specifies which `(linked_entity_type,
link_role)` combinations the `documentLinkService` accepts at
v1, which it reserves for post-v1 activation, and which it
rejects categorically as semantically invalid. The matrix
follows the same reserved-enum-states discipline as the
individual enum membership decisions per ADR-0010 — every cell
is flagged at v1 schema time with one of three labels:

- **active v1** — the pair is accepted by `documentLinkService`
  in v1; both the `linked_entity_type` and the `link_role` are
  in their respective v1 active subsets, AND the semantic
  combination makes sense at the domain layer.
- **reserved post-v1** — the pair is reserved for post-v1
  activation; either the `linked_entity_type` or the `link_role`
  (or both) is in its respective reserved set, OR both are
  active v1 but the semantic combination is reserved (an active
  v1 entity-type may not combine with every active v1
  link-role).
- **invalid** — the semantic combination is rejected
  categorically; the pair is never valid in any v1 or post-v1
  scope. Examples: `(bill, duplicate_arrival)` is invalid
  because the `duplicate_arrival` role describes a
  source-document arrival event, not a relationship to a bill
  entity; `(payment, primary_invoice)` is invalid because the
  `primary_invoice` role describes the dominant invoice PDF for
  a bill, not for a payment.

The matrix is exhaustive — every `(linked_entity_type,
link_role)` cell is labeled. The full enum membership from items
1 and 2 above produces a 28-by-26 matrix (28 entity-type values
× 26 link-role values = 728 cells). Presenting the full 728-cell
matrix verbatim would be unreadable; the matrix below uses the
following notation. Each row is a `linked_entity_type`; each
column is a `link_role`. The cell label is one of:

- `A` = active v1
- `R` = reserved post-v1
- `I` = invalid (categorically rejected)

The eight v1 active `linked_entity_type` values are presented in
their own table with all 26 `link_role` columns; the 20 reserved
post-v1 `linked_entity_type` values are presented as a separate
table (every cell in those rows is `R` or `I` — no `A` cells
appear because the entity type itself is not active in v1).

**Table A: v1 active `linked_entity_type` rows (8 rows × 26 columns = 208 cells)**

| linked_entity_type ↓ \ link_role → | primary_invoice | payment_evidence | receipt | supporting | duplicate_arrival | superseded_version | vendor_credit_memo | vendor_statement_excerpt | purchase_order | receiving_document | retainer_agreement | deposit_request | bank_statement_excerpt | card_statement_excerpt | reconciliation_evidence | customer_invoice_attachment | customer_remittance | tax_form | contract | payroll_document | asset_purchase_support | prior_period_evidence | correction_memo | controller_override_memo | audit_evidence | email_thread |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `bill` | A | I | A | A | I | R | R | R | R | R | R | R | I | I | I | I | I | R | R | I | R | R | R | R | R | R |
| `bill_line` | I | I | I | A | I | R | I | I | I | R | I | I | I | I | I | I | I | I | I | I | R | I | R | I | R | I |
| `payment` | I | A | A | A | I | R | I | I | I | I | I | I | R | R | R | I | I | I | I | I | I | I | R | R | R | R |
| `bill_payment_allocation` | I | A | I | A | I | R | I | I | I | I | I | I | I | I | I | I | I | I | I | I | I | I | R | I | R | I |
| `vendor_prepayment` | I | A | A | A | I | R | I | I | I | I | R | R | I | I | I | I | I | R | R | I | I | I | R | R | R | R |
| `vendor_prepayment_application` | I | I | I | A | I | R | I | I | I | I | I | I | I | I | I | I | I | I | I | I | I | I | R | I | R | I |
| `vendor_credit` | I | I | I | A | I | R | R | R | I | I | I | I | I | I | I | I | I | I | R | I | I | I | R | R | R | R |
| `vendor_credit_application` | I | I | I | A | I | R | I | I | I | I | I | I | I | I | I | I | I | I | I | I | I | I | R | I | R | I |

**Table B: reserved post-v1 `linked_entity_type` rows (20 rows × 26 columns = 520 cells)**

Every cell in these rows is either `R` (reserved post-v1; the
entity type itself is not active in v1, so any link to it is
reserved) or `I` (the role is semantically invalid for this
entity type even at post-v1). The labeling follows the same
semantic validity rules as Table A — invalid pairs in Table B
are pairs whose role-to-entity semantic mapping is incoherent
regardless of when the entity type activates.

| linked_entity_type ↓ \ link_role → | primary_invoice | payment_evidence | receipt | supporting | duplicate_arrival | superseded_version | vendor_credit_memo | vendor_statement_excerpt | purchase_order | receiving_document | retainer_agreement | deposit_request | bank_statement_excerpt | card_statement_excerpt | reconciliation_evidence | customer_invoice_attachment | customer_remittance | tax_form | contract | payroll_document | asset_purchase_support | prior_period_evidence | correction_memo | controller_override_memo | audit_evidence | email_thread |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `bank_transaction` | I | R | R | R | I | R | I | R | I | I | I | I | R | I | R | I | I | I | I | I | I | R | R | I | R | R |
| `card_transaction` | I | R | R | R | I | R | I | R | I | I | I | I | I | R | R | I | I | I | I | I | I | R | R | I | R | R |
| `bank_account` | I | I | I | R | I | I | I | I | I | I | I | I | R | I | R | I | I | I | R | I | I | I | I | R | R | I |
| `card_account` | I | I | I | R | I | I | I | I | I | I | I | I | I | R | R | I | I | I | R | I | I | I | I | R | R | I |
| `customer_invoice` | I | R | R | R | I | R | I | I | R | R | R | R | I | I | I | R | R | R | R | I | R | R | R | R | R | R |
| `customer_invoice_line` | I | I | I | R | I | R | I | I | I | R | I | I | I | I | I | I | I | I | I | I | R | I | R | I | R | I |
| `customer_payment` | I | R | R | R | I | R | I | I | I | I | I | I | R | R | R | I | R | I | I | I | I | I | R | R | R | R |
| `customer_credit` | I | I | I | R | I | R | I | I | I | I | I | I | I | I | I | I | I | I | R | I | I | I | R | R | R | R |
| `vendor_statement_line` | I | I | I | R | I | R | I | R | I | I | I | I | I | I | R | I | I | I | I | I | I | I | R | I | R | I |
| `bank_reconciliation` | I | I | I | R | I | R | I | I | I | I | I | I | R | I | R | I | I | I | I | I | I | I | R | R | R | I |
| `card_reconciliation` | I | I | I | R | I | R | I | I | I | I | I | I | I | R | R | I | I | I | I | I | I | I | R | R | R | I |
| `fixed_asset` | I | R | R | R | I | R | I | I | R | R | I | I | I | I | I | I | I | R | R | I | R | R | R | R | R | R |
| `tax_filing` | I | R | R | R | I | R | I | I | I | I | I | I | I | I | I | I | I | R | I | I | I | R | R | R | R | R |
| `payroll_run` | I | R | R | R | I | R | I | I | I | I | I | I | I | I | I | I | I | R | I | R | I | I | R | R | R | R |
| `payroll_employee` | I | I | I | R | I | R | I | I | I | I | I | I | I | I | I | I | I | R | R | R | I | I | R | R | R | R |
| `journal_entry` | I | I | I | R | I | R | I | I | I | I | I | I | I | I | I | I | I | I | I | I | I | R | R | R | R | R |
| `journal_line` | I | I | I | R | I | R | I | I | I | I | I | I | I | I | I | I | I | I | I | I | I | I | R | I | R | I |
| `vendor_master` | I | I | I | R | I | R | I | I | I | I | I | I | I | I | I | I | I | R | R | I | I | I | I | R | R | R |
| `customer_master` | I | I | I | R | I | R | I | I | I | I | I | I | I | I | I | I | I | R | R | I | I | I | I | R | R | R |
| `period_close` | I | I | I | R | I | R | I | I | I | I | I | I | I | I | I | I | I | I | I | I | I | R | R | R | R | R |

**Cell count totals.** Table A: 208 cells (8 rows × 26 columns).
Table B: 520 cells (20 rows × 26 columns). Combined: 728 cells.
Active v1 (`A`): 15 cells (all in Table A, all in the four
v1-active link-role columns of Table A — `bill` 3, `bill_line` 1,
`payment` 3, `bill_payment_allocation` 2, `vendor_prepayment` 3,
`vendor_prepayment_application` 1, `vendor_credit` 1,
`vendor_credit_application` 1). Reserved post-v1 (`R`): varies;
ships at v1 schema time per ADR-0010 discipline as the seat for
post-v1 activation. Invalid (`I`): the remainder; the pair is
rejected categorically by `documentLinkService` at any phase.

**Validity-matrix activation discipline.** Activating a reserved
cell in any future amendment requires (a) ensuring the cell's
`linked_entity_type` is itself active in v1 or being activated
in the same amendment; (b) ensuring the cell's `link_role` is
itself active in v1 or being activated in the same amendment;
(c) writing a brief explaining the semantic activation
(specifically, why the role makes sense for this entity type at
the activation phase); (d) updating the cell label from `R` to
`A` in this ADR's matrix; (e) extending the
`documentLinkService` Layer 1 / Layer 2 / Layer 3 defenses to
admit the new active pair. Activating an `I` cell is a
categorical rejection that requires either (a) the brief proves
the cell was mislabeled (in which case the relabeling itself is
a clarifying amendment), or (b) the semantic re-interpretation
of one of the two enums has changed (a much higher bar — would
typically require a separate ADR or substantive amendment).

**Anti-overscope guard.** This matrix is the schema-side
validity contract. It does NOT specify how the Relationship
Router decides which pair to propose for a given case (that's
ADR-0018), how confidence affects the propose-vs-exception
routing (that's ADR-0019), or any AP/Spend-domain commit logic
(that's ADR-0015). The matrix accepts or rejects pair
combinations at the schema layer; the algorithmic decisions
that produce candidate pairs and the domain decisions that
consume them live in their respective owning ADRs.

### 4. `documentLinkService` rejection rules (Q55 sub-item (d) closure)

The `documentLinkService.create()` function is the sole writer
of `source_document_links` (single-writer rule, restated here
for emphasis). The function applies the pair-validity matrix
from item 3 above plus the integrity check from ADR-0011 §4 at
each of the three defense layers per ADR-0010 reserved-enum-states
discipline.

**Layer 2 — Zod boundary (service input schema).** The Zod
schema at the service boundary
(`src/shared/schemas/documents/documentLink.schema.ts` per
project convention) rejects any client-provided
`(linked_entity_type, link_role)` pair that is not labeled `A`
in the v1 active subset of Table A from item 3. Rejection
produces a `z.ZodError` with the field path identifying which
column (or combination) failed the validation. The Zod schema
distinguishes three rejection modes:

1. **`linked_entity_type` reserved post-v1.** The entity type is
   in the reserved set per item 1; the Zod schema's enum literal
   union does not include it; the parse fails with a typed error
   message identifying the reserved value.
2. **`link_role` reserved post-v1.** The role is in the reserved
   set per item 2; the Zod schema's enum literal union does not
   include it; the parse fails with a typed error message.
3. **Pair labeled `R` or `I` in the matrix.** Both columns are
   active v1 individually but the pair is reserved or invalid
   per the matrix; the Zod schema's `.refine()` checks the pair
   against the matrix and rejects with a typed error message
   identifying which cell failed and whether the cell is
   reserved post-v1 or categorically invalid.

The Zod schema's enum literal unions are derived from the
`A`-labeled cells of Table A — only the four v1-active link-role
values appear in the schema's enum union for `link_role`; only
the eight v1-active entity-type values appear in the enum union
for `linked_entity_type`. The `.refine()` for pair validity
computes the cell label from item 3's matrix and rejects any
non-`A` pair.

**Layer 3 — Service emission (write-path body).** The
`documentLinkService.create()` function body, after the Zod
parse, applies the integrity check inherited from ADR-0011 §4:
it confirms the named entity exists in the named table before
inserting the link row. The service body emits only INSERT
statements with `(linked_entity_type, link_role)` pairs that
appear in the v1 active subset of Table A — the path that
would emit a reserved or invalid pair literally does not exist
in the codebase. Service-emitted rejection takes the form of a
typed `ServiceError` with one of the following codes:

- `LINKED_ENTITY_NOT_FOUND` — the integrity check failed (the
  named entity does not exist in the named table at insert
  time). The error includes the `linked_entity_type` and the
  attempted `linked_entity_id`.
- `PAIR_RESERVED_POST_V1` — the Layer 2 Zod check should have
  caught this; the Layer 3 check is the defense-in-depth
  backstop. The error message reads "reserved post-v1" with the
  cell coordinates.
- `PAIR_INVALID` — the Layer 2 Zod check should have caught
  this; the Layer 3 check is the backstop. The error message
  reads "categorically invalid" with the cell coordinates.

The Layer 3 errors are not expected to fire in v1 in normal
operation — every legitimate caller routes through the Zod
parse at the boundary and the parse rejects illegal pairs
before the service body executes. Layer 3 is the backstop
against (a) tests that bypass the route handler and call the
service directly with a malformed input, (b) future
contributors who edit the Zod schema without editing the
service body in lockstep, (c) any code path that constructs a
service-input payload programmatically.

**Layer 1 — DB CHECK constraint.** The
`source_document_links` table carries scoped CHECK constraints
per ADR-0010 reserved-enum-states discipline:

1. A CHECK on `linked_entity_type` restricting the column's
   value to the v1 active subset (the eight entity-type values
   in Table A). The CHECK predicate is `linked_entity_type IN
   ('bill', 'bill_line', 'payment', 'bill_payment_allocation',
   'vendor_prepayment', 'vendor_prepayment_application',
   'vendor_credit', 'vendor_credit_application')`. Rows
   attempting reserved entity-type values are rejected at the
   database layer.
2. A CHECK on `link_role` restricting the column's value to the
   v1 active subset (the four role values). The CHECK
   predicate is `link_role IN ('primary_invoice',
   'payment_evidence', 'receipt', 'supporting')`. Rows
   attempting reserved role values are rejected at the
   database layer.
3. A pair-validity CHECK enforcing the v1 active subset of
   Table A. The CHECK predicate is a disjunction over the 15
   `A`-labeled cells in Table A — the row is valid if and only
   if its `(linked_entity_type, link_role)` pair is one of the
   15 explicitly-listed pairs. Rows attempting `R`-labeled or
   `I`-labeled pairs (whose individual columns are both in the
   v1 active subset but whose combination is not active v1) are
   rejected at the database layer.

The three CHECK constraints compose as defense-in-depth: a
Layer 2 bypass (someone writing directly against the Zod-less
DB client) is still caught by Layer 1; a Layer 3 bug (service
synthesizes a reserved pair instead of rejecting at the
boundary) is still caught by Layer 1. The DB is the
authoritative floor under whatever defenses the service and
schema layers provide above it. The pattern follows ADR-0010's
explicit framing for `adjustment_status` and
`recurring_run_status` at Step 9a / Step 10's first migrations.

**Phase 2 upgrade path for the matrix.** When a future
amendment activates a reserved cell or activates a reserved
enum value, the migration loosens the relevant CHECK constraint
(extending the IN list for the entity-type or role check, or
extending the disjunction for the pair-validity check). No
existing-row backfill is required — every v1 row is in a
v1-active pair by construction (the CHECK constraints prevent
any other state). The Zod schema evolves to admit the new
values on the relevant write paths; the service body gains the
new write paths; the old no-emit rule on existing v1 paths
continues to govern rows created by those paths. The migration
cost is low because the v1 → post-v1 transition does not have
to carry the "existing rows need reclassification" question.

### 5. Cascade behavior per `linked_entity_type` (Q55 sub-item (e) closure)

When a linked accounting entity is reversed, voided, or
cancelled, the `source_document_links` row's behavior depends
on (a) whether the link is pre-commit (the case has not yet
flipped to `committed` per ADR-0011 §3 case-state machine) or
post-commit (the case has flipped to `committed`), and (b)
which `linked_entity_type` is involved. Post-commit immutability
per ADR-0011 §16 is the load-bearing rule: committed link rows
are not deleted, not updated in place; reversal produces a
status flip on the link row itself with audit-traceable
supersession. Pre-commit rerouting per ADR-0011 §13 is
permitted: the case can re-route to a different link target as
the Router learns more, with the prior link row being either
discarded (if the case has not yet committed) or preserved
(per the immutability rules below). The
**single-writer rule** holds throughout: only
`documentLinkService` writes to `source_document_links`; the
cascade behavior described here is implemented by service
functions on `documentLinkService` (specifically
`reverseLinkedEntityLink()`), not by triggers, not by direct
SQL from a domain service.

The `source_document_links` row's lifecycle vocabulary is
**distinct from** the canonical mutation lifecycle vocabulary
in `mutation_lifecycle.md`. The canonical mutation states
(Pending, Needs Attention, Approved, Posted, Finalized,
Rejected) describe the lifecycle of a `ProposedMutation` or a
`ProposedAttachment` — the proposal's progress from generation
through commit. The link row itself carries its own narrow
lifecycle vocabulary on the `link_status` column:

- `created` — the link row is committed and active. (This is
  the default state at insert time.)
- `reversed` — the link row's underlying linked entity has
  been reversed; the link row is no longer "active" in the
  domain sense but remains queryable for audit purposes.

This distinction mirrors ADR-0015's payment-state-vs-mutation-
lifecycle-state distinction (`payments.payment_state = 'failed'`
is a domain entity state on `payments`, NOT a mutation-lifecycle
state). The link-status vocabulary is its own narrow set and
ADR-0016 does NOT extend `mutation_lifecycle.md`.

**Per-`linked_entity_type` cascade matrix.** For each v1 active
entity type, the cascade behavior when the linked entity is
reversed / voided / cancelled:

| linked_entity_type | Reversal trigger | Pre-commit behavior | Post-commit behavior (per ADR-0011 §16) |
|---|---|---|---|
| `bill` | `bills.lifecycle_state` flips to `voided` or `cancelled`; OR `bill`-level reversal per ADR-0001 produces a reversal journal entry | Link row is discarded; case re-routes via the Router (per ADR-0018) or routes to the exception queue per ADR-0011 §13 | Link row's `link_status` flips to `reversed`; the document evidence remains valid (the reversed bill still has its invoice attached for audit purposes); the row is preserved; an audit event `source_document_link_reversed` lands |
| `bill_line` | Bill-line removal during a bill amendment / reversal | Link row is discarded with the bill-line removal | Link row's `link_status` flips to `reversed`; the bill-line-level evidence (line-item annotations on a multi-line invoice) remains audit-queryable |
| `payment` | `payments.payment_state` flips to `failed` per ADR-0015 §8; OR payment-level reversal per ADR-0001 | Link row is discarded; case re-routes (the receipt that was attached to the failed payment is now an unmatched piece of evidence and routes to the Router or the exception queue) | Link row's `link_status` flips to `reversed`; the payment-evidence document remains attached for audit purposes; subsequent re-payment produces a new payment row with its own new link rows (no re-attachment to the reversed payment) |
| `bill_payment_allocation` | Allocation reversal as part of payment reversal or bill amendment | Link row is discarded with the allocation reversal | Link row's `link_status` flips to `reversed`; the allocation-level evidence (rare; typically supporting documents) remains audit-queryable |
| `vendor_prepayment` | `vendor_prepayments.status` flips to `refunded` per ADR-0015 §1; OR prepayment-level reversal | Link row is discarded; prepayment-level documents (retainer agreement excerpts, deposit confirmations) re-route to the exception queue or to the new prepayment row | Link row's `link_status` flips to `reversed`; the prepayment-evidence document remains attached for audit purposes |
| `vendor_prepayment_application` | Application reversal (the prepayment-to-bill application is reversed; the prepayment returns to its prior `remaining_balance`) | Link row is discarded with the application reversal | Link row's `link_status` flips to `reversed`; the application-level evidence remains audit-queryable |
| `vendor_credit` | `vendor_credits.status` flips to a reversed-equivalent state per ADR-0015 §10 (status enum extension); OR credit-level reversal | Link row is discarded; credit-level documents (vendor credit memos in a future post-v1 active set) re-route | Link row's `link_status` flips to `reversed`; the credit-evidence document remains attached |
| `vendor_credit_application` | Application reversal (the credit-to-bill application is reversed) | Link row is discarded with the application reversal | Link row's `link_status` flips to `reversed`; the application-level evidence remains audit-queryable |

**Cascade behavior contract for `documentLinkService`.** The
service function that implements the post-commit cascade is
`documentLinkService.reverseLinkedEntityLink()` (the function
name is illustrative; the actual function name is set at
service implementation per project naming conventions). The
function is the sole post-commit mutator of
`source_document_links`. Its contract:

1. **Input.** The function accepts `(linked_entity_type,
   linked_entity_id, reversal_trace_id, controller_user_id)`.
   The `reversal_trace_id` propagates from the upstream
   reversal's trace per Service Communication Rule 5 from
   `ledger_truth_model.md`.
2. **Behavior.** The function looks up all
   `source_document_links` rows where `(linked_entity_type,
   linked_entity_id)` matches the input AND `link_status =
   'created'`; for each matching row, it updates `link_status`
   to `reversed` and emits a `source_document_link_reversed`
   audit event through the canonical audit-log writer per
   ADR-0011 §1. The update is the only post-commit mutation
   permitted on the row's columns; no other column is updated.
3. **Pre-commit caller.** The pre-commit pathway does NOT call
   `reverseLinkedEntityLink()`; pre-commit re-routing is
   handled by `documentLinkService.discardPreCommitLink()` (the
   pre-commit-side equivalent function), which deletes the
   pre-commit link row entirely (acceptable because the case
   has not yet committed; no audit-trail preservation
   obligation per ADR-0011 §16). Pre-commit re-routing emits
   a `pre_commit_link_rerouted` audit event.

Per the single-writer rule: no domain service path calls these
functions directly through SQL; all pathways route through
`documentLinkService`. A domain service that needs to reverse
a linked entity (a `paymentService.commitFailureReversal()` per
ADR-0015 §8 — the payment failure flow that flips
`payment_state` to `failed`) calls
`documentLinkService.reverseLinkedEntityLink('payment',
payment_id, trace_id, controller_user_id)` as part of its
within-transaction work; the link-row update happens inside the
same `withInvariants()` transaction as the payment-state flip
and the reversal journal entry per Reading B.

**`source_document` deletion (rare).** Per ADR-0011 §4, when a
`source_document` is genuinely deleted (rare; for example, a
duplicate-hash file that was incorrectly attached and the
controller chooses to expunge), the link rows are
cascade-deleted, but the operation requires controller authority
and produces an `audit_log` entry with explicit deletion
reason. The cascade-delete is implemented as a foreign-key
constraint on `source_document_links.source_document_id` with
`ON DELETE CASCADE`, plus a service-layer guard that requires
controller authority and structured deletion reason. The
ADR-0011 §4 contract is inherited verbatim by ADR-0016; the
service-layer guard lives in `documentLinkService` (or in
`sourceDocumentService` per platform-side service decomposition,
with `documentLinkService` participating in the deletion
transaction to record the cascade-deleted rows). The deletion
case is the only path where post-commit link rows are
physically removed rather than status-flipped to `reversed`;
the controller authority + audit event preserves the
audit-traceability obligation.

### 6. Pre-commit vs post-commit boundary (Q55 sub-item (f) closure)

Per ADR-0011 §16, the document-case lifecycle and the
`source_document_links` rows have distinct immutability
behavior depending on whether the case has flipped to
`committed`:

- **Pre-commit (`document_cases.lifecycle_state ∈ {received,
  extracting, classified, matched, proposed, needs_review,
  approved}`).** The case can re-route as the Router learns
  more (per ADR-0011 §16 rule 4 and ADR-0011 §13). The
  `source_document_links` row associated with a pre-commit
  case is either non-existent (the case has not yet generated
  a candidate link row), or exists as a candidate / proposed
  row that has not yet committed via
  `documentLinkService.create()`. Pre-commit re-routing is
  implemented by discarding the prior candidate or proposed
  row and creating a new one with the new target.
- **Post-commit (`document_cases.lifecycle_state ∈ {committed,
  rejected, archived}`).** The case has flipped to its
  terminal state; per ADR-0011 §16 rule 4, committed
  `source_document_links` rows require reversal or
  supersession to change. The link row is updated only via the
  cascade behavior in item 5 above (status flip to `reversed`)
  or via the rare deletion path. No other in-place mutation is
  permitted.

ADR-0016 encodes the boundary at the schema layer through two
mechanisms:

1. **`documentLinkService.create()` is the only INSERT path.**
   The service function checks the case's `lifecycle_state`
   before inserting; the function refuses to insert if the
   case is in a post-commit state (which would mean the case
   committed without a link row, then the link row is being
   added after the fact — a violation of the case-state
   machine). The valid commit path is: case flips to
   `proposed` or `approved`; the proposal commits via
   `documentLinkService.create()`; the case flips to
   `committed`. The link row INSERT and the case state
   transition both happen inside the same `withInvariants()`
   transaction.
2. **`source_document_links` carries no UPDATE permission
   for service-role clients on most columns.** Per ADR-0011
   §16 (rule 4) and the immutability discipline, only the
   `link_status` column is permitted to be updated post-commit
   (and only via `documentLinkService.reverseLinkedEntityLink()`
   per item 5). The schema enforces this through (a) Postgres
   table-level UPDATE permission grants restricted to the
   `link_status` column for the service-role grantee, and (b)
   a CHECK constraint that prevents `link_status` from
   transitioning back from `reversed` to `created` (the status
   transition is one-way: `created → reversed`).

The boundary's load-bearing role: it preserves the replayability
contract from ADR-0011 §16. Re-running the Relationship Router
post-commit does not silently mutate prior link decisions;
re-evaluation that produces a different match must produce a
new candidate row that supersedes the prior committed row
through the structured supersession path (which is owned by
ADR-0018 for the algorithm side; ADR-0016 owns only the
schema-side enforcement that prevents in-place mutation). The
pre-commit / post-commit split is the schema-side anchor of the
replayability discipline.

**Pre-commit re-routing audit event.** When a pre-commit link
candidate is discarded and a new candidate created (Router
re-routing per ADR-0018), the discard + create pair emits a
`pre_commit_link_rerouted` audit event through the canonical
audit-log writer per ADR-0011 §1. The event captures:
`(org_id, case_id, prior_candidate_target, new_candidate_target,
re_routing_trigger, trace_id)`. The event is the audit anchor
for pre-commit re-routing; without it, the Router's
re-evaluation history would be invisible to forensic queries.

The Router's re-evaluation triggers (which domain events fire
the re-routing) are owned by ADR-0018 per Q56 forward-pointer.
ADR-0016 owns only the schema-side audit event that records
the re-routing once it has fired.

## Schema deltas

Per the schema-decision discipline (C4/C5 lesson per ADR-0013 +
ADR-0014 schema-decision callouts; reaffirmed by ADR-0015 §10):
every new column on platform-owned tables surfaces explicitly
in this section. Zero silent introductions. The pattern from
ADR-0013's `original_storage_key` and ADR-0015's
`bills.override_evidence_completeness` is the precedent.

**ADR-0016's primary schema deltas are enum membership
extensions on existing platform-owned columns.** The
`source_document_links` table itself is owned by ADR-0011 §6 and
is NOT introduced by ADR-0016; ADR-0016 specifies the membership
of the `linked_entity_type` and `link_role` enum columns that
already exist on the table per ADR-0011's reservation. The
extensions follow ADR-0010's reserved-enum-states discipline
(full reserved set at v1 schema time + v1 active subset
explicit + Layer 1 / Layer 2 / Layer 3 defenses).

**Enum membership additions (full reserved sets per ADR-0010):**

- **`linked_entity_type`** (closed enum on `source_document_links`
  per ADR-0011 §6) — full reserved set per item 1 above (28
  values); v1 active subset is 8 values (`bill`, `bill_line`,
  `payment`, `bill_payment_allocation`, `vendor_prepayment`,
  `vendor_prepayment_application`, `vendor_credit`,
  `vendor_credit_application`). Reserved post-v1: 20 values
  enumerated in item 1.
- **`link_role`** (closed enum on `source_document_links` per
  ADR-0011 §6) — full reserved set per item 2 above (26
  values); v1 active subset is 4 values (`primary_invoice`,
  `payment_evidence`, `receipt`, `supporting` — the four
  values ADR-0015 §10 declared its consumption of). Reserved
  post-v1: 22 values enumerated in item 2.
- **`link_status`** (closed enum on `source_document_links`)
  — narrow status vocabulary per item 5: `created` (default
  at insert), `reversed` (single one-way transition from
  `created` permitted post-commit). v1 active subset is the
  full set (both values active).

**No new columns on `source_document_links` introduced by
ADR-0016.** The table's column set is owned by ADR-0011 §6.
The CHECK constraints introduced by ADR-0016 (item 4 above)
are constraint additions on existing columns, NOT new columns.

**No new tables introduced by ADR-0016.** The
`source_document_links` table is owned by ADR-0011 §6;
ADR-0016 specifies the column membership and the validity
contract for that table only.

**Cross-references for enum extensions on other platform tables
(NOT owned by ADR-0016 — listed for cross-reference only):**

- `source_documents.storage_provider` enum membership — owned
  by ADR-0011 §2 + ADR-0013.
- `source_documents.ingest_channel` enum membership — owned
  by ADR-0011 §2.
- `document_cases.lifecycle_state` enum membership — owned by
  ADR-0011 §3.
- `document_case_sources.role` enum membership — owned by
  ADR-0011 §3.
- `document_type` enum membership (on `document_cases`) — owned
  by ADR-0011 §6.
- Exception-queue resolution-action enum membership — owned by
  ADR-0011 §13.

This is the only substantive schema-delta surface ADR-0016
introduces. The enum-membership decisions in items 1 and 2 are
the load-bearing schema content; the CHECK constraints in item
4 enforce the membership at Layer 1; the `link_status` column's
narrow vocabulary in item 5 is the third small enum on the
table. Zero silent column introductions; zero new tables; the
pattern is enum-extension-only per ADR-0010 discipline.

## Reserved enums and audit events

**Reserved enums introduced by ADR-0016** (full list per
ADR-0010 discipline; v1 active vs reserved explicit; cross-
referenced from items 1, 2, and 5):

| Enum | Full membership | v1 active subset |
|---|---|---|
| `linked_entity_type` | 28 values per item 1 | `bill`, `bill_line`, `payment`, `bill_payment_allocation`, `vendor_prepayment`, `vendor_prepayment_application`, `vendor_credit`, `vendor_credit_application` (8 values) |
| `link_role` | 26 values per item 2 | `primary_invoice`, `payment_evidence`, `receipt`, `supporting` (4 values) |
| `link_status` | `created`, `reversed` | `created`, `reversed` (2 values; both active) |

Reserved values ship in the enum at v1 schema time per ADR-0010
— defined in the type, not emitted by any v1 service write
path. Service-layer Zod rejects client-provided reserved
values (Layer 2 defense); service-layer write paths emit only
v1 active values (Layer 3 defense); the DB CHECK restricts
non-active values for v1 rows (Layer 1 defense — scoped per
ADR-0010 + per the pair-validity matrix in item 3).

The `(linked_entity_type, link_role)` pair-validity matrix
from item 3 is itself a reserved-validity surface — every cell
is labeled at v1 schema time per the reserved-enum-states
discipline; activating a reserved cell is an ADR-0016 amendment
that follows the validity-matrix activation discipline in item
3. The matrix is enforced at Layer 1 via the pair-validity
CHECK constraint in item 4 plus at Layers 2 and 3 by the Zod
schema and service-emission body.

**New audit events for document relationship graph lifecycle**
(cross-references INV-AUDIT-001 from `ledger_truth_model.md`
— every event below flows through the canonical audit-log
writer per ADR-0011 §1; no service inserts into `audit_log`
directly):

| Event | Fields |
|---|---|
| `source_document_link_created` | `org_id`, `source_document_link_id`, `source_document_id`, `linked_entity_type`, `linked_entity_id`, `link_role`, `case_id`, `proposal_id`, `created_by`, `trace_id` |
| `source_document_link_reversed` | `org_id`, `source_document_link_id`, `source_document_id`, `linked_entity_type`, `linked_entity_id`, `link_role`, `reversal_reason`, `reversed_by`, `trace_id` |
| `pre_commit_link_rerouted` | `org_id`, `case_id`, `prior_candidate_target_entity_type`, `prior_candidate_target_id`, `prior_candidate_link_role`, `new_candidate_target_entity_type`, `new_candidate_target_id`, `new_candidate_link_role`, `re_routing_trigger`, `trace_id` |
| `source_document_link_cascade_deleted` | `org_id`, `source_document_link_id`, `source_document_id`, `linked_entity_type`, `linked_entity_id`, `controller_user_id`, `deletion_reason`, `trace_id` |

Each audit event row references INV-AUDIT-001 (audit-log writer
discipline) and INV-AUDIT-002 (immutable audit log) from
`ledger_truth_model.md`; the trace_id propagates per Service
Communication Rule 5. The `documentLinkService` never inserts
into `audit_log` directly; every event routes through
`recordMutation()` (or its successor) per the canonical
audit-log writer contract from ADR-0011 §1.

The `source_document_link_created` event lands at the same
transaction as the `documentLinkService.create()` insert; the
`source_document_link_reversed` event lands at the same
transaction as the `documentLinkService.reverseLinkedEntityLink()`
update; the `pre_commit_link_rerouted` event lands when the
Router re-routes a pre-commit candidate (the trigger for which
is owned by ADR-0018 per Q56); the
`source_document_link_cascade_deleted` event lands when a
`source_document` is deleted via the controller-authority path
per ADR-0011 §4.

## Cross-references

- **ADR-0001** (`0001-reversal-semantics.md`) — reversal-as-
  mirror semantics inherited by `source_document_links.link_status
  = 'reversed'` cascade behavior in item 5. The cascade-side
  ADR-0001 trigger is the upstream domain reversal; ADR-0016's
  cascade is the downstream link-side response.
- **ADR-0007** (`0007-three-tier-agent-architecture.md`) —
  Tier 2 / Tier 2.5 read-boundary rules. Tier 2 vendor matcher
  reads vendor identity-and-matching fields; Tier 2.5 reads
  ledger-aware fields (per ADR-0007 §Tier 2.5 introduced by the
  Document Platform reframe amendment); ADR-0016's
  `source_document_links` rows are Tier 2.5 reads (state, not
  reference). Carried prerequisite for this ADR.
- **ADR-0010** (`0010-reserved-enum-states.md`) — discipline
  applied to every closed enum this ADR introduces or names
  (`linked_entity_type`, `link_role`, `link_status`). Three-
  layer defense (DB CHECK, Zod boundary, service emission)
  applied verbatim per item 4.
- **ADR-0011** (`0011-document-platform.md`) — the spine.
  ADR-0016 inherits §1 (entity ownership boundary — Document
  Platform owns `source_document_links`; v1 active
  `linked_entity_type` membership constrained by AP/Spend's v1
  ownership), §4 (the three discipline constraints — closed
  enum on both columns + service-layer integrity validation;
  the cascade-on-reversal behavior cited in item 5), §6
  (`source_document_links` table existence and base columns;
  ADR-0016 does NOT introduce the table), §7 (ProposedAttachment
  handoff vocabulary; consumers propose link creations through
  the proposal queue), §13 (exception-queue surface; pre-commit
  re-routing flows through it), §16 (lifecycle immutability
  rules; ADR-0016 encodes the schema-side enforcement). Carried
  prerequisite for this ADR.
- **ADR-0012** (`0012-proposed-mutation-bundle.md`) — bundle
  envelope, atomicity, lifecycle vocabulary. ADR-0016 inherits
  the canonical mutation lifecycle vocabulary (does NOT extend
  it); the `source_document_links` row's narrow `link_status`
  vocabulary (`created` / `reversed`) is its own narrow set
  distinct from the canonical mutation states. Carried
  prerequisite for this ADR.
- **ADR-0013** (`0013-storage-provider.md`) — storage provider
  abstraction. Tangential to ADR-0016 (link rows reference
  documents by ID, not by storage location); ADR-0016's
  cascade-delete path on `source_document` deletion (item 5)
  composes with ADR-0013's source-of-truth discipline (one
  `source_documents` row per logical document).
- **ADR-0014** (`0014-tier-2-document-pipeline.md`) — Tier 2
  pipeline produces `document_relationship_candidates` (per
  ADR-0011 §1 and ADR-0014's pipeline output routing); the
  Router (ADR-0018) consumes those candidates and produces
  proposals that commit via `documentLinkService.create()`.
  ADR-0014 §6 closed Q70 (dedup-by-hash) and reserved
  `link_role = 'duplicate_arrival'` for post-v1 capture as a
  link row; ADR-0016 includes `duplicate_arrival` in the full
  reserved set per item 2. Carried prerequisite for this ADR.
- **ADR-0015** (`0015-ap-spend-subdomain.md`, sibling Tier 4)
  — AP/Spend domain consumes the v1 active `link_role` subset
  (`primary_invoice`, `payment_evidence`, `receipt`,
  `supporting` per ADR-0015 §10). Sibling Tier 4 ADR; ratifies
  as part of the Tier 4 trio. ADR-0016's v1 active link_role
  subset MUST include the four values ADR-0015 consumes; this
  is a load-bearing inter-ADR contract.
- **ADR-0017** (forthcoming, Tier 4 —
  `vendor-template-substrate-reservation.md`) — vendor template
  substrate (`clean_approval_count` column on `vendor_rules`).
  Tangential to ADR-0016 (vendor template substrate is a
  separate substrate from the document relationship graph);
  ADR-0017 does not depend on ADR-0016 enum membership.
  Sibling Tier 4 ADR.
- **ADR-0018** (forthcoming, Tier 5 — `relationship-router.md`)
  — Relationship Router behavior, three-subsystem decomposition
  (match-against-existing-state, ambiguity resolution,
  re-evaluation logic); Tier 2.5 read-boundary specifics;
  stale-state TOCTOU obligations; **re-evaluation triggers
  (Q56 — explicitly NOT closed by ADR-0016)**. ADR-0016 owns
  the schema and validity rules that the Router consumes;
  ADR-0018 owns the algorithm. The split is load-bearing — see
  the Anti-overscope discipline section below.
- **ADR-0019** (forthcoming, Tier 6 —
  `confidence-calibration-policy.md`) — confidence thresholds
  and calibration governance. Tangential to ADR-0016 (the
  matrix accepts or rejects pairs at the schema layer; the
  algorithmic decisions about which pairs to propose are
  ADR-0018's; the confidence thresholds that gate
  propose-vs-exception routing are ADR-0019's).
- **`docs/02_specs/intent_model.md`** — `ProposedMutation` /
  `ProposedAttachment` shape (§3); Four Questions grammar
  (§5); Logic Receipt (§6). ADR-0016 consumes ProposedAttachment
  per ADR-0011 §7 as the proposal vocabulary by which consumers
  request link creations; the proposal commits via
  `documentLinkService.create()` per item 4 above. Every
  committed link row produces a Logic Receipt per INV-AGENT-002
  per the canonical audit-log writer.
- **`docs/02_specs/mutation_lifecycle.md`** — six canonical
  mutation lifecycle states (Pending, Needs Attention,
  Approved, Posted (auto), Posted (manual), Finalized) plus
  terminal Rejected and Rejected-with-reversal. ADR-0016
  inherits the canonical vocabulary unchanged. The
  `source_document_links.link_status` narrow vocabulary
  (`created` / `reversed`) introduced by item 5 is a
  **link-row state**, NOT a mutation-lifecycle state —
  distinction explicit in items 5 and Notes for future ADR
  writers below. **ADR-0016 does NOT amend
  `mutation_lifecycle.md`.**
- **`docs/02_specs/ledger_truth_model.md`** — Service
  Communication Rules. Reading B (Rule 1 typed input schemas;
  Rule 2 validation at both ends; Rule 4 no free-form data at
  the boundary; Rule 5 trace_id on every call) inherited by
  every `documentLinkService` write path. INV-AUDIT-001
  (audit-log row in same transaction). INV-AUDIT-002
  (immutable audit log). The single-writer rule for
  `source_document_links` introduced by ADR-0016 is the
  document-link analog of Reading B for the ledger.
- **`docs/02_specs/agent_architecture_policy.md`** — Q28
  re-verification matrix authoritative source for surfaces
  1–3; ADR-0012 is the authoritative source for surface 4
  (bundle re-verification). Tangential to ADR-0016; the
  per-document-type matrix rows that touch link-role
  decisions (a future post-v1 expansion) would consume
  ADR-0016's enum membership at that time.
- **`docs/02_specs/invariants.md`** — INV-AUDIT-001/002,
  INV-DOC-001 (evidence-completeness, registered at Phase 0
  Task E1 per ADR-0011 §15). INV-DOC-001 consumes the
  `link_role = 'primary_invoice'` value from ADR-0016's v1
  active subset; the invariant's "every committed bill has
  at least one `source_document_links` row with `primary_invoice`
  link_role unless override flag is set" depends on ADR-0016
  including `primary_invoice` in the v1 active subset.
- **`docs/02_specs/open_questions.md`** — Q55 closed by this
  ADR per the Closes section below. Q56 (Relationship Router
  re-evaluation triggers) explicitly NOT closed by ADR-0016
  — owned by ADR-0018 per the Anti-overscope discipline
  section.
- **`docs/09_briefs/phase-2/document_platform_reframe_design.md`**
  — the canonical 21-section design spec. ADR-0016 inherits
  decisions from §6 (polymorphic-link discipline at the spine
  level), §7 (Phase 0 ADR list — Document Relationship Graph
  named as the eighth ADR), §13 (Q-list — Q55 closed here;
  Q56 forward-pointed to ADR-0018), §15 (receipt v1 decision
  matrix — Scenarios A / B / C inherit `link_role` semantics
  from ADR-0016).

## Closes

This ADR closes the following Document-Platform-scope question
from `docs/02_specs/open_questions.md`:

| Q | Closure scope | Disposition |
|---|---|---|
| **Q55** | `source_document_links` active enums and pair validity | **Closed.** (a) `linked_entity_type` enum membership — full reserved set (28 values per item 1) + v1 active subset (8 values: `bill`, `bill_line`, `payment`, `bill_payment_allocation`, `vendor_prepayment`, `vendor_prepayment_application`, `vendor_credit`, `vendor_credit_application`). (b) `link_role` enum membership — full reserved set (26 values per item 2) + v1 active subset (4 values: `primary_invoice`, `payment_evidence`, `receipt`, `supporting` — the four values ADR-0015 §10 declared its consumption of). (c) `(linked_entity_type, link_role)` per-pair validity matrix — full 728-cell 2D matrix with each cell flagged active v1 (`A`) / reserved post-v1 (`R`) / invalid (`I`); 15 active v1 cells, remainder reserved or invalid. (d) `documentLinkService` rejection rules — invalid pairs raise `ServiceError` `PAIR_INVALID`; reserved pairs raise `ServiceError` `PAIR_RESERVED_POST_V1`; integrity-check failures raise `ServiceError` `LINKED_ENTITY_NOT_FOUND`; three-layer defense (Layer 1 DB CHECK + Layer 2 Zod boundary + Layer 3 service emission) per ADR-0010 reserved-enum-states discipline. (e) Cascade behavior per `linked_entity_type` — post-commit immutability per ADR-0011 §16 (status flip to `reversed` via `documentLinkService.reverseLinkedEntityLink()`); pre-commit re-routing allowed per ADR-0011 §13 (discard prior candidate, create new candidate, emit `pre_commit_link_rerouted` audit event). (f) Pre-commit vs post-commit boundary — schema-side enforcement of ADR-0011 §16 lifecycle immutability via (i) `documentLinkService.create()` is the only INSERT path and refuses to insert post-commit, (ii) `source_document_links` carries no UPDATE permission for service-role clients on most columns; only `link_status` may transition, and only in the `created → reversed` direction. Per items 1–6 above. |

**Explicitly NOT closed by ADR-0016:**

- **Q56 — Relationship Router re-evaluation triggers.** Owned
  by **ADR-0018** (Relationship Router). ADR-0016 owns the
  schema-side audit event (`pre_commit_link_rerouted`) that
  records re-routing after it has fired; ADR-0018 owns the
  domain-event triggers that fire the re-routing. The split
  is the schema-vs-algorithm load-bearing decision — see the
  Anti-overscope discipline section below.

## Anti-overscope discipline

ADR-0016 owns the document relationship graph schema and
validity contract only. The following are explicitly NOT
ADR-0016 scope. Future readers (and future ADR amendment
authors) are warned: if a proposed amendment to ADR-0016 drifts
into the territories below, the proposal is misplaced and
should be re-scoped to the owning ADR.

- **Relationship Router matching algorithm** — owned by
  **ADR-0018** (Relationship Router, forthcoming). ADR-0016
  consumes Router output (the pair `(linked_entity_type,
  linked_entity_id, link_role)` that the Router proposes) at
  the `documentLinkService.create()` entry point, but does
  NOT specify how the Router scores match candidates,
  resolves ambiguity, decomposes into the three sub-systems
  (match-against-existing-state, ambiguity resolution,
  re-evaluation logic), or interacts with the Tier 2.5
  read-boundary. All of those live in ADR-0018.
- **Re-evaluation triggers (Q56)** — owned by **ADR-0018**.
  ADR-0016 emits the `pre_commit_link_rerouted` audit event
  when re-routing fires, but does NOT specify which domain
  events trigger Router re-runs (a new bill posts that
  matches a stranded receipt; a vendor master gets merged;
  a period reopens). All of those live in ADR-0018 per Q56's
  forward-pointer in ADR-0011 §Forward-pointed.
- **Confidence threshold calibration governance** — owned by
  **ADR-0019** (Confidence Calibration Policy, forthcoming).
  ADR-0016's pair-validity matrix accepts or rejects pairs at
  the schema layer; the confidence thresholds that gate
  propose-vs-exception routing for an in-pair-validity match
  candidate live in ADR-0019. ADR-0016 does NOT specify
  threshold values, per-document-type calibration policy, or
  the governance process for tuning thresholds.
- **AP/Spend domain decisions** — owned by **ADR-0015** (sibling
  Tier 4). ADR-0016 specifies the `link_role` v1 active subset
  that ADR-0015 consumes; ADR-0015 specifies how the AP/Spend
  domain services use those `link_role` values in their commit
  paths (born-paid bundle workflow, manual workflow, Scenarios
  A / B / C lifecycle). ADR-0016 does NOT specify domain
  service behavior; it specifies only the link-row schema and
  validity that the domain consumes.
- **Vendor template substrate** — owned by **ADR-0017**
  (sibling Tier 4, forthcoming). ADR-0016 does NOT specify
  vendor template behavior; vendor templates are a separate
  substrate from the document relationship graph.
- **OCR / extraction behavior** — owned by **ADR-0014** (already
  ratified). ADR-0016 does NOT specify OCR engine selection,
  classification strategy, vendor matcher pipeline integration,
  dedup-by-hash semantics (Q70 closed by ADR-0014; ADR-0016
  inherits the `duplicate_arrival` reservation). The
  `document_relationship_candidates` table is owned by
  ADR-0011 §1; ADR-0016 does NOT specify how candidates are
  produced.

Where ADR-0016 needs to reference any of the above areas, it
does so by ADR number with the boundary explicit (e.g., "the
matching algorithm is owned by ADR-0018 — ADR-0016 consumes
the output, not the algorithm"; "the cascade trigger is owned
by ADR-0001 / ADR-0015 — ADR-0016 consumes the trigger and
applies the schema-side cascade"). The forward-pointer in the
Closes section (Q56 → ADR-0018) is the load-bearing boundary
callout.

## Consequences

### What this enables

- **The document relationship graph schema ships in v1 with a
  complete validity contract.** All eight v1-active entity types,
  all four v1-active link roles, the full 22-cell active-pair
  matrix, the cascade behavior per entity type, and the
  pre-commit / post-commit boundary all carry structured
  schema-side enforcement at v1 schema time per ADR-0010
  reserved-enum-states discipline.
- **ADR-0015's AP/Spend domain consumption lands cleanly.**
  The four `link_role` values ADR-0015 §10 consumes
  (`primary_invoice`, `payment_evidence`, `receipt`,
  `supporting`) are in the v1 active subset; the corresponding
  `linked_entity_type` values (`bill`, `payment`,
  `bill_payment_allocation`, `vendor_prepayment`,
  `vendor_prepayment_application`, `vendor_credit`,
  `vendor_credit_application`) are in the v1 active subset; the
  pair-validity matrix's `A`-labeled cells include every pair
  ADR-0015 needs at v1.
- **Reading B's document-link analog (single-writer rule)
  preserves the architectural separation.**
  `documentLinkService` is the sole writer of
  `source_document_links`; consumers propose link creations
  through ProposedAttachment per ADR-0011 §7. The single-writer
  rule composes with Reading B — neither rule alone is the full
  architectural separation; together they enforce the
  Platform-proposes / Domain-decides / Ledger-writes triad at
  the schema layer.
- **Replayability discipline is preserved at the schema layer.**
  The pre-commit / post-commit boundary plus the
  `link_status` one-way transition (`created → reversed`)
  prevent in-place mutation of committed link rows; re-running
  the Router post-commit produces new candidates that
  supersede prior committed rows through the structured
  supersession path (algorithm-side ownership in ADR-0018) and
  the schema-side enforcement here ensures the supersession
  cannot bypass the immutability rules.
- **The 728-cell pair-validity matrix is a future-amendment
  target with explicit activation discipline.** Activating a
  reserved cell follows a clear pattern (entity-type active,
  role active, semantic brief, label flip from `R` to `A`,
  defense extension). The discipline prevents silent activation
  of pairs that have not been semantically vetted; every cell
  flip is an auditable amendment with provenance.
- **Cascade behavior preserves audit-trail visibility on
  reversals.** Post-commit reversal flips `link_status` to
  `reversed` rather than deleting the row; the
  `source_document_link_reversed` audit event records the
  reversal context; the reversed link row remains queryable
  for forensic queries ("show me every reversed link row for
  vendor X") and for replayability ("re-run the Router
  against the post-reversal state and verify the new
  candidate matches the prior reversal context").
- **`link_status` vocabulary is its own narrow set, not an
  extension of the canonical mutation lifecycle.** The
  distinction (link-row state vs mutation-lifecycle state)
  preserves the canonical vocabulary in `mutation_lifecycle.md`
  unchanged; future contributors can compose link-row state
  transitions with mutation-lifecycle state transitions
  without conflation.

### What this constrains

- **Every future feature that introduces a new linked entity
  type or a new link role must update ADR-0016.** Adding a new
  `linked_entity_type` value, a new `link_role` value, or
  activating a reserved `(linked_entity_type, link_role)`
  cell requires an ADR-0016 amendment with the
  validity-matrix activation discipline (item 3) followed.
  No silent additions; no "just edit the enum and re-deploy"
  shortcuts.
- **No domain code path may write to `source_document_links`
  directly.** The single-writer rule for
  `source_document_links` is mechanical — only
  `documentLinkService` is the entry point. Future
  contributors who propose direct writes from a domain service
  (a `paymentService` that writes a `payment_evidence` link
  row directly) are proposing a single-writer-rule violation,
  with the same shape and same hard rejection as a Reading B
  violation.
- **No silent activation of reserved enum values.** The
  reserved values in both enums (`linked_entity_type`,
  `link_role`) and the `R`-labeled cells in the pair-validity
  matrix ship in the schema at v1 but are not emitted by v1
  service write paths. Activating a reserved value or a
  reserved cell requires an ADR-0016 amendment per ADR-0010
  discipline; silent activation is a discipline violation
  caught by the Layer 1 / Layer 2 / Layer 3 defenses.
- **No in-place mutation of committed link rows.** The
  pre-commit / post-commit boundary is mechanical — the
  schema does not grant UPDATE permission on
  `source_document_links` columns other than `link_status`,
  and `link_status` may transition only one-way (`created →
  reversed`). Future contributors who propose in-place
  mutation of committed rows (a "fix-up" path that updates a
  prior link's `linked_entity_id` to point to a different
  entity) are proposing an immutability violation; the
  correct path is reversal + new link creation per the
  cascade behavior in item 5.
- **Cascade behavior is service-implemented, not trigger-
  implemented.** The reverse-link cascade is implemented by
  `documentLinkService.reverseLinkedEntityLink()`; no
  database trigger fires the cascade. The choice preserves
  the single-writer rule (the service is the only path that
  mutates the row's `link_status`) and keeps the audit-event
  emission auditable (the audit event lands as part of the
  service-side transaction, not as a side effect of a
  trigger). Future contributors who propose a database
  trigger for the cascade are proposing a single-writer-rule
  bypass.
- **Document-case lifecycle and link-row lifecycle are
  distinct vocabularies.** The case states (`received`,
  `extracting`, `classified`, etc. per ADR-0011 §3) describe
  the case's progress; the link-row states (`created`,
  `reversed` per item 5) describe the link's audit lifecycle.
  Future contributors who attempt to unify the two
  vocabularies are conflating distinct concerns; the
  document-case is a workflow item (per ADR-0011 §3); the
  link row is a polymorphic relationship between a document
  and an accounting entity (per ADR-0011 §4). Both lifecycles
  apply to the same case but at different levels of
  abstraction.

### What this costs

- **Schema scope.** The schema additions are enum-membership
  extensions on existing platform-owned columns
  (`source_document_links.linked_entity_type`,
  `source_document_links.link_role`,
  `source_document_links.link_status`) per ADR-0010
  reserved-enum-states discipline. Three CHECK constraints
  added (one per enum + one for the pair-validity matrix). No
  new tables, no new columns. Migration cost is bounded by
  the enum-extension footprint.
- **Reserved-enum migrations.** Both enums introduced by
  ADR-0016 ship at v1 with full reserved membership;
  activation of reserved values is a future ADR amendment, not
  a schema migration. Migrations beyond the v1 schema-time
  addition are zero unless a future amendment activates a
  reserved value or a reserved cell.
- **Service surface.** `documentLinkService` ships with
  `create()`, `reverseLinkedEntityLink()`,
  `discardPreCommitLink()` at minimum; the function names
  are illustrative and finalize at service implementation per
  project naming conventions. The service's Zod schema
  (`documentLink.schema.ts`) carries the Layer 2 defense; the
  service body carries the Layer 3 defense; the database
  carries the Layer 1 defense. Reading B compliance is
  mechanical — `documentLinkService` is in the Document
  Platform substrate layer, not in any domain service layer,
  and never calls `ledgerService.post(...)`.
- **Test surface.** Integration tests for: the 15 v1-active
  pair-validity cells (each pair valid, integrity-check
  passes); reserved-pair rejection at all three layers (Layer
  1 DB CHECK rejects, Layer 2 Zod rejects, Layer 3 service
  emission rejects); invalid-pair rejection at all three
  layers; cascade behavior per `linked_entity_type` (each
  v1-active entity type's reversal triggers the correct
  link-status flip and the correct audit event); pre-commit
  re-routing (discard + create + audit event); post-commit
  immutability (UPDATE permission rejection on non-`link_status`
  columns, transition rejection on backwards `link_status`
  transitions); single-writer rule (no domain service writes
  to `source_document_links` directly).
- **Audit-log volume.** ADR-0016 adds 4 new audit event types
  (item Reserved enums and audit events). v1 volume is bounded
  by the "founder + 2 real users" cohort plus the per-document
  workflow throughput; post-v1 scaling depends on Document
  Platform throughput. All events route through the canonical
  audit-log writer per ADR-0011 §1.

## Alternatives considered

### Alternative 1 — Open enum vs reserved-enum discipline for `linked_entity_type` / `link_role`

**Open enum rejected — ADR-0010 discipline applies.** The
alternative would have shipped `linked_entity_type` and
`link_role` as open enums (the service accepts any
client-provided string, with the Zod schema validating only
that the value is a non-empty string) or as schema-loose enums
(Postgres TEXT columns with no CHECK constraint). The
alternative rejection inherits ADR-0010's reasoning verbatim:
open enums lose the `\dT+` discoverability, lose the generated
TypeScript literal-type narrowing, lose the `EXPLAIN`-plan
predictability, and — most importantly — lose the
"Phase 1 readers see the planned shape" benefit for the
post-v1 reserved set.

The reserved-enum discipline (closed enum at v1 schema time +
v1 active subset explicit + three-layer defense) is the load-
bearing pattern for both enums. The pair-validity matrix's
cell labels (`A` / `R` / `I`) follow the same discipline at
the cell level rather than the enum level. Future readers
encountering ADR-0016 see the planned post-v1 shape directly
in the enum definitions and the matrix cells; no external
doc archaeology is required to answer "what is the future
state space of these columns?" The pattern matches ADR-0010
Alternative 3's framing for `adjustment_status`.

### Alternative 2 — Materialized graph table vs computed-at-query-time relationship view

**Materialized graph rejected for v1; the append-only
`source_document_links` table is the canonical store.** The
alternative would have computed link relationships at query
time from the underlying domain tables (joining `bills`,
`payments`, `source_documents` through inferred FK paths)
without materializing a separate `source_document_links`
table. The alternative was rejected per ADR-0011 §6's
table reservation: the polymorphic many-to-many between
documents and accounting entities cannot be inferred from
domain tables alone (a document attached to a bill via
`source_document_links` is not derivable from any FK on
`bills` or `source_documents`; the link itself is the
relationship), and computing the relationships at query
time would (a) require N joins per accounting entity type
per query, (b) miss the audit lifecycle (the
`link_status = 'reversed'` semantics has no inferred
equivalent), (c) miss the audit-event surface (each link
creation produces an audit event; no equivalent exists in
a computed view), and (d) miss the pre-commit / post-commit
boundary (the link row's lifecycle independent of the
underlying entity's lifecycle is the load-bearing
replayability anchor).

The append-only graph table is the canonical store; views may
compose on top of it (a "document-attached-to-bill" view that
joins `source_document_links` with `bills` for a specific
read pattern is a reasonable downstream artifact), but the
materialization is the source of truth. Per ADR-0011 §16,
the graph table participates in the immutability discipline
(committed rows are not deleted, only status-flipped); a
computed view cannot carry that discipline.

### Alternative 3 — Pre-commit mutation vs reversal-only post-commit

**Pre-commit mutation rejected for post-commit rows;
reversal-only post-commit per ADR-0011 §16.** The alternative
would have allowed in-place mutation of committed
`source_document_links` rows for "obvious" cases — for
example, fixing a typo on `link_role` (the controller
realizes the link should be `payment_evidence` instead of
`receipt`) or re-pointing `linked_entity_id` to a corrected
entity (the controller realizes the link was attached to the
wrong bill). The alternative was rejected per ADR-0011 §16:
post-commit immutability is the load-bearing replayability
anchor; in-place mutation of committed rows breaks the
ability to re-run the Router against the post-commit state
and reproduce the prior decision (the prior decision is gone
— overwritten by the in-place fix).

The correct path for "obvious" cases is the reversal +
re-creation pattern: the controller reverses the prior link
(via `documentLinkService.reverseLinkedEntityLink()`); a new
link is created (via `documentLinkService.create()`) with the
corrected target or role; the audit trail records both
operations with their `trace_id` linkage (the new link's
audit event references the prior reversed link's ID via a
correction-context field). The reversal + re-creation pattern
costs two audit events instead of one in-place update event,
but it preserves the immutability contract. ADR-0011 §16's
framing as a load-bearing constraint is inherited by ADR-0016
without modification.

The pre-commit case allows in-place mutation in the form of
discard + re-create (the prior pre-commit candidate is
discarded; a new pre-commit candidate is created with the
new target). Pre-commit re-routing emits a
`pre_commit_link_rerouted` audit event (item 5) rather than
two separate events — the re-routing is a single audited
operation. The pre-commit pathway's permissive in-place
behavior is justified because pre-commit rows have not yet
crossed the immutability threshold per ADR-0011 §16; once
they cross, the reversal + re-creation pattern is the only
permitted path.

## Notes for future ADR writers

- **Q55 closure pattern (schema closes here; algorithm closes
  in ADR-0018).** The pattern this ADR establishes — closing
  the schema-side question while explicitly forward-pointing
  the algorithm-side question (Q56) to a separate ADR — is
  the same pattern ADR-0011 used for Q73's four-piece closure
  and ADR-0015 used for Q60's v1 / post-v1 split. ADR-0016
  closes Q55 (schema substrate); ADR-0018 closes Q56 (Router
  re-evaluation triggers). A future contributor who attempts a
  single-ADR full closure of Q55 + Q56 is misframing the
  questions — the schema-vs-algorithm split is intentional and
  load-bearing. A future contributor who proposes moving Q55
  to ADR-0018 is moving the schema substrate into the
  algorithm ADR; the migration is non-trivial because ADR-0011
  §4 cites ADR-0016 by number for the schema-side ownership.

- **Reserved-enum extension expectations as new entity types
  come online.** ADR-0016's reserved post-v1 set anticipates
  AR (post-v1 — `customer_invoice`, `customer_invoice_line`,
  `customer_payment`, `customer_credit` entity types;
  `customer_invoice_attachment`, `customer_remittance` link
  roles); Banking (post-v1 — `bank_transaction`,
  `card_transaction`, `bank_account`, `card_account`,
  `bank_reconciliation`, `card_reconciliation` entity types;
  `bank_statement_excerpt`, `card_statement_excerpt`,
  `reconciliation_evidence` link roles); tax filing (post-v1
  — `tax_filing` entity type; `tax_form` link role); payroll
  (post-v1 — `payroll_run`, `payroll_employee` entity types;
  `payroll_document` link role); fixed asset / asset purchase
  (post-v1 — `fixed_asset` entity type; `asset_purchase_support`
  link role); period close (post-v1 — `period_close` entity
  type; `prior_period_evidence`, `correction_memo` link
  roles); journal-level direct attachments (post-v1 —
  `journal_entry`, `journal_line` entity types). When these
  domains scope, each one's first ADR amendment activates the
  relevant reserved entity-type values, the relevant reserved
  link-role values, and the corresponding reserved cells in
  the pair-validity matrix per the validity-matrix activation
  discipline in item 3. The amendment includes the brief that
  semantically justifies each cell activation.

- **The pre-commit / post-commit boundary is the load-bearing
  immutability decision of this ADR.** A future contributor
  who proposes loosening the boundary (allowing in-place
  mutation of committed rows for "obvious" cases) is
  proposing an immutability violation per Alternative 3
  above. The reversal + re-creation pattern is the only
  permitted post-commit correction path; the schema-side
  enforcement (UPDATE permission restricted to `link_status`
  + one-way transition) is the mechanical guard. A future
  amendment that proposes a "fix-up" service function on
  `documentLinkService` for post-commit corrections is
  proposing the same alternative; the rejection is hard.

- **The single-writer rule for `source_document_links` is the
  document-link analog of Reading B for the ledger.** A future
  contributor who proposes a domain service that writes to
  `source_document_links` directly (a `paymentService` that
  inserts a `payment_evidence` link row as part of its
  `record()` function) is proposing a single-writer-rule
  violation. The correct path: the domain service produces a
  ProposedAttachment per ADR-0011 §7; the proposal commits
  via `documentLinkService.create()`; the link row lands; no
  domain-service path bypassed the single-writer rule. The
  rule is repeated here because it is the rule most likely to
  drift in future amendments — the temptation to "just write
  the link row directly" is high when a domain service is
  already inside a `withInvariants()` transaction and has the
  link target in scope. Resist the temptation; route through
  `documentLinkService`.

- **The `link_status` vocabulary distinction from
  mutation-lifecycle is load-bearing.** Item 5's distinction
  — `link_status = 'created' | 'reversed'` is a link-row
  state on `source_document_links`, NOT a mutation-lifecycle
  state — must be preserved by every future amendment. The
  canonical mutation-lifecycle vocabulary from
  `mutation_lifecycle.md` is unchanged; the document-link
  layer carries its own state column with its own narrow
  transition vocabulary. The pattern mirrors ADR-0015's
  `payment_state = 'failed'` distinction from
  mutation-lifecycle. A future contributor who proposes
  unifying the two vocabularies (adding a `link_reversed`
  state to `mutation_lifecycle.md`, or adding a `posted` /
  `finalized` state to `link_status`) is conflating distinct
  vocabularies. The distinction is necessary because a
  link-creation `ProposedAttachment` flows through canonical
  mutation-lifecycle states (Pending → Approved → Posted
  (manual)) while the underlying `source_document_links`
  row's `link_status` is `created` from the moment of insert
  — the proposal's mutation-lifecycle progress and the link
  row's audit lifecycle live on different entities and use
  different vocabularies.

- **The pair-validity matrix is exhaustive at v1 schema time;
  cell labels are the lowest-friction amendment surface.**
  Activating a reserved cell or relabeling an invalid cell
  requires an ADR-0016 amendment (per item 3's
  validity-matrix activation discipline), but the amendment
  surface is small — flip a single cell label in Table A or
  Table B, extend the relevant CHECK constraint's
  disjunction, extend the Zod schema's pair `.refine()`,
  ensure the service emission body emits the new pair. The
  amendment cost is bounded by per-cell extension; bulk
  activation (e.g., activating an entire reserved entity-type
  row when AR ships) is a single coherent amendment that
  covers all cells in the row plus the relevant link-role
  cells. The matrix's exhaustiveness at v1 schema time is the
  precondition for the low-friction amendment shape.

- **The Tier 4 trio (ADR-0015, ADR-0016, ADR-0017) ratifies
  as a package; do not propose isolated ADR-0016
  ratification.** Per the Phase 0 governance plan, the Tier 4
  trio ratifies together as part of the D4 ratification
  package. ADR-0016's v1 active link_role subset depends on
  ADR-0015's consumption pattern (the four values are chosen
  to match what AP/Spend needs at v1); ADR-0015's evidence-
  completeness invariant (INV-DOC-001) depends on ADR-0016's
  inclusion of `primary_invoice` in the v1 active subset.
  The dependencies are bidirectional and the ratification
  package preserves the consistency. A future contributor who
  proposes a partial ADR-0016 amendment that breaks one
  direction of the dependency (e.g., removing `primary_invoice`
  from the v1 active subset) would also need to amend
  ADR-0015 in the same amendment package; the discipline is
  inherited from the Phase 0 sequencing.
