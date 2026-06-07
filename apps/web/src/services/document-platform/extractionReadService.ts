// src/services/document-platform/extractionReadService.ts
//
// Arc 2 T3 (agent→adminClient cleanup) — extraction-pipeline read
// bundle, hoisted VERBATIM from
// agent/orchestrator/extraction/stages/dedupByHash.ts per ADR-0020
// Appendix A (agent → services → db; Law 1). Read-only; no
// withInvariants per the read-function asymmetry (INV-SERVICE-001
// leaf) — both queries are org-filtered (.eq('org_id', …)), so a
// foreign org's source_document_id misses identically to a
// nonexistent one (no existence leak). Error codes and messages are
// byte-identical to the pre-hoist agent-stage reads (including the
// `[dedupByHash]` tags, kept for log continuity).
//
// The agent stage keeps DedupResult / PipelineStageRecord assembly
// — services may not import agent-layer types (ADR-0020, both
// directions of the boundary); this service returns primitives.

import { adminClient } from '@/db/adminClient';
import { ServiceError } from '@/services/errors/ServiceError';

export interface PriorDocumentByHashInput {
  org_id: string;
  source_document_id: string;
}

export interface PriorDocumentByHashResult {
  /** This document's stored original_content_hash (ADR-0014 §6). */
  hash: string;
  /** Oldest prior same-org, same-hash document id, or null. */
  prior_source_document_id: string | null;
}

export async function findPriorSourceDocumentByHash(
  input: PriorDocumentByHashInput,
): Promise<PriorDocumentByHashResult> {
  const db = adminClient();

  // Read this source_document's hash.
  const { data: thisDoc, error: readError } = await db
    .from('source_documents')
    .select('original_content_hash')
    .eq('id', input.source_document_id)
    .eq('org_id', input.org_id)
    .maybeSingle();

  if (readError) {
    throw new ServiceError(
      'PIPELINE_TRANSIENT_EXHAUSTED',
      `[dedupByHash] source_documents read failed: ${readError.message}`,
    );
  }

  if (!thisDoc) {
    throw new ServiceError(
      'NOT_FOUND',
      `[dedupByHash] source_document_id=${input.source_document_id} not found in org_id=${input.org_id}`,
    );
  }

  const hash = thisDoc.original_content_hash;

  // Query for prior matches (same org_id + same hash + NOT self).
  const { data: priorMatches, error: matchError } = await db
    .from('source_documents')
    .select('id')
    .eq('org_id', input.org_id)
    .eq('original_content_hash', hash)
    .neq('id', input.source_document_id)
    .order('created_at', { ascending: true })
    .limit(1);

  if (matchError) {
    throw new ServiceError(
      'PIPELINE_TRANSIENT_EXHAUSTED',
      `[dedupByHash] dedup query failed: ${matchError.message}`,
    );
  }

  return {
    hash,
    prior_source_document_id:
      priorMatches && priorMatches.length > 0 ? priorMatches[0].id : null,
  };
}

/**
 * Look up document_case_id from document_jobs table via org_id +
 * source_document_id. Returns null if no matching job exists
 * (defensive; Stage 6 skips when documentCaseId is null).
 *
 * Arc 2 T4 — hoisted VERBATIM from ingestDocument.ts, as-found with
 * no org filter (the Arc 2 ledgered defense-in-depth gap). Class D
 * arc T5 (2026-06-06) closed it: org_id is now a required first
 * parameter and the read enforces org-scope. Narrows match
 * semantics — a foreign org's source_document_id (UUID-PK-unique,
 * so previously safe by uniqueness alone) now misses by
 * construction.
 */
export async function lookupDocumentCaseId(
  org_id: string,
  source_document_id: string,
): Promise<string | null> {
  const db = adminClient();
  const { data, error } = await db
    .from('document_jobs')
    .select('document_case_id')
    .eq('org_id', org_id)
    .eq('source_document_id', source_document_id)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return (data as { document_case_id: string }).document_case_id;
}
