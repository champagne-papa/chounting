// Layer-2 boundary for EC-A-5 vendor balance report (chunk B5-3-D1 substantive session #1).
//
// Read-side report input schema; single required `vendor_id` UUID filter. The
// composed output shape (4 partial balances + net_balance + as_of) is documented
// in vendorReportService.ts and traces back to ADR-0015 §5 vendor-balance-view
// composition spec (Q63 closure).
//
// Mirror pattern: bill.schema.ts (B5-2) for `*Input` + `*InputRaw` type-export
// discipline at the service boundary.

import { z } from 'zod';

// =====================================================================
// EC-A-5 vendor balance — input schema
// =====================================================================

export const VendorBalanceInputSchema = z.object({
  org_id: z.string().uuid(),
  vendor_id: z.string().uuid(),
});
export type VendorBalanceInput = z.infer<typeof VendorBalanceInputSchema>;
export type VendorBalanceInputRaw = z.input<typeof VendorBalanceInputSchema>;
