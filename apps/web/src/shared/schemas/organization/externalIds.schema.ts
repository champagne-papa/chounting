import { z } from 'zod';

// Phase 1.5A — typed-key contract for organizations.external_ids.
// See docs/09_briefs/phase-1.5/brief.md §11.
//
// The column is jsonb with a DB-level CHECK that it is a JSON object
// (org_external_ids_is_object). Known keys below must match their
// declared type when present. Unknown keys are permitted (passthrough)
// so new integrations can land without a schema change before
// graduating to "known." Adding a new known key is a schema change
// to this file, NOT a silent data write.

const orgExternalIdsShape = z
  .object({
    stripe_customer_id: z.string().optional(),
    xero_tenant_id: z.string().optional(),
    flinks_login_id: z.string().optional(),
    cra_business_id: z.string().optional(),
    zoho_organization_id: z.string().optional(),
  })
  .passthrough();

export const orgExternalIdsSchema = orgExternalIdsShape;

export type OrgExternalIds = z.infer<typeof orgExternalIdsSchema>;
