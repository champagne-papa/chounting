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

// =====================================================================
// Wave 6 D3 T4 — the approved→committed edge (the post-success terminal
// marking; ADR-0011 §3 "automation (ledger commit succeeds)"). Driven
// by the D3 approve→post route under the HUMAN reviewer's ctx — the
// second designed caller class (see the function docstring). Edge
// added to AUTOMATION_ADVANCE_EDGES; schema target landed at T2.
// =====================================================================

describe('Wave 6 D3 T4 — approved→committed automation edge', () => {
  async function hopDirect(
    caseId: string,
    target: string,
    ctx: ServiceContext,
  ): Promise<void> {
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

  it('advances approved→committed under the HUMAN reviewer ctx with human-attributed audit', async () => {
    const seedTrace = crypto.randomUUID();
    const seedCtx = makeCtx(seedTrace);
    const caseId = await seedCase(seedCtx);
    await hopDirect(caseId, 'approved', seedCtx);

    // The D3 caller shape: the approve→post route passes the human
    // reviewer's ServiceContext (honest causality — the reviewer's
    // approval caused the commit).
    const trace_id = crypto.randomUUID();
    const humanCtx = makeCtx(trace_id);
    const result = await advanceCaseAutomation(
      { document_case_id: caseId, target_state: 'committed' },
      humanCtx,
    );
    expect(result.state).toBe('committed');

    const rows = await auditRows(trace_id, caseId);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.user_id).toBe(SEED.USER_CONTROLLER);
  });

  it('is an idempotent no-op at/past committed (re-entry tolerance)', async () => {
    const seedTrace = crypto.randomUUID();
    const seedCtx = makeCtx(seedTrace);
    const caseId = await seedCase(seedCtx);
    await hopDirect(caseId, 'approved', seedCtx);

    const trace_id = crypto.randomUUID();
    const humanCtx = makeCtx(trace_id);
    await advanceCaseAutomation(
      { document_case_id: caseId, target_state: 'committed' },
      humanCtx,
    );
    const second = await advanceCaseAutomation(
      { document_case_id: caseId, target_state: 'committed' },
      humanCtx,
    );
    expect(second.state).toBe('committed');

    // No second hop audited under this trace.
    const rows = await auditRows(trace_id, caseId);
    expect(rows).toHaveLength(1);
  });

  it('human transition() still cannot reach committed (Zod gates before the matrix)', async () => {
    const seedTrace = crypto.randomUUID();
    const seedCtx = makeCtx(seedTrace);
    const caseId = await seedCase(seedCtx);
    await hopDirect(caseId, 'approved', seedCtx);

    // 'committed' is not a TransitionInputSchema variant — the human
    // boundary rejects at Layer 2 (defense layering: Zod first; the
    // AUTOMATION_ONLY matrix check is the next line behind it).
    await expect(
      transition(caseId, { target_state: 'committed' } as never, makeCtx(crypto.randomUUID())),
    ).rejects.toMatchObject({ code: 'READ_FAILED' });
    // State untouched.
    const { data } = await db
      .from('document_cases')
      .select('state')
      .eq('id', caseId)
      .single();
    expect(data!.state).toBe('approved');
  });

  it('no automation path from needs_review/proposed to committed (dead-end refusal names the owned edges)', async () => {
    const seedTrace = crypto.randomUUID();
    const seedCtx = makeCtx(seedTrace);
    const caseId = await seedCase(seedCtx);
    await hopDirect(caseId, 'needs_review', seedCtx);

    // needs_review → committed has no automation-owned walk: the human
    // hops (→proposed→approved) are transition()'s, by construction.
    await expect(
      advanceCaseAutomation(
        { document_case_id: caseId, target_state: 'committed' },
        makeSysCtx(crypto.randomUUID()),
      ),
    ).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });
  });
});
