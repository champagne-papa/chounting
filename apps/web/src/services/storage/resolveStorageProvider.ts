// src/services/storage/resolveStorageProvider.ts
//
// Charter B real-flow D-2 — the single ingest-time storage-provider
// selection authority. Returns the org's default_storage_provider ENUM
// value (NOT the instance); callers pass it to getStorageProvider(enum) for
// the put AND stamp it on the source_documents row, so put/stamp agree.
//
// INGEST-ONLY. Fetch must NOT use this — a document is fetched from the
// provider it was WRITTEN under (byteFetch dispatches on the row's
// storage_provider, D-3), even if the org default later changes.
//
// Per ADR-0020: Layer-2 data-access; reads via adminClient like
// orgDriveResolver. Fallback to supabase_storage for orgs with no
// org_settings row or a null default (the amendment's non-M365 fallback).
import { adminClient } from '@/db/adminClient';
import { StorageProviderAdmitSchema } from '@/shared/schemas/storage/storageProvider.schema';
import type { StorageProviderEnum } from './types';

export async function resolveStorageProvider(
  org_id: string,
): Promise<StorageProviderEnum> {
  const db = adminClient();
  const { data } = await db
    .from('org_settings')
    .select('default_storage_provider')
    .eq('org_id', org_id)
    .maybeSingle();

  const raw = data?.default_storage_provider ?? null;
  if (raw === null) return 'supabase_storage';

  // D-4 admit-set: the resolved value must be in the v1-active set before it
  // is used for the put or stamped on the row. The DB CHECK already pins it,
  // so this is the paired Layer-2 guard (CHECK-broaden => Zod-broaden).
  return StorageProviderAdmitSchema.parse(raw);
}
