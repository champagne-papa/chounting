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
 * Orchestrator entry function output. At chunk 7.3b (Stages 0-7 active +
 * commit composite active), the output carries the accumulated
 * pipeline_trace + status discriminator + proposal_id (populated on
 * ledger-touching commits per Stage 7 commit composite).
 *
 * 'deferred_chunk_7_3b_pending_activation' status added at chunk 7.3a
 * per Iteration 2 Option β: TS-only union extension as cross-chunk
 * deferral mechanism. Chunk 7.3b activation makes this value
 * defined-but-not-emitted; preserved per ADR-0022 additive
 * provenance-preserving discipline (union shrinkage is non-additive).
 * Per Iteration 2 Note 4 sub-recommendation: JSDoc @deprecated annotation
 * prevents drift via copy-paste from active code while preserving
 * TypeScript exhaustiveness for defensive consumer coverage.
 */
export interface IngestDocumentOutput {
  status:
    /** V1-UNREACHABLE since Wave 6 D2.1 T4: the attachment and unknown
     *  exits (the last V1 emitters) reconciled to 'parked_unposted'.
     *  'committed' is reserved for the post-V1 governed auto-commit
     *  re-wire — its appearance at V1 is a bleed-stop-regression signal
     *  (the hotfix-spec §5 flipped-assertion logic, now total). */
    | 'committed'
    | 'dedup_short_circuit'
    | 'pipeline_failed'
    /** Wave -1 A-now bleed-stop (ADR-0007 §Tier 2 "V1 re-scoping of the Q78
     *  auto-commit exercise", ratified 2026-05-31). A proposal was built but
     *  deliberately NOT posted — the ungoverned auto-commit is disabled. No
     *  ledger write; proposal_id is null. Since Wave 6 D2.1 the document_case
     *  no longer stays at received: it routes to needs_review (the terminal
     *  hand-off — INV-WORKFLOW-002) via the Stage-6.5 advancement + the
     *  matched→needs_review hand-offs; the unknown-type park routes via
     *  enqueueException('unknown_document_type'). Emitted by the entry-card,
     *  bundle, attachment, and unknown exits. Governed auto-commit returns
     *  per-rule post-V1 (rung + confidence + eval + real coding), re-wiring
     *  the commit composite to the preserved commit* functions. See
     *  docs/09_briefs/v1/2026-05-31-a-now-hotfix-change-spec.md. */
    | 'parked_unposted'
    /** @deprecated chunk 7.3b activation made this status defined-but-not-emitted
     *  per ADR-0022 additive discipline; future cleanup post-Phase-7. */
    | 'deferred_chunk_7_3b_pending_activation';
  pipeline_trace: PipelineStageRecord[];
  proposal_id: string | null; // populated at chunk 7.3b Stage 7 commit composite
  failure_class: PipelineFailureClass | null; // populated on failure paths
  deferred_reason?: string; // populated when status='deferred_chunk_7_3b_pending_activation' (post-activation: defined-but-not-emitted)
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
 *
 * Chunk 7.2 supersedes ClassificationStub with ClassificationResult
 * (below); ClassificationStub retained for backward compatibility
 * with stage 4-7 stub signatures until chunk 7.3 active wiring.
 */
export interface ClassificationStub {
  document_type: 'unknown';
  confidence: number;
  rationale: string;
}

/**
 * Stage 3 classifier active types per Phase 7 chunk 7.2 + ADR-0014 §7.
 * Three-tier strategy: Tier A rule-based; Tier C Claude Sonnet AI
 * fallback; Tier D unknown fallback. ClassificationResult is the
 * orchestrator-grade output across all three tiers.
 *
 * Per ADR-0011 §6 v1-active document_type enum: vendor_invoice,
 * receipt, payment_confirmation, unknown.
 */
export type DocumentType =
  | 'vendor_invoice'
  | 'receipt'
  | 'payment_confirmation'
  | 'unknown';

export interface ClassificationResult {
  documentType: DocumentType;
  confidence: number;
  rationale: string;
  tier: 'A' | 'C' | 'D';
}

export interface ClassificationInput {
  ocrArtifact: DocumentArtifactRow;
  source_document_id: string;
  trace_id: string;
}

/**
 * Tier A binary match-or-no-match output per Sub-Q8 lock. When matched,
 * carries documentType + intrinsic confidence + rationale; on no-match
 * the orchestrator falls through to Tier C (Sub-Q8 binary short-circuit).
 */
export type TierAOutput =
  | {
      matched: true;
      documentType: DocumentType;
      confidence: number;
      rationale: string;
    }
  | { matched: false };

/**
 * Tier C Claude Sonnet AI fallback output per ADR-0014 §8. Carries the
 * full ClassificationResult-equivalent shape (documentType + confidence
 * + rationale) plus a discriminator for downstream Zod validation gate.
 *
 * `valid` reflects Zod-validation gate outcome; `confidenceAboveThreshold`
 * reflects per-document-type threshold gate per ADR-0014 §7. Both gates
 * must pass for Tier C output to populate ClassificationResult; failure
 * routes to Tier D ('unknown') per Sub-Q8.
 */
export type TierCOutput =
  | {
      valid: true;
      documentType: DocumentType;
      confidence: number;
      rationale: string;
      confidenceAboveThreshold: boolean;
    }
  | {
      valid: false;
      reason: 'zod_validation_failed' | 'budget_exhausted' | 'invocation_failed';
    };

/**
 * Tier D 'unknown' output per Sub-Q8. Always documentType='unknown';
 * routes to exception queue per ADR-0011 §13.
 */
export interface TierDOutput {
  documentType: 'unknown';
  rationale: string;
}

/**
 * Stage 4 extractor input. Phase 7 chunk 7.3a active wiring.
 */
export interface ExtractFieldsInput {
  documentType: DocumentType;
  ocrArtifact: DocumentArtifactRow;
  source_document_id: string;
  trace_id: string;
}

/**
 * Stage 4 extractor output. Per-document-type field shape is permissive
 * (Record<string, unknown>) at the orchestrator boundary; downstream
 * Stage 5 + Stage 6 consume against per-document-type extraction
 * schemas at typed boundaries.
 */
export interface ExtractionResult {
  fields: Record<string, unknown>;
  ai_fallback_invoked: boolean;
  trace_records: PipelineStageRecord[];
}

/**
 * Stage 5 vendor matcher input. Reads vendor identity-and-matching
 * fields from extraction result per ADR-0011 §11 Reading B boundary.
 */
export interface VendorMatchInput {
  org_id: string;
  vendorField: VendorIdentityFields;
  trace_id: string;
}

/**
 * Vendor identity-and-matching fields per ADR-0007 §Tier 2 Read boundary
 * + ADR-0014 §9. Stage 5 matcher reads name + tax_id + email + domain
 * extracted from Stage 4 output.
 */
export interface VendorIdentityFields {
  vendor_name?: string;
  vendor_text?: string;
  merchant_text?: string;
  tax_id?: string;
  email?: string;
}

/**
 * Stage 5 vendor matcher result per ADR-0014 §9. 6-strategy cascade
 * (exact_name + tax_id + email + domain + fuzzy_name + no_match) at
 * chunk 7.3a per Step 15 Phase A finding (vendors.aliases column
 * absent; alias strategy dropped from 7-strategy original cascade;
 * banked at chunk 7.3a close report).
 */
export interface VendorMatchResult {
  vendor_id: string | null;
  confidence: number;
  match_type:
    | 'exact_name'
    | 'tax_id'
    | 'email'
    | 'domain'
    | 'fuzzy_name'
    | 'no_match';
  candidate_alternatives: VendorCandidate[];
}

export interface VendorCandidate {
  vendor_id: string;
  vendor_name: string;
  match_type: VendorMatchResult['match_type'];
  confidence: number;
}

/**
 * Stage 7 proposal builder input. Phase 7 chunk 7.3a active wiring.
 * Consumes Stage 3 (classification) + Stage 4 (extraction) + Stage 5
 * (vendor match) + Stage 6 (relationship candidate) outputs.
 */
export interface ProposalBuilderInput {
  source_document_id: string;
  classification: ClassificationResult;
  extractedFields: Record<string, unknown>;
  vendorMatch: VendorMatchResult | null;
  relationshipCandidates: RelationshipCandidate[];
  trace_id: string;
}

/**
 * Stage 6 documentRouterService.completeCandidate output shape (relaxed
 * to avoid cross-module dependency cycles; canonical type
 * DocumentRelationshipCandidate at
 * @/shared/schemas/document-platform/documentRelationshipCandidate.schema).
 * Orchestrator uses .length and confidence_score only at chunk 7.3a;
 * downstream Stage 7 proposalBuilder consumes via brief-task-routing
 * matrix (number-of-candidates discriminator).
 */
export interface RelationshipCandidate {
  id: string;
  document_case_id: string;
  source_document_id: string;
  linked_entity_type: string;
  linked_entity_id: string | null;
  link_role: string;
  confidence_score: number;
}

/**
 * Stage 7 proposal builder output per Phase 7 chunk 7.3b Iteration 2
 * Option γ activation. ProposalResult.kind 3-value union at chunk 7.3b
 * activation (removed transitional 'deferred_chunk_7_3b_pending_activation'
 * discriminator from chunk 7.3a); IngestDocumentOutput.status preserves
 * the deferred union member per ADR-0022 additive discipline
 * (defined-but-not-emitted post-activation).
 *
 *   - 'proposed_entry_card': vendor_invoice → post_bill OR
 *     payment_confirmation cited-bill → record_bill_payment.
 *   - 'proposed_attachment_card': receipt → attach_payment_evidence,
 *     payment_confirmation no-cited-bill → attach_payment_evidence,
 *     vendor_invoice with prior bill match → attach_invoice_to_existing_bill.
 *   - 'proposed_mutation_bundle': born-paid case → born_paid_bill bundle
 *     (post_bill + record_bill_payment children per ADR-0012 + ADR-0014 §11).
 */
export type ProposalResult =
  | {
      kind: 'proposed_entry_card';
      card: unknown; // ProposedEntryCard shape per @/shared/schemas/accounting/proposedEntryCard.schema
    }
  | {
      kind: 'proposed_attachment_card';
      card: unknown; // ProposedAttachmentCard shape per @/shared/schemas/document-platform/proposedAttachmentCard.schema
    }
  | {
      kind: 'proposed_mutation_bundle';
      bundle: unknown; // ProposedMutationBundle shape per @/shared/schemas/accounting/proposedMutationBundle.schema
    };

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
