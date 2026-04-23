# Where I am as of 2026-04-19 (Phase 1.2 Session 7.1 shipped; Session 8 next, with Session 7.1 Commit 4 shell polish still outstanding)

## Phase 1.2 — The Double Entry Agent (in flight, decomposed into sessions)

Master execution brief at `docs/09_briefs/phase-1.2/brief.md`
(frozen at SHA aae547a). Per founder decision, Phase 1.2 is
decomposed into ~8 execution sessions. The master brief is the
architecture document and is never modified during execution; each
session gets a focused sub-brief citing specific master-brief
sections.

The Double Entry Agent end-to-end: conversational journal entries,
onboarding flow, ProposedEntryCard with policy-outcome language
(ADR-0002), canvas context injection, form-escape surfaces for
profile/org/invite management. 10 tools (respondToUser added per
§6.2), 3 persona prompts, 27 exit criteria (19 from phase_plan.md
+ 8 new for onboarding/forms/migration).

### Session 1 — Complete (2026-04-18)

Sub-brief at `docs/09_briefs/phase-1.2/session-1-brief.md`.
Execution landed as commits 44ecb4f → 21169ea → 3b034b8 →
6e18169 on top of 4a62faf. All 12 S1 exit criteria pass.
Two lessons captured: CA-37 sub-brief gap (now addressed by
the "Permission Catalog Count Drift" convention in
`docs/04_engineering/conventions.md`) and the Kong ↔ auth
container restart quirk (now wrapped by the
`pnpm db:reset:clean` script). Devex pickups landed as 82247cb.

### Session 2 — Complete (2026-04-18)

Sub-brief at `docs/09_briefs/phase-1.2/session-2-brief.md`.
Execution landed as commits 0bee609 → ea2f09e → 3539223 →
65d563b on top of readiness anchor fc306c5. All 15 S2 exit
criteria pass. Two lessons captured: the schema-refine gap
(now addressed by the "Cited-Code Verification" convention in
`docs/04_engineering/conventions.md`) and the Map key-type
narrowing quirk. Devex pickup landed as d20c767.

### Session 3 — Complete (2026-04-18)

Sub-brief at `docs/09_briefs/phase-1.2/session-3-brief.md`.
Execution landed as commits 98791f8 → 1f4d8cf → 5e05d91 →
6cdba6e on top of readiness anchor 1562d3c. All 10 S3 exit
criteria pass. Commit-2 founder review gate produced one polish
(UUIDs dropped from identity block) and captured one structural
observation (the `_sharedSections.ts` + `_identityAndTools.ts`
refactor). Four candidate-future-convention lessons staged in
the friction journal, none codified — batching per founder
discipline.

### Session 4 — Complete (2026-04-18)

Sub-brief at `docs/09_briefs/phase-1.2/session-4-brief.md`.
Execution landed as commits e774577 → 96b904b → 34c8fe3 →
b4585bb → f288da2 → da4641e → 9c6552d (6 feature + 1 docs
closeout commit) on top of readiness anchor ec86a63. All 16 S4
exit criteria pass. 209 tests / 60 files (191 baseline + 18
new). **First paid-API session** — CA-66 ran against real
Claude and passed (one paid call, ~$0.02). Four execution-time
finds captured in the friction journal: migration-113
pre-check halt (Clarification D premise corrected),
PostgREST FK embedding rewrite in loadOrgContext, missing
idempotency_key column write in journalEntryService.post
(first session to exercise source='agent' end-to-end), and a
pre-commit-4 test-ripple count correction. Commit-2 founder
review gate produced one polish (bold removed from org_name
in injection prose).

### Session 4.5 — Complete (2026-04-18)

One-commit follow-up (cbbfafd) to Session 4's migration-113
find. Changed `AuditEntry.org_id: string → string | null` in
`recordMutation.ts` and removed the `undefined as unknown as
string` cast from `userProfileService.updateProfile:115`. 18
recordMutation call sites audited — 17 safe (non-null org_ids),
1 was the hack (cleaned up). authEvents.ts bypasses
recordMutation and was left alone (already correct). 209/209
still green; purely additive type widening. Session 5 inherits
the accurate type without further cleanup.

### Session 5 — Complete (2026-04-18)

Sub-brief at `docs/09_briefs/phase-1.2/session-5-brief.md`
(frozen at 9c22e07). Execution landed as commits be72229 →
6297b57 → 246ee25 → f09b73f → 2b644f6 → 4487e19 (5 feature +
1 docs closeout) on top of 9c22e07. All 11 S5 exit criteria
pass. 226/226 tests (209 baseline + 17 new it-blocks across 7
CA files). Commit-1 founder review gate produced one polish
(step 2 "isn't available yet" → "isn't wired in for you right
now"). Delivered: master §11 onboarding flow — state machine,
extended onboardingSuffix, welcome page, sign-in redirect,
AgentChatPanel prop contract.

### Session 5.1 — Complete (2026-04-19)

Three commits (9b1af3d, 887d5ea, 6a588f8) fixing the two
shipping-blocker bugs surfaced by the first EC-20 smoke run
against real Claude. Bug 1: multi-turn protocol violation
(persistSession wrote `respondToUser` tool_use verbatim,
violating Anthropic's tool_use → tool_result rule). Bug 2:
template_id invention (system prompt didn't enumerate valid
keys). Two regression tests added
(agentConversationProtocolInvariant, agentTemplateIdSetClosure).
233/233 tests green.

### Session 5.2 — Complete (2026-04-19)

Three commits (e0a4435, f69fe75, 3f02b17) fixing the two
production-latent bugs surfaced by the post-Session-5.1 smoke
re-run. Bug 3: PROFILE_NOT_FOUND on bypass-sign-in paths
(userProfileService.updateProfile became upsert-shaped). Bug
4: state machine allowed step-4 completion without step 1
completing (orchestrator guard + onboardingSuffix step-4
prose branch now require completed_steps.includes(1)). Two
regression tests added. 238/238 tests green.

### EC-20 — Combined closeout PASSED (2026-04-19, 90e9dbb)

Single-commit consolidated journal entry covering all three
autonomous smoke runs + three founder-driven browser
scenarios. Four bugs surfaced and fixed across Sessions 5 /
5.1 / 5.2. All browser scenarios (3, 4, 5) pass. One
production-readiness gap documented for Session 7 (no
sign-out affordance in current shell). Mock-vs-Protocol
Invariant Gap convention candidate at 2 datapoints.

### Session 6 — Complete (2026-04-19)

Sub-brief at `docs/09_briefs/phase-1.2/session-6-brief.md`
(frozen at 14b948b after six pre-execution revisions).
Execution landed as commits 2d4c0b8 → c34b9f3 → 6aef5c8 →
e9ffa9e → (Commit 5) on top of 14b948b. All 12 S6 exit
criteria pass. 288/288 tests green (238 baseline + 50 new
across CA-74 through CA-82 — 9 test files; CA-82 added above
the 8-test floor). Convention #8 applied on a third pass
(pre-execution code-grep) and produced one catch: the
sub-brief at §6.5 claimed `invitationService.getByToken`
existed; it did not. Founder-approved Option A landed a
~40-line read-only `previewInvitationByToken` method on the
existing invitationService — a scope-consistent exception to
the sub-brief's "no new service functions" claim. Two
founder review gates applied: Commit 2+3 combined review
closed on backend verification + structural code review
(visual/interactive UX verification deferred to a
post-restart Playwright pass after the mid-session plugin
install); Commit 4 review gate closed on the onboardingSuffix
step-1 prose change without tweaks. Convention #8 refinement
(add "identity assertions" as a fifth verification category)
captured for single-commit codification at Session 7
drafting start. Covers EC-21, EC-23, EC-24, EC-25, EC-26.

### Session 7 — Complete (2026-04-19)

Sub-brief at `docs/09_briefs/phase-1.2/session-7-brief.md`
(frozen at ba9599a). Three feature commits landed same calendar
day as kickoff on top of anchor ba9599a (sub-brief freeze SHA,
per the Session 6 convention):

- **Commit 1** (6904a2f) — params-shape enumeration + locale
  keys + orchestrator-boundary validation. 15 new tests
  (agentTemplateParamsClosure). 303/303.
- **Commit 2** (3abbc7a) — ProposedEntryCard real render +
  schema tightening + /api/agent/reject endpoint + migration
  120 (ai_action_status += 'edited'; rejection_reason →
  resolution_reason). Confirm Branch 2 entry_number enrichment
  per the five-design-question pass. 28 new tests. 331/331.
- **Commit 3** (9be396c) — ProductionChat rewrite (three error
  UI treatments, mount-time conversation fetch, empty-state
  SuggestedPrompts) + /api/agent/conversation GET endpoint
  (hydrate / reconstruct / empty three-branch) + migration 121
  (agent_sessions.turns JSONB additive) + Pre-decision 11b
  orchestrator patch (onboarding-complete org_id update). 13
  new tests. 344/344.

Pre-declared split-point fired as planned: **Commits 4-5
deferred to Session 7.1.** Decision was taken at the Commit 3
design pass when Pre-decision 14 (conversation-resume shape)
pushed Commit 3 budget from ~1.25 day to ~1.5 day; founder
pre-declared the split to simplify decision overhead at
end-of-Commit-3, letting Commit 6 focus cleanly on closeout.
(Retrospective note: the pre-declaration's value isn't proven-
by-firing but by-simplification — day-clock compressed so all
three feature commits landed day 1, but the split was already
baked in.)

Commit 6 (closeout) landed at the SHA anchoring Session 7.1.
Pre-decision 14 derivation, Session 7 retrospective (four
patterns), Session 7.1 handoff, and Session 8 handoff all logged
in `docs/07_governance/friction-journal.md` under the Phase 1.2
Session 7 heading.

### Session 7.1 — Complete (2026-04-19)

Three-sub-session thread (main Shape B DELTA at dc0ee69,
plus two Shape C DELTA-of-DELTA micro-sub-sessions carved
mid-thread). Six commits on top of dc0ee69:

- **53ff280** — `fix(dev): disable broken pino-pretty
  transport under Next.js 15` (dev-experience hygiene
  surfaced by EC-19 manual run).
- **58ade6e** + **a43dd35** — Session 7.1.1 sub-brief +
  `agent.response.natural` template + two-map catalog split
  (P19 / P20 / P21). Added the free-form conversational
  response shape so EC-19 scenario (a) could pass.
- **1388945** + **d66c0c4** — Session 7.1.2 sub-brief +
  Playwright harness (`tests/e2e/`) + EC-19 spec as the
  harness's first use. 369/369 tests green post-landing.
- **39c6d38** — `feat(phase-1.2): Session 7.1 Commit 5 —
  canvas context injection`. Original Commit 5 scope (canvas
  context click handlers + `reduceSelection` reducer +
  `SplitScreenLayout` state lift + `AgentChatPanel` send()
  builds `canvas_context` + two test files) held uncommitted
  across the entire thread and landed last after EC-19
  manual verification cleared.

**EC-19 manual verification** (scenarios a, b, c) all passed
against real Claude at post-a43dd35 code. EC-19b closed;
EC-19a covered by Commit 5's two integration test files.

**Session 7.1 Commit 4 (shell polish)** — AvatarDropdown,
MainframeRail Activity icon, placeholder `actions/page.tsx`,
P15 `currentUserRole` wiring, `avatarDropdownMenuBehavior`
test — **deferred** when EC-19 verification scope widened
(7.1.1 + 7.1.2). Default disposition: lands as Session 8's
opening commit (matching the Session 7 → 7.1 absorption
shape). Session 7.2 as a carve-out remains available if
founder prefers scope isolation at Session 8 kickoff.

Two convention candidates out of the thread, both
overdetermined for Session 8 codification:

- **Convention #9** ("Material gaps surface at layer-
  transition boundaries") — 5 datapoints (P11b, P14, P16
  dual-context rewrite, P19 template-catalog gap, P21
  rationale drift).
- **Convention #10** ("Mutual hallucination-flag-and-retract
  discipline") — 6 datapoints in this thread alone.

New orthogonal finding rolled into Session 8: **Mode B
org_id confusion** — the agent claims "I need the
organization ID" when asked about non-selected entities;
tool-selection gap likely in `listJournalEntries` description.

Shape C sub-brief size calibration: two datapoints at 77 / 85
lines; Session 7 retrospective's "30–60 line" estimate
revised to ~75–95 lines.

Full retrospective (five patterns) + refreshed Session 8
handoff in `docs/07_governance/friction-journal.md` under
the Session 7.1 heading.

### Session 8 C6 prereq O3 — Complete (2026-04-22)

Sub-brief: spec at
`docs/09_briefs/phase-1.2/session-8-c6-prereq-o3-agent-date-context.md`
(5096d21); execution plan at
`docs/09_briefs/phase-1.2/session-8-c6-prereq-o3-execution-plan.md`
(9471a9d). Closed the two prompt-layer bugs surfaced by the
C6 paid-API Entry 1 attempts: Bug A (date hallucination —
agent picked April 2025 for "this month" with today=2026-04-21)
and Bug B (`checkPeriod`-null-return panic).

Two feature commits + one closeout commit on top of 9471a9d:

- **6c407e7** — `fix(agent): Finding O3 Site 1 — temporal
  context injection (Bug A fix)`. New `temporalContext.ts`
  helper wired as a prefix into `buildSystemPrompt`; dual UTC
  + org-local stamps emit the current date (Phase 1.2 route
  ii — UTC-only, Phase 2 will resolve from
  `organizations.timezone`). +6 tests (CA-84 T1–T4 with T4
  parameterized over three personas). 7 existing
  `buildSystemPrompt*`-related test files updated with a
  deterministic `now: Date`.
- **78e9f0d** — `fix(agent): Finding O3 Site 2 — checkPeriod
  null-recovery instruction (Bug B fix, contingency text)`.
  Contingency text applied to `checkPeriodTool.description`
  per Phase A indeterminate fallback (transcript logs absent
  at execution time; contingency's broader trigger is a
  strict superset of primary's, safe under any hypothesis).
  One-sentence temporal nudge appended to
  `postJournalEntryTool.description`. +4 tests (T5/T6 added
  to CA-84; CA-85 description content; CA-86 null-recovery
  orchestrator plumbing regression).
- **Closeout commit (this entry)** — Phase E friction-journal
  entry documenting the O3 retrospective and the
  *Preservation and Ambiguity Gates* convention-catalog
  elevation proposal; this CURRENT_STATE update.

Entry 1 paid-API retry: **clean**. `agent_sessions
45c9ef23-11af-46b3-af4c-39a77384817e`. DR Rent / CR Cash at
2400.00 CAD; `entry_date 2026-04-01` (Bug A observably fixed
— agent picked 2026, not 2025); no UUID leak; no fabricated
context. Bug B's sub-bug-of-A hypothesis directionally
supported by the one clean retry (correct date → valid period
→ no recovery path exercised). Spend: $0.094 (3× the plan's
$0.03/entry estimate; forward-calibrated EC-2 full-run
baseline is $1.80, not the inherited $0.30–$0.80).

Full test suite post-O3 + Prompt 4: 412 passing + 1 failed
(CA-65 `agentSessionOrgSwitchAudit`). Third-pass
attribution resolved in Session M (this session,
2026-04-22): the regression is in the test's cleanup
pattern, not in any emit-code change. The test's
`beforeEach`/`afterEach` `audit_log.delete()` calls worked
when `da4641e` (Session 4, 2026-04-18) wrote the test, but
commit `1b18dab` (2026-04-21) installed INV-AUDIT-002's
append-only triggers that silently reject the delete. Rows
from the first `it` block persisted into the second, causing
the second block to see 2 rows under a describe-scoped
`trace_id` filter. Fix pattern: same as `dc757c3`
(per-test `trace_id` + drop `audit_log.delete()`). Applied
in this commit. `pnpm agent:validate` green at the Phase D
pre-flight check.

Phase E convention-catalog elevation proposal: *Preservation
and Ambiguity Gates* (three datapoints crossing the
two-datapoint threshold). See friction-journal Phase C
section (b) for the locked language. Adjacent observation
flagged for EC-2 full-run prerequisite: `source: "manual"` in
the agent's `tool_input` may need orchestrator
overwrite-to-`agent` at post-time for EC-2 pass criterion
(a) to not false-negative.

### Session 8 mid-arc closeout — O3 + C9 + C8 throughline (2026-04-22)

Today's working session shipped four arcs across five commits, all
on `staging` on top of plan-anchor 9471a9d. Session 8 backlog
(C7, C10, C11, C12, EC-2 full run) remains open and carries
forward to next working session.

**O3 — Bug A + Bug B prompt-layer fixes** (3 commits):

- **6c407e7** — `fix(agent): Finding O3 Site 1 — temporal context
  injection (Bug A fix)`. Dual UTC + org-local current-date prefix
  block via new `temporalContext.ts` helper. +6 tests (CA-84
  T1–T4, T4 parameterized over three personas).
- **78e9f0d** — `fix(agent): Finding O3 Site 2 — checkPeriod
  null-recovery instruction (Bug B fix, contingency text)`.
  Recovery instruction in `checkPeriodTool.description` + temporal
  nudge in `postJournalEntryTool.description`. Contingency text
  per Phase A indeterminate fallback (transcript logs absent at
  execution time; contingency's broader trigger is a strict
  superset of primary's). +4 tests (T5/T6 added to CA-84; CA-85;
  CA-86).
- **3e7dae4** — `docs(friction): Phase C O3 closeout +
  Preservation and Ambiguity Gates convention proposal`.
  Friction-journal Phase C entry. Load-bearing output:
  convention-catalog elevation proposal (codified in C9 below).
  CURRENT_STATE.md updated with O3 — Complete entry.

Entry 1 paid-API retry: clean. `agent_sessions
45c9ef23-11af-46b3-af4c-39a77384817e`. DR Rent / CR Cash at
2400.00 CAD; `entry_date 2026-04-01` (Bug A observably fixed).
Spend $0.094.

**C9 — convention-catalog codification** (1 commit):

- **a610e0e** — `docs(conventions): codify three new Phase 1.2
  conventions from O3 retrospective`. Three new conventions added
  to `docs/04_engineering/conventions.md` under existing `## Phase
  1.2 Conventions` section: "Re-verify Environmental Claims at
  Each Gate", "Preservation and Ambiguity Gates", "Erase-to-Clean
  vs. Document-to-Verify". Family-clustered with the existing
  "Check HEAD before Step 2 Plan" entry (parallel-commit-
  robustness siblings). All three above the two-datapoint
  codification threshold; locked language cross-references
  friction-journal Phase C section (b) for evidence.

**Source: "manual" investigation** (read-only arc; no commit produced):

EC-2 pass criterion (a) prerequisite. Finding:
`src/app/api/agent/confirm/route.ts:134` hardcodes
`source: 'agent'` at post-replay time via
`{ ...toolInput, dry_run: false, source: 'agent' }`
spread-then-override. Posted journal_entries rows carry
`source='agent'` regardless of the agent's tool_input emission.
EC-2 pass criterion (a) cannot false-negative on this surface. No
commit produced — the arc's charter was investigate-and-classify,
benign outcome meant no fix warranted. Flagged here because the
arc cleared an EC-2 prereq and deserves record in the session's
throughline.

**C8 — Mode B listJournalEntries fix** (1 commit):

- **bd5cd75** — `feat(phase-1.2): Session 8 Commit 8 — Mode B
  listJournalEntries description + persona hint`. Per
  session-8-brief.md P36. Tool description amended (3-clause
  structure, system-wide org_id anchoring, agent-invisibility
  honesty per CA-54 awareness); new `TOOL_SELECTION_HINTS` shared
  constant composed into all three persona prompts immediately
  after `ANTI_HALLUCINATION_RULES`; CA-87 regression test
  (mock-orchestrator pattern, same family as CA-86). Test-scope
  limitation acknowledged in test header — guards plumbing, not
  real-Claude prompt-contract behavior; behavioral validation
  deferred to C7 EC-13 adversarial run.

**Spend tally:** $0.094 (Entry 1 paid-API retry). Cumulative
Session 8 spend: $0.20 of $5.00 ceiling. Forward-calibrated EC-2
full-run baseline: $1.80 (20 entries × $0.09); halt thresholds
unchanged ($3 cumulative / $0.50 single-call). The pre-O3 P34
estimate of $0.30–$0.80 full run was written before O3's expanded
system prompt; $1.80 is the corrected baseline for the next
paid-API approval gate.

**Convention candidate logged below threshold: metabolic-load
formulation.** Pattern: small arcs have two distinct cost curves
— ride-on-prior-hard-work arcs (e.g., C9 codifying O3's Phase E
drafts) cost less in the *sustained-design-thinking* class;
targeted-investigation arcs (e.g., source-manual) cost less in
the *attention-to-detail* class. Same "small arc" label,
different cognitive surfaces. Disposition: single datapoint today
(C9 ride-on-prior-work); awaiting a second instance before
codification. When the second datapoint arrives, the two cost
curves should be named distinctly rather than collapsed into one
"small arc" category.

**Deferred to next working session, with dispositions:**

- **C7 EC-13 adversarial run** — paid-API arc; needs fresh
  approval gate; not a fit for compressed end-of-session attention
  budget.
- **C10 27-EC matrix reconciliation** — synthesis-heavy; benefits
  from fresh-session attention.
- **C11 Phase 1.2 retrospective** — large authored artifact
  (~700–1000 lines per session-8-brief.md P39); benefits from
  fresh-session attention.
- **C12 Session 8 + Phase 1.2 closeout** — gated on C7/C10/C11
  completion per session-8-brief.md spec; this mid-arc closeout
  deliberately does not co-opt the C12 name.
- **EC-2 full run** — paid-API; prereq cleared per source-manual
  investigation; needs fresh approval gate at $1.80 calibrated
  baseline.

**No action pending on cross-session coordination.** If audit
session or Prompt 4 session resumes and produces new commit
activity or push intent, that's the trigger to revisit; otherwise
no action required. Branch ahead-count cross-referenced in the
push-decision section below.

**Push decision (resolved: held, with three named unhold conditions):**

At commit time: +9 ahead of `origin/staging`. This count is a
point-in-time snapshot; future readers should cross-reference
with `git log origin/staging..staging` at read time rather than
trusting the number. Today's O3/C9/C8 commits co-exist with
audit-session commits (`c24d69d`, `85f4b3b`) and Prompt-4-session
commits (`dc757c3`, `66118ac`) in the same branch. A `git push`
from this context would land all 9 under a single push event,
collapsing per-session attribution. Disposition: do not push from
this session's context. Any one of the three conditions below
resolves the hold (the push action itself still requires explicit
go-ahead from the operator at the time):

- **(a) Audit session and Prompt 4 session both confirmed as not
  expecting to push their own commits separately.** How to
  confirm: check session-handoff docs or resume prompts from
  those sessions for push-intent language; absence of such
  language treats the coordination question as resolved.
- **(b) Enough time has passed that the other sessions'
  push-intent is moot** (e.g., a week — if those sessions haven't
  pushed by then, they aren't going to).
- **(c) A new arc requires pushing for arc-specific reasons** (CI
  on a PR, collaborator needing access, etc.) making the
  coordination question moot by necessity.

**Full retrospective:** see
`docs/07_governance/friction-journal.md` Phase C — O3 closeout
(2026-04-22) for the load-bearing analysis of today's arcs,
including the convention-catalog elevation that landed in C9,
the meta-pattern datapoints (exonerate-via-cleanup three
instances + four symmetric-application instances), the
architectural-strength observation on template-driven narrational
wrappers, and the open questions queued for future arcs.

### Session M (coord arc) — disambiguation note

The "Session M" label was used by the 2026-04-22 conversation
that codified the coordination mechanism (Session Labeling +
Session Lock File Conventions in `918e68a`) and the three
follow-on commits documenting and amending it: `c12513a`
(friction-journal Phase C (g)), `00afe82` (env-inheritance
handshake amendment), and `4372d65` (CA-65 cleanup + third-pass
attribution correction).

If a later session uses the label "M" — formally via
`session-init.sh M` or colloquially in prose — that session is
distinct from this one. Disambiguate by date range and commit
SHA: the coord arc's Session M ran 2026-04-22 and owns the four
commits named above. Future "M" sessions should pick a more
specific label (date-stamped or arc-descriptive, per the
Session Labeling Convention) to avoid the collision this note
exists to resolve.

---

## Agent Autonomy Design Sprint — Documented (2026-04-16)

Multi-round design review with two external CTOs produced the
trust model, three-path entry architecture, and canonical Intent
Schema for The Bridge. Four-phase documentation sprint captured
the outcomes:

- **Phase A** — friction-journal entry + Q23–Q26 registered in
  `open_questions.md` (defaults accepted).
- **Phase B** — three new specs (`agent_autonomy_model.md`,
  `intent_model.md`, `mutation_lifecycle.md`), extension of
  `ui_architecture.md`, and new `agent_interface.md`.
- **Phase C** — ADRs 0002 through 0006 (confidence as policy
  input, one-voice architecture, ghost rows visual contract,
  three-path intent schema, agent persona unnamed).
- **Phase D** — nine Phase 2 brief stubs capturing deferred
  patterns, CLAUDE.md navigation updated, cross-reference sweep.

Phase 1.2 implementation work is now unblocked. The Phase 1.2
brief at `docs/09_briefs/phase-1.2/agent_architecture.md` will
be reconciled against ADR-0002 (confidence display) during
Phase 1.2 execution.

---

## Phase 1.5 — Complete (2026-04-16)

All three sub-phases shipped:
- **1.5A** (org profile): 4 migrations, 25 new tests
- **1.5B** (users/invites/MFA): 4 migrations, 27 new tests
- **1.5C** (permissions refactor): 2 migrations, 26 new tests

Grand total: 10 migrations (108–117), 162 tests across 36 files,
0 failures. Exit criteria matrices at:
- `docs/09_briefs/phase-1.5/exit-criteria-matrix.md` (1.5A)
- `docs/09_briefs/phase-1.5/1.5B-exit-criteria-matrix.md`
- `docs/09_briefs/phase-1.5/1.5C-exit-criteria-matrix.md`

---

## Phase 1.5C — Permissions Refactor (complete, 2026-04-16)

Execution brief at `docs/09_briefs/phase-1.5/1.5C-brief.md`.
12 exit criteria MET, 162 tests across 36 files. Replaced
`ROLE_PERMISSIONS` TypeScript map with table-driven `roles`,
`permissions`, `role_permissions` (seeded, hybrid model). Added
`memberships.role_id` via two-step backfill. Rewrote
`canUserPerformAction` to SQL lookup. Added `user_has_permission()`
SQL helper. `ACTION_NAMES` runtime constant with parity test.

---

## Phase 1.5B — Users, Invitations, and MFA Enforcement (complete, 2026-04-15)

Execution brief at `docs/09_briefs/phase-1.5/1.5B-brief.md`.
Second of three sub-phases (1.5A complete, 1.5B this brief, 1.5C
permissions refactor).

**1.5B scope:** `user_profiles` table (auto-created on first login),
`org_invitations` table (hashed-token invitation flow, 7-day
expiry), `memberships` lifecycle extension (`status` column:
active/invited/suspended/removed + `is_org_owner` partial unique),
MFA enforcement middleware (redirect to TOTP enrollment when org
requires MFA), login/logout audit events, 12 new API routes, 4 new
ActionName permission keys, 10 new audit action keys, 13 Category A
floor tests.

**1.5B out-of-scope:** email delivery for invitations, avatar upload
UI, ownership transfer, MFA recovery codes, expired invitation
cleanup cron.

---

## Phase 1.5A — Organization Profile Expansion (complete, 2026-04-15)

21 exit criteria MET, 109 tests across 20 files, 4 migrations,
8 API endpoints. Exit criteria matrix at
`docs/09_briefs/phase-1.5/exit-criteria-matrix.md`.

Execution brief at `docs/09_briefs/phase-1.5/brief.md`.
This sub-phase (first of three — 1.5A additive org schema,
1.5B users/invites/MFA, 1.5C permissions refactor) precedes
Phase 1.2 agent integration because the agent design depends on
the expanded org profile, typed `external_ids`, and granular
`source_system` tracking on journal entries.

**1.5A shipped:** 4 migrations (industries lookup + 28-row seed,
organizations extension with two-step `industry_id` backfill,
`organization_addresses` with partial-unique primary index,
`journal_entries` source tracking with partial-unique triple
index), 3 Zod schemas, 6 service functions, 8 API routes, 12
new error codes, 5 new ActionName values. Conventions established:
imperative-verb permission keys vs past-tense audit action keys;
camelCase API boundary with snake_case DB mapping; null
`before_state` for insert audit rows.

**1.5A out-of-scope (deferred):** MFA enforcement logic, reporting
behavior changes, user/invite system, UI work,
`organizations.industry` legacy enum column drop, NAICS code
population, onboarding state machine.

## Phase 1.1 is functionally complete.

Task 18 (final verification) produced four deliverables:
- Exit criteria matrix: 42 MET / 6 DEFERRED / 3 N/A / 0 MISSED
- Schema reconciliation: clean (one non-blocking drift — stale types.ts)
- Test coverage catalog: 26 integration + 49 unit tests documented
- Phase 1.2 obligations: must-do items + 5 elevated patterns

## What Phase 1.1 ships

- Journal entries: create, list, detail, reversal (full CRUD cycle)
- Chart of Accounts: seeded per industry template
- Reports: P&L (revenue/expense/net income) + Trial Balance (per-account
  with balanced footer) via RPC functions
- RLS: cross-org isolation, role-based permissions
- 7 migrations, 26 integration tests, 49 unit tests
- Multi-tenant routing, i18n (en/fr-CA/zh-Hant), sign-in/sign-out
- Audit log with trace_id propagation

## What Phase 1.2 inherits

See docs/09_briefs/phase-1.2/obligations.md for the full list. Key items:
- Agent integration (orchestrator, tools, canvas context)
- Form UX polish (period defaults, dropdown placeholders)
- Balance Sheet report
- Regenerate types.ts, add API route tests
- Document Sync (PLAN.md audit)

## Remaining sessions

1. **Document Sync** — dedicated session for PLAN.md folder tree
   audit, stale reference grep, §18 Open Question resolution
2. **Closeout retrospective** — dedicated writing session summarizing
   patterns, calibration data, and process insights from 18 tasks

## Counts

- Migrations: 7 (001-007)
- Integration tests: 26 (7 files)
- Unit tests: 49 (4 files)
- Friction journal entries: 40+
- Subagent tasks: 5 (all zero structural drift)
- Total closeout commits: ~50 across Tasks 1-18

## Seed passwords (all end in #1)

- executive@thebridge.local / DevSeed!Executive#1
- controller@thebridge.local / DevSeed!Controller#1
- ap@thebridge.local / DevSeed!ApSpec#1

## Dev server rule

Kill before rm -rf .next, or restart after.
