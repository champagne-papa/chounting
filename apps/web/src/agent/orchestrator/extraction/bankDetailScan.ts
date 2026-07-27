// bankDetailScan.ts — Board #4 Fork C handler #2: the bank-detail / remittance
// PRESENCE tripwire (detect-and-route only).
//
// A Tier-2 ingestion-pipeline detector (ADR-0007 §Tier 2 read boundary). It
// scans the incoming DOCUMENT's OCR text for payment-coordinate-shaped content
// and returns a BOOLEAN — never the matched coordinates. It does NOT read the
// vendor master's control / payment-risk fields (bank account, payment
// instructions, bank-detail-confirmed flag — Tier 2.5 territory), does NOT
// extract or persist the coordinates, and does NOT classify fraud. It grounds
// PRESENCE, not a proven change (there is no vendor bank-detail baseline at
// Tier 2), and it is NOT the Tier-1 Q28 3(e) bank-detail-change re-verification
// control — it is a coarser, upstream tripwire that routes a suspicious invoice
// to a human, where the payment-risk judgment is made.
//
// Precision is PERMISSIVE-TO-FLAG: the failure modes are asymmetric — a false
// positive costs a reviewer a glance (route-to-human, never blocks); a false
// negative lets a fraud-redirect-shaped invoice through the normal path. Tuned
// to LABELED bank-coordinate shapes rather than bare digits, so an ordinary
// invoice's amounts / dates / invoice numbers do not trip it. Patterns are a v1
// starting point; the prediction-grounding + regex-permissive-matching
// conventions apply as real-OCR corpus evidence accrues.

// Labeled payment-coordinate patterns. Each requires an explicit label so
// incidental digits (totals, dates, invoice numbers) do not match.
const BANK_DETAIL_PATTERNS: readonly RegExp[] = [
  // ABA / routing number: label + a 9-digit number.
  /\b(?:routing|aba|rtn)\s*(?:number|no\.?|#)?\s*:?\s*\d{9}\b/i,
  // Bank account number: label + 5+ digits.
  /\b(?:bank\s+)?(?:account|acct)\s*(?:number|no\.?|#)\s*:?\s*\d{5,}\b/i,
  // IBAN: 2 letters + 2 digits + 10-30 alphanumeric.
  /\biban\s*:?\s*[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/i,
  // SWIFT / BIC: 6 letters + 2-5 alphanumeric.
  /\b(?:swift|bic)\s*(?:code)?\s*:?\s*[A-Z]{6}[A-Z0-9]{2,5}\b/i,
  // Payment instructions: wire / ACH / remit-to.
  /\b(?:wire\s+(?:transfer|instructions|to)|ach\s+(?:transfer|payment|debit)|remit(?:tance)?\s+to)\b/i,
  // Explicit bank-coordinate labels.
  /\b(?:bank\s+account|routing\s+number|account\s+number|sort\s+code)\b/i,
];

/**
 * DETECT-AND-ROUTE: returns true iff the OCR text carries payment-coordinate-
 * shaped content. Returns ONLY a boolean — never the matched value — so the
 * caller can route to a human without reading, extracting, or persisting the
 * coordinates (Tier-2 read-boundary safety).
 */
export function looksLikeBankDetailPresent(ocrText: string): boolean {
  return BANK_DETAIL_PATTERNS.some((pattern) => pattern.test(ocrText));
}
