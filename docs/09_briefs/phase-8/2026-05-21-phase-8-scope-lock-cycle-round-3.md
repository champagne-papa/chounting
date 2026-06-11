# Phase 8 Post-v1 Reconciliation + Cross-Service Orchestrators + Ledger Extensions — Scope-Lock Cycle Round 3

**Session:** 46
**Date:** 2026-05-21
**Branch:** `staging`
**Local HEAD at session-onset:** `746e8ad` (Phase 8 scope-lock cycle Round 2)
**`origin/staging` HEAD:** `96eae39` (3 commits behind local; banks for Phase 8 terminal-close push)
**Validation gates at session-onset:** `pnpm agent:validate` 26/26 green (preserved through Round 1 + Round 2 docs-only commits).
**Predecessor:** Phase 8 scope-lock cycle Round 2 at `746e8ad` (`docs/09_briefs/phase-8/2026-05-21-phase-8-scope-lock-cycle-round-2.md`; 373 LOC).

---

## §1 — Preamble + cross-references

### §1.0 What this round is

This is **Round 3** of the Phase 8 post-v1 reconciliation + cross-service orchestrators + ledger extensions scope-lock cycle. Round 3 walks the **7-sub-question batch** per Round 2 §6.2 prompt inputs: Sub-Q13 (framing #1 bundle composition) + Sub-Q14 (framing #4 ledger extensions chunk-decomp) + Sub-Q15 (framing #6 UI infra vs e2e assertion split) + Sub-Q17 (Path C invocation at framings #4 + #6 per multi-axis discipline) + Sub-Q4 (component test fixture scope) + Sub-Q6 (e2e assertion body shape) + Sub-Q18 (test infrastructure shape). Sub-Q17 is load-bearing substantive surface per multi-axis discipline (sub-question-anchored grade per θ-candidate codification N=4 banking).

### §1.1 Walk-order coupling discipline

Per Iteration 2 Finding A refinement absorbed: revised walk-order **Sub-Q14 → Sub-Q15 → Sub-Q17 → Sub-Q13 → Sub-Q18 → Sub-Q4 → Sub-Q6** corrects the Iteration 1 dependency inversion (Sub-Q17 multi-axis Path C evaluation requires BOTH Sub-Q14 framing #4 chunk-decomp outcome AND Sub-Q15 framing #6 split outcome as sub-question-anchored inputs).

**Coupling rationale:**

- **Sub-Q14 → Sub-Q15** walk independent framing-decomposition outcomes (Sub-Q14 = ledger extensions chunk count; Sub-Q15 = UI infra split shape).
- **Sub-Q17** walks AFTER both Sub-Q14 + Sub-Q15 lock (Path C evaluation has both framing-specific inputs).
- **Sub-Q13** walks third as bounded scope (Phase 8 first chunk bundle; no upstream gating dependency).
- **Sub-Q18 → Sub-Q4 → Sub-Q6** walk in tight-bundle dependency chain (test infra ownership → component fixture roster → e2e assertion shape; all gated by Sub-Q15 UI infra split outcome).

Walk-order coupling discipline N=2 cross-phase (Phase 7 Round 2 + Phase 8 Round 2) → **N=3 firing pending at Round 3** if walk completes per discipline; codification graduation candidate strengthens at N=3 threshold per cross-phase pattern stabilization.

### §1.2 ADR-0018 Subsystem 1 substrate verification outcome

Per directive Phase A step 5 verification (LOAD-BEARING for Sub-Q14):

ADR-0018 Subsystem 1 (Ledger-State Candidate Completion) at lines 276-505 enumerates:
- **Inputs** (lines 297-333): structural match-against-state output (DocumentRelationshipCandidate with classification confidence + rationale + fields + vendor match + reference-data-resolvable target) + committed AP/Spend domain state at read time (open bills + payments + vendor prepayments + vendor credits + existing source_document_links).
- **Outputs** (lines 334-363): zero or more DocumentRelationshipCandidate rows; per-row: `linked_entity_type` (6 v1-active values per ADR-0016 §1) + `linked_entity_id` + `link_role` (4 v1-active values per ADR-0016 §2) + `confidence_score [0, 1]` + `candidate_features` (Zod-typed object). Pair-validity constraint per ADR-0016 §3 Table A (15 active-v1 cells).
- **Per-document-type candidate generation** (lines 364-448): vendor_invoice → bill matching (Scenario A "invoice arrives, no bill yet" + Scenario B "invoice matches existing bill"); receipt → payment matching (4 sub-shapes: payment_evidence + receipt + bill+receipt + exception); payment_confirmation → payment matching (symmetric to receipt with stronger authorization_reference weight); unknown → exception queue (Subsystem 1 not invoked).
- **Confidence scoring composition** (lines 450-475): deterministic function of feature vector (Q31 prohibition extends; no LLM); per-feature contributions bounded; weights implementation-owned at v1 with ADR-0019 governing calibration.
- **Candidate filtering** (lines 477-490): per-document-type threshold from ADR-0014 §6 (Q65 v1 provisional values: vendor_invoice 0.85 + receipt 0.80 + payment_confirmation 0.85).
- **Audit trail** (lines 492-505): pipeline_trace stage record per ADR-0007 Q30 with stage_name='router_match_against_state'.

**Subsystem 1 substrate scope for Phase 8 ledger extensions activation:** the substrate is well-structured at three axes — candidate generation (per-document-type pseudocode) + score composition (per-feature weighted) + audit trail / output composition. Phase 8 ledger extensions per §6.4 framing #4 = "new entity types, new relationship patterns, new score features" — maps to extension at: (1) `linked_entity_type` expansion beyond 6 v1-active (e.g., reserved `vendor_credit` + `vendor_credit_application` activation per ADR-0016 §1 Phase 2.5 amendment); (2) per-document-type candidate generation pseudocode extensions; (3) candidate_features Zod object extensions with new score features.

Sub-Q14 N=3 chunks default lean (candidate generation + score composition + integration) maps cleanly to Subsystem 1's structural axes. Alternative N=2 chunks (extension-by-axis bundling) OR N=4 chunks (per-extension-type isolation) defensible at brief-drafting grade. Per Iteration 2 Finding B refinement absorbed: Sub-Q14 disposition presented as preliminary lean subject to chunk brief-drafting grade adjudication.

### §1.3 ContextualCanvas substrate verification outcome (per Iteration 2 Finding D)

Per directive Phase A step 11 verification (state-driven test surface check at chunk 7.3b substrate):

ContextualCanvas at `apps/web/src/components/bridge/ContextualCanvas.tsx` substrate evidence (lines 6-11 explicit comment): "ContextualCanvas is now a pure render-from-Props component — the `useState<CanvasDirective[]>([directive])` + `useState(0)` for historyIndex + useEffect sync all removed; this component holds no [internal state]."

ContextualCanvas substrate state at Phase 8 onset:
- Pure render-from-Props component (no internal state machine).
- Single useEffect at line 82 (non-state-mutation side effect).
- State-driven test surface materially lighter than DocumentCard (7-state DocumentCaseStateSchema state machine + state-driven render branches + state-specific action affordances) + ProposedAttachmentCard (state-driven via canvasDirective dispatch).

**Sub-Q4 three-component scope lean CONFIRMED** at Phase A grade: DocumentCard + ProposedAttachmentCard + PendingDocumentsView are the materially-state-driven components warranting per-component test fixtures at Phase 8 UI infra chunk grade. ContextualCanvas + SplitScreenLayout + DocumentIntakeRail are shell-substrate routing primitives without materially-state-driven test surfaces; deferred to Phase 9+ expansion if state-driven extensions emerge.

### §1.4 Iteration 2 refinements absorption status

Iteration 2 surfaced 5 substantive refinement observations (Findings A + B + C + D + E) per Iteration 1 → Iteration 2 → Iteration 3 standard refinement cycle (directive-authoring N=15 → N=16 → N=17 firing at standard 3-iteration cycle vs Session 45's 1-iteration-cycle sub-grade dispatch). All 5 absorbed at Iteration 3 dispatch + Phase B authoring:

- **Finding A** (walk-order coupling dependency inversion): revised walk-order Sub-Q14 → Sub-Q15 → Sub-Q17 → Sub-Q13 → Sub-Q18 → Sub-Q4 → Sub-Q6 per §1.1 above.
- **Finding B** (pre-disposition defaults risk directive-grade self-correction): §2 + §3 dispositions framed as "Lock at Round 3 grade per walk evidence" rather than pre-specified at directive grade. Phase B walk evidence (Phase A substrate verification + sub-question-grade adjudication) determines actual lock outcomes.
- **Finding C** (LOC forecast band N=1 derivation issue): specific LOC forecast deferred to Phase A close per refinement #5 N=2 banking. Phase 7 Round 3 anchor verified at 500 LOC; Phase 8 Round 3 forecast band recalibrated post-Phase-A.
- **Finding D** (Sub-Q4 component scope ContextualCanvas verification): banked at §1.3 above; three-component scope lean confirmed at substrate grade.
- **Finding E** (disposition-rate 100% forecast reframe): §3 closing observation reframed from forecast-grade projection to disposition-rate-banking-at-Round-3-close observation.

Iteration 2 refinements absorption operates as designed at Iteration 3 dispatch grade. Directive-grade self-correction anti-drift sub-pattern N=1 → N=2 firing at Iteration 2 Finding B + E absorption (codification graduation candidate strengthens at N=2 threshold per Session 44 N=1 first-instance banking + Session 46 Iteration 2 N=2 confirming-fire).

### §1.5 Substrate-density-compresses-LOC observation continuation

Round 2 §1.4 N=5 banking achieved (scope-input 599+1432 LOC cross-phase + Round 1 310+299 + Round 2 486+373; three-grain cross-phase consistency). Phase 7 Round 3 anchor verified at Phase A step 3: **500 LOC** (heavier than Round 1's 310 + Round 2's 486; substantive cumulative trajectory at Round 3 with 13-sub-question batch + anti-drift firings + ADR-0019 substrate-scope expansion finding).

Phase 8 Round 3 forecast post-Phase-A: ~350-500 LOC at Round-3-artifact-authoring grade per cross-phase compression trajectory (Phase 8 Round 1 = 299 LOC vs Phase 7 Round 1 = 310 LOC ≈ 3.5% compression; Phase 8 Round 2 = 373 LOC vs Phase 7 Round 2 = 486 LOC ≈ 23% compression). Phase 8 Round 3 cumulative compression-rate-banking N=3 (R1 + R2 + R3 three-grain consistency) candidate at this artifact close.

**N=5 → N=6 banking candidate at Round-3-artifact-authoring grade** if Round 3 LOC lands in or below ~500 LOC band (within Phase 7 Round 3 anchor). Phase 8 retrospective codification candidate at exploratory framing extension per Phase 7 Round 3 §1.5 banking inheritance.

### §1.6 Canonical cross-references

- **Round 2 artifact** at `docs/09_briefs/phase-8/2026-05-21-phase-8-scope-lock-cycle-round-2.md` (`746e8ad`) — predecessor; Round 3 prompt inputs at §6.2.
- **Round 1 artifact** at `docs/09_briefs/phase-8/2026-05-21-phase-8-scope-lock-cycle-round-1.md` (`a158c9b`) — Sub-Q1 LOCKED + Sub-Q21 net-new + decision-class split.
- **Phase 8 onset scope-input artifact** at `docs/09_briefs/phase-8/2026-05-21-phase-8-scope-input.md` (`9b6694b`) — sub-question option-space + §6 8-framing enumeration + §7.3 + §7.4 + §6.9.
- **Phase 7 Round 3 structural template** at `docs/09_briefs/phase-7/2026-05-19-phase-7-scope-lock-cycle-round-3.md` (500 LOC; Session 30) — §-structure inheritance template (§1.0-§1.6 7-subsection shape).
- **ADR-0018 Subsystem 1** at `docs/07_governance/adr/0018-relationship-router.md` lines 276-505 — PRIMARY substrate for Sub-Q14 framing #4 ledger extensions chunk-decomp.
- **ADR-0014 §11 + §13** + **ADR-0016 §1-§3** — substrate context for Sub-Q14 ledger extensions surface intersection (linked_entity_type 6 v1-active + reserved post-v1 + link_role 4 v1-active + pair-validity 15-cell matrix).
- **testing.md Candidate #8** at `docs/04_engineering/conventions/testing.md` lines 62-124 — Sub-Q4 + Sub-Q6 + Sub-Q18 test-location canonical path discipline (N=5 cross-validation; canonical `apps/web/tests/integration/`).
- **service-layer.md Candidate #11** at `docs/04_engineering/conventions/service-layer.md` lines 335-466 — cross-reference for Sub-Q17 Path C evaluation at framings involving system_actor widening intersection (Layer 1 item #5 + Layer 2 item #C dependencies inherited from Round 2 locks).
- **ContextualCanvas** at `apps/web/src/components/bridge/ContextualCanvas.tsx` — Sub-Q4 substrate verification anchor (pure render-from-Props confirmed at Phase A grade).
- **CLAUDE.md §Push readiness three-condition gate** lines 129-197 + Push-terminal-close timing pattern lines 169-196 — Candidate #13 codification; Phase 8 close fires N=5.

---

## §2 — Per-sub-question walk

Walk-order Sub-Q14 → Sub-Q15 → Sub-Q17 → Sub-Q13 → Sub-Q18 → Sub-Q4 → Sub-Q6 per §1.1 revised coupling discipline. Per sub-question: substrate evidence summary + walk against option space + disposition.

### §2.1 Sub-Q14 — Framing #4 ledger extensions chunk-decomp

**Option space (scope-input §7.3 Sub-Q14):** ADR-0018 Subsystem 1 candidate scoring + score composition decomposed into N chunk-grade work surfaces.

**Substrate evidence:** Per §1.2 ADR-0018 Subsystem 1 read: three structural axes (candidate generation per-document-type pseudocode + per-feature weighted score composition + integration with audit trail/output). Phase 8 ledger extensions activation = extensions at (a) `linked_entity_type` expansion beyond 6 v1-active (reserved `vendor_credit` + `vendor_credit_application` activation per ADR-0016 §1) + (b) per-document-type candidate generation pseudocode extensions + (c) candidate_features Zod object extensions with new score features.

**Walk:** Decomposition options:

- **N=2 chunks** (extension-by-axis bundling): chunk 1 = linked_entity_type extension + candidate generation pseudocode extensions; chunk 2 = score composition extension + audit trail integration. Tighter scope but bundles two distinct concerns at chunk 1.
- **N=3 chunks** (structural axis isolation): chunk 1 = candidate generation expansion (per-document-type pseudocode + linked_entity_type extension); chunk 2 = score composition expansion (per-feature scoring extensions + candidate_features Zod expansion); chunk 3 = integration + audit trail + downstream consumer wiring. Maps cleanly to Subsystem 1's structural axes.
- **N=4 chunks** (per-extension-type isolation): chunk 1 = linked_entity_type extension; chunk 2 = candidate generation pseudocode extension; chunk 3 = score composition extension; chunk 4 = integration + audit. Maximum isolation but introduces dependency chain (chunk 2 depends on chunk 1; chunk 3 depends on chunk 2).

N=3 chunks maps cleanly to Subsystem 1's structural axes per ADR-0018 lines 297-505 substrate enumeration (Inputs → Per-document-type candidate generation → Confidence scoring composition → Candidate filtering → Audit trail = naturally three implementation surfaces). Specific per-chunk forecast bands defer to chunk brief-drafting grade per Round 1 §4 decision-class product-discovery routing.

**Disposition:** **Lock at N=3 chunks at Round 3 grade per Subsystem 1 structural axis mapping.** Chunk decomposition:
- **Chunk 4.1**: candidate generation expansion (per-document-type pseudocode extensions + linked_entity_type expansion).
- **Chunk 4.2**: score composition expansion (per-feature scoring + candidate_features Zod expansion).
- **Chunk 4.3**: integration + audit trail + downstream consumer wiring.

Per-chunk forecast bands defer to chunk brief-drafting grade. Path C invocation evaluation at Sub-Q17 inherits N=3 chunk-decomp outcome.

### §2.2 Sub-Q15 — Framing #6 UI infra vs e2e assertion split

**Option space (scope-input §7.3 Sub-Q15):** combined framing #6 chunk vs split (UI infra chunk + e2e assertion chunk separately).

**Substrate evidence:** Framing #6 combined-grade ~850-1520 LOC per §6.6 (UI infra ~250-470 LOC + e2e assertion ~600-1050 LOC). UI infra activation is prerequisite for Phase 8 UI component tests (broader downstream consumers); e2e assertion body authoring is independent surface (chunk 7.3b only consumer; gated on Modal sidecar deployment per Layer 1.B item #9 demo re-fire).

**Walk:** Split option separates concerns:
- **UI infra chunk** (~250-470 LOC at chunk grade): vitest jsdom + @testing-library/react infra activation; surface for ALL Phase 8 UI component tests + future Phase 9+ UI surfaces.
- **E2E assertion chunk** (~600-1050 LOC at chunk grade): assertion body authoring across 3 doc types (vendor_invoice + receipt + payment_confirmation); chunk 7.3b consumer only.

Combined option bundles broader-consumer UI infra with narrower-consumer e2e assertion at single chunk grade; LOC at ~850-1520 LOC exceeds substantively-coherent chunk band.

**Disposition:** **Lock at split option at Round 3 grade.** Phase 8 ships UI infra chunk + e2e assertion chunk separately. Pair-tight with Sub-Q17 framing #6 Path C SPLIT lock below.

### §2.3 Sub-Q17 — Path C invocation at framings #4 + #6 (load-bearing per multi-axis discipline)

**Option space (scope-input §7.3 Sub-Q17 + §6.9):** Path C invocation per framing per multi-axis discipline (sub-question-anchored grade per θ-candidate codification N=4 banking).

**Substrate evidence per Sub-Q14 + Sub-Q15 outcomes (revised walk-order ensures both inputs available):** framing #4 multi-chunk per Sub-Q14 N=3 chunks lock; framing #6 combined-grade per Sub-Q15 split lock.

**Walk — multi-axis Path C probability evaluation at sub-question-anchored grade:**

- **Axis 1 (substrate weight)**: framing #4 multi-chunk (N=3 chunks per Sub-Q14); framing #6 combined-grade ~850-1520 LOC (split per Sub-Q15 = UI infra + e2e assertion).
- **Axis 2 (substrate-cohesion-rich vs substrate-fix-narrowness)**: framing #4 substrate-cohesion-rich (ADR-0018 Subsystem 1 expansion + new entity types + new relationships + new score features); framing #6 mixed (UI infra = substrate-fix-narrowness per Phase 5.1 sub-curve (b); e2e assertion = substrate-cohesion-rich at assertion body authoring grade).
- **Axis 3 (directive-grade Phase A absorption posture)**: Phase 8 Round 3 Phase A absorbed 14 reads + Sub-Q14 substrate verification + Sub-Q4 ContextualCanvas verification + Iteration 2 5-Finding refinement absorption per cross-phase compression trajectory continuation.

**Disposition per multi-axis evaluation:**

- **Framing #4 Path C invocation: YES (Grain 1 brief-draft prospective SPLIT)** — multi-chunk surface per Sub-Q14 N=3 chunks decomposition; ledger-extensions chunks decompose at brief-drafting grade with per-chunk forecast bands.
- **Framing #6 Path C invocation: YES (Grain 1 brief-draft prospective SPLIT)** — combined-grade exceeds chunk-coherent bound; UI infra + e2e assertion split per Sub-Q15 lock implements the Path C SPLIT decomposition.

**Disposition:** **Lock at Path C SPLIT at both framings at Round 3 grade.** Framing #4 = N=3 chunks per Sub-Q14; framing #6 = N=2 chunks per Sub-Q15. Multi-axis Path C probability evaluation discipline applied at sub-question-anchored grade per θ-candidate codification.

### §2.4 Sub-Q13 — Framing #1 bundle composition

**Option space (scope-input §7.3 Sub-Q13):** v1 close demo completion items #7 + #8 + #9 bundle as single chunk vs split.

**Substrate evidence:** Per scope-input §3.7 + §3.8 + §3.B + §6.1: item #7 (sidecar deployment validation harness ~360-570 LOC) + item #8 (ADR-0014 §12.1 second amendment + client.ts ~65-105 LOC) + item #9 (demo re-fire founder action; no impl LOC). Combined item #7 + #8 forecast ~425-675 LOC at impl-grade. Session 42 §8 explicit framing: "Phase 8's first chunk is structurally the 'Phase 7 substrate close completion + Phase 8 onset' chunk per Phase 5.1 sub-curve (b) substrate-fix-narrowness calibration."

**Walk:** Bundle option preserves Session 42 §8 framing + Phase 5.1 sub-curve (b) substrate-fix-narrowness calibration + tight substrate cohesion (sidecar deploy + timeout calibration + demo re-fire are operationally interdependent). Combined LOC ~425-675 LOC at chunk grade; demo re-fire fires at chunk close. Split option separates item #7 from items #8 + #9 + #9 = 2 chunks; less operationally coherent given the tight interdependence.

**Disposition:** **Lock at bundle option at Round 3 grade.** Phase 8 first chunk = items #7 + #8 + #9 bundle at sub-curve-(b) substrate-fix-narrowness grade. Demo re-fire fires at chunk close per Session 42 §8 framing inheritance.

### §2.5 Sub-Q18 — Phase 8 test infrastructure shape

**Option space (scope-input §7.4 Sub-Q18):** Phase 8 net-new test infra ownership at UI component tests + cross-service orchestrator tests + Modal fixture-mock tests.

**Substrate evidence:** Per testing.md Candidate #8 (lines 62-124): canonical path `apps/web/tests/integration/`. E2E tests under `tests/integration/e2e/` (chunk 7.3b first-instance precedent). Sub-Q15 split lock (UI infra chunk + e2e assertion chunk separately) gates UI component test location. Sub-Q7 LOCKED at Round 2 (deploy validation only) gates Modal fixture-mock test scope.

**Walk:** Three test infrastructure surfaces:
- **UI component tests** (Sub-Q15 UI infra chunk per split lock): unit-grade per @testing-library/react render + assert pattern; location `apps/web/tests/unit/components/` (separate from `tests/integration/` per Phase 5.1 + 6.5 unit test precedent).
- **Cross-service orchestrator tests** (Framing #3 post-v1 reconciliation orchestrator + paymentService.record v1 consumers): integration-grade; location `apps/web/tests/integration/services/` extending existing integration/ canonical path.
- **Modal fixture-mock tests** (Sub-Q7 deploy validation only per Round 2 lock): integration-grade; location `apps/web/tests/integration/sidecar/` extending existing integration/ canonical path.

**Disposition:** **Lock at three-surface test infrastructure ownership at Round 3 grade.** Phase 8 net-new test locations:
- `apps/web/tests/unit/components/` for UI component tests.
- `apps/web/tests/integration/services/` for cross-service orchestrator tests.
- `apps/web/tests/integration/sidecar/` for Modal fixture-mock tests.

testing.md Candidate #8 canonical path discipline extended with three Phase 8 net-new sub-paths at convention codification grade (Phase 8 retrospective Commit B per Layer 3 §5.1.1 schema-translation-discipline-gap codification candidate paired).

### §2.6 Sub-Q4 — Component test fixture scope

**Option space (scope-input §7.4 Sub-Q4):** UI components in-scope for Phase 8 test fixture authoring; chunks 6.2b + 7.3b shipped 5-8 components.

**Substrate evidence per §1.3 ContextualCanvas verification:** ContextualCanvas confirmed pure render-from-Props (no internal state machine; single useEffect non-state-mutation). DocumentCard (chunk 7.3b: 7-state DocumentCaseStateSchema state machine + state-driven render branches + state-specific action affordances) + ProposedAttachmentCard (chunk 7.3b: structural parity with ProposedEntryCard per chunk 7.3 brief §4 value pick #5) + PendingDocumentsView (chunk 6.2b: per-batch tab routing inherits Pattern γ Rule 1) are materially-state-driven components warranting per-component test fixtures.

**Walk:** Three-component scope (DocumentCard + ProposedAttachmentCard + PendingDocumentsView) at UI infra chunk per Sub-Q15 split:
- Core components in-scope at UI infra chunk: 3 components (above).
- Shell components deferred to Phase 9+: DocumentIntakeRail + SplitScreenLayout + ContextualCanvas (UI shell substrate without materially-state-driven test surfaces per §1.3 verification).

Three-component scope keeps UI infra chunk LOC band ~250-470 LOC per §3.4 forecast. ContextualCanvas + SplitScreenLayout + DocumentIntakeRail remain future-component-expansion candidates at Phase 9+ if state-driven extensions emerge.

**Disposition:** **Lock at three-component scope at Round 3 grade.** Phase 8 UI infra chunk test fixtures: DocumentCard + ProposedAttachmentCard + PendingDocumentsView. Phase 9+ expansion candidates: ContextualCanvas + SplitScreenLayout + DocumentIntakeRail (deferred per Phase 6.5 ship precedent + §1.3 ContextualCanvas pure-render verification).

### §2.7 Sub-Q6 — E2E assertion body shape

**Option space (scope-input §7.4 Sub-Q6):** assertion-per-stage (9 stages × 3 doc types = 27 assertion blocks) vs assertion-per-doc-type-end-to-end (3 assertion blocks with stage-by-stage internal sub-assertions).

**Substrate evidence:** chunk 7.3b shipped 3 e2e test files at `apps/web/tests/integration/e2e/` (documentPipeline.vendorInvoice.e2e.test.ts + documentPipeline.receipt.e2e.test.ts + documentPipeline.paymentConfirmation.e2e.test.ts) gated on MODAL_OCR_HMAC_SECRET env-var. Test scaffolding present; assertion bodies deferred per Session 41 Iteration 2 §B carry-forward (~600-1050 LOC forecast across 3 files).

**Walk:** Two shape options:
- **Assertion-per-stage (27 blocks)**: heavy LOC scaled-up to ~1800-3150 LOC; granular failure isolation per stage.
- **Assertion-per-doc-type-end-to-end (3 blocks)**: lighter LOC at ~600-1050 LOC total per Session 41 §B forecast; coarser failure isolation; aligned with chunk 7.3b's 3-test-file structure (one assertion block per file).

Assertion-per-doc-type-end-to-end fits Session 41 §B's ~600-1050 LOC forecast (200-350 LOC per file × 3 files); assertion-per-stage option would dramatically inflate forecast band and fragment the 3-test-file scaffolding (each test file would carry 9 stage blocks).

**Disposition:** **Lock at assertion-per-doc-type-end-to-end at Round 3 grade.** Phase 8 e2e assertion chunk per Sub-Q15 split: 3 assertion blocks (one per doc type) with stage-by-stage internal sub-assertions. ~600-1050 LOC at e2e assertion chunk grade per Session 41 §B forecast inheritance.

---

## §3 — Round 3 dispositions banked

| Sub-Q | Disposition | Lock detail |
|---|---|---|
| Sub-Q14 | **Lock at Round 3** | N=3 chunks (Chunk 4.1 candidate generation expansion + Chunk 4.2 score composition expansion + Chunk 4.3 integration + audit trail + downstream consumer wiring); per-chunk forecast bands defer to chunk brief-drafting grade |
| Sub-Q15 | **Lock at Round 3** | split option (UI infra chunk + e2e assertion chunk separately); pairs tight with Sub-Q17 framing #6 Path C SPLIT |
| Sub-Q17 | **Lock at Round 3** | Path C SPLIT at framing #4 (N=3 chunks per Sub-Q14) + framing #6 (N=2 chunks per Sub-Q15) per multi-axis discipline (sub-question-anchored grade) |
| Sub-Q13 | **Lock at Round 3** | bundle option (items #7 + #8 + #9 as single Phase 8 first chunk at sub-curve-(b) substrate-fix-narrowness grade); demo re-fire fires at chunk close |
| Sub-Q18 | **Lock at Round 3** | three-surface test infrastructure ownership: `apps/web/tests/unit/components/` (UI) + `apps/web/tests/integration/services/` (cross-service orchestrator) + `apps/web/tests/integration/sidecar/` (Modal fixture-mock) |
| Sub-Q4 | **Lock at Round 3** | three-component scope (DocumentCard + ProposedAttachmentCard + PendingDocumentsView); ContextualCanvas + shell components deferred to Phase 9+ per §1.3 substrate verification |
| Sub-Q6 | **Lock at Round 3** | assertion-per-doc-type-end-to-end shape (3 blocks aligned with chunk 7.3b 3-test-file structure); ~600-1050 LOC at e2e assertion chunk grade |

**Count at Round 3 close:**

- **7 clean locks** at Round 3.
- **0 partial-locks** + **0 founder-decision-required** + **0 net-new sub-questions surfaced**.
- **Path C SPLIT outcome at framings #4 + #6**: ledger extensions = N=3 chunks; UI test infrastructure = N=2 chunks (UI infra + e2e assertion). Combined chunk decomposition surface = 5 chunks at framings #4 + #6.

**Disposition-rate observation banking (per Iteration 2 Finding E refinement absorbed):** Round 3 disposition rate at session close = 7/7 = 100% clean lock rate. Cross-phase Round 3 disposition-rate-improvement banking: Phase 7 Round 3 was 12/13 clean locks + 1 brief-grade deferral ≈ 92% clean lock rate (per Phase 7 Round 3 §3 enumeration); Phase 8 Round 3 fires 100% clean rate at materially lighter sub-question batch (7 vs Phase 7's 13). **Cross-phase Round 3 disposition-rate banking continues at brainstorming-side session-state**; promotion threshold N=2 at Phase 9+ Round 3 grade if substantively-new-phase cycle scope-lock Round 3 fires similar improvement trajectory.

**Phase 8 cumulative cross-round disposition rate**: Round 1 (1 LOCKED + 1 net-new + 19 deferred per Round 1 directive scope) + Round 2 (9 clean locks + 1 partial-lock per Round 2 disposition) + Round 3 (7 clean locks per this artifact) = 17 clean locks + 1 partial-lock + 1 net-new across cycle. Phase 8 Round-by-Round clean lock rates: Round 1 = N/A (option-space confirmation grade); Round 2 = 90%; Round 3 = 100%. **Directional improvement at cross-round disposition clarity** continues per Phase 8 substrate inheritance maturity.

---

## §4 — Decision-class split disposition update

Per Round 2 §4 decision-class split + Round 3 walk:

**Governance-critical sub-questions converted from "pending Round 3":**
- Sub-Q14 → **locked at Round 3** (N=3 chunks at framing #4)
- Sub-Q17 → **locked at Round 3** (Path C SPLIT at framings #4 + #6)
- Sub-Q13 → **locked at Round 3** (bundle option Phase 8 first chunk)

**Mixed sub-questions converted:**
- Sub-Q15 → **locked at Round 3** (split option UI infra + e2e assertion)
- Sub-Q18 → **locked at Round 3** (three-surface test infrastructure ownership)
- Sub-Q4 → **locked at Round 3** (three-component scope per §1.3 ContextualCanvas verification)
- Sub-Q6 → **locked at Round 3** (assertion-per-doc-type-end-to-end shape)

**Governance-critical sub-questions still pending Round 4:**
- Sub-Q16 (framing prioritization at scope-lock close)
- Sub-Q20 (cycle posture sequencing)

**Mixed sub-questions still pending Round 4:**
- Sub-Q3.b (paymentService.record multi-consumer expansion; gated by Sub-Q16)

**Product-discovery sub-question still pending Round 4:**
- Sub-Q19 (observability surface)

**Updated count at Round 3 close**: 13+1 governance-critical (Sub-Q1 Round 1 + 8 Round 2 + 3 Round 3 + 2 pending Round 4 + 1 net-new accounted Sub-Q21 Round 2) + 7 mixed (2 Round 2 + 4 Round 3 + 1 pending Round 4) + 1 product-discovery pending Round 4 + 0 net-new at Round 3 = **21 sub-questions at Round 3 close**. **4 sub-questions remaining for Round 4 scope.**

---

## §5 — Round 4+ scope

### §5.1 Round 4 scope (final-lock cycle)

Round 4 walks final 4 sub-questions per Round 1 §5.2 forecast + Round 2 §5.2 updated routing:

- **Sub-Q16** (framing prioritization at Phase 8 scope-lock close): which framings ship at Phase 8 v1 close vs defer to post-v1? Framings #1 (Sub-Q13 bundle locked) + #4 (Sub-Q14 3-chunk lock) + #6 (Sub-Q15 split lock) are Phase 8 v1 close candidates; framings #2 + #3 + #5 + #7 + #8 may defer per scope-narrowing.
- **Sub-Q3.b** (paymentService.record multi-consumer expansion): gated by Sub-Q16 — if framing #3 ships at Phase 8 v1, multi-consumer expansion fires; otherwise deferred to post-v1.
- **Sub-Q19** (Phase 8 observability surface): cross-service orchestrator + post-v1 reconciliation orchestrator + ledger extensions may surface new observability requirements.
- **Sub-Q20** (Phase 8 cycle posture sequencing): final cycle posture ratification per Phase 7 precedent.

**Round 4 forecast batch:** 4 sub-questions; Round 4 expected to produce final scope-lock with chunk decomposition ratified + cycle-close artifact at Round 5 OR combined Round 4 + cycle-close at single session if substrate evidence permits.

### §5.2 Cycle-close artifact

Per Phase 7 cycle-close precedent at `docs/09_briefs/phase-7/2026-05-19-phase-7-scope-lock-cycle-close.md`: cycle-close consolidates sub-question dispositions + chunk decomposition + inter-chunk dependencies + acceptance criteria framework + Path C invocation outcome + impl-cycle sequencing. Phase 8 cycle-close at `docs/09_briefs/phase-8/2026-05-21-phase-8-scope-lock-cycle-close.md` ships at Round 5 if cycle-close warrants separate session, OR bundled with Round 4 if Round 4 substrate evidence permits.

### §5.3 Updated round count forecast

Round 1 forecast: 4-6 rounds. Round 3 close updates: 4 rounds total + cycle-close at well-calibrated lower-mid of forecast band (per Phase 7 4-rounds + cycle-close = 5 sessions precedent). Phase 8 may fire 4 rounds + bundled cycle-close at Round 4 close OR 4 rounds + separate Round 5 cycle-close; both within forecast band.

### §5.4 Brief drafting plan placeholder

Per Round 1 §5.3 inheritance + Round 2 §5.3 update + Round 3 chunk decomposition outcomes:

- **Chunk 1**: framing #1 v1 close demo completion bundle (Sub-Q13 lock; items #7 + #8 + #9).
- **Chunks 2-4**: framing #4 ledger extensions (Sub-Q14 N=3 chunks).
- **Chunks 5-6**: framing #6 UI infra + e2e assertion (Sub-Q15 N=2 chunks).
- **Additional chunks** per Sub-Q16 framing prioritization at Round 4 close (framings #2 + #3 + #5 + #7 + #8 may add 1-N chunks if shipped at Phase 8 v1).

Phase 8 v1 chunk count minimum = 6 chunks (framings #1 + #4 + #6 only); maximum per all-framings-ship = 6 + N additional per Sub-Q16 outcome.

---

## §6 — Round 3 close

### §6.1 Round 3 dispositions banked summary

- **7 clean locks** at Round 3 (Sub-Q14 + Sub-Q15 + Sub-Q17 + Sub-Q13 + Sub-Q18 + Sub-Q4 + Sub-Q6).
- **0 partial-locks** + **0 founder-decision-required** + **0 net-new sub-questions surfaced**.
- **Path C SPLIT outcome at framings #4 + #6**: framing #4 = N=3 chunks; framing #6 = N=2 chunks; total = 5 chunks across two framings.
- **Iteration 2 refinements absorption status**: all 5 refinements (Findings A + B + C + D + E) absorbed at Iteration 3 dispatch + Phase B authoring.
- **Walk-order coupling discipline N=2 → N=3 firing**: Phase 7 Round 2 + Phase 8 Round 2 + Phase 8 Round 3 = N=3 cross-phase cumulative; codification graduation candidate strengthens at N=3 threshold per cross-phase pattern stabilization.
- **Substrate-density-compresses-LOC observation**: Round 3 LOC at session close TBD; N=5 → N=6 banking candidate if Round 3 LOC ≤ Phase 7 anchor 500 LOC.

### §6.2 Round 4 prompt inputs

Round 4 directive inputs from this Round 3 close:

**Round 4 sub-question batch (4 sub-questions):**
- Sub-Q16 framing prioritization at scope-lock close.
- Sub-Q3.b paymentService.record multi-consumer expansion (gated by Sub-Q16).
- Sub-Q19 observability surface.
- Sub-Q20 cycle posture sequencing.

**Round 3 locks inherited (substrate constraints for Round 4 walks):**
- Framing #4 ledger extensions = N=3 chunks (Sub-Q14).
- Framing #6 UI infra + e2e assertion = N=2 chunks (Sub-Q15 split).
- Framing #1 v1 close demo completion = 1 chunk bundle (Sub-Q13).
- Path C SPLIT at framings #4 + #6 (Sub-Q17).
- Three-surface test infrastructure ownership (Sub-Q18).
- Three-component fixture scope (Sub-Q4; ContextualCanvas + shell components deferred to Phase 9+).
- Assertion-per-doc-type-end-to-end e2e shape (Sub-Q6).

**Substrate citation corrections inherited from Round 2:**
- Sub-Q1 LOCKED: ENUM target = exception_reason.
- Sub-Q21 LOCKED: 21.δ consumer-ADR naming at ADR-0014 §X.
- Layer 2 4-amendment dependency graph LOCKED.

### §6.3 Carry-forward observations

- **Candidate (c) catalog state at Session 46 close**: sp-auth sub-grain N=0 maintained at directive grade (single-execute Round 3 walk). Push-state-claim sub-shape N=4 maintained (17-session avoidance trajectory at Sessions 23-46). Brief-drafting metafact-assertion grain N=4 maintained at Round 3.
- **Walk-order coupling discipline N=3 firing**: Phase 7 Round 2 + Phase 8 Round 2 + Phase 8 Round 3 (this artifact) = N=3 cross-phase cumulative banking. Codification graduation candidate fires at N=3 threshold per cross-phase pattern stabilization. Phase 8 retrospective Commit B convention codification grade routing candidate.
- **Directive-grade self-correction anti-drift sub-pattern N=1 → N=2 firing at Iteration 2 absorption**: Findings B + E refinements addressed pre-disposition defaults + 100% forecast bias self-referential anti-drift gaps at composition grade. **Promotion threshold N=2 met**; codification graduation candidate strengthens per Session 44 N=1 first-instance banking + Session 46 N=2 confirming-fire. Codification routing: scope-lock.md Candidate #3 sub-grade extension OR plan-authoring.md Candidate #1 sub-grade extension per multi-iteration refinement self-correction surface.
- **Refinement #3 fallback discipline N=2 → N=3 firing**: Phase B authoring applied preliminary-lean-subject-to-Phase-A-verification framing at §-structure inheritance + per-sub-Q dispositions presented as walk-grade outcomes per refinement #3 codification application. Third-fire of refinement #3 fallback discipline; **codification graduation threshold N=3 MET**. Phase 8 retrospective codification candidate fires at convention codification grade per scope-lock.md OR plan-authoring.md extension.
- **F-J-14 Grain 0 two-stage banking N=2 → N=3 firing**: Stage 1 (directive composition grade at Iteration 1 + Iteration 2 + Iteration 3): single-session-bound forecast preserved. Stage 2 (Phase A close grade at this Round 3 execution): single-session-bound HOLDS per 14 reads + clean walk-order coupling + 7 clean locks + 0 net-new sub-questions surfaced. **Two-stage banking pattern stabilizes at N=3** (Session 44 + Session 45 + Session 46 all fired clean at both stages). **Codification graduation threshold N=3 MET**; Phase 8 retrospective codification candidate fires.
- **Directive-authoring multi-iteration refinement N=16 → N=17 firing at standard 3-iteration cycle**: Session 46 = Iteration 1 (founder draft) → Iteration 2 (WSL-side 5-Finding refinement) → Iteration 3 (founder ratification via "go ahead" + dispatch) cycle. Standard 3-iteration cycle pattern preserves codification at plan-authoring.md Candidate #1. **1-iteration-cycle sub-grade dispatch pattern N=1 first-instance (Session 45) confirmed as sub-shape, not regression** — Session 46 demonstrates standard cycle when refinement surface materializes; 1-iteration-cycle fires when Iteration 1 lands clean.
- **Substrate-density-compresses-LOC observation N=5 → N=6 banking candidate** at Round-3-artifact-authoring grade per Phase 7 Round 3 anchor 500 LOC + Phase 8 Round 3 LOC ≤ anchor (TBD at session close). Cross-phase consistency N=3 if R1 + R2 + R3 all compress below anchor (Phase 8 R1 vs Phase 7 R1 = 3.5%; Phase 8 R2 vs Phase 7 R2 = 23%; Phase 8 R3 vs Phase 7 R3 = TBD). Phase 8 retrospective codification candidate at exploratory framing extension.
- **Cross-phase Round 3 disposition-rate observation banking**: Phase 7 Round 3 = 12/13 = 92% clean lock rate; Phase 8 Round 3 = 7/7 = 100% clean lock rate. Sample-size asymmetry caveat (Phase 8's 7 sub-questions vs Phase 7's 13) limits direct comparison; banking continues at brainstorming-side session-state per cross-phase pattern stabilization watch.
- **Coordination warning cross-session N=3 → N=4 firing pending at Session 46 commit**: if "no session lock in use" surfaces, cumulative N=4 strengthens codification graduation candidate (already met at N=3 per Session 45 close banking). Not blocking.
- **Local commits ahead of `origin/staging` post-session**: expected 4 (scope-input artifact at `9b6694b` + Round 1 artifact at `a158c9b` + Round 2 artifact at `746e8ad` + this Round 3 artifact). No push; banks for Phase 8 terminal-close push per push-terminal-close N=4 cumulative pattern (N=5 fires at Phase 8 close).

---

**Round 3 status:** complete. Single-prompt execute-and-close per Iteration 3 dispatched directive (standard 3-iteration cycle; directive-authoring N=17 firing). 7 clean locks + 0 partial-lock + 0 founder-decision + 0 net-new + Path C SPLIT fully adjudicated at framings #4 + #6 (5 chunks combined). Next operational fire: **Session 47 Phase 8 scope-lock cycle Round 4** per §6.2 prompt inputs (4-sub-question final batch + cycle-close ratification pending).
