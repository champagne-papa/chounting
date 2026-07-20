// Board #4 Fork C handler #1 (semantic-duplicate) — live-pipeline wiring.
//
// Proves route-uncertain-to-human fires BECAUSE of a duplicate, under extraction
// confident enough to otherwise proceed to the matcher. Under the Wave -1
// bleed-stop an ordinary confident vendor invoice ALREADY parks at needs_review
// (see multiInvoicePipelineWiring test 4: golden single path, all 9 stages,
// status='parked_unposted'). So `status==='parked_unposted'` and the case being
// at needs_review are AMBIENT — they would pass with the handler deleted; so is
// proposal_id (all 7 ingestDocument returns are proposal_id:null under Wave -1)
// and "no bill written" (the commit composites are dead behind the bleed-stop).
// The DISCRIMINATORS are:
//   (1) exception_reason === 'duplicate_invoice_suspected' (length 1, open);
//   (2) the trace short-circuits after Stage 5 — match_vendor present, the
//       Stage 6/7 stage_names (match_against_existing_state / router_match_
//       against_state / build_proposal) absent;
//   (3) a NEGATIVE CONTROL with the SAME confident extraction and NO colliding
//       bill runs the full trace and emits no duplicate reason — proving the
//       extraction was genuinely confident enough to run the normal path.
//
// The colliding bill is seeded FULLY_PAID on purpose: that state is invisible to
// loadOpenBillsForVendor's {approved_for_payment, partially_paid} filter, so the
// handler catches a duplicate the existing matcher structurally cannot see — and
// it is the worst double-pay case.
//
// SAFETY NOTE (mirrors the multi_invoice branch): this asserts PARKING, not
// "auto-commit is off". The never-mis-post guarantee rests partly on the Wave -1
// bleed-stop and MUST be re-verified when governed auto-commit returns post-V1
// (ADR-0007 §Tier 2 Q78) — the same fix-before-measuring thread as the
// scoring-bug finding.

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

// Distinctive vendor name (no mixed-alphanumeric 6+ token → looksMultiInvoice
// stays false; distinctive → matchVendor resolves it unambiguously).
const VENDOR_NAME = 'Fork C Duplicate Test Vendor';
const INVOICE_NUMBER = '12345';

// Confident single vendor-invoice OCR. Tier A extracts:
//   vendor_invoice_number = '12345'  ('Invoice #12345', INVOICE_NUMBER_PATTERNS)
//   vendor_name = VENDOR_NAME        (LABELED 'Vendor:' line — Tier A reads only
//                                     sender-labeled names, not bare letterhead)
//   amount = 123.45, accounting_date = 2026-01-15.
// '12345' is digit-only (no letter) → not a multi-invoice token → single path.
const CONFIDENT_LINES = [
  { text: `Invoice #${INVOICE_NUMBER}`, bbox: [0, 0, 100, 20], confidence: 0.95 },
  { text: `Vendor: ${VENDOR_NAME}`, bbox: [0, 20, 100, 40], confidence: 0.95 },
  { text: 'Date: 2026-01-15', bbox: [0, 40, 100, 60], confidence: 0.95 },
  { text: 'Total: $123.45', bbox: [0, 60, 100, 80], confidence: 0.95 },
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

// Seeds batch + source_document + document_case (state='received') + job via the
// chunk 6.1 RPC (mirrors multiInvoicePipelineWiring's seedSourceDocument).
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
    original_filename: 'semantic-dup-test.pdf',
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

async function seedBill(
  vendor_id: string,
  lifecycle_state: string,
): Promise<string> {
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

describe('Board #4 Fork C — semantic-duplicate handler wired into ingestDocument', () => {
  const traceIds: string[] = [];
  let vendorId: string;

  beforeEach(async () => {
    __resetSegmentationBudgetForTests();
    (getStorageProvider as Mock).mockReturnValue({
      put: vi.fn(),
      fetch: makeFetchMock(),
    });
    setArtifact(CONFIDENT_LINES);
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

  it('confident extraction + a live (fully_paid) bill with the same (vendor, number) → parks at needs_review with reason duplicate_invoice_suspected, short-circuiting before the matcher', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    const { sourceDocId, caseId } = await seedSourceDocument({ trace_id });
    // fully_paid: invisible to loadOpenBillsForVendor — proves the handler
    // catches a duplicate the existing matcher structurally cannot see.
    await seedBill(vendorId, 'fully_paid');

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
    expect(exceptions![0].exception_reason).toBe('duplicate_invoice_suspected');
    expect(exceptions![0].exception_status).toBe('open');

    // Discriminator 2 — the trace short-circuited after Stage 5: match_vendor ran,
    // but the Stage 6/7 records are absent (the handler fired before the matcher).
    const stages = result.pipeline_trace.map((r) => r.stage_name);
    expect(stages).toContain('match_vendor');
    expect(stages).not.toContain('match_against_existing_state');
    expect(stages).not.toContain('router_match_against_state');
    expect(stages).not.toContain('build_proposal');
  });

  it('NEGATIVE CONTROL — same confident extraction + matched vendor but NO colliding bill → full pipeline runs (matcher + proposal), NO duplicate_invoice_suspected exception', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    const { sourceDocId, caseId } = await seedSourceDocument({ trace_id });
    // No bill seeded — the handler must NOT fire, and the normal path must run.

    const result = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });

    expect(result.failure_class).toBeNull();

    // Proves the extraction was confident enough to run the normal path (the
    // "under confident extraction" clause): the matcher + proposal stages ran —
    // the exact stages the positive case short-circuits.
    const stages = result.pipeline_trace.map((r) => r.stage_name);
    expect(stages).toContain('match_against_existing_state');
    expect(stages).toContain('build_proposal');

    // No duplicate reason emitted. (A branch-c unmatched_router_candidate may
    // exist — vendor matched, N=0 open bills — so scope to the dup reason only.)
    const { data: dupExceptions } = await db
      .from('exception_queue_entries')
      .select('exception_reason')
      .eq('document_case_id', caseId)
      .eq('exception_reason', 'duplicate_invoice_suspected');
    expect(dupExceptions).toHaveLength(0);
  });

  it('reprocess of an already-parked duplicate → clean idempotent re-park (advance no-ops at needs_review, enqueue swallows EXCEPTION_ALREADY_OPEN), NOT a strand, still exactly one open exception', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    const { sourceDocId, caseId } = await seedSourceDocument({ trace_id });
    await seedBill(vendorId, 'fully_paid');

    // First ingest → parks as duplicate_invoice_suspected (case → needs_review).
    const first = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });
    expect(first.status).toBe('parked_unposted');

    // Reprocess the SAME source_document with a fresh trace: the case is now at
    // needs_review with an open exception, and Stage-0 dedup excludes self so the
    // stages re-run and reach the handler. This is the exact reprocess path the
    // advisor flagged — the pre-enqueue advance must NOT strand a needs_review
    // case. (advanceCaseAutomation is a no-op at/past target; the re-enqueue
    // throws EXCEPTION_ALREADY_OPEN and is caught.)
    const trace_id2 = crypto.randomUUID();
    traceIds.push(trace_id2);
    const second = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id: trace_id2,
    });
    expect(second.status).toBe('parked_unposted');
    expect(second.failure_class).toBeNull(); // NOT a pipeline_failed strand.

    // Still exactly ONE open exception — no double-enqueue, no strand.
    const { data: exceptions } = await db
      .from('exception_queue_entries')
      .select('exception_reason, exception_status')
      .eq('document_case_id', caseId);
    expect(exceptions).toHaveLength(1);
    expect(exceptions![0].exception_reason).toBe('duplicate_invoice_suspected');
    expect(exceptions![0].exception_status).toBe('open');
  });

  it('guard arm — confident vendor_invoice + a colliding bill but an UNMATCHED vendor → handler does NOT fire (vendorMatch.vendor_id guard), full pipeline runs', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    // Golden vendor_invoice OCR with a BARE vendor line (no 'Vendor:' label) →
    // Tier A extracts the invoice number but NO vendor_name → matchVendor returns
    // no match → vendorMatch.vendor_id is null, so the guard keeps the handler
    // silent even though a colliding bill exists. Stays in Tier A (no Claude
    // call — unlike a receipt, which classifies via Tier C). This exercises a
    // no-fire arm of the guard triple; the documentType arm reads plainly and is
    // belt-and-braces with the invoice-number arm for non-invoice types (and can
    // only be driven through a Tier-C classification, i.e. a paid call).
    setArtifact([
      { text: `Invoice #${INVOICE_NUMBER}`, bbox: [0, 0, 100, 20], confidence: 0.95 },
      { text: 'Acme Vendor Co.', bbox: [0, 20, 100, 40], confidence: 0.95 },
      { text: 'Date: 2026-01-15', bbox: [0, 40, 100, 60], confidence: 0.95 },
      { text: 'Total: $123.45', bbox: [0, 60, 100, 80], confidence: 0.95 },
    ]);
    const { sourceDocId, caseId } = await seedSourceDocument({ trace_id });
    await seedBill(vendorId, 'fully_paid');

    const result = await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });
    expect(result.failure_class).toBeNull();

    // The dup handler did NOT fire (no vendor match → guard's vendor_id clause false).
    const { data: dupExceptions } = await db
      .from('exception_queue_entries')
      .select('exception_reason')
      .eq('document_case_id', caseId)
      .eq('exception_reason', 'duplicate_invoice_suspected');
    expect(dupExceptions).toHaveLength(0);

    // Reachability: the pipeline ran PAST the handler's Stage-5.5 point to the
    // matcher — proving it was the guard, not a classify short-circuit, that
    // kept the handler silent.
    const stages = result.pipeline_trace.map((r) => r.stage_name);
    expect(stages).toContain('match_against_existing_state');
  });
});
