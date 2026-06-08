import { describe, it, expect, vi } from 'vitest';

// Charter B real-flow D-3: byteFetch must dispatch getStorageProvider on the
// ROW's storage_provider, not a constant. Mock the resolver (spy on the
// dispatch arg + fake provider.fetch) and adminClient (fake row read).
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

describe('byteFetch dispatch-on-row (D-3)', () => {
  it('dispatches getStorageProvider on the row storage_provider, not a constant', async () => {
    single.mockResolvedValue({
      data: { storage_provider: 'sharepoint_drive' },
      error: null,
    });
    mockFetch.mockResolvedValue({
      bytes: new Uint8Array([1, 2, 3]),
      content_hash: 'a'.repeat(64),
      provider: 'sharepoint_drive',
    });

    const out = await byteFetch({
      source_document_id: 'doc-1',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ctx: {} as any,
    });

    expect(getStorageProviderSpy).toHaveBeenCalledWith('sharepoint_drive');
    expect(out.result.provider).toBe('sharepoint_drive');
  });
});
