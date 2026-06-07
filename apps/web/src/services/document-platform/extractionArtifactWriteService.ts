// src/services/document-platform/extractionArtifactWriteService.ts
//
// Arc 2 T5 (agent→adminClient cleanup) — the Stage-2 OCR artifact
// write chain, hoisted VERBATIM from
// agent/orchestrator/extraction/stages/runOCR.ts per ADR-0020
// Appendix A (agent → services → db; Law 1).
//
// PLAIN TRANSPORT HOIST (Arc 2 brief Addendum A ratification): no
// withInvariants, no new audit emission — these are pipeline-internal
// best-effort system writes (created_by is the pipeline's system-actor
// string; org-scoping is gated upstream at Stage 0 dedup-by-hash, and
// none of the three tables carries an org_id column at this write
// surface — verified against db/types.ts; source_document_id is the
// FK spine). Sequential best-effort FK satisfaction chain per chunk
// 7.1b §1.2 (γ): each INSERT atomic, the composite chain NOT
// transactional; partial-write orphans tolerated until GC per
// ADR-0011 §9 immutability discipline. Error codes and messages
// byte-identical to pre-hoist ([runOCR] tags kept for log
// continuity).
//
// Input types mirror the generated DB Insert types (db/types.ts) —
// services may not import agent-layer types (ADR-0020, both
// directions of the boundary); the agent's sidecar-derived values
// were already assignable to these exact column types pre-hoist.

import { adminClient } from '@/db/adminClient';
import { ServiceError } from '@/services/errors/ServiceError';
import type { Database, Json } from '@/db/types';

type ArtifactEngine =
  Database['public']['Enums']['document_artifact_engine'];

/**
 * Structural mirror of the agent-layer PipelineStageRecord. A type
 * ALIAS, not an interface, deliberately: aliases of object literals
 * carry the implicit index signature that Json-column assignability
 * requires (TS 4.4 behavior); the agent's interface-typed records
 * assign into this structurally with no cast on either side.
 */
export type OcrTraceRecord = {
  stage_name: string;
  input_hash: string;
  output_hash: string;
  model: string | null;
  timestamp: string;
};

export interface OcrArtifactChainInput {
  source_document_id: string;
  /** System-actor string for created_by attribution (pipeline-supplied). */
  created_by: string;
  extraction_version: string;
  /**
   * Typed as the pre-hoist sidecar Zod boundary types them (engine:
   * z.string(); pages/lines/words: z.unknown()) — NOT as the DB
   * column types. The pre-hoist insert coerced these implicitly via
   * supabase's loose insert generics; the casts at the insert below
   * make that same coercion explicit without adding or removing
   * validation (the values are JSON-by-construction off the
   * Zod-validated sidecar wire).
   */
  engine: string;
  engine_version: string;
  pages: unknown;
  lines: unknown;
  words: unknown;
  quality_flags: string[];
  /** Accumulated pipeline_trace records (prior stages + run_ocr). */
  pipeline_trace: OcrTraceRecord[];
  confidence: number | null;
}

/**
 * Inserts the ocr_runs → extraction_runs → document_artifacts chain.
 * Throws ServiceError('PIPELINE_TRANSIENT_EXHAUSTED') on any failed
 * link, exactly as the pre-hoist agent-stage writes did; the caller's
 * withFailureClassification retry wrapper owns recovery.
 */
export async function insertOcrArtifactChain(
  input: OcrArtifactChainInput,
): Promise<void> {
  const db = adminClient();

  // (1) ocr_runs row.
  const { data: ocrRunRow, error: ocrRunErr } = await db
    .from('ocr_runs')
    .insert({
      source_document_id: input.source_document_id,
      created_by: input.created_by,
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
      extraction_version: input.extraction_version,
      created_by: input.created_by,
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
  // Casts per the OcrArtifactChainInput doc-comment: the pre-hoist
  // implicit coercion made explicit, nothing added or removed.
  const { error: artifactErr } = await db.from('document_artifacts').insert({
    source_document_id: input.source_document_id,
    ocr_run_id: ocrRunRow.id,
    extraction_run_id: extractionRunRow.id,
    engine: input.engine as ArtifactEngine,
    engine_version: input.engine_version,
    pages: input.pages as Json,
    lines: input.lines as Json,
    words: input.words as Json,
    quality_flags: input.quality_flags,
    pipeline_trace: input.pipeline_trace,
    confidence: input.confidence,
  });

  if (artifactErr) {
    throw new ServiceError(
      'PIPELINE_TRANSIENT_EXHAUSTED',
      `[runOCR] document_artifacts insert failed: ${artifactErr.message}`,
    );
  }
}
