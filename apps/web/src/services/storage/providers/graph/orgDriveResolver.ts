// src/services/storage/providers/graph/orgDriveResolver.ts
//
// Resolves an org's SharePoint site + drive for the sharepoint_drive
// provider (spec D-B3: per-org site/drive lives in org_settings).
//
// FORWARD-COLUMN read (plan Task 2 / Q2): the org_settings columns this
// reads — `sharepoint_site_id`, `sharepoint_drive_id` — do NOT exist on
// disk yet. They are added by the deferred org_settings slice (plan
// Task 8), the runtime precondition for go-live. This resolver names
// the contract that slice must satisfy. It reads via `.select('*')` +
// an optional-field cast so it (a) typechecks today against the current
// db/types.ts, (b) returns a clean "not provisioned" ServiceError today
// (the fields are undefined), and (c) activates automatically once the
// slice adds the columns (the fields become populated). No path reaches
// this resolver until the provider is activated in the resolver
// (plan Task 6), which is itself gated on the slice.
//
// Per ADR-0020: Layer 2 data-access; reads via adminClient (providers
// are data-access-layer per ADR-0013 §1, like supabaseStorageProvider).

import { adminClient } from '@/db/adminClient';
import { ServiceError } from '@/services/errors/ServiceError';

export interface OrgDrive {
  siteId: string;
  driveId: string;
}

// The forward-column shape the org_settings slice (Task 8) must provide.
// Cast onto the `.select('*')` row, which today carries only the 11
// shipped columns (migration 20240158) — so these read as undefined
// until the slice lands.
interface OrgSettingsSharepointColumns {
  sharepoint_site_id?: string | null;
  sharepoint_drive_id?: string | null;
}

export async function resolveOrgDrive(org_id: string): Promise<OrgDrive> {
  const db = adminClient();
  const { data, error } = await db
    .from('org_settings')
    .select('*')
    .eq('org_id', org_id)
    .maybeSingle();

  if (error) {
    throw new ServiceError(
      'STORAGE_OPERATION_FAILED',
      `org_settings read failed for org ${org_id}: ${error.message}`,
      { stage: 'org_drive_resolve', underlying: error.message },
    );
  }

  const row = (data ?? null) as OrgSettingsSharepointColumns | null;
  const siteId = row?.sharepoint_site_id ?? null;
  const driveId = row?.sharepoint_drive_id ?? null;

  if (!siteId || !driveId) {
    throw new ServiceError(
      'STORAGE_OPERATION_FAILED',
      `SharePoint site/drive not provisioned for org ${org_id}. The ` +
        'org_settings.sharepoint_site_id / sharepoint_drive_id columns ' +
        'land with the deferred org_settings slice (plan Task 8).',
      { stage: 'org_drive_resolve', org_id },
    );
  }

  return { siteId, driveId };
}
