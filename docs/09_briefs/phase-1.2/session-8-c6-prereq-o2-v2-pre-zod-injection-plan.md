# Session 8 C6 Prereq — Finding O2-v2: Pre-Zod Injection for Ledger Tools + Card Post-Fill

Status: **Design ratified (Path A expanded). Implementation pending.**

Date drafted: 2026-04-21 (afternoon).  Supersedes the implementation
Parts of the O2-v1 plan
(`session-8-c6-prereq-o2-org-id-injection-plan.md`) for ledger tools
only. O2-v1's treatment of the three read tools (`listChartOfAccounts`,
`checkPeriod`, `listJournalEntries`) stands unchanged.

Anchor commits: O2-v1 at `eab7f12`; logs-storm fix at `23e536f` (must
land first).

## 1. Finding

O2-v1 is **incomplete for ledger tools and for `ProposedEntryCard`
construction**. Paid-API evidence from Entry 1 retry
(`logs/ec-2-run-20260421T201938Z.log:2474`):

```
{"tool_name":"postJournalEntry","issues":"org_id: Invalid uuid;
fiscal_period_id: Invalid uuid; : idempotency_key is required when
source is \"agent\".","msg":"tool input failed Zod"}
```

The agent emitted `postJournalEntry` with no `org_id`, no
`fiscal_period_id`, and no `idempotency_key`. Zod rejected all three at
the orchestrator main-loop boundary. `executeTool` never ran, so
O2-v1's org_id overwrite (inside `executeTool`) was unreachable. The
agent had no valid retry and surfaced a natural-language response
saying "the system did not provide the required organization and
fiscal period identifiers."

**Compounding finding (surfaced during O2-v2 brainstorming):** even
with the ledger Zod gap closed, Entry 1 would fail one layer up at
`ProposedEntryCard` construction. The card schema at
`src/shared/schemas/accounting/proposedEntryCard.schema.ts:46-61`
requires `org_id`, `idempotency_key`, `dry_run_entry_id`, `trace_id` —
four UUIDs. The model has no legitimate source for three of them
(only `dry_run_entry_id` comes back in the tool_result). The
`canvasDirectiveSchema.discriminatedUnion` `proposed_entry_card`
variant uses the strict card schema, so model emissions of placeholder
values would fail `respondToUserInputSchema.safeParse`. No fixture has
ever exercised this path end-to-end; Entry 1 in paid-API is the first
real run that would hit it.

## 2. Root cause

Three layers, all traceable to one principle "UUIDs flow through
orchestrator mechanisms, never through the prompt" being enforced at
some sites and not others:

### 2a. Main-loop Zod runs before `executeTool`'s overwrite

Current post-`eab7f12` code path in
`src/agent/orchestrator/index.ts`:

- `:284` `const parsed = def.zodSchema.safeParse(tu.input);` — runs
  `PostJournalEntryInputSchema` against the model's raw tool input.
  Fails if `org_id` / `idempotency_key` are missing/invalid.
- `:301` `executeTool(tu.name, parsed.data, ctx, session, log)` — only
  reached if Zod passed.
- `:809` inside `executeTool`:
  `const input = { ...rawInput, org_id: session.org_id as string };` —
  too late for Zod, in-time for the `ai_actions` insert at `:814-827`.

O2-v1's Part 2 asserted: *"Zod validation still passes (model emits
some UUID, Zod accepts any valid UUID, orchestrator overwrites with
the real one)."* The assumption that the model would emit a
guess-UUID was false in practice; the model emitted empty/invalid
strings. Retract.

### 2b. `idempotency_key` is orchestrator's responsibility

Idempotency keys are orchestrator-controlled everywhere else in the
codebase:

- `ai_actions` table `(org_id, idempotency_key)` UNIQUE constraint.
- `/api/agent/confirm` looks up `ai_actions` by
  `(org_id, idempotency_key)` at `route.ts:52-53`.
- `/api/agent/reject` same pattern.

The model has no legitimate source for a unique `idempotency_key`. But
the shared ledger schema's `idempotencyRefinement` requires one when
`source === 'agent'`, and the orchestrator today doesn't mint one
before Zod.

### 2c. `fiscal_period_id` stays model-owned

Unlike `org_id` and `idempotency_key`, `fiscal_period_id` depends on
`entry_date`. The agent must call `checkPeriod` with a date, get back
a `period_id` via `periodService.isOpen`, and use that `period_id`
in its subsequent `postJournalEntry` call. If the model omits it,
that's a prompt-engineering gap (tool description doesn't instruct
"call `checkPeriod` first"), not a schema-mismatch bug. **O2-v2 does
not inject `fiscal_period_id`** — it stays model-owned.

Consequence: after O2-v2, Entry 1 may still fail if the agent skips
the `checkPeriod` step. That's a separate finding (prompt
engineering) tracked for C10/C11 retrospective.

### 2d. `ProposedEntryCard` requires three orchestrator-owned UUIDs

Same principle, one layer up. The card carries:

| Field | Source | Model can emit? |
|---|---|---|
| `org_id` | `session.org_id` | No (no UUIDs in prompt) |
| `idempotency_key` | orchestrator-minted at Site 1 | No (never sees minted value) |
| `dry_run_entry_id` | tool_result of `postJournalEntry` dry_run | Yes (echoed back) |
| `trace_id` | `ctx.trace_id` | No (not in prompt, not in tool_result) |

The orchestrator at `:589-603` passes the model's card through
unmodified. No post-fill. So even when Site 1 fix lands, the card's
UUID fields remain model-unfillable.

## 3. Audit-trail + card-construction implications

Audit-trail (`ai_actions.tool_input`): the confirm route at
`src/app/api/agent/confirm/route.ts:136-137` re-parses the stored
`tool_input` through `PostJournalEntryInputSchema.parse()` to replay
with `dry_run: false`. Whatever lands in `ai_actions.tool_input` must
be post-Zod-valid. O2-v2 Site 1 injects pre-Zod, so `parsed.data`
passed to `executeTool` already has authoritative `org_id` and
`idempotency_key`; the `ai_actions` insert captures them correctly.

Card-construction + confirm continuity: the card client ships with
must carry the **same** `idempotency_key` that landed in the
`ai_actions` row. The frontend reads `card.idempotency_key` and passes
it to `/api/agent/confirm`, which looks up `ai_actions` by
`(org_id, idempotency_key)`. If the two drift, confirm returns
404. Therefore Site 2 must not mint a fresh key — it must reuse the
key Site 1 minted for the postJournalEntry that produced this card.

## 4. Design ratified — Option 2A (expanded)

Two injection sites in `handleUserMessage`, same principle ("orchestrator
owns UUIDs"):

### Site 1 — Ledger-tool pre-Zod injection

Between the `toolByName.get(tu.name)` lookup (`:272`) and the
`def.zodSchema.safeParse(tu.input)` call (`:284`), insert a transform
for `postJournalEntry` / `reverseJournalEntry`:

- Overwrite `org_id` with `session.org_id` (unconditional).
- Overwrite `idempotency_key` with `crypto.randomUUID()`
  (**unconditional** — not `??=` — the model has no valid source so
  any emission is ignored; empty string `""` won't survive Zod as a
  UUID if left in place).
- Leave `fiscal_period_id` alone (model-owned; see §2c).
- If `session.org_id === null`, skip the transform. Zod will reject
  normally, and the `ORG_SCOPED_TOOLS` guard inside `executeTool`
  (`:782-794`, defense-in-depth from O2-v1) catches any leak.

Stash the minted `idempotency_key` for Site 2 in a
`handleUserMessage`-scoped variable (see §4 "continuity mechanism"
below).

### Site 2 — Card post-fill in respondToUser processing

In the success path at `:580-608`, when
`parsedRespond.canvas_directive?.type === 'proposed_entry_card'`:

- Overwrite `card.org_id` with `session.org_id`.
- Overwrite `card.idempotency_key` with the key minted at Site 1 for
  the current `handleUserMessage` invocation.
- Overwrite `card.trace_id` with `ctx.trace_id`.
- Leave `card.dry_run_entry_id` alone — model copied it from the
  `postJournalEntry` tool_result.
- Assert the post-filled card validates against the **strict**
  `ProposedEntryCardSchema` (defense-in-depth; any unexpected drift
  throws loudly rather than shipping malformed data to the client).

### Continuity mechanism (Site 1 → Site 2)

Turn-scoped `let lastLedgerIdempotencyKey: string | undefined;`
declared at the top of `handleUserMessage` (not inside the
while-loop iteration — the value must persist across iterations so
a model retry between the postJournalEntry turn and the respondToUser
turn still finds the minted key). Assigned after `executeTool`
succeeds for a ledger tool (not before — if Zod or `executeTool`
threw, the minted key was never written to `ai_actions` and must
not be propagated to a card). Read at Site 2.

If `lastLedgerIdempotencyKey` is `undefined` when Site 2 runs, that
means the model emitted a card without a prior successful ledger-tool
call. That's a model-behavior failure; Site 2 throws with a clear
error rather than silently minting a fresh key (which would diverge
from any `ai_actions` row and break confirm).

`let` scope pattern confirmed against existing turn-scoped state:
`validationRetries` (`:241`), `structuralRetries` (`:242`),
`currentOnboarding` (`:156`) — all declared at the top of
`handleUserMessage` and mutated per iteration.

### Schema split (pre-required for Site 2)

`ProposedEntryCardSchema` currently requires all four UUIDs strict.
Model emissions will fail against it. Split:

- **`ProposedEntryCardInputSchema` (new)** — what the model emits.
  Omits `org_id`, `idempotency_key`, `trace_id` (or marks them
  optional). Required fields: `org_name`, `transaction_type`,
  `entry_date`, `description`, `lines`, `intercompany_flag`,
  `confidence_score`, `policy_outcome`, `dry_run_entry_id`.
  Keeps `.strict()` on extras.
- **`ProposedEntryCardSchema` (unchanged)** — what ships to client.
  All fields required; all UUIDs strict.

Update `canvasDirectiveSchema` at
`src/shared/schemas/canvas/canvasDirective.schema.ts` — the
`proposed_entry_card` variant's `card` field consumes
`ProposedEntryCardInputSchema`. The strict output schema stays
canonical for client-side consumers.

Post-fill at Site 2 transitions input-shape → output-shape. Defense-
in-depth assertion uses `ProposedEntryCardSchema.parse()` (throws on
mismatch).

### `executeTool` ledger overwrite: defense-in-depth

`src/agent/orchestrator/index.ts:809` stays. Post-O2-v2 it's a no-op
when called from the main-loop path (value is already injected and
unchanged), but:

- Any future code path that calls `executeTool` directly (tests,
  replays) still gets the overwrite.
- If the pre-Zod injection is ever bypassed (new code path,
  regression), the overwrite is the second line of defense.

Comment at `:805-808` gets a reference to O2-v2 and the
defense-in-depth rationale.

## 5. Options considered

### Option 2A (ratified, expanded) — pre-Zod injection + card post-fill

Site 1 + Site 2 + schema split. Honors the O2-v1 architectural
principle consistently at both the tool-input boundary and the
tool-output boundary. See §4.

### Option 2B (rejected) — pre-Zod injection for **all** tool calls

Treat every tool the same — inject `org_id` from session pre-Zod for
any tool whose schema declares it.

Rejected because:

- Read tools (`listChartOfAccounts`, `checkPeriod`,
  `listJournalEntries`) already don't declare `org_id` post-O2-v1.
  Adding pre-Zod injection for them is no-op at best, expands surface
  area.
- `createOrganization` deliberately has no `org_id` (onboarding).
  Injection from null session would break it.
- `updateOrgProfile` already handles `org_id` in `executeTool` via a
  different pattern. Changing it now is outside O2-v2 scope.

Scope discipline: O2-v2 fixes the specific tools where O2-v1 was
incomplete. Other tools stay.

### Option 2C (rejected) — make ledger Zod schemas optional-then-refine

Rewrite `JournalEntryBaseSchema` to mark `org_id` and
`idempotency_key` as optional, add `.refine()` that enforces them
only for non-agent callers.

Rejected because:

- Schema is shared with `/api/agent/confirm`, `/api/agent/reject`,
  and direct service callers — all of which need both fields
  mandatory. Making them optional at the schema layer weakens
  invariants for the whole service boundary.
- Refine-based conditional logic in a shared schema is the
  "schema-layer branching" anti-pattern O2-v1's Option 3b rejected
  for the same reason.
- Pushes complexity into the shared-schema layer instead of the
  agent-orchestrator layer where it belongs.

### Option 2D (rejected) — orchestrator constructs the whole card server-side

Instead of model emitting card + orchestrator post-filling three
UUIDs, have orchestrator construct the entire card from service
outputs + session context.

Rejected because:

- The card's human-readable fields (`vendor_name`, `description`,
  `policy_outcome.reason_template_id`, `policy_outcome.reason_params`,
  `confidence_score`) are reasoning-layer outputs the model
  legitimately produces. Pulling them server-side would require
  re-deriving them from conversation state — unnecessary duplication.
- The `ProposedEntryLineSchema` fields (account_code, account_name,
  debit, credit, currency, description) come from the model's
  interpretation of the user's request + the `listChartOfAccounts`
  results. Server-side construction would re-do that reasoning work.
- Scope expansion beyond what's needed to close the UUID gap.

Option 2A keeps the model responsible for the reasoning-output fields
it's designed to produce, and keeps the orchestrator responsible for
the UUID fields it owns. Clean separation.

## 6. Implementation scope

### Part 1 — Ledger pre-Zod injection (Site 1)

In `src/agent/orchestrator/index.ts` `handleUserMessage`, add between
the unknown-tool check and the `def.zodSchema.safeParse` call:

```typescript
// Finding O2-v2 (pre-Zod injection for ledger tools). The ledger
// schemas (PostJournalEntryInputSchema, ReversalInputSchema) are
// shared with /api/agent/confirm and /api/agent/reject and the
// service layer — they legitimately require org_id and
// idempotency_key. The model has no legitimate source for either:
// session.org_id is authoritative, and idempotency_key is
// orchestrator-minted (unique per tool call). Inject pre-Zod so
// validation passes AND ai_actions.tool_input captures the
// authoritative values for later confirm-replay.
// fiscal_period_id stays model-owned — it depends on entry_date and
// requires checkPeriod first.
// See docs/09_briefs/phase-1.2/session-8-c6-prereq-o2-v2-pre-zod-injection-plan.md.
const LEDGER_TOOLS = new Set(['postJournalEntry', 'reverseJournalEntry']);
let toolInputForValidation: unknown = tu.input;
let mintedIdempotencyKey: string | undefined;
if (LEDGER_TOOLS.has(tu.name) && session.org_id !== null) {
  const raw = (tu.input as Record<string, unknown>) ?? {};
  mintedIdempotencyKey = crypto.randomUUID();
  toolInputForValidation = {
    ...raw,
    org_id: session.org_id,
    idempotency_key: mintedIdempotencyKey,
  };
}
const parsed = def.zodSchema.safeParse(toolInputForValidation);
```

After `executeTool` returns successfully for a ledger tool, set the
handleUserMessage-scoped variable:

```typescript
if (LEDGER_TOOLS.has(tu.name) && mintedIdempotencyKey !== undefined) {
  lastLedgerIdempotencyKey = mintedIdempotencyKey;
}
```

### Part 2 — Card post-fill (Site 2)

In the success path at `:580-608`, where `successCard` is derived:

```typescript
// Finding O2-v2 Site 2: post-fill the three orchestrator-owned UUIDs
// on the card the model emitted. Model has no legitimate source for
// org_id (not in prompt), idempotency_key (orchestrator-minted at
// Site 1; see lastLedgerIdempotencyKey), or trace_id (not in
// prompt, not in tool_result). dry_run_entry_id is left as-is —
// model correctly copies it from the postJournalEntry tool_result.
if (successCard !== undefined) {
  if (lastLedgerIdempotencyKey === undefined) {
    throw new ServiceError(
      'AGENT_TOOL_VALIDATION_FAILED',
      'ProposedEntryCard emitted without a prior successful ledger-tool call this turn',
    );
  }
  const filledCard = {
    ...successCard,
    org_id: session.org_id as string,
    idempotency_key: lastLedgerIdempotencyKey,
    trace_id: ctx.trace_id,
  };
  // Defense-in-depth: assert the post-filled card is strictly valid.
  ProposedEntryCardSchema.parse(filledCard);
  // Use filledCard wherever successCard would otherwise have been
  // consumed — the persisted assistant turn (`successAssistantTurn.card`)
  // and the returned `response.canvas_directive.card`. Executor maps
  // the exact downstream sites; today there are two.
}
```

### Part 3 — Schema split

`src/shared/schemas/accounting/proposedEntryCard.schema.ts`:

- Export `ProposedEntryCardInputSchema` — derive from the existing
  `ProposedEntryCardSchema` via `.omit({ org_id: true,
  idempotency_key: true, trace_id: true })`, keeping `.strict()`.
- `ProposedEntryCardSchema` unchanged.
- Types: `ProposedEntryCardInput = z.infer<typeof ProposedEntryCardInputSchema>`.

`src/shared/schemas/canvas/canvasDirective.schema.ts`:

- Update the `proposed_entry_card` variant at line 31-33 to use
  `ProposedEntryCardInputSchema` for the `card` field.

`src/shared/types/proposedEntryCard.ts`: if the TS type mirror is
hand-maintained, add the corresponding `ProposedEntryCardInput` type
or derive from Zod.

### Part 4 — `executeTool` ledger overwrite: comment update only

At `src/agent/orchestrator/index.ts:805-808`, extend the comment to
note the O2-v2 defense-in-depth role:

> Finding O2 + O2-v2: overwrite any model-emitted org_id with the
> authoritative session.org_id before the ai_actions write and the
> downstream service call. O2-v2 moves the primary injection pre-Zod
> (Site 1 in handleUserMessage); this overwrite is now defense-in-
> depth for direct-call paths (tests, replays, any future code path
> that bypasses the main-loop pre-Zod hook).

No code change in `executeTool` itself — the existing overwrite is
already correct.

### Part 5 — Tests (TDD)

Extend `tests/integration/agentOrgIdInjection.test.ts` with a new
describe block for O2-v2:

1. **Ledger-tool injection test:** Agent emits `postJournalEntry`
   with no `org_id`, no `idempotency_key`, valid `fiscal_period_id` +
   `entry_date` + `lines`. Orchestrator injects both; Zod passes;
   `executeTool` runs; `ai_actions` row written; returns
   `{dry_run_entry_id, status: 'proposed'}`.

2. **`ai_actions.tool_input` audit-trail test:** After the injection
   test, read the `ai_actions` row directly and assert
   `tool_input.org_id === session.org_id` and
   `tool_input.idempotency_key` is a valid UUID.

3. **Card post-fill test:** Agent emits `postJournalEntry` + then
   `respondToUser` with `canvas_directive.card` that has placeholder
   or missing UUID fields. Orchestrator post-fills; returned
   `AgentResponse.proposed_entry_card` has
   `org_id === session.org_id`,
   `idempotency_key === tool_input.idempotency_key` (same key as
   Site 1 minted), `trace_id === ctx.trace_id`.

4. **Card without prior ledger call: throws:** Agent emits
   `respondToUser` with `canvas_directive.card` but didn't call
   `postJournalEntry` first this turn. Orchestrator throws
   `AGENT_TOOL_VALIDATION_FAILED`.

5. **`fiscal_period_id` still required:** Agent emits
   `postJournalEntry` with no `fiscal_period_id`. Zod rejects
   (O2-v2 doesn't inject this field). Retry budget decrements.

6. **Idempotency_key overwrite (not default):** Agent emits
   `postJournalEntry` with `idempotency_key: ""` (empty string,
   degenerate emission). Orchestrator overwrites with a fresh UUID
   (proves unconditional overwrite, not `??=`).

Fixture strategy: new fixture file
`tests/fixtures/anthropic/ledgerPostWithCard.ts` or inline in the
test. Uses the existing `SEED.ORG_HOLDING` dev-seed fiscal period
(`33333333-3333-3333-3333-333333333301`) and cash/revenue accounts.

### Part 6 — Validation

- `pnpm agent:validate` green (typecheck + no-hardcoded-URLs + 26/26
  Category A floor).
- `pnpm test` — existing 389 + 6 new O2-v2 tests = 395/395.
- Manual re-test: re-run Entry 1 from EC-2 prompt set (with logs
  teed to `/tmp/` per `23e536f`). Expected log sequence:
  1. `callClaude: API call complete` — call 1, stop_reason:tool_use
  2. `listChartOfAccounts` → succeeds (O2-v1)
  3. `checkPeriod` → succeeds, returns `period_id`
  4. `postJournalEntry` → pre-Zod injects `org_id` +
     `idempotency_key` → Zod passes → `ai_actions` row written →
     returns `{dry_run_entry_id, status: 'proposed'}`
  5. `respondToUser` with `template_id` `agent.entry.proposed` and
     `canvas_directive.proposed_entry_card` — orchestrator post-fills
     three UUIDs; card strictly validates; client renders.
  6. `handleUserMessage: response extracted`

  **Critical observation:** no `tool input failed Zod` lines. Card
  renders on first turn.

  **Known non-goal:** if the agent skips `checkPeriod` and calls
  `postJournalEntry` with no `fiscal_period_id`, Zod still rejects.
  That's the prompt-engineering gap flagged in §2c, not an O2-v2
  regression.

### Part 7 — Commit

Standalone commit. Body captures:

- O2-v2 context (what broke in O2-v1; paid-API evidence from Entry 1
  retry at `ec-2-run-20260421T201938Z.log:2474`).
- Architectural decision (Option 2A expanded: Site 1 + Site 2 +
  schema split; unconditional overwrite for `idempotency_key`).
- Why not 2B (over-expansion), 2C (weakens shared schema), 2D
  (unnecessary server-side reasoning duplication).
- Convention #9 datapoint — new concrete instance: "plan assumption
  about model behavior wrong in production" (O2-v1 Part 2 assumed
  guess-UUIDs; observed empty strings). Class: "spec assumption
  untested against real model output."
- Convention #9 **meta-datapoint** — separately called out: the
  `pnpm dev 2>&1 | tee "logs/..."` pattern I designed into the EC-2
  prereq was the direct cause of the two-day sign-in debugging storm
  (watcher feedback loop). Planner-designed infrastructure caused
  the environment defect it later spent days debugging. Fixed in
  prerequisite commit `23e536f`.
- Convention #10 datapoint — 7th this session. O2-v1 Part 2's text
  (*"Zod validation still passes (model emits some UUID, Zod accepts
  any valid UUID, orchestrator overwrites with the real one)"*)
  retracted.
- Test count delta: 389 + 6 = 395/395 passing.

### Part 8 — Resume C6

After O2-v2 commits: dev server restart (with logs teed to `/tmp/`),
fresh `EC2_SESSION_START` capture, Entry 1 retry. If clean, proceed
through the full 20-entry EC-2 run.

## 7. Friction-journal capture (batched at C6 closeout)

Two NOTEs to append alongside Findings M, N8–N10, O1:

**Finding O2-v2:**
- Sub-category: spec-vs-reality drift on model behavior assumptions.
  O2-v1 plan assumed model would emit plausible UUIDs for tool-call
  fields; paid-API observation showed empty strings or field omission.
- Convention #9 candidate sub-category: "spec assumption about model
  output untested against real model." First instance in the
  session. Distinct from "convention asserted, partially applied"
  (O2-v1's category).
- Convention #10 datapoint: 7th this session. O2-v1 Part 2 text
  retracted.
- Cross-reference: Entry 1's date-hallucination (agent chose
  2025-04-01 instead of 2026-04-01 for "this month") is a separate
  prompt-engineering finding tracked for C10/C11 retrospective; not
  blocking O2-v2.

**Finding O2-v2-meta (tee-storm self-inflicted):**
- Sub-category: **planner-designed infrastructure caused the
  environment defect it later spent days debugging.** Distinct from
  under-specification; actively caused.
- Timeline: EC-2 prereq designed with `pnpm dev 2>&1 | tee "logs/..."`
  → `logs/` not in `.gitignore` → Next.js watcher sees every tee'd
  stdout line → recompile → another stdout line → feedback loop.
- Masked bugs for 2 days: intermittent sign-in failures, JSON.parse
  crashes on stale manifests, compounding the real OrgSwitcher bug
  diagnosed at `1afdae0`.
- Diagnosed by external review (other Claude instance), fixed at
  `23e536f`.
- Convention #9 sub-category name proposal for C9 codification:
  "planner-caused environment defect." New sub-category; the
  meta-flavor (infrastructure author debugged their own trap)
  distinguishes it from the regular under-specification cases.

## 8. Open items

None. Design is ratified. Implementation scope is bounded. Resume
point: executor opens Part 1 of the implementation scope.
