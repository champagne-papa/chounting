// tests/integration/forwardedMailbox.handleForwardedMailbox.integration.test.ts
//
// Phase 6 chunk 6.3a — integration tests for the Postmark inbound
// webhook end-to-end flow (route handler + ingestionService +
// resolveOrgFromMailboxHash).
//
// Pattern: vi.mock storage resolver + direct route handler import.
// Mirrors dragDropRoute.integration.test.ts pattern.
//
// Cleanup posture: audit_log rows deleted by trace_id captured from
// response body / ingest_batches rows at end of each test. Allowlist
// rows added by tests are cleaned in afterEach.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { createHmac } from 'node:crypto';
import { adminClient, SEED } from '../setup/testDb';

vi.mock('@/services/storage/resolver', () => ({
  getStorageProvider: vi.fn(),
}));

// mailbox-finish (2026-06-07): the webhook now fires ingestDocument
// synchronously (the Class D T4 invoker wired at the route). Mock it so
// these integration tests assert ingest-substrate shape without running the
// real pipeline (Modal OCR + Claude) — and so the happy-path 'received' /
// 'queued' assertions still hold (the real pipeline would advance the case
// out of those states). Test #1b below asserts the invoker receives the
// attachment's source_document_id, not the .eml email_body.
vi.mock('@/agent/orchestrator/extraction/ingestDocument', () => ({
  ingestDocument: vi.fn(async () => ({ status: 'committed' })),
}));

const { POST } = await import('@/app/api/webhooks/postmark-inbound/route');
const { getStorageProvider } = await import('@/services/storage/resolver');
const { ingestDocument } = await import(
  '@/agent/orchestrator/extraction/ingestDocument'
);

const db = adminClient();

// =====================================================================
// Test secret: must match the value in .env.local
// (POSTMARK_INBOUND_WEBHOOK_SECRET). The route reads this from env at
// module-load time; we cannot override per-test without re-importing,
// so tests are authored against the .env.local fixture value.
// =====================================================================
const TEST_SECRET = 'local-dev-postmark-inbound-secret-for-chunk-6-3a-tests';

function bindMockPut(): Mock {
  const m: Mock = vi
    .fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .mockImplementation(async (input: any) => ({
      storage_key: `org_${input.org_id}/sources/${input.source_document_id}/${input.original_filename}`,
      content_hash:
        '0000000000000000000000000000000000000000000000000000000000000000',
      byte_size: (input.bytes as Uint8Array).byteLength,
      provider: 'supabase_storage' as const,
    }));
  (getStorageProvider as Mock).mockReturnValue({ put: m });
  return m;
}

interface PostmarkAttachment {
  Name: string;
  Content: string;
  ContentType: string;
  ContentLength: number;
}

function makePayload(opts: {
  from?: string;
  to?: string;
  subject?: string;
  message_id?: string;
  mailbox_hash?: string;
  text_body?: string | undefined;
  html_body?: string | undefined;
  attachments?: PostmarkAttachment[];
}): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    From: opts.from ?? 'placeholder-founder@chounting.com',
    MessageID: opts.message_id ?? `<msg-${crypto.randomUUID()}@example.com>`,
    To: opts.to ?? 'inbound+placeholder@inbound.chounting.com',
    MailboxHash: opts.mailbox_hash ?? SEED.ORG_HOLDING,
    Subject: opts.subject ?? 'Test subject',
    Attachments: opts.attachments ?? [],
  };
  if (opts.text_body !== undefined) payload.TextBody = opts.text_body;
  if (opts.html_body !== undefined) payload.HtmlBody = opts.html_body;
  // Default at-least-one body if caller didn't specify.
  if (opts.text_body === undefined && opts.html_body === undefined) {
    payload.TextBody = 'Test body content.';
  }
  return payload;
}

function signedRequest(args: {
  bodyObj: Record<string, unknown>;
  secret?: string;
  signatureOverride?: string | null;
}): Request {
  const body = JSON.stringify(args.bodyObj);
  const secret = args.secret ?? TEST_SECRET;
  const computed = createHmac('sha256', secret).update(body).digest('hex');
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  if (args.signatureOverride === null) {
    // explicitly omit
  } else if (args.signatureOverride !== undefined) {
    headers['x-postmark-signature'] = args.signatureOverride;
  } else {
    headers['x-postmark-signature'] = computed;
  }
  return new Request('http://test.local/api/webhooks/postmark-inbound', {
    method: 'POST',
    headers,
    body,
  });
}

function makeAttachment(name: string, content = 'pdf bytes'): PostmarkAttachment {
  const b64 = Buffer.from(content, 'utf8').toString('base64');
  return {
    Name: name,
    Content: b64,
    ContentType: 'application/pdf',
    ContentLength: content.length,
  };
}

describe('Postmark inbound webhook (handleForwardedMailbox end-to-end)', () => {
  let createdBatchIds: string[] = [];
  let preExistingMessageIds: string[] = [];

  beforeEach(() => {
    bindMockPut();
    (ingestDocument as Mock).mockClear();
    createdBatchIds = [];
    preExistingMessageIds = [];
  });

  afterEach(async () => {
    // Cleanup audit_log + allowlist test rows. Schema-substrate rows
    // (ingest_batches, source_documents, document_cases, document_jobs,
    // document_case_sources) are delete-forbidden — they accumulate
    // until pnpm db:reset.
    for (const batchId of createdBatchIds) {
      const { data } = await db
        .from('ingest_batches')
        .select('trace_id')
        .eq('id', batchId)
        .maybeSingle();
      if (data?.trace_id) {
        await db.from('audit_log').delete().eq('trace_id', data.trace_id);
      }
    }
    // Cleanup all pre-resolution audit rows from tests in this file.
    // System-actor pre-resolution audits have org_id=null + entity_type=
    // 'forwarded_mailbox' + tool_name='postmark_inbound_webhook'; safe
    // to delete by that combo without affecting unrelated tests.
    await db
      .from('audit_log')
      .delete()
      .is('org_id', null)
      .eq('entity_type', 'forwarded_mailbox')
      .eq('tool_name', 'postmark_inbound_webhook');
    // Allowlist test rows (any added beyond the migration-155 seed).
    // Seed addresses use 'placeholder-*' prefix; anything else is test
    // residue. Defensive cleanup.
    await db
      .from('internal_sender_allowlist')
      .delete()
      .not('sender_address', 'like', 'placeholder-%');
  });

  it('Test #1 — happy path: 1 batch + 4 source_documents + 1 case + 1 case_sources + 4 jobs + 1 audit', async () => {
    const payload = makePayload({
      from: 'placeholder-founder@chounting.com', // matches migration-155 seed
      to: 'inbound+holding@inbound.chounting.com',
      subject: 'Invoice from Acme Corp — Q1 2026',
      attachments: [
        makeAttachment('invoice-1.pdf', 'pdf-1'),
        makeAttachment('invoice-2.pdf', 'pdf-2'),
        makeAttachment('invoice-3.pdf', 'pdf-3'),
      ],
    });
    const res = await POST(signedRequest({ bodyObj: payload }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      status: string;
      batch_id: string;
    };
    expect(body.status).toBe('accepted');
    expect(body.batch_id).toMatch(/^[0-9a-f-]{36}$/);
    createdBatchIds.push(body.batch_id);

    const { data: batchRow } = await db
      .from('ingest_batches')
      .select('id, ingest_channel, channel_metadata, trace_id')
      .eq('id', body.batch_id)
      .single();
    expect(batchRow!.ingest_channel).toBe('forwarded_mailbox');
    const cm = batchRow!.channel_metadata as Record<string, unknown>;
    expect(cm.from).toBe('placeholder-founder@chounting.com');
    expect(cm.subject).toBe('Invoice from Acme Corp — Q1 2026');
    expect(cm.attachment_count).toBe(3);

    // 4 source_documents (1 email_body + 3 attachments)
    const { data: docs } = await db
      .from('source_documents')
      .select('id, original_filename, mime_type')
      .eq('ingest_batch_id', body.batch_id);
    expect(docs).toHaveLength(4);
    const emailBody = docs!.find((d) => d.mime_type === 'text/plain');
    expect(emailBody).toBeTruthy();
    expect(emailBody!.original_filename).toBe(
      'Invoice from Acme Corp — Q1 2026.eml',
    );

    // 1 document_case for the email (not 1:1 with source_documents)
    const { data: cases } = await db
      .from('document_cases')
      .select('id, state')
      .eq('trace_id', batchRow!.trace_id);
    expect(cases).toHaveLength(1);
    expect(cases![0].state).toBe('received');

    // 1 document_case_sources row with role='email_body'
    const { data: caseSources } = await db
      .from('document_case_sources')
      .select('role, source_document_id, document_case_id')
      .eq('document_case_id', cases![0].id);
    expect(caseSources).toHaveLength(1);
    expect(caseSources![0].role).toBe('email_body');
    expect(caseSources![0].source_document_id).toBe(emailBody!.id);

    // 4 document_jobs (1 per source_document)
    const { data: jobs } = await db
      .from('document_jobs')
      .select('id, state')
      .eq('ingest_batch_id', body.batch_id);
    expect(jobs).toHaveLength(4);
    expect(jobs!.every((j) => j.state === 'queued')).toBe(true);

    // 1 audit row at batch grain
    const { data: auditRow } = await db
      .from('audit_log')
      .select('action, entity_type, entity_id, user_id')
      .eq('trace_id', batchRow!.trace_id)
      .maybeSingle();
    expect(auditRow!.action).toBe('ingest_batch_created');
    expect(auditRow!.entity_type).toBe('ingest_batch');
    expect(auditRow!.entity_id).toBe(body.batch_id);
    expect(auditRow!.user_id).toBeNull();
  });

  it('Test #1b — sync pipeline invocation targets the attachment, not the .eml email_body', async () => {
    // The core mailbox-finish correctness property: a forwarded email with
    // one invoice attachment must classify the INVOICE, not the .eml body.
    // resolvePrimaryIngestSource prefers the attachment; the invoker fires
    // once per case on it.
    const payload = makePayload({
      from: 'placeholder-founder@chounting.com',
      to: 'inbound+holding@inbound.chounting.com',
      subject: 'Single invoice',
      attachments: [makeAttachment('the-invoice.pdf', 'pdf-bytes')],
    });
    const res = await POST(signedRequest({ bodyObj: payload }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; batch_id: string };
    expect(body.status).toBe('accepted');
    createdBatchIds.push(body.batch_id);

    // Identify email_body (text/plain) vs the attachment source_document.
    const { data: docs } = await db
      .from('source_documents')
      .select('id, mime_type')
      .eq('ingest_batch_id', body.batch_id);
    expect(docs).toHaveLength(2);
    const emailBody = docs!.find((d) => d.mime_type === 'text/plain');
    const attachment = docs!.find((d) => d.mime_type !== 'text/plain');
    expect(emailBody).toBeTruthy();
    expect(attachment).toBeTruthy();

    // Invoked exactly once, on the ATTACHMENT — never the .eml body.
    expect(ingestDocument as Mock).toHaveBeenCalledTimes(1);
    const callArg = (ingestDocument as Mock).mock.calls[0][0] as {
      source_document_id: string;
    };
    expect(callArg.source_document_id).toBe(attachment!.id);
    expect(callArg.source_document_id).not.toBe(emailBody!.id);
  });

  it('Test #1c — sync invoke failure is isolated: webhook still accepted, case stays received (sweep backstop)', async () => {
    // Best-effort isolation: a pipeline throw must NOT fail the webhook.
    // The documents are safely ingested, the case stays 'received' (the
    // sweep's eligible state), and sweepStrandedCases recovers it on its
    // next run — that received→recovery half is covered by
    // sweepStrandedCases.integration.test.ts (B3); here we prove the
    // precondition: a thrown invoke is swallowed and leaves the case
    // sweep-eligible rather than failing the request or stranding it.
    (ingestDocument as Mock).mockRejectedValueOnce(
      new Error('simulated pipeline failure'),
    );
    const payload = makePayload({
      from: 'placeholder-founder@chounting.com',
      to: 'inbound+holding@inbound.chounting.com',
      subject: 'Invoice, pipeline will throw',
      attachments: [makeAttachment('invoice.pdf', 'pdf-bytes')],
    });
    const res = await POST(signedRequest({ bodyObj: payload }));

    // Webhook still returns accepted despite the pipeline throw.
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; batch_id: string };
    expect(body.status).toBe('accepted');
    createdBatchIds.push(body.batch_id);

    // The invoker was attempted exactly once (and threw — swallowed).
    expect(ingestDocument as Mock).toHaveBeenCalledTimes(1);

    // The case remains 'received' — sweep-eligible, so the backstop recovers it.
    const { data: batchRow } = await db
      .from('ingest_batches')
      .select('trace_id')
      .eq('id', body.batch_id)
      .single();
    const { data: cases } = await db
      .from('document_cases')
      .select('state')
      .eq('trace_id', batchRow!.trace_id);
    expect(cases).toHaveLength(1);
    expect(cases![0].state).toBe('received');
  });

  it('Test #2 — HMAC signature failure → 401 + signature_invalid audit; zero ingest rows', async () => {
    const payload = makePayload({});
    const res = await POST(
      signedRequest({
        bodyObj: payload,
        signatureOverride: 'a'.repeat(64), // wrong hex of correct length
      }),
    );
    expect(res.status).toBe(401);

    // System-actor audit row with org_id=null + signature_invalid
    const { data: audits } = await db
      .from('audit_log')
      .select('action, org_id')
      .eq('action', 'forwarded_mailbox.signature_invalid')
      .is('org_id', null);
    expect(audits!.length).toBeGreaterThan(0);

    // Zero new ingest_batches rows (delete-forbidden so we cannot use
    // exact-count; verify no batch with our message_id exists).
    const { data: batches } = await db
      .from('ingest_batches')
      .select('id')
      .filter('channel_metadata->>message_id', 'eq', payload.MessageID as string);
    expect(batches).toHaveLength(0);
  });

  it('Test #3 — malformed Zod payload → 400 + malformed_payload audit', async () => {
    // Missing required From field
    const badPayload = {
      MessageID: '<bad@example.com>',
      To: 'inbound+holding@inbound.chounting.com',
      MailboxHash: SEED.ORG_HOLDING,
      Subject: 'Bad',
      Attachments: [],
      TextBody: 'body',
    };
    const res = await POST(signedRequest({ bodyObj: badPayload }));
    expect(res.status).toBe(400);

    const { data: audits } = await db
      .from('audit_log')
      .select('action')
      .eq('action', 'forwarded_mailbox.malformed_payload')
      .is('org_id', null);
    expect(audits!.length).toBeGreaterThan(0);
  });

  it('Test #4 — sentinel-shape channel_metadata at service-ingress Zod → ZodError; zero rows', async () => {
    // Construct an ingestionService call directly that would produce
    // sentinel-shape channel_metadata via the symmetric Layer-2 write-
    // side discipline. The route handler can't produce this shape
    // because Postmark payload doesn't carry a 'sentinel' field; we
    // exercise the service-layer schema directly.
    const { ForwardedMailboxChannelMetadataSchema } = await import(
      '@/shared/schemas/document-platform/ingestBatch.schema'
    );
    const sentinelInput = {
      from: 'a@b.com',
      to: 'c@d.com',
      subject: 's',
      message_id: 'm',
      attachment_count: 0,
      sentinel: true,
    };
    expect(() =>
      ForwardedMailboxChannelMetadataSchema.parse(sentinelInput),
    ).toThrow(); // .strict() OR .refine() rejects it
  });

  it('Test #5 — allowlist rejection → 200 + rejected_not_allowlisted audit; zero ingest rows', async () => {
    const payload = makePayload({
      from: 'unknown-sender@example.com', // not in allowlist
    });
    const res = await POST(signedRequest({ bodyObj: payload }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      status: string;
      reason?: string;
    };
    expect(body.status).toBe('rejected');
    expect(body.reason).toBe('not_allowlisted');

    // Audit row with action=forwarded_mailbox.rejected_not_allowlisted
    // and org_id=SEED.ORG_HOLDING (org-scoped trace_id)
    const { data: audits } = await db
      .from('audit_log')
      .select('action, org_id, before_state')
      .eq('action', 'forwarded_mailbox.rejected_not_allowlisted')
      .eq('org_id', SEED.ORG_HOLDING);
    expect(audits!.length).toBeGreaterThan(0);
    const beforeState = audits![0].before_state as Record<string, unknown>;
    expect(beforeState.reason).toBe('sender_not_in_allowlist');
    expect(beforeState.from).toBe('unknown-sender@example.com');

    // Zero ingest_batches rows for this message_id
    const { data: batches } = await db
      .from('ingest_batches')
      .select('id')
      .filter('channel_metadata->>message_id', 'eq', payload.MessageID as string);
    expect(batches).toHaveLength(0);

    // Cleanup the allowlist-rejection audit (org_id is not null; the
    // afterEach by-org_id-null sweep doesn't catch it).
    if (audits!.length > 0) {
      await db
        .from('audit_log')
        .delete()
        .eq('action', 'forwarded_mailbox.rejected_not_allowlisted')
        .eq('org_id', SEED.ORG_HOLDING);
    }
  });

  it('Test #6 — invalid recipient (MailboxHash not an org UUID) → 200 + invalid_recipient audit', async () => {
    // Use a UUID that doesn't match any organization row
    const phantomOrgId = '99999999-9999-9999-9999-999999999999';
    const payload = makePayload({ mailbox_hash: phantomOrgId });
    const res = await POST(signedRequest({ bodyObj: payload }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; reason?: string };
    expect(body.status).toBe('rejected');
    expect(body.reason).toBe('invalid_recipient');

    const { data: audits } = await db
      .from('audit_log')
      .select('action')
      .eq('action', 'forwarded_mailbox.invalid_recipient')
      .is('org_id', null);
    expect(audits!.length).toBeGreaterThan(0);
  });

  it('Test #7 — idempotent duplicate message_id → 200 + same batch_id; row count unchanged', async () => {
    const message_id = `<idemp-${crypto.randomUUID()}@example.com>`;
    preExistingMessageIds.push(message_id);
    const payload = makePayload({
      from: 'placeholder-founder@chounting.com',
      message_id,
      attachments: [makeAttachment('once.pdf')],
    });

    // First submission — accepted
    const res1 = await POST(signedRequest({ bodyObj: payload }));
    expect(res1.status).toBe(200);
    const body1 = (await res1.json()) as {
      status: string;
      batch_id: string;
    };
    expect(body1.status).toBe('accepted');
    createdBatchIds.push(body1.batch_id);

    // Count source_documents for the org pre-retry
    const { count: countBefore } = await db
      .from('ingest_batches')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', SEED.ORG_HOLDING)
      .filter('channel_metadata->>message_id', 'eq', message_id);
    expect(countBefore).toBe(1);

    // Second submission with same message_id — idempotent
    const res2 = await POST(signedRequest({ bodyObj: payload }));
    expect(res2.status).toBe(200);
    const body2 = (await res2.json()) as {
      status: string;
      batch_id: string;
      idempotent?: boolean;
    };
    expect(body2.status).toBe('accepted');
    expect(body2.idempotent).toBe(true);
    expect(body2.batch_id).toBe(body1.batch_id);

    // Confirm ingest_batches row count unchanged
    const { count: countAfter } = await db
      .from('ingest_batches')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', SEED.ORG_HOLDING)
      .filter('channel_metadata->>message_id', 'eq', message_id);
    expect(countAfter).toBe(1);
  });
});
