// Layer-2 boundary for EC-A-7 paid bills history report (chunk B5-3-D1 substantive session #2).
//
// Read-side report input schema; single required `org_id` UUID filter.
// EC-A-7 surfaces bills in `fully_paid` lifecycle_state — historical view of
// completed bill payments. Pagination DEFERRED post-v1 per chunk B5-3-D1
// conditional disposition (a) at onset; v1 dataset size assumed bounded by
// org operating shape.
//
// Mirror pattern: openBills.schema.ts (session #1) — minimal `{ org_id }`
// shape with `*Input` + `*InputRaw` type-export discipline at the service
// boundary.

import { z } from 'zod';

// =====================================================================
// EC-A-7 paid bills history — input schema
// =====================================================================

export const PaidBillsHistoryInputSchema = z.object({
  org_id: z.string().uuid(),
});
export type PaidBillsHistoryInput = z.infer<typeof PaidBillsHistoryInputSchema>;
export type PaidBillsHistoryInputRaw = z.input<typeof PaidBillsHistoryInputSchema>;
