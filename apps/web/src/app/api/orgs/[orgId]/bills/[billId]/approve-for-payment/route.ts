// src/app/api/orgs/[orgId]/bills/[billId]/approve-for-payment/route.ts
//
// Phase 5 chunk B5-3-D3 substantive session #2: state-only mutation route
// for bill approval. Consumes billService.approveForPayment per service-
// architecture skill §2:
//   - billService is unwrapped Pattern B
//   - route layer wraps via withInvariants(action: 'bill.approve')
//   - bill.approve ActionName + permissions seeded at session #1
//     migration 20240140000000_bill_action_permissions.sql
//
// Mirror pattern: recurring-runs/[runId]/approve/route.ts (verb-segment
// URL canonical at HEAD 4abd387). Returns 200 (state transition; no new
// resource created). Reading B preserved by construction — approve
// produces NO journal entry (state-only mutation per billService.ts:400-403).

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ApproveBillForPaymentInputSchema } from '@/shared/schemas/spend/bill.schema';
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
    // Body parse may be empty (no client-side fields needed beyond URL params);
    // tolerate empty body per recurring-runs precedent.
    const json = await req.json().catch(() => ({}));

    const parsed = ApproveBillForPaymentInputSchema.parse({
      org_id: orgId,
      bill_id: billId,
      ...json,
    });

    const ctx = await buildServiceContext(req);

    // INV-SERVICE-001 wrap site: billService.approveForPayment is unwrapped
    // Pattern B; route handler wraps via withInvariants at the call site.
    const result = await withInvariants(
      billService.approveForPayment,
      { action: 'bill.approve' }
    )(parsed, ctx);

    // 200 OK — state transition (NOT 201; no new resource created).
    // Returns { bill_id }.
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
