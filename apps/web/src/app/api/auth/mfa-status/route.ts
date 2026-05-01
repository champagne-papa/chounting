// GET /api/auth/mfa-status — MFA enrollment status for current org
//
// Q33 partial-resolution arc 2026-04-30: rewritten to consume
// orgService.getMfaRequirement instead of importing adminClient
// directly. Authorization gate: caller.org_ids.includes(orgId)
// matches the established getOrgProfile pattern (pattern-G1).

import { NextResponse } from 'next/server';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';
import { orgService } from '@/services/org/orgService';

export async function GET(req: Request) {
  try {
    const ctx = await buildServiceContext(req);
    const url = new URL(req.url);
    const orgId = url.searchParams.get('org_id');

    let orgRequiresMfa = false;
    if (orgId) {
      // Route-handler-gated authorization (pattern-G1, OQ-07).
      if (!ctx.caller.org_ids.includes(orgId)) {
        return NextResponse.json(
          { error: 'ORG_ACCESS_DENIED', message: `Caller does not have access to org_id=${orgId}` },
          { status: 403 },
        );
      }
      const result = await orgService.getMfaRequirement({ org_id: orgId }, ctx);
      orgRequiresMfa = result.org_requires_mfa;
    }

    return NextResponse.json({
      user_id: ctx.caller.user_id,
      org_requires_mfa: orgRequiresMfa,
    });
  } catch (err) {
    if (err instanceof ServiceError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: serviceErrorToStatus(err.code) });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
