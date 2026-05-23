// tests/integration/classifierPaymentConfirmationRules.integration.test.ts
//
// Phase 7 chunk 7.2 — Task 7.2.11.C: paymentConfirmationRules unit tests.
// Canonical test location per chunk 7.1a/7.1b (ε) banking N=3.

import { describe, it, expect } from 'vitest';
import { evaluatePaymentConfirmation } from '@/agent/orchestrator/extraction/classifier/paymentConfirmationRules';
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

describe('Phase 7 chunk 7.2 Task 7.2.11.C — paymentConfirmationRules', () => {
  describe('positive patterns', () => {
    it('matches "Payment received"', () => {
      const artifact = artifactWithLines([
        'Payment received',
        'Confirmation number: ABC123',
        'Amount: $100.00',
      ]);
      const result = evaluatePaymentConfirmation(artifact);
      expect(result.matched).toBe(true);
      if (result.matched) {
        expect(result.documentType).toBe('payment_confirmation');
        expect(result.confidence).toBe(0.9);
      }
    });

    it('matches "Thank you for your payment"', () => {
      const artifact = artifactWithLines([
        'Thank you for your payment',
        'Transaction reference: TXN-456',
      ]);
      const result = evaluatePaymentConfirmation(artifact);
      expect(result.matched).toBe(true);
    });

    it('matches via filename heuristic alone', () => {
      const artifact = artifactWithLines(['Some text']);
      const result = evaluatePaymentConfirmation(artifact, 'payment_confirmation.pdf');
      expect(result.matched).toBe(true);
    });
  });

  describe('negative pattern rejection', () => {
    it('rejects when payment-confirmation language co-occurs with Invoice header', () => {
      const artifact = artifactWithLines([
        'Invoice #99',
        'Payment received', // This is suspicious — invoice + payment language
      ]);
      const result = evaluatePaymentConfirmation(artifact);
      expect(result.matched).toBe(false);
    });

    it('rejects when payment-confirmation language co-occurs with merchant copy', () => {
      const artifact = artifactWithLines([
        'Payment received',
        'Merchant copy', // Receipt-shape indicator
      ]);
      const result = evaluatePaymentConfirmation(artifact);
      expect(result.matched).toBe(false);
    });
  });

  describe('no-match cases', () => {
    it('does not match generic text', () => {
      const artifact = artifactWithLines(['Random text', 'No payment language']);
      const result = evaluatePaymentConfirmation(artifact);
      expect(result.matched).toBe(false);
    });

    it('does not match empty OCR text', () => {
      const artifact = artifactWithLines([]);
      const result = evaluatePaymentConfirmation(artifact);
      expect(result.matched).toBe(false);
    });
  });

  // Phase 8 dedicated-fix-chunk Task 3 — real-OCR recalibration. Real
  // payment vouchers (Zoho) carry a "PAYMENTS MADE" header + voucher-field
  // vocabulary ("Amount Paid", "Payment Date/Mode") and list a "Bill
  // Number" cross-reference. The legacy positives wanted "payment
  // received/processed/confirmation" (absent on a voucher), so the voucher
  // under-matched. High-precision voucher-header positives recognize it.
  describe('real-OCR positive cases (Session 68 calibration)', () => {
    it('matches a Zoho payment voucher with a "PAYMENTS MADE" header', () => {
      const artifact = artifactWithLines([
        'PAYMENTS MADE', 'Payment#', '517', 'Amount Paid', 'Payment Date',
        'Payment Mode', 'Cash', 'Payment for', 'Bill Number', 'Bill Date',
        'Bill Amount', '1SRPQ68M0001',
      ]);
      const result = evaluatePaymentConfirmation(artifact);
      expect(result.matched).toBe(true);
      if (result.matched) {
        expect(result.documentType).toBe('payment_confirmation');
        expect(result.confidence).toBe(0.9);
      }
    });
  });
});
