// src/services/document-platform/reviewPreviewReadService.ts
//
// Arc 1 T2 (agent→adminClient cleanup) — the review-preview read bundle,
// hoisted VERBATIM from agent/orchestrator/extraction/reviewPreview.ts
// per ADR-0020 Appendix A (agent → services → db; Law 1). Read-only; no
// withInvariants per the read-function asymmetry (INV-SERVICE-001 leaf)
// — the authorization is inline: the org-verified ROOT read (the IDOR
// root, D3 brief D-1.2) fetches the case WITH the org filter, so a
// foreign org's caseId misses identically to a nonexistent one (no
// existence leak), and every downstream read derives from that verified
// row's ids, never from caller-supplied ids. Error codes and messages
// are byte-identical to the pre-hoist agent-module reads.
//
// Row shapes are deliberately loose (Record<string, unknown>): the
// agent-side assembler owns the narrowing casts it always owned —
// services may not import agent-layer types (ADR-0020, both directions
// of the boundary).

import { adminClient } from '@/db/adminClient';
import { ServiceError } from '@/services/errors/ServiceError';
import { resolvePrimaryIngestSource } from './strandedCaseReadService';

export interface ReviewPreviewReadInput {
  org_id: string;
  document_case_id: string;
}

export interface ReviewPreviewRows {
  /** The org-verified root row — every other read derived from it. */
  caseRow: Record<string, unknown>;
  /** The case's primary ingest source document
   *  (resolvePrimaryIngestSource — excludes the .eml email_body), or null. */
  sourceDocumentId: string | null;
  /** Persisted candidates VERBATIM, confidence-desc. */
  candRows: Array<Record<string, unknown>>;
  /** Open exception entry, if any. */
  exRow: Record<string, unknown> | null;
  /** Source-doc metadata (org-filtered), when a source doc exists. */
  sourceDocRow: Record<string, unknown> | null;
  /** Latest persisted OCR artifact, when a source doc exists. */
  artifactRow: Record<string, unknown> | null;
  /** Posted-JE probe by the per-child dedup triples
   *  (`${caseId}:bill` / `${caseId}:payment`) — multi-JE-aware. */
  jeRows: Array<Record<string, unknown>>;
}

export async function loadReviewPreviewRows(
  input: ReviewPreviewReadInput,
): Promise<ReviewPreviewRows> {
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

  // The case's primary ingest document — via the SAME picker the pipeline used
  // to classify/extract: resolvePrimaryIngestSource excludes the .eml
  // email_body and prefers a real attachment over an inline signature image
  // (shared with handleForwardedMailbox + the stranded-case sweep). Review
  // detail therefore shows exactly the classified document, not the email
  // wrapper. Single-source cases are unchanged (0 jobs → null; 1 job → that
  // job); only multi-source mailbox cases differ from the prior oldest-wins.
  const sourceDocumentId = await resolvePrimaryIngestSource(
    caseRow.id as string,
  );

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
  let sourceDocRow: Record<string, unknown> | null = null;
  let artifactRow: Record<string, unknown> | null = null;
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
    sourceDocRow = sd ?? null;

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
    artifactRow = art ?? null;
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

  return {
    caseRow,
    sourceDocumentId,
    candRows: candRows ?? [],
    exRow: exRow ?? null,
    sourceDocRow,
    artifactRow,
    jeRows: jeRows ?? [],
  };
}
