import { adminClient } from '../setup/testDb';

// Dedicated Charter B real-flow test orgs, isolated from SEED.ORG_HOLDING AND
// from each other (one UUID per test file).
//
// WHY: the charter-B tests set default_storage_provider='sharepoint_drive' to
// exercise dynamic selection. The full suite runs test FILES in parallel
// against the shared DB; mutating a SEED org's default would make parallel
// ingest tests (which use SEED.ORG_HOLDING) resolve sharepoint_drive and hit
// the unconfigured Graph provider — cross-file pollution. A dedicated UUID per
// file (touched by no other test) lets each flip its default freely without
// polluting SEED orgs OR the sibling charter-B file.
//
// Idempotent; NOT deleted (source_documents carry BEFORE DELETE reject triggers
// and rows accumulate per the harness contract — db:reset:clean wipes these
// between runs, same as SEED data).
export const CHARTER_B_ORG_SLICE = 'cb000000-0000-0000-0000-0000000000a1';
export const CHARTER_B_ORG_WRITE = 'cb000000-0000-0000-0000-0000000000b2';

export async function ensureCharterBOrg(orgId: string): Promise<string> {
  const db = adminClient();
  const { data: existing } = await db
    .from('organizations')
    .select('org_id')
    .eq('org_id', orgId)
    .maybeSingle();
  if (!existing) {
    const { data: industry, error: indErr } = await db
      .from('industries')
      .select('industry_id')
      .eq('slug', 'holding_company')
      .single();
    if (indErr || !industry) {
      throw new Error(`ensureCharterBOrg: industry lookup failed: ${indErr?.message}`);
    }
    const label = `Charter B Test Org ${orgId.slice(0, 8)}`;
    const { error } = await db.from('organizations').insert({
      org_id: orgId,
      name: label,
      legal_name: `${label} Inc.`,
      industry: 'holding_company',
      industry_id: industry.industry_id,
      business_structure: 'corporation',
      functional_currency: 'CAD',
      fiscal_year_start_month: 1,
    });
    if (error) throw new Error(`ensureCharterBOrg: org insert failed: ${error.message}`);
    // org_settings row is auto-created by the 20240158 trigger
    // (default_storage_provider defaults to 'supabase_storage').
  }
  return orgId;
}
