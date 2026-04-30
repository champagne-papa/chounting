// GET /api/orgs/[orgId]/users — list org users (memberships + profiles)

import { NextResponse } from 'next/server';
import { membershipService } from '@/services/org/membershipService';
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
    const result = await membershipService.listOrgUsers({ org_id: orgId }, ctx);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ServiceError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: serviceErrorToStatus(err.code) });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
