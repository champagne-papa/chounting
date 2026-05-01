// tests/integration/auditLogNestedPiiRedaction.test.ts
//
// LT-02(d) — integration-level nested-PII redaction at audit_log
// write time. Path C arc, S31 sub-item (d) per AMENDMENT 4 narrow
// scope: integration complement to CA-25 (unit-level pure-function
// coverage at tests/unit/recordMutationPiiRedaction.test.ts) and
// CA-15 (integration-level FLAT-PII via userProfileService.update-
// Profile at tests/integration/userProfileAudit.test.ts).
//
// What this file pins:
//   1. recordMutation() persists redacted before_state when PII is
//      nested at depth 4 (within REDACT_DEPTH_LIMIT = 8).
//   2. The warnedAtLimit.fired latch in redactRecursive emits the
//      depth-limit warn EXACTLY ONCE per redactPii() invocation,
//      not per depth-exceeded element. The audit row still lands
//      (warn-and-continue per S28 pre-decision 3).
//
// Naming-asymmetry honest encoding (S28 closeout NOTE category iv
// — load-bearing-substrate, not bug):
//   - audit_log redactPii() strips the PII_FIELDS list
//     (`invited_email`, `phone`, `first_name`, `last_name`,
//     `display_name`) recursively to depth 8.
//   - pino REDACT_CONFIG.paths strips `*.email`, `*.phone`,
//     `*.first_name`, `*.last_name`, `*.display_name` at single-
//     level only.
//   - Field-name mismatch (`invited_email` vs `email`,
//     specifically) is intentional per S28: PII_FIELDS targets
//     `org_invitations.invited_email` which is what flows through
//     audit_log before_state today; pino's `*.email` anticipates a
//     Phase 2 broader email-name surface.
// This file does NOT assert pino-side behavior (orthogonal layer;
// Phase 2 multi-level-pino + financial-PII path remediation is the
// consolidated obligation tracking the asymmetry).

import { describe, it, expect, afterAll, vi } from 'vitest';
import { adminClient, SEED } from '../setup/testDb';
import { recordMutation } from '@/services/audit/recordMutation';
import type { ServiceContext } from '@/services/middleware/serviceContext';

describe('LT-02(d): audit_log integration — nested-PII redaction at write time', () => {
  const db = adminClient();
  const traceId = crypto.randomUUID();
  const ctx: ServiceContext = {
    trace_id: traceId,
    caller: {
      verified: true,
      user_id: SEED.USER_CONTROLLER,
      email: 'controller@thebridge.local',
      org_ids: [SEED.ORG_HOLDING],
    },
    locale: 'en',
  };

  afterAll(async () => {
    // Best-effort hygiene; INV-AUDIT-002 append-only triggers
    // silently reject deletes. Per-run unique trace_id is the
    // primary isolation mechanism.
    await db.from('audit_log').delete().eq('trace_id', traceId);
  });

  it('persists redacted before_state when PII is nested at depth 4', async () => {
    const action = 's31.lt02d_nested_depth4';

    await recordMutation(db, ctx, {
      org_id: SEED.ORG_HOLDING,
      action,
      entity_type: 'test_entity',
      entity_id: SEED.USER_CONTROLLER,
      before_state: {
        a: {
          b: {
            c: {
              invited_email: 'leak@example.com',
              phone: '+1-555-0000',
              outer_keep: 'visible',
            },
            sibling_keep: 'also visible',
          },
        },
        top_keep: 'top visible',
      },
      idempotency_key: crypto.randomUUID(),
    });

    const { data: rows } = await db
      .from('audit_log')
      .select('before_state')
      .eq('trace_id', traceId)
      .eq('action', action);

    expect(rows).toHaveLength(1);
    const before = rows![0].before_state as Record<string, unknown>;

    // Top-level non-PII preserved.
    expect(before.top_keep).toBe('top visible');

    // Depth-2 sibling preserved.
    const a = before.a as Record<string, unknown>;
    const b = a.b as Record<string, unknown>;
    expect(b.sibling_keep).toBe('also visible');

    // Depth-4 PII removed; non-PII sibling at depth 4 preserved.
    const c = b.c as Record<string, unknown>;
    expect(c.outer_keep).toBe('visible');
    expect(c.invited_email).toBeUndefined();
    expect(c.phone).toBeUndefined();
  });

  it('emits depth-limit warn EXACTLY ONCE per recordMutation when before_state exceeds REDACT_DEPTH_LIMIT', async () => {
    const action = 's31.lt02d_depth_limit_exceeded';

    // Construct a fixture deeper than REDACT_DEPTH_LIMIT (8). A
    // chain `next -> next -> ... -> next -> phone` places PII
    // below the limit; depth counting starts at 0.
    const fixture: Record<string, unknown> = {};
    let cursor: Record<string, unknown> = fixture;
    for (let i = 0; i < 9; i++) {
      cursor.next = {} as Record<string, unknown>;
      cursor = cursor.next as Record<string, unknown>;
    }
    cursor.phone = 'DEEP_PII_VALUE';

    // Spy the production logger BEFORE the recordMutation call so
    // any warn fired during redactPii() is captured.
    const { logger } = await import('@/shared/logger/pino');
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});

    await recordMutation(db, ctx, {
      org_id: SEED.ORG_HOLDING,
      action,
      entity_type: 'test_entity',
      entity_id: SEED.USER_CONTROLLER,
      before_state: fixture,
      idempotency_key: crypto.randomUUID(),
    });

    // Sharp pin against latch regression: filter on the exact
    // warn-message string (locked verbatim per S28 pre-decision 3)
    // so unrelated warns from the supabase insert path or other
    // call sites don't false-pass / false-fail this assertion.
    // Filtered count must be exactly 1 — a regression toward
    // per-element firing would surface here as N > 1.
    const piiDepthWarnCalls = warnSpy.mock.calls.filter(
      ([, msg]) =>
        msg === 'redactPii: depth limit exceeded; partial redaction',
    );
    expect(piiDepthWarnCalls).toHaveLength(1);

    // The single matching call carries depth_limit: 8 in its
    // structured payload.
    expect(piiDepthWarnCalls[0]?.[0]).toMatchObject({ depth_limit: 8 });

    warnSpy.mockRestore();

    // Audit row landed despite depth-limit-exceeded
    // (warn-and-continue, not throw).
    const { data: rows } = await db
      .from('audit_log')
      .select('before_state')
      .eq('trace_id', traceId)
      .eq('action', action);

    expect(rows).toHaveLength(1);
    expect(rows![0].before_state).toBeDefined();
    expect(rows![0].before_state).not.toBeNull();
  });
});
