// src/agent/orchestrator/extraction/stages/runOCR.ts
//
// Phase 7 chunk 7.1b — Stage 2 OCR active wiring per ADR-0014 §2
// (PaddleOCR v1) + §3 (Modal sidecar topology) + §1 canonical
// stage_name 'run_ocr' (pipeline_trace record shape per §13).
//
// Replaces chunk 7.1a runOCR.stub.ts. Function signature preserved:
// `runOCR(input: RunOCRInput): Promise<RunOCROutput>` so the
// orchestrator Stage 2 invocation site at ingestDocument.ts shifts
// only its import path + adds withFailureClassification wrap.
//
// Per chunk 7.1b §1.2 (δ) banking resolution: document_artifacts
// INSERT activates here. Sequential best-effort FK satisfaction chain:
//   ocr_runs → extraction_runs → document_artifacts (with pipeline_trace
//   JSONB column populated with prior_trace + this stage's trace_record).
// Partial-write orphans tolerated per ADR-0011 §9 immutability
// discipline; orphan-tolerance pattern banked at chunk 7.1b §1.2 (γ).
//
// Per-stage wall-clock budget: ~30s per ADR-0014 §12.1 amendment
// 2026-05-20 (Stage 2 exception per Modal cold-start substrate;
// see ADR-0014 §12.1). Composes with 10s per-request timeout in
// invokeSidecar + up to 3 retries with exponential backoff.

import { adminClient } from '@/db/adminClient';
import { ServiceError } from '@/services/errors/ServiceError';
import { invokeSidecar } from '../sidecar/client';
import type {
  DocumentArtifactRow,
  PipelineStageRecord,
} from '../types';
import type { SystemActorServiceContext } from '@/services/middleware/serviceContext';
import crypto from 'crypto';

export interface RunOCRInput {
  source_document_id: string;
  bytes: Uint8Array;
  content_hash: string;
  trace_id: string;
  /** pipeline_trace records accumulated from prior Stages 0+1. */
  prior_trace: PipelineStageRecord[];
}

export interface RunOCROutput {
  artifact: DocumentArtifactRow;
  trace_record: PipelineStageRecord;
}

const SYSTEM_ACTOR_CREATED_BY = 'pipeline_orchestrator';

export async function runOCR(input: RunOCRInput): Promise<RunOCROutput> {
  const ctx: SystemActorServiceContext = {
    trace_id: input.trace_id,
    caller: { user_id: null, system_actor: SYSTEM_ACTOR_CREATED_BY },
    // org_id derived via source_documents read inside invokeSidecar
    // is not strictly required for the storage HMAC client; ctx.org_id
    // is set to the empty string at this layer since the orchestrator
    // already gated org_id at Stage 0 dedup-by-hash.
    org_id: '',
  };

  const response = await invokeSidecar({
    bytes: input.bytes,
    content_hash: input.content_hash,
    ctx,
  });

  const timestamp = new Date().toISOString();
  const trace_record: PipelineStageRecord = {
    stage_name: 'run_ocr',
    input_hash: input.content_hash,
    output_hash: crypto
      .createHash('sha256')
      .update(JSON.stringify(response.artifact))
      .digest('hex'),
    model: 'paddleocr-2.7-pp-ocrv4',
    timestamp,
  };

  const accumulated_trace = [...input.prior_trace, trace_record];

  // Sequential best-effort FK satisfaction chain per chunk 7.1b §1.2
  // (γ) orphan-tolerance pattern. Each INSERT is atomic; the composite
  // chain is not transactional. Partial-write orphans tolerated until
  // GC per ADR-0011 §9 immutability discipline.
  const db = adminClient();

  // (1) ocr_runs row.
  const { data: ocrRunRow, error: ocrRunErr } = await db
    .from('ocr_runs')
    .insert({
      source_document_id: input.source_document_id,
      created_by: SYSTEM_ACTOR_CREATED_BY,
    })
    .select('id')
    .single();

  if (ocrRunErr || !ocrRunRow) {
    throw new ServiceError(
      'PIPELINE_TRANSIENT_EXHAUSTED',
      `[runOCR] ocr_runs insert failed: ${ocrRunErr?.message ?? 'no row returned'}`,
    );
  }

  // (2) extraction_runs row referencing ocr_runs.id.
  const { data: extractionRunRow, error: extractionRunErr } = await db
    .from('extraction_runs')
    .insert({
      source_document_id: input.source_document_id,
      ocr_run_id: ocrRunRow.id,
      extraction_version: response.extraction_run.extraction_version,
      created_by: SYSTEM_ACTOR_CREATED_BY,
    })
    .select('id')
    .single();

  if (extractionRunErr || !extractionRunRow) {
    throw new ServiceError(
      'PIPELINE_TRANSIENT_EXHAUSTED',
      `[runOCR] extraction_runs insert failed: ${extractionRunErr?.message ?? 'no row returned'}`,
    );
  }

  // (3) document_artifacts row with pipeline_trace JSONB populated.
  const { error: artifactErr } = await db.from('document_artifacts').insert({
    source_document_id: input.source_document_id,
    ocr_run_id: ocrRunRow.id,
    extraction_run_id: extractionRunRow.id,
    engine: response.artifact.engine,
    engine_version: response.artifact.engine_version,
    pages: response.artifact.pages,
    lines: response.artifact.lines,
    words: response.artifact.words,
    quality_flags: response.artifact.quality_flags,
    pipeline_trace: accumulated_trace,
    confidence: response.artifact.confidence,
  });

  if (artifactErr) {
    throw new ServiceError(
      'PIPELINE_TRANSIENT_EXHAUSTED',
      `[runOCR] document_artifacts insert failed: ${artifactErr.message}`,
    );
  }

  const artifact: DocumentArtifactRow = {
    engine: response.artifact.engine,
    engine_version: response.artifact.engine_version,
    pages: response.artifact.pages,
    lines: response.artifact.lines,
    words: response.artifact.words,
    quality_flags: response.artifact.quality_flags,
    pipeline_trace: accumulated_trace,
    confidence: response.artifact.confidence,
  };

  return { artifact, trace_record };
}
