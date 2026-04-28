# Session 27 — Phase 1.2 post-audit MT-01: transaction atomicity RPC

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Paid-API gate:** Task 9 fires real spend (~$0.08–$0.10) for shape 12 caching-baseline regression. Operator authorization required at Task 9 Step 1 before the regression invocation.

**Goal:** Implement `write_journal_entry_atomic()` plpgsql function wrapping the four sequential PostgREST calls in `journalEntryService.post()` (lines 154–228 — `journal_entries` insert + `journal_lines` insert + `audit_log` insert + optional `ai_actions` insert) into a single Postgres transaction. Replace the four-call sequence with a single `db.rpc('write_journal_entry_atomic', { ... })` call. Closes UF-003 (transaction atomicity) and contributes to closing UF-001's atomicity facet (the immutability triggers from S26 + this RPC together restore the load-bearing INV-LEDGER-001 + INV-AUDIT-001 pairing on the mutation path).

**Architecture (V1 minimal scope):**

The RPC accepts typed JSONB params matching `journalEntryService.post()`'s current signature (entry header, lines array, audit metadata), executes all inserts inside one transaction, and returns `{ entry_id, audit_log_id }`. The service-layer wrapper fetches the period (for the QW-03 date-range check from S26 — that runs before the RPC because it produces a typed `ServiceError` UX) and the reversal-mirror validation (also stays in service layer per ADR-001 — requires reading the prior entry's data; RPC stays scoped to the mutation surface). All other writes move into the RPC.

The four calls collapse to:
1. `validateReversalMirror(...)` — service layer, unchanged (ADR-001 placement).
2. Period-lock + date-range check — service layer, unchanged (S26 QW-03).
3. `db.rpc('write_journal_entry_atomic', { ... })` — single call, wrapping the four prior writes.

If audit_log insert fails inside the RPC, the entire transaction rolls back: no orphan entries, no orphan lines, no INV-AUDIT-001 violation. **Pattern reference (function-definition wrapper only, NOT body shape):** the existing RPC migrations (`supabase/migrations/20240107000000_report_rpc_functions.sql`, `20240125000000_account_balance_rpc.sql`, and the 0126/0127 sibling RPCs) are all `LANGUAGE sql` single-SELECT functions inlined by the planner — fundamentally different from this RPC, which is `LANGUAGE plpgsql` with a procedural body (multi-statement INSERT...RETURNING, control flow, potential EXCEPTION handling). The shared pattern is the function-definition wrapper (`CREATE OR REPLACE FUNCTION`, `RETURNS`, `GRANT EXECUTE`, `SECURITY INVOKER` vs. `DEFINER`), not the body. This RPC is the project's first procedural plpgsql write-path function; `tests/setup/test_helpers.sql` is the closest in-tree precedent for procedural plpgsql, but it's a test helper rather than a production migration.

**Tech stack:** PostgreSQL plpgsql (new function), TypeScript service-layer (`db.rpc(...)` call pattern matches existing read RPCs at `accountBalanceService` and `balanceSheetService`), Supabase migrations, Vitest. No new dependencies. New migration file. Type regeneration: `pnpm types:gen` after migration apply (RPC signatures show up in `src/types/supabase.ts`).

---

**Anchor (parent) SHA:** S26 commit SHA (set by orchestrating session at brief-write time; verify HEAD's parent matches at Task 1 Step 2). Per fix-stack arc, S27 sequences after S26 closure — running the RPC against pre-trigger schema would not validate the defense-in-depth interaction with the immutability triggers shipped in S26.

**Upstream authority:**
- `docs/07_governance/audits/phase-1.2/action-plan.md` — MT-01 (lines 58–62). "Done when: `journalEntryService.post()` executes all three operations within a single database transaction. A failure at any point (e.g., audit_log insert fails, balance constraint fires) rolls back the entire operation. Integration tests verify partial-failure rollback and orphan prevention."
- `docs/07_governance/audits/phase-1.2/unified-findings.md` — UF-003 (lines 163–187 transaction atomicity gap; carry-forward from Phase 1.1 UF-001 per line 187 cross-reference). UF-001 (lines 117–135 — atomicity facet pairs with the immutability triggers from S26 to close the full ledger-integrity surface).
- `docs/02_specs/ledger_truth_model.md` — INV-AUDIT-001 (every mutation produces an audit record; this RPC moves the guarantee from "service-layer convention with synchronous audit write" to "DB-transaction-enforced atomicity"). INV-LEDGER-001 + INV-AUDIT-001 pairing on the post path.
- `docs/03_architecture/phase_simplifications.md:65–127` — documents the four-call sequence as "Simplification 1"; UF-003 evidence at `unified-findings.md:181`. This RPC is the named Phase 2 correction for that simplification.
- Pattern reference (function-definition wrapper only): `supabase/migrations/20240107000000_report_rpc_functions.sql` (and 0125/0126/0127 siblings) — `LANGUAGE sql` single-SELECT read RPCs; the body shape is NOT a precedent for this session's procedural plpgsql write RPC. The shared pattern is the wrapper (`CREATE OR REPLACE FUNCTION`, `RETURNS`, `GRANT EXECUTE`). `tests/setup/test_helpers.sql` is the closest in-tree procedural plpgsql but it is a test helper, not a production migration. This RPC is the project's first procedural plpgsql write-path function.
- ADR-001 — reversal-mirror placement; stays in service layer.
- S20 caching-enabled paid-validation pattern (`docs/09_briefs/phase-1.2/session-20-brief.md`) — paid-API regression methodology.
- S22 caching-baseline (`docs/09_briefs/phase-2/session-22-brief.md`, commit `cceb725`) — caching-active per-flow cost measurement; this session's regression compares against that baseline.
- `CLAUDE.md` — `journal-entry-rules` and `service-architecture` skills apply.

---

## Session label
`S27-mt-01-rpc` — captures the MT-01 transaction-atomicity workstream.

## Hard constraints (do not violate)

- **Out of scope:**
  - QW-01 / QW-02 / QW-04 / QW-03 / QW-05 / QW-07 (closed in S25 + S26).
  - QW-06 (Phase 2).
  - LT-01 / UF-006 service-mutation CI guard (Phase 2).
  - MT-02 canvas refresh (Phase 2).
  - MT-03 read-path enforcement wrapper (Phase 2).
  - MT-04 conversation rotation (Phase 2).
  - MT-05 audit-emit alerting (Phase 2).
  - MT-06 pino redaction expansion (Phase 2).
  - Reversal-mirror enforcement migration (stays in service layer per ADR-001).
  - Any orchestrator or prompt-text edits.
  - Cross-turn caching optimization (Phase 2+).
- **Spend ceilings (paid-API regression at Task 9):**
  - Cumulative ceiling: **$0.20** (matches S22's posture; well under that since this session fires shape 12 once with caching active).
  - Per-call ceiling: **$0.10** (caching-active envelope per S22 evidence; if a single invocation exceeds $0.10, that's a signal caching isn't firing as designed — halt and surface).
- **Paid-API authorization gate.** Task 9 Step 1 requires explicit operator authorization in chat before the regression invocation. **No paid-API spend authorization at brief-creation time.**
- **Test posture floor.** ALL existing tests green at HEAD post-edit. `pnpm agent:validate` clean. Full suite: any pre-existing carry-forwards documented at HEAD remain unchanged. No new failures attributable to this session.
- **The RPC is the only mutation surface for `journalEntryService.post()`.** No partial-RPC option. The four-call sequence is replaced wholesale; service layer retains ONLY the reversal-mirror check (ADR-001) and the period date-range check (S26 QW-03) before the single RPC call.
- **Audit-log writes are inside the RPC.** Splitting audit out would defeat the atomicity guarantee. INV-AUDIT-001's "every mutation produces an audit record" is the load-bearing claim being mechanically enforced here.
- **Reversal-mirror stays out of the RPC.** Validation requires reading prior entry data (ADR-001); RPC stays scoped to the single-mutation surface. Mirror enforcement is a separate Phase 2 ADR if a migration is ever scoped.
- **Y2 commit shape (two commits, two founder-review gates).** Commit 1 = RPC migration + service refactor + integration tests + paid-API regression script (if needed). Commit 2 = paid-API regression evidence + friction-journal entry summarizing the validation. Matches S20 / S22 precedent for paid-API workstreams.
- **Caching invariant.** S22's caching enablement at `src/agent/orchestrator/index.ts` `callClaude` invocation MUST remain unchanged. The regression at Task 9 measures caching-active per-flow cost; if caching isn't firing, the regression's cost projections are wrong and the run halts.
- **Convention #8 verify-directly discipline.** Every cited file/line/UF-ID was grep-confirmed at brief-write. Re-verify at execution time before edit; halt on any drift.

---

## Pre-decisions enumerated

What's decided at brief-write (do not re-litigate at execution time):

1. **Single-item session.** Operator decision: only item that changes function shape (replaces 4 PostgREST calls with 1 RPC) merits dedicated isolation. No bundling with QW or other MT items.
2. **RPC name: `write_journal_entry_atomic`.** Returns `{ entry_id: uuid, audit_log_id: uuid }`. Naming follows the existing `account_balance_rpc` / `balance_sheet_rpc` lineage from migrations 125/126/127.
3. **RPC inputs: typed JSONB params matching the current `journalEntryService.post()` signature.** Specifically: entry header fields (`org_id`, `fiscal_period_id`, `entry_date`, `description`, `reference`, `source`, `idempotency_key`, `reverses_journal_entry_id`, `reversal_reason`, `adjustment_reason`, `entry_number`, `entry_type`, `created_by`), lines array (`account_id`, `description`, `debit_amount`, `credit_amount`, `currency`, `amount_original`, `amount_cad`, `fx_rate`, `tax_code_id`), audit metadata (`action`, `entity_type`, `tool_name`, `idempotency_key`, and a nullable `before_state` field that S25's PII redaction is applied to **only when non-null**). For the post path specifically, `before_state` is `null` today — `recordMutation()` is invoked without `before_state` for INSERT-type mutations (verified at the call site). The PII-redaction reuse from S25 QW-07 is a forward-compatibility provision for future RPC callers that may pass non-null `before_state`; it is a no-op on the current post path.
4. **Reversal-mirror enforcement: STAYS in service layer (Zod refinement / `validateReversalMirror`).** Rationale: requires reading prior entry data; RPC stays scoped to the mutation surface. NOT moved into RPC.
5. **Period date-range check (S26 QW-03 service-layer fast-path): STAYS in service layer.** RPC's defense-in-depth layer comes from S26's DB trigger; the service layer keeps the typed-error UX. NOT moved into RPC.
6. **Audit-log writes: included in the RPC.** Splitting audit out defeats the purpose. INV-AUDIT-001 enforcement is now mechanical (DB transaction) instead of conventional (synchronous write inside the same caller-managed client).
7. **`entry_number` computation: STAYS in service layer (current MAX+1 query at lines 127–136).** No `FOR UPDATE` lock per Phase 1.1 simplification; the RPC trusts the supplied `entry_number`. Phase 2 may move this into the RPC under a `FOR UPDATE` lock if concurrent-post collisions become observable. **Concurrent-post race acknowledgment:** today there is no `UNIQUE (org_id, fiscal_period_id, entry_number)` constraint on `journal_entries` (verified at HEAD against the initial schema — only an `idx_je_org_period` non-unique index exists). Two concurrent `post()` calls for the same `(org_id, fiscal_period_id)` can both observe the same `MAX+1` and write duplicate `entry_number` values silently. The agent's `idempotency_key` prevents the *same logical operation* from posting twice, but does not prevent two distinct concurrent operations from racing. See OPEN block below for the deferral-vs-fix decision on this race.
8. **Test surface.** Existing `journalEntryService` integration tests (~15–20 tests under `tests/integration/`) become the regression bedrock — they verify that the post path's externally observable behavior is unchanged. Add a new `journalEntryAtomicRollback.test.ts` exercising failure-mid-transaction (e.g., violate the unbalanced constraint inside the RPC by passing imbalanced lines; assert that nothing persisted — no entry, no lines, no audit row).
9. **Paid-API regression sanity at session closeout.** Re-fire `scripts/oi3-m1-validation.ts --first-shape-only` against shape 12 with caching-active to confirm orchestrator → service path unchanged from a model-cognitive standpoint. Estimated cost: ~$0.04–$0.06 per S22's measured baseline; ceiling $0.10 per-call. Operator authorization at Task 9 Step 1.
10. **Estimated session duration: full day (~6–8 hours).** RPC authoring (~2h) + service refactor (~1h) + new rollback test (~1h) + full-suite regression (~1h) + paid-API regression + friction-journal (~1h) + review buffer.
11. **Y2 commit shape.** Commit 1 = RPC migration + service refactor + integration tests. Commit 2 = paid-API regression evidence + friction-journal entry. Mirrors S20 / S22 paid-API split.

OPEN — operator to resolve before Session start:

- **MT-01 RPC parameter shape: three separate JSONB params (RESOLVED).** Per operator decision: option (b) three separate JSONB params (`header`, `lines`, `audit`). Rationale: simpler to type at the TS boundary; matches conceptual decomposition; PG handles three params fine; failure-mode distinguishability ("lines insert fails" vs "audit insert fails") is trivially preserved at integration-test level. Bundled JSONB would require RPC-internal shape validation duplicating Zod's job at the service layer for no win. NOT to be re-litigated.

- **`entry_number` UNIQUE constraint scope expansion (genuinely OPEN).** Today there is no `UNIQUE (org_id, fiscal_period_id, entry_number)` constraint on `journal_entries`; concurrent-post race produces silent duplicates (per pre-decision #7). Two paths:
  - **(a) Defer (default per Phase 1.1 simplification).** Keep entry_number generation in service layer; accept the race; Phase 2 work to move into RPC with `FOR UPDATE` lock or add the UNIQUE constraint when concurrent-post collisions become observable.
  - **(b) Add the UNIQUE constraint in this session.** ~5 lines of SQL (one ALTER TABLE) + one integration test asserting the typed PG exception on collision. Costs nothing if entry-numbers are correctly generated; surfaces the race as a typed PG exception (the service catches it and retries — but retry handling is NOT in scope for this session, so a collision today would surface as `ServiceError('POST_FAILED')` to the caller). Surfaces the race instead of silent duplication.
  - Brief-write recommendation: **operator's call.** If (b), S27 scope expands by ~5 lines SQL + 1 test (~30 minutes of additional work). If (a), record the deferral explicitly in this session's friction-journal entry per the audit's "Do Not Do" discipline.
  - The reversal-mirror placement (formerly OPEN) is RESOLVED per pre-decision #4 + ADR-001: stays in service layer; do not re-litigate. DB-level mirror enforcement is a separate Phase 2 ADR if scoped.

---

## Exit-criteria matrix

| ID | UF | Target file(s) / migration | Done when (verbatim from action-plan) | Test evidence required |
|---|---|---|---|---|
| MT-01 | UF-003 (and UF-001 atomicity facet) | `supabase/migrations/20240134000000_write_journal_entry_atomic_rpc.sql` (new) — plpgsql function. `src/services/accounting/journalEntryService.ts` lines 154–228 — replace four PostgREST calls with single `db.rpc('write_journal_entry_atomic', { ... })`. | "`journalEntryService.post()` executes all three operations within a single database transaction. A failure at any point (e.g., audit_log insert fails, balance constraint fires) rolls back the entire operation. Integration tests verify partial-failure rollback and orphan prevention." | (a) New `tests/integration/journalEntryAtomicRollback.test.ts` exercises failure-mid-transaction (imbalanced lines; mid-RPC constraint violation); asserts no rows persisted across `journal_entries`, `journal_lines`, `audit_log`. (b) Existing `journalEntryService` integration tests (~15–20) continue to pass — externally observable post-path behavior is unchanged. (c) Paid-API regression on shape 12 confirms orchestrator → service path unchanged from a model-cognitive standpoint and caching invariant holds. |

---

## Task 1: Session-init, HEAD anchor, Anthropic auth pre-flight

- [ ] **Step 1: Run session-init**

```bash
bash scripts/session-init.sh S27-mt-01-rpc
```

- [ ] **Step 2: Confirm HEAD points at S26's commit (parent matches anchor)**

```bash
git rev-parse HEAD~1
git log -1 --name-only --format='%H'
```

Expected: `HEAD~1` equals S26's commit SHA. HEAD's single changed file should be `docs/09_briefs/phase-1.2/session-27-brief.md`.

If either check fails, STOP. The arc dependency graph requires S26 closure before S27 begins (immutability triggers from S26 must be live for the RPC's defense-in-depth interaction to be meaningful).

- [ ] **Step 3: Verify Anthropic API auth is configured (for Task 9 paid regression)**

```bash
test -n "$ANTHROPIC_API_KEY" || (echo "ERROR: ANTHROPIC_API_KEY not set" && exit 2)
```

Per S20 / S22 pattern: env var must propagate to WSL. If missing, source `.env.local`:

```bash
set -a && source .env.local && set +a
```

Re-run the check. Halt if still missing — no point proceeding through implementation if Task 9 regression can't fire at session closeout.

---

## Task 2: Pre-flight verification

- [ ] **Step 1: Verify `journalEntryService.post()` four-call surface**

```bash
sed -n '99,230p' src/services/accounting/journalEntryService.ts
```

Expected:
- Reversal-mirror check at line 102–105 (stays).
- Period-lock query at lines 108–119 (stays after S26's date-range extension).
- Entry-number computation at lines 127–136 (stays per pre-decision #7).
- Entry insert at lines 154–185 (moves into RPC).
- Lines insert at lines 206–213 (moves into RPC).
- Audit-log insert via `recordMutation()` at lines 220–228 (moves into RPC).

If line numbers drift from this expectation, surface to operator at Task 3. **Expected drift:** S26's QW-03 service-layer date-range check adds 2-3 lines to the period query block at lines 108-119; everything below shifts by that amount. A drift of ~2-5 lines is expected and not a halt condition. Drift of >10 lines, OR drift in the *structure* of the four-call surface (e.g., one of the calls has been factored into a helper, or a fifth call has been added), IS a halt condition — surface to operator before Task 3.

- [ ] **Step 2: Verify S25 QW-07 PII redaction is at HEAD**

```bash
grep -n "redactPii\|PII_FIELDS" src/services/audit/recordMutation.ts
```

Expected: redaction function present (added in S25). **For the post path specifically, `before_state` is `null` — the redaction is a no-op on this call path.** The redact-in-service-vs-replicate-in-plpgsql question only matters when `before_state` is non-null, which today does not happen for `journal_entry.post`. Default forward-compatibility provision: redact in service before passing JSONB into the RPC (single source of truth; the helper from S25 is reused). This may turn out to be a non-decision at execution time; surface to operator only if `before_state` is non-null on the post path (drift from current state).

- [ ] **Step 3: Verify S26 immutability triggers are at HEAD**

```bash
grep -n "trg_journal_entries_no_update\|reject_journal_entries_mutation" supabase/migrations/20240133000000_journal_immutability_triggers.sql
```

Expected: triggers present from S26. The RPC's `INSERT INTO journal_entries` is exempt from these (BEFORE UPDATE / BEFORE DELETE only); confirm trigger scope to avoid false negatives during testing.

- [ ] **Step 4: Verify next-sequential migration timestamp**

```bash
ls supabase/migrations/ | tail -3
```

Expected: latest is S26's `20240133000000_journal_immutability_triggers.sql`. New migration: `20240134000000_write_journal_entry_atomic_rpc.sql`. Surface drift if the latest has advanced.

- [ ] **Step 5: Verify existing RPC pattern**

```bash
sed -n '1,50p' supabase/migrations/20240107000000_report_rpc_functions.sql
sed -n '1,50p' supabase/migrations/20240125000000_account_balance_rpc.sql
```

Expected: the existing RPC migrations are `LANGUAGE sql` single-SELECT functions (the planner inlines them); they are NOT procedural plpgsql precedents for this session's body. The shared pattern is the function-definition wrapper only — `CREATE OR REPLACE FUNCTION`, `RETURNS`, `GRANT EXECUTE`, `SECURITY INVOKER` vs. `DEFINER` choice. This session's RPC is the project's first procedural plpgsql write-path function; the body shape (multi-statement INSERT...RETURNING, BEGIN ... END block) is being introduced fresh in Task 3, not copied from an in-tree precedent. Confirm the wrapper conventions match (the body authoring is Task 3's surface).

- [ ] **Step 6: Verify caching baseline at HEAD**

```bash
grep -n "cache_control" src/agent/orchestrator/index.ts | head -5
```

Expected: `cache_control: { type: 'ephemeral' }` present at the `callClaude` invocation site (S22 commit `856dcc7`). The Task 9 regression measures cost against this baseline; if caching isn't enabled at HEAD, the regression's cost projections are wrong.

- [ ] **Step 7: Verify the OI-3 paid-validation harness exists**

```bash
ls scripts/oi3-m1-validation.ts
```

Expected: harness from S20 (commit `31166fb` per S22 brief reference). Task 9 reuses `--first-shape-only`.

- [ ] **Step 8: Verify test-baseline at HEAD**

```bash
pnpm agent:validate
```

Expected: clean. Halt and surface on failure.

- [ ] **Step 9: Verification report to operator**

Surface:
1. `journalEntryService.post()` four-call surface (Step 1).
2. S25 QW-07 PII redaction present (Step 2).
3. S26 immutability triggers present (Step 3).
4. Next-sequential migration timestamp (Step 4).
5. Existing RPC pattern intact (Step 5).
6. S22 caching enabled at HEAD (Step 6).
7. OI-3 paid-validation harness present (Step 7).
8. `pnpm agent:validate` clean (Step 8).

Wait for operator acknowledgment before Task 3.

---

## Task 3: Step 2 Plan — RPC signature, service refactor, test plan

Produce a planning report and wait for operator approval before any code edit.

- [ ] **Step 1: Surface RPC signature**

Default per pre-decision #3 + OPEN resolution (option b — three separate JSONB params):

```sql
CREATE OR REPLACE FUNCTION write_journal_entry_atomic(
  header JSONB,    -- entry header fields
  lines JSONB,     -- array of line objects
  audit JSONB      -- audit-log payload (action, entity_type, tool_name, idempotency_key, before_state)
)
RETURNS TABLE (entry_id UUID, audit_log_id UUID)
LANGUAGE plpgsql
SECURITY INVOKER  -- caller's role context; service-role client bypasses RLS as today
AS $$
DECLARE
  new_entry_id UUID;
  new_audit_id UUID;
BEGIN
  -- Insert entry header
  INSERT INTO journal_entries (
    org_id, fiscal_period_id, entry_date, description, reference,
    source, source_system, idempotency_key, reverses_journal_entry_id,
    reversal_reason, adjustment_reason, entry_number, entry_type, created_by
  )
  SELECT
    (header->>'org_id')::uuid,
    (header->>'fiscal_period_id')::uuid,
    (header->>'entry_date')::date,
    header->>'description',
    header->>'reference',
    header->>'source',
    header->>'source',  -- source_system mirror
    header->>'idempotency_key',
    NULLIF(header->>'reverses_journal_entry_id', '')::uuid,
    header->>'reversal_reason',
    header->>'adjustment_reason',
    (header->>'entry_number')::integer,
    header->>'entry_type',
    (header->>'created_by')::uuid
  RETURNING journal_entry_id INTO new_entry_id;

  -- Insert lines (deferred balance constraint fires here)
  INSERT INTO journal_lines (
    journal_entry_id, account_id, description, debit_amount, credit_amount,
    currency, amount_original, amount_cad, fx_rate, tax_code_id
  )
  SELECT
    new_entry_id,
    (line->>'account_id')::uuid,
    line->>'description',
    (line->>'debit_amount')::numeric,
    (line->>'credit_amount')::numeric,
    line->>'currency',
    (line->>'amount_original')::numeric,
    (line->>'amount_cad')::numeric,
    (line->>'fx_rate')::numeric,
    NULLIF(line->>'tax_code_id', '')::uuid
  FROM jsonb_array_elements(lines) AS line;

  -- Insert audit_log row
  INSERT INTO audit_log (
    org_id, user_id, trace_id, action, entity_type, entity_id,
    before_state, after_state_id, tool_name, idempotency_key, reason
  )
  VALUES (
    NULLIF(audit->>'org_id', '')::uuid,
    (audit->>'user_id')::uuid,
    audit->>'trace_id',
    audit->>'action',
    audit->>'entity_type',
    new_entry_id,
    audit->'before_state',
    NULL,
    audit->>'tool_name',
    audit->>'idempotency_key',
    audit->>'reason'
  )
  RETURNING audit_log_id INTO new_audit_id;

  RETURN QUERY SELECT new_entry_id, new_audit_id;
END;
$$;
```

Header docstring:
- Reference INV-AUDIT-001 + INV-LEDGER-001 leaves.
- Reference UF-003 closure + UF-001 atomicity facet.
- Reference Phase 2 Simplification 1 correction (`docs/03_architecture/phase_simplifications.md`).
- Note that reversal-mirror stays in service layer per ADR-001.
- Note that period date-range check stays in service layer per S26 QW-03.
- **Deferred-constraint trigger interaction:** explicitly note that `enforce_journal_entry_balance` (an `INITIALLY DEFERRED` constraint trigger on `journal_lines`, `AFTER INSERT OR UPDATE OR DELETE`, `FOR EACH ROW`) is the mechanism that produces the rollback semantic this RPC depends on. Inside the single RPC transaction, the trigger fires when the `journal_lines` insert completes; if debits ≠ credits, the trigger raises and the entire RPC rolls back (entry header + lines + audit_log all rolled back as a unit). The Test 1 (imbalanced lines) rollback test in Task 3 Step 3 exercises this exact mechanism. Without the deferred constraint, the rollback test would not be meaningful — the docstring should say so.

Expected length: ~80–100 lines.

- [ ] **Step 2: Surface service refactor shape**

```ts
// In src/services/accounting/journalEntryService.ts, replacing lines 148–228:

// (Reversal mirror, period date-range, entry-number computation stay above this point unchanged.)

const auditPayload = redactPii({
  org_id: parsed.org_id,
  user_id: ctx.caller.user_id,
  trace_id: ctx.trace_id,
  action:
    isAdjustment ? 'journal_entry.adjust'
      : isReversal ? 'journal_entry.reverse'
      : 'journal_entry.post',
  entity_type: 'journal_entry',
  tool_name: ctx.tool_name ?? null,
  idempotency_key: parsed.idempotency_key ?? null,
  before_state: null,  // INSERT omits before_state per recordMutation convention
  reason: null,
});

const { data, error } = await db.rpc('write_journal_entry_atomic', {
  header: { /* entry header fields */ },
  lines: parsed.lines,
  audit: auditPayload,
});

if (error || !data) {
  log.error({ error }, 'write_journal_entry_atomic failed');
  throw new ServiceError('POST_FAILED', error?.message ?? 'RPC failed');
}

const { entry_id, audit_log_id } = data[0];
log.info({ entry_id, audit_log_id }, 'Journal entry posted atomically');
return { journal_entry_id: entry_id };
```

The PostgREST `db.rpc(...)` returns `data` as an array (RPCs returning TABLE shape); destructure `data[0]` for the single result row.

- [ ] **Step 3: Surface rollback test shape**

`tests/integration/journalEntryAtomicRollback.test.ts`:
- **Test 1 (imbalanced lines):** call `journalEntryService.post()` with `lines` whose debit/credit sums diverge; expect the deferred-constraint trigger (`enforce_journal_entry_balance`) to fire inside the RPC. Assert: `journal_entries`, `journal_lines`, `audit_log` rows for this `idempotency_key` are all absent (no orphans).
- **Test 2 (FK violation on `account_id`):** pass an `account_id` not in `chart_of_accounts`. Expect `foreign_key_violation`. Assert no rows persisted.
- **Test 3 (cross-org account-id, exercises S26 QW-05 trigger inside the RPC):** pass an `account_id` from a different org. Expect S26 QW-05 trigger to fire. Assert no rows persisted.
- **Test 4 (RPC success path):** valid input; verify all three rows (entry + lines + audit) are present after RPC returns.
- **Test 5 (service-layer guards still fire BEFORE the RPC):** out-of-range `entry_date` raises `ServiceError('PERIOD_DATE_OUT_OF_RANGE', ...)` from S26 QW-03. Assert: (a) `ServiceError` is thrown with the expected code, (b) no rows persisted across `journal_entries` / `journal_lines` / `audit_log` for the test's idempotency_key (queryable by idempotency_key uniqueness). The "no RPC was called" claim is implicit in the no-rows-persisted observation; do NOT attempt to spy on `db.rpc` directly (that requires mocking the Supabase client, which integration tests do not do — the test exercises real PostgREST). The two assertions together prove the service-layer guard fires before the RPC and aborts the operation cleanly.

- [ ] **Step 4: Surface diff scope expectation**

Commit 1:

| File | Status | Approx delta |
|---|---|---|
| `supabase/migrations/20240134000000_write_journal_entry_atomic_rpc.sql` | New | ~+90 lines |
| `src/services/accounting/journalEntryService.ts` | Modified | ~+30 / -85 lines (the four-call sequence collapses to one) |
| `src/types/supabase.ts` | Regenerated | RPC signature appears |
| `tests/integration/journalEntryAtomicRollback.test.ts` | New | ~+150 lines (5 tests) |
| **Total Commit 1** | **4 files** | **~+270 / -85 lines** |

Commit 2:

| File | Status | Approx delta |
|---|---|---|
| `docs/07_governance/friction-journal.md` | Modified | ~+15 lines (paid-regression evidence + closeout note) |
| **Total Commit 2** | **1 file** | **~+15 lines** |

The paid-regression run-record JSON at `$HOME/chounting-logs/oi3-m1-cached-mt01-${TS}.json` is NOT in the diff — output artifact, not tracked.

- [ ] **Step 5: Surface plan to operator**

Wait for operator approval. Specifically gate on:
- RPC signature (3 JSONB params per pre-decision #3 / OPEN resolution; or 1 bundled).
- Reversal-mirror placement (stays in service layer per pre-decision #4 / OPEN resolution; or moves into RPC).
- PII redaction placement (service layer reuse vs. plpgsql replication).
- Service-refactor shape (lines 148–228 collapse).
- Rollback test plan (5 tests).
- Two-commit Y2 shape.
- $0.20 cumulative / $0.10 per-call ceilings for Task 9 regression.

**Do not begin any code edit until operator approves the plan.**

---

## Task 4: Implement RPC migration + service refactor

After plan approval.

- [ ] **Step 1: Author the migration file**

Create `supabase/migrations/20240134000000_write_journal_entry_atomic_rpc.sql` per Task 3 Step 1. Header docstring includes UF-003 closure + INV-AUDIT-001 + INV-LEDGER-001 + Phase 2 Simplification 1 correction references.

- [ ] **Step 2: Apply migration locally**

```bash
pnpm db:reset:clean
pnpm db:seed:all
```

Halt and surface on failure.

- [ ] **Step 3: Regenerate types**

```bash
pnpm types:gen
```

Expected: `src/types/supabase.ts` shows `write_journal_entry_atomic` RPC signature.

- [ ] **Step 4: Refactor `journalEntryService.post()`**

Per Task 3 Step 2 design. Lines 148–228 collapse into the single `db.rpc(...)` call. Reversal-mirror, period date-range, entry-number computation all stay above the RPC call.

- [ ] **Step 5: Author rollback tests**

`tests/integration/journalEntryAtomicRollback.test.ts` per Task 3 Step 3 design — 5 tests.

- [ ] **Step 6: Run targeted tests first**

```bash
pnpm test journalEntryAtomicRollback
```

Expected: green.

```bash
pnpm test journalEntryService
```

Expected: existing journalEntryService tests (~15–20) pass — externally observable post-path behavior unchanged.

- [ ] **Step 7: Run agent:validate**

```bash
pnpm agent:validate
```

Expected: clean.

- [ ] **Step 8: Run full test suite**

```bash
pnpm test
```

Expected: full-suite green at HEAD baseline. Any new failure halts and surfaces.

---

## Task 5: Founder review gate (Commit 1)

- [ ] **Step 1: Surface to operator for review**

Present:
1. Migration diff (~90 lines).
2. Service-layer diff (lines 148–228 collapse).
3. Regenerated `src/types/supabase.ts` (excerpt showing the RPC signature).
4. New rollback test file (~150 lines).
5. `pnpm agent:validate` output.
6. `pnpm test` output.
7. `pnpm typecheck` output.
8. Diff scope summary.
9. Cross-references to UF-003 / UF-001 atomicity facet / INV-AUDIT-001 / INV-LEDGER-001.

Wait for operator approval. Do not commit before approval.

- [ ] **Step 2: Apply revisions if requested**

Re-run targeted tests + full suite after every revision pass. Re-surface for re-approval.

---

## Task 6: Commit 1

- [ ] **Step 1: Stage files**

```bash
git add supabase/migrations/20240134000000_write_journal_entry_atomic_rpc.sql \
        src/services/accounting/journalEntryService.ts \
        src/types/supabase.ts \
        tests/integration/journalEntryAtomicRollback.test.ts
git status --short
```

- [ ] **Step 2: Create Commit 1**

```bash
export COORD_SESSION='S27-mt-01-rpc' && git commit -m "$(cat <<'EOF'
feat(ledger): MT-01 transaction atomicity — write_journal_entry_atomic RPC

- supabase/migrations/20240134000000_write_journal_entry_atomic_
  rpc.sql adds plpgsql function wrapping journal_entries +
  journal_lines + audit_log inserts in a single transaction.
  Returns { entry_id, audit_log_id }. Pattern follows existing
  read RPCs at migrations 107/125/126/127.
- journalEntryService.post() lines 148-228 collapse from four
  sequential PostgREST calls (entry insert + lines insert +
  audit-log insert + optional ai_actions) to a single
  db.rpc('write_journal_entry_atomic', { ... }) call. Reversal-
  mirror validation stays in service layer per ADR-001 (requires
  reading prior entry data). Period date-range check stays in
  service layer per S26 QW-03 (typed-error UX).
- Audit-log writes inside the RPC: INV-AUDIT-001 enforcement
  moves from "service-layer convention with synchronous audit
  write" to "DB-transaction-enforced atomicity". A failure
  inside the RPC rolls back all four operations.
- New tests/integration/journalEntryAtomicRollback.test.ts
  exercises five failure modes: imbalanced lines, FK violation,
  cross-org account (S26 QW-05 trigger), happy path, and
  service-layer-guard short-circuit. Each asserts no orphans
  across journal_entries / journal_lines / audit_log.
- Closes UF-003 (transaction atomicity gap; Phase 1.1 UF-001
  carry-forward). Contributes to closing UF-001 atomicity
  facet alongside S26 immutability triggers — together the
  load-bearing INV-LEDGER-001 + INV-AUDIT-001 pairing on the
  post path is mechanically enforced.
- Phase 2 Simplification 1 correction per
  docs/03_architecture/phase_simplifications.md.
- Sequenced after S25 (non-ledger Day-1) and S26 (ledger-
  integrity Day-1). See docs/09_briefs/phase-1.2/post-audit-
  fix-stack-arc.md.

Session: S27-mt-01-rpc

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Verify Commit 1 landed**

```bash
git log -1 --stat
```

Expected: 4 files, ~+270 / -85 lines.

---

## Task 7: (RESERVED — symmetry with prior briefs)

_Empty by design. Prior paid-API briefs (S20 / S22) used Tasks 7-8 for additional preparatory work between Commit 1 and the paid invocation (S20: harness D3 scope flag + dry-run methodology surface; S22: caching pre-flight + dry-run shape verification). S27 has no such intermediate work — Commit 1 ships the implementation outright; Task 9 fires the regression directly. Task numbering preserves alignment with prior briefs so an executing agent reading top-to-bottom sees the same Task-9 anchor for the paid run._

---

## Task 8: (RESERVED)

_See Task 7 explanation. Empty by design._

---

## Task 9: Paid-API regression (caching-baseline sanity)

- [ ] **Step 1: Operator authorization gate**

Operator examines:
- Commit 1 at HEAD (RPC + service refactor + rollback tests green).
- Pre-call cost projection: ~$0.04–$0.06 per S22's caching-active baseline; ceiling $0.10.
- Caching invariant intact (S22's `cache_control` placement at `src/agent/orchestrator/index.ts` unchanged by this session).

Operator authorizes the paid invocation. **Without explicit authorization in chat, do not run the regression.**

- [ ] **Step 2: Re-fire shape 12 dry-run with caching active**

```bash
RE_RUN_PATH="$HOME/chounting-logs/oi3-m1-cached-mt01-$(date -u +%Y%m%dT%H%M%SZ).json"
echo "RE_RUN_PATH=$RE_RUN_PATH"
pnpm tsx --env-file=.env.local scripts/oi3-m1-validation.ts \
  --output-json="$RE_RUN_PATH" \
  --first-shape-only
```

Expected: ~10–15s wall time. Per-invocation cost in the $0.04–$0.06 range (S22 baseline). `cache_read_input_tokens > 0` on calls 2-3 within the flow. Total session cost under $0.10 ceiling.

- [ ] **Step 3: Surface regression output**

After completion, surface:
- Run-record JSON path.
- Per-call usage breakdown (input_tokens, output_tokens, cache_read_input_tokens, cache_creation_input_tokens).
- Per-call cost.
- Total cumulative cost.
- Comparison against S22 baseline run-record (`oi3-m1-cached-run-${TS}.json` per S22 brief Task 8 closeout).
- Confirmation: shape 12 still emits a productive `proposed_entry_card` (not stale natural-no-card-with-orphan-row).
- Confirmation: ai_actions row-card pairing intact per Convention #11.

The orchestrator → service path is unchanged structurally; the regression sanity-checks that swapping the four-call sequence for a single RPC didn't perturb the model-cognitive surface (it shouldn't, since the change is below the agent's tool-call boundary).

- [ ] **Step 4: Halt-and-surface conditions**

Formal halt conditions (any one fires → halt before Commit 2; surface to operator):

- **Cost overshoot.** Per-call cost > $0.10 → caching may have stopped firing; halt and investigate. Total cost > $0.20 → terminal halt.
- **Caching regression.** `cache_read_input_tokens` still 0 on calls 2-3 → caching regression; halt and investigate.
- **Model-cognitive regression.** Shape 12 emits `emitted_natural_with_orphan_row` (Class 2 orphan signature) → orchestrator → service path regressed; halt before Commit 2.
- **Integration-test drift after regression.** Re-run `pnpm test journalEntryAtomicRollback` (and the broader `journalEntryService` integration suite) AFTER the paid regression completes. Any failure that was passing before the regression run → environmental drift signal (typically DB state pollution from the paid run leaking into the next test run); halt before Commit 2. This is a formal halt, not an incidental observation — paid-API regressions can perturb shared DB state in subtle ways that only surface on subsequent test runs, and Commit 2 should land against a clean test baseline.
- **`agent:validate` drift.** Re-run `pnpm agent:validate` after the regression. Any failure → halt.

In any halt mode, surface to operator before drafting the friction-journal entry. Re-validation is the deliverable; do not retry the paid run without operator direction (the paid spend is irrecoverable).

---

## Task 10: Friction-journal entry + Commit 2

- [ ] **Step 1: Draft the friction-journal entry**

Append to `docs/07_governance/friction-journal.md`. Format:

```markdown
- 2026-XX-XX NOTE — S27 MT-01 transaction atomicity RPC shipped.
  write_journal_entry_atomic plpgsql function collapses
  journalEntryService.post()'s four-call sequence (journal_entries
  + journal_lines + audit_log + optional ai_actions) into a
  single Postgres transaction. Closes UF-003 + UF-001 atomicity
  facet; Phase 2 Simplification 1 corrected. Reversal-mirror
  stays in service layer per ADR-001; period date-range stays
  in service layer per S26 QW-03. New rollback test exercises
  5 failure modes; existing journalEntryService tests pass
  externally-observable behavior. Paid-API regression on shape
  12: $X.XX (caching-active; baseline S22 $X.XX); cache_read
  populated calls 2-3; productive emission intact; ai_actions
  row-card pairing intact (Convention #11). Run record:
  oi3-m1-cached-mt01-<TS>.json. Phase 1.2 post-audit fix-stack
  arc closes here; Phase 2 surface expansion unblocked.
```

≤15 lines. Adapt percentages and totals to actual measurements.

- [ ] **Step 2: Surface for operator review**

Wait for approval before commit.

- [ ] **Step 3: Stage and commit**

```bash
git add docs/07_governance/friction-journal.md
git status --short

export COORD_SESSION='S27-mt-01-rpc' && git commit -m "$(cat <<'EOF'
docs(governance): S27 MT-01 RPC paid-API regression evidence

- Re-fired shape 12 dry-run under caching-active conditions
  post-RPC (commit <Commit 1 SHA>). Per-invocation cost $X.XX
  (S22 baseline $X.XX). cache_read_input_tokens populated on
  calls 2-3; caching invariant intact.
- Productive proposed_entry_card emission on shape 12;
  ai_actions row-card pairing intact per Convention #11.
  Orchestrator → service path is unchanged from a model-
  cognitive standpoint; the four-call → one-RPC collapse is
  below the agent's tool-call boundary.
- Run record at $HOME/chounting-logs/oi3-m1-cached-mt01-<TS>.json
  (out-of-tree; preserved for Phase 2 reference).
- Friction-journal entry summarizes the regression + Phase 1.2
  post-audit fix-stack arc closeout.
- Closes UF-003 with paid-API evidence. Phase 1.2 Foundation
  Readiness Assessment blockers (UF-001 / UF-002 / UF-003)
  resolved across S25 + S26 + S27.
- Phase 2 surface expansion unblocked.

Session: S27-mt-01-rpc

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: Verify Commit 2 landed**

```bash
git log -1 --stat
```

---

## Task 11: Post-commit verification + session-end

- [ ] **Step 1: Surface confirmation to operator**

Audit chain extension:
- 0952fdd — S24 Phase 1.2 audit closeout (arc anchor)
- (S25 commit SHA) — Phase 1.2 Day-1 non-ledger
- (S26 commit SHA) — Phase 1.2 Day-1 ledger-integrity
- (S27 brief at HEAD~2) — this brief
- (Commit 1 SHA) — RPC + service refactor + rollback tests
- (Commit 2 SHA) — paid-API regression evidence

Phase 1.2 post-audit fix-stack arc closes here. The four pre-Phase-2 gate conditions (per `docs/09_briefs/phase-1.2/post-audit-fix-stack-arc.md` §5) are now met:
- All 6 QWs (QW-01..QW-05, QW-07) shipped.
- MT-01 RPC shipped with paid-API regression evidence.
- QW-06 deferred to Phase 2 obligations.
- Foundation Readiness Assessment blockers UF-001, UF-002, UF-003 resolved.

- [ ] **Step 2: Run session-end**

```bash
bash scripts/session-end.sh
```

---

## Test strategy summary

- **Fixtures.** `SEED.ORG_REAL_ESTATE` posted entry from existing seeds; multi-org from S26 (cross-org account-id test reuses S26 fixtures).
- **Integration tests added.**
  - `tests/integration/journalEntryAtomicRollback.test.ts` — 5 tests covering imbalanced lines, FK violation, cross-org account-id (exercises S26 QW-05 trigger inside RPC), happy path, service-layer-guard short-circuit.
- **Existing tests preserved.** ~15–20 tests under `tests/integration/` exercising `journalEntryService.post()` continue to pass — externally observable post-path behavior unchanged.
- **Category-A floor tests.** All 5 must remain green.
- **Full-suite gate.** `pnpm test` green at session closeout.
- **Paid-API regression.** Shape 12 dry-run with caching active; productive emission + Convention #11 row-card pairing intact; cost under $0.10 per-call / $0.20 cumulative.

## Founder review gate

Two gates per Y2 shape:
- **Gate 1 (Task 5).** Pre-paid-run review of RPC migration + service refactor + rollback tests. Lower-stakes; no paid spend has fired.
- **Gate 2 (Task 10 Step 2).** Post-paid-run review of regression evidence + friction-journal entry. Heavier review.

## Friction-journal entry expected at closeout

One-line description (Task 10 Step 1): "S27 MT-01 transaction atomicity RPC. journalEntryService.post() four-call sequence collapses into write_journal_entry_atomic. Closes UF-003 + UF-001 atomicity facet. Paid-API regression on shape 12 confirms caching invariant + productive emission intact. Phase 1.2 post-audit fix-stack arc closes."

## Cross-references

- `docs/07_governance/audits/phase-1.2/action-plan.md` — MT-01.
- `docs/07_governance/audits/phase-1.2/unified-findings.md` — UF-003 + UF-001 atomicity facet.
- Phase 1.1 UF-001 carry-forward (transaction atomicity surface closed).
- `docs/02_specs/ledger_truth_model.md` — INV-AUDIT-001 + INV-LEDGER-001 (post-path pairing now mechanically enforced).
- `docs/03_architecture/phase_simplifications.md:65–127` — Simplification 1 correction.
- `docs/07_governance/adr/0001-reversal-mirror-placement.md` (or whatever the actual ADR number is at execution time — verify) — reversal-mirror stays in service layer.
- `docs/09_briefs/phase-1.2/session-25-brief.md` and `session-26-brief.md` — prior arc sessions.
- `docs/09_briefs/phase-1.2/post-audit-fix-stack-arc.md` — arc context and closeout gate.
- `docs/09_briefs/phase-2/session-22-brief.md` — caching baseline reference.
- `scripts/oi3-m1-validation.ts` — paid-validation harness from S20.

## Out of scope (do not do)

- QW-01/02/03/04/05/07 (closed in S25 + S26).
- QW-06 (Phase 2).
- LT-01 / UF-006 service-mutation CI guard (Phase 2).
- MT-02/03/04/05/06 (Phase 2).
- Reversal-mirror enforcement migration (stays in service layer per ADR-001).
- Schema or column shape changes beyond the new RPC.
- Orchestrator or prompt edits.
- Cross-turn caching optimization (Phase 2+).
- New shapes beyond shape 12 in the regression (operator's call if needed; default is shape 12 only).

## Halt conditions

- Any verification step in Task 2 fails (line drift, missing S25/S26 artifacts, missing harness, caching disabled).
- Migration apply fails.
- `pnpm agent:validate` or `pnpm test` regression caused by this session's edits.
- Any out-of-scope file appears in `git diff --stat`.
- Operator does not approve plan at Task 3 Step 5.
- Operator does not authorize Task 9 paid-API regression — halt at Task 6; Commit 1 stands as durable infrastructure but the regression does not fire.
- Caching not firing as designed (cache_read_tokens still 0 on calls 2+) during Task 9 — halt and surface.
- Cumulative cost > $0.20 OR single-invocation cost > $0.10 during Task 9 — terminal halt.
- Anthropic API auth failure (401/403) — terminal halt.
- Shape 12 regresses from productive emission to Class 2 orphan signature — halt before Commit 2; surface.
