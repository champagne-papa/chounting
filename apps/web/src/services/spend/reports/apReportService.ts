// src/services/spend/reports/apReportService.ts
//
// Phase 5 chunk B5-3-D1 substantive session #1: EC-A-3 AP aging + EC-A-4 open
// bills reports. Read-only AP/Spend report service per Spend brief §11.4.
//
// Mirror pattern: billService.ts (B5-2) for structural discipline (imports,
// ServiceContext, adminClient, ServiceError, loggerWith, plain unwrapped
// functions exported as service object).
//
// Disposition: supabase-js JOIN-side aggregation (RATIFIED at scope-lock
// 2026-05-10). No Postgres RPCs; no new migrations. Read-only access via
// adminClient. Canonical pattern: `.from(...).select(numeric_col).eq(...)`
// + JS `.reduce()`. Catch #20: `bills.amount_due` is NOT a column — the
// per-bill `amount_due` is computed by subtracting the SUM of
// `bill_payment_allocations.amount_cad` (for that bill_id) from
// `bills.amount_cad`. The shared `loadBillsWithAmountDue` helper below
// encapsulates this 2-query aggregation pattern; both `aging()` and
// `openBills()` consume it.
//
// Reading B preservation (ADR-0011 §1, ADR-0007 §Tier 2): this service is
// READ-ONLY. It does NOT call journalEntryService.post(); it does NOT INSERT
// or UPDATE rows; it does NOT emit recordMutation audits. The Reading B
// invariant is preserved by construction (no ledger writes at all).
//
// INV-SERVICE-001 export contract (structural): plain unwrapped functions
// (Pattern B per addressService / vendorPrepaymentService / billService);
// route handlers wrap each method via withInvariants() at the call site
// with read-grain ActionName (e.g. 'ap_aging.read', 'open_bills.read').
// INV-SERVICE-002 adminClient discipline: all DB access via adminClient.
//
// ServiceErrorCode usage note: this service uses the generic 'READ_FAILED'
// code per billService.ts precedent — AP-aging-specific codes are NOT
// members of the closed ServiceErrorCode union. Rich discriminator-bearing
// message text carries the specifics.
//
// EC-A-4 pagination DEFERRED per conditional disposition (a) at chunk
// B5-3-D1 onset (Spend brief §11.4 + scope-lock memo). openBills() input
// shape: { org_id: string (uuid) } per pattern parity with .aging() +
// .balance() (added at checkpoint #1 review per founder verdict; resolves
// catch #22 orchestrator-dispatch-grain ctx.caller.org_ids[0] semantic-
// memory propagation).
//
// Bucket boundaries per Spend brief §11.4:
//   current : days_past_due ≤ 0
//   30      : 1 ≤ days_past_due ≤ 30
//   60      : 31 ≤ days_past_due ≤ 60
//   90+     : days_past_due > 60

import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { loggerWith } from '@/shared/logger/pino';
import { ServiceError } from '@/services/errors/ServiceError';
import {
  ApAgingInputSchema,
  type ApAgingInput,
  type ApAgingInputRaw,
} from '@/shared/schemas/spend/reports/aging.schema';
import {
  OpenBillsInputSchema,
  type OpenBillsInput,
  type OpenBillsInputRaw,
} from '@/shared/schemas/spend/reports/openBills.schema';
import {
  addMoney,
  subtractMoney,
  toMoneyAmount,
  zeroMoney,
  type MoneyAmount,
} from '@/shared/schemas/accounting/money.schema';

type Db = ReturnType<typeof adminClient>;

// ---------------------------------------------------------------------
// Output shapes
// ---------------------------------------------------------------------

export type AgingBucket = 'current' | '30' | '60' | '90+';

export interface ApAgingBucketRow {
  bucket: AgingBucket;
  amount: MoneyAmount;
  bill_count: number;
}

export interface ApAgingOutput {
  as_of_date: string; // YYYY-MM-DD
  buckets: ApAgingBucketRow[];
  total: MoneyAmount;
}

export interface OpenBillRow {
  bill_id: string;
  vendor_id: string;
  bill_number: string | null;
  due_date: string | null; // YYYY-MM-DD
  amount_due: MoneyAmount;
  lifecycle_state: string;
}

export interface OpenBillsOutput {
  bills: OpenBillRow[];
  total_amount_due: MoneyAmount;
}

// ---------------------------------------------------------------------
// Shared aggregation helper
// ---------------------------------------------------------------------

/**
 * Internal shape returned by loadBillsWithAmountDue. Carries the bill
 * fields both consumer methods (aging / openBills) need plus the
 * computed amount_due. Bills are filtered to open-bill lifecycle_state
 * set per Spend brief §11.4 (approved_for_payment, partially_paid).
 */
interface BillWithAmountDue {
  bill_id: string;
  vendor_id: string;
  bill_number: string | null;
  due_date: string | null;
  amount_cad: MoneyAmount;
  amount_due: MoneyAmount;
  lifecycle_state: string;
}

/**
 * Shared 2-query aggregation pattern per catch #20 (`bills.amount_due` is
 * NOT a column). Fetches open bills then their allocations, JS-aggregates
 * allocations by bill_id, computes per-bill amount_due via subtractMoney.
 *
 * Filter: lifecycle_state IN {approved_for_payment, partially_paid} per
 * Spend brief §11.4 open-bill semantics.
 *
 * Returns the per-bill computed shape; callers further filter / bucket.
 */
async function loadBillsWithAmountDue(
  db: Db,
  org_id: string,
): Promise<BillWithAmountDue[]> {
  const { data: bills, error: billsErr } = await db
    .from('bills')
    .select('bill_id, vendor_id, bill_number, due_date, amount_cad, lifecycle_state')
    .eq('org_id', org_id)
    .in('lifecycle_state', ['approved_for_payment', 'partially_paid']);
  if (billsErr) {
    throw new ServiceError(
      'READ_FAILED',
      `ap_report: bills lookup failed: ${billsErr.message}`,
    );
  }
  const billRows = (bills ?? []) as Array<{
    bill_id: string;
    vendor_id: string;
    bill_number: string | null;
    due_date: string | null;
    amount_cad: string | number;
    lifecycle_state: string;
  }>;
  if (billRows.length === 0) {
    return [];
  }

  const billIds = billRows.map((b) => b.bill_id);
  const { data: allocs, error: allocsErr } = await db
    .from('bill_payment_allocations')
    .select('bill_id, amount_cad')
    .eq('org_id', org_id)
    .in('bill_id', billIds);
  if (allocsErr) {
    throw new ServiceError(
      'READ_FAILED',
      `ap_report: bill_payment_allocations lookup failed: ${allocsErr.message}`,
    );
  }
  const allocRows = (allocs ?? []) as Array<{ bill_id: string; amount_cad: string | number }>;

  // Index allocations by bill_id for per-bill aggregation.
  const allocByBill = new Map<string, MoneyAmount>();
  for (const a of allocRows) {
    const prev = allocByBill.get(a.bill_id) ?? zeroMoney();
    allocByBill.set(a.bill_id, addMoney(prev, toMoneyAmount(a.amount_cad)));
  }

  return billRows.map((b) => {
    const billAmount = toMoneyAmount(b.amount_cad);
    const allocated = allocByBill.get(b.bill_id) ?? zeroMoney();
    const amountDue = subtractMoney(billAmount, allocated);
    return {
      bill_id: b.bill_id,
      vendor_id: b.vendor_id,
      bill_number: b.bill_number,
      due_date: b.due_date,
      amount_cad: billAmount,
      amount_due: amountDue,
      lifecycle_state: b.lifecycle_state,
    };
  });
}

// ---------------------------------------------------------------------
// Aging bucket helpers (pure, unit-testable)
// ---------------------------------------------------------------------

/**
 * Compute the integer day difference (asOfDate − dueDate). Both inputs
 * are YYYY-MM-DD strings; returns a finite integer in calendar days
 * (computed via Date.parse + 86_400_000 ms-per-day). When dueDate is
 * null, treat as 0 days past due (current bucket) — null due_date means
 * the bill has no formal due date so we don't classify it as past due.
 */
function daysPastDue(asOfDate: string, dueDate: string | null): number {
  if (dueDate === null) {
    return 0;
  }
  const asOfMs = Date.parse(`${asOfDate}T00:00:00Z`);
  const dueMs = Date.parse(`${dueDate}T00:00:00Z`);
  return Math.floor((asOfMs - dueMs) / 86_400_000);
}

function bucketForDaysPastDue(days: number): AgingBucket {
  if (days <= 0) return 'current';
  if (days <= 30) return '30';
  if (days <= 60) return '60';
  return '90+';
}

// ---------------------------------------------------------------------
// apReportService
// ---------------------------------------------------------------------

/**
 * aging — EC-A-3 AP aging per Spend brief §11.4.
 *
 * Fetches open bills + allocations, JS-aggregates per-bill amount_due,
 * buckets each bill by (asOfDate − dueDate) days, sums per bucket.
 * Returns 4-bucket array + total.
 *
 * Default as_of_date: today (`new Date().toISOString().slice(0, 10)`)
 * when omitted from input.
 */
// withInvariants: skip-org-check (pattern-B: route-handler-wrapped via
// withInvariants(action: 'ap_aging.read'))
async function aging(
  input: ApAgingInputRaw,
  ctx: ServiceContext,
): Promise<ApAgingOutput> {
  let parsed: ApAgingInput;
  try {
    parsed = ApAgingInputSchema.parse(input);
  } catch (err) {
    if (err instanceof Error) {
      throw new ServiceError('READ_FAILED', `ap_aging validation failed: ${err.message}`);
    }
    throw err;
  }

  const asOfDate = parsed.as_of_date ?? new Date().toISOString().slice(0, 10);
  const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
  const db = adminClient();

  const bills = await loadBillsWithAmountDue(db, parsed.org_id);

  // Initialize each bucket with zero sums; sum + count per bill.
  const bucketAmounts: Record<AgingBucket, MoneyAmount> = {
    current: zeroMoney(),
    '30': zeroMoney(),
    '60': zeroMoney(),
    '90+': zeroMoney(),
  };
  const bucketCounts: Record<AgingBucket, number> = {
    current: 0,
    '30': 0,
    '60': 0,
    '90+': 0,
  };
  let total: MoneyAmount = zeroMoney();

  for (const b of bills) {
    const days = daysPastDue(asOfDate, b.due_date);
    const bucket = bucketForDaysPastDue(days);
    bucketAmounts[bucket] = addMoney(bucketAmounts[bucket], b.amount_due);
    bucketCounts[bucket] += 1;
    total = addMoney(total, b.amount_due);
  }

  const buckets: ApAgingBucketRow[] = (['current', '30', '60', '90+'] as AgingBucket[]).map(
    (bucket) => ({
      bucket,
      amount: bucketAmounts[bucket],
      bill_count: bucketCounts[bucket],
    }),
  );

  log.info(
    {
      org_id: parsed.org_id,
      as_of_date: asOfDate,
      bill_count: bills.length,
      total,
    },
    'AP aging computed',
  );

  return {
    as_of_date: asOfDate,
    buckets,
    total,
  };
}

/**
 * openBills — EC-A-4 open bills per Spend brief §11.4.
 *
 * Fetches open bills + allocations, JS-aggregates per-bill amount_due,
 * filters to amount_due > 0, returns the list + sum.
 *
 * Input shape: { org_id: string (uuid) }. Pagination DEFERRED post-v1
 * per conditional disposition (a) at chunk B5-3-D1 onset; v1 dataset
 * size assumed bounded by org operating shape. org_id added at
 * checkpoint #1 review per founder verdict — pattern parity with
 * .aging() + .balance() (catch #22 orchestrator-dispatch-grain
 * semantic-memory propagation resolved by explicit input shape).
 *
 * Cross-org access discipline: route handler wraps via
 * withInvariants(action: 'open_bills.read') which validates the caller
 * has access to the supplied org_id against ctx.caller.org_ids.
 */
// withInvariants: skip-org-check (pattern-B: route-handler-wrapped via
// withInvariants(action: 'open_bills.read'))
async function openBills(
  input: OpenBillsInputRaw,
  ctx: ServiceContext,
): Promise<OpenBillsOutput> {
  const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
  const db = adminClient();

  const parsed: OpenBillsInput = OpenBillsInputSchema.parse(input);
  const org_id = parsed.org_id;

  const bills = await loadBillsWithAmountDue(db, org_id);

  const openRows: OpenBillRow[] = [];
  let totalAmountDue: MoneyAmount = zeroMoney();
  for (const b of bills) {
    // Filter amount_due > 0. Compare against zeroMoney() via string compare
    // is unsafe; use Number for the >0 predicate (range bounded by
    // numeric(20,4); IEEE 754 precision sufficient for the sign predicate;
    // sum carries forward in MoneyAmount via addMoney).
    if (Number(b.amount_due) > 0) {
      openRows.push({
        bill_id: b.bill_id,
        vendor_id: b.vendor_id,
        bill_number: b.bill_number,
        due_date: b.due_date,
        amount_due: b.amount_due,
        lifecycle_state: b.lifecycle_state,
      });
      totalAmountDue = addMoney(totalAmountDue, b.amount_due);
    }
  }

  log.info(
    {
      org_id,
      open_bill_count: openRows.length,
      total_amount_due: totalAmountDue,
    },
    'Open bills computed',
  );

  return {
    bills: openRows,
    total_amount_due: totalAmountDue,
  };
}

// ---------------------------------------------------------------------
// Service object export (Pattern B: route handlers wrap each method
// via withInvariants(action: '<verb>.read') at call site)
// ---------------------------------------------------------------------

export const apReportService = {
  // withInvariants: skip-org-check (pattern-B: route-handler-wrapped via
  // withInvariants(action: 'ap_aging.read' | 'open_bills.read'))
  aging,
  openBills,
};
