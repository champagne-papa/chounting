## Arc A — Phase 0-1.1 Control Foundations (2026-04-24 closeout)

- 2026-04-24 NOTE   Arc A shipped across 14 commits plus 2
  discipline-meta commits; 12 steps (0 through 12b); held set 16
  commits. Retrospective: `docs/07_governance/retrospectives/
  arc-A-retrospective.md`. Final commit `202b6cc` (Step 12b
  polish-sweep).
- 2026-04-24 NOTE   Historical-count archaeology pattern named
  (retrospective §3 Pattern 1): header count "20 Phase 0-1.1 +
  Arc A invariants" preserves the Phase 1.1 closeout count (18)
  and attributes the Arc A delta (+2). Single fire; named for
  future Arc recurrence.
- 2026-04-24 NOTE   UI-session screenshot gate delegation
  (retrospective §3 Pattern 2) fired 6 times across Arc A
  (Steps 7, 8a, 8b, 9b, 10b, 12b-D). Past codification
  threshold. CLAUDE.md rule HELD for founder ratification —
  no obvious placement section in the current CLAUDE.md shape.
  See retrospective §5 "Friction" for the placement question.
- 2026-04-24 WRONG  Step 10a D10-D resume-prompt recommended
  "atomic approveRun" semantics. Orchestrator spec-check of
  `adminClient()` return type revealed the data layer
  materializes a fresh REST-over-HTTP Supabase client per call
  — each `.from(...)` is an independent PostgREST request in
  its own short-lived DB transaction. Cross-call atomicity
  isn't a capability of the data layer. Flipped to best-effort
  sequential + incident-log orphan guard (`incident_type =
  'recurring_run_orphaned'` at ERROR level on UPDATE-after-post
  failure) + dual orphan-guard on retry (status AND
  journal_entry_id). INV-RECURRING-001 holds because template
  balance is enforced at the template layer, not at the
  approval path. Wsl-claude would have implemented literal
  atomicity-via-RPC without the flip — adding a second Law-2
  entry point that diverged from `journalEntryService.post()`'s
  sole-creation-path role. Atomicity hardening filed as Phase 2
  obligation (12a `obligations.md` subsection).
- 2026-04-24 WRONG  Step 11 D11-C brief math was
  "ServiceErrorCode 19 → 24" (Phase 1.1 baseline + 5 net-new
  codes from the brief). Orchestrator grep of actual
  `ServiceError.ts` union showed 53 → 56. Brief was authored
  against a Phase 1.1 snapshot before Phase 1.5 added 34 codes
  (Org profile, Org addresses, User profiles, Invitations,
  Membership lifecycle, Agent). D11-C flipped from "trust brief
  math" to "count actual union." HTTP-status-table expansion
  deferred from Step 11 to Step 12a to avoid 37-row scope
  blow-out in doc-sync. Pattern-name candidate: briefs decay
  against the living codebase.
- 2026-04-24 CLUNKY Step 12a item 25: 37 new per-code catalog
  entries at full template depth (Class / Thrown by / Meaning /
  Caller action / HTTP status / Phase 2 evolution — ~15-30
  lines each) would have 6x'd 12a scope. Wsl-claude chose
  condensed template (Class / Thrown by / Meaning / HTTP
  status) with an explicit asymmetry note in the Code catalog
  paragraph. Retroactive orchestrator ratification (Pattern 9
  — scope-adjacent judgment within bounded tasks). Full-depth
  expansion filed as optional item 26.
- 2026-04-24 NOTE   Step 12b wsl-claude hallucinate-and-retract
  fired as designed (retrospective §3 Pattern 5). Prompt rule:
  "if fewer than 4 full-suite failures close, stop and report
  three options." Post-edit count: 2 of 4 closed. Wsl-claude
  stopped, reported Options A/B/C with trade-offs. Ratified
  Option A (ship partial, file new item). Positive pattern —
  non-silent partial-close with explicit trade-off surface for
  founder ratification.
- 2026-04-24 WRONG  Step 12b wsl-claude initial diagnosis
  framed residual failures as "cross-file Cash contention"
  (language implying concurrent writes). Orchestrator
  mechanism-verification against filesystem caught that vitest
  runs test files sequentially within a single process and the
  actual mechanism was sequential + historical-dated
  window-function interleaving. Decision outcome (Option A)
  held; item 27 fix-shape reframed from "concurrency
  primitives" to "migrate to less-polluted account (1300
  precedent)." Pattern 4 — orchestrator mechanism-verification
  of wsl-claude diagnoses — paired with Pattern 5 to form the
  self-correction loop.
- 2026-04-24 NOTE   File-top comment staleness pattern fired
  twice in Arc A (retrospective §3 Pattern 8): item 23
  (`AdjustmentForm.tsx` post-LineEditor-extraction) and Step
  12b test-file headers describing pre-rewrite "empty-seed
  shape pin" assertions. Approaching 3-fire codification
  threshold. Candidate convention: commit-time review of
  file-top comments for any file whose body was edited.
- 2026-04-24 WANT   Arc A's 12 steps needed context-budget-
  driven splits twice (Step 10 → 10a/10b data/UI;
  Step 12 → 12a/12b closeout/polish-sweep). Orchestrator
  foresight about wsl-claude context usage is required because
  orchestrator has no direct view into wsl-claude's
  mid-session budget. Refinement candidate: wsl-claude reports
  context budget at step-close (not just session-end) so
  orchestrator can plan splits proactively. Open question
  forwarded to next arc.
- 2026-04-24 CLUNKY Session-init.sh forgotten at Step 12b start;
  caught post-hoc via the [coordination] warning on commit. No
  hard failure this time but session-lock discipline was absent
  for that commit. Mitigation candidate if recurs: wsl-claude
  refuses to proceed past Step 0 without session-init, rather
  than emitting a warning at commit time.
- 2026-04-24 WANT   Item 27 filed: `accountLedgerService` tests
  3/6 running-balance window-function interleaving under shared-
  DB full-suite (retrospective §3 Pattern 3). Fix shape
  formulaic: migrate to less-polluted account (1300 Short-term
  Investments, per `adjustmentEntry.test.ts` precedent).
  Deferred; Arc A closed at 485/487 full-suite per
  isolation-contract framing (in-code gate-check command
  `pnpm db:reset:clean && pnpm test
  tests/integration/accountLedgerService.test.ts` passes 6/6).
- 2026-04-24 NOTE   Arc A D12b-D screenshot gate (3 shots for
  items 13 + 14) passed clean against fresh db:reset:clean +
  db:seed:all state. Items 13 (`AccountLedgerView` padding +
  thead unification) and 14 (`reversed_by` IIFE symmetric
  clickability) visually verified.
- 2026-04-24 NOTE   Step 10b `<LineEditor />` extraction: the
  prompt's generic-typed contract `UseFieldArrayReturn
  <TFieldValues, 'lines'>` didn't compile across the three
  consumer forms (`'lines'` didn't uniformly satisfy
  `ArrayPath<TFieldValues>`). Wsl-claude used the prompt-
  preauthorized fallback (load-bearing `any` at the public API
  boundary) rather than halting. Pattern-name candidate:
  load-bearing `any` at cross-consumer extraction boundaries.
  Single fire; below codification threshold but worth tracking
  — the shape will recur whenever generic types break across
  multiple consumers in the same extraction session.
- 2026-04-24 NOTE   Stash-and-rerun regression attribution
  (retrospective §3 Pattern 7) fired twice (Steps 10a, 10b).
  Both uses confirmed full-suite failures were pre-existing
  rather than in-progress regressions by stashing changes,
  running targeted tests on HEAD, observing the same failure
  pattern, unstashing. Approaching 3-fire codification
  threshold.
- 2026-04-24 NOTE   Wsl-claude scope-adjacent judgment
  (retrospective §3 Pattern 9) fired twice in 12a — the
  `obligations.md` subsection second bullet (per-code catalog
  drift-prevention rule) and the ADR-0010 cross-refs bullet
  richer-than-prescribed expansion. Both retroactively
  ratified. Safety valve: orchestrator review step. Below
  codification threshold at 2 fires but worth naming so future
  reviews explicitly check for coherent-but-unprompted
  additions rather than treating them as scope violations by
  default.

- 2026-04-25 NOTE   Item 27 validation sequence revealed a
  gate-check self-pollution pattern: running
  `accountLedgerService.test.ts` in isolation first, then the
  full suite, masked the fix (first full-suite run was 485/487
  due to accumulated state from the isolation run — the same
  test's own prior-run posts to 1100/1200 polluted the next
  full-suite run's baseline-and-delta assertions). Post
  `pnpm db:reset:clean` the full-suite run was 487/487. Future
  fragility-fix sessions that gate via isolation-run-then-full-
  suite must `db:reset:clean` between modes. Naming candidate:
  "gate-check self-pollution." Fire count 1; below codification
  threshold but worth logging so a future session doesn't
  re-discover the rabbit hole.

- 2026-04-25 NOTE   Three-condition push readiness framework
  codified in `CLAUDE.md` (Session execution conventions
  section, sibling to the UI-session screenshot gate). Framework
  had been operating tacitly across Arc A; this entry marks its
  transition from tacit-convention to written-rule. Provenance:
  Arc A retrospective §5 meta-observations on the three-role
  workflow + push-decision brief conversation 2026-04-24/25.
  Fired once per arc (Arc A); codification threshold not
  applicable to operational-standard rules (distinct from
  pattern-observation rules which use the 3-fire threshold).


