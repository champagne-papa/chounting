// apps/web/src/services/document-platform/scoreComposition.ts
//
// Phase 8 chunk 3 — per-feature scoring composition formula per ADR-0018 §2
// lines 450-475 confidence scoring composition framing.
//
// Deterministic weighted-sum composition of per-feature contributions into
// an aggregate confidence_score ∈ [0, 1]. Same RawFeatureSignals +
// document_type input yields same output (property-test invariant per
// chunk 3 brief Task 3).
//
// Per-document-type weights are document-type-dependent per ADR-0018 §2
// lines 442-449 + 460-465 framing: payment_confirmation's
// authorization_reference (bank-issued canonical identifier reliability)
// carries heavier reference_alignment weight vs receipt's
// authorization_reference (merchant-issued varying reliability);
// vendor_invoice does not carry payment_method_consistency axis (weight = 0;
// not applicable).
//
// V1_PROVISIONAL_WEIGHTS per ADR-0019 §9 fifteen ratified-at-v1-ship
// parameters inheritance + ADR-0018 §2 lines 465-470 implementation-owned-
// at-v1 framing; ADR-0019 calibration cycle governance at post-v1 per
// ADR-0019 §6.

import {
  FEATURE_AXES,
  type FeatureAxis,
  type PerFeatureContribution,
  type ScoredDocumentType,
} from '@/shared/schemas/document-platform/candidate_features.schema';

// Weights sum to 1 per document_type (normalization invariant). Weights ∈ [0, 1].
export const V1_PROVISIONAL_WEIGHTS: Record<
  ScoredDocumentType,
  Record<FeatureAxis, number>
> = {
  vendor_invoice: {
    vendor_match: 0.3,
    amount_match: 0.3,
    date_proximity: 0.15,
    reference_alignment: 0.25,
    payment_method_consistency: 0,
  },
  receipt: {
    vendor_match: 0.25,
    amount_match: 0.25,
    date_proximity: 0.15,
    reference_alignment: 0.2,
    payment_method_consistency: 0.15,
  },
  payment_confirmation: {
    vendor_match: 0.2,
    amount_match: 0.25,
    date_proximity: 0.1,
    reference_alignment: 0.35,
    payment_method_consistency: 0.1,
  },
};

// Raw per-feature signals collected by chunk 2 per-document-type emission
// sites at documentRouterService.completeCandidate. composeScore normalizes
// each axis to [0, 1], applies document_type weight, sums to aggregate.
//
// null match signal indicates feature data unavailable (e.g., extracted
// invoice_number missing); normalized to 0 per axis.
export interface RawFeatureSignals {
  vendor_match_confidence: number;
  vendor_match_raw_value: unknown;
  amount_match: boolean | null;
  amount_raw_value: unknown;
  date_within_window: boolean | null;
  date_raw_value: unknown;
  reference_match: boolean | null;
  reference_raw_value: unknown;
  payment_method_match: boolean | null;
  payment_method_raw_value: unknown;
}

function normalizeFeature(axis: FeatureAxis, signals: RawFeatureSignals): number {
  switch (axis) {
    case 'vendor_match':
      // vendor_match_confidence already ∈ [0, 1] per VendorMatchResultSchema
      // contract; clamp defensively.
      return Math.max(0, Math.min(1, signals.vendor_match_confidence));
    case 'amount_match':
      return signals.amount_match === true ? 1 : 0;
    case 'date_proximity':
      return signals.date_within_window === true ? 1 : 0;
    case 'reference_alignment':
      return signals.reference_match === true ? 1 : 0;
    case 'payment_method_consistency':
      return signals.payment_method_match === true ? 1 : 0;
  }
}

function rawValueForFeature(axis: FeatureAxis, signals: RawFeatureSignals): unknown {
  switch (axis) {
    case 'vendor_match':
      return signals.vendor_match_raw_value;
    case 'amount_match':
      return signals.amount_raw_value;
    case 'date_proximity':
      return signals.date_raw_value;
    case 'reference_alignment':
      return signals.reference_raw_value;
    case 'payment_method_consistency':
      return signals.payment_method_raw_value;
  }
}

export interface ComposeScoreResult {
  features: PerFeatureContribution[];
  aggregate_score: number;
}

export function composeScore(
  signals: RawFeatureSignals,
  documentType: ScoredDocumentType,
): ComposeScoreResult {
  const weights = V1_PROVISIONAL_WEIGHTS[documentType];
  const features: PerFeatureContribution[] = [];
  let aggregate = 0;

  for (const axis of FEATURE_AXES) {
    const normalized_score = normalizeFeature(axis, signals);
    const weight = weights[axis];
    const contribution = normalized_score * weight;
    features.push({
      feature_name: axis,
      raw_value: rawValueForFeature(axis, signals),
      normalized_score,
      weight,
      contribution,
    });
    aggregate += contribution;
  }

  // Clamp to [0, 1] to guard against floating-point drift; weights sum
  // to 1 per normalization invariant so aggregate ∈ [0, 1] exactly modulo
  // floating-point precision.
  return {
    features,
    aggregate_score: Math.max(0, Math.min(1, aggregate)),
  };
}
