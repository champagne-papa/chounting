// Wave 6 D8 T4 — review-inbox screenshot staging (DEV-ONLY).
//
// Stages three document cases into the LOCAL dev DB so the founder
// capture sequence (D8 close report §4) can photograph the D3 review
// UI's populated states against a fresh `pnpm db:reset:clean`:
//
//   1. POSTABLE        — needs_review + vendor + ocr/extraction/artifact
//                        whose lines the review rebuild parses (the exact
//                        D7 `seedPostable` shape). Drives shots 2–4
//                        (post-status badge → detail → approve→post).
//   2. EXCEPTION-CLASS — needs_review + an OPEN exception_queue_entries
//                        row (reason `low_confidence_classification`,
//                        v1-active). Drives shot 2's exception badge
//                        (the inbox's open-exception join).
//   3. NOT_POSTABLE    — needs_review with NO ocr/extraction/artifact:
//                        the review rebuild degrades and approve-post
//                        409s NOT_POSTABLE (the real missing/thin-
//                        artifact class per reviewPreview.ts). Drives
//                        shot 3's steering banner.
//
// NOT in the app import graph; mutates the local dev DB only; every
// state is staged through the same RPCs/inserts the integration suite
// uses (`create_ingest_batch_with_documents_with_audit` +
// `update_document_case_state_with_audit`), so each case sits in a
// state the system actually produces — no hand-faked field combos.
//
// Run (after `pnpm db:reset:clean`, before captures):
//   pnpm --filter @chounting/web exec dotenv -e .env.local -- \
//     tsx scripts/stage-review-screenshots.ts
//
// Re-runnable: each run stages fresh rows (fresh UUIDs); reset wipes.

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('FATAL: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}
if (!SUPABASE_URL.includes('127.0.0.1') && !SUPABASE_URL.includes('localhost')) {
  console.error(`FATAL: refusing to run against non-local Supabase (${SUPABASE_URL})`);
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// dev.sql + seed-auth-users.ts constants (local dev seed identities).
const ORG_HOLDING = '11111111-1111-1111-1111-111111111111';
const USER_CONTROLLER = '00000000-0000-0000-0000-000000000002';

const RUN_SUFFIX = crypto.randomUUID().slice(0, 8);

// The D7 `seedCase` shape: batch + source doc + case (received) + queued
// job through the atomic ingest RPC, then the audited state hop to
// needs_review — the same transition path the pipeline drives.
async function seedCase(
  filename: string,
): Promise<{ sourceDocId: string; caseId: string; traceId: string }> {
  const trace_id = crypto.randomUUID();
  const batchId = crypto.randomUUID();
  const docId = crypto.randomUUID();
  const caseId = crypto.randomUUID();
  const { error } = await db.rpc('create_ingest_batch_with_documents_with_audit', {
    p_batch: {
      id: batchId,
      org_id: ORG_HOLDING,
      ingest_channel: 'drag_drop_pdf',
      received_at: new Date().toISOString(),
      channel_metadata: {
        drop_session_id: crypto.randomUUID(),
        chat_session_id: crypto.randomUUID(),
        user_id: USER_CONTROLLER,
      },
      trace_id,
      created_at: new Date().toISOString(),
      created_by: USER_CONTROLLER,
    },
    p_documents: [
      {
        id: docId,
        org_id: ORG_HOLDING,
        legal_entity_id: ORG_HOLDING,
        storage_provider: 'supabase_storage',
        original_storage_key: `org_${ORG_HOLDING}/sources/screenshot-staging/${docId}.pdf`,
        original_content_hash: crypto
          .createHash('sha256')
          .update(crypto.randomUUID())
          .digest('hex'),
        original_byte_size: 42,
        original_filename: filename,
        mime_type: 'application/pdf',
        ingest_channel: 'drag_drop_pdf',
        storage_status: 'available',
        received_at: new Date().toISOString(),
        created_by: USER_CONTROLLER,
        ingest_batch_id: batchId,
      },
    ],
    p_cases: [
      {
        id: caseId,
        org_id: ORG_HOLDING,
        document_type: 'vendor_invoice',
        state: 'received',
        trace_id,
        created_by: USER_CONTROLLER,
      },
    ],
    p_case_sources: [],
    p_jobs: [
      {
        id: crypto.randomUUID(),
        org_id: ORG_HOLDING,
        source_document_id: docId,
        document_case_id: caseId,
        state: 'queued',
        trace_id,
        created_by: USER_CONTROLLER,
      },
    ],
    p_audit: {
      org_id: ORG_HOLDING,
      user_id: USER_CONTROLLER,
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
      org_id: ORG_HOLDING,
      user_id: USER_CONTROLLER,
      trace_id,
      action: 'document_case_transitioned',
      entity_type: 'document_case',
      tool_name: null,
      reason: null,
    },
  });
  if (trErr) throw new Error(`seed state hop failed: ${trErr.message}`);
  return { sourceDocId: docId, caseId, traceId: trace_id };
}

// Case 1 — POSTABLE: the D7 `seedPostable` shape (vendor + ocr_run +
// extraction_run + artifact whose lines the review rebuild parses).
async function stagePostable(): Promise<string> {
  const vendorId = crypto.randomUUID();
  const vendorName = `Screenshot Staging Vendor ${RUN_SUFFIX}`;
  const { error } = await db.from('vendors').insert({
    vendor_id: vendorId,
    org_id: ORG_HOLDING,
    name: vendorName,
  });
  if (error) throw new Error(`vendor seed failed: ${error.message}`);

  const { sourceDocId, caseId } = await seedCase('screenshot-postable.pdf');

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
      { text: `Invoice Number: INV-SHOT-${RUN_SUFFIX}` },
      { text: 'Date: 2026-06-05' },
      { text: 'Total Due: $180.00' },
      { text: 'CAD' },
    ],
    words: [],
    quality_flags: [],
    pipeline_trace: [],
    confidence: 0.9,
  });
  if (artErr) throw new Error(`artifact seed failed: ${artErr.message}`);
  return caseId;
}

// Case 2 — EXCEPTION-CLASS: needs_review + open exception entry (the
// inbox's open-exception join drives the badge).
async function stageException(): Promise<string> {
  const { sourceDocId, caseId, traceId } = await seedCase('screenshot-exception.pdf');
  const { error } = await db.from('exception_queue_entries').insert({
    org_id: ORG_HOLDING,
    document_case_id: caseId,
    source_document_id: sourceDocId,
    exception_reason: 'low_confidence_classification',
    // exception_status defaults to 'open'
    trace_id: traceId,
    created_by: USER_CONTROLLER,
  });
  if (error) throw new Error(`exception seed failed: ${error.message}`);
  return caseId;
}

// Case 3 — NOT_POSTABLE: needs_review with no artifact chain; the
// review rebuild degrades and approve-post 409s NOT_POSTABLE.
async function stageNotPostable(): Promise<string> {
  const { caseId } = await seedCase('screenshot-not-postable.pdf');
  return caseId;
}

async function main() {
  const postable = await stagePostable();
  const exception = await stageException();
  const notPostable = await stageNotPostable();
  console.log('Staged review-inbox screenshot cases (org: Bridge Holding Co DEV):');
  console.log(`  POSTABLE      ${postable}  → shots 2-4 (post-status badge, detail, approve→post)`);
  console.log(`  EXCEPTION     ${exception}  → shot 2 (exception badge)`);
  console.log(`  NOT_POSTABLE  ${notPostable}  → shot 3 (steering banner on approve)`);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
