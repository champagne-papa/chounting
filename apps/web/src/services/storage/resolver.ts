// src/services/storage/resolver.ts
// Provider resolver per ADR-0013 §2.
//
// getStorageProvider(provider) maps a storage_provider enum value to its
// implementation. supabase_storage and sharepoint_drive are both ACTIVE
// (sharepoint_drive activated at Charter B (a) Task 6). The caller chooses
// the value: resolveStorageProvider picks the org default at INGEST
// (Charter B real-flow D-2); byteFetch dispatches on the ROW's provider at
// READ (D-3). The former "v1 mechanical: every call returns supabase_storage"
// no longer holds — supabase_storage is the fallback default per the
// 2026-06-07 amendment.
//
// Per-document override (per §2) is still reserved post-v1 — no channel
// exercises it yet (post-v1 SharePoint folder-watcher per ADR-0014).
//
// Reserved providers (s3_bucket, external_url) throw
// ServiceError(STORAGE_OPERATION_FAILED) when requested. The
// catchall code's purpose per chunk 2 lock is "unexpected storage
// operation failure not classified by the §7 three-way matrix"; a
// request for a reserved provider doesn't fit the §7 categories
// but is structurally an operation that cannot complete, so the
// catchall is the structurally correct disposition.
//
// Exhaustiveness check via TypeScript's `never` ensures the type
// system catches missing branches at compile time when reserved
// providers activate post-v1 (each activation will replace the
// throw with the appropriate factory call).

import { ServiceError } from '@/services/errors/ServiceError';
import { createSupabaseStorageProvider } from './providers/supabaseStorageProvider';
import { createSharepointDriveProvider } from './providers/sharepointDriveProvider';
import type { StorageProvider } from './storageProviderService';
import type { StorageProviderEnum } from './types';

export function getStorageProvider(
  provider: StorageProviderEnum,
): StorageProvider {
  switch (provider) {
    case 'supabase_storage':
      return createSupabaseStorageProvider();
    // Charter B (a) Task 6: deliberate activation edit — sharepoint_drive
    // splits out of the reserved throw-case into its factory. Note (spec
    // §5 dep-2 precision): the exhaustive-`never` guard did NOT force this
    // — the combined throw-case was valid exhaustive handling and the
    // build did not break with it. Activation is a conscious edit; the
    // never guard only guarantees no provider is silently UNHANDLED.
    case 'sharepoint_drive':
      return createSharepointDriveProvider();
    case 's3_bucket':
    case 'external_url':
      throw new ServiceError(
        'STORAGE_OPERATION_FAILED',
        `Provider '${provider}' is reserved per ADR-0013 §14; not active in v1.`,
      );
    default: {
      const _exhaustive: never = provider;
      return _exhaustive;
    }
  }
}
