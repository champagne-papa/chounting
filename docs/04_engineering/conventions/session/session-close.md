# Session-close conventions

Close-time discipline that fires at chunk close, phase close, or
retrospective drafting. These rules govern what verification gates
fire at close, and how close-time discoveries propagate to artifact
preservation discipline.

See [`README.md`](./README.md) for the sub-folder routing rule and
the broader [`../README.md`](../README.md) for the topical routing
rule.

Memory-writes-only Stage 6 firing-shape is currently in repo-root
`CLAUDE.md`; it relocates to this file at Commit D of the v2.2
reorg.

---

## Verification-gate reference-classification (supersession-grep grain)

When grepping post-substantive-supersession for remaining references
to a superseded substrate, classify each hit before producing
"eliminate target-state-mismatch" or "ship as substrate"
recommendation:

- **Current-state references.** The surface still claims the
  superseded substrate is the current shape. *Disposition:*
  eliminate (substrate is no longer canonical).
- **Historical/provenance references.** The surface documents the
  superseded substrate as past state for narrative continuity (e.g.,
  arc summary, retrospective writeup, file-top comment preserving
  the why-this-was-superseded narrative). *Disposition:* preserve
  per ADR-0022 §5 supersession workflow.

**Trigger:** any verification gate that produces `grep` output of
references-to-canonical-state.

**Why:** uniform target-state-uniformity rules over-flag historical /
provenance content and under-distinguish substrate types that
warrant different shipping disciplines.

**Evidence basis (N=1 first-instance precedent):** Phase 6.5 chunk 3
Phase B Check 7 grep at `29e2ba1` close + post-Commit-2 `eab3f5e`
close; 7 reference lines across 4 files (DocumentCard +
cases/route.ts + types.ts + SplitScreenLayout); all 7 correctly
classified as historical/provenance + preserved per ADR-0022 §5.

**Cross-references.**
- ADR-0022 §5 supersession workflow (canonical statement of
  historical / provenance preservation rule).
- Phase 6.5 retrospective §3 Candidate #3.

---
**Origin:**
- First codified: Phase 6.5, 2026-05-17 (Phase 6.5 retrospective
  close)
- Evidence basis: N=1 first-instance precedent (Phase 6.5 chunk 3
  Phase B Check 7 grep at `29e2ba1` + `eab3f5e`)
- Promoted from: Phase 6.5 retrospective §3 Candidate #3
- Cross-references: ADR-0022 §5 supersession workflow; Phase 6.5
  retrospective §3 Candidate #3

---

## Screenshot-gate verification-shape independence (gate design grain)

When designing screenshot gate verification surface for a chunk,
prefer verification-shape independence from upstream broken
substrate where possible. Verification paths that depend on broken
upstream substrate produce gate-noise (deferred shots, partial
passes) that erodes gate confidence.

**Trigger:** any chunk that ships UI changes requiring a screenshot
gate (per CLAUDE.md UI-session screenshot gate convention).

**Discipline rule.** At screenshot gate design grain (typically
during chunk brief drafting or scope-lock cycle), evaluate each
prescribed shot's verification path for dependency on upstream
substrate fragility. Where verification path can avoid upstream-
broken substrate via alternative-path verification (e.g.,
dual-purpose verification covering both current-chunk shots +
prior-chunk deferred shots), prefer the alternative path.

**Why:** verification-shape that depends on broken upstream substrate
produces gate partial-passes + deferred shots that don't resolve
until upstream is fixed; gate confidence erodes when verification
state can't be achieved at chunk close.

**Evidence basis (N=3 graduation across Phase 6.5):** chunk 1
(screenshot gate full pass 5/5 — verification-shape independent of
upstream issues; commit `5a9492b`); chunk 2 (partial pass 2/6 + 4/6
deferred pending Finding A agent orgId session-context bug;
verification-shape dependent on upstream broken substrate; commit
`c5d7e89`); chunk 3 (dual-purpose RESOLVED — chunk 3 multi-batch
drop flow exercises Pattern γ Rule 1 `routeNewTab` independently of
agent emissions; chunk 2 deferred Shots 2-5 incidentally verified;
commit `eab3f5e`).

**Cross-references.**
- CLAUDE.md `### UI-session screenshot gate` (parent convention).
- Phase 6.5 retrospective §3 Candidate #10 + §4 Finding A.

---
**Origin:**
- First codified: Phase 6.5, 2026-05-17 (Phase 6.5 retrospective
  close)
- Evidence basis: N=3 graduation across Phase 6.5 chunks 1, 2, 3
  (commits `5a9492b`, `c5d7e89`, `eab3f5e`)
- Promoted from: Phase 6.5 retrospective §3 Candidate #10
- Cross-references: CLAUDE.md `### UI-session screenshot gate`;
  Phase 6.5 retrospective §3 Candidate #10 + §4 Finding A
