// tests/integration/addressServiceAudit.test.ts
// Category A floor test CA-09: address service mutations write
// audit_log rows with correct action keys and before_state.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { addressService } from '@/services/org/addressService';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import type { AddAddressInput } from '@/shared/schemas/organization/address.schema';

describe('CA-09: addressService mutations write correct audit_log rows', () => {
  const db = adminClient();
  const traceId = crypto.randomUUID();
  const createdAddressIds: string[] = [];

  const ctx: ServiceContext = {
    trace_id: traceId,
    caller: {
      verified: true,
      user_id: SEED.USER_CONTROLLER,
      email: 'controller@thebridge.local',
      org_ids: [SEED.ORG_HOLDING, SEED.ORG_REAL_ESTATE],
    },
    locale: 'en',
  };

  afterAll(async () => {
    if (createdAddressIds.length > 0) {
      await db.from('organization_addresses').delete().in('address_id', createdAddressIds);
    }
    await db.from('audit_log').delete().eq('trace_id', traceId);
  });

  it('addAddress writes audit_log with action=org.address_added and null before_state', async () => {
    const input: { org_id: string } & AddAddressInput = {
      org_id: SEED.ORG_HOLDING,
      addressType: 'registered',
      line1: 'CA-09 Audit Test Addr',
      country: 'CA',
    };

    const result = await addressService.addAddress(input, ctx);
    createdAddressIds.push(result.address_id);

    const { data: auditRows } = await db
      .from('audit_log')
      .select('*')
      .eq('trace_id', traceId)
      .eq('action', 'org.address_added');

    expect(auditRows).toHaveLength(1);
    expect(auditRows![0].entity_type).toBe('organization_address');
    expect(auditRows![0].entity_id).toBe(result.address_id);
    expect(auditRows![0].before_state).toBeNull();
  });

  it('updateAddress writes audit_log with action=org.address_updated and populated before_state', async () => {
    const addressId = createdAddressIds[0];

    await addressService.updateAddress(
      {
        org_id: SEED.ORG_HOLDING,
        address_id: addressId,
        patch: { line1: 'CA-09 Updated Line1' },
      },
      ctx,
    );

    const { data: auditRows } = await db
      .from('audit_log')
      .select('*')
      .eq('trace_id', traceId)
      .eq('action', 'org.address_updated');

    expect(auditRows).toHaveLength(1);
    expect(auditRows![0].entity_id).toBe(addressId);
    expect(auditRows![0].before_state).toBeTruthy();
    expect((auditRows![0].before_state as Record<string, unknown>).line1).toBe('CA-09 Audit Test Addr');
  });

  it('setPrimaryAddress writes TWO audit rows when there is a previous primary (OQ-06)', async () => {
    // Create a second address of the same type and set the first as primary.
    const input2: { org_id: string } & AddAddressInput = {
      org_id: SEED.ORG_HOLDING,
      addressType: 'registered',
      line1: 'CA-09 Second Registered',
      country: 'CA',
      isPrimary: true,
    };
    const second = await addressService.addAddress(input2, ctx);
    createdAddressIds.push(second.address_id);

    // Now promote the first (which is not primary) — this should
    // demote the second and emit two audit rows.
    const firstId = createdAddressIds[0];
    await addressService.setPrimaryAddress(
      { org_id: SEED.ORG_HOLDING, address_id: firstId },
      ctx,
    );

    const { data: primaryChangedRows } = await db
      .from('audit_log')
      .select('*')
      .eq('trace_id', traceId)
      .eq('action', 'org.address_primary_changed')
      .order('created_at', { ascending: true });

    // At least 2 from setPrimaryAddress (the addAddress auto-demote
    // may have added more). Check the last 2 are for our promote/demote.
    expect(primaryChangedRows!.length).toBeGreaterThanOrEqual(2);
    const last2 = primaryChangedRows!.slice(-2);
    const entityIds = last2.map((r) => r.entity_id);
    expect(entityIds).toContain(firstId);
    expect(entityIds).toContain(second.address_id);
    // Both carry before_state
    expect(last2[0].before_state).toBeTruthy();
    expect(last2[1].before_state).toBeTruthy();
  });

  it('removeAddress writes audit_log with action=org.address_removed and populated before_state', async () => {
    const addressId = createdAddressIds[0];

    await addressService.removeAddress(
      { org_id: SEED.ORG_HOLDING, address_id: addressId },
      ctx,
    );

    const { data: auditRows } = await db
      .from('audit_log')
      .select('*')
      .eq('trace_id', traceId)
      .eq('action', 'org.address_removed');

    expect(auditRows).toHaveLength(1);
    expect(auditRows![0].entity_id).toBe(addressId);
    expect(auditRows![0].before_state).toBeTruthy();
    // The address was deleted, so before_state should carry the pre-delete row.
    expect((auditRows![0].before_state as Record<string, unknown>).line1).toBe('CA-09 Updated Line1');

    // Remove from cleanup list — already deleted.
    const idx = createdAddressIds.indexOf(addressId);
    if (idx !== -1) createdAddressIds.splice(idx, 1);
  });
});
