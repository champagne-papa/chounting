// tests/integration/agentValidationRetry.test.ts
// CA-41: Zod validation retry — Fixture C. First turn's tool_use
// input fails Zod; orchestrator surfaces the error via
// tool_result is_error: true (master §5.2 step 7) and the
// follow-up turn succeeds with a corrected input + respondToUser.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { handleUserMessage } from '@/agent/orchestrator';
import { __setMockFixtureQueue } from '@/agent/orchestrator/callClaude';
import {
  validationFailTurn,
  validationRetrySuccessTurn,
} from '../fixtures/anthropic/validationRetryTrigger';
import { makeTestContext } from '../setup/makeTestContext';
import { adminClient } from '@/db/adminClient';
import { SEED } from '../setup/testDb';

const IDEMPOTENCY_KEY_C = '00000000-0000-0000-0000-0000000000c1';

describe('CA-41: Zod validation retry (Fixture C)', () => {
  beforeEach(async () => {
    __setMockFixtureQueue([validationFailTurn, validationRetrySuccessTurn]);
    // Clean any stale ai_actions row from prior runs that shares
    // the fixture's idempotency_key (UNIQUE (org_id, idempotency_key)
    // would otherwise reject the second test's insert).
    await adminClient().from('ai_actions').delete().eq('idempotency_key', IDEMPOTENCY_KEY_C);
  });

  afterEach(async () => {
    __setMockFixtureQueue(null);
    await adminClient().from('ai_actions').delete().eq('idempotency_key', IDEMPOTENCY_KEY_C);
    await adminClient().from('agent_sessions').delete().eq('user_id', SEED.USER_CONTROLLER);
  });

  it('fails validation on turn 1, succeeds on retry, extracts respondToUser', async () => {
    const ctx = makeTestContext({
      user_id: SEED.USER_CONTROLLER,
      org_ids: [SEED.ORG_HOLDING],
    });
    const response = await handleUserMessage(
      {
        user_id: SEED.USER_CONTROLLER,
        org_id: SEED.ORG_HOLDING,
        locale: 'en',
        message: 'post a $100 cash entry',
      },
      ctx,
    );

    expect(response.response.template_id).toBe('agent.entry.proposed');
    expect(response.trace_id).toBe(ctx.trace_id);

    // The retry's successful postJournalEntry tool_use wrote an
    // ai_actions row (dry_run path). Verify it exists.
    //
    // Finding O2-v2 note: the idempotency_key in the ai_actions row
    // is orchestrator-minted (Site 1 pre-Zod) and no longer matches
    // the fixture's IDEMPOTENCY_KEY_C. Query by trace_id instead —
    // that's deterministic from ctx.
    const { data } = await adminClient()
      .from('ai_actions')
      .select('trace_id, tool_name, status')
      .eq('trace_id', ctx.trace_id)
      .maybeSingle();
    expect(data).not.toBeNull();
    expect(data!.trace_id).toBe(ctx.trace_id);
    expect(data!.tool_name).toBe('postJournalEntry');
    expect(data!.status).toBe('pending');
  });
});
