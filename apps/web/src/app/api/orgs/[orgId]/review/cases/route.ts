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
import { reviewCasesListReadService } from '@/services/document-platform/reviewCasesListReadService';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';

const QuerySchema = z.object({
  limit: z.number().int().positive().max(500).default(50),
});

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

    // Review-inbox list read hoisted to the service layer (ADR-0020;
    // adminClient is services-only). The service re-checks org access
    // inline, runs the open-exception join + the post-status probe, and
    // shapes the rows.
    const cases = await reviewCasesListReadService.listReviewCases(
      { org_id: orgId, limit: parsed.limit },
      ctx,
    );

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
