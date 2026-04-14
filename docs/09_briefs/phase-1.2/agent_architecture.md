# Agent Architecture — Phase 1.2 Brief

This brief specifies the Phase 1.2 agent layer: the Double Entry
Agent, the orchestrator, tool definitions, session persistence,
institutional memory, and the anti-hallucination rules. The Phase 1.1
service layer that the agent wraps is described in
`docs/02_specs/ledger_truth_model.md` and
`docs/03_architecture/system_overview.md`. Canvas context injection
is specified separately in
`docs/09_briefs/phase-1.2/canvas_context_injection.md`.

In Phase 1, Layer 1 and Layer 2 agents collapse to service functions
(see `docs/03_architecture/phase_simplifications.md` Simplification
3). This brief specifies what will be built on top of those service
functions in Phase 1.2.

Source: extracted from PLAN.md §5a-§5g and §15c-§15d during
Phase 1.1 closeout restructure.

---

## The One Agent in Phase 1.2: The Double Entry Agent

The entire agent surface area in Phase 1.2 is the **Double Entry
Agent**. It is not a class, not a folder hierarchy, not an
abstraction layer. It is a Claude tool definition
(`src/agent/tools/postJournalEntry.ts`) wired into the orchestrator
(`src/agent/orchestrator/index.ts`), pointing at the
`journalEntryService.post()` service function.

Two additional read-only tools will support the conversation:
- `listChartOfAccounts` — wraps `chartOfAccountsService.list()`.
  Filters `is_active = true` by default. The agent cannot post to an
  inactive account because it cannot see one. An optional
  `include_inactive: boolean` parameter returns inactive accounts
  flagged as such — but `postJournalEntry` validates at the service
  layer that the target `account_id` has `is_active = true` and
  rejects inactive targets regardless.
- `checkPeriod` — wraps `periodService.isOpen()`

That is the entire Phase 1 agent toolbox. Three tools. One mutating,
two reading.

**What "Double Entry Agent" means in Phase 1.2:**
- A Claude tool definition with the JSON schema generated from the
  `PostJournalEntryInputSchema` Zod schema.
- An orchestrator that knows when to call it (when the user asks to
  make or review a journal entry).
- A handler that validates the tool input, calls
  `journalEntryService.post()` in dry-run mode, and returns the
  result with a `canvas_directive`.
- A confirmation handler that calls `journalEntryService.post()`
  again with `dry_run: false` and the same idempotency key when the
  user clicks Approve.

**What it is not in Phase 1:**
- Not a separate process
- Not a separate package
- Not its own folder hierarchy
- Not a class with methods
- Not orchestrated by a higher-level workflow agent

**Phase 2 evolution.** When the AP Agent is built, the comparison
between AP and Double Entry will reveal the actually-shared
infrastructure — system prompt loading, tool definition format,
dry-run handling, idempotency, trace propagation, error envelopes.
That shared infrastructure will be extracted to `packages/agent/` and
the Layer 1/2/3 folder structure reintroduced informed by reality,
not by guesswork.

---

## The Orchestrator (`src/agent/orchestrator/`)

The main agent loop. Will receive a user message, build a Claude API
request, handle tool calls, and return a response with a canvas
directive.

```typescript
// src/agent/orchestrator/index.ts (sketch)
import type { CanvasContext } from '@/shared/types/canvasContext';

export async function handleUserMessage(input: {
  user_id: string;
  org_id: string;
  locale: 'en' | 'fr-CA' | 'zh-Hant';
  message: string;
  session_id?: string;
  canvas_context?: CanvasContext;
}) {
  const trace_id = crypto.randomUUID();
  const session = await loadOrCreateSession(input);
  const orgContext = await orgContextManager.load(input.org_id);
  const persona = await getPersonaForUser(input.user_id, input.org_id);
  const systemPrompt = buildSystemPrompt(
    persona,
    orgContext,
    input.locale,
    input.canvas_context,
  );

  let response = await callClaude(params, traceLogger);

  // Tool-call validation retry loop, max 2 retries
  let retries = 0;
  while (response.stop_reason === 'tool_use' && retries < 2) {
    const toolUse = response.content.find(c => c.type === 'tool_use');
    try {
      const validated = validateToolInput(toolUse);
      const toolResult = await executeTool(validated, { trace_id, ...ctx });
      response = await callClaude({ /* with tool_result */ }, traceLogger);
      break;
    } catch (validationError) {
      retries++;
      response = await callClaude({
        /* feed validation error back to Claude as a clarification */
      }, traceLogger);
    }
  }

  await persistSession(session, response);
  return extractCanvasDirective(response);
}
```

**System prompts (one per persona).** Will be stored as TypeScript
template literals in `src/agent/orchestrator/systemPrompts/`. Each
prompt declares: who the user is, what org they are in, what their
role permits, what tools are available, and the cardinal rule — never
invent financial data, always retrieve it through tools.

**Trace propagation across the Anthropic client boundary.** Every
`anthropic.messages.create` call will run inside a pino child logger
bound to the current `trace_id`, and the call itself will be wrapped
in a helper that logs start/end/error on that child logger:

```typescript
// src/agent/orchestrator/anthropicClient.ts
import Anthropic from '@anthropic-ai/sdk';
import type { Logger } from 'pino';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function callClaude(
  params: Anthropic.MessageCreateParams,
  traceLogger: Logger,
): Promise<Anthropic.Message> {
  const start = Date.now();
  traceLogger.info({ event: 'anthropic.request.start', model: params.model });
  try {
    const response = await client.messages.create(params);
    traceLogger.info({
      event: 'anthropic.request.success',
      duration_ms: Date.now() - start,
      usage: response.usage,
      stop_reason: response.stop_reason,
    });
    return response;
  } catch (err) {
    traceLogger.error({
      event: 'anthropic.request.error',
      duration_ms: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
```

---

## Anti-Hallucination Rules (non-negotiable)

These are explicit constraints in the system prompt and enforced at
the service boundary by Zod validation. They are also captured in
CLAUDE.md Rule 4.

- Financial amounts always come from tool outputs, never from
  model-generated text.
- Every mutating tool has a `dry_run: boolean` parameter. The
  confirmation flow always calls dry-run first.
- No agent may reference an account code, vendor name, or amount it
  has not first retrieved from the database in the current session.
- Tool inputs are structured Zod-validated objects only — no
  free-text journal entries.
- If the agent cannot produce a valid typed value for a required
  field, it must ask the user a clarifying question rather than
  guess.
- Canvas context is reference material, never a substitute for
  tool-retrieved data. The agent may use selection to resolve
  ambiguous references but must still call tools for financial facts.
  See `docs/09_briefs/phase-1.2/canvas_context_injection.md`.

---

## Structured-Response Contract

Agent response text will be structured data (`{template_id, params}`),
not English prose. The UI layer renders the localized string from the
template. This is the only way to make the agent trilingual without
retranslating every Claude output.

- Agent system prompts will include the user's `locale` and instruct
  Claude to return template IDs that have entries in all three locale
  files (`messages/en.json`, `messages/fr-CA.json`,
  `messages/zh-Hant.json`).
- Every `template_id` returned by the agent must exist in all three
  locale files.
- The `params` object must contain no free-form English.

See `docs/04_engineering/conventions.md` (i18n Conventions section)
for the locale file management rules.

---

## Agent Autonomy Model (Hybrid, Trust-Escalating)

| Tier | Default | Promotion |
|---|---|---|
| **Always Confirm** | All new orgs, all mutations | Default — no action needed |
| **Notify & Auto-Post** | Off by default | Phase 2+: controller explicitly enables per rule type |
| **Silent Auto** | Never available in Phase 1 | Phase 4+ consideration |

Every Phase 1 mutating action is Tier 1. The `autonomy_tier` enum
exists on `vendor_rules` from day one (Category A reservation) so
Phase 2 promotion flows can be wired without a migration.

---

## Institutional Memory — Phase 1 Form

`OrgContextManager` (`src/agent/memory/orgContextManager.ts`) will
load per-org context at session start:

```typescript
{
  orgId,
  orgName,
  industry,
  fiscalCalendar: FiscalPeriod[],
  // Phase 1: empty arrays — schema present, data not yet collected
  vendors: VendorRule[],
  intercompanyMap: IntercompanyRelationship[],
  approvalRules: ApprovalRule[],
}
```

All memory will be stored in the database — never only in the model's
context window, which is ephemeral. Phase 1 reads `fiscal_periods`
and the `organizations` row. Phase 2 begins populating and reading
`vendor_rules` and `intercompany_relationships`.

---

## AgentSession Persistence

`AgentSession` will live in Postgres in the `agent_sessions` table.
Keyed by `session_id`. Cleaned up after 30 days of inactivity.
Stored in the same database as everything else — no Redis, no
in-memory cache.

**Org switch = new session.** When the user switches orgs in the org
switcher, the current `AgentSession` will be closed and a new one
created. This prevents cross-entity contamination of institutional
memory and conversation context.

---

## Layer 3 Workflow Agents — Not Stubbed

No stub files exist. No empty folders. No `// TODO Phase 2` comments
masquerading as design.

Phase 2 will create the AP Agent in the right location once the shape
of an agent is known from Double Entry's implementation experience.
Pre-built stubs become cargo-cult artifacts that constrain Phase 2
without informing it.

---

## The One Real Contract in Phase 1

`src/contracts/doubleEntry.contract.ts` — the
`PostJournalEntryCommand` schema with `_contract_version`, `trace_id`,
`idempotency_key` as required fields. This will be the only file in
`src/contracts/` in Phase 1. Phase 2 generalizes to a full
three-namespace package once there are 5+ contracts and the actual
pattern is visible from real use.

---

## Confidence Routing (Phase 2 — display only in Phase 1)

Confidence scoring will be computed by the agent (Phase 2) using
institutional memory: vendor history match quality, amount within
expected range, account code consistency with past entries,
intercompany flag consistency.

Phase 1: the `confidence` field exists on `ProposedEntryCard` and is
displayed. The `routing_path` field exists as a reservation but is
unused.

Phase 2: confidence will drive routing.

```
High confidence  → Standard AP Queue (AP specialist reviews and approves)
Medium confidence → Controller approval required before AP Queue
Low confidence   → Dual review: AP specialist + controller
Novel pattern    → Escalation: controller + CFO notification
```

The `routing_path` field on `ProposedEntryCard` will carry the
routing decision. The orchestrator will use it to determine which
queue receives the card.
