// src/services/storage/providers/graph/orgDriveResolver.ts
//
// Resolves an org's SharePoint site + drive for the sharepoint_drive
// provider (spec D-B3: per-org site/drive lives in org_settings).
//
// Reads the per-org SharePoint site/drive from org_settings (spec D-B3).
// The columns `sharepoint_site_id` / `sharepoint_drive_id` are DEFINED by
// migration 20240179000000_charter_b_org_settings_storage_slice.sql (which
// also added default_storage_provider) and typed in db/types.ts — they are
// NOT forward-columns. (Re-verify presence in any given environment:
// `select column_name from information_schema.columns where
// table_name='org_settings'`.) The sharepoint_drive provider is wired and
// active too (services/storage/resolver.ts). So the remaining runtime gate
// is VALUE POPULATION, not column existence or activation: this resolver
// returns a clean "not provisioned" ServiceError when the columns are NULL
// for the org, and resolves once they're populated (the per-org
// provisioning write + Azure app registration). Reads via `.select('*')`
// + an optional-field cast (predates the column landing; harmless).
//
// Per ADR-0020: Layer 2 data-access; reads via adminClient (providers
// are data-access-layer per ADR-0013 §1, like supabaseStorageProvider).

import { adminClient } from '@/db/adminClient';
import { ServiceError } from '@/services/errors/ServiceError';

export interface OrgDrive {
  siteId: string;
  driveId: string;
}

// Local cast for the two SharePoint columns on the `.select('*')` row.
// Both are defined by migration 20240179000000 (org_settings also gained
// default_storage_provider); they read as the stored value, or null for an
// org that hasn't been provisioned yet.
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
      `SharePoint site/drive not provisioned for org ${org_id}: ` +
        'org_settings.sharepoint_site_id / sharepoint_drive_id are null. ' +
        'Populate them (the per-org provisioning write) and complete the ' +
        'Azure app registration before go-live.',
      { stage: 'org_drive_resolve', org_id },
    );
  }

  return { siteId, driveId };
}
