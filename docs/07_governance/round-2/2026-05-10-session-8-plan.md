# Session 8: Round-2 Codification Tail Adjudications Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Round-2 Session 8 — close the round-2 codification tail by ratifying the drift meta-pattern at Tier 1 (full codification with sub-shapes + sub-rules + sub-axis), expanding Pattern 7's bypass-procedure operational rules to cover the third timing surface (cross-reference-time), inventorying and sub-categorizing the methodology cluster bucket (11+ inhabitants), dispositioning the Tier 3 carry-forwards (recurring meta-arc placement question; prophylactic-vs-reactive mode-of-application), and attaching the round-2 closure declaration to this session's closeout if all work units complete.

**Architecture:** 4 commits applied at session level. C1 conventions.md Round-2 section drift meta-pattern Tier 1 codification (incorporates path-reference vs content-reference sub-shapes + inter-session dependency sub-axis + prophylactic-vs-reactive mode-of-application sub-rule + N=3 evidence trail + Tier 3 carry-forward dispositions). C2 docs/README.md Pattern 7 bypass-procedure expansion (third operational rule for cross-reference-time surface). C3 conventions.md methodology cluster bucket inventory + sub-categorization (3-4 natural clusters). C4 closeout friction-journal entry + round-2 closure declaration. Total: 4 commits matching the count-level commit pattern at the structural level (3 implementation + 1 closeout); count varies (3 rather than 4) per work-shape grouping. Pattern holds at structural level; count-level variance recorded as observation.

**Tech Stack:** Edit tool, `grep -rn` for cross-reference verification, bash for floor-only verification.

---

## Brainstorm context (forward to round-2 closure / round-3+)

This section captures the design substrate produced by the brainstorm conversation that authored this plan. Session 8 execution does not re-derive content from the brainstorm transcript; this section is durable substrate.

### Codification-practice meta-question (answered first; cross-cuts work units 1, 2, 4)

**Codify with sub-shape preservation when differential firing evidence exists. Unify with examples otherwise.**

The differential-firing-evidence threshold is the gating criterion: if proposed sub-shapes have demonstrably different firing conditions (different surface conditions trigger different sub-shapes), preserve them as named sub-rules. If the proposed sub-shapes are structural variants of the same firing condition, unify with examples.

**Application across work units:**

- **Path-reference vs content-reference sub-shapes** (within cross-reference-time surface): path-reference fires when paths move (5B closeout: 5 path-reference instances); content-reference fires on state evolution (5B closeout: 2 content-reference instances; Session 6 closeout: 3 content-reference instances; total N=2 differential firings post-gate). Differential firing conditions confirmed. **Preserve as named sub-shapes.**
- **Drift meta-pattern vs inter-session dependency mechanism**: drift operates at write-time (verify against canonical sources before drafting); inter-session dependency operates at read-time / pre-flight (verify prior session's actual state before assuming substrate). Different timing surfaces; differential firing conditions clear. **Preserve as named sub-axes within unified codification.**
- **Prophylactic-vs-reactive mode-of-application** (within drift discipline): prophylactic catches drift before it fires (verification at pre-flight); reactive catches drift after it fires (correction at execution). Same firing condition (drift exists in plan-substrate); different application modes; cost asymmetric (prophylactic cheaper). **Codify as named mode-of-application sub-rule.**

**Why this answer:** matches the architectural-principle codification mechanic ("N=1 per surface") extended to process meta-patterns. Surfaces (whether structural or temporal) earn distinct codification when they fire under distinct conditions. Sub-shape preservation makes the codification operational at the right granularity — future executors know what to expect under which conditions, not just that "drift exists."

**The taxonomy in conventions.md Round-2 section doesn't pre-commit to preservation-vs-unification by category.** Session 8 settles the practice consistently across all work units, then records the answer in conventions.md as part of C1's update.

### Drift meta-pattern Tier 1 codification (work unit 1)

**Category boundary: process meta-pattern (NOT architectural principle).**

Architectural principles ratify structural axes (folder organization per Principle 1; document classes per Principle 2; folder placement guardrails at structural surfaces per Principle 3). The drift meta-pattern is about discipline-application — verify against canonical sources at appropriate timing surfaces before drafting or executing. Its surfaces are TEMPORAL (timing surfaces: when in the process drift fires), not STRUCTURAL (physical folder locations).

Compare V2 Principle 3's three surfaces (`apps/web/src/`, `docs/`, repo root) — these are STRUCTURAL surfaces ratified at N=1 per surface. Drift meta-pattern's three surfaces (execution-time, planning-decision-time, cross-reference-time) are TEMPORAL surfaces ratified at N=3 with shape match per the process-meta-pattern threshold.

**Ratifying as Principle 4 in V2 amendment is the wrong category.** It would conflate temporal-surfaces-of-discipline with structural-axes-of-organization, diluting both Principle 3's tightness AND the drift meta-pattern's discipline-application focus.

**Ratification path (correct category):**

1. **Update conventions.md Round-2 section's drift meta-pattern entry** — ratify Tier 1 codification with full taxonomy:
   - Three timing surfaces (execution-time, planning-decision-time, cross-reference-time) with sub-instance evidence per surface.
   - Path-reference vs content-reference sub-shapes within cross-reference-time surface.
   - Inter-session dependency sub-axis (read-time / pre-flight surface).
   - Prophylactic-vs-reactive mode-of-application sub-rule.
   - N=3 evidence trail with shape match.
2. **Expand Pattern 7's bypass-procedure operational rules in `docs/README.md`** — add third operational rule for cross-reference-time surface. Pattern 7 currently carries two operational rules (canonical-source verification at execution time + chronological-reality verification at planning time); adding cross-reference-time verification (verify cross-references at execution time before drafting; cite paths not post-rewrite content) covers the third surface.
3. **V2 stays as ratification snapshot.** V2 Part 2 records the N=2 evidence at V2-ratification time with explicit forward-looking text "do NOT ratify at N=2 prematurely" and "cross-reference-time surface needs an N=1 instance before crossing to Tier 1 codification." The gate has fired; the codification ratifies in conventions.md (the live discipline doc); V2's ratification-time snapshot remains valid as historical record. No V2 amendment needed.

### Inter-session dependency mechanism Tier 2 → Tier 1 codification (work unit 2)

**Category boundary: process meta-pattern (same as drift meta-pattern).**

The mechanism fires when a plan references prior session's state and the executor verifies that state at pre-flight. Operates at read-time / pre-flight surface — different timing surface from drift meta-pattern's write-time surface.

**Ratification path:** codify as sub-axis within drift meta-pattern's full codification (per the codification-practice meta-question's answer: preserve sub-shapes when differential firing evidence exists; inter-session dependency has differential timing surface from drift). Explicit naming: "Inter-session dependency sub-axis (read-time / pre-flight surface)."

**Sub-axis text:**

```
**Inter-session dependency sub-axis (read-time / pre-flight surface).**
Plans that reference prior session's state require pre-flight
verification that the prior state actually obtains. Mechanism:
plans cite prior commits / acceptance criteria / closeout state;
executors verify against current canonical state at session start
(Stop Condition 1 typically); deviations halt execution before
commits land. Different timing surface from drift's write-time
surface (which catches drift in plan substrate); inter-session
dependency catches drift in cross-session inheritance.

N=3 evidence:
- Session 6 plan referencing Session 5B closeout state.
- Session 7 plan referencing Session 5B + Session 6.5 closeout
  state.
- Session 6 execution referencing Session 5B execution closeout
  state.

Threshold met (process meta-pattern; N=2 with shape match across
distinct timing surfaces; N=3 confirms). Codified as sub-axis
within the drift meta-pattern; the parent category absorbs the
sub-axis per the codification-practice meta-question's answer
(sub-shape preservation when differential firing evidence
exists).
```

### Path-reference vs content-reference sub-shapes (within cross-reference-time surface)

Per the codification-practice meta-question's answer, codify with explicit sub-shape preservation:

**Sub-shape text:**

```
The cross-reference-time surface fires under two distinct
sub-shapes with differential firing conditions:

- **Path-reference cluster (mechanical drift).** Fires when
  paths move during round-N work and references didn't update.
  Worked examples (Session 5B closeout): ADR README anchor
  mismatch; ADR/README:274 active-doc reference;
  open_questions.md:755 reference; delivery-model.md:156
  reference; document_platform_initiative.md 5 references.
  Resolution shape: update path target at execution time;
  preserve δ-i-historical references per friction-journal-is-
  history rule.
- **Content-reference cluster (semantic drift).** Fires when
  state-claims go stale because state changed (e.g., "when
  ratified at Session 7" after V2 ratifies; "empty in Phase
  1.1" after folder populates). Worked examples (Session 5B
  closeout: 2 instances; Session 6 closeout: 3 instances).
  Resolution shape: update prose claim at execution time;
  preserve δ-i-historical claims in closed-phase briefs.

Differential firing evidence: path-reference cluster fires when
paths move; content-reference cluster fires when state evolves
without path moves. Session 6 closeout's 0 path-reference + 3
content-reference instances confirms the differential conditions
(no paths moved during Session 6's docs/-internal rewrite work;
content-reference cluster still fired on state evolution).
```

### Prophylactic-vs-reactive mode-of-application sub-rule (within drift discipline)

Per the codification-practice meta-question's answer, codify as named mode-of-application sub-rule:

**Sub-rule text:**

```
**Prophylactic-vs-reactive mode-of-application.** The drift
discipline applies in two modes:

- **Prophylactic mode (default).** Verify against canonical
  sources at pre-flight before drafting forward-looking content.
  Catches drift before it fires (lower cost; verification at
  read time).
- **Reactive mode (fallback).** Catch drift during execution
  via Edit anchor mismatches, grep sweeps, or surface
  discrepancies. Higher cost (drift surfaces in flight; requires
  in-session correction).

Default to prophylactic mode where the canonical state is
verifiable at pre-flight. Reactive mode is the catch-net when
prophylactic verification missed an instance. The
prophylactic-vs-reactive distinction is itself an N=3 sub-rule:
Session 6.5 + Session 7 + Session 5B all applied prophylactic
verification at pre-flight; reactive catches still fired during
execution as expected fallback.

Worked examples:
- Prophylactic: Session 7 brainstorm caught the floor-only
  fire-count drift by NOT projecting in the plan (verification
  at pre-flight: read journal at execution time).
- Reactive: Session 6.5 caught the lib/hooks forbidden-list
  drift after the plan was written and execution began (Edit
  anchor mismatch surfaced during drafting).
```

### Tier 3 carry-forward dispositions (work unit 4)

**Recurring meta-arc placement question (N=1 — Tier 3 hold).**

Closed by V2's Pattern 7 ratification. Codification candidacy: "ratification gaps cause recurring questions" as a discipline rule. Per process-meta-pattern threshold (N=2 with shape match across distinct contexts; N=3 confirms), N=1 is insufficient evidence. **Hold at Tier 3.** Codification candidacy remains; awaiting second fire (a future round-N or arc-X recurring question would advance to N=2).

**Prophylactic-vs-reactive sub-axis (N=3 evidence — codifies per work unit 1).**

Codified as discipline mode-of-application sub-rule within the drift meta-pattern's full codification (see Prophylactic-vs-reactive mode-of-application sub-rule text above). Tier 3 entry resolves; sub-rule lands as part of C1.

### Methodology cluster bucket inventory + sub-categorization (work unit 3)

The bucket has 11+ inhabitants per Session 6.5 closeout's soft-threshold trip; sub-categorization deferred to Session 8 with framework. Session 8 execution inventories the bucket and applies sub-categorization.

**Inventory (best-known list at brainstorm time; verify at execution time):**

1. Mid-dispatch plan re-read pre-push verification (N=2 per Session 6 brainstorm closeout).
2. Pre-condition block N=2 holding (per Session 6 brainstorm).
3. Parallel-session commit visibility (N=1 per Session 6 brainstorm).
4. Drift meta-pattern (now ratifying at Tier 1 per work unit 1; graduates from bucket to dedicated codification).
5. Inter-session dependency mechanism (now ratifying at Tier 1 as sub-axis per work unit 2; graduates from bucket).
6. Recurring meta-arc placement question (Tier 3 hold per work unit 4; remains in bucket).
7. Prophylactic-vs-reactive sub-axis (now codifying as sub-rule per work unit 4; graduates from bucket).
8. Substrate-leverage phase observation (Tier 3 → Tier 2 candidacy per 5B closeout).
9. Count-level commit pattern variance.
10. Categorical-distinction-preservation meta-pattern.
11. Failure-mode taxonomy (forward vs backward; sub-pattern within structural-pattern bucket).

Verify the inventory at execution time against friction-journal entries from Sessions 5A through 6 closeouts. Add any inhabitants surfaced in Sessions 5B / Session 6 / 6.5 closeouts that weren't tracked in this list.

**Sub-categorization scheme (proposed):**

- **Cluster A: Codification-trajectory observations.** Items currently at Tier 2 / Tier 3 with codification candidacy. Post-Session-8: items #6 (recurring meta-arc placement question), #8 (substrate-leverage phase), and any Tier 3 candidates not yet ratified. Items #4, #5, #7 graduate out of the bucket to dedicated codification.
- **Cluster B: Session-execution discipline observations.** Items #1 (mid-dispatch plan re-read), #2 (pre-condition block), #3 (parallel-session commit visibility). Operational discipline that fires within session execution.
- **Cluster C: Scope/structural observations.** Items #9 (count-level commit pattern variance), #10 (categorical-distinction-preservation meta-pattern), #11 (failure-mode taxonomy). Observations about scope decisions, structural patterns, and category preservation.

**Sub-categorization ratification:** within conventions.md Round-2 section as a "Methodology cluster sub-categorization" sub-section (or as a separate convention entry), with the three clusters named explicitly and the inventory enumerated.

**If sub-categorization complexity surfaces during execution** (e.g., the inventory reveals 15+ inhabitants instead of 11; clusters don't cleanly segment; meta-meta observations form a fourth cluster that doesn't absorb cleanly), the executor halts and surfaces the issue. Splitting bucket-structural work into Session 9 with explicit deferral framework is the fallback. Single-Session-8 absorption is the default; halt-and-split is the contingency.

### Round-2 closure declaration (work unit 6)

**Closure declaration attaches to Session 8 closeout if all work units complete.**

Substantive work closes when:
- C1 ratifies drift meta-pattern Tier 1 codification (work units 1, 2, 4).
- C2 expands Pattern 7's bypass-procedure with third operational rule (work unit 1 ratification path component).
- C3 inventories methodology bucket and applies sub-categorization (work unit 3).
- All Tier 3 carry-forwards dispositioned (work unit 4): recurring meta-arc question held; prophylactic-vs-reactive codified.

If all four implementation commits land cleanly and the closeout reflects the codifications, **round-2 closure declaration attaches to Session 8 closeout.** Closure framing in the closeout entry explicit:

```
Round-2 docs reorganization closes at this push. Round-2 spanned
Sessions 1 through 8 (with Session 6.5 + 5B execution + Session
6 execution interim + Session 7 V2 ratification + Session 8
codification tail). The meta-arc folder
docs/07_governance/round-2/ becomes a historical archive.
Future round-N work creates docs/07_governance/round-N/ per the
round-N workflow convention codified at Session 7 C6.

Phase 1 onset readiness: confirmed. Source-tree authority
discipline holds across N=4 sessions post-V2-ratification
(Session 7 + 5B + Session 6 + Session 8). Phase 1 storage /
evidence work unblocked.
```

If any work unit defers (e.g., bucket-structural splits to Session 9), closure declaration is partial — Session 8 closes the codification work but defers full round-2 closure to whichever future session resolves the remaining work. The closeout entry records the deferral explicitly.

### Path-stability discipline (applies throughout Session 8)

Per the drift meta-pattern's cross-reference-time operational rule (which Session 8's C2 codifies), Session 8 execution applies path-level cross-references throughout:

- C1's conventions.md update cites path references (`docs/07_governance/DOCS_RESTRUCTURE_V2.md`, `apps/web/src/README.md`, etc.) at path level, not at specific post-rewrite content.
- C2's docs/README.md update follows the existing Pattern 7 bypass-procedure structure; cross-references to V2 use path-level links.
- C3's methodology cluster sub-categorization cross-references the parent codification (drift meta-pattern entry); references at path level.

V2 Part 2's text saying N=2 evidence is preserved as ratification-time snapshot (V2 doesn't amend); conventions.md round-2 section's text gets updated to N=3 + Tier 1 codification (the live discipline doc).

### Floor-only fire count discipline

Per the chronological-reality verification rule codified at Pattern 7's bypass procedure, this plan does NOT project the floor-only fire count. C4 closeout reads the friction-journal at execution time and increments. Reference: friction-journal post-Session-6-execution-push records N=9 LIVE.

If Session 8 push is the next floor-only push, count increments to N=10. If intervening pushes land first (unlikely; Session 8 is the next round-2 work), count adjusts per chronological reality.

---

## Pre-flight reading

Before starting C1:

- `CLAUDE.md` — standing rules, especially "Project rules and vocabulary" structure (where the Folder placement guardrails sub-section + canonical-source list lives).
- `AGENTS.md` (root) — pre-flight directive.
- `docs/INDEX.md` — full doc tree map.
- `docs/07_governance/DOCS_RESTRUCTURE_V2.md` — Part 1 (three Principles + Pattern 7), Part 2 (drift meta-pattern N=2 evidence at ratification time), Part 3 (Migration Map). Load-bearing for understanding what's ratified vs what's evolving.
- `docs/07_governance/DOCS_RESTRUCTURE_V1.md` — round-1 substrate (post-elevation). Background context.
- `docs/04_engineering/conventions.md` — Round-2 Conventions section in particular (round-N convention, three-category codification taxonomy with the artifact-codification-relationship insight, "verify before agreeing with alarm" rule, plan-substrate-vs-canonical-reality drift meta-pattern entry currently at Tier 3 → Tier 2 trajectory text — C1 updates this).
- `docs/07_governance/round-2/README.md` — meta-arc folder reasoning.
- `docs/07_governance/round-2/2026-05-09-session-7-plan.md` — Session 7's full plan including its brainstorm-context section. Substrate for the V2 ratification.
- `docs/07_governance/round-2/2026-05-09-session-6-5-plan.md` — Issues 1-4 design output. Substrate for Principle 3.
- `docs/07_governance/round-2/2026-05-08-session-5b-plan.md` — Session 5B plan. Substrate for the cross-reference-time surface gate-firing context.
- `docs/07_governance/round-2/2026-05-09-session-6-plan.md` — Session 6 plan. Substrate for the inter-session dependency mechanism's first firing.
- `docs/07_governance/friction-journal.md` — recent entries. Specifically read Session 5B closeout (cross-reference-time surface gate-firing with 7 sub-instances) and Session 6 closeout (post-gate frequency evidence with 3 sub-instances; inter-session dependency mechanism N=3 firings record). Verify counts at brainstorm time per drift discipline.
- `docs/02_specs/glossary.md` — Workflow Vocabulary, Product Vocabulary, Delivery Vocabulary, Governance Vocabulary subsections. Confirm Tier 1/2/3 terminology and the codification-trajectory mechanic.
- `docs/README.md` — Folder placement guardrail section's bypass procedure structure (currently has 2 operational rules; C2 adds the third).

---

## Acceptance criteria

- (a) Plan structure matches Session 6/6.5/7 ten-section shape (this plan satisfies; execution doesn't change shape).
- (b) Brainstorm-context section is durable substrate (Session 8 execution doesn't need to re-derive from this brainstorm conversation).
- (c) Pre-flight reading list is comprehensive.
- (d) `docs/04_engineering/conventions.md` Round-2 section's drift meta-pattern entry updated at C1 with: full Tier 1 codification text; N=3 evidence trail; path-reference vs content-reference sub-shapes; inter-session dependency sub-axis; prophylactic-vs-reactive mode-of-application sub-rule; codification-practice meta-question's answer recorded; Tier 3 carry-forward disposition (recurring meta-arc question held; prophylactic-vs-reactive codified per this section).
- (e) `docs/README.md` Pattern 7 bypass-procedure expanded at C2 with third operational rule for cross-reference-time surface.
- (f) `docs/04_engineering/conventions.md` Round-2 section gains a methodology cluster sub-categorization entry at C3 (or equivalent location), with three clusters named (codification-trajectory; session-execution discipline; scope/structural) and inventory enumerated.
- (g) Closeout friction-journal entry inserted at top of `## Phase 2`, recording: codification ratifications; round-2 closure declaration (if all work units complete) OR deferral framework (if any deferred); cross-reference-time drift sub-instances caught at execution time as frequency evidence (post-gate); methodology cluster bucket inventory verification result.
- (h) `pnpm typecheck` clean before each commit.
- (i) `pnpm adr:lint` clean before each commit; `pnpm adr:index --check` clean before each commit.
- (j) Floor-only push-readiness gate met (zero migrations / zero services / zero integration tests / zero source files / zero test files across the diff) at C4.
- (k) All 4 commits independently revertable; commit boundaries align with the implementation-then-closeout pattern (C1–C3 implementation; C4 closeout).
- (l) Path-level cross-references throughout (verified via `grep -rn` at execution time).

---

## Push-readiness gate (floor-only carve-out, next invocation)

Floor-only carve-out criteria (per halftime plans push commit `ea22b76`, codified at Session 7 C6 conventions.md round-2 section): mechanically defensible for diffs containing zero migrations / zero services / zero integration tests / zero source files / zero test files.

Session 8's diff:

| Criterion | Session 8 status |
|---|---|
| Zero DB migrations | ✓ no `apps/web/sql/` or `supabase/migrations/` changes |
| Zero services | ✓ no `apps/web/src/services/` changes |
| Zero integration tests | ✓ no `apps/web/tests/integration/` changes |
| Zero source files | ✓ no `.ts`/`.tsx` changes |
| Zero test files | ✓ no `.test.ts` changes |

All five criteria met. Diff is markdown-only (conventions.md update + docs/README.md Pattern 7 expansion + methodology cluster sub-categorization + friction-journal closeout entry); floor-only gate applies.

**Floor-only fire count discipline.** Per the chronological-reality verification rule, this plan does NOT project the count. C4 reads the friction-journal at execution time and increments. Reference: friction-journal post-Session-6-execution-push records N=9 LIVE.

**Verification protocol:**
- `pnpm db:reset:clean`
- `pnpm agent:validate` (floor-scope: typecheck + URL grep + 5 Category A floor tests; expect 26/26 GREEN)
- Full-suite `pnpm test` NOT invoked.

---

## Stop conditions (keyed to scope-completion milestones)

1. **Session start: verify post-Session-6-execution state, before reading any Session 8 work.** Confirm:
   - HEAD references Session 6 execution closeout commit (`d1d239b`) or merged into staging per branch sync.
   - `pnpm typecheck`, `pnpm adr:lint`, `pnpm adr:index --check` all green.
   - Working tree clean.
   - `docs/04_engineering/conventions.md` Round-2 section exists with current Tier 3 → Tier 2 trajectory text for the drift meta-pattern entry (C1 will update this).
   - `docs/README.md` Folder placement guardrail's bypass procedure section has 2 operational rules currently (C2 adds the third).
   - Friction-journal records N=9 LIVE post-Session-6-execution.

   If any verification fails: halt. Resolve at session start; if Session 6 execution introduced unexpected scope, escalate for plan revision before proceeding.

2. **After C1 (conventions.md drift meta-pattern Tier 1 codification), before C2.** Confirm: drift meta-pattern entry updated with Tier 1 codification text (N=3 evidence; sub-shapes; sub-axis; sub-rule); cross-references resolve via path-level links (`grep -rn` verification); working tree clean.

3. **After C2 (docs/README.md Pattern 7 expansion), before C3.** Confirm: Pattern 7 bypass-procedure has 3 operational rules (canonical-source verification at execution time + chronological-reality verification at planning time + cross-reference verification at execution time); cross-references resolve; working tree clean.

4. **After C3 (methodology cluster sub-categorization), before pre-C4 verification.** Confirm: methodology cluster sub-categorization landed in conventions.md Round-2 section (or designated location); inventory verified against friction-journal at execution time; three clusters named with inhabitants enumerated. **Halt-and-split contingency:** if inventory reveals significantly more than 11 inhabitants OR clusters don't cleanly segment OR meta-meta observations form an unabsorbed fourth cluster, halt and surface for Session 9 deferral framework.

5. **Pre-C4 floor-only verification.** Confirm: `pnpm db:reset:clean && pnpm agent:validate` reports 26/26 GREEN; `pnpm typecheck` clean; `pnpm adr:lint` and `pnpm adr:index --check` clean.

6. **After C4 (closeout commit), before pushing.** Confirm push-readiness state per the floor-only gate criteria; friction-journal entry inserted with the actual fire count (read from friction-journal at C4 execution time, do NOT project); round-2 closure declaration recorded (if all work units complete) OR deferral framework recorded (if any deferred).

---

## Task 1 (C1): Conventions.md drift meta-pattern Tier 1 codification

- [ ] Read `docs/04_engineering/conventions.md` Round-2 Conventions section in full to confirm current state. Note the drift meta-pattern entry at line ~1391 currently records "Tier 3 → Tier 2 trajectory; not ratified to a principle at N=2" with N=2 evidence text.
- [ ] Read friction-journal Session 5B closeout entry to verify N=3 evidence and 7 sub-instances at cross-reference-time.
- [ ] Read friction-journal Session 6 closeout entry to verify post-gate frequency evidence (3 content-reference sub-instances) and inter-session dependency mechanism N=3 firings.
- [ ] Edit `docs/04_engineering/conventions.md` Round-2 section. Replace the existing drift meta-pattern entry (heading `### Plan-substrate-vs-canonical-reality drift meta-pattern (Tier 3 → Tier 2 codification trajectory)` and its body content; ~30 lines) with the full Tier 1 codification.

The replacement content (full text, executor-write):

```markdown
### Plan-substrate-vs-canonical-reality drift meta-pattern (Tier 1 codified)

Forward projections embedded in plans, handoffs, or brainstorm-
context sections drift from canonical reality at execution
time. The meta-pattern fires across multiple timing surfaces;
codified as Tier 1 process meta-pattern at round-2 Session 8 per
N=3 evidence with shape match across distinct timing surfaces.

**Three timing surfaces:**

- **Execution-time surface.** Plan-internal substrate (forbidden
  lists, header styles, fire counts, anchor texts) drifts from
  canonical docs (folder-structure.md, friction-journal pattern,
  chronological fire history, current file content). Caught at
  execution time when Edits / greps / drafts surface
  discrepancies.
- **Planning-decision-time surface.** Handoff sequence
  projections drift from chronological reality (sequence didn't
  materialize). Caught at planning-decision time when adjudicating
  scope-shape or dependency claims.
- **Cross-reference-time surface.** Forward references in plans
  / closeouts / canonical docs drift from current-state content
  (paths moved; content evolved). Caught at execution time when
  cross-reference grep-sweeps surface discrepancies. Mitigated
  by path-level cross-references (cite paths, not post-rewrite
  content).

**N=3 evidence trail:**

- N=1 = Session 6.5 closeout (execution-time surface; three
  sub-instances: lib/hooks forbidden-list mismatch with
  folder-structure.md; friction-journal entry-shape `### vs
  bullet-list`; floor-only fire-count plan-claim N=6 vs
  chronological N=5).
- N=2 = Session 7 brainstorm (planning-decision-time surface;
  Path A vs Path B sequencing question — sequence projection vs
  chronological reality).
- N=3 = Session 5B execution closeout (cross-reference-time
  surface; 7 sub-instances under one meta-pattern observation:
  ADR README anchor mismatch, "when ratified at Session 7"
  phrasing stale, ADR/README:274 active-doc reference,
  open_questions.md:755 reference, delivery-model.md:156 d6
  reference, document_platform_initiative.md 5 references,
  phase-2/README acknowledgment retainee count).

Codification gates per process-meta-pattern threshold (N=3 with
shape match across three distinct timing surfaces): satisfied at
Session 5B closeout. Tier 1 codification ratifies at Session 8
per this entry.

**Path-reference vs content-reference sub-shapes (within
cross-reference-time surface).**

The cross-reference-time surface fires under two distinct
sub-shapes with differential firing conditions:

- **Path-reference cluster (mechanical drift).** Fires when
  paths move during round-N work and references didn't update.
  Worked examples (Session 5B closeout): ADR README anchor
  mismatch; ADR/README:274 active-doc reference;
  open_questions.md:755 reference; delivery-model.md:156
  reference; document_platform_initiative.md 5 references.
  Resolution shape: update path target at execution time;
  preserve δ-i-historical references per friction-journal-is-
  history rule.
- **Content-reference cluster (semantic drift).** Fires when
  state-claims go stale because state changed (e.g., "when
  ratified at Session 7" after V2 ratifies; "empty in Phase
  1.1" after folder populates). Worked examples: Session 5B
  closeout (2 instances), Session 6 closeout (3 instances; all
  content-reference, 0 path-reference because Session 6 didn't
  move paths).
  Resolution shape: update prose claim at execution time;
  preserve δ-i-historical claims in closed-phase briefs.

Differential firing evidence (N=2 differential firings post-
gate): path-reference cluster fires when paths move;
content-reference cluster fires when state evolves without path
moves. Sub-shapes preserved per the codification-practice
meta-question's answer (sub-shape preservation when differential
firing evidence exists).

**Inter-session dependency sub-axis (read-time / pre-flight surface).**

Plans that reference prior session's state require pre-flight
verification that the prior state actually obtains. Mechanism:
plans cite prior commits / acceptance criteria / closeout state;
executors verify against current canonical state at session
start (typically Stop Condition 1); deviations halt execution
before commits land. Different timing surface from drift's
write-time / execution-time surfaces (which catch drift in plan
substrate); inter-session dependency catches drift in
cross-session inheritance.

N=3 evidence:

- Session 6 plan referencing Session 5B closeout state.
- Session 7 plan referencing Session 5B + Session 6.5 closeout
  state.
- Session 6 execution referencing Session 5B execution closeout
  state.

Threshold met (process meta-pattern; N=2 with shape match across
distinct timing surfaces; N=3 confirms). Codified as sub-axis
within the drift meta-pattern; the parent category absorbs the
sub-axis per the codification-practice meta-question's answer
(sub-shape preservation when differential firing evidence
exists).

**Prophylactic-vs-reactive mode-of-application sub-rule.**

The drift discipline applies in two modes:

- **Prophylactic mode (default).** Verify against canonical
  sources at pre-flight before drafting forward-looking content.
  Catches drift before it fires (lower cost; verification at
  read time).
- **Reactive mode (fallback).** Catch drift during execution
  via Edit anchor mismatches, grep sweeps, or surface
  discrepancies. Higher cost (drift surfaces in flight; requires
  in-session correction).

Default to prophylactic mode where the canonical state is
verifiable at pre-flight. Reactive mode is the catch-net when
prophylactic verification missed an instance.

N=3 evidence: Session 6.5 + Session 7 + Session 5B all applied
prophylactic verification at pre-flight; reactive catches still
fired during execution as expected fallback.

Worked examples:
- Prophylactic: Session 7 brainstorm caught the floor-only
  fire-count drift by NOT projecting in the plan (verification
  at pre-flight: read journal at execution time).
- Reactive: Session 6.5 caught the lib/hooks forbidden-list
  drift after the plan was written and execution began (Edit
  anchor mismatch surfaced during drafting).

**Codification-practice meta-question (settled at Session 8).**

Sub-shape preservation when differential firing evidence exists;
unification with examples otherwise. The differential-firing-
evidence threshold is the gating criterion: if proposed
sub-shapes have demonstrably different firing conditions
(different surface conditions trigger different sub-shapes),
preserve them as named sub-rules. If the proposed sub-shapes
are structural variants of the same firing condition, unify
with examples.

This answer applies consistently across drift meta-pattern
sub-shapes (path-reference vs content-reference; inter-session
dependency sub-axis; prophylactic-vs-reactive mode-of-
application). Future codification work in chounting applies the
same practice.

**Operational rules (codified in `docs/README.md` Pattern 7
bypass procedure).**

The drift discipline's operational rules live within Pattern 7's
bypass procedure section (per V2 Part 1's framing — discipline
operational rules are downstream of guardrail principle):

- Canonical-source verification at execution time (covers
  execution-time surface).
- Chronological-reality verification at planning time (covers
  planning-decision-time surface).
- Cross-reference verification at execution time (covers
  cross-reference-time surface; added at Session 8 C2).

The three operational rules apply to all bypasses regardless of
surface; together they cover the three timing surfaces of the
drift meta-pattern.

**Tier 3 carry-forward: recurring meta-arc placement question
(N=1 hold).**

The "should we move docs/07_governance/round-2/" question
recurred multiple times during round-2; closed by V2's Pattern
7 ratification. Codification candidacy: "ratification gaps
cause recurring questions" as a discipline rule. Per process-
meta-pattern threshold (N=2 with shape match across distinct
contexts), N=1 is insufficient evidence. **Hold at Tier 3.**
Codification candidacy remains; awaiting second fire (a future
round-N or arc-X recurring question would advance to N=2).
```

- [ ] Verify path-level cross-references in the new entry: `grep -n "DOCS_RESTRUCTURE_V2\|docs/README\|apps/web/src" docs/04_engineering/conventions.md | tail -20`.
- [ ] `pnpm typecheck && pnpm adr:lint && pnpm adr:index --check` clean.
- [ ] Stage: `git add docs/04_engineering/conventions.md`.
- [ ] Commit C1:
  ```
  docs(round-2): C1 — drift meta-pattern Tier 1 codification

  Updates conventions.md Round-2 section's drift meta-pattern
  entry from Tier 3 → Tier 2 trajectory text (N=2 evidence) to
  full Tier 1 codification (N=3 evidence with shape match across
  three timing surfaces). Codifies sub-shapes, sub-axis, and
  sub-rule per the codification-practice meta-question's answer
  (sub-shape preservation when differential firing evidence
  exists):

  - Three timing surfaces (execution-time, planning-decision-time,
    cross-reference-time) with N=3 evidence trail.
  - Path-reference vs content-reference sub-shapes within
    cross-reference-time surface (differential firing conditions:
    path moves vs state evolution).
  - Inter-session dependency sub-axis (read-time / pre-flight
    surface; N=3 firings: Session 6 plan, Session 7 plan, Session
    6 execution).
  - Prophylactic-vs-reactive mode-of-application sub-rule (N=3
    evidence: Session 6.5, Session 7, Session 5B).
  - Codification-practice meta-question recorded as canonical
    answer for future chounting codification work.
  - Tier 3 carry-forward: recurring meta-arc placement question
    held at N=1.

  Operational rules referenced; full text lives in docs/README.md
  Pattern 7 bypass procedure (C2 expands with third rule).
  V2 Part 2's N=2 evidence text preserved as ratification-time
  snapshot per δ-i discipline; this update is the live discipline
  doc reflecting the post-gate ratification.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  ```
- [ ] Stop condition 2: verify entry update + cross-references resolve + working tree clean.

---

## Task 2 (C2): docs/README.md Pattern 7 bypass-procedure expansion

- [ ] Read `docs/README.md` Folder placement guardrail section, specifically the Pattern 7 bypass-procedure subsection. Confirm current state has 2 operational rules (canonical-source verification at execution time + chronological-reality verification at planning time).
- [ ] Edit `docs/README.md` Pattern 7 bypass-procedure operational rules subsection. Add a third operational rule for cross-reference-time surface.

The third operational rule text (insert after the existing two):

```markdown
- **Cross-reference verification at execution time.** When
  drafting plans, closeouts, or canonical docs that cite paths
  or content in other docs, verify cross-reference resolution
  at execution time before committing. Path-level
  cross-references (cite paths, not post-rewrite content)
  mitigate cross-reference-time drift by construction; explicit
  grep-sweeps at execution time catch residual drift instances.
  Sub-shapes within this surface (path-reference vs
  content-reference clusters per `docs/04_engineering/conventions.md`
  Round-2 section) have differential firing conditions —
  path-reference fires when paths move; content-reference fires
  on state evolution.
```

- [ ] Verify cross-reference to conventions.md resolves: `grep -n "conventions.md\|Round-2 section" docs/README.md`.
- [ ] `pnpm typecheck && pnpm adr:lint && pnpm adr:index --check` clean.
- [ ] Stage: `git add docs/README.md`.
- [ ] Commit C2:
  ```
  docs(round-2): C2 — Pattern 7 bypass-procedure third operational rule

  Adds cross-reference verification at execution time as the third
  operational rule in docs/README.md Pattern 7 bypass-procedure
  section. The three operational rules together cover the three
  timing surfaces of the drift meta-pattern:

  - Canonical-source verification at execution time
    (execution-time surface).
  - Chronological-reality verification at planning time
    (planning-decision-time surface).
  - Cross-reference verification at execution time
    (cross-reference-time surface; added here).

  Path-level cross-references are the construction-level mitigation;
  explicit grep-sweeps at execution time catch residual drift.
  Sub-shapes (path-reference vs content-reference) named in the
  rule with cross-reference to conventions.md Round-2 section's
  full codification (per C1).

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  ```
- [ ] Stop condition 3: verify Pattern 7 has 3 operational rules + cross-reference resolves + working tree clean.

---

## Task 3 (C3): Methodology cluster bucket inventory + sub-categorization

- [ ] Read friction-journal entries from Sessions 5A through 6 closeouts to inventory methodology cluster bucket inhabitants. Verify against the brainstorm-time list (11 inhabitants); add any inhabitants surfaced in 5B / Session 6 / 6.5 closeouts that weren't tracked.
- [ ] Confirm the three sub-categorization clusters fit the actual inventory:
  - Cluster A (Codification-trajectory observations).
  - Cluster B (Session-execution discipline observations).
  - Cluster C (Scope/structural observations).
  - **Halt-and-split contingency check:** if inventory exceeds ~13-14 inhabitants OR clusters don't cleanly segment OR a fourth cluster (meta-meta observations) won't absorb cleanly into A/B/C, halt and surface for Session 9 deferral framework.
- [ ] Edit `docs/04_engineering/conventions.md` Round-2 section. Add a new sub-section after the drift meta-pattern entry (i.e., the entry C1 just updated):

```markdown
### Methodology cluster sub-categorization

The methodology cluster bucket accumulated 11+ inhabitants
during round-2 sessions (soft-threshold at 10 tripped at Session
6.5 closeout). Session 8 inventories and applies sub-
categorization. Three clusters with differential character:

**Cluster A: Codification-trajectory observations.**

Observations that are codification candidates currently at Tier
2 / Tier 3, OR observations that have graduated to dedicated
codification post-Session-8.

Inhabitants:
- Recurring meta-arc placement question (Tier 3 hold; N=1).
- Substrate-leverage phase observation (Tier 3 → Tier 2 per
  Session 5B closeout).
- [Plus any other Tier 2 / Tier 3 codification candidates the
  inventory surfaces.]

Graduated out (no longer in bucket; codified at dedicated entries):
- Drift meta-pattern (Tier 1 codification at Session 8 per
  drift meta-pattern entry above).
- Inter-session dependency mechanism (Tier 1 codification at
  Session 8 as sub-axis within drift meta-pattern).
- Prophylactic-vs-reactive sub-axis (codified at Session 8 as
  mode-of-application sub-rule within drift meta-pattern).

**Cluster B: Session-execution discipline observations.**

Operational discipline that fires within session execution
(typically at session-start or pre-push verification), distinct
from codification-trajectory candidates.

Inhabitants:
- Mid-dispatch plan re-read pre-push verification (N=2 per
  Session 6 brainstorm closeout).
- Pre-condition block N=2 holding (per Session 6 brainstorm).
- Parallel-session commit visibility (N=1 per Session 6
  brainstorm).

**Cluster C: Scope/structural observations.**

Observations about scope decisions, structural patterns, and
category preservation (meta-meta level).

Inhabitants:
- Count-level commit pattern variance (pattern at structural
  level; count varies — N=4 fire with count-of-3 per Session 6
  brainstorm closeout).
- Categorical-distinction-preservation meta-pattern (N=2 per
  Session 6 brainstorm closeout).
- Failure-mode taxonomy (forward vs backward; sub-pattern within
  structural-pattern bucket per Session 6 brainstorm closeout).

**Adding new observations to the bucket.**

Future round-N or arc-X observations land in the cluster they
match by character. New sub-cluster creation requires evidence
of differential character (per the codification-practice
meta-question's answer; sub-shape preservation when differential
firing evidence exists). The bucket count limits no longer apply
once sub-categorization is in place; instead each sub-cluster
operates under its own count discipline.

**Re-evaluation trigger.** Methodology cluster sub-categorization
re-evaluates if any sub-cluster grows past ~8 inhabitants
(soft-threshold 50% smaller than the parent bucket's 10-
inhabitant threshold, reflecting sub-cluster's narrower scope) OR
if a new observation doesn't fit cleanly into A / B / C. The
re-evaluation may add a fourth sub-cluster, split an existing
sub-cluster, or restructure the parent bucket.
```

- [ ] Verify the new sub-section integrates cleanly into Round-2 section (place it after the drift meta-pattern entry at appropriate document depth).
- [ ] `pnpm typecheck && pnpm adr:lint && pnpm adr:index --check` clean.
- [ ] Stage: `git add docs/04_engineering/conventions.md`.
- [ ] Commit C3:
  ```
  docs(round-2): C3 — methodology cluster sub-categorization

  Adds methodology cluster sub-categorization sub-section to
  conventions.md Round-2 section. Three clusters with differential
  character:

  - Cluster A (Codification-trajectory observations): recurring
    meta-arc placement question, substrate-leverage phase, plus
    Tier 2 / Tier 3 candidates the inventory surfaces. Three
    items graduated out at Session 8 (drift meta-pattern,
    inter-session dependency, prophylactic-vs-reactive).
  - Cluster B (Session-execution discipline observations):
    mid-dispatch plan re-read, pre-condition block, parallel-
    session commit visibility.
  - Cluster C (Scope/structural observations): count-level
    commit pattern variance, categorical-distinction-preservation
    meta-pattern, failure-mode taxonomy.

  Sub-categorization mechanic per the codification-practice
  meta-question's answer: sub-clusters operate under their own
  count discipline; new sub-cluster creation requires differential
  character evidence; re-evaluation trigger at ~8-inhabitant
  sub-cluster soft-threshold or unabsorbed new observation.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  ```
- [ ] Stop condition 4: verify sub-categorization addition + inventory verified + working tree clean.

---

## Task 4 (C4): Pre-C4 floor-only verification + closeout commit + push

- [ ] `pnpm db:reset:clean`.
- [ ] `pnpm agent:validate` (expect 26/26 GREEN).
- [ ] `pnpm typecheck && pnpm adr:lint && pnpm adr:index --check` clean.
- [ ] Stop condition 5: verify floor-only output.
- [ ] Verify friction-journal heading structure. Open `docs/07_governance/friction-journal.md` and confirm the active-section heading is `## Phase 2`.
- [ ] Read the friction-journal at the top of `## Phase 2` to determine the actual floor-only fire count post-this-push. Per the drift discipline, do NOT project — read the most recent entry's recorded count (post-Session-6-execution = N=9 LIVE) and increment by 1 for this push.
- [ ] Insert friction-journal closeout entry at top of `## Phase 2`. Structure:

```
- 2026-05-MM NOTE — Round-2 docs reorganization Session 8
  execution closeout (codification tail adjudications shipped).
  Three implementation commits + closeout per the codification-
  adjudication-shape locked at Session 8 brainstorm + plan at
  `docs/07_governance/round-2/2026-05-10-session-8-plan.md`.

  Three implementation commits + closeout:
  - C1 <hash> (drift meta-pattern Tier 1 codification): full
    Tier 1 codification with three timing surfaces, sub-shapes
    (path-reference vs content-reference), sub-axis (inter-
    session dependency), mode-of-application sub-rule
    (prophylactic-vs-reactive), N=3 evidence trail, codification-
    practice meta-question recorded as canonical answer.
  - C2 <hash> (Pattern 7 third operational rule): cross-reference
    verification at execution time added to docs/README.md
    Pattern 7 bypass-procedure section. Three operational rules
    now cover three timing surfaces.
  - C3 <hash> (methodology cluster sub-categorization): three
    clusters (codification-trajectory, session-execution
    discipline, scope/structural) with inventory enumerated.
    [Halt-and-split contingency: not triggered / triggered.]
  - C4 (this commit): closeout.

  Acceptance criteria — all 12 satisfied (a-l per plan).

  **Locked decisions (Session 8 brainstorm-validated):**
  - Codification-practice meta-question answered: sub-shape
    preservation when differential firing evidence exists.
  - Drift meta-pattern category: process meta-pattern (NOT
    architectural principle).
  - Drift meta-pattern ratification path: conventions.md update +
    Pattern 7 bypass-procedure expansion. V2 stays as
    ratification snapshot.
  - Inter-session dependency mechanism: codified as sub-axis
    within drift meta-pattern (preserved sub-shape per
    differential timing surface).
  - Prophylactic-vs-reactive sub-axis: codified as
    mode-of-application sub-rule within drift discipline.
  - Recurring meta-arc placement question: held at Tier 3 (N=1
    insufficient evidence; awaiting second fire).
  - Methodology cluster sub-categorization: three clusters
    (A: codification-trajectory; B: session-execution discipline;
    C: scope/structural).

  **Cross-reference-time drift surface — post-gate frequency
  evidence (NOT trajectory advancement):**

  Sub-instances caught during Session 8 execution:
  [Enumerate any cross-reference-time drift catches that fired
  during execution; verify against actual edits applied. Expected:
  some content-reference instances likely surfaced (V2 Part 2's
  N=2 evidence text vs current N=3 reality; conventions.md's
  "Tier 3 → Tier 2 trajectory" text vs current Tier 1 ratification).
  These are post-gate; record as frequency evidence.]

  **Round-2 closure declaration.**

  [If all four implementation commits landed cleanly:]

  Round-2 docs reorganization closes at this push. Round-2
  spanned Sessions 1 through 8 (with Session 6.5 + 5B execution
  + Session 6 execution interim + Session 7 V2 ratification +
  Session 8 codification tail). The meta-arc folder
  `docs/07_governance/round-2/` becomes a historical archive.
  Future round-N work creates `docs/07_governance/round-N/` per
  the round-N workflow convention codified at Session 7 C6.

  Phase 1 onset readiness: confirmed. Source-tree authority
  discipline holds across N=4 sessions post-V2-ratification
  (Session 7 + 5B + Session 6 + Session 8). Phase 1 storage /
  evidence work unblocked.

  [If any work unit deferred (e.g., bucket-structural split to
  Session 9):]

  Round-2 closure declaration partial. Session 8 closes the
  codification work; [deferred work] defers to Session 9 with
  framework: [framework details]. Full round-2 closure declaration
  attaches to Session 9 closeout (or whichever future session
  resolves the deferred work).

  **Pre-codification observation queue post-Session-8-execution
  (queue updates):**

  - Tier 1 LIVE: Floor-only push gate carve-out advances to N=10
    LIVE this push (read journal at execution time; current
    chronological count). Drift meta-pattern Tier 1 codification
    ratifies at conventions.md (graduates from Tier 2 → Tier 1
    candidacy to Tier 1 ratified). Inter-session dependency
    sub-axis ratifies as part of drift meta-pattern codification.
  - Tier 2: status reaffirmed; substrate-leverage phase observation
    holds at Tier 2.
  - Tier 3: recurring meta-arc placement question holds at N=1.
    Prophylactic-vs-reactive sub-axis graduates out (codified at
    Session 8 as mode-of-application sub-rule).
  - Methodology cluster bucket: sub-categorized into 3 clusters
    (A/B/C per C3); 3 inhabitants graduated out (drift, inter-
    session, prophylactic). Sub-cluster operating under own
    count discipline per re-evaluation trigger.

  **Push-readiness gate (per CLAUDE.md three-condition gate,
  floor-only carve-out path, [N=actual] invocation):**
  - Condition 1 (test-suite health): GREEN under floor-only
    path. `pnpm db:reset:clean && pnpm agent:validate` reports
    26/26.
  - Condition 2 (doc-sync): GREEN. Session 8's primary
    deliverable IS doc-sync work (codification ratifications +
    bucket sub-categorization).
  - Condition 3 (governance closeout): this entry; carry-forwards
    captured below.

  **Forward pointers:**

  [If round-2 closes:]

  - Round-2 closes at this push. No further round-2 sessions
    planned; meta-arc folder becomes historical archive.
  - Phase 1 storage / evidence work unblocked at operator's
    discretion.
  - Future round-N work creates a new meta-arc folder per the
    codified workflow.

  [If partial closure:]

  - Session 9 brainstorm next; scope: [deferred work].
  - Round-2 closure declaration attaches to Session 9 closeout.
```

Replace `2026-05-MM` with execution date, `<hash>` with actual SHAs, `[N=actual]` with chronological count, [bracketed conditional content] with the actual disposition.

- [ ] Commit C4:
  ```
  docs(governance): friction-journal — round-2 Session 8 closeout / round-2 closure

  [If round-2 closes:]
  Closes round-2 docs reorganization at this push. Three
  implementation commits (drift meta-pattern Tier 1 codification;
  Pattern 7 bypass-procedure third operational rule; methodology
  cluster sub-categorization) plus this closeout.

  Notable observations:

  - Drift meta-pattern Tier 1 codification ratifies at
    conventions.md Round-2 section. Process meta-pattern category
    (NOT architectural principle); ratification path through
    conventions.md update + Pattern 7 bypass-procedure expansion;
    V2 stays as ratification snapshot.
  - Sub-shape preservation when differential firing evidence
    exists settled as canonical codification practice.
  - Inter-session dependency mechanism + prophylactic-vs-reactive
    sub-axis codified within drift meta-pattern (sub-axis +
    sub-rule preserved per differential firing evidence).
  - Recurring meta-arc placement question held at Tier 3 (N=1
    insufficient).
  - Methodology cluster bucket sub-categorized (3 clusters A/B/C);
    three inhabitants graduated out.
  - Cross-reference-time drift sub-instances caught at execution
    time as post-gate frequency evidence.
  - Floor-only carve-out at N=[actual] LIVE.
  - Phase 1 onset readiness confirmed; source-tree authority
    discipline holds N=4 sessions post-V2.

  [If partial closure:]
  Codification work shipped; [deferred work] defers to Session 9
  with framework. Round-2 closure declaration attaches to
  Session 9 closeout.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  ```
- [ ] Stop condition 6: verify push-readiness state.
- [ ] Push to staging: `git push origin staging`.

---

## Self-review checklist (run before declaring plan complete)

- [ ] Codification-practice meta-question answered first and applied consistently across work units 1, 2, 4 (sub-shape preservation when differential firing evidence exists).
- [ ] Drift meta-pattern category boundary settled (process meta-pattern, NOT architectural principle); Principle 4 ruled out per category mismatch.
- [ ] Drift meta-pattern ratification path: conventions.md update + Pattern 7 expansion. V2 stays as ratification snapshot.
- [ ] Inter-session dependency mechanism codified as sub-axis (preserved sub-shape per differential timing surface; not as standalone rule).
- [ ] Prophylactic-vs-reactive sub-axis codified as mode-of-application sub-rule (preserved sub-shape per differential application modes).
- [ ] Tier 3 disposition: recurring meta-arc placement question held at Tier 3; prophylactic-vs-reactive codifies (no longer Tier 3).
- [ ] Methodology cluster sub-categorization: 3 clusters (A/B/C) with inventory enumerated; halt-and-split contingency named for execution-time scope pressure.
- [ ] Round-2 closure declaration: attached to Session 8 closeout if all work units complete; deferral framework named otherwise.
- [ ] Floor-only fire count NOT projected; C4 reads journal at execution time and increments.
- [ ] Path-level cross-references throughout (verified at execution time).

---

## Notes for executor

- **Codification-practice meta-question is the first decision.** It cross-cuts work units 1, 2, 4. Settle once and apply consistently: sub-shape preservation when differential firing evidence exists.

- **Category boundary determines ratification path.** Drift meta-pattern is process meta-pattern (not architectural principle). Ratification through conventions.md + Pattern 7 expansion, NOT V2 Principle 4 amendment. Same category logic applies to inter-session dependency mechanism.

- **V2 Part 2's N=2 evidence text stays as ratification snapshot.** V2 records the state at V2-ratification time; subsequent codification advancement lives in conventions.md (the live discipline doc). No V2 amendment needed.

- **Pattern 7 third operational rule covers cross-reference-time surface.** Two existing rules cover execution-time + planning-decision-time; the third completes the three-surface coverage.

- **Methodology cluster sub-categorization halt-and-split contingency.** If inventory exceeds ~13-14 inhabitants OR clusters don't cleanly segment OR a fourth cluster won't absorb, halt and surface for Session 9 deferral. Single-Session-8 absorption is default; halt-and-split is contingency.

- **Round-2 closure declaration is conditional on all work units completing.** If C1-C3 land cleanly + Tier 3 dispositioned + bucket sub-categorized, closeout declares closure. If anything defers, closeout records deferral framework and closure attaches to whichever future session resolves remaining work.

- **Cross-reference-time drift sub-instances expected during Session 8 execution.** V2 Part 2's "N=2 evidence" text + conventions.md's "Tier 3 → Tier 2 trajectory" text both pre-date the gate firing at Session 5B. C1 updates conventions.md; V2 stays as snapshot. Other content-reference drifts may surface during execution; record as post-gate frequency evidence in C4 closeout.

- **Closeout entry structure matches Session 5A/5B/6/6.5/7 closeout shape** (locked decisions, brainstorm-time observations, queue updates, push-readiness gate, forward pointers). Round-2 closure framing is the new structural element this closeout introduces; preserve clean separation between codification observations + closure declaration.

- **Pre-commit hook session-lock warning is informational.** Proceed without invoking session-lock unless the warning becomes a blocker.

- **If any acceptance criterion fails verification: halt and surface to operator.** Do NOT attempt to resolve mid-stream by adjusting codification text beyond the explicit content sketches in the Brainstorm context section. Brainstorm context is design substrate; deviations require operator confirmation before landing.
