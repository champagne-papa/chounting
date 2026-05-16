// apps/web/tests/helpers/createIngestBatchForTest.ts
//
// Shared test fixture helper for the 30 call sites of
// documentPlatformService.createSourceDocument across 10 invoking
// integration/unit test files (chunk 6.2a Grain-5-test-floor
// enumeration). Composes the create_ingest_batch_for_test test-only
// RPC (migration 153 Statement 2). Returns a single ingest_batches
// row's id + trace_id for downstream use.
//
// Production code MUST NOT import or call this helper; the helper's
// underlying RPC is _for_test-suffix substrate per Layer 3 service-
// no-emit discipline. Production ingestionService (chunks 6.2b + 6.3)
// uses create_ingest_batch_with_documents_with_audit (chunk 6.1)
// exclusively.
//
// Helper options? shape locked at chunk 6.2a brief-draft against the
// 30-caller enumeration's actual needs:
//   - ingest_channel: defaults to 'drag_drop_pdf' (most caller
//     fixtures don't care about channel discriminator at this layer);
//     overrideable for chunk 6.3 forwarded_mailbox tests + sentinel-
//     shape rejection tests.
//   - received_at: defaults to NOW() (most fixtures don't assert on
//     timestamp); overrideable for deterministic-timestamp tests.
//   - channel_metadata: defaults to {} (no caller currently asserts
//     on channel_metadata at fixture grain); overrideable for sentinel-
//     shape rejection tests at chunk 6.2b.
//   - trace_id: defaults to crypto.randomUUID() at the call site
//     (passed through to RPC); overrideable for tests that assert
//     audit_log.trace_id correlation.
//
// Imports adminClient from '../setup/testDb' (test-env-routed per
// the SUPABASE_TEST_URL precedence Rule 8) rather than from
// '@/db/adminClient' (production-env-routed). Per chunk 6.1
// integration test convention.

import { adminClient } from '../setup/testDb';
import type { IngestChannelEnum } from '@/services/document-platform/types';

export interface CreateIngestBatchForTestOptions {
  ingest_channel?: IngestChannelEnum;
  received_at?: string;
  channel_metadata?: Record<string, unknown>;
  trace_id?: string;
}

export interface CreateIngestBatchForTestResult {
  // snake_case to match existing CreateSourceDocumentResult convention
  // (storage_key, content_hash, byte_size). Enables shorthand
  // destructuring at call sites: `const { ingest_batch_id } = await
  // createIngestBatchForTest(orgId); await createSourceDocument({
  // ingest_batch_id, ... })`.
  ingest_batch_id: string;
  trace_id: string;
}

export async function createIngestBatchForTest(
  orgId: string,
  options: CreateIngestBatchForTestOptions = {},
): Promise<CreateIngestBatchForTestResult> {
  const db = adminClient();
  const { data, error } = await db.rpc('create_ingest_batch_for_test', {
    p_org_id: orgId,
    p_ingest_channel: options.ingest_channel ?? 'drag_drop_pdf',
    p_received_at: options.received_at ?? new Date().toISOString(),
    p_channel_metadata: options.channel_metadata ?? {},
    p_trace_id: options.trace_id ?? crypto.randomUUID(),
  });
  if (error) {
    throw new Error(`createIngestBatchForTest RPC failed: ${error.message}`);
  }
  if (!data || data.length === 0) {
    throw new Error('createIngestBatchForTest RPC returned no rows');
  }
  const row = data[0] as { ingest_batch_id: string; trace_id: string };
  return {
    ingest_batch_id: row.ingest_batch_id,
    trace_id: row.trace_id,
  };
}
