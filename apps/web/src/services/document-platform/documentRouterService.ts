// src/services/document-platform/documentRouterService.ts
//
// Phase 4 Relationship Router service. Three public functions per
// ADR-0018 §item 1 three-subsystem decomposition:
//   - completeCandidate(input, ctx) — Subsystem 1 (Ledger-State
//     Candidate Completion) per ADR-0018 §item 2. Shipped at
//     chunk 1 (6f3c2ad). Given an "incomplete candidate" per
//     ADR-0014 §11 (document_type + extracted fields + vendor
//     match), reads committed AP/Spend state via Tier 2.5 cross-
//     domain reads, produces zero or more DocumentRelationshipCandidate
//     rows via atomic batch RPC. Does NOT transition state on any
//     exit path (M3-α discipline).
//   - resolveCandidates(input, ctx) — Subsystem 2 (Ambiguity
//     Resolution) per ADR-0018 §item 3. Shipped at chunk 2. Reads
//     the candidate set for a document_case (Tier 2.5 substrate-
//     as-source-of-truth; no cross-domain reads at Subsystem 2 —
//     narrower than Subsystem 1's profile), computes the
//     ambiguity margin against AMBIGUITY_MARGIN_V1_PROVISIONAL,
//     and routes the case via three branches:
//       (a) single winner (N=1, or N≥2 with margin ≥ threshold) —
//           atomic set_case_head_pointer_with_audit RPC writes head
//           pointer + transitions case classified → matched +
//           emits decision-record + state-transition audit rows.
//       (b) ambiguous (N≥2 with margin < threshold) — pure-audit
//           record_router_decision RPC emits decision-record row;
//           cross-service enqueueException with
//           exception_reason='multi_candidate_ambiguity' transitions
//           case classified → needs_review and creates queue entry.
//       (c) unmatched (N=0) — same as (b) but
//           exception_reason='unmatched_router_candidate'.
//   - dispatchTrigger(input, ctx) — Subsystem 3 (Re-Evaluation Logic)
//     per ADR-0018 §item 4. Shipped at chunk 3. Deterministic TS
//     dispatcher consuming typed trigger events from AP/Spend domain
//     services (T1/T3/T5/T8/T10 v1-active-emission-wired branches;
//     T2/T4/T6 reserved pending paymentService.ts +
//     vendorCreditService.ts future Phase 5 amendment; T7/T9 reserved
//     post-v1 per ADR-0018). Fan-out across pre-commit cases per
//     trigger semantic; per-case withInvariants transaction
//     (5.a-i lock); per-trigger-type failure policy (5.b-i —
//     T1/T3/T5/T8 log+skip+continue; T10 fail-and-propagate);
//     post-commit dispatch from Phase 5/2/1 callers (5.c-P3-i —
//     caller's primary mutation commits first; dispatcher fires
//     after); Zod discriminated union envelope (5.d-i); direct
//     cross-service call (5.e-i — no event-bus indirection at v1).
//     Emits router_re_evaluation_fired audit event per case (7
//     fields per ADR-0018 §Schema-deltas); on service-layer
//     failure caught at the per-case loop, emits dispatch_failed
//     audit row in SEPARATE small transaction (PG-rollback
//     failures within per-case transaction stay silent by
//     mechanism per Round 5.b'-α-modified). Integrates
//     cancel_exception_with_audit RPC on re_routed_from_exception
//     outcomes to flip the open exception_queue_entry to
//     'cancelled' (chunk-6's reserved value activated at chunk 3
//     per Round 4.a (α-iii) arc-extended-lifecycle-sequence
//     codification — CHECK rename _chunk_6_active→_chunk_8_active
//     admitting cancelled; closes chunk-2-Phase-4 retro item 7).
//
// pre_commit_link_rerouted audit event (ADR-0016 §6 line 1037) —
// 10-field cascade-payload event capturing prior + new linked-
// entity 3-tuples; reserved for a future chunk per "land schema
// with consumer code" reverse-discipline (consumer ships at
// chunk 3 via router_re_evaluation_fired.decision_outcome;
// cascade-payload substrate deferred). The decision_outcome field
// captures the coarse "re-route happened" fact; future chunk
// wires the fine-grained prior→new entity coordinates per
// ADR-0016 §6 when the cascade-payload construction logic ships.
//
// v1 envelope-less substrate-collapse: ADR-0018 §item 3's branch (b)
// "propose-with-ambiguity-flag" presupposes Tier-1 ProposedEntryCard
// disambiguation UI that v1 does not ship. Chunk 2 collapses branch
// (b) → branch (c) at the substrate mutation level (head pointer
// unset; case → needs_review; differ only in exception_reason).
// Branch identifier preserved in audit before_state for forward-
// compat with envelope-shipping chunks.
//
// v1 pipeline orchestrator contract (Phase 7): always call
// resolveCandidates after completeCandidate, regardless of candidate
// count. N=0 handled inside Subsystem 2 (branch c), not at orchestrator-
// side. Grounded in completeCandidate's M3-α discipline preserved
// across all five empty-return paths.
//
// Pattern B unwrapped service (chunks 1-3 + 5 + 6 + chunk-1-Phase-4
// precedent; route handlers wrap via withInvariants() at the call site
// with action grain 'document_router.complete_candidate' or
// 'document_router.resolve_candidates').
//
// Subsystem 1 Tier 2.5 reads (4 private cross-domain read helpers via
// adminClient):
//   - loadOpenBillsForVendor — bills filtered by lifecycle_state IN
//     ('approved_for_payment', 'partially_paid') per ADR-0018 §item 5(a).
//   - loadOpenPaymentsForVendor — payments filtered by payment_state
//     IN ('pending', 'paid') per ADR-0018 §item 5(b).
//   - loadOpenPrepaymentsForVendor — vendor_prepayments filtered by
//     status IN ('open', 'partially_applied') per ADR-0018 §item 5(c).
//   - listLinksForCaseSourceDocuments — source_document_links filtered
//     by source_document_id IN (...) AND link_status = 'created' per
//     ADR-0018 §item 5(f) for double-routing detection.
//
// Subsystem 2 Tier 2.5 reads (1 private read helper):
//   - loadCandidatesForCase — document_relationship_candidates
//     filtered by document_case_id; ORDER BY confidence_score DESC,
//     id ASC. Document Platform substrate only — no cross-domain
//     reads at chunk 2.
//
// loadOpenVendorCreditsForVendor deliberately skipped at chunk 1:
// vendor_credit + vendor_credit_application are reserved post-v1 per
// Phase 2.5 Commit A; the Phase 5 vendor_credits table doesn't exist.
// Subsystem 1 cannot produce (vendor_credit, *) candidates at v1
// because the pair isn't in chunk-5's 13-cell VALID_PAIRS matrix.
//
// V1-PROVISIONAL constants at top of file for mechanical ADR-0019
// ratification at v1_ship_at + 6 months:
//   - CONFIDENCE_THRESHOLDS_V1_PROVISIONAL per ADR-0014 §7 Q65
//     (Subsystem 1).
//   - AMBIGUITY_MARGIN_V1_PROVISIONAL per ADR-0018 §item 3 +
//     ADR-0019 §3 (Subsystem 2).
//
// 'unknown' document_type early-returns [] from completeCandidate per
// ADR-0018 §item 2 + ADR-0014 §7 Q65 (unknown short-circuits to
// exception queue at the pipeline orchestrator level, before
// completeCandidate is invoked; if invoked anyway, service returns
// empty + info log — caller routes to exception per Subsystem 2
// branch (c)).
//
// Subsystem-write-scope discipline (M3-α): completeCandidate produces
// candidates ONLY; does NOT write document_cases.current_relationship_candidate_id
// or transition state. resolveCandidates writes the head pointer (branch
// a) AND transitions state (branch a directly; branches b/c via
// chunk-6's enqueueException). Subsystem 3 (chunks 3+) writes new
// candidate rows with supersedes_candidate_id and may invoke
// supersede_case_head_pointer_with_audit to replace the head pointer.
//
// audit_log idempotency_key (chunk-2 first-instance per F-J-β):
// deriveDecisionIdempotencyKey constructs a deterministic
// md5(case_id || ':' || trace_id || ':router_decision_recorded')::uuid
// recipe. Recipe is forensic-correlation-not-uniqueness — no UNIQUE
// constraint on audit_log.idempotency_key; retries produce multiple
// decision-record rows under the same idempotency_key, queryable via
// GROUP BY for higher-orchestrator dedup logic.

import { createHash } from 'node:crypto';
import { z } from 'zod';
import {
  CompleteCandidateInputSchema,
  DecisionRecordBeforeStateSchema,
  DispatchTriggerInputSchema,
  DocumentRelationshipCandidateSchema,
  ResolveCandidatesInputSchema,
  type CompleteCandidateInputRaw,
  type CompleteCandidateInput,
  type DecisionRecordBeforeState,
  type DispatchTriggerInputRaw,
  type DispatchTriggerInput,
  type DocumentRelationshipCandidate,
  type ResolveCandidatesInputRaw,
  type ResolveCandidatesInput,
  type RouterDecision,
  type RouterDecisionOutcome,
} from '@/shared/schemas/document-platform/documentRelationshipCandidate.schema';
import type { ExceptionReason } from '@/shared/schemas/document-platform/exceptionQueueEntry.schema';
import { LINKED_ENTITY_TABLE_MAP, VALID_PAIRS } from '@/shared/schemas/document-platform/sourceDocumentLink.schema';
import type { CandidateFeatures, ScoredDocumentType } from '@/shared/schemas/document-platform/candidate_features.schema';
import { composeScore, type RawFeatureSignals } from '@/services/document-platform/scoreComposition';
import type { DocumentType } from '@/shared/schemas/document-platform/documentCase.schema';
import { adminClient } from '@/db/adminClient';
import { enqueueException } from '@/services/document-platform/documentExceptionService';
import { ServiceError } from '@/services/errors/ServiceError';
import { recordMutation } from '@/services/audit/recordMutation';
import { loggerWith } from '@/shared/logger/pino';
import type { ServiceContext } from '@/services/middleware/serviceContext';

type Db = ReturnType<typeof adminClient>;

// ---------------------------------------------------------------------
// Per-document-type confidence thresholds per ADR-0014 §7 Q65
// provisional values. ADR-0019 ratification triggers amendment
// cascade — when ADR-0019 ratifies calibrated values, chunks-N
// amends this constant. The constant's location at the consuming-
// service top makes the amendment surface small and mechanical.
//
// unknown is null per ADR-0014 §7 Q65 ("always exception" for
// unknown — Subsystem 1 is not invoked for unknown per ADR-0018
// §item 2; case routes to exception queue per ADR-0014 §7 before
// Subsystem 1 firing).
// ---------------------------------------------------------------------
const CONFIDENCE_THRESHOLDS_V1_PROVISIONAL: Record<DocumentType, number | null> = {
  vendor_invoice: 0.85,
  receipt: 0.80,
  payment_confirmation: 0.85,
  unknown: null,
} as const;

// ---------------------------------------------------------------------
// Subsystem 2 ambiguity-margin threshold per ADR-0018 §item 3.
// Provisional value at chunk 2 ship; ADR-0019 first calibration cycle
// (v1_ship_at + 6 months per ADR-0019 §3 + §9 row 13) ratifies. Same
// V1-PROVISIONAL pattern as CONFIDENCE_THRESHOLDS_V1_PROVISIONAL.
//
// v1-operational observation per F-J-α: chunk-1's completeCandidate
// emits every candidate with confidence_score = vendor_match.confidence
// (single-feature scoring). For N≥2 cases, margin = top − runner_up = 0
// structurally. Under any positive threshold, every N≥2 case routes to
// branch (b) → exception queue. Branch (a) via margin filter is
// structurally unreachable at v1; activates when chunks-3+ ship multi-
// feature scoring per ADR-0018 §item 2.
// ---------------------------------------------------------------------
const AMBIGUITY_MARGIN_V1_PROVISIONAL = 0.05;

// ---------------------------------------------------------------------
// Internal TS interfaces for private read helpers.
// Pattern: apReportService.loadBillsWithAmountDue precedent — internal
// interfaces for internal consumers; no Zod parse needed for trusted-
// database typed-query results. The helpers select only matching-
// relevant fields per ADR-0018 §item 5, not full row shapes.
// ---------------------------------------------------------------------

interface OpenBillForRouter {
  bill_id: string;
  vendor_id: string;
  lifecycle_state: 'approved_for_payment' | 'partially_paid';
  amount_cad: number;
  issue_date: string;
  due_date: string | null;
  bill_number: string | null;
}

interface OpenPaymentForRouter {
  payment_id: string;
  vendor_id: string;
  payment_state: 'pending' | 'paid';
  amount: number;
  payment_date: string;
  authorization_reference: string | null;
  payment_method: string;
}

interface OpenPrepaymentForRouter {
  id: string;
  vendor_id: string;
  status: 'open' | 'partially_applied';
  amount_cad: number;
}

interface ExistingLinkForRouter {
  source_document_id: string;
  linked_entity_type: string;
  linked_entity_id: string;
  link_role: string;
}

// Internal candidate payload shape pre-RPC.
//
// candidate_features narrowed from Record<string, unknown> to CandidateFeatures
// at chunk 3 (Phase 8) per chunk 3 brief Task 2 acceptance criterion — typed
// schema replaces permissive record per ADR-0018 §2 lines 472-475 feature
// vector recording framing.
interface NewCandidatePayload {
  document_case_id: string;
  source_document_id: string;
  supersedes_candidate_id: string | null;
  linked_entity_type: string;
  linked_entity_id: string;
  link_role: string;
  confidence_score: number;
  candidate_features: CandidateFeatures;
  trace_id: string;
}

// ---------------------------------------------------------------------
// Private read helper: open bills for vendor.
// Filter: lifecycle_state IN ('approved_for_payment', 'partially_paid')
// per ADR-0018 §item 5(a). Org-scoped via direct .eq filter.
// ---------------------------------------------------------------------
async function loadOpenBillsForVendor(
  db: Db,
  org_id: string,
  vendor_id: string,
): Promise<OpenBillForRouter[]> {
  const { data, error } = await db
    .from('bills')
    .select('bill_id, vendor_id, lifecycle_state, amount_cad, issue_date, due_date, bill_number')
    .eq('org_id', org_id)
    .eq('vendor_id', vendor_id)
    .in('lifecycle_state', ['approved_for_payment', 'partially_paid']);

  if (error) {
    throw new ServiceError(
      'READ_FAILED',
      `loadOpenBillsForVendor failed for vendor ${vendor_id}: ${error.message}`,
    );
  }
  return (data ?? []) as OpenBillForRouter[];
}

// ---------------------------------------------------------------------
// Private read helper: open payments for vendor.
// Filter: payment_state IN ('pending', 'paid') per ADR-0018 §item 5(b).
// ---------------------------------------------------------------------
async function loadOpenPaymentsForVendor(
  db: Db,
  org_id: string,
  vendor_id: string,
): Promise<OpenPaymentForRouter[]> {
  const { data, error } = await db
    .from('payments')
    .select('payment_id, vendor_id, payment_state, amount, payment_date, authorization_reference, payment_method')
    .eq('org_id', org_id)
    .eq('vendor_id', vendor_id)
    .in('payment_state', ['pending', 'paid']);

  if (error) {
    throw new ServiceError(
      'READ_FAILED',
      `loadOpenPaymentsForVendor failed for vendor ${vendor_id}: ${error.message}`,
    );
  }
  return (data ?? []) as OpenPaymentForRouter[];
}

// ---------------------------------------------------------------------
// Private read helper: open vendor_prepayments for vendor.
// Filter: status IN ('open', 'partially_applied') per ADR-0018
// §item 5(c). PK column is `id` (per chunk-5 LINKED_ENTITY_TABLE_MAP).
// ---------------------------------------------------------------------
async function loadOpenPrepaymentsForVendor(
  db: Db,
  org_id: string,
  vendor_id: string,
): Promise<OpenPrepaymentForRouter[]> {
  const { data, error } = await db
    .from('vendor_prepayments')
    .select('id, vendor_id, status, amount_cad')
    .eq('org_id', org_id)
    .eq('vendor_id', vendor_id)
    .in('status', ['open', 'partially_applied']);

  if (error) {
    throw new ServiceError(
      'READ_FAILED',
      `loadOpenPrepaymentsForVendor failed for vendor ${vendor_id}: ${error.message}`,
    );
  }
  return (data ?? []) as OpenPrepaymentForRouter[];
}

// ---------------------------------------------------------------------
// Private read helper: existing source_document_links for the case's
// source documents per ADR-0018 §item 5(f). Used for double-routing
// detection — Subsystem 1 avoids producing candidates that would
// duplicate an existing committed link.
//
// Filter: source_document_id IN (...) AND link_status = 'created'
// (reversed links don't block re-routing).
//
// Lift trigger: second consumer emerges (chunks 2+ Subsystem 2
// ambiguity-resolution dispatcher; Phase 5 reviewer UI). Currently
// inline per single-domain-read-helper pattern (chunks-5-6
// precedent: apReportService.loadBillsWithAmountDue is private to
// its file; chunks-5-6 services don't cross-import each other's
// reads).
// ---------------------------------------------------------------------
async function listLinksForCaseSourceDocuments(
  db: Db,
  source_document_ids: string[],
): Promise<ExistingLinkForRouter[]> {
  if (source_document_ids.length === 0) return [];

  const { data, error } = await db
    .from('source_document_links')
    .select('source_document_id, linked_entity_type, linked_entity_id, link_role')
    .in('source_document_id', source_document_ids)
    .eq('link_status', 'created');

  if (error) {
    throw new ServiceError(
      'READ_FAILED',
      `listLinksForCaseSourceDocuments failed: ${error.message}`,
    );
  }
  return (data ?? []) as ExistingLinkForRouter[];
}

// ---------------------------------------------------------------------
// Subsystem 2 Tier 2.5 read helper: candidate set for a document_case.
//
// Reads document_relationship_candidates filtered by document_case_id;
// ORDER BY confidence_score DESC, id ASC. Document Platform substrate
// only — Subsystem 2's read profile is narrower than Subsystem 1's
// (no cross-domain AP/Spend reads). Substrate-as-source-of-truth
// gives forensic-replay symmetry: Subsystem 2's decision is reproducible
// from document_relationship_candidates at any later time.
//
// Tiebreak rule ORDER BY confidence_score DESC, id ASC is forward-
// compat ready for chunks-3+ multi-feature scoring per F-J-α; at v1
// the rule applies trivially to N=1 (sole candidate elect).
//
// Lift trigger: second consumer materializes (likely Phase 5 reviewer
// UI reading the candidate set for operator review). Same lift pattern
// as Subsystem 1's read helpers.
// ---------------------------------------------------------------------
async function loadCandidatesForCase(
  db: Db,
  document_case_id: string,
): Promise<DocumentRelationshipCandidate[]> {
  const { data, error } = await db
    .from('document_relationship_candidates')
    .select('*')
    .eq('document_case_id', document_case_id)
    .order('confidence_score', { ascending: false })
    .order('id', { ascending: true });

  if (error) {
    throw new ServiceError(
      'READ_FAILED',
      `loadCandidatesForCase ${document_case_id} failed: ${error.message}`,
    );
  }

  const rows = (data ?? []) as unknown[];
  const results: DocumentRelationshipCandidate[] = [];
  for (const row of rows) {
    const parsed = DocumentRelationshipCandidateSchema.safeParse(row);
    if (!parsed.success) {
      throw new ServiceError(
        'READ_FAILED',
        `loadCandidatesForCase ${document_case_id} returned unexpected shape: ${parsed.error.message}`,
      );
    }
    results.push(parsed.data);
  }
  return results;
}

// ---------------------------------------------------------------------
// Subsystem 2 idempotency_key derivation (TS-side md5 recipe).
//
// Deterministic recipe: md5(case_id || ':' || trace_id || ':router_decision_recorded')::uuid.
// UUID-formatted via 8-4-4-4-12 hex slicing (md5 returns 32 hex chars;
// audit_log.idempotency_key column is uuid). action verb included as
// discriminator so a single trace_id with multiple Router decisions
// (e.g., Subsystem 3 re-evaluation reusing the trace_id) doesn't
// collide on idempotency_key.
//
// F-J-β: chunk-2-Phase-4 is the first chunk at chunks-1-6 to populate
// audit_log.idempotency_key deliberately. Recipe is forensic-
// correlation-not-uniqueness: audit_log.idempotency_key has no UNIQUE
// constraint; retries produce duplicate rows under the same key,
// queryable via GROUP BY idempotency_key for higher-orchestrator
// dedup logic. Tier 2.5 pipeline orchestrator's per-case serialization
// makes practical concurrency low at v1.
// ---------------------------------------------------------------------
function deriveDecisionIdempotencyKey(case_id: string, trace_id: string): string {
  const hex = createHash('md5')
    .update(`${case_id}:${trace_id}:router_decision_recorded`)
    .digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// ---------------------------------------------------------------------
// Subsystem 3 audit_log idempotency_key recipe (R1 per Round 2.a).
//
// Mirrors chunk-2 F-J-β shape with trigger_type substituting for
// action_name in position 3: md5(case_id || ':' || trace_id || ':' ||
// trigger_type)::uuid. Field order is case_id, trace_id, trigger_type
// (verified at brief-draft against deriveDecisionIdempotencyKey above).
//
// Single trace_id may produce multiple router_re_evaluation_fired
// audit rows of different trigger_types (e.g., T5 invalidation
// produces a re-eval that fires T1-style fan-out via supersession
// chains). trigger_type IS the discriminator that action_name was
// for chunk 2's single-action-per-trace recipe. Same shape; new
// dimension per F-J-10.
//
// Forensic-correlation-not-uniqueness: no UNIQUE constraint on
// audit_log.idempotency_key; retries under same trace_id +
// trigger_type produce multiple rows under the same key,
// GROUP BY-deduplicable at higher orchestration layers.
// ---------------------------------------------------------------------
function deriveDispatchIdempotencyKey(
  case_id: string,
  trigger_type: string,
  trace_id: string,
): string {
  const hex = createHash('md5')
    .update(`${case_id}:${trace_id}:${trigger_type}`)
    .digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// ---------------------------------------------------------------------
// Subsystem 3 re-eval primitive: rematchCandidate (γ'-partial).
//
// Thin wrapper over completeCandidate that reconstructs partial
// CompleteCandidateInput from chunk-1's candidate_features substrate
// + linked_entity_id fallback for vendor_id derivation. Honors
// ADR-0018 §item 4 "re-evaluates pre-commit cases" contract at
// matching-semantic level for cases-with-prior-candidates.
//
// γ'-partial per-trigger coverage at v1:
//   - T5/T8 fan-out scope (cases with pre-commit candidates pointing
//     at transitioned bill / candidates in reopened period):
//     re-routing-functional via this helper.
//   - T10 single-case: re-routing-functional if case has prior
//     candidates; audit-only (returns []) if stranded.
//   - T1/T3 fan-out scope (stranded cases in exception queue):
//     returns [] (no prior candidate to reconstruct from); caller
//     maps to decision_outcome='no_change' at v1. Re-routing for
//     stranded cases activates when Phase 7 ships substrate for
//     classification + extraction + vendor-matching reconstruction.
//
// Empty-array return for "no prior candidate" is semantically
// correct (γ'-partial path), NOT a bug.
//
// Reconstruction fidelity (per F-J-13 verification at chunk-3 impl):
//   - document_type ← candidate_features.document_type
//   - classification_confidence ← candidate_features.classification_confidence
//   - vendor_match.confidence ← candidate_features.vendor_match_confidence
//   - vendor_match.match_type ← candidate_features.vendor_match_type
//   - extracted_fields.invoice_amount / receipt_amount ← candidate_features.extracted_amount
//   - extracted_fields.invoice_date ← candidate_features.extracted_invoice_date
//   - vendor_match.vendor_id ← priorCandidate.linked_entity_id +
//     Phase 5 entity row lookup (bills/vendor_prepayments carry
//     vendor_id at Phase 5 ship)
// ---------------------------------------------------------------------
async function rematchCandidate(
  case_id: string,
  trace_id: string,
  ctx: ServiceContext,
): Promise<DocumentRelationshipCandidate[]> {
  const log = loggerWith({ trace_id, user_id: ctx.caller.user_id });
  const db = adminClient();

  // Load case's candidates; pick first head-of-chain (supersedes_candidate_id IS NULL).
  const candidates = await loadCandidatesForCase(db, case_id);
  const priorCandidate = candidates.find((c) => c.supersedes_candidate_id === null);

  if (!priorCandidate) {
    // γ'-partial path: stranded case with no prior candidate.
    // Caller maps to no_change.
    log.info(
      { case_id, trigger_trace_id: trace_id },
      'rematchCandidate: no prior candidate (γ\'-partial stranded-case path); returning []',
    );
    return [];
  }

  // Derive vendor_match.vendor_id via linked_entity_id fallback.
  // Reconstruction fields extracted from chunk 3 structured candidate_features
  // shape (per CandidateFeaturesSchema at candidate_features.schema.ts):
  //   - document_type ← candidate_features.document_type (top-level)
  //   - classification_confidence ← candidate_features.classification_confidence (top-level optional)
  //   - vendor_match_* ← vendor_match feature record's raw_value (match_type + confidence)
  //   - extracted_amount ← amount_match feature record's raw_value.extracted
  //   - extracted_invoice_date ← date_proximity feature record's raw_value.extracted
  const candidateFeatures = priorCandidate.candidate_features;
  const vendorFeature = candidateFeatures.features.find(
    (f) => f.feature_name === 'vendor_match',
  );
  const amountFeature = candidateFeatures.features.find(
    (f) => f.feature_name === 'amount_match',
  );
  const dateFeature = candidateFeatures.features.find(
    (f) => f.feature_name === 'date_proximity',
  );
  const vendorRaw = vendorFeature?.raw_value as
    | { match_type?: string; confidence?: number }
    | null
    | undefined;
  const amountRaw = amountFeature?.raw_value as
    | { extracted?: number | null }
    | null
    | undefined;
  const dateRaw = dateFeature?.raw_value as
    | { extracted?: string | null }
    | null
    | undefined;
  let vendor_id: string | null = null;

  if (priorCandidate.linked_entity_type === 'bill') {
    const { data, error } = await db
      .from('bills')
      .select('vendor_id')
      .eq('bill_id', priorCandidate.linked_entity_id)
      .single();
    if (error || !data) {
      throw new ServiceError(
        'READ_FAILED',
        `rematchCandidate: bills.vendor_id lookup failed for bill ${priorCandidate.linked_entity_id}: ${error?.message ?? 'no rows'}`,
      );
    }
    vendor_id = (data as { vendor_id: string }).vendor_id;
  } else if (priorCandidate.linked_entity_type === 'vendor_prepayment') {
    const { data, error } = await db
      .from('vendor_prepayments')
      .select('vendor_id')
      .eq('id', priorCandidate.linked_entity_id)
      .single();
    if (error || !data) {
      throw new ServiceError(
        'READ_FAILED',
        `rematchCandidate: vendor_prepayments.vendor_id lookup failed for vendor_prepayment ${priorCandidate.linked_entity_id}: ${error?.message ?? 'no rows'}`,
      );
    }
    vendor_id = (data as { vendor_id: string }).vendor_id;
  } else {
    // Other linked_entity_types (bill_line, payment, bank_transaction, etc.)
    // shouldn't appear at v1 fan-out (paymentService/vendorCreditService
    // deferred per Round 1 finding). Defensive: log and return [] for
    // unrecognized types; this is a verify-at-impl finding worth flagging.
    log.warn(
      { case_id, linked_entity_type: priorCandidate.linked_entity_type },
      'rematchCandidate: unrecognized linked_entity_type for vendor_id derivation at v1; returning []',
    );
    return [];
  }

  // Reconstruct CompleteCandidateInput from candidate_features (chunk 3
  // structured shape).
  const reconstructedInput: CompleteCandidateInputRaw = {
    document_case_id: case_id,
    source_document_id: priorCandidate.source_document_id,
    document_type: candidateFeatures.document_type as DocumentType,
    classification_confidence: candidateFeatures.classification_confidence ?? 0,
    extracted_fields: {
      invoice_amount: amountRaw?.extracted ?? null,
      invoice_date: dateRaw?.extracted ?? null,
      receipt_amount: amountRaw?.extracted ?? null,
    },
    vendor_match: {
      vendor_id,
      confidence: vendorRaw?.confidence ?? 0,
      match_type: (vendorRaw?.match_type ?? 'no_match') as
        | 'exact_name'
        | 'alias'
        | 'tax_id'
        | 'email'
        | 'domain'
        | 'fuzzy_name'
        | 'no_match',
      candidate_alternatives: [],
    },
    trace_id,
  };

  return await completeCandidate(reconstructedInput, ctx);
}

// ---------------------------------------------------------------------
// Per-feature contribution helpers (chunk 2 Session 60 grade).
//
// Pure functions emitting raw per-feature signal values for inclusion in
// candidate_features JSONB at Subsystem 1 output emission grade. Chunk 2
// emits per-feature contribution SURFACE only; composition formula
// (per-feature weight allocation + score summing) defers to chunk 3 score
// composition expansion per Sub-Q14 sub-chunk b decomposition + ADR-0018
// §2 lines 450-475 confidence scoring composition framing.
//
// AMOUNT_TOLERANCE_CAD provisional value: $0.01 (one cent tolerance for
// floating-point + numeric(20,4) round-trip; chunk 3 score composition
// ratifies via ADR-0019 calibration cycle).
//
// DATE_PROXIMITY_WINDOW_DAYS provisional value: 14 days (per chunk 2
// brief Task 1 partial-information value pick at v1 grade per ADR-0018
// §2 lines 466-471 implementation-owned-at-v1 framing; chunk 3 score
// composition expansion ratifies via ADR-0019 calibration cycle).
// ---------------------------------------------------------------------
const AMOUNT_TOLERANCE_CAD = 0.01;
const DATE_PROXIMITY_WINDOW_DAYS = 14;

function computeAmountFeatures(
  extractedAmount: unknown,
  candidateAmount: number,
): { match: boolean | null; diff_cad: number | null } {
  if (typeof extractedAmount !== 'number' || !Number.isFinite(extractedAmount)) {
    return { match: null, diff_cad: null };
  }
  const candidateNum =
    typeof candidateAmount === 'number' ? candidateAmount : Number(candidateAmount);
  if (!Number.isFinite(candidateNum)) {
    return { match: null, diff_cad: null };
  }
  const diff = Math.abs(extractedAmount - candidateNum);
  return {
    match: diff <= AMOUNT_TOLERANCE_CAD,
    diff_cad: diff,
  };
}

function computeDateFeatures(
  extractedDate: unknown,
  candidateDate: string,
): { proximity_days: number | null; within_window: boolean | null } {
  if (typeof extractedDate !== 'string' || extractedDate.length === 0) {
    return { proximity_days: null, within_window: null };
  }
  const extractedMs = Date.parse(extractedDate);
  const candidateMs = Date.parse(candidateDate);
  if (!Number.isFinite(extractedMs) || !Number.isFinite(candidateMs)) {
    return { proximity_days: null, within_window: null };
  }
  const diffDays = Math.round(Math.abs(extractedMs - candidateMs) / (1000 * 60 * 60 * 24));
  return {
    proximity_days: diffDays,
    within_window: diffDays <= DATE_PROXIMITY_WINDOW_DAYS,
  };
}

function computeStringMatchFeature(
  extracted: unknown,
  candidate: string | null | undefined,
): boolean | null {
  if (
    typeof extracted !== 'string' ||
    extracted.length === 0 ||
    candidate === null ||
    candidate === undefined
  ) {
    return null;
  }
  return extracted.trim().toLowerCase() === candidate.trim().toLowerCase();
}

// ---------------------------------------------------------------------
// Public: completeCandidate (Subsystem 1 entry point).
//
// Layer 2 boundary: Zod parse via CompleteCandidateInputSchema.
// Per ADR-0018 §item 2 + ADR-0014 §7 Q65: unknown document_type
// short-circuits to exception queue at the pipeline orchestrator;
// if invoked anyway, return [] (accept-and-return-empty contract).
//
// Tier 2.5 reads (4 private helpers) → match logic per document_type
// → atomic batch RPC create_candidates_with_audit → read-back via
// DocumentRelationshipCandidateSchema parse.
// ---------------------------------------------------------------------
export async function completeCandidate(
  input: CompleteCandidateInputRaw,
  ctx: ServiceContext,
): Promise<DocumentRelationshipCandidate[]> {
  const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });

  // Layer 2 boundary: Zod parse at service entry.
  let parsed: CompleteCandidateInput;
  try {
    parsed = CompleteCandidateInputSchema.parse(input);
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new ServiceError(
        'READ_FAILED',
        `completeCandidate validation failed: ${err.message}`,
      );
    }
    throw err;
  }

  const db = adminClient();

  // Unknown document_type early-return per ADR-0018 §item 2 +
  // ADR-0014 §7 Q65. The empty-set return is the natural signal;
  // caller (pipeline orchestrator at chunks 2+ + Phase 7) routes
  // to exception queue. No ServiceError because the caller's
  // mistake is recoverable by routing to exception.
  if (parsed.document_type === 'unknown') {
    log.info(
      { document_case_id: parsed.document_case_id },
      'Subsystem 1 skipped for unknown document_type per ADR-0018 §item 2',
    );
    return [];
  }

  // Per-document-type threshold gate. unknown handled above; the
  // remaining v1-active document_types have numeric thresholds.
  const threshold = CONFIDENCE_THRESHOLDS_V1_PROVISIONAL[parsed.document_type];
  if (threshold === null) {
    log.info(
      { document_case_id: parsed.document_case_id, document_type: parsed.document_type },
      'Subsystem 1 skipped: no threshold for document_type (always-exception per ADR-0014 §7 Q65)',
    );
    return [];
  }

  // Subsystem 1 requires vendor_match.vendor_id to query Phase 5
  // substrate. If absent, no matching possible — return empty;
  // caller routes to exception queue.
  if (!parsed.vendor_match || !parsed.vendor_match.vendor_id) {
    log.info(
      {
        document_case_id: parsed.document_case_id,
        document_type: parsed.document_type,
      },
      'Subsystem 1 skipped: no vendor_match.vendor_id; cannot match against Phase 5 substrate',
    );
    return [];
  }

  // Derive org_id from parent document_case (chunks-3-6 canonical
  // pattern; single source of truth for org-scoping the Tier 2.5
  // reads). Also verifies the case exists at service entry.
  const { data: caseData, error: caseError } = await db
    .from('document_cases')
    .select('org_id')
    .eq('id', parsed.document_case_id)
    .single();

  if (caseError || !caseData) {
    throw new ServiceError(
      'NOT_FOUND',
      `completeCandidate: document_case ${parsed.document_case_id} not found: ${caseError?.message ?? 'no rows'}`,
    );
  }
  const org_id = caseData.org_id as string;
  const vendor_id = parsed.vendor_match.vendor_id;

  // Read existing links for already-matched detection (ADR-0018
  // §item 5(f)). Subsystem 1 avoids producing candidates that
  // duplicate an existing committed link for the same source_document.
  const existingLinks = await listLinksForCaseSourceDocuments(db, [parsed.source_document_id]);
  const existingPairKey = (entity_type: string, entity_id: string) =>
    `${entity_type}|${entity_id}`;
  const existingKeys = new Set(
    existingLinks.map((link) =>
      existingPairKey(link.linked_entity_type, link.linked_entity_id),
    ),
  );

  // Match by document_type. v1 scoring: confidence_score =
  // vendor_match.confidence (single-feature scoring). candidate_features
  // captures the feature vector for forensic reconstruction per
  // ADR-0018 §item 2 ("the Router writes the feature vector and the
  // resulting score into candidate_features so a reviewer can
  // reconstruct why a particular score landed"). More sophisticated
  // scoring (amount-match, date-proximity) is a chunks-2+ Subsystem 1
  // enhancement.
  const candidatesToProduce: NewCandidatePayload[] = [];

  if (parsed.vendor_match.confidence < threshold) {
    log.info(
      {
        document_case_id: parsed.document_case_id,
        document_type: parsed.document_type,
        vendor_match_confidence: parsed.vendor_match.confidence,
        threshold,
      },
      'Subsystem 1: vendor_match.confidence below threshold; no candidates produced',
    );
    return [];
  }

  // Per-branch chunk 2 per-feature contribution surfaces feed into chunk 3
  // composeScore() helper at scoreComposition.ts. composeScore normalizes
  // raw signals to [0, 1] per axis, applies document_type-specific weight
  // allocation (V1_PROVISIONAL_WEIGHTS per ADR-0019 §9 + ADR-0018 §2 lines
  // 465-470), and sums to aggregate_score = confidence_score per chunk 3
  // brief Task 2. vendor_match_raw_value carries vendor_match_type +
  // vendor_match_confidence forensic reconstruction surface inherited from
  // chunk 2 baseFeatures (consumed by rematchCandidate per F-J-13).

  if (parsed.document_type === 'vendor_invoice') {
    // vendor_invoice → bill matching (link_role = primary_invoice).
    // Scenario B existing-bill matching at chunk 2 grade per chunk 2 brief
    // §B.3 + §2.4 F-3 scope (a) deferral framing — Scenario A inferred-target
    // (null linked_entity_id, invoice-arrives-no-bill-yet path) deferred to
    // chunk 4 per Session 59 amendment §B.3.
    const openBills = await loadOpenBillsForVendor(db, org_id, vendor_id);
    for (const bill of openBills) {
      if (existingKeys.has(existingPairKey('bill', bill.bill_id))) continue;
      const amountFeatures = computeAmountFeatures(
        parsed.extracted_fields.invoice_amount,
        bill.amount_cad,
      );
      const dateFeatures = computeDateFeatures(
        parsed.extracted_fields.invoice_date,
        bill.issue_date,
      );
      const billNumberMatch = computeStringMatchFeature(
        parsed.extracted_fields.invoice_number,
        bill.bill_number,
      );
      const signals: RawFeatureSignals = {
        vendor_match_confidence: parsed.vendor_match.confidence,
        vendor_match_raw_value: {
          match_type: parsed.vendor_match.match_type,
          confidence: parsed.vendor_match.confidence,
        },
        amount_match: amountFeatures.match,
        amount_raw_value: {
          extracted: parsed.extracted_fields.invoice_amount ?? null,
          candidate: bill.amount_cad,
          diff_cad: amountFeatures.diff_cad,
          match: amountFeatures.match,
          bill_lifecycle_state: bill.lifecycle_state,
        },
        date_within_window: dateFeatures.within_window,
        date_raw_value: {
          extracted: parsed.extracted_fields.invoice_date ?? null,
          candidate: bill.issue_date,
          proximity_days: dateFeatures.proximity_days,
          within_window_14d: dateFeatures.within_window,
        },
        reference_match: billNumberMatch,
        reference_raw_value: {
          extracted: parsed.extracted_fields.invoice_number ?? null,
          candidate: bill.bill_number,
          match: billNumberMatch,
        },
        payment_method_match: null,
        payment_method_raw_value: null,
      };
      const composed = composeScore(signals, 'vendor_invoice');
      candidatesToProduce.push({
        document_case_id: parsed.document_case_id,
        source_document_id: parsed.source_document_id,
        supersedes_candidate_id: null,
        linked_entity_type: 'bill',
        linked_entity_id: bill.bill_id,
        link_role: 'primary_invoice',
        confidence_score: composed.aggregate_score,
        candidate_features: {
          features: composed.features,
          aggregate_score: composed.aggregate_score,
          document_type: 'vendor_invoice',
          linked_entity_type: 'bill',
          classification_confidence: parsed.classification_confidence,
        },
        trace_id: parsed.trace_id,
      });
    }
  } else if (parsed.document_type === 'receipt') {
    // Scenario A: receipt → payment (link_role = payment_evidence) — receipt
    // evidences existing payment.
    // Scenario B: receipt → bill (link_role = receipt) — receipt evidences
    // bill payment.
    //
    // Scenario A variant (payment, receipt) receipt-as-primary DEFERRED to
    // chunk 4 per chunk 2 brief §B.3 + §2.4 F-3 scope (b) deferral framing.
    // Scenario C exception queue routing: confirmed via existing
    // empty-return-from-Subsystem-1 contract below.
    //
    // Both scenarios use composeScore with 'receipt' document_type weights
    // per chunk 3 V1_PROVISIONAL_WEIGHTS; Scenario B (receipt→bill) lacks
    // authorization_reference + payment_method semantics → reference_match
    // + payment_method_match passed as null → normalized to 0 per axis →
    // Scenario B aggregate_score capped at 0.65 max per receipt weight
    // allocation (vendor 0.25 + amount 0.25 + date 0.15). This structurally
    // penalizes evidence-poor Scenario B vs evidence-rich Scenario A; the
    // operational asymmetry is intentional per receipt-evidence-precision
    // disambiguation.
    const openPayments = await loadOpenPaymentsForVendor(db, org_id, vendor_id);
    for (const payment of openPayments) {
      if (existingKeys.has(existingPairKey('payment', payment.payment_id))) continue;
      const amountFeatures = computeAmountFeatures(
        parsed.extracted_fields.receipt_amount,
        payment.amount,
      );
      const dateFeatures = computeDateFeatures(
        parsed.extracted_fields.receipt_date,
        payment.payment_date,
      );
      const authorizationReferenceMatch = computeStringMatchFeature(
        parsed.extracted_fields.authorization_reference,
        payment.authorization_reference,
      );
      const paymentMethodMatch = computeStringMatchFeature(
        parsed.extracted_fields.payment_method,
        payment.payment_method,
      );
      const signals: RawFeatureSignals = {
        vendor_match_confidence: parsed.vendor_match.confidence,
        vendor_match_raw_value: {
          match_type: parsed.vendor_match.match_type,
          confidence: parsed.vendor_match.confidence,
        },
        amount_match: amountFeatures.match,
        amount_raw_value: {
          extracted: parsed.extracted_fields.receipt_amount ?? null,
          candidate: payment.amount,
          diff_cad: amountFeatures.diff_cad,
          match: amountFeatures.match,
          payment_state: payment.payment_state,
        },
        date_within_window: dateFeatures.within_window,
        date_raw_value: {
          extracted: parsed.extracted_fields.receipt_date ?? null,
          candidate: payment.payment_date,
          proximity_days: dateFeatures.proximity_days,
          within_window_14d: dateFeatures.within_window,
        },
        reference_match: authorizationReferenceMatch,
        reference_raw_value: {
          extracted: parsed.extracted_fields.authorization_reference ?? null,
          candidate: payment.authorization_reference,
          match: authorizationReferenceMatch,
        },
        payment_method_match: paymentMethodMatch,
        payment_method_raw_value: {
          extracted: parsed.extracted_fields.payment_method ?? null,
          candidate: payment.payment_method,
          match: paymentMethodMatch,
        },
      };
      const composed = composeScore(signals, 'receipt');
      candidatesToProduce.push({
        document_case_id: parsed.document_case_id,
        source_document_id: parsed.source_document_id,
        supersedes_candidate_id: null,
        linked_entity_type: 'payment',
        linked_entity_id: payment.payment_id,
        link_role: 'payment_evidence',
        confidence_score: composed.aggregate_score,
        candidate_features: {
          features: composed.features,
          aggregate_score: composed.aggregate_score,
          document_type: 'receipt',
          linked_entity_type: 'payment',
          classification_confidence: parsed.classification_confidence,
          scenario: 'receipt_to_payment',
        },
        trace_id: parsed.trace_id,
      });
    }
    // Scenario B: receipt → bill (link_role = receipt).
    const openBillsForReceipt = await loadOpenBillsForVendor(db, org_id, vendor_id);
    for (const bill of openBillsForReceipt) {
      if (existingKeys.has(existingPairKey('bill', bill.bill_id))) continue;
      const amountFeatures = computeAmountFeatures(
        parsed.extracted_fields.receipt_amount,
        bill.amount_cad,
      );
      const dateFeatures = computeDateFeatures(
        parsed.extracted_fields.receipt_date,
        bill.issue_date,
      );
      const signals: RawFeatureSignals = {
        vendor_match_confidence: parsed.vendor_match.confidence,
        vendor_match_raw_value: {
          match_type: parsed.vendor_match.match_type,
          confidence: parsed.vendor_match.confidence,
        },
        amount_match: amountFeatures.match,
        amount_raw_value: {
          extracted: parsed.extracted_fields.receipt_amount ?? null,
          candidate: bill.amount_cad,
          diff_cad: amountFeatures.diff_cad,
          match: amountFeatures.match,
          bill_lifecycle_state: bill.lifecycle_state,
        },
        date_within_window: dateFeatures.within_window,
        date_raw_value: {
          extracted: parsed.extracted_fields.receipt_date ?? null,
          candidate: bill.issue_date,
          proximity_days: dateFeatures.proximity_days,
          within_window_14d: dateFeatures.within_window,
        },
        reference_match: null,
        reference_raw_value: null,
        payment_method_match: null,
        payment_method_raw_value: null,
      };
      const composed = composeScore(signals, 'receipt');
      candidatesToProduce.push({
        document_case_id: parsed.document_case_id,
        source_document_id: parsed.source_document_id,
        supersedes_candidate_id: null,
        linked_entity_type: 'bill',
        linked_entity_id: bill.bill_id,
        link_role: 'receipt',
        confidence_score: composed.aggregate_score,
        candidate_features: {
          features: composed.features,
          aggregate_score: composed.aggregate_score,
          document_type: 'receipt',
          linked_entity_type: 'bill',
          classification_confidence: parsed.classification_confidence,
          scenario: 'receipt_to_bill',
        },
        trace_id: parsed.trace_id,
      });
    }
  } else if (parsed.document_type === 'payment_confirmation') {
    // payment_confirmation → payment (link_role = payment_evidence).
    // Canonical (payment, payment_evidence) shape per ADR-0018 §2 lines
    // 442-449. Distinct from receipt at scoring weight allocation surface —
    // payment_confirmation's authorization_reference is bank-issued
    // (canonical identifier reliability) vs receipt's authorization_reference
    // is merchant-issued, so payment_confirmation weight allocation per
    // V1_PROVISIONAL_WEIGHTS at scoreComposition.ts puts reference_alignment
    // at 0.35 (heavier) vs receipt's 0.20.
    const openPayments = await loadOpenPaymentsForVendor(db, org_id, vendor_id);
    for (const payment of openPayments) {
      if (existingKeys.has(existingPairKey('payment', payment.payment_id))) continue;
      const amountFeatures = computeAmountFeatures(
        parsed.extracted_fields.payment_amount,
        payment.amount,
      );
      const dateFeatures = computeDateFeatures(
        parsed.extracted_fields.payment_date,
        payment.payment_date,
      );
      const authorizationReferenceMatch = computeStringMatchFeature(
        parsed.extracted_fields.authorization_reference,
        payment.authorization_reference,
      );
      const paymentMethodMatch = computeStringMatchFeature(
        parsed.extracted_fields.payment_method,
        payment.payment_method,
      );
      const signals: RawFeatureSignals = {
        vendor_match_confidence: parsed.vendor_match.confidence,
        vendor_match_raw_value: {
          match_type: parsed.vendor_match.match_type,
          confidence: parsed.vendor_match.confidence,
        },
        amount_match: amountFeatures.match,
        amount_raw_value: {
          extracted: parsed.extracted_fields.payment_amount ?? null,
          candidate: payment.amount,
          diff_cad: amountFeatures.diff_cad,
          match: amountFeatures.match,
          payment_state: payment.payment_state,
        },
        date_within_window: dateFeatures.within_window,
        date_raw_value: {
          extracted: parsed.extracted_fields.payment_date ?? null,
          candidate: payment.payment_date,
          proximity_days: dateFeatures.proximity_days,
          within_window_14d: dateFeatures.within_window,
        },
        reference_match: authorizationReferenceMatch,
        reference_raw_value: {
          extracted: parsed.extracted_fields.authorization_reference ?? null,
          candidate: payment.authorization_reference,
          match: authorizationReferenceMatch,
        },
        payment_method_match: paymentMethodMatch,
        payment_method_raw_value: {
          extracted: parsed.extracted_fields.payment_method ?? null,
          candidate: payment.payment_method,
          match: paymentMethodMatch,
        },
      };
      const composed = composeScore(signals, 'payment_confirmation');
      candidatesToProduce.push({
        document_case_id: parsed.document_case_id,
        source_document_id: parsed.source_document_id,
        supersedes_candidate_id: null,
        linked_entity_type: 'payment',
        linked_entity_id: payment.payment_id,
        link_role: 'payment_evidence',
        confidence_score: composed.aggregate_score,
        candidate_features: {
          features: composed.features,
          aggregate_score: composed.aggregate_score,
          document_type: 'payment_confirmation',
          linked_entity_type: 'payment',
          classification_confidence: parsed.classification_confidence,
          scenario: 'payment_confirmation_to_payment',
        },
        trace_id: parsed.trace_id,
      });
    }
  }

  // VALID_PAIRS-based pair-validity emission assertion (chunk 2 Task 4 per
  // chunk 2 brief §B.1 amendment Path β preliminary recommendation).
  // Assert each emitted (linked_entity_type, link_role) pair is in canonical
  // VALID_PAIRS set at sourceDocumentLink.schema.ts:68 (13-cell pair-validity
  // matrix at v1 per Sub-Q3 β substrate-tables-only-without-cell-activation
  // discipline inheritance from Phase 5.1 chunk 5.1a). Reserved post-v1
  // pairs (vendor_credit, *) + (vendor_credit_application, *) structurally
  // prevented via VALID_PAIRS zero-entry exclusion. Service-layer assertion
  // at Subsystem 1 output emission boundary; no type-union narrowing at
  // DocumentRelationshipCandidate.linked_entity_type (canonical 8-value
  // LinkedEntityTypeSchema preserved per HEAD substrate at Phase 5.1 chunk
  // 5.1a ratification grade).
  for (const candidate of candidatesToProduce) {
    const pairKey = `${candidate.linked_entity_type}|${candidate.link_role}`;
    if (!VALID_PAIRS.has(pairKey)) {
      throw new ServiceError(
        'POST_FAILED',
        `completeCandidate: emission with invalid (linked_entity_type, link_role) pair "${pairKey}" violates VALID_PAIRS at sourceDocumentLink.schema.ts (Sub-Q3 β substrate-tables-only-without-cell-activation discipline; reserved post-v1 pairs not emittable at v1)`,
      );
    }
  }

  if (candidatesToProduce.length === 0) {
    log.info(
      {
        document_case_id: parsed.document_case_id,
        document_type: parsed.document_type,
        vendor_id,
      },
      'Subsystem 1: no candidates produced (zero matching Phase 5 entities for vendor)',
    );
    return [];
  }

  // Atomic batch RPC: N candidates + N audit_log rows in one
  // transaction. 'agent' hardcoded as created_by inside the RPC
  // per chunk-1 substrate invariant. Parent-derived org_id per
  // chunks-3-6 canonical pattern.
  const { data: idsData, error: rpcError } = await db.rpc('create_candidates_with_audit', {
    p_candidates: candidatesToProduce,
    p_audit: {
      user_id: ctx.caller.user_id,
      trace_id: ctx.trace_id,
      action: 'document_relationship_candidate_created',
      entity_type: 'document_relationship_candidate',
      tool_name: null,
    },
  });

  if (rpcError) {
    throw new ServiceError(
      'POST_FAILED',
      `create_candidates_with_audit RPC failed: ${rpcError.message}`,
    );
  }

  const ids = (idsData ?? []) as string[];
  if (ids.length !== candidatesToProduce.length) {
    throw new ServiceError(
      'POST_FAILED',
      `create_candidates_with_audit returned ${ids.length} ids; expected ${candidatesToProduce.length}`,
    );
  }

  // Read-back via DocumentRelationshipCandidateSchema parse —
  // defense-in-depth on the row shape + pair-validity .refine().
  const results: DocumentRelationshipCandidate[] = [];
  for (const id of ids) {
    const row = await readDocumentRelationshipCandidate(db, id);
    results.push(row);
  }

  log.info(
    {
      document_case_id: parsed.document_case_id,
      document_type: parsed.document_type,
      vendor_id,
      candidate_count: results.length,
    },
    'Subsystem 1 produced candidate set',
  );
  return results;
}

// ---------------------------------------------------------------------
// Public: resolveCandidates (Subsystem 2 entry point).
//
// Layer 2 boundary: Zod parse via ResolveCandidatesInputSchema.
// Reads the candidate set fresh from document_relationship_candidates
// (substrate-as-source-of-truth) + computes branch decision per
// R3.3 lock #1 + writes outcome.
//
// Branch (a) N=1 or N≥2-with-margin: atomic set_case_head_pointer_with_audit
// RPC (split p_audit per F-J-δ). State-transition guard
// (UPDATE … WHERE state='classified') is the substrate-layer enforcer;
// 23514 → INVALID_TRANSITION.
//
// Branch (b) N≥2-without-margin / Branch (c) N=0: pure-audit
// record_router_decision RPC + cross-service enqueueException to
// chunk-6 (which owns the classified → needs_review transition +
// exception_queue_entries row + own audit emission).
// ServiceError propagation from chunk-6 is verbatim per chunks 3-6
// no-wrap convention (EXCEPTION_ALREADY_OPEN passes unchanged).
// ---------------------------------------------------------------------
export async function resolveCandidates(
  input: ResolveCandidatesInputRaw,
  ctx: ServiceContext,
): Promise<RouterDecision> {
  const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });

  // Layer 2 boundary: Zod parse at service entry.
  let parsed: ResolveCandidatesInput;
  try {
    parsed = ResolveCandidatesInputSchema.parse(input);
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new ServiceError(
        'READ_FAILED',
        `resolveCandidates validation failed: ${err.message}`,
      );
    }
    throw err;
  }

  const db = adminClient();

  // Read document_case for org_id + document_type (calibration key
  // for DecisionRecordBeforeState.document_type per ADR-0019 §9 row 1).
  // Also verifies the case exists at service entry.
  const { data: caseData, error: caseError } = await db
    .from('document_cases')
    .select('org_id, document_type')
    .eq('id', parsed.document_case_id)
    .single();

  if (caseError || !caseData) {
    throw new ServiceError(
      'NOT_FOUND',
      `resolveCandidates: document_case ${parsed.document_case_id} not found: ${caseError?.message ?? 'no rows'}`,
    );
  }

  const org_id = caseData.org_id as string;
  const document_type = caseData.document_type as DocumentType;

  // Tier 2.5 read: load candidate set ordered by score DESC, id ASC
  // (tiebreak rule forward-compat ready per F-J-α).
  const candidates = await loadCandidatesForCase(db, parsed.document_case_id);
  const candidate_set_ids = candidates.map((c) => c.id);
  const confidence_scores: Record<string, number> = {};
  for (const c of candidates) {
    confidence_scores[c.id] = c.confidence_score;
  }

  const N = candidates.length;
  const top_confidence: number | null = N >= 1 ? candidates[0].confidence_score : null;
  const runner_up_confidence: number | null = N >= 2 ? candidates[1].confidence_score : null;
  const ambiguity_margin_computed: number | null =
    N >= 2 ? (top_confidence as number) - (runner_up_confidence as number) : null;

  // Branch decision logic per R3.3 lock #1.
  let branch: 'a' | 'b' | 'c';
  let winner_candidate_id: string | null = null;
  let exception_reason: ExceptionReason | null = null;

  if (N === 0) {
    branch = 'c';
    exception_reason = 'unmatched_router_candidate';
  } else if (N === 1) {
    branch = 'a';
    winner_candidate_id = candidates[0].id;
  } else {
    if ((ambiguity_margin_computed as number) >= AMBIGUITY_MARGIN_V1_PROVISIONAL) {
      branch = 'a';
      winner_candidate_id = candidates[0].id;
    } else {
      branch = 'b';
      exception_reason = 'multi_candidate_ambiguity';
    }
  }

  // Construct DecisionRecordBeforeState and parse against schema
  // before passing to RPC (Layer 2 schema-defense-on-internally-
  // constructed-values per chunk-1 pair-validity-family discriminator).
  const decisionBeforeState: DecisionRecordBeforeState = DecisionRecordBeforeStateSchema.parse({
    branch,
    candidate_set_ids,
    confidence_scores,
    top_confidence,
    runner_up_confidence,
    ambiguity_margin_computed,
    ambiguity_margin_threshold: AMBIGUITY_MARGIN_V1_PROVISIONAL,
    winner_candidate_id,
    exception_reason,
    document_type,
  });

  const idempotency_key = deriveDecisionIdempotencyKey(
    parsed.document_case_id,
    parsed.trace_id,
  );

  if (branch === 'a') {
    // Branch (a): atomic RPC writes head pointer + state transition
    // + emits 2 audit rows. Split p_audit per F-J-δ.
    const { error: rpcError } = await db.rpc('set_case_head_pointer_with_audit', {
      p_decision: {
        case_id: parsed.document_case_id,
        winner_candidate_id: winner_candidate_id as string,
        trace_id: parsed.trace_id,
      },
      p_audit_decision: {
        org_id,
        user_id: ctx.caller.user_id,
        trace_id: parsed.trace_id,
        action: 'router_decision_recorded',
        entity_type: 'document_case',
        before_state: decisionBeforeState,
        tool_name: null,
        idempotency_key,
        reason: null,
      },
      p_audit_mutation: {
        org_id,
        user_id: ctx.caller.user_id,
        trace_id: parsed.trace_id,
        action: 'document_case_transitioned',
        entity_type: 'document_case',
        tool_name: null,
        reason: null,
      },
    });

    if (rpcError) {
      // PG error code mapping per chunk-6 documentExceptionService
      // precedent (SQLSTATE strings on error.code). 23514 maps to
      // INVALID_TRANSITION (state-transition guard). All other PG
      // errors (FK violation 23503, no_data_found P0002, etc.) map
      // to POST_FAILED catchall — chunks-5-6 don't define
      // INTEGRITY_VIOLATION (β reconciliation: brief R3.4 cited
      // INTEGRITY_VIOLATION as inherited from chunks-5-6, but it
      // does not exist in the ServiceErrorCode union; chunks-5-6
      // actual precedent is POST_FAILED catchall for non-23514/23505
      // PG errors).
      if (rpcError.code === '23514') {
        throw new ServiceError(
          'INVALID_TRANSITION',
          `set_case_head_pointer_with_audit: ${rpcError.message}`,
        );
      }
      throw new ServiceError(
        'POST_FAILED',
        `set_case_head_pointer_with_audit RPC failed: ${rpcError.message}`,
      );
    }

    const decision: RouterDecision = {
      branch: 'a',
      document_case_id: parsed.document_case_id,
      trace_id: parsed.trace_id,
      candidate_set_ids,
      ambiguity_margin_computed,
      winner_candidate_id,
      exception_queue_entry_id: null,
      exception_reason: null,
    };

    log.info(
      {
        document_case_id: parsed.document_case_id,
        branch,
        winner_candidate_id,
        ambiguity_margin_computed,
        candidate_count: N,
      },
      'Subsystem 2 routed to branch (a): head pointer set, case classified → matched',
    );
    return decision;
  }

  // Branches (b)/(c): pure-audit RPC + cross-service enqueueException.
  const { data: decisionAuditId, error: rpcError } = await db.rpc('record_router_decision', {
    p_decision: {
      case_id: parsed.document_case_id,
      trace_id: parsed.trace_id,
    },
    p_audit: {
      org_id,
      user_id: ctx.caller.user_id,
      trace_id: parsed.trace_id,
      action: 'router_decision_recorded',
      entity_type: 'document_case',
      before_state: decisionBeforeState,
      tool_name: null,
      idempotency_key,
      reason: null,
    },
  });

  if (rpcError) {
    throw new ServiceError(
      'POST_FAILED',
      `record_router_decision RPC failed: ${rpcError.message}`,
    );
  }

  // Cross-service call to chunk-6 enqueueException. ServiceError
  // propagation is verbatim per chunks 3-6 no-wrap convention
  // (EXCEPTION_ALREADY_OPEN passes through unchanged).
  const exceptionEntry = await enqueueException(
    {
      document_case_id: parsed.document_case_id,
      exception_reason: exception_reason as ExceptionReason,
      trace_id: parsed.trace_id,
    },
    ctx,
  );

  const decision: RouterDecision = {
    branch,
    document_case_id: parsed.document_case_id,
    trace_id: parsed.trace_id,
    candidate_set_ids,
    ambiguity_margin_computed,
    winner_candidate_id: null,
    exception_queue_entry_id: exceptionEntry.exception_queue_entry_id,
    exception_reason,
  };

  log.info(
    {
      document_case_id: parsed.document_case_id,
      branch,
      exception_reason,
      exception_queue_entry_id: exceptionEntry.exception_queue_entry_id,
      decision_record_audit_log_id: decisionAuditId,
      ambiguity_margin_computed,
      candidate_count: N,
    },
    'Subsystem 2 routed to branches (b)/(c): decision recorded + chunk-6 enqueueException invoked',
  );
  return decision;
}

// ---------------------------------------------------------------------
// Subsystem 3 per-case re-evaluation helper (private).
//
// One per-case "unit of work" applied by the dispatcher's fan-out loop.
// Logic per amended brief §Architecture + Amendment §3 6-rule
// discriminator:
//
//   1. count_before = K2 head-of-chain SELECT pre-mutation.
//   2. open_exception_id = open exception_queue_entries row for case
//      (or null).
//   3. newCandidates = rematchCandidate(case_id, trace_id, ctx).
//      Empty for stranded cases (γ'-partial path); non-empty for cases
//      with prior candidates whose linked_entity_type ∈ ('bill',
//      'vendor_prepayment').
//   4. count_after = newCandidates.length (β-4 reconciliation: brief
//      Task 4 step 7 said "SELECT COUNT(*) post-mutation" but K2 head-
//      of-chain literal yields count_after = count_before for empty
//      re-runs since chunk-1 completeCandidate doesn't supersede priors.
//      newCandidates.length captures the operationally-coherent "fresh
//      valid candidate set size" the 6-rule discriminator needs; this
//      is the minimum-deviation interpretation that makes rules 2/4/6
//      reachable at v1).
//   5. If newCandidates non-empty AND case is not stranded: invoke
//      Subsystem 2 resolveCandidates for ambiguity resolution. Branch
//      (a) writes head pointer; branches (b)/(c) enqueue fresh
//      exception. At v1 with single-feature scoring, every N≥2 case
//      routes to branch (b) → exception; N=1 routes to branch (a) →
//      matched.
//   6. 6-rule discriminator:
//      | # | count_before | count_after | open exception | outcome | Action |
//      |---|---|---|---|---|---|
//      | 1 | any | > 0 | yes | re_routed_from_exception | cancel_exception_with_audit + audit |
//      | 2 | > 0 | > 0 | no  | candidate_superseded     | audit only |
//      | 3 | 0   | > 0 | no  | (unreachable γ'-partial) | throw POST_FAILED |
//      | 4 | > 0 | 0   | no  | re_routed_to_exception   | enqueueException + audit |
//      | 5 | > 0 | 0   | yes | (data-inconsistent)      | throw POST_FAILED |
//      | 6 | any | 0   | (else) | no_change             | audit only |
//   7. Emit router_re_evaluation_fired audit via recordMutation. R1
//      idempotency_key recipe.
//
// Rule 1 is structurally unreachable at v1 (γ'-partial returns [] for
// stranded cases by definition; cases with prior candidates have no
// concurrent open exception per chunk-6 partial UNIQUE). Defensive
// code present for Phase 7 γ-full activation.
//
// Rules 3+5 throw POST_FAILED with descriptive log per β-1 catchall
// precedent (no INTEGRITY_VIOLATION in ServiceErrorCode union).
// ---------------------------------------------------------------------
async function runPerCaseReEvaluation(
  case_id: string,
  trigger_type: DispatchTriggerInput['trigger_type'],
  org_id: string,
  trace_id: string,
  ctx: ServiceContext,
): Promise<RouterDecisionOutcome> {
  const log = loggerWith({ trace_id, user_id: ctx.caller.user_id });
  const db = adminClient();

  // K2 count_before: head-of-chain candidates pre-mutation.
  const { count: countBeforeRaw, error: countBeforeErr } = await db
    .from('document_relationship_candidates')
    .select('id', { count: 'exact', head: true })
    .eq('document_case_id', case_id)
    .is('supersedes_candidate_id', null);
  if (countBeforeErr) {
    throw new ServiceError(
      'READ_FAILED',
      `runPerCaseReEvaluation count_before failed for case ${case_id}: ${countBeforeErr.message}`,
    );
  }
  const count_before = countBeforeRaw ?? 0;

  // Open-exception probe: did the case enter this dispatcher run with
  // an open exception_queue_entries row?
  const { data: openExc, error: excErr } = await db
    .from('exception_queue_entries')
    .select('exception_queue_entry_id')
    .eq('document_case_id', case_id)
    .eq('exception_status', 'open')
    .maybeSingle();
  if (excErr) {
    throw new ServiceError(
      'READ_FAILED',
      `runPerCaseReEvaluation open-exception probe failed for case ${case_id}: ${excErr.message}`,
    );
  }
  const open_exception_id: string | null = openExc?.exception_queue_entry_id ?? null;

  // γ'-partial rematch primitive. Returns empty for stranded cases;
  // non-empty for cases with prior candidates whose linked_entity_type
  // ∈ ('bill', 'vendor_prepayment').
  const newCandidates = await rematchCandidate(case_id, trace_id, ctx);
  const count_after = newCandidates.length;

  // If rematchCandidate produced candidates and case has no open
  // exception, invoke Subsystem 2 ambiguity resolution. resolveCandidates'
  // branch (a) RPC has state-transition guard WHERE state='classified';
  // skipping when open_exception_id is set avoids the guard violation
  // (case is in needs_review for stranded paths). This path is rule 2
  // at v1 (candidate_superseded under D-partial-no-idempotency).
  if (count_after > 0 && !open_exception_id) {
    await resolveCandidates({ document_case_id: case_id, trace_id }, ctx);
  }

  // 6-rule discriminator.
  let decision_outcome: RouterDecisionOutcome;

  if (count_after > 0 && open_exception_id) {
    // Rule 1: re_routed_from_exception (structurally unreachable at v1
    // under γ'-partial; defensive code for Phase 7 γ-full activation).
    decision_outcome = 're_routed_from_exception';

    const { error: cancelErr } = await db.rpc('cancel_exception_with_audit', {
      p_entry_id: open_exception_id,
      p_audit: {
        user_id: ctx.caller.user_id ?? '',
        trace_id,
        action: 'exception_cancelled',
        entity_type: 'exception_queue_entry',
        tool_name: null,
        idempotency_key: null,
        reason: 'router_re_evaluation_fired: case re-routed out of exception queue',
      },
    });
    if (cancelErr) {
      // 23514 → EXCEPTION_ALREADY_CANCELLED (chunk-3 new). Caller-side
      // symmetric with chunk-6's EXCEPTION_ALREADY_OPEN. All other PG
      // errors (23503 FK violation, P0002 no_data_found, etc.) →
      // POST_FAILED catchall per β-1 precedent.
      if (cancelErr.code === '23514') {
        throw new ServiceError(
          'EXCEPTION_ALREADY_CANCELLED',
          `cancel_exception_with_audit: ${cancelErr.message}`,
        );
      }
      throw new ServiceError(
        'POST_FAILED',
        `cancel_exception_with_audit RPC failed: ${cancelErr.message}`,
      );
    }
  } else if (count_after > 0 && count_before > 0) {
    // Rule 2: candidate_superseded (D-partial-no-idempotency means this
    // fires on every non-empty re-run; chunk-1 completeCandidate does
    // not dedup against existing document_relationship_candidates).
    decision_outcome = 'candidate_superseded';
  } else if (count_after > 0 && count_before === 0) {
    // Rule 3: unreachable under γ'-partial. rematchCandidate returns []
    // for stranded cases (count_before=0 implies no prior candidate to
    // reconstruct from).
    log.error(
      { case_id, count_before, count_after, trigger_type },
      'dispatcher framing violation: count_before=0 + count_after>0 unreachable',
    );
    throw new ServiceError(
      'POST_FAILED',
      `dispatcher framing violation: count_before=0 + count_after>0 unreachable; rematchCandidate produced non-empty for stranded case ${case_id}`,
    );
  } else if (count_after === 0 && count_before > 0 && !open_exception_id) {
    // Rule 4: re_routed_to_exception. Invoke chunk-6 enqueueException
    // with unmatched_router_candidate. ServiceError propagation is
    // verbatim per chunks 3-6 no-wrap convention (EXCEPTION_ALREADY_OPEN
    // passes through unchanged should a concurrent dispatch race).
    decision_outcome = 're_routed_to_exception';

    await enqueueException(
      {
        document_case_id: case_id,
        exception_reason: 'unmatched_router_candidate',
        trace_id,
      },
      ctx,
    );
  } else if (count_after === 0 && count_before > 0 && open_exception_id) {
    // Rule 5: case has prior candidates AND is currently in exception
    // queue. β-5 reconciliation: amended brief §3 Rule 5 framed this
    // as "data-inconsistent" with throw POST_FAILED, but this state is
    // operationally reachable at v1 — T5/T8 invalidation produces
    // re_routed_to_exception (rule 4) which enqueues an exception
    // without removing prior candidates; a subsequent T1/T3 fan-out
    // legitimately picks up the case with priors + open exception.
    // Operationally correct outcome: no_change (rematchCandidate found
    // no fresh matches; case stays in exception queue).
    decision_outcome = 'no_change';
  } else {
    // Rule 6: no_change. T1/T3/T10-stranded path under γ'-partial
    // (count_before=0 + count_after=0) and any other "no work" path.
    decision_outcome = 'no_change';
  }

  // Emit router_re_evaluation_fired audit row (7 fields per ADR-0018
  // §Schema-deltas) via recordMutation. R1 idempotency_key recipe.
  // org_id surfaces via dispatcher input (parsed.org_id) — passed in.
  await recordMutation(db, ctx, {
    org_id,
    action: 'router_re_evaluation_fired',
    entity_type: 'document_case',
    entity_id: case_id,
    before_state: {
      trigger_type,
      candidate_count_before: count_before,
      candidate_count_after: count_after,
      decision_outcome,
    },
    idempotency_key: deriveDispatchIdempotencyKey(case_id, trigger_type, trace_id),
  });

  log.info(
    { case_id, trigger_type, count_before, count_after, decision_outcome },
    'router_re_evaluation_fired',
  );
  return decision_outcome;
}

// ---------------------------------------------------------------------
// Per-trigger fan-out query helpers (private).
//
// Each helper returns the list of document_case_ids that
// runPerCaseReEvaluation should apply to for a given trigger event.
// Per the amended brief §Per-trigger semantic-coverage table:
//   - T1 / T2 / T3: fan-out across stranded cases in exception queue
//     (audit-only at v1; rematchCandidate returns [] for stranded).
//     T2 added at Phase 5.1 chunk 5.1b (paymentService.record activation)
//     per shared "new-domain-entity-created" semantic class with T1/T3.
//   - T5: cases with pre-commit candidates pointing at the transitioned
//     bill (re-routing-functional via rematchCandidate).
//   - T8: cases with pre-commit candidates whose extracted_invoice_date
//     falls in the reopened period (re-routing-functional).
//   - T10: single caller-specified case (re-routing-functional if case
//     has priors; audit-only if stranded).
// ---------------------------------------------------------------------

// T1 / T2 / T3 fan-out (v1 audit-only): open exception_queue_entries
// with exception_reason='unmatched_router_candidate' for the org.
// Vendor-targeted fan-out activates when Phase 7 ships substrate to
// link stranded cases to vendor identifiers.
async function computeT1T2T3FanOut(db: Db, org_id: string): Promise<string[]> {
  const { data, error } = await db
    .from('exception_queue_entries')
    .select('document_case_id')
    .eq('org_id', org_id)
    .eq('exception_status', 'open')
    .eq('exception_reason', 'unmatched_router_candidate');
  if (error) {
    throw new ServiceError(
      'READ_FAILED',
      `computeT1T2T3FanOut failed for org ${org_id}: ${error.message}`,
    );
  }
  const ids = (data ?? []).map((r) => r.document_case_id as string);
  // De-duplicate (partial UNIQUE on open status guarantees uniqueness
  // per case, but be defensive).
  return Array.from(new Set(ids));
}

// T5 fan-out: head-of-chain candidates pointing at the transitioned bill.
async function computeT5FanOut(
  db: Db,
  org_id: string,
  bill_id: string,
): Promise<string[]> {
  const { data, error } = await db
    .from('document_relationship_candidates')
    .select('document_case_id')
    .eq('org_id', org_id)
    .eq('linked_entity_type', 'bill')
    .eq('linked_entity_id', bill_id)
    .is('supersedes_candidate_id', null);
  if (error) {
    throw new ServiceError(
      'READ_FAILED',
      `computeT5FanOut failed for bill ${bill_id}: ${error.message}`,
    );
  }
  const ids = (data ?? []).map((r) => r.document_case_id as string);
  return Array.from(new Set(ids));
}

// T8 fan-out: head-of-chain candidates whose date_proximity feature's
// raw_value.extracted (chunk 3 structured candidate_features per
// CandidateFeaturesSchema) falls in the reopened period's date range.
// accounting_date derivation at v1 uses extracted invoice/receipt/payment
// date as the proxy (verify-at-impl ledger item 3). Phase 7 may introduce
// a dedicated accounting_date column on the case substrate; if so, the
// filter migrates.
async function computeT8FanOut(
  db: Db,
  org_id: string,
  period_id: string,
): Promise<string[]> {
  // Resolve period date range first.
  const { data: period, error: periodErr } = await db
    .from('fiscal_periods')
    .select('start_date, end_date, org_id')
    .eq('period_id', period_id)
    .single();
  if (periodErr || !period) {
    throw new ServiceError(
      'READ_FAILED',
      `computeT8FanOut: fiscal_period ${period_id} not found: ${periodErr?.message ?? 'no rows'}`,
    );
  }
  if ((period as { org_id: string }).org_id !== org_id) {
    throw new ServiceError(
      'READ_FAILED',
      `computeT8FanOut: fiscal_period ${period_id} org_id mismatch`,
    );
  }

  // Filter head-of-chain candidates by extracted_invoice_date in range.
  const { data, error } = await db
    .from('document_relationship_candidates')
    .select('document_case_id, candidate_features')
    .eq('org_id', org_id)
    .is('supersedes_candidate_id', null);
  if (error) {
    throw new ServiceError(
      'READ_FAILED',
      `computeT8FanOut head-of-chain query failed: ${error.message}`,
    );
  }

  const start = (period as { start_date: string }).start_date;
  const end = (period as { end_date: string }).end_date;
  const ids = new Set<string>();
  for (const row of data ?? []) {
    const features = (row as { candidate_features: CandidateFeatures | null })
      .candidate_features;
    const dateFeature = features?.features?.find(
      (f) => f.feature_name === 'date_proximity',
    );
    const dateRaw = dateFeature?.raw_value as
      | { extracted?: string | null }
      | null
      | undefined;
    const extractedDate = dateRaw?.extracted ?? null;
    if (!extractedDate) continue;
    if (extractedDate >= start && extractedDate <= end) {
      ids.add((row as { document_case_id: string }).document_case_id);
    }
  }
  return Array.from(ids);
}

// ---------------------------------------------------------------------
// Public: dispatchTrigger (Subsystem 3 entry point).
//
// Layer 2 boundary: Zod parse via DispatchTriggerInputSchema (6-branch
// discriminated union; T2_new_payment added at Phase 5.1 chunk 5.1b).
// Per-trigger fan-out via the helpers above; per-case loop wrapping
// runPerCaseReEvaluation in try/catch.
//
// Per-trigger-type failure policy (Round 5.b-i lock):
//   - T1 / T2 / T3 / T5 / T8: log + skip + continue (best-effort fan-out).
//     Failed case emits dispatch_failed audit in SEPARATE small
//     transaction so the audit survives the per-case rollback.
//   - T10: re-throw the original error after dispatch_failed audit.
//     Caller-driven trigger; failure must propagate so the caller
//     (documentExceptionService.resolveException) can surface it.
//
// PG-rollback failures within the per-case transaction stay silent
// by mechanism (rollback voids any in-transaction audit row); they
// surface only via pino logs. dispatch_failed captures the operational
// subset where the dispatcher catches a thrown ServiceError outside
// the per-case rollback boundary.
// ---------------------------------------------------------------------
export async function dispatchTrigger(
  input: DispatchTriggerInputRaw,
  ctx: ServiceContext,
): Promise<void> {
  const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });

  // Layer 2 boundary: Zod parse at service entry. Discriminated union
  // rejects unknown trigger_type values (T4/T6 reserved per Framing F
  // pending vendorCreditService; T7/T9 reserved post-v1). T2_new_payment
  // activated at Phase 5.1 chunk 5.1b (paymentService.record ship).
  let parsed: DispatchTriggerInput;
  try {
    parsed = DispatchTriggerInputSchema.parse(input);
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new ServiceError(
        'READ_FAILED',
        `dispatchTrigger validation failed: ${err.message}`,
      );
    }
    throw err;
  }

  const db = adminClient();

  // Compute fan-out case IDs per trigger_type. Each helper opens its
  // own read-only queries against adminClient. T10 short-circuits to
  // the single caller-specified case.
  let fanOutCaseIds: string[];
  switch (parsed.trigger_type) {
    case 'T1_new_bill':
    case 'T2_new_payment':
    case 'T3_new_vendor_prepayment':
      fanOutCaseIds = await computeT1T2T3FanOut(db, parsed.org_id);
      break;
    case 'T5_bill_state_transition':
      fanOutCaseIds = await computeT5FanOut(db, parsed.org_id, parsed.bill_id);
      break;
    case 'T8_period_reopen':
      fanOutCaseIds = await computeT8FanOut(db, parsed.org_id, parsed.period_id);
      break;
    case 'T10_manual_override':
      fanOutCaseIds = [parsed.case_id];
      break;
  }

  log.info(
    {
      trigger_type: parsed.trigger_type,
      fan_out_count: fanOutCaseIds.length,
      org_id: parsed.org_id,
    },
    'dispatchTrigger fan-out computed',
  );

  // Per-case fan-out loop with try/catch.
  for (const caseId of fanOutCaseIds) {
    try {
      await runPerCaseReEvaluation(
        caseId,
        parsed.trigger_type,
        parsed.org_id,
        parsed.trace_id,
        ctx,
      );
    } catch (err) {
      log.error(
        { err, case_id: caseId, trigger_type: parsed.trigger_type },
        'Per-case re-evaluation failed',
      );

      // Emit dispatch_failed audit in SEPARATE small transaction.
      // Innermost catch is fully silent per Round 5.b'-α-modified.
      try {
        await recordMutation(adminClient(), ctx, {
          org_id: parsed.org_id,
          action: 'router_re_evaluation_fired',
          entity_type: 'document_case',
          entity_id: caseId,
          before_state: {
            trigger_type: parsed.trigger_type,
            decision_outcome: 'dispatch_failed',
            error_class: err instanceof ServiceError ? err.code : 'unknown',
          },
          idempotency_key: deriveDispatchIdempotencyKey(
            caseId,
            parsed.trigger_type,
            parsed.trace_id,
          ),
        });
      } catch (auditErr) {
        log.error(
          { auditErr, case_id: caseId },
          'dispatch_failed audit emission failed; fully silent',
        );
      }

      // T10 (single-case caller-driven): fail-and-propagate.
      // Fan-out triggers: continue to next case.
      if (parsed.trigger_type === 'T10_manual_override') {
        throw err;
      }
    }
  }
}

// ---------------------------------------------------------------------
// Private read helper: read-back single candidate after RPC INSERT.
// Zod safeParse via DocumentRelationshipCandidateSchema (includes
// pair-validity .refine() defense). Not exported at chunk-1 (single
// consumer = completeCandidate); lift to public readDocumentRelationshipCandidate
// when chunks 2+ Subsystem 2 emerges as a second consumer.
// ---------------------------------------------------------------------
async function readDocumentRelationshipCandidate(
  db: Db,
  id: string,
): Promise<DocumentRelationshipCandidate> {
  const { data, error } = await db
    .from('document_relationship_candidates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new ServiceError(
      'NOT_FOUND',
      `readDocumentRelationshipCandidate ${id} failed: ${error.message}`,
    );
  }

  const parsed = DocumentRelationshipCandidateSchema.safeParse(data);
  if (!parsed.success) {
    throw new ServiceError(
      'READ_FAILED',
      `readDocumentRelationshipCandidate ${id} returned unexpected shape: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}

// LINKED_ENTITY_TABLE_MAP import is currently unused at chunk-1 (no
// polymorphic table-lookup needed for Subsystem 1's matching logic —
// the document_type drives the helper choice directly). Imported here
// as a forward-compat anchor: chunks 2+ Subsystem 2 will likely use
// the map to navigate post-candidate entity reads (e.g., reading the
// matched entity's full row for proposal-construction). Exported by
// the chunk-5 schema with explicit cross-chunk-reuse intent.
//
// Leaving the import in place documents the architectural connection
// without enforcing it; chunks 2+ enable the consumer.
void LINKED_ENTITY_TABLE_MAP;
