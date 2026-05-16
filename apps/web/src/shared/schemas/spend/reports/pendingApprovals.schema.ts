// Layer-2 boundary for Phase 5 arc-closure: pending approvals report.
//
// Read-side report input schema; single required `org_id` UUID filter.
// Surfaces bills in `pending_approval` lifecycle_state — bills awaiting
// controller approval before payment can be recorded. Operator entry path
// for approve-for-payment actions (PaymentApprovalCard) and reverse
// (BillReverseCard, via the per-bill route).
//
// Mirror pattern: activePayments.schema.ts — minimal `{ org_id }` shape
// with `*Input` + `*InputRaw` type-export discipline at the service
// boundary.

import { z } from 'zod';

// =====================================================================
// Pending approvals — input schema
// =====================================================================

export const PendingApprovalsInputSchema = z.object({
  org_id: z.string().uuid(),
});
export type PendingApprovalsInput = z.infer<typeof PendingApprovalsInputSchema>;
export type PendingApprovalsInputRaw = z.input<typeof PendingApprovalsInputSchema>;
