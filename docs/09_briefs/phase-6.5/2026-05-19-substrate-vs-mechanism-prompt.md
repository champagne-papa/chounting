I'm opening the substrate-vs-mechanism Open Question re-evaluation
arc against origin/staging at 46d3d0e (14 unpushed local commits
from prior arcs). The Open Question's re-evaluation trigger fired
during the family 2 re-evaluation arc's STEP 6 banking (commit
2aa8585). This arc makes the resolution decision.

Single-decision arc: resolve to substrate-tagging, resolve to
mechanism-tagging, re-defer with refined trigger, or recognize as
undecidable and pick a default convention. No implementation work
unless resolution requires it. The session closes when the decision
is made and banked.

---

WHAT THIS ARC RESOLVES

The substrate-vs-mechanism family-tag precedence Open Question lives
at docs/04_engineering/conventions/README.md §Open codification
questions. It was banked at ARC 3.5 (commit 0fbb863) as a deferred
meta-decision with both positions documented and this re-evaluation
trigger:

  "The next family-misattribution instance surfacing in the
  friction-journal. When the discipline gap fires again (whether
  substrate-tagged or mechanism-tagged), that instance is the
  moment to make the call with grounded evidence about which kind
  of misattribution is more frequent and more costly."

Family 2 re-evaluation's STEP 6 banking (commit 2aa8585) surfaced
the second instance: prose mentions of codified families in a
banking entry's prose risk being counted as new instances by the
detector's Stage A grep, depending on whether the tag-mentioning
prose follows substrate-tagging (counts) or mechanism-tagging
(doesn't count). That's a tagging-precedence question firing on
codified-family references rather than on uncodified-family tagging.

Two instances now exist. The trigger fired. This arc decides.

---

STEP 0: PROMPT RECONCILIATION

This in-context prompt is canonical. If an on-disk prompt exists,
reconcile per ARC 3 / ARC 3.5 / family 2 re-evaluation precedent.
If none exists, write to docs/09_briefs/phase-6.5/2026-05-XX-substrate-vs-mechanism-prompt.md
and commit before STEP 1.

---

CONTEXT (read these from disk before deciding anything)

1. docs/04_engineering/conventions/README.md
   §Open codification questions contains the substrate-vs-mechanism
   entry verbatim. Read both Position A (substrate-tagging) and
   Position B (mechanism-tagging) with care; the entry's framing is
   the substrate for the decision.

2. docs/07_governance/friction-journal.md
   Instance 1: ARC 3 first-run observation 4 (family-misattribution
   by substrate vs mechanism, regex-permissive-cost-class instance
   4's resolution mechanism actually being prediction-grounding's
   family-shape). Find via the original ARC 3 close H2 at the line
   number that's stable in commit history (around 14050 at original
   banking; may have shifted with downstream banking).

   Instance 2: Family 2 re-evaluation STEP 6 banking (commit
   2aa8585) — the H3 about three compression instances surfaced by
   STEP 1's verify-from-disk. Specifically the "Relationship to
   prediction-grounding family" section, which surfaces the
   codified-family-tag-mention issue.

3. docs/04_engineering/conventions/prediction-grounding.md
   The codified family at the center of both instances. Both
   instances are about whether prose connecting other observations
   to this family count as new instances of it.

4. .claude/skills/codify-convention/SKILL.md
   Item 3 of ARC 3.5 documented the prescriptive/descriptive
   sub-shape distinction; the codify-convention skill's evaluation
   framework will apply here too if the resolution graduates to a
   codified convention.

5. CLAUDE.md
   Operational discipline.

---

STEP 1: EVIDENCE REVIEW

Read both instances verbatim from disk. Don't reason from summaries.

For each instance, surface:
- What was banked (substrate-tagged or mechanism-tagged in practice)
- Which tagging the discipline would have wanted (substrate or
  mechanism)
- What the cost of the misattribution actually was — visible
  drift, hidden drift, or no operational consequence

The cost question is load-bearing. The Open Question's
re-evaluation framing was "which kind of misattribution is more
frequent and more costly." Two instances with high cost might
resolve differently from two instances with low cost.

---

STEP 2: COUNTERFACTUAL CALIBRATION

The Open Question encoded two positions:

**Position A (substrate-tagging):** Tag by where the issue
manifested. Argument: matches operator's first-pass attention
(substrate is what the operator was working on). Existing precedent
leans this way.

**Position B (mechanism-tagging):** Tag by the discipline the
observation instantiates. Argument: families should fire when the
mechanism recurs, not when the substrate happens to. Produces
taxonomies that generalize correctly when patterns cross substrates.

For each instance, run the counterfactual: had this been tagged
under the other position, what would have changed? Specifically:

- Would the detector have surfaced it differently?
- Would future operators have found it under the right family
  search?
- Would the codification eventually land in the right convention
  file?

The point is to ground the cost analysis empirically. If both
positions produce essentially the same operational outcome for both
instances, the question may be more aesthetic than load-bearing. If
the positions produce different outcomes, the cost difference
reveals which is operationally correct.

Surface the cost analysis explicitly before any recommendation.

---

STEP 3: RECOGNIZE THE FOUR POSSIBLE OUTCOMES

The arc has a wider decision space than family 2's. Four outcomes:

**(a) Resolve to Position A (substrate-tagging).** Document the
resolution in conventions/README.md (move from §Open codification
questions to a new resolved section or to the relevant
canonical-tagging convention). Update the codify-convention skill
if the tagging discipline lives there.

**(b) Resolve to Position B (mechanism-tagging).** Same shape as
(a) but the other direction. May require updating existing journal
entries that were tagged by substrate — or not, depending on the
disposition for historical entries.

**(c) Re-defer with refined trigger.** Two instances might
genuinely be insufficient to resolve. The refined trigger should
be more specific than "the next instance" — something like "an
instance where the substrate-vs-mechanism difference produces
substantively different operational outcomes" — to avoid the
parking-lot mode the first trigger arguably had.

**(d) Recognize as undecidable; pick a default by convention.**
Some questions don't resolve through accumulation. If both
positions are defensible and the cost difference is small or
context-dependent, the discipline is to pick a default explicitly
(by fiat, with reasoning) rather than pretend more evidence will
resolve it. This isn't dismissal — the question stays meaningfully
open at the principle level, but a default tagging convention
operates for practical purposes.

The four outcomes have different downstream consequences. (a) and
(b) close the question. (c) keeps it open. (d) closes it by
operational fiat while preserving the principled openness.

Engage all four explicitly before recommending.

---

STEP 4: RECOMMENDATION AND DECISION

Surface a recommendation with reasoning. Wait for my decision. The
recommendation is yours; the call is mine.

The graduation criteria from conventions/README.md §Graduation
criteria apply if the resolution graduates to a codified
convention (which (a), (b), and (d) all do at different levels of
commitment).

---

STEP 5: APPLY THE DECISION

Per the decision branch:

(a) or (b): write the resolution to the relevant canonical
surface, remove the entry from §Open codification questions (with
forward-pointer per the Open codification questions section's
lifecycle prose — "Entries marked Resolved are historical record"),
and update any other surfaces that depend on the resolution.

(c): write a new deferral entry with refined trigger that
addresses the parking-lot risk; update the §Open codification
questions entry's Status from Open to Open-with-refined-trigger
(or rewrite the entry's trigger section verbatim).

(d): write the default-convention resolution. The §Open
codification questions entry stays as historical record but the
operational default is now documented. The entry's status becomes
something like "Open at principle level; default operational
convention documented at [surface]."

---

STEP 6: SESSION CLOSE

Bank under today's H2:

1. The decision and its reasoning.

2. Whatever this re-evaluation surfaced about the Open Question
   discipline itself. Specifically: did the first trigger (banked
   at ARC 3.5) work? Did it fire cleanly and unambiguously when
   the second instance appeared? Was the trigger satisfaction
   recognizable to the operator without interpretation? This is
   meta-substrate about how to write Open Question re-evaluation
   triggers.

3. ARC 3.6 (Stage A refinement) and push remain queued. This arc
   doesn't touch them. The queued state after this arc closes:
   ARC 3.6 + push, with this arc's resolution affecting how Stage
   A's refinement might handle tag discrimination.

---

THROUGHOUT

- Verify-from-disk at every gate.
- Stop on sanity-check mismatches.
- This is a judgment arc, not an implementation arc (unless the
  decision requires implementation). Mostly journal entries and
  possibly one README amendment.
- Codify-while-deciding-not-while-implementing applies to any
  observations surfaced during this re-evaluation. Bank, don't
  act on inline.
- Don't bundle decisions — surface the recommendation separately
  from the apply step.

Start with STEP 0, then STEP 1.
