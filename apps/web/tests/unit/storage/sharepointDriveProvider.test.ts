// tests/unit/storage/sharepointDriveProvider.test.ts
//
// Unit tests for sharepointDriveProvider.put — the §9 integrity path
// (spec D-B1) and the size-gate routing (spec D-B4). Graph bytes-I/O is
// injected as a mock GraphIo; org_settings site/drive resolution is
// mocked. No real Graph; the real SDK-backed io is covered by the gated
// real-M365 e2e (plan Task 8).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSharepointDriveProvider } from '@/services/storage/providers/sharepointDriveProvider';
import type { GraphIo } from '@/services/storage/providers/graph/graphIo';
import type { PutInput } from '@/services/storage/types';
import type { SystemActorServiceContext } from '@/services/middleware/serviceContext';
import { computeHash } from '@/services/storage/integrity';

// org_settings site/drive resolution → fixed values (the real resolver
// reads forward-columns landing in plan Task 8).
vi.mock('@/services/storage/providers/graph/orgDriveResolver', () => ({
  resolveOrgDrive: vi.fn(async () => ({ siteId: 'site-1', driveId: 'drive-1' })),
}));

const ctx: SystemActorServiceContext = {
  trace_id: '00000000-0000-0000-0000-0000000000aa',
  caller: { user_id: null, system_actor: 'test' },
  org_id: 'org-1',
};

function makeInput(bytes: Uint8Array): PutInput {
  return {
    bytes,
    mime_type: 'application/pdf',
    org_id: 'org-1',
    source_document_id: 'sd-1',
    original_filename: 'invoice.pdf',
  };
}

// A mock GraphIo whose download echoes whatever `downloaded` is set to,
// so tests control the re-read bytes (clean vs corrupted).
function makeMockIo(opts: {
  smallId?: string;
  largeId?: string;
  downloaded: Uint8Array;
}): GraphIo {
  return {
    uploadSmall: vi.fn(async () => opts.smallId ?? 'drive-item-small'),
    uploadLarge: vi.fn(async () => opts.largeId ?? 'drive-item-large'),
    downloadBytes: vi.fn(async () => opts.downloaded),
    getDownloadUrl: vi.fn(async () => 'https://example/download'),
    deleteItem: vi.fn(async () => undefined),
  };
}

describe('sharepointDriveProvider.put — §9 integrity + size-gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('small file: uploadSmall path, re-read matches → returns driveItemId as storage_key + SHA-256 content_hash', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const io = makeMockIo({ downloaded: bytes }); // re-read echoes written bytes
    const provider = createSharepointDriveProvider(io);

    const result = await provider.put(makeInput(bytes), ctx);

    expect(io.uploadSmall).toHaveBeenCalledTimes(1);
    expect(io.uploadLarge).not.toHaveBeenCalled();
    expect(io.downloadBytes).toHaveBeenCalledWith('drive-1', 'drive-item-small');
    expect(result).toEqual({
      storage_key: 'drive-item-small',
      content_hash: computeHash(bytes),
      byte_size: 4,
      provider: 'sharepoint_drive',
    });
  });

  it('large file (> 4 MiB): routes to uploadLarge, not uploadSmall', async () => {
    const bytes = new Uint8Array(4 * 1024 * 1024 + 1); // 4 MiB + 1 byte
    const io = makeMockIo({ downloaded: bytes });
    const provider = createSharepointDriveProvider(io);

    const result = await provider.put(makeInput(bytes), ctx);

    expect(io.uploadLarge).toHaveBeenCalledTimes(1);
    expect(io.uploadSmall).not.toHaveBeenCalled();
    expect(result.storage_key).toBe('drive-item-large');
    expect(result.content_hash).toBe(computeHash(bytes));
  });

  it('boundary: exactly 4 MiB uses the simple (uploadSmall) path', async () => {
    const bytes = new Uint8Array(4 * 1024 * 1024); // exactly 4 MiB
    const io = makeMockIo({ downloaded: bytes });
    const provider = createSharepointDriveProvider(io);

    await provider.put(makeInput(bytes), ctx);

    expect(io.uploadSmall).toHaveBeenCalledTimes(1);
    expect(io.uploadLarge).not.toHaveBeenCalled();
  });

  it('corrupted re-read → throws INTEGRITY_VERIFY_FAILED (the §9 guarantee)', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const corrupted = new Uint8Array([9, 9, 9, 9]); // re-read differs
    const io = makeMockIo({ downloaded: corrupted });
    const provider = createSharepointDriveProvider(io);

    await expect(provider.put(makeInput(bytes), ctx)).rejects.toMatchObject({
      code: 'INTEGRITY_VERIFY_FAILED',
    });
  });
});
