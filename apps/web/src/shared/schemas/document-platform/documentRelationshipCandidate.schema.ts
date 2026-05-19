import { z } from 'zod';
import { TimestamptzString } from '@/shared/schemas/common.schema';
import {
  LinkedEntityTypeSchema,
  LinkRoleSchema,
  VALID_PAIRS,
} from '@/shared/schemas/document-platform/sourceDocumentLink.schema';
import { DocumentTypeSchema } from '@/shared/schemas/document-platform/documentCase.schema';
import { ExceptionReasonSchema } from '@/shared/schemas/document-platform/exceptionQueueEntry.schema';

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

// -----------------------------------------------------------
// ResolveCandidatesInputSchema — Subsystem 2 entry payload.
//
// The case-id-driven shape per R3.2 lock: Subsystem 2 reads the
// candidate set fresh from document_relationship_candidates (Tier
// 2.5 substrate-as-source-of-truth) filtered by document_case_id.
// No current_state field — state-transition legality is enforced
// at the substrate layer via the branch (a) atomic RPC's
// IF NOT FOUND RAISE check_violation guard. Symmetric forensic-
// replay with chunk-1's CompleteCandidateInputSchema; forward-
// compat with Subsystem 3 supersession filters at chunks 3+.
//
// Naming follows chunks-5-6 + chunk-1 <Verb><Entity>InputSchema
// convention: documentRouterService.resolveCandidates() →
// ResolveCandidatesInputSchema.
// -----------------------------------------------------------
export const ResolveCandidatesInputSchema = z.object({
  document_case_id: z.string().uuid(),
  trace_id: z.string().uuid(),
});
export type ResolveCandidatesInputRaw = z.input<typeof ResolveCandidatesInputSchema>;
export type ResolveCandidatesInput = z.infer<typeof ResolveCandidatesInputSchema>;

// -----------------------------------------------------------
// RouterDecisionSchema — Subsystem 2 service return shape.
//
// Eight fields capturing the routing decision per R3.1 lock.
// Iff-constraints on (branch, winner_candidate_id,
// exception_queue_entry_id, exception_reason) enforced via
// .refine() at Layer 2 — schema-defense-on-internally-constructed-
// values (chunk-1 pair-validity-family discriminator): the shape
// is service-emitted, no external-input path, so .refine() at the
// schema layer is the canonical defense. No duplicate DB CHECK
// (the schema is on a return type, not a persisted row).
//
// Branch (a): winner_candidate_id is non-null; exception_queue_entry_id
// and exception_reason are null (head pointer set; case → matched).
// Branches (b)/(c): winner_candidate_id is null; exception_queue_entry_id
// and exception_reason are non-null (chunk-6 enqueueException
// invoked; case → needs_review). v1 envelope-less collapse per
// F-J-η preserves the branch identifier here for forward-compat
// with envelope-shipping chunks.
// -----------------------------------------------------------
export const RouterDecisionSchema = z
  .object({
    branch: z.enum(['a', 'b', 'c']),
    document_case_id: z.string().uuid(),
    trace_id: z.string().uuid(),
    candidate_set_ids: z.array(z.string().uuid()),
    ambiguity_margin_computed: z.number().nullable(),
    winner_candidate_id: z.string().uuid().nullable(),
    exception_queue_entry_id: z.string().uuid().nullable(),
    exception_reason: ExceptionReasonSchema.nullable(),
  })
  .refine(
    (d) => {
      if (d.branch === 'a') {
        return (
          d.winner_candidate_id !== null &&
          d.exception_queue_entry_id === null &&
          d.exception_reason === null
        );
      }
      return (
        d.winner_candidate_id === null &&
        d.exception_queue_entry_id !== null &&
        d.exception_reason !== null
      );
    },
    {
      message:
        'RouterDecision iff: branch=a ⇔ winner non-null + exception fields null; branch=b/c ⇔ winner null + exception fields non-null',
      path: ['branch'],
    },
  );
export type RouterDecision = z.infer<typeof RouterDecisionSchema>;

// -----------------------------------------------------------
// DecisionRecordBeforeStateSchema — audit_log.before_state JSONB
// shape for the chunk-2 decision-record row.
//
// Ten fields per R3.3.x.α lock + F-J-ζ forensic-payload self-
// containment for ADR-0019 calibration-cycle queryability:
//   - Explicit top_confidence + runner_up_confidence (redundant
//     with confidence_scores map + candidate_set_ids ordered
//     derivation) for ADR-0019 §7 query-path simplification.
//   - ambiguity_margin_threshold captures at-decision-time
//     AMBIGUITY_MARGIN_V1_PROVISIONAL value per ADR-0019 §13
//     audit-trail invariance.
//   - document_type as calibration-cycle stratification key
//     per ADR-0019 §9 row 1.
//
// Iff-constraints enforced via .refine():
//   - Branch ⇔ winner_candidate_id / exception_reason (same
//     iff as RouterDecisionSchema).
//   - N=0 ⇔ top_confidence null.
//   - N<2 ⇔ runner_up_confidence null AND
//     ambiguity_margin_computed null.
//
// Schema-defense-on-internally-constructed-values: service
// constructs the JSONB payload from internal computation
// (margin derivation + threshold capture); .refine() catches
// service bugs at Layer 2 before INSERT into audit_log.
// -----------------------------------------------------------
export const DecisionRecordBeforeStateSchema = z
  .object({
    branch: z.enum(['a', 'b', 'c']),
    candidate_set_ids: z.array(z.string().uuid()),
    confidence_scores: z.record(z.number()),
    top_confidence: z.number().nullable(),
    runner_up_confidence: z.number().nullable(),
    ambiguity_margin_computed: z.number().nullable(),
    ambiguity_margin_threshold: z.number(),
    winner_candidate_id: z.string().uuid().nullable(),
    exception_reason: ExceptionReasonSchema.nullable(),
    document_type: DocumentTypeSchema,
  })
  .refine(
    (s) => {
      if (s.branch === 'a') {
        if (s.winner_candidate_id === null || s.exception_reason !== null) {
          return false;
        }
      } else {
        if (s.winner_candidate_id !== null || s.exception_reason === null) {
          return false;
        }
      }
      const N = s.candidate_set_ids.length;
      if (N === 0 && s.top_confidence !== null) return false;
      if (N >= 1 && s.top_confidence === null) return false;
      if (N < 2) {
        if (s.runner_up_confidence !== null) return false;
        if (s.ambiguity_margin_computed !== null) return false;
      } else {
        if (s.runner_up_confidence === null) return false;
        if (s.ambiguity_margin_computed === null) return false;
      }
      return true;
    },
    {
      message:
        'DecisionRecordBeforeState iff: branch ⇔ winner/exception + N=0 ⇔ top_confidence null + N<2 ⇔ runner_up_confidence/margin null',
      path: ['branch'],
    },
  );
export type DecisionRecordBeforeState = z.infer<typeof DecisionRecordBeforeStateSchema>;

// -----------------------------------------------------------
// RouterDecisionOutcomeSchema — decision_outcome vocabulary
// introduced fresh at Phase 4 chunk 3 per ADR-0018 §Schema-deltas
// + Round 5.b'-α-modified extension.
//
// Five values: four ADR-0018-spec'd (no_change /
// re_routed_from_exception / re_routed_to_exception /
// candidate_superseded) plus one chunk-3-new (dispatch_failed)
// for per-case service-layer failures caught at the dispatcher's
// fan-out loop (emitted in a SEPARATE small transaction; PG-
// rollback failures within the per-case transaction stay silent
// by mechanism since rollback voids any in-transaction audit row).
//
// Per ADR-0018 §Schema-deltas, decision_outcome is documented as
// event-payload constraint, NOT a DB CHECK closed enum. So this
// schema is Layer 2 (Zod) + Layer 3 (TS const + service emission)
// only; no Layer 1 DB CHECK addition. Substrate-now-amendment-
// later: ADR-0018 §Schema-deltas amendment to formally add
// 'dispatch_failed' is retrospective inventory candidate (Phase 4
// retrospective batch). Pre-amendment substrate ships here per
// chunk-6 backfill_vendor_prepayment_suggested precedent.
// -----------------------------------------------------------
export const RouterDecisionOutcomeSchema = z.enum([
  'no_change',                 // ADR-0018 §Schema-deltas
  're_routed_from_exception',  // ADR-0018 §Schema-deltas — case re-routed out of exception queue (paired with cancel_exception_with_audit)
  're_routed_to_exception',    // ADR-0018 §Schema-deltas — case freshly enqueued to exception queue
  'candidate_superseded',      // ADR-0018 §Schema-deltas — new candidate row inserted with supersedes_candidate_id chain
  'dispatch_failed',           // chunk-3-new — service-layer failure caught at dispatcher per-case loop; emitted in separate small transaction
]);
export type RouterDecisionOutcome = z.infer<typeof RouterDecisionOutcomeSchema>;

// -----------------------------------------------------------
// DispatchTriggerInputSchema — Subsystem 3 dispatcher input
// envelope per ADR-0018 §item 4. Zod discriminated union on
// trigger_type with per-branch payload typing per Round 5.d-i.
//
// Framing F lock: 6 v1-active-emission-wired branches
// (T1_new_bill, T2_new_payment, T3_new_vendor_prepayment,
// T5_bill_state_transition, T8_period_reopen, T10_manual_override).
// T2_new_payment activated at Phase 5.1 chunk 5.1b (paymentService.ts
// greenfield ship + dispatcher slot activation per Round 4 §5.2 +
// Sub-Q2 2.β LOCKED); pre-chunk-5.1b state was 5 branches with T2
// reserved per "land schema with consumer code" reverse-discipline.
// T4/T6 NOT in this union — vendorCreditService.ts doesn't exist at
// v1 (vendor_credits substrate reserved post-v1 per Phase 2.5
// Commit A); their dispatcher branches add to this union when
// vendorCreditService ships in a future Phase 5 amendment chunk.
// T7_vendor_master_merge and T9_document_supersession are reserved
// post-v1 per ADR-0018 (separate from chunk-3 framing).
//
// The ReRoutingTriggerSchema (chunk-1 ship; 8 v1-active values
// plus 2 reserved) is a vocabulary-level Zod schema for audit event
// payload validation; this DispatchTriggerInputSchema is the
// envelope-level dispatcher-input schema — admits only what callers
// can construct. The two schemas serve different layers.
// -----------------------------------------------------------
export const DispatchTriggerInputSchema = z.discriminatedUnion('trigger_type', [
  z.object({
    trigger_type: z.literal('T1_new_bill'),
    org_id: z.string().uuid(),
    bill_id: z.string().uuid(),
    vendor_id: z.string().uuid(),
    trace_id: z.string().uuid(),
  }),
  // T2_new_payment — Phase 5.1 chunk 5.1b activates this dispatcher
  // slot (reserved at Phase 4 chunk 3 Framing F per "land schema with
  // consumer code" reverse-discipline). T2_new_payment LITERAL exists
  // at ReRoutingTriggerSchema line 111 (Phase 4 chunk 3 substrate;
  // unchanged at chunk 5.1b). chunk 5.1b adds the BRANCH to this
  // discriminated union. Emit-side: paymentService.record() fires this
  // dispatch post-commit (Pattern B external-wrap + P3-i F-J-4
  // best-effort isolation). Admit-side: computeT1T2T3FanOut shares the
  // org-wide stranded-cases fan-out semantic with T1/T3 (new-domain-
  // entity-created class).
  z.object({
    trigger_type: z.literal('T2_new_payment'),
    org_id: z.string().uuid(),
    payment_id: z.string().uuid(),
    vendor_id: z.string().uuid(),
    bill_id: z.string().uuid(),
    trace_id: z.string().uuid(),
  }),
  z.object({
    trigger_type: z.literal('T3_new_vendor_prepayment'),
    org_id: z.string().uuid(),
    vendor_prepayment_id: z.string().uuid(),
    vendor_id: z.string().uuid(),
    trace_id: z.string().uuid(),
  }),
  z.object({
    trigger_type: z.literal('T5_bill_state_transition'),
    org_id: z.string().uuid(),
    bill_id: z.string().uuid(),
    old_lifecycle_state: z.enum(['approved_for_payment', 'partially_paid']),
    new_lifecycle_state: z.enum(['fully_paid', 'voided']),
    trace_id: z.string().uuid(),
  }),
  z.object({
    trigger_type: z.literal('T8_period_reopen'),
    org_id: z.string().uuid(),
    period_id: z.string().uuid(),
    trace_id: z.string().uuid(),
  }),
  z.object({
    trigger_type: z.literal('T10_manual_override'),
    org_id: z.string().uuid(),
    case_id: z.string().uuid(),
    trace_id: z.string().uuid(),
  }),
]);
export type DispatchTriggerInputRaw = z.input<typeof DispatchTriggerInputSchema>;
export type DispatchTriggerInput = z.infer<typeof DispatchTriggerInputSchema>;
