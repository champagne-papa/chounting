# Scope-lock conventions

Scope-lock-time discipline that fires when a session is articulating
dimensions, cross-dependencies, and closure shapes before execution.
These rules catch cross-layer coordination gaps before they fire as
runtime collisions.

See [`README.md`](./README.md) for the sub-folder routing rule and
the broader [`../README.md`](../README.md) for the topical routing
rule.

The RI-1 through RI-10 cluster (verify-forward-at-scope-lock for
computational-shape chunks) and substrate-now-enforcement-later
cross-pattern are currently in repo-root `CLAUDE.md`; they relocate
to this file at Commit D of the v2.2 reorg.

---

## PARTIAL Closure State-Decomposition (Meta A)

When a verification arc closes PARTIAL — halted before
completing all in-scope items, whether by budget
ceiling, systematic-issue halt, operator pause, or any
other early-termination mechanism — the run record
must populate the dimensions this convention names
rather than collapse to a single-value disposition
that loses information. The natural-language headline
for any measured dimension ("X verified," "Y spent,"
"Z covered," "halt fired correctly") implicitly elects
a single state; the run record must surface all states
the runtime distinguished, even when one state has
zero population.

At scoping time, the run author articulates which
dimensions the run will measure and what runtime
states each headline could collapse. The standing
list below names dimensions that have appeared in
prior runs and may apply; it is reference, not a
mandatory checklist. Authors should consider whether
each applies and add new dimensions as they surface.

Decomposition shapes may be **value-level** (sub-values
of one axis) or **axis-level** (claims about different
layers bundled by runtime coincidence). When a
decomposition is axis-level, name the layers
explicitly so the bundling that produced the single
headline doesn't reproduce in the run record.

**Standing dimensions (reference, not mandatory):**

- **Coverage trichotomy** (value-level): verified /
  attempted-but-failed / untried. Untried may
  sub-decompose by mechanism (untried-by-design vs.
  untried-by-halt) where the distinction matters for
  remediation paths.
- **Cost trichotomy** (value-level): verification
  spend / discovery spend / total. Distinguishes
  in-scope verification cost from out-of-scope
  failure-mode disposal cost; reading the run total
  as "verification cost" inflates the unit by
  conflating the two.
- **Spec-runtime tuple** (value-level): spec-time
  disposition / runtime disposition. Distinguishes
  what the spec author expected at spec-time anchor
  from what the runtime produced at runtime anchor;
  the two diverge implicitly when the spec→run gap is
  non-trivial.
- **Halt-policy outcome** (axis-level; originating
  instance, not the dimension's general shape):
  runtime-execution discipline / scoping-completeness.
  The halt firing is a runtime-discipline fact;
  whether the collision should have been live at
  runtime is a scoping-process fact. The single "halt
  fired correctly" headline bundles both; the
  decomposition splits them so the runtime success
  doesn't carry forward as evidence the scoping was
  sufficient. Future axis-level dimensions may surface
  with different layer-pairs (e.g.,
  test-coverage-discipline / scoping-completeness on a
  different verification arc) — the dimension's
  general shape is "claims about different layers
  bundled by runtime coincidence into one headline,"
  with halt-policy outcome as the C7-derived first
  instance.

**Per-sub-type N=2 split trigger:** when any single
sub-type accumulates a second instance, that sub-type
graduates to its own convention. Currently axis-level
decomposition is at N=1 (halt-policy outcome); a
second axis-level instance would fire the split.
Hypothesis-discrimination dimension (introduced in
OI-3 scoping doc §7a, commit `161bff8`, Part 5) is
also at N=1 and would graduate per the same trigger
on a second authoring.

First applied: captured in
`phase-1.2-retrospective.md` §3 Pattern 6 (Meta A
first concrete application; original friction-journal
section (o) "C7 closeout deliverables (Meta A
application, post-C11)" sub-section, commit `52a63f0`).
The four C7 closeout deliverables (coverage trichotomy
/ cost trichotomy / spec-runtime tuple / halt-collision
axis-level) are Meta A's first concrete population. The OI-3 scoping
doc §7a (commit `161bff8`) is the second application,
applying Meta A at scoping time to OI-3's M1 post-fix
validation run measurement dimensions.

Composes with: **Scoping-Time Cross-Dependency
Articulation (Meta B)** — sibling meta-convention.
Meta B applies at scoping time pre-execution
(articulating cross-dependencies before they fire as
runtime collisions); Meta A applies at run-record
time post-PARTIAL-closure (decomposing the
single-value disposition into the dimensions the
runtime distinguished). They are temporally
complementary: Meta B prevents some collisions from
landing in run records at all; Meta A ensures the
ones that do land surface their full state-space.
**Mutual Hallucination-Flag-and-Retract Discipline
(Convention #10)** — upstream epistemic-hygiene
framework. PARTIAL closures sit downstream of #10's
discipline: when a run closes PARTIAL, the
state-decomposition Meta A requires is itself a
hallucination-resistance mechanism (single-value
dispositions are the natural-language headline that
overstates the result; the decomposition is the
explicit qualifier that blocks the carry-forward).

First codified: this commit, S13 conventions-catalog
codification. Drafted in C11 retrospective (captured in
`docs/07_governance/retrospectives/phase-1.2-retrospective.md`
§3 Pattern 6; original `friction-journal/phase-1.2.md`
section (p), commit `f221bab`); first concrete
application in S12 (`52a63f0`); applied at scoping time
in OI-3 scoping doc (`161bff8`).

---
**Origin:**
- First codified: Phase 1.2, 2026-04-26 (S13 conventions-catalog
  codification)
- Evidence basis: N=1 first concrete application (S12 C7 closeout
  deliverables, commit `52a63f0`); N=2 with OI-3 scoping doc §7a
  application (commit `161bff8`)
- Promoted from: C11 retrospective drafting (section (p), commit
  `f221bab`)
- Cross-references: Scoping-Time Cross-Dependency Articulation
  (Meta B; below); Mutual Hallucination-Flag-and-Retract Discipline
  (in [`iterative-catching.md`](./iterative-catching.md));
  `docs/07_governance/retrospectives/phase-1.2-retrospective.md`
  §3 Pattern 6

---

## Scoping-Time Cross-Dependency Articulation (Meta B)

When scoping a verification run, fix-stack, or
workstream, the author must articulate
cross-dependencies between components that have been
authored independently. Components may be policy
rules within a scoping doc, distinct workstream
artifacts (fix-stacks, prompt sets, verification
harnesses), or existing code paths interacting with
new code paths a fix-stack introduces.
Cross-dependencies that stay implicit at scoping time
surface as runtime collisions, where the scoping doc
didn't ask the cross-product question and the
runtime is left to resolve the collision ad-hoc.

The articulation is concrete: for each
cross-dependency the run measures against, name the
components, name the interaction question, and
resolve it (or explicitly defer with a named
fallback).

**Articulation may be iterative:** resolving one
cross-dependency can surface another (e.g., choosing
to sequence an upstream fix opens a question about
how the upstream fix's own scoping articulates its
dependencies). Continue articulation until no new
cross-dependencies surface.

**Cross-dependency types that have appeared in prior
runs and may apply** (reference, not mandatory):

- **Policy-rule interactions:** for each pair of
  policy rules `(D_i, D_j)` authored in the scoping
  doc, does the doc say which wins when both apply?
  Pairwise check across the rule set. The
  D2-vs-D3 collision in C7 EC-13 (captured in
  `phase-1.2-retrospective.md` §3 Pattern 6, Cluster A
  Item 1 / Fact A + Fact B split; original
  friction-journal section (p), commit `f221bab`) is
  the originating instance — D2 (halt on
  systematic reproduction) and D3 (continue
  per-instance for out-of-scope failure) collided at
  runtime because the scoping doc never asked the
  pairwise question.
- **Downstream-component dependencies:** when
  verifying invariant N or shipping a fix-stack
  against component N, what other components are
  downstream — by execution-order, by contract-shape,
  or by any other coupling — and what's the plan if
  any of them fail systematically or shift their
  contract during the run? Choose explicitly:
  sequence the downstream fix first, synthesize
  bypass artifacts, or claim coverage only against
  the post-attrition residue. This sub-type covers
  both the original invariant-pipeline case (Meta B's
  N=2 instance: OI-3 verification facing
  Class-2-as-upstream-and-as-fix recursion, OI-3
  scoping doc §7b commit `161bff8`) and the
  contract-shape case surfaced in OI-3 §7c
  (prompt-surgery work coupled to ProposedEntryCard
  schema via tentative-state representation), and is
  open to future cases where a component's downstream
  coupling does not fit either named precedent.
- **Telemetry-salience dependencies:** when a fix-stack
  lands on invariant N, two sub-checks. (i) Does
  existing telemetry surface the discriminators that
  matter for N's failure modes? If not, the fix-stack
  scope includes the telemetry refresh. (ii) Does any
  net-new code path the fix-stack introduces have its
  own telemetry? If not, the fix-stack scope includes
  net-new instrumentation. The OI-3 case (OI-3
  scoping doc §7b commit `161bff8`) scheduled the
  canvas_directive log-field patch into OI-3 Part 2
  per sub-clause (i); sub-clause (ii) did not fire
  because prompt-surgery introduces no net-new
  orchestrator/service code paths.

Authors should consider whether each applies and add
new cross-dependency types as they surface.

**Per-sub-type N=2 split trigger:** when any single
sub-type accumulates evidence of structurally
distinct mechanisms (e.g., a future case that doesn't
fit either the "by execution-order" or "by
contract-shape" coupling under downstream-component
dependencies, or a third sub-type beyond
policy-rule/downstream-component/telemetry-salience),
re-evaluate whether to split. **Meta-level N=5 review
trigger:** if the cross-dependency type list grows to
five sub-types, re-evaluate whether the meta-shape
still holds across them or has fragmented into a
grab-bag.

First applied: OI-3 scoping doc §7b (commit
`161bff8`). All three articulation prompts surfaced
their cross-dependencies cleanly on first application
— policy-rule interactions surfaced two halt-criteria
pairs and resolved both with precedent citations;
downstream-component dependencies surfaced the
recursive Class-2-as-upstream-and-as-fix dependency
and resolved with synthetic-bypass; telemetry-salience
surfaced the canvas_directive log-field gap and
scheduled the patch into OI-3 Part 2. The §7c
contract-shape observation drove this convention's
sub-type rename from the original drafted name
("invariant-pipeline dependencies") to the broader
"downstream-component dependencies" framing landed
above; rename is N=1-evidence-driven, not a
falsification trigger.

Composes with: **PARTIAL Closure State-Decomposition
(Meta A)** — sibling meta-convention; Meta A applies
post-PARTIAL-closure, Meta B applies at scoping-time
pre-execution. Together they form a temporal pair on
the verification arc. **Spec-to-Implementation
Verification (Convention #8)** — upstream
verification-discipline sibling. Spec-to-Impl catches
drift in assertions about shipped code at
implementation time; Meta B catches drift in
cross-layer coordination at scoping time. Both
prevent classes of drift that would otherwise surface
as runtime failures, and both share the
"articulation-now-prevents-collision-later" shape.

First codified: this commit, S13 conventions-catalog
codification. Drafted in C11 retrospective (captured in
`docs/07_governance/retrospectives/phase-1.2-retrospective.md`
§3 Pattern 6; original `friction-journal/phase-1.2.md`
section (p), commit `f221bab`); first applied in OI-3
scoping doc §7b (commit `161bff8`) with the §7c sub-type
rename informing the final form landed here.

---
**Origin:**
- First codified: Phase 1.2, 2026-04-26 (S13 conventions-catalog
  codification)
- Evidence basis: N=1 first application (OI-3 scoping doc §7b,
  commit `161bff8`) with three articulation prompts surfacing
  their cross-dependencies cleanly; §7c sub-type rename
  observation
- Promoted from: C11 retrospective drafting (section (p), commit
  `f221bab`); first applied in OI-3 scoping doc §7b
- Cross-references: PARTIAL Closure State-Decomposition (Meta A;
  above); Spec-to-Implementation Verification (in
  [`plan-authoring.md`](./plan-authoring.md));
  `docs/07_governance/retrospectives/phase-1.2-retrospective.md`
  §3 Pattern 6

---

## Material Gaps Surface at Layer-Transition Boundaries

Gaps between abstraction layers — schema ↔ UX,
planner-drafting ↔ execution-reality, catalog-closure ↔
prompt-routing — are where under-specified requirements
silently decompose into bugs. When a sub-brief cites one
layer as a dependency of work in another, the cross-layer
contract must be stated explicitly and verified against
both sides, not assumed from narrative coherence on either
side alone.

Rationale: five datapoints across Sessions 7 and 7.1
triggered codification. (1) **P11b** (Session 7):
onboarding-complete UX layer depended on an
`agent_sessions.org_id` schema shape that the UX layer
didn't state and the schema layer didn't enforce,
producing a silent null-propagation bug at session load.
(2) **P14** (Session 7): conversation-resume UX depended
on Session 5.1's terminating-text persistence behavior;
the UX layer assumed a persistence contract the
persistence layer didn't guarantee. (3) **P16 dual-context
rewrite** (Session 7.1): the `onNavigate` callback shape
expected by canvas-transcript UX didn't match what the
transcript component emitted; caught at test time.
(4) **P19 template-catalog gap** (Session 7.1.1): EC-19
scenario (a) wasn't answerable because catalog-closure and
prompt-routing layers each assumed the other held the
missing template. (5) **P21 rationale drift**
(Session 7.1.1): the planner-drafting layer asserted a
rationale ("self-emit paths keep same helper") that didn't
match the four call sites in
`src/agent/orchestrator/index.ts` — the drafting layer's
narrative was coherent but contractually wrong against the
execution-reality layer.

Remediation: when a sub-brief cites a cross-layer
dependency, state the dependency explicitly (which symbol,
at which layer, with what contract) and verify against
both sides (grep the symbol, read the caller, confirm the
contract is what both layers think it is). Narrative
coherence on one side of a boundary is insufficient
evidence; the other side's shape must be read and matched.

See `docs/07_governance/friction-journal/phase-1.2.md` Session 7 and
Session 7.1 retrospectives for the full datapoint records.
First codified: 2026-04-22, as part of the deferred
Session 8 C9 codification (landed in the same commit as
Convention #10 and the governance-audit mechanism).

---
**Origin:**
- First codified: Phase 1.2, 2026-04-22 (Phase C ratification pass
  + C9 codification)
- Evidence basis: N=5 datapoints across Sessions 7 and 7.1 (P11b,
  P14, P16 dual-context rewrite, P19 template-catalog gap, P21
  rationale drift)
- Promoted from: Sessions 7 and 7.1 retrospectives
- Cross-references:
  `docs/07_governance/friction-journal/phase-1.2.md` Session 7 and
  Session 7.1 retrospectives

---

## Methodology cluster sub-categorization

The methodology cluster bucket accumulated 11 inhabitants
during round-2 sessions (soft-threshold at 10 tripped at Session
6.5 closeout; 11th added at Session 6 brainstorm closeout).
Session 8 ratifies sub-categorization into three clusters with
differential character. The actual inventory spans round-2
friction-journal entries (5A brainstorm closeout's "Methodology
cluster (8; reasoning tools)" enumeration #3-#10 + Session 5B
brainstorm's #16 + Session 6 brainstorm's +2); future inventories
consult the journal as canonical record.

**Cluster A: Codification-trajectory observations.**

Inhabitants currently at codification trajectory: Tier 1 LIVE
candidates, Tier 2 candidates, Tier 3 holds, or items recently
graduated to dedicated codification.

Worked examples (with current status post-Session-8):
- Drift meta-pattern (graduated to Tier 1 ratified at Session 8
  C1; dedicated codification at the
  [`plan-authoring.md`](./plan-authoring.md) entry).
- Inter-session dependency sub-axis (graduated as part of drift
  meta-pattern at Session 8 C1).
- Prophylactic-vs-reactive sub-rule (graduated as part of drift
  meta-pattern at Session 8 C1).
- Recurring meta-arc placement question (Tier 3 hold; see
  carry-forward sub-section in
  [`plan-authoring.md`](./plan-authoring.md)).
- Substrate-leverage phase observation (Tier 3 → Tier 2 per
  Session 5B brainstorm closeout).
- Floor-only push gate carve-out (graduated to ratified at
  Session 7 C6; dedicated codification at the round-N
  restructure plan workflow + this Round-2 Conventions section).
- Turbo cache content-hash (Tier 1 LIVE candidate; codification
  path TBD).
- Variance-decomposition diagnostic (#5; N=1).
- Handoff-prompt-commit-number-translation (#6; N=1).

Character: items have a codification trajectory (toward
ratification or hold-with-recurrence-trigger). Sub-cluster's
own count discipline: items track their N-count toward
codification thresholds per the three-category codification
taxonomy.

**Cluster B: Session-execution discipline observations.**

Inhabitants describing operational discipline that fires within
session execution (typically at session-start verification,
pre-push gates, or mid-execution pattern recognition).

Worked examples:
- Mid-dispatch plan re-read pre-push verification (N=2 per
  Session 6 brainstorm closeout).
- Parallel-session commit visibility (N=1 per Session 6
  brainstorm closeout).
- Pre-execution-audit-revealing-scope-refinement (#8; N=2 across
  Phase 3 substrate audit + 5B Decision 1 audit).
- Fresh-pass-on-decision-revealing-refinement (#16; N=1).

Character: items describe session-execution mechanics — what
gates fire, what verifications run, what patterns surface
during execution. Distinct from codification-trajectory
candidates (which are about what gets ratified) and from
scope/structural observations (which are about scope decisions).

**Cluster C: Scope/structural observations.**

Inhabitants describing scope decisions, structural patterns,
and category preservation (meta-meta level).

Worked examples:
- Count-level-vs-structural-level distinction (#7; N=2 across
  decision domains: Decision 4 commit shape + Decision 6
  gate-path).
- Discipline-extension pattern (#10; N=2: 5A's agency-extends-
  to-consumer + 5B's discipline-extends-to-published-artifact-
  accuracy).
- 5A-closeout-framings-refined-by-5B-brainstorm (#9; N=2:
  Decision 1 audit revision + Decision 3 binary→split).
- Categorical-distinction-preservation meta-pattern (round-2
  brainstorm-time observation; N=2).
- Failure-mode taxonomy (forward vs backward) — sub-pattern
  within structural-pattern bucket per Session 6 brainstorm
  closeout.
- Count-level commit pattern variance (#11 in structural-pattern
  bucket; N=3 codification candidacy).

Character: items describe scope/structural reasoning — how
scope decisions emerge, how structural patterns hold across
work shapes, how category boundaries preserve.

Note: the structural-pattern cluster (NEW BUCKET established at
Session 5B brainstorm Decision 7.B with #11/#12/#13) is sibling
to the methodology cluster. Cluster C absorbs structural-pattern-
related observations conceptually; explicit reconciliation
between methodology cluster Cluster C and the journal's
structural-pattern bucket can land at a future bucket-structural
session if the two reveal differential character (currently
treated as related sub-shape evidence).

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
(soft-threshold 50% smaller than the parent bucket's
10-inhabitant threshold, reflecting sub-cluster's narrower
scope) OR if a new observation doesn't fit cleanly into A / B /
C. The re-evaluation may add a fourth sub-cluster, split an
existing sub-cluster, or restructure the parent bucket.

---
**Origin:**
- First codified: Round-2 Conventions, 2026-05-09 (Session 8
  ratification)
- Evidence basis: 11 inhabitants accumulated during round-2 sessions
  (5A brainstorm closeout #3-#10 + Session 5B #16 + Session 6
  brainstorm +2)
- Promoted from: Round-2 sub-categorization ratification
- Cross-references: Plan-substrate-vs-canonical-reality drift
  meta-pattern (in [`plan-authoring.md`](./plan-authoring.md));
  Three-category codification taxonomy (in
  [`../README.md`](../README.md))
