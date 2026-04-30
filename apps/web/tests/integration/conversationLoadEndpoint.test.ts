// tests/integration/conversationLoadEndpoint.test.ts
// Phase 1.2 Session 7 Commit 3 — /api/agent/conversation GET.
//
// Coverage:
//   - Happy path: post-migration-121 session with populated
//     turns returns the turns array with session_id
//   - Empty session: fresh session (turns: [], conversation: [])
//     returns empty turns + session_id
//   - No session at all: returns { turns: [], session_id: null }
//   - Card resolution hydration:
//       - approved card -> CardResolution with journal_entry_id
//         and entry_number
//       - rejected card -> CardResolution with reason (if stored)
//       - pending card -> no card_resolution (buttons visible)
//       - card with no matching ai_actions row -> no resolution
//   - Cross-org isolation: request for a different org_id than
//     the session returns no session
//   - Pre-migration-121 fallback: session with non-empty
//     conversation but empty turns triggers reconstruction

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SEED } from '../setup/testDb';
import { adminClient } from '@/db/adminClient';

const TEST_TRACE = '00000000-0000-4000-8000-0000000000b0';

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
        org_ids: [SEED.ORG_HOLDING, SEED.ORG_REAL_ESTATE],
      },
      locale: 'en' as const,
    })),
  };
});

const { GET } = await import('@/app/api/agent/conversation/route');
const { POST: CONFIRM } = await import('@/app/api/agent/confirm/route');

function uuid(): string {
  return crypto.randomUUID();
}

function conversationRequest(orgId: string): Request {
  const url = `http://test/api/agent/conversation?org_id=${encodeURIComponent(orgId)}`;
  return new Request(url, { method: 'GET' });
}

async function cleanupSessions(userId: string) {
  const db = adminClient();
  await db.from('agent_sessions').delete().eq('user_id', userId);
  await db.from('audit_log').delete().eq('trace_id', TEST_TRACE);
}

async function cleanupAiActions(idempotencyKey: string) {
  const db = adminClient();
  await db.from('ai_actions').delete().eq('idempotency_key', idempotencyKey);
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

describe('/api/agent/conversation', () => {
  afterEach(async () => {
    await cleanupSessions(SEED.USER_CONTROLLER);
  });

  describe('empty cases', () => {
    it('returns { turns: [], session_id: null } when no session exists', async () => {
      const resp = await GET(conversationRequest(SEED.ORG_HOLDING));
      expect(resp.status).toBe(200);
      const body = await resp.json();
      expect(body.turns).toEqual([]);
      expect(body.session_id).toBeNull();
    });

    it('returns empty turns + session_id for a session with no content yet', async () => {
      const db = adminClient();
      const { data: created } = await db
        .from('agent_sessions')
        .insert({
          user_id: SEED.USER_CONTROLLER,
          org_id: SEED.ORG_HOLDING,
          locale: 'en',
          state: {},
          conversation: [],
          turns: [],
        })
        .select('session_id')
        .single();
      const resp = await GET(conversationRequest(SEED.ORG_HOLDING));
      expect(resp.status).toBe(200);
      const body = await resp.json();
      expect(body.turns).toEqual([]);
      expect(body.session_id).toBe(created!.session_id);
    });
  });

  describe('post-migration-121 happy path', () => {
    it('returns populated turns and session_id', async () => {
      const db = adminClient();
      const userTurn = {
        role: 'user' as const,
        id: uuid(),
        text: 'Show me the P&L',
        timestamp: '2026-04-19T00:00:00.000Z',
        status: 'sent' as const,
      };
      const assistantTurn = {
        role: 'assistant' as const,
        id: uuid(),
        template_id: 'agent.greeting.welcome',
        params: { user_name: 'Test' },
        timestamp: '2026-04-19T00:00:01.000Z',
        trace_id: TEST_TRACE,
      };
      const { data: created } = await db
        .from('agent_sessions')
        .insert({
          user_id: SEED.USER_CONTROLLER,
          org_id: SEED.ORG_HOLDING,
          locale: 'en',
          state: {},
          conversation: [],
          turns: [userTurn, assistantTurn],
        })
        .select('session_id')
        .single();

      const resp = await GET(conversationRequest(SEED.ORG_HOLDING));
      expect(resp.status).toBe(200);
      const body = await resp.json();
      expect(body.session_id).toBe(created!.session_id);
      expect(body.turns).toHaveLength(2);
      expect(body.turns[0].role).toBe('user');
      expect(body.turns[0].text).toBe('Show me the P&L');
      expect(body.turns[1].role).toBe('assistant');
      expect(body.turns[1].template_id).toBe('agent.greeting.welcome');
    });
  });

  describe('card_resolution hydration', () => {
    const idempotencyKey = uuid();
    let cardTurnFixtureId: string;
    let insertedJournalEntryId: string | null = null;
    let insertedAiActionId: string | null = null;

    beforeEach(async () => {
      await cleanupAiActions(idempotencyKey);
    });

    afterEach(async () => {
      const db = adminClient();
      if (insertedJournalEntryId) {
        await db.from('journal_lines').delete().eq('journal_entry_id', insertedJournalEntryId);
        await db.from('journal_entries').delete().eq('journal_entry_id', insertedJournalEntryId);
        insertedJournalEntryId = null;
      }
      if (insertedAiActionId) {
        await db.from('ai_actions').delete().eq('ai_action_id', insertedAiActionId);
        insertedAiActionId = null;
      }
      await cleanupAiActions(idempotencyKey);
    });

    async function seedSessionWithCardTurn(
      orgId: string,
      cardIdempotencyKey: string,
    ): Promise<string> {
      cardTurnFixtureId = uuid();
      const cardTurn = {
        role: 'assistant',
        id: cardTurnFixtureId,
        template_id: 'agent.entry.proposed',
        params: { amount: '100.0000 CAD' },
        card: {
          org_id: orgId,
          org_name: 'Holding Co',
          transaction_type: 'journal_entry',
          entry_date: '2026-04-19',
          description: 'Card hydration test',
          lines: [
            { account_code: '1000', account_name: 'Cash', debit: '0.0000', credit: '100.0000', currency: 'CAD' },
            { account_code: '6000', account_name: 'Office', debit: '100.0000', credit: '0.0000', currency: 'CAD' },
          ],
          intercompany_flag: false,
          confidence_score: 0.9,
          policy_outcome: {
            required_action: 'approve',
            reason_template_id: 'proposed_entry.why.rule_matched',
            reason_params: { label: 'Vendor → Expense' },
          },
          idempotency_key: cardIdempotencyKey,
          dry_run_entry_id: uuid(),
          trace_id: TEST_TRACE,
        },
        timestamp: '2026-04-19T00:00:01.000Z',
        trace_id: TEST_TRACE,
      };
      const db = adminClient();
      const { data: created } = await db
        .from('agent_sessions')
        .insert({
          user_id: SEED.USER_CONTROLLER,
          org_id: orgId,
          locale: 'en',
          state: {},
          conversation: [],
          turns: [cardTurn],
        })
        .select('session_id')
        .single();
      return created!.session_id;
    }

    it('approved card (confirmed ai_action with journal_entry) hydrates with entry_number', async () => {
      await seedSessionWithCardTurn(SEED.ORG_HOLDING, idempotencyKey);

      // Seed a 'pending' ai_action with real tool_input, then
      // fire /api/agent/confirm to drive it to 'confirmed' state.
      // This routes through journalEntryService.post which
      // populates entry_number and related NOT NULL columns
      // correctly.
      const db = adminClient();
      const { cashAccountId, revenueAccountId } = await loadCoA(SEED.ORG_HOLDING);
      const { fiscal_period_id } = await loadOpenPeriod(SEED.ORG_HOLDING);
      const today = new Date().toISOString().slice(0, 10);
      const toolInput = {
        org_id: SEED.ORG_HOLDING,
        fiscal_period_id,
        entry_date: today,
        description: 'Hydration approved fixture',
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
      const { data: inserted } = await db
        .from('ai_actions')
        .insert({
          org_id: SEED.ORG_HOLDING,
          user_id: SEED.USER_CONTROLLER,
          trace_id: TEST_TRACE,
          tool_name: 'postJournalEntry',
          tool_input: toolInput,
          status: 'pending',
          idempotency_key: idempotencyKey,
        })
        .select('ai_action_id')
        .single();
      insertedAiActionId = inserted!.ai_action_id;

      const confirmReq = new Request('http://test/api/agent/confirm', {
        method: 'POST',
        body: JSON.stringify({
          org_id: SEED.ORG_HOLDING,
          idempotency_key: idempotencyKey,
        }),
        headers: { 'content-type': 'application/json' },
      });
      const confirmResp = await CONFIRM(confirmReq);
      expect(confirmResp.status).toBe(200);
      const confirmBody = await confirmResp.json();
      insertedJournalEntryId = confirmBody.journal_entry_id;

      const resp = await GET(conversationRequest(SEED.ORG_HOLDING));
      expect(resp.status).toBe(200);
      const body = await resp.json();
      const card = body.turns[0];
      expect(card.card_resolution).toBeDefined();
      expect(card.card_resolution.status).toBe('approved');
      expect(card.card_resolution.journal_entry_id).toBe(confirmBody.journal_entry_id);
      expect(card.card_resolution.entry_number).toBe(confirmBody.entry_number);
    });

    it('rejected card hydrates with reason when stored', async () => {
      await seedSessionWithCardTurn(SEED.ORG_HOLDING, idempotencyKey);

      const db = adminClient();
      const { data: aiAction } = await db
        .from('ai_actions')
        .insert({
          org_id: SEED.ORG_HOLDING,
          user_id: SEED.USER_CONTROLLER,
          trace_id: TEST_TRACE,
          tool_name: 'postJournalEntry',
          tool_input: {},
          status: 'rejected',
          resolution_reason: 'Wrong vendor',
          idempotency_key: idempotencyKey,
        })
        .select('ai_action_id')
        .single();
      insertedAiActionId = aiAction!.ai_action_id;

      const resp = await GET(conversationRequest(SEED.ORG_HOLDING));
      const body = await resp.json();
      const card = body.turns[0];
      expect(card.card_resolution.status).toBe('rejected');
      expect(card.card_resolution.reason).toBe('Wrong vendor');
    });

    it('pending card returns without card_resolution (buttons stay visible)', async () => {
      await seedSessionWithCardTurn(SEED.ORG_HOLDING, idempotencyKey);

      const db = adminClient();
      const { data: aiAction } = await db
        .from('ai_actions')
        .insert({
          org_id: SEED.ORG_HOLDING,
          user_id: SEED.USER_CONTROLLER,
          trace_id: TEST_TRACE,
          tool_name: 'postJournalEntry',
          tool_input: {},
          status: 'pending',
          idempotency_key: idempotencyKey,
        })
        .select('ai_action_id')
        .single();
      insertedAiActionId = aiAction!.ai_action_id;

      const resp = await GET(conversationRequest(SEED.ORG_HOLDING));
      const body = await resp.json();
      const card = body.turns[0];
      expect(card.card_resolution).toBeUndefined();
    });

    it('card with no matching ai_actions row returns without card_resolution', async () => {
      await seedSessionWithCardTurn(SEED.ORG_HOLDING, idempotencyKey);
      // No ai_actions insert — just the session with the card turn.
      const resp = await GET(conversationRequest(SEED.ORG_HOLDING));
      const body = await resp.json();
      const card = body.turns[0];
      expect(card.card_resolution).toBeUndefined();
    });
  });

  describe('cross-org isolation', () => {
    it('returns no session when org_id query param does not match session.org_id', async () => {
      const db = adminClient();
      await db
        .from('agent_sessions')
        .insert({
          user_id: SEED.USER_CONTROLLER,
          org_id: SEED.ORG_HOLDING,
          locale: 'en',
          state: {},
          conversation: [],
          turns: [
            {
              role: 'user',
              id: uuid(),
              text: 'secret',
              timestamp: '2026-04-19T00:00:00.000Z',
              status: 'sent',
            },
          ],
        })
        .select('session_id')
        .single();
      const resp = await GET(conversationRequest(SEED.ORG_REAL_ESTATE));
      const body = await resp.json();
      expect(body.turns).toEqual([]);
      expect(body.session_id).toBeNull();
    });
  });

  describe('pre-migration-121 fallback (reconstruction)', () => {
    it('reconstructs turns from Anthropic messages when turns column is empty but conversation is not', async () => {
      const db = adminClient();
      const anthropicMessages = [
        { role: 'user', content: 'What accounts do we have?' },
        {
          role: 'assistant',
          content: [
            { type: 'text', text: '[responded with template_id=agent.accounts.listed]' },
          ],
        },
      ];
      await db
        .from('agent_sessions')
        .insert({
          user_id: SEED.USER_CONTROLLER,
          org_id: SEED.ORG_HOLDING,
          locale: 'en',
          state: {},
          conversation: anthropicMessages,
          turns: [],
        })
        .select('session_id')
        .single();

      const resp = await GET(conversationRequest(SEED.ORG_HOLDING));
      const body = await resp.json();
      expect(body.turns).toHaveLength(2);
      expect(body.turns[0].role).toBe('user');
      expect(body.turns[0].text).toBe('What accounts do we have?');
      expect(body.turns[1].role).toBe('assistant');
      expect(body.turns[1].template_id).toBe('agent.accounts.listed');
      // Params are lost in reconstruction — Phase 1.3 accepts the
      // degraded render per Pre-decision 14 fallback intent.
      expect(body.turns[1].params).toEqual({});
    });
  });
});
