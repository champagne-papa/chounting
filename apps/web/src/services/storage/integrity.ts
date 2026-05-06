// src/services/storage/integrity.ts
// SHA-256 hashing helpers for storage integrity verification per
// ADR-0013 §9.
//
// Hash format convention: lowercase hex, 64 chars. The chunk 1
// migration's source_documents.original_content_hash + the
// source_document_versions.content_hash columns are `text` (no
// DB-level format constraint); service-layer convention is
// lowercase-hex consistently. verifyHash compares case-insensitively
// as defense-in-depth (in case any future source emits uppercase).
//
// Implementation: Node `crypto.createHash` (sync API). Path α chosen
// at chunk 3 drafting time. Path β alternative was Web Crypto API
// (`crypto.subtle.digest`) for portability consistency with the
// chunk 2 Uint8Array contract decision; counter-evidence surfaced
// at drafting: Web Crypto's BufferSource type requires
// ArrayBuffer-backed views (excludes SharedArrayBuffer), which
// Uint8Array parameters can't statically prove in TypeScript strict
// mode (TS2345 at compile). Path β workaround was a type assertion
// silencing the type-system signal at every callsite.
//
// Path α reasoning: the portability claim was speculative (codebase
// is committed Next.js on Node); type assertion would be load-bearing
// at every crypto.subtle callsite and accumulate; sync API matches
// SHA-256-over-a-buffer's actual CPU-bound nature; Node createHash
// is the established repo convention. Cost of reversing if a future
// chunk needs Edge runtime is a one-file rewrite (same size as this
// rewrite). Friction-journal entry covers the drafting-time switch.
//
// The Uint8Array parameter type from the chunk 2 contract is
// preserved (Path α is implementation choice, orthogonal to
// interface parameter type).
//
// Helpers:
//   - computeHash(bytes)              — pure SHA-256 of bytes (sync)
//   - verifyHash(bytes, expectedHash) — compute + compare; throw
//                                       ServiceError(INTEGRITY_VERIFY_FAILED)
//                                       on mismatch
//
// computeHash is independently useful (e.g., dedup-by-hash logic at
// the OCR-pipeline ingest stage per ADR-0013 §10 reads
// source_documents.original_content_hash to check incoming bytes
// against existing rows). verifyHash centralizes the throw discipline
// for INTEGRITY_VERIFY_FAILED.

import { createHash } from 'node:crypto';
import { ServiceError } from '@/services/errors/ServiceError';

// Compute SHA-256 hash of bytes. Returns lowercase hex (64 chars).
export function computeHash(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

// Verify bytes match the expected hash. Throws ServiceError
// (INTEGRITY_VERIFY_FAILED) on mismatch per ADR-0013 §9. Comparison
// is case-insensitive defensively; canonical service emission is
// lowercase. On match, returns void (no result; success-only path).
export function verifyHash(
  bytes: Uint8Array,
  expectedHash: string,
): void {
  const actualHash = computeHash(bytes);
  if (actualHash.toLowerCase() !== expectedHash.toLowerCase()) {
    throw new ServiceError(
      'INTEGRITY_VERIFY_FAILED',
      `SHA-256 hash mismatch: expected ${expectedHash.toLowerCase()}, got ${actualHash}`,
      { expected: expectedHash.toLowerCase(), actual: actualHash },
    );
  }
}
