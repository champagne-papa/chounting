# Session 59 Disposition Design — Disposition (b) Brief Amendment Cycle (chunk 2 brief amendment via substrate-evidence-propagation-gap sub-grain (d) chunk-brief-to-chunk-impl temporal gap N=1 first-instance)

- **Date:** 2026-05-22
- **Session:** 59 chunk 2 impl-onset adjudication grade
- **Topic:** Session 59 cycle-posture disposition (chunk 2 single-chunk impl execution at canonical Path B sub-grain (iv) TERMINAL-brief-drafting-cycle-shift inheritance vs chunk 2 brief amendment cycle at substrate-evidence-propagation-gap sub-grain (d) chunk-brief-to-chunk-impl temporal gap N=1 first-instance materialization grade)
- **Decision:** **Disposition (b)** — Pause chunk 2 impl + chunk 2 brief amendment cycle fires at brainstorming-side composition grade per /superpowers:brainstorming → /superpowers:writing-plans → /superpowers:executing-plans skill chain per Sessions 52-58 N=7 cumulative inheritance; chunk 2 impl re-dispatch fires at Session 60 grade per Path B sequential continuation
- **Predecessor:** Session 58 close at commits `70c55ab` (design) + `3b111cb` (plan) + `60f9297` (chunk 10 brief at 537 LOC at sub-curve (a) substantively-new-phase grade) — TERMINAL brief-drafting cycle session at 100% complete grade. 33 commits ahead of `origin/staging`.
- **Brainstorm invocation:** `/superpowers:brainstorming` per founder at Session 59 onset; Phase A unconditional-discharge close report fired CLEAN at 6-check substrate-readiness grade; Phase A Step 2 CONDITIONAL substrate verification surfaced F-1/F-2/F-3/F-4 substantive substrate-evidence-propagation-gap findings at chunk-brief-to-chunk-impl temporal gap grade requiring founder adjudication BEFORE Phase B chunk 2 impl execution.

## §1 — Context

Session 59 dispatched per Session 58 TERMINAL brief-drafting cycle close inheritance + cycle-close §9.5 chunk-impl cycle posture sequencing. Session 59 directive composed at brainstorming-side framed Candidate (α) chunk 2 single-chunk impl at minimum-walk-order sub-chunk-impl-bound discipline grade per Sub-Q14 N=3 SPLIT dependency-anchored sub-chunks 2-4 walk-order inheritance.

Phase A unconditional-discharge close report fired CLEAN at 6-check substrate-readiness grade (working tree clean modulo 5 carry-forwards; 33 commits ahead; HEAD = 60f9297; pnpm agent:validate 26/26 green in 6.04s; 9 chunk briefs canonical covering 10 chunks; 6 ADRs canonical). Bilateral acknowledgment closure fired between WSL-side + brainstorming-side per Phase A close ratification turn grade. Founder ratification fired at single-apostrophe-prompt grade interpreted as Candidate (α) explicit ratification per WSL-side recommendation acceptance.

WSL-side fired Phase A Step 2 CONDITIONAL substrate verification at chunk 2 impl substrate-load grade per Session 59 directive specification. Verify-from-disk discipline at impl-onset surfaced FOUR substantive substrate-evidence-propagation-gap findings between chunk 2 brief composition state (Session 51 = 2026-05-21) + chunk 2 impl execution state (Session 59 = 2026-05-22+) — an ~8-session temporal window during which Phase 5.1 chunk 5.1a ratified ADR-0016 third amendment (LinkedEntityTypeSchema 6 → 8 values restoring vendor_credit + vendor_credit_application to v1-active subset per Sub-Q3 β substrate-tables-only-without-cell-activation discipline).

## §2 — Decision

**Disposition (b) Pause chunk 2 impl + brief amendment cycle fires at Session 59 grade.**

Disposition (a) Reduced-scope chunk 2 impl + Disposition (c) Full-scope chunk 2 impl with substrate extension are operationally available at founder operational discretion grade per Session 59 chunk 2 impl-onset substrate-evidence-propagation-gap adjudication framing. Both dispositions deferred per founder ratification of Disposition (b) at brainstorming-side recommendation grade.

Session 59 close shape per Disposition (b) ratification: 3-artifact composition (disposition design + brief amendment plan + chunk 2 brief amendment) at brainstorming-side composition grade per Sessions 52-58 N=7 cumulative brief-drafting cycle precedent shape inheritance. Chunk 2 impl re-dispatch fires at Session 60 grade per Path B sequential continuation under post-amendment brief substrate-readiness grade.

## §3 — Rationale

### §3.1 Brief-as-canonical-source-of-truth discipline at impl-onset grade

Per Sub-Q14 N=3 SPLIT lock at cycle-close grade + chunk 2 brief composition discipline inheritance + Sessions 52-58 N=7 cumulative brief-drafting cycle precedent: chunk briefs ARE the canonical impl-substrate-load source at chunk-impl-onset grade. Substrate-evidence-propagation-gap discovered at impl-onset BEFORE composition fires is the canonical surface for brief amendment per Iteration 2 refinement absorption discipline at directive-authoring-grade N=23 cumulative inheritance.

Reducing scope at impl-execution grade (Disposition a) WITHOUT brief amendment introduces brief-execution-divergence sub-pattern at canonical chunk-impl ship grade — substantively undesirable at brief-grade discipline preservation. Expanding scope at impl-execution grade (Disposition c) WITHOUT brief amendment compounds the same discipline gap at substantively heavier substrate density.

Disposition (b) preserves brief-as-canonical-source-of-truth invariant at chunk-impl-ship grade by routing scope adjudication through amendment composition surface rather than at impl-execution surface.

### §3.2 F-3 substantive cross-phase substrate change exceeds chunk 2 scope envelope

Per WSL-side enumeration at chunk 2 impl-onset substrate verification: F-3 Scenario A inferred-target paths (null `linked_entity_id` "invoice-arrives-no-bill-yet path") spans SIX substrate change requirements:

1. Migration: alter `document_relationship_candidates.linked_entity_id` to NULL-able at Layer 1 substrate
2. Zod schema: `DocumentRelationshipCandidateSchema.linked_entity_id` → `.nullable()` at Layer 2 boundary
3. `NewCandidatePayload` interface: `linked_entity_id: string | null` at internal type
4. `VALID_PAIRS` refine adjustment at pair-validity matrix
5. RPC `create_candidates_with_audit` parameter shape update + types regeneration
6. Downstream consumer audit at Subsystem 2 resolveCandidates ambiguity scoring + Subsystem 3 dispatchTrigger T-series + `LINKED_ENTITY_TABLE_MAP` join targets

This is substantively beyond chunk 2 brief scope at composition-grade-envelope inheritance (brief §3.3 explicitly: "no schema changes at chunk 2"; "no migration required"). Brief amendment cycle adjudicates F-3 substrate change scope at brainstorming-side composition grade per founder operational discretion — preserves Sub-Q14 N=3 SPLIT lock + sub-chunks 2-4 framing decomposition integrity.

### §3.3 F-1 enum narrowing-vs-pair-validity-matrix-reliance adjudication is brief-substrate-grade decision

Per F-1 finding: brief's prescription "narrow `DocumentRelationshipCandidate.linked_entity_type` union to 6-value v1-active subset" is structurally inconsistent with HEAD substrate at Phase 5.1 chunk 5.1a ratification grade (LinkedEntityTypeSchema = 8 values; VALID_PAIRS = 13 cells). Two design paths preserve implementation intent (don't emit vendor_credit / vendor_credit_application at v1):

- **Path α (enum narrowing)**: introduce a chunk-2-local narrowed type `V1EmittableLinkedEntityType` = 6-value subset; service-layer assertion at Subsystem 1 output cast-and-verify.
- **Path β (pair-validity matrix reliance)**: assert emission via existing exported `VALID_PAIRS` set (13-cell matrix); structural prevention of vendor_credit / vendor_credit_application rows via pair-validity surfaces zero pairs (vendor_credit rows stay R/I in ADR-0016 §3 Table B per Sub-Q3 β substrate-tables-only-without-cell-activation discipline).

Path β preserves Sub-Q3 β substrate-tables-only-without-cell-activation discipline structurally — implementation intent flows from the canonical Layer-2 pair-validity helper rather than introducing a chunk-2-local enum subset that could drift from the canonical 8-value enum + 13-cell matrix substrate at future ratification cycles.

Brainstorming-side preliminary recommendation at amendment composition grade: Path β. Brief amendment composition surface adjudicates the design decision at brainstorming-side composition grade per founder operational discretion grade.

### §3.4 Substrate-evidence-propagation-gap N=5 confirming-fire codification graduation strengthening at Phase 8 retrospective Commit B grade — sub-grain (d) chunk-brief-to-chunk-impl temporal gap N=1 first-instance MATERIALIZED

Per substrate-evidence-propagation-gap discipline catalog evolution at Session 59 grade: N=4 cumulative confirming-fire (Session 50 truncated-hash + Session 51 directive ADR drift + Session 51 subagent brief composition ADR drift + Session 53 plan + design doc path drift) graduates to **N=5 confirming-fire MATERIALIZED** at Session 59 chunk-brief-to-chunk-impl temporal gap discovery. Codification graduation candidate substantively past N=3 promotion threshold; routing target Phase 8 retrospective Commit B grade with VERY HIGH priority.

Sub-grain catalog evolution at Session 59 grade introduces **sub-grain (d) chunk-brief-to-chunk-impl temporal gap N=1 first-instance** distinct from prior sub-grains:

- Sub-grain (a) directive composition grade (Sessions 50 + 51 ADR drift)
- Sub-grain (b) subagent composition grade (Session 51 ADR drift)
- Sub-grain (c) brainstorming-side artifact composition grade (Session 53 plan + design doc path drift)
- **Sub-grain (d) chunk-brief-to-chunk-impl temporal gap N=1 first-instance** — substrate evolved across an ~8-session temporal window between brief composition and impl execution; spatial/path-citation gap variants of sub-grains (a)/(b)/(c) operate at single-session composition grade

The temporal-gap variant is substantively novel at substrate-evidence-propagation-gap discipline grade — chunk briefs composed at substrate-T0 may surface temporal-gap divergences at substrate-Tn execution grade due to inter-phase substrate ratification cycles. Sub-grain catalog refinement candidate at Phase 8 retrospective Commit B grade per substrate-evidence-propagation-gap discipline routing.

Disposition (b) materializes the temporal-gap discipline at canonical chunk-brief amendment grade — substantively important codification graduation routing strengthens.

## §4 — Amendment composition surface

Brief amendment fires inline at `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-2.md` per Session 54 commit `0e50cfb` explicit-correction-commit-at-HEAD precedent (preserves original chunk 2 brief commit `5dc042a` immutable in git history; amendment commit at HEAD with explicit "amendment" framing).

### §4.1 Substantive amendments

- **§B.1 F-1 amendment (Task 4 reframe)**: enum narrowing → VALID_PAIRS-based pair-validity emission assertion. Implementation intent (don't emit vendor_credit / vendor_credit_application pairs at v1) preserved structurally via existing canonical `VALID_PAIRS` helper at `sourceDocumentLink.schema.ts:68` per Sub-Q3 β substrate-tables-only-without-cell-activation discipline.
- **§B.2 F-2 clarification**: chunk 2 substantive surface extends in-place per Phase 4 chunk 1 substrate inheritance (per-document-type branches already shipped at `documentRouterService.ts:741-832`). Tasks 1-3 framing clarifies "extend in-place" rather than "scaffold new branches".
- **§B.3 F-3 disposition**: Scenario A inferred-target paths (null linked_entity_id "invoice-arrives-no-bill-yet path") DEFERRED to follow-on chunk per cross-phase substrate change scope discipline. Six substrate change requirements enumerated at §3.2 above. Follow-on chunk framing-pairing per §4.2 below.
- **§B.4 F-4 confirmation**: per-feature contribution surface expansion within existing single-feature-scoring framework (chunk 2 brief Task 1-3 acceptance criteria) implementable as briefed. No amendment needed.

### §4.2 Follow-on chunk framing-pairing for F-3 substrate change

Two operationally-available framings:

- **Framing (i)** insert chunk 2.b between chunks 2 + 3 — chunk 2.b ships F-3 substrate change at Sub-Q14 N=3 SPLIT inheritance extension grade (4 sub-chunks at framing #4 ledger extensions decomposition).
- **Framing (ii)** extend chunk 4 substantive surface — chunk 4 already ships substrate-grade integration + audit trail + downstream consumer wiring per cycle-close §5.1 framing-pairing inventory; F-3 substrate change is substantively aligned with chunk 4 integration grade.

**Brainstorming-side preliminary recommendation: framing (ii) extend chunk 4.** Preserves Sub-Q14 N=3 SPLIT lock at cycle-close grade + chunks 2-3 framing decomposition; chunk 4 substantive surface already absorbs downstream consumer wiring; F-3 substrate change is integration-grade work aligned with chunk 4 envelope. Decision adjudicated at brief amendment composition grade per founder operational discretion.

## §5 — Session 59 close shape forecast

Per Sessions 52-58 N=7 cumulative brief-drafting cycle precedent shape (design + plan + artifact three-commit close):

| Artifact | Forecast LOC | Substrate basis |
|---|---|---|
| Session 59 disposition design (this artifact) | ~180-220 LOC | scoped-bounded amendment grade per Session 53 disposition design 130 LOC precedent + larger F-finding catalog |
| Session 59 chunk 2 brief amendment plan | ~250-350 LOC | /superpowers:writing-plans skill grade per Session 53 plan 383 LOC precedent + amendment task structure |
| Chunk 2 brief amendment (inline edit) | ~150-300 LOC delta | amendment artifact grade per §B.1-B.4 amendments + §6.11 carry-forward observations section addition |

**Session 59 close commit count**: 3 commits (design + plan + brief amendment) at brief amendment cycle grade. **36 commits ahead of origin/staging post-Session-59** (33 at Session 58 close + 3 amendment commits).

**Chunk 2 impl re-dispatch**: Session 60 grade per Path B sequential continuation OR Session 60+ per founder operational adjudication.

## §6 — Banking surfaces materialized at Session 59 disposition adjudication grade

- **Substrate-evidence-propagation-gap N=4 → N=5 confirming-fire MATERIALIZED** at sub-grain (d) chunk-brief-to-chunk-impl temporal gap N=1 first-instance grade. Codification graduation candidate substantively past N=3 promotion threshold; routing target Phase 8 retrospective Commit B grade with VERY HIGH priority.
- **Substrate-evidence-propagation-gap sub-grain catalog evolution at four-grain depth MATERIALIZED**: sub-grain (a) directive composition + sub-grain (b) subagent composition + sub-grain (c) brainstorming-side artifact composition + **sub-grain (d) chunk-brief-to-chunk-impl temporal gap N=1 first-instance**. Sub-grain catalog refinement candidate at Phase 8 retrospective Commit B grade.
- **Verify-from-disk-at-impl-onset discipline sub-pattern N=1 first-instance** at Session 59 chunk 2 impl-onset Phase A CONDITIONAL substrate verification grade. Sibling discipline to preemptive substrate path verification at session-onset; promotion threshold N=2 if future chunk-impl session fires analogous discipline.
- **Chunk-brief-amendment-at-impl-onset-via-substrate-evidence-propagation-gap sub-pattern N=1 first-instance candidate** at Session 59 brief amendment cycle materialization grade. Banking continues at brainstorming-side; promotion threshold N=2 if future chunk-impl session triggers analogous brief amendment cycle.
- **Discovery-after-commit substrate-stability discipline sub-pattern N=2 → N=3 cumulative confirming-fire candidate** at Session 59 brief amendment cycle preserves chunk 2 brief artifact at commit `5dc042a` unchanged + amendment fires via separate explicit-correction commit at HEAD per Session 53 + Session 54 `0e50cfb` precedent inheritance.
- **Substrate-evidence-propagation-gap remediation via explicit correction commit sub-pattern N=1 → N=2 confirming-fire candidate** at Session 59 brief amendment commit grade per Session 54 `0e50cfb` precedent inheritance.
- **Multi-iteration refinement at directive-authoring grade sub-pattern N=23 → N=24 confirming-fire candidate** at Session 59 brief amendment cycle Iteration 2 refinement absorption grade.
- **Path B sub-grain (iv) TERMINAL-brief-drafting-cycle-shift sub-pattern**: N=1 first-instance MATERIALIZATION-IN-PROGRESS deferred from Session 59 to Session 60 grade — Session 59 fires brief amendment cycle instead of chunk-impl cycle at canonical sub-grain (iv) fire grade. Sub-pattern catalog refinement: sub-grain (iv) fires at canonical TERMINAL-brief-drafting-cycle close grade in absence of impl-onset substrate-evidence-propagation-gap discovery; sub-grain (iv) may defer via brief amendment cycle insertion at chunk-impl-onset substrate-evidence-propagation-gap discovery grade (NEW sub-grain (iv-deferred) N=1 first-instance candidate at Session 59 grade).
- **Brainstorming-side disposition-grade-skip-past avoidance discipline**: N=7 → N=8 cumulative confirming-fire candidate at Session 59 explicit three-disposition framing + founder explicit ratification grade.
- **Anti-drift prospective-firing**: N=93+ → N=95+ at chunk 2 impl-onset Phase A CONDITIONAL substrate verification grade (sourceDocumentLink.schema.ts + documentRelationshipCandidate.schema.ts + documentRouterService.ts substrate reads at substrate-grade for F-1 + F-2 + F-3 + F-4 verification).

## §7 — Next operational fire

**Session 59 close**: 3-commit brief amendment cycle close (design + plan + brief amendment).

**Session 60 dispatch (forecast)**: chunk 2 single-chunk impl re-dispatch at post-amendment brief substrate-readiness grade per Path B sequential continuation. Chunk-impl cycle posture sub-grain (iv) TERMINAL-brief-drafting-cycle-shift fires canonical at Session 60 grade per brief amendment cycle interjection at Session 59.

**Sessions 61+ (forecast)**: chunks 3-10 impl walk-order continuation per chunk-impl cycle posture per cycle-close §9.5 sequencing; F-3 substrate change absorbed at chunk 4 substantive surface per framing (ii) preliminary recommendation (subject to founder ratification at chunk 4 impl-onset substrate-load grade OR chunk 4 brief amendment cycle if chunk 4 brief substrate-load surfaces analogous substrate-evidence-propagation-gap).
