// tests/integration/agentNullCheckPeriodRecovery.test.ts
// CA-86: When periodService.isOpen() returns null (Bug B's observed
// state — wrong-year date picking a non-existent period), the
// orchestrator's null-handling plumbing must not leak UUIDs or
// fabricate period fields into the agent's user-facing response.
// Test motivation: Bug B observation. Test scope: orchestrator
// plumbing invariant (load-bearing at year-end close, manually-
// locked periods, any future legitimate null path). The prompt-
// contract behavior is validated via Phase D's paid-API Entry 1
// retry; T8's scope is narrower — plumbing, not prompt. Per docs/
// 09_briefs/phase-1.2/session-8-c6-prereq-o3-agent-date-context.md
// §5.d and the execution plan's Task C6 limitation note.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { handleUserMessage } from '@/agent/orchestrator';
import { __setMockFixtureQueue } from '@/agent/orchestrator/callClaude';
import { makeMessage } from '../fixtures/anthropic/makeMessage';
import { makeTestContext } from '../setup/makeTestContext';
import { adminClient } from '@/db/adminClient';
import { SEED } from '../setup/testDb';

const UUID_V4_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

describe('CA-86: agent handles null checkPeriod return', () => {
  beforeEach(() => {
    // Fixture queue:
    //   Turn 1: model emits checkPeriod with entry_date=2025-04-01 (Bug B's
    //           observed wrong-year date). The orchestrator calls the real
    //           periodService.isOpen() which returns null because SEED.ORG_HOLDING
    //           has no 2025 fiscal period (src/db/seed/dev.sql:117-119 seeds
    //           current FY only).
    //   Turn 2: model emits respondToUser with agent.response.natural template.
    //           Params contain ONLY a text field — no period_id, no is_locked,
    //           no start_date/end_date. Assertions verify this shape is preserved
    //           end-to-end without the orchestrator injecting UUID or period
    //           fields from the null tool_result.
    const checkPeriodTurn: Anthropic.Messages.Message = makeMessage(
      [
        {
          type: 'tool_use',
          id: 'toolu_check_T8',
          name: 'checkPeriod',
          input: { entry_date: '2025-04-01' },
          caller: { type: 'direct' },
        },
      ],
      'tool_use',
    );

    const respondToUserTurn: Anthropic.Messages.Message = makeMessage(
      [
        {
          type: 'tool_use',
          id: 'toolu_respond_T8',
          name: 'respondToUser',
          input: {
            template_id: 'agent.response.natural',
            params: {
              text: "I checked the period for April 2025 and it isn't currently available for posting. Could you confirm the entry date you intended?",
            },
          },
          caller: { type: 'direct' },
        },
      ],
      'tool_use',
    );

    __setMockFixtureQueue([checkPeriodTurn, respondToUserTurn]);
  });

  afterEach(async () => {
    __setMockFixtureQueue(null);
    await adminClient()
      .from('agent_sessions')
      .delete()
      .eq('user_id', SEED.USER_CONTROLLER);
  });

  it('preserves response shape when periodService.isOpen() returns null (no UUID leak, no fabricated period fields)', async () => {
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
        message: "Paid last year's office rent — $2,400 to Dufferin Properties, cheque went out April 1, 2025.",
      },
      ctx,
    );

    // (1) Plumbing smoke: orchestrator completed the two-turn loop without throwing.
    expect(response.session_id).toBeDefined();
    expect(response.response.template_id).toBe('agent.response.natural');
    expect(response.trace_id).toBe(ctx.trace_id);

    // (2) No UUID leak anywhere in the user-facing response params.
    const paramsJson = JSON.stringify(response.response.params);
    expect(paramsJson).not.toMatch(UUID_V4_REGEX);

    // (3) No fabricated period fields in params. These are fields from the
    //     period type that should NEVER appear in a user-facing response's
    //     params — the orchestrator must not surface them even if the null
    //     handling code is touched in a future refactor.
    expect(paramsJson).not.toContain('period_id');
    expect(paramsJson).not.toContain('is_locked');
    expect(paramsJson).not.toContain('start_date');
    expect(paramsJson).not.toContain('end_date');
    expect(paramsJson).not.toContain('dry_run_entry_id');

    // (4) Verify the real periodService.isOpen() returned null (not a period
    //     object) by inspecting the persisted session's conversation. The
    //     tool_result for checkPeriod must serialize the null return cleanly
    //     — not a leaky period object with UUID fields.
    const { data: session } = await adminClient()
      .from('agent_sessions')
      .select('conversation')
      .eq('session_id', response.session_id)
      .single();

    const conv = session!.conversation as Array<{
      role: 'user' | 'assistant';
      content: string | Array<Record<string, unknown>>;
    }>;

    const checkPeriodResults = conv
      .filter((m) => m.role === 'user' && Array.isArray(m.content))
      .flatMap((m) => m.content as Array<Record<string, unknown>>)
      .filter((b) => b.type === 'tool_result' && b.tool_use_id === 'toolu_check_T8');

    expect(checkPeriodResults).toHaveLength(1);
    const toolResult = checkPeriodResults[0];
    const toolResultContent = typeof toolResult.content === 'string'
      ? toolResult.content
      : JSON.stringify(toolResult.content);
    expect(toolResultContent).not.toMatch(UUID_V4_REGEX);
    expect(toolResultContent).not.toContain('period_id');
    expect(toolResultContent).not.toContain('is_locked');
  });
});
