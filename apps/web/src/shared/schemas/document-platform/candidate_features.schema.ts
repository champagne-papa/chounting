// apps/web/src/shared/schemas/document-platform/candidate_features.schema.ts
//
// Phase 8 chunk 3 — per-feature scoring composition schema per ADR-0018
// §2 lines 450-475 confidence scoring composition framing + lines 472-475
// feature vector recording framing.
//
// Captures the structured shape that documentRouterService.completeCandidate
// (Subsystem 1) writes into candidate_features JSONB column. Each per-feature
// record carries raw_value (input data the feature extracted from) +
// normalized_score (per-axis confidence ∈ [0, 1]) + weight (per-document-type
// weight) + contribution (normalized_score * weight; sum across features =
// aggregate_score).
//
// Five canonical feature axes:
//   - vendor_match — vendor identity match (carried via vendor_match.confidence)
//   - amount_match — extracted amount vs candidate entity amount
//   - date_proximity — extracted date vs candidate entity date
//   - reference_alignment — bill_number (vendor_invoice) /
//     authorization_reference (receipt + payment_confirmation) match
//   - payment_method_consistency — extracted payment_method vs candidate
//     payment_method (receipt + payment_confirmation; weight = 0 for
//     vendor_invoice)
//
// Per-document-type weight allocation lives in scoreComposition.ts
// (V1_PROVISIONAL_WEIGHTS); chunk 3 ships provisional values per ADR-0019
// §9 fifteen ratified-at-v1-ship parameters; calibration cycle governance
// at post-v1 per ADR-0019 §6.
//
// linked_entity_type uses canonical LinkedEntityTypeSchema (8 values at
// HEAD per Phase 5.1 chunk 5.1a ratification). Reserved post-v1 pair
// emission (vendor_credit / vendor_credit_application × any link_role)
// structurally prevented at documentRouterService.completeCandidate output
// emission boundary via VALID_PAIRS-based pair-validity assertion (chunk 2
// Task 4 substrate per Session 59 amendment §B.1 Path β preliminary
// recommendation inheritance). Chunk 3 schema mirrors Path β by referencing
// canonical LinkedEntityTypeSchema rather than introducing a chunk-3-local
// 6-value subset (avoids substrate drift at future ADR-0016 amendment
// cycles per Sub-Q3 β substrate-tables-only-without-cell-activation
// discipline).
//
// document_type narrows to v1-active triplet (vendor_invoice + receipt +
// payment_confirmation); 'unknown' short-circuits at completeCandidate
// entry per ADR-0018 §item 2 and never produces candidate_features rows.

import { z } from 'zod';
import { LinkedEntityTypeSchema } from '@/shared/schemas/document-platform/sourceDocumentLink.schema';

export const FeatureAxisSchema = z.enum([
  'vendor_match',
  'amount_match',
  'date_proximity',
  'reference_alignment',
  'payment_method_consistency',
]);
export type FeatureAxis = z.infer<typeof FeatureAxisSchema>;

export const FEATURE_AXES: readonly FeatureAxis[] = [
  'vendor_match',
  'amount_match',
  'date_proximity',
  'reference_alignment',
  'payment_method_consistency',
] as const;

// Subsystem 1 ships candidates only for the v1-active document_type
// triplet; 'unknown' short-circuits at completeCandidate entry.
export const ScoredDocumentTypeSchema = z.enum([
  'vendor_invoice',
  'receipt',
  'payment_confirmation',
]);
export type ScoredDocumentType = z.infer<typeof ScoredDocumentTypeSchema>;

export const PerFeatureContributionSchema = z
  .object({
    feature_name: FeatureAxisSchema,
    raw_value: z.unknown(),
    normalized_score: z.number().min(0).max(1),
    weight: z.number().min(0).max(1),
    contribution: z.number().min(0).max(1),
  })
  .strict();
export type PerFeatureContribution = z.infer<typeof PerFeatureContributionSchema>;

// candidate_features JSONB shape per Subsystem 1 emission per chunk 3.
//
// Top-level structured fields (canonical at chunk 3):
//   - features: per-feature contribution records (5 canonical axes per
//     FEATURE_AXES enumeration; one record per axis)
//   - aggregate_score: weighted sum of contributions ∈ [0, 1] (normalization
//     invariant: equals sum of features[*].contribution)
//   - document_type: v1-active triplet narrowing
//   - linked_entity_type: LinkedEntityTypeSchema 8-value enum; reserved
//     post-v1 pair emission prevented at output emission boundary via
//     VALID_PAIRS pair-validity assertion (chunk 2 Task 4 substrate)
//
// Forensic context (optional; preserved for rematchCandidate
// reconstruction surface inheritance from chunk 2 baseFeatures):
//   - classification_confidence: per ADR-0014 §11 incomplete-candidate
//     handoff payload
//   - scenario: per-document-type scenario tag (receipt +
//     payment_confirmation branches emit this; vendor_invoice does not)
export const CandidateFeaturesSchema = z
  .object({
    features: z.array(PerFeatureContributionSchema),
    aggregate_score: z.number().min(0).max(1),
    document_type: ScoredDocumentTypeSchema,
    linked_entity_type: LinkedEntityTypeSchema,
    classification_confidence: z.number().min(0).max(1).optional(),
    scenario: z.string().optional(),
  })
  .strict();
export type CandidateFeatures = z.infer<typeof CandidateFeaturesSchema>;
