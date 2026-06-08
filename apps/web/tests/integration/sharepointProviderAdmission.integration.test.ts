// tests/integration/sharepointProviderAdmission.integration.test.ts
//
// Charter B (a) Task 5 — substrate test for migration 20240178
// (storage_provider Layer-1 CHECK broaden, _v1_active -> _v2_active).
// Proves the two-part property: sharepoint_drive is now admitted, and
// the broaden is a bounded IN (still rejects inactive providers, not a
// relax-to-any-enum-value).

import { describe, it, expect } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { createIngestBatchForTest } from '../helpers/createIngestBatchForTest';

function makeRow(opts: {
  id: string;
  ingest_batch_id: string;
  storage_provider: string;
}) {
  return {
    id: opts.id,
    org_id: SEED.ORG_HOLDING,
    legal_entity_id: SEED.ORG_HOLDING,
    storage_provider: opts.storage_provider,
    // For sharepoint_drive the storage_key holds a Graph driveItem id.
    original_storage_key: `key-${opts.id}`,
    original_content_hash: '0'.repeat(64),
    original_byte_size: 10,
    original_filename: 'sp-admit.pdf',
    mime_type: 'application/pdf',
    ingest_channel: 'drag_drop_pdf' as const,
    ingest_batch_id: opts.ingest_batch_id,
    storage_status: 'available' as const,
    received_at: new Date().toISOString(),
    created_by: SEED.USER_CONTROLLER,
  };
}

describe('Charter B (a): migration 20240178 storage_provider CHECK broaden', () => {
  it('admits a sharepoint_drive source_documents row (CHECK-forbidden pre-broaden)', async () => {
    const db = adminClient();
    const { ingest_batch_id } = await createIngestBatchForTest(SEED.ORG_HOLDING);
    const id = crypto.randomUUID();
    const { error } = await db
      .from('source_documents')
      .insert(makeRow({ id, ingest_batch_id, storage_provider: 'sharepoint_drive' }));
    expect(error).toBeNull();
  });

  it('still rejects an inactive provider (s3_bucket) — broaden is a bounded IN, not relax-to-any', async () => {
    const db = adminClient();
    const { ingest_batch_id } = await createIngestBatchForTest(SEED.ORG_HOLDING);
    const id = crypto.randomUUID();
    const { error } = await db
      .from('source_documents')
      .insert(makeRow({ id, ingest_batch_id, storage_provider: 's3_bucket' }));
    // CHECK violation (s3_bucket is a valid enum value but NOT v2-active).
    expect(error).not.toBeNull();
  });
});
