// tests/integration/reviewApprovePostDefaultAccount.integration.test.ts
//
// Wave 6 D4 T1 — matched-rule default_account_id consumption at
// buildPostBillInput (brief D-1…D-6; decomposition T1). Additive
// sibling to reviewApprovePost.integration.test.ts — the D3 suite
// stays byte-unchanged (decomposition ask (b)).
//
// Line-by-line read-back targets:
//   1. Happy path: approved/active rule with an in-org active expense
//      default_account_id → the posted bill line carries the RULE
//      account (resolution path actually exercised — rules seeded WITH
//      the account, advisor carry-in (i)).
//   2. Cross-org IDOR-negative (advisor carry-in (ii)): the rule's
//      account points at a foreign org → D-3 validation fails →
//      fallback; the foreign account id appears NOWHERE in the posted
//      entry (bill_lines + journal_lines).
//   3. Determinism: two active rules across bundle_type → the
//      enum-order winner (born_paid_bill) posts; rule_id secondary is
//      unreachable from a valid seed (uniqueness key) — not tested.
//
// Fallback matrix (each → byte-equivalent default = first expense
// account, post succeeds): no rule / proposed-only / active+null /
// cross-org / non-expense / inactive.
//
// Harness: the D3 T6 pattern — buildServiceContext vi.mock, seed RPC,
// Tier-A-extractable OCR artifact, exact-name vendor. The baseline
// (no-rule) test runs FIRST and captures the observed default account;
// later tests guard ruleAccount !== observedDefault so the happy-path
// assertion cannot false-pass on an accidental collision.
// JE/JL append-only — no JE cleanup; rules/vendors cleaned; COA test
// accounts best-effort deleted (posted-line-referenced rows stay).

import { describe, it, expect, vi, afterAll } from 'vitest';
import crypto from 'crypto';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { ruleCreationOrchestrator } from '@/services/rules/ruleCreationOrchestrator';
import { vendorRuleService } from '@/services/rules/vendorRuleService';
import type { Database } from '@/db/types';

type BundleType = Database['public']['Enums']['bundle_type'];

const RUN_SUFFIX = crypto.randomUUID().slice(0, 8);

let mockOrgIds: string[] = [SEED.ORG_HOLDING];
let mockUserId: string = SEED.USER_CONTROLLER;

vi.mock('@/services/middleware/serviceContext', async () => {
  const actual = await vi.importActual<
    typeof import('@/services/middleware/serviceContext')
  >('@/services/middleware/serviceContext');
  return {
    ...actual,
    buildServiceContext: vi.fn(async () => ({
      trace_id: crypto.randomUUID(),
      caller: {
        user_id: mockUserId,
        email: 'controller@thebridge.local',
        verified: true as const,
        org_ids: mockOrgIds,
      },
      locale: 'en' as const,
    })),
  };
});

const { POST: approvePost } = await import(
  '@/app/api/orgs/[orgId]/review/cases/[caseId]/approve-post/route'
);

const db = adminClient();
const svcCtx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });

const createdRuleIds: string[] = [];
const createdVendorIds: string[] = [];
const createdAccountIds: string[] = [];
let accountSeq = 0;

function caseReq(
  orgId: string,
  caseId: string,
): [Request, { params: Promise<{ orgId: string; caseId: string }> }] {
  return [
    new Request(
      `http://localhost/api/orgs/${orgId}/review/cases/${caseId}/approve-post`,
      { method: 'POST', headers: { 'content-type': 'application/json' } },
    ),
    { params: Promise.resolve({ orgId, caseId }) },
  ];
}

async function seedCase(orgId: string, state: string): Promise<{ sourceDocId: string; caseId: string }> {
  const trace_id = crypto.randomUUID();
  const batchId = crypto.randomUUID();
  const docId = crypto.randomUUID();
  const caseId = crypto.randomUUID();
  const { error } = await db.rpc('create_ingest_batch_with_documents_with_audit', {
    p_batch: {
      id: batchId,
      org_id: orgId,
      ingest_channel: 'drag_drop_pdf',
      received_at: new Date().toISOString(),
      channel_metadata: {
        drop_session_id: crypto.randomUUID(),
        chat_session_id: crypto.randomUUID(),
        user_id: SEED.USER_CONTROLLER,
      },
      trace_id,
      created_at: new Date().toISOString(),
      created_by: SEED.USER_CONTROLLER,
    },
    p_documents: [
      {
        id: docId,
        org_id: orgId,
        legal_entity_id: orgId,
        storage_provider: 'supabase_storage',
        original_storage_key: `org_${orgId}/sources/test/${docId}.pdf`,
        original_content_hash: crypto
          .createHash('sha256')
          .update(crypto.randomUUID())
          .digest('hex'),
        original_byte_size: 42,
        original_filename: 'approve-post-d4.pdf',
        mime_type: 'application/pdf',
        ingest_channel: 'drag_drop_pdf',
        storage_status: 'available',
        received_at: new Date().toISOString(),
        created_by: SEED.USER_CONTROLLER,
        ingest_batch_id: batchId,
      },
    ],
    p_cases: [
      {
        id: caseId,
        org_id: orgId,
        document_type: 'vendor_invoice',
        state: 'received',
        trace_id,
        created_by: SEED.USER_CONTROLLER,
      },
    ],
    p_case_sources: [],
    p_jobs: [
      {
        id: crypto.randomUUID(),
        org_id: orgId,
        source_document_id: docId,
        document_case_id: caseId,
        state: 'queued',
        trace_id,
        created_by: SEED.USER_CONTROLLER,
      },
    ],
    p_audit: {
      org_id: orgId,
      user_id: SEED.USER_CONTROLLER,
      trace_id,
      action: 'ingest_batch_created',
      entity_type: 'ingest_batch',
      before_state: null,
      after_state_id: null,
      tool_name: null,
      idempotency_key: null,
      reason: null,
    },
  });
  if (error) throw new Error(`seed RPC failed: ${error.message}`);

  if (state !== 'received') {
    const { error: trErr } = await db.rpc('update_document_case_state_with_audit', {
      p_case_id: caseId,
      p_target_state: state,
      p_audit: {
        org_id: orgId,
        user_id: SEED.USER_CONTROLLER,
        trace_id,
        action: 'document_case_transitioned',
        entity_type: 'document_case',
        tool_name: null,
        reason: null,
      },
    });
    if (trErr) throw new Error(`seed state hop failed: ${trErr.message}`);
  }
  return { sourceDocId: docId, caseId };
}

async function seedArtifact(sourceDocId: string, vendorName: string): Promise<void> {
  const ocrRunId = crypto.randomUUID();
  const { error: ocrErr } = await db.from('ocr_runs').insert({
    id: ocrRunId,
    source_document_id: sourceDocId,
    supersedes_ocr_run_id: null,
    created_by: 'agent',
  });
  if (ocrErr) throw new Error(`ocr_run seed failed: ${ocrErr.message}`);
  const extractionRunId = crypto.randomUUID();
  const { error: extErr } = await db.from('extraction_runs').insert({
    id: extractionRunId,
    source_document_id: sourceDocId,
    ocr_run_id: ocrRunId,
    extraction_version: 'v1',
    created_by: 'agent',
  });
  if (extErr) throw new Error(`extraction_run seed failed: ${extErr.message}`);
  const { error: artErr } = await db.from('document_artifacts').insert({
    id: crypto.randomUUID(),
    source_document_id: sourceDocId,
    ocr_run_id: ocrRunId,
    extraction_run_id: extractionRunId,
    engine: 'paddleocr',
    engine_version: '2.7.0',
    pages: [],
    lines: [
      { text: `Vendor: ${vendorName}` },
      { text: `Invoice Number: INV-D4-${RUN_SUFFIX}` },
      { text: 'Date: 2026-06-04' },
      { text: 'Total Due: $180.00' },
      { text: 'CAD' },
    ],
    words: [],
    quality_flags: [],
    pipeline_trace: [],
    confidence: 0.9,
  });
  if (artErr) throw new Error(`artifact seed failed: ${artErr.message}`);
}

async function seedVendor(label: string): Promise<{ vendorId: string; vendorName: string }> {
  const vendorId = crypto.randomUUID();
  const vendorName = `D4 ${label} ${RUN_SUFFIX}`;
  createdVendorIds.push(vendorId);
  const { error } = await db.from('vendors').insert({
    vendor_id: vendorId,
    org_id: SEED.ORG_HOLDING,
    name: vendorName,
  });
  if (error) throw new Error(`vendor seed failed: ${error.message}`);
  return { vendorId, vendorName };
}

async function seedAccount(opts: {
  org_id: string;
  account_type: string;
  is_active: boolean;
}): Promise<string> {
  const accountId = crypto.randomUUID();
  accountSeq += 1;
  createdAccountIds.push(accountId);
  const { error } = await db.from('chart_of_accounts').insert({
    account_id: accountId,
    org_id: opts.org_id,
    account_code: `D4-${RUN_SUFFIX}-${accountSeq}`,
    account_name: `D4 test account ${RUN_SUFFIX}-${accountSeq}`,
    account_type: opts.account_type,
    is_active: opts.is_active,
  });
  if (error) throw new Error(`account seed failed: ${error.message}`);
  return accountId;
}

async function seedRule(opts: {
  vendorId: string;
  defaultAccountId: string | null;
  approve: boolean;
  bundleType?: BundleType;
}): Promise<string> {
  const res = await ruleCreationOrchestrator.createVendorRule(
    {
      org_id: SEED.ORG_HOLDING,
      vendor_id: opts.vendorId,
      bundle_type: opts.bundleType ?? 'born_paid_bill',
      default_account_id: opts.defaultAccountId,
    },
    svcCtx,
  );
  createdRuleIds.push(res.rule_id);
  if (opts.approve) {
    await vendorRuleService.approve(
      { org_id: SEED.ORG_HOLDING, rule_id: res.rule_id },
      svcCtx,
    );
  }
  return res.rule_id;
}

/** Seed vendor (+ optional rules) + postable case, fire approve→post,
 *  return the posted bill line account + all JE line accounts. */
async function postScenario(label: string, rules: Array<{
  defaultAccountId: string | null;
  approve: boolean;
  bundleType?: BundleType;
}>): Promise<{ caseId: string; billLineAccountId: string; journalLineAccountIds: string[] }> {
  mockOrgIds = [SEED.ORG_HOLDING];
  mockUserId = SEED.USER_CONTROLLER;
  const { vendorId, vendorName } = await seedVendor(label);
  for (const r of rules) await seedRule({ vendorId, ...r });
  const { sourceDocId, caseId } = await seedCase(SEED.ORG_HOLDING, 'needs_review');
  await seedArtifact(sourceDocId, vendorName);

  const res = await approvePost(...caseReq(SEED.ORG_HOLDING, caseId));
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.status).toBe('posted');

  const { data: je, error: jeErr } = await db
    .from('journal_entries')
    .select('journal_entry_id')
    .eq('org_id', SEED.ORG_HOLDING)
    .eq('source_external_id', `${caseId}:bill`)
    .single();
  if (jeErr || !je) throw new Error(`posted JE lookup failed: ${jeErr?.message}`);

  const { data: bill, error: billErr } = await db
    .from('bills')
    .select('bill_id')
    .eq('posted_journal_entry_id', je.journal_entry_id)
    .single();
  if (billErr || !bill) throw new Error(`posted bill lookup failed: ${billErr?.message}`);

  const { data: lines, error: lineErr } = await db
    .from('bill_lines')
    .select('account_id')
    .eq('bill_id', bill.bill_id);
  if (lineErr || !lines || lines.length !== 1) {
    throw new Error(`bill_lines lookup failed: ${lineErr?.message ?? `count=${lines?.length}`}`);
  }

  const { data: jLines, error: jlErr } = await db
    .from('journal_lines')
    .select('account_id')
    .eq('journal_entry_id', je.journal_entry_id);
  if (jlErr || !jLines) throw new Error(`journal_lines lookup failed: ${jlErr?.message}`);

  return {
    caseId,
    billLineAccountId: lines[0].account_id as string,
    journalLineAccountIds: jLines.map((l) => l.account_id as string),
  };
}

afterAll(async () => {
  if (createdRuleIds.length > 0) {
    await db.from('rule_registry').delete().in('id', createdRuleIds);
  }
  if (createdVendorIds.length > 0) {
    await db.from('vendors').delete().in('vendor_id', createdVendorIds);
  }
  // Best-effort: posted-line-referenced accounts will FK-block — swallow.
  for (const id of createdAccountIds) {
    await db.from('chart_of_accounts').delete().eq('account_id', id);
  }
});

// Captured by the baseline test (runs first); the discriminator guard
// for every later assertion.
let observedDefaultAccountId: string;

describe('Wave 6 D4 T1: matched-rule default_account_id consumption', () => {
  it('BASELINE (no rule): posts on the org default expense account — captures the discriminator', async () => {
    const { billLineAccountId } = await postScenario('baseline', []);
    observedDefaultAccountId = billLineAccountId;

    const { data: acct } = await db
      .from('chart_of_accounts')
      .select('org_id, account_type')
      .eq('account_id', billLineAccountId)
      .single();
    expect(acct!.org_id).toBe(SEED.ORG_HOLDING);
    expect(acct!.account_type).toBe('expense');
  });

  it('HAPPY PATH (read-back target 1): active rule with in-org active expense account → bill line carries the RULE account', async () => {
    const ruleAccount = await seedAccount({
      org_id: SEED.ORG_HOLDING,
      account_type: 'expense',
      is_active: true,
    });
    // Discriminator guard: a collision here would make the assertion
    // vacuous — fail loudly instead.
    expect(ruleAccount).not.toBe(observedDefaultAccountId);

    const { billLineAccountId, journalLineAccountIds } = await postScenario(
      'happy',
      [{ defaultAccountId: ruleAccount, approve: true }],
    );
    expect(billLineAccountId).toBe(ruleAccount);
    expect(journalLineAccountIds).toContain(ruleAccount);
  });

  it('FALLBACK: rule exists but is proposed-only (ceremony not run) → default account', async () => {
    const ruleAccount = await seedAccount({
      org_id: SEED.ORG_HOLDING,
      account_type: 'expense',
      is_active: true,
    });
    const { billLineAccountId } = await postScenario('proposed-only', [
      { defaultAccountId: ruleAccount, approve: false },
    ]);
    expect(billLineAccountId).toBe(observedDefaultAccountId);
  });

  it('FALLBACK: active rule with NULL default_account_id → default account', async () => {
    const { billLineAccountId } = await postScenario('null-account', [
      { defaultAccountId: null, approve: true },
    ]);
    expect(billLineAccountId).toBe(observedDefaultAccountId);
  });

  it('IDOR-NEGATIVE (read-back target 2): rule account belongs to a FOREIGN org → fallback; foreign id appears NOWHERE in the posted entry', async () => {
    const foreignAccount = await seedAccount({
      org_id: SEED.ORG_REAL_ESTATE,
      account_type: 'expense',
      is_active: true,
    });
    const { billLineAccountId, journalLineAccountIds } = await postScenario(
      'cross-org',
      [{ defaultAccountId: foreignAccount, approve: true }],
    );
    expect(billLineAccountId).toBe(observedDefaultAccountId);
    expect(billLineAccountId).not.toBe(foreignAccount);
    expect(journalLineAccountIds).not.toContain(foreignAccount);
  });

  it('FALLBACK: rule account is non-expense (asset) → default account', async () => {
    const assetAccount = await seedAccount({
      org_id: SEED.ORG_HOLDING,
      account_type: 'asset',
      is_active: true,
    });
    const { billLineAccountId } = await postScenario('non-expense', [
      { defaultAccountId: assetAccount, approve: true },
    ]);
    expect(billLineAccountId).toBe(observedDefaultAccountId);
  });

  it('FALLBACK: rule account is inactive → default account', async () => {
    const inactiveAccount = await seedAccount({
      org_id: SEED.ORG_HOLDING,
      account_type: 'expense',
      is_active: false,
    });
    const { billLineAccountId } = await postScenario('inactive', [
      { defaultAccountId: inactiveAccount, approve: true },
    ]);
    expect(billLineAccountId).toBe(observedDefaultAccountId);
  });

  it('DETERMINISM (read-back target 3): two active rules across bundle_type → the enum-order winner (born_paid_bill) posts', async () => {
    const accountA = await seedAccount({
      org_id: SEED.ORG_HOLDING,
      account_type: 'expense',
      is_active: true,
    });
    const accountB = await seedAccount({
      org_id: SEED.ORG_HOLDING,
      account_type: 'expense',
      is_active: true,
    });
    expect(accountA).not.toBe(accountB);
    expect(accountA).not.toBe(observedDefaultAccountId);

    const { billLineAccountId } = await postScenario('determinism', [
      // Seeded in REVERSE enum order so the result proves sorting, not
      // insertion order.
      {
        defaultAccountId: accountB,
        approve: true,
        bundleType: 'final_invoice_with_applied_deposit',
      },
      { defaultAccountId: accountA, approve: true, bundleType: 'born_paid_bill' },
    ]);
    expect(billLineAccountId).toBe(accountA);
  });
});
