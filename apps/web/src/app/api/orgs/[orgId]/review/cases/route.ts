// src/app/api/orgs/[orgId]/review/cases/route.ts
//
// GET /api/orgs/[orgId]/review/cases[?limit=N]
//
// Wave 6 D3 T5 — the review inbox list. Covers the review-track states
// (needs_review | proposed | approved) with the open-exception join and
// the post-status probe for approved cases (the D-4 stranding window:
// an approved case with a posted JE is operator-visible, never silent).
//
// IDOR posture (brief D-1.2, cards-endpoint pattern verbatim): explicit
// ctx.caller.org_ids.includes(orgId) check BEFORE any SQL + explicit
// .eq('org_id', orgId) on every query. No withInvariants per Rule 2 +
// the read-side route convention (mirror documents/cases).

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { adminClient } from '@/db/adminClient';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';

const QuerySchema = z.object({
  limit: z.number().int().positive().max(500).default(50),
});

const REVIEW_TRACK_STATES = ['needs_review', 'proposed', 'approved'] as const;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await params;
    const ctx = await buildServiceContext(req);

    // Explicit org-access check (read endpoint without withInvariants
    // Invariant 3). 403 if the caller is not a member of the org.
    if (!ctx.caller.org_ids.includes(orgId)) {
      throw new ServiceError(
        'ORG_ACCESS_DENIED',
        `Caller does not have access to org_id=${orgId}`,
      );
    }

    const url = new URL(req.url);
    const limitRaw = url.searchParams.get('limit');
    const parsed = QuerySchema.parse({
      limit: limitRaw === null ? undefined : Number(limitRaw),
    });

    const db = adminClient();

    // Review-track cases, org-scoped, oldest-first (review queue
    // fairness), with the open-exception join via the FK relationship.
    const { data: rows, error } = await db
      .from('document_cases')
      .select(
        'id, state, document_type, classification_confidence, created_at, trace_id, exception_queue_entries(exception_queue_entry_id, exception_reason, exception_status)',
      )
      .eq('org_id', orgId)
      .in('state', [...REVIEW_TRACK_STATES])
      .order('created_at', { ascending: true })
      .limit(parsed.limit);
    if (error) {
      throw new ServiceError(
        'READ_FAILED',
        `review cases list failed: ${error.message}`,
      );
    }

    // Post-status probe for approved cases — one batched exact-match
    // query on the PER-CHILD dedup triples (T6 ruling: uniform
    // suffixing `${caseId}:bill` / `${caseId}:payment`; multi-JE-aware
    // so `posted` means "any child JE exists"). An approved case with
    // a JE is the step-5/6 crash window awaiting its committed marking.
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
        .eq('org_id', orgId)
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

    const cases = (rows ?? []).map((r) => {
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

    return NextResponse.json({ cases }, { status: 200 });
  } catch (err) {
    if (err instanceof ServiceError) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: serviceErrorToStatus(err.code) },
      );
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'INVALID_QUERY', issues: err.issues },
        { status: 400 },
      );
    }
    throw err;
  }
}
