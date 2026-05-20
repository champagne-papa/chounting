// src/agent/orchestrator/extraction/stages/runOCR.stub.ts
//
// Stage 2 — OCR STUB. Returns synthetic typed DocumentArtifactRow at
// chunk 7.1a; chunk 7.1b renames to `runOCR.ts` and replaces with
// active Modal sidecar wiring per ADR-0014 §2-3.
//
// Per chunk 7.1 brief Task 7.1a.5: synthetic engine='paddleocr',
// engine_version='stub-v1', single placeholder line, quality_flags=['stub'].
//
// **In-memory only at chunk 7.1a.** The `document_artifacts` table
// requires NOT NULL FKs to `ocr_runs.id` + `extraction_runs.id`
// (migration 20240146000000), which brief Task 7.1a.5 does not
// enumerate. Persistence to `document_artifacts.pipeline_trace`
// activates at chunk 7.1b when the Modal sidecar produces real
// ocr_runs + extraction_runs records. Banked at chunk 7.1a §1.2
// divergence absorption (δ); pipeline_trace verification at chunk
// 7.1a is in-memory via IngestDocumentOutput.pipeline_trace shape.

import type {
  DocumentArtifactRow,
  PipelineStageRecord,
} from '../types';
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

export async function runOCR(input: RunOCRInput): Promise<RunOCROutput> {
  const timestamp = new Date().toISOString();

  // Synthetic placeholder content per brief Task 7.1a.5.
  const syntheticArtifact: DocumentArtifactRow = {
    engine: 'paddleocr',
    engine_version: 'stub-v1',
    pages: { count: 1, dimensions: [{ width: 612, height: 792 }] },
    lines: [{ text: '[stub line]', bbox: [0, 0, 100, 20], confidence: 0.0 }],
    words: { count: 2 },
    quality_flags: ['stub'],
    pipeline_trace: [], // populated below
    confidence: null,
  };

  const trace_record: PipelineStageRecord = {
    stage_name: 'ocr_stub',
    input_hash: input.content_hash,
    output_hash: crypto
      .createHash('sha256')
      .update(JSON.stringify(syntheticArtifact))
      .digest('hex'),
    model: 'paddleocr-stub',
    timestamp,
  };

  // Accumulated trace flows through in-memory only at chunk 7.1a.
  const accumulated_trace = [...input.prior_trace, trace_record];

  return {
    artifact: { ...syntheticArtifact, pipeline_trace: accumulated_trace },
    trace_record,
  };
}
