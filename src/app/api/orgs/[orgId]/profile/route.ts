// src/app/api/orgs/[orgId]/profile/route.ts
// Phase 1.5A — GET + PATCH org profile.
// GET: any org member; gated by explicit caller.org_ids.includes(orgId)
// check at the route handler (S30 hot-fix; element #6 G1 Variant γ
// closure). PATCH: controller-only via
// withInvariants({ action: 'org.profile.update' }).

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withInvariants } from '@/services/middleware/withInvariants';
import { orgService } from '@/services/org/orgService';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await params;
    const ctx = await buildServiceContext(req);
    if (!ctx.caller.org_ids.includes(orgId)) {
      return NextResponse.json(
        { error: 'ORG_ACCESS_DENIED', message: `caller is not a member of org ${orgId}` },
        { status: 403 },
      );
    }
    const row = await orgService.getOrgProfile({ org_id: orgId }, ctx);
    return NextResponse.json({ organization: row });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await params;
    const json = await req.json();
    const ctx = await buildServiceContext(req);

    // withInvariants Invariant 3 requires input.org_id to match a
    // membership. Invariant 4 fires the canUserPerformAction check
    // with action='org.profile.update' (controller-only).
    const result = await withInvariants(
      (input: { org_id: string; patch: unknown }, c) =>
        orgService.updateOrgProfile(
          { org_id: input.org_id, patch: input.patch as never },
          c,
        ),
      { action: 'org.profile.update' },
    )(
      { org_id: orgId, patch: json },
      ctx,
    );

    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}

function errorResponse(err: unknown): NextResponse {
  if (err instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Invalid request', details: err.issues },
      { status: 400 },
    );
  }
  if (err instanceof ServiceError) {
    return NextResponse.json(
      { error: err.code, message: err.message },
      { status: serviceErrorToStatus(err.code) },
    );
  }
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
