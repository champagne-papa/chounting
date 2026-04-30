// tests/integration/addressPrimaryUniqueness.test.ts
// Category A floor test CA-08: partial unique index enforces one
// primary per (org_id, address_type).

import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';

describe('CA-08: address primary uniqueness', () => {
  const db = adminClient();
  const createdIds: string[] = [];

  afterAll(async () => {
    if (createdIds.length > 0) {
      await db.from('organization_addresses').delete().in('address_id', createdIds);
    }
  });

  it('(a) partial unique index rejects two is_primary=true rows of the same type via direct DB insert', async () => {
    // First primary — should succeed.
    const { data: a1, error: e1 } = await db
      .from('organization_addresses')
      .insert({
        org_id: SEED.ORG_HOLDING,
        address_type: 'mailing',
        line1: 'CA-08 First Primary',
        country: 'CA',
        is_primary: true,
      })
      .select('address_id')
      .single();
    expect(e1).toBeNull();
    createdIds.push(a1!.address_id);

    // Second primary of the same type — should fail.
    const { error: e2 } = await db
      .from('organization_addresses')
      .insert({
        org_id: SEED.ORG_HOLDING,
        address_type: 'mailing',
        line1: 'CA-08 Second Primary',
        country: 'CA',
        is_primary: true,
      });
    expect(e2).not.toBeNull();
    expect(e2!.message).toMatch(/unique|duplicate/i);
  });

  it('(b) a different address_type primary is allowed alongside an existing one', async () => {
    const { data: a2, error } = await db
      .from('organization_addresses')
      .insert({
        org_id: SEED.ORG_HOLDING,
        address_type: 'physical',
        line1: 'CA-08 Physical Primary',
        country: 'CA',
        is_primary: true,
      })
      .select('address_id')
      .single();
    expect(error).toBeNull();
    createdIds.push(a2!.address_id);
  });

  it('(c) multiple non-primary rows of the same type are allowed', async () => {
    const { data: a3, error: e3 } = await db
      .from('organization_addresses')
      .insert({
        org_id: SEED.ORG_HOLDING,
        address_type: 'mailing',
        line1: 'CA-08 Non-Primary 1',
        country: 'CA',
        is_primary: false,
      })
      .select('address_id')
      .single();
    expect(e3).toBeNull();
    createdIds.push(a3!.address_id);

    const { data: a4, error: e4 } = await db
      .from('organization_addresses')
      .insert({
        org_id: SEED.ORG_HOLDING,
        address_type: 'mailing',
        line1: 'CA-08 Non-Primary 2',
        country: 'CA',
        is_primary: false,
      })
      .select('address_id')
      .single();
    expect(e4).toBeNull();
    createdIds.push(a4!.address_id);
  });
});
