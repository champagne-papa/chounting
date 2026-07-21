// Board #4 Fork C handler #3 — the statement-vs-invoice PRESENCE tripwire.
//
// looksLikeStatementNotInvoice is a DETECT-AND-ROUTE scan on the document's OWN
// OCR text: it returns a boolean ("this vendor_invoice-classified document reads
// as a statement, not a single invoice") and nothing else. It is Tier-2-clean
// (ADR-0007 §Tier 2 read boundary): no vendor-master reads, no persistence.
//
// SHAPE = presence-AND-weak-invoice-signal (Phil's lock): it fires only when a
// statement-EXCLUSIVE marker is present AND a strong single-invoice identity is
// absent. The AND-weak conjunct exists to NOT nuke a legitimate invoice that
// merely mentions "statement" — such an invoice still carries its own single
// "Invoice #<n>" identity, which suppresses the flag. The "weak invoice signal"
// is derived from the OCR header directly, NEVER from the matcher's composed
// score (the logged vendor-only scoring bug would make that score meaningless).
//
// WHY THE hazard IS REAL (grounded): vendorInvoiceRules.ts:38 lists /\bstatement\b/
// as a positive vendor_invoice header — a vendor statement classifies as
// vendor_invoice and reaches Stage 5.5, where this tripwire routes it to a human.
//
// Markers are v1 heuristics (no real statement OCR corpus in-repo yet); the
// prediction-grounding + regex-permissive-matching conventions apply as corpus
// evidence accrues (mirrors bankDetailScan's own caveat).

import { describe, it, expect } from 'vitest';
import { looksLikeStatementNotInvoice } from '@/agent/orchestrator/extraction/statementScan';

describe('looksLikeStatementNotInvoice — statement-vs-invoice presence tripwire', () => {
  it('flags a "statement of account" summary with a balance-forward line', () => {
    expect(
      looksLikeStatementNotInvoice(
        'STATEMENT OF ACCOUNT\nStatement Date: 2026-01-31\nBalance Forward: $150.00\nTotal Amount Due: $150.00',
      ),
    ).toBe(true);
  });

  it('flags "account statement" + a previous-balance line', () => {
    expect(
      looksLikeStatementNotInvoice(
        'Account Statement\nPrevious Balance: $50.00\nTotal Due: $200.00',
      ),
    ).toBe(true);
  });

  it('flags an opening-balance statement', () => {
    expect(
      looksLikeStatementNotInvoice('Statement of Account\nOpening Balance: $0.00\nTotal: $75.00'),
    ).toBe(true);
  });

  it('flags an explicit "do not pay from this statement" instruction', () => {
    expect(
      looksLikeStatementNotInvoice(
        'Balance brought forward\nAmount due on account\nDo not pay from this statement',
      ),
    ).toBe(true);
  });

  it('does NOT flag an ordinary single vendor invoice (no statement markers)', () => {
    expect(
      looksLikeStatementNotInvoice(
        'Invoice #12345\nVendor: Acme Vendor Co.\nDate: 2026-01-15\nTotal: $123.45',
      ),
    ).toBe(false);
  });

  it('AND-weak guard — does NOT flag a legitimate invoice that mentions a statement but carries its own single invoice identity', () => {
    // Statement-exclusive markers ARE present (statement of account + balance
    // forward), but a strong single "Invoice #<n>" identity suppresses the flag:
    // this is a real invoice referencing a statement, not a statement.
    expect(
      looksLikeStatementNotInvoice(
        'Invoice #12345\nStatement of Account summary attached\nBalance Forward: $10.00\nTotal: $500.00',
      ),
    ).toBe(false);
  });

  it('AND-weak guard — a labeled "Invoice Number: <n>" identity also suppresses the flag', () => {
    expect(
      looksLikeStatementNotInvoice(
        'Invoice Number: INV-778\nStatement Date: 2026-01-31\nTotal: $42.00',
      ),
    ).toBe(false);
  });

  it('DOES flag a statement listing a BARE "Invoice 12345" line-item (a reference, not a labeled identity header)', () => {
    // A statement lists its invoices as line items ("Invoice 12345"). A bare
    // invoice-number reference is NOT the document's own single-invoice identity
    // (which is labeled "Invoice #/No/Number: <n>"), so the AND-weak guard does
    // NOT suppress — the doc still reads as a statement. This is the exact shape
    // the integration fixture relies on to stay Tier-A-extraction-sufficient.
    expect(
      looksLikeStatementNotInvoice(
        'STATEMENT OF ACCOUNT\nInvoice 12345\nBalance Forward: $0.00\nTotal Amount Due: $150.00',
      ),
    ).toBe(true);
  });

  it('does NOT flag a bare invoice whose only "statement" word is a false cross-reference without a real marker', () => {
    // "statement of charges" is not a statement-of-ACCOUNT marker; a bare mention
    // must not trip the tripwire.
    expect(
      looksLikeStatementNotInvoice('Invoice #900\nStatement of charges below\nTotal: $12.00'),
    ).toBe(false);
  });
});
