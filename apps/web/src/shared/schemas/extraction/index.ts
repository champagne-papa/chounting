import { z } from 'zod';
import { VendorInvoiceClassificationSchema } from './vendorInvoice.schema';
import { ReceiptClassificationSchema } from './receipt.schema';
import { PaymentConfirmationClassificationSchema } from './paymentConfirmation.schema';

// ClassificationOutputSchema — Tier C AI fallback output discriminated
// union over document_type per Phase 7 chunk 7.2 brief Task 7.2.9 +
// ADR-0014 §8.
//
// The AI returns one of three classification-with-fields shapes per
// document_type. Zod's discriminated union routes the per-shape
// validation gate; non-validating output rejects the fallback and
// routes to Tier D ('unknown') with audit event
// ai_fallback_validation_failed per ADR-0014 §12.3.

export const ClassificationOutputSchema = z.discriminatedUnion(
  'document_type',
  [
    VendorInvoiceClassificationSchema,
    ReceiptClassificationSchema,
    PaymentConfirmationClassificationSchema,
  ],
);

export type ClassificationOutput = z.infer<typeof ClassificationOutputSchema>;

export {
  VendorInvoiceClassificationSchema,
  ReceiptClassificationSchema,
  PaymentConfirmationClassificationSchema,
};
export type { VendorInvoiceClassification } from './vendorInvoice.schema';
export type { ReceiptClassification } from './receipt.schema';
export type { PaymentConfirmationClassification } from './paymentConfirmation.schema';
