// src/agent/orchestrator/extraction/sidecar/client.ts
//
// Phase 7 chunk 7.1b — Modal sidecar HTTP client per ADR-0014 §3.
//
// Invokes the deployed Modal sidecar `run_ocr` endpoint with HMAC-SHA256
// authentication + Zod-validated response. Failure classification per
// ADR-0014 §12 surfaces typed ServiceError for the orchestrator's
// withFailureClassification wrapper to handle.
//
// Per-request timeout: 10s via AbortController per chunk 7.1 brief §4
// Task 7.1b.5 partial-information value pick.
//
// HMAC discipline: signature computed over canonical JSON of the content
// fields ({bytes_b64, content_hash, trace_id} with sorted keys, no
// whitespace). Sent in request body under `__hmac_signature` key per
// chunk 7.1b §1.2 (ζ) divergence: Modal @modal.web_endpoint simplification
// ships JSON-embedded HMAC at v1; ADR-0014 §3 X-Auth-HMAC header form
// is post-v1 amendment.

import crypto from 'crypto';
import { ServiceError } from '@/services/errors/ServiceError';
import type { SystemActorServiceContext } from '@/services/middleware/serviceContext';
import { OCRResponseSchema, type OCRResponse } from './schemas';

const PER_REQUEST_TIMEOUT_MS = 60_000;

export interface InvokeSidecarInput {
  bytes: Uint8Array;
  content_hash: string;
  ctx: SystemActorServiceContext;
}

/**
 * Invoke the Modal OCR sidecar `run_ocr` endpoint. Returns the
 * validated OCRResponse on success; throws typed ServiceError per
 * ADR-0014 §12 failure classification on failure.
 */
export async function invokeSidecar(
  input: InvokeSidecarInput,
): Promise<OCRResponse> {
  const secret = process.env.MODAL_OCR_HMAC_SECRET;
  const endpoint = process.env.MODAL_OCR_SIDECAR_URL;

  if (!secret) {
    throw new ServiceError(
      'PIPELINE_UNAVAILABLE',
      '[invokeSidecar] MODAL_OCR_HMAC_SECRET environment variable missing',
    );
  }

  if (!endpoint) {
    throw new ServiceError(
      'PIPELINE_UNAVAILABLE',
      '[invokeSidecar] MODAL_OCR_SIDECAR_URL environment variable missing',
    );
  }

  const bytes_b64 = Buffer.from(input.bytes).toString('base64');
  const signingBody = canonicalSigningBody({
    bytes_b64,
    content_hash: input.content_hash,
    trace_id: input.ctx.trace_id,
  });
  const signature = computeHmacSha256(signingBody, secret);

  const requestBody = {
    bytes_b64,
    content_hash: input.content_hash,
    trace_id: input.ctx.trace_id,
    __hmac_signature: signature,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PER_REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Trace-Id': input.ctx.trace_id,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      // Per ADR-0014 §12.1 transient retryable: Modal cold-start
      // timeout. Surface for retry budget consumption.
      throw new ServiceError(
        'PIPELINE_TRANSIENT_EXHAUSTED',
        `[invokeSidecar] request timed out after ${PER_REQUEST_TIMEOUT_MS}ms`,
      );
    }
    // Network unreachable / DNS failure / TLS error: persistent
    // unavailable per ADR-0014 §12.2 (endpoint not configured).
    const message = err instanceof Error ? err.message : String(err);
    throw new ServiceError(
      'PIPELINE_UNAVAILABLE',
      `[invokeSidecar] fetch failed: ${message}`,
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    // 401 = HMAC mismatch (persistent unavailable per ADR-0014 §12.2);
    // 503 = secret missing on sidecar (persistent unavailable);
    // 5xx other = transient retryable;
    // 4xx other = persistent unavailable (request shape malformed at
    // boundary — schema mismatch per ADR-0014 §12.2).
    const statusText = `${response.status} ${response.statusText}`;
    if (response.status >= 500) {
      throw new ServiceError(
        'PIPELINE_TRANSIENT_EXHAUSTED',
        `[invokeSidecar] sidecar returned ${statusText}`,
      );
    }
    throw new ServiceError(
      'PIPELINE_UNAVAILABLE',
      `[invokeSidecar] sidecar returned ${statusText}`,
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = await response.json();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new ServiceError(
      'PIPELINE_UNAVAILABLE',
      `[invokeSidecar] response JSON parse failed: ${message}`,
    );
  }

  const parseResult = OCRResponseSchema.safeParse(parsedJson);
  if (!parseResult.success) {
    // Schema mismatch per ADR-0014 §12.2 persistent unavailable.
    throw new ServiceError(
      'PIPELINE_UNAVAILABLE',
      `[invokeSidecar] response Zod validation failed: ${parseResult.error.message}`,
    );
  }

  return parseResult.data;
}

function canonicalSigningBody(payload: {
  bytes_b64: string;
  content_hash: string;
  trace_id: string;
}): string {
  // Canonical JSON: keys sorted lexicographically, no whitespace.
  // Matches sidecar-ocr/main.py _canonical_signing_body.
  return JSON.stringify({
    bytes_b64: payload.bytes_b64,
    content_hash: payload.content_hash,
    trace_id: payload.trace_id,
  });
}

function computeHmacSha256(body: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}
