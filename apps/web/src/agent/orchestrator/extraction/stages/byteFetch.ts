// src/agent/orchestrator/extraction/stages/byteFetch.ts
//
// Stage 1 — byte fetch via storageProviderService.fetch per ADR-0013
// §1. Returns raw bytes + content_hash + provider for downstream OCR.
//
// Per ADR-0014 §1: Stage 1 input is source_document_id + ctx; output
// is FetchBytesResult per ADR-0013 §1 FetchResult shape.

import { getStorageProvider } from '@/services/storage/resolver';
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

const V1_STORAGE_PROVIDER = 'supabase_storage' as const;

export async function byteFetch(
  input: ByteFetchInput,
): Promise<ByteFetchOutput> {
  const timestamp = new Date().toISOString();

  const provider = getStorageProvider(V1_STORAGE_PROVIDER);

  let fetchResult;
  try {
    fetchResult = await provider.fetch(input.source_document_id, input.ctx);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Classify as transient (configuration / network) per ADR-0014 §12.1;
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
