import { z } from 'zod';
import { TimestamptzString } from '@/shared/schemas/common.schema';
import {
  LinkedEntityTypeSchema,
  LinkRoleSchema,
  VALID_PAIRS,
} from '@/shared/schemas/document-platform/sourceDocumentLink.schema';
import { DocumentTypeSchema } from '@/shared/schemas/document-platform/documentCase.schema';

// Layer 2 boundary: v1-active subsets only.
// Reserved values defined in shared enum types but rejected here.
//
// Per ADR-0018 §item 2 (Subsystem 1 — Ledger-State Candidate
// Completion output: linked_entity_type, linked_entity_id,
// link_role, confidence_score, candidate_features) +
// ADR-0011 §9 rule 3 (versioning via supersedes_candidate_id) +
// ADR-0014 §11 (incomplete-candidate handoff payload:
// document_type + classification_confidence + extracted_fields +
// vendor_match).
//
// Three top-level Zod surfaces:
//   - DocumentRelationshipCandidateSchema (row shape; what's
//     persisted; what's returned by readDocumentRelationshipCandidate)
//   - CompleteCandidateInputSchema (Subsystem 1 input boundary —
//     "incomplete candidate" per ADR-0014 §11 concept-prose)
//   - VendorMatchResultSchema + ReRoutingTriggerSchema (upstream
//     vocabularies; see comments below for inline trajectories)
//
// Sixth TimestamptzString consumer (chunks 2/3/4/5/6 + Phase 4
// chunk 1).

// -----------------------------------------------------------
// VendorMatchResultSchema — ADR-0014 §9 verbatim shape.
//
// Inlined here at Phase 4 chunk 1 pending Phase 7 pipeline
// schema-file structure. ADR-0014 §9 is the source of truth
// for the four-field outer shape and the 7-value match_type
// closed vocabulary; Subsystem 1 reads vendor_id to query
// Phase 5 substrate (open bills for this vendor). Lift-out
// trigger: second consumer emerges (Phase 7 pipeline,
// Phase 4 chunk 2+ Subsystem 2 ambiguity-resolution, Phase 5
// reviewer UI). Single-consumer-at-chunk-1 = inline;
// second-consumer-emerges = git mv to a dedicated file.
//
// candidate_alternatives is nested-permissive at chunk-1.
// Subsystem 1 at v1 uses vendor_id only; no consumer for the
// nested shape until Phase 4 chunk 2+ Subsystem 2 surfaces.
//
// match_type is a TS-only closed vocabulary per ADR-0014 §9
// (no DB CHECK; not persisted on a row; consumed at the
// service boundary only). Parallels ReRoutingTriggerSchema
// below as a second TS-only closed vocabulary at chunk-1.
// -----------------------------------------------------------
export const VendorMatchResultSchema = z.object({
  vendor_id: z.string().uuid().nullable(),
  confidence: z.number().min(0).max(1),
  match_type: z.enum([
    'exact_name',
    'alias',
    'tax_id',
    'email',
    'domain',
    'fuzzy_name',
    'no_match',
  ]),
  candidate_alternatives: z.array(z.record(z.unknown())),
});
export type VendorMatchResult = z.infer<typeof VendorMatchResultSchema>;

// -----------------------------------------------------------
// ReRoutingTriggerSchema — Subsystem 3 re-evaluation trigger
// identifier per ADR-0018 §item 4 closed list.
//
// 8 v1-active values; 2 reserved post-v1 (T7_vendor_master_merge,
// T9_document_supersession) — see comment block below. Per
// ADR-0018 §Schema-deltas + §Reserved-enums-and-audit-events, the
// trigger vocabulary is TS-only at v1: no DB enum, no DB CHECK.
// Layer 2 Zod boundary is the canonical defense; v1-active subset
// is what the schema admits; reserved values rejected at parse.
//
// Chunk-1 ships this Zod literal union as a forward-compatibility
// export. Chunk-1's documentRouterService.completeCandidate() does
// NOT consume the trigger vocabulary (Subsystem 1 doesn't fire
// triggers; it's a candidate-completion stage). Chunks 2+
// Subsystem 3 dispatcher will import this schema for:
//   - pre_commit_link_rerouted audit event payload validation
//     (event schema per ADR-0016 §6).
//   - router_re_evaluation_fired audit event payload validation
//     (event schema per ADR-0018 §Schema-deltas).
//
// Reserved post-v1 (defined in vocabulary, not emitted by any v1
// service write path):
//   - T7_vendor_master_merge — activation gated on the future
//     vendor-master domain ADR (Q33 forward-pointer) plus an
//     ADR-0018 amendment widening this enum.
//   - T9_document_supersession — activation gated on ADR-0016 §2
//     superseded_version link_role activation plus an ADR-0018
//     amendment widening this enum.
//
// Activation pattern: when a future chunk activates a reserved
// value, the chunk widens this Zod enum, amends ADR-0018, and
// amends the corresponding upstream ADR. Same chunk-spanning
// amendment shape as the chunks-5-6 reserved-enum-states
// discipline (DB ENUM widens + Zod widens + Layer 1 CHECK widens
// in lockstep). For this vocabulary, DB-side amendments are
// vacuous (no DB enum exists); Zod widens + ADR amendments only.
// -----------------------------------------------------------
export const ReRoutingTriggerSchema = z.enum([
  'T1_new_bill',
  'T2_new_payment',
  'T3_new_vendor_prepayment',
  'T4_new_vendor_credit',
  'T5_bill_state_transition',
  'T6_payment_state_transition',
  'T8_period_reopen',
  'T10_manual_override',
]);
export type ReRoutingTrigger = z.infer<typeof ReRoutingTriggerSchema>;

// -----------------------------------------------------------
// CompleteCandidateInputSchema — Subsystem 1 entry payload.
//
// The "incomplete candidate" per ADR-0014 §11 concept-prose.
// Pipeline (Phase 7 / ADR-0014's match-against-existing-state
// subsystem) produces this; Subsystem 1 consumes it via
// documentRouterService.completeCandidate(input, ctx) and
// produces zero or more DocumentRelationshipCandidate rows.
//
// Naming follows chunks-5-6 <Verb><Entity>InputSchema convention:
// documentRouterService.completeCandidate() → CompleteCandidateInputSchema.
//
// extracted_fields is permissive at chunk-1 — Subsystem 1 reads
// per-document-type field projections (e.g., for vendor_invoice:
// {invoice_amount, invoice_date, vendor_name, invoice_number}).
// The per-document-type field schemas are owned by ADR-0014 §6
// + agent_architecture_policy.md §2.1; chunk-1 doesn't import
// those schemas because they don't yet exist on disk (Phase 7
// territory). Lift to typed shape when Phase 7's per-type field
// schemas ship; same trigger as VendorMatchResultSchema lift-out.
//
// vendor_match is typed via VendorMatchResultSchema (consumed by
// Subsystem 1 to look up bills/payments/prepayments for the
// matched vendor). Per producer-vs-consumer asymmetry: consumed-
// from-upstream fields need typed access at the boundary;
// produce-by-this-service fields (candidate_features below) can
// be permissive at chunk-introduction time.
// -----------------------------------------------------------
export const CompleteCandidateInputSchema = z.object({
  document_case_id: z.string().uuid(),
  source_document_id: z.string().uuid(),
  document_type: DocumentTypeSchema,
  classification_confidence: z.number().min(0).max(1),
  extracted_fields: z.record(z.unknown()),
  vendor_match: VendorMatchResultSchema.nullable(),
  trace_id: z.string().uuid(),
});
export type CompleteCandidateInputRaw = z.input<typeof CompleteCandidateInputSchema>;
export type CompleteCandidateInput = z.infer<typeof CompleteCandidateInputSchema>;

// -----------------------------------------------------------
// DocumentRelationshipCandidateSchema — row shape.
//
// What's persisted on document_relationship_candidates; what's
// returned by read-back after create_candidates_with_audit. All
// 13 columns per the locked DDL.
//
// Pair-validity .refine() per c-2 lock at scope-lock 2026-05-13:
// Zod-import-shared VALID_PAIRS from sourceDocumentLink.schema.ts
// is the canonical Layer-1 defense; no duplicate DB CHECK on the
// candidate row (the matrix lives once at chunk-5; lockstep cost
// across two CHECKs avoided). The candidate row isn't a commit
// (source_document_links is the committed materialization;
// documentLinkService.create() Layer 1 CHECK rejects invalid
// pairs at commit time); an invalid pair on a candidate row is a
// Subsystem 1 implementation bug catchable here at row schema
// parse.
//
// candidate_features is permissive (z.record(z.unknown())) at
// chunk-1. Subsystem 1 produces the field; v1 readers don't
// depend on field-level structure; Subsystem 2 (chunks 2+) is
// the first downstream consumer. Tighten when Subsystem 2
// surfaces feature-shape requirements; ADR-0019 calibration
// governance is the governance-side owner of feature-shape
// post-v1.
//
// created_by: z.string() matches chunks-5-6 permissiveness. The
// Phase 4 chunk-1 substrate RPC hardcodes 'agent' inside the RPC
// (substrate invariant; automation-only writer at v1). Layer 2
// permissiveness is the discipline question deferred to retro-
// cycle per scope-lock retrospective inventory item 3.
// -----------------------------------------------------------
export const DocumentRelationshipCandidateSchema = z
  .object({
    id: z.string().uuid(),
    org_id: z.string().uuid(),
    document_case_id: z.string().uuid(),
    source_document_id: z.string().uuid(),
    supersedes_candidate_id: z.string().uuid().nullable(),
    linked_entity_type: LinkedEntityTypeSchema,
    linked_entity_id: z.string().uuid(),
    link_role: LinkRoleSchema,
    confidence_score: z.number().min(0).max(1),
    candidate_features: z.record(z.unknown()),
    trace_id: z.string().uuid(),
    created_at: TimestamptzString,
    created_by: z.string(),
  })
  .refine(
    (row) => VALID_PAIRS.has(`${row.linked_entity_type}|${row.link_role}`),
    {
      message: 'Invalid (linked_entity_type, link_role) pair per ADR-0016 §3 Table A',
      path: ['link_role'],
    },
  );
export type DocumentRelationshipCandidate = z.infer<typeof DocumentRelationshipCandidateSchema>;
