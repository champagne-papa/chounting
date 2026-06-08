// src/agent/orchestrator/extraction/stages/byteFetch.ts
//
// Stage 1 — byte fetch via storageProviderService.fetch per ADR-0013
// §1. Returns raw bytes + content_hash + provider for downstream OCR.
//
// Per ADR-0014 §1: Stage 1 input is source_document_id + ctx; output
// is FetchBytesResult per ADR-0013 §1 FetchResult shape.

import { getStorageProvider } from '@/services/storage/resolver';
import { adminClient } from '@/db/adminClient';
import { ServiceError } from '@/services/errors/ServiceError';
import type { FetchBytesResult, PipelineStageRecord } from '../types';
import type { SystemActorServiceContext } from '@/services/middleware/serviceContext';
import crypto from 'crypto';

export interface ByteFetchInput {
  source_document_id: string;
  ctx: SystemActorServiceContext;
}

export interface ByteFetchOutput {
  result: FetchBytesResult;
  trace_record: PipelineStageRecord;
}

export async function byteFetch(
  input: ByteFetchInput,
): Promise<ByteFetchOutput> {
  const timestamp = new Date().toISOString();

  // FORWARD-MARKER (Charter B real-flow D-3 §3.2): EVERY storage read site
  // must dispatch getStorageProvider on the ROW's storage_provider — never a
  // constant or the org default. byteFetch is the only live fetch-dispatch
  // today; previewUrl/verifyIntegrity/fetchVersion/delete have zero callers,
  // so when their consumers land each inherits THIS rule. Do NOT reintroduce
  // a hardcoded provider constant at a read site (the bug this arc fixed),
  // and do NOT use resolveStorageProvider here — that is ingest-only (it
  // returns the org default; a document is read from the provider it was
  // WRITTEN under, i.e. the row's storage_provider).
  const { data: row, error: rowErr } = await adminClient()
    .from('source_documents')
    .select('storage_provider')
    .eq('id', input.source_document_id)
    .single();
  if (rowErr || !row) {
    throw new ServiceError(
      'NOT_FOUND',
      `[byteFetch] source_document ${input.source_document_id} not found`,
    );
  }
  const provider = getStorageProvider(row.storage_provider);

  let fetchResult;
  try {
    fetchResult = await provider.fetch(input.source_document_id, input.ctx);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Charter B real-flow D-5 (wire contract, edit b): map the TYPED
    // STORAGE_PROVIDER_UNAVAILABLE (from withRetry, edit a) → PIPELINE_UNAVAILABLE,
    // which classifyError (UNCHANGED) routes to failure_class 'unavailable' and
    // emits the distinct pipeline_unavailable audit event. (a)-without-(b)
    // would relocate the mask — classifyError's default branch flattens any
    // unrecognized code back to transient_exhausted.
    if (
      err instanceof ServiceError &&
      err.code === 'STORAGE_PROVIDER_UNAVAILABLE'
    ) {
      throw new ServiceError(
        'PIPELINE_UNAVAILABLE',
        `[byteFetch] provider unavailable: ${message}`,
      );
    }
    // Everything else: transient (configuration / network) per ADR-0014 §12.1;
    // failureClassification.ts wrapper handles retry semantics.
    throw new ServiceError(
      'PIPELINE_TRANSIENT_EXHAUSTED',
      `[byteFetch] storage fetch failed: ${message}`,
    );
  }

  if (!fetchResult || !fetchResult.bytes) {
    throw new ServiceError(
      'PIPELINE_UNAVAILABLE',
      `[byteFetch] storage returned no bytes for source_document_id=${input.source_document_id}`,
    );
  }

  // input_hash = SHA-256 of source_document_id (operation input shape).
  // output_hash = SHA-256 of fetched bytes (matches content_hash but
  // independently computed for trace verification).
  const inputHash = crypto
    .createHash('sha256')
    .update(input.source_document_id)
    .digest('hex');

  const trace_record: PipelineStageRecord = {
    stage_name: 'byte_fetch',
    input_hash: inputHash,
    output_hash: fetchResult.content_hash,
    model: null,
    timestamp,
  };

  return {
    result: {
      bytes: fetchResult.bytes,
      content_hash: fetchResult.content_hash,
      provider: fetchResult.provider,
    },
    trace_record,
  };
}
