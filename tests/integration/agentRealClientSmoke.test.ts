// tests/integration/agentRealClientSmoke.test.ts
// CA-66: real Anthropic API smoke test. One paid API call.
// Skips when ANTHROPIC_API_KEY is unset so local dev and CI
// can run the rest of the suite without the key.
//
// Clarification C: if this test fails with AGENT_UNAVAILABLE
// after a real API call, the classifier fired correctly and
// the production code path is sound — the key is the problem.
// Do NOT unwind Session 4 commits. See the session-close recap
// for the response template.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { handleUserMessage } from '@/agent/orchestrator';
import { __setMockFixtureQueue } from '@/agent/orchestrator/callClaude';
import { makeTestContext } from '../setup/makeTestContext';
import { adminClient } from '@/db/adminClient';
import { SEED } from '../setup/testDb';

const HAS_KEY = Boolean(process.env.ANTHROPIC_API_KEY);

describe.skipIf(!HAS_KEY)(
  'CA-66: real Claude API smoke test (paid — one call)',
  () => {
    beforeEach(() => {
      // Force production path — no fixture queue.
      __setMockFixtureQueue(null);
    });

    afterEach(async () => {
      await adminClient()
        .from('agent_sessions')
        .delete()
        .eq('user_id', SEED.USER_CONTROLLER);
    });

    it(
      'returns a structured response from the real Claude API',
      async () => {
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
            message: 'Hi, who am I?',
          },
          ctx,
        );

        // Shape assertions — the prompt framing instructs Claude
        // to respond via the respondToUser tool, so the response
        // must extract a structured template_id + params.
        expect(response.session_id).toBeDefined();
        expect(response.trace_id).toBe(ctx.trace_id);
        expect(response.response).toBeDefined();
        expect(typeof response.response.template_id).toBe('string');
        expect(response.response.template_id.length).toBeGreaterThan(0);
      },
      60_000, // generous timeout for real API call
    );
  },
);
