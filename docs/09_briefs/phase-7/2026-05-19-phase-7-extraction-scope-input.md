# Phase 7 Extraction Pipeline — Scope-Input Artifact

- **Date:** 2026-05-19
- **Phase:** Phase 7 (substantively new-phase cycle; NOT amendment cycle)
- **Status:** Onset planning grade — produces scope-input for subsequent Phase 7 scope-lock cycle Round 1
- **Session shape:** Single-session scope-input artifact drafting per v3 proposal precedent (`docs/09_briefs/phase-6/2026-05-16-cto-proposal-v3-document-drop-shell-consolidation.md`); structural template inheritance from v3 §-structure
- **Baseline at Session 27 onset:** HEAD = `4aea7e2` on staging (synced with `origin/staging = 4aea7e2`); 0 commits ahead post-Session-26 push; `pnpm agent:validate` 26/26 green at session-onset
- **Artifact venue:** `docs/09_briefs/phase-7/2026-05-19-phase-7-extraction-scope-input.md` (new folder; mirrors `docs/09_briefs/phase-6/` convention from v3 proposal precedent)

## 1. Executive summary

Phase 7 ships the **Tier 2 extraction pipeline** that converts ingested
document bytes into committable proposals: orchestrator runtime
(`ingestDocument`) + classifier (Tier A rule-based + Tier C AI fallback)
+ field extractor (per document type) + integration wiring through
existing services (Phase 4 `documentRouterService` + Phase 5/5.1 spend
services + Phase 6 ingestion substrate + Phase 6.5 multi-tab canvas
consumer wires).

Per v3 proposal §7 Step 9 + ADR-0014 §1 architecture: Phase 7 is the
**deterministic TypeScript orchestrator** sitting on top of a
**Modal-deployed Python sidecar** running PaddleOCR. Each pipeline
stage is a stateless typed function with Zod boundary validation;
orchestration is NOT LLM-planned (per ADR-0007 Q31); proposals
produced flow through existing `documentRouterService` →
`ProposedMutationBundle` → `billService.post()` (or `paymentService
.record()`, etc.) per ADR-0011 §11 routing.

**Surface counts at session-onset verify-from-disk:**

| Surface class | Count | Detail |
|---|---|---|
| Phase 7 net-new code surfaces | 3 substantive | orchestrator runtime + classifier (Tier A + Tier C) + field extractor (per document type); plus Python sidecar deployment surface (Modal infra) |
| Inherited substrate surfaces (consumed) | 7+ | `ingestionService` (Phase 6) + `documentRouterService` (Phase 4) + `billService` (Phase 5) + `paymentService` (Phase 5.1) + `apReportService` (Phase 5) + `documentLinkService` (Phase 2 chunk 5) + `documentExceptionService` (Phase 2 chunk 6) + `journalEntryService` (Phase 0/1.x) |
| Inherited UI consumer surfaces | 2 substantive | `PendingDocumentsView` (Phase 6.5 chunk 3 — extraction result render target) + `ContextualCanvas` multi-tab routing (Phase 6.5 chunk 2 — extraction-result tab open via Pattern γ) |
| Inherited governance substrate | 4 ADRs | ADR-0014 (authoritative Tier 2 pipeline contract) + ADR-0011 §6 (document_type enum) + ADR-0018 §item 4 (dispatcher activation; possibly fires post-classification) + ADR-0019 (Ratified 2026-05-04; confidence calibration governance) |

**v1 close target per v3 proposal §7 Step 10:** end-to-end manual-
walkable demo — user drops vendor invoice on chat input → ingestion
(Phase 6) → **Phase 7 extraction (high conviction; no AI)** →
classifier writes `document_type='vendor_invoice'` → router (Phase
4) produces `ProposedMutationBundle` → `billService.post` (Phase 5)
→ bills row in draft → AP specialist reviews in canvas (Phase 6.5
multi-tab UI) → approves → payment workflow proceeds. Phase 7 is
the **final substantive phase before v1 close**.

## 2. What verify-from-disk reveals

Phase A session-onset verify-from-disk against the substrate
inheritance map + Phase 7 net-new surface confirmations.

### 2.1 Substrate inheritance — per-phase consumer count

| Source phase | Substrate consumed by Phase 7 | Consumer site (Phase 7 stage) | Existence-verified |
|---|---|---|---|
| Phase 0/1.x | `journalEntryService.post()` (Reading B sole JE writer) | Stage 7 proposal-routing path via `billService.post` / `paymentService.record` (transitive) | ✓ |
| Phase 2 chunk 5 | `documentLinkService.create()` (source_document_links) | Stage 7 proposal-routing path; `link_role='primary_invoice'` for vendor-invoice classification | ✓ |
| Phase 2 chunk 6 | `documentExceptionService.enqueueException` (Tier D fallback + below-threshold confidence) | Stage 7 exception-routing per ADR-0014 §7 + §8 + §12 | ✓ |
| Phase 4 (chunks 1-3) | `documentRouterService` (`completeCandidate` L621 + `resolveCandidates` L916 + `dispatchTrigger` L1513) | Stage 6 relationship-candidate computation; Stage 7 proposal routing | ✓ |
| Phase 5 (chunks B5-1 through B5-3) | `billService.post()` + `billService.recordPayment()` + `vendorPrepaymentService.record()` + `apReportService` | Stage 7 proposal-commit path (downstream of orchestrator) | ✓ |
| Phase 5.1 chunk 5.1a | INV-DOC-001 enforcement at `billService.post()`; `bills.primary_document_id` FK | Stage 7 proposal-commit: classifier outputs `document_type='vendor_invoice'` → bill commit requires `primary_document_id` per INV-DOC-001 → orchestrator passes source_document_id | ✓ |
| Phase 5.1 chunk 5.1b | `paymentService.record()` greenfield + T2_new_payment dispatcher slot v1-active-emission-wired | Stage 7 proposal-commit for `payment_confirmation` classifier output; T2 dispatcher fires post-commit per Pattern B external-wrap | ✓ |
| Phase 5.1 chunk 5.1c | apReportService nested-select pattern | Pattern reference only (no Phase 7 consumer); Phase 7 may produce similar URL-pressure refactors at extractor query sites | ✓ |
| Phase 6 chunks 6.1-6.3 | `ingestionService.handleDragDropUpload` + `ingestionService.handleForwardedMailbox` + `ingest_batches` + `document_jobs` substrate + `source_documents.ingest_batch_id` | Stage 0/1 entry: Phase 7 orchestrator consumes ingestion output (sourceDocumentId post-ingestion-commit) | ✓ |
| Phase 6.5 chunk 1-3 | `PendingDocumentsView` (state-machine `idle_with_recent_cards` + `showing_batch`); `ContextualCanvas` multi-tab via `canvasDirective` discriminated union (39 members post-chunk-3) | Phase 7 extraction-result UX: classifier output renders into PendingDocumentsView per chunk-3 consumer contract; new `canvasDirective` member(s) for extraction-result tab | ✓ |

### 2.2 Phase 7 net-new code surface confirmation

| Net-new surface | Search basis | Disk evidence | Status |
|---|---|---|---|
| Orchestrator runtime (`ingestDocument` pipeline) | `grep ingestDocument\|orchestrator runtime\|extractionPipeline` at `apps/web/src/services/document-platform/` + `apps/web/src/agent/` | Zero hits | Net-new at Phase 7 ✓ |
| Classifier (`classifyDocument`, `documentClassifier`, tierA/tierC) | `grep` at service layer + agent | Hits are unrelated (storage failureClassification + ingestionService classification mention + documentRouterService classification_confidence column from Phase 4 + agent orchestrator unrelated) | Net-new at Phase 7 ✓ |
| Field extractor (`extractFields`, `fieldExtractor`, `extractDocument`) | `grep` at service layer + agent | Zero hits | Net-new at Phase 7 ✓ |

### 2.3 Phase 5.1 substrate origin-grade verification (per Session 26 push close)

Confirmed at session-onset Phase A:
- `paymentService.ts` exists at `apps/web/src/services/spend/paymentService.ts` (13KB; Phase 5.1 chunk 5.1b greenfield)
- T2 dispatcher activation: `case 'T2_new_payment':` at `documentRouterService.ts:1544` falling through to `computeT1T2T3FanOut` at L1391
- `DispatchTriggerInputSchema` 6 v1-active-emission-wired branches at `documentRelationshipCandidate.schema.ts`: T1_new_bill (L424) + T2_new_payment (L441) + T3_new_vendor_prepayment (L449) + T5_bill_state_transition (L456) + T8_period_reopen (L464) + T10_manual_override (L470)

### 2.4 ADR ratification status

| ADR | Status | Phase 7 relevance |
|---|---|---|
| ADR-0011 | Ratified | §6 document_type 18-value enum (v1-active subset: vendor_invoice + receipt + payment_confirmation + unknown); §11 ProposedMutation routing — Phase 7 classifier updates document_type per §6 mutability discipline |
| ADR-0014 | Ratified | **Authoritative for Phase 7 scope.** §1 pipeline architecture; §2 OCR Modal/PaddleOCR; §7 classifier tier strategy; §8 AI fallback contract; §11 proposal routing; §12 failure classification |
| ADR-0018 | Ratified + 2 amendments (Phase 4 + Phase 5.1) | §item 4 second amendment (2026-05-19): T2_new_payment activation + bidirectional dispatcher four-part activation discipline. Phase 7 may fire dispatcher triggers post-classification |
| ADR-0019 | **Ratified 2026-05-04** (D6 ratification package §3.1) | Confidence calibration governance for per-document-type confidence thresholds (ADR-0014 §7 provisional values 0.80-0.85; ADR-0019 ratifies calibration cadence) |

### 2.5 Drift findings (zero substantive at session-onset)

No code or doc drift from Phase 5.1 substrate. Phase 6 + Phase 6.5
substrate preserved. No pre-Phase-7 amendment candidates surfaced
at session-onset verify-from-disk per v3 §7 Step 9 "Phase 7 wires
existing services" framing.

## 3. Locked-at-onset cuts

These framing decisions are LOCKED at scope-input artifact grade
(subject to scope-lock cycle Round 1 ratification). Cuts inherit
from ADR-0014's architectural commitments and Phase 6 + Phase 5.1
substrate ship state.

### 3.1 Deterministic TypeScript orchestrator (NOT LLM-planned)

Per ADR-0014 §1 + ADR-0007 Q31: the orchestrator is a plain
TypeScript function calling stages in fixed sequence. A future
contributor who proposes "use an LLM to decide which stage runs
when" is proposing a Q31 violation. The orchestrator's `ingestDocument`
shape is illustrated at ADR-0014 §1:165-208 (8-stage sequence:
dedup-by-hash → byte fetch → OCR → classification → field extraction
→ vendor matching → relationship candidate → proposal building).

**Locked:** orchestrator shape per ADR-0014 §1 sequence; deterministic
TS function; stateless typed functions per stage; Zod boundary
validation per ADR-0007 § Tier 2 safety-contract item 2.

### 3.2 OCR — PaddleOCR via Modal sidecar (per ADR-0014 §2 + §3)

Per ADR-0014 §2: v1 OCR engine is PaddleOCR; `document_artifacts.engine
= 'paddleocr'`; tesseract/claude_vision reserved per ADR-0010
discipline. Per ADR-0014 §3: Python sidecar deployed on Modal;
HTTP request/response; trace propagation via `X-Trace-Id` header;
schema-bound (Zod → JSON Schema → Pydantic).

**Locked:** PaddleOCR engine; Modal deployment platform; HMAC
auth; schema-bound TS↔Python boundary.

### 3.3 Classifier strategy — Tier A + Tier C + Tier D (per ADR-0014 §7)

Per ADR-0014 §7: v1 ships Tier A (rule-based) + Tier C (Claude Sonnet
AI fallback) + Tier D (unknown fallback). Tier B (small trained
classifier) reserved post-v1 (corpus does not exist at v1 ship time).
Fallback ordering system-fixed in v1: A → C → D. Per-org configurability
reserved post-v1.

**Locked:** 3-tier v1 strategy (A + C + D); fixed fallback order;
per-document-type confidence thresholds at ADR-0014 §7 provisional
values (vendor_invoice 0.85 / receipt 0.80 / payment_confirmation
0.85); confidence calibration governance per ADR-0019.

### 3.4 AI fallback contract — Claude Sonnet; OCR text only; 2-call budget (per ADR-0014 §8)

Per ADR-0014 §8: Claude Sonnet receives `document_artifacts.lines` +
`document_artifacts.pages` content (NEVER raw image bytes — Q30
violation); system prompt names document-type enum + extraction
targets; Zod-validated output; below-threshold confidence routes to
exception even if Zod-valid; max 2 fallback calls per source document
in v1; AI-extracted fields flow through human confirmation on
ProposedEntryCard.

**Locked:** Claude Sonnet model selection; OCR-text-only input;
classification-only + field-extraction output shapes; Zod validation
+ confidence threshold dual gate; 2-call budget per source document.

### 3.5 Pipeline output routing (per ADR-0014 §11)

Per ADR-0014 §11: pipeline output routes to ProposedMutation /
ProposedMutationBundle / ProposedAttachment per document type +
extraction completeness. Routes through existing `documentRouterService`
(Phase 4 candidate-completion + Phase 4 dispatcher) → AP/Spend
service commit path (Phase 5/5.1).

**Locked:** integration boundary — Phase 7 pipeline produces proposals;
Tier 1 committing agent (existing or future) wraps `withInvariants()`
+ commits per ADR-0007 § Tier 1 safety contract. Phase 7 does NOT
auto-commit; auto-commit-vs-human-confirm split adjudicated at v1
ship per ADR-0014 §8 (current lock: all AI-fallback fields flow
through human confirmation).

### 3.6 Phase 5.1 substrate consumer wiring (T2 dispatcher post-payment-extraction)

Per ADR-0018 §item 4 Phase 5.1 amendment: T2_new_payment dispatcher
slot v1-active-emission-wired at `paymentService.record()`. If Phase
7 classifier outputs `document_type='payment_confirmation'` →
extractor produces payment proposal → proposal commits via
`paymentService.record()` → T2 dispatcher fires post-commit per
existing Pattern B external-wrap + P3-i F-J-4 best-effort isolation.

**Locked:** Phase 7 payment_confirmation extraction path inherits
T2 dispatcher activation automatically (no Phase 7 wiring work
required; the T2 fire happens at `paymentService.record()` site
post-commit). Similarly, vendor_invoice extraction path fires
T1_new_bill dispatcher at `billService.post()` site post-commit.

### 3.7 Phase 6.5 PendingDocumentsView consumer (extraction-result UX)

Per Phase 6.5 retrospective §6: `PendingDocumentsView` ships state-
machine (`idle_with_recent_cards` + `showing_batch`) + props-driven
render. Phase 7 classifier output renders into PendingDocumentsView
per chunk-3 consumer contract; extraction-result tab opens via
Pattern γ source-driven routing per chunk-2 contract.

**Locked:** Phase 7 extraction-result UX consumes PendingDocumentsView
without re-architecting the view substrate; Phase 7 likely adds 1-2
new `canvasDirective` members (e.g., `'document_review'` or
`'extraction_result'`) extending the 39-member discriminated union
per the Phase 6.5 forward-pointer.

## 4. Sub-question catalog

Pre-allocated to scope-lock cycle Rounds; subject to expansion at
Round 1 verify-from-disk pass. The catalog covers pipeline
orchestration shape + classifier rule definition + AI fallback
contract refinement + field extractor shape + chunk decomposition +
consumer wires.

### 4.1 Pipeline orchestration sub-questions

- **Sub-Q1 (orchestrator placement).** Where does `ingestDocument` live in source tree? Candidates: `apps/web/src/services/document-platform/orchestrator/`, `apps/web/src/agent/pipelines/`, new `apps/web/src/services/extraction/`. ADR-0020 source-tree authority-gradient applies.
- **Sub-Q2 (sync vs async invocation).** Does `ingestDocument` run synchronously inline with ingestion commit, or async via queue (BullMQ / Postgres queue / Modal sidecar callback)? v1 lean toward sync per agent orchestrator precedent; queue substrate decision deferrable.
- **Sub-Q3 (retry semantics per stage).** ADR-0014 §1 says each stage is stateless typed function. Retry policy per stage? Stage-level idempotency? Failure escalation to exception queue (per ADR-0014 §12)?
- **Sub-Q4 (timeout handling).** Per-stage timeout? Pipeline-level timeout? Modal sidecar timeout? Coordination with ADR-0014 §12 failure classification matrix.
- **Sub-Q5 (Modal sidecar deployment scope).** Does Phase 7 ship the Python sidecar deployment (Modal config + Pydantic schemas + PaddleOCR wrapper) OR is sidecar deployment a separate infra session? Brainstorming-side lean: ship as Phase 7 chunk for end-to-end coherence; alternate path defers sidecar to standalone infra session.

### 4.2 Classifier sub-questions

- **Sub-Q6 (Tier A rule-set definition).** Per-document-type match rules per ADR-0014 §7 (Invoice/Bill/Statement/Receipt headers; payment language patterns; receipt-shape patterns; filename heuristics). Where do the rules live? `tierARules.ts`? Per-document-type module? Composability of rules?
- **Sub-Q7 (rule precedence).** When multiple Tier A rules match (e.g., "Invoice" header + receipt-shape pattern), how is precedence resolved? Highest-confidence first? Document-type-specific tiebreaker? ADR-0014 §7 lock allows "high precision low recall" — implication for multi-match handling.
- **Sub-Q8 (Tier A → Tier C threshold).** ADR-0014 §7 says Tier A is "high precision, low recall — when Tier A matches, the confidence is high." What's the Tier A confidence floor for short-circuit? If Tier A produces a moderate-confidence match, does it still fall to Tier C or short-circuit? Provisional confidence values per Q65 (ADR-0014 §7) apply per document type.
- **Sub-Q9 (Tier C system prompt versioning).** Per ADR-0014 §8 trace propagation: `pipeline_trace` records system prompt version. Where does the prompt version live? Centralized constant? Per-document-type prompt files? Versioning scheme (semver / timestamp / commit-hash)?
- **Sub-Q10 (Tier D exception payload).** When all tiers fail, document classifies as `unknown` → routes to exception queue per ADR-0011 §13. Exception payload contents? `documentExceptionService.enqueueException` signature consumes Phase 7 output — what fields does Phase 7 pass?

### 4.3 Field extractor sub-questions

- **Sub-Q11 (per-document-type extractor functions).** ADR-0014 §1 Stage 4 is `extractFields(documentType, ocrArtifact, traceId)`. Per-document-type module? `vendorInvoiceExtractor.ts` + `receiptExtractor.ts` + `paymentConfirmationExtractor.ts`? Or unified `extractor.ts` with internal dispatch?
- **Sub-Q12 (extraction-conviction semantics per field).** ADR-0014 §8 + agent_architecture_policy.md §2.1 define per-field re-verification matrix. Phase 7 extractor produces per-field conviction; conviction threshold per field; below-threshold path (human confirmation required vs auto-commit).
- **Sub-Q13 (AI fallback per-field schemas).** ADR-0014 §8 says fallback output `fields` object's shape is per-document-type. Where do the per-document-type field schemas live? Zod schemas at `apps/web/src/shared/schemas/extraction/`?
- **Sub-Q14 (vendor matcher integration).** ADR-0014 §9 covers vendor-matcher pipeline integration. Phase 7 extractor reads vendor identity-and-matching fields ONLY; matcher resolves vendor_id. Where does the matcher live (per ADR-0011 §11 inheritance)?
- **Sub-Q15 (extraction-result UI render).** Phase 7 produces proposals → PendingDocumentsView renders → user reviews on ProposedEntryCard. New `canvasDirective` member for extraction-result tab? Member shape (single document vs batch)?

### 4.4 Phase 5.1 substrate consumer sub-questions

- **Sub-Q16 (payment_confirmation → paymentService.record routing).** Phase 7 classifier outputs `document_type='payment_confirmation'` → extractor produces payment proposal → proposal commits via `paymentService.record()` per §3.5 + §3.6 framing. End-to-end commit path: which orchestrator stage invokes paymentService? Tier 1 committing agent (existing or future)? T2 dispatcher fires automatically post-commit.
- **Sub-Q17 (vendor_invoice → billService.post routing).** Mirror of Sub-Q16: vendor_invoice classification → bill proposal → billService.post commit → INV-DOC-001 enforcement (Phase 5.1 chunk 5.1a) requires primary_document_id → orchestrator passes source_document_id. T1_new_bill dispatcher fires post-commit.
- **Sub-Q18 (receipt → ??? routing).** Receipt document_type is v1-active per ADR-0011 §6 but has no direct AP/Spend service consumer at Phase 5.1 close. Receipt extraction routes to... exception queue (manual operator review)? receiptService greenfield (post-v1)? Brainstorming-side leans exception queue at v1; receiptService is post-v1.

### 4.5 Phase 6.5 UI consumer sub-questions

- **Sub-Q19 (canvasDirective new member shape).** Per §3.7 lock: Phase 7 adds 1-2 new canvasDirective members for extraction-result UX. Member names? Payload shape (single document vs batch)? Routing through Pattern γ source-driven routing (chunk 2 framework).
- **Sub-Q20 (PendingDocumentsView post-classification render).** Per Phase 6.5 chunk 3 consumer contract: PendingDocumentsView renders `idle_with_recent_cards` + `showing_batch` states. Post-classification render: classifier output updates PendingDocumentsView state to include document_type? Card detail expansion? Phase 7 produces additional view state vs PendingDocumentsView consumes existing fields?

### 4.6 Chunk decomposition sub-questions

- **Sub-Q21 (Phase 7 chunk count + boundaries).** Per §5 chunk decomposition framing: 2-3 chunks at brainstorming-side onset grain. Alternate splits adjudicated at scope-lock cycle Round 1.
- **Sub-Q22 (chunk shipping order).** If 3-chunk (orchestrator + classifier + extractor), ship order? Orchestrator first as skeleton + classifier second + extractor third? Or classifier-first (testable in isolation) + orchestrator wiring + extractor last? Path C invocation evaluation at chunk-brief grade per F-J-14 third-instance discipline.
- **Sub-Q23 (Modal sidecar chunk placement).** Per Sub-Q5: if sidecar shipped within Phase 7 scope, which chunk? Pre-orchestrator (so orchestrator can call sidecar at chunk-1 ship) or post-orchestrator (orchestrator skeleton ships first; sidecar enables real OCR at chunk-N)?

### 4.7 Cross-cutting sub-questions

- **Sub-Q24 (test infrastructure scope).** Phase 7 introduces pipeline-grade tests (per-stage unit tests; full-pipeline integration tests; AI fallback contract tests with synthetic Claude responses). Test infra extension: vitest config + AI fallback mock harness + Modal sidecar mock?
- **Sub-Q25 (logging + observability).** ADR-0014 §1 specifies `PipelineStageRecord` per stage. Logging structure per pino conventions? Per-stage trace surfacing in dev tools? Cost-tracking for AI fallback calls (Anthropic token usage metrics)?

## 5. Phase 7 chunk decomposition (brainstorming-side framing)

Per Sub-Q21 + Sub-Q22 + Sub-Q23 pending scope-lock Round 1
ratification, brainstorming-side onset grain proposes a **3-chunk
decomposition**:

### 5.1 Chunk 7.1 — Orchestrator skeleton + Modal sidecar deployment

- **Scope:** `ingestDocument` orchestrator function shell (8-stage
  sequence per ADR-0014 §1); Modal sidecar deployment (Python service
  + PaddleOCR wrapper + Pydantic schemas + HMAC auth); end-to-end
  OCR call from TS orchestrator → Modal sidecar → OCR'd
  `document_artifacts` row.
- **Stages active at chunk close:** Stage 0 (dedup-by-hash) + Stage 1
  (byte fetch) + Stage 2 (OCR). Stages 3-7 stub (return placeholder).
- **Net-new code:** `apps/web/src/services/document-platform/orchestrator/` (or per Sub-Q1) +
  Python sidecar repo/folder + Modal config.
- **Forecast:** ~800-1400 LOC; substantive new-phase shape (NOT substrate-fix narrowness).

### 5.2 Chunk 7.2 — Classifier (Tier A + Tier C) + dedup integration

- **Scope:** Tier A rule-based classifier (per Sub-Q6 + Sub-Q7) +
  Tier C Claude Sonnet AI fallback (per ADR-0014 §8 contract) + Tier
  D unknown fallback wiring; classification stage activates in
  orchestrator; AI fallback validation gate + confidence threshold
  per ADR-0014 §7 provisional values; PipelineStageRecord emission per
  stage.
- **Stages active at chunk close:** Stage 0-2 (from chunk 7.1) + Stage
  3 (classification) + Stage 4 stub (field extraction returns placeholder).
- **Net-new code:** `apps/web/src/services/extraction/classifier/`
  (Tier A rules + Tier C AI fallback + system prompts) +
  classification schemas at `apps/web/src/shared/schemas/extraction/`.
- **Forecast:** ~600-1100 LOC.

### 5.3 Chunk 7.3 — Field extractor + vendor matcher + proposal building

- **Scope:** Per-document-type field extractors (vendor_invoice +
  receipt + payment_confirmation per Sub-Q11) + vendor matcher
  integration (per ADR-0014 §9 + ADR-0011 §11 inheritance) +
  relationship-candidate stage (per Sub-Q14 + Phase 4 router
  consumption) + proposal-building stage (per ADR-0014 §11 routing
  to ProposedMutation/Bundle/Attachment) + canvasDirective extension
  (per Sub-Q19) + PendingDocumentsView post-classification consumer
  wires (per Sub-Q20).
- **Stages active at chunk close:** All 8 stages from ADR-0014 §1
  active end-to-end. Phase 7 v1-walkable.
- **Net-new code:** `apps/web/src/services/extraction/extractor/`
  (per-document-type modules) + vendor-matcher integration +
  proposal builder + UI consumer wires (canvasDirective + PendingDocumentsView).
- **Forecast:** ~1200-2000 LOC; potentially largest chunk (Path C
  invocation candidate at scope-lock Round 1 per F-J-14 third-instance
  discipline).

**Alternate split candidate (4-chunk):** Chunk 7.3 splits into
extractor (vendor_invoice + receipt + payment_confirmation extractors)
+ chunk 7.4 (vendor matcher + relationship-candidate + proposal-
building + UI consumer wires). Adjudicated at scope-lock cycle Round
1 per Sub-Q22 framing.

**Alternate split candidate (2-chunk):** Chunks 7.1 + 7.2 merge into a
single chunk (orchestrator + sidecar + Tier A classifier; Tier C +
extractors land at chunk 7.2). Less granular; harder to deliver in
single sessions per RI-7 single-session ceiling.

## 6. Verify-from-disk targets (pre-allocated for scope-lock Round 1)

The scope-lock cycle Round 1 fire will execute the canonical
verify-from-disk pass per Phase 5.1 cycle Round 1 (`72a40bf`)
precedent. Pre-allocated targets:

### 6.1 Substrate-shape verify-from-disk targets

- **VFD-1:** `document_artifacts` table schema (engine column +
  engine_version column + lines / pages / words structure per
  ADR-0011 §5); verify Phase 6 ingestion writes match Phase 7
  consumer expectations.
- **VFD-2:** `source_documents` table schema (hash column for
  dedup-by-hash Stage 0; verify hash availability).
- **VFD-3:** `document_cases` + `document_case_sources` (Phase 2 chunk
  1 substrate; Phase 7 orchestrator consumes case lifecycle).
- **VFD-4:** `chart_of_accounts` + `vendors` (Phase 5 substrate; Phase
  7 vendor matcher + classification context).
- **VFD-5:** `pipeline_stage_records` table existence (per ADR-0007 Q30
  + ADR-0014 §1 emission contract); verify whether substrate exists
  pre-Phase-7 or ships at Phase 7.
- **VFD-6:** `org_settings.classification_fallback_order` +
  `org_settings.ai_fallback_budget` columns (per ADR-0014 §7 + §8
  reserved-post-v1 enumeration); verify ADR-0010 substrate-now
  shipping.

### 6.2 Service-layer verify-from-disk targets

- **VFD-7:** `ingestionService.handleDragDropUpload` return signature
  (per Phase 6 chunk 6.2b); verify Phase 7 orchestrator consumer
  contract matches.
- **VFD-8:** `documentRouterService.completeCandidate` signature (per
  Phase 4 chunk 1); verify Phase 7 relationship-candidate stage
  consumer contract.
- **VFD-9:** `billService.post` + `paymentService.record` signatures
  (Phase 5.1 substrate); verify Phase 7 proposal-routing consumer
  contracts.
- **VFD-10:** `documentExceptionService.enqueueException` signature
  (per Phase 2 chunk 6); verify Phase 7 Tier D unknown-fallback +
  AI-fallback-validation-failed exception payload contract.

### 6.3 UI consumer verify-from-disk targets

- **VFD-11:** `PendingDocumentsView` props contract (per Phase 6.5
  chunk 3); verify Phase 7 extraction-result render compatibility.
- **VFD-12:** `canvasDirective` discriminated union members (39 at
  Phase 6.5 close); verify Phase 7 extension shape (1-2 new members
  per Sub-Q19).
- **VFD-13:** `SplitScreenLayout` Pattern γ source-driven routing
  (per Phase 6.5 chunk 2); verify Phase 7 extraction-result tab
  routing compatibility.

### 6.4 ADR substrate verify-from-disk targets

- **VFD-14:** ADR-0014 §item-by-item read at scope-lock Round 1
  (authoritative for Phase 7 scope; verify each §item against Phase
  7 chunk decomposition assignments).
- **VFD-15:** ADR-0019 §-by-§ read (confidence calibration governance
  detail; verify Phase 7 calibration consumer surface).
- **VFD-16:** ADR-0007 Q28 matrix + Q30 + Q31 (Tier 2 safety contract
  + Logic Receipt reproducibility + LLM-orchestration prohibition);
  verify Phase 7 contract preservation.

## 7. Sequencing path forward

Phase 7 onset → scope-lock cycle → chunk briefs → chunk implementations
→ retrospective. Mirrors Phase 5.1 sequencing at substantive new-phase
cycle grade (Phase 5.1 was amendment cycle; Phase 7 is substantive new-
phase cycle requiring fuller scope-lock scope).

### 7.1 Session N+1 — Phase 7 scope-lock cycle Round 1

Convene scope-lock cycle. Execute verify-from-disk pass per §6
targets. Adjudicate Sub-Q1-Sub-Q25 (25 sub-questions at brainstorming-
side onset grain; may expand at Round 1 verify-from-disk pass).
Produce Round 1 artifact at
`docs/09_briefs/phase-7/2026-05-19-phase-7-scope-lock-cycle-round-1.md`.

### 7.2 Sessions N+2 through N+M — Scope-lock cycle Rounds 2-K

Per Phase 5.1 precedent (4 rounds for 14 sub-questions + 8 sub-
decisions); Phase 7's 25 sub-questions may converge in 3-5 rounds.
Each round produces a walk artifact; final round produces locks +
chunk decomposition ratification.

### 7.3 Sessions N+K+1 onwards — Chunk brief drafting

Per Phase 5.1 precedent: one brief drafting session per chunk; 3
chunks = 3 sessions minimum at brief-drafting grade.

### 7.4 Sessions N+K+4 onwards — Chunk implementations

Per Phase 5.1 precedent: one implementation session per chunk
(potentially Path C-split per F-J-14 third-instance discipline if
volume exceeds RI-7 single-session ceiling). 3 chunks = 3 sessions
minimum at implementation grade; 5-6 sessions plausible with Path C
invocation.

### 7.5 Session N+K+7+ — Phase 7 retrospective

Per Phase 5.1 retrospective ceremony precedent: three-commit ceremony
A → B → C per T3 > T4 > T1 surface-precedence (ADR amendments + T4
convention codifications + T1 retrospective writeup). Plus terminal-
close push per Phase 6.5 + Phase 5.1 precedent.

### 7.6 Session N+K+8 — v1 close + Step 10 demo

Per v3 proposal §7 Step 10: end-to-end manual-walkable demo. Phase 7
close enables v1 ship.

**Estimated total sessions for Phase 7:** ~12-18 sessions (1 scope-
input + 3-5 scope-lock rounds + 3 chunk briefs + 3-6 chunk
implementations + 3 retrospective ceremony + 1 terminal-close push +
1 v1 close demo). Provisional pending Round 1 sub-question expansion
+ Path C invocation outcomes.

## 8. Risks and unknowns

### 8.1 Path C invocation risk at chunk 7.3 (RI-7)

Chunk 7.3 is the largest at brainstorming-side onset grain (~1200-
2000 LOC); per F-J-14 third-instance discipline + RI-7 session-
budget-feasibility verification, Path C invocation candidate at
scope-lock Round 1 (Grain 1 prospective) or at chunk-brief drafting
(Grain 1 prospective) or at impl-onset (Grain 2 reactive). Path C
split candidate: chunk 7.3 → 7.3a (extractor) + 7.3b (matcher +
proposal-building + UI consumer wires).

**Mitigation:** scope-lock Round 1 verify-from-disk surfaces volume
estimate refinement; chunk-brief drafting re-evaluates Path C per
brief-grade scope; impl-onset re-evaluates per impl-grade substrate
density (per Phase 5.1 chunk 5.1b + 5.1c precedents).

### 8.2 Modal sidecar deployment scope uncertainty (Sub-Q5)

Per Sub-Q5: does Phase 7 ship Modal sidecar deployment OR is sidecar
deployment a separate infra session? Brainstorming-side lean: ship
within Phase 7 (chunk 7.1 includes Modal config) for end-to-end
coherence. If sidecar deployment proves substantial (Modal account
setup; Python sidecar repo authorship; deployment pipeline; HMAC
secret management), chunk 7.1 scope may exceed RI-7 single-session
ceiling.

**Mitigation:** scope-lock Round 1 verify-from-disk on Modal substrate
existence (any prior Modal experimentation; existing Python sidecar
scaffolding); chunk 7.1 brief adjudicates sidecar-in-scope vs sidecar-
deferred-to-infra-session.

### 8.3 AI fallback cost ceiling uncertainty

Per ADR-0014 §8 reserved column `org_settings.ai_fallback_budget`
NOT NULL DEFAULT 2 (2 calls per source document v1-fixed). Phase 7
operational cost ceiling depends on actual ingestion volume +
Claude Sonnet pricing at v1 ship. Bank as named-future-trigger:
ADR-0014 §8 budget value re-evaluation post-v1-ship per usage data.

**Mitigation:** Phase 7 includes per-AI-call cost logging
(Sub-Q25); v1 dev-environment validation surfaces per-doc-type
average call count; ratification at ADR-0019 calibration governance
grade.

### 8.4 Volume forecast uncertainty

Phase 7 substantive new-phase cycle (NOT amendment cycle); volume
forecast at brainstorming-side onset grain is provisional. v3
proposal §7 estimated "~2-6 session extraction/orchestration
envelope" — likely undercount given the 3-chunk decomposition +
Modal sidecar deployment + classifier rule authoring.

**Mitigation:** scope-lock Round 1 + per-chunk brief drafting refine
volume estimates; sub-curve (a) cycle-substantive at-or-above
calibration per Phase 5.1 plan-authoring.md Volume-forecast
convention extension applies (Phase 7 chunks are cycle-substantive,
not substrate-fix-narrowness; sub-curve (a) framing).

### 8.5 ADR ratification dependencies — all green

ADR-0014 + ADR-0019 + ADR-0011 + ADR-0018 all ratified at session-
onset Phase A verification. No blocking ADR ratifications outstanding
per v3 proposal §8.2 framing equivalent.

**Mitigation:** N/A; risk realized as zero at session-onset.

### 8.6 Cross-phase test infrastructure (Sub-Q24)

Phase 7 introduces pipeline-grade test patterns (AI fallback mock
harness; Modal sidecar mock; per-stage unit tests). Test infra
extension may exceed Phase 7 implementation scope at chunk grade.

**Mitigation:** scope-lock Round 1 + Sub-Q24 adjudication: per-chunk
test infra incremental vs dedicated test-infra-prep session pre-
Phase-7-chunks. Phase 6.5 retrospective Candidate #8 (floor-test
absolute-count fragility banking) is adjacent precedent for test-
infra-dedicated-session pattern.

### 8.7 Brainstorming-side metafact drift family inheritance

Per Phase 5.1 retrospective Observation #19 parent consolidation
codification at `scope-lock.md` "Verify-from-disk-at-non-standard-
grain pattern" extension: future cycles' directive-authoring + brief-
drafting + session-close-report authoring surfaces inherit the
discipline. Phase 7 scope-lock cycle + chunk brief drafting + impl-
session close reports apply the discipline; verify-from-disk grounding
at brainstorming-side BEFORE asserting metafacts.

**Mitigation:** Session 27 directive (this session's directive)
inherits the discipline operationally — push state cited as
"HEAD = 4aea7e2; origin/staging = 4aea7e2 (synced post-Session-26
push)" with verify-from-disk grounding per remediation pattern.
Phase 7 scope-lock + chunk-brief + impl directives follow same
pattern.

## 9. Decision points

What downstream sessions adjudicate at each grade.

### 9.1 Scope-lock cycle adjudicates

- Sub-Q1-Sub-Q25 (25 sub-questions at brainstorming-side onset; may
  expand at Round 1 verify-from-disk pass).
- Chunk decomposition final lock (3-chunk vs 4-chunk vs alternate
  splits per Sub-Q21).
- Path C invocation evaluation per F-J-14 third-instance discipline
  at Grain 1 prospective + per-chunk-brief Grain 1 prospective +
  impl-onset Grain 2 reactive surfaces.
- Library / framework choices for Tier C AI fallback (Anthropic SDK
  version; system prompt versioning scheme; cost-tracking integration).
- Modal sidecar deployment scope adjudication (Sub-Q5; in-Phase-7 vs
  standalone infra session).

### 9.2 Chunk brief drafting adjudicates

- Per-chunk acceptance criteria (per ADR-0014 §item alignment).
- Per-chunk test matrix (unit + integration + AI fallback mock harness
  per Sub-Q24).
- Per-chunk risk catalog at brief-grade (per Phase 5.1 chunk brief
  precedent).
- Per-chunk verify-from-disk pre-allocation for Phase A onset.
- Per-chunk forecast band (brief LOC + impl LOC per Phase 5.1 chunk
  brief §1.3 two-grain forecast precedent).

### 9.3 Chunk implementation adjudicates

- Path C reactive invocation per F-J-14 mid-impl-reactive sub-grain
  if implementation surfaces unforeseen substrate density.
- Per-stage retry / timeout / error-handling implementation details
  per Sub-Q3 + Sub-Q4.
- ADR amendment candidates if substrate evidence surfaces unforeseen
  ADR text drift (per Phase 5.1 chunk 5.1a + 5.1b precedent).

### 9.4 Phase 7 retrospective adjudicates

- T3 ADR amendments (ADR-0014 substrate-ship reconciliation; ADR-0018
  if Phase 7 fires T4/T6 dispatcher activations per Phase 5.1
  precedent; ADR-0019 confidence calibration ratification if v1
  values adjust).
- T4 convention codifications via codify-convention skill routing.
- T1 retrospective writeup per 7-section Phase 5.1 retrospective
  structural template.

### 9.5 v1 close adjudicates

- Step 10 end-to-end manual-walkable demo readiness.
- Structured stress-testing session per v3 §7 Step 10 framing.
- Post-v1 amendment cycle prioritization (per Sub-Q14/15/16/17
  v3 §7 Step 11 deferrals + Phase 7 retrospective carry-forwards).

---

**Scope-input artifact shipped at session 27 (2026-05-19).** Cross-
references: v3 proposal §7 Step 9 at `docs/09_briefs/phase-6/2026-05-16-cto-proposal-v3-document-drop-shell-consolidation.md`;
Phase 5 retrospective §6 sequencing at `docs/07_governance/retrospectives/phase-5-retrospective.md`;
Phase 6 + 6.5 + 5.1 retrospectives §6 for substrate inheritance details;
ADR-0014 (Tier 2 pipeline; authoritative); ADR-0011 §6 (document_type
enum); ADR-0018 §item 4 (dispatcher activation; second amendment
2026-05-19); ADR-0019 (confidence calibration; Ratified 2026-05-04);
ADR-0007 Q28 + Q30 + Q31 (Tier 2 safety contract + Logic Receipt +
LLM-orchestration prohibition). Phase 5.1 chunk 5.1a + 5.1b + 5.1c
commits c228512 + 12847bf + 9ec9235 for Phase 5.1 substrate
inheritance. Next operational fire: Phase 7 scope-lock cycle Round 1
firing against this scope-input artifact.
