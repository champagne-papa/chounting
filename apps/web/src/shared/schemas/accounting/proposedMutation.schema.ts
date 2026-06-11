// src/shared/schemas/accounting/proposedMutation.schema.ts
//
// Phase 7 chunk 7.3b Task 7.3b.0 — ProposedMutation greenfield Zod schema
// per ADR-0011 §7 + §11 (ProposedMutation as single ledger-touching
// operation) + ADR-0014 §11 (proposal routing) + ADR-0012 (bundle child
// composition).
//
// v1-active proposal_type values per ADR-0014 §11:
//   - 'post_bill' (vendor_invoice → no prior bill match)
//   - 'record_bill_payment' (payment_confirmation cited-bill matched)
//
// justification field: formal ProposalJustificationSchema (Phase 8 chunk 9,
// Layer 2 item #B) — resolves the Phase 7 chunk 7.3b permissive placeholder
// (z.record(z.string(), z.unknown())) and closes ADR-0007 Q30. See
// @/shared/schemas/accounting/proposalJustification.schema.

import { z } from 'zod';
import { ProposalJustificationSchema } from './proposalJustification.schema';

export const ProposedMutationProposalTypeSchema = z.enum([
  'post_bill',
  'record_bill_payment',
]);
export type ProposedMutationProposalType = z.infer<
  typeof ProposedMutationProposalTypeSchema
>;

// post_bill child params per ADR-0011 §11 bill-line schema; loose at
// proposal grade (Tier 1 re-verification at commit grade against
// PostBillInputSchema).
const PostBillParamsSchema = z
  .object({
    vendor_id: z.string().uuid().optional(),
    amount: z.string().optional(),
    currency: z.string().optional(),
    invoice_number: z.string().optional(),
    accounting_date: z.string().optional(),
    due_date: z.string().optional(),
    line_items: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .passthrough();

// record_bill_payment child params per ADR-0011 §11. Tier 1
// re-verification at commit grade against RecordPaymentInputSchema.
const RecordBillPaymentParamsSchema = z
  .object({
    vendor_id: z.string().uuid().optional(),
    bill_id: z.string().uuid().optional(),
    payment_date: z.string().optional(),
    amount: z.string().optional(),
    currency: z.string().optional(),
    payment_method: z.string().optional(),
    payment_reference: z.string().optional(),
  })
  .passthrough();

export const ProposedMutationSchema = z.discriminatedUnion('proposal_type', [
  z
    .object({
      proposal_type: z.literal('post_bill'),
      source_document_id: z.string().uuid(),
      trace_id: z.string().uuid(),
      params: PostBillParamsSchema,
      // justification formalized at Phase 8 chunk 9 (Layer 2 item #B);
      // ProposalJustificationSchema closes ADR-0007 Q30.
      justification: ProposalJustificationSchema.optional(),
    })
    .strict(),
  z
    .object({
      proposal_type: z.literal('record_bill_payment'),
      source_document_id: z.string().uuid(),
      trace_id: z.string().uuid(),
      params: RecordBillPaymentParamsSchema,
      justification: ProposalJustificationSchema.optional(),
    })
    .strict(),
]);
export type ProposedMutation = z.infer<typeof ProposedMutationSchema>;
