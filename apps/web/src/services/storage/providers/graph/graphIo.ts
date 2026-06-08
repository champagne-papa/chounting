// src/services/storage/providers/graph/graphIo.ts
//
// The Graph bytes-I/O seam for sharepointDriveProvider. Isolates every
// Microsoft Graph SDK call behind a small interface so the provider's
// integrity logic (computeHash → upload → re-read → verifyHash, spec
// D-B1/§9) and size-gate routing (spec D-B4) are unit-tested against a
// mock, decoupled from the SDK fluent chain.
//
// TESTING BOUNDARY (honest): the real implementation below is exercised
// only by the gated real-M365 e2e (plan Task 8) — it makes live Graph
// calls that cannot be faithfully unit-tested without a real granted
// site. The provider's unit tests inject a mock GraphIo. So the real
// impl's SDK usage is grounded against the installed SDK surface
// (@microsoft/microsoft-graph-client 3.0.7) but its end-to-end transfer
// correctness is proven at the e2e, not here.
//
// Per ADR-0020: Layer 2 data-access; not withInvariants-wrapped
// (ADR-0013 §1). Each call is wrapped in withRetry (§8); Graph error
// shapes are classified by classifyStorageFailure (extended in Task 4).

import { ResponseType } from '@microsoft/microsoft-graph-client';
import { OneDriveLargeFileUploadTask } from '@microsoft/microsoft-graph-client';
import { getGraphClient } from './graphClient';
import { withRetry } from '../../retry';
import { ServiceError } from '@/services/errors/ServiceError';

export interface GraphUploadInput {
  driveId: string;
  // Folder path under the drive root for this org's documents. Under
  // `none` durability the path is write-once (never reorganized).
  parentPath: string;
  fileName: string;
  bytes: Uint8Array;
  mimeType: string;
}

// The Graph bytes-I/O contract. Implementations return the driveItem id
// (the provider's storage_key) on upload, bytes on download.
export interface GraphIo {
  // Simple upload (≤ 4 MiB): PUT .../root:/{path}:/content. Returns the
  // created driveItem id.
  uploadSmall(input: GraphUploadInput): Promise<string>;
  // Large upload (> 4 MiB): createUploadSession + chunked transfer via
  // OneDriveLargeFileUploadTask. Returns the created driveItem id.
  uploadLarge(input: GraphUploadInput): Promise<string>;
  // Download current bytes for a driveItem.
  downloadBytes(driveId: string, itemId: string): Promise<Uint8Array>;
  // Pre-authenticated short-lived download URL (@microsoft.graph.downloadUrl).
  getDownloadUrl(driveId: string, itemId: string): Promise<string>;
  // Remove the driveItem (bytes-removal step only).
  deleteItem(driveId: string, itemId: string): Promise<void>;
}

function itemContentPath(driveId: string, parentPath: string, fileName: string): string {
  // Graph addressing for content PUT by path under a drive root.
  const cleanParent = parentPath.replace(/^\/+|\/+$/g, '');
  const prefix = cleanParent.length > 0 ? `${cleanParent}/` : '';
  return `/drives/${driveId}/root:/${prefix}${fileName}:/content`;
}

// Real SDK-backed GraphIo. Exercised by the gated real-M365 e2e only.
// Structured as a factory (methods inside the returned object, mirroring
// createSupabaseStorageProvider) so these data-access storage-I/O
// functions — legitimately NOT withInvariants-wrapped per ADR-0013 §1 —
// don't trip the service-layer wrap-or-annotate lint rule the way a
// top-level exported object literal would.
export function createRealGraphIo(): GraphIo {
  return {
    async uploadSmall(input: GraphUploadInput): Promise<string> {
    const client = getGraphClient();
    const path = itemContentPath(input.driveId, input.parentPath, input.fileName);
    const item = await withRetry(() =>
      client
        .api(path)
        .header('Content-Type', input.mimeType)
        // Graph SDK accepts a Buffer/ArrayBuffer body for binary PUT.
        .put(Buffer.from(input.bytes)),
    );
    const id = (item as { id?: string } | null)?.id;
    if (!id) {
      throw new ServiceError(
        'STORAGE_OPERATION_FAILED',
        'Graph upload returned no driveItem id',
        { stage: 'graph_upload_small' },
      );
    }
    return id;
  },

  async uploadLarge(input: GraphUploadInput): Promise<string> {
    const client = getGraphClient();
    const cleanParent = input.parentPath.replace(/^\/+|\/+$/g, '');
    const result = await withRetry(async () => {
      const task = await OneDriveLargeFileUploadTask.create(
        client,
        input.bytes,
        {
          fileName: input.fileName,
          path: cleanParent.length > 0 ? `/${cleanParent}` : undefined,
          // rangeSize left to SDK default; tuned at e2e if needed.
        },
      );
      return task.upload();
    });
    const id = (result.responseBody as { id?: string } | null)?.id;
    if (!id) {
      throw new ServiceError(
        'STORAGE_OPERATION_FAILED',
        'Graph large-upload returned no driveItem id',
        { stage: 'graph_upload_large' },
      );
    }
    return id;
  },

  async downloadBytes(driveId: string, itemId: string): Promise<Uint8Array> {
    const client = getGraphClient();
    const buf = await withRetry(() =>
      client
        .api(`/drives/${driveId}/items/${itemId}/content`)
        .responseType(ResponseType.ARRAYBUFFER)
        .get(),
    );
    return new Uint8Array(buf as ArrayBuffer);
  },

  async getDownloadUrl(driveId: string, itemId: string): Promise<string> {
    const client = getGraphClient();
    const item = await withRetry(() =>
      client
        .api(`/drives/${driveId}/items/${itemId}`)
        .select('id,@microsoft.graph.downloadUrl')
        .get(),
    );
    const url = (item as Record<string, unknown> | null)?.[
      '@microsoft.graph.downloadUrl'
    ];
    if (typeof url !== 'string' || url.length === 0) {
      throw new ServiceError(
        'STORAGE_OPERATION_FAILED',
        'Graph driveItem returned no downloadUrl',
        { stage: 'graph_download_url' },
      );
    }
    return url;
  },

  async deleteItem(driveId: string, itemId: string): Promise<void> {
    const client = getGraphClient();
    await withRetry(() =>
      client.api(`/drives/${driveId}/items/${itemId}`).delete(),
    );
  },
  };
}

export const realGraphIo: GraphIo = createRealGraphIo();
