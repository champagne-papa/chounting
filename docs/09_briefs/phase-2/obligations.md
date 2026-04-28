# Phase 2 Obligations

Carry-forward queue from Phase 1.2 close (C12, 2026-04-26). Sibling
to `docs/09_briefs/phase-1.2/obligations.md` (Phase 1.1's
carry-forward queue, the shape reference for this file).

Phase 1.2 closed under Reading B: OI-3 / Class 2 fix-stack work
extends into Phase 2 rather than gating Phase 1.2 close. The four
durable Phase 1.2 closeout artifacts remain on `origin/staging` as
Phase 2's inheritance state:

- Section (p) C11 retrospective on C7 EC-13 — commit `f221bab`
- OI-3 Class 2 fix-stack scoping doc — commit `161bff8`
- Section (o) C7 closeout deliverables (Meta A application) —
  commit `52a63f0`
- Conventions catalog Meta A + Meta B + Convention #11 rename —
  commit `d2b2f50`

This document enumerates everything those artifacts surface for
Phase 2 plus deferred items from earlier Phase 1.2 sessions. Items
are organized by category, not by priority; Phase 2 brief authors
sequence from this queue per Phase 2 scope decisions.

---

## 1. Named workstreams (the two scoped Phase 2 openings)

### OI-3 fix-stack implementation

Scoping doc:
`docs/09_briefs/phase-1.2/oi-3-class-2-fix-stack-scoping.md` on
commit `161bff8`. Full content inherited verbatim — this section
is a one-paragraph pointer plus workstream-status claim, not a
re-derivation.

Mechanism identified: prompt has zero instructional surface on
`canvas_directive` emission (structural absence, not inadequacy)
plus `validTemplateIdsSection` selection rubric that routes
ambiguity-perception to a no-directive template
(`agent.response.natural`). Fix surface bounded to three prompt-
text locations: `STRUCTURED_RESPONSE_CONTRACT` in
`_sharedSections.ts`, `respondToUser` tool description, and the
`validTemplateIdsSection` rubric. Methodology partitioned: M3
baseline (free) → prompt-surgery (fix) → M1 post-fix validation
(paid, $0.50 ceiling) → M2 Soft-9-pattern integration test.
Hypothesis treatment: primary H3b-ii (instructional clarity-
absence) is the fix target; secondary H3 (model-cognitive
complexity-perception) is the fix-validation question observable
post-fix. Implementation chat opens against the scoping doc and
resolves the §3c sub-decision (four-option enumeration on
tentative-state representation) as its first action.

**Status claim:** scoped, not implemented. Phase 2 implementation
chat opens against `161bff8` as inheritance.

### Class 2 fix-stack implementation

Class 2 row-without-card systematic reproduction surfaced in C7
EC-13 (friction-journal section (o), commit `52a63f0`). Two
staled entries (Entry 13 multi-line split with discount + Entry
15 contra-asset adjusting) at low turn counts on a fresh
`agent_session`. C11's H3 hypothesis (agent reaches for
`agent.response.natural` template when it perceives entry as
needing prose explanation, omitting `canvas_directive`) is the
authored target. Sample N=4 not conclusive on whether H3 holds
independently of the H3b-ii instructional layer; the OI-3
fix-stack's M1 post-fix validation is the discriminating
evidence (per OI-3 scoping doc §6 Part 5, hypothesis-
discrimination dimension).

**Class 2 vs OI-3 relationship:** OI-3's fix-stack targets the
H3b-ii instructional layer (prompt-surgery). If H3b-ii alone is
the mechanism, OI-3 closes Class 2 by extension and a separate
Class 2 fix-stack is not needed. If H3 is independently live,
the Class 2 workstream extends OI-3 with model-cognitive
intervention (fine-tuning, prompt-cached examples,
selection-behavior alignment). Phase 2 brief authors evaluate
M1 results before scoping a separate Class 2 workstream.

**Status claim:** Class 2 fix-stack collapsed per S20 M1 evidence;
shape 15 + 20 re-validation queued as OI-3 M1 completeness under
caching-unblocked conditions. See
`docs/09_briefs/phase-2/class-2-scope-decision.md` (commit landing
this update) for the verdict and citations.

---

## 2. Deferred exit criteria

From the 27-EC matrix (`docs/09_briefs/phase-1.2/ec-matrix.md`)
post-C12 update. Matrix dispositions reference durable evidence;
this section is a queue for Phase 2 to drive each remaining
DEFERRED to MET.

### Paid-API gates (5 ECs)

- **EC-2** (PARTIAL — 10/20). Phase E delivered 10 productive
  EC-2 entries through the agent (entries 1-11 chunk-1 minus
  surface-test byproducts and Entry 12 Class 2 halt). C7 EC-13
  attempted entries 12-15 with 2 productive (12, 14) and 2 Class
  2 staled (13, 15). 8 entries untried (16-20 chunk-2 + Entry 12
  retry + Entry 13 retry). Carries to Phase 2 post-OI-3 + Class 2
  fix-stack. Re-run gated on a fresh `agent_session` (context
  accumulation is a known confound for Class 2).
- **EC-9** (DEFERRED). 20 entries + 10 friction entries (behavioral
  assertion). Phase E delivered 10 productive entries against the
  20-entry portion; the 10-friction-entries dimension is
  untouched. Phase 2 needs both EC-2 continuation and a separate
  friction-behavioral run.
- **EC-10** (DEFERRED — latency target <30s). Phase E and C7 per-
  call latencies captured (Phase D 74.8s → 87.7s → 103.3s for
  3-call orchestration; O3 ~71s wall-clock paste-to-card-render).
  EC-10 verification is target-meeting under sustained load,
  which neither Phase E nor C7 ran. Per O3 closeout: target may
  need revisiting against expanded-prompt baseline.
- **EC-11** (DEFERRED — cost-per-entry). Per-entry cost data is
  durable: Phase E inventory + C7 cost rollup at section (o)
  lines 6996-7003 totaling $0.4913 across 6 line items per the
  C7 closeout deliverable D2 cost trichotomy ($0.2163
  verification + $0.2750 discovery). EC-11's verification
  mechanism per spec is "dashboard aggregate data" (operator-
  side, outside this commit's authoring scope).
- **EC-13** (PARTIAL — verified OI-2 fix-stack scope; Class 2
  untested). C7 EC-13 verified OI-2 end-to-end on relative-date
  resolution (gate A short-circuit at $0/129ms on Entry 14),
  Site 1 pre-Zod injection, and Site 2 card post-fill. Class 2
  fix-stack scope (OI-3 doc `161bff8`) untested as workstream
  not yet implemented.

### Non-paid-API DEFERREDs (4 ECs)

- **EC-15** (DEFERRED — clarification-path-retry-isolation test).
  No dedicated test. Phase 2: add explicit test asserting
  clarification path doesn't increment Q13 retry budget.
- **EC-16** (DEFERRED — mid-conversation API failure). No
  dedicated test. Phase 2: add explicit regression test for
  no-orphan + stale-handling under Anthropic API failure.
- **EC-14** (DEFERRED — ProposedEntryCard screenshot-committed
  portion). Render verified via O3 + C7 ambient runs; no
  committed screenshot artifact in repo.
- **EC-27** (DEFERRED — ProposedEntryCard schema migration
  screenshot-committed portion). Same shape as EC-14; potentially
  shared screenshot-commit pass with EC-14.

---

## 3. Investigation queue

Items that need design-pass before implementation.

- **Mode B org_id confusion** — Session 7.1.2 finding rolled into
  Session 8 sub-brief; tool-selection gap likely in
  `listJournalEntries` description. Session 8 C8 commit
  `bd5cd75` shipped a partial fix (Mode B listJournalEntries
  description amendment + TOOL_SELECTION_HINTS in personas), but
  the test-scope limitation acknowledged in commit body —
  "guards plumbing, not real-Claude prompt-contract behavior."
  Behavioral validation deferred to C7 EC-13 adversarial run,
  which closed PARTIAL on OI-2 + Class 2 surfaces without
  exercising the org_id confusion vector. Phase 2: re-evaluate
  whether C8's prompt-amendment is sufficient or whether
  additional adversarial-test coverage is needed.
- **Structural-response-invalid investigation** — Phase E C6
  EC-2 actual run surfaced AGENT_STRUCTURED_RESPONSE_INVALID
  reproduced ≥2 times on Entry 12 with identical signatures.
  Hypothesis: context-window saturation at high turn count;
  tool_input clean on both attempts so failure is in
  second-half-of-orchestrator-loop. Distinct from OI-2 and from
  Class 2. Phase 2 mitigation surface includes session-rotation
  thresholds, context-window monitoring, retry-budget
  calibration, session-state liveness checks.
- **Edit-path source-flip review** — Session 8 EC-2 partial run
  Phase D finding. Edit flow currently calls
  `/api/agent/reject` then inserts a manual JE, flipping
  `source` from `agent` to `manual` in the audit trail. Phase
  1.3+ disposition: preserve `source='agent'` with edited flag
  vs. current flip to manual. Tradeoff between audit-trail
  fidelity and edit-path simplicity.
- **Latency-not-caching paradox** — Phase E finding #6 documented
  post credit-top-up Entries 2-7 showing 12-16s warm-state
  latency with `cache_read_input_tokens=0`. Either (a)
  prompt-caching not firing on the orchestrator's call shape, or
  (b) latency floor is independent of cache state. Phase 2
  investigation: instrument cache-read attribution and
  cross-reference against per-entry latency.

---

## 4. Sensible-accounting candidates (Phase 1.3+ refinements)

From Phase E §c narrative. These are agent-behavior refinements
that surfaced as observations during EC-2 runs but were not
behavior bugs — agent did the available right thing, but the
domain has more sophisticated handling that's worth shipping.

- **Path-1 default prompt nudge** — for tax-inclusive corp-card
  compound entries, the agent currently splits naively. Path-1
  default would route through a tax-aware compound-entry path.
- **`bookPayrollEntry` employer-side burden tool** — Phase E
  Entry 6 multi-line payroll surfaced the employer-side burden
  modeling gap. Tool would handle employer EI/CPP/WCB
  contributions distinct from gross deductions.
- **Prepaid-amortization scheduling proactive ask** — when the
  agent posts a prepaid expense, prompt the operator about
  amortization schedule rather than leaving it as a future
  manual touch.

---

## 5. CoA gaps and fixture refinements

### 5 COA gaps surfaced in Phase D EC-2 partial run (2026-04-23)

Domain mismatch (operating-company semantics in EC-2 prompts vs.
holding-company COA in dev fixture). Agent correctly used
best-available substitution in each case; no fabrication, no
hallucination. Listed for Phase 1.3+ fixture refinement.

- No Rent Expense account
- No Accounts Receivable account
- No Credit Card Payable account
- No GST/PST/HST/ITC tax accounts
- No Consulting/Service Revenue account

### Three roadmap items per Phase E finding N10

- More industry CoA templates beyond Real Estate (current dev
  fixture is real-estate-specific)
- CoA customization UX (add/edit/delete accounts) — currently
  the COA is template-frozen at org creation
- Quick-start → customize flow for operators who want to start
  from a template and refine

### Future-revisit queue from EC-2 run 2026-04-23

- Re-run Entry 3 when COA has tax accounts (current PASS-clean
  is COA-constraint-correct but doesn't demonstrate tax-aware
  accounting)
- Address 5 COA gaps in Phase 1.3+ fixture refinement: extend
  fixture to operating-co semantics OR revise EC-2 prompt set
  to holding-co semantics OR document COA-aware verdict
  protocol

---

## 6. Architectural follow-ups

Items that surfaced across Phase 1.2 with known fix shapes but
deferred from the phase scope.

- **Multi-stage approval state machine** — External CTO Review
  Tier 1 from Agent Autonomy Design Sprint. Replaces ad-hoc
  `ai_actions.status` chain. Required before introducing
  third-tier approval routing for high-risk entries.
- **Account purpose tagging** — `account_link`-style lookup for
  semantic account categorization beyond `account_type`. Enables
  prompt-time account-suggestion narrowing without hardcoded
  account_code references.
- **Source ↔ JE linkage** (INV-SUBLEDGER-LINK-001) +
  **subsidiary tie-out** (INV-SUBLEDGER-TIEOUT-001) per
  ADR-0008. Required before adding subsidiary ledger modules
  (AP/AR, fixed assets) to avoid orphaned subledger rows that
  don't link to the GL.
- **Period-boundary checkpointing** (INV-CHECKPOINT-001) —
  required before introducing soft close vs. hard close
  semantics (Q21 deferral from Phase 1.1 obligations).
- **Currencies lookup table + FK** — Phase 1.2 carries currencies
  as enum strings in `journal_entries.currency_code`. FK to
  currencies table is required before multi-currency wiring
  (Phase 4 per PLAN.md §8b).
- **Caching enablement** — per Phase E finding N9, orchestrator
  doesn't set `cache_control` on Anthropic API calls; prompt-
  builder architecture is cache-friendly in shape but the
  attribute isn't wired. First step toward Phase 1.2 obligations
  doc's "Prompt caching configuration details" deferred decision.
  **Update 2026-04-28:** within-turn caching shipped at S22
  (`856dcc7`); -32% per-flow cost drop measured at `cceb725`.
  Cross-turn caching (next architectural lift) remains Phase 2+
  scope per the S22 commit body — requires prompt reordering to
  move per-turn variable content (temporal context,
  canvas_context) out of the cached prefix; non-trivial because
  internal references like "the Current date above" couple
  variable content to position. Targeted savings: closer to
  the brief's projected -58%.
- **Conversation shape Zod validation on load (QW-06 / UF-007
  carry-forward from Phase 1.2 audit action plan)** — replace
  the `as unknown[]` cast at
  `src/agent/orchestrator/loadOrCreateSession.ts:194` with
  explicit Zod validation of the persisted `agent_sessions.conversation`
  JSONB against an `Anthropic.Messages.Message[]` schema. On
  validation failure: log warning, initialize empty history.
  **Sequencing constraint (decided 2026-04-28, brief-creation
  session post-audit-brief-creation):** lands ALONGSIDE OR AFTER
  cross-turn caching enablement above. Rationale: SDK message
  shape is a moving target — the within-turn caching enablement
  already required `system: string → TextBlockParam[]` adaptation;
  cross-turn caching will require additional prompt reordering
  that may further reshape persisted conversation JSONB.
  Committing to a Zod schema before cross-turn caching forces a
  re-revision shortly thereafter. Source: `audits/phase-1.2/action-plan.md`
  §Quick Wins QW-06 (with deferral note); `audits/phase-1.2/unified-findings.md`
  UF-007. Reclassified from Phase 1.2 Day-1 fix-stack on
  2026-04-28 per operator decision.
- **Dead `CanvasDirective` variant cleanup** — `ai_action_review_queue`
  per Session 8 C1 closeout note. Variant exists in the
  discriminated union but no code path emits it. Cleanup is
  removal-of-dead-code, not feature work.
- **`approveRun` atomicity hardening** (carry-forward from Arc A
  Step 12 queue item 19). PL/pgSQL RPC `approve_recurring_run`
  applied uniformly across the service layer if Phase 2 judges
  atomicity valuable for the scheduler path.
- **Recurring-journal automated scheduler (pg-boss)** — brief
  §2.2 Phase 2 scope. Arc A shipped the data model and manual
  path; the scheduler trigger that fires `generateRun` on
  template cadence and the `auto_post` flag consumption are the
  Phase 2 additions.
- **Per-code `ServiceErrorCode` catalog drift-prevention** —
  Phase 1.2 and beyond should extend
  `ledger_truth_model.md` §Structured Error Contracts in-step
  with each new code addition rather than accumulating drift.
  Carry-forward from Arc A Step 12a obligations subsection.
- **`accountLedgerService` running-balance fragility (Arc A
  item 27)** — fix shape known: migrate affected tests to a
  less-polluted account (1300 Short-term Investments
  precedent). Currently 2 tests failing (tests 3 and 6) under
  shared-DB full-suite; clean under `pnpm db:reset:clean`
  baseline. Resolution unblocks "clean full-suite green"
  framing if Phase 2 push-readiness requires it.

---

## 7. Convention split-trigger watch

Items at codification thresholds that fire if a future occurrence
matches.

- **Meta A axis-level decomposition** at N=1 (halt-policy
  outcome / runtime-execution-discipline ↔ scoping-completeness).
  Per-sub-type N=2 split trigger live. A second axis-level
  instance fires the trigger and graduates axis-level
  decomposition to its own convention.
- **Meta A hypothesis-discrimination dimension** at N=1 (OI-3
  scoping doc §7a Part 5 — H3b-alone / H3-also-live /
  over-correction / inconclusive). Per-sub-type N=2 split
  trigger live. A second run authoring this dimension fires the
  trigger.
- **Meta B sub-type N=2 split trigger** live across all three
  sub-types (policy-rule interactions, downstream-component
  dependencies, telemetry-salience dependencies). The Meta B
  sub-type rename from "invariant-pipeline dependencies" to
  "downstream-component dependencies" landed on N=1 evidence
  (OI-3 §7c contract-shape observation); a third structurally
  distinct mechanism under any sub-type fires the split.
- **Meta B meta-level N=5 review trigger** live. If the
  cross-dependency type list grows to five sub-types, re-evaluate
  whether the meta-shape still holds across them or has
  fragmented into a grab-bag.
- **Convention #10 EC-direction sub-track** at 7 datapoints.
  Sub-track-internal numbering EC-#1 through EC-#7. Codification
  threshold for sub-sub-track introduction not yet defined;
  current shape is qualified-inference framing for EC-claim
  shapes.
- **Convention #10 retraction sub-track** at 17 cumulative
  through C11 (12 prior + 4 in C7 + 1 in C11). No structural
  amendment fired since the sub-track structure amendment in
  S8-0424/0425 Phase E.

---

## 8. Process observations not yet at codification threshold

Items at 1-2 datapoints. Listed for visibility; codification
fires on a third occurrence.

- **Held-working-tree discipline across multi-commit threads** —
  Session 7.1 Commit 5 (canvas context injection) held
  uncommitted across the entire 7.1 thread and landed last after
  EC-19 manual verification cleared. One datapoint; pattern is
  "deliberately defer commit X until verification gate Y
  passes, holding working tree dirty in the interim."
- **Audit-table-row authoring convention candidate** — S13
  closeout finding. The `(this commit)` phrasing in
  governance-audit table rows silently goes stale on every
  subsequent edit. S13 hit this with the original Convention #11
  row; correction was inline (`(this commit)` → `f935efc`).
  Convention candidate: cite the actual commit hash from the
  start, not `(this commit)`. One datapoint; codification fires
  on a second occurrence.
- **Layered-attribution-masking in forcing functions** — Phase E
  C6 cross-commit pattern. When a forcing function (e.g., a
  paid-API gate) surfaces multiple findings, cross-commit
  attribution can mask which commit introduced which finding
  if the friction-journal entry doesn't explicitly partition.
  Two datapoints (C6 EC-2 actual run + C7 EC-13). Threshold-met-
  pending-third.
- **Relay-visibility asymmetry** — Phase D EC-2 partial run
  finding. Three datapoints across Phase D; approaching threshold
  per CURRENT_STATE Phase D §3 codification candidates.
- **External-consultant-accepts-WSL-Claude-derivations-without-
  independent-verification** — Phase D finding. Two datapoints;
  threshold-met-pending-third.
- **Plan-time latency forecasts from small-n trends** — Phase D
  finding. One datapoint; structural insight rather than
  recurrence.
- **Standing-instructions-produce-reach-for-behavior** — Phase D
  finding (Playwright reach). One datapoint.
- **Arc-compounding-without-tripwire** — Phase D / C10 + EC-2
  pattern. Two datapoints; codification candidate.
- **Day-clock compression vs. design-complexity calibration** —
  Session 7 retrospective open question. Multiple datapoints
  across Sessions 7, 7.1, 8 but the calibration heuristic isn't
  named yet.
- **Verify-state vs. infer-from-action discipline** — Phase C
  O3 closeout three-instance pattern. Codified as "Preservation
  and Ambiguity Gates" + "Erase-to-Clean vs. Document-to-Verify"
  conventions in `a610e0e`; named here for completeness as the
  source observation.
- **Metabolic-load formulation of small arcs** — Session 8
  mid-arc finding. Pattern: small arcs have two distinct cost
  curves (ride-on-prior-hard-work vs. targeted-investigation).
  One datapoint (C9 ride-on-prior-work); awaits a second
  instance.

---

## 9. Phase 2+ deferrals (NOT Phase 2 obligations)

These were explicitly deferred past Phase 2 and are listed for
discoverability only. Phase 2 brief authors should treat these as
"not in scope" rather than "next up."

- **Partial reversals** (Phase 2 AP Agent — distinct from the
  generic Phase 2 scope this doc covers)
- **Soft close vs hard close** (Phase 2+, Q21 from Phase 1.1
  obligations)
- **Cash Flow Statement**
- **CoA hierarchy roll-up queries** (recursive CTE or
  materialized path)
- **Materialized views / read models** for report performance
- **Multi-currency FX wiring** (Phase 4 per PLAN.md §8b)
- **Event sourcing activation** (events table writes; data
  model exists, no consumers)
- **Bank reconciliation, AP/AR modules**
- **REVOKE UPDATE/DELETE on ledger tables** (belt-and-suspenders)
- **Cycle detection on `organizations.parent_org_id`** —
  required before consolidation features write to the column.
  Carry-forward from Phase 1.5A.

---

## Summary

Phase 2 inherits two named workstreams (OI-3 + Class 2), nine
deferred ECs (5 paid-API gates + 4 non-paid-API), four
investigation queue items, three sensible-accounting candidates,
five COA gaps + three roadmap items, eleven architectural
follow-ups, four convention split-triggers + two meta-level
triggers, and ten process observations below codification
threshold.

The two workstreams (OI-3 + Class 2) are the load-bearing
opening scope. Everything else is per-Phase-2-scope-decision
queue, not commitment.

---

## Documentation Routing refinement candidates (from S15 mental simulation + S16 execution)

Surfaced during the S15 ratification mental simulation (commit
`5b02474`) and the S16 first-application execution. Each is logged
here for codification when its pattern repeats; matching `[ROUTE?]`
entries live in the active `friction-journal.md` Phase 2 section.

- **Session-scope reflection has no clean retrospective destination.**
  Per the current Documentation Routing routing rule, retrospective
  destinations are phase-scope or arc-scope; session-scope reflections
  fall through to the `[ROUTE?]` fallback. Refinement candidate for
  the next governance amendment.
- **Pattern observations that are also deferred-codification candidates**
  can legitimately split between `friction-journal.md` (the moment) and
  `open_questions.md` (the deferred decision). Convention doesn't
  spell this out; works in practice. Refinement candidate.
- **Brief-creation session lock pattern.** Brief-creation sessions
  (e.g., S15-brief-creation, S16-brief-creation) don't always acquire
  session locks. Pattern fired N=2 (`f90753b` 2026-04-26, `6e76d89`
  2026-04-27). At split-trigger threshold per Documentation Routing
  §Codification thresholds (N=2). Codifies on N=3 fire — likely
  candidate: codify a session-lock sub-type for documentation-only
  sessions, or formalize the exempt path.
- **Embedded-prose subsections without retrospective absorption.**
  Section (n) "OI-2 fix-stack closeout NOTEs" surfaced during S16
  split as ~60 lines of multi-paragraph prose under structured NOTE
  markers, with no retrospective destination. Currently archived
  verbatim in `friction-journal/phase-1.2.md`. Future migration
  candidate (likely → `open_questions.md` or a new `phase-2/notes.md`
  artifact) when the pattern repeats. Pattern fired N=1 during S16
  execution.
- **Citation-grep methodology gap.** The S16 brief's
  `grep -nE 'friction-journal\.md'` methodology missed shorthand
  citations using `friction-journal section (X)` without the `.md`
  extension. Three missed citations surfaced during S16 execution
  (lines ~946, ~1107, ~1182 in `conventions.md`). Future migration
  commits applying the Documentation Routing archival rule should
  grep both patterns: `friction-journal\.md` AND `friction-journal
  section`. Refinement candidate for tooling: heading detector or
  citation auditor should catch both patterns.
- **Identity-assertion grep for parallel Zod-schema/TS-type pairs.**
  When a brief enumerates consumer files for a schema-change
  decision (§3c-style scope), the consumer set must include both
  the Zod schema file (`*.schema.ts` under `src/shared/schemas/`)
  AND its TS type companion (`*.ts` under `src/shared/types/` for
  hand-maintained types) when the codebase pairs them. Pattern
  fired N=1 during S18 verification (TS type companions to
  `proposedEntryCard.schema.ts` and `canvasDirective.schema.ts`
  were missed by the brief's six-file enumeration; surfaced at
  Task 2 verification per Convention #8 Identity assertions).
  Refinement candidate for brief-template mental model: brief
  authors verify TS-type companions for any schema-change scope.

Cross-reference: matching `[ROUTE?]` entries in the active
`friction-journal.md` Phase 2 section.
