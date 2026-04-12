// src/app/api/orgs/[orgId]/chart-of-accounts/route.ts
// GET — list chart of accounts for an org (nested resource pattern).
// Migrated from /api/chart-of-accounts?org_id= during Phase 13A.
// No withInvariants — reads call service directly per CLAUDE.md Rule 2.

import { NextResponse } from 'next/server';
import { chartOfAccountsService } from '@/services/accounting/chartOfAccountsService';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const ctx = await buildServiceContext(req);
    const accounts = await chartOfAccountsService.list({ org_id: orgId }, ctx);
    return NextResponse.json({ accounts, count: accounts.length });
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
