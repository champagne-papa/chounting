# Prediction grounding

Discipline for encoding predictions and parameter values in planning
artifacts (specs, regex parameters, session-handoff prompts, ADRs,
briefs, plans).

## The rule

When encoding a prediction about future behavior, a parameter
value that asserts a constraint on data shape, or an unobservable
current-state fact you have not read from its source (a commit
hash, a verification count, an attribution of who-said-what, a
cross-reference, a diff shape), ground it against the empirical
source — disk, git, the record — at write time. When grounding
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
when verification runs against disk. The sub-shapes span two
independent axes — the *artifact class* where a claim is encoded,
and the *claim type* being grounded.

**By artifact class** (where the prediction/claim is encoded) —
three observed:

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

**By claim type** (what unobservable is grounded by reading the
source at write time) — six observed (five from the V1 Wave-0
governance arc; the sixth from the agent→adminClient Arc 1,
2026-06-06). Of the Wave-0 five, four cite a discrete caught slip;
numstat's basis is the standing include-numstat-in-commit-reports
convention plus grounding-family membership, not a caught
mis-recall:

- **Commit hashes (SHA-corollary).** Never author a commit SHA you
  haven't read from git. Slip: `9caf9c30` predicted into a
  verification echo, self-corrected to the real hash.
- **Verification counts (grep-count guard).** An unexpected
  grep/check count is a question, not a verdict — read the bytes,
  in either direction. Slips: an ADR-0029 regex-escaped `demote`
  grep read as 0; a C1 harness "exit 0" that was `meta.txt
  EXIT_CODE=1`.
- **Attributions (attribution guard).** Ground a claim about
  who-said-what against the record before escalating a conflict.
  Slip: a quoted-then-rejected paraphrase read as a live
  instruction.
- **Cross-references (related-field grounding).** Resolve each
  reference to its actual target before transcribing. Slip: an
  ADR's frontmatter `related` listing unauthored ADRs that would
  fail `adr:lint`.
- **Diff shape (numstat).** Read a commit's file-shape from
  `git show --numstat`, don't recall it. Basis: the standing
  reporting convention + grounding-family membership, not a caught
  slip; dual-nature — also a commit-time reporting-coordination
  convention, which if it earns its own fires graduates separately
  (likely to `session/iterative-catching.md`).
- **Claim grain (grain-anchor guard).** A claim verified at one
  grain does not transfer to a broader or finer grain without
  verification at that grain; anchor every scoped claim to its
  verified grain explicitly ("the nine" reads as everything unless
  it says `src/agent`). Slips (N=2, identical shape, same narrow
  domain — claims about CI/lint state — both caught only
  downstream): the Wave-6 D8 coda's "pre-existing, not
  wave-introduced" — true at CI-job grain, false at violation grain
  (two wave-introduced sites); the Arc-1 close prose's "red purely
  Class B's seven" — true at `eslint src/agent` grain, false at
  codebase-CI grain (14 errors, three classes). The second fire was
  the advisor's, in the act of warning against the shape — the
  recurrence-through-the-disciplined is the case for codifying
  rather than resolving-to-discipline.

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
- Evidence basis (extension): +5 claim-type sub-shapes from the
  V1 Wave-0 governance arc (2026-06-01), additive per this
  convention's "extend via sub-shapes" clause; promoted from the
  `friction-journal.md` "V1 Wave-0 governance arc" entry (Six
  grounding guards). Four cite caught slips (SHA-corollary,
  grep-count, attribution, related-field); numstat is
  convention-based, not a caught slip.
- Evidence basis (extension): +1 claim-grain sub-shape
  (grain-anchor guard) from the agent→adminClient Arc 1
  (2026-06-06), graduated at the N=2 split-trigger for sub-types of
  an existing convention; promoted from the friction-journal Arc-1
  entries (the WRONG coda-grain catch, N=1 banked with the
  next-fire trigger named; the WRONG second fire in the advisor's
  close prose — the trigger firing as written). Routed via
  `codify-convention` at the Arc-1 record-and-codify pass;
  advisor-ruled CODIFY-NOW with the explicit reasoning that
  recurrence through the discipline's own keeper is the argument
  for codification over discipline.
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

**Evaluation basis** — added inline at ARC 3 graduation (commit
`6d3a911`) as precedent-setting operator decision before the
`codify-convention` skill required this field. The field was
formalized at `docs/04_engineering/conventions/README.md`
§Graduation criteria in ARC 3.5 (commit `8b241ee`). This file's
Evaluation basis is preserved verbatim from the precedent-setting
application.

- **Load-bearing (prescriptive).** The discipline is citable by name from future
  planning artifacts. Future briefs, plans, prompts, ADRs, and
  spec caveats can reference this convention rather than
  re-deriving the rule. The "stop, surface, explain" operational
  guidance specifically benefits from being named once and
  referenced everywhere.
- **Generalizable.** The convention generalizes across two
  independent axes. (1) *Artifact class*: the original three
  instances span spec caveats, regex parameters, and
  session-handoff prompts — surface diversity, not three instances
  of the same narrow shape. (2) *Claim type*: the V1 Wave-0
  governance arc added five sub-shapes spanning distinct
  unobservables grounded by reading the source (commit hash,
  verification count, attribution, cross-reference, diff shape);
  Arc-1 (2026-06-06) a sixth (claim grain) — six current total.
  Two-axis coverage is a stronger generalization than the original
  single-axis surface diversity.
- **Stable.** Three instances within ~2 weeks but each in a
  substantively distinct surface; the through-line is consistent
  across instances; the rule has settled enough to name without
  immediate-amendment risk. Future instances are expected to
  extend the convention via additional sub-shapes rather than
  amend its core rule.
