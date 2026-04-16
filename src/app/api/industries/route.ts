// src/app/api/industries/route.ts
// Phase 1.5A — list industries. Authenticated users only; no org
// scoping. RLS (industries_select FOR SELECT TO authenticated
// USING (true)) is the actual gate. Service function
// orgService.listIndustries is a read and is not
// withInvariants()-wrapped per OQ-07.

import { NextResponse } from 'next/server';
import { orgService } from '@/services/org/orgService';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';

export async function GET(req: Request) {
  try {
    const ctx = await buildServiceContext(req);
    const result = await orgService.listIndustries({}, ctx);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ServiceError) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: serviceErrorToStatus(err.code) },
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
