// tests/integration/soft8EntryEightReplay.test.ts
// OI-2 fix-stack handshake Soft 8 (Phase C Step 3). Replays the
// canonical Entry 8 prompt (docs/07_governance/ec-2-prompt-set.md
// lines 199-208) through a mocked Anthropic client to verify the
// foundation-commit resolver wiring fires AND the orphan-prevention
// property holds (a pending ai_actions row paired with a
// ProposedEntryCard whose idempotency_key matches the row's).
//
// Distinguishing value over agentOrgIdInjection.test.ts (which
// already covers row+card pairing under SEED.ORG_HOLDING with an
// explicit-date prompt):
//   1. Canonical Entry 8 prompt verbatim — exercises the "today"
//      relative-date resolver path (existing test uses an
//      explicit-date prompt that bypasses the resolver).
//   2. Targets SEED.ORG_REAL_ESTATE (the handshake org).
//   3. Threads through the pre-minted handshake session_id
//      'b54bf6fc-0a13-4c8b-8567-c5a2fc8b2772' so the row-under-
//      test ties back to the handshake artifact in the run record.
//   4. Asserts the system prompt contained the resolved-date line
//      (Path β — uses __getLastClaudeCallParams() spy added to
//      callClaude.ts in this same change).
//
// Cleanup posture: this test does NOT delete the handshake
// agent_session row or the ai_actions row it produces. Both are
// preserved as evidence in the run record. Re-runs accumulate
// ai_actions rows under the handshake session_id; assertions
// scope by trace_id (unique per run) so each invocation
// independently locates its own row.
//
// beforeEach upsert (Path A) — peer integration tests blanket-
// delete agent_sessions for SEED.USER_CONTROLLER in their own
// afterEach, which sweeps the handshake row whenever the full
// suite runs Soft 8 after one of those tests. The upsert
// re-creates the row at the same session_id every invocation so
// the test is robust regardless of suite ordering.
//
// On-conflict semantics: the upsert payload omits started_at, so
// the existing started_at column survives an upsert that hits an
// existing row — the handshake mintage timestamp from Phase C
// Step 2 (2026-04-26T04:03:40Z) is preserved across re-runs as
// long as the row was not deleted. State/conversation/turns
// reset to empty arrays on every fire.
//
// Re-seed interaction: pnpm db:seed:all does not know about
// handshake artifacts, so a mid-handshake re-seed will drop the
// row entirely. The next Soft 8 run re-creates it via this
// beforeEach with the same session_id; started_at will be the
// fresh upsert-insert time, not the original mintage. The UUID
// identity persists through code (this beforeEach), not through
// DB durability.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { handleUserMessage } from '@/agent/orchestrator';
import {
  __setMockFixtureQueue,
  __getLastClaudeCallParams,
} from '@/agent/orchestrator/callClaude';
import {
  entry8PostTurn,
  entry8RespondTurn,
} from '../fixtures/anthropic/entry8FirstAttempt';
import { makeTestContext } from '../setup/makeTestContext';
import { adminClient } from '@/db/adminClient';
import { SEED } from '../setup/testDb';

const HANDSHAKE_SESSION_ID = 'b54bf6fc-0a13-4c8b-8567-c5a2fc8b2772';

const ENTRY_8_PROMPT =
  'Client Yonge Dental paid us $12,000 today for a six-month retainer ' +
  'starting May 1. Nothing delivered yet.';

// Seed values for SEED.ORG_REAL_ESTATE ('22222222-...').
// fiscal_period: FY Current (2026-01-01 to 2026-12-31), covers any
// date the runtime resolves "today" to. Account UUIDs from the
// CoA seed for this org.
const ORG_REAL_ESTATE_FISCAL_PERIOD_ID =
  'bf8d7172-ea4b-4baf-8a4d-f9285bbd3203';
const ACCOUNT_CASH = '369bed83-4b92-4d99-9d05-c4c661a54a08';
const ACCOUNT_UNEARNED_REVENUE = '4aab3cbc-9ff4-4f6a-8778-b9f701a3aa47';

// Compute today's resolved date in the supplied tz the same way
// resolveRelativeDate.ts:122-134 does. Test and orchestrator both
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

describe('Soft 8: OI-2 fix-stack canonical Entry 8 replay (handshake S9-0425)', () => {
  beforeEach(async () => {
    // Path A: upsert the handshake row by session_id so the test
    // survives peer-test sweeps. started_at is omitted from the
    // payload; on conflict, the column's existing value is
    // preserved (handshake mintage timestamp survives across
    // re-runs unless the row was deleted by a peer test or
    // db:seed:all). state/conversation/turns reset to empty.
    const { error } = await adminClient()
      .from('agent_sessions')
      .upsert(
        {
          session_id: HANDSHAKE_SESSION_ID,
          user_id: SEED.USER_CONTROLLER,
          org_id: SEED.ORG_REAL_ESTATE,
          locale: 'en',
          state: {},
          conversation: [],
          turns: [],
        },
        { onConflict: 'session_id' },
      );
    expect(error).toBeNull();
  });

  afterEach(() => {
    __setMockFixtureQueue(null);
    // No agent_sessions or ai_actions delete — handshake artifact
    // preserved as run-record evidence. See header comment.
  });

  it('resolves "today" → today\'s date, fires Site 1+2 wiring, ships row+card pairing', async () => {
    const tz = 'UTC';
    const expectedResolvedDate = todayIsoInTz(tz);

    __setMockFixtureQueue([
      entry8PostTurn(
        expectedResolvedDate,
        ORG_REAL_ESTATE_FISCAL_PERIOD_ID,
        ACCOUNT_CASH,
        ACCOUNT_UNEARNED_REVENUE,
      ),
      entry8RespondTurn(expectedResolvedDate),
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
        message: ENTRY_8_PROMPT,
        session_id: HANDSHAKE_SESSION_ID,
      },
      ctx,
    );

    // ===== Path β: system prompt contained the resolved-date line =====
    // Last-call-wins: orchestrator's main loop fires callClaude
    // twice (postTurn → tool_result → respondTurn). `system` is
    // computed once outside the loop and is identical across calls.
    const lastParams = __getLastClaudeCallParams();
    expect(lastParams).not.toBeNull();
    const systemPrompt = lastParams!.system as string;
    expect(typeof systemPrompt).toBe('string');
    expect(systemPrompt).toContain(
      `Resolved entry_date for this turn: ${expectedResolvedDate} (from phrase: "today")`,
    );

    // ===== Structural row+card pairing — the orphan-prevention property =====
    // Scope by trace_id so re-runs independently locate their row.
    const db = adminClient();
    const { data: row, error: rowErr } = await db
      .from('ai_actions')
      .select(
        'ai_action_id, org_id, session_id, status, idempotency_key, tool_input, trace_id',
      )
      .eq('session_id', HANDSHAKE_SESSION_ID)
      .eq('trace_id', ctx.trace_id)
      .maybeSingle();
    expect(rowErr).toBeNull();
    expect(row).not.toBeNull();
    expect(row!.org_id).toBe(SEED.ORG_REAL_ESTATE);
    expect(row!.session_id).toBe(HANDSHAKE_SESSION_ID);
    // 'pending' is the by-design dry-run terminal — not an orphan
    // unless no card pairs with it (asserted below).
    expect(row!.status).toBe('pending');
    expect(typeof row!.idempotency_key).toBe('string');
    expect(row!.idempotency_key).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    const toolInput = row!.tool_input as Record<string, unknown>;
    // entry_date round-tripping through the fixture proves the
    // model emitted what it should have emitted given the resolved-
    // date line in the system prompt; combined with the Path β
    // assertion above, this is the integration-level proof that
    // the foundation-commit wiring fired end-to-end.
    expect(toolInput.entry_date).toBe(expectedResolvedDate);
    expect(toolInput.org_id).toBe(SEED.ORG_REAL_ESTATE);

    // The card in response.canvas_directive must pair with the row
    // by idempotency_key (Site 2 post-fill). A pending row with a
    // matching card means the UI has a handle to confirm/reject —
    // the C6 "orphan" stalls were rows-without-cards.
    expect(response.canvas_directive).toBeDefined();
    const directive = response.canvas_directive as {
      type: string;
      card?: Record<string, unknown>;
    };
    expect(directive.type).toBe('proposed_entry_card');
    expect(directive.card).toBeDefined();
    expect(directive.card!.idempotency_key).toBe(row!.idempotency_key);
    // Defensive depth — Site 2 post-fill stamps these too.
    expect(directive.card!.org_id).toBe(SEED.ORG_REAL_ESTATE);
    expect(directive.card!.trace_id).toBe(ctx.trace_id);

    // Foundation-commit signature: response is the structured
    // success template, not a clarification (span gate) or error
    // (dow gate / Q13 / structural retry).
    expect(response.response.template_id).toBe('agent.entry.proposed');
    expect(response.session_id).toBe(HANDSHAKE_SESSION_ID);
  });
});
