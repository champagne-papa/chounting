# Session 19 — OI-3 Part 3 prompt-surgery + Part 4 Soft 9 integration test

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land OI-3 Parts 3 + 4 from the OI-3 fix-stack scoping doc:
1. Prompt-surgery on three surfaces — `STRUCTURED_RESPONSE_CONTRACT` (§4a), `respondToUser.description` (§4b), `validTemplateIdsSection` rubric (§4c). Each surface gets the semantic content committed at scoping plus implementation-time wording finalization.
2. Soft 9 integration test (`tests/integration/soft9OI3PromptSurgery.test.ts`) paralleling Soft 8's pattern. Four assertions across productive, tentative, no-directive, and strict-schema-rejection paths.

**Architecture:** Prompt-text edits (three files) + new test file + new fixture file. The prompt-surgery references the §3c (a) tentative-flag pick that landed at `22b63c4` — the prose can name `tentative` directly without abstract placeholder language. Soft 9's tentative-path fixture (assertion 2) emits `tentative: true` on the card to exercise the flag.

**Tech Stack:** TypeScript, Vitest (mocked-LLM integration tests via `__setMockFixtureQueue`). No new dependencies.

---

**Anchor (parent) SHA:** `3a709c6881839e2a4ccdd50a9c04f89f04c59b75` — the SHA of S18 Commit 2. WSL must verify HEAD's parent matches this anchor SHA via `git rev-parse HEAD~1`.

**Upstream authority:**
- OI-3 scoping doc at `docs/09_briefs/phase-1.2/oi-3-class-2-fix-stack-scoping.md` (commit `161bff8`) — §4a/4b/4c semantic-content floors and Part 4 Soft 9 assertion shapes.
- §3c (a) tentative-flag implementation at commit `22b63c4` — the contract this brief's prompt-surgery references.
- Convention #8 Spec-to-Implementation Verification — Identity assertions discipline applies to fixture authoring (account UUIDs, fiscal_period UUIDs, account codes must be grep-confirmed against fixture seeds, not assumed).
- Convention #11 Per-Entry Row-Card Pairing Post-Paste Verification — the orphan-prevention property Soft 9 asserts.

---

## Session label
`S19-oi-3-prompt-surgery-and-soft9` — captures both deliverables explicitly. Continues the S-series.

## Hard constraints (do not violate)

- **Out of scope: Parts 1, 2, 5, 6, 7, 8 of the OI-3 scoping doc.** Specifically: no M3 baseline measurement (Part 1, free), no Part 2 telemetry patch (already shipped at `22b63c4`), no Part 5 paid M1 validation, no synthetic-bypass authoring beyond Soft 9 itself, no validation/resume/closeout. M1 paid validation is the next paid-API gate; scoped separately.
- **No further schema changes.** §3c (a) tentative-flag landed at `22b63c4`. The prompt-surgery references the flag; it does not modify the schema or TS type further.
- **No edits outside the four target files.** Targets:
  - `src/agent/prompts/personas/_sharedSections.ts` — STRUCTURED_RESPONSE_CONTRACT revision (§4a).
  - `src/agent/tools/respondToUser.ts` — tool description revision (§4b).
  - `src/agent/prompts/validTemplateIds.ts` — rubric revision (§4c).
  - `tests/integration/buildSystemPromptComposition.test.ts` — test-update for the response-contract assertion (load-bearing per pre-flight: the existing test asserts on the exact pre-surgery prose).
  - `tests/integration/soft9OI3PromptSurgery.test.ts` — new test file (Part 4).
  - `tests/fixtures/anthropic/oi3-class-2-shapes.ts` — new fixture file (Part 4).
- **Confirm-route invariants unchanged.** No edits to `confirm/route.ts` or `reject/route.ts`. Tentative-state is UI-only advisory; post mechanics unchanged per §3c (a) decision rationale.
- **No edits to `onboardingSuffix.ts`.** §2d explicitly flags it as out-of-scope (different context, no Class 2 orphan risk).
- **Convention discipline:** §4a/4b/4c semantic content is the floor — implementation finalizes wording, but the load-bearing structural elements (canvas_directive emission requirement on `agent.entry.proposed`, tentative-state pathway, proposal-vs-non-proposal split in rubric) cannot drift.

---

## Task 1: Session-init and HEAD anchor

- [ ] **Step 1: Run session-init**

```bash
bash scripts/session-init.sh S19-oi-3-prompt-surgery-and-soft9
```

- [ ] **Step 2: Confirm HEAD points at the brief-creation commit, parent matches anchor**

```bash
git rev-parse HEAD~1
git log -1 --name-only --format='%H'
```

Expected: `HEAD~1` equals `3a709c6881839e2a4ccdd50a9c04f89f04c59b75`. HEAD's single changed file is `docs/09_briefs/phase-1.2/session-19-brief.md`.

If either check fails, STOP per "Check HEAD before Step 2 Plan" convention.

---

## Task 2: Verification before drafting

This task gathers the §4a/4b/4c semantic-content reads, the Soft 8 pattern reads, and fixture identity assertions per Convention #8.

- [ ] **Step 1: Confirm the three prompt surfaces are at the expected locations**

```bash
grep -nE 'STRUCTURED_RESPONSE_CONTRACT|respondToUserTool|validTemplateIdsSection' \
  src/agent/prompts/personas/_sharedSections.ts \
  src/agent/tools/respondToUser.ts \
  src/agent/prompts/validTemplateIds.ts
```

Expected: STRUCTURED_RESPONSE_CONTRACT defined in `_sharedSections.ts` around line 38; respondToUserTool defined in `respondToUser.ts` around line 9; validTemplateIdsSection function in `validTemplateIds.ts`.

- [ ] **Step 2: Identify test assertions on prompt-text that will need updates**

```bash
grep -rn 'Your responses must be\|Response contract\|carrying a template_id and params' \
  tests/
```

Expected hits (load-bearing):
- `tests/integration/buildSystemPromptComposition.test.ts` — asserts on the exact pre-surgery STRUCTURED_RESPONSE_CONTRACT prose (`Your responses must be \`{template_id, params}\`. Do not output English prose.`). This test must be updated alongside §4a's prompt edit.

If grep returns hits in other test files, surface to operator before advance — those are unexpected dependencies on the prompt text.

- [ ] **Step 3: Verify Soft 8 fixture pattern**

```bash
ls tests/fixtures/anthropic/
cat tests/fixtures/anthropic/entry8FirstAttempt.ts
```

Expected: Soft 8's pattern uses two factory functions (`entry8PostTurn`, `entry8RespondTurn`) returning `Anthropic.Messages.Message` envelopes via `makeMessage()`. The fixture omits org_id/idempotency_key from postTurn (Site 1 injects), and uses placeholder UUIDs in respondTurn that Site 2 overwrites. Soft 9 follows the same pattern with three card shapes (Entry 12 productive, Entry 15 tentative, no-directive shape).

- [ ] **Step 4: Identify SEED constants and account UUIDs for fixtures**

```bash
grep -nE 'SEED\s*=\s*{' tests/setup/testDb.ts
cat tests/setup/testDb.ts | head -120
```

Then locate the actual account UUIDs and fiscal_period UUIDs for SEED.ORG_REAL_ESTATE (the same org Soft 8 uses). Soft 9's three card shapes need real seed UUIDs — fixture identity assertions must grep-confirm these per Convention #8, not paraphrase from Soft 8.

Expected fixture-identity surface for Soft 9:
- `SEED.USER_CONTROLLER`, `SEED.ORG_REAL_ESTATE` (already in Soft 8)
- `ORG_REAL_ESTATE_FISCAL_PERIOD_ID` (already used in Soft 8: `bf8d7172-ea4b-4baf-8a4d-f9285bbd3203`)
- Account UUIDs for Entry 12 shape (Cash + revenue/expense account)
- Account UUIDs for Entry 15 shape (contra-asset Allowance — Allowance for Doubtful Accounts) — verify exists in seed; if not, choose a substitute and document
- Account UUIDs for the no-directive shape (any account for the conversational "why was this posted?" non-proposal turn — does NOT need to be a real lookup since the agent isn't proposing)

If any required account is missing from the seed for SEED.ORG_REAL_ESTATE, halt and surface — Soft 9's Entry 15 shape may need substitution or shape change.

- [ ] **Step 5: Verify scoping doc §4a/4b/4c semantic content**

```bash
sed -n '395,520p' docs/09_briefs/phase-1.2/oi-3-class-2-fix-stack-scoping.md
```

Confirm semantic content for §4a, §4b, §4c reads as the brief expects. If drift, surface.

- [ ] **Step 6: Verification report to operator**

Surface:
1. Three prompt surfaces confirmed at expected locations (per Step 1).
2. Test-impact: `buildSystemPromptComposition.test.ts` asserts pre-surgery prose; test-update is part of this session's diff scope (Step 2).
3. Soft 8 fixture pattern confirmed; Soft 9 follows the same shape (Step 3).
4. Fixture identity assertions: SEED + fiscal_period + account UUIDs (per Step 4). Surface any missing account that affects Entry 15 fixture authoring.
5. Scoping doc §4a/4b/4c semantic content unchanged from the brief baseline (Step 5).

Wait for operator acknowledgment before Task 3. Do not advance past any MISMATCH without operator direction.

---

## Task 3: Step 2 Plan — prompt-surgery wording + Soft 9 design

Produce a planning report and wait for operator approval before any code edit.

- [ ] **Step 1: Surface §4a STRUCTURED_RESPONSE_CONTRACT final wording**

Cite the exact pre-surgery text and the proposed post-surgery text. Highlight:
- The `## Response contract` heading is preserved (existing test asserts on it).
- The opening sentence changes from `Your responses must be \`{template_id, params}\`. Do not output English prose. Every \`template_id\` must exist in the locale files.` to the new structure.
- The new "When to emit canvas_directive" section names `agent.entry.proposed` as the load-bearing pairing.
- The new "Tentative proposals" section references the `tentative` flag directly (per §3c (a) pick).
- Final length: scoping doc estimates ~12 lines vs. current ~3.

The implementation-finalized prose should be:
- Tight wording (this prompt ships in every agent turn; tokens cost recurring).
- Match the surrounding section voice (anti-hallucination rules: imperative, declarative, no hedging).
- No abstract placeholder language ("specific tentative-state representation chosen from the four-option enumeration") — name `tentative` directly per §3c (a).

Surface the proposed final wording for operator review.

- [ ] **Step 2: Surface §4b respondToUser.description final wording**

Cite the exact pre-surgery text and the proposed post-surgery text. Highlight:
- Pre-surgery: ~3 lines. Post-surgery: ~7 lines per scoping doc.
- The new mention of canvas_directive complements §4a's contract-layer mention.
- The description ships inside the tool definition's JSON Schema rendering — terseness matters.

Surface the proposed final wording for operator review.

- [ ] **Step 3: Surface §4c validTemplateIdsSection rubric final wording**

Cite the exact pre-surgery rubric text (in `validTemplateIdsSection()` function body, around the "Selection — prefer structured, fall back to natural" paragraph) and the proposed post-surgery text. Highlight:
- The unconditional "asking a clarifying question when context is ambiguous → agent.response.natural" routing is replaced.
- New rubric splits proposal-vs-non-proposal clarification.
- Reference to `tentative canvas_directive` matches §3c (a).

Surface the proposed final wording for operator review.

- [ ] **Step 4: Surface Soft 9 test design**

Cite the four assertions from scoping doc §6 Part 4. For each, specify:
- **Assertion 1 (productive path):** Entry 12-shape prompt; agent emits `agent.entry.proposed` + canvas_directive. Card has `tentative: undefined` or `false`. Strict-schema validates clean. Row+card pairing holds.
- **Assertion 2 (tentative path):** Entry 15-shape prompt; agent emits `agent.entry.proposed` + canvas_directive with `tentative: true`. Strict-schema validates clean. Row+card pairing holds.
- **Assertion 3 (no-directive path):** Non-proposal clarification prompt ("why was this posted?"); agent emits `agent.response.natural` + no canvas_directive. No ai_actions row written.
- **Assertion 4 (strict-schema rejection on emission-but-invalid):** Fixture emits a malformed canvas_directive (e.g., negative debit). Site 2's `ProposedEntryCardSchema.parse()` throws; orchestrator surfaces a service error.

Cite fixture file `tests/fixtures/anthropic/oi3-class-2-shapes.ts` shape:
- `entry12ProductivePostTurn` + `entry12ProductiveRespondTurn` (assertion 1 fixtures)
- `entry15TentativePostTurn` + `entry15TentativeRespondTurn` (assertion 2 fixtures)
- `noDirectiveRespondTurn` (assertion 3 fixture; no postTurn since no postJournalEntry call)
- `malformedDirectiveRespondTurn` (assertion 4 fixture)

Test session-id strategy: same Soft 8 pattern (pre-minted UUID, upsert in beforeEach) but with a distinct UUID per assertion if needed for parallel-run safety. Recommend single shared UUID per Soft 9 with assertions running serially (default Vitest behavior).

- [ ] **Step 5: Commit shape options**

| Option | Shape | Tradeoff |
|---|---|---|
| Y1 (4 commits) | (1) §4a + test update / (2) §4b / (3) §4c / (4) Soft 9 | Maximum granularity per §6 Part 8 "three commits, one per surface" plus Soft 9. Each prompt-surface change has its own founder review. |
| Y2 (2 commits, recommended) | (1) §4a + §4b + §4c + buildSystemPromptComposition.test update (prompt-surgery batched) / (2) Soft 9 + fixture file | Prompt-surgery is structurally one work unit per scoping doc §6 Part 8 ("Batch if the §3c sub-decision lands cleanly during implementation"). §3c landed cleanly at S18, so batched is correct. Soft 9 + fixture is its own commit (test artifact distinct from prompt-text artifact). |
| Y3 (1 commit) | Everything together | Cleanest single commit; loses prompt-surgery vs. test-artifact attribution split. Founder review fires once for everything. |

Recommendation: **Y2 (2 commits, prompt-surgery batched + Soft 9 separate)**. Matches scoping doc's "batch if §3c lands cleanly" directive, preserves test-artifact attribution.

- [ ] **Step 6: Diff scope expectation (under Y2)**

Commit 1 — prompt-surgery batched:

| File | Change | Approx delta |
|---|---|---|
| `src/agent/prompts/personas/_sharedSections.ts` | STRUCTURED_RESPONSE_CONTRACT body replaced | ~+10 / -2 lines |
| `src/agent/tools/respondToUser.ts` | description body replaced | ~+5 / -1 lines |
| `src/agent/prompts/validTemplateIds.ts` | validTemplateIdsSection rubric paragraph replaced | ~+5 / -3 lines |
| `tests/integration/buildSystemPromptComposition.test.ts` | Update STRUCTURED_RESPONSE_CONTRACT assertion to match new prose | ~+5 / -2 lines |
| **Total Commit 1** | **4 files** | **~+25 / -8 lines** |

Commit 2 — Soft 9 + fixture:

| File | Change | Approx delta |
|---|---|---|
| `tests/fixtures/anthropic/oi3-class-2-shapes.ts` | New file — six fixture factories (post + respond × Entry 12 + Entry 15; no-directive respond; malformed-directive respond) | ~+200 lines (new file) |
| `tests/integration/soft9OI3PromptSurgery.test.ts` | New file — four assertions + beforeEach session-row upsert | ~+250 lines (new file) |
| **Total Commit 2** | **2 new files** | **~+450 lines** |

- [ ] **Step 7: Surface plan to operator**

Wait for operator approval. Specifically gate on:
- §4a/§4b/§4c final wording (all three surfaces).
- Soft 9 fixture identity assertions (account UUIDs match seed).
- Soft 9 four assertions match scoping doc §6 Part 4.
- Commit shape (Y1/Y2/Y3) — recommend Y2.

**Do not begin any code edit until operator approves the plan.**

---

## Task 4: Implement Commit 1 (prompt-surgery batched)

After plan approval. Steps below assume Y2 commit shape.

- [ ] **Step 1: Apply §4a STRUCTURED_RESPONSE_CONTRACT revision**

Edit `src/agent/prompts/personas/_sharedSections.ts`. Replace the existing 3-line `STRUCTURED_RESPONSE_CONTRACT` template-string body with the implementation-finalized prose from Task 3 Step 1. Preserve the `## Response contract` heading (existing test depends on it).

- [ ] **Step 2: Apply §4b respondToUser tool description revision**

Edit `src/agent/tools/respondToUser.ts`. Replace the `description` field's string with the finalized wording from Task 3 Step 2.

- [ ] **Step 3: Apply §4c validTemplateIdsSection rubric revision**

Edit `src/agent/prompts/validTemplateIds.ts`. Replace the rubric paragraph (the `**Selection — prefer structured, fall back to natural.** ...` paragraph in the `validTemplateIdsSection()` function body) with the finalized wording from Task 3 Step 3.

- [ ] **Step 4: Update buildSystemPromptComposition test**

Edit `tests/integration/buildSystemPromptComposition.test.ts`. The Section 5 assertion block currently asserts:

```js
expect(prompt).toContain('## Response contract');
expect(prompt).toContain('Your responses must be `{template_id, params}`. Do not output English prose.');
```

Update the second assertion to match the new prose. Recommend asserting on the load-bearing post-surgery clauses:
- The new opening that includes `canvas_directive`.
- The "When to emit canvas_directive" naming `agent.entry.proposed`.
- The "Tentative proposals" mention.

Final assertion shape: 3-4 `expect(...).toContain(...)` calls that lock the structural elements without over-coupling to wording. Surface specific assertions in Task 3 Step 1 wording surface; finalize at edit time.

- [ ] **Step 5: Run agent:validate**

```bash
pnpm agent:validate
```

Expected: clean. The prompt edits are text-only; no schema or service code touched. Halt and surface if anything fails.

- [ ] **Step 6: Run targeted tests first**

```bash
pnpm test buildSystemPromptComposition agentTemplateIdSetClosure agentToolCallThenRespond
```

Expected: all three test files pass. The first asserts the new prose; the second asserts template-id closure (unchanged by prose edits); the third asserts tool-call-then-respond flow (unchanged).

- [ ] **Step 7: Run full test suite**

```bash
pnpm test
```

Expected: 535 + 0 new = 535/536 (one carry-forward `accountLedgerService.test.ts:269` per push-readiness gate Condition 1, unchanged from S18).

If any new failures surface, halt and surface — they're caused by prompt-surgery and need triage.

---

## Task 5: Founder review gate (Commit 1)

- [ ] **Step 1: Surface to operator for review**

Present:
1. Three prompt-surface diffs (§4a, §4b, §4c) with finalized wording.
2. The buildSystemPromptComposition.test.ts diff.
3. `pnpm agent:validate` output.
4. `pnpm test` output (or documented deviation per push-readiness gate Condition 1).
5. Diff scope summary from Task 3 Step 6.

Wait for operator approval. Do not commit before approval.

- [ ] **Step 2: Apply revisions if requested**

Re-run targeted tests + full suite after every revision pass. Re-surface for re-approval.

---

## Task 6: Commit 1

- [ ] **Step 1: Stage prompt-surgery files**

```bash
git add src/agent/prompts/personas/_sharedSections.ts \
        src/agent/tools/respondToUser.ts \
        src/agent/prompts/validTemplateIds.ts \
        tests/integration/buildSystemPromptComposition.test.ts
git status --short
```

- [ ] **Step 2: Create Commit 1**

```bash
export COORD_SESSION='S19-oi-3-prompt-surgery-and-soft9' && git commit -m "$(cat <<'EOF'
feat(agent): OI-3 Part 3 — prompt-surgery on three canvas_directive surfaces

- §4a STRUCTURED_RESPONSE_CONTRACT (in _sharedSections.ts):
  introduces canvas_directive as structurally optional but
  required on agent.entry.proposed turns; names the directive-
  emission requirement as load-bearing for ratification; surfaces
  the tentative-state pathway (tentative cards alongside
  clarification per §3c (a) pick at 22b63c4).
- §4b respondToUser tool description (in respondToUser.ts):
  mentions canvas_directive at the tool layer so the model
  encounters the requirement at both contract and tool surfaces.
- §4c validTemplateIdsSection rubric (in validTemplateIds.ts):
  splits the unconditional ambiguity → agent.response.natural
  routing into proposal-aware vs. non-proposal clarification
  paths; proposal clarifications now route to
  agent.entry.proposed with tentative canvas_directive.
- Updates buildSystemPromptComposition.test assertion to match
  the new STRUCTURED_RESPONSE_CONTRACT prose (the existing
  assertion on the pre-surgery exact text would otherwise fail).
- confirm/route.ts unchanged: tentative state is UI-only
  advisory; post mechanics unchanged across all four §3c options.
- Closes OI-3 Part 3 per scoping doc 161bff8.
- Soft 9 integration test (Part 4) lands as a separate commit.
- Next paid-API gate: M1 post-fix validation (Part 5; $0.50
  ceiling, 9 shapes × 3 runs).

Session: S19-oi-3-prompt-surgery-and-soft9

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Verify Commit 1 landed**

```bash
git log -1 --stat
```

Expected: 4 files, ~25 insertions, ~8 deletions.

---

## Task 7: Implement Commit 2 (Soft 9 + fixture)

- [ ] **Step 1: Author the fixture file**

Create `tests/fixtures/anthropic/oi3-class-2-shapes.ts` with six factory functions:
1. `entry12ProductivePostTurn(resolvedDate, fiscalPeriodId, accountIdCash, accountIdRevenueOrExpense)` — postJournalEntry tool_use, simple double-entry, dry_run: true.
2. `entry12ProductiveRespondTurn(resolvedDate)` — respondToUser tool_use with `agent.entry.proposed` template_id, canvas_directive type `proposed_entry_card`, card omits `tentative` (or sets to `false`).
3. `entry15TentativePostTurn(resolvedDate, fiscalPeriodId, accountIdReceivable, accountIdAllowance)` — postJournalEntry tool_use, contra-asset adjusting entry, dry_run: true.
4. `entry15TentativeRespondTurn(resolvedDate)` — respondToUser tool_use with `agent.entry.proposed` + canvas_directive carrying card with `tentative: true`. Params can name a clarifying-question template variant if one exists, OR use `agent.response.natural` text param paired alongside (verify shape — see implementation note below).
5. `noDirectiveRespondTurn()` — respondToUser tool_use with `agent.response.natural` template_id, params `{ text: "..." }`, no canvas_directive. No paired postTurn since assertion 3 has no postJournalEntry call.
6. `malformedDirectiveRespondTurn(resolvedDate)` — respondToUser tool_use with canvas_directive that violates ProposedEntryCardSchema (e.g., negative debit, missing required field). Used by assertion 4.

Implementation note on fixture 4: `agent.entry.proposed`'s current params shape is `{ amount: string }` (verified at validTemplateIds.ts). Tentative cards need a way to surface clarifying text. Three options:
- (i) Use the existing `amount` param and rely on UI to render the "Tentative" badge (per §3c (a) renderer branch shipped at 22b63c4); no clarifying text surface in the response.
- (ii) Pair `agent.entry.proposed` (with tentative card) with a follow-on `agent.response.natural` turn carrying the clarification — but this requires the model to emit two respondToUser turns, which the orchestrator's main loop doesn't support (only one respondToUser per turn).
- (iii) Extend `agent.entry.proposed` params to include optional `clarifying_text?: string` — schema change, S20+ scope.

For Soft 9, use Option (i) — fixture emits `tentative: true` card without clarifying text. The clarifying-text surface is a §3c (a) follow-on consideration parked for next paid-validation cycle.

- [ ] **Step 2: Author the test file**

Create `tests/integration/soft9OI3PromptSurgery.test.ts` paralleling Soft 8's structure:
- Header comment naming OI-3 Part 4, scoping doc reference, distinguishing value over Soft 8.
- Pre-minted Soft 9 session_id (new UUID, distinct from Soft 8's `b54bf6fc-...`).
- `beforeEach`: upsert agent_sessions row by session_id (Soft 8 pattern A).
- `afterEach`: clear mock fixture queue. No row deletion (preserved as evidence).
- Four `it()` blocks corresponding to assertions 1-4. Each block:
  - Sets the appropriate fixture queue.
  - Calls `handleUserMessage`.
  - Asserts the response shape, ai_actions row presence (or absence), and card pairing per assertion.

Specific assertion shapes per Task 3 Step 4 design.

- [ ] **Step 3: Run Soft 9 in isolation**

```bash
pnpm test soft9OI3PromptSurgery
```

Expected: 4/4 it-blocks pass. If any fail, halt and surface — fixture or assertion shape needs revision before commit.

- [ ] **Step 4: Run full test suite**

```bash
pnpm test
```

Expected: 535 + 1 (Soft 9) = 536/537 (one carry-forward unchanged).

If new failures surface, halt and surface.

---

## Task 8: Founder review gate (Commit 2)

- [ ] **Step 1: Surface to operator for review**

Present:
1. Fixture file diff (full content).
2. Test file diff (full content).
3. `pnpm test soft9OI3PromptSurgery` output.
4. Full `pnpm test` output.

Wait for operator approval. Soft 9's review is more involved than Commit 1's (new files, fixture identity assertions, four distinct assertion shapes). Plan for ~10-15 minutes of review.

- [ ] **Step 2: Apply revisions if requested**

---

## Task 9: Commit 2

- [ ] **Step 1: Stage Soft 9 files**

```bash
git add tests/fixtures/anthropic/oi3-class-2-shapes.ts \
        tests/integration/soft9OI3PromptSurgery.test.ts
git status --short
```

- [ ] **Step 2: Create Commit 2**

```bash
export COORD_SESSION='S19-oi-3-prompt-surgery-and-soft9' && git commit -m "$(cat <<'EOF'
test(agent): OI-3 Part 4 — Soft 9 integration test for prompt-surgery

- Adds tests/integration/soft9OI3PromptSurgery.test.ts paralleling
  Soft 8's pattern. Four assertions:
  1. Productive path: agent emits agent.entry.proposed +
     canvas_directive (Entry 12 shape, simple double-entry).
     Row+card pairing holds; tentative undefined.
  2. Tentative path: agent emits agent.entry.proposed +
     canvas_directive with tentative: true (Entry 15 shape,
     contra-asset adjusting). Row+card pairing holds.
  3. No-directive path: agent emits agent.response.natural for
     non-proposal clarification ("why was this posted?"). No
     canvas_directive, no ai_actions row.
  4. Strict-schema rejection: malformed canvas_directive triggers
     Site 2's ProposedEntryCardSchema.parse() throw.
- Adds tests/fixtures/anthropic/oi3-class-2-shapes.ts with six
  fixture factories paralleling entry8FirstAttempt.ts pattern.
- Mocked-LLM integration tests; no paid-API spend. Closes OI-3
  Part 4 per scoping doc 161bff8.
- Next paid-API gate: M1 post-fix validation (Part 5; $0.50
  ceiling, 9 shapes × 3 runs against real model).

Session: S19-oi-3-prompt-surgery-and-soft9

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Verify Commit 2 landed**

```bash
git log -1 --stat
```

Expected: 2 new files, ~450 insertions.

---

## Task 10: Post-commit verification

- [ ] **Step 1: Surface confirmation to operator**

Audit chain extension:
- f90753b — S15 brief
- 5b02474 — Documentation Routing convention ratified
- 6e76d89 — S16 brief
- c40c91e — Documentation Routing first concrete application
- b756436 — S17 brief
- 44c50a3 — Documentation Routing tooling floor
- 6467caa — S18 brief
- 22b63c4 — S18 Commit 1: §3c (a) tentative-flag + Part 2 telemetry
- 3a709c6 — S18 Commit 2: Convention #8 finding refinement candidate
- (S19 brief at HEAD) — this brief
- (Commit 1 SHA) — OI-3 Part 3 prompt-surgery on three surfaces
- (Commit 2 SHA) — OI-3 Part 4 Soft 9 integration test

The next session opens for the M1 post-fix validation paid-API gate (OI-3 Part 5) — synthetic-prompt harness against the real model, $0.50 ceiling, 9 shapes × 3 runs. Or for any other Phase 2 work the operator scopes.

- [ ] **Step 2: Run session-end**

```bash
bash scripts/session-end.sh
```

---

## Out of scope (do not do)

- OI-3 Parts 1, 2, 5, 6, 7, 8 (all explicitly named out-of-scope above).
- onboardingSuffix.ts edits (out of OI-3 scope per scoping doc §2d).
- canvasDirective.schema.ts edits (no new variant per §3c (a) pick).
- proposedEntryCard.schema.ts or proposedEntryCard.ts edits (already shipped at 22b63c4; no further changes here).
- ProposedEntryCard.tsx edits (renderer branch already shipped at 22b63c4).
- orchestrator/index.ts edits (telemetry already shipped at 22b63c4).
- confirm/route.ts or reject/route.ts edits (out of scope across all four §3c options).
- DEV_WORKFLOW.md or INDEX.md edits.
- New convention candidates or obligations.md updates (unless something new fires during execution; if so, halt and surface — don't append silently).

## Halt conditions

- Any verification step in Task 2 fails (prompt-surface drift, test-impact surprises, fixture-identity mismatch).
- §4a/§4b/§4c finalized wording deviates from semantic-content floor (e.g., loses the canvas_directive emission requirement on `agent.entry.proposed`).
- Soft 9 fixture identity assertions don't grep-confirm against seed (Convention #8 violation).
- `pnpm agent:validate` or `pnpm test` regression caused by this session's edits.
- Any out-of-scope file appears in `git diff --stat`.
- A test other than `buildSystemPromptComposition.test.ts` asserts on the prompt-text and fails after surgery (unexpected dependency).
- Soft 9 fixture authoring requires schema or orchestrator changes (scope expansion — should be impossible given §3c (a) is already shipped, but flag immediately if it surfaces).
