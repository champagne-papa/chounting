// tests/integration/readServiceOrgScoping.integration.test.ts
//
// Class D arc T5 (2026-06-06) — org-scoping corrections for the two
// Arc 2 ledgered defense-in-depth read gaps:
//   1. ruleOutcomeReadService.resolveRuleOutcomeParams — vendor_rules
//      read was by rule_id alone; now org-scoped.
//   2. extractionReadService.lookupDocumentCaseId — document_jobs
//      read was by source_document_id alone; now org-scoped with a
//      required org_id first parameter.
//
// Each correction narrows match semantics, so each is asserted BOTH
// ways (advisor T5 refinement): the in-org positive path must still
// resolve, and the cross-org negative path must miss — a
// too-aggressive filter that broke in-org resolution would pass a
// negative-only test.
//
// Substrate mirrors shadowRuleEvaluation.integration.test.ts (vendor
// + rule via ruleCreationOrchestrator/vendorRuleService) and
// documentCasesRead.integration.test.ts (source_document → case →
// job chain). Cleanup posture matches those files: rule/vendor rows
// deleted in afterAll; document-platform rows accumulate
// (delete-forbidden per immutability triggers; pnpm db:reset clears
// between full runs).

import { describe, it, expect, afterAll } from 'vitest';
import crypto from 'crypto';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { ruleCreationOrchestrator } from '@/services/rules/ruleCreationOrchestrator';
import { vendorRuleService } from '@/services/rules/vendorRuleService';
import { resolveRuleOutcomeParams } from '@/services/rules/ruleOutcomeReadService';
import { lookupDocumentCaseId } from '@/services/document-platform/extractionReadService';
import { createIngestBatchForTest } from '../helpers/createIngestBatchForTest';

const db = adminClient();

describe('Class D T5 — read-service org-scoping corrections', () => {
  const createdRuleIds: string[] = [];
  const createdVendorIds: string[] = [];

  afterAll(async () => {
    if (createdRuleIds.length > 0)
      await db.from('rule_registry').delete().in('id', createdRuleIds);
    if (createdVendorIds.length > 0)
      await db.from('vendors').delete().in('vendor_id', createdVendorIds);
  });

  it('resolveRuleOutcomeParams: in-org resolves; cross-org misses (vendor_rules org filter)', async () => {
    const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });

    // Seed vendor + approved rule in ORG_HOLDING (shadow-test pattern).
    const vendorId = crypto.randomUUID();
    const { error: vErr } = await db.from('vendors').insert({
      vendor_id: vendorId,
      org_id: SEED.ORG_HOLDING,
      name: 'TEST t5 org-scoping vendor',
    });
    if (vErr) throw new Error(`vendor seed failed: ${vErr.message}`);
    createdVendorIds.push(vendorId);

    const created = await ruleCreationOrchestrator.createVendorRule(
      {
        org_id: SEED.ORG_HOLDING,
        vendor_id: vendorId,
        bundle_type: 'born_paid_bill',
      },
      ctx,
    );
    createdRuleIds.push(created.rule_id);
    await vendorRuleService.approve(
      { org_id: SEED.ORG_HOLDING, rule_id: created.rule_id },
      ctx,
    );

    // The v1 card flow never sets default_account_id; set it directly
    // so the vendor_rules read has a non-null discriminator.
    const { data: acct, error: aErr } = await db
      .from('chart_of_accounts')
      .select('account_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .limit(1)
      .single();
    if (aErr || !acct) throw new Error(`account fixture: ${aErr?.message}`);
    const { error: uErr } = await db
      .from('vendor_rules')
      .update({ default_account_id: acct.account_id })
      .eq('rule_id', created.rule_id)
      .eq('org_id', SEED.ORG_HOLDING);
    if (uErr) throw new Error(`vendor_rules update: ${uErr.message}`);

    // POSITIVE: in-org still resolves both fields.
    const inOrg = await resolveRuleOutcomeParams(
      created.rule_id,
      vendorId,
      SEED.ORG_HOLDING,
    );
    expect(inOrg.default_account_id).toBe(acct.account_id);
    expect(inOrg.vendor_name).toBe('TEST t5 org-scoping vendor');

    // NEGATIVE: a foreign org querying the same rule_id/vendor_id
    // resolves NEITHER field (vendor_rules now org-filtered; vendors
    // was already org-filtered).
    const crossOrg = await resolveRuleOutcomeParams(
      created.rule_id,
      vendorId,
      SEED.ORG_REAL_ESTATE,
    );
    expect(crossOrg.default_account_id).toBeNull();
    expect(crossOrg.vendor_name).toBeNull();
  });

  it('lookupDocumentCaseId: in-org resolves the case; cross-org returns null (document_jobs org filter)', async () => {
    const trace_id = crypto.randomUUID();

    // Batch → source_document → case → job chain in ORG_HOLDING
    // (documentCasesRead fixture pattern).
    const { ingest_batch_id } = await createIngestBatchForTest(
      SEED.ORG_HOLDING,
      { trace_id },
    );

    const source_document_id = crypto.randomUUID();
    const { error: sdErr } = await db.from('source_documents').insert({
      id: source_document_id,
      org_id: SEED.ORG_HOLDING,
      legal_entity_id: SEED.ORG_HOLDING,
      storage_provider: 'supabase_storage',
      original_storage_key: `org_${SEED.ORG_HOLDING}/sources/${source_document_id}/t5-org-scope.pdf`,
      original_content_hash:
        '0000000000000000000000000000000000000000000000000000000000000000',
      original_byte_size: 1,
      original_filename: 't5-org-scope.pdf',
      mime_type: 'application/pdf',
      ingest_channel: 'drag_drop_pdf',
      ingest_batch_id,
      storage_status: 'available',
      received_at: new Date().toISOString(),
      created_by: SEED.USER_CONTROLLER,
    });
    if (sdErr) throw new Error(`source_doc insert: ${sdErr.message}`);

    const case_id = crypto.randomUUID();
    const { error: dcErr } = await db.from('document_cases').insert({
      id: case_id,
      org_id: SEED.ORG_HOLDING,
      document_type: 'unknown',
      state: 'received',
      trace_id,
      created_by: SEED.USER_CONTROLLER,
    });
    if (dcErr) throw new Error(`case insert: ${dcErr.message}`);

    const { error: djErr } = await db.from('document_jobs').insert({
      id: crypto.randomUUID(),
      org_id: SEED.ORG_HOLDING,
      source_document_id,
      document_case_id: case_id,
      ingest_batch_id,
      state: 'queued',
      trace_id,
      created_by: SEED.USER_CONTROLLER,
    });
    if (djErr) throw new Error(`job insert: ${djErr.message}`);

    // POSITIVE: in-org lookup resolves the case.
    const inOrg = await lookupDocumentCaseId(
      SEED.ORG_HOLDING,
      source_document_id,
    );
    expect(inOrg).toBe(case_id);

    // NEGATIVE: a foreign org looking up the same (UUID-unique)
    // source_document_id gets null by construction, not by
    // uniqueness accident.
    const crossOrg = await lookupDocumentCaseId(
      SEED.ORG_REAL_ESTATE,
      source_document_id,
    );
    expect(crossOrg).toBeNull();
  });
});
