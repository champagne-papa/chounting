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

/** Reverse join off document_jobs — oldest job wins if several. */
export async function getOldestJobSourceDocumentId(
  document_case_id: string,
): Promise<string | null> {
  const db = adminClient();
  const { data: job, error: jobErr } = await db
    .from('document_jobs')
    .select('source_document_id')
    .eq('document_case_id', document_case_id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (jobErr) {
    throw new ServiceError(
      'READ_FAILED',
      `[sweepStrandedCases] document_jobs read failed for case ${document_case_id}: ${jobErr.message}`,
    );
  }
  return (job?.source_document_id as string) ?? null;
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
