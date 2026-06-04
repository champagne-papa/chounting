// src/app/api/orgs/[orgId]/review/cases/[caseId]/reject/route.ts
//
// POST /api/orgs/[orgId]/review/cases/[caseId]/reject
//
// Wave 6 D3 T6 — the human reject: transition(→rejected) with the
// Zod-required reason. Defense in depth: explicit org membership check
// at the route + the T3 in-service org check inside transition()
// (derives from the read row — TransitionInput carries no org_id).

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';
import { transition } from '@/services/document-platform/documentCaseService';

const ParamsSchema = z.object({
  orgId: z.string().uuid(),
  caseId: z.string().uuid(),
});
const BodySchema = z.object({
  reason: z.string().min(1, 'reason is required to reject'),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgId: string; caseId: string }> },
) {
  try {
    const raw = await params;
    const { orgId, caseId } = ParamsSchema.parse(raw);
    const body = BodySchema.parse(await req.json().catch(() => ({})));
    const ctx = await buildServiceContext(req);

    if (!ctx.caller.org_ids.includes(orgId)) {
      throw new ServiceError(
        'ORG_ACCESS_DENIED',
        `Caller does not have access to org_id=${orgId}`,
      );
    }

    const result = await transition(
      caseId,
      { target_state: 'rejected', reason: body.reason },
      ctx,
    );
    return NextResponse.json(
      { case_state: result.state },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof ServiceError) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: serviceErrorToStatus(err.code) },
      );
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', issues: err.issues },
        { status: 400 },
      );
    }
    throw err;
  }
}
