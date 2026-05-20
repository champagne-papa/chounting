// src/agent/orchestrator/extraction/stages/dedupByHash.ts
//
// Stage 0 — dedup-by-hash short-circuit per ADR-0014 §6. Before
// running OCR, the orchestrator checks for an existing
// `source_documents.original_content_hash` match within the same
// `org_id` (excluding self). Match-found: skip Stages 1-7; reuse the
// prior document's proposal (chunk 7.3 active wiring resolves the
// reuse path).
//
// Per ADR-0014 §6: hash is SHA-256 of bytes at original ingestion;
// stored at `source_documents.original_content_hash` (immutable
// evidence anchor per ADR-0011 §2). Stage 0 does NOT re-compute the
// hash — it reads the existing column value and queries for matches.

import { adminClient } from '@/db/adminClient';
import type { DedupResult, PipelineStageRecord } from '../types';
import { ServiceError } from '@/services/errors/ServiceError';

export interface DedupByHashInput {
  org_id: string;
  source_document_id: string;
  trace_id: string;
}

export interface DedupByHashOutput {
  result: DedupResult;
  trace_record: PipelineStageRecord;
}

export async function dedupByHash(
  input: DedupByHashInput,
): Promise<DedupByHashOutput> {
  const db = adminClient();
  const timestamp = new Date().toISOString();

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

  const matched = priorMatches && priorMatches.length > 0;
  const result: DedupResult = matched
    ? {
        shortCircuited: true,
        existing_source_document_id: priorMatches[0].id,
      }
    : { shortCircuited: false };

  const trace_record: PipelineStageRecord = {
    stage_name: matched ? 'dedup_short_circuit' : 'dedup_no_match',
    input_hash: hash,
    output_hash: matched ? hash : '',
    model: null,
    timestamp,
  };

  return { result, trace_record };
}
