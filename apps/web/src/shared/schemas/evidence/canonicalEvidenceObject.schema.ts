// shared/schemas/evidence/canonicalEvidenceObject.schema.ts
//
// ADR-0033 (Canonical Evidence Object Model, V1 Wave 2). The transient,
// assembled canonical evidence object that services/evidence produces by
// reference from the live, fragmented evidence substrate (assemble-on-read;
// D-0033.3). General by-reference shape (D-0033.1/.2): a generic reference-
// chain core + a typed domain extension. AP is one consumer; AP specifics
// ride `domain_extension`, never the spine. No row is persisted at Wave 2.

import { z } from 'zod';

// --- facet reference shapes (by-reference; the object holds refs, not copies) ---

export const EvidenceDocumentRefSchema = z
  .object({
    source_document_id: z.string().uuid(),
    link_role: z.string(),
    content_hash: z.string(),
    original_filename: z.string(),
    storage_status: z.string().nullable(),
  })
  .strict();

export const EvidenceExtractionRefSchema = z
  .object({
    artifact_id: z.string().uuid(),
    source_document_id: z.string().uuid(),
    engine: z.string(),
    confidence: z.number().nullable(),
  })
  .strict();

export const EvidenceDecisionRefSchema = z
  .object({
    rule_evaluation_log_id: z.string().uuid(),
    rule_id: z.string().uuid(),
    effective_action: z.string().nullable(),
    disposition: z.string().nullable(),
  })
  .strict();

export const EvidenceApprovalRefSchema = z
  .object({
    audit_log_id: z.string().uuid(),
    action: z.string(),
    user_id: z.string().uuid().nullable(),
  })
  .strict();

// --- completeness (descriptive at Wave 2; OQ-6). Enforced at Wave 6. ---

export const EvidenceCompletenessSchema = z
  .object({
    has_document: z.boolean(),
    has_extraction: z.boolean(),
    has_decision: z.boolean(),
    has_approval: z.boolean(),
    status: z.enum(['complete', 'partial', 'empty']),
  })
  .strict();

// --- the canonical evidence object (general spine + typed domain extension) ---

export const CanonicalEvidenceObjectSchema = z
  .object({
    subject_type: z.string(),
    subject_id: z.string().uuid(),
    org_id: z.string().uuid(),
    trace_ids: z.array(z.string().uuid()),
    documents: z.array(EvidenceDocumentRefSchema),
    extractions: z.array(EvidenceExtractionRefSchema),
    decisions: z.array(EvidenceDecisionRefSchema),
    approvals: z.array(EvidenceApprovalRefSchema),
    completeness: EvidenceCompletenessSchema,
    // typed per-domain extension (AP one consumer); null at Wave 2's general slice.
    domain_extension: z.unknown().nullable(),
  })
  .strict();

export type EvidenceDocumentRef = z.infer<typeof EvidenceDocumentRefSchema>;
export type EvidenceExtractionRef = z.infer<typeof EvidenceExtractionRefSchema>;
export type EvidenceDecisionRef = z.infer<typeof EvidenceDecisionRefSchema>;
export type EvidenceApprovalRef = z.infer<typeof EvidenceApprovalRefSchema>;
export type EvidenceCompleteness = z.infer<typeof EvidenceCompletenessSchema>;
export type CanonicalEvidenceObject = z.infer<typeof CanonicalEvidenceObjectSchema>;
