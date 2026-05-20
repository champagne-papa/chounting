// extractFields.ts — Stage 4 dispatcher per Phase 7 chunk 7.3a.
//
// Picks the per-document-type extractor based on classification result;
// the unknown path returns empty extraction with parent trace_record
// only (no Tier C invocation; Stage 4 unknown documents route to
// exception queue via downstream Stage 6 / Stage 7 deferred logic).

import crypto from 'crypto';
import { extractVendorInvoiceFields } from './vendorInvoiceExtractor';
import { extractReceiptFields } from './receiptExtractor';
import { extractPaymentConfirmationFields } from './paymentConfirmationExtractor';
import { extractOcrText } from './classifier/extractOcrText';
import type {
  ExtractFieldsInput,
  ExtractionResult,
  PipelineStageRecord,
} from './types';
import type { SystemActorServiceContext } from '@/services/middleware/serviceContext';

function makeEmptyExtractionResult(input: ExtractFieldsInput): ExtractionResult {
  const ocrText = extractOcrText(input.ocrArtifact);
  const trace_record: PipelineStageRecord = {
    stage_name: 'extract_fields',
    input_hash: crypto.createHash('sha256').update(ocrText).digest('hex'),
    output_hash: crypto.createHash('sha256').update('{}').digest('hex'),
    model: null,
    timestamp: new Date().toISOString(),
  };
  return {
    fields: {},
    ai_fallback_invoked: false,
    trace_records: [trace_record],
  };
}

export async function extractFields(
  input: ExtractFieldsInput,
  ctx: SystemActorServiceContext,
): Promise<ExtractionResult> {
  switch (input.documentType) {
    case 'vendor_invoice':
      return extractVendorInvoiceFields(input, ctx);
    case 'receipt':
      return extractReceiptFields(input, ctx);
    case 'payment_confirmation':
      return extractPaymentConfirmationFields(input, ctx);
    case 'unknown':
      return makeEmptyExtractionResult(input);
  }
}
