// paymentConfirmationRules.ts — Tier A heuristics for
// payment_confirmation classification per Phase 7 chunk 7.2 brief
// Task 7.2.5 + ADR-0014 §7 + Step 18.
//
// Calibrated against mockSidecar synthetic OCR at v1; real-PaddleOCR
// calibration deferred to post-Modal-deployment fire per Phase A Step 18
// default disposition.
//
// Per Step 18 sub-recommendation (i): negative patterns alongside
// positive patterns. evaluatePaymentConfirmation matches payment-
// completion language AND does NOT match vendor-invoice headers or
// receipt-shape line-item-and-total layouts (a payment_confirmation
// is a confirmation document, not transactional).

import type { TierAOutput, DocumentArtifactRow } from '../types';
import { extractOcrText } from './extractOcrText';

// Positive patterns: payment-completion language + confirmation
// number patterns + filename heuristics.
//
// Phase 8 real-OCR recalibration (Session 71): added high-precision
// voucher-header positives grounded in the captured Zoho-voucher OCR —
// a "PAYMENTS MADE" header + voucher-field vocabulary ("Amount Paid",
// "Payment Date/Mode/Voucher") identify a real payment voucher that
// lacks the "payment received/processed" completion language.
const PAYMENT_CONFIRMATION_POSITIVE_PATTERNS = [
  /\bpayment\s+(received|completed|processed|successful)/i,
  /\bthank\s+you\s+for\s+your\s+payment\b/i,
  /\byour\s+payment\s+(has\s+been\s+)?(processed|received|completed)/i,
  /\bpayment\s+confirmation\b/i,
  /\bconfirmation\s+(number|of\s+payment)/i,
  /\btransaction\s+(id|reference|number)/i,
  /\bpayments?\s+made\b/i, // Zoho "PAYMENTS MADE" header
  /\bamount\s+paid\b/i,
  /\bpayment\s+(date|mode|voucher)\b/i,
];

const PAYMENT_CONFIRMATION_FILENAME_PATTERNS = [
  /payment/i,
  /confirmation/i,
];

// Negative patterns: vendor-invoice headers suggest invoice.
const VENDOR_INVOICE_NEGATIVE_PATTERNS = [
  /\binvoice\s+#?\s*[\w-]/i,
  /\btax\s+invoice\b/i,
  /\bstatement\s+(date|of\s+account)/i,
];

// Negative patterns: receipt-shape line-item-and-total patterns suggest
// transactional receipt, not confirmation. A confirmation typically
// doesn't carry the full line-item breakdown.
const RECEIPT_NEGATIVE_PATTERNS = [
  /\bsubtotal\b\s*[\d.,]+\s*\n.*\btax\b\s*[\d.,]+\s*\n.*\btotal\b/i,
  /\bmerchant\s+copy\b/i,
];

function anyMatch(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

export function evaluatePaymentConfirmation(
  artifact: DocumentArtifactRow,
  filename?: string,
): TierAOutput {
  const text = extractOcrText(artifact);

  const positiveMatch = anyMatch(text, PAYMENT_CONFIRMATION_POSITIVE_PATTERNS);
  const filenameMatch = filename
    ? anyMatch(filename, PAYMENT_CONFIRMATION_FILENAME_PATTERNS)
    : false;

  // Require at least one positive match (text language OR filename).
  if (!positiveMatch && !filenameMatch) {
    return { matched: false };
  }

  // Negative patterns: vendor-invoice OR receipt-shape patterns
  // suppress the payment_confirmation match.
  if (
    anyMatch(text, VENDOR_INVOICE_NEGATIVE_PATTERNS) ||
    anyMatch(text, RECEIPT_NEGATIVE_PATTERNS)
  ) {
    return { matched: false };
  }

  // Positive match without negative-pattern rejection: intrinsic
  // confidence 0.90 (above ADR-0014 §7 v1-provisional threshold 0.85).
  const rationale =
    positiveMatch && filenameMatch
      ? 'Payment-completion language + filename heuristic match (no invoice or receipt negative patterns)'
      : positiveMatch
        ? 'Payment-completion language in OCR text (no invoice or receipt negative patterns)'
        : 'Filename heuristic match (no invoice or receipt negative patterns)';

  return {
    matched: true,
    documentType: 'payment_confirmation',
    confidence: 0.9,
    rationale,
  };
}
