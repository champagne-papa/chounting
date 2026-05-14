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
  DispatchTriggerInputSchema,
  RouterDecisionOutcomeSchema,
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

// ---------------------------------------------------------------------
// Phase 4 chunk 3 — Subsystem 3 schemas (DispatchTriggerInputSchema +
// RouterDecisionOutcomeSchema).
//
// Same schema-defense-on-internally-constructed-values rationale fires:
// DispatchTriggerInputSchema's discriminated union edges + RouterDecision
// OutcomeSchema's 5-value vocabulary are not naturally exercisable
// through integration tests (the service constructs the envelope from
// typed callers; the schema rejects malformed envelopes at the Layer 2
// boundary). Unit schema tests are the canonical surface.
// ---------------------------------------------------------------------

describe('DispatchTriggerInputSchema — discriminated union edges', () => {
  const ORG = '00000000-0000-0000-0000-0000000000aa';
  const TRACE = '00000000-0000-0000-0000-0000000000bb';
  const BILL = '00000000-0000-0000-0000-0000000000c1';
  const VENDOR = '00000000-0000-0000-0000-0000000000c2';
  const PREPAYMENT = '00000000-0000-0000-0000-0000000000c3';
  const PERIOD = '00000000-0000-0000-0000-0000000000c4';
  const CASE = '00000000-0000-0000-0000-0000000000c5';

  it('T1_new_bill branch accepts valid payload (org_id + bill_id + vendor_id + trace_id)', () => {
    const parsed = DispatchTriggerInputSchema.safeParse({
      trigger_type: 'T1_new_bill',
      org_id: ORG,
      bill_id: BILL,
      vendor_id: VENDOR,
      trace_id: TRACE,
    });
    expect(parsed.success).toBe(true);
  });

  it('T1_new_bill branch rejects missing vendor_id', () => {
    const parsed = DispatchTriggerInputSchema.safeParse({
      trigger_type: 'T1_new_bill',
      org_id: ORG,
      bill_id: BILL,
      trace_id: TRACE,
    });
    expect(parsed.success).toBe(false);
  });

  it('T3_new_vendor_prepayment branch accepts valid payload', () => {
    const parsed = DispatchTriggerInputSchema.safeParse({
      trigger_type: 'T3_new_vendor_prepayment',
      org_id: ORG,
      vendor_prepayment_id: PREPAYMENT,
      vendor_id: VENDOR,
      trace_id: TRACE,
    });
    expect(parsed.success).toBe(true);
  });

  it('T5_bill_state_transition branch accepts old/new lifecycle_state pair', () => {
    const parsed = DispatchTriggerInputSchema.safeParse({
      trigger_type: 'T5_bill_state_transition',
      org_id: ORG,
      bill_id: BILL,
      old_lifecycle_state: 'approved_for_payment',
      new_lifecycle_state: 'fully_paid',
      trace_id: TRACE,
    });
    expect(parsed.success).toBe(true);
  });

  it('T5_bill_state_transition branch rejects out-of-watched-set old_lifecycle_state (e.g. pending_approval)', () => {
    const parsed = DispatchTriggerInputSchema.safeParse({
      trigger_type: 'T5_bill_state_transition',
      org_id: ORG,
      bill_id: BILL,
      old_lifecycle_state: 'pending_approval',
      new_lifecycle_state: 'fully_paid',
      trace_id: TRACE,
    });
    expect(parsed.success).toBe(false);
  });

  it('T8_period_reopen branch accepts valid payload (org_id + period_id + trace_id)', () => {
    const parsed = DispatchTriggerInputSchema.safeParse({
      trigger_type: 'T8_period_reopen',
      org_id: ORG,
      period_id: PERIOD,
      trace_id: TRACE,
    });
    expect(parsed.success).toBe(true);
  });

  it('T10_manual_override branch accepts valid payload (org_id + case_id + trace_id)', () => {
    const parsed = DispatchTriggerInputSchema.safeParse({
      trigger_type: 'T10_manual_override',
      org_id: ORG,
      case_id: CASE,
      trace_id: TRACE,
    });
    expect(parsed.success).toBe(true);
  });

  it('cross-branch payload rejected (T1 trigger_type with period_id field is not a valid T1 branch)', () => {
    const parsed = DispatchTriggerInputSchema.safeParse({
      trigger_type: 'T1_new_bill',
      org_id: ORG,
      period_id: PERIOD,
      trace_id: TRACE,
    });
    expect(parsed.success).toBe(false);
  });

  it('reserved trigger types (T2/T4/T6/T7/T9) rejected — not in v1-active-emission-wired union', () => {
    for (const reserved of [
      'T2_new_payment',
      'T4_new_vendor_credit',
      'T6_payment_state_transition',
      'T7_vendor_master_merge',
      'T9_document_supersession',
    ] as const) {
      const parsed = DispatchTriggerInputSchema.safeParse({
        trigger_type: reserved,
        org_id: ORG,
        trace_id: TRACE,
      });
      expect(parsed.success).toBe(false);
    }
  });
});

describe('RouterDecisionOutcomeSchema — 5-value vocabulary', () => {
  it('accepts all 5 v1 values (no_change / re_routed_from_exception / re_routed_to_exception / candidate_superseded / dispatch_failed)', () => {
    for (const v of [
      'no_change',
      're_routed_from_exception',
      're_routed_to_exception',
      'candidate_superseded',
      'dispatch_failed',
    ] as const) {
      expect(RouterDecisionOutcomeSchema.safeParse(v).success).toBe(true);
    }
  });

  it('rejects unknown values (e.g. unknown_outcome)', () => {
    expect(RouterDecisionOutcomeSchema.safeParse('unknown_outcome').success).toBe(false);
    expect(RouterDecisionOutcomeSchema.safeParse('matched').success).toBe(false);
    expect(RouterDecisionOutcomeSchema.safeParse('').success).toBe(false);
  });
});
