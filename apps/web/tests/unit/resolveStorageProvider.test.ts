import { describe, it, expect, vi, beforeEach } from 'vitest';

const maybeSingle = vi.fn();
vi.mock('@/db/adminClient', () => ({
  adminClient: () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}));

import { resolveStorageProvider } from '@/services/storage/resolveStorageProvider';

describe('resolveStorageProvider (D-2, ingest-only)', () => {
  beforeEach(() => maybeSingle.mockReset());

  it('returns the org default when set to sharepoint_drive', async () => {
    maybeSingle.mockResolvedValue({
      data: { default_storage_provider: 'sharepoint_drive' },
      error: null,
    });
    await expect(resolveStorageProvider('org-1')).resolves.toBe('sharepoint_drive');
  });

  it('falls back to supabase_storage when no org_settings row', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(resolveStorageProvider('org-1')).resolves.toBe('supabase_storage');
  });

  it('falls back to supabase_storage when the column is null', async () => {
    maybeSingle.mockResolvedValue({
      data: { default_storage_provider: null },
      error: null,
    });
    await expect(resolveStorageProvider('org-1')).resolves.toBe('supabase_storage');
  });
});
