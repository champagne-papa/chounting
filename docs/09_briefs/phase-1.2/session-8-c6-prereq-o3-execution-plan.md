# Session 8 C6 prereq O3 — Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the prompt-engineering fixes for Bug A (date hallucination) and Bug B (`checkPeriod` null-return panic) defined in the O3 design pass, then verify against real Claude via a single Entry 1 retry.

**Architecture:** Two prompt-layer changes. Site 1 injects a current-date prefix block into `buildSystemPrompt` via a new `temporalContext.ts` suffix-pattern helper (positioned as prefix despite the folder name). Site 2 appends a recovery instruction to `checkPeriodTool.description` and a one-sentence temporal nudge to `postJournalEntryTool.description`. Single-track commit flow per Convention #10 — two code commits, then paid-API retry, then closeout.

**Tech Stack:** TypeScript / Vitest / Anthropic SDK / Supabase. Existing test pattern: content-driven `expect(prompt).toContain(...)` assertions with describe blocks named `'CA-<NN>: <short title>'`.

**Spec:** `docs/09_briefs/phase-1.2/session-8-c6-prereq-o3-agent-date-context.md` (committed at `5096d21`). Section §6 of the spec defines Parts 0–6; this plan decomposes them into bite-sized tasks.

**Hard constraints from the resume prompt:**
- No `pnpm db:reset:clean` until Entry 1 retry is explicitly approved by the user (preserves C6 forensic state for C11 retrospective).
- No paid-API spend until explicit user approval after Phases A–C ship clean. Halt-and-escalate threshold: $3 spent (currently $0.11 of $5 ceiling).
- `pnpm agent:validate` green at every intermediate commit.
- Single-track commit flow — no parallel commits (Convention #10 hedge-predictions discipline; running-count drift is the catalogued meta-bug).

**Worktree override (why this plan lands on `staging`, not in a dedicated worktree):**
The superpowers:writing-plans skill recommends running plans in a dedicated worktree created by the brainstorming skill. This plan deliberately overrides that recommendation. Rationale: Phase 1.2 sub-brief prereqs (O1, O2-v1, O2-v2) have all landed on `staging` via single-track commit flow per Convention #10; introducing worktree branching for O3 would break the established cadence and trigger the running-count drift meta-bug Convention #10 catalogs. The override is deliberate, not an oversight; a future reader (or executor running the plan after a context reset) should not "restore" worktree discipline on the assumption that the plan missed it.

---

## Scope check

Single subsystem: prompt-layer fixes to the agent orchestrator. No subdivision needed. Bundled by attribution + scope + same Entry 1 retry validates.

---

## File structure

**Create (4 files):**
- `src/agent/prompts/suffixes/temporalContext.ts` — Site 1 helper. Exports `temporalContextSuffix(now: Date): string`. Comment header notes "suffix" naming is for filesystem consistency; positioned as prefix in `buildSystemPrompt`.
- `tests/integration/buildSystemPromptTemporal.test.ts` — CA-84. Six tests (T1–T6) covering Site 1 plus tool-description "Current date above" anchors.
- `tests/integration/checkPeriodToolDescription.test.ts` — CA-85. One test (T7) covering Site 2 description content directly.
- `tests/integration/agentNullCheckPeriodRecovery.test.ts` — CA-86. One test (T8) — the Bug B regression test framed per spec §5.d.

**Modify (8 files):**
- `src/agent/orchestrator/buildSystemPrompt.ts` — add required `now: Date` field to `BuildSystemPromptInput`; wire `temporalContextSuffix(input.now)` as the first element of the composition array; add the mirrored comment.
- `src/agent/orchestrator/index.ts` — update the `buildSystemPrompt` call site to pass `now: new Date()`. Verify this is the only call site via grep.
- `src/agent/tools/checkPeriod.ts` — append the recovery instruction (primary or contingency text per Phase A finding) to `checkPeriodTool.description`.
- `src/agent/tools/postJournalEntry.ts` — append the locked 15-word nudge to `postJournalEntryTool.description`.
- `tests/integration/buildSystemPromptComposition.test.ts` (CA-48) — add `now: new Date('2026-04-21T00:00:00Z')` to the test input.
- `tests/integration/buildSystemPromptOnboarding.test.ts` (CA-49) — add `now` to all three test inputs.
- `tests/integration/buildSystemPromptCanvas.test.ts` (CA-50) — add `now` to all test inputs.
- `tests/integration/buildSystemPromptLocales.test.ts` (CA-52) — add `now` to all test inputs.

**Append (1 file, Phase E closeout):**
- `docs/07_governance/friction-journal.md` — O3 closeout entry. Includes Part 0c finding (either Convention #9 datapoint per hypothesis (ii), or one-line note per hypothesis (i)), OI-4 corrective note about `periodService.isOpen()` return shape, and Entry 1 retry outcome.

---

## Phase A — Part 0c transcript verification (read-only, no commit)

Per spec §3.c and §6 Part 0c. Determines whether the Site 2 contingency text substitution applies to Phase C. Per the user's carry-forward note, the finding is captured in the Phase E closeout friction journal entry **either way** — same write-the-outcome-either-way discipline §5.a's pre-draft changelog applies.

### Task A1: Locate the C6 paid-run log files

**Files:**
- Read: `~/chounting-logs/ec-2-run-20260421T201938Z.log`
- Read: `~/chounting-logs/ec-2-run-20260421T232045Z.log`

- [ ] **Step A1.1: Verify both log files exist**

Run:
```bash
ls -lh ~/chounting-logs/ec-2-run-20260421T201938Z.log ~/chounting-logs/ec-2-run-20260421T232045Z.log
```

Expected: both files listed with non-zero sizes.

If either is missing, halt and report — the resume prompt named both as forensic evidence; their absence is itself a finding worth surfacing.

### Task A2: Search for `is_open=false` literal vs. `null` reasoning

- [ ] **Step A2.1: Grep both logs for `is_open` literal references in agent output**

Run:
```bash
grep -nE 'is_open' ~/chounting-logs/ec-2-run-20260421T201938Z.log ~/chounting-logs/ec-2-run-20260421T232045Z.log
```

Expected: zero or more matches. Each match is a candidate datapoint — examine context to distinguish (a) the agent's chain-of-thought referencing the field, (b) tool output rendering, (c) log scaffolding.

- [ ] **Step A2.2: Grep both logs for `null` references in agent reasoning**

Run:
```bash
grep -nE '(returned|returns|got|received|response).{0,20}null' ~/chounting-logs/ec-2-run-20260421T201938Z.log ~/chounting-logs/ec-2-run-20260421T232045Z.log
```

Expected: zero or more matches. Same examination criterion — find references in agent reasoning vs. log scaffolding.

- [ ] **Step A2.3: Read the surrounding context for each match**

For each line returned by Steps A2.1 and A2.2, read ±20 lines of context to determine whether the reference is in the agent's chain-of-thought, the tool result, or log scaffolding.

### Task A3: Determine hypothesis and record finding

- [ ] **Step A3.1: Determine which hypothesis fires**

**Hypothesis (i):** The agent reasoned over `null` directly. No `is_open` field invented. The friction journal's "is_open=false" wording was the journal author's paraphrase. → **Primary Site 2 text applied without contingency.**

**Hypothesis (ii):** The agent's chain-of-thought literally referenced `is_open=false` (or another invented field name) when receiving `null`. → **Convention #9 datapoint AND apply contingency text substitution to Phase C.**

Record the finding in conversation context for use by Phase C (contingency decision) and Phase E (friction journal entry). Do not write the finding to disk yet — Phase E captures it as part of the closeout commit.

If the logs are insufficient to determine (e.g., agent's chain-of-thought is summarized rather than verbatim, or the log scaffolding obscures the source of the `is_open` references), default to **applying the contingency text** as cheap insurance. Flag this in the Phase E friction entry as "Part 0c indeterminate; contingency applied as cheap insurance per spec §5.c."

**Why indeterminate → contingency is strictly safer (not just conservative):** The contingency text's trigger clause ("returns null or otherwise indicates the period is not available for posting") is a **strict superset** of primary's coverage ("returns null"). If the agent reasons over `null` literally, the contingency still fires correctly on null (the superset contains the narrower case). If the agent invented a field name, the contingency fires on whatever field name the agent invented (covered by "or otherwise indicates the period is not available"). Therefore contingency is safe both when hypothesis (ii) is confirmed and when the hypothesis is indeterminate. Primary text is only chosen when hypothesis (i) is **explicitly confirmed** from the transcript — it's strictly narrower and fails to trigger if the agent's internal representation diverges from literal null. When in doubt, the broader trigger is the strictly safer choice; "default to contingency" is a reasoned superset selection, not a hedge.

- [ ] **Step A3.2: Note: no commit at the end of Phase A**

Phase A is read-only verification. The finding is held in conversation context until Phase C consumes it (contingency decision) and Phase E records it (friction journal entry).

---

## Phase B — Site 1 (Bug A): temporal context injection

End of Phase B = Commit 1. Bug A side — temporal block + wiring + four temporal-block tests + updated existing tests.

### Task B1: Write the failing T1 test

**Files:**
- Create: `tests/integration/buildSystemPromptTemporal.test.ts`

- [ ] **Step B1.1: Create the test file with T1 (signed-in render)**

Create `tests/integration/buildSystemPromptTemporal.test.ts`:

```typescript
// tests/integration/buildSystemPromptTemporal.test.ts
// CA-84: buildSystemPrompt prefixes a temporal context block
// emitting current date as dual UTC + org-local stamps. Site 1
// of O3 (per docs/09_briefs/phase-1.2/session-8-c6-prereq-o3-
// agent-date-context.md §5.b). Block is positioned as a prefix
// before the persona body so tool descriptions referencing
// "the Current date above" resolve to a true positional anchor.

import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '@/agent/orchestrator/buildSystemPrompt';
import { SEED } from '../setup/testDb';
import { makeOrgContextFixture } from '../fixtures/agent/orgContextFixture';

// FIXED_NOW is deliberately chosen to match the spec's example stamps
// (2026-04-21) for readability when comparing test output to the spec.
// It is arbitrary otherwise; any fixed Date works. Do not change to
// `new Date()` — determinism is load-bearing (tests depend on the ISO
// date string matching the asserted substrings).
const FIXED_NOW = new Date('2026-04-21T00:00:00Z');

describe('CA-84: buildSystemPrompt temporal context', () => {
  it('renders the temporal block for signed-in (controller + non-null orgContext)', () => {
    const prompt = buildSystemPrompt({
      persona: 'controller',
      orgContext: makeOrgContextFixture(),
      locale: 'en',
      user: { user_id: SEED.USER_CONTROLLER, display_name: 'Jamie' },
      now: FIXED_NOW,
    });

    expect(prompt).toContain('Current date: 2026-04-21 (ISO 8601, UTC)');
    expect(prompt).toContain('Today (org-local): 2026-04-21 (UTC — org timezone not yet configured; Phase 2 will resolve from organizations.timezone)');
  });
});
```

- [ ] **Step B1.2: Run the test to verify it fails**

Run:
```bash
pnpm test tests/integration/buildSystemPromptTemporal.test.ts
```

Expected: FAIL. Failure mode is one of:
- `BuildSystemPromptInput` does not accept `now` (TypeScript error)
- The prompt does not contain the expected strings (assertion failures)

Both are acceptable failing states — they confirm the test is executable and exercises code that doesn't yet have the temporal block.

### Task B2: Create `temporalContext.ts`

**Files:**
- Create: `src/agent/prompts/suffixes/temporalContext.ts`

- [ ] **Step B2.1: Create the temporal context helper**

Create `src/agent/prompts/suffixes/temporalContext.ts`:

```typescript
// src/agent/prompts/suffixes/temporalContext.ts
// O3 Site 1 (Bug A fix). Injects current-date context into the
// system prompt as dual UTC + org-local stamps so the agent
// can resolve relative date expressions ("this month," "today,"
// "yesterday") against an authoritative anchor instead of
// falling back to training-data temporal priors.
//
// Filename uses the "suffix" naming convention for filesystem
// consistency with sibling helpers in this folder
// (orgContextSummary.ts, onboardingSuffix.ts, canvasContextSuffix.ts).
// Positioned as a PREFIX in buildSystemPrompt's composition order
// (before basePersonaPrompt) because the persona body's
// availableToolsSection() renders tool descriptions that reference
// "the Current date above" — those references must resolve to a
// block that physically precedes them in the rendered prompt.
//
// Phase 1.2 design (per docs/09_briefs/phase-1.2/session-8-c6-prereq-
// o3-agent-date-context.md §5.b): both stamps emit identical UTC
// values because organizations.timezone does not exist yet (Phase 2
// follow-up — see Open Item OI-2). The "Phase 2 will resolve" note
// in the org-local stamp tells the agent why the two values are
// currently identical.

export function temporalContextSuffix(now: Date): string {
  const isoDate = now.toISOString().slice(0, 10);
  return [
    `Current date: ${isoDate} (ISO 8601, UTC)`,
    `Today (org-local): ${isoDate} (UTC — org timezone not yet configured; Phase 2 will resolve from organizations.timezone)`,
  ].join('\n');
}
```

- [ ] **Step B2.2: Verify the file compiles in isolation**

Run:
```bash
pnpm tsc --noEmit src/agent/prompts/suffixes/temporalContext.ts
```

Expected: no output (clean compile). If errors, fix before proceeding.

### Task B3: Wire `temporalContextSuffix` into `buildSystemPrompt`

**Files:**
- Modify: `src/agent/orchestrator/buildSystemPrompt.ts`

- [ ] **Step B3.1: Read the current `buildSystemPrompt.ts` to verify line numbers**

Run:
```bash
sed -n '30,80p' src/agent/orchestrator/buildSystemPrompt.ts
```

Expected: see the `BuildSystemPromptInput` interface (lines ~39–46) and the `buildSystemPrompt` function (lines ~48–75). If the line numbers have drifted from the spec's Part 0b grep, adapt the edit instructions accordingly.

- [ ] **Step B3.2: Add `now: Date` to the `BuildSystemPromptInput` interface**

Edit `src/agent/orchestrator/buildSystemPrompt.ts`. Add the `now` field as a required field on `BuildSystemPromptInput`:

```typescript
export interface BuildSystemPromptInput {
  persona: Persona;
  orgContext: OrgContext | null;
  locale: Locale;
  canvasContext?: CanvasContext;
  user: { user_id: string; display_name?: string };
  onboarding?: OnboardingState | null;
  now: Date; // O3 Site 1 — current date for temporal context injection (required, no default; injected by orchestrator and tests)
}
```

- [ ] **Step B3.3: Add the import for `temporalContextSuffix`**

At the top of `src/agent/orchestrator/buildSystemPrompt.ts` (with the other suffix imports):

```typescript
import { temporalContextSuffix } from '@/agent/prompts/suffixes/temporalContext';
```

(Verify the existing import alias style — if other suffix imports use a different path form, match that style.)

- [ ] **Step B3.4: Wire `temporalContextSuffix(input.now)` as the first element of the composition array**

In `buildSystemPrompt`'s body, add the mirrored comment and the prefix call. The composition becomes:

```typescript
export function buildSystemPrompt(input: BuildSystemPromptInput): string {
  // O3 Site 1: temporalContextSuffix is positioned as a PREFIX despite
  // "suffix" in the name — see comment in temporalContext.ts for full
  // rationale (filesystem consistency with sibling suffixes/ files).
  // Tool descriptions reference "the Current date above" — that anchor
  // must precede the persona body in render order.
  return [
    temporalContextSuffix(input.now),
    basePersonaPrompt(input),
    orgContextSummary(input.orgContext),
    localeDirective(input.locale),
    onboardingSuffix(input.onboarding ?? null),
    canvasContextSuffix(input.canvasContext),
  ].filter(Boolean).join('\n\n');
}
```

(If the existing function body has additional logic — e.g., the `genericOnboardingSuffix` fallback at lines 60–68 per the spec's Part 0b grep — preserve that logic and adapt the array. Specifically, if the existing pattern is `if (suffix === '') { suffix = genericOnboardingSuffix(); }`, keep that branching and just prefix `temporalContextSuffix(input.now)` to the final concatenation.)

### Task B4: Update the orchestrator call site

**Files:**
- Modify: `src/agent/orchestrator/index.ts`

- [ ] **Step B4.1: Find all call sites of `buildSystemPrompt`**

Run:
```bash
grep -rn "buildSystemPrompt(" src/ tests/ | grep -v "^tests/integration/buildSystemPrompt"
```

Expected: list of call sites. The non-test sites are the production callers that need `now: new Date()` added. Existing test sites are handled in Task B6.

- [ ] **Step B4.2: Update each non-test call site to pass `now: new Date()`**

For each call site found in Step B4.1, add `now: new Date(),` to the input object. Example for the orchestrator (the canonical site):

```typescript
const systemPrompt = buildSystemPrompt({
  persona,
  orgContext,
  locale,
  canvasContext,
  user: { user_id: ctx.caller.user_id, display_name: ... },
  onboarding,
  now: new Date(), // O3 Site 1 — current date for temporal context block
});
```

- [ ] **Step B4.3: Run typecheck to confirm all call sites are updated**

Run:
```bash
pnpm tsc --noEmit
```

Expected: clean. If TypeScript errors remain ("Property 'now' is missing in type"), they identify call sites that were missed in Step B4.2 — fix them.

### Task B5: Update the four existing `buildSystemPrompt*.test.ts` files

**Files:**
- Modify: `tests/integration/buildSystemPromptComposition.test.ts`
- Modify: `tests/integration/buildSystemPromptOnboarding.test.ts`
- Modify: `tests/integration/buildSystemPromptCanvas.test.ts`
- Modify: `tests/integration/buildSystemPromptLocales.test.ts`

- [ ] **Step B5.1: Add `now: new Date('2026-04-21T00:00:00Z')` to each test's input object**

For each of the four files, every `buildSystemPrompt({...})` call needs `now: new Date('2026-04-21T00:00:00Z'),` added to the input object. Use the same fixed Date across all existing tests for fixture stability.

(Optional: factor the fixed Date into a shared constant `const FIXED_NOW = new Date('2026-04-21T00:00:00Z');` at the top of each file. Keep this consistent with the new `buildSystemPromptTemporal.test.ts` from Task B1.)

- [ ] **Step B5.2: Run the four existing test files to confirm they're still green**

Run:
```bash
pnpm test tests/integration/buildSystemPromptComposition.test.ts tests/integration/buildSystemPromptOnboarding.test.ts tests/integration/buildSystemPromptCanvas.test.ts tests/integration/buildSystemPromptLocales.test.ts
```

Expected: all green. The temporal block is purely additive — none of the existing assertions should be affected.

If any test fails, the failure is either (a) a stale assertion that conflicts with the new prefix block (e.g., an assertion about prompt structure that the temporal block now disrupts) or (b) a missing `now` field. Fix and re-run.

### Task B6: Verify T1 now passes

- [ ] **Step B6.1: Run T1**

Run:
```bash
pnpm test tests/integration/buildSystemPromptTemporal.test.ts -t "renders the temporal block for signed-in"
```

Expected: PASS. The temporal block is wired and the prompt now contains both expected strings.

### Task B7: Add T2 (onboarding state)

**Files:**
- Modify: `tests/integration/buildSystemPromptTemporal.test.ts`

- [ ] **Step B7.1: Append T2 to the describe block**

Add a second `it` block inside the existing `describe('CA-84: buildSystemPrompt temporal context', ...)`:

```typescript
  it('renders the temporal block for onboarding (controller + null orgContext)', () => {
    const prompt = buildSystemPrompt({
      persona: 'controller',
      orgContext: null,
      locale: 'en',
      user: { user_id: SEED.USER_CONTROLLER, display_name: 'Jamie' },
      now: FIXED_NOW,
    });

    expect(prompt).toContain('Current date: 2026-04-21 (ISO 8601, UTC)');
    expect(prompt).toContain('Today (org-local): 2026-04-21 (UTC — org timezone not yet configured; Phase 2 will resolve from organizations.timezone)');
  });
```

- [ ] **Step B7.2: Run T2 to verify it passes**

Run:
```bash
pnpm test tests/integration/buildSystemPromptTemporal.test.ts -t "renders the temporal block for onboarding"
```

Expected: PASS. The temporal block renders identically regardless of org-state because the function takes only `now: Date` and ignores org context.

### Task B8: Add T3 (both stamps with identical UTC value)

- [ ] **Step B8.1: Append T3 to the describe block**

```typescript
  it('renders both UTC and org-local stamps with identical UTC values under Phase 1.2', () => {
    const prompt = buildSystemPrompt({
      persona: 'controller',
      orgContext: makeOrgContextFixture(),
      locale: 'en',
      user: { user_id: SEED.USER_CONTROLLER, display_name: 'Jamie' },
      now: FIXED_NOW,
    });

    // Both stamps must be present
    expect(prompt).toContain('Current date:');
    expect(prompt).toContain('Today (org-local):');

    // Phase 1.2 (route ii — UTC-only): both stamps share the same
    // ISO date value; Phase 2 will diverge them when organizations.timezone
    // resolves to a non-UTC IANA TZ. See OI-2.
    const utcMatch = prompt.match(/Current date: (\d{4}-\d{2}-\d{2})/);
    const orgLocalMatch = prompt.match(/Today \(org-local\): (\d{4}-\d{2}-\d{2})/);
    expect(utcMatch?.[1]).toBe('2026-04-21');
    expect(orgLocalMatch?.[1]).toBe('2026-04-21');
    expect(utcMatch?.[1]).toBe(orgLocalMatch?.[1]);
  });
```

- [ ] **Step B8.2: Run T3 to verify it passes**

Run:
```bash
pnpm test tests/integration/buildSystemPromptTemporal.test.ts -t "renders both UTC and org-local stamps"
```

Expected: PASS.

### Task B9: Add T4 (temporal block is the first section in the rendered prompt)

- [ ] **Step B9.1: Append T4 to the describe block, parameterized over personas**

Per spec §5.a item 3 + Part 4 row T4: assert `prompt.startsWith('Current date:')` for all three personas. Use a `describe.each` or a manual loop to verify cross-persona invariance.

```typescript
  describe.each([
    { persona: 'controller', userId: SEED.USER_CONTROLLER },
    { persona: 'ap_specialist', userId: SEED.USER_AP_SPECIALIST },
    { persona: 'executive', userId: SEED.USER_EXECUTIVE },
  ] as const)('temporal block is the first section in the rendered prompt — $persona', ({ persona, userId }) => {
    it(`temporal block is the first section in the rendered prompt for ${persona}`, () => {
      const prompt = buildSystemPrompt({
        persona,
        orgContext: makeOrgContextFixture(),
        locale: 'en',
        user: { user_id: userId },
        now: FIXED_NOW,
      });

      expect(prompt.startsWith('Current date:')).toBe(true);
    });
  });
```

(If `SEED.USER_AP_SPECIALIST` or `SEED.USER_EXECUTIVE` don't exist, grep `tests/setup/testDb.ts` for the actual seed-user constant names and substitute. The semantic intent is "one user_id per persona.")

- [ ] **Step B9.2: Run T4 to verify it passes for all three personas**

Run:
```bash
pnpm test tests/integration/buildSystemPromptTemporal.test.ts -t "temporal block is the first section"
```

Expected: PASS for all three personas (3 sub-tests under the `describe.each`).

### Task B10: Run the full Bug A test suite + agent:validate

- [ ] **Step B10.1: Run the full `buildSystemPromptTemporal.test.ts` file**

Run:
```bash
pnpm test tests/integration/buildSystemPromptTemporal.test.ts
```

Expected: 6 passing tests (T1, T2, T3, plus 3 sub-tests under T4's `describe.each`). Total test count when run in isolation: 6.

(T5 and T6 — the tool-description "Current date above" anchor tests — are added in Phase C because they assert content that depends on Phase C's tool-description changes.)

- [ ] **Step B10.2: Run the full integration test suite to verify no regressions**

Run:
```bash
pnpm test
```

Expected: 395 baseline + 6 new = **401 passing**. (T7 and T8 land in Phase C; T5 and T6 also land in Phase C as additions to the temporal test file.)

- [ ] **Step B10.3: Run `pnpm agent:validate`**

Run:
```bash
pnpm agent:validate
```

Expected: green. Per the user's "agent:validate green at every intermediate commit" rule.

If red, fix and re-run before committing.

### Task B11: Commit 1 — Site 1 (Bug A) ships

- [ ] **Step B11.1: Stage all Site 1 files**

```bash
git add \
  src/agent/prompts/suffixes/temporalContext.ts \
  src/agent/orchestrator/buildSystemPrompt.ts \
  src/agent/orchestrator/index.ts \
  tests/integration/buildSystemPromptTemporal.test.ts \
  tests/integration/buildSystemPromptComposition.test.ts \
  tests/integration/buildSystemPromptOnboarding.test.ts \
  tests/integration/buildSystemPromptCanvas.test.ts \
  tests/integration/buildSystemPromptLocales.test.ts
```

If Task B4 found additional non-test call sites of `buildSystemPrompt`, add those files too.

- [ ] **Step B11.2: Verify staged files are exactly the expected set**

Run:
```bash
git status
```

Expected: only the files listed above are staged. No untracked files crept in. No unstaged changes to files that should be staged.

- [ ] **Step B11.3: Commit**

Run:
```bash
git commit -m "$(cat <<'EOF'
fix(agent): Finding O3 Site 1 — temporal context injection (Bug A fix)

Adds dual UTC + org-local current-date prefix block to buildSystemPrompt
via new temporalContext.ts helper. Resolves agent's year-hallucination
on relative expressions ("this month," "today," "yesterday") observed
in C6 Entry 1 paid-API runs (agent picked April 2025 for "this month"
with today=2026-04-21).

Site 1 of O3 (per docs/09_briefs/phase-1.2/session-8-c6-prereq-o3-
agent-date-context.md §5.b). Site 2 (checkPeriod recovery instruction
+ postJournalEntry nudge) ships in the next commit.

Test delta: +6 (CA-84). 401/401 green. Existing buildSystemPrompt*.test.ts
files updated to pass deterministic now Date.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step B11.4: Verify the commit landed**

Run:
```bash
git log -1 --stat
```

Expected: one commit, ~9 files changed (or +1 for each additional call site found in Task B4).

---

## Phase C — Site 2 (Bug B): `checkPeriod` recovery + `postJournalEntry` nudge

End of Phase C = Commit 2. Bug B side — both tool descriptions updated, T5/T6 added to the existing temporal test file, T7 and T8 in new test files.

**Phase A finding decision:** Before starting Task C1, confirm the Phase A hypothesis in conversation context. If hypothesis (ii) (agent invented `is_open=false` field name), Task C1 uses the **contingency text**. If hypothesis (i) (agent reasoned over null directly) or indeterminate, Task C1 uses the **primary text**.

### Task C1: Modify `checkPeriodTool.description` (Site 2 recovery instruction)

**Files:**
- Modify: `src/agent/tools/checkPeriod.ts`

- [ ] **Step C1.1: Verify the current description**

Run:
```bash
sed -n '8,13p' src/agent/tools/checkPeriod.ts
```

Expected: the existing `description` string per spec §3.b (Part 0b grep): `'Check whether the fiscal period containing a given entry date is open. Call before proposing a journal entry so the period-lock constraint is known ahead of the post.'`

If the description has drifted, adapt the append in Step C1.2 to preserve the existing prose.

- [ ] **Step C1.2: Append the recovery instruction**

Edit `src/agent/tools/checkPeriod.ts`. Replace the `description` line with the appended form using a template literal:

**If Phase A determined hypothesis (i) or indeterminate (primary text):**

```typescript
  description: `Check whether the fiscal period containing a given entry date is open. Call before proposing a journal entry so the period-lock constraint is known ahead of the post.

If checkPeriod returns null, the period either exists but is locked for posting, or has not yet been created (common just after year-end, before next year's periods are provisioned). Before proceeding, reconsider whether the date you inferred is correct — relative expressions like "this month," "today," or "yesterday" should resolve against the Current date above. If you still believe the user intends that date, confirm it with them and let them know the period is not currently available for posting — never ask for or display internal IDs, UUIDs, or dry-run handles.`,
```

**If Phase A determined hypothesis (ii) (contingency text — broaden trigger clause):**

```typescript
  description: `Check whether the fiscal period containing a given entry date is open. Call before proposing a journal entry so the period-lock constraint is known ahead of the post.

If checkPeriod returns null or otherwise indicates the period is not available for posting, the period either exists but is locked for posting, or has not yet been created (common just after year-end, before next year's periods are provisioned). Before proceeding, reconsider whether the date you inferred is correct — relative expressions like "this month," "today," or "yesterday" should resolve against the Current date above. If you still believe the user intends that date, confirm it with them and let them know the period is not currently available for posting — never ask for or display internal IDs, UUIDs, or dry-run handles.`,
```

(The only difference is the trigger clause: "returns null" vs. "returns null or otherwise indicates the period is not available for posting." Single-line text substitution per spec §5.c.)

- [ ] **Step C1.3: Verify TypeScript compiles**

Run:
```bash
pnpm tsc --noEmit
```

Expected: clean.

### Task C2: Modify `postJournalEntryTool.description` (Site 1 defense-in-depth nudge)

**Files:**
- Modify: `src/agent/tools/postJournalEntry.ts`

- [ ] **Step C2.1: Verify the current description**

Run:
```bash
sed -n '8,13p' src/agent/tools/postJournalEntry.ts
```

Expected: per spec §6 Part 3b (verified by grep at `src/agent/tools/postJournalEntry.ts:10`):
`'Create a journal entry. ALWAYS use dry_run=true on the first call. The orchestrator replays a second call with dry_run=false only after the user approves the ProposedEntryCard.'`

- [ ] **Step C2.2: Append the locked 15-word nudge**

Edit `src/agent/tools/postJournalEntry.ts`. Replace the `description` line:

```typescript
  description: `Create a journal entry. ALWAYS use dry_run=true on the first call. The orchestrator replays a second call with dry_run=false only after the user approves the ProposedEntryCard. Resolve relative entry_date expressions (e.g., "this month," "today," "yesterday") against the Current date above.`,
```

(Note the embedded double-quotes around the date examples — escape them per the existing string-quoting style in the file. If the file uses single quotes for outer strings, swap accordingly. The semantic content is the locked text in spec §6 Part 3b.)

- [ ] **Step C2.3: Verify TypeScript compiles**

Run:
```bash
pnpm tsc --noEmit
```

Expected: clean.

### Task C3: Add T5 to `buildSystemPromptTemporal.test.ts` (checkPeriod references "Current date above")

**Files:**
- Modify: `tests/integration/buildSystemPromptTemporal.test.ts`

- [ ] **Step C3.1: Append T5 to the describe block**

```typescript
  it('checkPeriod tool description references "the Current date above"', () => {
    const prompt = buildSystemPrompt({
      persona: 'controller',
      orgContext: makeOrgContextFixture(),
      locale: 'en',
      user: { user_id: SEED.USER_CONTROLLER, display_name: 'Jamie' },
      now: FIXED_NOW,
    });

    // Find the checkPeriod tool-bullet in the rendered prompt
    // (availableToolsSection emits each tool as `\`${name}\` — ${description}`).
    const checkPeriodBulletStart = prompt.indexOf('`checkPeriod`');
    expect(checkPeriodBulletStart).toBeGreaterThan(-1);

    // The recovery instruction (Site 2) is appended to checkPeriod's
    // description, so the rendered tool-bullet must contain "the Current
    // date above" within the bullet's body.
    const nextToolBoundary = prompt.indexOf('\n- `', checkPeriodBulletStart + 1);
    const checkPeriodBulletBody = nextToolBoundary === -1
      ? prompt.slice(checkPeriodBulletStart)
      : prompt.slice(checkPeriodBulletStart, nextToolBoundary);
    expect(checkPeriodBulletBody).toContain('the Current date above');
  });
```

- [ ] **Step C3.2: Run T5 to verify it passes**

Run:
```bash
pnpm test tests/integration/buildSystemPromptTemporal.test.ts -t "checkPeriod tool description references"
```

Expected: PASS. (If `availableToolsSection` uses a different bullet delimiter than `'\n- \`'`, adapt the boundary detection in Step C3.1.)

### Task C4: Add T6 to `buildSystemPromptTemporal.test.ts` (postJournalEntry references "Current date above")

- [ ] **Step C4.1: Append T6 to the describe block**

```typescript
  it('postJournalEntry tool description references "the Current date above"', () => {
    const prompt = buildSystemPrompt({
      persona: 'controller',
      orgContext: makeOrgContextFixture(),
      locale: 'en',
      user: { user_id: SEED.USER_CONTROLLER, display_name: 'Jamie' },
      now: FIXED_NOW,
    });

    const postJournalBulletStart = prompt.indexOf('`postJournalEntry`');
    expect(postJournalBulletStart).toBeGreaterThan(-1);

    const nextToolBoundary = prompt.indexOf('\n- `', postJournalBulletStart + 1);
    const postJournalBulletBody = nextToolBoundary === -1
      ? prompt.slice(postJournalBulletStart)
      : prompt.slice(postJournalBulletStart, nextToolBoundary);
    expect(postJournalBulletBody).toContain('the Current date above');
  });
```

- [ ] **Step C4.2: Run T6 to verify it passes**

Run:
```bash
pnpm test tests/integration/buildSystemPromptTemporal.test.ts -t "postJournalEntry tool description references"
```

Expected: PASS.

### Task C5: Create `checkPeriodToolDescription.test.ts` (T7)

**Files:**
- Create: `tests/integration/checkPeriodToolDescription.test.ts`

- [ ] **Step C5.1: Create the test file with T7**

```typescript
// tests/integration/checkPeriodToolDescription.test.ts
// CA-85: checkPeriodTool.description includes the null-recovery
// instruction with both locked-past and not-yet-created cases
// named, plus the UUID/dry-run-handle leak prohibition. Site 2
// of O3 (per docs/09_briefs/phase-1.2/session-8-c6-prereq-o3-
// agent-date-context.md §5.c).

import { describe, it, expect } from 'vitest';
import { checkPeriodTool } from '@/agent/tools/checkPeriod';

describe('CA-85: checkPeriod tool description', () => {
  it('includes the null-recovery instruction with both locked and not-created cases named', () => {
    const description = checkPeriodTool.description;

    // Trigger clause references the actual return signal
    expect(description).toContain('returns null');

    // Both ambiguous cases named
    expect(description).toContain('locked for posting');
    expect(description).toContain('has not yet been created');

    // Year-end framing as the typical not-yet-created cause
    expect(description).toContain('year-end');

    // Recovery action — reconsider date inference first
    expect(description).toContain('reconsider whether the date you inferred is correct');
    expect(description).toContain('the Current date above');

    // Output discipline — broadened ID-leak prohibition
    expect(description).toContain('never ask for or display internal IDs, UUIDs, or dry-run handles');
  });
});
```

**If Phase A determined hypothesis (ii) (contingency text applied):** also add this assertion to T7's `it` block:

```typescript
    expect(description).toContain('or otherwise indicates the period is not available for posting');
```

- [ ] **Step C5.2: Run T7 to verify it passes**

Run:
```bash
pnpm test tests/integration/checkPeriodToolDescription.test.ts
```

Expected: PASS.

### Task C6: Create `agentNullCheckPeriodRecovery.test.ts` (T8 — Bug B regression)

**Files:**
- Create: `tests/integration/agentNullCheckPeriodRecovery.test.ts`

This is the Bug B regression test framed per spec §5.d. Scaffolding was locked pre-plan by reading the sibling agent-orchestrator integration tests (`agentOrchestratorHappyPath.test.ts`, `agentToolCallThenRespond.test.ts`, `agentOrgIdInjection.test.ts`). Key codebase conventions that shape this test:

- **The codebase mocks Anthropic at the fixture-queue level, not services at the vi.mock() level.** `__setMockFixtureQueue([turn1, turn2, ...])` from `@/agent/orchestrator/callClaude` scripts what the model emits; services hit the real test DB. Deviating from this pattern (adding `vi.mock('@/services/accounting/periodService', ...)`) should be avoided.
- **`periodService.isOpen()` naturally returns `null` for dates outside any seeded fiscal period.** The seed at `src/db/seed/dev.sql:117-119` creates only a current-FY open period for `SEED.ORG_HOLDING`. An `entry_date` outside that range (e.g., `'2025-04-01'` — exactly Bug B's observed scenario) produces a real `null` return from the real service against the real DB. No service mocking required.
- **Test limitation (documented explicitly):** With fixture-queued Anthropic responses, the test scripts what the model emits — the assertions on the response's `template_id` / `params` verify that the orchestrator's plumbing handles the null tool-result correctly without leaking UUIDs or fabricating period fields. The test does **not** and **cannot** validate that the recovery-instruction prompt produces safe model behavior under a real Claude call — that validation lives in Phase D's paid-API Entry 1 retry. T8's scope is the orchestrator-plumbing invariant, not the prompt-contract behavior.

- [ ] **Step C6.1: Create the test file**

Create `tests/integration/agentNullCheckPeriodRecovery.test.ts` with the following locked scaffolding (copy verbatim):

```typescript
// tests/integration/agentNullCheckPeriodRecovery.test.ts
// CA-86: When periodService.isOpen() returns null (Bug B's observed
// state — wrong-year date picking a non-existent period), the
// orchestrator's null-handling plumbing must not leak UUIDs or
// fabricate period fields into the agent's user-facing response.
// Test motivation: Bug B observation. Test scope: orchestrator
// plumbing invariant (load-bearing at year-end close, manually-
// locked periods, any future legitimate null path). The prompt-
// contract behavior is validated via Phase D's paid-API Entry 1
// retry; T8's scope is narrower — plumbing, not prompt. Per docs/
// 09_briefs/phase-1.2/session-8-c6-prereq-o3-agent-date-context.md
// §5.d and the execution plan's Task C6 limitation note.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { handleUserMessage } from '@/agent/orchestrator';
import { __setMockFixtureQueue } from '@/agent/orchestrator/callClaude';
import { makeMessage } from '../fixtures/anthropic/makeMessage';
import { makeTestContext } from '../setup/makeTestContext';
import { adminClient } from '@/db/adminClient';
import { SEED } from '../setup/testDb';

const UUID_V4_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

describe('CA-86: agent handles null checkPeriod return', () => {
  beforeEach(() => {
    // Fixture queue:
    //   Turn 1: model emits checkPeriod with entry_date=2025-04-01 (Bug B's
    //           observed wrong-year date). The orchestrator calls the real
    //           periodService.isOpen() which returns null because SEED.ORG_HOLDING
    //           has no 2025 fiscal period (src/db/seed/dev.sql:117-119 seeds
    //           current FY only).
    //   Turn 2: model emits respondToUser with agent.response.natural template.
    //           Params contain ONLY a text field — no period_id, no is_locked,
    //           no start_date/end_date. Assertions verify this shape is preserved
    //           end-to-end without the orchestrator injecting UUID or period
    //           fields from the null tool_result.
    const checkPeriodTurn: Anthropic.Messages.Message = makeMessage(
      [
        {
          type: 'tool_use',
          id: 'toolu_check_T8',
          name: 'checkPeriod',
          input: { entry_date: '2025-04-01' },
          caller: { type: 'direct' },
        },
      ],
      'tool_use',
    );

    const respondToUserTurn: Anthropic.Messages.Message = makeMessage(
      [
        {
          type: 'tool_use',
          id: 'toolu_respond_T8',
          name: 'respondToUser',
          input: {
            template_id: 'agent.response.natural',
            params: {
              text: "I checked the period for April 2025 and it isn't currently available for posting. Could you confirm the entry date you intended?",
            },
          },
          caller: { type: 'direct' },
        },
      ],
      'tool_use',
    );

    __setMockFixtureQueue([checkPeriodTurn, respondToUserTurn]);
  });

  afterEach(async () => {
    __setMockFixtureQueue(null);
    await adminClient()
      .from('agent_sessions')
      .delete()
      .eq('user_id', SEED.USER_CONTROLLER);
  });

  it('preserves response shape when periodService.isOpen() returns null (no UUID leak, no fabricated period fields)', async () => {
    const ctx = makeTestContext({
      user_id: SEED.USER_CONTROLLER,
      org_ids: [SEED.ORG_HOLDING],
    });

    const response = await handleUserMessage(
      {
        user_id: SEED.USER_CONTROLLER,
        org_id: SEED.ORG_HOLDING,
        locale: 'en',
        message: "Paid last year's office rent — $2,400 to Dufferin Properties, cheque went out April 1, 2025.",
      },
      ctx,
    );

    // (1) Plumbing smoke: orchestrator completed the two-turn loop without throwing.
    expect(response.session_id).toBeDefined();
    expect(response.response.template_id).toBe('agent.response.natural');
    expect(response.trace_id).toBe(ctx.trace_id);

    // (2) No UUID leak anywhere in the user-facing response params.
    const paramsJson = JSON.stringify(response.response.params);
    expect(paramsJson).not.toMatch(UUID_V4_REGEX);

    // (3) No fabricated period fields in params. These are fields from the
    //     period type that should NEVER appear in a user-facing response's
    //     params — the orchestrator must not surface them even if the null
    //     handling code is touched in a future refactor.
    expect(paramsJson).not.toContain('period_id');
    expect(paramsJson).not.toContain('is_locked');
    expect(paramsJson).not.toContain('start_date');
    expect(paramsJson).not.toContain('end_date');
    expect(paramsJson).not.toContain('dry_run_entry_id');

    // (4) Verify the real periodService.isOpen() returned null (not a period
    //     object) by inspecting the persisted session's conversation. The
    //     tool_result for checkPeriod must serialize to null (or a null-
    //     shaped value), not to a leaky period object.
    const { data: session } = await adminClient()
      .from('agent_sessions')
      .select('conversation')
      .eq('session_id', response.session_id)
      .single();

    const conv = session!.conversation as Array<{
      role: 'user' | 'assistant';
      content: string | Array<Record<string, unknown>>;
    }>;

    const checkPeriodResults = conv
      .filter((m) => m.role === 'user' && Array.isArray(m.content))
      .flatMap((m) => m.content as Array<Record<string, unknown>>)
      .filter((b) => b.type === 'tool_result' && b.tool_use_id === 'toolu_check_T8');

    expect(checkPeriodResults).toHaveLength(1);
    const toolResult = checkPeriodResults[0];
    // The tool_result's content should serialize the null return. Depending on
    // the orchestrator's serialization, this is typically either the string
    // 'null' or a JSON body parseable to null. Either is acceptable; what's
    // NOT acceptable is a serialized period object with UUID fields.
    const toolResultContent = typeof toolResult.content === 'string'
      ? toolResult.content
      : JSON.stringify(toolResult.content);
    expect(toolResultContent).not.toMatch(UUID_V4_REGEX);
    expect(toolResultContent).not.toContain('period_id');
    expect(toolResultContent).not.toContain('is_locked');
  });
});
```

**Notes on the locked scaffolding:**
- `agent.response.natural` is confirmed in `src/agent/prompts/validTemplateIds.ts:50` as `z.object({ text: z.string() }).strict()`. The fixture's params shape `{ text: "..." }` conforms.
- `SEED.USER_CONTROLLER` / `SEED.ORG_HOLDING` are the canonical controller-with-org test principals per `tests/setup/testDb.ts:26-32`.
- `makeMessage` and `__setMockFixtureQueue` are the established fixture-queue helpers used by all three sibling orchestrator tests.
- `makeTestContext({ user_id, org_ids })` builds a `ServiceContext` with a fresh UUID `trace_id` and locale='en' by default — matches the pattern used in `agentOrchestratorHappyPath.test.ts`.
- The session-cleanup `afterEach` deletes `agent_sessions` rows for `SEED.USER_CONTROLLER` to prevent cross-test pollution; matches existing test hygiene.

- [ ] **Step C6.2: Run T8 to verify it passes**

Run:
```bash
pnpm test tests/integration/agentNullCheckPeriodRecovery.test.ts
```

Expected: PASS. The orchestrator processes the two-turn fixture, calls the real `periodService.isOpen('2025-04-01')` which returns null, forwards the null tool_result to the (fixtured) model, receives the `agent.response.natural` response, and returns a clean `AgentResponse` structure. All five assertion blocks pass.

If the test fails, the failure mode determines the action:
- **Failure in block (1) plumbing:** orchestrator threw. Likely a null-handling bug in the orchestrator or a fixture-setup issue (e.g., `makeMessage` args don't match the helper's signature). Fix and re-run.
- **Failure in block (2)/(3)/(4) leak detection:** orchestrator is leaking UUIDs or period fields into the user-facing response or tool_result serialization. **Halt and surface** — this is a real orchestrator-plumbing bug that O3's prompt-layer fix doesn't address, and it should block the Site 2 commit until investigated.

### Task C7: Run the full test suite + agent:validate

- [ ] **Step C7.1: Run the full integration test suite**

Run:
```bash
pnpm test
```

Expected: 401 (post-Phase B) + 2 (T5, T6) + 1 (T7) + 1 (T8) = **403/403 passing.**

- [ ] **Step C7.2: Run `pnpm agent:validate`**

Run:
```bash
pnpm agent:validate
```

Expected: green.

### Task C8: Commit 2 — Site 2 (Bug B) ships

- [ ] **Step C8.1: Stage all Site 2 files**

```bash
git add \
  src/agent/tools/checkPeriod.ts \
  src/agent/tools/postJournalEntry.ts \
  tests/integration/buildSystemPromptTemporal.test.ts \
  tests/integration/checkPeriodToolDescription.test.ts \
  tests/integration/agentNullCheckPeriodRecovery.test.ts
```

- [ ] **Step C8.2: Verify staged files**

Run:
```bash
git status
```

Expected: only the five files listed above. No accidental adds.

- [ ] **Step C8.3: Commit**

Pick the appropriate commit message based on Phase A's hypothesis:

**If hypothesis (i) or indeterminate (primary text):**

```bash
git commit -m "$(cat <<'EOF'
fix(agent): Finding O3 Site 2 — checkPeriod null-recovery instruction (Bug B fix)

Appends recovery instruction to checkPeriodTool.description teaching the
agent to handle periodService.isOpen()'s null return (locked-past OR
not-yet-created) without fabricating missing entries or exposing UUIDs.
Adds defense-in-depth temporal-context nudge to postJournalEntryTool
description so entry_date relative expressions resolve against the
Current date above (Site 1's prefix block).

Site 2 of O3 (per docs/09_briefs/phase-1.2/session-8-c6-prereq-o3-
agent-date-context.md §5.c). Trigger clause uses primary text
("returns null") per Phase A transcript verification — agent reasoned
over null directly; no Convention #9 datapoint for invented field names.

Test delta: +2 (T5, T6 added to CA-84) + 1 (CA-85) + 1 (CA-86) = +4.
403/403 green.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

**If hypothesis (ii) (contingency text applied):**

```bash
git commit -m "$(cat <<'EOF'
fix(agent): Finding O3 Site 2 — checkPeriod null-recovery instruction (Bug B fix, contingency text)

Appends recovery instruction to checkPeriodTool.description teaching the
agent to handle periodService.isOpen()'s null return (locked-past OR
not-yet-created) without fabricating missing entries or exposing UUIDs.
Adds defense-in-depth temporal-context nudge to postJournalEntryTool
description so entry_date relative expressions resolve against the
Current date above (Site 1's prefix block).

Site 2 of O3 (per docs/09_briefs/phase-1.2/session-8-c6-prereq-o3-
agent-date-context.md §5.c). Trigger clause uses CONTINGENCY text
("returns null or otherwise indicates the period is not available for
posting") per Phase A transcript verification — agent invented field
name when receiving null. Convention #9 datapoint queued for friction
journal closeout entry.

Test delta: +2 (T5, T6 added to CA-84) + 1 (CA-85) + 1 (CA-86) = +4.
403/403 green.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step C8.4: Verify the commit landed**

Run:
```bash
git log -2 --oneline
```

Expected: two commits — Site 2 (this one) on top of Site 1 (from Task B11).

---

## Phase D — Paid-API Entry 1 retry (gated)

**STOP — explicit user approval required before this phase.** Per the resume prompt's hard constraint: "no paid-API spend until explicit user approval after Parts 0c-5 ship clean."

### Task D1: Confirm pre-flight conditions

- [ ] **Step D1.1: Confirm 403/403 + agent:validate green**

Run:
```bash
pnpm test && pnpm agent:validate
```

Expected: 403/403 + green validate.

- [ ] **Step D1.2: Confirm DB state preserved**

Run (local Supabase connection string per the project's standard — see `package.json` `db:seed` script):

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT COUNT(*) FROM agent_sessions WHERE session_id::text LIKE 'f27a3878%';"
```

Expected: at least one row for the C6 session (`f27a3878...` per the resume prompt's preservation note). If zero rows, the DB has been reset prematurely — halt and surface; the C11 retrospective evidence is gone.

Cross-check with `ai_actions` for the same session:

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT COUNT(*) FROM ai_actions WHERE session_id::text LIKE 'f27a3878%';"
```

Expected: at least one row. Same failure mode if zero.

- [ ] **Step D1.3: Pause for explicit user approval**

**Stop here and ask the user:**

> "Phase D pre-flight green: 403/403 tests, agent:validate green, C6 forensic state preserved in agent_sessions / ai_actions. Ready for the Entry 1 paid-API retry. Estimated spend: ~$0.03. Halt-and-escalate threshold remains $3 (currently $0.11 of $5 ceiling). Approve to proceed?"

Do **not** invoke any paid-API code path until the user replies with explicit approval (e.g., "approved", "proceed", "go").

If the user approves, continue to Task D2. If the user defers or declines, halt; the plan can resume from Task D2 in a future session without re-running Phases A–C.

### Task D2: Run the Entry 1 retry with log capture

The EC-2 runner is a **manual browser-driven workflow**, not an automated script. Per `docs/07_governance/ec-2-prompt-set.md:73-95`, Entry 1 retries run against the dev server with a paste-into-UI pattern. The invocation below is locked from the prompt-set doc and is the exact sequence the approval at Step D1.3 is granted for — do not deviate.

- [ ] **Step D2.1: Set up log capture (per `ec-2-prompt-set.md:73-78`)**

Run:
```bash
TS=$(date -u +%Y%m%dT%H%M%SZ)
echo "Log will be written to: /tmp/ec-2-run-${TS}.log"
```

The log path lives outside the project tree per the tee-storm fix at commit `23e536f`. Do not re-tee into `logs/` or any in-tree directory.

- [ ] **Step D2.2: Pre-flight ledger cleanliness check**

Per `ec-2-prompt-set.md:61-71`, verify zero stale agent entries in the last hour for `SEED.ORG_HOLDING`:

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT COUNT(*) FROM journal_entries WHERE org_id = '11111111-1111-1111-1111-111111111111' AND source = 'agent' AND created_at >= NOW() AT TIME ZONE 'UTC' - INTERVAL '1 hour';"
```

Expected: count = 0. If non-zero, dirty pre-state exists and the retry outcome will be ambiguous — halt and investigate before proceeding.

- [ ] **Step D2.3: Start the dev server with log capture (per `ec-2-prompt-set.md:75-78`)**

In a dedicated terminal, run (this will run in the foreground for the duration of the retry):

```bash
pnpm dev 2>&1 | tee "/tmp/ec-2-run-${TS}.log"
```

Wait for the dev server to report "ready" (typically `Ready in Xs` + local URL). Do not proceed until the server is serving.

- [ ] **Step D2.4: Sign in as the controller and open the agent UI**

In a browser:
1. Navigate to `http://localhost:3000` (or whatever local URL the dev server reported).
2. Sign in with the controller seed credentials from CURRENT_STATE: `controller@thebridge.local` / `DevSeed!Controller#1`.
3. Navigate to the Agent / chat surface (the primary ProductionChat view per Session 7 work).

If the sign-in flow or navigation path has drifted since Session 7.1, consult `docs/09_briefs/CURRENT_STATE.md` for the current entry points.

- [ ] **Step D2.5: Paste Entry 1's prompt verbatim and observe the response**

Paste the following text **verbatim** into the agent chat input. Do not rephrase, do not add context, do not split across turns. The text is frozen per `ec-2-prompt-set.md:113-114`:

> Paid this month's office rent — $2,400 to Dufferin Properties, cheque went out on April 1.

Submit and observe. Per `ec-2-prompt-set.md:116-118`:
- **Expected:** ProposedEntryCard with DR Rent Expense 2400.00; CR Cash 2400.00; date 2026-04-01.
- **Good:** Two legs, Dufferin Properties in description, April 1 honored (note: April 1 is the past-tense date in the prompt; agent should NOT default to today's date).
- **Failure (Bug A still firing):** Agent dates to today instead of April 1, or picks a non-2026 year; invents a Prepaid Rent leg.

Record the observed outcome (exact template_id, exact DR/CR lines, exact date, any UUIDs exposed in the card text, any fabricated context).

- [ ] **Step D2.6: Stop the dev server and preserve the log**

In the terminal running `pnpm dev`, send SIGINT (Ctrl+C) to stop the server. The log at `/tmp/ec-2-run-${TS}.log` remains.

Verify the log is non-empty and contains at least one pino `usage` line (Anthropic call telemetry):

```bash
ls -lh "/tmp/ec-2-run-${TS}.log" && grep -c '"usage"' "/tmp/ec-2-run-${TS}.log"
```

Expected: file size > 0, usage-line count >= 1. If either is zero, the Anthropic call may not have completed; do not report spend and flag for investigation.

- [ ] **Step D2.7: Extract spend from the log**

Per `ec-2-prompt-set.md:92-101` — Sonnet 4.6 pricing (rates as of 2026-04-20): **input $3.00/M tokens, output $15.00/M tokens**.

Extract usage tokens from the log:

```bash
grep '"usage"' "/tmp/ec-2-run-${TS}.log" | jq -s '[.[] | .usage] | { input_tokens: (map(.input_tokens // 0) | add), output_tokens: (map(.output_tokens // 0) | add) }'
```

(Requires `jq`; install with `sudo apt install jq` on WSL/Debian/Ubuntu per `ec-2-prompt-set.md:45-48` if missing.)

Compute spend in USD:

```
spend_usd = (input_tokens / 1_000_000 * 3.00) + (output_tokens / 1_000_000 * 15.00)
```

**Halt-and-surface thresholds:**
- **Single call > $0.50:** 16x the expected $0.03 for Entry 1. Halt before reporting and investigate.
- **Cumulative Session 8 spend approaching $3 (currently $0.11 + this retry):** halt per the resume-prompt ceiling.

Record the spend figure for Phase E's friction-journal entry.

### Task D3: Evaluate the retry outcome

- [ ] **Step D3.1: Read the log and apply the spec §6 Part 6 outcome decision tree**

Per spec §6 Part 6:

- **Clean Entry 1** (DR/CR correct, date 2026-04-01, no UUID exposed, no fabricated context): proceed to Phase E.
- **Entry 1 still fails on Bug A** (agent picked a wrong year again): halt-and-escalate. Site 1's injection didn't register against Anthropic's training-data temporal priors. Document in Phase E as the outcome and escalate to a new design pass (placement, formatting, or weight investigation).
- **Entry 1 fixes Bug A but reveals a new failure mode**: halt-and-escalate. New failure mode gets its own design pass (O4) per the C6 closeout discipline.
- **Entry 1 fixes Bug A and the response handles `null` correctly without exposing IDs**: Bug B framing is validated. T8 still guards the contract; Bug B' frequency informs OI-1 over time. Proceed to Phase E.

Record the outcome in conversation context for Phase E's friction journal entry.

---

## Phase E — Closeout

End of Phase E = Commit 3 (closeout). Single closeout commit batches all friction journal entries per the project's batch-at-closeout cadence.

### Task E1: Draft the O3 closeout friction journal entry

**Files:**
- Modify: `docs/07_governance/friction-journal.md` (append)

- [ ] **Step E1.1: Read the friction journal's current tail to find the C6 closeout heading**

Run:
```bash
tail -100 docs/07_governance/friction-journal.md
```

Expected: see the C6 closeout entry (last commit was `6c58c29 notes(friction): Session 8 C6 closeout`). The O3 closeout entry lands as a new sub-section under the existing Phase 1.2 Session 8 heading, after the C6 closeout entry.

- [ ] **Step E1.2: Append the O3 closeout entry**

Append a new section to `docs/07_governance/friction-journal.md`. The structure mirrors the C6 closeout entry's level. Include:

1. **Outcome of Entry 1 retry** (per Task D3.1's finding) — clean / Bug A still firing / new failure mode / Bug A fixed + null handled.
2. **Part 0c finding** (per the user's carry-forward note — write either way):
   - If hypothesis (i): one-line note: "Part 0c transcript check: agent reasoned over null directly; primary Site 2 text applied without contingency."
   - If hypothesis (ii): full Convention #9 datapoint: "agent interprets absent structured data with confidently-wrong field-name reasoning — datapoint #N." Include log evidence (file paths + line ranges) and note the contingency text was applied.
   - If indeterminate: "Part 0c indeterminate; contingency applied as cheap insurance per spec §5.c."
3. **OI-4 corrective note** (queued from Part 0c sub-step iii): "`periodService.isOpen()` returns `period | null`, not `{ is_open: false }`. The C6 closeout entry's `is_open=false` wording was [shorthand / agent-invented per (ii)]; future readers should consult the actual return shape at `src/services/accounting/periodService.ts:51-82`."
4. **Spend tally**: actual paid-API cost from Task D2.7, updated remaining-budget figure, halt-and-escalate threshold reminder.
5. **Test delta**: confirmation of 403/403 (Phase B = 401, Phase C = 403).
6. **Convention #10 retraction count**: increment if any retractions occurred during O3 implementation; otherwise note "no retractions in O3 implementation."
7. **Next steps**: per Task D3.1's outcome — either chunk EC-2 full 20-entry run (if Entry 1 clean) or escalation path (if Entry 1 not clean).

- [ ] **Step E1.3: Verify no doc consistency drift**

Per the project's "what 'done' means" rule (CLAUDE.md): every doc you touched is internally consistent. The friction journal is the only doc this commit touches; verify cross-references to spec §3 / §5 / §9 and OI-1 / OI-4 are accurate.

### Task E2: Update CURRENT_STATE.md if Entry 1 was clean

**Files:**
- Modify: `docs/09_briefs/CURRENT_STATE.md` (conditional)

- [ ] **Step E2.1: If Entry 1 was clean, update CURRENT_STATE.md to reflect O3 ship**

If Entry 1 retry was clean (Task D3.1), append a new section to `docs/09_briefs/CURRENT_STATE.md` under "Phase 1.2" describing O3's ship:

```markdown
### Session 8 C6 prereq O3 — Complete (2026-04-XX)

Sub-brief: spec at `docs/09_briefs/phase-1.2/session-8-c6-prereq-o3-
agent-date-context.md` (5096d21); execution plan at
`docs/09_briefs/phase-1.2/session-8-c6-prereq-o3-execution-plan.md`.

Two commits on top of 5096d21: <Site 1 SHA> (Bug A — temporal context
injection) → <Site 2 SHA> (Bug B — checkPeriod null-recovery instruction
+ postJournalEntry nudge). 403/403 green; pnpm agent:validate green at
both intermediate commits.

Entry 1 retry: clean. <DR/CR description, date, paid-API spend>. EC-2
full 20-entry run unblocked.

Three pre-draft revisions captured in spec §5.a changelog (Bug B scope
collapsed by structural necessity, trigger phrasing corrected from
is_open=false to null, temporal block repositioned as prefix). Part 0c
transcript verification: <hypothesis (i) or (ii) or indeterminate>.
```

If Entry 1 was not clean, leave CURRENT_STATE.md alone — the failure-mode escalation will produce its own session-state update.

### Task E3: Commit 3 — closeout

- [ ] **Step E3.1: Stage closeout files**

```bash
git add docs/07_governance/friction-journal.md
```

If Task E2 updated CURRENT_STATE.md, also:

```bash
git add docs/09_briefs/CURRENT_STATE.md
```

- [ ] **Step E3.2: Verify staged files**

Run:
```bash
git status
```

Expected: only friction-journal.md (and possibly CURRENT_STATE.md). No code changes.

- [ ] **Step E3.3: Commit**

```bash
git commit -m "$(cat <<'EOF'
notes(friction): Session 8 C6 prereq O3 closeout — Entry 1 retry + Part 0c finding + OI-4 note

O3 implementation closeout. Entry 1 paid-API retry: <clean | Bug A still
firing | new failure mode>. Spend: <$X.XX> of $5 Session 8 ceiling.

Part 0c transcript verification: <hypothesis (i): primary text applied |
hypothesis (ii): contingency text applied + Convention #9 datapoint #N |
indeterminate: contingency applied as cheap insurance>.

OI-4 corrective note recorded: periodService.isOpen() returns
period | null, not { is_open: false }; C6 closeout's wording was
<shorthand | agent-invented per hypothesis (ii)>.

403/403 green; pnpm agent:validate green at both Site 1 and Site 2
commits. <Convention #10 retraction count update>.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

(Replace the `<...>` placeholders with the actual outcomes from Tasks D3.1 and A3.1 before running.)

- [ ] **Step E3.4: Verify the commit landed and the working tree is clean**

Run:
```bash
git log -3 --oneline && git status
```

Expected: three commits visible (Site 1, Site 2, closeout) on top of 5096d21; working tree clean.

---

## Self-review

Performed against the spec at `docs/09_briefs/phase-1.2/session-8-c6-prereq-o3-agent-date-context.md`.

**1. Spec coverage:**
- §6 Part 0a (periodService grep) — ✓ done pre-spec, captured in spec §3.a; not a plan task.
- §6 Part 0b (buildSystemPrompt grep) — ✓ done pre-spec, captured in spec §3.b; not a plan task.
- §6 Part 0c (transcript verification) — ✓ Phase A (Tasks A1–A3).
- §6 Part 1 (`temporalContext.ts` create) — ✓ Task B2.
- §6 Part 2 (wire into `buildSystemPrompt`) — ✓ Tasks B3, B4, B5.
- §6 Part 3a (`checkPeriod` recovery instruction) — ✓ Task C1, with explicit primary/contingency branching tied to Phase A finding.
- §6 Part 3b (`postJournalEntry` nudge) — ✓ Task C2, locked text from spec.
- §6 Part 4 (8 tests) — ✓ T1–T6 across Tasks B1, B7, B8, B9, C3, C4; T7 in Task C5; T8 in Task C6.
- §6 Part 5 (`pnpm agent:validate` green at every commit) — ✓ Tasks B10.3, C7.2.
- §6 Part 6 (paid-API retry) — ✓ Phase D, gated on user approval.
- §8 friction-journal capture — ✓ Phase E (Tasks E1, E3).
- §9 OI-4 friction-journal corrective note — ✓ Task E1.2 step 3.

All spec requirements have a corresponding task. No coverage gaps.

**2. Placeholder scan:**
- `<Site 1 SHA>`, `<Site 2 SHA>`, `<DR/CR description, date, paid-API spend>`, `<hypothesis (i) or (ii) or indeterminate>`, `<$X.XX>`, `<Convention #10 retraction count update>` in commit/doc templates — these are intentional fill-ins resolved at execution time from runtime values (commit SHAs, retry log analysis). Not placeholders in the "implement later" sense.
- "Adapt to the actual DB connection method" (Task D1.2 fallback note) references the local Supabase psql connection string (`postgresql://postgres:postgres@127.0.0.1:54322/postgres`, locked per Task D2.2). Not a placeholder.
- **Resolved in pre-commit revision (formerly a stub):** Task C6's scaffolding is now fully locked — imports, fixture setup, orchestrator invocation, assertions, and response-shape-walking all specified verbatim by pre-plan subagent read of the sibling orchestrator integration tests. No `extractUserFacingText` stub, no `[VERIFY]` markers, no deferred-to-implementation scaffolding. See Task C6's preamble note for the test-limitation acknowledgement (the test guards orchestrator-plumbing invariants, not prompt-contract behavior; prompt-contract validation lives in Phase D).

No "TBD" / "TODO" / "implement later" / "fill in details" anywhere. All apparent placeholders are runtime-fillable from concrete, named sources.

**3. Type and signature consistency:**
- `temporalContextSuffix(now: Date): string` — used consistently in Task B2 (definition), Task B3.4 (call site).
- `BuildSystemPromptInput.now: Date` — added in Task B3.2, consumed in Task B3.4, populated in Task B4.2 (production callers) and Task B5.1 (test callers), referenced in T1–T6 (`now: FIXED_NOW`).
- `FIXED_NOW = new Date('2026-04-21T00:00:00Z')` — used in Tasks B1.1, B7.1, B8.1, B9.1, C3.1, C4.1; consistent value across all temporal tests.
- `checkPeriodTool.description` and `postJournalEntryTool.description` — modified in Tasks C1.2 and C2.2; asserted in Tasks C3.1, C4.1, C5.1.
- `periodService.isOpen` — NOT mocked. Task C6.1's locked scaffolding uses `entry_date: '2025-04-01'` in the fixture's `checkPeriod` tool_use input, which produces a natural `null` return from the real service because `SEED.ORG_HOLDING` (`src/db/seed/dev.sql:117-119`) has no 2025 fiscal period. This is consistent with the codebase's fixture-queue-only mocking discipline — services hit the real test DB.

No signature drift between definition and consumption sites.

**4. Phase A finding flow-through:**
The finding determined in Task A3.1 is consumed in Task C1.2 (primary vs. contingency text), Task C5.1 (T7 contingency assertion add-on), Task C8.3 (commit message variant), and Task E1.2 step 2 (friction journal entry framing). All four sites have the branching logic explicit. No missed propagation.

---

## Execution Handoff

Plan complete and saved to `docs/09_briefs/phase-1.2/session-8-c6-prereq-o3-execution-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** — Fresh subagent per task with two-stage review between tasks. Best fit for this plan because (a) Phase A's finding flows into Phase C decisions and benefits from a clean handoff, (b) Phase D is gated on explicit user approval and a fresh subagent enforces that pause naturally, (c) the test files in Phase C (especially T8) require reading sibling agent integration tests, which a focused subagent reads cleanly without polluting the main context.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints. Best fit if you want to keep main-thread context across the full arc and prefer fewer handoff seams.

Which approach?
