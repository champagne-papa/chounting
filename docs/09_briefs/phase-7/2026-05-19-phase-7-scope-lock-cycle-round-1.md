# Phase 7 Extraction Pipeline — Scope-Lock Cycle Round 1

**Session:** 28
**Date:** 2026-05-19
**Branch:** `staging`
**Local HEAD at session-onset:** `8ae3886` (Phase 7 onset scope-input artifact)
**`origin/staging` HEAD:** `4aea7e2` (1 commit behind local; Phase 5.1 retrospective Commit C — pushed at Session 26 terminal-close fire)
**Validation gates at session-onset:** `pnpm agent:validate` 26/26 green.
**Predecessor:** Phase 7 onset scope-input artifact at `8ae3886` (`docs/09_briefs/phase-7/2026-05-19-phase-7-extraction-scope-input.md`; 599 LOC).

---

## §1 — Preamble + cross-references

### §1.0 What this cycle is

This is the **Round 1** of the Phase 7 extraction pipeline scope-lock cycle. Phase 7 ships the Tier 2 extraction pipeline named at v3 §7 Step 9 + Phase 5 retrospective §6:380-381 sequencing:

1. **Orchestrator runtime** (`ingestDocument`) — deterministic TypeScript pipeline per ADR-0014 §1 + ADR-0007 Q31 (LLM-orchestration prohibition).
2. **Classifier** (Tier A rule-based + Tier C Claude Sonnet AI fallback + Tier D unknown) per ADR-0014 §7.
3. **Field extractor** (per document type) per ADR-0014 §8 + per-document-type schemas at `apps/web/src/shared/schemas/extraction/` (Phase 7 net-new).
4. **Modal-deployed Python sidecar** running PaddleOCR per ADR-0014 §2 + §3 (Phase 7 net-new infra surface).

Phase 7 is the **substantively new-phase cycle shape** (NOT amendment cycle); inherits substrate from Phases 0/1.x/2/4/5/5.1/6/6.5 and ships net-new orchestrator + classifier + extractor + Modal sidecar code. Per scope-input artifact §1: 3 substantive net-new code surfaces + 7+ inherited substrate consumer surfaces + 2 inherited UI consumer surfaces + 4 inherited governance ADRs.

**Precedent shape:** Phase 6.5 (substantive UI/ingestion chunks with 11-sub-question scope-lock cycle + Round 4 close per `docs/09_briefs/phase-6.5/`) is the substantively-new-phase cycle precedent. Phase 7 sits **substantively heavier** than Phase 6.5 (25 sub-questions at scope-input grade vs Phase 6.5's 11) per Tier 2 pipeline scope breadth. Phase 5.1 amendment-cycle precedent (`docs/09_briefs/phase-5.1/`) provides the scope-lock cycle structural template (this Round 1 artifact mirrors Phase 5.1 Round 1 §-structure exactly).

### §1.1 Session-onset divergence absorption

**Five divergences from Session 28 directive's preconditions surfaced at session-onset verify-from-disk.** All are absorbed at §1 rather than fired as a re-prompt; each surfaces a substrate path or shape correction. Bank as **candidate (c) instances at session-prompt-authoring + brief-citation-shape sub-grains** per Phase 5.1 retrospective Observation #19 parent consolidation framing (brainstorming-side metafact drift family; codified at `scope-lock.md` §Verify-from-disk-at-non-standard-grain pattern).

**Divergence (a) — VFD-2 column-name shape drift.** Directive (inherited from scope-input artifact §6.1) cited `source_documents.hash` column for dedup-by-hash Stage 0. Disk evidence: column is named `original_content_hash` (Phase 1 storage substrate migration `20240135000000_storage_substrate.sql`). Substantive substrate exists; column-name citation drifted. Bank as brief-citation-shape sub-shape under §8 brief-drafting metafact-assertion grain.

**Divergence (b) — VFD-5 table-vs-column shape drift.** Directive (inherited from scope-input artifact §6.1) cited `pipeline_stage_records` as substrate table to verify. Disk evidence: `pipeline_stage_records` is NOT a standalone table; per-stage records ship as **`pipeline_trace` JSONB column on `document_artifacts`** (per ADR-0011 §5 + `documentArtifact.schema.ts` JSDoc: "pipeline_trace is jsonb per §5; content shape is owned by Phase 7 / ADR-0014 §1 (PipelineStageRecord for pipeline_trace). At chunk-4 read-time we accept any jsonb shape (z.unknown() per element); Phase 7 will narrow when the writer ships."). Phase 7 owns the JSONB element shape; no schema migration required for the table itself. Bank as substrate-shape drift sub-shape.

**Divergence (c) — VFD-6 substrate-existence gap (substantive).** Directive (inherited from scope-input artifact §6.1) cited `org_settings.classification_fallback_order` + `org_settings.ai_fallback_budget` columns for verification. Disk evidence: `org_settings` table does NOT exist on disk; columns do NOT exist. ADR-0014 §7 + §8 commit explicitly to shipping these columns "at v1 schema time per ADR-0010 discipline" — so this is a **substantive substrate gap**: ADR-0014 commits Phase 7 (or pre-Phase 7) to ship the columns; they don't exist; scope-input artifact §2.4 ADR-ratification table marked "all green" but didn't catch the substrate gap. Bank as **substrate-coverage drift** sub-shape AND surface as new sub-question `Sub-Q26 (substrate-addition scope for ADR-0014 §7+§8 reserved org_settings columns)` per §3.

**Divergence (d) — VFD-11 path drift.** Directive (inherited from scope-input artifact §6.3) cited `PendingDocumentsView` at `apps/web/src/components/document-platform/PendingDocumentsView.tsx`. Disk evidence: actual path is `apps/web/src/components/canvas/PendingDocumentsView.tsx`. Path drift only; substrate exists. Bank as brief-citation-line-drift sub-shape (Phase 5.1 Observation #19 catalog).

**Divergence (e) — VFD-13 path drift.** Directive (inherited from scope-input artifact §6.3) cited `SplitScreenLayout` at `apps/web/src/components/shell/SplitScreenLayout.tsx`. Disk evidence: actual path is `apps/web/src/components/bridge/SplitScreenLayout.tsx`. Path drift only; substrate exists. Bank as brief-citation-line-drift sub-shape.

**Aggregate observation.** 5 divergences across 16 VFDs = ~31% divergence rate at substrate-shape grain. The divergences come from scope-input artifact §6 (Session 27) which itself transcribed from upstream ADR + retrospective citations. The brainstorming-side metafact drift family (Phase 5.1 Observation #19 parent consolidation codified at `scope-lock.md`) fires at the scope-input-artifact-authoring grain as expected; remediation pattern (verify-from-disk grounding at brainstorming-side) was applied at this Round 1 §2 pass per discipline. **Aggregate firing graduates the discipline's load-bearing application surface to scope-input-artifact-grade in addition to directive-authoring + brief-drafting + session-close-report grades** (5 sub-grain catalog candidate at Phase 7 retrospective; below codification threshold at Round 1 — track at §6.3 carry-forward).

### §1.2 Push state baseline

HEAD = `8ae3886`; `origin/staging` = `4aea7e2`; 1 commit ahead of `origin/staging` at session-onset (the Phase 7 scope-input artifact). Phase 7 scope-lock cycle + chunk briefs + impl + retrospective ceremony banks for terminal-close push at Phase 7 close per Phase 5.1/Phase 6.5 push-terminal-close pattern at `4aea7e2` + `de6bc02` (N=2 precedent; N=3 graduation candidate at Phase 7 close).

### §1.3 Substrate-density-compresses-LOC observation continuation

Session 27 close report observation: "scope-input artifact 599 LOC slightly below ~700-1100 forecast band lower bound; substrate inheritance largely codified at upstream retrospectives so per-phase consumer table compresses to a list; ADR-0014 authoritative for Phase 7 scope so locked-at-onset cuts compress to §-references rather than re-derived prose." This Round 1 artifact applies the same compression at downstream grade: per-sub-question entries reference scope-input artifact §4 option space rather than re-deriving option-space prose. **N=2 observation banking** (scope-input-artifact + Round-1-artifact two-grain consistency). Phase 7 retrospective codification candidate at exploratory framing per `plan-authoring.md` Volume-forecast convention four-curve calibration sub-curve extension precedent (Phase 5.1 retrospective).

### §1.4 Canonical cross-references

- **Phase 7 onset scope-input artifact** at `docs/09_briefs/phase-7/2026-05-19-phase-7-extraction-scope-input.md` (`8ae3886`) — authoritative for sub-question option space + chunk decomposition framing + locked-at-onset cuts.
- **Phase 5.1 Round 1 structural template** at `docs/09_briefs/phase-5.1/2026-05-17-phase-5-1-scope-lock-cycle-round-1.md` (`72a40bf` and renames) — structural template inheritance.
- **v3 proposal §7 Step 9** at `docs/09_briefs/phase-6/2026-05-16-cto-proposal-v3-document-drop-shell-consolidation.md` — Phase 7 scope commitment.
- **ADR-0014** (authoritative for Phase 7 scope) — §1 pipeline architecture; §2 OCR Modal/PaddleOCR; §3 sidecar topology; §7 classifier tier strategy; §8 AI fallback contract; §11 proposal routing; §12 failure classification.
- **ADR-0019** (Ratified 2026-05-04) — confidence calibration governance for ADR-0014 §7 provisional thresholds.
- **ADR-0018 §item 4 Phase 5.1 second amendment** (`83a5405`) — T2 dispatcher activation + bidirectional dispatcher four-part activation discipline; Phase 7 may inherit discipline if T4/T6 dispatcher activations fire within Phase 7 scope.
- **ADR-0011** §6 (document_type 18-value enum) + §7 (ProposedMutation handoff) + §11 (proposal routing) + §15 (INV-DOC-001 leaf) — Phase 7 consumer ADRs.
- **ADR-0007** Q28 (Tier 2 safety contract) + Q30 (Logic Receipt reproducibility) + Q31 (LLM-orchestration prohibition) — Phase 7 safety-contract commitments.
- **Phase 5.1 retrospective** at `docs/07_governance/retrospectives/phase-5-1-retrospective.md` — §6 Phase 7 carry-forwards; §3 Observation #19 brainstorming-side metafact drift parent consolidation (applies at this Round 1 VFD pass per §1.1 absorption).
- **`scope-lock.md`** at `docs/04_engineering/conventions/session/scope-lock.md` — substrate-receipt discipline + Verify-from-disk-at-non-standard-grain pattern + 7-sub-shape metafact drift catalog (codified at Phase 5.1 close; fires at this Round 1 VFD pass).
- **`plan-authoring.md`** at `docs/04_engineering/conventions/session/plan-authoring.md` — Volume-forecast four-curve calibration (sub-curve (b) substrate-fix-narrowness; applies to scope-input-artifact + Round-1-artifact compression per §1.3).
- **CLAUDE.md §Push readiness three-condition gate** — applies at Phase 7 close terminal push.

---

## §2 — Verify-from-disk pass against named substrates

Round 1 walks the 16 VFD targets pre-allocated at scope-input artifact §6 at **Grain 1 substrate-shape** + **Grain 5 existing-consumer-contract** grain. **Grain 2-3-4 deferral note** at §2.4: Phase 7's orchestrator + classifier + extractor are pipeline-style (sequential stage composition) rather than dispatcher-style (per-trigger fan-out) or re-evaluator-style (per-decision-outcome conformance) — so the chunk-3-Phase-4 Grain 2-3-4 walk pattern doesn't directly apply. Per-stage semantic coverage is captured at the sub-question grain (§3 Sub-Q1-25) rather than at the VFD grain.

### §2.1 — Grain 1: substrate-shape verify-from-disk

**VFD-1 — `document_artifacts` schema (engine + lines/pages/words).** Substrate exists at migration `20240146000000_document_artifacts_substrate.sql`. Per `documentArtifact.schema.ts`: engine column + engine_version + lines (jsonb) + pages (jsonb) + words (jsonb) + quality_flags (text[]) + pipeline_trace (jsonb) + confidence + created_at. Schema substrate complete; Phase 7 reads + writes consumer-contract holds. **No divergence; substrate ready.**

**VFD-2 — `source_documents.hash` column.** Divergence (a) absorbed at §1.1: column is named `original_content_hash` (NOT `hash`). Substrate exists; column-name citation drifted. Phase 7 dedup-by-hash Stage 0 consumes `original_content_hash`. **Substrate exists; cite by actual name.**

**VFD-3 — `document_cases` + `document_case_sources`.** Substrate exists at migration `20240143000000_document_cases_substrate.sql`. Phase 2 chunk 1 substrate; Phase 7 orchestrator consumes case lifecycle (createDocumentCase + attachDocumentCaseSource + state transitions via `update_document_case_state_with_audit` RPC). **No divergence; substrate ready.**

**VFD-4 — `chart_of_accounts` + `vendors`.** Substrate exists at migration `20240101000000_initial_schema.sql`. Phase 5 substrate consumer surface (account lookups + vendor matcher integration per ADR-0014 §9). **No divergence; substrate ready.**

**VFD-5 — `pipeline_stage_records` table.** Divergence (b) absorbed at §1.1: per-stage records ship as `pipeline_trace` JSONB column on `document_artifacts`, NOT as standalone table. Per `documentArtifact.schema.ts` JSDoc: "Phase 7 will narrow when the writer ships." Phase 7 owns the JSONB element shape per ADR-0014 §1 PipelineStageRecord contract. **No table-level substrate addition required; Phase 7 writes JSONB elements at orchestrator chunk grade.**

**VFD-6 — `org_settings.classification_fallback_order` + `org_settings.ai_fallback_budget` columns.** Divergence (c) absorbed at §1.1: `org_settings` table does NOT exist on disk; columns do NOT exist. **Substantive substrate gap** — ADR-0014 §7 + §8 commit explicitly to shipping these columns "at v1 schema time per ADR-0010 discipline." Scope-input artifact §2.4 ADR-ratification table marked all green but didn't catch the substrate gap. **Surfaced as new sub-question Sub-Q26 at §3 (substrate-addition scope for ADR-0014 §7+§8 reserved org_settings columns)**. Disposition deferral to Round 2-K per topical adjudication grouping.

### §2.2 — Grain 5: existing-consumer-contract verify-from-disk

**VFD-7 — `ingestionService.handleDragDropUpload` return signature.** Substrate exists at `apps/web/src/services/document-platform/ingestionService.ts`. Pattern B external-wrap; signature `(input: DragDropUploadInput, ctx: ServiceContext): Promise<DragDropUploadResult>`. Phase 6 chunk 6.2b shipped + Phase 6 chunk 6.3a added `handleForwardedMailbox` (system-actor variant). Phase 7 orchestrator consumes ingestion output via `sourceDocumentId` post-ingestion-commit. **Consumer-contract holds; Phase 7 reads `DragDropUploadResult.batchId` + `sourceDocumentId` per ingestion contract.**

**VFD-8 — `documentRouterService.completeCandidate` signature.** Substrate exists at `documentRouterService.ts:621`. Signature `(input: CompleteCandidateInputRaw, ctx: ServiceContext): Promise<DocumentRelationshipCandidate[]>`. Phase 4 chunk 1 substrate; Phase 7 Stage 6 relationship-candidate computation invokes via the same consumer contract. **Consumer-contract holds; Phase 7 Stage 6 calls per existing signature.**

**VFD-9 — `billService.post` + `paymentService.record` signatures.** billService.post (`billService.ts:271`): `(input: PostBillInputRaw, ctx: ServiceContext): Promise<{ bill_id: string; journal_entry_id: string }>`. paymentService.record (Phase 5.1 chunk 5.1b at `paymentService.ts`): `(input: RecordPaymentInputRaw, ctx: ServiceContext): Promise<{ payment_id: string; journal_entry_id: string }>`. Both return minimal-shape; T1_new_bill + T2_new_payment dispatchers fire post-commit per existing wiring (Phase 4 chunk 3 + Phase 5.1 chunk 5.1b). **Consumer-contract holds; Phase 7 Stage 7 proposal-building routes to these services via Tier 1 committing agent.**

**VFD-10 — `documentExceptionService.enqueueException` signature.** Substrate exists at `documentExceptionService.ts`. Signature `(input: EnqueueExceptionInputRaw, ctx: ServiceContext): Promise<ExceptionQueueEntry>`. Phase 2 chunk 6 substrate; Phase 7 Tier D unknown-fallback + AI-fallback-validation-failed exception routes via this service. **Consumer-contract holds; Phase 7 exception-routing per existing signature; Phase 7 Sub-Q10 adjudicates exception payload contents.**

**VFD-11 — `PendingDocumentsView` props contract.** Divergence (d) absorbed at §1.1: actual path is `apps/web/src/components/canvas/PendingDocumentsView.tsx` (NOT `components/document-platform/`). Substrate exists; Phase 6.5 chunk 3 ship; state-machine `idle_with_recent_cards` + `showing_batch`. **Consumer-contract verifiable at Phase 7 chunk 7.3 + Sub-Q20 detail (post-classification render contract; props extension shape).**

**VFD-12 — `canvasDirective` discriminated union members.** Substrate exists at `apps/web/src/shared/types/canvasDirective.ts`. **39 members confirmed via grep** (28 Phase 1.1 + 5 Phase 1.2 + 1 Phase 6.5 + 5 Phase 2+ stubs). Phase 7 extends with 1-2 new members for extraction-result UX per scope-input §3.7 lock. **Consumer-contract holds; Phase 7 Sub-Q19 adjudicates new member shape (e.g., `'extraction_result'` or `'document_review'`).**

**VFD-13 — `SplitScreenLayout` Pattern γ source-driven routing.** Divergence (e) absorbed at §1.1: actual path is `apps/web/src/components/bridge/SplitScreenLayout.tsx` (NOT `components/shell/`). Substrate exists; Phase 6.5 chunk 2 ship; Pattern γ pure functions (routeStayInActive + routeReplaceActive + routeNewTab + findExistingExactMatch + closeTab + switchTab) at canvasTabRouting.ts. **Consumer-contract holds; Phase 7 extraction-result tab routing reuses Pattern γ Rule 1 (routeNewTab) via existing handleDropEvent or new handleExtractionResult callback.**

### §2.3 — Grain 1+5 ADR substrate verify-from-disk

**VFD-14 — ADR-0014 §item-by-item read.** Authoritative for Phase 7 scope. §1 pipeline architecture (8-stage `ingestDocument` sequence) — locked at scope-input §3.1; §2 OCR PaddleOCR — locked at §3.2; §3 sidecar Modal — locked at §3.2; §4 model versioning — Phase 7 inherits; §5 replay policy — Phase 7 inherits; §6 dedup-by-hash — Stage 0 (consumes VFD-2 `original_content_hash`); §7 classifier strategy — locked at §3.3 + §3.4; §8 AI fallback contract — locked at §3.4; §9 vendor matcher — Stage 5 (Sub-Q14); §10 orphan-blob GC — Phase 7 inherits; §11 proposal routing — Stage 7 (Sub-Q11-15); §12 failure classification — orchestrator inherits; §13 Logic Receipt — Stage 7 emission. **Substrate authoritative; all §items map to Phase 7 chunks per §3.5 scope-input chunk decomposition framing.**

**VFD-15 — ADR-0019 §-by-§ read.** Confidence calibration governance Ratified 2026-05-04. Phase 7 §3.3 classifier per-document-type confidence thresholds (0.85 / 0.80 / 0.85 / N/A) are ADR-0014 §7 provisional v1 values; ADR-0019 owns ongoing calibration cadence. **Phase 7 inherits ADR-0019 governance; no Phase 7 amendment to ADR-0019 expected (consumer-only relationship).**

**VFD-16 — ADR-0007 Q28 matrix + Q30 + Q31.** Tier 2 safety contract (Q28) + Logic Receipt reproducibility (Q30) + LLM-orchestration prohibition (Q31). Phase 7 inherits all three: Q28 matrix shapes per-AI-fallback-field human-confirmation contract per ADR-0014 §8; Q30 reproducibility shapes PipelineStageRecord hash-emission per ADR-0014 §1; Q31 prohibits LLM-driven orchestration (deterministic TS only). **Phase 7 inherits; no amendment expected.**

### §2.4 — Grain 2-3-4 deferral note

Per scope-input §1 framing + Phase 4 chunk 3 precedent: Grain 2 (per-trigger semantic coverage) + Grain 3 (per-trigger × per-decision-outcome conformance) + Grain 4 (idempotency-and-side-effect-contract conformance) apply to dispatcher-style / re-evaluator-style / computational-shape chunks (per `scope-lock.md` §Verify-forward-at-scope-lock for computational-shape chunks). Phase 7's orchestrator + classifier + extractor are **pipeline-style** (sequential stage composition with stateless typed functions per ADR-0014 §1) rather than dispatcher-style. Per-stage semantic coverage is captured at sub-question grain (§3 Sub-Q1-5 pipeline orchestration + Sub-Q6-10 classifier + Sub-Q11-15 field extractor) rather than at VFD grain. **Grain 2-3-4 walk does not fire at Round 1; deferred to per-chunk brief drafting if specific chunks surface dispatcher-style sub-scope.**

### §2.5 — Verify-from-disk findings worth banking

- **Substantive substrate gap at VFD-6** (org_settings table + 2 columns) → surfaced as new Sub-Q26 at §3.
- **5 divergences (a)-(e) at §1.1** → banked under brainstorming-side metafact drift family per Phase 5.1 Observation #19 parent consolidation; aggregate firing graduates discipline application surface to scope-input-artifact grade.
- **Phase 7 pipeline-shape vs dispatcher-shape distinction** → §2.4 framing distinguishes Phase 7 from Phase 4 chunk 3 computational-shape; per-chunk brief drafting may revisit if specific chunks introduce dispatcher sub-scope.
- **Substrate-density-compresses-LOC observation continuation** → §1.3 N=2 banking at scope-input + Round-1 two-grain consistency; Phase 7 retrospective codification candidate at exploratory framing.

---

## §3 — Sub-question structure (option-space confirmation)

Round 1 walks all 25 sub-questions pre-allocated at scope-input artifact §4 + surfaces 1 new sub-question (Sub-Q26) from §2 VFD-6 findings = **26 sub-questions total at Round 1 close**. Per directive: option-space confirmation references scope-input artifact §4.X rather than re-deriving option-space prose; per-sub-question entries identify deferral round and decision class (governance-critical vs product-discovery).

### §3.1 Pipeline orchestration sub-questions (Sub-Q1-5)

**Sub-Q1 — Orchestrator placement.** Option space per scope-input §4.1: services/document-platform/orchestrator/ vs agent/pipelines/ vs services/extraction/. VFD findings hold option space. **Deferral round:** Round 2 (governance-critical: source-tree authority-gradient per ADR-0020). **Decision class:** Governance-critical.

**Sub-Q2 — Sync vs async invocation.** Option space per scope-input §4.1: sync inline with ingestion commit vs async queue (BullMQ / Postgres queue / Modal callback). VFD-7 confirms `ingestionService.handleDragDropUpload` returns `DragDropUploadResult` synchronously; Phase 7 orchestrator invocation hook adjudicates sync vs async. **Deferral round:** Round 2 (governance-critical: cross-phase orchestration coupling). **Decision class:** Governance-critical.

**Sub-Q3 — Retry semantics per stage.** Option space per scope-input §4.1: stage-level retry + idempotency + escalation per ADR-0014 §12 failure classification matrix. **Deferral round:** Round 3 (product-discovery at per-stage detail; governance-critical at per-stage-class level — retry-eligible vs retry-blocked classes). **Decision class:** Mixed.

**Sub-Q4 — Timeout handling.** Option space per scope-input §4.1: per-stage timeout + pipeline-level timeout + Modal sidecar timeout coordination. **Deferral round:** Round 3 (product-discovery at per-stage numeric values; governance-critical at coordination policy). **Decision class:** Mixed.

**Sub-Q5 — Modal sidecar deployment scope.** Option space per scope-input §4.1: in-Phase-7 (chunk 7.1) vs standalone infra session. Brainstorming-side lean per scope-input §8.2: in-Phase-7. **Deferral round:** Round 2 (governance-critical: phase-scope boundary adjudication). **Decision class:** Governance-critical.

### §3.2 Classifier sub-questions (Sub-Q6-10)

**Sub-Q6 — Tier A rule-set definition.** Option space per scope-input §4.2: per-document-type match rules + module structure (composable rules vs per-document-type module). VFD findings hold option space. **Deferral round:** Round 3 (governance-critical at module structure; product-discovery at per-rule heuristic). **Decision class:** Mixed.

**Sub-Q7 — Tier A rule precedence.** Option space per scope-input §4.2: highest-confidence-first vs document-type-specific tiebreaker. ADR-0014 §7 high-precision-low-recall lock constrains option space. **Deferral round:** Round 3. **Decision class:** Governance-critical.

**Sub-Q8 — Tier A → Tier C threshold.** Option space per scope-input §4.2: short-circuit-on-Tier-A-match vs Tier-A-floor-then-Tier-C. ADR-0014 §7 provisional confidence values (0.85 / 0.80 / 0.85 / N/A) apply per document type. **Deferral round:** Round 3 (governance-critical: tier-coordination policy). **Decision class:** Governance-critical.

**Sub-Q9 — Tier C system prompt versioning.** Option space per scope-input §4.2: centralized constant vs per-document-type prompt files + versioning scheme (semver / timestamp / commit-hash). ADR-0014 §8 trace propagation records `pipeline_trace.input_hash` = SHA-256 of OCR text + system prompt version. **Deferral round:** Round 3 (governance-critical at versioning scheme; product-discovery at prompt file layout). **Decision class:** Mixed.

**Sub-Q10 — Tier D exception payload.** Option space per scope-input §4.2: enqueueException payload contents (document_type='unknown' + classification rationale + tier failure trace). VFD-10 `enqueueException` signature `EnqueueExceptionInputRaw` consumer-contract holds. **Deferral round:** Round 3 (governance-critical at audit-completeness; product-discovery at specific fields). **Decision class:** Mixed.

### §3.3 Field extractor sub-questions (Sub-Q11-15)

**Sub-Q11 — Per-document-type extractor functions.** Option space per scope-input §4.3: per-document-type module vs unified extractor with internal dispatch. ADR-0014 §1 Stage 4 signature `extractFields(documentType, ocrArtifact, traceId)` accommodates both. **Deferral round:** Round 2 (governance-critical: module structure parallels Sub-Q6). **Decision class:** Governance-critical.

**Sub-Q12 — Extraction-conviction semantics per field.** Option space per scope-input §4.3: per-field conviction + threshold + below-threshold-routes-to-human-confirmation. ADR-0014 §8 Q28 surface 1 integration locks AI-fallback-fields-flow-through-human-confirmation; per-field calibration extension reserved post-v1 per Q77. **Deferral round:** Round 3 (governance-critical: conviction-threshold policy). **Decision class:** Governance-critical.

**Sub-Q13 — AI fallback per-field schemas.** Option space per scope-input §4.3: Zod schemas per-document-type at `apps/web/src/shared/schemas/extraction/`. ADR-0014 §8 commits to Zod-validated AI output. **Deferral round:** Round 3 (governance-critical at schema location convention; product-discovery at per-field shape). **Decision class:** Mixed.

**Sub-Q14 — Vendor matcher integration.** Option space per scope-input §4.3: matcher location (per ADR-0011 §11 inheritance) + signature (read-only vendor identity-and-matching fields). ADR-0014 §9 commits to vendor-matcher stage; Phase 5 vendors table consumer per VFD-4. **Deferral round:** Round 2 (governance-critical: cross-phase consumer wiring). **Decision class:** Governance-critical.

**Sub-Q15 — Extraction-result UI render.** Option space per scope-input §4.3: new canvasDirective member shape + render integration with PendingDocumentsView. VFD-11 + VFD-12 consumer-contracts hold; Sub-Q19 + Sub-Q20 adjudicate detail. **Deferral round:** Round 4 (product-discovery: UI render detail). **Decision class:** Product-discovery.

### §3.4 Phase 5.1 substrate consumer sub-questions (Sub-Q16-18)

**Sub-Q16 — `payment_confirmation` → `paymentService.record` routing.** Option space per scope-input §4.4: orchestrator-direct vs Tier 1 committing agent intermediary. ADR-0014 §11 + Phase 5.1 ADR-0018 §item 4 second amendment commits T2_new_payment dispatch firing automatically post-commit at `paymentService.record()` site (Phase 5.1 chunk 5.1b). Phase 7 commit path inherits T2 dispatcher activation by construction. **Deferral round:** Round 2 (governance-critical: Tier 1 vs orchestrator-direct commit-grade adjudication per ADR-0014 §11 + ADR-0007 Q28). **Decision class:** Governance-critical.

**Sub-Q17 — `vendor_invoice` → `billService.post` routing.** Mirror of Sub-Q16: bill commit path + INV-DOC-001 enforcement at `billService.post()` per Phase 5.1 chunk 5.1a (orchestrator passes `primary_document_id` = `sourceDocumentId`). T1_new_bill dispatcher fires post-commit (Phase 4 chunk 3 + Phase 5.1 inheritance). **Deferral round:** Round 2 (governance-critical: Tier 1 vs orchestrator-direct + INV-DOC-001 enforcement path). **Decision class:** Governance-critical.

**Sub-Q18 — `receipt` → ??? routing.** Option space per scope-input §4.4: exception queue (v1) vs receiptService greenfield (post-v1). Brainstorming-side lean: exception queue at v1. **Deferral round:** Round 2 (governance-critical: v1 receipt-handling policy). **Decision class:** Governance-critical.

### §3.5 Phase 6.5 UI consumer sub-questions (Sub-Q19-20)

**Sub-Q19 — `canvasDirective` new member shape.** Option space per scope-input §4.5: member names + payload shape + routing through Pattern γ source-driven routing. VFD-12 + VFD-13 consumer-contracts hold; Phase 7 adds 1-2 members. **Deferral round:** Round 4 (product-discovery: UI member naming). **Decision class:** Product-discovery.

**Sub-Q20 — PendingDocumentsView post-classification render.** Option space per scope-input §4.5: classifier-output extends existing state-machine vs new state for post-classification. VFD-11 consumer-contract holds; Phase 6.5 chunk 3 state-machine `idle_with_recent_cards` + `showing_batch` extension shape. **Deferral round:** Round 4 (product-discovery: state-machine extension). **Decision class:** Product-discovery.

### §3.6 Chunk decomposition sub-questions (Sub-Q21-23)

**Sub-Q21 — Phase 7 chunk count + boundaries.** Option space per scope-input §5: 3-chunk (orchestrator + classifier + extractor) vs 4-chunk (chunk 7.3 split) vs 2-chunk (chunks 7.1+7.2 merged). Brainstorming-side lean per scope-input §5: 3-chunk. **Deferral round:** Round 4 (governance-critical: chunk decomposition final lock per Phase 5.1 Round 4 precedent). **Decision class:** Governance-critical.

**Sub-Q22 — Chunk shipping order.** Option space per scope-input §4.6: orchestrator-first vs classifier-first. Per scope-input §5: 3-chunk lean = orchestrator (7.1) → classifier (7.2) → extractor (7.3). **Deferral round:** Round 4 (governance-critical: dependency order). **Decision class:** Governance-critical.

**Sub-Q23 — Modal sidecar chunk placement.** Option space per scope-input §4.6: pre-orchestrator (sidecar at chunk 7.1) vs post-orchestrator (sidecar at chunk 7.N). Sub-Q5 disposition gates this. **Deferral round:** Round 4 (governance-critical: chunk-grade infra ordering; gated by Sub-Q5). **Decision class:** Governance-critical.

### §3.7 Cross-cutting sub-questions (Sub-Q24-25)

**Sub-Q24 — Test infrastructure scope.** Option space per scope-input §4.7: per-chunk test infra incremental vs dedicated test-infra-prep session pre-Phase-7-chunks. Phase 6.5 retrospective Candidate #8 (floor-test absolute-count fragility) is adjacent precedent for test-infra-dedicated-session. **Deferral round:** Round 2 (governance-critical: test-infra session scope adjudication). **Decision class:** Governance-critical.

**Sub-Q25 — Logging + observability.** Option space per scope-input §4.7: per-stage trace structure + AI fallback cost tracking + dev-tools surfacing. ADR-0014 §1 PipelineStageRecord emission contract. **Deferral round:** Round 3 (product-discovery: observability detail). **Decision class:** Product-discovery.

### §3.8 New sub-question surfaced at Round 1 (Sub-Q26)

**Sub-Q26 — Substrate-addition scope for ADR-0014 §7+§8 reserved `org_settings` columns.** **Surfaced at §2.1 VFD-6 substantive substrate gap.** ADR-0014 §7 + §8 commit explicitly to shipping `org_settings.classification_fallback_order` + `org_settings.ai_fallback_budget` columns "at v1 schema time per ADR-0010 discipline." Disk evidence: `org_settings` table does NOT exist on disk; columns do NOT exist.

**Options:**

- **26.α Ship at Phase 7 chunk 7.2 substrate (classifier chunk).** Pair the substrate addition (org_settings table + 2 columns) with the classifier chunk that consumes them. Tight scope; lands during Phase 7.
- **26.β Ship at standalone substrate-fix chunk (chunk 7.0 or pre-chunk-7.1 micro-chunk).** Substrate addition lands separately from classifier consumer; preserves chunk 7.1+7.2+7.3 substantive-scope discipline.
- **26.γ Defer to post-v1.** Per-org configurability is post-v1 per ADR-0014 §7 + §8; if v1 ships only system-fixed defaults, the columns can defer too. Re-amends ADR-0014 §7 + §8 to drop the v1-schema-time commitment OR commits to NOT relying on the columns at v1.
- **26.δ Ship as Phase 5.1.5 amendment cycle (post-Phase-7-onset amendment).** Mini-amendment cycle inserted between Phase 5.1 close and Phase 7 chunks; ships org_settings table + 2 columns as Phase 5.1.5 chunk shape per Phase 5.1 amendment-cycle precedent.

**Adjudication input:** Per Phase 5 retrospective §6:404 "reserved-schema-seats" framing applied to vendor_credits at Phase 2.5 + chunk 5.1a graduation: ADR-0010 substrate-now-enforcement-later discipline ships substrate at v1 schema time even if enforcement is post-v1. Phase 7 inherits this pattern; ADR-0014 §7 + §8 commit-to-v1-schema-time aligns with this discipline.

**Deferral round:** Round 2 (governance-critical: substrate-addition scope adjudication; depends on Sub-Q5 Modal sidecar scope adjudication for chunk-grade placement). **Decision class:** Governance-critical.

---

## §4 — Decision-class split per CTO Condition 7

Per v3 §9 Decision 6 + CTO Condition 7 + Phase 5.1 retrospective §3 precedent: governance-critical decisions land at scope-lock cycle; product-discovery micro-decisions land at brief-drafting; mixed decisions split.

**Governance-critical (lands at this scope-lock cycle):**

- Sub-Q1 (orchestrator placement; source-tree authority-gradient per ADR-0020)
- Sub-Q2 (sync vs async invocation)
- Sub-Q5 (Modal sidecar deployment scope)
- Sub-Q7 (Tier A rule precedence)
- Sub-Q8 (Tier A → Tier C threshold)
- Sub-Q11 (per-document-type extractor module structure)
- Sub-Q12 (extraction-conviction semantics)
- Sub-Q14 (vendor matcher integration)
- Sub-Q16 (payment_confirmation routing — Tier 1 vs orchestrator-direct)
- Sub-Q17 (vendor_invoice routing — Tier 1 vs orchestrator-direct + INV-DOC-001 enforcement)
- Sub-Q18 (receipt routing — v1 policy)
- Sub-Q21 (chunk count + boundaries)
- Sub-Q22 (chunk shipping order)
- Sub-Q23 (Modal sidecar chunk placement)
- Sub-Q24 (test infrastructure scope)
- Sub-Q26 (org_settings substrate-addition scope) **[surfaced at Round 1]**

**Mixed (split-at-Round-N per CTO Condition 7 sub-decision routing):**

- Sub-Q3 (retry semantics: governance-critical at per-stage-class level; product-discovery at per-stage numeric values)
- Sub-Q4 (timeout handling: governance-critical at coordination policy; product-discovery at numeric values)
- Sub-Q6 (Tier A rule-set: governance-critical at module structure; product-discovery at per-rule heuristic)
- Sub-Q9 (Tier C prompt versioning: governance-critical at versioning scheme; product-discovery at prompt file layout)
- Sub-Q10 (exception payload: governance-critical at audit-completeness; product-discovery at specific fields)
- Sub-Q13 (per-field schemas: governance-critical at schema location convention; product-discovery at per-field shape)

**Product-discovery (lands at brief-drafting):**

- Sub-Q15 (extraction-result UI render detail)
- Sub-Q19 (canvasDirective new member naming)
- Sub-Q20 (PendingDocumentsView state-machine extension)
- Sub-Q25 (logging + observability detail)

**Count:** 16 governance-critical + 6 mixed + 4 product-discovery = 26 sub-questions. Governance-critical dominates per substantively-new-phase cycle grain (Phase 5.1 was 4 governance-critical + 3 mixed at 7 sub-questions; Phase 7 ratio shifts toward governance-critical at substantively-new-phase shape).

---

## §5 — Round 2+ scope

### §5.1 Round count forecast

**5-7 rounds** for Phase 7 scope-lock cycle per scope-input §7 framing + substantively-new-phase grain. Phase 5.1 was 4 rounds for 7 sub-questions (~1.75 sub-questions per round); Phase 7 has 26 sub-questions × Phase 5.1's per-round rate = ~15 rounds, but parallel sub-question grouping per topical category compresses substantially. Estimated 6 rounds at ~4-5 sub-questions per round.

### §5.2 Round-by-round forecast

**Round 2 (next session):** Cross-phase orchestration + commit-grade routing (Sub-Q1 + Sub-Q2 + Sub-Q5 + Sub-Q11 + Sub-Q14 + Sub-Q16 + Sub-Q17 + Sub-Q18 + Sub-Q24 + Sub-Q26). 10 sub-questions. Governance-critical batch.

**Round 3:** Classifier + extractor + per-stage details (Sub-Q3 + Sub-Q4 + Sub-Q6 + Sub-Q7 + Sub-Q8 + Sub-Q9 + Sub-Q10 + Sub-Q12 + Sub-Q13). 9 sub-questions. Mixed batch.

**Round 4:** Chunk decomposition + UI consumer detail (Sub-Q21 + Sub-Q22 + Sub-Q23 + Sub-Q15 + Sub-Q19 + Sub-Q20 + Sub-Q25). 7 sub-questions. Final lock per Phase 5.1 Round 4 precedent.

**Round 5 (if needed):** Brief drafting plan + cross-chunk validation matrix + Path C invocation final adjudication.

**Round 6 (if needed):** Cycle close + scope-lock ratification artifact.

### §5.3 Brief drafting plan placeholder

Brief drafting fires after scope-lock cycle close per Phase 5.1 precedent. Per-chunk briefs (3 chunks at brainstorming-side onset grain per scope-input §5) = 3 brief-drafting sessions minimum. Path C invocation candidate at chunk 7.3 (1200-2000 LOC) may split chunk 7.3 brief into 7.3a + 7.3b briefs.

### §5.4 Validation-gate inheritance

Per CLAUDE.md §Push readiness three-condition gate + Phase 5.1 retrospective §6 precedent: per-chunk brief includes validation gate enumeration (typecheck + agent:validate 26/26 + full vitest + chunk-specific behavioral tests). Phase 7 inherits the floor; per-chunk-specific gates surface at brief drafting.

---

## §6 — Round 1 close

### §6.1 Round 1 dispositions banked

- **5 substrate divergences (a)-(e)** absorbed at §1.1; substrate paths + shapes corrected for Phase 7 consumer reads.
- **1 new sub-question (Sub-Q26)** surfaced at §2.1 VFD-6 substantive substrate gap; banked for Round 2 adjudication.
- **0 sub-questions locked at Round 1 grade.** Per directive: option-space confirmation only; no per-sub-question disposition adjudication at this round. All 26 sub-questions defer to Round 2-6 per §5.2 routing.
- **Grain 2-3-4 deferral note** (§2.4) — Phase 7 pipeline-shape doesn't fire dispatcher-style walk pattern; per-chunk brief drafting may revisit.
- **Path C invocation candidates surfaced** at chunk 7.3 (1200-2000 LOC; scope-input §8.1 risk); final lock deferred to Round 4 per Phase 5.1 Round 4 precedent.
- **Substrate-density-compresses-LOC observation N=2** (scope-input + Round 1 two-grain consistency at §1.3); Phase 7 retrospective codification candidate at exploratory framing per `plan-authoring.md` Volume-forecast four-curve calibration sub-curve precedent.

### §6.2 Round 2 prompt inputs

Round 2 directive inputs from this Round 1 close:

- **Sub-question batch** per §5.2: Sub-Q1 + Sub-Q2 + Sub-Q5 + Sub-Q11 + Sub-Q14 + Sub-Q16 + Sub-Q17 + Sub-Q18 + Sub-Q24 + Sub-Q26 (10 sub-questions; governance-critical batch).
- **Substrate citation corrections** per §1.1: VFD-2 cite `original_content_hash`; VFD-5 acknowledge `pipeline_trace` JSONB column shape; VFD-6 surface substrate gap (Sub-Q26); VFD-11 path `components/canvas/`; VFD-13 path `components/bridge/`.
- **Cross-references inherited** from §1.4 canonical cross-references + Phase 5.1 Round 2 precedent shape.
- **Decision-class split adjudication** per §4 governance-critical batch focus at Round 2.

### §6.3 Carry-forward observations

- **Candidate (c) catalog state at Session 28 close:** sp-auth N=0 maintained at this directive (single-execute close); push-state-claim sub-shape N=4 maintained (6-session avoidance trajectory at Sessions 23 + 24 + 25 + 26 + 27 + 28 onset; codification at `b7ec879` empirically validated across 6 sessions). Brief-drafting metafact-assertion grain N=4 maintained at Round 1 (no new sub-shapes; Round 1 divergences are sub-shape-of-existing-catalog instances per Phase 5.1 Observation #19 parent consolidation).
- **Aggregate divergence rate at Round 1 = 31%** (5 of 16 VFDs surfaced divergences). Phase 5.1 Round 1 aggregate divergence rate (for comparison): 2 divergences absorbed at §1.1 / 6 VFDs ≈ 33%. **Comparable rates across two scope-lock cycles** — the brainstorming-side metafact drift pattern operates at consistent rate; verify-from-disk discipline at Round 1 grade catches the drifts before they propagate to downstream rounds. Phase 7 retrospective worth banking the consistency observation.
- **5-sub-grain catalog candidate at brainstorming-side metafact drift family** — Round 1 divergences (a) + (b) + (c) + (d) + (e) surface a sub-grain extension: **scope-input-artifact-authoring grade** (the scope-input artifact is itself an authoring surface where metafact assertions land without verify-from-disk grounding; the discipline applies analogously to brief-drafting + directive-authoring + session-close-report grains). Below codification threshold at Round 1 (single observation; N=1); Phase 7 retrospective codification candidate at N=3+ if subsequent rounds surface additional scope-input-artifact-grade divergences.
- **Substrate-fix narrowness sub-curve (b) extension to Round-1-artifact-authoring grade** — §1.3 N=2 banking (scope-input artifact 599 LOC + this Round 1 artifact LOC). Phase 7 retrospective codification candidate at exploratory framing extension.
- **Local commits ahead of `origin/staging` post-session:** expected 2 (scope-input artifact at `8ae3886` + this Round 1 artifact). No push; banks for Phase 7 terminal-close per precedent.

---

**Round 1 status:** complete. Single-prompt execute-and-close per directive. Next operational fire: Phase 7 scope-lock cycle Round 2 per §6.2 prompt inputs (10-sub-question governance-critical batch).
