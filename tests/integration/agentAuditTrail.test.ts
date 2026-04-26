// tests/integration/agentAuditTrail.test.ts
// CA-64: handleUserMessage that executes listChartOfAccounts
// then respondToUser writes agent.message_processed and
// agent.tool_executed rows to audit_log with matching trace_id.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { handleUserMessage } from '@/agent/orchestrator';
import { __setMockFixtureQueue } from '@/agent/orchestrator/callClaude';
import {
  toolCallTurn,
  respondAfterToolTurn,
} from '../fixtures/anthropic/toolCallThenRespond';
import { makeTestContext } from '../setup/makeTestContext';
import { adminClient } from '@/db/adminClient';
import { SEED } from '../setup/testDb';

describe('CA-64: agent.* audit trail (message_processed + tool_executed)', () => {
  beforeEach(() => {
    __setMockFixtureQueue([toolCallTurn, respondAfterToolTurn]);
  });

  afterEach(async () => {
    __setMockFixtureQueue(null);
    await adminClient()
      .from('agent_sessions')
      .delete()
      .eq('user_id', SEED.USER_CONTROLLER);
  });

  it('writes both agent.message_processed and agent.tool_executed with matching trace_id', async () => {
    const ctx = makeTestContext({
      user_id: SEED.USER_CONTROLLER,
      org_ids: [SEED.ORG_HOLDING],
    });

    await handleUserMessage(
      {
        user_id: SEED.USER_CONTROLLER,
        org_id: SEED.ORG_HOLDING,
        locale: 'en',
        tz: 'UTC',
        message: 'Show me the chart of accounts',
      },
      ctx,
    );

    const db = adminClient();
    const { data: auditRows } = await db
      .from('audit_log')
      .select('action, entity_type, tool_name')
      .eq('trace_id', ctx.trace_id)
      .order('created_at', { ascending: true });

    const actions = (auditRows ?? []).map((r) => r.action);
    expect(actions).toContain('agent.message_processed');
    expect(actions).toContain('agent.tool_executed');

    const toolExecuted = (auditRows ?? []).find(
      (r) => r.action === 'agent.tool_executed',
    );
    expect(toolExecuted?.tool_name).toBe('listChartOfAccounts');

    const messageProcessed = (auditRows ?? []).find(
      (r) => r.action === 'agent.message_processed',
    );
    expect(messageProcessed?.entity_type).toBe('agent_session');

    // Cleanup audit rows that this test emitted (agent_session
    // rows are tied to this trace only).
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });
});
