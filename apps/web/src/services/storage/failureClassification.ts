// src/services/storage/failureClassification.ts
// Failure classification for storage operations per ADR-0013 §7
// three-way matrix.
//
// The classifier inspects an error and assigns it to one of three
// categories:
//   - transient                — retry per ADR-0013 §8
//   - permanent_malformed      — throw with explicit code
//                                (STORAGE_KEY_MALFORMED or
//                                INTEGRITY_VERIFY_FAILED per §7
//                                verbatim)
//   - provider_unavailable     — reserved per §7; v1 supabase_storage
//                                does not trigger this category
//                                (platform's own RLS-scoped storage).
//                                Post-v1 reserved-provider activation
//                                routes here with the
//                                `resolve_provider_unavailable`
//                                exception-queue action per ADR-0010
//                                discipline.
//
// Unclassifiable errors return null. Callers (withRetry) treat null
// as fail-fast with STORAGE_OPERATION_FAILED catchall, preserving the
// originating error in ServiceError.details. Per ADR-0013 §7's
// framing: "the originating error is preserved by the caller for
// retry-then-classify" — the classifier does not wrap; it just
// classifies. Wrapping happens at the throw site.
//
// v1 implementation focuses on the supabase_storage active provider's
// error shapes (StorageApiError-shaped objects with `status`; fetch
// network errors; Node's connection-error codes). The three-way matrix
// is shared across all providers per §7; future providers extend the
// classification patterns in their activation briefs.

import { ServiceError } from '@/services/errors/ServiceError';

export type FailureClassification =
  | { kind: 'transient' }
  | {
      kind: 'permanent_malformed';
      code: 'STORAGE_KEY_MALFORMED' | 'INTEGRITY_VERIFY_FAILED';
    }
  | { kind: 'provider_unavailable' };

// Inspect an error and classify per ADR-0013 §7. Returns null for
// errors that don't match any known pattern; callers treat null as
// unclassified-fail-fast.
export function classifyStorageFailure(
  err: unknown,
): FailureClassification | null {
  // ServiceError pass-through: if a downstream layer already classified
  // and threw a typed ServiceError (e.g., verifyHash throws
  // INTEGRITY_VERIFY_FAILED on hash mismatch post-write), preserve the
  // classification rather than re-pattern-matching the message.
  if (err instanceof ServiceError) {
    if (err.code === 'INTEGRITY_VERIFY_FAILED') {
      return {
        kind: 'permanent_malformed',
        code: 'INTEGRITY_VERIFY_FAILED',
      };
    }
    if (err.code === 'STORAGE_KEY_MALFORMED') {
      return {
        kind: 'permanent_malformed',
        code: 'STORAGE_KEY_MALFORMED',
      };
    }
    // Any other ServiceError code (including
    // STORAGE_PROVIDER_TRANSIENT_EXHAUSTED — already exhausted, do not
    // re-retry) is treated as unclassified at this layer. The caller
    // catchall handles them.
    return null;
  }

  // Guard primitives and null/undefined before property access. The
  // discriminated-union output already covers "no pattern matched"
  // via null return; primitives short-circuit here cleanly.
  if (err === null || typeof err !== 'object') {
    return null;
  }

  // Plain object / Error inspection. Use a permissive accessor shape
  // since storage SDKs and fetch errors carry varied surface fields.
  const e = err as {
    status?: number;
    code?: string;
    name?: string;
  };

  // HTTP status code patterns (StorageApiError, fetch Response errors).
  if (typeof e.status === 'number') {
    // 5xx server errors → transient.
    if (e.status >= 500 && e.status < 600) {
      return { kind: 'transient' };
    }
    // Auth errors → provider_unavailable. Reserved per §7; v1
    // supabase_storage shouldn't see these because we use service-role.
    // Defensive classification for future provider activation.
    if (e.status === 401 || e.status === 403) {
      return { kind: 'provider_unavailable' };
    }
    // Request timeout (408) and rate-limited (429) → transient. §7
    // explicitly names "throttling responses with Retry-After headers"
    // as transient.
    if (e.status === 408 || e.status === 429) {
      return { kind: 'transient' };
    }
    // Other 4xx → permanent_malformed. §7 names "malformed storage_key,
    // illegal characters, path-too-long" as permanent malformed; 4xx
    // outside auth/timeout/rate is the closest match.
    if (e.status >= 400 && e.status < 500) {
      return {
        kind: 'permanent_malformed',
        code: 'STORAGE_KEY_MALFORMED',
      };
    }
  }

  // Node.js connection error codes → transient. §7 names "network
  // timeout, brief connection loss" verbatim.
  if (typeof e.code === 'string') {
    if (
      e.code === 'ETIMEDOUT' ||
      e.code === 'ECONNRESET' ||
      e.code === 'ECONNREFUSED' ||
      e.code === 'EAI_AGAIN'
    ) {
      return { kind: 'transient' };
    }
  }

  // AbortError (likely a network timeout signaled via AbortController).
  if (e.name === 'AbortError') {
    return { kind: 'transient' };
  }

  // No pattern matched.
  return null;
}
