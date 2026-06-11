// src/services/document-platform/strandedCaseReadService.ts
//
// Arc 1 T2 (agent→adminClient cleanup) — the stranded-case sweep's four
// reads, hoisted VERBATIM from agent/orchestrator/maintenance/
// sweepStrandedCases.ts per ADR-0020 Appendix A (agent → services → db;
// Law 1). Read-only; no withInvariants per the read-function asymmetry
// (INV-SERVICE-001 leaf). The sweep's MUTATIONS were already
// service-routed (advanceCaseAutomation / resolveCandidates /
// ingestDocument) under the system-actor context the sweep builds —
// that posture is untouched by this hoist; these functions carry no
// actor context because the pre-hoist reads carried none. Error codes
// and messages are byte-identical to the pre-hoist agent-module reads.
//
// mailbox-finish arc (2026-06-07): getOldestJobSourceDocumentId
// superseded by resolvePrimaryIngestSource. The pipeline (ingestDocument)
// is single-source — one source_document per run — and a successful run
// advances the case out of the sweep's ELIGIBLE_STATES, so for a
// multi-job case exactly one document is ever processed. A
// forwarded-mailbox case (1 email_body + N attachments under one case)
// must process an attachment (the invoice), never the .eml email_body.
// Shared by the sync mailbox invoker (handleForwardedMailbox) and the
// sweep backstop so both pick the same document (sync ≡ backstop).

import { adminClient } from '@/db/adminClient';
import { ServiceError } from '@/services/errors/ServiceError';

export interface EligibleStrandedCasesInput {
  /** Eligible states (the sweep owns the list). */
  states: string[];
  /** ISO cutoff; rows strictly older qualify. */
  cutoffIso: string;
  /** Optional org narrowing (operator runner flag). */
  org_id?: string | null;
  /** Optional explicit case-id narrowing (operator runner flag). */
  document_case_ids?: string[] | null;
}

/** The eligibility scan's selected columns — the service's own contract
 *  (exactly the four columns the query selects). */
export interface StrandedCaseRow {
  id: string;
  org_id: string;
  state: string;
  created_at: string;
}

/** Eligibility scan — oldest-first, optionally narrowed. */
export async function findEligibleStrandedCases(
  input: EligibleStrandedCasesInput,
): Promise<StrandedCaseRow[]> {
  const db = adminClient();
  let query = db
    .from('document_cases')
    .select('id, org_id, state, created_at')
    .in('state', input.states)
    .lt('created_at', input.cutoffIso)
    .order('created_at', { ascending: true });
  if (input.org_id) {
    query = query.eq('org_id', input.org_id);
  }
  if (input.document_case_ids && input.document_case_ids.length > 0) {
    query = query.in('id', input.document_case_ids);
  }

  const { data, error } = await query;
  if (error) {
    throw new ServiceError(
      'READ_FAILED',
      `[sweepStrandedCases] eligibility query failed: ${error.message}`,
    );
  }
  return (data ?? []) as StrandedCaseRow[];
}

/**
 * Primary ingest source for a case — the source_document the single-source
 * pipeline should classify/extract. Shared by the sync mailbox invoker and
 * the sweep backstop (sync ≡ backstop).
 *
 * Selection:
 *   - 0 jobs  → null. Identical to the superseded getOldestJobSourceDocumentId
 *               contract; the sweep's no_job_row anomaly bucket relies on it.
 *   - 1 job   → that job's source_document (drag-drop 1:1 path, unchanged —
 *               oldest-of-one is the same document the prior picker returned).
 *   - ≥2 jobs → the oldest job whose source_document is NOT the case's
 *               email_body (the role='email_body' case_sources row is the
 *               only role written at ingest, migration 20240152:62, so it
 *               uniquely identifies the .eml body); falls back to the oldest
 *               job if no email_body row exists.
 *
 * Known limitation (mailbox-finish arc; banked as a PRIORITIZED follow-up,
 * not a benign latent gap): email + MULTIPLE attachments still picks one
 * attachment arbitrarily (same-transaction created_at, no tiebreak). This
 * is no regression — the prior picker could strand the invoice entirely by
 * picking the .eml; this always picks an attachment. "Which document
 * represents a multi-attachment case" is the larger pipeline-semantics
 * question, deferred.
 */
export async function resolvePrimaryIngestSource(
  document_case_id: string,
): Promise<string | null> {
  const db = adminClient();
  const { data: jobs, error: jobErr } = await db
    .from('document_jobs')
    .select('source_document_id')
    .eq('document_case_id', document_case_id)
    .order('created_at', { ascending: true });
  if (jobErr) {
    throw new ServiceError(
      'READ_FAILED',
      `[resolvePrimaryIngestSource] document_jobs read failed for case ${document_case_id}: ${jobErr.message}`,
    );
  }
  const jobRows = (jobs ?? []) as Array<{ source_document_id: string }>;
  if (jobRows.length === 0) {
    return null;
  }
  if (jobRows.length === 1) {
    return jobRows[0].source_document_id;
  }

  // Multi-job case (forwarded mailbox): prefer an attachment over the
  // email_body. email_body is the only role written at ingest, so a single
  // role='email_body' row identifies the .eml body source_document.
  const { data: emailBody, error: bodyErr } = await db
    .from('document_case_sources')
    .select('source_document_id')
    .eq('document_case_id', document_case_id)
    .eq('role', 'email_body')
    .maybeSingle();
  if (bodyErr) {
    throw new ServiceError(
      'READ_FAILED',
      `[resolvePrimaryIngestSource] email_body role read failed for case ${document_case_id}: ${bodyErr.message}`,
    );
  }
  const emailBodyId =
    (emailBody?.source_document_id as string | undefined) ?? null;
  const attachment = jobRows.find(
    (j) => j.source_document_id !== emailBodyId,
  );
  return attachment?.source_document_id ?? jobRows[0].source_document_id;
}

/** B2 bucket predicate: does the case carry any relationship candidate? */
export async function caseHasRelationshipCandidates(
  document_case_id: string,
): Promise<boolean> {
  const db = adminClient();
  const { data: cands, error: candErr } = await db
    .from('document_relationship_candidates')
    .select('id')
    .eq('document_case_id', document_case_id)
    .limit(1);
  if (candErr) {
    throw new ServiceError(
      'READ_FAILED',
      `[sweepStrandedCases] candidate probe failed for case ${document_case_id}: ${candErr.message}`,
    );
  }
  return (cands?.length ?? 0) > 0;
}

/** Anomaly-path state re-read (EXCEPTION_ALREADY_OPEN handling). */
export async function getDocumentCaseState(
  document_case_id: string,
): Promise<string | null> {
  const db = adminClient();
  const { data: fresh, error: freshErr } = await db
    .from('document_cases')
    .select('state')
    .eq('id', document_case_id)
    .single();
  if (freshErr) {
    throw new ServiceError(
      'READ_FAILED',
      `[sweepStrandedCases] state re-read failed for case ${document_case_id}: ${freshErr.message}`,
    );
  }
  return (fresh?.state as string) ?? null;
}
