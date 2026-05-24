// tests/integration/e2e/ingestPipelineHarness.ts
//
// Phase 8 chunk 6 sub-chunk b — shared harness for the document-pipeline
// e2e tests. Seeds a source_document (storage upload + ingest-batch RPC)
// for one of the document-pipeline-demo fixtures, then invokes the real
// ingestDocument() orchestrator (Stages 0-7 against the deployed Modal
// sidecar). Modeled on apps/web/scripts/phase-7-v1-close-demo.ts.
//
// Dedup discipline: each seed uses a UNIQUE original_content_hash so
// Stage 0 (dedup_by_hash) never short-circuits on a prior run's row —
// the e2e blocks assert full traversal, so a same-bytes re-run must still
// be treated as a new document. (Real uploads carry their true SHA-256;
// this uniqueness is a test-isolation device only.)

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { adminClient, SEED } from '../../setup/testDb';
import { ingestDocument } from '@/agent/orchestrator/extraction/ingestDocument';
import type { IngestDocumentOutput } from '@/agent/orchestrator/extraction/types';

const FIXTURE_DIR = path.resolve(__dirname, '..', '..', 'fixtures', 'document-pipeline-demo');

export interface PipelineRun {
  output: IngestDocumentOutput;
  source_document_id: string;
  document_case_id: string;
  trace_id: string;
}

/**
 * Seed a source_document for the given demo fixture PDF and run the full
 * ingestDocument pipeline against the real Modal sidecar. Returns the
 * orchestrator output plus the seeded ids for downstream assertions.
 */
export async function runIngestPipeline(fixtureFilename: string): Promise<PipelineRun> {
  const admin = adminClient();
  const bytes = fs.readFileSync(path.join(FIXTURE_DIR, fixtureFilename));
  // Unique content hash per run (test-isolation; see file header).
  const content_hash = crypto
    .createHash('sha256')
    .update(bytes)
    .update(crypto.randomUUID())
    .digest('hex');

  const trace_id = crypto.randomUUID();
  const batchId = crypto.randomUUID();
  const docId = crypto.randomUUID();
  const caseId = crypto.randomUUID();
  const jobId = crypto.randomUUID();
  const storage_key = `org_${SEED.ORG_HOLDING}/sources/e2e/${docId}.pdf`;

  const upload = await admin.storage.from('documents').upload(storage_key, bytes, {
    contentType: 'application/pdf',
    upsert: false,
  });
  if (upload.error) {
    throw new Error(`storage upload failed for ${fixtureFilename}: ${upload.error.message}`);
  }

  const now = new Date().toISOString();
  const { error } = await admin.rpc('create_ingest_batch_with_documents_with_audit', {
    p_batch: {
      id: batchId,
      org_id: SEED.ORG_HOLDING,
      ingest_channel: 'drag_drop_pdf',
      received_at: now,
      channel_metadata: {
        drop_session_id: crypto.randomUUID(),
        chat_session_id: crypto.randomUUID(),
        user_id: SEED.USER_CONTROLLER,
      },
      trace_id,
      created_at: now,
      created_by: SEED.USER_CONTROLLER,
    },
    p_documents: [
      {
        id: docId,
        org_id: SEED.ORG_HOLDING,
        legal_entity_id: SEED.ORG_HOLDING,
        storage_provider: 'supabase_storage',
        original_storage_key: storage_key,
        original_content_hash: content_hash,
        original_byte_size: bytes.length,
        original_filename: fixtureFilename,
        mime_type: 'application/pdf',
        ingest_channel: 'drag_drop_pdf',
        storage_status: 'available',
        received_at: now,
        created_by: SEED.USER_CONTROLLER,
        ingest_batch_id: batchId,
      },
    ],
    p_cases: [
      {
        id: caseId,
        org_id: SEED.ORG_HOLDING,
        document_type: 'unknown',
        state: 'received',
        trace_id,
        created_by: SEED.USER_CONTROLLER,
      },
    ],
    p_case_sources: [],
    p_jobs: [
      {
        id: jobId,
        org_id: SEED.ORG_HOLDING,
        source_document_id: docId,
        document_case_id: caseId,
        state: 'queued',
        trace_id,
        created_by: SEED.USER_CONTROLLER,
      },
    ],
    p_audit: {
      org_id: SEED.ORG_HOLDING,
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
  if (error) throw new Error(`seed RPC failed for ${fixtureFilename}: ${error.message}`);

  const output = await ingestDocument({
    org_id: SEED.ORG_HOLDING,
    source_document_id: docId,
    trace_id,
  });

  return { output, source_document_id: docId, document_case_id: caseId, trace_id };
}

// ===========================================================================
// Seeded-scenario helpers (Modal-e2e follow-up, auto-commit arc 2026-05-24).
//
// The 3 fixture-covered deferred scenarios need ledger state seeded so the
// pipeline's Stage 6 (documentRouterService.completeCandidate) GENERATES a
// relationship candidate from it — routing then keys off that candidate
// (proposalBuilder). Seed values match the demo fixtures' OCR
// (corpus.sanitized.ts): vendor 'Figma, Inc.' (GST 100000000RT9999), amount
// CA$282.24, invoice number '1ABCD23M-0001'; the Zoho payment cites
// '1ABCD23M0001' (hyphen-stripped). SEED.ORG_HOLDING already has '2000
// Accounts Payable' + '1000 Cash' + an open fiscal period, so the pipeline's
// payment-commit lookups (lookupPaymentCommitDefaults) resolve.
//
// RUNTIME DEPENDENCY (the central unknown the paid run resolves): routing
// hinges on the relationship scorer (scoreComposition) clearing the per-type
// confidence threshold (0.85 invoice/payment, 0.80 receipt) from the seeded
// state + live OCR fields. If it doesn't clear, the scenario routes to
// no-match (proposal_id=null, no candidate) — a finding about real-OCR scorer
// behaviour, not a test bug.
// ===========================================================================

export const DEMO_FIGMA = {
  vendorName: 'Figma, Inc.',
  taxId: '100000000RT9999',
  amountCad: '282.2400',
  invoiceNumber: '1ABCD23M-0001',
  citedBillNumber: '1ABCD23M0001', // Zoho payment cites the hyphen-stripped form
  issueDate: '2025-11-18',
} as const;

export async function seedVendor(
  opts: { name?: string; tax_id?: string } = {},
): Promise<string> {
  const admin = adminClient();
  const vendor_id = crypto.randomUUID();
  const { error } = await admin.from('vendors').insert({
    vendor_id,
    org_id: SEED.ORG_HOLDING,
    name: opts.name ?? DEMO_FIGMA.vendorName,
    tax_id: opts.tax_id ?? DEMO_FIGMA.taxId,
  });
  if (error) throw new Error(`seedVendor failed: ${error.message}`);
  return vendor_id;
}

export async function seedApprovedBill(opts: {
  vendor_id: string;
  bill_number: string;
  amount_cad?: string;
}): Promise<string> {
  const admin = adminClient();
  const bill_id = crypto.randomUUID();
  const { error } = await admin.from('bills').insert({
    bill_id,
    org_id: SEED.ORG_HOLDING,
    vendor_id: opts.vendor_id,
    bill_number: opts.bill_number,
    issue_date: DEMO_FIGMA.issueDate,
    amount_original: opts.amount_cad ?? DEMO_FIGMA.amountCad,
    amount_cad: opts.amount_cad ?? DEMO_FIGMA.amountCad,
    currency: 'CAD',
    fx_rate: '1.00000000',
    lifecycle_state: 'approved_for_payment',
  });
  if (error) throw new Error(`seedApprovedBill failed: ${error.message}`);
  return bill_id;
}

export async function seedPayment(opts: {
  vendor_id: string;
  amount_cad?: string;
}): Promise<string> {
  const admin = adminClient();
  const payment_id = crypto.randomUUID();
  const { error } = await admin.from('payments').insert({
    payment_id,
    org_id: SEED.ORG_HOLDING,
    vendor_id: opts.vendor_id,
    payment_date: DEMO_FIGMA.issueDate,
    amount: opts.amount_cad ?? DEMO_FIGMA.amountCad,
    currency: 'CAD',
    payment_method: 'other',
    payment_purpose: 'bill_payment',
    payment_state: 'paid',
    applied_to: 'bill',
    reference_number: null,
  });
  if (error) throw new Error(`seedPayment failed: ${error.message}`);
  return payment_id;
}

export interface SeededCandidate {
  linked_entity_type: string;
  linked_entity_id: string | null;
}

export async function getCandidatesForCase(
  document_case_id: string,
): Promise<SeededCandidate[]> {
  const admin = adminClient();
  const { data } = await admin
    .from('document_relationship_candidates')
    .select('linked_entity_type, linked_entity_id')
    .eq('document_case_id', document_case_id);
  return (data ?? []) as SeededCandidate[];
}

export async function getPaymentById(
  payment_id: string,
): Promise<{ payment_id: string; vendor_id: string | null } | null> {
  const admin = adminClient();
  const { data } = await admin
    .from('payments')
    .select('payment_id, vendor_id')
    .eq('payment_id', payment_id)
    .maybeSingle();
  return (data as { payment_id: string; vendor_id: string | null } | null) ?? null;
}

export async function getBillsByVendor(
  vendor_id: string,
): Promise<Array<{ bill_id: string; vendor_id: string; bill_number: string | null; amount_cad: string }>> {
  const admin = adminClient();
  const { data } = await admin
    .from('bills')
    .select('bill_id, vendor_id, bill_number, amount_cad')
    .eq('vendor_id', vendor_id);
  return (data ?? []) as Array<{ bill_id: string; vendor_id: string; bill_number: string | null; amount_cad: string }>;
}

export async function getPaymentsByVendor(
  vendor_id: string,
): Promise<Array<{ payment_id: string; vendor_id: string | null; amount: string }>> {
  const admin = adminClient();
  const { data } = await admin
    .from('payments')
    .select('payment_id, vendor_id, amount')
    .eq('vendor_id', vendor_id);
  return (data ?? []) as Array<{ payment_id: string; vendor_id: string | null; amount: string }>;
}

/** Best-effort teardown. JE/JL rows are append-only and accumulate (Item 20). */
export async function cleanupSeededVendor(vendor_id: string): Promise<void> {
  const admin = adminClient();
  const { data: bills } = await admin
    .from('bills')
    .select('bill_id')
    .eq('vendor_id', vendor_id);
  for (const b of (bills ?? []) as { bill_id: string }[]) {
    await admin.from('bill_payment_allocations').delete().eq('bill_id', b.bill_id);
  }
  await admin.from('payments').delete().eq('org_id', SEED.ORG_HOLDING).eq('vendor_id', vendor_id);
  await admin.from('bills').delete().eq('org_id', SEED.ORG_HOLDING).eq('vendor_id', vendor_id);
  await admin.from('vendors').delete().eq('vendor_id', vendor_id);
}
