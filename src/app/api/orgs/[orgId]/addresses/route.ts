// src/app/api/orgs/[orgId]/addresses/route.ts
// Phase 1.5A — GET (list) + POST (add) org addresses.
// GET: any org member (RLS gates). POST: controller-only via
// withInvariants({ action: 'org.address.create' }).

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withInvariants } from '@/services/middleware/withInvariants';
import { addressService } from '@/services/org/addressService';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';
import {
  addAddressSchema,
  type AddAddressInput,
} from '@/shared/schemas/organization/address.schema';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await params;
    const ctx = await buildServiceContext(req);
    const result = await addressService.listAddresses({ org_id: orgId }, ctx);
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await params;
    const json = await req.json();
    const parsed = addAddressSchema.parse(json);
    const ctx = await buildServiceContext(req);

    const result = await withInvariants(
      (input: { org_id: string } & AddAddressInput, c) =>
        addressService.addAddress(input, c),
      { action: 'org.address.create' },
    )(
      { org_id: orgId, ...parsed },
      ctx,
    );

    return NextResponse.json(result, { status: 201 });
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
