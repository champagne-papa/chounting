// src/agent/orchestrator/extraction/stages/stubsStages3to7.ts
//
// Stages 3-7 STUB returning typed placeholder values per ADR-0014 §1
// stage signature contract. Per Session 36 directive Note 4: STUBs are
// forward-compatible by design — return PLACEHOLDER shapes, not full
// signature resolution. Full signatures resolve at:
//   - Stage 3 (classify) — chunk 7.2 (classifier active wiring)
//   - Stages 4-7 (extract / matchVendor / matchAgainstExistingState /
//     buildProposal) — chunk 7.3 (extractor + matcher + relationship
//     candidate + proposal builder active wiring)
//
// Per ADR-0014 §1 illustrative orchestrator shape: each stage takes
// typed input from prior stage(s) + traceId and returns a typed output.
// At chunk 7.1a, stubs accept input but return synthetic
// placeholder values for downstream-stub testing.

import type {
  ClassificationResult,
  ExtractionStub,
  VendorMatchStub,
  RelationshipCandidateStub,
  ProposalStub,
  PipelineStageRecord,
  DocumentArtifactRow,
} from '../types';
import crypto from 'crypto';

function hash(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex');
}

// classifyDocumentTypeStub removed at chunk 7.2 — Stage 3 active wiring
// replaces the stub. coordinateTiers + Tier A/C/D rule modules + AI
// fallback ship at apps/web/src/agent/orchestrator/extraction/classifier/.

export function extractFieldsStub(
  documentType: string,
  artifact: DocumentArtifactRow,
  trace_id: string,
): { result: ExtractionStub; trace_record: PipelineStageRecord } {
  void trace_id;
  return {
    result: {
      fields: {},
      ai_fallback_invoked: false,
    },
    trace_record: {
      stage_name: 'extract_stub',
      input_hash: hash(documentType + JSON.stringify(artifact)),
      output_hash: hash('{}'),
      model: null,
      timestamp: new Date().toISOString(),
    },
  };
}

export function matchVendorStub(
  org_id: string,
  vendorField: unknown,
  trace_id: string,
): { result: VendorMatchStub; trace_record: PipelineStageRecord } {
  void trace_id;
  return {
    result: {
      vendor_id: null,
      confidence: 0.0,
      match_type: 'no_match',
      candidate_alternatives: [],
    },
    trace_record: {
      stage_name: 'match_vendor_stub',
      input_hash: hash(org_id + JSON.stringify(vendorField)),
      output_hash: hash('no_match'),
      model: null,
      timestamp: new Date().toISOString(),
    },
  };
}

export function matchAgainstExistingStateStub(
  org_id: string,
  classification: ClassificationResult,
  extracted: ExtractionStub,
  vendorMatch: VendorMatchStub,
  trace_id: string,
): { result: RelationshipCandidateStub; trace_record: PipelineStageRecord } {
  void trace_id;
  return {
    result: {
      candidate_type: 'no_match',
      candidates: [],
    },
    trace_record: {
      stage_name: 'match_existing_state_stub',
      input_hash: hash(
        org_id +
          JSON.stringify({ classification, extracted, vendorMatch }),
      ),
      output_hash: hash('no_match'),
      model: null,
      timestamp: new Date().toISOString(),
    },
  };
}

export function buildProposalStub(args: {
  source_document_id: string;
  classification: ClassificationResult;
  extracted: ExtractionStub;
  vendorMatch: VendorMatchStub;
  relCandidate: RelationshipCandidateStub;
  trace_id: string;
}): { result: ProposalStub; trace_record: PipelineStageRecord } {
  return {
    result: {
      proposal_type: 'stub_unimplemented',
      source_document_id: args.source_document_id,
      trace_id: args.trace_id,
    },
    trace_record: {
      stage_name: 'build_proposal_stub',
      input_hash: hash(JSON.stringify(args)),
      output_hash: hash('stub_unimplemented'),
      model: null,
      timestamp: new Date().toISOString(),
    },
  };
}
