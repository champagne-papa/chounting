# Phase 8 Post-v1 Reconciliation + Cross-Service Orchestrators + Ledger Extensions — Scope-Lock Cycle Round 4 (Final-Lock Cycle)

**Session:** 47
**Date:** 2026-05-21
**Branch:** `staging`
**Local HEAD at session-onset:** `45e64e6` (Phase 8 scope-lock cycle Round 3)
**`origin/staging` HEAD:** `96eae39` (4 commits behind local; banks for Phase 8 terminal-close push)
**Validation gates at session-onset:** `pnpm agent:validate` 26/26 green (preserved through Rounds 1-3 docs-only commits).
**Predecessor:** Phase 8 scope-lock cycle Round 3 at `45e64e6` (`docs/09_briefs/phase-8/2026-05-21-phase-8-scope-lock-cycle-round-3.md`; 349 LOC).

---

## §1 — Preamble + cross-references

### §1.0 What this round is

This is **Round 4** of the Phase 8 post-v1 reconciliation + cross-service orchestrators + ledger extensions scope-lock cycle — **the final-lock cycle per Phase 7 Round 4 precedent** (Session 31 Phase 7 Round 4 closed all 27 sub-questions; cycle-close ratification shipped at separate Round 5 Session 32). Round 4 walks the **4-sub-question final batch** per Round 3 §6.2 prompt inputs: Sub-Q16 (framing prioritization at scope-lock close; LOAD-BEARING first walk) + Sub-Q3.b (paymentService.record multi-consumer expansion; gated by Sub-Q16) + Sub-Q19 (observability surface) + Sub-Q20 (cycle posture sequencing). Round 4 close surfaces scope-lock-cycle-readiness for Round 5 cycle-close ratification.

### §1.1 Walk-order coupling discipline

Round 4 walks Sub-Q16 → Sub-Q3.b → Sub-Q19 → Sub-Q20 per gating dependency chain. Per N=3 walk-order coupling discipline codification graduation at Session 46 close (Phase 7 Round 2 + Phase 8 Round 2 + Phase 8 Round 3 cumulative banking):

- **Sub-Q16 walks FIRST** as load-bearing gating sub-question (framing prioritization gates Sub-Q3.b multi-consumer expansion + Sub-Q20 cycle posture sequencing per chunk count outcome).
- **Sub-Q3.b walks SECOND** per tight-bundle pairing with Sub-Q16 (multi-consumer expansion adjudication contingent on framing #3 ship-or-defer outcome).
- **Sub-Q19 walks THIRD** as observability surface composition (Sub-Q16 framing prioritization outcome supplies observability scope per per-framing observability requirements; independent of Sub-Q3.b consumer count).
- **Sub-Q20 walks LAST** as final ratification grade (uses Sub-Q16 chunk count + Sub-Q3.b consumer count + Sub-Q19 observability scope as inputs; ratifies final Phase 8 cycle posture sequencing).

Walk-order coupling discipline N=3 → **N=4 confirming-fire pending** at Round 4 grade per cross-phase pattern stabilization continuation; codification graduation already MET at retrospective ceremony grade per Session 46 banking.

### §1.2 Cycle-close bundled vs separate Round 5 — Stage 2 Grain 0 outcome

Per F-J-14 Grain 0 two-stage banking discipline (N=3 codification graduation MET at Session 46): Stage 1 directive composition grade preserved Phase 7 precedent default (separate Round 5); Stage 2 Phase A close grade recalibrates per substrate evidence.

**Stage 2 outcome per Phase A step 3 verification:**

- Phase 7 Round 4 LOC = 442; Phase 7 cycle-close LOC = 652 (substantively heavier than any individual round per 10-section Phase 6.5 Option A structural template inheritance).
- Phase 7 cycle = 5 sessions total (Rounds 1-4 + cycle-close at Sessions 28-32; Phase 7 cycle-close §1.0 explicitly notes "Option A per founder selection at Session 32 brainstorming-side ↔ founder adjudication").
- Phase 8 Round 4 forecast at ~310-350 LOC per cross-round compression trajectory continuation (R1 3.5% + R2 23% + R3 30% trajectory). Phase 8 cycle-close forecast at ~460-490 LOC per ~25-30% compression below Phase 7 anchor 652.
- Combined bundled forecast: ~770-840 LOC at single-session-bound bound (within Phase 8 scope-input 1432 LOC precedent but materially heavier than any Phase 8 scope-lock-cycle-round artifact).

**Disposition: Path γ-1 separate Round 5 (canonical Phase 7 + Phase 6.5 Option A inheritance).** Phase 8 cycle-close ships at Session 48 Round 5 (single docs-only commit); Phase 8 cycle = 5 sessions total (Rounds 1-4 + cycle-close at Sessions 44-48) matching Phase 7 precedent. Operational separation cleanness wins over bundled-LOC-feasibility per substantively-new-phase cycle template discipline.

Grain 0 N=3 → **N=4 confirming-fire** at both stages (Stage 1 directive composition grade preserved Phase 7 precedent + Stage 2 Phase A close grade ratified separate Round 5 per substrate verification). Codification graduation strengthens at retrospective ceremony grade.

### §1.3 Anti-drift discipline application outcomes

Per directive anti-drift discipline notes (prospective application at directive grade per N=53+ cumulative firings): four sub-questions had anti-drift framings in the directive. Round 4 walk evidence:

- **Sub-Q16 framing prioritization substrate verification**: per Phase A step 7 read of scope-input §6 8-framing enumeration + Layer 1 + Layer 2 inheritance — all 8 framings substrate-paired to Phase 8 v1 inheritance; no Phase 8 v1 close framing-deferral candidates surface. Lock at all-8-framings-ship per substrate evidence (10-chunk Phase 8 v1 envelope).
- **Sub-Q3.b multi-consumer expansion verification**: Sub-Q3 Round 2 partial-lock single consumer minimum + Sub-Q16 outcome (framing #3 ships at Phase 8 v1) → Sub-Q3.b fires multi-consumer expansion at Phase 8 v1.
- **Sub-Q19 observability surface verification**: per Phase A step 9 read of ADR-0007 Q30 + Layer 2 item #B parallel field (bundle_audit_trace per Round 2 Sub-Q10 lock) — per-chunk incremental observability per Phase 7 Sub-Q25 precedent inheritance.
- **Sub-Q20 cycle posture sequencing verification**: per Phase A step 10 read of CLAUDE.md §Push readiness three-condition gate + plan-authoring.md Candidate #1 inheritance — canonical Phase 7-inherited cycle posture sequencing shape.

No anti-drift FIRES at Round 4 walk grade (4/4 substrate verifications walk clean against directive anti-drift framings). Anti-drift prospective-firing N=53+ continues at clean execution grade; no new directive-grade firings at Round 4.

### §1.4 Substrate-density-compresses-LOC observation continuation

Round 3 §1.5 N=5 → N=6 banking achieved (599+1432 + 310+299 + 486+373 + 500+349 LOC; four-grain cross-phase consistency at scope-input + Round 1 + Round 2 + Round 3 grades). Round 4 forecast at ~310-350 LOC per cross-round compression trajectory continuation (Phase 7 Round 4 anchor 442 LOC; ~25-30% compression below anchor). **N=6 → N=7 banking candidate** at Round-4-artifact-authoring grade if compression rate trajectory holds.

Cross-round compression trajectory acceleration N=3 first-instance banking (Phase 8 R1 3.5% → R2 23% → R3 30% directional increase per Session 46 close): Round 4 LOC determines N=3 stabilization vs N=4 confirming-fire vs reversion. If Round 4 lands at ~310-350 LOC (~25-30% compression below Phase 7 anchor 442), banking holds at N=3 stabilization grade; if Round 4 lands materially below (e.g., <300 LOC at >35% compression), N=4 confirming-fire continues trajectory acceleration.

### §1.5 Canonical cross-references

- **Round 3 artifact** at `docs/09_briefs/phase-8/2026-05-21-phase-8-scope-lock-cycle-round-3.md` (`45e64e6`) — predecessor; Round 4 prompt inputs at §6.2.
- **Round 2 artifact** at `docs/09_briefs/phase-8/2026-05-21-phase-8-scope-lock-cycle-round-2.md` (`746e8ad`) — Sub-Q3 single consumer partial-lock + Sub-Q21 LOCKED.
- **Round 1 artifact** at `docs/09_briefs/phase-8/2026-05-21-phase-8-scope-lock-cycle-round-1.md` (`a158c9b`) — Sub-Q1 LOCKED + §4 decision-class split.
- **Phase 8 scope-input artifact** at `docs/09_briefs/phase-8/2026-05-21-phase-8-scope-input.md` (`9b6694b`) — §6 8-framing enumeration + §7.3 + §7.4 sub-question option-space.
- **Phase 7 Round 4 structural template** at `docs/09_briefs/phase-7/2026-05-19-phase-7-scope-lock-cycle-round-4.md` (442 LOC; Session 31) — §-structure inheritance template.
- **Phase 7 cycle-close artifact** at `docs/09_briefs/phase-7/2026-05-19-phase-7-scope-lock-cycle-close.md` (652 LOC; Session 32) — Phase 6.5 Option A 10-section structural template inheritance source for Phase 8 Round 5 cycle-close.
- **ADR-0007 Q30** (lines 482-489) — Sub-Q19 observability surface intersection with pipeline_trace per-stage record + Layer 2 item #B parallel field inheritance.
- **CLAUDE.md** §Push readiness three-condition gate (lines 129-197) + Push-terminal-close timing pattern (lines 169-196) — Sub-Q20 cycle posture sequencing inheritance + Candidate #13 N=5 fires at Phase 8 retrospective close.
- **plan-authoring.md** Candidate #1 (lines 798-1090) — directive-authoring multi-iteration refinement N=17 cumulative; Session 47 fires N=18 at 1-iteration-cycle sub-grade dispatch (per Session 45 N=1 first-instance + Session 47 N=2 confirming-fire pattern continuation).

---

## §2 — Per-sub-question walk

Walk-order Sub-Q16 → Sub-Q3.b → Sub-Q19 → Sub-Q20 per §1.1 coupling discipline.

### §2.1 Sub-Q16 — Framing prioritization at Phase 8 scope-lock close (LOAD-BEARING)

**Option space (scope-input §7.3 Sub-Q16):** Which framings ship at Phase 8 v1 close vs defer to post-v1 amendment cycles?

**Substrate evidence per §6 8-framing enumeration + Layer 1 + Layer 2 inheritance:**

- **Framing #1** (v1 close demo completion bundle; Sub-Q13 LOCKED 1 chunk): items #7 + #8 + #9 substrate-paired; ships at Phase 8 first chunk per Session 42 §8 explicit framing.
- **Framing #4** (ledger extensions; Sub-Q14 LOCKED N=3 chunks): ADR-0018 Subsystem 1 activation substrate-paired with Phase 8 post-v1 ledger semantics scope per scope-input §1.
- **Framing #6** (UI test infrastructure; Sub-Q15 LOCKED N=2 chunks split): Layer 1 items #4 + #6 paired (React DOM test env + e2e assertion authoring); paired with Phase 7 substrate inheritance closing chunk 7.3b e2e test gates.
- **Framing #2** (post-v1 reconciliation orchestrator): Layer 1 item #1 + Layer 2 item #A pair (bundle_partial_commit_reconciliation_pending ENUM extension + Stage 7 Bundle partial-commit reconciliation path); Phase 7 retrospective §6.2 forward-pointer.
- **Framing #3** (cross-service orchestrators; paymentService.record v1 consumers): Layer 1 item #3 substrate (payment.record ActionName + role_permissions migration + canUserPerformAction parity test); paired with Sub-Q3.b multi-consumer expansion adjudication.
- **Framing #5** (Logic Receipt consumer): Layer 1 item #2 + Layer 2 item #B pair (bundle_audit_trace parallel field at ProposalJustificationSchema per Round 2 Sub-Q10 lock; ADR-0007 Q30 extension).
- **Framing #7** (system_actor widening at withInvariants): Layer 1 item #5 + Layer 2 item #C pair (structural union widening per Sub-Q5 lock; ADR-0007 §Tier 2 safety contract amendment per Sub-Q11 lock).
- **Framing #8** (sidecar deployment validation harness): Layer 1 item #7; bundled into framing #1 first chunk per Sub-Q13 lock (items #7 + #8 + #9 bundle).

**Walk:** All 8 framings substrate-paired to Phase 8 v1 inheritance per Layer 1 (8 items) + Layer 2 (4 amendments) enumeration. No framing surfaces operational-budget founder-decision candidate at scope-lock grade (substrate-pairing supports inclusion; deferring framings would create Phase 9 with similar substrate-pairing pressure inherited). Phase 8 v1 chunk count = framing #1 (1 chunk including framing #8) + framing #4 (3 chunks) + framing #6 (2 chunks) + framing #2 (1 chunk) + framing #3 (1 chunk; single consumer minimum + Sub-Q3.b expansion) + framing #5 (1 chunk) + framing #7 (1 chunk) = **10 chunks total at Phase 8 v1 close grade**.

**Disposition:** **Lock at all-8-framings-ship-at-Phase-8-v1-close.** Phase 8 v1 chunk count = 10 chunks (framing #8 bundled into framing #1; framing #3 single consumer minimum baseline). Specific chunk decomposition per Sub-Q14 N=3 + Sub-Q15 N=2 + Sub-Q13 1 + framings #2/#3/#5/#7 = 1 chunk each. No framings deferred to post-v1 amendment cycles at scope-lock grade.

### §2.2 Sub-Q3.b — paymentService.record multi-consumer expansion (gated by Sub-Q16)

**Option space (scope-input §7.1 Sub-Q3 + Round 2 §2.9 partial-lock):** single consumer (post-v1 reconciliation orchestrator) vs multiple (cross-service orchestrator chunk + N+ consumer wiring surfaces).

**Substrate evidence per Sub-Q16 outcome + Layer 1 item #3:**

- Sub-Q16 LOCKED all-8-framings-ship: framing #3 (cross-service orchestrators) ships at Phase 8 v1 close.
- Layer 1 item #3 substrate completes paymentService.record() v1 consumer wiring (payment.record ActionName + role_permissions migration + canUserPerformAction parity test).
- Phase 7 chunk 7.3b commit `ab0f7fe` shipped paymentService.record() with `bill.record_payment` ActionName as Phase 7 Stage 7 commit composite consumer (consumer #1 already wired).
- Framing #2 post-v1 reconciliation orchestrator Stage 7 Bundle partial-commit reconciliation path may produce paymentService.record() invocations as consumer #2.
- Framing #3 cross-service orchestrator chunk explicitly scopes additional v1 consumer wiring beyond minimum baseline.

**Walk:** Sub-Q16 lock activates framing #3 at Phase 8 v1; Sub-Q3.b multi-consumer expansion fires per substrate-pairing. Phase 8 v1 consumer count: Phase 7 Stage 7 (consumer #1; already wired) + Framing #2 post-v1 reconciliation orchestrator (consumer #2; ships at framing #2 chunk) + Framing #3 cross-service orchestrator surface (additional consumers per chunk brief-drafting grade adjudication). Multi-consumer expansion fires at Phase 8 v1; specific consumer count beyond minimum baseline adjudicated at chunk brief-drafting grade.

**Disposition:** **Lock at multi-consumer expansion fires at Phase 8 v1 per Sub-Q16 framing #3 inclusion.** Phase 8 v1 paymentService.record() consumer count: minimum 2 (Phase 7 Stage 7 + Framing #2 post-v1 reconciliation orchestrator); additional consumers per Framing #3 cross-service orchestrator chunk brief-drafting grade. payment.record ActionName + role_permissions migration + canUserPerformAction parity test ships at Layer 1 item #3 substrate-grade (Framing #3 chunk substrate).

### §2.3 Sub-Q19 — Phase 8 observability surface

**Option space (scope-input §7.4 Sub-Q19):** Cross-service orchestrator + post-v1 reconciliation orchestrator + ledger extensions may surface new observability requirements (log.info + trace_id propagation + audit event composition + ADR-0007 Q30 pipeline_trace per-stage record extensions).

**Substrate evidence per ADR-0007 Q30 + Layer 2 item #B + Phase 7 Sub-Q25 precedent:**

- ADR-0007 Q30 `pipeline_trace: PipelineStageRecord[]` canonical (per-stage record with stage_name + input_hash + output_hash + model + timestamp).
- Layer 2 item #B parallel field (bundle_audit_trace: BundleAuditRecord[] per Round 2 Sub-Q10 lock; ProposalJustificationSchema parallel field per Sub-Q2 lock).
- Phase 7 Sub-Q25 LOCKED at chunk-by-chunk-incremental observability (each chunk ships its own pipeline_trace emission + audit events + cost tracking).

**Walk:** Phase 8 observability inherits Phase 7 Sub-Q25 chunk-by-chunk-incremental pattern. Per-framing observability scope per Sub-Q16 inclusion:
- **Framing #1** (v1 close demo completion): pipeline_trace + audit events at sidecar deployment validation + Stage 2 OCR timeout calibration grade.
- **Framing #2** (post-v1 reconciliation orchestrator): bundle_audit_trace emission at Stage 7 Bundle partial-commit reconciliation path per Layer 2 item #B parallel field.
- **Framing #3** (cross-service orchestrators): log.info + trace_id propagation at paymentService.record() multi-consumer expansion sites per Phase 7 inheritance.
- **Framing #4** (ledger extensions): pipeline_trace per-stage extensions at ADR-0018 Subsystem 1 candidate scoring + score composition per Sub-Q14 N=3 chunks.
- **Framing #5** (Logic Receipt consumer): ADR-0007 Q30 pipeline_trace consumer surface + bundle_audit_trace consumer.
- **Framing #6** (UI test infrastructure): observability test fixtures at chunk-by-chunk-incremental grade.
- **Framing #7** (system_actor widening): no net-new observability surface (service-layer change at withInvariants signature; existing pipeline_trace + audit events inherit).
- **Framing #8** (sidecar deployment validation harness): bundled into framing #1 observability scope.

Cross-cutting observability tooling (dev-tools surfacing + metrics dashboards) defers to post-v1 amendment cycle if surface materializes.

**Disposition:** **Lock at per-chunk-incremental observability per Phase 7 Sub-Q25 precedent inheritance.** Each Phase 8 chunk ships its own observability surface (pipeline_trace per-stage emission + bundle_audit_trace at framings #2 + #5 + audit events + cost tracking). Cross-cutting observability tooling deferred to post-v1 amendment cycle.

### §2.4 Sub-Q20 — Phase 8 cycle posture sequencing

**Option space (scope-input §7.4 Sub-Q20):** Phase 8 cycle shape: scope-lock rounds + cycle-close + brief-drafting cycles + impl sessions + retrospective ceremony + terminal-close push.

**Substrate evidence per Phase 7 precedent + CLAUDE.md + plan-authoring.md inheritance:**

- Phase 7 cycle = 5 sessions scope-lock (Rounds 1-4 + cycle-close) + N brief-drafting (3 chunks → 3-5 brief-drafting sessions with potential Path C SPLITs at chunk 7.1 + 7.3 brief-grade) + N+ impl sessions (3-5 impl sessions) + 3-commit retrospective ceremony + terminal-close push + v1 close demo = ~12-18 sessions total Phase 7 envelope.
- Phase 8 inheriting 10 chunks at Sub-Q16 lock + cross-round compression trajectory (substantively heavier per accumulated Layer 1 + Layer 2 + Layer 3 inheritance load).
- CLAUDE.md Push-terminal-close timing pattern (Candidate #13) N=5 fires at Phase 8 retrospective close grade per cross-phase cumulative observation (Phase 5.1 + 6.5 + Phase 7-retro + Phase 7-substrate-fix + Phase 8-close).
- plan-authoring.md Candidate #1 directive-authoring multi-iteration refinement N=17 cumulative inheritance.

**Walk:** Phase 8 cycle posture inherits Phase 7-precedent shape with materially heavier impl-cycle load per 10-chunk substrate scope:
- **Scope-lock cycle**: 4 rounds + cycle-close at Round 5 (Sessions 44-48; 5 sessions total per Stage 2 Grain 0 outcome at §1.2).
- **Brief-drafting cycle**: 10 chunks × ~1 brief-drafting session per chunk (potentially more if Path C SPLITs fire at chunk-brief-grade; potentially fewer if multi-chunk briefs consolidate per Phase 7 chunk 7.1 + 7.3 Path C single-brief-with-split precedent).
- **Implementation cycle**: 10+ impl sessions (one per chunk minimum; +1-2 per Path C SPLIT at impl grade).
- **Retrospective ceremony**: 3-commit T3>T4>T1 surface precedence per Phase 7 precedent (substantively heavier T3 load: 4 ADR amendments + F-J-14 Grain 0 catalog extension; substantively heavier T4 load: 3 N=3 codification graduations + 15 Layer 3 candidates + Sub-Q21 21.δ + coordination warning N=5 if surfaces + new cross-round compression trajectory acceleration banking).
- **Terminal-close push**: Phase 8 close grade per push-terminal-close N=4 → N=5 cumulative cross-phase (Candidate #13 codification).

**Total Phase 8 envelope forecast**: 5 (scope-lock) + 10 (brief-drafting; potentially compressible) + 10+ (impl; potentially expansible per Path C) + 3 (retrospective) + 1 (terminal-close push) = ~29+ sessions total Phase 8 envelope. Materially heavier than Phase 7's ~12-18 session envelope per substrate-inheritance reality + accumulated 3-layer inheritance scope.

**Disposition:** **Lock at canonical Phase 7-inherited cycle posture sequencing shape with 10-chunk substrate scope.** Phase 8 cycle = scope-lock cycle (4 rounds + cycle-close = 5 sessions) + brief-drafting cycle (~10 sessions; multi-chunk consolidation candidate at brief-grade) + implementation cycle (~10+ sessions; Path C SPLIT candidates at chunk-brief-grade per F-J-14 Grain 1 prospective) + retrospective ceremony (3-commit T3>T4>T1 per Phase 7 precedent; substantively heavier T3 + T4 load) + terminal-close push (N=5 fires at Phase 8 close). Total envelope: ~29+ sessions forecast (compressible to lower bound if multi-chunk briefs consolidate + impl sessions hit chunk-coherent floor; expansible to upper bound if Path C SPLITs surface at brief or impl grade).

---

## §3 — Round 4 dispositions banked

| Sub-Q | Disposition | Lock detail |
|---|---|---|
| Sub-Q16 | **Lock at Round 4** | all-8-framings-ship-at-Phase-8-v1-close per substrate-pairing evidence; 10 chunks total Phase 8 v1 envelope (framing #8 bundled into framing #1; framing #3 single consumer minimum baseline) |
| Sub-Q3.b | **Lock at Round 4** | multi-consumer expansion fires per Sub-Q16 framing #3 inclusion; minimum 2 v1 consumers (Phase 7 Stage 7 + Framing #2 post-v1 reconciliation orchestrator); additional consumers per Framing #3 chunk brief-drafting grade |
| Sub-Q19 | **Lock at Round 4** | per-chunk-incremental observability per Phase 7 Sub-Q25 precedent inheritance; per-framing observability scope per Sub-Q16 inclusion; cross-cutting observability tooling deferred to post-v1 |
| Sub-Q20 | **Lock at Round 4** | canonical Phase 7-inherited cycle posture sequencing shape with 10-chunk substrate scope; total envelope ~29+ sessions (compressible per multi-chunk brief consolidation; expansible per Path C SPLITs) |

**Count at Round 4 close:**

- **4 clean locks** at Round 4.
- **0 partial-locks** + **0 founder-decision-required** + **0 net-new sub-questions surfaced**.
- **100% clean lock rate** at Round 4 (4/4).

**All 4 Round 4 sub-questions lock cleanly at Round 4 grade. Final-lock cycle complete.**

**Cross-round disposition rate trajectory at Phase 8 scope-lock cycle close**: R2 90% (9/10) + R3 100% (7/7) + R4 100% (4/4) = directional improvement strengthens; cross-phase Round 4 disposition-rate observation banking continues at brainstorming-side session-state (sample-size asymmetry caveat preserved: Phase 8 Round 4 = 4 sub-Qs vs Phase 7 Round 4 = 7 sub-Qs).

---

## §4 — Decision-class split disposition FINAL STATE

Per Round 1 §4 decision-class split (13+1 governance-critical + 7 mixed + 1 product-discovery = 21 sub-questions at Round 3 close). Round 4 walks final 4 sub-questions; **all 21 sub-questions LOCKED at scope-lock-cycle grade**:

**Governance-critical sub-questions all locked (14 of 14 = 13+1):**

- Sub-Q1 ✓ (Round 1; LOCKED ENUM target = exception_reason)
- Sub-Q2 + Sub-Q10 + Sub-Q11 + Sub-Q12 ✓ (Round 2)
- Sub-Q5 + Sub-Q7 ✓ (Round 2)
- Sub-Q9 ✓ (Round 2; substrate-grade-first fire order)
- Sub-Q14 + Sub-Q17 + Sub-Q13 ✓ (Round 3)
- Sub-Q21 ✓ (Round 2; net-new at Round 1; 21.δ consumer-ADR naming)
- Sub-Q16 ✓ (Round 4; all-8-framings-ship)
- Sub-Q20 ✓ (Round 4; canonical Phase 7-inherited sequencing)

**Mixed sub-questions all locked (7 of 7):**

- Sub-Q3 + Sub-Q8 ✓ (Round 2)
- Sub-Q15 + Sub-Q18 + Sub-Q4 + Sub-Q6 ✓ (Round 3)
- Sub-Q3.b ✓ (Round 4; multi-consumer expansion per Sub-Q16)

**Product-discovery sub-questions all locked (1 of 1):**

- Sub-Q19 ✓ (Round 4; per-chunk-incremental observability)

**Total Round 4 final state: 21 of 21 sub-questions LOCKED at scope-lock-cycle grade. Phase 8 scope-lock cycle READY for Round 5 cycle-close ratification.**

---

## §5 — Round 5 scope (cycle-close ratification artifact)

### §5.1 Round 5 scope — Cycle-close ratification artifact per Path γ-1

Per §1.2 Stage 2 Grain 0 outcome (Path γ-1 separate Round 5 per Phase 7 + Phase 6.5 Option A inheritance):

Round 5 produces the **Phase 8 scope-lock cycle close ratification artifact** at `docs/09_briefs/phase-8/2026-05-21-phase-8-scope-lock-cycle-close.md`. Mirrors Phase 7 cycle-close 10-section structural template (Phase 6.5 Option A precedent inheritance):

- §1 Preamble + cycle pattern (Phase 8 scope-lock cycle progression table; cycle pattern naming: walk-order coupling + Grain 0 two-stage + refinement #3 fallback + directive-grade self-correction + cross-round compression trajectory acceleration).
- §2 Cycle output index (forward-reader navigation).
- §3 Sub-question lock consolidation (21 sub-questions × disposition + governing ADR + decision-class + locking-round).
- §4 Phase 8 retrospective codification candidate enumeration (THREE N=3 codification graduations + Layer 2 4 ADR amendments + Layer 3 15 codification candidates + cross-round compression trajectory N=3 first-instance + coordination warning N=4 cumulative + directive-grade self-correction N=2 + new banking surfaces TBD).
- §5 Chunk decomposition + shipping order + per-chunk acceptance criteria framework (10-chunk decomposition per Sub-Q16 lock + canonical sequence per Sub-Q22 inheritance + per-chunk acceptance criteria framing).
- §6 Inter-chunk dependency map (substrate + service + UI consumer dependencies across 10 chunks).
- §7 Brief-drafting plan + partial-information items inventory (per-chunk brief-drafting session enumeration + retrospective-candidate operational-relevance flagging + partial-information items per chunk).
- §8 Cycle metadata + cumulative state catches (rounds fired + substrate baseline at cycle close + cumulative state catches + candidate (c) catalog evolution).
- §9 Handoff to chunk 1 brief-drafting (Session 49 next operational fire).
- §10 Cross-references (cycle lineage + governance forward-pointers + ADRs + code surfaces + substrate migrations + governance precedents).

### §5.2 Round 5 forecast volume

Per cross-round compression trajectory continuation + Phase 7 cycle-close anchor 652 LOC: **Phase 8 cycle-close forecast ~460-490 LOC** (~25-30% compression below Phase 7 anchor). 10-section structural template inheritance + Phase 8-specific extensions (3-layer inheritance enumeration + 21-sub-question consolidation + 10-chunk decomposition + cross-round + cross-phase banking surfaces). Substantively heavier composition shape than scope-lock-cycle-round artifacts but compressible per substrate-density inheritance maturity.

### §5.3 Updated round count forecast

Round 1 forecast: 4-6 rounds. Round 2 forecast: 4-6 rounds. Round 3 forecast: 4 rounds total + cycle-close at well-calibrated lower-mid. **Round 4 close: 5 rounds total (4 scope-lock + 1 cycle-close at Round 5) per Phase 7 precedent inheritance.** Matches Phase 7 5-session scope-lock cycle (Sessions 28-32 = Sessions 44-48 for Phase 8).

### §5.4 Phase 8 chunk-brief drafting sequencing (post-cycle-close)

Per Sub-Q16 + Sub-Q20 locks:

1. **Session 48** — Phase 8 scope-lock cycle close ratification (Round 5).
2. **Session 49-58** — Phase 8 chunk-brief drafting (10 chunks; potentially compressible if multi-chunk briefs consolidate).
3. **Session 59+** — Chunk implementations (10+ sessions; Path C SPLITs at brief-grade or impl-grade may expand count).
4. **Session N-2** — Phase 8 retrospective drafting (substantively heavier per accumulated codification load).
5. **Session N-1** — Phase 8 retrospective ceremony (3-commit T3>T4>T1 surface precedence).
6. **Session N** — Phase 8 terminal-close push (push-terminal-close N=5 fires).

Total Phase 8 envelope: ~29+ sessions forecast per Sub-Q20 lock (Sessions 44 through ~73+).

---

## §6 — Round 4 close

### §6.1 Round 4 dispositions banked summary

- **4 clean locks** at Round 4 (Sub-Q16 + Sub-Q3.b + Sub-Q19 + Sub-Q20).
- **0 partial-locks** + **0 founder-decision-required** + **0 net-new sub-questions surfaced**.
- **100% clean lock rate** at Round 4 (4/4); cross-round disposition rate trajectory R2 90% + R3 100% + R4 100% (directional strengthening with sample-size asymmetry caveat preserved).
- **Phase 8 v1 chunk count = 10 chunks** per Sub-Q16 lock (framing #1 1 chunk including framing #8 + framing #4 3 chunks + framing #6 2 chunks + framings #2 + #3 + #5 + #7 = 1 chunk each).
- **Cycle-close ratification at Round 5 (Path γ-1 separate)** per §1.2 Stage 2 Grain 0 outcome.
- **F-J-14 Grain 0 two-stage banking N=3 → N=4 confirming-fire** at both stages (Stage 1 directive composition grade + Stage 2 Phase A close grade); codification graduation strengthens at retrospective ceremony grade.
- **Walk-order coupling discipline N=3 → N=4 confirming-fire** at Round 4 walk; codification graduation strengthens.

### §6.2 Scope-lock-cycle-readiness assessment

**ALL 21 sub-questions LOCKED at scope-lock-cycle grade.** Phase 8 scope-lock cycle is **READY for Round 5 cycle-close ratification artifact**.

Ratification readiness conditions per Phase 7 Round 4 §6.2 precedent:

- [x] All governance-critical sub-questions locked at scope-lock-cycle grade (14 of 14 = 13+1 Sub-Q21 net-new).
- [x] All mixed sub-questions locked at scope-lock-cycle grade with appropriate brief-grade deferrals for product-discovery sub-axes (7 of 7).
- [x] All product-discovery sub-questions locked at scope-lock-cycle grade or appropriately deferred to brief-grade (1 of 1).
- [x] Chunk decomposition + shipping order locked (Sub-Q16 + Sub-Q22 inheritance + Sub-Q13 + Sub-Q14 + Sub-Q15; 10 chunks total at canonical sequence).
- [x] No founder-decision-required dispositions remaining (Sub-Q16 substrate-pairing evidence avoided operational-budget founder-decision; clean lock at Round 4 grade).
- [x] Anti-drift discipline application outcomes banked at carry-forward observations (4/4 anti-drift framings walked clean at Round 4; N=53+ continues).
- [x] THREE N=3 codification graduation thresholds MET at retrospective ceremony grade (walk-order coupling + F-J-14 Grain 0 two-stage + refinement #3 fallback).

**Phase 8 scope-lock cycle ready for cycle-close ratification at Round 5.**

### §6.3 Carry-forward observations

- **Candidate (c) catalog state at Session 47 close:** sp-auth sub-grain N=0 maintained (single-execute Round 4 walk at 1-iteration-cycle sub-grade dispatch per Session 45 N=1 first-instance + Session 47 N=2 confirming-fire pattern). Push-state-claim sub-shape N=4 maintained (18-session avoidance trajectory at Sessions 23-47; codification at `b7ec879` empirically validated). Brief-drafting metafact-assertion grain N=4 maintained at Round 4.
- **THREE N=3 codification graduation thresholds MET at retrospective ceremony grade** (carry-forward from Session 46): Walk-order coupling discipline + F-J-14 Grain 0 two-stage banking + Refinement #3 fallback discipline. Round 4 fires N=4 confirming-fires at all three thresholds; codification routing remains: scope-lock.md + plan-authoring.md + friction-journal.md extensions for Phase 8 retrospective Commits A (T3) + B (T4).
- **Directive-grade self-correction anti-drift sub-pattern N=2 maintained** (carry-forward from Session 46): Sessions 44 + 46 firings; Session 47 1-iteration-cycle dispatch did not surface self-referential gap; banking continues at brainstorming-side. Promotion threshold N=2 met; codification graduation candidate strengthens per cumulative evidence.
- **Cross-round compression trajectory acceleration N=3 first-instance** (carry-forward from Session 46): Phase 8 R1 3.5% → R2 23% → R3 30% → R4 ? (forecast ~25-30%; banking determines N=3 stabilization vs N=4 confirming-fire vs reversion at Round 4 LOC).
- **Substrate-density-compresses-LOC observation N=6 → N=7 banking candidate** at Round-4-artifact-authoring grade per Phase 7 Round 4 anchor 442 LOC + Phase 8 Round 4 LOC ≤ ~310-350 forecast.
- **Cycle-close artifact composition forecast for Round 5**: Phase 8 cycle-close inherits Phase 7 10-section template at compressed LOC (~460-490). Substantively heavier T3 + T4 codification load per accumulated 3-layer inheritance + N=3 codifications + cross-phase + cross-round observations.
- **Coordination warning cross-session N=4 → N=5 firing pending at Session 47 commit**: if "no session lock in use" surfaces, cumulative N=5 strengthens codification graduation candidate (already strong at N=3 from Session 45 close banking). Not blocking.
- **Directive-authoring multi-iteration refinement N=17 → N=18 at 1-iteration-cycle sub-grade** (Session 47 dispatched at Iteration 1 without Iteration 2/3 refinement cycle per Session 45 N=1 + Session 47 N=2 confirming-fire pattern). 1-iteration-cycle sub-grade pattern N=2 banking continues at brainstorming-side; promotion threshold N=3 if pattern recurs.
- **Local commits ahead of `origin/staging` post-session:** expected 5 (scope-input + Round 1 + Round 2 + Round 3 + this Round 4 artifact). No push; banks for Phase 8 terminal-close push per push-terminal-close N=4 cumulative pattern (N=5 fires at Phase 8 close).

### §6.4 Round 5 prompt inputs

Round 5 directive inputs from this Round 4 close:

**Round 5 scope:** Phase 8 scope-lock cycle close ratification artifact per Path γ-1 separate Round 5 + 10-section Phase 6.5 Option A structural template inheritance.

**Cycle-close lock inheritance**: all 21 sub-question locks per §3 + Round 1-4 dispositions.

**Cycle-close composition surfaces** per §5.1:
- 21-sub-question consolidation by decision-class.
- 10-chunk decomposition per Sub-Q16 + Sub-Q22 inheritance + Sub-Q13 + Sub-Q14 + Sub-Q15.
- Inter-chunk dependency map across 10 chunks + Path C SPLIT inheritance.
- Brief-drafting plan with 10 brief-drafting sessions (potentially compressible).
- 6+ Phase 8 retrospective codification candidate enumeration (THREE N=3 graduations + Layer 2 4 amendments + Layer 3 15 candidates + cross-round compression trajectory + coordination warning + directive-grade self-correction + new banking surfaces).
- Phase 8 cycle metadata + cumulative state catches.
- Handoff to Session 49 chunk 1 brief-drafting.

**Round 5 forecast volume**: ~460-490 LOC per ~25-30% compression below Phase 7 cycle-close anchor 652.

**Round 5 substrate citation corrections inherited**:
- Phase 7 retrospective §6.1 item #A framing correction (ADR-0011 §13 enumeration broaden → ADR-0014 §X consumer-ADR naming per Sub-Q21 21.δ).
- All Layer 2 4-amendment dependency graph locks per Round 2.
- All Round 1-4 sub-question locks.

---

**Round 4 status:** complete. **Final-lock cycle achieved.** 4 clean locks + 100% clean lock rate + 0 founder-decision + 0 net-new sub-questions surfaced. All 21 sub-questions locked at scope-lock-cycle grade. Phase 8 scope-lock cycle ready for Round 5 cycle-close ratification artifact (Path γ-1 separate Round 5 per Phase 7 + Phase 6.5 Option A inheritance). Next operational fire: **Session 48 Phase 8 scope-lock cycle close ratification** per §6.4 prompt inputs.
