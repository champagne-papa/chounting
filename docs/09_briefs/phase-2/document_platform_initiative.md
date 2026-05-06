# Document Platform Initiative — Phase 2 Brief

**Status:** Ratified per Phase 0 closure verification 2026-05-04 (Session 2F).
Substrate brief that the AP/Spend Initiative and future domain
initiatives consume. Status header + §15 Phase 0 prerequisites + §17
open questions + §21 review history finalized at Phase 0 closure;
substantive content sections (§1–§14, §16, §18–§20) deferred to
Phase 1 implementation onset per the substrate-now-enforcement-later
cross-pattern (per `docs/09_briefs/phase-2/2026-05-04-d6-ratification-package.md`
§6.8 codified Phase 0 governance lesson + ADR-0010 amendment Variant
A precedent at commit `797db40`). Substantive section content fills
in alongside Phase 1 (Storage / Evidence Core) implementation work
that consumes the corresponding ratified ADR content. NOT authorized
for code outside Phase 1 scope.

**Date:** 2026-05-03

**Resolution path:** Eight Phase 0 ADRs (per
`docs/09_briefs/phase-2/document_platform_reframe_design.md` §7) +
26 open questions (Q53–Q78) + four dependent-artifact updates
before any v1 code lands.

**Relationship to existing architecture:** Operationalizes
Simplification 3 from `docs/03_architecture/phase_simplifications.md`
(AP Agent as the second real agent informing what shared
agent-platform infrastructure is actually needed). The
Document Platform is what the AP Agent's exercise reveals as the
right substrate shape once receipts, retainers, statements,
credits, and other non-AP-bill document types are in scope.
Supersedes the substrate-shaped portions of the
2026-05-01 AP Ingestion Initiative brief; consumes the Authority
Gradient, Agent Ladder, Two Laws, Service Communication Rules,
and existing invariants from `docs/02_specs/`.

> **Document Platform is the foundation.**
> **AP/Spend is the first domain.**
> **Extraction is a feeder.**
> **Domain services produce ledger operations; the ledger service
> is the only writer of journal entries.**
> **Existing CHOUnting mutation and invariant discipline remains
> the authority.**

## Conceptual anchor

Documents are evidence. Bills, payments, prepayments, credits,
applications, statements, and reconciliations are
accounting/domain objects. A document may create, support,
modify, settle, or reconcile an accounting object — but a
document is never itself an accounting transaction.

---

## 1. Why this initiative exists

The original AP Ingestion Initiative brief (CTO-reviewed
2026-05-01) locked v1 to AP bills only. CTO discussion immediately
post-lock surfaced that receipts, retainers, deposits, vendor
statements, credit memos, bank and card transactions, and
customer-side AR documents do not fit the AP bill lifecycle —
regardless of volume — because each carries a different
accounting destination. Forcing them into the `post_bill` shape
produces wrong accounting.

The reframe was architectural, not scope-cutting. ADR-0011
`## Context → Why a Document Platform substrate exists`
(`docs/07_governance/adr/0011-document-platform.md` lines 33-66)
captures the load-bearing finding verbatim:

> The reframe spec §1 landed on the architectural framing: **AP is
> not the foundation. The Document Platform is the foundation.
> AP/Spend is the first domain consumer.**

The shape-diversity argument is the core: **shape, not volume,**
is why the substrate must precede any single domain. A foundation
that only handles AP forces wrong accounting for every document
type that doesn't fit; a foundation that codifies the substrate-
shape diversity correctly lets each domain consume its own subset
cleanly.

ADR-0011 enumerates eight downstream ADRs the spine carries:
ADR-0012 (ProposedMutationBundle), ADR-0013 (Storage Provider),
ADR-0014 (Tier 2 Document Pipeline), ADR-0015 (AP/Spend Subdomain),
ADR-0016 (Document Relationship Graph), ADR-0017 (Vendor Template
substrate), ADR-0018 (Relationship Router), ADR-0019 (Confidence
Calibration Policy). Each forward-points to ADR-0011 for the
substrate contract; this brief is the Phase 2 deliverable that
operationalizes the substrate at code grain.

This brief operationalizes Simplification 3 from
`docs/03_architecture/phase_simplifications.md` — the substrate
that the AP Agent's exercise revealed needs to exist. Phase 2
ratifies the substrate; Phase 5 (deferred) ships the AP/Spend
domain as the first consumer; subsequent phases ship Banking, AR,
and Tier 2.5 Relationship Router subsystems as additional
consumers.

Reading B is preserved by construction. ADR-0011 names the rule
non-negotiable for every downstream ADR:

> The Document Platform is not a domain service in the Reading B
> sense — it does not produce ledger operations. It produces
> *proposals*. Domain services consume those proposals, decide
> whether to commit, and route the commit through the ledger
> service.

ADR-0012, ADR-0014, ADR-0015, and ADR-0018 each inherit this rule.
A future contributor who proposes a Document Platform path that
calls `ledgerService.post(...)` directly is proposing a violation
of Reading B; the rule lives at ADR-0011 so the violation is
visible.

## 2. Locked v1 scope

Per ADR-0010 amendment Variant A precedent (NULL-default forward-
compatible config-column reservation) + the substrate-now-
enforcement-later cross-pattern codified at the D6 ratification
package §6.8 (`docs/09_briefs/phase-2/2026-05-04-d6-ratification-package.md`),
v1 scope splits three ways: in-scope (substrate ratified + active
in v1), out-of-scope (Phase 5 or post-v1 explicitly named), and
reserved-but-not-emitted (substrate ratified, defined in schema,
not emitted by any v1 write path).

ADR-0010 frames the substrate-shape mechanism; the D6 §6.8
codification frames the forward-compatibility mechanism. They
compose: substrate ratified at Phase 0; enforcement landing at
Phase 1 implementation or v1 ship.

### v1 in-scope (substrate ratified + active in v1)

**Storage substrate (ADR-0013).**

- `storageProviderService` typed contract surface (put / fetch /
  fetchVersion / previewUrl / delete / verifyIntegrity).
- `supabase_storage` provider implementation; SHA-256 pre-write
  + re-read verification; `source_documents.storage_status =
  'available'` post-ingestion.
- Failure-classification matrix shared across providers;
  drift-detection contract.
- Phase 1 (Storage / Evidence Core) closed at PR #8 / `b900bdd`
  on 2026-05-06; this v1 substrate is shipping code.

**Document Core (ADR-0011).**

- `document_cases` 10-state lifecycle (`received → extracting →
  classified → matched → proposed → needs_review → approved →
  committed → rejected → archived`). All transitions service-
  layer-enforced (Layer 2).
- `document_case_sources` link role v1-active subset (`primary`,
  `supporting`, `email_body`, `payment_evidence`).
- `document_artifacts` engine-agnostic contract (per ADR-0011 §5).
- Document-type discriminator v1-active subset (`vendor_invoice`,
  `receipt`, `payment_confirmation`, `unknown`).
- Exception queue first-class deliverable per ADR-0011 §13:
  document-type-aware actions, reclassification workflows, bulk
  operations, screenshot-gate UI ratification.
- Resolution-action enum v1-active subset (`attach_to_existing_bill`,
  `attach_to_existing_payment`, `record_bill_payment`,
  `mark_duplicate`, `mark_non_accounting`, `route_to_manual_entry`,
  `reprocess`, `archive`).
- Polymorphic `source_document_links` per ADR-0016 ratified
  validity matrix.

**Tier 2 Document Pipeline (ADR-0014).**

- 8-stage deterministic TS orchestrator (`dedupByHash` →
  `storageProviderService.fetch()` → `runOCR` →
  `classifyDocumentType` → `extractFields` → `matchVendor` →
  `matchAgainstExistingState` → `buildProposal`).
- Pipeline NOT wrapped in `withInvariants()` — produces proposals,
  not commits; Tier 1 wraps the commit step.
- PaddleOCR v1 OCR engine; Modal v1 Python sidecar topology;
  HMAC auth; Zod-as-source-of-truth language boundary.
- Tier A rule-based classifier + Tier C Claude Sonnet AI fallback
  + Tier D unknown routing per ADR-0014 §7; v1 fallback ordering
  system-fixed (Tier A → Tier C → Tier D).
- AI fallback budget v1-fixed at 2 calls per source document.
- Vendor matcher (identity-and-matching reads only per ADR-0007
  three-category vendor read split); v1-fixed threshold 0.80.
- `ProposedMutation` / `ProposedMutationBundle` / `ProposedAttachment`
  proposal types (ADR-0012). Logic Receipt emission contract:
  production owned by Tier 1 at commit per INV-AGENT-002 +
  ADR-0007 §Tier 1; `pipeline_trace: PipelineStageRecord[]`
  populated by Tier 2 stages per ADR-0007 Tier 2 safety contract
  item 5.

**Relationship Router (ADR-0018).**

- Three-subsystem decomposition: Subsystem 1 (Ledger-State
  Candidate Completion at Tier 2.5 read boundary); Subsystem 2
  (Ambiguity Resolution); Subsystem 3 (Re-Evaluation Logic).
- Closed v1 trigger list T1–T10 with v1-active 8 (T1, T2, T3, T4,
  T5, T6, T8, T10).

**Operations.**

- Orphan-blob GC daily cadence; `supabase_storage` provider
  scope; 24-hour age threshold; `orphan_blob_collected` audit
  event.
- Replay / idempotency manual cadence (controller-triggered).

### v1 out-of-scope (Phase 5 or post-v1 explicitly named)

- AP/Spend domain service paths per ADR-0015 (Phase 5):
  `billService`, `paymentService`, `vendorPrepaymentService`,
  `vendorCreditService`, `vendorService`, `vendorReportService`.
- Tier B small classifier (post-v1 per ADR-0014 §7; awaits
  corpus threshold ratified via ADR-0019 calibration governance).
- Banking domain `bank_transactions` / `card_transactions`
  ownership (post-v1; entity ownership reserved per ADR-0011 §1
  Domain Boundary Map).
- AR domain `customer_invoices` / `customer_remittances`
  (post-v1 per ADR-0011 §6 reserved document types).
- Auto-post calibration (post-v1 per ADR-0017).
- Multi-jurisdiction tax-timing (post-v1 per ADR-0015 §Q62).
- Production-hardened HMAC secret rotation (post-v1 per
  ADR-0014 §3; v1 ships manual rotation runbook).
- Per-org configurability across the 12 reserved
  `org_settings.*` columns (post-v1 per ADR-0014 Closes Q73).

### Reserved-but-not-emitted (substrate ratified, deferred emission per ADR-0010 amendment Variant A)

- **Document-type discriminator (14 of 18 reserved per ADR-0011 §6):**
  `credit_memo`, `vendor_statement`, `purchase_order`,
  `receiving_document`, `retainer_request`, `deposit_request`,
  `bank_statement`, `card_statement`, `customer_invoice`,
  `customer_remittance`, `tax_form`, `contract`,
  `payroll_document`, `asset_purchase_support`. Documents the v1
  classifier identifies as one of these route to the exception
  queue per ADR-0011 §13.
- **Resolution-action enum (8 of 16 reserved per ADR-0011 §13):**
  `create_bill`, `create_vendor_prepayment`,
  `apply_vendor_prepayment`, `create_vendor_credit`,
  `apply_vendor_credit`, `request_missing_document`,
  `route_to_bank_reconciliation`, `route_to_AR_future`. v1
  manual workflows that conceptually correspond route through
  AP/Spend manual entry forms instead of emitting reserved
  resolution actions.
- **Document-case-source role enum (2 of 6 reserved per ADR-0011 §3):**
  `superseded_source`, `related_prior_document`. v1 cases that
  would use these route to manual case-source bundling.
- **Storage status enum (5 of 7 reserved per ADR-0013 §11):**
  `permission_loss`, `missing_file`, `hash_mismatch`,
  `provider_unavailable`, `verification_pending_retry`. The
  reserved set unlocks when reserved providers
  (`sharepoint_drive`, `s3_bucket`, `external_url`) activate and
  drift detection runs.
- **OCR engine enum (2 reserved per ADR-0014 §2):** `tesseract`,
  `claude_vision`. Engine swap is routine activation per the
  engine-agnostic `document_artifacts` contract; no schema
  migration.
- **`org_settings.*` 12 reserved columns (per ADR-0014 Closes Q73):**
  `ocr_engine`, `replay_cadence`, `dedup_policy`,
  `classification_fallback_order`, `ai_fallback_budget`,
  `vendor_match_threshold`, `gc_cadence`, `gc_threshold_hours`,
  `retention_source_documents`, `retention_artifacts`,
  `retention_runs`, `language_packs`. All NOT NULL with v1-fixed
  defaults; per-org configurability switches on post-v1.
- **Multi-entity reservations (per ADR-0011 §10, NOT §17 — §17
  is the reframe-spec anchor; ADR-0011 re-anchors at §10):**
  `source_documents.legal_entity_id`, `bills.legal_entity_id`,
  `bill_lines.benefiting_entity_id`, `payments.paying_entity_id`,
  `payments.benefiting_entity_id`. All nullable, defaulting to
  `org_id` in v1's 1-1 mapping. Intercompany due-to / due-from
  postings are post-v1.
- **`wrong_entity_exception` value.** ADR-0011 §10 names this as
  reserved "in the exception-routing enum (per §13 below)," but
  §13's 16-value `resolution_action` enum does NOT list it.
  Substrate-decision-integrity flag: this likely indicates a
  separate exception-TYPE enum (parallel to resolution-action)
  not yet ratified in any Phase 0 ADR. Surfaced as a Phase 2
  carry-forward governance question for founder triage; warrants
  either ADR-0011 amendment introducing the exception-TYPE enum
  + adding `wrong_entity_exception` to it, or downstream-ADR
  ratification (potential ADR-0016 / ADR-0018 candidate).
- **DOC invariant prefix (per ADR-0011 §15).** `INV-DOC-001`
  reserved as the first DOC-prefix invariant candidate
  (evidence-completeness; per-bill or per-case primary-link
  requirement). Q79 path β deferral per
  `docs/09_briefs/phase-2/2026-05-04-d6-ratification-package.md`
  §6.8: enforcement-rule shape lands at first DOC-citing code
  in Phase 1 implementation. Phase 1.Storage code does not yet
  cite DOC; Q79 trigger remains pending Phase 2 implementation
  arc.
- **Re-evaluation triggers (T7, T9 reserved per ADR-0018 §4):**
  vendor-master merge, document supersession. Activation
  requires explicit ADR amendment per reserved-enum-states
  discipline.

## 3. Architecture overview

The Document Platform is a layered substrate that runs from blob
ingestion to commit-time confirmation. Each layer has its own
authority boundary, its own read/write contract, and its own
hand-off vocabulary to the layers above and below. The end-to-
end flow is six layers, each implemented as a separate substrate
concern: Storage / Evidence Core → Document Core → Tier 2
Document Pipeline → Relationship Router (Tier 2.5) → Domain
handoff → Tier 1 commit gate.

### Layer 1 — Storage / Evidence Core

Per ADR-0013, storage operations run at the data-access layer
**below the agent-tier boundary** and below Reading B; they are
infrastructure substrate that all agent tiers route through via
`storageProviderService`. The service exposes a typed contract
(put / fetch / fetchVersion / previewUrl / delete /
verifyIntegrity) that each provider implementation must satisfy.
v1 ships one provider (`supabase_storage`); reserved providers
(`sharepoint_drive`, `s3_bucket`, `external_url`) ship under
their own activation briefs post-v1.

Storage is **not** wrapped in `withInvariants()` — invariants
apply to ledger and domain mutations, not to blob I/O. Callers
that need transactional coupling to a `source_documents` INSERT
(the ingestion path) wrap the storage call inside the document-
platform service's `withInvariants()` block: storage `put`
succeeds first, then the `source_documents` INSERT runs in the
transaction; on INSERT failure, the bytes already written remain
(orphan-blob GC handles cleanup per ADR-0014).

Phase 1 (Storage / Evidence Core) closed at PR #8 / `b900bdd` on
2026-05-06; this layer is shipping code.

### Layer 2 — Document Core (case substrate)

Per ADR-0011, the Document Core layer codifies the case
substrate. A `source_document` is the raw file; a
`document_case` is a workflow item created when a source
warrants action. One file may produce zero (filtered: duplicate
hash, non-document mime), one (common case), or many (multi-
page PDF containing invoice + delivery note + remittance →
three cases) cases. A case may also draw from multiple source
documents; many-source-to-one-case modeling lives in
`document_case_sources(document_case_id, source_document_id,
role)`.

Cases progress through a 10-state lifecycle (`received →
extracting → classified → matched → proposed → needs_review →
approved → committed → rejected → archived`). All transitions
are service-layer-enforced (Layer 2 per ADR-0011 §3) since they
encode workflow-actor authority that schema CHECKs cannot
express. Schema reserves all states per ADR-0010 reserved-enum-
states discipline.

OCR output lands in `document_artifacts` per the engine-agnostic
contract (ADR-0011 §5). Every consumer of OCR output
(classifier, field extractor, table extractor, validator) reads
`document_artifacts`, NOT raw engine output. This is the
contract that swaps OCR engine choice without consumer-code
churn.

Polymorphic `source_document_links` per ADR-0016 carries the
`(linked_entity_type, link_role)` joint-validity matrix
discriminating which links the platform may propose between
source documents and downstream domain entities (bills,
payments, prepayments, credits).

### Layer 3 — Tier 2 Document Pipeline

Per ADR-0014, the pipeline is an 8-stage deterministic
TypeScript orchestrator: `dedupByHash` →
`storageProviderService.fetch()` → `runOCR` →
`classifyDocumentType` → `extractFields` → `matchVendor` →
`matchAgainstExistingState` → `buildProposal`.

Each stage is a stateless typed function `(typed_input) →
typed_output` per ADR-0007 Tier 2 safety contract. Orchestration
is plain TypeScript — LLM-planned orchestration is prohibited
per Q31. Inputs and outputs are Zod-validated at every stage
boundary. The pipeline is **not** wrapped in `withInvariants()`
because it produces proposals, not commits.

OCR runs as a Python sidecar (`document-pipeline-py`) on Modal,
exposed over HTTP. Communication is request/response, stateless,
HMAC-authenticated. Cross-language schema is TypeScript-as-
source-of-truth: Zod on the TS side; JSON Schema generated;
Python Pydantic consumes. Schema mismatch surfaces as typed
`PIPELINE_SCHEMA_MISMATCH` ServiceError.

Classification runs Tier A (rule-based, active v1) → Tier C
(Claude Sonnet AI fallback, active v1) → Tier D (unknown,
routes to exception queue) in fixed order per ADR-0014 §7. Tier
B (small classifier) is reserved post-v1 awaiting corpus
threshold per ADR-0019 calibration governance. AI fallback
budget is v1-fixed at 2 calls per source document.

The pipeline's `matchAgainstExistingState` stage operates inside
the Tier 2 read boundary (vendor identity, COA, tax codes,
classes — reference data only). When relationship completion
requires reading committed ledger state (open bills, vendor
balances, prepayment balances), the stage emits an **incomplete
candidate** that flows to the Relationship Router at Tier 2.5
for completion (per ADR-0018 §2 boundary).

Pipeline output is `ProposedMutation`, `ProposedMutationBundle`,
or `ProposedAttachment` (per ADR-0012). These are Zod-validated
proposal types; the Tier 1 committing agent re-verifies them
per the expanded Q28 matrix before commit.

### Layer 4 — Relationship Router (Tier 2.5)

Per ADR-0018, the Relationship Router runs at Tier 2.5 — the
Read-Only Ledger-Aware Path introduced by ADR-0007 amendment
2026-05-03 (Q66 closure option (b)). Tier 2.5 authorizes reads
against committed ledger state (open bills, payments,
prepayments, credits, period status, reconciliation candidates)
and against vendor control / payment-risk fields (bank account,
payment instructions, bank-detail-confirmed flag). Tier 2.5
does NOT authorize writes; the Router produces Zod-validated
`DocumentRelationshipCandidate` rows that Tier 1 re-verifies at
commit.

The Router decomposes into three subsystems per ADR-0018
Decision item 1:

- **Subsystem 1 — Ledger-State Candidate Completion.** Consumes
  ADR-0014 `matchAgainstExistingState`'s incomplete candidates,
  reads committed ledger state, produces zero or more completed
  candidates carrying `(linked_entity_type, linked_entity_id,
  link_role, confidence_score, candidate_features)`.
- **Subsystem 2 — Ambiguity Resolution.** When Subsystem 1
  produces multiple candidates above threshold, decides between
  propose-the-best, propose-with-ambiguity-flag, and route-to-
  exception-queue.
- **Subsystem 3 — Re-Evaluation Logic.** Re-runs Subsystem 1
  when domain state changes. Closed v1 trigger list T1–T10
  (v1-active subset 8: T1, T2, T3, T4, T5, T6, T8, T10).

The boundary with ADR-0014 is mechanical: ADR-0014's match
stage runs inside the Tier 2 read boundary; ADR-0018's
Subsystem 1 runs inside the Tier 2.5 read boundary. ADR-0014
hands an incomplete candidate to ADR-0018; ADR-0018 returns a
completed candidate or routes to the exception queue.

### Layer 5 — Domain handoff

The Document Platform proposes; domain services produce ledger
operations; the ledger service is the sole writer of journal
entries. Per ADR-0011 §1 Domain Boundary Map, AP/Spend domain
services (per ADR-0015; Phase 5) consume `ProposedMutation` /
`Bundle` / `Attachment` from the platform, route through the
appropriate domain operation (`billService.post()`,
`billService.postWithImmediatePayment(bundle)`,
`paymentService.recordBillPayment()`), and decide whether to
commit. Banking, AR, and other domains follow the same handoff
shape post-v1 per ADR-0011 §1 entity ownership.

The exception queue (per ADR-0011 §13) is the platform's first-
class deliverable for cases that don't route automatically: v1
routes 14 of 18 document types to the queue, plus low-
confidence cases, ambiguity cases, and unrecognized-type
cases. Document-type-aware actions, reclassification workflows,
and bulk operations live at the queue UI; the substrate sits
at Layer 2 (Document Core), and the UI surface sits at Tier 3
per ADR-0007 §Tier 3 Interface Path.

### Layer 6 — Tier 1 commit gate

Per ADR-0007 §Tier 1, a single committing agent runs per user
session as the sole writer of ledger state through the
deterministic service layer (`withInvariants()`-wrapped service
entry points). Tier 1 owns the Logic Receipt production
(INV-AGENT-002); the `pipeline_trace: PipelineStageRecord[]`
field is populated by Tier 2 stages per ADR-0007 Tier 2 safety
contract item 5 and finalized by Tier 1 at commit. Tier 1 also
re-verifies all upstream proposals per the expanded Q28 matrix:
document-type-aware fields, relationship-claims, stale-state
TOCTOU, and bundle re-verification.

Tier 1 may not contain pipeline-shaped sub-stages on the write
path. A single deterministic service call inside
`withInvariants()` is the only legal commit-path shape. This
preserves atomicity: a stale-state check that fails inside
`withInvariants()` rolls back the same way an invariant
violation does.

### Cross-layer property: trace propagation

Every layer emits trace records linked by `trace_id` per
INV-AUDIT-001. The pipeline propagates `trace_id` via
`ServiceContext` and crosses to the Python sidecar via the
`X-Trace-Id` header. Audit events route through the canonical
audit-log writer per ADR-0011 §1.

## 4. Tier 1 / Tier 2 / Tier 2.5 / Tier 3 placement

Per ADR-0007 amendment 2026-05-03 (D1 ratification, Q66 closure
via option (b)), the agent-tier framework is four-Tier: Tier 1
(commit path), Tier 2 (proposal path), Tier 2.5 (Read-Only
Ledger-Aware Path), and Tier 3 (Interface Path / user-facing
voice). Each Document Platform component places at one or more
tiers per its authority + read/write boundary; some components
span tiers (substrate at one tier, surface at another) and one
(Storage provider) sits below the agent-tier boundary entirely.

### Storage provider (ADR-0013)

**Data-access layer below the agent-tier boundary.** Per
ADR-0013 `## Triggered by` + Phase 0 dependency context + the
Cross-references ADR-0007 entry, storage operations are
infrastructure substrate that all agent tiers consume through
`storageProviderService`; storage is structurally orthogonal to
agent tiers, not itself a tier. Ships in Phase 1 (Storage /
Evidence Core) at PR #8 / `b900bdd` (closed 2026-05-06).

### Document Core schema (ADR-0011)

**Tier 2 substrate.** Canonical writer authority over
`document_cases`, `document_case_sources`, `document_artifacts`,
`document_classifications`, `ocr_runs`, `extraction_runs`,
`source_document_links` per ADR-0011 §1 entity ownership.
Substrate-layer concern (data-access boundary); accessed by
agent tiers through the document-platform service.

### Tier 2 pipeline orchestrator (ADR-0014)

**Tier 2** per ADR-0014 §1 (and per the ADR's name). Stateless
typed pipeline stages chained by deterministic TypeScript
orchestration per ADR-0007 §Tier 2. No direct writes; LLM-planned
orchestration prohibited per Q31. Each stage is `(typed_input)
→ typed_output` Zod-validated.

### Tier A rule-based classifier (ADR-0014 §7)

**Tier 2 stage.** Deterministic; reads `document_artifacts` text
only (no transactional state, no vendor control fields). High
precision, low recall.

### Tier C Claude Sonnet AI fallback (ADR-0014 §7)

**Tier 2 stage.** Reads `document_artifacts.lines` + `pages` +
system prompt naming v1 active enum. Output Zod-validated; non-
validating output rejects the fallback and routes to exception
with `unknown` type. Budget v1-fixed at 2 fallback calls per
source document.

### Vendor matcher (three-category vendor read split)

**Tier 2 stage** with explicit read-boundary scoping. The three-
category split is named in ADR-0007 Status section as a D1-
ratified clarification, distributed across the Tier 2 read
boundary (lines 167–178), the Tier 2.5 read boundary (lines
266–278), and Q28 expansion surfaces 2 (relationship-claim re-
verification) + 3 (stale-state TOCTOU re-verification):

- **Reference / matching fields readable at Tier 2:** vendor
  name, aliases, tax ID, email/domain, address, default account
  mapping, historical template association (also COA, tax codes,
  classes/projects/departments).
- **Control / payment-risk fields readable at Tier 2.5 only:**
  bank account, payment instructions, bank-detail-confirmed
  flag, payment hold status, blocked-vendor status.
- **All vendor-control fields re-verified at Tier 1 at commit**
  inside `withInvariants()`.

The vendor matcher stage operates in the first category (Tier 2).
Output is `VendorMatchResult { vendor_id | null, confidence,
match_type, candidate_alternatives[] }`; v1-fixed threshold 0.80.

### `matchAgainstExistingState` stage (ADR-0014 §11)

**Tier 2 stage at the boundary.** Produces structural / reference-
data-resolvable relationship candidates inside the Tier 2 read
boundary. When ledger-state reads are required to complete the
candidate, emits an **incomplete candidate** that flows to the
Relationship Router (ADR-0018, Tier 2.5) for completion. ADR-0014
owns the structural portion; ADR-0018 owns the ledger-state
completion portion (boundary verbatim per ADR-0018 §2).

### Relationship Router (ADR-0018)

**Tier 2.5** per ADR-0007 §Tier 2.5 — Read-Only Ledger-Aware
Path + ADR-0007 §Amendment (Q66 closure option (b)) + ADR-0018
Decision item 1. Authorized to read committed ledger state (open
bills, payments, prepayments, credits, period status) + vendor
control / payment-risk fields. NOT authorized to write. Three
subsystems: Subsystem 1 (Ledger-State Candidate Completion),
Subsystem 2 (Ambiguity Resolution), Subsystem 3 (Re-Evaluation
Logic with closed trigger list T1–T10 v1-active 8).

### Exception queue (split: substrate Tier 2 + UI Tier 3)

**Substrate (data layer): Tier 2** per ADR-0011 §1 entity
ownership + §13 first-class deliverable framing. Resolution-
action enum, document-type-aware action contract, reclassification
workflow contract live at the substrate.

**UI surface: Tier 3** per ADR-0007 §Tier 3 (Interface Path —
user-facing voice). The exception queue UI renders the substrate
to the user with document-type-aware actions, reclassification
workflows, bulk operations, and screenshot-gate ratification.
Tier 3 MUST NOT expose internal pipeline stage names, sub-agent
identifiers, or intermediate Zod outputs to the UI surface; the
user sees "the agent" surface per ADR-0006, not "the AP Agent's
vendor-matcher stage rev 3."

### Logic Receipt (split: production Tier 1 + `pipeline_trace` Tier 2)

**Production owned by Tier 1 at commit** per ADR-0007 §Tier 1 +
INV-AGENT-002. The Tier 1 committing agent finalizes the Logic
Receipt at commit time inside `withInvariants()`.

**`pipeline_trace: PipelineStageRecord[]` populated by Tier 2
stages** per ADR-0007 §Tier 2 safety contract item 5. Each
pipeline stage emits a stage record (`stage_name`, `input_hash`,
`output_hash`, `model`, `timestamp`); the orchestrator
accumulates the records into the Logic Receipt's `justification`
field. Tier 1 re-verifies the trace + finalizes the Logic
Receipt at commit per Q30 reproducibility resolution.

### `ProposedMutation` / `Bundle` / `Attachment` handoff (ADR-0012)

**Tier 2 → Tier 1 handoff boundary.** Tier 2 stages produce
Zod-validated proposal types; Tier 1 consumes them at commit
time, re-verifies per the expanded Q28 matrix
(`agent_architecture_policy.md` §2.2 relationship-claim + §2.3
stale-state TOCTOU + §2.4 bundle re-verification), and routes
the commit through the appropriate domain service. The handoff
shape is non-negotiable per ADR-0011 §8 Reading B preservation.

## 5. Data model
[Stub — source_documents, source_document_versions, source_document_links, document_cases, document_case_sources, document_artifacts, document_classifications, document_relationship_candidates, ingest_batches, ingest_items, document_jobs]

## 6. Storage abstraction
[Stub — fill from reframe spec; carries forward the original AP brief §6]

## 7. Polymorphic source-document links — schema discipline
[Stub — closed enum for linked_entity_type, closed enum for link_role, (entity_type, role) pair-validity matrix, service-layer integrity validation, orphan/cascade behavior]

## 8. Relationship Router — three subsystems
[Stub — match-against-existing-state engine, ambiguity resolution, re-evaluation logic]

## 9. ProposedMutation / ProposedMutationBundle / ProposedAttachment
[Stub — fill from reframe spec §14; ProposedAttachment for no-ledger-effect attaches]

## 10. Document lifecycle immutability rules
[Stub — fill from reframe spec §16; ocr_runs immutable, extraction_runs immutable, candidates versioned, post-commit links require supersession]

## 11. Exception queue — first-class deliverable
[Stub — fill from reframe spec §10; document-type-aware actions, reclassification, bulk operations, screenshot gate]

## 12. Multi-entity reservation
[Stub — fill from reframe spec §17; legal_entity_id / paying_entity_id / benefiting_entity_id reservations]

## 13. Receipt v1 decision matrix
[Stub — fill from reframe spec §15; per-capability split]

## 14. Phase A acceptance criteria
[Stub — fill after AP/Spend Subdomain ADR ratifies]

## 15. Phase 0 prerequisites

Phase 0 closure verification (Session 2F, 2026-05-04) confirms all
prerequisites met. The verification artifact at
`docs/09_briefs/phase-2/2026-05-04-phase-0-closure-verification.md`
documents the full 12-surface disposition.

**Eight Phase 0 ADRs ratified across six gates D1–D6:**

- **D1 (2026-05-03):** ADR-0007 amendment (three-tier agent
  architecture with Tier 2.5 Read-Only Ledger-Aware Path; Q66 closure
  via option (b) Tier 2.5).
- **D2 (2026-05-03):** ADR-0011 (Document Platform spine; entity
  ownership boundary; DOC invariant prefix reserved).
- **D3 (2026-05-03):** ADR-0012 (ProposedMutationBundle), ADR-0013
  (Storage Provider), ADR-0014 (Tier 2 Document Pipeline).
- **D4 (2026-05-04):** ADR-0015 (AP/Spend Subdomain), ADR-0016
  (Document Relationship Graph), ADR-0017 (Vendor Template Substrate)
  + post-D4 Cleanup Commits 1–7 + bank-detail amendment.
- **D5 (2026-05-04):** ADR-0018 (Relationship Router; Q56 closure).
- **D6 (2026-05-04):** ADR-0019 (Confidence Calibration Policy; Q57
  closure + Q73 confidence-threshold portion + Q65 ratification +
  ambiguity-margin ratification).

**Filed open questions Q53–Q79:** 25 closed (Q53–Q76 + Q78); 2 open
as Phase-1-implementation-gate or v1-ship-gate deferrals (Q77 v1-ship
matrix-ratification gate; Q79 INV-DOC-001 shape Phase-1-implementation
gate per substrate-now-enforcement-later pattern). See §17 below.

**Stream E dependent-artifact update state:**

- **E2 `agent_architecture_policy.md`** Q28 matrix expansion: ✓ DRAFTED
  (4 re-verification surfaces; Q77 ratification gates v1 ship).
- **E3 `phase_simplifications.md`** Simplification 3 footnote: ✓ CLEAN
  (2026-05-03 footnote operationalizes-not-amends framing).
- **E4 `0010-reserved-enum-states.md`** amendment: ✓ CLOSED via commit
  `797db40` (Variants A/B/C added per Phase 0 reserved-enum patterns).
- **E5 ADR README + INDEX.md** registration: ✓ CLEAN.
- **E1 `invariants.md`** DOC prefix registration: deferred per Q79
  path β to Phase 1 implementation onset (substrate-now-enforcement-later
  pattern; spec-without-enforcement-rule canonical convention honored).

**Post-D6 hygiene cleanup:** ADR-0018 14-line `ADR-0014 §6 → §7`
citation drift fixed via comprehensive cleanup at commit `e5965c3`.

## 16. ADRs this initiative produces
[Stub — Document Platform ADR (ADR-0011), ProposedMutationBundle ADR (ADR-0012), Storage Provider ADR (ADR-0013), Tier 2 Document Pipeline ADR (ADR-0014), Document Relationship Graph ADR (ADR-0016), Relationship Router ADR (ADR-0018), Confidence Calibration Policy ADR (ADR-0019) — seven Document-Platform-owned ADRs per Decision 7 of the Phase 0 plan]

## 17. Open questions

**Document-Platform-scope subset of Q53–Q79** (Spend-domain
questions Q59, Q60, Q61, Q62, Q63, Q64, Q74, Q78 belong to the
Spend Initiative brief):

**Closed at Phase 0 ratification (17 questions):**

- Q53 (document-type enum) — closed by ADR-0014 D3.
- Q54 (document case lifecycle states) — closed by ADR-0011 D2.
- Q55 (source_document_links pair validity matrix) — closed by
  ADR-0016 D4.
- Q56 (Relationship Router re-evaluation triggers) — closed by
  ADR-0018 D5.
- Q57 (confidence calibration governance) — closed by ADR-0019 D6.
- Q58 (ProposedMutationBundle atomicity) — closed by ADR-0012 D3.
- Q65 (per-document-type classifier thresholds) — ratified by
  ADR-0019 D6 at v1 ship + 6 months cadence.
- Q66 (Relationship Router tier placement) — closed by ADR-0007 D1
  via option (b) Tier 2.5.
- Q67 (bank_transactions / card_transactions ownership) — closed
  by ADR-0011 D2 (Domain Boundary Map).
- Q68 (exception queue UX) — closed by ADR-0011 D2 (resolution-
  action enum).
- Q69 (replayability of extraction) — closed by ADR-0014 D3.
- Q70 (OCR-layer idempotency) — closed by ADR-0014 D3.
- Q71 (classification strategy) — closed by ADR-0014 D3.
- Q72 (AI fallback contract) — closed by ADR-0014 D3.
- Q73 (per-org Document Platform configuration) — confidence-
  threshold portion closed by ADR-0019 D6 (Path γ system-fixed-
  only-at-v1 + per-org substrate reserved); other knobs closed by
  ADR-0011 / ADR-0013 / ADR-0014.
- Q75 (document case source cardinality) — closed by ADR-0011 D2.
- Q76 (re-evaluation policy immutability boundary) — closed by
  ADR-0011 §9 + ADR-0016 §6.

**Open at Phase 0 closure (2 questions, both deferred per
substrate-now-enforcement-later cross-pattern):**

- **Q77 (Q28 re-verification matrix expansion) — v1-ship-gate
  deferral.** Matrix drafted in
  `docs/02_specs/agent_architecture_policy.md` per ADR-0007
  amendment ratification. Ratification gates v1 ship, NOT Phase 1
  start. Q28 Ratification Tracker per Phase 0 plan Task Z1.5
  ensures visibility across Phase 1+ work.

- **Q79 (INV-DOC-001 shape / DOC prefix registration) — Phase-1-
  implementation-gate deferral.** ADR-0011 §15 reserved INV-DOC-001
  shape; Phase 0 closure verification check 6.6 confirmed DOC
  prefix NOT registered in `invariants.md`. Per Session 2F closure
  verification path β verdict (founder-locked 2026-05-04), Q79
  closure work TRIGGERS at Phase 1 (Storage / Evidence Core) code
  start when first DOC-citing code lands. The
  spec-without-enforcement-rule canonical convention in
  `invariants.md` is honored verbatim.

**Q29 ESLint rule design** is a sibling Phase-1-implementation-gate
deferral filed in `docs/02_specs/open_questions.md` (not a Q53–Q79
filing). ADR-0007 D1 SELECTED the ESLint mechanism; concrete design
deferred to Phase 1 implementation onset per Session 2F path β
verdict (founder-locked 2026-05-04). Same substrate-now-enforcement-
later cross-pattern as Q77 + Q79.

**The three-deferral cohort (Q29 + Q77 + Q79)** structurally
parallels ADR-0010 amendment Variant A (NULL-default forward-
compatible config-column reservation) — substrate ratified at
Phase 0; enforcement landing at Phase 1 implementation or v1 ship.

## 18. Friction-journal scope
[Stub — Document Platform arc placeholder name]

## 19. What this initiative does NOT do
[Stub — does not commit accounting state; does not own domain logic; does not change Authority Gradient / Agent Ladder / Two Laws / Service Communication Rules / existing invariants; does not edit AP/Spend brief content; does not generalize Document Core into a non-accounting document management system]

## 20. Verification against canonical docs
[Stub — fill after ADRs ratify; list every canonical doc verified per the original AP brief §18 precedent]

## 21. Review history

- **2026-05-03** — Skeleton drafted under Phase 0 governance plan Task B1. Sections 1–20 are stubs; final content fills in after Phase 0 ADRs ratify (Task B3 in subsequent session).
- **2026-05-04** — B3-Lite finalization at Phase 0 closure verification (Session 2F). Status header updated from Skeleton to Ratified-with-deferred-substantive-authoring per substrate-now-enforcement-later cross-pattern; §15 Phase 0 prerequisites filled; §17 Open questions filled with closure-state per question + Q29/Q77/Q79 Phase-1-implementation-gate deferral framing; §21 review history updated. Sections §1–§14, §16, §18–§20 remain stubs; substantive content fills alongside Phase 1 (Storage / Evidence Core) implementation work that consumes the corresponding ratified ADR content. NOT authorized for code outside Phase 1 scope.
