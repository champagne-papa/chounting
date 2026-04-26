// tests/integration/dowValidation.test.ts
// OI-2 fix-stack item 3 (validation commit) — gate B: day-of-week
// validation. When the user's prompt contains a weekday token and
// the agent emits a postJournalEntry with an entry_date whose
// day-of-week (in the request's IANA tz) doesn't match, the
// orchestrator self-emits agent.error.entry_date_dow_mismatch and
// fails fast — no executeTool dispatch, no ai_actions row written.
// Reproduces the C6 Entry 10 case structurally.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { handleUserMessage } from '@/agent/orchestrator';
import { __setMockFixtureQueue } from '@/agent/orchestrator/callClaude';
import { makeMessage } from '../fixtures/anthropic/makeMessage';
import { makeTestContext } from '../setup/makeTestContext';
import { adminClient } from '@/db/adminClient';
import { SEED } from '../setup/testDb';

const HOLDING_FISCAL_PERIOD_ID = '33333333-3333-3333-3333-333333333301';
const HOLDING_ACCOUNT_CASH = '44444444-4444-4444-4444-444444444401';
const HOLDING_ACCOUNT_REVENUE = '44444444-4444-4444-4444-444444444402';

function balancedLines() {
  return [
    {
      account_id: HOLDING_ACCOUNT_CASH,
      debit_amount: '100.00',
      credit_amount: '0.00',
      currency: 'CAD',
      amount_original: '100.00',
      amount_cad: '100.0000',
      fx_rate: '1.0000',
      tax_code_id: null,
    },
    {
      account_id: HOLDING_ACCOUNT_REVENUE,
      debit_amount: '0.00',
      credit_amount: '100.00',
      currency: 'CAD',
      amount_original: '100.00',
      amount_cad: '100.0000',
      fx_rate: '1.0000',
      tax_code_id: null,
    },
  ];
}

function postEntryFixture(entry_date: string, idSuffix: string): Anthropic.Messages.Message {
  return makeMessage(
    [
      {
        type: 'tool_use',
        id: `toolu_post_dow_${idSuffix}`,
        name: 'postJournalEntry',
        input: {
          fiscal_period_id: HOLDING_FISCAL_PERIOD_ID,
          entry_date,
          description: 'dow validation test',
          source: 'agent',
          dry_run: true,
          lines: balancedLines(),
        },
        caller: { type: 'direct' },
      },
    ],
    'tool_use',
  );
}

function respondEntryProposedFixture(idSuffix: string): Anthropic.Messages.Message {
  return makeMessage(
    [
      {
        type: 'tool_use',
        id: `toolu_respond_dow_${idSuffix}`,
        name: 'respondToUser',
        input: {
          template_id: 'agent.entry.proposed',
          params: { amount: '100.00' },
          canvas_directive: {
            type: 'proposed_entry_card',
            card: {
              org_name: 'The Bridge Holding Co.',
              transaction_type: 'journal_entry',
              entry_date: '2026-04-17',
              description: 'dow validation match-case',
              lines: [
                {
                  account_code: '1000',
                  account_name: 'Cash',
                  debit: '100.00',
                  credit: '0.00',
                  currency: 'CAD',
                },
                {
                  account_code: '4000',
                  account_name: 'Revenue',
                  debit: '0.00',
                  credit: '100.00',
                  currency: 'CAD',
                },
              ],
              intercompany_flag: false,
              confidence_score: 0.9,
              policy_outcome: {
                required_action: 'approve',
                reason_template_id: 'policy.agent.propose',
                reason_params: {},
              },
              dry_run_entry_id: '55555555-5555-5555-5555-555555555501',
            },
          },
        },
        caller: { type: 'direct' },
      },
    ],
    'tool_use',
  );
}

describe('OI-2 gate B: day-of-week validation', () => {
  beforeEach(async () => {
    // Pre-clean: defends the no-ai_actions count assertion against
    // pollution from prior test runs that may have crashed before
    // afterEach ran. Filter on user_id (test fixture's controller).
    const db = adminClient();
    await db.from('ai_actions').delete().eq('user_id', SEED.USER_CONTROLLER);
    await db.from('agent_sessions').delete().eq('user_id', SEED.USER_CONTROLLER);
  });

  afterEach(async () => {
    __setMockFixtureQueue(null);
    const db = adminClient();
    await db.from('ai_actions').delete().eq('user_id', SEED.USER_CONTROLLER);
    await db.from('agent_sessions').delete().eq('user_id', SEED.USER_CONTROLLER);
  });

  it('mismatch: prompt says last Friday but agent emits Saturday → fail-fast, no ai_actions', async () => {
    // 2026-04-18 is a Saturday. Prompt's "last Friday" anchors on a
    // different weekday — gate must self-emit dow_mismatch.
    __setMockFixtureQueue([postEntryFixture('2026-04-18', 'mismatch')]);

    const ctx = makeTestContext({
      user_id: SEED.USER_CONTROLLER,
      org_ids: [SEED.ORG_HOLDING],
    });
    const response = await handleUserMessage(
      {
        user_id: SEED.USER_CONTROLLER,
        org_id: SEED.ORG_HOLDING,
        locale: 'en',
        tz: 'UTC',
        message: "Book last Friday's payroll — $100",
      },
      ctx,
    );

    expect(response.response.template_id).toBe(
      'agent.error.entry_date_dow_mismatch',
    );
    expect(response.response.params).toMatchObject({
      resolved_date: '2026-04-18',
      resolved_dow: 'Saturday',
      prompt_dow: 'Friday',
      source_phrase: 'friday',
    });

    // Critical: no ai_actions row. The orphan-prevention property.
    const { count } = await adminClient()
      .from('ai_actions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', SEED.USER_CONTROLLER);
    expect(count ?? 0).toBe(0);
  });

  it('match: prompt says last Friday and agent emits Friday → pass-through', async () => {
    // 2026-04-17 is a Friday. Gate passes; normal executeTool +
    // respondToUser flow completes.
    __setMockFixtureQueue([
      postEntryFixture('2026-04-17', 'match'),
      respondEntryProposedFixture('match'),
    ]);

    const ctx = makeTestContext({
      user_id: SEED.USER_CONTROLLER,
      org_ids: [SEED.ORG_HOLDING],
    });
    const response = await handleUserMessage(
      {
        user_id: SEED.USER_CONTROLLER,
        org_id: SEED.ORG_HOLDING,
        locale: 'en',
        tz: 'UTC',
        message: "Book last Friday's payroll — $100",
      },
      ctx,
    );

    // Normal success path; no dow_mismatch.
    expect(response.response.template_id).toBe('agent.entry.proposed');
  });

  it('locale skip: non-English prompt with weekday-shaped content does not gate', async () => {
    // The fr-CA prompt contains "vendredi" but the locale gate
    // skips dow validation. The gate is opt-out by locale per
    // ratified scope (fr-CA and zh-Hant do not parse weekday
    // tokens in Phase 1.2).
    __setMockFixtureQueue([
      postEntryFixture('2026-04-18', 'localeskip'),
      respondEntryProposedFixture('localeskip'),
    ]);

    const ctx = makeTestContext({
      user_id: SEED.USER_CONTROLLER,
      org_ids: [SEED.ORG_HOLDING],
    });
    const response = await handleUserMessage(
      {
        user_id: SEED.USER_CONTROLLER,
        org_id: SEED.ORG_HOLDING,
        locale: 'fr-CA',
        tz: 'UTC',
        message: 'Inscrire la paie de vendredi dernier — 100$',
      },
      ctx,
    );

    // Gate skipped → executeTool ran → success template, not
    // dow_mismatch.
    expect(response.response.template_id).toBe('agent.entry.proposed');
  });

  it('no-weekday no-op: prompt without any weekday token never triggers the gate', async () => {
    __setMockFixtureQueue([
      postEntryFixture('2026-04-18', 'noweekday'),
      respondEntryProposedFixture('noweekday'),
    ]);

    const ctx = makeTestContext({
      user_id: SEED.USER_CONTROLLER,
      org_ids: [SEED.ORG_HOLDING],
    });
    const response = await handleUserMessage(
      {
        user_id: SEED.USER_CONTROLLER,
        org_id: SEED.ORG_HOLDING,
        locale: 'en',
        tz: 'UTC',
        message: "Today's coffee — $5",
      },
      ctx,
    );

    expect(response.response.template_id).toBe('agent.entry.proposed');
  });

  it('failure path persists the dow_mismatch turn and does NOT advance state', async () => {
    __setMockFixtureQueue([postEntryFixture('2026-04-18', 'persist')]);

    const ctx = makeTestContext({
      user_id: SEED.USER_CONTROLLER,
      org_ids: [SEED.ORG_HOLDING],
    });
    const response = await handleUserMessage(
      {
        user_id: SEED.USER_CONTROLLER,
        org_id: SEED.ORG_HOLDING,
        locale: 'en',
        tz: 'UTC',
        message: "Book last Friday's payroll",
      },
      ctx,
    );

    expect(response.response.template_id).toBe(
      'agent.error.entry_date_dow_mismatch',
    );

    const { data: session } = await adminClient()
      .from('agent_sessions')
      .select('turns')
      .eq('session_id', response.session_id)
      .single();
    const turns = session?.turns as Array<Record<string, unknown>>;
    const last = turns[turns.length - 1];
    expect(last.role).toBe('assistant');
    expect(last.template_id).toBe('agent.error.entry_date_dow_mismatch');
  });
});
