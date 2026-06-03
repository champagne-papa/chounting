// vendorInvoiceExtractor.ts — Stage 4 vendor_invoice field extraction
// per Phase 7 chunk 7.3a brief Task 7.3a.2 + §4 value pick #2.
//
// Tier A rule-based baseline + Tier C AI fallback per ADR-0014 §8.
// Tier C max 2 calls per source_document_id shared with Stage 3
// classifier per aiFallbackBudget.ts shared module (Iteration 2 Option α
// RATIFIED Phase B scope addition).
//
// Calibrated against mockSidecar synthetic OCR + chunk 7.2 receipt rule
// precedent. Real-PaddleOCR calibration deferred to post-Modal-deployment
// fire per chunk 7.2 Step 18 precedent.
//
// Per Session 38 Step 20 Option (c) precedent: Tier C path defers to
// callClaude.ts internal retry classification (NOT wrapped in
// withFailureClassification('extract_fields', ...) at orchestrator
// Stage 4 site).

import crypto from 'crypto';
import {
  VendorInvoiceExtractionSchema,
  type VendorInvoiceExtraction,
} from '@/shared/schemas/extraction/vendorInvoiceExtractionSchema';
import { extractOcrText } from './classifier/extractOcrText';
import { runAiExtractFallback } from './aiFallbackExtractorBase';
import type { ExtractFieldsInput, ExtractionResult, PipelineStageRecord } from './types';
import type { SystemActorServiceContext } from '@/services/middleware/serviceContext';

// Tier A heuristic regex patterns for vendor_invoice extraction.
// Calibrated against mockSidecar synthetic OCR at v1.
const INVOICE_NUMBER_PATTERNS = [
  /\bInvoice\s+(?:Number|No\.?|#)?\s*:?\s*([\w-]+)/i,
  /\bInv\.?\s*(?:#|No\.?)?\s*([\w-]+)/i,
];

const TOTAL_AMOUNT_PATTERNS = [
  /\bTotal\s*(?:Due|Amount)?\s*:?\s*\$?([0-9,]+(?:\.[0-9]{2})?)/i,
  /\bAmount\s+Due\s*:?\s*\$?([0-9,]+(?:\.[0-9]{2})?)/i,
];

const DATE_PATTERNS = [
  /\b(?:Issue|Invoice|Date)\s*(?:Date)?\s*:?\s*(\d{4}-\d{2}-\d{2})/i,
  /\b(?:Issue|Invoice|Date)\s*(?:Date)?\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
];

const DUE_DATE_PATTERNS = [
  /\bDue\s*(?:Date|By)?\s*:?\s*(\d{4}-\d{2}-\d{2})/i,
  /\bDue\s*(?:Date|By)?\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
];

const CURRENCY_PATTERN = /\b(USD|CAD|EUR|GBP)\b/;

// vendor_name (matcher INPUT) — Wave 6 D1 (matcher-gap fix). DELIBERATELY
// precision-biased: a vendor name is positional letterhead/header text, not
// label-keyed like the fields above. A permissive positional grab hits the
// dangerous cost-class — capturing the customer-side 'Bill To' block (the org
// itself) and producing a *confident wrong* match. So Tier A matches ONLY
// explicit sender-side labels, line-anchored, never the customer block, and
// never a positional first-line guess. A miss emits nothing → unmatched →
// needs_review (D2): the safe degradation. Recall is intentionally low here
// (Tier C carries vendor-name recall when it fires); D1's bar is the structural
// unblock, not accuracy (the Tier-C accuracy harness is post-V1).
const VENDOR_NAME_LABEL_PATTERN =
  /(?:^|\n)[ \t]*(?:Vendor|Supplier|Remit\s+To|Sold\s+By|Bill\s+From)\s*:[ \t]*([^\n]{2,60})/i;
// Over-match guard: reject a capture that leads with a digit (date / amount) or
// is *exactly* a document-type word (anchored, so 'Bill's Plumbing' passes).
const VENDOR_NAME_REJECT = /^(?:\d|(?:invoice|receipt|bill|statement)$)/i;

function tryExtractTierA(ocrText: string): Partial<VendorInvoiceExtraction> {
  const fields: Partial<VendorInvoiceExtraction> = {};

  for (const pattern of INVOICE_NUMBER_PATTERNS) {
    const match = ocrText.match(pattern);
    if (match && match[1]) {
      fields.vendor_invoice_number = match[1];
      break;
    }
  }

  for (const pattern of TOTAL_AMOUNT_PATTERNS) {
    const match = ocrText.match(pattern);
    if (match && match[1]) {
      const num = Number(match[1].replace(/,/g, ''));
      if (!Number.isNaN(num)) {
        fields.amount = num;
        break;
      }
    }
  }

  for (const pattern of DATE_PATTERNS) {
    const match = ocrText.match(pattern);
    if (match && match[1]) {
      fields.accounting_date = match[1];
      break;
    }
  }

  for (const pattern of DUE_DATE_PATTERNS) {
    const match = ocrText.match(pattern);
    if (match && match[1]) {
      fields.due_date = match[1];
      break;
    }
  }

  const currencyMatch = ocrText.match(CURRENCY_PATTERN);
  if (currencyMatch) {
    fields.currency = currencyMatch[1];
  }

  // vendor_name (matcher input) — sender-label-only, precision-biased (see
  // VENDOR_NAME_LABEL_PATTERN). Trim + collapse whitespace; guard rejects
  // date/numeric/doc-type captures. A miss leaves vendor_name absent — the
  // safe degradation (unmatched → needs_review via D2), never a wrong grab.
  const vendorNameMatch = ocrText.match(VENDOR_NAME_LABEL_PATTERN);
  if (vendorNameMatch && vendorNameMatch[1]) {
    const candidate = vendorNameMatch[1].trim().replace(/\s{2,}/g, ' ');
    if (candidate.length >= 2 && !VENDOR_NAME_REJECT.test(candidate)) {
      fields.vendor_name = candidate;
    }
  }

  return fields;
}

const SYSTEM_PROMPT_CONTENT = `You are a deterministic field-extraction assistant. Extract structured fields from the OCR text of a vendor invoice.

Return a single JSON object matching this schema (all fields OPTIONAL — omit fields you cannot extract with confidence; do NOT invent values):

{
  "amount": <total invoice amount as number>,
  "currency": "<ISO 4217 3-letter code>",
  "vendor_invoice_number": "<vendor's invoice number string>",
  "accounting_date": "<ISO 8601 YYYY-MM-DD>",
  "due_date": "<ISO 8601 YYYY-MM-DD>",
  "tax_amount": <number>,
  "line_items": [{"description": "<string>", "amount": <number>, "account_code": "<string>", "tax_code_id": "<string>"}]
}

Do NOT include vendor_id, account_code, or tax_code_id at top level — those are resolved by downstream services. Do NOT extract bank-detail fields (account numbers, routing numbers). Output JSON only — no markdown fences.`;

const SYSTEM_PROMPT_CONTENT_HASH = crypto
  .createHash('sha256')
  .update(SYSTEM_PROMPT_CONTENT)
  .digest('hex');

export async function extractVendorInvoiceFields(
  input: ExtractFieldsInput,
  ctx: SystemActorServiceContext,
): Promise<ExtractionResult> {
  const ocrText = extractOcrText(input.ocrArtifact);
  const trace_records: PipelineStageRecord[] = [];

  // Tier A: rule-based regex extraction.
  const tierAFields = tryExtractTierA(ocrText);
  const tierASufficient =
    tierAFields.amount !== undefined &&
    tierAFields.vendor_invoice_number !== undefined &&
    tierAFields.accounting_date !== undefined;

  // Parent trace_record always emits 'extract_fields' per ADR-0014 §1.
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

  // Tier C: AI fallback via shared budget + base helper.
  const aiResult = await runAiExtractFallback<VendorInvoiceExtraction>(
    {
      ocrText,
      systemPrompt: {
        content: SYSTEM_PROMPT_CONTENT,
        contentHash: SYSTEM_PROMPT_CONTENT_HASH,
      },
      source_document_id: input.source_document_id,
      trace_id: input.trace_id,
      documentType: 'vendor_invoice',
    },
    VendorInvoiceExtractionSchema,
    ctx,
  );

  trace_records.push(parentTrace);
  trace_records.push(aiResult.trace_record);

  if (aiResult.valid) {
    // Merge Tier A + Tier C: Tier C wins where present; Tier A provides
    // fallback for fields Tier C didn't extract.
    const mergedFields: Partial<VendorInvoiceExtraction> = {
      ...tierAFields,
      ...aiResult.fields,
    };
    return {
      fields: mergedFields,
      ai_fallback_invoked: true,
      trace_records,
    };
  }

  // Tier C invalid — fall back to whatever Tier A produced (may be partial).
  return {
    fields: tierAFields,
    ai_fallback_invoked: true,
    trace_records,
  };
}

// No-AI Tier-A extraction entrypoint — exposes the deterministic regex path
// for fixture-offline eval (Wave 5 D1), mirroring the classifier's exported
// evaluateTierA. Behavior-preserving wrapper over the private tryExtractTierA;
// no AI, no I/O. Named (not a raw helper re-export) so refactoring the internal
// does not break the eval API.
export function extractVendorInvoiceFieldsTierA(
  ocrText: string,
): Partial<VendorInvoiceExtraction> {
  return tryExtractTierA(ocrText);
}
