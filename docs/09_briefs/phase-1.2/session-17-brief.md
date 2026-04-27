# Session 17 — Documentation Routing Tooling

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the Documentation Routing convention's tooling floor (5b02474 §Hygiene cadence): four scripts under `scripts/` that mechanically enforce the convention's discipline. Three scripts named in the convention (line-length check, `[ROUTE?]` tag scanner, heading detector) plus one script discovered as needed during S16 execution (citation auditor catching both `\.md` and shorthand `section (X)` grep patterns).

**Architecture:** Pure tooling commit. Four new shell scripts under `scripts/` matching house style (bash, `set -euo pipefail`, header docstring with convention reference, idempotent failure modes, exits clean on success). No documentation changes except a "Tooling floor" subsection update in `conventions.md` (§Hygiene cadence) cross-referencing the now-shipped scripts, plus one Governance Audit row per Path B (operator pre-decision). No modifications to `friction-journal.md`, archive files, or any other governance content.

**Tech Stack:** Bash only. No new dependencies. Runs against `docs/07_governance/friction-journal.md` (active journal), `docs/07_governance/friction-journal/*.md` (archives), and `docs/04_engineering/conventions.md` (citation auditor).

---

**Anchor (parent) SHA:** `c40c91e2732b0832b42bbdb5158369a47bd4086c` — the SHA the brief was drafted against. WSL must verify HEAD's parent matches this anchor SHA via `git rev-parse HEAD~1`.

**Upstream authority:** Convention "Documentation Routing" at `docs/04_engineering/conventions.md`, ratified at commit `5b02474`, first applied at `c40c91e`. This commit closes the policy-then-tooling loop named in the convention's §Hygiene cadence "Tooling floor" subsection.

---

## Session label
`S17-routing-tooling` — continues the S-series. Per the threshold-clock observation captured during S16: this is a brief-creation session that should *acquire* the lock at session-init, breaking the brief-creation lock pattern at N=2 rather than firing N=3 codification trigger.

## Hard constraints (do not violate)

- **No documentation governance changes beyond two precise edits.** The only doc edits are (a) the §Hygiene cadence "Tooling floor" subsection prose replacement, and (b) one new row in the Phase 1.2 Conventions Ratification Audit table per Path B. No new conventions, no convention rule amendments, no `obligations.md` edits, no `INDEX.md` edits.
- **No edits to `friction-journal.md` or archives.** The scripts read these files; they do not write to them. If a script's output reveals an actual violation in any of these files, surface to operator — do not auto-fix.
- **House style match.** Every script: `#!/usr/bin/env bash` shebang, `set -euo pipefail`, header docstring naming the convention reference (`docs/04_engineering/conventions.md "Documentation Routing"`), idempotent (re-runs produce same output), exit 0 on clean / exit 1 on violation found.
- **No tooling beyond the four named scripts.** Convention's tooling floor names three; S16 surfaced the fourth (citation auditor). Anything else is scope creep.

---

## Task 1: Session-init and HEAD anchor

- [ ] **Step 1: Run session-init**

```bash
bash scripts/session-init.sh S17-routing-tooling
```

This brief-creation session acquires the lock per the threshold-clock decision; do not skip.

- [ ] **Step 2: Confirm HEAD points at the brief-creation commit, parent matches anchor**

```bash
git rev-parse HEAD~1
git log -1 --name-only --format='%H'
```

Expected: `HEAD~1` equals `c40c91e2732b0832b42bbdb5158369a47bd4086c`. HEAD's single changed file is `docs/09_briefs/phase-1.2/session-17-brief.md`.

If either check fails, STOP per "Check HEAD before Step 2 Plan" convention.

---

## Task 2: Verification before drafting

- [ ] **Step 1: Verify `scripts/` directory and house style**

```bash
ls scripts/*.sh
head -5 scripts/session-init.sh scripts/session-end.sh scripts/install-hooks.sh
```

Expected: existing shell scripts using `#!/usr/bin/env bash` + `set -euo pipefail`. Match this style exactly.

- [ ] **Step 2: Verify target files exist for each script**

```bash
ls docs/07_governance/friction-journal.md \
   docs/07_governance/friction-journal/ \
   docs/04_engineering/conventions.md
wc -l docs/07_governance/friction-journal.md
wc -l docs/04_engineering/conventions.md
```

Expected: active journal ~26 lines, `conventions.md` ~1500+ lines, archives subdir contains 4 files.

- [ ] **Step 3: Verify Documentation Routing convention §Hygiene cadence "Tooling floor" subsection exists**

```bash
grep -nE '^### Hygiene cadence|Tooling floor' docs/04_engineering/conventions.md
```

Expected: one heading match for `### Hygiene cadence`, one bold-prefix match for `**Tooling floor.**`. The "Tooling floor" subsection text currently reads "A follow-on commit will deliver minimum viable tooling..." — this is the only doc text that gets replaced in this commit (alongside the audit-row append).

- [ ] **Step 4: Pre-flight check — informal runs before script implementation**

This is a baseline check, not a halt condition. Run each tool informally first to set baseline expectations:

```bash
# Heading detector — should find none in active journal
grep -nE '^####? ' docs/07_governance/friction-journal.md || echo "No H3/H4 in active journal — clean."

# [ROUTE?] count — expect exactly 3 from the active journal seeding
grep -c '\[ROUTE?\]' docs/07_governance/friction-journal.md

# Citation grep both patterns
grep -nE 'friction-journal\.md|friction-journal section' docs/04_engineering/conventions.md | wc -l
```

Expected:
- No H3/H4 headings in active journal (clean).
- Exactly 3 `[ROUTE?]` tags (the three S15 mental-simulation entries seeded at S16 active reset).
- Citation count ~24 (per S16 execution finding, of which 4 are in-Documentation-Routing-convention rules; the rest are properly rewritten phase-archive or retrospective-stub citations — no shorthand `friction-journal section` patterns should remain since S16 rewrote them all).

- [ ] **Step 5: Verification report to operator**

Surface the report. Wait for acknowledgment before Task 3.

---

## Task 3: Step 2 Plan — script designs and `conventions.md` edits

Produce a planning report and wait for operator approval before drafting any script.

- [ ] **Step 1: Define script #1 — Line-length check**

Filename: `scripts/check-friction-journal-line-length.sh`

Target: `docs/07_governance/friction-journal.md`

Behavior: For each top-level bullet item (lines starting with `- `), count consecutive continuation lines (indented with 2+ spaces, or blank-then-indent). Flag any bullet whose total span exceeds N lines. Default N = 10 per the convention's 10-second rule.

Exit: 0 if all bullets ≤ N lines, 1 if any bullet exceeds.

Output on violation: one line per offender:
`<path>:<start-line>: bullet spans <count> lines (>10 — convention §10-second rule)`

Args: optional `--max-lines <N>` to override default.

- [ ] **Step 2: Define script #2 — `[ROUTE?]` tag scanner**

Filename: `scripts/scan-route-tags.sh`

Target: `docs/07_governance/friction-journal.md`

Behavior: List all lines containing `[ROUTE?]` tags (raw, unresolved). Three modes:
- `--list` (default): print each match on its own line as `<path>:<line-no>: <tag-context>`
- `--count`: print just the integer count
- `--phase-end`: list mode + exit 1 if count > 0 (for phase-end hygiene cadence enforcement)

Exit: 0 by default regardless of count; `--phase-end` exits 1 on count > 0 (signals violation per convention §Hygiene cadence step 1).

Note: the script also scans for resolved `[ROUTE: stays-in-journal]` tags; these are noted in `--list` output but not counted as violations.

- [ ] **Step 3: Define script #3 — Heading detector**

Filename: `scripts/detect-journal-headings.sh`

Target: `docs/07_governance/friction-journal.md` (active journal only; archives are exempt because their lettered subsections legitimately use `###` headings per the archival rule's letter-preservation clause).

Behavior: Grep for `^### ` or `^#### ` lines. Any match is a violation per convention §Write-time tripwires #2 ("No embedded retrospectives in the journal").

Exit: 0 if no H3/H4 found, 1 if any match.

Output on violation: `<path>:<line-no>: <heading-text>`

Note: the active journal has `## Phase 2` as the only legal heading level beyond the file header.

- [ ] **Step 4: Define script #4 — Citation auditor (per S16 C1-extension)**

Filename: `scripts/audit-friction-journal-citations.sh`

Target: `docs/04_engineering/conventions.md`

Behavior: Grep two patterns:
- **Pattern A:** `friction-journal\.md` (citation with `.md` extension)
- **Pattern B:** `friction-journal section` (shorthand without extension)

For each match:
- Pattern A matches: classify as "phase-archive" if path is `friction-journal/phase-X.md`; flag as "ARCHIVE-MISMATCH" if path is bare `friction-journal.md` AND the line is outside the `## Documentation Routing` section whitelist (post-split this should not appear except inside the convention itself, which describes the file's role rather than citing it).
- Pattern B matches: flag as "SHORTHAND-PATTERN" requiring manual review (would have been a phase-archive or retrospective-stub in S16's rewrite).

Exit: 0 if all matches are clean (phase-archive or retrospective citations under expected paths, or in-Documentation-Routing-convention rule references), 1 if any ARCHIVE-MISMATCH or SHORTHAND-PATTERN flagged.

Output on violation: one line per flagged match:
`<path>:<line-no>: <category> — <citation-context>`

**Whitelist:** lines within the `## Documentation Routing` section are exempt — these reference the file's role, not load-bearing citations. The whitelist is computed at runtime by detecting the section's start (`^## Documentation Routing`) and end (next `^## ` heading or EOF), not by hardcoded line numbers (line numbers shift across commits).

- [ ] **Step 5: Define `conventions.md` "Tooling floor" subsection edit**

Target: `docs/04_engineering/conventions.md`, §Hygiene cadence "Tooling floor" subsection.

Replace the prose:

```
**Tooling floor.** Policy alone decays without tooling. A
follow-on commit will deliver minimum viable tooling
supporting this hygiene cadence:

- **Line-length check** — script flagging any single
  bullet item in `friction-journal.md` exceeding ~10
  lines.
- **`[ROUTE?]` tag scanner** — script listing unresolved
  tags in the active journal, with a non-zero exit at
  phase close if any survive.
- **Heading detector** — script flagging `###` or `####`
  headings inside `friction-journal.md` (signal that
  retrospective content has been embedded).

These are minimums. Additional tooling may follow.
```

with:

```
**Tooling floor.** Policy alone decays without tooling.
The following minimum viable tooling supports this
hygiene cadence (delivered at this commit):

- **Line-length check** (`scripts/check-friction-journal-line-length.sh`)
  — script flagging any single bullet item in
  `friction-journal.md` exceeding ~10 lines.
- **`[ROUTE?]` tag scanner** (`scripts/scan-route-tags.sh`)
  — script listing unresolved tags in the active journal,
  with a non-zero exit at phase close (`--phase-end` mode)
  if any survive.
- **Heading detector** (`scripts/detect-journal-headings.sh`)
  — script flagging `###` or `####` headings inside
  `friction-journal.md` (signal that retrospective content
  has been embedded).
- **Citation auditor** (`scripts/audit-friction-journal-citations.sh`)
  — script auditing `conventions.md` for citations to
  `friction-journal.md` patterns; catches both `\.md` and
  shorthand `section (X)` patterns. Added in response to
  the S16 C1-extension finding (see
  `phase-2/obligations.md` §Documentation Routing
  refinement candidates fifth bullet).

Run scripts manually until a phase-end hygiene cadence
orchestrator wraps them. Additional tooling may follow.
```

- [ ] **Step 6: Define Governance Audit row (Path B per operator pre-decision)**

Append to the existing `### Phase 1.2 Conventions — Ratification Audit` table:

| Convention | Landed in commit | Ratification date | Governance cycle |
|------------|------------------|-------------------|------------------|
| Documentation Routing (Tooling floor amendment — scripts shipped) | (this commit) | 2026-04-27 | S17 tooling delivery; closes the policy-then-tooling loop, adds citation-auditor as fourth bullet per S16 C1-extension finding |

Path B rationale (per operator pre-decision in S17 brief): the Documentation Routing convention's body changed (three-bullet list → four-bullet list, plus prose tense flip from "will deliver" to "delivered"). The §Governance Audit prose says "any commit that adds or modifies a convention in this file must... add a corresponding audit entry" without exempting bullet-list edits. One audit row preserves the all-conventions.md-changes-tracked property.

- [ ] **Step 7: Diff scope expectation**

Files modified:
- `scripts/check-friction-journal-line-length.sh` (NEW, ~50 lines)
- `scripts/scan-route-tags.sh` (NEW, ~50 lines)
- `scripts/detect-journal-headings.sh` (NEW, ~30 lines)
- `scripts/audit-friction-journal-citations.sh` (NEW, ~80 lines)
- `docs/04_engineering/conventions.md` (~15 line replacement in §Hygiene cadence + 1 row append in §Governance Audit table)

Total: 4 new files + 1 modified file. ~225 lines added net.

- [ ] **Step 8: Surface plan to operator**

Wait for operator approval before drafting any script.

---

## Task 4: Implement scripts

After plan approval:

- [ ] **Step 1: Write `scripts/check-friction-journal-line-length.sh`**
- [ ] **Step 2: Write `scripts/scan-route-tags.sh`**
- [ ] **Step 3: Write `scripts/detect-journal-headings.sh`**
- [ ] **Step 4: Write `scripts/audit-friction-journal-citations.sh`**
- [ ] **Step 5: Make scripts executable**

```bash
chmod +x scripts/check-friction-journal-line-length.sh \
         scripts/scan-route-tags.sh \
         scripts/detect-journal-headings.sh \
         scripts/audit-friction-journal-citations.sh
```

- [ ] **Step 6: Run each script against the current repo state and surface output**

Each script should produce expected output:
- `check-friction-journal-line-length.sh`: clean (the three `[ROUTE?]` entries are within 10 lines).
- `scan-route-tags.sh`: lists exactly 3 `[ROUTE?]` tags.
- `detect-journal-headings.sh`: clean (no H3/H4 in active journal).
- `audit-friction-journal-citations.sh`: clean (no ARCHIVE-MISMATCH or SHORTHAND-PATTERN).

If any script reports unexpected violations, surface to operator before proceeding.

- [ ] **Step 7: Apply `conventions.md` "Tooling floor" subsection edit + audit row append**

Apply the prose replacement defined in Task 3 Step 5 and the audit row append defined in Task 3 Step 6.

**Ordering rationale:** scripts implemented and run BEFORE the doc edit so the citation auditor's runtime whitelist (which scans for `## Documentation Routing` section bounds) sees the unchanged §Hygiene cadence text first. After the edit, re-run the auditor to confirm no false positives.

- [ ] **Step 8: Re-run all four scripts post-doc-edit**

Confirm clean output post-edit. The auditor should still produce clean output because the new "Tooling floor" prose mentions `friction-journal.md` four times, all within the `## Documentation Routing` section whitelist.

---

## Task 5: Diff scope verification

- [ ] **Step 1: `git status --short` and `git diff --stat`**

Expected: 4 new files in `scripts/` + 1 modified `conventions.md`. Nothing else.

- [ ] **Step 2: Verify scripts are executable**

```bash
ls -l scripts/*.sh | grep -E 'check-friction|scan-route|detect-journal|audit-friction'
```

All four should show `-rwxr-xr-x`.

- [ ] **Step 3: Verify all four scripts still pass post-doc-edit**

Re-run each script. All four should exit 0 with no violations.

---

## Task 6: Founder review gate

- [ ] **Step 1: Surface to operator for review**

Present:
1. All four script source files (full text).
2. The `conventions.md` "Tooling floor" subsection edit diff.
3. The audit row addition diff.
4. Diff scope summary from Task 5.
5. Sample output of each script run against current repo state.

Wait for operator approval.

- [ ] **Step 2: Apply revisions if requested**

---

## Task 7: Commit

- [ ] **Step 1: Stage all files**

```bash
git add scripts/check-friction-journal-line-length.sh \
        scripts/scan-route-tags.sh \
        scripts/detect-journal-headings.sh \
        scripts/audit-friction-journal-citations.sh \
        docs/04_engineering/conventions.md
git status --short
```

- [ ] **Step 2: Create commit**

```bash
export COORD_SESSION='S17-routing-tooling' && git commit -m "$(cat <<'EOF'
docs(governance): deliver Documentation Routing tooling floor

- adds scripts/check-friction-journal-line-length.sh — flags
  bullets exceeding 10 lines per the convention's 10-second rule
- adds scripts/scan-route-tags.sh — lists [ROUTE?] tags;
  --phase-end mode exits non-zero if any survive (per §Hygiene
  cadence step 1 enforcement)
- adds scripts/detect-journal-headings.sh — flags ### or ####
  headings in active friction-journal (per §Write-time tripwires
  #2; archives exempt per archival rule's letter-preservation)
- adds scripts/audit-friction-journal-citations.sh — audits
  conventions.md for both .md and shorthand section (X) citation
  patterns; addresses S16 citation-grep methodology gap captured
  in phase-2/obligations.md as fifth refinement candidate
- updates conventions.md §Hygiene cadence "Tooling floor"
  subsection: replaces "follow-on commit will deliver" prose
  with "delivered at this commit" prose listing all four scripts
- appends Phase 1.2 Conventions Ratification Audit row for the
  Tooling floor amendment per Path B (every conventions.md
  change tracked, no exemption for bullet-list edits)
- closes the policy-then-tooling loop established at 5b02474
  ratification + c40c91e first concrete application

Session: S17-routing-tooling

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Verify commit landed**

```bash
git log -1 --stat
```

---

## Task 8: Post-commit verification

- [ ] **Step 1: Surface confirmation to operator**

Audit chain extension complete:
- `f90753b` — S15 brief
- `5b02474` — Documentation Routing convention ratified
- `6e76d89` — S16 brief
- `c40c91e` — Documentation Routing first concrete application
- (S17 brief) — this brief
- (this commit) — Documentation Routing tooling floor delivered

- [ ] **Step 2: Run session-end**

```bash
bash scripts/session-end.sh
```

This closes the cleanup arc. Brief-creation lock pattern stays at N=2 (S17 acquired the lock); did not fire N=3 codification trigger. The codification candidate stays in `obligations.md` awaiting future fire.

---

## Out of scope (do not do)

- New convention amendments beyond the §Hygiene cadence "Tooling floor" subsection update + the one audit row append.
- Phase-end hygiene cadence orchestrator script (a meta-script that runs all four). Convention §Hygiene cadence describes the cadence as manual-run; orchestration is future tooling, not minimum viable.
- Pre-commit hook integration (the citation auditor would be a candidate for pre-commit if `conventions.md` changes; defer to a future amendment when the codification-cycle pattern justifies adding it).
- `DEV_WORKFLOW.md`.
- `INDEX.md` updates (the Tooling floor subsection edit doesn't shift the `conventions.md` description meaningfully; INDEX is fresh post-`c40c91e`).

## Halt conditions

- Any verification step in Task 2 fails.
- Any script's pre-flight informal run (Task 2 Step 4) reveals an actual violation in the current repo state — surface to operator; do not auto-fix.
- House-style match would require contorting the script (defer to surfacing rather than forcing the match).
- Diff scope check shows files outside the expected 5-file set.
- The post-doc-edit re-run (Task 4 Step 8) reports any violation that the pre-edit run did not — indicates the doc edit introduced a false positive in the citation auditor's whitelist logic.
