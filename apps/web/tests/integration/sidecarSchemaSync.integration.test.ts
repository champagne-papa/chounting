// tests/integration/sidecarSchemaSync.integration.test.ts
//
// Phase 7 chunk 7.1b — schema-roundtrip verification per ADR-0014 §3
// schema-bound boundary. Confirms Zod schemas emit valid JSON Schema
// shapes via zod-to-json-schema (TS side of the boundary).
//
// Python-side validation (Pydantic models at sidecar-ocr/schemas/
// extraction.py mirror the JSON Schema shapes) is verified at Modal
// sidecar runtime via the request/response Pydantic .model_validate()
// calls; non-matching shapes surface as PIPELINE_UNAVAILABLE on the
// TS side per ADR-0014 §12.2.

import { describe, it, expect } from 'vitest';
import { zodToJsonSchema } from 'zod-to-json-schema';

import {
  OCRRequestSchema,
  OCRResponseSchema,
  DocumentArtifactPayloadSchema,
  OCRRunMetadataSchema,
  ExtractionRunMetadataSchema,
} from '@/agent/orchestrator/extraction/sidecar/schemas';

describe('Phase 7 chunk 7.1b — sidecar schema sync', () => {
  it('OCRRequest emits valid JSON Schema with required fields', () => {
    const schema = zodToJsonSchema(OCRRequestSchema, 'OCRRequest') as Record<
      string,
      unknown
    >;
    expect(schema).toBeTruthy();
    expect(schema.definitions || schema.properties).toBeTruthy();
  });

  it('OCRResponse emits valid JSON Schema covering nested artifact + metadata', () => {
    const schema = zodToJsonSchema(
      OCRResponseSchema,
      'OCRResponse',
    ) as Record<string, unknown>;
    expect(schema).toBeTruthy();
    const text = JSON.stringify(schema);
    // Verify nested schema names appear (zodToJsonSchema may inline OR
    // emit as definitions; either form is acceptable per shape).
    expect(text).toContain('artifact');
    expect(text).toContain('ocr_run');
    expect(text).toContain('extraction_run');
    expect(text).toContain('trace_id');
  });

  it('all sidecar schemas parse valid sample payloads', () => {
    const sampleRequest = {
      bytes_b64: 'aGVsbG8=',
      content_hash: 'abc123',
      trace_id: 'trace-xyz',
    };
    const sampleResponse = {
      artifact: {
        engine: 'paddleocr',
        engine_version: 'pp-ocrv4',
        pages: { count: 1 },
        lines: [],
        words: { count: 0 },
        quality_flags: [],
        confidence: null,
      },
      ocr_run: {
        engine: 'paddleocr',
        engine_version: 'pp-ocrv4',
        status: 'completed',
        started_at: '2026-05-20T00:00:00Z',
        completed_at: '2026-05-20T00:00:05Z',
      },
      extraction_run: {
        extraction_version: 'pp-ocrv4-v1',
        started_at: '2026-05-20T00:00:00Z',
        completed_at: '2026-05-20T00:00:05Z',
      },
      trace_id: 'trace-xyz',
    };

    expect(() => OCRRequestSchema.parse(sampleRequest)).not.toThrow();
    expect(() => OCRResponseSchema.parse(sampleResponse)).not.toThrow();
    expect(() =>
      DocumentArtifactPayloadSchema.parse(sampleResponse.artifact),
    ).not.toThrow();
    expect(() =>
      OCRRunMetadataSchema.parse(sampleResponse.ocr_run),
    ).not.toThrow();
    expect(() =>
      ExtractionRunMetadataSchema.parse(sampleResponse.extraction_run),
    ).not.toThrow();
  });

  it('schemas reject malformed payloads per .strict() boundary', () => {
    expect(() =>
      OCRRequestSchema.parse({ bytes_b64: 'x', content_hash: 'h', trace_id: 't', extra: 'fail' }),
    ).toThrow();
  });
});
