// Layer-2 boundary for EC-A-6 payment approval queue report (chunk B5-3-D1 substantive session #2).
//
// Read-side report input schema; single required `org_id` UUID filter.
// EC-A-6 surfaces bills in `approved_for_payment` lifecycle_state — bills the
// controller has approved for payment but not yet executed. Pagination
// DEFERRED post-v1 per chunk B5-3-D1 conditional disposition (a) at onset;
// v1 dataset size assumed bounded by org operating shape.
//
// Mirror pattern: openBills.schema.ts (session #1) — minimal `{ org_id }`
// shape with `*Input` + `*InputRaw` type-export discipline at the service
// boundary.

import { z } from 'zod';

// =====================================================================
// EC-A-6 payment approval queue — input schema
// =====================================================================

export const PaymentApprovalQueueInputSchema = z.object({
  org_id: z.string().uuid(),
});
export type PaymentApprovalQueueInput = z.infer<typeof PaymentApprovalQueueInputSchema>;
export type PaymentApprovalQueueInputRaw = z.input<typeof PaymentApprovalQueueInputSchema>;
