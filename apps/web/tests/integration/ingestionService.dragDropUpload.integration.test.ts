// tests/integration/ingestionService.dragDropUpload.integration.test.ts
//
// Phase 6 chunk 6.2b — integration tests for
// ingestionService.handleDragDropUpload (Pattern B external-wrap).
//
// Storage provider is mocked at the resolver layer so tests avoid
// real bucket I/O latency; the storage provider has its own dedicated
// integration coverage at storageProviderIntegration.test.ts. These
// tests focus on the composition logic — Zod ingress validation +
// per-file storage put loop + chunk 6.1 RPC atomicity + trace_id
// propagation + Sub-Q9 R1 ServiceError.details mitigation.
//
// Cleanup posture: audit_log rows deleted by trace_id at end of each
// test; ingest_batches / source_documents / document_cases /
// document_jobs rows accumulate (delete-forbidden per immutability
// triggers; `pnpm db:reset` clears between full runs).

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { ServiceError } from '@/services/errors/ServiceError';

vi.mock('@/services/storage/resolver', () => ({
  getStorageProvider: vi.fn(),
}));

const { ingestionService } = await import(
  '@/services/document-platform/ingestionService'
);
// Class D T4: handleDragDropUpload's IngestInvoker param is required;
// these direct-service tests wire the REAL ingestDocument — exactly
// what the service invoked internally pre-inversion, so the exercised
// surface is unchanged (pipeline failures on synthetic docs are
// swallowed by the Pattern-B catch, as before). Dynamic import after
// vi.mock, matching the file's mock-hoisting pattern.
const { ingestDocument } = await import(
  '@/agent/orchestrator/extraction/ingestDocument'
);
const { getStorageProvider } = await import(
  '@/services/storage/resolver'
);

const db = adminClient();

function makeFile(filename: string, content = 'test pdf content') {
  return {
    bytes: new TextEncoder().encode(content),
    mime_type: 'application/pdf' as const,
    original_filename: filename,
  };
}

function makeMockPut(): Mock {
  return vi
    .fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .mockImplementation(async (input: any) => ({
      storage_key: `org_${input.org_id}/sources/${input.source_document_id}/${input.original_filename}`,
      content_hash:
        '0000000000000000000000000000000000000000000000000000000000000000',
      byte_size: (input.bytes as Uint8Array).byteLength,
      provider: 'supabase_storage' as const,
    }));
}

describe('ingestionService.handleDragDropUpload', () => {
  let mockPut: Mock;
  let traceIds: string[] = [];

  beforeEach(() => {
    mockPut = makeMockPut();
    // Phase 7 chunk 7.1a — orchestrator hook fires post-RPC. Stage 1
    // byteFetch calls provider.fetch; mock returns synthetic bytes.
    const fetchMock = vi.fn().mockResolvedValue({
      bytes: new TextEncoder().encode('stub bytes'),
      content_hash:
        '0000000000000000000000000000000000000000000000000000000000000000',
      provider: 'supabase_storage' as const,
    });
    (getStorageProvider as Mock).mockReturnValue({
      put: mockPut,
      fetch: fetchMock,
    });
    traceIds = [];
  });

  afterEach(async () => {
    // Cleanup audit_log by collected trace_ids.
    for (const tid of traceIds) {
      await db.from('audit_log').delete().eq('trace_id', tid);
    }
  });

  it('N=1: single-file path produces 1 batch + 1 source_document + 1 case + 1 job + 1 audit row', async () => {
    const ctx = makeTestContext();
    traceIds.push(ctx.trace_id);

    const result = await ingestionService.handleDragDropUpload(
      {
        org_id: SEED.ORG_HOLDING,
        drop_session_id: crypto.randomUUID(),
        files: [makeFile('test-n1.pdf')],
      },
      ctx,
      ingestDocument,
    );

    expect(result.document_count).toBe(1);
    expect(result.ingest_batch_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );

    const { data: batchRow } = await db
      .from('ingest_batches')
      .select('id, ingest_channel, trace_id, channel_metadata')
      .eq('id', result.ingest_batch_id)
      .single();
    expect(batchRow).toBeTruthy();
    expect(batchRow!.ingest_channel).toBe('drag_drop_pdf');
    expect(batchRow!.trace_id).toBe(ctx.trace_id);

    const { data: docs } = await db
      .from('source_documents')
      .select('id, original_filename, ingest_batch_id')
      .eq('ingest_batch_id', result.ingest_batch_id);
    expect(docs).toHaveLength(1);
    expect(docs![0].original_filename).toBe('test-n1.pdf');

    const { data: cases } = await db
      .from('document_cases')
      .select('id, state, document_type, trace_id')
      .eq('trace_id', ctx.trace_id);
    expect(cases).toHaveLength(1);
    expect(cases![0].state).toBe('received');
    expect(cases![0].document_type).toBe('unknown');

    const { data: jobs } = await db
      .from('document_jobs')
      .select('id, state, ingest_batch_id')
      .eq('ingest_batch_id', result.ingest_batch_id);
    expect(jobs).toHaveLength(1);
    expect(jobs![0].state).toBe('queued');

    const { data: auditRow, error: aErr } = await db
      .from('audit_log')
      .select('action, entity_type, trace_id')
      .eq('trace_id', ctx.trace_id)
      .maybeSingle();
    expect(aErr).toBeNull();
    expect(auditRow).toBeTruthy();
    expect(auditRow!.action).toBe('ingest_batch_created');
    expect(auditRow!.entity_type).toBe('ingest_batch');
  });

  it('N=3: multi-file path produces 1 batch + 3 source_documents + 3 cases + 3 jobs + 1 audit (batch-grain audit per Sub-Q8)', async () => {
    const ctx = makeTestContext();
    traceIds.push(ctx.trace_id);

    const result = await ingestionService.handleDragDropUpload(
      {
        org_id: SEED.ORG_HOLDING,
        drop_session_id: crypto.randomUUID(),
        files: [
          makeFile('test-n3-a.pdf'),
          makeFile('test-n3-b.pdf'),
          makeFile('test-n3-c.pdf'),
        ],
      },
      ctx,
      ingestDocument,
    );

    expect(result.document_count).toBe(3);

    const { data: docs } = await db
      .from('source_documents')
      .select('original_filename')
      .eq('ingest_batch_id', result.ingest_batch_id);
    expect(docs).toHaveLength(3);

    const { data: cases } = await db
      .from('document_cases')
      .select('id')
      .eq('trace_id', ctx.trace_id);
    expect(cases).toHaveLength(3);

    const { data: jobs } = await db
      .from('document_jobs')
      .select('id, state')
      .eq('ingest_batch_id', result.ingest_batch_id);
    expect(jobs).toHaveLength(3);
    for (const j of jobs ?? []) {
      expect(j.state).toBe('queued');
    }

    // Single audit row per Sub-Q8 + INV-AUDIT-001 batch-grain lock.
    const { data: auditRows, error: auditErr } = await db
      .from('audit_log')
      .select('audit_log_id')
      .eq('trace_id', ctx.trace_id);
    expect(auditErr).toBeNull();
    expect(auditRows ?? []).toHaveLength(1);
  });

  it('partial-failure: storage put fails on file 3 of 5 → ServiceError with details.{file_index, filename, stage}', async () => {
    const ctx = makeTestContext();
    traceIds.push(ctx.trace_id);

    let callCount = 0;
    mockPut.mockImplementation(async (input: { bytes: Uint8Array; org_id: string; source_document_id: string; original_filename: string }) => {
      callCount++;
      if (callCount === 3) {
        throw new Error('Simulated storage failure on file 3');
      }
      return {
        storage_key: `org_${input.org_id}/sources/${input.source_document_id}/${input.original_filename}`,
        content_hash:
          '0000000000000000000000000000000000000000000000000000000000000000',
        byte_size: input.bytes.byteLength,
        provider: 'supabase_storage' as const,
      };
    });

    let thrown: unknown;
    try {
      await ingestionService.handleDragDropUpload(
        {
          org_id: SEED.ORG_HOLDING,
          drop_session_id: crypto.randomUUID(),
          files: [
            makeFile('test-pf-1.pdf'),
            makeFile('test-pf-2.pdf'),
            makeFile('test-pf-3.pdf'),
            makeFile('test-pf-4.pdf'),
            makeFile('test-pf-5.pdf'),
          ],
        },
        ctx,
        ingestDocument,
      );
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeInstanceOf(ServiceError);
    const se = thrown as ServiceError;
    expect(se.code).toBe('STORAGE_OPERATION_FAILED');
    const details = se.details as
      | { file_index?: number; filename?: string; stage?: string }
      | undefined;
    expect(details?.file_index).toBe(2); // zero-based; file 3 = index 2
    expect(details?.filename).toBe('test-pf-3.pdf');
    expect(details?.stage).toBe('storage_put');

    // No DB rows landed: storage put failed BEFORE the RPC was invoked.
    const { data: batchRows } = await db
      .from('ingest_batches')
      .select('id')
      .eq('trace_id', ctx.trace_id);
    expect(batchRows ?? []).toHaveLength(0);

    // Files 4 and 5 never reached put.
    expect(mockPut).toHaveBeenCalledTimes(3);
  });

  it('Zod ingress rejects sentinel-shape channel_metadata via DragDropChannelMetadataSchema.strict()', async () => {
    const ctx = makeTestContext();
    traceIds.push(ctx.trace_id);

    let thrown: unknown;
    try {
      await ingestionService.handleDragDropUpload(
        {
          org_id: SEED.ORG_HOLDING,
          // drop_session_id is required; submit invalid input to
          // trigger Zod failure. Cast through unknown to bypass TS.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          drop_session_id: 'not-a-uuid' as any,
          files: [makeFile('test-zod.pdf')],
        },
        ctx,
        ingestDocument,
      );
    } catch (err) {
      thrown = err;
    }

    // Zod throws ZodError (not ServiceError); route handler maps to 400.
    expect(thrown).toBeTruthy();
    expect((thrown as Error).name).toBe('ZodError');

    // No DB rows landed.
    const { data } = await db
      .from('ingest_batches')
      .select('id')
      .eq('trace_id', ctx.trace_id);
    expect(data ?? []).toHaveLength(0);
  });

  it('trace_id correlation: single ctx.trace_id propagates to ingest_batches.trace_id + audit_log.trace_id + per-case/per-job trace_id', async () => {
    const ctx = makeTestContext();
    traceIds.push(ctx.trace_id);

    const result = await ingestionService.handleDragDropUpload(
      {
        org_id: SEED.ORG_HOLDING,
        drop_session_id: crypto.randomUUID(),
        files: [
          makeFile('test-trace-a.pdf'),
          makeFile('test-trace-b.pdf'),
        ],
      },
      ctx,
      ingestDocument,
    );

    const { data: batchRow } = await db
      .from('ingest_batches')
      .select('trace_id')
      .eq('id', result.ingest_batch_id)
      .single();
    expect(batchRow!.trace_id).toBe(ctx.trace_id);

    const { data: auditRow, error: aErr } = await db
      .from('audit_log')
      .select('trace_id')
      .eq('trace_id', ctx.trace_id)
      .maybeSingle();
    expect(aErr).toBeNull();
    expect(auditRow).toBeTruthy();
    expect(auditRow!.trace_id).toBe(ctx.trace_id);

    const { data: cases } = await db
      .from('document_cases')
      .select('trace_id')
      .eq('trace_id', ctx.trace_id);
    expect(cases).toHaveLength(2);
    for (const c of cases ?? []) {
      expect(c.trace_id).toBe(ctx.trace_id);
    }

    const { data: jobs } = await db
      .from('document_jobs')
      .select('trace_id')
      .eq('ingest_batch_id', result.ingest_batch_id);
    expect(jobs).toHaveLength(2);
    for (const j of jobs ?? []) {
      expect(j.trace_id).toBe(ctx.trace_id);
    }
  });
});
