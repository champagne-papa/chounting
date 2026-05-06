# Phase 2 Brief Pre-Positioning Notes (2026-05-06)

## Purpose

Anchor for next-session Phase 2 brief-creation arc. Captures pre-flight read findings + scope-shape + Sub-Q candidates + dependency status. Substantive content fills in alongside Phase 2 brief-creation work; this file is the **onset-anchor, not the brief itself**.

Written 2026-05-06 at Phase 1.Storage closure (PR #8 merged at `389adbb`; closeout skeleton at `f05d27e`). Phase 2 = Document Core (cases + artifacts + exception queue first-class deliverable) + Tier 2 Document Pipeline. Phase 5 = AP foundation (consumer of Phase 2 substrate). Phase ordering per ADR-0014 §Triggered by + ADR-0015 §Triggered by.

Per founder Frame 1 forward-sequencing recommendation, this file is one of three closeout-cycle work products: (1) skeleton closeout entry (landed at `f05d27e`); (2) Branch 4 INDEX hygiene (verified empty as scoped); (3) THIS — Phase 2 onset-cycle anchor.

## Phase 2 substantive scope

### From ADR-0011 §3 (document_cases + document_case_sources)

**Source-vs-case distinction.** A `source_document` is the raw file (Phase 1.Storage substrate). A `document_case` is a workflow item — created when a source warrants action (extraction, classification, matching, proposal, exception routing). Source = artifact; case = unit of work.

**Cardinality model.** One file → zero (filtered: duplicate hash, non-document mime), one (common case), or many (multi-page PDF containing invoice + delivery note + remittance → three cases). A case may also draw from multiple source documents; many-source-to-one-case modeling lives in `document_case_sources(document_case_id, source_document_id, role)`.

**Role enum (closed per ADR-0010):**
- Full reserved set: `primary | supporting | email_body | payment_evidence | superseded_source | related_prior_document`
- v1 active subset: `primary | supporting | email_body | payment_evidence`

**Lifecycle states (10):**
`received → extracting → classified → matched → proposed → needs_review → approved → committed → rejected → archived`

**Transition guards (verbatim load-bearing):**
- `received → extracting`: automation only (document-job worker)
- `extracting → classified`: automation only
- `classified → matched`: automation only (Relationship Router per ADR-0018)
- `classified | matched → needs_review`: automation (low confidence; ambiguity; unrecognized)
- `matched → proposed`: automation; produces ProposedMutation / ProposedMutationBundle / ProposedAttachment
- `proposed → approved`: human only (Tier 1 commit-time confirmation per ADR-0007)
- `approved → committed`: automation (ledger commit succeeds)
- `proposed | needs_review → rejected`: human only
- `needs_review → matched | proposed`: human only (exception queue resolution)
- `committed | rejected → archived`: automation, delayed cadence

**Reversibility framing.** `committed` is NOT reversible at case level (case-level reversibility is misframe). Reversal lives at journal-entry level per ADR-0001, against `source_document_links` row. Committed case with reversed entries → `link_status = 'reversed'`; case state itself doesn't roll back.

**Enforcement layer.** State-machine guards are service-layer (Layer 2) — workflow-actor authority isn't expressible in schema CHECKs. Schema reserves all states per ADR-0010; service guards reject illegal transitions with typed `ServiceError`.

### From ADR-0011 §5 (document_artifacts engine-agnostic contract)

**Engine-agnostic boundary.** `document_artifacts` is the contract that swaps OCR engine choice without consumer-code churn. Every consumer of OCR output (classifier, field extractor, table extractor, validator) reads `document_artifacts`, NOT raw engine output.

**Row shape (verbatim columns):**
- `id`, `source_document_id`, `ocr_run_id`, `extraction_run_id`
- `engine` (e.g. `paddleocr`, `tesseract`, `claude_vision_3_5`)
- `engine_version` (model + engine version for replay)
- `pages` (jsonb) — page-level (page #, rotation, dimensions, page-level confidence)
- `lines` (jsonb) — line-level (text, bounding box, per-line confidence)
- `words` (jsonb) — word-level (token, bounding box, per-word confidence)
- `quality_flags` (text[])
- `pipeline_trace` (jsonb)
- `confidence` (numeric overall artifact-level)
- `created_at` (timestamptz)

**`quality_flags` closed enum:** `low_resolution`, `skewed`, `partial_page`, `noise_threshold`.

**`pipeline_trace` structure.** Per-stage record array; each stage carries `stage_name`, `input_hash`, `output_hash`, `model`, `timestamp`. Per ADR-0007 Q30 resolution.

### From ADR-0011 §6 (document-type discriminator)

**Full reserved set (18 values per ADR-0010 closed-enum discipline):**
`vendor_invoice, receipt, payment_confirmation, credit_memo, vendor_statement, purchase_order, receiving_document, retainer_request, deposit_request, bank_statement, card_statement, customer_invoice, customer_remittance, tax_form, contract, payroll_document, asset_purchase_support, unknown`

**v1 active subset (4):** `vendor_invoice`, `receipt`, `payment_confirmation`, `unknown`.

**Reserved-but-not-emitted (14):** Remaining values defined in enum, not emitted by any v1 classifier path. Documents the v1 classifier identifies as one of these route to exception queue with manual resolution per §13.

**Routing semantics.** Classification confidence threshold for exception-vs-proposal routing governed by ADR-0019 (Q57, Q65). Platform contract: every case carries `document_type` + `classification_confidence`; routing logic that consumes those is ADR-0019's concern, not §6's.

### From ADR-0011 §13 (exception queue first-class)

**Reframe.** v1 routes 14 of 18 document types to exception queue. The queue is bulk of user-visible work — founder + 2 real users will spend most of their time there, not on the happy path. Ships as **first-class workflow tool, NOT deferral mechanism**.

**First-class deliverable requirements:**
- Document-type-aware actions (credit memo → record-vendor-credit; vendor statement → reconciliation view; bank statement → manual classification)
- Reclassification workflows (misclassified-as-exception easily moves to right type)
- Bulk operations (filter by type / vendor / date; bulk-approve, bulk-route, bulk-reclassify)
- Screenshot-gate UI ratification per CLAUDE.md

**Resolution-action enum (Q68, full closed set, 16 values):**
`create_bill, attach_to_existing_bill, attach_to_existing_payment, record_bill_payment, create_vendor_prepayment, apply_vendor_prepayment, create_vendor_credit, apply_vendor_credit, mark_duplicate, mark_non_accounting, request_missing_document, route_to_manual_entry, route_to_bank_reconciliation, route_to_AR_future, reprocess, archive`

**v1 active subset (8):**
`attach_to_existing_bill, attach_to_existing_payment, record_bill_payment, mark_duplicate, mark_non_accounting, route_to_manual_entry, reprocess, archive`

**Reserved-but-not-emitted handling.** v1 manual workflows that conceptually correspond to reserved values (record vendor credit, create vendor prepayment, apply vendor credit) accessible from queue UI but route user to AP/Spend domain service's manual entry form rather than emitting a queue-resolution row with the reserved action. Row not closed via resolution enum until the domain service completes the underlying mutation.

**Boundary.** Exception queue lives in Document Platform brief (substrate). Domain-specific manual workflows it triggers (record vendor credit, vendor statement reconciliation, employee reimbursement) live in Spend Initiative brief or future domain briefs.

### From ADR-0014 (Tier 2 Document Pipeline)

**Pipeline scope (8-stage flow):**
1. `dedupByHash` (short-circuit on SHA-256 match)
2. `storageProviderService.fetch()` (ADR-0013)
3. `runOCR` (Python sidecar)
4. `classifyDocumentType` (Tier A → Tier C → Tier D)
5. `extractFields` (per document type)
6. `matchVendor` (vendor identity + matching reads only)
7. `matchAgainstExistingState` (relationship-candidate subsystem; ADR-0014 owns this; ambiguity + re-evaluation owned by ADR-0018)
8. `buildProposal` → ProposedMutation / ProposedMutationBundle / ProposedAttachment

Pipeline NOT wrapped in `withInvariants()` (proposes, doesn't commit). `trace_id` propagates via ServiceContext + `X-Trace-Id` header to sidecar.

**OCR engine choice (v1 locked):** PaddleOCR via Modal sidecar.
- `document_artifacts.engine = 'paddleocr'`
- Rationale: deterministic output preserves Q30 byte-for-byte reproducibility; Claude Vision rejected (probabilistic vision-LLM breaks reproducibility); Tesseract rejected (weaker French extraction; v1 needs French-Canadian bilingual)
- Reserved engines: `tesseract`, `claude_vision`. Engine swap is routine activation behind engine-agnostic `document_artifacts` contract — no schema migration

**Python sidecar topology (Modal v1 locked):**
- Service: `document-pipeline-py`, containerized GPU-enabled
- Stateless request/response over HTTP (not streaming); no session state
- Auth: shared-secret HMAC via X-Auth-HMAC header (manual rotation v1; production-hardened post-v1)
- Language boundary: TypeScript-as-source-of-truth — Zod on TS side; JSON Schema generated; Python Pydantic consumes
- Failure semantics: cold-start timeout = transient retryable; service down or schema-mismatch = persistent unavailable (no retry)
- Rollback strategy: two Modal image versions (current + previous-stable); operator flips routing on regression

**Classification strategy:**
- **Tier A** — Rule-based (active v1): header heuristics, payment-confirmation language, receipt-shape patterns, filename heuristics. High precision, low recall.
- **Tier B** — Small classifier (reserved post-v1): fastText or small transformer over OCR text. Trained on v1-generated corpus.
- **Tier C** — Claude Sonnet AI fallback (active v1): called when Tier A no-match. OCR text + system prompt naming v1 active enum + extraction targets. Output Zod-validated.
- **Tier D** — Unknown (active v1): all preceding tiers fail → `document_type = 'unknown'`, exception queue.

**Confidence thresholds (Q65 v1-provisional; ADR-0019 ratifies at v1 ship):**

| Document type | Threshold | Below-threshold path |
|---|---|---|
| `vendor_invoice` | 0.85 | Exception queue (`needs_review`) |
| `receipt` | 0.80 | Exception queue (`needs_review`) |
| `payment_confirmation` | 0.85 | Exception queue (`needs_review`) |
| `unknown` | N/A | Always exception queue |

**Dedup-by-hash:** SHA-256 of bytes checked against `source_documents.original_content_hash` within `org_id` scope BEFORE new `source_documents` row inserts. Match-found → skip OCR sidecar; reuse artifact rows; audit event `ingestion_dedup_hit`. Per-org scope; cross-org dedup not in scope. v1 system-fixed.

**Vendor matcher integration:** Three-category read-boundary split (per ADR-0007). Reads: name, aliases, tax ID, email/domain, address, default account mapping, historical template, COA, tax codes, classes/projects/departments. Forbidden: transactional state (bills, payments, balances, period status); vendor control / payment-risk fields (bank account, payment instructions, bank-detail-confirmed, payment hold, blocked-vendor) — Tier 2.5 territory.
- Output: `VendorMatchResult { vendor_id | null, confidence, match_type, candidate_alternatives[] }`
- Threshold: 0.80 v1-fixed. Null `vendor_id` → exception queue with `route_to_manual_entry`.
- Mechanical enforcement: ADR-0007 Q29 ESLint rule (concrete design at first `src/agent/pipelines` code).

**AI fallback contract:**
- Input: `document_artifacts.lines` + `pages` + system prompt naming v1 active enum.
- Critical: NEVER pass raw image bytes (preserves engine-agnostic boundary + Q30 reproducibility).
- Output: Zod-validated JSON. Two shapes: classification-only vs field-extraction.
- Validation gate: non-validating output → `ai_fallback_validation_failed` audit → exception with `unknown`.
- Budget: max 2 fallback calls per source document v1.
- Trace: `pipeline_trace.input_hash = SHA-256(OCR text + system prompt version)`, `output_hash = SHA-256(validated JSON)`.

**Orphan-blob GC:**
- v1 acceptance: 24-hour age threshold + daily cadence
- v1 provider scope: `supabase_storage` only
- Audit: `orphan_blob_collected`
- Per-org configurability post-v1 (`org_settings.gc_cadence`, `org_settings.gc_threshold_hours`)

**Replay / idempotency (ADR-0011 §9 immutability):**
- Replays produce new `ocr_runs` / `extraction_runs` rows
- Auto-supersede when structural similarity (same type, field-shape match, no confidence-band crossing) AND prior artifact unconsumed
- Explicit promotion when structural difference OR prior artifact consumed
- v1 cadence: manual / controller-triggered only

**Reserved `org_settings.*` columns (12, all NOT NULL with v1-fixed defaults):**
`ocr_engine`, `replay_cadence`, `dedup_policy`, `classification_fallback_order`, `ai_fallback_budget`, `vendor_match_threshold`, `gc_cadence`, `gc_threshold_hours`, `retention_source_documents`, `retention_artifacts`, `retention_runs`, `language_packs`

**Failure-classification matrix (mirrors ADR-0013 §7 shape):**
1. **Transient retryable** (sidecar cold-start timeout, AI rate-limit, brief unavailability) — retry max 3 attempts, 500ms base, 2x factor, ±20% jitter, ~3.5s budget.
2. **Persistent unavailable** (auth failure, sidecar down, model unavailable, schema mismatch) — no retry; route to exception with `pipeline_unavailable`.
3. **Permanent malformed** (corrupted PDF, empty OCR, AI Zod-fail, sub-threshold confidence) — no retry; route to `extraction_failed`.

**Logic Receipt (per INV-AGENT-002 + ADR-0007 Q30):** emitted at proposal-creation. Fields: `rule_id` (or `'novel_pattern'`), `input_features`, `historical_match_count`, `confidence_score` (internal-only), `source_transactions`, `user_utterance`, `pipeline_trace: PipelineStageRecord[]`. Bundle-level emission per ADR-0012.

### From ADR-0015 (AP/Spend Subdomain — Phase 5 consumer)

**Subdomain scope.** First domain consumer of Document Platform substrate (ADR-0011/0012/0013/0014). Owns bill / payment / vendor prepayment / vendor credit / vendor master lifecycles. Producer of ledger operations consumed by `ledgerService.post(...)` (Reading B preserved; AP never writes journal_entries directly).

**Tables (entity ownership per ADR-0011 §1):**
`bills`, `bill_lines`, `payments`, `bill_payment_allocations`, `vendor_prepayments`, `vendor_prepayment_applications`, `vendor_credits`, `vendor_credit_applications`, `vendors`.

**Bill lifecycle (closed enum, 7 values):**
`draft, pending_approval, approved_for_payment, partially_paid, fully_paid, voided, cancelled`

**Born-paid bundle pattern (Q60 v1 closure):** v1 born-paid bundles are Always Confirm — no auto-post for `born_paid_bill`. Both manual workflow and classifier-routed receipt flow through `billService.postWithImmediatePayment(bundle)` per ADR-0012 §11. Auto-post calibration forward-pointed to ADR-0017.

**Payment lifecycle (closed enum):**
- Full: `pending, paid, failed, partially_returned, refunded`
- v1 active: `pending, paid, failed`

**Failure handling: proposal-and-confirm, NOT auto-reverse.** `paymentService.proposeFailureReversal(payment_id, failure_reason)` constructs `ProposedMutation(reverse_failed_payment)`. Controller approves via Four Questions surface. Commit runs inside `withInvariants()` as single Postgres transaction (NOT a saga). Auto-reverse rejected on four grounds: (1) Reading B violation, (2) audit-trail visibility loss, (3) conflation of signal-handling with ledger authority, (4) acceptable v1 latency.

**Reconciliation-metadata preservation columns (on `payments`):** `bank_or_card_last4`, `merchant_identifier`, `authorization_reference`, `statement_appearance_date`. Required for born-paid bundle Scenario C; populated from receipt OCR or controller manual entry.

**Vendor prepayment lifecycle:**
- Type enum: full `retainer, deposit, advance, security_deposit, prepaid_service, inventory_deposit, fixed_asset_deposit, other`; v1 active `retainer, deposit, advance, other`
- Status enum: full `open, partially_applied, fully_applied, refunded, written_off, forfeited`; v1 active `open, partially_applied, fully_applied, refunded`
- **Bifurcated approval:** future-cash retainer (controller-only) vs after-the-fact classification (AP-specialist sufficient)
- **Backfill path (Q64):** missing prepayment → exception queue with `backfill_vendor_prepayment_suggested` (reserved). Three resolution paths: (1) backfill (default); (2) record bill at net with controller-stamped reason (audit `bill_recorded_with_out_of_scope_deposit`); (3) defer/leave open

**Vendor credit lifecycle:**
- Status enum: full `open, partially_applied, fully_applied, expired`; v1 active `open, partially_applied, fully_applied`
- Reserved bundle type `vendor_credit_applied_to_bill` (ADR-0012 §12; reserved at v1)
- **Credit-vs-prepayment distinction**: prepayment = cash already left (vendor "owes" goods/services); credit = vendor-issued reduction in what we owe

**Tax-timing semantics (Q62 closure):**
- Choice enum: full `at_payment, at_final_invoice, controller_chooses_per_invoice, review_required`; v1 active `at_payment, at_final_invoice, review_required`
- Three-layer resolution: per-document override > per-org override (`org_settings.deposit_tax_timing_default` NOT NULL DEFAULT `review_required`) > jurisdiction default (Canadian = `review_required`)

**Vendor balance computation (Q63 closure, real-time):**
```
vendor_balance = open_AP + unapplied_vendor_credits + open_vendor_deposits_and_retainers + accrued_unbilled
```
- Real-time computed at read time (no materialized column on `vendors`)
- Surface: `vendorReportService.balance(vendor_id)` returning `net_balance` + `partial_balances` named breakouts

**Receipt v1 path (Q74 domain-rows portion):**
- **Scenario A** — receipt as payment evidence: `ProposedAttachment(attach_payment_evidence)`, no ledger mutation, v1 active
- **Scenario B** — receipt as payment trigger: `ProposedMutation(record_bill_payment)`, v1 active
- **Scenario C** — standalone POS receipt → born-paid bundle: exception queue with `route_to_manual_entry` (form-subtype `manualBornPaidBundleEntry`); manual workflow uses `billService.postWithImmediatePayment(bundle)`; v1 active via manual workflow (automated path post-v1)

**Vendor master integration (§9):**
- Three-category read-boundary split (per ADR-0007): reference/matching readable Tier 2; control/payment-risk readable Tier 2.5 only; all vendor-control fields re-verified by Tier 1 at commit
- INV-AGENT-006 System ceiling for `vendor.bank_account`, `payment_instructions`, `bank_detail_confirmed_flag` mutations
- `vendorService.proposeBankDetailChange()` + `confirmBankDetailChange()` separate flow with explicit out-of-band-verification checkbox

**16 audit event types** route through canonical audit-log writer per ADR-0011 §1.

### From delivery-model.md (B.5 substrate)

**Phase lifecycle:** brief → branch → worktree (if long-lived) → sessions → ratification gates (if applicable) → exit-criteria validated → phase closure (--no-ff merge to staging) → retrospective + obligations carry-forward → worktree cleanup.

**Phase 2 likely uses ratification gates** (governance + ADR-drafting + substrate effects) — Phase 0 D1-D6 precedent applies. Phase 5 (AP foundation) likely fewer or no gates (feature-work-shaped).

**Phase numbering convention (post-B.5):** integer-based for new phases; letter sub-phases (1.5A/B/C) historical; decimal sub-phases historical. Phase 2 stays "Phase 2" per prior naming; new phases prefer `phase/N-short-description` branch + `phase-N` doc folder.

**Brief drafting cadence:** brief opens phase. Phase 2 brief existing as skeleton at `docs/09_briefs/phase-2/document_platform_initiative.md` (substantive content stubbed for fill at Phase 1 implementation onset per substrate-now-enforcement-later cross-pattern). Phase 2 brief-creation arc fills the stub sections.

### From document_platform_initiative.md (existing brief skeleton)

**Status:** Ratified per Phase 0 closure verification 2026-05-04 (Session 2F). Status header + §15 Phase 0 prerequisites + §17 open questions + §21 review history finalized at Phase 0 closure; **substantive content sections (§1–§14, §16, §18–§20) deferred to Phase 1 implementation onset** per substrate-now-enforcement-later cross-pattern.

**Phase 0 prerequisites verified met (§15):**
- 8 Phase 0 ADRs ratified across D1-D6
- 25 of 27 open questions closed (Q53-Q76 + Q78); 2 deferred (Q77 v1-ship-gate; Q79 Phase-1-implementation-gate)
- Stream E dependent-artifacts: E2/E3/E4/E5 closed; E1 deferred per Q79 path β
- Post-D6 hygiene cleanup at `e5965c3`

**Open questions at Phase 0 closure (still open):**
- **Q77** — Q28 re-verification matrix expansion (v1-ship-gate deferral). Drafted in `agent_architecture_policy.md`; ratification gates v1 ship.
- **Q79** — INV-DOC-001 shape / DOC prefix registration (Phase-1-implementation-gate deferral). ADR-0011 §15 reserved INV-DOC-001 shape; closure work TRIGGERS at Phase 1 (Storage / Evidence Core) code start when first DOC-citing code lands.

**Phase 2 brief-creation arc fills the stub sections** (§1-§14, §16, §18-§20) using the substantive content distilled in this pre-positioning notes file as reference.

## Phase 2 chunk-decomposition candidates

Phase 2 = Document Core + Tier 2 Document Pipeline. **Inventory of likely chunks; final decomposition at Phase 2 chunk 1 onset adjudication per chunks-1-4 + chunk N + chunk N+M precedent.**

**Phase 2 substrate chunks (anticipated; not locked):**
- **Document Core schema migration** — `document_cases`, `document_case_sources`, `document_artifacts`, `document_classifications`, `ocr_runs`, `extraction_runs`. Includes 6+ closed enums (case lifecycle 10-state, role 6-value, document_type 18-value, classification, quality_flags, exception-resolution-action 16-value). Plus `document_relationship_candidates` if bundled (ADR-0016).
- **Tier 2 pipeline orchestrator skeleton** — TS-side `documentPipelineService` with stage scaffolding (dedupByHash, fetch, runOCR placeholder, classify scaffold, extract scaffold, matchVendor scaffold, matchAgainstExistingState scaffold, buildProposal). Stage boundaries Zod-validated. No sidecar yet.
- **Modal sidecar implementation** — `document-pipeline-py` Python sidecar with PaddleOCR. JSON Schema sync from TS Zod. HMAC auth. Container build + deploy infrastructure.
- **Tier A classifier** — rule-based. Header heuristics, payment-confirmation language, receipt-shape, filename. Tier A unit tests + integration tests.
- **Tier C AI fallback** — Claude Sonnet integration. System prompt + Zod validation. AI-fallback budget enforcement. Test harness with prompt/response fixtures.
- **Vendor matcher** — `VendorMatchResult` shape; identity-and-matching reads only. ADR-0007 Q29 ESLint rule activation (concrete design at first agent/pipelines code).
- **Field extraction per document type** — invoice fields, receipt fields, payment-confirmation fields. Document-type-aware extraction. Reserved bills/credits/statements fields land later.
- **Match-against-existing-state subsystem** — relationship-candidate output for Relationship Router input.
- **Proposal builder** — ProposedMutation / ProposedMutationBundle / ProposedAttachment shaping per document-type-routing rules.
- **Exception queue UI** — first-class deliverable. Document-type-aware actions. Reclassification workflow. Bulk operations. Screenshot-gate ratification.
- **Orphan-blob GC** — scheduled daily job; `supabase_storage` scope; `orphan_blob_collected` audit.
- **Logic Receipt emission** — at proposal-creation time per INV-AGENT-002.
- **Replay / idempotency** — replay infrastructure for `ocr_runs` / `extraction_runs`. Manual / controller-triggered cadence.

**Phase 2 may chunk across multiple PRs** — likely 8-15 chunks given substrate breadth. Final decomposition at Phase 2 brief-creation.

**Out of Phase 2 (Phase 5 or post-v1):**
- Auto-post calibration (ADR-0017; Phase 5+ or post-v1)
- Tier B small classifier (reserved post-v1)
- Per-org configurability across 12 reserved `org_settings.*` columns (post-v1)
- AP/Spend domain service paths (Phase 5: `billService`, `paymentService`, `vendorPrepaymentService`, `vendorCreditService`, `vendorService`, `vendorReportService`)
- Bank reconciliation (post-v1 Banking domain)
- Multi-jurisdiction tax-timing (post-v1)
- ADR-0018 Relationship Router ambiguity-resolution + re-evaluation subsystems (Tier 2.5 work; consumes Phase 2 match-against-existing-state output; landing surface TBD)

## Open governance questions for Phase 2 brief-creation

Q-shape candidates that surface at Phase 2 brief-creation. Final adjudication at brief-creation gate.

- **Q29 ESLint rule design** — fires at first `src/agent/pipelines/**/*` code. Concrete rule design + boundary heuristics. Sub-Q candidates: which AST node patterns; whitelist mechanism for legitimate test-only imports; error message shape for developer ergonomics.
- **Q65 confidence thresholds at v1 ship** — values (0.85 / 0.80 / 0.85) provisional; ADR-0019 ratifies at v1 ship per Q57 calibration governance. Sub-Q candidates: training data source; per-document-type calibration evidence; threshold-adjustment escalation path.
- **Q68 exception queue UI scope** — closed by ADR-0011 §13 resolution-action enum, but UI implementation surface scope question fires at Phase 2. Sub-Q candidates: filter primitives; bulk-action authority gates; reclassification workflow shape; document-type-aware action visibility rules.
- **AI fallback budget per-org configurability** — `org_settings.ai_fallback_budget` reserved; v1-fixed at 2. Activation path post-v1 needs founder elect.
- **Replay cadence post-v1** — `org_settings.replay_cadence` reserved; v1-fixed at `manual`. Post-v1 scheduled job activation surface.
- **Tier B classifier activation threshold** — corpus-size gate for fastText/small-transformer training. Phase 2 substrate may need to surface "labeled corpus accumulating" vs "ready to train" boundary.
- **Document-type discriminator routing** — 14 reserved values route to exception queue in v1. Phase 2 surface: should the queue UI surface document-type-specific routing-suggestion banners (e.g., "this looks like a credit memo — consider applying as vendor credit") even though resolution-action enum doesn't activate the value?
- **INV-DOC-001 enforcement gate** — Phase-1-implementation-gate per Q79 path β. Fires when first DOC-citing code lands. Phase 2 has DOC-shaped invariants; implementation onset triggers Q79 closure work + INV-DOC-001 shape ratification.

## Sub-Q surfaces for chunk-onset adjudication

Pre-positioning Sub-Q candidates that will surface at Phase 2 chunk 1 onset. Carry-forward to that adjudication.

- **Document Core schema migration chunk** — RLS pattern (Pattern A like `source_documents`? or different per cases-lifecycle); index strategy for case-lookup-by-source; immutability boundary for `ocr_runs` vs `extraction_runs` (immutable per ADR-0011 §9; column-restricted UPDATE for case lifecycle); reserved seat completeness; `link_role` / `link_status` interaction with case state.
- **Pipeline orchestrator skeleton** — stage Zod boundary granularity; trace-propagation discipline; failure-handling envelope (per-stage retry vs per-pipeline); stage-output persistence point.
- **Modal sidecar** — JSON Schema generation infra (codegen vs runtime); HMAC rotation runbook; container image versioning; cold-start tolerance threshold.
- **Tier A classifier** — rule-set authoring discipline (where rules live; codification cadence); rule-test fixture shape; rule coverage matrix per document type.
- **Tier C AI fallback** — prompt versioning discipline; fixture-based evaluation harness; cost-budget visibility per org.
- **Vendor matcher** — fuzzy-match library choice (rapidfuzz vs alternatives); match-confidence calibration evidence; `candidate_alternatives` ranking heuristic.
- **Exception queue UI** — table component vs custom; filter primitives; screenshot-gate prescribed sequence; bulk-action confirmation pattern.

## Dependencies

- **Phase 1.Storage closeout entry** — skeleton landed this session at `f05d27e`; full evidence-anchor density populates next-session opening per Frame 1 forward-sequencing.
- **Phase 2 brief-creation arc** — opens next session as primary work product (after closeout entry density completes per Frame 1).
- **ADR-0014 OCR engine pre-decision** — substrate locked at PaddleOCR / Modal; no further pre-Phase-2 ratification needed.
- **ADR-0019 confidence calibration** — Q57 governance closed at D6; Q65 v1 thresholds provisional; ratification gates v1 ship per Q77 (Q28 matrix re-verification).
- **ADR-0007 Q29 ESLint rule design** — fires at first `agent/pipelines` code in Phase 2.
- **INV-DOC-001 + DOC prefix registration** — fires at first DOC-citing code in Phase 2 (Q79 path β trigger).
- **Foreign session-lock disposition** — founder-domain (α-equivalent / β-equivalent / other); affects worktree usage for Phase 2.

## Carry-forward findings from Phase 1.Storage arc

Brief inventory; full density in closeout entry skeleton at `f05d27e` + next-session density-population.

**Codification candidates (numbered per session-end accounting):**
- **#15 NaN-guard at `clampTtl`** (chunk N+M finding, N=1 monitoring; defer fix to hygiene commit per substrate-now-enforcement-later)
- **#16 methodology-shift state-preservation** (chunk N+M Sub-Q D drift; N=1 monitoring; N=2 cross-arc graduates)
- **#17 worktree per-checkout state-propagation umbrella** with two sibling manifestations:
  - env-file propagation gitignore-accident (`.env.local` not propagated by `session-init.sh`; manual `cp` resolved this session)
  - lock-label-rotation prescription gap (path α election precedent surfaces)

**Graduations from prior arcs (N=3 each):**
- **Hardcoded-UUID-or-non-unique-signature-test-isolation umbrella** — covers `find()`-without-trace_id-scoping (2026-04-27) + hardcoded-UUID-trace_id (chunk N+M Test 4 finding fix landed inline at drafting time)
- **Cross-vitest-invocation accumulation pattern** — covers post-seed snapshot fragility (2026-04-27) + crossOrgRlsIsolation cascading (2026-04-29) + agent:validate-after-pnpm-test gap (chunk N+M); Phase 2 obligation per S29a element #19 strengthened

**Path α election precedent:**
Pre-commit gate election under existing lock label (`phase-1-document-platform-2026-05-06`) for chunk N+M commit at `592dff5`. Pattern parity with chunks 1-4 single-worktree-multi-chunk pattern. Lock-label-divergence as documented-not-eliminated cost.

**Z1 #11.b graduated codification** at fb45abe (N=5 explicit fires within chunks-1-4 arc; subpattern application at chunk + phase completion gates).

**ADR cite findings:**
- ADR-0013 §16 misattribution at chunk N RPC migration comment (sub-shape under Z1 #11.b)
- `recordMutation.ts` atomicity-claim docstring strengthening (#13 at N=2)

**Branch 4 INDEX hygiene observation:** scope as originally specified verified empty this session. Broader gap surfaced (`CTO_HANDOFF_V2.md` + `ec-2-prompt-set.md` + 14+ phase-2 transient artifacts) defers to next session classification.

**Phase 1.Storage worktree retention:** `phase-1-document-platform` becomes forensic anchor at `592dff5` (joining f73f4a4 Phase 0 + 7b85fe1 chunks 1-4).

---

**Pre-positioning notes anchor next-session Phase 2 brief-creation arc.** Substantive content fills alongside Phase 2 brief drafting; this file is the onset-anchor, not the brief itself. Foreign session-lock disposition founder-domain.
