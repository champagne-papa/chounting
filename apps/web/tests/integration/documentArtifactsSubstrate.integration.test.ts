import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { adminClient, userClientFor, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { createIngestBatchForTest } from '../helpers/createIngestBatchForTest';
import { documentPlatformService } from '@/services/document-platform/documentPlatformService';
import { DocumentArtifactSchema } from '@/shared/schemas/document-platform/documentArtifact.schema';
import type { ServiceContext } from '@/services/middleware/serviceContext';

describe('document_artifacts substrate happy chain + supersession (chunk 4)', () => {
  // Walkable proof: admin-INSERT the full chain
  // source_document -> ocr_run -> extraction_run -> document_artifact.
  // Read back, Zod-parse, confirm shape matches DB. Second
  // describe-block test covers ocr_runs supersession.

  let ctx: ServiceContext;
  let sourceDocId: string;

  beforeAll(async () => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });

    // Create parent ingest_batch (chunk 6.2a Sub-Q4 Step C; FK-anchor for source_document).
    const { ingest_batch_id } = await createIngestBatchForTest(SEED.ORG_HOLDING);

    const sourceResult = await documentPlatformService.createSourceDocument(
      {
        bytes: new Uint8Array([1, 2, 3, 4]),
        mime_type: 'application/pdf',
        original_filename: 'chunk-4-happy.pdf',
        ingest_channel: 'direct_upload',
        ingest_batch_id,
        received_at: new Date().toISOString(),
        org_id: SEED.ORG_HOLDING,
        created_by: ctx.caller.user_id,
      },
      ctx,
    );
    sourceDocId = sourceResult.id;
  });

  afterAll(async () => {
    // Clean audit_log rows from the beforeAll's source_document
    // creation. Chunk-4 paths themselves write no audit_log rows
    // (no writer ships at chunk 4), but the test setup calls
    // documentPlatformService.createSourceDocument which writes
    // via create_source_document_with_audit RPC. Mirrors chunk-3
    // afterAll pattern. Substrate rows accumulate within run per
    // immutability triggers (admin bypass blocked).
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('happy chain: admin-INSERT ocr_run -> extraction_run -> document_artifact; Zod-parses readback', async () => {
    const db = adminClient();

    // INSERT 1: ocr_run
    const ocrRunId = crypto.randomUUID();
    const { error: ocrErr } = await db.from('ocr_runs').insert({
      id: ocrRunId,
      source_document_id: sourceDocId,
      supersedes_ocr_run_id: null,
      created_by: ctx.caller.user_id,
    });
    expect(ocrErr).toBeNull();

    // INSERT 2: extraction_run
    const extractionRunId = crypto.randomUUID();
    const { error: extErr } = await db.from('extraction_runs').insert({
      id: extractionRunId,
      source_document_id: sourceDocId,
      ocr_run_id: ocrRunId,
      extraction_version: 'v1',
      created_by: ctx.caller.user_id,
    });
    expect(extErr).toBeNull();

    // INSERT 3: document_artifact
    const artifactId = crypto.randomUUID();
    const { error: artErr } = await db.from('document_artifacts').insert({
      id: artifactId,
      source_document_id: sourceDocId,
      ocr_run_id: ocrRunId,
      extraction_run_id: extractionRunId,
      engine: 'paddleocr',
      engine_version: '2.7.0',
      pages: [],
      lines: [],
      words: [],
      quality_flags: [],
      pipeline_trace: [],
      confidence: 0.85,
    });
    expect(artErr).toBeNull();

    // Read back document_artifact; Zod parses.
    const { data: row } = await db
      .from('document_artifacts')
      .select('*')
      .eq('id', artifactId)
      .single();
    expect(row).not.toBeNull();

    const parsed = DocumentArtifactSchema.safeParse(row);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.source_document_id).toBe(sourceDocId);
      expect(parsed.data.ocr_run_id).toBe(ocrRunId);
      expect(parsed.data.extraction_run_id).toBe(extractionRunId);
      expect(parsed.data.engine).toBe('paddleocr');
      expect(parsed.data.confidence).toBe(0.85);
    }
  });

  it('supersession chain: ocr_run B references ocr_run A via supersedes_ocr_run_id; both rows preserved', async () => {
    // §9 Rule 1: re-extraction produces a new ocr_runs row that
    // supersedes the prior via supersedes_ocr_run_id; prior row
    // never updated or deleted.
    const db = adminClient();

    const runAId = crypto.randomUUID();
    const { error: errA } = await db.from('ocr_runs').insert({
      id: runAId,
      source_document_id: sourceDocId,
      supersedes_ocr_run_id: null,
      created_by: ctx.caller.user_id,
    });
    expect(errA).toBeNull();

    const runBId = crypto.randomUUID();
    const { error: errB } = await db.from('ocr_runs').insert({
      id: runBId,
      source_document_id: sourceDocId,
      supersedes_ocr_run_id: runAId,
      created_by: ctx.caller.user_id,
    });
    expect(errB).toBeNull();

    // Both rows exist.
    const { data: rows } = await db
      .from('ocr_runs')
      .select('id, supersedes_ocr_run_id')
      .in('id', [runAId, runBId])
      .order('created_at', { ascending: true });
    expect(rows).toHaveLength(2);
    expect(rows![0].id).toBe(runAId);
    expect(rows![0].supersedes_ocr_run_id).toBeNull();
    expect(rows![1].id).toBe(runBId);
    expect(rows![1].supersedes_ocr_run_id).toBe(runAId);
  });
});

describe('document_artifacts substrate constraint + immutability rejections (chunk 4)', () => {
  let ctx: ServiceContext;
  let sourceDocId: string;
  let ocrRunId: string;
  let extractionRunId: string;

  beforeAll(async () => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });

    // Create parent ingest_batch (chunk 6.2a Sub-Q4 Step C; FK-anchor for source_document).
    const { ingest_batch_id } = await createIngestBatchForTest(SEED.ORG_HOLDING);

    const sourceResult = await documentPlatformService.createSourceDocument(
      {
        bytes: new Uint8Array([5, 6, 7, 8]),
        mime_type: 'application/pdf',
        original_filename: 'chunk-4-rejections.pdf',
        ingest_channel: 'direct_upload',
        ingest_batch_id,
        received_at: new Date().toISOString(),
        org_id: SEED.ORG_HOLDING,
        created_by: ctx.caller.user_id,
      },
      ctx,
    );
    sourceDocId = sourceResult.id;

    // Seed one ocr_run + one extraction_run for use across rejection tests.
    const db = adminClient();
    ocrRunId = crypto.randomUUID();
    await db.from('ocr_runs').insert({
      id: ocrRunId,
      source_document_id: sourceDocId,
      supersedes_ocr_run_id: null,
      created_by: ctx.caller.user_id,
    });

    extractionRunId = crypto.randomUUID();
    await db.from('extraction_runs').insert({
      id: extractionRunId,
      source_document_id: sourceDocId,
      ocr_run_id: ocrRunId,
      extraction_version: 'v1',
      created_by: ctx.caller.user_id,
    });
  });

  afterAll(async () => {
    // Clean audit_log rows from the beforeAll's source_document
    // creation (same rationale as describe 1).
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('document_artifacts FK rejections on each of three FK targets', async () => {
    const db = adminClient();
    const nonExistentUuid = '00000000-0000-0000-0000-deadbeefcafe';

    // Case A: bad source_document_id
    const { error: srcErr } = await db.from('document_artifacts').insert({
      id: crypto.randomUUID(),
      source_document_id: nonExistentUuid,
      ocr_run_id: ocrRunId,
      extraction_run_id: extractionRunId,
      engine: 'paddleocr',
      engine_version: '2.7.0',
      pages: [],
      lines: [],
      words: [],
      quality_flags: [],
      pipeline_trace: [],
      confidence: 0.9,
    });
    expect(srcErr).not.toBeNull();
    expect(srcErr!.message).toMatch(/foreign key|violates/i);

    // Case B: bad ocr_run_id
    const { error: ocrErr } = await db.from('document_artifacts').insert({
      id: crypto.randomUUID(),
      source_document_id: sourceDocId,
      ocr_run_id: nonExistentUuid,
      extraction_run_id: extractionRunId,
      engine: 'paddleocr',
      engine_version: '2.7.0',
      pages: [],
      lines: [],
      words: [],
      quality_flags: [],
      pipeline_trace: [],
      confidence: 0.9,
    });
    expect(ocrErr).not.toBeNull();
    expect(ocrErr!.message).toMatch(/foreign key|violates/i);

    // Case C: bad extraction_run_id
    const { error: extErr } = await db.from('document_artifacts').insert({
      id: crypto.randomUUID(),
      source_document_id: sourceDocId,
      ocr_run_id: ocrRunId,
      extraction_run_id: nonExistentUuid,
      engine: 'paddleocr',
      engine_version: '2.7.0',
      pages: [],
      lines: [],
      words: [],
      quality_flags: [],
      pipeline_trace: [],
      confidence: 0.9,
    });
    expect(extErr).not.toBeNull();
    expect(extErr!.message).toMatch(/foreign key|violates/i);
  });

  it('ocr_runs and extraction_runs FK rejections on parent-table targets', async () => {
    // Substrate-walkable: every FK constraint exercised in
    // rejection-path. The happy chain test exercises FK targets in
    // success-path; a future bug that dropped an FK constraint
    // would still let happy-path INSERTs succeed (no target means
    // no enforcement). This test catches such regressions on the
    // three FK targets not covered by the document_artifacts test
    // above.
    const db = adminClient();
    const nonExistentUuid = '00000000-0000-0000-0000-deadbeefcafe';

    // Case A: ocr_runs.source_document_id -> source_documents(id)
    const { error: ocrSrcErr } = await db.from('ocr_runs').insert({
      id: crypto.randomUUID(),
      source_document_id: nonExistentUuid,
      supersedes_ocr_run_id: null,
      created_by: ctx.caller.user_id,
    });
    expect(ocrSrcErr).not.toBeNull();
    expect(ocrSrcErr!.message).toMatch(/foreign key|violates/i);

    // Case B: extraction_runs.source_document_id -> source_documents(id)
    const { error: extSrcErr } = await db.from('extraction_runs').insert({
      id: crypto.randomUUID(),
      source_document_id: nonExistentUuid,
      ocr_run_id: ocrRunId,
      extraction_version: 'v-fk-src-test',
      created_by: ctx.caller.user_id,
    });
    expect(extSrcErr).not.toBeNull();
    expect(extSrcErr!.message).toMatch(/foreign key|violates/i);

    // Case C: extraction_runs.ocr_run_id -> ocr_runs(id)
    const { error: extOcrErr } = await db.from('extraction_runs').insert({
      id: crypto.randomUUID(),
      source_document_id: sourceDocId,
      ocr_run_id: nonExistentUuid,
      extraction_version: 'v-fk-ocr-test',
      created_by: ctx.caller.user_id,
    });
    expect(extOcrErr).not.toBeNull();
    expect(extOcrErr!.message).toMatch(/foreign key|violates/i);
  });

  it('extraction_runs UNIQUE rejects duplicate (source_document_id, ocr_run_id, extraction_version) tuple', async () => {
    // §9 Rule 2: immutable per (source_document_id, ocr_run_id,
    // extraction_version) tuple. A second INSERT with the same
    // triple fails the UNIQUE constraint.
    const db = adminClient();

    const { error } = await db.from('extraction_runs').insert({
      id: crypto.randomUUID(),
      source_document_id: sourceDocId,
      ocr_run_id: ocrRunId,
      extraction_version: 'v1', // same as beforeAll
      created_by: ctx.caller.user_id,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/unique|duplicate/i);
  });

  it('document_artifacts engine CHECK rejects reserved value (Layer 1)', async () => {
    // §5 ENUM defines 3 values; v1-active CHECK restricts to
    // paddleocr. Attempting to write tesseract is rejected by
    // the Layer 1 CHECK constraint.
    const db = adminClient();

    const { error } = await db.from('document_artifacts').insert({
      id: crypto.randomUUID(),
      source_document_id: sourceDocId,
      ocr_run_id: ocrRunId,
      extraction_run_id: extractionRunId,
      engine: 'tesseract',
      engine_version: '5.3.0',
      pages: [],
      lines: [],
      words: [],
      quality_flags: [],
      pipeline_trace: [],
      confidence: 0.9,
    });

    expect(error).not.toBeNull();
    // Stable regex: match the version-suffixed-active constraint
    // pattern, not the literal v1_active name (carry-forward from
    // chunk-2 implementation-notes constraint-name fragility lesson).
    expect(error!.message).toMatch(/document_artifacts_engine_v\d+_active/);
  });

  it('document_artifacts confidence CHECK rejects values outside [0,1] (both ends)', async () => {
    // CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)).
    // Exercise BOTH failure modes: below 0 AND above 1.
    const db = adminClient();

    // Below 0
    const { error: lowErr } = await db.from('document_artifacts').insert({
      id: crypto.randomUUID(),
      source_document_id: sourceDocId,
      ocr_run_id: ocrRunId,
      extraction_run_id: extractionRunId,
      engine: 'paddleocr',
      engine_version: '2.7.0',
      pages: [],
      lines: [],
      words: [],
      quality_flags: [],
      pipeline_trace: [],
      confidence: -0.1,
    });
    expect(lowErr).not.toBeNull();
    expect(lowErr!.message).toMatch(/document_artifacts_confidence_range/);

    // Above 1
    const { error: highErr } = await db.from('document_artifacts').insert({
      id: crypto.randomUUID(),
      source_document_id: sourceDocId,
      ocr_run_id: ocrRunId,
      extraction_run_id: extractionRunId,
      engine: 'paddleocr',
      engine_version: '2.7.0',
      pages: [],
      lines: [],
      words: [],
      quality_flags: [],
      pipeline_trace: [],
      confidence: 1.1,
    });
    expect(highErr).not.toBeNull();
    expect(highErr!.message).toMatch(/document_artifacts_confidence_range/);
  });

  it('ocr_runs immutability: UPDATE and DELETE both rejected by trigger', async () => {
    // Fresh ocr_run for this test (avoid disturbing other tests' rows).
    const db = adminClient();
    const freshRunId = crypto.randomUUID();
    await db.from('ocr_runs').insert({
      id: freshRunId,
      source_document_id: sourceDocId,
      supersedes_ocr_run_id: null,
      created_by: ctx.caller.user_id,
    });

    // UPDATE rejected
    const { error: updErr } = await db
      .from('ocr_runs')
      .update({ created_by: 'mutated' })
      .eq('id', freshRunId);
    expect(updErr).not.toBeNull();
    expect(updErr!.message).toMatch(/append-only|UPDATE and DELETE forbidden/i);

    // DELETE rejected
    const { error: delErr } = await db
      .from('ocr_runs')
      .delete()
      .eq('id', freshRunId);
    expect(delErr).not.toBeNull();
    expect(delErr!.message).toMatch(/append-only|UPDATE and DELETE forbidden/i);
  });

  it('extraction_runs immutability: UPDATE and DELETE both rejected by trigger', async () => {
    // Fresh extraction_run for this test.
    const db = adminClient();
    const freshExtRunId = crypto.randomUUID();
    await db.from('extraction_runs').insert({
      id: freshExtRunId,
      source_document_id: sourceDocId,
      ocr_run_id: ocrRunId,
      extraction_version: 'v2-immutability-test',
      created_by: ctx.caller.user_id,
    });

    const { error: updErr } = await db
      .from('extraction_runs')
      .update({ extraction_version: 'mutated' })
      .eq('id', freshExtRunId);
    expect(updErr).not.toBeNull();
    expect(updErr!.message).toMatch(/append-only|UPDATE and DELETE forbidden/i);

    const { error: delErr } = await db
      .from('extraction_runs')
      .delete()
      .eq('id', freshExtRunId);
    expect(delErr).not.toBeNull();
    expect(delErr!.message).toMatch(/append-only|UPDATE and DELETE forbidden/i);
  });

  it('document_artifacts immutability: UPDATE and DELETE both rejected by trigger', async () => {
    // Fresh chain for this test: need a new extraction_run because
    // the beforeAll one is already paired with extraction_version='v1'.
    const db = adminClient();
    const freshExtRunId = crypto.randomUUID();
    await db.from('extraction_runs').insert({
      id: freshExtRunId,
      source_document_id: sourceDocId,
      ocr_run_id: ocrRunId,
      extraction_version: 'v-art-immut-test',
      created_by: ctx.caller.user_id,
    });

    const freshArtId = crypto.randomUUID();
    await db.from('document_artifacts').insert({
      id: freshArtId,
      source_document_id: sourceDocId,
      ocr_run_id: ocrRunId,
      extraction_run_id: freshExtRunId,
      engine: 'paddleocr',
      engine_version: '2.7.0',
      pages: [],
      lines: [],
      words: [],
      quality_flags: [],
      pipeline_trace: [],
      confidence: 0.5,
    });

    const { error: updErr } = await db
      .from('document_artifacts')
      .update({ confidence: 0.99 })
      .eq('id', freshArtId);
    expect(updErr).not.toBeNull();
    expect(updErr!.message).toMatch(/append-only|UPDATE and DELETE forbidden/i);

    const { error: delErr } = await db
      .from('document_artifacts')
      .delete()
      .eq('id', freshArtId);
    expect(delErr).not.toBeNull();
    expect(delErr!.message).toMatch(/append-only|UPDATE and DELETE forbidden/i);
  });
});

describe('document_artifacts RLS through-parent (cross-org isolation)', () => {
  // Same EXISTS-subquery RLS pattern as chunk-3, but going through
  // source_documents (chunk 4) instead of document_cases (chunk 3).
  // Pattern shape was verified to work in chunk-3 implementation
  // (RLS carve-out option did NOT fire — see chunk-3 implementation
  // notes); chunk 4 inherits the working pattern.

  let ctx: ServiceContext;
  let apClient: SupabaseClient;
  let sourceDocId: string;
  let ocrRunId: string;
  let extractionRunId: string;
  let artifactId: string;

  beforeAll(async () => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });

    // Set up substrate in ORG_HOLDING via service-role.
    // Create parent ingest_batch (chunk 6.2a Sub-Q4 Step C; FK-anchor for source_document).
    const { ingest_batch_id } = await createIngestBatchForTest(SEED.ORG_HOLDING);

    const sourceResult = await documentPlatformService.createSourceDocument(
      {
        bytes: new Uint8Array([9, 10, 11, 12]),
        mime_type: 'application/pdf',
        original_filename: 'chunk-4-rls.pdf',
        ingest_channel: 'direct_upload',
        ingest_batch_id,
        received_at: new Date().toISOString(),
        org_id: SEED.ORG_HOLDING,
        created_by: ctx.caller.user_id,
      },
      ctx,
    );
    sourceDocId = sourceResult.id;

    const db = adminClient();
    ocrRunId = crypto.randomUUID();
    await db.from('ocr_runs').insert({
      id: ocrRunId,
      source_document_id: sourceDocId,
      supersedes_ocr_run_id: null,
      created_by: ctx.caller.user_id,
    });

    extractionRunId = crypto.randomUUID();
    await db.from('extraction_runs').insert({
      id: extractionRunId,
      source_document_id: sourceDocId,
      ocr_run_id: ocrRunId,
      extraction_version: 'v1',
      created_by: ctx.caller.user_id,
    });

    artifactId = crypto.randomUUID();
    await db.from('document_artifacts').insert({
      id: artifactId,
      source_document_id: sourceDocId,
      ocr_run_id: ocrRunId,
      extraction_run_id: extractionRunId,
      engine: 'paddleocr',
      engine_version: '2.7.0',
      pages: [],
      lines: [],
      words: [],
      quality_flags: [],
      pipeline_trace: [],
      confidence: 0.8,
    });

    // Non-service-role client as AP user. AP user has
    // ORG_REAL_ESTATE access only per seed (verified at chunk-3
    // implementation onset — see chunk-3 implementation notes).
    apClient = await userClientFor('ap@thebridge.local', 'DevSeed!ApSpec#1');
  });

  afterAll(async () => {
    // Clean audit_log rows from the beforeAll's source_document
    // creation (same rationale as describe 1).
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('cross-org user cannot SELECT document_artifacts rows for source_documents they do not have access to', async () => {
    const db = adminClient();
    const { data: adminRows } = await db
      .from('document_artifacts')
      .select('id')
      .eq('id', artifactId);
    expect(adminRows).toHaveLength(1);

    const { data: apRows, error } = await apClient
      .from('document_artifacts')
      .select('id')
      .eq('id', artifactId);
    expect(error).toBeNull();
    expect(apRows).toHaveLength(0);
  });

  it('cross-org user cannot INSERT document_artifacts for source_documents they do not have access to', async () => {
    const { error } = await apClient.from('document_artifacts').insert({
      id: crypto.randomUUID(),
      source_document_id: sourceDocId,           // source in ORG_HOLDING
      ocr_run_id: ocrRunId,                      // run in ORG_HOLDING
      extraction_run_id: extractionRunId,        // run in ORG_HOLDING
      engine: 'paddleocr',
      engine_version: '2.7.0',
      pages: [],
      lines: [],
      words: [],
      quality_flags: [],
      pipeline_trace: [],
      confidence: 0.7,
    });

    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/row-level security|policy|violates/i);
  });
});
