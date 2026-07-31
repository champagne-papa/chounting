// tests/integration/documentPreviewRoute.test.ts
//
// Route-layer integration test for
// GET /api/orgs/[orgId]/documents/[sourceDocumentId]/preview — the
// document-bytes read site the review screens depend on (build plan
// docs/09_briefs/post-mvp/2026-07-31-ap-ingest-ui-build-plan.md §4).
//
// Pattern: vi.mock('@/services/middleware/serviceContext') + direct route
// handler import (parity with activePaymentsReportRoute.test.ts). No HTTP,
// no localhost URLs (§1 integration-test-rules discipline).
//
// The storage RESOLVER is mocked so no provider is contacted: previewUrl on
// the real sharepoint_drive provider would make a live Graph call, and on
// supabase_storage would need a stored object. The mock also lets the
// dispatch-on-row assertion observe WHICH provider was requested — the
// property byteFetch.ts:31-38's forward-marker demands of this consumer.
//
// Cases:
//   1. 302 + Location + no-store — the happy path.
//   2. Dispatch-on-row — a row written under sharepoint_drive resolves
//      sharepoint_drive even though the org default is supabase_storage.
//      This is the forward-marker rule; a resolveStorageProvider (org
//      default) implementation would fail here.
//   3. 404 cross-org — a document belonging to ANOTHER org is NOT_FOUND,
//      not 403 and not a redirect. The security case: org membership alone
//      does not authorize an arbitrary document id.
//   4. 403 non-member — caller not in the named org.
//   5. 401 unauthenticated — buildServiceContext throws.
//   6. 404 nonexistent id — indistinguishable from case 3 (no existence
//      leak).

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { createIngestBatchForTest } from '../helpers/createIngestBatchForTest';
import { ServiceError } from '@/services/errors/ServiceError';

vi.mock('@/services/middleware/serviceContext', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@/services/middleware/serviceContext')
  >();
  return { ...actual, buildServiceContext: vi.fn() };
});

const previewUrlMock = vi.fn();
vi.mock('@/services/storage/resolver', () => ({
  getStorageProvider: vi.fn((provider: string) => ({
    previewUrl: (...args: unknown[]) => previewUrlMock(provider, ...args),
  })),
}));

import { buildServiceContext } from '@/services/middleware/serviceContext';
import { getStorageProvider } from '@/services/storage/resolver';
import { GET } from '@/app/api/orgs/[orgId]/documents/[sourceDocumentId]/preview/route';

const traceId = crypto.randomUUID();
const OTHER_ORG = SEED.ORG_REAL_ESTATE;

let docInHolding: string;
let docInOtherOrg: string;

function ctxFor(orgIds: string[]) {
  return makeTestContext({ org_ids: orgIds, trace_id: traceId });
}

function reqFor(orgId: string, sourceDocumentId: string) {
  return [
    new Request('https://test.invalid/preview'),
    { params: Promise.resolve({ orgId, sourceDocumentId }) },
  ] as const;
}

async function seedDoc(orgId: string, provider: string): Promise<string> {
  const db = adminClient();
  const { ingest_batch_id } = await createIngestBatchForTest(orgId);
  const id = crypto.randomUUID();
  const { error } = await db.from('source_documents').insert({
    id,
    org_id: orgId,
    storage_provider: provider,
    original_storage_key: `${traceId}/${id}.pdf`,
    original_content_hash: 'a'.repeat(64),
    original_byte_size: 1,
    original_filename: 'preview-route-test.pdf',
    mime_type: 'application/pdf',
    ingest_channel: 'direct_upload',
    received_at: new Date().toISOString(),
    created_by: SEED.USER_CONTROLLER,
    ingest_batch_id,
  });
  if (error) throw new Error(`seed failed: ${error.message}`);
  return id;
}

beforeAll(async () => {
  // Written under sharepoint_drive while the org default is supabase_storage
  // — the divergence case 2 needs to prove dispatch reads the ROW.
  docInHolding = await seedDoc(SEED.ORG_HOLDING, 'sharepoint_drive');
  docInOtherOrg = await seedDoc(OTHER_ORG, 'supabase_storage');
});

afterAll(async () => {
  const db = adminClient();
  await db.from('source_documents').delete().in('id', [docInHolding, docInOtherOrg]);
});

describe('GET /api/orgs/[orgId]/documents/[sourceDocumentId]/preview', () => {
  it('302-redirects to the provider URL with Cache-Control: no-store', async () => {
    vi.mocked(buildServiceContext).mockResolvedValue(ctxFor([SEED.ORG_HOLDING]));
    previewUrlMock.mockResolvedValue({
      url: 'https://provider.invalid/signed-abc',
      expires_at: new Date(Date.now() + 300_000).toISOString(),
      provider: 'sharepoint_drive',
    });

    const res = await GET(...reqFor(SEED.ORG_HOLDING, docInHolding));

    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('https://provider.invalid/signed-abc');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('dispatches on the ROW provider, not the org default (byteFetch forward-marker)', async () => {
    vi.mocked(buildServiceContext).mockResolvedValue(ctxFor([SEED.ORG_HOLDING]));
    previewUrlMock.mockResolvedValue({
      url: 'https://provider.invalid/signed-row',
      expires_at: new Date().toISOString(),
      provider: 'sharepoint_drive',
    });

    await GET(...reqFor(SEED.ORG_HOLDING, docInHolding));

    // The org's default_storage_provider is supabase_storage; the ROW says
    // sharepoint_drive. Dispatch must follow the row.
    expect(vi.mocked(getStorageProvider)).toHaveBeenCalledWith('sharepoint_drive');
  });

  it('404s a document belonging to ANOTHER org — membership alone is not authorization', async () => {
    // Caller is a member of BOTH orgs, and names ORG_HOLDING in the URL —
    // so the membership check passes. The document is in the other org.
    vi.mocked(buildServiceContext).mockResolvedValue(
      ctxFor([SEED.ORG_HOLDING, OTHER_ORG]),
    );
    previewUrlMock.mockClear();

    const res = await GET(...reqFor(SEED.ORG_HOLDING, docInOtherOrg));

    expect(res.status).toBe(404);
    expect(res.headers.get('Location')).toBeNull();
    // No URL was minted for a document the caller did not ask for by org.
    expect(previewUrlMock).not.toHaveBeenCalled();
  });

  it('403s a caller who is not a member of the named org', async () => {
    vi.mocked(buildServiceContext).mockResolvedValue(ctxFor([OTHER_ORG]));
    previewUrlMock.mockClear();

    const res = await GET(...reqFor(SEED.ORG_HOLDING, docInHolding));

    expect(res.status).toBe(403);
    expect(previewUrlMock).not.toHaveBeenCalled();
  });

  it('401s an unauthenticated request', async () => {
    vi.mocked(buildServiceContext).mockRejectedValue(
      new ServiceError('UNAUTHENTICATED', 'no session'),
    );

    const res = await GET(...reqFor(SEED.ORG_HOLDING, docInHolding));

    expect(res.status).toBe(401);
  });

  it('404s a nonexistent id identically to a cross-org one (no existence leak)', async () => {
    vi.mocked(buildServiceContext).mockResolvedValue(ctxFor([SEED.ORG_HOLDING]));

    const res = await GET(...reqFor(SEED.ORG_HOLDING, crypto.randomUUID()));

    expect(res.status).toBe(404);
  });
});
