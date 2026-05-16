// src/app/api/orgs/[orgId]/bills/[billId]/reverse/route.ts
//
// Phase 5 chunk B5-3-D6: bill reversal mutation route. Wraps
// billService.reverse with withInvariants(action: 'bill.reverse').
// Mirror pattern: approve-for-payment + record-payment routes at the
// sibling URLs.
//
// Reverse is a 4-state mutation (pending_approval, approved_for_payment,
// partially_paid, fully_paid → voided) that produces a new reversal JE
// with mirrored lines (Dr ↔ Cr swap) per INV-REVERSAL-001. Returns 200
// (state transition; reversal JE created as side-effect).

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ReverseBillInputSchema } from '@/shared/schemas/spend/bill.schema';
import { withInvariants } from '@/services/middleware/withInvariants';
import { billService } from '@/services/spend/billService';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgId: string; billId: string }> }
) {
  try {
    const { orgId, billId } = await params;
    const json = await req.json();

    const parsed = ReverseBillInputSchema.parse({
      org_id: orgId,
      bill_id: billId,
      ...json,
    });

    const ctx = await buildServiceContext(req);

    const result = await withInvariants(
      billService.reverse,
      { action: 'bill.reverse' }
    )(parsed, ctx);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: err.issues },
        { status: 400 }
      );
    }
    if (err instanceof ServiceError) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: serviceErrorToStatus(err.code) }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
