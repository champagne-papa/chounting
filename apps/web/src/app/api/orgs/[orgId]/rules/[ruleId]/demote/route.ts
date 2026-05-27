// apps/web/src/app/api/orgs/[orgId]/rules/[ruleId]/demote/route.ts
//
// Ring 2A-core Commit 4 (ADR-0025 §9, OQ-4 separate sub-routes). POST — demote a
// rule back to always_confirm. withInvariants({ action: 'rule.demote' }) engages the
// controller-only permission check; ruleRegistryService.demote is the wrapped method.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { DemoteRuleInputSchema } from '@/shared/schemas/rules/ruleActions.schema';
import { withInvariants } from '@/services/middleware/withInvariants';
import { ruleRegistryService } from '@/services/rules/ruleRegistryService';
import { buildServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgId: string; ruleId: string }> },
) {
  try {
    const { orgId, ruleId } = await params;
    const json = await req.json().catch(() => ({}));
    const parsed = DemoteRuleInputSchema.parse({ ...json, org_id: orgId, rule_id: ruleId });
    const ctx = await buildServiceContext(req);
    const result = await withInvariants(ruleRegistryService.demote, { action: 'rule.demote' })(parsed, ctx);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: err.issues }, { status: 400 });
    }
    if (err instanceof ServiceError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: serviceErrorToStatus(err.code) });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
