// tests/integration/apiAgentRejectEndpoint.test.ts
// Phase 1.2 Session 7 Commit 2 — /api/agent/reject five-branch
// state machine:
//   1. not found → 404
//   2. status matches outcome → 200 idempotent (strict, reason-
//      insensitive — first reason wins)
//   3. status terminal-but-different → 409 CONFLICT with
//      currentStatus in the response body
//   4. status = pending → write, return 200 with new state
//   5. status = stale → 422
//
// Plus: Confirm Branch 2 entry_number enrichment — verifies the
// secondary SELECT returns entry_number on idempotent replay
// (founder-approved scope adjustment, kept colocated with the
// reject tests to hold the test-file count to sub-brief §6).

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SEED } from '../setup/testDb';
import { adminClient } from '@/db/adminClient';

const TEST_TRACE = '00000000-0000-4000-8000-0000000000a0';

vi.mock('@/services/middleware/serviceContext', async () => {
  const actual =
    await vi.importActual<typeof import('@/services/middleware/serviceContext')>(
      '@/services/middleware/serviceContext',
    );
  return {
    ...actual,
    buildServiceContext: vi.fn(async () => ({
      trace_id: TEST_TRACE,
      caller: {
        user_id: SEED.USER_CONTROLLER,
        email: 'controller@thebridge.local',
        verified: true,
        org_ids: [SEED.ORG_HOLDING],
      },
      locale: 'en' as const,
    })),
  };
});

const { POST: REJECT } = await import('@/app/api/agent/reject/route');
const { POST: CONFIRM } = await import('@/app/api/agent/confirm/route');

function uuid(): string {
  return crypto.randomUUID();
}

async function loadCoA(orgId: string) {
  const db = adminClient();
  const { data } = await db
    .from('chart_of_accounts')
    .select('account_id, account_type')
    .eq('org_id', orgId);
  const rows = data ?? [];
  const cash = rows.find((r) => r.account_type === 'asset');
  const revenue = rows.find((r) => r.account_type === 'revenue');
  if (!cash || !revenue) throw new Error('Seed CoA missing asset/revenue');
  return { cashAccountId: cash.account_id, revenueAccountId: revenue.account_id };
}

async function loadOpenPeriod(orgId: string) {
  const db = adminClient();
  const { data } = await db
    .from('fiscal_periods')
    .select('period_id')
    .eq('org_id', orgId)
    .eq('is_locked', false)
    .order('start_date', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!data) throw new Error('Seed missing open fiscal period');
  return { fiscal_period_id: data.period_id };
}

async function seedPending(idempotencyKey: string): Promise<string> {
  const db = adminClient();
  const { data, error } = await db
    .from('ai_actions')
    .insert({
      org_id: SEED.ORG_HOLDING,
      user_id: SEED.USER_CONTROLLER,
      trace_id: TEST_TRACE,
      tool_name: 'postJournalEntry',
      tool_input: { note: 'reject-test seed' },
      status: 'pending',
      idempotency_key: idempotencyKey,
    })
    .select('ai_action_id')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'seed failed');
  return data.ai_action_id;
}

async function seedStatus(
  idempotencyKey: string,
  status: 'rejected' | 'edited' | 'confirmed' | 'auto_posted' | 'stale',
  resolutionReason: string | null = null,
): Promise<string> {
  const db = adminClient();
  const { data, error } = await db
    .from('ai_actions')
    .insert({
      org_id: SEED.ORG_HOLDING,
      user_id: SEED.USER_CONTROLLER,
      trace_id: TEST_TRACE,
      tool_name: 'postJournalEntry',
      tool_input: { note: 'terminal seed' },
      status,
      idempotency_key: idempotencyKey,
      resolution_reason: resolutionReason,
      staled_at: status === 'stale' ? new Date().toISOString() : null,
    })
    .select('ai_action_id')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'seed failed');
  return data.ai_action_id;
}

async function cleanup(idempotencyKey: string) {
  const db = adminClient();
  await db.from('ai_actions').delete().eq('idempotency_key', idempotencyKey);
  await db.from('audit_log').delete().eq('trace_id', TEST_TRACE);
}

function rejectRequest(body: unknown): Request {
  return new Request('http://test/api/agent/reject', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

describe('/api/agent/reject — five-branch state machine', () => {
  // Branch 1
  describe('branch 1: not found', () => {
    it('returns 404 NOT_FOUND for an unknown idempotency_key', async () => {
      const resp = await REJECT(
        rejectRequest({
          org_id: SEED.ORG_HOLDING,
          idempotency_key: 'deadbeef-dead-beef-dead-beefdeadbeef',
          outcome: 'rejected',
        }),
      );
      expect(resp.status).toBe(404);
      const body = await resp.json();
      expect(body.error).toBe('NOT_FOUND');
    });
  });

  // Branch 4
  describe('branch 4: pending → target state', () => {
    const idempotencyKey = uuid();
    let rowId: string;

    beforeEach(async () => {
      await cleanup(idempotencyKey);
      rowId = await seedPending(idempotencyKey);
    });
    afterEach(async () => cleanup(idempotencyKey));

    it('happy path with outcome=rejected writes resolution_reason and returns 200', async () => {
      const resp = await REJECT(
        rejectRequest({
          org_id: SEED.ORG_HOLDING,
          idempotency_key: idempotencyKey,
          outcome: 'rejected',
          reason: 'Wrong vendor',
        }),
      );
      expect(resp.status).toBe(200);
      const body = await resp.json();
      expect(body.status).toBe('rejected');
      expect(body.resolution_reason).toBe('Wrong vendor');
      expect(body.idempotent).toBe(false);

      const db = adminClient();
      const { data } = await db
        .from('ai_actions')
        .select('status, resolution_reason')
        .eq('ai_action_id', rowId)
        .single();
      expect(data?.status).toBe('rejected');
      expect(data?.resolution_reason).toBe('Wrong vendor');
    });

    it('happy path with outcome=edited writes the edited_and_replaced constant', async () => {
      const resp = await REJECT(
        rejectRequest({
          org_id: SEED.ORG_HOLDING,
          idempotency_key: idempotencyKey,
          outcome: 'edited',
          reason: 'edited_and_replaced',
        }),
      );
      expect(resp.status).toBe(200);
      const body = await resp.json();
      expect(body.status).toBe('edited');
      expect(body.resolution_reason).toBe('edited_and_replaced');
    });

    it('accepts omitted reason (user skipped textarea)', async () => {
      const resp = await REJECT(
        rejectRequest({
          org_id: SEED.ORG_HOLDING,
          idempotency_key: idempotencyKey,
          outcome: 'rejected',
        }),
      );
      expect(resp.status).toBe(200);
      const body = await resp.json();
      expect(body.resolution_reason).toBeNull();
    });

    it('rejects empty-string reason at the Zod boundary (client contract violation)', async () => {
      const resp = await REJECT(
        rejectRequest({
          org_id: SEED.ORG_HOLDING,
          idempotency_key: idempotencyKey,
          outcome: 'rejected',
          reason: '',
        }),
      );
      expect(resp.status).toBe(400);
    });

    it('rejects invalid outcome value', async () => {
      const resp = await REJECT(
        rejectRequest({
          org_id: SEED.ORG_HOLDING,
          idempotency_key: idempotencyKey,
          outcome: 'confirmed',
        }),
      );
      expect(resp.status).toBe(400);
    });
  });

  // Branch 2
  describe('branch 2: strict idempotent replay (reason-insensitive)', () => {
    const idempotencyKey = uuid();
    beforeEach(async () => {
      await cleanup(idempotencyKey);
      await seedStatus(idempotencyKey, 'rejected', 'first reason wins');
    });
    afterEach(async () => cleanup(idempotencyKey));

    it('returns 200 idempotent when stored status matches outcome, preserves original reason', async () => {
      const resp = await REJECT(
        rejectRequest({
          org_id: SEED.ORG_HOLDING,
          idempotency_key: idempotencyKey,
          outcome: 'rejected',
          reason: 'retry with different text',
        }),
      );
      expect(resp.status).toBe(200);
      const body = await resp.json();
      expect(body.status).toBe('rejected');
      expect(body.resolution_reason).toBe('first reason wins');
      expect(body.idempotent).toBe(true);

      // DB still holds the original reason (strict-idempotent).
      const db = adminClient();
      const { data } = await db
        .from('ai_actions')
        .select('resolution_reason')
        .eq('idempotency_key', idempotencyKey)
        .single();
      expect(data?.resolution_reason).toBe('first reason wins');
    });

    it('edited → edited is also idempotent', async () => {
      const otherKey = uuid();
      await cleanup(otherKey);
      await seedStatus(otherKey, 'edited', 'edited_and_replaced');
      const resp = await REJECT(
        rejectRequest({
          org_id: SEED.ORG_HOLDING,
          idempotency_key: otherKey,
          outcome: 'edited',
          reason: 'edited_and_replaced',
        }),
      );
      expect(resp.status).toBe(200);
      const body = await resp.json();
      expect(body.status).toBe('edited');
      expect(body.idempotent).toBe(true);
      await cleanup(otherKey);
    });
  });

  // Branch 3
  describe('branch 3: terminal-state conflict (409)', () => {
    const idempotencyKey = uuid();
    afterEach(async () => cleanup(idempotencyKey));

    it('confirmed row + reject request → 409 with currentStatus=confirmed', async () => {
      await cleanup(idempotencyKey);
      await seedStatus(idempotencyKey, 'confirmed');
      const resp = await REJECT(
        rejectRequest({
          org_id: SEED.ORG_HOLDING,
          idempotency_key: idempotencyKey,
          outcome: 'rejected',
          reason: 'too late',
        }),
      );
      expect(resp.status).toBe(409);
      const body = await resp.json();
      expect(body.error).toBe('CONFLICT');
      expect(body.currentStatus).toBe('confirmed');
      expect(body.message).toMatch(/already confirmed/i);
    });

    it('rejected row + edit request → 409 with currentStatus=rejected', async () => {
      await cleanup(idempotencyKey);
      await seedStatus(idempotencyKey, 'rejected', 'earlier reject');
      const resp = await REJECT(
        rejectRequest({
          org_id: SEED.ORG_HOLDING,
          idempotency_key: idempotencyKey,
          outcome: 'edited',
          reason: 'edited_and_replaced',
        }),
      );
      expect(resp.status).toBe(409);
      const body = await resp.json();
      expect(body.currentStatus).toBe('rejected');
    });
  });

  // Branch 5
  describe('branch 5: stale', () => {
    const idempotencyKey = uuid();
    afterEach(async () => cleanup(idempotencyKey));

    it('returns 422 AGENT_TOOL_VALIDATION_FAILED when stored status is stale', async () => {
      await cleanup(idempotencyKey);
      await seedStatus(idempotencyKey, 'stale');
      const resp = await REJECT(
        rejectRequest({
          org_id: SEED.ORG_HOLDING,
          idempotency_key: idempotencyKey,
          outcome: 'rejected',
        }),
      );
      expect(resp.status).toBe(422);
      const body = await resp.json();
      expect(body.error).toBe('AGENT_TOOL_VALIDATION_FAILED');
      expect(body.message).toMatch(/stale/i);
    });
  });
});

// -----------------------------------------------------------------
// /api/agent/confirm Branch 2 — entry_number enrichment.
// Colocated here per sub-brief §6 (keep the test-file count clean).
// -----------------------------------------------------------------

describe('/api/agent/confirm Branch 2 — entry_number enrichment', () => {
  const idempotencyKey = uuid();
  let insertedAiActionId: string | null = null;

  beforeEach(async () => {
    const db = adminClient();
    await db.from('ai_actions').delete().eq('idempotency_key', idempotencyKey);
    await db.from('audit_log').delete().eq('trace_id', TEST_TRACE);
  });

  afterEach(async () => {
    const db = adminClient();
    if (insertedAiActionId) {
      const { data: action } = await db
        .from('ai_actions')
        .select('journal_entry_id')
        .eq('ai_action_id', insertedAiActionId)
        .maybeSingle();
      if (action?.journal_entry_id) {
        await db.from('journal_lines').delete().eq('journal_entry_id', action.journal_entry_id);
        await db.from('journal_entries').delete().eq('journal_entry_id', action.journal_entry_id);
      }
      await db.from('ai_actions').delete().eq('ai_action_id', insertedAiActionId);
      insertedAiActionId = null;
    }
    await db.from('audit_log').delete().eq('trace_id', TEST_TRACE);
  });

  it('idempotent replay (Branch 2) returns entry_number populated', async () => {
    const orgId = SEED.ORG_HOLDING;
    const { cashAccountId, revenueAccountId } = await loadCoA(orgId);
    const { fiscal_period_id } = await loadOpenPeriod(orgId);

    const today = new Date().toISOString().slice(0, 10);
    const toolInput = {
      org_id: orgId,
      fiscal_period_id,
      entry_date: today,
      description: 'Branch-2 entry_number test',
      source: 'agent',
      idempotency_key: idempotencyKey,
      dry_run: true,
      lines: [
        {
          account_id: cashAccountId,
          debit_amount: '100.0000',
          credit_amount: '0.0000',
          currency: 'CAD',
          amount_original: '100.0000',
          amount_cad: '100.0000',
          fx_rate: '1.00000000',
        },
        {
          account_id: revenueAccountId,
          debit_amount: '0.0000',
          credit_amount: '100.0000',
          currency: 'CAD',
          amount_original: '100.0000',
          amount_cad: '100.0000',
          fx_rate: '1.00000000',
        },
      ],
    };

    const db = adminClient();
    const { data: inserted, error: insertErr } = await db
      .from('ai_actions')
      .insert({
        org_id: orgId,
        user_id: SEED.USER_CONTROLLER,
        trace_id: TEST_TRACE,
        tool_name: 'postJournalEntry',
        tool_input: toolInput,
        status: 'pending',
        idempotency_key: idempotencyKey,
      })
      .select('ai_action_id')
      .single();
    if (insertErr || !inserted) {
      throw new Error(`Seed ai_actions insert failed: ${insertErr?.message}`);
    }
    insertedAiActionId = inserted.ai_action_id;

    // First confirm drives pending → confirmed and returns entry_number.
    const firstReq = new Request('http://test/api/agent/confirm', {
      method: 'POST',
      body: JSON.stringify({ org_id: orgId, idempotency_key: idempotencyKey }),
      headers: { 'content-type': 'application/json' },
    });
    const firstResp = await CONFIRM(firstReq);
    expect(firstResp.status).toBe(200);
    const firstBody = await firstResp.json();
    expect(firstBody.idempotent).toBe(false);
    expect(typeof firstBody.entry_number).toBe('number');
    const expectedNumber: number = firstBody.entry_number;

    // Second confirm hits Branch 2; entry_number must come back too.
    const secondReq = new Request('http://test/api/agent/confirm', {
      method: 'POST',
      body: JSON.stringify({ org_id: orgId, idempotency_key: idempotencyKey }),
      headers: { 'content-type': 'application/json' },
    });
    const secondResp = await CONFIRM(secondReq);
    expect(secondResp.status).toBe(200);
    const secondBody = await secondResp.json();
    expect(secondBody.idempotent).toBe(true);
    expect(secondBody.journal_entry_id).toBe(firstBody.journal_entry_id);
    expect(secondBody.entry_number).toBe(expectedNumber);
  });
});
