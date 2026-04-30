// PATCH /api/orgs/[orgId]/users/[userId]/role — change role (controller)

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withInvariants } from '@/services/middleware/withInvariants';
import { membershipService } from '@/services/org/membershipService';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';
import { changeRoleSchema } from '@/shared/schemas/user/invitation.schema';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ orgId: string; userId: string }> },
) {
  try {
    const { orgId, userId } = await params;
    const json = await req.json();
    const parsed = changeRoleSchema.parse(json);
    const ctx = await buildServiceContext(req);

    const result = await withInvariants(
      (input: { org_id: string; user_id: string; new_role: string }, c) =>
        membershipService.changeUserRole(input, c),
      { action: 'user.role.change' },
    )({ org_id: orgId, user_id: userId, new_role: parsed.newRole }, ctx);

    return NextResponse.json(result);
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
