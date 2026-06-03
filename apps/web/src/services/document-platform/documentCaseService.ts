import {
  AdvanceCaseAutomationInputSchema,
  CreateDocumentCaseInputSchema,
  DocumentCaseSchema,
  TransitionInputSchema,
  type AdvanceCaseAutomationInputRaw,
  type CreateDocumentCaseInputRaw,
  type DocumentCase,
  type TransitionInputRaw,
} from '@/shared/schemas/document-platform/documentCase.schema';
import { adminClient } from '@/db/adminClient';
import { ServiceError } from '@/services/errors/ServiceError';
import { loggerWith } from '@/shared/logger/pino';
import {
  actingUserId,
  type ServiceContext,
  type SystemActorServiceContext,
} from '@/services/middleware/serviceContext';

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
  // ctx is unused (signature uniformity); widened for the automation
  // caller (advanceCaseAutomation, Wave 6 D2.1 T2).
  ctx: ServiceContext | SystemActorServiceContext,
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

// ---------------------------------------------------------------------
// Wave 6 D2.1 T2 — automation-side advance (the system-actor sibling of
// transition()).
// ---------------------------------------------------------------------

// The automation-owned slice of the ADR-0011 §3 matrix — EXACTLY the gap
// transitions D2.1 fills (Wave 6 build plan §5, closure (A)).
// classified→{matched, needs_review} are deliberately ABSENT: Subsystem 2
// (documentRouterService.resolveCandidates) owns that segment with its
// rich decision-record audit (set_case_head_pointer_with_audit /
// record_router_decision + enqueueException). Single ownership by
// construction — advanceCaseAutomation REFUSES classified-source advances.
const AUTOMATION_ADVANCE_EDGES: ReadonlyMap<AllCaseStates, AllCaseStates> =
  new Map<AllCaseStates, AllCaseStates>([
    ['received', 'extracting'],
    ['extracting', 'classified'],
    ['matched', 'needs_review'],
  ]);

// Pipeline-forward order for idempotent re-run tolerance: a case at or
// past the requested target is a no-op success (re-ingestion against an
// already-advanced case must not error). Only the automation segment
// (0–4) needs discrimination; human-side / terminal states all rank past
// it.
const PIPELINE_ORDER: Record<AllCaseStates, number> = {
  received: 0,
  extracting: 1,
  classified: 2,
  matched: 3,
  needs_review: 4,
  proposed: 5,
  approved: 6,
  rejected: 6,
  committed: 7,
  archived: 8,
};

/**
 * advanceCaseAutomation — state-aware chain-advance along the
 * automation-owned matrix slice. Reads the current state and advances
 * hop-by-hop (each hop its own audited RPC transaction) until the target
 * is reached; a case already at/past the target is an idempotent no-op.
 *
 * Wave 6 D2.1 T2: ctx admits the orchestrator's SystemActorServiceContext
 * directly, mirroring completeCandidate (documentRouterService.ts) —
 * invoked directly (NOT through withInvariants), so no role-based
 * authorization (Invariant 4) on this path; reads only union-common
 * fields (trace_id, caller.user_id). The system-actor authz story for
 * these STATE-MUTATING transitions: every edge this function can execute
 * is AUTOMATION_ONLY (the human boundary refuses them at transition()
 * Layer 3b), so the pipeline orchestrator running as a system actor is
 * the designed caller class; audit attribution uses actingUserId(ctx)
 * (ADR-0007 Q78 Path X — system actors write the joinable
 * service-account id, not null); org-scoping derives from the parent
 * document_cases row (audit org_id = the case's own org_id; the RPC
 * locks the row FOR UPDATE). See ADR-0007 §Tier 2.
 */
export async function advanceCaseAutomation(
  input: AdvanceCaseAutomationInputRaw,
  ctx: ServiceContext | SystemActorServiceContext,
): Promise<DocumentCase> {
  const log = loggerWith({
    trace_id: ctx.trace_id,
    // user_id is string|null under the widened union; loggerWith wants
    // string|undefined — the `?? undefined` shape per the N=2 precedent
    // (vendorService.ts:128, documentRouterService.ts:779).
    user_id: ctx.caller.user_id ?? undefined,
  });

  // Layer 2 boundary: Zod parse (.strict()).
  let parsed;
  try {
    parsed = AdvanceCaseAutomationInputSchema.parse(input);
  } catch (err) {
    if (err instanceof Error) {
      throw new ServiceError(
        'READ_FAILED',
        `advanceCaseAutomation validation failed: ${err.message}`,
      );
    }
    throw err;
  }

  const current = await readDocumentCase(parsed.document_case_id, ctx);
  const target = parsed.target_state;

  // Idempotent re-run tolerance: at/past target → no-op success.
  if (PIPELINE_ORDER[current.state] >= PIPELINE_ORDER[target]) {
    log.info(
      {
        document_case_id: current.id,
        state: current.state,
        target_state: target,
      },
      'advanceCaseAutomation no-op: case at/past target',
    );
    return current;
  }

  // Compute the hop path along the automation-owned edges. A walk that
  // dead-ends (no automation edge from the cursor) means the path crosses
  // a segment this function does not own.
  const hops: Array<{ from: AllCaseStates; to: AllCaseStates }> = [];
  let cursor: AllCaseStates = current.state;
  while (cursor !== target) {
    const next = AUTOMATION_ADVANCE_EDGES.get(cursor);
    if (!next) {
      throw new ServiceError(
        'INVALID_TRANSITION',
        cursor === 'classified'
          ? `advanceCaseAutomation refuses classified→${target}: the ` +
            `classified→{matched,needs_review} segment is owned by ` +
            `Subsystem 2 (documentRouterService.resolveCandidates) — ` +
            `single ownership by construction`
          : `advanceCaseAutomation: no automation-owned path from ` +
            `${current.state} to ${target} (owned edges: ` +
            `received→extracting→classified, matched→needs_review)`,
      );
    }
    // Defense in depth: every owned edge must also be matrix-legal.
    if (!(LEGAL_TRANSITIONS[cursor] ?? []).includes(next)) {
      throw new ServiceError(
        'INVALID_TRANSITION',
        `advanceCaseAutomation: edge ${cursor}->${next} not in ADR-0011 §3 matrix`,
      );
    }
    hops.push({ from: cursor, to: next });
    cursor = next;
  }

  // Execute hop-by-hop: each hop its own audited RPC transaction (the
  // post-hoc at-decision chain per the D2.1 brief; a mid-chain crash
  // strands the case at the last persisted state — a named
  // INV-WORKFLOW-002 residual, sweep-recoverable).
  const db = adminClient();
  for (const hop of hops) {
    const { error } = await db.rpc('update_document_case_state_with_audit', {
      p_case_id: current.id,
      p_target_state: hop.to,
      p_audit: {
        org_id: current.org_id,
        // Attribution per ADR-0007 Q78 Path X: humans → user_id; system
        // actors → the service-account system_user_id (joinable identity,
        // not null) via actingUserId.
        user_id: actingUserId(ctx),
        trace_id: ctx.trace_id,
        action: 'document_case_transitioned',
        entity_type: 'document_case',
        tool_name: null,
        reason: null,
      },
    });
    if (error) {
      throw new ServiceError(
        'POST_FAILED',
        `advanceCaseAutomation ${hop.from}->${hop.to} RPC failed: ${error.message}`,
      );
    }
  }

  const result = await readDocumentCase(current.id, ctx);
  log.info(
    {
      document_case_id: result.id,
      from_state: current.state,
      to_state: result.state,
      hops: hops.length,
    },
    'Document case advanced (automation)',
  );
  return result;
}
