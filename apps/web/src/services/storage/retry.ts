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
//   - provider_unavailable         → throw STORAGE_OPERATION_FAILED
//                                    catchall (reserved per §7; v1
//                                    supabase_storage doesn't trigger;
//                                    post-v1 exception-queue routing
//                                    is owned by the calling layer,
//                                    not the retry helper).
//   - null (unclassified)          → throw STORAGE_OPERATION_FAILED
//                                    catchall (preserves originating
//                                    error in details per §7 framing).
//
// Retry params are NOT configurable in chunk 3 (v1 system-fixed per
// §8). Per-org configurability lives in
// `org_settings.storage_retry_*` columns reserved at v1 schema time
// per ADR-0010; activation flips post-v1. The options-parameter slot
// doesn't need to exist until configurability does
// (substrate-now-enforcement-later applied at the type level).
// withRetry signature stays minimal in chunk 3 and gains the options
// parameter when post-v1 configurability ships.

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
