// src/app/api/orgs/[orgId]/documents/ingest/drag-drop/route.ts
//
// POST /api/orgs/[orgId]/documents/ingest/drag-drop
//
// Drag-drop file ingestion endpoint. First multipart/form-data parser
// in the codebase per chunk 6.2b verify-from-disk (Grain 5 zero-count
// scan); uses Next.js native `Request.formData()` (no external
// library — first-instance precedent to codify at chunk close).
//
// Sub-Q3 lock: multi-file POST, no explicit application-layer cap at
// v1 (Next.js body limits apply as implicit fallback). Typical drop
// 1-20 files within ~10MB each; well within platform body limits.
//
// Sub-Q9 lock: all-or-nothing + Zod pre-validate at ingress. The
// service layer (ingestionService.handleDragDropUpload) does the Zod
// parse; if any file fails validation OR any storage put fails
// mid-batch, the entire batch is rejected. Successful prior storage
// puts orphan for ADR-0014 §10 GC cleanup. Route handler surfaces
// ServiceError.details (Sub-Q9 R1 mitigation) so the client can
// identify which file failed.
//
// withInvariants wrap pattern per the 50-route convention. No
// `action` option at chunk 6.2b (impl-time deviation from brief's
// `action: 'ingest.drag_drop'` example): adding the action would
// require ACTION_NAMES update + permission seeding migration + CA-27
// parity test alignment, all of which would functionally grant the
// action to all org roles at v1 (no viewer role exists). Invariants
// 1-3 (context shape, caller verified, org_id consistency) provide
// the org-access gate. Phase 7 may add `ingest.drag_drop` action
// when finer-grained permissions surface. Codify deviation at
// chunk-close friction-journal entry.
//
// Multipart field shape (Flag 5 lock):
//   - drop_session_id: string (UUID) — client-generated per drop event
//   - files: File entries (one per dropped file; standard browser
//            multi-file form field name)

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withInvariants } from '@/services/middleware/withInvariants';
import { ingestionService } from '@/services/document-platform/ingestionService';
import type {
  DragDropUploadInput,
} from '@/services/document-platform/types';
import {
  buildServiceContext,
  type ServiceContext,
} from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { serviceErrorToStatus } from '@/app/api/_helpers/serviceErrorToStatus';
// Agent-entry surface (the api/agent/message/route.ts:16 precedent):
// the drag-drop route is the composition point that wires the
// concrete pipeline invoker into ingestionService's required
// IngestInvoker parameter (Class D T4 inversion, ADR-0020 App. A) —
// the designated entry-point shape, exempted explicitly.
// eslint-disable-next-line architecture/agent-first-import-boundaries
import { ingestDocument } from '@/agent/orchestrator/extraction/ingestDocument';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await params;
    const ctx = await buildServiceContext(req);

    // Parse multipart form-data via Next.js native parser.
    const formData = await req.formData();

    // drop_session_id is a regular form field (not a file). Client-
    // generated UUID per drop event (Flag 1 lock).
    const dropSessionIdRaw = formData.get('drop_session_id');
    if (typeof dropSessionIdRaw !== 'string') {
      return NextResponse.json(
        {
          error: 'INVALID_INPUT',
          message: 'drop_session_id required as form field (string)',
        },
        { status: 400 },
      );
    }

    // files is a multi-value field; each value is a File entry.
    // Standard browser convention for `<input multiple>` and drag-
    // drop produces this shape. formData.getAll('files') returns an
    // array of FormDataEntryValue (File | string); filter to File.
    const fileEntries = formData
      .getAll('files')
      .filter((v): v is File => v instanceof File);

    if (fileEntries.length === 0) {
      return NextResponse.json(
        {
          error: 'INVALID_INPUT',
          message: 'At least one file required (field name: files)',
        },
        { status: 400 },
      );
    }

    // Convert File entries → bytes for each. The service layer
    // expects Uint8Array per the storage provider's platform-neutral
    // bytes contract (ADR-0013 PutInput.bytes).
    //
    // Sequential await rather than Promise.all: avoids racing the
    // browser's File streams (Promise.all would still work but adds
    // no throughput at typical drop sizes; sequential keeps memory
    // pressure bounded for large files).
    const files = await Promise.all(
      fileEntries.map(async (f) => ({
        bytes: new Uint8Array(await f.arrayBuffer()),
        mime_type: f.type,
        original_filename: f.name,
      })),
    );

    // withInvariants Pattern B external-wrap per spend brief
    // precedent. No `action` option (see file-top note). Invariants
    // 1-3 enforce context shape + caller verified + org_id consistency
    // (claimedOrgId derived from input.org_id below).
    const result = await withInvariants(
      // Adapter closure: withInvariants wraps (input, ctx) functions;
      // the third (required) IngestInvoker param is bound here, at
      // the entry surface — the Class D T4 composition point.
      (input: DragDropUploadInput, c: ServiceContext) =>
        ingestionService.handleDragDropUpload(input, c, ingestDocument),
    )(
      {
        org_id: orgId,
        drop_session_id: dropSessionIdRaw,
        files,
      },
      ctx,
    );

    // 201 Created — REST convention for resource creation.
    // Returns { ingest_batch_id, document_count }.
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: err.issues },
        { status: 400 },
      );
    }
    if (err instanceof ServiceError) {
      // Sub-Q9 R1 mitigation: surface err.details to the client so
      // partial-batch failures identify which file failed. The
      // service layer constructs details = { file_index, filename,
      // stage } for storage-put failures and { stage: 'rpc' } for
      // RPC failures.
      return NextResponse.json(
        {
          error: err.code,
          message: err.message,
          details: err.details,
        },
        { status: serviceErrorToStatus(err.code) },
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
