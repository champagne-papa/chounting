// tests/unit/vendorInvoiceVendorNameTierA.test.ts
//
// Wave 6 D1 T4 (unit) — Tier-A vendor_name extraction behavior + the Tier-C
// prompt-content pin. Fixture-offline per the eval-teeth convention
// (docs/04_engineering/conventions/testing.md "Fixture-offline eval-suite
// teeth"): runAiExtractFallback (the Tier-C live-AI entrypoint) and adminClient
// (the RLS-bypassing read) are mocked to THROW, so the suite passing proves it
// touched neither; the sync-return assertion proves the deterministic Tier-A
// path was taken.

import { describe, it, expect, vi } from 'vitest';

vi.mock('@/agent/orchestrator/extraction/aiFallbackExtractorBase', () => ({
  runAiExtractFallback: () => {
    throw new Error('Wave 6 D1 T4: the Tier-A unit must NOT reach the Tier-C (live-AI) path');
  },
}));
vi.mock('@/db/adminClient', () => ({
  adminClient: () => {
    throw new Error('Wave 6 D1 T4: the Tier-A unit must NOT open an adminClient path');
  },
}));

import {
  extractVendorInvoiceFieldsTierA,
  SYSTEM_PROMPT_CONTENT,
} from '@/agent/orchestrator/extraction/vendorInvoiceExtractor';

describe('Wave 6 D1 — Tier-A vendor_name extraction (precision-biased)', () => {
  // (a) sender-side labels → vendor_name extracted.
  it.each([
    ['Vendor', 'Vendor: Acme Supplies Inc.\nInvoice #: 1001\nTotal: $500.00'],
    ['Supplier', 'Supplier: Beta Trading Co\nInvoice No 7\n'],
    ['Remit To', 'Remit To: Gamma Logistics Ltd\nAmount Due: 90.00\n'],
    ['Bill From', 'Bill From: Delta Services\n'],
    ['Sold By', 'Sold By: Epsilon Hardware\n'],
  ])('(a) extracts vendor_name from a "%s" sender label', (_label, ocr) => {
    const fields = extractVendorInvoiceFieldsTierA(ocr);
    expect(fields.vendor_name).toBeDefined();
    expect(fields.vendor_name!.length).toBeGreaterThan(1);
  });

  it('(a) captures the exact sender name following the label', () => {
    const fields = extractVendorInvoiceFieldsTierA(
      'Vendor: Acme Supplies Inc.\nInvoice #: 1001',
    );
    expect(fields.vendor_name).toBe('Acme Supplies Inc.');
  });

  // (b) THE SAFETY PROPERTY: customer-side blocks are never captured — the
  // class that would otherwise produce a confident WRONG match.
  it.each([
    ['Bill To', 'Bill To: My Company LLC\nInvoice #: 1001\nTotal: $500.00'],
    ['Ship To', 'Ship To: My Company LLC\n123 Main St\n'],
    ['Sold To', 'Sold To: My Company LLC\n'],
  ])('(b) does NOT capture the customer-side "%s" block', (_label, ocr) => {
    const fields = extractVendorInvoiceFieldsTierA(ocr);
    expect(fields.vendor_name).toBeUndefined();
  });

  it('(b) no sender label at all → vendor_name absent (safe → needs_review via D2)', () => {
    const fields = extractVendorInvoiceFieldsTierA(
      'ACME SUPPLIES INC.\n123 Main St\nInvoice #: 1001\nTotal: $500.00',
    );
    expect(fields.vendor_name).toBeUndefined();
  });

  // (c) over-match guard.
  it('(c) guard rejects a date capture', () => {
    expect(extractVendorInvoiceFieldsTierA('Vendor: 2026-01-15\n').vendor_name).toBeUndefined();
  });
  it('(c) guard rejects an exact doc-type-word capture', () => {
    expect(extractVendorInvoiceFieldsTierA('Vendor: Invoice\n').vendor_name).toBeUndefined();
  });
  it('(c) guard does NOT false-reject a real vendor leading with a doc-type word', () => {
    expect(extractVendorInvoiceFieldsTierA("Vendor: Bill's Plumbing\n").vendor_name).toBe(
      "Bill's Plumbing",
    );
  });

  // eval-teeth sync-return discriminant: the Tier-A entrypoint is synchronous
  // (the Tier-C path is async) — proves the no-AI deterministic path was taken.
  it('returns synchronously (no live-AI path)', () => {
    const r = extractVendorInvoiceFieldsTierA('Vendor: Acme\n');
    expect((r as unknown) instanceof Promise).toBe(false);
  });
});

describe('Wave 6 D1 — Tier-C prompt requests vendor_name (T3 pin, fixture-offline)', () => {
  it('emits vendor_name, steers sender-not-customer, keeps vendor_id prohibited', () => {
    expect(SYSTEM_PROMPT_CONTENT).toContain('"vendor_name"');
    expect(SYSTEM_PROMPT_CONTENT).toContain('NOT the bill-to');
    expect(SYSTEM_PROMPT_CONTENT).toContain('Do NOT include vendor_id');
  });
});
