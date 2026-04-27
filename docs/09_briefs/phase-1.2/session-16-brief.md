# Session 16 — Friction-Journal Split + INDEX.md Update

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the Documentation Routing convention (ratified at 5b02474) to the existing `friction-journal.md`. Move closed-phase sections to `friction-journal/phase-X.md` archive files. Stub absorbed long-prose subsections as one-line pointers to retrospectives. Rewrite `conventions.md` citations that point at archived/absorbed subsections. Open the active `friction-journal.md` fresh for Phase 2. Fold INDEX.md update into the same commit because the split creates the new directory structure INDEX needs to point at.

**Architecture:** Pure documentation commit. One file moved (`friction-journal.md` → `friction-journal/`), three new archive files created (`phase-1.1.md`, `phase-1.5.md`, `phase-1.2.md`), one new active file (`friction-journal.md` reopened minimal-shape), one citation-rewrite pass over `conventions.md`, one INDEX.md update. No code, no tooling.

**Tech Stack:** Markdown only. Pre-commit session-init script. Standard git workflow.

---

**Anchor (parent) SHA:** `5b0247453dd15047d873a77d2ba7d906fa528335` — the SHA the brief was drafted against. WSL must verify HEAD's parent matches this anchor SHA.

**Upstream authority:** Convention "Documentation Routing" at `docs/04_engineering/conventions.md`, ratified at commit `5b02474`. This session is the first concrete application of that convention's archival rule.

---

## Session label
`S16-friction-journal-split` — continues the S-series; matches house labeling convention.

## Hard constraints (do not violate)

- **Section letters preserve.** Sections (a) through (p) and the H2 Vercel-deploy-fix block in the current `friction-journal.md` keep their original lettering in the archive. Convention #8 citations to "section (p)", "section (o)", etc. must continue to resolve after the split.
- **No content duplication.** Long-prose subsections already absorbed into `phase-1.2-retrospective.md` are stubbed as one-line pointers in the archive, not duplicated.
- **No new content authored.** This is a mechanical move + stub + citation-rewrite. Do not edit, summarize, or "improve" prose during the move. If something feels wrong, surface to operator rather than fix in place.
- **Active journal opens minimal.** The new `friction-journal.md` after the split contains only the file header (Format declaration + categories) and a fresh empty active-phase section for Phase 2. No pre-loaded entries other than the three `[ROUTE?]` entries specified in Task 3 Step 4.
- **Match house style for INDEX update.** INDEX.md uses tree-style listing per existing pattern; do not reorganize.

---

## Task 1: Session-init and HEAD anchor

- [ ] **Step 1: Run session-init**

```bash
bash scripts/session-init.sh S16-friction-journal-split
```

- [ ] **Step 2: Confirm HEAD points at the brief-creation commit, parent matches anchor**

```bash
git rev-parse HEAD~1
git log -1 --name-only --format='%H'
```

Expected: `HEAD~1` equals `5b0247453dd15047d873a77d2ba7d906fa528335`. HEAD's single changed file is this brief at `docs/09_briefs/phase-1.2/session-16-brief.md`.

If either check fails, STOP per "Check HEAD before Step 2 Plan" convention.

---

## Task 2: Verification before drafting

Apply Spec-to-Implementation Verification (Convention #8) to every fact this split relies on.

- [ ] **Step 1: Verify `friction-journal.md` exists and matches expected size**

```bash
wc -c docs/07_governance/friction-journal.md
```

Expected: ~435,421 bytes (matching the convention's Rationale paragraph).

- [ ] **Step 2: Enumerate all H2 sections in the current journal**

```bash
grep -nE '^## ' docs/07_governance/friction-journal.md
```

Expected output enumerates the full section list. Record line numbers for each H2; the split moves are anchored against these.

- [ ] **Step 3: Enumerate all subsection-letter sections in the Phase 1.2 area**

```bash
grep -nE '^### \([a-z]\)' docs/07_governance/friction-journal.md
```

Expected: subsections (a) through (p) with their starting line numbers, plus the Vercel-deploy-fix H2 block at end-of-file.

- [ ] **Step 4: Enumerate all `friction-journal.md` citations in `conventions.md`**

```bash
grep -nE 'friction-journal\.md' docs/04_engineering/conventions.md
```

Expected: list of citations to be reviewed. Each citation classifies into one of three categories:
- **Phase-X-archive citations** — references to specific dated entries in Phase 1.1 / 1.5A / 1.2 sections that move to archive files; the citation rewrites to point at the archive file (e.g., `friction-journal/phase-1.2.md` section (p)).
- **Retrospective-stub citations** — references to long-prose subsections (o), (p), parts of (g)/(m)/(n) that have been absorbed into `phase-1.2-retrospective.md`; the citation rewrites to point at the retrospective subsection.
- **No-rewrite-needed citations** — generic references that don't depend on file location (none expected, but possible).

Surface the classification table to operator before any rewrites land.

- [ ] **Step 5: Verify retrospective subsections referenced in stubs**

For each absorbed long-prose subsection (o, p, parts of g/m/n), verify the corresponding pointer in `phase-1.2-retrospective.md` exists. Specifically:

```bash
grep -nE '^### Pattern [0-9]+ — ' docs/07_governance/retrospectives/phase-1.2-retrospective.md
```

Expected: §3 Pattern 1 through Pattern 8 enumerated. Match each absorbed journal subsection to its retrospective Pattern destination. If any subsection lacks a clear retrospective pointer, surface to operator.

- [ ] **Step 6: Verify INDEX.md current state**

```bash
sed -n '1,50p' docs/INDEX.md
```

Confirm INDEX is stale (still says "Phase 1.2 in flight," missing Arc A retrospective, missing phase-1.2 retrospective, etc.). Record the current shape so updates match house style.

- [ ] **Step 7: Verification report to operator**

Surface a single report listing:
1. Friction-journal size confirmation.
2. H2 section list with line numbers.
3. Phase 1.2 subsection-letter list with line numbers.
4. Citations classification table (which need rewriting, to what).
5. Retrospective Pattern destinations for each absorbed subsection.
6. INDEX.md staleness summary.

Wait for operator acknowledgment before proceeding. Do not advance past any MISMATCH without operator direction.

---

## Task 3: Step 2 Plan — split structure and citation rewrites

Produce a planning report and wait for operator approval before any drafting.

- [ ] **Step 1: Define archive file split**

Propose three archive files:
- `friction-journal/phase-1.1.md` — current journal's `## Phase 1.1` H2 section (terse entries, ~42KB).
- `friction-journal/phase-1.5.md` — current journal's `## Phase 1.5A` H2 section (terse entries, ~4KB). Note: brief uses "phase-1.5" without letter suffix because Phase 1.5A is the only 1.5-series content in the current journal; if Phase 1.5B/1.5C have entries, surface to operator for naming decision.
- `friction-journal/phase-1.2.md` — all Phase 1.2 content: Agent Autonomy Design Sprint, all `## Phase 1.2 Session N` H2 blocks, External CTO Review, Phase A/B/C/D blocks, AND all Phase 1.2 lettered subsections (a)–(p) AND the Vercel-deploy-fix H2 block.

The Autonomy Sprint goes into `phase-1.2.md` rather than its own file because the convention's archival rule is per-phase, not per-arc. Naming exception: if operator wants `autonomy-sprint.md` as a separate file, surface for direction.

- [ ] **Step 2: Define stub strategy for absorbed long-prose subsections**

For each long-prose subsection that has been absorbed into `phase-1.2-retrospective.md`, replace the subsection content in the archive with a one-line pointer. Per the convention's Archival rule clause 3 example:

> "Section (p): captured in `phase-1.2-retrospective.md` §3 Pattern 6."

Apply this pattern to:
- **Section (o)** — C7 closeout deliverables (Meta A first application). Stub points at the retrospective subsection that absorbed it.
- **Section (p)** — C11 retrospective on C7 EC-13. Stub points at §3 Pattern 6 ("Meta A and Meta B as the C11 retrospective's structural outputs").
- **Parts of section (g)/(m)/(n)** — only if the verification step confirms the long-prose portions are absorbed; if a subsection is mixed (some terse entries, some prose), only the prose portion stubs while the terse entries stay verbatim. Surface ambiguous cases to operator.

The stub keeps the section letter and the original subsection title, then a one-line pointer in italics. Example:

```
### (p) C11 retrospective on C7 EC-13
*Captured in `phase-1.2-retrospective.md` §3 Pattern 6.*
```

- [ ] **Step 3: Define citation rewrite plan**

Produce the full list of `conventions.md` citations to rewrite, with old → new mapping. For each citation:

- Cite the line number in `conventions.md` where the citation appears.
- Cite the convention it belongs to (e.g., "Convention #8 Refinement datapoint Phase C").
- Old text (current citation).
- New text (post-split citation).
- Genre: phase-archive vs retrospective-stub.

Example:

```
Line 612 (Convention #8 — Refinement datapoint Phase C):
Old: docs/07_governance/friction-journal.md Phase C section (c) under "Plan-time-discipline family"
New: docs/07_governance/friction-journal/phase-1.2.md Phase C section (c) under "Plan-time-discipline family"
Genre: phase-archive (entry stays terse, just relocates).
```

- [ ] **Step 4: Define active journal opening shape**

The new `friction-journal.md` after the split:

- Keeps the file header (Format declaration + categories).
- Removes all current content past the header.
- Opens with a `## Phase 2` H2 section, empty (ready to receive entries).
- Three `[ROUTE?]`-tagged entries land as the first journal entries — the Documentation Routing refinement candidates surfaced during S15's mental simulation:
  1. `2026-04-27 NOTE [ROUTE?] — session-scope reflection has no clean retrospective destination per current Documentation Routing rule; refinement candidate for next governance amendment.`
  2. `2026-04-27 NOTE [ROUTE?] — pattern observations that are also deferred-codification candidates can legitimately split between friction-journal.md and open_questions.md per current routing rule; works in practice but unspecified; refinement candidate.`
  3. `2026-04-27 NOTE [ROUTE?] — brief-creation sessions (e.g., S15-brief-creation) don't always acquire session locks; pattern fired N=1 during f90753b drafting; open question for future codification of session-lock sub-type.`

These three entries are the first real-world test of the `[ROUTE?]` mechanism the convention codifies.

- [ ] **Step 5: Define INDEX.md update scope**

Identify each section of INDEX.md that's stale. Propose specific updates:
- Phase status (1.2 closed, 2 opening).
- Add Arc A retrospective entry.
- Add phase-1.2 retrospective entry.
- Add phase-2 obligations entry.
- Add `friction-journal/` subdirectory listing.
- Add Documentation Routing convention reference.
- Add Workflow Vocabulary glossary section reference.
- Update session-brief listing through S16.

Do not reorganize INDEX.md structure; only update content.

- [ ] **Step 6: Define Phase 2 obligations.md update scope**

Append to `docs/09_briefs/phase-2/obligations.md` under a new subsection:

```
### Documentation Routing refinement candidates (from S15 mental simulation)

- Session-scope reflection — no clean retrospective destination.
- Pattern observations that are also deferred-codification candidates — split routing legitimate but unspecified.
- Brief-creation session lock pattern — open question for codification of sub-type.
```

The matching `[ROUTE?]` entries in the journal cross-reference this obligations subsection.

- [ ] **Step 7: Surface the plan to operator**

Report:
- Three archive files with content origin per file.
- Stub plan (which subsections stub, which retrospective Pattern each points to).
- Full citation rewrite table.
- Active journal opening shape.
- INDEX.md update scope.
- Phase 2 obligations subsection text.
- Expected diff scope (files touched, lines added/removed/moved).

Wait for operator approval before any file mutation.

---

## Task 4: Execute the split

After plan approval, execute in this order:

- [ ] **Step 1: Create `friction-journal/` subdirectory**

```bash
mkdir -p docs/07_governance/friction-journal
```

- [ ] **Step 2: Create archive files via copy + edit**

For each archive file:
1. Copy the relevant H2 section(s) from `friction-journal.md` to `friction-journal/phase-X.md` verbatim (preserving section letters).
2. Apply stub replacements for absorbed long-prose subsections per Task 3 Step 2.
3. Verify the archive file ends with a trailing newline.

Do NOT touch the source `friction-journal.md` yet.

- [ ] **Step 3: Verify archive files are well-formed**

For each archive file:
- File parses as valid Markdown.
- Section letters (a)–(p) appear in the expected order.
- Stubbed sections are one-line pointers, not duplicated content.
- No content from other phases bleeds into the file.

Surface any anomaly to operator before proceeding.

- [ ] **Step 4: Reset `friction-journal.md` to active-only shape**

Replace the entire content of `friction-journal.md` with:
1. The file header (Format declaration + categories) verbatim from the original.
2. A new `## Phase 2` H2 section.
3. The three `[ROUTE?]`-tagged entries from Task 3 Step 4.

Do not preserve any closed-phase content in the active journal — that's now in archive files.

- [ ] **Step 5: Apply citation rewrites to `conventions.md`**

For each citation in the rewrite table from Task 3 Step 3, apply the rewrite. Use targeted str_replace to avoid accidentally modifying surrounding prose.

- [ ] **Step 6: Update `INDEX.md`**

Apply the updates from Task 3 Step 5.

- [ ] **Step 7: Update `09_briefs/phase-2/obligations.md`**

Append the Documentation Routing refinement candidates subsection per Task 3 Step 6.

---

## Task 5: Diff scope verification

- [ ] **Step 1: Run `git status --short` and `git diff --stat`**

Expected file changes:
- Modified: `docs/07_governance/friction-journal.md` (massive reduction; ~435KB → ~2KB)
- New: `docs/07_governance/friction-journal/phase-1.1.md` (~42KB)
- New: `docs/07_governance/friction-journal/phase-1.5.md` (~4KB)
- New: `docs/07_governance/friction-journal/phase-1.2.md` (~390KB minus stub savings)
- Modified: `docs/04_engineering/conventions.md` (citation rewrites only, ~10–20 lines)
- Modified: `docs/INDEX.md` (content updates, ~30–50 lines)
- Modified: `docs/09_briefs/phase-2/obligations.md` (~10 lines added)

If anything else appears in the diff, STOP and surface.

- [ ] **Step 2: Verify total content preservation (modulo stubs)**

```bash
wc -c docs/07_governance/friction-journal.md docs/07_governance/friction-journal/*.md
```

Expected: sum is roughly equal to the original 435KB minus the stub savings (long-prose subsections replaced with one-liners). Surface the actual delta to operator.

- [ ] **Step 3: Verify section-letter preservation**

```bash
grep -nE '^### \([a-z]\)' docs/07_governance/friction-journal/phase-1.2.md
```

Expected: same letter sequence as the original journal's Phase 1.2 area. Letters do not get re-assigned.

- [ ] **Step 4: Verify citation rewrites resolve**

For each rewritten citation in `conventions.md`, manually confirm the new path + section reference resolves. If a citation points at a stubbed section, the stub must exist and itself point at the retrospective.

---

## Task 6: Founder review gate (no commit yet)

- [ ] **Step 1: Surface to operator for review**

Present:
1. The new active `friction-journal.md` (full content — should be tiny).
2. Each archive file's first 50 lines and last 30 lines (to verify boundaries).
3. The full citation rewrite diff in `conventions.md`.
4. The INDEX.md diff.
5. The phase-2/obligations.md diff.
6. The diff scope summary from Task 5.

Wait for operator approval. Do not commit before approval.

- [ ] **Step 2: Apply revisions if requested**

If operator requests revisions, apply them in this same session. Re-run Task 5 (diff scope verification) after every revision pass. Re-surface for re-approval.

---

## Task 7: Commit

- [ ] **Step 1: Stage all modified and new files**

```bash
git add docs/07_governance/friction-journal.md \
  docs/07_governance/friction-journal/ \
  docs/04_engineering/conventions.md \
  docs/INDEX.md \
  docs/09_briefs/phase-2/obligations.md
git status --short
```

Expected: only the named files staged. Confirm `friction-journal/` subdirectory is staged with all three archive files.

- [ ] **Step 2: Create the commit**

```bash
export COORD_SESSION='S16-friction-journal-split' && git commit -m "$(cat <<'EOF'
docs(governance): apply Documentation Routing convention — friction-journal split + INDEX update

- moves Phase 1.1 / 1.5A / 1.2 content from friction-journal.md to
  friction-journal/phase-1.1.md / phase-1.5.md / phase-1.2.md
- preserves section letters (a)-(p) in phase-1.2.md archive so prior
  conventions.md citations resolve without rewriting
- stubs absorbed long-prose subsections (o), (p), parts of (g)/(m)/(n)
  with one-line pointers to phase-1.2-retrospective.md §3 patterns
- rewrites conventions.md citations from friction-journal.md to
  friction-journal/phase-X.md per the rewrite table
- opens active friction-journal.md fresh for Phase 2 with three
  [ROUTE?]-tagged refinement candidates from S15 mental simulation
- updates INDEX.md to reflect Phase 1.2 closed, Phase 2 opening,
  Arc A retrospective, phase-1.2 retrospective, friction-journal
  subdirectory, Documentation Routing convention, Workflow Vocabulary
- appends "Documentation Routing refinement candidates" subsection to
  phase-2/obligations.md so the three [ROUTE?] entries don't get lost
- first concrete application of Documentation Routing convention
  (5b02474) Archival rule

Session: S16-friction-journal-split

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Verify commit landed**

```bash
git log -1 --stat
```

Expected: commit subject matches; staged files all listed.

---

## Task 8: Post-commit verification

- [ ] **Step 1: Surface confirmation to operator**

Convention's first concrete application is committed. Audit chain extension:
- f90753b — S15 brief
- 5b02474 — Documentation Routing ratified
- (this commit) — Documentation Routing first application: friction-journal split + INDEX update

The next session opens for the tooling commit (line-length check, `[ROUTE?]` scanner, heading detector), citing 5b02474 as authority.

- [ ] **Step 2: Run session-end**

```bash
bash scripts/session-end.sh
```

---

## Out of scope (do not do)

- Authoring new prose anywhere (no summaries, no improvements, no clarifications).
- Touching tooling scripts (separate session).
- Creating DEV_WORKFLOW.md.
- Modifying `phase-1.2-retrospective.md`, `arc-A-retrospective.md`, or any retrospective file.
- Reorganizing INDEX.md structure beyond content updates.
- Extracting Autonomy Sprint into a separate file unless operator approves at Task 3.

## Halt conditions

Stop and surface to operator if:

- Any verification claim in Task 2 fails.
- Citation rewrite produces ambiguous mappings (citation might match multiple destinations).
- A long-prose subsection isn't cleanly absorbed into the retrospective (stub destination unclear).
- Section letters don't preserve as expected during the move.
- Diff scope check shows files outside the expected set.
- House-style match for INDEX.md or obligations.md would require contorting the prose.
