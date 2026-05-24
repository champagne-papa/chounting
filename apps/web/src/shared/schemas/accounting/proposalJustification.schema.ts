// src/shared/schemas/accounting/proposalJustification.schema.ts
//
// Phase 8 chunk 9 (framing #5 Logic Receipt consumer) — formal Zod
// codification of the ProposalJustification shape (Layer 2 item #B).
// Resolves the Phase 7 chunk 7.3b permissive placeholder
// (justification: z.record(z.string(), z.unknown()).optional()) carried on
// ProposedMutation / ProposedAttachment / ProposedMutationBundle /
// ProposedAttachmentCard, and closes ADR-0007 Q30 (Logic Receipt
// reproducibility under Tier 2 pipelines).
//
// Three cohesive schemas (one file per Zod-cohesion discipline):
//   - PipelineStageRecordSchema — per-stage Tier 2 / Tier 2.5 trace record
//     per ADR-0007 Q30 resolution (lines 482-489): stage_name, input_hash,
//     output_hash, model?, timestamp.
//   - BundleAuditRecordSchema — bundle-composition audit trace per ADR-0012
//     §6 INV-AGENT-002 Logic-Receipt-for-bundles shape: bundle_id,
//     composition_at, child_proposal_ids, invariant_class.
//   - ProposalJustificationSchema — the Logic Receipt carried on a proposal.
//     pipeline_trace + bundle_audit_trace are REQUIRED (may be empty arrays);
//     the remaining Logic-Receipt fields (user_utterance, rule_id,
//     input_features, historical_match_count, confidence_score,
//     source_transactions) are optional per the Phase 7 chunk 7.3b
//     enumeration absorbed into ADR-0007 Q30.
//
// Field formats are kept deliberately permissive where ungrounded — the
// justification field has no v1 producer (proposalBuilder omits it at v1),
// so this schema is the forward contract for later pipeline wiring, not a
// constraint fitted to existing data (prediction-grounding discipline).

import { z } from 'zod';

// Per-stage pipeline trace record — ADR-0007 Q30 (PipelineStageRecord).
export const PipelineStageRecordSchema = z
  .object({
    stage_name: z.string(),
    input_hash: z.string(),
    output_hash: z.string(),
    model: z.string().optional(),
    timestamp: z.string(),
  })
  .strict();
export type PipelineStageRecord = z.infer<typeof PipelineStageRecordSchema>;

// Bundle-composition audit record — ADR-0012 §6 INV-AGENT-002 bundle Logic
// Receipt. child_proposal_ids carries the bundle's child proposal ids in
// committed order; invariant_class names the §7 invariant evaluated.
export const BundleAuditRecordSchema = z
  .object({
    bundle_id: z.string().uuid(),
    composition_at: z.string().datetime(),
    child_proposal_ids: z.array(z.string().uuid()),
    invariant_class: z.string(),
  })
  .strict();
export type BundleAuditRecord = z.infer<typeof BundleAuditRecordSchema>;

// ProposalJustification — the Logic Receipt carried on a proposal.
export const ProposalJustificationSchema = z
  .object({
    // Required reproducibility traces (may be empty arrays).
    pipeline_trace: z.array(PipelineStageRecordSchema),
    bundle_audit_trace: z.array(BundleAuditRecordSchema),
    // Optional Logic-Receipt fields per Phase 7 chunk 7.3b enumeration.
    user_utterance: z.string().optional(),
    rule_id: z.string().optional(),
    input_features: z.record(z.string(), z.unknown()).optional(),
    historical_match_count: z.number().int().optional(),
    confidence_score: z.number().optional(),
    source_transactions: z.array(z.string()).optional(),
  })
  .strict();
export type ProposalJustification = z.infer<typeof ProposalJustificationSchema>;
