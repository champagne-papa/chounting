I'm opening the prompt-author-compression graduation evaluation arc
against origin/staging at 46d3d0e (22 unpushed local commits from
prior arcs, OR pushed already depending on your sequencing choice).
The arc was queued at ARC 3.6 close (commit 5b45004) with the
prompt-author-compression pattern banked at observation-grain N=3,
graduation criteria looking met within the current evidence base
but with explicit evidence-limit caveats.

Single-decision arc: GRADUATE the candidate, RE-DEFER with refined
criteria, or DISMISS. No implementation work unless graduation
requires it. The session closes when the decision is made and
banked.

---

WHAT THIS ARC RESOLVES

ARC 3.6 close H3 #2 (friction-journal at commit 5b45004) banked
the prompt-author-compression pattern as a codification candidate
at observation-grain N=3:

  Three consecutive prompts authored at session-close (ARC 3.5,
  family 2 re-evaluation, ARC 3.6) each shipped with at least one
  compression of canonical-source text that the receiving session's
  STEP 1 verify-from-disk discipline caught.

The candidate's evidence-base limits were explicitly named:

  - Substrate-grain N=1 in operator/project dimension: three
    instances are all from the same prompt-author on the same
    project.
  - Stability across operationally distinct conditions (different
    time pressure, different context, different operator) not yet
    evidenced.

These limits are analogous to the renamed family
evolving-substrate-verify-surfaces-banking's substrate-grain
limit at family 2 re-evaluation (commit e6297f1) — and the
disciplined response there was to rename and re-defer rather than
graduate. This arc engages whether the same disciplined response
applies here, or whether the evidence base for prompt-author-
compression supports a different call.

---

STEP 0: PROMPT RECONCILIATION

This in-context prompt is canonical. If an on-disk prompt exists,
reconcile per prior arcs' precedent. If not, write to
docs/09_briefs/phase-6.5/2026-05-XX-prompt-author-compression-prompt.md
and commit before STEP 1.

---

CONTEXT (read these from disk before deciding anything)

1. docs/07_governance/friction-journal.md
   Find the ARC 3.6 close H2 (commit 5b45004). The candidate's
   evidence is in H3 #2, including the three instances cited at
   commits b58e5dc (ARC 3.5 Phase A close), 2aa8585 (family 2
   re-evaluation close), and the ARC 3.6 prompt itself.

   Read each cited banking entry verbatim. Don't reason from
   summaries. Each compression instance has its own substantive
   shape that matters for evaluation.

2. docs/04_engineering/conventions/README.md
   §Graduation criteria carries the three-criteria framework.
   §Sub-shape distinctions carries the prescriptive/descriptive
   distinction. Both apply to this evaluation.

3. docs/04_engineering/conventions/prediction-grounding.md
   The sibling family already codified. The prompt-author-
   compression pattern is structurally a sub-shape of prediction-
   grounding (predictions about canonical-source text encoded
   without verification). Read it to ground the relationship.

4. docs/07_governance/friction-journal.md (family 2 re-evaluation
   close, commit 2aa8585; substrate-vs-mechanism resolution,
   commit c0a9f28)
   These are the precedent re-evaluations that engaged similar
   evidence-limit questions. Read both for the discipline
   precedent.

5. CLAUDE.md
   Operational discipline.

---

STEP 1: EVIDENCE REVIEW

Read each of the three banked instances verbatim. For each, surface:

- What was the canonical-source text being compressed?
- What compression occurred (specific mis-reading, mis-counting,
  mis-attribution)?
- What was the cost of the compression caught at the receiving
  session — minor (corrected at STEP 1; no downstream effect),
  moderate (changed the arc's framing or path), or major (would
  have produced a wrong decision if not caught)?

The cost analysis is load-bearing. Three minor compressions might
suggest the pattern is more aesthetic than load-bearing; three
moderate-or-major compressions confirm the pattern's
operational significance.

Note specifically: the third instance (ARC 3.6 prompt) contained
three distinct compressions within one prompt. Is this:

(a) A sharper diagnosis of the same observation-grain instance
    (one prompt-authoring session in compromised mode produced
    multiple compressions), or
(b) Three application-grain sub-instances of a single observation,
    or
(c) Evidence that the pattern is escalating in frequency-per-
    prompt over time?

This affects the evidence base's interpretation. (a) and (b) treat
ARC 3.6's three compressions as one observation; (c) treats them
as three.

---

STEP 2: COUNTERFACTUAL CALIBRATION

The candidate's named generalization: "applies to any prompt-
writer who references canonical sources."

Apply the same counterfactual the family 2 re-evaluation arc used:

(a) Counterfactual: prompt-authoring by a different operator (not
    me/this assistant) on the same project. Would the same
    compression mechanism fire?

(b) Counterfactual: prompt-authoring by me on a different project.
    Would the same compression mechanism fire?

(c) Counterfactual: prompt-authoring on different artifact types
    (not session-handoff prompts but, e.g., briefing notes for
    external audiences). Would the same compression mechanism fire?

Each counterfactual is hypothetical — we don't have empirical
evidence for them. Engage them as reasoning about plausibility
rather than as evidence, but be honest that they're plausibility-
reasoning, not data.

The substrate-grain question: how many distinct prompt-authors and
how many distinct projects does the evidence span? Answer: one of
each. Below the README's N=3 codification threshold at substrate-
grain.

This is the same shape of finding that DEFERRED family 2 (the
audit-fix-verify-surfaces-banking family was at observation-grain
N=3 but substrate-grain N=2; the disciplined response was rename
+ re-defer, then later substrate-grain N=2 still insufficient at
family 2 re-evaluation).

---

STEP 3: DECISION SPACE

Three live options:

(a) **GRADUATE the named candidate.** Codify prompt-author-
    compression as a convention. Risk: same as family 2's would
    have been — overclaiming generalization beyond the evidence
    base. The substrate-grain limit is real; graduating on
    observation-grain N=3 alone repeats the failure mode the
    family 2 re-evaluation arc resolved by re-deferring.

(b) **RE-DEFER with refined criteria.** Preserves the candidate's
    structural recognition while waiting for cross-author or
    cross-project evidence to confirm generalization. The trigger
    should be specific enough to fire cleanly when it should
    (lessons from family 2's trigger compression carry forward).

(c) **DISMISS as artifact-bound.** The pattern is artifact-bound
    to one prompt-author on one project; it doesn't generalize.
    Dismissal preserves the three banked instances as historical
    record but recognizes the pattern won't transcend its origin.

A fourth option may emerge: rename and re-defer, analogous to
family 2's rename. The current name "prompt-author-compression"
implies general prompt-authoring; the evidence supports a narrower
name (e.g., "session-handoff-prompt-from-same-author-compression").
Whether this narrower-name path is viable depends on whether the
narrower pattern is itself sufficiently evidenced or whether even
the narrower version needs more evidence.

Engage all three (or four) options explicitly. The decision is
mine; the recommendation is yours.

---

STEP 4: RECOMMENDATION AND DECISION

Surface a recommendation with reasoning. Wait for my decision.

If GRADUATE or rename+GRADUATE: STEP 5 invokes codify-convention
(its third operational exercise after ARC 3's two graduations and
the substrate-vs-mechanism resolution's two amendments).

If RE-DEFER (with or without rename): STEP 5 writes a new deferral
entry with refined trigger.

If DISMISS: STEP 5 writes a dismissal entry preserving the
instances as historical record.

---

STEP 5: APPLY THE DECISION

Per the decision branch. Surface the artifact for review before
committing.

For GRADUATE: route through codify-convention per the now-refined
skill specification (Evaluation basis field formalized; upstream-
artifacts step; prose convention for codified-family references).
The destination is likely a new convention file (the pattern is
substantive enough to warrant its own file rather than amendment
to an existing one). Sibling routing into CLAUDE.md and possibly
writing-plans or other prompt-authoring surfaces.

For RE-DEFER: explicit re-evaluation trigger that addresses the
parking-lot risk (event-based or specific-condition trigger;
lessons from family 2's trigger compression carry forward).
Document the trigger's cleaning shape — specifically, what would
constitute a fourth instance from operationally distinct
conditions (different operator, different project, different
artifact class).

For DISMISS: preserve instances; document threshold that would
warrant reconsideration if it changes.

---

STEP 6: SESSION CLOSE

Bank under today's H2:

1. The decision and its reasoning.

2. Whatever this re-evaluation surfaced about prediction-grounding's
   own discipline applied at meta-grain. The prompt-author-
   compression pattern is structurally a sub-shape of prediction-
   grounding (predictions about canonical-source text). Engaging it
   as a candidate for its own convention vs. as an instance of
   prediction-grounding's existing convention is itself a meta-
   discipline question. Bank whatever you observed.

3. Queued state post-arc: push remains. If the recursion finally
   closes (no new arcs queued by this arc), note that explicitly —
   the non-recursing close was the empirical question I've been
   asking each arc-close for several sessions.

---

THROUGHOUT

- Verify-from-disk at every gate.
- Stop on sanity-check mismatches.
- This is a judgment arc, not an implementation arc unless
  graduation requires implementation. Mostly journal entries and
  possibly one new convention file.
- Codify-while-deciding-not-while-implementing applies to any
  observations surfaced during this re-evaluation. Bank, don't act
  on inline.
- The current prompt itself is a session-handoff prompt authored
  by the same operator as the prior three instances. Be alert to
  the possibility that THIS prompt contains compressions of
  canonical-source text. STEP 1 verify-from-disk will catch them
  if they exist; if it does, the catching itself is N=4 of the
  candidate's pattern firing.

Start with STEP 0 (prompt reconciliation), then STEP 1 (evidence
review).
