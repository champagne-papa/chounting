// Charter B real-flow arc — integration tests.
//
// Seed shape (verified against disk before authoring): migration 20240158
// ships an AFTER INSERT trigger (organizations_create_org_settings) + a
// backfill, so EVERY organization — including SEED.ORG_HOLDING — has an
// org_settings row by construction. The .single() reads below rely on that.
import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';

describe('Charter B real-flow — org_settings storage slice (D-1)', () => {
  const db = adminClient();

  it('default_storage_provider exists, defaults to supabase_storage; site/drive null', async () => {
    const { data, error } = await db
      .from('org_settings')
      .select('default_storage_provider, sharepoint_site_id, sharepoint_drive_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .single();
    expect(error).toBeNull();
    expect(data!.default_storage_provider).toBe('supabase_storage');
    expect(data!.sharepoint_site_id).toBeNull();
    expect(data!.sharepoint_drive_id).toBeNull();
  });

  it('default_storage_provider CHECK admits sharepoint_drive, rejects s3_bucket', async () => {
    const ok = await db
      .from('org_settings')
      .update({ default_storage_provider: 'sharepoint_drive' })
      .eq('org_id', SEED.ORG_HOLDING);
    expect(ok.error).toBeNull();

    const bad = await db
      .from('org_settings')
      .update({ default_storage_provider: 's3_bucket' })
      .eq('org_id', SEED.ORG_HOLDING);
    expect(bad.error).not.toBeNull(); // check_violation (23514)
  });

  afterAll(async () => {
    // Restore the seed default so later tests/files see supabase_storage.
    await db
      .from('org_settings')
      .update({ default_storage_provider: 'supabase_storage' })
      .eq('org_id', SEED.ORG_HOLDING);
  });
});
