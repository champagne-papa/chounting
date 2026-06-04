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
import { adminClient } from '@/db/adminClient';
import { ServiceError } from '@/services/errors/ServiceError';
import { loggerWith } from '@/shared/logger/pino';
import { vendorService } from '@/services/spend/vendorService';
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
    | null;
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
  const db = adminClient();

  // The org-verified root row: fetched WITH the org filter — a foreign
  // org's caseId misses identically to a nonexistent one (no existence
  // leak; brief D-1.2). Every downstream read derives from this row.
  const { data: caseRow, error: caseErr } = await db
    .from('document_cases')
    .select(
      'id, org_id, state, document_type, classification_confidence, created_at, trace_id',
    )
    .eq('id', input.document_case_id)
    .eq('org_id', input.org_id)
    .maybeSingle();
  if (caseErr) {
    throw new ServiceError(
      'READ_FAILED',
      `[reviewPreview] case read failed: ${caseErr.message}`,
    );
  }
  if (!caseRow) {
    throw new ServiceError(
      'NOT_FOUND',
      `[reviewPreview] document_case ${input.document_case_id} not found in org`,
    );
  }

  // Reverse join: the case's own source document (oldest job wins).
  const { data: job, error: jobErr } = await db
    .from('document_jobs')
    .select('source_document_id')
    .eq('document_case_id', caseRow.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (jobErr) {
    throw new ServiceError(
      'READ_FAILED',
      `[reviewPreview] document_jobs read failed: ${jobErr.message}`,
    );
  }
  const sourceDocumentId = (job?.source_document_id as string) ?? null;

  // Persisted candidates VERBATIM — the recorded routing decision.
  const { data: candRows, error: candErr } = await db
    .from('document_relationship_candidates')
    .select('id, linked_entity_type, linked_entity_id, link_role, confidence_score, source_document_id')
    .eq('document_case_id', caseRow.id)
    .eq('org_id', caseRow.org_id)
    .order('confidence_score', { ascending: false });
  if (candErr) {
    throw new ServiceError(
      'READ_FAILED',
      `[reviewPreview] candidates read failed: ${candErr.message}`,
    );
  }
  const candidates = (candRows ?? []).map((c) => ({
    id: c.id as string,
    linked_entity_type: c.linked_entity_type as string,
    linked_entity_id: (c.linked_entity_id as string) ?? null,
    link_role: c.link_role as string,
    confidence_score: Number(c.confidence_score),
  }));

  // Open exception (if any) — derived from the verified case id.
  const { data: exRow, error: exErr } = await db
    .from('exception_queue_entries')
    .select('exception_queue_entry_id, exception_reason, created_at')
    .eq('document_case_id', caseRow.id)
    .eq('exception_status', 'open')
    .maybeSingle();
  if (exErr) {
    throw new ServiceError(
      'READ_FAILED',
      `[reviewPreview] exception read failed: ${exErr.message}`,
    );
  }

  // Source-doc metadata + the persisted OCR artifact (latest), both
  // derived from the verified row's source_document_id.
  let sourceDocument: ReviewPreview['source_document'] = null;
  let artifact: DocumentArtifactRow | null = null;
  if (sourceDocumentId) {
    const { data: sd, error: sdErr } = await db
      .from('source_documents')
      .select('id, original_filename, mime_type, original_byte_size, received_at')
      .eq('id', sourceDocumentId)
      .eq('org_id', caseRow.org_id)
      .maybeSingle();
    if (sdErr) {
      throw new ServiceError(
        'READ_FAILED',
        `[reviewPreview] source_document read failed: ${sdErr.message}`,
      );
    }
    sourceDocument = sd
      ? {
          id: sd.id as string,
          original_filename: sd.original_filename as string,
          mime_type: sd.mime_type as string,
          original_byte_size: sd.original_byte_size as number,
          received_at: sd.received_at as string,
        }
      : null;

    const { data: art, error: artErr } = await db
      .from('document_artifacts')
      .select('*')
      .eq('source_document_id', sourceDocumentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (artErr) {
      throw new ServiceError(
        'READ_FAILED',
        `[reviewPreview] artifact read failed: ${artErr.message}`,
      );
    }
    artifact = (art as DocumentArtifactRow) ?? null;
  }

  // Posted-JE probe by the PER-CHILD dedup triples (T6 ruling: uniform
  // suffixing). Exact-match .in() on the known child keys — multi-JE-
  // aware so a two-child bundle's recovery lookup sees both rows.
  const childKeys = [`${caseRow.id}:bill`, `${caseRow.id}:payment`];
  const { data: jeRows, error: jeErr } = await db
    .from('journal_entries')
    .select('journal_entry_id, entry_number, source_external_id')
    .eq('org_id', caseRow.org_id)
    .eq('source_system', 'manual')
    .in('source_external_id', childKeys);
  if (jeErr) {
    throw new ServiceError(
      'READ_FAILED',
      `[reviewPreview] journal_entries probe failed: ${jeErr.message}`,
    );
  }

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

  // Degraded previews (honest, named): no artifacts → no rebuild;
  // unknown type → no extractor.
  if (!artifact || !sourceDocumentId) {
    return {
      ...base,
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
    proposal,
    extracted_fields: extracted,
    vendor_match: vendorMatch,
    postable: verdict.postable,
    not_postable_reason: verdict.reason,
  };
}
