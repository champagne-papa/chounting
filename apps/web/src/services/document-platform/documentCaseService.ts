import {
  CreateDocumentCaseInputSchema,
  DocumentCaseSchema,
  type CreateDocumentCaseInputRaw,
  type DocumentCase,
} from '@/shared/schemas/document-platform/documentCase.schema';
import { adminClient } from '@/db/adminClient';
import { ServiceError } from '@/services/errors/ServiceError';
import { loggerWith } from '@/shared/logger/pino';
import type { ServiceContext } from '@/services/middleware/serviceContext';

export async function createDocumentCase(
  input: CreateDocumentCaseInputRaw,
  ctx: ServiceContext,
): Promise<DocumentCase> {
  const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });

  // Layer 2 boundary: Zod parse at service entry.
  let parsed;
  try {
    parsed = CreateDocumentCaseInputSchema.parse(input);
  } catch (err) {
    if (err instanceof Error) {
      throw new ServiceError(
        'READ_FAILED',
        `createDocumentCase validation failed: ${err.message}`,
      );
    }
    throw err;
  }

  const db = adminClient();
  const caseId = crypto.randomUUID();

  // Layer 3: state is always 'received' at chunk 1; service never emits
  // other states. Chunk 2's transition() broadens.
  // tool_name: null — reserved for agent-tool attribution per Phase 1 RPC
  // pattern. Service-method identifier is not the right semantic for this field.
  const { data, error } = await db.rpc('create_document_case_with_audit', {
    p_case: {
      id: caseId,
      org_id: parsed.org_id,
      document_type: parsed.document_type,
      state: 'received',
      trace_id: ctx.trace_id,
      created_by: ctx.caller.user_id,
    },
    p_audit: {
      org_id: parsed.org_id,
      user_id: ctx.caller.user_id,
      trace_id: ctx.trace_id,
      action: 'document_case_created',
      entity_type: 'document_case',
      tool_name: null,
    },
  });

  if (error) {
    throw new ServiceError(
      'POST_FAILED',
      `create_document_case_with_audit RPC failed: ${error.message}`,
    );
  }

  const result = await readDocumentCase(data as string, ctx);
  log.info(
    { document_case_id: result.id, document_type: result.document_type, org_id: result.org_id },
    'Document case created',
  );
  return result;
}

export async function readDocumentCase(
  id: string,
  ctx: ServiceContext,
): Promise<DocumentCase> {
  const db = adminClient();
  const { data, error } = await db
    .from('document_cases')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new ServiceError(
      'NOT_FOUND',
      `readDocumentCase ${id} failed: ${error.message}`,
    );
  }

  const parsed = DocumentCaseSchema.safeParse(data);
  if (!parsed.success) {
    throw new ServiceError(
      'READ_FAILED',
      `readDocumentCase ${id} returned unexpected shape: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}
