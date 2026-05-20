// proposalBuilder.ts — Stage 7 build_proposal substrate per Phase 7
// chunk 7.3b brief Task 7.3b.6 (brief-named "Stage 6 proposal builder";
// ADR canonical Stage 7 = build_proposal per ADR-0014 §13).
//
// Chunk 7.3b activation: 5-route matrix per chunk 7.3 brief §4 value
// picks #4-#6. ProposalResult.kind 3-value union (removed transitional
// 'deferred_chunk_7_3b_pending_activation' discriminator from chunk
// 7.3a); IngestDocumentOutput.status preserves the deferred union member
// per ADR-0022 additive discipline (defined-but-not-emitted post-
// activation).
//
// Asymmetry-with-Step-23 docstring discipline per Iteration 2 Note 3:
// ProposalResult.kind is proposalBuilder's INTERNAL output shape — chunk
// 7.3b activates all routes; the deferred discriminator is structurally
// unreachable; removing tightens type. IngestDocumentOutput.status is
// the orchestrator's EXTERNAL output shape — preserving the deferred
// union member is additive provenance discipline per ADR-0022.
//
// Routing matrix (5 active routes + 1 fallthrough):
//   - vendor_invoice no-prior-match → proposed_entry_card (post_bill)
//   - vendor_invoice prior-match (relationshipCandidate matched bill) →
//     proposed_attachment_card (attach_invoice_to_existing_bill)
//   - payment_confirmation cited-bill matched → proposed_entry_card
//     (record_bill_payment)
//   - payment_confirmation no-cited-bill + relationshipCandidate matched →
//     proposed_attachment_card (attach_payment_evidence)
//   - receipt + relationshipCandidate matched → proposed_attachment_card
//     (attach_payment_evidence)
//   - born-paid case (invoice+payment shape + cited-bill) →
//     proposed_mutation_bundle (born_paid_bill)
//   - Else (no matched candidate for attachment routes; unknown
//     document_type defensive guard) → return a stub proposed_entry_card
//     with empty payload; Stage 7 commit composite routes the empty
//     payload to exception queue at orchestrator grade.

import type { ProposalBuilderInput, ProposalResult, RelationshipCandidate } from '../types';

export function buildProposal(input: ProposalBuilderInput): ProposalResult {
  const { classification, relationshipCandidates, extractedFields, vendorMatch, source_document_id, trace_id } = input;

  // Born-paid bundle detection: receipt OR payment_confirmation that
  // cites a vendor_invoice + has payment evidence in same document; OR
  // vendor_invoice carrying payment evidence.
  if (isBornPaidBundleCandidate(classification.documentType, extractedFields)) {
    return buildBornPaidBundle(input);
  }

  switch (classification.documentType) {
    case 'vendor_invoice':
      return buildVendorInvoiceProposal(input);

    case 'payment_confirmation':
      return buildPaymentConfirmationProposal(input);

    case 'receipt':
      return buildReceiptProposal(input);

    case 'unknown':
      // Unknown document_type should never reach proposalBuilder
      // (Stage 3 routes unknown to exception queue upstream).
      // Defensive guard: emit an empty-payload proposed_entry_card.
      // Stage 7 commit composite handles the empty payload via no-op +
      // proposal_id=null.
      return {
        kind: 'proposed_entry_card',
        card: {
          card_type: 'proposed_entry_card' as const,
          source_document_id,
          trace_id,
          proposed_action: 'unknown_document_type_defensive_guard' as const,
          extracted_fields: extractedFields,
          vendor_match: vendorMatch,
        },
      };
  }
}

/**
 * Detect born-paid bundle candidate. A born-paid case carries both
 * invoice-shape evidence (invoice number + amount + due date) AND
 * payment-shape evidence (payment confirmation language + payment
 * reference) in the same document.
 */
function isBornPaidBundleCandidate(
  documentType: string,
  extractedFields: Record<string, unknown>,
): boolean {
  const hasInvoiceFields =
    extractedFields.vendor_invoice_number !== undefined &&
    extractedFields.amount !== undefined;
  const hasPaymentFields =
    extractedFields.payment_reference !== undefined ||
    extractedFields.payment_method !== undefined;
  const hasCitedBill =
    extractedFields.cited_bill_id !== undefined ||
    extractedFields.cited_invoice_number !== undefined;

  // Receipt or payment_confirmation citing an invoice → born-paid candidate.
  if (
    (documentType === 'receipt' || documentType === 'payment_confirmation') &&
    hasCitedBill &&
    hasPaymentFields
  ) {
    return true;
  }

  // Vendor invoice carrying payment evidence → born-paid candidate.
  if (documentType === 'vendor_invoice' && hasInvoiceFields && hasPaymentFields) {
    return true;
  }

  return false;
}

/**
 * Born-paid bundle: post_bill + record_bill_payment children per
 * ADR-0012 + ADR-0014 §11. Bundle execution semantics per ADR-0012:
 * child mutations execute atomically at Stage 7 commit composite via
 * sequential withInvariants() calls.
 */
function buildBornPaidBundle(input: ProposalBuilderInput): ProposalResult {
  const { extractedFields, vendorMatch, source_document_id, trace_id } = input;

  const bundle = {
    proposal_type: 'born_paid_bill' as const,
    source_document_id,
    trace_id,
    child_mutations: [
      {
        proposal_type: 'post_bill' as const,
        source_document_id,
        trace_id,
        params: {
          vendor_id: vendorMatch?.vendor_id ?? undefined,
          amount:
            typeof extractedFields.amount === 'string'
              ? extractedFields.amount
              : undefined,
          currency: 'CAD' as const,
          invoice_number:
            typeof extractedFields.vendor_invoice_number === 'string'
              ? extractedFields.vendor_invoice_number
              : undefined,
        },
      },
      {
        proposal_type: 'record_bill_payment' as const,
        source_document_id,
        trace_id,
        params: {
          vendor_id: vendorMatch?.vendor_id ?? undefined,
          amount:
            typeof extractedFields.amount === 'string'
              ? extractedFields.amount
              : undefined,
          currency: 'CAD' as const,
          payment_method:
            typeof extractedFields.payment_method === 'string'
              ? extractedFields.payment_method
              : undefined,
          payment_reference:
            typeof extractedFields.payment_reference === 'string'
              ? extractedFields.payment_reference
              : undefined,
        },
      },
    ],
  };

  return {
    kind: 'proposed_mutation_bundle',
    bundle,
  };
}

/**
 * vendor_invoice route:
 *   - relationshipCandidate.length > 0 (prior bill matched) →
 *     proposed_attachment_card (attach_invoice_to_existing_bill).
 *   - Else → proposed_entry_card (post_bill).
 */
function buildVendorInvoiceProposal(input: ProposalBuilderInput): ProposalResult {
  const { extractedFields, vendorMatch, source_document_id, trace_id, relationshipCandidates } = input;

  const topCandidate = pickTopCandidate(relationshipCandidates);

  // Prior-bill-matched route: attach_invoice_to_existing_bill ProposedAttachment.
  if (topCandidate && topCandidate.linked_entity_type === 'bill') {
    return {
      kind: 'proposed_attachment_card',
      card: {
        card_type: 'proposed_attachment_card' as const,
        source_document_id,
        trace_id,
        proposal_type: 'attach_invoice_to_existing_bill' as const,
        linked_entity_type: topCandidate.linked_entity_type,
        linked_entity_id: topCandidate.linked_entity_id,
        link_role: 'primary_invoice' as const,
        confidence_score: topCandidate.confidence_score,
        extracted_fields: extractedFields,
        vendor_match: vendorMatch,
      },
    };
  }

  // No prior bill matched: post_bill ProposedEntry.
  return {
    kind: 'proposed_entry_card',
    card: {
      card_type: 'proposed_entry_card' as const,
      source_document_id,
      trace_id,
      proposed_action: 'post_bill' as const,
      extracted_fields: extractedFields,
      vendor_match: vendorMatch,
    },
  };
}

/**
 * payment_confirmation route:
 *   - cited-bill matched (relationshipCandidate with linked_entity_type='bill') →
 *     proposed_entry_card (record_bill_payment).
 *   - no-cited-bill + relationshipCandidate matched (payment / bill_payment_allocation) →
 *     proposed_attachment_card (attach_payment_evidence).
 *   - Else → defensive defer; emit empty payload.
 */
function buildPaymentConfirmationProposal(input: ProposalBuilderInput): ProposalResult {
  const { extractedFields, vendorMatch, source_document_id, trace_id, relationshipCandidates } = input;

  const hasCitedBill =
    extractedFields.cited_bill_id !== undefined ||
    extractedFields.cited_invoice_number !== undefined;

  const topCandidate = pickTopCandidate(relationshipCandidates);

  // Cited-bill matched: record_bill_payment ProposedEntry.
  if (hasCitedBill || (topCandidate && topCandidate.linked_entity_type === 'bill')) {
    return {
      kind: 'proposed_entry_card',
      card: {
        card_type: 'proposed_entry_card' as const,
        source_document_id,
        trace_id,
        proposed_action: 'record_bill_payment' as const,
        extracted_fields: extractedFields,
        vendor_match: vendorMatch,
        cited_bill_id: extractedFields.cited_bill_id,
        cited_invoice_number: extractedFields.cited_invoice_number,
        matched_candidate: topCandidate,
      },
    };
  }

  // No cited bill + matched candidate (e.g., payment row matched by
  // amount + date): attach_payment_evidence ProposedAttachment.
  if (topCandidate) {
    return {
      kind: 'proposed_attachment_card',
      card: {
        card_type: 'proposed_attachment_card' as const,
        source_document_id,
        trace_id,
        proposal_type: 'attach_payment_evidence' as const,
        linked_entity_type: topCandidate.linked_entity_type,
        linked_entity_id: topCandidate.linked_entity_id,
        link_role: 'payment_evidence' as const,
        confidence_score: topCandidate.confidence_score,
        extracted_fields: extractedFields,
        vendor_match: vendorMatch,
      },
    };
  }

  // No match: defensive defer (empty ProposedEntry payload; Stage 7
  // composite routes to exception queue at orchestrator grade).
  return {
    kind: 'proposed_entry_card',
    card: {
      card_type: 'proposed_entry_card' as const,
      source_document_id,
      trace_id,
      proposed_action: 'payment_confirmation_unmatched_defensive_guard' as const,
      extracted_fields: extractedFields,
      vendor_match: vendorMatch,
    },
  };
}

/**
 * receipt route:
 *   - relationshipCandidate matched (payment / bill / bill_payment_allocation) →
 *     proposed_attachment_card (attach_payment_evidence).
 *   - Else → defensive defer; emit empty payload.
 */
function buildReceiptProposal(input: ProposalBuilderInput): ProposalResult {
  const { extractedFields, vendorMatch, source_document_id, trace_id, relationshipCandidates } = input;

  const topCandidate = pickTopCandidate(relationshipCandidates);

  if (topCandidate) {
    return {
      kind: 'proposed_attachment_card',
      card: {
        card_type: 'proposed_attachment_card' as const,
        source_document_id,
        trace_id,
        proposal_type: 'attach_payment_evidence' as const,
        linked_entity_type: topCandidate.linked_entity_type,
        linked_entity_id: topCandidate.linked_entity_id,
        link_role: 'receipt' as const,
        confidence_score: topCandidate.confidence_score,
        extracted_fields: extractedFields,
        vendor_match: vendorMatch,
      },
    };
  }

  // No match: defensive defer.
  return {
    kind: 'proposed_entry_card',
    card: {
      card_type: 'proposed_entry_card' as const,
      source_document_id,
      trace_id,
      proposed_action: 'receipt_unmatched_defensive_guard' as const,
      extracted_fields: extractedFields,
      vendor_match: vendorMatch,
    },
  };
}

/** Pick the highest-confidence candidate from the array. */
function pickTopCandidate(
  candidates: RelationshipCandidate[],
): RelationshipCandidate | null {
  if (candidates.length === 0) return null;
  return candidates.reduce((best, current) =>
    current.confidence_score > best.confidence_score ? current : best,
  );
}
