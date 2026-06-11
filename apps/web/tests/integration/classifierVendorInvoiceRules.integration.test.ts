// tests/integration/classifierVendorInvoiceRules.integration.test.ts
//
// Phase 7 chunk 7.2 — Task 7.2.11.A: vendorInvoiceRules unit tests.
// Canonical test location per chunk 7.1a/7.1b (ε) banking N=3.
//
// Covers positive matches + negative-pattern rejection + adversarial
// counter-shape fixtures per Step 18 sub-recommendations (i) + (ii).

import { describe, it, expect } from 'vitest';
import { evaluateVendorInvoice } from '@/agent/orchestrator/extraction/classifier/vendorInvoiceRules';
import type { DocumentArtifactRow } from '@/agent/orchestrator/extraction/types';

function artifactWithLines(textLines: string[]): DocumentArtifactRow {
  return {
    engine: 'paddleocr',
    engine_version: 'mock-v1',
    pages: { count: 1 },
    lines: textLines.map((text, idx) => ({
      text,
      bbox: [0, idx * 20, 100, (idx + 1) * 20],
      confidence: 0.95,
    })),
    words: { count: textLines.length * 3 },
    quality_flags: [],
    pipeline_trace: [],
    confidence: 0.95,
  };
}

describe('Phase 7 chunk 7.2 Task 7.2.11.A — vendorInvoiceRules', () => {
  describe('positive patterns', () => {
    it('matches when OCR text contains "Invoice" header', () => {
      const artifact = artifactWithLines([
        'Invoice #12345',
        'Acme Vendor Co.',
        'Total: $123.45',
      ]);
      const result = evaluateVendorInvoice(artifact);
      expect(result.matched).toBe(true);
      if (result.matched) {
        expect(result.documentType).toBe('vendor_invoice');
        expect(result.confidence).toBe(0.9);
      }
    });

    it('matches when OCR text contains "Bill" (but not "Bill to")', () => {
      const artifact = artifactWithLines([
        'Bill from Acme',
        'Date: 2026-01-15',
        'Amount due: $50.00',
      ]);
      const result = evaluateVendorInvoice(artifact);
      expect(result.matched).toBe(true);
    });

    it('matches via filename heuristic alone', () => {
      const artifact = artifactWithLines(['Some unrelated text']);
      const result = evaluateVendorInvoice(artifact, 'vendor_invoice_jan_2026.pdf');
      expect(result.matched).toBe(true);
    });

    it('matches "Tax Invoice"', () => {
      const artifact = artifactWithLines(['Tax Invoice', 'Vendor: Acme']);
      const result = evaluateVendorInvoice(artifact);
      expect(result.matched).toBe(true);
    });
  });

  describe('negative pattern rejection (Step 18 adversarial counter-shape)', () => {
    it('rejects when "Invoice" header co-occurs with receipt-shape footer', () => {
      // Adversarial: positive vendor_invoice pattern + receipt-shape
      // negative pattern. MUST reject per Step 18 sub-recommendation (i).
      const artifact = artifactWithLines([
        'Invoice #99',
        'Total: $50.00',
        'Thank you for your purchase',
        'Auth code: 12345',
      ]);
      const result = evaluateVendorInvoice(artifact);
      expect(result.matched).toBe(false);
    });

    it('rejects when "Invoice" co-occurs with payment-confirmation language', () => {
      const artifact = artifactWithLines([
        'Invoice #99',
        'Payment received',
        'Thank you for your payment',
      ]);
      const result = evaluateVendorInvoice(artifact);
      expect(result.matched).toBe(false);
    });

    it('rejects "Bill to" (which appears on receipts too, not just invoices)', () => {
      const artifact = artifactWithLines([
        'Bill to: Customer',
        'Total: $25.00',
        'Thank you for your purchase',
      ]);
      const result = evaluateVendorInvoice(artifact);
      expect(result.matched).toBe(false);
    });
  });

  describe('no-match cases', () => {
    it('does not match generic text', () => {
      const artifact = artifactWithLines(['Some text', 'with no document indicators']);
      const result = evaluateVendorInvoice(artifact);
      expect(result.matched).toBe(false);
    });

    it('does not match empty OCR text', () => {
      const artifact = artifactWithLines([]);
      const result = evaluateVendorInvoice(artifact);
      expect(result.matched).toBe(false);
    });
  });

  // Phase 8 dedicated-fix-chunk Task 1 — real-OCR recalibration grounded
  // against captured document_artifacts.lines (Session 68). Tier A
  // vendor_invoice must fire on an invoice header/title, NOT on field-label
  // cross-references ("Invoice number", "Bill Number") that appear on
  // receipts/vouchers. Document-kind-defining headers (a "Receipt" title,
  // "PAYMENTS MADE", "Date paid") suppress the over-match.
  describe('real-OCR negative cases (Session 68 calibration)', () => {
    it('does NOT match a receipt that cites an invoice number', () => {
      const artifact = artifactWithLines([
        'Receipt', 'Invoice number', '1SRPQ68M-0001', 'Date paid',
        'November 18, 2025', 'CA$282.24 paid on November 18, 2025',
      ]);
      expect(evaluateVendorInvoice(artifact).matched).toBe(false);
    });

    it('does NOT match a payment voucher that lists a bill number', () => {
      const artifact = artifactWithLines([
        'PAYMENTS MADE', 'Payment#', '517', 'Amount Paid', 'Payment Date',
        'Payment Mode', 'Cash', 'Payment for', 'Bill Number', 'Bill Date',
        'Bill Amount', '1SRPQ68M0001',
      ]);
      expect(evaluateVendorInvoice(artifact).matched).toBe(false);
    });

    it('STILL matches a genuine invoice with an "Invoice" title line', () => {
      const artifact = artifactWithLines([
        'Invoice', 'Invoice number', '1SRPQ68M-0001', 'Date of issue',
        'Bill to', 'CA$282.24 due November 18, 2025',
      ]);
      expect(evaluateVendorInvoice(artifact).matched).toBe(true);
    });
  });
});
