// DELETE /api/orgs/[orgId]/users/[userId] — soft-remove (controller)

import { NextResponse } from 'next/server';
import { withInvariants } from '@/services/middleware/withInvariants';
import { membershipService } from '@/services/org/membershipService';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ orgId: string; userId: string }> },
) {
  try {
    const { orgId, userId } = await params;
    const ctx = await buildServiceContext(req);

    const result = await withInvariants(
      (input: { org_id: string; user_id: string }, c) =>
        membershipService.removeUser(input, c),
      { action: 'user.remove' },
    )({ org_id: orgId, user_id: userId }, ctx);

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ServiceError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: serviceErrorToStatus(err.code) });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
