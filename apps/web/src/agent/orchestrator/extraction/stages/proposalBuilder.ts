// proposalBuilder.ts — Stage 7 build_proposal substrate per Phase 7
// chunk 7.3a brief Task 7.3a.6 (brief-named "Stage 6 proposal builder";
// ADR canonical Stage 7 = build_proposal per ADR-0014 §13).
//
// Per Iteration 2 Option γ RATIFIED: chunk 7.3a ships ProposedEntryCard
// routes ONLY. Born-paid bundle + receipt-as-payment-evidence +
// payment_confirmation no-cited-bill cases return ProposalResult
// kind='deferred_chunk_7_3b_pending_activation'; chunk 7.3b activates
// ProposedMutationBundle + ProposedAttachment substrate.
//
// Routing matrix per Step 19:
//   - vendor_invoice → post_bill (no prior bill match) OR
//     attach_invoice_to_existing_bill (prior bill matched). ACTIVE.
//   - payment_confirmation cited-bill matched → record_bill_payment. ACTIVE.
//   - payment_confirmation no-cited-bill (attach-payment-evidence) → DEFERRED.
//   - receipt → DEFERRED.
//   - Born-paid bundle case (receipt + invoice + payment evidence) → DEFERRED.

import type { ProposalBuilderInput, ProposalResult } from '../types';

export function buildProposal(input: ProposalBuilderInput): ProposalResult {
  const { classification, relationshipCandidates, extractedFields, vendorMatch } = input;

  // Born-paid bundle detection: receipt OR payment_confirmation that
  // cites a vendor_invoice + has payment evidence in same document.
  // Bundle substrate consolidates at chunk 7.3b per Iteration 2 Option γ.
  if (isBornPaidBundleCandidate(classification.documentType, extractedFields)) {
    return {
      kind: 'deferred_chunk_7_3b_pending_activation',
      reason: 'born_paid_bundle_route_pending_chunk_7_3b_substrate',
    };
  }

  switch (classification.documentType) {
    case 'vendor_invoice':
      return buildVendorInvoiceProposal(input);

    case 'payment_confirmation':
      return buildPaymentConfirmationProposal(input);

    case 'receipt':
      // Receipt routes to attach_payment_evidence (ProposedAttachment).
      // Bundle substrate at chunk 7.3b per Iteration 2 Option γ.
      return {
        kind: 'deferred_chunk_7_3b_pending_activation',
        reason: 'attach_payment_evidence_receipt_route_pending_chunk_7_3b_substrate',
      };

    case 'unknown':
      // Unknown document_type should never reach proposalBuilder
      // (Stage 3 routes unknown to exception queue upstream).
      // Defensive guard: defer.
      return {
        kind: 'deferred_chunk_7_3b_pending_activation',
        reason: 'unknown_document_type_should_not_reach_proposal_builder',
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
 * vendor_invoice → post_bill (no prior bill match) OR
 * attach_invoice_to_existing_bill (relationship candidate matched).
 * ProposedEntryCard emission for both paths at chunk 7.3a.
 */
function buildVendorInvoiceProposal(input: ProposalBuilderInput): ProposalResult {
  const { extractedFields, vendorMatch, source_document_id } = input;

  // Relationship candidate signals a prior bill match.
  // attach_invoice_to_existing_bill is a ProposedAttachment route per
  // ADR-0011 §11 — Bundle/Attachment substrate at chunk 7.3b per
  // Iteration 2 Option γ; defer at chunk 7.3a.
  if (input.relationshipCandidates.length > 0) {
    return {
      kind: 'deferred_chunk_7_3b_pending_activation',
      reason: 'attach_invoice_to_existing_bill_route_pending_chunk_7_3b_substrate',
    };
  }

  // post_bill path: emit ProposedEntryCard per existing canvasDirective
  // proposed_entry_card consumer. ProposedEntryCard composition uses
  // vendor_id + amount + currency + accounting_date from extracted fields.
  const card = {
    card_type: 'proposed_entry_card' as const,
    source_document_id,
    proposed_action: 'post_bill' as const,
    extracted_fields: extractedFields,
    vendor_match: vendorMatch,
  };

  return {
    kind: 'proposed_entry_card',
    card,
  };
}

/**
 * payment_confirmation → record_bill_payment (when cited bill matches).
 * No-cited-bill path defers to chunk 7.3b (ProposedAttachment route).
 */
function buildPaymentConfirmationProposal(input: ProposalBuilderInput): ProposalResult {
  const { extractedFields, vendorMatch, source_document_id, relationshipCandidates } = input;

  const hasCitedBill =
    extractedFields.cited_bill_id !== undefined ||
    extractedFields.cited_invoice_number !== undefined;

  // No-cited-bill path → attach_payment_evidence ProposedAttachment.
  // Bundle/Attachment substrate at chunk 7.3b per Iteration 2 Option γ.
  if (!hasCitedBill && relationshipCandidates.length === 0) {
    return {
      kind: 'deferred_chunk_7_3b_pending_activation',
      reason:
        'attach_payment_evidence_payment_confirmation_no_cited_bill_route_pending_chunk_7_3b_substrate',
    };
  }

  // Cited bill matched (or relationship candidate present) → record_bill_payment.
  const card = {
    card_type: 'proposed_entry_card' as const,
    source_document_id,
    proposed_action: 'record_bill_payment' as const,
    extracted_fields: extractedFields,
    vendor_match: vendorMatch,
    cited_bill_id: extractedFields.cited_bill_id,
    cited_invoice_number: extractedFields.cited_invoice_number,
  };

  return {
    kind: 'proposed_entry_card',
    card,
  };
}
