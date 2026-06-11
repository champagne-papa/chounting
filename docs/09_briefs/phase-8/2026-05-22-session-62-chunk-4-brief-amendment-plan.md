# Session 62 Phase 8 Chunk 4 Brief Amendment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Inline-execution canonical per skill-mandate-recommendation-inversion sub-pattern N=6 cumulative (docs-authoring-plan grade overrides Subagent-Driven Development default per Sessions 59 + 60 N=2 amendment cycle precedent).

**Goal:** Amend Phase 8 chunk 4 brief inline at `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md` to absorb F-3 scope (a) vendor_invoice Scenario A inferred-target + F-3 scope (b) receipt Scenario A variant `(payment, receipt)` null `linked_entity_id` substrate change scope per chunk 2 brief Session 60 second amendment (`83bc5ac`) §B.3 + §2.4 + §6.12 canonical anchor inheritance + Session 62 disposition design (`docs/09_briefs/phase-8/2026-05-22-session-62-disposition-design.md`) §4.1 amendment composition surface specification.

**Architecture:** Single docs-only artifact amendment at `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md` via inline Edits. Explicit-correction commit at HEAD per Session 54 `0e50cfb` + Session 59 `328c322` + Session 60 `83bc5ac` precedent inheritance (preserves original chunk 4 brief commit `a2c20fa` immutable in git history). Discovery-after-commit substrate-stability discipline N=4 → N=5 promotion-threshold-MET fire materialized at Phase C Commit 3 grade.

**Tech Stack:** Markdown docs authoring. No code changes. Chunk 2 brief §2.4 substrate read-only at Phase A grade; chunk 4 brief inline Edits at Phase B grade.

---

## File Structure

**Files to amend (inline Edits):**
- `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md` (~200-400 LOC delta amendment scope; original 620 LOC at substantively-new-phase chunk-brief sub-curve (a) grade per Session 53 ship)

**Files to read (Phase A re-verify):**
- `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-2.md` §2.4 + §B.3 + §6.12 (F-3 deferral framing canonical anchor inheritance)
- `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md` (chunk 4 brief full-read at amendment composition baseline grade)
- `docs/09_briefs/phase-8/2026-05-22-session-62-disposition-design.md` §4.1 (amendment composition surface specification)
- `docs/07_governance/adr/0015-ap-spend-subdomain.md` §7 (Scenario A/B/C attach taxonomy substrate)
- `apps/web/src/shared/schemas/document-platform/documentRelationshipCandidate.schema.ts` (current `linked_entity_id: z.string().uuid()` NON-nullable state)

**Files NOT amended:** Chunk 4 implementation substrate. Per Candidate (β) ratification: chunk 4 impl deferred to Session 63+ per Path B sequential continuation under post-amendment chunk 4 brief substrate-readiness grade.

---

## Task 1: Phase A re-verify — substrate state at session-onset

**Files:**
- Read-only verification across substrate paths above (re-verify Phase A Step 2 EXPANDED CONDITIONAL substrate verification firings from Session 62 Phase A Step 1 + Step 2)

- [x] **Step 1: Verify commits-ahead at 39 + working tree state at Session 62 onset.**

```bash
git log --oneline origin/staging..HEAD | wc -l
git status --short
```

Expected: `39` (Session 61 close + chunk 3 impl `4618806`); working tree clean modulo 5 pre-existing untracked carry-forwards. CONFIRMED at Phase A Step 1 grade.

- [x] **Step 2: Verify pnpm agent:validate inheritance from Session 61 close (no re-fire required at brief amendment cycle grade — docs-only changes).**

Expected: 26/26 green inherited from Session 61 `4618806` chunk 3 impl close. No re-fire fires this session per docs-only amendment cycle scope.

- [x] **Step 3: Verify chunk 4 brief LOC at 620 + chunk 2 brief LOC at 664 (post-Session-60 second amendment) at canonical state.**

```bash
wc -l docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-2.md
```

Expected: `620 chunk 4 + 664 chunk 2`. CONFIRMED at Phase A Step 2 grade.

- [x] **Step 4: Read chunk 2 brief §2.4 + §B.3 + §6.12 F-3 deferral framing canonical anchor inheritance.**

Read `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-2.md` §2.4 (lines 194-217) + Session 60 second amendment §B.3 framing extension at §2.1 receipt subsection (lines 119+) + §6.12 (or §6.11 per chunk 2 brief amended structure) amendment-cycle carry-forward observations.

Verify SIX substrate change requirements enumeration at §2.4 lines 204-213:

1. Migration: alter `document_relationship_candidates.linked_entity_id` to NULL-able at Layer 1
2. Zod schema: `DocumentRelationshipCandidateSchema.linked_entity_id` → `.nullable()` at Layer 2
3. `NewCandidatePayload.linked_entity_id: string | null` at internal type
4. `VALID_PAIRS` refine adjustment at pair-validity matrix
5. RPC `create_candidates_with_audit` parameter shape update + types regeneration
6. Downstream consumer audit at Subsystem 2 + Subsystem 3 + `LINKED_ENTITY_TABLE_MAP`

- [x] **Step 5: Read chunk 4 brief in full (both pages: offset 1 + offset 258) as amendment composition baseline grade.**

Read `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md` in full (620 LOC; spans two reads at 257 LOC + 363 LOC). Confirm §1 preamble + §2 scope (§2.1 three-axis decomposition + §2.2 what NOT ships + §2.3 inter-chunk dependency map + §2.4 absent) + §3 substrate touchpoints (§3.1 files modified + §3.2 files created + §3.3 files NOT modified + §3.4 service layer scope) + §4 tasks (Task 1 pipeline_trace + Task 2 downstream consumer wiring + Task 3 integration tests + Task 4 close gate) + §5 Path C invocation outcome + §6 carry-forward observations.

Identify amendment target sections per Session 62 disposition design §4.1 (a)-(h) specification.

- [x] **Step 6: Read Session 62 disposition design §4.1 amendment composition surface specification.**

Read `docs/09_briefs/phase-8/2026-05-22-session-62-disposition-design.md` §4.1 (a)-(h) eight-amendment substrate specification + §4.2 inline-execution vs subagent dispatch adjudication.

- [x] **Step 7: Re-verify ADR-0015 §7 Scenario A anchors + linked_entity_id citations across ADR-0011 + ADR-0016 + ADR-0018.**

Verified at Phase A Step 2 EXPANDED CONDITIONAL substrate verification grade per Session 62 directive steps 8-14 specification. CLEAN.

**Acceptance criteria for Task 1:**
- All 7 substrate-readiness checks fire CLEAN.
- No substrate-evidence-propagation-gap firings at Phase A re-verify grade.
- Amendment target sections identified per Session 62 disposition design §4.1 specification.

---

## Task 2: Amendment composition — inline Edits at chunk 4 brief

**Files:**
- `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md` (inline Edits per §4.1 (a)-(h) specification)

**Composition mode:** **Inline-execution at chunk 4 brief amendment composition grade** per Session 62 disposition design §4.2 brainstorming-side preliminary recommendation inheritance per Sessions 59 + 60 N=2 cumulative inline-execution precedent inheritance grade.

**Amendment composition sub-tasks (per Session 62 disposition design §4.1 (a)-(h) specification):**

- [ ] **Step 2.1 — §1.1 substantive surface scope EXTENSION.** Update chunk 4 brief §1.1 Brief context paragraph to extend three-axis decomposition → four-axis decomposition. Add axis 4 F-3 substrate change scope (a) + (b) absorption framing per chunk 2 brief Session 60 second amendment scope extension inheritance.

- [ ] **Step 2.2 — §2.1 What chunk 4 ships — add §2.1 axis 4 subsection.** Insert axis 4 F-3 substrate change scope absorption subsection at §2.1 after axis 3 downstream consumer wiring subsection. Enumerate:
  - F-3 scope (a) vendor_invoice Scenario A inferred-target (null `linked_entity_id` for `invoice-arrives-no-bill-yet` per ADR-0015 §7)
  - F-3 scope (b) receipt Scenario A variant `(payment, receipt)` receipt-as-primary (null `linked_entity_id` per ADR-0015 §7 variant disambiguation)
  - 6-item substrate change enumeration per chunk 2 brief §2.4 inheritance (apply to BOTH scopes)
  - Substantive surface anchor at `documentRouterService.completeCandidate` per-document-type branches (vendor_invoice + receipt) for inferred-target emission paths

- [ ] **Step 2.3 — §2.2 What chunk 4 does NOT ship — UPDATE F-3 scope deferral language.** Original chunk 4 brief §2.2 (Session 53 grade pre-Session-59-amendment) does NOT mention F-3 scope deferral; UPDATE §2.2 to clarify F-3 scope is absorbed at chunk 4 grade (axis 4) rather than deferred to follow-on chunk. Cross-reference Session 60 second amendment scope extension framing.

- [ ] **Step 2.4 — §2.3 Inter-chunk dependency map — UPDATE chunks 2-4 framing #4 dependency posture.** Reflect F-3 scope absorption at chunk 4 grade. Chunks 2-4 substrate-dependency ordering preserved (chunk 2 impl → chunk 3 impl → chunk 4 impl per substrate-dependency operational sequencing); chunk 4 F-3 substrate change scope absorption is integration-grade work substantively aligned with chunk 4 envelope per framing (ii) preliminary recommendation inheritance.

- [ ] **Step 2.5 — §3.1 Files modified — add F-3-related files.** Add to §3.1 enumeration:
  - `apps/web/supabase/migrations/<new_migration>_make_linked_entity_id_nullable.sql` (NEW; alter `document_relationship_candidates.linked_entity_id` to NULL-able)
  - `apps/web/src/shared/schemas/document-platform/documentRelationshipCandidate.schema.ts` (Zod widening at `linked_entity_id` field → `.nullable()`)
  - `apps/web/src/services/document-platform/documentRouterService.ts` (NewCandidatePayload type widening + vendor_invoice Scenario A inferred-target emission path + receipt Scenario A variant emission path)
  - `apps/web/src/shared/schemas/document-platform/sourceDocumentLink.schema.ts` (VALID_PAIRS refine adjustment)
  - `apps/web/src/types/database.ts` (types regeneration post-migration)

- [ ] **Step 2.6 — §3.2 Files created — possibly add F-3 integration test files.** Add to §3.2 enumeration (decision at amendment composition grade per test-file-split-vs-consolidation adjudication):
  - `apps/web/tests/integration/documentRouterInferredTargetEmission.integration.test.ts` (or analogous; per-test-file convention per testing.md Candidate #8)
  - Decision at impl-onset whether vendor_invoice Scenario A inferred-target + receipt Scenario A variant share test file OR per-document-type test file split

- [ ] **Step 2.7 — §4 Tasks — add Task 5 (F-3 substrate change scope absorption).** Per Session 62 disposition design §4.1 (g) brainstorming-side preliminary recommendation: add Task 5 (F-3 substrate change scope absorption) as gated-by-Tasks-1-2-3 task per substrate-dependency ordering; preserves Task 1 (pipeline_trace) → Task 2 (downstream consumer wiring) → Task 3 (integration tests) gating chain; Task 5 ships F-3 substrate change scope + Task 6 (renamed from Task 4) close gate.

Task 5 scope decomposition:

- Task 5.1 — Migration authoring + types regeneration
- Task 5.2 — Zod schema widening at Layer 2 boundary
- Task 5.3 — VALID_PAIRS refine adjustment + service-layer emission path additions (vendor_invoice Scenario A inferred-target + receipt Scenario A variant)
- Task 5.4 — Downstream consumer audit at Subsystem 2 + Subsystem 3 + LINKED_ENTITY_TABLE_MAP

- [ ] **Step 2.8 — New §2.5 (or §6.X) F-3 absorption framing carry-forward observations section.** Add new section between §2.4 (currently absent per chunk 4 brief original composition) and §3 — or alternatively at §6.X carry-forward observations section addition — enumerating:
  - F-3 scope absorption framing (ii) inheritance from chunk 2 brief Session 60 second amendment
  - Session 62 brief-amendment-cycle-posture-pivot sub-pattern N=1 first-instance MATERIALIZATION
  - Six substrate change requirements enumeration (mirrors chunk 2 brief §2.4 substrate)
  - Banking surfaces at Session 62 amendment cycle grade

**Acceptance criteria for Task 2:**
- Chunk 4 brief amendment delta within ~200-400 LOC band per forecast.
- All eight amendment sub-tasks (Steps 2.1-2.8) fire CLEAN per Session 62 disposition design §4.1 specification.
- Substrate citations grounded at verify-from-disk evidence at Phase A re-verify grade.
- No substrate-evidence-propagation-gap firings at amendment composition grade.

---

## Task 3: Post-composition spot-check — sub-grain (iv) discipline grade

**Files:**
- `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md` (post-amendment read-back verification)

- [ ] **Step 3.1 — Read full amended chunk 4 brief at post-composition grade.** Verify §1 preamble + §2 scope (§2.1 four-axis + §2.2 + §2.3 + §2.4 NEW or §2.5 NEW) + §3 substrate touchpoints (§3.1 modified + §3.2 created + §3.3 NOT modified + §3.4) + §4 tasks (Task 1 + Task 2 + Task 3 + Task 5 NEW + Task 6 close gate) + §5 Path C + §6 carry-forward observations.

- [ ] **Step 3.2 — Verify amendment LOC delta against forecast band.** Run `wc -l` against amended chunk 4 brief; verify total LOC against forecast band (620 baseline + ~200-400 delta = ~820-1020 amended target).

- [ ] **Step 3.3 — Verify substrate citation grounding at post-composition grade.** Spot-check 5-10 substrate citations in amended sections against verify-from-disk evidence (ADR-0015 §7 + chunk 2 brief §2.4 + documentRelationshipCandidate.schema.ts:204 + ADR-0011 + ADR-0016 + ADR-0018 linked_entity_id citations).

- [ ] **Step 3.4 — Verify cross-reference integrity at amendment composition grade.** Verify all cross-references between amended sections (e.g., §1.1 four-axis decomposition cross-references §2.1 axis 4 subsection) resolve correctly.

**Acceptance criteria for Task 3:**
- Amended chunk 4 brief reads coherently at post-composition grade.
- Amendment LOC delta within forecast band.
- All substrate citations grounded at verify-from-disk evidence.
- All cross-references resolve correctly.

---

## Task 4: Phase C three-commit close

**Files:**
- `docs/09_briefs/phase-8/2026-05-22-session-62-disposition-design.md` (Commit 1: design doc)
- `docs/09_briefs/phase-8/2026-05-22-session-62-chunk-4-brief-amendment-plan.md` (Commit 2: this plan doc)
- `docs/09_briefs/phase-8/chunks/2026-05-21-phase-8-chunk-4.md` (Commit 3: chunk 4 brief amendment explicit-correction commit at HEAD)

- [ ] **Step 4.1 — Commit 1: Session 62 disposition design doc.** Commit shape per Session 59 precedent (commit `eb67f5d` Session 59 design):

```
docs(phase-8): Session 62 disposition design — Candidate (β) chunk 4 brief proactive amendment cycle interjection for F-3 scope (a) + (b) absorption per substrate-evidence-propagation-gap sub-grain (d) chunk-specific firing condition discipline empirical validation grade

Session 62 brief-amendment-cycle-posture-pivot sub-pattern N=1 first-instance MATERIALIZATION-IN-PROGRESS at disposition design grade. Per /superpowers:brainstorming skill chain at Session 62 onset; founder Candidate (β) explicit ratification per "lets go with your recommendation" grade at brainstorming-side preliminary recommendation backing + WSL-side reciprocal-acknowledgment concurring inheritance grade per three substrate-grade reasons: (1) sub-grain (d) chunk-specific firing condition discipline empirical validation at Session 61 grade (chunk 4 has KNOWN F-3 cross-phase substrate change requirement per chunk 2 brief Session 60 second amendment §B.3 + §2.4 + §6.12 canonical anchor inheritance); (2) proactive-vs-reactive amendment cycle timing efficiency (~2-session-budget savings per Sessions 59 + 60 N=2 reactive precedent); (3) brief-as-source-of-truth invariant structural preservation.
```

- [ ] **Step 4.2 — Commit 2: Session 62 amendment plan doc.** Commit shape per Session 59 precedent (commit `63b8749` Session 59 plan):

```
docs(phase-8): Session 62 chunk 4 brief amendment implementation plan — per /superpowers:executing-plans skill chain from design doc 2026-05-22-session-62-disposition-design.md
```

- [ ] **Step 4.3 — Commit 3: chunk 4 brief amendment explicit-correction commit at HEAD.** Commit shape per Session 59 (`328c322`) + Session 60 (`83bc5ac`) precedent:

```
docs(phase-8): chunk 4 brief amendment — absorb F-3 scope (a) vendor_invoice Scenario A inferred-target + F-3 scope (b) receipt Scenario A variant (payment, receipt) null linked_entity_id substrate change per chunk 2 brief Session 60 second amendment §B.3 + §2.4 + §6.12 canonical anchor inheritance — §1.1 substantive surface scope EXTENSION (three-axis → four-axis decomposition) + §2.1 axis 4 NEW subsection + §2.2 deferral language UPDATE + §2.3 inter-chunk dependency map UPDATE + §3.1 modified-files F-3 substrate change additions + §3.2 created-files F-3 integration test additions + §4 Tasks Task 5 NEW (F-3 substrate change scope absorption with 4-sub-task decomposition) + §2.5 (or §6.X) NEW F-3 absorption framing carry-forward observations — explicit-correction commit at HEAD per Session 54 0e50cfb + Session 59 328c322 + Session 60 83bc5ac precedent inheritance; original chunk 4 brief commit a2c20fa preserved immutable; discovery-after-commit substrate-stability discipline N=4 → N=5 promotion-threshold-MET fire materialized + substrate-evidence-propagation-gap remediation via explicit correction commit N=3 → N=4 confirming-fire candidate + brief-amendment-cycle-posture-pivot sub-pattern N=1 first-instance MATERIALIZATION completed
```

- [ ] **Step 4.4 — Verify post-commit state: 42 commits ahead of origin/staging.**

```bash
git log --oneline origin/staging..HEAD | wc -l
git log --oneline -3
```

Expected: `42` (39 baseline + 3 amendment cycle commits); HEAD = chunk 4 brief amendment commit.

**Acceptance criteria for Task 4:**
- 3 commits ship per Session 59 + 60 amendment cycle precedent shape.
- Post-commit state: 42 commits ahead of `origin/staging`.
- No push fires (per memory feedback_coord_lock_hostile_takeover + Candidate #13 push-terminal-close discipline; push fires at Phase 8 retrospective close ~Session 70+).

---

## Task 5: Memory close + close-state report

**Files:**
- `/home/philc/.claude/projects/-home-philc-projects-chounting/memory/project_phase_8_session_62_chunk_4_brief_amendment.md` (NEW; topic file)
- `/home/philc/.claude/projects/-home-philc-projects-chounting/memory/MEMORY.md` (index update; one-line entry under ~200 chars per size-cap warning)

- [ ] **Step 5.1 — Compose project_phase_8_session_62_chunk_4_brief_amendment.md topic file.** Template: `project_phase_8_session_59_chunk_2_brief_amendment.md` already in memory dir. Capture:
  - Three findings (or single F-3 absorption finding) at Session 62 disposition adjudication grade
  - Amendments at chunk 4 brief commit `<sha>` (TBD post-commit)
  - Banking surfaces materialized at Session 62 grade
  - Next operational fire (Session 63 chunk 4 single-chunk impl re-dispatch forecast)

- [ ] **Step 5.2 — Add one-line MEMORY.md index entry under ~200 chars.** Per Session 59 amendment cycle MEMORY.md index entry shape inheritance.

- [ ] **Step 5.3 — Compose close-state report at Session 62 close grade.** Mechanism B outcomes inventory + banking surfaces inventory close per Session 62 directive specification.

**Acceptance criteria for Task 5:**
- Memory topic file shipped at canonical path.
- MEMORY.md index entry added under size-cap discipline.
- Close-state report composed at Session 62 close grade.

---

## Banking surfaces forecast at Session 62 close grade

Per Session 62 disposition design §6 banking surfaces materialized at disposition adjudication grade:

- Substrate-evidence-propagation-gap discipline N=6 maintained at FIVE-grain depth; sub-grain (d) chunk-specific firing condition discipline N=1 maintained-not-graduated per Session 61 empirical validation inheritance.
- Brief-amendment-cycle-posture-pivot sub-pattern N=1 first-instance MATERIALIZATION-COMPLETED at Session 62 close grade.
- Substantively-novel-substantively-informed-trade-off-adjudication discipline N=2 confirming-fire MATERIALIZATION at Session 62 ratification grade.
- Discovery-after-commit substrate-stability discipline N=4 → N=5 promotion-threshold-MET fire MATERIALIZATION at Phase C Commit 3 explicit-correction grade.
- Substrate-evidence-propagation-gap remediation via explicit correction commit sub-pattern N=4 confirming-fire candidate MATERIALIZATION.
- Chunk-brief-amendment-cycle-iteration sub-pattern N=2 cross-chunk confirming-fire candidate MATERIALIZATION.
- Three-substrate-grade-reasons-commonly-form-recommendation-backing discipline N=2 confirming-fire candidate MATERIALIZATION.
- Multi-iteration refinement at directive-authoring grade N=25 cumulative confirming-fire MATERIALIZATION.

Phase 8 retrospective Commit B routing priority HIGH for graduation candidates substantively past N=3 promotion threshold.

---

Related design doc: `docs/09_briefs/phase-8/2026-05-22-session-62-disposition-design.md`.
