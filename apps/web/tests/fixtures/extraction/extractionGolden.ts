// tests/fixtures/extraction/extractionGolden.ts
//
// Wave 5 D1 — ground-truth labels for the no-AI Tier-A extraction eval.
// Keyed to REAL_OCR_CORPUS labels (corpus.sanitized.ts); reuses those `lines`.
// These are HUMAN ground truth read from each sanitized document — NOT the
// extractor's output (that would be circular). Verified against the corpus at
// the artifact read-back.
//
// Labeling rules (stated so labels are reproducible + auditable):
//  - Value = what a CORRECT extraction of that field should yield for the doc.
//  - `amount`/`total`/`payment_amount` = the document's TOTAL (grand total /
//    amount due / amount paid), as a number — NOT a tax line, line-item, or a
//    distinct subtotal.
//  - `currency` = "CAD" only when the doc carries an explicit currency
//    indicator (a `CA$` token or an explicit "Currency CAD" line); OMITTED
//    when only a bare "$" appears (conservative — no inference labeled).
//  - dates / id strings = the document's literal token (the value a correct
//    Tier-A capture would yield), e.g. "31/10/25", "November 18, 2025".
//  - A scored field the document does NOT contain is OMITTED (so it is not in
//    the coverage denominator; a Tier-A populate of it is a spurious extraction
//    that counts against correctness).
//  - Multi-document OCR captures (amazon_invoice concatenates 3 sub-invoices;
//    mattjanzen_payment lists 4 e-transfers): the FIRST/primary instance is
//    labeled; noted inline.

import type { GroundTruth } from '../../helpers/extractionEval';

export const EXTRACTION_GROUND_TRUTH: Record<string, GroundTruth> = {
  // ---- vendor_invoice (scored: amount, currency, vendor_invoice_number,
  //      accounting_date, due_date) ----
  demo_figma_invoice: {
    amount: 282.24, // Total CA$282.24
    currency: 'CAD', // "CA$" indicator
    vendor_invoice_number: '1ABCD23M-0001',
    accounting_date: 'November 18, 2025', // Date of issue
    due_date: 'November 18, 2025', // Date due
  },
  mattjanzen_invoice: {
    amount: 1433.25, // Total / Balance Due $1,433.25
    // currency omitted — bare "$", no CA$/CAD indicator
    vendor_invoice_number: 'INV-000778', // "# INV-000778"
    accounting_date: '31/10/25', // Invoice Date :
    due_date: '15/11/25', // Due Date :
  },
  // amazon_invoice — BOARD-#4 (multi-invoice) RECONCILIATION. This doc's OCR
  // concatenates THREE sub-invoices: CA10ABCD2E30 $14.55 · CA20EFGH4J50 $11.19
  // · CA30KLMN6P70 $15.65 (these are the SANITIZED corpus invoice numbers; the
  // prod row source_document 3433cfe3 carries the real CA56SWET7X6I /
  // CA542WJGEUEI / CA5KJ23M1ZFI per the CURRENT_STATE 176ac24c forensic — same
  // doc, same amounts, only the sanitized refs differ by rule). Tier-A baseline:
  // RETAINED, scored first-sub-invoice — a legitimate Tier-A datapoint (what the
  // deterministic extractor yields on concatenated OCR) and part of
  // BASELINE_TALLY's vendor_invoice trulyPresent. Tier-C #2/#4 multi-invoice
  // model: DEFERRED to board-#4 (single-object GroundTruth cannot represent N=3;
  // the multi-invoice GT shape + prod-fetch/PII sign-off ship with #4, on Phil's
  // architecture call). Do NOT remove this entry to "defer amazon" — that drops
  // vendor_invoice trulyPresent 16→13 and fails the frozen ratchet. Re-label +
  // re-freeze BASELINE_TALLY only when board-#4 opens.
  amazon_invoice: {
    amount: 14.55, // first sub-invoice "Total payable / Total a payer: $14.55"
    // currency omitted — "CA" is the country token, not a currency code
    vendor_invoice_number: 'CA10ABCD2E30', // first "Invoice # / # de facture"
    accounting_date: '05 December 2025', // Invoice date / Date de facturation
    // due_date omitted — none on this invoice
  },
  adobe_invoice: {
    amount: 146.71, // Invoice Total / GRAND TOTAL (CAD)
    currency: 'CAD', // explicit "Currency CAD"
    vendor_invoice_number: '1000000002', // Invoice Number
    accounting_date: '02-DEC-2025', // Invoice Date
    // due_date omitted — none
  },

  // ---- receipt (scored: total, subtotal, date, payment_method, last_4,
  //      currency) ----
  demo_figma_receipt: {
    total: 282.24, // Total CA$282.24
    subtotal: 252.0, // Subtotal CA$252.00
    date: 'November 18, 2025', // Date paid
    payment_method: 'American Express', // "American Express - 0001"
    last_4: '0001', // "American Express - 0001"
    currency: 'CAD', // "CA$" indicator
  },
  delara_receipt: {
    total: 321.25, // Total $321.25
    subtotal: 257.0, // Subtotal $257.00
    date: '2026-03-04', // Ordered: 2026-03-04
    payment_method: 'AMEX', // Application Label AMEX
    // last_4 omitted — card shown masked as "LXXXXXXXXXX", no clear 4 digits
    // currency omitted — bare "$"
  },
  bestbuy_receipt: {
    total: 125.15, // Order Total: $125.15 (NOT the $111.74 Product Total)
    subtotal: 111.74, // Subtotal: $111.74
    date: '8-Dec-2025', // Order Date
    payment_method: 'Credit Cards', // "Credit Cards (1):" / AMEX
    last_4: '0001', // "AMEX xxxxxxxxxxxx0001"
    // currency omitted — bare "$"
  },
  mattjanzen_receipt: {
    total: 1433.25, // Amount Received $1,433.25
    // subtotal omitted — none
    date: '14/11/25', // Payment Date
    payment_method: 'Bank Transfer', // Payment Mode: Bank Transfer
    // last_4 omitted; currency omitted — bare "$"
  },

  // ---- payment_confirmation (scored: payment_amount, payment_date,
  //      payment_reference, payment_method, currency) ----
  demo_zoho_payment: {
    payment_amount: 282.24, // Amount Paid $282.24
    payment_date: '2025/11/19', // Payment Date
    // payment_reference omitted — "Reference Number" header has no clear value
    payment_method: 'Cash', // Payment Mode: Cash
    // currency omitted — bare "$"
  },
  mattjanzen_payment: {
    payment_amount: 1433.25, // first e-transfer (Jordan Avery) $1,433.25
    payment_date: '11/14/2025', // first row date
    payment_reference: '200000001', // first Reference #
    payment_method: 'Interac e-Transfer', // "Interac e-Transfer (4)"
    currency: 'CAD', // explicit "CAD"
  },
  synthetic_no_cited_payment: {
    payment_amount: 282.24, // Amount Paid: $282.24
    payment_date: '2025-11-18', // Payment Date: 2025-11-18
    // payment_reference omitted — none
    payment_method: 'EFT', // Payment Mode: EFT
    // currency omitted — bare "$"
  },
  synthetic_born_paid: {
    payment_amount: 282.24, // Amount Paid: $282.24
    payment_date: '2025-11-18', // Payment Date: 2025-11-18
    // payment_reference omitted — none
    payment_method: 'EFT', // Payment Mode: EFT
    // currency omitted — bare "$"
  },
};

// ---------------------------------------------------------------------------
// Regression snapshot — HARNESS-COMPUTED, one-directional ratchet.
//
// These are the integer tallies the pure harness computes over the frozen
// fixtures + labels above (NOT hand-read). The runner asserts current == frozen
// EXACTLY: a regression (coverage/correctness drop) fails CI, AND an improvement
// (e.g. a Wave-6 regex hardening) ALSO fails until this snapshot is explicitly
// re-frozen with a visible diff. That blocks both silent regression and silent
// baseline-lowering.
//
// To re-freeze: run the suite, copy the printed "OBSERVED TALLY" block here,
// in the same commit as the change that moved it, with a one-line why.
//
// Per type: trulyPresent (coverage denom), populated (correctness denom),
// covered (coverage numer), correct (correctness numer).
import type { AggregateTally, DocumentType } from '../../helpers/extractionEval';

// Frozen 2026-06-02 from the harness OBSERVED TALLY (first measured run).
// Derived coverage / correctness (reported, not asserted):
//   vendor_invoice      coverage 10/16=63%  correctness  3/10=30%
//   receipt             coverage  8/18=44%  correctness  6/8 =75%
//   payment_confirmation coverage 8/14=57%  correctness  7/8 =88%
// The low vendor_invoice correctness is the Wave-5 eval FINDING (Tier-A regex,
// calibrated on synthetic OCR, mis-extracts vendor_invoice_number + amount on
// real OCR). Recorded, not pre-tuned — feeds Wave 6 + the §7 matcher-gap.
export const BASELINE_TALLY: Record<DocumentType, AggregateTally> = {
  vendor_invoice: { trulyPresent: 16, populated: 10, covered: 10, correct: 3 },
  receipt: { trulyPresent: 18, populated: 8, covered: 8, correct: 6 },
  payment_confirmation: { trulyPresent: 14, populated: 8, covered: 8, correct: 7 },
};
