// tests/integration/dragDropRoute.integration.test.ts
//
// Phase 6 chunk 6.2b — integration tests for
// POST /api/orgs/[orgId]/documents/ingest/drag-drop
//
// Pattern: vi.mock both `serviceContext` (for auth bypass) and
// `storage/resolver` (to avoid real bucket I/O) + direct route
// handler import. Mirrors activePaymentsReportRoute.test.ts pattern
// (vi.mock + dynamic import after registration).

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';

const TRACE_ID = '00000000-0000-0000-0000-0000d72b0001';

vi.mock('@/services/middleware/serviceContext', async () => {
  const actual =
    await vi.importActual<
      typeof import('@/services/middleware/serviceContext')
    >('@/services/middleware/serviceContext');
  return {
    ...actual,
    buildServiceContext: vi.fn(async () => ({
      trace_id: TRACE_ID,
      caller: {
        user_id: SEED.USER_CONTROLLER,
        email: 'controller@thebridge.local',
        verified: true as const,
        org_ids: [SEED.ORG_HOLDING],
      },
      locale: 'en' as const,
    })),
  };
});

vi.mock('@/services/storage/resolver', () => ({
  getStorageProvider: vi.fn(),
}));

const { POST } = await import(
  '@/app/api/orgs/[orgId]/documents/ingest/drag-drop/route'
);
const { getStorageProvider } = await import('@/services/storage/resolver');
const serviceContextModule = await import(
  '@/services/middleware/serviceContext'
);

const db = adminClient();

function bindMockPut(): Mock {
  const m: Mock = vi
    .fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .mockImplementation(async (input: any) => ({
      storage_key: `org_${input.org_id}/sources/${input.source_document_id}/${input.original_filename}`,
      content_hash:
        '0000000000000000000000000000000000000000000000000000000000000000',
      byte_size: (input.bytes as Uint8Array).byteLength,
      provider: 'supabase_storage' as const,
    }));
  // Phase 7 chunk 7.1a — orchestrator hook fires post-RPC.
  // Stage 1 byteFetch calls provider.fetch; mock returns synthetic
  // bytes so the orchestrator can complete the in-memory pipeline.
  const fetchMock = vi.fn().mockResolvedValue({
    bytes: new TextEncoder().encode('stub bytes'),
    content_hash:
      '0000000000000000000000000000000000000000000000000000000000000000',
    provider: 'supabase_storage' as const,
  });
  (getStorageProvider as Mock).mockReturnValue({ put: m, fetch: fetchMock });
  return m;
}

function makeFormData(opts: {
  drop_session_id?: string | null;
  files: Array<{ name: string; type: string; content: string }>;
}): FormData {
  const fd = new FormData();
  if (opts.drop_session_id !== null && opts.drop_session_id !== undefined) {
    fd.append('drop_session_id', opts.drop_session_id);
  }
  for (const f of opts.files) {
    fd.append(
      'files',
      new File([f.content], f.name, { type: f.type }),
    );
  }
  return fd;
}

function makeReq(body: BodyInit): Request {
  // Next.js routes operate on the standard Request object.
  return new Request(
    'http://test.local/api/orgs/' + SEED.ORG_HOLDING + '/documents/ingest/drag-drop',
    { method: 'POST', body },
  );
}

describe('POST /api/orgs/[orgId]/documents/ingest/drag-drop', () => {
  beforeEach(() => {
    bindMockPut();
  });

  afterEach(async () => {
    await db.from('audit_log').delete().eq('trace_id', TRACE_ID);
    vi.clearAllMocks();
    // Re-register buildServiceContext default behavior after clearAllMocks
    // (clearAllMocks wipes mock implementations).
    (
      serviceContextModule.buildServiceContext as Mock
    ).mockImplementation(async () => ({
      trace_id: TRACE_ID,
      caller: {
        user_id: SEED.USER_CONTROLLER,
        email: 'controller@thebridge.local',
        verified: true as const,
        org_ids: [SEED.ORG_HOLDING],
      },
      locale: 'en' as const,
    }));
  });

  it('happy path: multipart POST with 2 files → 201 with {ingest_batch_id, document_count}', async () => {
    bindMockPut();
    const fd = makeFormData({
      drop_session_id: crypto.randomUUID(),
      files: [
        { name: 'route-test-a.pdf', type: 'application/pdf', content: 'a' },
        { name: 'route-test-b.pdf', type: 'application/pdf', content: 'b' },
      ],
    });
    const res = await POST(makeReq(fd), {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      ingest_batch_id: string;
      document_count: number;
    };
    expect(body.document_count).toBe(2);
    expect(body.ingest_batch_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('400 when drop_session_id form field is missing', async () => {
    bindMockPut();
    const fd = makeFormData({
      drop_session_id: null,
      files: [
        { name: 'no-session.pdf', type: 'application/pdf', content: 'x' },
      ],
    });
    const res = await POST(makeReq(fd), {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('INVALID_INPUT');
  });

  it('400 when no files are present', async () => {
    bindMockPut();
    const fd = makeFormData({
      drop_session_id: crypto.randomUUID(),
      files: [],
    });
    const res = await POST(makeReq(fd), {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING }),
    });
    expect(res.status).toBe(400);
  });

  it('403 cross-org: buildServiceContext caller without orgId in org_ids → ORG_ACCESS_DENIED', async () => {
    bindMockPut();
    (
      serviceContextModule.buildServiceContext as Mock
    ).mockImplementationOnce(async () => ({
      trace_id: TRACE_ID,
      caller: {
        user_id: SEED.USER_CONTROLLER,
        email: 'controller@thebridge.local',
        verified: true as const,
        // Wrong org — caller only has ORG_REAL_ESTATE.
        org_ids: [SEED.ORG_REAL_ESTATE],
      },
      locale: 'en' as const,
    }));

    const fd = makeFormData({
      drop_session_id: crypto.randomUUID(),
      files: [
        { name: 'wrong-org.pdf', type: 'application/pdf', content: 'x' },
      ],
    });
    // Target ORG_HOLDING but caller doesn't belong to it.
    const res = await POST(makeReq(fd), {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING }),
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('ORG_ACCESS_DENIED');
  });

  it('ServiceError details propagate to response body (Sub-Q9 R1 mitigation)', async () => {
    // Make storage put fail on the second file → ingestionService throws
    // ServiceError with details = {file_index: 1, filename, stage}.
    const m = bindMockPut();
    let n = 0;
    m.mockImplementation(async (input: { bytes: Uint8Array; org_id: string; source_document_id: string; original_filename: string }) => {
      n++;
      if (n === 2) throw new Error('Simulated put failure');
      return {
        storage_key: `org_${input.org_id}/sources/${input.source_document_id}/${input.original_filename}`,
        content_hash:
          '0000000000000000000000000000000000000000000000000000000000000000',
        byte_size: input.bytes.byteLength,
        provider: 'supabase_storage' as const,
      };
    });
    const fd = makeFormData({
      drop_session_id: crypto.randomUUID(),
      files: [
        { name: 'r1.pdf', type: 'application/pdf', content: 'a' },
        { name: 'r1-fail.pdf', type: 'application/pdf', content: 'b' },
        { name: 'r1-skipped.pdf', type: 'application/pdf', content: 'c' },
      ],
    });
    const res = await POST(makeReq(fd), {
      params: Promise.resolve({ orgId: SEED.ORG_HOLDING }),
    });
    // STORAGE_OPERATION_FAILED maps to 500 per serviceErrorToStatus
    // (catch-all for repo-convention storage path; see ServiceError.ts
    // comment "Repo-convention catchall (not in ADR text)").
    expect(res.status).toBeGreaterThanOrEqual(400);
    const body = (await res.json()) as {
      error: string;
      message: string;
      details?: {
        file_index?: number;
        filename?: string;
        stage?: string;
      };
    };
    expect(body.error).toBe('STORAGE_OPERATION_FAILED');
    expect(body.details?.file_index).toBe(1);
    expect(body.details?.filename).toBe('r1-fail.pdf');
    expect(body.details?.stage).toBe('storage_put');
  });
});
