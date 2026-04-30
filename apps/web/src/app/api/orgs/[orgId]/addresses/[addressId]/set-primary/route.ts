// src/app/api/orgs/[orgId]/addresses/[addressId]/set-primary/route.ts
// Phase 1.5A — POST promotes an existing address to primary.
// Controller-only via withInvariants({ action: 'org.address.set_primary' }).
// Emits two audit rows per OQ-06: one for the promotion, one for
// the demoted previous primary (if any).

import { NextResponse } from 'next/server';
import { withInvariants } from '@/services/middleware/withInvariants';
import { addressService } from '@/services/org/addressService';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgId: string; addressId: string }> },
) {
  try {
    const { orgId, addressId } = await params;
    const ctx = await buildServiceContext(req);

    const result = await withInvariants(
      (input: { org_id: string; address_id: string }, c) =>
        addressService.setPrimaryAddress(input, c),
      { action: 'org.address.set_primary' },
    )(
      { org_id: orgId, address_id: addressId },
      ctx,
    );

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
