# Phase 7 Extraction Pipeline — Scope-Lock Cycle Round 3

**Session:** 30
**Date:** 2026-05-19
**Branch:** `staging`
**Local HEAD at session-onset:** `9b8d0af` (Phase 7 scope-lock cycle Round 2)
**`origin/staging` HEAD:** `4aea7e2` (3 commits behind local; banks for Phase 7 terminal-close push)
**Validation gates at session-onset:** `pnpm agent:validate` 26/26 green (preserved through Round 2 docs-only commit).
**Predecessor:** Phase 7 scope-lock cycle Round 2 at `9b8d0af` (`docs/09_briefs/phase-7/2026-05-19-phase-7-scope-lock-cycle-round-2.md`; 486 LOC).

---

## §1 — Preamble + cross-references

### §1.0 What this round is

This is **Round 3** of the Phase 7 extraction pipeline scope-lock cycle. Round 3 walks the **13-sub-question batch** per Round 2 §6.2 prompt inputs: module-placement (Sub-Q1.b + Sub-Q11.b + Sub-Q14.b) + classifier detail (Sub-Q6 + Sub-Q7 + Sub-Q8 + Sub-Q9 + Sub-Q10) + per-stage detail (Sub-Q3 + Sub-Q4) + extractor detail (Sub-Q12 + Sub-Q13) + column-shape adjudication (Sub-Q27).

### §1.1 Sub-Q5 disposition banked at session-onset

Founder-decision-resolved at Session 29 post-close: **Lock at Path A — in-Phase-7 chunk 7.1 absorbs Modal substrate.** Path C invocation candidate carried forward at chunk 7.1 brief-drafting grade per F-J-14 Grain 1 prospective discipline. Sub-Q23 at Round 4 inherits chunk 7.1 placement. Round 3 walks do NOT re-adjudicate Sub-Q5; treated as substrate constraint.

### §1.2 Walk-order discipline

Round 3 walks module-placement sub-questions first (Sub-Q1.b → Sub-Q11.b → Sub-Q14.b) per coupling discipline: orchestrator subdivision (Sub-Q1.b) gates extractor module placement (Sub-Q11.b); matcher placement (Sub-Q14.b) is independent. After module-placement batch, walk classifier + extractor detail batch in scope-input §4.2 + §4.3 order (Sub-Q6 → Sub-Q7 → Sub-Q8 → Sub-Q9 → Sub-Q10 → Sub-Q3 → Sub-Q4 → Sub-Q12 → Sub-Q13). Sub-Q27 walked last per substrate-scope-grade isolation.

### §1.3 Anti-drift discipline application outcomes

Per directive anti-drift discipline notes (prospective application at directive grade per Round 2 Sub-Q1 directive-realignment precedent):

**Sub-Q12 anti-drift FIRES:** the conflation is structurally confirmed at Round 3 walk grade.

Walk evidence: agent_architecture_policy.md §2.1 (substrate verified at step (b) of Phase A verification sequence — file at `docs/02_specs/agent_architecture_policy.md` NOT `docs/04_engineering/conventions/`) commits per-document-type re-verification matrix as `Field / Source / Re-verification at Tier 1 / Failure mode / Layer` row format. The matrix commits per-field re-verification ACTIONS (Layer 1a FK; Layer 2 service pre-flight; Surface 1 human confirmation for AI-fallback) but **does NOT commit per-field threshold values at substrate-grade**. Per-field thresholds are forward-pointed to ADR-0019 (calibration governance) + ADR-0014 (classifier value owner). ADR-0019 walk evidence: introduces **NO per-field threshold surfaces beyond the four active classification surfaces** (vendor_invoice 0.85 / receipt 0.80 / payment_confirmation 0.85 + Router Subsystem 2 ambiguity-margin). The directive's brainstorming-side lean ("per-field threshold defaults at vendor_invoice 0.85 / receipt 0.80 / payment_confirmation 0.85 per ADR-0014 §7 provisional values inherited at extraction-grade") is a **category-error conflation** — classification-confidence thresholds (is-this-a-vendor-invoice?) do NOT propagate to extraction-field-confidence thresholds (is-this-specific-field-value-correct?) by inheritance. Detail at §2.11 Sub-Q12 walk.

Bank conflation-confirmed-prospectively at §6.3 — **graduates option-space-framing-against-substrate sub-shape catalog to N=4 instance** (scope-input-artifact + Round-1-VFD + Round-2-Sub-Q1 + Round-3-Sub-Q12).

**Sub-Q13 walk evidence — split outcome.** The scope-input §4.3 brainstorming-side lean at `shared/schemas/extraction/` is CONFIRMED valid at Round 3 walk grade (shared/schemas/ is DOMAIN-organized at existing pattern: `accounting/`, `canvas/`, `document-platform/`, `organization/`, `spend/`, `user/` — per-domain subdirectories under shared/schemas/; Phase 5.1 precedent at `shared/schemas/spend/bill.schema.ts` confirms per-domain pattern). **BUT** the directive's anti-drift candidate enumeration cited candidate (c) as "co-located with consumer per Phase 5.1 chunk 5.1a precedent (`apps/web/src/services/spend/` or analogous)" — this candidate framing is **empirically wrong**: Phase 5.1 schemas live at `apps/web/src/shared/schemas/spend/bill.schema.ts` NOT `apps/web/src/services/spend/`. The directive's candidate (c) enumeration was structurally incorrect at the directive-grade.

This is a **distinct sub-shape from Sub-Q12 conflation** — Sub-Q12's drift was at the brainstorming-side LEAN (option-space framing); Sub-Q13's drift was at the directive's CANDIDATE ENUMERATION (option-space surface — the candidate (c) location citation was structurally wrong). Bank as **directive-grade option-space-framing-against-substrate sub-shape variant** at §6.3 — graduates option-space-framing-against-substrate sub-shape catalog to **N=5 instance**.

The anti-drift discipline still operates correctly: the lean held under walk; the directive's candidate enumeration drift was caught at walk-grade rather than absorbed reactively.

### §1.4 ADR-0019 substrate-scope expansion finding

Phase A step 7 ADR-0019 read surfaces a substrate-scope expansion not captured at Round 2 Sub-Q26 lock: **ADR-0019 commits 6 reserved `org_settings.*` columns NULL-default at v1** (Decision item 2; lines 387-424 per ADR-0019 substrate). The columns: threshold override columns (per-org override surface for the four active classification thresholds) + calibration cadence column + test-set-version column. These are **distinct from ADR-0014's 5 reserved columns** (ADR-0014 columns ship NOT NULL DEFAULT at v1-active; ADR-0019 columns ship NULL-default at substrate-now-enforcement-later post-v1).

Sub-Q26 was locked at Round 2 with framing "ADR-0014 §7+§8+§9+§10 reserved columns" (5 columns). The ADR-0019 columns are a **separate substrate concern** but ship at the same `org_settings` table substrate-add migration per ADR-0010 substrate-now discipline. Total `org_settings` reserved column count at chunk 7.2 substrate-add migration: **5 (ADR-0014 v1-active NOT NULL DEFAULT) + 6 (ADR-0019 NULL-default substrate-now-enforcement-later) = ~11 columns total**.

Sub-Q26 lock holds at Round 2 scope (5 columns per ADR-0014 framing); the ADR-0019 columns surface as Sub-Q26 substrate-scope continuation at chunk 7.2 brief-drafting grade. Bank at §6.3 carry-forward — Sub-Q26 substrate-scope expansion N=2 banking (Round 2 caught 2→5; Round 3 surfaces 5→~11).

### §1.5 Substrate-density-compresses-LOC observation continuation

Round 2 §1.3 N=3 banking achieved (scope-input 599 + Round 1 310 + Round 2 486 LOC; three-grain consistency at sub-curve (b) below-floor compression). Round 3 forecast at ~600-1000 LOC per per-sub-question walk depth at 13 governance-critical + mixed sub-questions. **N=4 banking candidate at compression trajectory continuation if Round 3 LOC lands in or below band.**

### §1.6 Canonical cross-references

- **Round 2 artifact** at `docs/09_briefs/phase-7/2026-05-19-phase-7-scope-lock-cycle-round-2.md` (`9b8d0af`) — predecessor; Round 3 prompt inputs at §6.2.
- **Round 1 artifact** at `docs/09_briefs/phase-7/2026-05-19-phase-7-scope-lock-cycle-round-1.md` (`2d97efe`) — VFD pass + Round 2 prompt inputs.
- **Phase 7 onset scope-input artifact** at `docs/09_briefs/phase-7/2026-05-19-phase-7-extraction-scope-input.md` (`8ae3886`) — sub-question option-space inheritance.
- **ADR-0014 §1 + §7 + §8 + §9 + §12** — Sub-Q3 + Sub-Q4 + Sub-Q6 + Sub-Q7 + Sub-Q8 + Sub-Q9 + Sub-Q10 anchors; failure classification matrix verbatim at §12.
- **ADR-0007 Q28 + Q30 + Q31** — Sub-Q12 extraction-conviction semantics primary anchor (per anti-drift discipline); Sub-Q9 prompt versioning anchor.
- **ADR-0019** (Ratified 2026-05-04) — confidence calibration governance; Sub-Q7 + Sub-Q8 anchor; ADR-0019 substrate-scope expansion finding at §1.4.
- **ADR-0020 §1 + §3** — Sub-Q1.b + Sub-Q11.b + Sub-Q14.b + Sub-Q13 placement anchors.
- **`docs/02_specs/agent_architecture_policy.md` §2.1** — per-field re-verification matrix substrate (Sub-Q12 primary anchor; verified at step (b) of Phase A verification sequence).
- **`apps/web/src/agent/orchestrator/` existing chat-orchestrator contents** — Sub-Q1.b subdivision walk evidence.
- **`apps/web/src/services/spend/vendorService.ts`** (90 LOC; thin surface with `listVendors` export) — Sub-Q14.b Candidate A walk evidence.
- **`apps/web/src/shared/schemas/spend/bill.schema.ts`** — Phase 5.1 schema location precedent (NOT at `services/spend/`); Sub-Q13 walk evidence.
- **`apps/web/src/services/document-platform/documentExceptionService.ts`** — `enqueueException` signature + `ExceptionReasonSchema` enum substrate; Sub-Q10 anchor.

---

## §2 — Per-sub-question walk

Walk-order Sub-Q1.b → Sub-Q11.b → Sub-Q14.b → Sub-Q6 → Sub-Q7 → Sub-Q8 → Sub-Q9 → Sub-Q10 → Sub-Q3 → Sub-Q4 → Sub-Q12 → Sub-Q13 → Sub-Q27 per §1.2.

### §2.1 Sub-Q1.b — Orchestrator module subdivision

**Option space:** flat (extraction orchestrator co-resides with chat-orchestrator files at top level of `agent/orchestrator/`) vs subdirectory (`agent/orchestrator/extraction/` or `agent/orchestrator/ingestDocument/`).

**Substrate evidence:**

- Existing `agent/orchestrator/` contents: `buildSystemPrompt.ts` + `callClaude.ts` + `index.ts` + `loadOrCreateSession.ts` + `toolsForPersona.ts` (5 chat-orchestrator files).
- Chat-orchestrator is LLM-planned (ADR-0007 §Tier 0/Tier 3 framing); extraction-orchestrator is deterministic-TS (ADR-0014 §1 + ADR-0007 Q31).
- Cognitive separation between the two surfaces is operationally real (different invocation patterns; different test surfaces; different orchestration paradigms).
- ADR-0020 §1 canonical folder layout cites `orchestrator/` as a single folder; internal subdivision is not commitment-grade.

**Walk:** Co-residence at top level of `agent/orchestrator/` would mix LLM-planned chat-orchestrator (5 existing files) with deterministic-TS extraction-orchestrator (Phase 7 net-new files including `ingestDocument.ts` + per-stage modules) at the same directory level — blurs the operational distinction. Subdirectory at `agent/orchestrator/extraction/` preserves the cognitive separation while keeping both orchestrators under the canonical `agent/orchestrator/` placement.

**Disposition:** **Lock at subdirectory `apps/web/src/agent/orchestrator/extraction/`.** Phase 7 extraction-orchestrator + per-stage modules live at this path; chat-orchestrator continues at `agent/orchestrator/` top-level. The subdivision boundary maps to the LLM-planned-vs-deterministic-TS operational distinction.

### §2.2 Sub-Q11.b — Per-document-type extractor module placement

**Option space:** extractors-co-resident-with-orchestrator (e.g., `agent/orchestrator/extraction/vendorInvoiceExtractor.ts` flat alongside `ingestDocument.ts`) vs extractors-in-subdirectory (`agent/orchestrator/extraction/extractors/vendorInvoiceExtractor.ts`).

**Substrate evidence:**

- Sub-Q1.b lock: `agent/orchestrator/extraction/` subdirectory established.
- 3 v1-active extractor surfaces (`vendor_invoice` + `receipt` + `payment_confirmation` per ADR-0011 §6 v1-active subset; `unknown` has no extractor).
- ADR-0014 §1 Stage 4 signature: `extractFields(documentType, ocrArtifact, traceId)` per-document-type function-per-type contract.
- Round 2 Sub-Q11 lock: per-document-type module structure (3 modules at v1).

**Walk:** 3 extractor files at v1 is small enough that additional nesting (extractors/ subdirectory) introduces depth without organizational benefit. Flat layout within `agent/orchestrator/extraction/` keeps extractors visually adjacent to the orchestrator that calls them. Post-v1 expansion (Tier B trained classifier + additional document-type extractors per ADR-0011 §6 reserved subset) could trigger extractors/ subdirectory at that grade.

**Disposition:** **Lock at flat within `agent/orchestrator/extraction/`.** Three files at v1: `vendorInvoiceExtractor.ts` + `receiptExtractor.ts` + `paymentConfirmationExtractor.ts` alongside `ingestDocument.ts` and other orchestrator modules. Subdirectory deferred to post-v1 if extractor surface grows.

### §2.3 Sub-Q14.b — Vendor matcher module placement

**Option space:** Candidate A (existing `services/spend/vendorService.ts` extension) vs Candidate B (new `services/extraction/vendorMatcher.ts` module).

**Substrate evidence:**

- `services/spend/vendorService.ts` exists at 90 LOC with `listVendors` function exported (thin surface; single-function module at session-onset).
- Phase 5 vendor mutation surfaces are minimal (vendorService is read-side; vendor mutation lives elsewhere or is post-v1).
- Phase 7 vendor matcher is read-only per ADR-0014 §9 (matcher reads vendor identity-and-matching fields ONLY).
- ADR-0020 §3 import boundary rules: matcher must live under `services/` (deterministic engine layer; reads vendors table via repository).
- Round 2 Sub-Q14 lock: matcher read-only signature per ADR-0014 §9.

**Walk:** vendorService.ts is THIN (90 LOC, single function) — Candidate A extension is operationally clean. Adding `matchVendor` function alongside `listVendors` doesn't bloat the file; both are read-side vendor operations. Candidate B (new `services/extraction/` subdirectory under services/ for a single function) introduces new top-level subdirectory under services/ at single-function-justification — the new-subdirectory cost outweighs the Phase-7-isolation benefit when the matcher surface is small. If post-v1 expansion introduces additional extraction-domain services (e.g., classifierService greenfield, extractorService greenfield), a `services/extraction/` subdirectory could surface at that grade.

**Disposition:** **Lock at Candidate A (`services/spend/vendorService.ts` extension).** `matchVendor(input: VendorMatchInput, ctx: ServiceContext): Promise<VendorMatchResult>` exported alongside `listVendors` in vendorService.ts. Phase-7-isolation argument (Candidate B) deferred to post-v1 if services/extraction/ subdirectory neighbors emerge.

### §2.4 Sub-Q6 — Tier A rule-set module structure

**Option space (scope-input §4.2):** per-document-type module vs composable rules (rules-as-pure-functions composed dynamically).

**Substrate evidence:**

- ADR-0014 §7 "high precision, low recall" lock — per-document-type rules match specific patterns (e.g., "Invoice" header → vendor_invoice; receipt-shape pattern → receipt).
- Sub-Q1.b + Sub-Q11.b locks: `agent/orchestrator/extraction/` subdirectory; flat module layout at v1.
- Parallels per-document-type extractor module structure (Sub-Q11).

**Walk:** Per-document-type module structure aligns with extractor module structure (Sub-Q11.b lock) and with §7 high-precision-low-recall framing where each document-type has distinct match patterns. Composable rules (rules-as-pure-functions composed dynamically at runtime) is more flexible but introduces orchestration complexity (rule registration; rule composition; rule precedence) at v1 grade — premature optimization for v1's 3-document-type scope.

Classifier substrate is larger than extractor substrate (3 tiers × multiple rules per tier vs single extractor per document type) — warrants its own subdirectory within `extraction/`.

**Disposition:** **Lock at per-document-type rule modules within classifier subdirectory: `agent/orchestrator/extraction/classifier/`.** Modules: `vendorInvoiceRules.ts` + `receiptRules.ts` + `paymentConfirmationRules.ts` (Tier A per-document-type rules) + `tierCoordination.ts` (tier-coordination logic per Sub-Q7 + Sub-Q8) + `aiFallback.ts` (Tier C AI fallback per Sub-Q9). Within `extraction/classifier/` flat layout at v1.

### §2.5 Sub-Q7 — Tier A rule precedence

**Option space:** highest-confidence-first vs document-type-specific tiebreaker.

**Substrate evidence:**

- ADR-0014 §7 "high precision, low recall" framing — Tier A rules produce specific high-confidence matches when they fire.
- Multi-match scenario: e.g., document with "Invoice" header (vendor_invoice rule) AND receipt-shape pattern (receipt rule) — both fire.

**Walk:** ADR-0014 §7 high-precision framing implies Tier A rules are intrinsically high-confidence; if multiple high-confidence matches fire for the same document, the document is structurally ambiguous (genuinely vendor_invoice-shaped AND receipt-shaped). Two adjudication paths: (a) highest-confidence-first picks the rule with highest declared confidence; (b) document-type-specific tiebreaker (e.g., vendor_invoice always beats receipt when both match) introduces precedence policy.

Path (a) is simpler and avoids hard-coding precedence policy that may not generalize across all multi-match scenarios. Path (b) requires per-document-type-pair precedence rules that grow combinatorially with document-type count.

**Disposition:** **Lock at highest-confidence-first.** When multiple Tier A rules match the same document, the rule with the highest declared confidence wins. Ties (same declared confidence from multiple rules) route to Tier C AI fallback per Sub-Q8 fall-through logic.

### §2.6 Sub-Q8 — Tier A → Tier C threshold

**Option space:** highest-confidence-first short-circuit vs Tier-A-floor-then-Tier-C.

**Substrate evidence:**

- ADR-0014 §7 verbatim: "**High precision, low recall** — when Tier A matches, the confidence is high; when it doesn't, the document falls to subsequent tiers."
- Per-document-type confidence threshold values (Q65 provisional v1): vendor_invoice 0.85 / receipt 0.80 / payment_confirmation 0.85.

**Walk:** §7's "when Tier A matches, the confidence is high; when it doesn't" framing implies **binary match-or-no-match**, not graded confidence with fall-through. Rule design enforces high-precision binary output: a Tier A rule either matches with high intrinsic confidence (above per-document-type threshold) or it doesn't match at all (no graded "moderate-confidence Tier A" output). The threshold value per document type (0.85/0.80/0.85) is a check against the rule's intrinsic confidence — not a graded short-circuit floor.

**Disposition:** **Lock at binary match-or-no-match short-circuit.** Tier A rules produce binary output: match (confidence ≥ per-document-type threshold per ADR-0014 §7 provisional values) → short-circuit (do NOT fall to Tier C); no match (or all rules below threshold) → fall to Tier C AI fallback. No graded "moderate-confidence Tier A" intermediate path at v1.

### §2.7 Sub-Q9 — Tier C system prompt versioning

**Option space:** centralized constant (`extraction/classifier/promptVersion.ts`) vs per-document-type prompt files + versioning scheme (semver / timestamp / commit-hash / content-hash).

**Substrate evidence:**

- ADR-0014 §8 trace propagation: `pipeline_trace` records `(stage_name, input_hash, output_hash, model, timestamp)` where `input_hash = SHA-256 of OCR text + system prompt version`.
- ADR-0007 Q30 Logic Receipt reproducibility constraint: every fallback call's prompt version must be deterministically recordable in pipeline_trace.
- ADR-0014 §8 verbatim: "the prompt-version is the rotating discriminator that the calibration governance (ADR-0019) controls."

**Walk:** Per-document-type prompts align with per-document-type rule modules (Sub-Q6 lock) and per-document-type extractor modules (Sub-Q11.b lock). Centralized constant for prompt VERSION (not for prompts themselves) provides single discriminator across all prompts. Versioning scheme adjudication:

- **Semver:** manual bump; clean version semantics; bump-discipline requirement.
- **Timestamp:** rotates whenever prompt file modified; conflates trivial whitespace changes with semantic changes.
- **Commit-hash:** rotates on every commit including unrelated commits; over-rotation.
- **Content-hash (SHA-256 of prompt file content):** rotates ONLY when prompt content actually changes; reproducible; deterministic.

Content-hash is the best fit for Q30 reproducibility — the version identifier rotates precisely when prompt content changes; pipeline_trace.input_hash includes prompt content-hash; replay against the recorded hash reproduces deterministically.

**Disposition:** **Lock at per-document-type prompt files + content-hash versioning.** Prompt files at `agent/orchestrator/extraction/classifier/prompts/{document_type}.prompt.ts` (or `.txt` if non-TS substrate). Version identifier = SHA-256 of prompt file content. `pipeline_trace.input_hash` records `SHA-256(OCR text || prompt content-hash || document type)` per ADR-0014 §8 trace propagation contract.

### §2.8 Sub-Q10 — Tier D exception payload

**Option space:** payload contents passed to `documentExceptionService.enqueueException` for Tier D unknown-classification + AI-fallback-validation-failed cases.

**Substrate evidence (verbatim from Phase A step 12):**

```typescript
export const EnqueueExceptionInputSchema = z.object({
  document_case_id: z.string().uuid(),
  source_document_id: z.string().uuid().optional(),
  exception_reason: ExceptionReasonSchema,
  trace_id: z.string().uuid(),
  created_by: z.string().uuid().optional(),
});
```

```typescript
export const ExceptionReasonSchema = z.enum([
  'manual_route',
  'low_confidence_classification',
  'unknown_document_type',
  'unmatched_router_candidate',
  'multi_candidate_ambiguity',
  'invariant_violation',
]);
```

ADR-0014 §12 audit event shapes:

- `extraction_failed` with `failure_reason` ∈ `{document_corrupted, ocr_empty_output, ai_fallback_validation_failed, confidence_below_threshold}`.

**Walk:** Existing `ExceptionReasonSchema` enum covers:

- Tier D unknown-classification → `unknown_document_type` (existing).
- AI-fallback confidence below per-document-type threshold → `low_confidence_classification` (existing).
- Tier A no-match + Tier C unavailable / Modal sidecar timeout → `manual_route` (existing; generic operator-review path).

Gap: AI-fallback Zod validation failure (`ai_fallback_validation_failed` per §12.3) — no existing enum value matches precisely. Options: (a) map to `invariant_violation` (existing; loose semantic fit); (b) extend ExceptionReasonSchema with new value `ai_fallback_validation_failed` at chunk 7.2 substrate-add migration per ADR-0010 reserved-enum-states discipline.

Path (b) is cleaner — preserves audit clarity at exception-queue grade. The enum extension is small (1 new value); ships at chunk 7.2 alongside other substrate-add work.

**Disposition:** **Lock at existing `ExceptionReasonSchema` + extend with `ai_fallback_validation_failed` at chunk 7.2 substrate.** Phase 7 enqueueException payload usage:

- Tier D unknown → `exception_reason='unknown_document_type'`.
- AI fallback below threshold → `exception_reason='low_confidence_classification'`.
- AI fallback Zod validation fails → `exception_reason='ai_fallback_validation_failed'` (NEW at chunk 7.2).
- Generic per-stage failure (transient exhausted, persistent unavailable, permanent malformed per §12) → typed exception via ADR-0014 §12 audit event shape (distinct from ExceptionReasonSchema enum; routed through audit event surface).

### §2.9 Sub-Q3 — Retry semantics per stage

**Option space:** stage-level retry policy + idempotency + escalation.

**Substrate evidence (ADR-0014 §12.1 verbatim):**

> "Retry per ADR-0013 item 8 parameters: max 3 attempts, base 500ms, exponential factor 2x, ±20% jitter, total budget ~3.5s wall-clock. The retry budget is per-stage (not per-pipeline); a pipeline run that retries OCR three times then needs to retry classification budgets independently."

§12.2 (persistent/unavailable): "No retry; retry on these failures wastes time and masks the underlying configuration issue. Route to exception queue immediately."

§12.3 (permanent/malformed): "No retry — the operation is broken in a way retry cannot fix; the document needs human attention."

**Walk:** ADR-0014 §12 commits retry policy verbatim. Decision-class split per Round 1 §4: governance-critical at per-stage-class level (retry-eligible vs retry-blocked classes); product-discovery at numeric values. Both surfaces are substrate-committed at §12 — Round 3 walk locks at §12-inherited.

**Disposition:** **Lock at §12-inherited.** Retry-eligible class = §12.1 transient retryable (max 3 attempts; base 500ms; exponential factor 2x; ±20% jitter; total budget ~3.5s wall-clock; per-stage independent). Retry-blocked classes = §12.2 persistent/unavailable + §12.3 permanent/malformed (immediate exception queue routing). Phase 7 implementation references §12 parameters verbatim; no Phase 7-specific retry policy beyond §12.

### §2.10 Sub-Q4 — Timeout handling

**Option space:** per-stage timeout + pipeline-level timeout + Modal sidecar timeout coordination.

**Substrate evidence:**

- ADR-0014 §12.1: 3.5s wall-clock budget for transient retry (per-stage).
- §12.1 Modal sidecar timeout example: "Sidecar timeout (Modal cold-start exceeded budget)" → transient retryable class.
- §12.1 per-stage budget framing: "The retry budget is per-stage (not per-pipeline)."

**Walk:** Per-stage independent timeout budgets per §12.1 framing. Modal sidecar timeout is a per-stage timeout (Stage 2 OCR runs against Modal; Modal cold-start delays count against Stage 2's retry budget). Pipeline-level timeout would compose from per-stage budgets if needed; v1 ships without pipeline-level wrapper timeout (per-stage budgets cumulatively bound pipeline runtime).

Coordination policy: each stage runs with its own retry budget; transient class triggers retry within budget; exhaustion routes to `pipeline_transient_failure` exception (per §12.1 verbatim). Modal sidecar HTTP request timeout configured to match Stage 2's per-stage budget.

**Disposition:** **Lock at per-stage independent budget + Modal sidecar timeout coordination via Stage 2 per-stage budget.** Pipeline-level timeout wrapper NOT shipped at v1 (per §12.1 per-stage-not-per-pipeline framing). Numeric values defer to chunk 7.1 brief-grade (Stage 2 OCR budget; Stage 3 classifier budget; Stage 4 extractor budget) per decision-class product-discovery routing at Round 1 §4.

### §2.11 Sub-Q12 — Extraction-conviction semantics per field (ANTI-DRIFT FIRES)

**Option space pre-staged at directive:** per-field threshold + below-threshold-routes-to-human-confirmation (with brainstorming-side lean at "per-field threshold defaults at 0.85/0.80/0.85 per ADR-0014 §7 inherited").

**Substrate evidence — anti-drift discipline applied:**

- ADR-0014 §7: thresholds are CLASSIFICATION-grade (per-document-type classifier confidence); 0.85/0.80/0.85 are classifier confidence thresholds, not extraction-field thresholds.
- ADR-0014 §8 verbatim: "AI-fallback-extracted fields flow through human confirmation on the ProposedEntryCard — the strictest Surface 1 re-verification shape (same as the `amount` field in the framework matrix per ADR-0007 § Closes Q28)."
- ADR-0007 Q28 framework matrix: per-field re-verification policy at Tier 1 commit time (`amount` → human confirmation; `vendor_id` → re-call `getVendor(id)`; `account_code` → must exist in chart of accounts; `entry_date` → re-call `checkPeriod()`; `tax_code_id` → must exist in seeded tax_codes).
- agent_architecture_policy.md §2.1 (substrate verified at Phase A step 8): commits per-document-type field-level rows in `Field / Source / Re-verification at Tier 1 / Failure mode / Layer` row format. The matrix commits per-field re-verification ACTIONS, NOT per-field threshold values. §5 Maintenance discipline forward-points threshold resolution to ADR-0014 (classifier values) + ADR-0019 (calibration governance).
- ADR-0019 (Ratified 2026-05-04): commits 4 active threshold surfaces (vendor_invoice 0.85 / receipt 0.80 / payment_confirmation 0.85 classifier + Router Subsystem 2 ambiguity-margin). Introduces NO per-field threshold surfaces. Per-field thresholds are INPUT to calibration cycle, not output.

**Walk (conflation confirmed prospectively):** The directive's brainstorming-side lean ("per-field threshold defaults at vendor_invoice 0.85 / receipt 0.80 / payment_confirmation 0.85 per ADR-0014 §7 provisional values inherited at extraction-grade") is a **category-error conflation**: classification-confidence thresholds (is-this-a-vendor-invoice?) do NOT propagate to extraction-field-confidence thresholds (is-this-specific-field-value-correct?) by inheritance. The two surfaces are structurally separable per ADR-0014 §7 (classifier confidence) vs §8 (AI-fallback field validation with human-confirmation routing); per-field re-verification governance lives at §2.1 (re-verification actions) + ADR-0019 (calibration governance for classifier thresholds, NOT extraction-field thresholds).

v1 commitment at ADR-0014 §8 + ADR-0007 Q28 + §2.1: **AI-fallback-extracted fields flow through human confirmation** (Surface 1 strictest re-verification). No per-field confidence-threshold gating at extraction-grade; the threshold gate is the classifier-confidence threshold (0.85/0.80/0.85 — gates whether the AI fallback runs at all), not a per-field threshold (which doesn't exist at v1 substrate).

**Disposition:** **Lock at per-field re-verification per §2.1 matrix shape; NO per-field confidence-threshold at extraction-grade v1.**

Phase 7 v1 contract:

- Classification confidence threshold gate at ADR-0014 §7 (0.85/0.80/0.85 per document type) → above threshold: extract fields; below threshold: route to exception queue.
- Extracted fields → §2.1 matrix re-verification at Tier 1 commit time (human confirmation for AI-fallback fields per ADR-0014 §8 + Q28 Surface 1; hard-validation Layer 1a/2 for FK/service-pre-flight fields per §2.1 rows).
- No per-field confidence-threshold gating at extraction-grade.

Per-AI-fallback-field calibrated re-verification (e.g., allowing vendor_id matches above some confidence to skip human confirmation) is reserved for Q28 matrix extension at v1 ship per Q77 per ADR-0014 §8 verbatim — Phase 7 does not introduce per-field thresholds at v1.

**Bank conflation-confirmed-prospectively at §6.3 — option-space-framing-against-substrate sub-shape catalog graduates to N=4 instance.**

### §2.12 Sub-Q13 — AI fallback per-field schemas location (ANTI-DRIFT WALK CONFIRMS LEAN; DIRECTIVE-CANDIDATE-DRIFT BANKED)

**Option space pre-staged at directive (per anti-drift candidate enumeration):**

- Candidate (a) `apps/web/src/shared/schemas/extraction/` — scope-input lean.
- Candidate (b) `apps/web/src/contracts/` — formal boundary layer.
- Candidate (c) co-located with consumer per Phase 5.1 chunk 5.1a precedent (`apps/web/src/services/spend/`).
- Candidate (d) `apps/web/src/agent/orchestrator/extraction/schemas/` — agent-tier locality.

**Substrate evidence (verified at Phase A step 13):**

- (a) `shared/schemas/` directory is DOMAIN-organized at existing pattern: `accounting/`, `canvas/`, `common.schema.ts`, `document-platform/`, `organization/`, `spend/`, `user/`. Per-domain subdirectories; new Phase 7 extraction domain → `shared/schemas/extraction/` matches existing pattern.
- (b) `contracts/` directory exists but contains ONLY `agent-tools/` subdirectory. No precedent for per-domain Zod schemas at `contracts/`. Per ADR-0020 §1 contracts/ framing: `agent-tools/` + `api/` + `events/` + `public/` — formal boundary contracts, not domain schemas.
- (c) "co-located at `services/spend/`" — **EMPIRICALLY WRONG**: Phase 5.1 schemas live at `apps/web/src/shared/schemas/spend/bill.schema.ts` NOT `apps/web/src/services/spend/`. Phase 5.1 precedent is the shared/schemas pattern, not services-co-location. The directive's candidate (c) framing was structurally incorrect.
- (d) `agent/orchestrator/extraction/schemas/` — agent-tier locality; no precedent in codebase. Per ADR-0020 §3 import rules, agent/ may import contracts/ but contracts/ may not import agent/ — co-locating schemas at agent/ would invert the boundary if services need to consume the schemas (which they may — proposal-routing reads extracted fields).

**Walk (lean validated; directive-candidate-drift caught prospectively):** The scope-input §4.3 brainstorming-side lean at `shared/schemas/extraction/` is CONFIRMED at Round 3 walk grade — aligns with existing pattern (shared/schemas/ is DOMAIN-organized per-existing-precedent) AND with Phase 5.1 precedent (Phase 5.1 schemas at shared/schemas/spend/). NOT a directive-realignment of the lean; the lean held under walk.

BUT the directive's candidate (c) enumeration ("co-located with consumer per Phase 5.1 chunk 5.1a precedent at `apps/web/src/services/spend/`") was structurally wrong — Phase 5.1 schemas live at `shared/schemas/spend/` not `services/spend/`. The directive-grade candidate enumeration drift was caught at walk-grade rather than absorbed.

**Disposition:** **Lock at `apps/web/src/shared/schemas/extraction/`.** Aligns with existing per-domain pattern at shared/schemas/. Aligns with Phase 5.1 precedent (shared/schemas/spend/bill.schema.ts). Per-field shape adjudication deferred to chunk 7.2 brief-grade per Round 1 §4 decision-class product-discovery routing.

**Bank directive-candidate-drift at §6.3 — directive-grade option-space-framing-against-substrate sub-shape variant (different surface than Sub-Q12's brainstorming-side-lean drift); graduates option-space-framing-against-substrate sub-shape catalog to N=5 instance.**

### §2.13 Sub-Q27 — Column-shape adjudication for ADR-0014 reserved `org_settings` columns

**Option space (per Round 2 §2.10 partial-lock contingency framing):**

- Lock per-column shape at brief-grade adjudication (column-shape walks at chunk 7.2 brief alongside substrate-implementation grade).
- Lock all 5 column shapes at Round 3 grade if ADR-0014 amendment surface is required to specify shapes verbatim.

**Substrate evidence (per Phase A step 5 ADR-0014 §7+§8+§9+§10 read):**

- `classification_fallback_order` (§7): **NO DEFAULT specified; NO shape implied.** Column-shape adjudication needed.
- `ai_fallback_budget` (§8): NOT NULL DEFAULT 2 → **shape implied integer** by Postgres DDL semantics.
- `vendor_match_threshold` (§9): NOT NULL DEFAULT 0.80 → **shape implied numeric** by Postgres DDL semantics.
- `gc_cadence` (§10): NOT NULL DEFAULT v1-fixed value (daily implied) → **shape implied text or interval** by DDL semantics.
- `gc_threshold_hours` (§10): NOT NULL DEFAULT 24 → **shape implied integer** by DDL semantics.

**Walk:** 4 of 5 columns have DDL-implied shapes via DEFAULT value type literals. Postgres infers column type from DEFAULT in CREATE TABLE if not explicitly specified, but explicit typing is conventional discipline. Brief-grade adjudication makes implicit explicit:

- `ai_fallback_budget integer NOT NULL DEFAULT 2` — clean from DEFAULT.
- `vendor_match_threshold numeric(3,2) NOT NULL DEFAULT 0.80` — precision/scale adjudication at brief.
- `gc_threshold_hours integer NOT NULL DEFAULT 24` — clean from DEFAULT.
- `gc_cadence` — shape adjudication needed (text default 'daily' vs interval default '1 day' vs custom enum).
- `classification_fallback_order` — shape adjudication needed (text[] vs jsonb array of strings vs custom enum array; NO DEFAULT in ADR commitment).

**Disposition:** **Defer column-shape adjudication to chunk 7.2 brief-grade.** Brief-grade walks each column's shape with explicit pre-allocation:

- 3 columns adjudicate from DDL-implied shape (ai_fallback_budget integer; vendor_match_threshold numeric; gc_threshold_hours integer) — small choices at brief (precision/scale for numeric; sign-discipline for integer).
- 2 columns require explicit shape adjudication (gc_cadence text vs interval vs enum; classification_fallback_order text[] vs jsonb).

No ADR-0014 amendment surface required — DDL-implied shapes are within ADR-0014 commitment scope; brief-grade adjudication operates within the commitment. The 2 columns requiring explicit shape adjudication (gc_cadence + classification_fallback_order) operate within ADR-0014's "ships at v1 schema time per ADR-0010 discipline" commitment; specific column type is brief-grade.

**ADR-0019 substrate-scope expansion finding (per §1.4):** ADR-0019 commits 6 additional reserved `org_settings` columns NULL-default at v1 (distinct from ADR-0014's 5 columns). Sub-Q26 substrate-scope at chunk 7.2 substrate-add migration may expand from 5 to ~11 columns total. Bank at §6.3 — Sub-Q26 substrate-scope expansion N=2 banking.

---

## §3 — Round 3 dispositions banked

| Sub-Q | Disposition | Lock detail |
|---|---|---|
| Sub-Q1.b | **Lock** | `agent/orchestrator/extraction/` subdirectory |
| Sub-Q11.b | **Lock** | flat within `agent/orchestrator/extraction/` (3 extractor files at v1) |
| Sub-Q14.b | **Lock** | Candidate A — `services/spend/vendorService.ts` extension with `matchVendor` function |
| Sub-Q6 | **Lock** | per-document-type rule modules within `agent/orchestrator/extraction/classifier/` subdirectory |
| Sub-Q7 | **Lock** | highest-confidence-first |
| Sub-Q8 | **Lock** | binary match-or-no-match short-circuit; no moderate-confidence fall-through |
| Sub-Q9 | **Lock** | per-document-type prompt files at `agent/orchestrator/extraction/classifier/prompts/`; content-hash (SHA-256) versioning |
| Sub-Q10 | **Lock** | existing `ExceptionReasonSchema` + extend with `ai_fallback_validation_failed` at chunk 7.2 substrate |
| Sub-Q3 | **Lock** | §12-inherited (transient retry parameters per ADR-0014 §12.1 verbatim; no-retry for §12.2 + §12.3 classes) |
| Sub-Q4 | **Lock** | per-stage independent budget; Modal sidecar timeout coordination via Stage 2 budget; no pipeline-level timeout wrapper at v1 |
| Sub-Q12 | **Lock (anti-drift override)** | per-field re-verification per §2.1 matrix shape; AI-fallback fields flow through human confirmation per ADR-0014 §8 + Q28 Surface 1; **NO per-field confidence-threshold at extraction-grade v1** (conflation confirmed prospectively) |
| Sub-Q13 | **Lock** | `apps/web/src/shared/schemas/extraction/` per existing pattern + Phase 5.1 precedent (directive candidate (c) framing empirically wrong; banked at §6.3) |
| Sub-Q27 | **Brief-grade deferral** | column-shape adjudication walks at chunk 7.2 brief alongside substrate-implementation grade; 3 columns from DDL-implied shape + 2 columns explicit adjudication; ADR-0019 substrate-scope expansion finding banked at §6.3 |

**Count:**

- **12 clean locks** at Round 3 (Sub-Q1.b + Sub-Q11.b + Sub-Q14.b + Sub-Q6 + Sub-Q7 + Sub-Q8 + Sub-Q9 + Sub-Q10 + Sub-Q3 + Sub-Q4 + Sub-Q12 + Sub-Q13).
- **1 brief-grade deferral** (Sub-Q27; column-shape adjudication walks at chunk 7.2 brief; not a partial-lock per Round 2 sense — full deferral to brief-drafting grade per decision-class product-discovery routing).
- **0 founder-decision-required** at Round 3.
- **0 new sub-questions surfaced** at Round 3.

**Total Round 3 lock progress:** Sub-Q1 fully locked (placement at Round 2 + subdivision at Round 3); Sub-Q11 fully locked (module structure at Round 2 + placement at Round 3); Sub-Q14 fully locked (signature at Round 2 + placement at Round 3); Sub-Q26 fully locked at Round 2 with Sub-Q27 brief-grade deferral surfacing column-shape sub-axis.

---

## §4 — Decision-class split disposition update

Per Round 1 §4 decision-class split (16+1 = 17 governance-critical + 6 mixed + 4 product-discovery = 27 sub-questions at Round 2 close). Round 3 walks 13 sub-questions; updated disposition state:

**Governance-critical sub-questions converted from "pending Round 3":**

- Sub-Q1.b → **locked at Round 3**
- Sub-Q11.b → **locked at Round 3**
- Sub-Q14.b → **locked at Round 3**
- Sub-Q6 → **locked at Round 3**
- Sub-Q7 → **locked at Round 3**
- Sub-Q8 → **locked at Round 3**
- Sub-Q9 → **locked at Round 3**
- Sub-Q12 → **locked at Round 3 (anti-drift override)**
- Sub-Q13 → **locked at Round 3 (governance-critical at schema-location-convention; product-discovery at per-field shape deferred to chunk 7.2 brief per decision-class split)**
- Sub-Q27 → **brief-grade deferral (column-shape walks at chunk 7.2 brief)**

**Mixed sub-questions converted from "pending Round 3":**

- Sub-Q3 → **locked at Round 3 (governance-critical at per-stage-class level; product-discovery at numeric values deferred to chunk 7.1 brief)**
- Sub-Q4 → **locked at Round 3 (governance-critical at coordination policy; product-discovery at numeric values deferred to chunk 7.1 brief)**
- Sub-Q10 → **locked at Round 3 (governance-critical at audit-completeness; product-discovery at specific fields deferred to chunk 7.2 brief)**

**Governance-critical sub-questions still pending Round 4+:**

- Sub-Q21 (chunk count + boundaries; Round 4 per Phase 5.1 precedent)
- Sub-Q22 (chunk shipping order; Round 4)
- Sub-Q23 (Modal sidecar chunk placement; Round 4; Sub-Q5 already resolved at Path A so chunk 7.1 placement inheritance is settled)

**Product-discovery sub-questions still pending Round 4+:**

- Sub-Q15 (extraction-result UI render)
- Sub-Q19 (canvasDirective new member shape)
- Sub-Q20 (PendingDocumentsView post-classification render)
- Sub-Q25 (logging + observability)

**Mixed sub-questions resolved at Round 3 (no remaining mixed for Round 4):** All 6 mixed sub-questions from Round 1 §4 resolved (Sub-Q3 + Sub-Q4 + Sub-Q6 + Sub-Q9 + Sub-Q10 + Sub-Q13 governance-critical surfaces locked at Round 3; product-discovery sub-axes deferred to chunk brief grade).

**Updated count: 17 governance-critical (3 locked at Round 4: Q21+Q22+Q23) + 0 mixed-still-pending + 4 product-discovery (deferred to Round 4) = 7 sub-questions remaining for Round 4 scope.**

---

## §5 — Round 4+ scope

### §5.1 Round 4 scope

Round 4 walks the 7 remaining sub-questions per Round 1 §5.2 forecast (final-lock cycle per Phase 5.1 Round 4 precedent):

- Sub-Q15 (extraction-result UI render)
- Sub-Q19 (canvasDirective new member shape)
- Sub-Q20 (PendingDocumentsView post-classification render)
- Sub-Q21 (Phase 7 chunk count + boundaries; final lock)
- Sub-Q22 (chunk shipping order; final lock)
- Sub-Q23 (Modal sidecar chunk placement; final lock per Sub-Q5 Path A inheritance — chunk 7.1)
- Sub-Q25 (logging + observability)

**Round 4 forecast batch:** 7 sub-questions; Round 4 expected to produce final scope-lock with chunk decomposition ratified.

### §5.2 Round 5+ scope (carry-forward from Round 1 §5.2)

Per Round 1 §5.2: brief drafting plan + cross-chunk validation matrix + Path C invocation final adjudication (Round 5) + cycle close + scope-lock ratification artifact (Round 6 if needed).

### §5.3 Updated round count forecast

Round 1 forecast: 5-7 rounds.

Round 3 close updates: Round 4 final-lock + Round 5 brief drafting plan + Round 6 cycle close = **6 rounds total** at well-calibrated middle of forecast band. If Round 4 surfaces unforeseen substrate divergences (option-space-framing-against-substrate sub-shape continued firings at Sub-Q21+Q22+Q23 walks), Round 5 may split to Round 5a/5b. Plausible at 6 rounds; 7-round outcome contingent on Round 4 substrate divergences.

---

## §6 — Round 3 close

### §6.1 Round 3 dispositions banked summary

- **12 clean locks** at Round 3 (Sub-Q1.b + Sub-Q11.b + Sub-Q14.b + Sub-Q6 + Sub-Q7 + Sub-Q8 + Sub-Q9 + Sub-Q10 + Sub-Q3 + Sub-Q4 + Sub-Q12 + Sub-Q13).
- **1 brief-grade deferral** (Sub-Q27).
- **0 founder-decision-required** at Round 3.
- **0 new sub-questions surfaced** at Round 3.
- **2 anti-drift discipline outcomes**: Sub-Q12 conflation-confirmed-prospectively (N=4 option-space-framing-against-substrate); Sub-Q13 directive-candidate-drift-caught-prospectively (N=5 directive-grade variant).
- **1 substrate-scope expansion finding**: ADR-0019 6 reserved `org_settings` columns NULL-default at v1 (Sub-Q26 substrate scope expands from 5 to ~11 columns at chunk 7.2 substrate-add migration; bank as Sub-Q26 substrate-scope-expansion N=2 banking).

### §6.2 Round 4 prompt inputs

Round 4 directive inputs from this Round 3 close:

**Round 4 sub-question batch (7 sub-questions):**

- Sub-Q15 + Sub-Q19 + Sub-Q20 (UI consumer detail; Phase 6.5 inheritance).
- Sub-Q21 + Sub-Q22 + Sub-Q23 (chunk decomposition + shipping order + Modal sidecar placement; final lock).
- Sub-Q25 (logging + observability).

**Round 3 locks inherited (substrate constraints for Round 4 walks):**

- Sub-Q1: `agent/orchestrator/extraction/` subdirectory.
- Sub-Q1.b + Sub-Q11.b: flat module layout within `extraction/`.
- Sub-Q14.b: matcher at `services/spend/vendorService.ts`.
- Sub-Q6: classifier subdirectory `extraction/classifier/`.
- Sub-Q12: no per-field thresholds at v1; per-§2.1 re-verification matrix.
- Sub-Q13: schemas at `shared/schemas/extraction/`.
- Sub-Q27: column-shape brief-grade deferral.

**Substrate citation corrections inherited:**

- VFD-2 + VFD-5 + VFD-6 + VFD-11 + VFD-13 corrections per Round 1 §1.1 + Round 2 §6.2.
- Sub-Q26 substrate-scope expansion to ~11 columns at chunk 7.2 substrate-add migration (ADR-0014 5 + ADR-0019 6).

### §6.3 Carry-forward observations

- **Candidate (c) catalog state at Session 30 close:** sp-auth sub-grain N=0 maintained (single-execute Round 3 walk; no sub-prompt authoring fired). Push-state-claim sub-shape N=4 maintained (8-session avoidance trajectory at Sessions 23-30 onset; codification at `b7ec879` empirically validated across 8 sessions; tier-1 stability evidence accumulating). Brief-drafting metafact-assertion grain N=4 maintained.
- **Brainstorming-side metafact drift family graduates to N=5 sub-shape catalog at scope-lock-cycle close** — Round 3 surfaces TWO sub-shape instances: Sub-Q12 conflation-confirmed-prospectively (brainstorming-side LEAN drift; category-error against ADR-0014 §7 vs §8 surfaces) AND Sub-Q13 directive-candidate-drift-caught-prospectively (directive-grade CANDIDATE ENUMERATION drift; structurally wrong candidate (c) framing against Phase 5.1 actual location). Catalog state at Round 3 close: 5 sub-shape grain instances — scope-input-artifact-authoring (Round 1 ×3 distinct divergences absorbed) + Round-1-VFD + Round-2-Sub-Q1 + Round-3-Sub-Q12 + Round-3-Sub-Q13. **Codification candidate at Phase 7 retrospective per N=3+ threshold — materially supported.** The Round 3 firings further refine the sub-shape catalog: distinguish brainstorming-side-lean drift (Sub-Q1 + Sub-Q12) from directive-grade-candidate-enumeration drift (Sub-Q13) — sub-grain split at retrospective codification grade.
- **Substrate-density-compresses-LOC observation N=4 banking candidate** — Round 3 LOC at session close vs sub-curve (b) below-floor compression. Three-grain consistency through Round 2 close (599 + 310 + 486 LOC); Round 3 banking holds if LOC lands in or below 600-1000 band. **Codification candidate at Phase 7 retrospective exploratory framing extension per `plan-authoring.md` Volume-forecast four-curve calibration sub-curve precedent.**
- **Sub-Q26 substrate-scope expansion N=2 banking** — Round 2 caught 2→5 columns (ADR-0014 framing incomplete); Round 3 surfaces 5→~11 columns (ADR-0019 distinct substrate concern at same `org_settings` table substrate-add migration). Pattern: ADR-grade reserved-column commitments span multiple ADRs at the same substrate-add surface; brief-grade scope-walk must enumerate ALL governing ADRs' reserved-column commitments. **Codification candidate at Phase 7 retrospective at multi-ADR-substrate-surface enumeration sub-discipline grade.**
- **Directive-authoring multi-iteration refinement sub-grain N=2 banking** — Session 30 (this session) directive was the third iteration cycle on a directive (initial draft → refinement notes → refined directive); Session 29 was the first empirical validation; Session 30 is the second. **Codification threshold N=3+** — if Session 31 (Round 4 directive) surfaces analogous three-iteration cycle, sub-grain graduates to clear codification at Phase 7 retrospective grade. Pattern: complex governance-critical sub-question batches benefit from explicit refinement-iteration discipline at directive grade; three iterations consistently produces tighter directives.
- **Anti-drift discipline prospective-firing validated** — Round 3's two anti-drift firings (Sub-Q12 + Sub-Q13) validated the prospective-application pattern: directive-grade discipline notes (added at refinement iteration 3 per Session 30 directive's anti-drift section) caught the conflations at directive grade, surfaced them prospectively at walk grade, and produced clean lock dispositions with conflation-confirmed banking. The reactive alternative (walk-grade discovery without directive-grade priming) would have produced the same lock dispositions but with weaker banking framing (no prospective-vs-reactive distinction). **Sub-discipline codification candidate at Phase 7 retrospective: anti-drift prospective-application at directive grade.**
- **Local commits ahead of `origin/staging` post-session:** expected 4 (scope-input artifact at `8ae3886` + Round 1 artifact at `2d97efe` + Round 2 artifact at `9b8d0af` + this Round 3 artifact). No push; banks for Phase 7 terminal-close push per precedent.

---

**Round 3 status:** complete. 12 clean locks + 1 brief-grade deferral + 2 anti-drift firings + 1 substrate-scope expansion finding banked. Next operational fire: Phase 7 scope-lock cycle Round 4 per §6.2 prompt inputs (7-sub-question batch covering UI consumer detail + chunk decomposition + observability).
