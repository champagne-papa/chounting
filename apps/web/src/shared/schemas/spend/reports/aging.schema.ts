// Layer-2 boundary for EC-A-3 AP aging report (chunk B5-3-D1 substantive session #1).
//
// Read-side report input schema; no Layer 1 DB CHECK pairing applies (this is a
// query-time filter, not a stored enum). Service consumes parsed input + defaults
// `as_of_date` to today when omitted (handled in service layer, not Zod default
// — keeps the schema deterministic for tests that compare Raw vs Parsed shapes).
//
// Pagination DEFERRED per conditional disposition (a) at chunk B5-3-D1 onset
// (Spend brief §11.4 + scope-lock memo): all open bills returned unbounded; v1
// dataset size assumed bounded by org operating shape.
//
// Mirror pattern: bill.schema.ts (B5-2) for `*Input` + `*InputRaw` type-export
// discipline at the service boundary.

import { z } from 'zod';

// =====================================================================
// EC-A-3 AP aging — input schema
// =====================================================================
//
// `as_of_date` is the report cutoff date. Optional; service defaults to
// today (`new Date().toISOString().slice(0, 10)`) when omitted. Bills with
// due_date relative to as_of_date are bucketed:
//   current : ≤ 0 days past due
//   30      : 1–30 days past due
//   60      : 31–60 days past due
//   90+     : > 60 days past due

export const ApAgingInputSchema = z.object({
  org_id: z.string().uuid(),
  as_of_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
});
export type ApAgingInput = z.infer<typeof ApAgingInputSchema>;
export type ApAgingInputRaw = z.input<typeof ApAgingInputSchema>;
