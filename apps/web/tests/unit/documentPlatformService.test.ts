// tests/unit/documentPlatformService.test.ts
// Unit tests for documentPlatformService.createSourceDocument per
// chunk N scope.
//
// vi.mock isolates resolver + adminClient per chunk 4 resolver-test
// precedent: the real modules transitively load env-validating
// dependencies (env.ts) that require deployment env vars. Mocking
// breaks the env-load chain; resolver-side mock returns a fake
// StorageProvider; adminClient-side mock returns a fake client whose
// rpc() is stubbed.
//
// Tests cover:
//   - Successful put + RPC → returns CreateSourceDocumentResult with
//     correct fields
//   - storage.put failure → ServiceError propagated with chunk 3
//     classifier-mapped code
//   - RPC error → wrapped in STORAGE_OPERATION_FAILED ServiceError
//   - withInvariants pre-flight rejects on missing trace_id
//   - withInvariants pre-flight rejects on org_id outside caller
//     memberships
//
// Integration tests (real storage put + real DB INSERT + real audit
// emission round-trip) defer to chunk N+M per chunks-1-4 testing
// pattern.

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/services/storage/resolver', () => ({
  getStorageProvider: vi.fn(),
}));

// Charter B real-flow D-2: createSourceDocument now resolves the org's default
// provider via resolveStorageProvider before put+stamp. This unit test isolates
// the storage layer, so mock the resolution to the v1 default ('supabase_storage'
// — matches the former hardcoded V1_STORAGE_PROVIDER these tests were written
// against). Org-default resolution itself is covered by resolveStorageProvider's
// own unit/integration tests.
vi.mock('@/services/storage/resolveStorageProvider', () => ({
  resolveStorageProvider: vi.fn(async () => 'supabase_storage'),
}));

vi.mock('@/db/adminClient', () => ({
  adminClient: vi.fn(),
}));

// Pino logger module imports `@/shared/env` at module load, which
// validates 7 required env vars (SUPABASE_SERVICE_ROLE_KEY,
// ANTHROPIC_API_KEY, UPSTASH_REDIS_KV_REST_API_*, NEXT_PUBLIC_*) and
// throws if any are missing. The chunk 4 resolver test sidesteps this
// by mocking `supabaseStorageProvider` (which transitively loads env);
// chunk N's documentPlatformService imports `loggerWith` directly, so
// we mock pino here to break the env-load chain. Same unit-test
// discipline as chunk 4.
vi.mock('@/shared/logger/pino', () => ({
  loggerWith: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { documentPlatformService } from '@/services/document-platform/documentPlatformService';
import { ServiceError } from '@/services/errors/ServiceError';
import { getStorageProvider } from '@/services/storage/resolver';
import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import type { CreateSourceDocumentInput } from '@/services/document-platform/types';

const mockOrgId = '11111111-2222-3333-4444-555555555555';
const mockUserId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

const mockCtx: ServiceContext = {
  trace_id: '11111111-1111-1111-1111-111111111111',
  caller: {
    user_id: mockUserId,
    email: 'test@example.com',
    verified: true,
    org_ids: [mockOrgId],
  },
};

const mockInput: CreateSourceDocumentInput = {
  bytes: new Uint8Array([1, 2, 3, 4]),
  mime_type: 'application/pdf',
  original_filename: 'test.pdf',
  org_id: mockOrgId,
  // Mock value at unit-test grain — no real DB; chunk 6.2a Sub-Q4
  // Step C requires the field on the input contract. Production paths
  // obtain a real ingest_batch_id from chunk 6.1's
  // create_ingest_batch_with_documents_with_audit RPC; integration
  // tests use tests/helpers/createIngestBatchForTest.ts.
  ingest_batch_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  ingest_channel: 'direct_upload',
  received_at: '2026-05-06T00:00:00Z',
  created_by: mockUserId,
};

function makeMockProvider(
  putImpl: ReturnType<typeof vi.fn>,
): ReturnType<typeof getStorageProvider> {
  return {
    put: putImpl,
    fetch: vi.fn(),
    fetchVersion: vi.fn(),
    previewUrl: vi.fn(),
    delete: vi.fn(),
    verifyIntegrity: vi.fn(),
  };
}

describe('documentPlatformService.createSourceDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns CreateSourceDocumentResult on successful put + RPC', async () => {
    const mockPut = vi.fn().mockResolvedValue({
      storage_key: `org_${mockOrgId}/sources/uuid/test.pdf`,
      content_hash: 'abcdef1234567890',
      byte_size: 4,
      provider: 'supabase_storage',
    });
    vi.mocked(getStorageProvider).mockReturnValue(makeMockProvider(mockPut));

    let rpcCallId: string | undefined;
    vi.mocked(adminClient).mockReturnValue({
      rpc: vi.fn(async (_fnName: string, params: { p_source_document: { id: string } }) => {
        rpcCallId = params.p_source_document.id;
        return { data: rpcCallId, error: null };
      }),
    } as unknown as ReturnType<typeof adminClient>);

    const result = await documentPlatformService.createSourceDocument(
      mockInput,
      mockCtx,
    );

    expect(result.id).toBeDefined();
    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(result.id).toBe(rpcCallId);
    expect(result.storage_key).toBe(
      `org_${mockOrgId}/sources/uuid/test.pdf`,
    );
    expect(result.content_hash).toBe('abcdef1234567890');
    expect(result.byte_size).toBe(4);
    expect(result.provider).toBe('supabase_storage');
    expect(mockPut).toHaveBeenCalledTimes(1);
  });

  it('passes the same source_document_id to put() input and RPC payload', async () => {
    let putInputId: string | undefined;
    const mockPut = vi.fn(
      async (input: { source_document_id: string }) => {
        putInputId = input.source_document_id;
        return {
          storage_key: 'k',
          content_hash: 'h',
          byte_size: 4,
          provider: 'supabase_storage' as const,
        };
      },
    );
    vi.mocked(getStorageProvider).mockReturnValue(makeMockProvider(mockPut));

    let rpcInputId: string | undefined;
    vi.mocked(adminClient).mockReturnValue({
      rpc: vi.fn(async (_fnName: string, params: { p_source_document: { id: string } }) => {
        rpcInputId = params.p_source_document.id;
        return { data: rpcInputId, error: null };
      }),
    } as unknown as ReturnType<typeof adminClient>);

    await documentPlatformService.createSourceDocument(mockInput, mockCtx);

    expect(putInputId).toBeDefined();
    expect(rpcInputId).toBeDefined();
    expect(putInputId).toBe(rpcInputId);
  });

  it('propagates storage.put errors as ServiceError', async () => {
    const mockPut = vi
      .fn()
      .mockRejectedValue(
        new ServiceError('STORAGE_KEY_MALFORMED', 'bad path'),
      );
    vi.mocked(getStorageProvider).mockReturnValue(makeMockProvider(mockPut));

    await expect(
      documentPlatformService.createSourceDocument(mockInput, mockCtx),
    ).rejects.toMatchObject({
      code: 'STORAGE_KEY_MALFORMED',
    });
  });

  it('throws STORAGE_OPERATION_FAILED on RPC error', async () => {
    const mockPut = vi.fn().mockResolvedValue({
      storage_key: 'k',
      content_hash: 'h',
      byte_size: 4,
      provider: 'supabase_storage',
    });
    vi.mocked(getStorageProvider).mockReturnValue(makeMockProvider(mockPut));

    vi.mocked(adminClient).mockReturnValue({
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'duplicate key' },
      }),
    } as unknown as ReturnType<typeof adminClient>);

    await expect(
      documentPlatformService.createSourceDocument(mockInput, mockCtx),
    ).rejects.toMatchObject({
      code: 'STORAGE_OPERATION_FAILED',
    });
  });

  it('throws STORAGE_OPERATION_FAILED on RPC id mismatch', async () => {
    const mockPut = vi.fn().mockResolvedValue({
      storage_key: 'k',
      content_hash: 'h',
      byte_size: 4,
      provider: 'supabase_storage',
    });
    vi.mocked(getStorageProvider).mockReturnValue(makeMockProvider(mockPut));

    vi.mocked(adminClient).mockReturnValue({
      rpc: vi.fn().mockResolvedValue({
        data: 'wrong-id-from-rpc',
        error: null,
      }),
    } as unknown as ReturnType<typeof adminClient>);

    await expect(
      documentPlatformService.createSourceDocument(mockInput, mockCtx),
    ).rejects.toMatchObject({
      code: 'STORAGE_OPERATION_FAILED',
    });
  });

  it('rejects on missing trace_id (withInvariants pre-flight)', async () => {
    const badCtx: ServiceContext = { ...mockCtx, trace_id: '' };
    await expect(
      documentPlatformService.createSourceDocument(mockInput, badCtx),
    ).rejects.toMatchObject({
      code: 'MISSING_TRACE_ID',
    });
  });

  it('rejects on org_id outside caller memberships (withInvariants pre-flight)', async () => {
    const badInput: CreateSourceDocumentInput = {
      ...mockInput,
      org_id: '99999999-9999-9999-9999-999999999999',
    };
    await expect(
      documentPlatformService.createSourceDocument(badInput, mockCtx),
    ).rejects.toMatchObject({
      code: 'ORG_ACCESS_DENIED',
    });
  });
});
