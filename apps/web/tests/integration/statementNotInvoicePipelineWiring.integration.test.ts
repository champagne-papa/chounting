// Board #4 Fork C handler #3 (statement-vs-invoice) — live-pipeline wiring.
//
// Proves route-uncertain-to-human fires BECAUSE the document classifies as
// vendor_invoice (Tier A matches /\bstatement\b/ as an invoice header —
// vendorInvoiceRules.ts:38) yet reads as a STATEMENT, under confident
// classification, and short-circuits the matcher. As in the bank-detail / dup
// wiring, status='parked_unposted' and needs_review are AMBIENT under Wave -1
// (an ordinary confident invoice already parks) and proposal_id is always null —
// so the DISCRIMINATORS are:
//   (1) exception_reason === 'statement_not_invoice_suspected' (length 1, open);
//   (2) the trace short-circuits after Stage 5 (match_vendor present; the
//       Stage 6/7 stage_names absent);
//   (3) a NEGATIVE CONTROL — a confident real invoice (no statement markers) runs
//       the full pipeline and emits no such reason (without it a scan that
//       silently never matches would pass green);
//   (4) an AND-WEAK GUARD case — a real invoice that mentions a statement but
//       carries its own single "Invoice #<n>" identity is NOT flagged and runs
//       the full pipeline (proves the presence-AND-weak-invoice-signal shape, not
//       bare presence);
//   (5) a BOTH-TRIP precedence case — a statement that ALSO carries payment
//       coordinates parks under bank_detail_change_suspected (bank-detail is
//       placed first and returns), NOT statement_not_invoice_suspected.
//
// SAFETY NOTE (mirrors the multi_invoice / semantic-dup / bank-detail branches):
// this asserts PARKING, not "auto-commit is off"; re-verify when governed
// auto-commit returns (ADR-0007 §Tier 2 Q78). DETECT-AND-ROUTE only: no OCR
// content is persisted into the exception.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { createMockInvokeSidecar } from '../fixtures/sidecar/mockSidecar';
import { __resetSegmentationBudgetForTests } from '@/agent/orchestrator/extraction/multiInvoiceExtractor';

vi.mock('@/services/storage/resolver', () => ({
  getStorageProvider: vi.fn(),
}));

vi.mock('@/agent/orchestrator/extraction/sidecar/client', () => ({
  invokeSidecar: vi.fn(),
}));

const { ingestDocument } = await import(
  '@/agent/orchestrator/extraction/ingestDocument'
);
const { getStorageProvider } = await import('@/services/storage/resolver');
const { invokeSidecar } = await import(
  '@/agent/orchestrator/extraction/sidecar/client'
);

const db = adminClient();

const VENDOR_NAME = 'Fork C Statement Test Vendor';
const INVOICE_NUMBER = '55501';

// Statement-shaped OCR: classifies vendor_invoice (contains "statement") and
// trips looksLikeStatementNotInvoice (statement-of-account + statement date +
// balance forward, and NO single LABELED "Invoice #<n>" identity). The bare
// "Invoice 12345" line-item is realistic statement content (a statement lists its
// invoices) and serves two purposes here: it lets Stage-4 Tier-A extraction pull
// a vendor_invoice_number (so extraction is Tier-A-SUFFICIENT → NO paid Tier-C
// call), and — being a pure-digit token — it does NOT trip looksMultiInvoice
// (which needs 2+ tokens carrying both a letter AND a digit). It is NOT a labeled
// identity, so the detector's AND-weak guard does not suppress the flag.
const STATEMENT_LINES = [
  { text: 'STATEMENT OF ACCOUNT', bbox: [0, 0, 100, 20], confidence: 0.95 },
  { text: `Vendor: ${VENDOR_NAME}`, bbox: [0, 20, 100, 40], confidence: 0.95 },
  { text: 'Statement Date: 2026-01-31', bbox: [0, 40, 100, 60], confidence: 0.95 },
  { text: 'Invoice 12345', bbox: [0, 60, 100, 80], confidence: 0.95 },
  { text: 'Balance Forward: $150.00', bbox: [0, 80, 100, 100], confidence: 0.95 },
  { text: 'Total Amount Due: $150.00', bbox: [0, 100, 100, 120], confidence: 0.95 },
];
// Confident real vendor invoice, NO statement markers (negative control).
const CLEAN_LINES = [
  { text: `Invoice #${INVOICE_NUMBER}`, bbox: [0, 0, 100, 20], confidence: 0.95 },
  { text: `Vendor: ${VENDOR_NAME}`, bbox: [0, 20, 100, 40], confidence: 0.95 },
  { text: 'Date: 2026-01-15', bbox: [0, 40, 100, 60], confidence: 0.95 },
  { text: 'Total: $123.45', bbox: [0, 60, 100, 80], confidence: 0.95 },
];
// AND-WEAK GUARD: statement markers present, BUT a strong single "Invoice #<n>"
// identity is present → NOT flagged (a real invoice referencing a statement).
const GUARD_LINES = [
  { text: `Invoice #${INVOICE_NUMBER}`, bbox: [0, 0, 100, 20], confidence: 0.95 },
  { text: 'Statement of Account summary enclosed', bbox: [0, 20, 100, 40], confidence: 0.95 },
  { text: `Vendor: ${VENDOR_NAME}`, bbox: [0, 40, 100, 60], confidence: 0.95 },
  { text: 'Date: 2026-01-15', bbox: [0, 60, 100, 80], confidence: 0.95 },
  { text: 'Balance Forward: $10.00', bbox: [0, 80, 100, 100], confidence: 0.95 },
  { text: 'Total: $500.00', bbox: [0, 100, 100, 120], confidence: 0.95 },
];
// BOTH-TRIP: statement markers + a labeled routing number. Both the statement and
// the bank-detail handler are eligible — bank-detail is placed first and returns.
// The bare "Invoice 12345" keeps Stage-4 extraction Tier-A-sufficient (no paid
// Tier-C call); "123456789" is pure digits (not a multi-invoice token).
const BOTH_TRIP_LINES = [
  { text: 'STATEMENT OF ACCOUNT', bbox: [0, 0, 100, 20], confidence: 0.95 },
  { text: `Vendor: ${VENDOR_NAME}`, bbox: [0, 20, 100, 40], confidence: 0.95 },
  { text: 'Statement Date: 2026-01-31', bbox: [0, 40, 100, 60], confidence: 0.95 },
  { text: 'Invoice 12345', bbox: [0, 60, 100, 80], confidence: 0.95 },
  { text: 'Total Amount Due: $150.00', bbox: [0, 80, 100, 100], confidence: 0.95 },
  { text: 'Routing number: 123456789', bbox: [0, 100, 100, 120], confidence: 0.95 },
];

function randomHash(): string {
  const chars = '0123456789abcdef';
  let h = '';
  for (let i = 0; i < 64; i++) h += chars[Math.floor(Math.random() * 16)];
  return h;
}

function setArtifact(
  lines: Array<{ text: string; bbox: number[]; confidence: number }>,
): void {
  vi.mocked(invokeSidecar).mockImplementation(
    createMockInvokeSidecar({ failureMode: null, artifactOverride: { lines } }),
  );
}

function makeFetchMock(): Mock {
  return vi.fn().mockResolvedValue({
    bytes: new TextEncoder().encode('stub bytes'),
    content_hash: 'stub-fetch-hash',
    provider: 'supabase_storage',
  });
}

async function seedSourceDocument(opts: {
  trace_id: string;
}): Promise<{ sourceDocId: string; caseId: string }> {
  const orgId = SEED.ORG_HOLDING;
  const batchId = crypto.randomUUID();
  const docId = crypto.randomUUID();
  const caseId = crypto.randomUUID();

  const batch = {
    id: batchId,
    org_id: orgId,
    ingest_channel: 'drag_drop_pdf',
    received_at: new Date().toISOString(),
    channel_metadata: {
      drop_session_id: crypto.randomUUID(),
      chat_session_id: crypto.randomUUID(),
      user_id: SEED.USER_CONTROLLER,
    },
    trace_id: opts.trace_id,
    created_at: new Date().toISOString(),
    created_by: SEED.USER_CONTROLLER,
  };
  const doc = {
    id: docId,
    org_id: orgId,
    legal_entity_id: orgId,
    storage_provider: 'supabase_storage',
    original_storage_key: `org_${orgId}/sources/test/${docId}.pdf`,
    original_content_hash: randomHash(),
    original_byte_size: 42,
    original_filename: 'statement-test.pdf',
    mime_type: 'application/pdf',
    ingest_channel: 'drag_drop_pdf',
    storage_status: 'available',
    received_at: new Date().toISOString(),
    created_by: SEED.USER_CONTROLLER,
    ingest_batch_id: batchId,
  };
  const caseRow = {
    id: caseId,
    org_id: orgId,
    document_type: 'unknown',
    state: 'received',
    trace_id: opts.trace_id,
    created_by: SEED.USER_CONTROLLER,
  };
  const job = {
    id: crypto.randomUUID(),
    org_id: orgId,
    source_document_id: docId,
    document_case_id: caseId,
    state: 'queued',
    trace_id: opts.trace_id,
    created_by: SEED.USER_CONTROLLER,
  };
  const audit = {
    org_id: orgId,
    user_id: SEED.USER_CONTROLLER,
    trace_id: opts.trace_id,
    action: 'ingest_batch_created',
    entity_type: 'ingest_batch',
    before_state: null,
    after_state_id: null,
    tool_name: null,
    idempotency_key: null,
    reason: null,
  };

  const { error } = await db.rpc(
    'create_ingest_batch_with_documents_with_audit',
    {
      p_batch: batch,
      p_documents: [doc],
      p_cases: [caseRow],
      p_case_sources: [],
      p_jobs: [job],
      p_audit: audit,
    },
  );
  if (error) throw new Error(`seed RPC failed: ${error.message}`);
  return { sourceDocId: docId, caseId };
}

async function seedVendor(): Promise<string> {
  const vendor_id = crypto.randomUUID();
  const { error } = await db.from('vendors').insert({
    vendor_id,
    org_id: SEED.ORG_HOLDING,
    name: VENDOR_NAME,
  });
  if (error) throw new Error(`vendor seed failed: ${error.message}`);
  return vendor_id;
}

// A live bill whose bill_number collides with the statement's extracted invoice
// number ('12345', from the bare "Invoice 12345" line) — makes the semantic-dup
// handler ALSO eligible, so the statement-vs-dup precedence test is meaningful.
async function seedBill(vendor_id: string, lifecycle_state: string): Promise<string> {
  const bill_id = crypto.randomUUID();
  const { error } = await db.from('bills').insert({
    bill_id,
    org_id: SEED.ORG_HOLDING,
    vendor_id,
    bill_number: '12345',
    issue_date: '2026-01-15',
    lifecycle_state,
    amount_cad: 150.0,
  });
  if (error) throw new Error(`bill seed failed: ${error.message}`);
  return bill_id;
}

// Seed a LIVE (created) primary_invoice link on a bill via the REAL RPC — the
// same write path billService.post uses (write-path fidelity). Makes the bill
// read as document-sourced → the dup handler's provenance gate would fire (see
// design §8.1) — used here to prove the statement handler wins anyway.
async function seedPrimaryInvoiceLink(sourceDocId: string, billId: string, trace_id: string): Promise<void> {
  const { error } = await db.rpc('create_source_document_link_with_audit', {
    p_link: { id: crypto.randomUUID(), source_document_id: sourceDocId, linked_entity_type: 'bill', linked_entity_id: billId, link_role: 'primary_invoice', trace_id, created_by: SEED.USER_CONTROLLER },
    p_audit: { user_id: SEED.USER_CONTROLLER, trace_id, action: 'source_document_link_created', entity_type: 'source_document_link', tool_name: null },
  });
  if (error) throw new Error(`link seed failed: ${error.message}`);
}

describe('Board #4 Fork C — statement handler wired into ingestDocument', () => {
  const traceIds: string[] = [];
  const billIds: string[] = [];
  let vendorId: string;

  beforeEach(async () => {
    __resetSegmentationBudgetForTests();
    (getStorageProvider as Mock).mockReturnValue({
      put: vi.fn(),
      fetch: makeFetchMock(),
    });
    vendorId = await seedVendor();
  });

  afterEach(async () => {
    for (const b of billIds) {
      await db.from('source_document_links').delete().eq('linked_entity_id', b);
    }
    billIds.length = 0;
    await db.from('bills').delete().eq('vendor_id', vendorId);
    await db.from('vendors').delete().eq('vendor_id', vendorId);
    for (const tid of traceIds) {
      await db.from('audit_log').delete().eq('trace_id', tid);
    }
    traceIds.length = 0;
  });

  it('confident vendor_invoice that reads as a STATEMENT → parks at needs_review with reason statement_not_invoice_suspected, short-circuiting before the matcher', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    setArtifact(STATEMENT_LINES);
    const { sourceDocId, caseId } = await seedSourceDocument({ trace_id });

    const result = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });

    expect(result.status).toBe('parked_unposted');
    expect(result.failure_class).toBeNull();

    // Discriminator 1 — the reason code (parked_unposted is ambient; this is not).
    const { data: exceptions } = await db
      .from('exception_queue_entries')
      .select('exception_reason, exception_status')
      .eq('document_case_id', caseId);
    expect(exceptions).toHaveLength(1);
    expect(exceptions![0].exception_reason).toBe('statement_not_invoice_suspected');
    expect(exceptions![0].exception_status).toBe('open');

    // Discriminator 2 — the trace short-circuited after Stage 5.
    const stages = result.pipeline_trace.map((r) => r.stage_name);
    expect(stages).toContain('match_vendor');
    expect(stages).not.toContain('match_against_existing_state');
    expect(stages).not.toContain('router_match_against_state');
    expect(stages).not.toContain('build_proposal');
  });

  it('NEGATIVE CONTROL — confident real invoice with NO statement markers → full pipeline runs, NO statement_not_invoice_suspected exception', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    setArtifact(CLEAN_LINES);
    const { sourceDocId, caseId } = await seedSourceDocument({ trace_id });

    const result = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });
    expect(result.failure_class).toBeNull();

    // The scan was genuinely reachable — the normal path ran to completion,
    // proving the tripwire's silence is a real no-match, not a degrade.
    const stages = result.pipeline_trace.map((r) => r.stage_name);
    expect(stages).toContain('match_against_existing_state');
    expect(stages).toContain('build_proposal');

    const { data: stmtExceptions } = await db
      .from('exception_queue_entries')
      .select('exception_reason')
      .eq('document_case_id', caseId)
      .eq('exception_reason', 'statement_not_invoice_suspected');
    expect(stmtExceptions).toHaveLength(0);
  });

  it('AND-WEAK GUARD — a real invoice that mentions a statement but carries its own single Invoice #<n> identity → NOT flagged, full pipeline runs', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    setArtifact(GUARD_LINES);
    const { sourceDocId, caseId } = await seedSourceDocument({ trace_id });

    const result = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });
    expect(result.failure_class).toBeNull();

    // The AND-weak guard suppressed the flag: the strong single-invoice identity
    // means this is a real invoice, so the full pipeline runs.
    const stages = result.pipeline_trace.map((r) => r.stage_name);
    expect(stages).toContain('match_against_existing_state');
    expect(stages).toContain('build_proposal');

    const { data: stmtExceptions } = await db
      .from('exception_queue_entries')
      .select('exception_reason')
      .eq('document_case_id', caseId)
      .eq('exception_reason', 'statement_not_invoice_suspected');
    expect(stmtExceptions).toHaveLength(0);
  });

  it('reprocess of an already-parked statement case → clean idempotent re-park, NOT a strand, still exactly one open exception', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    setArtifact(STATEMENT_LINES);
    const { sourceDocId, caseId } = await seedSourceDocument({ trace_id });

    const first = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });
    expect(first.status).toBe('parked_unposted');

    const trace_id2 = crypto.randomUUID();
    traceIds.push(trace_id2);
    const second = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id: trace_id2,
    });
    expect(second.status).toBe('parked_unposted');
    expect(second.failure_class).toBeNull();

    const { data: exceptions } = await db
      .from('exception_queue_entries')
      .select('exception_reason, exception_status')
      .eq('document_case_id', caseId);
    expect(exceptions).toHaveLength(1);
    expect(exceptions![0].exception_reason).toBe('statement_not_invoice_suspected');
    expect(exceptions![0].exception_status).toBe('open');
  });

  it('BOTH-TRIP precedence — a statement that ALSO carries payment coordinates parks under bank_detail_change_suspected (bank-detail placed first), NOT statement_not_invoice_suspected', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    setArtifact(BOTH_TRIP_LINES);
    const { sourceDocId, caseId } = await seedSourceDocument({ trace_id });

    const result = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });
    expect(result.status).toBe('parked_unposted');

    const { data: exceptions } = await db
      .from('exception_queue_entries')
      .select('exception_reason')
      .eq('document_case_id', caseId);
    expect(exceptions).toHaveLength(1);
    expect(exceptions![0].exception_reason).toBe('bank_detail_change_suspected');
  });

  it('PRECEDENCE — a statement that is ALSO a semantic duplicate (colliding live bill) parks under statement_not_invoice_suspected (placed before the dup handler), NOT duplicate_invoice_suspected', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    setArtifact(STATEMENT_LINES);
    const { sourceDocId, caseId } = await seedSourceDocument({ trace_id });
    // A live bill colliding on the extracted invoice number ('12345') makes the
    // semantic-dup handler ALSO eligible — but the statement handler is placed
    // first and returns, so it wins (a statement must not be dup-checked as a
    // bookable bill at all).
    await seedBill(vendorId, 'approved_for_payment');

    const result = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });
    expect(result.status).toBe('parked_unposted');

    const { data: exceptions } = await db
      .from('exception_queue_entries')
      .select('exception_reason')
      .eq('document_case_id', caseId);
    expect(exceptions).toHaveLength(1);
    expect(exceptions![0].exception_reason).toBe('statement_not_invoice_suspected');
  });

  it('COVERAGE — a statement that ALSO matches a live document-sourced bill still routes to statement_not_invoice_suspected (route-to-human is correct even when it would attach; head pointer deferred per design §4.2)', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    setArtifact(STATEMENT_LINES); // already carries the Vendor: line → vendorMatch genuinely resolves
    const { sourceDocId, caseId } = await seedSourceDocument({ trace_id });
    const billId = await seedBill(vendorId, 'approved_for_payment'); // bill_number === '12345', collides with the extracted invoice number
    billIds.push(billId);
    await seedPrimaryInvoiceLink(sourceDocId, billId, trace_id); // document-sourced ⇒ dup handler WOULD otherwise be eligible

    const result = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });
    expect(result.status).toBe('parked_unposted');
    const { data: exceptions } = await db
      .from('exception_queue_entries')
      .select('exception_reason')
      .eq('document_case_id', caseId);
    expect(exceptions).toHaveLength(1);
    expect(exceptions![0].exception_reason).toBe('statement_not_invoice_suspected');
  });
});
