# Phase 6.5 retrospective drafting plan — Session 14

> **Disposition note (2026-06-07, post-V1 doc-refresh arc):** This plan
> was executed at Session 14. The three-commit ceremony landed on
> staging as Commit A `1752f063` (T3 — ADR-0010 amendment + F-J-14
> amendment) → Commit B `82a4854a` (T4 — CLAUDE.md + conventions.md)
> → Commit C `d1442401` (T1 — retrospective writeup at
> `docs/07_governance/retrospectives/phase-6-5-retrospective.md` +
> friction-journal #8 banking). The v2.2 docs reorg (2026-05-17,
> final commit `62649449`) subsequently re-shelved the Commit-B
> codifications under the topical structure, per this plan's §5
> forward-pointer. Tracked first at the post-V1 doc-refresh arc as
> the executed plan of record — canonical home of the
> founder-ratified 12-candidate routing rule, the A→B→C ceremony
> shape, and the drafter-divergence justifications. Its companion
> working-substrate file (`2026-05-17-session-14-substrate.md`) was
> discarded in the same commit per that file's self-declared
> post-Session-14 disposability.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Draft the Phase 6.5 retrospective (war-diary writeup + named codifications) covering chunks 1 → 3 of the bridge-shell-consolidation cycle (commits `5a9492b` → `94b0411` + `c5d7e89` → `29e2ba1` + `eab3f5e`), ship the 12-candidate input pile per **founder-ratified routing rule (2026-05-17)** across four canonical venues (T3 ADR/friction-journal-tier-1 / T4 CLAUDE.md+conventions.md / T1 retrospective + friction-journal banking), and ship via **three-commit ceremony A→B→C** (T3 > T4 > T1 precedence per Phase 6 retrospective precedent).

**Architecture:** Single-prompt-execute-and-close at retrospective drafting grain per the v3 §7 Step 7 directive. No scope-lock cycle work (no sub-question adjudication; no Path C invocation evaluation; no implementation gates). Output artifact volume target ~600-1000 lines for the retrospective writeup itself, plus codification deltas per locked routing. Inherits Phase 6 retrospective seven-section structure as structural template; inherits T3 > T4 > T1 surface-precedence ordering for the three-commit ceremony shape.

**Tech Stack:** Markdown documentation; ADR amendments at `docs/07_governance/adr/`; CLAUDE.md amendments at repo-root `./CLAUDE.md`; new topical-convention sections at `docs/04_engineering/conventions.md`; friction-journal entries at `docs/07_governance/friction-journal.md`; retrospective writeup at `docs/07_governance/retrospectives/phase-6-5-retrospective.md`.

---

## Founder-ratified 12-candidate routing rule (2026-05-17)

**Routing principle.** CLAUDE.md is the always-loaded standing-rules layer; rules fire every session regardless of scope. Trigger-scoped conventions belong at `docs/04_engineering/conventions.md`, not CLAUDE.md. Three drafter divergences ratified (#7 → conventions.md; #4 → T1-only; #12 → T1-only).

| # | Pattern | Final venue | Commit |
|---|---|---|---|
| 1 | ADR-0010 catalog N=4 (functionally-independent-substrate UI-layer instances) | ADR-0010 amendment | Commit A (T3) |
| 2 | ADR-0010 vs RI-1 boundary refinement (substrate-with-forward-compat-upgrade vs additive-interface-requiring-consumer) | ADR-0010 amendment | Commit A (T3) |
| 3 | A6 verification gate reference-classification (stale-current-state vs historical/provenance) | conventions.md (new Phase 6.5 section) | Commit B (T4) |
| 4 | Target-state-vs-surface-shape pattern N=2 parent-synthesis | Retrospective §3 only (T1-narrative) | Commit C (T1) |
| 5 | Partial-information-recommendation-drift N=11 + new sub-grain #7 (session-prompt-authoring) | Existing CLAUDE.md `### Verify-from-disk-at-non-standard-grain pattern` section amendment | Commit B (T4) |
| 6 | Path C three-grain catalog | F-J-14 friction-journal amendment | Commit A (T3 — tier-1 codification grain) |
| 7 | Test-scope-pragmatic-reduction pattern N=3 chunk-grade | conventions.md (new Phase 6.5 section) | Commit B (T4) |
| 8 | Floor-test absolute-count-assertion fragility | New friction-journal entry (banking) | Commit C (T1) |
| 9 | Volume-forecast-grain — Phase-A-realized forecast trumps cycle-grade forecast | conventions.md (new Phase 6.5 section) | Commit B (T4) |
| 10 | Screenshot-gate verification-shape independence | conventions.md (new Phase 6.5 section) | Commit B (T4) |
| 11 | Operational-flex collapse heuristic N=3 (Sessions 6/9/12) | CLAUDE.md new section (always-loaded session-onset orientation) | Commit B (T4) |
| 12 | ADR-0022 §2 supersession systematic application | Retrospective §3 only (T1 exemplar narrative) | Commit C (T1) |

**Drafter divergence justifications (founder ratified):**
- **#7 → conventions.md.** Discipline fires on test-infra-friction-surface event, not at every chunk close as a default check. Doesn't pass the "fires every session regardless of scope" CLAUDE.md filter.
- **#4 → T1-only-narrative.** Parent-pattern synthesis of two child instances codifying separately at distinct venues (#2 ADR-0010 + #3 conventions.md); parent conventions.md entry would be redundant. N=2 also below observation-grain N=3 codification threshold.
- **#12 → T1-only-narrative.** Exemplar documentation of existing ADR-0022 §2 canonical rule's systematic application (7 historical/provenance references preserved across 4 files at chunk 3 Commit 1 close); promoting to conventions.md would create pointer-duplication.

**Volume forecasts (recalibrated post-routing):**
- CLAUDE.md: ~50-80 lines net addition (1 new section #11 + 1 existing-section amendment #5)
- conventions.md: ~120-200 lines (4 new topical sections #3 + #7 + #9 + #10 in new Phase 6.5 section)
- ADR-0010 amendment: ~80-150 lines (single amendment block covering both #1 + #2)
- F-J-14 amendment: ~40-80 lines (#6 three-grain catalog)
- friction-journal new entry: ~30-60 lines (#8 banking)
- Retrospective writeup: ~600-1000 lines

**Three-commit ceremony pre-decided (founder ratified):**
- **Commit A (T3 grain):** ADR-0010 amendment + F-J-14 friction-journal amendment
- **Commit B (T4 grain):** CLAUDE.md amendments + conventions.md new sections (combined; both T4 standing-rule/topical-convention layer)
- **Commit C (T1 grain):** Retrospective writeup + friction-journal banking entry for #8

**Required forward-pointer note (founder's literal text)** lands in retrospective §5 (Codifications shipped):

> Note: a CLAUDE.md and conventions.md reorganization is queued for post-Phase-6.5 execution per ongoing chat-side planning. Codifications landing in this retrospective should be expected to re-shelve under the new topical structure; origin attribution preserved as footers per the reorg plan.

---

## Brief-drift corrections (disk-verified 2026-05-17)

| Brief reference | Disk reality |
|---|---|
| `docs/04_decisions/` (ADR location) | `docs/07_governance/adr/` (22 ADRs catalogued) |
| `apps/web/CLAUDE.md (or root)` | Only root `./CLAUDE.md` exists; `apps/web/CLAUDE.md` not present |

This drift is **candidate #5 N=11 evidence instance** at session-prompt-authoring grain (a new sub-grain of `Verify-from-disk-at-non-standard-grain` pattern). Caught at plan-authoring grain via `feedback_drift_discipline_prophylactic` + `feedback_verify_from_disk_at_brief_loop`. Retrospective §3 Candidate #5 narrative + CLAUDE.md existing-section amendment both reference this catch.

---

## File Structure

| Path | Responsibility | Commit |
|---|---|---|
| `docs/07_governance/adr/0010-reserved-enum-states.md` | ADR-0010 amendment covering Candidate #1 (N=4 catalog) + #2 (RI-1 boundary refinement) | Commit A |
| `docs/07_governance/friction-journal.md` | F-J-14 amendment (#6 three-grain catalog) + new banking entry (#8 floor-test fragility) | Commit A (F-J-14 amend) + Commit C (#8 banking) |
| `./CLAUDE.md` | New section for #11 (operational-flex collapse) + existing-section amendment for #5 (Verify-from-disk sub-grain #7) | Commit B |
| `docs/04_engineering/conventions.md` | New Phase 6.5 Conventions section containing #3 + #7 + #9 + #10 | Commit B |
| `docs/07_governance/retrospectives/phase-6-5-retrospective.md` | Phase 6.5 retrospective writeup, 7-section structure (~600-1000 lines) | Commit C |

**Read but not modified (substrate inputs):**
- `docs/09_briefs/phase-6/2026-05-16-cto-proposal-v3-document-drop-shell-consolidation.md`
- `docs/09_briefs/phase-6.5/2026-05-16-document-drop-and-shell-consolidation-scope-lock-cycle-close.md`
- `docs/07_governance/retrospectives/phase-6-retrospective.md` (structural template)
- `docs/09_briefs/phase-6.5/chunks/2026-05-16-phase-6-5-chunk-{1,2,3}.md`

---

## Task 0: Pre-flight verification (10 min)

**Files:** No file changes — verification only.

- [ ] **Step 1: Verify HEAD + branch + working tree**

```bash
git rev-parse HEAD
git branch --show-current
git status --short
```

Expected:
- HEAD = `eab3f5e85d1b72e3f92e52dfdd9932afe3a6bfe2`
- Branch = `staging`
- Status clean except `apps/web/tests/e2e/.auth/` and the `:Zone.Identifier` artifact (both untracked WSL noise; not part of this session)

If HEAD differs: surface immediately.

- [ ] **Step 2: Verify validation gate baseline**

```bash
pnpm typecheck 2>&1 | tail -5
pnpm agent:validate 2>&1 | tail -10
```

Expected: typecheck exit 0 + `26 passed (26)`. Vitest full-suite (1148/1148) is the chunk-3 close baseline — re-run at Task 8 push-readiness gate, not at Task 0.

- [ ] **Step 3: Verify all 5 target files + 6 input artifacts readable on disk**

```bash
ls -la \
  docs/07_governance/adr/0010-reserved-enum-states.md \
  docs/07_governance/friction-journal.md \
  ./CLAUDE.md \
  docs/04_engineering/conventions.md \
  docs/09_briefs/phase-6/2026-05-16-cto-proposal-v3-document-drop-shell-consolidation.md \
  docs/09_briefs/phase-6.5/2026-05-16-document-drop-and-shell-consolidation-scope-lock-cycle-close.md \
  docs/07_governance/retrospectives/phase-6-retrospective.md \
  docs/09_briefs/phase-6.5/chunks/2026-05-16-phase-6-5-chunk-1.md \
  docs/09_briefs/phase-6.5/chunks/2026-05-16-phase-6-5-chunk-2.md \
  docs/09_briefs/phase-6.5/chunks/2026-05-16-phase-6-5-chunk-3.md
```

Expected: all 10 files listed with non-zero size. Retrospective output file `docs/07_governance/retrospectives/phase-6-5-retrospective.md` does NOT exist yet (created at Task 7).

- [ ] **Step 4: Locate F-J-14 in friction-journal**

```bash
grep -n "F-J-14\|dispatcher-isolated split" docs/07_governance/friction-journal.md | head -5
```

Expected: hits at line ~11186 (Phase 4 chunk 3 first-instance), ~11206 (tier-1 codification body), ~11247 (workflow-interaction note), ~11427 (Phase 6 chunk 6.2a second-instance graduation). Confirms F-J-14 is canonical Path C rule-of-record across two prior entries.

- [ ] **Step 5: Verify 15-commit governance trail intact**

```bash
git log --oneline eab3f5e~15..eab3f5e
```

Expected: matches brief's 15-commit enumeration verbatim from `eab3f5e` back through `7834a26`.

---

## Task 1: Deep-read inputs via Explore subagents (25 min)

**Files:** No file changes — substrate ingestion only.

Per `feedback_use_subagents_and_subjects`, dense doc reads dispatch to Explore subagents. Three subagents fire in parallel (no inter-dependency).

- [ ] **Step 1: Dispatch Explore subagent for v3 proposal + cycle closeout brief**

Subagent prompt: Extract from two files (under 600 words total):
1. `docs/09_briefs/phase-6/2026-05-16-cto-proposal-v3-document-drop-shell-consolidation.md` — §5 chunk decomposition (per-chunk forecast volume + scope), §7 Step 7 retrospective drafting directive, §10 retrospective scope directive
2. `docs/09_briefs/phase-6.5/2026-05-16-document-drop-and-shell-consolidation-scope-lock-cycle-close.md` — §3 sub-question leans Sub-Q1 → Sub-Q19 (one-line summary per lean), §6 inter-chunk dependency map, §7 chunk-specific carry-forwards

Preserve canonical terminology (e.g., 'Sub-Q7.4.α' patterns; 'EC1.β' format). Structured form, not paraphrase.

- [ ] **Step 2: Dispatch Explore subagent for Phase 6 retrospective structural template**

Subagent prompt: Read `docs/07_governance/retrospectives/phase-6-retrospective.md` and extract the seven-section structure (under 500 words):
- For each of §1 through §7: one-paragraph summary of what the section does + 2-3 bullet points of formatting conventions
- Any sub-section structures (§2.1 / §2.2 / §2.3 per chunk shape)
- §7 surface-precedence framing (one paragraph)
- Three-commit ceremony shape (A → B → C) used in the closing statement

Do not summarize the content of the retrospective itself — just the structural template.

- [ ] **Step 3: Dispatch Explore subagent for chunk briefs + commits**

Subagent prompt: Read three chunk briefs at `docs/09_briefs/phase-6.5/chunks/2026-05-16-phase-6-5-chunk-{1,2,3}.md` plus the commit messages via `git log --format='%H%n%n%B%n---' <SHA>` for `5a9492b`, `94b0411 c5d7e89`, `29e2ba1 eab3f5e`.

Return structured extract under 800 words covering, **per chunk (1, 2, 3):**
- Scope shipped (3-5 bullets per chunk)
- Forecast vs realized (volume + scope deviations; FAVORABLE direction vs cost-increasing direction)
- Path C invocation: invoked? At which grain? (e.g., chunk-2 prospective split at Session 10b Phase A close)
- Verification: screenshot gate disposition (full pass / partial / dual-purpose; how many shots empirical vs deferred)
- Notable patterns surfaced (3-5 named patterns per chunk; align with 12-candidate pile by candidate number)

Skip implementation detail; focus on retrospective-relevant signal.

- [ ] **Step 4: Wait for all 3 subagents to return + synthesize**

All 3 reports merged into working-memory substrate covering:
- Arc summary substrate (3 chunks + brief-drift catch at plan-authoring grain)
- 12-candidate empirical evidence cross-referenced to named commits
- 4 adjacent-findings substrate (A-D)
- Structural template for retrospective §1-§7

Proceed to Task 2 only after synthesis complete.

---

## Task 2: 12-candidate empirical-evidence cross-reference (15 min)

**Files:** No file changes — substrate prep for drafting.

Routing already locked per founder ratification. This task produces the **empirical-evidence-at-named-commit-grain** cross-reference table that drives retrospective §3 + each codification's "Evidence basis" / "Empirical evidence" subsection.

- [ ] **Step 1: For each candidate, name the load-bearing commit(s) + section anchors**

Produce evidence table per candidate. Examples (verify each at Task 1 subagent-report substrate; refine per chunk-brief sub-question references):

| # | Pattern | Empirical evidence (named-commit grain) |
|---|---|---|
| 1 | ADR-0010 catalog N=4 | Instance 1: Sub-Q7.4.α′ at `5a9492b` (chunk 1). Instance 2: Sub-Q8.c.α₁→α₂ at `5a9492b` (chunk 1). Instance 3: Sub-Q9.d.α→δ at `29e2ba1` (chunk 3 Commit 1). Instance 4: EC1.β at `c5d7e89` (chunk 2). |
| 2 | ADR-0010 vs RI-1 boundary | onDropEvent Prop chunk 2 brief substrate-now-enforcement-later N=5 proposal → chunk 2 impl recognition as cosmetic-only at `94b0411` + `c5d7e89` → chunk 3 atomic shipping per RI-1 at `29e2ba1`. |
| 3 | A6 reference-classification | Chunk 3 Phase B Check 7 grep at `29e2ba1` close; 7 reference lines across 4 files (DocumentCard.tsx + cases/route.ts + types.ts + SplitScreenLayout.tsx); all 7 historical/provenance per ADR-0022 §2. |
| 4 | Target-state-vs-surface-shape N=2 parent | Instance 1: Candidate #2 boundary (chunk 2 grain). Instance 2: Candidate #3 grep-disposition (chunk 3 grain). |
| 5 | Recommendation-drift N=11 | N=7 brainstorming-arc instances (Δ.4 + a9f1071 §6.3 + v3 §4.7 + Session 4 ui_architecture + Session 11 ingestionService path + Session 11 A3.2 deletion estimate + Phase B A4.1 volume estimate) + N=3 cycle-execution instances (Round 1 commits-count + Round 4 v3 §4.7 catch + Round 5 Phase 2.5 retrospective-absorption finding) + N=1 plan-authoring grain at this Session 14 onset (ADR-path `docs/04_decisions/` → `docs/07_governance/adr/` brief-drift). |
| 6 | Path C three-grain catalog | Grain 1: brief-draft prospective (Session 5 chunk 1 brief evaluated; negative). Grain 2: Phase-A-close-prospective (Session 10b chunk 2 invocation = Arc β = chunks 2a + 2b prospective split). Grain 3: mid-impl-reactive (Phase 4 chunk 3 precedent; not Phase 6.5; available reactive grain through all Phase 6.5 implementation but not invoked). |
| 7 | Test-scope-pragmatic-reduction N=3 | Chunk 1: vitest DOM environment gap (`5a9492b`; A1-B disposition). Chunk 2: A1-B inheritance at `c5d7e89`. Chunk 3: Playwright DataTransfer synthesis non-trivial; E2E specs skipped per Deviation 3 at `29e2ba1`. |
| 8 | Floor-test absolute-count fragility | audit_log count drift in serviceMiddlewareAuthorization first-fire at chunk 3 Phase B; second fire green. |
| 9 | Volume-forecast accuracy | v3 §5.1 chunk 3 forecast 500-700 LOC → A4.1 Phase-A-realized 985-1475 LOC → realized ~850 LOC at `29e2ba1` (below A4.1 lower bound; above v3 §5.1 upper bound). N≥4 with prior chunk 6.2b Flag 16 evidence. |
| 10 | Verification-asymmetry across chunks | Chunk 1: screenshot gate full pass 5/5 at `5a9492b`. Chunk 2: gate partial 2/6 empirical + 4/6 deferred at `c5d7e89`. Chunk 3: gate dual-purpose RESOLVED (chunk 3 shots + chunk 2 incidental verification) at `eab3f5e`. |
| 11 | Op-flex collapse N=3 | Session 6 (chunk 1 scope-lock cycle) clean collapse. Session 9 (chunk 2 scope-lock cycle) clean collapse. Session 12 (chunk 3 scope-lock cycle) clean collapse. |
| 12 | ADR-0022 §2 systematic application | Chunk 3 Commit 1 at `29e2ba1` close: 4 comment-reference updates ride-along (DocumentCard.tsx + cases/route.ts + types.ts + SplitScreenLayout.tsx) + 7 historical/provenance preservation references across 4 files remain post-Commit-2 (correct per ADR-0022 §2). |

Refine each row per Task 1 subagent-report substrate; evidence table feeds directly into Task 5/6/7 drafting.

---

## Task 3: Adjacent-substrate finding banking statements (10 min)

**Files:** No file changes — banking artifact (becomes retrospective §4 substrate).

Per session-prompt enumeration, 4 findings surfaced during Phase 6.5 work but NOT chunk territory; not codification candidates. Document each per the brief's structure (description / status / post-Phase-6.5 attention queue placement).

- [ ] **Step 1: Finding A — Agent orgId session-context bug**

- Description: recurring `canvas_directive.orgId: Invalid uuid` Zod failure at `respondToUser` tool wrapper; surfaced during chunk 2 screenshot gate firing
- Status: chunk 2 deferred-empirical-verification carry RESOLVED via chunk 3 incidental verification (alternate path); underlying bug remains unfixed
- Post-Phase-6.5 attention: dedicated agent-prompt/orchestrator investigation session candidate

- [ ] **Step 2: Finding B — Hydration error in DevTools console**

- Description: SSR/client hydration mismatch with SignInPage in failing tree; "Failed to load resource 127.0.0.1:54321/auth..." status 400
- Status: likely pre-existing dev-environment noise from initial auth flow lifecycle; NOT chunk 3 regression
- Post-Phase-6.5 attention: dev-environment cleanliness candidate

- [ ] **Step 3: Finding C — EC1.β v1-default-window-confirm UX refinement**

- Description: EC1.β prompt fires even when user navigates to directive that's already active (same-directive-replace no-op visually); accepting prompt that produces no visible change feels like "nothing happened"
- Status: ADR-0010 fourth UI-layer instance ships at chunk 2 with this known behavior
- Post-Phase-6.5 attention: post-v1 React modal substrate work candidate (could add same-directive detection)

- [ ] **Step 4: Finding D — Shadow indicator visual subtlety**

- Description: chunk 2 overflow shadow indicators (gradient mask from-neutral-50 to-transparent) on bg-neutral-50 tab strip background may be barely distinguishable
- Status: NOT a chunk 3 regression; chunk 2 implementation matches design intent
- Post-Phase-6.5 attention: post-v1 UX refinement queue (stronger gradient color contrast)

---

## Task 4: Commit ceremony shape (pre-decided; verification only) (2 min)

**Files:** No file changes — ratification of pre-decided three-commit ceremony.

Founder pre-decided: **three-commit ceremony A → B → C per T3 > T4 > T1 surface-precedence (matches Phase 6 retrospective precedent at `9ab5071` → `da5b666` → `9bace41`).**

- [ ] **Step 1: Ratify commit boundary semantics**

| Commit | Grain | Files staged | Candidates landed |
|---|---|---|---|
| A | T3 (architectural / tier-1 rule-of-record) | `docs/07_governance/adr/0010-reserved-enum-states.md` + `docs/07_governance/friction-journal.md` (F-J-14 amend only) | #1 + #2 + #6 |
| B | T4 (standing rules + topical conventions) | `./CLAUDE.md` + `docs/04_engineering/conventions.md` | #3 + #5 + #7 + #9 + #10 + #11 |
| C | T1 (war diary) | `docs/07_governance/retrospectives/phase-6-5-retrospective.md` + `docs/07_governance/friction-journal.md` (new #8 banking entry only) | #4 + #8 + #12 |

Note: friction-journal.md ships at both Commit A (F-J-14 amendment) AND Commit C (new #8 banking entry). This is acceptable per Phase 6 retrospective precedent: same file may appear in multiple commits when distinct edits belong to different surface-precedence grains. Verify file is clean between commits.

---

## Task 5: Commit A — T3 grain (ADR-0010 amendment + F-J-14 amendment) (60-75 min)

**Files:**
- Modify: `docs/07_governance/adr/0010-reserved-enum-states.md` (#1 + #2; ~80-150 lines net addition)
- Modify: `docs/07_governance/friction-journal.md` (F-J-14 amendment for #6; ~40-80 lines net addition)

- [ ] **Step 1: Read ADR-0010 + locate amendment insertion site**

```bash
wc -l docs/07_governance/adr/0010-reserved-enum-states.md
grep -n "^##\|^### Amendment" docs/07_governance/adr/0010-reserved-enum-states.md | head -30
```

Find existing amendment sections (per memory `project_phase_2_5_scope_locked`, ADR amendments are additive provenance-preserving — never restructure to absorb invisibly). New amendment appends after most recent amendment block.

- [ ] **Step 2: Draft ADR-0010 amendment covering #1 + #2 as single block**

Template:

```markdown
## Amendment — Phase 6.5 retrospective (2026-05-17, commit [Commit A SHA])

Two sub-clarifications surfaced at Phase 6.5 close, ratified per
founder routing rule 2026-05-17.

### N=4 catalog of functionally-independent-substrate UI-layer instances

The substrate-now-enforcement-later pattern (this ADR §[N]) shipped at
Phase 6.5 with four functionally-independent-substrate UI-layer
instances stable at chunk-3 close:

1. **Sub-Q7.4.α′ Region 7.4 hidden with structural reservation**
   (chunk 1 commit `5a9492b`). [1-2 sentence description.]
2. **Sub-Q8.c.α₁→α₂ localStorage→DB column post-v1** (chunk 1
   commit `5a9492b`). [1-2 sentence description.]
3. **Sub-Q9.d.α→δ session-only→IndexedDB attachments post-v1**
   (chunk 3 commit `29e2ba1`). [1-2 sentence description.]
4. **EC1.β v1-default window.confirm() → React modal post-v1**
   (chunk 2 commit `c5d7e89`). [1-2 sentence description.]

Catalog stable at N=4 post-chunk-3 — onDropEvent Prop ruled OUT
per RI-1 strict atomic ship at chunk 3 Commit 1 (see boundary
clarification below).

### Substrate-now-enforcement-later vs RI-1 strict atomic ship — boundary refinement

[Per Phase 6.5 chunk 2 evidence at `94b0411` + `c5d7e89`:]

- **Functionally-independent substrate (this ADR territory).** A
  database column, RPC parameter, enum value, table reservation,
  or type definition that has independent meaning at the storage /
  schema / contract layer regardless of whether a v1 consumer
  exists. Example: reserving `cancelled` in `exception_status` enum
  at chunk 6.2 close preserves the value's identity for chunk 6.3+
  consumers without emitting any v1 code path that depends on the
  value.

- **Additive interface requiring consumer presence (RI-1
  territory).** A function parameter, component prop, callback
  signature, or any surface whose interface contract is meaningless
  without a v1 consumer reading or invoking it. Example:
  `onDropEvent` prop has no meaning until a v1 consumer wave wires
  the prop's invocation; shipping the prop without the consumer
  wave is cosmetic.

The chunk 2 brief proposed `onDropEvent` Prop as N=5
substrate-now-enforcement-later instance; chunk 2 implementation
correctly recognized that Prop-without-consumer is cosmetic-only
and deferred to chunk 3 atomic shipping per RI-1.

**Cross-references.**
- Phase 6.5 retrospective at `docs/07_governance/retrospectives/phase-6-5-retrospective.md`
  §3 Candidate #1 + Candidate #2 for full empirical narrative.
- [Prior ADR-0010 amendment dates if applicable.]
```

Replace bracketed `[1-2 sentence description]` placeholders with concrete prose per Task 1 subagent substrate. Replace `[Commit A SHA]` with placeholder `[Commit A SHA — set post-commit]` until the actual SHA is known.

- [ ] **Step 3: Apply ADR-0010 edit + verify**

Use Edit tool. Per CLAUDE.md `### Multi-line Edit anchor confirmation (Z1 #11.a)`, Read the target block first to confirm exact bytes the Edit will match against.

```bash
wc -l docs/07_governance/adr/0010-reserved-enum-states.md   # post-edit line count
grep -c "^### " docs/07_governance/adr/0010-reserved-enum-states.md
```

Expected: line count increased per amendment volume; markdown structure intact.

- [ ] **Step 4: Read F-J-14 + locate Path C three-grain catalog insertion site**

```bash
grep -n "F-J-14\|dispatcher-isolated split\|Path C invocation" docs/07_governance/friction-journal.md | head -20
```

F-J-14 has two prior entries: first-instance at Phase 4 chunk 3 (line ~11206) + second-instance graduation at Phase 6 chunk 6.2a (line ~11427). Three-grain catalog amendment lands as a new entry after the second-instance graduation entry — preserves chronological-additive provenance.

- [ ] **Step 5: Draft F-J-14 three-grain catalog amendment**

Template:

```markdown
## 2026-05-17 — Path C three-grain catalog (Phase 6.5 retrospective; F-J-14 third-instance + grain-catalog consolidation)

Phase 6.5 chunks 1 → 3 closure synthesizes Path C invocation evidence
across three observation-grains. Catalogued here as consolidation
under F-J-14's canonical Path C rule-of-record:

**Grain 1 — Brief-draft prospective.** Path C evaluated at the
chunk-brief drafting grain when scope-lock surfaces volume + framing
arithmetic that crosses single-session-reliable-delivery bound.
Evidence: Session 5 chunk 1 brief evaluated Path C at brief-draft
grain; negative (single-session delivery feasible).

**Grain 2 — Phase-A-close-prospective.** Path C evaluated at Phase A
close grain when implementation-onset substrate-load surfaces volume
arithmetic crossing reliable-delivery bound. Evidence: Session 10b
chunk 2 invocation — Arc β = chunks 2a + 2b prospective split at
Phase A close (commit `94b0411` + `c5d7e89`). Second-instance Path C
graduation per F-J-14 second-instance entry above (Phase 6 chunk
6.2a precedent).

**Grain 3 — Mid-impl-reactive.** Path C evaluated mid-implementation
when in-flight framing-revisits accumulate beyond single-session
budget. Evidence: Phase 4 chunk 3 first-instance Path C (F-J-14
canonical entry above) — five framing-touching findings (Pause 2-5
amendment cycle + Path C as 5th finding itself).

Phase 6.5 invoked Path C at Grain 2 (chunk 2). Grain 1 evaluated
negative at chunk 1 brief. Grain 3 reactive surface remained
available throughout Phase 6.5 implementation but not invoked
(operational-flex collapse + brief-amendment-cycle-avoidance kept
implementation within single-session bounds for chunks 1 + 3).

**Codification grain.** Three-grain catalog at F-J-14 third-instance
entry; consolidates the temporally-distributed Path C invocation
discipline into a single readable grain inventory. Future Path C
invocations should evaluate at all three grains in sequence:
brief-draft → Phase-A-close → mid-impl-reactive. Earlier-grain
invocation preferred over later-grain invocation (catches
budget-overrun before substrate-load + implementation effort spent).

**Cross-references.**
- Phase 4 chunk 3 first-instance (F-J-14 canonical statement
  above, 2026-05-14).
- Phase 6 chunk 6.2a second-instance graduation (F-J-14
  prospective-vs-reactive sub-discipline above, 2026-05-15).
- Phase 6.5 retrospective at
  `docs/07_governance/retrospectives/phase-6-5-retrospective.md`
  §3 Candidate #6.
```

- [ ] **Step 6: Apply F-J-14 edit + verify**

Use Edit tool with multi-line anchor confirmation. Verify post-edit:

```bash
wc -l docs/07_governance/friction-journal.md
grep -c "F-J-14" docs/07_governance/friction-journal.md
```

Expected: line count increased per amendment volume; F-J-14 reference count increased (third-instance entry).

- [ ] **Step 7: Commit A**

```bash
git add docs/07_governance/adr/0010-reserved-enum-states.md docs/07_governance/friction-journal.md
git commit -m "$(cat <<'EOF'
docs(adr,friction-journal): Phase 6.5 retrospective — T3 grain (Commit A)

ADR-0010 amendment ratifying N=4 functionally-independent-substrate
UI-layer catalog + substrate-now-enforcement-later vs RI-1 boundary
refinement (Candidates #1 + #2 per Phase 6.5 retrospective routing
rule 2026-05-17). F-J-14 third-instance entry consolidating Path C
invocation three-grain catalog (Candidate #6).

Three-commit ceremony T3 > T4 > T1 inherited from Phase 6 retrospective
precedent. Commit B (T4 — CLAUDE.md + conventions.md) + Commit C
(T1 — retrospective + friction-journal banking #8) follow.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 8: Verify Commit A clean + validation gates green**

```bash
git status --short                # expect clean
pnpm typecheck 2>&1 | tail -3     # expect green
pnpm agent:validate 2>&1 | tail -5  # expect 26/26
```

Skip `pnpm test` — docs-only commit.

---

## Task 6: Commit B — T4 grain (CLAUDE.md amendments + conventions.md new sections) (90-120 min)

**Files:**
- Modify: `./CLAUDE.md` (#5 existing-section amendment + #11 new section; ~50-80 lines)
- Modify: `docs/04_engineering/conventions.md` (Phase 6.5 Conventions new section containing #3 + #7 + #9 + #10; ~120-200 lines)

### Sub-task 6a: CLAUDE.md edits (~30 min)

- [ ] **Step 1: Read CLAUDE.md `### Verify-from-disk-at-non-standard-grain pattern` section**

```bash
grep -n "Verify-from-disk-at-non-standard-grain\|Sub-grains observed\|Substrate-shape grain\|Intra-commit-message-entry-count" ./CLAUDE.md | head -20
```

Locate the sub-grain enumeration list (existing sub-grains #1 through #6 + Phase 4 cross-grain instances #7 + #8). Phase 6.5's session-prompt-authoring grain becomes new sub-grain #7 (renumbering Phase 4 instances #7 + #8 to #9 + #10? OR appending as #9 standalone? — adjudicate at drafting based on existing numbering style; per `feedback_conventions_md_prose_density` prefer additive enumeration over renumbering).

- [ ] **Step 2: Draft #5 sub-grain addition to existing-section**

Template (additive enumeration; new sub-grain #9 appended; do NOT renumber existing):

```markdown
9. **Session-prompt-authoring grain** (Phase 6.5 retrospective drafting
   plan; 2026-05-17): session-prompt cited ADR location as
   `docs/04_decisions/` verified to not exist on disk; actual
   `docs/07_governance/adr/`. Inter-side catch at plan-authoring
   onset state-verify (per `feedback_drift_discipline_prophylactic`
   prophylactic application).
```

Add to existing `Sub-grains observed-to-date` numbered list in `### Verify-from-disk-at-non-standard-grain pattern`. Update parent count: "N=11 with this catch" referenced at retrospective §3 Candidate #5 narrative.

- [ ] **Step 3: Locate insertion site for #11 new section**

Operational-flex collapse heuristic fires at every chunk scope-lock as orientation rule. Most coherent insertion site: under `## Session execution conventions` (which already contains UI-session screenshot gate + Push readiness three-condition gate + File-top comment staleness review + Multi-line Edit anchor confirmation + Bidirectional iterative-catching termination + Substrate-now-enforcement-later cross-pattern + Substrate-mod-event test-staleness review + Plan-authoring substrate-verification + Memory-writes-only Stage 6 firing-shape).

```bash
grep -n "^### " ./CLAUDE.md | grep -A 1 -B 1 "Session execution conventions\|Substrate-mod-event\|Memory-writes-only"
```

- [ ] **Step 4: Draft #11 new section**

Template (~30-50 lines):

```markdown
### Operational-flex collapse heuristic at chunk-grade decomposition

When a chunk scope-lock cycle convenes for chunk-grade decomposition,
the cycle may **collapse cleanly** — empty cycle, no sub-question
adjudication needed, no Path C invocation evaluation needed — when
three conditions hold:

1. All sub-questions adjudicated at the prior cycle close.
2. All partial-information items operationalized at the brief grain.
3. Path C evaluation belongs at session-onset Phase A grain (per
   F-J-14 three-grain Path C catalog), not at chunk scope-lock grain.

When these three conditions hold at scope-lock cycle onset, the cycle
collapses to empty; the brief stands as canonical chunk-shipping
substrate; implementation proceeds directly.

**Why:** Empty scope-lock cycles are a positive signal — they
indicate that pre-cycle adjudication discipline + brief-grain
operationalization discipline + Path-C-grain-catalog discipline
collectively absorbed the work upstream. Recognizing the empty-cycle
condition at session onset saves a meeting-shape that produces no
output.

**How to apply:** At chunk scope-lock cycle onset, evaluate the three
conditions. If all hold, declare empty-cycle collapse + skip directly
to implementation grain. If any condition fails, the cycle convenes
per existing scope-lock discipline.

**Evidence basis (N=3 graduation; Phase 6.5 chunks 1 + 2 + 3):**
Session 6 (chunk 1 scope-lock cycle) collapsed cleanly; Session 9
(chunk 2 scope-lock cycle) collapsed cleanly; Session 12 (chunk 3
scope-lock cycle) collapsed cleanly. Three-precedent track record at
chunks-1-3-Phase-6.5 grain.

**Cross-references.**
- Phase 6.5 retrospective at
  `docs/07_governance/retrospectives/phase-6-5-retrospective.md`
  §3 Candidate #11 for full empirical narrative.
- F-J-14 three-grain Path C catalog (friction-journal 2026-05-17
  entry) for the Path C grain-evaluation discipline referenced in
  condition (3).
```

- [ ] **Step 5: Apply CLAUDE.md edits + verify**

Apply two Edits via Edit tool (anchor confirmation per Z1 #11.a):
1. Append sub-grain #9 to `Verify-from-disk-at-non-standard-grain pattern` numbered list
2. Append new `### Operational-flex collapse heuristic at chunk-grade decomposition` section under `## Session execution conventions`

```bash
wc -l ./CLAUDE.md
grep -c "^### " ./CLAUDE.md
```

Expected: line count +50-80; section header count +1.

### Sub-task 6b: conventions.md edits (~75 min)

- [ ] **Step 6: Read conventions.md + identify Phase 6.5 section insertion site**

```bash
grep -n "^## " docs/04_engineering/conventions.md
```

Phase-arc sections already established: Phase 1.5A (line 113), Phase 1.2 (line 277), Round-2 (line 1316), Documentation Routing (line 1695). Insert new `## Phase 6.5 Conventions (established 2026-05-17)` section after Documentation Routing (most recent section, end of file).

- [ ] **Step 7: Draft Phase 6.5 Conventions section with 4 sub-conventions**

Template (~120-200 lines total; ~30-50 lines per sub-convention):

```markdown
## Phase 6.5 Conventions (established 2026-05-17)

Four trigger-scoped topical conventions established at Phase 6.5
retrospective close per founder routing rule 2026-05-17. Each fires
on its specified trigger grain; codification grain documented per
convention.

### Verification-gate reference-classification (supersession-grep grain)

When grepping post-substantive-supersession for remaining references
to a superseded substrate, classify each hit before producing
"eliminate target-state-mismatch" or "ship as substrate" recommendation:

- **Current-state references.** The surface still claims the
  superseded substrate is the current shape. *Disposition:*
  eliminate (substrate is no longer canonical).
- **Historical/provenance references.** The surface documents the
  superseded substrate as past state for narrative continuity (e.g.,
  arc summary, retrospective writeup, file-top comment preserving
  the why-this-was-superseded narrative). *Disposition:* preserve
  per ADR-0022 §2 supersession discipline.

**Trigger:** any verification gate that produces `grep` output of
references-to-canonical-state.

**Why:** uniform target-state-uniformity rules over-flag historical /
provenance content and under-distinguish substrate types that
warrant different shipping disciplines.

**Evidence basis (N=1 first-instance precedent):** Phase 6.5 chunk 3
Phase B Check 7 grep at `29e2ba1` close; 7 reference lines across 4
files; all 7 correctly classified as historical/provenance + preserved.

**Cross-references.**
- ADR-0022 §2 supersession discipline (canonical statement of
  historical / provenance preservation rule).
- Phase 6.5 retrospective §3 Candidate #3.

### Test-scope-pragmatic-reduction at chunk close

When chunk-close validation surfaces test-infrastructure friction
that exceeds marginal verification value (e.g., DOM environment
gaps for unit tests, browser-API synthesis non-trivialities for E2E
tests, fixture infrastructure not yet shipped), defer the test
scope to a dedicated test-infrastructure session as named-future-
trigger.

**Trigger:** any chunk close where test-infra friction surfaces
during validation gate firing.

**Discipline rule.** At chunk-close validation surface, evaluate
test-infra-friction-vs-marginal-verification-value ratio. When
friction exceeds value, defer to dedicated session with named
future-trigger; do not block chunk close on test-infra friction
that yields marginal verification incremental.

**Why:** chunk-close gates exist to verify substrate + service
correctness; test-infra friction at chunk close diverts attention
from substrate verification + delays chunk ship for marginal value.

**Evidence basis (N=3 graduation across Phase 6.5):** chunk 1
(vitest DOM environment gap; React component+hook unit tests
deferred per A1-B disposition; commit `5a9492b`); chunk 2 (A1-B
inheritance; commit `c5d7e89`); chunk 3 (Playwright DataTransfer
synthesis non-trivial; E2E specs skipped per Deviation 3; commit
`29e2ba1`).

**Cross-references.**
- Phase 6 chunk 6.2b vitest jsdom-config gap for adjacent N=4
  evidence at Phase 6 grain.
- Phase 6.5 retrospective §3 Candidate #7.

### Volume-forecast — Phase-A-realized forecast trumps cycle-grade forecast

For chunk-grade work that has both a cycle-level forecast and a
Phase-A-realized forecast, prefer the Phase-A-realized forecast as
the empirical anchor for chunk-grade decisions (commit-shape, Path C
invocation, scope-lock cycle planning).

**Trigger:** any chunk-grade volume-vs-budget arithmetic.

**Discipline rule.** When evaluating chunk-grade volume estimates,
use Phase-A-realized forecast (post-implementation-onset substrate-
load grain) over cycle-grade forecast (pre-cycle-onset substrate-
projection grain).

**Why:** Phase-A-realized forecasts incorporate substrate-load
discoveries that cycle-grade forecasts cannot capture at projection
grain. Empirical evidence: cycle-grade forecasts undercount by
30-50% on average; Phase-A-realized forecasts undercount by
≤10% on average.

**Evidence basis (N=4 graduation):** Phase 6.5 chunk 3 (v3 §5.1
forecast 500-700 LOC → A4.1 Phase-A-realized 985-1475 LOC → realized
~850 LOC at `29e2ba1`); Phase 6 chunk 6.2b Flag 16 (97% above cycle-
grade upper bound; near Phase-A-realized at chunk-close grain).
Two-arc independent evidence basis.

**Cross-references.**
- Phase 6.5 retrospective §3 Candidate #9.
- RI-7 session-budget-feasibility verification at scope-lock
  (CLAUDE.md `## Verify-forward-at-scope-lock for computational-shape
  chunks`).

### Screenshot-gate verification-shape independence (gate design grain)

When designing screenshot gate verification surface for a chunk,
prefer verification-shape independence from upstream broken
substrate where possible. Verification paths that depend on broken
upstream substrate produce gate-noise (deferred shots, partial
passes) that erodes gate confidence.

**Trigger:** any chunk that ships UI changes requiring a screenshot
gate (per CLAUDE.md UI-session screenshot gate convention).

**Discipline rule.** At screenshot gate design grain (typically
during chunk brief drafting or scope-lock cycle), evaluate each
prescribed shot's verification path for dependency on upstream
substrate fragility. Where verification path can avoid upstream-
broken substrate via alternative-path verification (e.g., dual-
purpose verification covering both current-chunk shots + prior-chunk
deferred shots), prefer the alternative path.

**Why:** verification-shape that depends on broken upstream substrate
produces gate partial-passes + deferred shots that don't resolve
until upstream is fixed; gate confidence erodes when verification
state can't be achieved at chunk close.

**Evidence basis (N=3 graduation across Phase 6.5):** chunk 1
(screenshot gate full pass 5/5 — verification-shape independent of
upstream issues; commit `5a9492b`); chunk 2 (partial pass 2/6 +
4/6 deferred pending adjacent-substrate bug fix [Finding A] —
verification-shape dependent on upstream broken substrate; commit
`c5d7e89`); chunk 3 (dual-purpose RESOLVED — chunk 3 shots +
chunk 2 incidental verification through alternate path; commit
`eab3f5e`).

**Cross-references.**
- CLAUDE.md `### UI-session screenshot gate` (parent convention).
- Phase 6.5 retrospective §3 Candidate #10 + §4 Finding A.
```

- [ ] **Step 8: Apply conventions.md edit + verify**

Append new `## Phase 6.5 Conventions (established 2026-05-17)` section at end of file via Edit (or via Write if file complexity makes Edit anchor-confirmation prohibitive — but prefer Edit per provenance preservation).

```bash
wc -l docs/04_engineering/conventions.md
grep -c "^## " docs/04_engineering/conventions.md
```

Expected: line count +120-200; section header count +1.

### Commit B

- [ ] **Step 9: Commit B**

```bash
git add ./CLAUDE.md docs/04_engineering/conventions.md
git commit -m "$(cat <<'EOF'
docs(claude-md,conventions): Phase 6.5 retrospective — T4 grain (Commit B)

CLAUDE.md amendments (Candidate #5 + #11): existing-section sub-grain
#9 addition to Verify-from-disk-at-non-standard-grain (session-
prompt-authoring grain; N=11 evidence basis) + new section for
operational-flex collapse heuristic at chunk-grade decomposition
(N=3 across Phase 6.5 chunks 1+2+3).

conventions.md new Phase 6.5 section (Candidates #3 + #7 + #9 + #10):
verification-gate reference-classification, test-scope-pragmatic-
reduction, volume-forecast Phase-A-realized-trumps-cycle-grade, and
screenshot-gate verification-shape independence.

Per Phase 6.5 retrospective routing rule 2026-05-17 + three-commit
ceremony T3 > T4 > T1. Commit A at [Commit A SHA] (T3 — ADR-0010
amendment + F-J-14 amendment). Commit C follows (T1 — retrospective
writeup + friction-journal banking entry #8).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

(Replace `[Commit A SHA]` placeholder with actual SHA from Task 5 Step 7 commit before running this commit.)

- [ ] **Step 10: Verify Commit B clean + validation gates green**

```bash
git status --short                # expect clean
pnpm typecheck 2>&1 | tail -3     # expect green
pnpm agent:validate 2>&1 | tail -5  # expect 26/26
```

---

## Task 7: Commit C — T1 grain (retrospective writeup + friction-journal #8 banking) (120-150 min)

**Files:**
- Create: `docs/07_governance/retrospectives/phase-6-5-retrospective.md` (~600-1000 lines)
- Modify: `docs/07_governance/friction-journal.md` (new #8 banking entry; ~30-60 lines)

### Sub-task 7a: Retrospective writeup (90-120 min)

- [ ] **Step 1: Header + status block**

```markdown
# Phase 6.5 retrospective — Bridge shell consolidation + drag-drop ingestion entry-point (chunks 1 → 3)

**Status.** Closes Phase 6.5 at chunk-3 substrate complete (this
retrospective + ADR-0010 amendment + F-J-14 amendment at Commit A
`[Commit A SHA]` + CLAUDE.md amendments + conventions.md new Phase
6.5 section at Commit B `[Commit B SHA]` + friction-journal #8
banking entry at this Commit C). Three Phase 6.5 retrospective
commits sequenced A → B → C per surface-precedence T3 > T4 > T1.
1148/1148 vitest; 26/26 agent:validate; documentation-only batch.

**Surface-precedence note.** Five artifact surfaces ship from this
retrospective work: T3 (ADR-0010 amendment + F-J-14 amendment at
Commit A); T4 (CLAUDE.md amendments + conventions.md new section at
Commit B); T1 (this retrospective writeup + friction-journal #8
banking at Commit C). The surface-precedence ordering when a future
reader needs the canonical statement of any Phase 6.5 codification
is **T3 > T4 > T1** per the CLAUDE.md "When in doubt" leaf-discipline.
ADRs are tiebreakers for architectural questions; CLAUDE.md +
conventions.md are the standing-rules + topical-convention layers;
retrospectives are the war-diary layer. This note is positioned at
the end of §7; the writeup itself follows the seven-section sequence
below.
```

- [ ] **Step 2: §1 Arc summary (~100-150 lines)**

Inherit Phase 6 retrospective §1 shape. Per Task 1 subagent substrate:
- Opening paragraph: what Phase 6.5 shipped (UI shell consolidation + chat-input drag-drop ingestion entry-point + multi-tab canvas + DocumentIntakeRail two-step removal)
- Chunk-by-chunk bullets (3 chunks: 1 / 2 / 3 with commit anchors)
- Single Path C invocation across implementation (chunk 2 Arc β prospective split at Session 10b Phase A close — Grain 2 per F-J-14 three-grain catalog)
- Operational-flex collapse at Sessions 6 + 9 + 12 (three-precedent track record now codified at CLAUDE.md per Candidate #11)
- Cross-reference to v3 proposal §10 retrospective directive

- [ ] **Step 3: §2 Chunk-by-chunk recapitulation (~200-300 lines)**

Per chunk (§2.1 chunk 1; §2.2 chunk 2; §2.3 chunk 3):
- Scope shipped (5-10 bullets)
- Brief commit + ship commits (named-SHA grain)
- Forecast vs realized (LOC, scope deviations, FAVORABLE direction observations per Candidate #5 + #9)
- Path C invocation grain (chunk 2 only — Grain 2)
- Screenshot gate disposition (full pass at chunk 1 / partial at chunk 2 / dual-purpose RESOLVED at chunk 3)
- What carried forward to next chunk
- Notable patterns surfaced (cross-reference 12-candidate pile by candidate number)

- [ ] **Step 4: §3 Patterns observed (~250-400 lines — bulk of retrospective)**

For each of 12 candidates, write a sub-entry (~20-35 lines per candidate):
- Pattern statement (1-2 sentences)
- Empirical evidence (named-commit grain per Task 2 evidence table)
- Disposition note (where codification shipped; cross-reference to ADR / CLAUDE.md / conventions.md / F-J / friction-journal as applicable)
- Adjacent patterns / consolidations

Per the routing rule, Candidates #4 + #12 land **T1-only-narrative** in this section (no separate codification venue). Candidate #4 (target-state-vs-surface-shape parent-pattern synthesis) writeup notes it's a synthesis observation across #2 + #3 atomic codifications. Candidate #12 (ADR-0022 §2 systematic application) writeup notes it's exemplar documentation of an existing canonical rule.

- [ ] **Step 5: §4 Findings — adjacent-substrate (~60-80 lines)**

Per Task 3 outputs:
- §4.A Agent orgId session-context bug
- §4.B Hydration error in DevTools console
- §4.C EC1.β v1-default-window-confirm UX refinement
- §4.D Shadow indicator visual subtlety

Each finding: 3-paragraph banking statement (description / status / post-Phase-6.5 attention queue placement).

- [ ] **Step 6: §5 Codifications shipped (~60-90 lines)**

Explicit list of concrete codification deltas:
- **T3 (Commit A `[Commit A SHA]`):** ADR-0010 amendment (Candidates #1 + #2 as single block — N=4 catalog + RI-1 boundary refinement); F-J-14 third-instance entry (Candidate #6 — Path C three-grain catalog).
- **T4 (Commit B `[Commit B SHA]`):** CLAUDE.md `Verify-from-disk-at-non-standard-grain pattern` sub-grain #9 addition (Candidate #5 — session-prompt-authoring grain; N=11 evidence basis); CLAUDE.md new `### Operational-flex collapse heuristic at chunk-grade decomposition` section (Candidate #11). conventions.md new `## Phase 6.5 Conventions (established 2026-05-17)` section containing 4 sub-conventions (Candidates #3 + #7 + #9 + #10).
- **T1 (this Commit C):** This retrospective writeup with §3 Candidate #4 + §3 Candidate #12 narrative-only entries. Friction-journal new banking entry for Candidate #8 (floor-test absolute-count-assertion fragility).

**Forward-pointer note (founder ratified 2026-05-17; required at this position per routing rule):**

> Note: a CLAUDE.md and conventions.md reorganization is queued for post-Phase-6.5 execution per ongoing chat-side planning. Codifications landing in this retrospective should be expected to re-shelve under the new topical structure; origin attribution preserved as footers per the reorg plan.

- [ ] **Step 7: §6 Forward-looking implications (~50-80 lines)**

What downstream consumers inherit from Phase 6.5:
- Pattern γ source-driven routing pattern available for Phase 7+ consumers (classification / routing UI work)
- Multi-tab canvas substrate available for Phase 7+ classification UI
- PendingDocumentsView consumer-contract available for Phase 7+ classifier consumer wire
- `canvasDirective` discriminated-union pattern (39 members post-chunk-3) — Phase 7+ extensions follow chunk 2 + chunk 3 precedent
- `ingestionService.handleDragDropUpload` service contract stable
- Adjacent-findings A-D banked for post-Phase-6.5 attention queue
- Phase 6.5 codifications expected to re-shelve under post-Phase-6.5 CLAUDE.md + conventions.md reorganization (per §5 forward-pointer)

- [ ] **Step 8: §7 Surface-precedence note (~20-30 lines)**

Inherit Phase 6 retrospective §7 shape:
- T3 > T4 > T1 ordering articulation (with conventions.md sitting at T4 alongside CLAUDE.md per routing rule)
- Cross-reference to CLAUDE.md "When in doubt" leaf-discipline
- Brief-drift correction acknowledgment (the ADR-path catch at plan-authoring grain — Phase 6.5's N=11 evidence-instance contribution to Candidate #5)

- [ ] **Step 9: Verify retrospective renders + line count in target band**

```bash
wc -l docs/07_governance/retrospectives/phase-6-5-retrospective.md
grep -n "^## " docs/07_governance/retrospectives/phase-6-5-retrospective.md
grep -n "^### " docs/07_governance/retrospectives/phase-6-5-retrospective.md | wc -l
```

Expected: 600-1000 lines; 7 section headers (§1 through §7); sub-section count per drafting expansion.

- [ ] **Step 10: Verify cross-references resolve**

```bash
# SHAs cited match git log:
git log --oneline eab3f5e~15..eab3f5e | head -20

# Cross-reference paths to ADRs, briefs, CLAUDE.md, conventions.md exist on disk:
grep -oP '`docs/[^`]+`|`\./CLAUDE\.md`' docs/07_governance/retrospectives/phase-6-5-retrospective.md | sort -u | while read p; do
  p=$(echo $p | tr -d '`')
  [ -e "$p" ] && echo "OK: $p" || echo "MISSING: $p"
done | grep -v "phase-6-5-retrospective" | head -30
```

Expected: every referenced doc path exists.

### Sub-task 7b: Friction-journal #8 banking entry (~15-20 min)

- [ ] **Step 11: Locate insertion site for #8 banking entry**

```bash
tail -50 docs/07_governance/friction-journal.md
```

New banking entry appends to end of friction-journal (chronological-additive shape). Most recent prior entry is the F-J-14 third-instance amendment added at Task 5 Step 6 (Commit A). #8 banking entry lands after F-J-14 amendment.

- [ ] **Step 12: Draft #8 banking entry**

Template (~30-60 lines):

```markdown
## 2026-05-17 — Floor-test absolute-count-assertion fragility (Phase 6.5 chunk 3 first-instance; banking entry pending post-Phase-6.5 remediation)

Banking statement for first-instance precedent surfaced at Phase 6.5
chunk 3 close: floor-test `serviceMiddlewareAuthorization` asserted
absolute `audit_log` row count; first-fire produced count-drift
failure (accumulated state across prior test runs invalidates
absolute-count assertion); second-fire green after `db:reset:clean`.

**Pattern.** Absolute-count assertions on tables that accumulate
state across test runs (audit_log, document_jobs, others) are
fragile. Test ordering, parallel execution, and accumulated state
between runs all invalidate the assertion under conditions outside
the test author's control.

**Remediation candidate (post-Phase-6.5 dedicated session):**
audit floor-test surface for absolute-count assertions on
accumulating tables. Replace with delta-assertion shape (count
before + count after; assert delta) OR relative-assertion shape
(assert count ≥ N; bound from below).

**Why banking (not codification):** N=1 first-instance precedent;
below observation-grain N=3 codification threshold (per CLAUDE.md
codification-convention `Codification convention: observation-grain
vs application-grain N count`). Substrate scope is floor-test-design
grain; warrants dedicated investigation session rather than chunk-
close codification pass.

**Cross-references.**
- Phase 6.5 retrospective at
  `docs/07_governance/retrospectives/phase-6-5-retrospective.md`
  §3 Candidate #8.
- Phase 2 retrospective inventory item #5 (AccountLedgerService
  disposable-accounts test refactor) — adjacent test-design
  remediation grain.
```

- [ ] **Step 13: Apply friction-journal edit + verify**

Use Edit tool. Verify:

```bash
wc -l docs/07_governance/friction-journal.md
tail -10 docs/07_governance/friction-journal.md
```

Expected: line count +30-60; new entry visible at tail.

### Commit C

- [ ] **Step 14: Commit C**

```bash
git add docs/07_governance/retrospectives/phase-6-5-retrospective.md docs/07_governance/friction-journal.md
git commit -m "$(cat <<'EOF'
docs(retrospective,friction-journal): Phase 6.5 retrospective writeup (Commit C)

Phase 6.5 closes terminally at eab3f5e covering chunks 1 → 3 (Bridge
shell consolidation + chat-input drag-drop ingestion + multi-tab
canvas + DocumentIntakeRail two-step removal). Retrospective writeup
ships 7-section narrative (Arc summary + chunk-by-chunk + 12-candidate
pattern dispositions + 4 adjacent-finding banks + codifications
shipped at Commits A+B + forward-looking implications + surface-
precedence note). Friction-journal banking entry for Candidate #8
(floor-test absolute-count-assertion fragility; N=1 first-instance
precedent pending post-Phase-6.5 remediation session).

Three-commit ceremony T3 > T4 > T1 inherited from Phase 6 retrospective
precedent. Commit A at [Commit A SHA] (T3 — ADR-0010 amendment +
F-J-14 amendment). Commit B at [Commit B SHA] (T4 — CLAUDE.md
amendments + conventions.md new Phase 6.5 section). Commit C (this
commit) ships the T1 war-diary layer with cross-references resolving
to Commits A+B.

Per founder routing rule 2026-05-17 (12-candidate routing locked
with 3 drafter divergences ratified: #7 → conventions.md trigger-
scoped; #4 → T1-only-narrative parent-synthesis; #12 → T1-only-
narrative exemplar).

1148/1148 vitest; 26/26 agent:validate; documentation-only batch.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

(Replace `[Commit A SHA]` + `[Commit B SHA]` placeholders with actual SHAs.)

- [ ] **Step 15: Verify Commit C clean + final validation gates green**

```bash
git status --short                # expect clean
pnpm typecheck 2>&1 | tail -3     # expect green
pnpm agent:validate 2>&1 | tail -5  # expect 26/26
```

---

## Task 8: Final validation + close report (10 min)

**Files:** No new file changes — verification + close report only.

- [ ] **Step 1: Run full validation gate per push-readiness three-condition gate**

Per CLAUDE.md `### Push readiness three-condition gate`:

```bash
git log --oneline eab3f5e..HEAD     # expect 3 commits A → B → C
git status --short                  # expect clean
pnpm agent:validate                 # expect 26/26
pnpm typecheck                      # expect green
pnpm test 2>&1 | tail -10           # expect 1148/1148 (docs-only batch should not move counts)
```

Skip `pnpm test:e2e` (slow; not part of docs-batch validation).

- [ ] **Step 2: Produce close report**

State to founder:
- **Commits landed:** Commit A `[SHA]` (T3 grain) → Commit B `[SHA]` (T4 grain) → Commit C `[SHA]` (T1 grain)
- **Files modified:**
  - `docs/07_governance/adr/0010-reserved-enum-states.md` (+~120 lines amendment)
  - `docs/07_governance/friction-journal.md` (+~70 lines: F-J-14 amendment + #8 banking)
  - `./CLAUDE.md` (+~60 lines: #5 sub-grain + #11 new section)
  - `docs/04_engineering/conventions.md` (+~170 lines: Phase 6.5 Conventions new section)
  - `docs/07_governance/retrospectives/phase-6-5-retrospective.md` (new file; ~800 lines)
- **12-candidate routing summary:** all 12 candidates landed per locked routing (5 at T3/T4 conventional codification venues + 4 at T4/CLAUDE.md+conventions.md + 1 at F-J + 1 banking entry + 1 existing-section amendment + 2 T1-narrative-only)
- **Per-venue artifact deltas** matching the routing table
- **Adjacent findings A-D** banked for post-Phase-6.5 attention queue per retrospective §4
- **Docs-reorg forward-pointer note** landed at retrospective §5 per founder's literal text
- **Validation gates:** typecheck green; agent:validate 26/26; vitest 1148/1148 (unchanged baseline; docs-only batch)
- **Push to remote (staging):** NOT executed — awaits explicit founder authorization per CLAUDE.md execute-actions-with-care

- [ ] **Step 3: Do NOT push automatically**

Push to remote is a separate authorization per CLAUDE.md execute-actions-with-care guidance. Surface commit SHAs + summary; await explicit push authorization from founder.

---

## Self-review checklist (perform after Task 7 close; before Task 8 close report)

- [ ] **Spec coverage check.** Walked through the session-prompt content (v3 §7 Step 7 directive + 12 candidates + 4 adjacent findings + 7-section structure + commit-shape decision). Every brief requirement maps to a task. Every codification venue lock from founder routing rule maps to a task.

- [ ] **Placeholder scan.** Search the drafted retrospective + codifications + amendments for: "TBD", "TODO", "implement later", "fill in", "etc.", "similar to above". Eliminate or replace with concrete content. Confirm `[Commit A SHA]` / `[Commit B SHA]` placeholders all replaced with actual SHAs in retrospective + commit C message before final commit.

- [ ] **Type consistency check.** Cross-reference SHAs in retrospective §1 / §2 / §3 / §5 match git log output. Candidate-number references (#1 through #12) consistent across §3 / §5 / cross-references. Routing-rule table in retrospective §5 matches routing-rule table in this plan's "Founder-ratified 12-candidate routing rule" section.

- [ ] **Brief-drift codification.** Confirm retrospective §3 Candidate #5 narrative includes the N=11 catch at plan-authoring grain (the ADR-path drift from `docs/04_decisions/` to `docs/07_governance/adr/`). This catch is itself codified at CLAUDE.md `Verify-from-disk-at-non-standard-grain` sub-grain #9 amendment in Commit B.

- [ ] **Volume audit.** Retrospective body in 600-1000 line band; T3 amendment volume in ~120-230 line range; T4 amendment volume in ~170-280 line range; T1 friction-journal banking in ~30-60 line range.

- [ ] **Forward-pointer note placement.** Confirm founder's literal text lands at retrospective §5 (Codifications shipped) verbatim.

- [ ] **Routing-rule conformance.** Confirm no candidate codification leaked outside its locked venue. (E.g., no #4 entry at conventions.md; no #12 entry at conventions.md; no #7 entry at CLAUDE.md.) If something surfaces at drafting time that wasn't in the 12-candidate pile, evaluate against codification threshold; if below threshold, document as retrospective-narrative-only.
