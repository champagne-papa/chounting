# Where I am as of 2026-04-16 (Phase 1.2 in flight)

## Phase 1.2 — The Double Entry Agent (in flight)

Execution brief at `docs/09_briefs/phase-1.2/brief.md`. The Double
Entry Agent end-to-end: conversational journal entries, onboarding
flow, ProposedEntryCard with policy-outcome language (ADR-0002),
canvas context injection, form-escape surfaces for profile/org/
invite management. 9 tools, 3 persona prompts, 27 exit criteria
(19 from phase_plan.md + 8 new for onboarding/forms/migration).

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
