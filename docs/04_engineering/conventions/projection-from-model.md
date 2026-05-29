# Projection-from-model without disk-check

Discipline for arc-handoff and conversation-substrate moments where
projected or asserted state is treated as disk-truth without
verification. Paired with
[`prompt-drift-typology.md`](./prompt-drift-typology.md) as the
broader framework containing the pattern's category-A discriminator
(prompt-vs-disk); this convention codifies the specific failure mode
within that category.

## The rule

When a prompt, surface, or affirmation asserts state about disk
(file existence, git lineage, working-tree composition, environment
state, prior arc completion), the assertion must be verified
against disk before being consumed by downstream work. The
projection — treating the asserted state as established truth
without verification — is the pattern. Catching the projection
before its consumption is the discipline.

The failure mode the discipline prevents: projected state encoded
in conversation substrate or prompt artifacts gets consumed
downstream (in commits, surfaces, codification artifacts, executor
decisions) without verification, accumulating drift between
projected-truth and disk-truth that propagates into load-bearing
substrate.

## How to apply

When a prompt, surface, or affirmation asserts disk state:

1. **Read disk directly.** Don't paraphrase from memory,
   conversation context, or prior turn's affirmation. The
   substrate is what's on disk now.

2. **Surface delta if any.** When prompt-claimed and disk-actual
   differ, surface the delta before proceeding. The catch is the
   discipline working at the cheapest available layer.

3. **Don't affirm without verifying.** When a downstream party
   affirms an upstream party's assertion ("yes, X is durable on
   origin/staging"), the affirmation should be grounded in a fresh
   disk-check, not in pattern-matching the upstream assertion's
   shape against memory. Bilateral affirmation without
   disk-verification produces a stronger conviction-loop than
   either party's individual evidence would warrant.

## Observed sub-shapes

The grain dimension names *which side* the projection originates
from; the within-advisor-grain bilateral sub-shape names *how many
parties* participate in the affirmation loop before the catch
fires; the substrate-routing sub-shape names *where to record* a
catch when manifestation-site and discovery-site diverge.

### 1. Reviewer-grain — catches at executor HEAD-pass

The executor projects expected state from the prompt's framing
during HEAD-pass; reading disk falsifies the projection before
downstream work consumes it. Single-side review surface; catches
at HEAD-pass before commits land.

- **Observed instances** (per cross-arc convention: one
  cross-arc instance per arc regardless of within-arc
  multiplicity):
  - **Hygiene close** (`9f320ded`) — HEAD-pass caught projection-
    from-model across items 3, 5, 6, 8 + the loop-closing meta-
    instance at the item 6 → 6.5 split. Each catch instantiated
    category-A's read-disk discriminator at a scope-adjudication
    moment.
  - **T8 close** (`183935ee`) — T8 investigation arc's HEAD-pass
    disk-read of `documentRouterService.ts` falsified the hygiene
    closeout's date-arithmetic hypothesis; the actual mechanism
    was PostgREST truncation. Hygiene close had projected the
    hypothesis without disk-verifying; T8 close discovered the
    projection.
  - **Umbrella close** (`462ad426`) — HEAD-pass surfaced
    convention-existence catch (resumption prompt named
    `docs/04_engineering/conventions/testing.md` as canonical
    venue; discipline lived at `.claude/skills/integration-test-
    rules/SKILL.md` §3) + substrate-deletability-vs-failure-mode-
    axis distinction. Each catch instantiates the pattern at
    sub-class grain.
- **Catch-layer:** executor HEAD-pass against disk. Single-side
  review surface catches before downstream commits land.
- **Mitigation:** disk-read discipline at every HEAD-pass per
  [`prompt-drift-typology.md`](./prompt-drift-typology.md)'s
  category-A discriminator.

### 2. Advisor-grain — catches at next-session disk-touch or operator disk-truth verification

The advisor seat projects expected state into a prompt or surface
during draft-time without disk-verifying; the projection gets
caught when a downstream party (operator at draft-review or
executor at next-session HEAD-pass) tests against disk.

- **Observed instances** (N=3 disk-landed):
  - **Companion-close mid-arc** (banked at companion close
    `a4cc0f02` sub-observation #2) — advisor treated drafted-
    but-not-executed companion prompt as durable arc lineage when
    proposing the typology codification directive; executor
    HEAD-pass-against-disk surfaced the 4th-scenario truth
    (companion arc never opened; `origin/staging` HEAD unchanged
    at `462ad426`). Unilateral sub-shape.
  - **Sequencing-discussion at typology-arc draft** — advisor's
    framing treated drafted typology-codification resumption
    prompt + directive as durable conversation substrate "ready
    for `a4cc0f02` substitution" before the companion arc had
    actually closed; operator caught at disk-truth verification
    before any prompt fired. Unilateral sub-shape.
  - **Lineage-anchor catch at typology-arc HEAD-pass** —
    bilateral sub-shape (see §Bilateral sub-shape of advisor-
    grain below for full description). Briefly: advisor's
    resumption prompt encoded `origin/staging` HEAD as
    `a4cc0f02` without disk-verifying the push; executor
    HEAD-pass step 2 surfaced disk-truth at `462ad426`.
- **Catch-layer:** advisor draft-review (caught by operator) or
  next-session executor HEAD-pass.
- **Mitigation:** disk-read discipline at draft-time, before
  prompt artifacts encode projected state. When draft-time
  disk-verification isn't feasible (projected state references
  future arc completion or expected-but-not-yet-fired events),
  mark the projection explicitly as ungrounded and document the
  verification step per
  [`prediction-grounding.md`](./prediction-grounding.md).

#### Bilateral sub-shape of advisor-grain

When advisor projects → operator affirms → executor affirms, the
three-layer affirmation feedback loop produces stronger conviction
than any party's individual evidence would warrant. The
affirmation bypasses single-side review — each party treats the
others' affirmation as evidence rather than disk-verifying
independently.

- **Observed instance:** **lineage-anchor catch at typology-arc
  HEAD-pass** — advisor + operator + executor all affirmed
  companion arc's push-success based on the operator's narrative
  recap ("Push + session-end + unset all observed") without
  anyone disk-verifying the canonical push output. The absence
  of `462ad426..a4cc0f02 staging -> staging` in conversation
  substrate was the load-bearing signal all three parties
  glossed in favor of the affirmation loop's pattern-match.
- **Catch-layer differential:** unilateral advisor-grain catches
  at executor HEAD-pass; bilateral advisor-grain requires
  **catch-from-outside-the-affirmation-loop** — the next
  session's disk-touch (or any disk-touch not participating in
  the original affirmation conversation). The affirmation
  feedback loop's mutual reinforcement bypasses single-side
  review surfaces; the catch must come from a disk-touch that
  isn't part of the conversation substrate where the affirmation
  happened.
- **Mitigation:** when a downstream party affirms an upstream
  party's disk-asserting statement, ground the affirmation in a
  fresh disk-check. The canonical disk-check output (e.g.,
  `git push origin staging`'s `X..Y staging -> staging` line) is
  the load-bearing evidence; the upstream party's narrative recap
  is not a substitute.

### 3. Manifestation-vs-discovery divergence — substrate-routing sub-shape

When the pattern manifests in one arc but is discovered in a
later arc, banking the instance involves substrate-routing
nuance: the manifestation-site (origin arc) is where the pattern
fired; the discovery-site (catching arc) is where the catch
landed. The README §family-tag-assignment convention's
substrate-tagging-at-banking-time default doesn't directly
address this divergence — substrate-tag points at manifestation-
site; record-of-discovery points at discovery-site.

- **Observed instance** (N=1 disk-landed):
  - **Lineage-anchor catch at typology-arc HEAD-pass** —
    manifestation was at companion arc's close-sequence (push
    didn't land + bilateral affirmation of durability across
    advisor + operator + executor); discovery was at typology
    codification arc's HEAD-pass step 2 (this arc's first
    substantive disk-touch).
- **Resolution practice:** record the catch at discovery-site
  (where the executor HEAD-pass fires) with explicit framing
  about manifestation-site (origin arc). Avoid retroactive
  amendment of the manifestation-site arc's closeout entry
  unless the discovery materially changes that arc's
  evaluation. This arc's closeout entry records the
  lineage-anchor catch as discovery-site substrate;
  manifestation-site at companion close (`a4cc0f02`) is
  identified but not amended retroactively.
- **Codification status:** banked at N=1 with exploratory
  framing; sub-shape emerged at this arc's HEAD-pass. Future
  instances would extend the sub-shape's evidence basis;
  current codification names the resolution practice as
  observed once, subject to refinement.

## Sibling pattern: prompt-drift-typology

The category-A discriminator (prompt-vs-disk) in the four-category
prompt-drift typology
([`prompt-drift-typology.md`](./prompt-drift-typology.md))
contains this sub-pattern as one of its specific failure modes.
The framework operates at HEAD-pass on prompts; this sub-pattern
operates at the moment projected state is encoded or affirmed
without disk-verification. The two conventions are paired —
encountering one, look for the other.

---

**Origin:**

- First codified: typology codification arc, 2026-05-29 (arc
  closeout).
- Evidence basis: friction-journal-pattern shape per
  `docs/04_engineering/conventions/README.md` §Codification
  thresholds (N=3 codification threshold). Reviewer-grain
  observation-grain N=3, with interpretation-status named per
  instance:
  - **Hygiene close** [`9f320ded`] — **strict interpretation**
    (explicit framework naming at sub-observation "Four-category
    vigilance extends from drafter-side to reviewer-side"; three
    within-arc application-grain manifestations enumerated, which
    per the README §observation-grain vs application-grain N
    count convention count as one observation-grain instance).
  - **T8 close** [`183935ee`] — **loose interpretation**
    (mechanism-tagged at this arc's graduation review per the
    README §family-tag assignment convention's mechanism-tagging-
    at-graduation-time-discriminator; T8 closeout does not cite
    the framework by name but the catch substantively
    instantiates the pattern).
  - **Umbrella close** [`462ad426`] — **loose interpretation**
    (mechanism-tagged at graduation review; meta-observations
    #1 and #2 banked as their own shape, not as framework
    instances by name).

  Advisor-grain observation-grain N=3 disk-landed (all explicit
  at advisor grain):
  - **Companion-close mid-arc instance** — sub-observation #2
    "Advisor-context-vs-disk drift on execution-state
    assumptions" at companion close (`a4cc0f02`). Unilateral
    sub-shape.
  - **Sequencing-discussion-at-typology-draft instance** —
    operator caught at draft-review before any prompt fired.
    Unilateral sub-shape.
  - **Lineage-anchor-catch-at-typology-HEAD-pass instance** —
    executor caught at HEAD-pass step 2 against disk. Bilateral
    sub-shape (advisor + operator + executor three-layer
    affirmation feedback loop).

  Single-pattern-multi-grain framing per this arc's HEAD-pass
  adjudication call 3: grains are sub-shapes within one pattern
  (same substance — treating projected state as disk-truth —
  different consumer-sides and catch-layers).
- Promoted from: friction-journal banking sites — hygiene close
  (`9f320ded`, sub-observation "Four-category vigilance extends
  from drafter-side to reviewer-side") first named the pattern
  explicitly at reviewer grain with three within-arc
  manifestations enumerated (conversation-substrate projection +
  file-format projection + attribution-content projection); the
  hygiene close text frames the pattern as "Banked, not
  graduated; three manifestations of one underlying pattern."
  Companion close (`a4cc0f02`, sub-observation #2 "Advisor-
  context-vs-disk drift on execution-state assumptions") first
  named the pattern explicitly at advisor grain. Pattern's
  substance was banked descriptively at T8 close (`183935ee`) +
  umbrella close (`462ad426`) without explicit framework-name
  citation — these instances are mechanism-tagged at this arc's
  graduation review per the README §family-tag assignment
  convention.
- Cross-references:
  - [`prompt-drift-typology.md`](./prompt-drift-typology.md)
    (framework codification containing this sub-pattern as
    category-A's specific failure mode).
  - [`prediction-grounding.md`](./prediction-grounding.md)
    (paired convention — when grounding isn't feasible at write
    time, mark predictions as ungrounded and document the
    verification step).
  - `docs/04_engineering/conventions/README.md` §Codification
    thresholds + §family-tag assignment (the codification
    framework supporting this graduation).
  - `docs/07_governance/friction-journal.md` banking sites:
    line 16203 (commit `9f320ded`, hygiene close); line 16359
    (commit `183935ee`, T8 close); line 16540 (commit `462ad426`,
    umbrella close); line 16768 (commit `a4cc0f02`, companion
    close — first explicit naming at advisor grain).

**Evaluation basis:**

- **Load-bearing (prescriptive).** The convention generates
  concrete operator action when the pattern fires: stop, surface,
  verify against disk, hold for adjudication before downstream
  action. Mitigation patterns vary by grain — unilateral grain
  catches at executor HEAD-pass; bilateral grain requires
  catch-from-outside-the-affirmation-loop (next session's
  disk-touch). Without the codified sub-pattern, future arcs
  would re-derive the bilateral-grain catch-layer differential
  cold; bilateral instances might propagate further before being
  caught.

- **Generalizable.** Applies to any prompt/spec/handoff/closeout/
  affirmation that asserts disk state without verifying. Multiple
  grains (reviewer + advisor); multiple sub-shapes (unilateral +
  bilateral at affirmation feedback loop boundary + manifestation-
  vs-discovery divergence at substrate-routing boundary); multiple
  substrate types (execution-state + lineage-state + codification-
  state). Surface diversity is the empirical evidence — the
  pattern's substance holds constant across grain, sub-shape, and
  substrate-type dimensions.

- **Stable (exploratory framing).** Pattern substance has been
  consistent across instances since hygiene close (2026-05-27);
  the *name* was formalized at companion close (2026-05-29); two
  new sub-shapes have surfaced *at this arc's HEAD-pass*
  (bilateral-grain sub-shape of advisor-grain; manifestation-vs-
  discovery divergence). Recency of name + active sub-shape
  emergence makes **exploratory framing** the honest call —
  codify the core pattern, document sub-shapes as observed,
  expect amendment as further sub-shapes surface. Same precedent
  as the README §Graduation criteria framework's own Evaluation
  basis (codified exploratory). Future operational experience may
  refine the sub-shape distinctions documented above, surface
  additional sub-shapes, or refine the grain framing.
