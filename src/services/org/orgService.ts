// src/services/org/orgService.ts
//
// INV-SERVICE-001 export contract (structural): this module exports plain
// (unwrapped) functions. Mutating functions MUST be invoked through
// withInvariants() at the call site (route handler / orchestrator).
// INV-SERVICE-002 adminClient discipline (structural): every database
// access in this file goes through adminClient() from '@/db/adminClient'.
//
// Phase 1.5A extended this service:
//   - createOrgWithTemplate now accepts the full CreateOrgProfileInput
//     shape (camelCase boundary). Resolves industry_id → bridge enum
//     to populate both the new industry_id FK and the legacy industry
//     enum column (two-step migration is in flight, see brief §8).
//   - updateOrgProfile (controller-only, audit-logged with full
//     before_state). Rejects baseCurrency / fiscalYearStartMonth via
//     .strict() on the patch schema.
//   - getOrgProfile (read; not withInvariants-wrapped per OQ-07).
//   - listIndustries (read; any authenticated user).

import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { loggerWith } from '@/shared/logger/pino';
import { ServiceError } from '@/services/errors/ServiceError';
import { recordMutation } from '@/services/audit/recordMutation';
import { generateMonthlyFiscalPeriods } from './generateFiscalPeriods';
import {
  createOrgProfileSchema,
  updateOrgProfilePatchSchema,
  type CreateOrgProfileInput,
  type UpdateOrgProfilePatch,
} from '@/shared/schemas/organization/profile.schema';

// camelCase API boundary → snake_case DB column mapping for org
// profile fields. Centralized here so updateOrgProfile and the
// initial insert in createOrgWithTemplate use the same translation.
// `baseCurrency` → `functional_currency` is the only non-1:1 case.
function profilePatchToDbColumns(
  patch: UpdateOrgProfilePatch,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (patch.name !== undefined) out.name = patch.name;
  if (patch.legalName !== undefined) out.legal_name = patch.legalName;
  if (patch.industryId !== undefined) out.industry_id = patch.industryId;
  if (patch.businessStructure !== undefined) out.business_structure = patch.businessStructure;
  if (patch.businessRegistrationNumber !== undefined) out.business_registration_number = patch.businessRegistrationNumber;
  if (patch.taxRegistrationNumber !== undefined) out.tax_registration_number = patch.taxRegistrationNumber;
  if (patch.gstRegistrationDate !== undefined) out.gst_registration_date = patch.gstRegistrationDate;
  if (patch.accountingFramework !== undefined) out.accounting_framework = patch.accountingFramework;
  if (patch.description !== undefined) out.description = patch.description;
  if (patch.website !== undefined) out.website = patch.website;
  if (patch.email !== undefined) out.email = patch.email;
  if (patch.phone !== undefined) out.phone = patch.phone;
  if (patch.phoneCountryCode !== undefined) out.phone_country_code = patch.phoneCountryCode;
  if (patch.timeZone !== undefined) out.time_zone = patch.timeZone;
  if (patch.defaultLocale !== undefined) out.default_locale = patch.defaultLocale;
  if (patch.defaultReportBasis !== undefined) out.default_report_basis = patch.defaultReportBasis;
  if (patch.defaultPaymentTermsDays !== undefined) out.default_payment_terms_days = patch.defaultPaymentTermsDays;
  if (patch.multiCurrencyEnabled !== undefined) out.multi_currency_enabled = patch.multiCurrencyEnabled;
  if (patch.status !== undefined) out.status = patch.status;
  if (patch.mfaRequired !== undefined) out.mfa_required = patch.mfaRequired;
  if (patch.booksStartDate !== undefined) out.books_start_date = patch.booksStartDate;
  if (patch.externalIds !== undefined) out.external_ids = patch.externalIds;
  if (patch.parentOrgId !== undefined) out.parent_org_id = patch.parentOrgId;
  if (patch.logoStoragePath !== undefined) out.logo_storage_path = patch.logoStoragePath;
  return out;
}

export const orgService = {
  /**
   * Creates a new organization with full profile, loads its CoA from
   * the industry's bridged template, generates fiscal periods, and
   * grants the calling user a controller membership.
   *
   * Industry handling (Phase 1.5A two-step migration):
   *   - input.industryId is the new FK; the bridge column
   *     industries.default_coa_template_industry resolves to the
   *     legacy org_industry enum used by chart_of_accounts_templates.
   *   - If the bridge is null, no CoA template exists for this
   *     industry → reject with NO_COA_TEMPLATE_FOR_INDUSTRY.
   *   - Both industry_id (new) and industry (legacy enum) are
   *     populated on the row until the legacy column is dropped in
   *     a follow-up migration (see brief §8).
   */
  async createOrgWithTemplate(
    input: CreateOrgProfileInput,
    ctx: ServiceContext,
  ) {
    const parsed = createOrgProfileSchema.parse(input);
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    log.info({ name: parsed.name, industry_id: parsed.industryId }, 'Creating org with full profile');

    // 1. Resolve industry_id → legacy enum bridge. Required because
    //    chart_of_accounts_templates is keyed by the legacy enum and
    //    the legacy organizations.industry column is still NOT NULL.
    const { data: industryRow, error: industryErr } = await db
      .from('industries')
      .select('industry_id, default_coa_template_industry')
      .eq('industry_id', parsed.industryId)
      .maybeSingle();

    if (industryErr) {
      throw new ServiceError('ORG_CREATE_FAILED', `Industry lookup failed: ${industryErr.message}`);
    }
    if (!industryRow) {
      throw new ServiceError('INDUSTRY_NOT_FOUND', `industry_id=${parsed.industryId} does not exist`);
    }

    const bridgeEnum = industryRow.default_coa_template_industry as string | null;
    if (!bridgeEnum) {
      throw new ServiceError(
        'NO_COA_TEMPLATE_FOR_INDUSTRY',
        `industry_id=${parsed.industryId} has no bridged CoA template (default_coa_template_industry IS NULL)`,
      );
    }

    // parent_org_id self-reference is impossible at create time
    // (the new org_id is DB-generated). The org_parent_is_not_self
    // CHECK catches the impossible case if it ever arises via
    // some future flow. No pre-flight check needed here.

    // 2. Assemble the insert row from the parsed input + bridge.
    const baseRow = profilePatchToDbColumns({
      name: parsed.name,
      legalName: parsed.legalName ?? null,
      industryId: parsed.industryId,
      businessStructure: parsed.businessStructure,
      businessRegistrationNumber: parsed.businessRegistrationNumber ?? null,
      taxRegistrationNumber: parsed.taxRegistrationNumber ?? null,
      gstRegistrationDate: parsed.gstRegistrationDate ?? null,
      accountingFramework: parsed.accountingFramework,
      description: parsed.description ?? null,
      website: parsed.website ?? null,
      email: parsed.email ?? null,
      phone: parsed.phone ?? null,
      phoneCountryCode: parsed.phoneCountryCode ?? null,
      timeZone: parsed.timeZone,
      defaultLocale: parsed.defaultLocale,
      defaultReportBasis: parsed.defaultReportBasis,
      defaultPaymentTermsDays: parsed.defaultPaymentTermsDays,
      multiCurrencyEnabled: parsed.multiCurrencyEnabled,
      status: parsed.status,
      mfaRequired: parsed.mfaRequired,
      booksStartDate: parsed.booksStartDate ?? null,
      externalIds: parsed.externalIds,
      parentOrgId: parsed.parentOrgId ?? null,
      logoStoragePath: parsed.logoStoragePath ?? null,
    });

    const insertRow: Record<string, unknown> = {
      ...baseRow,
      // Legacy enum column populated from the bridge.
      industry: bridgeEnum,
      // Immutable-post-creation fields (not in the patch shape).
      functional_currency: parsed.baseCurrency,
      fiscal_year_start_month: parsed.fiscalYearStartMonth,
      created_by: ctx.caller.user_id,
    };

    const { data: org, error: orgErr } = await db
      .from('organizations')
      .insert(insertRow)
      .select('org_id, fiscal_year_start_month')
      .single();

    if (orgErr || !org) {
      throw new ServiceError('ORG_CREATE_FAILED', orgErr?.message ?? 'unknown');
    }

    // 4. Load CoA from the bridged template.
    const { data: tpl, error: tplErr } = await db
      .from('chart_of_accounts_templates')
      .select('account_code, account_name, account_type, is_intercompany_capable')
      .eq('industry', bridgeEnum);

    if (tplErr || !tpl || tpl.length === 0) {
      throw new ServiceError('TEMPLATE_NOT_FOUND', bridgeEnum);
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

    // 5. Auto-create the calling user's membership as 'controller'.
    await db.from('memberships').insert({
      user_id: ctx.caller.user_id,
      org_id: org.org_id,
      role: 'controller',
    });

    // 6. Auto-generate 12 monthly fiscal periods for the current FY.
    const periods = generateMonthlyFiscalPeriods(
      org.fiscal_year_start_month,
      new Date().getFullYear(),
      org.org_id,
    );
    const { error: periodErr } = await db.from('fiscal_periods').insert(periods);
    if (periodErr) {
      throw new ServiceError('PERIOD_GENERATION_FAILED', periodErr.message);
    }

    log.info(
      { org_id: org.org_id, accounts_loaded: coaRows.length, periods_created: periods.length },
      'Org created with CoA and fiscal periods',
    );

    return { org_id: org.org_id, accounts_loaded: coaRows.length, periods_created: periods.length };
  },

  /**
   * Patches an organization's profile fields. Controller-only
   * (enforced by withInvariants Invariant 4 + ROLE_PERMISSIONS).
   * Audit-logged with full before_state per brief §12 (consumers
   * reconstruct field-level diffs by comparing before_state to
   * the current row).
   *
   * baseCurrency and fiscalYearStartMonth are immutable
   * post-creation; updateOrgProfilePatchSchema is .strict() so
   * any patch that includes them is rejected by Zod with a
   * clear "Unrecognized key" error before this function runs.
   *
   * Note on industryId mutability: changing industry_id does NOT
   * regenerate the org's chart_of_accounts. The CoA was loaded
   * from a template at creation; orgs that re-categorize keep
   * their existing CoA as-is. A separate Phase 2+ reconciliation
   * flow would be needed to refresh CoA for a new industry.
   */
  async updateOrgProfile(
    input: { org_id: string; patch: UpdateOrgProfilePatch },
    ctx: ServiceContext,
  ) {
    // .strict() on the schema rejects baseCurrency, fiscalYearStartMonth,
    // and any unknown fields. Catching here surfaces a typed
    // ORG_IMMUTABLE_FIELD error instead of the bare ZodError.
    let parsedPatch: UpdateOrgProfilePatch;
    try {
      parsedPatch = updateOrgProfilePatchSchema.parse(input.patch);
    } catch (err) {
      // Zod .strict() error mentions "Unrecognized key(s)" which we
      // map to ORG_IMMUTABLE_FIELD when the offending key is one of
      // the known immutable fields, and EXTERNAL_IDS_MALFORMED when
      // externalIds itself fails (matched by issue path).
      if (err instanceof Error) {
        const msg = err.message;
        if (/Unrecognized key/.test(msg) && /(baseCurrency|fiscalYearStartMonth)/.test(msg)) {
          throw new ServiceError('ORG_IMMUTABLE_FIELD', msg);
        }
        if (/external_ids|externalIds/i.test(msg)) {
          throw new ServiceError('EXTERNAL_IDS_MALFORMED', msg);
        }
      }
      throw err;
    }

    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    // Load full pre-mutation row for before_state snapshot.
    const { data: before, error: beforeErr } = await db
      .from('organizations')
      .select('*')
      .eq('org_id', input.org_id)
      .maybeSingle();

    if (beforeErr) {
      throw new ServiceError('ORG_UPDATE_FAILED', `Pre-load failed: ${beforeErr.message}`);
    }
    if (!before) {
      throw new ServiceError('ORG_NOT_FOUND', `org_id=${input.org_id} does not exist`);
    }

    // industryId validation (FK would catch but we want a typed error).
    if (parsedPatch.industryId !== undefined) {
      const { data: ind } = await db
        .from('industries')
        .select('industry_id')
        .eq('industry_id', parsedPatch.industryId)
        .maybeSingle();
      if (!ind) {
        throw new ServiceError('INDUSTRY_NOT_FOUND', `industry_id=${parsedPatch.industryId} does not exist`);
      }
    }

    // parent_org_id validation (typed errors before the DB CHECK fires).
    if (parsedPatch.parentOrgId !== undefined && parsedPatch.parentOrgId !== null) {
      if (parsedPatch.parentOrgId === input.org_id) {
        throw new ServiceError('PARENT_ORG_IS_SELF', `parent_org_id cannot equal org_id (${input.org_id})`);
      }
      const { data: parent } = await db
        .from('organizations')
        .select('org_id')
        .eq('org_id', parsedPatch.parentOrgId)
        .maybeSingle();
      if (!parent) {
        throw new ServiceError('PARENT_ORG_NOT_FOUND', `parent_org_id=${parsedPatch.parentOrgId} does not exist`);
      }
    }

    const dbPatch = profilePatchToDbColumns(parsedPatch);

    const { error: updateErr } = await db
      .from('organizations')
      .update(dbPatch)
      .eq('org_id', input.org_id);

    if (updateErr) {
      throw new ServiceError('ORG_UPDATE_FAILED', updateErr.message);
    }

    await recordMutation(db, ctx, {
      org_id: input.org_id,
      action: 'org.profile_updated',
      entity_type: 'organization',
      entity_id: input.org_id,
      before_state: before as Record<string, unknown>,
    });

    log.info(
      { org_id: input.org_id, fields_changed: Object.keys(dbPatch) },
      'Org profile updated',
    );

    return { org_id: input.org_id, fields_changed: Object.keys(dbPatch) };
  },

  /**
   * Reads the full profile of an organization. NOT
   * withInvariants-wrapped per OQ-07 (resolved 2026-04-15) —
   * read-only service functions rely on RLS at the DB level.
   * The route handler should use a userClient or the caller's
   * org-membership pre-check to gate visibility.
   */
  async getOrgProfile(input: { org_id: string }, _ctx: ServiceContext) {
    const db = adminClient();
    const { data: row, error } = await db
      .from('organizations')
      .select('*')
      .eq('org_id', input.org_id)
      .maybeSingle();

    if (error) {
      throw new ServiceError('READ_FAILED', error.message);
    }
    if (!row) {
      throw new ServiceError('ORG_NOT_FOUND', `org_id=${input.org_id} does not exist`);
    }
    return row;
  },

  /**
   * Lists all active industries. Authenticated users only — the
   * RLS policy on the industries table (FOR SELECT TO authenticated
   * USING (true)) is the actual gate. Not withInvariants-wrapped
   * per OQ-07. Used during org creation, before the user has any
   * membership to scope by.
   */
  async listIndustries(_input: Record<string, never>, _ctx: ServiceContext) {
    const db = adminClient();
    const { data: rows, error } = await db
      .from('industries')
      .select('industry_id, naics_code, slug, display_name, parent_industry_id, is_active, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('display_name', { ascending: true });

    if (error) {
      throw new ServiceError('READ_FAILED', error.message);
    }
    return { industries: rows ?? [] };
  },
};
