// tests/integration/onboardingStep2And3Transition.test.ts
// CA-69: createOrganization success advances onboarding state
// atomically through steps 2 AND 3 (sub-brief §6.4 item 3 +
// master §11.3: industry selection is embedded in the
// createOrganization flow).

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { handleUserMessage } from '@/agent/orchestrator';
import { __setMockFixtureQueue } from '@/agent/orchestrator/callClaude';
import { makeMessage } from '../fixtures/anthropic/makeMessage';
import { makeTestContext } from '../setup/makeTestContext';
import { adminClient, SEED } from '../setup/testDb';

const USER = SEED.USER_AP_SPECIALIST;
const ORG_NAME_PREFIX = 'CA-69 Test Org';

async function getHoldingCompanyIndustryId(): Promise<string> {
  const { data } = await adminClient()
    .from('industries')
    .select('industry_id')
    .eq('slug', 'holding_company')
    .single();
  if (!data) throw new Error('holding_company industry missing from seed');
  return data.industry_id;
}

describe('CA-69: onboarding step 2+3 atomic transition', () => {
  const ctx = makeTestContext({
    user_id: USER,
    org_ids: [SEED.ORG_REAL_ESTATE],
  });
  const orgName = `${ORG_NAME_PREFIX} ${crypto.randomUUID().slice(0, 8)}`;

  beforeEach(async () => {
    await adminClient()
      .from('agent_sessions')
      .delete()
      .eq('user_id', USER)
      .is('org_id', null);
  });

  afterEach(async () => {
    __setMockFixtureQueue(null);
    await adminClient()
      .from('agent_sessions')
      .delete()
      .eq('user_id', USER)
      .is('org_id', null);
    // Clean up the test org if it got created
    await adminClient().from('organizations').delete().eq('name', orgName);
  });

  it('advances current_step to 4 with completed_steps = [1, 2, 3]', async () => {
    const industryId = await getHoldingCompanyIndustryId();

    __setMockFixtureQueue([
      makeMessage(
        [
          {
            type: 'tool_use',
            id: 'toolu_create_org',
            name: 'createOrganization',
            input: {
              name: orgName,
              industryId,
              fiscalYearStartMonth: 1,
              baseCurrency: 'CAD',
              businessStructure: 'corporation',
              timeZone: 'America/Vancouver',
              defaultLocale: 'en',
            },
            caller: { type: 'direct' },
          },
        ],
        'tool_use',
      ),
      makeMessage(
        [
          {
            type: 'tool_use',
            id: 'toolu_respond',
            name: 'respondToUser',
            input: {
              template_id: 'agent.greeting.welcome',
              params: { user_name: 'Alex' },
            },
            caller: { type: 'direct' },
          },
        ],
        'tool_use',
      ),
    ]);

    const response = await handleUserMessage(
      {
        user_id: USER,
        org_id: null,
        locale: 'en',
        tz: 'UTC',
        message: `Create an org named ${orgName}.`,
        initial_onboarding: {
          in_onboarding: true,
          current_step: 2,
          completed_steps: [1],
          invited_user: false,
        },
      },
      ctx,
    );
    expect(response.onboarding_complete).toBeUndefined();

    const { data: session } = await adminClient()
      .from('agent_sessions')
      .select('state')
      .eq('session_id', response.session_id)
      .single();
    const onboarding = (session?.state as Record<string, unknown>)
      ?.onboarding as Record<string, unknown>;
    expect(onboarding.current_step).toBe(4);
    expect(new Set(onboarding.completed_steps as number[])).toEqual(
      new Set([1, 2, 3]),
    );
    expect(onboarding.in_onboarding).toBe(true);
  });
});
