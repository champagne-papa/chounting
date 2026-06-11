import { describe, it, expect, vi } from 'vitest';
import { ServiceError } from '@/services/errors/ServiceError';
import { withRetry } from '@/services/storage/retry';

// Charter B real-flow D-5 — the two-layer provider_unavailable wire contract:
//   (a) withRetry propagates STORAGE_PROVIDER_UNAVAILABLE (no longer flattens
//       provider_unavailable into the STORAGE_OPERATION_FAILED catchall);
//   (b) byteFetch's catch maps STORAGE_PROVIDER_UNAVAILABLE → PIPELINE_UNAVAILABLE;
//   (c) classifyError (unchanged) routes PIPELINE_UNAVAILABLE → 'unavailable'.
// Both edits thread via the STORAGE_PROVIDER_UNAVAILABLE code; (a) without (b)
// just relocates the mask (byteFetch's catchall → TRANSIENT_EXHAUSTED →
// classifyError default-to-transient). These two cases prove both are present
// and thread.

describe('D-5 (a): withRetry propagates STORAGE_PROVIDER_UNAVAILABLE', () => {
  it('throws STORAGE_PROVIDER_UNAVAILABLE on a Graph-shaped 403 (provider_unavailable, no retry)', async () => {
    await expect(
      withRetry(async () => {
        // Graph-shaped error → classifyStorageFailure → provider_unavailable.
        throw { statusCode: 403 };
      }),
    ).rejects.toMatchObject({ code: 'STORAGE_PROVIDER_UNAVAILABLE' });
  });
});

// byteFetch (b): mock the resolver (provider.fetch throws the typed code) +
// adminClient (row read returns sharepoint_drive so dispatch-on-row succeeds).
const { getStorageProviderSpy, mockFetch, single } = vi.hoisted(() => {
  const mockFetch = vi.fn();
  const provider = {
    put: vi.fn(),
    fetch: mockFetch,
    fetchVersion: vi.fn(),
    previewUrl: vi.fn(),
    delete: vi.fn(),
    verifyIntegrity: vi.fn(),
  };
  return { getStorageProviderSpy: vi.fn(() => provider), mockFetch, single: vi.fn() };
});
vi.mock('@/services/storage/resolver', () => ({
  getStorageProvider: getStorageProviderSpy,
}));
vi.mock('@/db/adminClient', () => ({
  adminClient: () => ({
    from: () => ({ select: () => ({ eq: () => ({ single }) }) }),
  }),
}));

import { byteFetch } from '@/agent/orchestrator/extraction/stages/byteFetch';

describe('D-5 (b): byteFetch maps STORAGE_PROVIDER_UNAVAILABLE → PIPELINE_UNAVAILABLE', () => {
  it('re-throws PIPELINE_UNAVAILABLE (not PIPELINE_TRANSIENT_EXHAUSTED) on a provider-unavailable fetch', async () => {
    single.mockResolvedValue({
      data: { storage_provider: 'sharepoint_drive' },
      error: null,
    });
    mockFetch.mockRejectedValue(
      new ServiceError('STORAGE_PROVIDER_UNAVAILABLE', 'graph 403'),
    );
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      byteFetch({ source_document_id: 'doc-1', ctx: {} as any }),
    ).rejects.toMatchObject({ code: 'PIPELINE_UNAVAILABLE' });
  });
});
