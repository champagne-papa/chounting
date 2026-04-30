// src/services/accounting/taxCodeService.ts
// Tax code reads. Tax codes are globally-readable shared reference data
// (RLS: FOR SELECT TO authenticated USING (true) when org_id IS NULL).

import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';

export type TaxCodeListItem = {
  tax_code_id: string;
  code: string;
  rate: string;
  jurisdiction: string;
  effective_from: string;
  effective_to: string | null;
};

export const taxCodeService = {
  /**
   * Lists all shared tax codes (org_id IS NULL).
   * No authorization check: tax codes are globally readable per RLS policy.
   * The ctx parameter is taken for consistency with other service functions
   * (trace_id propagation) but not used for auth.
   */
  // withInvariants: skip-org-check (pattern-G2: globally-shared reference data, RLS allows authenticated read)
  async listShared(ctx: ServiceContext): Promise<TaxCodeListItem[]> {
    const db = adminClient();

    const { data, error } = await db
      .from('tax_codes')
      .select('tax_code_id, code, rate, jurisdiction, effective_from, effective_to')
      .is('org_id', null)
      .order('code');

    if (error) throw new ServiceError('READ_FAILED', error.message);
    return (data ?? []) as TaxCodeListItem[];
  },
};
