// tests/unit/schemas.forwardedMailbox.test.ts
//
// Phase 6 chunk 6.3a — unit tests for the two forwarded_mailbox
// Zod schemas:
//   1. ForwardedMailboxChannelMetadataSchema (our-shape; .strict() +
//      sentinel-rejection refine per Sub-Q6 Artifact 1)
//   2. PostmarkInboundWebhookSchema (third-party-payload; .passthrough()
//      + at-least-one-body refine per Sub-Q6 Artifact 2)

import { describe, it, expect } from 'vitest';
import { ForwardedMailboxChannelMetadataSchema } from '@/shared/schemas/document-platform/ingestBatch.schema';
import { PostmarkInboundWebhookSchema } from '@/shared/schemas/document-platform/postmarkWebhook.schema';

describe('ForwardedMailboxChannelMetadataSchema (Sub-Q6 Artifact 1)', () => {
  it('accepts well-shaped channel_metadata', () => {
    const result = ForwardedMailboxChannelMetadataSchema.safeParse({
      from: 'sender@example.com',
      to: 'inbound+foo@inbound.chounting.com',
      subject: 'Hello',
      message_id: '<msg-1@example.com>',
      attachment_count: 2,
    });
    expect(result.success).toBe(true);
  });

  it('rejects sentinel-shape input via .refine (defense-in-depth)', () => {
    const result = ForwardedMailboxChannelMetadataSchema.safeParse({
      from: 'sender@example.com',
      to: 'inbound+foo@inbound.chounting.com',
      subject: 'Hello',
      message_id: '<msg-1@example.com>',
      attachment_count: 0,
      sentinel: true,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing required field (message_id)', () => {
    const result = ForwardedMailboxChannelMetadataSchema.safeParse({
      from: 'sender@example.com',
      to: 'inbound+foo@inbound.chounting.com',
      subject: 'Hello',
      attachment_count: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown extra field via .strict() (mode independent of sentinel refine)', () => {
    const result = ForwardedMailboxChannelMetadataSchema.safeParse({
      from: 'sender@example.com',
      to: 'inbound+foo@inbound.chounting.com',
      subject: 'Hello',
      message_id: '<msg-1@example.com>',
      attachment_count: 0,
      raw_headers: 'X-Foo: bar',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative attachment_count', () => {
    const result = ForwardedMailboxChannelMetadataSchema.safeParse({
      from: 'sender@example.com',
      to: 'inbound+foo@inbound.chounting.com',
      subject: 'Hello',
      message_id: '<msg-1@example.com>',
      attachment_count: -1,
    });
    expect(result.success).toBe(false);
  });

  // Regression (2026-06-11): Postmark's `To` is the raw header — e.g.
  // `"Phil Chou" <inbound+<org>@inbound.chou.ca>` — NOT a bare email.
  // Pre-fix `to: z.string().email()` rejected it, and the route turned the
  // ZodError into a 500 (after storage puts → orphaned blobs). `to` is
  // display/audit metadata, NOT the allowlist key (`from` stays `.email()`).
  it('accepts a full-header `to` with display name (raw Postmark To header)', () => {
    const result = ForwardedMailboxChannelMetadataSchema.safeParse({
      from: 'sender@example.com',
      to: '"Phil Chou" <inbound+f0fa6501-1895-4fda-b151-21e7d3415fd3@inbound.chou.ca>',
      subject: 'Invoice',
      message_id: '<msg-1@example.com>',
      attachment_count: 2,
    });
    expect(result.success).toBe(true);
  });

  it('still rejects empty `to` (.min(1) guards against over-loosening)', () => {
    const result = ForwardedMailboxChannelMetadataSchema.safeParse({
      from: 'sender@example.com',
      to: '',
      subject: 'Invoice',
      message_id: '<msg-1@example.com>',
      attachment_count: 0,
    });
    expect(result.success).toBe(false);
  });

  it('still enforces `from` as an email (allowlist comparison key stays strict)', () => {
    const result = ForwardedMailboxChannelMetadataSchema.safeParse({
      from: '"Phil Chou" <sender@example.com>',
      to: 'inbound+foo@inbound.chounting.com',
      subject: 'Invoice',
      message_id: '<msg-1@example.com>',
      attachment_count: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe('PostmarkInboundWebhookSchema (Sub-Q6 Artifact 2)', () => {
  function makeValidPayload(overrides: Record<string, unknown> = {}) {
    return {
      From: 'sender@example.com',
      MessageID: '<msg-1@example.com>',
      To: 'inbound+foo@inbound.chounting.com',
      MailboxHash: 'foo',
      Subject: 'Hello',
      TextBody: 'body content',
      Attachments: [],
      ...overrides,
    };
  }

  it('accepts well-shaped payload', () => {
    const result = PostmarkInboundWebhookSchema.safeParse(makeValidPayload());
    expect(result.success).toBe(true);
  });

  it('tolerates extra Postmark fields via .passthrough() (forward-compat)', () => {
    const result = PostmarkInboundWebhookSchema.safeParse(
      makeValidPayload({
        ReplyTo: 'noreply@example.com',
        MessageStream: 'inbound',
        OriginalRecipient: 'inbound+foo@inbound.chounting.com',
      }),
    );
    expect(result.success).toBe(true);
  });

  it('rejects payload missing BOTH TextBody and HtmlBody', () => {
    const payload = makeValidPayload();
    // Remove TextBody (default), don't add HtmlBody
    const result = PostmarkInboundWebhookSchema.safeParse({
      From: payload.From,
      MessageID: payload.MessageID,
      To: payload.To,
      MailboxHash: payload.MailboxHash,
      Subject: payload.Subject,
      Attachments: payload.Attachments,
    });
    expect(result.success).toBe(false);
  });

  it('accepts payload with HtmlBody only (TextBody omitted)', () => {
    const result = PostmarkInboundWebhookSchema.safeParse({
      From: 'sender@example.com',
      MessageID: '<msg-1@example.com>',
      To: 'inbound+foo@inbound.chounting.com',
      MailboxHash: 'foo',
      Subject: 'Hello',
      HtmlBody: '<p>body</p>',
      Attachments: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects payload missing required From field', () => {
    const result = PostmarkInboundWebhookSchema.safeParse({
      MessageID: '<msg-1@example.com>',
      To: 'inbound+foo@inbound.chounting.com',
      MailboxHash: 'foo',
      Subject: 'Hello',
      TextBody: 'body',
      Attachments: [],
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty MailboxHash (no +suffix in inbound address)', () => {
    const result = PostmarkInboundWebhookSchema.safeParse(
      makeValidPayload({ MailboxHash: '' }),
    );
    expect(result.success).toBe(true);
  });

  // The route normalizes channel_metadata.to to the bare parsed address
  // via ToFull[0].Email — Postmark provides the parsed recipient there,
  // while `To` carries the raw display-name header. ToFull is typed here
  // so the route can read it without an `any` cast.
  it('accepts and types ToFull[].Email (route reads it to normalize `to`)', () => {
    const result = PostmarkInboundWebhookSchema.safeParse(
      makeValidPayload({
        To: '"Phil Chou" <inbound+foo@inbound.chounting.com>',
        ToFull: [
          {
            Email: 'inbound+foo@inbound.chounting.com',
            Name: 'Phil Chou',
            MailboxHash: 'foo',
          },
        ],
      }),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ToFull?.[0]?.Email).toBe(
        'inbound+foo@inbound.chounting.com',
      );
    }
  });
});
