// tests/integration/userProfileAudit.test.ts
// CA-15: updateProfile writes user.profile_updated to audit_log.
// - Update branch: existing row → audit has before_state populated.
// - Upsert-insert branch (Session 5.2): row absent → upsert
//   creates it, audit has before_state: null per Phase 1.5A
//   convention distinguishing "created" from "mutated."

import { describe, it, expect, afterAll, beforeEach } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { userProfileService } from '@/services/user/userProfileService';
import type { ServiceContext } from '@/services/middleware/serviceContext';

describe('CA-15: updateProfile audit logging', () => {
  const db = adminClient();
  const traceId = crypto.randomUUID();
  const ctx: ServiceContext = {
    trace_id: traceId,
    caller: { verified: true, user_id: SEED.USER_CONTROLLER, email: 'controller@thebridge.local', org_ids: [SEED.ORG_HOLDING] },
    locale: 'en',
  };

  afterAll(async () => {
    await db.from('audit_log').delete().eq('trace_id', traceId);
    await db.from('user_profiles').update({ display_name: 'Controller User' }).eq('user_id', SEED.USER_CONTROLLER);
  });

  it('writes user.profile_updated with before_state (update branch)', async () => {
    await userProfileService.updateProfile(
      { user_id: SEED.USER_CONTROLLER, patch: { displayName: 'Updated Name' } },
      ctx,
    );

    const { data: auditRows } = await db
      .from('audit_log')
      .select('*')
      .eq('trace_id', traceId)
      .eq('action', 'user.profile_updated');

    expect(auditRows).toHaveLength(1);
    expect(auditRows![0].entity_type).toBe('user_profile');
    expect(auditRows![0].entity_id).toBe(SEED.USER_CONTROLLER);
    expect(auditRows![0].before_state).toBeTruthy();
    expect((auditRows![0].before_state as Record<string, unknown>).display_name).toBe('Controller User');
  });
});

describe('Session 5.2: updateProfile upsert-insert branch', () => {
  const db = adminClient();
  const upsertTraceId = crypto.randomUUID();
  // Use a synthetic user_id that doesn't exist in user_profiles
  // (but satisfies the FK to auth.users via a seed user we'll
  // strip from user_profiles pre-test and restore post-test).
  // Simpler: use USER_AP_SPECIALIST and delete their profile row
  // (if any) before the test. Seed data has a profile for them;
  // we delete it to simulate the bypass-sign-in state.
  const testUser = SEED.USER_AP_SPECIALIST;
  const ctx: ServiceContext = {
    trace_id: upsertTraceId,
    caller: {
      verified: true,
      user_id: testUser,
      email: 'ap@thebridge.local',
      org_ids: [SEED.ORG_REAL_ESTATE],
    },
    locale: 'en',
  };

  beforeEach(async () => {
    // Simulate the bypass-sign-in state: auth.users row exists,
    // user_profiles row does not.
    await db.from('audit_log').delete().eq('trace_id', upsertTraceId);
    await db.from('user_profiles').delete().eq('user_id', testUser);
  });

  afterAll(async () => {
    await db.from('audit_log').delete().eq('trace_id', upsertTraceId);
    // Restore seed state for downstream tests.
    await db.from('user_profiles').delete().eq('user_id', testUser);
    await db
      .from('user_profiles')
      .insert({
        user_id: testUser,
        first_name: 'AP',
        last_name: 'Specialist',
        display_name: 'AP Specialist',
      });
  });

  it('upsert creates user_profiles row when absent; audit has before_state: null', async () => {
    // Verify precondition: row really is absent.
    const { data: preCheck } = await db
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', testUser)
      .maybeSingle();
    expect(preCheck).toBeNull();

    await userProfileService.updateProfile(
      { user_id: testUser, patch: { displayName: 'Upsert Inserted Name' } },
      ctx,
    );

    // Row now exists.
    const { data: row } = await db
      .from('user_profiles')
      .select('display_name')
      .eq('user_id', testUser)
      .maybeSingle();
    expect(row?.display_name).toBe('Upsert Inserted Name');

    // Audit row has before_state null (Phase 1.5A convention).
    const { data: auditRows } = await db
      .from('audit_log')
      .select('*')
      .eq('trace_id', upsertTraceId)
      .eq('action', 'user.profile_updated');
    expect(auditRows).toHaveLength(1);
    expect(auditRows![0].entity_id).toBe(testUser);
    expect(auditRows![0].before_state).toBeNull();
  });
});
