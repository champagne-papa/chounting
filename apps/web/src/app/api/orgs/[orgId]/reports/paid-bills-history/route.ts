// src/app/api/orgs/[orgId]/reports/paid-bills-history/route.ts
// GET — Paid bills history: bills in fully_paid lifecycle_state.
// No withInvariants — reads call service directly per CLAUDE.md Rule 2.

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
    const result = await apReportService.paidBillsHistory(
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
