# Document Platform Reframe — Design Spec

**Status:** Brainstorm output. Not authorized for code. Frames the
architectural pivot from "AP Ingestion Initiative" to "Document
Platform Initiative + Spend Initiative." Drives downstream brief
creation, ADR drafting, and Phase A session brief sequencing.

**Date:** 2026-05-02

**Resolution path:** This spec is the design artifact that
authorizes (1) creating a new `document_platform_initiative.md`
brief, (2) renaming `ap_ingestion_initiative.md` to
`spend_initiative.md` and pruning substrate-shaped sections out of
it, (3) drafting the eight Phase 0 ADRs named in §7 below before any
v1 code commits. ADR drafting is a separate prompt cycle. Open
questions Q53–Q78+ file in a separate prompt cycle (this spec does
not edit `docs/02_specs/open_questions.md`).

**Relationship to existing architecture:** Supersedes the framing
of `ap_ingestion_initiative.md` v1 (CTO-reviewed 2026-05-01,
T2/T3-amended 2026-05-02). Does not invalidate the AP-domain
decisions in that brief — vendor prepayment subdomain, polymorphic
source-document links, ProposedMutationBundle, born-paid bill
handling, manual AP foundation, storage-provider abstraction, and
the four ADRs originally named — all carry forward. What changes
is *where* those decisions live: substrate-shaped concerns move to
a new Document Platform Initiative brief; AP/Spend-domain concerns
remain in the renamed Spend Initiative brief.

---

## 1. Why this reframe exists

The original AP Ingestion Initiative brief locked v1 to AP bills
only, drag-drop PDF + forwarded mailbox, deterministic TypeScript
extraction only, no Python sidecar, no photo capture. That scope
was correct under the assumption that B2B PDF invoices are the
only v1 ingestion shape. Subsequent CTO discussion surfaced one
load-bearing fact the brief was not written against:

**Receipts, retainers, deposits, vendor statements, credit memos,
bank/card transactions, and AR invoices do not fit the AP bill
lifecycle — regardless of volume.** A receipt may be supporting
evidence, may settle an existing bill, or may generate a born-paid
bill+payment bundle. A retainer creates a vendor-held asset before
any final invoice exists. A vendor statement reconciles, it does
not post. A credit memo creates a vendor credit, not a negative
invoice. Forcing these into the `post_bill` shape produces wrong
accounting. The architectural argument is about *shape*, not
*volume*: even if image receipts turn out to be a minority of v1
traffic, the substrate must accommodate them and the other
non-AP-shaped document types because every one of them has a
different accounting destination.

(Volume is a secondary motivation, not the load-bearing reason.
The founder's stated position is that the feature is needed
regardless of volume; the substrate decision falls out of shape
diversity, not workload mix.)

The CTO discussion landed on a reframe: **AP is not the
foundation. The Document Platform is the foundation. AP/Spend is
the first domain consumer of the platform. Receipts, retainers,
deposits, statements, credits, banking, AR — all are future
domain consumers of the same platform.**

**Relationship to Simplification 3.**
`docs/03_architecture/phase_simplifications.md` Simplification 3
("AP Agent as the second real agent informing what shared
agent-platform infrastructure is actually needed") is preserved,
not amended. The AP Agent is still the second agent (after the
Phase 1 Double Entry Agent); the Document Platform is what the AP
Agent's exercise reveals as the right substrate shape once
receipts, retainers, statements, credits, and other non-AP-bill
document types are in scope. The platform abstraction is
informed by AP and the explicit scope-expansion list in §3.2; it
is not built before two domain consumers exist.

This spec captures that decision and its consequences.

## 2. Decision summary (Option A confirmed)

The CTO discussion presented three options:

- **Option A:** Adopt the Document Platform reframe in full. Two
  briefs, eight Phase 0 ADRs, vendor prepayment subdomain,
  polymorphic source-document links, ProposedMutationBundle,
  exception queue as first-class, auto-post deferred past v1.
  Scope expansion is 3–5x vs the original AP brief.
- **Option B:** Targeted amendment to the existing AP brief.
  Add vendor prepayments, bundles, polymorphic links — but stay
  AP-shaped. Future domains inherit AP-shaped assumptions.
- **Option C:** Bifurcate. Ship narrow AP-bills-only v1 fast,
  start Document Platform work in parallel as v1.5/v2.

**Founder decision (2026-05-02): Option A.** Timeline expansion
is not a constraint. The substrate work pays back over years; the
worst category of redesign cost is retrofitting receipts /
retainers / statements into an AP-shaped data model. Option B is
dominated when timeline is not a constraint. Option C is dominated
when timeline is not a constraint and produces an AP-shaped legacy
that future domains have to retrofit.

**Important nuance.** Option A does not mean "wait for everything
before shipping anything." Phases 1–4 (Storage/Evidence Core →
Document Core skeleton → Document Relationship Graph → Spend/AP
foundation) ship sequentially with real exit tests. The founder +
2 real users start using the system at end of Phase 4 (manual AP
workflow on top of the substrate); receipts, retainers,
statements, credits arrive in Phases 5–8 as additive capabilities
on substrate that is already designed to absorb them.

## 3. The two-brief split

The original brief became unwieldy at §11.5 with deliberate
departures from the §1–§21 default layout. Adding the Document
Platform substrate inside it would push it past the size where any
single reader can hold the whole thing. **Two briefs with a clean
handoff contract** is the correct structure.

### 3.1 Document Platform Initiative brief (new)

**File:** `docs/09_briefs/phase-2/document_platform_initiative.md`
(to be drafted in a separate prompt cycle).

**Scope:** the substrate every domain consumes. Specifically:

- **Storage / Evidence Core.** `source_documents`,
  `source_document_versions`, `storage_provider` discriminator,
  content-hash integrity, drift detection, queue-and-retry
  degradation policy. Absorbs §6 of the original AP brief in full.
- **Document Cases.** The workflow item created from a source
  document. One file may produce zero, one, or many cases.
  Distinct from `source_documents` and from `proposed_mutations`.
- **`document_case_sources` (many-to-one source-to-case table).**
  A single document case may also draw from multiple source
  documents — email body + invoice attachment, retainer agreement
  + payment confirmation, final invoice + prior deposit request,
  vendor statement + several supporting invoices, credit memo +
  original bill. Modeled as `document_case_sources(document_case_id,
  source_document_id, role)` where `role` is a closed enum:
  `primary | supporting | email_body | payment_evidence |
  superseded_source | related_prior_document`. Without this table
  the platform has a subtle one-file-first bias that gets
  expensive to retrofit.
- **Document Artifacts.** Engine-agnostic `OcrArtifact` /
  `DocumentArtifact` contract — pages, lines, words, bounding
  boxes, confidence, quality flags, pipeline trace. The
  load-bearing interface that decouples OCR engine choice from
  downstream consumers.
- **Document Classification.** Document-type discriminator —
  active and reserved set (ADR-0010 reserved-enum-states
  discipline applies):
  `vendor_invoice`, `receipt`, `payment_confirmation`,
  `credit_memo`, `vendor_statement`, `purchase_order`,
  `receiving_document`, `retainer_request`, `deposit_request`,
  `bank_statement`, `card_statement`, `customer_invoice`,
  `customer_remittance`, `tax_form`, `contract`,
  `payroll_document`, `asset_purchase_support`, `unknown`. v1
  active set is narrow (probably `vendor_invoice`, `receipt`,
  `payment_confirmation`, `unknown`); the rest are reserved per
  Q53 (see §13).
- **Relationship Router.** Match-against-existing-state engine.
  Produces `DocumentRelationshipCandidate` (new_ap_bill,
  existing_bill_support, payment_evidence_only, born_paid_bill,
  vendor_prepayment, etc.) and re-evaluation logic when new
  domain state lands.
- **Polymorphic source-document links.** Generic
  `source_document_links` table with `linked_entity_type`,
  `linked_entity_id`, `link_role`. Replaces per-domain attachment
  tables. Schema-discipline constraints in §6.
- **Ingestion Core.** `ingest_batches`, `ingest_items`,
  `document_jobs`. Channel-agnostic. Absorbs Phases C/D from the
  original AP brief (drag-drop PDF + forwarded mailbox), plus
  reserves seats for photo, linked OAuth, SharePoint folder
  watcher, vendor APIs, e-invoice/Peppol/UBL, bank/card feeds.
- **Extraction Pipeline.** Tier 2 stages — PDF probe → text
  extraction → OCR (when authorized) → field extraction → table
  extraction → validation. Produces `DocumentArtifact`. Does not
  decide ledger posting.
- **ProposedMutation / ProposedMutationBundle handoff.** The
  contract by which Document Core hands proposals to domain
  services. Does not own commit authority.
- **Exception queue.** First-class deliverable, not a deferral
  mechanism. See §10.
- **Triage Bucket / drag-drop UX surface.** The drag-drop entry
  point in chat / canvas. Substrate-shaped (every document type
  enters here, not only AP). Ownership moves under Document
  Platform per this reframe. The existing
  `docs/09_briefs/phase-2/triage_bucket_intake.md` becomes a
  UX-surface reference for the Document Platform brief instead of
  for the AP brief; that file is not edited here.

**Phase 0 ADRs that live in this brief (seven):** Document
Platform ADR (absorbs Domain Boundary Map), Storage Provider ADR
(carried over from original brief), Tier 2 Document Pipeline ADR,
ProposedMutationBundle ADR (absorbs Bundle Atomicity), Document
Relationship Graph ADR, Relationship Router ADR (kept separate
per §8), Confidence Calibration Policy ADR (kept separate per §7).
ADR-0007 (three-tier agent architecture) is a carried prerequisite
that gates this brief but is not owned by it; see §7 and §9.

### 3.2 Spend Initiative brief (renamed AP brief)

**File:** `docs/09_briefs/phase-2/spend_initiative.md` (renamed
from `ap_ingestion_initiative.md`).

**Scope:** the first domain consumer of the Document Platform.
Outgoing-money workflows.

- **AP foundation (Phase A from the original brief — preserved).**
  Manual bill creation, payment approval queue, payment recording,
  AP aging, open bills, vendor balance, paid bills history. The
  manual-first discipline is unchanged: this ships before any
  drag-drop, email, or extraction. Manual AP is the fallback path
  every later phase preserves.
- **Vendor prepayments / deposits / retainers (new subdomain).**
  `vendor_prepayments`, `vendor_prepayment_applications`,
  `record_vendor_prepayment`, `apply_vendor_prepayment_to_bill`,
  `record_vendor_prepayment_refund`, `write_off_vendor_prepayment`
  intent variants. Reserved schema seats; manual workflow in v1.
- **Vendor credits.** `vendor_credits`,
  `vendor_credit_applications`, `post_vendor_credit`,
  `apply_vendor_credit_to_bill` intent variants. Reserved schema
  seats; manual workflow in v1.
- **Receipts and born-paid bills.** Receipt classifier consumes
  `DocumentArtifact` from the platform. Born-paid bills ship as
  `ProposedMutationBundle(post_bill + record_bill_payment)` —
  Option B from the original brief's §9 amendment 6 (preserve
  lifecycle via DB-transaction-atomic bundle).
- **Payment evidence.** `attach_payment_evidence` and
  `attach_invoice_to_existing_bill` intent variants. Some uploads
  do not change accounting state; they only attach.
- **Vendor master mutations.** `create_vendor`, `update_vendor`
  via `ProposedMutation`. Bank-detail changes are System ceiling
  per `agent_autonomy_model.md` §6 Item 2. Carried over from
  original brief §7. **Drafting requirement for the Spend brief:**
  the bank-detail-change hard rule must appear as an explicit
  callout in the Spend Initiative brief's vendor-master section,
  not as a parenthetical — see §15 of this spec for the required
  callout text. This is the most important AP fraud control and
  deserves callout visibility.
- **`payment_purpose` discriminator on `payments`.** Distinct
  from `payment_method`. Method is a physical channel (cash /
  cheque / EFT / wire / credit_card / ACH / other); purpose is
  accounting intent (`bill_payment | vendor_prepayment |
  vendor_refund | customer_payment | employee_reimbursement |
  owner_reimbursement | tax_payment | other`). A wire can be a
  bill payment or a retainer; a credit card transaction can be a
  POS expense or a deposit. Method does not determine accounting
  intent. Reserved per ADR-0010 discipline.
- **Spend-domain reporting.** AP aging, open bills, vendor
  balance (now extended with open vendor prepayments and
  unapplied vendor credits — see Q63 in §13 for the explicit
  composition decision), payment approval queue, paid bills
  history, exception queue.

**Phase 0 ADRs that live in this brief:** AP/Spend Subdomain ADR
(renamed from "AP subdomain" — covers bill / payment / prepayment
/ credit lifecycles), Vendor Template = Autonomy Rule ADR
(carried over but now scoped post-v1 since auto-post is deferred —
see §11).

**Complete section-by-section migration table** (every section
of the original `ap_ingestion_initiative.md` brief, with explicit
disposition):

| Original brief § | Disposition | Notes |
|---|---|---|
| Header block + locator note | **Rewrite** in Spend brief | Title becomes "Spend Initiative — Phase 2 Brief"; locator note rewritten for new structure |
| §1 Why this initiative exists | **Rewrite** in Spend brief | Original lede goes to history footnote; new framing describes Spend as first domain consumer of Document Platform |
| §2 Locked v1 scope | **Rewrite + split** | Document-platform-shaped locks (storage, ingestion channels, extraction) move to Document Platform brief; Spend-domain locks (AP bills only initially, no auto-pay) stay |
| §3 Two lifecycles + ProposedMutation variants | **Stay** in Spend brief | AP-domain lifecycles. ProposedMutationBundle introduction moves to Document Platform brief; Spend brief consumes it |
| §3.1 mapping table | **Stay + extend** in Spend brief | Add rows for `record_vendor_prepayment`, `apply_vendor_prepayment_to_bill`, `post_vendor_credit`, `post_bill_with_payment` (born-paid bundle) |
| §3.1 reversed-vs-voided footnote | **Stay** in Spend brief | Unchanged from T2/T3 amendment |
| §4 Tier 1/2/3 placement | **Split** | Tier 2 extraction pipeline language → Document Platform brief; Tier 1 commit-boundary discussion stays in Spend brief |
| §5 Data model | **Stay + extend** in Spend brief | Add `vendor_prepayments`, `vendor_prepayment_applications`, `vendor_credits`, `vendor_credit_applications`, `payment_purpose` enum on `payments`. The polymorphic `source_document_links` table moves to Document Platform |
| §5.1 Reservation reconciliation | **Stay** in Spend brief | AP-table naming reconciliation unchanged |
| §5.2 New columns and tables | **Split** | `source_documents` and `bill_attachments` → Document Platform (with `bill_attachments` superseded by polymorphic `source_document_links`); bill / bill_lines / payments / vendor_prepayments / vendor_credits stay in Spend |
| §5.3 Bill autonomy rule shape | **Stay** in Spend brief | Vendor-template/autonomy-rule scope; enforcement post-v1 per §11 |
| §6 Storage abstraction | **Move** to Document Platform brief | Generic substrate concern, not AP-specific |
| §7 Vendor onboarding workflow | **Stay** in Spend brief | Vendor-master mutations are Spend-domain |
| §8 Subdomain scoping decisions | **Stay** in Spend brief | All eight scoping choices (tax scope, three-way matching, vendor credits, document version handling, i18n, forwarded-mailbox security) are AP/Spend-shaped |
| §9 Trust thresholds + reversal-of-auto-post | **Stay** in Spend brief | §9.1 (trust thresholds) marked post-v1 per §11 of this spec; §9.2 (reversal visibility) unchanged |
| §10 Phase sequencing | **Rewrite** in both briefs | Original brief's phase table is replaced by the Phases 1–8 plan in §3 of this spec; Document Platform brief covers Phases 0/1/2/3, Spend brief covers Phases 4/5/6/7/8 |
| §11.1–§11.4 Phase A acceptance criteria | **Stay** in Spend brief | INV-ID-mapped acceptance criteria for AP bills, reversal, state transitions, read-side reporting |
| §11.3 Reserved invariant candidates | **Stay + extend** in Spend brief | INV-AP-001/002 (allocation sums, state transitions) stay; INV-AGENT-NNN (bank-detail-confirmation) stays under AGENT prefix; new INV-DOC-NNN candidate (one-primary-attachment-per-bill / per-case) added per external review's A3 — see invariant-disposition note below |
| §11.4 AP read-side reporting | **Stay** in Spend brief | Six surfaces unchanged |
| §11.5 Screenshot-gate surface inventory | **Split** | Document-platform surfaces (Triage Bucket / drag-drop zone, exception queue UI, forwarded-email arrival notification) → Document Platform brief; AP-domain surfaces (manual bill creation form, ProposedBillCard, payment approval card, AP aging, open bills, vendor balance, paid bills history) → Spend brief |
| §11.6 Closeout discipline | **Stay** in Spend brief | UI-screenshot gate + push-readiness three-condition gate apply per phase per CLAUDE.md |
| §12 Hard prerequisites | **Rewrite + extend** | Q27–Q31 + ADR-0007 prerequisites now joined by the Phase 0 ADR list in §7 of this spec; the rewritten §12 in each brief points back to this spec |
| §13 ADR list | **Supersede** | Original brief's four ADRs are superseded by §7 of this spec; each brief's §13 references this spec |
| §14 Open questions | **Rewrite + extend** | Q35–Q52 from original brief carry forward; Q53–Q78+ added per §13 of this spec; filing happens in a separate prompt cycle for both briefs |
| §15 Deferred to post-v1 | **Split** | Document-platform-shaped deferrals (Python OCR sidecar, EDI/Peppol, vendor portal scraping, LayoutLM, photo capture, linked OAuth) → Document Platform brief; Spend-domain deferrals (auto-pay, three-way matching, vendor credits automation, AR invoices, multi-currency, approval delegation, FR/bilingual extraction anchors) → Spend brief |
| §16 Friction-journal scope | **Split** | Document Platform arc + Spend Initiative arc each get their own friction-journal scope |
| §17 What this initiative does NOT do | **Rewrite** in both briefs | Each brief carries its own NOT-do list; this spec's §19 is the canonical reframe NOT-do list |
| §18 Verification against canonical docs | **Stay + extend** in both briefs | Each brief verifies its scope against canonical specs; this spec's §20 verifies the reframe itself |
| §19 Review history | **Carry forward** in both briefs | Each brief carries the relevant entries; the 2026-05-02 reframe entry appears in both |

**Invariant disposition (§11.3 of original brief).** Three
candidate invariants from the original brief, plus the external
review's A3 evidence-completeness invariant, split as follows:

- **INV-AP-001 (allocation sums never exceed bill amount)** —
  stays in Spend brief. AP-domain rule.
- **INV-AP-002 (bill state transitions follow allowed paths)** —
  stays in Spend brief. AP-domain rule.
- **INV-AGENT-NNN (vendor bank-detail change requires controller
  confirmation)** — stays under AGENT prefix; cross-referenced from
  Spend brief's vendor-master section. Per the T2/T3 amendment of
  the original brief, this candidate sits with INV-AGENT-001 in
  `agent_autonomy_model.md`'s reserved INV-IDs.
- **INV-DOC-NNN (evidence-completeness; one primary attachment per
  bill / per case unless controller override)** — new candidate,
  registered under a new `DOC` prefix that the Document Platform
  ADR introduces. Layer 2 service-layer enforcement. The exact
  shape (per-bill vs per-case) and the override mechanism are
  filed as Q-new (see §13). The `DOC` prefix follows the same
  spec-without-enforcement discipline as the `AP` prefix from the
  original brief.

## 4. Spend Initiative naming

The original brief's "AP Ingestion Initiative" name kept the brief
narrowly scoped to invoice + bill workflows; receipts and
retainers feel like awkward additions. The Spend framing
broadens to all outgoing-money workflows; AP becomes a named first
sub-component.

**Decision: rename to Spend Initiative.** The brief's lede states
explicitly: "manual AP bill workflow ships first; vendor
prepayments, receipts, payment evidence, and other spend
workflows ship after." The scope expansion is legible in the
brief title rather than buried in §1.

**The Most Important Sentence (lede) is amended.** The original
CTO-mandated verbatim sentence was:

> "Extraction is a feeder. AP is the foundation. The payment
> approval gate is separate. The existing CHOUnting
> mutation/invariant system remains the authority."

The new lede (CTO-driven amendment, 2026-05-02 — canonical
five-sentence form):

> **Document Platform is the foundation.**
> **AP/Spend is the first domain.**
> **Extraction is a feeder.**
> **Domain services produce ledger operations; the ledger service
> is the only writer of journal entries.**
> **Existing CHOUnting mutation and invariant discipline remains
> the authority.**

The original sentence sits in a "history" footnote in §1 of the
Spend Initiative brief, noting the reframe occurred 2026-05-02.

## 5. Domain service vs ledger service separation (Reading B)

A recurring ambiguity in the discussion was whether domain
services (`billService`, `vendorPrepaymentService`, etc.) and the
ledger service are separate-but-coordinating (Reading A) or
whether the ledger service is the canonical commit authority
(Reading B).

**Decision: Reading B.** Specifically:

- **The ledger service is the sole writer of `journal_entries`
  and `journal_lines` rows.** No domain service inserts into
  those tables directly.
- **Domain services own domain-specific logic.** When can a bill
  be approved for payment? What's the math for applying a
  prepayment? What's a valid born-paid bundle? What's the
  System-ceiling check for bank-detail changes? All domain
  services.
- **Domain services produce ledger operations via the ledger
  service.** A `billService.post()` call computes the bill row
  changes + the journal-entry shape + calls
  `ledgerService.post(journalEntryShape)` inside the same
  `withInvariants()` transaction.
- **Both domain and ledger services run inside `withInvariants()`
  per Service Communication Rule 1.** The domain service's
  invariants govern domain logic (bill state transitions,
  prepayment application math); the ledger service's invariants
  govern ledger truth (balanced entries, period validity, account
  validity, currency conversion, money-arithmetic invariants).
- **The ledger service is the only place INV-LEDGER-001 through
  INV-LEDGER-006 enforce.** Domain services never reproduce that
  logic; they call the ledger service.

This separation is stated explicitly in the Document Platform ADR
and in the Spend Initiative brief's §4 (Tier 1 commit boundary).
It is not a new architectural decision — it is what
`ledger_truth_model.md` and `withInvariants` already imply — but
the discussion surfaced that the implication had never been
written down.

## 6. Polymorphic source-document links — schema discipline

`source_document_links` is the single most important schema
decision in this reframe. Per-domain attachment tables
(`bill_attachments`, `payment_attachments`,
`prepayment_attachments`) are what every accounting system that
didn't do this regrets later. The polymorphic alternative is
correct — but polymorphic foreign keys are a known schema
anti-pattern unless governed.

**Three discipline constraints are required:**

1. **CHECK constraint on `linked_entity_type` matching a closed
   enum.** The valid set is the document-link enum named in §3.1
   (bill, payment, bill_payment_allocation, vendor_prepayment,
   vendor_prepayment_application, vendor_credit, vendor_credit_application,
   vendor_statement_reconciliation, bank_transaction,
   card_transaction, customer_invoice, customer_payment,
   employee_expense_report, fixed_asset, purchase_order,
   receiving_document, tax_form, manual_journal_entry).
   ADR-0010 reserved-enum-states discipline applies — the v1
   active set is small (bill, payment, bill_payment_allocation,
   vendor_prepayment, vendor_prepayment_application,
   vendor_credit) but the full enum is reserved at initial
   shipping.

   **The companion `link_role` enum** is enumerated alongside,
   following the same reserved-enum-states discipline:
   `primary_invoice`, `payment_evidence`, `receipt`, `supporting`,
   `correspondence`, `credit_memo`, `statement`, `deposit_request`,
   `retainer_agreement`, `refund_evidence`, `proof_of_delivery`,
   `contract`, `tax_support`, `source_of_extraction`,
   `derived_from`, `superseded_by`. v1 active set is narrow
   (probably `primary_invoice`, `payment_evidence`, `receipt`,
   `supporting`); the rest are reserved per Q55 (see §13). The
   AP/Spend Subdomain and Document Platform ADRs jointly specify
   which `(linked_entity_type, link_role)` pairs are valid in v1,
   because not every role applies to every entity type — e.g.,
   `retainer_agreement` only makes sense linked to
   `vendor_prepayment`.
2. **Write-time integrity validation.** SQL-level polymorphic FKs
   aren't enforced; the `linked_entity_id` integrity check lives
   at the service-layer write path. The Document Platform's
   `documentLinkService.create()` validates that the named entity
   exists in the named table before inserting the link row.
3. **Explicit cascade behavior.** When a linked entity is deleted
   (rare in this system — most "deletes" are reversals), the
   policy is per-`linked_entity_type`. For most entity types,
   deletion of the linked entity sets `link_status = 'orphaned'`
   rather than cascade-deleting the link row, because the
   document evidence itself remains valid even if its linked
   accounting object is reversed.

These three constraints land in the Document Platform ADR and the
Document Relationship Graph ADR.

## 7. Phase 0 ADR list

**Eight ADRs** land before any v1 code commits (down from the
ten originally listed; Bundle Atomicity merges into
ProposedMutationBundle, and Domain Boundary Map merges into
Document Platform). Three carry forward from the original AP
brief's §13 (ADR-0007, AP Subdomain ADR, Vendor-Template ADR with
clarified scope). Storage Provider was the fourth in the original
brief and now lives in the Document Platform initiative. Five are
added by this reframe.

| # | ADR | Owner | Gates phase(s) | Depends on | Closes |
|---|---|---|---|---|---|
| 1 | ADR-0007 — three-tier agent architecture (existing reservation; possibly amended per §9 below for Tier 2/2.5 scope and Q27 wording) | Carried prerequisite | All Phase 1+ work | — | Q27–Q31 |
| 2 | Document Platform ADR (includes Domain Boundary Map for Spend vs Banking ownership) | Document Platform | Phases 1–8 | ADR-0007 | new |
| 3 | Storage Provider ADR (carried from original brief) | Document Platform | Phase 1 (Storage/Evidence Core) | Document Platform ADR | Q47, Q52 |
| 4 | Tier 2 Document Pipeline ADR | Document Platform | Phases 6–7 (Ingestion + Extraction) | Document Platform ADR, ADR-0007 | new — supersedes the Tier 2 extraction pipeline language in the original brief §4 |
| 5 | ProposedMutationBundle ADR (includes bundle atomicity — DB-transaction-atomic enforcement is part of the bundle semantics) | Document Platform | Phase 8 (Proposal handoff) and onward | Document Platform ADR | new |
| 6 | Document Relationship Graph ADR | Document Platform | Phase 3 onward | Document Platform ADR, Storage Provider ADR | new — covers polymorphic links, schema discipline per §6 |
| 7 | Relationship Router ADR (load-bearing intelligence — kept separate per §8) | Document Platform | Phase 4 onward | Document Relationship Graph ADR, ADR-0007 (per §9 dependency) | new |
| 8 | Confidence Calibration Policy ADR (kept separate — needs controller/governance review, not engineering alone) | Document Platform | Phase 4 onward | Relationship Router ADR | new — see §12 |
| 9 | AP/Spend Subdomain ADR (renamed from "AP subdomain") | Spend Initiative | Phase 5 onward | Document Platform ADR, ProposedMutationBundle ADR | bill / payment / prepayment / credit lifecycles |
| 10 | Vendor-Template-as-Autonomy-Rule ADR — **scope split.** v1 substrate (the `clean_approval_count` column on `vendor_rules` and the table shape) ships under ADR-0010 reserved-enum-states discipline alone; the full ADR (covering enforcement / promotion / auto-post calibration) is **drafted and ratified post-v1** when auto-post lands. Phase 0 only requires the substrate-reservation portion. | Spend Initiative | Phase 5 schema only; full enforcement gates v1.5+ | AP/Spend Subdomain ADR | Q43, post-v1 |

**Phase gating discipline.** "Drafted ADR" ≠ "Ratified ADR." Code
in any phase gates on **ratified** ADRs that cover its scope, not
just drafted ones. Phase 0 closes when ADRs 1–8 are ratified
(plus the substrate-reservation portion of ADR 10). Phase 5 (AP
foundation) additionally requires ADR 9 ratified. Phase 0 ADR
*drafting* runs in parallel with Q53–Q78+ filing per §13; ADR
*ratification* is the gate that releases Phase 1+ code.

## 8. Relationship Router — load-bearing intelligence component

The Relationship Router deserves its own ADR (item 7 in §7 above)
because it is three subsystems, not one:

- **Match-against-existing-state engine.** Given an extracted
  artifact, does it match an existing bill / payment /
  vendor_prepayment / vendor_credit / vendor_statement? Fuzzy
  matching across vendor name, amount, date, reference number,
  document number. Per-document-type confidence thresholds.
  Reads from multiple subledgers.
- **Ambiguity resolution.** Multi-match cases (one receipt
  against three open bills; one credit memo applicable to multiple
  bills). Single-match-but-low-confidence cases. UX flow for
  human disambiguation.
- **Re-evaluation logic.** When a new bill posts, do previously
  unmatched receipts get re-classified? When a vendor master is
  updated, do previously routed-to-exception documents get
  re-routed? When a confidence threshold moves, do previous
  decisions get re-evaluated? This is what makes the system
  replayable and is the reason `ocr_runs` and `extraction_runs`
  need to be separate replayable artifacts.

The "ghost match" failure mode — document silently links to the
wrong bill — is the load-bearing safety risk. The Router ADR
specifies how match outcomes feed Q28 re-verification (see §13).

## 9. Tier 2 / Tier 2.5 / Tier 1-pre-commit dependency on ADR-0007

The original brief's Tier 2 was "extraction pipeline — stateless
typed functions, no shared session, no LLM-planned
orchestration, no direct writes." The Document Platform's
Relationship Router does something the original Tier 2 contract
did not authorize: it **reads against committed ledger state**
(open bills, vendor balances, vendor prepayment balances) to
produce relationship matches.

This may exceed the original Tier 2 scope. Three paths to evaluate
in ADR-0007's amendment (or the Relationship Router ADR):

- **(a) Amend ADR-0007** to authorize Tier 2 reads against
  committed ledger state, with the Q28 re-verification matrix
  expanded to cover relationship-match outcomes.
- **(b) Introduce a Tier 2.5** specifically for the Relationship
  Router, with its own safety contract — read-only against
  ledger state, idempotent, no LLM-planned matching, output as
  Zod-validated `DocumentRelationshipCandidate`. Reverified by
  Tier 1 before commit.
- **(c) Place the Relationship Router in Tier 1 as a read-only
  pre-commit proposal-shaping stage.** Pure: Tier 2 stays
  stateless extraction-only; the Router is part of the
  commit-path service flow but produces no writes. Tradeoff:
  conflates "shaping" with "committing" inside Tier 1, which
  pushes domain-knowing match logic into the commit path.

**Recommended preference: (b) Tier 2.5.** Reason: the Router is
not just extraction (so (a) over-extends Tier 2's stateless
contract) but also should not be part of the write path (so (c)
over-loads Tier 1 with shaping responsibilities). Tier 2.5 gives
the Router the right safety contract — read-only, idempotent,
deterministic orchestration, Zod-validated output, no direct
writes, reverified by Tier 1 at commit. The ADR-0007 amendment
or the Relationship Router ADR makes the final call between (a),
(b), and (c).

**Q27 anti-hallucination wording is a separate dependency.** The
original brief's Q27 amends `CLAUDE.md` §4 ("No agent may
reference an account code, vendor name, or amount it has not
first retrieved from the database in the current session") to
distinguish stateful conversational agents from stateless
pipeline stages. Under this reframe, the Relationship Router
**reads from committed accounting state at request time** to
produce match candidates that influence proposals. The Q27
amendment language has to explicitly cover Router reads as
**request-time context retrieval**, not "session memory" — and
must say so before the Relationship Router ADR can be drafted.
This is a separate dependency from the Tier scope question above:
even if (a)/(b)/(c) is decided, Q27's wording independently has
to authorize the read pattern.

**The decision between (a)/(b)/(c) lives in ADR-0007's amendment
or in the Relationship Router ADR.** This spec does not
pre-decide it, but flags both dependencies (Tier scope + Q27
wording) explicitly: the Document Platform ADR and the
Relationship Router ADR cannot be drafted in isolation from
ADR-0007's amendment scope.

## 10. Exception queue as first-class deliverable

Under this reframe, v1 routes credit memos, vendor statements,
deposit requests, retainer requests, bank statements, card
statements, customer invoices, employee reimbursements, POs,
receiving documents, tax forms, and unknown documents to the
exception queue. That is a lot of categories. **The exception
queue becomes the bulk of v1's user-visible work** — the founder
+ 2 real users will spend most of their time there, not on the
happy path.

This means the exception queue cannot ship as a deferral
mechanism. It must ship as a first-class workflow tool:

- **Document-type-aware actions.** A credit memo in the
  exception queue lets the user record the credit manually, even
  if not automated. A vendor statement lets the user open a
  reconciliation view, not just "mark resolved."
- **Reclassification workflows.** A document misclassified as
  exception is easily moved to the right type. The classification
  is editable, not a permanent label.
- **Bulk operations.** Filter by document type, vendor, date
  range; bulk-approve, bulk-route, bulk-reclassify.
- **First-class screenshot-gate coverage.** The exception queue
  UI ships with screenshot-gate ratification per CLAUDE.md, not
  as an afterthought.

The exception queue lives in the Document Platform brief (it's
substrate). The domain-specific manual workflows it triggers
(record vendor credit, open vendor statement reconciliation, file
employee reimbursement) live in the Spend Initiative brief or
future domain briefs.

## 11. Auto-post deferred past v1

Under the original brief, Q35 (AP-bill autonomy rung calibration)
and Q43 (vendor-template-as-autonomy-rule) were Phase E or earlier
v1 questions. Under this reframe, **auto-post is explicitly
deferred past v1**. All v1 proposals are Always Confirm.

Reasoning: there is enough new substrate to validate without
auto-post (Document Platform, Relationship Router, polymorphic
links, ProposedMutationBundle, vendor prepayment subdomain,
exception queue). Template learning is its own complex subsystem
that interacts with the Relationship Router. Adding auto-post on
top of all of this multiplies the failure modes the v1 acceptance
testing has to cover.

The trade is explicit: v1 collects clean-approval evidence
(clean_approval_count on `vendor_rules`) but does not promote
rules autonomously. The Vendor-Template-as-Autonomy-Rule ADR is
drafted in Phase 0 but its enforcement lands in v1.5 or later.

This buys back enough complexity to make the substrate work
tractable.

## 12. Q28 evolution — explicit dependency

The original brief's Q28 was "re-verification matrix at the
Tier 2 → Tier 1 boundary." Under this reframe, Q28's surface
area grows substantially. The matrix has to cover four distinct
re-verification surfaces:

- **Document-type-aware field re-verification.** Different fields
  matter for invoices vs receipts vs credit memos vs vendor
  statements. The matrix is per-document-type, not generic.
- **Relationship-claim re-verification.** Was the receipt-to-bill
  match correct? The Router can produce plausible-but-wrong
  matches (right vendor, right amount, wrong bill). Tier 1 must
  re-verify the match before commit. Specifically:
  - The receipt still matches the candidate Bill #N.
  - The candidate vendor_prepayment still has remaining balance
    sufficient for the application amount.
  - The candidate credit memo still applies to the selected bill.
  - The Tier-2 vendor match still resolves to the same vendor at
    commit time (vendor master may have been merged or renamed).
- **Stale-state re-verification (time-of-check / time-of-use).**
  The killer concurrency hazard. A proposal sits in the queue
  for an hour while the user reviews it; the underlying state
  may have changed:
  - Bill #N is still in `posted` state (not paid by another
    mutation while the proposal was pending).
  - The vendor_prepayment row still has the same remaining
    balance (not applied by another mutation in the meantime).
  - The vendor_credit row still has unapplied balance.
  - The ledger period containing the bill's accounting_date is
    still open.
  - The vendor's bank-detail-confirmation flag has not flipped
    since the proposal was generated.
  Without these checks, the same prepayment can be applied
  twice, the same bill paid twice, or a stale-period bill posted
  into a since-locked period. Stale-state checks fire at commit
  time inside `withInvariants()`; the matrix specifies which
  reads each commit path performs.
- **Bundle re-verification.** Does the compound mutation
  actually balance to zero? A born-paid bundle that posts
  `Dr Expense $100 / Cr AP $100` then fails to post the matching
  `Dr AP $100 / Cr Bank $100` due to a downstream service error
  must roll back atomically per the ProposedMutationBundle ADR
  (which absorbs the Bundle Atomicity decision per §7).

**The matrix lands before v1 ships, not before v1 codes.** Q28
filing remains an open question gate in `agent_architecture_policy.md`
(per the original brief §12). The expansion this reframe forces
on Q28 is captured in the Document Platform ADR's §"Q28
Evolution" subsection and in the Relationship Router ADR's
re-verification contract.

## 13. New open questions surfaced by this reframe

Filing happens in a separate prompt cycle. The next-available
Q-number after Q52 is Q53. Each question follows the discipline
"a good open question has unresolved decision space; a bad open
question just restates a decision."

- **Q53** — Document-type enum: which document types are active
  in v1, which are reserved per ADR-0010, and what
  classification-confidence threshold routes to exception vs
  proposal? Decision space: which types ship classification
  in v1 (`vendor_invoice`, `receipt`, `payment_confirmation`,
  others?) and which sit reserved.
- **Q54** — Document case lifecycle: which states are active in
  v1, which are reserved, and which transitions must be
  enforced by service-layer guards? Decision space: not the
  state names (those are decided), but which transitions get
  service-layer enforcement vs UI convention.
- **Q55** — Polymorphic `source_document_links` enums: which
  `linked_entity_type` values and `link_role` values are active
  in v1, which are reserved, and which `(entity_type, role)`
  pairs are valid? Decision space: the per-pair validity matrix
  and which pairs the Document Platform's `documentLinkService`
  rejects.
- **Q56** — Relationship Router re-evaluation triggers: when
  does a previously unmatched document get re-classified after
  new domain state lands? Decision space: which domain events
  (new bill posted, vendor merged, period reopened) trigger
  Router re-runs, and how the audit trail represents the
  change of routing decision.
- **Q57** — Confidence calibration governance: who calibrates
  thresholds, against what test set, how often, with what audit
  trail? Decision space: org-configurable vs system-fixed for
  v1 (cf. Q23 on agent ladder thresholds), reviewer authority
  for changes, and what changes when a threshold moves
  (re-evaluate prior decisions or not).
- **Q58** — ProposedMutationBundle atomicity at the DB
  transaction layer: how does Tier 1 enforce all-or-nothing
  bundle commit, and how does the Logic Receipt represent
  bundle children? Decision space: single transaction vs saga
  with compensating reversals, and the audit-log shape for
  bundle commits.
- **Q59** — Vendor prepayment object shape: types
  (retainer / deposit / advance / security_deposit / etc.),
  statuses, payment-purpose discriminator linkage, application
  logic. Decision space: which prepayment types ship as active
  v1 enum values vs reserved.
- **Q60** — Born-paid bill bundle approval gate: Always Confirm
  at first; later auto-post under what specific rules? Decision
  space: thresholds, vendor-rule applicability, controller
  authority. Tied to post-v1 auto-post per §11.
- **Q61** — Vendor prepayment approval gate: can AP specialist
  record without controller approval if already paid
  (after-the-fact classification)? Decision space: separate
  approval rule for future-cash retainer vs after-the-fact
  retainer classification.
- **Q62** — Deposit tax treatment: recoverable tax at deposit
  date vs final invoice date. Decision space: jurisdiction
  default + per-org override + per-document override; default
  to `review_required` until explicit choice.
- **Q63** — Vendor balance view composition: which components
  combine into "vendor balance"? Open AP, unapplied vendor
  credits, open vendor deposits/retainers, accrued unbilled.
  Decision space: which composition the Spend brief specifies
  for v1 reporting.
- **Q64** — Final invoice with prior deposit credit but no
  matching vendor prepayment: backfill, treat as discount,
  treat as vendor credit, or send to review? Decision space:
  default routing + override mechanism.
- **Q65** — Document type classifier confidence thresholds:
  per-type calibration, exception-queue routing rules.
  Subordinate to Q57.
- **Q66** — Tier 2 / Tier 2.5 / Tier 1-pre-commit placement of
  the Relationship Router (per §9). Decision space: (a) amend
  ADR-0007, (b) introduce Tier 2.5, (c) place in Tier 1.
- **Q67** — Domain boundary: which domain owns
  `bank_transactions` and `card_transactions`? Banking
  (reconciliation), Spend (payments outgoing), or shared?
  Decision space: ownership, cross-domain protocols, and which
  ADR (Document Platform vs a future Banking Subdomain ADR)
  decides the cut.
- **Q68** — Exception queue UX: bulk operations,
  reclassification flow, document-type-aware actions, first-
  class screenshot gate. Decision space: which actions ship as
  active in v1 vs reserved.
- **Q69** — Replayability: re-running extraction when the OCR
  engine improves. Decision space: `ocr_runs` /
  `extraction_runs` table separation, supersession semantics,
  whether replays auto-supersede or require explicit promotion.
- **Q70** — Idempotency at the OCR layer: hash bytes on
  ingestion, short-circuit duplicate processing. Decision
  space: short-circuit policy (skip Modal entirely or re-run
  with cached artifact), and whether the same hash from a
  different channel still short-circuits.
- **Q71** — Document-type classification strategy: rules vs
  templates vs small-model classifier vs LLM fallback vs
  fine-tuned classifier. Decision space: which strategies ship
  in v1's classifier and the fallback ordering.
- **Q72** — AI fallback contract: when can AI be called, what
  artifact + snippets can it see, what JSON does it return,
  how does it feed Q28 re-verification? Decision space: the
  exact input/output contract and the validation gate before
  AI output enters the proposal pipeline.
- **Q73** — Per-org Document Platform configuration: storage
  provider, OCR provider, allowed channels, retention policy,
  confidence thresholds, language packs. Decision space:
  which knobs are per-org vs system-fixed for v1.
- **Q74** — Receipt v1 path: AP-completion evidence only,
  standalone expense via exception queue, full receipt
  subdomain, or the decision-matrix split in §15? Decision
  space: which receipt scenarios get full proposal generation
  vs exception routing in v1.
- **Q75** — Document case source cardinality: when is one case
  built from multiple source documents (email body + invoice
  PDF; final invoice + retainer agreement; statement + several
  invoices)? Decision space: which patterns ship case-source
  bundling in v1 vs route to manual linking.
- **Q76** — Re-evaluation policy: when relationships are re-run
  (per Q56), which decisions are immutable, which are
  superseded with audit, and which require user approval to
  change? Decision space: the immutability boundary and the
  audit-log shape for re-routed decisions.
- **Q77** — Q28 evolution scope: how does the existing Q28
  re-verification matrix expand to cover document-type-aware
  fields, relationship-claim re-verification, stale-state
  checks, and bundle re-verification (per §12)? Decision
  space: matrix shape and which checks are Layer 1 schema /
  Layer 2 service / Layer 3 review.
- **Q78** — Payment failure / reversal lifecycle. v1 currently
  has `paid` as a terminal state and `reversed` for corrections,
  but doesn't address the operational reality that payments can
  fail post-execution: wire bounced (insufficient funds at
  sender, account closed at receiver, KYC hold), ACH returned
  (NSF, account closed), card charge disputed and reversed,
  cheque bounced, bank reversed for compliance. Decision space:
  whether to add a `failed` payment state with transition rules
  (`paid → failed → bill returns to approved_for_payment via
  reversal entry`); the ledger semantics of failure (auto-reverse
  vs proposal-and-confirm); which v1 phase ships failure
  handling (Phase 5 AP foundation has it as an exit-criterion vs
  Phase 5 ships paid-only and failure handling lands post-v1).
  This is genuinely v1-relevant because the founder + 2 real
  users will experience payment failures within months of going
  live; the absence of an explicit path means manual reversal
  entries that would violate Reading B.

This list is illustrative; the actual Q-filing prompt cycle
will refine names, gating, and which questions merge or split.

## 14. Scenario A and the `ProposedAttachment` concept

A subtle architectural question surfaced in the receipt-pattern
discussion. Three patterns exist:

- **Scenario A.** Receipt is *supporting evidence* for a payment
  that is already recorded. No ledger mutation. Just attach.
- **Scenario B.** Receipt *triggers* payment of an existing bill.
  Routes to `record_bill_payment`.
- **Scenario C.** Standalone POS receipt with no matching bill.
  Routes to `ProposedMutationBundle(post_bill +
  record_bill_payment)`.

B and C produce ledger operations and fit the
`ProposedMutation` / `ProposedMutationBundle` pipeline cleanly.
**A produces no ledger operation** — yet `attach_payment_evidence`
is currently listed as an "intent variant" alongside the others.
Per the new lede ("domain services produce ledger operations"),
calling A a `ProposedMutation` is misleading: nothing mutates.

**Decision: introduce `ProposedAttachment` as a sibling concept
to `ProposedMutation`.** Both flow through the same proposal
queue and use the same approval UI shape (Four Questions
grammar from `intent_model.md` §5), but they differ in
commit-path semantics:

- `ProposedMutation` and `ProposedMutationBundle` commit through
  domain services that produce ledger operations via the ledger
  service (Reading B per §5).
- `ProposedAttachment` commits through the Document Platform's
  `documentLinkService.create()` — it writes a row to
  `source_document_links` with the appropriate `link_role` and
  produces no journal entry, no audit-log entry on accounting
  state, and no ledger operation. It still writes an audit-log
  entry on the document layer (the `documentLinkService` mutation
  itself is audited).

Variants that ship as `ProposedAttachment` rather than
`ProposedMutation`:

- `attach_payment_evidence` — Scenario A.
- `attach_invoice_to_existing_bill` — invoice arrives after a
  manual bill was created without evidence.
- `attach_supporting_document_to_bill` — secondary documents
  (correspondence, contracts).
- `attach_statement_to_vendor_reconciliation` — vendor statement
  in reconciliation flow.
- `attach_retainer_agreement_to_prepayment` — retainer agreement
  evidence for an existing `vendor_prepayment` row.

The Document Platform ADR specifies the `ProposedAttachment`
contract; the Spend Initiative ADR specifies which Spend variants
ship under it. The `interaction_model_extraction.md` mapping per
§20: `ProposedAttachment` is also Primitive 1 (Proposal) with a
non-mutating composite payload — no new primitive needed.

## 15. Receipt v1 decision matrix

The original brief locked v1 to "no photo capture, no Python
sidecar, deterministic TS extraction only." Under this reframe,
those locks are reframed as **three independent decisions per
capability**, not one bundled receipt-stance choice:

| Capability | v1 | v2+ | Notes |
|---|---|---|---|
| Image receipt ingestion (file upload, drag-drop, forwarded mailbox) | ✅ | — | Substrate must accept all file types; saying no contradicts the Document Platform reframe. |
| Image OCR extraction (`DocumentArtifact` production from images) | ✅ — single OCR engine | — | Engine choice (PaddleOCR / Tesseract / Claude vision / etc.) and Python-sidecar deployment topology (Modal / Azure GPU VM / self-hosted), language boundary (HTTP between TS and Python), trace propagation, model versioning, rollback strategy, and provider swap path **all land inside the Tier 2 Document Pipeline ADR**. The OCR engine is a swap-target behind the `DocumentArtifact` contract. **Reframe-supersession note:** the original AP brief excluded the Python OCR sidecar because AP v1 was digital-PDF-only. The Document Platform reframe supersedes that exclusion: the OCR sidecar question now belongs entirely to the Tier 2 Document Pipeline ADR, and no extraction code begins until that ADR is ratified. |
| Receipt-as-payment-evidence (Scenario A) | ✅ | — | Routes to `ProposedAttachment(attach_payment_evidence)`. No ledger mutation. |
| Receipt-as-payment-trigger (Scenario B) | ✅ | — | Routes to `ProposedMutation(record_bill_payment)`. |
| Standalone POS receipt → born-paid bundle (Scenario C) | ❌ → exception queue | ✅ | Defers until Spend domain matures. v1 routes to exception with manual born-paid workflow available — see "Manual born-paid workflow" callout below. |
| Receipt-to-bill matching, single high-confidence one-to-one | ✅ | — | Relationship Router responsibility. High-confidence single-match is the load-bearing v1 capability for AP-completion receipts (Scenario B). |
| Receipt-to-bill matching, ambiguous / multi-match disambiguation UX | **Conditional on Q56 / Q68 ratification** | ✅ | Multi-match resolution is valuable but is policy/UX territory, not a direct v1 implementation approval. v1 ships only after Q56 (re-evaluation triggers) and Q68 (exception-queue UX) resolve. Until then, multi-match cases route to the exception queue. |
| Vendor statement classification + reconciliation | ❌ classification only | ✅ full reconciliation | v1 classifies and routes to exception queue (manual reconciliation). v2+ ships full reconciliation flow. |
| Credit memo classification + manual application | ❌ classification only | ✅ automated application | v1 classifies and routes to exception queue (manual `post_vendor_credit`). v2+ ships automated bill-application. |
| Retainer / deposit ingestion | ✅ classification + manual workflow | ✅ automated matching | v1 classifies, ships manual `record_vendor_prepayment` flow. Retainer-to-final-invoice matching ships in v2+. |
| Bank/card statement ingestion | ❌ → exception queue | ✅ Banking domain | Out of v1 scope; routes to exception. |
| Customer invoice (AR) ingestion | ❌ → exception queue | ✅ AR domain | Out of v1 scope; routes to exception. |
| Tax form ingestion | ❌ → exception queue | ✅ Tax domain | Out of v1 scope; routes to exception. |

This decision matrix replaces the original brief's binary
"receipts in v1 vs receipts out of v1" framing with a
capability-by-capability split. The architectural ask is that
the substrate accept everything in column 1 and Spend domain
implement only the rows marked ✅ for v1.

The OCR engine choice and the Python sidecar question are
**resolved as v1 deliverables**, not deferred — but the engine
is a swap-target behind the `DocumentArtifact` contract per the
Tier 2 Document Pipeline ADR, so this is not a long-term lock-in.

**Reconciliation-metadata preservation requirement (born-paid
bundles).** Even though bank/card statement ingestion is post-v1,
v1 born-paid bundles (Scenario C, manual workflow) **must
preserve enough metadata on the resulting `payments` row to
support v2 bank/card reconciliation without backfill**. At
minimum, the payment row captures: `payment_method`, last-4 of
card or bank account identifier, merchant identifier from the
receipt, authorization / reference number, and the
transaction-as-it-would-appear-on-statement date (which may
differ from the posting date). Without this preservation, v2
reconciliation becomes a backfill operation against records
already in production. The preservation requirement lands in the
AP/Spend Subdomain ADR's `payments`-row schema; the metadata
extraction itself rides the Document Platform's
`DocumentArtifact` output for receipts.

**Manual born-paid workflow callout.** The "manual born-paid
workflow available" cell above is not a permission to bypass the
bill abstraction. The manual path uses the same domain service
the automated bundle eventually uses:
`billService.postWithImmediatePayment(...)` — which accepts a
born-paid bundle, produces ledger operations via
`ledgerService.post(...)` for both legs (Dr Expense / Cr AP, then
Dr AP / Cr Bank-or-Card), and links the receipt as
`primary_invoice` and `payment_evidence` via
`documentLinkService.create()`. Manual differs from automated
only in **how the bundle was proposed** (human-authored vs
classifier-routed), not in **what commits to the ledger**. This
prevents implementation drift between the manual and automated
paths and prevents implementers from posting a direct generic
journal entry that bypasses the bill / payment subledger
abstraction (which would violate Reading B per §5).

**Vendor bank-detail-change hard rule (callout for the Spend
brief).** When the AP brief is renamed and pruned per §3.2, the
System-ceiling rule for vendor bank-detail changes must appear
as an explicit **callout** in the Spend Initiative brief's
vendor-master section, not just as a parenthetical reference to
`agent_autonomy_model.md` §6 Item 2. The required callout text:
"Hard rule: vendor bank-detail changes are Always Confirm /
System ceiling. Extracted invoice or payment instructions may
suggest a bank-detail change but may never update the vendor
master automatically. Independent verification (out-of-band
confirmation with the vendor) is required." This is the most
important AP fraud control the system has; it deserves callout
visibility, not parenthetical visibility.

## 16. Document lifecycle immutability rules

Replayability — re-running extraction when the OCR engine
improves — is a load-bearing capability of the Document Platform.
Without explicit immutability rules, "we re-ran extraction with a
better model" can silently mutate prior decisions and break the
audit trail.

Four immutability rules apply to the document lifecycle:

1. **`ocr_runs` (extraction artifact rows) are immutable.** A
   re-extraction produces a new `ocr_run` row that supersedes
   the prior one via `supersedes_ocr_run_id`. The prior row is
   never updated or deleted.
2. **`extraction_runs` (TS extraction result rows) are immutable
   per `(source_document_id, ocr_run_id, extraction_version)`
   tuple.** Re-running TS extraction against a new `ocr_run`
   produces a new `extraction_run` row.
3. **`document_relationship_candidates` are versioned.** When the
   Relationship Router re-runs (per Q56), it produces a new
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
supersession columns) and at the service layer (no UPDATE
statements against immutable rows; only INSERT-of-successor or
soft-delete-via-`status`-flip).

The four rules land in the Document Platform ADR's
"Replayability" section. Q69 (per §13) covers the operational
policy on when replays auto-supersede vs require explicit
promotion.

## 17. Multi-entity reservation

If CHOUnting serves family-office or multi-entity setups (and the
"founder + 2 real users" framing in the original brief implies
this is a real direction), `org_id` will not be a sufficient
entity boundary forever. Documents may be addressed to one entity
and paid by another; intercompany due-to / due-from arises;
wrong-entity exceptions need their own routing path.

Adding entity reservations now is cheap; retrofitting them is
hard. Three reservations land at the schema layer in v1, even
though full intercompany support is post-v1:

- **`source_documents.legal_entity_id`** (nullable, reserved).
  The legal entity the document is addressed to. May differ from
  `org_id`. Defaults to `org_id` in v1; nullable column reserves
  the seat for multi-entity orgs.
- **`bills.legal_entity_id`** (nullable, reserved). The legal
  entity that owns the AP bill. The document mentions one entity;
  the bill belongs to one entity; the payment may be made by
  another entity (per `payments.paying_entity_id` below). In
  single-entity setups equals `org_id`. The bill-level
  reservation matters because v1 reporting (AP aging, vendor
  balance, paid bills history) groups by org/entity; without
  this column, multi-entity reporting requires retrofit.
- **`bill_lines.benefiting_entity_id`** (nullable, reserved).
  Allocation-level entity. A single bill paid centrally may
  benefit multiple legal entities via line-level allocation.
  Reserved for future intercompany due-to / due-from postings.
- **`payments.paying_entity_id` and
  `payments.benefiting_entity_id`** (nullable, reserved). The
  entity that paid and the entity that benefits. In single-entity
  setups both equal `org_id`. In multi-entity setups they may
  differ — paying_entity_id signals which bank account moved
  cash, benefiting_entity_id signals which entity carries the
  expense.
- **Reserved exception type: `wrong_entity_exception`**. Document
  is addressed to a legal entity not currently configured in the
  org. Routes to controller review; manual override available.

Intercompany due-to / due-from postings are post-v1. The reserved
seats let the platform absorb multi-entity workflows when they
land without retrofit.

## 18. Scenario coverage appendix

The CTO discussion enumerated ~50 scenarios across receipts,
retainers, vendor credits, statements, bank/card reconciliation,
corrected documents, and period/tax/entity issues. Most are
deferred past v1, but they collectively serve as a coverage check
for the architecture. When the Document Platform brief and Spend
Initiative brief are drafted, every scenario must pass four
checks:

1. **Ingestion.** Can the platform ingest the document type?
2. **Classification.** Does the classifier have a type for it
   (active or reserved)?
3. **Relationship.** Does the Relationship Router have a
   relationship candidate for it?
4. **Intent.** Does the intent router have either an intent type
   or an explicit exception path for it?

If any scenario can't pass these four checks, the architecture
has a gap. The full ~50-scenario list is captured in the CTO
discussion thread referenced from §19 (Review history). It will
be transcribed as a verification appendix in the Document
Platform brief.

Scenario categories the appendix covers:

- **Receipts:** evidence-only / payment-trigger / born-paid /
  paid-personally / amount-mismatch / multi-match / no-bill-no-card.
- **Retainers / deposits:** unpaid request / paid-before-invoice /
  applied-to-final / exceeds-final / less-than-final / refunded /
  forfeited / multi-bill / unrecorded-prior-credit.
- **Vendor credits:** against-unpaid-bill / after-paid-bill /
  unapplied / future-bill / vendor-refund / negative-invoice
  misclassification.
- **Statements:** matches-open-AP / missing-invoice /
  missing-payment / missing-credit / total-mismatch.
- **Bank/card reconciliation:** card-line-matches-receipt /
  card-without-receipt / receipt-without-card / bank-debit-no-bill /
  pending-wire / failed-payment / bank-fee-deducted.
- **Corrected documents:** before-posting / after-posting /
  after-payment / resent-with-changes / mid-batch-supersession /
  revision-of-revision.
- **Period / tax / entity:** invoice-in-closed-period /
  service-period-crosses-months / prepaid-amortization /
  deposit-tax-timing / wrong-entity / intercompany /
  multi-currency.

## 19. What this reframe does NOT do

- Does not invalidate the AP-domain decisions in the original
  brief. The vendor prepayment subdomain, polymorphic links,
  ProposedMutationBundle, born-paid bill handling, manual AP
  foundation, storage-provider abstraction — all carry forward.
- Does not authorize building any v1 code yet. The eight Phase 0
  ADRs in §7 are hard prerequisites, plus Q28 evolution per §12.
- Does not modify ADR-0001, ADR-0002, ADR-0003, ADR-0005,
  ADR-0006, ADR-0008, ADR-0009, ADR-0010, the Agent Ladder, the
  Authority Gradient, the Two Laws, the Service Communication
  Rules, or any existing invariant in `docs/02_specs/invariants.md`.
- Does not amend `CLAUDE.md` §4 — that work remains deferred to
  ADR-0007 per Q27.
- Does not edit `docs/02_specs/open_questions.md`. Q53–Q78+
  filing is a separate prompt cycle.
- Does not edit `docs/09_briefs/phase-2/triage_bucket_intake.md`.
- Does not edit `docs/09_briefs/phase-2/interaction_model_extraction.md`.
- Does not commit to a Banking, AR, Tax, or Assets initiative.
  Those are future briefs that will consume the Document
  Platform.
- Does not generalize Document Core into a non-accounting
  document management system. Document Core is the bridge between
  uploaded evidence and accounting domain proposals; it is not
  a generic file vault.

## 20. Verification against existing artifacts

This spec has been verified against:

- `docs/09_briefs/phase-2/ap_ingestion_initiative.md` (T2/T3-amended
  2026-05-02 state) — the pre-reframe canonical brief. The
  decisions captured here either preserve or extend that brief's
  decisions; nothing is contradicted.
- `docs/03_architecture/phase_simplifications.md` — Simplification 3
  ("AP Agent as the second real agent informing what shared
  agent-platform infrastructure is actually needed"). The
  reframe operationalizes Simplification 3 rather than amending
  it: the AP Agent remains the second real agent (after the
  Phase 1 Double Entry Agent), and the Document Platform is the
  shared substrate that the AP Agent's exercise reveals as
  needed. The discipline "no platform abstraction until two
  systems prove the need" is preserved by treating receipts /
  retainers / statements as the second class of consumer that
  the platform must accommodate alongside AP bills.
- `docs/02_specs/intent_model.md` — `ProposedMutation` shape
  (§3) and the Four Questions grammar (§5). The
  `ProposedMutationBundle` extension rides the existing shape;
  the Four Questions grammar applies per-child-mutation, with
  the bundle card aggregating.
- `docs/09_briefs/phase-2/interaction_model_extraction.md` — the
  five API primitives that ProposedMutation rides on. Per
  `agent_architecture_proposal.md` §5, "Tier 2 stages produce
  objects that map to Primitive 1 (Proposal)." A
  `ProposedMutationBundle` maps to Primitive 1 (Proposal) with a
  composite payload — no new primitive is needed. The
  `interaction_model_extraction.md` brief is **not** edited by
  this reframe; the bundle extension is a payload-shape
  decision inside Primitive 1, not a new primitive.
- `docs/02_specs/ledger_truth_model.md` — Service Communication
  Rules and the Authority Gradient. Reading B (§5 of this spec)
  is what these documents already imply.
- `docs/02_specs/agent_autonomy_model.md` — System ceiling list
  (§6 Item 2). Bank-detail-confirmation remains a System
  ceiling; bundle commits inherit ceiling enforcement per child
  mutation.
- `docs/02_specs/invariants.md` — registered prefixes and
  bidirectional reachability. The Document Platform ADR
  introduces a new `DOC` prefix for the evidence-completeness
  candidate (per §3.2 invariant disposition); the `AP` prefix
  registration from the original brief still happens via the
  AP/Spend Subdomain ADR.
- `docs/09_briefs/phase-2/agent_architecture_proposal.md` — Tier
  1/2/3 framework. Tier 2 scope and Q27 wording are the open
  dependencies surfaced in §9 of this spec.

No architectural conflicts surfaced.

## 21. Review history

- **2026-05-01** — Original AP Ingestion Initiative brief landed
  (CTO consolidated-action document, founder paste).
- **2026-05-02 morning** — T2/T3 review pass on the original
  brief; 15 review items applied.
- **2026-05-02 afternoon** — CTO discussion surfaced
  receipt-vs-bill scope, retainer/deposit subdomain gap, and
  Document Platform reframe. Three external reviewer voices
  contributed; founder confirmed Option A.
- **2026-05-02 evening** — This design spec written via
  brainstorming skill. Saved to
  `docs/09_briefs/phase-2/document_platform_reframe_design.md`.
- **2026-05-02 round-3 review pass** — Three converging review
  voices (in-thread, external CTO, round-3) flagged 23 amendment
  items. Applied: §1 motivation pivoted from volume to shape
  reasoning; §4 lede tightened to canonical five-sentence form;
  §3.1 added `document_case_sources` table, expanded document-
  type enum (added `contract`, `payroll_document`,
  `asset_purchase_support`), noted triage-bucket UX ownership;
  §3.2 added `payment_purpose` discriminator, complete migration
  table for every section of the original brief, invariant
  disposition for INV-AP-001/002, INV-AGENT-NNN, and the new
  INV-DOC-NNN candidate; §6 enumerated `link_role` enum
  alongside `linked_entity_type`; §7 ADR list reduced from 10 to
  8 (Bundle Atomicity merged into ProposedMutationBundle, Domain
  Boundary Map merged into Document Platform), Vendor Template
  ADR scope clarified (substrate-only in v1, full enforcement
  post-v1), per-ADR phase-gating discipline added; §9 added
  Option (c) (Router in Tier 1) and Q27 wording dependency;
  §12 sharpened Q28 to four re-verification surfaces including
  stale-state TOCTOU checks; §13 rewrote Q54/Q55/Q63 as proper
  questions, added Q71–Q77 (classifier strategy, AI fallback
  contract, per-org config, receipt v1 path, case source
  cardinality, re-evaluation policy, Q28 evolution scope); §15
  Receipt v1 decision matrix replaces Path A/B/C framing; new
  §14 introduces `ProposedAttachment` for Scenario A; new §16
  document lifecycle immutability rules; new §17 multi-entity
  reservation; new §18 scenario coverage appendix; §20
  verification list extended with `phase_simplifications.md` and
  `interaction_model_extraction.md`. Section count grew from 16
  to 21.
- **2026-05-03 round-4 review pass** — Final external CTO review
  converged with prior reviewers on six required fixes plus
  three new strongly-suggested additions. Applied: Q-range
  updated from Q53–Q70+ to Q53–Q78+ everywhere; §15 receipt-to-
  bill matching split into v1-confirmed (single high-confidence
  one-to-one) vs Q56/Q68-conditional (multi-match
  disambiguation); §15 OCR-engine row clarified that Python
  sidecar deployment topology, language boundary, trace
  propagation, model versioning, rollback, and provider-swap
  strategy all land inside the Tier 2 Document Pipeline ADR
  with explicit reframe-supersession note; §17 added
  `bills.legal_entity_id` and `bill_lines.benefiting_entity_id`
  reservations alongside the existing source-document and
  payment entity columns; §15 added reconciliation-metadata
  preservation requirement for born-paid bundles (last-4 of
  card / merchant identifier / authorization reference /
  statement-date) so v2 reconciliation does not require
  backfill; §15 added manual born-paid workflow callout
  specifying that the manual path uses the same
  `billService.postWithImmediatePayment(...)` domain service as
  the automated bundle, preventing Reading B violations; §15
  added vendor-bank-detail-change hard-rule callout text and
  §3.2 drafting requirement that the Spend brief carry it as a
  callout, not a parenthetical; §13 added Q78 (payment failure
  / reversal lifecycle) covering wire-bounced / ACH-returned /
  card-disputed / cheque-bounced cases and the ledger semantics
  of failure handling. Three round-4 items deferred to brief
  drafting (anchor statement at top of Document Platform brief,
  resolution-action enum, ProposedAttachment policy/audit
  refinements) per the converged review. Spec considered ready
  for writing-plans handoff.
- **Next steps** — (a) brief drafting cycle: Document Platform
  Initiative brief drafted; AP Ingestion Initiative brief
  renamed to Spend Initiative and pruned per §3.2 migration
  table. (b) Open-questions filing cycle: Q53–Q78 filed in
  parallel with brief drafting (not after — per round-3
  recommendation). (c) ADR drafting cycle: eight ADRs from §7
  drafted; ratification gates Phase 1+ code (drafted ≠ ratified).
  (d) writing-plans skill produces the implementation plan from
  this spec + the two drafted briefs.
