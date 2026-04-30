// tests/integration/orgProfileCreation.test.ts
// Category A floor test CA-06: org creation with full profile
// populates all new Phase 1.5A columns.

import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';

describe('CA-06: org creation with full profile populates all new columns', () => {
  const db = adminClient();
  const TEST_ORG_ID = '99999906-0000-0000-0000-000000000001';

  afterAll(async () => {
    await db.from('fiscal_periods').delete().eq('org_id', TEST_ORG_ID);
    await db.from('chart_of_accounts').delete().eq('org_id', TEST_ORG_ID);
    await db.from('memberships').delete().eq('org_id', TEST_ORG_ID);
    await db.from('organizations').delete().eq('org_id', TEST_ORG_ID);
  });

  it('inserts an org with all Phase 1.5A columns and reads them back', async () => {
    const { data: ind } = await db
      .from('industries')
      .select('industry_id')
      .eq('slug', 'holding_company')
      .single();

    const { error: insertErr } = await db.from('organizations').insert({
      org_id: TEST_ORG_ID,
      name: 'Test Full Profile Org',
      legal_name: 'Test Full Profile Org Inc.',
      industry: 'holding_company',
      industry_id: ind!.industry_id,
      functional_currency: 'CAD',
      fiscal_year_start_month: 4,
      business_structure: 'corporation',
      business_registration_number: '123456789RC0001',
      tax_registration_number: '123456789RT0001',
      gst_registration_date: '2020-06-15',
      accounting_framework: 'aspe',
      description: 'Integration test org',
      website: 'https://example.com',
      email: 'ap@example.com',
      phone: '6045551234',
      phone_country_code: '+1',
      time_zone: 'America/Toronto',
      default_locale: 'fr-CA',
      default_report_basis: 'accrual',
      default_payment_terms_days: 45,
      multi_currency_enabled: true,
      status: 'active',
      mfa_required: true,
      books_start_date: '2020-01-01',
      external_ids: { stripe_customer_id: 'cus_test123' },
      parent_org_id: null,
    });
    expect(insertErr).toBeNull();

    const { data: org, error: readErr } = await db
      .from('organizations')
      .select('*')
      .eq('org_id', TEST_ORG_ID)
      .single();

    expect(readErr).toBeNull();
    expect(org).toBeTruthy();

    // Phase 1.1 columns
    expect(org!.name).toBe('Test Full Profile Org');
    expect(org!.legal_name).toBe('Test Full Profile Org Inc.');
    expect(org!.industry).toBe('holding_company');
    expect(org!.functional_currency).toBe('CAD');
    expect(org!.fiscal_year_start_month).toBe(4);

    // Phase 1.5A columns
    expect(org!.industry_id).toBe(ind!.industry_id);
    expect(org!.business_structure).toBe('corporation');
    expect(org!.business_registration_number).toBe('123456789RC0001');
    expect(org!.tax_registration_number).toBe('123456789RT0001');
    expect(org!.gst_registration_date).toBe('2020-06-15');
    expect(org!.accounting_framework).toBe('aspe');
    expect(org!.description).toBe('Integration test org');
    expect(org!.website).toBe('https://example.com');
    expect(org!.email).toBe('ap@example.com');
    expect(org!.phone).toBe('6045551234');
    expect(org!.phone_country_code).toBe('+1');
    expect(org!.time_zone).toBe('America/Toronto');
    expect(org!.default_locale).toBe('fr-CA');
    expect(org!.default_report_basis).toBe('accrual');
    expect(org!.default_payment_terms_days).toBe(45);
    expect(org!.multi_currency_enabled).toBe(true);
    expect(org!.status).toBe('active');
    expect(org!.mfa_required).toBe(true);
    expect(org!.books_start_date).toBe('2020-01-01');
    expect(org!.external_ids).toEqual({ stripe_customer_id: 'cus_test123' });
    expect(org!.parent_org_id).toBeNull();
  });
});
