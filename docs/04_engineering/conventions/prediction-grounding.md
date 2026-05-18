# Prediction grounding

Discipline for encoding predictions and parameter values in planning
artifacts (specs, regex parameters, session-handoff prompts, ADRs,
briefs, plans).

## The rule

When encoding a prediction about future behavior or a parameter
value that asserts a constraint on data shape, ground the
prediction against empirical evidence at write time. When grounding
isn't feasible at write time (the data doesn't exist yet, the audit
cost exceeds the prediction's stakes, or the prediction is genuinely
speculative), explicitly mark the prediction as ungrounded and
document the verification step that will check it.

Grounding is the default; labeling-as-ungrounded is the explicit
exception. The shift matters because the discipline is an audit
exercise, not a labeling exercise — slapping "this is unverified"
on every prediction satisfies the letter while defeating the spirit.

The failure mode this prevents: confident-sounding predictions
encoded without grounding are revealed as partially or fully off
when verification runs against disk. Three observed sub-shapes
(one per artifact class):

- **Spec caveats** that predict resolution behavior without
  verifying it (e.g., "shadowed lines will land in T1.5"
  generalized from one sample, when most actually redirect to
  B2/B3 attribution).
- **Parameter values** chosen during design without empirical
  grounding (e.g., a 40-char regex cap set during brainstorm with
  no audit against actual data lengths).
- **Session-handoff prompts** that encode count expectations for
  the next session based on the prompt-writer's snapshot, when
  disk state has evolved between writing and execution.

## How to apply

At prediction-encoding time:

1. **Separate "what verification will confirm" from "what
   verification will discover."** Confirm-shape predictions assert
   a property already established at write time; discover-shape
   predictions assert behavior that verification will reveal. Use
   confirm-shape only when the property has been verified at write
   time. Use discover-shape language ("expected," "predicted")
   otherwise, and document the verification step that will check.

2. **Ground constraint values against empirical data.** If you're
   setting a constraint on what your code or regex will operate
   over (numeric threshold, byte cap, shape match, length limit,
   character class, type predicate), audit what the data actually
   looks like first. The empirical audit reveals whether the
   constraint shape is even appropriate, not just what the value
   should be. A magic number is the parameter; the audit is the
   grounding.

3. **For predictions that can't be grounded at write time, name
   them explicitly.** Let the verification step's stop-on-mismatch
   reflex catch divergence rather than papering over it.
   Pre-editing a prediction to suppress an anticipated mismatch
   defeats the discipline.

## How verification surfaces divergence

The verification step's purpose is to test against reality. When a
verification check fires on a divergence between a prediction and
disk state, the appropriate response is **stop, surface, explain**
— not pre-edit the prediction. The discipline operates as
designed: predictions get tested; divergences get banked as
observations; future predictions are written with the empirical
shape in mind.

---

**Origin:**

- First codified: Phase 6.5, 2026-05-19
- Evidence basis: N=3, observation-grain across distinct timing
  surfaces (spec-caveat-writing, parameter-setting,
  prompt-authoring). Friction-journal lines 13430 (commit
  `39c8a3c`), 13489 (commit `bcbcacc`), 13671 (commit `0368d7f`).
- Promoted from: friction-journal family
  `caveat-prediction-vs-empirical-resolution` (3 instances banked
  2026-05-19; family name reflects the originating instance, this
  codification reflects the broader content per the ARC 3 STEP 2
  evaluation's Option A graduation pattern).
- Cross-references:
  - `docs/07_governance/friction-journal.md` 2026-05-19 banking
    entries: the three instances at lines 13430, 13489, 13671
    (each a substantively distinct surface class).
  - `docs/09_briefs/phase-6.5/2026-05-17-friction-pattern-detector-design.md`
    §Bucket extraction (first-instance surface — spec caveat
    amendment provenance).
  - `docs/07_governance/friction-journal.md` 2026-05-19 entries
    at lines 13514, 13523, 13707 — the sibling
    `audit-fix-verify-surfaces-banking` family banked alongside
    (the *structural reason* the prediction-grounding instances
    keep surfacing; codification status of that family TBD this
    arc and not pre-projected here).

**Evaluation basis** (operator-added field; the
`codify-convention` skill does not currently require evaluation
reasoning in the codification footer, but capturing it here sets
the precedent that graduation reasoning belongs in the artifact
trail alongside provenance — see first-run observation banking
from ARC 3 STEP 3):

- **Load-bearing.** The discipline is citable by name from future
  planning artifacts. Future briefs, plans, prompts, ADRs, and
  spec caveats can reference this convention rather than
  re-deriving the rule. The "stop, surface, explain" operational
  guidance specifically benefits from being named once and
  referenced everywhere.
- **Generalizable.** Surface diversity across the three instances
  is the empirical evidence. The instances span three distinct
  artifact classes (spec caveats, regex parameters,
  session-handoff prompts) — not three instances of the same
  narrow shape. The generalization is grounded by surface
  diversity, not by abstract argument.
- **Stable.** Three instances within ~2 weeks but each in a
  substantively distinct surface; the through-line is consistent
  across instances; the rule has settled enough to name without
  immediate-amendment risk. Future instances are expected to
  extend the convention via additional sub-shapes rather than
  amend its core rule.
