// src/app/api/org/route.ts
// Thin API route over orgService.createOrgWithTemplate.
// Phase 1.5A: extended Body schema to match the new
// CreateOrgProfileInput. Full route surface (the eight new routes
// from brief §6) lands in step 4.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withInvariants } from '@/services/middleware/withInvariants';
import { orgService } from '@/services/org/orgService';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { createOrgProfileSchema } from '@/shared/schemas/organization/profile.schema';

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = createOrgProfileSchema.parse(json);
    const ctx = await buildServiceContext(req);
    const result = await withInvariants(orgService.createOrgWithTemplate, { action: 'org.create' })(parsed, ctx);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: err.issues }, { status: 400 });
    }
    if (err instanceof ServiceError) {
      const status = err.code === 'UNAUTHENTICATED' ? 401
        : err.code === 'PERMISSION_DENIED' || err.code === 'ORG_ACCESS_DENIED' ? 403
        : 500;
      return NextResponse.json({ error: err.code, message: err.message }, { status });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
