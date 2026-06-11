// src/shared/schemas/spend/vendorMatch.types.ts
//
// Class D arc T3 (services→agent cleanup, 2026-06-06) — the four
// Stage-5 vendor-matcher interfaces, relocated VERBATIM (JSDoc
// included) from agent/orchestrator/extraction/types.ts to a
// neutral shared home per ADR-0020 Appendix A: the matcher
// IMPLEMENTATION lives in services (vendorService), so a
// services-layer consumer importing agent-owned types was the
// zero-precedent reverse edge. Both layers may import shared;
// agent types.ts re-exports these so agent-side consumers are
// unchanged.
//
// Deliberately NOT unified with VendorMatchResultSchema in
// document-platform/documentRelationshipCandidate.schema.ts —
// that Zod shape is the ADR-0014 §9 spec shape (7-value
// match_type incl. 'alias'; loose candidate_alternatives) and
// diverges from this implementation shape (6 values, alias
// dropped per the chunk 7.3a Phase A finding below; typed
// candidates). Pre-existing spec-vs-impl divergence, recorded at
// the Class D arc close — unifying would silently widen types.

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
