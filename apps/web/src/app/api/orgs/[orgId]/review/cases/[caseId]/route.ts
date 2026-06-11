// src/app/api/orgs/[orgId]/review/cases/[caseId]/route.ts
//
// GET /api/orgs/[orgId]/review/cases/[caseId]
//
// Wave 6 D3 T5 — the review case detail: the org-verified case +
// persisted candidates + source-doc metadata + open exception + the
// REBUILT proposal preview (reviewPreview.buildReviewPreview — brief
// D-2 rebuild-not-persist) + the postability verdict + post status.
//
// IDOR posture (brief D-1.2): explicit org membership check BEFORE any
// SQL; the case is fetched org-scoped INSIDE buildReviewPreview
// (.eq('id', caseId).eq('org_id', orgId)) — a foreign org's caseId
// misses identically to a nonexistent one (NOT_FOUND → 404, no
// existence leak), and every downstream read derives from the verified
// row's ids.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';
// Agent-entry surface (the api/agent/message/route.ts:16 precedent):
// this route drives the orchestrator-layer rebuild, so the app→agent
// crossing is the designated entry-point shape, exempted explicitly.
// eslint-disable-next-line architecture/agent-first-import-boundaries
import { buildReviewPreview } from '@/agent/orchestrator/extraction/reviewPreview';

const ParamsSchema = z.object({
  orgId: z.string().uuid(),
  caseId: z.string().uuid(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string; caseId: string }> },
) {
  try {
    const raw = await params;
    const { orgId, caseId } = ParamsSchema.parse(raw);
    const ctx = await buildServiceContext(req);

    // Explicit org-access check (read endpoint without withInvariants
    // Invariant 3). 403 if the caller is not a member of the org.
    if (!ctx.caller.org_ids.includes(orgId)) {
      throw new ServiceError(
        'ORG_ACCESS_DENIED',
        `Caller does not have access to org_id=${orgId}`,
      );
    }

    const preview = await buildReviewPreview(
      { org_id: orgId, document_case_id: caseId, trace_id: ctx.trace_id },
      ctx,
    );

    return NextResponse.json(preview, { status: 200 });
  } catch (err) {
    if (err instanceof ServiceError) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: serviceErrorToStatus(err.code) },
      );
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'INVALID_PARAMS', issues: err.issues },
        { status: 400 },
      );
    }
    throw err;
  }
}
