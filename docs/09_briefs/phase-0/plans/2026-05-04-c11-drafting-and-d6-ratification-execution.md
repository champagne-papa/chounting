# C11 Drafting + D6 Ratification Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land Tier 6 of the chounting Phase 0 governance arc — author ADR-0019 (Confidence Calibration Policy) against the committed design spec at `dc2e1fb` as authoritative input; manage the C11 drafting cycle + possible C11a/b/c hygiene revision passes; author the D6 ratification package; await founder D6 verdict; commit ADR-0019 + D6 package + execution plan as separate single-purpose commits per the Session 2C 4-commit precedent. Phase 0 closure is on the immediate horizon after Tier 6 ratifies — pending verification of the eight non-Tier-6 exit criteria.

**Architecture:** WSL-side / brainstorm-side coordination flow. The committed design spec at `dc2e1fb` (`docs/superpowers/specs/2026-05-04-adr-0019-confidence-calibration-policy-design.md`, 439 lines) consolidates the eight locked design sections from Session 2D brainstorming + Z1 #12 fire log + 3 active deferred-verification surfaces + candidate-codification observations + length calibration target (1400–2000 lines, density beats raw line count per Z1 #9). The C11 drafting subagent translates the spec's §0–§13 structural map into the ADR's substantive structure; brainstorm-side reviews the returned draft; possible C11a/b/c hygiene revision passes per the C10/C10a/b/c precedent; D6 ratification package authoring; founder D6 verdict; post-ratification commits.

**Tech Stack:** git, bash (grep, wc, git log/status/add/commit), markdown. No code; no tests in the conventional TDD sense — verification is byte-level grep against authored content per Z1 #11 prophylactic-grep + Z1 #12 count-metric authorship discipline. Subagent dispatch via the general-purpose subagent type per the C10 precedent.

---

## File Structure

| Path | Action | Responsibility |
|---|---|---|
| `docs/07_governance/adr/0019-confidence-calibration-policy.md` | Create | ADR-0019 substantive content. Authored by C11 drafting subagent against the `dc2e1fb` spec. Possible byte-level Edit revisions during C11a/b/c hygiene cycles. Single-purpose commit at D6 ratification. |
| `docs/09_briefs/phase-2/2026-05-04-d6-ratification-package.md` | Create | D6 ratification package — single-ADR scope per D5 precedent. Authored by brainstorm-side after C11 drafting cycle closes clean. Single-purpose commit at D6 ratification. |
| `docs/superpowers/plans/2026-05-04-c11-drafting-and-d6-ratification-execution.md` | This file | Execution plan; precedent-preserving artifact per the D5 plan at `c79ecfc`. Single-purpose commit at Session 2E closeout. |
| `docs/09_briefs/phase-2/2026-05-04-session-2e-opening-prompt.md` (conditional) | Create | Session 2F opening prompt if Phase 0 closure does NOT happen in Session 2E (e.g., if non-Tier-6 exit-criteria verification surfaces drift requiring follow-up). Per the Session 2C → 2D handoff precedent at `17b43cd`. Single-purpose commit at Session 2E closeout. |

No edits to other files unless C11a/b/c hygiene cycles surface byte-level drift in the new ADR.

---

## Pre-flight Verification (Z1 #11 prophylactic at plan start)

Before dispatching the C11 subagent, verify the worktree state matches the expected Session 2E start state:

- [ ] **Step P-1: Verify worktree state**

Run: `git status --short && git log --oneline -4 && git rev-parse HEAD`

Expected:
```
(empty - working tree clean)
---
dc2e1fb docs(spec): ADR-0019 Confidence Calibration Policy design spec (Phase 0 Session 2D closeout artifact)
17b43cd docs(handoff): Session 2D opening prompt — Tier 6 ADR-0019 (Phase 0 Session 2C closeout artifact)
c79ecfc docs(plan): D5 ratification execution plan (Phase 0 Session 2C closeout artifact)
93efce8 docs(governance): D5 ratification package — Tier 5 (ADR-0018 Relationship Router) (Phase 0 Session 2C Task D5)
---
dc2e1fb...
```

If anything diverges, STOP and surface back to brainstorm-side / founder per Z1 #10 before proceeding.

- [ ] **Step P-2: Verify spec on disk**

Run: `wc -l docs/superpowers/specs/2026-05-04-adr-0019-confidence-calibration-policy-design.md`

Expected: `439 docs/superpowers/specs/...`. The spec is the authoritative input artifact for C11 drafting.

- [ ] **Step P-3: Q-status verification (Z1 #12 prophylactic against citation drift)**

Run: `grep -n "^### Q57\|^### Q65\|^### Q73\|^### Q23\|^### Q24\|^### Q77\|^### Q79" docs/02_specs/open_questions.md`

Expected: each Q-number found at exactly one line; Q57 / Q65 / Q73 / Q77 / Q79 should still be open (not closed); Q23 / Q24 should be in their filed state (closed by `agent_autonomy_model.md` or open per the locked Phase 0 framing).

If any Q-status diverges from the spec's framing, surface back before C11 dispatch — citation drift in the spec would propagate into the C11 brief.

- [ ] **Step P-4: Verify ADR-0014 + ADR-0017 + ADR-0018 byte-level citation anchors**

Run sequentially:
```
grep -n "^### 7\." docs/07_governance/adr/0014-tier-2-document-pipeline.md
grep -n "^### 4\." docs/07_governance/adr/0017-vendor-template-substrate.md
grep -n "^### 3\.\|^### 4\." docs/07_governance/adr/0018-relationship-router.md
```

Expected: ADR-0014 Decision item 7 = "Document-type classification strategy (Q71)" (Q65 closure within); ADR-0017 Decision item 4 = "Post-v1 enforcement (explicitly forward-pointed; NOT specified here)"; ADR-0018 Decision item 3 = "Subsystem 2 — Ambiguity Resolution"; ADR-0018 Decision item 4 = "Subsystem 3 — Re-Evaluation Logic (Q56 closure)".

If any anchor location differs from the spec's framing, surface back before C11 dispatch — byte-level citation correctness in the C11 brief depends on these anchor verifications.

---

## Task 1: Author C11 Drafting Brief (brainstorm-side)

**Files:** None modified by WSL-side; brainstorm-side authors the C11 drafting brief content for subagent dispatch.

- [ ] **Step 1: Brainstorm-side authors the C11 drafting brief**

Brainstorm-side authors the C11 drafting brief that the WSL-side subagent dispatch will use as the subagent's commission prompt. The brief structure follows the C10 drafting prompt precedent:

- **Calibration shape declaration upfront** per Z1 #9: ADR-0019 inherits broader-scope target band (1400–2000 lines) per Tier 5/Tier 6 algorithm-apex framing; lower-band density preferred where compatible with substantive coverage.
- **Authoritative input artifact**: spec at `dc2e1fb` (path: `docs/superpowers/specs/2026-05-04-adr-0019-confidence-calibration-policy-design.md`); subagent reads the spec verbatim as the design source of truth.
- **ADR structural map**: 8 Decision items mapping to spec §1–§8 (Context / Decision summary / Calibration surfaces / First calibration cycle / Authority / Audit + reproducibility / Immutability + retroactivity / Anti-overscope) plus standard ADR sections (Status / Triggered by / Phase 0 dependency context / Reading B preservation / Decision / Schema deltas / Cross-references / Closes / Anti-overscope discipline / Consequences / Alternatives considered / Notes for future ADR writers).
- **Authorship discipline**: cite by section/label form not positional; lifecycle vocabulary canonical from `mutation_lifecycle.md` only; schema-decision discipline (6 reserved `org_settings.*` columns + 3 audit events explicit per Z1 #5); Reading B preservation triple-redundant (canonical audit-log writer per ADR-0011 §1; existing org_settings.* writer; platform-team-executed cycle process; no new service per refined Framing 2); Status format `## Status` heading + paragraph body.
- **Pre-flight verification (Z1 #11 prophylactic)**: subagent must byte-level verify all count metrics + section-number citations against the spec content + dependency ADRs before authoring.

- [ ] **Step 2: Brainstorm-side runs Z1 #12 byte-level verification on the C11 brief**

Per Z1 #12 discipline, brainstorm-side byte-level verifies all count metrics in the C11 brief against the `dc2e1fb` spec content before WSL-side dispatches. Catching surface = brainstorm-side at the next layer down from authoring.

- [ ] **Step 3: WSL-side concurrence on the C11 brief**

WSL-side reviews the brief for executor-side feasibility (no implicit assumptions about subagent capabilities; explicit hard constraints; explicit return shape). Surface any concerns before dispatch per the role split.

---

## Task 2: Dispatch C11 Drafting Subagent (WSL-side)

**Files:**
- Create: `docs/07_governance/adr/0019-confidence-calibration-policy.md` (subagent writes)

- [ ] **Step 1: Pre-dispatch grep verification**

Run sequentially:
```
git status --short
wc -l docs/superpowers/specs/2026-05-04-adr-0019-confidence-calibration-policy-design.md
ls -la docs/07_governance/adr/0019-confidence-calibration-policy.md 2>&1 | head -5
```

Expected:
- `git status --short`: empty.
- Spec line count: 439.
- ADR-0019 file does NOT exist yet.

- [ ] **Step 2: Dispatch the C11 subagent**

Use the `Agent` tool with `subagent_type: general-purpose`. Prompt = the C11 drafting brief authored by brainstorm-side at Task 1 + WSL-side's standard subagent commissioning preamble (working directory; hard constraints; pre-flight verification requirements; required reads for dependency ADRs; return shape).

The commissioning preamble structure:

```
You are commissioned to draft ADR-0019 Confidence Calibration Policy on the chounting Phase 0 governance worktree.

Working directory: /home/philc/projects/chounting/.claude/worktrees/phase-0-governance
Branch: worktree-phase-0-governance at HEAD dc2e1fb

Hard constraints:
- Use the Write tool to create exactly ONE file: docs/07_governance/adr/0019-confidence-calibration-policy.md
- Do NOT touch any other file. No edits to ADRs, specs, briefs, or anywhere else. Surface out-of-scope drift back per Z1 #10; do NOT auto-fix.
- Do NOT make any git commits.
- Do NOT create scratch notes or helper files.

Required reads BEFORE drafting:
- docs/superpowers/specs/2026-05-04-adr-0019-confidence-calibration-policy-design.md (authoritative input)
- docs/07_governance/adr/0014-tier-2-document-pipeline.md (Decision item 7 Q65 anchor)
- docs/07_governance/adr/0017-vendor-template-substrate.md (Decision item 4 vendor-template forward-pointer)
- docs/07_governance/adr/0018-relationship-router.md (Decision items 3 + 4 ambiguity-margin + Subsystem 3)
- docs/07_governance/adr/0011-document-platform.md (§1 entity ownership + §7 ProposedAttachment + §9 immutability + §13 exception queue)
- docs/07_governance/adr/0007-three-tier-agent-architecture.md (Tier 2.5 contract)
- docs/07_governance/adr/0010-reserved-enum-states.md (reserved-enum discipline)
- docs/02_specs/open_questions.md (Q57 / Q65 / Q73 / Q77 / Q79 status)
- docs/02_specs/agent_autonomy_model.md (Q23 / Q24 cross-references)

Pre-flight verification (Z1 #11 prophylactic):
Before authoring, verify all count metrics + section-number citations from the spec match the on-disk dependency-ADR state. Report any drift; do NOT proceed if drift found.

Return shape:
1. Pre-flight verification results.
2. Confirmation ADR-0019 was written to the prescribed path.
3. Final line count.
4. Out-of-scope findings (if any).
5. Ambiguity-resolution decisions (if any).

[C11 drafting brief content from Task 1 follows]
```

- [ ] **Step 3: Verify subagent return**

Subagent returns execution report. WSL-side performs independent verification:
```
wc -l docs/07_governance/adr/0019-confidence-calibration-policy.md
git status --short
head -5 docs/07_governance/adr/0019-confidence-calibration-policy.md
```

Expected:
- Line count within Z1 #9 broader-scope band 1400–2000.
- `git status --short`: shows `?? docs/07_governance/adr/0019-confidence-calibration-policy.md` as the only newly-untracked file.
- File starts with `# ADR-0019: Confidence Calibration Policy` heading.

If line count is below 1100 or above 2200, surface to brainstorm-side as a calibration concern (not blocking; brainstorm-side review may re-calibrate or accept density-over-length).

- [ ] **Step 4: Surface execution receipt to brainstorm-side**

Report to brainstorm-side: per-step success table, subagent's pre-flight verification results, line count, out-of-scope findings (if any), ambiguity-resolution decisions (if any). No commit yet; brainstorm-side reviews the draft.

---

## Task 3: Brainstorm-side C11 Draft Review (CTO-loop turn 1 verdict)

**Files:** None modified by WSL-side this task; brainstorm-side reads the on-disk ADR-0019 draft.

- [ ] **Step 1: Brainstorm-side reads the C11 draft**

Brainstorm-side reads the full on-disk ADR-0019 draft via filesystem MCP. Verifies:
- Structural fidelity to the `dc2e1fb` spec's §0–§13 mapping.
- Citation discipline (label-based; no §6/§7 drift like the C10 surfaces).
- Lifecycle vocabulary (canonical mutation states only; no new lifecycle terms).
- Schema-decision discipline (6 reserved columns + 3 audit events surfaced explicitly).
- Reading B preservation (no new service per refined Framing 2; canonical audit-log writer per ADR-0011 §1).
- Cross-ADR boundary harmonization with ADR-0014 / ADR-0017 / ADR-0018 / ADR-0011 / ADR-0007 / ADR-0010.
- Z1 #12 byte-level count-verification pass on all count assertions in the draft.

- [ ] **Step 2: Brainstorm-side issues review verdict (CTO-loop turn 1)**

Three possible verdict shapes per the C10 precedent:

- **Verdict A — Approve as-is.** No revisions needed. Proceed to Task 4 (founder verdict).
- **Verdict B — Approve with named revisions (C11a hygiene cycle).** Brainstorm-side authors byte-level oldText/newText pairs; brief surfaced for founder concurrence; Task 4 (founder verdict on C11 draft) proceeds AFTER C11a cycle lands clean.
- **Verdict C — Reject / re-author.** Substantive concerns surface; new C11 dispatch cycle. Budget impact: pushes to Session 2F.

- [ ] **Step 3: Surface verdict to founder**

Brainstorm-side surfaces the verdict + supporting rationale. WSL-side stands by for founder direction.

---

## Task 4: Founder Verdict on C11 Draft (CTO-loop turn 1 ratification)

**Files:** None modified.

- [ ] **Step 1: Stand by for founder verdict**

The founder reviews the C11 draft (or brainstorm-side's verdict on it under Verdict B) and issues one of:

- **Founder approve as-is** (or approve C11a refinements) → Task 5 (D6 ratification package authoring).
- **Founder approve with named follow-ups (C11b cycle)** → brainstorm-side authors C11b refinement brief; WSL-side executes via Edit; brainstorm-side spot-checks; loop back to Task 4 for re-confirmation.
- **Founder reject** → return to Task 2 (re-dispatch C11 subagent with refined drafting brief).

- [ ] **Step 2: Branch on verdict**

If approved (with or without C11a/b/c cycles): proceed to Task 5.
If rejected: return to Task 2 with refined drafting brief; budget impact noted.

- [ ] **Step 3: Apply C11a/b/c hygiene revisions if any**

Per the C10/C10a/b/c precedent (Session 2C ADR-0018 had three revision passes: C10a citation drift, C10b five-area founder-named cleanup, C10c residual rename). Each revision pass is a single sequential pass per Z1 #1 attempt-all-then-rollback-atomically discipline. After each pass, brainstorm-side spot-checks the on-disk ADR; founder re-confirms or names additional revisions.

The C11 cycle expects 0–3 revision passes per the C10 precedent shape.

---

## Task 5: Author D6 Ratification Package (brainstorm-side)

**Files:** None modified by WSL-side this task; brainstorm-side authors the D6 package content.

- [ ] **Step 1: Brainstorm-side authors the D6 ratification package**

The D6 package is single-ADR scope per the D5 precedent (Session 2C `93efce8`). Structure follows the D5 8-section template:

- §1 Purpose and scope
- §2 Tier 6 commit chain (pre-ratification chain since `dc2e1fb` spec commit)
- §3 ADR-0019 ratification verdict (single-ADR scope means §4 cross-trio territory matrix collapses)
- §4 Anti-overscope cross-check (single-ADR scope)
- §5 Recommended action
- §6 Discoverability notes (capture C11 + C11a/b/c revision history; Phase 0 closure framing; deferred-verification surfaces 1, 3, 4 status; Z1 #12 cumulative fire count; candidate-codification observations)
- §7 Locked Phase 0 decisions (carry forward from D1/D2/D3/D4/D5 + bank-detail amendment + mini-decision + new ADR-0019)
- §8 Ratification ask + status update template

- [ ] **Step 2: Brainstorm-side runs Z1 #12 byte-level verification on the D6 package**

Per Z1 #12 discipline applied at the ratification-package authoring layer (the same discipline that fired #4 at the D5 §2 commit-chain drift in Session 2C). Brainstorm-side byte-level verifies all count metrics + commit-chain references + Q-number citations + section-number citations against on-disk state.

- [ ] **Step 3: WSL-side dispatches subagent to write the D6 package**

Per the D5 precedent (Session 2C subagent at `93efce8`). Subagent commission prompt embeds the D6 package content authored by brainstorm-side; WSL-side adds the standard commissioning preamble; subagent writes to `docs/09_briefs/phase-2/2026-05-04-d6-ratification-package.md`.

- [ ] **Step 4: Brainstorm-side post-write spot-check**

Per the D5 post-write spot-check precedent. If clean, proceed to Task 6. If drift, hygiene revision pass per the byte-level Edit pattern.

---

## Task 6: Founder D6 Ratification Verdict (CTO-loop turn 2 ratification)

**Files:** None modified.

- [ ] **Step 1: Stand by for founder D6 verdict**

Per the D1/D2/D3/D4/D5 precedent, three possible verdict shapes:

1. **Ratify as-is** — accept the recommended path; proceed to Task 7 (post-ratification commits).
2. **Ratify with named follow-ups** — accept ratification but specify follow-up cleanups per the D4 precedent (Cleanup Commits 1–7). Trigger one or more revision cycles on ADR-0019 BEFORE the final commits.
3. **Reject / request more revisions** — verdict is "not ready"; cleanup pass needed before re-ratification.

- [ ] **Step 2: Branch on verdict**

If (1) ratify as-is: proceed to Task 7.
If (2) ratify with named follow-ups: brainstorm-side authors follow-up cleanup briefs; WSL-side executes via Edit; brainstorm-side spot-checks; founder re-confirms; commits land after follow-ups close.
If (3) reject: return to Task 5 with revised D6 framing OR Task 2 with re-dispatched C11 brief depending on the founder's surfaced concerns.

---

## Task 7: Apply ADR-0019 Status Block Update (pre-commit edit)

**Files:**
- Modify: `docs/07_governance/adr/0019-confidence-calibration-policy.md` (Status block update only)

- [ ] **Step 1: Apply Status block edit**

Per the D5 precedent (`cf8fd74` Status edit before commit), update the ADR-0019 Status block from:

```
Drafted 2026-05-04 by Phase 0 governance plan Task C11. Pending CTO ratification.
```

to:

```
Ratified 2026-05-04 by CTO per D6 ratification package §3.1.
```

(Or per founder direction shape if founder prefers different ratification framing — e.g., "with named follow-ups per D6 §3.1" if Verdict 2.)

- [ ] **Step 2: Verify edit landed**

Run: `git status --short && grep -n "^Ratified\|^Drafted" docs/07_governance/adr/0019-confidence-calibration-policy.md | head -3`

Expected:
- `git status --short` shows `?? docs/07_governance/adr/0019-confidence-calibration-policy.md` (still untracked since the file was never committed yet; the Status edit landed in the untracked file).
- ADR-0019 Status line reads "Ratified 2026-05-04 by CTO ...".

---

## Task 8: Commit ADR-0019 + D6 Package + Execution Plan (post-ratification commits)

**Files:**
- Stage + commit: `docs/07_governance/adr/0019-confidence-calibration-policy.md` (ADR-0019 substantive content)
- Stage + commit: `docs/09_briefs/phase-2/2026-05-04-d6-ratification-package.md` (D6 ratification package)
- Stage + commit: `docs/superpowers/plans/2026-05-04-c11-drafting-and-d6-ratification-execution.md` (this execution plan)

Three separate single-purpose commits per the Session 2C 4-commit precedent (ADR-0018 → D5 package → D5 plan → Session 2D opening prompt).

- [ ] **Step 1: Dispatch subagent for the three single-purpose commits**

Per the Session 2C subagent dispatch precedent at `cf8fd74` + `93efce8` + `c79ecfc`. Subagent commission prompt structures:

1. Stage ADR-0019; verify only ADR-0019 staged; commit with single-purpose message including Q57 + Q73 closures + Q65 + ambiguity-margin ratifications + cross-ADR amendment cascade triggers.
2. Stage D6 package; verify only D6 package staged; commit with single-purpose message including Tier 6 ratification framing + Phase 0 closure context.
3. Stage execution plan; verify only execution plan staged; commit with single-purpose message including precedent-preserving artifact framing.

- [ ] **Step 2: Verify all three commits landed**

Run: `git log --oneline -7 && git status --short && git log --oneline a14d939..HEAD | wc -l`

Expected:
- Top-7 commits: NEW execution plan commit → NEW D6 package commit → NEW ADR-0019 commit → `dc2e1fb` (spec) → `17b43cd` (Session 2D opening prompt) → `c79ecfc` (D5 plan) → `93efce8` (D5 package).
- `git status --short`: empty (working tree clean).
- Total commits since `a14d939`: 26 (was 23 at Session 2E start; +3 from Tier 6 commits).

If any commit fails or `git status --short` is non-empty, surface back per Z1 #10 before proceeding.

---

## Task 9: Phase 0 Closure Verification (eight non-Tier-6 exit criteria)

**Files:** Verification reads only; no edits unless drift surfaces.

Per the Phase 0 governance plan §6 Decision 6's nine explicit exit criteria, Phase 0 closure requires more than Tier 6 ratification. Eight non-Tier-6 criteria need verification at Session 2E closeout:

| # | Criterion | Verification approach |
|---|---|---|
| 1 | Two ratified initiative briefs (Document Platform + Spend Initiative) | grep `^Ratified` in `docs/09_briefs/phase-2/` for the two initiative briefs |
| 2 | Tier 1–6 ratifications (six of eight ADRs locked) | grep `^Ratified` in `docs/07_governance/adr/0007-` through `0019-` |
| 3 | Filed open questions in Q53+ range — closure state per question | Read `docs/02_specs/open_questions.md`; verify each Q53+ entry's status (closed by ratification / held v1 implementation gate / post-v1 deferred); reconcile Q53–Q78 vs Q53–Q79 count drift per the surface in Session 2D opening prompt §4 |
| 4 | Four dependent-artifact updates per Phase 0 plan Stream E | Read `docs/02_specs/agent_architecture_policy.md` (E2 Q28 matrix); `docs/02_specs/invariants.md` (INV-DOC-001 reservation per Q79); `docs/02_specs/control_matrix.md` (audit-row updates if applicable); `docs/02_specs/data_model.md` (schema-delta synthesis) |
| 5 | Phase 0 plan §6 Decision 6 nine-explicit-checks framework | Already ✓ at Phase 0 plan ratification |
| 6 | All nine explicit checks individually | Verify each check's deliverable artifact exists + matches current state |
| 7 | Phase 1 (Storage / Evidence Core) code start gate | Verify Phase 1 code start prerequisites met (Q29 ESLint design landed pre-code-start per ADR-0007 standing obligation) |
| 8 | ADR-0010 amendment (if a new reserved-enum pattern was introduced in Phase 0) | Check whether `(linked_entity_type, link_role)` pair-validity matrix from ADR-0016 OR `org_settings.confidence_threshold_*` from ADR-0019 introduces a reserved-enum pattern requiring ADR-0010 amendment |

- [ ] **Step 1: Run verification reads sequentially**

For each criterion 1–8, perform the verification approach. Surface any drift to founder.

- [ ] **Step 2: Adjudicate Phase 0 closure**

If all eight criteria verify clean: Phase 0 closes at Session 2E.
If any criterion surfaces drift: scope follow-up work; may push Phase 0 closure to Session 2F depending on drift magnitude.

- [ ] **Step 3: Surface closure state to founder**

Report Phase 0 closure verification results. Founder adjudicates closure declaration.

---

## Task 10: Session 2E Closeout (CTO-loop turn 3)

**Files:**
- Conditional: `docs/09_briefs/phase-2/2026-05-04-session-2f-opening-prompt.md` (if Phase 0 does NOT close at Session 2E)

- [ ] **Step 1: Adjudicate Z1 codification candidates at session closeout**

Per the Session 2C closeout precedent (Z1 #12 codified). Three candidates surfaced for Session 2E closeout adjudication:

- **Candidate A** (cross-ADR section-number citation verification): subsumed under Z1 #12 at Session 2D opening per founder direction. Locked.
- **Candidate C** (cross-ADR ownership-claim verification): held in candidate state through Session 2D. Revisit at Session 2E closeout — does it codify, hold further, or fade?
- **Lesson 5 Framing α citation discipline** (audit-event ID + hash citation in ADR amendment commits): newly surfaced at Session 2D §8.4 as strong codification candidate. Founder adjudication at session closeout.

- [ ] **Step 2: Conditional Session 2F opening prompt authoring**

If Phase 0 closes at Session 2E: no Session 2F opening prompt needed; the closure declaration itself is the terminal artifact.

If Phase 0 does NOT close at Session 2E (drift surfaces in Task 9 verifications): brainstorm-side authors Session 2F opening prompt per the Session 2D opening prompt precedent at `17b43cd`. Subagent dispatch writes the prompt; single-purpose commit.

- [ ] **Step 3: Final closeout report to founder**

Report Session 2E final state:
- Tier 6 ratification status + commit SHAs.
- Phase 0 closure status (closed / pending Session 2F).
- Z1 #12 cumulative fire count + new fires from Session 2E.
- Candidate codification outcomes.
- Working-tree-clean state confirmation.

---

## Self-Review

After writing the plan, look at it with fresh eyes:

**1. Spec coverage:** The plan's tasks cover (a) C11 drafting via subagent dispatch against the `dc2e1fb` spec; (b) brainstorm-side draft review + possible C11a/b/c hygiene revisions; (c) D6 ratification package authoring; (d) founder D6 verdict; (e) ADR-0019 Status block update; (f) three single-purpose post-ratification commits; (g) Phase 0 closure verification of eight non-Tier-6 exit criteria; (h) Session 2E closeout with Z1 codification adjudication. Each spec section §0–§13 has a corresponding task that consumes it. No spec gaps.

**2. Placeholder scan:** Task 1 references the C11 drafting brief content as authored by brainstorm-side at the time of Task 1 execution — this is a real reference to runtime authoring, not a TBD. Subagent commission prompt template at Task 2 Step 2 uses concrete dependency-ADR paths and concrete pre-flight verification requirements. Status block update template at Task 7 has explicit text for both ratify-as-is and ratify-with-named-follow-ups verdict shapes. Task 9 verification approaches are concrete reads. No placeholders remain.

**3. Type consistency:** Path references throughout are consistent (`docs/07_governance/adr/0019-confidence-calibration-policy.md`; `docs/09_briefs/phase-2/2026-05-04-d6-ratification-package.md`; `docs/superpowers/plans/2026-05-04-c11-drafting-and-d6-ratification-execution.md`). Commit chain references are consistent (`dc2e1fb` as spec anchor; Session 2C 4-commit precedent referenced uniformly). C11 / C11a / C11b / C11c naming convention matches the C10 / C10a / C10b / C10c precedent.

**4. Scope check:** The plan is single-subsystem — Tier 6 ratification + Phase 0 closure verification. The 4 conditional Session 2F opening prompt is explicitly conditional (only if Phase 0 does NOT close); not in baseline scope. No decomposition needed.

If any inline corrections needed, applied during this self-review before save.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-04-c11-drafting-and-d6-ratification-execution.md`. Two execution options:

1. **Subagent-Driven (recommended)** — Dispatch a fresh subagent per task, review between tasks, fast iteration. Especially useful for Task 2 (C11 drafting), Task 5 Step 3 (D6 package write), Task 8 (post-ratification commits) — all context-heavy operations where the subagent boundary protects main session context.

2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints for review.

WSL-side recommendation: **Subagent-Driven**. Matches the established Session 2C/2D pattern (subagent dispatch for write + commit operations; inline orchestration for brainstorm-side review + founder verdict gates). Tasks 3, 4, 6, 9, 10 are checkpoint/standby tasks that don't need subagent dispatch; Tasks 1, 2, 5, 7, 8 are dispatch-or-execute tasks where the subagent boundary applies.
