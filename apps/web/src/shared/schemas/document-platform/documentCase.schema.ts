import { z } from 'zod';
import { TimestamptzString } from '@/shared/schemas/common.schema';

// Layer 2 boundary: v1-active subsets only.
// Reserved values defined in DB enum but rejected here.

export const DocumentTypeSchema = z.enum([
  'vendor_invoice',
  'receipt',
  'payment_confirmation',
  'unknown',
]);
export type DocumentType = z.infer<typeof DocumentTypeSchema>;

// v1-active subset, broadened incrementally per ADR-0011 §3 matrix:
// chunk-2-Phase-2 admitted 4 values; chunk-6-Phase-2 added 'classified'
// + 'needs_review' (document_cases_state_chunk_6_active CHECK);
// chunk-2-Phase-4 adds 'matched' for the classified → matched
// transition emitted by Subsystem 2 branch (a) per ADR-0018 §item 3
// (document_cases_state_chunk_7_active CHECK; first cross-phase
// substrate modification at chunks-1-6 per F-J-θ); Wave-6-D2.1 adds
// 'extracting' for pipeline matrix-advancement
// (document_cases_state_chunk_8_active CHECK; second cross-phase
// broaden — versioned-CHECK naming discipline codified at
// docs/04_engineering/conventions/migrations.md §"Versioned-CHECK
// constraint naming"). The Zod boundary mirrors the Layer 1 CHECK
// admission set verbatim.
//
// Still reserved at Layer 1 + Layer 2 (CHECK-rejected; Zod-rejected):
// committed / archived. Future chunks broaden.
export const DocumentCaseStateSchema = z.enum([
  'received',
  'extracting',
  'classified',
  'needs_review',
  'matched',
  'proposed',
  'approved',
  'rejected',
]);
export type DocumentCaseState = z.infer<typeof DocumentCaseStateSchema>;

// transition() input. Discriminated union: target_state determines
// whether reason is required. Mirrors Phase 5 billService.reverse's
// reversal_reason pattern for the rejection path.
export const TransitionInputSchema = z.discriminatedUnion('target_state', [
  z.object({
    target_state: z.literal('approved'),
    reason: z.string().optional(),
  }),
  z.object({
    target_state: z.literal('rejected'),
    reason: z.string().min(1, 'reason is required when target_state is rejected'),
  }),
]);
export type TransitionInputRaw = z.input<typeof TransitionInputSchema>;
export type TransitionInput = z.infer<typeof TransitionInputSchema>;

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
  created_at: TimestamptzString,
  // created_by carries 'agent' literal OR <user_id> per ADR-0011 §2 + Phase 1
  // source_documents.created_by precedent (column type is text, not uuid).
  created_by: z.string(),
});
export type DocumentCase = z.infer<typeof DocumentCaseSchema>;
