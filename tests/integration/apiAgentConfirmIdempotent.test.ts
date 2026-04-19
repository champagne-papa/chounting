// tests/integration/apiAgentConfirmIdempotent.test.ts
// CA-61: dry-run write → POST /api/agent/confirm → 200 with
// journal_entry_id → POST confirm again → 200 with the same
// journal_entry_id. Only one journal_entries row exists.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SEED } from '../setup/testDb';
import { adminClient } from '@/db/adminClient';

const TEST_TRACE = '00000000-0000-4000-8000-000000000061';

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

const { POST } = await import('@/app/api/agent/confirm/route');

function uuid(): string {
  return crypto.randomUUID();
}

async function loadCoA(orgId: string): Promise<{ cashAccountId: string; revenueAccountId: string }> {
  const db = adminClient();
  const { data } = await db
    .from('chart_of_accounts')
    .select('account_id, account_code, account_type')
    .eq('org_id', orgId);
  const rows = data ?? [];
  const cash = rows.find((r) => r.account_type === 'asset');
  const revenue = rows.find((r) => r.account_type === 'revenue');
  if (!cash || !revenue) {
    throw new Error('Seed CoA missing expected asset/revenue rows');
  }
  return { cashAccountId: cash.account_id, revenueAccountId: revenue.account_id };
}

async function loadOpenPeriod(orgId: string): Promise<{ fiscal_period_id: string }> {
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

describe('CA-61: /api/agent/confirm idempotent replay', () => {
  const idempotencyKey = uuid();
  let insertedAiActionId: string | null = null;

  beforeEach(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', TEST_TRACE);
    await db.from('ai_actions').delete().eq('idempotency_key', idempotencyKey);
  });

  afterEach(async () => {
    const db = adminClient();
    if (insertedAiActionId) {
      // Delete the journal entry if created.
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

  it('pending → confirmed, then idempotent replay returns the same journal_entry_id', async () => {
    const orgId = SEED.ORG_HOLDING;
    const { cashAccountId, revenueAccountId } = await loadCoA(orgId);
    const { fiscal_period_id } = await loadOpenPeriod(orgId);

    // Seed an ai_actions row in 'pending' state as if the
    // orchestrator's dry-run path wrote it.
    const today = new Date().toISOString().slice(0, 10);
    const toolInput = {
      org_id: orgId,
      fiscal_period_id,
      entry_date: today,
      description: 'CA-61 idempotent replay test',
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

    // First confirm — pending → confirmed
    const firstReq = new Request('http://test/api/agent/confirm', {
      method: 'POST',
      body: JSON.stringify({ org_id: orgId, idempotency_key: idempotencyKey }),
      headers: { 'content-type': 'application/json' },
    });
    const firstResp = await POST(firstReq);
    expect(firstResp.status).toBe(200);
    const firstBody = await firstResp.json();
    expect(firstBody.journal_entry_id).toBeDefined();
    expect(firstBody.status).toBe('confirmed');
    expect(firstBody.idempotent).toBe(false);

    // Second confirm — idempotent return
    const secondReq = new Request('http://test/api/agent/confirm', {
      method: 'POST',
      body: JSON.stringify({ org_id: orgId, idempotency_key: idempotencyKey }),
      headers: { 'content-type': 'application/json' },
    });
    const secondResp = await POST(secondReq);
    expect(secondResp.status).toBe(200);
    const secondBody = await secondResp.json();
    expect(secondBody.journal_entry_id).toBe(firstBody.journal_entry_id);
    expect(secondBody.idempotent).toBe(true);

    // Exactly one journal_entries row
    const { count } = await db
      .from('journal_entries')
      .select('journal_entry_id', { count: 'exact', head: true })
      .eq('journal_entry_id', firstBody.journal_entry_id);
    expect(count).toBe(1);
  });
});
