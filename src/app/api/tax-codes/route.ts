// src/app/api/tax-codes/route.ts
// GET — list shared tax codes (org_id IS NULL).
// Flat path (no [orgId] segment) because tax codes are globally-readable
// reference data, not org-scoped. Convention: globally-readable data uses
// flat routes; org-scoped data uses /api/orgs/[orgId]/{resource}.

import { NextResponse } from 'next/server';
import { taxCodeService } from '@/services/accounting/taxCodeService';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';

export async function GET(req: Request) {
  try {
    const ctx = await buildServiceContext(req);
    const taxCodes = await taxCodeService.listShared(ctx);
    return NextResponse.json({ taxCodes, count: taxCodes.length });
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
