// src/agent/orchestrator/extraction/ingestDocument.ts
//
// Tier 2 document pipeline orchestrator entry function per ADR-0014 §1
// + ADR-0007 Q31 (deterministic TypeScript orchestration; LLM-planned
// orchestration prohibited).
//
// Calls Stages 0-7 in fixed sequence (ADR-0014 §13 canonical stage_names):
//   Stage 0 (dedup_by_hash)           → short-circuit on hash match
//   Stage 1 (byte_fetch)              → via storageProviderService.fetch
//   Stage 2 (run_ocr)                 → active at chunk 7.1b (Modal sidecar)
//   Stage 3 (classify_document_type)  → active at chunk 7.2 (Tier A/C/D)
//   Stage 4 (extract_fields)          → active at chunk 7.3a (per-document-type extractors)
//   Stage 5 (match_vendor)            → active at chunk 7.3a (vendorService.matchVendor)
//   Stage 6 (match_against_existing_state)  → active at chunk 7.3a (documentRouterService.completeCandidate per Phase 4 chunk 1 substrate)
//   Stage 7 (build_proposal)          → substrate active at chunk 7.3a (proposalBuilder.ts); commit composite at chunk 7.3b
//
// Per Iteration 2 Option γ RATIFIED: chunk 7.3a Stage 7 ships
// ProposedEntryCard-only routes; born-paid bundle + receipt-as-payment-
// evidence + payment_confirmation no-cited-bill cases route to
// IngestDocumentOutput.status 'deferred_chunk_7_3b_pending_activation'
// (TS-only union extension per Iteration 2 Option β).
//
// Brief-task-naming vs ADR canonical reconciliation per Iteration 2 Step 21:
//   - Brief Task 7.3a.3 (vendorService.matchVendor extension) = ADR canonical Stage 5 match_vendor.
//   - Brief Task 7.3a.5 ("Stage 5 relationship-candidate") = ADR canonical Stage 6 match_against_existing_state via documentRouterService.completeCandidate (Subsystem 1 per ADR-0018 §item 2).
//   - Brief Task 7.3a.6 ("Stage 6 proposal builder") = ADR canonical Stage 7 build_proposal substrate.
//
// Per Service Communication Rule 5: trace_id propagates through
// internally-constructed SystemActorServiceContext.
//
// Per ADR-0014 §12 + failureClassification.ts: Stages 0+1+2+4+5+6+7
// wrapped with retry-on-transient + audit-event-emission discipline.
// Stage 3 + Stage 4 apply the wrap selectively per Step 20 Option (c):
// Tier A + Tier D paths wrap; Tier C path defers to callClaude.ts
// internal retry classification (avoids compounded retries).

import type {
  IngestDocumentInput,
  IngestDocumentOutput,
  PipelineStageRecord,
  PipelineFailureClass,
  RelationshipCandidate,
} from './types';
import type { SystemActorServiceContext } from '@/services/middleware/serviceContext';
import { dedupByHash } from './stages/dedupByHash';
import { byteFetch } from './stages/byteFetch';
import { runOCR } from './stages/runOCR';
import { classifyDocumentType } from './classifier';
import { extractFields } from './extractFields';
import { buildProposal } from './stages/proposalBuilder';
import { withFailureClassification } from './failureClassification';
import { ServiceError } from '@/services/errors/ServiceError';
import { vendorService } from '@/services/spend/vendorService';
import { completeCandidate } from '@/services/document-platform/documentRouterService';
import { adminClient } from '@/db/adminClient';
import crypto from 'crypto';

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

  // Stage 3 — classify (active at chunk 7.2 per ADR-0014 §7).
  // Invokes Tier A rule-based classifier, falls through to Tier C
  // Claude Sonnet AI fallback on no Tier A match, falls through to
  // Tier D ('unknown') on Tier C invalid / below threshold / budget
  // exhausted. Step 20 Option (c): coordinateTiers wraps Tier A +
  // Tier D paths in withFailureClassification internally; Tier C
  // defers to callClaude.ts internal retry classification.
  let classification;
  try {
    classification = await classifyDocumentType(
      {
        ocrArtifact: ocrResult.artifact,
        source_document_id: input.source_document_id,
        trace_id: input.trace_id,
      },
      ctx,
    );
  } catch (err) {
    return {
      status: 'pipeline_failed',
      pipeline_trace,
      proposal_id: null,
      failure_class: classifyFailure(err),
    };
  }
  for (const record of classification.trace_records) {
    pipeline_trace.push(record);
  }

  // Short-circuit on documentType='unknown' per ADR-0014 §7 ("unknown
  // always exception queue"). Stage 3 classifier already emitted
  // extraction_failed audit events via aiFallback.ts; routing to
  // exception queue is the v1 contract. No value in Stages 4-7 for
  // unknown documents — return 'committed' (pipeline completed; result
  // discriminator is the absent proposal_id + ai_fallback_invoked).
  if (classification.result.documentType === 'unknown') {
    return {
      status: 'committed',
      pipeline_trace,
      proposal_id: null,
      failure_class: null,
    };
  }

  // Stage 4 — extract_fields (active at chunk 7.3a per ADR-0014 §8).
  // Per-document-type extractor with Tier A rule-based baseline + Tier C
  // AI fallback (shared per-document budget via aiFallbackBudget.ts).
  // Step 20 Option (c): Tier C path defers to callClaude.ts internal
  // retry; orchestrator wraps Stage 4 entry for Tier A path failures.
  let extracted;
  try {
    extracted = await withFailureClassification(
      'extract_fields',
      input.source_document_id,
      ctx,
      () =>
        extractFields(
          {
            documentType: classification.result.documentType,
            ocrArtifact: ocrResult.artifact,
            source_document_id: input.source_document_id,
            trace_id: input.trace_id,
          },
          ctx,
        ),
    );
  } catch (err) {
    return {
      status: 'pipeline_failed',
      pipeline_trace,
      proposal_id: null,
      failure_class: classifyFailure(err),
    };
  }
  for (const record of extracted.trace_records) {
    pipeline_trace.push(record);
  }

  // Stage 5 — match_vendor per ADR-0014 §9 + §13 canonical (brief
  // Task 7.3a.3 brief-named "matchVendor extension"). Reads vendor
  // identity-and-matching fields ONLY per Q29 ESLint boundary.
  let vendorMatch;
  try {
    vendorMatch = await withFailureClassification(
      'match_vendor',
      input.source_document_id,
      ctx,
      () =>
        vendorService.matchVendor(
          {
            org_id: input.org_id,
            vendorField: extractVendorFields(extracted.fields),
            trace_id: input.trace_id,
          },
          ctx,
        ),
    );
  } catch (err) {
    return {
      status: 'pipeline_failed',
      pipeline_trace,
      proposal_id: null,
      failure_class: classifyFailure(err),
    };
  }
  pipeline_trace.push({
    stage_name: 'match_vendor',
    input_hash: crypto
      .createHash('sha256')
      .update(JSON.stringify(extractVendorFields(extracted.fields)))
      .digest('hex'),
    output_hash: crypto
      .createHash('sha256')
      .update(JSON.stringify(vendorMatch))
      .digest('hex'),
    model: null,
    timestamp: new Date().toISOString(),
  });

  // Look up document_case_id from document_jobs for Stage 6 invocation.
  // documentRouterService.completeCandidate consumer interface per Phase 4
  // chunk 1 substrate (Subsystem 1 Ledger-State Candidate Completion).
  const documentCaseId = await lookupDocumentCaseId(input.source_document_id);

  // Stage 6 — match_against_existing_state per ADR-0014 §13 canonical
  // (brief Task 7.3a.5 brief-named "Stage 5 relationship-candidate";
  // ADR canonical Stage 6 per Iteration 2 Step 21 RATIFIED).
  // documentRouterService.completeCandidate is Subsystem 1 per ADR-0018
  // §item 2.
  //
  // completeCandidate signature accepts ServiceContext (VerifiedCaller);
  // orchestrator runs as system_actor. Construct a synthetic
  // ServiceContext that satisfies the structural shape for completeCandidate's
  // logging needs (system_actor pattern; user_id stays as synthetic
  // sentinel). Discipline parallels chunk 6.3a recordMutation widening
  // pattern at the consumer side.
  const synthCtxForRouter = {
    trace_id: input.trace_id,
    caller: {
      user_id: `system_actor:${SYSTEM_ACTOR}`,
      email: 'system@bridge.local',
      verified: true as const,
      org_ids: [input.org_id],
    },
  };
  let relationshipCandidates: RelationshipCandidate[] = [];
  if (documentCaseId) {
    try {
      const candidates = await withFailureClassification(
        'match_against_existing_state',
        input.source_document_id,
        ctx,
        () =>
          completeCandidate(
            {
              document_case_id: documentCaseId,
              source_document_id: input.source_document_id,
              document_type: classification.result.documentType,
              classification_confidence: classification.result.confidence,
              extracted_fields: extracted.fields,
              vendor_match: vendorMatch.vendor_id
                ? {
                    vendor_id: vendorMatch.vendor_id,
                    confidence: vendorMatch.confidence,
                    match_type: vendorMatch.match_type,
                    candidate_alternatives: [],
                  }
                : null,
              trace_id: input.trace_id,
            },
            synthCtxForRouter,
          ),
      );
      relationshipCandidates = candidates.map((c) => ({
        id: c.id,
        document_case_id: c.document_case_id,
        source_document_id: c.source_document_id,
        linked_entity_type: c.linked_entity_type,
        linked_entity_id: c.linked_entity_id,
        link_role: c.link_role,
        confidence_score: c.confidence_score,
      }));
    } catch (err) {
      return {
        status: 'pipeline_failed',
        pipeline_trace,
        proposal_id: null,
        failure_class: classifyFailure(err),
      };
    }
  }
  pipeline_trace.push({
    stage_name: 'match_against_existing_state',
    input_hash: crypto
      .createHash('sha256')
      .update(JSON.stringify({ documentCaseId, vendorMatch }))
      .digest('hex'),
    output_hash: crypto
      .createHash('sha256')
      .update(JSON.stringify(relationshipCandidates))
      .digest('hex'),
    model: null,
    timestamp: new Date().toISOString(),
  });

  // Stage 7 — build_proposal per ADR-0014 §13 canonical (brief Task
  // 7.3a.6 brief-named "Stage 6 proposal builder"; ADR canonical Stage 7).
  // Chunk 7.3a ships ProposedEntryCard-only routes; born-paid bundle +
  // receipt + payment_confirmation no-cited-bill routes defer to chunk
  // 7.3b per Iteration 2 Option γ.
  let proposal;
  try {
    proposal = await withFailureClassification(
      'build_proposal',
      input.source_document_id,
      ctx,
      async () =>
        buildProposal({
          source_document_id: input.source_document_id,
          classification: classification.result,
          extractedFields: extracted.fields,
          vendorMatch: vendorMatch.vendor_id ? vendorMatch : null,
          relationshipCandidates,
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
  pipeline_trace.push({
    stage_name: 'build_proposal',
    input_hash: crypto
      .createHash('sha256')
      .update(JSON.stringify(extracted.fields))
      .digest('hex'),
    output_hash: crypto
      .createHash('sha256')
      .update(JSON.stringify(proposal))
      .digest('hex'),
    model: null,
    timestamp: new Date().toISOString(),
  });

  // Branch on ProposalResult.kind: 'proposed_entry_card' returns
  // committed (proposal_id null at chunk 7.3a; commit composite at
  // chunk 7.3b populates proposal_id); 'deferred_chunk_7_3b_pending_activation'
  // returns deferred status.
  if (proposal.kind === 'deferred_chunk_7_3b_pending_activation') {
    return {
      status: 'deferred_chunk_7_3b_pending_activation',
      pipeline_trace,
      proposal_id: null,
      failure_class: null,
      deferred_reason: proposal.reason,
    };
  }

  return {
    status: 'committed',
    pipeline_trace,
    proposal_id: null, // chunk 7.3b commit composite populates proposal_id
    failure_class: null,
  };
}

/**
 * Extract vendor identity fields from Stage 4 extraction output per
 * ADR-0007 §Tier 2 Read boundary: name + tax_id + email ONLY.
 */
function extractVendorFields(fields: Record<string, unknown>): {
  vendor_name?: string;
  vendor_text?: string;
  merchant_text?: string;
  tax_id?: string;
  email?: string;
} {
  return {
    vendor_name:
      typeof fields.vendor_name === 'string' ? fields.vendor_name : undefined,
    vendor_text:
      typeof fields.vendor_text === 'string' ? fields.vendor_text : undefined,
    merchant_text:
      typeof fields.merchant_text === 'string' ? fields.merchant_text : undefined,
    tax_id: typeof fields.tax_id === 'string' ? fields.tax_id : undefined,
    email: typeof fields.email === 'string' ? fields.email : undefined,
  };
}

/**
 * Look up document_case_id from document_jobs table via source_document_id.
 * Returns null if no matching job exists (defensive; Stage 6 skips when
 * documentCaseId is null).
 */
async function lookupDocumentCaseId(
  source_document_id: string,
): Promise<string | null> {
  const db = adminClient();
  const { data, error } = await db
    .from('document_jobs')
    .select('document_case_id')
    .eq('source_document_id', source_document_id)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return (data as { document_case_id: string }).document_case_id;
}

function classifyFailure(err: unknown): PipelineFailureClass {
  if (err instanceof ServiceError) {
    if (err.code === 'PIPELINE_UNAVAILABLE') return 'unavailable';
    if (err.code === 'PIPELINE_TRANSIENT_EXHAUSTED') return 'transient_exhausted';
    if (err.code === 'NOT_FOUND') return 'permanent_malformed';
  }
  return 'transient_exhausted';
}
