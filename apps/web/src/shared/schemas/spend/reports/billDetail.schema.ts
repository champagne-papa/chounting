// Layer-2 boundary for Phase 5 chunk B5-3-D5 substrate-correction:
// per-bill bill-detail endpoint.
//
// Closes catch #69 (sibling-class to catch #57 substrate-grain semantic drift
// at downstream-consumer grain) + closes deferred Disposition (α) from
// B5-3-D3 chunk-grain (RecordPaymentCard reused PaymentApprovalQueueView
// data source which semantically scopes to approved_for_payment only —
// breaks for partially_paid bills surfaced from ActivePaymentsView row-click).
//
// Input shape: { org_id: uuid, bill_id: uuid }. Both come from URL path
// segments at the route layer (GET /api/orgs/[orgId]/bills/[billId]).
//
// Mirror pattern: activePayments.schema.ts — minimal shape with `*Input` +
// `*InputRaw` type-export discipline at the service boundary.

import { z } from 'zod';
import type { MoneyAmount } from '@/shared/schemas/accounting/money.schema';

// =====================================================================
// Bill detail — input schema
// =====================================================================

export const BillDetailInputSchema = z.object({
  org_id: z.string().uuid(),
  bill_id: z.string().uuid(),
});
export type BillDetailInput = z.infer<typeof BillDetailInputSchema>;
export type BillDetailInputRaw = z.input<typeof BillDetailInputSchema>;

// =====================================================================
// Bill detail — output shape
// =====================================================================

/**
 * Per-bill detail row including computed amount_due (per catch #20:
 * `bills.amount_due` is NOT a column; computed = bills.amount_cad −
 * SUM(bill_payment_allocations.amount_cad) for the given bill_id).
 *
 * Shape mirrors PaymentApprovalQueueRow + ActivePaymentsRow for the
 * fields RecordPaymentCard consumes; lifecycle_state is added so the
 * downstream consumer can branch on bill state if needed.
 */
export interface BillDetailRow {
  bill_id: string;
  vendor_id: string;
  bill_number: string | null;
  due_date: string | null;
  amount_cad: MoneyAmount;
  amount_due: MoneyAmount;
  lifecycle_state: string;
}

/**
 * BillDetailOutput is the BillDetailRow directly (single-bill endpoint).
 * Kept as a named export for symmetry with sibling read-side outputs
 * (ActivePaymentsOutput, PaymentApprovalQueueOutput) and to make future
 * envelope-extension straightforward without a consumer-side rename.
 */
export type BillDetailOutput = BillDetailRow;
