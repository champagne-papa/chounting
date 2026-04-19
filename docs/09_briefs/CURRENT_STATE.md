# Where I am as of 2026-04-19 (Phase 1.2 Session 7 shipped; Session 7.1 next)

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

### Session 7.1 — Sub-brief needed, ready to draft

Carried forward from Session 7's pre-declared split. Scope:
Commits 4+5 from Session 7 original sub-brief — shell polish
(avatar dropdown + Activity icon + placeholder review-queue
page) and canvas context click handlers + EC-19 tests. Plus
three carryovers from Commit 3's non-blocking observations:
currentUserRole prop wiring on SplitScreenLayout, canvas
navigation on Approve (ProposedEntryCard `onNavigate`), and
SplitScreenLayout state lift (Pre-decision 9 shape).

Estimate ~1 day. Anchor SHA: Session 7 Commit 6 SHA. Full
scope + carryovers + EC coverage detail in the Session 7.1
handoff entry in the friction journal.

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
