// receiptRules.ts — Tier A heuristics for receipt classification per
// Phase 7 chunk 7.2 brief Task 7.2.5 + ADR-0014 §7 + Step 18.
//
// Calibrated against mockSidecar synthetic OCR at v1; real-PaddleOCR
// calibration deferred to post-Modal-deployment fire per Phase A Step 18
// default disposition.
//
// Per Step 18 sub-recommendation (i): negative patterns alongside
// positive patterns. evaluateReceipt matches receipt-shape patterns
// (terminal layout + payment-method line) AND does NOT match vendor-
// invoice headers (Invoice/Bill/Statement) which would suggest invoice
// over receipt.

import type { TierAOutput, DocumentArtifactRow } from '../types';
import { extractOcrText } from './extractOcrText';

// Receipt-shape signals split into two semantic categories. A receipt
// match requires at least one signal from each category (Total/Subtotal
// alone is too weak; payment-method line alone is too weak; together
// they're a confident receipt signature). Filename match + one category
// suffices when filename strongly hints "receipt".
const RECEIPT_TOTAL_PATTERNS = [
  /\btotal\b/i,
  /\bsubtotal\b/i,
];

const RECEIPT_PAYMENT_OR_THANKYOU_PATTERNS = [
  /\b(visa|mastercard|amex|debit|credit\s+card|cash|debit\s+card)\b/i,
  /\bthank\s+you\s+for\s+your\s+(purchase|patronage|business)/i,
  /\bmerchant\s+(id|copy|number)/i,
  /\bauth(\s+code|orization)\b/i,
  /\bapproval\s+code\b/i,
];

const RECEIPT_FILENAME_PATTERNS = [/receipt/i];

// Phase 8 real-OCR recalibration (Session 71): a "Receipt" title line +
// a payment-on-receipt signal is a high-precision receipt signature.
// Real online receipts (Figma) cite the invoice number as a cross-
// reference; that cross-ref must NOT suppress the receipt, so this path
// skips VENDOR_INVOICE_NEGATIVE_PATTERNS. Both a header AND a paid signal
// are required (low-recall on purpose — a bare "Receipt" word is too weak).
const RECEIPT_HEADER_PATTERNS = [/^\s*receipt\b/im];
const RECEIPT_PAID_SIGNALS = [
  /\bdate\s+paid\b/i,
  /\bpaid\s+on\b/i,
  /\bpayment\s+date\b/i,
];

// Negative patterns: vendor-invoice headers suggest invoice, not receipt.
const VENDOR_INVOICE_NEGATIVE_PATTERNS = [
  /\binvoice\s+#?\s*[\w-]/i,
  /\btax\s+invoice\b/i,
  /\bstatement\s+(date|of\s+account)/i,
];

// Negative patterns: payment-confirmation language suggests
// confirmation, not transactional receipt.
const PAYMENT_CONFIRMATION_NEGATIVE_PATTERNS = [
  /payment\s+(received|completed|processed)\b/i,
  /thank\s+you\s+for\s+your\s+payment\b/i,
  /confirmation\s+(number|of\s+payment)/i,
];

function anyMatch(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

export function evaluateReceipt(
  artifact: DocumentArtifactRow,
  filename?: string,
): TierAOutput {
  const text = extractOcrText(artifact);

  // High-precision receipt-header signature: a "Receipt" title line AND a
  // payment-on-receipt signal. This path is authoritative over an invoice
  // cross-reference, so it skips VENDOR_INVOICE_NEGATIVE_PATTERNS below.
  const receiptHeader =
    anyMatch(text, RECEIPT_HEADER_PATTERNS) &&
    anyMatch(text, RECEIPT_PAID_SIGNALS);

  const hasTotalLine = anyMatch(text, RECEIPT_TOTAL_PATTERNS);
  const hasPaymentOrThankyou = anyMatch(
    text,
    RECEIPT_PAYMENT_OR_THANKYOU_PATTERNS,
  );
  const filenameMatch = filename
    ? anyMatch(filename, RECEIPT_FILENAME_PATTERNS)
    : false;

  // Require both (Total/Subtotal AND payment-method-or-thankyou) — a
  // single category match alone is too weak (e.g., "Total" appears on
  // invoices). Filename match + single category suffices when the
  // filename strongly hints "receipt".
  const shapeMatch =
    (hasTotalLine && hasPaymentOrThankyou) ||
    (filenameMatch && (hasTotalLine || hasPaymentOrThankyou));

  if (!receiptHeader && !shapeMatch) {
    return { matched: false };
  }

  // Negative patterns: vendor-invoice OR payment-confirmation language
  // suppresses the receipt match. The receipt-header path is authoritative
  // over an invoice cross-reference (the cited "Invoice number" is expected
  // on a real receipt), so it SKIPS the vendor-invoice suppression;
  // payment-confirmation suppression still applies to both paths.
  if (!receiptHeader && anyMatch(text, VENDOR_INVOICE_NEGATIVE_PATTERNS)) {
    return { matched: false };
  }
  if (anyMatch(text, PAYMENT_CONFIRMATION_NEGATIVE_PATTERNS)) {
    return { matched: false };
  }

  // Positive match without negative-pattern rejection: intrinsic
  // confidence 0.85 (above ADR-0014 §7 v1-provisional threshold 0.80).
  const rationale = receiptHeader
    ? 'Receipt title + payment-on-receipt signal (high-precision; invoice cross-reference ignored)'
    : filenameMatch
      ? 'Receipt-shape signals + filename heuristic match (no invoice or payment-confirmation negative patterns)'
      : 'Receipt-shape signals (total/subtotal + payment-method line) (no invoice or payment-confirmation negative patterns)';

  return {
    matched: true,
    documentType: 'receipt',
    confidence: 0.85,
    rationale,
  };
}
