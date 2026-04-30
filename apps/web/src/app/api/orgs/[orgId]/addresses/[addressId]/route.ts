// src/app/api/orgs/[orgId]/addresses/[addressId]/route.ts
// Phase 1.5A — PATCH (update) + DELETE (remove) a single address.
// Both controller-only via withInvariants.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withInvariants } from '@/services/middleware/withInvariants';
import { addressService } from '@/services/org/addressService';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';
import { type UpdateAddressPatch } from '@/shared/schemas/organization/address.schema';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ orgId: string; addressId: string }> },
) {
  try {
    const { orgId, addressId } = await params;
    const json = await req.json();
    const ctx = await buildServiceContext(req);

    // The service performs its own Zod parse and also the
    // pre-parse ADDRESS_TYPE_IMMUTABLE check, so pass json through
    // as raw patch (typed as any to preserve the hasOwnProperty
    // check on addressType inside the service).
    const result = await withInvariants(
      (
        input: {
          org_id: string;
          address_id: string;
          patch: UpdateAddressPatch & { addressType?: unknown };
        },
        c,
      ) => addressService.updateAddress(input, c),
      { action: 'org.address.update' },
    )(
      { org_id: orgId, address_id: addressId, patch: json as UpdateAddressPatch & { addressType?: unknown } },
      ctx,
    );

    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ orgId: string; addressId: string }> },
) {
  try {
    const { orgId, addressId } = await params;
    const ctx = await buildServiceContext(req);

    const result = await withInvariants(
      (input: { org_id: string; address_id: string }, c) =>
        addressService.removeAddress(input, c),
      { action: 'org.address.delete' },
    )(
      { org_id: orgId, address_id: addressId },
      ctx,
    );

    return NextResponse.json(result);
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
