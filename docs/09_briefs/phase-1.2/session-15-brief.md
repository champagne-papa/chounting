# Session 15 — Documentation Routing Convention + Workflow Vocabulary

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land a single ratification commit codifying documentation discipline (Documentation Routing convention) and naming the workflow hierarchy (Workflow Vocabulary glossary section), establishing authority for the upcoming friction-journal split.

**Architecture:** Pure documentation commit. Two coordinated artifacts (new section in `docs/04_engineering/conventions.md`; new section in `docs/02_specs/glossary.md`) plus one row appended to the Phase 1.2 Conventions Ratification Audit table. No code, no tooling, no `friction-journal.md` mutation. Legislate-then-enforce: this commit legislates; tooling and the split are explicit follow-ons.

**Tech Stack:** Markdown only. Pre-commit session-init script (`bash scripts/session-init.sh`). Standard git workflow per house convention.

---

**Anchor (parent) SHA:** `0367dcb4454d7e05632975d4e0b0b575caea09d3` — the SHA the brief was drafted against (i.e., the parent of the brief-creation commit). WSL must verify HEAD points at the brief-creation commit by checking that `git rev-parse HEAD~1` equals this anchor SHA. If `HEAD~1` does not match, STOP and surface to operator. (A self-referential SHA — the brief commit's own SHA — cannot be embedded in the brief without a SHA-amend loop, so the parent SHA is the stable anchor.)

**Note on quote markers:** Verbatim quoted text below uses standard `>` blockquote markers. When reproducing into `glossary.md` or commit messages, render only the content of those blocks, not the `>` markers.

---

## Session label
`S15-routing-convention` — continues the Phase 1.2 S-series; matches house labeling convention.

## Hard constraints (do not violate)

- **No mutation of `docs/07_governance/friction-journal.md`.** Not one line. The split is a separate commit. If you find yourself reading the friction journal, you've gone out of scope — STOP.
- **No refactor of existing conventions.** Add the new section only. Do not "clean up" existing convention prose, fix typos, or reorganize. Pure addition.
- **Match house style exactly for shape** (sentence-prose explanations, datapoint citations, composes-with section, first-codified attribution). One intentional style deviation is named in Task 3 preamble (long Rationale).
- **Do not write any code, scripts, or tooling.** This commit is policy. Tooling is a follow-on. The convention commits to tooling but does not deliver it.

---

## Task 1: Session-init and HEAD anchor

**Files:**
- Read: `scripts/session-init.sh` (only if it errors)

- [ ] **Step 1: Run session-init**

```bash
bash scripts/session-init.sh S15-routing-convention
```

Expected: success exit. If it errors, surface to operator before continuing.

- [ ] **Step 2: Confirm HEAD points at the brief-creation commit**

```bash
git rev-parse HEAD~1
```

Expected: output equals the **Anchor (parent) SHA** at the top of this brief (`0367dcb4454d7e05632975d4e0b0b575caea09d3`).

Also confirm the brief itself is at HEAD (not in an uncommitted state):

```bash
git log -1 --name-only --format='%H'
```

Expected: HEAD's single changed file is `docs/09_briefs/phase-1.2/session-15-brief.md`.

If either check fails, STOP and report per "Check HEAD before Step 2 Plan" convention.

---

## Task 2: Verification before drafting

Apply Spec-to-Implementation Verification (Convention #8) to every fact cited in the convention text. Each verification is its own step with an exact check. Surface any mismatches to operator before drafting begins. Do not "fix in place" — surfacing is the contract.

**Files:**
- Read: `docs/04_engineering/conventions.md`
- Read: `docs/07_governance/retrospectives/phase-1.2-retrospective.md`
- Read: `docs/02_specs/glossary.md`

- [ ] **Step 1: Verify cited file paths exist**

Run:
```bash
ls docs/04_engineering/conventions.md \
   docs/07_governance/adr/ \
   docs/07_governance/retrospectives/ \
   docs/02_specs/open_questions.md
ls docs/09_briefs/ | head
```

Expected: all paths resolve. The `phase-N/obligations.md` pattern is verified by checking `docs/09_briefs/phase-1.2/obligations.md` exists.

- [ ] **Step 2: Verify Convention #11 rename history**

Read `docs/04_engineering/conventions.md`. Confirm Convention #11's rename history is stated as: prior name "Per-Entry Pending-Orphan Preflight" → renamed to "Per-Entry Row-Card Pairing Post-Paste Verification" at C12 close.

If the rename history differs, STOP and surface to operator.

- [ ] **Step 3: Verify Meta A and Meta B landed at d2b2f50**

```bash
git show --stat d2b2f50 -- docs/04_engineering/conventions.md
```

Expected: commit d2b2f50 modifies `conventions.md` and the diff includes the Meta A and Meta B sections in the Phase 1.2 Conventions area.

If the commit SHA or content differs, STOP and surface to operator.

- [ ] **Step 4: Verify subsection-letter pattern (a)–(q) via retrospective §2**

Read `docs/07_governance/retrospectives/phase-1.2-retrospective.md` §2 ("Inheritance-artifact map") only.
**Do not read `friction-journal.md` itself.**

Confirm §2 enumerates subsections (a) through (p) (or (q)) as inheritance artifacts. Note the highest letter actually present in §2; the convention prose will cite the verified range.

- [ ] **Step 5: Verify friction-journal size claim (~435KB)**

```bash
wc -c docs/07_governance/friction-journal.md
```

Expected: byte count in the ~435KB range (±10% acceptable). Record the exact value for the Rationale paragraph. **Do not read the file content.**

- [ ] **Step 6: Verify Convention #8 has a "Structural references" category**

Read `docs/04_engineering/conventions.md`, locate Convention #8, confirm the bullet list of categories includes "Structural references" verbatim.

If absent, STOP and surface — the Composes-with bullet citing this category cannot land.

- [ ] **Step 7: Verify retrospective §3 has a Pattern 6**

Read `docs/07_governance/retrospectives/phase-1.2-retrospective.md` §3. Confirm a Pattern 6 exists. Record the title.

If §3 numbers Patterns differently, substitute the verified Pattern number in the archival rule example before drafting.

- [ ] **Step 8: Verify glossary.md does not already define "Phase", "Arc", "Session", "Step", "Sub-session"**

Read `docs/02_specs/glossary.md`. Grep for each term in alphabetical sections. If any of these are already defined with conflicting meaning, STOP and surface — Workflow Vocabulary collides.

- [ ] **Step 9: Verification report to operator**

Surface a single report to operator listing each verification step's outcome (PASS / MISMATCH-and-detail). Wait for operator acknowledgment before proceeding to Task 3. **Do not advance on MISMATCH without operator direction.**

---

## Task 3: Step 2 Plan — exact insertion points

Produce a planning report and wait for operator approval before any drafting.

**Files (read-only at this stage):**
- Read: `docs/04_engineering/conventions.md` (find insertion point)
- Read: `docs/02_specs/glossary.md` (find insertion point)

- [ ] **Step 1: Identify the conventions.md insertion point**

Locate the line in `conventions.md` immediately before the Governance Audit table. Record the line number.

The proposed insertion is a new top-level `## Documentation Routing` section, placed **after** the Phase 1.5A and Phase 1.2 conventions sections, **before** the Governance Audit table. **Not under "Phase 1.2 Conventions"** — Documentation Routing is documentation-discipline (governs all phases), not phase-execution-discipline.

Placement rationale (operator pre-approved): per-phase convention headings catalog execution-discipline conventions earned during a phase. Documentation Routing is a different category and deserves its own top-level heading.

- [ ] **Step 2: Identify the glossary.md insertion point**

Locate the end of the existing alphabetical "## W" section in `glossary.md`. Record the line number.

The proposed insertion is a new `## Workflow Vocabulary` H2 immediately after the alphabetical W section. The top-level Index of `glossary.md` gets one new line pointing readers to this section.

- [ ] **Step 3: Compose the ratification audit row text**

Row to append to the existing `### Phase 1.2 Conventions — Ratification Audit` table:

| Convention | Landed in commit | Ratification date | Governance cycle |
|------------|------------------|-------------------|------------------|
| Documentation Routing | (this commit) | 2026-04-26 | C12 closeout follow-on; codified pre-friction-journal-split as the routing authority for the split commit |

- [ ] **Step 4: Surface the plan to operator**

Report the three insertion points (line numbers), expected diff scope (files touched + approximate lines added), and the audit row text. Wait for operator approval.

**Do not begin drafting until operator approves the plan.**

---

## Task 4: Draft the Documentation Routing convention

**Style-tension acknowledgment to apply before drafting.** This convention deviates from the compact-rationale norm of existing Phase 1.2 conventions because the codification evidence is statistical (file size, drift class count, absorption pattern frequency) rather than incident-based. The deviation is intentional and one-off; future drift-evidence conventions inherit the long-rationale exception, but execution-discipline conventions continue to use compact rationale. Match the rest of the house style (sentence-prose explanations, datapoint citations, composes-with section, first-codified attribution) exactly.

**Section structure:** 7 H3 subsections, then trailing inline paragraphs (bolded labels, no H3) for Rationale / Composes with / First codified — matching every Phase 1.2 convention's trailing-paragraph shape.

**Files:**
- Modify: `docs/04_engineering/conventions.md` (insert at the line identified in Task 3 Step 1)

- [ ] **Step 1: Draft the section header**

Insert a new `## Documentation Routing` H2 at the planned insertion point.

- [ ] **Step 2: Draft `### Routing rule`**

```markdown
### Routing rule

Each observation has a single load-bearing home. Other surfaces may contain summarized projections that point at the canonical source, but the substantive content lives at exactly one location.

Routing destinations:

- Raw friction signal (CLUNKY/WANT/WRONG/NOTE on a specific moment) → `friction-journal.md`. Append-only; format `[date] [category] [one-line description]` per the file header. Active phase only — closed phases archive per the archival rule below.
- Repeatable rule earned by 2–3 fires → `04_engineering/conventions.md`. Match the existing voice.
- Architectural decision crossing more than one arc → `07_governance/adr/NNNN-<slug>.md`. See `07_governance/adr/README.md` for format.
- Phase- or arc-scope reflection → `07_governance/retrospectives/<scope>-retrospective.md`. Four-section shape per the Phase 1.2 retrospective template.
- Unresolved question → `02_specs/open_questions.md`.
- Inheritance carry-forward → `09_briefs/phase-N/obligations.md`.
```

- [ ] **Step 3: Draft `### Write-time tripwires`**

```markdown
### Write-time tripwires

Three policy tripwires plus a fallback rule:

1. **The 10-second rule.** A single friction-journal entry must be readable in roughly 10 seconds. Format `[date] [category] [one-line description]` with optional 2–3 line elaboration; entries longer than ~10 lines are signal that content belongs elsewhere. Apply at write-time.
2. **No embedded retrospectives in the journal.** Sub-section headings like `### (a) Outcome summary` inside the friction journal are signal that content has overshot its container.
3. **Closeout artifacts route by purpose.** A closeout commit may produce a retrospective (long prose), conventions (codified rules), an obligations entry (carry-forward), and a `CURRENT_STATE.md` update — each lands at its correct surface. Bundling them into a friction-journal section is a routing failure.

**Fallback rule (capture-first).** If routing is unclear at write-time, capture the observation in `friction-journal.md` with a `[ROUTE?]` tag and resolve later. Unresolved `[ROUTE?]` tags are resolved at session close (route to canonical destination or explicitly mark `[ROUTE: stays-in-journal]` with rationale). The phase-end hygiene pass (see below) audits that no tags survive across sessions; tags that survive the hygiene pass itself are a discipline violation requiring retroactive resolution.
```

- [ ] **Step 4: Draft `### Codification thresholds`**

```markdown
### Codification thresholds

- **N=2** — split-trigger threshold (sub-types graduate to own conventions on second instance).
- **N=3** — codification threshold (friction-journal pattern → `conventions.md` entry).
- **N=5** — meta-shape review threshold (re-evaluate when sub-type list reaches five).

These are working thresholds, not laws. Convention #10's retraction sub-track was grandfathered at 8 datapoints; author judgment governs edge cases.
```

- [ ] **Step 5: Draft `### Hygiene cadence`**

```markdown
### Hygiene cadence

A phase-end hygiene pass is required at every phase close. The pass:

1. Resolves any `[ROUTE?]` tags that have survived their session-close clearing requirement.
2. Reviews convention threshold candidates (patterns at 2+ datapoints not yet codified).
3. Prunes obligations that have been completed or invalidated.
4. Verifies cross-references from `conventions.md` to friction-journal subsections still resolve.

Lands as part of the phase closeout commit set, alongside the phase retrospective.

**Tooling floor.** Policy alone decays without tooling. A follow-on commit will deliver minimum viable tooling supporting this hygiene cadence:

- **Line-length check** — script flagging any single bullet item in `friction-journal.md` exceeding ~10 lines.
- **`[ROUTE?]` tag scanner** — script listing unresolved tags in the active journal, with a non-zero exit at phase close if any survive.
- **Heading detector** — script flagging `###` or `####` headings inside `friction-journal.md` (signal that retrospective content has been embedded).

These are minimums. Additional tooling may follow.
```

- [ ] **Step 6: Draft `### Archival rule`**

```markdown
### Archival rule

When a phase closes:

1. That phase's friction-journal section moves to `friction-journal/phase-X.md` in the same commit as the phase retrospective.
2. Archived sections preserve their original lettering (sections (a) through (q) keep those letters in the archive) so prior citations resolve without rewriting.
3. Long-prose subsections already absorbed into the phase retrospective are stubbed in the archive with a one-line pointer (e.g., "Section (p): captured in `phase-1.2-retrospective.md` §3 Pattern 6.") rather than duplicated.
4. Citations from `conventions.md` to friction-journal subsections that have been absorbed into a retrospective are rewritten to point at the retrospective subsection, not the archive stub.
```

If Task 2 Step 7 verified a different Pattern number for the §3 example, substitute that number in clause 3 before writing.

- [ ] **Step 7: Draft `### Deprecation model`**

```markdown
### Deprecation model

Conventions can be retired via three distinct paths, each with explicit lineage:

- **Deprecated.** Convention is no longer applicable (e.g., the underlying system was redesigned and the discipline is moot). Convention text retains in `conventions.md` with a `**DEPRECATED** as of <date>; reason: <reason>` header and is moved to a "Deprecated Conventions" section at end of file.
- **Superseded.** Convention is replaced by a different convention that handles the same problem differently. Original convention links to its successor; successor cites its predecessor. Same lineage shape as ADR supersession.
- **Merged.** Two or more conventions combine into one, typically when their codification-trigger evidence is found to be the same underlying pattern. The merge is recorded in the surviving convention's body; the merged-out conventions become one-line stubs pointing at the survivor. Convention #11's rename (Per-Entry Pending-Orphan Preflight + post-paste-verification finding → Per-Entry Row-Card Pairing) is the originating instance, codified retroactively here.

All three paths require a Governance Audit row.
```

- [ ] **Step 8: Draft `### Known limitations`**

```markdown
### Known limitations

This convention defers three concerns. Each is named explicitly so future review knows where to revisit:

- **Ownership model deferred.** In current solo-dev-with-Claude operation, ownership collapses to the operator. Deferred — will be addressed when warranted, with full review at that time.
- **Read-path design deferred.** This convention covers write discipline. Navigation/usage patterns (onboarding read path, debugging read path, decision-history read path) live in `docs/04_engineering/DEV_WORKFLOW.md`. Deferred — will be addressed when warranted, with full review at that time.
- **Priority gradient deferred.** All conventions are currently flat (no CRITICAL/HIGH/LOCAL tagging). Deferred — will be addressed when warranted, with full review at that time.
```

- [ ] **Step 9: Draft trailing **Rationale** paragraph**

```markdown
**Rationale.** Source evidence: across Phase 1.1 + Phase 1.2 + Arc A (2026-04-12 through 2026-04-26), the friction journal grew from ~85 entries / ~42KB to 16+ lettered subsections + ~435KB. Three classes of drift produced the bloat:

1. **Closeout absorption.** Friction-journal sections (o) and (p) hold the C7 closeout deliverables and the C11 retrospective on C7 EC-13 — long-prose retrospective material whose correct home is `phase-1.2-retrospective.md`. Section (p) alone is ~550 lines.
2. **Session-closeout absorption.** Subsections (m) and (n) hold session-closeout narratives that should have routed either to inline `CURRENT_STATE.md` recaps (short) or to the phase retrospective (long).
3. **Convention codification source absorption.** Subsection (h) holds the 7 EC-direction sub-track datapoints; subsection (i) holds Convention #11's codification source. These belong in `conventions.md` once codified.

The friction journal's value is fast pattern recognition — scanning ~50 entries in seconds to spot recurring pain. That value is degraded by embedded essays. Splitting by purpose (this rule) restores the property; splitting by size alone would not, because the genres would re-mix in the new files.

`phase-1.2-retrospective.md` §2 ("Inheritance-artifact map") explicitly enumerates subsections (a)–(p) as inheritance artifacts rather than as journal entries — naming the absorption pattern at phase close. This convention codifies the discipline that prevents re-absorption going forward.

The codification threshold for this convention itself: the routing rule did not fire 3 times in the conventional sense (the convention governs documentation discipline rather than execution discipline), but the absorption pattern fired three times across the three classes above. Threshold met by drift evidence, not by violation count.
```

If Task 2 Step 5 returned a substantially different size, replace `~435KB` with the verified value (rounded to nearest 5KB).
If Task 2 Step 4 verified the highest subsection letter as something other than (p), update the (a)–(p) range in the second paragraph accordingly.

- [ ] **Step 10: Draft trailing **Composes with** paragraph**

```markdown
**Composes with.**

- **Mutual Hallucination-Flag-and-Retract Discipline (Convention #10)** — EC-direction sub-track qualifies what the journal records under uncertainty; this convention governs where the record lives. Both apply at write-time.
- **PARTIAL Closure State-Decomposition (Meta A)** — closeout records produced under Meta A decomposition route to phase retrospective, obligations queue, and `CURRENT_STATE.md` — not to the friction journal.
- **Scoping-Time Cross-Dependency Articulation (Meta B)** — scoping docs are themselves a routing destination (under `09_briefs/phase-N/`).
- **Spec-to-Implementation Verification (Convention #8)** — citations from `conventions.md` to friction-journal subsections that have been archived or absorbed must be re-grepped and rewritten under Convention #8's "Structural references" category.
```

- [ ] **Step 11: Draft trailing **First codified** paragraph**

```markdown
**First codified.** This commit, 2026-04-26 (post-C12, pre-Phase-2 opening). Drafted in response to friction-journal drift surfaced by `phase-1.2-retrospective.md` §2 inheritance-artifact map. The first concrete application is the Phase 1.2 friction-journal split (follow-on commit, separate session). The split commit cites this convention as authority and applies the archival rule to close Phase 1.2's friction-journal scope.
```

---

## Task 5: Draft the Workflow Vocabulary glossary section

**Files:**
- Modify: `docs/02_specs/glossary.md` (insert at the line identified in Task 3 Step 2; update top-level Index)

- [ ] **Step 1: Add the new section header and disambiguation sentence**

Insert a new `## Workflow Vocabulary` H2 immediately after the alphabetical "## W" section. Open with this disambiguation sentence verbatim (reproduce content only, not the `>` marker):

> Phase is the primary planning unit; arcs are execution threads that may cross phase boundaries. The two are complementary: phases bound scope, arcs bound continuous bodies of work.

- [ ] **Step 2: Draft Top-level work units**

```markdown
**Top-level work units:**

- **Arc.** A continuous body of work spanning one or more sessions; bounded by an objective and a closeout. Examples: Arc A (Phase 0–1.1 Control Foundations), the Coordination Arc (2026-04-22), the O3 Arc (2026-04-22). May cross phase boundaries. Has its own retrospective at close (e.g., `arc-A-retrospective.md`).
- **Phase.** A numbered scope-bounded chunk of work crossing the whole project (Phase 1.1, 1.2, 1.5A/B/C, 2). Has a master brief, exit criteria matrix, and a phase retrospective. May contain multiple Arcs; an Arc may also span Phases.
- **Session.** One focused chat conversation against a brief or sub-brief. Has a session label (per Session Labeling Convention). Often produces 1–N commits. Bounded by context-window or by founder pause.
- **Sub-session.** A session carved mid-thread when scope expands or context budget compresses. Use only when the carve is durable. Example: Session 7.1 was a sub-session because it carved Commits 4–5 from Session 7 mid-thread when scope expanded to 7.1.1 and 7.1.2. A within-session pivot from one task to another is not a sub-session.
- **Step.** A numbered unit within an Arc's brief (Arc A Step 7, Step 12b). Arc-specific vocabulary; Phases use Sessions instead of Steps.
- **Commit.** Atomic change, one per logical unit. Carries a session label as Git trailer per Session Labeling Convention.
```

- [ ] **Step 3: Draft Process/coordination units**

```markdown
**Process/coordination units:**

- **Brief.** The spec a session executes against. Master briefs at `09_briefs/phase-X/brief.md`; sub-briefs at `09_briefs/phase-X/session-N-brief.md`. Scoping docs are a special class of brief authored mid-phase for unscoped work (e.g., `oi-3-class-2-fix-stack-scoping.md`).
- **Gate.** A verification checkpoint. Named gates in current use: ratification gate, screenshot gate, push-readiness gate, founder review gate. Gates are checkpoints with explicit pass/fail criteria.
- **Tripwire.** A write-time check that triggers when a discipline is violated (10-second rule, file-top staleness check, `[ROUTE?]` tag survival past session close). Gates are checkpoints; tripwires are continuous.
```

- [ ] **Step 4: Draft Quality/discipline units**

```markdown
**Quality/discipline units:**

- **Convention.** A codified rule earned by 2–3 fires of the same pattern. Lives in `04_engineering/conventions.md`. See Documentation Routing (this commit) for codification thresholds.
- **ADR.** Already defined in §A above. Cross-reference: ADRs are for architectural decisions crossing more than one arc; conventions are for repeatable execution rules within or across arcs.
- **Invariant.** Already defined implicitly via INV-* identifiers in `ledger_truth_model.md` and `invariants.md`. A system property enforced by code.
- **Exit Criterion (EC).** A numbered acceptance test for a phase. The Phase 1.2 EC matrix (`docs/09_briefs/phase-1.2/ec-matrix.md`) is the reference shape.
```

- [ ] **Step 5: Draft Issue/observation units**

```markdown
**Issue/observation units:**

- **Friction entry.** A single short observation in `friction-journal.md`. Tagged WANT/CLUNKY/WRONG/NOTE per the file header.
- **Pattern.** A recurring observation across 2+ datapoints; below codification threshold but worth tracking. Promotes to Convention at N=3 fires.
- **Datapoint.** One specific instance of a pattern firing. Conventions cite codification-trigger datapoints inline (typically 3 for first codification).
- **Open question.** An unresolved question logged in `02_specs/open_questions.md`. Carries forward across sessions; resolved via ADR, Convention, or explicit closeout entry.
- **Obligation.** A carry-forward item promoted from one phase to the next via `09_briefs/phase-N/obligations.md`.
```

- [ ] **Step 6: Draft Failure/finding units**

```markdown
**Failure/finding units:**

- **Bug.** A defect in shipped code. Identified by description, not number.
- **Finding.** An audit observation. Has a UF-NNN identifier (e.g., UF-001 in the Phase 1.1 audit).
- **Class.** A categorized failure mode (Class 1 OI-2 stall, Class 2 structural-response-invalid). Class numbers are scoped to a phase or workstream; not globally unique.
- **OI (Output Issue).** An observed agent-behavior issue requiring investigation. Numbered OI-N within a phase (OI-2, OI-3). Bigger than a Bug, smaller than a Workstream.
- **Workstream.** A Phase-2-style named opening (OI-3 fix-stack, Class 2 fix-stack). Bigger than an EC, smaller than a Phase. Has its own scoping doc and exit criteria.
```

- [ ] **Step 7: Update the glossary's top-level Index**

Add a single new line to the glossary's Index pointing at `## Workflow Vocabulary`, matching the existing Index format (e.g., a bullet or a table row depending on the file's existing pattern). Do not reorganize the rest of the Index.

---

## Task 6: Add the Governance Audit row

**Files:**
- Modify: `docs/04_engineering/conventions.md` (`### Phase 1.2 Conventions — Ratification Audit` table)

- [ ] **Step 1: Append the new row**

Add this row to the existing table:

| Convention | Landed in commit | Ratification date | Governance cycle |
|------------|------------------|-------------------|------------------|
| Documentation Routing | (this commit) | 2026-04-26 | C12 closeout follow-on; codified pre-friction-journal-split as the routing authority for the split commit |

**Note:** Documentation Routing is being placed under its own top-level heading (`## Documentation Routing`), but its ratification audit row lives in the Phase 1.2 ratification table because that's the active governance audit surface. When/if a "Documentation Conventions Ratification Audit" surface is created later, this row may migrate. Until then, the Phase 1.2 audit table is the single source of ratification truth.

This explanatory note may be added as a paragraph immediately under the audit table, or omitted if it duplicates existing audit-table prose.

---

## Task 7: Founder review gate (no commit yet)

**Files:**
- Read-only: `docs/04_engineering/conventions.md`, `docs/02_specs/glossary.md`

- [ ] **Step 1: Diff scope check**

```bash
git status --short
git diff --stat
```

Expected: only `docs/04_engineering/conventions.md` and `docs/02_specs/glossary.md` modified. **If `docs/07_governance/friction-journal.md` appears, STOP — hard constraint violated.**

- [ ] **Step 2: Surface to operator for review**

Present to operator:

1. Full prose of the new Documentation Routing section in `conventions.md`.
2. Full prose of the new Workflow Vocabulary section in `glossary.md`.
3. The Index update in `glossary.md`.
4. The audit row addition.

Wait for operator approval. **Do not commit before approval.**

- [ ] **Step 3: Apply revisions if requested**

If operator requests revisions, apply them in this same session. Re-run Step 1 (diff scope check) after every revision pass. Re-surface for re-approval.

---

## Task 8: Commit

**Files:**
- Modify: (already-staged changes from Tasks 4, 5, 6)

- [ ] **Step 1: Stage the two files explicitly**

```bash
git add docs/04_engineering/conventions.md docs/02_specs/glossary.md
git status --short
```

Expected: only the two named files staged.

- [ ] **Step 2: Create the commit**

```bash
git commit -m "$(cat <<'EOF'
docs(governance): codify documentation routing + workflow vocabulary

- adds Documentation Routing convention (routing rule, tripwires,
  thresholds, hygiene cadence, archival, deprecation model,
  known limitations)
- introduces fallback [ROUTE?] tagging with session-close clearing
  and phase-end hygiene audit
- defines tooling floor (line-length + route-tag + heading-detector
  scripts) and phase-end hygiene cadence
- softens "single home" to "load-bearing home + summarized projections"
- adds Workflow Vocabulary section to glossary (Phase/Arc/Session
  hierarchy clarified; Step scoped to Arc-only; sub-session example)
- establishes authority for the upcoming friction-journal split
- does not split friction-journal.md (separate follow-on commit)
- does not deliver tooling (separate follow-on commit)

Session: S15-routing-convention

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Verify the commit landed**

```bash
git log -1 --stat
```

Expected: commit subject matches; only `docs/04_engineering/conventions.md` and `docs/02_specs/glossary.md` listed.

---

## Task 9: Post-commit operator validation (mental simulation)

**Files:** none

- [ ] **Step 1: Surface the simulation prompt to operator**

> Take 3 real examples — a recent friction entry, a borderline retrospective section, a convention candidate. Ask: "Where does this go under the new rule?" If any hesitation → tweak wording before the split.

- [ ] **Step 2: If revisions are needed, amend the commit**

```bash
# After applying any revision edits to the two doc files:
git add docs/04_engineering/conventions.md docs/02_specs/glossary.md
git commit --amend --no-edit
```

Single-author, single-session, no force-push concerns. Re-surface to operator after amend.

- [ ] **Step 3: Confirmation**

Once the simulation passes cleanly, surface to operator: convention is ratified; the next session may open for the friction-journal split.

---

## Out of scope (do not do)

- Modifying `friction-journal.md` in any way.
- Modifying any existing convention prose.
- Writing tooling scripts, even minimal ones.
- Updating `INDEX.md` (separate follow-on; INDEX update is currently stale across many surfaces and deserves its own scoped commit).
- Updating `CURRENT_STATE.md` (the convention's existence will be reflected when CURRENT_STATE is next updated; not part of this commit).
- Creating `DEV_WORKFLOW.md` (named as deferred; lives in its own future commit).

## Halt conditions

Stop and surface to operator if:

- Any verification claim in Task 2 fails.
- Drafting reveals an inconsistency between the proposed convention text and existing conventions (especially Convention #8, #10, #11, Meta A, Meta B).
- The Workflow Vocabulary terms collide with existing glossary entries (e.g., "Phase" already defined alphabetically with a different meaning).
- House-style match would require contorting the prose — prefer surfacing to operator over forcing the match.
- Diff scope check (Task 7 Step 1) shows `friction-journal.md` modified. Hard-constraint violation; revert and resurface.
