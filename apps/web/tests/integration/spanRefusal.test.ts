// tests/integration/spanRefusal.test.ts
// OI-2 fix-stack item 4 (validation commit) — gate A: span-token
// short-circuit. The orchestrator must refuse span-phrased entry-
// date prompts before any LLM call: emit
// agent.clarify.entry_date_ambiguous, persist the clarification
// turn, return without calling callClaude. No LLM tokens spent;
// no executeTool dispatch; no ai_actions row possible.
//
// Verification of "no LLM call": tests seed an empty mock fixture
// queue. If callClaude were invoked, it would throw with
// "mock fixture queue is empty" — propagated through
// handleUserMessage, the test would fail. Reaching the
// clarification template proves the gate fired before any call.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { handleUserMessage } from '@/agent/orchestrator';
import { __setMockFixtureQueue } from '@/agent/orchestrator/callClaude';
import { makeTestContext } from '../setup/makeTestContext';
import { adminClient } from '@/db/adminClient';
import { SEED } from '../setup/testDb';

describe('OI-2 gate A: span-token short-circuit', () => {
  beforeEach(() => {
    // Empty queue: any call to callClaude throws. Gate must fire
    // before that to keep the test green.
    __setMockFixtureQueue([]);
  });

  afterEach(async () => {
    __setMockFixtureQueue(null);
    await adminClient()
      .from('agent_sessions')
      .delete()
      .eq('user_id', SEED.USER_CONTROLLER);
    await adminClient()
      .from('ai_actions')
      .delete()
      .eq('org_id', SEED.ORG_HOLDING);
  });

  const ctxFor = () =>
    makeTestContext({
      user_id: SEED.USER_CONTROLLER,
      org_ids: [SEED.ORG_HOLDING],
    });

  it('last quarter → clarification with span_kind quarter (no LLM call)', async () => {
    const ctx = ctxFor();
    const response = await handleUserMessage(
      {
        user_id: SEED.USER_CONTROLLER,
        org_id: SEED.ORG_HOLDING,
        locale: 'en',
        tz: 'UTC',
        message: "Book last quarter's depreciation",
      },
      ctx,
    );

    expect(response.response.template_id).toBe(
      'agent.clarify.entry_date_ambiguous',
    );
    expect(response.response.params).toMatchObject({
      source_phrase: 'last quarter',
      span_kind: 'quarter',
    });
  });

  it('this month → span_kind month', async () => {
    const ctx = ctxFor();
    const response = await handleUserMessage(
      {
        user_id: SEED.USER_CONTROLLER,
        org_id: SEED.ORG_HOLDING,
        locale: 'en',
        tz: 'UTC',
        message: 'Run this month review',
      },
      ctx,
    );

    expect(response.response.template_id).toBe(
      'agent.clarify.entry_date_ambiguous',
    );
    expect(response.response.params).toMatchObject({
      source_phrase: 'this month',
      span_kind: 'month',
    });
  });

  it('next year → span_kind year', async () => {
    const ctx = ctxFor();
    const response = await handleUserMessage(
      {
        user_id: SEED.USER_CONTROLLER,
        org_id: SEED.ORG_HOLDING,
        locale: 'en',
        tz: 'UTC',
        message: 'Plan next year forecast',
      },
      ctx,
    );

    expect(response.response.params).toMatchObject({
      source_phrase: 'next year',
      span_kind: 'year',
    });
  });

  it('last week → span_kind week', async () => {
    const ctx = ctxFor();
    const response = await handleUserMessage(
      {
        user_id: SEED.USER_CONTROLLER,
        org_id: SEED.ORG_HOLDING,
        locale: 'en',
        tz: 'UTC',
        message: "Book last week's totals",
      },
      ctx,
    );

    expect(response.response.params).toMatchObject({
      source_phrase: 'last week',
      span_kind: 'week',
    });
  });

  it('leftmost-match: span before point token → span wins', async () => {
    const ctx = ctxFor();
    const response = await handleUserMessage(
      {
        user_id: SEED.USER_CONTROLLER,
        org_id: SEED.ORG_HOLDING,
        locale: 'en',
        tz: 'UTC',
        message: "Book last quarter's totals on Friday",
      },
      ctx,
    );

    expect(response.response.template_id).toBe(
      'agent.clarify.entry_date_ambiguous',
    );
    expect(response.response.params).toMatchObject({
      source_phrase: 'last quarter',
    });
  });

  it('clarification turn is persisted into agent_sessions.turns', async () => {
    const ctx = ctxFor();
    const response = await handleUserMessage(
      {
        user_id: SEED.USER_CONTROLLER,
        org_id: SEED.ORG_HOLDING,
        locale: 'en',
        tz: 'UTC',
        message: 'this quarter close',
      },
      ctx,
    );

    const { data: session } = await adminClient()
      .from('agent_sessions')
      .select('turns, conversation')
      .eq('session_id', response.session_id)
      .single();

    const turns = session?.turns as Array<Record<string, unknown>>;
    // user turn + clarification turn
    expect(turns.length).toBeGreaterThanOrEqual(2);
    const last = turns[turns.length - 1];
    expect(last.role).toBe('assistant');
    expect(last.template_id).toBe('agent.clarify.entry_date_ambiguous');
  });

  it('no ai_actions row written under the gate', async () => {
    const ctx = ctxFor();
    await handleUserMessage(
      {
        user_id: SEED.USER_CONTROLLER,
        org_id: SEED.ORG_HOLDING,
        locale: 'en',
        tz: 'UTC',
        message: "next month's reconciliation",
      },
      ctx,
    );

    const { data: actions, count } = await adminClient()
      .from('ai_actions')
      .select('*', { count: 'exact' })
      .eq('org_id', SEED.ORG_HOLDING);
    expect(count ?? actions?.length ?? 0).toBe(0);
  });
});
