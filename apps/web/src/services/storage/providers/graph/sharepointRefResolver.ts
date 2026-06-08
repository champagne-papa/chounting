// src/services/storage/providers/graph/sharepointRefResolver.ts
//
// Row-resolution for sharepointDriveProvider's read methods. Mirrors
// supabaseStorageProvider's resolveCurrentStorageRef /
// resolveVersionStorageRef / collectAllStorageKeys (read-resolution per
// ADR-0013 §3: current_version_id → version row, else
// original_storage_key), with one addition: it returns the row's
// org_id, so the provider derives the SharePoint drive from the
// DOCUMENT's own org (row-authoritative, mirroring
// documentCaseService.transition()'s org-from-row discipline) rather
// than trusting ctx.org_id.
//
// For sharepoint_drive, storage_key holds the Graph driveItem id.
//
// Extracted as its own module so the provider's read-method unit tests
// mock it (plan Task 3 "mocked row resolution"), the same seam pattern
// as orgDriveResolver. The real SQL mirrors the integration-tested
// supabase resolution; real-row integration of the read methods needs
// the Task-5 CHECK broaden (a sharepoint_drive source_documents row is
// CHECK-forbidden until then), so it lands at the post-Task-5 e2e.

import { adminClient } from '@/db/adminClient';
import { ServiceError } from '@/services/errors/ServiceError';

export interface SharepointRef {
  // The Graph driveItem id (stored in storage_key).
  driveItemId: string;
  // The document's org (drives drive resolution).
  org_id: string;
  // The row's recorded SHA-256 (returned on fetch; NOT recomputed on read).
  content_hash: string;
  byte_size: number;
}

// Resolve the current version's ref for a source_document.
export async function resolveCurrentRef(
  source_document_id: string,
): Promise<SharepointRef> {
  const db = adminClient();
  const { data: doc, error: docErr } = await db
    .from('source_documents')
    .select(
      'org_id, original_storage_key, original_content_hash, original_byte_size, current_version_id',
    )
    .eq('id', source_document_id)
    .maybeSingle();
  if (docErr) {
    throw new ServiceError(
      'STORAGE_OPERATION_FAILED',
      `Failed to load source_document ${source_document_id}: ${docErr.message}`,
      { underlying: docErr.message },
    );
  }
  if (!doc) {
    throw new ServiceError(
      'STORAGE_OPERATION_FAILED',
      `source_document ${source_document_id} not found`,
    );
  }

  if (doc.current_version_id) {
    const { data: ver, error: verErr } = await db
      .from('source_document_versions')
      .select('storage_key, content_hash, byte_size')
      .eq('id', doc.current_version_id)
      .maybeSingle();
    if (verErr) {
      throw new ServiceError(
        'STORAGE_OPERATION_FAILED',
        `Failed to load source_document_version ${doc.current_version_id}: ${verErr.message}`,
        { underlying: verErr.message },
      );
    }
    if (!ver) {
      throw new ServiceError(
        'STORAGE_OPERATION_FAILED',
        `source_document_version ${doc.current_version_id} not found (referenced by ${source_document_id})`,
      );
    }
    return {
      driveItemId: ver.storage_key,
      org_id: doc.org_id,
      content_hash: ver.content_hash,
      byte_size: ver.byte_size,
    };
  }

  return {
    driveItemId: doc.original_storage_key,
    org_id: doc.org_id,
    content_hash: doc.original_content_hash,
    byte_size: doc.original_byte_size,
  };
}

// Resolve a specific version row's ref (joins source_documents for org_id).
export async function resolveVersionRef(
  source_document_version_id: string,
): Promise<SharepointRef> {
  const db = adminClient();
  const { data: ver, error: verErr } = await db
    .from('source_document_versions')
    .select('storage_key, content_hash, byte_size, source_document_id')
    .eq('id', source_document_version_id)
    .maybeSingle();
  if (verErr) {
    throw new ServiceError(
      'STORAGE_OPERATION_FAILED',
      `Failed to load source_document_version ${source_document_version_id}: ${verErr.message}`,
      { underlying: verErr.message },
    );
  }
  if (!ver) {
    throw new ServiceError(
      'STORAGE_OPERATION_FAILED',
      `source_document_version ${source_document_version_id} not found`,
    );
  }

  const { data: doc, error: docErr } = await db
    .from('source_documents')
    .select('org_id')
    .eq('id', ver.source_document_id)
    .maybeSingle();
  if (docErr) {
    throw new ServiceError(
      'STORAGE_OPERATION_FAILED',
      `Failed to load org for source_document ${ver.source_document_id}: ${docErr.message}`,
      { underlying: docErr.message },
    );
  }
  if (!doc) {
    throw new ServiceError(
      'STORAGE_OPERATION_FAILED',
      `source_document ${ver.source_document_id} not found (referenced by version ${source_document_version_id})`,
    );
  }

  return {
    driveItemId: ver.storage_key,
    org_id: doc.org_id,
    content_hash: ver.content_hash,
    byte_size: ver.byte_size,
  };
}

// Collect org_id + all driveItem ids (original + every version) for a
// source_document. Used by delete() for full bytes removal.
export async function collectAllRefs(
  source_document_id: string,
): Promise<{ org_id: string; driveItemIds: string[] }> {
  const db = adminClient();
  const { data: doc, error: docErr } = await db
    .from('source_documents')
    .select('org_id, original_storage_key')
    .eq('id', source_document_id)
    .maybeSingle();
  if (docErr) {
    throw new ServiceError(
      'STORAGE_OPERATION_FAILED',
      `Failed to load source_document ${source_document_id}: ${docErr.message}`,
      { underlying: docErr.message },
    );
  }
  if (!doc) {
    throw new ServiceError(
      'STORAGE_OPERATION_FAILED',
      `source_document ${source_document_id} not found`,
    );
  }

  const { data: versions, error: verErr } = await db
    .from('source_document_versions')
    .select('storage_key')
    .eq('source_document_id', source_document_id);
  if (verErr) {
    throw new ServiceError(
      'STORAGE_OPERATION_FAILED',
      `Failed to load versions for source_document ${source_document_id}: ${verErr.message}`,
      { underlying: verErr.message },
    );
  }

  const ids = new Set<string>([doc.original_storage_key]);
  for (const v of versions ?? []) {
    ids.add(v.storage_key);
  }
  return { org_id: doc.org_id, driveItemIds: Array.from(ids) };
}
