// paymentConfirmationExtractor.ts — Stage 4 payment_confirmation field
// extraction per Phase 7 chunk 7.3a brief Task 7.3a.2 + §4 value pick #2.

import crypto from 'crypto';
import {
  PaymentConfirmationExtractionSchema,
  type PaymentConfirmationExtraction,
} from '@/shared/schemas/extraction/paymentConfirmationExtractionSchema';
import { extractOcrText } from './classifier/extractOcrText';
import { runAiExtractFallback } from './aiFallbackExtractorBase';
import type { ExtractFieldsInput, ExtractionResult, PipelineStageRecord } from './types';
import type { SystemActorServiceContext } from '@/services/middleware/serviceContext';

const AMOUNT_PATTERNS = [
  /\b(?:Payment\s+)?Amount\s*:?\s*\$?([0-9,]+(?:\.[0-9]{2})?)/i,
  /\bTotal\s*:?\s*\$?([0-9,]+(?:\.[0-9]{2})?)/i,
];

const DATE_PATTERNS = [
  /\b(?:Payment\s+)?Date\s*:?\s*(\d{4}-\d{2}-\d{2})/i,
  /\b(?:Payment\s+)?Date\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
];

const CONFIRMATION_NUMBER_PATTERNS = [
  /\bConfirmation\s+(?:Number|No\.?|#)?\s*:?\s*([\w-]+)/i,
  /\bTransaction\s+(?:ID|Reference|Number)\s*:?\s*([\w-]+)/i,
];

const PAYMENT_METHOD_PATTERN =
  /\b(visa|mastercard|amex|debit|credit\s+card|cash|wire|eft|ach|cheque)\b/i;

const CURRENCY_PATTERN = /\b(USD|CAD|EUR|GBP)\b/;

function tryExtractTierA(ocrText: string): Partial<PaymentConfirmationExtraction> {
  const fields: Partial<PaymentConfirmationExtraction> = {};

  for (const pattern of AMOUNT_PATTERNS) {
    const match = ocrText.match(pattern);
    if (match && match[1]) {
      const num = Number(match[1].replace(/,/g, ''));
      if (!Number.isNaN(num)) {
        fields.payment_amount = num;
        break;
      }
    }
  }

  for (const pattern of DATE_PATTERNS) {
    const match = ocrText.match(pattern);
    if (match && match[1]) {
      fields.payment_date = match[1];
      break;
    }
  }

  for (const pattern of CONFIRMATION_NUMBER_PATTERNS) {
    const match = ocrText.match(pattern);
    if (match && match[1]) {
      fields.payment_reference = match[1];
      break;
    }
  }

  const paymentMethodMatch = ocrText.match(PAYMENT_METHOD_PATTERN);
  if (paymentMethodMatch) {
    fields.payment_method = paymentMethodMatch[1].toLowerCase();
  }

  const currencyMatch = ocrText.match(CURRENCY_PATTERN);
  if (currencyMatch) {
    fields.currency = currencyMatch[1];
  }

  return fields;
}

const SYSTEM_PROMPT_CONTENT = `You are a deterministic field-extraction assistant. Extract structured fields from the OCR text of a payment confirmation document.

Return a single JSON object matching this schema (all fields OPTIONAL — omit fields you cannot extract with confidence):

{
  "vendor_text": "<payee/vendor name string>",
  "payment_date": "<ISO 8601 YYYY-MM-DD>",
  "payment_amount": <number>,
  "currency": "<ISO 4217 3-letter code>",
  "payment_method": "<one of: cash, cheque, eft, wire, credit_card, debit_card, ach, other>",
  "payment_reference": "<string>",
  "auth_ref": "<string>",
  "transaction_id": "<string>",
  "cited_invoice_number": "<string if confirmation references a specific invoice>",
  "cited_bill_id": "<UUID string if confirmation references a specific bill>"
}

Output JSON only — no markdown fences.`;

const SYSTEM_PROMPT_CONTENT_HASH = crypto
  .createHash('sha256')
  .update(SYSTEM_PROMPT_CONTENT)
  .digest('hex');

export async function extractPaymentConfirmationFields(
  input: ExtractFieldsInput,
  ctx: SystemActorServiceContext,
): Promise<ExtractionResult> {
  const ocrText = extractOcrText(input.ocrArtifact);
  const trace_records: PipelineStageRecord[] = [];

  const tierAFields = tryExtractTierA(ocrText);
  const tierASufficient =
    tierAFields.payment_amount !== undefined &&
    tierAFields.payment_date !== undefined &&
    tierAFields.payment_reference !== undefined;

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

  const aiResult = await runAiExtractFallback<PaymentConfirmationExtraction>(
    {
      ocrText,
      systemPrompt: {
        content: SYSTEM_PROMPT_CONTENT,
        contentHash: SYSTEM_PROMPT_CONTENT_HASH,
      },
      source_document_id: input.source_document_id,
      trace_id: input.trace_id,
      documentType: 'payment_confirmation',
    },
    PaymentConfirmationExtractionSchema,
    ctx,
  );

  trace_records.push(parentTrace);
  trace_records.push(aiResult.trace_record);

  if (aiResult.valid) {
    const mergedFields: Partial<PaymentConfirmationExtraction> = {
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
export function extractPaymentConfirmationFieldsTierA(
  ocrText: string,
): Partial<PaymentConfirmationExtraction> {
  return tryExtractTierA(ocrText);
}
