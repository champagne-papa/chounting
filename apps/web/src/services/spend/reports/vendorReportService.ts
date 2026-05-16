// src/services/spend/reports/vendorReportService.ts
//
// Phase 5 chunk B5-3-D1 substantive session #1: EC-A-5 vendor balance report.
// Read-only AP/Spend report service per ADR-0015 §5 vendor-balance-view spec
// (Q63 closure). Computed-at-read-time — no materialized column maintained.
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
// `bills.amount_cad`.
//
// Reading B preservation (ADR-0011 §1, ADR-0007 §Tier 2): this service is
// READ-ONLY. It does NOT call journalEntryService.post(); it does NOT INSERT
// or UPDATE rows; it does NOT emit recordMutation audits. The Reading B
// invariant is preserved by construction (no ledger writes at all).
//
// INV-SERVICE-001 export contract (structural): plain unwrapped functions
// (Pattern B per addressService / vendorPrepaymentService / billService);
// route handlers wrap each method via withInvariants() at the call site
// with read-grain ActionName (e.g. 'vendor_balance.read').
// INV-SERVICE-002 adminClient discipline: all DB access via adminClient.
//
// ServiceErrorCode usage note: this service uses the generic 'READ_FAILED'
// code per billService.ts precedent — vendor-balance-specific codes are
// NOT members of the closed ServiceErrorCode union in
// src/services/errors/ServiceError.ts. Rich discriminator-bearing message
// text carries the specifics.
//
// ADR-0015 §5 4-component composition spec:
//   1. open_AP: SUM over bills (vendor + lifecycle_state IN committed) of
//      (bill.amount_cad − SUM(bill_payment_allocations.amount_cad)). Compute
//      via 2 queries (fetch bills, fetch allocations), JS aggregate.
//   2. unapplied_vendor_credits: zeroMoney() by construction (vendor credits
//      deferred per Spend brief §8.3).
//   3. open_vendor_deposits_and_retainers: NEGATIVE contribution =
//      subtractMoney(zeroMoney(), depositsRemaining) where depositsRemaining
//      = SUM(vendor_prepayments.amount_cad WHERE vendor + status IN
//      open/partially_applied) − SUM(vendor_prepayment_applications.amount_cad
//      for those prepayments). Compute via 2 queries.
//   4. accrued_unbilled: zeroMoney() by construction in v1 (per catch #20 +
//      ADR-0015 §5 spec text).
// net_balance = addMoney(addMoney(addMoney(open_AP,
//   unapplied_vendor_credits), open_vendor_deposits_and_retainers),
//   accrued_unbilled).

import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { loggerWith } from '@/shared/logger/pino';
import { ServiceError } from '@/services/errors/ServiceError';
import {
  VendorBalanceInputSchema,
  type VendorBalanceInput,
  type VendorBalanceInputRaw,
} from '@/shared/schemas/spend/reports/vendorBalance.schema';
import {
  addMoney,
  subtractMoney,
  toMoneyAmount,
  zeroMoney,
  type MoneyAmount,
} from '@/shared/schemas/accounting/money.schema';

// ---------------------------------------------------------------------
// Output shapes
// ---------------------------------------------------------------------

export interface VendorBalancePartialBalances {
  open_AP: MoneyAmount;
  unapplied_vendor_credits: MoneyAmount;
  open_vendor_deposits_and_retainers: MoneyAmount; // NEGATIVE contribution per ADR-0015 §5
  accrued_unbilled: MoneyAmount;
}

export interface VendorBalanceOutput {
  vendor_id: string;
  partial_balances: VendorBalancePartialBalances;
  net_balance: MoneyAmount;
  as_of: string; // ISO timestamp captured at read-time
}

// ---------------------------------------------------------------------
// vendorReportService
// ---------------------------------------------------------------------

/**
 * balance — EC-A-5 vendor balance composition per ADR-0015 §5.
 *
 * Returns the four partial balances + net_balance for a single vendor,
 * computed at read time. No materialized column; no JE writes; no audit
 * emission. Reading B preserved by construction (read-only).
 *
 * supabase-js JOIN-side aggregation pattern (catch #20 + billService.ts
 * INV-AP-001 enforcement region): for each component requiring an
 * aggregate-over-allocations or aggregate-over-applications, fetch the
 * underlying numeric column via `.select('amount_cad').eq(...)` and JS-
 * aggregate via `.reduce()`. The closed ServiceErrorCode union doesn't
 * carry vendor-balance-specific codes, so generic 'READ_FAILED' is used
 * with rich message text per billService.ts precedent.
 */
// withInvariants: skip-org-check (pattern-B: route-handler-wrapped via
// withInvariants(action: 'vendor_balance.read'))
async function balance(
  input: VendorBalanceInputRaw,
  ctx: ServiceContext,
): Promise<VendorBalanceOutput> {
  let parsed: VendorBalanceInput;
  try {
    parsed = VendorBalanceInputSchema.parse(input);
  } catch (err) {
    if (err instanceof Error) {
      throw new ServiceError('READ_FAILED', `vendor_balance validation failed: ${err.message}`);
    }
    throw err;
  }

  const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
  const db = adminClient();

  // -----------------------------------------------------------------
  // Component 1: open_AP
  // SUM over bills (vendor_id + lifecycle_state IN
  // {approved_for_payment, partially_paid}) of (bill.amount_cad −
  // SUM(bill_payment_allocations.amount_cad for that bill)).
  // 2-query JS aggregation.
  // -----------------------------------------------------------------
  const { data: openBills, error: billsErr } = await db
    .from('bills')
    .select('bill_id, amount_cad')
    .eq('org_id', parsed.org_id)
    .eq('vendor_id', parsed.vendor_id)
    .in('lifecycle_state', ['approved_for_payment', 'partially_paid']);
  if (billsErr) {
    throw new ServiceError(
      'READ_FAILED',
      `vendor_balance: bills lookup failed: ${billsErr.message}`,
    );
  }
  const openBillRows = (openBills ?? []) as Array<{ bill_id: string; amount_cad: string | number }>;

  let openAP: MoneyAmount = zeroMoney();
  if (openBillRows.length > 0) {
    const openBillIds = openBillRows.map((b) => b.bill_id);
    const { data: allocs, error: allocsErr } = await db
      .from('bill_payment_allocations')
      .select('bill_id, amount_cad')
      .eq('org_id', parsed.org_id)
      .in('bill_id', openBillIds);
    if (allocsErr) {
      throw new ServiceError(
        'READ_FAILED',
        `vendor_balance: bill_payment_allocations lookup failed: ${allocsErr.message}`,
      );
    }
    const allocRows = (allocs ?? []) as Array<{ bill_id: string; amount_cad: string | number }>;
    // Index allocations by bill_id for per-bill aggregation.
    const allocByBill = new Map<string, MoneyAmount>();
    for (const a of allocRows) {
      const prev = allocByBill.get(a.bill_id) ?? zeroMoney();
      allocByBill.set(a.bill_id, addMoney(prev, toMoneyAmount(a.amount_cad)));
    }
    for (const b of openBillRows) {
      const billAmount = toMoneyAmount(b.amount_cad);
      const allocated = allocByBill.get(b.bill_id) ?? zeroMoney();
      const due = subtractMoney(billAmount, allocated);
      openAP = addMoney(openAP, due);
    }
  }

  // -----------------------------------------------------------------
  // Component 2: unapplied_vendor_credits
  // zeroMoney() by construction (vendor credits deferred per Spend brief §8.3).
  // -----------------------------------------------------------------
  const unappliedVendorCredits: MoneyAmount = zeroMoney();

  // -----------------------------------------------------------------
  // Component 3: open_vendor_deposits_and_retainers
  // NEGATIVE contribution = subtractMoney(zeroMoney(), depositsRemaining)
  // where depositsRemaining = SUM(vendor_prepayments.amount_cad WHERE
  // vendor + status IN {open, partially_applied}) −
  // SUM(vendor_prepayment_applications.amount_cad for those prepayments).
  // 2-query JS aggregation. Per Sub-L (B5-2): amount_cad is the
  // CAD-implicit balance field for v1.
  // -----------------------------------------------------------------
  const { data: openVps, error: vpsErr } = await db
    .from('vendor_prepayments')
    .select('id, amount_cad')
    .eq('org_id', parsed.org_id)
    .eq('vendor_id', parsed.vendor_id)
    .in('status', ['open', 'partially_applied']);
  if (vpsErr) {
    throw new ServiceError(
      'READ_FAILED',
      `vendor_balance: vendor_prepayments lookup failed: ${vpsErr.message}`,
    );
  }
  const openVpRows = (openVps ?? []) as Array<{ id: string; amount_cad: string | number }>;

  let depositsRemaining: MoneyAmount = zeroMoney();
  if (openVpRows.length > 0) {
    const openVpIds = openVpRows.map((v) => v.id);
    const { data: vpApps, error: appsErr } = await db
      .from('vendor_prepayment_applications')
      .select('vendor_prepayment_id, amount_cad')
      .in('vendor_prepayment_id', openVpIds);
    if (appsErr) {
      throw new ServiceError(
        'READ_FAILED',
        `vendor_balance: vendor_prepayment_applications lookup failed: ${appsErr.message}`,
      );
    }
    const vpAppRows = (vpApps ?? []) as Array<{
      vendor_prepayment_id: string;
      amount_cad: string | number;
    }>;
    const appsByVp = new Map<string, MoneyAmount>();
    for (const a of vpAppRows) {
      const prev = appsByVp.get(a.vendor_prepayment_id) ?? zeroMoney();
      appsByVp.set(a.vendor_prepayment_id, addMoney(prev, toMoneyAmount(a.amount_cad)));
    }
    for (const v of openVpRows) {
      const vpAmount = toMoneyAmount(v.amount_cad);
      const applied = appsByVp.get(v.id) ?? zeroMoney();
      const remaining = subtractMoney(vpAmount, applied);
      depositsRemaining = addMoney(depositsRemaining, remaining);
    }
  }
  // ADR-0015 §5: reported as a NEGATIVE contribution to net_balance.
  const openVendorDepositsAndRetainers: MoneyAmount = subtractMoney(
    zeroMoney(),
    depositsRemaining,
  );

  // -----------------------------------------------------------------
  // Component 4: accrued_unbilled
  // zeroMoney() by construction in v1 (per catch #20 + ADR-0015 §5).
  // -----------------------------------------------------------------
  const accruedUnbilled: MoneyAmount = zeroMoney();

  // -----------------------------------------------------------------
  // Compose net_balance
  // -----------------------------------------------------------------
  const netBalance: MoneyAmount = addMoney(
    addMoney(addMoney(openAP, unappliedVendorCredits), openVendorDepositsAndRetainers),
    accruedUnbilled,
  );

  const asOf = new Date().toISOString();

  log.info(
    {
      vendor_id: parsed.vendor_id,
      open_AP: openAP,
      open_vendor_deposits_and_retainers: openVendorDepositsAndRetainers,
      net_balance: netBalance,
      as_of: asOf,
    },
    'Vendor balance computed',
  );

  return {
    vendor_id: parsed.vendor_id,
    partial_balances: {
      open_AP: openAP,
      unapplied_vendor_credits: unappliedVendorCredits,
      open_vendor_deposits_and_retainers: openVendorDepositsAndRetainers,
      accrued_unbilled: accruedUnbilled,
    },
    net_balance: netBalance,
    as_of: asOf,
  };
}

// ---------------------------------------------------------------------
// Service object export (Pattern B: route handlers wrap each method
// via withInvariants(action: 'vendor_balance.<verb>') at call site)
// ---------------------------------------------------------------------

export const vendorReportService = {
  // withInvariants: skip-org-check (pattern-B: route-handler-wrapped via
  // withInvariants(action: 'vendor_balance.read'))
  balance,
};
