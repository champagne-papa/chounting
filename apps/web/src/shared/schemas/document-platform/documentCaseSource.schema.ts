import { z } from 'zod';
import { TimestamptzString } from '@/shared/schemas/common.schema';

// Layer 2 boundary: v1-active subsets only.
// Reserved values defined in DB enum but rejected here.

export const DocumentCaseSourceRoleSchema = z.enum([
  'primary',
  'supporting',
  'email_body',
  'payment_evidence',
]);
export type DocumentCaseSourceRole = z.infer<typeof DocumentCaseSourceRoleSchema>;

// Input to attachDocumentCaseSource. The route-handler's withInvariants
// wrap is responsible for validating that ctx.caller.org_ids permits
// the case's org_id (chunk 3 doesn't ship a route handler; tests
// exercise the service directly).
export const AttachDocumentCaseSourceInputSchema = z.object({
  document_case_id: z.string().uuid(),
  source_document_id: z.string().uuid(),
  role: DocumentCaseSourceRoleSchema,
});
export type AttachDocumentCaseSourceInputRaw = z.input<typeof AttachDocumentCaseSourceInputSchema>;
export type AttachDocumentCaseSourceInput = z.infer<typeof AttachDocumentCaseSourceInputSchema>;

// Row shape returned by readDocumentCaseSource.
export const DocumentCaseSourceSchema = z.object({
  id: z.string().uuid(),
  document_case_id: z.string().uuid(),
  source_document_id: z.string().uuid(),
  role: DocumentCaseSourceRoleSchema,
  trace_id: z.string().uuid(),
  created_at: TimestamptzString,
  // created_by carries 'agent' literal OR <user_id> per ADR-0011 §2 +
  // Phase 1 source_documents.created_by precedent (column is text).
  created_by: z.string(),
});
export type DocumentCaseSource = z.infer<typeof DocumentCaseSourceSchema>;
