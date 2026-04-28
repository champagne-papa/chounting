// tests/integration/soft9OI3PromptSurgery.test.ts
// OI-3 Part 4 — durable integration test for canvas_directive
// emission discipline post §4a/§4b/§4c prompt-surgery shipped in
// Commit 1 of S19. Four assertions:
//   1. Productive path: Entry 12 shape (Cash + Consulting Revenue)
//      — agent emits agent.entry.proposed + canvas_directive
//      without tentative; row+card pairing holds.
//   2. Tentative path: Entry 15 shape (Allowance write-off:
//      Allowance for Doubtful Accounts ↓ AR ↓) — agent emits
//      tentative: true on the card. Exercises the §3c (a) flag
//      shipped at 22b63c4.
//   3. No-directive path: non-proposal clarification ("why was
//      this posted?") — agent emits agent.response.natural with
//      no canvas_directive; no ai_actions row this turn.
//   4. Strict-schema rejection: malformed canvas_directive (single
//      line, violates ProposedEntryCardSchema's lines.min(2)) —
//      handleUserMessage throws because the respondToUser tool-
//      input wrapper Zod check rejects the directive shape before
//      Site 2's defense-in-depth ProposedEntryCardSchema.parse()
//      runs (the wrapper is upstream of Site 2; defense-in-depth
//      is layered and the wrapper layer fires first). Site 1's
//      ai_actions row IS inserted (postJournalEntry tool runs
//      before respondToUser); the orphaned row IS the Class 2
//      signature §4a/§4b/§4c defends against.
//
// Distinguishing value over Soft 8:
//   - Soft 8 covers Path β (resolved-date system-prompt line) +
//     row+card pairing on the productive path only.
//   - Soft 9 covers all four canvas_directive emission paths.
//   - P2 runtime lookup: account_id and period_id resolved by
//     natural key (org_id + account_code; org_id + name +
//     is_locked) from src/db/seed/dev.sql at beforeEach. Soft 8's
//     hardcoded UUIDs are post-seed snapshots (silently fragile to
//     db:reset:clean); Soft 9's lookup discipline is the
//     long-term pattern for fixture identity assertions per
//     Convention #8.
//
// Cleanup posture: this test does NOT delete the Soft 9 session
// row or the ai_actions rows it produces. Both are preserved as
// evidence in the run record per Soft 8's pattern. Re-runs
// accumulate ai_actions rows under the Soft 9 session_id;
// per-assertion rows are scoped by trace_id (unique per ctx).

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { handleUserMessage } from '@/agent/orchestrator';
import { __setMockFixtureQueue } from '@/agent/orchestrator/callClaude';
import {
  entry12ProductivePostTurn,
  entry12ProductiveRespondTurn,
  entry15TentativePostTurn,
  entry15TentativeRespondTurn,
  noDirectiveRespondTurn,
  malformedDirectiveRespondTurn,
} from '../fixtures/anthropic/oi3-class-2-shapes';
import { makeTestContext } from '../setup/makeTestContext';
import { adminClient } from '@/db/adminClient';
import { SEED } from '../setup/testDb';

const SOFT9_SESSION_ID = 'c8a31f72-9d4e-4b6a-b2e5-3f6a1d8c92b7';

const ENTRY_12_PROMPT =
  'Recorded $1,500 consulting fee paid in cash today.';
const ENTRY_15_PROMPT =
  'Some receivables look uncollectible — write off $1,000 against the allowance.';
const NO_DIRECTIVE_PROMPT =
  'Why was the last entry posted that way?';

// Compute today's resolved date in the supplied tz the same way
// Soft 8 does (resolveRelativeDate.ts:122-134). Test and orchestrator
// observe the same system clock — assertion is self-consistent.
function todayIsoInTz(tz: string): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year')!.value;
  const m = parts.find((p) => p.type === 'month')!.value;
  const d = parts.find((p) => p.type === 'day')!.value;
  return `${y}-${m}-${d}`;
}

describe('Soft 9: OI-3 prompt-surgery canvas_directive emission discipline', () => {
  let accountByCode: Record<string, string>;
  let fiscalPeriodId: string;

  beforeEach(async () => {
    // Pattern A: upsert the Soft 9 session row by session_id so the
    // test survives peer-test sweeps. started_at is omitted from the
    // payload; on conflict, the column's existing value is preserved.
    const { error: sessErr } = await adminClient()
      .from('agent_sessions')
      .upsert(
        {
          session_id: SOFT9_SESSION_ID,
          user_id: SEED.USER_CONTROLLER,
          org_id: SEED.ORG_REAL_ESTATE,
          locale: 'en',
          state: {},
          conversation: [],
          turns: [],
        },
        { onConflict: 'session_id' },
      );
    expect(sessErr).toBeNull();

    // P2 runtime lookup — resolve account UUIDs by (org_id,
    // account_code). Natural key committed in src/db/seed/dev.sql
    // (lines 59-60 for AR/Allowance, line 76 for Consulting
    // Revenue) and supabase/migrations/20240101000000_initial_
    // schema.sql line 868 (Cash, via the real_estate template).
    const { data: accounts, error: accErr } = await adminClient()
      .from('chart_of_accounts')
      .select('account_id, account_code')
      .eq('org_id', SEED.ORG_REAL_ESTATE)
      .in('account_code', ['1000', '4300', '1600', '1610']);
    expect(accErr).toBeNull();
    accountByCode = Object.fromEntries(
      (accounts ?? []).map((a) => [a.account_code, a.account_id]),
    );
    expect(accountByCode['1000']).toBeDefined(); // Cash and Cash Equivalents
    expect(accountByCode['4300']).toBeDefined(); // Consulting Revenue
    expect(accountByCode['1600']).toBeDefined(); // Accounts Receivable
    expect(accountByCode['1610']).toBeDefined(); // Allowance for Doubtful Accounts

    // P2 runtime lookup — resolve period_id by (org_id, name,
    // is_locked). The seed plants one open 'FY Current' per org
    // (dev.sql line 117) plus one locked 'FY Prior (LOCKED)' for
    // ORG_REAL_ESTATE (dev.sql line 122). Filter pins the open one.
    const { data: fp, error: fpErr } = await adminClient()
      .from('fiscal_periods')
      .select('period_id')
      .eq('org_id', SEED.ORG_REAL_ESTATE)
      .eq('name', 'FY Current')
      .eq('is_locked', false)
      .maybeSingle();
    expect(fpErr).toBeNull();
    expect(fp).not.toBeNull();
    fiscalPeriodId = fp!.period_id as string;
  });

  afterEach(() => {
    __setMockFixtureQueue(null);
    // No agent_sessions or ai_actions delete — Soft 9 artifacts
    // preserved as run-record evidence per Soft 8's pattern.
  });

  it('Assertion 1 — productive path: agent.entry.proposed + canvas_directive without tentative', async () => {
    const tz = 'UTC';
    const expectedResolvedDate = todayIsoInTz(tz);

    __setMockFixtureQueue([
      entry12ProductivePostTurn(
        expectedResolvedDate,
        fiscalPeriodId,
        accountByCode['1000'],
        accountByCode['4300'],
      ),
      entry12ProductiveRespondTurn(expectedResolvedDate),
    ]);

    const ctx = makeTestContext({
      user_id: SEED.USER_CONTROLLER,
      org_ids: [SEED.ORG_REAL_ESTATE],
    });

    const response = await handleUserMessage(
      {
        user_id: SEED.USER_CONTROLLER,
        org_id: SEED.ORG_REAL_ESTATE,
        locale: 'en',
        tz,
        message: ENTRY_12_PROMPT,
        session_id: SOFT9_SESSION_ID,
      },
      ctx,
    );

    expect(response.response.template_id).toBe('agent.entry.proposed');
    expect(response.canvas_directive).toBeDefined();
    const directive = response.canvas_directive as {
      type: string;
      card?: Record<string, unknown>;
    };
    expect(directive.type).toBe('proposed_entry_card');
    expect(directive.card).toBeDefined();
    // Productive — tentative flag absent.
    expect(directive.card!.tentative).toBeUndefined();

    // Row+card pairing — orphan-prevention property.
    const db = adminClient();
    const { data: row, error: rowErr } = await db
      .from('ai_actions')
      .select('ai_action_id, status, idempotency_key, trace_id')
      .eq('session_id', SOFT9_SESSION_ID)
      .eq('trace_id', ctx.trace_id)
      .maybeSingle();
    expect(rowErr).toBeNull();
    expect(row).not.toBeNull();
    expect(row!.status).toBe('pending');
    expect(directive.card!.idempotency_key).toBe(row!.idempotency_key);
  });

  it('Assertion 2 — tentative path: agent.entry.proposed + canvas_directive with tentative: true', async () => {
    const tz = 'UTC';
    const expectedResolvedDate = todayIsoInTz(tz);

    __setMockFixtureQueue([
      entry15TentativePostTurn(
        expectedResolvedDate,
        fiscalPeriodId,
        accountByCode['1610'],
        accountByCode['1600'],
      ),
      entry15TentativeRespondTurn(expectedResolvedDate),
    ]);

    const ctx = makeTestContext({
      user_id: SEED.USER_CONTROLLER,
      org_ids: [SEED.ORG_REAL_ESTATE],
    });

    const response = await handleUserMessage(
      {
        user_id: SEED.USER_CONTROLLER,
        org_id: SEED.ORG_REAL_ESTATE,
        locale: 'en',
        tz,
        message: ENTRY_15_PROMPT,
        session_id: SOFT9_SESSION_ID,
      },
      ctx,
    );

    expect(response.response.template_id).toBe('agent.entry.proposed');
    expect(response.canvas_directive).toBeDefined();
    const directive = response.canvas_directive as {
      type: string;
      card?: Record<string, unknown>;
    };
    expect(directive.type).toBe('proposed_entry_card');
    expect(directive.card).toBeDefined();
    // §3c (a) flag — tentative true on ambiguous proposals.
    expect(directive.card!.tentative).toBe(true);

    // Row+card pairing also holds on tentative.
    const db = adminClient();
    const { data: row, error: rowErr } = await db
      .from('ai_actions')
      .select('ai_action_id, status, idempotency_key, trace_id')
      .eq('session_id', SOFT9_SESSION_ID)
      .eq('trace_id', ctx.trace_id)
      .maybeSingle();
    expect(rowErr).toBeNull();
    expect(row).not.toBeNull();
    expect(row!.status).toBe('pending');
    expect(directive.card!.idempotency_key).toBe(row!.idempotency_key);
  });

  it('Assertion 3 — no-directive path: agent.response.natural; no canvas_directive; no ai_actions row', async () => {
    const tz = 'UTC';

    __setMockFixtureQueue([noDirectiveRespondTurn()]);

    const ctx = makeTestContext({
      user_id: SEED.USER_CONTROLLER,
      org_ids: [SEED.ORG_REAL_ESTATE],
    });

    const response = await handleUserMessage(
      {
        user_id: SEED.USER_CONTROLLER,
        org_id: SEED.ORG_REAL_ESTATE,
        locale: 'en',
        tz,
        message: NO_DIRECTIVE_PROMPT,
        session_id: SOFT9_SESSION_ID,
      },
      ctx,
    );

    expect(response.response.template_id).toBe('agent.response.natural');
    expect(response.canvas_directive).toBeUndefined();

    // No ai_actions row scoped to this trace_id.
    const db = adminClient();
    const { data: rows, error: rowErr } = await db
      .from('ai_actions')
      .select('ai_action_id')
      .eq('session_id', SOFT9_SESSION_ID)
      .eq('trace_id', ctx.trace_id);
    expect(rowErr).toBeNull();
    expect(rows ?? []).toHaveLength(0);
  });

  it('Assertion 4 — strict-schema rejection: respondToUser wrapper Zod throws; Site 1 ai_actions row remains orphaned', async () => {
    const tz = 'UTC';
    const expectedResolvedDate = todayIsoInTz(tz);

    __setMockFixtureQueue([
      entry12ProductivePostTurn(
        expectedResolvedDate,
        fiscalPeriodId,
        accountByCode['1000'],
        accountByCode['4300'],
      ),
      malformedDirectiveRespondTurn(expectedResolvedDate),
    ]);

    const ctx = makeTestContext({
      user_id: SEED.USER_CONTROLLER,
      org_ids: [SEED.ORG_REAL_ESTATE],
    });

    // Load-bearing assertion: handleUserMessage throws because the
    // respondToUser tool-input wrapper Zod check rejects the
    // single-line lines.min(2) violation. The wrapper is the
    // upstream gate; Site 2's defense-in-depth parse() at
    // orchestrator/index.ts:862 is downstream of the wrapper and
    // runs only when the wrapper accepts the directive shape.
    await expect(
      handleUserMessage(
        {
          user_id: SEED.USER_CONTROLLER,
          org_id: SEED.ORG_REAL_ESTATE,
          locale: 'en',
          tz,
          message: ENTRY_12_PROMPT,
          session_id: SOFT9_SESSION_ID,
        },
        ctx,
      ),
    ).rejects.toThrow();

    // Informational: Site 1 fired during postJournalEntry tool
    // execution before the wrapper rejected respondToUser —
    // ai_actions row IS inserted (status: 'pending', no paired
    // card). This IS the Class 2 orphan signature, which is why
    // §4a/§4b/§4c prompt-surgery makes canvas_directive emission
    // load-bearing.
    const db = adminClient();
    const { data: row, error: rowErr } = await db
      .from('ai_actions')
      .select('ai_action_id, status, idempotency_key, trace_id')
      .eq('session_id', SOFT9_SESSION_ID)
      .eq('trace_id', ctx.trace_id)
      .maybeSingle();
    expect(rowErr).toBeNull();
    expect(row).not.toBeNull();
    expect(row!.status).toBe('pending');
  });
});
