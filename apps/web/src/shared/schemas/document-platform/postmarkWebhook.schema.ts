// src/shared/schemas/document-platform/postmarkWebhook.schema.ts
//
// Phase 6 chunk 6.3a — Postmark Inbound Webhook payload schema
// (Sub-Q6 Artifact 2; third-party-payload separation-of-concerns).
//
// Distinct from ingestBatch.schema.ts (which holds our-shape Zod
// schemas). This file isolates the third-party-vendor payload shape so
// the Postmark coupling is greppable at one location. If Q41 / Phase
// 2.5+ surfaces multi-provider need, the provider-abstraction layer
// reads this file as the v1 anchor (vendor-lock-in forward-pointer).
//
// .passthrough() (not .strict()) — Postmark may add fields to its
// inbound payload (e.g., ReplyTo, MessageStream, OriginalRecipient).
// Forward-compat: unknown additions don't break webhook ingest. The
// service layer reads only the canonical fields enumerated below;
// extra fields are silently dropped at our-shape construction.
//
// Sentinel-rejection refine intentionally OMITTED here (third-party
// payload won't emit our sentinel-shape; defense-in-depth marginal).
// The companion our-shape ForwardedMailboxChannelMetadataSchema in
// ingestBatch.schema.ts carries the sentinel rejection per Sub-Q6
// Artifact 1.
//
// PascalCase field names persist ONLY at this Zod-parse boundary;
// service-layer transforms to snake_case for downstream storage.

import { z } from 'zod';

// =============================================================
// Postmark attachment shape — base64-encoded content + MIME info.
// Postmark inlines small attachments directly; the Content field is
// base64-encoded raw bytes. ContentLength is the decoded byte size
// (used at storage put for size verification + audit_log emission).
// =============================================================
export const PostmarkAttachmentSchema = z.object({
  Name: z.string(),
  Content: z.string(),
  ContentType: z.string(),
  ContentLength: z.number().int().min(0),
});

export type PostmarkAttachment = z.infer<typeof PostmarkAttachmentSchema>;

// =============================================================
// Postmark inbound webhook payload — the full event shape.
//
// Required fields (canonical; service layer consumes these):
//   - From          — sender email (allowlist comparison key)
//   - MessageID     — provider-assigned unique ID (idempotency key)
//   - To            — recipient email (raw; not normalized here)
//   - MailboxHash   — Postmark-parsed +suffix-tag from inbound address
//                     (e.g., "acme" from "inbound+acme@..."); resolves
//                     to org_id at v1 via UUID parse per β-2 amendment
//                     (no slug column on organizations table)
//   - Subject       — message subject (used for email_body filename)
//   - Attachments[] — file payloads (may be empty array)
//
// Body fields (at-least-one-of required via .refine()):
//   - TextBody — plain text body (preferred for email_body source_document)
//   - HtmlBody — fallback if TextBody empty
//
// MailboxHash may be empty string (no +suffix on recipient address) —
// resolver returns null in that case → 200 + invalid_recipient audit.
// =============================================================
export const PostmarkInboundWebhookSchema = z
  .object({
    From: z.string().email(),
    MessageID: z.string().min(1),
    To: z.string(),
    // Postmark also sends the PARSED recipient list. The route reads
    // ToFull[0].Email (the bare address) to normalize channel_metadata.to,
    // since `To` above is the raw display-name header. Optional + lenient
    // inner shape (third-party payload — don't trade a 500 for a 400); the
    // route falls back to `To` when ToFull is absent/empty.
    ToFull: z
      .array(
        z.object({
          Email: z.string(),
          Name: z.string().optional(),
          MailboxHash: z.string().optional(),
        }),
      )
      .optional(),
    MailboxHash: z.string(),
    Subject: z.string(),
    TextBody: z.string().optional(),
    HtmlBody: z.string().optional(),
    Attachments: z.array(PostmarkAttachmentSchema),
  })
  .passthrough()
  .refine(
    (v) => v.TextBody !== undefined || v.HtmlBody !== undefined,
    {
      message:
        'Postmark payload must have at least one of TextBody or HtmlBody',
    },
  );

export type PostmarkInboundWebhook = z.infer<
  typeof PostmarkInboundWebhookSchema
>;
