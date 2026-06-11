// tests/integration/ruleRegistryServiceLifecycle.integration.test.ts
//
// Ring 2A-core Commit 3 (ADR-0025 §6 / Decision 6). ruleRegistryService is the
// sole writer of rule_registry for lifecycle mutations: single-table UPDATEs
// that stamp the matching lineage anchor (_at) + actor (_by) column and audit
// via recordMutation. These methods wrap withInvariants for ServiceContext
// validation but pass NO `action` (the rule.* permission keys land in Commit 4),
// so the default test context (CONTROLLER, ORG_HOLDING) clears the four
// invariants.
//
// Covers: promote / demote / rename / retire stamp the right columns and leave
// the others null; retire is terminal (promote/demote/retire of a retired rule
// → RULE_LIFECYCLE_INVALID). Audit spot-checked on promote.

import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { ruleRegistryService } from '@/services/rules/ruleRegistryService';

describe('ruleRegistryService lifecycle mutations (ADR-0025 §6)', () => {
  const db = adminClient();
  const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] }); // user = CONTROLLER
  const createdRuleIds: string[] = [];

  // Seed a fresh proposed rule_registry row and return its id. Per-test rules
  // (fresh uuid) keep lifecycle assertions independent.
  async function seedRule(): Promise<string> {
    const id = crypto.randomUUID();
    const { error } = await db.from('rule_registry').insert({
      id,
      org_id: SEED.ORG_HOLDING,
      rule_type: 'pattern',
      lifecycle_state: 'proposed',
      name: 'TEST lifecycle rule',
    });
    if (error) throw new Error(`rule seed failed: ${error.message}`);
    createdRuleIds.push(id);
    return id;
  }

  afterAll(async () => {
    if (createdRuleIds.length > 0) {
      await db.from('rule_registry').delete().in('id', createdRuleIds);
    }
    // audit_log rows from recordMutation are append-only; left to accumulate.
  });

  it('promote stamps current_rung + lifecycle=active + promoted_at/by, leaves demoted/retired null', async () => {
    const ruleId = await seedRule();
    const result = await ruleRegistryService.promote(
      { org_id: SEED.ORG_HOLDING, rule_id: ruleId, target_rung: 'notify_and_auto_post' },
      ctx,
    );
    expect(result.current_rung).toBe('notify_and_auto_post');
    expect(result.promoted_at).toBeTruthy();

    const { data: row } = await db
      .from('rule_registry')
      .select('current_rung, lifecycle_state, promoted_at, promoted_by, demoted_at, retired_at')
      .eq('id', ruleId)
      .single();
    expect(row).toMatchObject({
      current_rung: 'notify_and_auto_post',
      lifecycle_state: 'active',
      promoted_by: SEED.USER_CONTROLLER,
      demoted_at: null,
      retired_at: null,
    });
    expect(row!.promoted_at).toBeTruthy();

    // Audit spot-check: recordMutation emits rule.promoted for the entity.
    const { data: audit } = await db
      .from('audit_log')
      .select('action, entity_type, entity_id')
      .eq('entity_id', ruleId)
      .eq('action', 'rule.promoted');
    expect(audit!.length).toBeGreaterThanOrEqual(1);
    expect(audit![0].entity_type).toBe('rule_registry');
  });

  it('demote resets current_rung=always_confirm + lifecycle=demoted + demoted_at/by', async () => {
    const ruleId = await seedRule();
    // Promote first so demote is a real descent.
    await ruleRegistryService.promote(
      { org_id: SEED.ORG_HOLDING, rule_id: ruleId, target_rung: 'silent_auto' },
      ctx,
    );
    await ruleRegistryService.demote({ org_id: SEED.ORG_HOLDING, rule_id: ruleId }, ctx);

    const { data: row } = await db
      .from('rule_registry')
      .select('current_rung, lifecycle_state, demoted_at, demoted_by')
      .eq('id', ruleId)
      .single();
    expect(row).toMatchObject({
      current_rung: 'always_confirm',
      lifecycle_state: 'demoted',
      demoted_by: SEED.USER_CONTROLLER,
    });
    expect(row!.demoted_at).toBeTruthy();
  });

  it('rename updates the display name without touching lifecycle', async () => {
    const ruleId = await seedRule();
    await ruleRegistryService.rename(
      { org_id: SEED.ORG_HOLDING, rule_id: ruleId, name: 'Renamed rule' },
      ctx,
    );
    const { data: row } = await db
      .from('rule_registry')
      .select('name, lifecycle_state')
      .eq('id', ruleId)
      .single();
    expect(row).toMatchObject({ name: 'Renamed rule', lifecycle_state: 'proposed' });
  });

  it('retire stamps lifecycle=retired + retired_at/by (terminal)', async () => {
    const ruleId = await seedRule();
    await ruleRegistryService.retire({ org_id: SEED.ORG_HOLDING, rule_id: ruleId }, ctx);
    const { data: row } = await db
      .from('rule_registry')
      .select('lifecycle_state, retired_at, retired_by')
      .eq('id', ruleId)
      .single();
    expect(row).toMatchObject({ lifecycle_state: 'retired', retired_by: SEED.USER_CONTROLLER });
    expect(row!.retired_at).toBeTruthy();
  });

  it('retired is terminal: promote / demote / retire all reject with RULE_LIFECYCLE_INVALID', async () => {
    const ruleId = await seedRule();
    await ruleRegistryService.retire({ org_id: SEED.ORG_HOLDING, rule_id: ruleId }, ctx);

    await expect(
      ruleRegistryService.promote(
        { org_id: SEED.ORG_HOLDING, rule_id: ruleId, target_rung: 'notify_and_auto_post' },
        ctx,
      ),
    ).rejects.toThrow('RULE_LIFECYCLE_INVALID');
    await expect(
      ruleRegistryService.demote({ org_id: SEED.ORG_HOLDING, rule_id: ruleId }, ctx),
    ).rejects.toThrow('RULE_LIFECYCLE_INVALID');
    await expect(
      ruleRegistryService.retire({ org_id: SEED.ORG_HOLDING, rule_id: ruleId }, ctx),
    ).rejects.toThrow('RULE_LIFECYCLE_INVALID');
  });

  it('rejects a lookup miss with RULE_NOT_FOUND', async () => {
    await expect(
      ruleRegistryService.promote(
        { org_id: SEED.ORG_HOLDING, rule_id: crypto.randomUUID(), target_rung: 'silent_auto' },
        ctx,
      ),
    ).rejects.toThrow('RULE_NOT_FOUND');
  });
});
