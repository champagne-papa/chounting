import { z } from 'zod';

// PaymentConfirmationExtractionSchema — Stage 4 extraction output for
// payment_confirmation document type per Phase 7 chunk 7.3a brief Task
// 7.3a.1 + §4 value pick #1 + agent_architecture_policy.md §2.1.1
// payment_confirmation row + ADR-0014 §8 AI fallback contract.
//
// 7-field matrix per §2.1.1 payment_confirmation row:
//   vendor (vendor_id or vendor_text) + payment_date + amount + currency
//   + payment_method + payment_reference / auth_ref / transaction_id +
//   cited_invoice_number / cited_bill_id

export const PaymentConfirmationExtractionSchema = z.object({
  vendor_id: z.string().uuid().nullable().optional(),
  vendor_text: z.string().optional(),
  payment_date: z.string().optional(),
  payment_amount: z.number().optional(),
  currency: z.string().optional(),
  payment_method: z.string().optional(),
  payment_reference: z.string().optional(),
  auth_ref: z.string().optional(),
  transaction_id: z.string().optional(),
  cited_invoice_number: z.string().optional(),
  cited_bill_id: z.string().uuid().optional(),
});

export type PaymentConfirmationExtraction = z.infer<
  typeof PaymentConfirmationExtractionSchema
>;
