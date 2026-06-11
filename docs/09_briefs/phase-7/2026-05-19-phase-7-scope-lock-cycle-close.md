# Phase 7 Extraction Pipeline — Scope-Lock Cycle Close Ratification + Brief-Drafting Plan

**Session:** 32
**Date:** 2026-05-19
**Branch:** `staging`
**Local HEAD at session-onset:** `4dd36b0` (Phase 7 scope-lock cycle Round 4)
**`origin/staging` HEAD:** `4aea7e2` (5 commits behind local; banks for Phase 7 terminal-close push)
**Validation gates at session-onset:** `pnpm agent:validate` 26/26 green (preserved through Round 4 docs-only commit + Round 5 HALT + Option A founder selection).
**Cycle-close structural template:** Phase 6.5 precedent (Option A per founder selection at Session 32 brainstorming-side ↔ founder adjudication; cross-phase observation banked at §4).

---

## §1 — Preamble + cycle pattern

### §1.0 What this artifact is

This is the **Phase 7 extraction pipeline scope-lock cycle close ratification artifact** consolidating the 27-sub-question scope-lock cycle output across 4 rounds + scope-input artifact + Round 5 HALT-and-resume on Option A selection. The artifact mirrors Phase 6.5 cycle-close structural template (10-section format) per founder-grade adjudication at Session 32 condition (e) trigger.

The artifact closes the Phase 7 scope-lock cycle at substantive-shape grade; next operational fire is **chunk 7.1 brief-drafting at Session 33** per §9 handoff.

### §1.1 Phase 7 scope-lock cycle progression

| Round | Session | Date | LOC | Commit | Disposition |
|---|---|---|---|---|---|
| Scope-input | 27 | 2026-05-19 | 599 | `8ae3886` | 25 sub-questions catalogued + 13 VFD targets pre-allocated |
| Round 1 | 28 | 2026-05-19 | 310 | `2d97efe` | VFD pass + 26 sub-questions option-space confirmed + 5 substrate divergences absorbed + Sub-Q26 surfaced |
| Round 2 | 29 | 2026-05-19 | 486 | `9b8d0af` | 10-sub-question governance-critical batch; 5 clean locks + 4 partial locks + 1 founder-decision (Sub-Q5) + Sub-Q27 surfaced + Sub-Q1 directive-realignment finding |
| Round 3 | 30 | 2026-05-19 | 500 | `aa3d3c8` | 13-sub-question module placement + classifier + extractor + column-shape batch; 12 clean locks + 1 brief-grade deferral + 2 anti-drift prospective firings |
| Round 4 | 31 | 2026-05-19 | 442 | `4dd36b0` | 7-sub-question UI consumer + chunk decomposition + observability batch; final-lock cycle complete; 7 clean locks + 3 anti-drift prospective firings; all 27 sub-questions locked |
| Round 5 | 32 | 2026-05-19 | this artifact | (pending) | Cycle-close ratification artifact + brief-drafting plan per Option A founder selection |

**Validation gates green at every commit boundary**; `pnpm agent:validate` 26/26 preserved through 5-commit sequence + Round 5 HALT-and-resume.

### §1.2 Cycle pattern — "Anti-drift prospective-firing discipline + multi-iteration directive refinement"

Phase 7's scope-lock cycle exhibited two structural patterns worth naming for retrospective codification:

**Anti-drift prospective-firing discipline.** Pre-enumerated anti-drift framings at directive grade caught option-space-framing-against-substrate drift before reactive walk-grade discovery. Round 3 fired 2 prospective catches (Sub-Q12 conflation + Sub-Q13 directive-candidate-drift); Round 4 fired 3 prospective catches (Sub-Q15.b pre-emptive-deferral-lean + Sub-Q19 naming-convention drift + Sub-Q21 catalog-grain-characterization drift); Round 5 HALT fired condition (e) trigger (Phase 5.1 + Phase 6.5 cycle-close artifact precedent inconsistency) at Phase A reads grade. N=6 cumulative firings.

**Multi-iteration directive refinement.** Sessions 29 + 30 + 31 + 32 all fired three-iteration cycles (initial draft → refinement notes → refined directive) at directive grade. The pattern functions as forcing function for prospective discipline application; refinement notes catch potential walk-grade drift at directive grade before walk-grade evidence arrives. N=4 cumulative firings.

Both patterns are codification candidates at Phase 7 retrospective grade; see §4 enumeration.

### §1.3 Cycle close disposition

**ALL 27 sub-questions LOCKED at scope-lock-cycle grade**, with appropriate brief-grade deferrals for product-discovery sub-axes. **Final-lock cycle complete at Round 4; cycle-close ratification at Round 5 per Option A founder selection.**

Phase 7 scope-lock cycle CLOSES at Round 5. Next operational fire: chunk 7.1 brief-drafting at Session 33 per §9 handoff.

---

## §2 — Cycle output index

Forward-reader navigation. The artifact's section structure and what each section answers:

- **§1 Preamble + cycle pattern** — what this artifact is + cycle progression + cycle pattern naming.
- **§2 Cycle output index** — this section; forward-reader navigation.
- **§3 Sub-question lock consolidation** — all 27 sub-questions × disposition + governing ADR + decision-class + locking-round.
- **§4 Phase 7 retrospective codification candidate enumeration** — 6 codification candidates + cross-phase observation + per-candidate sub-grain refinement.
- **§5 Chunk decomposition + shipping order + per-chunk acceptance criteria framework** — chunk 7.1/7.2/7.3 substantive content + shipping sequence + acceptance criteria framing for brief-drafting cycle.
- **§6 Inter-chunk dependency map** — substrate + service + UI consumer dependencies across chunks.
- **§7 Brief-drafting plan + partial-information items inventory** — per-chunk brief-drafting session enumeration + retrospective-candidate operational-relevance flagging + partial-information items per chunk.
- **§8 Cycle metadata + cumulative state catches** — rounds fired + substrate baseline at cycle close + cumulative state catches + candidate (c) catalog evolution.
- **§9 Handoff to chunk 7.1 brief-drafting (Session 33)** — next-step trigger + cycle-close commit shape + Session 33 directive prompt inputs.
- **§10 Cross-references** — cycle lineage + governance forward-pointers + ADRs + code surfaces + substrate migrations + governance precedents.

---

## §3 — Sub-question lock consolidation

All 27 sub-questions × lock disposition + governing ADR + decision-class + locking-round. Subsections by decision class per Round 1 §4 split + brief-grade deferral framing per Round 3 + Round 4 dispositions.

### §3.1 Governance-critical sub-questions (17 of 17 LOCKED)

| Sub-Q | Disposition | Governing ADR | Locking round | Lock detail |
|---|---|---|---|---|
| Sub-Q1 | LOCKED | ADR-0020 §1 | Round 2 (placement) + Round 3 (subdivision) | `apps/web/src/agent/orchestrator/extraction/` subdirectory |
| Sub-Q1.b | LOCKED | (Sub-Q1 inheritance) | Round 3 | flat module layout within `extraction/` |
| Sub-Q2 | LOCKED | ADR-0007 Q31 + ADR-0014 §1 | Round 2 | sync v1 invocation; queue substrate post-v1 |
| Sub-Q5 | LOCKED | ADR-0014 §3 | Session 29 founder-decision | Path A — in-Phase-7 chunk 7.1 absorbs Modal substrate |
| Sub-Q7 | LOCKED | ADR-0014 §7 | Round 3 | highest-confidence-first |
| Sub-Q8 | LOCKED | ADR-0014 §7 | Round 3 | binary match-or-no-match short-circuit |
| Sub-Q11 | LOCKED | ADR-0014 §1 + §8 | Round 2 (module structure) + Round 3 (placement) | per-document-type extractor modules at `agent/orchestrator/extraction/` flat |
| Sub-Q11.b | LOCKED | (Sub-Q11 inheritance) | Round 3 | flat within extraction/ (3 extractor files at v1) |
| Sub-Q12 | LOCKED (anti-drift override) | ADR-0014 §8 + ADR-0007 Q28 + agent_architecture_policy.md §2.1 | Round 3 | per-§2.1 matrix re-verification; AI-fallback fields flow through human confirmation; NO per-field confidence-threshold at extraction-grade v1 |
| Sub-Q14 | LOCKED | ADR-0014 §9 + ADR-0011 §11 | Round 2 (signature) + Round 3 (placement) | matcher signature per ADR-0014 §9 read-only; at `services/spend/vendorService.ts` extension |
| Sub-Q14.b | LOCKED | (Sub-Q14 inheritance) | Round 3 | Candidate A — `services/spend/vendorService.ts` extension with `matchVendor` function |
| Sub-Q16 | LOCKED | ADR-0007 § Tier 1 + ADR-0014 §11 | Round 2 | orchestrator-direct via `withInvariants(action: 'payment.record')` at orchestrator call site |
| Sub-Q17 | LOCKED | ADR-0007 § Tier 1 + ADR-0014 §11 + ADR-0011 §15 | Round 2 | orchestrator-direct via `withInvariants(action: 'bill.post')` + orchestrator passes `primary_document_id` per INV-DOC-001 |
| Sub-Q18 | LOCKED | ADR-0014 §11 + ADR-0011 §13 | Round 2 | bifurcated routing — matching-prior-payment → attach_payment_evidence; no-matching → exception queue |
| Sub-Q21 | LOCKED (Option 1) | ADR-0014 §1 + RI-7 + F-J-14 Grain 1 | Round 4 | 3-chunk decomposition at scope-lock-cycle grade; Path C invocation deferred to chunk 7.1 brief-drafting per F-J-14 Grain 1 prospective |
| Sub-Q22 | LOCKED | (Sub-Q21 inheritance + ADR-0014 §1) | Round 4 | canonical sequence 7.1 → 7.2 → 7.3 |
| Sub-Q23 | LOCKED | (Sub-Q5 Path A inheritance) | Round 4 | chunk 7.1 placement; Path C invocation framing at brief-grade |
| Sub-Q24 | LOCKED | (Phase 5.1/6.5 precedent) | Round 2 | per-chunk-incremental test infra |
| Sub-Q26 | LOCKED (partial; chunk-placement) | ADR-0014 §7 + §8 + §9 + §10 + ADR-0019 + ADR-0010 | Round 2 | 26.α — ship at chunk 7.2 substrate-add migration; substrate scope expanded to ~11 reserved org_settings columns (ADR-0014 5 + ADR-0019 6) per Round 3 §1.4 finding |

### §3.2 Mixed sub-questions (6 of 6 LOCKED at governance-critical; product-discovery sub-axes brief-deferred)

| Sub-Q | Governance-critical lock | Product-discovery brief-deferral | Locking round |
|---|---|---|---|
| Sub-Q3 | §12-inherited retry parameters (max 3 attempts; 500ms base; exponential factor 2x; ±20% jitter; ~3.5s budget per-stage) | numeric values at chunk 7.1 brief | Round 3 |
| Sub-Q4 | per-stage independent budget; no pipeline-level wrapper at v1 | numeric values at chunk 7.1 brief | Round 3 |
| Sub-Q6 | per-document-type rule modules within `extraction/classifier/` subdirectory | per-rule heuristic detail at chunk 7.2 brief | Round 3 |
| Sub-Q9 | per-document-type prompt files + content-hash (SHA-256) versioning | prompt content + per-document-type targets at chunk 7.2 brief | Round 3 |
| Sub-Q10 | existing `ExceptionReasonSchema` + extend with `ai_fallback_validation_failed` at chunk 7.2 substrate | specific fields per exception payload at chunk 7.2 brief | Round 3 |
| Sub-Q13 | schemas at `apps/web/src/shared/schemas/extraction/` | per-field shape at chunk 7.2 brief | Round 3 |

### §3.3 Product-discovery sub-questions (4 of 4 LOCKED at scope-lock-cycle grade with appropriate brief-grade deferrals)

| Sub-Q | Disposition | Brief-grade deferrals | Locking round |
|---|---|---|---|
| Sub-Q15 | LOCKED (both sub-axes) | sub-axis (a): bifurcated render per Sub-Q18 inheritance; sub-axis (b): per-card update within per-batch tab via PendingDocumentsView showing_batch state | Round 4 |
| Sub-Q19 | LOCKED | single new `proposed_attachment_card` canvasDirective member at v1 (snake_case); ProposedMutationBundle render shape deferred to chunk 7.3 brief | Round 4 |
| Sub-Q20 | LOCKED | PendingDocumentsView consumes DocumentCard per-card state via existing contract; DocumentCard per-card state extension at chunk 7.3 brief | Round 4 |
| Sub-Q25 | LOCKED | chunk-by-chunk-incremental observability per Sub-Q24 + Phase 5.1/6.5 precedent | Round 4 |

### §3.4 Sub-question surfaced at Round 2

| Sub-Q | Surfacing | Disposition | Locking round |
|---|---|---|---|
| Sub-Q27 | Surfaced at Round 2 §2.10 Sub-Q26 column-shape contingency outcome | brief-grade deferral — column-shape walks at chunk 7.2 brief alongside substrate-add migration | Round 3 (deferral confirmed) |

### §3.5 Lock consistency verification

Cross-Round lock consistency verified at consolidation grade. No lock conflicts across Rounds 1-4 (condition (a) of Round 5 trigger checklist not fired). All locks consistent with substrate evidence at time of locking + downstream walks.

---

## §4 — Phase 7 retrospective codification candidate enumeration

Six codification candidates banked at Round 4 + one cross-phase observation banked at Round 5. Per candidate: pattern description + N grain + threshold status + sub-grain refinement + proposed convention surface.

### §4.1 Option-space-framing-against-substrate sub-shape (N=8 instances; 6 sub-grains)

**Pattern.** Option-space framing at directive grade or scope-input artifact grade drifts from substrate evidence; walk-grade verify-from-disk catches the divergence. The discipline operates as forcing function for substrate-grounded option-space framing at brainstorming-side authorship surfaces.

**Cumulative banking across Rounds 1-4:**

| Round | Sub-shape instance | Sub-grain |
|---|---|---|
| Round 1 | 5 substrate divergences absorbed at §1.1 (VFD-2 hash → original_content_hash; VFD-5 pipeline_stage_records table → pipeline_trace JSONB column; VFD-6 org_settings substrate gap; VFD-11 + VFD-13 path drift) | scope-input-artifact-authoring drift |
| Round 2 | Sub-Q1 brainstorming-side lean at services/document-platform/orchestrator/ ILLEGAL per ADR-0020 §1; lock at agent/orchestrator/ | brainstorming-side-lean drift |
| Round 3 | Sub-Q12 conflation (classification thresholds do NOT propagate to extraction-field thresholds) | brainstorming-side-lean drift |
| Round 3 | Sub-Q13 directive candidate (c) framing ("co-located at services/spend/") empirically wrong — Phase 5.1 schemas at shared/schemas/spend/ NOT services/spend/ | directive-grade-candidate-enumeration drift |
| Round 4 | Sub-Q15.b pre-emptive-deferral-lean unnecessary; substrate evidence resolves cleanly | pre-emptive-deferral-lean-overridden-by-substrate (new sub-grain) |
| Round 4 | Sub-Q19 directive's hypothetical "extraction.*" dot-namespaced framing wrong against canvasDirective snake_case convention | naming-convention drift |
| Round 4 | Sub-Q21 directive's "Grains 1+2+3 impl-grade only" framing wrong against F-J-14 catalog (Grains 1+2 prospective + Grain 3 reactive) | catalog-substrate-characterization drift |
| Round 5 HALT | condition (e) Phase 5.1 + Phase 6.5 cycle-close artifact precedent inconsistency | precedent-inconsistency-requiring-founder-grade-adjudication drift |

**N grain:** N=8 cumulative instances across Rounds 1-5.

**Threshold status:** Codification threshold N=3+ STRONGLY MET.

**Sub-grain refinement (6 sub-grains):**

1. scope-input-artifact-authoring drift (5 Round 1 instances).
2. brainstorming-side-lean drift (Sub-Q1 + Sub-Q12).
3. directive-grade-candidate-enumeration drift (Sub-Q13).
4. naming-convention drift (Sub-Q19).
5. catalog-substrate-characterization drift (Sub-Q21).
6. pre-emptive-deferral-lean-overridden-by-substrate (Sub-Q15.b; N=1; below codification threshold; future-cycle-watch).
7. precedent-inconsistency-requiring-founder-grade-adjudication drift (Round 5 HALT; N=1; future-cycle-watch).

**Proposed convention surface:** Extend `docs/04_engineering/conventions/session/scope-lock.md` §Verify-from-disk-at-non-standard-grain sub-shape catalog with the 6 (potentially 7) sub-grains. Each sub-grain gets one entry with description + canonical example + verify-against discipline.

### §4.2 Substrate-density-compresses-LOC observation (N=5 banking; sub-curve (b) below-floor compression)

**Pattern.** Scope-lock-cycle artifacts compress to sub-curve (b) substrate-fix-narrowness band even though the artifacts are not substrate-fix narrowness in nature — the consolidation-from-existing-substrate shape produces below-floor compression analogous to substrate-fix-narrowness compression.

**Cumulative banking:**

| Artifact | LOC | Sub-curve framing |
|---|---|---|
| Scope-input artifact | 599 | sub-curve (b) below-floor |
| Round 1 | 310 | sub-curve (b) below-floor |
| Round 2 | 486 | sub-curve (b) below-floor |
| Round 3 | 500 | sub-curve (b) below-floor |
| Round 4 | 442 | sub-curve (b) below-floor |

**N grain:** N=5 banking (five-grain consistency).

**Threshold status:** Below codification threshold at N=5 if threshold is N=3+ per project pattern, but observation is exploratory framing extension to `plan-authoring.md` Volume-forecast four-curve calibration — not a discipline codification per se. Track at retrospective grade as exploratory observation.

**Proposed convention surface:** Extend `docs/04_engineering/conventions/session/plan-authoring.md` Volume-forecast four-curve calibration with sub-curve (b) extension framing: scope-lock-cycle artifacts inherit sub-curve (b) compression characteristics even when not substrate-fix narrowness — the consolidation-from-existing-substrate shape produces analogous compression. New sub-curve framing or sub-curve (b) extension at exploratory grade.

### §4.3 Directive-authoring multi-iteration refinement sub-grain (N=4 banking; codification threshold STRONGLY MET)

**Pattern.** Directive authoring at scope-lock-cycle-round grade benefits from explicit three-iteration refinement cycle (initial draft → refinement notes by executor → refined directive with applied refinements). The pattern functions as forced second-pass on directive before walk-grade evidence arrives.

**Cumulative banking:**

| Session | Directive | Iteration cycle |
|---|---|---|
| 29 | Round 2 directive | initial → 2 refinement notes (walk-order coupling + Sub-Q26 lock-at-Round-2) → refined directive |
| 30 | Round 3 directive | initial → 3 refinement notes (Sub-Q12 conflation + Sub-Q13 location presumption + Phase A step 8 fallback) → refined directive |
| 31 | Round 4 directive | initial → 2 refinement notes (Sub-Q15 single-vs-batch sub-axis + Sub-Q21 F-J-14 banking) → refined directive |
| 32 | Round 5 directive | initial → 2 refinement notes (Round 6 trigger conditions + brief-drafting plan retrospective-candidate operational-relevance) → refined directive |

**N grain:** N=4 cumulative instances; consistent firing across all scope-lock-cycle-round directives since Session 29.

**Threshold status:** Codification threshold N=3+ STRONGLY MET.

**Sub-grain refinement:** Pattern operates as brainstorming-side ↔ executor deliberation surface where refinement notes function as forced second-pass on directive before walk-grade evidence arrives. Three iterations consistently produce tighter directives with prospective anti-drift catches that walk-grade evidence subsequently validates.

**Proposed convention surface:** New convention file `docs/04_engineering/conventions/session/directive-authoring.md` (or extension to existing `scope-lock.md`) codifying the three-iteration refinement cycle pattern at directive grade. Codification includes: pattern description + when-to-apply criteria (governance-critical sub-question batches at scope-lock-cycle grade; substantively-new-phase cycles with heavy substrate density) + canonical example (Phase 7 Sessions 29-32).

### §4.4 Anti-drift prospective-firing sub-discipline (N=5 cumulative firings; codification threshold STRONGLY MET)

**Pattern.** Pre-enumerated anti-drift framings at directive grade catch potential walk-grade drift before reactive discovery. The discipline operates as forcing function for substrate-grounded walk evidence at lock-grade adjudication.

**Cumulative banking:**

| Round | Anti-drift firing | Drift type |
|---|---|---|
| Round 3 | Sub-Q12 conflation confirmed prospectively | category-error conflation (classification thresholds → extraction-field thresholds) |
| Round 3 | Sub-Q13 directive-candidate-drift caught prospectively | directive candidate (c) framing empirically wrong |
| Round 4 | Sub-Q15.b pre-emptive-deferral-lean overridden by substrate | safety-hedge unnecessary |
| Round 4 | Sub-Q19 naming-convention drift caught | hypothetical dot-namespaced framing wrong |
| Round 4 | Sub-Q21 catalog-grain-characterization drift caught | F-J-14 catalog presumed impl-grade-only |
| Round 5 HALT | condition (e) precedent-inconsistency caught at Phase A reads grade | Phase 5.1 + Phase 6.5 cycle-close artifact precedent inconsistency |

**N grain:** N=6 cumulative firings across Rounds 3-5.

**Threshold status:** Codification threshold N=3+ STRONGLY MET.

**Sub-grain refinement:** Anti-drift framings at directive grade pair with multi-iteration refinement (§4.3); refinement notes during three-iteration cycle add anti-drift framings that walk grade subsequently validates. The two patterns are coupled — multi-iteration refinement is the AUTHORING discipline; anti-drift prospective-firing is the VALIDATION discipline.

**Proposed convention surface:** Extend new `directive-authoring.md` convention (§4.3 proposed surface) OR extend `scope-lock.md` with anti-drift prospective-firing discipline at directive grade. Codification includes: pattern description + when-to-add-anti-drift-framing (at refinement iteration 3 when walk-grade drift risk is plausible) + canonical examples (Phase 7 Rounds 3-5 firings).

### §4.5 Multi-ADR-substrate-surface enumeration sub-discipline (N=2 banking; below threshold)

**Pattern.** ADR-grade reserved-column commitments span multiple ADRs at the same substrate-add surface; brief-grade scope walks must enumerate ALL governing ADRs' reserved-column commitments, not just the primary domain ADR.

**Cumulative banking:**

| Round | Substrate-scope expansion | Detail |
|---|---|---|
| Round 2 | Sub-Q26 2 → 5 columns | ADR-0014 §7+§8 (2 directive-framed) → §7+§8+§9+§10 (5 actual) |
| Round 3 | Sub-Q26 5 → ~11 columns | ADR-0014 5 (v1-active NOT NULL DEFAULT) + ADR-0019 6 (NULL-default substrate-now-enforcement-later) at same org_settings table substrate-add migration |

**N grain:** N=2 banking.

**Threshold status:** Below codification threshold (N=3+ per project pattern). Track at retrospective grade as future-cycle-watch candidate.

**Sub-grain refinement:** Multi-ADR enumeration discipline applies at brief-drafting Phase A reads grade and at substrate-add migration authoring grade. Future cycles surfacing analogous multi-ADR reserved-column commitments at same substrate-add surface graduate the pattern.

**Proposed convention surface:** Track for codification at Phase 8+ retrospective grades. If pattern fires at Phase 8 chunk-brief-drafting or Phase 8 substrate-add migration grade, graduate to codification at scope-lock.md or new substrate-add convention surface.

### §4.6 Pre-emptive-deferral-lean-overridden-by-substrate sub-shape (N=1 banking; below threshold)

**Pattern.** Directive-grade pre-emptive deferral framing (partial-lock + brief-grade deferral) for sub-axes that walk-grade substrate evidence resolves cleanly. The lean is unnecessary; walk-grade evidence-density at scope-lock-cycle-round grade is sufficient.

**Cumulative banking:**

| Round | Instance | Detail |
|---|---|---|
| Round 4 | Sub-Q15.b pre-emptive-deferral-lean | Directive lean for brief-grade deferral; walk evidence resolves at Round 4 grade |

**N grain:** N=1.

**Threshold status:** Below codification threshold (N=3+). Future-cycle-watch candidate.

**Sub-grain refinement:** Distinct from option-space-framing-against-substrate sub-shape (which catches drift in OPTION SPACE); this sub-shape catches drift in DEFERRAL DISCIPLINE (deferring sub-axes that don't need deferral). Future cycles' chunk-brief-drafting walks may surface analogous instances at higher evidence-density than scope-lock-cycle walks.

**Proposed convention surface:** Track for codification at chunk-brief-drafting cycle outcomes. If pattern fires at chunk-brief-drafting grade with analogous structure, graduate to codification.

### §4.7 Cross-phase observation: cycle-close discipline calibration against cycle shape (N=1; banked at Round 5)

**Pattern.** Scope-lock cycle-close discipline calibrates against cycle shape (amendment-cycle vs substantively-new-phase cycle) rather than phase-uniform template:

- **Amendment-cycle precedent (Phase 5.1):** "Operational-flex collapse heuristic" at Round 4 close — cycle absorbs cycle-close into Round 4 §8; no separate cycle-close artifact (Option B).
- **Substantively-new-phase cycle precedent (Phase 6.5):** Separate cycle-close artifact at 1237 LOC with 10-section structural template (Option A).
- **Phase 7 (substantively-new-phase cycle):** Inherits Phase 6.5 precedent (Option A); this artifact.

**N grain:** N=1 at Round 5 HALT-and-resume.

**Threshold status:** Below codification threshold. Future-cycle-watch candidate.

**Sub-grain refinement:** Cycle-shape-specific structural template selection is a meta-discipline observation; phase-uniform template selection would be the alternative pattern (force all cycles into same close template regardless of cycle shape). Phase 7's selection of Phase 6.5 precedent over Phase 5.1 precedent per cycle-shape-match argument validates the cycle-shape-specific framing.

**Proposed convention surface:** Track for codification at Phase 8+ scope-lock-cycle outcomes. If Phase 8 surfaces analogous cycle-shape-specific structural template selection (especially if Phase 8 is amendment-cycle and selects Option B, then Phase 9 substantively-new-phase selects Option A), graduate to codification at new scope-lock-cycle-close-discipline convention surface or extension to plan-authoring.md.

---

## §5 — Chunk decomposition + shipping order + per-chunk acceptance criteria framework

### §5.1 Chunk decomposition (Sub-Q21 Option 1 lock)

**3-chunk decomposition** at scope-lock-cycle grade per Sub-Q21 lock + Sub-Q22 canonical sequence:

- **Chunk 7.1 — Orchestrator skeleton + Modal sidecar deployment.** Stages 0-2 active (dedup-by-hash + byte fetch + OCR via Modal sidecar). Stages 3-7 stub.
- **Chunk 7.2 — Classifier (Tier A + Tier C + Tier D) + dedup integration + org_settings substrate-add migration.** Stage 3 active. Stages 4-7 stub. Substrate-add migration ships ~11 reserved org_settings columns (ADR-0014 5 v1-active + ADR-0019 6 NULL-default).
- **Chunk 7.3 — Field extractor + vendor matcher + relationship-candidate + proposal-building + UI consumer wires.** Stages 4-7 active. All 8 stages from ADR-0014 §1 active end-to-end. Phase 7 v1-walkable.

### §5.2 Shipping order (Sub-Q22 lock)

**Canonical sequence 7.1 → 7.2 → 7.3** per sequential dependency at ADR-0014 §1 stage sequence + Phase 5.1/6.5 chunk shipping precedent.

If Sub-Q21 splits to 4-chunk at chunk 7.1 brief-drafting per F-J-14 Grain 1 prospective: sequence extends to 7.1a → 7.1b → 7.2 → 7.3.

### §5.3 Modal sidecar chunk placement (Sub-Q23 lock; Sub-Q5 Path A inheritance)

**Chunk 7.1 placement** per Sub-Q5 founder-decision-resolved at Session 29. Modal substrate (Modal account setup + Python sidecar repo + HMAC management + deployment pipeline) absorbed into chunk 7.1 scope.

**Path C invocation candidate** at chunk 7.1 brief-drafting grade per F-J-14 Grain 1 prospective. If chunk 7.1 brief-drafting walk surfaces LOC explosion above RI-7 single-session ceiling (chunk-3-Phase-4 empirical bound: 8 files + 1 migration + 1 types.ts + 5 framings), chunk 7.1 splits to chunk 7.1a (orchestrator skeleton) + chunk 7.1b (Modal sidecar) at brief-grade.

### §5.4 Per-chunk acceptance criteria framework

Per-chunk acceptance criteria framing (detail at chunk brief-drafting grade):

**Chunk 7.1 acceptance criteria framework:**

- `pnpm agent:validate` 26/26 green at chunk close.
- Stages 0-2 active per ADR-0014 §1 (dedup-by-hash + byte fetch + OCR via Modal sidecar).
- Modal sidecar deployed (Python sidecar repo authored + Modal config + HMAC secret management + deployment pipeline).
- Schema-bound TS↔Python boundary per ADR-0014 §3 (Zod → JSON Schema → Pydantic).
- pipeline_trace JSONB column writes for Stages 0-2 per ADR-0014 §8 trace propagation.
- Failure-class audit events per ADR-0014 §12 for Stages 0-2 (pipeline_transient_retry + pipeline_transient_exhausted + pipeline_unavailable + extraction_failed where applicable).
- Path C invocation evaluation at brief-drafting grade per F-J-14 Grain 1 prospective.

**Chunk 7.2 acceptance criteria framework:**

- `pnpm agent:validate` 26/26 green at chunk close.
- Stage 3 active per ADR-0014 §7 (Tier A rule-based + Tier C Claude Sonnet AI fallback + Tier D unknown fallback).
- org_settings substrate-add migration ships ~11 reserved columns (5 ADR-0014 v1-active NOT NULL DEFAULT + 6 ADR-0019 NULL-default).
- ExceptionReasonSchema enum extended with `ai_fallback_validation_failed` value.
- Per-document-type rule modules at `agent/orchestrator/extraction/classifier/`.
- Per-document-type prompt files + content-hash (SHA-256) versioning per Sub-Q9 lock.
- Per-document-type Zod schemas at `apps/web/src/shared/schemas/extraction/`.
- Sub-Q27 column-shape adjudication at brief-grade for 5 ADR-0014 columns + 6 ADR-0019 columns.

**Chunk 7.3 acceptance criteria framework:**

- `pnpm agent:validate` 26/26 green at chunk close.
- Stages 4-7 active per ADR-0014 §1 (field extraction + vendor matching + relationship candidate + proposal building).
- Per-document-type extractor modules at `agent/orchestrator/extraction/`.
- vendorService.matchVendor function at `services/spend/vendorService.ts`.
- canvasDirective extended with new `proposed_attachment_card` member (snake_case).
- DocumentCard per-card state machine extension (pre-classification → classifying → post-classification → reviewing → committed).
- Phase 7 v1-walkable end-to-end demo per v3 proposal §7 Step 10.

---

## §6 — Inter-chunk dependency map

### §6.1 Substrate dependencies

- **Chunk 7.1 substrate → Chunk 7.2:** document_artifacts schema + Modal sidecar deployed (Stage 2 OCR active) → classifier consumes document_artifacts.lines + document_artifacts.pages content.
- **Chunk 7.2 substrate → Chunk 7.3:** classification stage active + org_settings substrate-add migration + ExceptionReasonSchema enum extension → extractor consumes classifier output + matcher consumes vendor identity-and-matching fields + proposal builder consumes extracted fields.

### §6.2 Service dependencies

- **ingestionService (Phase 6 substrate) → orchestrator (Chunk 7.1):** `handleDragDropUpload` returns DragDropUploadResult with ingest_batch_id; orchestrator consumes sourceDocumentId post-ingestion-commit.
- **orchestrator (Chunk 7.1) → classifier (Chunk 7.2):** orchestrator invokes classifyDocumentType per ADR-0014 §1 Stage 3.
- **classifier (Chunk 7.2) → extractor (Chunk 7.3):** classifier output (documentType + confidence + rationale) drives extractFields invocation per ADR-0014 §1 Stage 4.
- **extractor (Chunk 7.3) → matcher (Chunk 7.3):** extractor outputs vendor identity-and-matching fields; matcher resolves vendor_id per ADR-0014 §9.
- **proposal builder (Chunk 7.3) → committed services (Phase 5 + Phase 5.1):** orchestrator stage 7 invokes billService.post() / paymentService.record() via withInvariants() at orchestrator call site per Sub-Q16 + Sub-Q17 locks.

### §6.3 UI consumer dependencies

- **canvasDirective (Phase 1.1 substrate; Phase 6.5 extension) → Chunk 7.3:** canvasDirective extended with new `proposed_attachment_card` member at v1.
- **PendingDocumentsView (Phase 6.5 chunk 3 substrate) → Chunk 7.3:** PendingDocumentsView consumes DocumentCard per-card state; DocumentCard extends with post-classification render state.
- **SplitScreenLayout Pattern γ (Phase 6.5 chunk 2 substrate) → Chunk 7.3:** Pattern γ Rule 1 (handleDropEvent) opens one tab per batch at drop; Phase 7 extraction completes per source document within batch tab.

### §6.4 Cross-phase dispatcher inheritance

- **T1_new_bill dispatcher (Phase 4 chunk 3 + Phase 5.1 chunk 5.1a inheritance) → Chunk 7.3:** fires post-commit at billService.post() site automatically per Sub-Q17 lock.
- **T2_new_payment dispatcher (Phase 5.1 chunk 5.1b inheritance) → Chunk 7.3:** fires post-commit at paymentService.record() site automatically per Sub-Q16 lock.

---

## §7 — Brief-drafting plan + partial-information items inventory

Per-chunk brief-drafting session enumeration with substrate-load expectation + Path C invocation evaluation + retrospective-candidate operational-relevance flagging.

### §7.1 Chunk 7.1 brief-drafting session (Session 33)

**Scope:** Orchestrator skeleton (`ingestDocument` function) + Modal sidecar deployment (Python sidecar repo + Modal config + HMAC + deployment pipeline) + Stages 0-2 active (dedup-by-hash + byte fetch + OCR).

**Substrate-load expectation:**

- ADR-0014 §1 Stages 0-2 substrate (dedup-by-hash short-circuit + byte fetch via storageProviderService + OCR via Modal sidecar HTTP).
- Modal account setup + Python sidecar repo authorship + PaddleOCR wrapper + Pydantic schemas + HMAC verification + deployment pipeline + Modal CLI workflow.
- Schema-bound TS↔Python boundary (Zod → JSON Schema → Pydantic).
- pipeline_trace JSONB column writes per ADR-0014 §8.
- Per ADR-0014 §12 transient retry parameters (max 3 attempts; 500ms base; exponential factor 2x; ±20% jitter; ~3.5s budget per-stage).

**Per-chunk forecast:** Scope-lock-cycle walk evidence 1400-2200 LOC at chunk-grade per Session 29 Sub-Q5 walk; mid-point ~1800 LOC. Path C invocation evaluation at brief-grade per F-J-14 Grain 1 prospective.

**Path C invocation outcome at brief-grade:** If brief-grade walk confirms LOC explosion above RI-7 ceiling, chunk 7.1 splits to chunk 7.1a (orchestrator skeleton; Stages 0+1) + chunk 7.1b (Modal sidecar + Stage 2 active). Fault line: TypeScript-orchestrator substrate vs Python-sidecar-deployment substrate.

**Partial-information items:**

- Modal account setup complexity (external SaaS account creation + payment method + deployment quota).
- HMAC secret management (secret generation + .env propagation + rotation policy).
- Python sidecar repo authorship grain (greenfield repo vs subdirectory under existing repo; deployment artifact shape).
- Schema-bound boundary translation (TS Zod → JSON Schema → Pydantic) automation surface.

**Retrospective-candidate operational-relevance flagging:**

- **Directive-authoring multi-iteration refinement (§4.3):** OPERATIONALLY RELEVANT at chunk 7.1 brief-drafting directive grade. Three-iteration cycle pattern may apply.
- **Anti-drift prospective-firing sub-discipline (§4.4):** OPERATIONALLY RELEVANT at brief-drafting Phase A reads grade. Anti-drift framings can pre-empt substrate divergences.
- **Option-space-framing-against-substrate sub-shape (§4.1):** OPERATIONALLY RELEVANT — direct firing surface. Brief-drafting option-space framing (per-task substrate enumeration; Modal config substrate framing) is the firing surface.
- **Multi-ADR-substrate-surface enumeration sub-discipline (§4.5):** OPERATIONALLY RELEVANT. Chunk 7.1 reads ADR-0014 + ADR-0007 + ADR-0013 (storage substrate) at brief-drafting Phase A.
- **Substrate-density-compresses-LOC observation (§4.2):** OBSERVATION-NOT-YET-APPLICABLE at chunk-brief-drafting grade (different sub-curve than scope-lock-cycle). Track at brief-drafting cycle for future evidence.
- **Pre-emptive-deferral-lean-overridden-by-substrate (§4.6):** FUTURE-CYCLE-WATCH at brief-drafting grade. Higher evidence-density may surface analogous instances.

### §7.2 Chunk 7.2 brief-drafting session (Session 34)

**Scope:** Classifier (Tier A rule-based + Tier C Claude Sonnet AI fallback + Tier D unknown fallback) + dedup integration (Stage 0 short-circuit logic) + org_settings substrate-add migration (~11 reserved columns) + Stage 3 classification active.

**Substrate-load expectation:**

- ADR-0014 §7 + §8 Tier A + Tier C + Tier D classifier structure.
- Sub-Q6 per-document-type rule modules at `agent/orchestrator/extraction/classifier/`.
- Sub-Q9 per-document-type prompt files + content-hash (SHA-256) versioning at `agent/orchestrator/extraction/classifier/prompts/`.
- Sub-Q10 ExceptionReasonSchema enum extension with `ai_fallback_validation_failed`.
- Sub-Q26 org_settings substrate-add migration: 5 ADR-0014 columns (classification_fallback_order + ai_fallback_budget + vendor_match_threshold + gc_cadence + gc_threshold_hours) + 6 ADR-0019 columns (threshold override + calibration cadence + test-set-version).
- Sub-Q27 column-shape adjudication at brief-grade for all 11 columns.
- Sub-Q13 per-document-type Zod schemas at `apps/web/src/shared/schemas/extraction/`.

**Per-chunk forecast:** scope-input §5.2 forecast ~600-1100 LOC + org_settings substrate-add migration (+150-250 LOC) → ~750-1350 LOC. RI-7 single-session ceiling evaluation at brief-grade.

**Path C invocation outcome at brief-grade:** Low probability at chunk 7.2 (substrate is well-bounded; no novel external dependencies analogous to Modal sidecar). If brief-grade walk surfaces unforeseen complexity (e.g., AI fallback mock harness substrate exceeds expectation), Path C contingency reserved per F-J-14 Grain 2.

**Partial-information items:**

- Sub-Q27 column-shape per-column adjudication (text[] vs jsonb for classification_fallback_order; integer vs smallint for ai_fallback_budget + gc_threshold_hours; numeric(3,2) vs real for vendor_match_threshold; text vs interval vs enum for gc_cadence; etc.).
- Tier A rule heuristic specifics per Sub-Q6 (Invoice header patterns; receipt-shape patterns; payment language patterns; filename heuristics).
- Tier C system prompt content per Sub-Q9 (per-document-type prompt files with field-extraction targets).
- AI fallback mock harness substrate for chunk 7.2 test infra per Sub-Q24.

**Retrospective-candidate operational-relevance flagging:** Same as §7.1 (Directive-authoring multi-iteration refinement OPERATIONALLY RELEVANT; Anti-drift prospective-firing OPERATIONALLY RELEVANT; Option-space-framing-against-substrate OPERATIONALLY RELEVANT; Multi-ADR-substrate-surface enumeration OPERATIONALLY RELEVANT — chunk 7.2 reads ADR-0014 + ADR-0019 + ADR-0010 + ADR-0011; Substrate-density-compresses-LOC OBSERVATION-NOT-YET-APPLICABLE; Pre-emptive-deferral-lean FUTURE-CYCLE-WATCH).

### §7.3 Chunk 7.3 brief-drafting session (Session 35)

**Scope:** Field extractor (per-document-type per Sub-Q11) + vendor matcher (services/spend/vendorService.ts extension per Sub-Q14.b) + relationship-candidate stage + proposal-building stage + UI consumer wires (canvasDirective proposed_attachment_card extension + DocumentCard state machine extension + ProposedMutationBundle render shape adjudication).

**Substrate-load expectation:**

- ADR-0014 §1 Stages 4-7 substrate (field extraction + vendor matching + relationship candidate + proposal building).
- Per-document-type extractor modules (vendorInvoiceExtractor.ts + receiptExtractor.ts + paymentConfirmationExtractor.ts) at `agent/orchestrator/extraction/` flat per Sub-Q11.b.
- vendorService.matchVendor function extension at `services/spend/vendorService.ts` per Sub-Q14.b.
- relationship-candidate stage via documentRouterService.completeCandidate per Phase 4 chunk 1 substrate.
- proposal-building per ADR-0014 §11 (ProposedMutation / ProposedMutationBundle / ProposedAttachment routing).
- canvasDirective `proposed_attachment_card` member extension per Sub-Q19.
- DocumentCard per-card state machine extension per Sub-Q20.
- Sub-Q15 bifurcated render: vendor_invoice + payment_confirmation → proposed_entry_card; receipt + matching-prior-payment → proposed_attachment_card; no-match → exception queue.

**Per-chunk forecast:** scope-input §5.3 forecast ~1200-2000 LOC. Path C invocation candidate at chunk 7.3 grade per scope-input §8.1 risk; brief-grade walks Path C evaluation per F-J-14 Grain 1 prospective.

**Path C invocation outcome at brief-grade:** Moderate probability at chunk 7.3 (extractor + matcher + proposal-building + UI consumer wires is substantial scope). If brief-grade walk confirms LOC explosion, chunk 7.3 splits to chunk 7.3a (extractor + matcher + relationship-candidate + proposal-building) + chunk 7.3b (UI consumer wires) at brief-grade per F-J-14 Grain 1.

**Partial-information items:**

- ProposedMutationBundle render shape per Sub-Q19 brief-grade deferral (single canvasDirective member vs separate `proposed_mutation_bundle_card` member).
- DocumentCard per-card state machine extension detail per Sub-Q20 brief-grade.
- Per-document-type field schema shape per Sub-Q13 brief-grade.
- Sub-Q14.b matcher signature implementation detail (VendorMatchInput + VendorMatchResult shapes per ADR-0014 §9 verbatim).
- Sub-Q15 sub-axis (a) bifurcation implementation detail (which classification → which proposal-card path).

**Retrospective-candidate operational-relevance flagging:** Same as §7.1 + §7.2 (Directive-authoring multi-iteration refinement OPERATIONALLY RELEVANT; Anti-drift prospective-firing OPERATIONALLY RELEVANT — especially given Sub-Q19 + Sub-Q20 brief-grade deferrals risk further drift; Option-space-framing-against-substrate OPERATIONALLY RELEVANT; Multi-ADR-substrate-surface enumeration OPERATIONALLY RELEVANT — chunk 7.3 reads ADR-0014 + ADR-0011 + ADR-0018 + ADR-0007; Substrate-density-compresses-LOC OBSERVATION-NOT-YET-APPLICABLE; Pre-emptive-deferral-lean FUTURE-CYCLE-WATCH — chunk 7.3 may surface analogous instances given product-discovery sub-axes brief-deferrals at Sub-Q19 + Sub-Q20).

### §7.4 Brief-drafting plan summary

| Session | Chunk | LOC forecast (brief grade) | Path C invocation probability | Substrate-load shape |
|---|---|---|---|---|
| 33 | 7.1 | ~1400-2200 (mid-point 1800) | HIGH (Modal substrate novelty) | TypeScript orchestrator + external Python sidecar + external SaaS |
| 34 | 7.2 | ~750-1350 (with org_settings migration) | LOW | TypeScript classifier + migration + Zod schemas |
| 35 | 7.3 | ~1200-2000 | MODERATE (extractor + matcher + proposal-building + UI breadth) | TypeScript extractor + service extension + UI extension |

If Path C invocations fire at chunks 7.1 + 7.3 (high + moderate probabilities), total chunk-impl session count: 5 (chunk 7.1a + 7.1b + 7.2 + 7.3a + 7.3b). If neither fires, total: 3.

---

## §8 — Cycle metadata + cumulative state catches

### §8.1 Rounds fired

5 rounds fired (4 substantive + 1 HALT-and-resume):

| Round | Session | Outcome |
|---|---|---|
| 1 | 28 | VFD pass + 26 sub-questions option-space confirmed + Sub-Q26 surfaced |
| 2 | 29 | 10-sub-question governance-critical batch; 5 clean + 4 partial + 1 founder-decision (Sub-Q5) + Sub-Q27 surfaced |
| 3 | 30 | 13-sub-question batch; 12 clean + 1 brief-grade deferral + 2 anti-drift firings |
| 4 | 31 | 7-sub-question batch; 7 clean + 3 anti-drift firings; final-lock cycle complete |
| 5 | 32 | HALT at Phase A condition (e); resumed at Option A per founder selection; cycle-close ratification artifact (this artifact) |

### §8.2 Substrate baseline at cycle close

| Substrate | Status |
|---|---|
| ADR-0014 | Authoritative for Phase 7 scope; §1 + §7 + §8 + §9 + §10 + §11 + §12 anchor Phase 7 chunks |
| ADR-0019 | Confidence calibration governance ratified 2026-05-04; consumer-only at Phase 7; +6 reserved org_settings columns at chunk 7.2 substrate-add migration |
| ADR-0011 | §6 document_type enum + §11 ProposedMutation routing + §15 INV-DOC-001 leaf inherited |
| ADR-0018 §item 4 (Phase 5.1 second amendment) | T1_new_bill + T2_new_payment v1-active dispatch emission; Phase 7 inherits |
| ADR-0007 Q28 + Q30 + Q31 | Tier 2 safety contract + Logic Receipt reproducibility + LLM-orchestration prohibition |
| ADR-0020 §1 + §3 | agent/orchestrator/extraction/ placement + import boundary rules |
| ADR-0010 | Substrate-now-enforcement-later discipline at v1 substrate-add migrations |
| agent_architecture_policy.md §2.1 | Per-document-type field re-verification matrix; Sub-Q12 anchor |
| Phase 5.1 substrate | billService.post() Pattern B + paymentService.record() Pattern B + T1/T2 dispatcher activation |
| Phase 6 substrate | ingestionService.handleDragDropUpload aggregate-batch return shape + document_artifacts + document_cases + ingest_batches + document_jobs |
| Phase 6.5 substrate | canvasDirective discriminated union (39 members) + PendingDocumentsView state machine + DocumentCard per-card render + SplitScreenLayout Pattern γ source-driven routing |

### §8.3 Cumulative state catches across cycle

| Round | Catch | Type |
|---|---|---|
| Round 1 | 5 substrate divergences absorbed at §1.1 (VFD-2 + VFD-5 + VFD-6 + VFD-11 + VFD-13) | scope-input artifact drift |
| Round 1 | Sub-Q26 surfaced from VFD-6 substrate gap | new sub-question |
| Round 2 | Sub-Q1 directive-realignment (services/document-platform/orchestrator/ → agent/orchestrator/) | brainstorming-side-lean drift |
| Round 2 | Sub-Q26 substrate-scope expansion 2 → 5 columns (ADR-0014 §7+§8 → §7+§8+§9+§10) | substrate-scope expansion |
| Round 2 | Sub-Q18 bifurcation refinement (single-path → bifurcated routing per ADR-0014 §11) | option-space refinement |
| Round 2 | Sub-Q27 surfaced from Sub-Q26 column-shape contingency | new sub-question |
| Round 3 | Sub-Q12 conflation confirmed prospectively | category-error catch |
| Round 3 | Sub-Q13 directive-candidate-drift caught prospectively | directive-grade drift |
| Round 3 | ADR-0019 substrate-scope expansion finding (Sub-Q26 5 → ~11 columns) | substrate-scope expansion N=2 |
| Round 4 | Sub-Q15.b pre-emptive-deferral-lean overridden by substrate | new sub-shape |
| Round 4 | Sub-Q19 naming-convention drift caught prospectively | naming-convention drift |
| Round 4 | Sub-Q21 catalog-grain-characterization drift caught prospectively | catalog-substrate-characterization drift |
| Round 5 HALT | Condition (e) Phase 5.1 + Phase 6.5 cycle-close artifact precedent inconsistency | precedent-inconsistency catch |

### §8.4 Candidate (c) catalog evolution

| Catalog | Round 1 | Round 2 | Round 3 | Round 4 | Cycle close |
|---|---|---|---|---|---|
| Sp-auth sub-grain | N=0 | N=0 | N=0 | N=0 | N=0 |
| Push-state-claim sub-shape | N=4 | N=4 | N=4 | N=4 | N=4 maintained (9-session avoidance) |
| Brief-drafting metafact-assertion | N=4 | N=4 | N=4 | N=4 | N=4 maintained |
| Option-space-framing-against-substrate sub-shape | N=1 (5-sub-grain catalog candidate) | N=3 | N=5 | N=8 | N=8 (6 sub-grains) |
| Substrate-density-compresses-LOC | N=2 (banking candidate) | N=3 | N=4 | N=5 | N=5 banking |
| Directive-authoring multi-iteration refinement | N/A | N=1 | N=1 | N=2 | N=4 (codification threshold MET) |
| Anti-drift prospective-firing sub-discipline | N/A | N/A | N=2 | N=5 | N=6 (codification threshold STRONGLY MET) |
| Sub-Q26 substrate-scope expansion sub-pattern | N/A | N=1 | N=2 | N=2 | N=2 banking |
| Pre-emptive-deferral-lean-overridden-by-substrate | N/A | N/A | N/A | N=1 | N=1 (below threshold) |
| Cycle-close discipline calibration cross-phase | N/A | N/A | N/A | N/A | N=1 (cycle close) |

---

## §9 — Handoff to chunk 7.1 brief-drafting (Session 33)

### §9.1 Next-step trigger

Phase 7 scope-lock cycle CLOSES at Round 5 (this artifact). Next operational fire: **Session 33 — chunk 7.1 brief-drafting** per §7.1 framing.

### §9.2 Cycle-close commit shape

Single docs-only commit at Session 32 Round 5 ships this cycle-close ratification artifact. Commit message format per Phase 6.5 cycle-close commit precedent. Expected 6 commits ahead of origin/staging post-commit (banks for Phase 7 terminal-close push per Phase 5.1 + Phase 6.5 N=2 precedent).

### §9.3 Cycle artifact provenance

Phase 7 scope-lock cycle artifacts:

- Scope-input: `docs/09_briefs/phase-7/2026-05-19-phase-7-extraction-scope-input.md` (`8ae3886`; 599 LOC).
- Round 1: `docs/09_briefs/phase-7/2026-05-19-phase-7-scope-lock-cycle-round-1.md` (`2d97efe`; 310 LOC).
- Round 2: `docs/09_briefs/phase-7/2026-05-19-phase-7-scope-lock-cycle-round-2.md` (`9b8d0af`; 486 LOC).
- Round 3: `docs/09_briefs/phase-7/2026-05-19-phase-7-scope-lock-cycle-round-3.md` (`aa3d3c8`; 500 LOC).
- Round 4: `docs/09_briefs/phase-7/2026-05-19-phase-7-scope-lock-cycle-round-4.md` (`4dd36b0`; 442 LOC).
- Cycle close: `docs/09_briefs/phase-7/2026-05-19-phase-7-scope-lock-cycle-close.md` (this artifact; ~LOC TBD at write).

### §9.4 Session 33 directive prompt inputs

Session 33 directive (chunk 7.1 brief-drafting) inherits from this cycle-close artifact:

- **Cycle-close lock inheritance:** all 27 sub-question locks per §3.
- **Chunk 7.1 acceptance criteria framework** per §5.4.
- **Chunk 7.1 substrate-load expectation** per §7.1.
- **Chunk 7.1 LOC forecast** ~1400-2200 with Path C invocation HIGH probability per §7.4.
- **Retrospective-candidate operational-relevance flagging** per §7.1 (5 of 6 candidates operationally relevant; 1 observation-not-yet-applicable).
- **Cross-phase observation banking pointer** per §4.7.

Session 33 directive should adopt the directive-authoring multi-iteration refinement discipline per §4.3 codification candidate (three-iteration cycle pattern is now N=4 banked across Sessions 29-32; chunk-brief-drafting cycle inherits the discipline application).

### §9.5 Downstream sequencing post-Session 33

| Session | Operation |
|---|---|
| 33 | Chunk 7.1 brief-drafting (Path C invocation evaluation; possibly splits chunk 7.1 to 7.1a + 7.1b at brief-grade) |
| 34 | Chunk 7.2 brief-drafting |
| 35 | Chunk 7.3 brief-drafting (Path C invocation evaluation; possibly splits chunk 7.3 to 7.3a + 7.3b at brief-grade) |
| 36-N | Chunk implementations (3 chunks if no Path C; 5 chunks if both Path C invocations fire) |
| N+1 | Phase 7 retrospective drafting |
| N+2 | Phase 7 retrospective ceremony (T3 ADR amendments + T4 convention codifications + T1 retrospective writeup) |
| N+3 | Phase 7 terminal-close push to origin/staging |
| N+4 | Phase 7 v1 close + Step 10 end-to-end manual-walkable demo |

Total Phase 7 envelope per scope-input §7 framing: ~12-18 sessions. Cycle-close at Session 32 narrows to ~9-12 sessions remaining: 3 brief-drafting + 3-5 chunk implementations + 3 retrospective ceremony + 1 terminal-close push + 1 v1 close demo.

---

## §10 — Cross-references

### §10.1 Cycle lineage

- Phase 7 scope-input artifact at `8ae3886` (substrate inheritance baseline).
- Phase 7 Rounds 1-4 artifacts at `2d97efe` + `9b8d0af` + `aa3d3c8` + `4dd36b0` (cycle-close evidence).
- Phase 5.1 Round 4 §8.2 framework at `docs/09_briefs/phase-5.1/2026-05-19-phase-5-1-scope-lock-cycle-round-4.md` (Option A/B/C three-option adjudication precedent).
- Phase 6.5 cycle-close artifact at `docs/09_briefs/phase-6.5/2026-05-16-document-drop-and-shell-consolidation-scope-lock-cycle-close.md` (Option A structural template precedent; 10-section format inherited).

### §10.2 Governance forward-pointers

- Phase 7 retrospective at `docs/07_governance/retrospectives/phase-7-retrospective.md` (to be authored post-chunk-implementations; codification candidates per §4 to be ratified).
- ADR-0014 amendment surface if chunk implementation surfaces unforeseen ADR text drift.
- ADR-0018 amendment surface if Phase 7 fires T4/T6 dispatcher activations per Phase 5.1 second amendment precedent.
- ADR-0019 calibration governance ratification at v1 ship per ADR-0014 §7 provisional values pattern.

### §10.3 ADRs touched at Phase 7 cycle close

| ADR | Touch surface | Phase 7 chunks |
|---|---|---|
| ADR-0014 | §1 pipeline architecture + §2 OCR + §3 sidecar + §7 classifier + §8 AI fallback + §9 vendor matcher + §11 proposal routing + §12 failure classification | All chunks |
| ADR-0007 | Q28 Tier 2 safety contract + Q30 Logic Receipt reproducibility + Q31 LLM-orchestration prohibition | All chunks |
| ADR-0011 | §6 document_type enum + §11 ProposedMutation routing + §15 INV-DOC-001 leaf | Chunks 7.2 + 7.3 |
| ADR-0018 | §item 4 dispatcher activation inheritance | Chunk 7.3 |
| ADR-0019 | Confidence calibration governance consumer-only + 6 reserved org_settings columns | Chunk 7.2 |
| ADR-0020 | §1 canonical folder layout + §3 import boundary rules | Chunks 7.1 + 7.2 + 7.3 (placement + import rules) |
| ADR-0010 | Substrate-now-enforcement-later discipline at substrate-add migrations | Chunk 7.2 |

### §10.4 Code surfaces at Phase 7 chunks

| Surface | Type | Chunk |
|---|---|---|
| `apps/web/src/agent/orchestrator/extraction/ingestDocument.ts` | net-new | 7.1 |
| `apps/web/src/agent/orchestrator/extraction/classifier/` (subdirectory) | net-new | 7.2 |
| `apps/web/src/agent/orchestrator/extraction/vendorInvoiceExtractor.ts` | net-new | 7.3 |
| `apps/web/src/agent/orchestrator/extraction/receiptExtractor.ts` | net-new | 7.3 |
| `apps/web/src/agent/orchestrator/extraction/paymentConfirmationExtractor.ts` | net-new | 7.3 |
| `apps/web/src/services/spend/vendorService.ts` | extension (matchVendor function) | 7.3 |
| `apps/web/src/shared/schemas/extraction/` (new subdirectory) | net-new | 7.2 + 7.3 |
| `apps/web/src/shared/schemas/canvas/canvasDirective.schema.ts` | extension (`proposed_attachment_card` member) | 7.3 |
| `apps/web/src/components/canvas/DocumentCard.tsx` (or analogous) | extension (per-card state machine extension) | 7.3 |
| Python sidecar repo (location TBD at chunk 7.1 brief) | net-new external | 7.1 |
| Modal config (location TBD at chunk 7.1 brief) | net-new external | 7.1 |

### §10.5 Substrate migrations

| Migration | Substance | Chunk |
|---|---|---|
| chunk 7.2 substrate-add migration | `org_settings` table CREATE + ~11 reserved columns (5 ADR-0014 v1-active NOT NULL DEFAULT + 6 ADR-0019 NULL-default) + ExceptionReasonSchema enum extension with `ai_fallback_validation_failed` | 7.2 |

### §10.6 Governance precedents

- Phase 5.1 retrospective at `docs/07_governance/retrospectives/phase-5-1-retrospective.md` — amendment-cycle precedent.
- Phase 6.5 retrospective drafting plan at `docs/09_briefs/phase-6.5/2026-05-17-phase-6-5-retrospective-drafting-plan.md` — substantively-new-phase cycle precedent (in progress).
- `docs/04_engineering/conventions/session/scope-lock.md` §Session-budget-feasibility verification + Path C invocation conditions (RI-7) + Verify-from-disk-at-non-standard-grain pattern.
- `docs/04_engineering/conventions/session/plan-authoring.md` Volume-forecast four-curve calibration.
- F-J-14 three-grain catalog at `docs/07_governance/friction-journal.md` (Phase 4 chunk 3 first instance; Phase 6 chunk 6.2a second instance graduation; Phase 7 cycle close third instance projected at chunk-brief-drafting).

---

**Phase 7 scope-lock cycle CLOSED at Round 5 (Session 32; 2026-05-19) per Option A founder selection.** All 27 sub-questions locked at scope-lock-cycle grade with appropriate brief-grade deferrals. 6 retrospective codification candidates + 1 cross-phase observation banked for Phase 7 retrospective ratification. Next operational fire: Session 33 chunk 7.1 brief-drafting per §9 handoff.
