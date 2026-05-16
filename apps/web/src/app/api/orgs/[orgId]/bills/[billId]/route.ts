// src/app/api/orgs/[orgId]/bills/[billId]/route.ts
// GET — Per-bill detail read. Returns BillDetailRow including computed
// amount_due. No withInvariants — reads call service directly per
// CLAUDE.md Rule 2 (mirror sibling read-side routes:
// active-payments, payment-approval-queue, paid-bills-history).
//
// Phase 5 chunk B5-3-D5 substrate-correction. Closes catch #69 (sibling-
// class to catch #57 substrate-grain semantic drift at downstream-consumer
// grain) + closes deferred Disposition (α) from B5-3-D3 chunk-grain.
// RecordPaymentCard previously consumed the payment-approval-queue endpoint
// which post-filters to `approved_for_payment` only, breaking the
// partially_paid bill row-click flow surfaced from ActivePaymentsView. This
// per-bill endpoint is the additive-substrate solution.

import { NextResponse } from 'next/server';
import { apReportService } from '@/services/spend/reports/apReportService';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string; billId: string }> },
) {
  try {
    const { orgId, billId } = await params;
    const ctx = await buildServiceContext(req);
    const result = await apReportService.billDetail(
      { org_id: orgId, bill_id: billId },
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
