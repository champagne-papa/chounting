import { z } from 'zod';

// ReceiptClassificationSchema — Tier C AI fallback output for receipt
// document type per Phase 7 chunk 7.2 brief Task 7.2.9 + ADR-0014 §8 +
// agent_architecture_policy.md §2.1.1 receipt row.
//
// Per Step 17 sub-clarification docstring discipline: fields marked
// .optional() are "extraction target per §2.1; nullable for v1
// partial-coverage" — AI attempts extraction but absence is valid;
// downstream Tier 1 re-verification gates absent/null fields per
// §2.1 re-verification matrix.

export const ReceiptClassificationSchema = z.object({
  document_type: z.literal('receipt'),
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
  fields: z.object({
    merchant_name: z.string().optional(),
    receipt_date: z.string().optional(),
    total: z.number().optional(),
    subtotal: z.number().optional(),
    tax_amount: z.number().optional(),
    currency: z.string().optional(),
    payment_method: z.string().optional(),
    last_4: z.string().optional(),
    merchant_identifier: z.string().optional(),
    auth_ref: z.string().optional(),
    transaction_reference: z.string().optional(),
  }),
});

export type ReceiptClassification = z.infer<typeof ReceiptClassificationSchema>;
