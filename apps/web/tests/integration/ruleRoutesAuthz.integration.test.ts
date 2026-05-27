// tests/integration/ruleRoutesAuthz.integration.test.ts
//
// Ring 2A-core Commit 4 (ADR-0025 §9 / §11). The authorization layer the rule
// routes add: withInvariants({ action: 'rule.<verb>' }) — the controller-only
// permission gate (Invariant 4) + cross-org isolation (Invariant 3). Tested at the
// withInvariants level — the exact wrap the route handlers apply
// (`withInvariants(ruleRegistryService.<verb>, { action })(parsed, ctx)`) — via
// makeTestContext per role, the integration-test convention. The lifecycle BEHAVIOR
// of the service methods is covered by ruleRegistryServiceLifecycle.test.ts; this
// file covers ONLY the new authz gate (non-duplication).
//
// Seed memberships (dev.sql): controller (USER_CONTROLLER) → both orgs;
// ap_specialist (USER_AP_SPECIALIST) → Real Estate only; executive (USER_EXECUTIVE)
// → both orgs. rule.* granted to controller ONLY (migration 20240166), so the
// ap/exec denials are genuine role-lacks-permission, not no-membership.

import { describe, it, expect, afterAll } from 'vitest';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { ruleRegistryService } from '@/services/rules/ruleRegistryService';
import { withInvariants } from '@/services/middleware/withInvariants';
import type { ActionName } from '@/services/auth/canUserPerformAction';

// Heterogeneous service-method inputs (promote carries target_rung; rename carries
// name) → a loose call signature for the parameterized table. `as unknown as` keeps
// it off `any`; each method's real input is satisfied by the per-action body().
type LooseVerb = (input: Record<string, unknown>, ctx: ServiceContext) => Promise<unknown>;

const ACTIONS: Array<{
  name: string;
  verb: LooseVerb;
  action: ActionName;
  body: (ruleId: string) => Record<string, unknown>;
}> = [
  { name: 'promote', verb: ruleRegistryService.promote as unknown as LooseVerb, action: 'rule.promote', body: (rule_id) => ({ rule_id, target_rung: 'notify_and_auto_post' }) },
  { name: 'demote', verb: ruleRegistryService.demote as unknown as LooseVerb, action: 'rule.demote', body: (rule_id) => ({ rule_id }) },
  { name: 'rename', verb: ruleRegistryService.rename as unknown as LooseVerb, action: 'rule.rename', body: (rule_id) => ({ rule_id, name: 'Renamed by authz test' }) },
  { name: 'retire', verb: ruleRegistryService.retire as unknown as LooseVerb, action: 'rule.retire', body: (rule_id) => ({ rule_id }) },
];

describe('rule routes — controller-only authz + cross-org isolation (ADR-0025 §9)', () => {
  const db = adminClient();
  const createdRuleIds: string[] = [];

  async function seedRule(): Promise<string> {
    const id = crypto.randomUUID();
    const { error } = await db.from('rule_registry').insert({
      id, org_id: SEED.ORG_HOLDING, rule_type: 'pattern', lifecycle_state: 'active', name: 'TEST authz rule',
    });
    if (error) throw new Error(`rule seed failed: ${error.message}`);
    createdRuleIds.push(id);
    return id;
  }

  afterAll(async () => {
    if (createdRuleIds.length > 0) await db.from('rule_registry').delete().in('id', createdRuleIds);
  });

  for (const { name, verb, action, body } of ACTIONS) {
    it(`${name}: controller passes the ${action} gate (success path)`, async () => {
      const ruleId = await seedRule(); // fresh rule per action — no inter-action interference
      const ctx = makeTestContext({ user_id: SEED.USER_CONTROLLER, org_ids: [SEED.ORG_HOLDING] });
      const wrapped = withInvariants(verb, { action });
      await expect(wrapped({ org_id: SEED.ORG_HOLDING, ...body(ruleId) }, ctx)).resolves.toBeDefined();
    });

    it(`${name}: ap_specialist denied — ${action} not granted (PERMISSION_DENIED)`, async () => {
      const ctx = makeTestContext({ user_id: SEED.USER_AP_SPECIALIST, org_ids: [SEED.ORG_REAL_ESTATE] });
      const wrapped = withInvariants(verb, { action });
      await expect(
        wrapped({ org_id: SEED.ORG_REAL_ESTATE, ...body(crypto.randomUUID()) }, ctx),
      ).rejects.toThrow('PERMISSION_DENIED');
    });

    it(`${name}: executive denied — ${action} not granted (PERMISSION_DENIED)`, async () => {
      const ctx = makeTestContext({ user_id: SEED.USER_EXECUTIVE, org_ids: [SEED.ORG_HOLDING] });
      const wrapped = withInvariants(verb, { action });
      await expect(
        wrapped({ org_id: SEED.ORG_HOLDING, ...body(crypto.randomUUID()) }, ctx),
      ).rejects.toThrow('PERMISSION_DENIED');
    });

    it(`${name}: cross-org denied — target org outside caller's set (ORG_ACCESS_DENIED)`, async () => {
      // Caller's active org set is HOLDING; the request targets REAL_ESTATE.
      // Invariant 3 fires before the permission check — pure org-scoping.
      const ctx = makeTestContext({ user_id: SEED.USER_CONTROLLER, org_ids: [SEED.ORG_HOLDING] });
      const wrapped = withInvariants(verb, { action });
      await expect(
        wrapped({ org_id: SEED.ORG_REAL_ESTATE, ...body(crypto.randomUUID()) }, ctx),
      ).rejects.toThrow('ORG_ACCESS_DENIED');
    });
  }

  describe('list route (ruleRegistryService.listForCanvas) — org scoping', () => {
    it('returns the caller-org rule and is org-scoped', async () => {
      const ruleId = await seedRule(); // HOLDING
      const ctx = makeTestContext({ user_id: SEED.USER_CONTROLLER, org_ids: [SEED.ORG_HOLDING] });
      const rules = await ruleRegistryService.listForCanvas({ org_id: SEED.ORG_HOLDING }, ctx);
      expect(rules.map((r) => r.id)).toContain(ruleId);
    });

    it('cross-org list denied (ORG_ACCESS_DENIED)', async () => {
      const ctx = makeTestContext({ user_id: SEED.USER_CONTROLLER, org_ids: [SEED.ORG_HOLDING] });
      await expect(
        ruleRegistryService.listForCanvas({ org_id: SEED.ORG_REAL_ESTATE }, ctx),
      ).rejects.toThrow('ORG_ACCESS_DENIED');
    });
  });
});
