// src/agent/orchestrator/extraction/reviewPreview.ts
//
// Wave 6 D3 T5 — review-time proposal REBUILD (brief D-2: rebuild, not
// persist). Assembles everything the review detail surface needs from
// PERSISTED state — no Modal, no Claude, no writes:
//
//   - the org-verified case row (the IDOR root: every downstream read
//     derives from THIS row's ids, never from caller-supplied ids),
//   - persisted candidates VERBATIM (routing is NOT re-run; the
//     recorded decision stands — brief D-2),
//   - Stage-4 Tier-A re-extraction over the persisted
//     document_artifacts OCR (the *TierA additive named exports —
//     deterministic, no AI on the review path; Tier-C-extracted docs
//     may re-extract thinner and degrade to NOT_POSTABLE → manual
//     routes, brief D-2 residual (a)),
//   - Stage-5 matchVendor (pure org-scoped read) via the SAME
//     extractVendorFields projection the pipeline uses,
//   - buildProposal (pure, deterministic) over the rebuilt inputs,
//   - a postability verdict (advisory — T6's input builders are
//     authoritative; a builder-null at approve time is a 409),
//   - the posted-JE probe by the (org, 'manual', case_id) triple —
//     the operator-visible post-status for `approved` cases (the
//     D-4 stranding window) and T6's recovery lookup shape.
//
// Placement: agent layer (imports the extraction stages; ADR-0020 —
// services/ may not import agent/). Sibling file in extraction/ — no
// new folder, no guardrail fire.

import crypto from 'crypto';
import { loggerWith } from '@/shared/logger/pino';
import { vendorService } from '@/services/spend/vendorService';
import { loadReviewPreviewRows } from '@/services/document-platform/reviewPreviewReadService';
import type {
  ServiceContext,
  SystemActorServiceContext,
} from '@/services/middleware/serviceContext';
import { extractOcrText } from './classifier/extractOcrText';
import { extractVendorInvoiceFieldsTierA } from './vendorInvoiceExtractor';
import { extractReceiptFieldsTierA } from './receiptExtractor';
import { extractPaymentConfirmationFieldsTierA } from './paymentConfirmationExtractor';
import { buildProposal } from './stages/proposalBuilder';
import { extractVendorFields } from './ingestDocument';
import type {
  DocumentArtifactRow,
  ProposalResult,
  RelationshipCandidate,
  VendorMatchResult,
} from './types';

export interface ReviewPreviewInput {
  org_id: string;
  document_case_id: string;
  trace_id: string;
}

export interface ReviewPreviewCaseSummary {
  id: string;
  org_id: string;
  state: string;
  document_type: string;
  classification_confidence: number | null;
  created_at: string;
  trace_id: string;
}

/** Board #4 T2.5 — one card per persisted α row for a multi-invoice case.
 *  Built by reading `α.extracted_fields` (the verbatim pipeline extraction —
 *  no re-extraction) and re-running the pure Stage-5 matchVendor + Stage-7
 *  buildProposal per invoice. `postable`/`not_postable_reason` here are
 *  per-invoice ADVISORY only — the case-level Approve & Post is deferred to
 *  T3 (the N-bill loop); see ReviewPreview.postable. */
export interface ReviewInvoiceCard {
  /** The α (extracted_invoices) row id — the T3 approve-post loop's write
   *  target for postExtractedInvoice (posted_bill_id/post_status/key). */
  id: string;
  ordinal: number;
  document_type: string;
  extracted_fields: Record<string, unknown>;
  vendor_match: VendorMatchResult | null;
  proposal: ProposalResult | null;
  postable: boolean;
  not_postable_reason: ReviewPreview['not_postable_reason'];
  post_status: string;
  posted_bill_id: string | null;
}

export interface ReviewPreview {
  document_case: ReviewPreviewCaseSummary;
  source_document: {
    id: string;
    original_filename: string;
    mime_type: string;
    original_byte_size: number;
    received_at: string;
  } | null;
  candidates: Array<{
    id: string;
    linked_entity_type: string;
    linked_entity_id: string | null;
    link_role: string;
    confidence_score: number;
  }>;
  open_exception: {
    exception_queue_entry_id: string;
    exception_reason: string;
    created_at: string;
  } | null;
  /** The rebuilt proposal — null when no artifacts / unknown type. */
  proposal: ProposalResult | null;
  extracted_fields: Record<string, unknown>;
  vendor_match: VendorMatchResult | null;
  /** Advisory — T6's input builders are authoritative at approve time. */
  postable: boolean;
  not_postable_reason:
    | 'no_artifacts'
    | 'unknown_document_type'
    | 'attachment_kind_no_ledger_post'
    | 'bundle_requires_manual_entry'
    | 'no_proposal'
    | 'missing_required_fields'
    // Board #4 T2.5 — case-level multi-invoice deferral. SUPERSEDED 2026-07-11
    // by T3 (3b): the N-bill loop now exists, so a multi-invoice case is
    // postable-via-loop and this value is NO LONGER PRODUCED (the multi branch
    // aggregates per-card postability). Kept in the type for historical
    // audit_log/response payloads; safe to retire once none remain.
    | 'multi_invoice_post_deferred'
    | null;
  /** Board #4 T2.5 — the per-invoice α cards for a multi-invoice case (N≥2 α
   *  rows read `ORDER BY ordinal`). null for single-invoice / α-absent cases,
   *  which use the top-level single-card Tier-A rebuild (the fallback). */
  invoices: ReviewInvoiceCard[] | null;
  /** The per-child dedup-triple probe (T6 ruling: uniform suffixing —
   *  `${caseId}:bill` / `${caseId}:payment`). Multi-JE-aware: a
   *  born-paid bundle would carry two children; the probe returns ALL
   *  child JEs so the recovery lookup is never single-row-blinded. */
  posted_journal_entries: Array<{
    journal_entry_id: string;
    entry_number: number;
    source_external_id: string;
  }>;
}

function tierAFieldsFor(
  documentType: string,
  ocrText: string,
): Record<string, unknown> {
  switch (documentType) {
    case 'vendor_invoice':
      return extractVendorInvoiceFieldsTierA(ocrText) as Record<string, unknown>;
    case 'receipt':
      return extractReceiptFieldsTierA(ocrText) as Record<string, unknown>;
    case 'payment_confirmation':
      return extractPaymentConfirmationFieldsTierA(
        ocrText,
      ) as Record<string, unknown>;
    default:
      return {};
  }
}

// Mirrors buildPostBillInput's null rules (advisory grain): amount +
// a usable date are required for any post; post_bill / bundle also
// need a matched vendor_id.
function postability(
  proposal: ProposalResult | null,
  extracted: Record<string, unknown>,
  vendorMatch: VendorMatchResult | null,
): { postable: boolean; reason: ReviewPreview['not_postable_reason'] } {
  if (!proposal) return { postable: false, reason: 'no_proposal' };
  if (proposal.kind === 'proposed_attachment_card') {
    // The underlying entity already exists — nothing to post; the
    // review actions for this kind are the resolve/reject routes.
    return { postable: false, reason: 'attachment_kind_no_ledger_post' };
  }
  if (proposal.kind === 'proposed_mutation_bundle') {
    // Grounded at T6 onset: born-paid bundles are STRUCTURALLY
    // UNREACHABLE under the Tier-A-only rebuild (the dual-evidence
    // field set — vendor_invoice_number+amount AND payment evidence —
    // only ever came from Tier-C extractions, and D-2 keeps AI off the
    // review path). Defensive: if one ever materializes, it routes to
    // manual entry rather than a partially-supported two-child post.
    // Carry-forward: bundle-at-review posting returns with Tier-C-at-
    // review or persisted proposals (post-V1).
    return { postable: false, reason: 'bundle_requires_manual_entry' };
  }
  const amount = typeof extracted.amount === 'string' ? extracted.amount : null;
  const date =
    typeof extracted.accounting_date === 'string'
      ? extracted.accounting_date
      : typeof extracted.issue_date === 'string'
        ? extracted.issue_date
        : null;
  if (!amount || !date) {
    return { postable: false, reason: 'missing_required_fields' };
  }
  // Only proposed_entry_card reaches here (attachment + bundle kinds
  // early-return above). post_bill requires a matched vendor.
  if (!vendorMatch?.vendor_id) {
    return { postable: false, reason: 'missing_required_fields' };
  }
  return { postable: true, reason: null };
}

export async function buildReviewPreview(
  input: ReviewPreviewInput,
  ctx: ServiceContext | SystemActorServiceContext,
): Promise<ReviewPreview> {
  const log = loggerWith({
    trace_id: ctx.trace_id,
    user_id: ctx.caller.user_id ?? undefined,
  });
  // All persisted-state reads live in the services layer (Arc 1 T2 —
  // ADR-0020 Law 1). The org-verified IDOR-root sequencing is preserved
  // INSIDE loadReviewPreviewRows: the case row is fetched WITH the org
  // filter (foreign caseId misses identically to a nonexistent one) and
  // every downstream read derives from that verified row's ids.
  const rows = await loadReviewPreviewRows({
    org_id: input.org_id,
    document_case_id: input.document_case_id,
  });
  const { caseRow, sourceDocumentId, exRow, jeRows } = rows;

  const candidates = (rows.candRows ?? []).map((c) => ({
    id: c.id as string,
    linked_entity_type: c.linked_entity_type as string,
    linked_entity_id: (c.linked_entity_id as string) ?? null,
    link_role: c.link_role as string,
    confidence_score: Number(c.confidence_score),
  }));

  // Source-doc metadata + artifact (mapped from the hoisted reads; the
  // narrowing casts stay agent-side — services return loose rows).
  const sd = rows.sourceDocRow;
  const sourceDocument: ReviewPreview['source_document'] = sd
    ? {
        id: sd.id as string,
        original_filename: sd.original_filename as string,
        mime_type: sd.mime_type as string,
        original_byte_size: sd.original_byte_size as number,
        received_at: sd.received_at as string,
      }
    : null;
  const artifact = (rows.artifactRow as DocumentArtifactRow | null) ?? null;

  const base = {
    document_case: {
      id: caseRow.id as string,
      org_id: caseRow.org_id as string,
      state: caseRow.state as string,
      document_type: caseRow.document_type as string,
      classification_confidence:
        caseRow.classification_confidence === null
          ? null
          : Number(caseRow.classification_confidence),
      created_at: caseRow.created_at as string,
      trace_id: caseRow.trace_id as string,
    },
    source_document: sourceDocument,
    candidates,
    open_exception: exRow
      ? {
          exception_queue_entry_id: exRow.exception_queue_entry_id as string,
          exception_reason: exRow.exception_reason as string,
          created_at: exRow.created_at as string,
        }
      : null,
    posted_journal_entries: (jeRows ?? []).map((je) => ({
      journal_entry_id: je.journal_entry_id as string,
      entry_number: je.entry_number as number,
      source_external_id: je.source_external_id as string,
    })),
  };

  // Board #4 T2.5 — multi-invoice case: read the case's N α rows → N cards. No
  // re-extraction; each card is built from α.extracted_fields (the verbatim
  // pipeline extraction) + a pure per-α matchVendor + buildProposal. Only
  // multi-invoice cases carry α (T2c writes N≥2; single-invoice writes none),
  // so this branch is the two-path reversal of middle-design §3 (see the
  // supersession there). The case-level Approve & Post is deferred to T3 (the
  // N-bill loop): the case is NOT postable via the single-bill path, and
  // per-card postability is advisory only.
  const alphaRows = rows.alphaRows ?? [];
  if (alphaRows.length > 0) {
    const relationshipCandidates: RelationshipCandidate[] = sourceDocumentId
      ? candidates.map((c) => ({
          id: c.id,
          document_case_id: caseRow.id as string,
          source_document_id: sourceDocumentId,
          linked_entity_type: c.linked_entity_type,
          linked_entity_id: c.linked_entity_id,
          link_role: c.link_role,
          confidence_score: c.confidence_score,
        }))
      : [];
    const invoices: ReviewInvoiceCard[] = [];
    for (const a of alphaRows) {
      // Copy so the read row is not mutated by the money normalization below.
      const aFields = {
        ...((a.extracted_fields as Record<string, unknown>) ?? {}),
      };
      // Money-string normalization (INV-MONEY-001): α stores amount as a
      // NUMBER (the MultiInvoiceItem schema), same as the single-card path
      // normalizes below before postability + the T3 builders.
      if (typeof aFields.amount === 'number' && Number.isFinite(aFields.amount)) {
        aFields.amount = (aFields.amount as number).toFixed(2);
      }
      const aDocType = a.document_type as string;
      const aVendorMatch = await vendorService.matchVendor(
        {
          org_id: caseRow.org_id as string,
          vendorField: extractVendorFields(aFields),
          trace_id: input.trace_id,
        },
        ctx,
      );
      const aProposal =
        sourceDocumentId && aDocType !== 'unknown'
          ? buildProposal({
              source_document_id: sourceDocumentId,
              classification: {
                documentType: aDocType as
                  | 'vendor_invoice'
                  | 'receipt'
                  | 'payment_confirmation'
                  | 'unknown',
                confidence: Number(caseRow.classification_confidence ?? 0),
                rationale: 'review-time α read (board #4 T2.5)',
                tier: 'A',
              },
              extractedFields: aFields,
              vendorMatch: aVendorMatch,
              relationshipCandidates,
              trace_id: crypto.randomUUID(),
            })
          : null;
      const aVerdict = postability(aProposal, aFields, aVendorMatch);
      invoices.push({
        id: a.id as string,
        ordinal: a.ordinal as number,
        document_type: aDocType,
        extracted_fields: aFields,
        vendor_match: aVendorMatch,
        proposal: aProposal,
        postable: aVerdict.postable,
        not_postable_reason: aVerdict.reason,
        post_status: a.post_status as string,
        posted_bill_id: (a.posted_bill_id as string) ?? null,
      });
    }
    log.info(
      {
        document_case_id: caseRow.id,
        invoice_count: invoices.length,
        postable_count: invoices.filter((i) => i.postable).length,
      },
      'reviewPreview — multi-invoice α read (N cards)',
    );
    // Board #4 T3 (3b): the case-level Approve & Post now DRIVES the N-branch
    // post loop (was T2.5's deferred gate, multi_invoice_post_deferred). The
    // case is postable if any α can post (per-card postable — required fields +
    // a vendor match) OR any α is already posted while the case has not reached
    // committed (crash-recovery of the aggregate committed marking). The route
    // posts the postable α per-invoice-independently and advances committed iff
    // all α carry posted_bill_id.
    const anyPostable = invoices.some(
      (i) => i.postable || i.post_status === 'posted',
    );
    return {
      ...base,
      invoices,
      // Case-level single-card fields are inert for a multi-invoice case — the
      // N cards live in `invoices`.
      proposal: null,
      extracted_fields: {},
      vendor_match: null,
      postable: anyPostable,
      not_postable_reason: anyPostable ? null : 'missing_required_fields',
    };
  }

  // Degraded previews (honest, named): no artifacts → no rebuild;
  // unknown type → no extractor. (α-absent single-invoice path continues
  // below with the Tier-A rebuild — the fallback.)
  if (!artifact || !sourceDocumentId) {
    return {
      ...base,
      invoices: null,
      proposal: null,
      extracted_fields: {},
      vendor_match: null,
      postable: false,
      not_postable_reason: 'no_artifacts',
    };
  }
  if (caseRow.document_type === 'unknown') {
    return {
      ...base,
      invoices: null,
      proposal: null,
      extracted_fields: {},
      vendor_match: null,
      postable: false,
      not_postable_reason: 'unknown_document_type',
    };
  }

  // Stage-4 Tier-A re-extraction (deterministic; no AI on review path).
  const ocrText = extractOcrText(artifact);
  const extracted = tierAFieldsFor(caseRow.document_type as string, ocrText);

  // Money-string normalization (INV-MONEY-001: amounts are strings).
  // Tier A emits `amount` as a NUMBER (vendorInvoiceExtractor.ts ~:84)
  // — a latent inconsistency with buildPostBillInput's string check,
  // inert in the live pipeline post-bleed-stop. Normalized HERE so the
  // rebuild speaks the money-string convention; named finding at the
  // T5 read-back (T6's builders consume the normalized shape).
  if (
    typeof extracted.amount === 'number' &&
    Number.isFinite(extracted.amount)
  ) {
    extracted.amount = (extracted.amount as number).toFixed(2);
  }

  // Stage-5 vendor match — the SAME projection the pipeline uses.
  const vendorMatch = await vendorService.matchVendor(
    {
      org_id: caseRow.org_id as string,
      vendorField: extractVendorFields(extracted),
      trace_id: input.trace_id,
    },
    ctx,
  );

  // Stage-7 rebuild — pure function over rebuilt inputs; persisted
  // candidates stand verbatim as the routing context.
  const relationshipCandidates: RelationshipCandidate[] = candidates.map(
    (c) => ({
      id: c.id,
      document_case_id: caseRow.id as string,
      source_document_id: sourceDocumentId,
      linked_entity_type: c.linked_entity_type,
      linked_entity_id: c.linked_entity_id,
      link_role: c.link_role,
      confidence_score: c.confidence_score,
    }),
  );
  const proposal = buildProposal({
    source_document_id: sourceDocumentId,
    classification: {
      documentType: caseRow.document_type as
        | 'vendor_invoice'
        | 'receipt'
        | 'payment_confirmation'
        | 'unknown',
      confidence: Number(caseRow.classification_confidence ?? 0),
      rationale: 'review-time rebuild (Tier A over persisted artifacts)',
      tier: 'A',
    },
    extractedFields: extracted,
    vendorMatch,
    relationshipCandidates,
    trace_id: crypto.randomUUID(),
  });

  const verdict = postability(proposal, extracted, vendorMatch);
  log.info(
    {
      document_case_id: caseRow.id,
      proposal_kind: proposal ? proposal.kind : null,
      postable: verdict.postable,
      not_postable_reason: verdict.reason,
    },
    'reviewPreview rebuilt',
  );

  return {
    ...base,
    invoices: null,
    proposal,
    extracted_fields: extracted,
    vendor_match: vendorMatch,
    postable: verdict.postable,
    not_postable_reason: verdict.reason,
  };
}
