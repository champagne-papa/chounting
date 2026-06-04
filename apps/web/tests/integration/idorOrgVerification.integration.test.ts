// tests/integration/idorOrgVerification.integration.test.ts
//
// Wave 6 D3 T3 — the IDOR-negative suite, part 1 (brief D-1.1 / D-1.1a;
// decomposition T3). Proves the in-service org checks at transition()
// and resolveException(): a verified caller WITHOUT membership in the
// row's org is denied with ORG_ACCESS_DENIED — after the read, BEFORE
// any state change — and same-org paths (including the new
// needs_review→proposed variant) are intact.
//
// The check derives org from the READ ROW: TransitionInput /
// ResolveExceptionInput carry no org_id, so there is nothing for a
// caller to forge and withInvariants Invariant 3 has no field to
// validate — the in-service check is the only possible boundary.
// D2.1 §5(A) superseded with provenance per the D3 brief D-1.1.

import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import {
  createDocumentCase,
  transition,
} from '@/services/document-platform/documentCaseService';
import {
  enqueueException,
  resolveException,
} from '@/services/document-platform/documentExceptionService';
import type { ServiceContext } from '@/services/middleware/serviceContext';

const db = adminClient();

// Same-org (the row's org) and foreign-org callers. Both are VERIFIED
// callers — the foreign caller is a legitimate user of ANOTHER org, the
// exact IDOR shape: authenticated, authorized elsewhere, no membership
// in the target row's org.
const ownCtx = (): ServiceContext =>
  makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
const foreignCtx = (): ServiceContext =>
  makeTestContext({ org_ids: [SEED.ORG_REAL_ESTATE] });

async function hopDirect(
  caseId: string,
  target: string,
  ctx: ServiceContext,
): Promise<void> {
  // Direct audit-paired RPC (matrix legality is app-side only) — the
  // established test pattern for seeding a stranded/staged state.
  const { error } = await db.rpc('update_document_case_state_with_audit', {
    p_case_id: caseId,
    p_target_state: target,
    p_audit: {
      org_id: SEED.ORG_HOLDING,
      user_id: ctx.caller.user_id,
      trace_id: ctx.trace_id,
      action: 'document_case_transitioned',
      entity_type: 'document_case',
      tool_name: null,
      reason: null,
    },
  });
  if (error) throw new Error(`hopDirect failed: ${error.message}`);
}

async function caseState(caseId: string): Promise<string> {
  const { data, error } = await db
    .from('document_cases')
    .select('state')
    .eq('id', caseId)
    .single();
  if (error || !data) throw new Error(`caseState read failed: ${error?.message}`);
  return data.state as string;
}

async function seedCaseAt(
  state: string,
  ctx: ServiceContext,
): Promise<string> {
  const created = await createDocumentCase(
    { org_id: SEED.ORG_HOLDING, document_type: 'vendor_invoice' },
    ctx,
  );
  if (state !== 'received') await hopDirect(created.id, state, ctx);
  return created.id;
}

describe('Wave 6 D3 T3: transition() in-service org verification', () => {
  it('cross-org →rejected: ORG_ACCESS_DENIED thrown, state unchanged', async () => {
    const ctx = ownCtx();
    const caseId = await seedCaseAt('needs_review', ctx);

    await expect(
      transition(
        caseId,
        { target_state: 'rejected', reason: 'foreign caller attempt' },
        foreignCtx(),
      ),
    ).rejects.toMatchObject({ code: 'ORG_ACCESS_DENIED' });

    // The check fired BEFORE any state change.
    expect(await caseState(caseId)).toBe('needs_review');
  });

  it('cross-org →proposed (the new D3 variant): same denial, state unchanged', async () => {
    const ctx = ownCtx();
    const caseId = await seedCaseAt('needs_review', ctx);

    await expect(
      transition(caseId, { target_state: 'proposed' }, foreignCtx()),
    ).rejects.toMatchObject({ code: 'ORG_ACCESS_DENIED' });
    expect(await caseState(caseId)).toBe('needs_review');
  });

  it('same-org needs_review→proposed succeeds (the §5(A)-superseded human hop)', async () => {
    const ctx = ownCtx();
    const caseId = await seedCaseAt('needs_review', ctx);

    const result = await transition(
      caseId,
      { target_state: 'proposed' },
      ctx,
    );
    expect(result.state).toBe('proposed');
    expect(await caseState(caseId)).toBe('proposed');
  });

  it('same-org needs_review→rejected (existing variant) intact', async () => {
    const ctx = ownCtx();
    const caseId = await seedCaseAt('needs_review', ctx);

    const result = await transition(
      caseId,
      { target_state: 'rejected', reason: 'not an accounting document' },
      ctx,
    );
    expect(result.state).toBe('rejected');
  });
});

describe('Wave 6 D3 T3: resolveException() in-service org verification', () => {
  async function seedOpenException(
    ctx: ServiceContext,
  ): Promise<{ caseId: string; entryId: string }> {
    // enqueueException requires classified|matched source state; the
    // atomic RPC moves the case to needs_review + opens the entry.
    const caseId = await seedCaseAt('classified', ctx);
    const entry = await enqueueException(
      {
        document_case_id: caseId,
        exception_reason: 'unknown_document_type',
        trace_id: ctx.trace_id,
      },
      ctx,
    );
    return { caseId, entryId: entry.exception_queue_entry_id };
  }

  it('cross-org resolve: ORG_ACCESS_DENIED before the mutating RPC — entry stays open, case unmoved', async () => {
    const ctx = ownCtx();
    const { caseId, entryId } = await seedOpenException(ctx);

    await expect(
      resolveException(
        {
          exception_queue_entry_id: entryId,
          resolution_action: 'mark_duplicate',
          resolved_by: SEED.USER_CONTROLLER,
        },
        foreignCtx(),
      ),
    ).rejects.toMatchObject({ code: 'ORG_ACCESS_DENIED' });

    // The org probe precedes the RPC: nothing mutated.
    const { data: entry } = await db
      .from('exception_queue_entries')
      .select('exception_status, resolution_action')
      .eq('exception_queue_entry_id', entryId)
      .single();
    expect(entry!.exception_status).toBe('open');
    expect(entry!.resolution_action).toBeNull();
    expect(await caseState(caseId)).toBe('needs_review');
  });

  it('same-org resolve (mark_duplicate) intact: entry resolved, case lands rejected', async () => {
    const ctx = ownCtx();
    const { caseId, entryId } = await seedOpenException(ctx);

    const result = await resolveException(
      {
        exception_queue_entry_id: entryId,
        resolution_action: 'mark_duplicate',
        resolved_by: SEED.USER_CONTROLLER,
      },
      ctx,
    );
    expect(result.exception_status).toBe('resolved');
    expect(await caseState(caseId)).toBe('rejected');
  });

  it('unknown entry id → NOT_FOUND (the org probe miss path — no existence leak beyond 404 semantics)', async () => {
    await expect(
      resolveException(
        {
          exception_queue_entry_id: crypto.randomUUID(),
          resolution_action: 'mark_duplicate',
          resolved_by: SEED.USER_CONTROLLER,
        },
        ownCtx(),
      ),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
