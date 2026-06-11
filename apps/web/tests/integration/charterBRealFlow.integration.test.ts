// Charter B real-flow arc — integration tests.
//
// All sharepoint_drive mutations use a DEDICATED test org (CHARTER_B_ORG_SLICE
// via ensureCharterBOrg), never SEED.ORG_HOLDING — flipping a shared seed org's
// default_storage_provider would pollute parallel ingest tests in the full
// suite (they'd resolve sharepoint_drive and hit the unconfigured Graph
// provider). See helpers/charterBOrg.ts.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { adminClient } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { ensureCharterBOrg, CHARTER_B_ORG_SLICE } from '../helpers/charterBOrg';
import { resolveStorageProvider } from '@/services/storage/resolveStorageProvider';
import { createDocumentCase } from '@/services/document-platform/documentCaseService';

const db = adminClient();

beforeAll(async () => {
  await ensureCharterBOrg(CHARTER_B_ORG_SLICE);
});

describe('Charter B real-flow — org_settings storage slice (D-1)', () => {
  afterAll(async () => {
    await db
      .from('org_settings')
      .update({ default_storage_provider: 'supabase_storage' })
      .eq('org_id', CHARTER_B_ORG_SLICE);
  });

  it('default_storage_provider exists, defaults to supabase_storage; site/drive null', async () => {
    const { data, error } = await db
      .from('org_settings')
      .select('default_storage_provider, sharepoint_site_id, sharepoint_drive_id')
      .eq('org_id', CHARTER_B_ORG_SLICE)
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
      .eq('org_id', CHARTER_B_ORG_SLICE);
    expect(ok.error).toBeNull();

    const bad = await db
      .from('org_settings')
      .update({ default_storage_provider: 's3_bucket' })
      .eq('org_id', CHARTER_B_ORG_SLICE);
    expect(bad.error).not.toBeNull(); // check_violation (23514)
  });
});

describe('Charter B real-flow — resolveStorageProvider (integration, D-2)', () => {
  afterAll(async () => {
    await db
      .from('org_settings')
      .update({ default_storage_provider: 'supabase_storage' })
      .eq('org_id', CHARTER_B_ORG_SLICE);
  });

  it('returns the org default when set to sharepoint_drive', async () => {
    await db
      .from('org_settings')
      .update({ default_storage_provider: 'sharepoint_drive' })
      .eq('org_id', CHARTER_B_ORG_SLICE);
    await expect(resolveStorageProvider(CHARTER_B_ORG_SLICE)).resolves.toBe('sharepoint_drive');
  });

  it('falls back to supabase_storage for an org with no org_settings row', async () => {
    // A random org_id with no org_settings row exercises the no-row fallback.
    await expect(
      resolveStorageProvider('99999999-9999-9999-9999-999999999999'),
    ).resolves.toBe('supabase_storage');
  });
});

describe('Charter B real-flow — provider_unavailable exception_reason reserved (D-5)', () => {
  const ctx = makeTestContext({ org_ids: [CHARTER_B_ORG_SLICE] });

  afterAll(async () => {
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('the enum carries provider_unavailable but the v1-active CHECK rejects it (reserved-not-active)', async () => {
    const created = await createDocumentCase(
      { org_id: CHARTER_B_ORG_SLICE, document_type: 'vendor_invoice' },
      ctx,
    );
    const { error } = await db.from('exception_queue_entries').insert({
      org_id: CHARTER_B_ORG_SLICE,
      document_case_id: created.id,
      exception_reason: 'provider_unavailable',
      trace_id: ctx.trace_id,
    });
    // check_violation (23514) proves BOTH: the enum HAS the value (no
    // invalid_input 22P02) AND the v1-active exception_reason_chunk_6_active
    // CHECK rejects it — i.e. reserved-not-active. Direct table insert, so
    // the enqueue RPC's case-state coupling does not apply; only the CHECK does.
    expect(error).not.toBeNull();
    expect(error!.code).toBe('23514');
  });
});
