# Where I am as of 2026-04-18 (Phase 1.2 Session 4 ready to execute)

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

### Session 5 — Ready to execute (2026-04-18)

Sub-brief at `docs/09_briefs/phase-1.2/session-5-brief.md`.
Scope: master §11 onboarding flow — state machine
(`OnboardingState` on `agent_sessions.state.onboarding`),
extended `onboardingSuffix` with step-aware instructions,
`buildSystemPrompt` threading, orchestrator state-read + four
transition handlers (step 1 on display_name set, steps 2+3 on
createOrganization success, step 4 on respondToUser with
`agent.onboarding.first_task.navigate` template_id), welcome
page at `src/app/[locale]/welcome/page.tsx` (server component,
minimal functional — Session 7 polishes), sign-in redirect
logic, `AgentChatPanel` prop contract `{ orgId: string | null }`.
11 S5 exit criteria, 7+ new CA tests (CA-67 through CA-73),
5-commit cadence with commit-1 founder review gate for the
extended onboardingSuffix prose. Eight founder pre-decisions:
(1) minimal welcome no Session-7 imports; (2) AgentChatPanel
contract locked; (3) invited-user detection via server
component; (4) step-4 completion is a state flag flip (not
canvas_directive — defers first canvas_directive use to
Session 6/7); (5) step 1 completes when display_name is set;
(6) resolvePersona stub confirmed as master decision A; (7)
test delta is a floor; (8) step-4 signal is the respondToUser
template_id pattern (drafting decision, Options B+C rejected).
No new migrations, tools, deps, ActionNames, or ServiceError
codes.

Sessions 6–8 sub-briefs land as each predecessor session closes out.

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
