// tests/integration/draftVendorRuleResolve.integration.test.ts
//
// Ring 2A-authoring commit (d) (ADR-0026 §1/§6). resolveDraftVendorRule is the
// vendor-resolution step the orchestrator's draftVendorRule dispatch calls: it
// runs vendorService.matchVendor and returns a discriminated result the model
// renders (rule_draft → proposed_rule_card) or clarifies (vendor_ambiguous /
// vendor_not_found). No mutation — the create→approve fires when the controller
// approves the card. Covers the two deterministic branches; the ambiguous branch
// is thin matchVendor-driven glue (covered by vendorService's own tests).

import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { resolveDraftVendorRule } from '@/agent/tools/draftVendorRule';

describe('resolveDraftVendorRule (ADR-0026 §1/§6)', () => {
  const db = adminClient();
  const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
  const createdVendorIds: string[] = [];

  async function seedVendor(name: string): Promise<string> {
    const { data, error } = await db
      .from('vendors').insert({ org_id: SEED.ORG_HOLDING, name }).select('vendor_id').single();
    if (error || !data) throw new Error(`vendor seed failed: ${error?.message ?? 'no id'}`);
    const id = (data as { vendor_id: string }).vendor_id;
    createdVendorIds.push(id);
    return id;
  }

  afterAll(async () => {
    if (createdVendorIds.length > 0) await db.from('vendors').delete().in('vendor_id', createdVendorIds);
  });

  it('confident match → rule_draft (resolved vendor + bundle_type=born_paid_bill + carried account_hint)', async () => {
    const name = `TEST Spotify ${crypto.randomUUID().slice(0, 8)}`;
    const vendorId = await seedVendor(name);

    const result = await resolveDraftVendorRule(
      { vendor_text: name, account_hint: 'subscriptions' },
      SEED.ORG_HOLDING,
      ctx,
    );
    expect(result.kind).toBe('rule_draft');
    if (result.kind === 'rule_draft') {
      expect(result.vendor_id).toBe(vendorId);
      expect(result.vendor_name).toBe(name);
      expect(result.bundle_type).toBe('born_paid_bill');
      expect(result.account_hint).toBe('subscriptions');
    }
  });

  it('account_hint omitted → rule_draft carries account_hint: null', async () => {
    const name = `TEST Acme ${crypto.randomUUID().slice(0, 8)}`;
    await seedVendor(name);

    const result = await resolveDraftVendorRule({ vendor_text: name }, SEED.ORG_HOLDING, ctx);
    expect(result.kind).toBe('rule_draft');
    if (result.kind === 'rule_draft') {
      expect(result.account_hint).toBeNull();
    }
  });

  it('unrecognized vendor → vendor_not_found', async () => {
    const result = await resolveDraftVendorRule(
      { vendor_text: `Nonexistent Vendor ${crypto.randomUUID()}` },
      SEED.ORG_HOLDING,
      ctx,
    );
    expect(result.kind).toBe('vendor_not_found');
  });
});
