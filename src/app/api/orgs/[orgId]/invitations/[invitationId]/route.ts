// DELETE /api/orgs/[orgId]/invitations/[invitationId] — revoke

import { NextResponse } from 'next/server';
import { withInvariants } from '@/services/middleware/withInvariants';
import { invitationService } from '@/services/org/invitationService';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ orgId: string; invitationId: string }> },
) {
  try {
    const { orgId, invitationId } = await params;
    const ctx = await buildServiceContext(req);

    const result = await withInvariants(
      (input: { org_id: string; invitation_id: string }, c) =>
        invitationService.revokeInvitation(input, c),
      { action: 'user.invite' },
    )({ org_id: orgId, invitation_id: invitationId }, ctx);

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ServiceError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: serviceErrorToStatus(err.code) });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
