/**
 * Tier C empirical exercise runner — Phase 8 §3 closeout (2026-05-23).
 *
 * Runs ONE abstaining document end-to-end through ingestDocument() against
 * the real Modal sidecar + real Claude Sonnet Tier C fallback, to exercise
 * the implemented-but-never-run Tier C path (Session 72: Tier A handled the
 * entire 10-doc corpus; the 3 abstaining docs fell through to Tier C but
 * Tier C itself was never invoked with a live Claude call).
 *
 * Adapted from scripts/phase-7-v1-close-demo.ts (Session 42). Parameterized
 * and PII-free by design: filenames/labels are passed on the command line
 * (the real founder source PDFs are gitignored), so this committed script
 * carries no personal/financial data. Raw extracted fields print to stdout
 * only — they are NOT written to any committed artifact.
 *
 * Invocation (one doc at a time):
 *   cd /home/philc/projects/chounting
 *   tsx apps/web/scripts/tier-c-empirical-exercise.ts \
 *     --label adobe_invoice \
 *     --file "Adobe_..._Invoice.pdf" \
 *     --mime application/pdf
 *
 * Source dir is fixed: apps/web/tests/fixtures/classifier/real-ocr/source-pdfs/
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const SCRIPT_DIR = path.dirname(process.argv[1] ?? __filename ?? '');
const APP_WEB_DIR = path.resolve(SCRIPT_DIR, '..');
const SOURCE_DIR = path.join(
  APP_WEB_DIR,
  'tests',
  'fixtures',
  'classifier',
  'real-ocr',
  'source-pdfs',
);

// --- CLI args ---
function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const LABEL = arg('label');
const FILE = arg('file');
const MIME = arg('mime') ?? 'application/pdf';
if (!LABEL || !FILE) {
  console.error('Usage: --label <label> --file <filename> [--mime <mime>]');
  process.exit(1);
}

// --- env (mirror phase-7-v1-close-demo.ts) ---
function loadEnvLocal(): Record<string, string> {
  const envPath = path.join(APP_WEB_DIR, '.env.local');
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  const env: Record<string, string> = {};
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const eq = line.indexOf('=');
    env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return env;
}
const env = loadEnvLocal();
for (const [k, v] of Object.entries(env)) {
  if (!(k in process.env)) process.env[k] = v;
}
process.env.SUPABASE_URL =
  env.SUPABASE_TEST_URL ?? env.SUPABASE_URL ?? process.env.SUPABASE_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY =
  env.SUPABASE_TEST_SERVICE_ROLE_KEY ??
  env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ORG_HOLDING = '11111111-1111-1111-1111-111111111111';
const USER_CONTROLLER = '00000000-0000-0000-0000-000000000002';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('FATAL: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}
if (!process.env.MODAL_OCR_HMAC_SECRET || !process.env.MODAL_OCR_SIDECAR_URL) {
  console.error('FATAL: MODAL_OCR_HMAC_SECRET + MODAL_OCR_SIDECAR_URL required');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type IngestDocumentInput = {
  org_id: string;
  source_document_id: string;
  trace_id: string;
};
type IngestDocumentFn = (input: IngestDocumentInput) => Promise<unknown>;

async function seedSourceDocument(
  trace_id: string,
): Promise<{ source_document_id: string; document_case_id: string; content_hash: string }> {
  const filePath = path.join(SOURCE_DIR, FILE!);
  const bytes = fs.readFileSync(filePath);
  const content_hash = crypto.createHash('sha256').update(bytes).digest('hex');
  const ext = path.extname(FILE!) || '.pdf';
  const batchId = crypto.randomUUID();
  const docId = crypto.randomUUID();
  const caseId = crypto.randomUUID();
  const jobId = crypto.randomUUID();
  const storage_key = `org_${ORG_HOLDING}/sources/tier-c-exercise/${docId}${ext}`;

  const upload = await admin.storage.from('documents').upload(storage_key, bytes, {
    contentType: MIME,
    upsert: false,
  });
  if (upload.error) {
    throw new Error(`storage upload failed for ${LABEL}: ${upload.error.message}`);
  }

  const batch = {
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
  };
  const doc = {
    id: docId,
    org_id: ORG_HOLDING,
    legal_entity_id: ORG_HOLDING,
    storage_provider: 'supabase_storage',
    original_storage_key: storage_key,
    original_content_hash: content_hash,
    original_byte_size: bytes.length,
    original_filename: FILE,
    mime_type: MIME,
    ingest_channel: 'drag_drop_pdf',
    storage_status: 'available',
    received_at: new Date().toISOString(),
    created_by: USER_CONTROLLER,
    ingest_batch_id: batchId,
  };
  const caseRow = {
    id: caseId,
    org_id: ORG_HOLDING,
    document_type: 'unknown',
    state: 'received',
    trace_id,
    created_by: USER_CONTROLLER,
  };
  const job = {
    id: jobId,
    org_id: ORG_HOLDING,
    source_document_id: docId,
    document_case_id: caseId,
    state: 'queued',
    trace_id,
    created_by: USER_CONTROLLER,
  };
  const audit = {
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
  };

  const { error } = await admin.rpc('create_ingest_batch_with_documents_with_audit', {
    p_batch: batch,
    p_documents: [doc],
    p_cases: [caseRow],
    p_case_sources: [],
    p_jobs: [job],
    p_audit: audit,
  });
  if (error) throw new Error(`seed RPC failed for ${LABEL}: ${error.message}`);

  return { source_document_id: docId, document_case_id: caseId, content_hash };
}

async function main() {
  console.log('=== Tier C empirical exercise ===');
  console.log(`label: ${LABEL}`);
  console.log(`mime: ${MIME}`);
  console.log(`Modal sidecar: ${process.env.MODAL_OCR_SIDECAR_URL}`);
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`Org: ${ORG_HOLDING}`);

  const mod = await import('../src/agent/orchestrator/extraction/ingestDocument');
  const ingestDocument = mod.ingestDocument as IngestDocumentFn;

  const trace_id = crypto.randomUUID();
  console.log(`trace_id: ${trace_id}`);

  const t0 = Date.now();
  const seed = await seedSourceDocument(trace_id);
  console.log(`source_document_id: ${seed.source_document_id}`);
  console.log(`document_case_id: ${seed.document_case_id}`);
  console.log(`content_hash: ${seed.content_hash.slice(0, 16)}...`);
  console.log('seeded; invoking ingestDocument()...');

  const ingest_output = await ingestDocument({
    org_id: ORG_HOLDING,
    source_document_id: seed.source_document_id,
    trace_id,
  });
  const elapsed_ms = Date.now() - t0;

  const out = ingest_output as Record<string, unknown>;
  console.log(`\n--- RESULT (${LABEL}) ---`);
  console.log(`elapsed: ${elapsed_ms}ms`);
  console.log(`status: ${out.status}`);
  console.log(`proposal_id: ${out.proposal_id ?? 'null'}`);
  console.log(`failure_class: ${out.failure_class ?? 'null'}`);
  const trace = out.pipeline_trace as
    | Array<{ stage_name: string; model: string | null }>
    | undefined;
  if (trace) {
    console.log(`pipeline_trace (${trace.length} records):`);
    for (const t of trace) {
      console.log(`  - ${t.stage_name}${t.model ? ` [model=${t.model}]` : ''}`);
    }
  }
  console.log('\n--- FULL ingest_output JSON (stdout only, NOT committed) ---');
  console.log(JSON.stringify(ingest_output, null, 2));
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
