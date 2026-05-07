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

The Document Platform owns 13 substrate-tier tables per ADR-0011
§1 entity ownership boundary. Per Sub-Q B2-1-δ Tier-by-component
framing, the substrate sits at Tier 2 substrate (canonical writer
authority via the document-platform service). Domain services
(AP/Spend per ADR-0015; Banking and AR post-v1) own their own
entity types separately; ledger service owns `journal_entries` /
`journal_lines`.

### Substrate-load-bearing tables (verbatim row shape)

**`source_documents`** (per ADR-0011 §2 — note: the row-shape
content lives at §2, not §1 which is "Entity ownership boundary").
The evidence anchor. Every uploaded file produces exactly one row.

- `id` (uuid primary key)
- `org_id` (uuid, FK, RLS-scoped)
- `legal_entity_id` (uuid, nullable, reserved per ADR-0011 §10
  multi-entity reservation; defaults to `org_id` in v1's 1-1
  mapping)
- `storage_provider` (closed enum per ADR-0013 §2; v1-active
  `supabase_storage`; reserved `sharepoint_drive`, `s3_bucket`,
  `external_url`)
- `storage_key` (text — provider-scoped path or identifier)
- `original_content_hash` (text — SHA-256 of file bytes at
  ingestion; **write-once**, never mutated)
- `original_byte_size` (bigint — write-once)
- `original_filename` (text — write-once)
- `current_version_id` (uuid, nullable, FK to
  `source_document_versions`; pointer to latest captured version;
  null at ingestion implying implicit version 1; **only column
  on this row mutable post-ingestion**)
- `mime_type` (text)
- `ingest_channel` (closed enum: `drag_drop_pdf`,
  `forwarded_mailbox`, `direct_upload`, `api_ingest`)
- `ingest_batch_id` (uuid, nullable, FK to `ingest_batches`)
- `received_at` (timestamptz)
- `created_at` (timestamptz)
- `created_by` (text or uuid; `'agent' | <user_id>`)

INV-DOC-001 evidence-completeness depends on the immutability of
`original_content_hash` per Q79 path β deferral.

**`source_document_versions`** (per ADR-0011 §2 versioning model).
Captured version history when content_hash drift requires a new
version row.

- `id` (uuid primary key)
- `source_document_id` (uuid, FK)
- `version_number` (int)
- `content_hash` (text — SHA-256; **immutable per row** per
  ADR-0011 §9 rule 2)
- `byte_size` (bigint)
- `captured_at` (timestamptz)
- `capture_reason` (closed enum per ADR-0013 §6: 7 values; v1-
  active 3 — `vendor_corrected_invoice`, `reformatted_pdf`,
  `accessibility_replacement`; reserved 4 for drift activation
  post-v1)

**`document_cases`** (per ADR-0011 §3 — combined section with
`document_case_sources`, NOT split across §3/§4 as the brief
skeleton's stub suggested). Workflow item created from one or
more source documents.

- `id` (uuid primary key)
- `org_id` (uuid, FK, RLS-scoped)
- `legal_entity_id` (uuid, nullable, reserved per ADR-0011 §10)
- `lifecycle_state` (closed enum, 10 states per ADR-0011 §3:
  `received → extracting → classified → matched → proposed →
  needs_review → approved → committed → rejected → archived`).
  All transitions service-layer-enforced (Layer 2) since they
  encode workflow-actor authority that schema CHECKs cannot
  express.
- `current_relationship_candidate_id` (uuid, nullable, FK to
  `document_relationship_candidates`; mutable pre-commit per
  ADR-0011 §9 rule 4)
- `document_type` (closed enum per ADR-0011 §6: 18 reserved /
  4 v1-active)
- `classification_confidence` (numeric)
- Workflow metadata (created_at, etc.)

**`document_case_sources`** (per ADR-0011 §3 — combined with
case lifecycle in same ADR section). Many-source-to-one-case
modeling.

- `(document_case_id, source_document_id, role)` composite key
- `role` (closed enum per ADR-0011 §3: 6 reserved values;
  v1-active 4 — `primary`, `supporting`, `email_body`,
  `payment_evidence`; reserved-but-not-emitted —
  `superseded_source`, `related_prior_document`)

**`document_artifacts`** (per ADR-0011 §5). The engine-agnostic
contract. Every consumer of OCR output reads this table, NOT raw
engine output — this is the contract that swaps OCR engine
choice without consumer-code churn (ADR-0014 owns engine swap
mechanism).

- `id` (uuid primary key)
- `source_document_id` (uuid, FK)
- `ocr_run_id` (uuid, FK to `ocr_runs`; immutable per ADR-0011
  §9 rule 1)
- `extraction_run_id` (uuid, FK to `extraction_runs`; immutable
  per ADR-0011 §9 rule 2)
- `engine` (text — e.g., `paddleocr`, `tesseract`,
  `claude_vision_3_5` per ADR-0014 §2 reserved engines)
- `engine_version` (text — replay capture)
- `pages` (jsonb — page-level: page #, rotation, dimensions,
  page-level confidence)
- `lines` (jsonb — line-level: text, bounding box, per-line
  confidence)
- `words` (jsonb — word-level: token text, bounding box,
  per-word confidence)
- `quality_flags` (text[] — closed enum: `low_resolution`,
  `skewed`, `partial_page`, `noise_threshold`)
- `pipeline_trace` (jsonb — per-stage record array per ADR-0007
  Q30: `stage_name`, `input_hash`, `output_hash`, `model`,
  `timestamp`)
- `confidence` (numeric — overall artifact-level)
- `created_at` (timestamptz)

**`ocr_runs`** and **`extraction_runs`**. Row shapes owned by
ADR-0014 (the immutability boundary at platform-substrate is
owned per ADR-0011 §9 rules 1-2; full row shapes are ADR-0014's
domain per §9 cross-reference to Q69 in that ADR). Both tables
are immutable per ADR-0011 §9: re-extraction produces new rows
that supersede prior rows via `supersedes_*_id`; no row is
updated or deleted in place.

### Downstream-ADR-owned tables (summary + cross-reference)

- **`source_document_links`** — polymorphic many-to-many between
  source documents and accounting entities. ADR-0011 §4 owns the
  spine and three discipline constraints (closed enum on
  `linked_entity_type` + closed enum on `link_role` + service-
  layer integrity validation in `documentLinkService`); ADR-0016
  owns the full enum membership (28-value `linked_entity_type`,
  27-value `link_role`, 2-value `link_status`), the
  `(entity_type, role)` pair-validity matrix (756 cells; 15 active
  v1), and per-`linked_entity_type` cascade behavior. See §7
  below for full detail.
- **`document_classifications`** — classification metadata per
  case. Row shape and ratification details owned by ADR-0014
  (Tier 2 Document Pipeline classification strategy at §7).
- **`document_relationship_candidates`** — Relationship Router's
  match candidates. Row shape owned by ADR-0011 §1 reservation +
  ADR-0018 Decision item 2 Subsystem 1 (algorithmic
  ratification). Versioned per ADR-0011 §9 rule 3 (re-runs
  produce new candidate row referencing prior via
  `supersedes_candidate_id`).
- **`ingest_batches`** and **`ingest_items`** — ingestion-channel
  abstraction. Row shapes owned by ADR-0014 (ingest channels +
  batch processing).
- **`document_jobs`** — work-queue rows that drive extraction
  and classification. Row shape owned by ADR-0014 (pipeline
  orchestration).

### Index strategy (Phase 2 implementation onset)

Index strategy is not pre-positioned at substrate-decision-
integrity grain. Per substrate-now-enforcement-later cross-
pattern (D6 §6.8 + ADR-0010 amendment Variant A), Phase 2
implementation onset ratifies index strategy at the first
migration consuming each table. Known load-bearing indexes from
Phase 1.Storage shipping reality:

- `source_documents` carries indexes on `(org_id,
  original_content_hash)` for SHA-256 dedup-by-hash (per ADR-0014
  §6) and `(org_id, current_version_id)` for current-version
  resolution (per ADR-0013 §3).
- `source_document_versions` carries an index on
  `(source_document_id, version_number)` for version chain
  walking.

Future tables' index strategies fire at chunk-onset adjudication
per chunk-decomposition cadence; Phase 2 implementation arc
ratifies operational indexes as needed without ADR amendment.

### Reserved-but-not-emitted column accounting

Per ADR-0010 amendment Variant A precedent + the substrate-now-
enforcement-later cross-pattern at D6 §6.8, the substrate carries
columns reserved at v1 schema time with NULL-default forward-
compatibility. The reserved-column inventory enumerated at §2
(this brief) covers `source_documents.legal_entity_id`,
`document_cases.legal_entity_id`, the 12 reserved
`org_settings.*` columns owned by ADR-0014 Closes Q73, and the
multi-entity reservation columns on AP/Spend tables (per
ADR-0011 §10).

## 6. Storage abstraction

Storage operations run at the data-access layer below the agent-
tier boundary per Sub-Q B2-1-δ-1-i lock and ADR-0013 framing
(`## Triggered by` + Phase 0 dependency context). Storage is
infrastructure substrate that all agent tiers consume through
`storageProviderService`; storage is structurally orthogonal to
agent tiers, not itself a tier.

### Substrate enumeration (per reframe-spec §3.1)

Note on citation: reframe-spec §6 is "Polymorphic source-document
links — schema discipline" (NOT storage abstraction). The
storage substrate enumeration lives in the reframe-spec §3.1
substrate-bullet:

> `source_documents`, `source_document_versions`,
> `storage_provider` discriminator, content-hash integrity, drift
> detection, queue-and-retry degradation policy.

Phase 1 (Storage / Evidence Core) closed at PR #8 / `b900bdd` on
2026-05-06 with this substrate as shipping code. ADR-0013 owns
the operational-detail ratification.

### `storageProviderService` contract surface (per ADR-0013 §1)

Six typed methods that every provider implementation must satisfy:

- `put(input: PutInput, ctx: ServiceContext): Promise<PutResult>`
  — write bytes; computes SHA-256 hash pre-write; writes bytes;
  re-reads to verify hash; returns `{ storage_key, content_hash,
  byte_size, provider }`.
- `fetch(source_document_id, ctx): Promise<FetchResult>` — read
  bytes for the current version (resolves `current_version_id`
  per ADR-0013 §3).
- `fetchVersion(source_document_version_id, ctx)` — read bytes
  for a specific version row.
- `previewUrl(source_document_id, options, ctx)` — return
  `{ url, expires_at, provider }` per ADR-0013 §12 (5-minute
  default TTL; 30-minute upper bound; per-org configurability
  reserved post-v1 in `org_settings.preview_url_default_ttl` /
  `org_settings.preview_url_max_ttl`).
- `delete(source_document_id, ctx)` — rare path; controller
  authority required per ADR-0011 §4. Storage-layer delete is
  the bytes-removal step; the `source_documents` row cascade
  lives in the document-platform service layer.
- `verifyIntegrity(source_document_id, ctx)` — recompute hash
  from bytes; compare against current version's `content_hash`;
  drives drift detection (ADR-0013 §5).

`storageProviderService` runs at the data-access layer and is
**not** wrapped in `withInvariants()` — invariants apply to
ledger and domain mutations, not to blob I/O. Callers that need
transactional coupling to a `source_documents` INSERT (the
ingestion path) wrap the storage call inside the document-
platform service's `withInvariants()` block: `put` succeeds
first, then the INSERT runs in the transaction; on INSERT failure,
bytes already written remain (orphan-blob GC handles cleanup per
ADR-0014).

### Three-discipline-constraint pattern (mirrored from reframe-spec §6 polymorphic-pattern)

Per the reframe-spec §6 polymorphic-discipline pattern (which
applies canonically to source_document_links substrate; see §7),
the same three-constraint shape applies at storage abstraction
grain:

1. **Closed enum CHECK constraints with ADR-0010 reserved-enum-
   states discipline.** Three closed enums govern storage
   substrate: `storage_provider` (4 values; v1-active 1 —
   `supabase_storage`); `capture_reason` (7 values; v1-active 3
   — `vendor_corrected_invoice`, `reformatted_pdf`,
   `accessibility_replacement`); `storage_status` (7 values;
   v1-active 2 — `available`, `pending_initial_verify`;
   reserved-but-not-emitted 5 — `permission_loss`,
   `missing_file`, `hash_mismatch`, `provider_unavailable`,
   `verification_pending_retry` — unlock when reserved providers
   activate per ADR-0013 §11).
2. **Write-time integrity validation at service-layer.**
   `storageProviderService.put()` performs SHA-256 pre-write +
   re-read verification before the `source_documents` INSERT
   runs (ADR-0013 §9). Layer 1 DB CHECK admits only v1-active
   enum values; Layer 2 Zod boundary validates write input;
   Layer 3 service emits typed `ServiceError` on integrity
   failure (`STORAGE_KEY_MALFORMED`, `INTEGRITY_VERIFY_FAILED`).
3. **Explicit failure-classification matrix** per ADR-0013 §7
   (note: §7 is failure-classification, NOT integrity-check —
   integrity is at §9). Three categories:
   - **(a) transient retryable** (network timeout, provider 5xx,
     throttling) → exponential backoff per ADR-0013 §8 (max 3
     attempts, base 500ms, factor 2x, ±20% jitter, ~3.5s total
     budget). Exhausted retries surface
     `STORAGE_PROVIDER_TRANSIENT_EXHAUSTED`.
   - **(b) provider-unavailable / persistent** (auth-invalid,
     bucket-missing, OAuth-token-expired) → no retry; route to
     exception queue with reserved `resolve_provider_unavailable`
     resolution-action.
   - **(c) permanent malformed** (corrupted PDF, illegal
     characters) → no retry; fail fast; no row created.

### v1 active subset (per ADR-0013 §14 + Phase 1 shipping reality)

- **`supabase_storage`** is the sole v1 active provider. Org-
  scoped paths follow `org_{org_id}/sources/{source_document_id}/
  {filename}` with RLS service-role-write / session-role-read
  isolation.
- **Drift detection exempt by construction** for
  `supabase_storage` per ADR-0013 §5. The platform is the sole
  writer under RLS-scope; no out-of-platform code path can
  modify bytes; drift is impossible by construction. v1 ships
  the drift-detection UI surface (controller-trigger "Verify
  integrity" action) but the action is inert against the only
  active provider — produces no-op result `{ status:
  'exempt_provider', provider: 'supabase_storage' }`. UI ships
  in v1 even though it never fires in practice; this preserves
  the action shape so reserved providers activating post-v1 do
  not require UI retrofit.

### Reserved providers (post-v1 per ADR-0013 §14)

`sharepoint_drive`, `s3_bucket`, `external_url` ship under
their own activation briefs post-v1. Each activation brief
documents which native integrity guarantee replaces (or
complements) hash-verify-on-put per ADR-0013 §9 reserved-
provider treatment. Per-document storage-provider migration is
post-v1 — existing v1 docs stay at their original provider
when an org's default changes.

### Storage-of-truth discipline (per ADR-0013 §13)

> The storage provider holds the original bytes. CHOUnting keeps
> `source_document_id`, the provider reference, the hashes, the
> versions, the document cases, the document links, and the
> audit trace. Storage holds bytes; CHOUnting holds meaning.

Treating SharePoint-mode documents as "owned by SharePoint" is a
category error and a path to wrong accounting. The split is
exact and non-negotiable. Post-v1, when SharePoint activates,
this framing stands between the system and a class of failure
where a SharePoint-deleted file silently invalidates a bill
commit — the audit trail and version row both survive even
when underlying bytes are out-of-band-deleted; `storage_status =
'missing_file'` flag fires; exception queue routes controller
to resolution; accounting record persists.

### Audit emission (per ADR-0013 §16)

Five audit events on storage state changes route through canonical
audit-log writer per ADR-0011 §1 — no service inserts into
`audit_log` directly:

- `source_document_created` (at successful ingestion after
  put-and-verify)
- `source_document_version_captured` (when new version row
  lands)
- `storage_status_changed` (every transition per ADR-0013 §11)
- `controller_override_resolution` (when controller approves
  drift-detection exception)
- `drift_exception_created` (when drift detection produces
  exception, post-v1 when drift activates)

URL mints + pure read operations are NOT audited individually
(would explode audit table for limited forensic value); they
live in pino logs with `trace_id` correlation per Service
Communication Rule 5, not in `audit_log`.

## 7. Polymorphic source-document links — schema discipline

`source_document_links` is the polymorphic many-to-many between
source documents and accounting entities. ADR-0011 §4 owns the
spine and three discipline constraints (closed enum on both
columns + service-layer integrity validation); ADR-0016 owns
full enum membership, the `(entity_type, role)` pair-validity
matrix, and per-`linked_entity_type` cascade behavior.

The schema-vs-algorithm split is intentional and load-bearing:
ADR-0016 owns the schema substrate (what can be stored, what
gets accepted at insert time); ADR-0018 owns the runtime
matching algorithm. Note: ADR-0016 organizes content as 6
numbered Decision items + 6 named top-level sections (NOT 12
numbered top-level sections); citations below reference Decision
items + named section headings.

### Single-writer rule

Per ADR-0016:

> `documentLinkService` is the only function that inserts rows
> into `source_document_links`. No domain service path writes to
> the table directly. No Tier 2 stage writes to the table
> directly. No agent tool writes to the table directly.

Consumers propose link creations through the ProposedAttachment
handoff per ADR-0011 §7; the proposal commits via
`documentLinkService.create()`; the service applies the pair-
validity matrix, the integrity check (referenced entity exists),
and the post-commit immutability rule before inserting.

### Closed enum membership (per ADR-0016 Decision items 1-2 + 5)

**`linked_entity_type`** (closed enum on `source_document_links`).
**28 reserved values total; v1-active subset 8.**

v1-active (8): `bill`, `bill_line`, `payment`,
`bill_payment_allocation`, `vendor_prepayment`,
`vendor_prepayment_application`, `vendor_credit`,
`vendor_credit_application`. Constrained by ADR-0011 §1 entity
ownership boundary.

Reserved post-v1 (20): `bank_transaction`, `card_transaction`,
`bank_account`, `card_account`, `customer_invoice`,
`customer_invoice_line`, `customer_payment`, `customer_credit`,
`vendor_statement_line`, `bank_reconciliation`,
`card_reconciliation`, `fixed_asset`, `tax_filing`,
`payroll_run`, `payroll_employee`, `journal_entry`,
`journal_line`, `vendor_master`, `customer_master`,
`period_close`. Anticipates Banking, AR, payroll, tax filing
phases. `vendor_master` / `customer_master` reserved (NOT v1-
active) — vendor-master changes flow through `audit_log`, not
link rows.

**`link_role`** (closed enum on `source_document_links`).
**27 reserved values total; v1-active subset 4.**

v1-active (4): `primary_invoice`, `payment_evidence`, `receipt`,
`supporting`. Per ADR-0015 §10 declared consumption.

Reserved post-v1 (23): `duplicate_arrival`, `superseded_version`,
`vendor_credit_memo`, `vendor_statement_excerpt`,
`purchase_order`, `receiving_document`, `retainer_agreement`,
`deposit_request`, `bank_statement_excerpt`,
`card_statement_excerpt`, `reconciliation_evidence`,
`failure_notice`, `customer_invoice_attachment`,
`customer_remittance`, `tax_form`, `contract`,
`payroll_document`, `asset_purchase_support`,
`prior_period_evidence`, `correction_memo`,
`controller_override_memo`, `audit_evidence`, `email_thread`.
`controller_override_memo` reserved for INV-DOC-001 override
path.

**`payment_evidence` vs `receipt` distinction** (per ADR-0016
Decision item 2): `payment_evidence` is the role for a document
attached to a `payment` row as proof that the payment occurred
(Scenario A in ADR-0015 §7); `receipt` is the role for a
document attached to a `bill` row as the standalone receipt
that triggered the bill record (Scenario C in ADR-0015 §7).

**`link_status`** (closed enum on `source_document_links`).
**2 values; both v1-active.**

- `created` (default at insert)
- `reversed` (single one-way transition from `created` permitted
  post-commit; CHECK constraint enforces directionality)

`link_status` vocabulary is a link-row state, NOT a mutation-
lifecycle state per ADR-0016 Decision item 5 — distinct from the
canonical mutation-lifecycle vocabulary in `mutation_lifecycle.md`.

### `(linked_entity_type, link_role)` pair-validity matrix

Per ADR-0016 Decision item 3, the full matrix has **756 cells**
(2 tables: 8 v1-active entity rows × 27 roles = 216 cells in
Table A; 20 reserved entity rows × 27 roles = 540 cells in Table
B). Cell labels: `A` (active v1, **15 cells**, all in Table A),
`R` (reserved post-v1), `I` (categorically invalid).

The 15 active-v1 cells (concentrated in the 4 v1-active link-
role columns of the 8 v1-active entity-type rows):

- `(bill, primary_invoice)`, `(bill, receipt)`,
  `(bill, supporting)` — 3
- `(bill_line, supporting)` — 1
- `(payment, payment_evidence)`, `(payment, receipt)`,
  `(payment, supporting)` — 3
- `(bill_payment_allocation, payment_evidence)`,
  `(bill_payment_allocation, supporting)` — 2
- `(vendor_prepayment, payment_evidence)`,
  `(vendor_prepayment, receipt)`,
  `(vendor_prepayment, supporting)` — 3
- `(vendor_prepayment_application, supporting)` — 1
- `(vendor_credit, supporting)` — 1
- `(vendor_credit_application, supporting)` — 1

Examples of categorical invalidity: `(bill, duplicate_arrival)`
invalid because `duplicate_arrival` describes an arrival event,
not a bill relationship; `(payment, primary_invoice)` invalid
because `primary_invoice` describes the dominant invoice for a
bill, not a payment.

Activation discipline gates reserved-cell flips per ADR-0016
Decision item 3 with a 5-step process: (a) entity active, (b)
role active, (c) semantic brief explaining activation, (d) label
flip from `R` to `A`, (e) extending three-layer defenses.

Full Table A + Table B + per-cell detail live canonically in
ADR-0016 Decision item 3; this brief cites by reference rather
than re-embedding the 756-cell grid.

### Three-layer ADR-0010 defense (per ADR-0016 Decision item 4)

Per the polymorphic-discipline-constraint pattern (reframe-spec
§6):

- **Layer 1 — DB CHECK constraints** (3 constraints): column
  CHECK on `linked_entity_type` (8-value IN list); column CHECK
  on `link_role` (4-value IN list); pair-validity CHECK
  (disjunction over the 15 active-v1 cells).
- **Layer 2 — Zod boundary validation** (3 rejection modes):
  reserved-entity-type rejection; reserved-link-role rejection;
  pair-validity `.refine()` rejection.
- **Layer 3 — Service emission** with typed `ServiceError`:
  `LINKED_ENTITY_NOT_FOUND` (integrity-check failed; named
  entity does not exist in named table); `PAIR_RESERVED_POST_V1`
  (Layer 2 backstop with cell coordinates); `PAIR_INVALID`
  (Layer 2 backstop with cell coordinates).

Phase 2 upgrade: migrations loosen CHECKs by extending IN lists
or disjunctions; no backfill needed because all v1 rows are in
active pairs by construction.

### Cascade behavior per `linked_entity_type` (per ADR-0016 Decision item 5)

Cascade matrix shape: 8 rows (one per v1-active
`linked_entity_type`) × 3 columns (Reversal trigger | Pre-commit
behavior | Post-commit behavior). Pattern across all 8 rows:

- **Pre-commit**: link row discarded via
  `documentLinkService.discardPreCommitLink()`; case re-routes
  via Router (ADR-0018) or exception queue (ADR-0011 §13);
  `pre_commit_link_rerouted` audit event emitted.
- **Post-commit**: `link_status` flips to `reversed` via
  `documentLinkService.reverseLinkedEntityLink()`; document
  evidence preserved for audit; `source_document_link_reversed`
  audit event emitted. **No in-place mutation of any other
  column.**

`source_document` deletion is the rare exception path
(controller authority + structured deletion reason; FK `ON
DELETE CASCADE`; emits `source_document_link_cascade_deleted`).

### Pre-commit vs post-commit boundary (per ADR-0016 Decision item 6)

Boundary anchored to `document_cases.lifecycle_state`. **Pre-
commit states** `{received, extracting, classified, matched,
proposed, needs_review, approved}`: re-routing permitted via
discard + create. **Post-commit states** `{committed, rejected,
archived}`: in-place mutation forbidden; only `link_status` flip
via cascade.

Two schema-side enforcement mechanisms:

1. `documentLinkService.create()` is the **sole INSERT path**;
   refuses post-commit insertion. Case state flip + link insert
   in same `withInvariants()` transaction.
2. UPDATE permission restricted to `link_status` column only,
   with one-way CHECK (`created → reversed`).

### Audit events (per ADR-0016 named section "Reserved enums and audit events")

4 new event types route through canonical audit-log writer per
ADR-0011 §1:

- `source_document_link_created` — fields: `org_id`,
  `source_document_link_id`, `source_document_id`,
  `linked_entity_type`, `linked_entity_id`, `link_role`,
  `case_id`, `proposal_id`, `created_by`, `trace_id`
- `source_document_link_reversed` — fields: `org_id`,
  `source_document_link_id`, `source_document_id`,
  `linked_entity_type`, `linked_entity_id`, `link_role`,
  `reversal_reason`, `reversed_by`, `trace_id`
- `pre_commit_link_rerouted` — fields: `org_id`, `case_id`,
  `prior_candidate_target_entity_type`, `prior_candidate_target_id`,
  `prior_candidate_link_role`, `new_candidate_target_entity_type`,
  `new_candidate_target_id`, `new_candidate_link_role`,
  `re_routing_trigger`, `trace_id`. Trigger from ADR-0018 Q56
  (Re-Evaluation Logic).
- `source_document_link_cascade_deleted` — fields: `org_id`,
  `source_document_link_id`, `source_document_id`,
  `linked_entity_type`, `linked_entity_id`, `controller_user_id`,
  `deletion_reason`, `trace_id`

## 8. Relationship Router — three subsystems

The Relationship Router runs at Tier 2.5 per ADR-0007 §Tier 2.5
— Read-Only Ledger-Aware Path + ADR-0007 §Amendment (Q66 closure
option (b)). ADR-0018 owns the algorithmic specification;
ADR-0011 §1 reserved the `document_relationship_candidates`
table; ADR-0016 Decision items 3 + 5 ratified the schema-side
validity matrix and the `pre_commit_link_rerouted` audit event
the Router emits when re-evaluation produces a new candidate.

The split is intentional and load-bearing: ADR-0016 owns the
schema substrate (what can be stored, what gets accepted at
insert time); ADR-0018 owns the algorithm (how candidates are
produced, scored, and re-evaluated). Note: ADR-0018 organizes
content as 7 Decision items under a single `## Decision` header
(NOT §1-§9 numbered top-level sections); citations below
reference Decision items.

### Tier 2.5 safety contract (verbatim from ADR-0007 §Tier 2.5)

The Tier 2.5 safety contract — restated in ADR-0018 Decision
item 1 verbatim from ADR-0007 — is the load-bearing constraint:

> - The Router MAY read from the committed ledger state and from
>   `source_documents` / `document_artifacts` / existing
>   `source_document_links`.
> - The Router MUST NOT write. No INSERT / UPDATE / DELETE / call
>   to any mutating service.
> - The Router MUST be deterministic TypeScript orchestration.
>   LLM-planned matching is prohibited per Q31 (the same rule
>   that applies to Tier 2 stages applies to Tier 2.5).
> - The Router produces Zod-validated output
>   (`DocumentRelationshipCandidate`).
> - Tier 1 re-verifies every Router output at the commit boundary
>   per the expanded Q28 matrix.
> - The Router is idempotent: the same input (classifier output +
>   committed domain state at read time) produces the same
>   candidate set across re-runs.

The Router NEVER writes to either `journal_entries` /
`journal_lines` (ledger service domain) or `source_document_links`
(`documentLinkService` domain). The Router produces
`DocumentRelationshipCandidate` objects; Tier 1 commit paths
consume those candidates after re-verification; the
`documentLinkService` is the only path that translates a ratified
candidate into a `source_document_links` row.

### Three-subsystem decomposition (per ADR-0018 Decision item 1)

The Router decomposes into three subsystems with distinct
concerns and failure modes — conflating them into a single
"matching algorithm" loses the distinct testability and audit-
event-shape obligations of each.

#### Subsystem 1 — Ledger-State Candidate Completion (Decision item 2)

Consumes ADR-0014 §11's incomplete-candidate handoff (the
**cross-ADR boundary** is documented at the opening of ADR-0018
Decision item 2, not as a standalone section). Reads committed
accounting state (open bills in
`('approved_for_payment', 'partially_paid')`; payments in
`('pending', 'paid')`; vendor prepayments in
`('open', 'partially_applied')`; vendor credits in
`('open', 'partially_applied')`; existing
`source_document_links` rows) and produces zero or more
completed `DocumentRelationshipCandidate` rows carrying:

- `linked_entity_type` (one of 8 v1-active values per ADR-0016
  Decision item 1)
- `linked_entity_id` (matched row's primary key)
- `link_role` (one of 4 v1-active values per ADR-0016 Decision
  item 2)
- `confidence_score` (number in [0, 1])
- `candidate_features` (Zod-typed object capturing match
  features — e.g., `{vendor_match: 'exact', amount_match:
  'within_0.01', date_match: 'within_3_days'}`)

The pair `(linked_entity_type, link_role)` MUST be one of the 15
active-v1 cells in ADR-0016 Decision item 3 Table A. **Defense-
in-depth alignment**: Subsystem 1 never proposes a candidate
that the `documentLinkService.create()` Layer 1/2/3 defenses
would reject.

**Failure mode**: missed match (stranded document) or spurious
match (low-confidence noise). Per-document-type confidence
threshold (ADR-0014 §7 Q65 v1 provisional values: vendor_invoice
0.85, receipt 0.80, payment_confirmation 0.85) drops below-
threshold candidates; if post-filter set is empty, Subsystem 2
routes to exception queue.

**Cross-ADR boundary with ADR-0014.** ADR-0014 §11 produces
incomplete candidates inside the Tier 2 read boundary (vendor
identity, chart of accounts, tax codes, classes). ADR-0018
Subsystem 1 completes them inside the Tier 2.5 read boundary
(open bills, payments, prepayments, credits,
source_document_links). The handoff is mechanical: ADR-0014
hands an incomplete candidate; ADR-0018 returns a completed
candidate or routes to exception.

#### Subsystem 2 — Ambiguity Resolution (Decision item 3)

Three-branch decision tree when Subsystem 1 produces ≥1
candidate above threshold:

- **(a) Propose-the-best** — single high-confidence candidate
  with margin over runner-up exceeding ambiguity-margin
  threshold. Emits winning candidate as proposal target;
  resulting proposal shape determined by `(linked_entity_type,
  link_role)` pair + document type per ADR-0015 §7 Scenarios.
- **(b) Propose-with-ambiguity-flag** — multiple candidates
  within ambiguity margin. Tier 1 review surface
  (`ProposedEntryCard`) presents disambiguation UI listing
  candidates with feature vectors and scores. Proposal's
  `justification.rule_id` is null (novel pattern — multiple
  plausible matches); `pipeline_trace` records carry full
  candidate set so rejection-of-runners-up is reconstructable
  from audit trail.
- **(c) Route-to-exception-queue** — no candidate clearly wins
  OR cluster too tight to disambiguate. Routes per ADR-0011 §13
  with v1-active resolution actions (`attach_to_existing_bill`,
  `attach_to_existing_payment`, `record_bill_payment`,
  `mark_duplicate`, `mark_non_accounting`,
  `route_to_manual_entry`, `reprocess`, `archive`).

**Failure mode**: ghost match (silently picking wrong candidate
when multiple plausible candidates exist). Ambiguity-margin
threshold is provisional in v1 pending ADR-0019 ratification.

#### Subsystem 3 — Re-Evaluation Logic (Decision item 4 — Q56 closure)

Runs in response to typed domain events that may invalidate or
improve a Subsystem 1 candidate set. **Scope: pre-commit cases
only** — post-commit `source_document_links` rows go through
ADR-0016 Decision item 5 supersession-via-reversal+recreation
pattern. The Router NEVER silently re-evaluates post-commit.

The dispatcher is a deterministic TypeScript function that
consumes typed trigger events from the AP/Spend domain services
(post-v1: from other domains per ADR-0011 §14 Domain Boundary
Map). The dispatcher is NOT LLM-planned per Q31 — a future
contributor proposing "use an LLM to decide which trigger fires
when" is proposing a Q31 violation.

**Closed v1 trigger list T1-T10** (v1-active 8; reserved 2):

- **T1** — New bill posts (v1-active). `billService.post()`
  emits typed `bill_posted` event after successful
  `withInvariants()` commit; dispatcher re-runs Subsystem 1
  against open exception-queue cases for bill's vendor.
  `re_routing_trigger = 'T1_new_bill'`.
- **T2** — New payment posts (v1-active). Symmetric to T1 for
  stranded receipts attaching to new payments.
  `re_routing_trigger = 'T2_new_payment'`.
- **T3** — New `vendor_prepayment` posts (v1-active).
  `vendorPrepaymentService.create()` → re-runs Subsystem 1
  against open exception-queue cases for prepayment's vendor.
  Per ADR-0015 §1 (Q59 closure) + §6 (Q64 closure), creating
  the prepayment may backfill linkage for a final-invoice case
  routed to exception. `re_routing_trigger =
  'T3_new_vendor_prepayment'`.
- **T4** — New `vendor_credit` posts (v1-active). Symmetric to
  T3 for credit memos.
  `re_routing_trigger = 'T4_new_vendor_credit'`.
- **T5** — Bill state transition (v1-active). When a bill
  leaves `('approved_for_payment', 'partially_paid')` states
  (via `markPaid()` / `void()` / `cancel()` per ADR-0015 bill
  lifecycle); pre-commit candidates pointing at that bill are
  invalidated. Cascade matrix in ADR-0016 Decision item 5
  governs post-commit treatment.
  `re_routing_trigger = 'T5_bill_state_transition'`.
- **T6** — Payment state transition (v1-active). Symmetric to
  T5 for stranded `payment_evidence` candidates pointing at
  payments transitioning to `failed` per ADR-0015 §8.
  `re_routing_trigger = 'T6_payment_state_transition'`.
- **T7** — Vendor master merge (**reserved post-v1**).
  Activates when vendor-master domain ships merge semantics.
  ADR-0015 §9 vendor master integration does not introduce
  merge semantics in v1.
  `re_routing_trigger = 'T7_vendor_master_merge'` reserved.
- **T8** — Period reopen (v1-active, narrow scope). When a
  closed fiscal period reopens; pre-commit candidates with
  `accounting_date` in the reopened period re-validate. v1
  active behavior is "re-run Subsystem 1 with current state"
  — typically a no-op since candidates were valid before
  period close.
  `re_routing_trigger = 'T8_period_reopen'`.
- **T9** — Document supersession (**reserved post-v1**).
  Activates when `superseded_version` `link_role` becomes
  v1-active in a future ADR-0016 amendment. v1 captures
  supersession through `current_version_id` pointer on
  `source_documents` rather than through a link-role row.
  `re_routing_trigger = 'T9_document_supersession'` reserved.
- **T10** — Manual operator override (v1-active). Controller-
  initiated re-route from exception queue UI per
  `resolution_action = 'reprocess'`.
  `re_routing_trigger = 'T10_manual_override'`.

**Failure mode**: stale exception (document permanently stranded
in exception queue because trigger that should re-route never
fires).

Each trigger emits `pre_commit_link_rerouted` audit event per
ADR-0016 Decision item 5 with `re_routing_trigger` carrying the
trigger identifier. The audit event lands inside the dispatcher's
transaction so re-routing is atomic with the new candidate row's
creation per ADR-0011 §9.

### Tier 2.5 read-boundary specifics (per ADR-0018 Decision item 5)

Vendor-control / payment-risk reads are Tier 2.5 territory
(ADR-0007 §Tier 2.5): `bank_account_last4`,
`payment_instructions`, `bank_detail_confirmed_at`,
`payment_hold_status`, `blocked_vendor_status`. The Router MAY
read these when producing payment-readiness candidates; Tier 2
stages (the classifier and extraction pipeline per ADR-0014)
MAY NOT read these fields. Tier 1 re-verifies vendor-control
fields at commit per `agent_architecture_policy.md` §2.3 row
(e). The Router does NOT make payment authorization decisions
— those are domain commit decisions per ADR-0015 §9.

### Stale-state TOCTOU obligations (per ADR-0018 Decision item 6 — Q28 surface 3)

The Router does NOT perform stale-state checks itself. The
Router's reads are not locked, so committed state may change
between Router invocation and Tier 1 commit. **Tier 1 closes
the TOCTOU window** inside `withInvariants()` with `FOR UPDATE`
row locks (or DB triggers for period constraints) per
`agent_architecture_policy.md` §2.3.

Five sub-cases inherited from ADR-0007 §Q28 expansion surface 3:

- (a) bill state still consistent with proposal expectation
- (b) `vendor_prepayment.remaining_balance` ≥ application_amount
- (c) `vendor_credit.unapplied_balance` ≥ application_amount
- (d) ledger period containing `accounting_date` still open
- (e) vendor's `bank_detail_confirmed_at` not invalidated

Pushing stale-state checks into the Router would conflate
proposal-time and commit-time concerns. The correct division of
labor: Router proposes; Tier 1 re-verifies inside
`withInvariants()` with row locking that actually closes the
TOCTOU window. This is the same architectural reasoning that
motivated the Tier 2.5 split per ADR-0007 §Amendment.

### Confidence threshold integration with ADR-0019 (per ADR-0018 Decision item 7)

The Router consumes thresholds at three decision points:

1. **Candidate filtering in Subsystem 1** — per-document-type
   threshold (ADR-0014 §7 Q65 v1 provisional values:
   `vendor_invoice` 0.85 / `receipt` 0.80 /
   `payment_confirmation` 0.85 / `unknown` always-exception).
2. **Propose-vs-exception routing in Subsystem 2** — empty
   post-filter set routes to exception queue (Subsystem 2
   branch (c)).
3. **Ambiguity-margin in Subsystem 2** — single calibrated
   value applied to top-vs-runner-up score difference. Margin
   ≥ threshold → propose-the-best (branch (a)); margin <
   threshold → propose-with-ambiguity-flag (branch (b)) or
   route-to-exception-queue (branch (c)) depending on candidate
   cluster size.

Per-document-type confidence threshold values are owned by
ADR-0014 §7 (Q65). Ambiguity-margin threshold value is
provisional in this ADR pending ADR-0019 ratification.
ADR-0019 (Confidence Calibration Policy) owns calibration
governance for post-v1 tuning; ADR-0018 specifies algorithmic
decision points where thresholds gate behavior, not threshold
values beyond inheriting ADR-0014's.

## 9. ProposedMutation / ProposedMutationBundle / ProposedAttachment

The Document Platform produces three kinds of proposal objects.
All three flow through the same proposal queue and use the same
Four Questions grammar; they differ in commit-path semantics.
ADR-0011 §7 owns the handoff vocabulary; ADR-0012 owns the
bundle envelope mechanism (atomicity, lifecycle, Logic Receipt
shape); `intent_model.md` `## The Four Questions Grammar` heading
owns the canonical user-facing rendering contract (citation note:
shorthand "intent_model.md §5" references the 5th `##` heading
in that file; the heading is text-anchored, not numbered).

### Three-proposal-type contract (per ADR-0011 §7)

**`ProposedMutation`** is the canonical mutation object from
`intent_model.md`. Maps to one ledger-touching change. Commits
through a domain service that produces ledger operations via
`ledgerService.post(...)` per Reading B. Examples:
`record_bill_payment`, `post_vendor_credit`,
`apply_vendor_prepayment_to_bill`. ADR-0011 does not modify the
`ProposedMutation` contract — shape is unchanged from
`intent_model.md`.

**`ProposedMutationBundle`** is a composite proposal that carries
multiple `ProposedMutation` children which must commit
all-or-nothing. The first concrete consumer is the born-paid bill
bundle per ADR-0015. DB-transaction-atomic enforcement and
Logic Receipt shape for compound mutations are owned by ADR-0012.

**`ProposedAttachment`** is the sibling concept introduced for
proposals that produce no ledger operation. Flows through the
same proposal queue as a `ProposedMutation` and renders the same
Four Questions, but **commits via `documentLinkService.create()`
and produces no journal entry, no ledger operation, no
`audit_log` entry on accounting state**. Document-layer audit
event `attachment_link_created` lands as the link-creation
mutation's own audit event.

### `ProposedMutationBundle` — bundle envelope (per ADR-0012 §1)

Verbatim TypeScript type:

```typescript
type ProposedMutationBundle = {
  id: string;                              // UUID, bundle-level
  bundle_type: BundleType;                 // closed enum
  proposed_at: string;                     // ISO 8601
  approved_at: string | null;              // set on Approved (transient)
  posted_at: string | null;                // set on Posted

  bundle_lifecycle_state: LifecycleState;  // single shared state
  effective_ceiling: CeilingTier;          // = max(child ceilings)
  bundle_idempotency_key: string;

  justification: {
    rule_id: string | null;                // null = novel pattern
    pipeline_trace: PipelineStageRecord[];
    bundle_rationale: string;
    source_document_ids: string[];
    user_utterance: string | null;
  };

  children: ProposedMutation[];            // ordered; ordering is semantic
};
```

**Children compose `ProposedMutation` only** (per ADR-0012 §2;
NOT `ProposedAttachment`). The two have different commit paths;
bundling them would conflate ledger-write atomicity with
polymorphic-link-write and break the all-or-nothing promise at
the level the bundle commits. If a workflow needs both — for
example, a born-paid bundle whose classifier-routed receipt
should also attach as `payment_evidence` to the resulting bill
— the attachment commit happens **after** the bundle commit
succeeds, not as part of the bundle's transaction. If post-bundle
attachment fails, the bundle is already committed; attachment
failure routes to exception queue per ADR-0011 §13.

### Bundle atomicity (per ADR-0012 §3)

All children of a bundle commit inside a single Postgres database
transaction. The bundle commit method (e.g.,
`billService.postWithImmediatePayment(bundle)`) opens one
transaction, runs each child's domain-service commit logic in
declared order inside `withInvariants()`, and either commits the
whole transaction or rolls back the whole transaction. **No
partial commits.** Postgres rollback is the mechanical all-or-
nothing guarantee — service-layer code wraps but cannot replace
it.

The bundle-level invariant (per ADR-0012 §7 — the authoritative
source for Q28 surface 4 — bundle re-verification) fires at
commit time inside `withInvariants()` and evaluates four
conditions:

1. Each child entry balances per-child INV-LEDGER-001.
2. The bundle as a whole balances (sum of all child journal-line
   debits = sum of all child journal-line credits).
3. The control account net effect is zero for the bundle's
   primary subject (for born-paid: AP).
4. The payment-side credit equals the total payment amount
   (catches extraction errors where receipt total doesn't match
   bill amount).

### Bundle types — closed enum (per ADR-0012 §12)

**v1-active (1)**: `born_paid_bill`. Children: `post_bill`
followed by `record_bill_payment`. Per-bundle-type child
composition owned by ADR-0015.

**Reserved (ratified by ADR-0015 in Tier 4)**:
`final_invoice_with_applied_deposit` (final invoice arrives, prior
`vendor_prepayment` row applies; balance-check sub-rule that
prepayment has remaining balance sufficient for application
amount); `vendor_credit_applied_to_bill` (bill posting alongside
application of existing vendor credit).

**Reserved post-v1 candidates** (forward-pointers; schema
reservation lands when their respective ADRs scope, not in v1):
`intercompany_due_to_due_from`; `multi_entity_payment_split`;
`vendor_credit_with_refund`.

ADR-0012 names the discriminator + v1 active value; per-bundle-
type child-mutation composition lives in ADR-0015.

### Bundle lifecycle (per ADR-0012 §5)

Bundle reuses the six canonical states from
`mutation_lifecycle.md`: Pending, Needs Attention, Approved,
Posted (auto), Posted (manual), Finalized — plus terminal
Rejected / Rejected-with-reversal where applicable. Per-child
lifecycle states are NOT separate audit surfaces; the bundle's
state is canonical for all its children.

v1 born-paid path (Always Confirm per reframe spec §11; auto-
post deferred past v1):

```
Pending → (may go to Needs Attention) → Approved (transient) →
Posted (manual) → Finalized           [v1 — Always Confirm]
```

### `ProposedAttachment` — v1 variants (per ADR-0011 §7)

5 v1-active variants:

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

**v1 approval policy.** Always Confirm, **except** the user-
initiated direct-upload variant (a user dragging a file into a
specific bill's attach slot is implicitly approving by upload
action; no separate confirmation gate). All other variants —
agent-routed, forwarded-mailbox, classifier-routed — flow
through Always Confirm.

### Four Questions grammar (per `intent_model.md` `## The Four Questions Grammar`)

Every confirmation surface in The Bridge answers these four
questions, in this order, in the same visual position. This is
a product-wide UI contract, not a component.

Canonical phrasing (verbatim):

1. **What changed?** The delta. Rendered from
   `ProposedMutation.delta`.
2. **Why?** The rule that matched, or "novel pattern — no rule."
   Rendered from `ProposedMutation.justification.rule_id`.
3. **Track record?** Rendered from
   `ProposedMutation.justification.historical_match_count` and
   the rule's recent approval rate.
4. **What if I reject?** Explicit consequence language.

The contract applies to every confirmation surface — single-
mutation card, bulk approve dialog, promotion ceremony, reversal
form, period close confirmation, ProposedBundleCard,
ProposedAttachmentCard. **No surface may omit a question or
reorder the sequence.**

### Per-proposal-type Four Questions adaptation

**`ProposedMutation` rendering**: Canonical phrasing applied
verbatim. Q1 renders debit/credit table; Q2 renders rule_id; Q3
renders historical match count + approval rate; Q4 renders
journal-entry rejection consequence ("The entry will not be
posted. You can edit and resubmit, or discard.").

**`ProposedMutationBundle` rendering** (per ADR-0012 §6 Layer 3
aggregate; canonical phrasing preserved): Aggregate Four Questions
at bundle level (NOT N stacked single-mutation cards).

- Q1 renders combined debit/credit table with subtotals per
  child + single bundle-level total
- Q2 renders one bundle-level rule_id explanation (e.g., "Born-
  paid bill: invoice arrived with payment receipt")
- Q3 renders single bundle-level attribution per existing
  `created_by` pattern
- Q4 renders bundle-level rejection consequence

A naive implementation that stacks N single-mutation cards
inside a bundle dialog violates this contract — the user makes
one bundle-level approval decision and the UI must reflect that.

**`ProposedAttachment` rendering** (per ADR-0011 §7 verbatim
adaptation):

- **Q1 What changed?** Renders the link delta — which document,
  which entity, which `link_role`. **No debit/credit table; no
  balance shift.**
- **Q2 Why?** Renders the rule that proposed the attachment (or
  "novel pattern — no rule") per the same `justification.rule_id`
  shape.
- **Q3 Track record?** Same template as `ProposedMutation`.
- **Q4 What if I reject?** "The document will not be linked. You
  can edit and resubmit, or discard."

### Reading B preservation (per ADR-0011 §8 + ADR-0012 inheritance)

All three proposal types preserve Reading B by construction. The
Document Platform proposes; domain services produce ledger
operations; the ledger service is the sole writer of journal
entries.

- `ProposedMutation` commits through a domain service that calls
  `ledgerService.post(...)` per Reading B.
- `ProposedMutationBundle` commits through a domain service that
  orchestrates each child inside one `withInvariants()`
  transaction; no bundle commit path bypasses
  `ledgerService.post(...)`.
- `ProposedAttachment` commits via `documentLinkService.create()`
  and produces no ledger operation at all.

A future contributor who proposes any proposal-type commit path
that calls `ledgerService.post(...)` directly (bypassing the
domain service) is proposing a Reading B violation — mechanical,
not conventional.

### Mapping to `intent_model.md` Primitive 1 (per ADR-0011 §7 + spec §20)

All three proposal types are `intent_model.md` Primitive 1
(Proposal):

- `ProposedMutation` — Primitive 1 with the canonical mutation
  payload from `intent_model.md` §3.
- `ProposedMutationBundle` — Primitive 1 with composite payload
  (no new primitive introduced).
- `ProposedAttachment` — Primitive 1 with non-mutating composite
  payload (no new primitive introduced).

The same proposal queue surfaces handle all three without bespoke
routing per the canonical rule from `intent_model.md` ("No entry
path has bespoke routing").

## 10. Document lifecycle immutability rules

Replayability is a load-bearing capability of the Document
Platform: re-running extraction when the OCR engine improves,
re-running the Relationship Router when new domain state lands,
must produce new rows that supersede prior rows rather than
mutating prior rows. The four rules per ADR-0011 §9, verbatim:

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
   `link_status` per ADR-0016 Decision item 5.

### Schema-layer + service-layer enforcement (per ADR-0011 §9)

Per ADR-0011 §9, immutability enforces at two layers:

- **Schema layer** — immutable tables (`ocr_runs`,
  `extraction_runs`); supersession columns
  (`supersedes_ocr_run_id`, `supersedes_extraction_run_id`,
  `supersedes_candidate_id`); no UPDATE permission on immutable
  rows for service-role clients.
- **Service layer** — no UPDATE statements against immutable
  rows; only INSERT-of-successor (re-extraction produces new
  rows) or soft-delete-via-`status`-flip (`link_status` flips
  to `reversed` per ADR-0016 Decision item 5).

The two-layer enforcement preserves replayability under both
correct service-layer code AND adversarial-or-buggy code paths
that might attempt direct UPDATE: schema-layer denial fires
even when service-layer guards fail.

### Q69 forward-pointer to ADR-0014

Per ADR-0011 §9, the operational policy on **when replays
auto-supersede vs require explicit promotion** (Q69) is owned
by ADR-0014 (Tier 2 Document Pipeline). ADR-0011 §9 owns the
immutability *boundary* itself (immutable tables + supersession
columns + no-UPDATE rules); ADR-0014 owns the *cadence* (manual
controller-triggered v1; auto-supersession heuristics post-v1
per per-org `org_settings.replay_cadence` reserved column).

This split preserves substrate-decision-integrity at the
boundary-vs-cadence axis: the immutability shape is platform
substrate (ADR-0011 §9); the firing-cadence is pipeline
operational policy (ADR-0014). Future readers editing replay
behavior amend ADR-0014; future readers editing the
immutability boundary amend ADR-0011 §9.

### Cross-references

- **ADR-0011 §9** — canonical anchor for the 4 immutability
  rules
- **ADR-0011 §3** — `document_cases.lifecycle_state` (post-
  commit states `{committed, rejected, archived}`)
- **ADR-0014** — Q69 operational replay-supersession policy
  (auto-supersede vs explicit promotion)
- **ADR-0016 Decision item 5** — `link_status` cascade for
  post-commit `source_document_links`

## 11. Exception queue — first-class deliverable

Per ADR-0011 §13, the exception queue is the bulk of v1's
user-visible work. Founder + 2 real users will spend most of
their time there, not on the happy path. The queue ships as a
**first-class workflow tool, NOT a deferral mechanism**.

### Reframe (per ADR-0011 §13 verbatim)

> Under this reframe, v1 routes credit memos, vendor statements,
> deposit requests, retainer requests, bank statements, card
> statements, customer invoices, employee reimbursements, POs,
> receiving documents, tax forms, and unknown documents to the
> exception queue. The exception queue is the bulk of v1's
> user-visible work — the founder + 2 real users will spend most
> of their time there, not on the happy path. The queue therefore
> ships as a first-class workflow tool, not as a deferral
> mechanism.

12 of 18 document types route to the exception queue in v1
(per the document-type discriminator at §2 above).

### First-class deliverable requirements (per ADR-0011 §13 verbatim)

Four requirements lock the first-class deliverable framing:

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

### Resolution-action enum — 16-value full closed enum (per ADR-0011 §13 verbatim, Q68 closure)

> **Resolution-action enum (Q68 closed by this ADR — see Closes
> below).** The full closed enum per ADR-0010 reserved-enum-states
> discipline:
>
> `create_bill`, `attach_to_existing_bill`,
> `attach_to_existing_payment`, `record_bill_payment`,
> `create_vendor_prepayment`, `apply_vendor_prepayment`,
> `create_vendor_credit`, `apply_vendor_credit`, `mark_duplicate`,
> `mark_non_accounting`, `request_missing_document`,
> `route_to_manual_entry`, `route_to_bank_reconciliation`,
> `route_to_AR_future`, `reprocess`, `archive`.

**v1-active subset (8 values per ADR-0011 §13)**:
`attach_to_existing_bill`, `attach_to_existing_payment`,
`record_bill_payment`, `mark_duplicate`, `mark_non_accounting`,
`route_to_manual_entry`, `reprocess`, `archive`.

**Reserved-but-not-emitted (8 values; full-16 minus active-8)**:
`create_bill`, `create_vendor_prepayment`,
`apply_vendor_prepayment`, `create_vendor_credit`,
`apply_vendor_credit`, `request_missing_document`,
`route_to_bank_reconciliation`, `route_to_AR_future`. Reserved
per ADR-0010 reserved-enum-states discipline — defined in the
enum, not emitted by any v1 service write path.

### Reserved-value handling for v1 manual workflows (per ADR-0011 §13 verbatim)

> v1 manual workflows that conceptually correspond to
> reserved values (record vendor credit, create vendor prepayment,
> apply vendor credit) are accessible from the queue UI but route
> the user to the AP/Spend domain service's manual entry form
> rather than emitting a queue-resolution row with the reserved
> action; the row is not closed via the resolution enum until the
> domain service completes the underlying mutation.

This pattern preserves substrate-decision-integrity at the
substrate-vs-emission axis: the reserved enum value exists at
v1 schema time per ADR-0010 discipline (substrate ratified);
emission gates on domain-service implementation availability
(enforcement landing at Phase 5 AP/Spend domain shipping per
substrate-now-enforcement-later cross-pattern from D6 §6.8 +
ADR-0010 amendment Variant A).

### Substrate-vs-domain placement boundary (per ADR-0011 §13 verbatim)

> The exception queue lives in the Document Platform brief (it's
> substrate). The domain-specific manual workflows it triggers
> (record vendor credit, open vendor statement reconciliation,
> file employee reimbursement) live in the Spend Initiative brief
> or future domain briefs.

### Tier-capability framing (split per chunk B2-1 §4 δ-2-i lock + ADR-0007 Tier semantics)

Per chunk B2-1 §4 δ-2-i lock, the exception queue carries
split-framing: substrate at Tier 2 (data-layer entity ownership)
+ UI surface at Tier 3 (user-facing Interface Path). This brief
clarifies the semantic distinction inline:

- **Substrate (data-layer entity ownership): Tier 2 per
  ADR-0011 §1 + §13.** Resolution-action enum, document-type-
  aware action contract, reclassification workflow contract,
  bulk-operation contract live at the substrate. **"Tier 2"
  here means *where the entity columns live* (Document Platform
  data-layer entity ownership), NOT *which agent tier executes
  the write*.**
- **Write-path execution: Tier 1 per ADR-0007 §Tier 1.** Per
  ADR-0007 §Tier 2 strict no-write rule ("Tier 2 stages MUST
  NOT call mutating service entry points. MUST NOT INSERT /
  UPDATE / DELETE in any table directly"), substrate-metadata
  writes (e.g., `mark_duplicate`, `mark_non_accounting`,
  `archive` updating queue-row state) route through Tier 1
  commits via `withInvariants()`. The writes are non-financial-
  state but still Tier-1-executed.
- **UI surface: Tier 3 per ADR-0007 §Tier 3.** The exception
  queue UI surface (rendering, interaction, document-type-aware
  action affordances, reclassification workflows, bulk
  operations, screenshot-gate ratification) is Tier 3 user-
  facing Interface Path. ADR-0007 §Tier 3 explicitly names
  "exception explanation" as Tier 3 ownership. Tier 3 MUST NOT
  expose internal pipeline complexity (no internal stage names,
  sub-agent identifiers, intermediate Zod outputs); the user
  sees "the agent" surface per ADR-0006, not "the AP Agent's
  vendor-matcher stage rev 3."

### Resolution-action capability mapping

Per ADR-0007 framing + ADR-0011 §13 resolution-action
semantics:

- **Tier 1 capability dependent (state-changing actions)**:
  `record_bill_payment`, `create_bill`, `create_vendor_credit`,
  `create_vendor_prepayment`, `apply_vendor_prepayment`,
  `apply_vendor_credit` — financial-state changes route through
  Tier 1 `withInvariants()` commits via domain services per
  Reading B (`paymentService.record(...)`,
  `billService.post(...)`, etc.).
- **Tier 1 substrate-metadata writes (non-financial-state)**:
  `mark_duplicate`, `mark_non_accounting`, `archive` — update
  case-row metadata via Tier 1 commits but produce no journal
  entry.
- **Tier 3 routing decisions (UI workflow routing)**:
  `route_to_manual_entry`, `route_to_bank_reconciliation`,
  `route_to_AR_future`, `reprocess`, `request_missing_document`
  — the user-facing routing decision is Tier 3 façade (per
  ADR-0007 §Tier 3 "exception explanation" ownership); the
  actual workflow target then becomes a Tier 1 commit when the
  user takes the routed action.
- **Cross-domain handoff**: `attach_to_existing_bill`,
  `attach_to_existing_payment` — AP/Spend domain consumption of
  ProposedAttachment per ADR-0011 §7.

### Flag 3 — `wrong_entity_exception` cross-enum inconsistency (carry-forward governance question)

Per chunk B2-1 §2 substrate flag (carried forward to chunk B2-3
§11 surface): ADR-0011 §10 names `wrong_entity_exception` as
reserved "in the exception-routing enum (per §13 below)," but
§13's 16-value `resolution_action` enum does NOT list it.

Reading A (most likely): two distinct enums conflated under
"exception-routing" — exception-TYPE enum (input
categorization; why the case landed in queue) vs resolution-
action enum (output disposition; what the human chose). The
first enum doesn't exist in any ratified Phase 0 ADR.

**Status**: Phase 2 carry-forward governance question per
founder Path (a) defer verdict. Warrants either ADR-0011
amendment introducing the exception-TYPE enum OR downstream-ADR
ratification (potential ADR-0016 / ADR-0018 candidate).
Founder-domain triage timing.

### Flag 4 (NEW) — `manual_born_paid_workflow` cross-enum question

Per ADR-0015 Decision item 7 Scenario C (see §13 below), a
sibling cross-enum inconsistency: ADR-0015 cites
`resolution_action = manual_born_paid_workflow` as "a reserved
value per ADR-0010; full enum membership owned by ADR-0011
§13," but ADR-0011 §13's 16-value `resolution_action` enum
does NOT list `manual_born_paid_workflow` either.

Possible interpretations: (a) `manual_born_paid_workflow` is
subsumed under `route_to_manual_entry` (the v1-active
resolution action for Scenario C routing) and ADR-0015
Decision item 7's reference is a sub-route nomenclature;
(b) ADR-0011 §13's enum is incomplete and
`manual_born_paid_workflow` should be added; (c) drafting
drift between ADR-0011 §13 and ADR-0015 Decision item 7.

**Status**: Phase 2 carry-forward governance question parallel
to Flag 3 (chunk B2-1 §2 + chunk B2-3 §11 + chunk B2-3 §13
surfaces); warrants either ADR-0011 amendment OR ADR-0015
Decision item 7 clarification. Founder-domain triage timing.

### Cross-references

- **ADR-0011 §1 + §13** — entity ownership + first-class
  deliverable framing (substrate)
- **ADR-0007 §Tier 1, §Tier 2, §Tier 3** — Tier-capability
  framing (write-path execution + UI surface; "exception
  explanation" Tier 3 ownership at line 313 + line 343)
- **ADR-0010** — reserved-enum-states discipline
- **D6 §6.8 + ADR-0010 amendment Variant A** — substrate-now-
  enforcement-later cross-pattern
- **ADR-0015** — domain-specific manual workflows triggered
  from queue (record vendor credit, vendor statement
  reconciliation, employee reimbursement)
- **ADR-0011 §10** — cross-enum reference for Flag 3
  `wrong_entity_exception`
- **ADR-0015 Decision item 7** — cross-enum reference for
  Flag 4 `manual_born_paid_workflow`

## 12. Multi-entity reservation

Multi-entity setups (family-office, multi-subsidiary) are post-
v1. Adding entity reservations now is cheap; retrofitting is
expensive. Per ADR-0011 §10 (citation-anchor: §10, NOT §17 —
§17 is the reframe-spec anchor; ADR-0011 re-anchored at §10),
the platform reserves five nullable columns at v1 schema time.

### Five reserved nullable columns (per ADR-0011 §10 verbatim)

> - `source_documents.legal_entity_id` (uuid, nullable, reserved).
>   The legal entity the document is addressed to. May differ from
>   `org_id` in multi-entity setups. Defaults to `org_id` in v1.
> - `bills.legal_entity_id` (nullable, reserved). The legal entity
>   that owns the AP bill. Owned by ADR-0015's schema; named here
>   for cross-reference because the document-to-bill link must
>   preserve the entity association.
> - `bill_lines.benefiting_entity_id` (nullable, reserved).
>   Allocation-level entity. Owned by ADR-0015's schema.
> - `payments.paying_entity_id` and
>   `payments.benefiting_entity_id` (nullable, reserved). Owned by
>   ADR-0015's schema.

v1's 1-1 mapping defaults `source_documents.legal_entity_id` to
`org_id`. Bills, bill_lines, and payments columns ship as
nullable reserved per ADR-0015's schema.

### `wrong_entity_exception` reservation (per ADR-0011 §10)

> The platform also reserves the **`wrong_entity_exception` value**
> in the exception-routing enum (per §13 below). A document
> addressed to a legal entity not currently configured in the org
> routes to controller review with manual override available.

(Note: Flag 3 cross-enum inconsistency surface at §11 above —
`wrong_entity_exception` referenced in ADR-0011 §10 not present
in ADR-0011 §13's 16-value `resolution_action` enum;
carry-forward governance question per founder Path (a) defer.)

### Out-of-scope framing (per ADR-0011 §10 verbatim)

> Intercompany due-to / due-from postings are post-v1 and out of
> scope for this ADR. The reservations let the platform absorb
> multi-entity workflows without retrofit when the post-v1 phase
> lands.

### Substrate-now-enforcement-later cross-pattern

Per D6 ratification package §6.8 + ADR-0010 amendment Variant A
(NULL-default forward-compatible config-column reservation),
the 5 reserved nullable entity columns operationalize the
substrate-now-enforcement-later cross-pattern at column-grain:

- **Substrate at v1**: 5 nullable columns ship at v1 schema
  time (per ADR-0011 §10; per ADR-0015's schema for the
  domain-owned columns).
- **Enforcement at Phase 5 (or later)**: when AP/Spend domain
  ships (Phase 5 first-domain consumer per ADR-0015), the
  enforcement landing point fires for `bills.legal_entity_id`,
  `bill_lines.benefiting_entity_id`, `payments.paying_entity_id`,
  `payments.benefiting_entity_id` per AP/Spend domain
  multi-entity logic.
- **Multi-entity activation**: when multi-entity setups
  activate (post-v1 phase), `source_documents.legal_entity_id`
  begins emitting non-`org_id` values per multi-entity routing
  logic.

Three-layer ADR-0010 defense applies across all 5 columns:
Layer 1 DB CHECK admits NULL-or-legal-value (uuid format);
Layer 2 Zod boundary rejects non-NULL at v1 (until activation
phase); Layer 3 service emission filter prevents non-NULL
writes at v1.

### Cross-references

- **ADR-0011 §10** — canonical anchor (note: §10, NOT §17 —
  §17 is reframe-spec anchor; ADR-0011 re-anchored at §10 per
  chunk B2-1 §2 substrate-flag-and-correction precedent)
- **ADR-0015** — schema ownership for `bills.legal_entity_id`,
  `bill_lines.benefiting_entity_id`,
  `payments.paying_entity_id`, `payments.benefiting_entity_id`
  columns
- **ADR-0010 amendment Variant A** — NULL-default forward-
  compatible reservation discipline
- **D6 ratification package §6.8** — substrate-now-enforcement-
  later cross-pattern codification

## 13. Receipt v1 decision matrix

Per ADR-0015 Decision item 7 (citation-anchor: **Decision item
7, NOT §15** — ADR-0015 organizes content as numbered Decision
items under `## Decision`; the phrase "§15" inside ADR-0015
refers to **reframe-spec §15**, not an ADR-0015 §15-numbered
section). Receipt v1 path covers Scenarios A / B / C with the
classifier-side `payment_confirmation` document-type
discriminator handling cross-referenced to ADR-0014 §6/§7.

### Scenario A — Receipt as payment evidence (v1 active)

Per ADR-0015 Decision item 7 verbatim:

> The receipt arrives after a payment is already recorded in
> CHOUnting. The classifier identifies the receipt as a
> `payment_confirmation` document type; the Relationship Router
> matches the receipt to the existing `payments` row by amount,
> date, vendor, and (when available) authorization/reference
> number. The output is a
> `ProposedAttachment(attach_payment_evidence)` per ADR-0011 §7.
> No ledger mutation — the attachment commit goes through
> `documentLinkService.create()` and produces a
> `source_document_links` row with `link_role = payment_evidence`.
> The bill itself, the payment row, and the journal entries are
> all unchanged. v1 active per the reframe spec §15 matrix.

**Contract:**
- **Input:** receipt arrives **after** payment already recorded
- **Classifier output:** `document_type = payment_confirmation`
- **Relationship Router match key:**
  `payments.{amount, date, vendor, authorization/reference}`
- **Proposal type:** `ProposedAttachment(attach_payment_evidence)`
  per ADR-0011 §7
- **Commit path:** `documentLinkService.create()` →
  `source_document_links` row with `link_role =
  payment_evidence`
- **Ledger effect:** none (bill, payment row, JE unchanged)

### Scenario B — Receipt as payment trigger (v1 active)

Per ADR-0015 Decision item 7 verbatim:

> The receipt arrives for a bill that is already recorded in
> CHOUnting but not yet marked paid. The classifier identifies
> the receipt as a `payment_confirmation` or `receipt`; the
> Relationship Router matches the receipt to an open bill
> (`bills.lifecycle_state IN ('approved_for_payment',
> 'partially_paid')`) by vendor, amount, date, and supporting
> context. The output is a
> `ProposedMutation(record_bill_payment)` that produces a
> `payments` row, a `bill_payment_allocations` row, and the
> corresponding journal entry (`Dr AP / Cr Bank-or-Card`)
> through `paymentService.record(...)` which routes the ledger
> operation through `ledgerService.post(...)` per Reading B.
> The receipt itself attaches as `payment_evidence` via the
> same proposal flow (the proposal carries both the mutation
> and the attachment as a post-commit step per ADR-0012 §2 —
> attachments are not bundle children). v1 active per the
> reframe spec §15 matrix.

**Contract:**
- **Input:** receipt arrives for bill already recorded but not
  yet paid
- **Classifier output:** `document_type = payment_confirmation`
  or `receipt`
- **Relationship Router match key:** open bill
  (`bills.lifecycle_state IN ('approved_for_payment',
  'partially_paid')`) by vendor + amount + date + supporting
  context
- **Proposal type:**
  `ProposedMutation(record_bill_payment)`
- **Commit path:** `paymentService.record(...)` →
  `ledgerService.post(...)` (Reading B compliance) → produces
  `payments` row + `bill_payment_allocations` row + JE
  `Dr AP / Cr Bank-or-Card`
- **Attachment side:** receipt attaches as `payment_evidence`
  in same proposal flow as post-commit step per ADR-0012 §2
  (attachments are NOT bundle children; if bundle commits,
  attachment fires after COMMIT success)

### Scenario C — Standalone POS receipt → born-paid bundle (v1 active via manual workflow)

Per ADR-0015 Decision item 7 verbatim:

> The receipt arrives for a vendor purchase with no
> pre-existing bill in CHOUnting (a credit-card receipt for
> office supplies; a restaurant receipt for a client meal).
> The classifier identifies the receipt; the Relationship
> Router does not find a matching open bill. **v1 routing:
> exception queue with manual born-paid workflow available**
> per the reframe spec §15 matrix and the "Manual born-paid
> workflow" callout. The exception emits a typed exception
> through the queue per ADR-0011 §13 with `resolution_action
> = manual_born_paid_workflow` (a reserved value per ADR-0010;
> full enum membership owned by ADR-0011 §13).

**Manual born-paid workflow** (per ADR-0015 Decision item 7
verbatim):

> The manual born-paid workflow is the controller-authored
> path: the controller opens the exception, reviews the
> receipt, and authors a born-paid bundle proposal (the bill
> side and the payment side together) using the same
> `billService.postWithImmediatePayment(bundle)` domain
> service that the automated path uses. Per ADR-0012 §11
> manual + automated path uniformity, manual differs from
> automated only in **how the bundle was proposed**
> (controller-authored vs classifier-routed); the commit path
> is identical.

**Contract:**
- **Input:** receipt arrives for vendor purchase with no
  pre-existing bill in CHOUnting
- **Relationship Router result:** no matching open bill found
- **v1 routing:** exception queue with manual born-paid
  workflow available
- **Exception shape:** typed exception via ADR-0011 §13 with
  `resolution_action = manual_born_paid_workflow` (reserved
  per ADR-0010)
- **Manual workflow commit path:** controller opens the
  exception → reviews receipt → authors born-paid bundle
  proposal (bill side + payment side together) → commits via
  `billService.postWithImmediatePayment(bundle)` (same domain
  service as automated path; per ADR-0012 §11 manual +
  automated path uniformity)
- **Bundle composition:** `ProposedMutationBundle` with
  children `post_bill` + `record_bill_payment` per ADR-0012
  §12 v1-active `born_paid_bill` bundle type
- **v1 status:** v1-active via manual workflow; automated
  born-paid path is post-v1

**Flag 4 — `manual_born_paid_workflow` cross-enum question
(carry-forward governance question parallel to Flag 3).**
ADR-0015 Decision item 7 cites `resolution_action =
manual_born_paid_workflow` as "a reserved value per ADR-0010;
full enum membership owned by ADR-0011 §13." However,
ADR-0011 §13's 16-value `resolution_action` enum (per §11
above) does NOT list `manual_born_paid_workflow`. Sibling
inconsistency to Flag 3 (`wrong_entity_exception`):

Possible interpretations: (a) `manual_born_paid_workflow` is
subsumed under `route_to_manual_entry` (the v1-active
resolution action for Scenario C routing) and ADR-0015
Decision item 7's reference is a sub-route nomenclature;
(b) ADR-0011 §13's enum is incomplete and
`manual_born_paid_workflow` should be added; (c) drafting
drift between ADR-0011 §13 and ADR-0015 Decision item 7.

**Status**: Phase 2 carry-forward governance question parallel
to Flag 3. Warrants either ADR-0011 amendment OR ADR-0015
Decision item 7 clarification. Founder-domain triage timing.

### Lifecycle synthesis for Scenarios A / B / C (per ADR-0015 Decision item 7 verbatim)

> All three scenarios use the canonical `mutation_lifecycle.md`
> states (Pending, Needs Attention, Approved, Posted (auto),
> Posted (manual), Finalized; Rejected, Rejected-with-reversal).
> v1 has no auto-post for `born_paid_bill` (Scenario C) per
> Q60 v1 closure; Scenarios A and B follow the same Pending →
> Approved (Always Confirm v1) → Posted (manual) → Finalized
> path under v1 ProposedAttachment and ProposedMutation rules
> from ADR-0011 §7.

**v1 commit-path summary:**
- **Scenario A**: `documentLinkService.create()` (no ledger
  mutation; document-layer audit only — `attachment_link_created`
  per ADR-0011 §1 canonical writer)
- **Scenario B**: `paymentService.record(...)` (produces
  ledger mutation via `ledgerService.post(...)` per Reading B)
- **Scenario C**: `billService.postWithImmediatePayment(bundle)`
  (produces bundle ledger mutation per ADR-0012 §3 atomicity)

Per ADR-0011 §7's ProposedAttachment v1 approval policy,
Scenario A's approval gate is **Always Confirm except** the
user-initiated direct-upload variant (a controller dragging a
receipt directly onto a specific payment row, where the upload
action itself is the implicit approval); Scenarios B and C are
always Always Confirm in v1.

### Classifier-side cross-reference (per ADR-0014 §7)

Per ADR-0014 §7 (Document-type classification strategy; Q71
closure), the tiered classification produces document-type
discriminator values consumed by Scenarios A/B/C:

- **Tier A — Rule-based classifier (active v1)**: matches on
  payment-confirmation language ("payment received", "thank
  you for your payment") + receipt-shape patterns (terminal-
  style line layout, total at bottom, payment-method line) +
  filename heuristics ("receipt"). High precision, low recall.
- **Tier C — Claude Sonnet AI fallback (active v1)**: invoked
  when Tier A no-match. OCR text + system prompt naming the
  document-type enum. Output Zod-validated; non-validating →
  exception with `unknown` type.
- **Tier D — Unknown (active v1)**: terminal classification
  when prior tiers fail; routes to exception queue per
  ADR-0011 §13.

**Per-document-type confidence threshold (Q65 v1 provisional
values per ADR-0014 §7):**

| Document type | Threshold | Below-threshold path |
|---|---|---|
| `vendor_invoice` | 0.85 | Exception queue (`needs_review`) |
| `receipt` | 0.80 | Exception queue (`needs_review`) |
| `payment_confirmation` | 0.85 | Exception queue (`needs_review`) |
| `unknown` | N/A | Always exception queue |

Provisional values per Q77 v1-ship-gate pattern; ADR-0019
ratifies at v1 ship; ADR-0014 amends if ratification adjusts.

**Dedup-by-hash idempotency cross-reference (per ADR-0014 §6,
Q70 closure):** Before writing a new `source_documents` row,
the ingestion path computes SHA-256 of bytes and checks for
existing `source_documents.original_content_hash` match within
the same `org_id` scope. Match-found → skip OCR sidecar;
reuse artifact rows; audit event `ingestion_dedup_hit`. Per-
org scope; cross-org dedup not in scope. v1 system-fixed; per-
org configurability reserved post-v1 via
`org_settings.dedup_policy`. Receipts arriving via multiple
ingestion channels (drag_drop_pdf + forwarded_mailbox of the
same receipt) short-circuit at this dedup stage before
Scenario A/B/C routing fires.

### Cross-references

- **ADR-0015 Decision item 7** — canonical citation (NOT §15
  — ADR-0015 uses Decision-item numbering)
- **ADR-0011 §7** — three-proposal-type contract
  (ProposedMutation / ProposedMutationBundle / ProposedAttachment)
- **ADR-0011 §13** — exception-queue routing for Scenario C +
  resolution-action enum
- **ADR-0012 §2** — bundle children = ProposedMutations only
  (NOT ProposedAttachments); workflows requiring both sequence
- **ADR-0012 §3** — bundle atomicity (single Postgres
  transaction)
- **ADR-0012 §11** — manual + automated path uniformity
- **ADR-0012 §12** — bundle types closed enum (v1-active
  `born_paid_bill`)
- **ADR-0014 §6** — dedup-by-hash idempotency (Q70 closure)
- **ADR-0014 §7** — document-type classification strategy
  (Q71 closure with Tier A/C/D + per-document-type thresholds)
- **reframe-spec §15** — receipt v1 decision matrix canonical
  origin (cited by ADR-0015 Decision item 7)

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
