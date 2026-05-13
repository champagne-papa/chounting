// src/app/api/orgs/[orgId]/reports/active-payments/route.ts
// GET — Active payments: bills in partially_paid lifecycle_state.
// No withInvariants — reads call service directly per CLAUDE.md Rule 2.
//
// Phase 5 chunk B5-3-D5 — operator entry path for subsequent partial-
// payment-followup actions (RecordPaymentCard with computed amount_due
// pre-fill). Closes catch #57 sub-surface expansion UX gap at partial-
// payment-followup grain (partially_paid bills disappear from
// PaymentApprovalQueueView per its post-filter approved_for_payment only).
// ActivePaymentsView is the additive-substrate solution preserving
// B5-3-D2 PaymentApprovalQueueView semantic canonical-for-approve-action
// grain.

import { NextResponse } from 'next/server';
import { apReportService } from '@/services/spend/reports/apReportService';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await params;
    const ctx = await buildServiceContext(req);
    const result = await apReportService.activePayments(
      { org_id: orgId },
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
