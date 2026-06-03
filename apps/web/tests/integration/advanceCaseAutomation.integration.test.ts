// tests/integration/advanceCaseAutomation.integration.test.ts
//
// Wave 6 D2.1 T2 — advanceCaseAutomation: the automation-side sibling of
// transition(). Covers: chain-advance with one audit row per hop;
// persisted 'extracting' intermediate (chunk_8 CHECK); idempotent no-op
// (at-target and past-target re-runs); the matched→needs_review hand-off
// (a PLAIN state-transition audit row — not a second decision record);
// SINGLE-OWNERSHIP refusal (classified→* belongs to Subsystem 2 /
// resolveCandidates — refused by construction); the Zod .strict()
// boundary ('matched' structurally absent as a target); system-actor
// attribution (ADR-0007 Q78 Path X — audit user_id = the service
// account, not null); and the human-boundary regression (transition()
// still refuses automation targets, byte-unchanged).

import { describe, it, expect } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import {
  createDocumentCase,
  advanceCaseAutomation,
  transition,
} from '@/services/document-platform/documentCaseService';
import {
  SYSTEM_ACTOR_USER_ID,
  type ServiceContext,
  type SystemActorServiceContext,
} from '@/services/middleware/serviceContext';

const db = adminClient();

function makeCtx(trace_id: string): ServiceContext {
  return {
    trace_id,
    caller: {
      user_id: SEED.USER_CONTROLLER,
      email: 'controller@thebridge.local',
      verified: true,
      org_ids: [SEED.ORG_HOLDING],
    },
  };
}

function makeSysCtx(trace_id: string): SystemActorServiceContext {
  return {
    trace_id,
    org_id: SEED.ORG_HOLDING,
    caller: {
      user_id: null,
      system_actor: 'pipeline_orchestrator_test',
      system_user_id: SYSTEM_ACTOR_USER_ID,
    },
  };
}

async function seedCase(ctx: ServiceContext): Promise<string> {
  const created = await createDocumentCase(
    { org_id: SEED.ORG_HOLDING, document_type: 'vendor_invoice' },
    ctx,
  );
  return created.id;
}

async function auditRows(trace_id: string, caseId: string) {
  const { data, error } = await db
    .from('audit_log')
    .select('action, before_state, user_id')
    .eq('trace_id', trace_id)
    .eq('entity_id', caseId)
    .eq('action', 'document_case_transitioned');
  if (error) throw new Error(`auditRows query failed: ${error.message}`);
  return data ?? [];
}

describe('Wave 6 D2.1 T2 — advanceCaseAutomation (automation-side advance)', () => {
  it('chain-advances received → classified: two hops, one audit row per hop', async () => {
    const trace_id = crypto.randomUUID();
    const ctx = makeCtx(trace_id);
    const caseId = await seedCase(ctx);

    const result = await advanceCaseAutomation(
      { document_case_id: caseId, target_state: 'classified' },
      ctx,
    );
    expect(result.state).toBe('classified');

    const rows = await auditRows(trace_id, caseId);
    expect(rows).toHaveLength(2); // received→extracting, extracting→classified
    const befores = rows
      .map((r) => (r.before_state as { state: string }).state)
      .sort();
    expect(befores).toEqual(['extracting', 'received']);
  });

  it("persists the 'extracting' intermediate (single hop; chunk_8 CHECK admits)", async () => {
    const trace_id = crypto.randomUUID();
    const ctx = makeCtx(trace_id);
    const caseId = await seedCase(ctx);

    const result = await advanceCaseAutomation(
      { document_case_id: caseId, target_state: 'extracting' },
      ctx,
    );
    expect(result.state).toBe('extracting');
  });

  it('idempotent: at-target and past-target re-runs succeed with NO new audit rows', async () => {
    const trace_id = crypto.randomUUID();
    const ctx = makeCtx(trace_id);
    const caseId = await seedCase(ctx);

    await advanceCaseAutomation(
      { document_case_id: caseId, target_state: 'classified' },
      ctx,
    );
    const rowsAfterChain = await auditRows(trace_id, caseId);

    const atTarget = await advanceCaseAutomation(
      { document_case_id: caseId, target_state: 'classified' },
      ctx,
    );
    expect(atTarget.state).toBe('classified');

    const pastTarget = await advanceCaseAutomation(
      { document_case_id: caseId, target_state: 'extracting' },
      ctx,
    );
    expect(pastTarget.state).toBe('classified'); // unchanged

    const rowsAfterReruns = await auditRows(trace_id, caseId);
    expect(rowsAfterReruns).toHaveLength(rowsAfterChain.length);
  });

  it('matched → needs_review hand-off: one hop, a PLAIN state-transition audit row', async () => {
    const trace_id = crypto.randomUUID();
    const ctx = makeCtx(trace_id);
    const caseId = await seedCase(ctx);

    // Seed to 'matched' directly (chunk_8 CHECK admits; the real
    // classified→matched transition is Subsystem 2's — out of T2 scope).
    const { error: seedErr } = await db
      .from('document_cases')
      .update({ state: 'matched' })
      .eq('id', caseId);
    expect(seedErr).toBeNull();

    const result = await advanceCaseAutomation(
      { document_case_id: caseId, target_state: 'needs_review' },
      ctx,
    );
    expect(result.state).toBe('needs_review');

    const rows = await auditRows(trace_id, caseId);
    expect(rows).toHaveLength(1);
    expect((rows[0]!.before_state as { state: string }).state).toBe('matched');
  });

  it('SINGLE-OWNERSHIP: refuses classified → needs_review with the Subsystem-2 pointer', async () => {
    const trace_id = crypto.randomUUID();
    const ctx = makeCtx(trace_id);
    const caseId = await seedCase(ctx);
    await advanceCaseAutomation(
      { document_case_id: caseId, target_state: 'classified' },
      ctx,
    );

    await expect(
      advanceCaseAutomation(
        { document_case_id: caseId, target_state: 'needs_review' },
        ctx,
      ),
    ).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });
    await expect(
      advanceCaseAutomation(
        { document_case_id: caseId, target_state: 'needs_review' },
        ctx,
      ),
    ).rejects.toThrow(/resolveCandidates/);
  });

  it('refuses received → needs_review (the path crosses the Subsystem-2 segment)', async () => {
    const trace_id = crypto.randomUUID();
    const ctx = makeCtx(trace_id);
    const caseId = await seedCase(ctx);

    await expect(
      advanceCaseAutomation(
        { document_case_id: caseId, target_state: 'needs_review' },
        ctx,
      ),
    ).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });
  });

  it("Zod .strict() boundary: 'matched' structurally absent as a target; unknown keys rejected", async () => {
    const trace_id = crypto.randomUUID();
    const ctx = makeCtx(trace_id);
    const caseId = await seedCase(ctx);

    await expect(
      advanceCaseAutomation(
        // @ts-expect-error — deliberately illegal target ('matched' is
        // Subsystem 2's transition target, structurally excluded)
        { document_case_id: caseId, target_state: 'matched' },
        ctx,
      ),
    ).rejects.toMatchObject({ code: 'READ_FAILED' });

    await expect(
      advanceCaseAutomation(
        // @ts-expect-error — deliberately unknown key (.strict())
        { document_case_id: caseId, target_state: 'classified', extra: 1 },
        ctx,
      ),
    ).rejects.toMatchObject({ code: 'READ_FAILED' });
  });

  it('system-actor attribution: audit user_id = the Path-X service account, not null', async () => {
    const humanCtx = makeCtx(crypto.randomUUID());
    const caseId = await seedCase(humanCtx);

    const trace_id = crypto.randomUUID();
    const sysCtx = makeSysCtx(trace_id);
    const result = await advanceCaseAutomation(
      { document_case_id: caseId, target_state: 'extracting' },
      sysCtx,
    );
    expect(result.state).toBe('extracting');

    const rows = await auditRows(trace_id, caseId);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.user_id).toBe(SYSTEM_ACTOR_USER_ID);
  });

  it('human-boundary regression: transition() still Zod-refuses automation targets', async () => {
    const trace_id = crypto.randomUUID();
    const ctx = makeCtx(trace_id);
    const caseId = await seedCase(ctx);

    await expect(
      transition(caseId, { target_state: 'extracting' } as never, ctx),
    ).rejects.toMatchObject({ code: 'READ_FAILED' });
  });
});
