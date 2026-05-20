# Plan-authoring conventions

Drafting-time discipline that fires when a session is writing a plan,
brief, scope-lock input, or handoff prompt. These rules catch
"narratively correct, contractually wrong" drift between drafter
prose and shipped reality.

See [`README.md`](./README.md) for the sub-folder routing rule and
the broader [`../README.md`](../README.md) for the topical routing
rule.

---

## Cited-Code Verification

When a sub-brief cites an existing Zod schema, service function,
or other module as "used verbatim" or "cite this schema," the
drafter MUST grep the cited file for self-referential placeholders
that signal pending migration:

```bash
grep -nE 'Phase 1\.1|Phase 1\.2|not implemented|TODO|DEPRECATED' <cited-file>
```

Hits signal that the cited code may not currently behave as the
sub-brief assumes. Each hit is either a pending migration the
session must perform (remove the guard, update the comment) or an
inherited assumption that will fail the session's first test run.

Codified from Phase 1.2 Session 2 (2026-04-18):
`PostJournalEntryInputSchema` and `ReversalInputSchema` carried
four `.refine()` guards rejecting `source='agent'` and
`dry_run=true` with messages "not implemented in Phase 1.1." The
schema file's own comment block at lines 86–93 explicitly named
Phase 1.2 as the migration window — but the sub-brief cited both
schemas as "verbatim, no new Zod" without the grep that would have
caught it. Cost one stop-and-flag mid-execution; grep takes five
seconds at drafting time. See
`docs/07_governance/friction-journal/phase-1.2.md` entry 2026-04-18 (Phase
1.1 agent-path guard removal).

---
**Origin:**
- First codified: Phase 1.5A, 2026-04-15
- Evidence basis: N=1 first-instance precedent (Phase 1.2 Session 2
  `.refine()` guards)
- Promoted from: Phase 1.5A convention codification batch (codified
  from Phase 1.2 Session 2)
- Cross-references:
  `docs/07_governance/friction-journal/phase-1.2.md` entry
  2026-04-18 (Phase 1.1 agent-path guard removal)

---

## Spec-to-Implementation Verification

When drafting a sub-brief, every numeric claim, literal value,
list element, structural reference, or identity assertion that
cites authoritative source material (master brief, Phase 1.5
decision records, ADRs, migration files, locale files, prior
sub-briefs, or shipped source code) MUST be verified by grep or
file read against the cited source BEFORE the sub-brief
freezes.

Examples of the pattern (drawn from the codifying datapoints of
this convention):

- **Numeric claims** ("test count", "file count", "row count")
  — run the relevant `find | wc -l` or `grep -c` against the
  authoritative source.
- **Literal values** (state shapes, enum values, constant
  strings) — grep the authoritative source for the literal.
- **List elements** (`completed_steps`, valid template_ids,
  exit criteria ordering) — read both sides and diff.
- **Structural references** (master §X.Y cited in sub-brief
  §Z.W) — read both sections and confirm the claim holds.
- **Identity assertions** (named symbols — functions, methods,
  routes, schema fields, constants) — grep the symbol at the
  cited location before claiming it exists.
- **Temporal claims** (phrases like "first", "new", "not yet
  implemented", "the only current X", "no current call site
  does Y") — verify via grep against the shipped codebase, not
  against a mental model of a prior phase. Codebase state
  drifts faster than drafter memory updates.
- **Call-site enumeration** (plans that extend a widely-called
  API — new required field on a function signature, new prop on
  a shared component) — enumerate call sites exhaustively via
  `grep -rn` against the target symbol rather than by
  naming-family pattern-matching of sibling test files or
  co-located modules.

The cost is 5–10 minutes of grep-verification per sub-brief;
the payoff is avoiding mid-execution drift where the executor
has to reconcile contradictions. Apply to every sub-brief from
this point forward.

**Three codifying datapoints** (from Sessions 4–5 execution and
drafting):

1. Session 4 test-ripple count: Clarification E's sub-brief
   text stated 6 `loadOrCreateSession` call sites (CA-45 × 4 +
   CA-46 × 2); the actual count via grep was 9 (CA-45 × 6 +
   CA-46 × 3). The founder's pre-execution final pass caught
   it; execution used the corrected number. Caught at the
   boundary between drafting and execution — one turn's notice.

2. Session 5 sub-brief revision: the draft text in §6.7 said
   invited-user `completed_steps` initialized to `[1, 2, 3]`;
   master brief §11.5(c) specifies `[2, 3]`. Caught during the
   founder's review round before freeze. The drafter's
   narrative logic for the invited-user flow was correct
   throughout; only the numeric initial state drifted.

3. Session 5 execution Bug 1 (§6.3 internal contradiction):
   the sub-brief simultaneously stated "onboardingSuffix
   returns empty for null" and "the old behavior (generic
   onboarding suffix) still fires" under the defense-in-depth
   guard — contradictory if both route through the same
   function. Caught at the Commit 1 founder review gate during
   execution. Resolved by splitting into two exports
   (`onboardingSuffix` for step-aware; `genericOnboardingSuffix`
   for the legacy fallback).

Class: "narratively correct, contractually wrong against the
cited source." The drafter's overall reasoning was right in
each case; a specific value or a specific reference drifted.
Automation-by-grep is cheaper than detection-by-close-reading.

**Refinement datapoint (Session 6):** the pre-execution
code-grep caught a sub-brief claim that
`invitationService.getByToken` existed at the cited location; it
did not. The drafting-time verification passes had faithfully
covered the four original categories and missed the claim
because it was a fifth class — a named symbol asserted to exist.
The fifth bullet (**Identity assertions**) was added to close
that gap. Same class as the original three ("narratively
correct, contractually wrong"); different verification move
(grep for the symbol, not the value).

**Refinement datapoint (Phase A):** the Prompt 3 draft for
codifying the `before_state` capture convention asserted "no
current call site populates `before_state`" and framed
`periodService.lock` / `unlock` as "the first real exercise of
this convention." Both claims were false — Phase 1.5A had
introduced the convention across six service files two weeks
earlier, with three integration tests and an entry at the
prior `conventions.md:190` (pre-v2.2-split location; now in
[`../audit-permissions.md`](../audit-permissions.md) under
"Audit `before_state` Convention"). The previous five-category
list (through Identity Assertions) covered facts about the
shipped code but not *temporal* claims about it. The sixth
bullet (**Temporal claims**) was added to close that gap. Same
class as the prior datapoints ("narratively correct,
contractually wrong"); different verification move (grep against
the current codebase for the temporal assertion, not against
drafter memory of a prior phase). See
`docs/07_governance/friction-journal/phase-1.2.md` "Phase A"
section, subsection A, for the incident record.

**Refinement datapoint (Phase C):** the Phase C Site 1
execution plan's File Structure map listed 4 existing
`buildSystemPrompt*` test files to update with a new
`now: Date` parameter; grep at execution surfaced 7 (three
additional files used the prop through sibling-helper
composition rather than direct calls). 75% underestimate.
Plan-time grep of the target symbol would have caught it.
Same class as the prior refinements ("narratively correct,
contractually wrong"); different verification move (grep the
call sites of the symbol being changed, not the sibling-family
of the test names). See `docs/07_governance/friction-journal/phase-1.2.md`
Phase C section (c) under "Plan-time-discipline family" ("B5
file-structure underestimate") for the incident record.

**Relationship to Cited-Code Verification** (above): Cited-Code
Verification catches drift between shipped source files and
sub-brief prose that cites them as "used verbatim" or "existing
behavior." Spec-to-Implementation Verification catches drift
between authoritative source material (master brief, master
decisions, prior sub-briefs) and the sub-brief being drafted.
The two are complementary — one guards the source-of-truth →
implementation direction, the other guards the source-of-truth
→ sub-brief direction. Both apply during drafting; neither
supersedes the other.

---
**Origin:**
- First codified: Phase 1.2, 2026-04-19 (Session 5/6 batched pass)
- Evidence basis: N=3 codifying datapoints (Sessions 4–5) +
  three refinement datapoints (Session 6 Identity Assertions, Phase
  A Temporal Claims, Phase C Call-site Enumeration)
- Promoted from: Sessions 4–5 execution and drafting
- Cross-references: Cited-Code Verification (above);
  `docs/07_governance/friction-journal/phase-1.2.md` Phase A and
  Phase C section (c)

---

## Plan-Time Model-Config Verification

Plans that include paid-API work against a specific model
(Anthropic, OpenAI, or otherwise) MUST verify the model's
current pricing, token-window behavior, prompt-caching
behavior, and rate-tier eligibility at plan time rather
than inherit from prior plans. Model configurations change
between plans, and a plan that inherits stale configuration
assumptions will produce accurate-looking estimates that
quietly diverge from reality.

Rationale: the Phase D execution plan's `jq` query for
Anthropic spend extraction did not include
`cache_creation_input_tokens` or `cache_read_input_tokens`
fields, assuming a non-cached input pricing model.
Sonnet 4.6 uses prompt caching. The Entry 1 retry at
2026-04-22 happened not to use caching (fresh session; no
cache-control markers effective on a single-turn arc), so
no misreport occurred in practice — but the template would
have under-reported for any cached turn. Structurally the
same pattern as working-tree-cleanliness and
C6-evidence-preservation: untested environmental
assumption that fires silently until it breaks. See
`docs/07_governance/friction-journal/phase-1.2.md` Phase C section
(c) under "Plan-time-discipline family" for the full
incident record. First observed: 2026-04-22, O3 Phase D
execution plan.

---
**Origin:**
- First codified: Phase 1.2, 2026-04-22 (Phase C ratification pass)
- Evidence basis: N=1 first-instance precedent (O3 Phase D plan
  `jq` query missing cache fields)
- Promoted from: O3 Phase D execution plan
- Cross-references:
  `docs/07_governance/friction-journal/phase-1.2.md` Phase C
  section (c) under "Plan-time-discipline family"

---

## Round-N restructure plan workflow

Round-N docs reorganization arcs follow a stable artifact
pattern:

- Arc-level brief lives at the docs root during the arc (e.g.,
  `docs/restructure-plan.md` for round-1's V1, until elevated).
- Session-level plans live at the meta-arc folder
  (`docs/07_governance/round-N/`).
- At arc closure, the arc-level brief elevates to
  `docs/07_governance/DOCS_RESTRUCTURE_V<N>.md` alongside the
  new `DOCS_RESTRUCTURE_V<N+1>.md` (which becomes the V1 source
  for the NEXT round).

The meta-arc folder under `07_governance/round-N/` is a
Pattern 7 conditional-permission case (cross-phase meta-arc
exception to Principle 2 of V<N>.md). First-instance precedent:
`docs/07_governance/round-2/`.

---
**Origin:**
- First codified: Round-2 Conventions, 2026-05-09
- Evidence basis: First-instance precedent
  `docs/07_governance/round-2/`
- Promoted from: Round-2 docs reorganization arc
- Cross-references: `docs/07_governance/DOCS_RESTRUCTURE_V2.md`;
  ADR-0022 (Pattern 7 conditional permission)

---

## "Verify the artifact before agreeing with an alarm" rule

When someone (operator, agent, doc) raises an alarm about an
artifact's state, verify against the artifact directly before
responding. Don't agree with the alarm based on memory of the
prior state; read the artifact at alarm-time.

Worked example: Session 6.5 plan claimed `lib/` was forbidden
in the authority-layer enumeration; canonical
`docs/03_architecture/folder-structure.md` actually lists `lib/`
as a permitted forward-looking layer. Executor verified against
folder-structure.md (canonical) before drafting; canonical won.

Failure mode this prevents: "agent agrees with the alarm because
the operator raised it" — propagating a misreading because the
alarm felt authoritative. The discipline is: verify directly,
then respond. The alarm-raiser may be right; the artifact is the
tiebreaker.

---
**Origin:**
- First codified: Round-2 Conventions, 2026-05-09
- Evidence basis: Session 6.5 plan `lib/` forbidden-list misreading
- Promoted from: Round-2 session 6.5 execution
- Cross-references: `docs/03_architecture/folder-structure.md`

---

## Plan-substrate-vs-canonical-reality drift meta-pattern (Tier 1 codified)

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

---
**Origin:**
- First codified: Round-2 Conventions, 2026-05-09 (Session 8 C1)
- Evidence basis: N=3 (Session 6.5 closeout + Session 7 brainstorm
  + Session 5B execution closeout) with shape match across three
  distinct timing surfaces
- Promoted from: Round-2 Session 8 codification
- Cross-references: `docs/07_governance/DOCS_RESTRUCTURE_V2.md`
  Pattern 7 bypass procedure; `docs/README.md` Pattern 7

---

## Volume-forecast — Phase-A-realized forecast trumps cycle-grade forecast

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
30-50% on average; Phase-A-realized forecasts undercount by ≤10% on
average.

**Evidence basis (N=4 graduation):** Phase 6.5 chunk 3 (v3 §5.1
forecast 500-700 LOC → A4.1 Phase-A-realized 985-1475 LOC → realized
~850 LOC at `29e2ba1` + `eab3f5e`); Phase 6 chunk 6.2b Flag 16 (97%
above cycle-grade upper bound; near Phase-A-realized at chunk-close
grain). Two-arc independent evidence basis.

### Four-curve calibration extension (Phase 5.1 close, 2026-05-19)

The original three-curve calibration framing (walk-grain stable;
cycle-close below; chunk-brief at-or-above) held across Phase 6.5
cycle-substantive chunks and Phase 5.1 chunks 5.1a + 5.1b. Phase 5.1
chunk 5.1c — a substrate-fix narrowness chunk addressing Cat 2
apReport URI-too-long N=3 graduation — produced two-grain forecast-
realization at-or-below floor at both brief-grade and impl-grade.
The original three-curve calibration's chunk-brief curve ("at-or-
above forecast") needs sub-curve split for substrate-fix-narrowness
chunks:

- **Sub-curve (a) — Cycle-substantive at-or-above.** Cycle-substantive
  chunks (broader scope; INV-ID introductions; T3 ADR amendments;
  migrations; substrate spine work) realize at-or-above the chunk-
  brief forecast floor with +0 to +20% upside. Evidence: chunk 5.1a
  brief 938 LOC (at-or-above ~900 LOC floor); chunk 5.1b brief 788
  LOC (at-or-above ~750 LOC floor); Phase 6.5 chunk-brief grain
  precedent (Sessions 5 + 8 + 11). Forecast band tighter than impl-
  grade (brief-grade calibration captures the structured 10-section
  template scope before substrate density variance enters at impl).
- **Sub-curve (b) — Substrate-fix-narrowness at-or-below.** Substrate-
  fix narrowness chunks (single-helper refactor; no INV-ID intro;
  no T3 ADR amendments; no migration; no schema changes) realize
  at-or-below the chunk-brief forecast floor. Evidence: chunk 5.1c
  brief 583 LOC (~3% below ~600 floor; ~600-1000 forecast band);
  chunk 5.1c impl +12 net LOC (~88% below ~100-300 forecast band
  floor). Two-grain consistency at brief-grade AND impl-grade
  confirms the sub-curve. The structural template's required
  section coverage compresses naturally when substrate-fix scope
  is narrow (Reading B preservation note becomes "preserved by
  construction"; Two Laws §7 becomes "N/A per READ-ONLY service
  refactor"; risk catalog stays focused on the single fix-shape
  axis).

**How to apply.** At chunk-brief drafting grain, classify the chunk
scope as cycle-substantive vs substrate-fix-narrowness before
locking the forecast band. Cycle-substantive chunks anchor on
sub-curve (a) at-or-above framing; substrate-fix-narrowness chunks
anchor on sub-curve (b) at-or-below framing. The classification
question: does the chunk introduce INV-IDs, T3 ADR amendments,
migrations, or schema changes? If yes (any one), cycle-substantive.
If no (all four absent), substrate-fix-narrowness.

**Evidence basis (Phase 5.1 close extension, N=2 two-grain
consistency):** chunk 5.1c brief grade (583 LOC; ~3% below ~600
floor at brief-drafting authorship grain) + chunk 5.1c impl grade
(+12 net LOC; ~88% below ~100 floor at implementation-authorship
grain). First substrate-fix-narrowness instance in calibration
catalog; future substrate-fix-narrowness chunks calibrate against
this two-grain anchor as evidence accretes.

**Cross-references.**
- Phase 6.5 retrospective §3 Candidate #9.
- Phase 5.1 retrospective §3 Observations #24 + #27 (four-curve
  calibration two-grain consistency at chunk 5.1c brief + impl).
- RI-7 session-budget-feasibility verification at scope-lock
  ([`scope-lock.md`](./scope-lock.md) §Verify-forward-at-scope-lock
  for computational-shape chunks → §Session-budget-feasibility
  verification (RI-7)).

---
**Origin:**
- First codified: Phase 6.5, 2026-05-17 (Phase 6.5 retrospective
  close); four-curve sub-curve split added at Phase 5.1,
  2026-05-19 (Phase 5.1 retrospective close)
- Evidence basis: N=4 graduation at Phase 6.5 (Phase 6.5 chunk 3
  + Phase 6 chunk 6.2b Flag 16; two-arc independent evidence
  basis); sub-curve (b) substrate-fix-narrowness extension at
  Phase 5.1 (chunk 5.1c brief 583 LOC + impl +12 LOC; two-grain
  consistency at brief-grade AND impl-grade)

**Evaluation basis (Phase 5.1 sub-curve extension):**

- **Load-bearing (prescriptive).** The sub-curve split generates
  operator action at chunk-brief drafting grain: classify chunk
  scope as cycle-substantive vs substrate-fix-narrowness before
  locking the forecast band; anchor on sub-curve (a) at-or-above
  framing OR sub-curve (b) at-or-below framing per classification.
  Without the sub-curve split, substrate-fix-narrowness chunks
  trigger volume-realization concern false alarms ("brief 3% below
  floor; impl 88% below floor — is the work undersized?") when the
  realization is in fact expected per substrate-fix narrowness.
- **Generalizable.** The classification question (does the chunk
  introduce INV-IDs, T3 ADR amendments, migrations, or schema
  changes?) is general across phases; not Phase-5.1-specific. Future
  substrate-fix-narrowness chunks at Phase 7+ (e.g., performance-
  patch chunks; bug-fix chunks; obsoleted-substrate-removal chunks)
  inherit sub-curve (b) calibration.
- **Stable (exploratory framing — sub-curve (b)).** Sub-curve (a)
  cycle-substantive at-or-above is N=4 graduated. Sub-curve (b)
  substrate-fix-narrowness at-or-below is N=2 two-grain consistency
  at chunk 5.1c (brief-grade + impl-grade); below the N=3 graduation
  threshold for full codification per `codify-convention` skill.
  Codified at exploratory framing per `docs/04_engineering/conventions/README.md`
  §Graduation criteria: the sub-curve extension is provisional
  until N=3 cross-phase evidence accretes (next substrate-fix-
  narrowness chunk extends the evidence basis).
- Promoted from: Phase 6.5 retrospective §3 Candidate #9; Phase 5.1
  retrospective §3 Observations #24 + #27
- Cross-references: Phase 6.5 retrospective §3 Candidate #9;
  Phase 5.1 retrospective §3 Observations #24 + #27;
  RI-7 session-budget-feasibility verification at scope-lock
  ([`scope-lock.md`](./scope-lock.md) §Session-budget-feasibility
  verification + Path C invocation conditions (RI-7))

---

## Plan-authoring substrate-verification at transitive-dependency grain

Plan-authoring (briefs, plan files, session-start prompts) cites
substrate at cited-substrate grain — what's listed in the planning
artifact. Verify-from-disk operates at transitive-dependency grain —
what the cited substrate actually depends on, exists at, or supports.
Gaps surface at implementer dispatch when cited substrate's
transitive dependencies don't exist or projected scope exceeds what
substrate enables.

The discipline: at plan-authoring grain, dispatch a verify-from-disk
recon subagent BEFORE locking scope to confirm cited substrate +
transitive dependencies + scope feasibility. Sub-shapes:

- **B1 — Substrate-citation verification.** Cited substrate may
  reference tables, types, files, or sections that don't exist (have
  been deferred / not yet activated / renamed / moved). Recon at
  plan-authoring grain catches these before scope-lock.
- **B2 — Scope-projection verification.** Plan may project scope
  larger than substrate supports (e.g., 4 mutations cited but only
  3 active per ADR reservation; 7 tests cited but only 6 fit the
  test-architecture rule). Recon at plan-authoring grain catches
  scope-substrate mismatch before scope-lock.

Mechanism: cited-substrate grain is what plan-authoring sees in the
canonical substrate; verified-from-disk grain is what actually exists
+ what the cited substrate transitively depends on + what scope the
substrate enables. The two diverge when (a) substrate has been
deferred to a future arc but cited as active (B1), OR (b) plan-
authoring projects scope beyond what substrate explicitly supports
(B2). Both surface as gaps at implementer dispatch unless caught
preventively.

Adjacent to Z1 #11.b (verbatim re-read at drafting-onset for cited
substrate). Cluster B fires earlier: at plan-authoring-onset, before
scope-lock. The discrimination is timing — Z1 #11.b is for drafters;
Cluster B is for plan-authors.

Trigger: any plan-authoring activity that cites substrate by section
reference, table name, type name, or scope count (mutations, tests,
events, files). Single-line plan items don't fire; multi-line plan
bodies or session-start prompts do.

Precedent: Phase 5 chunk B5-1 sessions #1+#2. Codified at chunk B5-1
session #3 closeout (2026-05-10) per cross-arc N=2 graduation pathway
via candidate (e). B1 instances: session #1 D5/(orgset-β)
substrate-citation gap; session #2 D3 approval-gate substrate-
misreading + D5 Q-lock notation drift; session #3 pickup-file-content-
tracking gap (meta-evidence at pickup-file-maintenance grain). B2
instances: session #2 D1-γ scope reduction (4→3 mutations) + D2-α
scope reduction (7→6 tests). Runtime grain (B3) covered separately
by `.claude/skills/integration-test-rules/` §3 dedicated-test-accounts
pattern; not a Cluster B sub-discipline. See
`docs/07_governance/friction-journal.md` Phase 5 chunk B5-1 closeout
retrospective entry (2026-05-10) Adjudication 1 for full evidence
basis.

---
**Origin:**
- First codified: Phase 5 chunk B5-1 session #3 closeout, 2026-05-10
- Evidence basis: N=2 graduation per cross-arc pathway candidate (e);
  B1 instances (session #1 D5/(orgset-β) + session #2 D3 + session
  #3 pickup-file-content-tracking gap); B2 instances (session #2
  D1-γ + D2-α)
- Promoted from: chunk B5-1 session #3 closeout retrospective entry
- Cross-references:
  `docs/07_governance/friction-journal.md` Phase 5 chunk B5-1
  closeout retrospective entry (2026-05-10) Adjudication 1;
  `.claude/skills/integration-test-rules/` §3 (B3 runtime grain
  covered separately)
- v2.2 reorg: 2026-05-17 (relocated from repo-root CLAUDE.md at
  Commit D per `docs/09_briefs/phase-6.5/reorg-proposal-v2.md` §4.1)

---

## Partial-information-recommendation-drift discipline

When authoring a recommendation, brief, handoff prompt, or other
substrate that frames decisions for downstream consumption,
partial-information recommendations (recommendations made without
disk-verify on cited substrate) introduce drift that surfaces at
consumption time. Two firing-shapes:

- **Retrospective drift.** Recommendation references *prior work*
  (citations to existing files / sections / decisions) without
  disk-verify. Catch authority = reader of recommendation.
  Discovery moment = post-recommendation reading. Codification
  surface = drift-fix entry post-discovery.

- **Prospective drift.** Recommendation frames *future work*
  (handoff prompts / brief drafts) with quantitative anchors or
  substrate references without disk-verify at authoring time. Catch
  authority = execution-side session-onset state-verify. Discovery
  moment = pre-execution at substrate-receipt. Codification surface
  = Round 0 state-verify ratification + downstream consumption
  surfaces.

**Discipline rule.** Recommendations that cite substrate (file
paths / section references / quantitative anchors / decision
precedents) MUST disk-verify at authoring time. When this discipline
fails-to-fire at authoring time, the catch is structurally located
at the consumption surface (retrospective or prospective). Both
shapes inherit the broader Verify-from-disk-at-non-standard-grain
pattern at recommendation-substrate-receipt grain — see
[`scope-lock.md`](./scope-lock.md) §Verify-from-disk-at-non-standard-grain
pattern for the grain-agnostic parent discipline.

**Evidence basis (N=4 graduation; N=5 with post-Round-3 evidence):**
(1) Phase 5.1 "reviewer chunk" naming drift at Phase 4 retrospective
drafting (retrospective drift; caught at post-close drift-fix
`18dd608`); (2) Reading A vs B scope-lock adjudication (retrospective
drift; brainstorming-session-internal); (3) scope-observation framing
on Postmark webhook scope vs Reading B lock (retrospective drift;
brainstorming-session-internal); (4) chunk-6.3b handoff prompt
"~20+" vs 243 commits magnitude drift (prospective drift; caught at
WSL-side Round 0 state-verify). (5) chunk-6.3b Round 6 onset
brainstorming-side Op 2 "first merge-to-main since pre-Phase-4
grain" framing drift (caught at Round 6 verify-from-disk; cfcf2e7 +
9f0ebb3 prior merge-to-main precedents exist).

---
**Origin:**
- First codified: Phase 4 retrospective close (2026-05-14); evidence
  basis accreted through Phase 6 chunk 6.3b
- Evidence basis: N=4 graduation (N=5 with post-Round-3 evidence) —
  Phase 5.1 naming drift, Reading A vs B, Postmark scope-observation,
  chunk-6.3b handoff prompt, chunk-6.3b Round 6 onset
- Promoted from: drift-fix `18dd608` + post-Round-3 evidence
- Cross-references:
  [`scope-lock.md`](./scope-lock.md) §Verify-from-disk-at-non-standard-grain
  pattern (parent discipline); Phase 4 retrospective writeup
- v2.2 reorg: 2026-05-17 (relocated from repo-root CLAUDE.md at
  Commit D per `docs/09_briefs/phase-6.5/reorg-proposal-v2.md` §4.1)

---

## Prediction grounding (cross-reference)

When a plan encodes predictions about future behavior or parameter
values — count expectations for a verification step, byte caps,
shape constraints, magic-number thresholds — the prediction-
grounding discipline applies. Ground against empirical evidence at
plan-write time, OR explicitly mark predictions as ungrounded and
document the verification step that will check.

Full discipline:
[`../prediction-grounding.md`](../prediction-grounding.md).

The discipline applies broadly (specs, prompts, ADRs, briefs, regex
parameters); this cross-reference notes plan-authoring as one of
the surfaces where it fires. Concrete plan-authoring instances of
the failure mode: forecast tables in a plan (Volume-forecast
section above), verification step expected counts, parameter
values cited from substrate without disk-verify, "after STEP N
this will be..." projections.

---

**Origin:**

- First codified (cross-reference): Phase 6.5, 2026-05-19
- Evidence basis: cross-reference to topical convention
  `prediction-grounding.md` codified at the same moment from N=3
  observation-grain banking
- Promoted from: ARC 3 STEP 3 sibling-routing decision (the
  topical convention's discipline applies at plan-authoring among
  other surfaces)

---

## Multi-iteration refinement at directive/brief/plan authoring (N=12 cross-grade)

When authoring a directive, brief, plan, scope-lock input, or handoff
prompt for substantive operational dispatch, multi-iteration refinement
(Iteration 1 → orchestrator-and-WSL review → Iteration 2 nudges →
Iteration 3 absorbed) reliably reduces directive-vs-substrate drift at
dispatch time. The discipline trades short-term authoring latency for
empirical reduction in mid-execution scope-corrections.

**Trigger:** any directive/brief/plan authoring at substantive
operational dispatch grade (chunk-brief drafting, chunk-impl directive
authoring, scope-lock-cycle round authoring, retrospective drafting
directive). Single-line / quick-clarification prompts don't fire;
multi-paragraph authored substrate does.

**Discipline rule.** Default to multi-iteration refinement cycle for
substantive directive authoring. Iteration 1 = orchestrator drafts +
WSL reviews; Iteration 2 = WSL refinement notes on adjudication
surfaces; Iteration 3 = orchestrator absorbs nudges + dispatches.
Single-iteration dispatch is acceptable when (a) substrate is fully
locked + (b) precedent template inheritance is verbatim + (c)
operational risk is low. Otherwise fire multi-iteration.

**Why.** Phase 7 implementation cycle (N=5 chunk-impl sessions
36-40) used directive-grade Phase A verification absorbed in multi-
iteration refinement; the cycle delivered N=4 non-fire instances at
(α) directive-grade-citation-against-substrate sub-grain (Sessions
37+38+39+40 all caught divergence at directive grade before WSL
dispatch rather than at impl-grade reactive). Mid-execution scope-
corrections at chunk-impl grade are the failure-mode this discipline
prevents.

**Evidence basis (N=12 cross-grade graduation):**

Cumulative N=12 firings across three directive grades during Phase 7:

- **Scope-lock-cycle-round grade (N=4):** Sessions 29-32 four
  founder-ratification rounds of Phase 7 scope-lock cycle close.
  Each round refined the chunk decomposition + Path C probability
  framings + 6 codification candidate inventory.
- **Chunk-brief-drafting grade (N=3):** Sessions 33-35 chunk briefs
  (chunks 7.1 + 7.2 + 7.3) each authored via multi-iteration
  refinement.
- **Chunk-impl directive grade (N=5):** Sessions 36-40 chunk-impl
  directives (chunks 7.1a + 7.1b + 7.2 + 7.3a + 7.3b) each authored
  via multi-iteration refinement with substantive Phase A findings
  caught at directive grade (chunk 7.3b's Iteration 2 caught 5 Phase
  A findings A-E before dispatch).
- **Retrospective drafting grade (N=1 at Session 41):** this
  retrospective drafting directive itself authored via multi-iteration
  refinement (Iteration 1 → Iteration 2 nudges with 7 surfaces + 3
  gaps → Iteration 3 absorbed all 10 surfaces; dispatch ready).

**How to apply.** At directive authoring inception, default to
multi-iteration. Draft Iteration 1; surface adjudication surfaces +
verification gaps for WSL review (e.g., founder ratification surfaces
+ substrate-verification findings); WSL responds with refinement notes
+ gaps; orchestrator drafts Iteration 2 (or Iteration 3 if Iteration 2
surfaces further adjudication). Dispatch only when adjudication
surfaces are closed + verification gaps are absorbed.

**Trade-offs.** Multi-iteration adds 1-2 turns latency per directive.
Empirical benefit: Phase 7 N=5 chunk-impl sessions delivered with 0
mid-execution scope-corrections at impl-grade (compare to Phase 4
chunk 3 which fired 5 mid-impl framing-revisits + Path C reactive
split). The trade-off favors multi-iteration for substantive
operational dispatch.

**Cross-references.**

- F-J-14 fourth-instance entry (2026-05-20) — chunk-impl-grade
  Grain 2/3 non-fire N=5 cross-validation as positive evidence of
  multi-iteration's scope-risk absorption.
- Scope-lock §Verify-from-disk-at-non-standard-grain pattern
  §Session-prompt-authoring grain sub-shapes (push-state-claim
  N=4 + dev-DB-state-assumption N=1 + directive-substrate-coverage
  N=1) for the verification-grounding discipline that multi-iteration
  composes with.
- Phase 7 retrospective at
  `docs/07_governance/retrospectives/phase-7-retrospective.md`
  §3 Candidate #1 for full empirical narrative.

---
**Origin:**
- First codified: Phase 7, 2026-05-20 (Phase 7 retrospective close)
- Evidence basis: N=12 cross-grade graduation across Phase 7
  scope-lock-cycle-round (N=4) + chunk-brief-drafting (N=3) +
  chunk-impl directive (N=5) + retrospective drafting directive (N=1)
- Promoted from: Phase 7 retrospective §3 Candidate #1
- Cross-references: F-J-14 fourth-instance (2026-05-20); scope-lock
  §Verify-from-disk-at-non-standard-grain pattern; Phase 7
  retrospective §3 Candidate #1

---

## Per-disposition-shape multiplier table at chunk-impl grade (Phase 7 extension)

At chunk-impl forecast authoring, the per-disposition-shape multiplier
table calibrates expected impl-grade volume against forecast band.
Extends the four-curve calibration substrate above with chunk-impl-
grade empirical anchors per chunk-disposition classification.

**Trigger:** any chunk-impl directive authoring with volume forecast
band.

**Discipline rule.** Classify the chunk-impl scope along the
per-disposition axis BEFORE locking the forecast band:

| Disposition shape | Expected multiplier | Phase 7 anchor |
|---|---|---|
| TS-only chunks | 1.0-1.2× base forecast | chunk 7.1a +10% |
| Cross-language chunks (TS + Python sidecar) | 1.3-1.4× base forecast | chunk 7.1b +33% |
| Migration + test-substrate-rich chunks | 1.3-1.4× base forecast | chunk 7.2 +37% |
| Substrate-cohesion-rich chunks WITHOUT directive-grade Phase A scope deferrals | 1.3-1.4× base forecast | chunk 7.3a +38% |
| Substrate-cohesion-rich chunks WITH directive-grade Phase A scope deferrals + Option (c') permissive shape | 0.9-1.0× base forecast (within-band) | chunk 7.3b within-band |

**Critical mechanism.** Chunks with directive-grade Phase A
verification absorbing scope deferrals (Iteration 2 Note 1/2/3/4
substantive findings landed at directive grade before implementation)
empirically realize within forecast band. Chunks without directive-
grade Phase A verification realize at +10-38% floor-bias above
forecast upper bound.

**Why.** Phase 7 N=5 chunk-impl evidence: four +10-38% floor-bias
firings at chunks 7.1a/7.1b/7.2/7.3a (no directive-grade Phase A
absorption at sufficient grain to bound complexity) + one within-band
landing at chunk 7.3b (Iteration 2 directive-grade Phase A absorbed
Option γ Bundle/Mutation/Attachment substrate deferral + Option (c')
Finding E permissive justification shape, bounding chunk 7.3b
complexity before implementation began).

**How to apply.** At chunk-impl directive authoring, classify chunk
scope per the table above. If directive-grade Phase A verification
can absorb scope deferrals (Option γ-style consolidation OR Option
(c')-style permissive shape OR analogous), forecast within-band
(0.9-1.0× multiplier). Otherwise forecast at +10-40% above forecast
upper bound per disposition class.

**Cross-references.**
- Four-curve calibration extension above (Phase 5.1 close,
  2026-05-19) — sub-curve (a) cycle-substantive + sub-curve (b)
  substrate-fix-narrowness; this Phase 7 extension adds the
  per-disposition-shape multiplier as N=5 chunk-impl-grade
  refinement.
- F-J-14 fourth-instance entry (2026-05-20) for the chunk-impl-grade
  forecast-vs-reality evidence basis.
- Phase 7 retrospective at
  `docs/07_governance/retrospectives/phase-7-retrospective.md`
  §3 Candidate #6.

---
**Origin:**
- First codified: Phase 7, 2026-05-20 (Phase 7 retrospective close)
- Evidence basis: N=5 chunk-impl grade across Phase 7 chunks 7.1a +
  7.1b + 7.2 + 7.3a + 7.3b (+10% / +33% / +37% / +38% / within-band)
- Promoted from: Phase 7 retrospective §3 Candidate #6
- Cross-references: Four-curve calibration extension above; F-J-14
  fourth-instance entry; Phase 7 retrospective §3 Candidate #6

---

## Brief task-naming vs ADR canonical stage_name canonicalization (N=8 cumulative)

Brief authors use task-numbering for chunk-scope readability ("Task
7.3a.5", "Task 7.3b.7"); ADR §13 canonical applies at trace-record
emission grade ("stage_name = 'build_proposal'"). The two naming
conventions diverge at chunk-impl grade — brief task numbers don't
map 1-to-1 to ADR canonical stage_names. Reconcile at impl-time:
trace_records emit ADR canonical names; brief task names stay as
chunk-scope readability anchors.

**Trigger:** any chunk-impl directive authoring that cites brief task
numbers + ADR canonical stage names in the same directive surface.

**Discipline rule.** At chunk-impl directive authoring, explicitly
reconcile brief task numbering vs ADR canonical stage_name. The
reconciliation is documented at impl-time in the orchestrator's
inline comments (e.g., `// Stage 7 (build_proposal) per ADR-0014 §13
canonical / brief Task 7.3b.5 "Stage 7 commit composite"`).
trace_record emissions use the ADR canonical name; comments cite both
for traceability.

**Why.** Phase 7 evidence at chunk-impl grade: brief task numbering
optimizes for chunk-scope readability (`Task 7.3a.5` localizes to
chunk 7.3a's fifth task); ADR canonical stage_name (`build_proposal`)
optimizes for trace-record emission shape (each Stage emits one
trace_record with the canonical name). Mixing the two at trace_record
emission produces brief-scope-bound trace records that don't
cross-reference cleanly with ADR §13.

**Evidence basis (N=8 cumulative; Phase 7 chunks 7.1b + 7.2 + 7.3a +
7.3b):** firing at every Phase 7 chunk-impl directive that authored
both brief tasks + ADR canonical stage_names in the same directive
surface. Phase 7 chunk-impl directives cumulatively cite N=8 brief
task numbers (Tasks 7.1b.1-9 + 7.2.1-9 + 7.3a.1-8 + 7.3b.0-8 = 33+
brief tasks) mapped to 8 ADR canonical stage_names (Stages 0-7 per
ADR-0014 §13).

**How to apply.** At chunk-impl directive authoring, explicitly note
the brief-task-vs-ADR-canonical reconciliation either in the
directive's §0 inheritance section OR inline at the per-task
substrate sections. Examples: "Brief Task 7.3a.3 (vendorService.matchVendor
extension) = ADR canonical Stage 5 match_vendor"; "Brief Task 7.3a.6
('Stage 6 proposal builder') = ADR canonical Stage 7 build_proposal
substrate." Impl-side preserves both naming conventions at inline
comments; trace_record emission uses ADR canonical only.

**Cross-references.**
- ADR-0014 §13 canonical stage_names for Tier 2 document pipeline.
- chunk 7.3a + chunk 7.3b ingestDocument.ts inline comments (lines
  23-26 + Stage 7 commit composite section) for brief-task-vs-ADR-
  canonical reconciliation precedent at impl-grade.
- Phase 7 retrospective at
  `docs/07_governance/retrospectives/phase-7-retrospective.md`
  §3 Candidate #7.

---
**Origin:**
- First codified: Phase 7, 2026-05-20 (Phase 7 retrospective close)
- Evidence basis: N=8 cumulative firings across Phase 7 chunk-impl
  directives (chunks 7.1b + 7.2 + 7.3a + 7.3b cumulative brief-task-
  enumeration mapped to ADR-0014 §13 8-stage canonical)
- Promoted from: Phase 7 retrospective §3 Candidate #7
- Cross-references: ADR-0014 §13; Phase 7 chunk-impl directives;
  Phase 7 retrospective §3 Candidate #7

---

## Phase B scope addition pattern at chunk-impl grade (N=3 cumulative)

At chunk-impl grade Phase B (substrate authoring), impl-time
substrate-cohesion concerns surface that motivate shared-helper
extraction beyond the directive's enumerated substrate. The
discipline: extract shared helpers at Phase B when substrate-
cohesion concerns surface; document the extraction at chunk-impl
close report; bank as Phase B scope addition observation.

**Trigger:** at chunk-impl Phase B (substrate authoring), when
substrate-cohesion concerns surface for cross-stage shared logic.

**Discipline rule.** At Phase B substrate authoring, evaluate
whether enumerated substrate produces substrate-cohesion
concerns (duplicated logic across stages, parameterizable shared
state, cross-stage helper-extraction opportunity). If yes, extract
to a shared module; document the extraction at chunk-impl close
report (Phase B scope addition observation); preserve the
extraction's discoverability at the orchestrator entry comment.

**Why.** Phase 7 evidence: chunk 7.2 + chunk 7.3a both surfaced
Phase B substrate-cohesion concerns that motivated shared-module
extraction. Chunk 7.2 surfaced `ON INSERT` trigger as
substrate-helper; chunk 7.3a surfaced `aiFallbackBudget.ts` +
`aiFallbackExtractorBase.ts` as cross-extractor shared modules.
Without Phase B extraction, the chunks would have shipped
duplicated logic across stages (per-extractor AI fallback budget
counters; per-stage extraction-base shape). With Phase B
extraction, chunks ship cohesion-positive substrate at minimal
LOC overhead.

**Evidence basis (N=3 cumulative; Phase 7 chunks 7.2 + 7.3a):**

- **Chunk 7.2 (Session 38):** ON INSERT trigger as Phase B
  substrate-cohesion helper (substrate-grade extraction at
  schema-level, not module-level; sub-instance of the pattern).
- **Chunk 7.3a (Session 39) — first sub-instance:**
  `aiFallbackBudget.ts` as cross-extractor shared budget counter
  (3 per-document-type extractors share the budget).
- **Chunk 7.3a (Session 39) — second sub-instance:**
  `aiFallbackExtractorBase.ts` as cross-extractor shared base for
  AI fallback invocation shape (3 per-document-type extractors
  share the base).

**How to apply.** At chunk-impl Phase B authoring, evaluate cross-
stage substrate for cohesion-extraction opportunity. If extraction
reduces duplication AND preserves stage-isolation semantics,
extract to shared module under appropriate substrate directory
(e.g., `agent/orchestrator/extraction/aiFallback*.ts` for Phase 7
extractor-shared substrate). Document extraction at chunk-impl
close report.

**Cross-references.**
- chunks 7.2 + 7.3a impl notes (commits `c401296` + `8499189`)
  for the three Phase B extraction precedents.
- Phase 7 retrospective at
  `docs/07_governance/retrospectives/phase-7-retrospective.md`
  §3 Candidate #9.

---
**Origin:**
- First codified: Phase 7, 2026-05-20 (Phase 7 retrospective close)
- Evidence basis: N=3 cumulative across Phase 7 chunks 7.2 (ON
  INSERT trigger) + 7.3a (aiFallbackBudget.ts + aiFallbackExtractorBase.ts)
- Promoted from: Phase 7 retrospective §3 Candidate #9
- Cross-references: Phase 7 chunks 7.2 + 7.3a commits; Phase 7
  retrospective §3 Candidate #9
