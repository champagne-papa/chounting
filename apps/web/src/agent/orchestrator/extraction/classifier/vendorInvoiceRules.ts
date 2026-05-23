// vendorInvoiceRules.ts — Tier A heuristics for vendor_invoice
// classification per Phase 7 chunk 7.2 brief Task 7.2.5 + ADR-0014 §7
// Tier A high-precision-low-recall + Step 18 sub-recommendations.
//
// Calibrated against mockSidecar synthetic OCR at v1; real-PaddleOCR
// calibration deferred to post-Modal-deployment fire per Phase A Step 18
// default disposition.
//
// Per Step 18 sub-recommendation (i): negative patterns alongside
// positive patterns. evaluateVendorInvoice matches Invoice/Bill/Statement
// headers AND does NOT match receipt-shape footers (e.g., "thank you for
// your purchase", terminal-style payment-method lines) to reduce false-
// positive risk if real PaddleOCR output produces unexpected mid-document
// text patches.
//
// Per Step 18 sub-recommendation (ii): intrinsic confidence at 0.90
// (above per-document-type threshold 0.85 per ADR-0014 §7); confidence-
// lowering is NOT the mitigation for false-positive risk — heuristic
// strictness via negative patterns is.

import type { TierAOutput, DocumentArtifactRow } from '../types';
import { extractOcrText } from './extractOcrText';

// Positive patterns: case-insensitive regex match for invoice-shape
// headers + filename heuristics.
//
// Phase 8 real-OCR recalibration (Session 71): fire on an invoice
// header/title, NOT on field-label cross-references. A receipt or
// payment voucher that cites "Invoice number" / "Bill Number" / "Bill
// Date" / "Bill Amount" must not trip the vendor_invoice match. The
// negative lookahead excludes those field-label words. Note: "#"+digits
// (e.g. "Invoice #12345") is the document's OWN identifier — a genuine
// header element — so "#" is intentionally NOT in the exclusion list
// (excluding it would suppress real invoices; see existing positive test).
const VENDOR_INVOICE_HEADER_PATTERNS = [
  /\binvoice\b(?!\s*(number|no\b|date|amount|total|to\b))/i,
  /\bbill\b(?!\s*(to|number|date|amount|no\b))/i, // not "Bill to" / field labels
  /\bstatement\b/i,
  /\btax\s+invoice\b/i,
];

const VENDOR_INVOICE_FILENAME_PATTERNS = [
  /invoice/i,
  /\bbill\b/i,
  /statement/i,
];

// Negative patterns: receipt-shape footers that suggest receipt, not
// invoice. If any present, suppress vendor_invoice match (Step 18 (i)).
//
// Phase 8 real-OCR recalibration (Session 71): added document-kind-
// defining headers grounded in the captured Figma-receipt OCR — a
// "Receipt" title line / "Date paid" / "paid on" mean the doc is a
// receipt even if it cites its invoice number as a cross-reference.
const RECEIPT_FOOTER_NEGATIVE_PATTERNS = [
  /thank\s+you\s+for\s+your\s+(purchase|patronage|business)/i,
  /merchant\s+(id|copy|number)/i,
  /\bauth(\s+code|orization|\.?)\b/i,
  /\bapproval\s+code\b/i,
  /^\s*receipt\b/im, // "Receipt" title line (document-kind-defining header)
  /\bdate\s+paid\b/i,
  /\bpaid\s+on\b/i,
];

// Payment-confirmation language that suggests payment_confirmation, not
// vendor_invoice. A confirmation document shouldn't carry invoice-shape
// headers, but defensive in case OCR misreads.
//
// Phase 8 real-OCR recalibration (Session 71): added Zoho-voucher
// document-kind-defining headers — "PAYMENTS MADE" header / "Payment
// Date|Mode" / "Amount Paid" mean the doc is a payment voucher even
// though it lists a "Bill Number" cross-reference.
const PAYMENT_CONFIRMATION_NEGATIVE_PATTERNS = [
  /payment\s+(received|completed|processed)/i,
  /thank\s+you\s+for\s+your\s+payment/i,
  /\bpayments?\s+made\b/i, // "PAYMENTS MADE" header
  /\bpayment\s+(date|mode)\b/i,
  /\bamount\s+paid\b/i,
];

function anyMatch(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

export function evaluateVendorInvoice(
  artifact: DocumentArtifactRow,
  filename?: string,
): TierAOutput {
  const text = extractOcrText(artifact);

  const headerMatch = anyMatch(text, VENDOR_INVOICE_HEADER_PATTERNS);
  const filenameMatch = filename
    ? anyMatch(filename, VENDOR_INVOICE_FILENAME_PATTERNS)
    : false;

  // Require at least one positive match (header OR filename).
  if (!headerMatch && !filenameMatch) {
    return { matched: false };
  }

  // Negative patterns: receipt-shape OR payment-confirmation language
  // suppresses the vendor_invoice match (Step 18 sub-recommendation (i)).
  if (
    anyMatch(text, RECEIPT_FOOTER_NEGATIVE_PATTERNS) ||
    anyMatch(text, PAYMENT_CONFIRMATION_NEGATIVE_PATTERNS)
  ) {
    return { matched: false };
  }

  // Positive match without negative-pattern rejection: intrinsic
  // confidence 0.90 (above ADR-0014 §7 v1-provisional threshold 0.85).
  const rationale = filenameMatch && headerMatch
    ? 'Invoice-shape header in OCR text + filename heuristic match'
    : headerMatch
      ? 'Invoice-shape header in OCR text (no receipt or payment-confirmation negative patterns)'
      : 'Filename heuristic match (no receipt or payment-confirmation negative patterns)';

  return {
    matched: true,
    documentType: 'vendor_invoice',
    confidence: 0.9,
    rationale,
  };
}
