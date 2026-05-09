# Session 5A: Layer 0 Substrate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship round-2 Session 5A — briefs convention substrate (3 sub-buckets: specs/, plans/, chunks/), `docs/superpowers/` elimination (4 file moves + friction-journal annotation + delete empty dir), ADR README pre-ratification-home update (parallel `<phase>/plans/` clause + ADR-0019-only stale-claim correction), and new phase-0/ + phase-5/ READMEs populated by the moves.

**Architecture:** 4 commits sequenced substrate-then-moves so file moves in Commit 3 land into structure that's already conventionally named.
- Commit 1 ships briefs convention substrate: `docs/09_briefs/README.md` rewrite + new `docs/09_briefs/_template.md`.
- Commit 2 ships ADR README update: pre-ratification-home language gains parallel `<phase>/plans/` clause; stale-claim about "ADRs 0011-0019" reframes to ADR-0019 only with three-sentence historical seam.
- Commit 3 ships `docs/superpowers/` elimination (high-blast-radius solo): 3 `git mv` + 1 `git add` at new path + friction-journal file-top path-note annotation + delete empty source dir. Per disposition matrix, most refs are δ-i-preserved (legacy ADRs, restructure-plan.md Phase 1.1 historical refs, closed-phase brief); only the friction-journal gets a new path-note blockquote (not silent rewrite).
- Commit 4 ships new phase-0/README.md and phase-5/README.md, populated from the new `_template.md` against directories that Commit 3's moves created.

**Tech Stack:** git mv, find, grep, the Edit tool for in-place doc revisions, the Write tool for new docs, bash.

**Acceptance criteria:**
- (a) `docs/superpowers/` directory absent post-Commit 3 (`ls docs/superpowers/` → "No such file or directory").
- (b) All 4 source files exist at new paths with content unchanged (verified by file size or first-line cmp).
- (c) Active-doc references to `docs/superpowers/` are zero post-arc (`grep -rn "docs/superpowers" --include="*.md" docs/` returns only friction-journal entries covered by the new path-note blockquote and δ-i-preserved references in legacy ADRs / restructure-plan.md historical migration descriptions).
- (d) ADR README's pre-ratification-home section now mentions both `<phase>/specs/` and `<phase>/plans/` and reframes ADR-history language accurately (ADR-0019 only as pre-existing instance, with three-sentence framing).
- (e) New `09_briefs/README.md` describes 3-sub-bucket convention with explicit deferral-to-consumer-evidence sentence and the "one canonical axis" one-liner ("**Document class: briefs.**").
- (f) `_template.md` exists at `docs/09_briefs/_template.md` with minimal phase-folder skeleton + closeout-artifacts inline + conventions.md cross-ref parenthetical.
- (g) `phase-0/README.md` and `phase-5/README.md` exist, each populated from `_template.md` with phase-specific content.
- (h) Comprehension test passes (Phase 3 Probe 4 style; runs at end of arc): a fresh contributor reading 09_briefs/README.md + _template.md + Profile (b) glosses can write a correct brief without reading existing briefs.
- (i) All 4 commits independently revertable.
- (j) Push-readiness gate green across all three conditions (no Condition 1 deviation; the test-hygiene fix arc closed it before this push).

---

## Task 1: Briefs convention substrate (Commit 1)

**Context:** Establishes the briefs convention with three sub-buckets (specs/, plans/, chunks/), explicit deferral-to-consumer-evidence sentence (matching the linter/generator deferral logic from the V1 amendment), and the "one canonical axis" one-liner per V1-amendment-locked decision #2. The convention is intentionally lightweight and flexible — sub-buckets without current consumers (artifacts/, working-docs/) trimmed per the audit during topic 1 brainstorm.

**Files:**
- Modify: `docs/09_briefs/README.md` (full rewrite; current content is 14 lines).
- Create: `docs/09_briefs/_template.md` (new file).

- [ ] **Step 1: Read the current `docs/09_briefs/README.md` to confirm starting state**

Run: `cat docs/09_briefs/README.md`

Expected: 14-line content describing the existing structure (CURRENT_STATE.md + phase folders).

- [ ] **Step 2: Rewrite `docs/09_briefs/README.md`**

Replace the entire file content with:

```markdown
# Briefs

**Document class: briefs.** Execution briefs and phase-specific
working documents. Phase folders organize by phase; sub-buckets
within each phase organize by document type.

## Convention

Each phase folder contains the sub-buckets the phase needs:

- `specs/`  — pre-ratification design specs (per ADR-0021).
- `plans/`  — multi-step execution plans.
- `chunks/` — mid-arc working briefs.

Phases use the subset that applies. Sub-buckets are added as their
consumers emerge; current convention ships with three because
three have current consumers. Future sub-buckets land when consumer
evidence forces the shape.

The same deferral logic applies to brief tooling — a linter and
index-generator (paralleling `scripts/adr/`) defer to N=3 brief
instances OR a friction trigger. Substrate-now-enforcement-later:
trim convention to actually-consumed surface; expansion follows
consumer evidence.

## Top-level structure

Top-level folders are phase folders or sibling-arc folders:

- `phase-0/` — Phase 0 governance arc work (D1-D6 ratification
  chain; ADR-0011-0019 substrate). Closed.
- `phase-1.1/`, `phase-1.2/`, `phase-1.3/`, `phase-1.5/`, `phase-2/` —
  Phase 1.x and Phase 2 work.
- `phase-5/` — Phase 5 (spend initiative) chunks. In progress.
- `post-mvp/` — sibling-arc work that surfaced post-MVP (e.g.,
  test-hygiene fix arc).

## Index

- `CURRENT_STATE.md` — where the project is right now.
- `_template.md` — phase-folder skeleton; copy and customize when
  creating a new phase folder.
- `phase-0/`, `phase-1.1/`, `phase-1.2/`, `phase-1.3/`, `phase-1.5/`,
  `phase-2/`, `phase-5/` — phase folders.
- `post-mvp/` — sibling-arc plans + briefs.
- `session-config-cleanup-0430-brief.md` — flat orphan-arc brief
  (legacy; pre-convention).

## Authoring

New briefs follow `_template.md` as a starting skeleton. Phase
folders are created on-demand; if a needed phase folder doesn't
exist, create it from the template and add it to the structure
above. AI agents may create new files in `09_briefs/[current-phase]/`
or relevant sub-bucket per the convention.
```

- [ ] **Step 3: Create `docs/09_briefs/_template.md`**

Write the template with the locked content:

```markdown
# Phase N — [phase title]

[1-paragraph phase summary: scope, dates, outcome at closure (or
"in progress" if still open).]

## Sub-buckets present

[List the sub-buckets actually used by this phase; remove unused
entries.]

- `specs/`  — [if present, 1-line phase-specific note]
- `plans/`  — [if present, 1-line phase-specific note]
- `chunks/` — [if present, 1-line phase-specific note]

## Closeout artifacts

[Inline links or short prose pointing at retrospective,
friction-journal entries, conventions earned (per
`04_engineering/conventions.md` "closeout artifacts route by
purpose" rule). No required shape; phase-by-phase judgment.]
```

- [ ] **Step 4: Verify file contents**

Run:
```bash
cat docs/09_briefs/README.md
cat docs/09_briefs/_template.md
```

Expected: both files render cleanly, no markdown syntax errors, "**Document class: briefs.**" one-liner present in README first paragraph.

- [ ] **Step 5: Commit**

```bash
git add docs/09_briefs/README.md docs/09_briefs/_template.md
git commit -m "$(cat <<'EOF'
docs(briefs): convention + _template — round-2 Session 5A Commit 1

Establishes the briefs convention with three sub-buckets
(specs/, plans/, chunks/) and explicit deferral-to-consumer-
evidence sentence. Trim from initial five-sub-bucket framing to
three driven by hidden-lines audit during topic 1 brainstorm —
artifacts/ and working-docs/ have zero current consumers and
were trimmed per substrate-now-enforcement-later.

09_briefs/README.md rewrite includes the "one canonical axis"
one-liner ("**Document class: briefs.**") per V1-amendment-locked
decision #2. _template.md instantiates the minimal phase-folder
skeleton with closeout artifacts inline (per conventions.md
"closeout artifacts route by purpose" rule).

Linter and index-generator tooling defers to N=3 brief instances
OR friction trigger per the same deferral logic.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: ADR README pre-ratification-home update (Commit 2)

**Context:** Two changes to `docs/07_governance/adr/README.md` § "Pre-ratification design specs" (lines 110-129):
- Add parallel `<phase>/plans/` clause for execution plans (sibling home to `<phase>/specs/`).
- Stale-claim correction: current text says "ADRs 0011-0019 ratified from design specs originally authored at the now-deprecated location `docs/superpowers/specs/`". Audit during 5A brainstorm confirmed only ADR-0019's spec exists; ADRs 0011-0018 predate the discipline ADR-0021 introduced. Reframe with three-sentence historical seam framing per operator guidance.

**Files:**
- Modify: `docs/07_governance/adr/README.md:110-129` (§ Pre-ratification design specs).

- [ ] **Step 1: Read the current section to confirm byte-anchors**

Run: `sed -n '108,132p' docs/07_governance/adr/README.md`

Expected: confirm lines 110 (`## Pre-ratification design specs`) through 129 (the trailing `(Session 7) for the canonical migration record.` line).

- [ ] **Step 2: Replace § Pre-ratification design specs**

Use Edit tool with the full 110-129 block as `old_string`. The replacement adds the plans/ clause and reframes the ADR-0019 history.

`old_string`:
```
## Pre-ratification design specs

ADRs ratify from external design specs authored during phase
brainstorming. Pre-ratification specs live at
`docs/09_briefs/<phase>/specs/`, filed under the phase folder
during which the spec was authored. Filename pattern:
`YYYY-MM-DD-adr-NNNN-<slug>-design.md`.

The lifecycle is: brainstorm → design spec at
`<phase>/specs/<file>` → ratification package authored → ADR
ratified → design spec preserved as historical reference (the
ADR itself is the canonical authority post-ratification).

Phase 0 (governance arc 2026-05-03 to 2026-05-04) was the first
phase to use this pattern; ADRs 0011–0019 ratified from design
specs originally authored at the now-deprecated location
`docs/superpowers/specs/`. Migration to the per-phase location
happens during round-2 docs reorganization Session 5; see
`docs/07_governance/DOCS_RESTRUCTURE_V2.md` (Session 7) for the
canonical migration record.
```

`new_string`:
```
## Pre-ratification design specs

ADRs ratify from external design specs authored during phase
brainstorming. Pre-ratification specs live at
`docs/09_briefs/<phase>/specs/`, filed under the phase folder
during which the spec was authored. Filename pattern:
`YYYY-MM-DD-adr-NNNN-<slug>-design.md`.

Pre-ratification execution plans (multi-step plans authored
during the same brainstorming sessions) live at
`docs/09_briefs/<phase>/plans/`, sibling home to
`<phase>/specs/`. The two sub-buckets share the per-phase
location pattern.

The lifecycle is: brainstorm → design spec at
`<phase>/specs/<file>` (and execution plan at
`<phase>/plans/<file>` if applicable) → ratification package
authored → ADR ratified → design spec preserved as historical
reference (the ADR itself is the canonical authority post-
ratification).

ADR-0021 introduced the pre-ratification-design-spec discipline
at round-2 Session 3. ADRs 0001-0018 predate this convention
and were ratified without separate pre-ratification specs.
ADR-0019 is the single pre-existing instance under the
convention; its design spec was originally authored at the
now-deprecated location `docs/superpowers/specs/`, migrated to
`docs/09_briefs/phase-0/specs/` in round-2 Session 5A (see
`docs/restructure-plan.md` Amendments section for migration
provenance and `docs/07_governance/DOCS_RESTRUCTURE_V2.md`
when ratified at Session 7).
```

- [ ] **Step 3: Run ADR linter to confirm README still passes**

Run: `pnpm adr:lint`

Expected: clean exit. The lint target is ADR frontmatter; the README rewrite doesn't affect linted ADRs but a regression here would surface.

- [ ] **Step 4: Run `pnpm adr:index --check` to confirm index still in sync**

Run: `pnpm adr:index --check`

Expected: `adr:index — no changes (N ADRs scanned).` exit 0. The README rewrite is to a hand-edited section, not the generated-by-phase block; index check should pass.

- [ ] **Step 5: Commit**

```bash
git add docs/07_governance/adr/README.md
git commit -m "$(cat <<'EOF'
docs(adr): README pre-ratification-home — parallel plans/ + ADR-0019-only fix

Two changes to § Pre-ratification design specs:

1. Adds parallel `<phase>/plans/` clause as sibling home to
   `<phase>/specs/`. Establishes the briefs convention's
   plans/ sub-bucket as a pre-ratification artifact home in
   the ADR README, complementing ADR-0021's specs/ home
   ratification.

2. Reframes the historical claim about ADRs 0011-0019:
   ADR-0021 introduced the pre-ratification-design-spec
   discipline at round-2 Session 3. ADRs 0001-0018 predate
   this convention and were ratified without separate
   pre-ratification specs. ADR-0019 is the single pre-existing
   instance under the convention. Audit during 5A brainstorm
   confirmed only the ADR-0019 spec exists at
   docs/superpowers/specs/; ADRs 0011-0018 specs do not exist.

Migration of ADR-0019's spec to docs/09_briefs/phase-0/specs/
ships in Commit 3 of this session.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: `docs/superpowers/` elimination (Commit 3, high-blast-radius solo)

**Context:** Eliminates `docs/superpowers/` via 3 `git mv` operations + 1 `git add` at new path (the deliberately-untracked chunk B5-1 plan), adds a new file-top path-note blockquote to friction-journal.md per the friction-journal-is-history rule, and deletes the now-empty source directory. Per the disposition matrix derived during 5A brainstorm:
- Active-doc references to `docs/superpowers/` already absorbed by Commit 1 (09_briefs/README.md) and Commit 2 (ADR README).
- Friction-journal references (5 sites at lines 204, 209, 551, 553, 565) preserved verbatim per friction-journal-is-history rule; covered by new file-top path-note blockquote.
- Legacy ADR references (ADR-0021 at lines 103, 217, 507; ADR-0019 at line 40) preserved per δ-i preservation discipline (forward-only convention).
- restructure-plan.md references (lines 361, 723, 724, 744) preserved per δ-i preservation — they describe the Phase 1.1 historical migration that produced `docs/09_briefs/phase-1.1/superpowers/`, which is unrelated to 5A's elimination of `docs/superpowers/`.
- Closed-phase brief reference (`docs/09_briefs/phase-1.1/superpowers/plans/2026-04-12-phase-1.1-closeout.md` line 1418) preserved per δ-i (the ref points to the file's own pre-migration self).
- Topic 4 plan reference (`docs/09_briefs/post-mvp/cross-org-rls-fixture-uuid-flake-plan.md` line 569) preserved — describes pre-5A state at fix-arc execution time.

So no silent rewrites of legacy references; only file moves + friction-journal annotation + dir delete.

**Files:**
- Move (`git mv`): `docs/superpowers/specs/2026-05-04-adr-0019-confidence-calibration-policy-design.md` → `docs/09_briefs/phase-0/specs/2026-05-04-adr-0019-confidence-calibration-policy-design.md`.
- Move (`git mv`): `docs/superpowers/plans/2026-05-04-c11-drafting-and-d6-ratification-execution.md` → `docs/09_briefs/phase-0/plans/2026-05-04-c11-drafting-and-d6-ratification-execution.md`.
- Move (`git mv`): `docs/superpowers/plans/2026-05-04-d5-ratification-execution.md` → `docs/09_briefs/phase-0/plans/2026-05-04-d5-ratification-execution.md`.
- Add (`git add` at new path): `docs/09_briefs/phase-5/chunks/2026-05-07-phase-5-chunk-b5-1-session-1.md` (was deliberately untracked at `docs/superpowers/plans/2026-05-07-phase-5-chunk-b5-1-session-1.md`).
- Modify: `docs/07_governance/friction-journal.md` (add new file-top path-note blockquote after the existing ec-2 path-note at lines 10-17).
- Delete: `docs/superpowers/` directory after all moves.

- [ ] **Step 1: Create target directories**

Run:
```bash
mkdir -p docs/09_briefs/phase-0/specs docs/09_briefs/phase-0/plans docs/09_briefs/phase-5/chunks
```

Expected: directories created (or already exist if a prior step partially ran). Verify: `ls -d docs/09_briefs/phase-0/specs docs/09_briefs/phase-0/plans docs/09_briefs/phase-5/chunks`.

- [ ] **Step 2: Move ADR-0019 design spec**

Run:
```bash
git mv docs/superpowers/specs/2026-05-04-adr-0019-confidence-calibration-policy-design.md \
       docs/09_briefs/phase-0/specs/2026-05-04-adr-0019-confidence-calibration-policy-design.md
```

Expected: git records the move (renames, not delete+add). Verify with `git status --short`: `R  docs/superpowers/specs/...  ->  docs/09_briefs/phase-0/specs/...`.

- [ ] **Step 3: Move D5 ratification execution plan**

Run:
```bash
git mv docs/superpowers/plans/2026-05-04-d5-ratification-execution.md \
       docs/09_briefs/phase-0/plans/2026-05-04-d5-ratification-execution.md
```

Expected: similar `R` record in git status.

- [ ] **Step 4: Move C11/D6 ratification execution plan**

Run:
```bash
git mv docs/superpowers/plans/2026-05-04-c11-drafting-and-d6-ratification-execution.md \
       docs/09_briefs/phase-0/plans/2026-05-04-c11-drafting-and-d6-ratification-execution.md
```

Expected: similar `R` record.

- [ ] **Step 5: Move chunk B5-1 plan via mv (filesystem) + git add at new path**

The chunk B5-1 plan is currently UNTRACKED at the source path (per commit `1aff855` deliberate untracked state). Use `mv` (not `git mv`) for the filesystem move since git can't track a rename of an untracked file. Then `git add` at the destination.

Run:
```bash
mv docs/superpowers/plans/2026-05-07-phase-5-chunk-b5-1-session-1.md \
   docs/09_briefs/phase-5/chunks/2026-05-07-phase-5-chunk-b5-1-session-1.md
git add docs/09_briefs/phase-5/chunks/2026-05-07-phase-5-chunk-b5-1-session-1.md
```

Expected: `git status --short` shows `A  docs/09_briefs/phase-5/chunks/2026-05-07-phase-5-chunk-b5-1-session-1.md`. The previously-untracked source path is now gone (mv removed it).

- [ ] **Step 6: Verify `docs/superpowers/` is empty**

Run: `ls -la docs/superpowers/ docs/superpowers/plans/ docs/superpowers/specs/`

Expected: directories exist but are empty (only `.` and `..`). If anything remains, investigate before deletion — the source directory should have no other contents.

- [ ] **Step 7: Delete the empty `docs/superpowers/` tree**

Run: `rmdir docs/superpowers/plans docs/superpowers/specs docs/superpowers`

Expected: each rmdir succeeds (rmdir refuses if non-empty; if it fails, recheck step 6). After all three, `ls docs/superpowers 2>&1` reports "No such file or directory".

- [ ] **Step 8: Add new path-note blockquote to friction-journal**

The existing file-top blockquote at lines 10-17 covers the ec-2 path note from Session 4. Add a sibling blockquote immediately after, covering the docs/superpowers/ elimination from 5A.

Use Edit tool. Find the existing blockquote ending at line 17 (`> commit-level provenance.`) and append a new blockquote.

`old_string`:
```
> See the 2026-05-08 NOTE entry below for the migration's
> commit-level provenance.

## Phase 2
```

`new_string`:
```
> See the 2026-05-08 NOTE entry below for the migration's
> commit-level provenance.

> **Path note 2026-05-XX (round-2 docs reorganization Session 5A
> docs/superpowers/ elimination):** entries below referencing
> `docs/superpowers/specs/` should be read as referring to
> `docs/09_briefs/phase-0/specs/` post-move. Entries referencing
> `docs/superpowers/plans/2026-05-04-*` should be read as
> referring to `docs/09_briefs/phase-0/plans/`. The single
> entry referencing `docs/superpowers/plans/2026-05-07-phase-5-chunk-b5-1-session-1.md`
> should be read as referring to
> `docs/09_briefs/phase-5/chunks/2026-05-07-phase-5-chunk-b5-1-session-1.md`.
> File contents are unchanged; only locations moved. References
> preserved verbatim per the friction-journal-is-history rule
> (entries record what was true at write time). See the 2026-05-XX
> NOTE entry below (Session 5A closeout) for the migration's
> commit-level provenance.

## Phase 2
```

Replace `2026-05-XX` with the actual execution date when this commit lands.

- [ ] **Step 9: Verify the path-note blockquote rendered correctly**

Run: `sed -n '1,40p' docs/07_governance/friction-journal.md`

Expected: two file-top blockquotes (one for ec-2, one for docs/superpowers/) followed by `## Phase 2`. The new blockquote is fully formed without truncation.

- [ ] **Step 10: Verify no broken active-doc references**

Run:
```bash
grep -rn "docs/superpowers" --include="*.md" docs/ 2>/dev/null | grep -v "^docs/superpowers/"
```

Expected: only references in:
- `docs/restructure-plan.md` (Phase 1.1 historical migration descriptions, δ-i-preserved)
- `docs/07_governance/friction-journal.md` (covered by new path-note blockquote)
- `docs/07_governance/adr/0021-adr-frontmatter-and-tooling.md` (post-ratification, δ-i-preserved)
- `docs/07_governance/adr/0019-confidence-calibration-policy.md` (post-ratification, δ-i-preserved)
- `docs/09_briefs/phase-1.1/superpowers/plans/2026-04-12-phase-1.1-closeout.md` (closed-phase brief, δ-i-preserved)
- `docs/09_briefs/post-mvp/cross-org-rls-fixture-uuid-flake-plan.md` (describes pre-5A state at fix-arc execution time)

NO references in: docs/07_governance/adr/README.md (rewritten in Commit 2), docs/09_briefs/README.md (rewritten in Commit 1).

- [ ] **Step 11: Run typecheck and `pnpm adr:validate` to confirm no regression**

Run:
```bash
pnpm typecheck
pnpm adr:lint
pnpm adr:index --check
```

Expected: all three exit clean. If `adr:index --check` reports content change, regenerate via `pnpm adr:index` and recheck.

- [ ] **Step 12: Commit**

```bash
git add docs/07_governance/friction-journal.md
git commit -m "$(cat <<'EOF'
docs(briefs): docs/superpowers/ elimination — round-2 Session 5A Commit 3

High-blast-radius solo commit per ec-2-prompt-set-move precedent
(25 refs total to docs/superpowers/, slightly above the 24-ref
threshold that justified solo-commit treatment at Session 4).

Four file moves to new convention paths:
- docs/superpowers/specs/2026-05-04-adr-0019-...-design.md ->
  docs/09_briefs/phase-0/specs/ (git mv)
- docs/superpowers/plans/2026-05-04-d5-...-execution.md ->
  docs/09_briefs/phase-0/plans/ (git mv)
- docs/superpowers/plans/2026-05-04-c11-...-d6-...-execution.md ->
  docs/09_briefs/phase-0/plans/ (git mv)
- docs/superpowers/plans/2026-05-07-phase-5-chunk-b5-1-session-1.md ->
  docs/09_briefs/phase-5/chunks/ (mv + git add; was untracked
  per commit 1aff855)

Reference disposition (per disposition matrix derived during
5A brainstorm):
- Active-doc refs in docs/07_governance/adr/README.md and
  docs/09_briefs/README.md absorbed by Commits 1 and 2.
- friction-journal.md (5 entry refs): preserved verbatim per
  friction-journal-is-history rule; new file-top path-note
  blockquote added (sibling to existing ec-2 path-note at
  lines 10-17).
- ADR-0021 (3 refs at lines 103, 217, 507): preserved per
  forward-only convention (post-ratification ADR).
- ADR-0019 (1 ref at line 40): preserved per delta-i
  preservation discipline (post-ratification ADR; design spec
  pointer remains historical).
- docs/restructure-plan.md (4 refs at lines 361, 723, 724,
  744): preserved per delta-i preservation discipline (Phase
  1.1 historical migration descriptions; describe a different
  migration than 5A's).
- docs/09_briefs/phase-1.1/superpowers/plans/2026-04-12-phase-1.1-closeout.md
  (1 ref at line 1418): preserved per delta-i (ref to file's
  own pre-migration self).
- docs/09_briefs/post-mvp/cross-org-rls-fixture-uuid-flake-plan.md
  (1 ref at line 569): preserved (describes pre-5A state at
  fix-arc execution time).

docs/superpowers/ source directory deleted after moves.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: New phase READMEs (Commit 4)

**Context:** Creates `docs/09_briefs/phase-0/README.md` and `docs/09_briefs/phase-5/README.md`, populated from the new `_template.md` (created in Commit 1). Both READMEs land into directories that Commit 3's moves populated, so the convention is demonstrated on disk in a populated state.

**Files:**
- Create: `docs/09_briefs/phase-0/README.md`.
- Create: `docs/09_briefs/phase-5/README.md`.

- [ ] **Step 1: Write `docs/09_briefs/phase-0/README.md`**

Write content:

```markdown
# Phase 0 — Governance Arc

Sessions 2A-2F (2026-05-03 to 2026-05-04) ratified ADRs 0011-0019
and established the D1-D6 ratification chain. Closed.

## Sub-buckets present

- `specs/` — pre-ratification design spec for ADR-0019 (the
  single pre-existing instance under the ADR-0021 convention;
  ADRs 0011-0018 predate the discipline and were ratified
  without separate pre-ratification specs).
- `plans/` — D5 ratification execution plan + C11/D6
  ratification execution plan.

## Closeout artifacts

Friction-journal entries spanning Sessions 2A-2F live under
their respective date headers in
`docs/07_governance/friction-journal.md`. Closure-verification
brief and other Phase 0 governance docs migrate to this folder
in Session 5B (Layer 2 of round-2 docs reorganization).
```

- [ ] **Step 2: Write `docs/09_briefs/phase-5/README.md`**

Write content:

```markdown
# Phase 5 — Spend Initiative

Vendor prepayment lifecycle slice and downstream spend-domain
implementation arcs. In progress.

## Sub-buckets present

- `chunks/` — mid-arc working briefs for in-flight chunks
  (currently: chunk B5-1 vendor prepayment lifecycle slice).

## Closeout artifacts

(Phase 5 is in progress; closeout artifacts populate at phase
closure.)
```

- [ ] **Step 3: Verify both files render correctly**

Run:
```bash
cat docs/09_briefs/phase-0/README.md
cat docs/09_briefs/phase-5/README.md
```

Expected: both files render cleanly with phase-specific content matching the template's structure.

- [ ] **Step 4: Run comprehension test (Phase 3 Probe 4 style)**

Read `docs/09_briefs/README.md` + `docs/09_briefs/_template.md` + the Profile (b) glosses (in ADR-0021's "Glossary for outside readers" section). With nothing else, attempt to:
- Identify the three sub-buckets and their purposes.
- Describe what `_template.md` is for and when to use it.
- Explain how a new phase folder gets created and populated.
- Identify the canonical axis of the briefs document class.

If gaps emerge in the comprehension test, the convention is incomplete — patch in the SAME commit that ships the convention (Commit 1) rather than later.

- [ ] **Step 5: Commit**

```bash
git add docs/09_briefs/phase-0/README.md docs/09_briefs/phase-5/README.md
git commit -m "$(cat <<'EOF'
docs(briefs): phase-0/ + phase-5/ READMEs — round-2 Session 5A Commit 4

Creates the two new phase folders' READMEs, instantiated from
docs/09_briefs/_template.md (shipped in Commit 1). Both
populated by Commit 3's moves:

- phase-0/ contains specs/ (ADR-0019 design spec) and plans/
  (D5 + C11/D6 ratification execution plans).
- phase-5/ contains chunks/ (chunk B5-1 vendor prepayment
  lifecycle slice plan).

Phase 0 closeout artifact references (closure-verification
brief, etc.) migrate in Session 5B (Layer 2). Phase 5 is in
progress; closeout artifacts populate at phase closure.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Push-readiness verification + closeout friction-journal entry + push

**Context:** 5A's push goes under green Condition 1 (the test-hygiene fix arc closed the deviation in its preceding push). Friction-journal closeout entry follows the round-2 bullet pattern under `## Phase 2`, inserted at the top of the section above existing Session 4 / halftime / fix-arc-closeout bullets.

**Files:**
- Modify: `docs/07_governance/friction-journal.md` (add new top-of-Phase-2 bullet for 5A closeout).

- [ ] **Step 1: Pre-push sanity sequence**

Run from working-branch HEAD:
```bash
git log --oneline origin/staging..HEAD | wc -l
git status --short
pnpm db:reset:clean
pnpm agent:validate
pnpm typecheck
pnpm test 2>&1 | tail -10
```

Expected:
- `git log` shows 4 commits ahead of origin/staging (the four 5A commits).
- `git status --short` clean except for the path-note edit on friction-journal.md (about to be committed in Step 3).
- `pnpm agent:validate`: 26/26 GREEN.
- `pnpm typecheck`: clean exit.
- `pnpm test`: 137 passed (137); 645 passed | 20 skipped (665) — full suite GREEN. (No deviation; fix arc closed it.)

- [ ] **Step 2: Comprehension test (final, on the live convention substrate)**

Re-run the Phase 3 Probe 4 comprehension test from Task 4 Step 4. Reading 09_briefs/README.md + _template.md + Profile (b) glosses + the new phase-0/README.md and phase-5/README.md as exemplars, can a fresh contributor:
- Write a correct brief for a hypothetical new phase from scratch?
- Identify which sub-bucket a particular artifact belongs in?
- Cite the deferral-to-consumer-evidence principle?

Log any gaps found. If gaps emerge, patch in a Commit 5 (or amend Commit 1 if it makes more sense and the operator approves amend per CLAUDE.md amend exception rule).

- [ ] **Step 3: Append 5A closeout friction-journal entry**

Insert a new multi-paragraph bullet at the top of `## Phase 2` (above existing entries). Match the round-2 bullet pattern.

Use Edit tool. `old_string` anchors to current top of `## Phase 2`:

```
## Phase 2

- 2026-05-XX NOTE — Test-hygiene fix arc shipped (sibling-of-round-2,
```

(Replace `2026-05-XX` with the date from the fix-arc closeout entry, which lands before this commit.)

`new_string` inserts the 5A closeout above:

```
## Phase 2

- 2026-05-XX NOTE — Round-2 docs reorganization Session 5A
  (Layer 0 substrate) shipped. Four tracked commits per the
  substrate-then-moves sequence locked at topic 1 brainstorm:

  - Commit 1: docs(briefs): convention + _template — three
    sub-buckets (specs/, plans/, chunks/) with explicit
    deferral-to-consumer-evidence sentence; "**Document class:
    briefs.**" one-liner per V1-amendment-locked decision #2;
    minimal _template.md with closeout-artifacts inline.
  - Commit 2: docs(adr): README pre-ratification-home —
    parallel <phase>/plans/ clause + ADR-0019-only stale-claim
    correction (three-sentence historical seam framing).
  - Commit 3: docs(briefs): docs/superpowers/ elimination —
    high-blast-radius solo. 4 file moves (3 git mv + 1 git
    add at new path for the deliberately-untracked chunk B5-1
    plan); friction-journal file-top path-note blockquote
    added; legacy ADRs / restructure-plan.md / closed-phase
    brief / topic 4 plan refs preserved per delta-i / forward-
    only / friction-journal-is-history disciplines.
  - Commit 4: docs(briefs): phase-0/ + phase-5/ READMEs —
    instantiated from _template.md against directories
    Commit 3 populated.

  Carry-forwards into Sessions 5B / 6 / 7:
  - 01_prd/README.md needs full rewrite (audit during 5A
    brainstorm flagged its current "ships empty in Phase 1.1"
    framing as structurally incompatible with Layer 1 landing
    feature specs). Lands in Session 6 as a 5th README rewrite
    outside the locked four (09_briefs in 5A; 02_specs +
    03_architecture + 04_engineering in Session 6).
  - Phase-0 closure-verification brief and related governance
    docs in phase-2/2026-05-04-* migrate to phase-0/ in
    Session 5B (Layer 2).
  - 10-or-so feature specs in phase-2/ (excluding governance
    docs and date-prefixed governance entries) migrate to
    01_prd/ in Session 5B (Layer 1). Filter against 17
    candidates per audit during topic 1 brainstorm.

  Substrate observation (not codified): linter/generator
  deferral (V1-amendment-locked) and convention-shape deferral
  (5A audit-driven trim from 5 sub-buckets to 3) share the
  same logic — "trim now to actually-consumed surface;
  expansion follows consumer evidence." When two pieces of
  substrate share the same deferral logic, that logic is
  starting to look like an organizing principle of round-2's
  governance posture. N=2 (linter/generator + convention
  shape) but cross-substrate, not cross-arc — codification
  waits for cross-arc evidence.

  Push-readiness gate (per CLAUDE.md three-condition gate):
  - Condition 1 (test-suite health): GREEN. Full suite
    137/137 + 645 passed / 20 skipped (665). No deviation
    (test-hygiene fix arc closed the Sessions-3/4/halftime
    carry in its preceding push).
  - Condition 2 (doc-sync): four artifacts internally
    consistent; convention substrate (09_briefs/README,
    _template) <-> ADR README parallel-plans clause <-> phase
    READMEs <-> friction-journal path-note blockquote all
    cross-reference cleanly. No types.ts regen needed.
  - Condition 3 (governance closeout): this entry; no
    retrospective needed (mid-arc; round-2 retrospective at
    Session 7 V1->V2 ratification); shared-deferral-logic
    observation surfaced as carry-forward, not codified
    (N=2, cross-substrate not cross-arc).

  Forward pointers:
  - Session 5B brainstorms after this push lands; 5B will
    consume the substrate this session ships (Layer 1 feature
    specs migration to 01_prd/; Layer 2 phase-0 governance
    migration to phase-0/).
  - 01_prd/README.md rewrite carry-forward identified above.
  - Comprehension test (Phase 3 Probe 4 style) results: [fill
    in gaps surfaced or "no gaps found" at execution time].

- 2026-05-XX NOTE — Test-hygiene fix arc shipped (sibling-of-round-2,
```

Replace each `2026-05-XX` with the actual execution date when this commit lands. The trailing "Test-hygiene fix arc shipped" line is the existing fix-arc bullet that this entry inserts above; preserve it intact.

- [ ] **Step 4: Commit closeout entry**

```bash
git add docs/07_governance/friction-journal.md
git commit -m "$(cat <<'EOF'
docs(governance): friction-journal — round-2 Session 5A closeout

Records 5A Layer 0 substrate shipped: 4 tracked commits
(briefs convention + _template; ADR README pre-ratification
update; docs/superpowers/ elimination; phase-0/ + phase-5/
READMEs). Push-readiness gate evaluates green across all
three conditions; no deviation needed.

Carry-forwards documented for 5B (Layer 1+2 consumers) and
Session 6 (01_prd/ rewrite as 5th README outside the locked
four). Shared-deferral-logic observation (N=2 cross-substrate)
surfaced as not-codified carry-forward.

Comprehension test (Phase 3 Probe 4 style) results captured
in the entry body.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: Push**

```bash
git push origin staging
```

Expected: 5 commits shipped (4 5A + 1 closeout). `staging -> staging` confirms.

- [ ] **Step 6: Post-push verification**

```bash
git log --oneline origin/staging..HEAD | wc -l
git log --oneline -7
```

Expected: `0` (in sync) and recent log shows the five 5A commits at top, preceded by the four fix-arc commits, preceded by the halftime + Session 4 closeout work.

---

## Self-Review Checklist

1. **Spec coverage:** Each acceptance criterion (a)–(j) maps to verification: (a) Step 7 of Task 3; (b) Step 10 of Task 3; (c) Step 10 of Task 3; (d) Step 4 of Task 2; (e) Step 4 of Task 1; (f) Step 4 of Task 1; (g) Step 3 of Task 4; (h) Step 4 of Task 4 + Step 2 of Task 5; (i) implicit (4 commits isolated); (j) Step 1 of Task 5. ✓
2. **Placeholder scan:** Date placeholders (`2026-05-XX`) intentional execution-time fill-ins (4 sites). No "TBD" / "implement later" / "TODO" patterns. The closeout entry's "[fill in gaps surfaced or 'no gaps found']" is intentional — execution-time data. ✓
3. **Type/identifier consistency:** "Document class: briefs" one-liner consistent across README rewrite and commit message. Sub-bucket names (specs/, plans/, chunks/) consistent across Task 1, ADR README rewrite, phase-0/README, phase-5/README. ✓
4. **Disposition matrix coverage:** Each ref site enumerated by Explore is covered by an explicit disposition (rewrite / annotate / preserve). ✓

---

## Notes for executor

- **Substrate-then-moves order is load-bearing.** Don't reorder commits (e.g., move file moves before convention) — Commit 3's file moves land into convention substrate that Commits 1+2 establish; reversing the order ships file moves before there's a convention to move into.
- **Friction-journal annotation is critical.** The path-note blockquote at Step 8 of Task 3 is what makes the friction-journal-is-history rule work — without it, future readers hit broken `docs/superpowers/` references in journal entries with no signpost. Don't skip this step.
- **δ-i preservation discipline applies broadly.** Every reference NOT explicitly listed in Commits 1+2's rewrite scope OR Commit 3's annotation scope is preserved verbatim. The disposition matrix in Commit 3's commit message documents the discipline; future readers should be able to derive the rule from the matrix.
- **Comprehension test has two checkpoints** (Task 4 Step 4 mid-arc + Task 5 Step 2 final). The mid-arc check uses spec-only inputs; the final check uses spec + populated phase READMEs as exemplars. Both should pass before the closeout entry is written.
- **Date placeholder discipline.** Four `2026-05-XX` placeholders need execution-time fills. Replace each before committing; don't ship `2026-05-XX` literal in any artifact.
- **5B brainstorm is downstream.** This plan does NOT include Layer 1 (feature specs to 01_prd/) or Layer 2 (phase-0 governance migration). 5B brainstorm runs after this push lands and consumes 5A's substrate.
