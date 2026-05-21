# Session 52 Phase 8 Chunk 3 Brief-Drafting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compose Phase 8 chunk 3 brief at substantively-new-phase chunk-brief grade per cycle-close §5.1 framing #4 sub-chunk b (score composition expansion + candidate_features Zod schema extension at documentRouterService.completeCandidate Subsystem 1 surface).

**Architecture:** Single docs-only artifact at `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-3.md`. §1-§6 structure inheriting chunk 2 brief template (which inherited chunk 1 brief template). Subagent-dispatched composition per Session 50 + Session 51 subagent-dispatch sub-pattern N=2 cumulative + WSL-side post-composition spot-check for ADR-path drift per Session 51 N=1 first-instance inheritance. ~590-640 LOC band-center forecast at substantively-new-phase chunk-brief grade.

**Tech Stack:** Markdown docs authoring. No code changes. Vitest config + ADR substrate + documentRouterService.ts read-only at Phase A grade.

---

## File Structure

**Files to create:**
- `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-3.md` (~590-640 LOC; substantively-new-phase chunk-brief grade)

**Files to read (Phase A substrate verification):**
- `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-2.md` (chunk 2 brief; §-structure template inheritance)
- `docs/09_briefs/phase-8/2026-05-21-phase-8-scope-lock-cycle-close.md` (§5.1 framing-pairing + §6.1 substrate dependencies + §7.2 chunks 2-4 brief-drafting framing)
- `docs/07_governance/adr/0018-relationship-router.md` (§2 lines 450-475 confidence scoring composition)
- `docs/07_governance/adr/0019-confidence-calibration-policy.md` (§5 calibration surfaces line 498 + §6 calibration cycle authority line 567 + §9 fifteen ratified-at-v1-ship parameters line 788)
- `docs/07_governance/adr/0016-document-relationship-graph.md` (§3 pair-validity matrix)
- `apps/web/src/services/document-platform/documentRouterService.ts` (existing scoring patterns + Subsystem 1 surface inheritance)

**Files to grep (Phase A discovery):**
- `apps/web/src/shared/schemas/document-platform/` (candidate_features schema location verification)
- `apps/web/tests/integration/` (documentRouter test naming convention precedent)

**Files NOT created:** Chunk 3 implementation substrate. Per Path B disposition: chunk 3 impl deferred to future session per Sub-Q14 N=3 SPLIT inheritance + cycle-close §9.5 sequential framing.

---

## Task 1: Phase A — Pre-composition verify-from-disk

**Files:**
- Read-only verification across substrate paths above

- [ ] **Step 1: Verify commits-ahead unchanged at Session 52 onset.**

```bash
git log --oneline origin/staging..HEAD | wc -l
```
Expected: `11` (was 11 at Session 51 + design doc commit 803c4b1).

- [ ] **Step 2: Verify pnpm agent:validate 26/26 baseline preserved.**

```bash
pnpm agent:validate 2>&1 | tail -5
```
Expected: `Tests 26 passed (26)` in output.

- [ ] **Step 3: Verify working tree clean post-Session-51 close + design doc commit.**

```bash
git status --short
```
Expected: only pre-existing untracked Phase 6/6.5 carry-forwards (5 items); NO modified tracked files.

- [ ] **Step 4: Read chunk 2 brief in full as §-structure template inheritance source.**

Read `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-2.md`. Verify §1-§6 structure + §2.3 inter-chunk dependency map subsection + §6.1-§6.10 banking surface enumeration shape.

- [ ] **Step 5: Read cycle-close §7.2 chunks 2-4 brief-drafting framing for chunk 3 substrate-load expectation.**

Read `docs/09_briefs/phase-8/2026-05-21-phase-8-scope-lock-cycle-close.md` offset 367 limit 30 (lines 367-396; §7.2 + §7.3). Verify chunk 3 = framing #4 sub-chunk b score composition expansion (per-feature scoring extensions + candidate_features Zod expansion).

- [ ] **Step 6: Read ADR-0018 §2 confidence scoring composition lines 450-475.**

Read `docs/07_governance/adr/0018-relationship-router.md` offset 450 limit 30. Verify per-feature contribution surfaces + deterministic TS module composition + ADR-0019 forward-pointer for ongoing calibration governance.

- [ ] **Step 7: Read ADR-0019 §5-§9 calibration surfaces + governance + parameters.**

Read `docs/07_governance/adr/0019-confidence-calibration-policy.md` offset 498 limit 290 (lines 498-788 covering §5 + §6 + §7 + §8 + §9). Verify five calibration surfaces + two-layer authority split + fifteen ratified-at-v1-ship parameters.

- [ ] **Step 8: Read ADR-0016 §3 pair-validity matrix.**

Read `docs/07_governance/adr/0016-document-relationship-graph.md` §3 (locate via TOC grep first if needed). Verify 15 active-v1 cells + reserved post-v1 cells + invalid cells per Sub-Q55 sub-item (c) closure.

- [ ] **Step 9: Grep documentRouterService.ts for existing scoring patterns.**

```bash
grep -n "confidence_score\|scoring\|score_\|computeScore" apps/web/src/services/document-platform/documentRouterService.ts | head -20
```
Identify existing scoring helper functions or score composition shape at Phase 4 chunk 3 ship grade. Empty output is informational (chunk 3 introduces scoring as substantive new surface).

- [ ] **Step 10: Verify candidate_features schema location.**

```bash
ls apps/web/src/shared/schemas/ 2>&1 || ls apps/web/src/services/document-platform/ | grep -i candidate
find apps/web/src -name "candidate_features*" -o -name "*candidate-features*" 2>/dev/null | head -5
```
Identify candidate_features.schema.ts canonical location. If non-existent, chunk 3 substrate creates it; if existing, chunk 3 extends it.

- [ ] **Step 11: HALT-and-surface gate.**

If any of Steps 1-10 surfaces material divergence (handoff-vs-substrate path drift, working tree dirty, ADR path miscitation, baseline regression), HALT and surface to founder before Task 2 dispatch fires. Per Session 51 Phase A halt-and-surface precedent (γ' resolution sequence) + preemptive substrate path verification at session-onset N=5 confirming-fire candidate.

---

## Task 2: Dispatch subagent for chunk 3 brief composition

**Files:**
- Will create: `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-3.md`

- [ ] **Step 1: Compose comprehensive subagent briefing.**

The briefing must include:

(a) **§-structure template inheritance**: explicit reference to chunk 2 brief at `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-2.md` as canonical template. Match §1-§6 structure + §2.3 inter-chunk dependency map + §6.1-§6.10 banking surface enumeration.

(b) **Substantive scope (extracted from cycle-close §5.1 + §7.2)**: chunk 3 = framing #4 sub-chunk b score composition expansion. Two named axes:
- Per-feature scoring composition formula at `documentRouterService.completeCandidate` (Subsystem 1) — deterministic TypeScript module computing `confidence_score ∈ [0, 1]` from feature vector per ADR-0018 §2 lines 450-475. Per-feature weights + composition formula are implementation-owned at v1 per ADR-0018 §2 line 465-470 (provisional-pending-v1-ship pattern; ADR-0019 owns calibration governance).
- `candidate_features` Zod schema extension at `apps/web/src/shared/schemas/document-platform/candidate_features.schema.ts` (or analogous; verify location at Task 1 Step 10 grade). Schema captures per-feature contribution structure that documentRouterService writes into `candidate_features` JSONB column so reviewer/auditor can reconstruct why a particular score landed (per ADR-0018 §2 lines 472-475).

(c) **What chunk 3 does NOT ship** (deferred per Sub-Q14 N=3 SPLIT lock):
- Chunk 2 (framing #4 sub-chunk a) per-document-type pseudocode extensions + linked_entity_type expansion — already shipped at chunk 2 brief commit 5dc042a; chunk 3 inherits chunk 2 scope as preceding-sub-chunk substrate.
- Chunk 4 (framing #4 sub-chunk c) integration + audit trail + downstream consumer wiring — deferred to chunk 4 brief-drafting future session.

(d) **Verified-correct substrate citations** (preemptive against Session 51 subagent-composition-grade ADR-path drift sub-pattern N=1 inheritance):
- ADR-0018: `docs/07_governance/adr/0018-relationship-router.md` (NOT `0018-document-platform-services-and-state.md` or similar drift)
- ADR-0019: `docs/07_governance/adr/0019-confidence-calibration-policy.md` (NOT `0019-document-router-resolution-confidence.md`)
- ADR-0016: `docs/07_governance/adr/0016-document-relationship-graph.md`
- ADR-0015: `docs/07_governance/adr/0015-ap-spend-subdomain.md`
- ADR-0011: `docs/07_governance/adr/0011-document-platform.md`

(e) **Path C invocation evaluation at brief-grade**: Sub-Q14 N=3 SPLIT lock at scope-lock cycle Round 3 PRE-DECOMPOSED framing #4 into 3 sub-chunks (chunks 2-4). Chunk 3 brief composition fires F-J-14 Grain 1 prospective evaluation at sub-chunk-impl-bound vs further-SPLIT grade. **NO-SPLIT outcome forecast** at brief-grade. F-J-14 Grain 1 sixth-instance NO-SPLIT outcome banking (Phase 4 chunk 3 reactive first + Phase 6 chunk 6.2a prospective second + Phase 7 chunk 7.1 prospective third SPLIT + Phase 8 chunk 1 prospective fourth NO-SPLIT + Phase 8 chunk 2 prospective fifth NO-SPLIT + Phase 8 chunk 3 prospective sixth NO-SPLIT).

(f) **Forecast band**: ~590-640 LOC at substantively-new-phase chunk-brief grade per chunk 2 brief 592 LOC precedent + Phase 5.1 chunk 5.1a 605 + Phase 6.5 chunk 1 623 + Phase 7 chunk 7.1 592 + Phase 4 chunk 3 792 anchor inheritance.

(g) **§1.2 session-onset divergence absorption for chunk 3**:
- (α) Session 52 Path B disposition adjudication ratified via `/superpowers:brainstorming` skill workflow at design doc commit 803c4b1; chunk 3 brief composition fires per Path B sequential brief-drafting framing (NOT Path A interleaved continuation per Session 50 + 51 precedent). Banking observation: §9.5-as-hypothesis-worth-testing reframing N=1 first-instance + Path B disposition selection sub-pattern N=1 first-instance + sequential-brief-drafting-cycle-progresses-substrate-readiness sub-pattern N=1 first-instance candidate.
- (β) Skill-chain composition Path 2 fired per brainstorming-side recommendation: `/superpowers:brainstorming` → `/superpowers:writing-plans` → execution. Banking observation: brainstorming-skill-invocation-at-disposition-grade sub-pattern N=1 first-instance.

(h) **§6 carry-forward observation banking surface inheritance** from Session 51 close (full enumeration at chunk 2 brief §6 + chunk 2 brief shipped memory file):
- Substrate-evidence-propagation-gap between verify-from-disk and composition N=3 cumulative confirming-fire (Phase 8 retro Commit B graduation candidate substantively past N=2 promotion threshold).
- Preemptive substrate path verification at session-onset N=4 cumulative (Session 52 fires N=5 if Phase A holds clean).
- Directive-grade self-correction anti-drift N=7 cumulative confirming-fire (Session 52 directive ratification at design grade fired N=7 firing per Session 51 close framing).
- Interleaved cycle posture N=2 promotion-threshold-met PRESERVED ungraduated per Path B disposition.
- F-J-14 Grain 1 prospective fifth-instance NO-SPLIT (chunk 2) + sixth-instance NO-SPLIT forecast (chunk 3).
- Coordination warning N=11 cumulative (Sessions 43-52 if Session 52 fires coordination warning at commit grade).

(i) **Verification before reporting complete**: subagent must verify final brief LOC against forecast band + §-structure complete + substrate citation paths verified-correct via post-composition spot-check (mirror chunk 2 brief precedent).

- [ ] **Step 2: Dispatch via Agent tool.**

```
Agent({
  description: "Phase 8 chunk 3 brief composition",
  subagent_type: "general-purpose",
  prompt: <briefing from Step 1>
})
```

Wait for subagent completion notification + report.

- [ ] **Step 3: Verify subagent output structure.**

Read first 50 lines of `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-3.md`. Confirm:
- Header matter (Date, Phase, Chunk, Path C disposition, Status, Session shape, Predecessor, Baseline, Sub-curve grade)
- §1 Preamble § structure (§1.1 brief context + §1.2 divergence absorption + §1.3 Path C invocation evaluation + §1.4 cross-references)

```bash
wc -l docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-3.md
grep -n "^## \|^### " docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-3.md | head -40
```

Expected: LOC in 590-640 band; §1-§6 + §1.1-§1.4 + §6.x sub-section structure consistent with chunk 2 brief template.

---

## Task 3: Post-composition ADR-path spot-check

**Files:**
- Modified (inline edits if drift surfaces): `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-3.md`

- [ ] **Step 1: Enumerate all ADR-path citations in composed brief.**

```bash
grep -n "07_governance/adr/" docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-3.md
```

- [ ] **Step 2: Verify each cited ADR filename against canonical directory.**

```bash
ls docs/07_governance/adr/ | head -25
```

Cross-reference Step 1 output against Step 2 output. Each ADR-NNNN-... in Step 1 must match exact filename in Step 2.

- [ ] **Step 3: If ANY ADR-path drift surfaces, fire inline-edit correction.**

For each drift, edit the brief to replace wrong path with correct path. Also correct any associated label drift (e.g., "ADR-0011 (Document case state machine)" → "ADR-0011 (Document Platform)"). Add §6.1 banking entry for subagent-composition-grade ADR-path-citation drift N=2 confirming-fire if drift fires.

- [ ] **Step 4: Verify final LOC band post-corrections.**

```bash
wc -l docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-3.md
```

Expected: 590-640 (within forecast band).

---

## Task 4: Commit chunk 3 brief

**Files:**
- Stage: `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-3.md`

- [ ] **Step 1: Stage the chunk 3 brief file.**

```bash
git add docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-3.md
```

- [ ] **Step 2: Commit with comprehensive message.**

Commit message template (refine at chunk-3-execution-grade per per-task evidence):

```
docs(phase-8): chunk 3 brief — framing #4 sub-chunk b ledger extensions: score composition expansion (per-feature scoring composition formula + candidate_features Zod schema extension at documentRouterService.completeCandidate Subsystem 1 surface)

Substrate ships:

docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-3.md (~590-640
LOC at substantively-new-phase chunk-brief grade per Phase 5.1+6.5+7
+ Phase 4 chunk 3 + chunk 2 brief precedent inheritance):
[detail per chunk 3 brief §-structure]

§1.2 Divergence absorption:
(α) Session 52 Path B disposition ratified per design doc 803c4b1;
chunk 3 brief composition fires per Path B sequential framing
(NOT Path A interleaved continuation per Session 50+51 precedent).
(β) Skill-chain composition Path 2 fired per brainstorming-side
recommendation: /superpowers:brainstorming → /superpowers:writing-plans
→ subagent-driven-development execution.

Banking surfaces materialized at Session 52 close grade:
[full enumeration per chunk 3 brief §6.1-§6.x]

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

- [ ] **Step 3: Verify post-commit state.**

```bash
git log --oneline origin/staging..HEAD | head -5
```

Expected: 12 commits ahead of origin/staging; new commit at HEAD with `docs(phase-8): chunk 3 brief —` prefix.

---

## Task 5: Update memory + Session 52 close summary

**Files:**
- Create: `~/.claude/projects/-home-philc-projects-chounting/memory/project_phase_8_chunk_3_brief_shipped.md`
- Modify: `~/.claude/projects/-home-philc-projects-chounting/memory/MEMORY.md` (add index entry)

- [ ] **Step 1: Write Phase 8 chunk 3 brief shipped topic memory file.**

Template per Session 51 chunk 2 brief shipped memory file precedent. Capture:
- Commit SHA + LOC + §-structure
- Substantive scope (per-feature scoring composition + candidate_features Zod extension)
- Banking surfaces materialized at Session 52 close (full enumeration; ~10-15+ banking surfaces)
- Validation gate state
- Next operational fire (Session 53 chunk 4 brief-drafting per Path B sequential continuation OR alternative founder operational adjudication)
- Phase 8 implementation cycle status (1 of 10 chunk-impl sessions substrate-complete; 3 of 10 chunk briefs shipped)

- [ ] **Step 2: Update MEMORY.md index entry.**

Insert tight one-line entry after `project_phase_8_chunk_2_brief_shipped.md` entry. Format per project convention (substantive but bounded).

- [ ] **Step 3: Compose Session 52 close summary in conversation.**

Mirror Session 51 close summary shape (Session 50 + Session 51 precedent). Cover:
- Two-commit Session 52 close shape (design doc 803c4b1 + chunk 3 brief commit) — OR three-commit Session 52 close shape if ADR-path-drift correction commit fired separately
- Per-task acceptance criteria walk-through
- Validation gate state
- Push posture (12 commits ahead of origin/staging; no push at chunk-brief-drafting grade per Candidate #13)
- Banking surfaces materialized
- Next operational fire (Session 53 disposition)

---

## Self-Review Checklist

After Tasks 1-5 land:

- [ ] **Spec coverage:** All sections of design doc 803c4b1 §5 operational consequences covered by tasks (§5.1 substantive surface shift + §5.2 partial-information value picks deferral + §5.3 envelope timing preservation + §5.4 sequential-brief-drafting-cycle-progresses-substrate-readiness)?
- [ ] **Placeholder scan:** No TBD/TODO/incomplete-section in chunk 3 brief at composition close.
- [ ] **Type consistency:** All `linked_entity_type` references use 6-value v1-active subset per ADR-0016 §1 Phase 2.5 amendment; all confidence_score references match ADR-0018 §2 lines 450-475 framing.
- [ ] **Path-citation drift:** All ADR-path citations verified against `ls docs/07_governance/adr/` (preemptive per Session 51 N=1 first-instance inheritance).

---

## Operational Notes

**Subagent-dispatch execution shape**: Task 2 is the heaviest task at substrate-composition grade. Subagent dispatch with comprehensive briefing inheriting chunk 2 brief composition precedent. WSL-side post-composition spot-check at Task 3 grade preemptively catches subagent-composition-grade ADR-path drift sub-pattern.

**Anti-drift discipline at every step**: substrate citations verified at Task 1 Phase A grade BEFORE Task 2 dispatch. ADR-path verification at Task 3 grade AFTER Task 2 composition. Preemptive substrate path verification at session-onset N=5 confirming-fire if Phase A holds clean (Session 52 strengthens cumulative banking past N=3 promotion threshold substantially).

**F-J-14 Grain 3 mid-impl reactive readiness**: NOT EXPECTED at brief-drafting cycle grade. Grain 3 operates at chunk-impl grade per Phase 7 chunk 7.3b first-fire + Session 50 chunk 1 second-fire precedent. Session 52 fires brief-drafting cycle; Grain 3 carries forward to chunk 2/3/4 impl future sessions.

**Push posture**: No push at chunk-brief-drafting grade per Candidate #13 push-terminal-close discipline (N=5 fires at Phase 8 retrospective close ~Session 72). Banks locally on staging branch at 12 commits ahead of origin/staging post-Session-52 close (was 11 at design doc 803c4b1).

**Coordination warning posture**: Coordination warning N=11 → N=12 firing candidate at Task 4 commit grade (Sessions 43-52 cumulative if warning fires). Codification candidate substantially past N=3 promotion threshold; routing target Phase 8 retrospective Commit B grade.
