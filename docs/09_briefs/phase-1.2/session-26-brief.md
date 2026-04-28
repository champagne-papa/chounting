# Session 26 — Phase 1.2 post-audit Day-1 fixes (ledger-integrity)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **No paid-API spend in this session** (S26 is migration + service-layer ledger-integrity work; no orchestrator request fires).

**Goal:** Close the three Phase 1.2 audit Quick Wins on the ledger-integrity surface — QW-04 (UF-001 ledger-immutability triggers on `journal_entries` and `journal_lines`), QW-03 (UF-004 period-lock date-range validation), QW-05 (UF-005 cross-org account-id guard on `journal_lines`). Sequenced QW-04 → QW-03 → QW-05 within the session: DB-level immutability ships first as defense-in-depth in case the period-validation guard has a logic bug.

**Architecture (V1 minimal scope):**

- **QW-04 (immutability triggers):** New migration `supabase/migrations/20240133000000_journal_immutability_triggers.sql` paralleling the audit-log pattern at `supabase/migrations/20240122000000_audit_log_append_only.sql`. Three triggers per table (no UPDATE, no DELETE, no TRUNCATE) on `journal_entries` and `journal_lines`. Same `RAISE EXCEPTION` shape, same `feature_not_supported` ERRCODE. Pairs with INV-LEDGER-001 (append-only ledger) — this migration moves enforcement from convention to mechanical.
- **QW-03 (period-lock date-range validation):** Service-level fast-path in `journalEntryService.post()` after the existing `is_locked` check at line 117. Fetch the period's `start_date` and `end_date` (current query at line 109 selects only `is_locked`; extend to include both date columns) and assert `period.start_date <= entry_date <= period.end_date`. Throw `ServiceError('PERIOD_DATE_OUT_OF_RANGE', ...)` on mismatch. DB-level defense-in-depth: extend the existing `enforce_period_not_locked()` trigger (or add a sibling) to assert the same range.
- **QW-05 (cross-org account-id guard):** BEFORE INSERT trigger on `journal_lines` that subqueries `chart_of_accounts.org_id` for the inserted `account_id` and `journal_entries.org_id` for the inserted `journal_entry_id`, raising on mismatch. Trigger preferred over composite-FK because composite-FK requires denormalization (adding `org_id` to `journal_lines` as a generated column or a direct copy), which is more invasive than a single trigger that reads two existing rows.

**Tech stack:** PostgreSQL plpgsql, TypeScript service-layer, Supabase migrations, Vitest. No new dependencies. New migration file. Type regeneration: `pnpm types:gen` after migration apply if any column shapes shift (none in this brief — only triggers).

---

**Anchor (parent) SHA:** S25 commit SHA (set by orchestrating session at brief-write time; verify HEAD's parent matches at Task 1 Step 2). Per fix-stack arc, S26 sequences after S25 closure.

**Upstream authority:**
- `docs/07_governance/audits/phase-1.2/action-plan.md` — QW-04 (lines 29–33), QW-03 (lines 23–27), QW-05 (lines 35–39). Verbatim "Done when" criteria reproduced in the Exit-criteria matrix below.
- `docs/07_governance/audits/phase-1.2/unified-findings.md` — UF-001 (lines 117–135 ledger-immutability convention-only enforcement), UF-004 (lines 191–209 period-lock incomplete; date-range not validated), UF-005 (lines 213–232 cross-org account-id injection via FK).
- Pattern reference: `supabase/migrations/20240122000000_audit_log_append_only.sql` — three-trigger pattern (`reject_audit_log_mutation()` + `BEFORE UPDATE` + `BEFORE DELETE` + `BEFORE TRUNCATE` triggers + RLS policies + REVOKE TRUNCATE). The QW-04 migration mirrors this shape on `journal_entries` and `journal_lines`.
- Phase 1.1 carry-forward: UF-001 references Phase 1.1 audit UF-006 (`unified-findings.md:135`); UF-005 has no Phase 1.1 carry-forward but compounds with UF-002 (closed in S25).
- `docs/02_specs/ledger_truth_model.md` — INV-LEDGER-001 (append-only ledger). The trigger migration moves this leaf from Layer 3 (service convention) to Layer 1a (DB physical enforcement) per the Layer-1 enforcement-modes ADR.
- `CLAUDE.md` — `journal-entry-rules` and `service-architecture` skills apply. INV-LEDGER-001's leaf is the tiebreaker.
- `docs/09_briefs/phase-1.2/post-audit-fix-stack-arc.md` — arc context (S26 is the second session of three).

---

## Session label
`S26-ledger-integrity-day-1` — captures the ledger-integrity Day-1 fix bundle (immutability triggers + period date-range + cross-org account guard).

## Hard constraints (do not violate)

- **Out of scope:**
  - QW-01 / QW-02 / QW-07 non-ledger Day-1 items (shipped in S25).
  - MT-01 atomicity RPC (ships in S27). Note: QW-04's immutability triggers are defense-in-depth that S27's RPC will respect; running S27 against pre-trigger schema would not exercise the trigger interaction. Hence S27 blocks on this session per the arc dependency graph.
  - QW-06 (UF-007) — DEFERRED to Phase 2 per S25's pre-decision.
  - LT-01 / UF-006 service-mutation CI guard.
  - MT-03 / MT-04 / MT-05 / MT-06 (Phase 2).
  - Any orchestrator or prompt edits.
- **Test posture floor:** ALL existing tests green at HEAD post-edit. `pnpm agent:validate` clean. Full suite: any pre-existing carry-forwards documented at HEAD remain unchanged. No new failures attributable to this session.
- **Migration discipline.** New migration filename `20240133000000_journal_immutability_triggers.sql` (next sequential timestamp; verify against latest at `ls supabase/migrations/ | tail -1`, which at brief-write was `20240132000000_add_recurring_journal_permissions.sql`). Wrap in `BEGIN; ... COMMIT;` per audit-log migration shape. Header comment follows the audit-log migration's docstring conventions.
- **No paid-API spend authorization.** S26 does not invoke the orchestrator or fire any Anthropic call.
- **Sequencing within session: QW-04 → QW-03 → QW-05.** Per operator pre-decision: ship DB-level immutability first so it stands as defense-in-depth if the period-validation guard has a logic bug. QW-05 last because it depends on existing CoA seeding patterns being present.
- **QW-03 ships service + DB layers together.** Service-level fast-path provides typed `ServiceError` UX; DB-level provides defense-in-depth. Operator pre-decision: both surfaces ship in this session, in the same commit (or paired commits per the Y2 split below).
- **QW-05 trigger over composite-FK.** Pre-decision: trigger. Composite-FK requires denormalization (adding `org_id` to `journal_lines`); BEFORE INSERT trigger is less invasive and produces a typed PG exception that the service layer can wrap.
- **Convention #8 verify-directly discipline.** Every cited file/line/UF-ID was grep-confirmed at brief-write. Re-verify at execution time before edit; halt on any drift.

---

## Pre-decisions enumerated

What's decided at brief-write (do not re-litigate at execution time):

1. **Sequencing within session: QW-04 → QW-03 → QW-05.** Per operator. DB triggers act as defense-in-depth if QW-03 has a logic bug; QW-05 last because it depends on CoA fixtures.
2. **QW-03 ships service-level + DB-level both.** Rationale: service can produce better error UX (typed `ServiceError`), DB layer protects against any future bypass route. Both surfaces in scope.
3. **QW-05 trigger over composite-FK.** Trigger reads `chart_of_accounts.org_id` for the inserted `account_id` and `journal_entries.org_id` for the inserted `journal_entry_id`; raises on mismatch. Composite-FK would require denormalizing `org_id` into `journal_lines` — more invasive.
4. **Test fixtures: seed `SEED.ORG_REAL_ESTATE` plus a secondary org with its own CoA.** Cross-org account injection test inserts a `journal_line` whose `account_id` belongs to the secondary org while the parent `journal_entry.org_id` is `SEED.ORG_REAL_ESTATE`; expect trigger exception. The secondary org may need a fresh CoA seed if existing test seeds don't provide one — verify at Task 2 Step 2.
5. **Y2 commit shape.** Operator's call at execution time. Default: **single bundled commit unless any item exceeds ~50 lines of diff**. If QW-04 migration alone exceeds 50 lines (likely; the audit-log analog is 89 lines because of RLS policies + REVOKEs), then split into three commits — one per QW item. Each item's "done when" verifies independently. Friction-journal entry at closeout summarizes the bundle.
6. **Estimated session duration:** ~4 hours (1.5h migration draft + 1h service-layer + 1h cross-org trigger + 0.5h tests + review).

OPEN — operator to resolve before Session start:

- **QW-04 trigger naming.** Two options: (a) `trg_journal_entries_no_update` / `trg_journal_entries_no_delete` / `trg_journal_entries_no_truncate`, mirroring the audit-log pattern (`trg_audit_log_no_update`, etc.). (b) `enforce_ledger_immutability_*`. Default at brief-write: option (a) — keeps the existing convention discoverable from `\d journal_entries` in psql and aligned with the audit-log analog. Operator confirms before Task 4.
- **QW-03 service-vs-DB sequencing.** Two options: (a) ship together in one commit (service first, DB trigger same commit) — preferred default. (b) staged commits (DB first, then service catch-up). Default at brief-write: (a) one commit; both surfaces are tightly coupled by the same date-range invariant. Operator confirms before Task 4.
- **QW-05 trigger vs CHECK.** Pre-decision is trigger; CHECK constraints with subqueries are not portable in PG (reference IMMUTABLE-only). The audit's QW-05 entry (`action-plan.md:37`) leaves the choice open. Default at brief-write: trigger (typed PG error, no IMMUTABLE constraint). Operator confirms before Task 4.

---

## Exit-criteria matrix

| ID | UF | Target file(s) / migration | Done when (verbatim from action-plan) | Test evidence required |
|---|---|---|---|---|
| QW-04 | UF-001 | `supabase/migrations/20240133000000_journal_immutability_triggers.sql` (new) — 3 triggers on `journal_entries`, 3 on `journal_lines` | "`UPDATE journal_entries SET ...` raises database exception, regardless of who calls it. Same for DELETE and all columns." | Integration test attempts `UPDATE`, `DELETE`, `TRUNCATE` on both tables (using admin client; bypassing RLS); each raises PG exception with the trigger's `ERRCODE`. |
| QW-03 | UF-004 | `src/services/accounting/journalEntryService.ts` lines 107–119 (service-level); migration extending `enforce_period_not_locked()` (DB-level) | "Posting an entry with `entry_date` outside the period's range raises `ServiceError`. Test with dates before `start_date` and after `end_date`." | Two integration tests: post-with-date-before-start, post-with-date-after-end; each expects `ServiceError('PERIOD_DATE_OUT_OF_RANGE', ...)`. DB-level defense-in-depth: a third test that bypasses the service layer and asserts the trigger fires. |
| QW-05 | UF-005 | `supabase/migrations/20240133000000_journal_immutability_triggers.sql` (same file or sibling, operator's call) — BEFORE INSERT trigger on `journal_lines` | "Attempting to insert a `journal_line` with an `account_id` from a different org raises a constraint violation. Test with multi-org setup." | Integration test seeds multi-org (per Task 2 Step 2); attempts `INSERT INTO journal_lines (journal_entry_id, account_id, ...)` where `journal_entry.org_id !== chart_of_accounts.org_id`; expects PG exception. |

---

## Task 1: Session-init, HEAD anchor verify

- [ ] **Step 1: Run session-init**

```bash
bash scripts/session-init.sh S26-ledger-integrity-day-1
```

- [ ] **Step 2: Confirm HEAD points at S25's commit (parent matches anchor)**

```bash
git rev-parse HEAD~1
git log -1 --name-only --format='%H'
```

Expected: `HEAD~1` equals S25's commit SHA (the immediately prior session in the arc; orchestrating session populates this at brief-write or chains through the friction-journal). HEAD's single changed file should be `docs/09_briefs/phase-1.2/session-26-brief.md`.

If either check fails, STOP per "Check HEAD before Step 2 Plan" convention. The arc dependency graph in `docs/09_briefs/phase-1.2/post-audit-fix-stack-arc.md` requires S25 closure before S26 begins — surface and halt if S25 has not landed.

---

## Task 2: Pre-flight verification

- [ ] **Step 1: Verify next-sequential migration timestamp**

```bash
ls supabase/migrations/ | tail -3
```

Expected: latest is `20240132000000_add_recurring_journal_permissions.sql` (verified at brief-write — surface drift if the latest has advanced; pick the next sequential timestamp and update this brief's filename references at execution time).

- [ ] **Step 2: Verify the audit-log migration pattern is intact**

```bash
sed -n '36,57p' supabase/migrations/20240122000000_audit_log_append_only.sql
```

Expected: `reject_audit_log_mutation()` function + three triggers (`trg_audit_log_no_update`, `trg_audit_log_no_delete`, `trg_audit_log_no_truncate`). The new migration mirrors this shape for `journal_entries` and `journal_lines`.

- [ ] **Step 3: Verify `journalEntryService.post()` period-lock surface**

```bash
sed -n '107,119p' src/services/accounting/journalEntryService.ts
```

Expected: line 109's `.select('is_locked')` query (extend at execution time to also fetch `start_date`, `end_date`); line 117's `is_locked` check (the new check inserts immediately after this).

- [ ] **Step 4: Verify a multi-org CoA fixture or seed exists**

```bash
grep -rn "ORG_REAL_ESTATE\|22222222-2222\|ORG_HOLDING" tests/setup/testDb.ts
```

Expected: `SEED.ORG_REAL_ESTATE` and `SEED.ORG_HOLDING` (or similar) defined at `tests/setup/testDb.ts:31`. Both should have CoA seeded under their respective `org_id`. If only one org has a CoA seed, the cross-org test needs a fresh seed for the secondary org — surface to operator at Task 3.

- [ ] **Step 5: Verify `journal_lines.account_id` FK shape**

```bash
grep -n "account_id.*REFERENCES chart_of_accounts" supabase/migrations/20240101000000_initial_schema.sql
```

Expected: line 223 `account_id uuid NOT NULL REFERENCES chart_of_accounts(account_id)` — simple FK, no composite. UF-005 evidence at line 223.

- [ ] **Step 6: Verify test-baseline at HEAD**

```bash
pnpm agent:validate
```

Expected: clean (26-test agent floor).

- [ ] **Step 7: Verification report to operator**

Surface:
1. Next-sequential migration timestamp (Step 1).
2. Audit-log migration pattern intact (Step 2).
3. Period-lock surface in `journalEntryService.post()` (Step 3).
4. Multi-org seeds present (Step 4).
5. `journal_lines.account_id` simple FK (Step 5).
6. `pnpm agent:validate` clean (Step 6).

Wait for operator acknowledgment before Task 3.

---

## Task 3: Step 2 Plan — migration shape, service-layer shape, test plan

Produce a planning report and wait for operator approval before any code edit.

- [ ] **Step 1: Surface QW-04 migration shape**

```sql
BEGIN;

CREATE OR REPLACE FUNCTION reject_journal_entries_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'journal_entries is append-only — UPDATE, DELETE, and TRUNCATE are forbidden'
    USING ERRCODE = 'feature_not_supported';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_journal_entries_no_update
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION reject_journal_entries_mutation();

CREATE TRIGGER trg_journal_entries_no_delete
  BEFORE DELETE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION reject_journal_entries_mutation();

CREATE TRIGGER trg_journal_entries_no_truncate
  BEFORE TRUNCATE ON journal_entries
  FOR EACH STATEMENT EXECUTE FUNCTION reject_journal_entries_mutation();

-- Mirror for journal_lines
CREATE OR REPLACE FUNCTION reject_journal_lines_mutation() ...
CREATE TRIGGER trg_journal_lines_no_update ...
CREATE TRIGGER trg_journal_lines_no_delete ...
CREATE TRIGGER trg_journal_lines_no_truncate ...

-- RLS-level deny + REVOKE TRUNCATE per audit-log pattern
COMMIT;
```

Header docstring includes:
- Reference to `INV-LEDGER-001` leaf.
- Reference to ADR-0008 (Layer-1 enforcement modes; this migration is the Layer-1a classification for INV-LEDGER-001).
- Reference to UF-001 (the audit finding closing).
- Note that `service_role` retains TRUNCATE privilege per platform constraint; the row-level + statement-level triggers are the authoritative catch.

Expected length: ~100–120 lines (audit-log analog is 89 lines; this is 2× because two tables).

- [ ] **Step 2: Surface QW-03 service-level shape**

```ts
// src/services/accounting/journalEntryService.ts, replacing lines 108–119
const { data: period, error: periodErr } = await db
  .from('fiscal_periods')
  .select('is_locked, start_date, end_date')
  .eq('period_id', parsed.fiscal_period_id)
  .single();

if (periodErr || !period) {
  throw new ServiceError('POST_FAILED', 'Fiscal period not found');
}
if (period.is_locked) {
  throw new ServiceError('PERIOD_LOCKED', 'Cannot post to a locked fiscal period');
}
if (parsed.entry_date < period.start_date || parsed.entry_date > period.end_date) {
  throw new ServiceError(
    'PERIOD_DATE_OUT_OF_RANGE',
    `entry_date ${parsed.entry_date} is outside fiscal period range [${period.start_date}, ${period.end_date}]`,
  );
}
```

Note: PG date strings compare lexicographically when in `YYYY-MM-DD` shape. If the column or input shape diverges, switch to explicit `Date` comparison.

- [ ] **Step 3: Surface QW-03 DB-level defense-in-depth shape**

Same migration file as QW-04 (or sibling — operator's call at Task 3 Step 6). Extend `enforce_period_not_locked()` trigger or add a new sibling trigger:

```sql
CREATE OR REPLACE FUNCTION enforce_journal_entry_period_range()
RETURNS TRIGGER AS $$
DECLARE
  period_start DATE;
  period_end DATE;
BEGIN
  SELECT start_date, end_date INTO period_start, period_end
  FROM fiscal_periods WHERE period_id = NEW.fiscal_period_id;

  IF NEW.entry_date < period_start OR NEW.entry_date > period_end THEN
    RAISE EXCEPTION 'entry_date % is outside fiscal period [%, %]',
      NEW.entry_date, period_start, period_end
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_journal_entry_period_range
  BEFORE INSERT ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION enforce_journal_entry_period_range();
```

- [ ] **Step 4: Surface QW-05 trigger shape**

```sql
CREATE OR REPLACE FUNCTION enforce_journal_line_account_org()
RETURNS TRIGGER AS $$
DECLARE
  entry_org UUID;
  account_org UUID;
BEGIN
  SELECT org_id INTO entry_org FROM journal_entries WHERE journal_entry_id = NEW.journal_entry_id;
  SELECT org_id INTO account_org FROM chart_of_accounts WHERE account_id = NEW.account_id;

  IF entry_org IS DISTINCT FROM account_org THEN
    RAISE EXCEPTION 'journal_lines.account_id (%) belongs to org % but parent journal_entry belongs to org %',
      NEW.account_id, account_org, entry_org
      USING ERRCODE = 'foreign_key_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_journal_line_account_org
  BEFORE INSERT ON journal_lines
  FOR EACH ROW EXECUTE FUNCTION enforce_journal_line_account_org();
```

- [ ] **Step 5: Surface diff scope expectation**

If single bundled commit (default per pre-decision #5):

| File | Status | Approx delta |
|---|---|---|
| `supabase/migrations/20240133000000_journal_immutability_triggers.sql` | New | ~+150 lines (immutability + period-range + account-org triggers) |
| `src/services/accounting/journalEntryService.ts` | Modified | ~+12 / -2 lines (period-lock fetch extension + range check) |
| `src/types/supabase.ts` | Regenerated | If `pnpm types:gen` shows drift (none expected — only triggers, no column shapes) |
| `tests/integration/journalEntryImmutability.test.ts` | New | ~+80 lines |
| `tests/integration/journalEntryPeriodDateRange.test.ts` | New | ~+60 lines |
| `tests/integration/journalLinesCrossOrgAccount.test.ts` | New | ~+70 lines |
| **Total** | **6 files** | **~+372 / -2 lines** |

If split into three commits (per pre-decision #5 if any item > ~50 lines):
- Commit 1 (QW-04): migration immutability triggers + immutability test (~+170 / -0).
- Commit 2 (QW-03): service-layer change + DB trigger extension + date-range test (~+90 / -2).
- Commit 3 (QW-05): cross-org trigger + cross-org test (~+115 / -0).

Operator selects shape at Task 3 Step 6.

- [ ] **Step 6: Surface plan to operator**

Wait for operator approval. Specifically gate on:
- Migration filename (`20240133000000_journal_immutability_triggers.sql` — confirm sequential).
- Trigger naming (OPEN: `trg_journal_entries_no_update` vs `enforce_ledger_immutability_*`).
- QW-03 service-vs-DB sequencing (OPEN: ship together vs staged).
- QW-05 trigger vs CHECK (OPEN: trigger preferred).
- Single-bundled vs three-commit shape (per pre-decision #5).
- Multi-org CoA seeding plan (from Task 2 Step 4 verification).

**Do not begin any code edit until operator approves the plan.**

---

## Task 4: Implement QW-04 (immutability triggers)

After plan approval.

- [ ] **Step 1: Author the migration file**

Create `supabase/migrations/20240133000000_journal_immutability_triggers.sql` per Task 3 Step 1 design. Header docstring includes rationale + INV-LEDGER-001 cross-reference + UF-001 closure.

- [ ] **Step 2: Apply migration to local DB**

```bash
pnpm db:reset:clean
pnpm db:seed:all  # if needed for downstream tests
```

Expected: clean apply. Halt and surface on failure (psql syntax error, naming collision, etc.).

- [ ] **Step 3: Author immutability test**

`tests/integration/journalEntryImmutability.test.ts`:
- Seed a posted entry via `journalEntryService.post()`.
- Attempt `UPDATE journal_entries SET description = '...' WHERE journal_entry_id = ...` via `adminClient()`; expect PG exception with `feature_not_supported` ERRCODE.
- Attempt `DELETE FROM journal_entries WHERE journal_entry_id = ...`; expect same exception.
- Attempt `TRUNCATE journal_entries`; expect same exception (or REVOKE-driven permission denial; document in test).
- Mirror for `journal_lines`.

- [ ] **Step 4: Run targeted test**

```bash
pnpm test journalEntryImmutability
```

Expected: green. Halt and surface on failure.

---

## Task 5: Implement QW-03 (period-lock date-range validation)

- [ ] **Step 1: Edit `journalEntryService.post()`** per Task 3 Step 2 design.

Extend the `.select(...)` at line 109 to fetch `start_date`, `end_date`. Insert the date-range check after the existing `is_locked` check at line 117.

- [ ] **Step 2: Extend the migration to add the period-range trigger** (or add as sibling — operator's call at Task 3 Step 6).

- [ ] **Step 3: Re-apply migration**

```bash
pnpm db:reset:clean
```

- [ ] **Step 4: Author period-range test**

`tests/integration/journalEntryPeriodDateRange.test.ts`:
- Seed a fiscal period `[2024-04-01, 2024-04-30]`, unlocked.
- Attempt `journalEntryService.post()` with `entry_date = 2024-03-31`; expect `ServiceError('PERIOD_DATE_OUT_OF_RANGE', ...)`.
- Same with `entry_date = 2024-05-01`.
- Test that bypasses service layer (direct `db.from('journal_entries').insert(...)`) and asserts the DB trigger fires for an out-of-range date.

- [ ] **Step 5: Run targeted test**

```bash
pnpm test journalEntryPeriodDateRange
```

Expected: green. Halt and surface on failure.

---

## Task 6: Implement QW-05 (cross-org account-id guard)

- [ ] **Step 1: Extend the migration to add the cross-org trigger** per Task 3 Step 4 design.

- [ ] **Step 2: Re-apply migration**

```bash
pnpm db:reset:clean
pnpm db:seed:all
```

- [ ] **Step 3: Verify or seed multi-org CoA fixtures**

Per Task 2 Step 4 verification: ensure `SEED.ORG_REAL_ESTATE` and `SEED.ORG_HOLDING` (or whichever secondary seed exists) each have CoA rows. If not, seed inline within the test file.

- [ ] **Step 4: Author cross-org test**

`tests/integration/journalLinesCrossOrgAccount.test.ts`:
- Seed two orgs with CoA each.
- Attempt `INSERT INTO journal_lines (journal_entry_id, account_id, ...)` where the `journal_entry`'s `org_id` is org A but the `account_id` belongs to org B.
- Expect PG exception with `foreign_key_violation` ERRCODE.

- [ ] **Step 5: Run targeted test**

```bash
pnpm test journalLinesCrossOrgAccount
```

Expected: green. Halt and surface on failure.

---

## Task 7: Full-suite gate

- [ ] **Step 1: Run agent:validate**

```bash
pnpm agent:validate
```

- [ ] **Step 2: Run full test suite**

```bash
pnpm test
```

Expected: full-suite green at HEAD baseline. Halt and surface on any new failure.

- [ ] **Step 3: Run typecheck**

```bash
pnpm typecheck
```

Expected: clean. If `pnpm types:gen` was needed, the regenerated `src/types/supabase.ts` should have already passed at Step 2.

---

## Task 8: Founder review gate

- [ ] **Step 1: Surface to operator for review**

Present:
1. The migration diff (full content — ~150 lines).
2. The `journalEntryService.post()` diff.
3. The three new test files.
4. `pnpm agent:validate` output.
5. `pnpm test` output.
6. `pnpm typecheck` output.
7. Diff scope summary.
8. Cross-references to UF-001 / UF-004 / UF-005 + INV-LEDGER-001.

Wait for operator approval. Do not commit before approval.

- [ ] **Step 2: Apply revisions if requested**

Re-run targeted tests + full suite after every revision pass. Re-surface for re-approval.

---

## Task 9: Commit + friction-journal

- [ ] **Step 1: Stage files**

```bash
git add supabase/migrations/20240133000000_journal_immutability_triggers.sql \
        src/services/accounting/journalEntryService.ts \
        src/types/supabase.ts \
        tests/integration/journalEntryImmutability.test.ts \
        tests/integration/journalEntryPeriodDateRange.test.ts \
        tests/integration/journalLinesCrossOrgAccount.test.ts
git status --short
```

- [ ] **Step 2: Create the commit (single-bundled default)**

```bash
export COORD_SESSION='S26-ledger-integrity-day-1' && git commit -m "$(cat <<'EOF'
feat(ledger): Day-1 ledger-integrity fixes — immutability triggers, period date-range, cross-org account guard

- QW-04 (UF-001): supabase/migrations/20240133000000_journal_
  immutability_triggers.sql adds three triggers per table on
  journal_entries and journal_lines (BEFORE UPDATE / BEFORE DELETE
  / BEFORE TRUNCATE). Pattern mirrors audit_log append-only
  (20240122000000_audit_log_append_only.sql). Closes the
  convention-only gap surfaced by UF-001 (Phase 1.1 carry-
  forward via UF-006). Moves INV-LEDGER-001 enforcement from
  Layer 3 (service convention) to Layer 1a (DB physical
  enforcement) per ADR-0008.
- QW-03 (UF-004): journalEntryService.post() extends the period-
  lock query to fetch start_date + end_date; adds range check
  after the existing is_locked guard. Throws ServiceError
  ('PERIOD_DATE_OUT_OF_RANGE'). DB-level defense-in-depth via
  the new enforce_journal_entry_period_range() trigger in the
  same migration file.
- QW-05 (UF-005): BEFORE INSERT trigger on journal_lines that
  asserts journal_entries.org_id == chart_of_accounts.org_id
  for the inserted row. Closes cross-org account-id injection.
  Trigger preferred over composite-FK because composite-FK
  requires denormalizing org_id into journal_lines.
- Sequenced QW-04 → QW-03 → QW-05 within session per operator
  pre-decision: DB triggers act as defense-in-depth if QW-03
  service-layer guard has a logic bug.
- Closes UF-001, UF-004, UF-005. Phase 1.1 UF-006 carry-forward
  closed for the ledger-table append-only surface; service-
  mutation CI guard (LT-01) remains Phase 2.
- Sequenced after S25 (non-ledger Day-1) and before S27 (MT-01
  atomicity RPC). S27 blocks on this session because the RPC
  must respect the immutability triggers shipped here. See
  docs/09_briefs/phase-1.2/post-audit-fix-stack-arc.md.

Session: S26-ledger-integrity-day-1

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

If split into three commits per pre-decision #5: each commit ships its named QW item with a focused subject (`feat(ledger): QW-04 ...`, `feat(ledger): QW-03 ...`, `feat(ledger): QW-05 ...`).

- [ ] **Step 3: Verify commit landed**

```bash
git log -1 --stat  # or HEAD~2 if three commits
```

- [ ] **Step 4: Append friction-journal entry**

```markdown
- 2026-XX-XX NOTE — S26 Phase 1.2 post-audit Day-1 (ledger-integrity):
  QW-04 (immutability triggers on journal_entries + journal_lines,
  mirroring audit-log pattern), QW-03 (period-lock date-range
  validation, service + DB layers), QW-05 (cross-org account-id
  trigger on journal_lines INSERT). Sequenced QW-04 → QW-03 → QW-05
  per operator pre-decision so DB-level immutability stands as
  defense-in-depth before the service-layer date-range guard ships.
  Trigger naming chose <option a/b>; QW-03 ships as <single/staged
  commit>; QW-05 ships as trigger (composite-FK rejected because
  it requires denormalizing org_id into journal_lines). Closes
  UF-001 / UF-004 / UF-005. Moves INV-LEDGER-001 from Layer 3
  (convention) to Layer 1a (DB physical enforcement) per ADR-0008.
```

Surface for operator review; commit as a follow-on (or fold into the bundled commit if the operator prefers).

- [ ] **Step 5: Run session-end**

```bash
bash scripts/session-end.sh
```

---

## Test strategy summary

- **Fixtures.** `SEED.ORG_REAL_ESTATE` + a secondary org with its own CoA (per Task 2 Step 4 verification). Posted journal entry from prior tests or seeded inline. Fiscal period `[2024-04-01, 2024-04-30]` for the date-range test.
- **Integration tests added.**
  - `tests/integration/journalEntryImmutability.test.ts` — UPDATE / DELETE / TRUNCATE on journal_entries and journal_lines all raise.
  - `tests/integration/journalEntryPeriodDateRange.test.ts` — service-layer + DB-layer date-range enforcement.
  - `tests/integration/journalLinesCrossOrgAccount.test.ts` — cross-org account-id injection raises.
- **Category-A floor tests (per CLAUDE.md "What done means" §1).** All 5 must remain green.
- **Full-suite gate.** `pnpm test` green at session closeout.
- **Schema regen check.** `pnpm types:gen` if any column shape shifts (none expected — triggers only).

## Founder review gate

Surfaced at Task 8 Step 1. Artifacts:
1. Migration diff (full content).
2. Service-layer diff.
3. Three new test files.
4. `pnpm agent:validate`, `pnpm test`, `pnpm typecheck` outputs.
5. Cross-reference table tying each diff to its UF / QW ID.
6. Confirmation that no out-of-scope files appear in `git diff --stat`.
7. Confirmation that pre-decisions surfaced as OPEN are operator-resolved before commit.

## Friction-journal entry expected at closeout

One-line description (Task 9 Step 4): "S26 Phase 1.2 post-audit Day-1 ledger-integrity: immutability triggers + period date-range + cross-org account-id trigger. Sequenced QW-04 → QW-03 → QW-05 for defense-in-depth. INV-LEDGER-001 moves from Layer 3 to Layer 1a per ADR-0008."

## Cross-references

- `docs/07_governance/audits/phase-1.2/action-plan.md` — QW-03 / QW-04 / QW-05.
- `docs/07_governance/audits/phase-1.2/unified-findings.md` — UF-001 / UF-004 / UF-005.
- Phase 1.1 UF-006 carry-forward (ledger-table append-only facet closed; service-mutation CI guard remains Phase 2 / LT-01).
- `docs/02_specs/ledger_truth_model.md` — INV-LEDGER-001 leaf (now Layer 1a per this migration).
- `docs/07_governance/adr/0008-layer-1-enforcement-modes.md` — Layer-1a classification (commit-time physical enforcement).
- `supabase/migrations/20240122000000_audit_log_append_only.sql` — pattern reference.
- `docs/09_briefs/phase-1.2/post-audit-fix-stack-arc.md` — arc context.
- `docs/09_briefs/phase-1.2/session-25-brief.md` — prior session.
- `docs/09_briefs/phase-1.2/session-27-brief.md` — next session (MT-01 atomicity RPC, blocks on this session).

## Out of scope (do not do)

- QW-01 / QW-02 / QW-07 (S25, already shipped).
- MT-01 atomicity RPC (S27).
- QW-06 (Phase 2).
- LT-01 / UF-006 service-mutation CI guard (Phase 2).
- MT-03 / MT-04 / MT-05 / MT-06 (Phase 2).
- Orchestrator or prompt edits.
- Reversal-mirror enforcement migration (stays in service layer per ADR-001).

## Halt conditions

- Any verification step in Task 2 fails.
- Migration apply fails (psql syntax / naming collision).
- `pnpm agent:validate` or `pnpm test` regression caused by this session's edits.
- Any out-of-scope file appears in `git diff --stat`.
- Operator does not approve plan at Task 3 Step 6.
- Multi-org CoA seeding plan unresolvable in S26 scope (defer cross-org test to Phase 2 with explicit ADR if so).
- A grep-confirmed claim in this brief proves wrong at execution time.
