/**
 * Phase 7 v1 close demo runner — Session 42 manual demo execution per
 * chunk 7.3 brief §6 close gate 19 + Iteration 2 §B Path γ ratification
 * (manual orchestrator invocation; not e2e assertion-body authoring).
 *
 * Fires 3 demo invocations of ingestDocument() against real Modal sidecar
 * (deployed at ap-5YtZfY5YWBjxniUALwOSbD) with real PDF fixtures from
 * apps/web/tests/fixtures/document-pipeline-demo/:
 *
 *   1. vendor_invoice.pdf → expected ProposedEntryCard post_bill route
 *      → withInvariants(billService.post) commit → T1_new_bill dispatcher
 *   2. receipt.pdf         → expected ProposedAttachmentCard
 *      attach_payment_evidence route → no service commit (non-ledger)
 *   3. payment_confirmation.pdf → expected ProposedAttachmentCard
 *      attach_payment_evidence route (no cited bill in DB → no-cited-bill
 *      branch) → no service commit
 *
 * Each invocation captures full IngestDocumentOutput + per-stage
 * pipeline_trace + trace_id (for post-demo audit_log SQL forensics).
 *
 * Path γ discipline: write demo runner as standalone script (NOT e2e
 * assertion body), execute manually, capture results into Session 42
 * demo close report. Phase 7 substrate close gate 19 satisfaction via
 * end-to-end-walkable demo evidence rather than automated assertion
 * coverage.
 *
 * Invocation:
 *   cd /home/philc/projects/chounting
 *   tsx apps/web/scripts/phase-7-v1-close-demo.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

// Script dir: apps/web/scripts/. .env.local at apps/web/.env.local.
// Fixtures at apps/web/tests/fixtures/document-pipeline-demo/. Anchor
// paths to script file (cwd may differ depending on pnpm --filter invocation).
const SCRIPT_DIR = path.dirname(process.argv[1] ?? __filename ?? '');
const APP_WEB_DIR = path.resolve(SCRIPT_DIR, '..');
const REPO_ROOT = path.resolve(APP_WEB_DIR, '..', '..');

// Parse apps/web/.env.local manually (tsx doesn't auto-load Next env files).
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
// Propagate ALL env vars from .env.local (adminClient imports env.ts which
// asserts a strict set of required vars at module load).
for (const [k, v] of Object.entries(env)) {
  if (!(k in process.env)) process.env[k] = v;
}
// Test-DB convenience aliases per testDb.ts fallback chain.
process.env.SUPABASE_URL = env.SUPABASE_TEST_URL ?? env.SUPABASE_URL ?? process.env.SUPABASE_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY =
  env.SUPABASE_TEST_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

// ingestDocument loaded dynamically inside main() (after env is populated +
// avoiding top-level await unsupported in tsx CJS default).
type IngestDocumentInput = { org_id: string; source_document_id: string; trace_id: string };
type IngestDocumentFn = (input: IngestDocumentInput) => Promise<unknown>;

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

interface DemoFixture {
  label: string;
  filename: string;
  expected_proposal_kind: string;
}

const FIXTURES: DemoFixture[] = [
  {
    label: 'vendor_invoice',
    filename: 'vendor_invoice.pdf',
    expected_proposal_kind: 'proposed_entry_card (post_bill route)',
  },
  {
    label: 'receipt',
    filename: 'receipt.pdf',
    expected_proposal_kind: 'proposed_attachment_card (attach_payment_evidence)',
  },
  {
    label: 'payment_confirmation',
    filename: 'payment_confirmation.pdf',
    expected_proposal_kind: 'proposed_attachment_card (attach_payment_evidence; no cited bill)',
  },
];

interface DemoResult {
  fixture: DemoFixture;
  trace_id: string;
  source_document_id: string;
  document_case_id: string;
  ingest_output: unknown;
  elapsed_ms: number;
  error?: string;
}

async function seedSourceDocument(
  fixture: DemoFixture,
  trace_id: string,
): Promise<{ source_document_id: string; document_case_id: string; content_hash: string }> {
  const filePath = path.join(
    APP_WEB_DIR,
    'tests',
    'fixtures',
    'document-pipeline-demo',
    fixture.filename,
  );
  const bytes = fs.readFileSync(filePath);
  const content_hash = crypto.createHash('sha256').update(bytes).digest('hex');
  const batchId = crypto.randomUUID();
  const docId = crypto.randomUUID();
  const caseId = crypto.randomUUID();
  const jobId = crypto.randomUUID();
  const storage_key = `org_${ORG_HOLDING}/sources/demo/${docId}.pdf`;

  // Upload bytes to Supabase storage at canonical path. The 'documents'
  // bucket should exist per chunk 6.1 substrate; if not, surface clearly.
  const upload = await admin.storage
    .from('documents')
    .upload(storage_key, bytes, {
      contentType: 'application/pdf',
      upsert: false,
    });
  if (upload.error) {
    throw new Error(`storage upload failed for ${fixture.label}: ${upload.error.message}`);
  }

  // Seed all substrate rows atomically via chunk 6.1 RPC.
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
    original_filename: fixture.filename,
    mime_type: 'application/pdf',
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
  if (error) throw new Error(`seed RPC failed for ${fixture.label}: ${error.message}`);

  return { source_document_id: docId, document_case_id: caseId, content_hash };
}

async function runDemoInvocation(
  fixture: DemoFixture,
  ingestDocument: IngestDocumentFn,
): Promise<DemoResult> {
  const trace_id = crypto.randomUUID();
  console.log(`\n=== ${fixture.label} ===`);
  console.log(`trace_id: ${trace_id}`);
  console.log(`expected: ${fixture.expected_proposal_kind}`);

  const t0 = Date.now();
  let source_document_id = '';
  let document_case_id = '';
  let ingest_output: unknown = null;
  let error: string | undefined;

  try {
    const seed = await seedSourceDocument(fixture, trace_id);
    source_document_id = seed.source_document_id;
    document_case_id = seed.document_case_id;
    console.log(`source_document_id: ${source_document_id}`);
    console.log(`document_case_id: ${document_case_id}`);
    console.log(`content_hash: ${seed.content_hash.slice(0, 16)}...`);
    console.log(`seeded; invoking ingestDocument()...`);

    ingest_output = await ingestDocument({
      org_id: ORG_HOLDING,
      source_document_id,
      trace_id,
    });
  } catch (err) {
    error = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`ERROR: ${error}`);
  }

  const elapsed_ms = Date.now() - t0;
  console.log(`elapsed: ${elapsed_ms}ms`);
  if (ingest_output) {
    const out = ingest_output as Record<string, unknown>;
    console.log(`status: ${out.status}`);
    console.log(`proposal_id: ${out.proposal_id ?? 'null'}`);
    console.log(`failure_class: ${out.failure_class ?? 'null'}`);
    const trace = out.pipeline_trace as Array<{ stage_name: string }> | undefined;
    if (trace) {
      console.log(`pipeline_trace stages: ${trace.map((t) => t.stage_name).join(' → ')}`);
    }
  }

  return {
    fixture,
    trace_id,
    source_document_id,
    document_case_id,
    ingest_output,
    elapsed_ms,
    error,
  };
}

async function main() {
  console.log('Phase 7 v1 close demo runner — Session 42 manual demo execution');
  console.log(`Modal sidecar: ${process.env.MODAL_OCR_SIDECAR_URL}`);
  console.log(`Supabase URL: ${process.env.SUPABASE_URL}`);
  console.log(`Org: ${ORG_HOLDING} (Bridge Holding DEV)`);
  console.log(`Fixtures: ${FIXTURES.length} (${FIXTURES.map((f) => f.label).join(', ')})`);

  const mod = await import(
    '../src/agent/orchestrator/extraction/ingestDocument'
  );
  const ingestDocument = mod.ingestDocument as IngestDocumentFn;

  const results: DemoResult[] = [];
  for (const fixture of FIXTURES) {
    const result = await runDemoInvocation(fixture, ingestDocument);
    results.push(result);
  }

  console.log('\n=== DEMO SUMMARY ===');
  for (const r of results) {
    const status = r.error ? `ERROR: ${r.error}` : (r.ingest_output as Record<string, unknown>)?.status;
    console.log(`${r.fixture.label}: ${status} (elapsed ${r.elapsed_ms}ms; trace_id ${r.trace_id})`);
  }

  // Save full result JSON for demo close report ingestion.
  const outputPath = path.join(
    REPO_ROOT,
    'docs',
    '09_briefs',
    'phase-7',
    '2026-05-20-phase-7-v1-close-demo-results.json',
  );
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nFull results saved to: ${outputPath}`);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
