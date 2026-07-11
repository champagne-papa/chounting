import { z } from 'zod';
import { VendorInvoiceExtractionSchema } from './vendorInvoiceExtractionSchema';

// MultiInvoiceExtractionSchema — board #4 slice-2 T2b AI-multi-extract output.
//
// The AI-assisted segmentation path (option A): a free-text Claude call reads
// an OCR'd document that may hold MULTIPLE invoices and returns them as an
// array + the document's stated total. Deterministic bbox segmentation is
// infeasible on the real artifact (document_artifacts.pages = {count}, no
// per-line page attribution — see the T2b design doc §1), so the split is
// AI-derived and guarded by the arithmetic reconciliation gate (Σ amounts =
// document_total), NOT by trusting the model's self-assessment.
//
// This is a FREE-TEXT → parse → Zod path (NOT structured output): board-2
// proved structured output collapses on the N-element array (the single-object
// schema can't hold N, and structured was fragile even for one object). So the
// call mirrors runAiExtractFallback (fence-strip + JSON.parse + safeParse).

// One invoice within a multi-invoice document: the existing per-invoice
// vendor-invoice extraction fields + a soft-provenance source locator.
export const MultiInvoiceItemSchema = VendorInvoiceExtractionSchema.extend({
  // Soft-provenance (persisted to α.region_ref as {kind:'ai_soft',
  // source_locator}): the invoice-number string / line-text span the AI drew
  // this invoice's fields from. Coarse (not a deterministic bbox region — that
  // is infeasible on the artifact), but a real "which invoice, and roughly
  // where in the source" audit trail. Optional: absence just means no locator.
  source_locator: z.string().optional(),
});
export type MultiInvoiceItem = z.infer<typeof MultiInvoiceItemSchema>;

export const MultiInvoiceExtractionSchema = z.object({
  // At least one invoice. A 1-element array is the N=1 case: the T2c wire treats
  // it as the trigger over-firing and falls through to the single-invoice path
  // (ingestDocument.ts Stage 2.5 parks only invoices.length > 1; the reconciled
  // single extraction is discarded and re-derived by the single path).
  invoices: z.array(MultiInvoiceItemSchema).min(1),
  // The document's stated total — the reconciliation-gate reference. Σ of the
  // invoices' amounts must equal this (within a cent) or the split is not
  // trusted and degrades to N=1 → needs_review.
  document_total: z.number(),
});
export type MultiInvoiceExtraction = z.infer<typeof MultiInvoiceExtractionSchema>;
