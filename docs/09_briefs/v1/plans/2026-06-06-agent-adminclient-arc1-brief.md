# Agent→adminClient Cleanup, Arc 1 — Record Correction + Class A Fix

**Arc:** the first of two arcs discharging the Wave-6 coda's named
follow-up, opened by the first-hand baseline re-confirmation that
reclassified part of it. **Light cadence** per the advisor's (a) ruling
(brief → read-back → per-task commit with read-back); Class B is split to
its own **full-cadence** arc (the (b) risk-advice, adopted as the
implementer's scope call — the owed correction must not wait on a
non-urgent spine refactor); Class C is record-only.

**Posture:** origin `542fc58f`; lock `agent-adminclient-cleanup` held;
nothing committed this arc. No push without Phil's explicit go.

## 1. Grounded baseline (all first-hand, this kickoff)

12 `adminClient` import sites in `apps/web/src/agent/`, three classes:

- **Class A — shipped regression (Wave-6-owned), 2 sites, bare lint
  errors:** `extraction/reviewPreview.ts:30` (D3 T5, net-new module) +
  `orchestrator/maintenance/sweepStrandedCases.ts:49` (D2.3, net-new
  module). Net-new wave modules ⇒ necessarily wave-introduced
  (advisor-corroborated from headers + wave records).
- **Class B — pre-existing carry-forward, 7 sites, locked at commit
  grain:** imports entered 2026-05-20 (`84991894`, `c4012960`,
  `f0fdeccd`, `4c481a9f`) and 2026-05-30 (`22dc6db7`) — all pre-wave.
  `ingestDocument`, `aiFallbackExtractorBase`, `classifier/aiFallback`,
  `failureClassification`, `stages/dedupByHash`, `stages/runOCR`,
  `stages/shadowRuleEvaluation`.
- **Class C — sanctioned, 3 sites:** explicit
  `eslint-disable-next-line architecture/agent-first-import-boundaries`
  + `TODO(adr-0020-decision-6)` annotations, verified present and
  identical at `e571ceb5`: `memory/orgContextManager`,
  `orchestrator/index`, `orchestrator/loadOrCreateSession`.

The coda's claim splits by grain: "lint/build red predates the wave" —
TRUE at job grain (identical per-job split at `e571ceb5`);
"pre-existing, not wave-introduced" — FALSE at violation grain (Class A).
The correction is owed and goes first.

## 2. T1 — Record correction (governance commit, FIRST — the (c) precondition)

Docs-only, additive, provenance-preserving:

1. **Close report** (`2026-06-05-wave-6-d8-close-report.md` §6 coda
   block): dated correction note appended — job-grain TRUE /
   violation-grain FALSE, the two Class A sites named, pointer to this
   brief. The original text stays byte-intact above it.
2. **CURRENT_STATE.md** Wave-6 section: the "Pre-existing `lint`/`build`
   reds verified not-wave-introduced" line gets the same dated
   correction appended in place (additive parenthetical, original
   wording preserved as the record of what was believed at close).
3. **Friction-journal entry:** the catch itself — a relayed-claim
   cleared-on-named-backstop corrected by the named first-hand
   follow-up; the discipline working end to end (implementer owns the
   overbroad authorship, advisor owned the backstop clearance, the
   "start from confirmed" follow-up caught it). Candidate linkage to the
   verify-from-disk / prediction-grounding family is PROPOSED in the
   entry; **N is adjudicated at the entry against the actual journal,
   not pre-stamped here** (the advisor's content caveat, honored).

## 3. T2 — Class A fix (light cadence; semantics-preservation constraints named)

Fix shape per ADR-0020 Appendix A (agent → contracts → services → db):
hoist each module's `adminClient` touches into `services/`-layer
functions the agent imports. **The constraint that governs the hoist
(the advisor's read-back focus): semantics preserved, not just calls
relocated** —

- `reviewPreview.ts`: its reads are the IDOR-root **org-verified** reads
  per its header — the hoisted service functions must carry the same
  org-scoping guarantees, not widen them.
- `sweepStrandedCases.ts`: runs **system-actor** context — the hoist
  must not alter the actor posture or route writes through a different
  authorization path.

Evidence at read-back: per-site before/after call-chain mapping; the
D2.3 + D3 + D7 suites green (byte-unchanged unless a named test edit is
surfaced); `eslint src/agent` error count 9→7 with Class B's seven the
exact survivors; `agent:validate` + `typecheck` green. One commit,
line-by-line read-back (it crosses the layer line).

## 4. Fences

- No Class B edits (own arc, full cadence, queued); no Class C edits
  (record-only); no behavior or security-posture change; no migrations;
  no push without Phil. Adjacent discoveries get carry-forward framing
  per ratified-contract-scope.

## 5. Out of this arc (queued)

- **Arc 2 — Class B** (7 sites incl. the pipeline spine), full cadence,
  brief-gated; opens from this arc's confirmed baseline.
- Class C disposition (revisit the sanctioned disables when their files
  are naturally edited, per their own TODO wording).

*Drafted 2026-06-06 at the arc kickoff. Surfaced for read-back — HOLD:
no edit, no commit until cleared.*
