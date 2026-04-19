// src/agent/memory/orgContextManager.ts
// Phase 1.2 Session 4 — full OrgContext shape + loader per
// master brief §8. Replaces the Session 3 stub at
// src/agent/prompts/orgContext.ts (deleted in commit 1).
//
// The orchestrator calls loadOrgContext once per turn (master
// §5.2 step 2) and feeds the result into buildSystemPrompt so
// the agent has org awareness without calling tools on every
// turn.
//
// INV-SERVICE-002 adminClient discipline (structural): every
// database access goes through adminClient(). Not wrapped in
// withInvariants — the caller's ServiceContext has already been
// authorized at the route layer. loadOrgContext is a read
// helper; it does not mutate.

import { adminClient } from '@/db/adminClient';
import { ServiceError } from '@/services/errors/ServiceError';

export type FiscalPeriodSummary = {
  fiscal_period_id: string;
  period_name: string;
  starts_on: string; // ISO date (YYYY-MM-DD)
  ends_on: string;
  is_current: boolean;
  is_locked: boolean;
};

export type OrgContext = {
  org_id: string;
  org_name: string;
  legal_name: string | null;
  industry_display_name: string;
  functional_currency: string;
  fiscal_year_start_month: number;
  fiscal_periods: FiscalPeriodSummary[];
  controllers: { user_id: string; display_name: string }[];
  // Phase 2 — empty arrays in 1.2. Typed as `never[]` so the
  // compiler rejects any attempt to populate them in 1.2 code.
  vendor_rules: never[];
  intercompany_relationships: never[];
  approval_rules: never[];
};

export async function loadOrgContext(orgId: string): Promise<OrgContext> {
  const db = adminClient();

  // 1. Organization + industry display name.
  //    organizations.industry_id is NOT NULL FK to industries
  //    (migration 109), so the join always produces a row.
  const { data: org, error: orgErr } = await db
    .from('organizations')
    .select(
      'org_id, name, legal_name, functional_currency, fiscal_year_start_month, industries:industry_id(display_name)',
    )
    .eq('org_id', orgId)
    .maybeSingle();

  if (orgErr) {
    throw new ServiceError(
      'READ_FAILED',
      `Failed to load organization ${orgId}: ${orgErr.message}`,
    );
  }
  if (!org) {
    throw new ServiceError('ORG_NOT_FOUND', `Organization not found: ${orgId}`);
  }

  // 2. Fiscal periods, ordered chronologically. is_current is
  //    derived here (no DB column) — a period is current if
  //    today's date falls between start_date and end_date
  //    inclusive. ISO-date strings compare lexicographically
  //    in the correct order, so no Date parsing needed.
  const { data: periodRows, error: periodErr } = await db
    .from('fiscal_periods')
    .select('period_id, name, start_date, end_date, is_locked')
    .eq('org_id', orgId)
    .order('start_date', { ascending: true });

  if (periodErr) {
    throw new ServiceError(
      'READ_FAILED',
      `Failed to load fiscal periods for org ${orgId}: ${periodErr.message}`,
    );
  }

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const fiscal_periods: FiscalPeriodSummary[] = (periodRows ?? []).map((p) => ({
    fiscal_period_id: p.period_id as string,
    period_name: p.name as string,
    starts_on: p.start_date as string,
    ends_on: p.end_date as string,
    is_current: today >= (p.start_date as string) && today <= (p.end_date as string),
    is_locked: p.is_locked as boolean,
  }));

  // 3. Active controllers with populated display_name.
  //    memberships.status = 'active' filter matches the RLS
  //    helper user_is_controller (migration 113).
  //    Controllers with null display_name are dropped — we
  //    only surface fully-named controllers into the prompt.
  const { data: controllerRows, error: ctrlErr } = await db
    .from('memberships')
    .select('user_id, user_profiles:user_id(display_name)')
    .eq('org_id', orgId)
    .eq('role', 'controller')
    .eq('status', 'active');

  if (ctrlErr) {
    throw new ServiceError(
      'READ_FAILED',
      `Failed to load controllers for org ${orgId}: ${ctrlErr.message}`,
    );
  }

  const controllers = (controllerRows ?? [])
    .map((row) => {
      // PostgREST returns a single row for a many-to-one FK
      // relation, but Supabase's generated types model it as
      // an array. Handle both shapes defensively.
      const profile = Array.isArray(row.user_profiles)
        ? row.user_profiles[0]
        : (row.user_profiles as { display_name: string | null } | null);
      return {
        user_id: row.user_id as string,
        display_name: profile?.display_name ?? null,
      };
    })
    .filter(
      (c): c is { user_id: string; display_name: string } =>
        typeof c.display_name === 'string' && c.display_name.length > 0,
    );

  // Industry join: same many-to-one shape handling.
  const industryRecord = Array.isArray(org.industries)
    ? org.industries[0]
    : (org.industries as { display_name: string } | null);

  return {
    org_id: org.org_id as string,
    org_name: org.name as string,
    legal_name: (org.legal_name as string | null) ?? null,
    industry_display_name: industryRecord?.display_name ?? 'Unknown',
    functional_currency: org.functional_currency as string,
    fiscal_year_start_month: org.fiscal_year_start_month as number,
    fiscal_periods,
    controllers,
    vendor_rules: [],
    intercompany_relationships: [],
    approval_rules: [],
  };
}
