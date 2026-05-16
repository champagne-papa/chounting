import {
  EnqueueExceptionInputSchema,
  ResolveExceptionInputSchema,
  ExceptionQueueEntrySchema,
  type EnqueueExceptionInputRaw,
  type ResolveExceptionInputRaw,
  type ExceptionQueueEntry,
} from '@/shared/schemas/document-platform/exceptionQueueEntry.schema';
import { adminClient } from '@/db/adminClient';
import { ServiceError } from '@/services/errors/ServiceError';
import { loggerWith } from '@/shared/logger/pino';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { dispatchTrigger } from '@/services/document-platform/documentRouterService';

// Pattern B unwrapped service per chunks 1-3 + 5 precedent.
// Three exported functions: enqueueException, resolveException,
// readExceptionQueueEntry.
//
// Atomic semantics live in the two RPCs (enqueue_exception_with_audit,
// resolve_exception_with_audit) per ADR-0011 §13 + chunk-3+ canonical
// parent-derived-org_id pattern. Service maps Postgres ERRCODEs to
// typed ServiceErrors:
//   - 23505 (unique_violation) on
//     exception_queue_entries_open_per_case_idx → EXCEPTION_ALREADY_OPEN
//   - 23514 (check_violation) from the RPC's RAISE EXCEPTION on
//     wrong source-state at enqueue or wrong status at resolve →
//     INVALID_TRANSITION
//   - 0A000 (feature_not_supported) from §6(b) trigger on
//     resolved → anything regression → INVALID_TRANSITION
//   - Other errors → POST_FAILED (chunks 1-5 generic catchall)

export async function enqueueException(
  input: EnqueueExceptionInputRaw,
  ctx: ServiceContext,
): Promise<ExceptionQueueEntry> {
  const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });

  // Layer 2 boundary: Zod parse at service entry.
  let parsed;
  try {
    parsed = EnqueueExceptionInputSchema.parse(input);
  } catch (err) {
    if (err instanceof Error) {
      throw new ServiceError(
        'READ_FAILED',
        `enqueueException validation failed: ${err.message}`,
      );
    }
    throw err;
  }

  const db = adminClient();

  // RPC call: atomic INSERT queue entry + UPDATE document_case state
  // (classified|matched → needs_review) + INSERT audit_log. org_id
  // is parent-derived inside the RPC (chunks 3-5+ canonical pattern).
  const { data, error } = await db.rpc('enqueue_exception_with_audit', {
    p_entry: {
      document_case_id: parsed.document_case_id,
      source_document_id: parsed.source_document_id ?? null,
      exception_reason: parsed.exception_reason,
      trace_id: ctx.trace_id,
      created_by: parsed.created_by ?? ctx.caller.user_id,
    },
    p_audit: {
      user_id: ctx.caller.user_id,
      trace_id: ctx.trace_id,
      action: 'exception_enqueued',
      entity_type: 'exception_queue_entry',
      tool_name: null,
    },
  });

  if (error) {
    // unique_violation on partial UNIQUE index = duplicate open
    // exception for the same case.
    if (error.code === '23505') {
      throw new ServiceError(
        'EXCEPTION_ALREADY_OPEN',
        `enqueueException: document_case ${parsed.document_case_id} already has an open exception (partial UNIQUE on exception_queue_entries_open_per_case_idx)`,
      );
    }
    // check_violation = wrong source state for the transition.
    if (error.code === '23514') {
      throw new ServiceError(
        'INVALID_TRANSITION',
        `enqueueException: ${error.message}`,
      );
    }
    throw new ServiceError(
      'POST_FAILED',
      `enqueue_exception_with_audit RPC failed: ${error.message}`,
    );
  }

  const result = await readExceptionQueueEntry(data as string, ctx);
  log.info(
    {
      exception_queue_entry_id: result.exception_queue_entry_id,
      document_case_id: result.document_case_id,
      exception_reason: result.exception_reason,
    },
    'Exception enqueued',
  );
  return result;
}

export async function resolveException(
  input: ResolveExceptionInputRaw,
  ctx: ServiceContext,
): Promise<ExceptionQueueEntry> {
  const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });

  // Layer 2 boundary: Zod parse at service entry. Layer 2 rejects
  // reserved resolution_action values; Layer 1 CHECK is the last-
  // line defense.
  let parsed;
  try {
    parsed = ResolveExceptionInputSchema.parse(input);
  } catch (err) {
    if (err instanceof Error) {
      throw new ServiceError(
        'READ_FAILED',
        `resolveException validation failed: ${err.message}`,
      );
    }
    throw err;
  }

  const db = adminClient();

  // RPC call: atomic UPDATE queue entry + UPDATE document_case
  // (terminal state per 9-action mapping) + INSERT audit_log.
  const { error } = await db.rpc('resolve_exception_with_audit', {
    p_entry_id: parsed.exception_queue_entry_id,
    p_resolution: {
      resolution_action: parsed.resolution_action,
      resolution_notes: parsed.resolution_notes ?? null,
      resolved_by: parsed.resolved_by,
    },
    p_audit: {
      user_id: ctx.caller.user_id,
      trace_id: ctx.trace_id,
      action: 'exception_resolved',
      entity_type: 'exception_queue_entry',
      tool_name: null,
    },
  });

  if (error) {
    // check_violation = wrong status at resolve (already resolved,
    // etc.) OR reserved-value-leak (shouldn't reach since Layer 2
    // Zod rejects).
    if (error.code === '23514') {
      throw new ServiceError(
        'INVALID_TRANSITION',
        `resolveException: ${error.message}`,
      );
    }
    // feature_not_supported = §6(b) trigger on resolved → anything
    // regression (defense-in-depth; Layer 1 CHECK also catches).
    if (error.code === '0A000') {
      throw new ServiceError(
        'INVALID_TRANSITION',
        `resolveException: ${error.message}`,
      );
    }
    throw new ServiceError(
      'POST_FAILED',
      `resolve_exception_with_audit RPC failed: ${error.message}`,
    );
  }

  const result = await readExceptionQueueEntry(parsed.exception_queue_entry_id, ctx);
  log.info(
    {
      exception_queue_entry_id: result.exception_queue_entry_id,
      document_case_id: result.document_case_id,
      resolution_action: result.resolution_action,
      exception_status: result.exception_status,
    },
    'Exception resolved',
  );

  // T10_manual_override dispatch per ADR-0018 §item 4 + Framing F.
  // Pattern B external-wrap variant (F-J-11): dispatch hook lands at
  // end of function body after primary writes commit, before return.
  // NO try/catch — fail-and-propagate per Round 5.b-i (F-J-5
  // per-trigger-type failure policy): T10 is caller-driven; the
  // caller (route handler invoking resolveException) wants to know
  // if the reprocess succeeded. Conditional emission on
  // result.resolution_action === 'reprocess' (other actions do not
  // re-route).
  if (result.resolution_action === 'reprocess') {
    await dispatchTrigger(
      {
        trigger_type: 'T10_manual_override',
        org_id: result.org_id,
        case_id: result.document_case_id,
        trace_id: ctx.trace_id,
      },
      ctx,
    );
  }

  return result;
}

export async function readExceptionQueueEntry(
  id: string,
  ctx: ServiceContext,
): Promise<ExceptionQueueEntry> {
  const db = adminClient();
  const { data, error } = await db
    .from('exception_queue_entries')
    .select('*')
    .eq('exception_queue_entry_id', id)
    .single();

  if (error) {
    throw new ServiceError(
      'NOT_FOUND',
      `readExceptionQueueEntry ${id} failed: ${error.message}`,
    );
  }

  const parsed = ExceptionQueueEntrySchema.safeParse(data);
  if (!parsed.success) {
    throw new ServiceError(
      'READ_FAILED',
      `readExceptionQueueEntry ${id} returned unexpected shape: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}
