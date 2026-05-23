// tests/integration/classifierReceiptRules.integration.test.ts
//
// Phase 7 chunk 7.2 — Task 7.2.11.B: receiptRules unit tests.
// Canonical test location per chunk 7.1a/7.1b (ε) banking N=3.

import { describe, it, expect } from 'vitest';
import { evaluateReceipt } from '@/agent/orchestrator/extraction/classifier/receiptRules';
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

describe('Phase 7 chunk 7.2 Task 7.2.11.B — receiptRules', () => {
  describe('positive patterns', () => {
    it('matches receipt-shape with Total + payment method', () => {
      const artifact = artifactWithLines([
        'Coffee Shop',
        'Subtotal $5.00',
        'Tax $0.50',
        'Total $5.50',
        'Visa ****1234',
      ]);
      const result = evaluateReceipt(artifact);
      expect(result.matched).toBe(true);
      if (result.matched) {
        expect(result.documentType).toBe('receipt');
        expect(result.confidence).toBe(0.85);
      }
    });

    it('matches with filename + one shape signal', () => {
      const artifact = artifactWithLines(['Some store', 'Total $10.00']);
      const result = evaluateReceipt(artifact, 'receipt_jan_2026.pdf');
      expect(result.matched).toBe(true);
    });

    it('matches with "Thank you for your purchase" + Total', () => {
      const artifact = artifactWithLines([
        'Total: $25.00',
        'Cash: $30.00',
        'Change: $5.00',
        'Thank you for your purchase',
      ]);
      const result = evaluateReceipt(artifact);
      expect(result.matched).toBe(true);
    });
  });

  describe('negative pattern rejection', () => {
    it('rejects when receipt-shape signals co-occur with Invoice header', () => {
      const artifact = artifactWithLines([
        'Invoice #99',
        'Subtotal $50.00',
        'Total $55.00',
        'Visa ****1234',
      ]);
      const result = evaluateReceipt(artifact);
      expect(result.matched).toBe(false);
    });

    it('rejects when receipt-shape signals co-occur with payment-confirmation language', () => {
      const artifact = artifactWithLines([
        'Total $25.00',
        'Visa ****1234',
        'Payment received',
        'Thank you for your payment',
      ]);
      const result = evaluateReceipt(artifact);
      expect(result.matched).toBe(false);
    });
  });

  describe('no-match cases', () => {
    it('does not match single weak signal alone', () => {
      // Just "Total" alone — could appear on invoices too. Insufficient.
      const artifact = artifactWithLines(['Some text', 'Total $50.00']);
      const result = evaluateReceipt(artifact);
      expect(result.matched).toBe(false);
    });

    it('does not match empty OCR text', () => {
      const artifact = artifactWithLines([]);
      const result = evaluateReceipt(artifact);
      expect(result.matched).toBe(false);
    });
  });

  // Phase 8 dedicated-fix-chunk Task 2 — real-OCR recalibration. Real
  // online receipts (Figma) carry a "Receipt" title + a payment-on-receipt
  // signal ("Date paid") and CITE their invoice number as a cross-reference.
  // That cross-ref must NOT suppress the receipt (a "Receipt" title is
  // authoritative over an invoice cross-reference). High-precision, low-
  // recall by design — formats this doesn't recognize fall to Tier C.
  describe('real-OCR positive cases (Session 68 calibration)', () => {
    it('matches a Figma receipt that cites its invoice number', () => {
      const artifact = artifactWithLines([
        'Receipt', 'Invoice number', '1SRPQ68M-0001', 'Date paid',
        'CA$282.24 paid on November 18, 2025',
      ]);
      const result = evaluateReceipt(artifact);
      expect(result.matched).toBe(true);
      if (result.matched) {
        expect(result.documentType).toBe('receipt');
        expect(result.confidence).toBe(0.85);
      }
    });

    it('does NOT grant the receipt-title carve-out without a paid signal', () => {
      // A bare "Receipt" title with an invoice cross-ref but no payment-on-
      // receipt signal and no receipt-shape signals stays no-match → Tier C.
      const artifact = artifactWithLines([
        'Receipt', 'Invoice number', '1SRPQ68M-0001',
      ]);
      const result = evaluateReceipt(artifact);
      expect(result.matched).toBe(false);
    });
  });
});
