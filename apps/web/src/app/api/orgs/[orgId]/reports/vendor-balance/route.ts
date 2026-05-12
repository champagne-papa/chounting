// src/app/api/orgs/[orgId]/reports/vendor-balance/route.ts
// GET — Vendor balance composition (4 partial balances + net) per ADR-0015 §5.
// No withInvariants — reads call service directly per CLAUDE.md Rule 2.

import { NextResponse } from 'next/server';
import { vendorReportService } from '@/services/spend/reports/vendorReportService';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await params;
    const url = new URL(req.url);
    const vendorId = url.searchParams.get('vendor_id') ?? '';
    const ctx = await buildServiceContext(req);
    const result = await vendorReportService.balance(
      { org_id: orgId, vendor_id: vendorId },
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
