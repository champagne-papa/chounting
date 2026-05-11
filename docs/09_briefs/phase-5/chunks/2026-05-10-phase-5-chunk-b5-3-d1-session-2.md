# Phase 5 Chunk B5-3-D1 Substantive Session #2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land 2 AP read-side reporting views (EC-A-6 payment approval queue + EC-A-7 paid bills history) data-side service surfaces + integration tests + Zod input schemas + unit tests in a single (γ-a) bundled commit per (cadence-β-i-a) 3-session split. Session #1 shipped 3 views (EC-A-3 + EC-A-4 + EC-A-5) at HEAD `770fef4`. Session #3 ships closeout artifacts.

**EC-A-8 scope-removed under disposition (δ).** D2.4 verify-from-disk dispatch at session #2 onset confirmed Outcome C — exception routing substrate does NOT exist in code or migrations; Phase 5 §10 phase-sequencing explicitly excludes ingestion/extraction substrate ("No drag-drop, no email, no extraction"); EC-A-8's "consumed from Document Platform substrate" per §11.4 is Phase 6+ work. Catch #25 logged (orchestrator-ratification-grain; cumulative N=24). EC-A-8 forward-pointer carries to D1 closeout friction-journal.

**Architecture:** Two new methods (`paymentApprovalQueue` + `paidBillsHistory`) extend `apps/web/src/services/spend/reports/apReportService.ts` (consolidated 4-method file per D1.3 ratification; session #1 shipped 2 methods; session #2 adds 2 to reach the canonical 4). Two new Zod input schemas (`paymentApprovalQueue.schema.ts` + `paidBillsHistory.schema.ts`) under `apps/web/src/shared/schemas/spend/reports/`. Two integration test files (co-located per-view + per-criterion; paidBillsHistory.test.ts holds AC-EC-A-7-1 paid-bills lifecycle filter test). Two unit test files (Zod boundary). Same supabase-js JOIN-side aggregation pattern as session #1; same `bills.lifecycle_state` filter discipline; same Reading B preservation (read-only).

**Tech Stack:** Postgres (Supabase), TypeScript, Zod, Vitest, Decimal.js (via money.schema).

**Locked-scope context** (chunk B5-3-D1 session #2 onset + D2.1–D2.5 ratifications 2026-05-10):

- **D2.1 Plan doc shape:** new per-session plan doc (this file) per session-grain canonical-source-of-truth precedent
- **D2.2 EC-A-8 file count:** **DISSOLVED** under (δ) scope-removal
- **D2.3 New schema unit test count:** 2 unit tests (one per new schema) per per-schema unit-test pattern
- **D2.4 Exception routing substrate:** Outcome C — substrate doesn't exist; EC-A-8 substrate-dependency-not-yet-satisfied
- **D2.5 Item 17 session-grain Stage 6:** auto-fires per graduated standing rule (substantive commit + 2 memory writes at session-close)
- **EC-A-8 disposition (δ):** scope-removed from chunk B5-3-D1; EC-A-8 stays as Phase A exit criterion; delivery deferred to Phase 6+ chunk that ships Document Platform exception_queue substrate; cross-phase dependency logged
- **(test-γ) chunk-grain shape revision:** 5+4+0+5=14 (revised from 5+4+3+3=15 at checkpoint #1 due to EC-A-8 scope-removal); session #2 share: 2+1+0+2=5 tests
- **Cadence preservation:** (cadence-β-i-a) 3-session split maintained per D1.1 ratification stability; (cadence-β-i-b) cross-arc N=2 NOT triggered by scope-removal (would weaken cross-arc shape-evidence framing); session #3 closeout fires per ratified cadence
- **Reading B preservation (non-negotiable):** new view methods READ-ONLY; no `journalEntryService.post()` calls; no INSERT/UPDATE writes; no recordMutation audit emission
- **Catch #25 logged:** D1.1 ratification of "3 EC-A-8 behavioral tests" proceeded without verify-from-disk on exception routing substrate existence; orchestrator-ratification-grain Cluster B B1 catch; sibling to catch #23 (D1.3 ratification without .gitignore verify-from-disk); within-arc N≥2 for ratification-grain pattern (codification candidate at D1 closeout)
- **Aggregation pattern:** supabase-js JOIN-side per D1.3 + session #1 ratification (canonical reference: billService.ts INV-AP-001 enforcement + apReportService.aging/openBills from session #1)

**Patterns inherited from session #1 (substrate-grounded against HEAD 770fef4):**

- supabase-js JOIN-side aggregation (no RPC)
- `org_id` input parameter in all read-side service input schemas per ServiceContext consumption pattern
- `reports/` subfolder for service + schema organization (post-.gitignore scope fix at session #1 checkpoint #1)
- Co-located test files (per-view + per-criterion in same file when both fire at the view)
- §3.1+§3.2 trigger-grain disposition: read-side tests with direct-DB seeding don't fire triggers; afterAll DELETE works on non-append-only tables
- `apReportService` consolidated 4-method file pattern — EXTEND existing file (do NOT fork new service files)

**Out of scope this session:**

- **EC-A-8 behavioral tests (3 tests originally projected; scope-removed under (δ))** — Phase 6+ ingestion chunk delivers Document Platform exception_queue substrate; EC-A-8 satisfies at that point
- Closeout artifacts: friction-journal entry + catches #20/#23/#24/#25 forward-pointers + sub-pattern SKILL refinement candidate + accountLedgerService.test.ts pollution candidate + EC-A-8 scope-removal note + carry-forward reconciliation — session #3
- D2 UI screenshot-gated surfaces (deferred subsequent chunk per D1/D2 split)
- Item 18 org_settings substrate-floor (deferred at D1 onset; still pending)
- FT1 storage substrate touch (no storage substrate consumption)
- ADR-0015 §5 amendment (catch #20 formal disposition deferred to post-v1 accrual workflow chunk)
- Vendor credit lifecycle (deferred v1 per Spend brief §8.3)
- Born-paid bundle (`post_bill_with_payment`) — Phase 8
- New mutations or migrations (read-only session)
- New service files (extending apReportService.ts per D1.3 consolidated pattern)

---

## Files

**Files to create:**

- `apps/web/src/shared/schemas/spend/reports/paymentApprovalQueue.schema.ts` — Zod input schema for EC-A-6 `paymentApprovalQueue()` (`org_id` UUID) + TS types
- `apps/web/src/shared/schemas/spend/reports/paidBillsHistory.schema.ts` — Zod input schema for EC-A-7 `paidBillsHistory()` (`org_id` UUID) + TS types
- `apps/web/tests/integration/paymentApprovalQueue.test.ts` — per-view EC-A-6 happy path (no per-criterion test for EC-A-6 per D1.2)
- `apps/web/tests/integration/paidBillsHistory.test.ts` — per-view EC-A-7 happy path + per-criterion AC-EC-A-7-1 paid-bills lifecycle_state filter correctness (1 test with multi-assertion verifying only `fully_paid` bills surface; excludes draft/pending_approval/approved_for_payment/partially_paid/voided/cancelled)
- `apps/web/tests/unit/paymentApprovalQueueSchema.test.ts` — Zod boundary unit test for `paymentApprovalQueue.schema.ts`
- `apps/web/tests/unit/paidBillsHistorySchema.test.ts` — Zod boundary unit test for `paidBillsHistory.schema.ts`

**Files to modify:**

- `apps/web/src/services/spend/reports/apReportService.ts` — add 2 methods (`paymentApprovalQueue` + `paidBillsHistory`); add imports for new schemas; extend `apReportService` export object to 4 methods; reuse `loadBillsWithAmountDue` helper for any amount-due computation (or extend pattern if needed for payment-history shape)

**Files NOT touched (Reading B preservation + scope boundaries):**

- `apps/web/src/services/accounting/journalEntryService.ts` (read surfaces don't write ledger)
- `apps/web/src/services/spend/billService.ts` (B5-2 substrate)
- `apps/web/src/services/spend/vendorPrepaymentService.ts` (B5-1 substrate)
- `apps/web/src/services/spend/reports/vendorReportService.ts` (session #1; EC-A-5)
- `apps/web/src/shared/schemas/spend/reports/aging.schema.ts` (session #1)
- `apps/web/src/shared/schemas/spend/reports/vendorBalance.schema.ts` (session #1)
- `apps/web/src/shared/schemas/spend/reports/openBills.schema.ts` (session #1)
- Test files from session #1 (apAging.test.ts, openBills.test.ts, vendorBalance.test.ts, agingSchema.test.ts, vendorBalanceSchema.test.ts, openBillsSchema.test.ts)
- All migration files (no schema changes)
- `.claude/skills/integration-test-rules/SKILL.md` (post-B5-2 §3.1+§3.2; sub-pattern refinement candidate at D1 closeout)
- Session #1 plan doc (per δ-i preservation; session #1 plan doc remains as historical record of pre-EC-A-8-scope-removal ratification)

**Files to modify (governance):** None this session. (D1 closeout friction-journal entry + carry-forward reconciliation fire at session #3.)

---

## Task 1: Zod input schemas (2 files; Layer-2 boundary)

Pattern parity with session #1 schemas (openBills.schema.ts is the closest sibling — minimal `{ org_id }` shape).

### Task 1a: paymentApprovalQueue.schema.ts

**Files:**
- Create: `apps/web/src/shared/schemas/spend/reports/paymentApprovalQueue.schema.ts`

- [ ] **Step 1: Create file with Zod schema for EC-A-6 input.**

```typescript
// Layer-2 boundary for EC-A-6 payment approval queue report (chunk B5-3-D1 substantive session #2).
//
// Read-side report input schema; single required `org_id` UUID filter.
// EC-A-6 surfaces bills in `approved_for_payment` lifecycle_state — bills the
// controller has approved for payment but not yet executed. Pagination
// DEFERRED post-v1 per chunk B5-3-D1 conditional disposition (a) at onset.
//
// Mirror pattern: openBills.schema.ts (session #1).

import { z } from 'zod';

export const PaymentApprovalQueueInputSchema = z.object({
  org_id: z.string().uuid(),
});
export type PaymentApprovalQueueInput = z.infer<typeof PaymentApprovalQueueInputSchema>;
export type PaymentApprovalQueueInputRaw = z.input<typeof PaymentApprovalQueueInputSchema>;
```

- [ ] **Step 2: Verify typecheck PASSES.**

Run: `pnpm typecheck`
Expected: PASS

### Task 1b: paidBillsHistory.schema.ts

**Files:**
- Create: `apps/web/src/shared/schemas/spend/reports/paidBillsHistory.schema.ts`

- [ ] **Step 1: Create file with Zod schema for EC-A-7 input.**

```typescript
// Layer-2 boundary for EC-A-7 paid bills history report (chunk B5-3-D1 substantive session #2).
//
// Read-side report input schema; single required `org_id` UUID filter.
// EC-A-7 surfaces bills in `fully_paid` lifecycle_state — historical view of
// completed bill payments. Pagination DEFERRED post-v1 per chunk B5-3-D1
// conditional disposition (a) at onset.
//
// Mirror pattern: openBills.schema.ts (session #1).

import { z } from 'zod';

export const PaidBillsHistoryInputSchema = z.object({
  org_id: z.string().uuid(),
});
export type PaidBillsHistoryInput = z.infer<typeof PaidBillsHistoryInputSchema>;
export type PaidBillsHistoryInputRaw = z.input<typeof PaidBillsHistoryInputSchema>;
```

- [ ] **Step 2: Verify typecheck PASSES.**

Run: `pnpm typecheck`
Expected: PASS

---

## Task 2: apReportService.ts extension (+2 methods)

**Files:**
- Modify: `apps/web/src/services/spend/reports/apReportService.ts`

Extends consolidated 4-method service file per D1.3 ratification. Session #1 shipped `aging()` + `openBills()`; session #2 adds `paymentApprovalQueue()` + `paidBillsHistory()` to reach canonical 4. Reuse `loadBillsWithAmountDue` helper for amount-due computation per catch #20 column-existence finding (`bills.amount_due` is NOT a literal column).

### Task 2a: paymentApprovalQueue() method

- [ ] **Step 1: Add imports for PaymentApprovalQueueInputSchema + types.**

Add to imports section near existing aging/openBills schema imports:

```typescript
import {
  PaymentApprovalQueueInputSchema,
  type PaymentApprovalQueueInput,
  type PaymentApprovalQueueInputRaw,
} from '@/shared/schemas/spend/reports/paymentApprovalQueue.schema';
```

- [ ] **Step 2: Add `PaymentApprovalQueueOutput` interface near existing OpenBillsOutput.**

```typescript
/**
 * Payment approval queue output per EC-A-6 (Spend brief §11.4).
 * Bills in `approved_for_payment` lifecycle_state awaiting payment-execution.
 */
export interface PaymentApprovalQueueRow {
  bill_id: string;
  vendor_id: string;
  bill_number: string | null;
  due_date: string | null;
  amount_cad: MoneyAmount;
  amount_due: MoneyAmount; // computed = bills.amount_cad − SUM(allocations) per catch #20
}

export interface PaymentApprovalQueueOutput {
  bills: PaymentApprovalQueueRow[];
  total_amount_due: MoneyAmount;
}
```

- [ ] **Step 3: Add `paymentApprovalQueue()` function below `openBills`.**

```typescript
/**
 * paymentApprovalQueue — EC-A-6 per Spend brief §11.4.
 *
 * Fetches bills in `approved_for_payment` lifecycle_state, JS-aggregates per-bill
 * amount_due via shared loadBillsWithAmountDue helper, returns list + total.
 *
 * Input shape: { org_id: string (uuid) }. Pagination DEFERRED post-v1.
 */
async function paymentApprovalQueue(
  input: PaymentApprovalQueueInputRaw,
  ctx: ServiceContext,
): Promise<PaymentApprovalQueueOutput> {
  const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
  const db = adminClient();

  const parsed: PaymentApprovalQueueInput = PaymentApprovalQueueInputSchema.parse(input);

  // Reuse session #1 helper; loadBillsWithAmountDue filters lifecycle_state
  // IN ('approved_for_payment', 'partially_paid'). EC-A-6 needs only
  // 'approved_for_payment'; filter the helper's output post-fetch.
  const allOpenBills = await loadBillsWithAmountDue(db, parsed.org_id);
  const approvedOnly = allOpenBills.filter(
    (b) => b.lifecycle_state === 'approved_for_payment',
  );

  const rows: PaymentApprovalQueueRow[] = approvedOnly.map((b) => ({
    bill_id: b.bill_id,
    vendor_id: b.vendor_id,
    bill_number: b.bill_number,
    due_date: b.due_date,
    amount_cad: b.amount_cad,
    amount_due: b.amount_due,
  }));

  let totalAmountDue: MoneyAmount = zeroMoney();
  for (const r of rows) {
    totalAmountDue = addMoney(totalAmountDue, r.amount_due);
  }

  log.info(
    { org_id: parsed.org_id, bill_count: rows.length, total_amount_due: totalAmountDue },
    'Payment approval queue computed',
  );

  return { bills: rows, total_amount_due: totalAmountDue };
}
```

**Note on helper extension:** the session #1 `loadBillsWithAmountDue` helper filters `lifecycle_state IN ('approved_for_payment', 'partially_paid')`. EC-A-6 only wants `approved_for_payment`; we post-filter. Alternative: parameterize the helper to accept an explicit state list. Implementer discretion; both are acceptable. Brainstorm-side weak lean: post-filter (preserves helper signature stability; small post-fetch operation).

- [ ] **Step 4: Run typecheck.**

Run: `pnpm typecheck`
Expected: PASS

### Task 2b: paidBillsHistory() method

- [ ] **Step 1: Add imports for PaidBillsHistoryInputSchema + types.**

```typescript
import {
  PaidBillsHistoryInputSchema,
  type PaidBillsHistoryInput,
  type PaidBillsHistoryInputRaw,
} from '@/shared/schemas/spend/reports/paidBillsHistory.schema';
```

- [ ] **Step 2: Add `PaidBillsHistoryOutput` interface.**

```typescript
/**
 * Paid bills history output per EC-A-7 (Spend brief §11.4).
 * Bills in `fully_paid` lifecycle_state — historical view of completed payments.
 */
export interface PaidBillRow {
  bill_id: string;
  vendor_id: string;
  bill_number: string | null;
  due_date: string | null;
  amount_cad: MoneyAmount;
  // No amount_due column needed (fully_paid means amount_due = 0)
  // Future: extend with payment metadata if Tier-3 UI needs it
}

export interface PaidBillsHistoryOutput {
  bills: PaidBillRow[];
  total_amount_paid: MoneyAmount; // sum of bills.amount_cad
}
```

- [ ] **Step 3: Add `paidBillsHistory()` function.**

EC-A-7 needs a different fetch shape — `loadBillsWithAmountDue` is filtered to open-bill states; EC-A-7 wants `fully_paid`. Inline the fetch (don't extend helper):

```typescript
/**
 * paidBillsHistory — EC-A-7 per Spend brief §11.4.
 *
 * Fetches bills in `fully_paid` lifecycle_state — historical view of completed
 * payments. Returns list + total amount paid (= sum of bills.amount_cad for the
 * filtered set; fully_paid means amount_due = 0 by construction).
 *
 * Input shape: { org_id: string (uuid) }. Pagination DEFERRED post-v1.
 */
async function paidBillsHistory(
  input: PaidBillsHistoryInputRaw,
  ctx: ServiceContext,
): Promise<PaidBillsHistoryOutput> {
  const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
  const db = adminClient();

  const parsed: PaidBillsHistoryInput = PaidBillsHistoryInputSchema.parse(input);

  const { data: bills, error: billsErr } = await db
    .from('bills')
    .select('bill_id, vendor_id, bill_number, due_date, amount_cad')
    .eq('org_id', parsed.org_id)
    .eq('lifecycle_state', 'fully_paid');
  if (billsErr) {
    log.error({ err: billsErr }, 'paid bills query failed');
    throw new ServiceError('READ_FAILED', `paid bills query failed: ${billsErr.message}`);
  }

  const rows: PaidBillRow[] = (bills ?? []).map((b) => ({
    bill_id: b.bill_id,
    vendor_id: b.vendor_id,
    bill_number: b.bill_number,
    due_date: b.due_date,
    amount_cad: toMoneyAmount(String(b.amount_cad)),
  }));

  let totalAmountPaid: MoneyAmount = zeroMoney();
  for (const r of rows) {
    totalAmountPaid = addMoney(totalAmountPaid, r.amount_cad);
  }

  log.info(
    { org_id: parsed.org_id, paid_bill_count: rows.length, total_amount_paid: totalAmountPaid },
    'Paid bills history computed',
  );

  return { bills: rows, total_amount_paid: totalAmountPaid };
}
```

- [ ] **Step 4: Run typecheck.**

Run: `pnpm typecheck`
Expected: PASS

### Task 2c: Extend `apReportService` export object

- [ ] **Step 1: Update export object to include new methods.**

Replace existing 2-method export:

```typescript
export const apReportService = {
  aging,
  openBills,
};
```

With 4-method export:

```typescript
export const apReportService = {
  aging,
  openBills,
  paymentApprovalQueue,
  paidBillsHistory,
};
```

- [ ] **Step 2: Run typecheck.**

Run: `pnpm typecheck`
Expected: PASS

---

## Task 3: Integration tests (2 files; co-located per-view + per-criterion)

Same direct-DB-seed pattern as session #1 (no JE posts; §3.1+§3.2 don't fire trigger surface per session #1 ratification). Canonical reference: `apps/web/tests/integration/openBills.test.ts` (session #1; closest sibling — open-bills filter test).

### Task 3a: paymentApprovalQueue.test.ts

**Files:**
- Create: `apps/web/tests/integration/paymentApprovalQueue.test.ts`

Per-view EC-A-6 happy path test only (no per-criterion test for EC-A-6 per D1.2 ratification; only 4 of 5 views got per-criterion tests).

- [ ] **Step 1: Write per-view EC-A-6 happy path test.**

Test should:
- Setup: create vendor + bills in mixed lifecycle_states; insert payments + allocations for bills in `approved_for_payment` state to make them realistic
- Execute: `apReportService.paymentApprovalQueue({ org_id })`
- Verify: returns only bills with `lifecycle_state === 'approved_for_payment'`; amount_due computed correctly via subquery/JOIN pattern; total_amount_due matches sum

- [ ] **Step 2: Apply §3.1+§3.2 trigger-grain disposition** (read-side direct-DB seed; no JE posts; afterAll DELETE on non-append-only tables).

- [ ] **Step 3: Run targeted test.**

Run: `pnpm vitest run tests/integration/paymentApprovalQueue`
Expected: PASS

### Task 3b: paidBillsHistory.test.ts

**Files:**
- Create: `apps/web/tests/integration/paidBillsHistory.test.ts`

Per-view EC-A-7 happy path + per-criterion AC-EC-A-7-1 paid-bills lifecycle_state filter correctness.

- [ ] **Step 1: Write per-view EC-A-7 happy path test.**

Test should:
- Setup: create vendor + bills in `fully_paid` state (with full payment allocations); other bills in non-paid states for filter verification
- Execute: `apReportService.paidBillsHistory({ org_id })`
- Verify: returns only `fully_paid` bills; total_amount_paid matches sum of bills.amount_cad

- [ ] **Step 2: Write per-criterion AC-EC-A-7-1 lifecycle_state filter test (1 test, multi-assertion).**

```typescript
it('paid bills history filter excludes non-fully-paid lifecycle states', async () => {
  // Setup: create vendor + 1 bill per canonical 7-state (draft, pending_approval, approved_for_payment, partially_paid, fully_paid, voided, cancelled)
  // Execute: apReportService.paidBillsHistory({ org_id })
  // Verify (multi-assertion):
  //   - returned bills.lifecycle_state === 'fully_paid' (1 bill returned)
  //   - draft / pending_approval / approved_for_payment / partially_paid / voided / cancelled all excluded
});
```

Per founder ratification (b) for per-criterion shape: 1 test with multi-assertion covering 6 boundary cases (one per excluded state + verify the included state). Preserves the 1-test-per-criterion file-grain framing.

- [ ] **Step 3: Apply §3.1+§3.2 trigger-grain disposition** (read-side direct-DB seed).

- [ ] **Step 4: Run targeted test.**

Run: `pnpm vitest run tests/integration/paidBillsHistory`
Expected: PASS

---

## Task 4: Unit tests (2 files; Zod boundary)

Same per-schema unit test pattern as session #1 (canonical reference: `apps/web/tests/unit/openBillsSchema.test.ts`).

### Task 4a: paymentApprovalQueueSchema.test.ts

**Files:**
- Create: `apps/web/tests/unit/paymentApprovalQueueSchema.test.ts`

Mirror openBillsSchema.test.ts pattern (4 cases: valid UUID + rejects non-UUID + rejects missing + rejects null).

- [ ] **Step 1: Write unit test.**

```typescript
describe('PaymentApprovalQueueInputSchema', () => {
  it('accepts valid UUID for org_id', () => {
    const uuid = '11111111-2222-3333-4444-555555555555';
    expect(PaymentApprovalQueueInputSchema.parse({ org_id: uuid })).toEqual({ org_id: uuid });
  });
  it('rejects non-UUID org_id', () => {
    expect(() => PaymentApprovalQueueInputSchema.parse({ org_id: 'not-a-uuid' })).toThrow();
  });
  it('rejects missing org_id', () => {
    expect(() => PaymentApprovalQueueInputSchema.parse({})).toThrow();
  });
  it('rejects null org_id', () => {
    expect(() => PaymentApprovalQueueInputSchema.parse({ org_id: null })).toThrow();
  });
});
```

- [ ] **Step 2: Run targeted test.**

Run: `pnpm vitest run tests/unit/paymentApprovalQueueSchema`
Expected: PASS (4 test cases)

### Task 4b: paidBillsHistorySchema.test.ts

**Files:**
- Create: `apps/web/tests/unit/paidBillsHistorySchema.test.ts`

Same pattern as Task 4a; substitute `PaidBillsHistoryInputSchema`. 4 test cases.

- [ ] **Step 1: Write unit test.**

```typescript
describe('PaidBillsHistoryInputSchema', () => {
  it('accepts valid UUID for org_id', () => {
    const uuid = '22222222-3333-4444-5555-666666666666';
    expect(PaidBillsHistoryInputSchema.parse({ org_id: uuid })).toEqual({ org_id: uuid });
  });
  it('rejects non-UUID org_id', () => {
    expect(() => PaidBillsHistoryInputSchema.parse({ org_id: 'not-a-uuid' })).toThrow();
  });
  it('rejects missing org_id', () => {
    expect(() => PaidBillsHistoryInputSchema.parse({})).toThrow();
  });
  it('rejects null org_id', () => {
    expect(() => PaidBillsHistoryInputSchema.parse({ org_id: null })).toThrow();
  });
});
```

- [ ] **Step 2: Run targeted test.**

Run: `pnpm vitest run tests/unit/paidBillsHistorySchema`
Expected: PASS (4 test cases)

---

## Task 5: Verification + bundled commit at session-close per (γ-a)

- [ ] **Step 1: Run full validation.**

Run: `pnpm agent:validate`
Expected: 26/26 PASS

- [ ] **Step 2: Run full vitest suite (clean-DB baseline if needed).**

Run: `pnpm db:reset:clean && pnpm test`
Expected: 801 (session #1 baseline) + ~5 (session #2 integration + unit) = ~806 PASS

(Note: session #2 ships 5 file-grain tests; case-grain count may be 2 per-view + 1 per-criterion + 4 unit + 4 unit = 11 cases. Final case count depends on per-view test count multiplicity.)

- [ ] **Step 3: Run targeted tests on session #2 surface.**

Run: `pnpm vitest run tests/integration/paymentApprovalQueue tests/integration/paidBillsHistory tests/unit/paymentApprovalQueueSchema tests/unit/paidBillsHistorySchema`
Expected: all PASS

- [ ] **Step 4: Verify git state pre-commit.**

Run: `git status --short`
Expected: 1 modified (apReportService.ts) + 6 new files (2 schemas + 2 integration tests + 2 unit tests) + 1 plan doc = 8 paths

- [ ] **Step 5: Stage files explicitly.**

```bash
git add apps/web/src/services/spend/reports/apReportService.ts \
        apps/web/src/shared/schemas/spend/reports/paymentApprovalQueue.schema.ts \
        apps/web/src/shared/schemas/spend/reports/paidBillsHistory.schema.ts \
        apps/web/tests/integration/paymentApprovalQueue.test.ts \
        apps/web/tests/integration/paidBillsHistory.test.ts \
        apps/web/tests/unit/paymentApprovalQueueSchema.test.ts \
        apps/web/tests/unit/paidBillsHistorySchema.test.ts \
        docs/09_briefs/phase-5/chunks/2026-05-10-phase-5-chunk-b5-3-d1-session-2.md
```

- [ ] **Step 6: Bundled commit at session-close per (γ-a).**

Commit message shape (HEREDOC):

```
feat(spend): chunk B5-3-D1 substantive session #2 — AP read-side reporting (2 more views; 5 of 5 v1-deliverable) + 5 tests

2 views shipped this session under (cadence-β-i-a) 3-session split:
- EC-A-6 payment approval queue (apReportService.paymentApprovalQueue())
- EC-A-7 paid bills history (apReportService.paidBillsHistory())

Cumulative across sessions #1 + #2: 5 of 5 v1-deliverable views shipped
(EC-A-3 + EC-A-4 + EC-A-5 + EC-A-6 + EC-A-7).

EC-A-8 SCOPE-REMOVED under disposition (δ) at session #2 onset per D2.4
verify-from-disk Outcome C (exception routing substrate does NOT exist in
code or migrations; Phase 5 §10 phase-sequencing excludes ingestion/
extraction substrate; EC-A-8 substrate-dependency = Phase 6+ ingestion
chunk). Catch #25 logged (orchestrator-ratification-grain Cluster B B1;
cumulative N=24). EC-A-8 stays as Phase A exit criterion; delivery
deferred to Phase 6+ chunk that ships Document Platform exception_queue
substrate. Forward-pointer at D1 closeout friction-journal (session #3).

Files (8 total):
- 1 service extension: apReportService.ts (+2 methods: paymentApprovalQueue + paidBillsHistory; consolidated 4-method file per D1.3)
- 2 Zod input schemas: paymentApprovalQueue.schema.ts + paidBillsHistory.schema.ts (org_id UUID; pagination deferred per (a))
- 2 integration tests (per-view + per-criterion co-located where applicable): paymentApprovalQueue.test.ts + paidBillsHistory.test.ts (includes AC-EC-A-7-1 paid-bills lifecycle_state filter correctness)
- 2 unit tests: paymentApprovalQueueSchema.test.ts + paidBillsHistorySchema.test.ts
- 1 plan doc

Substrate: READ-ONLY across bills + bill_payment_allocations. No new tables, no new migrations, no new mutations. No new substrate dependencies.

Reading B preserved: view methods read-only; no journalEntryService calls; no recordMutation audit emission.

Aggregation pattern: supabase-js JOIN-side per D1.3 (canonical reference billService.ts INV-AP-001 + apReportService.aging/openBills from session #1).

§3.1+§3.2 disposition: read-side tests with direct-DB seeding don't fire trigger surface (sub-pattern documented in test file headers; SKILL refinement candidate at D1 closeout).

(test-γ) chunk-grain shape revision: 5+4+0+5=14 (revised from 5+4+3+3=15 at checkpoint #1 due to EC-A-8 scope-removal under (δ)); session #2 share 2+1+0+2=5 tests.

Cluster B B1 catches at session #2 (cumulative N=24 = 23 entering session #2 + 1 new):
- #25 orchestrator-ratification-grain D1.1 ratification without verify-from-disk on exception routing substrate (D1.1 ratified "3 EC-A-8 behavioral tests" assuming substrate existence; verify-from-disk at session #2 onset surfaced Outcome C — substrate doesn't exist; sibling to catch #23 D1.3 .gitignore ratification grain)

Within-arc N≥2 ratification-grain catch pattern (catches #23 + #25 within chunk B5-3-D1): codification candidate at D1 closeout — "ratification-grain verify-from-disk dispatch fires PREVENTIVELY at chunk-onset planning lock against any ratification that assumes substrate existence." Carry-forward to arc-closure as cross-arc retrospective candidate alongside (α) codification-grain primary candidate from B5-2.

Validation:
- pnpm agent:validate 26/26 PASS
- pnpm test full suite PASS on clean DB baseline
- pnpm typecheck clean

Cross-arc graduation watches at session #2 ship:
- (cadence-β-i-a) cross-arc N=2 graduation evaluation ALREADY FIRED at session #1 ship (B5-1 + D1 = N=2); session #2 + session #3 ship under same cadence; founder triangulation at D1 closeout
- (test-γ) within-arc N=3 ratchet at D1 file-grain 5+4+0+5=14 (revised at session #2 onset due to (δ)); third within-arc data point preserved for D1 closeout evaluation
- (cadence-β-i-b) stays at N=1 (B5-2 first-instance; D1 fires (cadence-β-i-a))

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

- [ ] **Step 7: Verify post-commit clean state.**

Run: `git status --short && git log --oneline -1`
Expected: clean tree; new HEAD on staging.

- [ ] **Step 8: Stage 6 close per Item 17 (γ-a) session-grain bundle.**

Per Item 17 session-grain firing-shape: substantive commit (above) + 2 memory writes:
- Pickup file refresh: chunk B5-3-D1 session #2 SHIPPED state; session #3 closeout next
- MEMORY.md refresh: dense one-liner update

- [ ] **Step 9: Push session-grain per condition 1 (test-suite health) MET.**

Run: `git push origin staging`
Expected: clean push; branch alignment 0/0 post-push.

---

## Cluster B B1 dispatch shape (preventive verify-from-disk at scope-lock)

Per Cluster B B1 graduated discipline (N=24 cumulative entering session #2; load-bearing). Session #2 substrate citations to verify-from-disk before implementer dispatch:

1. `bills.lifecycle_state` enum values include `approved_for_payment` and `fully_paid` (canonical 7-state per D1 amendment shipped at B5-2 closeout; verified at chunk B5-3-D1 onset)
2. `apReportService.ts` shipped state at HEAD `770fef4` (post-session-#1) — verify the 2-method export pattern + `loadBillsWithAmountDue` helper signature before extension
3. Session #1 schema pattern (`openBills.schema.ts` minimal `{ org_id }` shape) — mirror for session #2 schemas
4. Session #1 test pattern (`openBills.test.ts` direct-DB seed + afterAll DELETE on non-append-only tables) — mirror for session #2 tests

Section-name citation preferred over line-number citation per founder's citation-shape preference (line numbers drift across file edits; section names robust).

---

## EC-A-8 forward-pointer (carry-forward to D1 closeout session #3)

D1 closeout friction-journal entry must include:

- **EC-A-8 scope-removal disposition (δ)** — context, substantive grounds (verify-from-disk Outcome C + Phase 5 §10 phase-sequencing exclusion), procedural disposition (EC-A-8 stays as Phase A exit criterion; delivery deferred to Phase 6+ chunk)
- **Catch #25 logging** — orchestrator-ratification-grain D1.1 ratification without verify-from-disk; sibling to catch #23 (within-arc N≥2 ratification-grain pattern)
- **Ratification-grain verify-from-disk codification candidate** — within-arc N≥2 evidence at D1; codification candidate for arc-closure retrospective alongside (α) codification-grain primary candidate from B5-2
- **Phase 5 ↔ Phase 6+ cross-phase dependency** — Phase 5 closure waits on Phase 6+ chunk that delivers Document Platform exception_queue substrate; EC-A-8 satisfies at that chunk

---

**End of Phase 5 Chunk B5-3-D1 Substantive Session #2 plan doc.**

Cross-arc graduation watches armed under session #2 ship:
- (cadence-β-i-a) cross-arc N=2 graduation evaluation: ALREADY FIRED at session #1 ship; founder triangulation pending at D1 closeout (does NOT fire again at session #2 ship)
- (test-γ) within-arc N=3 ratchet: D1 file-grain count revised to 5+4+0+5=14 under (δ); third within-arc data point preserved for D1 closeout evaluation
- (cadence-β-i-b) stays at N=1 (B5-2 first-instance; D1 ships under (cadence-β-i-a))

Process-overhead-vs-deliverable-velocity hypothesis tracking at session #2:
- Session #1 catch yield: 4 catches at substrate/dispatch/ratification grain (Tasks 1-3 surface)
- Session #2 catch yield projection: 1 catch already surfaced at D2.4 dispatch (catch #25); session #2 implementer dispatches may surface additional implicit-substrate-coupling catches
- Hypothesis refinement candidate: ratification-grain catches concentrate at substrate-existence-assumption surfaces; within-arc N≥2 evidence (catches #23 + #25 within chunk B5-3-D1) supports codification candidate at D1 closeout
