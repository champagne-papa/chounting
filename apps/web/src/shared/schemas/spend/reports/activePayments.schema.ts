// Layer-2 boundary for Phase 5 chunk B5-3-D5 active payments report.
//
// Read-side report input schema; single required `org_id` UUID filter.
// Surfaces bills in `partially_paid` lifecycle_state — bills with at least
// one payment recorded but not yet fully paid. Operator entry path for
// subsequent partial-payment-followup actions (RecordPaymentCard with
// computed amount_due pre-fill).
//
// Mirror pattern: paymentApprovalQueue.schema.ts — minimal `{ org_id }`
// shape with `*Input` + `*InputRaw` type-export discipline at the service
// boundary.

import { z } from 'zod';

// =====================================================================
// Active payments — input schema
// =====================================================================

export const ActivePaymentsInputSchema = z.object({
  org_id: z.string().uuid(),
});
export type ActivePaymentsInput = z.infer<typeof ActivePaymentsInputSchema>;
export type ActivePaymentsInputRaw = z.input<typeof ActivePaymentsInputSchema>;
