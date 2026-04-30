// tests/fixtures/anthropic/toolCallThenRespond.ts
// Fixture B — two-turn sequence. Turn 1: listChartOfAccounts
// tool_use. Turn 2 (after the orchestrator returns the tool
// result): respondToUser tool_use.
//
// The test that uses this fixture seeds the queue as
// [toolCallTurn, respondAfterToolTurn].

import type Anthropic from '@anthropic-ai/sdk';
import { makeMessage } from './makeMessage';

// Finding O2 (Option 3a): listChartOfAccounts schema no longer
// requires org_id; the orchestrator supplies it from
// session.org_id at service-call time. The fixture reflects what
// the model actually emits — an empty input object.
export const toolCallTurn: Anthropic.Messages.Message = makeMessage(
  [
    {
      type: 'tool_use',
      id: 'toolu_list_B',
      name: 'listChartOfAccounts',
      input: {},
      caller: { type: 'direct' },
    },
  ],
  'tool_use',
);

export const respondAfterToolTurn: Anthropic.Messages.Message = makeMessage(
  [
    {
      type: 'tool_use',
      id: 'toolu_respond_B',
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
