// core/evidence/completeness.ts
//
// ADR-0033 (Canonical Evidence Object Model, V1 Wave 2). Pure evidence rule:
// assess the descriptive completeness of an assembled canonical evidence
// object from the presence of its facets. No DB, no IO, no agent, no React
// (core/ purity, ADR-0020). The service (services/evidence) calls in; core/
// never calls back.
//
// Completeness is DESCRIPTIVE at Wave 2 (OQ-6) — it reports what is present,
// it does not reject anything. Enforcement (the object *required* for commit)
// lands at Wave 6, where the predicate is finalized; the live INV-DOC-001
// bill gate stays the single enforcement until then (D-0033.3/.4). "Complete"
// is kept GENERAL here (all four facets present) — the bill slice is NOT baked
// into the general object's definition.

import type { EvidenceCompleteness } from '@/shared/schemas/evidence/canonicalEvidenceObject.schema';

export interface EvidenceFacetCounts {
  documents: number;
  extractions: number;
  decisions: number;
  approvals: number;
}

export function assessCompleteness(facets: EvidenceFacetCounts): EvidenceCompleteness {
  const has_document = facets.documents > 0;
  const has_extraction = facets.extractions > 0;
  const has_decision = facets.decisions > 0;
  const has_approval = facets.approvals > 0;

  const present = [has_document, has_extraction, has_decision, has_approval].filter(Boolean).length;
  const status: EvidenceCompleteness['status'] =
    present === 0 ? 'empty' : present === 4 ? 'complete' : 'partial';

  return { has_document, has_extraction, has_decision, has_approval, status };
}
