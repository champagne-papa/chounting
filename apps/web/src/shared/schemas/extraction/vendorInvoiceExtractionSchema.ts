import { z } from 'zod';

// VendorInvoiceExtractionSchema — Stage 4 extraction output for
// vendor_invoice document type per Phase 7 chunk 7.3a brief Task 7.3a.1
// + §4 value pick #1 + agent_architecture_policy.md §2.1.1 vendor_invoice
// row + ADR-0014 §8 AI fallback contract.
//
// DISTINCT from chunk 7.2's classification schemas (vendorInvoice.schema.ts):
// classification schemas are Tier C AI fallback CLASSIFICATION output
// ({document_type, confidence, rationale, fields}); extraction schemas are
// Stage 4 EXTRACTION output (Tier A rule-based or Tier C AI fallback).
//
// Per Step 17 naming-distinct convention: classification at *.schema.ts;
// extraction at *ExtractionSchema.ts (no .schema.ts suffix per brief verbatim).
//
// 11-field matrix per agent_architecture_policy.md §2.1.1 vendor_invoice
// row + brief §4 value pick #1 (bank-detail Tier 2.5-only fields EXCLUDED
// per Q29 ESLint boundary):
//   amount + currency + vendor_id (matcher output) + vendor_invoice_number
//   + accounting_date + account_code + tax_code_id + due_date + line_items
//   (per-line {description, amount, account_code, tax_code_id}) + tax_amount
//
// Per Step 17 sub-clarification docstring discipline: fields marked
// .optional() are "extraction target per §2.1; nullable for v1
// partial-coverage" — extractor attempts extraction but absence is valid;
// downstream Tier 1 re-verification gates absent/null fields per §2.1
// re-verification matrix.

const VendorInvoiceLineItemSchema = z.object({
  description: z.string().optional(),
  amount: z.number().optional(),
  account_code: z.string().optional(),
  tax_code_id: z.string().optional(),
});

export const VendorInvoiceExtractionSchema = z.object({
  amount: z.number().optional(),
  currency: z.string().optional(),
  vendor_id: z.string().uuid().nullable().optional(),
  vendor_invoice_number: z.string().optional(),
  accounting_date: z.string().optional(),
  account_code: z.string().optional(),
  tax_code_id: z.string().optional(),
  due_date: z.string().optional(),
  line_items: z.array(VendorInvoiceLineItemSchema).optional(),
  tax_amount: z.number().optional(),
});

export type VendorInvoiceExtraction = z.infer<typeof VendorInvoiceExtractionSchema>;
