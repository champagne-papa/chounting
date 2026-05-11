// Layer-2 boundary for EC-A-4 open bills report (chunk B5-3-D1 substantive session #1).
//
// Read-side report input schema; single required `org_id` UUID filter.
// Pagination DEFERRED post-v1 per conditional disposition (a) at chunk B5-3-D1
// onset (Spend brief §11.4 + scope-lock memo); v1 dataset size assumed bounded
// by org operating shape.
//
// org_id parameter added at checkpoint #1 review per founder verdict — pattern
// parity with .aging() + .balance() input shapes + cross-org access discipline
// per accountLedgerService precedent. Resolves catch #22 (orchestrator-dispatch-
// grain ctx.caller.org_ids[0] semantic-memory propagation) by widening service
// input surface to explicit org_id rather than implicit ctx-array indexing.
//
// Mirror pattern: bill.schema.ts (B5-2) + aging.schema.ts + vendorBalance.schema.ts
// (this chunk) for `*Input` + `*InputRaw` type-export discipline at the service
// boundary.

import { z } from 'zod';

// =====================================================================
// EC-A-4 open bills — input schema
// =====================================================================

export const OpenBillsInputSchema = z.object({
  org_id: z.string().uuid(),
});
export type OpenBillsInput = z.infer<typeof OpenBillsInputSchema>;
export type OpenBillsInputRaw = z.input<typeof OpenBillsInputSchema>;
