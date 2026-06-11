// tests/unit/proposalJustificationSchema.test.ts
//
// Phase 8 chunk 9 (framing #5 Logic Receipt consumer) — unit tests for the
// formal ProposalJustificationSchema family (Layer 2 item #B; closes
// ADR-0007 Q30). Pure Zod parse tests; no DB.
//
// Placement: flat tests/unit/ per the established *Schema.test.ts convention
// (billDetailSchema, openBillsSchema, paymentApprovalQueueSchema, etc.); the
// directive favored a tests/unit/schemas/ subdir but granted impl discretion,
// and no other unit schema test lives in a subdir.

import { describe, it, expect } from 'vitest';
import {
  PipelineStageRecordSchema,
  BundleAuditRecordSchema,
  ProposalJustificationSchema,
} from '@/shared/schemas/accounting/proposalJustification.schema';

const validStage = {
  stage_name: 'classify',
  input_hash: 'sha256:abc',
  output_hash: 'sha256:def',
  model: 'claude-opus-4-7',
  timestamp: '2026-05-23T12:00:00Z',
};

const validStageNoModel = {
  stage_name: 'classify',
  input_hash: 'sha256:abc',
  output_hash: 'sha256:def',
  timestamp: '2026-05-23T12:00:00Z',
};

const validBundleAudit = {
  bundle_id: '11111111-1111-1111-1111-111111111111',
  composition_at: '2026-05-23T12:00:00Z',
  child_proposal_ids: [
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
  ],
  invariant_class: 'INV-AGENT-002',
};

describe('PipelineStageRecordSchema (Phase 8 chunk 9, ADR-0007 Q30)', () => {
  it('accepts a full stage record', () => {
    expect(PipelineStageRecordSchema.parse(validStage)).toEqual(validStage);
  });

  it('accepts a stage record without the optional model', () => {
    expect(PipelineStageRecordSchema.parse(validStageNoModel)).toEqual(validStageNoModel);
  });

  it('rejects a stage record missing a required hash', () => {
    const missing = {
      stage_name: 'classify',
      input_hash: 'sha256:abc',
      timestamp: '2026-05-23T12:00:00Z',
    };
    expect(PipelineStageRecordSchema.safeParse(missing).success).toBe(false);
  });

  it('rejects unknown keys (.strict)', () => {
    expect(
      PipelineStageRecordSchema.safeParse({ ...validStage, extra: 1 }).success,
    ).toBe(false);
  });
});

describe('BundleAuditRecordSchema (Phase 8 chunk 9, ADR-0012 §6 INV-AGENT-002)', () => {
  it('accepts a full bundle audit record', () => {
    expect(BundleAuditRecordSchema.parse(validBundleAudit)).toEqual(validBundleAudit);
  });

  it('rejects a non-uuid bundle_id', () => {
    expect(
      BundleAuditRecordSchema.safeParse({ ...validBundleAudit, bundle_id: 'nope' }).success,
    ).toBe(false);
  });

  it('rejects a non-datetime composition_at', () => {
    expect(
      BundleAuditRecordSchema.safeParse({ ...validBundleAudit, composition_at: 'not-a-date' }).success,
    ).toBe(false);
  });

  it('rejects non-uuid entries in child_proposal_ids', () => {
    expect(
      BundleAuditRecordSchema.safeParse({ ...validBundleAudit, child_proposal_ids: ['nope'] }).success,
    ).toBe(false);
  });
});

describe('ProposalJustificationSchema (Phase 8 chunk 9, Layer 2 item #B)', () => {
  it('accepts required traces as empty arrays', () => {
    const j = { pipeline_trace: [], bundle_audit_trace: [] };
    expect(ProposalJustificationSchema.parse(j)).toEqual(j);
  });

  it('accepts a full justification with optional fields', () => {
    const j = {
      pipeline_trace: [validStage],
      bundle_audit_trace: [validBundleAudit],
      user_utterance: 'record the invoice',
      rule_id: 'born_paid_bill',
      input_features: { vendor_match: true, amount: '500.00' },
      historical_match_count: 3,
      confidence_score: 0.92,
      source_transactions: ['44444444-4444-4444-4444-444444444444'],
    };
    expect(ProposalJustificationSchema.parse(j)).toEqual(j);
  });

  it('rejects when pipeline_trace is missing (required)', () => {
    expect(
      ProposalJustificationSchema.safeParse({ bundle_audit_trace: [] }).success,
    ).toBe(false);
  });

  it('rejects when bundle_audit_trace is missing (required)', () => {
    expect(
      ProposalJustificationSchema.safeParse({ pipeline_trace: [] }).success,
    ).toBe(false);
  });

  it('rejects a malformed nested pipeline stage', () => {
    expect(
      ProposalJustificationSchema.safeParse({
        pipeline_trace: [{ stage_name: 'x' }],
        bundle_audit_trace: [],
      }).success,
    ).toBe(false);
  });

  it('rejects unknown top-level keys (.strict)', () => {
    expect(
      ProposalJustificationSchema.safeParse({
        pipeline_trace: [],
        bundle_audit_trace: [],
        extra: 'nope',
      }).success,
    ).toBe(false);
  });

  it('rejects a non-number historical_match_count', () => {
    expect(
      ProposalJustificationSchema.safeParse({
        pipeline_trace: [],
        bundle_audit_trace: [],
        historical_match_count: 'three',
      }).success,
    ).toBe(false);
  });
});
