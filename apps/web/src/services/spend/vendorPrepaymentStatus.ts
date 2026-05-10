import {
  addMoney,
  subtractMoney,
  eqMoney,
  zeroMoney,
  toMoneyAmount,
  type MoneyAmount,
} from '@/shared/schemas/accounting/money.schema';
import type { VendorPrepaymentStatus } from '@/shared/schemas/spend/vendorPrepayment.schema';

/**
 * Computes vendor_prepayment_status from amount_original + applications + refund signal.
 *
 * Per ADR-0015 §1: status transitions are Layer-2 service-layer logic; the schema
 * holds the value but the rules live here. Status semantics:
 *   - 'refunded': set when a refund payment has been recorded against this prepayment;
 *      overrides application-derived status.
 *   - 'fully_applied': sum of application amount_originals equals amount_original.
 *   - 'partially_applied': sum > 0 but < amount_original.
 *   - 'open': no applications and not refunded.
 *
 * Layer-3 defensive guard: throws if sum of applications exceeds amount_original.
 * This scenario indicates upstream invariant violation; service callers must reject
 * the application before invoking this function. Throwing ensures the bug surfaces
 * immediately rather than producing a silently-incorrect status value.
 *
 * INV-MONEY-001 compliance: monetary comparisons routed through money.schema helpers
 * (subtractMoney + eqMoney + zeroMoney). No Number coercion on monetary values per
 * the discipline that decimal.js is confined to money.schema.ts.
 */
export function computeVendorPrepaymentStatus(input: {
  amount_original: string;
  applications: Array<{ amount_original: string }>;
  is_refunded: boolean;
}): VendorPrepaymentStatus {
  if (input.is_refunded) {
    return 'refunded';
  }

  if (input.applications.length === 0) {
    return 'open';
  }

  const original = toMoneyAmount(input.amount_original);
  const appliedSum = input.applications.reduce<MoneyAmount>(
    (acc, app) => addMoney(acc, toMoneyAmount(app.amount_original)),
    zeroMoney(),
  );

  // Compute remaining balance via subtractMoney to avoid Number coercion
  // (INV-MONEY-001 discipline: decimal.js confined to money.schema.ts).
  const remaining = subtractMoney(original, appliedSum);

  // remaining starts with '-' → applied > original (overflow / upstream invariant violation)
  if (remaining.startsWith('-')) {
    throw new Error(
      `Vendor prepayment applications sum (${appliedSum}) exceeds amount_original (${input.amount_original}); ` +
        `upstream invariant violation — service callers must reject the application before this function is invoked.`,
    );
  }

  // remaining is '0.0000' → applied === original (fully applied)
  if (eqMoney(remaining, zeroMoney())) {
    return 'fully_applied';
  }

  return 'partially_applied';
}
