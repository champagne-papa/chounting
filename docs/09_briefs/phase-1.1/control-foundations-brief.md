# Phase 0–1.1 — Control Foundations: Closing the Gaps

*This brief consolidates the 2026-04-20 CTO review into a shippable
work package. It sits alongside `docs/09_briefs/phase-1.1/brief.md`
(the Phase 1.1 closeout) and is strictly a control-foundations
follow-on to 1.1 — not part of Phase 1.2, and not Phase 1.3. It is
the hardening pass against the Phase 0 + 1 checklist: audit
completeness, trial-balance server-side validation, period
lock/unlock, balance sheet, drill-down, canonical balance lookup,
adjusting entries, and recurring journals.*

**How to read this file.**

- `CLAUDE.md` at the repo root carries the standing rules.
- The decisions in §3 came out of a structured design review with
  two external CTOs. They are **locked**. The 16 gap items in §2,
  §4, §9, §10 came out of the CTO review cross-check. They are
  also locked.
- If anything in this brief contradicts a canonical leaf in
  `docs/02_specs/ledger_truth_model.md` or a row in
  `docs/02_specs/invariants.md`, the canonical doc wins and this
  brief is wrong.

---

## 1. Context and Goals

A CTO review against the Phase 0 + 1 checklist (2026-04-20)
surfaced eight gaps in control-foundation coverage: audit log
completeness, trial-balance server-side validation, period
lock/unlock service path, Balance Sheet report, report drill-down,
canonical account-balance service, adjusting entries as a distinct
flow, and recurring journals. The review issued ten implementation
prompts (P1–P10). A design review resolved three open questions and
a cross-check surfaced eleven further gaps the prompts did not
handle. This brief consolidates all of it into one internally
consistent execution spec.

**Goal.** Close the eight gaps from the checklist while hardening
the invariant surface — three new Layer 1 invariants, one new
canonical service, one discipline backstop, and an operational
verifier that makes INV-AUDIT-001 demonstrably true across the
whole mutation surface. End state: invariants count moves from 17
to 20; the `audit_log` table becomes append-only at the DB layer;
`periodService.lock`/`unlock` become first-class mutations;
`reportService.trialBalance` throws `UNBALANCED` as a server-side
integrity backstop; the Balance Sheet report ships with
accounting-equation semantics; TB and P&L drill down to source
entries through a canonical GL detail surface.

**Non-goal.** A period-close workflow engine, a scheduler for
recurring journals, a maker-checker approval engine for adjusting
entries, or any AR/AP/Bank module. Each is deferred to Phase 2
with Phase 1 schema affordances where cheap (§3.4).

---

## 2. Scope

### 2.1 In scope

**Twelve substantive steps (Steps 1–12), preceded by Step 0 —
a production-readiness precondition, not a feature step.** See §4
for the full ship order. Three new invariants (INV-AUDIT-002,
INV-ADJUSTMENT-001, INV-RECURRING-001). Nine schema migrations
(eight feature migrations + one consolidated permissions-seeding
migration). One
new canonical service (`accountBalanceService`). Two new methods
on `periodService` (`lock`, `unlock`). One new operational
verifier script (`scripts/audit/verifyAuditCoverage.ts`). Four new
canvas directive types and four new view components. Eleven new
API routes (period lock/unlock, Balance Sheet, GL ledger,
accounts-by-type, recurring-journal templates and runs). A
`before_state` capture convention. A reserved-enum-states
discipline shared by adjusting entries and recurring-run status.
Two ADRs that record those disciplines.

### 2.2 Out of scope

- **Period-close workflow engine** (distinct from lock/unlock —
  the multi-task checklist that flushes earnings into retained
  earnings). Deferred Phase 2.
- **Maker-checker approval** for adjustments. Schema affordance
  ships now (`adjustment_status` enum, §3.2) but Phase 1 persists
  only `posted`.
- **Recurring-journals scheduler.** Schema affordance ships now
  (`approved` status reserved, §3.3) but Phase 1 flow is
  manual-generate plus approve-and-post in one action.
- **Parameterized recurring template amounts.** Depreciation and
  amortization modules are Phase 2+.
- **Drill-down from Balance Sheet.** TB and P&L drill-down ship in
  Step 8; BS drill-down is a Phase-next follow-up.
- **Fix `BasicPLView.tsx` direct `Decimal` import** (INV-MONEY-001
  violation at line 4). Pre-existing; tracked as a follow-up
  cleanup (§12), not bundled here.

### 2.3 Phase 1.1 DEFERRED items addressed by this brief

The Phase 1.1 exit-criteria matrix at
`docs/09_briefs/phase-1.1/exit_criteria_matrix.md` flagged six
DEFERRED items. This brief explicitly discharges two of them:

| # | Phase 1.1 DEFERRED item | Discharged by |
|---|---|---|
| #20 | **Pino redaction verification script** (`scripts/verify-pino-redaction.ts` does not exist) | Step 0 |
| #45 | **Balance Sheet report** (deliberately omitted in Phase 1.1 Task 17 for semantic mismatch — period-activity vs cumulative-balances) | Step 7 |

The other four DEFERRED items (#17 org-switcher smoke test, #34
RLS troubleshooting doc, #48 time-to-first-post instrumentation,
#52 Document Sync) remain where they are — not in this brief's
scope.

---

## 3. Locked Design Decisions

Five decisions came out of the 2026-04-20 design review. Do not
re-litigate.

### 3.1 Balance Sheet — current earnings on the fly (4-row RPC)

The `get_balance_sheet(p_org_id, p_as_of_date)` RPC returns
**four rows**, not three: `asset`, `liability`, `equity`,
`current_earnings`. The `current_earnings` row synthesizes revenue
and expense activity through `p_as_of_date` into an equity
sub-line. The UI renders:

```
Assets                                $X
Liabilities                           $Y
Equity
  Equity base (retained + capital)    $Z
  Current earnings                    $W
  Total equity                        $(Z+W)
```

Equation check: `total_assets == total_liabilities + total_equity`
where `total_equity = equity_base + current_earnings`. Failure
renders a red banner in the UI (mirroring the existing TB footer
pattern).

**`as_of_date` semantics: inclusive-of-day.** `current_earnings`
aggregates revenue and expense activity with `entry_date <=
p_as_of_date` — all activity through end-of-day on the requested
date is included. This matches the semantic of
`get_account_balance` (Step 6) and `get_accounts_by_type` (Step 8).

**Rationale.** The product promises an accounting-equation check.
Without current-earnings synthesis the equation would predictably
fail mid-period in normal operation. Tying BS correctness to a
manual closing-entry workflow would create a dependency on a
process that does not yet exist. Computing on the fly matches how
NetSuite, QuickBooks, and Xero present BS.

**Material change to P7:** the original 3-row shape becomes 4
rows. Tuple schema unchanged.

### 3.2 Adjusting entries — controller-only now, schema approval-ready

`entry_type = 'adjusting'` is accepted through input (Zod
validates; `regular` and `reversing` still derive
programmatically). `adjustment_reason` is required via a DB CHECK
(INV-ADJUSTMENT-001) plus Zod. The new permission
`journal_entry.adjust` is controller-only.

Additionally, a new Postgres enum `adjustment_status` is added,
with values `posted | pending_approval | approved | rejected`.
A new column `adjustment_status` on `journal_entries` is NOT NULL
DEFAULT `'posted'`. A scoped CHECK restricts non-`posted` values
to adjusting entries:

```sql
CHECK (entry_type <> 'adjusting' OR adjustment_status = 'posted')
```

In Phase 1 only `'posted'` is ever written. Reserved states are
defended at three layers:

1. **DB CHECK** — rejects non-`posted` values on non-adjusting
   rows.
2. **Service** — no write path emits non-`posted` values.
3. **Zod** — input schema rejects any client override of
   `adjustment_status`.

**Convention match.** A Postgres enum is used, not `text + CHECK`,
to align with existing enums (`entry_type`,
`journal_entry_source`, `org_role`).

**Rationale.** True maker-checker approval is the audit-grade
answer but is a workflow subsystem (pending state machine, second
action, maker ≠ checker enforcement, checker queue UI) — out of
proportion for a release whose focus is control foundations.
Schema-ready-now means the Phase 2 upgrade is additive, not
migrative.

### 3.3 Recurring journals — reserved states, idempotent duplicates

Status enum: `pending_approval | approved | posted | rejected`
(four values, **not five** — `skipped` is dropped). Phase 1
persists only `pending_approval`, `posted`, `rejected`. `approved`
is reserved for a Phase 2 scheduler that splits human approval
from posting (tied to the `auto_post` flag's semantics). Phase 1
transitions directly `pending_approval → posted` in a single
`approveRun()` action.

`generateRun(template_id, scheduled_for)` is idempotent on the
composite key: `INSERT ... ON CONFLICT DO NOTHING` followed by a
`SELECT` that returns the existing run if one already exists.

**Error codes for recurring journals** (final set, three values):

- `RECURRING_TEMPLATE_NOT_FOUND`
- `RECURRING_TEMPLATE_INACTIVE`
- `RECURRING_RUN_NOT_PENDING`

`RECURRING_RUN_ALREADY_GENERATED` — present in the original P10
draft — is **deleted**. It conflicts with the idempotent-
return-existing contract.

Auto-post flag still exists: hybrid auto-draft (default) /
auto-post (controller override), per COSO/SOX 404 practice for
routine recurring transactions (depreciation, standing
allocations).

**Rationale.** Matches actual Phase 1 service behavior
(approve-and-post is one action), matches scheduler retry
semantics, consistent with the reserved-state discipline in §3.2.
`skipped` is deferred as speculative naming; if the Phase 2
scheduler design needs it, `ALTER TYPE ADD VALUE` is cheap.

### 3.4 Reserved-enum-states discipline (cross-cutting)

§3.2 and §3.3 both introduce the same pattern, which this brief
codifies as a reusable discipline:

1. Use a Postgres enum (matches codebase convention for
   `entry_type`, `journal_entry_source`, `org_role`).
2. The `NOT NULL DEFAULT` picks the Phase 1 terminal state.
3. Reserved states (states the Phase 1 service path must not
   write) are defended at three layers: **DB CHECK** (scoped to
   the relevant discriminator), **service** (no write path emits
   them), **Zod** (input rejects client overrides).
4. When Phase 2 activates a reserved state, use
   `ALTER TYPE ADD VALUE` for new values or flip the CHECK
   constraint to loosen scope. No existing-row backfill needed.

ADR-B (§10) records this discipline so future reviewers see the
shape once, not twice across two unrelated features.

### 3.5 `before_state` capture convention

`src/services/audit/recordMutation.ts:24` already types
`before_state?: Record<string, unknown> | null`. The type
affordance has existed since Phase 1.1 migration 113 (Session 4.5,
per `CURRENT_STATE.md`). This brief is the first live consumer:
`periodService.lock`/`unlock` (Step 3).

The convention:

- **INSERT mutations** omit `before_state` (the row did not
  exist). `journalEntryService.post` is an INSERT; its current
  behavior is correct and unchanged.
- **UPDATE mutations** MUST capture `before_state` via a `SELECT`
  inside the same transaction, before the UPDATE, passing the
  full pre-update row as a `Record<string, unknown>`. The SELECT
  runs through the same `adminClient` so capture + mutation +
  audit write are atomic.
- **DELETE mutations** MUST capture `before_state` via the same
  pattern. Phase 1 permits no DELETEs on posted ledger rows, but
  the convention exists for future tenant-scoped tables.
- If the pre-update `SELECT` returns zero rows, the service must
  throw `NOT_FOUND` before attempting the UPDATE. Not a
  `recordMutation` concern.
- **Phase 2 evolution.** When `audit_log` becomes a projection
  from the `events` table, `before_state` migrates into the event
  payload. Shape unchanged.

ADR-A (§10) frames this as "first live consumer," not "convention
ahead of consumer" — the type affordance is older than the
convention documentation.

---

## 4. Ship Order — Twelve Substantive Steps

Step 0 is a production-readiness precondition (Phase 1.1 DEFERRED
#20) that lands before the twelve substantive steps and is not
counted among them. Steps 1–10 are the CTO prompts in dependency
order. Steps 11–12 are the finishing gates. Each step lists its
P-ID, dependencies, and what "done" means.

| # | Step | Depends on | Source prompt |
|---|---|---|---|
| **0** | **Pino redaction verification script** (`scripts/verify-pino-redaction.ts` + CI wiring) | — | Phase 1.1 DEFERRED #20 |
| 1 | **INV-AUDIT-002** — `audit_log` append-only (triggers + RLS + REVOKE) | 0 | P2 |
| 2 | **`before_state` capture convention** — doc update + `AuditEntry` JSDoc + ADR-A (no new code) | 0 | P3 |
| 3 | **`audit_log.reason` column + `periodService.lock`/`unlock`** + routes + schemas + new error codes | 1, 2 | P4 |
| 4 | **Audit coverage verifier** — script + ops doc; reconciles `journal_entry.post`, `journal_entry.reverse`, `period.lock`, `period.unlock` | 3 | P5 (modified) |
| 5 | **Trial-balance `UNBALANCED` backstop** in `reportService.trialBalance` + integrity-incident log | 0 | P1 (modified) |
| 6 | **`accountBalanceService`** + `get_account_balance` RPC | 0 | P6 |
| 7 | **Balance Sheet** — 4-row RPC + service method + view + API route | 6 | P7 (modified) |
| 8 | **Report drill-down** — TB rows clickable, P&L rows clickable, GL ledger view, accounts-by-type view, JE-detail UUID polish | 6, 7 | P8 |
| 9 | **Adjusting entries (2 migrations)** — `entry_type='adjusting'` + `adjustment_reason` CHECK (migration 6, INV-ADJUSTMENT-001) + `adjustment_status` Postgres enum with scoped CHECK (migration 7) + controller gate + UI. **Ships two migrations, not one — see §7.** | 3 | P9 (modified) |
| 10 | **Recurring journals** — template + lines + runs schema + service + routes + UI + **INV-RECURRING-001** | 3, 9 | P10 (modified) |
| 11 | **Consolidated permissions migration** (`20240130000000_control_foundation_permissions.sql`) — seeds seven new rows into `permissions` + `role_permissions` | 3, 9, 10 | Gap 1 |
| 12 | **Closeout: `src/db/types.ts` regeneration + doc count updates** (invariants.md 17→20, ledger_truth_model.md error-code intro 19→24, migration count) | 11 | Gaps 3, 5 |

### Dependency notes

- **Step 0 before anything else.** Pino redaction is a
  production-readiness gate and trivial (unit test asserting
  redaction on a sample payload). Minimal scope; not a feature.
- **Step 1 before Step 3.** INV-AUDIT-002 must be in place before
  the first UPDATE-style mutation (`period.lock`/`unlock`) writes
  to `audit_log`, so audit rows are protected by the append-only
  rule from turn one.
- **Step 2 alongside Step 3.** The convention doc (Step 2) and
  the first consumer (`period.lock`/`unlock`, Step 3) land
  together. Step 2 ships the docs + ADR-A; Step 3 ships the code.
- **Step 4 depends on Step 3.** The verifier needs
  `period.lock`/`unlock` audit rows to reconcile against.
- **Step 5 is independent.** `UNBALANCED` backstop is a pure
  service-layer addition.
- **Step 7 sits above Step 6.** Balance Sheet uses its own RPC
  but the inline-org-access + `toMoneyAmount` coercion pattern is
  cleanest if `accountBalanceService` ships first as the
  reference shape.
- **Step 9 depends on Step 3.** `adjustment_status` enum and
  scoped CHECK need the `audit_log.reason` pattern (Step 3)
  established so the three-layer defense narrative is consistent.
- **Step 10 depends on Steps 3 and 9.** Recurring templates reuse
  `audit_log.reason` (from Step 3) for `rejectRun.rejection_reason`
  and the reserved-enum-states discipline (from Step 9).
- **Step 11 (permissions) after all feature migrations.**
  Consolidating the seven permission-table seeds into one
  migration flips CA-27 (the `ACTION_NAMES` ↔ `permissions` parity
  test) green in a single commit, rather than drifting red
  between feature migrations.
- **Step 12 last.** One `types.ts` regeneration catches all nine
  migrations at once. Count updates to `invariants.md` and
  `ledger_truth_model.md` happen here, against the final state,
  per Style Rule 6.

---

## 5. Invariants Added

| INV-ID | Layer | Rule | Enforcement |
|---|---|---|---|
| **INV-AUDIT-002** | 1 | `audit_log` is append-only | 3 triggers + 2 RLS policies + 3 REVOKEs (defense in depth) |
| **INV-ADJUSTMENT-001** | 1 | Adjusting entries require a non-empty `adjustment_reason` | CHECK on `journal_entries` (`entry_type <> 'adjusting' OR length(trim(adjustment_reason)) > 0`) + Zod + service |
| **INV-RECURRING-001** | 1 | Recurring journal templates balance (debits = credits) | Deferred CONSTRAINT TRIGGER on `recurring_journal_template_lines` + Zod |

**Count update: 17 → 20.** The count line in
`docs/02_specs/invariants.md` (three occurrences at approximately
lines 3, 29, 32, plus the section header at approximately line 46
"## The 17 invariants") and the per-layer summary in
`ledger_truth_model.md` all update in Step 12, against the final
state — not piecemeal across steps. The bidirectional
reachability `diff` command in invariants.md must produce empty
output after Step 12 ships.

> **Line numbers cited here are directional as of this brief's
> authoring (2026-04-20).** Step 12's implementer must re-verify
> against HEAD before editing — the docs may have shifted. The
> authoritative anchor is the text (`"17 distinct INV-IDs"`,
> `"## The 17 invariants"`), not the line number.

### Pairings

Add two rows to the Cross-layer pairings table in
`invariants.md`:

- **INV-AUDIT-001 (L2) ↔ INV-AUDIT-002 (L1).** AUDIT-001
  guarantees every mutation writes an audit row; AUDIT-002
  guarantees that row is permanent. Together: every mutation
  produces a permanent audit record.
- **INV-LEDGER-001 (L1a) ↔ INV-RECURRING-001 (L1).** LEDGER-001
  guards posted entries; RECURRING-001 guards templates so a
  broken template cannot produce unbalanced posted entries.

---

## 6. Discipline Backstops (not promoted to INV-ID)

Add four rows to the Discipline backstops table in
`invariants.md`:

| Site | Discipline | Non-promotion rationale |
|---|---|---|
| `reportService.trialBalance()` footer check (Step 5) | Trial-balance debits equal credits | Theorem of INV-LEDGER-001; follows mechanically if the per-entry rule holds. Backstop surfaces violations that would otherwise render silently as wrong totals to non-UI consumers. |
| `accountBalanceService.get` (Step 6) | Canonical point-in-time balance lookup | "Which function to call" convention, same category as INV-MONEY-001's `decimal.js` confinement — not a rule about input/output state. |
| Reserved `adjustment_status` values forbidden in Phase 1 (Step 9) | Reserved-state discipline | Schema affordance for Phase 2 maker-checker; no current service path writes non-`posted`. Defended at three layers (DB CHECK + service + Zod). ADR-B is the shared statement. |
| Reserved `recurring_journal_runs.status = 'approved'` forbidden in Phase 1 (Step 10) | Reserved-state discipline | Same pattern as adjusting. Phase 2 scheduler may activate. ADR-B is the shared statement. |

The existing two discipline backstops
(`unique_entry_number_per_org_period` and `je_attachments_select`)
remain unchanged.

---

## 7. Schema Changes (Migration List)

Nine migrations. Timestamps assigned starting from
`20240122000000` (next available slot per
`supabase/migrations/`; last shipped is
`20240121000000_agent_sessions_turns.sql`).

| # | Migration | Step | Purpose |
|---|---|---|---|
| 1 | `20240122000000_audit_log_append_only.sql` | 1 | INV-AUDIT-002: `reject_audit_log_mutation()` function + 3 triggers + 2 RLS policies + 3 REVOKEs |
| 2 | `20240123000000_audit_log_reason_column.sql` | 3 | Add nullable `audit_log.reason text` column (additive; does not affect INV-AUDIT-002) |
| 3 | `20240124000000_account_balance_rpc.sql` | 6 | `get_account_balance(p_org_id, p_account_id, p_as_of_date)` |
| 4 | `20240125000000_balance_sheet_rpc.sql` | 7 | `get_balance_sheet(p_org_id, p_as_of_date)` — **4 rows**, with inclusive-of-day `as_of_date` semantics |
| 5 | `20240126000000_gl_account_detail_rpcs.sql` | 8 | `get_accounts_by_type(p_org_id, p_account_type, p_period_id DEFAULT NULL)` + `get_account_ledger(p_org_id, p_account_id, p_period_id DEFAULT NULL)` with running-balance window function. **`p_period_id` is NULLABLE.** |
| 6 | `20240127000000_add_adjustment_reason.sql` | 9 | `journal_entries.adjustment_reason text` + CHECK constraint (INV-ADJUSTMENT-001) |
| 7 | `20240128000000_adjustment_status_enum.sql` | 9 | `CREATE TYPE adjustment_status` enum + column on `journal_entries` with DEFAULT `'posted'` + scoped CHECK |
| 8 | `20240129000000_recurring_journal_templates.sql` | 10 | 3 tables (`recurring_journal_templates`, `recurring_journal_template_lines`, `recurring_journal_runs`) + `enforce_template_balance` deferred CONSTRAINT TRIGGER (INV-RECURRING-001) + RLS policies with **service-role permissive annotation** (§9 gap 9) |
| 9 | `20240130000000_control_foundation_permissions.sql` | 11 | Seeds seven new rows into `permissions` + corresponding `role_permissions` (all controller-only): `period.unlock`, `journal_entry.adjust`, `recurring_template.create`, `recurring_template.update`, `recurring_template.deactivate`, `recurring_run.generate`, `recurring_run.approve`, `recurring_run.reject`. `period.lock` is already seeded — do not re-seed. |

> **8 feature migrations + 1 permissions migration = 9 total.**

**`fiscal_periods` columns already exist.** `is_locked`,
`locked_at`, `locked_by_user_id` are all present from migration
`20240101000000_initial_schema.sql`. Step 3 does not need a
migration for these columns — only the `audit_log.reason` column
(migration 2 above) and the new `ACTION_NAMES` + permissions seed
(migration 9 above).

**`ACTION_NAMES` extensions.** Seven new entries must be added to
the `ACTION_NAMES` array in
`src/services/auth/canUserPerformAction.ts`:

- `period.unlock`
- `journal_entry.adjust`
- `recurring_template.create`
- `recurring_template.update`
- `recurring_template.deactivate`
- `recurring_run.generate`
- `recurring_run.approve`
- `recurring_run.reject`

(`period.lock` is already present at
`canUserPerformAction.ts:24`.) All seven land in TypeScript as
part of Steps 3, 9, and 10 alongside the services that use them;
the corresponding `permissions` and `role_permissions` rows ship
in Step 11.

---

## 8. Error Codes

**Final count: 24** (per ledger_truth_model.md §Structured Error
Contracts). Current doc-stated count is 19 (line 3285 of
`ledger_truth_model.md`, "Phase 1.1"). Net-new codes from this
brief: **5**.

### New codes (5)

| Code | Status | Thrown by | Step |
|---|---|---|---|
| `PERIOD_ALREADY_LOCKED` | 422 | `periodService.lock` when `is_locked = true` | 3 |
| `PERIOD_NOT_LOCKED` | 422 | `periodService.unlock` when `is_locked = false` | 3 |
| `RECURRING_TEMPLATE_NOT_FOUND` | 404 | `recurringJournalService` | 10 |
| `RECURRING_TEMPLATE_INACTIVE` | 422 | `recurringJournalService.generateRun` when template `is_active = false` | 10 |
| `RECURRING_RUN_NOT_PENDING` | 422 | `recurringJournalService.approveRun` / `rejectRun` when `status ≠ 'pending_approval'` | 10 |

### First live consumer of an existing code

`UNBALANCED` (already in `ServiceError.ts:14`; already maps to 422
at `serviceErrorToStatus.ts:48,70`) gains its first service-layer
consumer in Step 5 via `reportService.trialBalance` footer check.
**Not a new code.** This aligns with the "reserved but not used"
status documented in the ledger_truth_model.md `UNBALANCED` entry;
Step 5 flips that status to active. See §9 for the
integrity-incident log addition.

### Not added

`RECURRING_RUN_ALREADY_GENERATED` — originally proposed in P10,
reversed because duplicate `generateRun` is idempotent-return-
existing (§3.3).

### Count update in Step 12

`ledger_truth_model.md` §Structured Error Contracts intro,
approximately line 3285: **"19 codes in Phase 1.1"** → **"24 codes
as of control-foundations"**. The `UNBALANCED` entry's "reserved
but not used" language is also updated in Step 12. HTTP-status
table at approximately line 3321 gains four new entries under 422
(`PERIOD_ALREADY_LOCKED`, `PERIOD_NOT_LOCKED`,
`RECURRING_TEMPLATE_INACTIVE`, `RECURRING_RUN_NOT_PENDING`), and
one under 404 (`RECURRING_TEMPLATE_NOT_FOUND`).

> **Line numbers cited here are directional as of this brief's
> authoring (2026-04-20).** Step 12's implementer must re-verify
> against HEAD before editing. Authoritative anchors are the
> section heading ("## Structured Error Contracts") and the count
> string ("19 codes in Phase 1.1"), not the line number.
>
> **Baseline-count caveat.** The "19 + 5 = 24" math above treats
> the doc's stated 19 as the baseline. Step 12's implementer
> should **count the actual `ServiceErrorCode` union in
> `src/services/errors/ServiceError.ts`**, add the 5 net-new codes
> from this brief (accounting for the removed
> `RECURRING_RUN_ALREADY_GENERATED`), and write the true final
> count into the doc — rather than trusting "19 + 5." If the real
> union count plus 5 is not 24, reconcile the pre-existing drift
> in the same pass. See §12 for the tracked follow-up.

---

## 9. Operational Additions

- **Audit coverage verifier** — `scripts/audit/verifyAuditCoverage.ts`
  library + `scripts/audit/verify-audit-coverage` CLI. Reconciles
  every `journal_entries` row against `audit_log` (expected
  actions: `journal_entry.post`, `journal_entry.reverse`, and —
  post-Step-9 — `journal_entry.adjust`) and every `fiscal_periods`
  lock/unlock event against `audit_log` (expected actions:
  **both** `period.lock` and `period.unlock`). Exit 1 on any
  detected gap; exit 0 clean.

  **Extensions as ship-order dependencies.** The verifier gains
  `journal_entry.adjust` reconciliation when Step 9 ships, and
  `recurring_run.*` + `recurring_template.*` reconciliation when
  Step 10 ships. These extensions are flagged as TODO markers in
  Step 4's initial implementation; they are not blockers for the
  verifier to ship.

  **Ops doc** at `docs/05_operations/audit_verification.md`
  documents the verifier, its purpose (operational backstop for
  INV-AUDIT-001), and three supported deployment options:

  1. Supabase `pg_cron`
  2. Vercel Cron
  3. External cron hitting an authenticated API route
  4. **CI job** — daily GitHub Actions run against a seed-reset
     DB. Catches service-layer regressions where a new mutation
     path skips `recordMutation`. (Added per Gap 10.)

- **`UNBALANCED` as integrity incident (Step 5).** When
  `reportService.trialBalance` throws `UNBALANCED`, the service
  also emits a structured `error`-level pino log with
  `{ incident_type: 'ledger_integrity', org_id, total_debit,
  total_credit, delta }`. This lets alerting route on
  `incident_type` separately from normal 422s. The HTTP response
  is still 422; the log is the paging hook. Documented in the
  `UNBALANCED` leaf entry updated in Step 12.

- **Pino redaction verification script (Step 0).** Unit-test
  shape: construct a pino logger with the redact-list from
  `src/shared/logger/pino.ts`; log a payload that contains every
  redacted key; assert the serialized output contains `[Redacted]`
  (or the configured placeholder) at every redacted path and the
  original value nowhere. **Scope: production readiness, one unit
  test, no logic changes.** Discharges Phase 1.1 DEFERRED #20.
  Wired into CI alongside existing tests.

- **Route-handler `entry_type` discrimination (Step 9).** The new
  `entry_type = 'adjusting'` path in
  `src/app/api/orgs/[orgId]/journal-entries/route.ts` is
  **additive** to the existing reversal discriminator (body
  contains `reverses_journal_entry_id` → reversal path; body
  contains `entry_type === 'adjusting'` → adjust path; else →
  regular post). The `withInvariants` action is selected from
  that discrimination: `'journal_entry.adjust'` for adjusting;
  `'journal_entry.post'` for regular and reversing. Not a
  replacement for the reversal branch.

- **Recurring-run RLS annotation (Step 10).** The migration's RLS
  block for `recurring_journal_runs` must include a comment
  explaining: "RLS is permissive for the service-role path
  because INV-AUTH-001 via `withInvariants` is the enforcement
  layer for writes. Do not 'harden' RLS by adding user-scoped
  write policies — the service uses `adminClient` by design, per
  INV-SERVICE-002." This is discoverability-as-enforcement —
  future contributors who attempt to tighten RLS will read this
  comment first.

---

## 10. ADR Obligations

Two ADRs land as part of this brief. Drafting the full ADR
contents is a follow-up session; this brief commits to producing
them and fixes their framing.

### ADR-A — `before_state` capture convention

Frame: **"first live consumer,"** not "convention ahead of
consumer." The `AuditEntry.before_state` type affordance has
existed since Phase 1.1 migration 113 (session 4.5 per
`CURRENT_STATE.md`, landing in `recordMutation.ts:24`). Phase 1.1
had no UPDATE-style mutations in `periodService`, so the
affordance sat dormant. Step 3 of this brief
(`periodService.lock`/`unlock`) is the first populated call site.
ADR-A documents the convention — INSERT omits, UPDATE and DELETE
capture via same-transaction `SELECT` — as codification of what
the first consumer needed, not a prescriptive rule issued before
any consumer.

### ADR-B — Reserved-enum-states discipline

Steps 9 and 10 both apply the same pattern: Postgres enum with a
DEFAULT picking the Phase 1 terminal state + scoped CHECK
forbidding reserved values in Phase 1 + Zod rejecting client
overrides + service layer emitting no reserved values (§3.4).
Without a shared ADR, future reviewers will re-derive the
discipline inconsistently in each new feature. ADR-B captures:

- The shape (four elements: enum, DEFAULT, CHECK, three-layer
  defense).
- The rationale (schema-ready for Phase 2, no table rewrite;
  Phase 2 upgrade is `ALTER TYPE ADD VALUE` or CHECK loosening).
- The two reference sites (`adjustment_status`,
  `recurring_journal_runs.status`).

---

## 11. Verification Criteria

### 11.1 Per-step gates

Every step must pass, independently:

1. **`pnpm agent:validate`** — typecheck + no-hardcoded-URLs grep
   + Category A floor tests. Green on the step's branch.
2. **Migration applies cleanly** on `pnpm db:reset` (for steps
   that ship a migration).
3. **New services pass targeted psql round-trip** — for steps
   that introduce a service method or RPC, manual psql invocation
   against seed data returns values that match a hand-calculated
   expectation. Recorded in the step's commit message.
4. **Screenshot verification** for steps that change UI (Steps 5,
   7, 8, 9, 10), per CLAUDE.md UI rule.

### 11.2 Cross-cutting gates (final state, verified in Step 12)

- **Bidirectional reachability (`docs/02_specs/invariants.md`)** —
  `diff <(grep -oE 'INV-[A-Z]+-[0-9]{3}' docs/02_specs/ledger_truth_model.md | sort -u) <(grep -rho 'INV-[A-Z]\+-[0-9]\+' src/ supabase/migrations/ | sort -u)`
  produces empty output. New INV-IDs (AUDIT-002, ADJUSTMENT-001,
  RECURRING-001) appear in both docs and code; no orphans.
- **CA-27 `ACTION_NAMES` ↔ `permissions` parity test** green.
  All seven new action names in `ACTION_NAMES` have matching
  rows in `permissions` via migration `20240130000000`.
- **`src/db/types.ts` regenerated** against post-Step-11 schema.
  No stale-drift flag from any service that imports it.
- **Invariants count** in `invariants.md` header and summary =
  20.
- **Error-code count** in `ledger_truth_model.md` Structured
  Error Contracts intro = 24.

### 11.3 Verifier passes

`pnpm verify-audit-coverage` against the seed database reports
zero gaps after all 12 feature steps ship. Reconciles:

- Every `journal_entries` row → matching `audit_log` row with
  action in `{'journal_entry.post', 'journal_entry.reverse',
  'journal_entry.adjust'}`.
- Every `fiscal_periods` row with `locked_at IS NOT NULL` →
  matching `period.lock` audit row; every unlock event →
  matching `period.unlock` audit row.
- Every `recurring_journal_runs` row → matching
  `recurring_run.generate` audit row (plus `approve` or `reject`
  where applicable).

---

## 12. Known Risks and Open Items

- **Balance Sheet seed data.** If the seed fixture does not post
  an opening-equity entry, the accounting-equation check will
  fail on day one. The RPC is correct; the data is incomplete.
  Not a blocker for shipping the RPC; flagged as a seed-cleanup
  follow-up. Do not "fix" the RPC to suppress the mismatch.
- **Pre-existing error-code doc drift.** The
  `ledger_truth_model.md` Structured Error Contracts section
  declares "19 codes in Phase 1.1" at line 3285, but
  `ServiceError.ts` has grown substantially since (1.5A, 1.5B,
  1.2 additions). The CTO math ("19 + 5 = 24") treats the doc's
  stated 19 as the baseline. Step 12 updates the stated count to
  24 based on that math; a separate reconciliation of the doc
  against the actual `ServiceErrorCode` union is a known
  follow-up outside this brief's scope.
- **Phase 1 simplification collision.** INV-AUDIT-002 is
  load-bearing against the "synchronous audit log" Phase 1
  simplification. When `audit_log` becomes a projection from the
  `events` table in Phase 2, the append-only rule must migrate
  cleanly to the projected rows. Covered in the new leaf's
  "Phase 2 evolution" paragraph.
- **`BasicPLView.tsx` pre-existing `import Decimal from
  'decimal.js'` at line 4.** INV-MONEY-001 violation. **Not
  fixed in this brief.** Tracked as a follow-up cleanup to land
  against the decimal-confinement discipline separately; do not
  pattern-copy this import in Step 7's
  `BasicBalanceSheetView.tsx`.
- **`skipped` may come back.** If the Phase 2 recurring-journals
  scheduler design specifies a skipped-run state, it re-enters
  the enum via `ALTER TYPE ADD VALUE`. Zero migration cost.
- **Obligations collision with Phase 1.2 obligations.**
  `docs/09_briefs/phase-1.2/obligations.md` line 174 lists
  "Recurring entries (Phase 2, requires pg-boss)" as a Phase 2+
  deferral. Step 10 of this brief pulls the data model and the
  manual-generate path forward; the pg-boss scheduler stays
  deferred. Worth a friction-journal note when Step 10 lands so
  the obligations doc is updated to reflect the split.
- **Phase 1.2 is mid-flight.** Per `CURRENT_STATE.md`, Phase 1.2
  Session 8 is next and the ship order here competes for session
  bandwidth. Sequencing decision (run this brief in parallel,
  before, or after Phase 1.2 closeout) is a founder call.

---

## 13. Exit Criteria

All of the following must hold:

- **All steps ship** in ship order: Step 0 (production-readiness
  precondition) followed by the twelve substantive steps (Steps
  1–12).
- **`pnpm agent:validate`** green on the final merge commit.
- **Invariants count in `docs/02_specs/invariants.md` = 20.**
  Bidirectional reachability `diff` is empty.
- **CA-27 parity test green.** Every entry in `ACTION_NAMES` has
  a corresponding row in `permissions`; every seeded permission
  has a matching `ACTION_NAMES` entry.
- **`pnpm verify-audit-coverage`** against the seed database
  reports zero gaps.
- **`src/db/types.ts`** in sync with post-Step-11 schema.
- **Pino redaction verification** unit test passes in CI.
- **Every `audit_log.action` value enumerated in the new leaves**
  (`journal_entry.post`, `journal_entry.reverse`,
  `journal_entry.adjust`, `period.lock`, `period.unlock`,
  `recurring_template.create`, `recurring_template.update`,
  `recurring_template.deactivate`, `recurring_run.generate`,
  `recurring_run.approve`, `recurring_run.reject`, plus existing
  Phase 1.5 org/address/profile actions) appears at least once
  in the test fixtures.
- **Both ADRs filed** (ADR-A `before_state` first consumer,
  ADR-B reserved-enum-states discipline).

---

*End of Phase 0–1.1 Control Foundations Brief.*
