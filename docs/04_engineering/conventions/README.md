# Engineering conventions — routing

This folder holds the canonical engineering conventions for
chounting, organized by topical surface (the surface a session is
working on at codification time and at retrieval time). The
top-level [`../conventions.md`](../conventions.md) is the index that
points here.

Each topical file holds one or more codified rules. Each rule
carries an origin-metadata footer naming when it was first codified,
the evidence basis, and any cross-references. The chronological
origin (which Phase / which arc) is preserved in the footer; the
file structure is topical, not chronological.

## Topical files

- [`code.md`](./code.md) — branch naming, contribution rules,
  performance, i18n, file-top comment staleness review.
- [`service-layer.md`](./service-layer.md) — webhook handler
  conventions, error-handling review, service template structure,
  three-consumer pattern.
- [`schema.md`](./schema.md) — Zod schema strictness (strict vs
  passthrough), API boundary casing, JSON schema patterns.
- [`migrations.md`](./migrations.md) — migration review cadence,
  NOT NULL column blast radius, seed-data PII placeholder convention,
  substrate-mod test staleness review.
- [`audit-permissions.md`](./audit-permissions.md) — permission keys
  vs audit action keys, permission catalog count drift, audit
  `before_state` convention, audit-action naming split.
- [`testing.md`](./testing.md) — test-scope pragmatic reduction at
  chunk close, test-infrastructure friction-vs-value evaluation.
- [`ai-agents.md`](./ai-agents.md) — agent-mediated session
  conventions (orphan row-card pairing verification, ai_action
  discipline).
- [`session/`](./session/) — session-execution conventions
  (sub-folder; Commit A's content migration produced ~1700 lines,
  exceeding the 600-line sub-split threshold per v2.2 reorg proposal
  §5.1, so this content lives in four sub-files under
  [`session/`](./session/) rather than a single
  `session-execution.md`). Plan-authoring discipline
  (`session/plan-authoring.md`), scope-lock conventions
  (`session/scope-lock.md`; includes the Verify-forward-at-scope-lock
  RI-1 through RI-10 cluster relocated from CLAUDE.md at Commit D),
  session-close shape (`session/session-close.md`), and runtime
  iterative-catching (`session/iterative-catching.md` — Session
  Labeling, Session Lock, environmental re-verification, Mutual
  Hallucination-Flag-and-Retract Discipline, bidirectional
  iterative-catching termination).
- [`prediction-grounding.md`](./prediction-grounding.md) — discipline
  for encoding predictions and parameter values in planning artifacts
  (specs, regex parameters, session-handoff prompts, ADRs, briefs,
  plans): ground against empirical evidence at write time, or
  explicitly mark as ungrounded and document the verification step.
  Codified Phase 6.5 from `caveat-prediction-vs-empirical-resolution`
  family at N=3. Paired with `regex-permissive-matching.md` for the
  design-time-vs-resolution-time split.
- [`regex-permissive-matching.md`](./regex-permissive-matching.md)
  — design-time discipline for permissive regex matching against
  non-trivial input populations: anticipate cost classes beyond the
  classical noise/signal split (over-match into similar-shaped
  strings, character-class incompleteness collapsing distinguishable
  subgroups, priority-ordered preemption hiding real signal).
  Codified Phase 6.5 from `regex-permissive-cost-class` family at
  N=3 distinct cost classes. Paired with `prediction-grounding.md`
  for the resolution-time discipline.

## Routing rule

Each observation has a single load-bearing home. Other surfaces may
contain summarized projections that point at the canonical source,
but the substantive content lives at exactly one location.

Routing destinations:

- Raw friction signal (CLUNKY/WANT/WRONG/NOTE on a specific
  moment) → `docs/07_governance/friction-journal.md`. Append-only;
  format `[date] [category] [one-line description]` per the file
  header. Active phase only — closed phases archive per the
  archival rule below.
- Repeatable rule earned by ≥3 fires → a topical file under this
  folder. Use the [decision tree](#routing-decision-tree) to pick
  the destination; match the existing voice.
- Architectural decision crossing more than one arc →
  `docs/07_governance/adr/NNNN-<slug>.md`. See
  `docs/07_governance/adr/README.md` for format.
- Phase- or arc-scope reflection →
  `docs/07_governance/retrospectives/<scope>-retrospective.md`.
  Four-section shape per the Phase 1.2 retrospective template.
- Unresolved question → `docs/02_specs/open_questions.md`.
- Inheritance carry-forward →
  `docs/09_briefs/phase-N/obligations.md`.

### Routing decision tree

When promoting a friction-journal pattern (≥3 fires) to a codified
convention, walk this tree to pick the topical file:

1. **Does the rule fire every session, regardless of surface?** If
   yes, it belongs in repo-root `CLAUDE.md` (must-always rules),
   not in this folder.
2. **What's the trigger surface?**
   - File-glob trigger (matches a path) → eligible for both topical
     conventions (canonical body) and `.claude/rules/` (operational
     projection; pilot scope at Commit C).
   - Activity trigger (fires at scope-lock, brief-write,
     verification gate, session close) → topical convention only.
   - Explicit invocation → skill at `.claude/skills/<name>/`.
   - Subagent dispatch → subagent at `.claude/agents/<name>.md`.
3. **What's the surface character?**
   - Branch / commit / contribution / formatting / file-top
     comments / cross-cutting code patterns → `code.md`.
   - Service template / route handler / middleware / webhook handler
     / error handling → `service-layer.md`.
   - Zod schema / API boundary casing / JSON schema → `schema.md`.
   - Supabase migration / RLS / backfill / NOT NULL discipline /
     seed-data PII → `migrations.md`.
   - Audit log / permission catalog / audit action naming →
     `audit-permissions.md`.
   - Test patterns / mocks / test-scope discipline → `testing.md`.
   - Agent tools / LLM call discipline / agent-mediated session
     discipline → `ai-agents.md`.
   - Plan-authoring / scope-lock / verification gate / session
     close / iterative-catching → the appropriate sub-file under
     [`session/`](./session/) (plan-authoring → `plan-authoring.md`;
     scope-lock → `scope-lock.md`; close-time → `session-close.md`;
     runtime coordination → `iterative-catching.md`).

The `codify-convention` skill (landing at Commit B) wraps this
decision tree as a forcing function at codification time.

## Write-time tripwires

Three policy tripwires plus a fallback rule:

1. **The 10-second rule.** A single friction-journal entry must
   be readable in roughly 10 seconds. Format
   `[date] [category] [one-line description]` with optional 2–3
   line elaboration; entries longer than ~10 lines are signal that
   content belongs elsewhere. Apply at write-time.
2. **No embedded retrospectives in the journal.** Sub-section
   headings like `### (a) Outcome summary` inside the friction
   journal are signal that content has overshot its container.
3. **Closeout artifacts route by purpose.** A closeout commit may
   produce a retrospective (long prose), conventions (codified
   rules), an obligations entry (carry-forward), and a
   `CURRENT_STATE.md` update — each lands at its correct surface.
   Bundling them into a friction-journal section is a routing
   failure.

**Fallback rule (capture-first).** If routing is unclear at
write-time, capture the observation in `friction-journal.md` with a
`[ROUTE?]` tag and resolve later. Unresolved `[ROUTE?]` tags are
resolved at session close (route to canonical destination or
explicitly mark `[ROUTE: stays-in-journal]` with rationale). The
phase-end hygiene pass (see below) audits that no tags survive
across sessions; tags that survive the hygiene pass itself are a
discipline violation requiring retroactive resolution.

## Codification thresholds

- **N=2** — split-trigger threshold (sub-types graduate to own
  conventions on second instance).
- **N=3** — codification threshold (friction-journal pattern →
  topical conventions entry).
- **N=5** — meta-shape review threshold (re-evaluate when sub-type
  list reaches five).

These are working thresholds, not laws. The Mutual Hallucination-
Flag-and-Retract Discipline (in `session/iterative-catching.md`)'s retraction
sub-track was grandfathered at 8 datapoints; author judgment governs
edge cases.

### Codification convention: observation-grain vs application-grain N count

When counting codification-graduation evidence (N), distinguish
two grains:

- **Observation-grain N.** The pattern surfaces as a new finding
  in distinct sessions / chunks / contexts. Typical codification
  threshold is observation-grain N=3 (the pattern needs to surface
  as a new observation in 3 distinct contexts before graduating to
  "should we normalize / codify project-wide" question).
- **Application-grain N.** The pattern is applied N times within a
  single session / chunk / context. Application-grain N within one
  session is one instance from threshold-counting perspective —
  not N independent observations.

**Why:** Chunk-3-Phase-4 close evidence: F-J-11 (Pattern B variant
split) prose conflated observation-grain N=1 (chunk-3 surfaced the
Phase-1-internal-wrap vs Phase-2/5-external-wrap split as a single
finding at scope-lock Round 6) with application-grain N=6 (chunk-3
applied the split across 6 service-method modifications at 3b).
The split is documented at chunk-3 but graduation awaits a second-
observation-grain instance (e.g., a future chunk reaching into
Phase 1 services or any variant-mixed service surface and re-
surfacing the variant-aware insertion-site decision).

**How to apply:** When citing N in codification claims (friction-
journal entries, retrospective inventory ratification, conventions
graduations), name the grain explicitly: "observation-grain N=X"
or "application-grain N=Y." For codification threshold purposes,
observation-grain N is the load-bearing count; application-grain N
documents the breadth-of-application within an instance but doesn't
contribute to the threshold count.

Precedent: Phase 4 chunk 3 close (memory-only candidate (iii)
graduation per Phase 4 retrospective; applies retroactively to
F-J-11 and other ambiguous-N codifications). Future codification
claims at chunks 4+ name the grain.

---
**Origin (this sub-section):**
- First codified: Phase 4 chunk 3 close (2026-05-14)
- Evidence basis: memory-only candidate (iii) graduation per Phase
  4 retrospective; retroactive to F-J-11 and other ambiguous-N
  codifications
- Promoted from: Phase 4 retrospective memory-only graduation
- Cross-references: F-J-11 (Pattern B variant split prose);
  Phase 4 retrospective writeup
- v2.2 reorg: 2026-05-17 (relocated from repo-root CLAUDE.md at
  Commit D per `docs/09_briefs/phase-6.5/reorg-proposal-v2.md` §4.1;
  lives alongside the codification-thresholds parent section as the
  methodological companion to N=2/N=3/N=5 thresholds)

### Codification convention: family-tag assignment at banking and graduation-time review

When banking an observation under a family tag, the operator
chooses between two possible tags:

- **Substrate-tagging:** by where the issue manifested.
- **Mechanism-tagging:** by what discipline the observation
  instantiates.

**Banking-time default: substrate-tagging.** Substrate is what
the operator was just working on; it's visceral and low-friction
to identify at banking time. Mechanism often requires reflection
that comes later — at graduation evaluation, after multiple
instances accumulate and a through-line emerges. Substrate-
tagging is the operational default at banking time.

**Graduation-time discriminator: mechanism-tagging.** At
graduation evaluation, the operator reviews the family's
instances for through-line. Mechanism becomes visible at this
grain — an instance tagged by substrate may turn out to
instantiate a different family's mechanism. When this happens,
the discriminator is to recognize the substrate-tag as evidence
for the substrate-family's surface-recurrence but to route the
instance's mechanism-significance to the mechanism-family at
graduation time.

**Operational example.** ARC 3 graduation evaluation surfaced
that an instance banked at ARC 2.5 (under
`docs/04_engineering/conventions/regex-permissive-matching.md`'s
family, by substrate — regex) instantiated the mechanism of
`docs/04_engineering/conventions/prediction-grounding.md`
(empirical-audit-rather-than-magic-number). Substrate-tagging
stood; graduation-time review recognized the cross-family
overlap and routed each family's load-bearing evidence
correctly. The substrate-tagged instance contributed to
regex-permissive-matching's count (N=3 distinct cost classes,
with instance 4 framed as resolution-meta) without inflating
prediction-grounding's threshold-counting.

**Principled when supplemented by graduation-time review.** The
substrate-tagging default + graduation-time discriminator is
principled when (a) banking sites preserve enough context for
graduation-time review to recognize cross-family overlap, and
(b) graduation evaluation actually happens (the family is
reviewed before any codification or dismissal decision). When
either condition fails, substrate-tagging can lock in a wrong
tag; the discipline's safety net is graduation-time review.

---

**Origin:**

- First codified: Phase 6.5 substrate-vs-mechanism re-evaluation
  arc, 2026-05-19
- Evidence basis: Two instances of family-misattribution. Instance
  1 surfaced at ARC 3 first-run observation 4 (commit `4486cb1`);
  Instance 2 surfaced at family 2 re-evaluation STEP 6 banking
  (commit `2aa8585`). The Open Question's re-evaluation trigger
  fired; resolution per Position A codifies the operational
  practice.
- Promoted from:
  `docs/04_engineering/conventions/README.md` §Open codification
  questions §Substrate-vs-mechanism family-tag precedence (banked
  at ARC 3.5 Item 4, commit `0fbb863`; now marked Resolved).
- Cross-references:
  - `docs/04_engineering/conventions/README.md` §Codification
    convention: observation-grain vs application-grain N count
    (sibling banking-time codification convention).
  - `docs/04_engineering/conventions/README.md` §Graduation
    criteria (the graduation-time review surface where the
    mechanism-discriminator operates).
  - `.claude/skills/codify-convention/SKILL.md` §Output
    specification artifact 3 (sibling resolution of Sub-shape 2;
    prose convention for codified-family references).

**Evaluation basis:**

- **Load-bearing (prescriptive).** The convention generates
  operator action at two surfaces: banking-time ("tag by
  substrate") and graduation-time ("review for mechanism-family
  overlap; route the mechanism-significance if found"). Both
  surfaces have explicit decisions to make; the convention names
  them.

- **Generalizable.** Substrate-tagging at banking time is the
  existing precedent across many friction-journal bankings (per
  the original Open Question entry's observation: "most existing
  family tags were assigned by substrate"). The convention
  codifies this widely-applied practice plus the graduation-time
  discriminator that makes it principled. The convention's reach
  extends across all banking-and-graduation cycles.

- **Stable.** The convention codifies operational practice that's
  been working across many bankings. The sub-shape distinction
  that surfaced during this re-evaluation (Sub-shape 1 vs
  Sub-shape 2 of the broader Open Question) is what enabled
  clean codification: the original Open Question was framed too
  broadly; sub-shape splitting allowed each to have its own
  resolution. The convention's pattern (substrate-tagging +
  graduation-time discriminator) was clear once the sub-shape
  distinction surfaced. Future instances would extend the
  convention's coverage rather than require revision. The Stable
  criterion's first operational application (family 2
  re-evaluation, commit `e6297f1`) excluded a renamed-pattern's
  graduation; this second application accepts a
  sub-shape-clarified pattern's graduation. The criterion is
  operating discriminatively, not as a rubber stamp.

## Three-category codification taxonomy

Codification thresholds vary by category. The artifact-codification
relationship is the load-bearing distinction:

- **Architectural principle.** Ratification IS codification. The
  principle's text in `DOCS_RESTRUCTURE_V<N>.md` (or in an ADR) is
  the canonical record at the moment of ratification. Threshold:
  N=1 per surface the principle applies to. Aggregation across
  surfaces is NOT required — each surface independently meets N=1.
  Worked examples: Principles 1, 2, 3 in `DOCS_RESTRUCTURE_V2.md`;
  ADR-0020's authority-gradient source organization.
- **Procedural pattern.** Artifact's existence documents the
  convention. The convention is in the artifact itself; reading the
  artifact teaches the pattern. Threshold: N=1 establishes; N=2
  confirms; codification often coincides with artifact creation.
  Worked examples: ADR `## Amendment` block format (per ADR-0022);
  friction-journal entry shape; round-N session-plan filename
  convention.
- **Process meta-pattern.** Artifact is decoupled from codification.
  The pattern operates on processes (how decisions get made, how
  drift gets caught, how sequences get verified) rather than on
  artifacts. Threshold: N=2 with shape match across distinct timing
  surfaces or distinct contexts; N=3 confirms. Codification gates
  must catch shape-match across instances, not just count. Worked
  examples: plan-substrate-vs-canonical-reality drift meta-pattern
  (codified in `session/plan-authoring.md`).

---
**Origin:**
- First codified: Round-2 Conventions, 2026-05-09
- Evidence basis: Round-2 docs reorganization codification work
- Promoted from: Round-2 session 8 codification arc
- Cross-references: `docs/07_governance/DOCS_RESTRUCTURE_V2.md`,
  ADR-0020, ADR-0022

## Graduation criteria

When a friction-journal pattern has met the N≥3 codification
threshold, three criteria determine whether the pattern graduates
to a codified convention, gets dismissed, or gets deferred.
Threshold-met-and-evaluated is the discipline gate; threshold-met
alone is not sufficient.

**Status:** observed in operational use through ARC 3 (three
family evaluations producing two graduations and one deferral);
codified provisionally with exploratory framing. Subject to
refinement as further operational experience accumulates.

### GRADUATE when ALL three hold

- **Load-bearing.** Future work materially benefits from naming
  the pattern explicitly. The codified convention would be cited
  in future briefs, ADRs, plans, prompts, or other discipline
  surfaces. A convention that no future surface would cite is
  not load-bearing.

- **Generalizable.** The pattern transcends the specific
  situation that surfaced it. Evidence shape varies: surface
  diversity across multiple instances (different artifact
  classes, different substrates) is one shape; known general
  analogs beyond the originating substrate is another. The
  convention's reach extends beyond the immediate originating
  arc.

- **Stable.** The pattern has settled enough that the convention
  won't immediately need amendment. Premature codification of an
  evolving pattern produces stale conventions. Evidence shape
  varies: multiple instances over time without the pattern's
  shape changing across them is one shape; a pattern whose
  explanation has been stable across operator articulations is
  another. A pattern that surfaced new sub-shapes or required
  name-revision recently is not yet stable.

### DISMISS when ANY of these hold

- **Narrow.** The pattern is specific to a one-time situation,
  not repeatable. Future surfaces will not encounter the same
  shape.

- **Unstable.** Still evolving; premature to codify. The
  convention would need amendment within weeks of authoring.

- **Captured-elsewhere.** The same insight already lives in an
  existing convention under a different name. Graduating creates
  a duplicate surface; the existing convention's amendment is
  the cleaner path.

### DEFER

The pattern meets some but not all GRADUATE criteria, or
additional N is needed to demonstrate one of the criteria. A
deferral entry should document which criteria the pattern fails
(or partially meets), and what re-evaluation trigger would
warrant reconsideration (e.g., "a 4th instance from operationally
distinct context"). A deferral without a re-evaluation trigger
becomes a parking lot.

### How to apply

When evaluating a graduation candidate, surface each criterion
explicitly: name the criterion, name the evidence supporting it,
name whether the criterion is met, partially met, or unmet. The
Evaluation basis footer field in each codified convention
captures this assessment for the artifact trail.

Application surfaces:

- At codification time, the `codify-convention` skill's
  invocation walks the operator through the three criteria as a
  precondition to drafting the codification block.
- At retrospective time, the friction-journal's N-counted
  candidates pass through the three criteria as the operator
  decides which graduate, which defer, and which dismiss.
- For meta-codifications (a convention about how to evaluate
  conventions, like this section), the criteria apply
  reflexively. This section's own Evaluation basis below is the
  first application of the framework to itself; the framework
  being graduable under its own criteria is a precondition for
  codifying it at all.

### Sub-shape distinctions

Operational use of the criteria has surfaced sub-shape distinctions
that refine how a criterion is met. Documented here as exploratory
framings — observed across operational applications, subject to
refinement as further experience accumulates.

A sub-shape distinction belongs in this section when the distinction
has been observed operationally to affect graduation decisions
(e.g., the prescriptive/descriptive distinction below changed
family 2's evaluation from candidate-GRADUATE to actual-DEFER).
Distinctions that are conceptual rather than operationally
consequential live in the relevant criterion's main body, not as
sub-shapes.

#### Load-bearing: prescriptive vs descriptive

The load-bearing criterion has been observed to have a sub-shape
distinction:

- **Prescriptive load-bearing.** The pattern generates operator
  action via imperative discipline ("when X, do Y"). Decision
  points and operational steps are part of the convention's body.
  Future surfaces cite the convention to invoke the discipline.

- **Descriptive load-bearing.** The pattern helps understanding
  but doesn't directly drive operator action. A heads-up, framing,
  or model that future surfaces cite to ground a concept rather
  than to invoke a discipline.

Prescriptive load-bearing meets the criterion cleanly; descriptive
load-bearing should be examined for an actionable sub-shape before
counting the criterion as met. The examination: characterize what
the pattern claims, then ask whether that claim implies any
operational action future surfaces could cite to invoke the
convention. If yes, restate the convention in prescriptive shape
— "when X, do Y" — and proceed. If no, the pattern is genuinely
descriptive and DEFER (waiting for operational sub-shape to
surface) or DISMISS (the pattern is purely descriptive and
unlikely to acquire operational consequence) is the right call.

This sub-shape was surfaced during ARC 3's family evaluations:
family 2 (`audit-fix-verify-surfaces-banking`) was DEFERRED on
grounds that its discipline implication reduced to "anticipate
banking at the verify step" — a heads-up rather than an imperative
with decision points. Compared to family 1
(`caveat-prediction-vs-empirical-resolution`), whose discipline
was "stop, surface, explain — not pre-edit the prediction" with
clear operator actions, the difference in load-bearing shape was
visible at evaluation time. Subject to refinement as further
operational experience accumulates.

---

**Origin:**

- First codified: Phase 6.5 ARC 3.5, 2026-05-18
- Evidence basis: Operationally applied at ARC 3 STEP 2 (three
  family evaluations: `caveat-prediction-vs-empirical-resolution`
  GRADUATED, `audit-fix-verify-surfaces-banking` DEFERRED,
  `regex-permissive-cost-class` GRADUATED). ARC 3 first-run
  observation 1 named the missing Evaluation basis field; the
  structural gap (framework not codified) was surfaced by
  ARC 3.5 STEP 2 audit.
- Promoted from: ARC 3 prompt's DECISION FRAMEWORK section
  (`docs/09_briefs/phase-6.5/2026-05-19-arc-3-prompt.md` lines
  110-138, operationally inlined). The framework existed in
  operator-prompt substrate; ARC 3.5 promotes it to canonical
  source.
- Cross-references:
  - `.claude/skills/codify-convention/SKILL.md` (the skill's
    output specification references this framework via the
    Evaluation basis field).
  - `docs/04_engineering/conventions/prediction-grounding.md`
    and `docs/04_engineering/conventions/regex-permissive-matching.md`
    (the two ARC 3 graduations whose Evaluation basis sections
    are empirical exemplars).
  - Three-category codification taxonomy (above) — orthogonal
    meta-codification axis: category determines codification
    shape, criteria determine codification gate.

**Evaluation basis:**

- **Load-bearing (prescriptive).** The framework generates
  operator action at every codification decision: surface the
  three criteria, evaluate against them, name the disposition.
  Every future codification passes through this gate. Without
  the framework codified, future codification decisions have no
  canonical referent and the Evaluation basis field becomes a
  free-form text box.

- **Generalizable.** The framework applies to every
  codification, not to any specific domain. Three operational
  applications in ARC 3 spanned different family shapes (regex
  cost classes, prediction discipline, audit-fix-verify
  meta-pattern) — different substrates, consistent framework
  behavior. The generalizability is grounded in operational
  shape rather than abstract argument.

- **Stable (exploratory framing).** Three operational
  applications is the same evidence base that DEFERRED family 2
  — not a strong stability signal in isolation. The framework
  is codified with explicit exploratory framing because not
  codifying it leaves the next codification with no canonical
  referent, which is worse than codifying provisionally. Future
  operational experience may refine the criteria themselves,
  surface additional criteria, or refine the sub-shape
  distinctions documented separately.

## Open codification questions

Deferred meta-decisions about the codification framework itself.
Each entry documents both positions, the evidence each currently
has, and the re-evaluation trigger that would warrant making the
call.

Entries marked Open are currently deferred. Entries marked
Resolved are historical record — the question was once open, and
the entry documents the deferral context. Resolved entries
include a pointer to the canonical surface where the resolution
lives.

**Status:** introduced at ARC 3.5 as a durable home for open
meta-decisions. Codified at N=1 (one open question to host) with
explicit exploratory framing — the category may refine as further
open questions accumulate or as the structure proves inadequate.

A question belongs in this section when (a) the question was
banked in the friction-journal as an open meta-decision, and (b)
deciding the question prematurely would foreclose evidence the
re-evaluation depends on. Questions with sufficient evidence
already on hand should be decided rather than deferred.

### Substrate-vs-mechanism family-tag precedence

**Status:** **Resolved 2026-05-19.** The Open Question's
re-evaluation trigger fired and the resolution was made via the
substrate-vs-mechanism re-evaluation arc. See "Trigger firing
and resolution" section below for the resolution summary; the
original deferral context follows as historical record.

**The question:** When banking an observation under a family tag,
which precedence applies — the *substrate the observation
operated on* (where the issue manifested) or the *mechanism of
the observation* (what discipline the observation instantiates)?

**Position A: substrate-tagging.** Tag by the surface where the
issue manifested. Argument: matches the operator's first-pass
attention (the substrate is what the operator was working on
when the observation surfaced). Existing banking precedent leans
this way — most existing family tags were assigned by substrate.

**Position B: mechanism-tagging.** Tag by the discipline the
observation instantiates. Argument: families should fire when
the mechanism recurs, not when the substrate happens to recur.
Mechanism-tagging produces taxonomies that generalize correctly
when patterns cross substrates.

**Evidence currently in hand:** ARC 3 first-run observation 4
surfaced the question: family 3's instance 4 (cost-class #3's
audit-grounded resolution) was banked under
`regex-permissive-cost-class` because the substrate was regex,
but its mechanism (empirical-audit-rather-than-magic-number) is
`caveat-prediction-vs-empirical-resolution`'s family-shape. One
instance is not enough to weigh substrate-vs-mechanism cost
empirically.

**Re-evaluation trigger:** the next family-misattribution
instance surfacing in the friction-journal. When the discipline
gap fires again (whether substrate-tagged or mechanism-tagged),
that instance is the moment to make the call with grounded
evidence about which kind of misattribution is more frequent and
more costly.

**Back-reference:** friction-journal 2026-05-19 ARC 3 close H2
Observation 4 (commit `4486cb1`).

**Trigger firing and resolution (2026-05-19):**

The trigger fired during family 2 re-evaluation STEP 6 banking
(commit `2aa8585`). The second instance was prose mentions of a
codified family tag in a banking entry about other observations.
Re-evaluation surfaced that the Open Question spans two
sub-shapes; both were resolved separately.

- **Sub-shape 1 (uncodified-family-tagging precedence at banking
  time):** Resolved via Position A (substrate-tagging). Codified
  at `docs/04_engineering/conventions/README.md` §Codification
  thresholds §Codification convention: family-tag assignment at
  banking and graduation-time review. Substrate-tagging is the
  banking-time default; mechanism-tagging operates as a
  graduation-time discriminator.

- **Sub-shape 2 (codified-family-tag-mention-counting at
  detector-run-time):** Resolved via combined operator-side and
  script-side fixes. Operator-side: prose convention codified at
  `.claude/skills/codify-convention/SKILL.md` §Output
  specification artifact 3 — codified-family references in prose
  use file paths rather than family-tag names. Script-side:
  Stage A refinement queued as ARC 3.6 (will refine the
  detector's grep to distinguish codification footers from body
  mentions).

Note: the "Evidence currently in hand" and "Re-evaluation
trigger" sections above retain the original entry's tag-name
mentions (`regex-permissive-cost-class`,
`caveat-prediction-vs-empirical-resolution`) as historical
citation. Under the prose convention codified for Sub-shape 2,
this entry falls into case (b) — it's a meta-discipline entry
about families-as-a-class. Tag-name mentions in historical-
citation context are preserved as-is.

---

**Origin (this section):**

- First codified: Phase 6.5 ARC 3.5, 2026-05-18
- Evidence basis: ARC 3 first-run observation 4 surfaced an open
  meta-decision the prior banking precedent didn't resolve.
  ARC 3.5 STEP 2 audit confirmed the resolution had not yet been
  made; the ARC 3.5 prompt's initial framing asserted a
  resolution by inline assertion, which itself was a discipline
  gap (open question resolved unilaterally). Operator direction
  at STEP 2 redirected the prompt's resolution-by-assertion to
  OPEN QUESTION shape.
- Promoted from: friction-journal 2026-05-19 ARC 3 close,
  Observation 4 (commit `4486cb1`); ARC 3.5 STEP 2 audit; ARC 3.5
  prompt Obs 3 (revised to OPEN QUESTION shape per operator
  direction).
- Cross-references:
  - `docs/04_engineering/conventions/README.md` §Codification
    thresholds, §Three-category codification taxonomy, and
    §Graduation criteria (sibling meta-codification sections;
    this section is the sibling that hosts deferred meta-
    decisions).
  - `docs/07_governance/friction-journal.md` 2026-05-19 ARC 3
    close H2, Observation 4 (line 14050).

**Evaluation basis:**

- **Load-bearing (prescriptive).** The section is cited at
  banking time when an operator identifies an open meta-decision:
  "when banking an open meta-decision, add it here rather than
  letting it sit unbanked or resolved-by-implication." Without
  the section, open meta-decisions either accumulate invisibly
  in the friction-journal or get resolved silently by
  next-touch.

- **Generalizable.** The section applies to any deferred
  meta-decision about the codification framework, not to the
  substrate-vs-mechanism question specifically. The substrate-
  vs-mechanism entry is the first instance; future open meta-
  decisions slot in as sibling entries.

- **Stable (exploratory framing).** Codified now with exploratory
  framing. The next-instance failure mode — without this section,
  future open meta-decisions either accumulate invisibly in the
  friction-journal or get resolved silently by next-touch — is a
  real cost but a softer one than (e.g.) the circular-reference
  cost that motivated codifying the graduation criteria framework.
  The exploratory framing reflects this: N=1 of "open
  meta-decisions deserving a durable home" with the section's
  value to be demonstrated by future open questions accumulating
  cleanly or by the structure proving inadequate.

## Hygiene cadence

A phase-end hygiene pass is required at every phase close. The pass:

1. Resolves any `[ROUTE?]` tags that have survived their
   session-close clearing requirement.
2. Reviews convention threshold candidates (patterns at 2+
   datapoints not yet codified).
3. Prunes obligations that have been completed or invalidated.
4. Verifies cross-references from the topical files in this folder
   to friction-journal subsections still resolve.

Lands as part of the phase closeout commit set, alongside the phase
retrospective.

**Tooling floor.** Policy alone decays without tooling. The
following minimum viable tooling supports this hygiene cadence:

- **Line-length check**
  (`scripts/check-friction-journal-line-length.sh`) — script
  flagging any single bullet item in `friction-journal.md`
  exceeding ~10 lines.
- **`[ROUTE?]` tag scanner** (`scripts/scan-route-tags.sh`) —
  script listing unresolved tags in the active journal, with a
  non-zero exit at phase close (`--phase-end` mode) if any
  survive.
- **Heading detector** (`scripts/detect-journal-headings.sh`) —
  script flagging `###` or `####` headings inside
  `friction-journal.md` (signal that retrospective content has
  been embedded).
- **Citation auditor**
  (`scripts/audit-friction-journal-citations.sh`) — script
  auditing the topical conventions files for citations to
  `friction-journal.md` patterns; catches both `\.md` and
  shorthand `section (X)` patterns.

Run scripts manually until a phase-end hygiene cadence
orchestrator wraps them. Additional tooling may follow.

## Archival rule

When a phase closes:

1. That phase's friction-journal section moves to
   `friction-journal/phase-X.md` in the same commit as the phase
   retrospective.
2. Archived sections preserve their original lettering (sections
   (a) through (p) keep those letters in the archive) so prior
   citations resolve without rewriting.
3. Long-prose subsections already absorbed into the phase
   retrospective are stubbed in the archive with a one-line
   pointer (e.g., "Section (p): captured in
   `phase-1.2-retrospective.md` §3 Pattern 6.") rather than
   duplicated.
4. Citations from topical conventions files to friction-journal
   subsections that have been absorbed into a retrospective are
   rewritten to point at the retrospective subsection, not the
   archive stub.

## Deprecation model

Conventions can be retired via three distinct paths, each with
explicit lineage:

- **Deprecated.** Convention is no longer applicable (e.g., the
  underlying system was redesigned and the discipline is moot).
  Convention text retains in its topical file with a
  `**DEPRECATED** as of <date>; reason: <reason>` header and is
  moved to a "Deprecated Conventions" section at end of file.
- **Superseded.** Convention is replaced by a different convention
  that handles the same problem differently. Original convention
  links to its successor; successor cites its predecessor. Same
  lineage shape as ADR supersession.
- **Merged.** Two or more conventions combine into one, typically
  when their codification-trigger evidence is found to be the same
  underlying pattern. The merge is recorded in the surviving
  convention's body; the merged-out conventions become one-line
  stubs pointing at the survivor. The original Per-Entry Pending-
  Orphan Preflight rename (to Per-Entry Row-Card Pairing) is the
  originating instance, captured in `ai-agents.md`.

All three paths require a Governance Audit row (see the
governance-audit appendix in the top-level
[`../conventions.md`](../conventions.md)).

## Known limitations

This routing rule defers three concerns. Each is named explicitly
so future review knows where to revisit:

- **Ownership model deferred.** In current solo-dev-with-Claude
  operation, ownership collapses to the operator. Deferred — will
  be addressed when warranted, with full review at that time.
- **Read-path design deferred.** This routing covers write
  discipline. Navigation/usage patterns (onboarding read path,
  debugging read path, decision-history read path) live in
  `docs/04_engineering/DEV_WORKFLOW.md`. Deferred — will be
  addressed when warranted, with full review at that time.
- **Priority gradient deferred.** All conventions are currently
  flat (no CRITICAL/HIGH/LOCAL tagging). Deferred — will be
  addressed when warranted, with full review at that time.

---
**Origin:**
- First codified: Documentation Routing, 2026-04-26 (Phase 1.2 C12
  closeout follow-on)
- Evidence basis: friction-journal drift surfaced by
  `phase-1.2-retrospective.md` §2 inheritance-artifact map; three
  classes of drift (closeout absorption, session-closeout
  absorption, convention codification source absorption)
- Promoted from: `phase-1.2-retrospective.md` §2 inheritance-artifact
  map analysis; first concrete application was the Phase 1.2
  friction-journal split
- Cross-references: `phase-1.2-retrospective.md` §2; ADR-0020
  (authority gradient); `DOCS_RESTRUCTURE_V2.md` Principles 1-3.
- Tooling-floor amendment: 2026-04-27 (S17 tooling delivery; added
  citation-auditor as fourth tooling-floor bullet per S16
  C1-extension finding).
- v2.2 reorg restructure: 2026-05-17 (Commit A of reorg per
  `docs/09_briefs/phase-6.5/reorg-proposal-v2.md`; promoted from
  buried `## Documentation Routing` section at line 1695 of the
  pre-split `conventions.md` to discoverable `README.md` at
  directory entry).
