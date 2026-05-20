// tests/integration/proposalBuilderRouting.integration.test.ts
//
// Phase 7 chunk 7.3b — Task 7.3b.6 proposalBuilder routing matrix test.
// Verifies the activated 5-route matrix per chunk 7.3 brief §4 value
// picks #4-#6:
//   - vendor_invoice no-prior-match → proposed_entry_card (post_bill)
//   - vendor_invoice prior-match → proposed_attachment_card
//     (attach_invoice_to_existing_bill)
//   - payment_confirmation cited-bill → proposed_entry_card
//     (record_bill_payment)
//   - payment_confirmation no-cited-bill + matched candidate →
//     proposed_attachment_card (attach_payment_evidence)
//   - receipt + matched candidate → proposed_attachment_card
//     (attach_payment_evidence)
//   - born-paid case → proposed_mutation_bundle (born_paid_bill)

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

describe('Phase 7 chunk 7.3b Task 7.3b.6 — proposalBuilder 5-route activation matrix', () => {
  describe('proposed_entry_card routes (2)', () => {
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

  describe('proposed_attachment_card routes (3)', () => {
    it('vendor_invoice with relationship candidate (prior bill match) → proposed_attachment_card (attach_invoice_to_existing_bill)', () => {
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
      expect(result.kind).toBe('proposed_attachment_card');
      if (result.kind === 'proposed_attachment_card') {
        expect(
          (result.card as { proposal_type: string }).proposal_type,
        ).toBe('attach_invoice_to_existing_bill');
      }
    });

    it('receipt with matched payment candidate → proposed_attachment_card (attach_payment_evidence)', () => {
      const result = buildProposal(
        makeInput('receipt', { amount: '25.5000' }, [
          {
            id: crypto.randomUUID(),
            document_case_id: crypto.randomUUID(),
            source_document_id: crypto.randomUUID(),
            linked_entity_type: 'payment',
            linked_entity_id: crypto.randomUUID(),
            link_role: 'payment_evidence',
            confidence_score: 0.85,
          },
        ]),
      );
      expect(result.kind).toBe('proposed_attachment_card');
      if (result.kind === 'proposed_attachment_card') {
        expect(
          (result.card as { proposal_type: string }).proposal_type,
        ).toBe('attach_payment_evidence');
      }
    });

    it('payment_confirmation no-cited-bill + matched payment candidate → proposed_attachment_card (attach_payment_evidence)', () => {
      const result = buildProposal(
        makeInput('payment_confirmation', { amount: '100.0000' }, [
          {
            id: crypto.randomUUID(),
            document_case_id: crypto.randomUUID(),
            source_document_id: crypto.randomUUID(),
            linked_entity_type: 'payment',
            linked_entity_id: crypto.randomUUID(),
            link_role: 'payment_evidence',
            confidence_score: 0.80,
          },
        ]),
      );
      expect(result.kind).toBe('proposed_attachment_card');
      if (result.kind === 'proposed_attachment_card') {
        expect(
          (result.card as { proposal_type: string }).proposal_type,
        ).toBe('attach_payment_evidence');
      }
    });
  });

  describe('proposed_mutation_bundle route (1)', () => {
    it('born-paid case (payment_confirmation citing invoice + payment fields) → proposed_mutation_bundle (born_paid_bill)', () => {
      const result = buildProposal(
        makeInput('payment_confirmation', {
          payment_amount: 500,
          cited_invoice_number: 'INV-PAID',
          payment_reference: 'TXN-001',
          payment_method: 'eft',
        }),
      );
      expect(result.kind).toBe('proposed_mutation_bundle');
      if (result.kind === 'proposed_mutation_bundle') {
        expect(
          (result.bundle as { proposal_type: string }).proposal_type,
        ).toBe('born_paid_bill');
      }
    });
  });

  describe('defensive fallthrough routes', () => {
    it('receipt with no matched candidate → proposed_entry_card with defensive_guard discriminator', () => {
      const result = buildProposal(makeInput('receipt', { amount: '25.50' }));
      expect(result.kind).toBe('proposed_entry_card');
      if (result.kind === 'proposed_entry_card') {
        expect((result.card as { proposed_action: string }).proposed_action).toBe(
          'receipt_unmatched_defensive_guard',
        );
      }
    });

    it('payment_confirmation no cited bill + no matched candidate → defensive_guard', () => {
      const result = buildProposal(
        makeInput('payment_confirmation', { amount: '100' }),
      );
      expect(result.kind).toBe('proposed_entry_card');
      if (result.kind === 'proposed_entry_card') {
        expect((result.card as { proposed_action: string }).proposed_action).toBe(
          'payment_confirmation_unmatched_defensive_guard',
        );
      }
    });
  });
});
