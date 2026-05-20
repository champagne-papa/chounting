// src/agent/orchestrator/extraction/sidecar/schemas.ts
//
// Phase 7 chunk 7.1b — Zod schemas for the TS↔Python boundary per
// ADR-0014 §3 schema-bound boundary discipline. These schemas are
// source of truth; Pydantic models at sidecar-ocr/schemas/extraction.py
// mirror these shapes.
//
// Synchronization: the apps/web/scripts/sync-sidecar-schemas.ts script
// emits JSON Schema files at sidecar-ocr/schemas/json/ derived from
// these Zod schemas (manual sync at v1 per chunk 7.1 brief partial-
// information value pick; automated codegen post-v1).
//
// Schema mismatch at runtime surfaces as ServiceError(PIPELINE_UNAVAILABLE)
// per ADR-0014 §12.2.

import { z } from 'zod';

/**
 * Request payload sent from TS-side `invokeSidecar` to Modal sidecar's
 * `run_ocr` endpoint. bytes_b64 is base64-encoded raw document bytes;
 * content_hash is SHA-256 from Stage 1 byte fetch; trace_id propagates
 * per ADR-0014 §3 X-Trace-Id discipline.
 */
export const OCRRequestSchema = z
  .object({
    bytes_b64: z.string(),
    content_hash: z.string(),
    trace_id: z.string(),
  })
  .strict();

export type OCRRequest = z.infer<typeof OCRRequestSchema>;

/**
 * Document artifact payload — mirrors `document_artifacts` schema
 * columns per ADR-0011 §5 + migration 20240146000000.
 */
export const DocumentArtifactPayloadSchema = z
  .object({
    engine: z.string(),
    engine_version: z.string(),
    pages: z.unknown(),
    lines: z.unknown(),
    words: z.unknown(),
    quality_flags: z.array(z.string()),
    confidence: z.number().nullable(),
  })
  .strict();

export type DocumentArtifactPayload = z.infer<
  typeof DocumentArtifactPayloadSchema
>;

/**
 * Metadata for the `ocr_runs` row that TS-side runOCR.ts persists
 * BEFORE the document_artifacts row INSERT per FK satisfaction
 * sequence (chunk 7.1b Task 7.1b.6).
 */
export const OCRRunMetadataSchema = z
  .object({
    engine: z.string(),
    engine_version: z.string(),
    status: z.string(),
    started_at: z.string(),
    completed_at: z.string(),
  })
  .strict();

export type OCRRunMetadata = z.infer<typeof OCRRunMetadataSchema>;

/**
 * Metadata for the `extraction_runs` row that TS-side runOCR.ts
 * persists referencing the ocr_runs.id captured above.
 */
export const ExtractionRunMetadataSchema = z
  .object({
    extraction_version: z.string(),
    started_at: z.string(),
    completed_at: z.string(),
  })
  .strict();

export type ExtractionRunMetadata = z.infer<
  typeof ExtractionRunMetadataSchema
>;

/**
 * Response from Modal sidecar's `run_ocr` endpoint. TS-side validates
 * against this schema; non-validating response throws
 * ServiceError(PIPELINE_UNAVAILABLE) per ADR-0014 §12.2 (schema
 * mismatch class).
 */
export const OCRResponseSchema = z
  .object({
    artifact: DocumentArtifactPayloadSchema,
    ocr_run: OCRRunMetadataSchema,
    extraction_run: ExtractionRunMetadataSchema,
    trace_id: z.string(),
  })
  .strict();

export type OCRResponse = z.infer<typeof OCRResponseSchema>;
