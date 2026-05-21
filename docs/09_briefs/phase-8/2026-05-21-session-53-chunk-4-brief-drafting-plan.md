# Session 53 Phase 8 Chunk 4 Brief-Drafting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compose Phase 8 chunk 4 brief at substantively-new-phase chunk-brief grade per cycle-close §5.1 framing #4 sub-chunk c (integration + audit trail + downstream consumer wiring: pipeline_trace router_match_against_state stage record + Logic Receipt audit consumer + Subsystem 2/3 downstream wiring at documentRouterService surfaces).

**Architecture:** Single docs-only artifact at `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md`. §1-§6 structure inheriting chunk 3 brief template (which inherited chunk 2 brief template). Subagent-dispatched composition per Session 50 + 51 + 52 subagent-dispatch sub-pattern N=3 cumulative (Phase 8 retro Commit A graduation candidate); briefing-grade anti-drift discipline at composition START per Session 52 chunk 3 N=1 first-instance precedent. ~590-640 LOC band-center forecast at substantively-new-phase chunk-brief grade.

**Tech Stack:** Markdown docs authoring. No code changes. ADR substrate + documentRouterService.ts + ingestDocument.ts read-only at Phase A grade.

---

## File Structure

**Files to create:**
- `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md` (~590-640 LOC; substantively-new-phase chunk-brief grade)

**Files to read (Phase A substrate verification):**
- `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-3.md` (chunk 3 brief; §-structure template inheritance + §2.3 inter-chunk dependency map + §6 carry-forward observations)
- `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-2.md` (chunk 2 brief; §2.1 per-document-type emission shape consumed at chunk 4 audit grade)
- `docs/09_briefs/phase-8/2026-05-21-phase-8-scope-lock-cycle-close.md` (§5.1 framing-pairing + §5.3 chunks 2-4 specific gate + §6.1 substrate dependencies + §7.2 chunks 2-4 brief-drafting framing)
- `docs/07_governance/adr/0018-relationship-router.md` (§2 lines 492-504 Subsystem 1 audit trail framing)
- `docs/07_governance/adr/0007-three-tier-agent-architecture.md` (§Q30 Logic Receipt audit composition)
- `docs/07_governance/adr/0014-tier-2-document-pipeline.md` (pipeline_trace JSONB substrate inheritance)
- `docs/07_governance/adr/0011-document-platform.md` (audit trail substrate consumer surface)
- `docs/07_governance/adr/0016-document-relationship-graph.md` (linked_entity_type substrate inheritance from chunk 2)
- `apps/web/src/services/document-platform/documentRouterService.ts` (completeCandidate / resolveCandidates / dispatchTrigger surfaces at Phase 4 chunks 1-3 ship state)
- `apps/web/src/agent/orchestrator/extraction/ingestDocument.ts` (pipeline_trace JSONB writer substrate from Phase 7 chunk 7.3b)

**Files to grep (Phase A discovery):**
- `apps/web/src/shared/schemas/document-platform/` (candidate_features schema location verification; consumer-only at chunk 4 grade)
- `apps/web/src/agent/orchestrator/` (Logic Receipt schema location; ProposalJustificationSchema substrate)

**Files NOT created:** Chunk 4 implementation substrate. Per Path B continuation disposition: chunk 4 impl deferred to canonical §9.5 sequencing at Sessions 59+ grade.

---

## Task 1: Phase A — Pre-composition verify-from-disk

**Files:**
- Read-only verification across substrate paths above

- [ ] **Step 1: Verify commits-ahead unchanged at Session 53 onset.**

```bash
git log --oneline origin/staging..HEAD | wc -l
```
Expected: `13` (was 13 at Session 52 close after `803c4b1` + `1f16eb6` + `683d5df`).

- [ ] **Step 2: Verify pnpm agent:validate 26/26 baseline preserved.**

```bash
pnpm agent:validate 2>&1 | tail -5
```
Expected: `Tests 26 passed (26)` in output.

- [ ] **Step 3: Verify working tree clean at Session 53 onset.**

```bash
git status --short
```
Expected: only pre-existing untracked Phase 6/6.5 carry-forwards (5 items); NO modified tracked files. Pre-existing untracked items match Session 52 close inheritance:
- `apps/web/tests/e2e/.auth/`
- `apps/web/tests/fixtures/document-pipeline-demo/`
- `docs/09_briefs/phase-6.5/2026-05-17-phase-6-5-retrospective-drafting-plan.md`
- `docs/09_briefs/phase-6.5/2026-05-17-session-14-substrate.md`
- `docs/09_briefs/phase-6/cto-proposal-final-document-drop-shell-consolidation.md:Zone.Identifier`

- [ ] **Step 4: Read chunk 3 brief in full as §-structure template inheritance source.**

Read `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-3.md`. Verify §1-§6 structure + §2.3 inter-chunk dependency map subsection + §6.1-§6.10 banking surface enumeration shape. Confirm 597 LOC at sub-curve (a) grade per Session 52 close.

- [ ] **Step 5: Read chunk 2 brief §2.1 per-document-type emission shape.**

Read `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-2.md` §2.1. Confirm per-document-type candidate generation pseudocode + linked_entity_type expansion adjudication framing — chunk 4 consumes per-document-type emission shape at pipeline_trace stage record grade.

- [ ] **Step 6: Read cycle-close §5.1 + §5.3 + §6.1 + §7.2 chunks 2-4 framing.**

Read `docs/09_briefs/phase-8/2026-05-21-phase-8-scope-lock-cycle-close.md`:
- Lines 264-276 (§5.1 chunk-framing pairing inventory; confirm chunk 4 ↔ framing #4 sub-chunk c)
- Line 308 (§5.3 chunks 2-4 specific gate)
- Lines 319-323 (§6.1 substrate dependencies; chunks 2-4 → chunk 7 ledger-extension surface consumed by post-v1 reconciliation orchestrator)
- Lines 367-379 (§7.2 chunks 2-4 brief-drafting framing)

- [ ] **Step 7: Read ADR-0018 §2 Subsystem 1 audit trail framing lines 492-504.**

```bash
sed -n '492,504p' docs/07_governance/adr/0018-relationship-router.md
```

Verify Subsystem 1 audit trail framing — pipeline_trace stage record substrate inheritance for chunk 4 router_match_against_state stage record extension.

- [ ] **Step 8: Read ADR-0007 §Q30 Logic Receipt audit composition.**

```bash
grep -n "Q30\|Logic Receipt" docs/07_governance/adr/0007-three-tier-agent-architecture.md | head -10
```

Locate §Q30 line offset; read 30-50 lines around it. Verify Logic Receipt audit composition surface — chunk 4 consumer-only inheritance at Logic Receipt grade (Layer 2 item #B amendment paired with chunk 9 per Sub-Q9 substrate-grade-first lock).

- [ ] **Step 9: List ADR canonical directory + verify all 5 ADR paths.**

```bash
ls docs/07_governance/adr/ | head -25
```

Cross-reference against:
- `0018-relationship-router.md` (NOT `0018-document-platform-services-and-state.md` or similar drift)
- `0007-three-tier-agent-architecture.md`
- `0014-tier-2-document-pipeline.md`
- `0011-document-platform.md`
- `0016-document-relationship-graph.md`

Preemptive substrate path verification at session-onset N=5 → N=6 confirming-fire candidate if all paths verify clean.

- [ ] **Step 10: Read documentRouterService.ts surfaces.**

```bash
grep -n "^export\|^export async function\|^export function" apps/web/src/services/document-platform/documentRouterService.ts | head -20
```

Confirm Subsystem 1 (`completeCandidate`) + Subsystem 2 (`resolveCandidates`) + Subsystem 3 (`dispatchTrigger`) surfaces at Phase 4 chunks 1-3 ship state. Chunk 4 downstream consumer wiring modification scope identified at Subsystem 2 + Subsystem 3 surfaces.

- [ ] **Step 11: Verify ingestDocument.ts pipeline_trace JSONB writer substrate.**

```bash
grep -n "pipeline_trace\|stage_record\|router_match" apps/web/src/agent/orchestrator/extraction/ingestDocument.ts | head -10
```

Confirm pipeline_trace writer substrate inheritance from Phase 7 chunk 7.3b ship. Identify pipeline_trace stage record extension surface for chunk 4 router_match_against_state stage record emission.

- [ ] **Step 12: Verify candidate_features schema location (consumer-only at chunk 4).**

```bash
find apps/web/src -name "candidate_features*" -o -name "*candidate-features*" 2>/dev/null | head -5
ls apps/web/src/shared/schemas/document-platform/ 2>/dev/null
```

Confirm candidate_features.schema.ts location post-chunk-3-substrate-creation (chunk 4 consumer-only inheritance). If non-existent at Session 53 onset, mark consumer surface as substrate-pending-chunk-3-impl per F-J-14 Grain 1 brief-vs-substrate-availability framing.

- [ ] **Step 13: HALT-and-surface gate.**

If any of Steps 1-12 surfaces material divergence (handoff-vs-substrate path drift, working tree dirty, ADR path miscitation, baseline regression, Subsystem 1/2/3 surface state mismatch), HALT and surface to founder before Task 2 dispatch fires. Per Session 51 Phase A halt-and-surface precedent (γ' resolution sequence) + preemptive substrate path verification at session-onset N=6 confirming-fire candidate.

---

## Task 2: Dispatch subagent for chunk 4 brief composition

**Files:**
- Will create: `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md`

- [ ] **Step 1: Compose comprehensive subagent briefing with briefing-grade anti-drift discipline.**

Per Session 52 chunk 3 briefing-grade anti-drift precedent (subagent-composition-grade anti-drift discipline via explicit briefing N=1 → N=2 confirming-fire candidate): briefing includes verified-correct ADR paths + substrate citation grounding at composition START (preventive at composition-input surface rather than reactive at composition-output spot-check surface).

The briefing must include:

(a) **§-structure template inheritance**: explicit reference to chunk 3 brief at `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-3.md` as canonical template. Match §1-§6 structure + §2.3 inter-chunk dependency map + §6.1-§6.10 banking surface enumeration shape. Chunk 3 brief inherits chunk 2 brief inherits chunk 1 brief structure.

(b) **Substantive scope (extracted from cycle-close §5.1 + §7.2)**: chunk 4 = framing #4 sub-chunk c integration + audit trail + downstream consumer wiring. Three named axes:

- **Axis 1**: pipeline_trace JSONB router_match_against_state stage record per ADR-0018 §2 lines 492-504 Subsystem 1 audit trail framing. New pipeline_trace stage record entry at `documentRouterService.completeCandidate` function-close grade capturing chunk 2 per-document-type candidate generation outputs + chunk 3 per-feature scoring composition outputs at audit grade. Substrate writer: `apps/web/src/agent/orchestrator/extraction/ingestDocument.ts` per Phase 7 chunk 7.3b inheritance.
- **Axis 2**: ADR-0007 §Q30 Logic Receipt audit composition consumer surface. Chunk 4 substrate consumes chunk 3 candidate_features Zod-typed schema shape + chunk 2 per-document-type emission at Logic Receipt audit composition surface. Logic Receipt parallel field shape per Layer 2 item #B amendment ratification timing (paired with chunk 9 per Sub-Q9 substrate-grade-first lock; chunk 4 consumer-only at Logic Receipt grade). ProposalJustificationSchema formal Zod codification deferred to chunk 9 grade.
- **Axis 3**: Downstream consumer wiring at Subsystem 2 (`resolveCandidates`) ambiguity resolution surface + Subsystem 3 (`dispatchTrigger`) re-evaluation re-routing decision wiring. Subsystem 2 consumes chunk 3 expanded scoring output surface at ambiguity-margin-zero discipline; Subsystem 3 consumes Subsystem 2 routing outcome at T-series dispatch decision grade.

(c) **What chunk 4 does NOT ship** (deferred per Sub-Q14 N=3 SPLIT lock + cycle-close §9.5 brief-then-impl sequencing):

- Chunks 2 + 3 substrate (framing #4 sub-chunks a + b): already shipped at chunk 2 brief commit `5dc042a` + chunk 3 brief commit `683d5df`; chunk 4 inherits chunks 2 + 3 scope as preceding-sub-chunk substrate. Chunks 2 + 3 impl deferred to Sessions 59+ per canonical §9.5 sequencing.
- ProposalJustificationSchema formal Zod codification per Layer 2 item #B amendment: deferred to chunk 9 per Sub-Q9 substrate-grade-first lock; chunk 4 consumer-only at Logic Receipt grade.
- Chunks 5-10 substrate (framings #6 + #7 + #8 + #9 + #10 + #11): deferred to Sessions 54-58 brief-drafting cycle continuation per Path B sequential framing.

(d) **Verified-correct substrate citations** (preemptive against Session 51 subagent-composition-grade ADR-path drift sub-pattern N=1 first-instance inheritance + Session 52 briefing-grade prevention N=1 first-instance inheritance):

- ADR-0018: `docs/07_governance/adr/0018-relationship-router.md` (NOT `0018-document-platform-services-and-state.md` or similar drift)
- ADR-0007: `docs/07_governance/adr/0007-three-tier-agent-architecture.md` (NOT `0007-three-tier-architecture.md` or similar drift)
- ADR-0014: `docs/07_governance/adr/0014-tier-2-document-pipeline.md`
- ADR-0011: `docs/07_governance/adr/0011-document-platform.md`
- ADR-0016: `docs/07_governance/adr/0016-document-relationship-graph.md`

(e) **Path C invocation evaluation at brief-grade**: Sub-Q14 N=3 SPLIT lock at scope-lock cycle Round 3 PRE-DECOMPOSED framing #4 into 3 sub-chunks (chunks 2-4). Chunk 4 brief composition fires F-J-14 Grain 1 prospective evaluation at sub-chunk-impl-bound vs further-SPLIT grade. **NO-SPLIT outcome forecast** at brief-grade (sub-chunk scope already adjudicated at scope-lock-cycle grade; chunk 4 sub-chunk c integration + audit trail + downstream consumer wiring three-axis scope coheres at single-sub-chunk-impl-bound grade).

F-J-14 Grain 1 seventh-instance NO-SPLIT outcome banking (Phase 4 chunk 3 reactive first + Phase 6 chunk 6.2a prospective second + Phase 7 chunk 7.1 prospective third SPLIT + Phase 8 chunk 1 prospective fourth NO-SPLIT + Phase 8 chunk 2 prospective fifth NO-SPLIT + Phase 8 chunk 3 prospective sixth NO-SPLIT + Phase 8 chunk 4 prospective seventh NO-SPLIT).

(f) **Forecast band**: ~590-640 LOC at substantively-new-phase chunk-brief sub-curve (a) grade per chunk 2 brief 592 LOC + chunk 3 brief 597 LOC + Phase 5.1 chunk 5.1a 605 + Phase 6.5 chunk 1 623 + Phase 7 chunk 7.1 592 anchor inheritance.

(g) **§1.2 session-onset divergence absorption for chunk 4**:

- (α) Session 53 Disposition 1 (Path B continuation, chunk 4 brief single) ratified via `/superpowers:brainstorming` skill workflow at design doc commit `<NEW_SHA>` (Session 53 design doc); chunk 4 brief composition fires per Path B sequential continuation framing inheritance from Session 52 design doc `803c4b1`. Banking observation: sequential-brief-drafting-cycle-progresses-substrate-readiness sub-pattern N=2 confirming-fire (promotion threshold N=2 MET) + Path B disposition selection sub-pattern N=2 confirming-fire (promotion threshold N=2 MET).
- (β) Multi-chunk-consolidation-framing-substrate-grade-grain mismatch sub-pattern N=1 first-instance surfaced at brainstorming-side adjudication grade (Session 53 design doc §3.2 + §4.2 + §6 banking) — WSL-side at directive composition grade enumerated Disposition 2 as "chunks 4 + 5 multi-chunk consolidation" without checking §7.8 same-framing-grouping framing (chunks 5 + 6 canonical per §7.8). Brainstorming-side caught the mismatch; Disposition 1 single-chunk holds at Session 53; chunks 5 + 6 same-framing-grouping consolidation deferred to Session 54 evaluation grade.
- (γ) Skill-chain composition: `/superpowers:brainstorming` → `/superpowers:writing-plans` → execution per Session 52 plan-doc + design-doc + brief-doc three-artifact composition shape sub-pattern N=2 confirming-fire candidate (promotion threshold N=2 MET).

(h) **§6 carry-forward observation banking surface inheritance** from Session 52 close (full enumeration at chunk 3 brief §6 + Session 52 close summary):

- **N=3+ promotion-threshold-MET candidates firing at Session 53 (6 simultaneous)**:
  - Sub-chunk-impl-bound vs further-SPLIT distinction N=3 confirming-fire (Phase 8 chunks 2 + 3 + 4)
  - Sequential-brief-drafting-cycle-progresses-substrate-readiness N=2 confirming-fire (Sessions 52 + 53)
  - Subagent-composition-grade anti-drift via explicit briefing N=2 confirming-fire (Sessions 52 + 53)
  - Subagent-dispatch sub-pattern N=4 confirming-fire (Sessions 50 + 51 + 52 + 53)
  - Chunk-brief-drafting sub-curve (a) substantively-new-phase calibration N=4 confirming-fire forecast
  - F-J-14 Grain 1 NO-SPLIT outcome sub-sub-pattern N=4 confirming-fire forecast (chunks 1 + 2 + 3 + 4)
- **Preemptive substrate path verification at session-onset** N=6 confirming-fire candidate.
- **Directive-grade self-correction anti-drift** N=8 cumulative confirming-fire (Session 53 directive composition + brainstorming-side disposition acknowledgment + multi-chunk-consolidation-framing mismatch surfacing fired N=8 firing).
- **Substrate-evidence-propagation-gap** N=3 maintained (Phase 8 retro Commit B graduation candidate substantively past N=2 promotion threshold).
- **Multi-chunk-consolidation-framing-substrate-grade-grain mismatch** N=1 first-instance NEW at brainstorming-side adjudication grade (sibling to substrate-grade-grain mismatch from Session 50).
- **Interleaved cycle posture** N=2 promotion-threshold-met PRESERVED ungraduated per Disposition 1 sequential continuation.
- **Coordination warning** N=12 → N=13 cumulative firing candidate at Task 4 commit grade (Sessions 43-53 cumulative if warning fires).

(i) **Verification before reporting complete**: subagent must verify final brief LOC against forecast band + §-structure complete + substrate citation paths verified-correct via post-composition spot-check (mirror chunk 3 brief precedent). Briefing-grade anti-drift means subagent ALSO verifies ADR paths via `ls docs/07_governance/adr/` BEFORE citing in brief composition (preventive at composition-input surface).

- [ ] **Step 2: Dispatch via Agent tool.**

```
Agent({
  description: "Phase 8 chunk 4 brief composition",
  subagent_type: "general-purpose",
  prompt: <briefing from Step 1>
})
```

Wait for subagent completion notification + report.

- [ ] **Step 3: Verify subagent output structure.**

```bash
wc -l docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md
grep -n "^## \|^### " docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md | head -40
```

Expected:
- LOC in 590-640 band (sub-curve (a) calibration N=4 confirming-fire candidate)
- §1-§6 + §1.1-§1.4 + §6.x sub-section structure consistent with chunk 3 brief template

Read first 50 lines of `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md` to confirm header matter (Date, Phase, Chunk, Path C disposition, Status, Session shape, Predecessor, Baseline, Sub-curve grade) + §1 Preamble structure (§1.1 brief context + §1.2 divergence absorption + §1.3 Path C invocation evaluation + §1.4 cross-references).

---

## Task 3: Post-composition ADR-path spot-check

**Files:**
- Modified (inline edits if drift surfaces): `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md`

- [ ] **Step 1: Enumerate all ADR-path citations in composed brief.**

```bash
grep -n "07_governance/adr/" docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md
```

- [ ] **Step 2: Verify each cited ADR filename against canonical directory.**

```bash
ls docs/07_governance/adr/ | head -25
```

Cross-reference Step 1 output against Step 2 output. Each ADR-NNNN-... in Step 1 must match exact filename in Step 2.

- [ ] **Step 3: If briefing-grade anti-drift held clean, expect ZERO drift firings.**

Per Session 52 chunk 3 precedent: briefing-grade anti-drift discipline at composition START preempted Session 51 N=1 first-instance post-composition correction. If briefing-grade prevention holds at Session 53 grade, subagent-composition-grade anti-drift discipline via explicit briefing N=2 confirming-fire (promotion threshold N=2 MET); ADR-path-citation drift sub-pattern N=1 maintained at Session 51 first-instance grade (NOT graduating).

If ANY ADR-path drift surfaces, fire inline-edit correction. Also correct any associated label drift (e.g., "ADR-0007 (Three-tier architecture)" → "ADR-0007 (Three-tier agent architecture)"). Add §6.1 banking entry for subagent-composition-grade ADR-path-citation drift N=2 confirming-fire if drift fires (briefing-grade prevention discipline failed).

- [ ] **Step 4: Verify final LOC band post-corrections.**

```bash
wc -l docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md
```

Expected: 590-640 (within forecast band).

---

## Task 4: Commit chunk 4 brief

**Files:**
- Stage: `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md`

- [ ] **Step 1: Stage the chunk 4 brief file.**

```bash
git add docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md
```

- [ ] **Step 2: Commit with comprehensive message.**

Commit message template (refine at chunk-4-execution-grade per per-task evidence):

```
docs(phase-8): chunk 4 brief — framing #4 sub-chunk c ledger extensions: integration + audit trail + downstream consumer wiring (pipeline_trace router_match_against_state stage record + Logic Receipt audit consumer + Subsystem 2/3 downstream wiring at documentRouterService surfaces)

Substrate ships:

docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md (~590-640
LOC at substantively-new-phase chunk-brief sub-curve (a) grade per
Phase 5.1+6.5+7 + Phase 8 chunks 2+3 brief precedent inheritance):
[detail per chunk 4 brief §-structure]

§1.2 Divergence absorption:
(α) Session 53 Disposition 1 (Path B continuation, chunk 4 brief
single) ratified per design doc <NEW_SHA>; chunk 4 brief composition
fires per Path B sequential continuation framing inheritance from
Session 52 design doc 803c4b1.
(β) Multi-chunk-consolidation-framing-substrate-grade-grain mismatch
sub-pattern N=1 first-instance surfaced at brainstorming-side
adjudication grade (Disposition 2 cross-framing chunks 4+5 vs §7.8
canonical same-framing-grouping chunks 5+6); brainstorming-side
caught the mismatch; Disposition 1 single-chunk holds.
(γ) Skill-chain composition Path 2 fired:
/superpowers:brainstorming → /superpowers:writing-plans →
subagent-driven-development execution.

Banking surfaces materialized at Session 53 close grade:
[full enumeration per chunk 4 brief §6.1-§6.x — 6 N=3+
promotion-threshold-MET candidates simultaneously]

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

- [ ] **Step 3: Verify post-commit state.**

```bash
git log --oneline origin/staging..HEAD | head -5
```

Expected: 15 commits ahead of origin/staging (was 13 at Session 52 close + design doc commit + plan commit + chunk 4 brief commit = 15; OR 14 if design doc + plan committed together as a single artifact bundle). Adjust expected count to actual.

---

## Task 5: Update memory + Session 53 close summary

**Files:**
- Create: `~/.claude/projects/-home-philc-projects-chounting/memory/project_phase_8_chunk_4_brief_shipped.md`
- Modify: `~/.claude/projects/-home-philc-projects-chounting/memory/MEMORY.md` (add index entry)

- [ ] **Step 1: Write Phase 8 chunk 4 brief shipped topic memory file.**

Template per Session 51 chunk 2 brief shipped + Session 52 chunk 3 brief shipped memory file precedent. Capture:
- Commit SHA + LOC + §-structure
- Substantive scope (three-axis: pipeline_trace stage record + Logic Receipt audit consumer + downstream consumer wiring at Subsystem 2/3)
- Banking surfaces materialized at Session 53 close (full enumeration; ~10-15+ banking surfaces with 6 N=3+ promotion-threshold-MET candidates)
- Validation gate state (pnpm agent:validate 26/26 green; working tree clean post-commits)
- Next operational fire (Session 54 disposition: continued sequential brief-drafting [chunk 5 single OR chunks 5+6 §7.8 canonical multi-chunk consolidation] OR alternative founder operational adjudication)
- Phase 8 implementation cycle status (1 of 10 chunk-impl sessions substrate-complete; 4 of 10 chunk briefs shipped)

- [ ] **Step 2: Update MEMORY.md index entry.**

Insert tight one-line entry after `project_phase_8_chunk_3_brief_shipped.md` entry. Format per project convention (substantive but bounded under ~200 chars per MEMORY.md size discipline).

- [ ] **Step 3: Compose Session 53 close summary in conversation.**

Mirror Session 52 close summary shape. Cover:
- Three-commit Session 53 close shape (Session 53 design doc + Session 53 plan + chunk 4 brief commit) per Session 52 precedent inheritance — OR four-commit Session 53 close shape if ADR-path-drift correction commit fires separately
- Per-task acceptance criteria walk-through
- Validation gate state
- Push posture (15 commits ahead of origin/staging post-Session-53; no push at chunk-brief-drafting grade per Candidate #13)
- Banking surfaces materialized (with 6 N=3+ promotion-threshold-MET candidates firing simultaneously)
- Next operational fire (Session 54 disposition)

---

## Self-Review Checklist

After Tasks 1-5 land:

- [ ] **Spec coverage:** All sections of Session 53 design doc §5 operational consequences covered by tasks (§5.1 substantive surface three-axis decomposition + §5.2 forecast band + §5.3 envelope timing preservation + §5.4 sequential brief-drafting cycle continuation)?
- [ ] **Placeholder scan:** No TBD/TODO/incomplete-section in chunk 4 brief at composition close.
- [ ] **Type consistency:** All `linked_entity_type` references use 6-value v1-active subset per ADR-0016 §1 Phase 2.5 amendment; all `pipeline_trace` references match ADR-0014 substrate inheritance + Phase 7 chunk 7.3b ship state; all `Logic Receipt` references match ADR-0007 §Q30 framing.
- [ ] **Path-citation drift:** All ADR-path citations verified against `ls docs/07_governance/adr/` (preemptive per Session 51 N=1 first-instance + Session 52 briefing-grade prevention inheritance).

---

## Operational Notes

**Subagent-dispatch execution shape**: Task 2 is the heaviest task at substrate-composition grade. Subagent dispatch with comprehensive briefing inheriting chunk 3 brief composition precedent + briefing-grade anti-drift discipline at composition START per Session 52 N=1 first-instance inheritance. WSL-side post-composition spot-check at Task 3 grade serves as preemptive backstop if briefing-grade prevention misses.

**Anti-drift discipline at every step**: substrate citations verified at Task 1 Phase A grade BEFORE Task 2 dispatch. ADR-path verification at Task 3 grade AFTER Task 2 composition. Preemptive substrate path verification at session-onset N=6 confirming-fire candidate if Phase A holds clean (Session 53 strengthens cumulative banking past N=3 promotion threshold substantially).

**F-J-14 Grain 3 mid-impl reactive readiness**: NOT EXPECTED at brief-drafting cycle grade. Grain 3 operates at chunk-impl grade per Phase 7 chunk 7.3b first-fire + Session 50 chunk 1 second-fire precedent. Session 53 fires brief-drafting cycle; Grain 3 carries forward to chunks 2/3/4 impl future sessions at Sessions 59+ grade.

**Push posture**: No push at chunk-brief-drafting grade per Candidate #13 push-terminal-close discipline (N=5 fires at Phase 8 retrospective close ~Session 72). Banks locally on staging branch at 15 commits ahead of origin/staging post-Session-53 close (was 13 at Session 52 close).

**Coordination warning posture**: Coordination warning N=12 → N=13 firing candidate at Task 4 commit grade (Sessions 43-53 cumulative if warning fires). Codification candidate substantially past N=3 promotion threshold; routing target Phase 8 retrospective Commit B grade.

**Multi-chunk-consolidation-framing-substrate-grade-grain mismatch sub-pattern banking carry-forward**: N=1 first-instance at Session 53 brainstorming-side adjudication grade (Disposition 2 cross-framing chunks 4+5 vs §7.8 canonical same-framing-grouping chunks 5+6). Promotion threshold N=2 pending future multi-chunk consolidation evaluation at Session 54+ grade (chunks 5+6 §7.8 canonical evaluation). Routing target Phase 8 retrospective Commit B grade per substrate-grade-grain mismatch sub-pattern routing inheritance.
