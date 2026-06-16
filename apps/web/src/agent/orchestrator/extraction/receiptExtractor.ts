// receiptExtractor.ts — Stage 4 receipt field extraction per Phase 7
// chunk 7.3a brief Task 7.3a.2 + §4 value pick #2.

import crypto from 'crypto';
import {
  ReceiptExtractionSchema,
  type ReceiptExtraction,
} from '@/shared/schemas/extraction/receiptExtractionSchema';
import { extractOcrText } from './classifier/extractOcrText';
import { runAiExtractFallback } from './aiFallbackExtractorBase';
import type { ExtractFieldsInput, ExtractionResult, PipelineStageRecord } from './types';
import type { SystemActorServiceContext } from '@/services/middleware/serviceContext';

const TOTAL_PATTERNS = [
  /\bTotal\s*:?\s*\$?([0-9,]+(?:\.[0-9]{2})?)/i,
];

const SUBTOTAL_PATTERNS = [/\bSubtotal\s*:?\s*\$?([0-9,]+(?:\.[0-9]{2})?)/i];

const DATE_PATTERNS = [
  /\b(\d{4}-\d{2}-\d{2})\b/,
  /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/,
];

const PAYMENT_METHOD_PATTERN =
  /\b(visa|mastercard|amex|debit|credit\s+card|cash|debit\s+card)\b/i;

const LAST_4_PATTERN = /\*+\s*(\d{4})\b/;

const CURRENCY_PATTERN = /\b(USD|CAD|EUR|GBP)\b/;

function tryExtractTierA(ocrText: string): Partial<ReceiptExtraction> {
  const fields: Partial<ReceiptExtraction> = {};

  for (const pattern of TOTAL_PATTERNS) {
    const match = ocrText.match(pattern);
    if (match && match[1]) {
      const num = Number(match[1].replace(/,/g, ''));
      if (!Number.isNaN(num)) {
        fields.total = num;
        break;
      }
    }
  }

  for (const pattern of SUBTOTAL_PATTERNS) {
    const match = ocrText.match(pattern);
    if (match && match[1]) {
      const num = Number(match[1].replace(/,/g, ''));
      if (!Number.isNaN(num)) {
        fields.subtotal = num;
        break;
      }
    }
  }

  for (const pattern of DATE_PATTERNS) {
    const match = ocrText.match(pattern);
    if (match && match[1]) {
      fields.date = match[1];
      break;
    }
  }

  const paymentMethodMatch = ocrText.match(PAYMENT_METHOD_PATTERN);
  if (paymentMethodMatch) {
    fields.payment_method = paymentMethodMatch[1].toLowerCase();
  }

  const last4Match = ocrText.match(LAST_4_PATTERN);
  if (last4Match) {
    fields.last_4 = last4Match[1];
  }

  const currencyMatch = ocrText.match(CURRENCY_PATTERN);
  if (currencyMatch) {
    fields.currency = currencyMatch[1];
  }

  return fields;
}

export const SYSTEM_PROMPT_CONTENT = `You are a deterministic field-extraction assistant. Extract structured fields from the OCR text of a receipt.

Return a single JSON object matching this schema (all fields OPTIONAL — omit fields you cannot extract with confidence):

{
  "merchant_text": "<merchant name string>",
  "date": "<ISO 8601 YYYY-MM-DD>",
  "subtotal": <number>,
  "total": <number>,
  "tax_amount": <number>,
  "currency": "<ISO 4217 3-letter code>",
  "payment_method": "<one of: cash, cheque, eft, wire, credit_card, debit_card, ach, other>",
  "last_4": "<4-digit string if visible>",
  "merchant_identifier": "<string>",
  "auth_ref": "<string>",
  "transaction_reference": "<string>"
}

Output JSON only — no markdown fences.`;

const SYSTEM_PROMPT_CONTENT_HASH = crypto
  .createHash('sha256')
  .update(SYSTEM_PROMPT_CONTENT)
  .digest('hex');

export async function extractReceiptFields(
  input: ExtractFieldsInput,
  ctx: SystemActorServiceContext,
): Promise<ExtractionResult> {
  const ocrText = extractOcrText(input.ocrArtifact);
  const trace_records: PipelineStageRecord[] = [];

  const tierAFields = tryExtractTierA(ocrText);
  const tierASufficient =
    tierAFields.total !== undefined &&
    tierAFields.date !== undefined &&
    tierAFields.payment_method !== undefined;

  const parentTrace: PipelineStageRecord = {
    stage_name: 'extract_fields',
    input_hash: crypto.createHash('sha256').update(ocrText).digest('hex'),
    output_hash: crypto
      .createHash('sha256')
      .update(JSON.stringify(tierAFields))
      .digest('hex'),
    model: null,
    timestamp: new Date().toISOString(),
  };

  if (tierASufficient) {
    trace_records.push(parentTrace);
    return {
      fields: tierAFields,
      ai_fallback_invoked: false,
      trace_records,
    };
  }

  const aiResult = await runAiExtractFallback<ReceiptExtraction>(
    {
      ocrText,
      systemPrompt: {
        content: SYSTEM_PROMPT_CONTENT,
        contentHash: SYSTEM_PROMPT_CONTENT_HASH,
      },
      source_document_id: input.source_document_id,
      trace_id: input.trace_id,
      documentType: 'receipt',
    },
    ReceiptExtractionSchema,
    ctx,
  );

  trace_records.push(parentTrace);
  trace_records.push(aiResult.trace_record);

  if (aiResult.valid) {
    const mergedFields: Partial<ReceiptExtraction> = {
      ...tierAFields,
      ...aiResult.fields,
    };
    return {
      fields: mergedFields,
      ai_fallback_invoked: true,
      trace_records,
    };
  }

  return {
    fields: tierAFields,
    ai_fallback_invoked: true,
    trace_records,
  };
}

// No-AI Tier-A extraction entrypoint — exposes the deterministic regex path
// for fixture-offline eval (Wave 5 D1), mirroring the classifier's exported
// evaluateTierA. Behavior-preserving wrapper over the private tryExtractTierA;
// no AI, no I/O.
export function extractReceiptFieldsTierA(
  ocrText: string,
): Partial<ReceiptExtraction> {
  return tryExtractTierA(ocrText);
}
