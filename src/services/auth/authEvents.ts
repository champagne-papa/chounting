// src/services/auth/authEvents.ts
// Phase 1.5B — login/logout audit events.
// Called from sign-in/sign-out pages. audit_log.org_id is NULL
// for auth events (OQ-04 resolved — org_id is nullable).

import { adminClient } from '@/db/adminClient';

export async function recordLoginEvent(
  userId: string,
  traceId: string,
): Promise<void> {
  const db = adminClient();
  const { error } = await db.from('audit_log').insert({
    org_id: null,
    user_id: userId,
    trace_id: traceId,
    action: 'auth.login',
    entity_type: 'user',
    entity_id: userId,
  });
  if (error) {
    throw new Error(`[AUTH_EVENT_WRITE_FAILED] ${error.message}`);
  }
}

export async function recordLogoutEvent(
  userId: string,
  traceId: string,
): Promise<void> {
  const db = adminClient();
  const { error } = await db.from('audit_log').insert({
    org_id: null,
    user_id: userId,
    trace_id: traceId,
    action: 'auth.logout',
    entity_type: 'user',
    entity_id: userId,
  });
  if (error) {
    throw new Error(`[AUTH_EVENT_WRITE_FAILED] ${error.message}`);
  }
}
