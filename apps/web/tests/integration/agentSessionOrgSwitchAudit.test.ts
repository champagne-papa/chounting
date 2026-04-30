// tests/integration/agentSessionOrgSwitchAudit.test.ts
// CA-65: session org-switch detection and audit emits per
// master §16 + Clarification E. Two it-blocks in one file
// (matches Session 3's CA-48 / CA-51 pattern).

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadOrCreateSession } from '@/agent/orchestrator/loadOrCreateSession';
import { adminClient } from '@/db/adminClient';
import { SEED } from '../setup/testDb';
import { loggerWith } from '@/shared/logger/pino';
import { makeTestContext } from '../setup/makeTestContext';

const USER = SEED.USER_EXECUTIVE;

describe('CA-65: agent.session_org_switched audit emits', () => {
  let ctx: ReturnType<typeof makeTestContext>;
  let log: ReturnType<typeof loggerWith>;

  beforeEach(async () => {
    // Per-test ctx so each it block gets a fresh trace_id.
    // NOTE: audit_log rows from this test are NOT deleted — the
    // table is append-only per INV-AUDIT-002 (Layer 1a,
    // migration 20240122000000_audit_log_append_only.sql), and
    // DELETE is rejected by trigger. The prior idiom
    // (.from('audit_log').delete().eq('trace_id', ...)) silently
    // fails under Supabase-js and was the cause of CA-65's
    // regression — rows accumulated across the two it blocks
    // when they shared a describe-scoped trace_id. Per-test
    // trace_id plus dropping the audit_log delete is the
    // precedent pattern from dc757c3 (applied to
    // crossOrgRlsIsolation.test.ts).
    ctx = makeTestContext({
      user_id: USER,
      org_ids: [SEED.ORG_HOLDING, SEED.ORG_REAL_ESTATE],
    });
    log = loggerWith({ trace_id: ctx.trace_id });

    await adminClient().from('agent_sessions').delete().eq('user_id', USER);
  });

  afterEach(async () => {
    await adminClient().from('agent_sessions').delete().eq('user_id', USER);
  });

  it('org_A → org_B emits one agent.session_org_switched row with before_state.previous_org_id = org_A', async () => {
    // First session for org_A
    const s1 = await loadOrCreateSession(
      { user_id: USER, org_id: SEED.ORG_HOLDING, locale: 'en' },
      ctx,
      log,
    );
    expect(s1.org_id).toBe(SEED.ORG_HOLDING);

    // Second session for org_B — new session created, switch audit emitted
    const s2 = await loadOrCreateSession(
      { user_id: USER, org_id: SEED.ORG_REAL_ESTATE, locale: 'en' },
      ctx,
      log,
    );
    expect(s2.org_id).toBe(SEED.ORG_REAL_ESTATE);
    expect(s2.session_id).not.toBe(s1.session_id);

    const { data: auditRows } = await adminClient()
      .from('audit_log')
      .select('action, entity_id, before_state, org_id')
      .eq('trace_id', ctx.trace_id)
      .eq('action', 'agent.session_org_switched');

    expect(auditRows).toHaveLength(1);
    expect(auditRows![0].org_id).toBe(SEED.ORG_REAL_ESTATE);
    expect(auditRows![0].entity_id).toBe(s2.session_id);
    const beforeState = auditRows![0].before_state as Record<string, unknown>;
    expect(beforeState.previous_org_id).toBe(SEED.ORG_HOLDING);
  });

  it('null (onboarding) → org_X emits agent.session_org_switched with before_state.previous_org_id = null; zero session_created rows', async () => {
    // Onboarding session (null org)
    const sOnboarding = await loadOrCreateSession(
      { user_id: USER, org_id: null, locale: 'en' },
      ctx,
      log,
    );
    expect(sOnboarding.org_id).toBeNull();

    // Transition to a real org
    const sOrg = await loadOrCreateSession(
      { user_id: USER, org_id: SEED.ORG_HOLDING, locale: 'en' },
      ctx,
      log,
    );
    expect(sOrg.org_id).toBe(SEED.ORG_HOLDING);
    expect(sOrg.session_id).not.toBe(sOnboarding.session_id);

    const { data: switchRows } = await adminClient()
      .from('audit_log')
      .select('action, entity_id, before_state, org_id')
      .eq('trace_id', ctx.trace_id)
      .eq('action', 'agent.session_org_switched');

    expect(switchRows).toHaveLength(1);
    expect(switchRows![0].org_id).toBe(SEED.ORG_HOLDING);
    expect(switchRows![0].entity_id).toBe(sOrg.session_id);
    const beforeState = switchRows![0].before_state as Record<string, unknown>;
    expect(beforeState.previous_org_id).toBeNull();

    // And zero agent.session_created rows — per Clarification D
    // the onboarding session's creation emits no audit (null org),
    // and the subsequent org-session creation is classified as a
    // switch, not a create.
    const { data: createRows } = await adminClient()
      .from('audit_log')
      .select('action')
      .eq('trace_id', ctx.trace_id)
      .eq('action', 'agent.session_created');
    expect(createRows).toHaveLength(0);
  });
});
