// Charter B real-flow — write-path proof (D-2 seam at write).
//
// The end-to-end-at-write proof: a sharepoint_drive-defaulted org must stamp
// sharepoint_drive on the source_documents row, and the put must dispatch to
// the resolved provider. The provider INSTANCE is mocked (no real Graph — that
// is the D-6 gated tail); the org-default resolution (resolveStorageProvider,
// real DB read) and the create_source_document_with_audit RPC INSERT are real.
//
// In its own file because vi.mock('@/services/storage/resolver') is
// file-global — keeping it out of charterBRealFlow.integration.test.ts so the
// slice/helper integration tests there run against the real resolver.
import { describe, it, expect, afterAll, vi } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { createIngestBatchForTest } from '../helpers/createIngestBatchForTest';

const { getStorageProviderSpy, mockPut } = vi.hoisted(() => {
  const mockPut = vi.fn();
  const provider = {
    put: mockPut,
    fetch: vi.fn(),
    fetchVersion: vi.fn(),
    previewUrl: vi.fn(),
    delete: vi.fn(),
    verifyIntegrity: vi.fn(),
  };
  return { getStorageProviderSpy: vi.fn(() => provider), mockPut };
});
vi.mock('@/services/storage/resolver', () => ({
  getStorageProvider: getStorageProviderSpy,
}));

import { documentPlatformService } from '@/services/document-platform/documentPlatformService';

describe('Charter B real-flow — write-path proof (D-2)', () => {
  const db = adminClient();
  const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });

  afterAll(async () => {
    await db
      .from('org_settings')
      .update({ default_storage_provider: 'supabase_storage' })
      .eq('org_id', SEED.ORG_HOLDING);
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('a sharepoint_drive-defaulted org stamps sharepoint_drive on the row + dispatches the put there', async () => {
    await db
      .from('org_settings')
      .update({ default_storage_provider: 'sharepoint_drive' })
      .eq('org_id', SEED.ORG_HOLDING);

    const { ingest_batch_id } = await createIngestBatchForTest(SEED.ORG_HOLDING);
    const filename = 'charter-b-write-path.pdf';
    const bytes = new TextEncoder().encode('charter-b write-path proof');
    mockPut.mockResolvedValue({
      storage_key: `org_${SEED.ORG_HOLDING}/sources/pending/${filename}`,
      content_hash: 'a'.repeat(64),
      byte_size: bytes.byteLength,
      provider: 'sharepoint_drive',
    });

    const result = await documentPlatformService.createSourceDocument(
      {
        bytes,
        mime_type: 'application/pdf',
        org_id: SEED.ORG_HOLDING,
        original_filename: filename,
        ingest_channel: 'direct_upload',
        ingest_batch_id,
        received_at: new Date().toISOString(),
        created_by: SEED.USER_CONTROLLER,
      },
      ctx,
    );

    // The put dispatched to the provider resolved from the org default.
    expect(getStorageProviderSpy).toHaveBeenCalledWith('sharepoint_drive');

    // The row stamps the resolved value (the seam works at write).
    const { data: docRow, error } = await db
      .from('source_documents')
      .select('storage_provider')
      .eq('id', result.id)
      .single();
    expect(error).toBeNull();
    expect(docRow!.storage_provider).toBe('sharepoint_drive');
  });
});
