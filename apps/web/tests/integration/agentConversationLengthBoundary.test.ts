// tests/integration/agentConversationLengthBoundary.test.ts
//
// LT-02(b) — boundary-not-overflow: orchestrator handles a 32-turn
// full-history conversation without breaking. Path C arc, S31
// sub-item (b) per AMENDMENT 2 substrate-honest reframe.
//
// Substrate state at HEAD: orchestrator main-loop step 5 carries
// "Conversation truncation — full history" in
// apps/web/src/agent/orchestrator/index.ts:10 — there is NO
// truncation/rotation logic. This test pins that architectural
// state as a boundary-condition regression-guard:
//
//   - 32-turn synthetic conversation persists in
//     agent_sessions.conversation as Anthropic.Messages.MessageParam[].
//   - loadOrCreateSession Branch 1 (session_id provided) reads the
//     32-turn array verbatim.
//   - handleUserMessage spreads it into the messages dispatched to
//     callClaude per master §5.2 step 5.
//   - The fixture-branch __setMockFixtureQueue receives the call;
//     __getLastClaudeCallParams() exposes the dispatched params.
//   - Assertion: dispatched messages contain all 32 pre-existing
//     turns verbatim plus the new user message at the tail
//     (length === 33).
//
// When Phase 2 ships truncation/rotation infrastructure, this test
// inverts: the count assertion becomes "messages.length <= max"
// and per-turn content asserts shift to "oldest turns truncated."
//
// NO live Anthropic API call. The fixture queue per CA-39 pattern
// is the established mechanism; explicit anti-precedent of
// agentRealClientSmoke.test.ts's `describe.skipIf(!HAS_KEY)` —
// this test runs unconditionally with mocked callClaude per
// pre-decision (b-α).

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { handleUserMessage } from '@/agent/orchestrator';
import {
  __setMockFixtureQueue,
  __getLastClaudeCallParams,
} from '@/agent/orchestrator/callClaude';
import { respondToUserHappyPath } from '../fixtures/anthropic/respondToUserHappyPath';
import { adminClient } from '@/db/adminClient';
import { makeTestContext } from '../setup/makeTestContext';
import { SEED } from '../setup/testDb';

describe('LT-02(b): agent conversation length boundary-not-overflow (32-turn)', () => {
  const db = adminClient();
  let seededSessionId: string | null = null;

  beforeEach(() => {
    __setMockFixtureQueue([respondToUserHappyPath]);
  });

  afterEach(async () => {
    __setMockFixtureQueue(null);
    if (seededSessionId !== null) {
      await db
        .from('agent_sessions')
        .delete()
        .eq('session_id', seededSessionId);
      seededSessionId = null;
    }
    // Defensive cleanup: any session row created for USER_CONTROLLER
    // during the test (including any spawned by a fallback branch).
    await db
      .from('agent_sessions')
      .delete()
      .eq('user_id', SEED.USER_CONTROLLER);
  });

  it('handleUserMessage passes the full 32-turn pre-existing conversation through to callClaude', async () => {
    // Build a 32-turn synthetic conversation in
    // Anthropic.Messages.MessageParam shape, alternating user /
    // assistant turns. Per-turn content length is illustrative; the
    // assertion shape is "all 32 pass through verbatim regardless of
    // content."
    const seededConversation = Array.from({ length: 32 }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `seeded turn ${i} — `.repeat(28).trimEnd(),
    }));
    expect(seededConversation).toHaveLength(32);

    // Pre-seed the agent_sessions row directly via adminClient. The
    // shape mirrors loadOrCreateSession Branch 3's insert (master
    // §5.2 step 1 sub-branch 3) but with the pre-populated 32-turn
    // conversation.
    const { data: created, error: seedErr } = await db
      .from('agent_sessions')
      .insert({
        user_id: SEED.USER_CONTROLLER,
        org_id: SEED.ORG_HOLDING,
        locale: 'en',
        state: {},
        conversation: seededConversation,
        turns: [],
      })
      .select('session_id')
      .single();
    if (seedErr) throw seedErr;
    seededSessionId = created!.session_id;

    // Drive a single-turn handleUserMessage. 'Hello' is neutral and
    // does NOT trigger the OI-2 gate-A span-token short-circuit
    // (orchestrator/index.ts:276-310), which would bypass callClaude
    // entirely.
    const ctx = makeTestContext({
      user_id: SEED.USER_CONTROLLER,
      org_ids: [SEED.ORG_HOLDING],
    });
    const newUserMessage = 'Hello';
    const response = await handleUserMessage(
      {
        user_id: SEED.USER_CONTROLLER,
        org_id: SEED.ORG_HOLDING,
        locale: 'en',
        tz: 'UTC',
        message: newUserMessage,
        session_id: seededSessionId!,
      },
      ctx,
    );

    // Sanity: handleUserMessage completed via the respondToUser
    // fixture (terminates the main loop in one iteration). Returned
    // session_id matches the pre-seeded row — Branch 1 of
    // loadOrCreateSession fired (session_id provided).
    expect(response.session_id).toBe(seededSessionId);
    expect(response.response.template_id).toBe('agent.greeting.welcome');

    // Pin the full-history pass-through. The params handed to
    // callClaude must include all 32 seeded turns verbatim plus the
    // new user message at the tail. No truncation, no rolling
    // window — pins master §5.2 step 5 architectural state.
    const lastParams = __getLastClaudeCallParams();
    expect(lastParams).not.toBeNull();
    const dispatchedMessages = lastParams!.messages;
    expect(dispatchedMessages).toHaveLength(33);

    // First 32 entries equal the seeded conversation verbatim.
    expect(dispatchedMessages.slice(0, 32)).toEqual(seededConversation);

    // Trailing entry is the new user message wrapped in the
    // canonical user-role MessageParam shape.
    expect(dispatchedMessages[32]).toEqual({
      role: 'user',
      content: newUserMessage,
    });
  });
});
