# Phase 1.2 Execution Brief — The Double Entry Agent

*This brief is the Phase 1.2 execution spec for The Bridge. Phase
1.1 (foundation) and Phase 1.5 (org profiles, users, permissions)
are complete. Phase 1.2 introduces the AI agent layer: the Double
Entry Agent, the orchestrator, tool definitions, the conversational
onboarding flow, canvas context injection, and the minimum
form-escape surfaces for profile and org management.*

**How to read this file.**

- `CLAUDE.md` at the repo root carries the standing rules. Rule 4
  (agent anti-hallucination) is non-negotiable throughout Phase 1.2.
- `docs/04_engineering/conventions.md` Phase 1.5A Conventions
  section plus the Error-Handling Review Rule are prerequisites.
- `docs/02_specs/agent_autonomy_model.md`,
  `docs/02_specs/intent_model.md`, and
  `docs/02_specs/mutation_lifecycle.md` are the design-sprint
  specs this brief implements. Where they disagree with the older
  `docs/09_briefs/phase-1.2/agent_architecture.md`, these specs
  win and the older brief is superseded.
- If anything in this brief contradicts a canonical doc in
  `docs/02_specs/`, the canonical doc wins.

---

## 1. Goal

**The Double Entry Agent works end-to-end: a user can create
journal entries through natural-language conversation, and a new
user can onboard entirely through conversation with form-escape
at every step.**

What "done" means in one paragraph: the agent proposes structured
journal entries from chat messages, renders a ProposedEntryCard
with the Four Questions grammar, and posts on user approval. Three
persona-specific system prompts enforce tool whitelists (Executive
read-only, Controller and AP Specialist can post). A conversational
onboarding flow walks new users through profile → org → industry →
first task with skip-links to form-based equivalents. Canvas context
injection (the minimal bidirectional pattern) is live so the agent
knows what the user is looking at. 19 Phase 1.2 exit criteria from
`docs/03_architecture/phase_plan.md` all pass, including the 20
real-entry usage-signal gate. AgentSession persists in Postgres.
The Mainframe works without the agent (Q11 degradation path).
Phase 1.1 + 1.5 test suite passes with zero regressions.

---

## 2. Prerequisites

### 2.1 Anchor docs (read in this order before writing code)

1. `CLAUDE.md` — standing rules, especially Rule 4.
2. `docs/09_briefs/CURRENT_STATE.md`
3. `docs/09_briefs/phase-1.5/1.5B-brief.md` — density reference.
4. `docs/03_architecture/agent_interface.md` — durable voice +
   onboarding spec.
5. `docs/02_specs/agent_autonomy_model.md` — governance layer.
6. `docs/02_specs/intent_model.md` — three Intents,
   ProposedMutation, Four Questions, Logic Receipts.
7. `docs/02_specs/mutation_lifecycle.md` — six states (1.2
   implements Pending, Approved, Posted (manual), Finalized).
8. `docs/09_briefs/phase-1.2/agent_architecture.md` — existing
   working doc. Superseded by this brief where they disagree.
9. `docs/09_briefs/phase-1.2/canvas_context_injection.md`
10. `docs/09_briefs/phase-1.2/journal_entry_form_gaps.md`
11. `docs/09_briefs/phase-1.2/obligations.md`
12. ADRs: 0002 (confidence), 0003 (one-voice), 0005 (three-path),
    0006 (persona).
13. `docs/03_architecture/phase_plan.md` Phase 1.2 section — the
    19 exit criteria.
14. `docs/02_specs/open_questions.md` — Q11–Q17, Q23–Q26.
15. `docs/04_engineering/conventions.md`

### 2.2 New environment variables

- `ANTHROPIC_API_KEY` — Claude API key. Required for the agent.
  The Mainframe degradation path (Q11) activates when this key is
  missing or the API returns errors.
- Existing `SUPABASE_*` variables unchanged.

### 2.3 New dependencies

- `@anthropic-ai/sdk` — Anthropic TypeScript SDK. Pin to latest
  stable at install time. Record version in friction journal.
- `zod-to-json-schema` — converts Zod schemas to JSON Schema for
  Claude tool definitions. Pin to latest stable. ADR-required for
  major version bumps per PLAN.md §18a.9.

### 2.4 Session-start git hygiene

`git status --short`, expected empty. Friction-journal entry at
session start. Starting model recorded.

---

## 3. Locked Decisions (do not re-litigate)

| # | Decision | Source |
|---|---|---|
| Q11 | API failure: banner + Retry + Mainframe functional | `open_questions.md` default |
| Q12 | No cost ceiling in 1.2; measure per-entry cost | `open_questions.md` default |
| Q13 | Tool-call validation retries: max 2, then clarification | `open_questions.md` default |
| Q14 | Batch response in 1.2; streaming is Phase 2 | `open_questions.md` default |
| Q15 | AgentSession TTL: 30 days, manual cleanup | `open_questions.md` default |
| Q16 | Executive: read-only + self-service profile | `open_questions.md` default |
| Q17 | CSV export: defer to Phase 1.3 friction | `open_questions.md` default |
| Q23 | Promotion thresholds: system-fixed for v1 | Design sprint |
| Q24 | Limit changes: controller-proposes/owner-approves | Design sprint |
| Q25 | Agent persona: unnamed | ADR-0006 |
| Q26 | Promotion prompting: passive via Agency Health | Design sprint |
| A | Onboarding flow: all four steps in 1.2 | Founder decision |
| B | Form-escape surfaces: profile, org, invite, users list, accept | Founder decision |
| C | Non-onboarding 1.5 UI deferred | Founder decision |
| D | No Command Palette in 1.2 | Founder decision |
| E | Lifecycle View: Mainframe "Activity" item | Founder decision |
| F | Settings: avatar dropdown | Founder decision |
| G | Starting model: Claude Sonnet (latest stable) | Founder decision |

---

## 4. Database Schema

Phase 1.2 requires minimal schema work — the heavy lifting was
done in Phase 1.1 and Phase 1.5. Two migrations.

| # | File | Purpose |
|---|---|---|
| 118 | `20240118000000_agent_session_wiring.sql` | Extend `agent_sessions` for conversation storage, add `ai_actions` supporting indexes |
| 119 | `20240119000000_journal_entry_form_fixes.sql` | UX fixes from `journal_entry_form_gaps.md`: fiscal period default, dropdown disabled option |

### 4.1 Migration 118 — Agent session + AI actions wiring

The `agent_sessions` and `ai_actions` tables already exist from
Phase 1.1 (migration 001). This migration extends them for the
1.2 write path.

```sql
BEGIN;

-- Issue 3: make org_id nullable for onboarding sessions that
-- exist before the user has created/joined an org.
ALTER TABLE agent_sessions ALTER COLUMN org_id DROP NOT NULL;

-- agent_sessions.conversation: store the chat transcript as
-- ordered JSONB array. Each element:
-- { role: 'user'|'assistant', content: string|object[],
--   timestamp: ISO8601, trace_id?: uuid }
ALTER TABLE agent_sessions
  ADD COLUMN conversation jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Supporting index for session cleanup by last_activity_at
-- (already exists from 001: idx_agent_sessions_last_activity).
-- Add index for the org_id + user_id lookup the orchestrator
-- uses on every message:
CREATE INDEX IF NOT EXISTS idx_agent_sessions_active
  ON agent_sessions (user_id, org_id, last_activity_at DESC);

-- ai_actions: add index for the dry-run → confirm lookup.
-- The confirm path looks up by (org_id, idempotency_key) which
-- already has a UNIQUE constraint. Add an index for the
-- AI Action Review queue sorted by creation time:
CREATE INDEX IF NOT EXISTS idx_ai_actions_org_created
  ON ai_actions (org_id, created_at DESC)
  WHERE status IN ('pending', 'confirmed');

COMMIT;
```

**Blast radius:** `agent_sessions` is currently empty (no writes
in Phase 1.1). The `conversation` column is new with a DEFAULT;
no backfill needed. `ai_actions` is also empty. No test or seed
changes required.

### 4.2 Migration 119 — Journal entry form UX fixes

Per `docs/09_briefs/phase-1.2/journal_entry_form_gaps.md`:

```sql
BEGIN;

-- No schema changes. The UX fixes (fiscal period default,
-- disabled dropdown option, per-line description wiring) are
-- pure front-end. This migration is a placeholder documenting
-- that the form gap work is Phase 1.2 scope.
--
-- If a schema change is needed (e.g., a default_fiscal_period
-- computed column), it lands here.

COMMIT;
```

> **OPEN — needs founder decision:** The form gaps doc lists
> several features that may need schema support (Save as Draft
> requires a `status` column on `journal_entries`, per-line
> vendor picker requires `vendor_id` on `journal_lines`). Current
> brief defers both to Phase 2 — the agent dry-run flow uses
> `ai_actions.status` for draft state, not a journal_entries
> column. If Save as Draft for the manual form is needed in 1.2,
> flag it. See §19 OQ-01.

---

## 5. Agent Architecture

### 5.1 The orchestrator

```typescript
// src/agent/orchestrator/index.ts

export async function handleUserMessage(input: {
  user_id: string;
  org_id: string | null;    // null during onboarding before org exists
  locale: 'en' | 'fr-CA' | 'zh-Hant';
  message: string;
  session_id?: string;
  canvas_context?: CanvasContext;
}): Promise<AgentResponse> { /* ... */ }

export type AgentResponse = {
  session_id: string;
  response: StructuredResponse;
  canvas_directive?: CanvasDirective;
  proposed_entry_card?: ProposedEntryCard;
  trace_id: string;
};

export type StructuredResponse = {
  template_id: string;
  params: Record<string, unknown>;
};
```

### 5.2 Main loop

<!-- gap 1 patch — resolve 3 orchestrator ambiguities -->

1. **`loadOrCreateSession(input)`** — loads or creates an
   `agent_sessions` row. Org switch = new session (EC-6).
   Precedence:
   - If `input.session_id` is provided → load by `session_id`.
     If found AND `last_activity_at >= now() - 30 days` AND
     `(user_id, org_id)` match the request → use it. If found
     but expired → `AGENT_SESSION_EXPIRED`. If not found →
     `AGENT_SESSION_NOT_FOUND`.
   - If `input.session_id` is absent → look up most recent
     session for `(user_id, org_id)` (or `(user_id, org_id IS
     NULL)` during onboarding) with
     `last_activity_at >= now() - interval '30 days'` ordered
     by `last_activity_at DESC LIMIT 1`. Use it if found.
   - If nothing matches → create new session with empty
     `conversation` and `state = '{}'`.

2. **`orgContextManager.load(input.org_id)`** — loads the per-org
   snapshot (§8).

3. **`getPersonaForUser(input.user_id, input.org_id)`** — looks
   up the user's role via `getMembership`, maps to persona.

4. **`buildSystemPrompt(persona, orgContext, input.locale,
   input.canvas_context)`** — constructs the full system prompt
   (§7). Includes onboarding suffix if
   `session.state.onboarding.in_onboarding === true` (§11.5).

5. **Conversation truncation: full history (day-one behavior).**
   Send the entire `conversation` array to Claude on every call.
   No truncation, no rolling window, no summarization in 1.2.
   The 30-day TTL (Q15) provides implicit size management. If
   conversations exceed 200 turns during Phase 1.3, that is a
   signal to implement a rolling window in Phase 2 (see §19
   OQ-02).

6. **`callClaude(params, traceLogger)`** — calls the Anthropic
   API with model `claude-sonnet-4-20250514` (decision G). Batch
   mode (Q14). The `messages` array is the full `conversation`
   plus the current user message.

7. **Tool-call validation retry loop** (Q13): max 2 retries. If
   `response.stop_reason === 'tool_use'`, validate the tool input
   via Zod.

   **On validation failure:** feed the error back to Claude as
   a `tool_result` content block with `is_error: true`. The
   content is the Zod error messages rendered to plain English
   (not a `template_id` — this is a model-to-model message,
   not user-facing). Constructed by:
   ```typescript
   {
     type: 'tool_result',
     tool_use_id: toolUse.id,
     is_error: true,
     content: `Validation failed: ${zodError.issues
       .map(i => `${i.path.join('.')}: ${i.message}`)
       .join('; ')}`,
   }
   ```
   The orchestrator appends this as the next message and calls
   Claude again. After 2 failures, the orchestrator surfaces a
   user-facing clarification question via the `respondToUser`
   tool (§6.2) with a template that names the failing fields.

8. **`executeTool(validated, ctx)`** — executes the tool via the
   corresponding service function. Ledger-mutating tools
   (`postJournalEntry`, `reverseJournalEntry`) go through
   `withInvariants`. Non-ledger mutations go through
   `withInvariants` where the ActionName requires it (see §16).
   Read-only tools call the service directly.

9. **`persistSession(session, response)`** — appends the exchange
   to `agent_sessions.conversation` and updates
   `last_activity_at`.

10. **`extractResponse(response)`** — extracts the `respondToUser`
    tool call (§6.2) as the structured response + canvas
    directive + proposed entry card (if any).

### 5.3 Trace propagation

Every `callClaude` invocation is wrapped in a pino child logger
bound to `trace_id`. The logger records: request start, model,
response duration, usage (input/output tokens), stop_reason. The
`trace_id` propagates from `handleUserMessage` → orchestrator →
service calls → audit_log → every log line. Exit criterion #3.

### 5.4 Degradation path (Q11)

When `ANTHROPIC_API_KEY` is missing or the API returns an error:

1. The chat panel renders a banner: "Agent unavailable — Retry"
   with a Retry button.
2. The Mainframe remains fully functional. Every Phase 1 canvas
   view (CoA, journal entry form, journal list, P&L, trial
   balance, AI Action Review) works without the agent.
3. No error propagates to service calls — the degradation is
   scoped to the agent panel.

Exit criterion #7 verifies this by disabling the API key.

### 5.5 Org-switch behavior

When the user switches orgs in the org switcher:

1. The current `AgentSession` is not deleted — it persists for
   TTL purposes and audit trail.
2. A new `AgentSession` is created for the target org.
3. Chat history resets (the new session has an empty
   `conversation` array).
4. `OrgContextManager` reloads for the new org.
5. Suggested prompts re-render for the new org context.

Exit criterion #6 verifies this.

---

## 6. Tools Inventory

### 6.1 Tool definitions

<!-- gap 2 patch — tool input schemas -->
<!-- gap 3 patch — respondToUser as 10th tool -->
<!-- gap 8 patch — dry_run column updated per §6.5 -->

Every tool is defined as a Zod schema converted to JSON Schema
via `zod-to-json-schema`. The JSON Schema is passed to the
Anthropic API as the tool's `input_schema`.

| Tool name | Type | dry_run | Persona whitelist | Service function |
|---|---|---|---|---|
| `updateUserProfile` | Mutating | N/A (§6.5) | All three | `userProfileService.updateProfile` |
| `createOrganization` | Mutating | N/A (§6.5) | Controller | `orgService.createOrgWithTemplate` |
| `updateOrgProfile` | Mutating | N/A (§6.5) | Controller | `orgService.updateOrgProfile` |
| `listIndustries` | Read-only | N/A | All three | `orgService.listIndustries` |
| `listChartOfAccounts` | Read-only | N/A | All three | `chartOfAccountsService.list` |
| `checkPeriod` | Read-only | N/A | All three | `periodService.isOpen` |
| `listJournalEntries` | Read-only | N/A | All three | `journalEntryService.list` |
| `postJournalEntry` | Mutating | **Required** | Controller, AP | `journalEntryService.post` |
| `reverseJournalEntry` | Mutating | **Required** | Controller, AP | `journalEntryService.post` |
| `respondToUser` | Structural | N/A | All three | (orchestrator-internal, not a service) |

**10 tools total.** The onboarding tools (`updateUserProfile`,
`createOrganization`, `updateOrgProfile`, `listIndustries`) are
used during the conversational onboarding flow and remain
available afterward. `respondToUser` is the structured-response
enforcement tool (§6.2).

#### Tool input schemas

**`updateUserProfile`** — input:
`src/shared/schemas/user/profile.schema.ts`
`updateUserProfilePatchSchema`. No `dry_run`. Rejection branches:
`PROFILE_NOT_FOUND`, `PROFILE_UPDATE_FAILED`.

**`createOrganization`** — inline Zod (new file
`src/agent/tools/schemas/createOrganization.schema.ts`):
```typescript
z.object({
  name: z.string().min(1),
  legalName: z.string().optional(),
  industryId: z.string().uuid(),
  fiscalYearStartMonth: z.number().int().min(1).max(12),
  baseCurrency: z.string().length(3).regex(/^[A-Z]{3}$/),
  businessStructure: businessStructureSchema,
  timeZone: z.string().min(1),
  defaultLocale: z.string().min(1),
}).strict()
```
No `dry_run`. Rejection branches: `ORG_CREATE_FAILED`,
`INDUSTRY_NOT_FOUND`, `NO_COA_TEMPLATE_FOR_INDUSTRY`,
`TEMPLATE_NOT_FOUND`.

**`updateOrgProfile`** — input:
`src/shared/schemas/organization/profile.schema.ts`
`updateOrgProfilePatchSchema`. No `dry_run`. Rejection branches:
`ORG_NOT_FOUND`, `ORG_IMMUTABLE_FIELD`, `INDUSTRY_NOT_FOUND`,
`PARENT_ORG_NOT_FOUND`, `PARENT_ORG_IS_SELF`,
`EXTERNAL_IDS_MALFORMED`, `ORG_UPDATE_FAILED`.

**`listIndustries`** — empty object schema `z.object({})`.

**`listChartOfAccounts`** — `z.object({ org_id: z.string().uuid(),
include_inactive: z.boolean().optional() }).strict()`.

**`checkPeriod`** — `z.object({ org_id: z.string().uuid(),
entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).strict()`.

**`listJournalEntries`** — `z.object({ org_id: z.string().uuid(),
limit: z.number().int().positive().default(20),
offset: z.number().int().nonnegative().default(0) }).strict()`.

**`postJournalEntry`** — input:
`src/shared/schemas/accounting/journalEntry.schema.ts`
`PostJournalEntryInputSchema` (extended in 1.2 to accept
`source = 'agent'` + `dry_run` + `idempotency_key`).
`dry_run: boolean` **required**. Rejection branches:
`UNBALANCED`, `PERIOD_LOCKED`, `POST_FAILED`,
`REVERSAL_CROSS_ORG`, `REVERSAL_PARTIAL_NOT_SUPPORTED`,
`REVERSAL_NOT_MIRROR`.

**`reverseJournalEntry`** — same schema as `postJournalEntry`
with `reverses_journal_entry_id` populated and
`reversal_reason` required. `dry_run: boolean` **required**.
Same rejection branches as `postJournalEntry`.

**`respondToUser`** — `z.object({ template_id: z.string(),
params: z.record(z.string(), z.unknown()),
canvas_directive: canvasDirectiveSchema.optional() }).strict()`.
See §6.2 for enforcement mechanics.

### 6.2 Structured-response enforcement (via `respondToUser` tool)

<!-- gap 3 patch — tool-based structured response mechanism -->

Every agent response must conform to `StructuredResponse`:

```typescript
type StructuredResponse = {
  template_id: string;   // key in messages/{locale}.json
  params: Record<string, unknown>;
  canvas_directive?: CanvasDirective;
};
```

**Enforcement mechanism: the `respondToUser` tool.**

1. `respondToUser` is a tool in every persona's whitelist. Its
   input schema accepts `{ template_id, params,
   canvas_directive? }`.
2. The system prompt instructs Claude: **the final step of every
   turn MUST be a call to `respondToUser`.** No text after the
   last `tool_use` block is user-facing.
3. The orchestrator **ignores** any text content blocks in
   Claude's final response. It extracts the `respondToUser`
   `tool_use` block and uses its arguments as the structured
   response.
4. If Claude's final `stop_reason` is `end_turn` without a
   preceding `respondToUser` call, the orchestrator retries once
   with a clarification message: "You must end your turn with a
   call to respondToUser. Use template_id and params to format
   your response." This retry does NOT count against the Q13
   tool-validation budget (it is a structural retry, not a
   content retry).
5. If the second attempt also lacks `respondToUser`, the
   orchestrator surfaces a generic error template:
   `{ template_id: 'agent.error.structured_response_missing',
   params: {} }` and logs
   `AGENT_STRUCTURED_RESPONSE_INVALID`.

Exit criterion #17 verifies this on 3 responses: inspect the raw
Anthropic API response envelope and confirm the user-facing text
is extracted from a `respondToUser` tool_use, not from a text
content block.

### 6.3 Anti-hallucination rules (CLAUDE.md Rule 4)

These are encoded in every system prompt and enforced at the tool
boundary by Zod validation:

1. Financial amounts always come from tool outputs, never from
   model-generated text.
2. Every mutating tool has `dry_run: boolean`. Confirmation flows
   call dry-run first.
3. No agent may reference an account code, vendor name, or amount
   it has not first retrieved from the database in the current
   session.
4. Tool inputs are structured Zod-validated objects only.
5. If the agent cannot produce a valid typed value for a required
   field, it asks a clarifying question.
6. Canvas context is reference material, never a substitute for
   tool-retrieved data.

Exit criterion #13 is the adversarial test for rule #1.

### 6.4 Per-persona tool whitelist

| Persona | Mutating tools | Read-only tools | Structural |
|---|---|---|---|
| **Controller** | `updateUserProfile`, `createOrganization`, `updateOrgProfile`, `postJournalEntry`, `reverseJournalEntry` | `listIndustries`, `listChartOfAccounts`, `checkPeriod`, `listJournalEntries` | `respondToUser` |
| **AP Specialist** | `updateUserProfile`, `postJournalEntry`, `reverseJournalEntry` | `listIndustries`, `listChartOfAccounts`, `checkPeriod`, `listJournalEntries` | `respondToUser` |
| **Executive** | `updateUserProfile` | `listIndustries`, `listChartOfAccounts`, `checkPeriod`, `listJournalEntries` | `respondToUser` |

The Executive cannot call `postJournalEntry` or
`reverseJournalEntry` (Q16). Exit criterion #18. All three
personas include `respondToUser` (§6.2).

### 6.5 dry_run scope

<!-- gap 8 patch — resolve updateUserProfile + dry_run conflict -->

> **Rule:** `dry_run` applies to **ledger-mutating tools only**.
> Non-ledger mutations (profile updates, org profile updates,
> org creation) post immediately on tool call — the confirmation
> surface is the user's own next conversational turn, not a
> ProposedEntryCard.
>
> **Tools WITH dry_run:** `postJournalEntry`,
> `reverseJournalEntry`.
>
> **Tools WITHOUT dry_run:** `updateUserProfile`,
> `createOrganization`, `updateOrgProfile`.
>
> **Rationale:** CLAUDE.md Rule 4 item 2 exists to prevent
> accidental ledger writes. Non-ledger mutations have their own
> audit trail (`before_state` in `audit_log`) and are reversible
> via a second call. The ProposedEntryCard abstraction was
> designed for ledger entries specifically — a profile edit does
> not produce a debit/credit delta to display.
>
> **ADR obligation:** this exemption should be formalized as
> ADR-0007 ("dry_run scope: ledger-only") in a future session.
> The rule is consistent with the original intent of CLAUDE.md
> Rule 4 as confirmed during the design sprint.

---

## 7. System Prompts

Three persona prompts stored as TypeScript template literals in
`src/agent/orchestrator/systemPrompts/`. Each prompt declares:

1. **Identity block** — who the user is, their role, the org name.
2. **Available tools** — the per-persona whitelist from §6.4.
3. **Anti-hallucination rules** — the six rules from §6.3,
   verbatim.
4. **Structured-response contract** — "Your responses must be
   `{template_id, params}`. Do not output English prose. Every
   `template_id` must exist in the locale files."
5. **Voice rules** (ADR-0006) — neutral, professional, unnamed.
   No emoji, no exclamation marks, no filler phrases.
6. **Canvas context suffix** (appended when `canvas_context` is
   present) — the subordinate-framing block from
   `docs/09_briefs/phase-1.2/canvas_context_injection.md`.

### 7.1 Onboarding suffix

When the user is in onboarding mode (detected by
`user_profiles.last_login_at IS NULL` or a session flag), the
system prompt appends an onboarding suffix:

> "The user is new. Walk them through setup: (1) their profile
> (name, role, preferences), (2) their organization, (3) industry
> selection for CoA template, (4) first task invitation. At each
> step, mention they can skip to the form-based surface. Use the
> available tools (updateUserProfile, createOrganization,
> updateOrgProfile, listIndustries) to complete each step."

The suffix is removed once onboarding completes.

---

## 8. OrgContextManager

```typescript
// src/agent/memory/orgContextManager.ts

export type OrgContext = {
  org_id: string;
  org_name: string;
  legal_name: string | null;
  industry_display_name: string;
  functional_currency: string;
  fiscal_year_start_month: number;
  fiscal_periods: FiscalPeriodSummary[];
  controllers: { user_id: string; display_name: string }[];
  // Phase 2 — empty arrays in 1.2
  vendor_rules: never[];
  intercompany_relationships: never[];
  approval_rules: never[];
};

export async function loadOrgContext(
  orgId: string,
): Promise<OrgContext> { /* ... */ }
```

Loaded once per session start and on org switch. Uses
`adminClient()` per INV-SERVICE-002. The data is injected into
the system prompt so the agent has org awareness without calling
tools on every turn.

---

## 9. AgentSession Persistence

### 9.1 Schema (existing table, extended in migration 118)

The `agent_sessions` table exists from Phase 1.1 migration 001.
Migration 118 adds the `conversation` column.

```sql
-- Post-1.2 shape:
agent_sessions (
  session_id        uuid PK,
  user_id           uuid NOT NULL FK auth.users(id),
  org_id            uuid FK organizations(org_id),  -- NULLABLE for onboarding
  locale            text NOT NULL DEFAULT 'en',
  started_at        timestamptz NOT NULL DEFAULT now(),
  last_activity_at  timestamptz NOT NULL DEFAULT now(),
  state             jsonb NOT NULL DEFAULT '{}',
  conversation      jsonb NOT NULL DEFAULT '[]'  -- NEW in 1.2
);
```

> **Issue 3 resolution: `org_id` is nullable.** Onboarding
> sessions exist before the user has created or joined an org.
> The welcome page creates an agent session with `org_id = NULL`;
> once the user creates an org (onboarding step 2) or the session
> loads an existing membership, `org_id` is updated to the org's
> UUID. The Phase 1.1 schema has `org_id NOT NULL` — migration
> 118 must `ALTER COLUMN org_id DROP NOT NULL` on
> `agent_sessions`. The `user_has_org_access(org_id)` RLS helper
> returns false for NULL org_id, but `agent_sessions` uses a
> user-scoped policy (`user_id = auth.uid()`), not org-scoped, so
> the nullability does not affect RLS enforcement.

### 9.2 Conversation shape

```typescript
type ConversationTurn = {
  role: 'user' | 'assistant';
  content: string | AnthropicContentBlock[];
  timestamp: string;        // ISO 8601
  trace_id?: string;
  tool_calls?: ToolCallRecord[];
  canvas_directive?: CanvasDirective;
};
```

The `conversation` column stores the full chat transcript as an
ordered JSON array. Each element is a turn. The orchestrator
appends turns after each exchange.

### 9.3 TTL and cleanup

30 days (Q15). A manual SQL cleanup script:

```sql
DELETE FROM agent_sessions
WHERE last_activity_at < now() - interval '30 days';
```

Phase 2 promotes this to a pg-boss scheduled job.

### 9.4 Row-Level Security

<!-- gap 4 patch — agent_sessions RLS verification -->

RLS is already enabled and has one policy from Phase 1.1 migration
001:

```sql
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY agent_sessions_select ON agent_sessions
  FOR SELECT USING (user_id = auth.uid());
```

**Deviation from standard pattern.** User-scoped only — not
org-scoped. A user sees only their own sessions, and even
controllers do not see other users' sessions. Sessions contain
conversation state that is considered user-private.

No INSERT/UPDATE/DELETE policies — all writes go through
`adminClient` via the orchestrator. The absence of write policies
combined with RLS being enabled means a `userClient` INSERT would
fail with "new row violates RLS policy" — defense in depth
against accidental client-side session writes.

**No changes in migration 118.** The existing RLS policy covers
the 1.2 use case. The orchestrator writes via `adminClient`
(bypasses RLS); the chat panel reads via `userClient` (respects
the SELECT policy).

---

## 10. ProposedEntryCard Migration

Per ADR-0002, raw confidence is never displayed. The Phase 1.1
`ProposedEntryCard` type is a display-only shell that currently
renders `confidence`. Phase 1.2 migrates this type.

### 10.1 Type changes

```typescript
// src/shared/types/proposedEntryCard.ts — Phase 1.2 shape

export type ProposedEntryLine = {
  account_code: string;
  account_name: string;
  debit: string;             // CHANGED: number → string (MoneyAmount)
  credit: string;            // CHANGED: number → string (MoneyAmount)
  currency: string;
  description?: string;      // NEW: per-line memo
  tax_code?: string;         // NEW: tax code display name
};

export type ProposedEntryCard = {
  org_id: string;
  org_name: string;
  transaction_type: 'journal_entry' | 'bill' | 'payment' | 'intercompany';
  entry_date: string;        // NEW: ISO date
  description: string;       // NEW: entry description
  vendor_name?: string;
  matched_rule_label?: string;
  lines: ProposedEntryLine[];
  intercompany_flag: boolean;
  reciprocal_entry_preview?: unknown;
  // ADR-0002 migration:
  confidence_score: number;  // RENAMED: was 'confidence' enum → now internal-only number
  policy_outcome: {          // NEW: user-facing outcome
    required_action: 'approve';  // Always 'approve' in 1.2
    reason_template_id: string;
    reason_params: Record<string, unknown>;
  };
  routing_path?: string;
  idempotency_key: string;
  dry_run_entry_id: string;
  trace_id: string;          // NEW: developer-visible
};
```

**Blast radius grep:**
```bash
grep -rn "ProposedEntryCard\|ProposedEntryLine\|confidence.*chip\|\.confidence" \
  src/ --include="*.ts" --include="*.tsx"
```

Expected hits:
- `src/shared/types/proposedEntryCard.ts` (rewrite)
- `src/shared/types/canvasDirective.ts` (imports the type)
- `src/components/ProposedEntryCard.tsx` (render component —
  rewrite confidence chip → policy outcome)
- `src/shared/schemas/accounting/journalEntry.schema.ts`
  (ProposedEntryCardSchema Zod — extend for 1.2)
- `docs/03_architecture/ui_architecture.md` (prose reference)
- `docs/09_briefs/phase-1.1/brief.md` (historical — no change)

### 10.2 What changes in the UI

The confidence chip ("High" / "Medium" / "Low" / "Novel") is
**removed** from the rendered ProposedEntryCard component. In its
place, the card renders the `policy_outcome` as a legible reason:

- In Phase 1.2, every `required_action` is `'approve'` (all
  rules are Always Confirm, rung 1).
- The reason template renders from `reason_template_id` +
  `reason_params` via `next-intl`:
  `"Requires your approval: {reason}"`.

The `confidence_score` field exists on the type for internal
logging and Logic Receipt storage but is **never rendered** in any
UI component. This is the ADR-0002 migration.

### 10.3 Four Questions rendering contract

<!-- gap 9 patch — template_id mapping for ProposedEntryCard -->

Per `docs/02_specs/intent_model.md` §5, every confirmation surface
renders the Four Questions in order, in the same visual position.
The ProposedEntryCard is a confirmation surface.

| # | Question | Template ID | Rendered from |
|---|---|---|---|
| 1 | What changed? | `proposed_entry.what_changed` | The `lines` array rendered as a debit/credit table — a structured table component, not a single string |
| 2 | Why? | `proposed_entry.why.rule_matched` OR `proposed_entry.why.novel_pattern` | `matched_rule_label` if set → "Matched rule: {label}". Else "Novel pattern — the agent has not seen this before." |
| 3 | Track record? | `proposed_entry.track_record.no_rule` | In 1.2 every mutation is Always Confirm with no learned rules populated. Renders as "N/A for this proposal." Phase 2 populates this from `historical_match_count`. |
| 4 | What if I reject? | `proposed_entry.if_rejected.journal_entry` OR `proposed_entry.if_rejected.reversal` | Static copy per `transaction_type`: journal_entry → "The entry will not be posted. You can edit and resubmit." reversal → "The original entry remains on the ledger." |

Plus the policy outcome from §10.1:

| Field | Template ID | Rendered from |
|---|---|---|
| Required action | `proposed_entry.policy.approve_required` | `policy_outcome.reason_template_id` — in 1.2 always "Requires your approval" because all rules are Always Confirm (rung 1) |

All six template IDs must be added to `messages/en.json`,
`messages/fr-CA.json`, and `messages/zh-Hant.json` during
execution per `docs/04_engineering/conventions.md` i18n rules.

The visual layout renders these top-to-bottom in this exact order
on every ProposedEntryCard, regardless of persona. The Approve and
Reject buttons sit below question 4.

---

## 11. The Onboarding Flow

Per `docs/03_architecture/agent_interface.md` §3.

### 11.1 Trigger

A user enters onboarding when:
- They sign in for the first time (no existing org memberships),
  OR
- They have been invited to an org but have not completed profile
  setup (`user_profiles.display_name IS NULL` and first login).

The sign-in page (`src/app/[locale]/sign-in/page.tsx`) checks
memberships after authentication. If the user has zero active
memberships, redirect to `/[locale]/welcome`. If they have
memberships but `user_profiles.display_name IS NULL`, redirect to
`/[locale]/welcome`.

### 11.2 The welcome page

`src/app/[locale]/welcome/page.tsx` — a full-screen layout with
the chat panel pre-focused (no canvas, no Mainframe rail visible).
The agent's first message is functional (ADR-0006):

> "Let's get your profile set up. What's your name and role?"

### 11.3 Four steps

**Step 1: User profile.** The agent asks for name, role
preferences, locale, timezone. Uses `updateUserProfile` tool. The
"Skip — I know what I'm doing" link navigates to the user profile
editor form (§12.1).

**Step 2: Organization profile.** If the user has no org (new
signup), the agent asks for company name, industry, legal name.
Uses `createOrganization` tool. If the user was invited (has a
membership already), this step is skipped. Skip link → org profile
editor form (§12.2).

**Step 3: Industry selection.** Follows step 2 (only for new
orgs). The agent calls `listIndustries`, presents options, and
the user picks. This is embedded in the `createOrganization` flow.

**Step 4: First task invitation.** "Want to try posting a journal
entry?" or "Want to see your Chart of Accounts?" The agent
generates a navigation intent based on the user's response. On
completion, the user is redirected to the main app layout
(`/[locale]/[orgId]/`).

### 11.4 Completion

When onboarding completes (all required fields populated + org
exists), the welcome page redirects to the main app layout. The
onboarding suffix is removed from the system prompt on the next
message.

### 11.5 Onboarding state tracking and resume behavior

<!-- gap 5 patch — onboarding state machine -->

**(a) Where is the current step stored?** The existing
`agent_sessions.state` JSONB column (reserved since Phase 1.1).
Shape:

```typescript
type OnboardingState = {
  in_onboarding: boolean;
  current_step: 1 | 2 | 3 | 4;
  completed_steps: number[];
  invited_user: boolean;
};
```

State lives under `agent_sessions.state.onboarding`. The
orchestrator reads it at the start of each turn and injects step
context into the system prompt suffix.

**(b) Resume behavior.** If a user abandons onboarding and returns
later (same session still within 30-day TTL): the orchestrator
reads `state.onboarding.current_step`, injects "User was on step
{N}, pick up where they left off" into the onboarding suffix, and
the agent resumes from that step. If the session expired (> 30
days): create new session, start from step 1.

**(c) Invited-user detection (OQ-03 default).** The welcome page
reads the user's memberships at page load. If the user has ≥ 1
active membership, set `state.onboarding.invited_user = true` and
`state.onboarding.completed_steps = [2, 3]` (org and industry
already exist). The shortened flow runs steps 1 and 4 only. If
the user has zero memberships, run all four steps.

**(d) Completion trigger.** When step 4 completes (the user
responds to the first-task invitation), the orchestrator sets
`state.onboarding.in_onboarding = false`. The next message no
longer includes the onboarding suffix in the system prompt, and
the welcome page redirects to the main app layout.

---

## 12. Form-Escape Surfaces

Five surfaces, per founder decision B.

### 12.1 User Profile Editor

**Route:** avatar dropdown → "Edit Profile"
**Component:** `src/app/[locale]/settings/profile/page.tsx`
**What it renders:** form with firstName, lastName, displayName,
phone, phoneCountryCode, preferredLocale, preferredTimezone.
Pre-filled from `userProfileService.getProfile`.
**Save action:** `PATCH /api/auth/me` (existing route from 1.5B).
**Four Questions on save:** "What changed: your display name."
"Why: you edited it manually." "Track record: N/A (self-service)."
"What if you cancel: nothing changes."

### 12.2 Org Profile Editor

**Route:** avatar dropdown → "Organization Settings" (controller-
only), OR "Edit" button in the Org Users canvas view.
**Component:** `src/app/[locale]/[orgId]/settings/org/page.tsx`
**What it renders:** form with org name, legalName, industry
(dropdown from `listIndustries`), businessStructure,
businessRegistrationNumber, taxRegistrationNumber, email, phone,
timezone, locale, reportBasis, accountingFramework.
Pre-filled from `orgService.getOrgProfile`.
**Save action:** `PATCH /api/orgs/[orgId]/profile` (existing from
1.5A).
**Authorization:** controller-only (redirect non-controllers with
a toast).

### 12.3 Invite User Form

**Route:** inside the Org Users canvas view, "Invite" button.
**Component:** inline form in the Org Users view (not a separate
page).
**What it renders:** email field + role dropdown (executive /
controller / ap_specialist).
**Save action:** `POST /api/orgs/[orgId]/invitations` (existing
from 1.5B).
**Result:** shows the invitation token for manual sharing.

### 12.4 Org Users List

**Route:** Mainframe item or avatar dropdown → "Team"
**Canvas directive:** `{ type: 'org_users'; orgId: string }`
(NEW — added in §15).
**Component:** `src/components/canvas/OrgUsersView.tsx`
**What it renders:** table of org members (from `GET
/api/orgs/[orgId]/users` — existing from 1.5B) with role, status,
is_org_owner badge. The "Invite" button opens the inline form
(§12.3).

### 12.5 Invitation Accept Page

**Route:** `/[locale]/invitations/accept?token=...`
**Component:** `src/app/[locale]/invitations/accept/page.tsx`
**Behavior:**
1. Parse `token` from URL query params.
2. If user is not signed in → redirect to sign-in with a
   `returnTo` param pointing back to this URL.
3. If user is signed in and email matches invitation → call
   `POST /api/invitations/accept` with the token → success
   message + redirect to the org.
4. If user is signed in but email does not match → show an error:
   "This invitation was sent to {email}. You're signed in as
   {different_email}. Sign out and sign in with the correct
   account."
5. If token is invalid or expired → show error: "This invitation
   is no longer valid."

---

## 13. API Routes

### 13.1 New routes

| Method | Path | Handler | Auth |
|---|---|---|---|
| POST | `/api/agent/message` | `handleUserMessage` | authenticated |
| POST | `/api/agent/confirm` | confirm dry-run entry | authenticated |

### 13.2 `/api/agent/message`

Accepts:
```typescript
{
  org_id: string;
  message: string;
  session_id?: string;
  canvas_context?: CanvasContext;
}
```

Returns `AgentResponse` (§5.1). The route:
1. Calls `buildServiceContext(req)`.
2. Passes to `handleUserMessage` (§5.1).
3. Returns the structured response, canvas directive, and proposed
   entry card (if any).

### 13.3 `/api/agent/confirm`

<!-- gap 6 patch — resolve confirm payload source -->

Accepts:
```typescript
{
  org_id: string;
  idempotency_key: string;
}
```

Note: no `session_id` in the request body — the confirm route
looks up the ai_actions row by the idempotency key alone.

The confirm route reads the original tool input from the existing
`ai_actions.tool_input` JSONB column (column name verified in
`supabase/migrations/20240101000000_initial_schema.sql` line 515
— the column is `tool_input jsonb`, not `input_payload`).

Steps:
1. Looks up the `ai_actions` row by `(org_id, idempotency_key)`
   via the existing UNIQUE constraint.
2. If not found → 404 `NOT_FOUND`.
3. If `status = 'confirmed'` → return the existing result
   (idempotency, exit criterion #4). Return includes
   `journal_entry_id` from the existing row.
4. If `status = 'stale'` → 422 `AGENT_TOOL_VALIDATION_FAILED`
   with reason "This proposal is stale and cannot be confirmed."
5. If `status = 'pending'` → read `tool_input`, parse through
   `PostJournalEntryInputSchema`, set `dry_run: false`, call
   `journalEntryService.post` via `withInvariants`.
6. On success: update `ai_actions.status` to `'confirmed'`,
   `confirmed_at = now()`, `confirming_user_id = ctx.caller.
   user_id`, `journal_entry_id` to the posted entry's ID.
7. Return the posted journal entry.

**The dry-run orchestrator flow** (§5.2 step 8) must write the
full validated tool input to `ai_actions.tool_input` when
creating the pending row. This is the contract: dry-run writes
the input, confirm reads it back and replays with `dry_run:
false`.

### 13.4 Existing routes reused

All 1.5A/1.5B routes remain unchanged. The form-escape surfaces
use them directly:
- `PATCH /api/auth/me` (profile update)
- `PATCH /api/orgs/[orgId]/profile` (org update)
- `POST /api/orgs/[orgId]/invitations` (invite)
- `GET /api/orgs/[orgId]/users` (user list)
- `POST /api/invitations/accept` (accept)
- `GET /api/industries` (industry list)

---

## 14. UI Changes to Existing Components

### 14.1 AgentChatPanel.tsx — rewrite

The Phase 1.1 stub renders empty state + suggested prompts. Phase
1.2 rewrites it to a functional chat panel:

- Message input with send button.
- Conversation history rendered from `AgentSession.conversation`.
- ProposedEntryCard inline rendering with Approve/Reject buttons.
- Batch rendering (Q14): the full response renders after the
  agent completes, not streamed token-by-token.
- Failure banner (Q11) when the agent is unavailable.
- Inline bookmark pills when chat pushes canvas changes (per
  `ui_architecture.md` Canvas ↔ Chat State Model).

### 14.2 ContextualCanvas.tsx — click handlers

Per `canvas_context_injection.md`:
- `JournalEntryListView.tsx`: add `onClick` handler that sets
  `selected_entity: { type: 'journal_entry', id, display_name }`.
- `ChartOfAccountsView.tsx`: add `onClick` handler that sets
  `selected_entity: { type: 'account', id, display_name }`.
- Zustand selector builds `CanvasContext` snapshot on each message
  send.

### 14.3 SuggestedPrompts.tsx — functional

Phase 1.1 stub with static arrays. Phase 1.2 makes them
persona-aware and functional (clicking a prompt sends the message
to the agent).

### 14.4 SplitScreenLayout.tsx — onboarding mode

During onboarding, the layout hides the Mainframe rail and
expands the chat panel to full width. The canvas is hidden until
the agent pushes a directive.

### 14.5 Sign-in page — redirect logic

After successful sign-in:
1. If user has zero org memberships → redirect to `/[locale]/welcome`.
2. If user has memberships but no `display_name` → redirect to
   `/[locale]/welcome`.
3. Otherwise → redirect to `/[locale]/[firstOrgId]/` (existing
   behavior).

### 14.6 New components

- **Avatar dropdown** in top-nav: links to profile editor, org
  settings (controller), team (org users list), sign out.
- **Mainframe "Activity" icon**: loads the AI Action Review queue
  at `/[locale]/[orgId]/agent/actions` (existing route from Phase
  1.1). This is the Lifecycle View placement per decision E.

---

## 15. Canvas Directive Extensions

New types added to `src/shared/types/canvasDirective.ts`:

```typescript
| { type: 'org_profile'; orgId: string }
| { type: 'org_users'; orgId: string }
| { type: 'invite_user'; orgId: string }
| { type: 'user_profile' }
| { type: 'welcome' }  // onboarding full-screen
```

The `ContextualCanvas.tsx` switch statement adds cases for each.
`org_profile` renders the org profile editor (§12.2). `org_users`
renders the org users list (§12.4). `invite_user` is a sub-view
of `org_users` with the invite form open. `user_profile` renders
the profile editor (§12.1). `welcome` renders the onboarding
layout (§11.2).

---

## 16. Permission Keys and Audit Action Keys

<!-- gap 7 patch — verify ActionName union, add per-tool mapping -->

### ActionName verification

The current `ACTION_NAMES` array in
`src/services/auth/canUserPerformAction.ts` has 16 entries. The
following ActionNames are used by 1.2 tools. Every mutating tool
that goes through `withInvariants` needs an ActionName; read-only
tools do not go through `withInvariants` and do not need one.

| Tool | Goes through `withInvariants`? | ActionName used |
|---|---|---|
| `updateUserProfile` | **Yes** — own-profile-only | **(NEW) `user.profile.update`** — must be added to `ACTION_NAMES` |
| `createOrganization` | **Yes** via route | `org.create` (exists) |
| `updateOrgProfile` | **Yes** via route | `org.profile.update` (exists) |
| `listIndustries` | No (read-only) | — |
| `listChartOfAccounts` | No (read-only) | — |
| `checkPeriod` | No (read-only) | — |
| `listJournalEntries` | No (read-only) | — |
| `postJournalEntry` | **Yes** via route | `journal_entry.post` (exists) |
| `reverseJournalEntry` | **Yes** via route | `journal_entry.post` (exists) |
| `respondToUser` | No (orchestrator-internal) | — |

### New ActionName value required

**`user.profile.update`** — must be added to the `ACTION_NAMES`
array and the `ROLE_PERMISSIONS` for all three roles (every user
can update their own profile). Added to `permissions` table seed
and `role_permissions` for all three roles.

Note: `updateUserProfile` is own-profile-only — the route reads
`user_id` from `ctx.caller.user_id`, not from the tool input. The
tool input carries no `org_id`, so `withInvariants` Invariant 3
(org-access check) and Invariant 4 (role check via
`canUserPerformAction`) both skip — Invariant 4 only fires when
`opts.action` is set AND `input.org_id` is a non-empty string.
This is the same behavior as `org.create` for new-org creation
where the org doesn't exist yet. The ActionName must still exist
in the `ACTION_NAMES` array for TypeScript type safety, and is
added to `ROLE_PERMISSIONS` for all three roles (every user can
edit their own profile regardless of role).

### New audit_log.action values (past-tense)

| Action | When |
|---|---|
| `agent.message_processed` | Orchestrator completes a message exchange |
| `agent.tool_executed` | A tool call completes (success or failure) |
| `agent.session_created` | New agent session started |
| `agent.session_org_switched` | User switched orgs mid-session |

---

## 17. Error Codes

New additions to `ServiceError.ts`:

| Code | HTTP | When |
|---|---|---|
| `AGENT_UNAVAILABLE` | 503 | Claude API unreachable or key missing |
| `AGENT_TOOL_VALIDATION_FAILED` | 422 | Tool input failed Zod after max retries |
| `AGENT_SESSION_NOT_FOUND` | 404 | Session ID not found |
| `AGENT_SESSION_EXPIRED` | 410 | Session older than 30 days |
| `AGENT_STRUCTURED_RESPONSE_INVALID` | 422 | Claude returned non-structured response after retries |
| `ONBOARDING_INCOMPLETE` | 422 | User tried to access main app without completing onboarding |

---

## 18. New Dependencies

| Package | Version | Justification |
|---|---|---|
| `@anthropic-ai/sdk` | Pin latest stable | Claude API client. Required for the orchestrator. |
| `zod-to-json-schema` | Pin latest stable | Converts Zod schemas to JSON Schema for Claude tool definitions. ADR-required for major version bumps per PLAN.md §18a.9. |

---

## 19. Open Questions

### OQ-01 — Save as Draft for manual entries

**Description.** The journal entry form gaps doc identifies Save
as Draft as a Phase 1.2 candidate. This requires a `status` column
on `journal_entries`. The agent path uses `ai_actions.status` for
draft state. Should the manual form also get Save as Draft?

**Suggested default.** Defer to Phase 2. The agent's dry-run flow
handles the "preview before posting" need for agent-originated
entries. Manual entries continue to be post-on-submit with the
existing confirmation-first flow.

### OQ-02 — Conversation column size limits

**Description.** The `agent_sessions.conversation` JSONB column
stores the full transcript. Long conversations could grow large.
Should a size limit or rolling window apply?

**Suggested default.** No hard limit in 1.2. The 30-day TTL
(Q15) provides implicit cleanup. Monitor column sizes in Phase
1.3 friction journal. If conversations average > 100 turns, add
a rolling window in Phase 2.

### OQ-03 — Onboarding for invited users

**Description.** An invited user who accepts an invitation already
has an org membership. Should they see the full onboarding flow
(4 steps) or a shortened version (profile setup only)?

**Suggested default.** Shortened: steps 1 (profile) and 4 (first
task invitation) only. Steps 2–3 (org creation, industry) are
skipped because the org already exists.

---

## 20. Exit Criteria Matrix

The 19 criteria from `docs/03_architecture/phase_plan.md` Phase
1.2 section PLUS 8 new criteria covering onboarding, form-escape
surfaces, and the ProposedEntryCard migration. Total: 27 criteria.

### Schema

| # | Criterion | Verification |
|---|---|---|
| S1 | Migration 118 applied; `agent_sessions.conversation` column exists | `\d agent_sessions` |
| S2 | Migration 119 applied (or confirmed empty — form fixes are front-end only) | Migration list |

### Agent

| # | Criterion | Source |
|---|---|---|
| EC-1 | Phase 1.1 + 1.5 regression: 162 tests pass | `pnpm test` |
| EC-2 | 20 real entries posted through agent; ledger correct | Manual + `phase_plan.md` #2 |
| EC-3 | `trace_id` correlates message → orchestrator → service → audit | Log inspection, `phase_plan.md` #3 |
| EC-4 | Idempotency: duplicate confirm returns existing, no second row | Integration test, `phase_plan.md` #4 |
| EC-5 | Tool-call retry: 2 retries then clarification | Integration test, `phase_plan.md` #5 |
| EC-6 | Org switch resets session | Integration test, `phase_plan.md` #6 |
| EC-7 | Mainframe degradation works without agent | Manual test, `phase_plan.md` #7 |
| EC-8 | Manual + agent entries appear in AI Action Review | Manual, `phase_plan.md` #8 |
| EC-9 | 20 real entries + 10 friction entries (behavioral) | Manual, `phase_plan.md` #9 |
| EC-10 | Time-to-confirmed-entry: target < 30s | Manual measurement, `phase_plan.md` #10 |
| EC-11 | Cost-per-entry recorded | Dashboard, `phase_plan.md` #11 |
| EC-12 | Dry-run → confirm round-trip on 3 entries | Integration test, `phase_plan.md` #12 |
| EC-13 | Anti-hallucination adversarial test | Manual, `phase_plan.md` #13 |
| EC-14 | ProposedEntryCard renders all fields, screenshot committed | Manual, `phase_plan.md` #14 |
| EC-15 | Clarification-question path without incrementing retry | Integration test, `phase_plan.md` #15 |
| EC-16 | Mid-conversation API failure: no orphans, stale handling | Integration test, `phase_plan.md` #16 |
| EC-17 | Structured-response contract upheld on 3 responses | Manual inspection, `phase_plan.md` #17 |
| EC-18 | Persona guardrails: Executive cannot post | Integration test, `phase_plan.md` #18 |
| EC-19 | Canvas context injection: 3-scenario over-anchoring test | Manual, `phase_plan.md` #19 |

### Onboarding + Forms (new)

| # | Criterion | Verification |
|---|---|---|
| EC-20 | Onboarding: new user redirected to /welcome, completes 4 steps | Integration test |
| EC-21 | Onboarding: "Skip" link navigates to form-based surface | Manual test |
| EC-22 | Onboarding: invited user sees shortened flow (profile + first task only) | Integration test |
| EC-23 | User profile editor: saves via PATCH /api/auth/me | Integration test |
| EC-24 | Org profile editor: controller can edit, non-controller redirected | Integration test |
| EC-25 | Invite user: token returned, invitation created | Reuse CA-16 |
| EC-26 | Invitation accept page: handles all 5 states (signed-out, email-match, email-mismatch, invalid, expired) | Integration test |
| EC-27 | ProposedEntryCard: confidence chip removed, policy_outcome rendered, debit/credit are MoneyAmount strings | Code inspection + screenshot |

---

## 21. Test Catalog

### Category A floor tests (new — CA-39 onward)

| # | Test file | What it asserts |
|---|---|---|
| CA-39 | `tests/integration/agentIdempotency.test.ts` | Duplicate confirm returns existing result (EC-4) |
| CA-40 | `tests/integration/agentToolRetry.test.ts` | Tool validation retry up to 2, then clarification (EC-5) |
| CA-41 | `tests/integration/agentOrgSwitch.test.ts` | Session resets on org switch (EC-6) |
| CA-42 | `tests/integration/agentDryRunConfirm.test.ts` | Dry-run → confirm round-trip (EC-12) |
| CA-43 | `tests/integration/agentClarification.test.ts` | Missing field → clarification, no retry increment (EC-15) |
| CA-44 | `tests/integration/agentMidConversationFailure.test.ts` | API failure: no orphans, stale marking (EC-16) |
| CA-45 | `tests/integration/agentPersonaGuardrails.test.ts` | Executive cannot call postJournalEntry (EC-18) |
| CA-46 | `tests/integration/onboardingNewUser.test.ts` | New user → welcome → 4 steps → main app (EC-20) |
| CA-47 | `tests/integration/onboardingInvitedUser.test.ts` | Invited user → shortened flow (EC-22) |
| CA-48 | `tests/integration/invitationAcceptPage.test.ts` | All 5 invitation-accept states (EC-26) |
| CA-49 | `tests/integration/proposedEntryCardMigration.test.ts` | confidence_score internal-only, policy_outcome rendered (EC-27) |

---

## 22. What is NOT in Phase 1.2

- **Command Palette** (ADR-0005 commits to its existence; 1.2
  does not build it)
- **Address management UI** — deferred
- **Role admin/suspend/reactivate/remove controls** — deferred
- **Pending invitations list** — deferred
- **Avatar / logo upload UI** — deferred
- **MFA recovery codes** — deferred
- **CSV export** (Q17 — defer to Phase 1.3 friction)
- **Rule promotion UI / Agent Policies canvas** — Phase 2
- **Agency Health canvas** — Phase 2
- **vendor_rules population** — Phase 2
- **Phase 2 canvas directives** (ap_queue, bank_reconciliation,
  ar_aging, consolidated_dashboard)
- **Cost ceilings** (Q12 — measure in 1.2, set in Phase 2)
- **Streaming responses** (Q14 — batch in 1.2)
- **Save as Draft for manual entries** (OQ-01 — defer)
- **Posted (auto) and Needs Attention lifecycle states** —
  Phase 2 (requires promotion to Notify & Auto-Post rung)
- **Partial reversals** — Phase 2
- **Multi-currency FX wiring** — Phase 4

---

## 23. Stop Points for This Session

This session produces three artifacts:

1. This brief (`docs/09_briefs/phase-1.2/brief.md`).
2. Updates to `docs/02_specs/data_model.md` — new section for
   `agent_sessions.conversation` column and the `ai_actions`
   index additions.
3. Updated `docs/09_briefs/CURRENT_STATE.md` marking Phase 1.2
   in flight.

**No migrations, no service code, no tests.** Stop after these,
summarize, and wait for review.

---

*End of Phase 1.2 Execution Brief.*
