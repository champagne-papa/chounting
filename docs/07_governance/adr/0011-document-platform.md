# ADR-0011: Document Platform — Substrate Spine, DOC Invariant Prefix, Domain Boundary Map

## Status

Drafted 2026-05-03. Not yet ratified. CTO ratifies + founder
reviews per Phase 0 governance plan Decision 3.

## Date

2026-05-03

## Triggered by

Phase 0 governance plan Task C2 (Tier 2 — depends on ADR-0007
ratification 2026-05-03). The 2026-05-02 Document Platform reframe
(`docs/09_briefs/phase-2/document_platform_reframe_design.md`)
established the architectural pivot from "AP Ingestion Initiative"
to "Document Platform Initiative + Spend Initiative." This ADR is
the spine of that reframe — the load-bearing dependency root for
the seven downstream Phase 0 ADRs (ADR-0012 through ADR-0019)
that fill in storage, pipeline, bundle, relationship, domain,
template, router, and confidence specifics.

## Context

### Why a Document Platform substrate exists

The original AP Ingestion Initiative brief (CTO-reviewed 2026-05-01,
T2/T3-amended 2026-05-02) locked v1 to AP bills only. Subsequent
CTO discussion surfaced that receipts, retainers, deposits, vendor
statements, credit memos, bank/card transactions, and AR invoices
do not fit the AP bill lifecycle — regardless of volume — because
each has a different accounting destination. Forcing them into the
`post_bill` shape produces wrong accounting. The reframe spec §1
landed on the architectural framing: **AP is not the foundation.
The Document Platform is the foundation. AP/Spend is the first
domain consumer.**

This ADR codifies the Document Platform's substrate contract: the
entities the platform owns, the boundaries between platform and
domain, the read-only handoff vocabulary (`ProposedMutation`,
`ProposedMutationBundle`, `ProposedAttachment`), the immutability
discipline that preserves replayability, the multi-entity
reservations, the document-type discriminator, the exception-queue
first-class deliverable, the `DOC` invariant prefix, and the
Domain Boundary Map (Spend vs Banking ownership of bank/card
transactions).

The spine is intentionally narrow on implementation specifics —
seven downstream ADRs (ADR-0012 ProposedMutationBundle, ADR-0013
Storage Provider, ADR-0014 Tier 2 Document Pipeline, ADR-0015
AP/Spend Subdomain, ADR-0016 Document Relationship Graph,
ADR-0017 Vendor Template substrate, ADR-0018 Relationship Router,
ADR-0019 Confidence Calibration Policy) inherit the spine's
definitions and forward-point back to this ADR for the contract.
Density beats length: every spine item that downstream ADRs need
to cite is here, in full enough form that they can cite without
round-tripping.

### Reading B preservation as load-bearing constraint

The reframe spec §5 named **Reading B** as the canonical service
architecture: domain services own domain logic; the ledger service
is the sole writer of `journal_entries` and `journal_lines`; both
run inside `withInvariants()` per Service Communication Rule 1
(`docs/02_specs/ledger_truth_model.md`). The Document Platform is
not a domain service in the Reading B sense — it does not produce
ledger operations. It produces *proposals*. Domain services
consume those proposals, decide whether to commit, and route the
commit through the ledger service.

This separation is non-negotiable for every downstream ADR.
ADR-0012, ADR-0014, ADR-0015, and ADR-0018 each inherit the rule
from this ADR. A future contributor who proposes a Document
Platform path that calls `ledgerService.post(...)` directly is
proposing a violation of Reading B; the rule lives here so the
violation is visible.

### Phase 0 dependency context

ADR-0007 (Three-Tier Agent Architecture) ratified 2026-05-03 and
introduced Tier 2.5 to accommodate the Relationship Router's
read-against-committed-state pattern. ADR-0007 also clarified the
three-category vendor-master read boundary that this ADR's
vendor-matcher specification inherits verbatim. ADR-0010 (Reserved
Enum States) established the discipline applied to every closed
enum this ADR introduces or names. Without these prerequisites,
the spine specification below would not be coherent.

## Decision

The Document Platform is a substrate that ingests source
documents, produces document artifacts, classifies and matches
them against existing accounting state, and hands proposals to
domain services. It does not commit accounting state; it does not
write to `journal_entries` or `journal_lines`; it does not own
domain lifecycles (bill, payment, prepayment, credit). Those are
domain services' responsibility, with the ledger service as the
sole journal-entry writer per Reading B.

The Decision is presented as a sequence of spine items, each of
which is the contract that one or more downstream ADRs cite.

### 1. Entity ownership boundary

**Document Platform owns these entity types** (substrate):

- `source_documents` — the file bytes + metadata as ingested.
- `source_document_versions` — version history when content_hash
  drift requires a new captured version.
- `source_document_links` — the polymorphic many-to-many between
  source documents and accounting entities (full schema in §4
  below; the (entity_type, role) pair-validity matrix is owned by
  ADR-0016).
- `document_cases` — the workflow-item entity created from one or
  more source documents. One file may produce zero, one, or many
  cases. Distinct from `source_documents` and from
  `proposed_mutations`.
- `document_case_sources` — the many-source-to-one-case table per
  spec §3.1 (full schema in §3 below).
- `document_artifacts` — the engine-agnostic OCR/extraction output
  (pages, lines, words, bounding boxes, confidence, quality
  flags, pipeline trace).
- `document_relationship_candidates` — the Relationship Router's
  match candidates (versioned per §9 below; full router behavior
  owned by ADR-0018).
- `ingest_batches` and `ingest_items` — the ingestion-channel
  abstraction (drag-drop PDF, forwarded mailbox, future channels).
- `document_jobs` — the work-queue rows that drive extraction and
  classification.

**Domain services own these entity types** (consumers):

- `bills`, `bill_lines`, `payments`, `bill_payment_allocations` —
  AP/Spend per ADR-0015.
- `vendor_prepayments`, `vendor_prepayment_applications` —
  AP/Spend per ADR-0015.
- `vendor_credits`, `vendor_credit_applications` — AP/Spend per
  ADR-0015.
- `vendors` (vendor master) — AP/Spend per ADR-0015.
- `bank_transactions`, `card_transactions` — Banking domain
  (post-v1) per the Domain Boundary Map (§14 below). v1 has no
  Banking domain; bank/card statements route to the exception
  queue.

**Ledger service owns**: `journal_entries`, `journal_lines`,
`audit_log` (writer of record per INV-AUDIT-001). No Document
Platform path writes to these tables. No domain service writes
directly either; domain services route through the ledger service
per Reading B.

### 2. `source_documents` schema and contract

The `source_documents` table is the substrate's evidence anchor.
Every uploaded file produces exactly one row. Required fields:

- `id` (uuid primary key)
- `org_id` (uuid, foreign key, RLS-scoped)
- `legal_entity_id` (uuid, nullable, reserved per §10) — the
  legal entity the document is addressed to. Defaults to `org_id`
  in v1 where the org-entity mapping is 1-1.
- `storage_provider` (enum) — discriminator naming which storage
  provider holds the bytes. Active v1 value: `supabase_storage`.
  Reserved values per ADR-0013: `sharepoint_drive`,
  `s3_bucket`, `external_url`. Full provider abstraction
  (drift-detection cadence, queue-and-retry parameters,
  controller-override path, integrity-check policy) is owned by
  ADR-0013; this ADR specifies only that the discriminator exists
  and follows ADR-0010's reserved-enum-states discipline.
- `storage_key` (text) — the provider-scoped path or identifier.
- `content_hash` (text) — SHA-256 of file bytes at ingestion. The
  drift-detection mechanism (cadence, scope) is owned by
  ADR-0013; the Platform contract is that `content_hash` is
  populated at ingestion and never mutated thereafter.
- `byte_size` (bigint), `mime_type` (text), `original_filename`
  (text).
- `ingest_channel` (enum) — `drag_drop_pdf`, `forwarded_mailbox`,
  `direct_upload`, `api_ingest`. Reserved per ADR-0010 discipline.
- `ingest_batch_id` (uuid, nullable) — references `ingest_batches`
  when the document arrived as part of a batch.
- `received_at` (timestamptz), `created_at` (timestamptz).
- `created_by` (text or uuid) — `'agent' | <user_id>`.

**Versioning.** When the same logical document is re-uploaded with
different bytes (a vendor sends a corrected invoice), the platform
captures a new `source_document_versions` row with
`(source_document_id, version_number, content_hash, captured_at)`.
The `source_documents.content_hash` always reflects the latest
captured version; prior versions are immutable per §9 below.

**Drift detection.** When the storage provider's underlying file
changes outside the platform's write path (a SharePoint folder's
file is replaced manually), the platform's drift-detection
schedule (owned by ADR-0013) recomputes `content_hash` and either
captures a new version or flags an integrity exception. The
contract surface here is that drift produces either a new version
row or an exception-queue entry; the cadence and queue-and-retry
parameters belong to ADR-0013.

**Integrity contract.** A `source_document` row's
`content_hash`, `byte_size`, and `original_filename` are
write-once at ingestion. Content updates produce a new version,
not an in-place mutation. This rule is the precondition for
INV-DOC-001 evidence-completeness (§15 below) and for replayability
(§9 below).

### 3. `document_cases` and `document_case_sources`

A `document_case` is a workflow item. The platform creates a case
when a `source_document` warrants action — extraction,
classification, matching, proposal, or exception routing. One file
produces zero (the file is filtered out — duplicate hash,
non-document mime type), one (the common case), or many
(multi-page PDF that contains an invoice + a delivery note +
a remittance advice — three cases from one file).

A case may also draw from multiple source documents. The
many-source-to-one-case modeling is the
`document_case_sources(document_case_id, source_document_id, role)`
table. The `role` column is a closed enum per ADR-0010 reserved-
enum-states discipline:

- `primary` — the dominant evidence document for the case
  (the invoice PDF in an email-and-invoice case).
- `supporting` — secondary evidence (the email body, a delivery
  note, a contract excerpt).
- `email_body` — the rendered text or HTML of the forwarding
  email when the case originates from a forwarded mailbox.
- `payment_evidence` — receipt or transaction confirmation
  attached as proof of payment for the case's primary document.
- `superseded_source` — a prior version of one of the case's
  documents, kept linked for audit trail.
- `related_prior_document` — an earlier related document (the
  retainer agreement linked to a final invoice case; the
  original bill linked to a credit memo case).

The closed v1 active subset is `primary | supporting |
email_body | payment_evidence`; the remaining values are reserved
per ADR-0010 (defined in the enum, not yet emitted by any v1
write path; v1 cases that would use them route to the exception
queue with manual case-source bundling).

**Lifecycle states for `document_cases`.** The state machine per
spec §13 Q54: `received → extracting → classified → matched →
proposed → needs_review → approved → committed → rejected →
archived`. Transitions:

- `received → extracting`: automation only (driven by the
  document-job worker).
- `extracting → classified`: automation only.
- `classified → matched`: automation only (Relationship Router
  per ADR-0018).
- `classified → needs_review` or `matched → needs_review`:
  automation (low classifier confidence; ambiguous match;
  unrecognized type).
- `matched → proposed`: automation; produces a `ProposedMutation`,
  `ProposedMutationBundle`, or `ProposedAttachment`.
- `proposed → approved`: human only (Tier 1 commit-time
  confirmation per ADR-0007).
- `approved → committed`: automation (ledger commit succeeds).
- `proposed → rejected` or `needs_review → rejected`: human only.
- `needs_review → matched` or `needs_review → proposed`: human
  only (resolution from the exception queue).
- `committed → archived`: automation on a delayed cadence.
- `rejected → archived`: automation on a delayed cadence.
- `committed` is **not** reversible at the case level — case-level
  reversibility is a misframe; reversal lives at the journal-entry
  level per ADR-0001 and is initiated against the
  `source_document_links` row, not the case state. A `committed`
  case whose underlying `journal_entries` are reversed produces
  a `source_document_links.link_status = 'reversed'` row;
  the case state itself does not roll back.

The state-machine guards are service-layer-enforced (Layer 2)
since the transitions encode workflow-actor authority that
schema CHECKs cannot express. The schema reserves all states per
ADR-0010 discipline; service guards reject illegal transitions
with typed `ServiceError` codes.

### 4. Polymorphic `source_document_links` discipline

This ADR establishes the discipline at the spine level; the full
membership of `linked_entity_type`, the full membership of
`link_role`, and the (entity_type, role) pair-validity matrix
are owned by ADR-0016 (Document Relationship Graph).

**The three discipline constraints, verbatim from spec §6:**

1. **Closed enum on `linked_entity_type`.** ADR-0016 enumerates
   the full closed set; ADR-0010 reserved-enum-states discipline
   applies. v1 active subset is small (bill, payment,
   bill_payment_allocation, vendor_prepayment,
   vendor_prepayment_application, vendor_credit); the full set is
   reserved at initial shipping.
2. **Closed enum on `link_role`.** ADR-0016 enumerates the full
   closed set under the same ADR-0010 discipline. v1 active
   subset is narrow (probably `primary_invoice`,
   `payment_evidence`, `receipt`, `supporting`); the rest are
   reserved.
3. **Service-layer integrity validation.** SQL-level polymorphic
   foreign keys are not enforced by Postgres (the `linked_entity_id`
   column references one of N tables depending on
   `linked_entity_type`). The integrity check lives at the
   service-layer write path: `documentLinkService.create()` validates
   that the named entity exists in the named table before inserting
   the link row. The check is mandatory per Service Communication
   Rule 1 (Zod boundary validation) and Rule 4 (no free-form data
   at the boundary).

**Cascade behavior on linked-entity deletion or reversal.** Most
"deletes" in this system are reversals (per ADR-0001). When a
linked accounting entity is reversed:

- The link row's `link_status` flips to `'reversed'` rather than
  being cascade-deleted.
- The document evidence remains valid — a reversed bill still
  has its invoice attached for audit purposes.
- Post-reversal, the case may re-route (the reversal triggers a
  Relationship Router re-evaluation per ADR-0018; the original
  link is preserved in `superseded_source` form for audit).

When a `source_document` is genuinely deleted (rare; for example,
a duplicate-hash file that was incorrectly attached and the
controller chooses to expunge), the link rows are
cascade-deleted, but the operation requires controller authority
and produces an `audit_log` entry with explicit deletion reason.
The ADR-0016 ADR specifies the per-`linked_entity_type` cascade
matrix in full.

### 5. `document_artifacts` engine-agnostic contract

The `document_artifacts` table is the load-bearing interface that
decouples OCR engine choice from downstream consumers. Every
extraction produces one or more artifact rows; each row carries:

- `id` (uuid), `source_document_id` (uuid, FK).
- `ocr_run_id` (uuid, FK to `ocr_runs`) — the immutable OCR run
  that produced this artifact (per §9).
- `extraction_run_id` (uuid, FK to `extraction_runs`) — the
  immutable TS-extraction run that consumed the OCR run.
- `engine` (text) — for example, `paddleocr`, `tesseract`,
  `claude_vision_3_5`. The OCR engine choice for v1 is owned by
  ADR-0014; this ADR specifies that the engine is captured per
  artifact for audit and replay.
- `engine_version` (text) — model and engine version for replay.
- `pages` (jsonb) — page-level structured output (page number,
  rotation, dimensions, page-level confidence).
- `lines` (jsonb) — line-level output (text, bounding box,
  per-line confidence).
- `words` (jsonb) — word-level output (token text, bounding box,
  per-word confidence).
- `quality_flags` (text[]) — engine-emitted quality signals
  (`low_resolution`, `skewed`, `partial_page`, `noise_threshold`).
- `pipeline_trace` (jsonb) — per-stage record array per ADR-0007's
  Q30 resolution (each stage carries `stage_name`, `input_hash`,
  `output_hash`, `model`, `timestamp`).
- `confidence` (numeric) — overall artifact-level confidence; the
  routing threshold for exception vs proposal is owned by ADR-0019.
- `created_at` (timestamptz).

The contract: every consumer of OCR output (classifier, field
extractor, table extractor, validator) reads
`document_artifacts`, not raw engine output. The engine is a
swap-target behind this contract per ADR-0014.

### 6. Document-type discriminator

The platform classifies each case with a document-type
discriminator. The full reserved set per ADR-0010 discipline:
`vendor_invoice`, `receipt`, `payment_confirmation`, `credit_memo`,
`vendor_statement`, `purchase_order`, `receiving_document`,
`retainer_request`, `deposit_request`, `bank_statement`,
`card_statement`, `customer_invoice`, `customer_remittance`,
`tax_form`, `contract`, `payroll_document`, `asset_purchase_support`,
`unknown`.

**v1 active set:** `vendor_invoice`, `receipt`,
`payment_confirmation`, `unknown`. All other values are reserved
per ADR-0010 — defined in the enum, not emitted by any v1
classifier path. Documents that the v1 classifier identifies as
one of the reserved types (vendor statement, credit memo, bank
statement, etc.) route to the exception queue with manual
resolution per §13 below.

The classification confidence threshold for routing-to-exception
vs routing-to-proposal is governed by ADR-0019 (per Q57, Q65).
The platform contract is that every case carries a
`document_type` field and a `classification_confidence` field;
the routing logic that consumes those values is ADR-0019's.

### 7. ProposedMutation / ProposedMutationBundle / ProposedAttachment handoff

The Document Platform produces three kinds of proposal objects.
All three flow through the same proposal queue and use the same
Four Questions grammar (`intent_model.md` §5). They differ in
commit-path semantics.

**`ProposedMutation`.** The canonical mutation object from
`intent_model.md` §3. Maps to one ledger-touching change. Commits
through a domain service that produces ledger operations via
`ledgerService.post(...)` per Reading B. Examples:
`record_bill_payment`, `post_vendor_credit`,
`apply_vendor_prepayment_to_bill`. The shape is unchanged from
`intent_model.md`; this ADR does not modify the `ProposedMutation`
contract.

**`ProposedMutationBundle`.** A composite proposal that carries
multiple `ProposedMutation` children which must commit
all-or-nothing. The first concrete consumer is the born-paid bill
bundle (`post_bill + record_bill_payment`) per ADR-0015. The
DB-transaction-atomic enforcement and Logic Receipt shape for
compound mutations are owned by ADR-0012 (which absorbed the
Bundle Atomicity decision per spec §7); this ADR specifies only
the handoff vocabulary.

The Document Platform's role: produce a `ProposedMutationBundle`
when the matched relationship requires it (born-paid bundle,
final-invoice-with-applied-deposit bundle); hand it off to the
domain service whose `withInvariants()` call enforces atomicity.

**`ProposedAttachment`.** The sibling concept introduced by spec
§14 for proposals that produce no ledger operation. A
`ProposedAttachment` flows through the same proposal queue as a
`ProposedMutation` and renders the same Four Questions, but
**commits via `documentLinkService.create()` and produces no
journal entry, no ledger operation, no `audit_log` entry on
accounting state**. It still writes an `audit_log` entry on the
document layer — the link-creation mutation itself is auditable
under an attachment-link action type (`attachment_link_created`).

The Four Questions adapt for `ProposedAttachment`:

- **What changed?** Renders the link delta — which document, which
  entity, which `link_role`. No debit/credit table; no balance
  shift.
- **Why?** Renders the rule that proposed the attachment (or
  "novel pattern — no rule") per the same `justification.rule_id`
  shape.
- **Track record?** Same template as `ProposedMutation`.
- **What if I reject?** "The document will not be linked. You can
  edit and resubmit, or discard."

**Variants that ship as `ProposedAttachment` per spec §14**:

- `attach_payment_evidence` — Scenario A: receipt is supporting
  evidence for a payment that is already recorded.
- `attach_invoice_to_existing_bill` — invoice arrives after a
  manual bill was created without evidence.
- `attach_supporting_document_to_bill` — secondary documents
  (correspondence, contracts, delivery notes).
- `attach_statement_to_vendor_reconciliation` — vendor statement
  in reconciliation flow.
- `attach_retainer_agreement_to_prepayment` — retainer agreement
  evidence for an existing `vendor_prepayment` row.

**v1 approval policy for `ProposedAttachment`.** Always Confirm,
**except** the user-initiated direct-upload variant. Per the
round-2 external review, a user dragging a file into a specific
bill's attach slot is implicitly approving the attachment by the
upload action itself; the system does not produce a separate
confirmation gate for the same file the user just uploaded
deliberately. All other variants — agent-routed attachments,
forwarded-mailbox attachments, classifier-routed attachments —
flow through the Always Confirm rung.

The mapping to `intent_model.md` Primitive 1 (per spec §20):
`ProposedAttachment` is also Primitive 1 (Proposal) with a
non-mutating composite payload. No new primitive is needed.

### 8. Reading B preservation (three-layer separation)

The Document Platform proposes; domain services produce ledger
operations; the ledger service is the only writer of journal
entries. This is the canonical Reading B from
`docs/02_specs/ledger_truth_model.md` Service Communication
Rules. Stated as three preserved invariants:

1. **The Document Platform never writes to `journal_entries` or
   `journal_lines`.** The platform's write path produces rows
   in `source_documents`, `source_document_versions`,
   `source_document_links`, `document_cases`,
   `document_case_sources`, `document_artifacts`,
   `document_relationship_candidates`, `ingest_batches`,
   `ingest_items`, `document_jobs` only.
2. **Domain services are the only callers of `ledgerService.post(...)`.**
   When a `ProposedMutation` commits, the domain service
   (`billService`, `paymentService`, `vendorPrepaymentService`,
   `vendorCreditService`) computes the ledger-entry shape, calls
   `ledgerService.post(journalEntryShape)` inside its
   `withInvariants()` transaction, and the ledger service is the
   only caller that inserts into `journal_entries` /
   `journal_lines`.
3. **Both domain and ledger services run inside `withInvariants()`
   per Service Communication Rule 1.** The domain service's
   invariants govern domain logic (bill state transitions,
   prepayment application math, born-paid bundle atomicity); the
   ledger service's invariants govern ledger truth (balanced
   entries, period validity, account validity, currency
   conversion, money-arithmetic invariants — INV-LEDGER-001
   through INV-LEDGER-006).

Every downstream ADR (ADR-0012, ADR-0014, ADR-0015, ADR-0018)
inherits this rule. A future contributor who proposes a Document
Platform service that calls `ledgerService.post(...)` directly
is proposing a Reading B violation.

### 9. Document lifecycle immutability rules

Replayability is a load-bearing capability of the Document
Platform: re-running extraction when the OCR engine improves,
re-running the Relationship Router when new domain state lands,
must produce new rows that supersede prior rows rather than
mutating prior rows. The four rules from spec §16, verbatim:

1. **`ocr_runs` (extraction artifact rows) are immutable.** A
   re-extraction produces a new `ocr_runs` row that supersedes
   the prior one via `supersedes_ocr_run_id`. The prior row is
   never updated or deleted.

2. **`extraction_runs` (TS extraction result rows) are immutable
   per `(source_document_id, ocr_run_id, extraction_version)`
   tuple.** Re-running TS extraction against a new `ocr_runs`
   row produces a new `extraction_runs` row.

3. **`document_relationship_candidates` are versioned.** When the
   Relationship Router re-runs (per ADR-0018), it produces a new
   candidate row that references the prior via
   `supersedes_candidate_id`. The prior row is preserved.

4. **`document_case.current_relationship_candidate_id` may
   change before commit.** Pre-commit, the case can re-route as
   the Router learns more (a new bill posts that matches an
   unmatched receipt). **Post-commit, committed
   `source_document_links` rows require reversal or supersession
   to change** — the link row itself is updated only via a
   structured supersession that preserves the prior row's
   `link_status`.

These rules apply at the schema layer (immutable tables,
supersession columns, no UPDATE permission on immutable rows for
service-role clients) and at the service layer (no UPDATE
statements against immutable rows; only INSERT-of-successor or
soft-delete-via-`status`-flip). Q69 (operational policy on when
replays auto-supersede vs require explicit promotion) is owned by
ADR-0014; the immutability boundary itself is platform-substrate
and lives here.

### 10. Multi-entity reservations (post-v1 enablement)

Multi-entity setups (family-office, multi-subsidiary) are post-v1.
Adding entity reservations now is cheap; retrofitting is
expensive. Per spec §17, the platform reserves the following
nullable columns at v1 schema time:

- `source_documents.legal_entity_id` (uuid, nullable, reserved).
  The legal entity the document is addressed to. May differ from
  `org_id` in multi-entity setups. Defaults to `org_id` in v1.
- `bills.legal_entity_id` (nullable, reserved). The legal entity
  that owns the AP bill. Owned by ADR-0015's schema; named here
  for cross-reference because the document-to-bill link must
  preserve the entity association.
- `bill_lines.benefiting_entity_id` (nullable, reserved).
  Allocation-level entity. Owned by ADR-0015's schema.
- `payments.paying_entity_id` and
  `payments.benefiting_entity_id` (nullable, reserved). Owned by
  ADR-0015's schema.

The platform also reserves the **`wrong_entity_exception` value**
in the exception-routing enum (per §13 below). A document
addressed to a legal entity not currently configured in the org
routes to controller review with manual override available.

Intercompany due-to / due-from postings are post-v1 and out of
scope for this ADR. The reservations let the platform absorb
multi-entity workflows without retrofit when the post-v1 phase
lands.

### 11. Vendor-matcher read boundary (cite from ADR-0007)

The Document Platform's vendor matcher runs as a Tier 2 stage per
ADR-0007. ADR-0007 establishes a three-category split for vendor
master reads, and the Document Platform inherits that split
verbatim. Quoted into this ADR so a downstream ADR-0014 reader
can find the rule without round-tripping:

> Tier 2 MAY read **reference / master data**: vendor
> identity-and-matching fields (name, aliases, tax ID,
> email/domain, address, default account mapping, historical
> template association), chart of accounts, tax codes,
> classes / projects / departments. These are the lookups
> vendor matching and account suggestion need; they are
> reference, not state.
>
> Tier 2 MUST NOT read **transactional committed state**: bills,
> payments, prepayments, credits, open balances, period status,
> reconciliation candidates — those reads require Tier 2.5.
>
> Tier 2 also MUST NOT read **vendor control / payment-risk
> fields** (bank account, payment instructions,
> bank-detail-confirmed flag, payment hold status,
> blocked-vendor status) — those are Tier 2.5 territory because
> they are payment-readiness state, and any extractor that reads
> them risks overstepping into payment-risk logic.
>
> Tier 1 re-verifies all vendor-control fields at commit.

This is the bank-detail fraud control surface. The vendor matcher
in ADR-0014's Tier 2 pipeline reads vendor identity-and-matching
fields ONLY — never bank account, payment instructions, or the
bank-detail-confirmed flag. The Relationship Router (ADR-0018) at
Tier 2.5 may read those fields when producing
payment-readiness candidates. Tier 1 re-verifies at commit per
the expanded Q28 matrix. The hard rule from
`docs/02_specs/agent_autonomy_model.md` §6 Item 2 stands: vendor
bank-detail changes are Always Confirm / System ceiling regardless
of rung, limit, or rule maturity.

### 12. Q28 expansion forward-pointer

ADR-0007's Amendment section names four re-verification surfaces
(document-type-aware fields, relationship-claim, stale-state
TOCTOU, bundle re-verification). The detailed per-field matrix
lives in `docs/02_specs/agent_architecture_policy.md` (Phase 0
governance plan Task E2 drafts the initial matrix). This ADR does
**not** duplicate the matrix. Downstream ADRs that need the
per-document-type re-verification rows cite
`agent_architecture_policy.md` as the authoritative location.

The contract this ADR carries: every document type the platform
supports has a corresponding row in the Q28 matrix at v1 ship
time (per Q77, which gates v1 ship, not Phase 1 start). New
document types added post-v1 carry an obligation to extend the
matrix in the same brief that promotes the type from reserved to
active.

### 13. Exception queue as first-class deliverable

Under this reframe, v1 routes credit memos, vendor statements,
deposit requests, retainer requests, bank statements, card
statements, customer invoices, employee reimbursements, POs,
receiving documents, tax forms, and unknown documents to the
exception queue. The exception queue is the bulk of v1's
user-visible work — the founder + 2 real users will spend most
of their time there, not on the happy path. The queue therefore
ships as a first-class workflow tool, not as a deferral
mechanism.

**First-class deliverable requirements per spec §10:**

- **Document-type-aware actions.** A credit memo in the queue
  lets the user record the credit manually (record vendor credit
  via the AP/Spend domain service); a vendor statement lets the
  user open a reconciliation view; a bank statement routes to a
  manual-classification flow that does not pretend automation
  exists yet.
- **Reclassification workflows.** A document misclassified as
  exception is easily moved to the right type. The classification
  is editable, not a permanent label.
- **Bulk operations.** Filter by document type, vendor, date
  range; bulk-approve, bulk-route, bulk-reclassify.
- **First-class screenshot-gate coverage.** The exception queue
  UI ships with the screenshot-gate ratification per CLAUDE.md.

**Resolution-action enum (Q68 closed by this ADR — see Closes
below).** The full closed enum per ADR-0010 reserved-enum-states
discipline:

`create_bill`, `attach_to_existing_bill`,
`attach_to_existing_payment`, `record_bill_payment`,
`create_vendor_prepayment`, `apply_vendor_prepayment`,
`create_vendor_credit`, `apply_vendor_credit`, `mark_duplicate`,
`mark_non_accounting`, `request_missing_document`,
`route_to_manual_entry`, `route_to_bank_reconciliation`,
`route_to_AR_future`, `reprocess`, `archive`.

**v1 active subset (narrow):** `attach_to_existing_bill`,
`attach_to_existing_payment`, `record_bill_payment`,
`mark_duplicate`, `mark_non_accounting`, `route_to_manual_entry`,
`reprocess`, `archive`. The remaining values are reserved per
ADR-0010 — defined in the enum, not emitted by any v1 service
write path. v1 manual workflows that conceptually correspond to
reserved values (record vendor credit, create vendor prepayment,
apply vendor credit) are accessible from the queue UI but route
the user to the AP/Spend domain service's manual entry form
rather than emitting a queue-resolution row with the reserved
action; the row is not closed via the resolution enum until the
domain service completes the underlying mutation.

The exception queue lives in the Document Platform brief (it's
substrate). The domain-specific manual workflows it triggers
(record vendor credit, open vendor statement reconciliation, file
employee reimbursement) live in the Spend Initiative brief or
future domain briefs.

### 14. Domain Boundary Map subsection (Q67 closed by this ADR)

This ADR absorbed the Domain Boundary Map per spec §7. The
question Q67 asks: which domain owns `bank_transactions` and
`card_transactions`? The answer:

**v1 cut.** Banking is **not a v1 domain**. v1 has no Banking
service, no `bank_transactions` table writer, no
`card_transactions` table writer. v1 ingests bank/card statements
via the Document Platform's drag-drop / forwarded-mailbox
ingestion path; the platform classifies them as `bank_statement`
or `card_statement` (reserved document types — see §6); the
classifier routes them to the **exception queue** with no
automated proposal generation.

**Spend (v1) owns**: outgoing payments (`payments` table) per
ADR-0015. Spend writes `payments.payment_method` (`cash`,
`cheque`, `eft`, `wire`, `credit_card`, `ach`, `other`) but does
not write `bank_transactions` or `card_transactions` rows. The
discriminator question — "did this wire become a
bank_transactions row?" — is post-v1 because there are no
bank_transactions rows in v1.

**Banking (post-v1) will own**: `bank_transactions`,
`card_transactions`, the bank/card statement reconciliation
workflow, the matching of payments-emitted-by-Spend to
bank-transactions-emitted-by-Banking. The Banking ADR is **not**
in the Phase 0 ADR set; it drafts when the Banking domain phase
is scoped post-v1.

**Cross-domain protocol (v1 → post-v1).** v1 born-paid bundles
preserve enough metadata on the resulting `payments` row to
support post-v1 bank/card reconciliation without backfill, per
spec §15: `payment_method`, last-4 of card or bank account
identifier, merchant identifier, authorization / reference
number, transaction-as-it-would-appear-on-statement date. This
preservation requirement is encoded in ADR-0015's `payments`
schema; the boundary contract is named here so a future Banking
ADR can rely on it without round-tripping.

The Domain Boundary Map answers Q67 definitively: v1 routes
bank/card statements through the exception queue; v1 emits
`payments` rows with reconciliation-metadata preservation;
post-v1 Banking domain owns `bank_transactions` /
`card_transactions` and consumes the preserved metadata for
matching. ADR-0015 inherits the metadata-preservation
requirement; this ADR establishes the cut.

### 15. DOC invariant prefix introduction

This ADR introduces the **`DOC`** prefix for Document Platform
invariants. The prefix follows the same spec-without-enforcement
discipline as the `AP` prefix (spec §3.2 invariant disposition).
The first reserved candidate is **INV-DOC-001 — evidence-
completeness**.

**INV-DOC-001 (reserved candidate).** Every committed bill /
case has at least one `source_document_links` row with a
`primary_invoice` (or `primary`) `link_role`, unless a controller
override is recorded. The candidate's exact shape (per-bill vs
per-case) and the override mechanism are filed as Q-new (per spec
§13, deferred for downstream ADR scoping).

**Layer:** Layer 2 (service-layer enforcement). The
`billService.post()` and adjacent commit paths refuse to commit
bills without an attached primary document, except when the
`override_evidence_completeness` controller flag is set on the
bill row. The override mechanism is owned by ADR-0015.

**Registration.** This ADR specifies the prefix name and the
first candidate. Actual registration in
`docs/02_specs/invariants.md` happens at Phase 0 governance plan
Task E1 (after this ADR ratifies). The schema-level seats — for
example, the controller-override flag — ship at the AP/Spend
Subdomain ADR's first migration; the Layer 2 enforcement lands
when the AP foundation phase ships.

The `DOC` prefix is reserved for substrate-layer invariants. AP
domain rules continue to use the `AP` prefix (INV-AP-001
allocation sums, INV-AP-002 state transitions, both owned by
ADR-0015). Bank/card domain rules will use a future `BANK`
prefix when the Banking domain phase scopes.

## Consequences

### What this enables

- **Receipts, retainers, deposits, statements, and credits arrive
  on a substrate that can absorb them.** The accounting
  destination for each document type is determined by the domain
  service that consumes the platform's proposal; the platform
  itself does not predispose to AP-bill-shaped outcomes.
- **Replayability is structurally preserved.** When the OCR
  engine improves or the Relationship Router gains a new match
  pattern, prior decisions are not silently mutated — new rows
  supersede prior rows, prior rows remain queryable, audit trails
  reconstruct correctly.
- **Multi-entity is reachable without retrofit.** The
  `legal_entity_id` reservations on `source_documents` and the
  `wrong_entity_exception` reservation in the exception-routing
  enum let multi-entity orgs land as schema-already-ready when
  the post-v1 phase scopes them.
- **The exception queue absorbs the v1 reality** that ~12 of the
  18 reserved document types route through it. The queue ships
  as a first-class workflow tool with bulk operations,
  reclassification, document-type-aware actions, and
  screenshot-gate coverage — not as a deferral mechanism.
- **The Domain Boundary Map closes Q67 cleanly.** Banking is
  post-v1; v1 has explicit cross-domain metadata preservation so
  the post-v1 Banking domain inherits a reconciliation-ready
  payments table.
- **Reading B is preserved at the substrate layer.** Domain
  services own ledger operations; the ledger service is the sole
  writer of journal entries; the platform proposes only.
  Downstream ADRs cite this ADR for the rule rather than each
  re-deriving it.

### What this constrains

- **Every future feature that routes a new document type or
  introduces a new linked entity type must update the spine.**
  Adding a new `linked_entity_type` value, a new `link_role`
  value, or a new `(linked_entity_type, link_role)` valid pair
  requires an ADR-0016 amendment; adding a new document type
  requires the Q28 matrix to extend per the ADR-0007 obligation;
  adding a new exception resolution-action requires this ADR's
  enum to extend.
- **No Document Platform path may write to `journal_entries` or
  `journal_lines`.** Future contributors who propose direct
  ledger writes from the platform are proposing a Reading B
  violation. The rule is mechanical for the platform's own write
  paths (the platform does not own the ledger tables); the
  enforcement lives in code review and in service-layer
  composition discipline.
- **The exception queue cannot ship as a stub.** v1 ships the
  queue with the eight active resolution actions, bulk
  operations, reclassification, document-type-aware actions, and
  screenshot-gate coverage. Shipping an MVP queue with one
  resolution action ("mark resolved") would violate the
  first-class deliverable contract.
- **Replayability discipline is unbreakable.** No post-v1 phase
  may ship in-place updates to `ocr_runs`, `extraction_runs`, or
  committed `source_document_links`. Re-extraction produces new
  rows; re-evaluation produces new candidates; reversals produce
  link-status flips with audit-traceable supersession.
- **The vendor-matcher read boundary is mechanical, not
  conventional.** A Tier 2 stage that imports the
  `bank_account_number` field from `vendors` violates ADR-0007
  Tier 2's MUST NOT clause and is caught by the Tier 2 ESLint
  rule (per ADR-0007 Q29 resolution).

### What this costs

- **Schema scope.** Eight platform-owned tables ship at v1
  (source_documents, source_document_versions,
  source_document_links, document_cases, document_case_sources,
  document_artifacts, document_relationship_candidates,
  ingest_batches, ingest_items, document_jobs, plus the immutable
  ocr_runs and extraction_runs). Each carries reserved enum
  columns and reservation discipline per ADR-0010. Phase 1
  Storage / Evidence Core ships the first slice; Phase 2
  Document Core skeleton ships the case + artifact tables;
  Phase 3 Document Relationship Graph ships the link table;
  Phase 4 Relationship Router consumes the candidate table.
- **Migration discipline at the boundary.** The platform's tables
  must ship with all reserved enum values populated at v1 to avoid
  ALTER TYPE migrations at every domain phase. ADR-0010's
  reserved-enum-states discipline is mandatory for every closed
  enum in this ADR's surface.
- **Cross-domain test surface.** The Domain Boundary Map promises
  reconciliation-metadata preservation on `payments` for a
  post-v1 Banking domain; v1 must ship integration tests that
  verify the metadata-preservation contract on every born-paid
  bundle commit, even though no v1 consumer reads the metadata.
- **`DOC` prefix maintenance.** The new invariant prefix joins
  the registered set in `docs/02_specs/invariants.md` at
  ratification; future invariant additions at the substrate
  layer must use this prefix (not `AP`, not `BANK`, not
  domain-specific prefixes).

## Closes

This ADR closes the following Document-Platform-scope questions
from `docs/02_specs/open_questions.md`:

- **Q53 — Document-type enum: which types are active in v1, which
  are reserved.** Closed per §6 above. v1 active set:
  `vendor_invoice`, `receipt`, `payment_confirmation`, `unknown`.
  Reserved set: the remaining 14 values per spec §3.1. Per-type
  classifier confidence thresholds are owned by ADR-0019 (per Q57,
  Q65) — a downstream concern, not closed here.

- **Q54 — Document case lifecycle states: which transitions are
  guarded.** Closed per §3 above. State set: `received,
  extracting, classified, matched, proposed, needs_review,
  approved, committed, rejected, archived`. Service-layer-enforced
  transition rules per the §3 table (automation-only,
  human-only, automation-or-human per row). All states reserved
  per ADR-0010; service guards reject illegal transitions with
  typed `ServiceError` codes.

- **Q67 — Domain ownership: `bank_transactions` and
  `card_transactions`.** Closed per §14 (Domain Boundary Map).
  Banking is post-v1. v1 routes bank/card statements through the
  exception queue. Spend (v1) owns outgoing `payments` with
  reconciliation-metadata preservation; Banking (post-v1) will
  own `bank_transactions` / `card_transactions` and the
  reconciliation workflow.

- **Q68 — Exception queue UX and resolution-action enum.** Closed
  per §13 above. Full enum membership specified; v1 active subset
  narrow (`attach_to_existing_bill`, `attach_to_existing_payment`,
  `record_bill_payment`, `mark_duplicate`, `mark_non_accounting`,
  `route_to_manual_entry`, `reprocess`, `archive`); the remaining
  eight values reserved per ADR-0010. Bulk operations,
  reclassification, document-type-aware actions, screenshot-gate
  coverage are first-class deliverable requirements per §13.

  *Closure-venue rationale (for future ADR writers):* Q68 closes
  in this ADR rather than in ADR-0018 (Relationship Router)
  because the exception queue is platform-scope per spec §10 —
  the resolution-action enum membership is a platform-surface
  concern (which document types and resolution paths the
  platform supports), not a Router behavior concern (how matches
  are produced or re-evaluated). ADR-0018 will cite this ADR's
  resolution-action enum when describing how Router-produced
  exceptions land in the queue; this ADR owns the enum.

- **Q73 — Per-org Document Platform configuration.** Closed per
  §6 (document-type discriminator), §7 (ProposedAttachment
  approval policy), §13 (exception queue resolution actions),
  and §14 (Domain Boundary Map). The v1 platform is **not
  per-org-configurable** for these knobs — the active document-
  type set, the v1 active resolution-action subset, the
  ProposedAttachment approval policy, and the Domain Boundary
  Map cut are all system-fixed for v1. Per-org configurability
  for storage provider, OCR provider, retention policy, language
  packs, and confidence thresholds is owned by ADR-0013 (storage),
  ADR-0014 (OCR engine + retention), and ADR-0019 (confidence) —
  not closed here. The platform's per-org configurability surface
  for v1 is therefore: nothing the platform itself controls;
  every configurability knob ships in a downstream ADR.

- **Q75 — Document case source cardinality.** Closed per §3
  above. v1 ships the `document_case_sources(document_case_id,
  source_document_id, role)` table with the four-value v1 active
  subset (`primary, supporting, email_body, payment_evidence`).
  v1 patterns that ship case-source bundling: email body +
  invoice attachment (forwarded mailbox); receipt +
  payment-evidence (bill_payment Scenario B). v1 patterns that
  route to manual linking: vendor statement + multiple invoices,
  final invoice + retainer agreement, multi-page PDF with
  multiple invoice cases. Manual linking is the human resolving
  the case in the exception queue and using the
  `attach_to_existing_bill` resolution action.

- **Q76 — Re-evaluation policy: immutability vs supersession
  boundary.** Closed per §9 above. The four immutability rules
  apply: `ocr_runs` immutable; `extraction_runs` immutable per
  tuple; `relationship_candidates` versioned via supersession;
  pre-commit case `current_relationship_candidate_id` may
  change, post-commit `source_document_links` require
  reversal/supersession.

  *Closure-venue rationale (for future ADR writers):* Q76 closes
  in this ADR rather than in ADR-0018 because spec §16 frames
  the immutability rules as platform-substrate (they apply to
  schema-level table semantics — what the rows MUST be like, not
  to Router-behavior — when the rows are produced). ADR-0018
  cites this ADR's immutability rules when describing
  Router re-evaluation triggers (Q56, deferred to ADR-0018);
  this ADR owns the immutability boundary itself.

## Updates

This ADR does not update any prior ADR or canonical doc beyond
introducing the `DOC` invariant prefix. The prefix registration
in `docs/02_specs/invariants.md` is Phase 0 governance plan
Task E1, executed after this ADR ratifies. ADR-0007 is **not**
updated by this ADR — ADR-0007's Q66 closure (Relationship
Router tier placement) and Q77 update (Q28 expansion scope)
ratified 2026-05-03 and are cited as cross-references here, not
re-resolved.

## Forward-pointed (do NOT close in this ADR)

The following questions are Document-Platform-adjacent but are
forward-pointed to a downstream ADR; this ADR cites them but does
not close them:

- **Q55** ((linked_entity_type, link_role) pair-validity matrix)
  → ADR-0016 (Document Relationship Graph).
- **Q56** (Relationship Router re-evaluation triggers) →
  ADR-0018 (Relationship Router).
- **Q57** (Confidence calibration governance) → ADR-0019
  (Confidence Calibration Policy).
- **Q58** (ProposedMutationBundle atomicity at the DB transaction
  layer + Logic Receipt shape for compound mutations) →
  ADR-0012 (ProposedMutationBundle).
- **Q59** (Vendor prepayment object shape) → ADR-0015 (AP/Spend
  Subdomain).
- **Q60** (Born-paid bill bundle approval gate — v1 portion) →
  ADR-0015. Post-v1 portion → ADR-0017 (Vendor Template
  substrate; full enforcement deferred post-v1).
- **Q61** (Vendor prepayment approval gate) → ADR-0015.
- **Q62** (Deposit / retainer tax timing) → ADR-0015.
- **Q63** (Vendor balance view composition) → ADR-0015.
- **Q64** (Final invoice with prior deposit not in CHOUnting) →
  ADR-0015.
- **Q65** (Per-document-type classifier confidence thresholds) →
  ADR-0014 (Tier 2 Document Pipeline) for engine selection;
  ADR-0019 for thresholds.
- **Q69** (Replayability — re-running extraction when OCR engine
  improves) → ADR-0014 owns the operational policy; this ADR's
  §9 owns the immutability boundary.
- **Q70** (Idempotency at the OCR layer) → ADR-0014.
- **Q71** (Document-type classification strategy) → ADR-0014.
- **Q72** (AI fallback contract) → ADR-0014.
- **Q74** (Receipt v1 path — confirm decision matrix) → ADR-0015
  (Spend domain rows); ADR-0014 (OCR-engine row).
- **Q78** (Payment failure / reversal lifecycle) → ADR-0015.

## Already closed by ADR-0007 (cited as cross-reference)

- Q27 (CLAUDE.md §4 anti-hallucination wording for Tier 2 / Tier
  2.5 stages).
- Q28 (initial scope — Tier 2 → Tier 1 re-verification matrix
  framework).
- Q29 (Tier 2 boundary enforcement mechanism — ESLint rule).
- Q30 (Logic Receipt reproducibility — `pipeline_trace` field).
- Q31 (LLM-planned orchestration prohibition — verbatim rule).
- Q66 (Relationship Router tier placement — Tier 2.5 per option
  (b)).

## Already updated by ADR-0007 (cited as cross-reference)

- Q77 (Q28 expansion scope — four re-verification surfaces named;
  detailed matrix lands in `agent_architecture_policy.md` per
  Phase 0 Task E2).

## Alternatives considered

### Alternative 1 — Keep AP-shaped substrate; receipts/retainers as v2 additions

Rejected per spec §2 founder decision (Option A). The AP-shaped
substrate produces wrong accounting for receipt-as-supporting-
evidence, vendor statements, vendor credits, retainers, and
deposits. Forcing these into the `post_bill` shape produces a
substrate that future domains have to retrofit. The substrate
work pays back over years; the worst category of redesign cost
is retrofitting receipts / retainers / statements into an
AP-shaped data model.

### Alternative 2 — Document Platform owns all entity types (including bills, payments, prepayments, credits)

Rejected. The platform-as-monolith framing collapses domain logic
into substrate logic and violates Reading B at the architecture
layer. Domain services (`billService`, `paymentService`,
`vendorPrepaymentService`) own domain-specific rules — when can a
bill be approved for payment? what's the math for applying a
prepayment? what's a valid born-paid bundle? — and those rules
do not belong in a substrate that also owns ingestion, OCR, and
classification. The boundary between platform and domain (per
§1 above) is the architectural cut that keeps each layer
tractable.

### Alternative 3 — Banking is a v1 domain alongside Spend

Rejected per spec §15 receipt v1 decision matrix and Domain
Boundary Map cut. v1 ingests bank/card statements via the
platform but does not produce automated reconciliation proposals
— the workflow lands in the exception queue with manual
classification. Adding a Banking domain to v1 would multiply the
domain surface by 2x at a phase that is already absorbing
substantial substrate work (Document Platform, Relationship
Router, polymorphic links, ProposedMutationBundle, vendor
prepayment subdomain, exception queue first-class). The trade is
explicit: v1 ships clean substrate + AP foundation; post-v1
absorbs Banking on a substrate that already carries
reconciliation-metadata preservation per §14 above. ADR-0015
encodes the metadata preservation; this ADR establishes the
cut.

### Alternative 4 — Document Platform writes ledger entries directly for "obvious" cases (born-paid bundles)

Rejected. Reading B is non-negotiable per §8. Even the
"obvious" born-paid bundle case routes through a domain service
(`billService.postWithImmediatePayment(...)`) that computes the
bundle's ledger-entry shape and calls `ledgerService.post(...)`.
The platform produces the proposal; the domain service decides;
the ledger service writes. A platform that writes ledger entries
directly for some cases and not others creates two paths to the
same destination — which is the failure mode Reading B is
designed to prevent.

### Alternative 5 — Per-domain attachment tables instead of polymorphic source_document_links

Rejected per spec §6. Per-domain attachment tables
(`bill_attachments`, `payment_attachments`,
`prepayment_attachments`, `credit_attachments`) are what every
accounting system that didn't do the polymorphic version regrets
later. Adding a new domain entity (vendor statements, employee
expense reports, fixed assets) means a new attachment table,
new migration, new service path, new test surface. The
polymorphic alternative concentrates the discipline in three
places (closed enums, service-layer integrity validation,
explicit cascade behavior) and scales linearly with new entity
types rather than quadratically.

## Cross-references

- **ADR-0001** (`0001-reversal-semantics.md`) — reversal-as-
  mirror semantics inherited by `source_document_links.link_status =
  'reversed'` cascade behavior in §4.
- **ADR-0007** (`0007-three-tier-agent-architecture.md`) — read-
  boundary inheritance for the vendor matcher (§11);
  Tier 2 / Tier 2.5 placement; Q28 expansion scope. Carried
  prerequisite for this ADR.
- **ADR-0010** (`0010-reserved-enum-states.md`) — discipline
  applied to every closed enum this ADR introduces or names
  (`storage_provider`, `ingest_channel`, document case role,
  document case state, `document_type`, `link_role`, exception
  resolution action).
- **ADR-0012** (forthcoming, Tier 3 — `proposed-mutation-bundle.md`)
  — bundle atomicity at the DB transaction layer (Q58); Logic
  Receipt shape for compound mutations; sibling ProposedAttachment
  contract specifics (this ADR names ProposedAttachment as the
  handoff vocabulary; ADR-0012 specifies the bundle's atomicity
  enforcement and the audit-log shape).
- **ADR-0013** (forthcoming, Tier 3 — `storage-provider.md`) —
  storage provider implementation specifics, drift-detection
  cadence, queue-and-retry parameters, controller-override path,
  integrity-check policy. Q73 storage-provider configurability
  is owned by ADR-0013 (this ADR closes only the platform-surface
  portion of Q73).
- **ADR-0014** (forthcoming, Tier 3 — `tier-2-document-pipeline.md`)
  — Tier 2 pipeline implementation, OCR engine choice, Python
  sidecar topology, language boundary, model versioning,
  rollback strategy. Q65 (per-type confidence thresholds), Q69
  (replayability operational policy), Q70 (OCR-layer
  idempotency), Q71 (classification strategy), Q72 (AI fallback
  contract).
- **ADR-0015** (forthcoming, Tier 4 — `ap-spend-subdomain.md`) —
  AP/Spend domain rules; bill / payment / prepayment / credit
  lifecycles; born-paid bundle workflow via
  `billService.postWithImmediatePayment(...)`; reconciliation-
  metadata preservation on `payments`; payment_purpose
  discriminator; bills.legal_entity_id reservation;
  bill_lines.benefiting_entity_id reservation;
  payments.paying_entity_id and payments.benefiting_entity_id
  reservations. Q59, Q60 (v1 portion), Q61, Q62, Q63, Q64, Q74,
  Q78.
- **ADR-0016** (forthcoming, Tier 4 — `document-relationship-graph.md`)
  — full `linked_entity_type` and `link_role` enum membership;
  (entity_type, role) pair-validity matrix populated; cascade
  behavior per `linked_entity_type`. Q55.
- **ADR-0017** (forthcoming, Tier 4 — `vendor-template-substrate-reservation.md`)
  — substrate-only portion (`clean_approval_count` column on
  `vendor_rules`); full template-as-autonomy-rule enforcement
  deferred post-v1. Q60 (post-v1 portion).
- **ADR-0018** (forthcoming, Tier 5 — `relationship-router.md`)
  — Relationship Router behavior, three-subsystem decomposition
  (match-against-existing-state, ambiguity resolution,
  re-evaluation logic); Tier 2.5 read-boundary specifics; stale-
  state TOCTOU obligations. Q56.
- **ADR-0019** (forthcoming, Tier 6 — `confidence-calibration-policy.md`)
  — confidence thresholds and calibration governance. Q57, Q65.
- **`docs/09_briefs/phase-2/document_platform_reframe_design.md`**
  — the canonical 21-section design spec. ADR-0011 inherits
  decisions from §1 (motivation), §3.1 (entity ownership and
  case-source cardinality), §3.2 (invariant disposition), §5
  (Reading B), §6 (polymorphic-link discipline), §7 (Phase 0
  ADR list and Domain Boundary Map absorption), §10 (exception
  queue first-class), §13 (Q-list — Q53, Q54, Q67, Q68, Q73,
  Q75, Q76 closed here; Q55, Q56, Q57, Q58, Q59, Q60, Q61, Q62,
  Q63, Q64, Q65, Q69, Q70, Q71, Q72, Q74, Q78 forward-pointed),
  §14 (`ProposedAttachment`), §15 (receipt v1 decision matrix),
  §16 (immutability rules), §17 (multi-entity reservations),
  §19 (NOT-do list), §20 (verification against existing
  artifacts).
- **`docs/09_briefs/phase-2/document_platform_initiative.md`** —
  the B1 skeleton; this ADR's section structure aligns with the
  brief's section headings so B3 (Session 3) can fill in
  cleanly. Specifically §1, §3, §5, §7, §9, §10, §11 of the
  brief inherit verbatim from this ADR.
- **`docs/02_specs/intent_model.md`** — `ProposedMutation` shape
  (§3) and the Four Questions grammar (§5). `ProposedAttachment`
  per spec §14 is Primitive 1 (Proposal) with a non-mutating
  composite payload; no new primitive is needed.
- **`docs/02_specs/ledger_truth_model.md`** — Reading B framing
  and Service Communication Rules. Cited as the canonical source
  for §8 (three-layer separation).
- **`docs/02_specs/agent_autonomy_model.md`** §6 Item 2 — System
  ceiling for vendor bank-detail changes. Cross-referenced from
  §11 (vendor-matcher read boundary).
- **`docs/03_architecture/phase_simplifications.md`** —
  Simplification 3 ("AP Agent as the second real agent informing
  what shared agent-platform infrastructure is actually
  needed") is operationalized (not amended) by this reframe per
  spec §1.
- **`docs/02_specs/invariants.md`** — DOC prefix introduction
  (registration is Phase 0 Task E1, post-ratification of this
  ADR).
- **`docs/02_specs/agent_architecture_policy.md`** — Q28
  expansion location (Phase 0 Task E2). This ADR's §12 is a
  forward-pointer; the matrix itself does not live here.
- **`docs/02_specs/open_questions.md`** — Q53, Q54, Q67, Q68,
  Q73, Q75, Q76 (closed here); the forward-pointed Q's listed
  above; Q27, Q28, Q29, Q30, Q31, Q66 (already closed by
  ADR-0007); Q77 (already updated by ADR-0007).
- **`CLAUDE.md`** §4 — anti-hallucination rule extended by
  ADR-0007's Q27 resolution; the platform's pipeline stages
  inherit that resolution for vendor-matcher reads (§11).

## Notes for future ADR writers

- **Q68 closes here, not in ADR-0018.** The exception queue's
  resolution-action enum is platform-scope per spec §10. The
  platform owns which document types it supports and which
  resolution paths the platform surfaces; the Relationship Router
  produces matches that land in the queue but does not own the
  enum membership. ADR-0018 cites this ADR's resolution-action
  enum when describing how Router-produced exceptions land in
  the queue. If a future contributor opens an ADR-0018 amendment
  proposing changes to the resolution-action enum, the
  amendment is misplaced — it belongs in this ADR.

- **Q76 closes here, not in ADR-0018.** Spec §16 frames the
  immutability rules as platform-substrate — they apply to
  schema-level table semantics (what the rows MUST be like, not
  to Router-behavior — when the rows are produced). ADR-0018
  cites this ADR's immutability rules when describing
  re-evaluation triggers (Q56). The decision was a judgment
  call between this ADR and ADR-0018; the reasoning that placed
  Q76 here is that immutability is about the row semantics, not
  the Router's behavior. If a future amendment moves Q76 to
  ADR-0018, the migration is non-trivial — both ADRs would need
  to update their cross-references and the spec would need to
  carry both pointers in parallel for one revision.

- **The DOC prefix is reserved for substrate-layer invariants.**
  AP domain rules continue to use `AP` (INV-AP-001 / 002 owned
  by ADR-0015). Bank/card domain rules will use a future
  `BANK` prefix when the Banking domain phase scopes. A future
  contributor who proposes an `INV-DOC-NNN` invariant for an
  AP-domain rule (a born-paid bundle constraint, a vendor
  prepayment application limit) is prefix-confused — those are
  `INV-AP-NNN`. Substrate-only means: invariants that hold
  regardless of which domain consumes the platform.

- **Reading B violations from the platform are the most likely
  failure mode under this architecture.** A future contributor
  who needs to commit a journal entry from a Document Platform
  service path (the platform's exception-queue resolution flow,
  for example, that needs to mark a payment as failed) is
  tempted to call `ledgerService.post(...)` directly. The
  correct path: produce a `ProposedMutation` and route it
  through the AP/Spend domain service. The platform proposes;
  the domain decides; the ledger writes. This rule is repeated
  here because it is the rule most likely to drift in the next
  six months of code.

- **The Banking domain ADR is intentionally absent from Phase 0.**
  The Domain Boundary Map answers Q67 (Banking is post-v1) but
  does not draft the Banking domain itself. When the Banking
  domain phase scopes, the new ADR will inherit the metadata-
  preservation contract from ADR-0015's `payments` schema (per
  §14 above). A future ADR drafter who wants to draft the
  Banking ADR alongside the Phase 0 set is moving Banking from
  post-v1 to v1 — which is a scope change requiring founder
  re-decision, not a Phase 0 task.

- **The exception queue's v1 active resolution-action subset is
  intentionally narrow.** Eight values active out of sixteen
  reserved. v1 humans resolve credit memos and vendor
  prepayments via the AP/Spend domain service's manual entry
  forms, not via the queue's resolution-action enum. The queue
  routes the human to the form; the form's commit (which
  produces a `create_vendor_credit` or `create_vendor_prepayment`
  domain mutation) closes the queue row indirectly. A future
  contributor who proposes activating `create_vendor_credit` or
  `create_vendor_prepayment` in v1's queue resolution flow is
  proposing a queue→domain coupling that bypasses the manual
  entry form's discipline. The post-v1 phase that activates
  these resolution actions also activates a queue→domain
  service path that produces the same `audit_log` shape as the
  manual form; the path is not "just emit the resolution-action
  row," it's "emit + commit through the same domain service the
  manual form uses."
