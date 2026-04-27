# Session 18 — OI-3 §3c sub-decision + Part 2 telemetry patch

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** First product session post-cleanup-arc. Two deliverables, scoped narrowly per Option B framing:
1. Resolve the §3c sub-decision (four-option pick on tentative-state representation) flagged in `oi-3-class-2-fix-stack-scoping.md`. Decision lands at Task 3 plan-approval gate (D1) with full UI/audit/schema evidence visible — **before** any implementation work.
2. Land the Part 2 telemetry patch (closeout deliverable from C11 Obs-G): add `canvas_directive_present` and `directive_source` to the response-extraction log line in `src/agent/orchestrator/index.ts`.

**Architecture:** Mostly product code. The §3c decision either does or doesn't change the schema (depending on which option lands); the telemetry patch is two log fields, no logic change. Sequencing flexes at Task 3: if §3c picks an option requiring schema change, that change can land alongside the telemetry patch in one commit OR as two separate commits per operator's call at Task 3 plan.

**Tech Stack:** Next.js App Router, Zod schemas under `src/shared/schemas/`, the orchestrator at `src/agent/orchestrator/index.ts`. No new dependencies.

---

**Anchor (parent) SHA:** `44c50a336b9be3ffb17ca9f465c5742b87c0c597` — the SHA the brief was drafted against. WSL must verify HEAD's parent matches this anchor SHA via `git rev-parse HEAD~1`.

**Upstream authority:**
- OI-3 scoping doc at `docs/09_briefs/phase-1.2/oi-3-class-2-fix-stack-scoping.md` (commit `161bff8` — Meta A + Meta B first concrete application at scoping time).
- Documentation Routing convention at `docs/04_engineering/conventions.md` (ratified at `5b02474`, applied at `c40c91e`, tooling at `44c50a3`) — applies to the friction-journal entries this session may produce.
- Convention #8 Spec-to-Implementation Verification — the Identity assertions category governs the §3c evidence reads (the four UI/audit consumers must be grep-confirmed, not assumed).

---

## Session label
`S18-oi-3-decision-and-telemetry` — captures both deliverables explicitly so the §3c decision lineage is git-log-discoverable. First product session post-cleanup-arc.

## Hard constraints (do not violate)

- **Out of scope: Parts 1, 3, 4, 5, 6, 7, 8 of the OI-3 scoping doc.** Specifically: no M3 baseline measurement (Part 1), no prompt-surgery on the three surfaces (Part 3 — `STRUCTURED_RESPONSE_CONTRACT`, `respondToUser` tool description, `validTemplateIdsSection` rubric), no Soft 9 integration test (Part 4), no paid M1 validation (Part 5), no synthetic-bypass work (Part 6), no validation/resume/closeout (Parts 7-8). These land in S19+.
- **No schema changes other than what §3c picks.** If §3c picks (a) tentative-flag boolean: add the field, nothing else. If (c) discriminated-union variant: add the variant, nothing else. If (b) or (d): no schema change at all.
- **No prompt-text edits.** Part 3 prompt-surgery is its own session. The §3c decision determines what tentative-state representation the prompt-surgery work will reference, but the prompt-surgery itself doesn't land here.
- **Convention discipline:** the §3c decision is a cross-layer-coupling design choice. Identity-assertion evidence (per Convention #8) must be cited verbatim from the actual UI consumer files at Task 3, not from drafter memory or scoping-doc paraphrase.

---

## Task 1: Session-init and HEAD anchor

- [ ] **Step 1: Run session-init**

```bash
bash scripts/session-init.sh S18-oi-3-decision-and-telemetry
```

- [ ] **Step 2: Confirm HEAD points at the brief-creation commit, parent matches anchor**

```bash
git rev-parse HEAD~1
git log -1 --name-only --format='%H'
```

Expected: `HEAD~1` equals `44c50a336b9be3ffb17ca9f465c5742b87c0c597`. HEAD's single changed file is `docs/09_briefs/phase-1.2/session-18-brief.md`.

If either check fails, STOP per "Check HEAD before Step 2 Plan" convention.

---

## Task 2: Verification before drafting

This task gathers the §3c decision evidence per Convention #8 Identity assertions discipline. The §3c decision in Task 3 will cite specific lines of these files.

- [ ] **Step 1: Confirm the four UI/audit consumer set via grep**

```bash
grep -rn 'ProposedEntryCard' src/ | grep -v test | head -20
```

Expected consumers (the set named below is what's expected; if grep returns a different set, surface to operator before advance):
- `src/components/ProposedEntryCard.tsx` — the renderer.
- `src/components/bridge/AgentChatPanel.tsx` — chat-side consumer (renders inline cards).
- `src/components/bridge/ContextualCanvas.tsx` — canvas-side consumer (renders cards as canvas surfaces).
- `src/shared/schemas/accounting/proposedEntryCard.schema.ts` — the Zod schema.
- `src/shared/schemas/canvas/canvasDirective.schema.ts` — the discriminated union containing the `proposed_entry_card` variant.
- `src/agent/orchestrator/index.ts` — Site 2 post-fill location.

Plus the audit-trail handler (no `ProposedEntryCard` symbol; locate via the confirm route):
- `src/app/api/agent/confirm/route.ts` — the confirm-route audit-trail handler.

- [ ] **Step 2: Read each consumer for §3c-relevant context**

For each file, record (and surface in the Task 3 plan):
- **`proposedEntryCard.schema.ts`** — confirm the schema is `.strict()` (rejects extra keys); record current field set; note that `MoneyAmount` and string fields would reject sentinel values (relevant to §3c option (b)).
- **`canvasDirective.schema.ts`** — confirm `proposed_entry_card` is a discriminated-union variant; locate the variant; note implication for §3c option (c) (adding a peer variant).
- **`ProposedEntryCard.tsx`** — record how the renderer determines visual state (confidence_score? policy_outcome.required_action? other?); record any branching that already exists. The §3c option chosen will need a branch here for tentative-state rendering.
- **`AgentChatPanel.tsx`** + **`ContextualCanvas.tsx`** — record where each renders the card; record any wrapper logic; confirm both consume the same card prop shape.
- **`confirm/route.ts`** — record the five-branch state machine (NOT_FOUND / confirmed / stale / pending / unexpected). Confirm the audit trail consumes `ai_actions.tool_input`, not the card. **This is critical:** the §3c "tentative" signal is UI-only (advisory to operator); the actual post mechanics don't change regardless of which §3c option lands. The confirm-route invariants are unchanged across all four options.
- **`orchestrator/index.ts` Site 2 post-fill region** — locate the response-extraction log line (currently emits `{ template_id, had_tool_calls }`). Record the surrounding context for the Part 2 telemetry patch.

- [ ] **Step 3: Verify Part 2 telemetry patch site**

```bash
grep -n "had_tool_calls\|template_id: parsedRespond" src/agent/orchestrator/index.ts | head -5
```

Expected: a log line near "handleUserMessage: response extracted" emitting `{ template_id, had_tool_calls }` only. Record the line number; the patch adds two new fields to this object.

Also locate where `responseDirective` is computed (the `successCard !== undefined ? ... : parsedRespond.canvas_directive` ternary); the `directive_source` value derives from this branching.

- [ ] **Step 4: Verify scoping doc §3c option set is current**

```bash
sed -n '258,283p' docs/09_briefs/phase-1.2/oi-3-class-2-fix-stack-scoping.md
```

Expected: four options labeled (a) through (d) with the descriptions:
- (a) Tentative-flag boolean on the card.
- (b) Sentinel values in card fields.
- (c) Separate card variant in the discriminated union.
- (d) Existing schema unchanged + clarifying text in `agent.response.natural`.

If the scoping doc has drifted, surface to operator.

- [ ] **Step 5: Verification report to operator**

Surface a single report listing:
1. Confirmed consumer set (per Step 1 grep).
2. Per-file §3c-relevant context (per Step 2).
3. Part 2 telemetry patch site location (per Step 3).
4. §3c option set confirmation (per Step 4).

Wait for operator acknowledgment before Task 3. Do not advance past any MISMATCH without operator direction.

---

## Task 3: Step 2 Plan — §3c decision surface + telemetry patch design

Produce a planning report and wait for operator approval before any code edit.

- [ ] **Step 1: Surface the four §3c options with concrete evidence**

For each option, cite the exact code surface(s) that change (or don't), with line-number references from the Task 2 reads. Each option gets:
- **Schema impact:** which schema file changes, what the change looks like as a diff sketch.
- **UI consumer impact:** how each of the three UI consumers (`ProposedEntryCard.tsx`, `AgentChatPanel.tsx`, `ContextualCanvas.tsx`) changes (or doesn't).
- **Confirm-route impact:** explicit "no change" with the reason (audit trail consumes `tool_input`, not the card) cited from `confirm/route.ts` evidence.
- **Authoring cost:** rough line count + complexity grade (mechanical / nontrivial / structural).
- **Counterfactual:** what fails or degrades if this option is wrong vs. the others.

Match house style on each option's prose: bullet-list of impacts, not paragraphs.

- [ ] **Step 2: Operator picks the §3c option**

The operator selects (a), (b), (c), or (d) at this gate. The selection is documented inline in the plan with a one-line rationale (e.g., "(d) selected — minimal schema surface at this stage of OI-3; tentative-state UX revisited if operator-friction emerges in S19+ paid validation").

The pick determines whether Task 4 Step 2 (schema edit) lands in this session, and whether the telemetry patch lands in the same commit as the schema change or as a separate commit.

- [ ] **Step 3: Telemetry patch design**

Cite the line number located at Task 2 Step 3. Specify:
- New log fields: `canvas_directive_present: boolean` and `directive_source: 'model_loose' | 'site2_postfilled' | 'none'`.
- `canvas_directive_present` = `responseDirective !== undefined` (true if either model emission or Site 2 post-fill produced a directive).
- `directive_source` = `'site2_postfilled'` if `successCard !== undefined`, else `'model_loose'` if `parsedRespond.canvas_directive !== undefined`, else `'none'`.
- Whether the log line moves (currently before `responseDirective` is constructed) or whether the values compute inline at the log call.

Note: telemetry-only changes generally do not warrant new tests. The log line is a Pino emission; structural correctness is verified by reading the patched code, not by a unit test of the log shape.

- [ ] **Step 4: Commit shape decision**

Two paths depending on §3c outcome:

| §3c outcome | Schema change? | Recommended commit shape |
|---|---|---|
| (a) tentative-flag boolean | Yes (small, additive) | One commit (schema + telemetry together) OR two commits (operator's call) |
| (b) sentinels | Schema relaxation needed (significant) | Two commits — schema relaxation requires its own founder review |
| (c) discriminated-union variant | Yes (locality is wider — touches `canvasDirective.schema.ts` + downstream consumers) | Two commits |
| (d) prose-only | No | Two commits (independent) — telemetry can land first or second |

The operator selects the commit shape at this gate.

- [ ] **Step 5: Diff scope expectation**

Surface expected file count + approximate line count for each commit path. Confirm none of the out-of-scope files appear (no `STRUCTURED_RESPONSE_CONTRACT`, no `respondToUser` description edit, no `validTemplateIdsSection` edit, no Soft 9 test file).

- [ ] **Step 6: Surface the plan to operator**

Wait for operator approval. Specifically gate on:
- §3c pick (a/b/c/d) with one-line rationale.
- Commit shape (one commit or two).
- Telemetry patch line-number citation.

**Do not begin any code edit until operator approves the plan.**

---

## Task 4: Implement

After plan approval. Steps below are conditional on §3c outcome — adjust per the plan.

- [ ] **Step 1 (conditional on §3c outcome): Apply schema change**

If §3c picked (a): add field to `proposedEntryCard.schema.ts` per the diff sketch in Task 3 Step 1.
If §3c picked (b): apply schema relaxation per the diff sketch in Task 3 Step 1. **Halt and surface if the relaxation requires touching `MoneyAmount` or `.strict()` discipline broadly — that's scope expansion.**
If §3c picked (c): add discriminated-union variant in `canvasDirective.schema.ts` per the diff sketch.
If §3c picked (d): no schema change; skip this step.

- [ ] **Step 2 (conditional on §3c outcome): UI consumer updates**

If §3c picked (a) or (c): update `ProposedEntryCard.tsx` to branch on the new tentative-state signal. Confirm visual differentiation per the rendering decision in Task 3.
If (b): no UI consumer change required (sentinels render as-is via existing schema; UX-friction surfaces during paid validation if any).
If (d): no UI consumer change.

**Halt and surface if a UI consumer change requires modifying `AgentChatPanel.tsx` or `ContextualCanvas.tsx` beyond their existing card-rendering wiring** — that suggests scope expansion.

- [ ] **Step 3: Apply Part 2 telemetry patch**

Edit the response-extraction log line in `src/agent/orchestrator/index.ts` per the diff sketch in Task 3 Step 3. Add `canvas_directive_present` and `directive_source`. No logic change; only log emission shape.

- [ ] **Step 4: Run agent:validate**

```bash
pnpm agent:validate
```

Expected: typecheck passes, no-hardcoded-URLs grep clean, all five Category A floor tests pass. Halt and surface if anything fails.

- [ ] **Step 5: Run full test suite**

```bash
pnpm test
```

Expected: green. If failures surface that are caused by this session's edits, halt and surface. If failures are pre-existing (e.g., the two carry-forward `accountLedgerService.test.ts` failures noted in friction-journal/phase-1.2.md section (n)), document explicitly per the push-readiness gate's Condition 1.

---

## Task 5: Diff scope verification

- [ ] **Step 1: `git status --short` and `git diff --stat`**

Expected file list depends on §3c outcome:
- (a): `proposedEntryCard.schema.ts` + (optionally) `ProposedEntryCard.tsx` + `orchestrator/index.ts` (telemetry).
- (b): `proposedEntryCard.schema.ts` (relaxation) + `orchestrator/index.ts`.
- (c): `canvasDirective.schema.ts` + (optionally) `ProposedEntryCard.tsx` + `orchestrator/index.ts`.
- (d): `orchestrator/index.ts` only.

If anything else appears in the diff, STOP and surface.

- [ ] **Step 2: Confirm out-of-scope files are not modified**

Specifically check that none of the following are in the diff:
- `STRUCTURED_RESPONSE_CONTRACT` source file
- `respondToUser` tool description source
- `validTemplateIdsSection` rubric source
- Any new test file (Soft 9 is S19+)
- The Part 2 telemetry's effect on existing tests should be limited to log-shape verification if any test asserts on the log line — **halt and surface if a log-shape test fails**, since this is a deliberate change but operator should ratify.

- [ ] **Step 3: Re-run `pnpm agent:validate`**

Confirm clean post-edit.

---

## Task 6: Founder review gate (no commit yet)

- [ ] **Step 1: Surface to operator for review**

Present:
1. The §3c implementation diff (schema and/or UI consumer) with the §3c pick rationale re-stated.
2. The telemetry patch diff with the directive_source logic explanation.
3. `pnpm agent:validate` output.
4. `pnpm test` output (or documented deviation per push-readiness gate Condition 1).
5. Diff scope summary from Task 5.

Wait for operator approval. Do not commit before approval.

- [ ] **Step 2: Apply revisions if requested**

Re-run Task 5 (diff scope verification) after every revision pass. Re-surface for re-approval.

---

## Task 7: Commit

Either one or two commits per the Task 3 Step 4 decision.

- [ ] **Step 1: Stage files (commit 1)**

```bash
git add <files-per-§3c-outcome>
git status --short
```

- [ ] **Step 2: Create commit 1**

If §3c lands a schema change and operator chose one-commit shape:

```bash
export COORD_SESSION='S18-oi-3-decision-and-telemetry' && git commit -m "$(cat <<'EOF'
feat(agent): OI-3 §3c <option> + Part 2 telemetry patch

- §3c sub-decision: <option> selected (rationale: <one-line>)
- <schema change description per option>
- <UI consumer change description per option, if any>
- Part 2 telemetry: adds canvas_directive_present and
  directive_source fields to the response-extraction log line in
  orchestrator (closeout deliverable from C11 Obs-G; required for
  M1 post-fix validation observable in S19+)

Session: S18-oi-3-decision-and-telemetry

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

If two-commit shape: stage and commit the §3c change first (or telemetry first, per operator preference), then repeat Step 1-2 for the second commit. Each commit message follows the same shape with its scoped subject line.

- [ ] **Step 3: Verify commit landed**

```bash
git log -1 --stat   # or -2 --stat for two-commit shape
```

---

## Task 8: Post-commit verification

- [ ] **Step 1: Surface confirmation to operator**

Audit chain extension:
- `f90753b` — S15 brief
- `5b02474` — Documentation Routing convention ratified
- `6e76d89` — S16 brief
- `c40c91e` — Documentation Routing first concrete application
- `b756436` — S17 brief
- `44c50a3` — Documentation Routing tooling floor
- (S18 brief at HEAD) — this brief
- (this commit / these commits) — first product commit(s) post-cleanup-arc; OI-3 §3c resolved + Part 2 telemetry shipped

The next session opens for OI-3 Parts 3 + 4 (prompt-surgery on three surfaces + Soft 9 integration test), citing the §3c pick as the tentative-state representation contract.

- [ ] **Step 2: Run session-end**

```bash
bash scripts/session-end.sh
```

---

## Out of scope (do not do)

- Parts 1, 3, 4, 5, 6, 7, 8 of the OI-3 scoping doc (named explicitly above).
- Schema changes outside what §3c picks.
- Any prompt-text edit (Part 3 territory).
- Any new test file.
- DEV_WORKFLOW.md (still parked behind product gate).
- INDEX.md updates (no structural shift here).
- `obligations.md` updates (no new refinement candidates surfaced unless something new fires during execution; if so, halt and surface — don't append silently).

## Halt conditions

- Any verification step in Task 2 fails (consumer set drift, scoping-doc drift, telemetry site drift).
- §3c pick at Task 3 Step 2 implies scope beyond what the brief authorizes (e.g., (b) requires `MoneyAmount` schema relaxation broadly, or (c) requires touching downstream consumers beyond the discriminated-union variant addition).
- `pnpm agent:validate` or `pnpm test` regression that's caused by this session's edits.
- Diff scope check shows files outside the expected set (per §3c outcome's expected file list at Task 5 Step 1).
- A log-shape test asserts on the existing log fields and fails after the telemetry patch — halt and surface for operator ratification of the test update.
- House-style match would require contorting prose or code (defer to surfacing rather than forcing the match).
