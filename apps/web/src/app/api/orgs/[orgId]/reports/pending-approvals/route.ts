// src/app/api/orgs/[orgId]/reports/pending-approvals/route.ts
// GET — Pending approvals: bills in pending_approval lifecycle_state.
// No withInvariants — reads call service directly per CLAUDE.md Rule 2
// (mirror sibling read-side routes: active-payments, payment-approval-queue,
// paid-bills-history, bills/[billId]).
//
// Phase 5 arc-closure — closes the last functional gap: operators could
// reach reverse from approved_for_payment / partially_paid / fully_paid
// (via Active Payments + Paid Bills History row-clicks) but not from
// pending_approval, even though billService.reverse accepts that state.
// PendingApprovalsView (consumer of this endpoint) navigates to
// PaymentApprovalCard (approve) and to BillReverseCard (reverse via the
// per-bill route).

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
    const result = await apReportService.pendingApprovals(
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
