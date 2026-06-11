// src/services/audit/preResolutionAuditService.ts
//
// UF-006 / ADR-0020 (app→adminClient cleanup): pre-resolution audit
// emission, hoisted from the postmark-inbound webhook route (app →
// services → db; Law 1). Bare exported function (extractionReadService
// precedent) — not an org-scoped service-object, so the
// withInvariants-wrap-or-annotate rule does not apply, and there is no
// org to check (these events fire BEFORE an org_id can be resolved).
//
// Pre-org system events (auth_invalid / malformed_payload /
// invalid_recipient) happen before an org_id is known; audit_log accepts
// org_id=null + user_id=null (migrations 113 + 154 + base) for them. A
// SystemActorServiceContext with an empty-string org_id sentinel is
// constructed here; recordMutation reads only ctx.caller.user_id +
// ctx.trace_id and writes entry.org_id (null), not ctx.org_id. The write
// is non-blocking: a failure is logged and swallowed (webhook idempotency
// means a retry re-emits). Behaviour is byte-identical to the pre-hoist
// route helper.

import { adminClient } from '@/db/adminClient';
import { recordMutation } from '@/services/audit/recordMutation';
import { loggerWith } from '@/shared/logger/pino';
import type { SystemActorServiceContext } from '@/services/middleware/serviceContext';

export async function emitPreResolutionAudit(input: {
  trace_id: string;
  system_actor: string;
  action: string;
  entity_type: string;
  before_state?: Record<string, unknown> | null;
}): Promise<void> {
  const log = loggerWith({ trace_id: input.trace_id });
  const db = adminClient();
  try {
    const ctx: SystemActorServiceContext = {
      trace_id: input.trace_id,
      caller: { user_id: null, system_actor: input.system_actor },
      // org_id is required at the type level. Empty string is the
      // unresolved sentinel; recordMutation writes entry.org_id (null
      // below) to the row, not ctx.org_id.
      org_id: '',
    };
    await recordMutation(db, ctx, {
      org_id: null,
      action: input.action,
      entity_type: input.entity_type,
      ...(input.before_state ? { before_state: input.before_state } : {}),
      tool_name: input.system_actor,
    });
  } catch (err) {
    // Non-blocking — log and continue with the response. Webhook
    // idempotency means retries still get their audit row eventually.
    log.warn(
      { underlying: err instanceof Error ? err.message : String(err) },
      'preResolutionAuditService: audit emit failed',
    );
  }
}
