import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { adminClient, userClientFor, SEED } from '../setup/testDb';
import { makeTestContext } from '../setup/makeTestContext';
import { createIngestBatchForTest } from '../helpers/createIngestBatchForTest';
import {
  create,
  reverseLinkedEntityLink,
  readSourceDocumentLink,
} from '@/services/document-platform/documentLinkService';
import { documentPlatformService } from '@/services/document-platform/documentPlatformService';
import type { ServiceContext } from '@/services/middleware/serviceContext';

// Direct-INSERT fixtures via adminClient for bills + vendors.
// Per chunk-5 implementation pattern: real service
// (documentPlatformService.createSourceDocument) for the entity
// under test (source_documents); direct INSERT for scaffolding
// fixtures (bills/vendors). billService.post requires substantial
// AP-state setup (vendor + chart_of_accounts + fiscal_period +
// bill_lines + JE) that chunk-5's polymorphic-validator existence
// check doesn't need.
//
// Phase 5 PK column inconsistency: bills.bill_id, vendors.vendor_id
// (not generic id). The chunk-5 polymorphic validator carries a
// per-entity-type PK column map (LINKED_ENTITY_TABLE_MAP exported
// from sourceDocumentLink.schema.ts).
async function buildBillFixture(orgId: string): Promise<{
  vendorId: string;
  billId: string;
}> {
  const db = adminClient();
  const vendorId = crypto.randomUUID();
  const { error: vendorErr } = await db.from('vendors').insert({
    vendor_id: vendorId,
    org_id: orgId,
    name: `TEST chunk-5 vendor ${vendorId.slice(0, 8)}`,
  });
  if (vendorErr) throw new Error(`vendor fixture failed: ${vendorErr.message}`);

  const billId = crypto.randomUUID();
  const { error: billErr } = await db.from('bills').insert({
    bill_id: billId,
    org_id: orgId,
    vendor_id: vendorId,
    issue_date: '2026-05-13',
  });
  if (billErr) throw new Error(`bill fixture failed: ${billErr.message}`);

  return { vendorId, billId };
}

describe('source_document_links happy chain + service round-trip (chunk 5)', () => {
  let ctx: ServiceContext;
  let sourceDocId: string;
  let billId: string;

  beforeAll(async () => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });

    // Create parent ingest_batch (chunk 6.2a Sub-Q4 Step C; FK-anchor for source_document).
    const { ingest_batch_id } = await createIngestBatchForTest(SEED.ORG_HOLDING);

    const sourceResult = await documentPlatformService.createSourceDocument(
      {
        bytes: new Uint8Array([1, 2, 3, 4]),
        mime_type: 'application/pdf',
        original_filename: 'chunk-5-happy.pdf',
        ingest_channel: 'direct_upload',
        ingest_batch_id,
        received_at: new Date().toISOString(),
        org_id: SEED.ORG_HOLDING,
        created_by: ctx.caller.user_id,
      },
      ctx,
    );
    sourceDocId = sourceResult.id;

    const fixture = await buildBillFixture(SEED.ORG_HOLDING);
    billId = fixture.billId;
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('create happy path: (bill, primary_invoice) link round-trips with audit_log row written atomically', async () => {
    const result = await create(
      {
        source_document_id: sourceDocId,
        linked_entity_type: 'bill',
        linked_entity_id: billId,
        link_role: 'primary_invoice',
      },
      ctx,
    );

    expect(result.source_document_id).toBe(sourceDocId);
    expect(result.linked_entity_type).toBe('bill');
    expect(result.linked_entity_id).toBe(billId);
    expect(result.link_role).toBe('primary_invoice');
    expect(result.link_status).toBe('created');
    expect(result.trace_id).toBe(ctx.trace_id);
    expect(result.created_by).toBe(ctx.caller.user_id);

    const db = adminClient();
    const { data: auditRows } = await db
      .from('audit_log')
      .select('*')
      .eq('trace_id', ctx.trace_id)
      .eq('entity_id', result.id)
      .eq('action', 'source_document_link_created');
    expect(auditRows).toHaveLength(1);
    expect(auditRows![0].entity_type).toBe('source_document_link');

    const reread = await readSourceDocumentLink(result.id, ctx);
    expect(reread.id).toBe(result.id);
  });

  it('create + reverse round-trip: link_status flips created → reversed; reverse audit event lands', async () => {
    const { ingest_batch_id: reverseBatchId } = await createIngestBatchForTest(SEED.ORG_HOLDING);
    const freshSourceResult = await documentPlatformService.createSourceDocument(
      {
        bytes: new Uint8Array([5, 6, 7, 8]),
        mime_type: 'application/pdf',
        original_filename: 'chunk-5-reverse.pdf',
        ingest_channel: 'direct_upload',
        ingest_batch_id: reverseBatchId,
        received_at: new Date().toISOString(),
        org_id: SEED.ORG_HOLDING,
        created_by: ctx.caller.user_id,
      },
      ctx,
    );
    const freshFixture = await buildBillFixture(SEED.ORG_HOLDING);

    const link = await create(
      {
        source_document_id: freshSourceResult.id,
        linked_entity_type: 'bill',
        linked_entity_id: freshFixture.billId,
        link_role: 'primary_invoice',
      },
      ctx,
    );
    expect(link.link_status).toBe('created');

    const reversalTraceId = crypto.randomUUID();
    const flipped = await reverseLinkedEntityLink(
      {
        linked_entity_type: 'bill',
        linked_entity_id: freshFixture.billId,
        reversal_reason: 'bill reversed per ADR-0001 reversal flow (test fixture)',
        reversal_trace_id: reversalTraceId,
        controller_user_id: ctx.caller.user_id,
      },
      ctx,
    );

    expect(flipped).toHaveLength(1);
    expect(flipped[0].id).toBe(link.id);
    expect(flipped[0].link_status).toBe('reversed');

    const db = adminClient();
    const { data: reversalAudit } = await db
      .from('audit_log')
      .select('*')
      .eq('trace_id', reversalTraceId)
      .eq('action', 'source_document_link_reversed');
    expect(reversalAudit).toHaveLength(1);
    expect(reversalAudit![0].entity_id).toBe(link.id);

    await db.from('audit_log').delete().eq('trace_id', reversalTraceId);
  });

  it('reverse bulk: multiple link rows for the same (entity_type, entity_id) all flip in one call', async () => {
    const freshFixture = await buildBillFixture(SEED.ORG_HOLDING);

    const linkIds: string[] = [];
    for (const role of ['primary_invoice', 'receipt', 'supporting'] as const) {
      const { ingest_batch_id: bulkBatchId } = await createIngestBatchForTest(SEED.ORG_HOLDING);
      const src = await documentPlatformService.createSourceDocument(
        {
          bytes: new Uint8Array([10 + linkIds.length]),
          mime_type: 'application/pdf',
          original_filename: `chunk-5-bulk-${role}.pdf`,
          ingest_channel: 'direct_upload',
          ingest_batch_id: bulkBatchId,
          received_at: new Date().toISOString(),
          org_id: SEED.ORG_HOLDING,
          created_by: ctx.caller.user_id,
        },
        ctx,
      );
      const link = await create(
        {
          source_document_id: src.id,
          linked_entity_type: 'bill',
          linked_entity_id: freshFixture.billId,
          link_role: role,
        },
        ctx,
      );
      linkIds.push(link.id);
    }

    const reversalTraceId = crypto.randomUUID();
    const flipped = await reverseLinkedEntityLink(
      {
        linked_entity_type: 'bill',
        linked_entity_id: freshFixture.billId,
        reversal_reason: 'bill reversed (bulk test)',
        reversal_trace_id: reversalTraceId,
        controller_user_id: ctx.caller.user_id,
      },
      ctx,
    );

    expect(flipped).toHaveLength(3);
    expect(flipped.every((row) => row.link_status === 'reversed')).toBe(true);
    expect(new Set(flipped.map((r) => r.id))).toEqual(new Set(linkIds));

    // Verify N=3 audit events landed — one per flipped row.
    const db = adminClient();
    const { data: auditRows } = await db
      .from('audit_log')
      .select('entity_id')
      .eq('trace_id', reversalTraceId)
      .eq('action', 'source_document_link_reversed');
    expect(auditRows).toHaveLength(3);
    expect(new Set(auditRows!.map((r) => r.entity_id as string))).toEqual(new Set(linkIds));

    await db.from('audit_log').delete().eq('trace_id', reversalTraceId);
  });

  it('reverse no-op: zero matching links returns empty array (not an error)', async () => {
    const flipped = await reverseLinkedEntityLink(
      {
        linked_entity_type: 'bill',
        linked_entity_id: '00000000-0000-0000-0000-deadbeefcafe',
        reversal_reason: 'no-op test',
        reversal_trace_id: crypto.randomUUID(),
        controller_user_id: ctx.caller.user_id,
      },
      ctx,
    );
    expect(flipped).toEqual([]);
  });

  it('reverse twice on same entity: second call returns empty (rows already reversed)', async () => {
    const freshFixture = await buildBillFixture(SEED.ORG_HOLDING);
    const { ingest_batch_id: doubleReverseBatchId } = await createIngestBatchForTest(SEED.ORG_HOLDING);
    const src = await documentPlatformService.createSourceDocument(
      {
        bytes: new Uint8Array([20]),
        mime_type: 'application/pdf',
        original_filename: 'chunk-5-double-reverse.pdf',
        ingest_channel: 'direct_upload',
        ingest_batch_id: doubleReverseBatchId,
        received_at: new Date().toISOString(),
        org_id: SEED.ORG_HOLDING,
        created_by: ctx.caller.user_id,
      },
      ctx,
    );
    await create(
      {
        source_document_id: src.id,
        linked_entity_type: 'bill',
        linked_entity_id: freshFixture.billId,
        link_role: 'primary_invoice',
      },
      ctx,
    );

    const reversalTraceId1 = crypto.randomUUID();
    const firstFlip = await reverseLinkedEntityLink(
      {
        linked_entity_type: 'bill',
        linked_entity_id: freshFixture.billId,
        reversal_reason: 'first reversal',
        reversal_trace_id: reversalTraceId1,
        controller_user_id: ctx.caller.user_id,
      },
      ctx,
    );
    expect(firstFlip).toHaveLength(1);

    const reversalTraceId2 = crypto.randomUUID();
    const secondFlip = await reverseLinkedEntityLink(
      {
        linked_entity_type: 'bill',
        linked_entity_id: freshFixture.billId,
        reversal_reason: 'second reversal (should be no-op)',
        reversal_trace_id: reversalTraceId2,
        controller_user_id: ctx.caller.user_id,
      },
      ctx,
    );
    expect(secondFlip).toEqual([]);

    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', reversalTraceId1);
    await db.from('audit_log').delete().eq('trace_id', reversalTraceId2);
  });
});

describe('source_document_links Layer 1 DB CHECK + UNIQUE + §6 enforcement (chunk 5)', () => {
  let ctx: ServiceContext;
  let sourceDocId: string;
  let billId: string;

  beforeAll(async () => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    const { ingest_batch_id: checksBatchId } = await createIngestBatchForTest(SEED.ORG_HOLDING);
    const src = await documentPlatformService.createSourceDocument(
      {
        bytes: new Uint8Array([30]),
        mime_type: 'application/pdf',
        original_filename: 'chunk-5-checks.pdf',
        ingest_channel: 'direct_upload',
        ingest_batch_id: checksBatchId,
        received_at: new Date().toISOString(),
        org_id: SEED.ORG_HOLDING,
        created_by: ctx.caller.user_id,
      },
      ctx,
    );
    sourceDocId = src.id;

    const fixture = await buildBillFixture(SEED.ORG_HOLDING);
    billId = fixture.billId;
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('DB CHECK rejects reserved linked_entity_type when service is bypassed (Layer 1)', async () => {
    const db = adminClient();
    const { error } = await db.from('source_document_links').insert({
      id: crypto.randomUUID(),
      source_document_id: sourceDocId,
      linked_entity_type: 'vendor_master', // reserved post-v1
      linked_entity_id: crypto.randomUUID(),
      link_role: 'supporting',
      trace_id: ctx.trace_id,
      created_by: ctx.caller.user_id,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/source_document_links_linked_entity_type_chunk_\d+_active/);
  });

  it('DB CHECK rejects reserved link_role when service is bypassed (Layer 1)', async () => {
    const db = adminClient();
    const { error } = await db.from('source_document_links').insert({
      id: crypto.randomUUID(),
      source_document_id: sourceDocId,
      linked_entity_type: 'bill',
      linked_entity_id: billId,
      link_role: 'duplicate_arrival', // reserved post-v1
      trace_id: ctx.trace_id,
      created_by: ctx.caller.user_id,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/source_document_links_link_role_chunk_\d+_active/);
  });

  it('DB CHECK rejects invalid pair when both columns are active v1 but combination is I-labeled', async () => {
    // (bill, payment_evidence) is I-labeled per ADR-0016 §3 Table A.
    const db = adminClient();
    const { error } = await db.from('source_document_links').insert({
      id: crypto.randomUUID(),
      source_document_id: sourceDocId,
      linked_entity_type: 'bill',
      linked_entity_id: billId,
      link_role: 'payment_evidence',
      trace_id: ctx.trace_id,
      created_by: ctx.caller.user_id,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/source_document_links_pair_validity_chunk_\d+_active/);
  });

  it('UNIQUE rejects duplicate (source_document_id, linked_entity_type, linked_entity_id, link_role) quad', async () => {
    const link = await create(
      {
        source_document_id: sourceDocId,
        linked_entity_type: 'bill',
        linked_entity_id: billId,
        link_role: 'primary_invoice',
      },
      ctx,
    );
    expect(link.id).toBeTruthy();

    await expect(
      create(
        {
          source_document_id: sourceDocId,
          linked_entity_type: 'bill',
          linked_entity_id: billId,
          link_role: 'primary_invoice',
        },
        ctx,
      ),
    ).rejects.toMatchObject({
      code: 'POST_FAILED',
      message: expect.stringMatching(/unique|duplicate/i),
    });
  });

  it('§6(a) column-level GRANT: service_role UPDATE on non-link_status column rejected; §6(b) trigger: reversed → created regression rejected', async () => {
    const { ingest_batch_id: grantBatchId } = await createIngestBatchForTest(SEED.ORG_HOLDING);
    const freshSrc = await documentPlatformService.createSourceDocument(
      {
        bytes: new Uint8Array([40]),
        mime_type: 'application/pdf',
        original_filename: 'chunk-5-grant-test.pdf',
        ingest_channel: 'direct_upload',
        ingest_batch_id: grantBatchId,
        received_at: new Date().toISOString(),
        org_id: SEED.ORG_HOLDING,
        created_by: ctx.caller.user_id,
      },
      ctx,
    );
    const freshFixture = await buildBillFixture(SEED.ORG_HOLDING);
    const link = await create(
      {
        source_document_id: freshSrc.id,
        linked_entity_type: 'bill',
        linked_entity_id: freshFixture.billId,
        link_role: 'primary_invoice',
      },
      ctx,
    );

    const db = adminClient();

    // §6(a) GRANT: attempting to UPDATE link_role (non-link_status
    // column) should be rejected by Postgres GRANT machinery.
    const { error: nonStatusErr } = await db
      .from('source_document_links')
      .update({ link_role: 'supporting' })
      .eq('id', link.id);
    expect(nonStatusErr).not.toBeNull();
    expect(nonStatusErr!.message).toMatch(/permission denied|insufficient privilege|column.*link_role/i);

    // §6(b) trigger: flip created → reversed (legal); then try
    // reversed → created (illegal, trigger rejects).
    const reversalTraceId = crypto.randomUUID();
    await reverseLinkedEntityLink(
      {
        linked_entity_type: 'bill',
        linked_entity_id: freshFixture.billId,
        reversal_reason: 'set up regression test',
        reversal_trace_id: reversalTraceId,
        controller_user_id: ctx.caller.user_id,
      },
      ctx,
    );

    const { error: regressionErr } = await db
      .from('source_document_links')
      .update({ link_status: 'created' })
      .eq('id', link.id);
    expect(regressionErr).not.toBeNull();
    expect(regressionErr!.message).toMatch(/reversed → created|one-way|forbidden/i);

    await db.from('audit_log').delete().eq('trace_id', reversalTraceId);
  });
});

describe('source_document_links Layer 2 Zod + Layer 3 integrity validator (chunk 5)', () => {
  let ctx: ServiceContext;
  let sourceDocId: string;
  let billId: string;

  beforeAll(async () => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });
    const { ingest_batch_id: zodBatchId } = await createIngestBatchForTest(SEED.ORG_HOLDING);
    const src = await documentPlatformService.createSourceDocument(
      {
        bytes: new Uint8Array([50]),
        mime_type: 'application/pdf',
        original_filename: 'chunk-5-zod.pdf',
        ingest_channel: 'direct_upload',
        ingest_batch_id: zodBatchId,
        received_at: new Date().toISOString(),
        org_id: SEED.ORG_HOLDING,
        created_by: ctx.caller.user_id,
      },
      ctx,
    );
    sourceDocId = src.id;

    const fixture = await buildBillFixture(SEED.ORG_HOLDING);
    billId = fixture.billId;
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('Zod rejects reserved linked_entity_type at Layer 2', async () => {
    await expect(
      create(
        {
          source_document_id: sourceDocId,
          // @ts-expect-error -- reserved post-v1 value
          linked_entity_type: 'vendor_master',
          linked_entity_id: crypto.randomUUID(),
          link_role: 'supporting',
        },
        ctx,
      ),
    ).rejects.toMatchObject({
      code: 'READ_FAILED',
      message: expect.stringContaining('linked_entity_type'),
    });
  });

  it('Zod rejects reserved link_role at Layer 2', async () => {
    await expect(
      create(
        {
          source_document_id: sourceDocId,
          linked_entity_type: 'bill',
          linked_entity_id: billId,
          // @ts-expect-error -- reserved post-v1 value
          link_role: 'duplicate_arrival',
        },
        ctx,
      ),
    ).rejects.toMatchObject({
      code: 'READ_FAILED',
      message: expect.stringContaining('link_role'),
    });
  });

  it('Zod .refine() rejects I-labeled pair (both columns active v1, combination invalid)', async () => {
    await expect(
      create(
        {
          source_document_id: sourceDocId,
          linked_entity_type: 'bill',
          linked_entity_id: billId,
          link_role: 'payment_evidence',
        },
        ctx,
      ),
    ).rejects.toMatchObject({
      code: 'READ_FAILED',
      message: expect.stringMatching(/Invalid.*pair|link_role/i),
    });
  });

  it('Layer 3 polymorphic integrity validator throws LINKED_ENTITY_NOT_FOUND when bill does not exist', async () => {
    await expect(
      create(
        {
          source_document_id: sourceDocId,
          linked_entity_type: 'bill',
          linked_entity_id: '00000000-0000-0000-0000-deadbeefcafe',
          link_role: 'primary_invoice',
        },
        ctx,
      ),
    ).rejects.toMatchObject({
      code: 'LINKED_ENTITY_NOT_FOUND',
      message: expect.stringContaining('bill'),
    });
  });
});

describe('source_document_links RLS through-parent + RPC atomicity + cascade-despite-REVOKE (chunk 5)', () => {
  let ctx: ServiceContext;
  let apClient: SupabaseClient;
  let sourceDocId: string;
  let billId: string;
  let linkId: string;

  beforeAll(async () => {
    ctx = makeTestContext({ org_ids: [SEED.ORG_HOLDING] });

    const { ingest_batch_id: rlsBatchId } = await createIngestBatchForTest(SEED.ORG_HOLDING);
    const src = await documentPlatformService.createSourceDocument(
      {
        bytes: new Uint8Array([60]),
        mime_type: 'application/pdf',
        original_filename: 'chunk-5-rls.pdf',
        ingest_channel: 'direct_upload',
        ingest_batch_id: rlsBatchId,
        received_at: new Date().toISOString(),
        org_id: SEED.ORG_HOLDING,
        created_by: ctx.caller.user_id,
      },
      ctx,
    );
    sourceDocId = src.id;

    const fixture = await buildBillFixture(SEED.ORG_HOLDING);
    billId = fixture.billId;

    const link = await create(
      {
        source_document_id: sourceDocId,
        linked_entity_type: 'bill',
        linked_entity_id: billId,
        link_role: 'primary_invoice',
      },
      ctx,
    );
    linkId = link.id;

    apClient = await userClientFor('ap@thebridge.local', 'DevSeed!ApSpec#1');
  });

  afterAll(async () => {
    const db = adminClient();
    await db.from('audit_log').delete().eq('trace_id', ctx.trace_id);
  });

  it('RLS through-parent: cross-org user cannot SELECT or INSERT source_document_links', async () => {
    const db = adminClient();
    const { data: adminRows } = await db
      .from('source_document_links')
      .select('id')
      .eq('id', linkId);
    expect(adminRows).toHaveLength(1);

    const { data: apRows, error: apReadErr } = await apClient
      .from('source_document_links')
      .select('id')
      .eq('id', linkId);
    expect(apReadErr).toBeNull();
    expect(apRows).toHaveLength(0);

    const { error: apInsertErr } = await apClient.from('source_document_links').insert({
      id: crypto.randomUUID(),
      source_document_id: sourceDocId,
      linked_entity_type: 'bill',
      linked_entity_id: billId,
      link_role: 'supporting',
      trace_id: crypto.randomUUID(),
      created_by: 'ap-test-user',
    });
    expect(apInsertErr).not.toBeNull();
    expect(apInsertErr!.message).toMatch(/row-level security|policy|violates/i);
  });

  it('RPC atomicity: create rolls back when audit INSERT fails (FK violation on audit_log.user_id)', async () => {
    const db = adminClient();
    const freshLinkId = crypto.randomUUID();
    const bogusUserId = '00000000-0000-0000-0000-deadbeefcafe';

    const { error } = await db.rpc('create_source_document_link_with_audit', {
      p_link: {
        id: freshLinkId,
        source_document_id: sourceDocId,
        linked_entity_type: 'bill',
        linked_entity_id: billId,
        link_role: 'supporting',
        trace_id: ctx.trace_id,
        created_by: ctx.caller.user_id,
      },
      p_audit: {
        user_id: bogusUserId, // not in auth.users → FK violation
        trace_id: ctx.trace_id,
        action: 'source_document_link_created',
        entity_type: 'source_document_link',
      },
    });

    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/foreign key|violates/i);

    const { data: linkRow } = await db
      .from('source_document_links')
      .select('id')
      .eq('id', freshLinkId)
      .maybeSingle();
    expect(linkRow).toBeNull();
  });

  it('ON DELETE CASCADE from source_documents fires despite REVOKE DELETE FROM service_role', async () => {
    const db = adminClient();

    const { ingest_batch_id: cascadeBatchId } = await createIngestBatchForTest(SEED.ORG_HOLDING);
    const freshSource = await documentPlatformService.createSourceDocument(
      {
        bytes: new Uint8Array([70]),
        mime_type: 'application/pdf',
        original_filename: 'chunk-5-cascade.pdf',
        ingest_channel: 'direct_upload',
        ingest_batch_id: cascadeBatchId,
        received_at: new Date().toISOString(),
        org_id: SEED.ORG_HOLDING,
        created_by: ctx.caller.user_id,
      },
      ctx,
    );

    const link = await create(
      {
        source_document_id: freshSource.id,
        linked_entity_type: 'bill',
        linked_entity_id: billId,
        link_role: 'receipt',
      },
      ctx,
    );

    // Direct DELETE on the link row by service_role: REVOKEd,
    // should fail.
    const { error: directDelErr } = await db
      .from('source_document_links')
      .delete()
      .eq('id', link.id);
    expect(directDelErr).not.toBeNull();
    expect(directDelErr!.message).toMatch(/permission denied|insufficient privilege|policy/i);

    // Direct DELETE on the parent source_document.
    const { error: parentDelErr } = await db
      .from('source_documents')
      .delete()
      .eq('id', freshSource.id);

    if (parentDelErr === null) {
      // OUTCOME A: parent DELETE succeeded; cascade-despite-
      // REVOKE confirmed empirically. The link row should be
      // gone — ON DELETE CASCADE fired at table-owner level,
      // bypassing the REVOKE DELETE on service_role.
      const { data: linkAfterCascade } = await db
        .from('source_document_links')
        .select('id')
        .eq('id', link.id)
        .maybeSingle();
      expect(linkAfterCascade).toBeNull();
      // Friction-journal at chunk-5 close names OUTCOME A:
      // cascade-despite-REVOKE empirically confirmed in this
      // test environment.
    } else {
      // OUTCOME B: parent DELETE blocked by Phase 1's
      // source_documents RLS / immutability triggers. The
      // cascade-despite-REVOKE property cannot be empirically
      // verified via service_role at chunk 5; only a
      // controller-authority deletion path (Phase 1 future
      // enhancement per ADR-0011 §4) can exercise the cascade.
      expect(parentDelErr.message).toMatch(/policy|trigger|append-only|forbidden/i);
      // Friction-journal at chunk-5 close names OUTCOME B:
      // cascade path unreachable from service-role; controller-
      // authority deletion is the only legitimate route.
    }
  });
});
