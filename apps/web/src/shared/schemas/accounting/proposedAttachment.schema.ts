// src/shared/schemas/accounting/proposedAttachment.schema.ts
//
// Phase 7 chunk 7.3b Task 7.3b.0 — ProposedAttachment greenfield Zod
// schema per ADR-0011 §7 + §11 (ProposedAttachment as non-ledger commit)
// + ADR-0014 §11 (5 v1-active proposal_type variants) + ADR-0016 (link
// shape).
//
// v1-active proposal_type values per ADR-0014 §11:
//   - 'attach_payment_evidence'                  — Scenario A spec §15
//   - 'attach_invoice_to_existing_bill'          — invoice after manual bill
//   - 'attach_supporting_document_to_bill'       — secondary documents
//   - 'attach_statement_to_vendor_reconciliation' — vendor reconciliation
//   - 'attach_retainer_agreement_to_prepayment'  — retainer for prepayment
//
// linked_entity_type per LinkedEntityTypeSchema (8 v1-active values at
// chunk 5.1a expansion; chunk 7.3b consumes the current substrate).
// link_role per LinkRoleSchema.
//
// justification field: formal ProposalJustificationSchema (Phase 8 chunk 9,
// Layer 2 item #B) — resolves the Phase 7 chunk 7.3b permissive placeholder
// and closes ADR-0007 Q30. See
// @/shared/schemas/accounting/proposalJustification.schema.

import { z } from 'zod';
import {
  LinkedEntityTypeSchema,
  LinkRoleSchema,
} from '@/shared/schemas/document-platform/sourceDocumentLink.schema';
import { ProposalJustificationSchema } from './proposalJustification.schema';

export const ProposedAttachmentProposalTypeSchema = z.enum([
  'attach_payment_evidence',
  'attach_invoice_to_existing_bill',
  'attach_supporting_document_to_bill',
  'attach_statement_to_vendor_reconciliation',
  'attach_retainer_agreement_to_prepayment',
]);
export type ProposedAttachmentProposalType = z.infer<
  typeof ProposedAttachmentProposalTypeSchema
>;

export const ProposedAttachmentSchema = z
  .object({
    proposal_type: ProposedAttachmentProposalTypeSchema,
    source_document_id: z.string().uuid(),
    linked_entity_type: LinkedEntityTypeSchema,
    linked_entity_id: z.string().uuid(),
    link_role: LinkRoleSchema,
    trace_id: z.string().uuid(),
    // justification formalized at Phase 8 chunk 9 (Layer 2 item #B);
    // ProposalJustificationSchema closes ADR-0007 Q30.
    justification: ProposalJustificationSchema.optional(),
  })
  .strict();
export type ProposedAttachment = z.infer<typeof ProposedAttachmentSchema>;
