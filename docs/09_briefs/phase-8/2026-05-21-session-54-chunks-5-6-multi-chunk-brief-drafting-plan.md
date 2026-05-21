# Session 54 Phase 8 Chunks 5 + 6 Multi-Chunk Consolidated Brief-Drafting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compose Phase 8 chunks 5 + 6 multi-chunk consolidated brief at multi-chunk-consolidated-brief grade per cycle-close §7.8 canonical same-framing-grouping framing (both framing #6 sub-chunks). Chunk 5 (sub-chunk a) UI test infrastructure: vitest jsdom + @testing-library/react infra + per-component test fixtures three-component scope per Sub-Q4. Chunk 6 (sub-chunk b) UI test infrastructure: e2e assertion body authoring 3 blocks per Sub-Q6.

**Architecture:** Single docs-only artifact at `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunks-5-6.md` (multi-chunk artifact naming convention). §1-§6 structure inheriting chunk 4 brief template (which inherited chunk 3 brief template); §2.1 + §2.2 + §2.3 extended to cover BOTH chunks 5 AND 6 substantive surfaces; §4 Tasks split per chunk (chunk 5 tasks + chunk 6 tasks + consolidated close gate). Single-subagent-per-consolidated-brief dispatch per Finding C sub-option (a) preliminary recommendation (preserves coherence boundary at consolidated artifact grade; briefing-grade anti-drift fires once at composition START). ~1200-1300 LOC consolidated upper bound forecast at multi-chunk-consolidated-brief grade.

**Tech Stack:** Markdown docs authoring. No code changes. ADR substrate + vitest config + component substrate + e2e test scaffolding read-only at Phase A grade.

---

## File Structure

**Files to create:**
- `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunks-5-6.md` (~1200-1300 LOC consolidated upper bound at multi-chunk-consolidated-brief grade)

**Files to read (Phase A substrate verification):**
- `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md` (chunk 4 brief; §-structure template inheritance + §6 carry-forward observations + Session 53 inheritance)
- `docs/09_briefs/phase-8/2026-05-21-phase-8-scope-lock-cycle-close.md` (§5.1 framing-pairing + §5.3 chunks 5-6 specific gates + §6.3 UI consumer dependencies + §7.3 chunks 5-6 brief-drafting framing + §7.8 multi-chunk consolidation candidate framing + §10.4 code surfaces)
- `docs/07_governance/adr/0014-tier-2-document-pipeline.md` (extraction pipeline 8-stage substrate; chunk 6 e2e assertion per-stage substrate inheritance)
- `docs/07_governance/adr/0011-document-platform.md` (DocumentCard 7-state machine substrate; chunk 5 test fixture target inheritance)
- `docs/07_governance/adr/0007-three-tier-agent-architecture.md` (three-tier composition substrate; chunk 5 test fixtures preserve three-tier composition per service-architecture invariants)

**Files to grep (Phase A discovery):**
- `apps/web/vitest.config.ts` or analogous (vitest config substrate; chunk 5 jsdom activation surface)
- `apps/web/package.json` (@testing-library/react dependency inheritance verification)
- `apps/web/tests/unit/` directory (existing unit test substrate per Sub-Q18 three-surface lock)
- `apps/web/tests/unit/components/` (NEW subdirectory per Sub-Q18 net-new framing; verify NON-existence)
- `apps/web/tests/integration/e2e/` (existing e2e test scaffolding from chunk 7.3b ship; 3 e2e test files expected per cycle-close §10.4)
- `apps/web/src/components/document-platform/DocumentCard.tsx` (or analogous; DocumentCard substrate from chunk 7.3b)
- `apps/web/src/components/document-platform/ProposedAttachmentCard.tsx` (or analogous; ProposedAttachmentCard substrate from chunk 6.2b)
- `apps/web/src/components/document-platform/PendingDocumentsView.tsx` (or analogous; PendingDocumentsView substrate from chunk 7.3b)

**Files NOT created:** Chunks 5 + 6 implementation substrate. Per Candidate (b) ratification: chunks 5 + 6 impl deferred to canonical §9.5 sequencing at Sessions 59+ grade.

---

## Task 1: Phase A — Pre-composition verify-from-disk + substrate-density-permits check

**Files:**
- Read-only verification across substrate paths above

- [ ] **Step 1: Verify commits-ahead unchanged at Session 54 onset.**

```bash
git log --oneline origin/staging..HEAD | wc -l
```
Expected: `17` (was 17 at Session 53 close after `30c566e` + `7051f1c` + `f34bd81` + `a2c20fa`).

- [ ] **Step 2: Verify pnpm agent:validate 26/26 baseline preserved.**

```bash
pnpm agent:validate 2>&1 | tail -5
```
Expected: `Tests 26 passed (26)` in output.

- [ ] **Step 3: Verify working tree clean at Session 54 onset.**

```bash
git status --short
```
Expected: only pre-existing untracked Phase 6/6.5 carry-forwards (5 items); NO modified tracked files. Pre-existing untracked items match Session 53 close inheritance.

- [ ] **Step 4: Read chunk 4 brief in full as §-structure template inheritance source.**

Read `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md`. Verify §1-§6 structure + §2.3 inter-chunk dependency map + §6.1-§6.10 banking surface enumeration. Confirm 620 LOC at sub-curve (a) grade per Session 53 close.

- [ ] **Step 5: Read cycle-close §5.1 + §5.3 + §6.3 + §7.3 + §7.8 + §10.4 chunks 5-6 framing.**

Read `docs/09_briefs/phase-8/2026-05-21-phase-8-scope-lock-cycle-close.md`:
- §5.1 framing-pairing inventory (chunk 5 ↔ framing #6 sub-chunk a + chunk 6 ↔ framing #6 sub-chunk b)
- §5.3 chunks 5-6 specific gates (vitest jsdom config + RTL fixtures + three-component test fixtures at chunk 5; 3 e2e assertion blocks at chunk 6)
- §6.3 UI consumer dependencies (chunks 5 + 6 → DocumentCard + ProposedAttachmentCard + PendingDocumentsView from chunks 6.2b + 7.3b substrate; e2e gated on chunk 1 demo re-fire)
- §7.3 chunks 5-6 brief-drafting framing (chunk 5 ~250-470 LOC; chunk 6 ~600-1050 LOC; consolidated upper bound ~1200-1300 LOC)
- §7.8 multi-chunk consolidation candidate framing ("Sessions 53-54 framing #6 sub-chunks if substrate-density at brief-drafting grade permits")
- §10.4 code surfaces (`apps/web/tests/unit/components/` + `apps/web/tests/integration/e2e/documentPipeline.*.e2e.test.ts`)

- [ ] **Step 6: Read ADR-0014 extraction pipeline 8-stage substrate.**

Read `docs/07_governance/adr/0014-tier-2-document-pipeline.md` §13 canonical Stage names (Stages 0-7). Verify chunk 6 e2e assertion per-stage substrate inheritance — 9 active pipeline stages (Stages 0-7 plus Subsystem 1 router_match_against_state per chunk 4 grade).

- [ ] **Step 7: Read ADR-0011 DocumentCard 7-state machine substrate.**

```bash
grep -n "DocumentCard\|document_state\|7-state" docs/07_governance/adr/0011-document-platform.md | head -15
```

Locate 7-state machine framing. Confirm chunk 5 DocumentCard test fixture target inheritance from chunk 7.3b ship.

- [ ] **Step 8: List ADR canonical directory + verify all 3 ADR paths.**

```bash
ls docs/07_governance/adr/ | head -25
```

Cross-reference against:
- `0014-tier-2-document-pipeline.md`
- `0011-document-platform.md`
- `0007-three-tier-agent-architecture.md`

Preemptive substrate path verification at session-onset N=6 → N=7 confirming-fire candidate if all paths verify clean.

- [ ] **Step 9: Verify existing unit test substrate.**

```bash
ls apps/web/tests/unit/ 2>/dev/null && echo "---" && find apps/web/tests/unit -type d 2>/dev/null | head -10
```

Confirm existing unit test substrate at canonical location per Sub-Q18 three-surface lock.

- [ ] **Step 10: Verify apps/web/tests/unit/components/ NON-existence at Phase A grade.**

```bash
ls apps/web/tests/unit/components/ 2>/dev/null && echo "EXISTS" || echo "DOES NOT EXIST (expected per Sub-Q18 net-new framing)"
```

Expected: `DOES NOT EXIST` per Sub-Q18 net-new framing inheritance (chunk 5 substrate creates this subdirectory at impl-grade; brief composition references it at canonical path).

- [ ] **Step 11: Verify existing e2e test scaffolding substrate from chunk 7.3b ship.**

```bash
ls apps/web/tests/integration/e2e/ 2>/dev/null && echo "---" && find apps/web/tests/integration/e2e -name "documentPipeline.*.e2e.test.ts" 2>/dev/null | head -10
```

Expected: 3 e2e test files per cycle-close §10.4 (vendor_invoice + receipt + payment_confirmation document_type branches).

- [ ] **Step 12: Verify vitest config + @testing-library/react substrate inheritance.**

```bash
ls apps/web/vitest.config.ts 2>/dev/null || find apps/web -name "vitest.config.ts" -o -name "vitest.config.mts" -o -name "vitest.config.js" 2>/dev/null | head -5
grep -n "@testing-library/react\|jsdom" apps/web/package.json | head -10
```

Confirm vitest config substrate path + @testing-library/react dependency inheritance.

- [ ] **Step 13: Verify three-component substrate inheritance.**

```bash
find apps/web/src/components -name "DocumentCard*" -o -name "ProposedAttachmentCard*" -o -name "PendingDocumentsView*" 2>/dev/null | head -10
```

Expected: 3 component files (DocumentCard from chunk 7.3b + ProposedAttachmentCard from chunk 6.2b + PendingDocumentsView from chunk 7.3b). Surface canonical file paths for chunk 5 brief composition substrate citation grade.

- [ ] **Step 14: Substrate-density-permits check.**

Per cycle-close §7.8 framing + Session 54 design doc §5.2: evaluate substrate density at brief-drafting grade. Verify that:
- (a) Chunk 5 substrate scope at sub-chunk a UI infra activation grade (~250-470 LOC chunk-brief forecast) does not exceed chunk-coherent composition bound.
- (b) Chunk 6 substrate scope at sub-chunk b e2e assertion body authoring grade (~600-1050 LOC chunk-brief forecast) does not exceed chunk-coherent composition bound.
- (c) Consolidated chunks 5 + 6 substrate scope (~1200-1300 LOC consolidated upper bound) is within single-session-bound brief composition feasibility.

If substrate-density evidence at Phase A grade surfaces material divergence from cycle-close §7.3 forecast bands (e.g., chunk 6 substrate scope materially exceeds ~1050 LOC upper bound due to per-stage assertion scope expansion across 9 active pipeline stages × 3 document_type branches), HALT-and-surface gate fires for founder operational adjudication.

Banking observation if substrate-density-permits check fires: **multi-chunk-consolidation-substrate-density-permits-check sub-pattern N=1 first-instance** materializes at Phase A grade. Sibling to F-J-14 Grain 1 brief-draft prospective Path C invocation evaluation.

- [ ] **Step 15: HALT-and-surface gate.**

If any of Steps 1-14 surfaces material divergence (handoff-vs-substrate path drift, working tree dirty, ADR path miscitation, baseline regression, substrate-density-exceeds-bound), HALT and surface to founder before Task 2 dispatch fires. Per Sessions 51 + 53 Phase A halt-and-surface precedent (γ' resolution + path-citation drift resolution) + preemptive substrate path verification at session-onset N=7 confirming-fire candidate.

If substrate-density-permits check at Step 14 fires SPLIT-back: surface recovery path = Candidate (a) chunk 5 single-chunk brief at Session 54 + chunk 6 brief deferred to Session 55. Founder operational adjudication selects recovery path or alternative.

---

## Task 2: Single subagent dispatch for chunks 5 + 6 consolidated brief composition

**Files:**
- Will create: `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunks-5-6.md`

- [ ] **Step 1: Compose comprehensive subagent briefing with briefing-grade anti-drift discipline at composition START.**

Per Sessions 52 + 53 chunks 3 + 4 brief composition precedent (subagent-composition-grade anti-drift discipline via explicit briefing N=2 → N=3 promotion-threshold-MET candidate): briefing includes verified-correct ADR paths + substrate citation grounding + chunks 5 + 6 substantive surface decomposition framing at composition START.

The briefing must include:

(a) **§-structure template inheritance**: explicit reference to chunk 4 brief at `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md` as canonical template. Match §1-§6 structure + §2.3 inter-chunk dependency map + §6.1-§6.10 banking surface enumeration shape. Extend §2.1 + §2.2 + §2.3 + §4 Tasks to cover BOTH chunks 5 AND 6 substantive surfaces per multi-chunk consolidation framing.

(b) **Chunk 5 substantive scope (framing #6 sub-chunk a UI test infrastructure)**:
- **Axis 1**: vitest jsdom config activation at vitest.config.ts (path verified at Phase A grade Step 12).
- **Axis 2**: @testing-library/react infra activation + per-component test fixtures at NEW subdirectory `apps/web/tests/unit/components/` (verified NON-existent at Phase A grade Step 10; chunk 5 substrate creates).
- **Axis 3**: Three-component scope per Sub-Q4 lock — DocumentCard 7-state machine assertions (per ADR-0011 chunk 7.3b substrate) + ProposedAttachmentCard structural-parity-with-ProposedEntryCard assertions (per chunk 6.2b substrate) + PendingDocumentsView per-batch-tab routing assertions (per chunk 7.3b substrate).

(c) **Chunk 6 substantive scope (framing #6 sub-chunk b UI test infrastructure)**:
- **Axis 1**: E2e assertion body authoring at `apps/web/tests/integration/e2e/documentPipeline.*.e2e.test.ts` per Sub-Q6 assertion-per-doc-type-end-to-end shape (3 blocks aligned with chunk 7.3b 3-test-file structure; verified 3 files at Phase A grade Step 11).
- **Axis 2**: Per-doc-type assertion body stage-by-stage sub-assertions across 9 active pipeline stages (Stages 0-7 per ADR-0014 §13 + Subsystem 1 router_match_against_state per chunk 4 grade). 3 document_type branches: vendor_invoice + receipt + payment_confirmation.
- **Axis 3**: Demo re-fire validation gating at chunk 1 substrate inheritance (per cycle-close §6.3 UI consumer dependency framing: e2e assertion gated on chunk 1 demo re-fire validation per push-terminal-close discipline).

(d) **What chunks 5 + 6 do NOT ship** (deferred per Sub-Q15 N=2 SPLIT inheritance + cycle-close §9.5 brief-then-impl sequencing):
- Chunks 5 + 6 implementation substrate: deferred to Sessions 59+ per canonical §9.5 sequencing.
- Chunks 7-10 substrate (framings #2 + #3 + #5 + #7): deferred to Sessions 55-58 brief-drafting cycle continuation per Path B sequential framing. Chunk 7 (framing #2 post-v1 reconciliation orchestrator) is the next brief-drafting session per cycle-close §5.1.

(e) **Verified-correct substrate citations** (preemptive against substrate-evidence-propagation-gap sub-pattern N=4 cumulative inheritance from Session 53):

- ADR-0014: `docs/07_governance/adr/0014-tier-2-document-pipeline.md`
- ADR-0011: `docs/07_governance/adr/0011-document-platform.md`
- ADR-0007: `docs/07_governance/adr/0007-three-tier-agent-architecture.md`
- vitest config: path verified at Phase A grade Step 12 (likely `apps/web/vitest.config.ts` or `.mts`)
- Component substrate paths verified at Phase A grade Step 13 (DocumentCard + ProposedAttachmentCard + PendingDocumentsView canonical file paths)
- E2e test scaffolding path verified at Phase A grade Step 11 (`apps/web/tests/integration/e2e/documentPipeline.*.e2e.test.ts` — 3 files)
- NEW unit/components/ subdirectory: `apps/web/tests/unit/components/` (verified NON-existent at Phase A grade Step 10; chunk 5 substrate creates)

(f) **Path C invocation evaluation at multi-chunk-consolidated-brief grade**: Sub-Q15 N=2 SPLIT lock at scope-lock cycle Round 3 pre-decomposed framing #6 into 2 sub-chunks (chunks 5 + 6). Multi-chunk consolidation recomposes chunks 5 + 6 at single-session-bound brief composition grade per cycle-close §7.8 canonical same-framing-grouping framing. **Multi-chunk consolidation N=1 first-instance** materializes at Session 54 grade per Candidate (b) firing.

F-J-14 Grain 1 prospective NO-SPLIT outcome forecast for BOTH chunks 5 AND 6 at consolidated brief grade — each chunk's sub-chunk a OR sub-chunk b scope is well-bounded at substrate-density-permits check Phase A grade. NO-SPLIT outcome sub-sub-pattern N=4 → N=5 (chunk 5) OR N=6 (chunks 5 + 6 both NO-SPLIT) confirming-fire candidate.

(g) **Forecast band**: ~1200-1300 LOC consolidated upper bound at multi-chunk-consolidated-brief grade per cycle-close §7.3 framing (chunk 5 ~250-470 + chunk 6 ~600-1050; consolidated upper bound estimate). Sub-curve calibration disambiguation at multi-chunk-consolidated-brief grade N=1 first-instance candidate materializes if LOC lands materially above sub-curve (a) band-center (~590-640 single-chunk grade).

(h) **§1.2 session-onset divergence absorption for chunks 5 + 6**:

- (α) Session 54 Candidate (b) (Path B continuation + chunks 5 + 6 multi-chunk consolidation) ratified via `/superpowers:brainstorming` skill workflow at design doc commit `<NEW_SESSION_54_DESIGN_SHA>` (Session 54 design doc); chunks 5 + 6 multi-chunk consolidated brief composition fires per cycle-close §7.8 canonical same-framing-grouping framing inheritance. Banking observation: multi-chunk consolidation N=1 first-instance + sequential-brief-drafting-cycle-progresses-substrate-readiness sub-pattern N=2 → N=3 promotion-threshold-MET (Sessions 52 + 53 + 54 cumulative) + Path B disposition selection sub-pattern N=2 → N=3 promotion-threshold-MET (Sessions 52 + 53 + 54 cumulative).

- (β) Single-subagent-per-consolidated-brief dispatch per Session 54 design doc §5.3 Finding C sub-option (a) preliminary recommendation. Subagent-dispatch-shape-at-multi-chunk-consolidation-grade sub-pattern N=1 first-instance NEW at Session 54 grade. Briefing-grade anti-drift discipline fires once at composition START per Sessions 52 + 53 precedent inheritance + subagent-composition-grade anti-drift via explicit briefing N=2 → N=3 promotion-threshold-MET candidate at Session 54 grade.

- (γ) Skill-chain composition: `/superpowers:brainstorming` → `/superpowers:writing-plans` → `/superpowers:executing-plans` per Sessions 52 + 53 plan-doc + design-doc + brief-doc three-artifact composition shape sub-pattern N=2 → N=3 promotion-threshold-MET candidate at Session 54 grade (or four-artifact extension if correction commit fires per Session 53 inheritance).

(i) **§6 carry-forward observation banking surface inheritance** from Session 53 close (full enumeration at chunk 4 brief §6 + Session 53 close summary):

**Six N=3+ promotion-threshold-MET candidates firing at Session 54**:
- Sequential-brief-drafting-cycle-progresses-substrate-readiness N=3 promotion-threshold-MET (Sessions 52 + 53 + 54)
- Sub-chunk-impl-bound vs further-SPLIT distinction N=4 or N=5 cumulative (Phase 8 chunks 2 + 3 + 4 + 5 + 6 if both fire sub-chunk-impl-bound)
- Subagent-composition-grade anti-drift via explicit briefing N=3 promotion-threshold-MET candidate
- Subagent-dispatch sub-pattern at Phase 8 grade N=5 cumulative
- Plan-doc + design-doc + brief-doc three-artifact composition shape N=3 promotion-threshold-MET candidate
- Preemptive substrate path verification at session-onset N=7 cumulative

**Three NEW first-instance sub-patterns NEW at Session 54 grade**:
- Multi-chunk consolidation N=1 first-instance (per §7.8 canonical same-framing-grouping firing)
- Multi-chunk-consolidation-substrate-density-permits-check N=1 first-instance candidate (Phase A Step 14)
- Subagent-dispatch-shape-at-multi-chunk-consolidation-grade N=1 first-instance NEW at Session 54

**Additional banking surfaces**:
- Sub-curve calibration disambiguation at multi-chunk-consolidated-brief grade N=1 first-instance candidate (if LOC lands materially above sub-curve (a) band-center)
- Brainstorming-side disposition-grade-skip-past sub-pattern avoidance discipline N=2 confirming-fire MET (Session 52 first-instance + Session 54 explicit three-candidate framing)
- Discovery-after-commit substrate-stability discipline N=2 maintained from Session 53 inheritance
- Multi-chunk-consolidation-framing-substrate-grade-grain mismatch sub-pattern N=1 maintained from Session 53 inheritance
- Interleaved cycle posture N=2 PRESERVED ungraduated per Candidate (b) sequential continuation
- Coordination warning N=16 → N=17+ cumulative firing (Sessions 43-54)
- Substrate-evidence-propagation-gap N=4 maintained vs N=5 confirming-fire at Session 54 grade per substrate-evidence-propagation discipline outcome

(j) **Verification before reporting complete**: subagent must verify final brief LOC against forecast band + §-structure complete + substrate citation paths verified-correct via post-composition spot-check. Briefing-grade anti-drift means subagent ALSO verifies ADR paths + vitest config path + e2e test scaffolding path + component substrate paths via filesystem reads BEFORE citing in brief composition (preventive at composition-input surface).

- [ ] **Step 2: Dispatch via Agent tool.**

```
Agent({
  description: "Phase 8 chunks 5 + 6 multi-chunk consolidated brief composition",
  subagent_type: "general-purpose",
  prompt: <briefing from Step 1>
})
```

Wait for subagent completion notification + report.

- [ ] **Step 3: Verify subagent output structure.**

```bash
wc -l docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunks-5-6.md
grep -n "^## \|^### " docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunks-5-6.md | head -50
```

Expected:
- LOC in ~1200-1300 consolidated upper bound band (multi-chunk-consolidated-brief grade)
- §1-§6 structure with §2.1 + §2.2 + §2.3 + §4 Tasks extended to cover BOTH chunks 5 AND 6

Read first 50 lines of `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunks-5-6.md` to confirm header matter (Date, Phase, Chunks, Path C disposition, Status, Session shape, Predecessor, Baseline, Sub-curve grade) + §1 Preamble structure.

---

## Task 3: Post-composition ADR-path + substrate-path spot-check

**Files:**
- Modified (inline edits if drift surfaces): `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunks-5-6.md`

- [ ] **Step 1: Enumerate all ADR-path citations in composed brief.**

```bash
grep -n "07_governance/adr/" docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunks-5-6.md
```

- [ ] **Step 2: Verify each cited ADR filename against canonical directory.**

```bash
ls docs/07_governance/adr/ | head -25
```

Cross-reference Step 1 output against Step 2 output. Each ADR-NNNN-... in Step 1 must match exact filename in Step 2.

- [ ] **Step 3: Enumerate substrate path citations (vitest config + e2e + components + unit test substrate).**

```bash
grep -n "vitest.config\|tests/unit\|tests/integration/e2e\|components/document-platform\|DocumentCard\|ProposedAttachmentCard\|PendingDocumentsView" docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunks-5-6.md | head -30
```

Cross-reference against Phase A grade Steps 12 + 13 verified paths. Each substrate path citation in the brief must match canonical path verified at Phase A grade.

- [ ] **Step 4: If briefing-grade anti-drift held clean, expect ZERO drift firings.**

Per Sessions 52 + 53 precedent: briefing-grade anti-drift discipline at composition START preempted post-composition correction. If briefing-grade prevention holds at Session 54 grade, subagent-composition-grade anti-drift via explicit briefing N=2 → N=3 confirming-fire (promotion threshold N=3 MET candidate).

If ANY path drift surfaces, fire inline-edit correction. Also correct any associated label drift. Add §6.x banking entry for subagent-composition-grade path-citation drift if drift fires (briefing-grade prevention discipline failed).

- [ ] **Step 5: Verify final LOC band post-corrections.**

```bash
wc -l docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunks-5-6.md
```

Expected: ~1200-1300 consolidated upper bound (within multi-chunk-consolidated-brief forecast band). LOC observation determines sub-curve calibration disambiguation at multi-chunk-consolidated-brief grade N=1 first-instance firing.

---

## Task 4: Commit chunks 5 + 6 multi-chunk consolidated brief

**Files:**
- Stage: `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunks-5-6.md`

- [ ] **Step 1: Stage the consolidated brief file.**

```bash
git add docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunks-5-6.md
```

- [ ] **Step 2: Commit with comprehensive message.**

Commit message template (refine at Session-54-execution-grade per per-task evidence):

```
docs(phase-8): chunks 5 + 6 multi-chunk consolidated brief — framing #6 UI test infrastructure (vitest jsdom + @testing-library/react + per-component test fixtures three-component scope + e2e assertion body authoring 3 blocks per Sub-Q6) — multi-chunk consolidation N=1 first-instance per cycle-close §7.8 canonical same-framing-grouping framing

Substrate ships:

docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunks-5-6.md (~1200-1300
LOC consolidated upper bound at multi-chunk-consolidated-brief grade per
cycle-close §7.3 forecast inheritance):
[detail per chunks 5 + 6 brief §-structure]

§1.2 Divergence absorption:
(α) Session 54 Candidate (b) (Path B continuation + chunks 5 + 6 multi-
chunk consolidation per §7.8 canonical) ratified per design doc
<NEW_SESSION_54_DESIGN_SHA>; chunks 5 + 6 multi-chunk consolidated brief
composition fires per cycle-close §7.8 canonical same-framing-grouping
framing inheritance.
(β) Single-subagent-per-consolidated-brief dispatch per Session 54
design doc §5.3 Finding C sub-option (a) preliminary recommendation.
Subagent-dispatch-shape-at-multi-chunk-consolidation-grade sub-pattern
N=1 first-instance NEW.
(γ) Skill-chain composition Path 2 fired:
/superpowers:brainstorming → /superpowers:writing-plans →
subagent-driven-development execution. Plan-doc + design-doc + brief-doc
three-artifact composition shape sub-pattern N=2 → N=3 promotion-
threshold-MET candidate.

Banking surfaces materialized at Session 54 close grade:
[full enumeration per chunks 5 + 6 brief §6.1-§6.x]

Six N=3+ promotion-threshold-MET candidates firing simultaneously +
Three NEW first-instance sub-patterns (multi-chunk consolidation +
substrate-density-permits-check + subagent-dispatch-shape-at-multi-
chunk-consolidation-grade)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

- [ ] **Step 3: Verify post-commit state.**

```bash
git log --oneline origin/staging..HEAD | head -5
```

Expected: 20 commits ahead of origin/staging (was 17 at Session 53 close + 3 new at Session 54: design doc + plan + chunks 5+6 consolidated brief). Adjust expected count to actual.

---

## Task 5: Update memory + Session 54 close summary

**Files:**
- Create: `~/.claude/projects/-home-philc-projects-chounting/memory/project_phase_8_chunks_5_6_brief_shipped.md` (multi-chunk artifact naming convention; verify against Sessions 51 + 52 + 53 single-chunk brief memory file naming precedent)
- Modify: `~/.claude/projects/-home-philc-projects-chounting/memory/MEMORY.md` (add index entry)

- [ ] **Step 1: Write Phase 8 chunks 5 + 6 brief shipped topic memory file.**

Template per Session 53 chunk 4 brief shipped memory file precedent. Capture:
- Commit SHA + LOC + §-structure
- Multi-chunk consolidation substantive scope (three-axis per chunk × 2 chunks = 6 substantive axes)
- Banking surfaces materialized at Session 54 close (full enumeration; ~12-15+ banking surfaces with 6 N=3+ promotion-threshold-MET candidates + 3 NEW first-instance sub-patterns)
- Validation gate state (pnpm agent:validate 26/26 green; working tree clean post-commits)
- Next operational fire (Session 55 disposition: chunk 7 brief at framing #2 post-v1 reconciliation orchestrator OR chunks 2-6 impl bundle per founder operational adjudication)
- Phase 8 implementation cycle status (1 of 10 chunk-impl sessions substrate-complete; 6 of 10 chunk briefs shipped [chunks 1-4 single + chunks 5-6 consolidated])

- [ ] **Step 2: Update MEMORY.md index entry.**

Insert tight one-line entry after `project_phase_8_chunk_4_brief_shipped.md` entry. Format per project convention.

- [ ] **Step 3: Compose Session 54 close summary in conversation.**

Mirror Session 53 close summary shape. Cover:
- Three-commit Session 54 close shape (Session 54 design doc + Session 54 plan + chunks 5 + 6 consolidated brief) per Session 52 precedent inheritance — OR four-commit Session 54 close shape if substrate-density-permits-check fires SPLIT-back-to-Candidate-(a) recovery commit OR ADR-path-drift correction commit fires separately
- Per-task acceptance criteria walk-through
- Validation gate state
- Push posture (20 commits ahead of origin/staging post-Session-54; no push at chunk-brief-drafting grade per Candidate #13)
- Banking surfaces materialized (with 6 N=3+ promotion-threshold-MET candidates + 3 NEW first-instance sub-patterns firing simultaneously)
- Next operational fire (Session 55 disposition)

---

## Self-Review Checklist

After Tasks 1-5 land:

- [ ] **Spec coverage:** All sections of Session 54 design doc §5 operational consequences covered by tasks (§5.1 substantive surface chunk 5 + chunk 6 three-axis × 2 = 6 axes + §5.2 substrate-density-permits check at Phase A grade + §5.3 single-subagent dispatch shape + §5.4 forecast band + §5.5 envelope timing preservation)?
- [ ] **Placeholder scan:** No TBD/TODO/incomplete-section in chunks 5 + 6 consolidated brief at composition close.
- [ ] **Type consistency:** All `linked_entity_type` / `document_state` / `pipeline_trace` references match ADR-0011 + ADR-0014 substrate inheritance; all component name references match canonical filenames verified at Phase A grade Step 13.
- [ ] **Path-citation drift:** All ADR-path + vitest config path + e2e test scaffolding path + component substrate path citations verified against Phase A grade verified paths (preemptive per Sessions 51 + 53 N=1 + N=1 first-instance + briefing-grade prevention N=2 confirming-fire inheritance).

---

## Operational Notes

**Single-subagent-per-consolidated-brief dispatch shape**: Task 2 is the heaviest task at substrate-composition grade. Single-subagent dispatch with comprehensive briefing inheriting chunk 4 brief composition precedent + briefing-grade anti-drift discipline at composition START per Sessions 52 + 53 N=2 promotion-threshold-MET inheritance. WSL-side post-composition spot-check at Task 3 grade serves as preemptive backstop if briefing-grade prevention misses. Single-subagent shape preserves coherence boundary at consolidated artifact grade per Session 54 design doc §5.3 Finding C sub-option (a) preliminary recommendation.

**Anti-drift discipline at every step**: substrate citations verified at Task 1 Phase A grade BEFORE Task 2 dispatch. ADR-path + substrate-path verification at Task 3 grade AFTER Task 2 composition. Preemptive substrate path verification at session-onset N=7 confirming-fire candidate if Phase A holds clean (Session 54 strengthens cumulative banking past N=3 promotion threshold substantially).

**Substrate-density-permits check at Phase A grade**: NEW discipline at multi-chunk consolidation grade per Session 54 design doc §5.2 + Finding B. If substrate-density evidence at Phase A grade surfaces material divergence from cycle-close §7.3 forecast bands, HALT-and-surface gate fires for founder operational adjudication with SPLIT-back-to-Candidate-(a) recovery path. Banking observation: **multi-chunk-consolidation-substrate-density-permits-check sub-pattern N=1 first-instance** materializes at Phase A grade if check fires.

**F-J-14 Grain 3 mid-impl reactive readiness**: NOT EXPECTED at brief-drafting cycle grade. Grain 3 operates at chunk-impl grade per Phase 7 chunk 7.3b first-fire + Session 50 chunk 1 second-fire precedent. Session 54 fires brief-drafting cycle; Grain 3 carries forward to chunks 2-6 impl future sessions at Sessions 59+ grade.

**Push posture**: No push at chunk-brief-drafting grade per Candidate #13 push-terminal-close discipline (N=5 fires at Phase 8 retrospective close ~Session 72). Banks locally on staging branch at 20 commits ahead of origin/staging post-Session-54 close (was 17 at Session 53 close).

**Coordination warning posture**: Coordination warning N=16 → N=17+ firing candidate at Task 4 commit grade (Sessions 43-54 cumulative if warning fires). Codification candidate substantially past N=3 promotion threshold; routing target Phase 8 retrospective Commit B grade with HIGH priority.

**Multi-chunk consolidation N=1 first-instance + sibling sub-patterns**: Three NEW first-instance sub-pattern candidates materialize at Session 54 grade if Candidate (b) ratifies. Promotion thresholds pending at future multi-chunk consolidation firings at Phase 9+ grade.

**Sub-curve calibration disambiguation observation potential**: If LOC lands materially above sub-curve (a) band-center (~590-640 single-chunk grade), sub-curve calibration disambiguation at multi-chunk-consolidated-brief grade N=1 first-instance materializes. Substantively novel sub-curve observation expanding chunk-brief-drafting sub-curve catalog at multi-chunk grade.
