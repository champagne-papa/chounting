// src/app/api/orgs/[orgId]/reports/account-ledger/route.ts
// GET — Account Ledger for one account with running-balance.
// Required query param: accountId (UUID). Optional: periodId (UUID).
// No withInvariants — reads call service directly per CLAUDE.md Rule 2.

import { NextResponse } from 'next/server';
import { accountLedgerService } from '@/services/reporting/accountLedgerService';
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
    const accountId = url.searchParams.get('accountId');
    const periodId = url.searchParams.get('periodId') || undefined;

    if (!accountId) {
      return NextResponse.json(
        { error: 'VALIDATION', message: 'accountId query param required' },
        { status: 400 },
      );
    }

    const ctx = await buildServiceContext(req);
    const result = await accountLedgerService.get(
      { org_id: orgId, account_id: accountId, fiscal_period_id: periodId },
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
