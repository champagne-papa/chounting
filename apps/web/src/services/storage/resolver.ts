// src/services/storage/resolver.ts
// Provider resolver per ADR-0013 §2.
//
// In v1 this is mechanical: every call returns the supabase_storage
// implementation per §2 verbatim ("v1's selection is mechanical:
// every write picks supabase_storage"). The resolver shape is the
// abstraction-selection layer that lets call sites call
// getStorageProvider(...) without coupling to a specific
// implementation.
//
// Per-org default + per-document override (per §2): both reserved
// post-v1 per Q73. Per-org default lands when org_settings sub-arc
// ships (chunk 1 Sub-Q4 a-prime: org_settings.* deferred to its own
// sub-arc). Per-document override lands when a channel that
// exercises it ships (post-v1 SharePoint folder-watcher per ADR-0014).
//
// Reserved providers (sharepoint_drive, s3_bucket, external_url)
// throw ServiceError(STORAGE_OPERATION_FAILED) when requested. The
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
import type { StorageProvider } from './storageProviderService';
import type { StorageProviderEnum } from './types';

export function getStorageProvider(
  provider: StorageProviderEnum,
): StorageProvider {
  switch (provider) {
    case 'supabase_storage':
      return createSupabaseStorageProvider();
    case 'sharepoint_drive':
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
