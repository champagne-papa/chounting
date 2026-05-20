import { z } from 'zod';

// VendorInvoiceClassificationSchema — Tier C AI fallback output for
// vendor_invoice document type per Phase 7 chunk 7.2 brief Task 7.2.9 +
// ADR-0014 §8 (AI fallback output shape) + agent_architecture_policy.md
// §2.1.1 vendor_invoice row (field set).
//
// Per Step 17 sub-clarification docstring discipline: fields marked
// .optional() are "extraction target per §2.1; nullable for v1
// partial-coverage" — AI attempts extraction but absence is valid;
// downstream Tier 1 re-verification gates absent/null fields per
// §2.1 re-verification matrix.
//
// Field set per agent_architecture_policy.md §2.1.1 vendor_invoice row
// projected onto the AI OUTPUT shape (vs Tier 1 re-verification shape).
// The AI extracts raw fields (vendor_name string; amount_total numeric);
// downstream Tier 1 re-verification resolves vendor_name → vendor_id +
// amount_total → canonicalized amount per §2.1.

const VendorInvoiceLineItemSchema = z.object({
  description: z.string().optional(),
  amount: z.number().optional(),
  quantity: z.number().optional(),
  unit_price: z.number().optional(),
  tax_amount: z.number().optional(),
  account_code: z.string().optional(),
});

export const VendorInvoiceClassificationSchema = z.object({
  document_type: z.literal('vendor_invoice'),
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
  fields: z.object({
    vendor_name: z.string().optional(),
    vendor_tax_id: z.string().optional(),
    invoice_number: z.string().optional(),
    issue_date: z.string().optional(),
    due_date: z.string().optional(),
    currency: z.string().optional(),
    amount_total: z.number().optional(),
    amount_subtotal: z.number().optional(),
    tax_amount: z.number().optional(),
    line_items: z.array(VendorInvoiceLineItemSchema).optional(),
  }),
});

export type VendorInvoiceClassification = z.infer<
  typeof VendorInvoiceClassificationSchema
>;
