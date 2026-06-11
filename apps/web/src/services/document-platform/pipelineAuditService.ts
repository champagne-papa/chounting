// src/services/document-platform/pipelineAuditService.ts
//
// Arc 2 T2 (agent→adminClient cleanup) — the pipeline audit-emit
// transport, hoisted from the three Tier-2/Tier-C emit sites
// (aiFallbackExtractorBase.ts, classifier/aiFallback.ts,
// failureClassification.ts) per ADR-0020 Appendix A (agent →
// services → db; Law 1). The agent files keep their local
// emitAuditEvent wrappers — entry construction, best-effort
// try/catch, and per-file log tags stay where they were
// (behavior-preserving hoist); only the adminClient handle moves
// to the services layer.
//
// No withInvariants, per the recordMutation precedent this wraps:
// audit emission is the mechanism withInvariants itself relies on
// (wrapping would be circular), and the pipeline callers hold a
// SystemActorServiceContext authorized at the pipeline entry —
// org_id comes from pipeline context, not from an end-caller. This
// function THROWS on emit failure; best-effort isolation (audit
// failure must not mask pipeline failure, Pattern B F-J-4) is
// owned by the callers' catch blocks, exactly as pre-hoist.

import { adminClient } from '@/db/adminClient';
import { recordMutation } from '@/services/audit/recordMutation';
import type { AuditEntry } from '@/services/audit/recordMutation';
import type {
  ServiceContext,
  SystemActorServiceContext,
} from '@/services/middleware/serviceContext';

export async function emitPipelineAuditEvent(
  ctx: ServiceContext | SystemActorServiceContext,
  entry: AuditEntry,
): Promise<void> {
  await recordMutation(adminClient(), ctx, entry);
}
