// src/services/document-platform/reviewCasesListReadService.ts
//
// UF-006 / ADR-0020 (app→adminClient cleanup): review-inbox list read,
// hoisted from the review/cases route handler (app → services → db;
// Law 1). Read-only; no withInvariants per the read-function asymmetry
// (INV-SERVICE-001) — runs an inline ctx.caller.org_ids.includes(org_id)
// guard because adminClient bypasses RLS, plus every query is
// .eq('org_id', org_id)-scoped. Covers the review-track states with the
// open-exception join + the post-status probe (the D-4 stranding
// window). Error codes, messages, and the shaped result are
// byte-identical to the pre-hoist route read.

import { adminClient } from '@/db/adminClient';
import { ServiceError } from '@/services/errors/ServiceError';
import type { ServiceContext } from '@/services/middleware/serviceContext';

const REVIEW_TRACK_STATES = ['needs_review', 'proposed', 'approved'] as const;

export interface ReviewCaseListItem {
  document_case_id: string;
  state: string;
  document_type: string;
  classification_confidence: number | null;
  created_at: string;
  open_exception: {
    exception_queue_entry_id: string;
    exception_reason: string;
  } | null;
  posted: boolean;
}

async function listReviewCases(
  input: { org_id: string; limit: number },
  ctx: ServiceContext,
): Promise<ReviewCaseListItem[]> {
  if (!ctx.caller.org_ids.includes(input.org_id)) {
    throw new ServiceError(
      'ORG_ACCESS_DENIED',
      `Caller does not have access to org_id=${input.org_id}`,
    );
  }

  const db = adminClient();

  // Review-track cases, org-scoped, oldest-first (review queue
  // fairness), with the open-exception join via the FK relationship.
  const { data: rows, error } = await db
    .from('document_cases')
    .select(
      'id, state, document_type, classification_confidence, created_at, trace_id, exception_queue_entries(exception_queue_entry_id, exception_reason, exception_status)',
    )
    .eq('org_id', input.org_id)
    .in('state', [...REVIEW_TRACK_STATES])
    .order('created_at', { ascending: true })
    .limit(input.limit);
  if (error) {
    throw new ServiceError(
      'READ_FAILED',
      `review cases list failed: ${error.message}`,
    );
  }

  // Post-status probe for approved cases — one batched exact-match
  // query on the PER-CHILD dedup triples (T6 ruling: uniform suffixing
  // `${caseId}:bill` / `${caseId}:payment`; multi-JE-aware so `posted`
  // means "any child JE exists"). An approved case with a JE is the
  // step-5/6 crash window awaiting its committed marking.
  const approvedIds = (rows ?? [])
    .filter((r) => r.state === 'approved')
    .map((r) => r.id as string);
  const postedSet = new Set<string>();
  if (approvedIds.length > 0) {
    const childKeys = approvedIds.flatMap((id) => [
      `${id}:bill`,
      `${id}:payment`,
    ]);
    const { data: jeRows, error: jeErr } = await db
      .from('journal_entries')
      .select('source_external_id')
      .eq('org_id', input.org_id)
      .eq('source_system', 'manual')
      .in('source_external_id', childKeys);
    if (jeErr) {
      throw new ServiceError(
        'READ_FAILED',
        `review post-status probe failed: ${jeErr.message}`,
      );
    }
    for (const je of jeRows ?? []) {
      const key = je.source_external_id as string | null;
      if (key) postedSet.add(key.split(':')[0]!);
    }
  }

  return (rows ?? []).map((r) => {
    const exceptions = (r.exception_queue_entries ?? []) as Array<{
      exception_queue_entry_id: string;
      exception_reason: string;
      exception_status: string;
    }>;
    const open = exceptions.find((e) => e.exception_status === 'open') ?? null;
    return {
      document_case_id: r.id as string,
      state: r.state as string,
      document_type: r.document_type as string,
      classification_confidence:
        r.classification_confidence === null
          ? null
          : Number(r.classification_confidence),
      created_at: r.created_at as string,
      open_exception: open
        ? {
            exception_queue_entry_id: open.exception_queue_entry_id,
            exception_reason: open.exception_reason,
          }
        : null,
      // Only meaningful for approved cases; false elsewhere.
      posted: postedSet.has(r.id as string),
    };
  });
}

export const reviewCasesListReadService = {
  // withInvariants: skip-org-check (pattern-G3: read; org access enforced by an inline caller.org_ids.includes(org_id) guard in the listReviewCases() body)
  listReviewCases,
};
