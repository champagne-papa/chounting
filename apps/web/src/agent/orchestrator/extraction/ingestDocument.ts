// src/agent/orchestrator/extraction/ingestDocument.ts
//
// Tier 2 document pipeline orchestrator entry function per ADR-0014 §1
// + ADR-0007 Q31 (deterministic TypeScript orchestration; LLM-planned
// orchestration prohibited).
//
// Calls Stages 0-7 in fixed sequence:
//   Stage 0 (dedup-by-hash) → short-circuit on hash match
//   Stage 1 (byte fetch)    → via storageProviderService.fetch
//   Stage 2 (OCR)           → STUB at chunk 7.1a; chunk 7.1b active
//   Stage 3 (classify)      → STUB at chunk 7.1a; chunk 7.2 active
//   Stage 4 (extract)       → STUB at chunk 7.1a; chunk 7.3 active
//   Stage 5 (matchVendor)   → STUB at chunk 7.1a; chunk 7.3 active
//   Stage 6 (matchAgainst-  → STUB at chunk 7.1a; chunk 7.3 active
//            ExistingState)
//   Stage 7 (buildProposal) → STUB at chunk 7.1a; chunk 7.3 active
//
// Per Service Communication Rule 5: trace_id propagates through
// internally-constructed SystemActorServiceContext. The orchestrator
// runs as system actor (caller.user_id = null) — invocation source is
// `pipeline_orchestrator`.
//
// Per ADR-0014 §12 + failureClassification.ts: Stages 0+1 wrapped with
// retry-on-transient + audit-event-emission discipline.

import type {
  IngestDocumentInput,
  IngestDocumentOutput,
  PipelineStageRecord,
  PipelineFailureClass,
} from './types';
import type { SystemActorServiceContext } from '@/services/middleware/serviceContext';
import { dedupByHash } from './stages/dedupByHash';
import { byteFetch } from './stages/byteFetch';
import { runOCR } from './stages/runOCR';
import {
  classifyDocumentTypeStub,
  extractFieldsStub,
  matchVendorStub,
  matchAgainstExistingStateStub,
  buildProposalStub,
} from './stages/stubsStages3to7';
import { withFailureClassification } from './failureClassification';
import { ServiceError } from '@/services/errors/ServiceError';

const SYSTEM_ACTOR = 'pipeline_orchestrator';

export async function ingestDocument(
  input: IngestDocumentInput,
): Promise<IngestDocumentOutput> {
  const ctx: SystemActorServiceContext = {
    trace_id: input.trace_id,
    caller: { user_id: null, system_actor: SYSTEM_ACTOR },
    org_id: input.org_id,
  };

  const pipeline_trace: PipelineStageRecord[] = [];

  // Stage 0 — dedup-by-hash
  let dedup;
  try {
    dedup = await withFailureClassification(
      'dedup_by_hash',
      input.source_document_id,
      ctx,
      () =>
        dedupByHash({
          org_id: input.org_id,
          source_document_id: input.source_document_id,
          trace_id: input.trace_id,
        }),
    );
  } catch (err) {
    return {
      status: 'pipeline_failed',
      pipeline_trace,
      proposal_id: null,
      failure_class: classifyFailure(err),
    };
  }
  pipeline_trace.push(dedup.trace_record);

  if (dedup.result.shortCircuited) {
    return {
      status: 'dedup_short_circuit',
      pipeline_trace,
      proposal_id: null,
      failure_class: null,
    };
  }

  // Stage 1 — byte fetch
  let fetched;
  try {
    fetched = await withFailureClassification(
      'byte_fetch',
      input.source_document_id,
      ctx,
      () =>
        byteFetch({
          source_document_id: input.source_document_id,
          ctx,
        }),
    );
  } catch (err) {
    return {
      status: 'pipeline_failed',
      pipeline_trace,
      proposal_id: null,
      failure_class: classifyFailure(err),
    };
  }
  pipeline_trace.push(fetched.trace_record);

  // Stage 2 — OCR (active at chunk 7.1b per ADR-0014 §3 Modal sidecar;
  // wrapped in withFailureClassification per chunk 7.1a Stages 0+1
  // precedent. Per ADR-0014 §12.1 amendment 2026-05-20: Stage 2
  // per-stage wall-clock budget is ~30s exception per Modal cold-start.)
  let ocrResult;
  try {
    ocrResult = await withFailureClassification(
      'run_ocr',
      input.source_document_id,
      ctx,
      () =>
        runOCR({
          source_document_id: input.source_document_id,
          bytes: fetched.result.bytes,
          content_hash: fetched.result.content_hash,
          trace_id: input.trace_id,
          prior_trace: pipeline_trace,
        }),
    );
  } catch (err) {
    return {
      status: 'pipeline_failed',
      pipeline_trace,
      proposal_id: null,
      failure_class: classifyFailure(err),
    };
  }
  pipeline_trace.push(ocrResult.trace_record);

  // Stages 3-7 — STUB (synchronous; no failure classification at chunk
  // 7.1a since stubs don't call external services)
  const classification = classifyDocumentTypeStub(
    ocrResult.artifact,
    input.trace_id,
  );
  pipeline_trace.push(classification.trace_record);

  const extracted = extractFieldsStub(
    classification.result.document_type,
    ocrResult.artifact,
    input.trace_id,
  );
  pipeline_trace.push(extracted.trace_record);

  const vendorMatch = matchVendorStub(
    input.org_id,
    extracted.result.fields,
    input.trace_id,
  );
  pipeline_trace.push(vendorMatch.trace_record);

  const relCandidate = matchAgainstExistingStateStub(
    input.org_id,
    classification.result,
    extracted.result,
    vendorMatch.result,
    input.trace_id,
  );
  pipeline_trace.push(relCandidate.trace_record);

  const proposal = buildProposalStub({
    source_document_id: input.source_document_id,
    classification: classification.result,
    extracted: extracted.result,
    vendorMatch: vendorMatch.result,
    relCandidate: relCandidate.result,
    trace_id: input.trace_id,
  });
  pipeline_trace.push(proposal.trace_record);

  // At chunk 7.1a, Stage 7 STUB returns a placeholder proposal but
  // does NOT commit to ProposedMutation / ProposedAttachment tables
  // (those activate at chunk 7.3). proposal_id remains null.
  return {
    status: 'committed',
    pipeline_trace,
    proposal_id: null, // chunk 7.3 wires actual proposal_id
    failure_class: null,
  };
}

function classifyFailure(err: unknown): PipelineFailureClass {
  if (err instanceof ServiceError) {
    if (err.code === 'PIPELINE_UNAVAILABLE') return 'unavailable';
    if (err.code === 'PIPELINE_TRANSIENT_EXHAUSTED') return 'transient_exhausted';
    if (err.code === 'NOT_FOUND') return 'permanent_malformed';
  }
  return 'transient_exhausted';
}
