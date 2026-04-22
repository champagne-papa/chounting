# Session 8 C6 prereq — O3 design pass: agent date context + checkPeriod recovery

**Status:** Design pass (pre-implementation). No code touched yet.
**Author:** Phase 1.2 Session 8 planner.
**Date:** 2026-04-21.
**Sibling design:** `docs/09_briefs/phase-1.2/session-8-c6-prereq-o2-v2-pre-zod-injection-plan.md` (structural template; same C6 closeout cohort).
**Validates by:** EC-2 Entry 1 paid-API retry (single attempt) followed by chunked EC-2 full 20-entry run, gated on `pnpm agent:validate` green and explicit user approval.

---

## 1. Finding

The C6 closeout Entry 1 paid-API attempts surfaced two distinct failure modes that together prevent EC-2 from completing. Both touch `src/agent/orchestrator/buildSystemPrompt.ts` (composition) and `src/agent/tools/checkPeriod.ts` (tool description). Both are prompt-layer fixes, not tool-layer or service-layer. Bundling them in a single design pass (O3) preserves attribution clarity, scope cohesion, and same-Entry-1-retry validation per the cadence O2-v1 → O2-v2 established.

### 1a. Bug A — agent date hallucination

For the Entry 1 prompt ("Paid this month's office rent — $2,400 to Dufferin Properties, cheque went out on April 1"), with today = 2026-04-21, the agent inferred April **2025** as the entry date and called `checkPeriod(2025-04-01)`. Observed in **both** paid-API runs (`~/chounting-logs/ec-2-run-20260421T201938Z.log`, `~/chounting-logs/ec-2-run-20260421T232045Z.log`) — not a one-off.

The system prompt does not inject the current date into any context block. The model fell back to its training-data temporal priors, which favored 2025 over 2026 for "this month."

### 1b. Bug B — checkPeriod-locked panic

When `checkPeriod(2025-04-01)` returned (the actual return shape is `null` for the locked-past case — see §2 and §3), the agent fabricated "no prior journal entries to reference" justification text and asked the user to paste a UUID into chat. Net-new behavior in this paid run; not observed in prior sessions.

This violates the architectural premise of O2 / O2-v2: users never see, supply, or paste internal IDs / UUIDs / dry-run handles. The Bug B observation suggests a missing recovery instruction in the agent's prompt for the case where `checkPeriod` returns null (locked or not-found period).

---

## 2. Root cause

Two prompt-layer causes presented at different confidence levels per the Convention #9 discipline (distinguish observed from assumed). A third structural cause surfaced during pre-draft verification (§3 grep) but is out of scope for O3 — see §4 Implications and §9 Open Items.

### 2a. Cause 1 (confident) — missing current-date injection

The system prompt composed by `buildSystemPrompt` (§3.b) emits no current-date context anywhere. The model has no in-band signal for "what day is today," and falls back to training-data priors when interpreting relative expressions like "this month," "today," "yesterday."

**Direct evidence:** Entry 1 paid-API runs produced `checkPeriod(2025-04-01)` twice across two attempts (today's date is 2026-04-21). Single-cause attribution: no other plausible trigger.

### 2b. Cause 2 (hedged, defense-in-depth) — missing recovery instruction for `checkPeriod` null returns

The `checkPeriodTool.description` in `src/agent/tools/checkPeriod.ts` does not tell the agent how to recover when the tool returns `null`. The agent invented a rationalization ("no prior journal entries") and an inappropriate user-facing ask (paste UUID).

**Hedged framing:** Cause 2 is hypothesized to be downstream of Cause 1 — if the date were correct, `checkPeriod` would have returned the open current-period record and no recovery would be needed. Bug B may not reproduce after Cause 1's fix lands. The recovery instruction is shipped as **defense-in-depth** for legitimate `null` returns that are reachable in the wild (see §3 Implications: legitimate `null` is reachable via locked-past periods and not-yet-provisioned future periods, both real production scenarios at year-end close and post-year-boundary postings).

The independent root-cause framing: even if Cause 1 is fully fixed and Bug B-the-observed never recurs, the recovery instruction has durable value because legitimate `null` returns will surface in the wild. Today's observation is the trigger; future legitimate `null` paths are the load-bearing case.

---

## 3. Pre-draft verification (Part 0)

Two read-only verification passes were completed before drafting. Findings materially revised the design (see §5 Pre-draft changelog) and the verification step is documented as **Part 0** in §6 Implementation Scope so future readers see the verification work as a first-class planning step, not a pre-draft aside.

### 3a. Part 0a — `periodService.isOpen()` return-shape grep

**File:** `src/services/accounting/periodService.ts:51-82`. The method signature is:

```typescript
async isOpen(
  input: { org_id: string; entry_date: string },
  ctx: ServiceContext,
): Promise<{ period_id, name, start_date, end_date, is_locked: boolean } | null>
```

**Three failure modes collapse to `null`:**

| Failure mode | Return | Distinguishable? |
|---|---|---|
| Period exists, is open | period object with `is_locked: false` | Yes (caller sees the object) |
| Period exists, is locked | `null` (line 76–78, after `log.info` "Period is locked") | **No** |
| No period exists for date | `null` (line 71–73, after `log.warn` "No fiscal period found for date") | **No** |
| Database error | `null` (line 66–68, after `log.error`) | **No** |

The orchestrator (`src/agent/orchestrator/index.ts:1027-1033`) passes the result through to the agent's `tool_result` untouched — no wrapping, no `{ is_open: false }` translation. The agent receives literal `null` (or the period object).

**No server-side period auto-creation exists anywhere** in the codebase. Periods are created only at org creation by `generateMonthlyFiscalPeriods` for the current fiscal year only (`src/services/org/orgService.ts:210-216`). No cron, no triggers, no auto-extension at year-end. Legitimate `null` returns are reachable in the wild whenever a posting date falls past the org's latest provisioned period — every January for orgs that don't pre-provision next year's periods, every cross-year journal entry, every legitimate locked-past correction attempt.

### 3b. Part 0b — `buildSystemPrompt` composition order grep

**File:** `src/agent/orchestrator/buildSystemPrompt.ts:48-75`. Function signature:

```typescript
export function buildSystemPrompt(input: BuildSystemPromptInput): string
```

**Composition order** (sections joined with `'\n\n'`):

1. `basePersonaPrompt(input)` — persona body containing:
   - `identityBlock(...)` — "You are The Bridge's accounting agent..."
   - `availableToolsSection(persona)` — **renders tool descriptions inline as bulleted list** (each tool's `.description` string emitted as `\`${name}\` — ${description}`)
   - `ANTI_HALLUCINATION_RULES`, `STRUCTURED_RESPONSE_CONTRACT`, `VALID_TEMPLATE_IDS`, `VOICE_RULES` (constants from `src/agent/prompts/personas/_sharedSections.ts`)
2. `orgContextSummary(input.orgContext)` — suffix from `src/agent/prompts/suffixes/orgContextSummary.ts`
3. `localeDirective(input.locale)`
4. `onboardingSuffix(input.onboarding ?? null)`
5. `canvasContextSuffix(input.canvasContext)`

**Critical mechanical finding:** tool descriptions are emitted **inside the persona body**, **before** any suffix runs. If a tool description references "the Current date above," the source-of-truth for "Current date" must appear **before the persona body** in the rendered prompt — i.e., the temporal block must be a **prefix**, not a suffix slotted between `orgContextSummary` and `localeDirective`.

**Existing test cadence** (`tests/integration/buildSystemPrompt*.test.ts`):
- `CA-48: buildSystemPrompt composition` — section presence + order
- `CA-49: buildSystemPrompt onboarding` — suffix presence/absence by persona × org-state matrix
- `CA-50: buildSystemPrompt canvas context` — canvas suffix presence + selection conditional
- `CA-52: buildSystemPrompt locale directive` — per-locale string + structural isolation

Naming convention: `'CA-<NN>: <short title>'` for describe blocks, plain-English imperative for it blocks. Assertions are content-driven: `expect(prompt).toContain('<verbatim snippet>')`.

### 3c. Part 0c — transcript verification (TO BE DONE as first execution step)

This sub-step has not been executed pre-draft because it (i) requires reading the C6 transcript files and (ii) its outcome only affects a single-line text substitution in the Site 2 instruction, not structural design. Specified here, executed in Part 0c of §6 Implementation Scope.

**Three actions:**

(i) Read `~/chounting-logs/ec-2-run-20260421T201938Z.log` and `~/chounting-logs/ec-2-run-20260421T232045Z.log`. Determine whether the agent's chain-of-thought references `is_open=false` literally (a field that does not exist in the actual return shape) or whether that's the friction-journal author's paraphrase of the agent reasoning over `null`.

(ii) If the agent invented the field name when receiving `null`, document as a Convention #9 datapoint titled "agent interprets absent structured data with confidently-wrong field-name reasoning" and apply the Site 2 contingency text (see §5.b).

(iii) Either way, queue a friction-journal corrective note clarifying that `periodService.isOpen()` returns `period | null`, not `{ is_open: false }`. The note lands at the C6 closeout amendment slot or in the next session-batched friction entry.

---

## 4. Implications

### 4a. Two prompt-layer fixes in one design pass

Both fixes touch `buildSystemPrompt` composition and tool descriptions; both are validated by the same Entry 1 retry; both are prompt-layer rather than tool-layer or service-layer. Bundling preserves attribution clarity (one design pass, one retry, two named bugs) and matches the O2-v1 → O2-v2 cadence the user has been applying through Session 8.

### 4b. Structural finding (out of scope for O3, deferred to Open Items)

`periodService.isOpen()`'s information-losing `null`-return collapse (three failure modes → one signal) is the **reason** Cause 2's recovery instruction must be written broadly ("locked **or** not yet created") rather than narrowly ("locked"). The agent has no in-band way to distinguish locked-past from not-yet-created from DB error, so the prompt has to teach the agent about the ambiguity.

This is an **Implications-section observation**, not a co-equal Root cause entry. It is the justification for §5.b's broad phrasing. The structural fix — refactor `periodService.isOpen()` to return a discriminated union (`{ status: 'open' | 'locked' | 'not_found' | 'error', period?: ... }`) and update the tool description to match — is service-layer scope creep on a prompt-engineering arc and is **explicitly out of scope for O3**. It lands as Open Item OI-1 (§9) with enough detail to become its own future design pass once O3 + EC-2 full run produce sub-case frequency evidence.

### 4c. Section-interaction analysis

The temporal block must satisfy three interaction constraints to render correctly across all prompt variants:

- **Persona-independent.** All three personas (controller, ap_specialist, executive) need temporal context. The temporal block must render in every persona variant; it cannot be persona-gated like `availableToolsSection`.
- **Onboarding-independent.** Date is a system-level fact (when am I being run?), not a session-state fact (where am I in onboarding?). The temporal block must render in both onboarding and post-onboarding states. Bug A may affect onboarding flows too — the date-injection fix should not be conditioned on onboarding state.
- **Canvas-independent.** Canvas context can be mutated mid-conversation; temporal context cannot. The two are conceptually orthogonal.

Slotting the temporal block as a **prefix** (before `basePersonaPrompt`) satisfies all three constraints by virtue of position — it composes once at the top of every prompt regardless of persona, org-state, or canvas state.

---

## 5. Design ratified — Option 3A

### 5a. Pre-draft changelog (Convention #9 honesty discipline)

This design is the output of Part 0's verification reads. The verification surfaced **three revisions** from earlier framings developed during the pre-verification design conversation. They are documented here so the doc's "Design ratified" framing does not retcon the design into a clean originally-arrived-at narrative — the cleaner narrative would mis-represent how the design was reached and would weaken the Part 0 verification step's perceived value to a future reader.

1. **Bug B scope collapsed by structural necessity.** The pre-verification design distinguished "Bug B (locked-past)" from "Bug B' (future-not-created)" and proposed deferring Bug B' as a separate finding. Part 0a verified that `periodService.isOpen()` returns `null` for both cases with no discriminator; the recovery instruction necessarily covers both because the agent cannot distinguish them. **Bug B' is not deferred — it is structurally part of Bug B.** The "Open items" section names a related-but-distinct OI (`Bug B' future-dated-period frequency`) tracking sub-case frequency from EC-2 + future paid runs, which informs OI-1's eventual design.

2. **Recovery instruction trigger phrased on actual return shape.** Pre-verification framings (and the friction journal's C6 closeout entry) said "If `is_open=false`, ..." — but Part 0a verified that `periodService.isOpen()` returns `period | null` with no `is_open` field anywhere in the return type. Trigger rephrased to "If `checkPeriod` returns `null`." Part 0c (transcript verification) determines whether the agent perceives `null` literally or invents a field name; if the latter, the contingency text in §5.b applies.

3. **Temporal block positioned as prefix, not after-`orgContextSummary`.** Pre-verification framings positioned the temporal block "after `orgContextSummary` and before `localeDirective`." Part 0b verified that tool descriptions (the consumers of "Current date above" reference) are rendered **inside the persona body via `availableToolsSection()`**, **before** any suffix runs. The temporal block must precede the persona body for the positional reference to be true. **Position changed: prefix (before `basePersonaPrompt`).**

These revisions strengthen the design's grounding in the actual code rather than in the pre-verification framing. The verification step is not a pre-draft aside — it is the first-class Part 0 of §6 Implementation Scope.

### 5b. Site 1 — current-date injection (Bug A, load-bearing)

Inject a temporal context section as a **prefix** at the top of the system prompt, with two stamps (UTC + org-local). Block content under Phase 1.2 (route ii — UTC-only, Phase 2 follow-up for real org TZ):

```
Current date: 2026-04-21 (ISO 8601, UTC)
Today (org-local): 2026-04-21 (UTC — org timezone not yet configured; Phase 2 will resolve from organizations.timezone)
```

The dates above are the values the function would emit on 2026-04-21. The function computes them dynamically from an injected `now: Date`.

**Decision split (Convention #9 honesty discipline applied at the section level):**

- **Decision 1 (load-bearing for Bug A):** inject the current date into the system prompt. Any single-stamp form would suffice; this is the causal fix for the year-hallucination observed in Entry 1. A reviewer asking "does single-stamp also fix Bug A?" should hear "yes."
- **Decision 2 (forward-looking, composability):** use a dedicated `temporalContext.ts` section with dual UTC + org-local stamps. Justified on section-contract cleanliness (composable home for future temporal additions like period-end proximity, fiscal year position, year-end-close warnings) and forward-looking infrastructure for the Phase 2 org-TZ work. **Not part of Bug A's causal fix.** Pre-empts the "dual stamps fix Bug A" mis-attribution that a less-careful framing would invite.

**Onboarding/null-org branch:** identical two-line block. Under Phase 1.2 the org-local value equals UTC regardless of org state, so no special-case branch is needed in render code. The "Phase 2 will resolve from `organizations.timezone`" note is doing two jobs: it tells future-you exactly where the follow-up lands, and it tells the agent why both stamps are currently identical so it doesn't get confused by the redundancy.

**Single-stamp alternative (not chosen).** A single-stamp design (one line: `Current date: 2026-04-21 (UTC)`) would also fix Bug A — Decision 1 above is fix-equivalent regardless of stamp count. Dual-stamp is preferred because (i) it makes the org-local-vs-UTC distinction legible to the agent without requiring TZ math at consumption time, (ii) it composes cleanly for future temporal additions (period-end proximity, fiscal year position, year-end-close proximity warnings) under a single section heading, and (iii) the cost is one extra rendered line and zero extra logic. Single-stamp would be a defensible fallback if the dual-stamp design's "Phase 2 will resolve" annotation is judged confusing to the agent in paid-API runs; revert is one-line in `temporalContext.ts`.

**Implementation sketch:**

- New file `src/agent/prompts/suffixes/temporalContext.ts` (filesystem-consistent with `orgContextSummary.ts`, `onboardingSuffix.ts`, `canvasContextSuffix.ts` — the "suffixes" folder name is the architectural-pattern name for "render-this-string-into-the-system-prompt" helpers, even though this one is positioned as a prefix in the rendered output; a comment in the file notes the prefix positioning).
- Function: `temporalContextSuffix(now: Date): string` returning the two-line block.
- `BuildSystemPromptInput` interface gains a required `now: Date` field. Orchestrator call site passes `new Date()` in production; existing tests inject a deterministic Date for fixture stability.
- `buildSystemPrompt` composition becomes:
  ```typescript
  return [
    temporalContextSuffix(input.now),
    basePersonaPrompt(input),
    orgContextSummary(input.orgContext),
    localeDirective(input.locale),
    onboardingSuffix(input.onboarding ?? null),
    canvasContextSuffix(input.canvasContext),
  ].filter(Boolean).join('\n\n');
  ```

### 5c. Site 2 — `checkPeriod` recovery instruction (Bug B, defense-in-depth)

Append a recovery instruction to `checkPeriodTool.description` in `src/agent/tools/checkPeriod.ts`. Final text (primary specification):

> If `checkPeriod` returns `null`, the period either exists but is locked for posting, or has not yet been created (common just after year-end, before next year's periods are provisioned). Before proceeding, reconsider whether the date you inferred is correct — relative expressions like "this month," "today," or "yesterday" should resolve against the Current date above. If you still believe the user intends that date, confirm it with them and let them know the period is not currently available for posting — never ask for or display internal IDs, UUIDs, or dry-run handles.

The instruction does five things deliberately:

1. **References the actual return signal (`null`)** rather than the non-existent `is_open=false` field.
2. **Names the locked-or-not-created ambiguity explicitly** so the agent understands why it can't pick one cause arbitrarily — the structural finding (§4.b) is taught to the agent as background, not just used silently as design rationale.
3. **Names the most likely failure mode (wrong date inference) first** so the agent's first recovery action is to re-examine its own date reasoning. This makes the Bug-A-causes-Bug-B hypothesis legible inside the prompt itself.
4. **Routes the user toward an honest signal ("not currently available for posting")** rather than pre-committing to one admin action ("re-open" vs "create"). The user/accountant decides whether to unlock, create, or re-date the entry.
5. **Broadens "internal IDs" to "internal IDs, UUIDs, or dry-run handles"** to cover the full leak class observed in Bug B (the agent specifically asked for UUID-shaped values).

**Contingency on Part 0c outcome.** If transcript verification (Part 0c sub-step (i)) shows the agent's chain-of-thought referenced `is_open=false` literally rather than reasoning over `null` directly, broaden the trigger clause to:

> If `checkPeriod` returns `null` or otherwise indicates the period is not available for posting, ...

Single-line text substitution. No structural change. Cheap insurance against the agent's internal representation diverging from the literal return shape. **Apply this contingency only after transcript evidence supports it** — do not pre-apply on speculation.

### 5d. Bug B test framing

The Bug B regression test is named:

> `'CA-XX: agent handles null checkPeriod return without fabricating missing entries or exposing UUIDs'`

(CA-XX = next available CA number, allocated at implementation time.)

**Test motivation:** Bug B observation (agent panicked on null return, fabricated context, asked for UUID).

**Test scope:** General recovery contract — fixture-mocks `periodService.isOpen()` to return `null` and asserts the agent's next response (i) does not reference UUIDs / dry-run handles / `period_id` strings, (ii) does not fabricate prior-journal-entry context, (iii) confirms the date with the user OR signals the period is not available for posting.

**Test name rationale:** Not "reproduces Bug B." Post-Bug-A-fix, Bug B-the-observed-behavior may not be reproducible at all (because the agent will pick 2026 dates that won't trigger `null`). The test guards the **contract** that becomes load-bearing at year-end close, manually-locked correction periods, and any future legitimate `null` path. The test's motivation is Bug B; its scope is the general recovery contract.

---

## 6. Implementation scope

Six parts. Part 0 is verification (read-only); Parts 1–5 are sequential code work; Part 6 is the paid-API retry. Single-track commit flow per the user's Convention #10 hedge-predictions discipline (running-count drift is a catalogued meta-bug; parallel commits trigger it).

### Part 0 — Pre-implementation verification (read-only)

- **Part 0a (✓ done before draft):** Grep-verify `periodService.isOpen()` return shape. Findings in §3.a.
- **Part 0b (✓ done before draft):** Grep-verify `buildSystemPrompt` composition order, persona helpers, suffix wiring, existing test patterns. Findings in §3.b.
- **Part 0c (TO BE DONE as first execution step):** Transcript verification per §3.c (read C6 paid-run logs; determine whether agent invented `is_open=false` field name; apply Site 2 contingency text if confirmed; queue friction-journal corrective note).

### Part 1 — Create `src/agent/prompts/suffixes/temporalContext.ts`

- New file. Comment header notes the file is named "suffix" for filesystem consistency with sibling `*.ts` files in `suffixes/`, but is positioned as a **prefix** in `buildSystemPrompt`'s composition order — see comment in `buildSystemPrompt.ts`.
- Export: `function temporalContextSuffix(now: Date): string` returning the two-line block. The `now` parameter is required (no default) so callers pass an explicit Date and tests inject deterministic fixtures.
- Returns the two-line block exactly as specified in §5.b. The `now.toISOString().slice(0, 10)` call produces the YYYY-MM-DD UTC form for both stamps.

### Part 2 — Wire `temporalContextSuffix` into `buildSystemPrompt`

- Add required field `now: Date` to `BuildSystemPromptInput` interface in `src/agent/orchestrator/buildSystemPrompt.ts`.
- Update the composition order in `buildSystemPrompt`'s body to prefix `temporalContextSuffix(input.now)` before `basePersonaPrompt(input)`. Final order: temporal → persona → org → locale → onboarding → canvas. `.filter(Boolean).join('\n\n')` to skip empty suffixes.
- **Add a one-line comment above the composition array** explaining the naming oddity at the call site, e.g.: `// temporalContextSuffix is positioned as a prefix despite "suffix" in the name — see comment in temporalContext.ts for full rationale (filesystem consistency with sibling suffixes/ files).` This mirrors the comment in `temporalContext.ts` so the naming choice is legible at both sites without duplicating the full explanation.
- Update the orchestrator call site (`src/agent/orchestrator/index.ts`) to pass `now: new Date()` when invoking `buildSystemPrompt`. Grep for all call sites; update each.
- Update existing `buildSystemPrompt*.test.ts` files to pass a deterministic `now` Date in their inputs (likely `new Date('2026-04-21T00:00:00Z')` or equivalent fixture). All existing assertions should remain green; the temporal block is purely additive.

### Part 3 — Modify `checkPeriod` and `postJournalEntry` tool descriptions

**Part 3a — `checkPeriodTool.description` in `src/agent/tools/checkPeriod.ts`:**

- Append the recovery instruction (§5.c primary text) to the existing description string. Use template literal with explicit `\n\n` separator so the recovery instruction renders as a paragraph below the existing description in the tool-bullet output.
- **If Part 0c (ii) triggers:** apply the contingency text substitution (broaden trigger clause). Otherwise primary text stands.

**Part 3b — `postJournalEntryTool.description` in `src/agent/tools/postJournalEntry.ts`:**

- Existing description (verified by grep at `src/agent/tools/postJournalEntry.ts:10`):

  > "Create a journal entry. ALWAYS use dry_run=true on the first call. The orchestrator replays a second call with dry_run=false only after the user approves the ProposedEntryCard."

  Three flat imperative sentences. Plain prose register; no numbered steps; appending a fourth sentence is structurally compatible.

- Append the following sentence (locked text — 15 words, matches the existing prose economy):

  > "Resolve relative `entry_date` expressions (e.g., 'this month,' 'today,' 'yesterday') against the Current date above."

- Final description after the change:

  > "Create a journal entry. ALWAYS use dry_run=true on the first call. The orchestrator replays a second call with dry_run=false only after the user approves the ProposedEntryCard. Resolve relative `entry_date` expressions (e.g., 'this month,' 'today,' 'yesterday') against the Current date above."

- **Rationale (defense-in-depth):** Bug A's primary fix is Site 1 (the temporal block at the top of the prompt). The agent reads the temporal block once at prompt-render time, but the connection between "Current date" and "what date to put in `entry_date`" must be made at tool-call time. The nudge in `postJournalEntry`'s description re-anchors the temporal context at the point of consumption, reducing the chance the agent ignores the upstream block when it's about to commit to a date in the call. Cheap insurance — one sentence appended to one description.

- **Not a recovery instruction.** Unlike Site 2's `checkPeriod` recovery, this is a positive-case nudge: it tells the agent how to use the temporal context correctly, not how to recover from a failure.

### Part 4 — Tests

Seven new tests, naming follows the `CA-XX: <short title>` pattern. Three new test files, mirroring existing `buildSystemPrompt*.test.ts` cadence. Test files are content-driven (assert on rendered prompt text) per the Part 0b finding.

| # | Test file | Describe block | It block | Asserts |
|---|---|---|---|---|
| T1 | `tests/integration/buildSystemPromptTemporal.test.ts` | `CA-XX: buildSystemPrompt temporal context` | `'renders the temporal block for signed-in (controller + non-null orgContext)'` | `prompt.contains('Current date:')` and `prompt.contains('Today (org-local):')` and matching ISO date |
| T2 | (same) | (same) | `'renders the temporal block for onboarding (controller + null orgContext)'` | Same assertions; verifies persona/org-state independence |
| T3 | (same) | (same) | `'renders both UTC and org-local stamps'` | Both stamps present with identical UTC value (Phase 1.2 route ii) |
| T4 | (same) | (same) | `'temporal block is the first section in the rendered prompt'` | `expect(prompt.startsWith('Current date:')).toBe(true)` — persona-invariant assertion that matches the prefix-not-suffix design intent. Stronger than asserting position relative to a persona-specific identity-block string (which would silently pass-or-not-trigger across the three-persona matrix). Repeat the assertion for all three personas in a `describe.each` or a parameterized loop to verify cross-persona invariance. |
| T5 | (same) | (same) | `'checkPeriod tool description references "the Current date above"'` | `prompt.contains('the Current date above')` within the rendered checkPeriod tool-bullet (verifies the positional anchor is present in Site 2's recovery instruction) |
| T6 | (same) | (same) | `'postJournalEntry tool description references "the Current date above"'` | `prompt.contains('the Current date above')` within the rendered postJournalEntry tool-bullet (verifies Part 3b's defense-in-depth nudge is present) |
| T7 | `tests/integration/checkPeriodToolDescription.test.ts` | `CA-XX: checkPeriod tool description` | `'includes the null-recovery instruction with both locked and not-created cases named'` | `description.contains('returns null')` and `description.contains('locked for posting')` and `description.contains('has not yet been created')` and `description.contains('never ask for or display internal IDs, UUIDs, or dry-run handles')` |
| T8 | `tests/integration/agentNullCheckPeriodRecovery.test.ts` (sibling to existing agent-orchestrator integration tests) | `CA-XX: agent handles null checkPeriod return` | `'agent handles null checkPeriod return without fabricating missing entries or exposing UUIDs'` | Fixture-mock `periodService.isOpen()` to return `null`; capture agent's response; assert response (i) does not contain UUID-shaped strings or `period_id` references, (ii) does not contain fabricated journal-entry context, (iii) confirms date with user or signals "not available for posting" |

T1–T6 cover the Bug A side (Site 1 + the positional anchors in both `checkPeriod` and `postJournalEntry` tool descriptions — matches the question-2 ratification of "checkPeriod and postJournalEntry nudges, 2 tests"). T7 covers Site 2's recovery instruction content directly. T8 is the Bug B regression test per §5.d framing.

**Expected test count delta:** +8. Baseline 395/395 → 403/403 after O3.

If Part 0c (ii) triggers and the contingency text is applied, T7 also asserts `description.contains('or otherwise indicates the period is not available for posting')`. No additional test files; T7 absorbs the contingency.

### Part 5 — `pnpm agent:validate` green at every intermediate commit

Run after each of Parts 1, 2, 3, 4. Includes typecheck + no-hardcoded-URLs grep + 26/26 Category A floor tests. No commit lands red.

### Part 6 — Single Entry 1 retry against real Claude (paid-API)

**Prerequisites (all must be green before this part starts):**
- Part 0c complete (transcript checked, friction-journal note queued)
- Parts 1–5 complete and committed
- 403/403 tests green
- `pnpm agent:validate` green
- DB state: `agent_sessions` and `ai_actions` from C6 paid runs preserved per the user's instruction; do NOT reset DB until Entry 1 retry is approved
- Explicit user approval to spend paid-API budget

**Expected spend:** ~$0.03 (matches O2-v2 Entry 1 spend cadence).

**Pass criteria:**
- Entry 1 produces a valid `ProposedEntryCard` end-to-end (DR Rent Expense 2400.00; CR Cash 2400.00; date 2026-04-01)
- No UUID / dry-run handle exposed to user
- No fabricated journal-entry context

**Outcomes:**
- **Clean Entry 1:** proceed to chunked EC-2 full 20-entry run. Pause for user approval before each chunk. Update friction journal with O3 closeout entry.
- **Entry 1 still fails on Bug A:** halt-and-escalate. The temporal injection didn't fix the year hallucination — escalates to a model-behavior question (does the system-prompt injection register against Anthropic's training-data temporal priors at all?) and may indicate the injection placement or formatting needs revision.
- **Entry 1 fixes Bug A but reveals new failure mode:** halt-and-escalate. New failure mode gets its own design pass (O4) per the C6 closeout discipline.
- **Entry 1 fixes Bug A and the response handles `null` correctly without exposing IDs:** Bug B framing is validated. Test T7 still guards the contract; Bug B' frequency informs OI-1 over time.

---

## 7. Options considered

### Option 3B — Bug A only, defer Bug B to a follow-up finding

**Rejected.** Bundling Bug A + Bug B in O3 is the right scope: both touch `buildSystemPrompt` and a tool description, both prompt-layer, both validated by the same Entry 1 retry. Pulling Bug B out fragments an attribution arc and breaks the bundle-by-shared-validation discipline established in O2-v1 → O2-v2.

### Option 3C — Bug B narrow (locked-past only) — Convention #9 hedging applied at scope

**Rejected by structural necessity.** Pre-verification framings considered narrow vs. broad Bug B scope as a Convention #9 question. Part 0a verified that the underlying tool returns `null` for both locked-past and not-yet-created cases with no discriminator; the recovery instruction necessarily covers both because the agent has no signal to distinguish them. The (a)-narrow-vs-(b)-broad choice collapsed by structural fact, not by hedging discipline.

### Option 3D — Two-site Bug B fix: recovery instruction + separate top-level UUID-leak prohibition

**Rejected.** The UUID-leak prohibition is a hygiene refactor disguised as a bug fix. Pulling it into a shared section on a single Bug B datapoint violates the "two datapoints before codifying an abstraction" discipline. If a second UUID-leak finding lands later (e.g., another tool's response handling), the prohibition gets pulled into a shared section then with two datapoints justifying the abstraction.

### Option 3E — Pull `periodService.isOpen()` refactor into O3

**Rejected.** Service-layer scope on a prompt-engineering arc. The O2-v1 → O2-v2 cadence the user has been applying is "one design pass = one architectural layer." Mixing prompt-layer fixes with a service-layer return-shape refactor breaks that cadence and bundles unrelated review concerns. The structural finding lands as Open Item OI-1 with enough detail to become its own future design pass.

### Option 3F — Org-timezone resolution in Phase 1.2 (route i or iii instead of route ii)

**Rejected for route (i) — add `organizations.timezone` column + resolution path in O3.** Bundles a schema migration into a prompt-engineering commit arc. O3 is "2 commits + Entry 1 retry"; adding a migration makes it 3+, pulls in migration review, and the migration is not load-bearing for Bug A's fix (UTC works correctly for `checkPeriod`'s SQL; the "this month" ambiguity only matters at TZ boundaries, which is a real but narrow bug class).

**Rejected for route (iii) — read TZ from user profile.** Couples temporal context to the wrong entity. Journal entries are org-scoped, not user-scoped; a user operating across two orgs in different TZs would get wrong-org-local dates. Shipping a bug to fix a bug.

**Route (ii) — UTC-only for Phase 1.2 with Phase 2 follow-up — accepted.** Bug A is "agent doesn't know what day it is," not "agent doesn't know the org's timezone." UTC-only is correct for >99% of cases; Phase 2 follow-up (OI-2) has a natural home.

**Note on alternatives that are considered-but-not-rejected:** the single-stamp temporal block alternative is documented as an aside in §5.b ("Single-stamp alternative (not chosen)") rather than as a §7 entry, because §7's contract is rejection-list — every entry ends with a decision against it. Live alternatives belong next to the live design.

---

## 8. Friction-journal capture

To be batched at C7 or C8 closeout per the friction-journal cadence. Capture targets:

- **O3 design ratification arc** — the three Part 0 revisions (Bug B scope collapse, trigger phrasing correction, prefix positioning) as a single Convention #9 datapoint titled "pre-draft verification surfaced three design assumption errors; doc-changelog discipline made the corrections legible."
- **If Part 0c (ii) triggers** — separate Convention #9 datapoint per §3.c.
- **O3 implementation outcome** — Entry 1 retry result; whether Bug B was reproducible post-Bug-A-fix; OI-1 / OI-3 evidence from EC-2 full run if it executes in the same arc.
- **Convention #10 retraction count** — increment if O3 implementation produces any retractions; decrement is not a defined operation per the catalog.

---

## 9. Open items

### OI-1 — `periodService.isOpen()` return-shape refactor (deferred to future design pass)

**Scope:** Refactor `periodService.isOpen()` (`src/services/accounting/periodService.ts:51-82`) to return a discriminated union instead of `period | null`. Likely shape:

```typescript
type CheckPeriodResult =
  | { status: 'open'; period: { period_id, name, start_date, end_date } }
  | { status: 'locked'; period: { period_id, name, start_date, end_date } }
  | { status: 'not_found' }
  | { status: 'error'; error: string };
```

Update orchestrator's `checkPeriod` handler (`src/agent/orchestrator/index.ts:1027-1033`) to forward the discriminated result to the agent. Update `checkPeriodTool.description` to document the new return shape. Update other callers of `periodService.isOpen()` (grep for call sites — likely `journalEntryService` and possibly UI components). Update existing `periodService.isOpen()` tests to match.

**Why deferred:** Service-layer scope on a prompt-engineering arc (O3). Doing it standalone gives it the review attention service-layer changes warrant.

**Trigger to revisit:** Sub-case frequency evidence from EC-2 full run + future paid runs (see OI-3). If the wild distribution is mostly locked-past, OI-1 is lower-priority. If mostly not-found-future (e.g., year-boundary postings), OI-1 becomes higher-priority because the recovery UX diverges meaningfully between the two cases.

### OI-2 — `organizations.timezone` column + Phase 2 org-TZ resolution

**Scope:** Add `organizations.timezone` column (likely IANA TZ string, e.g., `'America/Toronto'`) via Phase 2 migration. Update `temporalContextSuffix` to read the org's TZ when `orgContext` is non-null and emit the org-local stamp using that TZ. Update onboarding flow to capture timezone during org creation (or default from a server-detected IP-geo and let user confirm).

**Why deferred:** Phase 2 work per the route (ii) decision in §7. UTC-only is correct for >99% of Phase 1.2 use cases.

**Trigger to revisit:** Cross-TZ user feedback (e.g., a user in a non-UTC TZ posts at 11pm local on the last day of the month and the agent dates the entry to the next day). If observed in EC-2 or production, escalate to Phase 1.x late-add rather than waiting for Phase 2.

### OI-3 — Bug B' future-dated-period frequency in EC-2 full + future paid runs

**Scope:** Track which sub-case (locked-past vs. not-yet-created vs. DB error) drives `null` returns in production traffic. EC-2 full run is the first datapoint source; future paid runs and (eventually) production telemetry are richer sources. Sub-case distribution informs OI-1's design priority and the Site 2 instruction's eventual refinement.

**Data source:** The agent receives literal `null` with no discriminator (Part 0a finding), so sub-case attribution cannot come from agent-side observation. The signal lives **server-side** in `periodService.isOpen()`'s existing log lines:

- Locked-past: `log.info({ period_id: period.period_id }, 'Period is locked')` at `src/services/accounting/periodService.ts:76-78`
- Not-yet-created: `log.warn({ input }, 'No fiscal period found for date')` at `src/services/accounting/periodService.ts:71-73`
- DB error: `log.error({ error }, 'Failed to query fiscal_periods')` at `src/services/accounting/periodService.ts:66-68`

Cross-reference log frequency against paid-run timestamps and `agent_sessions.session_id` (also present in the trace context propagated to `loggerWith`) to attribute each `null` return to its sub-case. No new logging is needed; the existing log lines are already discriminating. The work is in the analysis, not the instrumentation.

**Why open:** No data yet. EC-2 full run did not execute in the C6 arc (blocked on Bug A + Bug B). O3 unblocks EC-2; first run produces first dataset.

**Trigger to revisit:** After EC-2 full run completes. Sub-case breakdown lands in a friction-journal entry; if any sub-case is dominant or surprising, escalate to OI-1 design pass.

### OI-4 — Friction-journal corrective note (queued from Part 0c sub-step iii)

**Scope:** Friction-journal entry clarifying that `periodService.isOpen()` returns `period | null`, not `{ is_open: false }`. Lands at C6 closeout amendment slot or in the next session-batched friction entry per the journal's edit cadence. Avoids future readers being misled about the return shape.

**Why open:** Queued from Part 0c sub-step (iii); writes during O3 implementation, lands with the C7/C8 closeout batch.

---

**End of design pass.** Implementation begins after user ratifies this doc.
