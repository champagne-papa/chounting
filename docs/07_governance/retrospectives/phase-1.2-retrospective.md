# Phase 1.2 Closeout Retrospective

Written: 2026-04-26, immediately after C12 closed Phase 1.2 under
Reading B (OI-3 / Class 2 fix-stack work extends into Phase 2).

Audience: future-me starting Phase 2, the Phase 2 brief author,
any future collaborator inheriting this codebase.

Phase 1.2 was the first arc to integrate Anthropic's API into a
production-shaped agent stack on top of Phase 1.1's ledger
foundations. It ran ~9 calendar days (2026-04-18 through
2026-04-26) across 8 main sessions plus carve-outs and
out-of-band arcs, shipping the agent-mediated journal entry
posting path end-to-end with verified OI-2 fix-stack and a
scoped (but not implemented) OI-3 + Class 2 fix-stack queued
for Phase 2.

This retrospective leans heavily on cross-references to durable
Phase 1.2 artifacts. Phase 1.1 had no upstream retros to lean
on; Phase 1.2 has section (p) (the C11 retrospective on C7
EC-13, ~550 lines on `f221bab`), per-session retros throughout
friction-journal sections (a)-(p), the OI-3 scoping doc
(`161bff8`), the section (o) closeout deliverables (`52a63f0`),
and the conventions catalog Phase 1.2 section (`d2b2f50`). This
document does not re-narrate that material — it points at it
and synthesizes phase-level patterns and inheritance shape.

---

## 1. Phase 1.2 in summary

### What Phase 1.2 actually built

The end-to-end agent stack: a 10-tool agent (`respondToUser`,
`postJournalEntry`, `reverseJournalEntry`, `proposeReversal`,
`listJournalEntries`, `queryAccountBalance`, `checkPeriod`,
`getOrgInfo`, `getMembership`, `getMemberships`) with three
persona prompts (Executive, Controller, AP Specialist) bound
to per-persona tool whitelists. The agent emits responses
through a `{template_id, params}` structured-response contract
with optional `canvas_directive` for renderable artifacts; a
ProposedEntryCard is the user's ratification surface for
journal-entry proposals. Site 1 pre-Zod injection
(`org_id`/`fiscal_period_id`/`idempotency_key`) lets the model
emit empty strings without breaking the schema; Site 2 post-fill
post-stamps orchestrator-owned UUIDs onto emitted cards. A
canvas-context injection mechanism gives the model situational
awareness of what the user is currently looking at; an
onboarding state machine gates first-task delivery on profile +
org + invite completion.

Phase 1.2 also shipped: 27 exit criteria across 6 categories
(21 MET / 9 DEFERRED at C10; updated to 21 MET / 7 DEFERRED /
2 PARTIAL at C12); a multi-tenant routing layer with org
switcher and AvatarDropdown; an AI Action Review queue
placeholder; conversation resume semantics; the `agent.entry.
proposed` and `agent.response.natural` template variants; a
Playwright integration harness; Soft 8 durable orphan-prevention
regression test; and out-of-band Arc A (Phase 0-1.1 Control
Foundations) shipping 14 commits across 12 steps in parallel
with Phase 1.2 mid-phase.

The phase verified OI-2 (relative-date resolution + gate A
short-circuit + Site 1 pre-Zod injection + Site 2 card post-fill)
end-to-end on real prompts in C7 EC-13 and scoped OI-3
(prompt-instructional structural absence on canvas_directive
emission) at the C11 retrospective with the scoping doc
authored as `161bff8`.

### Where Phase 1.2 ended

10/20 productive EC-2 entries through Phase E plus 2 productive
EC-13 entries in C7 (Entries 12 + 14). 2 staled as Class 2
orphans in C7 (Entries 13, 15). 8 EC-2 entries untried (16-20
chunk-2 + Entry 12 retry + Entry 13 retry). OI-2 verified;
OI-3 scoped not implemented; Class 2 fix-stack queued as
Phase 2 workstream gated on OI-3 M1 results.

Test count at HEAD: **534/536** (534 passing, 2 failing on Arc
A item 27 — `accountLedgerService` running-balance fragility on
shared-DB full-suite, fix shape known per Arc A retro Pattern
3, deferred not regressed). Commits since Session 1 anchor
`4a62faf`: **144**. See §5 calibration data for full numerics.

Phase 1.2 closes under Reading B: OI-3 / Class 2 fix-stack work
extends into Phase 2. The four durable post-C7 closeout
artifacts (section (p) C11 retro, OI-3 scoping doc, section (o)
closeout deliverables, conventions catalog Meta A + Meta B +
Convention #11 rename) carry forward as Phase 2's inheritance
state.

---

## 2. Inheritance-artifact map

This section is the discoverability layer. Subsequent sections
cite these artifacts without re-listing their commit hashes.

### Per-session retrospectives (friction-journal sections)

`docs/07_governance/friction-journal.md` carries per-session
retrospective material across lettered sections (a) through
(p) plus an H2 Vercel-deploy-fix block at end-of-file (commit
`e4c069f`, structurally distinct from the lettered sequence).

- **Sections (a)-(e)**: Sessions 1-5.2 retros, EC-20 closeout,
  Session 6 + Session 7 retros (Phase 1.1 carry-forward and
  Phase 1.2 ramp).
- **Section (f)**: OI-2 fix stack 6-item slot (pre-C11 closeout
  proposal).
- **Section (g)**: separate workstream — structural-response-
  invalid investigation (distinct from OI-2 / Class 2).
- **Section (h)**: Convention #10 EC-direction sub-track — 7
  new datapoints; sub-track formally introduced this commit.
- **Section (i)**: Convention #11 codification source —
  per-entry tripwire-A preflight.
- **Section (j)**: Convention #10 retraction sub-track — 3 new
  this run; mainline cumulative through Session 8 C6 = 12.
- **Section (k)**: scratch-provenance (run-record housekeeping).
- **Section (l)**: carry-forward.
- **Section (m)**: C6 disposition + Session 8 state through C6.
- **Section (n)**: OI-2 fix-stack closeout NOTEs (post-
  implementation).
- **Section (o)**: C7 EC-13 — OI-2 fix-stack paid-API
  verification run + closeout deliverables (Meta A application,
  post-C11), commit `52a63f0`.
- **Section (p)**: C11 retrospective on C7 EC-13 (2026-04-26),
  commit `f221bab`.

### Post-C11 durable closeout artifacts

Four commits encode Phase 1.2's post-retro closeout state:

1. **Section (p) C11 retrospective** — commit `f221bab`. Four
   sections (wins / frictions / conventions / OI-3 scoping)
   plus three operator-question reads. Drafts Meta A and Meta B
   conventions; renames Convention #11 (preserved in this
   retro's draft text).
2. **OI-3 scoping doc** — commit `161bff8`,
   `docs/09_briefs/phase-1.2/oi-3-class-2-fix-stack-scoping.md`.
   Mechanism identified, fix surface bounded, methodology
   partitioned, hypothesis treatment authored, Meta A + Meta B
   applied at scoping time as their first concrete applications.
3. **Section (o) closeout deliverables** — commit `52a63f0`.
   Meta A's first concrete application: D1 coverage trichotomy,
   D2 cost trichotomy, D3 spec-runtime tuple (NEW evidence —
   drift non-material across all four C7-attempted entries),
   D4 halt-collision axis-level decomposition.
4. **Conventions catalog Meta A + Meta B + Convention #11
   rename** — commit `d2b2f50`. Convention text drafted in C11
   landed in `docs/04_engineering/conventions.md` Phase 1.2
   section, with §7c sub-type rename ("invariant-pipeline
   dependencies" → "downstream-component dependencies") landed
   on N=1 evidence from OI-3 first application. Convention #11
   renamed and amended ("Per-Entry Pending-Orphan Preflight" →
   "Per-Entry Row-Card Pairing Post-Paste Verification") with
   body amendment naming Obs-C structural pairing finding and
   Cluster B Item 1 post-paste verification finding.

### EC matrix

`docs/09_briefs/phase-1.2/ec-matrix.md` (codified at C10 commit
`0d4007f`; updated at C12 this commit). 27 ECs + 3 shipping
line items across 6 sections. Post-C12 totals: 21 MET / 7
DEFERRED / 2 PARTIAL / 0 MISSED.

### Conventions catalog Phase 1.2 section

`docs/04_engineering/conventions.md` lines 249-1268 (Phase 1.2
section + Meta A + Meta B + Convention #11 rename, post-
`d2b2f50`). 12 codified conventions plus the renamed-and-amended
Convention #11; ratification audit table in lines 985-1026 with
new rows for the C12-era conventions.

### Arc A retrospective

`docs/07_governance/retrospectives/arc-A-retrospective.md` (~632
lines). Phase 0-1.1 Control Foundations shipped in parallel
with Phase 1.2 mid-phase (Arc A close 2026-04-24). Distinct
arc shape (12 steps, separate brief, separate retrospective) —
Phase 1.2 inherits a few cross-cutting patterns (file-top
comment staleness, screenshot gate, push-readiness three-
condition gate) but Arc A is its own artifact and is referenced
here for completeness rather than re-synthesized.

### CURRENT_STATE.md

`docs/09_briefs/CURRENT_STATE.md`. Session-by-session shipping
cadence; updated at C12 this commit with Phase 1.2 closed
section + Phase 2 inheritance section.

### Phase 2 obligations

`docs/09_briefs/phase-2/obligations.md` (new this commit).
Carry-forward queue covering named workstreams, deferred ECs,
investigation queue, sensible-accounting candidates, COA gaps,
architectural follow-ups, convention split-trigger watch, and
process observations below codification threshold.

---

## 3. Patterns that crossed sessions

These are phase-level patterns that don't live cleanly in any
single session retrospective. Each pattern is named, cited
against 2-3 representative datapoints across sessions, and
states the phase-level lesson. Patterns are not codification
proposals (most are already codified, deferred, or below
threshold); they are framing-discipline observations for
Phase 2 planning.

### Pattern 1 — Drafting-layer / code-reality drift as a recurring class

Phase 1.2 surfaced the "drafting documents are snapshots, not
canonical sources" pattern from Phase 1.1's Pattern 2 in 5+
distinct sessions. Each fire was a brief or sub-brief asserting
a code surface that the actual codebase contradicted at
execution time.

- **Session 4** (commit `9c6552d`): migration-113 pre-check
  halt — Clarification D premise corrected.
- **Session 6** (commit-2 sub-brief §6.5): claimed
  `invitationService.getByToken` existed; it didn't. Operator-
  approved Option A landed `previewInvitationByToken` as
  scope-consistent exception.
- **Session 7.1.1** (commit `a43dd35`): template catalog gap
  where `agent.response.natural` template variant didn't exist
  but EC-19 scenario (a) required it. P19 / P20 / P21 split
  rolled into the work.
- **Session 8 C6 prereq O3** (commits `6c407e7` / `78e9f0d`):
  prompt-layer Bug A/B fixes surfaced when the brief assumed
  `checkPeriod` returned a non-null result; it returned null
  on agent-fabricated dates outside any open period.
- **Arc A Step 11 D11-C** (commit `e016c20`): brief said
  `ServiceErrorCode` count was "19 → 24"; orchestrator grep
  showed 53 → 56. Brief was wrong by 32 codes — internally
  self-consistent because authored against a Phase 1.1
  snapshot before Phase 1.5 expansions.

**Codification:** Convention #8 ("Spec-to-Implementation
Verification") with 7 evolved categories across the phase
(refined in Sessions 4, 6, 7.1.1, Phase E). The codification
threshold (3 fires) was met in Phase 1.5A; subsequent fires
across Phase 1.2 + Arc A refined the categories rather than
re-codifying.

**Phase-level lesson:** the brief and the codebase are different
artifacts maintained at different cadences. The codebase wins
at conflict; the brief is best treated as a roadmap, not a
specification. Pre-delegation verification against the actual
codebase is the load-bearing quality gate, and the verification
work is proportional to how many external-system or cross-
session boundaries the task crosses, not to task complexity.

### Pattern 2 — Concurrent-session coordination evolution

Phase 1.2 began with single-git-identity coordination
(`champagne-papa`) across overlapping sessions. The
coordination-crisis on 2026-04-22 surfaced when an
audit-session commit (`c24d69d`) and a Prompt-4-session commit
(`dc757c3`) landed on the same branch with overlapping push
intent. The session-coordination machinery was authored in
response.

- **Session Labeling Convention** (commit `918e68a`): each
  session declares a label at start; commit messages cite the
  label; future sessions disambiguate by label + date.
- **Session Lock File Convention** (commit `918e68a`):
  `.coordination/session-lock.json` populated by
  `scripts/session-init.sh`; foreign locks are deferred-to,
  not cleared.
- **Label-hygiene amendment** (commit `8aacdba`): Session M
  near-collision clarified that label "M" used informally in
  prose is distinct from `session-init.sh M`; future sessions
  should pick more-specific labels (date-stamped or
  arc-descriptive).
- **Env-inheritance handshake amendment** (commit `00afe82`):
  Session M first-activation finding — `COORD_SESSION` env
  doesn't survive Bash invocations cleanly; pre-commit hook
  enforcement requires inline `COORD_SESSION=...` on each
  commit command.

**Codification:** two conventions in `docs/04_engineering/
conventions.md` Phase 1.2 section.

**Phase-level lesson:** coordination machinery ossifies under
pressure. The session-lock convention was authored under
overlapping-commit pressure; its first-activation finding
(env-inheritance) refined it; subsequent sessions across the
phase used it without further amendment. Coordination shapes
are best authored when their cost is small (no active overlap)
and their use is undefined (no firing pattern); authoring
under pressure produces brittle conventions.

### Pattern 3 — Mutual hallucination-flag-and-retract discipline emergence

Convention #10 ("Mutual Hallucination-Flag-and-Retract
Discipline") emerged organically across 6 datapoints in
Session 7.1 alone before formal codification. Phase E added
the EC-direction sub-track at C6 closeout (7 datapoints,
sub-track-internal numbering EC-#1 through EC-#7); the
retraction sub-track grandfathered at 8 codification-trigger
datapoints and accumulated to 17 cumulative through C11.

- **Session 7.1**: 6 datapoints on the mutual flag-and-retract
  shape between operator and Claude. Pattern: when an EC-claim
  shape is qualified-inference-shaped ("appears to..." vs. "is
  ..."), surface the qualifier explicitly rather than collapsing
  to confidence.
- **Phase E (C6 closeout)**: EC-direction sub-track formally
  introduced. 7 datapoints in this run alone covering claim
  shapes from ratification gate framings, retro pattern
  attributions, and forcing-function attributions.
- **C7 EC-13** (4 retractions in this run): structural-pairing
  vs. row-presence framing on Class 2; halt-collision Fact A/B
  conflation; cost-trichotomy rounding artifact; spec-vs-
  runtime drift framing.
- **C11 retrospective** (1 retraction this run): H3/H3b
  "collapse on inspection" framing was too clean; discrimination
  pass found H3 and H3b describe different layers of the same
  observed phenomenon, causally entangled but stacked.

**Codification:** Convention #10 in `conventions.md` Phase 1.2
section. EC-direction sub-track + retraction sub-track formally
named at Phase E codification.

**Phase-level lesson:** the EC-direction discipline emerged from
operator-Claude interaction itself, not from advance design.
Each fire produced a small course-correction; the cumulative
discipline became codification-worthy when the operator and
the orchestrator's running-Claude-instance both started
catching mistakes against each other's qualified-inference
shapes. Convention #10 is unusual among Phase 1.2 conventions
in that its codification-trigger evidence comes from the
discipline's own operation, not from external bug shapes.

### Pattern 4 — Layer-transition gap pattern (Convention #9 expansion)

Convention #9 ("Material Gaps Surface at Layer-Transition
Boundaries") was codified at 5 datapoints in Phase 1.2 (P11b,
P14, P16 dual-context rewrite, P19 template-catalog gap, P21
rationale drift across Session 7.1). By C5 of Session 8 the
datapoint count had expanded to 28+ as the pattern fired
across sessions.

- **Session 7.1 P14**: dual-context rewrite — the dual-axis
  rewrite of `loadOrgContext` to handle `org_id` from URL +
  selection state.
- **Session 7.1 P16**: persona-bound `tool_input` org_id
  framing; the agent's tool calls assumed an org_id field
  that the persona-prompt didn't anchor.
- **Session 7.1.1 P19**: template-catalog gap; the rendered
  prompt had a template enumerated that the runtime catalog
  didn't enumerate.
- **Session 7.1.2 P21**: rationale-text drift between the
  Playwright harness's expected behavior and the orchestrator's
  emitted behavior on EC-19 verification.
- **Phase E (multiple)**: 23+ additional datapoints across
  C5 + Phase E. Each was a layer-transition where the framing
  on side A didn't match the framing on side B.

**Codification:** Convention #9 in `conventions.md` Phase 1.2
section.

**Phase-level lesson:** the pattern's expansion from 5 → 28+
datapoints is itself a calibration finding. Convention #9 was
authored expecting to fire occasionally; in practice it fires
across nearly every session boundary where two independently-
authored components meet. The discipline of "articulating
where the layers transition and what travels across" is
high-frequency, not occasional. Phase 2 can expect Convention
#9 fires per-session, not per-phase.

### Pattern 5 — The C6 EC-2 actual run as a stress test

Session 8 Phase E (the C6 EC-2 actual run, 2026-04-24/25)
surfaced 5 distinct findings in one paid-API session: OI-2
stall (false-success narration), Class 2
structural-response-invalid, 7 EC-direction sub-track
datapoints, 5 COA gaps, and the OI-2 fix-stack 6-item
proposal.

- **OI-2 stalls** (5 events across 4 entries 6/8/9/10):
  agent emits `agent.response.natural` claiming card rendered
  when no card rendered; trigger condition relative-date-token
  AND proximity to UTC-rollover. Pre-rollover stall rate ~50%,
  post-rollover 100%. Mid-run reclassified from "prompt leak"
  to render-failure-with-false-success-narration.
- **Class 2 structural-response-invalid** (2 events on Entry
  12): agent emits valid `tool_input` but fails to emit any
  valid `respondToUser` across `STRUCTURAL_MAX_RETRIES`. Tool
  input clean on both attempts so failure is in
  second-half-of-orchestrator-loop. Distinct from OI-2.
- **EC-direction sub-track**: 7 EC-claim shape datapoints
  surfaced during the run; sub-track formally introduced at
  closeout.
- **COA gaps**: 5 holding-vs-operating-company semantic gaps
  surfaced through agent best-available substitution; agent
  did the available right thing in each case but the
  fixture's domain mismatch was visible.
- **OI-2 fix-stack 6-item proposal**: user-local timezone
  injection, deterministic date resolution, day-of-week
  validation, refuse-on-ambiguity for span-prompts,
  confidence-thresholded commit, defer org-level timezone
  (Phase 2). Items 1-5 minimum to ship Phase 1.2 close; item 6
  Phase 2.

**Phase-level lesson:** paid-API runs are the
forcing-function-of-record for finding mechanisms that mocked-
LLM tests can't surface. C6 cost ~$2.78-$2.93 of $3.00
single-run ceiling and produced more findings per dollar than
any other Phase 1.2 work. C7's $0.4913 spend was less
information-dense per dollar but was structurally narrower
(verifying OI-2 specifically) — the right tool for its job.
Phase 2 should plan paid-API runs deliberately as
multi-finding discovery surfaces, not as single-EC verification
gates.

### Pattern 6 — Meta A and Meta B as the C11 retrospective's structural outputs

C11's retrospective produced two new conventions (Meta A,
Meta B) plus a Convention #11 rename in a single retrospective
session. This is unusual in two ways: (a) the conventions
were drafted by the C11 facilitator from the run's own
findings, not from prior cross-cumulative friction-journal
patterns; (b) both Meta A and Meta B had their first concrete
applications mid-Phase (S12 + OI-3 scoping doc) before
codification at S13.

- **Meta A — PARTIAL closure state-decomposition**: drafted in
  C11 section (p) at 4 instances (coverage / cost / spec-
  runtime / halt-policy axis-level). First concrete
  application: S12's section (o) closeout deliverables (the
  four C7-closeout items applied Meta A's dimensions to C7's
  run record post-hoc).
- **Meta B — Scoping-time cross-dependency articulation**:
  drafted in C11 section (p) at 3 instances (policy-rule
  interactions / invariant-pipeline dependencies / telemetry-
  salience dependencies). First concrete application: OI-3
  scoping doc §7b (Meta B applied at scoping time pre-
  execution, surfacing the recursive Class-2-as-upstream-and-
  as-fix dependency and resolving via synthetic-bypass).
- **Convention #11 rename**: drafted in C11 section (p) as
  "Per-Entry Pending-Orphan Post-Paste Verification" (Cluster
  B Item 1 framing); S13 synthesized with Obs-C row+card
  structural pairing framing into "Per-Entry Row-Card Pairing
  Post-Paste Verification."

**Phase-level lesson:** the retrospective itself is a
codification surface, not just a synthesis surface. Meta A
and Meta B emerged as conventions because C11's facilitator
named them as conventions during retrospection (rather than
filing them as observations). The first-application-before-
codification cadence (apply at S12 + OI-3 → codify at S13)
worked well for these two — the applications produced
meta-evidence on the conventions' prompt design that informed
the catalog text. Phase 2 retrospectives should treat
convention-authoring as a candidate output, not just a
synthesis output.

### Pattern 7 — Day-clock compression vs. design-complexity calibration

Session 7's retrospective named this as an open question. By
phase-close it has multiple datapoints across Sessions 7, 7.1,
and 8 but the calibration heuristic isn't settled.

- **Session 7**: pre-declared split-point fired as planned —
  Pre-decision 14 (conversation-resume shape) pushed Commit 3
  budget from ~1.25 day to ~1.5 day; founder pre-declared
  Commit 4-5 deferral to Session 7.1 to simplify
  end-of-Commit-3 decision overhead.
- **Session 7.1**: three-sub-session thread — main Shape B
  DELTA + two Shape C DELTA-of-DELTA carve-outs (7.1.1, 7.1.2)
  decided mid-thread. Thread shape was decided reactively, not
  proactively.
- **Session 8**: multiple sub-arcs (O3 → C9 → C8 → Phase D
  partial run → Phase E full run → C7 → C11 → S12 → S13 →
  C12), each with its own context-budget profile. Sub-arc
  splitting was decided at-the-margin per session.

**Phase-level lesson:** session-shape decisions are made
reactively, not proactively, because the session-shape's cost
is hard to estimate without execution data. The Session 7
pre-declared split worked because the day-clock compression
was visible at Pre-decision 14; Session 7.1's reactive splits
worked because the thread had a natural cleavage at EC-19
manual verification. Phase 2 might benefit from naming
session-shape signals (compression, cleavage, complexity)
explicitly at session-start rather than discovering them
mid-session, but the discipline isn't authored yet.

### Pattern 8 — Verify-state vs. infer-from-action discipline

Phase C O3 closeout surfaced this as a three-instance pattern
that codified into two conventions: "Preservation and
Ambiguity Gates" and "Erase-to-Clean vs. Document-to-Verify"
(both in commit `a610e0e`).

- **Three Phase C instances**: each a case where the operator
  or orchestrator inferred state from a prior action's
  apparent outcome rather than verifying state directly.
  Inference produced wrong conclusions in each case; direct
  verification corrected.
- **Codification at `a610e0e`**: family-clustered with the
  existing "Check HEAD before Step 2 Plan" entry as
  parallel-commit-robustness siblings.

**Phase-level lesson:** action-outcome inference is fast and
low-cost; state-verification is slow and high-cost; but the
correctness asymmetry is large enough that the convention is
worth the cost. Phase 1.2's conventions favor verification
over inference across the catalog (Convention #8, Convention
#9, both Preservation/Ambiguity Gates conventions). Phase 2
inherits this bias by default.

---

## 4. What Phase 2 inherits

This section is narrative on top of `docs/09_briefs/phase-2/
obligations.md` (the structured queue). Higher-level than the
obligations doc — narrative on which workstreams Phase 2 opens
with and why each carries forward.

### The two named opening workstreams

Phase 2 opens with two scoped workstreams: **OI-3 fix-stack
implementation** and **Class 2 fix-stack implementation**. Both
target the same observable surface (Class 2 row-without-card
pattern) but at different layers (OI-3 at the prompt-
instructional layer; Class 2 at the model-cognitive layer).
Phase 2's first paid-API gate is OI-3's M1 post-fix validation,
which is also the discriminating evidence between H3b-ii alone
and H3 independently live. If H3b-ii alone is the mechanism,
the Class 2 workstream collapses into OI-3's coverage. If H3
is independently live, Class 2 extends OI-3 with model-
cognitive intervention.

The OI-3 scoping doc (`161bff8`) is the inheritance artifact —
authored during S11 against a fully-specified mechanism
(prompt-instructional structural absence on canvas_directive
emission) with three prompt-text fix surfaces named explicitly,
methodology partitioned across M3 baseline + prompt-surgery +
M1 post-fix validation + M2 Soft-9 durable test, hypothesis
treatment carrying primary H3b-ii + secondary H3 + four
residual hypotheses with discrimination criteria. The Phase 2
implementation chat opens against this doc and resolves the
§3c sub-decision (four-option enumeration on tentative-state
representation) as its first action.

### Deferred ECs

Five paid-API ECs (EC-2 + EC-9 + EC-10 + EC-11 + EC-13) carry
forward with C12-updated dispositions — EC-2 and EC-13 to
PARTIAL, EC-9/10/11 stay DEFERRED with annotation. Four
non-paid-API ECs (EC-15, EC-16, EC-14, EC-27) carry forward
unchanged. EC-15 and EC-16 are tractable test-authoring gaps;
EC-14 and EC-27 are screenshot-commit items potentially
shareable in one pass.

### Investigation queue items

Four items: Mode B org_id confusion (post-C8 partial fix; needs
real-Claude validation), structural-response-invalid (Phase E
Class 2 hypothesis context-window saturation; needs separate
design pass), edit-path source-flip review (Phase 1.3+
disposition), and latency-not-caching paradox (Phase E finding
#6, needs cache-attribution instrumentation).

### Sensible-accounting candidates

Three Phase 1.3+ refinements surfaced during Phase E: Path-1
default prompt nudge (tax-inclusive corp-card compound),
`bookPayrollEntry` employer-side burden tool (Phase E Entry 6
multi-line payroll), prepaid-amortization scheduling proactive
ask. Each is below MVP-required but represents domain
sophistication the agent should grow into.

### COA gaps and fixture refinements

5 COA gaps (no Rent Expense, no AR, no Credit Card Payable, no
GST/PST/HST/ITC, no Consulting/Service Revenue) plus three
roadmap items (more industry CoA templates, CoA customization
UX, quick-start → customize flow). Domain mismatch between
operating-company semantics in EC-2 prompts and holding-
company COA in dev fixture; agent's best-available
substitutions were correct in each case but the fixture's
narrowness shaped the EC outcomes more than the agent's
behavior did.

### Architectural follow-ups

Eleven items spanning multi-stage approval state machine,
account purpose tagging, source ↔ JE linkage, period-boundary
checkpointing, currencies lookup table + FK, caching
enablement, dead `CanvasDirective` variant cleanup,
`approveRun` atomicity hardening, recurring-journal automated
scheduler (pg-boss), per-code `ServiceErrorCode` catalog
drift-prevention, `accountLedgerService` running-balance
fragility (Arc A item 27).

### Convention split-trigger watch

Four split-triggers live: Meta A axis-level decomposition at
N=1 (per-sub-type N=2 trigger live); Meta A hypothesis-
discrimination dimension at N=1 (per-sub-type N=2 trigger
live); Meta B sub-type N=2 trigger live across all three
sub-types; Meta B meta-level N=5 review trigger live.
Convention #10 EC-direction sub-track at 7 datapoints; no
sub-sub-track threshold defined yet. Convention #10 retraction
sub-track at 17 cumulative through C11.

### Process observations below codification threshold

Ten items at 1-2 datapoints listed for visibility:
held-working-tree discipline (1), audit-table-row authoring
candidate (1), layered-attribution-masking in forcing
functions (2), relay-visibility asymmetry (3 — approaching
threshold), external-consultant-accepts-WSL-Claude-derivations
(2), plan-time latency forecasts from small-n trends (1),
standing-instructions-produce-reach-for-behavior (1),
arc-compounding-without-tripwire (2), day-clock compression
calibration (multiple but unauthored), metabolic-load
formulation of small arcs (1).

---

## 5. Calibration data

Numerics that may be useful for future-phase planning. Some are
authoritative (test count, commit count); some are estimates
flagged explicitly.

### Test count progression

| Milestone | Test count | Commit anchor |
|---|---|---|
| Phase 1.1 close | 49 unit + 26 integration = 75 | (pre-Phase-1.2) |
| Phase 1.2 Session 4 close | 209 | `9c6552d` |
| Phase 1.2 Session 5 close | 226 | `4487e19` |
| Phase 1.2 Session 5.1 close | 233 | `6a588f8` |
| Phase 1.2 Session 5.2 close | 238 | `3f02b17` |
| Phase 1.2 Session 6 close | 288 | `e9ffa9e` |
| Phase 1.2 Session 7 close | 344 | `9be396c` |
| Phase 1.2 Session 7.1 close | 369 | `dc0ee69` |
| Phase 1.2 Session 8 O3 close | 412 | (`78e9f0d` + cleanup `4372d65`) |
| Phase 1.2 Phase E close (Arc A bake) | 487/487 clean baseline | `064d0da` |
| Phase 1.2 C7 close (Soft 8 added) | 488 (clean) | `db2589a` |
| Phase 1.2 C12 close (this commit) | **534/536** under shared-DB full-suite | (this commit) |

The 534/536 at C12 close reflects 2 failing tests on Arc A item
27 (`accountLedgerService` running-balance fragility) under
shared-DB full-suite. Under `pnpm db:reset:clean` baseline the
count is 536/536 (the running-balance fragility is shared-DB-
specific). Phase 2 inherits the item 27 fix shape (migrate to
less-polluted account, 1300 precedent).

### Commit count

**144 commits** since Session 1 anchor `4a62faf` (authoritative
via `git log --oneline 4a62faf..HEAD | wc -l` at C12 commit
time). Includes Phase 1.2 sessions, Arc A's 14 commits + 2
discipline-meta commits, Session M coordination commits, and
the four post-C7 closeout artifacts.

### Paid-API spend

Cumulative across paid sessions (WSL-summed estimate; operator
authoritative dashboard total may differ):

- Session 4 EC-66: ~$0.02
- Session 5 + 5.1 + 5.2 EC-20 smoke runs: ~$0.05 estimated
- Session 8 O3 Entry 1 retry: $0.094
- Session 8 Phase D partial run: $0.5801
- Session 8 Phase E full run: ~$2.78-$2.93 (operator
  Anthropic dashboard authoritative)
- Session 8 C7 EC-13: $0.4913
- **Estimated total: ~$3.96-$4.11**

**Flag:** this is a WSL-summed estimate from in-friction-
journal records. Operator authoritative dashboard total may
differ. If the dashboard total is authoritative, override at
diff-review.

### Session count

**8 main sessions + ~8 carve-outs = ~16 sessions total.** Main:
Sessions 1-8. Carve-outs: 4.5, 5.1, 5.2, EC-20, 7.1, 7.1.1,
7.1.2, Session M (coord arc). Plus post-Arc-A retro work:
S10-C11, S11-OI-3-scoping, S12-C7-closeout, S13-conventions-
catalog, S14-c12-phase-1-2-closeout (this session). Counting
the post-Arc-A sessions raises the count to ~21.

**Flag:** boundary-defining is debatable. EC-20 was a
combined-closeout commit, not strictly a session. Session 7.1
was a thread of three sub-sessions whose grain is ambiguous.
The ~16 number assumes "session = independent context window"
shape; if "session = lettered C-marker scope" the count is
different. Phase 2 might benefit from a stricter session-
boundary definition.

### Friction-journal entry count proxy

**16 lettered sections (a)-(p) + 1 H2 block (Vercel-deploy-fix)
+ 1 new section (q) post-this-commit = 18 named subsections.**
This undercounts the per-section internal granularity (each
section averages ~5-15 named findings or sub-findings) but is
the clean metric for "how many distinct retro events did
Phase 1.2 capture."

### Conventions catalog growth

Phase 1.2 section grew from 0 conventions at Session 1 start
to 13 conventions at C12 close (12 codified + 1 renamed-and-
amended). Catalog growth pace:

- Session 4 close: 0 Phase 1.2 conventions (Phase 1.5A
  conventions inherited)
- Sessions 5-7: gradual codification — Spec-to-Implementation
  Verification (Phase 1.5A carry-forward, refined),
  Cited-Code Verification, Permission Catalog Count Drift, etc.
- Phase C O3 closeout (`a610e0e`): three new conventions
  (Re-verify Environmental Claims at Each Gate, Preservation
  and Ambiguity Gates, Erase-to-Clean vs. Document-to-Verify)
- Coordination commit (`918e68a` + amendments): two new
  conventions (Session Labeling, Session Lock File)
- Phase E (`f935efc`): Convention #11 codification + Convention
  #10 sub-track structure amendment
- Session 8 EC-direction sub-track formal introduction at
  Phase E
- C12 (this commit's predecessor `d2b2f50`): Meta A + Meta B +
  Convention #11 rename-and-amend

### Migration count

Phase 1.2 added migrations 113 through 121 (9 migrations).
Phase 1.5A added 108-117; Phase 1.2 picks up at 113 (some
overlap with Phase 1.5A's later migrations because Phase 1.5A
work continued after Phase 1.2 began). Arc A added 9
migrations (counts inherited from Phase 0-1.1 baseline +
Arc A increments).

---

## 6. Honest limitations of this retrospective

I'm WSL Claude as scoping Claude as facilitator across multiple
roles in the same chat thread, which has the same self-audit
bias the Phase 1.1 retro flagged plus additional context-window
limitations from a long handoff chain.

**Selection bias.** I'm selecting which patterns to highlight
and which to minimize. I'm probably overweighting patterns
that surfaced in C11 (Meta A and Meta B specifically) because
they're the most recent codifications and their first
applications happened during the same session-cluster as this
retro. A second reader should check whether Pattern 6 (Meta A
and Meta B) is genuinely the most informative pattern of
Phase 1.2 or whether it's overrepresented because of recency.

**Material I didn't read in full.** Phase 1.1's retro reading
list included friction-journal and a brief; this phase's
reading list also included `phase-1.2/brief.md` (1386 lines)
and the conventions catalog Phase 1.2 section in full. I read
both partially via grep + targeted section reads. Specific
patterns that lived in those documents and didn't surface to
my synthesis should be assumed possibly missed. The Phase 2
brief author may want to do a fuller read against those
specific surfaces.

**Calibration data limits.** Test count and commit count are
authoritative (run at retro authoring time). Paid-API spend is
WSL-summed and explicitly flagged; the operator's dashboard
total may differ. Session count is debatable; I picked a
boundary that produced a useful number rather than the
strictest one.

**Counterfactual claims.** The "phase-level lesson" framings
in §3 are post-hoc synthesis; they may be true but are not
falsifiable without re-running phase-shaped work under
alternative conventions. The lessons are best treated as
hypotheses-to-test, not as empirical claims.

**The "post-Arc-A retro chain"** (S10 C11 retro → S11 OI-3
scoping → S12 C7 closeout → S13 conventions catalog → S14
this retro) was authored in five sessions across one calendar
day (2026-04-26). The cadence was tight, the cross-references
are dense, and each session built on the prior session's
outputs. The chain works as a closeout sequence but produces a
particular kind of synthesis — verification-friendly,
attribution-heavy, slightly more about the closeout itself than
about Phase 1.2 broadly. A retro authored from a fresh-context
session weeks after the phase close would emphasize different
patterns. Future-me reading this should weight the Phase E
material (which is from long enough ago to be
post-hoc-revisable) more confidently than the C7-and-onward
material (which is fresh and may be over-narrativized).

---

## 7. What I would do differently

1. **Author Convention #8's category list at codification, not
   incrementally.** Convention #8 evolved across 7 categories
   over the phase. Each refinement was small but the cumulative
   drift means the convention's text is harder to read than it
   needs to be. Phase 2 should pick a category list at first
   codification and only amend on structural change, not
   content refinement.

2. **Standardize session-boundary definition before Phase 2.**
   The "session" concept fragmented across Phase 1.2 (main
   sessions, carve-outs, sub-sessions, threaded C-markers,
   coord arcs). Calibration data is harder to interpret when
   the boundary is debatable.

3. **Run paid-API discovery sessions with explicit multi-finding
   intent.** C6 EC-2 actual run produced more findings per
   dollar than any other Phase 1.2 work. C7 was structurally
   narrower (verifying OI-2 specifically). Both are valid
   shapes but the cost-per-finding asymmetry suggests Phase 2
   should plan for at least one paid-API session shaped as
   "multi-finding discovery" rather than "single-EC verification."

4. **Adopt the closeout-before-implementation cadence as the
   default.** The post-Arc-A chain (S10 C11 retro → S11 OI-3
   scoping → S12 C7 closeout → S13 conventions catalog → S14
   this retro) closed Phase 1.2 cleanly before Phase 2's
   implementation work begins. Phase 1.1 closed similarly via
   Task 18. This cadence works well for hand-off; Phase 2
   should preserve it.

5. **Author convention codification triggers (N=2 / N=3 / N=5)
   into convention text at first codification, not amend
   afterward.** Meta A and Meta B both have explicit per-sub-
   type N=2 split triggers; Meta B has a meta-level N=5 review
   trigger. These were authored at first codification and made
   the convention's evolution discipline visible. Older
   conventions (Convention #8, #9, #10) added their split-
   trigger discipline incrementally; the texts are harder to
   read for it.

---

## 8. What I would keep exactly the same

**The friction-journal as the load-bearing retro substrate.**
Sections (a)-(p) plus per-sub-section internal granularity
captured ~18 named retro events. Each entry was the kind of
"this surprised me at 2:30 PM" specific moment that makes
phase-level synthesis possible. Without the friction-journal,
this retrospective would be reconstructing events from git
history, which captures *what* changed but not *why* it was
surprising. Phase 1.1's retro made the same observation; it
holds.

**Convention codification thresholds.** N=2 / N=3 thresholds
worked across Phase 1.2's codification cadence. Meta A and
Meta B's per-sub-type N=2 split triggers preserve the
discipline at the meta-convention level. The threshold mechanism
prevents premature codification while allowing genuine patterns
to surface as conventions.

**The four-section retrospective shape (wins / frictions /
conventions / scope).** C11's retrospective adopted this shape
and produced two new conventions plus a Convention #11 rename
in one session. The shape works because each section has a
distinct output type: wins are non-codification observations,
frictions are codification-candidate observations, conventions
are codification commitments, scope is forward-looking. Phase
2 retrospectives should preserve this shape.

**The four-deliverable closeout shape (per Meta A application
to C7).** The C12 closeout's five deliverables (this retro +
EC matrix + CURRENT_STATE + Phase 2 obligations + section (q))
are an extension of the C7-closeout's four-deliverable shape
(Meta A's first application). The deliverable count grew because
Phase-close has more boundary work than session-close, but the
multi-artifact-single-commit shape preserves the closeout's
co-emergent framing.

**Paid-API gates for behavioral verification, mocked-LLM tests
for structural verification.** C6 + C7 + Phase E paid-API runs
caught mechanisms (OI-2 stalls, Class 2 structural-response-
invalid) that mocked-LLM tests would not have surfaced. Mocked-
LLM tests caught structural breakage (schema migrations,
contract changes) that paid-API runs would have surfaced more
expensively. Phase 2 should keep both surfaces.

**Convention #10 EC-direction discipline.** The mutual flag-
and-retract surface between operator and Claude prevented
multiple wrong decisions from landing as commits across the
phase. The discipline's cost is small (one explicit-qualifier
sentence per EC-claim); the value is large (each retraction
sub-track entry is a wrong-decision that didn't ship). Phase 2
inherits this discipline by default through Convention #10's
codified text.

---

## 9. Phase 2 starts here

Phase 2 opens with two named workstreams (OI-3 + Class 2),
nine deferred ECs, four investigation queue items, and the
carry-forward queue at `docs/09_briefs/phase-2/obligations.md`.
The first paid-API gate is OI-3 M1 post-fix validation, which
is also the discriminating evidence for whether the Class 2
workstream collapses into OI-3 or extends beyond it.

The four durable Phase 1.2 closeout artifacts (`f221bab` /
`161bff8` / `52a63f0` / `d2b2f50`) are Phase 2's inheritance
state. This retrospective and the Phase 2 obligations doc
(landed in this same C12 commit) round out the inheritance
shape.

Phase 1.1 closed with "the codebase compiles, the agent stack
is empty." Phase 1.2 closes with "the agent stack is full,
verifies on real prompts for OI-2's surface, and has scoped
work queued for the surfaces it doesn't yet cover." Phase 2
opens against that state.
