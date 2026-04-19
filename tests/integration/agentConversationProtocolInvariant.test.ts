// tests/integration/agentConversationProtocolInvariant.test.ts
// Session 5.1 / Bug 1 regression: Anthropic's API requires every
// `tool_use` block in an assistant message to be immediately
// followed by a matching `tool_result` in the next user message.
// The orchestrator-internal `respondToUser` tool_use has no
// matching tool_result (it's consumed by the orchestrator, not
// executed via executeTool). Before the fix, persistSession
// stored `respondToUser` in session.conversation, which caused
// Turn 2 of every multi-turn conversation to fail with
// Anthropic's 400 "tool_use ids were found without tool_result
// blocks immediately after."
//
// This test asserts two invariants on the persisted conversation:
//   (1) No `respondToUser` tool_use block exists anywhere.
//   (2) Every other tool_use has a matching tool_result in the
//       immediately-following user message (by tool_use_id).

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { handleUserMessage } from '@/agent/orchestrator';
import { __setMockFixtureQueue } from '@/agent/orchestrator/callClaude';
import { respondToUserHappyPath } from '../fixtures/anthropic/respondToUserHappyPath';
import {
  toolCallTurn,
  respondAfterToolTurn,
} from '../fixtures/anthropic/toolCallThenRespond';
import { makeTestContext } from '../setup/makeTestContext';
import { adminClient, SEED } from '../setup/testDb';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string | Anthropic.Messages.ContentBlock[];
}

/**
 * Validates the persisted conversation against Anthropic's
 * message-sequence contract. Returns a list of violations;
 * empty array means the conversation is protocol-valid.
 */
function validateProtocol(conversation: ConversationMessage[]): string[] {
  const violations: string[] = [];
  for (let i = 0; i < conversation.length; i++) {
    const msg = conversation[i];
    if (msg.role !== 'assistant') continue;
    if (typeof msg.content === 'string') continue;
    const toolUses = msg.content.filter(
      (b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use',
    );
    if (toolUses.length === 0) continue;

    // Any respondToUser? That's an automatic violation — it should
    // have been stripped at persist time.
    for (const tu of toolUses) {
      if (tu.name === 'respondToUser') {
        violations.push(
          `message[${i}] contains respondToUser tool_use (id=${tu.id}) — must be stripped from persisted content`,
        );
      }
    }

    // For non-respondToUser tool_uses, verify the next message is
    // a user message with matching tool_results.
    const nonRespondToolUses = toolUses.filter((t) => t.name !== 'respondToUser');
    if (nonRespondToolUses.length === 0) continue;

    const next = conversation[i + 1];
    if (!next || next.role !== 'user') {
      violations.push(
        `message[${i}] has unresolved tool_uses (${nonRespondToolUses.map((t) => t.id).join(', ')}) — no following user message with tool_results`,
      );
      continue;
    }
    if (typeof next.content === 'string') {
      violations.push(
        `message[${i + 1}] is text-only but message[${i}] has tool_uses requiring tool_results`,
      );
      continue;
    }

    const toolResultIds = new Set(
      (next.content as unknown as Array<{ type: string; tool_use_id?: string }>)
        .filter((b) => b.type === 'tool_result' && b.tool_use_id)
        .map((r) => r.tool_use_id!),
    );
    for (const tu of nonRespondToolUses) {
      if (!toolResultIds.has(tu.id)) {
        violations.push(
          `tool_use id=${tu.id} (${tu.name}) in message[${i}] has no matching tool_result in message[${i + 1}]`,
        );
      }
    }
  }
  return violations;
}

const USER = SEED.USER_CONTROLLER;
const ORG = SEED.ORG_HOLDING;

describe('agentConversationProtocolInvariant: persisted conversation is API-valid', () => {
  beforeEach(async () => {
    await adminClient()
      .from('agent_sessions')
      .delete()
      .eq('user_id', USER);
  });

  afterEach(async () => {
    __setMockFixtureQueue(null);
    await adminClient()
      .from('agent_sessions')
      .delete()
      .eq('user_id', USER);
  });

  it('respondToUser-only turn: persisted conversation has no tool_use blocks', async () => {
    __setMockFixtureQueue([respondToUserHappyPath]);
    const ctx = makeTestContext({ user_id: USER, org_ids: [ORG] });

    const res = await handleUserMessage(
      { user_id: USER, org_id: ORG, locale: 'en', message: 'Hi' },
      ctx,
    );

    const { data: session } = await adminClient()
      .from('agent_sessions')
      .select('conversation')
      .eq('session_id', res.session_id)
      .single();

    const conv = session?.conversation as ConversationMessage[];
    expect(conv).toBeDefined();

    const violations = validateProtocol(conv);
    expect(violations).toEqual([]);

    // Double-check: no respondToUser anywhere.
    for (const msg of conv) {
      if (msg.role !== 'assistant' || typeof msg.content === 'string') continue;
      for (const b of msg.content) {
        if (b.type === 'tool_use') {
          expect(b.name).not.toBe('respondToUser');
        }
      }
    }
  });

  it('tool_use + respondToUser in one turn: persisted conversation has the tool_use/result pair and no respondToUser', async () => {
    // Fixture B: turn 1 emits listChartOfAccounts tool_use;
    // after the tool_result comes back, turn 2 emits respondToUser.
    // In practice, Claude might also bundle BOTH in one turn
    // (tool_use + respondToUser). The current fixtures don't
    // exercise that exact shape, but the two-turn shape exercises
    // the same persistence concern: on turn 2 the orchestrator
    // must persist the full sequence including the
    // listChartOfAccounts tool_use + its result.
    __setMockFixtureQueue([toolCallTurn, respondAfterToolTurn]);
    const ctx = makeTestContext({ user_id: USER, org_ids: [ORG] });

    const res = await handleUserMessage(
      {
        user_id: USER,
        org_id: ORG,
        locale: 'en',
        message: 'Show me the accounts.',
      },
      ctx,
    );

    const { data: session } = await adminClient()
      .from('agent_sessions')
      .select('conversation')
      .eq('session_id', res.session_id)
      .single();

    const conv = session?.conversation as ConversationMessage[];
    expect(conv).toBeDefined();

    const violations = validateProtocol(conv);
    expect(violations).toEqual([]);

    // Confirm the conversation does contain the listChartOfAccounts
    // tool_use AND its tool_result pair — that's the protocol we
    // expect to preserve.
    let sawListTool = false;
    for (let i = 0; i < conv.length; i++) {
      const msg = conv[i];
      if (msg.role !== 'assistant' || typeof msg.content === 'string') continue;
      for (const b of msg.content) {
        if (b.type === 'tool_use' && b.name === 'listChartOfAccounts') {
          sawListTool = true;
          const next = conv[i + 1];
          expect(next).toBeDefined();
          expect(next.role).toBe('user');
          const resultIds = new Set(
            (next.content as unknown as Array<{ type: string; tool_use_id?: string }>)
              .filter((x) => x.type === 'tool_result' && x.tool_use_id)
              .map((r) => r.tool_use_id!),
          );
          expect(resultIds.has(b.id)).toBe(true);
        }
      }
    }
    expect(sawListTool).toBe(true);

    // No respondToUser anywhere.
    for (const msg of conv) {
      if (msg.role !== 'assistant' || typeof msg.content === 'string') continue;
      for (const b of msg.content) {
        if (b.type === 'tool_use') {
          expect(b.name).not.toBe('respondToUser');
        }
      }
    }
  });
});
