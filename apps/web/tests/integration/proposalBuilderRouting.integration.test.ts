// tests/integration/proposalBuilderRouting.integration.test.ts
//
// Phase 7 chunk 7.3a — Task 7.3a.5 proposalBuilder routing matrix test.
// Verifies 5 routing paths per Step 19: 2 ACTIVE (vendor_invoice +
// payment_confirmation cited-bill) + 3 DEFERRED (born-paid bundle +
// receipt + payment_confirmation no-cited-bill).

import { describe, it, expect } from 'vitest';
import { buildProposal } from '@/agent/orchestrator/extraction/stages/proposalBuilder';
import type {
  ClassificationResult,
  ProposalBuilderInput,
} from '@/agent/orchestrator/extraction/types';

function makeClassification(
  documentType: ClassificationResult['documentType'],
  tier: 'A' | 'C' | 'D' = 'A',
): ClassificationResult {
  return {
    documentType,
    confidence: 0.95,
    rationale: 'test classification',
    tier,
  };
}

function makeInput(
  documentType: ClassificationResult['documentType'],
  fields: Record<string, unknown> = {},
  relationshipCandidates: ProposalBuilderInput['relationshipCandidates'] = [],
): ProposalBuilderInput {
  return {
    source_document_id: crypto.randomUUID(),
    classification: makeClassification(documentType),
    extractedFields: fields,
    vendorMatch: null,
    relationshipCandidates,
    trace_id: crypto.randomUUID(),
  };
}

describe('Phase 7 chunk 7.3a Task 7.3a.5.F — proposalBuilder routing matrix', () => {
  describe('ACTIVE routes (2)', () => {
    it('vendor_invoice no prior bill match → proposed_entry_card (post_bill)', () => {
      const result = buildProposal(
        makeInput('vendor_invoice', { amount: 100, vendor_invoice_number: 'INV-1' }),
      );
      expect(result.kind).toBe('proposed_entry_card');
      if (result.kind === 'proposed_entry_card') {
        expect((result.card as { proposed_action: string }).proposed_action).toBe(
          'post_bill',
        );
      }
    });

    it('payment_confirmation with cited bill → proposed_entry_card (record_bill_payment)', () => {
      const result = buildProposal(
        makeInput('payment_confirmation', {
          payment_amount: 250,
          cited_invoice_number: 'INV-99',
        }),
      );
      expect(result.kind).toBe('proposed_entry_card');
      if (result.kind === 'proposed_entry_card') {
        expect((result.card as { proposed_action: string }).proposed_action).toBe(
          'record_bill_payment',
        );
      }
    });
  });

  describe('DEFERRED routes (3)', () => {
    it('receipt → deferred (attach_payment_evidence at chunk 7.3b)', () => {
      const result = buildProposal(makeInput('receipt', { total: 25.5 }));
      expect(result.kind).toBe('deferred_chunk_7_3b_pending_activation');
      if (result.kind === 'deferred_chunk_7_3b_pending_activation') {
        expect(result.reason).toContain('attach_payment_evidence_receipt_route');
      }
    });

    it('payment_confirmation no-cited-bill → deferred', () => {
      const result = buildProposal(
        makeInput('payment_confirmation', { payment_amount: 100 }),
      );
      expect(result.kind).toBe('deferred_chunk_7_3b_pending_activation');
      if (result.kind === 'deferred_chunk_7_3b_pending_activation') {
        expect(result.reason).toContain(
          'attach_payment_evidence_payment_confirmation_no_cited_bill_route',
        );
      }
    });

    it('born-paid bundle (payment_confirmation citing invoice + payment fields) → deferred', () => {
      const result = buildProposal(
        makeInput('payment_confirmation', {
          payment_amount: 500,
          cited_invoice_number: 'INV-PAID',
          payment_reference: 'TXN-001',
        }),
      );
      expect(result.kind).toBe('deferred_chunk_7_3b_pending_activation');
      if (result.kind === 'deferred_chunk_7_3b_pending_activation') {
        expect(result.reason).toContain('born_paid_bundle_route');
      }
    });
  });

  it('vendor_invoice with relationship candidate (prior bill match) → deferred (attach_invoice_to_existing_bill)', () => {
    const result = buildProposal(
      makeInput(
        'vendor_invoice',
        { amount: 100, vendor_invoice_number: 'INV-1' },
        [
          {
            id: crypto.randomUUID(),
            document_case_id: crypto.randomUUID(),
            source_document_id: crypto.randomUUID(),
            linked_entity_type: 'bill',
            linked_entity_id: crypto.randomUUID(),
            link_role: 'primary_invoice',
            confidence_score: 0.95,
          },
        ],
      ),
    );
    expect(result.kind).toBe('deferred_chunk_7_3b_pending_activation');
    if (result.kind === 'deferred_chunk_7_3b_pending_activation') {
      expect(result.reason).toContain('attach_invoice_to_existing_bill_route');
    }
  });
});
