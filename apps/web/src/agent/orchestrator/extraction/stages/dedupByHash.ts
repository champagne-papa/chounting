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
// Both reads hoisted to extractionReadService (Arc 2 T3, ADR-0020
// App. A); error semantics byte-identical (PIPELINE_TRANSIENT_
// EXHAUSTED / NOT_FOUND with [dedupByHash] tags).

import { findPriorSourceDocumentByHash } from '@/services/document-platform/extractionReadService';
import type { DedupResult, PipelineStageRecord } from '../types';

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
  const timestamp = new Date().toISOString();

  const { hash, prior_source_document_id } =
    await findPriorSourceDocumentByHash({
      org_id: input.org_id,
      source_document_id: input.source_document_id,
    });

  const matched = prior_source_document_id !== null;
  const result: DedupResult =
    prior_source_document_id !== null
      ? {
          shortCircuited: true,
          existing_source_document_id: prior_source_document_id,
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
