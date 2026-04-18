# Phase 1.2 Session 1 Execution Sub-Brief — Foundational Groundwork

*This sub-brief drives Session 1 of Phase 1.2. The Phase 1.2 master
brief at `docs/09_briefs/phase-1.2/brief.md` (frozen at SHA aae547a)
is the architecture document and is **never** modified during
execution. This sub-brief cites specific master-brief sections; it
does not restate their content. Where this sub-brief and the master
brief disagree, the master brief wins — stop and flag the
contradiction rather than deviating.*

---

## 1. Goal

Session 1 lands migrations 118 and 119, installs two new
dependencies, adds one ActionName with its permission seed rows,
migrates the `ProposedEntryCard` TypeScript type to the ADR-0002
shape, and regenerates `src/db/types.ts` — producing a clean working
tree where `pnpm db:reset && pnpm test` passes with zero regressions
and `agent_sessions` has its Phase 1.2 shape (`conversation` JSONB
column present, `org_id` nullable for onboarding). No Anthropic API
is called. No new services, no new API routes, no agent code.

---

## 2. Master-brief sections implemented

Session 1 delivers:

- **§4.1** — Migration 118 (`agent_sessions` + `ai_actions`
  wiring + `user.profile.update` permission seed folded in)
- **§4.2** — Migration 119 (placeholder — form fixes are front-end)
- **§9.1** — `agent_sessions` post-1.2 schema (via migration 118)
- **§9.4** — `agent_sessions` RLS (verified — no changes needed)
- **§10.1** — `ProposedEntryCard` type shape (TypeScript type only;
  component rewrite is Session 7)
- **§16** — `user.profile.update` ActionName + permissions row +
  role grants for all three roles
- **§18** — New dependencies (`@anthropic-ai/sdk`,
  `zod-to-json-schema`)
- **§20** — Schema criteria S1, S2

Sections NOT delivered in Session 1 (pointers to the session that
does):

- §5 Agent Architecture → Session 2
- §6 Tools → Sessions 2, 4
- §7 System Prompts → Session 3
- §8 OrgContextManager → Session 4
- §10.2–10.3 `ProposedEntryCard` component rewrite + Four Questions
  rendering → Session 7
- §11 Onboarding Flow → Session 5
- §12 Form-Escape Surfaces → Session 6
- §13 API Routes → Sessions 2, 4
- §14 UI Changes → Session 7
- §15 Canvas Directive Extensions → Session 6
- §17 Error Codes → Session 2
- §21 Test Catalog (CA-39 through CA-49) → Sessions 4–8

---

## 3. Locked Decisions (inherited)

All decisions derive from master §3. **This session re-opens
nothing.** If an execution-time question arises that is not covered
by master §3 or a locked founder decision, stop and flag it in
`docs/02_specs/open_questions.md`.

---

## 4. Prerequisites

- Git at SHA **aae547a**, clean working tree. Verify with
  `git status --short` (expected empty) and
  `git rev-parse --short HEAD` (expected `aae547a`).
- `pnpm install` succeeds from the current lockfile.
- `pnpm db:reset` succeeds against the current migration set.
- Session-start friction-journal entry written at
  `docs/07_governance/friction-journal.md` (established cadence).
- `ANTHROPIC_API_KEY` is **not** required for Session 1 execution.
  The key may be added to `.env.local` in preparation for Session 4,
  but Session 1 performs no API calls.

---

## 5. Work items

Five work items. The permission seed is folded into migration 118
(matching the 1.5C precedent — migration 116 combined the
`permissions`/`role_permissions` schema and the initial 16-row
catalog in a single file). Do **not** split the schema change and
the permission row into two migrations.

### 5.1 Install dependencies

Exact commands, in order:

```bash
pnpm add @anthropic-ai/sdk
pnpm add zod-to-json-schema
```

After install, record the pinned versions in the friction journal
(both runtime dependencies — not devDependencies — per master §18).

### 5.2 Create migration 118

**File path:** `supabase/migrations/20240118000000_agent_session_wiring.sql`

Single migration containing **six** operations in one
`BEGIN/COMMIT`. No RLS changes (master §9.4 verified: the existing
`user_id = auth.uid()` SELECT policy from migration 001 covers
Session 1's use case without modification).

```sql
-- =============================================================
-- 20240118000000_agent_session_wiring.sql
-- Phase 1.2 Session 1: agent_sessions conversation column,
-- nullable org_id, supporting indexes, user.profile.update seed.
-- See docs/09_briefs/phase-1.2/brief.md §4.1 and §9.1.
-- =============================================================

BEGIN;

-- Issue 3 resolution (master §9.1): onboarding sessions exist
-- before the user creates/joins an org.
ALTER TABLE agent_sessions ALTER COLUMN org_id DROP NOT NULL;

-- Chat transcript column. See master §9.2 for the shape.
ALTER TABLE agent_sessions
  ADD COLUMN conversation jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Orchestrator's per-message session lookup (master §5.2 step 1).
CREATE INDEX IF NOT EXISTS idx_agent_sessions_active
  ON agent_sessions (user_id, org_id, last_activity_at DESC);

-- AI Action Review queue sorted by creation time.
CREATE INDEX IF NOT EXISTS idx_ai_actions_org_created
  ON ai_actions (org_id, created_at DESC)
  WHERE status IN ('pending', 'confirmed');

-- user.profile.update permission row. sort_order 170 continues
-- the 10-step sequence that ended at 160 (user.remove) in
-- migration 116. Category 'Users' matches existing user.* keys.
INSERT INTO permissions (permission_key, display_name, category, sort_order)
VALUES ('user.profile.update', 'Update own user profile', 'Users', 170);

-- All three roles receive the grant (every user may edit their
-- own profile regardless of role). Precedent: ai_actions.read
-- in migration 116 is granted to all three roles.
INSERT INTO role_permissions (role_id, permission_key)
SELECT r.role_id, 'user.profile.update'
FROM roles r
WHERE r.role_key IN ('controller', 'ap_specialist', 'executive');

COMMIT;
```

**Blast radius (confirmed zero):** `agent_sessions` has no writes
anywhere in `src/`, `tests/`, or the seed (`grep -rn "INSERT INTO
agent_sessions" src/ tests/ supabase/ src/db/seed/` returns
nothing). The `conversation` column has a DEFAULT; no backfill
needed. The `permissions` and `role_permissions` tables are seeded
only by migrations 116 and 117 and are not touched by
`src/db/seed/dev.sql`.

### 5.3 Create migration 119

**File path:** `supabase/migrations/20240119000000_journal_entry_form_fixes.sql`

Placeholder migration per master §4.2. The journal entry form UX
fixes are front-end only (fiscal period default, dropdown disabled
option, per-line description wiring). This empty migration exists
so the sequence is contiguous and the change is discoverable via
`supabase migration list`.

```sql
-- =============================================================
-- 20240119000000_journal_entry_form_fixes.sql
-- Phase 1.2: UX fixes from journal_entry_form_gaps.md.
--
-- No schema changes. The fixes (fiscal period default, dropdown
-- disabled option, per-line description wiring) are pure
-- front-end. This migration exists so the sequence is contiguous
-- and the change is discoverable via `supabase migration list`.
--
-- See docs/09_briefs/phase-1.2/brief.md §4.2.
-- =============================================================

BEGIN;

-- Intentionally empty.

COMMIT;
```

### 5.4 Update ACTION_NAMES and CA-28 assertions

Two code changes that keep the permissions catalog consistent with
the TypeScript source of truth. Both must land **after** migration
118 has applied (`pnpm db:reset` already advances the DB state).

**5.4(a) Add to ACTION_NAMES.** File:
`src/services/auth/canUserPerformAction.ts`. Append
`'user.profile.update'` to the `ACTION_NAMES` tuple (currently 16
entries, becomes 17). The existing code comment at lines 13–15 is
authoritative: "A parity test (CA-27) asserts set-equality between
ACTION_NAMES and the permissions table. Adding a new permission
requires updating ACTION_NAMES AND seeding a permissions row in a
migration." Session 1 does both.

**5.4(b) Update CA-28 hardcoded counts.** File:
`tests/integration/permissionCatalogSeed.test.ts`. CA-28
(`permissionCatalogSeed.test.ts`) asserts exact permission counts
and hardcoded permission-key lists. Adding `user.profile.update`
breaks four assertions. Update them to the post-118 values:

| Assertion | Current | Post-118 |
|---|---|---|
| `16 permissions exist` | `expect(data).toHaveLength(16)` | `expect(data).toHaveLength(17)` |
| `controller has all 16 permissions` | `expect(perms).toHaveLength(16)` | `expect(perms).toHaveLength(17)` (rename the `it` description too) |
| `ap_specialist has exactly 3 permissions` | length 3, list `['ai_actions.read', 'chart_of_accounts.read', 'journal_entry.post']` | length 4, list `['ai_actions.read', 'chart_of_accounts.read', 'journal_entry.post', 'user.profile.update']` (rename `it` description) |
| `executive has exactly 3 permissions` | length 3, list `['ai_actions.read', 'audit_log.read', 'chart_of_accounts.read']` | length 4, list `['ai_actions.read', 'audit_log.read', 'chart_of_accounts.read', 'user.profile.update']` (rename `it` description) |

Modifying existing test assertions to reflect updated catalog state
is **not** adding new tests (§7 below). It is maintaining the
parity invariant that CA-28 encodes.

CA-27 (`permissionParity.test.ts`) requires no edit — it computes
set-equality dynamically from `ACTION_NAMES` and the `permissions`
query, so it passes automatically once both sides carry
`user.profile.update`.

### 5.5 Migrate the `ProposedEntryCard` TypeScript type

**File:** `src/shared/types/proposedEntryCard.ts`. Replace the
Phase 1.1 shape (type-only file, 28 lines) with the post-1.2 shape
per master §10.1. The new shape:

```typescript
// src/shared/types/proposedEntryCard.ts
// Post-Phase-1.2 shape per master brief §10.1 and ADR-0002.
// The confidence_score field exists for internal logging and
// Logic Receipt storage but is never rendered in any UI
// component. policy_outcome is the user-facing surface.

export type ProposedEntryLine = {
  account_code: string;
  account_name: string;
  debit: string;          // MoneyAmount (was: number in Phase 1.1)
  credit: string;         // MoneyAmount (was: number in Phase 1.1)
  currency: string;
  description?: string;   // NEW
  tax_code?: string;      // NEW
};

export type ProposedEntryCard = {
  org_id: string;
  org_name: string;
  transaction_type: 'journal_entry' | 'bill' | 'payment' | 'intercompany';
  entry_date: string;     // NEW (ISO date)
  description: string;    // NEW
  vendor_name?: string;
  matched_rule_label?: string;
  lines: ProposedEntryLine[];
  intercompany_flag: boolean;
  reciprocal_entry_preview?: unknown;
  confidence_score: number;  // RENAMED from 'confidence' enum
  policy_outcome: {          // NEW
    required_action: 'approve';
    reason_template_id: string;
    reason_params: Record<string, unknown>;
  };
  routing_path?: string;
  idempotency_key: string;
  dry_run_entry_id: string;
  trace_id: string;       // NEW
};
```

**Removed:** `agent_reasoning: string` and the
`confidence: 'high' | 'medium' | 'low' | 'novel'` enum. Both are
dropped from the shape entirely per master §10.1.

**Component shim.** The old `src/components/ProposedEntryCard.tsx`
references `card.confidence` on line 25 (no `agent_reasoning` read
exists in the component — confirmed by
`grep -n 'confidence\|agent_reasoning' src/components/ProposedEntryCard.tsx`).
The component rewrite lands in Session 7; Session 1 makes the
smallest possible change to keep `pnpm typecheck` green:

- Replace `{card.confidence}` with the literal string `'—'` plus a
  TODO comment:
  `// TODO(session-7): render policy_outcome.reason_template_id via next-intl (master §10.3)`
- The surrounding "Proposed Entry — Phase 1.2 Will Implement This"
  placeholder copy stays. Visual appearance may degrade (the chip
  renders as a dash); that is acceptable for Session 1. The
  component is a placeholder shell; Session 7 replaces it entirely.

If the shim produces any additional typecheck errors beyond the
single `card.confidence` reference, stop and flag — the brief
expected zero other usages.

### 5.6 Regenerate `src/db/types.ts`

Run `pnpm db:generate-types` after migration 118 applies (i.e.,
after `pnpm db:reset`). Verify in the regenerated file:

- `agent_sessions.Row.conversation: Json` is present
- `agent_sessions.Row.org_id: string | null` (was `string`)
- `agent_sessions.Insert.org_id?: string | null`
- `agent_sessions.Update.org_id?: string | null`

Commit the regenerated file as part of commit 2 (§10 below).

---

## 6. Exit Criteria

All criteria prefixed `S1-` to disambiguate from master `EC-*` and
the Phase 1.5 `CA-*` numbering.

| # | Criterion | Verification |
|---|---|---|
| S1-1 | Migration 118 applied; `agent_sessions.conversation` column exists, NOT NULL | `psql -c '\d agent_sessions'` shows `conversation jsonb NOT NULL` |
| S1-2 | Migration 118 applied; `agent_sessions.org_id` is nullable | `psql -c '\d agent_sessions'` shows `org_id uuid` with no `NOT NULL` marker |
| S1-3 | Migration 119 applied (empty placeholder) | `supabase migration list --local` includes `20240119000000` |
| S1-4 | `user.profile.update` present in `ACTION_NAMES` | `grep "'user.profile.update'" src/services/auth/canUserPerformAction.ts` returns a hit |
| S1-5 | ACTION_NAMES ↔ permissions table set-equality | `pnpm test -- tests/integration/permissionParity.test.ts` exits 0 |
| S1-6 | `user.profile.update` in `role_permissions` for all 3 roles | `psql -c "SELECT r.role_key FROM role_permissions rp JOIN roles r ON rp.role_id = r.role_id WHERE rp.permission_key = 'user.profile.update' ORDER BY r.role_key"` returns 3 rows: `ap_specialist`, `controller`, `executive` |
| S1-7 | CA-28 catalog counts updated | `pnpm test -- tests/integration/permissionCatalogSeed.test.ts` exits 0 |
| S1-8 | `@anthropic-ai/sdk` installed | `pnpm list @anthropic-ai/sdk` prints a pinned version |
| S1-9 | `zod-to-json-schema` installed | `pnpm list zod-to-json-schema` prints a pinned version |
| S1-10 | `ProposedEntryCard` type migrated; typecheck passes | `pnpm typecheck` exits 0 |
| S1-11 | `src/db/types.ts` regenerated with new `agent_sessions` shape | `grep -n 'conversation' src/db/types.ts` returns a hit in the `agent_sessions` block |
| S1-12 | Full regression clean | `pnpm test` passes with 0 failures |

**S1-6 SQL note:** `role_permissions` uses `(role_id,
permission_key)` as its composite primary key — **not** a
`permission_id` FK. Verify by reading migration
`20240116000000_permission_catalog.sql` lines 76–81 before
constructing the query.

---

## 7. Test delta

Session 1 adds **no new Vitest specs**. Every S1-N criterion is
verified by the commands in §6, not by new tests.

Two existing specs are **modified**, not added:
- `tests/integration/permissionCatalogSeed.test.ts` (CA-28) —
  hardcoded counts bumped from 16→17 and list membership updated
  per §5.4(b).

No other test files should change. If execution surfaces another
failing test during the final `pnpm test`, stop and flag — the
scope of Session 1 does not include fixing unrelated test drift.

---

## 8. What is NOT in Session 1

Explicit out-of-scope list:

- No new services (no `src/services/agent/**`, no orchestrator
  scaffolding)
- No new API routes (`/api/agent/message`, `/api/agent/confirm`
  land in Session 2)
- No agent code — no orchestrator, no tools, no system prompts, no
  OrgContextManager
- No `ProposedEntryCard.tsx` component rewrite (shim only —
  Session 7 writes the real render)
- No Anthropic SDK integration code (the dep is installed but not
  imported anywhere)
- No onboarding flow wiring (Session 5)
- No form-escape surfaces (Session 6)
- No i18n template additions (Session 3 lands
  `proposed_entry.*` keys)
- No new tests (§7)
- No ADR-0007 (`dry_run` scope) — master §6.5 flags it for a
  future session

---

## 9. Stop Points for This Session

The execution session produces the following artifacts:

- `supabase/migrations/20240118000000_agent_session_wiring.sql`
- `supabase/migrations/20240119000000_journal_entry_form_fixes.sql`
- `src/services/auth/canUserPerformAction.ts` — `ACTION_NAMES`
  updated
- `tests/integration/permissionCatalogSeed.test.ts` — CA-28 counts
  updated
- `src/shared/types/proposedEntryCard.ts` — migrated to §10.1
  shape
- `src/components/ProposedEntryCard.tsx` — one-line shim + TODO
- `src/db/types.ts` — regenerated
- `package.json` + `pnpm-lock.yaml` — new deps
- Friction-journal entry with Session 1 summary, pinned dep
  versions, and starting model string

Stop after all 12 S1 exit criteria pass and the friction journal is
updated. Do **not** begin Session 2.

---

## 10. Commit plan

Four commits. This is a recommendation — if execution surfaces a
reason to split, split by feel, but every commit must leave
`pnpm typecheck && pnpm test` green.

- **Commit 1** — `build: install @anthropic-ai/sdk and zod-to-json-schema`
  Files: `package.json`, `pnpm-lock.yaml`. Green: typecheck and
  existing tests still pass (the new deps are unused).
- **Commit 2** — `db(phase-1.2): migration 118 — agent_session wiring + user.profile.update permission`
  Files: `supabase/migrations/20240118000000_agent_session_wiring.sql`,
  `src/db/types.ts` (regenerated). At this commit, **CA-27 and
  CA-28 fail** (DB has 17 permissions but ACTION_NAMES still has
  16, and CA-28 hardcodes 16). **This commit alone does not pass
  `pnpm test`** — commits 2 and 3 must land together in the same
  session push, or the intermediate state must not reach CI.
- **Commit 3** — `feat(phase-1.2): add user.profile.update ActionName + update CA-28 counts`
  Files: `src/services/auth/canUserPerformAction.ts`,
  `tests/integration/permissionCatalogSeed.test.ts`. Green:
  CA-27 and CA-28 pass again. This commit closes the parity gap
  opened in commit 2.
- **Commit 4** — `types(phase-1.2): migrate ProposedEntryCard to ADR-0002 shape + Session 7 shim + migration 119`
  Files: `src/shared/types/proposedEntryCard.ts`,
  `src/components/ProposedEntryCard.tsx` (shim),
  `supabase/migrations/20240119000000_journal_entry_form_fixes.sql`.
  Green: typecheck and full `pnpm test`.

Commits 2 and 3 are coupled — the intermediate state between them
is red. Keep them in the same session push. Committing atomically
as one commit is also acceptable if the four-commit cadence feels
wrong during execution.

---

*End of Phase 1.2 Session 1 Sub-Brief.*
