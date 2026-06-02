// tests/integration/workflowCoreSubstrate.integration.test.ts
//
// ADR-0028 (Workflow Core Substrate, V1 governance arc, Wave 1) — migration
// 20240171000000. The substrate is INERT (no live writer until a consumer
// wave); these tests assert the substrate's *enforcement* shape, not any
// live workflow behaviour:
//
//  - v1-active CHECK: workflow_instances.state is narrowed to 'pending'
//    (D-0028.1 inert posture); a reserved state is rejected.
//  - APPEND-ONLY (workflow_events): BEFORE UPDATE/DELETE triggers raise even
//    for service_role (all-path; the events/audit_log precedent). This is the
//    physical substrate behind reserved INV-WORKFLOW-002 (D-0028.8).
//  - RLS org-isolation: user_has_org_access scopes SELECT; a row in one org
//    is invisible to a user scoped to another (the canvas read path is NOT
//    foreclosed — SELECT stays org-scoped; only UPDATE/DELETE are blocked).
//
// Append-only + FK ON DELETE RESTRICT mean the workflow_events row (and its
// parent instance) cannot be torn down; like journal_entries / audit_log they
// accumulate and are reset by `pnpm db:reset:clean`. Event-less instances are
// cleaned. All rows are scoped to a per-run trace_id.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { adminClient, userClientFor, SEED } from '../setup/testDb';

describe('workflow_core_substrate — ADR-0028 Wave 1 (inert substrate enforcement)', () => {
  const db = adminClient();
  const TRACE = crypto.randomUUID();
  const cleanableInstanceIds: string[] = []; // event-less instances (deletable)

  function instanceRow(orgId: string, state = 'pending') {
    return {
      org_id: orgId,
      definition_key: 'test_definition',
      definition_version: '1.0.0',
      state,
      trace_id: TRACE,
      created_by: 'integration-test',
    };
  }

  afterAll(async () => {
    // Event-less instances are deletable; append-only events + their parent
    // instances (ON DELETE RESTRICT) are not — they accumulate (JE/audit_log
    // precedent; db:reset:clean is the reset boundary).
    if (cleanableInstanceIds.length > 0) {
      await db.from('workflow_instances').delete().in('id', cleanableInstanceIds);
    }
  });

  it('v1-active CHECK: state=pending inserts; a reserved state is rejected', async () => {
    const ok = await db.from('workflow_instances').insert(instanceRow(SEED.ORG_HOLDING)).select().single();
    expect(ok.error).toBeNull();
    expect(ok.data!.state).toBe('pending');
    cleanableInstanceIds.push(ok.data!.id);

    // 'running' is a valid enum value but excluded by the v1-active CHECK.
    const bad = await db.from('workflow_instances').insert(instanceRow(SEED.ORG_HOLDING, 'running')).select().single();
    expect(bad.error).toBeTruthy();
    expect(bad.error!.message).toMatch(/workflow_instances_state_v1_active|violates check constraint/i);
  });

  it('APPEND-ONLY: workflow_events rejects UPDATE and DELETE even for service_role', async () => {
    const inst = await db.from('workflow_instances').insert(instanceRow(SEED.ORG_HOLDING)).select().single();
    expect(inst.error).toBeNull();
    const instanceId = inst.data!.id;
    // NOTE: this instance has an event below -> ON DELETE RESTRICT; not cleanable.

    const evt = await db
      .from('workflow_events')
      .insert({
        org_id: SEED.ORG_HOLDING,
        workflow_instance_id: instanceId,
        event_type: 'ai_step_recorded',
        payload: { stage: 'test' },
        ai_output: { recorded: true },
        trace_id: TRACE,
      })
      .select()
      .single();
    expect(evt.error).toBeNull();
    const eventId = evt.data!.id;

    // BEFORE UPDATE trigger raises (all-path; service_role does not bypass triggers).
    const upd = await db.from('workflow_events').update({ activity_key: 'mutated' }).eq('id', eventId);
    expect(upd.error).toBeTruthy();
    expect(upd.error!.message).toMatch(/append-only/i);

    // BEFORE DELETE trigger raises.
    const del = await db.from('workflow_events').delete().eq('id', eventId);
    expect(del.error).toBeTruthy();
    expect(del.error!.message).toMatch(/append-only/i);

    // Row is unchanged.
    const after = await db.from('workflow_events').select('activity_key').eq('id', eventId).single();
    expect(after.data!.activity_key).toBeNull();
  });

  it('RLS: a workflow_instances row is visible only within its org', async () => {
    const holding = await db.from('workflow_instances').insert(instanceRow(SEED.ORG_HOLDING)).select().single();
    const realEstate = await db.from('workflow_instances').insert(instanceRow(SEED.ORG_REAL_ESTATE)).select().single();
    expect(holding.error).toBeNull();
    expect(realEstate.error).toBeNull();
    cleanableInstanceIds.push(holding.data!.id, realEstate.data!.id);

    // ap@thebridge.local is a member of ORG_REAL_ESTATE (22222), not ORG_HOLDING.
    const apClient: SupabaseClient = await userClientFor('ap@thebridge.local', 'DevSeed!ApSpec#1');

    // The ORG_REAL_ESTATE user sees the real-estate row...
    const seen = await apClient
      .from('workflow_instances')
      .select('id')
      .eq('trace_id', TRACE)
      .eq('org_id', SEED.ORG_REAL_ESTATE);
    expect(seen.error).toBeNull();
    expect(seen.data!.some((r) => r.id === realEstate.data!.id)).toBe(true);

    // ...and cannot see the cross-org (ORG_HOLDING) row.
    const blocked = await apClient
      .from('workflow_instances')
      .select('id')
      .eq('org_id', SEED.ORG_HOLDING);
    expect(blocked.error).toBeNull();
    expect(blocked.data).toEqual([]);
  });
});
