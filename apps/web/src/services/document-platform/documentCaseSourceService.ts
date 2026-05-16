import {
  AttachDocumentCaseSourceInputSchema,
  DocumentCaseSourceSchema,
  type AttachDocumentCaseSourceInputRaw,
  type DocumentCaseSource,
} from '@/shared/schemas/document-platform/documentCaseSource.schema';
import { adminClient } from '@/db/adminClient';
import { ServiceError } from '@/services/errors/ServiceError';
import { loggerWith } from '@/shared/logger/pino';
import type { ServiceContext } from '@/services/middleware/serviceContext';

export async function attachDocumentCaseSource(
  input: AttachDocumentCaseSourceInputRaw,
  ctx: ServiceContext,
): Promise<DocumentCaseSource> {
  const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });

  // Layer 2 boundary: Zod parse at service entry.
  let parsed;
  try {
    parsed = AttachDocumentCaseSourceInputSchema.parse(input);
  } catch (err) {
    if (err instanceof Error) {
      throw new ServiceError(
        'READ_FAILED',
        `attachDocumentCaseSource validation failed: ${err.message}`,
      );
    }
    throw err;
  }

  const db = adminClient();
  const linkId = crypto.randomUUID();

  // org_id for the audit_log row is derived INSIDE the RPC via a
  // subquery against document_cases. No service-side lookup. This
  // eliminates the TOCTOU window between "service reads case.org_id"
  // and "RPC inserts link+audit," and guarantees the audit row's
  // org_id is consistent with the case's org_id (single source of
  // truth, same instant). If document_case_id doesn't exist, the FK
  // constraint on document_case_sources.document_case_id fails
  // first; the audit INSERT never fires; service gets POST_FAILED
  // with a foreign-key violation message.
  //
  // tool_name: null — reserved for agent-tool attribution per chunks 1-2.
  const { data, error } = await db.rpc('attach_document_case_source_with_audit', {
    p_link: {
      id: linkId,
      document_case_id: parsed.document_case_id,
      source_document_id: parsed.source_document_id,
      role: parsed.role,
      trace_id: ctx.trace_id,
      created_by: ctx.caller.user_id,
    },
    p_audit: {
      // No org_id — derived inside the RPC.
      user_id: ctx.caller.user_id,
      trace_id: ctx.trace_id,
      action: 'document_case_source_attached',
      entity_type: 'document_case_source',
      tool_name: null,
    },
  });

  if (error) {
    throw new ServiceError(
      'POST_FAILED',
      `attach_document_case_source_with_audit RPC failed: ${error.message}`,
    );
  }

  const result = await readDocumentCaseSource(data as string, ctx);
  log.info(
    {
      document_case_source_id: result.id,
      document_case_id: result.document_case_id,
      source_document_id: result.source_document_id,
      role: result.role,
    },
    'Document case source attached',
  );
  return result;
}

export async function readDocumentCaseSource(
  id: string,
  ctx: ServiceContext,
): Promise<DocumentCaseSource> {
  const db = adminClient();
  const { data, error } = await db
    .from('document_case_sources')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new ServiceError(
      'NOT_FOUND',
      `readDocumentCaseSource ${id} failed: ${error.message}`,
    );
  }

  const parsed = DocumentCaseSourceSchema.safeParse(data);
  if (!parsed.success) {
    throw new ServiceError(
      'READ_FAILED',
      `readDocumentCaseSource ${id} returned unexpected shape: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}
