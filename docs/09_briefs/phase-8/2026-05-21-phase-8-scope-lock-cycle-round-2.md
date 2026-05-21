# Phase 8 Post-v1 Reconciliation + Cross-Service Orchestrators + Ledger Extensions — Scope-Lock Cycle Round 2

**Session:** 45
**Date:** 2026-05-21
**Branch:** `staging`
**Local HEAD at session-onset:** `a158c9b` (Phase 8 scope-lock cycle Round 1)
**`origin/staging` HEAD:** `96eae39` (2 commits behind local; banks for Phase 8 terminal-close push)
**Validation gates at session-onset:** `pnpm agent:validate` 26/26 green (preserved through Round 1 docs-only commit).
**Predecessor:** Phase 8 scope-lock cycle Round 1 at `a158c9b` (`docs/09_briefs/phase-8/2026-05-21-phase-8-scope-lock-cycle-round-1.md`; 299 LOC).

---

## §1 — Preamble + cross-references

### §1.0 What this round is

This is **Round 2** of the Phase 8 post-v1 reconciliation + cross-service orchestrators + ledger extensions scope-lock cycle. Round 2 walks the **10-sub-question governance-critical-dominant batch** per Round 1 §6.2 prompt inputs in the walk-order Sub-Q9 → Sub-Q21 → Sub-Q10 → Sub-Q11 → Sub-Q5 → Sub-Q12 → Sub-Q8 → Sub-Q2 → Sub-Q3 → Sub-Q7 per the walk-order coupling discipline (§1.1 below). Round 2 produces per-sub-question dispositions (lock / partial-lock / split-to-Round-N / founder-decision-required) and substantively advances the Layer 2 4-amendment dependency graph adjudication.

### §1.1 Walk-order coupling discipline

Sub-Q9 (item #A amendment-grade vs substrate-grade fire order) + Sub-Q21 (ADR amendment target location for ENUM addition) walked first as the **Layer 2 foundation** — the fire-order + ADR landing adjudication gates the downstream Sub-Q10 (item #B Q30 extension shape) + Sub-Q11 (item #C amendment location) + Sub-Q12 (item #D second amendment scope) dispositions because all Layer 2 amendments inherit the same fire-order discipline.

Sub-Q5 (withInvariants widening shape) walked after Sub-Q11 (item #C amendment location) per tight-bundle pairing: the widening shape decision is gated by the canonical ADR amendment location (ADR-0007 §Tier 2 vs ADR-0011 §1) per service-layer.md Candidate #11 forward-pointer enumeration.

Sub-Q8 (timeout calibration value) walked after Sub-Q12 (item #D second amendment scope) per tight-bundle pairing: the calibration value decision is gated by the amendment scope (timeout-only vs framing-refinement vs comprehensive) per §6 framing #1 first-chunk substrate-fix-narrowness bundle.

Sub-Q2 (ProposalJustificationSchema shape) walked after Sub-Q10 (item #B Q30 extension shape) per tight-bundle pairing: the schema shape decision IS the Q30 extension shape decision.

Sub-Q3 (paymentService.record consumer count) + Sub-Q7 (fixture-mocked harness boundaries) walked last as independent surfaces (no gating dependency on Layer 2 foundation).

This walk-order coupling discipline parallels Phase 7 Round 2 §1.1 walk-order coupling (Sub-Q16+Q17 commit-grade routing walked first per Sub-Q1 orchestrator-placement gating). Pattern N=2 cross-phase at Round 2 grade — codification candidate at Phase 8 retrospective if cross-phase pattern stabilizes.

### §1.2 ADR substrate verification outcome

Per directive Phase A step 5 verification across 5 ADR substrate sources:

**ADR-0007 Q30** (lines 482-489) — `pipeline_trace: PipelineStageRecord[]` canonical definition; closed at Phase 0 2026-05-03; per-stage record carries `stage_name`, `input_hash`, `output_hash`, `model`, `timestamp`. Confirms Sub-Q10 option space (Q30 extension shape for ProposalJustification bundle-level audit composition).

**ADR-0007 §Tier 2 safety contract** (lines 208-235) — "Safety contract (inviolable). Preserved verbatim from the 2026-04-19 architecture proposal: 1. No direct writes. Tier 2 stages never call mutating services or insert into tables. All commits route through Tier 1." Confirms Sub-Q11 amendment location candidate; system_actor widening relaxes the "no direct writes" rule for system_actor orchestrator invocations.

**ADR-0011 §1** (lines 116-117) — "The Decision is presented as a sequence of spine items, each of which is the contract that one or more downstream ADRs cite." Per §1.2 (β) absorption inherited from Session 43 scope-input: spine-items framing is NOT a service-layer contract enumeration. Sub-Q11 ADR-0011 §1 option candidate is structurally weaker than ADR-0007 §Tier 2 option (which contains the directly-relevant "no direct writes" rule that withInvariants widening amends).

**ADR-0011 §13** (lines 751-790) — `resolution_action` enum 18 values (9 v1-active + 9 reserved); confirms Sub-Q21 21.α option space (commentary expansion target for exception_reason enum naming; §13 itself enumerates resolution_action, not exception_reason).

**ADR-0014 §12.1** (lines 980-1013) — transient retryable section. Current v1: "max 3 attempts, base 500ms, exponential factor 2x, ±20% jitter, total budget ~3.5s wall-clock." Amendment 2026-05-20 (lines 999-1013): "Stage 2 (OCR) overrides the per-stage ~3.5s wall-clock budget to ~30s wall-clock per Modal cold-start substrate…per-request timeout (10s) is enforced at the sidecar client via AbortController." Confirms Sub-Q12 second amendment landing site; second amendment raises per-request timeout from 10_000 to 60_000.

**ADR-0014 §12.3** — (not directly read at Phase A but Phase 7 chunk 7.2 migration 20240157000000 cross-references §12.3 as consumer-ADR location for `ai_fallback_validation_failed` value addition). Confirms Sub-Q21 21.δ analogous-shape precedent: consumer-ADR naming via §12.3-style amendment without ADR-0011 §13 commentary expansion.

**ADR-0010** (lines 73-131) — admit discipline four-element pattern: (1) Postgres enum defines all reserved values from initial shipping + (2) NOT NULL DEFAULT Phase 1 terminal state + (3) Scoped CHECK restricts reserved values + (4) Three-layer Phase 1 defense (DB CHECK + Zod boundary + Service emission). Confirms Sub-Q21 21.β option space (reserved-value admission framework).

### §1.3 Sub-Q21 ADR amendment target precedent verification outcome

Per directive Phase A step 7 verification across 3 substrate sources:

**ExceptionReasonSchema** (`apps/web/src/shared/schemas/document-platform/exceptionQueueEntry.schema.ts` lines 60-69) — 7 v1-active values including `ai_fallback_validation_failed` (Phase 7 chunk 7.2 addition). Reserved: `wrong_entity_exception` + `drift_detected`. Confirms ENUM membership pattern.

**Migration 20240148000000_exception_queue_substrate.sql** (lines 174-190) — `exception_reason` ENUM CREATE TYPE with 8 values total (6 v1-active + 2 reserved). Layer 1 CHECK constraint at lines 230-239 enforces v1-active subset. ADR-0010 four-element pattern fully applied at chunk-6 substrate.

**Migration 20240157000000_phase_7_exception_reason_ai_fallback.sql** — Phase 7 chunk 7.2 ALTER TYPE ADD VALUE precedent for `ai_fallback_validation_failed`. Per migration commentary: "Per Sub-Q10 lock + ADR-0014 §12.3 + Session 38 directive Step 13 (γ): ExceptionReasonSchema gains 'ai_fallback_validation_failed' value as v1-active (graduates from prior OMITTED list per chunk-2-Phase-2 comment-block annotation at exceptionQueueEntry.schema.ts). Split-from-substrate rationale: Postgres 12+ ALTER TYPE ADD VALUE can run inside a transaction, but the new value cannot be referenced by name in the SAME transaction. The chunk_7_active CHECK constraint broadening (next migration 20240158) explicitly references 'ai_fallback_validation_failed', forcing this split. ADR-0022 additive provenance-preserving: enum is grown, not redefined."

**CRITICAL FINDING.** Phase 7 chunk 7.2 precedent ships `ai_fallback_validation_failed` as v1-active via ALTER TYPE ADD VALUE migration (substrate-grade) + ADR-0014 §12.3 consumer-ADR cross-reference (naming-grade). **NO ADR-0011 §13 amendment shipped at chunk 7.2** — the value is consumer-named at ADR-0014 §12.3, NOT enumerated at ADR-0011 §13's resolution_action enumeration (which is a separate enum). This is the analogous-shape precedent for Sub-Q21 21.δ disposition: ADR amendment location for `bundle_partial_commit_reconciliation_pending` lands at the consumer ADR (likely ADR-0014 §11 proposal routing or §13 Logic Receipt, depending on Stage 7 Bundle partial-commit reconciliation framing in ADR-0014 substrate), NOT at ADR-0011 §13 commentary expansion. Sub-Q21 21.α + 21.β + 21.γ options ruled out at evidence basis.

### §1.4 Substrate-density-compresses-LOC observation continuation

Round 1 §1.3 N=3 banking (scope-input artifact 599 LOC Phase 7 + 1432 LOC Phase 8 + Round 1 artifact 310 LOC Phase 7 + 299 LOC Phase 8). Round 2 forecast at ~400-600 LOC per per-sub-question walk depth at 10 governance-critical-dominant sub-questions with lock-grade dispositions + Layer 2 4-amendment dependency graph adjudication. Sub-curve (b) substrate-fix-narrowness framing applies — Round 2 walks settled-substrate adjudication. **N=4 → N=5 banking candidate at Round-2-artifact-authoring grade** (scope-input + Round 1 + Round 2 three-grain consistency across Phase 7 + Phase 8 = N=5 cross-phase).

### §1.5 Canonical cross-references

- **Round 1 artifact** at `docs/09_briefs/phase-8/2026-05-21-phase-8-scope-lock-cycle-round-1.md` (`a158c9b`) — predecessor; sub-question option space + §6.2 Round 2 prompt inputs.
- **Phase 8 onset scope-input artifact** at `docs/09_briefs/phase-8/2026-05-21-phase-8-scope-input.md` (`9b6694b`) — sub-question option-space framing inheritance.
- **Phase 7 Round 2 structural template** at `docs/09_briefs/phase-7/2026-05-19-phase-7-scope-lock-cycle-round-2.md` (486 LOC; Session 29) — §-structure template inheritance + walk-order coupling discipline precedent.
- **ADR-0007 Q30** (lines 482-489) + **§Tier 2 safety contract** (lines 208-235) — Sub-Q10 + Sub-Q11 amendment location source.
- **ADR-0010** (lines 73-131) — admit discipline four-element pattern; Sub-Q21 21.β option source.
- **ADR-0011 §1** (lines 116-117) + **§10** (lines 651-657) + **§13** (lines 751-790) — Sub-Q11 + Sub-Q21 amendment location candidates.
- **ADR-0014 §12.1** (lines 980-1013) — Sub-Q12 second amendment landing site.
- **ADR-0014 §12.3** — Phase 7 chunk 7.2 consumer-ADR naming precedent; Sub-Q21 21.δ analogous-shape source.
- **service-layer.md Candidate #11** (lines 335-466) — Sub-Q5 withInvariants widening shape; structural union per chunk 6.3a `recordMutation` precedent.
- **testing.md Candidate #8** (lines 62-124) — Sub-Q7 fixture-mocked harness convention extension surface.
- **Migration 20240157000000** — Phase 7 chunk 7.2 ALTER TYPE ADD VALUE precedent for Sub-Q21 21.δ.
- **Phase 7 retrospective** at `docs/07_governance/retrospectives/phase-7-retrospective.md` §5.1 + §6.1 — Layer 1 + Layer 2 inheritance source.

---

## §2 — Per-sub-question walk

Walk-order Sub-Q9 → Sub-Q21 → Sub-Q10 → Sub-Q11 → Sub-Q5 → Sub-Q12 → Sub-Q8 → Sub-Q2 → Sub-Q3 → Sub-Q7 per §1.1 coupling discipline. Per sub-question: substrate evidence summary + walk against option space + disposition.

### §2.1 Sub-Q9 — Item #A amendment-grade vs substrate-grade fire order

**Option space (scope-input §7.2):** ADR amendment ratifies first (governance-led) vs substrate-shape chunk lands first (substrate-led).

**Substrate evidence:** Phase 7 chunk 7.2 precedent (migration 20240157000000) shipped substrate-grade-first (ALTER TYPE ADD VALUE migration + ADR-0014 §12.3 consumer-ADR cross-reference) WITHOUT pre-ratifying ADR amendment. ADR-0010 admit discipline four-element pattern applies to substrate-shape regardless of fire order (reserved values defined at initial shipping; the question is whether the amendment ratifies the framework or just names the new value).

**Walk:** Substrate-grade-first per Phase 7 chunk 7.2 precedent is the cleaner operational shape — the migration is the load-bearing substrate change; ADR amendment is the governance-narrative documentation that follows. ADR-amendment-first ordering would require ratifying the framework before the migration ships (additional cycle overhead with no operational benefit for v1-active value additions following established admit pattern).

**Disposition:** **Lock at substrate-grade-first per Phase 7 chunk 7.2 precedent.** Phase 8 Layer 2 item #A ships as: (1) migration ALTER TYPE ADD VALUE on `exception_reason` ENUM + (2) Zod schema broadening at ExceptionReasonSchema + (3) Layer 1 CHECK broadening at chunk-impl + (4) ADR amendment at consumer-ADR location per Sub-Q21 outcome (deferred to Phase 8 retrospective Commit A grade OR chunk-impl substrate-amendment-pairing per §9.7 ratification sequencing).

### §2.2 Sub-Q21 — ADR amendment target location for ENUM addition

**Option space (Round 1 §3.5):** 21.α §13 commentary expansion vs 21.β ADR-0010 admit reserve vs 21.γ both vs 21.δ new ADR Q-number / consumer-ADR naming.

**Substrate evidence per §1.3 verification:** Phase 7 chunk 7.2 precedent ships `ai_fallback_validation_failed` via ALTER TYPE ADD VALUE migration + ADR-0014 §12.3 consumer-ADR cross-reference. NO ADR-0011 §13 amendment at chunk 7.2. The chunk 7.2 precedent IS the analogous-shape disposition for bundle_partial_commit_reconciliation_pending.

**Walk:**

- **21.α §13 commentary expansion** is structurally incorrect — ADR-0011 §13 enumerates `resolution_action` (not `exception_reason`). Commentary expansion would expand §13's deliverable framing to name exception_reason, but §13 doesn't enumerate exception_reason values directly (per ADR-0011 §10 explicit framing: "the `exception_reason` enum is separate from the `resolution_action` enum that §13 owns"). Rejected.
- **21.β ADR-0010 admit reserve** is structurally orthogonal — ADR-0010 admit discipline applies to BOTH v1-active AND reserved values; the framework is the SAME regardless. The question 21.β asks (whether to admit-as-reserved vs admit-as-v1-active) is a different question than amendment LOCATION. Substrate evidence suggests bundle_partial_commit_reconciliation_pending will be v1-active at consumer chunk (Stage 7 Bundle partial-commit reconciliation path materializes Phase 8 first-chunk-or-later). Rejected as amendment-location.
- **21.γ both (ADR-0011 §13 + ADR-0010)** is over-engineered — combines 21.α + 21.β with no operational benefit beyond what 21.δ provides. Rejected.
- **21.δ new ADR Q-number / consumer-ADR naming** matches Phase 7 chunk 7.2 precedent. The consumer ADR for Stage 7 Bundle partial-commit reconciliation is ADR-0014 (Tier 2 Document Pipeline; §11 proposal routing + §13 Logic Receipt cover the substrate domain). Specific §-target within ADR-0014 deferred to chunk-impl grade or Phase 8 retrospective Commit A grade (depends on whether the amendment captures bundle-commit reconciliation framing broadly OR just the new value naming).

**Disposition:** **Lock at 21.δ per Phase 7 chunk 7.2 precedent.** ADR amendment lands at ADR-0014 (consumer ADR for Stage 7 Bundle partial-commit reconciliation substrate); specific §-target (§11 vs §13 vs new §) deferred to chunk-impl substrate-amendment-pairing OR Phase 8 retrospective Commit A grade. Phase 7 retrospective §6.1 item #A "ADR-0011 §13 enumeration broaden" framing formally corrected at Round 2: actual amendment location is ADR-0014 §X (not ADR-0011 §13).

### §2.3 Sub-Q10 — Item #B Q30 extension shape

**Option space (scope-input §7.2):** extends `pipeline_trace` schema to absorb new stage types vs adds parallel field (`bundle_audit_trace: BundleAuditRecord[]`) vs new ADR Q-number.

**Substrate evidence:** ADR-0007 Q30 (lines 482-489) — `pipeline_trace: PipelineStageRecord[]` is **per-stage** (extraction pipeline stages 0-8). Bundle-level INV-AGENT-002 audit event composition is a **per-bundle** concern (Stage 7 commit composite produces a bundle of mutations + attachments; bundle-level audit composes the bundle proposal trace, distinct from per-stage trace).

**Walk:**

- **Extending pipeline_trace to absorb new stage types** mixes per-stage and per-bundle concerns at the same schema field. Bundle-level audit is conceptually distinct from per-stage pipeline trace; sharing the field couples two different grains.
- **Adding parallel field (`bundle_audit_trace: BundleAuditRecord[]`)** preserves per-stage pipeline_trace contract while adding bundle-level composition surface. The two fields remain conceptually separable; consumers can read pipeline_trace for per-stage reproducibility OR bundle_audit_trace for bundle-level audit composition.
- **New ADR Q-number** is overkill — Q30 extension via parallel field is precedented at ADR amendment shape (Phase 2.5 Commit B amendment shape: additive provenance-preserving per ADR-0022).

**Disposition:** **Lock at parallel field (`bundle_audit_trace: BundleAuditRecord[]`).** ProposalJustification gains a new field; Q30 pipeline_trace contract unchanged. BundleAuditRecord schema shape deferred to Round 3 chunk-impl grade OR Phase 8 retrospective Commit A grade (likely fields: bundle_id + composition_at + child_proposal_ids[] + invariant_class per INV-AGENT-002 audit event composition). Pair-tight with Sub-Q2 lock (ProposalJustification shape inherits parallel field decision).

### §2.4 Sub-Q11 — Item #C amendment location ADR-0007 vs ADR-0011

**Option space (scope-input §7.2):** ADR-0007 §Tier 2 safety contract amendment vs ADR-0011 §1 service-layer contract amendment.

**Substrate evidence:** Per §1.2 verification: ADR-0007 §Tier 2 (lines 208-235) contains the directly-relevant "No direct writes. Tier 2 stages never call mutating services or insert into tables. All commits route through Tier 1" rule. ADR-0011 §1 (lines 116-117) is spine-items framing — does NOT contain service-layer contract specifics. service-layer.md Candidate #11 substrate-shim framing (lines 418-428) names ADR-0007 §Tier 2 OR ADR-0011 §1 as candidates but doesn't pick.

**Walk:** ADR-0007 §Tier 2 contains the load-bearing rule that withInvariants widening amends (the "no direct writes" rule needs nuance for system_actor orchestrator invocations where withInvariants wraps the service call with synthetic ServiceContext). ADR-0011 §1 spine-items framing is a structural index, not a service-layer contract enumeration — amending §1 to encompass withInvariants signature widening is structurally weak. ADR-0007 §Tier 2 is the canonical home.

**Disposition:** **Lock at ADR-0007 §Tier 2 safety contract amendment.** Phase 8 Layer 2 item #C ships ADR amendment at ADR-0007 §Tier 2 lines 208-235; amendment ratifies the system_actor widening exception to the "no direct writes" rule (orchestrator constructs synthetic ServiceContext satisfying withInvariants pre-flight invariants; the wrapped service call IS the Tier 1 commit, not a Tier 2 direct write). Phase 7 retrospective §6.1 item #C OR alternative refined per Round 2 verification: ADR-0007 §Tier 2 canonical (ADR-0011 §1 alternative rejected at substrate evidence basis).

### §2.5 Sub-Q5 — withInvariants widening shape

**Option space (scope-input §7.1):** structural union (`ServiceContext | SystemActorServiceContext`) vs discriminated union (`{type: 'service'} | {type: 'system_actor'}`).

**Substrate evidence:** service-layer.md Candidate #11 substrate-shim framing (lines 418-428): "the canonical resolution is widening `withInvariants`'s accepted ctx shape to a structural union (`ServiceContext | SystemActorServiceContext`), parallel to the chunk 6.3a `recordMutation` widening pattern." Phase 7 chunk 7.3a + 7.3b consumer-side synthCtxForRouter + synthCtxForCommit N=2 cross-chunk evidence at 5-field shape.

**Walk:** Structural union is non-breaking for existing ServiceContext consumers (existing usages continue to type-check; new SystemActorServiceContext usages add new shape). Discriminated union requires adding `type` discriminator field to BOTH shapes — breaking change for existing ServiceContext consumers (every existing site needs `type: 'service'` added). The structural union approach matches chunk 6.3a `recordMutation` widening pattern precedent (verified at service-layer.md Candidate #11 cross-reference).

**Disposition:** **Lock at structural union** per service-layer.md Candidate #11 explicit forward-pointer + chunk 6.3a `recordMutation` widening pattern precedent. withInvariants signature: `withInvariants(serviceFn): (input, ctx: ServiceContext | SystemActorServiceContext) => ...`. Pair-tight with Sub-Q11 lock (amendment lands at ADR-0007 §Tier 2 ratifying the structural union as the canonical service-layer contract shape).

### §2.6 Sub-Q12 — Item #D second amendment scope

**Option space (scope-input §7.2):** timeout-only (calibration value bump) vs framing-refinement (warm-state vs cold-state distinction) vs comprehensive (Stage 2 budget + per-stage breakdown + retry framing refinement).

**Substrate evidence:** ADR-0014 §12.1 Amendment 2026-05-20 (lines 999-1013) already addressed Stage 2 ~30s wall-clock budget + 10s per-request timeout. Session 42 §2.2 N=11 calibration gap: warm-state PaddleOCR inference exceeds 10s consistently (payment_confirmation succeeded at 16.5s warm OCR within 30s budget; vendor_invoice + receipt exceeded 10s × 3 retries → transient_exhausted ceiling).

**Walk:**

- **Timeout-only (raise 10_000 → 60_000)** is minimal and addresses the empirical gap directly. Demo re-fire at Layer 1.B item #9 validates the calibration.
- **Framing-refinement (warm-state vs cold-state distinction)** adds nuance but increases amendment complexity. Empirical evidence at Session 42 doesn't justify the framing refinement — the warm-state demo evidence (16.5s for payment_confirmation) fits within a single 60s per-request budget; per-state distinction is over-engineered for v1.
- **Comprehensive (full Stage 2 budget rework)** is over-engineered for a calibration fix. Stage 2 budget framing per 2026-05-20 Amendment holds (~30s wall-clock budget); only the per-request timeout calibration is the empirical gap.

**Disposition:** **Lock at timeout-only.** Phase 8 Layer 2 item #D ships ADR-0014 §12.1 second amendment that raises `PER_REQUEST_TIMEOUT_MS` from `10_000` to `60_000`. Tight-bundle with Layer 1 item #8 substrate (`apps/web/src/agent/orchestrator/extraction/sidecar/client.ts:25` calibration update) per §6 framing #1 first-chunk. Framing-refinement reserved for post-Phase-8 calibration cycle if N=12+ surfaces.

### §2.7 Sub-Q8 — Timeout calibration value

**Option space (scope-input §7.1):** 60_000 default vs warm-state-PaddleOCR-inference-fit value (empirically determined).

**Substrate evidence:** Session 42 §2.2 demo evidence — payment_confirmation succeeded at 16.5s warm OCR (within 30s Stage 2 budget; 10s per-request timeout × 3 retries failed before that path closed); vendor_invoice + receipt exceeded 10s × 3 retries (transient_exhausted ceiling). Iteration 2 (γ-1) Session 42 default = 60_000.

**Walk:** 60_000 (60s) is generous — exceeds Session 42 evidence (16.5s warm OCR). Empirically-determined warm-state-fit value would require additional warm-state demo runs to characterize (Session 42 only has 1-of-3 success; additional warm-state evidence at vendor_invoice + receipt requires the fix to ship before evidence accumulates). 60_000 default is the pragmatic pick given uncertainty bounds.

**Disposition:** **Lock at 60_000.** Phase 8 Layer 2 item #D + Layer 1 item #8 substrate ships with `PER_REQUEST_TIMEOUT_MS = 60_000`. Re-calibrate at Phase 8 demo re-fire (Layer 1.B item #9) if empirical evidence surfaces materially different warm-state OCR timing (>60s at vendor_invoice or receipt; or <30s at all three doc types suggesting tighter calibration warranted).

### §2.8 Sub-Q2 — ProposalJustificationSchema shape

**Option space (scope-input §7.1):** pipeline_trace extension vs parallel field vs new ADR Q-number.

**Substrate evidence:** Pair-tight with Sub-Q10 (Q30 extension shape). Sub-Q10 disposition = parallel field (`bundle_audit_trace: BundleAuditRecord[]`).

**Walk:** ProposalJustificationSchema inherits Sub-Q10 disposition. Phase 7 chunk 7.3b shipped permissive `justification: z.record(z.unknown()).optional()` per Iteration 2 Option (c') Finding E. Phase 8 formalization: ProposalJustificationSchema becomes a Zod object with two fields: `pipeline_trace: PipelineStageRecord[]` (per ADR-0007 Q30 canonical; per-stage) + `bundle_audit_trace: BundleAuditRecord[]` (new parallel field per Sub-Q10 lock; per-bundle).

**Disposition:** **Lock at parallel-field shape per Sub-Q10 inheritance.** ProposalJustificationSchema formalization: 

```typescript
const ProposalJustificationSchema = z.object({
  pipeline_trace: z.array(PipelineStageRecordSchema),
  bundle_audit_trace: z.array(BundleAuditRecordSchema).optional(),
});
```

BundleAuditRecordSchema fields deferred to Round 3 chunk-impl grade (likely: bundle_id + composition_at + child_proposal_ids[] + invariant_class).

### §2.9 Sub-Q3 — paymentService.record consumer count

**Option space (scope-input §7.1):** single consumer (post-v1 reconciliation orchestrator) vs multiple (cross-service orchestrator chunk + N+ consumers).

**Substrate evidence:** Phase 8 §6 framing #3 (cross-service orchestrators) lists paymentService.record() v1 consumers. Additional v1 consumer candidates: Logic Receipt consumer (Framing #5) if Logic Receipt fires per-mutation including paymentService.record; ledger extensions (Framing #4) if Tier 2.5 Router activates ledger-mutation surface. Without Round 3 §6 framing prioritization (Sub-Q16 deferred to Round 4), consumer count is uncertain.

**Walk:** Single consumer (post-v1 reconciliation orchestrator) is the minimum v1 scope. Multi-consumer expansion depends on Sub-Q16 §6 framing prioritization (Round 4) — which framings actually ship at Phase 8 v1. Conservative lock at single consumer + reservation for multi-consumer expansion if Sub-Q16 surfaces additional ship-candidate framings.

**Disposition:** **Partial-lock at Round 2: single consumer at Phase 8 v1 minimum scope (post-v1 reconciliation orchestrator per Framing #2).** Multi-consumer expansion adjudication deferred to Round 4 (gated by Sub-Q16 §6 framing prioritization). Sub-Q3 Round 4 secondary axis: if Sub-Q16 ships additional framings consuming paymentService.record, multi-consumer chunk decomposition adjudicates at Round 4.

### §2.10 Sub-Q7 — fixture-mocked harness boundaries

**Option space (scope-input §7.1):** deploy validation only (N=10 surfaces) vs deploy validation + runtime invocation mocking.

**Substrate evidence:** Session 42 §2.1 substrate-staleness sub-cluster N=1-10 surfaces (Modal CLI rename + FastAPI SDK rename + Pydantic 2 strict mode + transitive deps + requirements.txt upper-bounds + image config + secret naming + 3 more). testing.md Candidate #8 (lines 62-124) test-location canonical path discipline at N=5 cross-validation. Sub-Q7 fixture-mocked harness convention extension would extend testing.md with deployment-substrate validation pattern.

**Walk:** Deploy validation only addresses the Session 42 N=1-10 gaps directly — fixture-mocked equivalents exercise deploy substrate without requiring real Modal (catches Modal CLI rename + FastAPI SDK rename + Pydantic 2 strict mode + transitive deps at chunk-ship grade rather than first-deploy grade). Runtime invocation mocking is a different concern (mocking Modal HTTP response) — addressed by per-chunk test infra (Sub-Q24-equivalent at chunk-impl grade per testing.md Candidate #8 N=5 precedent). The two concerns are separable.

**Disposition:** **Lock at deploy validation only at Round 2.** Phase 8 Framing #8 (sidecar deployment validation harness) chunk scope = deploy-substrate validation only (fixture-mocked Modal CLI invocation + FastAPI SDK invocation + Pydantic 2 schema validation + transitive deps resolution). Runtime invocation mocking deferred to per-chunk test infra (Modal HTTP response mocks ship at consumer chunks per testing.md Candidate #8 incremental pattern). Convention codification at testing.md extension grade deferred to Phase 8 retrospective Commit B per Layer 3 §5.1.1 schema-translation-discipline-gap codification candidate.

---

## §3 — Round 2 dispositions banked

| Sub-Q | Disposition | Lock detail |
|---|---|---|
| Sub-Q9 | **Lock at Round 2** | substrate-grade-first per Phase 7 chunk 7.2 precedent; ADR amendment follows at consumer-ADR location per Sub-Q21 |
| Sub-Q21 | **Lock at Round 2** | 21.δ consumer-ADR naming at ADR-0014 §X (specific §-target deferred to chunk-impl substrate-amendment-pairing); 21.α + 21.β + 21.γ ruled out at evidence basis |
| Sub-Q10 | **Lock at Round 2** | parallel field (`bundle_audit_trace: BundleAuditRecord[]`); preserves per-stage pipeline_trace contract; BundleAuditRecord shape deferred to Round 3 chunk-impl grade |
| Sub-Q11 | **Lock at Round 2** | ADR-0007 §Tier 2 safety contract amendment canonical (ADR-0011 §1 alternative rejected; spine-items framing structurally weak for service-layer contract enumeration) |
| Sub-Q5 | **Lock at Round 2** | structural union (`ServiceContext \| SystemActorServiceContext`) per service-layer.md Candidate #11 explicit forward-pointer + chunk 6.3a `recordMutation` precedent |
| Sub-Q12 | **Lock at Round 2** | timeout-only amendment scope (10_000 → 60_000); framing-refinement + comprehensive rejected at evidence basis |
| Sub-Q8 | **Lock at Round 2** | 60_000 (60s) per-request timeout value; recalibrate at Phase 8 demo re-fire if empirical evidence surfaces materially different warm-state OCR timing |
| Sub-Q2 | **Lock at Round 2** | parallel-field shape per Sub-Q10 inheritance (ProposalJustificationSchema = pipeline_trace + bundle_audit_trace) |
| Sub-Q3 | **Partial-lock at Round 2 + Round 4 deferral** | single consumer at Phase 8 v1 minimum scope (post-v1 reconciliation orchestrator); multi-consumer expansion gated by Sub-Q16 framing prioritization (Round 4) |
| Sub-Q7 | **Lock at Round 2** | deploy validation only; runtime invocation mocking deferred to per-chunk test infra per testing.md Candidate #8 incremental pattern |

**Count:** **9 clean locks** at Round 2 + **1 partial-lock with Round 4 deferral** (Sub-Q3 multi-consumer expansion gated by Sub-Q16). **0 founder-decision-required dispositions** at Round 2 (vs Phase 7 Round 2's 1 Sub-Q5 founder-decision; Phase 8 Round 2 is structurally cleaner — all substrate evidence walks resolve at brainstorming-side without operational-budget founder calls). **0 net-new sub-questions surfaced** at Round 2 (vs Phase 7 Round 2's Sub-Q27 surface from Sub-Q26 contingency).

**Phase 7 Round 2 vs Phase 8 Round 2 disposition rate comparison:** Phase 7 = 5 clean locks + 4 partial locks + 1 founder-decision + 1 net-new = 5/10 = 50% clean lock rate. Phase 8 = 9 clean locks + 1 partial-lock = 9/10 = 90% clean lock rate. **Directional improvement at Round 2 disposition clarity** — Phase 8 Round 2's batch is substantively more locked than Phase 7 Round 2's. Possible factors: (a) Layer 2 amendment dependency graph is well-structured per scope-input §4 enumeration; (b) Sub-Q1 LOCKED at Round 1 + Sub-Q21 net-new at Round 1 absorbed the substrate verification burden upstream; (c) service-layer.md Candidate #11 + Phase 7 chunk 7.2 precedents provide direct analogous-shape evidence for Sub-Q5 + Sub-Q21 + Sub-Q9.

---

## §4 — Decision-class split disposition update

Per Round 1 §4 decision-class split (13 governance-critical + 7 mixed + 1 product-discovery + 1 LOCKED = 21 sub-questions). Round 2 walks 10 sub-questions (8 governance-critical from Round 1 §4 batch + 2 mixed: Sub-Q3 + Sub-Q8); updated disposition state:

**Governance-critical sub-questions converted from "pending Round 2" status:**

- Sub-Q9 → **locked at Round 2** (substrate-grade-first; ADR amendment deferred to consumer-ADR location)
- Sub-Q21 → **locked at Round 2** (21.δ consumer-ADR naming at ADR-0014 §X; specific §-target deferred to chunk-impl grade)
- Sub-Q10 → **locked at Round 2** (parallel field shape)
- Sub-Q11 → **locked at Round 2** (ADR-0007 §Tier 2 canonical)
- Sub-Q5 → **locked at Round 2** (structural union)
- Sub-Q12 → **locked at Round 2** (timeout-only amendment scope)
- Sub-Q7 → **locked at Round 2** (deploy validation only)
- Sub-Q2 → **locked at Round 2** (parallel-field shape per Sub-Q10 inheritance)

**Mixed sub-questions converted:**

- Sub-Q3 → **partial-locked at Round 2 (single consumer minimum) + Round 4 deferral (multi-consumer gated by Sub-Q16)**
- Sub-Q8 → **locked at Round 2** (60_000 value; recalibrate at demo re-fire if empirical evidence surfaces)

**Governance-critical sub-questions still pending Round 3+:** (no change from Round 1)

- Sub-Q13 (framing #1 bundle composition) — Round 3
- Sub-Q14 (framing #4 ledger extensions chunk-decomp) — Round 3
- Sub-Q17 (Path C invocation at framings #4 + #6) — Round 3
- Sub-Q16 (framing prioritization) — Round 4
- Sub-Q20 (cycle posture sequencing) — Round 4

**Mixed sub-questions still pending Round 3+:** (no change from Round 1)

- Sub-Q4 (component test fixture scope) — Round 3
- Sub-Q6 (e2e assertion body shape) — Round 3
- Sub-Q14 (framing #4 chunk-decomp) — Round 3
- Sub-Q15 (framing #6 UI infra split) — Round 3
- Sub-Q18 (test infrastructure shape) — Round 3

**Product-discovery sub-question still pending Round 3+:**

- Sub-Q19 (observability surface) — Round 4

**Updated count:** 13+1 governance-critical (Sub-Q1 LOCKED at Round 1 + 9 LOCKED at Round 2 + 4 pending Round 3-4 = 13+1 - all governance-critical sub-questions either locked or routed) + 7 mixed (2 locked at Round 2 + 5 pending Round 3+) + 1 product-discovery + 0 net-new = 21 sub-questions at Round 2 close. **No Sub-Q22+ surfacing at Round 2** (substrate evidence didn't materialize net-new sub-questions; Sub-Q21 21.δ resolution closed the Round 1 net-new surface cleanly).

---

## §5 — Round 3+ scope

### §5.1 Round 3 scope

Round 3 walks the remaining governance-critical Round 3-deferred sub-questions + mixed-class sub-questions per Round 1 §5.2 forecast (no Sub-Q22+ from Round 2 surfacing):

**§6 scope framings adjudication (Round 3):**

- Sub-Q13 (framing #1 bundle composition; v1 close demo completion chunk shape)
- Sub-Q14 (framing #4 ledger extensions chunk-decomp; ADR-0018 Subsystem 1 activation)
- Sub-Q15 (framing #6 UI infra vs e2e assertion split; combined-grade ~850-1520 LOC)
- Sub-Q17 (Path C invocation at framings #4 + #6 per multi-axis discipline)

**Cross-cutting Round 3 sub-questions:**

- Sub-Q4 (component test fixture scope)
- Sub-Q6 (e2e assertion body shape)
- Sub-Q18 (test infrastructure shape)

**Round 3 forecast batch:** 7 sub-questions per Round 1 §5.2. No Sub-Q22+ added at Round 2 close (substrate evidence walked cleanly).

### §5.2 Round 4 scope

Per Round 1 §5.2: final lock per Phase 5.1/Phase 7 Round 4 precedent. Adds Sub-Q3 Round 4 secondary axis (multi-consumer expansion gated by Sub-Q16) per Round 2 partial-lock disposition:

- Sub-Q3.b (paymentService.record multi-consumer expansion; gated by Sub-Q16)
- Sub-Q16 (framing prioritization at scope-lock close)
- Sub-Q19 (observability surface)
- Sub-Q20 (cycle posture sequencing)

**Round 4 forecast batch:** 3 sub-questions + Sub-Q3.b secondary axis = 4 sub-questions at Round 4 scope.

### §5.3 Updated round count forecast

Round 1 forecast: 4-6 rounds. Round 2 close updates: 4-6 rounds remains valid; Round 2's clean disposition rate (90% vs Phase 7 Round 2's 50%) suggests Round 3 + Round 4 sufficient for cycle close (Round 5 not needed unless Round 3-4 surface unforeseen substrate divergences). Estimated 4 rounds total at well-calibrated middle of forecast.

### §5.4 Brief drafting plan placeholder

Per Round 1 §5.3 inheritance: brief drafting fires after scope-lock cycle close. Per-chunk briefs (4-8 chunks per §6 8-framing enumeration depending on Sub-Q16 prioritization + Sub-Q14 + Sub-Q15 chunk-decomp outcomes). Path C invocation candidates at framings #4 + #6 per scope-input §6.9 forecast posture may split chunks into Path-C-sub-chunks (multi-chunk grade per Sub-Q14 + Sub-Q15 + Sub-Q17 Round 3 dispositions).

---

## §6 — Round 2 close

### §6.1 Round 2 dispositions banked summary

- **9 clean locks** at Round 2 (Sub-Q9 + Sub-Q21 + Sub-Q10 + Sub-Q11 + Sub-Q5 + Sub-Q12 + Sub-Q7 + Sub-Q2 + Sub-Q8).
- **1 partial-lock** with Round 4 deferral on secondary axis (Sub-Q3 multi-consumer expansion gated by Sub-Q16).
- **0 founder-decision-required dispositions** (vs Phase 7 Round 2's 1 Sub-Q5 founder-decision).
- **0 net-new sub-questions surfaced** (Sub-Q21 21.δ resolution closed Round 1 net-new surface cleanly).
- **Layer 2 4-amendment dependency graph adjudicated**: all 4 amendments locked at Round 2 (item #A substrate-grade-first + item #B parallel field at Q30 + item #C ADR-0007 §Tier 2 location + item #D timeout-only scope).
- **Phase 7 retrospective §6.1 item #A framing correction formally landed**: actual amendment location is ADR-0014 §X (consumer-ADR), NOT ADR-0011 §13 (which enumerates resolution_action, separate enum).
- **Substrate-density-compresses-LOC observation:** Round 2 LOC TBD at session close; N=4 → N=5 banking candidate (scope-input + Round 1 + Round 2 three-grain consistency across Phase 7 + Phase 8).

### §6.2 Round 3 prompt inputs

Round 3 directive inputs from this Round 2 close:

**Round 3 sub-question batch (7 sub-questions):**

- §6 scope framings adjudication: Sub-Q13 + Sub-Q14 + Sub-Q15 + Sub-Q17 (4 sub-questions).
- Cross-cutting: Sub-Q4 + Sub-Q6 + Sub-Q18 (3 sub-questions).

**Substrate citation corrections inherited:**

- Sub-Q1 LOCKED: orchestrator placement = exception_reason enum target (Round 1 §3.1).
- Sub-Q21 LOCKED: 21.δ consumer-ADR naming at ADR-0014 §X (this Round §2.2).
- Sub-Q10 LOCKED: parallel-field shape (`bundle_audit_trace: BundleAuditRecord[]`); BundleAuditRecord shape Round 3 chunk-impl grade.
- Sub-Q11 LOCKED: ADR-0007 §Tier 2 amendment location.
- Sub-Q5 LOCKED: structural union widening.
- Sub-Q12 LOCKED: timeout-only amendment scope.
- Sub-Q8 LOCKED: 60_000 value with demo re-fire recalibration caveat.
- Sub-Q9 LOCKED: substrate-grade-first fire order.
- Sub-Q7 LOCKED: deploy validation only scope.

**Round 2 locks inherited (substrate constraints for Round 3 walks):**

- Layer 2 4-amendment dependency graph: all locked (item #A substrate-grade-first + item #B parallel field + item #C ADR-0007 §Tier 2 + item #D timeout-only).
- ProposalJustificationSchema: parallel-field shape per Sub-Q2 + Sub-Q10 pair.
- withInvariants signature: structural union (`ServiceContext | SystemActorServiceContext`).
- paymentService.record v1 consumer count: single (post-v1 reconciliation orchestrator); multi-expansion Round 4.
- Fixture-mocked harness: deploy validation only.

### §6.3 Carry-forward observations

- **Candidate (c) catalog state at Session 45 close:** sp-auth sub-grain N=0 maintained at directive (single-execute Round 2 walk per directive scope; no sub-prompt authoring fired). Push-state-claim sub-shape N=4 maintained (16-session avoidance trajectory at Sessions 23-45; codification at `b7ec879` empirically validated). Brief-drafting metafact-assertion grain N=4 maintained at Round 2.
- **Phase 7 retrospective §6.1 item #A framing correction formally landed at Round 2 §2.2 disposition.** Phase 7 retrospective §6.1 item #A's "ADR-0011 §13 enumeration broaden" framing was incorrect — actual amendment location is ADR-0014 §X (consumer-ADR per Phase 7 chunk 7.2 precedent). The correction propagated through Round 1 §1.1 (b) absorption (Session 44) → Round 2 §2.2 disposition (Session 45). **Upstream substrate citation correction at Round 2 grade** — Phase 7 retrospective surface required Phase 8 Round 1 + Round 2 substrate-grade verification to fully surface and resolve the citation drift. Codification candidate at Phase 8 retrospective Commit A: Phase 7 retrospective §6.1 item #A framing correction (paired with Layer 2 item #A substrate-amendment-pairing chunk-impl ratification).
- **Refinement #3 fallback discipline N=1 → N=2 firing at Round 2 grade.** Iteration 1 preliminary §-structure lean (separate §2 VFD pass + separate §4 ADR ratification sequencing) recalibrated at Phase B authoring to Phase 7 Round 2 inheritance (§1 5-subsections including walk-order coupling + §2 per-sub-Q walk + §3 dispositions banked table + §4 decision-class split + §5 + §6). Second-fire of refinement #3 fallback discipline; codification graduation candidate at N=2 strengthens (Session 44 N=1 first-fire + Session 45 N=2 confirming fire). Phase 8 retrospective codification candidate.
- **F-J-14 Grain 0 two-stage banking N=1 → N=2 firing at both stages.** Stage 1 (directive composition grade at Iteration 1 dispatch): single-session-bound forecast. Stage 2 (Phase A close grade at this Round 2 execution): single-session-bound HOLDS per 14 reads + clean walk-order coupling + 9 clean locks + 0 net-new sub-questions surfaced. **Two-stage banking pattern stabilizes at N=2** (Session 44 + Session 45 both fired clean at both stages). Phase 8 retrospective codification candidate strengthens at N=2.
- **Directive-authoring multi-iteration refinement N=15 → N=16 firing at 1-iteration-cycle sub-grade (NEW Session 45).** Session 45 dispatched at Iteration 1 (skipped Iteration 2/3 refinement cycle). The 3-iteration cycle codified at plan-authoring.md Candidate #1 is the canonical pattern; 1-iteration-cycle dispatch is a sub-grade variant. **N=1 first-instance banking surface candidate at brainstorming-side session-state:** directive-authoring 1-iteration-cycle dispatch sub-grade (operationally: Iteration 1 lands clean enough that no refinement observations surface; founder dispatches directly). Promotion threshold N=3 if pattern recurs at future directive grades. Codification routing if graduated: plan-authoring.md Candidate #1 sub-grade extension (1-iteration-cycle vs 3-iteration-cycle as distinct sub-shapes).
- **Round 2 disposition rate at 90% clean lock** vs Phase 7 Round 2's 50% clean lock rate. **Directional improvement at Round 2 disposition clarity** — Phase 8 Round 2 is substantively more locked than Phase 7 Round 2. Cross-phase pattern banking candidate at Phase 8 retrospective: cross-phase Round 2 disposition-rate-improvement at scope-lock-cycle-round grade (sibling-to Session 43 + 44 cross-phase anti-drift absorption-rate-reduction at scope-input + Round 1 grades). N=1 first-instance banking continues at brainstorming-side. Promotion threshold N=2 at Phase 9+ Round 2 grade if substantively-new-phase cycle scope-lock fires.
- **Coordination warning cross-session N=2 → N=3 promotion threshold pending at Session 45 commit time.** If "no session lock in use" surfaces at commit, codification graduation candidate fires (sub-pattern banking surface candidate per Session 43 + 44 + 45 trajectory).
- **Local commits ahead of `origin/staging` post-session:** expected 3 (scope-input artifact at `9b6694b` + Round 1 artifact at `a158c9b` + this Round 2 artifact). No push; banks for Phase 8 terminal-close push per push-terminal-close N=4 cumulative pattern (N=5 fires at Phase 8 close).

---

**Round 2 status:** complete. Single-prompt execute-and-close per Iteration 1 dispatched directive (1-iteration-cycle sub-grade firing N=1 first-instance banking). 9 clean locks + 1 partial-lock + 0 founder-decision + 0 net-new + Layer 2 4-amendment dependency graph fully adjudicated. Next operational fire: **Session 46 Phase 8 scope-lock cycle Round 3** per §6.2 prompt inputs (7-sub-question §6 scope framings + cross-cutting batch).
