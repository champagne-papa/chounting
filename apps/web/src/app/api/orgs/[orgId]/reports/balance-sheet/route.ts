// src/app/api/orgs/[orgId]/reports/balance-sheet/route.ts
// Phase 0-1.1 Control Foundations Step 7.
// GET — Balance Sheet report, 4-row point-in-time shape.
// Shipped alongside BasicBalanceSheetView.tsx; the view fetches
// this route. No withInvariants — reads call service directly
// per CLAUDE.md Rule 2.

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

    // Empty-string coalesce: the view's <input type="date"> can
    // emit an empty string when the user clears the field,
    // producing ?asOfDate= in the URL. searchParams.get returns
    // '' (not null) in that case. Using || (not ??) treats '' as
    // absent, matching the semantic "user did not specify a date"
    // and letting the service-side default fill in. TB and P&L
    // routes use ?? because periodId is a UUID (empty string
    // would fail the Zod parse anyway); this route's string-typed
    // date param surfaces the distinction.
    const asOfDate = url.searchParams.get('asOfDate') || undefined;

    const ctx = await buildServiceContext(req);
    const result = await reportService.balanceSheet(
      { org_id: orgId, as_of_date: asOfDate ?? null },
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
