// src/services/document-platform/documentRouterService.ts
//
// Phase 4 chunk 1 — Subsystem 1 (Ledger-State Candidate Completion)
// per ADR-0018 §item 2. Pattern B unwrapped service (chunks 1-3 + 5 +
// 6 precedent; route handlers wrap via withInvariants() at the call
// site with action grain 'document_router.complete_candidate').
//
// One public function:
//   - completeCandidate(input, ctx) — given an "incomplete candidate"
//     per ADR-0014 §11 (document_type + extracted fields + vendor
//     match), reads committed AP/Spend state via Tier 2.5 cross-
//     domain reads, produces zero or more DocumentRelationshipCandidate
//     rows via atomic batch RPC.
//
// Four private read helpers (Tier 2.5 cross-domain reads via
// adminClient; chunks-5-6 don't cross-import services for reads;
// apReportService.loadBillsWithAmountDue + vendorReportService.balance()
// are the closest precedents):
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
// loadOpenVendorCreditsForVendor deliberately skipped at chunk 1:
// vendor_credit + vendor_credit_application are reserved post-v1 per
// Phase 2.5 Commit A; the Phase 5 vendor_credits table doesn't exist.
// Subsystem 1 cannot produce (vendor_credit, *) candidates at v1
// because the pair isn't in chunk-5's 13-cell VALID_PAIRS matrix.
//
// CONFIDENCE_THRESHOLDS_V1_PROVISIONAL per ADR-0014 §7 Q65. ADR-0019
// (Confidence Calibration Policy, not yet ratified) is the future
// governance owner. When ADR-0019 ratifies, chunks-N amends the
// constant with calibrated values. The constant's location at the
// consuming-service top makes the amendment surface mechanical.
//
// 'unknown' document_type early-returns [] per ADR-0018 §item 2 +
// ADR-0014 §7 Q65 (unknown short-circuits to exception queue at the
// pipeline orchestrator level, before completeCandidate is invoked;
// if invoked anyway, service returns empty + info log — caller routes
// to exception per Subsystem 2 branch (c)).
//
// Subsystem-write-scope discipline (M3-α): completeCandidate produces
// candidates ONLY; does NOT write document_cases.current_relationship_candidate_id.
// Subsystem 2 (chunks 2+) picks the winner per ADR-0018 §item 3
// branches (a/b/c) and sets the head pointer at that time.

import { z } from 'zod';
import {
  CompleteCandidateInputSchema,
  DocumentRelationshipCandidateSchema,
  type CompleteCandidateInputRaw,
  type CompleteCandidateInput,
  type DocumentRelationshipCandidate,
} from '@/shared/schemas/document-platform/documentRelationshipCandidate.schema';
import { LINKED_ENTITY_TABLE_MAP } from '@/shared/schemas/document-platform/sourceDocumentLink.schema';
import type { DocumentType } from '@/shared/schemas/document-platform/documentCase.schema';
import { adminClient } from '@/db/adminClient';
import { ServiceError } from '@/services/errors/ServiceError';
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
}

interface OpenPaymentForRouter {
  payment_id: string;
  vendor_id: string;
  payment_state: 'pending' | 'paid';
  amount: number;
  payment_date: string;
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
interface NewCandidatePayload {
  document_case_id: string;
  source_document_id: string;
  supersedes_candidate_id: string | null;
  linked_entity_type: string;
  linked_entity_id: string;
  link_role: string;
  confidence_score: number;
  candidate_features: Record<string, unknown>;
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
    .select('bill_id, vendor_id, lifecycle_state, amount_cad, issue_date, due_date')
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
    .select('payment_id, vendor_id, payment_state, amount, payment_date')
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

  const baseFeatures: Record<string, unknown> = {
    vendor_match_type: parsed.vendor_match.match_type,
    vendor_match_confidence: parsed.vendor_match.confidence,
    document_type: parsed.document_type,
    classification_confidence: parsed.classification_confidence,
  };

  if (parsed.document_type === 'vendor_invoice') {
    // vendor_invoice → bill matching (link_role = primary_invoice).
    const openBills = await loadOpenBillsForVendor(db, org_id, vendor_id);
    for (const bill of openBills) {
      if (existingKeys.has(existingPairKey('bill', bill.bill_id))) continue;
      candidatesToProduce.push({
        document_case_id: parsed.document_case_id,
        source_document_id: parsed.source_document_id,
        supersedes_candidate_id: null,
        linked_entity_type: 'bill',
        linked_entity_id: bill.bill_id,
        link_role: 'primary_invoice',
        confidence_score: parsed.vendor_match.confidence,
        candidate_features: {
          ...baseFeatures,
          bill_lifecycle_state: bill.lifecycle_state,
          bill_amount_cad: bill.amount_cad,
          extracted_amount: parsed.extracted_fields.invoice_amount ?? null,
          extracted_invoice_date: parsed.extracted_fields.invoice_date ?? null,
        },
        trace_id: parsed.trace_id,
      });
    }
  } else if (parsed.document_type === 'receipt') {
    // Scenario A: receipt → payment (link_role = payment_evidence).
    const openPayments = await loadOpenPaymentsForVendor(db, org_id, vendor_id);
    for (const payment of openPayments) {
      if (existingKeys.has(existingPairKey('payment', payment.payment_id))) continue;
      candidatesToProduce.push({
        document_case_id: parsed.document_case_id,
        source_document_id: parsed.source_document_id,
        supersedes_candidate_id: null,
        linked_entity_type: 'payment',
        linked_entity_id: payment.payment_id,
        link_role: 'payment_evidence',
        confidence_score: parsed.vendor_match.confidence,
        candidate_features: {
          ...baseFeatures,
          scenario: 'receipt_to_payment',
          payment_state: payment.payment_state,
          payment_amount: payment.amount,
          extracted_amount: parsed.extracted_fields.receipt_amount ?? null,
        },
        trace_id: parsed.trace_id,
      });
    }
    // Scenario B: receipt → bill (link_role = receipt).
    const openBillsForReceipt = await loadOpenBillsForVendor(db, org_id, vendor_id);
    for (const bill of openBillsForReceipt) {
      if (existingKeys.has(existingPairKey('bill', bill.bill_id))) continue;
      candidatesToProduce.push({
        document_case_id: parsed.document_case_id,
        source_document_id: parsed.source_document_id,
        supersedes_candidate_id: null,
        linked_entity_type: 'bill',
        linked_entity_id: bill.bill_id,
        link_role: 'receipt',
        confidence_score: parsed.vendor_match.confidence,
        candidate_features: {
          ...baseFeatures,
          scenario: 'receipt_to_bill',
          bill_lifecycle_state: bill.lifecycle_state,
          bill_amount_cad: bill.amount_cad,
          extracted_amount: parsed.extracted_fields.receipt_amount ?? null,
        },
        trace_id: parsed.trace_id,
      });
    }
  } else if (parsed.document_type === 'payment_confirmation') {
    // payment_confirmation → payment (link_role = payment_evidence).
    const openPayments = await loadOpenPaymentsForVendor(db, org_id, vendor_id);
    for (const payment of openPayments) {
      if (existingKeys.has(existingPairKey('payment', payment.payment_id))) continue;
      candidatesToProduce.push({
        document_case_id: parsed.document_case_id,
        source_document_id: parsed.source_document_id,
        supersedes_candidate_id: null,
        linked_entity_type: 'payment',
        linked_entity_id: payment.payment_id,
        link_role: 'payment_evidence',
        confidence_score: parsed.vendor_match.confidence,
        candidate_features: {
          ...baseFeatures,
          scenario: 'payment_confirmation_to_payment',
          payment_state: payment.payment_state,
          payment_amount: payment.amount,
          extracted_amount: parsed.extracted_fields.payment_amount ?? null,
        },
        trace_id: parsed.trace_id,
      });
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
