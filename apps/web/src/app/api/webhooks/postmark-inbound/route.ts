// src/app/api/webhooks/postmark-inbound/route.ts
//
// Phase 6 chunk 6.3a — Postmark inbound webhook handler.
//
// First webhook in the /api/webhooks/ convention. Provider-invoked
// (no user session); HMAC-verified at entry; system-actor invocation
// pattern locked at Sub-Q6 Artifact 3.
//
// Rejection taxonomy (chunk 6.3a brief Architecture table):
//   1. HMAC signature invalid            → 401 + audit
//   2. JSON syntactically invalid        → 400 (no audit; pre-audit)
//   3. Postmark payload Zod-invalid      → 400 + audit
//   4. Invalid recipient (MailboxHash)   → 200 + audit
//   5. Allowlist rejection (in service)  → 200 + audit (service-emitted)
//   6. Duplicate message_id (idempotent) → 200 (no audit; in service)
//   7. Storage put failure               → 5xx (no audit)
//   8. Atomic RPC failure                → 5xx (no audit)
//
// Pre-resolution audits (signature_invalid + malformed_payload +
// invalid_recipient) are emitted directly here with org_id=null +
// user_id=null (route-handler-grade audit context). Post-resolution
// audits (rejected_not_allowlisted) are emitted by the service via
// recordMutation with the org-scoped SystemActorServiceContext.
//
// HMAC discipline: `crypto.timingSafeEqual` on hex digests (constant-
// time comparison prevents timing-attack reconstruction of the
// secret per chunk 6.3a brief Tech Stack §"Constant-time signature
// comparison").

import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { env } from '@/shared/env';
import { adminClient } from '@/db/adminClient';
import { recordMutation } from '@/services/audit/recordMutation';
import { ingestionService } from '@/services/document-platform/ingestionService';
import { resolveOrgFromMailboxHash } from '@/services/document-platform/resolveOrgFromMailboxHash';
// Agent-entry surface (the drag-drop route precedent, route.ts:56-57): the
// webhook is the composition point that wires the concrete pipeline invoker
// into handleForwardedMailbox's required IngestInvoker parameter (Class D T4
// inversion, ADR-0020 App. A) — the designated entry-point shape, exempted
// explicitly. mailbox-finish 2026-06-07.
// eslint-disable-next-line architecture/agent-first-import-boundaries
import { ingestDocument } from '@/agent/orchestrator/extraction/ingestDocument';
import { PostmarkInboundWebhookSchema } from '@/shared/schemas/document-platform/postmarkWebhook.schema';
import { loggerWith } from '@/shared/logger/pino';
import type {
  PostmarkInboundWebhook,
  PostmarkAttachment,
} from '@/shared/schemas/document-platform/postmarkWebhook.schema';
import type { SystemActorServiceContext } from '@/services/middleware/serviceContext';
import type { ForwardedMailboxFileInput } from '@/services/document-platform/types';

const SYSTEM_ACTOR = 'postmark_inbound_webhook';

// Mime-type fallback for attachments where Postmark sends an empty
// ContentType. Postmark generally populates ContentType from the MIME
// envelope but defensive in case of malformed mail.
const DEFAULT_ATTACHMENT_MIME = 'application/octet-stream';

// =====================================================================
// HMAC verification helper.
//
// Postmark signs the raw body bytes with the configured shared secret
// (HMAC-SHA256) and sends the hex digest in `X-Postmark-Signature`.
// We compute the same and compare via timingSafeEqual. Returns true
// on match. On any error (missing header, wrong length, bad hex),
// returns false (treated as signature_invalid by caller).
// =====================================================================
function verifyPostmarkSignature(args: {
  rawBody: string;
  signatureHeader: string | null;
  secret: string;
}): boolean {
  if (!args.signatureHeader) return false;
  const expected = createHmac('sha256', args.secret)
    .update(args.rawBody)
    .digest('hex');
  // Both digests are hex strings of length 64; timingSafeEqual requires
  // equal-length Buffers.
  if (args.signatureHeader.length !== expected.length) return false;
  try {
    return timingSafeEqual(
      Buffer.from(expected, 'utf8'),
      Buffer.from(args.signatureHeader, 'utf8'),
    );
  } catch {
    return false;
  }
}

// =====================================================================
// Audit emission helper for pre-resolution failures.
//
// HMAC fail / malformed payload / invalid recipient happen BEFORE we
// can derive a real org_id. audit_log accepts org_id=null + user_id=null
// (migrations 113 + 154 + base) for system-level events; here we emit
// such rows directly via recordMutation by passing a partial-shape ctx
// (trace_id + system_actor caller; org_id=null in the entry, not ctx).
// =====================================================================
async function emitPreResolutionAudit(args: {
  trace_id: string;
  action: string;
  before_state: Record<string, unknown> | null;
  log: ReturnType<typeof loggerWith>;
}): Promise<void> {
  const db = adminClient();
  try {
    // System-actor ctx with org_id placeholder; recordMutation only
    // reads ctx.caller.user_id + ctx.trace_id, and writes entry.org_id.
    // org_id here is null (system event without org scope yet).
    const ctx: SystemActorServiceContext = {
      trace_id: args.trace_id,
      caller: { user_id: null, system_actor: SYSTEM_ACTOR },
      // org_id is required at the type level. Use empty string as the
      // unresolved sentinel; recordMutation passes entry.org_id (null
      // below) to the row, not ctx.org_id. This shape preserves type
      // safety without inventing a third context variant.
      org_id: '',
    };
    await recordMutation(db, ctx, {
      org_id: null,
      action: args.action,
      entity_type: 'forwarded_mailbox',
      ...(args.before_state ? { before_state: args.before_state } : {}),
      tool_name: SYSTEM_ACTOR,
    });
  } catch (err) {
    // Audit-write failures here are non-blocking — log and continue
    // with the response. Webhook idempotency means retries still get
    // their audit row eventually.
    args.log.warn(
      { underlying: err instanceof Error ? err.message : String(err) },
      'postmark-inbound: pre-resolution audit emit failed',
    );
  }
}

// =====================================================================
// Postmark Attachment → ForwardedMailboxFileInput.
//
// Postmark sends Content as base64-encoded raw bytes; ContentType +
// ContentLength + Name come pre-parsed. We decode base64 to Uint8Array
// at this boundary and validate ContentLength matches decoded length
// (lightweight integrity check before service handoff).
// =====================================================================
function postmarkAttachmentToFileInput(
  attachment: PostmarkAttachment,
): ForwardedMailboxFileInput {
  const bytes = Buffer.from(attachment.Content, 'base64');
  return {
    bytes: new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength),
    mime_type: attachment.ContentType || DEFAULT_ATTACHMENT_MIME,
    original_filename: attachment.Name,
  };
}

// =====================================================================
// Build the email_body file from Postmark TextBody (preferred) or
// HtmlBody (fallback). PostmarkInboundWebhookSchema.refine guarantees
// at-least-one-of is present.
//
// Per Sub-Q7 lock:
//   - Prefer TextBody → mime_type='text/plain'
//   - Fall back to HtmlBody → mime_type='text/html'
//
// original_filename is a placeholder ('email-body-pending.eml') at this
// stage; ingestionService.handleForwardedMailbox composes the final
// subject-derived name (composeEmailBodyFilename) before storage put.
// =====================================================================
function buildEmailBodyFile(
  payload: PostmarkInboundWebhook,
): ForwardedMailboxFileInput {
  const useTextBody =
    payload.TextBody !== undefined && payload.TextBody.length > 0;
  const content = useTextBody
    ? payload.TextBody!
    : (payload.HtmlBody ?? '');
  const mime_type = useTextBody ? 'text/plain' : 'text/html';
  return {
    bytes: new TextEncoder().encode(content),
    mime_type,
    // Placeholder — ingestionService composes the canonical filename
    // from subject + message_id via composeEmailBodyFilename().
    original_filename: 'email-body-pending.eml',
  };
}

export async function POST(req: Request): Promise<Response> {
  const trace_id = crypto.randomUUID();
  const log = loggerWith({ trace_id });

  // Step 1: Read raw body (required for HMAC verification).
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch (err) {
    log.warn(
      { underlying: err instanceof Error ? err.message : String(err) },
      'postmark-inbound: failed to read request body',
    );
    return NextResponse.json(
      { error: 'malformed_request', message: 'Could not read request body' },
      { status: 400 },
    );
  }

  // Step 2: Verify HMAC-SHA256 signature.
  const signatureHeader = req.headers.get('x-postmark-signature');
  const signatureValid = verifyPostmarkSignature({
    rawBody,
    signatureHeader,
    secret: env.POSTMARK_INBOUND_WEBHOOK_SECRET,
  });
  if (!signatureValid) {
    log.warn(
      { signature_present: signatureHeader !== null },
      'postmark-inbound: signature invalid',
    );
    await emitPreResolutionAudit({
      trace_id,
      action: 'forwarded_mailbox.signature_invalid',
      before_state: {
        signature_present: signatureHeader !== null,
      },
      log,
    });
    return NextResponse.json(
      { error: 'invalid_signature' },
      { status: 401 },
    );
  }

  // Step 3: Parse JSON. Syntactically invalid → 400, no audit
  // (pre-audit per brief rejection-taxonomy row 2).
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch (err) {
    log.warn(
      { underlying: err instanceof Error ? err.message : String(err) },
      'postmark-inbound: JSON parse failed',
    );
    return NextResponse.json(
      { error: 'malformed_json' },
      { status: 400 },
    );
  }

  // Step 4: Zod-validate Postmark payload.
  const zodResult = PostmarkInboundWebhookSchema.safeParse(parsed);
  if (!zodResult.success) {
    log.warn(
      { issues: zodResult.error.issues.length },
      'postmark-inbound: Zod validation failed',
    );
    await emitPreResolutionAudit({
      trace_id,
      action: 'forwarded_mailbox.malformed_payload',
      before_state: {
        issue_count: zodResult.error.issues.length,
        first_issue_path: zodResult.error.issues[0]?.path.join('.') ?? null,
      },
      log,
    });
    return NextResponse.json(
      {
        error: 'malformed_payload',
        details: zodResult.error.issues.slice(0, 3),
      },
      { status: 400 },
    );
  }
  const payload = zodResult.data;

  // Step 5: Resolve org from MailboxHash. β-2 (post-amendment):
  // MailboxHash carries org_id UUID at v1 (no slug column on
  // organizations table). Returns null on empty hash, non-UUID, or
  // unknown org.
  const org_id = await resolveOrgFromMailboxHash(payload.MailboxHash);
  if (!org_id) {
    log.warn(
      { mailbox_hash_length: payload.MailboxHash.length },
      'postmark-inbound: invalid recipient (no org for MailboxHash)',
    );
    await emitPreResolutionAudit({
      trace_id,
      action: 'forwarded_mailbox.invalid_recipient',
      before_state: {
        to: payload.To,
        // MailboxHash may itself be operator PII (org slug-shape); avoid
        // raw inclusion. Length is enough forensic information.
        mailbox_hash_length: payload.MailboxHash.length,
        message_id: payload.MessageID,
      },
      log,
    });
    return NextResponse.json(
      { status: 'rejected', reason: 'invalid_recipient' },
      { status: 200 },
    );
  }

  // Step 6: Construct system-actor ctx + call service.
  const ctx: SystemActorServiceContext = {
    trace_id,
    caller: { user_id: null, system_actor: SYSTEM_ACTOR },
    org_id,
  };

  const email_body = buildEmailBodyFile(payload);
  const attachments = payload.Attachments.map(postmarkAttachmentToFileInput);

  try {
    const result = await ingestionService.handleForwardedMailbox(
      {
        org_id,
        from: payload.From,
        to: payload.To,
        subject: payload.Subject,
        message_id: payload.MessageID,
        email_body,
        attachments,
      },
      ctx,
      // Class D T4 inversion: the concrete agent-layer pipeline invoker,
      // bound at this entry surface (the service holds only the structural
      // IngestInvoker type, never an @/agent import). Synchronous mailbox
      // processing — the mailbox-finish change.
      ingestDocument,
    );

    if (result.status === 'rejected') {
      return NextResponse.json(
        { status: 'rejected', reason: result.reason },
        { status: 200 },
      );
    }
    if (result.status === 'idempotent') {
      return NextResponse.json(
        {
          status: 'accepted',
          batch_id: result.ingest_batch_id,
          idempotent: true,
        },
        { status: 200 },
      );
    }
    // status === 'accepted'
    return NextResponse.json(
      {
        status: 'accepted',
        batch_id: result.ingest_batch_id,
      },
      { status: 200 },
    );
  } catch (err) {
    // Service errors (STORAGE_OPERATION_FAILED, POST_FAILED) → 5xx.
    // Postmark retries; idempotency catches second attempt.
    log.error(
      { underlying: err instanceof Error ? err.message : String(err) },
      'postmark-inbound: service threw',
    );
    return NextResponse.json(
      {
        error: 'internal_error',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
