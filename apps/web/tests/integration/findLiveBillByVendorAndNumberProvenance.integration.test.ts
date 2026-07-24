// Board #4 Fork C — provenance discriminator on the semantic-duplicate read.
// A matched live bill counts as a re-book target ONLY if it is document-sourced:
// it carries a LIVE (link_status='created') primary_invoice source_document_links
// row. A raw/manual bill (no link) and a voided bill (link reversed) both read as
// NOT document-sourced → the incoming invoice is a legitimate first-arrival
// attachment. See 2026-07-22-board-4-fork-c-attachment-seam-design.md §3.
import { describe, it, expect, afterEach } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { findLiveBillByVendorAndNumber } from '@/services/document-platform/extractionReadService';

const db = adminClient();
const BILL_NUMBER = 'PROV-INV-001';

async function seedVendor(): Promise<string> {
  const vendor_id = crypto.randomUUID();
  const { error } = await db
    .from('vendors')
    .insert({ vendor_id, org_id: SEED.ORG_HOLDING, name: `Prov Vendor ${vendor_id.slice(0, 8)}` });
  if (error) throw new Error(`vendor seed failed: ${error.message}`);
  return vendor_id;
}

async function seedBill(vendor_id: string): Promise<string> {
  const bill_id = crypto.randomUUID();
  const { error } = await db.from('bills').insert({
    bill_id,
    org_id: SEED.ORG_HOLDING,
    vendor_id,
    bill_number: BILL_NUMBER,
    issue_date: '2026-01-15',
    lifecycle_state: 'approved_for_payment',
    amount_cad: 100.0,
  });
  if (error) throw new Error(`bill seed failed: ${error.message}`);
  return bill_id;
}

// A source_document to hang the primary_invoice link on (FK target). Seeded via
// the same ingest-batch RPC the pipeline tests use, for write-path fidelity.
async function seedSourceDoc(trace_id: string): Promise<string> {
  const batchId = crypto.randomUUID();
  const docId = crypto.randomUUID();
  const { error } = await db.rpc('create_ingest_batch_with_documents_with_audit', {
    p_batch: {
      id: batchId,
      org_id: SEED.ORG_HOLDING,
      ingest_channel: 'drag_drop_pdf',
      received_at: new Date().toISOString(),
      channel_metadata: { drop_session_id: crypto.randomUUID(), chat_session_id: crypto.randomUUID(), user_id: SEED.USER_CONTROLLER },
      trace_id,
      created_at: new Date().toISOString(),
      created_by: SEED.USER_CONTROLLER,
    },
    p_documents: [{
      id: docId,
      org_id: SEED.ORG_HOLDING,
      legal_entity_id: SEED.ORG_HOLDING,
      storage_provider: 'supabase_storage',
      original_storage_key: `org_${SEED.ORG_HOLDING}/sources/prov/${docId}.pdf`,
      original_content_hash: crypto.randomUUID().replace(/-/g, '').padEnd(64, '0'),
      original_byte_size: 42,
      original_filename: 'prov.pdf',
      mime_type: 'application/pdf',
      ingest_channel: 'drag_drop_pdf',
      storage_status: 'available',
      received_at: new Date().toISOString(),
      created_by: SEED.USER_CONTROLLER,
      ingest_batch_id: batchId,
    }],
    p_cases: [],
    p_case_sources: [],
    p_jobs: [],
    p_audit: {
      org_id: SEED.ORG_HOLDING, user_id: SEED.USER_CONTROLLER, trace_id,
      action: 'ingest_batch_created', entity_type: 'ingest_batch',
      before_state: null, after_state_id: null, tool_name: null, idempotency_key: null, reason: null,
    },
  });
  if (error) throw new Error(`source-doc seed failed: ${error.message}`);
  return docId;
}

// Seed a LIVE (created) primary_invoice link via the REAL RPC — same write path
// billService.post → documentLinkService.create uses (write-path fidelity; NOT a
// raw source_document_links insert). link_status defaults to 'created'.
async function seedPrimaryInvoiceLink(sourceDocId: string, billId: string, trace_id: string): Promise<void> {
  const { error } = await db.rpc('create_source_document_link_with_audit', {
    p_link: {
      id: crypto.randomUUID(),
      source_document_id: sourceDocId,
      linked_entity_type: 'bill',
      linked_entity_id: billId,
      link_role: 'primary_invoice',
      trace_id,
      created_by: SEED.USER_CONTROLLER,
    },
    p_audit: {
      user_id: SEED.USER_CONTROLLER, trace_id,
      action: 'source_document_link_created', entity_type: 'source_document_link', tool_name: null,
    },
  });
  if (error) throw new Error(`link seed failed: ${error.message}`);
}

describe('findLiveBillByVendorAndNumber — provenance discriminator', () => {
  const traceIds: string[] = [];
  const vendorIds: string[] = [];

  afterEach(async () => {
    for (const v of vendorIds) {
      await db.from('bills').delete().eq('vendor_id', v);
      await db.from('vendors').delete().eq('vendor_id', v);
    }
    for (const t of traceIds) {
      await db.from('source_document_links').delete().eq('trace_id', t);
      await db.from('audit_log').delete().eq('trace_id', t);
    }
    vendorIds.length = 0;
    traceIds.length = 0;
  });

  it('a matched bill WITH a live primary_invoice link → is_document_sourced true', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    const vendorId = await seedVendor();
    vendorIds.push(vendorId);
    const billId = await seedBill(vendorId);
    const sourceDocId = await seedSourceDoc(trace_id);
    await seedPrimaryInvoiceLink(sourceDocId, billId, trace_id);

    const result = await findLiveBillByVendorAndNumber({
      org_id: SEED.ORG_HOLDING, vendor_id: vendorId, bill_number: BILL_NUMBER,
    });
    expect(result.matched_bill_id).toBe(billId);
    expect(result.is_document_sourced).toBe(true);
  });

  it('a matched bill with NO link (manual/raw) → is_document_sourced false', async () => {
    const vendorId = await seedVendor();
    vendorIds.push(vendorId);
    const billId = await seedBill(vendorId);

    const result = await findLiveBillByVendorAndNumber({
      org_id: SEED.ORG_HOLDING, vendor_id: vendorId, bill_number: BILL_NUMBER,
    });
    expect(result.matched_bill_id).toBe(billId);
    expect(result.is_document_sourced).toBe(false);
  });

  it('a matched bill whose primary_invoice link is REVERSED (voided) → is_document_sourced false', async () => {
    const trace_id = crypto.randomUUID();
    traceIds.push(trace_id);
    const vendorId = await seedVendor();
    vendorIds.push(vendorId);
    const billId = await seedBill(vendorId);
    const sourceDocId = await seedSourceDoc(trace_id);
    await seedPrimaryInvoiceLink(sourceDocId, billId, trace_id);
    // Reverse via the REAL bulk-reverse RPC (created → reversed).
    const { error: revErr } = await db.rpc('reverse_source_document_link_with_audit', {
      p_input: { linked_entity_type: 'bill', linked_entity_id: billId },
      p_audit: { controller_user_id: SEED.USER_CONTROLLER, reversal_trace_id: trace_id, reversal_reason: 'test void' },
    });
    if (revErr) throw new Error(`reverse failed: ${revErr.message}`);

    const result = await findLiveBillByVendorAndNumber({
      org_id: SEED.ORG_HOLDING, vendor_id: vendorId, bill_number: BILL_NUMBER,
    });
    expect(result.matched_bill_id).toBe(billId);
    expect(result.is_document_sourced).toBe(false);
  });

  it('no matching bill → matched_bill_id null, is_document_sourced false', async () => {
    const vendorId = await seedVendor();
    vendorIds.push(vendorId);
    const result = await findLiveBillByVendorAndNumber({
      org_id: SEED.ORG_HOLDING, vendor_id: vendorId, bill_number: 'NO-SUCH-BILL',
    });
    expect(result.matched_bill_id).toBeNull();
    expect(result.is_document_sourced).toBe(false);
  });
});
