// tests/integration/evidenceObjectAssembly.integration.test.ts
//
// ADR-0033 (Canonical Evidence Object Model, V1 Wave 2). The assemble-on-read
// service: assembles a TRANSIENT canonical evidence object from live references
// (no evidence_objects row is written at Wave 2). Covers:
//  - ORG_ACCESS_DENIED: inline read-authz (caller without org access).
//  - empty subject: no evidence -> completeness 'empty', no facets.
//  - first live slice: assembles the document facet from a live source_document
//    + a primary_invoice link to a (synthetic) bill subject.
//
// Seeds source_documents + source_document_links via adminClient; the link's
// ON DELETE CASCADE tears the link down with the document in afterAll.

import { describe, it, expect, afterAll } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { evidenceObjectService } from '@/services/evidence/evidenceObjectService';

describe('evidenceObjectService.assemble — ADR-0033 Wave 2 (assemble-on-read)', () => {
  const db = adminClient();
  const TRACE = crypto.randomUUID();
  const createdDocIds: string[] = [];
  const createdBatchIds: string[] = [];

  afterAll(async () => {
    if (createdDocIds.length > 0) {
      // source_document_links.source_document_id is ON DELETE CASCADE -> links go too.
      await db.from('source_documents').delete().in('id', createdDocIds);
    }
    // ingest_batches deleted after the documents (source_documents.ingest_batch_id
    // is ON DELETE RESTRICT).
    if (createdBatchIds.length > 0) {
      await db.from('ingest_batches').delete().in('id', createdBatchIds);
    }
  });

  it('ORG_ACCESS_DENIED: a caller without access to the org is rejected', async () => {
    const ctx = makeTestContext({ org_ids: [SEED.ORG_REAL_ESTATE] });
    await expect(
      evidenceObjectService.assemble(
        { subject_type: 'bill', subject_id: crypto.randomUUID(), org_id: SEED.ORG_HOLDING },
        ctx,
      ),
    ).rejects.toMatchObject({ code: 'ORG_ACCESS_DENIED' });
  });

  it('empty subject: no evidence -> completeness empty, no facets', async () => {
    const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    const obj = await evidenceObjectService.assemble(
      { subject_type: 'bill', subject_id: crypto.randomUUID(), org_id: SEED.ORG_HOLDING },
      ctx,
    );
    expect(obj.completeness.status).toBe('empty');
    expect(obj.documents).toEqual([]);
    expect(obj.trace_ids).toEqual([]);
  });

  it('first live slice: assembles the document facet from live bill evidence', async () => {
    const ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    const billId = crypto.randomUUID();

    // source_documents.ingest_batch_id is NOT NULL (migration 152) -> seed a batch first.
    const batch = await db
      .from('ingest_batches')
      .insert({
        org_id: SEED.ORG_HOLDING,
        ingest_channel: 'direct_upload',
        received_at: new Date().toISOString(),
        channel_metadata: {},
        trace_id: TRACE,
        created_by: 'integration-test',
      })
      .select()
      .single();
    expect(batch.error).toBeNull();
    createdBatchIds.push(batch.data!.id);

    const doc = await db
      .from('source_documents')
      .insert({
        org_id: SEED.ORG_HOLDING,
        ingest_batch_id: batch.data!.id,
        storage_provider: 'supabase_storage',
        original_storage_key: `test/evidence-${TRACE}`,
        original_content_hash: 'sha256:testhash-evidence-assembly',
        original_byte_size: 1024,
        original_filename: 'test-invoice.pdf',
        mime_type: 'application/pdf',
        ingest_channel: 'direct_upload',
        received_at: new Date().toISOString(),
        created_by: 'integration-test',
      })
      .select()
      .single();
    expect(doc.error).toBeNull();
    createdDocIds.push(doc.data!.id);

    const link = await db
      .from('source_document_links')
      .insert({
        source_document_id: doc.data!.id,
        linked_entity_type: 'bill',
        linked_entity_id: billId,
        link_role: 'primary_invoice',
        trace_id: TRACE,
        created_by: 'integration-test',
      })
      .select()
      .single();
    expect(link.error).toBeNull();

    const obj = await evidenceObjectService.assemble(
      { subject_type: 'bill', subject_id: billId, org_id: SEED.ORG_HOLDING },
      ctx,
    );

    expect(obj.documents.length).toBe(1);
    expect(obj.documents[0]!.content_hash).toBe('sha256:testhash-evidence-assembly');
    expect(obj.documents[0]!.link_role).toBe('primary_invoice');
    expect(obj.completeness.has_document).toBe(true);
    // only the document facet is present -> descriptive 'partial'
    expect(obj.completeness.status).toBe('partial');
    expect(obj.trace_ids).toContain(TRACE);
  });
});
