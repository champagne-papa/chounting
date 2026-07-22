// src/services/document-platform/extractionReadService.ts
//
// Arc 2 T3 (agent→adminClient cleanup) — extraction-pipeline read
// bundle, hoisted VERBATIM from
// agent/orchestrator/extraction/stages/dedupByHash.ts per ADR-0020
// Appendix A (agent → services → db; Law 1). Read-only; no
// withInvariants per the read-function asymmetry (INV-SERVICE-001
// leaf) — both queries are org-filtered (.eq('org_id', …)), so a
// foreign org's source_document_id misses identically to a
// nonexistent one (no existence leak). Error codes and messages are
// byte-identical to the pre-hoist agent-stage reads (including the
// `[dedupByHash]` tags, kept for log continuity).
//
// The agent stage keeps DedupResult / PipelineStageRecord assembly
// — services may not import agent-layer types (ADR-0020, both
// directions of the boundary); this service returns primitives.

import { adminClient } from '@/db/adminClient';
import { ServiceError } from '@/services/errors/ServiceError';
import type { StorageProviderEnum } from '@/services/storage/types';

/**
 * Read a source_document's storage_provider for read-time provider
 * dispatch (ADR-0013 §2). Hoisted from byteFetch (agent stage) per
 * ADR-0020 Appendix A (agent → services → db; Law 1). Read-only; no
 * withInvariants (INV-SERVICE-001 read asymmetry). Error code +
 * message are byte-identical to the pre-hoist byteFetch read
 * (including the `[byteFetch]` tag, kept for log continuity).
 */
export async function getStorageProviderForSourceDocument(
  sourceDocumentId: string,
): Promise<StorageProviderEnum> {
  const db = adminClient();
  const { data: row, error } = await db
    .from('source_documents')
    .select('storage_provider')
    .eq('id', sourceDocumentId)
    .single();
  if (error || !row) {
    throw new ServiceError(
      'NOT_FOUND',
      `[byteFetch] source_document ${sourceDocumentId} not found`,
    );
  }
  return row.storage_provider as StorageProviderEnum;
}

export interface PriorDocumentByHashInput {
  org_id: string;
  source_document_id: string;
}

export interface PriorDocumentByHashResult {
  /** This document's stored original_content_hash (ADR-0014 §6). */
  hash: string;
  /** Oldest prior same-org, same-hash document id, or null. */
  prior_source_document_id: string | null;
}

export async function findPriorSourceDocumentByHash(
  input: PriorDocumentByHashInput,
): Promise<PriorDocumentByHashResult> {
  const db = adminClient();

  // Read this source_document's hash.
  const { data: thisDoc, error: readError } = await db
    .from('source_documents')
    .select('original_content_hash')
    .eq('id', input.source_document_id)
    .eq('org_id', input.org_id)
    .maybeSingle();

  if (readError) {
    throw new ServiceError(
      'PIPELINE_TRANSIENT_EXHAUSTED',
      `[dedupByHash] source_documents read failed: ${readError.message}`,
    );
  }

  if (!thisDoc) {
    throw new ServiceError(
      'NOT_FOUND',
      `[dedupByHash] source_document_id=${input.source_document_id} not found in org_id=${input.org_id}`,
    );
  }

  const hash = thisDoc.original_content_hash;

  // Query for prior matches (same org_id + same hash + NOT self).
  const { data: priorMatches, error: matchError } = await db
    .from('source_documents')
    .select('id')
    .eq('org_id', input.org_id)
    .eq('original_content_hash', hash)
    .neq('id', input.source_document_id)
    .order('created_at', { ascending: true })
    .limit(1);

  if (matchError) {
    throw new ServiceError(
      'PIPELINE_TRANSIENT_EXHAUSTED',
      `[dedupByHash] dedup query failed: ${matchError.message}`,
    );
  }

  return {
    hash,
    prior_source_document_id:
      priorMatches && priorMatches.length > 0 ? priorMatches[0].id : null,
  };
}

export interface LiveBillByVendorAndNumberInput {
  org_id: string;
  vendor_id: string;
  bill_number: string;
}

export interface LiveBillByVendorAndNumberResult {
  /**
   * First LIVE bill (lifecycle_state NOT IN 'voided'/'cancelled') with the same
   * (org, vendor_id, bill_number), or null.
   */
  matched_bill_id: string | null;
  /**
   * True iff matched_bill_id is non-null AND that bill carries a LIVE
   * (link_status='created') primary_invoice source_document_links row — i.e. it
   * was document-sourced. The dup handler fires ONLY when both are true: a
   * matching document-sourced bill is a re-book; a matching bill with no live
   * primary_invoice link is manual/PO/override/voided origin, so the incoming
   * invoice is a legitimate first-arrival attachment (defer to Stage 6). See
   * 2026-07-22-board-4-fork-c-attachment-seam-design.md §3-§4.
   */
  is_document_sourced: boolean;
}

/**
 * Board #4 Fork C handler #1 (semantic-duplicate) detection read.
 *
 * Finds a LIVE bill with the same (org, vendor_id, bill_number) as an incoming
 * invoice — the re-book of an already-booked invoice that Stage-0 dedupByHash
 * (byte-identity) misses. "Live" = lifecycle_state NOT IN ('voided','cancelled')
 * — DELIBERATELY broader than loadOpenBillsForVendor's {approved_for_payment,
 * partially_paid} filter: a fully_paid bill is the worst double-pay case and
 * must count; a voided/cancelled bill is a legitimate re-book target and must
 * not. Keyed on the extracted vendor_invoice_number ↔ bills.bill_number (the
 * field buildPostBillInput writes), NOT the matcher's dead invoice_number read.
 *
 * Note (fix-wave finding #4): `created_at ASC LIMIT 1` means "first live
 * match" is judged against the OLDEST live bill. If two live bills ever share
 * (org, vendor_id, bill_number) — a duplicate-live-bill anomaly the schema
 * does not itself prevent — provenance is read off that oldest row, not the
 * newest. The outcome is the safe direction either way: defer → the incoming
 * invoice attaches (Stage 6); fire → it parks for human review at
 * needs_review. No mis-post results from picking the wrong one of the two.
 */
export async function findLiveBillByVendorAndNumber(
  input: LiveBillByVendorAndNumberInput,
): Promise<LiveBillByVendorAndNumberResult> {
  const db = adminClient();

  const { data, error } = await db
    .from('bills')
    .select('bill_id')
    .eq('org_id', input.org_id)
    .eq('vendor_id', input.vendor_id)
    .eq('bill_number', input.bill_number)
    // NOT IN (...) is sound ONLY because lifecycle_state is NOT NULL (20240138
    // DEFAULT 'draft'): a NULL would make NOT(... IN ...) evaluate to NULL — not
    // true — silently excluding the row → a MISSED duplicate (the unsafe
    // false-negative direction). Protected by the NOT NULL column, not by this
    // query. Coverage is by exclusion, so a future lifecycle state defaults to
    // INCLUDED (flag-to-human) — the safe direction.
    .not('lifecycle_state', 'in', '("voided","cancelled")')
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) {
    throw new ServiceError(
      'PIPELINE_TRANSIENT_EXHAUSTED',
      `[semantic-duplicate] live-bill dedup query failed: ${error.message}`,
    );
  }

  const matched_bill_id = data && data.length > 0 ? data[0].bill_id : null;

  if (!matched_bill_id) {
    return { matched_bill_id: null, is_document_sourced: false };
  }

  // Provenance discriminator (design §3): the matched bill is document-sourced iff
  // it carries a LIVE (link_status='created') primary_invoice link. link_status=
  // 'created' is load-bearing — a voided bill retains a link_status='reversed'
  // primary_invoice row (links are reversed, never deleted; 20240147), which must
  // NOT count. Lands on source_document_links_entity_status_idx.
  const { data: linkRows, error: linkError } = await db
    .from('source_document_links')
    .select('id')
    .eq('linked_entity_type', 'bill')
    .eq('linked_entity_id', matched_bill_id)
    .eq('link_role', 'primary_invoice')
    .eq('link_status', 'created')
    .limit(1);

  if (linkError) {
    throw new ServiceError(
      'PIPELINE_TRANSIENT_EXHAUSTED',
      `[semantic-duplicate] provenance-link query failed: ${linkError.message}`,
    );
  }

  return {
    matched_bill_id,
    is_document_sourced: !!(linkRows && linkRows.length > 0),
  };
}

/**
 * Look up document_case_id from document_jobs table via org_id +
 * source_document_id. Returns null if no matching job exists
 * (defensive; Stage 6 skips when documentCaseId is null).
 *
 * Arc 2 T4 — hoisted VERBATIM from ingestDocument.ts, as-found with
 * no org filter (the Arc 2 ledgered defense-in-depth gap). Class D
 * arc T5 (2026-06-06) closed it: org_id is now a required first
 * parameter and the read enforces org-scope. Narrows match
 * semantics — a foreign org's source_document_id (UUID-PK-unique,
 * so previously safe by uniqueness alone) now misses by
 * construction.
 */
export async function lookupDocumentCaseId(
  org_id: string,
  source_document_id: string,
): Promise<string | null> {
  const db = adminClient();
  const { data, error } = await db
    .from('document_jobs')
    .select('document_case_id')
    .eq('org_id', org_id)
    .eq('source_document_id', source_document_id)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return (data as { document_case_id: string }).document_case_id;
}
