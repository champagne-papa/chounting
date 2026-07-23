// tests/integration/scoringFieldAlignmentPipeline.integration.test.ts
//
// Pipeline-level proof for the 2026-07-22 extraction↔router field-name
// alignment. Tasks 1-4 prove the five sites at the service boundary by seeding
// extracted_fields directly; this proves the seam END-TO-END — a REAL Stage-4
// extraction flowing through ingestDocument into completeCandidate produces a
// genuinely multi-axis score.
//
// Why that matters: the whole bug was invisible precisely because every router
// test seeded the reader's invented vocabulary. A test that seeds
// extracted_fields cannot, on its own, prove the extractor and the matcher
// agree. Only running the real extractor can.
//
// The pre-fix structural ceiling for vendor_invoice was
// 0.3 x vendor_match_confidence = 0.30, because amount (0.30), date (0.15) and
// reference (0.25) all read key names no extraction schema emits. Clearing
// 0.30 here is the end-to-end proof.
//
// NO PAID CLAUDE CALLS. The OCR fixture is Tier-A-sufficient (labelled
// "Invoice #<n>" / "Date:" / "Total: $x"), so Stage 4 never falls through to
// Tier C. Asserted explicitly below via __getLastClaudeCallParams().
// "Invoice #12345" is a pure-digit token, so Stage-2.5 looksMultiInvoice
// (which needs 2+ six-char letter-AND-digit tokens) does not fire either.
//
// Storage provider + OCR sidecar are mocked, per
// multiInvoicePipelineWiring.integration.test.ts. Helpers are duplicated
// per-file by this suite's established convention.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { createMockInvokeSidecar } from '../fixtures/sidecar/mockSidecar';
import {
  __setMockFixtureQueue,
  __getLastClaudeCallParams,
} from '@/agent/orchestrator/callClaude';

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

const VENDOR_NAME = 'Acme Vendor Co.';
const INVOICE_NUMBER = '12345';
const INVOICE_AMOUNT = 123.45;
const INVOICE_DATE = '2026-01-15';

// Tier-A-sufficient vendor invoice: amount + vendor_invoice_number +
// accounting_date all extractable from labelled lines.
const GOLDEN_VENDOR_INVOICE_LINES = [
  { text: `Invoice #${INVOICE_NUMBER}`, bbox: [0, 0, 100, 20], confidence: 0.95 },
  // MUST be sender-LABELLED. The Tier-A vendor capture is sender-label-only
  // and precision-biased (vendorInvoiceExtractor.ts) — a bare name line is a
  // miss, which leaves the vendor absent and produces zero candidates.
  { text: `Vendor: ${VENDOR_NAME}`, bbox: [0, 20, 100, 40], confidence: 0.95 },
  { text: `Date: ${INVOICE_DATE}`, bbox: [0, 40, 100, 60], confidence: 0.95 },
  { text: `Total: $${INVOICE_AMOUNT}`, bbox: [0, 60, 100, 80], confidence: 0.95 },
];

function randomHash(): string {
  const chars = '0123456789abcdef';
  let h = '';
  for (let i = 0; i < 64; i++) h += chars[Math.floor(Math.random() * 16)];
  return h;
}

function makeFetchMock(): Mock {
  return vi.fn().mockResolvedValue({
    bytes: new TextEncoder().encode('stub bytes'),
    content_hash: 'stub-fetch-hash',
    provider: 'supabase_storage',
  });
}

function setArtifact(lines: Array<{ text: string; bbox: number[]; confidence: number }>): void {
  vi.mocked(invokeSidecar).mockImplementation(
    createMockInvokeSidecar({ failureMode: null, artifactOverride: { lines } }),
  );
}

async function seedVendorAndBill(): Promise<{ vendorId: string; billId: string }> {
  const vendorId = crypto.randomUUID();
  const { error: vErr } = await db.from('vendors').insert({
    vendor_id: vendorId,
    org_id: SEED.ORG_HOLDING,
    name: VENDOR_NAME,
  });
  if (vErr) throw new Error(`seedVendor failed: ${vErr.message}`);

  const billId = crypto.randomUUID();
  const { error: bErr } = await db.from('bills').insert({
    bill_id: billId,
    org_id: SEED.ORG_HOLDING,
    vendor_id: vendorId,
    issue_date: INVOICE_DATE,
    lifecycle_state: 'approved_for_payment',
    amount_cad: INVOICE_AMOUNT,
    bill_number: INVOICE_NUMBER,
  });
  if (bErr) throw new Error(`seedBill failed: ${bErr.message}`);

  return { vendorId, billId };
}

async function seedSourceDocument(opts: { trace_id: string }): Promise<{
  sourceDocId: string;
  caseId: string;
}> {
  const orgId = SEED.ORG_HOLDING;
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
      trace_id: opts.trace_id,
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
        original_content_hash: randomHash(),
        original_byte_size: 42,
        original_filename: 'scoring-alignment-test.pdf',
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
        document_type: 'unknown',
        state: 'received',
        trace_id: opts.trace_id,
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
        trace_id: opts.trace_id,
        created_by: SEED.USER_CONTROLLER,
      },
    ],
    p_audit: {
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
    },
  });
  if (error) throw new Error(`seed RPC failed: ${error.message}`);
  return { sourceDocId: docId, caseId };
}

describe('scoring field-name alignment — end-to-end through the real pipeline', () => {
  let traceIds: string[] = [];

  beforeEach(() => {
    traceIds = [];
    __setMockFixtureQueue(null);
    (getStorageProvider as Mock).mockReturnValue({
      put: vi.fn(),
      fetch: makeFetchMock(),
    });
  });

  afterEach(async () => {
    __setMockFixtureQueue(null);
    for (const tid of traceIds) {
      await db.from('audit_log').delete().eq('trace_id', tid);
    }
  });

  it('a real Tier-A extraction reaches multi-axis scoring (clears the 0.30 pre-fix ceiling)', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    await seedVendorAndBill();
    setArtifact(GOLDEN_VENDOR_INVOICE_LINES);
    const { sourceDocId, caseId } = await seedSourceDocument({ trace_id });

    await ingestDocument({
      org_id: SEED.ORG_HOLDING,
      source_document_id: sourceDocId,
      trace_id,
    });

    // No paid Tier C call — the fixture is Tier-A-sufficient.
    expect(__getLastClaudeCallParams()).toBeNull();

    const { data: candidates, error } = await db
      .from('document_relationship_candidates')
      .select('confidence_score, candidate_features, linked_entity_type')
      .eq('document_case_id', caseId);
    expect(error).toBeNull();
    expect(candidates && candidates.length).toBeGreaterThan(0);

    const billCandidate = candidates!.find((c) => c.linked_entity_type === 'bill');
    expect(billCandidate).toBeDefined();

    // THE assertion: 0.30 was the structural ceiling while amount/date/
    // reference read names no extractor emits.
    expect(billCandidate!.confidence_score).toBeGreaterThan(0.3);

    const features = (
      billCandidate!.candidate_features as {
        features: Array<{ feature_name: string; normalized_score: number }>;
      }
    ).features;
    const axes = Object.fromEntries(features.map((f) => [f.feature_name, f.normalized_score]));
    expect(axes.amount_match).toBe(1);
  });
});
