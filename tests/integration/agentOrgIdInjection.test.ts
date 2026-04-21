// tests/integration/agentOrgIdInjection.test.ts
// Finding O2 regression: org-scoped read-tool schemas no longer
// require org_id; the orchestrator supplies session.org_id at
// service-call time (plan: docs/09_briefs/phase-1.2/
// session-8-c6-prereq-o2-org-id-injection-plan.md).
//
// The bug: listChartOfAccounts, checkPeriod, and listJournalEntries
// schemas required org_id: z.string().uuid(); the system prompt
// deliberately excludes UUIDs; the orchestrator didn't inject.
// Result: agent emitted non-UUID placeholders, Zod rejected, the
// Q13 retry budget exhausted, and the structured response degraded
// to asking the human for the UUID.
//
// This test drives the fix via TDD. Before the fix it fails
// because the Zod schema rejects the missing org_id and the
// tool_result is_error=true. After the fix the schema no longer
// requires org_id and the orchestrator injects session.org_id
// before calling the service; the tool_result carries real CoA
// data.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { handleUserMessage } from '@/agent/orchestrator';
import { __setMockFixtureQueue } from '@/agent/orchestrator/callClaude';
import { makeMessage } from '../fixtures/anthropic/makeMessage';
import { makeTestContext } from '../setup/makeTestContext';
import { adminClient } from '@/db/adminClient';
import { SEED } from '../setup/testDb';

// Fixture: agent emits listChartOfAccounts with NO org_id in its
// input (the real observed shape — prompt has no UUID for the
// model to produce). Orchestrator must succeed by injecting
// session.org_id at service-call time.
const listCoaNoOrgIdTurn: Anthropic.Messages.Message = makeMessage(
  [
    {
      type: 'tool_use',
      id: 'toolu_list_O2',
      name: 'listChartOfAccounts',
      input: {},
      caller: { type: 'direct' },
    },
  ],
  'tool_use',
);

const respondAfterListTurn: Anthropic.Messages.Message = makeMessage(
  [
    {
      type: 'tool_use',
      id: 'toolu_respond_O2',
      name: 'respondToUser',
      input: {
        template_id: 'agent.accounts.listed',
        params: { count: 14 },
      },
      caller: { type: 'direct' },
    },
  ],
  'tool_use',
);

describe('Finding O2: org_id injection for org-scoped tools', () => {
  beforeEach(() => {
    __setMockFixtureQueue([listCoaNoOrgIdTurn, respondAfterListTurn]);
  });

  afterEach(async () => {
    __setMockFixtureQueue(null);
    await adminClient()
      .from('agent_sessions')
      .delete()
      .eq('user_id', SEED.USER_CONTROLLER);
  });

  it('listChartOfAccounts executes successfully when agent omits org_id', async () => {
    const ctx = makeTestContext({
      user_id: SEED.USER_CONTROLLER,
      org_ids: [SEED.ORG_HOLDING],
    });
    const response = await handleUserMessage(
      {
        user_id: SEED.USER_CONTROLLER,
        org_id: SEED.ORG_HOLDING,
        locale: 'en',
        message: 'list my accounts',
      },
      ctx,
    );

    // Load the persisted conversation and find the tool_result
    // that pairs with toolu_list_O2. Before the fix it's
    // is_error=true (Zod rejected); after the fix it carries
    // real CoA rows.
    const { data: session } = await adminClient()
      .from('agent_sessions')
      .select('conversation')
      .eq('session_id', response.session_id)
      .single();
    expect(session).not.toBeNull();

    const conv = session!.conversation as Array<{
      role: 'user' | 'assistant';
      content: string | Array<Record<string, unknown>>;
    }>;

    const toolResults = conv
      .filter((m) => m.role === 'user' && Array.isArray(m.content))
      .flatMap((m) => m.content as Array<Record<string, unknown>>)
      .filter((b) => b.type === 'tool_result' && b.tool_use_id === 'toolu_list_O2');

    expect(toolResults).toHaveLength(1);
    const result = toolResults[0];
    expect(result.is_error).not.toBe(true);
    // Tool output contains JSON-stringified array of accounts,
    // each with account_id. Presence of the field proves the
    // service call ran rather than Zod rejecting.
    expect(String(result.content)).toContain('account_id');
  });
});
