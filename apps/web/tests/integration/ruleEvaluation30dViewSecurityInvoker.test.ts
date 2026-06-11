// security_invoker behavior for rule_evaluation_30d_view (ADR-0024 §2 /
// migration 20240164000000 §d).
//
// WHY THIS TEST EXISTS (distinct from generic RLS isolation):
// This verifies the specific precedent-improvement ADR-0024 made over
// document_cards_view (migration 20240154000000). A plain Postgres view runs
// with the VIEW OWNER's rights (security_invoker = false, the PG15 default), so
// it evaluates the underlying table's RLS as the owner — bypassing the querying
// user's RLS and leaking cross-org rows to any authenticated caller with SELECT
// on the view. document_cards_view is only safe because its v1 read path is
// service-role at the route handler with app-code org-scoping; a direct
// user-scoped query against it would leak.
//
// rule_evaluation_30d_view ships WITH (security_invoker = true) so it evaluates
// rule_evaluation_log's RLS as the QUERYING USER. A user-scoped client therefore
// sees only their own org's aggregates through the view — no owner-bypass leak.
//
// Do NOT fold this into ruleEvaluationLogRlsIsolation.test.ts as a generic "view
// is RLS-filtered" check: that would lose the verification that security_invoker
// actually works. The adminClient control below proves the org-B row exists and
// WOULD aggregate-and-leak without security_invoker.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { adminClient, userClientFor, SEED } from '../setup/testDb';

describe('rule_evaluation_30d_view security_invoker = true inherits RLS for user-scoped clients', () => {
  let apClient: SupabaseClient;  // AP Specialist — RE-org member, non-controller
  let ruleHolding: string;
  let ruleRealEstate: string;
  const evalIds: string[] = [];

  beforeAll(async () => {
    const db = adminClient();
    ruleHolding = crypto.randomUUID();
    ruleRealEstate = crypto.randomUUID();

    const { error: regErr } = await db.from('rule_registry').insert([
      { id: ruleHolding, org_id: SEED.ORG_HOLDING, rule_type: 'pattern', lifecycle_state: 'active', name: 'TEST 30d-view Holding' },
      { id: ruleRealEstate, org_id: SEED.ORG_REAL_ESTATE, rule_type: 'pattern', lifecycle_state: 'active', name: 'TEST 30d-view RE' },
    ]);
    if (regErr) throw new Error(`Failed to insert rule_registry: ${regErr.message}`);

    // Within the trailing-30-day window (created_at defaults to now()):
    //   RE  rule → 2 evaluations (so evaluation_count = 2 is observable),
    //   holding rule → 1 evaluation (the cross-org row that must NOT leak).
    const rows = [
      { org_id: SEED.ORG_REAL_ESTATE, rule_id: ruleRealEstate, match_classification: 'primary_match' },
      { org_id: SEED.ORG_REAL_ESTATE, rule_id: ruleRealEstate, match_classification: 'guardrail_match' },
      { org_id: SEED.ORG_HOLDING, rule_id: ruleHolding, match_classification: 'primary_match' },
    ].map((r) => {
      const id = crypto.randomUUID();
      evalIds.push(id);
      return { id, trace_id: crypto.randomUUID(), evaluation_trace: {}, ...r };
    });
    const { error: logErr } = await db.from('rule_evaluation_log').insert(rows);
    if (logErr) throw new Error(`Failed to insert rule_evaluation_log: ${logErr.message}`);

    apClient = await userClientFor('ap@thebridge.local', 'DevSeed!ApSpec#1');
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('rule_evaluation_log').delete().in('id', evalIds);
    await db.from('rule_registry').delete().in('id', [ruleHolding, ruleRealEstate]);
  });

  it('CONTROL: service_role (RLS-exempt) sees BOTH orgs aggregated through the view', async () => {
    // Proves the rows exist and the view aggregates both orgs when RLS is
    // bypassed — so the user-scoped result below is RLS filtering, not missing data.
    const { data, error } = await adminClient()
      .from('rule_evaluation_30d_view').select('org_id, rule_id, evaluation_count')
      .in('rule_id', [ruleHolding, ruleRealEstate]);
    expect(error).toBeNull();
    const byRule = new Map(data!.map((r) => [r.rule_id, r]));
    expect(byRule.get(ruleRealEstate)!.evaluation_count).toBe(2);
    expect(byRule.get(ruleHolding)!.evaluation_count).toBe(1);
  });

  it('AP (RE-org user-scoped) sees ONLY their org aggregate through the view — no cross-org leak', async () => {
    const { data, error } = await apClient
      .from('rule_evaluation_30d_view').select('org_id, rule_id, evaluation_count')
      .in('rule_id', [ruleHolding, ruleRealEstate]);
    expect(error).toBeNull();
    // security_invoker = true → underlying rule_evaluation_log RLS evaluated as
    // the AP user → only RE rows visible → only the RE rule_id aggregates.
    expect(data!.every((r) => r.org_id === SEED.ORG_REAL_ESTATE)).toBe(true);
    expect(data!.some((r) => r.rule_id === ruleHolding)).toBe(false); // the leak that security_invoker prevents
    const re = data!.find((r) => r.rule_id === ruleRealEstate);
    expect(re).toBeDefined();
    expect(re!.evaluation_count).toBe(2);
  });
});
