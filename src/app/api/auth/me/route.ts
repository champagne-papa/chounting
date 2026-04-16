// GET /api/auth/me — current user profile
// PATCH /api/auth/me — update own profile

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { userProfileService } from '@/services/user/userProfileService';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';

export async function GET(req: Request) {
  try {
    const ctx = await buildServiceContext(req);
    const profile = await userProfileService.getOrCreateProfile(
      { user_id: ctx.caller.user_id, email: ctx.caller.email },
      ctx,
    );
    return NextResponse.json({ profile });
  } catch (err) {
    if (err instanceof ServiceError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: serviceErrorToStatus(err.code) });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const json = await req.json();
    const ctx = await buildServiceContext(req);
    const result = await userProfileService.updateProfile(
      { user_id: ctx.caller.user_id, patch: json },
      ctx,
    );
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
