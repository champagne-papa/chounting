# Phase 6.5 codification arc sequence retrospective

**Status.** Closes the eight-arc recursion sequence (ARC 2 → ARC
2.5 → ARC 3 → ARC 3.5 → family 2 re-evaluation →
substrate-vs-mechanism re-evaluation → ARC 3.6 →
prompt-author-compression graduation evaluation) that ran during
and after Phase 6.5's chunk-3 close. Two intermediate pushes
shipped arcs 1-3 (d549ef9 → 46d3d0e); this retrospective ships
with the final push closing arcs 4-8 (46d3d0e → this push's HEAD).

**Surface-precedence note.** This retrospective is T1 (arc-scope
war diary). The substantive surfaces shipped during the sequence
land at T4 (conventions/README.md graduation-criteria framework,
sub-shape distinctions, Open Questions section, family-tag
assignment convention, prose convention; conventions/prediction-
grounding.md; conventions/regex-permissive-matching.md;
codify-convention SKILL.md amendments) plus T1
(friction-journal banking entries per arc). No T3 (ADR)
amendments shipped from this sequence; the meta-discipline work
didn't warrant ADR amendment.

## 1. Scope of the sequence

The sequence opened from friction-pattern-detector first-
implementation work surfacing 7 first-instance observations
across 3 families (commit `d549ef9`; the seed evidence). ARC 2
resolved B1 signal-hiding (script-level fix + spec amendment).
ARC 2.5 resolved B1 cap (cap-removal + shape rejects). ARC 3 ran
the first family-graduation evaluation, producing two graduations
and one deferral. Subsequent arcs (3.5, family 2 re-eval,
substrate-vs-mechanism re-eval, 3.6, prompt-author-compression)
emerged as substrate exposed at each prior arc's close — the
recursion was substrate-driven, not pre-planned.

Eight arcs over ~3 weeks (late 2026-04 → 2026-05-18). ~37 commits
total (12 in prior push d549ef9..46d3d0e; 25 in this push
46d3d0e..HEAD pre-retrospective).

## 2. What was produced

**Codified conventions (T4):**

1. `conventions/prediction-grounding.md` — discipline for
   encoding predictions and parameter values; graduated at ARC 3
   from `caveat-prediction-vs-empirical-resolution` family at N=3
   distinct artifact-class instances.
2. `conventions/regex-permissive-matching.md` — design-time
   discipline for permissive regex; graduated at ARC 3 from
   `regex-permissive-cost-class` family at N=3 distinct cost
   classes.
3. `conventions/README.md` §Graduation criteria framework —
   three-criteria framework (load-bearing / generalizable /
   stable) formalized at ARC 3.5 Item 1. Promoted from ARC 3
   prompt's inline DECISION FRAMEWORK section to canonical
   referent.
4. `conventions/README.md` §Sub-shape distinctions §Load-bearing
   prescriptive/descriptive — codified at ARC 3.5 Item 3. The
   sub-shape was load-bearing for family 2's DEFER decision at
   ARC 3.
5. `conventions/README.md` §Open codification questions — durable
   section for deferred meta-decisions, codified at ARC 3.5 Item
   4. First entry (substrate-vs-mechanism family-tag precedence)
   opened then closed within the sequence — the section's
   open → resolved lifecycle exercised cleanly at single-entry
   scale.
6. `conventions/README.md` §Codification convention: family-tag
   assignment at banking and graduation-time review — codified at
   substrate-vs-mechanism resolution. Substrate-tagging at
   banking time + mechanism-tagging as graduation-time
   discriminator.
7. `.claude/skills/codify-convention/SKILL.md` §Output
   specification artifact 3 prose convention — codified at
   substrate-vs-mechanism resolution. Codified-family references
   in prose use file paths rather than family-tag names. Paired
   sibling to (6).

**Skill spec refinements (T4-adjacent):**

- `codify-convention` SKILL.md — Evaluation basis field
  formalized (ARC 3.5 Item 2); upstream-artifacts cross-reference
  step added to output spec (ARC 3.5 Item 5); STEP 4
  overview-vs-body alignment after multi-amendment changes
  (ARC 3.5 STEP 4 follow-up). The skill is now in a
  self-consistent state after its first operational exercise.

**Re-deferred families with explicit triggers:**

1. `evolving-substrate-verify-surfaces-banking` (renamed from
   `audit-fix-verify-surfaces-banking` at family 2 re-eval).
   Substrate-grain N=2 < threshold N=3. Trigger: instance from a
   third iteratively-built-new-tool substrate distinct from
   friction-pattern-detector and codify-convention.
2. `prompt-author-compression` (re-deferred at the eighth arc).
   Substrate-grain N=1 < threshold N=3. Two-step trigger:
   substrate-distinct instance brings count to N=2; second
   substrate-distinct instance graduates at N=3. Null-findings
   anti-parking-lot trigger with bivalence caveat.

**Resolved Open Question:**

- Substrate-vs-mechanism family-tag precedence (banked at ARC 3.5
  Item 4, resolved at substrate-vs-mechanism re-eval arc).
  Sub-shape split into two structurally different sub-shapes,
  each with its own resolution path. Status: Resolved 2026-05-19.

**Refined detector:**

- Stage A graduation check in `scripts/friction-journal-tally.sh`
  refined at ARC 3.6 (awk-based bullet-block discriminator).
  False-positive resolved: cross-reference body mentions no
  longer conflated with codification footers.

**Friction-journal banking:** approximately 11 H2 entries
covering the sequence (one per arc plus inter-arc dispositions
and STEP 6 meta-observation banking).

## 3. The recursive shape and its closure

The sequence exhibited substrate-driven recursion. Each arc-close
surfaced findings that warranted their own subsequent arc. Five
intermediate transitions followed the pattern:

- ARC 2 → ARC 2.5 (B1 cap surfaced at ARC 2 close)
- ARC 3 → ARC 3.5 (codify-convention skill refinements surfaced
  at ARC 3 STEP 2)
- ARC 3.5 → family 2 re-evaluation (N=4 trigger satisfaction
  surfaced at ARC 3.5 Phase A close)
- family 2 → substrate-vs-mechanism re-evaluation (Open Question
  trigger fired at family 2 STEP 6 banking)
- substrate-vs-mechanism → ARC 3.6 (Stage A script-side fix
  inherited as queued)

ARC 3.6 close queued the prompt-author-compression graduation
evaluation as the eighth arc. The prompt-author-compression arc
closed at observation-grain N=4 with re-deferral (substrate-grain
N=1 < threshold N=3). **No new arc queued.** The recursion
closed.

The first non-recursing close in the sequence. Three-hypothesis
underdetermination for the closure cause is banked at the eighth
arc's STEP 6 (substrate maturation / low-hanging-fruit exhaustion
/ arc-scope happenstance). N=1; future arc-closes provide
discriminating evidence.

## 4. The discipline applied against itself

The sequence repeatedly exercised disciplines on their own
codification work. The shape worth naming:

- ARC 3 evaluated the first family graduations using the
  framework that ARC 3.5 would later promote to canonical (the
  framework existed only in ARC 3's prompt; ARC 3.5 promoted it).
- ARC 3.5 STEP 2 audit caught the framework-not-codified
  structural gap. The discipline (audit-fix-verify) noticed its
  own missing canonical surface.
- Family 2 re-evaluation applied the Stable criterion in its
  first operational use — and the Stable criterion's
  "rename-recent excluded" sub-clause excluded family 2's
  graduation when family 2 was being renamed.
- Substrate-vs-mechanism resolution surfaced sub-shape splitting
  as the productive failure mode of the Open Question framing —
  the resolution mechanism caught that the question's framing
  was too broad.
- Prompt-author-compression evaluation caught its own pattern
  firing in its own prompt at STEP 1 (the fourth-instance
  banking) — discipline operating self-reflexively.
- This push prompt (the ninth-arc-that-isn't) contains its own
  pattern firing (the §5 banking below).

The sequence's pattern: disciplines that catch their own gaps
surfaced improvements that further-strengthened the disciplines.
The arc-by-arc recursion was one expression of this. Whether this
pattern operates beyond meta-discipline work is unevidenced; the
sequence demonstrates it in this context.

## 5. N=5 prompt-author-compression — banking for future re-evaluation substrate

The push prompt for this arc (the one opening the eight-arc close
push) contained two compressions of canonical-source text caught
at this arc's STEP 1 verify-from-disk:

- Push-readiness gate condition (3) framed as `pnpm adr:check`
  rather than CLAUDE.md's literal "Governance closeout"
  (retrospective + friction-journal + conventions). `pnpm
  adr:check` is a tool-level subset of condition (2)'s ADR
  reconciliation aspect, not condition (3).
- "ARC 3 close (commit d549ef9 → 46d3d0e push)" — d549ef9 is the
  previous origin/staging tip (FROM of the previous push range),
  not ARC 3 close itself (4486cb1 within that range).
  Operationally serviceable framing (the push-range bounds are
  correct), but inaccurate attribution.

A third application-grain compression caught at the retrospective
revision step: a "Three of the five" enumeration in the revised
§5 prose where the actual evidence supported "Two of the five."
Caught at retrospective-review STEP 1 verify-from-disk during
commit-readiness verification.

Per the just-shipped graduation trigger (commit `9e8dc71`), all
three compressions are from this operator on this project —
substrate-grain remains N=1. Trigger does not fire. Per the
application-grain framing applied to ARC 3.6's three compressions,
all three compressions in this push session are from one
prompt-authoring session — **one observation-grain instance with
three application-grain sub-instances**. The candidate's
observation-grain count revises from N=4 to N=5.

**Rate-firing observation (future re-evaluation substrate).**
N=5 over ~3 weeks is the cumulative count; the more operationally
significant observation is that the firing rate per prompt-
authoring session has not abated. Two of the five prompt-authoring
sessions in this sequence have fired the pattern at multiple
application-grain sub-instances within one session (ARC 3.6 prompt
with three compressions; this push session with three
compressions, the third caught in revision of this retrospective
itself). The within-session firing rate has not abated; if
anything, the within-session sub-instance counts have stabilized
at the higher end (3 each) for the two multi-firing sessions.
When the graduation trigger or anti-parking-lot reconsideration
trigger eventually fires, the future re-evaluation should engage
rate-of-firing (instances per session) alongside the cumulative
substrate-grain count — high within-session firing rate may carry
interpretive weight even when substrate-grain is below threshold.

The within-session firing in retrospective-revision text about
firing-rate is itself meta-significant: author-attention to the
pattern's reliability of firing does not appear to reduce firing
rate. Future re-evaluation should consider this when weighing
whether the pattern is correctable by surface attention or
operates below the level of explicit awareness.

The rate-firing observation is potentially framework-relevant
beyond this candidate — future graduation evaluations of any
candidate whose evidence base concentrates within one substrate
may benefit from engaging rate-of-firing as a supplementary
signal to substrate-grain count. Banked here as future-evaluation
substrate; do not pre-commit to framework amendment.

Per codify-while-deciding-not-while-implementing: banked here as
future-re-evaluation substrate; the re-deferral entry at commit
`9e8dc71` is not amended inline.

## 6. Future substrate beyond the candidate

- ARC 3.5 close H2 Observation 4 — "implicit-precondition
  assumption" as candidate sub-shape refinement for
  prediction-grounding. Banked at N=1.
- Substrate-vs-mechanism re-eval — prose convention case-coverage
  gap (fourth-case observation). Banked at N=1.
- Substrate-vs-mechanism re-eval — §Codification thresholds
  section acquiring scope beyond its name. Banked at N=1; rename
  trigger if pattern recurs.
- Family 2 re-eval close — three plausible family framings for
  the compression instances (don't pre-commit to taxonomy).
- Prompt-author-compression STEP 6 — sub-shape amendment of a
  codified convention requires the same evidence base as separate
  graduation. Framework refinement candidate for README
  §Graduation criteria DISMISS-when-captured-elsewhere. Banked at
  N=1.
- Prompt-author-compression STEP 6 — date-convention change for
  H2 headers (actual system date going forward). N=1
  documentation discipline.
- Recursion-closure cause analysis — three-hypothesis
  underdetermination at N=1; future arc-closes provide
  discriminating evidence.

## 7. Push provenance

§7 below is forward-referential: it describes the push that ships
this retrospective. By the time this section is read on remote,
the push has completed. Pre-push HEAD captured in the STEP 4
banking commit.

This retrospective + its commit + the push closing the sequence
(46d3d0e → this push's HEAD, 25 commits + retrospective commit
+ STEP 4 banking commit). Push-readiness gate met:

- Condition (1) `pnpm test` 1148/1148 cache-validated (the 25
  pre-retrospective commits touch only docs/, scripts/,
  .claude/skills/ — zero apps/web/ test scope; turbo cache-hit
  reflects actual test state for HEAD).
- Condition (2) doc-sync reconciled: no schema/code changes; ADRs
  reconciled via `pnpm adr:check` (22 ADRs scanned, no errors);
  arc-affected governance docs internally consistent
  (conventions/README.md routing + topical files index,
  substrate-vs-mechanism Open Question marked Resolved 2026-05-19,
  codify-convention SKILL.md preamble aligned with body).
- Condition (3) this retrospective satisfies governance closeout
  for the meta-discipline arc sequence (per interpretation (ii)
  at push-arc onset: writing the synthesizing retrospective
  explicitly rather than treating the eight per-arc session-close
  H3s as implicit retrospective).
