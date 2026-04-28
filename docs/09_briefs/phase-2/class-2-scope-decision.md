---
title: Class 2 fix-stack scope decision
status: closed (partial collapse)
decided: 2026-04-28
parent_sha: f362f0e (S20 Commit 2)
---

# Class 2 fix-stack scope decision

## Verdict

Class 2 fix-stack collapses as a separate Phase 2 workstream per S20
M1 paid validation evidence. Shape 13 (the canonical Class 2 staled
productive case from C7 EC-13) emitted productively across both S20
paid runs — no staling, no orphan rows, model self-flagged
`tentative: true` on the genuinely ambiguous gross-vs-net discount
method per §4a surgery's tentative-on-ambiguous discipline. H3b-ii
alone is sufficient on the canonical case; the model-cognitive-
intervention scope contemplated for a separate Class 2 workstream
(per OI-3 scoping doc §6 Part 5) is not warranted.

## Reasoning

The OI-3 scoping doc §6 Part 5 hypothesis-discrimination dimension
framed Class 2's separate-workstream scope as contingent on H3 being
independently live (model-cognitive intervention scope: fine-tuning,
prompt-cached examples, selection-behavior alignment). S20's shape
13 evidence discriminates cleanly: H3b-ii alone is sufficient on the
canonical case, so the separate workstream's scope is not warranted
and the work it would have authored doesn't need authoring. Shape
15 (canonical Class 2 staled tentative case, untried in S20 due to
per-call ceiling halt at shape 13 run 2) tests a structurally
distinct ambiguity surface — allowance-vs-direct-write-off
treatment-recognition, distinct from shape 13's gross-vs-net
method-choice — and its evidence is meaningful for OI-3 M1
completeness under caching-unblocked conditions, not for
Class-2-as-separate-workstream scoping.

## Follow-on queue

- Shape 15 + shape 20 re-validation as OI-3 M1 completeness under
  caching-unblocked conditions. Existing harness at
  `scripts/oi3-m1-validation.ts` (commit `31166fb`); re-fire with
  `--shapes=15,20` after caching enablement ships.
- Cross-shape generalization (does H3b-ii alone hold for shape 15's
  allowance-vs-write-off treatment-recognition ambiguity?) is
  empirical follow-on, not hypothesis-discrimination scoping. The
  default expectation is H3b-alone unless evidence to the contrary.

## Citations

- S20 friction-journal run summary:
  `docs/07_governance/friction-journal.md` lines 45-52 (commit
  `f362f0e`).
- OI-3 scoping doc §6 Part 5 (hypothesis-discrimination dimension)
  + §1 Class 2 vs OI-3 relationship framing:
  `docs/09_briefs/phase-1.2/oi-3-class-2-fix-stack-scoping.md`
  (commit `161bff8`).
- Phase 2 obligations §1 Class 2 framing (status claim updated in
  the same commit landing this artifact):
  `docs/09_briefs/phase-2/obligations.md`.
- EC-2 prompt set Entries 13 (multi-line split with discount) and
  15 (bad-debt allowance bump): `docs/07_governance/ec-2-prompt-set.md`
  lines 319-355.
