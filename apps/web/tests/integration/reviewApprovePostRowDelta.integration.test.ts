// tests/integration/reviewApprovePostRowDelta.integration.test.ts
//
// Wave 6 D7 — the §5.1-direct POSITIVE ledger-row-delta test (build-plan
// §3 row: "the positive human-approve→post row-delta (non-vacuous
// post-D1); NOT the §3.3(b) auto-commit-zero negative"). First-class
// statement of the complete write-set of one human approval — the D3
// happy path asserts the JE delta in passing ("the D7 seam"); this file
// asserts the matrix exhaustively. TEST-ONLY: any failure here is a
// finding to STOP-and-surface, never code to fix under D7.
//
// The grounded write-set of one approve→post (every literal traced to
// disk at the T1 read-back):
//   +1 journal_entries  (human created_by; source_system='manual';
//                        source_external_id=`${caseId}:bill`)
//   +2 journal_lines    on the new JE — billService.post constructs
//                        [...drLines, crLine]: one DR per bill_line on
//                        the line's (expense) account + ONE aggregated
//                        CR on ap_control (billService.ts:308-315);
//                        single-line builder ⇒ exactly 2, balanced
//   +1 bills            (posted_journal_entry_id back-reference)
//   +1 bill_lines       on the new bill (buildPostBillInput emits one)
//   +1 evidence_objects (D5: subject=the bill, org-scoped)
//   +0 payments / +0 bill_payment_allocations — billService.post writes
//                        neither (those writes live in recordPayment)
//
// Counting note (grounded, surfaced at the read-back): journal_lines and
// bill_lines carry no org_id, so they are asserted at NEW-ROW grain
// (exactly 2 on the new JE / exactly 1 on the new bill — the only writer
// on this path) rather than org-scoped count deltas; the five org_id-
// bearing tables use org-scoped before/after deltas (the D3 jeCount
// precedent).

import { describe, it, expect, vi } from 'vitest';
import crypto from 'crypto';
import { adminClient, SEED } from '../setup/testDb';

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

/** Org-scoped row count for an org_id-bearing table. */
async function orgCount(table: string, pk: string): Promise<number> {
  const { count, error } = await db
    .from(table)
    .select(pk, { count: 'exact', head: true })
    .eq('org_id', SEED.ORG_HOLDING);
  if (error) throw new Error(`${table} count failed: ${error.message}`);
  return count ?? 0;
}

type Deltas = {
  journal_entries: number;
  bills: number;
  payments: number;
  bill_payment_allocations: number;
  evidence_objects: number;
};

async function snapshot(): Promise<Deltas> {
  return {
    journal_entries: await orgCount('journal_entries', 'journal_entry_id'),
    bills: await orgCount('bills', 'bill_id'),
    payments: await orgCount('payments', 'payment_id'),
    bill_payment_allocations: await orgCount(
      'bill_payment_allocations',
      'bill_payment_allocation_id',
    ),
    evidence_objects: await orgCount('evidence_objects', 'id'),
  };
}

function diff(before: Deltas, after: Deltas): Deltas {
  return {
    journal_entries: after.journal_entries - before.journal_entries,
    bills: after.bills - before.bills,
    payments: after.payments - before.payments,
    bill_payment_allocations:
      after.bill_payment_allocations - before.bill_payment_allocations,
    evidence_objects: after.evidence_objects - before.evidence_objects,
  };
}

// ---- the D3 T6 seeding harness ----

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
        original_filename: 'row-delta-d7.pdf',
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

  const { error: trErr } = await db.rpc('update_document_case_state_with_audit', {
    p_case_id: caseId,
    p_target_state: 'needs_review',
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
  return { sourceDocId: docId, caseId };
}

async function seedPostable(): Promise<{ caseId: string }> {
  const vendorId = crypto.randomUUID();
  const vendorName = `D7 row-delta ${RUN_SUFFIX}`;
  const { error } = await db.from('vendors').insert({
    vendor_id: vendorId,
    org_id: SEED.ORG_HOLDING,
    name: vendorName,
  });
  if (error) throw new Error(`vendor seed failed: ${error.message}`);

  const { sourceDocId, caseId } = await seedCase(SEED.ORG_HOLDING, 'needs_review');

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
      { text: `Invoice Number: INV-D7-${RUN_SUFFIX}` },
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
  return { caseId };
}

describe('Wave 6 D7: the positive human-approve→post ledger-row-delta (§5.1-direct)', () => {
  it('THE DELTA MATRIX: one approval writes exactly {+1 JE, +2 JL balanced, +1 bill, +1 bill_line, +1 evidence, +0 payments, +0 allocations}', async () => {
    mockOrgIds = [SEED.ORG_HOLDING];
    mockUserId = SEED.USER_CONTROLLER;
    const { caseId } = await seedPostable();

    const before = await snapshot();
    const res = await approvePost(...caseReq(SEED.ORG_HOLDING, caseId));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('posted');
    const after = await snapshot();

    // The org-scoped count deltas (the four org_id-bearing tables).
    expect(diff(before, after)).toEqual({
      journal_entries: 1,
      bills: 1,
      payments: 0,
      bill_payment_allocations: 0,
      evidence_objects: 1,
    });

    // ---- the new JE: attribution + dedup key (the D3 seam, restated
    // first-class) ----
    const { data: je } = await db
      .from('journal_entries')
      .select('journal_entry_id, created_by, source_system, source_external_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('source_external_id', `${caseId}:bill`)
      .single();
    expect(je).not.toBeNull();
    expect(je!.created_by).toBe(SEED.USER_CONTROLLER); // the HUMAN (INV-5)
    expect(je!.source_system).toBe('manual');
    expect(je!.journal_entry_id).toBe(body.journal_entry_id);

    // ---- exactly 2 journal_lines on the new JE, balanced at the
    // invoice amount (billService.post: [...drLines, crLine] — one DR
    // per bill_line + ONE aggregated CR ap_control; single-line builder
    // ⇒ 2). new-row grain (journal_lines carries no org_id). ----
    const { data: jls } = await db
      .from('journal_lines')
      .select('account_id, debit_amount, credit_amount')
      .eq('journal_entry_id', je!.journal_entry_id);
    expect(jls).toHaveLength(2);
    const drs = jls!.filter((l) => Number(l.debit_amount) > 0);
    const crs = jls!.filter((l) => Number(l.credit_amount) > 0);
    expect(drs).toHaveLength(1);
    expect(crs).toHaveLength(1);
    expect(Number(drs[0].debit_amount)).toBe(180);
    expect(Number(crs[0].credit_amount)).toBe(180); // balanced (INV-1 at the route grain)

    // DR on an expense account; CR on the AP-control (liability) — both
    // org-scoped reads (D4 owns WHICH expense account; here only the type).
    const { data: drAcct } = await db
      .from('chart_of_accounts')
      .select('account_type')
      .eq('account_id', drs[0].account_id)
      .eq('org_id', SEED.ORG_HOLDING)
      .single();
    expect(drAcct!.account_type).toBe('expense');
    const { data: crAcct } = await db
      .from('chart_of_accounts')
      .select('account_type, account_name')
      .eq('account_id', crs[0].account_id)
      .eq('org_id', SEED.ORG_HOLDING)
      .single();
    expect(crAcct!.account_type).toBe('liability');
    expect(crAcct!.account_name.toLowerCase()).toContain('accounts payable');

    // ---- the new bill: back-reference + exactly 1 bill_line at the
    // amount (new-row grain — bill_lines carries no org_id) ----
    const { data: bill } = await db
      .from('bills')
      .select('bill_id, posted_journal_entry_id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('posted_journal_entry_id', je!.journal_entry_id)
      .single();
    expect(bill).not.toBeNull();
    const { data: blines } = await db
      .from('bill_lines')
      .select('bill_line_id, amount_cad')
      .eq('bill_id', bill!.bill_id);
    expect(blines).toHaveLength(1);
    expect(Number(blines![0].amount_cad)).toBe(180);

    // ---- the evidence object: counted above; subject verified (D5
    // owns the persist semantics — this is the delta's identity, not a
    // re-verification) ----
    const { data: ev } = await db
      .from('evidence_objects')
      .select('id')
      .eq('org_id', SEED.ORG_HOLDING)
      .eq('subject_type', 'bill')
      .eq('subject_id', bill!.bill_id);
    expect(ev).toHaveLength(1);
  });

  it('THE ALL-ZERO IDEMPOTENCE DELTA: re-approving the committed case writes NOTHING (one approval = one write-set)', async () => {
    mockOrgIds = [SEED.ORG_HOLDING];
    mockUserId = SEED.USER_CONTROLLER;
    const { caseId } = await seedPostable();

    const first = await approvePost(...caseReq(SEED.ORG_HOLDING, caseId));
    expect(first.status).toBe(200);
    expect((await first.json()).status).toBe('posted');

    const before = await snapshot();
    const again = await approvePost(...caseReq(SEED.ORG_HOLDING, caseId));
    expect(again.status).toBe(200);
    expect((await again.json()).status).toBe('already_complete');
    const after = await snapshot();

    expect(diff(before, after)).toEqual({
      journal_entries: 0,
      bills: 0,
      payments: 0,
      bill_payment_allocations: 0,
      evidence_objects: 0,
    });
  });
});
