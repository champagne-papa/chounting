# Phase 1.2 Session 2 Execution Sub-Brief — Orchestrator Skeleton

*This sub-brief drives Session 2 of Phase 1.2. The master brief at
`docs/09_briefs/phase-1.2/brief.md` (frozen at SHA aae547a) is the
architecture document and is never modified during execution. The
Session 1 sub-brief at `docs/09_briefs/phase-1.2/session-1-brief.md`
(committed at SHA 4a62faf) is the density and structure reference.
Where this sub-brief and the master brief disagree, the master brief
wins — stop and flag rather than deviate.*

---

## 1. Goal

Session 2 lands the agent orchestrator skeleton, all 10 tool
schemas, and the `respondToUser` enforcement mechanism — all
against a mocked `callClaude` that reads deterministic fixtures
from `tests/fixtures/anthropic/`. The full main loop per master
§5.2 executes end-to-end, the persona-whitelist tool-filtering per
§6.4 is enforced at orchestrator build time, `trace_id` propagates
through orchestrator → mocked tool calls → `ai_actions` writes,
the six new `ServiceErrorCode` values are added, and the
`dry_run` → confirm seam is in place. No real Anthropic API
calls, no onboarding flow, no form-escape surfaces, no UI
changes. Session 2 is "what would happen if we had Claude, but
built against a deterministic fake."

---

## 2. Master-brief sections implemented

Session 2 delivers:

- **§5.1** — `handleUserMessage` signature and `AgentResponse`
  types
- **§5.2** — 10-step main loop (against mocked `callClaude`)
- **§5.3** — `trace_id` propagation via `loggerWith`
- **§5.4** — degradation-path scaffolding (missing-key case
  returns `AGENT_UNAVAILABLE`; real API failure deferred to
  Session 4)
- **§5.5** — org-switch behavior (new session on org change)
- **§6.1** — 10 tool definitions with Zod-backed
  `zodToJsonSchema` inputs
- **§6.2** — `respondToUser` structured-response enforcement +
  structural retry
- **§6.3** — anti-hallucination rules (encoded in tool schemas
  via `.strict()`; system prompts land in Session 3)
- **§6.4** — per-persona tool whitelist helper
- **§6.5** — `dry_run` scope (ledger-only) encoded in schemas
- **§17** — six new `ServiceErrorCode` values

Sections NOT delivered (with pointers):

- §7 System Prompts → Session 3
- §8 OrgContextManager → Session 4
- §9.2–9.3 `AgentSession` TTL cleanup job → Phase 2 (lazy
  filter in load-or-create is already in Session 2)
- §10.2–10.3 `ProposedEntryCard` render + Four Questions i18n →
  Session 7
- §11 Onboarding Flow → Session 5
- §12 Form-Escape Surfaces → Session 6
- §13.2 `/api/agent/message` route handler → Session 4 (the
  orchestrator function lands here; route wiring lands with the
  real Claude call)
- §13.3 `/api/agent/confirm` route → Session 4
- §14 UI Changes → Session 7
- §15 Canvas Directive Extensions → Session 6
- §21 CA-39 through CA-49 — Session 2 lands CA-39 through
  roughly CA-47; the rest arrive in Sessions 4–8

---

## 3. Locked Decisions (inherited)

All decisions derive from master §3 (Q11–Q17, Q23–Q26, founder
decisions A–G) and the Session 1 sub-brief. **This session
re-opens nothing.** If an execution-time question arises that is
not covered by master §3 or a locked founder decision, stop and
flag it in `docs/02_specs/open_questions.md`.

---

## 4. Prerequisites

- Git clean at a SHA on top of Session 1 (`82247cb` or later,
  including the devex chore). Verify with `git status --short`.
- `pnpm test` green at **162/162** against the freshly-seeded DB
  (regression baseline). If not, fix the environment before
  starting — the Session 1 close-out documented the
  `pnpm db:reset:clean` workflow for Kong ↔ auth refresh.
- `@anthropic-ai/sdk@0.90.0` and `zod-to-json-schema@3.25.2`
  installed (Session 1 commit `44ecb4f`). Verify with
  `pnpm list @anthropic-ai/sdk zod-to-json-schema`.
- `ANTHROPIC_API_KEY` still **not** required — Session 2 mocks
  the API entirely via injected fixtures.
- `docker ps` shows Supabase containers running (the trace
  propagation test writes an `ai_actions` row).

---

## 5. Work items

Nine work items. The mock-based design means every commit leaves
`pnpm typecheck && pnpm test` green — there is no intentional red
intermediate state like Session 1's commits 2–3 coupling.

### 5.1 Add 6 new ServiceError codes

**File:** `src/services/errors/ServiceError.ts`. Append to the
`ServiceErrorCode` union. Codes per master §17:

```typescript
  // Agent (Phase 1.2)
  | 'AGENT_UNAVAILABLE'
  | 'AGENT_TOOL_VALIDATION_FAILED'
  | 'AGENT_SESSION_NOT_FOUND'
  | 'AGENT_SESSION_EXPIRED'
  | 'AGENT_STRUCTURED_RESPONSE_INVALID'
  | 'ONBOARDING_INCOMPLETE'
```

Session 2 exercises the first five; `ONBOARDING_INCOMPLETE` is
Session 5 but lands here so the union is complete and Sessions
3–5 don't have to touch this file again. All six are grouped
under a single `// Agent (Phase 1.2)` comment for cohesion.

### 5.2 Tool definitions — 10 tools + shared Zod schemas

**Directory layout:**

```
src/agent/tools/
  index.ts                     — barrel: exports all 10 tools
  updateUserProfile.ts
  createOrganization.ts
  updateOrgProfile.ts
  listIndustries.ts
  listChartOfAccounts.ts
  checkPeriod.ts
  listJournalEntries.ts
  postJournalEntry.ts
  reverseJournalEntry.ts
  respondToUser.ts
  schemas/
    createOrganization.schema.ts
    listChartOfAccounts.schema.ts
    checkPeriod.schema.ts
    listJournalEntries.schema.ts
    listIndustries.schema.ts
    respondToUser.schema.ts
```

**Per-tool export shape (example, `postJournalEntry.ts`):**

```typescript
import { PostJournalEntryInputSchema }
  from '@/shared/schemas/accounting/journalEntry.schema';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const postJournalEntryTool = {
  name: 'postJournalEntry',
  description: 'Create a journal entry. Always use dry_run=true on the first call.',
  input_schema: zodToJsonSchema(PostJournalEntryInputSchema),
  zodSchema: PostJournalEntryInputSchema,
} as const;
```

The `zodSchema` export is the raw Zod schema; the orchestrator
re-validates tool inputs against it at tool-execution time per
master §5.2 step 7 (defense-in-depth; the service layer
re-validates again). The `input_schema` JSON Schema is what
Claude sees in the tool definition.

**Existing Zod schemas (cited verbatim, no new Zod):**

| Tool | Zod schema | File |
|---|---|---|
| `updateUserProfile` | `updateUserProfilePatchSchema` | `src/shared/schemas/user/profile.schema.ts` |
| `updateOrgProfile` | `updateOrgProfilePatchSchema` | `src/shared/schemas/organization/profile.schema.ts` |
| `postJournalEntry` | `PostJournalEntryInputSchema` | `src/shared/schemas/accounting/journalEntry.schema.ts` |
| `reverseJournalEntry` | `ReversalInputSchema` | same file |

**New Zod schemas (all `.strict()`, cite master §6.1 for
shapes):**

- `createOrganization.schema.ts` — master §6.1 block under
  "createOrganization" (name, legalName, industryId,
  fiscalYearStartMonth, baseCurrency, businessStructure,
  timeZone, defaultLocale).
- `listChartOfAccounts.schema.ts` —
  `z.object({ org_id: z.string().uuid(), include_inactive: z.boolean().optional() }).strict()`
- `checkPeriod.schema.ts` —
  `z.object({ org_id: z.string().uuid(), entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).strict()`
- `listJournalEntries.schema.ts` —
  `z.object({ org_id: z.string().uuid(), limit: z.number().int().positive().default(20), offset: z.number().int().nonnegative().default(0) }).strict()`
- `listIndustries.schema.ts` — `z.object({}).strict()`
- `respondToUser.schema.ts` —
  `z.object({ template_id: z.string(), params: z.record(z.string(), z.unknown()), canvas_directive: canvasDirectiveSchema.optional() }).strict()`
  (cites existing `src/shared/types/canvasDirective.ts`; if only
  the type is exported and no Zod schema, create one in Session
  2 and flag.)

### 5.3 Orchestrator skeleton

**File:** `src/agent/orchestrator/index.ts`. Implements the full
`handleUserMessage` signature from master §5.1 and the 10-step
main loop from §5.2. Pure TypeScript — no Next.js-specific
imports, no route handlers. Accepts a `ServiceContext` (same
type API routes use via `buildServiceContext`) so Session 4
wires it into `/api/agent/message` mechanically.

`HandleUserMessageInput` and `AgentResponse` types are the
`input` and return types from master §5.1 verbatim — do not
redefine shapes here. The function accepts a `ServiceContext` as
the second parameter (standard service-function signature; see
`withInvariants.ts`).

The 10 steps of the main loop (master §5.2) implemented in
order. Step 1 uses `loadOrCreateSession` (5.7). Steps 6–7 use
`callClaude` (5.4). Step 8 calls `executeTool` (orchestrator-
internal helper that dispatches each validated tool_use to the
corresponding service function — follows the
`zodSchema.parse(tool_use.input)` then `service(input, ctx)`
pattern). Step 9 writes the exchange to
`agent_sessions.conversation` via `adminClient`
(INV-SERVICE-002).

`loggerWith` is bound once at entry (see work item 5.8) and
propagated as `log` to every helper call.

### 5.4 Mocked callClaude + fixtures

**File:** `src/agent/orchestrator/callClaude.ts`. Exports a
single function with the real-API signature:

Signature: `callClaude(params: Anthropic.Messages.MessageCreateParams, log: Logger) => Promise<Anthropic.Messages.Message>`.
Module-scope queue `__mockFixture: Anthropic.Messages.Message[] | null`
with test-only setter `__setMockFixtureQueue(fixtures)`. Each
call shifts the head of the queue; empty-or-null throws a
clear error naming `__setMockFixtureQueue` so a missing test
setup is obvious.

Multi-turn conversations (tool call → tool result → next turn)
enqueue multiple responses in order. Session 4 replaces the
fixture branch with an `Anthropic` client call; the function
signature stays identical so the call-site in `handleUserMessage`
is untouched.

**Fixtures directory:** `tests/fixtures/anthropic/`

- `makeMessage.ts` — shared helper that fills envelope
  boilerplate (id, role, type, stop_details, stop_sequence,
  container, usage, model). Caller supplies `content` and
  `stop_reason`. Return type is
  `Anthropic.Messages.Message` so TypeScript catches envelope
  drift when the SDK version bumps.
- `respondToUserHappyPath.ts` — Fixture A
- `toolCallThenRespond.ts` — Fixture B
- `validationRetryTrigger.ts` — Fixture C

**Fixture A — respondToUser happy path.** Single turn ending
with a `respondToUser` tool_use block as the only content block.
`stop_reason: 'tool_use'`. Cites SDK `ToolUseBlock` type.

```typescript
import type Anthropic from '@anthropic-ai/sdk';
import { makeMessage } from './makeMessage';

export const respondToUserHappyPath: Anthropic.Messages.Message =
  makeMessage(
    [{
      type: 'tool_use',
      id: 'toolu_respond_A',
      name: 'respondToUser',
      input: {
        template_id: 'agent.greeting.welcome',
        params: { user_name: 'Jamie' },
      },
      caller: { type: 'direct' },
    }],
    'tool_use',
  );
```

**Fixture B — tool call + respondToUser (two-message sequence).**
Turn 1: `listChartOfAccounts` tool_use. Turn 2 (after the
orchestrator returns the tool result): `respondToUser` tool_use.
The file exports both `toolCallTurn` and `respondAfterToolTurn`.

```typescript
export const toolCallTurn: Anthropic.Messages.Message = makeMessage(
  [{
    type: 'tool_use',
    id: 'toolu_list_B',
    name: 'listChartOfAccounts',
    input: { org_id: SEED.ORG_HOLDING },
    caller: { type: 'direct' },
  }],
  'tool_use',
);

export const respondAfterToolTurn: Anthropic.Messages.Message = makeMessage(
  [{
    type: 'tool_use',
    id: 'toolu_respond_B',
    name: 'respondToUser',
    input: {
      template_id: 'agent.accounts.listed',
      params: { count: 14 },
    },
    caller: { type: 'direct' },
  }],
  'tool_use',
);
```

The test that uses Fixture B seeds the queue as
`[toolCallTurn, respondAfterToolTurn]`.

**Fixture C — validation-retry trigger.** Turn 1:
`postJournalEntry` with a malformed `entry_date` (e.g., the
string `'not-a-date'`). Turn 2: corrected `postJournalEntry`
followed by `respondToUser` in the same content array.

```typescript
export const validationFailTurn: Anthropic.Messages.Message = makeMessage(
  [{
    type: 'tool_use',
    id: 'toolu_post_C1',
    name: 'postJournalEntry',
    input: {
      org_id: SEED.ORG_HOLDING,
      entry_date: 'not-a-date',  // fails Zod regex
      /* remaining fields omitted; see fixture file */
    },
    caller: { type: 'direct' },
  }],
  'tool_use',
);

// validationRetrySuccessTurn: same shape with corrected entry_date
// + a trailing respondToUser tool_use in the same content array.
// Full literal in the fixture file.
```

Queue: `[validationFailTurn, validationRetrySuccessTurn]`. The
orchestrator surfaces the Zod error to Claude via a `tool_result`
with `is_error: true` per master §5.2 step 7, then the follow-up
turn succeeds.

Every fixture is typed as `Anthropic.Messages.Message` so
envelope correctness is compile-checked. The fixtures cite SEED
constants from `tests/setup/testDb.ts` to keep org/user UUIDs
consistent across tests.

### 5.5 respondToUser enforcement + structural retry

Extends 5.3. The orchestrator:

1. Ignores any `text` content blocks in Claude's final response.
   Only `tool_use` blocks are consulted for the structured
   response.
2. Extracts the last `respondToUser` tool_use in the content
   array as the `AgentResponse.response`.
3. If `stop_reason === 'end_turn'` without `respondToUser`: one
   structural retry with a clarification user-message ("You must
   end your turn with a call to respondToUser. Use template_id
   and params to format your response."). The retry does NOT
   count against the Q13 tool-validation budget (master §6.2
   item 4).
4. If the second attempt also lacks `respondToUser`: surface
   `{ template_id: 'agent.error.structured_response_missing',
   params: {} }` and log `AGENT_STRUCTURED_RESPONSE_INVALID`.

The Q13 tool-validation retry budget (max 2, per master §5.2
step 7) is tracked as a separate counter from the structural
retry. CA-42 asserts they are independent.

### 5.6 Persona-aware tool whitelist

**File:** `src/agent/orchestrator/toolsForPersona.ts`. Given a
persona, returns the persona's allowed subset per master §6.4.
Every persona includes `respondToUser`.

```typescript
import type { UserRole } from '@/services/auth/canUserPerformAction';
// imports for all 10 tool definitions from '@/agent/tools'

export type Persona = UserRole;  // 'executive' | 'controller' | 'ap_specialist'

export function toolsForPersona(persona: Persona) {
  switch (persona) {
    case 'controller':
      return [/* all 10 tools */];
    case 'ap_specialist':
      return [/* 8 tools — exclude createOrganization, updateOrgProfile */];
    case 'executive':
      return [/* 6 tools — read-only + updateUserProfile + respondToUser */];
  }
}
```

The orchestrator filters tools at Claude-send time. Enforcement
at the service boundary (`withInvariants`) is the real guard;
the whitelist is UX — don't send Claude a tool it can't actually
call. CA-44 asserts the Executive whitelist does not include
`postJournalEntry`.

### 5.7 Session load/create precedence

**File:** `src/agent/orchestrator/loadOrCreateSession.ts`.
Implements the three-precedence logic from master §5.2 step 1:

1. If `input.session_id` is provided → load by PK. If found AND
   `last_activity_at >= now() - 30 days` AND
   `(user_id, org_id)` match → use it. If expired → throw
   `AGENT_SESSION_EXPIRED`. If not found → throw
   `AGENT_SESSION_NOT_FOUND`.
2. If `input.session_id` is absent → look up most recent session
   for `(user_id, org_id)` (or `(user_id, org_id IS NULL)`
   during onboarding) with
   `last_activity_at >= now() - interval '30 days'`, order by
   `last_activity_at DESC LIMIT 1`. Use if found.
3. Otherwise create a new row with empty `conversation` and
   `state = '{}'`. `org_id` may be null — master §9.1 Issue 3
   resolution. CA-46 covers the null case.

Uses `adminClient` per INV-SERVICE-002. Writes via admin; the
userClient SELECT policy from migration 001 governs reads in
Session 4's API routes.

### 5.8 trace_id propagation

Dedicated work item per founder Observation 2. The sub-brief
names three assertable surfaces; CA-47 asserts all three carry
the same `trace_id` for a single `handleUserMessage` call.

**Entry binding (top of `handleUserMessage`):**
```typescript
const log = loggerWith({
  trace_id: ctx.trace_id,
  org_id: input.org_id ?? undefined,
  user_id: input.user_id,
});
```

**Propagation rules:**
- Every helper called inside `handleUserMessage` receives either
  the `log` child or the same `ctx` (not a fresh one). Follow
  the existing pattern from `withInvariants.ts:34` where the
  middleware creates its own `log` bound to `ctx.trace_id` and
  `ctx.caller.user_id`.
- `executeTool` passes `ctx` through to the service function
  unchanged. Service functions call `loggerWith({ trace_id:
  ctx.trace_id, ... })` — this is the pattern established in
  the Worked Example in `docs/04_engineering/conventions.md`.
- **Dry-run write path (the assertable surface for CA-47):**
  when a mutating tool is called with `dry_run: true`, the
  orchestrator writes a pending row to `ai_actions` with
  `trace_id = ctx.trace_id`, `tool_input = <validated input>`,
  `status = 'pending'`. This row is the queryable artifact
  that CA-47 asserts.

Session 2 is before the audit_log write path wires through the
orchestrator (Session 4 lands the real `postJournalEntry`
confirm flow). CA-47 asserts via `ai_actions.trace_id` + captured
log output, not `audit_log.trace_id`.

### 5.9 ServiceContext test factory

**File:** `tests/setup/makeTestContext.ts`. Returns a
`ServiceContext` object with a caller built from a `SEED.USER_*`
constant, a specified `org_id`, and a fresh `trace_id`. Bypasses
`buildServiceContext`'s JWT validation (unavailable in tests)
but otherwise returns the same shape.

```typescript
import type { ServiceContext, VerifiedCaller } from '@/services/middleware/serviceContext';
import { SEED } from './testDb';

interface MakeTestContextOptions {
  user_id?: string;         // defaults to SEED.USER_CONTROLLER
  email?: string;
  org_ids?: string[];       // defaults to [SEED.ORG_HOLDING]
  locale?: 'en' | 'fr-CA' | 'zh-Hant';
  trace_id?: string;        // defaults to crypto.randomUUID()
}

export function makeTestContext(opts: MakeTestContextOptions = {}): ServiceContext {
  const caller: VerifiedCaller = {
    user_id: opts.user_id ?? SEED.USER_CONTROLLER,
    email: opts.email ?? 'controller@thebridge.local',
    verified: true,
    org_ids: opts.org_ids ?? [SEED.ORG_HOLDING],
  };
  return {
    trace_id: opts.trace_id ?? crypto.randomUUID(),
    caller,
    locale: opts.locale ?? 'en',
  };
}
```

Every Session 2 test and every future orchestrator test uses
this helper. Without it, each test would manually construct a
`VerifiedCaller` and invite shortcuts.

---

## 6. Exit Criteria

| # | Criterion | Verification |
|---|---|---|
| S2-1 | 6 new ServiceError codes compile in union | `grep -E "AGENT_UNAVAILABLE\|AGENT_TOOL_VALIDATION_FAILED\|AGENT_SESSION_NOT_FOUND\|AGENT_SESSION_EXPIRED\|AGENT_STRUCTURED_RESPONSE_INVALID\|ONBOARDING_INCOMPLETE" src/services/errors/ServiceError.ts` returns 6 hits |
| S2-2 | All 10 tools exported from `src/agent/tools/index.ts` | `grep -c "export " src/agent/tools/index.ts` returns ≥ 10 |
| S2-3 | Every tool schema is `.strict()` | `grep -rn "z.object" src/agent/tools/schemas/` followed by visual check that every literal ends in `.strict()` |
| S2-4 | `zodToJsonSchema` conversion succeeds for every tool | Type-level check in each tool file; `pnpm typecheck` exits 0 |
| S2-5 | Persona whitelist returns correct sets | CA-44 passes; counts: controller 10, ap_specialist 8, executive 6 |
| S2-6 | Fixture A extraction — respondToUser happy path | CA-39 passes |
| S2-7 | Fixture B — tool call + respondToUser two-turn sequence | CA-40 passes |
| S2-8 | Fixture C — Zod validation retry | CA-41 passes |
| S2-9 | Q13 retry budget independent from structural retry | CA-42 + CA-43 pass |
| S2-10 | Session load/create three-precedence branches | CA-45 passes |
| S2-11 | Session load/create handles `org_id IS NULL` | CA-46 passes |
| S2-12 | trace_id propagation across log + ai_actions surfaces | CA-47 passes |
| S2-13 | Fixtures type-check against `Anthropic.Messages.Message` | `pnpm typecheck` exits 0 (fixture files use the SDK type directly) |
| S2-14 | `pnpm typecheck` exits 0 | same |
| S2-15 | Full regression clean | `pnpm test` passes with 0 failures; total count is 162 + Session 2 new tests (approx 170–172) |

---

## 7. Test delta

Session 2 adds approximately 9 new integration tests (Category
A), numbered CA-39 onward per master §21 reservation. Final
numbering is execution-time — if Session 2 discovers a
meaningful additional test, add it; if a listed test proves
redundant, drop it.

| # | File | What it asserts |
|---|---|---|
| CA-39 | `tests/integration/agentOrchestratorHappyPath.test.ts` | Fixture A → valid respondToUser → structured response extracted (AgentResponse.response matches template_id + params) |
| CA-40 | `tests/integration/agentToolCallThenRespond.test.ts` | Fixture B → `listChartOfAccounts` tool executes → follow-up turn's respondToUser is extracted |
| CA-41 | `tests/integration/agentValidationRetry.test.ts` | Fixture C → malformed tool_use fails Zod → tool_result with `is_error: true` sent → corrected retry succeeds |
| CA-42 | `tests/integration/agentRetryBudget.test.ts` | Two consecutive Zod-validation failures → clarification template to user (not a third retry); retry counter increments only on content failures |
| CA-43 | `tests/integration/agentStructuralRetry.test.ts` | respondToUser missing → structural retry issued → still missing → `AGENT_STRUCTURED_RESPONSE_INVALID` raised. Assertion: structural retry did not decrement the Q13 budget |
| CA-44 | `tests/integration/agentPersonaWhitelist.test.ts` | `toolsForPersona('executive')` returns 6 tools; does NOT include `postJournalEntry`. `toolsForPersona('controller')` returns all 10 |
| CA-45 | `tests/integration/agentSessionPrecedence.test.ts` | Three branches: session_id hit returns existing; fallback `(user_id, org_id)` hit returns existing; no-hit creates new. Expired session raises `AGENT_SESSION_EXPIRED` |
| CA-46 | `tests/integration/agentSessionOnboarding.test.ts` | `loadOrCreateSession` with `org_id = null` creates a row with `org_id IS NULL` and no FK violation |
| CA-47 | `tests/integration/agentTracePropagation.test.ts` | One `handleUserMessage` call with a fixed `trace_id` → (a) orchestrator log output carries `trace_id`, (b) `listChartOfAccounts` tool path's service-layer log carries same `trace_id`, (c) `ai_actions.trace_id` row written during dry-run path matches |

No existing tests should change. If execution surfaces an
unrelated failing test during the final `pnpm test`, stop and
flag per the Session 1 discipline.

---

## 8. What is NOT in Session 2

- No real Anthropic API calls — `callClaude` is fixture-driven
  (Session 4 replaces the `__mockFixture` branch with the real
  SDK client)
- No system prompts — persona identity, voice rules, onboarding
  suffix are Session 3
- No `OrgContextManager` — Session 4
- No onboarding flow wiring — Session 5
- No form-escape surfaces — Session 6
- No API routes — `/api/agent/message` and `/api/agent/confirm`
  are Session 4
- No UI changes — Session 7
- No `ProposedEntryCard` component rewrite — Session 7
- No i18n template additions — Session 3 lands the
  `agent.*` and `proposed_entry.*` keys
- No new dependencies — `@anthropic-ai/sdk` and
  `zod-to-json-schema` are the only agent-related deps
- No ADR-0007 (`dry_run` scope) — master §6.5 flags it for a
  future session

---

## 9. Stop Points for This Session

The execution session produces:

- `src/services/errors/ServiceError.ts` — 6 new codes appended
- `src/agent/tools/*.ts` — 10 tool definition files
- `src/agent/tools/index.ts` — barrel export
- `src/agent/tools/schemas/*.schema.ts` — 6 new Zod schemas
- `src/agent/orchestrator/index.ts` — `handleUserMessage`
- `src/agent/orchestrator/callClaude.ts` — mocked client
- `src/agent/orchestrator/loadOrCreateSession.ts` — session
  precedence helper
- `src/agent/orchestrator/toolsForPersona.ts` — persona whitelist
- `tests/fixtures/anthropic/makeMessage.ts` — envelope helper
- `tests/fixtures/anthropic/respondToUserHappyPath.ts` — Fixture A
- `tests/fixtures/anthropic/toolCallThenRespond.ts` — Fixture B
- `tests/fixtures/anthropic/validationRetryTrigger.ts` — Fixture C
- `tests/setup/makeTestContext.ts` — ServiceContext factory
- `tests/integration/agent*.test.ts` — 9 new integration tests
  (CA-39 through CA-47)
- Friction-journal entry with Session 2 summary and any
  execution-time discoveries

Stop after all 15 S2 exit criteria pass. Do **not** begin
Session 3. Do **not** wire the Next.js API route for
`/api/agent/message` — that is Session 4.

---

## 10. Commit plan

Four commits. Unlike Session 1, every commit leaves
`pnpm typecheck && pnpm test` green — there is no known-red
intermediate state because the mock-based design keeps each
layer independently testable.

- **Commit 1** — `feat(phase-1.2): add 6 agent ServiceError codes + 10 tool schemas`
  Files: `src/services/errors/ServiceError.ts`,
  `src/agent/tools/**` (all 10 tool files + barrel + 6 schema
  files). Green: typecheck + existing tests pass (tools compile
  in isolation; nothing imports them yet).
- **Commit 2** — `feat(phase-1.2): orchestrator skeleton + mocked callClaude + fixtures + test factory`
  Files: `src/agent/orchestrator/{index,callClaude}.ts`,
  `tests/fixtures/anthropic/{makeMessage,respondToUserHappyPath,toolCallThenRespond,validationRetryTrigger}.ts`,
  `tests/setup/makeTestContext.ts`. Green: typecheck + existing
  tests pass. Establishes the test harness before any logic is
  wired.
- **Commit 3** — `feat(phase-1.2): persona whitelist + session load/create + trace_id propagation`
  Files: `src/agent/orchestrator/{toolsForPersona,loadOrCreateSession}.ts`
  plus wiring into `index.ts`. Green: typecheck + existing
  tests pass. The cross-cutting orchestrator concerns.
- **Commit 4** — `test(phase-1.2): CA-39 through CA-47 — orchestrator behavior + trace propagation`
  Files: all 9 integration test files. Green: typecheck +
  `pnpm test` passes with 0 failures. The behavioral layer that
  depends on every layer above.

If execution surfaces a reason to split or merge, do so — but
every commit must leave typecheck and tests green.

---

*End of Phase 1.2 Session 2 Sub-Brief.*
