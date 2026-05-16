// src/shared/schemas/document-platform/ingestBatch.schema.ts
//
// Layer 2 boundary validation per ADR-0010 closed-discipline three-
// layer defense. Discriminated-union on `ingest_channel`; v1-active
// branches at chunk 6.3a = `drag_drop_pdf` + `forwarded_mailbox`.
// `direct_upload` and `api_ingest` channel values are reserved
// substrate per ADR-0011 §2; no Zod branch ships for them at v1.
//
// =============================================================
// Sub-Q2.2 symmetric filter discipline (chunk 6.2b)
//
// The same JSONB containment expression
// `channel_metadata @> '{"sentinel": true}'::jsonb` appears at BOTH:
//   - Layer 2 Zod ingress here (DragDropChannelMetadataSchema's
//     .strict() + .refine block rejects sentinel-keyed channel_metadata)
//   - Read-side SQL filter at the cards endpoint (excludes sentinel-
//     backed rows from operator-facing list/detail views)
//
// One sentinel-shape definition, applied at both ends. If either layer
// drifts (e.g., narrowing to `{"sentinel": true, "migration": 152}`)
// the symmetric discipline is broken; surface immediately as a Phase 6
// regression.
//
// Sentinel batches exist as permanent migration substrate (m152 + m153
// backfill rows; ~151 source_documents references in dev DB at chunk
// 6.2b ship). They are NEVER the result of a new ingestion event; the
// Zod ingress rejection here enforces this at Layer 2. The matching
// read-side SQL filter excludes them from cards endpoint results.
// =============================================================
//
// Layer 3 service-no-emit narrowing per ADR-0010: ingestionService at
// chunk 6.2b emits ONLY the `drag_drop_pdf` channel value. The other
// three `ingest_channel` enum values (`forwarded_mailbox`,
// `direct_upload`, `api_ingest`) are substrate-reserved at v1;
// `forwarded_mailbox` activates at chunk 6.3; `direct_upload` and
// `api_ingest` remain reserved post-v1 per ADR-0011 §2 + plan-doc
// §"v1 operational channels".
//
// MIME whitelist (DragDropFileInputSchema.mime_type): conservative v1
// set covering the most common ingestion formats. Phase 7 OCR pipeline
// may expand the whitelist when classification supports additional
// formats. Flag 2 forward-pointer at brief.
//
// File-count cap (DragDropUploadInputSchema.files): no explicit
// application-layer cap at v1 per Sub-Q3 lock. Next.js platform body
// size limits (~4-5MB default depending on config) apply as implicit
// fallback. Add explicit cap post-v1 if abuse surfaces.

import { z } from 'zod';

// =============================================================
// Channel metadata schemas (v1-active branch = drag_drop_pdf)
// =============================================================

// Drag-drop channel metadata: carries the per-drop-event
// `drop_session_id` (client-generated UUID, single value shared across
// all N files in one drop event). `.strict()` rejects any unknown
// keys, including the sentinel-shape `{"sentinel": true}` shape used
// by m152/m153 migration backfill batches. The `.refine()` block
// adds an explicit greppable check for the sentinel key in case
// `.strict()` is later relaxed; either layer of defense catches
// sentinel-shape ingress attempts.
export const DragDropChannelMetadataSchema = z
  .object({
    drop_session_id: z.string().uuid(),
  })
  .strict()
  .refine((v) => !('sentinel' in v), {
    message:
      'sentinel-shape channel_metadata is not a valid ingestion event (see ingestBatch.schema.ts symmetric-filter discipline)',
  });

export type DragDropChannelMetadata = z.infer<
  typeof DragDropChannelMetadataSchema
>;

// Forwarded-mailbox channel metadata (chunk 6.3a; Sub-Q6 Artifact 1).
// Our-shape post-Postmark-parse: PostmarkInboundWebhookSchema parses
// the third-party PascalCase payload at the route handler boundary;
// ingestionService transforms to this snake_case shape before writing
// to ingest_batches.channel_metadata.
//
// 5 canonical fields. raw_headers EXCLUDED (Postmark's 45-day retention
// suffices for forensic / replay needs at v1 per Sub-Q2 sub-decision iv).
//
// attachment_count discipline: nullable to distinguish "we couldn't
// determine count" (payload parse failed pre-service) from "0
// attachments" (parsed cleanly, just no attachments). Service emits
// `null` only on pre-parse-failure audit emissions; happy-path always
// emits a non-negative integer.
//
// Dual-layer sentinel rejection (.strict() + .refine()) mirrors
// DragDropChannelMetadataSchema. If .strict() is later relaxed, the
// .refine() block remains as defense-in-depth.
export const ForwardedMailboxChannelMetadataSchema = z
  .object({
    from: z.string().email(),
    to: z.string().email(),
    subject: z.string(),
    message_id: z.string().min(1),
    attachment_count: z.number().int().min(0),
  })
  .strict()
  .refine((v) => !('sentinel' in v), {
    message:
      'sentinel-shape channel_metadata is not a valid ingestion event (valid forwarded_mailbox channel_metadata requires from/to/subject/message_id/attachment_count fields; see ingestBatch.schema.ts symmetric-filter discipline)',
  });

export type ForwardedMailboxChannelMetadata = z.infer<
  typeof ForwardedMailboxChannelMetadataSchema
>;

// Discriminated union on `ingest_channel`. v1-active branches at chunk
// 6.3a = `drag_drop_pdf` + `forwarded_mailbox`. `direct_upload` and
// `api_ingest` channel values are reserved substrate per ADR-0011 §2;
// no Zod branch ships for them at v1.
export const IngestBatchChannelMetadataSchema = z.discriminatedUnion(
  'ingest_channel',
  [
    z.object({
      ingest_channel: z.literal('drag_drop_pdf'),
      channel_metadata: DragDropChannelMetadataSchema,
    }),
    z.object({
      ingest_channel: z.literal('forwarded_mailbox'),
      channel_metadata: ForwardedMailboxChannelMetadataSchema,
    }),
  ],
);

// =============================================================
// Drag-drop input schemas (ingestionService boundary)
// =============================================================

// One file in a drag-drop batch. MIME whitelist is conservative at v1
// (Sub-Q3 lock; Flag 2 forward-pointer for Phase 7 expansion).
export const DragDropFileInputSchema = z.object({
  bytes: z.instanceof(Uint8Array),
  mime_type: z.enum([
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/tiff',
  ]),
  // Filename length bounded to a reasonable display size. The unsanitized
  // form persists on source_documents.original_filename; the sanitized
  // form lives in the storage path per ADR-0013 §14.
  original_filename: z.string().min(1).max(255),
});

// The batch envelope. drop_session_id is client-generated (Flag 1
// lock); the route handler trusts the client value and stores it in
// ingest_batches.channel_metadata. files: N file inputs with no
// explicit upper cap (Sub-Q3 lock; platform body limits apply).
export const DragDropUploadInputSchema = z.object({
  org_id: z.string().uuid(),
  drop_session_id: z.string().uuid(),
  files: z.array(DragDropFileInputSchema).min(1),
});

// =============================================================
// Cards endpoint response schemas (chunk 6.2b read surface)
// =============================================================

// One row in the cards list. Sub-Q2.1 columns: case_id + state +
// source_document_id (1:1 at Phase 6) + original_filename + batch
// linkage + channel_metadata pass-through + timestamps.
export const DocumentCardSchema = z.object({
  case_id: z.string().uuid(),
  state: z.string(),  // document_case state enum; Layer 1 CHECK narrows
  source_document_id: z.string().uuid(),
  original_filename: z.string(),
  ingest_batch_id: z.string().uuid(),
  // channel_metadata is JSONB on the DB; pass through as a record on
  // the wire. Operators read drop_session_id from this at chunk 6.2b
  // and sender_address at chunk 6.3.
  channel_metadata: z.record(z.unknown()),
  received_at: z.string(),
  created_at: z.string(),
});

export type DocumentCard = z.infer<typeof DocumentCardSchema>;

// Cards list endpoint response. Filtered to a single ingest_batch_id
// per Sub-Q2.1 + Flag 4 lock (required query param; not a global
// list-all endpoint at v1).
export const CardListResultSchema = z.object({
  ingest_batch_id: z.string().uuid(),
  cards: z.array(DocumentCardSchema),
});

export type CardListResult = z.infer<typeof CardListResultSchema>;

// Card detail endpoint response. Includes full ingest_batch context
// for forensic / display use cases at the per-case grain.
export const CardDetailResultSchema = DocumentCardSchema.extend({
  ingest_batch: z.object({
    id: z.string().uuid(),
    ingest_channel: z.string(),
    received_at: z.string(),
    channel_metadata: z.record(z.unknown()),
  }),
});

export type CardDetailResult = z.infer<typeof CardDetailResultSchema>;
