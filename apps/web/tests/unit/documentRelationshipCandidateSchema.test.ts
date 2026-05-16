// tests/unit/documentRelationshipCandidateSchema.test.ts
//
// Phase 4 chunk 1 — unit schema tests for the candidate row + input
// schemas. Chunk-1 deliberate divergence from chunks-5-6 document-
// platform precedent (which skip unit schema tests for substrate
// writers) per the schema-defense-on-internally-constructed-values
// discriminator at scope-lock §5 friction-journal entry #20.
//
// Three patterns for schema-defense test coverage across chunks 1-6:
//   - External-input defense → integration sufficient (chunks-5-6
//     document-platform pattern).
//   - Complex external-input validation → unit + integration (spend-
//     chunks pattern: billSchema.test.ts, agingSchema.test.ts).
//   - Internally-constructed-values defense → unit required (chunk-1
//     pattern). DocumentRelationshipCandidateSchema.refine() fires on
//     internally-constructed row values (Subsystem 1 generates pairs
//     from ledger-state matching per ADR-0018 §item 2; the pair never
//     appears in CompleteCandidateInputSchema). Integration tests
//     can't easily produce invalid pairs through normal service calls.

import { describe, it, expect } from 'vitest';
import {
  VendorMatchResultSchema,
  ReRoutingTriggerSchema,
  CompleteCandidateInputSchema,
  DocumentRelationshipCandidateSchema,
} from '@/shared/schemas/document-platform/documentRelationshipCandidate.schema';

const VALID_ROW = {
  id: '00000000-0000-0000-0000-000000000001',
  org_id: '00000000-0000-0000-0000-000000000002',
  document_case_id: '00000000-0000-0000-0000-000000000003',
  source_document_id: '00000000-0000-0000-0000-000000000004',
  supersedes_candidate_id: null,
  linked_entity_type: 'bill' as const,
  linked_entity_id: '00000000-0000-0000-0000-000000000005',
  link_role: 'primary_invoice' as const,
  confidence_score: 0.9,
  candidate_features: {},
  trace_id: '00000000-0000-0000-0000-000000000006',
  created_at: '2026-05-13T00:00:00.000Z',
  created_by: 'agent',
};

describe('DocumentRelationshipCandidateSchema — pair-validity .refine() defense', () => {
  it('valid pair (bill, primary_invoice) accepted', () => {
    const parsed = DocumentRelationshipCandidateSchema.safeParse(VALID_ROW);
    expect(parsed.success).toBe(true);
  });

  it('invalid pair (bill_line, primary_invoice) — I-labeled in matrix — rejected', () => {
    const parsed = DocumentRelationshipCandidateSchema.safeParse({
      ...VALID_ROW,
      linked_entity_type: 'bill_line' as const,
      link_role: 'primary_invoice' as const,
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.message).toContain('ADR-0016 §3 Table A');
    }
  });

  it('reserved pair (vendor_prepayment, primary_invoice) rejected (not in VALID_PAIRS)', () => {
    const parsed = DocumentRelationshipCandidateSchema.safeParse({
      ...VALID_ROW,
      linked_entity_type: 'vendor_prepayment' as const,
      link_role: 'primary_invoice' as const,
    });
    expect(parsed.success).toBe(false);
  });
});

describe('ReRoutingTriggerSchema — reserved-value rejection at Layer 2', () => {
  it('T1_new_bill accepted (v1-active)', () => {
    expect(ReRoutingTriggerSchema.safeParse('T1_new_bill').success).toBe(true);
  });

  it('T7_vendor_master_merge rejected at parse (reserved post-v1)', () => {
    const parsed = ReRoutingTriggerSchema.safeParse('T7_vendor_master_merge');
    expect(parsed.success).toBe(false);
  });

  it('T9_document_supersession rejected at parse (reserved post-v1)', () => {
    const parsed = ReRoutingTriggerSchema.safeParse('T9_document_supersession');
    expect(parsed.success).toBe(false);
  });
});

describe('CompleteCandidateInputSchema — parse edges', () => {
  const VALID_INPUT = {
    document_case_id: '00000000-0000-0000-0000-000000000001',
    source_document_id: '00000000-0000-0000-0000-000000000002',
    document_type: 'vendor_invoice' as const,
    classification_confidence: 0.95,
    extracted_fields: { invoice_amount: 1000 },
    vendor_match: null,
    trace_id: '00000000-0000-0000-0000-000000000003',
  };

  it('valid input parses', () => {
    expect(CompleteCandidateInputSchema.safeParse(VALID_INPUT).success).toBe(true);
  });

  it('missing required field (trace_id) rejected', () => {
    const { trace_id, ...withoutTraceId } = VALID_INPUT;
    void trace_id;
    expect(CompleteCandidateInputSchema.safeParse(withoutTraceId).success).toBe(false);
  });

  it('invalid document_type literal rejected', () => {
    const parsed = CompleteCandidateInputSchema.safeParse({
      ...VALID_INPUT,
      document_type: 'not_a_real_type',
    });
    expect(parsed.success).toBe(false);
  });

  it('vendor_match null accepted; typed VendorMatchResult also accepted', () => {
    expect(CompleteCandidateInputSchema.safeParse(VALID_INPUT).success).toBe(true);
    expect(
      CompleteCandidateInputSchema.safeParse({
        ...VALID_INPUT,
        vendor_match: {
          vendor_id: '00000000-0000-0000-0000-000000000004',
          confidence: 0.9,
          match_type: 'exact_name',
          candidate_alternatives: [],
        },
      }).success,
    ).toBe(true);
  });
});

describe('VendorMatchResultSchema — match_type literal-union enforcement', () => {
  it('valid match_type (exact_name) accepted', () => {
    const parsed = VendorMatchResultSchema.safeParse({
      vendor_id: '00000000-0000-0000-0000-000000000001',
      confidence: 0.9,
      match_type: 'exact_name',
      candidate_alternatives: [],
    });
    expect(parsed.success).toBe(true);
  });

  it('invalid match_type ("not_real_match_type") rejected', () => {
    const parsed = VendorMatchResultSchema.safeParse({
      vendor_id: '00000000-0000-0000-0000-000000000001',
      confidence: 0.9,
      match_type: 'not_real_match_type',
      candidate_alternatives: [],
    });
    expect(parsed.success).toBe(false);
  });
});
