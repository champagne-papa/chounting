# Session 8 C6 Prereq — Finding O2: Agent org_id Injection

Status: **Design ratified (Option 3a). Implementation deferred per
founder pause ruling — resume fresh before executing.**

Date drafted: 2026-04-21. Session context: Phase 1.2 Session 8,
C6 EC-2 prompt-set verification. Finding O2 surfaced when Entry 1
(rent payment) failed because the agent could not call
`listChartOfAccounts`.

## 1. Finding

The agent cannot execute any org-scoped tool
(`listChartOfAccounts`, `checkPeriod`, `listJournalEntries`,
`postJournalEntry`, `reverseJournalEntry`) because:

1. Each tool's Zod input schema requires
   `org_id: z.string().uuid()`.
2. The system prompt deliberately excludes UUIDs
   (`_identityAndTools.ts:30-32` — "UUIDs are token tax for
   Claude with zero reasoning benefit").
3. The orchestrator passes the model's tool input directly to
   Zod validation without injecting server-side values.

Observed failure mode: the model emits a non-UUID string (it has
no real UUID to emit), Zod rejects, the agent exhausts the Q13
retry budget, and the structured response degenerates into the
agent asking the human user to supply the UUID.

## 2. Root cause classification

This is **not** a decision conflict. The architectural
convention "UUIDs flow through tool input arguments, not the
prompt body" is already asserted and already implemented for
two tools:

- `updateUserProfile` — `user_id` injected from
  `ctx.caller.user_id`; schema is patch-only
  (`src/agent/orchestrator/index.ts:823-836`).
- `updateOrgProfile` — `org_id` injected from `session.org_id`;
  schema is patch-only (`src/agent/orchestrator/index.ts:865-885`).

The convention is also explicitly documented at
`src/agent/prompts/suffixes/orgContextSummary.ts:8-13`: *"Tool
calls receive UUIDs through their input arguments, not the
prompt body."*

The five broken tools are **laggards**, not victims of a
conflicting design. The convention was asserted in one place,
partially applied at call sites. This is a new Convention #9
sub-category candidate for C9 codification: *"convention
asserted, partially applied."*

## 3. Options considered

### Option 1 — Put the UUID in the system prompt (rejected)

Modify `identityBlock` to inject
`The org_id you should pass to all tools is: <uuid>` in the
non-onboarding branch. Smallest LOC count.

**Rejected** because it contradicts an explicit, well-reasoned
architectural decision with two load-bearing sites
(`_identityAndTools.ts:30-32`,
`orgContextSummary.ts:8-13`). Reverting it discards the
reasoning that the orchestrator layer — not the model — is the
right source of truth for server-side identifiers.

### Option 2 — Orchestrator auto-fills org_id before Zod (rejected)

Before Zod validation of any tool input, orchestrator injects
`org_id: session.org_id` into the input object, overwriting
whatever the model emitted. Schemas unchanged.

**Rejected** because it leaves the token tax in place. Claude
still sees `org_id: uuid` as required in every tool's
`input_schema` payload, still emits tokens guessing a UUID on
every tool call. The validation bug goes away; the underlying
"UUIDs are token tax" concern that motivated the no-UUIDs-in-
prompt decision does not.

### Option 3b — Strip org_id from every tool schema (rejected)

Read-tool schemas strip `org_id`; ledger tools
(`postJournalEntry`, `reverseJournalEntry`) get new agent-
specific schemas that mirror the service schemas minus org_id.

**Rejected** because the ledger schemas are `ZodEffects`
(wrapped in `.refine(balancedRefinement).refine(idempotencyRefinement)`).
Building parallel agent-only schemas requires reconstructing
from `JournalEntryBaseSchema.omit({org_id: true}).extend(...).refine(...).refine(...)`
— two schema declarations with parallel refinement definitions
that must stay in sync across every future schema evolution
(Phase 2 field additions, Phase 1.3 refinement adjustments).
Parallel schemas with parallel refinements are a known drift
anti-pattern.

The service-layer schemas legitimately require `org_id` because
the service boundary crosses into multi-org territory in
principle, not because of agent indirection. That's schema
reuse serving a real invariant, not dishonesty.

### Option 3a — Hybrid (ratified)

- **Read tools** (`listChartOfAccounts`, `checkPeriod`,
  `listJournalEntries`): strip `org_id` from schema. Orchestrator
  supplies `session.org_id` at service-call time.
- **Ledger tools** (`postJournalEntry`, `reverseJournalEntry`):
  schema unchanged (reused by `/api/agent/confirm` and
  `/api/agent/reject` routes). Orchestrator overwrites the
  model's emitted `org_id` with `session.org_id` before passing
  to service.

**Rationale:**

1. Completes the existing architectural pattern where the
   pattern fits cleanly.
2. Accepts hybrid treatment where shared service schemas have
   legitimate reasons to keep `org_id`. Preserves single source
   of truth for the ledger schemas.
3. Token-tax cost on ledger tools is bounded — called once per
   journal-entry proposal (dry_run), not every turn. Savings
   from stripping would be marginal; drift risk from Option 3b's
   parallel schemas is systemic.

## 4. Implementation scope

### Part 1 — Read-tool schemas: strip org_id

Files:

- `src/agent/tools/schemas/listChartOfAccounts.schema.ts`
- `src/agent/tools/schemas/checkPeriod.schema.ts`
- `src/agent/tools/schemas/listJournalEntries.schema.ts`

Remove `org_id: z.string().uuid(),` from each schema. Keep
other fields. Update the exported `*Input` types (they're
re-inferred from the schema, so the type drop is automatic).

### Part 2 — Orchestrator dispatch: inject session.org_id

In `src/agent/orchestrator/index.ts` `executeTool`, for each
of the five org-scoped tools, supply `session.org_id` at
service-call time.

For read tools (post-Part-1 strip): injection is the **new
source** of `org_id` — validated input no longer has it.
Pattern mirrors existing `updateOrgProfile` handling.

For ledger tools (`postJournalEntry`, `reverseJournalEntry`):
injection **overwrites** whatever the model emitted. Zod
validation still passes (model emits some UUID, Zod accepts any
valid UUID, orchestrator overwrites with the real one before
the downstream write). The `ai_actions.tool_input` captured at
dry_run time records the authoritative org_id, not the model's.

**Critical invariant:** `session.org_id` is null during
onboarding. For any of the five tools, null-org should reject
with a sensible error. `createOrganization` is the only tool
legitimately called with null `session.org_id`; its schema has
no `org_id` field, so it is unaffected.

### Part 3 — Tool description verification

Verified at design time: the three read-tool description strings
(`listChartOfAccounts.ts:9`, `checkPeriod.ts:10`,
`listJournalEntries.ts:9`) do **not** reference `org_id`. They
describe behavior, not schema fields. Claude emits `org_id`
today because `zodToJsonSchema(schema)` expands it as a required
field in the tool's `input_schema` payload, not because of
prompt prose. When Part 1 strips `org_id` from the Zod schema,
`zodToJsonSchema` will stop emitting it as required and Claude
will stop producing it. No description edits needed.

Verification step for executor: after Part 1, grep tool
definitions to confirm no description added between design and
execution references `org_id` as an input field. Precaution,
not an expected edit.

`.strict()` on read-tool schemas is preserved — it's a real
invariant. If Claude ever emits `org_id` after the strip (e.g.,
because some other prompt surface introduced it), `.strict()`
rejects it and the retry budget surfaces the failure cleanly.

### Part 4 — Tests

Expected update surface:

- Tests that call read tools with explicit `org_id` in the
  input payload — these will fail `.strict()` validation after
  the schema change.
- Tests that dispatch through the orchestrator's `executeTool`
  for these tools — these should continue to pass because the
  orchestrator injects `session.org_id`.
- Anthropic fixtures (`tests/fixtures/anthropic/*.ts`) that
  emit tool-use blocks with `org_id` populated — audit for
  staleness.

Candidate test files (from grep):

- `tests/integration/agentToolCallThenRespond.test.ts`
- `tests/integration/agentValidationRetry.test.ts`
- `tests/integration/agentPersonaWhitelist.test.ts`
- `tests/integration/agentTracePropagation.test.ts`
- `tests/fixtures/anthropic/validationRetryTrigger.ts`
- `tests/fixtures/anthropic/toolCallThenRespond.ts`

Scope: small and bounded — each test adjusts its tool-input
fixture to drop `org_id`, or relies on orchestrator injection.

### Part 5 — Validation

- `pnpm agent:validate` green (typecheck +
  no-hardcoded-URLs + Category A floor tests).
- `pnpm test` — existing suite holds, modulo test-fixture
  updates from Part 4.
- Manual re-test: re-run **Entry 1** (rent payment) from the
  EC-2 prompt set. Agent should successfully call
  `listChartOfAccounts` and produce a `ProposedEntryCard`.

### Part 6 — Commit

Standalone commit, **not bundled with C6**. Body captures:

- Finding O2 full context (what broke, evidence from Entry 1
  logs).
- Architectural decision (Option 3a: strip three read
  schemas, orchestrator injection for all five tools).
- Why not Option 1 (architecturally wrong), Option 2 (token
  tax remains), Option 3b (parallel-schema drift).
- Convention #9 datapoint — new sub-category: "convention
  asserted, partially applied at call sites."
- Convention #10 datapoint — 6th this session. Founder's
  original O2 brief described a design dilemma; executor's
  investigation revealed the convention was already in place
  and just needed completion. Under-specified framing, not
  wrong framing.

### Part 7 — Resume C6

After O2 commits: dev server restart, fresh `session_start`
capture, Entry 1 retry. Should succeed. Then proceed to the
full 20-entry EC-2 prompt set.

## 5. Friction-journal capture

Add NOTE to `docs/07_governance/friction-journal.md` alongside
Finding M:

- **Sub-category:** system prompt vs. tool schema contract
  mismatch (specifically: orchestrator half-implemented the
  stated convention).
- **Convention #9 candidate sub-category:** "convention
  asserted in one place, partially applied at call sites."
  New sub-category; not a variant of existing sub-categories.
- **Convention #10 datapoint:** founder's original brief
  framed O2 as "decision locally optimal but globally wrong."
  Executor's investigation showed the decision was
  architecturally sound and already half-implemented.
  Under-specified framing corrected mid-design; scope
  clarified before any code was written.

## 6. Open items

None. Design is ratified. Implementation scope is bounded.
Resume point is unambiguous: executor opens Part 1 in a fresh
session after the pause.
