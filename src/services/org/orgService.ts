// src/services/org/orgService.ts
import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { loggerWith } from '@/shared/logger/pino';
import { ServiceError } from '@/services/errors/ServiceError';

interface CreateOrgInput {
  name: string;
  industry: 'holding_company' | 'real_estate' | 'healthcare' | 'hospitality' | 'trading' | 'restaurant';
}

export const orgService = {
  async createOrgWithTemplate(input: CreateOrgInput, ctx: ServiceContext) {
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    log.info({ input }, 'Creating org and loading CoA template');

    // 1. Create the org row
    const { data: org, error: orgErr } = await db
      .from('organizations')
      .insert({
        name: input.name,
        industry: input.industry,
        functional_currency: 'CAD',
        created_by: ctx.caller.user_id,
      })
      .select('org_id')
      .single();

    if (orgErr || !org) {
      throw new ServiceError('ORG_CREATE_FAILED', orgErr?.message ?? 'unknown');
    }

    // 2. Load the template into chart_of_accounts for this org
    const { data: tpl, error: tplErr } = await db
      .from('chart_of_accounts_templates')
      .select('account_code, account_name, account_type, is_intercompany_capable')
      .eq('industry', input.industry);

    if (tplErr || !tpl || tpl.length === 0) {
      throw new ServiceError('TEMPLATE_NOT_FOUND', input.industry);
    }

    const coaRows = tpl.map((t: { account_code: string; account_name: string; account_type: string; is_intercompany_capable: boolean }) => ({
      org_id: org.org_id,
      account_code: t.account_code,
      account_name: t.account_name,
      account_type: t.account_type,
      is_intercompany_capable: t.is_intercompany_capable,
    }));

    const { error: insertErr } = await db.from('chart_of_accounts').insert(coaRows);
    if (insertErr) {
      throw new ServiceError('COA_LOAD_FAILED', insertErr.message);
    }

    // 3. Auto-create the calling user's membership as 'controller'
    //    (Phase 1.1 simplification — Phase 2 can refine to a proper role-grant flow)
    await db.from('memberships').insert({
      user_id: ctx.caller.user_id,
      org_id: org.org_id,
      role: 'controller',
    });

    log.info({ org_id: org.org_id, accounts_loaded: coaRows.length }, 'Org created');

    return { org_id: org.org_id, accounts_loaded: coaRows.length };
  },
};
