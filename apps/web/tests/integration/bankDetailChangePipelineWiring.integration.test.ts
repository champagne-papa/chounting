// Board #4 Fork C handler #2 (bank-detail / remittance) — live-pipeline wiring.
//
// Proves route-uncertain-to-human fires BECAUSE the document carries
// payment-coordinate-shaped content, under confident extraction, and short-
// circuits the matcher. As in the semantic-dup wiring, status='parked_unposted'
// and needs_review are AMBIENT under Wave -1 (an ordinary confident invoice
// already parks), and proposal_id is always null — so the DISCRIMINATORS are:
//   (1) exception_reason === 'bank_detail_change_suspected' (length 1, open);
//   (2) the trace short-circuits after Stage 5 (match_vendor present; the
//       Stage 6/7 stage_names absent);
//   (3) a NEGATIVE CONTROL — a confident vendor invoice with NO payment
//       coordinates runs the full pipeline and emits no such reason (without it
//       a scan that silently never matches would pass green);
//   (4) a BOTH-TRIP case — a document that is a semantic duplicate AND carries
//       coordinates parks under bank_detail_change_suspected, NOT
//       duplicate_invoice_suspected, since the bank-detail handler is placed
//       first and returns.
//
// SAFETY NOTE (mirrors the multi_invoice / semantic-dup branches): this asserts
// PARKING, not "auto-commit is off"; re-verify when governed auto-commit returns
// (ADR-0007 §Tier 2 Q78). The handler is DETECT-AND-ROUTE only: it stores no
// coordinates — this test asserts the exception carries only the reason code.

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

const VENDOR_NAME = 'Fork C Bank Detail Test Vendor';
const INVOICE_NUMBER = '12345';
// A labeled routing number → looksLikeBankDetailPresent fires. '123456789' is
// digit-only, so it is not a multi-invoice token; the single path runs.
const BANK_LINE = 'Routing number: 123456789';

// Confident vendor_invoice OCR WITH a payment-coordinate line.
const COORD_LINES = [
  { text: `Invoice #${INVOICE_NUMBER}`, bbox: [0, 0, 100, 20], confidence: 0.95 },
  { text: 'Date: 2026-01-15', bbox: [0, 20, 100, 40], confidence: 0.95 },
  { text: 'Total: $123.45', bbox: [0, 40, 100, 60], confidence: 0.95 },
  { text: BANK_LINE, bbox: [0, 60, 100, 80], confidence: 0.95 },
];
// Confident vendor_invoice OCR with NO payment coordinates (negative control).
const CLEAN_LINES = [
  { text: `Invoice #${INVOICE_NUMBER}`, bbox: [0, 0, 100, 20], confidence: 0.95 },
  { text: 'Date: 2026-01-15', bbox: [0, 20, 100, 40], confidence: 0.95 },
  { text: 'Total: $123.45', bbox: [0, 40, 100, 60], confidence: 0.95 },
];
// Both-trip: coordinates + a labeled vendor (so vendorMatch resolves) + the
// invoice number (so a colliding live bill makes the semantic-dup handler also
// eligible). The bank-detail handler is placed first and returns, so it wins.
const BOTH_TRIP_LINES = [
  { text: `Invoice #${INVOICE_NUMBER}`, bbox: [0, 0, 100, 20], confidence: 0.95 },
  { text: `Vendor: ${VENDOR_NAME}`, bbox: [0, 20, 100, 40], confidence: 0.95 },
  { text: 'Date: 2026-01-15', bbox: [0, 40, 100, 60], confidence: 0.95 },
  { text: 'Total: $123.45', bbox: [0, 60, 100, 80], confidence: 0.95 },
  { text: BANK_LINE, bbox: [0, 80, 100, 100], confidence: 0.95 },
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
    original_filename: 'bank-detail-test.pdf',
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

async function seedBill(vendor_id: string, lifecycle_state: string): Promise<string> {
  const bill_id = crypto.randomUUID();
  const { error } = await db.from('bills').insert({
    bill_id,
    org_id: SEED.ORG_HOLDING,
    vendor_id,
    bill_number: INVOICE_NUMBER,
    issue_date: '2026-01-15',
    lifecycle_state,
    amount_cad: 123.45,
  });
  if (error) throw new Error(`bill seed failed: ${error.message}`);
  return bill_id;
}

describe('Board #4 Fork C — bank-detail handler wired into ingestDocument', () => {
  const traceIds: string[] = [];
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
    await db.from('bills').delete().eq('vendor_id', vendorId);
    await db.from('vendors').delete().eq('vendor_id', vendorId);
    for (const tid of traceIds) {
      await db.from('audit_log').delete().eq('trace_id', tid);
    }
    traceIds.length = 0;
  });

  it('confident vendor invoice carrying payment coordinates → parks at needs_review with reason bank_detail_change_suspected, short-circuiting before the matcher, exception carries no coordinates', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    setArtifact(COORD_LINES);
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
      .select('exception_reason, exception_status, source_document_id')
      .eq('document_case_id', caseId);
    expect(exceptions).toHaveLength(1);
    expect(exceptions![0].exception_reason).toBe('bank_detail_change_suspected');
    expect(exceptions![0].exception_status).toBe('open');
    // Detect-and-route: the exception row carries no detected coordinates —
    // only the case/source/reason/trace shape every enqueue has.
    expect(JSON.stringify(exceptions![0])).not.toContain('123456789');

    // Discriminator 2 — the trace short-circuited after Stage 5.
    const stages = result.pipeline_trace.map((r) => r.stage_name);
    expect(stages).toContain('match_vendor');
    expect(stages).not.toContain('match_against_existing_state');
    expect(stages).not.toContain('router_match_against_state');
    expect(stages).not.toContain('build_proposal');
  });

  it('NEGATIVE CONTROL — confident vendor invoice with NO payment coordinates → full pipeline runs, NO bank_detail_change_suspected exception', async () => {
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

    // The scan was genuinely reachable and confident enough to run the normal
    // path (proving the tripwire's silence is a real no-match, not a degrade).
    const stages = result.pipeline_trace.map((r) => r.stage_name);
    expect(stages).toContain('match_against_existing_state');
    expect(stages).toContain('build_proposal');

    const { data: bankExceptions } = await db
      .from('exception_queue_entries')
      .select('exception_reason')
      .eq('document_case_id', caseId)
      .eq('exception_reason', 'bank_detail_change_suspected');
    expect(bankExceptions).toHaveLength(0);
  });

  it('reprocess of an already-parked bank-detail case → clean idempotent re-park, NOT a strand, still exactly one open exception', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    setArtifact(COORD_LINES);
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
    expect(exceptions![0].exception_reason).toBe('bank_detail_change_suspected');
    expect(exceptions![0].exception_status).toBe('open');
  });

  it('BOTH-TRIP precedence — a semantic duplicate that ALSO carries payment coordinates parks under bank_detail_change_suspected (placed first), NOT duplicate_invoice_suspected', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    setArtifact(BOTH_TRIP_LINES);
    const { sourceDocId, caseId } = await seedSourceDocument({ trace_id });
    // A colliding live bill makes the semantic-dup handler ALSO eligible — but
    // the bank-detail handler is placed first and returns, so it wins.
    await seedBill(vendorId, 'fully_paid');

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
});
