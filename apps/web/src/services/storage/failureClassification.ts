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
//   - provider_unavailable     — v1 supabase_storage does not trigger
//                                this category (platform's own RLS-scoped
//                                storage). sharepoint_drive IS the first
//                                provider that classifies into it
//                                (Charter B (a) Task 4: Graph 401/403/404
//                                → provider_unavailable).
//
// CALLER-SIDE ROUTING IS DEFERRED to the real-flow arc (the arc that
// makes the provider reachable — selection plumbing + Graph config),
// NOT built here. Two substrate gaps make it net-new design, not a
// drop-in (both verified on disk against migration 20240148):
//   (1) No provider_unavailable-class exception_reason exists (the enum
//       carries manual_route / low_confidence_classification /
//       unknown_document_type / unmatched_router_candidate /
//       multi_candidate_ambiguity / invariant_violation [v1-active] +
//       wrong_entity_exception / drift_detected [reserved]). Routing
//       needs a new value (ALTER TYPE ADD VALUE +
//       exception_reason_chunk_6_active → _chunk_7_active broaden).
//   (2) The existing enqueue_exception_with_audit RPC atomically
//       transitions the document_case classified|matched → needs_review
//       and raises check_violation otherwise — it is purpose-built for
//       the classification/matching pipeline's needs_review entry. A
//       storage-read failure (fetch/verifyIntegrity at arbitrary
//       lifecycle points) will generally NOT satisfy that state
//       coupling, so routing needs a distinct enqueue path or a
//       documented state-coupling exemption — a design decision, not
//       just an enum add.
// (NOTE: an earlier draft of this comment named a `resolve_provider_
// unavailable` resolution_action — that value exists nowhere in
// substrate; it was a text-grain name only, removed to avoid implying
// an admission that does not exist. resolution_action is the
// human-resolution side anyway; enqueue keys on exception_reason.)
// The classifier classifying provider_unavailable (below) is harmless
// and correct — it is the half that belongs with the provider; only the
// routing + its substrate defer.
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
    statusCode?: number;
    code?: string;
    name?: string;
  };

  // Microsoft Graph error shape (GraphError): carries `statusCode`
  // (number) — distinct from the supabase `status` field below, so the
  // two providers never collide in this context-free classifier. Graph
  // is the first provider to actually exercise provider_unavailable.
  // (Charter B (a) Task 4; spec §4.)
  if (typeof e.statusCode === 'number') {
    // 5xx (incl. 507 Insufficient Storage) → transient.
    if (e.statusCode >= 500 && e.statusCode < 600) {
      return { kind: 'transient' };
    }
    // Throttling (429, Retry-After), request timeout (408), and Locked
    // (423, e.g. file checked out / transient lock) → transient.
    if (e.statusCode === 429 || e.statusCode === 408 || e.statusCode === 423) {
      return { kind: 'transient' };
    }
    // Auth revoked / consent removed → provider_unavailable.
    if (e.statusCode === 401 || e.statusCode === 403) {
      return { kind: 'provider_unavailable' };
    }
    // 404 → provider_unavailable (Step 2a decision (a)). The classifier
    // is context-free: it cannot know whether a 404 is a file deleted
    // out-of-band (genuine provider_unavailable) vs a malformed/
    // never-existed key. v1 routes ALL Graph 404 to the exception queue
    // via provider_unavailable; the exception-queue handler distinguishes
    // at resolution. (Accepts that malformed-key 404s also route there —
    // the safe direction for a storage-backed accounting document.)
    if (e.statusCode === 404) {
      return { kind: 'provider_unavailable' };
    }
    // Other 4xx → permanent_malformed.
    if (e.statusCode >= 400 && e.statusCode < 500) {
      return { kind: 'permanent_malformed', code: 'STORAGE_KEY_MALFORMED' };
    }
  }

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
