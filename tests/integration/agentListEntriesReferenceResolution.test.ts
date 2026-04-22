// tests/integration/agentListEntriesReferenceResolution.test.ts
// CA-87: When the user references a journal entry by number or
// indirect reference, the orchestrator routes the agent's
// listJournalEntries tool_use through journalEntryService.list with
// session.org_id (not from tool_input — orchestrator injects per the
// O2-v1 read-tool schema strip). C8 Mode B fix regression test.
//
// Test-scope limitation (acknowledged): this guards orchestrator-
// plumbing invariants under the fixture-queue pattern, not real-
// Claude prompt-contract behavior. The Mode B "agent uses
// listJournalEntries instead of asking for org_id" behavioral
// validation is deferred to C7's EC-13 adversarial run per
// session-8-brief.md P36. Same structural test-shape limitation as
// O3's T8 (CA-86 null-recovery plumbing test); see Phase E
// friction-journal entry under "Architectural strengths" for the
// architectural property that makes this test bound acceptable
// (template-driven narrational wrapper eliminates UUID-leak surface
// by design).

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { handleUserMessage } from '@/agent/orchestrator';
import { __setMockFixtureQueue } from '@/agent/orchestrator/callClaude';
import { makeMessage } from '../fixtures/anthropic/makeMessage';
import { makeTestContext } from '../setup/makeTestContext';
import { adminClient } from '@/db/adminClient';
import { SEED } from '../setup/testDb';

const UUID_V4_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

describe('CA-87: agent listJournalEntries reference resolution', () => {
  beforeEach(() => {
    // Fixture queue:
    //   Turn 1: model emits listJournalEntries tool_use WITHOUT org_id
    //           (the agent isn't supposed to know org_id; orchestrator
    //           injects from session per O2-v1 read-tool schema strip).
    //   Turn 2: model emits respondToUser referencing the resolved
    //           entries via the agent.response.natural template.
    const listJournalEntriesTurn: Anthropic.Messages.Message = makeMessage(
      [
        {
          type: 'tool_use',
          id: 'toolu_list_T87',
          name: 'listJournalEntries',
          input: {}, // no org_id — orchestrator injects from session.org_id
          caller: { type: 'direct' },
        },
      ],
      'tool_use',
    );

    const respondToUserTurn: Anthropic.Messages.Message = makeMessage(
      [
        {
          type: 'tool_use',
          id: 'toolu_respond_T87',
          name: 'respondToUser',
          input: {
            template_id: 'agent.response.natural',
            params: {
              text: 'Here are the recent entries you referenced.',
            },
          },
          caller: { type: 'direct' },
        },
      ],
      'tool_use',
    );

    __setMockFixtureQueue([listJournalEntriesTurn, respondToUserTurn]);
  });

  afterEach(async () => {
    __setMockFixtureQueue(null);
    await adminClient()
      .from('agent_sessions')
      .delete()
      .eq('user_id', SEED.USER_CONTROLLER);
  });

  it('orchestrator routes listJournalEntries with session.org_id and produces a clean response', async () => {
    const ctx = makeTestContext({
      user_id: SEED.USER_CONTROLLER,
      org_ids: [SEED.ORG_HOLDING],
    });

    const response = await handleUserMessage(
      {
        user_id: SEED.USER_CONTROLLER,
        org_id: SEED.ORG_HOLDING,
        locale: 'en',
        message: 'Show me entry 42 — what was that one again?',
      },
      ctx,
    );

    // (1) Plumbing smoke: orchestrator completed the two-turn loop
    //     without throwing; response shape is what the fixture scripted.
    expect(response.session_id).toBeDefined();
    expect(response.response.template_id).toBe('agent.response.natural');
    expect(response.trace_id).toBe(ctx.trace_id);

    // (2) No UUID leak in user-facing response params.
    const paramsJson = JSON.stringify(response.response.params);
    expect(paramsJson).not.toMatch(UUID_V4_REGEX);

    // (3) Verify the listJournalEntries call landed cleanly: the persisted
    //     session conversation should show a tool_result for the list call
    //     (not is_error=true), confirming orchestrator routed with
    //     session.org_id rather than failing on missing input.
    const { data: session } = await adminClient()
      .from('agent_sessions')
      .select('conversation')
      .eq('session_id', response.session_id)
      .single();

    const conv = session!.conversation as Array<{
      role: 'user' | 'assistant';
      content: string | Array<Record<string, unknown>>;
    }>;

    const listResults = conv
      .filter((m) => m.role === 'user' && Array.isArray(m.content))
      .flatMap((m) => m.content as Array<Record<string, unknown>>)
      .filter((b) => b.type === 'tool_result' && b.tool_use_id === 'toolu_list_T87');

    expect(listResults).toHaveLength(1);
    expect(listResults[0].is_error).not.toBe(true);
  });
});
