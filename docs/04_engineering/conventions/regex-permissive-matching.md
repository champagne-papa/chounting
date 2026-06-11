# Regex permissive-matching cost classes

Design-time discipline for regex patterns matching against non-trivial
input populations. Paired with
[`prediction-grounding.md`](./prediction-grounding.md) for the
resolution-time discipline (audit-not-tune).

## The rule

When designing a regex with permissive matching, anticipate that cost
classes will emerge beyond the simple noise/signal split documented in
classical regex-design tradeoffs. Permissive matching against non-
trivial input populations systematically produces failure modes —
over-match into similar-shaped strings, character-class incompleteness
collapsing distinguishable subgroups, priority-ordered preemption
hiding real signal — that the classical noise-class framing doesn't
capture.

At design time: enumerate plausible cost classes for your regex
against your actual input substrate. The cost classes below are
observed exemplars, not exhaustive; new permissive-matching contexts
may surface additional shapes.

When a cost class surfaces during use, the resolution discipline is
documented in [`prediction-grounding.md`](./prediction-grounding.md)
— audit the actual data rather than tuning a parameter from
intuition.

## Observed cost-class sub-shapes

The three sub-shapes below were observed across N=3 distinct instances
in the friction-pattern-detector's bucket-extraction logic. Each has a
known general analog in regex permissive matching beyond this
project's substrate; the analogs ground the exemplars as domain-
general rather than script-specific.

### 1. Over-match into similar-shaped strings

Permissive shape captures matches into populations that look
structurally similar to the intended population but are semantically
distinct.

- **Observed instance:** B1's `\([^()[:space:]]+\)` matched
  `(sustained)` and `(see ADR-...)` as bucket IDs; they're
  status-annotation parentheticals, not buckets.
- **General analog:** URL regex over-matching into file paths that
  share `://` shape; email regex over-matching into `mailto:` links;
  version-number regex over-matching into IP addresses.
- **Mitigation patterns:** operator-filter (accept as noise-class if
  the cost per occurrence is low and the volume is bounded); shape-
  based discriminator (reject by structural signal like trailing
  whitespace, character-class membership, or wrapping characters);
  empirical denylist if the noise population is small and bounded.

### 2. Character-class incompleteness causing distinguishable-subgroup collapse

A character class that excludes some characters causes matches to
terminate at the excluded character, collapsing distinguishable
subgroups under a common prefix.

- **Observed instance:** B2's `[A-Z][A-Z0-9-]+[A-Z0-9]` excludes
  lowercase, so `S29a`/`S29b`/`S29c` all match as bare `S29`.
  Distinguishable subgroups (a/b/c variants) lose their tail at the
  missing-character boundary.
- **General analog:** Hostname regex missing `_` collapses
  `user_name.example.com` to `name.example.com`; version regex
  missing `-` collapses `1.0.0-alpha` to `1.0.0`; identifier regex
  excluding `$` collapses `user$temp` at the `$` boundary.
- **Mitigation patterns:** extend the character class to admit the
  missing characters, grounded by an audit of which characters
  actually appear in the input (per
  [`prediction-grounding.md`](./prediction-grounding.md)); or accept
  the collapse as operator-disambiguation cost if the collapsed group
  is small enough to inspect by hand.

### 3. Priority-ordered preemption hiding real signal

A regex evaluated with priority ordering (longest-match, leftmost-
match, first-rule-wins) captures noise at high priority and prevents
lower-priority rules from accessing the real signal further along.
The operator's filtering action against the noise can also discard
the masked real signal — the signal is hidden under a noise row, not
absent.

- **Observed instance:** B1's permissive match captured
  `(sustained)` (noise) and preempted B2's access to a real bucket
  ID in the same window. The operator who discarded the
  `(sustained)` T1 row also lost the line's real T1.5 candidate;
  the signal was hidden under the noise row, not absent.
- **General analog:** Tokenizer matching `if` before `iffy` masks
  `iffy` tokens; XML parser matching `<a>` before `<abbr>` shadows
  `<abbr>` tags; precedence-ordered rule engines where an early
  high-priority rule fires on data a later more-specific rule would
  have handled.
- **Mitigation patterns:** structural shape rejects (require the
  high-priority match to satisfy additional shape constraints);
  fall-through-on-rejection control flow (priority-rejected match
  continues to lower-priority rules rather than terminating);
  audit-grounded discriminator per
  [`prediction-grounding.md`](./prediction-grounding.md).

## Sibling pattern: prediction-grounding

The resolution-time discipline for cost classes (audit the actual
data rather than tuning a parameter from intuition) is codified
separately in
[`prediction-grounding.md`](./prediction-grounding.md). This
convention is paired with that one — design-time enumeration here;
resolution-time empirical grounding there. Both apply when working
with permissive-matching regexes. Encountering one of the two
conventions, look for the other.

---

**Origin:**

- First codified: Phase 6.5, 2026-05-19
- Evidence basis: N=3 distinct cost classes (over-match,
  character-class collapse, priority-preemption) observed in the
  friction-pattern-detector's bucket-extraction logic; banked at
  friction-journal lines 13314, 13321, 13332 (all commit `39c8a3c`).
  An additional fourth banking instance at line 13380 (commit
  `bcbcacc`) recorded the audit-grounded resolution of the third
  cost class; that fourth instance is **meta to the family**
  (resolution-about-the-third-class, not a fourth distinct cost
  class) and arguably belongs more naturally under
  [`prediction-grounding.md`](./prediction-grounding.md)'s family
  scope. The cross-family overlap is banked as an ARC 3 first-run
  observation for future taxonomy refinement (substrate-vs-mechanism
  family-misattribution).
- Promoted from: friction-journal family `regex-permissive-cost-class`
  (banked as N=4; load-bearing evidence is **N=3 distinct cost
  classes**, with instance 4 framed as resolution-meta per above).
- Cross-references:
  - [`prediction-grounding.md`](./prediction-grounding.md) (paired
    convention: the resolution-time discipline).
  - `docs/09_briefs/phase-6.5/2026-05-17-friction-pattern-detector-design.md`
    §Bucket extraction (the spec where the three cost classes were
    discovered, documented via ARC 2 and ARC 2.5 amendments).
  - `scripts/friction-journal-tally.sh` extract_bucket() function
    (the regex site where the cost classes manifested).

**Evaluation basis** — added inline at ARC 3 graduation (commit
`a10480d`) following prediction-grounding.md's precedent. The
field was formalized at `docs/04_engineering/conventions/README.md`
§Graduation criteria in ARC 3.5 (commit `8b241ee`). This file's
Evaluation basis was the second precedent-setting application.

- **Load-bearing (prescriptive).** The convention generates operator
  action at design time: "enumerate plausible cost classes for your
  regex against your actual input substrate." Each sub-shape carries
  concrete mitigation patterns. The convention also references
  prediction-grounding for fix-time action. Future regex work in the
  project (any tool using permissive matching against semi-structured
  input) benefits from naming the cost classes explicitly rather than
  re-discovering each one.
- **Generalizable.** The three observed cost classes have known
  general analogs in regex permissive matching beyond this script's
  domain (per the analog cells in each sub-shape above). Evidence
  shape: domain-general analog cases rather than family 1's project-
  internal surface diversity. Different evidence shape, equivalent
  strength for the generalize-able claim.
- **Stable.** Principle + non-exhaustive exemplars shape (same
  precedent as `prediction-grounding.md`). The principle is stable;
  the enumeration is presented as currently-observed, not exhaustive.
  Amendment pattern when a new cost class surfaces: extend the
  enumeration; principle stays.
