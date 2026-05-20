// src/agent/orchestrator/extraction/types.ts
//
// Tier 2 document pipeline shared types per ADR-0014 §1 (orchestrator
// stage sequence) + §8 (trace propagation) + ADR-0007 Q30 (Logic
// Receipt reproducibility — PipelineStageRecord shape).
//
// Phase 7 chunk 7.1a seeds this file. Stages 3-7 carry placeholder
// types resolved further at chunks 7.2 (classifier) + 7.3 (extractor +
// matcher + relationship candidate + proposal builder); per Session 36
// directive Note 4, chunk 7.1a stubs only need PLACEHOLDER shapes —
// full signatures resolve via downstream chunk inheritance.
//
// Per ADR-0007 Q31 (LLM-orchestration prohibition): orchestrator
// between Tier 2 stages is deterministic TypeScript; types here are
// plain type aliases, not dynamic-dispatch contracts.

/**
 * Per-stage trace record emitted by every Tier 2 stage per ADR-0014
 * §8 + ADR-0007 Q30. Records accumulate during orchestrator run; at
 * Stage 2 (OCR) the accumulated trace is persisted to
 * `document_artifacts.pipeline_trace` (JSONB column); at Stage 7
 * (commit; chunk 7.3) the same shape flows into
 * `ProposedMutation.justification.pipeline_trace` per ADR-0014 §13.
 *
 * `model` is null for non-AI stages (Stages 0+1+2 OCR + Stages 4-7
 * deterministic extraction); a string identifier for AI-fallback
 * stages (Stage 3 Tier C classifier; chunk 7.2).
 */
export interface PipelineStageRecord {
  stage_name: string;
  input_hash: string;
  output_hash: string;
  model: string | null;
  timestamp: string; // ISO-8601 per Phase 6 audit_log.created_at convention
}

/**
 * Orchestrator entry function input. Matches ADR-0014 §1 illustrative
 * orchestrator shape: `ingestDocument(orgId, sourceDocumentId, traceId)`.
 */
export interface IngestDocumentInput {
  org_id: string;
  source_document_id: string;
  trace_id: string;
}

/**
 * Orchestrator entry function output. At chunk 7.1a (Stages 0+1 active;
 * Stages 2-7 STUB), the output carries a stub proposal + the
 * accumulated pipeline_trace; chunk 7.3 active wiring of Stage 7
 * produces the full ProposedMutation / ProposedMutationBundle /
 * ProposedAttachment shapes per ADR-0014 §11.
 */
export interface IngestDocumentOutput {
  status: 'committed' | 'dedup_short_circuit' | 'pipeline_failed';
  pipeline_trace: PipelineStageRecord[];
  proposal_id: string | null; // stub at chunk 7.1a; populated at chunk 7.3
  failure_class: PipelineFailureClass | null; // populated on failure paths
}

/**
 * Failure classification per ADR-0014 §12. Three categories at Stages
 * 0+1 (chunk 7.1a scope); extended at chunks 7.2-7.3 for downstream
 * stages.
 */
export type PipelineFailureClass =
  | 'transient_exhausted'
  | 'unavailable'
  | 'permanent_malformed';

/**
 * Stage 0 dedup-by-hash result. Per ADR-0014 §6: short-circuit on
 * `source_documents.original_content_hash` match within same `org_id`.
 * On match: orchestrator skips Stages 1-7 and returns the prior
 * document's proposal (chunk 7.3 active wiring resolves this).
 */
export type DedupResult =
  | { shortCircuited: true; existing_source_document_id: string }
  | { shortCircuited: false };

/**
 * Stage 1 byte fetch result. Per ADR-0013 §1
 * (storageProviderService.fetch return shape).
 */
export interface FetchBytesResult {
  bytes: Uint8Array;
  content_hash: string;
  provider: string;
}

/**
 * Stage 2 OCR result (STUB at chunk 7.1a; active at chunk 7.1b via
 * Modal sidecar). Matches `document_artifacts` schema column shape
 * per ADR-0011 §5 + migration 20240146000000.
 */
export interface DocumentArtifactRow {
  engine: string;
  engine_version: string;
  pages: unknown; // JSONB; precise shape resolves at chunk 7.1b
  lines: unknown; // JSONB
  words: unknown; // JSONB
  quality_flags: string[];
  pipeline_trace: PipelineStageRecord[];
  confidence: number | null;
}

/**
 * Stages 3-7 STUB return types. Per Session 36 directive Note 4:
 * placeholder shapes only at chunk 7.1a; full signatures resolve at
 * chunks 7.2 (Stage 3 classify) + 7.3 (Stages 4-7).
 */
export interface ClassificationStub {
  document_type: 'unknown';
  confidence: number;
  rationale: string;
}

export interface ExtractionStub {
  fields: Record<string, unknown>;
  ai_fallback_invoked: boolean;
}

export interface VendorMatchStub {
  vendor_id: string | null;
  confidence: number;
  match_type: 'no_match';
  candidate_alternatives: never[];
}

export interface RelationshipCandidateStub {
  candidate_type: 'no_match';
  candidates: never[];
}

export interface ProposalStub {
  proposal_type: 'stub_unimplemented';
  source_document_id: string;
  trace_id: string;
}
