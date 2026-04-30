// POST /api/orgs/[orgId]/invitations — invite user (controller-only via
//   withInvariants({ action: 'user.invite' }))
// GET /api/orgs/[orgId]/invitations — list pending (any org member;
//   gated by explicit caller.org_ids.includes(orgId) check at the route
//   handler per S30 hot-fix; element #6 G1 Variant γ closure. Role-
//   permission tightening deferred to S30 territory per pre-decision
//   (b-shape-1).)

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withInvariants } from '@/services/middleware/withInvariants';
import { invitationService } from '@/services/org/invitationService';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';
import { inviteUserSchema } from '@/shared/schemas/user/invitation.schema';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await params;
    const json = await req.json();
    const parsed = inviteUserSchema.parse(json);
    const ctx = await buildServiceContext(req);

    const result = await withInvariants(
      (input: { org_id: string; email: string; role: string }, c) =>
        invitationService.inviteUser(input, c),
      { action: 'user.invite' },
    )({ org_id: orgId, ...parsed }, ctx);

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: err.issues }, { status: 400 });
    }
    if (err instanceof ServiceError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: serviceErrorToStatus(err.code) });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const result = await invitationService.listPendingInvitations({ org_id: orgId }, ctx);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ServiceError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: serviceErrorToStatus(err.code) });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
