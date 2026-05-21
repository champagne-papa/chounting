# Phase 8 Post-v1 Reconciliation + Cross-Service Orchestrators + Ledger Extensions — Scope-Lock Cycle Round 1

**Session:** 44
**Date:** 2026-05-21
**Branch:** `staging`
**Local HEAD at session-onset:** `9b6694b` (Phase 8 scope-input artifact)
**`origin/staging` HEAD:** `96eae39` (1 commit behind local; Session 42 Phase 7 substrate close)
**Validation gates at session-onset:** `pnpm agent:validate` 26/26 green.
**Predecessor:** Phase 8 onset scope-input artifact at `9b6694b` (`docs/09_briefs/phase-8/2026-05-21-phase-8-scope-input.md`; 1432 LOC).

---

## §1 — Preamble + cross-references

### §1.0 What this cycle is

This is **Round 1** of the Phase 8 post-v1 reconciliation + cross-service orchestrators + ledger extensions scope-lock cycle. Phase 8 ships per Phase 7 retrospective §6.2 forward-pointer (with §1.2 (β) paraphrase-vs-direct-quote caveat: the framing is retrospective-side synthesis, not direct ADR-0011 §1 quote):

1. **v1 close demo completion sub-chunk** — items #7+#8+#9 from scope-input §3.7/§3.8/§3.B bundle (sidecar deployment validation harness + ADR-0014 §12.1 second amendment + demo re-fire at 3-of-3 success grade).
2. **Post-v1 reconciliation orchestrator** — Stage 7 Bundle partial-commit reconciliation surface activation (Layer 1 item #1 + Layer 2 item #A pair).
3. **Cross-service orchestrators** — paymentService.record() v1 consumers + Layer 1 item #3 (payment.record ActionName + role_permissions migration).
4. **Ledger extensions** — ADR-0018 Subsystem 1 (Ledger-State Candidate Completion) activation surface at lines 276-505.
5. **Logic Receipt consumer + UI test infrastructure + system_actor widening + sidecar deployment validation harness** — paired Layer 1/2 surfaces per scope-input §6.

Phase 8 is the **substantively-new-phase cycle shape** (NOT amendment cycle); inherits 3-layer accumulated substrate from Phases 0-7 (8 substrate-grade items + 4 ADR amendments + 15 codification candidates + 8 preliminary scope framings + 20-sub-question catalog).

**Precedent shape:** Phase 7 (Session 28 Round 1; 25-sub-question + VFD-6 single-session-bound at 310 LOC) is the substantively-new-phase cycle scope-lock Round 1 precedent. Phase 8 Round 1 sits **structurally lighter at sub-question grade** (20 vs Phase 7's 26) but **heavier at inheritance grade** (3-layer enumeration vs Phase 7's single-table). This Round 1 mirrors Phase 7 Round 1 §-structure (6 sections: §1-§6).

### §1.1 Session-onset divergence absorption

**Three divergences from Session 44 Iteration 2 directive's preconditions surfaced at Phase A verify-from-disk.** All absorbed at §1.1 rather than re-fired as Iteration 3 re-prompt; each surfaces a substrate path or shape correction. Bank as **candidate (c) instances at directive-authoring grade** per Phase 5.1 retrospective Observation #19 parent consolidation framing + Phase 7 Round 1 §1.1 5-divergence precedent.

**Divergence (a) — §-structure inheritance recalibration.** Iteration 2 preliminary §-structure lean (8 sections: §1 + §1.2 + §2 + §3 + §4 + §5 + §6 + §7 + §8) diverges from actual Phase 7 Round 1 §-structure verified at Phase A step 3 (6 sections: §1 Preamble with §1.0-§1.4 + §2 VFD pass + §3 Sub-Q walk + §4 Decision-class split + §5 Round 2+ scope + §6 Round 1 close). **Refinement #3 fallback fires per Iteration 2 §Phase B framing**: Phase B authoring recalibrates to inherited 6-section shape. The Iteration 2 preliminary lean served its orientation purpose (Phase A step 3 read recognized divergence quickly); the directive-grade self-correction anti-drift sub-pattern (N=1 first-instance per Iteration 2 Finding D banking) operated as designed. **N=1 first-fire of refinement #3 fallback discipline.**

**Divergence (b) — Sub-Q1 ENUM-target Phase 7 retrospective framing.** Phase 7 retrospective §6.1 item #A frames the ENUM extension as "ADR-0010 admit + **ADR-0011 §13 enumeration broaden**." Direct Phase A reads (ADR-0011 §13 lines 751-790 + §10 lines 651-657 + ExceptionReasonSchema lines 60-69 + migration 20240148000000 lines 174-190 + migration 20240157000000) show: ADR-0011 §13 explicitly enumerates `resolution_action` enum (18 values; 9 v1-active + 9 reserved); `exception_reason` enum is a separate type owned by chunk-6 substrate per migration 20240148000000 lines 174-190 + named at ADR-0011 §10 line 651-657 ("the `exception_reason` enum is separate from the `resolution_action` enum that §13 owns"). `bundle_partial_commit_reconciliation_pending` is contextually a queue-side value (Stage 7 Bundle partial-commit reconciliation routes a case to the exception queue when bundle commit fails partially), analogous to `wrong_entity_exception` per ADR-0011 §10 precedent. **VFD-1 resolution: target enum = `exception_reason` (NOT `resolution_action`).** Phase 7 retrospective §6.1 item #A "§13 enumeration broaden" framing requires clarification; the actual amendment lands at ADR-0011 §13 commentary (exception_reason naming) + migration ALTER TYPE ADD VALUE (analogous to migration 20240157000000 precedent for `ai_fallback_validation_failed`).

**Divergence (c) — Round 1 LOC forecast recalibration.** Iteration 2 directive forecast ~600-1200 LOC at Round 1 artifact grade. Phase A step 3 read shows Phase 7 Round 1 = 310 LOC (substantially below Iteration 2 forecast lower bound). Substrate-density-compresses-LOC observation continues at Round 1 grade (per §1.3 below). Phase 8 Round 1 LOC forecast recalibrates DOWN to ~400-600 LOC (Phase 7 anchor + Phase 8 heavier inheritance load: 3-layer + 8 framings + ADR ratification sequencing). **Sub-curve (b) substrate-fix-narrowness extension to Round-1-artifact-authoring grade N=3 banking** (scope-input artifact 599 LOC + Phase 7 Round 1 310 LOC + this Round 1 artifact LOC TBD).

**Aggregate observation.** 3 divergences across 14 Phase A reads = ~21% rate. Phase 7 Round 1 fired 5 divergences across 16 VFDs = ~31% rate. **Directional reduction at materially heavier accumulated inheritance** (3-layer Phase 8 vs single-table Phase 7) — inverse-of-concern outcome; cross-phase anti-drift absorption-rate-reduction at scope-lock-cycle-round grade **N=1 first-instance banking** (sibling to scope-input-grade N=1 banked at Session 43; promotion threshold N=2 at Phase 9+ Round 1 grade if substantively-new-phase cycle scope-lock cycle Round 1 fires).

Partial caveat: Phase 8 Round 1's lower absorption count is partly because the Session 43 scope-input artifact was already verify-from-disk grounded at Session 43 Phase A (3 §1.2 absorptions absorbed at scope-input write-grade). Phase 7 Round 1 inherited Session 27 scope-input which had less systematic anti-drift discipline maturity. **Compounding discipline strengthening** — both rate reduction at this Round 1 AND upstream-absorption-at-prior-grade contribute.

### §1.2 Push state baseline

HEAD = `9b6694b`; `origin/staging` = `96eae39`; 1 commit ahead of `origin/staging` at session-onset (the Phase 8 scope-input artifact). Phase 8 scope-lock cycle + chunk briefs + impl + retrospective ceremony banks for terminal-close push at Phase 8 close per Push-terminal-close N=4 cumulative cross-phase pattern at CLAUDE.md Candidate #13 codification (Phase 5.1 + 6.5 + Phase 7-retro + Phase 7-substrate-fix at Session 42 close = N=4; Phase 8 close fires N=5).

### §1.3 Substrate-density-compresses-LOC observation continuation

Session 27 close report observation (carried at Phase 7 Round 1 §1.3): "scope-input artifact 599 LOC slightly below ~700-1100 forecast band lower bound; substrate inheritance largely codified at upstream retrospectives so per-phase consumer table compresses to a list; ADR-0014 authoritative for Phase 7 scope so locked-at-onset cuts compress to §-references rather than re-derived prose." Phase 7 Round 1 applied same compression at downstream grade. Phase 8 scope-input 1432 LOC lands at upper portion of recalibrated 1100-1800 band per Iteration 2 founder observation #3 — directionally heavier per accumulated 3-layer inheritance enumeration (different sub-curve than Phase 7 chunk-brief LOC).

**N=3 observation banking at Round-1-artifact-authoring grade** (scope-input + Phase 7 Round 1 + this Round 1 three-grain consistency). Phase 8 retrospective codification candidate at exploratory framing per `plan-authoring.md` Volume-forecast convention four-curve calibration sub-curve extension precedent (Phase 5.1 retrospective).

### §1.4 Canonical cross-references

- **Phase 8 onset scope-input artifact** at `docs/09_briefs/phase-8/2026-05-21-phase-8-scope-input.md` (`9b6694b`) — authoritative for sub-question option space + §6 preliminary scope framings + Layer 1/2/3 inheritance enumeration.
- **Phase 7 Round 1 structural template** at `docs/09_briefs/phase-7/2026-05-19-phase-7-scope-lock-cycle-round-1.md` (310 LOC; Session 28) — §-structure template inheritance.
- **Phase 7 retrospective** at `docs/07_governance/retrospectives/phase-7-retrospective.md` (660 LOC; Session 41) — §5.1 5-item substrate-grade inventory + §6.1 3-item ADR amendment forward-pointer + §6.3 5-item future-cycle-watch.
- **Session 42 substrate close report** at `docs/09_briefs/phase-7/2026-05-20-phase-7-v1-close-demo-close-report.md` (~327 LOC; Session 42) — §6 8-item Phase 8 inheritance inventory + §6.3 demo gate item #9 + §8 Phase 7 → Phase 8 transition declaration.
- **ADR-0007** (Three-Tier Agent Architecture) — Q30 Logic Receipt lines 482-489 + §Tier 2 safety contract lines 208-235; Phase 8 Layer 2 items #B + #C amendment locations.
- **ADR-0010** (Reserved Enum States) — admit discipline three-layer Phase 1 defense lines 73-131; Phase 8 Layer 2 item #A reserved-value admission framework.
- **ADR-0011** (Document Platform) — §1 spine sequencing lines 116-117 (paraphrase-vs-direct-quote per §1.2 (β)); §10 multi-entity reservations lines 651-657 (exception_reason cross-reference); §13 resolution_action enum lines 751-790; Phase 8 Layer 2 item #A commentary landing.
- **ADR-0014** (Tier 2 Document Pipeline) — §12.1 transient retryable lines 980-1013; Amendment 2026-05-20 at line 1009; Phase 8 Layer 2 item #D second amendment landing.
- **ADR-0018** (Relationship Router) — Subsystem 1 Ledger-State Candidate Completion lines 276-505; Phase 8 §6 framing #4 (ledger extensions) activation surface per §1.2 (γ-2) absorption correction.
- **ADR-0019** (Confidence Calibration Policy) — consumer-only at Phase 8; no amendment expected.
- **`scope-lock.md`** at `docs/04_engineering/conventions/session/scope-lock.md` lines 582-729 — Candidates #3 + #4 + #5 (anti-drift prospective-firing N=49+ codification); Phase 8 inheritance.
- **`plan-authoring.md`** at `docs/04_engineering/conventions/session/plan-authoring.md` lines 798-1090 — Candidate #1 multi-iteration refinement codification (N=15 cumulative at Session 44 Iteration 3 dispatch); Phase 8 inheritance.
- **`service-layer.md`** at `docs/04_engineering/conventions/service-layer.md` lines 335-466 — Candidate #11 substrate-shim framing + Phase 8 forward-pointer (Layer 1 item #5 + Layer 2 item #C source).
- **`CLAUDE.md`** §Push readiness three-condition gate lines 129-197 + Push-terminal-close timing pattern lines 169-196 (Candidate #13; N=5 fires at Phase 8 retrospective close).

---

## §2 — Verify-from-disk pass against named substrates

Round 1 walks 7 Phase A read targets at **Grain 1 substrate-shape** + **Grain 5 existing-consumer-contract** grain. Phase 8 Round 1 deviates from Phase 7 Round 1's 16-VFD pre-allocation (scope-input artifact §6) — Phase 8 scope-input does NOT have a §6 VFD pre-allocation section (Phase 8 §6 is preliminary scope framings, not VFD targets per §-structure shift). Phase A reads at directive grade serve the VFD function for Round 1.

### §2.1 — VFD-1: Sub-Q1 ENUM-target resolution (LOAD-BEARING)

**Substrate sources read:**
- ADR-0011 §10 lines 651-657 + §13 lines 751-790.
- `apps/web/src/shared/schemas/document-platform/exceptionQueueEntry.schema.ts` lines 60-69 (ExceptionReasonSchema; 7 v1-active values).
- `supabase/migrations/20240148000000_exception_queue_substrate.sql` lines 174-190 (exception_reason ENUM CREATE TYPE; 8 values total).
- `supabase/migrations/20240157000000_phase_7_exception_reason_ai_fallback.sql` (Phase 7 chunk 7.2 ALTER TYPE ADD VALUE precedent for `ai_fallback_validation_failed`).

**Finding (verbatim from direct reads):**

ADR-0011 §10 line 651-657: "The platform also reserves the `wrong_entity_exception` value in the `exception_reason` enum (chunk-6 substrate, owned by the document-platform exception queue per ADR-0011 §13; **the `exception_reason` enum is separate from the `resolution_action` enum that §13 owns**)."

Migration 20240148000000 lines 174-190 defines `exception_reason` ENUM with 8 values (6 v1-active + 2 reserved: wrong_entity_exception + drift_detected). Migration 20240157000000 adds `ai_fallback_validation_failed` via `ALTER TYPE exception_reason ADD VALUE IF NOT EXISTS` (Phase 7 chunk 7.2 precedent).

**Resolution.** `bundle_partial_commit_reconciliation_pending` is structurally an `exception_reason` enum member (queue-side; analogous to `wrong_entity_exception` per ADR-0011 §10 + chunk-6 migration substrate + Phase 7 chunk 7.2 ALTER TYPE precedent). Phase 7 retrospective §6.1 item #A "ADR-0011 §13 enumeration broaden" framing is incorrect — §13 enumerates `resolution_action`, not `exception_reason`. **Actual amendment landing: ADR-0011 §13 commentary expansion (the broader "§13 deliverable" framing where exception_reason is named at §10 cross-reference)** + migration ALTER TYPE ADD VALUE on exception_reason ENUM (analogous to 20240157000000 precedent).

**Resolution gates** §3.1 item #1 ENUM extension target (= exception_reason) + §4.A Layer 2 item #A ADR amendment location (= ADR-0011 §13 commentary expansion + ADR-0010 admit framework for reserved-vs-v1-active disposition).

**Sub-Q21 surfaced** at §3.5 (net-new sub-question): given Sub-Q1 resolution, the amendment location adjudication splits into multiple targets — pure §13 commentary expansion vs ADR-0010 admit-framework reserve vs both. Phase 7 Round 1 Sub-Q26 first-firing precedent applies.

### §2.2 — VFD-2: ADR substrate verify-from-disk (Layer 2 amendment locations)

**ADR-0007 Q30 (Logic Receipt) at lines 482-489.** `pipeline_trace: PipelineStageRecord[]` canonical definition; closed at Phase 0 2026-05-03; per-stage record carries `stage_name`, `input_hash`, `output_hash`, `model`, `timestamp`. Layer 2 item #B amendment extends pipeline_trace schema for new stage types (e.g., ledger-extension-validation stages at §6 framing #4 + bundle-level INV-AGENT-002 audit event composition at Layer 1 item #2 substrate). **No divergence; substrate ready for amendment.**

**ADR-0007 §Tier 2 safety contract at lines 208-235.** "Safety contract (inviolable). Preserved verbatim from the 2026-04-19 architecture proposal: 1. No direct writes. Tier 2 stages never call mutating services or insert into tables. All commits route through Tier 1." Layer 2 item #C amendment widens system_actor scope via structural union (`ServiceContext | SystemActorServiceContext`) per service-layer.md Candidate #11 substrate-shim forward-pointer. **No divergence; substrate ready for amendment.**

**ADR-0011 §1 spine sequencing at lines 116-117.** Verified per §1.2 (β) absorption: "The Decision is presented as a sequence of spine items, each of which is the contract that one or more downstream ADRs cite." The "post-v1 reconciliation + cross-service orchestrators + ledger extensions" Phase 7 retrospective §6.2 framing is paraphrase synthesis, not direct §1 quote. **Divergence absorbed at Session 43 scope-input §1.2 (β); preserved at Phase 8 Round 1 grade.**

**ADR-0014 §12.1 transient retryable at lines 980-1013.** Current v1 (lines 987-988): "max 3 attempts, base 500ms, exponential factor 2x, ±20% jitter, total budget ~3.5s wall-clock." Amendment 2026-05-20 (lines 999-1013): "Stage 2 (OCR) overrides the per-stage ~3.5s wall-clock budget to ~30s wall-clock per Modal cold-start substrate…per-request timeout (10s) is enforced at the sidecar client via AbortController." Layer 2 item #D second amendment raises `PER_REQUEST_TIMEOUT_MS` from `10_000` to `60_000` (or analogous warm-state-PaddleOCR-fit value per Session 42 §2.2 N=11 calibration gap). **No divergence; substrate ready for amendment.**

**ADR-0018 Subsystem 1 (Ledger-State Candidate Completion) at lines 276-505.** Reads committed accounting state + candidate generation + score composition. Phase 8 §6 framing #4 (ledger extensions) activation surface per §1.2 (γ-2) absorption correction (Phase 7 retrospective §6.3 mislabeled ADR-0014 §7 Reserved Tier B classifier as ledger extensions activation; actual surface = ADR-0018 Subsystem 1). **No divergence at Round 1; substrate ready for Round 2 ledger extension scope adjudication.**

### §2.3 — VFD-3: Convention substrate verify-from-disk (Sub-Q5 withInvariants widening)

**`service-layer.md` Candidate #11 substrate-shim framing at lines 335-466.** Codified at Phase 7 retrospective close (2026-05-20). Consumer-side synthetic ServiceContext discipline at orchestrator-driven service invocations; 5-field `synthCtxForCommit` shape per chunk 7.3b commit `ab0f7fe` Stage 7 + chunk 7.3a Stage 6 `synthCtxForRouter` precedent (N=2 cross-chunk evidence). **Substrate-shim explicit forward-pointer (lines 418-428):** "the canonical resolution is widening `withInvariants`'s accepted ctx shape to a structural union (`ServiceContext | SystemActorServiceContext`), parallel to the chunk 6.3a `recordMutation` widening pattern. Phase 8 ADR amendment at ADR-0007 §Tier 2 safety contract OR ADR-0011 §1 service-layer contract codifies the proper widening; this convention's consumer-side synthetic shape phases out post-amendment." **No divergence; substrate ready for Layer 1 item #5 + Layer 2 item #C amendment.**

**Sub-Q5 option space confirmed at scope-input §7.1**: structural union (`ServiceContext | SystemActorServiceContext`) vs discriminated union (`{type: 'service'} | {type: 'system_actor'}`). service-layer.md Candidate #11 lean = structural union (parallel to chunk 6.3a `recordMutation` precedent). Round 2 adjudicates final shape.

### §2.4 — VFD-4: F-J-14 catalog verify-from-disk (Path C invocation discipline)

F-J-14 catalog at `docs/07_governance/friction-journal.md` lines 12689-12800 confirmed at Session 43 Phase A grade (subagent D digest; verified clean across three grains + Phase 7 fourth-instance cross-validation entry at Commit A `29d8277` documenting Grains 2+3 non-fire). **Grain 0 candidate (directive-grade Phase A verification as preemptive split decision) N=1 banking continues** at Session 44 directive composition grade (Iteration 2 fired single-session-bound forecast; Phase A close grade two-stage evaluation per refinement #4).

**Grain 0 at Phase A close grade evaluation (Stage 2 fire per refinement #4 two-stage banking):** Phase A surfaced 14 reads + Sub-Q1 ENUM-target resolution at moderate complexity (4 substrate sources; clear resolution); no net-new sub-questions surfaced beyond Sub-Q21 (analogous to Phase 7 Sub-Q26 first-firing; banked as single Round 1 deferral). **Single-session-bound forecast HOLDS at Phase A close grade**; preemptive split NOT invoked at either stage. Grain 0 N=1 banking continues at brainstorming-side session-state (Phase 7 chunk 7.3b within-band landing exemplar N=1; Phase 8 Round 1 Phase A close N=1 confirming stage; both at N=1 first-instance grain).

### §2.5 — Verify-from-disk findings worth banking

- **VFD-1 Sub-Q1 ENUM-target resolution = exception_reason** (NOT resolution_action per Phase 7 retrospective §6.1 item #A framing). Gates Sub-Q21 net-new at §3.5.
- **§-structure inheritance recalibration** at §1.1 (a) — refinement #3 fallback fire N=1 first-instance.
- **Cross-phase anti-drift absorption-rate-reduction at scope-lock-cycle-round grade** N=1 first-instance per §1.1 aggregate (21% vs Phase 7's 31%; partial confound: Session 43 scope-input pre-grounded; banking continues at brainstorming-side).
- **Substrate-density-compresses-LOC observation N=3 banking** at Round-1-artifact-authoring grade per §1.3.
- **Grain 0 two-stage evaluation per refinement #4** fired clean at both stages: directive composition grade (Iteration 2) + Phase A close grade (this Round 1 §2.4). N=1 banking continues at both stages.

---

## §3 — Sub-question structure (option-space confirmation)

Round 1 walks all 20 sub-questions pre-allocated at scope-input artifact §7 (Sub-Q1-Sub-Q20) + surfaces 1 new sub-question (Sub-Q21) from §2.1 VFD-1 findings = **21 sub-questions total at Round 1 close** (analogous to Phase 7 Round 1's 26 = 25 + Sub-Q26). Per directive: option-space confirmation references scope-input artifact §7.X rather than re-deriving option-space prose; per-sub-question entries identify deferral round and decision class.

### §3.1 Layer 1 substrate-grade items adjudication sub-questions (Sub-Q1-Sub-Q8)

**Sub-Q1 (item #1 ENUM target).** Per §2.1 VFD-1 finding: `bundle_partial_commit_reconciliation_pending` is structurally an `exception_reason` enum member (queue-side; analogous to `wrong_entity_exception`), NOT a `resolution_action` enum member. **Resolution complete at Round 1 grade** (load-bearing first read). **Deferral round:** locked at Round 1. **Decision class:** Governance-critical.

**Sub-Q2 (item #2 ProposalJustificationSchema shape).** Option space per scope-input §7.1: ProposalJustification extends ADR-0007 Q30 `pipeline_trace: PipelineStageRecord[]` canonical + bundle-level composition fields TBD. **Deferral round:** Round 2 (governance-critical: audit-substrate schema shape). **Decision class:** Governance-critical.

**Sub-Q3 (item #3 paymentService.record consumer count).** Option space per scope-input §7.1: single consumer (post-v1 reconciliation orchestrator) vs multiple (cross-service orchestrator chunk vs N+ consumer wiring surfaces). Affects §6 framing #3 scope grade. **Deferral round:** Round 2 (governance-critical: cross-service orchestrator scope adjudication). **Decision class:** Mixed.

**Sub-Q4 (item #4 component test fixture scope).** Option space per scope-input §7.1: which UI components in-scope for Phase 8 test fixture authoring? Chunks 6.2b + 7.3b shipped 5-8 components (DocumentCard, ProposedAttachmentCard, PendingDocumentsView, DocumentIntakeRail, SplitScreenLayout, others TBD). **Deferral round:** Round 3 (mixed: roster enumeration governance + per-fixture detail product-discovery). **Decision class:** Mixed.

**Sub-Q5 (item #5 withInvariants widening shape).** Per §2.3 VFD-3 finding: service-layer.md Candidate #11 lean = structural union (`ServiceContext | SystemActorServiceContext`) per chunk 6.3a `recordMutation` widening pattern precedent. Option space confirmed; Round 2 adjudicates final shape vs discriminated union alternative. **Deferral round:** Round 2 (governance-critical: ADR amendment shape gate). **Decision class:** Governance-critical.

**Sub-Q6 (item #6 e2e assertion body shape).** Option space per scope-input §7.1: assertion-per-stage (9 stages × 3 doc types = 27 assertion blocks) vs assertion-per-doc-type-end-to-end (3 assertion blocks with stage-by-stage internal sub-assertions). **Deferral round:** Round 3 (mixed: test architecture governance + per-assertion detail product-discovery). **Decision class:** Mixed.

**Sub-Q7 (item #7 fixture-mocked harness boundaries).** Option space per scope-input §7.1: deploy validation only (N=10 surfaces) vs deploy validation + runtime invocation mocking. **Deferral round:** Round 2 (governance-critical: convention codification scope at testing.md extension). **Decision class:** Governance-critical.

**Sub-Q8 (item #8 timeout calibration value).** Option space per scope-input §7.1: 60_000 default vs warm-state-PaddleOCR-inference-fit value (empirically determined from 3-of-3 demo re-fire vendor_invoice + receipt warm OCR timing). **Deferral round:** Round 2 (mixed: governance at calibration grade + product-discovery at numeric value). **Decision class:** Mixed.

### §3.2 Layer 2 ADR amendment adjudication sub-questions (Sub-Q9-Sub-Q12)

**Sub-Q9 (item #A amendment-grade vs substrate-grade fire order).** Option space per scope-input §7.2: ADR amendment ratifies first (governance-led) vs substrate-shape chunk lands first (substrate-led). Per §2.1 VFD-1 finding: target enum = exception_reason; ADR amendment landing further refined per Sub-Q21 (net-new). **Deferral round:** Round 2 (governance-critical: T3 ratification sequencing per §9.7). **Decision class:** Governance-critical.

**Sub-Q10 (item #B Q30 extension shape).** Option space per scope-input §7.2: extends `pipeline_trace` schema to absorb new stage types vs adds parallel field (`bundle_audit_trace: BundleAuditRecord[]`) vs new ADR Q-number. **Deferral round:** Round 2 (governance-critical: ADR-0007 Q30 extension shape). **Decision class:** Governance-critical.

**Sub-Q11 (item #C amendment location ADR-0007 vs ADR-0011).** Per Phase 7 retrospective §6.1 item #C framing: amendment lands at ADR-0007 §Tier 2 safety contract OR ADR-0011 §1 service-layer contract. Per §2.2 VFD-2 finding: ADR-0007 §Tier 2 lines 208-235 contains the "no direct writes" rule; ADR-0011 §1 lines 116-117 is spine-items framing. service-layer.md Candidate #11 forward-pointer cites both as options. **Deferral round:** Round 2 (governance-critical: ADR location canonical pick). **Decision class:** Governance-critical.

**Sub-Q12 (item #D second amendment scope).** Option space per scope-input §7.2: timeout-only (calibration value bump) vs framing-refinement (per-request budget framing extension with warm-state vs cold-state distinction) vs comprehensive (Stage 2 budget + per-stage breakdown + retry framing refinement). **Deferral round:** Round 2 (governance-critical: amendment scope adjudication; tight-bundle with Layer 1 item #8 per §6 framing #1). **Decision class:** Governance-critical.

### §3.3 §6 scope framings adjudication sub-questions (Sub-Q13-Sub-Q17)

**Sub-Q13 (framing #1 bundle composition).** Option space per scope-input §7.3: bundles items #7 + #8 + #9 (per §3.B + §6.1 framing) vs splits. Phase 8 first chunk per Session 42 §8 explicit framing. **Deferral round:** Round 3 (governance-critical: chunk decomposition for first chunk). **Decision class:** Governance-critical.

**Sub-Q14 (framing #4 ledger extensions chunk-decomp).** Option space per scope-input §7.3: ADR-0018 Subsystem 1 candidate scoring + score composition enumerated into N chunk-grade work surfaces (forecast TBD per Phase A grade chunk brief-drafting). Per §2.2 VFD-2: substrate ready at lines 276-505. **Deferral round:** Round 3 (governance-critical: multi-chunk decomposition; gated by Sub-Q17 Path C). **Decision class:** Mixed.

**Sub-Q15 (framing #6 UI infra vs e2e assertion split).** Option space per scope-input §7.3: split into UI infra chunk + e2e assertion chunk separately vs combined framing #6 chunk. Combined-grade ~850-1520 LOC. **Deferral round:** Round 3 (mixed: split adjudication governance + per-chunk LOC product-discovery). **Decision class:** Mixed.

**Sub-Q16 (framing prioritization at Phase 8 scope-lock close).** Option space per scope-input §7.3: which framings ship at Phase 8 v1 close vs defer to post-v1 amendment cycles? Framings #1 uncontested first chunk. **Deferral round:** Round 4 (governance-critical: final scope lock per Phase 5.1/Phase 7 Round 4 precedent). **Decision class:** Governance-critical.

**Sub-Q17 (Path C invocation at framings #4 + #6).** Multi-chunk framing #4 + combined-grade framing #6 are Path C invocation candidates per scope-input §6.9 forecast posture. Multi-axis Path C probability evaluation discipline (N=4 banking + θ-candidate; sub-question-anchored grade). **Deferral round:** Round 3 (governance-critical: Path C invocation at sub-question-anchored grade per multi-axis discipline). **Decision class:** Governance-critical.

### §3.4 Cross-cutting sub-questions (Sub-Q18-Sub-Q20)

**Sub-Q18 (Phase 8 test infrastructure shape).** Option space per scope-input §7.4: existing e2e + integration test infra inheritance + Phase 8 net-new (UI component tests Framing #6 + cross-service orchestrator tests Framing #3 + Modal fixture-mock tests Framing #8). **Deferral round:** Round 3 (mixed: infrastructure governance + per-test detail product-discovery). **Decision class:** Mixed.

**Sub-Q19 (Phase 8 observability surface).** Option space per scope-input §7.4: cross-service orchestrator (Framing #3) + post-v1 reconciliation orchestrator (Framing #2) + ledger extensions (Framing #4) may surface new observability requirements (log.info + trace_id propagation + audit event composition). **Deferral round:** Round 4 (product-discovery: observability detail). **Decision class:** Product-discovery.

**Sub-Q20 (Phase 8 cycle posture sequencing).** Option space per scope-input §7.4: Phase 8 cycle shape: 4-6 scope-lock rounds + 3-N brief-drafting cycles + 3-N impl sessions + retrospective ceremony + terminal-close push. **Deferral round:** Round 4 (governance-critical: final cycle posture ratification at scope-lock close). **Decision class:** Governance-critical.

### §3.5 Net-new sub-question surfaced at Round 1 (Sub-Q21)

**Sub-Q21 (ADR amendment target location for ENUM addition).** **Surfaced at §2.1 VFD-1 finding (Phase 7 Round 1 Sub-Q26 first-firing precedent).** Per Sub-Q1 resolution (target enum = `exception_reason`), which ADR section is the amendment landing?

**Options:**

- **21.α ADR-0011 §13 commentary expansion.** Extend §13's deliverable framing to explicitly name `exception_reason` enum + new value. §13 lines 751-790 enumerate `resolution_action`; §10 lines 651-657 cross-references `exception_reason` as separate enum. Amendment expands §13's commentary to encompass exception_reason naming explicitly + lists new value.
- **21.β ADR-0010 admit framework reserve.** Add value as reserved per ADR-0010 admit discipline (three-layer Phase 1 defense lines 73-131); v1-active vs reserved disposition adjudicated at chunk-impl grade.
- **21.γ Both (governance authority at ADR-0011 + admit discipline at ADR-0010).** Mirror the chunk-6 substrate precedent (migration 20240148000000 + ADR-0011 §10 + ADR-0010 admit) where multiple ADRs co-govern the enum.
- **21.δ New ADR Q-number** (similar to Phase 7 chunk 7.2's Sub-Q10 lock + ADR-0014 §12.3 + migration 20240157000000 precedent for `ai_fallback_validation_failed`). If the bundle_partial_commit_reconciliation_pending substrate is materially new (not just analogous to existing values), a new ADR Q-number may codify the governance.

**Adjudication input:** Phase 7 chunk 7.2 ALTER TYPE precedent (migration 20240157000000) added `ai_fallback_validation_failed` via direct migration + ADR-0014 §12.3 cross-reference; no ADR-0011 §13 amendment was authored. Analogous shape applies to bundle_partial_commit_reconciliation_pending if Layer 2 item #A lands at substrate-grade-only (no ADR amendment at all).

**Deferral round:** Round 2 (governance-critical: ADR amendment scope + location adjudication; gated by Sub-Q9 amendment-grade-vs-substrate-grade fire order). **Decision class:** Governance-critical.

---

## §4 — Decision-class split per CTO Condition 7

Per v3 §9 Decision 6 + CTO Condition 7 + Phase 5.1 retrospective §3 precedent + Phase 7 Round 1 §4 precedent: governance-critical decisions land at scope-lock cycle; product-discovery micro-decisions land at brief-drafting; mixed decisions split.

**Governance-critical (lands at this scope-lock cycle):**

- Sub-Q1 (item #1 ENUM target; LOCKED at Round 1)
- Sub-Q2 (item #2 ProposalJustificationSchema shape)
- Sub-Q5 (item #5 withInvariants widening shape)
- Sub-Q7 (item #7 fixture-mocked harness boundaries)
- Sub-Q9 (item #A amendment-grade vs substrate-grade fire order)
- Sub-Q10 (item #B Q30 extension shape)
- Sub-Q11 (item #C amendment location ADR-0007 vs ADR-0011)
- Sub-Q12 (item #D second amendment scope)
- Sub-Q13 (framing #1 bundle composition)
- Sub-Q16 (framing prioritization at scope-lock close)
- Sub-Q17 (Path C invocation at framings #4 + #6)
- Sub-Q20 (Phase 8 cycle posture sequencing)
- Sub-Q21 (ADR amendment target location for ENUM addition; surfaced at Round 1)

**Mixed (split-at-Round-N per CTO Condition 7 sub-decision routing):**

- Sub-Q3 (paymentService.record consumer count: governance at orchestrator-scope; product-discovery at per-consumer detail)
- Sub-Q4 (component test fixture scope: governance at roster enumeration; product-discovery at per-fixture detail)
- Sub-Q6 (e2e assertion body shape: governance at test architecture; product-discovery at per-assertion detail)
- Sub-Q8 (timeout calibration value: governance at calibration grade; product-discovery at numeric value)
- Sub-Q14 (framing #4 chunk-decomp: governance at multi-chunk shape; product-discovery at per-chunk LOC)
- Sub-Q15 (framing #6 UI infra vs e2e split: governance at split adjudication; product-discovery at per-chunk LOC)
- Sub-Q18 (test infrastructure shape: governance at infrastructure scope; product-discovery at per-test detail)

**Product-discovery (lands at brief-drafting):**

- Sub-Q19 (observability surface detail)

**Count:** 13 governance-critical + 7 mixed + 1 product-discovery = 21 sub-questions. Governance-critical dominates per substantively-new-phase cycle grain at heavier-inheritance-load (Phase 7 was 16/6/4 across 26 sub-questions; Phase 8 ratio shifts further toward governance-critical at materially heavier Layer 2 + Layer 3 inheritance load).

---

## §5 — Round 2+ scope

### §5.1 Round count forecast

**4-6 rounds** for Phase 8 scope-lock cycle per scope-input §8 framing + substantively-new-phase grain. Phase 7 fired 4 rounds + cycle-close = 5 sessions; Phase 8 inheriting 8 §6 preliminary framings + 4 Layer 2 amendments + 15 Layer 3 candidates may fire 4-6 rounds. Estimated 5 rounds at ~4-5 sub-questions per round.

### §5.2 Round-by-round forecast

**Round 2 (next session):** Layer 1 substrate-grade items + Layer 2 ADR amendments + ENUM-target ADR amendment location (Sub-Q2 + Sub-Q5 + Sub-Q7 + Sub-Q9 + Sub-Q10 + Sub-Q11 + Sub-Q12 + Sub-Q21 + Sub-Q3 + Sub-Q8). 10 sub-questions. Governance-critical-dominant batch.

**Round 3:** §6 scope framings adjudication + Path C invocation evaluation (Sub-Q13 + Sub-Q14 + Sub-Q15 + Sub-Q17 + Sub-Q4 + Sub-Q6 + Sub-Q18). 7 sub-questions. Mixed batch.

**Round 4:** Final scope lock + cycle posture ratification (Sub-Q16 + Sub-Q20 + Sub-Q19). 3 sub-questions. Final lock per Phase 5.1/Phase 7 Round 4 precedent.

**Round 5 (if needed):** Brief drafting plan + cross-chunk validation matrix + cycle-close ratification artifact.

### §5.3 Brief drafting plan placeholder

Brief drafting fires after scope-lock cycle close per Phase 5.1 + Phase 7 precedent. Per-chunk briefs (4-8 chunks per §6 8-framing enumeration vs Phase 7's 3 chunks) = 4-8 brief-drafting sessions minimum. Path C invocation candidates at framings #4 + #6 per scope-input §6.9 forecast posture may split chunks into Path-C-sub-chunks (multi-chunk grade per §3.3 Sub-Q14 + Sub-Q15).

### §5.4 Validation-gate inheritance

Per CLAUDE.md §Push readiness three-condition gate + Phase 5.1/Phase 7 retrospective precedent: per-chunk brief includes validation gate enumeration (typecheck + agent:validate 26/26 + full vitest + chunk-specific behavioral tests). Phase 8 inherits the floor; per-chunk-specific gates surface at brief drafting. Layer 1 item #4 (React DOM test env) activation may extend the validation gate surface at framings #6 chunks.

---

## §6 — Round 1 close

### §6.1 Round 1 dispositions banked

- **3 directive-grade divergences (a)-(c)** absorbed at §1.1; recalibrations applied (§-structure inheritance; Sub-Q1 ENUM-target framing; LOC forecast).
- **1 sub-question LOCKED at Round 1 grade**: Sub-Q1 (ENUM target = `exception_reason`). Load-bearing first read complete.
- **1 new sub-question (Sub-Q21)** surfaced at §3.5 VFD-1 follow-up; banked for Round 2 adjudication. Phase 7 Round 1 Sub-Q26 first-firing precedent N=2 cross-phase.
- **19 sub-questions deferred to Round 2-4** per §5.2 routing.
- **Path C invocation candidates** at framings #4 + #6 per §6.9 forecast posture; final lock deferred to Round 3 per multi-axis discipline (sub-question-anchored grade per Sub-Q17).
- **Substrate-density-compresses-LOC observation N=3** at Round-1-artifact-authoring grade per §1.3; Phase 8 retrospective codification candidate at exploratory framing.
- **Cross-phase anti-drift absorption-rate-reduction at scope-lock-cycle-round grade N=1 first-instance** per §1.1 aggregate (sibling to scope-input-grade N=1 banked at Session 43).
- **Refinement #3 fallback discipline N=1 first-fire** per §1.1 (a) (Iteration 2 preliminary §-structure lean → Phase 7 inheritance recalibration).
- **Grain 0 two-stage evaluation per refinement #4 fired clean at both stages**: directive composition grade (Iteration 2) + Phase A close grade (§2.4); single-session-bound HOLDS at both stages.

### §6.2 Round 2 prompt inputs

Round 2 directive inputs from this Round 1 close:

- **Sub-question batch** per §5.2: Sub-Q2 + Sub-Q5 + Sub-Q7 + Sub-Q9 + Sub-Q10 + Sub-Q11 + Sub-Q12 + Sub-Q21 + Sub-Q3 + Sub-Q8 (10 sub-questions; governance-critical-dominant batch).
- **Substrate citation corrections** per §1.1: §3.1 item #1 ENUM extension target = `exception_reason` (not resolution_action); §-structure inheritance from Phase 7 Round 1 6-section template confirmed.
- **Cross-references inherited** from §1.4 canonical cross-references + Phase 7 Round 2 precedent shape (verify at Round 2 Phase A).
- **Decision-class split adjudication** per §4 governance-critical batch focus at Round 2.
- **VFD-2 ADR substrate (Layer 2 amendment locations)** ready at §2.2 — Round 2 walks ADR amendment shape adjudication per Sub-Q9-Sub-Q12.

### §6.3 Carry-forward observations

- **Candidate (c) catalog state at Session 44 close:** sp-auth N=0 maintained at this directive (single-execute close); push-state-claim sub-shape N=4 maintained (15-session avoidance trajectory at Sessions 23-44; codification at `b7ec879` empirically validated). Brief-drafting metafact-assertion grain N=4 maintained at Round 1.
- **Aggregate divergence rate at Round 1 = 21%** (3 directive-grade absorptions across 14 Phase A reads). Phase 7 Round 1 aggregate rate (for comparison): 5 divergences absorbed at §1.1 / 16 VFDs ≈ 31%. **Directional reduction at heavier accumulated inheritance** — cross-phase anti-drift absorption-rate-reduction at scope-lock-cycle-round grade N=1 first-instance banking surface (partial confound: Session 43 scope-input pre-grounded; Phase 9+ Round 1 fires N=2 if substantively-new-phase cycle scope-lock cycle Round 1 fires).
- **Refinement #3 fallback discipline first-fire** at §1.1 (a): Iteration 2 preliminary §-structure lean → Phase 7 inheritance recalibration. **N=1 first-fire of the Iteration 2 refinement #3 fallback at Round 1 artifact grade**. Phase 8 retrospective codification candidate if N=2+ fires across Phase 8 scope-lock cycle rounds.
- **Directive-grade self-correction anti-drift sub-pattern N=1 first-instance** continues banking at brainstorming-side session-state (no Phase 8 Round 1 firing surfaces the self-referential gap because Iteration 2 already corrected; banking continues at Phase 9+ directive grade).
- **Grain 0 two-stage evaluation discipline operationalized cleanly** per refinement #4: directive composition grade + Phase A close grade both fired single-session-bound forecast. **N=1 banking continues at both stages.** Phase 9+ directive grade fires N=2 if substantively-new-phase cycle Round 1 directive fires.
- **Sub-Q21 net-new at Round 1 = Phase 7 Sub-Q26 first-firing precedent N=2 cross-phase**. Future-cycle-watch: scope-lock-cycle Round 1 reliably surfaces N≥1 net-new sub-questions per Phase A VFD findings. Codification graduation candidate at N=3 if Phase 9+ Round 1 also surfaces net-new.
- **Local commits ahead of `origin/staging` post-session:** expected 2 (scope-input artifact at `9b6694b` + this Round 1 artifact). No push; banks for Phase 8 terminal-close push at retrospective close per push-terminal-close N=4 cumulative pattern (N=5 fires at Phase 8 close).

---

**Round 1 status:** complete. Single-prompt execute-and-close per Iteration 3 dispatched directive. Next operational fire: **Session 45 Phase 8 scope-lock cycle Round 2** per §6.2 prompt inputs (10-sub-question governance-critical-dominant batch).
