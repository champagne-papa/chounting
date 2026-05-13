import { z } from 'zod';
import { TimestamptzString } from '@/shared/schemas/common.schema';

// Layer 2 boundary: v1-active subsets only.
// Reserved engine values defined in DB ENUM but rejected here.
// Chunk 4 ships substrate-only (no writer service); these schemas
// are read-shapes for future consumers (Phase 7 writer + chunks
// 5+ readers).

export const DocumentArtifactEngineSchema = z.enum(['paddleocr']);
export type DocumentArtifactEngine = z.infer<typeof DocumentArtifactEngineSchema>;

// ocr_runs read-shape. supersedes_ocr_run_id is nullable per §9
// Rule 1 (first row in a chain has no predecessor).
export const OcrRunSchema = z.object({
  id: z.string().uuid(),
  source_document_id: z.string().uuid(),
  supersedes_ocr_run_id: z.string().uuid().nullable(),
  created_at: TimestamptzString,
  created_by: z.string(),
});
export type OcrRun = z.infer<typeof OcrRunSchema>;

// extraction_runs read-shape.
export const ExtractionRunSchema = z.object({
  id: z.string().uuid(),
  source_document_id: z.string().uuid(),
  ocr_run_id: z.string().uuid(),
  extraction_version: z.string(),
  created_at: TimestamptzString,
  created_by: z.string(),
});
export type ExtractionRun = z.infer<typeof ExtractionRunSchema>;

// document_artifacts read-shape per ADR-0011 §5 (13 columns).
// Notably no created_by — artifact rows are always-pipeline-
// written; actor identity lives at audit_log Phase 7 writes.
//
// quality_flags is text[] per §5 line 429 (NOT jsonb).
// pages/lines/words/pipeline_trace are jsonb per §5; content
// shape is owned by Phase 7 / ADR-0014 §1 (PipelineStageRecord
// for pipeline_trace). At chunk-4 read-time we accept any jsonb
// shape (z.unknown() per element); Phase 7 will narrow when the
// writer ships.
//
// confidence is nullable with [0,1] range; ALTER NOT NULL when
// Phase 7's writer populate-discipline is established.
export const DocumentArtifactSchema = z.object({
  id: z.string().uuid(),
  source_document_id: z.string().uuid(),
  ocr_run_id: z.string().uuid(),
  extraction_run_id: z.string().uuid(),
  engine: DocumentArtifactEngineSchema,
  engine_version: z.string(),
  pages: z.unknown(),
  lines: z.unknown(),
  words: z.unknown(),
  quality_flags: z.array(z.string()),
  pipeline_trace: z.unknown(),
  confidence: z.number().min(0).max(1).nullable(),
  created_at: TimestamptzString,
});
export type DocumentArtifact = z.infer<typeof DocumentArtifactSchema>;
