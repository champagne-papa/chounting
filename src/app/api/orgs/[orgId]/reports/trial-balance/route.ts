// src/app/api/orgs/[orgId]/reports/trial-balance/route.ts
// GET — Trial Balance report with per-account debit/credit totals.
// No withInvariants — reads call service directly per CLAUDE.md Rule 2.

import { NextResponse } from 'next/server';
import { reportService } from '@/services/reporting/reportService';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const url = new URL(req.url);
    const periodId = url.searchParams.get('periodId') ?? undefined;
    const ctx = await buildServiceContext(req);
    const result = await reportService.trialBalance(
      { org_id: orgId, fiscal_period_id: periodId },
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
