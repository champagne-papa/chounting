// src/app/api/orgs/[orgId]/reports/accounts-by-type/route.ts
// GET — per-account debit/credit totals filtered by account_type.
// Required query param: accountType. Optional: periodId (UUID).
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
    const accountType = url.searchParams.get('accountType');
    const periodId = url.searchParams.get('periodId') || undefined;

    if (!accountType) {
      return NextResponse.json(
        { error: 'VALIDATION', message: 'accountType query param required' },
        { status: 400 },
      );
    }

    const ctx = await buildServiceContext(req);
    const result = await reportService.accountsByType(
      { org_id: orgId, account_type: accountType, fiscal_period_id: periodId },
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
