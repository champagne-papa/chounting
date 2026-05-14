// tests/unit/documentRouterServiceSchemas.test.ts
//
// Phase 4 chunk 2 — unit schema tests for Subsystem 2 schemas.
// Chunk-1 deliberate divergence rationale fires again (schema-defense-
// on-internally-constructed-values discriminator): RouterDecision and
// DecisionRecordBeforeState are entirely service-constructed (no
// external-input path); the .refine() iff-constraints fire on
// internally-constructed values; integration tests can't easily
// exercise the iff-violations through normal service calls — unit
// schema tests are the natural test surface.

import { describe, it, expect } from 'vitest';
import {
  ResolveCandidatesInputSchema,
  RouterDecisionSchema,
  DecisionRecordBeforeStateSchema,
} from '@/shared/schemas/document-platform/documentRelationshipCandidate.schema';
import { ExceptionReasonSchema } from '@/shared/schemas/document-platform/exceptionQueueEntry.schema';

const UUID = '00000000-0000-0000-0000-000000000001';
const UUID2 = '00000000-0000-0000-0000-000000000002';
const UUID3 = '00000000-0000-0000-0000-000000000003';

describe('ResolveCandidatesInputSchema — parse edges', () => {
  it('valid input with document_case_id + trace_id accepted', () => {
    const parsed = ResolveCandidatesInputSchema.safeParse({
      document_case_id: UUID,
      trace_id: UUID2,
    });
    expect(parsed.success).toBe(true);
  });

  it('missing trace_id rejected; invalid uuid rejected', () => {
    expect(
      ResolveCandidatesInputSchema.safeParse({
        document_case_id: UUID,
      }).success,
    ).toBe(false);
    expect(
      ResolveCandidatesInputSchema.safeParse({
        document_case_id: 'not-a-uuid',
        trace_id: UUID2,
      }).success,
    ).toBe(false);
  });
});

describe('RouterDecisionSchema — iff-constraint .refine() defense', () => {
  const VALID_BRANCH_A = {
    branch: 'a' as const,
    document_case_id: UUID,
    trace_id: UUID2,
    candidate_set_ids: [UUID3],
    ambiguity_margin_computed: null,
    winner_candidate_id: UUID3,
    exception_queue_entry_id: null,
    exception_reason: null,
  };

  const VALID_BRANCH_B = {
    branch: 'b' as const,
    document_case_id: UUID,
    trace_id: UUID2,
    candidate_set_ids: [UUID3, '00000000-0000-0000-0000-000000000004'],
    ambiguity_margin_computed: 0,
    winner_candidate_id: null,
    exception_queue_entry_id: '00000000-0000-0000-0000-000000000005',
    exception_reason: 'multi_candidate_ambiguity' as const,
  };

  it('valid branch=a shape accepted', () => {
    expect(RouterDecisionSchema.safeParse(VALID_BRANCH_A).success).toBe(true);
  });

  it('branch=a + winner_candidate_id null rejected', () => {
    const invalid = { ...VALID_BRANCH_A, winner_candidate_id: null };
    expect(RouterDecisionSchema.safeParse(invalid).success).toBe(false);
  });

  it('branch=b + winner_candidate_id non-null rejected', () => {
    const invalid = { ...VALID_BRANCH_B, winner_candidate_id: UUID3 };
    expect(RouterDecisionSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('DecisionRecordBeforeStateSchema — iff-constraint .refine() defense', () => {
  const VALID_N0 = {
    branch: 'c' as const,
    candidate_set_ids: [],
    confidence_scores: {},
    top_confidence: null,
    runner_up_confidence: null,
    ambiguity_margin_computed: null,
    ambiguity_margin_threshold: 0.05,
    winner_candidate_id: null,
    exception_reason: 'unmatched_router_candidate' as const,
    document_type: 'vendor_invoice' as const,
  };

  const VALID_N1 = {
    branch: 'a' as const,
    candidate_set_ids: [UUID3],
    confidence_scores: { [UUID3]: 0.95 },
    top_confidence: 0.95,
    runner_up_confidence: null,
    ambiguity_margin_computed: null,
    ambiguity_margin_threshold: 0.05,
    winner_candidate_id: UUID3,
    exception_reason: null,
    document_type: 'vendor_invoice' as const,
  };

  const VALID_N2 = {
    branch: 'b' as const,
    candidate_set_ids: [UUID3, '00000000-0000-0000-0000-000000000004'],
    confidence_scores: {
      [UUID3]: 0.95,
      '00000000-0000-0000-0000-000000000004': 0.95,
    },
    top_confidence: 0.95,
    runner_up_confidence: 0.95,
    ambiguity_margin_computed: 0,
    ambiguity_margin_threshold: 0.05,
    winner_candidate_id: null,
    exception_reason: 'multi_candidate_ambiguity' as const,
    document_type: 'vendor_invoice' as const,
  };

  it('N=0 shape accepted (top_confidence null, candidate_set_ids empty)', () => {
    expect(DecisionRecordBeforeStateSchema.safeParse(VALID_N0).success).toBe(true);
  });

  it('N=1 shape accepted (top_confidence non-null, runner_up_confidence null, margin null)', () => {
    expect(DecisionRecordBeforeStateSchema.safeParse(VALID_N1).success).toBe(true);
  });

  it('N≥2 shape accepted (all four numeric fields non-null)', () => {
    expect(DecisionRecordBeforeStateSchema.safeParse(VALID_N2).success).toBe(true);
  });

  it('iff-violation: branch=a + exception_reason non-null rejected', () => {
    const invalid = {
      ...VALID_N1,
      exception_reason: 'multi_candidate_ambiguity' as const,
    };
    expect(DecisionRecordBeforeStateSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('ExceptionReasonSchema — cross-schema-import sanity (chunk-6 home)', () => {
  it('accepts multi_candidate_ambiguity + unmatched_router_candidate literals (chunk-2 v1-active subset)', () => {
    expect(ExceptionReasonSchema.safeParse('multi_candidate_ambiguity').success).toBe(true);
    expect(ExceptionReasonSchema.safeParse('unmatched_router_candidate').success).toBe(true);
  });
});
