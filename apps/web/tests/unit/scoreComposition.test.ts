// tests/unit/scoreComposition.test.ts
//
// Phase 8 chunk 3 — pure-function tests of composeScore + V1_PROVISIONAL_WEIGHTS
// at apps/web/src/core/document-platform/scoreComposition.ts.
//
// Test coverage per chunk 3 brief Task 3:
//   - Per-document-type weight allocation matches V1_PROVISIONAL_WEIGHTS
//   - Aggregate confidence_score ∈ [0, 1] normalization invariant
//   - Weights sum to 1 per document_type (normalization invariant)
//   - Deterministic composition (same input → same output)
//   - Per-feature contributions emission across 5 canonical axes
//   - Boundary cases: all-zero contributions → 0; all-perfect → bounded
//
// Integration-grade per-document-type emission tests through completeCandidate
// live at tests/integration/documentRouterService.integration.test.ts.

import { describe, it, expect } from 'vitest';
import {
  composeScore,
  V1_PROVISIONAL_WEIGHTS,
  type RawFeatureSignals,
} from '@/core/document-platform/scoreComposition';
import { FEATURE_AXES } from '@/shared/schemas/document-platform/candidate_features.schema';

const ALL_NULL_SIGNALS: RawFeatureSignals = {
  vendor_match_confidence: 0,
  vendor_match_raw_value: null,
  amount_match: null,
  amount_raw_value: null,
  date_within_window: null,
  date_raw_value: null,
  reference_match: null,
  reference_raw_value: null,
  payment_method_match: null,
  payment_method_raw_value: null,
};

function allMatchSignals(vendorConfidence = 1): RawFeatureSignals {
  return {
    vendor_match_confidence: vendorConfidence,
    vendor_match_raw_value: { confidence: vendorConfidence },
    amount_match: true,
    amount_raw_value: { match: true },
    date_within_window: true,
    date_raw_value: { within_window_14d: true },
    reference_match: true,
    reference_raw_value: { match: true },
    payment_method_match: true,
    payment_method_raw_value: { match: true },
  };
}

describe('V1_PROVISIONAL_WEIGHTS — per-document-type weight allocation', () => {
  it('vendor_invoice weights sum to 1', () => {
    const w = V1_PROVISIONAL_WEIGHTS.vendor_invoice;
    const sum = w.vendor_match + w.amount_match + w.date_proximity + w.reference_alignment + w.payment_method_consistency;
    expect(sum).toBeCloseTo(1, 10);
  });

  it('receipt weights sum to 1', () => {
    const w = V1_PROVISIONAL_WEIGHTS.receipt;
    const sum = w.vendor_match + w.amount_match + w.date_proximity + w.reference_alignment + w.payment_method_consistency;
    expect(sum).toBeCloseTo(1, 10);
  });

  it('payment_confirmation weights sum to 1', () => {
    const w = V1_PROVISIONAL_WEIGHTS.payment_confirmation;
    const sum = w.vendor_match + w.amount_match + w.date_proximity + w.reference_alignment + w.payment_method_consistency;
    expect(sum).toBeCloseTo(1, 10);
  });

  it('vendor_invoice has payment_method_consistency weight = 0 (not applicable axis)', () => {
    expect(V1_PROVISIONAL_WEIGHTS.vendor_invoice.payment_method_consistency).toBe(0);
  });

  it('payment_confirmation has heavier reference_alignment weight (0.35) than receipt (0.20) per ADR-0018 §2 lines 442-449', () => {
    expect(V1_PROVISIONAL_WEIGHTS.payment_confirmation.reference_alignment).toBeGreaterThan(
      V1_PROVISIONAL_WEIGHTS.receipt.reference_alignment,
    );
  });

  it('all weights ∈ [0, 1]', () => {
    for (const docType of ['vendor_invoice', 'receipt', 'payment_confirmation'] as const) {
      const weights = V1_PROVISIONAL_WEIGHTS[docType];
      for (const axis of FEATURE_AXES) {
        expect(weights[axis]).toBeGreaterThanOrEqual(0);
        expect(weights[axis]).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('composeScore — aggregate confidence_score normalization invariant', () => {
  it('all-null signals → aggregate_score = 0', () => {
    const result = composeScore(ALL_NULL_SIGNALS, 'vendor_invoice');
    expect(result.aggregate_score).toBe(0);
  });

  it('all-match signals with vendor_confidence=1 → aggregate_score = 1 (vendor_invoice)', () => {
    const result = composeScore(allMatchSignals(1), 'vendor_invoice');
    expect(result.aggregate_score).toBeCloseTo(1, 10);
  });

  it('all-match signals with vendor_confidence=1 → aggregate_score = 1 (receipt)', () => {
    const result = composeScore(allMatchSignals(1), 'receipt');
    expect(result.aggregate_score).toBeCloseTo(1, 10);
  });

  it('all-match signals with vendor_confidence=1 → aggregate_score = 1 (payment_confirmation)', () => {
    const result = composeScore(allMatchSignals(1), 'payment_confirmation');
    expect(result.aggregate_score).toBeCloseTo(1, 10);
  });

  it('aggregate_score ∈ [0, 1] across all signal combinations', () => {
    const cases: RawFeatureSignals[] = [
      ALL_NULL_SIGNALS,
      allMatchSignals(1),
      allMatchSignals(0.5),
      { ...allMatchSignals(1), amount_match: false, reference_match: false },
      { ...allMatchSignals(0.7), date_within_window: null },
    ];
    for (const signals of cases) {
      for (const docType of ['vendor_invoice', 'receipt', 'payment_confirmation'] as const) {
        const result = composeScore(signals, docType);
        expect(result.aggregate_score).toBeGreaterThanOrEqual(0);
        expect(result.aggregate_score).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('composeScore — deterministic composition (same input → same output)', () => {
  it('identical signals + documentType yield identical aggregate_score across invocations', () => {
    const signals = allMatchSignals(0.85);
    const a = composeScore(signals, 'receipt');
    const b = composeScore(signals, 'receipt');
    expect(b.aggregate_score).toBe(a.aggregate_score);
    expect(b.features.length).toBe(a.features.length);
    for (let i = 0; i < a.features.length; i++) {
      expect(b.features[i].normalized_score).toBe(a.features[i].normalized_score);
      expect(b.features[i].weight).toBe(a.features[i].weight);
      expect(b.features[i].contribution).toBe(a.features[i].contribution);
    }
  });
});

describe('composeScore — per-feature contribution emission', () => {
  it('emits exactly 5 per-feature records across canonical FEATURE_AXES enumeration', () => {
    const result = composeScore(allMatchSignals(1), 'vendor_invoice');
    expect(result.features).toHaveLength(5);
    const axes = result.features.map((f) => f.feature_name).sort();
    expect(axes).toEqual([...FEATURE_AXES].sort());
  });

  it('per-feature contribution = normalized_score * weight (invariant per record)', () => {
    const result = composeScore(allMatchSignals(0.8), 'receipt');
    for (const feature of result.features) {
      expect(feature.contribution).toBeCloseTo(feature.normalized_score * feature.weight, 10);
    }
  });

  it('aggregate_score equals sum of per-feature contributions (normalization invariant)', () => {
    const result = composeScore(allMatchSignals(0.7), 'payment_confirmation');
    const contributionSum = result.features.reduce((acc, f) => acc + f.contribution, 0);
    expect(result.aggregate_score).toBeCloseTo(contributionSum, 10);
  });

  it('vendor_match normalized_score equals vendor_match_confidence input', () => {
    const result = composeScore(allMatchSignals(0.6), 'vendor_invoice');
    const vendor = result.features.find((f) => f.feature_name === 'vendor_match');
    expect(vendor?.normalized_score).toBe(0.6);
  });

  it('boolean axes (amount_match, date_proximity, reference_alignment, payment_method_consistency) normalize to 1 on true / 0 on false / 0 on null', () => {
    const trueResult = composeScore(allMatchSignals(0), 'receipt');
    for (const axis of ['amount_match', 'date_proximity', 'reference_alignment', 'payment_method_consistency'] as const) {
      expect(trueResult.features.find((f) => f.feature_name === axis)?.normalized_score).toBe(1);
    }
    const falseResult = composeScore(
      {
        ...ALL_NULL_SIGNALS,
        amount_match: false,
        date_within_window: false,
        reference_match: false,
        payment_method_match: false,
      },
      'receipt',
    );
    for (const axis of ['amount_match', 'date_proximity', 'reference_alignment', 'payment_method_consistency'] as const) {
      expect(falseResult.features.find((f) => f.feature_name === axis)?.normalized_score).toBe(0);
    }
    const nullResult = composeScore(ALL_NULL_SIGNALS, 'receipt');
    for (const axis of ['amount_match', 'date_proximity', 'reference_alignment', 'payment_method_consistency'] as const) {
      expect(nullResult.features.find((f) => f.feature_name === axis)?.normalized_score).toBe(0);
    }
  });

  it('vendor_invoice payment_method_consistency contribution = 0 (weight = 0 for vendor_invoice)', () => {
    const result = composeScore(allMatchSignals(1), 'vendor_invoice');
    const paymentMethod = result.features.find(
      (f) => f.feature_name === 'payment_method_consistency',
    );
    expect(paymentMethod?.weight).toBe(0);
    expect(paymentMethod?.contribution).toBe(0);
  });
});

describe('composeScore — vendor_match_confidence boundary handling', () => {
  it('vendor_match_confidence > 1 clamped to 1 in normalized_score', () => {
    const signals: RawFeatureSignals = { ...ALL_NULL_SIGNALS, vendor_match_confidence: 1.5 };
    const result = composeScore(signals, 'vendor_invoice');
    const vendor = result.features.find((f) => f.feature_name === 'vendor_match');
    expect(vendor?.normalized_score).toBe(1);
  });

  it('vendor_match_confidence < 0 clamped to 0 in normalized_score', () => {
    const signals: RawFeatureSignals = { ...ALL_NULL_SIGNALS, vendor_match_confidence: -0.3 };
    const result = composeScore(signals, 'vendor_invoice');
    const vendor = result.features.find((f) => f.feature_name === 'vendor_match');
    expect(vendor?.normalized_score).toBe(0);
  });
});

describe('composeScore — raw_value preservation per feature record', () => {
  it('raw_value preserved from signals payload per axis', () => {
    const signals: RawFeatureSignals = {
      vendor_match_confidence: 0.9,
      vendor_match_raw_value: { match_type: 'exact_name', confidence: 0.9 },
      amount_match: true,
      amount_raw_value: { extracted: 1000, candidate: 1000, diff_cad: 0 },
      date_within_window: true,
      date_raw_value: { extracted: '2026-05-13', candidate: '2026-05-13', proximity_days: 0 },
      reference_match: true,
      reference_raw_value: { extracted: 'AUTH-1', candidate: 'AUTH-1' },
      payment_method_match: false,
      payment_method_raw_value: { extracted: 'wire', candidate: 'check' },
    };
    const result = composeScore(signals, 'receipt');
    expect(result.features.find((f) => f.feature_name === 'vendor_match')?.raw_value).toEqual({
      match_type: 'exact_name',
      confidence: 0.9,
    });
    expect(result.features.find((f) => f.feature_name === 'amount_match')?.raw_value).toEqual({
      extracted: 1000,
      candidate: 1000,
      diff_cad: 0,
    });
    expect(
      result.features.find((f) => f.feature_name === 'payment_method_consistency')?.raw_value,
    ).toEqual({ extracted: 'wire', candidate: 'check' });
  });
});
