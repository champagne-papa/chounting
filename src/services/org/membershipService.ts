// src/services/org/membershipService.ts
// Membership CRUD operations for orgs.
// Phase 1.1: list memberships for a user. Richer operations in Phase 1.2+.

import { adminClient } from '@/db/adminClient';
import type { ServiceContext } from '@/services/middleware/serviceContext';
import { loggerWith } from '@/shared/logger/pino';

export const membershipService = {
  /**
   * Lists all org memberships for the caller.
   */
  async listForUser(
    input: { user_id: string },
    ctx: ServiceContext,
  ) {
    const log = loggerWith({ trace_id: ctx.trace_id, user_id: ctx.caller.user_id });
    const db = adminClient();

    const { data, error } = await db
      .from('memberships')
      .select('org_id, role, organizations(name)')
      .eq('user_id', input.user_id);

    if (error) {
      log.error({ error }, 'Failed to list memberships');
      throw error;
    }

    return data ?? [];
  },
};
