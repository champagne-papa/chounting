// tests/fixtures/sidecar/mockSidecar.ts
//
// Phase 7 chunk 7.1b — Modal sidecar mock harness per brief §4 Task
// 7.1b.7. Used in chunk 7.1b unit + integration tests to inject
// failure modes without invoking a real Modal endpoint.
//
// Canonical fixtures location per chunk 7.1a (ε) banking (test
// utilities also route to apps/web/tests/ subtree at chunk 7.1b,
// extending the test-location convention to shared test infrastructure).

import { vi, type Mock } from 'vitest';
import type { OCRResponse } from '@/agent/orchestrator/extraction/sidecar/schemas';

export type MockSidecarFailureMode =
  | 'timeout'
  | 'hmac_mismatch'
  | 'malformed_response'
  | null;

export interface MockSidecarOptions {
  failureMode?: MockSidecarFailureMode;
  /** Override the artifact payload returned on success. */
  artifactOverride?: Partial<OCRResponse['artifact']>;
}

/**
 * Build a Mock function suitable for `vi.mock('@/agent/orchestrator/
 * extraction/sidecar/client', ...)` `invokeSidecar` replacement.
 *
 * Default (no failureMode): returns a synthetic valid OCRResponse.
 *
 * Failure modes:
 *   - 'timeout': throws ServiceError('PIPELINE_TRANSIENT_EXHAUSTED',
 *     'request timed out')
 *   - 'hmac_mismatch': throws ServiceError('PIPELINE_UNAVAILABLE',
 *     'sidecar returned 401 Unauthorized')
 *   - 'malformed_response': throws ServiceError('PIPELINE_UNAVAILABLE',
 *     'response Zod validation failed')
 */
export function createMockInvokeSidecar(opts: MockSidecarOptions = {}): Mock {
  return vi.fn().mockImplementation(async () => {
    const { ServiceError } = await import('@/services/errors/ServiceError');

    if (opts.failureMode === 'timeout') {
      throw new ServiceError(
        'PIPELINE_TRANSIENT_EXHAUSTED',
        '[mockSidecar] request timed out',
      );
    }
    if (opts.failureMode === 'hmac_mismatch') {
      throw new ServiceError(
        'PIPELINE_UNAVAILABLE',
        '[mockSidecar] sidecar returned 401 Unauthorized',
      );
    }
    if (opts.failureMode === 'malformed_response') {
      throw new ServiceError(
        'PIPELINE_UNAVAILABLE',
        '[mockSidecar] response Zod validation failed',
      );
    }

    const now = new Date().toISOString();
    const response: OCRResponse = {
      artifact: {
        engine: 'paddleocr',
        engine_version: 'paddleocr-2.7-pp-ocrv4-mock',
        pages: { count: 1 },
        lines: [
          {
            text: '[mock OCR line]',
            bbox: [0, 0, 100, 20],
            confidence: 0.95,
          },
        ],
        words: { count: 3 },
        quality_flags: [],
        confidence: 0.95,
        ...opts.artifactOverride,
      },
      ocr_run: {
        engine: 'paddleocr',
        engine_version: 'paddleocr-2.7-pp-ocrv4-mock',
        status: 'completed',
        started_at: now,
        completed_at: now,
      },
      extraction_run: {
        extraction_version: 'pp-ocrv4-v1',
        started_at: now,
        completed_at: now,
      },
      trace_id: 'mock-trace-id',
    };

    return response;
  });
}
