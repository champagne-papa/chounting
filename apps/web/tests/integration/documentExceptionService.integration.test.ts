import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { adminClient, userClientFor, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import {
  enqueueException,
  resolveException,
  readExceptionQueueEntry,
} from '@/services/document-platform/documentExceptionService';
import {
  createDocumentCase,
  readDocumentCase,
} from '@/services/document-platform/documentCaseService';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import type { ResolutionAction } from '@/shared/schemas/document-platform/exceptionQueueEntry.schema';

// Helper: create a document_case via the chunk-1 service, then
// direct-admin-UPDATE its state to 'classified' (chunk-6 broadening
// admits 'classified' at Layer 1; chunk-2's transition() service
// rejects received → classified because it's AUTOMATION_ONLY).
// This bypasses the chunk-2 service to set up the chunk-6 enqueue
// source state.
async function buildClassifiedCaseFixture(
  orgId: string,
  ctx: ServiceContext,
): Promise<string> {
  const created = await createDocumentCase(
    { org_id: orgId, document_type: 'vendor_invoice' },
    ctx,
  );
  const db = adminClient();
  const { error } = await db
    .from('document_cases')
    .update({ state: 'classified' })
    .eq('id', created.id);
  if (error) throw new Error(`buildClassifiedCaseFixture failed: ${error.message}`);
  return created.id;
}

describe('exception_queue_entries happy chain + 9-action terminal-state mapping (chunk 6)', () => {
  let ctx: ServiceContext;

  beforeAll(async () => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('happy chain: enqueue + resolve(reprocess) round-trips with audit_log rows + case state classified → needs_review → classified', async () => {
    const caseId = await buildClassifiedCaseFixture(SEED.ORG_HOLDING, ctx);

    const entry = await enqueueException(
      {
        document_case_id: caseId,
        exception_reason: 'low_confidence_classification',
        trace_id: ctx.trace_id,
      },
      ctx,
    );

    expect(entry.document_case_id).toBe(caseId);
    expect(entry.exception_reason).toBe('low_confidence_classification');
    expect(entry.exception_status).toBe('open');
    expect(entry.resolution_action).toBeNull();
    expect(entry.org_id).toBe(SEED.ORG_HOLDING);

    const caseAfterEnqueue = await readDocumentCase(caseId, ctx);
    expect(caseAfterEnqueue.state).toBe('needs_review');

    const db = adminClient();
    const { data: enqueueAudit } = await db
      .from('audit_log')
      .select('*')
      .eq('trace_id', ctx.trace_id)
      .eq('entity_id', entry.exception_queue_entry_id)
      .eq('action', 'exception_enqueued');
    expect(enqueueAudit).toHaveLength(1);
    expect(enqueueAudit![0].entity_type).toBe('exception_queue_entry');

    const resolved = await resolveException(
      {
        exception_queue_entry_id: entry.exception_queue_entry_id,
        resolution_action: 'reprocess',
        resolution_notes: 'manual reprocess test',
        resolved_by: ctx.caller.user_id,
      },
      ctx,
    );

    expect(resolved.exception_status).toBe('resolved');
    expect(resolved.resolution_action).toBe('reprocess');
    expect(resolved.resolution_notes).toBe('manual reprocess test');
    expect(resolved.resolved_at).not.toBeNull();
    expect(resolved.resolved_by).toBe(ctx.caller.user_id);

    const caseAfterResolve = await readDocumentCase(caseId, ctx);
    expect(caseAfterResolve.state).toBe('classified');

    const { data: resolveAudit } = await db
      .from('audit_log')
      .select('*')
      .eq('trace_id', ctx.trace_id)
      .eq('entity_id', entry.exception_queue_entry_id)
      .eq('action', 'exception_resolved');
    expect(resolveAudit).toHaveLength(1);
    expect(resolveAudit![0].entity_type).toBe('exception_queue_entry');
    expect(resolveAudit![0].before_state).toMatchObject({
      exception_status: 'open',
      document_case_state: 'needs_review',
    });

    const reread = await readExceptionQueueEntry(entry.exception_queue_entry_id, ctx);
    expect(reread.exception_status).toBe('resolved');
  });

  // Per-action terminal-state mapping tests. One per v1-active
  // resolution_action. This is the highest-risk transcription
  // surface — one mis-mapped action means one wrong production
  // behavior. See chunk-6 brief 9-action mapping table.
  const TERMINAL_STATE_MAPPING: Array<{
    action: ResolutionAction;
    terminal: 'proposed' | 'rejected' | 'classified';
  }> = [
    { action: 'attach_to_existing_bill',    terminal: 'proposed' },
    { action: 'attach_to_existing_payment', terminal: 'proposed' },
    { action: 'record_bill_payment',        terminal: 'proposed' },
    { action: 'route_to_manual_entry',      terminal: 'proposed' },
    { action: 'manual_born_paid_workflow',  terminal: 'proposed' },
    { action: 'mark_duplicate',             terminal: 'rejected' },
    { action: 'mark_non_accounting',        terminal: 'rejected' },
    { action: 'archive',                    terminal: 'rejected' },
    // 'reprocess' covered in happy-chain test above.
  ];

  for (const { action, terminal } of TERMINAL_STATE_MAPPING) {
    it(`terminal-state mapping: resolution_action='${action}' → document_case.state='${terminal}'`, async () => {
      const caseId = await buildClassifiedCaseFixture(SEED.ORG_HOLDING, ctx);

      const entry = await enqueueException(
        {
          document_case_id: caseId,
          exception_reason: 'manual_route',
          trace_id: ctx.trace_id,
        },
        ctx,
      );

      const resolved = await resolveException(
        {
          exception_queue_entry_id: entry.exception_queue_entry_id,
          resolution_action: action,
          resolved_by: ctx.caller.user_id,
        },
        ctx,
      );

      expect(resolved.resolution_action).toBe(action);
      const caseAfter = await readDocumentCase(caseId, ctx);
      expect(caseAfter.state).toBe(terminal);
    });
  }

  it('N=4 partial UNIQUE sequence: enqueue → fail-second-enqueue → resolve → re-enqueue succeeds', async () => {
    const caseId = await buildClassifiedCaseFixture(SEED.ORG_HOLDING, ctx);

    // (1) enqueue case_X with reason_A → open exception created
    const first = await enqueueException(
      {
        document_case_id: caseId,
        exception_reason: 'low_confidence_classification',
        trace_id: ctx.trace_id,
      },
      ctx,
    );
    expect(first.exception_status).toBe('open');

    // (2) enqueue case_X with reason_B → EXCEPTION_ALREADY_OPEN
    // (partial UNIQUE on document_case_id WHERE exception_status='open')
    await expect(
      enqueueException(
        {
          document_case_id: caseId,
          exception_reason: 'multi_candidate_ambiguity',
          trace_id: ctx.trace_id,
        },
        ctx,
      ),
    ).rejects.toMatchObject({
      code: 'EXCEPTION_ALREADY_OPEN',
    });

    // (3) resolve first entry → status flips to resolved;
    // partial-index entry drops automatically
    await resolveException(
      {
        exception_queue_entry_id: first.exception_queue_entry_id,
        resolution_action: 'archive',
        resolved_by: ctx.caller.user_id,
      },
      ctx,
    );

    // Case is now in 'rejected' state per archive → rejected
    // mapping. Re-enqueue requires source state classified | matched
    // per the chunk-6 enqueue RPC. Re-route the case back to
    // 'classified' via admin UPDATE to set up the re-enqueue test.
    const db = adminClient();
    await db
      .from('document_cases')
      .update({ state: 'classified' })
      .eq('id', caseId);

    // (4) re-enqueue case_X with reason_B → succeeds; case has
    // 1 historical resolved + 1 new open
    const second = await enqueueException(
      {
        document_case_id: caseId,
        exception_reason: 'multi_candidate_ambiguity',
        trace_id: ctx.trace_id,
      },
      ctx,
    );
    expect(second.exception_status).toBe('open');
    expect(second.exception_queue_entry_id).not.toBe(first.exception_queue_entry_id);

    // Both entries exist for the same case_id; one resolved + one open.
    const { data: allEntries } = await db
      .from('exception_queue_entries')
      .select('exception_queue_entry_id, exception_status')
      .eq('document_case_id', caseId);
    expect(allEntries).toHaveLength(2);
    const statuses = (allEntries ?? []).map((r) => r.exception_status as string).sort();
    expect(statuses).toEqual(['open', 'resolved']);
  });
});

describe('exception_queue_entries Layer 1 DB CHECK + §6(b) trigger (chunk 6)', () => {
  let ctx: ServiceContext;
  let caseId: string;
  let entryId: string;

  beforeAll(async () => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    caseId = await buildClassifiedCaseFixture(SEED.ORG_HOLDING, ctx);
    const entry = await enqueueException(
      {
        document_case_id: caseId,
        exception_reason: 'invariant_violation',
        trace_id: ctx.trace_id,
      },
      ctx,
    );
    entryId = entry.exception_queue_entry_id;
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('DB CHECK rejects reserved resolution_action when service is bypassed (Layer 1)', async () => {
    const db = adminClient();
    const { error } = await db
      .from('exception_queue_entries')
      .update({ resolution_action: 'create_bill' }) // reserved per ADR-0010
      .eq('exception_queue_entry_id', entryId);
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/resolution_action_chunk_\d+_active/);
  });

  it('DB CHECK admits cancelled exception_status after chunk-3 broadening (Layer 1)', async () => {
    // Chunk-3 broadened exception_status_chunk_6_active →
    // exception_status_chunk_8_active admitting 'cancelled' per
    // Round 4.a (α-iii) arc-extended-lifecycle-sequence codification.
    // chunk-6's original "reserved 'cancelled' rejected" assertion no
    // longer holds; all 3 exception_status enum values are now v1-active.
    // Converted to positive assertion verifying the broadening shipped.
    const db = adminClient();
    const freshCase = await buildClassifiedCaseFixture(SEED.ORG_HOLDING, ctx);
    const { error } = await db.from('exception_queue_entries').insert({
      org_id: SEED.ORG_HOLDING,
      document_case_id: freshCase,
      exception_reason: 'manual_route',
      exception_status: 'cancelled',
      trace_id: ctx.trace_id,
      created_by: ctx.caller.user_id,
    });
    expect(error).toBeNull();
  });

  it('DB CHECK rejects reserved exception_reason when service is bypassed (Layer 1)', async () => {
    const db = adminClient();
    const freshCase = await buildClassifiedCaseFixture(SEED.ORG_HOLDING, ctx);
    const { error } = await db.from('exception_queue_entries').insert({
      org_id: SEED.ORG_HOLDING,
      document_case_id: freshCase,
      exception_reason: 'wrong_entity_exception', // reserved per ADR-0011 §10
      trace_id: ctx.trace_id,
      created_by: ctx.caller.user_id,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/exception_reason_chunk_\d+_active/);
  });

  it('§6(b) trigger rejects resolved → open regression (one-way exception_status)', async () => {
    const freshCase = await buildClassifiedCaseFixture(SEED.ORG_HOLDING, ctx);
    const entry = await enqueueException(
      {
        document_case_id: freshCase,
        exception_reason: 'manual_route',
        trace_id: ctx.trace_id,
      },
      ctx,
    );
    await resolveException(
      {
        exception_queue_entry_id: entry.exception_queue_entry_id,
        resolution_action: 'archive',
        resolved_by: ctx.caller.user_id,
      },
      ctx,
    );

    // Attempt admin UPDATE: resolved → open. Should be rejected by
    // §6(b) trigger (one-way exception_status).
    const db = adminClient();
    const { error } = await db
      .from('exception_queue_entries')
      .update({ exception_status: 'open' })
      .eq('exception_queue_entry_id', entry.exception_queue_entry_id);
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/one-way|forbidden|resolved/i);
  });
});

describe('exception_queue_entries Layer 2 Zod (chunk 6)', () => {
  let ctx: ServiceContext;

  beforeAll(async () => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('Zod rejects reserved resolution_action at Layer 2', async () => {
    const caseId = await buildClassifiedCaseFixture(SEED.ORG_HOLDING, ctx);
    const entry = await enqueueException(
      {
        document_case_id: caseId,
        exception_reason: 'manual_route',
        trace_id: ctx.trace_id,
      },
      ctx,
    );

    await expect(
      resolveException(
        {
          exception_queue_entry_id: entry.exception_queue_entry_id,
          // @ts-expect-error -- reserved value per ADR-0010
          resolution_action: 'create_bill',
          resolved_by: ctx.caller.user_id,
        },
        ctx,
      ),
    ).rejects.toMatchObject({
      code: 'READ_FAILED',
      message: expect.stringContaining('resolution_action'),
    });
  });

  it('Zod rejects reserved exception_reason at Layer 2', async () => {
    const caseId = await buildClassifiedCaseFixture(SEED.ORG_HOLDING, ctx);

    await expect(
      enqueueException(
        {
          document_case_id: caseId,
          // @ts-expect-error -- reserved value per ADR-0011 §10
          exception_reason: 'wrong_entity_exception',
          trace_id: ctx.trace_id,
        },
        ctx,
      ),
    ).rejects.toMatchObject({
      code: 'READ_FAILED',
      message: expect.stringContaining('exception_reason'),
    });
  });
});

describe('exception_queue_entries service-layer error mappings (chunk 6)', () => {
  let ctx: ServiceContext;

  beforeAll(async () => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('INVALID_TRANSITION on enqueue against case in wrong source state (received, not classified|matched)', async () => {
    // Create case in 'received' state (no admin UPDATE to classified).
    const created = await createDocumentCase(
      { org_id: SEED.ORG_HOLDING, document_type: 'vendor_invoice' },
      ctx,
    );

    await expect(
      enqueueException(
        {
          document_case_id: created.id,
          exception_reason: 'manual_route',
          trace_id: ctx.trace_id,
        },
        ctx,
      ),
    ).rejects.toMatchObject({
      code: 'INVALID_TRANSITION',
    });
  });

  it('INVALID_TRANSITION on resolve-already-resolved (status flipped post-resolve)', async () => {
    const caseId = await buildClassifiedCaseFixture(SEED.ORG_HOLDING, ctx);
    const entry = await enqueueException(
      {
        document_case_id: caseId,
        exception_reason: 'manual_route',
        trace_id: ctx.trace_id,
      },
      ctx,
    );
    await resolveException(
      {
        exception_queue_entry_id: entry.exception_queue_entry_id,
        resolution_action: 'archive',
        resolved_by: ctx.caller.user_id,
      },
      ctx,
    );

    // Second resolve on the same entry should reject.
    await expect(
      resolveException(
        {
          exception_queue_entry_id: entry.exception_queue_entry_id,
          resolution_action: 'mark_duplicate',
          resolved_by: ctx.caller.user_id,
        },
        ctx,
      ),
    ).rejects.toMatchObject({
      code: 'INVALID_TRANSITION',
    });
  });
});

describe('exception_queue_entries direct-org_id RLS + RPC atomicity + chunk-6 CHECK broadening (chunk 6)', () => {
  let ctx: ServiceContext;
  let apClient: SupabaseClient;
  let caseId: string;
  let entryId: string;

  beforeAll(async () => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    caseId = await buildClassifiedCaseFixture(SEED.ORG_HOLDING, ctx);
    const entry = await enqueueException(
      {
        document_case_id: caseId,
        exception_reason: 'manual_route',
        trace_id: ctx.trace_id,
      },
      ctx,
    );
    entryId = entry.exception_queue_entry_id;

    apClient = await userClientFor('ap@thebridge.local', 'DevSeed!ApSpec#1');
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('direct-org_id RLS: cross-org AP user cannot SELECT exception_queue_entries from ORG_HOLDING', async () => {
    // AP user has access to ORG_REAL_ESTATE only (per chunks-3-5
    // RLS test precedent). ORG_HOLDING entries should not be
    // visible.
    const { data: adminRows } = await adminClient()
      .from('exception_queue_entries')
      .select('exception_queue_entry_id')
      .eq('exception_queue_entry_id', entryId);
    expect(adminRows).toHaveLength(1);

    const { data: apRows, error: apReadErr } = await apClient
      .from('exception_queue_entries')
      .select('exception_queue_entry_id')
      .eq('exception_queue_entry_id', entryId);
    expect(apReadErr).toBeNull();
    expect(apRows).toHaveLength(0);
  });

  it('RPC atomicity: enqueue rolls back when audit_log INSERT fails (FK violation on user_id)', async () => {
    const db = adminClient();
    const freshCase = await buildClassifiedCaseFixture(SEED.ORG_HOLDING, ctx);
    const bogusUserId = '00000000-0000-0000-0000-deadbeefcafe';

    const { error } = await db.rpc('enqueue_exception_with_audit', {
      p_entry: {
        document_case_id: freshCase,
        source_document_id: null,
        exception_reason: 'manual_route',
        trace_id: ctx.trace_id,
        created_by: ctx.caller.user_id,
      },
      p_audit: {
        user_id: bogusUserId, // not in auth.users → FK violation
        trace_id: ctx.trace_id,
        action: 'exception_enqueued',
        entity_type: 'exception_queue_entry',
      },
    });

    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/foreign key|violates/i);

    // No exception_queue_entries row should exist for freshCase.
    const { data: entries } = await db
      .from('exception_queue_entries')
      .select('exception_queue_entry_id')
      .eq('document_case_id', freshCase);
    expect(entries).toHaveLength(0);

    // Case state should still be 'classified' (rollback also reverts
    // the state UPDATE — atomic RPC semantics).
    const caseAfterRollback = await readDocumentCase(freshCase, ctx);
    expect(caseAfterRollback.state).toBe('classified');
  });

  it('chunk-6 CHECK broadening: document_cases.state admits needs_review and classified post-chunk-6', async () => {
    // The chunk-6 migration broadens document_cases_state_chunk_2_active
    // (4 values) to document_cases_state_chunk_6_active (6 values
    // adding needs_review + classified). Chunk-2-Phase-4 further broadens
    // to document_cases_state_chunk_7_active (7 values adding 'matched').
    // Direct admin INSERT or UPDATE to these admitted states should
    // succeed.
    const created = await createDocumentCase(
      { org_id: SEED.ORG_HOLDING, document_type: 'vendor_invoice' },
      ctx,
    );

    const db = adminClient();
    const { error: classifiedErr } = await db
      .from('document_cases')
      .update({ state: 'classified' })
      .eq('id', created.id);
    expect(classifiedErr).toBeNull();

    const { error: needsReviewErr } = await db
      .from('document_cases')
      .update({ state: 'needs_review' })
      .eq('id', created.id);
    expect(needsReviewErr).toBeNull();

    // Still-reserved-at-Layer-1 states (extracting, committed, archived)
    // remain CHECK-rejected post-chunk-2-Phase-4. 'matched' was admitted
    // by chunk-2-Phase-4 (Subsystem 2 branch (a) state-transition target);
    // pick a still-reserved state for the rejection assertion to keep the
    // test forward-compat across future broadening events.
    const { error: reservedErr } = await db
      .from('document_cases')
      .update({ state: 'extracting' })
      .eq('id', created.id);
    expect(reservedErr).not.toBeNull();
    expect(reservedErr!.message).toMatch(/document_cases_state_chunk_\d+_active/);
  });

  it('LEGAL_TRANSITIONS broadening: chunk-6 resolve(reprocess) flips case state from needs_review to classified', async () => {
    // This implicitly tests the LEGAL_TRANSITIONS broadening at the
    // chunk-6 RPC layer: the per-action terminal-state mapping in
    // resolve_exception_with_audit produces case state 'classified'
    // for resolution_action='reprocess', and Layer 1 CHECK admits
    // the target state. The chunk-2 service-layer LEGAL_TRANSITIONS
    // table broadening (adding 'classified' to needs_review exits)
    // is documentary at chunk 6 since chunk-2's transition() Zod
    // input schema doesn't admit 'classified' as a target_state
    // (TransitionInputSchema covers 'approved' and 'rejected' only).
    const caseId = await buildClassifiedCaseFixture(SEED.ORG_HOLDING, ctx);
    const entry = await enqueueException(
      {
        document_case_id: caseId,
        exception_reason: 'low_confidence_classification',
        trace_id: ctx.trace_id,
      },
      ctx,
    );

    const caseAtEnqueue = await readDocumentCase(caseId, ctx);
    expect(caseAtEnqueue.state).toBe('needs_review');

    await resolveException(
      {
        exception_queue_entry_id: entry.exception_queue_entry_id,
        resolution_action: 'reprocess',
        resolved_by: ctx.caller.user_id,
      },
      ctx,
    );

    const caseAfterReprocess = await readDocumentCase(caseId, ctx);
    expect(caseAfterReprocess.state).toBe('classified');
  });
});
