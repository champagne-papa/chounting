import {
  CreateDocumentCaseInputSchema,
  DocumentCaseSchema,
  TransitionInputSchema,
  type CreateDocumentCaseInputRaw,
  type DocumentCase,
  type TransitionInputRaw,
} from '@/shared/schemas/document-platform/documentCase.schema';
import { adminClient } from '@/db/adminClient';
import { ServiceError } from '@/services/errors/ServiceError';
import { loggerWith } from '@/shared/logger/pino';
import type { ServiceContext } from '@/services/middleware/serviceContext';

// The full 10-state document_case_state membership per ADR-0011 §3,
// independent of the Zod-narrowed chunk-2 DocumentCaseState (4 states).
// Distinct types: DocumentCaseState is the v1-active boundary that
// chunks broaden incrementally; AllCaseStates is the matrix's domain.
type AllCaseStates =
  | 'received' | 'extracting' | 'classified' | 'matched'
  | 'proposed' | 'needs_review' | 'approved' | 'committed'
  | 'rejected' | 'archived';

type TransitionKey = `${AllCaseStates}->${AllCaseStates}`;

// ADR-0011 §3 transition matrix. Service code carries the full
// 10-state matrix even though chunk 2's CHECK only allows 4 states
// to exist in rows; chunks 3+ broaden the CHECK without touching
// this map. Typed against AllCaseStates so mistyped state names
// fail at typecheck.
const LEGAL_TRANSITIONS: Record<AllCaseStates, AllCaseStates[]> = {
  received:     ['extracting'],
  extracting:   ['classified'],
  classified:   ['matched', 'needs_review'],
  matched:      ['proposed', 'needs_review'],
  proposed:     ['approved', 'rejected'],
  needs_review: ['rejected', 'matched', 'proposed', 'classified'],
  approved:     ['committed'],
  committed:    ['archived'],
  rejected:     ['archived'],
  archived:     [],
};

// Transitions that only automation may execute. Chunk 2 ships
// only human transitions; future chunks/phases activate automation
// paths but they remain in this set and are rejected at the human
// service boundary regardless. (Phase 4/7/8 will introduce
// automation-side entry points that bypass this guard.) Typed as
// TransitionKey so mistyped entries fail at typecheck.
const AUTOMATION_ONLY_TRANSITIONS: Set<TransitionKey> = new Set([
  'received->extracting',
  'extracting->classified',
  'classified->matched',
  'classified->needs_review',
  'matched->proposed',
  'matched->needs_review',
  'approved->committed',
  'committed->archived',
  'rejected->archived',
]);

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

export async function transition(
  caseId: string,
  input: TransitionInputRaw,
  ctx: ServiceContext,
): Promise<DocumentCase> {
  const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });

  // Layer 2 boundary: Zod discriminated-union parse.
  let parsed;
  try {
    parsed = TransitionInputSchema.parse(input);
  } catch (err) {
    if (err instanceof Error) {
      throw new ServiceError(
        'READ_FAILED',
        `transition validation failed: ${err.message}`,
      );
    }
    throw err;
  }

  // Read current state.
  const current = await readDocumentCase(caseId, ctx);

  // Layer 3a: matrix legality check.
  const legalTargets = LEGAL_TRANSITIONS[current.state] ?? [];
  if (!legalTargets.includes(parsed.target_state)) {
    throw new ServiceError(
      'INVALID_TRANSITION',
      `Illegal transition: ${current.state} -> ${parsed.target_state} not in ADR-0011 §3 matrix`,
    );
  }

  // Layer 3b: actor-authority check. Automation-only transitions
  // are not callable at the human service boundary.
  const transitionKey: TransitionKey = `${current.state}->${parsed.target_state}`;
  if (AUTOMATION_ONLY_TRANSITIONS.has(transitionKey)) {
    throw new ServiceError(
      'INVALID_TRANSITION',
      `Transition ${transitionKey} is automation-only and not callable from the human service boundary`,
    );
  }

  // Layer 3c: call atomic RPC.
  const db = adminClient();
  const { error } = await db.rpc('update_document_case_state_with_audit', {
    p_case_id: caseId,
    p_target_state: parsed.target_state,
    p_audit: {
      org_id: current.org_id,
      user_id: ctx.caller.user_id,
      trace_id: ctx.trace_id,
      action: 'document_case_transitioned',
      entity_type: 'document_case',
      tool_name: null,
      // parsed.reason is string when target='rejected' (required by Zod);
      // string | undefined when target='approved' (optional). Either way,
      // ?? null coerces to the audit_log.reason nullable text shape.
      reason: parsed.reason ?? null,
    },
  });

  if (error) {
    throw new ServiceError(
      'POST_FAILED',
      `update_document_case_state_with_audit RPC failed: ${error.message}`,
    );
  }

  const result = await readDocumentCase(caseId, ctx);
  log.info(
    {
      document_case_id: result.id,
      from_state: current.state,
      to_state: result.state,
      reason: parsed.reason ?? null,
    },
    'Document case transitioned',
  );
  return result;
}
