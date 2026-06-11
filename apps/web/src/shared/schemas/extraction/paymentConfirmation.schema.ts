import { z } from 'zod';

// PaymentConfirmationClassificationSchema — Tier C AI fallback output
// for payment_confirmation document type per Phase 7 chunk 7.2 brief
// Task 7.2.9 + ADR-0014 §8 + agent_architecture_policy.md §2.1.1
// payment_confirmation row.
//
// Per Step 17 sub-clarification docstring discipline: fields marked
// .optional() are "extraction target per §2.1; nullable for v1
// partial-coverage" — AI attempts extraction but absence is valid;
// downstream Tier 1 re-verification gates absent/null fields per
// §2.1 re-verification matrix.

export const PaymentConfirmationClassificationSchema = z.object({
  document_type: z.literal('payment_confirmation'),
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
  fields: z.object({
    payer_name: z.string().optional(),
    payee_name: z.string().optional(),
    payment_amount: z.number().optional(),
    payment_date: z.string().optional(),
    currency: z.string().optional(),
    payment_method: z.string().optional(),
    confirmation_number: z.string().optional(),
    payment_reference: z.string().optional(),
    auth_ref: z.string().optional(),
    transaction_id: z.string().optional(),
    cited_invoice_number: z.string().optional(),
    cited_bill_id: z.string().optional(),
  }),
});

export type PaymentConfirmationClassification = z.infer<
  typeof PaymentConfirmationClassificationSchema
>;
