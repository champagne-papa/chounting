# Phase 1.2 Session 4 Execution Sub-Brief — Real API + Routes + OrgContext

*This sub-brief drives Session 4 of Phase 1.2. The master brief at
`docs/09_briefs/phase-1.2/brief.md` (frozen at SHA aae547a) is the
architecture document and is never modified during execution. The
Session 1–3 sub-briefs are density and structure references. Where
this sub-brief and the master brief disagree, the master brief
wins — stop and flag rather than deviate.*

---

## 1. Goal

Session 4 is the first paid-API session and the biggest scope jump
of Phase 1.2. It closes the gap between "orchestrator running
against fixtures" and "orchestrator running against real Claude
through a Next.js route." Deliverables:

- Swap mocked `callClaude` for the real Anthropic client (preserve
  the `__setMockFixtureQueue` test setter so fixture tests still
  work).
- Implement `OrgContextManager` per master §8 — expand the
  Session 3 stub to the full shape and author the prompt
  injection prose (founder review gate applies).
- Wire `/api/agent/message` and `/api/agent/confirm` route
  handlers with full state-machine semantics for confirm
  (`pending → confirmed → idempotent-return`, `stale → 422`,
  unknown key → 404).
- Complete `executeTool` dispatch for the five remaining stubs
  (non-ledger mutating + read-only tools).
- Emit the four new `audit_log.action` values per master §16.
- Classify real-API error modes (401, 429, 5xx, network timeout,
  malformed response) with per-class retry behavior.
- Housekeeping: fix the header-comment drift in
  `journalEntryService.ts` (Phase 1.1 "rejected" language is
  stale since Session 2 refine removal).

No onboarding flow state machine (Session 5), no form-escape
surfaces (Session 6), no UI changes (Session 7), no canvas
extensions (Session 6). Session 4 is the foundation every
subsequent session builds on.

---

## 2. Master-brief sections implemented

- **§5.4** — degradation path, real-API error classification
- **§6.1** — `executeTool` per-tool dispatch completed for all 10
  tools (dry_run=true ledger path already shipped; Session 4
  adds the other 8 tool surfaces + the dry_run=false ledger path
  via confirm route)
- **§8** — `OrgContextManager` full shape + `loadOrgContext`
  implementation
- **§13.2** — `/api/agent/message` route
- **§13.3** — `/api/agent/confirm` route + full state machine
- **§16** — four new `audit_log.action` values:
  `agent.message_processed`, `agent.tool_executed`,
  `agent.session_created`, `agent.session_org_switched`
- **§17** — `serviceErrorToStatus` mappings for the six
  Session 2 agent error codes

Sections NOT delivered:

- §7 system prompts → already shipped (Session 3)
- §10.3 template IDs → already shipped (Session 3)
- §11 onboarding flow state machine → Session 5
- §12 form-escape surfaces → Session 6
- §14 UI changes (AgentChatPanel rewrite) → Session 7
- §15 canvas directive extensions → Session 6
- §21 CA-* catalog reconciliation → Session 8 (master §21 is
  drifted; Session 4 uses CA-53 onward per Session 3's pattern)

---

## 3. Locked Decisions (inherited)

All master §3 decisions + Session 1–3 sub-brief decisions + the
five Session 4 pre-decisions below (§4).

---

## 4. Founder pre-decisions (authoritative)

### Pre-decision 1 — OrgContext injection prose: no UUIDs

Session 4 authors the prose that injects `OrgContext` fields into
the system prompt between sections 1 (identity) and 2 (locale
directive), per the `buildSystemPrompt` composition slot already
reserved in Session 3.

**Carry the Session 3 commit-2 lesson forward verbatim:** "UUIDs
are token tax for Claude with zero reasoning benefit — keep them
out of prompts unless the model needs them to call a tool."

Injection prose uses:
- `org_name` (identity reinforcement)
- `legal_name` (when non-null, for formal contexts)
- `industry_display_name` (business type for classification hints)
- `functional_currency` (amount formatting)
- `fiscal_year_start_month` (period reasoning)
- Summary of `fiscal_periods` (names only, e.g., "FY2026 Q1–Q4
  generated; current period: FY2026 Q2" — not UUIDs)
- Names of `controllers[]` (display_name list — useful when the
  agent needs to mention "ask a controller" or reason about
  approval authority)

**Excluded from the prose:** `org_id`, `industry_id`,
`fiscal_period_id` UUIDs, `user_id` UUIDs. These are used by tool
calls (the model receives them as tool arguments) but never appear
in the prompt body.

Founder review gate applies at commit 2.

### Pre-decision 2 — Error classification is a first-class work item

The Session 2 `callClaude` failed one way: empty fixture queue.
The Session 4 real client has many failure modes. Each needs
explicit classification, not a generic `try/catch`. Work item
§5.4 names every failure class individually.

| Failure | Maps to | Retry behavior |
|---|---|---|
| 401 Unauthorized (bad key / missing key) | `AGENT_UNAVAILABLE` | No retry |
| 403 Forbidden | `AGENT_UNAVAILABLE` | No retry |
| 429 Rate limit | `AGENT_UNAVAILABLE` (after retry exhaustion) | Exponential backoff, max 3 attempts: 1s, 2s, 4s |
| 5xx Server error | `AGENT_UNAVAILABLE` (after retry exhaustion) | Exponential backoff, max 2 attempts: 1s, 2s |
| Network timeout / ECONNRESET | `AGENT_UNAVAILABLE` (after retry exhaustion) | Linear retry, max 2 attempts: 2s |
| Malformed response (missing `content` / no `stop_reason`) | `AGENT_TOOL_VALIDATION_FAILED` | No retry (feeds into structural retry path in `handleUserMessage`) |
| Response without `respondToUser` tool_use | Existing structural-retry path in `handleUserMessage` (§6.2) | Orchestrator handles |

Each failure class gets a dedicated CA-* test with a fixture-
injected error shape. The real API is not exercised for error
tests.

### Pre-decision 3 — `/api/agent/confirm` is the idempotency surface

Master §13.3 specifies the full state machine. Session 4
implements it completely, not a subset. The five branches:

1. `ai_actions` row not found for `(org_id, idempotency_key)` →
   404 `NOT_FOUND`
2. Row `status = 'confirmed'` → 200 with existing
   `journal_entry_id` (idempotent return)
3. Row `status = 'stale'` → 422 `AGENT_TOOL_VALIDATION_FAILED`
   with reason "This proposal is stale and cannot be confirmed."
4. Row `status = 'pending'` → read `tool_input`, parse through
   `PostJournalEntryInputSchema` with `dry_run: false`, call
   `journalEntryService.post` via `withInvariants`, update
   `ai_actions` to `'confirmed'`, return posted entry.
5. Any other `status` (reserved values, future states) → 422
   with reason "Unexpected ai_actions status: {value}."

The dry_run=true → ai_actions insert is already shipped (Session 2
orchestrator). Session 4 adds the confirm-read path that completes
the two-phase commit.

### Pre-decision 4 — Paid API minimized: one smoke test

Session 4 is paid but "paid" ≠ "every test costs tokens." Tests
that exercise orchestrator retry logic, persona whitelist,
session precedence, and error classification continue to use
fixtures (Session 2 pattern).

**Rule:** Session 4 adds exactly **one** paid-API test. It hits
real Claude with a Session 2-style fixture prompt and asserts the
response extracts to a `respondToUser` tool_use. The test is
**skip-if-`ANTHROPIC_API_KEY`-unset** so local dev and CI can run
the rest of the suite without the key.

The smoke test is tagged for optional CI runs. Test file:
`tests/integration/agentRealClientSmoke.test.ts`. Test uses
`describe.skipIf(!process.env.ANTHROPIC_API_KEY)` (or equivalent
vitest pattern).

### Pre-decision 5 — `ANTHROPIC_API_KEY` provisioning is a founder action

Session 4 is the first session requiring the key. The sub-brief
treats provisioning as a prerequisite, not an executor action.

- `.env.local` (gitignored) must contain `ANTHROPIC_API_KEY=sk-...`
- `.env.example` already has a templated entry from Session 1
- If the key is not set at execution start:
  - Non-smoke tests still run (they use fixtures)
  - Smoke test skips
  - `/api/agent/message` route returns `AGENT_UNAVAILABLE` when
    hit in production — already covered by the existing
    degradation check in `handleUserMessage` entry
- Execution does NOT attempt to acquire or provision the key

---

## 5. Prerequisites

- Git clean at `6cdba6e` or later
- `pnpm test` green at 191/191 (regression baseline)
- No new deps (still `@anthropic-ai/sdk@0.90.0` and
  `zod-to-json-schema@3.25.2`)
- `ANTHROPIC_API_KEY` present in `.env.local` (Pre-decision 5) —
  confirm before starting commit 3 (real callClaude swap). If
  missing, execution continues but smoke test skips.

---

## 6. Work items

Eleven work items. Given the scope, this is the largest work-item
list of the phase. Every commit leaves `pnpm typecheck && pnpm
test` green; Commit 2 has a founder review gate for authored
prose.

### 6.1 OrgContextManager full implementation

**File:** `src/agent/memory/orgContextManager.ts` (NEW — matches
master §8's specified path).

**Stub relocation:** The Session 3 stub at
`src/agent/prompts/orgContext.ts` is the type-only placeholder.
Session 4 moves the type to `src/agent/memory/orgContextManager.ts`
(where master §8 specifies it lives) and adds the `loadOrgContext`
implementation. All Session 3 imports of `OrgContext` from
`@/agent/prompts/orgContext` must be retargeted to
`@/agent/memory/orgContextManager`. The old file is deleted after
the import retarget.

**Interface** per master §8 (verbatim):

```typescript
export type FiscalPeriodSummary = {
  fiscal_period_id: string;
  period_name: string;
  starts_on: string;  // ISO date
  ends_on: string;
  is_current: boolean;
  is_locked: boolean;
};

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

export async function loadOrgContext(orgId: string): Promise<OrgContext>;
```

**Implementation:** uses `adminClient()` per INV-SERVICE-002.
Joins `organizations` + `industries` (for display name) + queries
`fiscal_periods` (ordered by starts_on) + queries `memberships`
joined to `user_profiles` filtered to `role = 'controller' AND
status = 'active'`. Throws `ServiceError('ORG_NOT_FOUND', ...)` if
the org doesn't exist.

Not called through `withInvariants` — it's a read helper used
inside `handleUserMessage`. The caller's `ServiceContext` already
authorizes the org via `withInvariants` at the route layer.

### 6.2 OrgContext injection prose + buildSystemPrompt wiring

Session-authored prose. **Founder review gate applies at commit 2.**

**File:** `src/agent/prompts/suffixes/orgContextSummary.ts` (NEW
suffix module, alongside the three Session 3 suffixes). Exports:

```typescript
export function orgContextSummary(orgContext: OrgContext | null): string;
```

Returns empty string when `orgContext` is null. When non-null,
returns a prose block following Pre-decision 1's rules — names
not UUIDs. Reviewed at commit-2 gate.

**buildSystemPrompt wiring:** `src/agent/orchestrator/buildSystemPrompt.ts`
inserts the org-context summary between base persona prompt and
locale directive — the slot reserved in Session 3's composition
comment. Composition order becomes:

1. Base persona prompt
2. **Org-context summary** (new — when orgContext non-null)
3. Locale directive
4. Onboarding suffix (when controller + null orgContext)
5. Canvas context suffix (when canvasContext present)

**Orchestrator wiring:** `src/agent/orchestrator/index.ts` loads
`orgContext` via `loadOrgContext(input.org_id)` when `input.org_id`
is non-null, then passes it to `buildSystemPrompt`. Null org_id
(onboarding) continues to pass null orgContext.

### 6.3 Real callClaude implementation

**File:** `src/agent/orchestrator/callClaude.ts` (modified in
place). Replace the fixture-only body with a branched
implementation:

```typescript
if (__mockFixture !== null) {
  // Test path — existing shift-from-queue behavior
} else {
  // Production path — new real Anthropic client call
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return await client.messages.create(params);
}
```

Signature and return type stay identical. `__setMockFixtureQueue`
setter preserved. **Critical invariant:** when `__mockFixture` is
non-null, the fixture path takes precedence — no regression of
existing fixture-driven tests.

Real-client path wraps the `client.messages.create(params)` call
in the retry/classification logic from §6.4.

### 6.4 Real-API error classification + retry

**File:** `src/agent/orchestrator/callClaude.ts` (in same file as
§6.3, or extracted to a `callClaude.errors.ts` sibling if the
block grows past ~60 lines — execution decides).

Classifier maps each SDK error shape to a `ServiceError` + retry
behavior per Pre-decision 2's table. Backoff implementation uses
`setTimeout` wrapped in a Promise (no new dep).

The orchestrator retry loop sits INSIDE `callClaude` for transient
errors (429, 5xx, network) — from `handleUserMessage`'s
perspective, transient retries are invisible; only terminal
failures bubble up as `ServiceError('AGENT_UNAVAILABLE', ...)`.

Malformed-response classification (missing `content`, no
`stop_reason`) is separate: it bubbles up as
`AGENT_TOOL_VALIDATION_FAILED` which feeds into the existing
structural-retry logic in `handleUserMessage` (master §6.2 item 5
— already handled in Session 3's commit 2).

### 6.5 `executeTool` dispatch for remaining tools

**File:** `src/agent/orchestrator/index.ts`, `executeTool`
function (~line 290 after Session 2 shipped). Replace the
`return { tool: toolName, status: 'session-2-stub' }` fallback
with real service dispatch per tool:

| Tool | Service call | Wrap? | Notes |
|---|---|---|---|
| `updateUserProfile` | `userProfileService.updateProfile({ user_id: ctx.caller.user_id, patch }, ctx)` | `withInvariants({ action: 'user.profile.update' })` | `user_id` comes from ctx, not tool input (own-profile-only per master §6.5) |
| `createOrganization` | `orgService.createOrgWithTemplate(input, ctx)` | `withInvariants({ action: 'org.create' })` | Onboarding tool — org doesn't exist yet, so `withInvariants` Invariant 3 (org-access) skips per input.org_id undefined |
| `updateOrgProfile` | `orgService.updateOrgProfile(input, ctx)` | `withInvariants({ action: 'org.profile.update' })` | |
| `listIndustries` | `orgService.listIndustries(ctx)` | No wrap | Read-only, no org scope |
| `listChartOfAccounts` | `chartOfAccountsService.list(input, ctx)` | No wrap | Read-only; service uses ctx.caller to authorize via userClient |
| `checkPeriod` | `periodService.isOpen(input.org_id, input.entry_date, ctx)` | No wrap | Read-only |
| `listJournalEntries` | `journalEntryService.list(input, ctx)` | No wrap | Read-only |

The `postJournalEntry` and `reverseJournalEntry` dry_run=false
branch stays throwing — the confirm route is the only surface
that replays with dry_run=false. Update the comment to cite §13.3
rather than "Session 4 wires."

### 6.6 `/api/agent/message` route

**File:** `src/app/api/agent/message/route.ts` (NEW). Mirror the
existing route pattern from `api/orgs/[orgId]/journal-entries/route.ts`:

1. Parse request body with a Zod schema matching master §13.2
2. `buildServiceContext(req)`
3. Call `handleUserMessage(body, ctx)` — no `withInvariants`
   wrap at the route (orchestrator authorizes via its own
   persona + service dispatch)
4. Return `AgentResponse` as JSON (200)
5. Catch `ZodError` → 400, `ServiceError` → mapped status, else
   → 500

The request-body Zod schema lives inline in the route file or in
a new `src/shared/schemas/agent/` subfolder — execution decides
(both fit the existing convention; no strong precedent). Schema
shape:

```typescript
z.object({
  org_id: z.string().uuid().nullable(),
  message: z.string().min(1),
  session_id: z.string().uuid().optional(),
  canvas_context: canvasContextSchema.optional(),  // may need a new Zod
}).strict()
```

If `canvasContextSchema` doesn't exist yet (it currently doesn't —
only `canvasDirectiveSchema` does), execution creates it at
`src/shared/schemas/canvas/canvasContext.schema.ts`.

### 6.7 `/api/agent/confirm` route

**File:** `src/app/api/agent/confirm/route.ts` (NEW). Per master
§13.3 and Pre-decision 3. The full five-branch state machine.

Request Zod schema:
```typescript
z.object({
  org_id: z.string().uuid(),
  idempotency_key: z.string().uuid(),
}).strict()
```

State-machine handler:

```typescript
const { data: row } = await adminClient()
  .from('ai_actions')
  .select('*')
  .eq('org_id', body.org_id)
  .eq('idempotency_key', body.idempotency_key)
  .maybeSingle();

if (!row) throw new ServiceError('NOT_FOUND', '...');
if (row.status === 'confirmed') return existing journal_entry_id;
if (row.status === 'stale') throw new ServiceError('AGENT_TOOL_VALIDATION_FAILED', '...');
if (row.status === 'pending') {
  // Parse tool_input, set dry_run: false, post, update ai_actions
}
throw new ServiceError('AGENT_TOOL_VALIDATION_FAILED', `Unexpected status: ${row.status}`);
```

Calls `journalEntryService.post` via `withInvariants({ action:
'journal_entry.post' })` for the pending branch. Updates the
`ai_actions` row (`status`, `confirmed_at`, `confirming_user_id`,
`journal_entry_id`) in a single UPDATE after the post succeeds.

### 6.8 Four new `audit_log.action` values

Per master §16. Each writes via `recordMutation(db, ctx, entry)`
at the appropriate call site:

| Action | Emitted from | Entity |
|---|---|---|
| `agent.message_processed` | `handleUserMessage` on successful return | `entity_type: 'agent_session'`, `entity_id: session.session_id` |
| `agent.tool_executed` | `executeTool` per tool call (success or Zod failure) | `entity_type: 'ai_action'` when ledger dry-run wrote a row, else `entity_type: 'agent_session'` |
| `agent.session_created` | `loadOrCreateSession` on new-session branch | `entity_type: 'agent_session'`, `entity_id: session.session_id` |
| `agent.session_org_switched` | `loadOrCreateSession` when existing session's `org_id` differs from request's `org_id` (triggers new session creation with `before_state` capturing the old org_id) | `entity_type: 'agent_session'` |

The `agent.*` keys are audit-log action values (past-tense), NOT
permission keys. They do NOT need entries in `ACTION_NAMES` or the
`permissions` table. (Cross-check per the Phase 1.5A Conventions
rule distinguishing the two namespaces — confirmed.)

### 6.9 `serviceErrorToStatus` mappings

**File:** `src/app/api/_helpers/serviceErrorToStatus.ts`. Add
entries for the six Session 2 agent error codes per master §17:

```typescript
case 'AGENT_UNAVAILABLE': return 503;
case 'AGENT_TOOL_VALIDATION_FAILED': return 422;
case 'AGENT_SESSION_NOT_FOUND': return 404;
case 'AGENT_SESSION_EXPIRED': return 410;
case 'AGENT_STRUCTURED_RESPONSE_INVALID': return 422;
case 'ONBOARDING_INCOMPLETE': return 422;
```

### 6.10 `journalEntryService.ts` header comment fix (housekeeping)

Discovered during drafting via the Cited-Code Verification grep.
File header comment at `src/services/accounting/journalEntryService.ts:16-17`:

> *"Phase 1.1 supports manual entries and reversals only. Agent source (dry_run, idempotency) deferred to Phase 1.2 — rejected"*

The comment is stale. Session 2's refine removal made the agent
path accepted. Session 4 updates the comment to reflect current
reality:

```typescript
// Phase 1.2+ supports manual entries, reversals, and
// agent-sourced entries with dry_run + idempotency_key.
// The agent confirm route (src/app/api/agent/confirm/route.ts)
// replays the stored tool_input with dry_run: false — this
// service's post function handles both paths identically at
// the transaction layer.
```

Single-line doc fix, lands in commit 4 alongside the executeTool
wiring (same file family).

### 6.11 Mandatory pre-execution Cited-Code Verification grep

Per conventions.md. Before commit 1:

```bash
grep -nE 'Phase 1\.1|Phase 1\.2|not implemented|TODO|DEPRECATED' \
  src/agent/orchestrator/*.ts \
  src/services/accounting/journalEntryService.ts
grep -rnE "Session 4" src/agent/
```

Expected hits (known markers from Session 2/3 forward-pointers —
the checklist for §6.1–§6.5 above):

1. `src/agent/orchestrator/buildSystemPrompt.ts:11` — OrgContext slot
2. `src/agent/orchestrator/index.ts:5` — real client swap
3. `src/agent/orchestrator/index.ts:10` — OrgContextManager deferred
4. `src/agent/orchestrator/index.ts:76` — real client wired note
5. `src/agent/orchestrator/index.ts:348-349` — dry_run=false throw
6. `src/agent/orchestrator/index.ts:352-355` — session-2 stubs
7. `src/agent/orchestrator/callClaude.ts:5` — real client replace
8. `src/agent/prompts/orgContext.ts:3,10` — stub expansion
9. `src/services/accounting/journalEntryService.ts:16-17` — stale header (§6.10 fixes)

Every hit must be addressed in Session 4's commits (either
removed, updated, or explicitly resolved). Close-out recap cites
each.

---

## 7. Exit Criteria

Sixteen `S4-N` criteria.

| # | Criterion | Verification |
|---|---|---|
| S4-1 | `OrgContextManager` full shape at `src/agent/memory/orgContextManager.ts` | File exists; exports `OrgContext`, `FiscalPeriodSummary`, `loadOrgContext` |
| S4-2 | Session 3 stub `src/agent/prompts/orgContext.ts` deleted | `test -f` returns absent |
| S4-3 | `loadOrgContext` returns full master §8 shape for seeded org | CA-53 passes |
| S4-4 | OrgContext injection prose contains names, excludes UUIDs | CA-54 passes (grep the generated prompt for `[0-9a-f]{8}-` regex → zero hits) |
| S4-5 | Real `callClaude` production path reachable when `__mockFixture === null` | CA-66 (smoke test) passes when `ANTHROPIC_API_KEY` set; skipped otherwise |
| S4-6 | Error classification: 401/429/5xx/network/malformed each → correct `ServiceError` | CA-55 through CA-59 pass |
| S4-7 | `executeTool` has real dispatch for all 10 tools | `grep 'session-2-stub' src/agent/orchestrator/index.ts` → zero hits |
| S4-8 | `/api/agent/message` returns a valid `AgentResponse` | CA-60 passes |
| S4-9 | `/api/agent/confirm` pending → confirmed | CA-61 passes |
| S4-10 | `/api/agent/confirm` confirmed → idempotent 200 | CA-61 passes (same test, second call) |
| S4-11 | `/api/agent/confirm` stale → 422 | CA-62 passes |
| S4-12 | `/api/agent/confirm` unknown idempotency_key → 404 | CA-63 passes |
| S4-13 | Four `audit_log.action` values emitted | CA-64, CA-65 pass |
| S4-14 | `serviceErrorToStatus` has entries for all 6 agent codes | `grep -E 'AGENT_UN\|AGENT_TOOL_VAL\|AGENT_SESSION\|AGENT_STRUCT\|ONBOARDING' src/app/api/_helpers/serviceErrorToStatus.ts` returns 6 |
| S4-15 | `journalEntryService.ts` header comment updated | grep for "rejected" on lines 16-17 → zero hits |
| S4-16 | Full regression clean: 191 baseline + new CA-53–66 = ~205 tests, 0 failures | `pnpm test` |

---

## 8. Test delta

Session 4 adds **14 new tests** (CA-53 through CA-66). Per
Pre-decision 4, only CA-66 hits real Claude; all others are
fixture-driven or direct-DB.

| # | File | Asserts |
|---|---|---|
| CA-53 | `tests/integration/orgContextManagerLoad.test.ts` | `loadOrgContext(SEED.ORG_HOLDING)` returns full master §8 shape; `fiscal_periods` array non-empty; `controllers` includes SEED.USER_CONTROLLER |
| CA-54 | `tests/integration/orgContextInjectionNoUUIDs.test.ts` | `buildSystemPrompt` with non-null orgContext produces a prompt that matches `org_name` + `industry_display_name` + `functional_currency` substrings AND matches zero `[0-9a-f]{8}-[0-9a-f]{4}-` UUID patterns (regex-based grep of the returned string) |
| CA-55 | `tests/integration/callClaude401.test.ts` | Inject 401 error; `callClaude` throws `ServiceError('AGENT_UNAVAILABLE', ...)`; no retry |
| CA-56 | `tests/integration/callClaude429.test.ts` | Inject 429 on first call, success on third; `callClaude` retries with backoff, returns success; total attempts = 3 |
| CA-57 | `tests/integration/callClaude5xx.test.ts` | Inject 500 twice then success; retries with backoff, succeeds on attempt 3 |
| CA-58 | `tests/integration/callClaudeTimeout.test.ts` | Inject network timeout; retries then fails with `AGENT_UNAVAILABLE` |
| CA-59 | `tests/integration/callClaudeMalformed.test.ts` | Return `Message` with `content: []`; fires structural retry path; eventually returns `agent.error.structured_response_missing` template (shares CA-43's downstream assertion) |
| CA-60 | `tests/integration/apiAgentMessage.test.ts` | POST to `/api/agent/message` with Fixture A seeded in fixture queue; 200 response; body matches `AgentResponse` shape |
| CA-61 | `tests/integration/apiAgentConfirmIdempotent.test.ts` | Dry-run write → POST confirm → 200 with `journal_entry_id` → POST confirm again → 200 with same `journal_entry_id`; only one `journal_entries` row exists |
| CA-62 | `tests/integration/apiAgentConfirmStale.test.ts` | Seed `ai_actions` with `status: 'stale'`; POST confirm → 422 with message matching `/stale/i` |
| CA-63 | `tests/integration/apiAgentConfirmNotFound.test.ts` | POST confirm with unknown idempotency_key → 404 |
| CA-64 | `tests/integration/agentAuditTrail.test.ts` | After a `handleUserMessage` call that executes `listChartOfAccounts` tool: `audit_log` contains rows for `agent.message_processed` and `agent.tool_executed` with matching trace_id |
| CA-65 | `tests/integration/agentSessionOrgSwitchAudit.test.ts` | Load session for (user, org_A) → load for (user, org_B) → `audit_log` contains `agent.session_org_switched` row with `before_state` capturing org_A |
| CA-66 | `tests/integration/agentRealClientSmoke.test.ts` | **Skip-if-`ANTHROPIC_API_KEY`-unset.** Seeds `__setMockFixtureQueue(null)`, calls `handleUserMessage` with a simple greeting, asserts the response extracts to a valid `respondToUser` tool_use. One real Claude API call. |

Drafter may split CA-55–59 into a single file with multiple
it-blocks if that reads better. Final numbering is execution-time.

---

## 9. What is NOT in Session 4

- Onboarding flow state machine (Session 5)
- Form-escape surfaces (Session 6)
- AgentChatPanel UI rewrite (Session 7)
- ProposedEntryCard component rewrite (Session 7)
- Canvas directive extensions (Session 6)
- Real French or Traditional Mandarin translations
- Streaming responses (Q14 → Phase 2)
- Cost ceilings (Q12 → Phase 2)
- ADR-0007 formalization for `dry_run` scope (Phase 2+)
- Master §21 CA-* numbering reconciliation (Session 8)
- Tightening `canvasDirectiveSchema.card` from `z.unknown()` to
  `ProposedEntryCardSchema` (Session 7)

---

## 10. Stop Points for This Session

The execution session produces:

- `src/agent/memory/orgContextManager.ts` (NEW)
- `src/agent/prompts/orgContext.ts` DELETED (stub retired)
- `src/agent/prompts/suffixes/orgContextSummary.ts` (NEW)
- Updated `src/agent/orchestrator/buildSystemPrompt.ts` (OrgContext slot wired)
- Updated `src/agent/orchestrator/index.ts` (loadOrgContext call + executeTool dispatch + four audit emits)
- Updated `src/agent/orchestrator/callClaude.ts` (real-client branch + error classification)
- Possibly `src/agent/orchestrator/callClaude.errors.ts` (if classifier is extracted)
- `src/app/api/agent/message/route.ts` (NEW)
- `src/app/api/agent/confirm/route.ts` (NEW)
- Updated `src/app/api/_helpers/serviceErrorToStatus.ts`
- Possibly `src/shared/schemas/canvas/canvasContext.schema.ts` (if needed for route body)
- Updated `src/services/accounting/journalEntryService.ts` (header comment only)
- 14 new test files (tests/integration/*.test.ts)
- Updated `docs/07_governance/friction-journal.md` (session-close entry)

Stop after all 16 S4 exit criteria pass. Do **not** begin
Session 5.

---

## 11. Commit plan

Six commits. Commit 2 has a founder review gate for the
OrgContext injection prose. Every other commit lands without a
gate, same as Session 2's pattern. Every commit green — no
intentional red intermediate state.

- **Commit 1** — `feat(phase-1.2): OrgContextManager full shape + stub retirement`
  Files: new `src/agent/memory/orgContextManager.ts`, delete old
  stub `src/agent/prompts/orgContext.ts`, retarget imports in
  `buildSystemPrompt.ts` and persona files. Typecheck clean,
  191 existing tests still pass.
- **Commit 2** — `feat(phase-1.2): OrgContext injection prose + buildSystemPrompt wiring`
  Files: new `src/agent/prompts/suffixes/orgContextSummary.ts`,
  updated `buildSystemPrompt.ts` (insert OrgContext slot),
  updated `orchestrator/index.ts` (loadOrgContext call when
  org_id non-null). **Founder review gate for the orgContextSummary
  prose.**
- **Commit 3** — `feat(phase-1.2): real Anthropic client + error classification`
  Files: updated `callClaude.ts` (branched fixture/real),
  possibly new `callClaude.errors.ts`. **Risk note:** this is
  the highest-risk commit — if the fixture branch guard is
  accidentally broken, existing tests regress. Execution
  verifies `__mockFixture !== null` continues to short-circuit
  before the real-API path.
- **Commit 4** — `feat(phase-1.2): executeTool dispatch + audit emits + journalEntryService header fix`
  Files: updated `orchestrator/index.ts` (remove stubs, wire
  services, add four audit emits), updated
  `journalEntryService.ts` (header comment).
- **Commit 5** — `feat(phase-1.2): /api/agent/{message,confirm} routes + serviceErrorToStatus updates`
  Files: new `src/app/api/agent/message/route.ts`, new
  `src/app/api/agent/confirm/route.ts`, updated
  `serviceErrorToStatus.ts`, possibly new
  `canvasContext.schema.ts`.
- **Commit 6** — `test(phase-1.2): CA-53 through CA-66 — OrgContext + real client + routes + audit + smoke`
  Files: 14 new test files. Includes CA-66 smoke test (skippable
  when ANTHROPIC_API_KEY unset).

If execution surfaces a reason to split or merge, do so — but
every commit must leave `pnpm typecheck && pnpm test` green.

---

*End of Phase 1.2 Session 4 Sub-Brief.*
