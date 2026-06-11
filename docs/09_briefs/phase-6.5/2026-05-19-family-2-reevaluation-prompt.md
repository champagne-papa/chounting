I'm opening the family 2 re-evaluation arc against origin/staging at
46d3d0e (with 11 unpushed local commits from ARC 3.5). The
audit-fix-verify-surfaces-banking family's re-evaluation trigger was
satisfied empirically during ARC 3.5 Phase A. This arc makes the
re-evaluation decision.

Single-decision arc: graduate, re-defer with refined criteria, or
dismiss. No implementation work. The session closes when the decision
is made and banked.

---

WHAT THIS ARC RESOLVES

The audit-fix-verify-surfaces-banking family was DEFERRED at ARC 3
(commit c754810) with this re-evaluation trigger:

  "A 4th instance from operationally distinct context (different
  substrate, different arc origin, different artifact class) would
  provide the diversity evidence the current set lacks. If a 4th
  instance instead surfaces from another iteratively-built-new-tool
  context, that strengthens the narrower pattern hypothesis but
  doesn't graduate the family as named — would require re-evaluating
  the family's name and scope."

ARC 3.5 Phase A surfaced three unanticipated banking entries (three
prompt-prediction-vs-disk-reality instances + STEP 4 overview-vs-body
drift). The operational context was the codify-convention skill — a
substrate operationally distinct from the friction-pattern-detector
that produced the prior three instances. The trigger criterion is
satisfied empirically; ARC 3.5 explicitly did not act on the
satisfaction, queuing the re-evaluation as this arc.

---

STEP 0: PROMPT RECONCILIATION

This in-context prompt is canonical. If an on-disk prompt exists, read
and reconcile per the ARC 3 / ARC 3.5 precedent. If none exists, write
this prompt to docs/09_briefs/phase-6.5/2026-05-XX-family-2-reevaluation-prompt.md
and commit before STEP 1.

---

CONTEXT (read these from disk before deciding anything)

1. docs/07_governance/friction-journal.md
   The family's full instance history. Read the three original
   instances banked at ARC 3 STEP 1 STOP (lines 13514, 13523, 13707).
   Read the ARC 3 STEP 2 deferral entry (commit c754810; find the
   deferral H2 in the journal). Read ARC 3.5 Phase A's close H2
   (commit b58e5dc) banking the three new instances. Read the
   ARC 3.5 close note (commit e9a536e) documenting the trigger
   satisfaction.

2. docs/04_engineering/conventions/README.md
   §Graduation criteria carries the three-criteria framework codified
   in ARC 3.5 Item 1. §Sub-shape distinctions carries the
   prescriptive/descriptive sub-shape codified in Item 3. Both apply
   to this re-evaluation.

3. docs/04_engineering/conventions/prediction-grounding.md
   The sibling family that graduated at ARC 3 — read it to ground
   the comparison. The family 2 deferral cited family 1's
   prescriptive load-bearing as the contrast that motivated the
   deferral.

4. CLAUDE.md
   Operational discipline.

---

STEP 1: EVIDENCE REVIEW

Read the family's full instance history with care. The family is now
at N=6 with three sub-clusters by operational context:

  Cluster A (friction-pattern-detector substrate, ARC 2 era):
    - Instance 1 (line 13514): ARC 2's heuristic fix surfaced
      embedded-language-quote-collision and redirect-vs-remove
    - Instance 2 (line 13523): ARC 3 STEP 1 verification surfaced
      40-char cap finding
    - Instance 3 (line 13707): ARC 2.5 verification surfaced
      prompt-prediction-vs-disk-reality

  Cluster B (codify-convention skill substrate, ARC 3.5 era):
    - Instance 4 (in ARC 3.5 close H2): "five" framing surfaced
      Obs 2 out of scope
    - Instance 5 (in ARC 3.5 close H2): substrate-vs-mechanism
      resolution-by-assertion in prompt
    - Instance 6 (in ARC 3.5 close H2): framework-not-codified
      structural gap

Per the observation-grain-vs-application-grain rule, Cluster B's
three sub-instances were banked as ONE observation-grain instance
toward prediction-grounding's count. But for THIS family's count,
the question is different: do Cluster B's three sub-instances
collectively constitute the "diverse 4th instance" the trigger named,
or do they constitute three separate fourth-fifth-sixth instances all
from the same operational context (the codify-convention skill)?

That's not a clean question. Surface your reading explicitly.

Read each instance verbatim from disk before reasoning. Don't reason
from summaries.

---

STEP 2: COUNTERFACTUAL CALIBRATION

The ARC 3 deferral reasoning rested on a specific counterfactual:
"would the named pattern (audit-fix-verify arcs surface banking)
still describe what I observed in a context where the audit was on
mature, stable substrate?" The answer at ARC 3 was no — the named
pattern's evidence depended on iteratively-built-new-tools
specifically.

Re-run that counterfactual with Cluster B's new evidence:

(a) Cluster B's substrate (codify-convention skill) is operationally
    distinct from Cluster A's substrate (friction-pattern-detector)
    — different tool, different domain, different operator
    activities.

(b) Cluster B's substrate, however, was itself new at the time of
    ARC 3.5 Phase A — the skill had just been graduated and was
    being exercised for the first time. The iteratively-built-new-
    tool pattern still applies, just at a different surface.

So the question sharpens: is the load-bearing factor *audit-fix-verify
arc shape generally* (Cluster A + Cluster B both support this), or
*iteratively-built-new-tool substrate* (Cluster A + Cluster B both
support this), or *something else entirely* (e.g., audit-fix-verify
arcs operating on artifacts that were recently authored under similar
discipline pressure)?

This is where the call gets hard. Three views:

  View 1 (graduate as named): the family at N=6 with two distinct
  substrates and consistent through-line meets graduation. The named
  pattern accurately describes both clusters. The trigger fired in a
  way the deferral's re-evaluation criterion expected; graduating is
  the disciplined response.

  View 2 (re-defer with refined name): the evidence supports a
  narrower pattern (iteratively-built-new-tool surface banking, not
  audit-fix-verify generally). Graduating under the current name
  would commit prediction-grounding's mistake of overclaiming. The
  family should be re-named and re-deferred until N=3 of the
  narrower pattern surfaces from substrates outside the
  iteratively-built-new-tool category.

  View 3 (graduate with refined name): same evidence as View 2, but
  N=6 is enough to graduate the narrower pattern now rather than
  waiting for further instances of a renamed family. The renaming is
  itself the discipline working.

Engage these three views explicitly. The recommendation comes after.

---

STEP 3: GRADUATION CRITERIA APPLICATION

Apply the three criteria from conventions/README.md §Graduation
criteria to whichever version of the family you're recommending
(named or renamed). Each criterion gets surfaced with its evidence:

  Load-bearing: is this prescriptive (drives operator action) or
  descriptive (helps understanding)? The ARC 3 deferral's load-
  bearing concern — "anticipate banking at verify step" reduces to a
  heads-up — needs re-examination. Has Cluster B's evidence changed
  what the load-bearing discipline would be?

  Generalizable: does the named (or renamed) pattern transcend its
  originating contexts? Two substrates is more than one but not
  obviously enough.

  Stable: has the family's shape settled, or is it still evolving?
  Cluster B's instances may have surfaced sub-shapes the original
  three didn't.

The §Sub-shape distinctions guidance on prescriptive/descriptive
applies here. If the family is still descriptive, the deferral's
original concern stands — graduation is premature regardless of N.

---

STEP 4: RECOMMENDATION AND DECISION

Surface a recommendation: GRADUATE (as-named or renamed),
RE-DEFER (with refined criteria), or DISMISS.

Wait for my decision. The recommendation is yours; the call is mine.

If GRADUATE: STEP 5 invokes codify-convention. Same first-run-of-
new-composition discipline as ARC 3's graduations.

If RE-DEFER: STEP 5 writes a new deferral entry with refined criteria
that don't repeat the ARC 3 deferral's mistakes.

If DISMISS: STEP 5 writes a dismissal entry with reasoning that
preserves the family's banked instances as historical record.

---

STEP 5: APPLY THE DECISION

Per the decision branch. Surface the artifact (codification block,
deferral entry, or dismissal entry) for review before committing.

For GRADUATE: route through codify-convention (now refined by ARC
3.5 Phase A). The skill's first-run observations from ARC 3 are now
canonical; this graduation operates under the formalized field
schema, upstream-artifacts step, and Evaluation basis discipline.

For RE-DEFER: explicit re-evaluation trigger required (don't repeat
the parking-lot failure mode). The new trigger should be specific
enough that future-you can recognize when it fires without
ambiguity.

For DISMISS: preserve the instances' historical significance — they
remain valid observations even if the family doesn't generalize.
Dismissal is final unless N rises further; document the threshold
that would warrant reconsideration.

---

STEP 6: SESSION CLOSE

Bank under today's H2:

1. The decision and its reasoning.

2. Whatever the re-evaluation surfaced about the deferral discipline
   itself. Specifically: did the ARC 3 deferral's re-evaluation
   trigger work? Did it fire cleanly, or did it require interpretation
   to recognize as fired? This is meta-substrate about how to write
   deferral re-evaluation triggers. Bank for future N counting.

3. ARC 3.6 (Stage A refinement) and the push decision remain
   queued. This arc doesn't touch them.

---

THROUGHOUT

- Verify-from-disk at every gate.
- Stop on sanity-check mismatches.
- This is a judgment arc, not an implementation arc. No code touched.
  Only journal entries (and possibly a new convention file) get
  written.
- Codify-while-deciding-not-while-implementing applies to any new
  observations surfaced during this re-evaluation. Bank, don't act on
  inline.
- Don't bundle decisions — surface the recommendation separately
  from the apply step.

Start with STEP 0 (prompt reconciliation), then STEP 1 (evidence
review).
