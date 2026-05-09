# D5 Ratification Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land Tier 5 of the chounting Phase 0 governance arc — write the D5 ratification package for ADR-0018 (Relationship Router) against brainstorm-side authored content, verify it, await the founder ratification verdict, and commit ADR-0018 + the D5 package as separate single-purpose commits per the D1/D2/D3/D4 precedent.

**Architecture:** WSL-side / brainstorm-side coordination flow. Brainstorm-side has authored the D5 package content with §2/§7 commit-chain corrections + §6.10 four-fire update applied (responsive to WSL-side's pre-write Z1 #11 prophylactic-grep divergence surface). The remaining work is mechanical: single Write to create the package on disk, post-write verification (grep counts + line count + `git status --short`), brainstorm-side spot-check, founder ratification verdict, two separate single-purpose commits. Tier 6 (ADR-0019 Confidence Calibration Policy) splits to Session 2D per the calibrated handoff authorization — this plan does NOT cover Tier 6.

**Tech Stack:** git, bash (grep, wc, git log/status/add/commit), markdown. No code; no tests in the conventional TDD sense — verification is byte-level grep against the authored content.

---

## File Structure

| Path | Action | Responsibility |
|---|---|---|
| `docs/09_briefs/phase-2/2026-05-04-d5-ratification-package.md` | Create | D5 ratification package — eight sections (§1 Purpose / §2 Tier 5 commit chain / §3 ADR-0018 ratification verdict / §4 Anti-overscope cross-check / §5 Recommended action / §6 Discoverability notes / §7 Locked Phase 0 decisions / §8 Ratification ask). Authored by brainstorm-side; WSL-side writes verbatim with §2/§7 corrections + §6.10 four-fire update applied. |
| `docs/07_governance/adr/0018-relationship-router.md` | Already on disk untracked at 1681 lines (post-C10a + C10b + C10c) | ADR-0018 substantive content. NOT modified by this plan. Committed as a single commit post-ratification. |

No other files touched. Z1 #10 scope-bounding: any out-of-scope drift surfaced during execution is reported back rather than auto-fixed.

---

## Task 1: Write D5 ratification package to disk

**Files:**
- Create: `docs/09_briefs/phase-2/2026-05-04-d5-ratification-package.md`

- [ ] **Step 1: Verify pre-write worktree state**

Run: `git status --short && wc -l docs/07_governance/adr/0018-relationship-router.md`
Expected output:
```
?? docs/07_governance/adr/0018-relationship-router.md
1681 docs/07_governance/adr/0018-relationship-router.md
```
This confirms the post-C10a+C10b+C10c ADR-0018 draft is the only untracked file and is at the expected 1681-line length. Any divergence (other untracked files, different line count) means either prior work is unreconciled or a coordination drift — surface back to brainstorm-side before writing.

- [ ] **Step 2: Write the D5 package file**

Use the `Write` tool to create `docs/09_briefs/phase-2/2026-05-04-d5-ratification-package.md` with the brainstorm-side authored content from the conversation transcript, applying these inline corrections:

**§2 commit chain code block (replace placeholder/draft chain with):**
```
... (D4 chain through 3577484 — Tier 4 trio + Cleanup Commits 1-3) ...
e71ecc1 D4 ratification: CTO ratified ADR-0015 / ADR-0016 / ADR-0017 with named follow-ups
25ddbc6 Cleanup Commit 4 (post-D4 hygiene): Tier 4 trio named-follow-ups closeout
eab7bad mini-decision dispatch brief: evidence-link coordination (Option 1C + 2A bundled)
6934256 Cleanup Commit 5 (post-D4 mini-decision): evidence-link coordination ratification (Option 1C + 2A)
e1111b3 Cleanup Commit 6 (post-Cleanup-Commit-5 hygiene): ADR-0016 §3 preamble scope-based wording
fa8d2e5 Cleanup Commit 7 (post-Cleanup-Commit-6 hygiene): ADR-0016 drift residual closeout (operationally serves as Session 2C handoff anchor)
[untracked] ADR-0018: Relationship Router (1681 lines post-C10a + C10b + C10c)
```

**§2 prose paragraph following the code block — replace with:**
> ADR-0018 is **untracked** at the worktree branch tip; D5 ratification triggers the commit. Per the D1/D2/D3/D4 precedent, post-ratification commits land as separate single-purpose commits: one for the post-C10a + C10b + C10c ADR-0018 file, one for the D5 ratification package file. No cleanup commits authored by D5 itself — the C10a / C10b / C10c revision passes were applied during ADR-0018 drafting (pre-ratification), not as post-ratification cleanups. The pre-D5 worktree state already incorporates Cleanup Commits 4–7 from the post-D4 / post-mini-decision hygiene cascades, which are locked-in per §7 and not re-litigated by D5.

**§7 mini-decision bullet — replace with:**
> - **From mini-decision Option 1C + 2A (dispatched at `eab7bad` brief; ratified at Cleanup Commit 5 `6934256`; post-ratification hygiene at Cleanup Commits 6 + 7 `e1111b3` + `fa8d2e5`):** Q1 bank-detail-evidence Notes-callout-only at v1; Q2 `failure_notice` reserved post-v1 in ADR-0016 §2 banking-cluster position; activation expected with post-v1 Banking domain ADR.

**§6.10 closing sentence — replace with:**
> The validation surface for Candidate B (count-metric authorship discipline; brainstorm-side count metrics being drift-prone across cleanup-brief and ratification-package authoring contexts in ways the executor's byte-level pre-execution verification catches) reached four fires this session: C10a §16 miscount (cleanup-brief authoring), C10b 756 miss (cleanup-brief authoring), C10b match-against-existing-state lowercase miss (cleanup-brief post-execution), D5 §2 commit-chain drift (ratification-package authoring; caught by WSL-side pre-write `git log` verification). Candidate B is at codification-readiness pending founder concurrence at session closeout; the four-fire pattern argues strongly for codification with the parent-pattern statement extended to cover both authoring contexts (cleanup briefs AND ratification packages).

All other content per brainstorm-side's authored package transcript verbatim.

- [ ] **Step 3: Verify the write landed**

Run: `wc -l docs/09_briefs/phase-2/2026-05-04-d5-ratification-package.md && git status --short`
Expected output (line count is approximate; brainstorm-side estimated ~340 lines):
```
~340 docs/09_briefs/phase-2/2026-05-04-d5-ratification-package.md
?? docs/07_governance/adr/0018-relationship-router.md
?? docs/09_briefs/phase-2/2026-05-04-d5-ratification-package.md
```
Two untracked files. No other-file drift. If `git status --short` shows additional modified or untracked files beyond these two, surface back per Z1 #10.

- [ ] **Step 4: Verify §2/§7/§6.10 corrections applied**

Run sequentially:
```
grep -c "Cleanup Commit 5" docs/09_briefs/phase-2/2026-05-04-d5-ratification-package.md
grep -c "Cleanup Commit 6" docs/09_briefs/phase-2/2026-05-04-d5-ratification-package.md
grep -c "Cleanup Commit 7" docs/09_briefs/phase-2/2026-05-04-d5-ratification-package.md
grep -c "four fires" docs/09_briefs/phase-2/2026-05-04-d5-ratification-package.md
grep -c "e1111b3" docs/09_briefs/phase-2/2026-05-04-d5-ratification-package.md
```
Expected:
- `Cleanup Commit 5`: ≥2 (§2 chain + §7 mini-decision bullet)
- `Cleanup Commit 6`: ≥2 (§2 chain + §7 mini-decision bullet)
- `Cleanup Commit 7`: ≥2 (§2 chain + §7 mini-decision bullet)
- `four fires`: ≥1 (§6.10 update)
- `e1111b3`: ≥2 (§2 chain + §7 bullet)

All counts ≥ expected confirm the §2/§7/§6.10 corrections landed.

- [ ] **Step 5: Surface execution receipt to brainstorm-side**

Report to brainstorm-side: per-step success table, post-write line count, post-write `git status --short` (two untracked files), and the §2/§7/§6.10 verification grep counts. No commit yet; brainstorm-side spot-checks first.

---

## Task 2: Brainstorm-side post-write spot-check

**Files:** None modified by WSL-side this task; brainstorm-side reads the on-disk D5 package.

- [ ] **Step 1: Stand by for brainstorm-side spot-check**

Brainstorm-side performs byte-level verification of the §2/§7/§6.10 corrections against the on-disk D5 package. Brainstorm-side's spot-check focuses on:
1. §2 commit chain matches the corrected enumeration verbatim.
2. §7 mini-decision bullet correctly cites Cleanup Commit 5 (ratification) + Cleanup Commits 6 + 7 (post-ratification hygiene cascade) with hashes.
3. §6.10 four-fire update reads cleanly against §2 (the four-fire narrative and the §2 commit chain are self-consistent — the fourth fire references the §2 corrections that were just applied).

- [ ] **Step 2: Address any post-write residuals brainstorm-side surfaces**

If brainstorm-side surfaces residuals (drift between authored content and on-disk content; new typos; framing tightenings), author a tight byte-level Edit pass against the on-disk D5 package — single sequential pass per Z1 #1, byte-level oldText/newText pairs per Z1 #10. If no residuals, proceed to Task 3.

- [ ] **Step 3: Confirm spot-check verdict to founder**

Brainstorm-side issues spot-check verdict. WSL-side stands by for founder ratification verdict.

---

## Task 3: Founder D5 ratification verdict

**Files:** None modified.

- [ ] **Step 1: Stand by for founder ratification verdict**

The founder reviews §3.1 ADR-0018 ratification + §6 discoverability notes. Per D1/D2/D3/D4 precedent, the verdict shape is one of:
1. **Ratify-as-is** — accept the recommended path; proceed directly to commits.
2. **Ratify with named follow-ups** — accept ratification but specify follow-up cleanups (which trigger one more revision cycle on ADR-0018 BEFORE commit per the D4 precedent).
3. **Reject / request more revisions** — verdict is "not ready"; a cleanup pass is needed before re-ratification.

- [ ] **Step 2: Branch on verdict shape**

If (1) ratify-as-is: proceed to Task 4.
If (2) ratify-with-named-follow-ups: brainstorm-side authors a follow-up cleanup brief; WSL-side executes the byte-level Edit pass; brainstorm-side spot-checks; then return to Task 3 Step 1 for founder re-confirmation. After follow-ups land clean, proceed to Task 4.
If (3) reject: surface back; new authoring cycle. Out of this plan's scope; treat as a return-to-brainstorming surface.

---

## Task 4: Commit post-C10a+C10b+C10c ADR-0018

**Files:**
- Stage: `docs/07_governance/adr/0018-relationship-router.md`
- Commit: single-purpose commit per D1/D2/D3/D4 precedent.

- [ ] **Step 1: Stage ADR-0018**

Run: `git add docs/07_governance/adr/0018-relationship-router.md`

- [ ] **Step 2: Verify stage**

Run: `git status --short`
Expected:
```
A  docs/07_governance/adr/0018-relationship-router.md
?? docs/09_briefs/phase-2/2026-05-04-d5-ratification-package.md
```
Only ADR-0018 staged; D5 package still untracked (pending Task 5).

- [ ] **Step 3: Commit ADR-0018 with single-purpose message**

Run:
```bash
git commit -m "$(cat <<'EOF'
ADR-0018: Relationship Router — closes Q56 (Phase 0 Task C10 / Tier 5)

Ratified 2026-05-04 by CTO via D5 ratification package §3.1
(docs/09_briefs/phase-2/2026-05-04-d5-ratification-package.md).

Closes Q56 (Relationship Router re-evaluation triggers): closed
list T1–T10 (v1-active T1/T2/T3/T4/T5/T6/T8/T10; reserved post-v1
T7/T9); per-trigger contract surfaces; audit-trail shape via new
router_re_evaluation_fired event + existing pre_commit_link_rerouted
per ADR-0016 §6; immutability boundary citation owned by
ADR-0011 §9 + ADR-0016 §6 (not redrafted).

Three-subsystem decomposition (Ledger-State Candidate Completion /
Ambiguity Resolution / Re-Evaluation Logic) with cross-ADR boundary
harmonization vs ADR-0014 §11. Tier 2.5 read-boundary specifics with
single-writer-rule citations for five tables. Stale-state TOCTOU
obligations distributed correctly between Router (proposes) and
Tier 1 (re-verifies). Provisional ambiguity-margin value pending
ADR-0019 ratification per Q77 v1-ship-gate pattern.

Pre-ratification revision passes folded in: C10a (7 edits — §16/§9
ADR-0011 citation drift + decision_outcome framing + INV-DOC-001
per Q79); C10b (15 edits — Tier label + Subsystem 1 ownership +
Scenario C resolution_action + matrix-count drift + audit-event
framing); C10c (1 edit — Triggered-by closing paragraph subsystem
rename completion).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: Verify ADR-0018 commit**

Run: `git log --oneline -1 && git status --short`
Expected:
- Top commit is the new ADR-0018 commit
- `git status --short` shows only `?? docs/09_briefs/phase-2/2026-05-04-d5-ratification-package.md` (D5 package still untracked)

If pre-commit hook fires and fails, fix the underlying issue and create a NEW commit (do NOT amend; per CLAUDE.md commit-discipline rules).

---

## Task 5: Commit D5 ratification package

**Files:**
- Stage: `docs/09_briefs/phase-2/2026-05-04-d5-ratification-package.md`
- Commit: single-purpose commit per D1/D2/D3/D4 precedent.

- [ ] **Step 1: Stage D5 package**

Run: `git add docs/09_briefs/phase-2/2026-05-04-d5-ratification-package.md`

- [ ] **Step 2: Verify stage**

Run: `git status --short`
Expected:
```
A  docs/09_briefs/phase-2/2026-05-04-d5-ratification-package.md
```
Only D5 package staged; nothing else.

- [ ] **Step 3: Commit D5 package with single-purpose message**

Run:
```bash
git commit -m "$(cat <<'EOF'
docs(governance): D5 ratification package — Tier 5 (ADR-0018 Relationship Router) (Phase 0 Session 2C Task D5)

Single-ADR Tier 5 ratification package. Ratifies ADR-0018
(Relationship Router) at the post-C10a + C10b + C10c on-disk state.
Closes Q56 in full; cites Q28 / Q66 / Q76 / Q77 without re-closing.

Tier 6 (ADR-0019 Confidence Calibration Policy) splits to
Session 2D per the Session 2C calibrated handoff authorization.

§6 discoverability notes capture the C10a / C10b / C10c revision-
pass discipline and Candidate B's four validation surfaces this
session (codification-ready pending founder concurrence at session
closeout).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: Verify D5 commit + final state**

Run: `git log --oneline -2 && git status --short`
Expected:
- Top two commits are the new D5 package + new ADR-0018 commits
- `git status --short` is clean (no untracked files; no modified files)

If pre-commit hook fires and fails, fix the underlying issue and create a NEW commit.

---

## Task 6: Session 2C closeout handoff

**Files:** No new files; this task is reporting / handoff.

- [ ] **Step 1: Report Tier 5 closure**

Report to founder:
- Tier 5 ratified via D5 package; ADR-0018 + D5 package committed as separate single-purpose commits.
- Final two-commit chain since `fa8d2e5`: `<adr-0018-sha>` (ADR-0018) → `<d5-package-sha>` (D5 package).
- ADR-0018 final state: 1681 lines on disk, ratified 2026-05-04 by CTO.
- Phase 0 governance arc remaining: Tier 6 (ADR-0019) split to Session 2D.

- [ ] **Step 2: Surface candidate Z1 captures for session-closeout adjudication**

Surface the four-fire validation surface for Candidate B (count-metric authorship discipline; brainstorm-side count metrics drift-prone across cleanup-brief and ratification-package authoring contexts) to the founder for codification adjudication. Candidates A (cross-ADR section-number citation verification) and C (cross-ADR ownership-claim verification) hold at one validation surface each — surface for awareness but lower codification priority.

- [ ] **Step 3: Confirm handoff to Session 2D**

Confirm Session 2D handoff anchor:
- Branch: `worktree-phase-0-governance` at HEAD `<d5-package-sha>`
- Worktree path: `/home/philc/projects/chounting/.claude/worktrees/phase-0-governance`
- Tier 6 work to dispatch: ADR-0019 Confidence Calibration Policy drafting (closes Q57; ratifies Q65 provisional thresholds + ADR-0018 ambiguity-margin value at v1-ship gate per Q77 pattern).
- 11 Z1 captures from Sessions 2A/2B remain locked; up to three additional candidates in candidate state pending founder codification verdict.

---

## Self-Review

- **Spec coverage:** Each section of brainstorm-side's authored D5 package is preserved verbatim except for §2 / §7 (commit-chain corrections) and §6.10 (four-fire update). Each correction is enumerated explicitly in Task 1 Step 2 with the replacement text. No spec gaps.
- **Placeholder scan:** Task 1 Step 2 references "the brainstorm-side authored content from the conversation transcript" — this is a real reference to the session transcript that the executor has access to, not a TBD. All other steps contain exact commands, exact file paths, and exact replacement text where edits are involved.
- **Type consistency:** No code types in this plan; the consistency surfaces are commit hashes (eab7bad / 6934256 / e1111b3 / fa8d2e5 — verified against `git log a14d939..HEAD` output), Cleanup Commit numbering (4 / 5 / 6 / 7 — corrected per WSL-side surface), and revision-pass labels (C10a / C10b / C10c — used uniformly throughout). Verified consistent.
- **Scope check:** Tier 6 split to Session 2D is explicitly NOT in this plan's scope; Task 6 Step 3 confirms the handoff. The plan covers exactly Tier 5 D5 ratification and the post-ratification commits.
