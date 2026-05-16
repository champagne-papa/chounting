// src/app/api/orgs/[orgId]/bills/[billId]/record-payment/route.ts
//
// Phase 5 chunk B5-3-D4 substantive session #1: state-transition mutation
// route for bill payment recording. Consumes billService.recordPayment per
// service-architecture skill §2:
//   - billService is unwrapped Pattern B (verified at billService.ts:488-489)
//   - route layer wraps via withInvariants(action: 'bill.record_payment')
//   - bill.record_payment ActionName + permissions seeded at session #1
//     migration 20240141000000_bill_record_payment_action_permission.sql
//
// Mirror pattern: B5-3-D3 approve-for-payment route at
// apps/web/src/app/api/orgs/[orgId]/bills/[billId]/approve-for-payment/route.ts
// (verb-segment URL canonical at HEAD 6a99c2c). Returns 200 (state
// transition: approved_for_payment OR partially_paid → partially_paid OR
// fully_paid per allocation-sum logic; payment_id created as service-grain
// side-effect but route returns state-transition payload).

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { RecordBillPaymentInputSchema } from '@/shared/schemas/spend/bill.schema';
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

    const parsed = RecordBillPaymentInputSchema.parse({
      org_id: orgId,
      bill_id: billId,
      ...json,
    });

    const ctx = await buildServiceContext(req);

    // INV-SERVICE-001 wrap site: billService.recordPayment is unwrapped
    // Pattern B; route handler wraps via withInvariants at the call site.
    const result = await withInvariants(
      billService.recordPayment,
      { action: 'bill.record_payment' }
    )(parsed, ctx);

    // 200 OK — state transition; returns { payment_id, bill_id,
    // journal_entry_id, new_lifecycle_state }.
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
