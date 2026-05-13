import { z } from 'zod';

// Layer 2 boundary: v1-active subsets only.
// Reserved values defined in DB enum but rejected here.

export const DocumentTypeSchema = z.enum([
  'vendor_invoice',
  'receipt',
  'payment_confirmation',
  'unknown',
]);
export type DocumentType = z.infer<typeof DocumentTypeSchema>;

export const DocumentCaseStateSchema = z.enum(['received']);
export type DocumentCaseState = z.infer<typeof DocumentCaseStateSchema>;

// Input to createDocumentCase. org_id lives on the input (Pattern B
// canonical — see Phase 1 documentPlatformService.createSourceDocument).
// The route-handler's withInvariants wrap validates org_id against
// ctx.caller.org_ids; the service trusts the parsed input.
export const CreateDocumentCaseInputSchema = z.object({
  org_id: z.string().uuid(),
  document_type: DocumentTypeSchema,
});
export type CreateDocumentCaseInputRaw = z.input<typeof CreateDocumentCaseInputSchema>;
export type CreateDocumentCaseInput = z.infer<typeof CreateDocumentCaseInputSchema>;

// Row shape returned by readDocumentCase.
export const DocumentCaseSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  document_type: DocumentTypeSchema,
  state: DocumentCaseStateSchema,
  current_relationship_candidate_id: z.string().uuid().nullable(),
  classification_confidence: z.number().nullable(),
  trace_id: z.string().uuid(),
  // created_at returned by Supabase as ISO 8601 with offset (e.g. '+00:00'),
  // not the Z-suffix form that z.string().datetime() accepts by default.
  // No existing Zod schema in the repo validates timestamptz; trust Supabase
  // and use plain z.string().
  created_at: z.string(),
  // created_by carries 'agent' literal OR <user_id> per ADR-0011 §2 + Phase 1
  // source_documents.created_by precedent (column type is text, not uuid).
  created_by: z.string(),
});
export type DocumentCase = z.infer<typeof DocumentCaseSchema>;
