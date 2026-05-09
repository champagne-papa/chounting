# Session 6: Four-README Rewrites + Doc-Class Pattern Propagation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Round-2 Session 6 — rewrite the four directory READMEs that owe consumer-grade alignment with the round-2 architectural principles ratified at 5A. Propagate the doc-class opener pattern (`**Document class: <name>.**`) and the canonical-axis framing from `docs/09_briefs/README.md` to `docs/01_prd/README.md`, `docs/02_specs/README.md`, `docs/03_architecture/README.md`, and `docs/04_engineering/README.md`. Two work shapes: (a) full rewrite of `01_prd/README.md` (failed-forward — described future state that round-2 retired by populating the folder; structural-pattern adoption); (b) targeted rewrites of `02_specs/README.md`, `03_architecture/README.md`, `04_engineering/README.md` (failed-backward — under-specifies present state by omitting canonical-source files named in `CLAUDE.md`; content-completeness expansion).

**Architecture:** 3 commits applied at session level. C1 grouped rewrite of the failed-backward triple (02/03/04). C2 full rewrite of 01_prd (failed-forward case, post-5B-touchup baseline). C3 closeout friction-journal entry. Total: 3 commits — N=4 of the count-level commit pattern at the structural level (implementation-then-closeout); count varies (3 implementation rather than 4) per the work-shape grouping. Pattern holds at the structural level; count-level variance is itself a brainstorm-time observation captured in the closeout entry.

**Tech Stack:** Edit/Write tools, `git mv` (none expected), `grep -rn` for cross-reference verification, bash for verification.

---

## Inter-session dependency: 5B execution closeout state

**This plan executes against a docs structure 5B execution creates.** Session 6 brainstorm dispatches before 5B execution runs (HEAD at brainstorm-dispatch time = 5B brainstorm closeout, not 5B execution closeout). Session 6 execution session opens against a HEAD that includes 5B's five-commit migration sequence, and the work scope below assumes 5B's acceptance criteria (a)–(l) per `docs/07_governance/round-2/2026-05-08-session-5b-plan.md` were met.

This is a structurally novel mechanism class for round-2 plans. Prior round-2 plans had stop conditions but no inter-session dependency verification of this shape. The mechanism: **Stop Condition 1 verifies 5B execution closed cleanly before any Session 6 commits land.** If verification fails, the executor halts at session start and resolves before proceeding — either by escalating to a fresh brainstorm pass if 5B execution introduced unexpected scope, or by inline plan revision if the deviation is bounded.

The mechanism is preserved as plan-internal substrate so a fresh-context execution session can apply it without reading this brainstorm's conversation history. Stop Condition 1's verification list (below) is the operational surface; this section is its design rationale.

---

## Acceptance criteria

- (a) `docs/01_prd/README.md` rewritten to include: doc-class opener (`**Document class: PRDs.**`), feature-level-intent canonical axis articulated, "What goes here / What does NOT go here" structure (parity with 02/03/04), cross-references to `/00_product/`, `/02_specs/`, `/04_engineering/`, `/09_briefs/`. No "ships empty" / "first occupant" / "deletion criterion" framings (5B execution touchup removed these; Session 6 ensures the rewrite doesn't reintroduce them).
- (b) `docs/02_specs/README.md` rewritten to include: doc-class opener (`**Document class: specs.**`), system-truth canonical axis articulated, file-presence enumeration covering ledger truth (`ledger_truth_model.md`, `data_model.md`, `invariants.md`) AND agent-governance (`agent_autonomy_model.md`, `intent_model.md`, `mutation_lifecycle.md`) AND meta (`glossary.md`, `taxonomy.md`), pre/post-ratification boundary with `09_briefs/specs/` (per ADR-0021) named explicitly. Existing "What goes / What does NOT go" structure preserved per δ-i discipline.
- (c) `docs/03_architecture/README.md` rewritten to include: doc-class opener (`**Document class: architecture.**`), system-design canonical axis articulated, canonical-source enumeration matching `CLAUDE.md`'s authoritative-source list (`folder-structure.md` per ADR-0020, `authority-gradient.md`, `phase_simplifications.md`). Existing structure preserved per δ-i discipline.
- (d) `docs/04_engineering/README.md` rewritten to include: doc-class opener (`**Document class: engineering.**`), implementation-surface canonical axis articulated (git-clone-to-shipping), canonical-source enumeration matching `CLAUDE.md`'s authoritative-source list (`repo-rules.md`, `worktree-rules.md`, `conventions.md`, `delivery-model.md`). Existing structure preserved per δ-i discipline.
- (e) All four READMEs cross-referenced consistently: each names the others as adjacent doc classes; cross-references use absolute-from-docs-root paths (`/02_specs/`, etc.).
- (f) No broken cross-references introduced. `grep -rn` sweep at end of each commit confirms no upstream docs reference removed/renamed anchors in the four touched READMEs.
- (g) `pnpm typecheck` clean before each commit.
- (h) `pnpm adr:lint` clean before each commit.
- (i) `pnpm adr:index --check` clean before each commit (no INDEX drift; this session does not touch ADRs).
- (j) Push-readiness gate: floor-only carve-out (formal criteria met).
- (k) All 3 commits independently revertable; commit boundaries align with the failure-mode-asymmetry partition (02/03/04 grouped; 01 isolated; closeout separate).
- (l) Friction-journal closeout entry inserted at top of `## Phase 2`, addressing locked decisions, observation-queue updates, carry-forwards, and brainstorm-time observations per Task 3 Step 2's structure.

---

## Push-readiness gate (floor-only carve-out, fourth invocation)

The floor-only carve-out's formal criteria, established at the halftime plans push (commit `ea22b76`):

> Floor-only is mechanically defensible for diffs containing zero migrations / zero services / zero integration tests / zero source files / zero test files.

Session 6's diff against these criteria:

| Criterion | Session 6 status |
|---|---|
| Zero DB migrations | ✓ no `apps/web/sql/` changes |
| Zero services | ✓ no `apps/web/src/services/` changes |
| Zero integration tests | ✓ no `apps/web/tests/integration/` changes |
| Zero source files | ✓ no `.ts`/`.tsx` changes |
| Zero test files | ✓ no `.test.ts` changes |

All five criteria met. Session 6's diff is mechanically docs-only (~150–250 lines net diff across four README rewrites); floor-only gate applies.

**N=4 invocation context.** Session 6's push will be the fourth floor-only invocation (after halftime plans push N=1, 5B brainstorm closeout push N=2, 5B execution push N=3 LIVE). N=4 with the formal-criteria-primary justification (not "brainstorm pushes are special") confirms the formal criteria operate uniformly across brainstorm-grade plan-and-closeout work AND execution-grade README-rewrite work. Codification of the carve-out itself defers to Session 7's natural substrate moment per substrate-now-enforcement-later — Session 6 uses the carve-out, does not codify it.

**Verification protocol per the floor-only carve-out:**
- `pnpm db:reset:clean` (clear accumulated dev DB state)
- `pnpm agent:validate` (floor-scope: typecheck + URL grep + 5 Category A floor tests; expect 26/26 GREEN)
- Full-suite `pnpm test` NOT invoked — would burn ~10 min producing no signal beyond floor-scope per the mechanical-non-impact argument.

---

## Stop conditions (keyed to scope-completion milestones)

Stop and report at each of these checkpoints, before proceeding to the next:

1. **Session start: verify 5B execution closeout state, before reading any Session 6 work.** Confirm:
   - HEAD references 5B execution closeout commit (or 5B execution merged into staging per branch sync).
   - `docs/01_prd/` contains the 9 feature specs migrated by 5B Layer 1 (not empty).
   - `docs/09_briefs/phase-0/` sub-buckets contain the 13 governance files migrated by 5B Layer 2 (including `ratification-packages/` populated with 6 D1–D6 packages).
   - `docs/01_prd/README.md` has the 3 invalid claims removed (no "ships empty in Phase 1.1" / "Expected first occupant" / "Deletion criterion" lines).
   - `pnpm typecheck`, `pnpm adr:lint`, `pnpm adr:index --check` all green.

   If any verification fails: halt. Do not land any Session 6 commits. Resolve at session start; if 5B execution introduced unexpected scope, escalate for plan revision before proceeding.

2. **After C1 (02/03/04 grouped rewrite) lands, before C2.** Confirm: three READMEs rewritten with doc-class openers, canonical axes articulated, canonical-source enumeration present; cross-reference grep-sweep clean; working tree clean.

3. **After C2 (01_prd full rewrite) lands, before floor-only verification.** Confirm: 01_prd/README.md rewritten with full structure (opener + canonical axis + WGH/WDNGH + cross-refs); cross-reference grep-sweep clean; working tree clean.

4. **After floor-only verification, before closeout commit.** Confirm: `pnpm db:reset:clean && pnpm agent:validate` reports 26/26 GREEN; `pnpm typecheck` clean.

5. **After closeout commit lands, before pushing.** Confirm push-readiness state per the floor-only gate criteria.

---

## Task 1: 02_specs / 03_architecture / 04_engineering rewrites (C1)

**Context:** Three READMEs share a failure mode (failed-backward — under-specifies present state by omitting canonical-source files named in `CLAUDE.md` as authoritative). All three share a work shape (content-completeness expansion preserving existing structure per δ-i discipline). Bundled into one commit because the work shape is uniform; blame-locality served by grouping where shape matches.

**Files modified:**
- `docs/02_specs/README.md` — content-completeness expansion.
- `docs/03_architecture/README.md` — content-completeness expansion.
- `docs/04_engineering/README.md` — content-completeness expansion.

- [ ] **Step 1: Read all three READMEs to confirm current bytes.**

```bash
cat docs/02_specs/README.md
cat docs/03_architecture/README.md
cat docs/04_engineering/README.md
```

Confirm current state matches expected pre-rewrite shape (existing "What goes / What does NOT go" structure; missing doc-class opener; canonical-source files unnamed).

- [ ] **Step 2: Rewrite `docs/02_specs/README.md`.**

Required content elements (executor refines prose):
- Opening line: `**Document class: specs.**` (followed by canonical-axis articulation in same paragraph).
- Canonical axis: system truth — post-ratification, enforcement-bearing rules. Single axis; the ledger-truth vs agent-governance distinction is a content grouping within the axis, not a second axis.
- File-presence enumeration covering: ledger truth (`ledger_truth_model.md`, `data_model.md`, `invariants.md`); agent governance (`agent_autonomy_model.md`, `intent_model.md`, `mutation_lifecycle.md`); meta (`glossary.md`, `taxonomy.md`).
- "What goes here / What does NOT go here" structure preserved (existing prose adapted, not replaced wholesale).
- Pre-ratification boundary explicit: name **both halves** of the seam — `09_briefs/specs/` (per ADR-0021) is the pre-ratification side; `02_specs/` is the post-ratification side. The seam is what makes the doc-class boundary coherent at review time; naming only the post-ratification half leaves the boundary ambiguous. Resist the temptation to define only `02_specs/`'s own side.
- Spec-without-enforcement rule preserved (existing content).
- Cross-references: `/07_governance/adr/`, `/03_architecture/`, `/09_briefs/`, `/09_briefs/specs/` (pre-ratification side).

- [ ] **Step 3: Rewrite `docs/03_architecture/README.md`.**

Required content elements:
- Opening line: `**Document class: architecture.**` (followed by canonical-axis articulation).
- Canonical axis: system design — how the pieces fit together. Decomposition surfaces (system, codebase, agent, phase) are content groupings within the axis.
- Canonical-source enumeration matching `CLAUDE.md`'s authoritative-source list: `folder-structure.md` (ADR-0020 ratified, source-tree architecture), `authority-gradient.md` (the four-layer authority framing), `phase_simplifications.md` (most important doc — explains why Phase 1 looks different from Phase 2).
- "What goes / What does NOT go" structure preserved.
- Cross-references: `/02_specs/`, `/04_engineering/`, `/09_briefs/`, `/07_governance/adr/`.

- [ ] **Step 4: Rewrite `docs/04_engineering/README.md`.**

Required content elements:
- Opening line: `**Document class: engineering.**` (followed by canonical-axis articulation).
- Canonical axis: implementation surface — git-clone-to-shipping. Sub-domains (setup, rules, concerns) are content groupings within the axis.
- Canonical-source enumeration matching `CLAUDE.md`'s authoritative-source list: `repo-rules.md` (repo shape, four-layer architecture), `worktree-rules.md` (when/where worktrees, per-worktree session-lock detail), `conventions.md` (branch naming, contribution rules), `delivery-model.md` (phase lifecycle, merge rules, branch sync, flag posture).
- "What goes / What does NOT go" structure preserved.
- Cross-references: `/03_architecture/`, `/02_specs/`, `/09_briefs/`, `/07_governance/adr/`.

- [ ] **Step 5: Cross-reference grep-sweep.**

```bash
grep -rn "/02_specs/" docs/ apps/web/src 2>&1 | grep -v "node_modules" | head -40
grep -rn "/03_architecture/" docs/ apps/web/src 2>&1 | grep -v "node_modules" | head -40
grep -rn "/04_engineering/" docs/ apps/web/src 2>&1 | grep -v "node_modules" | head -40
```

Expected: any inbound references to the touched READMEs use folder-level paths or section anchors that still exist post-rewrite. If a section anchor was renamed, update inbound references in the same commit (batch-edit discipline per Topic 3 lock).

- [ ] **Step 6: Verify pre-commit checks.**

```bash
pnpm typecheck
pnpm adr:lint
pnpm adr:index --check
```

All three clean.

- [ ] **Step 7: Commit C1.**

```bash
git add docs/02_specs/README.md docs/03_architecture/README.md docs/04_engineering/README.md
git commit -m "$(cat <<'EOF'
docs(round-2): rewrite 02_specs/ + 03_architecture/ + 04_engineering/ READMEs — doc-class openers + canonical-source enumeration

Three directory READMEs propagate the doc-class opener pattern
(`**Document class: <name>.**`) and articulate the one canonical
axis per ADR-0021's round-2 architectural principle. Each README
enumerates the canonical-source files CLAUDE.md names as
authoritative for that document class: 02_specs gains pre/post-
ratification boundary explicit; 03_architecture gains
folder-structure.md + authority-gradient.md references;
04_engineering gains repo-rules / worktree-rules / conventions /
delivery-model references.

Failed-backward fix: the prior READMEs were internally accurate
but under-specified — they omitted files that live in their
folders and that CLAUDE.md treats as authoritative. Existing
"What goes here / What does NOT go here" structure preserved per
δ-i discipline.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

**STOP at this checkpoint per Stop Condition 2.** Confirm: three READMEs rewritten; cross-reference grep-sweep clean; working tree clean.

---

## Task 2: 01_prd/README full rewrite (C2)

**Context:** 01_prd has a different failure mode (failed-forward — described future state that round-2 retired by populating the folder). 5B execution touched up the three structurally-invalid claims; Session 6 lands the full rewrite that adopts the structural pattern (doc-class opener + WGH/WDNGH framework) the other three READMEs already had. Isolated in its own commit because (a) failure mode is categorically distinct from the failed-backward triple, (b) work depends on 5B touchup baseline so isolating it constrains the 5B-dependency to a single commit, (c) blame-locality served by separating distinct work shapes.

**Files modified:**
- `docs/01_prd/README.md` — full rewrite, structural-pattern adoption.

- [ ] **Step 1: Read 01_prd/README to confirm post-5B-touchup state.**

```bash
cat docs/01_prd/README.md
```

Confirm: 3 invalid claims absent (no "ships empty" / "first occupant" / "deletion criterion"); folder is populated with 9 feature specs (verified at Stop Condition 1 already; this re-confirms post-C1 state hasn't drifted).

- [ ] **Step 2: Rewrite `docs/01_prd/README.md`.**

Required content elements:
- Opening line: `**Document class: PRDs.**` (followed by canonical-axis articulation).
- Canonical axis: feature-level intent — what features should do and why, separate from architecture (`/03_architecture/`) and execution (`/09_briefs/`).
- "What goes here / What does NOT go here" structure (parity with 02/03/04 — adopting the pattern this README previously lacked).
- Inventory framing for current 9 specs (no need to enumerate every file — round-2 amendment treats top-level folders as document classes, not file indexes; an `ls` is the inventory).
- Cross-references: `/00_product/` (product vision; the upstream class), `/02_specs/` (system truth), `/04_engineering/` (implementation), `/09_briefs/` (per-phase execution).
- No "ships empty" / "first occupant" / "deletion criterion" framings — these are structurally invalidated by Layer 1 and were removed by 5B touchup; the rewrite doesn't reintroduce them.
- The PRD-vs-feature-spec terminology distinction is acknowledged but not litigated — both terms exist; this folder holds feature-level intent under either name.

- [ ] **Step 3: Cross-reference grep-sweep.**

```bash
grep -rn "/01_prd/" docs/ apps/web/src 2>&1 | grep -v "node_modules" | head -40
```

Expected: inbound references survive the rewrite. If a prior anchor was relied on (e.g., a `#deletion-criterion` anchor) and is now removed, update inbound references in the same commit per batch-edit discipline.

- [ ] **Step 4: Verify pre-commit checks.**

```bash
pnpm typecheck
pnpm adr:lint
pnpm adr:index --check
```

All three clean.

- [ ] **Step 5: Commit C2.**

```bash
git add docs/01_prd/README.md
git commit -m "$(cat <<'EOF'
docs(round-2): rewrite 01_prd/README — structural-pattern adoption + doc-class opener

01_prd/README adopts the structural pattern the other three
directory READMEs already had: doc-class opener, canonical-axis
articulation, "What goes here / What does NOT go here" framework,
cross-references to adjacent doc classes. The 5B touchup removed
the three structurally-invalid claims (ships-empty / first-
occupant / deletion-criterion); this commit lands the full
rewrite that round-2's reorganization required.

Failed-forward fix: the prior README described a future-arrivals
state that never materialized as designed. Round-2 populated the
folder with 9 feature specs at 5B Layer 1; this rewrite makes the
README current-state-accurate and pattern-consistent with 02_specs,
03_architecture, 04_engineering.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

**STOP at this checkpoint per Stop Condition 3.** Confirm: 01_prd/README rewritten; cross-reference grep-sweep clean; working tree clean.

---

## Task 3: Floor-only verification + closeout commit + push (C3)

**Context:** Push-readiness gate per Topic 5 lock: floor-only carve-out, formal criteria as primary justification, N=4 fire. Verification protocol matches the carve-out's framing — floor-scope only, full-suite NOT invoked per the mechanical-non-impact argument.

- [ ] **Step 1: Floor-only verification protocol.**

```bash
pnpm db:reset:clean
pnpm agent:validate
pnpm typecheck
```

Expected:
- `pnpm db:reset:clean` completes (DB reset).
- `pnpm agent:validate` reports `Test Files 5 passed (5); Tests 26 passed (26)` (typecheck + URL grep + 5 floor tests).
- `pnpm typecheck` clean exit.

If any check fails, surface as finding before closeout.

**STOP at this checkpoint per Stop Condition 4.** Confirm: floor-only verification GREEN; ready for closeout.

- [ ] **Step 2: Draft and commit closeout friction-journal entry.**

Insert a new multi-paragraph bullet at the top of `## Phase 2` in `docs/07_governance/friction-journal.md`, above the existing topmost bullet (which is the 5B execution closeout entry).

Entry structure (closeout for Session 6 EXECUTION):

```markdown
- 2026-05-XX NOTE — Round-2 docs reorganization Session 6
  (four-README rewrites + doc-class pattern propagation) shipped.
  Two implementation commits per the failure-mode-asymmetry
  partition locked at Session 6 brainstorm + plan at
  `docs/07_governance/round-2/2026-05-09-session-6-plan.md`.

  Two implementation commits + closeout:
  - <C1 hash> (02/03/04 grouped rewrite): three READMEs propagate
    doc-class openers + canonical-axis articulation + canonical-
    source enumeration matching CLAUDE.md's authoritative-source
    list.
  - <C2 hash> (01_prd full rewrite): structural-pattern adoption
    (WGH/WDNGH framework + doc-class opener) layered on 5B's
    invalid-claim touchup.

  Acceptance criteria — all 11 implementation-side criteria satisfied
  (a-k per plan); criterion (l) closed by this entry.

  Pre-codification observation queue updates per Topic 4 lock
  (status-track at every closeout):
  - Tier 1 LIVE: floor-only push gate carve-out advances N=3 LIVE
    → N=4 LIVE this push. Codification position for Session 7
    strengthens further; formal-criteria-primary justification
    confirmed at first execution-grade work. Other Tier 1
    candidates (Turbo cache, count-level commit pattern) status
    unchanged.
  - Tier 2 (awaiting second fire): status reaffirmed; no
    elevations from Session 6 brainstorm or execution.
  - Tier 3 (N=1 awaiting recurrence): status reaffirmed.
  - Tier 4 (deferral cluster): status reaffirmed.
  - Tier 5 (reference exemplars): status reaffirmed.

  Brainstorm-time observations (Session 6 brainstorm surfaced
  these; not yet codified):
  - README failure-mode taxonomy: forward (described future state
    that never materialized) vs backward (under-specifies present
    state by omitting canonical contents). Surfaced as principled
    basis for the failure-mode-asymmetry commit-shape partition.
    Adjudication: lands as sub-pattern within the structural-
    pattern bucket created at 5B brainstorm; the bucket matures
    past single-instance status with this addition. Sub-pattern-
    within-bucket is a phenomenon distinct from new-bucket-
    creation; round-2's posture handles both.
  - Count-level commit pattern N=4 fire with count-of-3 (not 4):
    pattern holds at structural level (implementation-then-
    closeout); count varies. Recording as count-level variance
    within stable structural pattern rather than force-fitting to
    4+1 or treating as new pattern. Itself an instance of
    categorical-distinction-preservation (preserving pattern-at-
    structural-level from pattern-at-count-level) — second
    instance if counted; not adjudicating the count here.
  - Inter-session dependency mechanism: Session 6 plan introduced
    a structurally novel mechanism class — Stop Condition 1
    verifies prior session's execution closed cleanly before
    current session's commits land. New pattern observation;
    propagate forward as Tier 3 (N=1).

  Carry-forward handling per Topic 6 lock:
  - Queue-trajectory non-linearity: queue delta this brainstorm =
    +N (count of new observations added at brainstorm); per-
    brainstorm trajectory data point.
  - Methodology bucket inhabitant count at this closeout: <count>;
    soft sub-categorization threshold (10) reached / not reached.
  - Categorical-distinction-preservation meta-pattern: failure-
    mode taxonomy adjudication is the candidate addition this
    closeout (per brainstorm-time observation above).
  - Substrate-leverage phase: Session 6 brainstorm output ratio
    classified <inverted/non-inverted>; N=2 data point on the
    phase-transition observation.

  Push-readiness gate (per CLAUDE.md three-condition gate, floor-
  only carve-out path, fourth invocation):
  - Condition 1 (test-suite health): GREEN under floor-only path.
    pnpm db:reset:clean && pnpm agent:validate reports 26/26.
    Full-suite NOT invoked per the carve-out's mechanical-non-
    impact argument; doc-only diff (zero migrations / zero
    services / zero integration tests / zero source files / zero
    test files) cannot regress tests by construction.
    Formal-criteria-primary justification confirmed at execution-
    grade work for the first time.
  - Condition 2 (doc-sync): GREEN. Session 6's primary deliverable
    IS doc-sync work (four README rewrites consuming the briefs
    convention + ADR-0021 architectural principles); same
    category as 5A and 5B execution closeouts.
  - Condition 3 (governance closeout): this entry; carry-forwards
    captured per the brainstorm closeout's framing.

  Forward pointers:
  - Session 7 owns Tier 1 codification (3 LIVE candidates + V2
    ratification + DOCS_RESTRUCTURE_V2.md) per Topic 4 lock.
    Tier 2-5 are queue-resident, not Session-7-scoped.
  - Floor-only carve-out at N=4 LIVE goes to Session 7 for
    codification per the recursive substrate-now-enforcement-
    later application.
```

Replace `2026-05-XX` with execution date, `<C1 hash>` / `<C2 hash>` with actual SHAs, `+N` with actual queue delta, `<count>` with methodology bucket count, `<inverted/non-inverted>` with actual classification.

- [ ] **Step 3: Commit C3.**

```bash
git add docs/07_governance/friction-journal.md
git commit -m "$(cat <<'EOF'
docs(governance): friction-journal — round-2 Session 6 closeout

Records Session 6 four-README rewrites shipped: two
implementation commits (02/03/04 grouped rewrite; 01_prd full
rewrite) plus this closeout commit. Push-readiness gate evaluates
green under floor-only carve-out (fourth invocation; formal-
criteria-primary justification confirmed at execution-grade work).

Floor-only push gate carve-out advances N=3 LIVE → N=4 LIVE.
Codification position for Session 7 strengthens; carve-out fires
uniformly across brainstorm-grade plan-and-closeout work AND
execution-grade README-rewrite work. Codification deferred to
Session 7's natural substrate moment per recursive substrate-
now-enforcement-later.

README failure-mode taxonomy surfaced at Session 6 brainstorm:
forward (described future state) vs backward (under-specifies
present state). Lands as sub-pattern within structural-pattern
bucket (bucket matures past single-instance status). Inter-
session dependency mechanism for plans is new pattern observation
N=1.

Carry-forwards documented for Session 7: Tier 1 codification
scope (Turbo cache, floor-only at N=4, count-level commit
pattern); V2 ratification + DOCS_RESTRUCTURE_V2.md per Topic 4
lock; Tier 2-5 are queue-resident, not Session-7-scoped.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

**STOP at this checkpoint per Stop Condition 5.** Confirm push-readiness state per the floor-only gate criteria.

- [ ] **Step 4: Push.**

```bash
git push origin staging
```

Verify with `git log --oneline origin/staging..HEAD | wc -l` post-push: expect 0 (in sync).

---

## Self-Review Checklist (run before declaring plan complete)

1. **Spec coverage:** Each acceptance criterion (a)–(l) maps to a verification step in Task 1–3. ✓
2. **Placeholder scan:** Date placeholder (`2026-05-XX`), commit-hash placeholders (`<C1 hash>`, `<C2 hash>`), and queue-delta placeholder (`+N`), methodology bucket count placeholder (`<count>`), and inversion classification placeholder (`<inverted/non-inverted>`) are intentional execution-time fill-ins. No "TBD" / "TODO" / "implement later" patterns. ✓
3. **Type/identifier consistency:** Doc-class names (`PRDs`, `specs`, `architecture`, `engineering`) consistent across plan + commit messages + closeout entry. File paths consistent. ✓
4. **Failure-mode partition coverage:** C1 covers the failed-backward triple (02/03/04); C2 covers the failed-forward case (01); closeout covers the meta-observation. No README left ambiguous. ✓
5. **Stop conditions keyed to scope-completion milestones:** Stops use scope-completion language ("after C1 lands," "after C2 lands," "after floor-only verification") not commit numbers. Stop Condition 1 verifies inter-session dependency state per the structurally novel mechanism class — self-explanatory at execution time per the inter-session-dependency design rationale section. ✓
6. **Plan readability standalone:** A fresh-context execution session opening this plan can execute against it without conversation reload. The inter-session dependency mechanism, the failure-mode taxonomy framing, the floor-only carve-out N=4 framing, and the canonical-axis articulations for each README are all plan-internal substrate. ✓

---

## Notes for executor

- **Inter-session dependency mechanism (Stop Condition 1)** is structurally novel for round-2 plans; the design rationale section above explains the mechanism class. If 5B execution closed with deviations from its acceptance criteria, halt at session start and escalate before any Session 6 commits land.
- **Failure-mode taxonomy** (forward vs backward) is the principled basis for the C1/C2 partition. C1 = failed-backward triple (content-completeness expansion); C2 = failed-forward case (structural-pattern adoption + 5B-touchup baseline). The failure-mode framing is a brainstorm-time observation; closeout entry surfaces it.
- **Doc-class opener pattern** is the consumer-side instantiation of ADR-0021's "A folder encodes one canonical axis" principle. Each rewrite includes `**Document class: <name>.**` as the opening sentence pattern; the canonical axis articulation follows immediately. Don't include the literal "one canonical axis" phrase — the principle propagates, not the phrase.
- **δ-i preservation discipline** applies to 02/03/04: existing "What goes / What does NOT go" structure is preserved; rewrites add the doc-class opener + canonical-axis articulation + canonical-source enumeration ON TOP of existing prose, rather than replacing wholesale. 01_prd's full rewrite adopts the structure that 02/03/04 already had — δ-i applies in reverse (the structure is the discipline being preserved).
- **Floor-only carve-out N=4 invocation** is one of the closeout-entry-significant observations; capture explicitly in the friction-journal entry per Task 3 Step 2's structure. Codification of the carve-out itself defers to Session 7 — Session 6 uses, doesn't codify.
- **01_prd/README read timing.** Stop Condition 1 reads `01_prd/README.md` for verification (3 invalid claims absent). Task 2 Step 1 re-reads it for the rewrite work after C1 lands. Do not read `01_prd/README.md` during initial context loading or pre-Stop-1 exploration — reading before Stop 1 risks working from a pre-touchup baseline if 5B execution didn't land cleanly. The two reads in the plan are the only sanctioned reads of this file.
- **Closeout entry information density.** Task 3 Step 2's entry covers four discrete obligation clusters (Tier reaffirmation, brainstorm-time observations, 5B carry-forward handling, push-readiness gate per three-condition framing). This is the largest closeout-entry surface area round-2 has produced. If the entry's running prose starts blurring obligations together at write-time, consider explicit sub-headings per cluster. Writing-craft decision at write-time based on actual length; no template change required.
- **Working tree clean state expected post-execution** — no deferred work, no in-flight observations, no untracked files. Session 6 ships clean state to Session 7 brainstorm.
