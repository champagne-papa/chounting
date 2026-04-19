// tests/fixtures/anthropic/respondToUserHappyPath.ts
// Fixture A — single turn ending with a respondToUser tool_use
// block. Exercises the happy path where Claude produces a
// structured response on the first turn.

import type Anthropic from '@anthropic-ai/sdk';
import { makeMessage } from './makeMessage';

export const respondToUserHappyPath: Anthropic.Messages.Message = makeMessage(
  [
    {
      type: 'tool_use',
      id: 'toolu_respond_A',
      name: 'respondToUser',
      input: {
        template_id: 'agent.greeting.welcome',
        params: { user_name: 'Jamie' },
      },
      caller: { type: 'direct' },
    },
  ],
  'tool_use',
);
