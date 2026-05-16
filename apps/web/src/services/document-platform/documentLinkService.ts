import {
  CreateSourceDocumentLinkInputSchema,
  ReverseLinkedEntityLinkInputSchema,
  SourceDocumentLinkSchema,
  LINKED_ENTITY_TABLE_MAP,
  type CreateSourceDocumentLinkInputRaw,
  type ReverseLinkedEntityLinkInputRaw,
  type SourceDocumentLink,
  type LinkedEntityType,
} from '@/shared/schemas/document-platform/sourceDocumentLink.schema';
import { adminClient } from '@/db/adminClient';
import { ServiceError } from '@/services/errors/ServiceError';
import { loggerWith } from '@/shared/logger/pino';
import type { ServiceContext } from '@/services/middleware/serviceContext';

// Polymorphic integrity validator. Maps each v1-active
// linked_entity_type to its parent table + PK column via the
// LINKED_ENTITY_TABLE_MAP (exported from the schema file so
// chunks 6+ and Phase 4 Router can reuse). Throws
// ServiceError('LINKED_ENTITY_NOT_FOUND', ...) on miss per
// ADR-0011 §4 constraint 3 + ADR-0016 §4.
async function verifyLinkedEntityExists(
  linkedEntityType: LinkedEntityType,
  linkedEntityId: string,
): Promise<void> {
  const db = adminClient();
  const { table, pkColumn } = LINKED_ENTITY_TABLE_MAP[linkedEntityType];

  const { data, error } = await db
    .from(table)
    .select(pkColumn)
    .eq(pkColumn, linkedEntityId)
    .maybeSingle();

  if (error) {
    throw new ServiceError(
      'READ_FAILED',
      `verifyLinkedEntityExists query against ${table} failed: ${error.message}`,
    );
  }
  if (!data) {
    throw new ServiceError(
      'LINKED_ENTITY_NOT_FOUND',
      `${linkedEntityType} with id ${linkedEntityId} does not exist`,
    );
  }
}

export async function create(
  input: CreateSourceDocumentLinkInputRaw,
  ctx: ServiceContext,
): Promise<SourceDocumentLink> {
  const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });

  // Layer 2 boundary: Zod parse at service entry. The .refine()
  // enforces the 13-pair validity matrix; rejection produces a
  // ZodError whose message identifies the failing pair.
  let parsed;
  try {
    parsed = CreateSourceDocumentLinkInputSchema.parse(input);
  } catch (err) {
    if (err instanceof Error) {
      throw new ServiceError(
        'READ_FAILED',
        `create source_document_link validation failed: ${err.message}`,
      );
    }
    throw err;
  }

  // Layer 3 (a): polymorphic integrity validator. Throws
  // LINKED_ENTITY_NOT_FOUND if the named entity doesn't exist.
  await verifyLinkedEntityExists(parsed.linked_entity_type, parsed.linked_entity_id);

  const db = adminClient();
  const linkId = crypto.randomUUID();

  // RPC call: parent-derived org_id pattern per chunk-3 precedent.
  const { data, error } = await db.rpc('create_source_document_link_with_audit', {
    p_link: {
      id: linkId,
      source_document_id: parsed.source_document_id,
      linked_entity_type: parsed.linked_entity_type,
      linked_entity_id: parsed.linked_entity_id,
      link_role: parsed.link_role,
      trace_id: ctx.trace_id,
      created_by: ctx.caller.user_id,
    },
    p_audit: {
      user_id: ctx.caller.user_id,
      trace_id: ctx.trace_id,
      action: 'source_document_link_created',
      entity_type: 'source_document_link',
      tool_name: null,
    },
  });

  if (error) {
    throw new ServiceError(
      'POST_FAILED',
      `create_source_document_link_with_audit RPC failed: ${error.message}`,
    );
  }

  const result = await readSourceDocumentLink(data as string, ctx);
  log.info(
    {
      source_document_link_id: result.id,
      source_document_id: result.source_document_id,
      linked_entity_type: result.linked_entity_type,
      linked_entity_id: result.linked_entity_id,
      link_role: result.link_role,
    },
    'Source document link created',
  );
  return result;
}

export async function reverseLinkedEntityLink(
  input: ReverseLinkedEntityLinkInputRaw,
  ctx: ServiceContext,
): Promise<SourceDocumentLink[]> {
  const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });

  let parsed;
  try {
    parsed = ReverseLinkedEntityLinkInputSchema.parse(input);
  } catch (err) {
    if (err instanceof Error) {
      throw new ServiceError(
        'READ_FAILED',
        `reverseLinkedEntityLink validation failed: ${err.message}`,
      );
    }
    throw err;
  }

  const db = adminClient();

  // Bulk RPC: flips ALL link_status='created' rows matching
  // (linked_entity_type, linked_entity_id) per ADR-0016 §5.
  // Returns UUID[] of flipped rows (may be empty — no matches).
  const { data: flippedIds, error } = await db.rpc('reverse_source_document_link_with_audit', {
    p_input: {
      linked_entity_type: parsed.linked_entity_type,
      linked_entity_id: parsed.linked_entity_id,
    },
    p_audit: {
      controller_user_id: parsed.controller_user_id,
      reversal_trace_id: parsed.reversal_trace_id,
      reversal_reason: parsed.reversal_reason,
    },
  });

  if (error) {
    throw new ServiceError(
      'POST_FAILED',
      `reverse_source_document_link_with_audit RPC failed: ${error.message}`,
    );
  }

  const ids = (flippedIds as string[] | null) ?? [];
  const results: SourceDocumentLink[] = [];
  for (const id of ids) {
    results.push(await readSourceDocumentLink(id, ctx));
  }

  log.info(
    {
      linked_entity_type: parsed.linked_entity_type,
      linked_entity_id: parsed.linked_entity_id,
      flipped_count: results.length,
    },
    'Source document links reversed (bulk by linked entity)',
  );
  return results;
}

export async function readSourceDocumentLink(
  id: string,
  ctx: ServiceContext,
): Promise<SourceDocumentLink> {
  const db = adminClient();
  const { data, error } = await db
    .from('source_document_links')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new ServiceError(
      'NOT_FOUND',
      `readSourceDocumentLink ${id} failed: ${error.message}`,
    );
  }

  const parsed = SourceDocumentLinkSchema.safeParse(data);
  if (!parsed.success) {
    throw new ServiceError(
      'READ_FAILED',
      `readSourceDocumentLink ${id} returned unexpected shape: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}
