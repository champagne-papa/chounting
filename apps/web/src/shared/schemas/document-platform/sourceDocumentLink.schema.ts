import { z } from 'zod';
import { TimestamptzString } from '@/shared/schemas/common.schema';

// Layer 2 boundary: v1-active subsets only.
// Reserved enum values defined in DB ENUM type but rejected here.
// Pair-validity matrix from ADR-0016 §3 Table A enforced via .refine().

// 6 v1-active linked_entity_type values at chunk 5.
//
// ADR-0016 §1 lists 8 v1-active values including vendor_credit and
// vendor_credit_application, but Phase 5 substrate did not ship
// vendor_credits / vendor_credit_applications tables. Chunk 5 ships
// the tighter 6-value subset to match empirical codebase state. When
// Phase 5 ships the credit substrate, a future chunk's CHECK
// relaxes to 8 values; this enum extends; the table map below
// extends. See chunk-5 retrospective inventory item (ADR-0016 full
// editorial audit) for the §1-vs-codebase reconciliation question.
export const LinkedEntityTypeSchema = z.enum([
  'bill',
  'bill_line',
  'payment',
  'bill_payment_allocation',
  'vendor_prepayment',
  'vendor_prepayment_application',
]);
export type LinkedEntityType = z.infer<typeof LinkedEntityTypeSchema>;

// 4 v1-active link_role values per ADR-0016 §2.
export const LinkRoleSchema = z.enum([
  'primary_invoice',
  'payment_evidence',
  'receipt',
  'supporting',
]);
export type LinkRole = z.infer<typeof LinkRoleSchema>;

// link_status: 2 values per ADR-0016 §5.
export const LinkStatusSchema = z.enum(['created', 'reversed']);
export type LinkStatus = z.infer<typeof LinkStatusSchema>;

// Pair-validity matrix — the 13 A-labeled cells from ADR-0016 §3
// Table A intersected with chunk-5's 6 v1-active linked_entity_type
// subset (drops (vendor_credit, supporting) and
// (vendor_credit_application, supporting) per the chunk-5 deviation
// documented above). Both the DB CHECK constraint and this Zod
// .refine() reference this list; they must stay in sync.
const VALID_PAIRS: ReadonlySet<string> = new Set([
  'bill|primary_invoice',
  'bill|receipt',
  'bill|supporting',
  'bill_line|supporting',
  'payment|payment_evidence',
  'payment|receipt',
  'payment|supporting',
  'bill_payment_allocation|payment_evidence',
  'bill_payment_allocation|supporting',
  'vendor_prepayment|payment_evidence',
  'vendor_prepayment|receipt',
  'vendor_prepayment|supporting',
  'vendor_prepayment_application|supporting',
]);

export const CreateSourceDocumentLinkInputSchema = z.object({
  source_document_id: z.string().uuid(),
  linked_entity_type: LinkedEntityTypeSchema,
  linked_entity_id: z.string().uuid(),
  link_role: LinkRoleSchema,
}).refine(
  (input) => VALID_PAIRS.has(`${input.linked_entity_type}|${input.link_role}`),
  {
    message: 'Invalid (linked_entity_type, link_role) pair per ADR-0016 §3 Table A',
    path: ['link_role'],
  },
);
export type CreateSourceDocumentLinkInputRaw =
  z.input<typeof CreateSourceDocumentLinkInputSchema>;
export type CreateSourceDocumentLinkInput =
  z.infer<typeof CreateSourceDocumentLinkInputSchema>;

// reverseLinkedEntityLink input: bulk by (linked_entity_type,
// linked_entity_id) per ADR-0016 §5. Five fields: §5's 4-field
// signature plus reversal_reason (the audit event spec at
// §Reserved-enums-and-audit-events requires reversal_reason but
// §5's 4-field signature omits it; chunk 5 adds it as required).
export const ReverseLinkedEntityLinkInputSchema = z.object({
  linked_entity_type: LinkedEntityTypeSchema,
  linked_entity_id: z.string().uuid(),
  reversal_reason: z.string().min(1),
  reversal_trace_id: z.string().uuid(),
  controller_user_id: z.string().uuid(),
});
export type ReverseLinkedEntityLinkInputRaw =
  z.input<typeof ReverseLinkedEntityLinkInputSchema>;
export type ReverseLinkedEntityLinkInput =
  z.infer<typeof ReverseLinkedEntityLinkInputSchema>;

// Row shape returned by readSourceDocumentLink.
export const SourceDocumentLinkSchema = z.object({
  id: z.string().uuid(),
  source_document_id: z.string().uuid(),
  linked_entity_type: LinkedEntityTypeSchema,
  linked_entity_id: z.string().uuid(),
  link_role: LinkRoleSchema,
  link_status: LinkStatusSchema,
  trace_id: z.string().uuid(),
  created_at: TimestamptzString,
  created_by: z.string(),
});
export type SourceDocumentLink = z.infer<typeof SourceDocumentLinkSchema>;

// Polymorphic table map for the integrity validator.
//
// Phase 5 substrate uses two PK column conventions: <entity>_id
// for bills / vendors / payments / bill_lines /
// bill_payment_allocations; id for vendor_prepayments /
// vendor_prepayment_applications. This map navigates that
// asymmetry. Exported from the schema (not the service) so
// chunks 6+ exception queue + Phase 4 Router can read the same
// map. Future Phase 5 tables that join the v1-active
// linked_entity_type set must surface their PK column here at
// activation time.
export const LINKED_ENTITY_TABLE_MAP: Record<
  LinkedEntityType,
  { table: string; pkColumn: string }
> = {
  bill: { table: 'bills', pkColumn: 'bill_id' },
  bill_line: { table: 'bill_lines', pkColumn: 'bill_line_id' },
  payment: { table: 'payments', pkColumn: 'payment_id' },
  bill_payment_allocation: {
    table: 'bill_payment_allocations',
    pkColumn: 'bill_payment_allocation_id',
  },
  vendor_prepayment: { table: 'vendor_prepayments', pkColumn: 'id' },
  vendor_prepayment_application: {
    table: 'vendor_prepayment_applications',
    pkColumn: 'id',
  },
};
