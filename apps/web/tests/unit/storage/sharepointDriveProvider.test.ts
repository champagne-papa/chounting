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
import {
  resolveCurrentRef,
  resolveVersionRef,
  collectAllRefs,
} from '@/services/storage/providers/graph/sharepointRefResolver';
import type { SharepointRef } from '@/services/storage/providers/graph/sharepointRefResolver';

// org_settings site/drive resolution → fixed values (the real resolver
// reads forward-columns landing in plan Task 8).
vi.mock('@/services/storage/providers/graph/orgDriveResolver', () => ({
  resolveOrgDrive: vi.fn(async () => ({ siteId: 'site-1', driveId: 'drive-1' })),
}));

// Row-resolution mocked per plan Task 3 ("mocked row resolution"). Real
// SQL mirrors the integration-tested supabase resolution; real-row
// integration of the read methods needs the Task-5 CHECK broaden.
vi.mock('@/services/storage/providers/graph/sharepointRefResolver', () => ({
  resolveCurrentRef: vi.fn(),
  resolveVersionRef: vi.fn(),
  collectAllRefs: vi.fn(),
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

describe('sharepointDriveProvider read methods — row→io wiring (Task 3)', () => {
  const REF: SharepointRef = {
    driveItemId: 'item-1',
    org_id: 'org-1',
    content_hash: 'stored-hash-abc',
    byte_size: 10,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetch: resolves driveItemId from the row, driveId from the row org, returns row content_hash (not recomputed)', async () => {
    const returned = new Uint8Array([5, 6, 7]);
    vi.mocked(resolveCurrentRef).mockResolvedValue(REF);
    const io = makeMockIo({ downloaded: returned });
    const provider = createSharepointDriveProvider(io);

    const result = await provider.fetch('sd-1', ctx);

    expect(resolveCurrentRef).toHaveBeenCalledWith('sd-1');
    // driveId 'drive-1' from the (mocked) resolveOrgDrive(org_id), itemId from the row.
    expect(io.downloadBytes).toHaveBeenCalledWith('drive-1', 'item-1');
    expect(result).toEqual({
      bytes: returned,
      content_hash: 'stored-hash-abc', // the row's hash, NOT recomputed
      provider: 'sharepoint_drive',
    });
  });

  it('fetchVersion: resolves the version ref, feeds driveItemId to io.downloadBytes', async () => {
    const returned = new Uint8Array([8, 9]);
    vi.mocked(resolveVersionRef).mockResolvedValue({ ...REF, driveItemId: 'ver-item-2' });
    const io = makeMockIo({ downloaded: returned });
    const provider = createSharepointDriveProvider(io);

    const result = await provider.fetchVersion('ver-2', ctx);

    expect(resolveVersionRef).toHaveBeenCalledWith('ver-2');
    expect(io.downloadBytes).toHaveBeenCalledWith('drive-1', 'ver-item-2');
    expect(result.content_hash).toBe('stored-hash-abc');
    expect(result.provider).toBe('sharepoint_drive');
  });

  it('previewUrl: returns the io download URL with a §12-clamped expiry (default 300s)', async () => {
    vi.mocked(resolveCurrentRef).mockResolvedValue(REF);
    const io = makeMockIo({ downloaded: new Uint8Array() });
    const provider = createSharepointDriveProvider(io);

    const before = Date.now();
    const result = await provider.previewUrl('sd-1', {}, ctx);
    const after = Date.now();

    expect(io.getDownloadUrl).toHaveBeenCalledWith('drive-1', 'item-1');
    expect(result.url).toBe('https://example/download');
    expect(result.provider).toBe('sharepoint_drive');
    const expiresMs = Date.parse(result.expires_at);
    expect(expiresMs).toBeGreaterThanOrEqual(before + 300 * 1000);
    expect(expiresMs).toBeLessThanOrEqual(after + 300 * 1000);
  });

  it('previewUrl: clamps an over-max ttl_seconds to the §12 max (1800s)', async () => {
    vi.mocked(resolveCurrentRef).mockResolvedValue(REF);
    const io = makeMockIo({ downloaded: new Uint8Array() });
    const provider = createSharepointDriveProvider(io);

    const before = Date.now();
    const result = await provider.previewUrl('sd-1', { ttl_seconds: 99999 }, ctx);
    const after = Date.now();

    const expiresMs = Date.parse(result.expires_at);
    expect(expiresMs).toBeGreaterThanOrEqual(before + 1800 * 1000);
    expect(expiresMs).toBeLessThanOrEqual(after + 1800 * 1000);
  });

  it('delete: enumerates original + version keys, calls io.deleteItem per key', async () => {
    vi.mocked(collectAllRefs).mockResolvedValue({
      org_id: 'org-1',
      driveItemIds: ['orig-item', 'ver-item-a', 'ver-item-b'],
    });
    const io = makeMockIo({ downloaded: new Uint8Array() });
    const provider = createSharepointDriveProvider(io);

    await provider.delete('sd-1', ctx);

    expect(collectAllRefs).toHaveBeenCalledWith('sd-1');
    expect(io.deleteItem).toHaveBeenCalledTimes(3);
    expect(io.deleteItem).toHaveBeenCalledWith('drive-1', 'orig-item');
    expect(io.deleteItem).toHaveBeenCalledWith('drive-1', 'ver-item-a');
    expect(io.deleteItem).toHaveBeenCalledWith('drive-1', 'ver-item-b');
  });
});

describe('sharepointDriveProvider.verifyIntegrity — recompute path (Task 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('downloaded bytes hash matches the row content_hash → IntegrityResult', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);
    vi.mocked(resolveCurrentRef).mockResolvedValue({
      driveItemId: 'item-1',
      org_id: 'org-1',
      content_hash: computeHash(bytes), // row hash == hash of downloaded bytes
      byte_size: 5,
    });
    const io = makeMockIo({ downloaded: bytes });
    const provider = createSharepointDriveProvider(io);

    const result = await provider.verifyIntegrity('sd-1', ctx);

    expect(io.downloadBytes).toHaveBeenCalledWith('drive-1', 'item-1');
    expect(result).toEqual({
      content_hash: computeHash(bytes),
      byte_size: 5,
      provider: 'sharepoint_drive',
    });
  });

  it('downloaded bytes hash differs from the row content_hash → throws INTEGRITY_VERIFY_FAILED', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);
    vi.mocked(resolveCurrentRef).mockResolvedValue({
      driveItemId: 'item-1',
      org_id: 'org-1',
      content_hash: 'a-different-stored-hash', // mismatch
      byte_size: 5,
    });
    const io = makeMockIo({ downloaded: bytes });
    const provider = createSharepointDriveProvider(io);

    await expect(provider.verifyIntegrity('sd-1', ctx)).rejects.toMatchObject({
      code: 'INTEGRITY_VERIFY_FAILED',
    });
  });
});
