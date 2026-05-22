// tests/unit/candidateFeaturesSchema.test.ts
//
// Phase 8 chunk 3 — CandidateFeaturesSchema + PerFeatureContributionSchema
// Zod schema validation tests per chunk 3 brief Task 4.
//
// Test coverage:
//   - Well-formed input acceptance (canonical document_type triplet + 5 axes)
//   - Malformed input rejection (.strict() extra-field + missing-field + out-of-range)
//   - Document_type narrowing (ScoredDocumentTypeSchema; rejects 'unknown')
//   - FeatureAxis enumeration coverage (5 canonical axes accepted)
//   - linked_entity_type accepts canonical LinkedEntityTypeSchema 8 values per
//     HEAD substrate (Phase 5.1 chunk 5.1a ratification); reserved post-v1
//     pair emission prevented at Subsystem 1 output boundary via VALID_PAIRS
//     assertion (chunk 2 Task 4 substrate), NOT at schema validation grade
//     per Session 61 chunk 3 impl Path β preliminary recommendation
//     inheritance from chunk 2 amendment §B.1.

import { describe, it, expect } from 'vitest';
import {
  CandidateFeaturesSchema,
  PerFeatureContributionSchema,
  FeatureAxisSchema,
  ScoredDocumentTypeSchema,
  FEATURE_AXES,
} from '@/shared/schemas/document-platform/candidate_features.schema';

const VALID_FEATURE = {
  feature_name: 'vendor_match' as const,
  raw_value: { confidence: 0.95 },
  normalized_score: 0.95,
  weight: 0.3,
  contribution: 0.285,
};

const VALID_FEATURES = FEATURE_AXES.map((axis) => ({
  feature_name: axis,
  raw_value: null,
  normalized_score: 0.5,
  weight: 0.2,
  contribution: 0.1,
}));

const VALID_CANDIDATE_FEATURES = {
  features: VALID_FEATURES,
  aggregate_score: 0.5,
  document_type: 'vendor_invoice' as const,
  linked_entity_type: 'bill' as const,
};

describe('FeatureAxisSchema — 5 canonical axes enumeration', () => {
  it('accepts all 5 canonical FEATURE_AXES values', () => {
    for (const axis of FEATURE_AXES) {
      expect(FeatureAxisSchema.safeParse(axis).success).toBe(true);
    }
  });

  it('rejects unknown feature_name values', () => {
    expect(FeatureAxisSchema.safeParse('unknown_axis').success).toBe(false);
    expect(FeatureAxisSchema.safeParse('vendor_id_match').success).toBe(false);
  });
});

describe('ScoredDocumentTypeSchema — v1-active triplet narrowing', () => {
  it('accepts vendor_invoice + receipt + payment_confirmation', () => {
    expect(ScoredDocumentTypeSchema.safeParse('vendor_invoice').success).toBe(true);
    expect(ScoredDocumentTypeSchema.safeParse('receipt').success).toBe(true);
    expect(ScoredDocumentTypeSchema.safeParse('payment_confirmation').success).toBe(true);
  });

  it('rejects unknown document_type (Subsystem 1 short-circuits before reaching schema)', () => {
    expect(ScoredDocumentTypeSchema.safeParse('unknown').success).toBe(false);
  });

  it('rejects arbitrary string values', () => {
    expect(ScoredDocumentTypeSchema.safeParse('invoice').success).toBe(false);
    expect(ScoredDocumentTypeSchema.safeParse('').success).toBe(false);
  });
});

describe('PerFeatureContributionSchema — well-formed input', () => {
  it('accepts canonical feature record', () => {
    expect(PerFeatureContributionSchema.safeParse(VALID_FEATURE).success).toBe(true);
  });

  it('accepts raw_value of any shape (z.unknown)', () => {
    const variants = [
      { ...VALID_FEATURE, raw_value: null },
      { ...VALID_FEATURE, raw_value: 'string' },
      { ...VALID_FEATURE, raw_value: 42 },
      { ...VALID_FEATURE, raw_value: { nested: { object: true } } },
      { ...VALID_FEATURE, raw_value: [1, 2, 3] },
    ];
    for (const v of variants) {
      expect(PerFeatureContributionSchema.safeParse(v).success).toBe(true);
    }
  });
});

describe('PerFeatureContributionSchema — malformed input rejection', () => {
  it('rejects missing required field (feature_name)', () => {
    const { feature_name: _omit, ...rest } = VALID_FEATURE;
    void _omit;
    expect(PerFeatureContributionSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects normalized_score < 0', () => {
    expect(
      PerFeatureContributionSchema.safeParse({ ...VALID_FEATURE, normalized_score: -0.1 }).success,
    ).toBe(false);
  });

  it('rejects normalized_score > 1', () => {
    expect(
      PerFeatureContributionSchema.safeParse({ ...VALID_FEATURE, normalized_score: 1.5 }).success,
    ).toBe(false);
  });

  it('rejects weight < 0 or > 1', () => {
    expect(
      PerFeatureContributionSchema.safeParse({ ...VALID_FEATURE, weight: -0.1 }).success,
    ).toBe(false);
    expect(
      PerFeatureContributionSchema.safeParse({ ...VALID_FEATURE, weight: 1.5 }).success,
    ).toBe(false);
  });

  it('rejects contribution out of [0, 1]', () => {
    expect(
      PerFeatureContributionSchema.safeParse({ ...VALID_FEATURE, contribution: -0.05 }).success,
    ).toBe(false);
    expect(
      PerFeatureContributionSchema.safeParse({ ...VALID_FEATURE, contribution: 1.5 }).success,
    ).toBe(false);
  });

  it('rejects extra fields per .strict()', () => {
    expect(
      PerFeatureContributionSchema.safeParse({ ...VALID_FEATURE, extra_field: 'oops' }).success,
    ).toBe(false);
  });

  it('rejects invalid feature_name', () => {
    expect(
      PerFeatureContributionSchema.safeParse({ ...VALID_FEATURE, feature_name: 'bogus' }).success,
    ).toBe(false);
  });
});

describe('CandidateFeaturesSchema — well-formed input', () => {
  it('accepts canonical candidate_features shape', () => {
    expect(CandidateFeaturesSchema.safeParse(VALID_CANDIDATE_FEATURES).success).toBe(true);
  });

  it('accepts all 3 v1-active document_type values', () => {
    for (const docType of ['vendor_invoice', 'receipt', 'payment_confirmation'] as const) {
      expect(
        CandidateFeaturesSchema.safeParse({ ...VALID_CANDIDATE_FEATURES, document_type: docType })
          .success,
      ).toBe(true);
    }
  });

  it('accepts optional classification_confidence + scenario fields', () => {
    expect(
      CandidateFeaturesSchema.safeParse({
        ...VALID_CANDIDATE_FEATURES,
        classification_confidence: 0.9,
        scenario: 'receipt_to_payment',
      }).success,
    ).toBe(true);
  });

  it('accepts empty features array (composeScore boundary case for hypothetical zero-axis schema)', () => {
    expect(
      CandidateFeaturesSchema.safeParse({ ...VALID_CANDIDATE_FEATURES, features: [] }).success,
    ).toBe(true);
  });

  it('accepts canonical LinkedEntityTypeSchema 8-value enum per HEAD substrate (Phase 5.1 chunk 5.1a)', () => {
    const v1Active = [
      'bill',
      'bill_line',
      'payment',
      'bill_payment_allocation',
      'vendor_prepayment',
      'vendor_prepayment_application',
    ] as const;
    for (const let_ of v1Active) {
      expect(
        CandidateFeaturesSchema.safeParse({ ...VALID_CANDIDATE_FEATURES, linked_entity_type: let_ })
          .success,
      ).toBe(true);
    }
  });
});

describe('CandidateFeaturesSchema — malformed input rejection', () => {
  it('rejects missing features array', () => {
    const { features: _omit, ...rest } = VALID_CANDIDATE_FEATURES;
    void _omit;
    expect(CandidateFeaturesSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects missing aggregate_score', () => {
    const { aggregate_score: _omit, ...rest } = VALID_CANDIDATE_FEATURES;
    void _omit;
    expect(CandidateFeaturesSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects missing document_type', () => {
    const { document_type: _omit, ...rest } = VALID_CANDIDATE_FEATURES;
    void _omit;
    expect(CandidateFeaturesSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects missing linked_entity_type', () => {
    const { linked_entity_type: _omit, ...rest } = VALID_CANDIDATE_FEATURES;
    void _omit;
    expect(CandidateFeaturesSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects document_type=unknown (ScoredDocumentTypeSchema narrowing)', () => {
    expect(
      CandidateFeaturesSchema.safeParse({ ...VALID_CANDIDATE_FEATURES, document_type: 'unknown' })
        .success,
    ).toBe(false);
  });

  it('rejects aggregate_score < 0', () => {
    expect(
      CandidateFeaturesSchema.safeParse({ ...VALID_CANDIDATE_FEATURES, aggregate_score: -0.05 })
        .success,
    ).toBe(false);
  });

  it('rejects aggregate_score > 1', () => {
    expect(
      CandidateFeaturesSchema.safeParse({ ...VALID_CANDIDATE_FEATURES, aggregate_score: 1.5 })
        .success,
    ).toBe(false);
  });

  it('rejects extra fields per .strict()', () => {
    expect(
      CandidateFeaturesSchema.safeParse({
        ...VALID_CANDIDATE_FEATURES,
        extra_forensic_field: 'bypass',
      }).success,
    ).toBe(false);
  });

  it('rejects invalid feature record in features array', () => {
    expect(
      CandidateFeaturesSchema.safeParse({
        ...VALID_CANDIDATE_FEATURES,
        features: [{ ...VALID_FEATURE, normalized_score: 2 }],
      }).success,
    ).toBe(false);
  });
});
