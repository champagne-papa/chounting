// POST /api/invitations/accept — accept invitation (any authenticated user)

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { invitationService } from '@/services/org/invitationService';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';
import { acceptInvitationSchema } from '@/shared/schemas/user/invitation.schema';

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = acceptInvitationSchema.parse(json);
    const ctx = await buildServiceContext(req);
    const result = await invitationService.acceptInvitation(parsed, ctx);
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
