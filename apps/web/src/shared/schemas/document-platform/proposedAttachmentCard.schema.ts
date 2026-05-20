// src/shared/schemas/document-platform/proposedAttachmentCard.schema.ts
//
// Phase 7 chunk 7.3b Task 7.3b.2 — ProposedAttachmentCard Zod schema per
// chunk 7.3 brief §4 value pick #5 verbatim shape. Parallel structural
// parity with ProposedEntryCardSchema at
// @/shared/schemas/accounting/proposedEntryCard.schema.ts (Finding O2-v2
// Site-2-post-fill pattern + .strict() boundary).
//
// Schema location adjudication: substrate convention is `document-platform/`
// (dash); brief cited `document_platform/` (underscore). Following
// substrate per (μ) sub-grain Phase A absorption (N=7 cross-instance
// banking surface).
//
// LinkedEntityTypeSchema 8 v1-active values at chunk 5.1a expansion;
// chunk 7.3b consumes current substrate (brief cited outdated "6-value
// v1-active" — (μ) sub-grain N=6 cross-instance banking).
//
// justification field: permissive z.record(z.unknown()).optional() shape
// per Iteration 2 Option (c') Finding E absorption. Formal
// ProposalJustificationSchema codification deferred to Phase 8 / post-v1
// Logic Receipt consumer per ADR-0007 Q30.

import { z } from 'zod';
import {
  LinkedEntityTypeSchema,
  LinkRoleSchema,
} from './sourceDocumentLink.schema';

export const ProposedAttachmentCardProposalTypeSchema = z.enum([
  'attach_payment_evidence',
  'attach_invoice_to_existing_bill',
  'attach_supporting_document_to_bill',
  'attach_statement_to_vendor_reconciliation',
  'attach_retainer_agreement_to_prepayment',
]);
export type ProposedAttachmentCardProposalType = z.infer<
  typeof ProposedAttachmentCardProposalTypeSchema
>;

export const ProposedAttachmentCardSchema = z
  .object({
    org_id: z.string().uuid(),
    org_name: z.string(),
    proposal_type: ProposedAttachmentCardProposalTypeSchema,
    source_document_id: z.string().uuid(),
    linked_entity_type: LinkedEntityTypeSchema,
    linked_entity_id: z.string().uuid(),
    link_role: LinkRoleSchema,
    // justification permissive per Iteration 2 Option (c') Finding E
    // absorption; formal ProposalJustificationSchema codification deferred
    // to Phase 8 / post-v1 Logic Receipt consumer per ADR-0007 Q30.
    justification: z.record(z.string(), z.unknown()).optional(),
    confidence_score: z.number(),
    idempotency_key: z.string().uuid(),
    trace_id: z.string().uuid(),
  })
  .strict();
export type ProposedAttachmentCard = z.infer<typeof ProposedAttachmentCardSchema>;

// Finding O2-v2 Site-2-post-fill pattern (mirror of ProposedEntryCardInput
// at @/shared/schemas/accounting/proposedEntryCard.schema.ts): the model
// cannot emit valid org_id (no UUIDs in prompt by design), idempotency_key
// (orchestrator-minted pre-Zod), or trace_id (orchestrator-controlled).
// The input schema is the shape the orchestrator accepts from
// respondToUser's canvas_directive; Site 2 post-fills the three UUID
// fields from session/ctx before the card ships to the client (which
// still sees the strict ProposedAttachmentCardSchema shape).
export const ProposedAttachmentCardInputSchema =
  ProposedAttachmentCardSchema.omit({
    org_id: true,
    idempotency_key: true,
    trace_id: true,
  });
export type ProposedAttachmentCardInput = z.infer<
  typeof ProposedAttachmentCardInputSchema
>;
