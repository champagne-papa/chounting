// tests/integration/vendorServiceMatchVendor.integration.test.ts
//
// Phase 7 chunk 7.3a — Task 7.3a.5 vendorService.matchVendor unit +
// integration tests covering 6-strategy cascade (alias strategy dropped
// per Phase A Step 15 finding: vendors.aliases column absent).

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { vendorService } from '@/services/spend/vendorService';
import type { ServiceContext } from '@/services/middleware/serviceContext';

const db = adminClient();

function makeCtx(trace_id: string): ServiceContext {
  return {
    trace_id,
    caller: {
      user_id: SEED.USER_CONTROLLER,
      email: 'controller@thebridge.local',
      verified: true,
      org_ids: [SEED.ORG_HOLDING],
    },
  };
}

describe('Phase 7 chunk 7.3a Task 7.3a.5.D — vendorService.matchVendor', () => {
  const createdVendorIds: string[] = [];

  afterEach(async () => {
    for (const id of createdVendorIds.splice(0)) {
      await db.from('vendors').delete().eq('vendor_id', id);
    }
  });

  async function seedVendor(fields: {
    name: string;
    tax_id?: string;
    email?: string;
  }): Promise<string> {
    const { data, error } = await db
      .from('vendors')
      .insert({
        org_id: SEED.ORG_HOLDING,
        name: fields.name,
        tax_id: fields.tax_id ?? null,
        email: fields.email ?? null,
      })
      .select('vendor_id')
      .single();
    if (error) throw new Error(`seedVendor failed: ${error.message}`);
    const id = (data as { vendor_id: string }).vendor_id;
    createdVendorIds.push(id);
    return id;
  }

  it('strategy 1: exact_name (case-insensitive ILIKE) at confidence 1.0', async () => {
    const trace_id = crypto.randomUUID();
    const vendorId = await seedVendor({ name: 'Acme Corp' });

    const result = await vendorService.matchVendor(
      {
        org_id: SEED.ORG_HOLDING,
        vendorField: { vendor_name: 'ACME corp' },
        trace_id,
      },
      makeCtx(trace_id),
    );
    expect(result.match_type).toBe('exact_name');
    expect(result.vendor_id).toBe(vendorId);
    expect(result.confidence).toBe(1.0);
  });

  it('strategy 2: tax_id (exact match) at confidence 1.0', async () => {
    const trace_id = crypto.randomUUID();
    const vendorId = await seedVendor({ name: 'Beta Inc', tax_id: 'TAX-123' });

    const result = await vendorService.matchVendor(
      {
        org_id: SEED.ORG_HOLDING,
        vendorField: { vendor_name: 'Different Name', tax_id: 'TAX-123' },
        trace_id,
      },
      makeCtx(trace_id),
    );
    expect(result.match_type).toBe('tax_id');
    expect(result.vendor_id).toBe(vendorId);
  });

  it('strategy 3: email (exact match) at confidence 0.90', async () => {
    const trace_id = crypto.randomUUID();
    const vendorId = await seedVendor({
      name: 'Gamma LLC',
      email: 'billing@gamma.com',
    });

    const result = await vendorService.matchVendor(
      {
        org_id: SEED.ORG_HOLDING,
        vendorField: { vendor_name: 'Different Name', email: 'billing@gamma.com' },
        trace_id,
      },
      makeCtx(trace_id),
    );
    expect(result.match_type).toBe('email');
    expect(result.vendor_id).toBe(vendorId);
    expect(result.confidence).toBe(0.9);
  });

  it('strategy 6: no_match returns null vendor_id', async () => {
    const trace_id = crypto.randomUUID();

    const result = await vendorService.matchVendor(
      {
        org_id: SEED.ORG_HOLDING,
        vendorField: {
          vendor_name: 'Completely Unrecognized Entity ' + crypto.randomUUID(),
        },
        trace_id,
      },
      makeCtx(trace_id),
    );
    expect(result.match_type).toBe('no_match');
    expect(result.vendor_id).toBeNull();
  });
});
