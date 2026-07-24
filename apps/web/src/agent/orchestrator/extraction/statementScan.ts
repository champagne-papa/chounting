// statementScan.ts — Board #4 Fork C handler #3: the statement-vs-invoice
// PRESENCE tripwire (detect-and-route only).
//
// A Tier-2 ingestion-pipeline detector (ADR-0007 §Tier 2 read boundary). It
// scans the incoming DOCUMENT's OWN OCR text and returns a BOOLEAN — "this
// vendor_invoice-classified document reads as a statement, not a single
// invoice." It reads NO vendor-master field, extracts/persists nothing, and
// classifies no fraud. It routes a suspected statement to a human, where the
// bookable-or-not judgment is made.
//
// WHY THIS HANDLER EXISTS (grounded first-hand): the Tier A vendor_invoice
// classifier matches /\bstatement\b/ as a positive header pattern
// (vendorInvoiceRules.ts:38 + its Step-18 comment "matches Invoice/Bill/
// Statement headers"). So a vendor statement — a SUMMARY of already-invoiced
// charges / balance-forward, which must NOT be booked as a single new bill —
// classifies as vendor_invoice and flows toward booking. This tripwire, gated
// on documentType === 'vendor_invoice' at Stage 5.5, routes it to a human under
// exception_reason='statement_not_invoice_suspected'.
//
// SHAPE = presence-AND-weak-invoice-signal (not bare presence): fire only when a
// statement-EXCLUSIVE marker is present AND a strong single-invoice identity is
// ABSENT. The AND-weak conjunct avoids nuking a legitimate invoice that merely
// mentions a statement — such an invoice still carries its own single
// "Invoice #<n>" identity, which suppresses the flag. The "weak invoice signal"
// is derived from the OCR header DIRECTLY, never from the matcher's composed
// score: the logged vendor-only scoring bug (documentRouterService field-name
// mismatch, board-4 fork-c finding) caps that score at 0.3×vendor_match and
// zeroes the invoice axes, so reading it would silently inherit the dead-axis bug.
//
// COVERAGE BOUNDARY (documented, not hidden): this handler is gated on the
// vendor_invoice label, so it catches only statements that landed on that label.
// A statement misclassified as receipt/payment_confirmation (via Tier A's
// non-invoice-outranks-invoice precedence) sails past — acceptable, since those
// labels do not book into AP (no double-count). A statement whose OCR also
// carries a clean single "Invoice #<n>" identity is likewise not flagged (the
// AND-weak guard suppresses it) and routes as an ordinary vendor_invoice to
// needs_review under Wave -1 — a human still sees it. THIRD (a within-label recall
// ceiling): the classifier matches the BARE word /\bstatement\b/
// (vendorInvoiceRules.ts:38), but this detector requires the SPECIFIC markers
// below — so a statement whose OCR carries the bare word but none of those markers
// classifies vendor_invoice yet does NOT trip here, flowing un-flagged. Wave -1
// still parks matched→needs_review, and this is exactly what the "no statement
// corpus in-repo" caveat covers — the marker set widens as corpus evidence accrues.
//
// Patterns are a v1 starting point — there is no real statement OCR corpus
// in-repo yet; the prediction-grounding + regex-permissive-matching conventions
// apply as real-OCR corpus evidence accrues (mirrors bankDetailScan's caveat).

// Statement-EXCLUSIVE markers: language a single vendor invoice does not carry.
// Each is chosen for near-zero false-positive risk on real invoices — a genuine
// single invoice does not say "statement of account", "balance forward", or
// "do not pay from this statement".
const STATEMENT_MARKERS: readonly RegExp[] = [
  /\bstatement\s+of\s+account\b/i,
  /\baccount\s+statement\b/i,
  /\bstatement\s+date\b/i,
  /\b(?:balance|amount)\s+(?:brought\s+)?forward\b/i,
  /\b(?:previous|opening|beginning|prior)\s+balance\b/i,
  /\bdo\s+not\s+pay\s+from\s+(?:this\s+)?statement\b/i,
  /\bthis\s+(?:document\s+)?is\s+not\s+an\s+invoice\b/i,
];

// Strong SINGLE-invoice identity: a LABELED invoice reference (invoice
// number/no/#) whose value looks like an actual invoice number (contains a
// digit). Its presence is the "strong single-invoice-defining signal"; its
// ABSENCE is the "weak invoice signal" conjunct. LABELED is load-bearing: a real
// invoice declares its identity as "Invoice #<n>" / "Invoice No: <n>", whereas a
// statement lists its invoices as BARE line-item references ("Invoice 12345")
// under a table — those are references, not the document's own identity, so they
// must NOT suppress the flag. The digit lookahead also avoids matching a bare
// "Invoice #" column header (e.g. "Invoice #  Charges") on a statement's table.
const SINGLE_INVOICE_IDENTITY: readonly RegExp[] = [
  /\binvoice\s*(?:number|no\.?|#)\s*:?\s*(?=[A-Za-z0-9-]*\d)[A-Za-z0-9][A-Za-z0-9-]{1,}\b/i,
];

/**
 * DETECT-AND-ROUTE: returns true iff the OCR text reads as a statement rather
 * than a single invoice — a statement-exclusive marker is present AND no strong
 * single-invoice identity is present. Returns ONLY a boolean.
 */
export function looksLikeStatementNotInvoice(ocrText: string): boolean {
  const hasStatementMarker = STATEMENT_MARKERS.some((pattern) => pattern.test(ocrText));
  if (!hasStatementMarker) return false;
  const hasSingleInvoiceIdentity = SINGLE_INVOICE_IDENTITY.some((pattern) =>
    pattern.test(ocrText),
  );
  return !hasSingleInvoiceIdentity;
}
