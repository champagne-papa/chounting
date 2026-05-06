// tests/unit/storageResolver.test.ts
// Unit tests for getStorageProvider per ADR-0013 §2.
//
// Pure logic (enum dispatch + throw); no Supabase dependency at the
// test layer. The real supabaseStorageProvider has transitive imports
// through adminClient → env.ts that require deployment env vars
// (SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, UPSTASH_REDIS_*,
// NEXT_PUBLIC_*) which are not relevant to enum-dispatch testing.
// vi.mock() replaces the module so these tests run without env-var
// setup; provider integration tests with real Supabase land in chunk 6.

import { describe, it, expect, vi } from 'vitest';

vi.mock('@/services/storage/providers/supabaseStorageProvider', () => ({
  createSupabaseStorageProvider: vi.fn(() => ({
    put: vi.fn(),
    fetch: vi.fn(),
    fetchVersion: vi.fn(),
    previewUrl: vi.fn(),
    delete: vi.fn(),
    verifyIntegrity: vi.fn(),
  })),
}));

import { getStorageProvider } from '@/services/storage/resolver';
import { ServiceError } from '@/services/errors/ServiceError';

describe('getStorageProvider', () => {
  it('returns a StorageProvider instance for supabase_storage (v1 active)', () => {
    const provider = getStorageProvider('supabase_storage');
    expect(provider).toBeDefined();
    expect(typeof provider.put).toBe('function');
    expect(typeof provider.fetch).toBe('function');
    expect(typeof provider.fetchVersion).toBe('function');
    expect(typeof provider.previewUrl).toBe('function');
    expect(typeof provider.delete).toBe('function');
    expect(typeof provider.verifyIntegrity).toBe('function');
  });

  it('throws STORAGE_OPERATION_FAILED for sharepoint_drive (reserved)', () => {
    expect(() => getStorageProvider('sharepoint_drive')).toThrow(ServiceError);
    try {
      getStorageProvider('sharepoint_drive');
      throw new Error('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ServiceError);
      expect((err as ServiceError).code).toBe('STORAGE_OPERATION_FAILED');
      expect((err as ServiceError).message).toContain('reserved');
      expect((err as ServiceError).message).toContain('sharepoint_drive');
    }
  });

  it('throws STORAGE_OPERATION_FAILED for s3_bucket (reserved)', () => {
    expect(() => getStorageProvider('s3_bucket')).toThrow(ServiceError);
    try {
      getStorageProvider('s3_bucket');
      throw new Error('expected throw');
    } catch (err) {
      expect((err as ServiceError).code).toBe('STORAGE_OPERATION_FAILED');
      expect((err as ServiceError).message).toContain('s3_bucket');
    }
  });

  it('throws STORAGE_OPERATION_FAILED for external_url (reserved)', () => {
    expect(() => getStorageProvider('external_url')).toThrow(ServiceError);
    try {
      getStorageProvider('external_url');
      throw new Error('expected throw');
    } catch (err) {
      expect((err as ServiceError).code).toBe('STORAGE_OPERATION_FAILED');
      expect((err as ServiceError).message).toContain('external_url');
    }
  });
});
