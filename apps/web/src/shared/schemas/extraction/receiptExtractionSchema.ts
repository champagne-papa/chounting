import { z } from 'zod';

// ReceiptExtractionSchema — Stage 4 extraction output for receipt
// document type per Phase 7 chunk 7.3a brief Task 7.3a.1 + §4 value
// pick #1 + agent_architecture_policy.md §2.1.1 receipt row + ADR-0014
// §8 AI fallback contract.
//
// 8-field matrix per §2.1.1 receipt row:
//   merchant (vendor_id or merchant_text) + date + amount (subtotal +
//   total) + currency + payment_method + last_4 + merchant_identifier /
//   auth_ref / transaction_reference + tax_amount

export const ReceiptExtractionSchema = z.object({
  vendor_id: z.string().uuid().nullable().optional(),
  merchant_text: z.string().optional(),
  date: z.string().optional(),
  subtotal: z.number().optional(),
  total: z.number().optional(),
  currency: z.string().optional(),
  payment_method: z.string().optional(),
  last_4: z.string().optional(),
  merchant_identifier: z.string().optional(),
  auth_ref: z.string().optional(),
  transaction_reference: z.string().optional(),
  tax_amount: z.number().optional(),
});

export type ReceiptExtraction = z.infer<typeof ReceiptExtractionSchema>;
