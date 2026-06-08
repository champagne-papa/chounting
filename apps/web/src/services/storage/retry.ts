// src/services/storage/retry.ts
// Retry helper for storage operations per ADR-0013 §8.
//
// v1 retry parameters (system-fixed per §8 verbatim):
//   - Max attempts:       3 (the original attempt plus 2 retries)
//   - Base delay:         500ms
//   - Exponential factor: 2x   (delays: 500, 1000, 2000 ms)
//   - Backoff jitter:     ±20% per attempt
//   - Total budget:       ~3.5 seconds wall-clock
//
// Disposition matrix:
//   - transient classification     → retry until budget exhausted;
//                                    on exhaustion throw
//                                    STORAGE_PROVIDER_TRANSIENT_EXHAUSTED
//                                    per §8 verbatim.
//   - permanent_malformed          → throw with classifier-provided
//                                    code (STORAGE_KEY_MALFORMED or
//                                    INTEGRITY_VERIFY_FAILED) per §7
//                                    verbatim.
//   - provider_unavailable         → throw STORAGE_PROVIDER_UNAVAILABLE
//                                    (typed, no retry; Charter B real-flow
//                                    D-5 edit a — was the
//                                    STORAGE_OPERATION_FAILED catchall).
//                                    byteFetch maps it to PIPELINE_UNAVAILABLE
//                                    (edit b); the exception-queue routing
//                                    surface stays deferred to Phase-7
//                                    (decision #2), owned by the calling
//                                    layer, not the retry helper.
//   - null (unclassified)          → throw STORAGE_OPERATION_FAILED
//                                    catchall (preserves originating
//                                    error in details per §7 framing).
//
// Retry params are NOT configurable (system-fixed per §8). Per-org
// configurability is reserved for `org_settings.storage_retry_*`, but
// those columns are NOT yet on disk — Charter B real-flow D-1
// (add-consumed-only) deferred them as an inert sub-slice (nothing reads
// per-org retry config in v1). They land with their consumer. The
// options-parameter slot doesn't need to exist until configurability does;
// withRetry stays minimal and gains it then.

import { ServiceError } from '@/services/errors/ServiceError';
import { classifyStorageFailure } from './failureClassification';

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 500;
const EXPONENTIAL_FACTOR = 2;
const JITTER_PCT = 0.2;

// Apply ±JITTER_PCT randomness to a base delay. Avoids thundering-herd
// on shared retry windows per §8.
function jitteredDelay(baseDelay: number): number {
  const jitter = (Math.random() * 2 - 1) * JITTER_PCT * baseDelay;
  return Math.max(0, baseDelay + jitter);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      const classification = classifyStorageFailure(err);

      if (classification === null) {
        // Unclassified failure — fail fast with catchall, preserving
        // the originating error in details.
        throw new ServiceError(
          'STORAGE_OPERATION_FAILED',
          err instanceof Error ? err.message : String(err),
          err,
        );
      }

      if (classification.kind === 'permanent_malformed') {
        // Throw with the classifier-provided code; do not retry.
        throw new ServiceError(
          classification.code,
          err instanceof Error ? err.message : String(err),
          err,
        );
      }

      if (classification.kind === 'provider_unavailable') {
        // Charter B real-flow D-5 (wire contract, edit a): propagate the TYPED
        // provider-unavailable code so the calling layer (byteFetch, edit b)
        // can map it to PIPELINE_UNAVAILABLE. No retry — a 401/403/404 won't
        // recover by retrying. The exception-queue ROUTING surface stays
        // deferred to Phase-7 (decision #2 = option 1); only honest
        // classification lands here (this was the layer-1 mask: the value used
        // to flatten into the STORAGE_OPERATION_FAILED catchall).
        throw new ServiceError(
          'STORAGE_PROVIDER_UNAVAILABLE',
          err instanceof Error ? err.message : String(err),
          err,
        );
      }

      // classification.kind === 'transient': retry if budget remains.
      if (attempt < MAX_ATTEMPTS) {
        const baseDelay =
          BASE_DELAY_MS * Math.pow(EXPONENTIAL_FACTOR, attempt - 1);
        await sleep(jitteredDelay(baseDelay));
      }
    }
  }

  // Budget exhausted on transient errors. Per §8 verbatim:
  // STORAGE_PROVIDER_TRANSIENT_EXHAUSTED.
  throw new ServiceError(
    'STORAGE_PROVIDER_TRANSIENT_EXHAUSTED',
    lastError instanceof Error ? lastError.message : String(lastError),
    lastError,
  );
}
