# Session 20 — OI-3 Part 5: M1 post-fix paid-API validation

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Paid-API gate:** Task 9 fires real spend up to a $0.75 cumulative ceiling — operator authorization required at Task 4 Step 4 (harness-commit go-ahead) and Task 9 Step 1 (paid run go-ahead) before any paid invocation.

**Goal:** Validate that the §4a/§4b/§4c prompt-surgery shipped at S19 Commit 1 (`136b3ba`) actually fixes the canvas_directive emission discipline that staled at C7. Drive 27 invocations against the real Anthropic API across 9 shapes × 3 runs, classify per scoping doc §6 Part 5's four-state hypothesis-discrimination model, and surface the verdict (H3b-alone / H3-also-live / over-correction / inconclusive / mix) as evidence for whether OI-3 closes the Class 2 fix-stack or whether a follow-on iteration is needed.

**Architecture:** New synthetic-prompt harness `scripts/oi3-m1-validation.ts` drives `handleUserMessage` directly from Node against the real Anthropic API. Sequential shape-major iteration (shape 12 run 1 → 2 → 3 → shape 13 run 1 → ...). Halt on cumulative cost > $0.75 OR per-call cost > $0.15. Per-invocation captures: response template_id, canvas_directive presence, card.tentative state, ai_actions row presence, per-trace_id usage tokens. Incremental run-record JSON write for halt-resilience. Dry-run mode (`--first-shape-only`) executes shape 12 once against the real API for full wiring validation; cost counts toward the cumulative ceiling. Paid run resumes via `--resume-from=<dry-run-JSON>` to seed the cumulative counter and resume from shape 12 run 2.

**Tech Stack:** TypeScript via `pnpm tsx` (parallels `scripts/verify-ec-2.ts`'s invocation pattern), real Anthropic API (no mocked-LLM fixtures), `handleUserMessage` calls through to the actual orchestrator + LLM. Vitest unaffected — S20 doesn't add new tests; the harness is a script. No new dependencies.

---

**Anchor (parent) SHA:** `8b1e92cb6b08c685dfddf9894e56c00de0aa8e34` — the SHA of S19 Commit 3 (governance [ROUTE?] entries). WSL must verify HEAD's parent matches this anchor SHA via `git rev-parse HEAD~1`.

**Upstream authority:**
- OI-3 scoping doc at `docs/09_briefs/phase-1.2/oi-3-class-2-fix-stack-scoping.md` (commit `161bff8`) — §6 Part 5 paid-validation harness scoping, 9-shape prompt set, four-state hypothesis-discrimination model.
- S19 Commit 1 (`136b3ba`) — the prompt-surgery being validated (§4a STRUCTURED_RESPONSE_CONTRACT, §4b respondToUser tool description, §4c validTemplateIdsSection rubric).
- S19 Commit 2 (`13e11f7`) — Soft 9 mocked-LLM integration test that validates the four directive-emission shapes against fixtures. S20 validates the same property against the real model.
- EC-2 prompt set at `docs/07_governance/ec-2-prompt-set.md` — verbatim source for the 9 shapes (Entries 12-20). Prompts frozen at this source; deviation requires scoping-doc revision, not brief revision.
- Convention #8 Spec-to-Implementation Verification — Identity assertions discipline applies to harness-level fixture identity (account UUIDs, fiscal_period UUIDs runtime-resolved by natural key per Soft 9's P2 pattern).
- Convention #11 Per-Entry Row-Card Pairing Post-Paste Verification — the orphan-prevention property the harness measures.

---

## Session label
`S20-oi-3-m1-paid-validation` — captures the paid-API workstream explicitly. Continues the S-series.

## Hard constraints (do not violate)

- **Out of scope: OI-3 Parts 1, 2, 3, 4 (all shipped at S18+S19) and Parts 6, 7, 8** (synthetic-bypass / validation-resume / closeout — orthogonal Phase 2 workstreams, scoped separately). This brief covers Part 5 only.
- **Spend ceilings.**
  - Cumulative ceiling: $0.75 (dry-run + paid combined). Halt before next invocation if `cumulativeCost > 0.90 × $0.75`.
  - Per-call ceiling: $0.15. Single-invocation spend > $0.15 halts the run mid-shape.
  - Provenance: scoping doc §6 Part 5 estimates $0.40-$0.50 typical against a $0.50 ceiling. S20 lifts the ceiling to $0.75 (operator decision earlier in this session) for ~50% headroom on novel shapes 16-19. $0.75 is operator-authoritative; $0.50 is the scoping doc's typical-spend baseline, not the ceiling-of-record for S20.
- **Frozen §4a/§4b/§4c prompt-surgery surfaces.** Surfaces (`_sharedSections.ts:40` body, `respondToUser.ts:11` description, `validTemplateIds.ts:232` rubric paragraph) must be at S19 Commit 1's exact text during the paid run. No mid-run prompt edits. Verification at Task 2 Step 1.
- **Frozen 9-shape prompt set.** The 9 prompts (Entries 12-20 from the EC-2 prompt set) are frozen verbatim at `docs/07_governance/ec-2-prompt-set.md` lines 309-422. No paraphrasing, no shape additions/removals. Drift requires scoping-doc revision, not brief revision.
- **Synthetic-prompt harness only.** No user-input mode, no ad-hoc prompts mid-run, no improvisation. The 9 shapes are the entire input space for the run.
- **No cross-shape state pre-population.** The harness session_id starts with empty state, empty conversation, empty turns. Shape 17's "annual insurance prepaid we booked earlier this session" cross-reference is intentional — the agent must detect the missing reference and ask, not fabricate. Pre-populating Entry 7 (or any other prior context) would invalidate the negative-control treatment of shape 17. Mirrors scoping doc §6 Part 5's negative-control treatment of cross-reference dependencies. Shape 20's reference toward Entry 8 is the parallel hallucination-bait probe.
- **Distinct fresh session_id per shape.** Each shape's 3 runs share one shape-specific session_id; no reuse across shapes; no reuse across sessions. Per-run trace_id remains the per-invocation evidence scope per Soft 8/9's pattern.
- **Incremental run-record write — skeleton-before-invocation.** The run-record JSON entry for shape N run M is written with skeleton fields BEFORE the paid invocation fires; finalized AFTER. A halt mid-invocation preserves all prior evidence + the in-flight skeleton, so every dollar of paid spend has at-minimum a stub run-record line.
- **Convention #11 row-card pairing pre-flight.** Each shape's classification asserts row+card pairing per Convention #11: `canvas_directive` present → ai_actions row exists with matching `idempotency_key`; `canvas_directive` absent → no ai_actions row scoped to this trace_id (the orphan signature is the explicit failure to test for).
- **Sequential shape-major iteration.** No parallel invocations. Shape 12 run 1 → 2 → 3 → shape 13 run 1 → ... ensures rate-limit predictability and per-shape variance assessment is meaningful.
- **Y2 commit shape (two commits, two founder review gates).** Commit 1 = harness file (Task 8, post-dry-run, pre-paid-run, lower-stakes review). Commit 2 = friction-journal entry (Task 11, post-paid-run, evidence-and-classification review). Matches the S19 product+governance attribution split.
- **No schema or orchestrator code changes.** S20 is validation-only. Any schema or orchestrator edits would invalidate the validation surface mid-run.
- **No edits outside the named target files.** Targets: `scripts/oi3-m1-validation.ts` (new harness, Commit 1), `docs/07_governance/friction-journal.md` (run-record summary entry, Commit 2). The run-record JSON files at `$HOME/chounting-logs/oi3-m1-{dry-run,run}-${TS}.json` are output artifacts, not tracked.
- **Anthropic API auth required.** `ANTHROPIC_API_KEY` env var must be populated (verified at Task 1 Step 3). Auth failure (401/403) is terminal: halt and surface; no retry.

---

## Task 1: Session-init, HEAD anchor, and Anthropic auth pre-flight

- [ ] **Step 1: Run session-init**

```bash
bash scripts/session-init.sh S20-oi-3-m1-paid-validation
```

- [ ] **Step 2: Confirm HEAD points at the brief-creation commit, parent matches anchor**

```bash
git rev-parse HEAD~1
git log -1 --name-only --format='%H'
```

Expected: `HEAD~1` equals `8b1e92cb6b08c685dfddf9894e56c00de0aa8e34`. HEAD's single changed file is `docs/09_briefs/phase-1.2/session-20-brief.md`.

If either check fails, STOP per "Check HEAD before Step 2 Plan" convention.

- [ ] **Step 3: Verify Anthropic API auth is configured**

```bash
test -n "$ANTHROPIC_API_KEY" || (echo "ERROR: ANTHROPIC_API_KEY not set" && exit 2)
```

Confirm the env var is populated. The harness's first paid invocation (Task 4 Step 2 dry-run) will fail if auth is missing. Do not advance to Task 2 with auth missing — halt and surface to operator for env setup.

---

## Task 2: Verification before drafting

S20-shaped pre-flight reads: prompt-surgery surface freeze, §3c (a) tentative wiring, CoA coverage for the 9 shapes, pending ai_actions sweep, run-record output writability.

- [ ] **Step 1: Verify §4a/§4b/§4c prompt-surgery surfaces at S19 Commit 1's text**

```bash
grep -nE 'may carry an optional `canvas_directive`' src/agent/prompts/personas/_sharedSections.ts
grep -nE '`tentative: true` on the card' src/agent/prompts/personas/_sharedSections.ts
grep -nE 'canvas_directive describing the artifact' src/agent/tools/respondToUser.ts
grep -nE 'tentative `canvas_directive` instead' src/agent/prompts/validTemplateIds.ts
```

Expected: each grep returns one hit. If any drift, STOP — paid run cannot fire against an unstable surface.

- [ ] **Step 2: Verify §3c (a) tentative flag is wired**

```bash
grep -nE 'tentative.*z\.boolean\(\)\.optional\(\)' src/shared/schemas/accounting/proposedEntryCard.schema.ts
grep -nE 'tentative\?:\s*boolean' src/shared/types/proposedEntryCard.ts
```

Expected: schema has `tentative: z.boolean().optional()` near line 62; TS type has `tentative?: boolean` near line 38. Both must be present for shape 15's tentative-emission test to be meaningful.

- [ ] **Step 3: Verify CoA coverage for the 9 shapes**

The 9 shapes need these account_codes available in `chart_of_accounts` for `SEED.ORG_REAL_ESTATE`:

| Shape | Account codes (per EC-2 expected outcomes) |
|---|---|
| 12 | 1000 (Cash), 5710 (Cloud/Hosting Expense) |
| 13 | 1600 (AR), 4300 (Consulting Revenue) |
| 14 | 1000 (Cash), 1600 (AR) |
| 15 | 1610 (Allowance for Doubtful Accounts), 5790 (Bad Debt Expense) |
| 16 | 1700 (Equipment), 2010 (Credit Card Payable), 2500 (Equipment Loan Payable) |
| 17 | (none required — agent should clarify, not post; if it posts: 1250 / 5760) |
| 18 | 1000 (Cash) — single-account or savings sub-account; agent may clarify |
| 19 | 5780 (Amortization Expense), 1810 (Accumulated Amortization — Software) |
| 20 | (none — negative-control, no posting expected) |

```sql
SELECT account_code, account_name FROM chart_of_accounts
WHERE org_id = '22222222-2222-2222-2222-222222222222'
  AND account_code IN ('1000', '1250', '1600', '1610', '1700', '1810',
                       '2010', '2500', '4300', '5710', '5760', '5780', '5790')
ORDER BY account_code;
```

13 codes total. Expected: all 13 present. Surface result to operator; confirm presence.

- [ ] **Step 4: Pending ai_actions sweep for prior session_ids**

```sql
SELECT session_id, COUNT(*) AS pending_count
FROM ai_actions
WHERE status = 'pending' AND org_id = '22222222-2222-2222-2222-222222222222'
GROUP BY session_id
ORDER BY pending_count DESC LIMIT 20;
```

Surface counts to operator. If unusually high (>50), consider clearing pending rows scoped by `session_id ≠ S20's id` before the paid run. Otherwise advance — the harness uses fresh per-shape session_ids and scopes its own evidence by trace_id per Soft 8/9's pattern.

- [ ] **Step 5: Run-record output directory writable**

```bash
mkdir -p "$HOME/chounting-logs"
test -w "$HOME/chounting-logs" || (echo "ERROR: $HOME/chounting-logs not writable" && exit 2)
```

Run-record JSON writes go here. If unwritable, halt — cannot capture evidence.

- [ ] **Step 6: Verification report to operator**

Surface:
1. §4a/§4b/§4c surfaces at S19 Commit 1's text (Step 1).
2. §3c (a) tentative flag wired (Step 2).
3. CoA coverage for 9 shapes confirmed (Step 3).
4. Pending ai_actions row count for ORG_REAL_ESTATE (Step 4).
5. `$HOME/chounting-logs` writable (Step 5).

Wait for operator acknowledgment before Task 3. Do not advance past any MISMATCH without operator direction.

---

## Task 3: Step 2 Plan — harness shape + 9-prompt set + halt logic

Produce a planning report and wait for operator approval before any code edit.

- [ ] **Step 1: Surface harness-shape decision (Option iii vs iv for usage capture)**

The harness needs to capture per-invocation Anthropic usage (`input_tokens`, `output_tokens`, cache read/creation tokens) to compute per-call cost.

- **Option iii (preferred, operator-confirmed at brief-design time):** Logger threading. The orchestrator's existing pino logger emits a line with `usage: {...}` per `callClaude` invocation. The harness installs a logger middleware that intercepts these lines per `trace_id`, sums them across the multiple `callClaude` calls within one `handleUserMessage` (typically 2: postTurn → tool_result → respondTurn), and reports total per-invocation cost.
- **Option iv:** Stderr capture. The harness pipes stderr through a regex matcher that parses the existing log line shape and extracts `usage`. More fragile (couples to log line format) but doesn't require code touches.

If during implementation Option iii reveals a coupling that requires a touch outside `scripts/` (e.g., logger middleware needs an export added to `src/lib/logger.ts`), surface and halt — that's a brief-amendment trigger.

- [ ] **Step 2: Surface the 9 prompts verbatim**

**C7 baseline lineage (load-bearing for hypothesis-discrimination):** Shapes 12 and 14 were productive in C7 EC-13. Shapes 13 and 15 staled as Class 2 orphans in C7 — these two shapes are the canonical staling cases that triggered OI-3's prompt-surgery scoping. Shapes 16-19 are C7-untried (the run halted before reaching them). Shape 20 is a fresh negative-control. Per scoping doc §6 Part 5, **H3-also-live evidence specifically requires re-staling on shapes 13 or 15 post-surgery; H3b-alone evidence requires productive emission on shapes 13 and 15 (3/3 each).**

| Shape | Scoping-doc label (§6 Part 5) | Prompt verbatim from EC-2 |
|---|---|---|
| 12 | C7-attempted, simple double-entry | `Paid the April AWS bill — $612.80 auto-debited from checking this morning.` |
| 13 | C7-attempted, multi-line split with discount | `Invoiced King West Studios $8,000 for the March project; they got a 5% early-payment discount offered in the contract, so if paid by April 30 they owe $7,600.` |
| 14 | C7-attempted, gate A short-circuit / relative-date | `Refunded $450 to Eglinton Retail — they overpaid last month's invoice. Sent a cheque today.` |
| 15 | C7-attempted, contra-asset adjusting Allowance | `Month-end: bump the allowance for doubtful accounts by $1,200 based on our aging review.` |
| 16 | C7-untried, multi-leg asset/financing | `Bought a new server rack — $14,500 total. Put $3,500 down on the corporate card and financed the remaining $11,000 with a 36-month equipment loan from RBC at 6.5%.` |
| 17 | C7-untried, cross-reference dependency | `Recognize April's portion of the annual insurance prepaid we booked earlier this session.` |
| 18 | C7-untried, intra-asset transfer | `Transferred $15,000 from checking to the high-interest savings account today.` |
| 19 | C7-untried, contra-intangible adjusting | `Post this month's amortization on the software license we bought in January — $12,000 license, 24-month useful life.` |
| 20 | Negative-control: ambiguous + cross-entry hallucination bait, EC-11 failure-mode probe | `Book the quarterly accrual.` |

- [ ] **Step 3: Surface the classification logic**

For each shape's 3 runs, classify the per-run outcome:
- **emitted_card_no_tentative:** template_id === `agent.entry.proposed`, canvas_directive present, type `proposed_entry_card`, card.tentative not set or false. **Productive emission.**
- **emitted_card_tentative:** same as above with card.tentative === true. **Tentative emission per §3c (a).**
- **emitted_natural_no_card:** template_id === `agent.response.natural`, no canvas_directive. **Non-proposal clarification.**
- **emitted_natural_with_orphan_row:** template_id === `agent.response.natural`, no canvas_directive, BUT ai_actions row written. **Class 2 orphan signature — the failure mode being validated.**
- **emitted_clarify_template:** template_id === `agent.clarify.entry_date_ambiguous` (or any other clarify variant). **Clarifying question without proposal.**
- **threw_or_errored:** orchestrator threw. **Service error path; not a model-behavior datapoint.**

Per shape, classify across 3 runs:
- **H3b-alone:** all 3 runs of positive-emission shapes (12, 13, 14, 16, 17, 18, 19) emit productively (emitted_card_*); shape 15 emits tentative on 3/3; shape 20 (negative-control) emits natural-no-card or clarify-template on 3/3.
- **H3-also-live:** at least 1 run on a positive-emission shape lands `emitted_natural_with_orphan_row`. Prompt-surgery is necessary but not sufficient.
- **Over-correction:** shape 20 (negative-control) emits a card in 1+ runs. Prompt-surgery routes too aggressively toward emission.
- **Inconclusive:** variance too high to classify cleanly (e.g., 1/3 + 2/3 splits within a shape, multiple shapes inconsistent).

Per scoping doc §6 Part 5 final paragraph: a run's overall classification can be a mix — "H3b-alone on shapes A, H3-also-live on shapes B" is sharper than collapsing to a single state.

- [ ] **Step 4: Surface the cost-tracking and halt logic**

```typescript
// Pseudo-code for the halt logic
const SPEND_CEILING = 0.75;
const PER_CALL_CEILING = 0.15;
let cumulativeCost = 0;  // Seeded from --resume-from JSON if present (paid run); starts at 0 for dry-run

for (const shape of shapes) {
  for (let run = 1; run <= 3; run++) {
    if (cumulativeCost > SPEND_CEILING * 0.90) {
      // Within 10% of ceiling — surface and halt before next invocation
      writeRunRecord({ status: 'halted_near_ceiling', cumulativeCost });
      throw new Error(`Halt: cumulative cost $${cumulativeCost.toFixed(4)} approaching ceiling $${SPEND_CEILING}`);
    }

    const callStartCost = cumulativeCost;
    const result = await runOneInvocation(shape, run);
    const callCost = result.usd;
    cumulativeCost += callCost;

    if (callCost > PER_CALL_CEILING) {
      writeRunRecord({ status: 'halted_per_call_ceiling', shape, run, callCost });
      throw new Error(`Halt: invocation cost $${callCost.toFixed(4)} > per-call ceiling $${PER_CALL_CEILING}`);
    }
  }
}
```

The halt happens BEFORE the next invocation, not after. Run-record is written incrementally so a halt mid-run preserves all prior evidence. **The cumulative cost counter spans dry-run + paid run combined** — `--resume-from=<dry-run-path>` reads the dry-run's final cumulativeCost and seeds the paid run's counter.

- [ ] **Step 5: Surface the run-record JSON schema**

```jsonc
{
  "session_label": "S20-oi-3-m1-paid-validation",
  "run_mode": "dry-run-first-shape-only" | "paid-run-resume",
  "started_at": "<ISO>",
  "halted_at": "<ISO>" or null,
  "halted_reason": "<reason>" or null,
  "cumulative_cost_usd": 0.4321,
  "ceiling_usd": 0.75,
  "per_call_ceiling_usd": 0.15,
  "anchor_commit": "<S19-commit-3-SHA>",
  "harness_commit": "<S20-Commit-1-SHA>",  // populated in paid run, null in dry-run
  "resumed_from_dry_run": "<dry-run-JSON-path>" or null,
  "shapes": [
    {
      "shape_num": 12,
      "shape_label": "C7-attempted, simple double-entry",
      "session_id": "<shape-12-session-uuid>",
      "prompt": "Paid the April AWS bill...",
      "runs": [
        {
          "run_num": 1,
          "trace_id": "<uuid>",
          "started_at": "<ISO>",
          "completed_at": "<ISO>",
          "duration_ms": 4521,
          "response": {
            "template_id": "agent.entry.proposed",
            "params": { "amount": "612.80" },
            "canvas_directive": {
              "type": "proposed_entry_card",
              "card_present": true,
              "card_tentative": false,
              "card_lines_count": 2,
              "card_account_codes": ["1000", "5710"]
            }
          },
          "ai_actions_row": {
            "present": true,
            "status": "pending",
            "idempotency_key_matches_card": true
          },
          "usage": {
            "base_input_tokens": 4321,
            "output_tokens": 654,
            "cache_creation_tokens": 0,
            "cache_read_tokens": 0,
            "num_callclaude_calls": 2,
            "total_usd": 0.0228
          },
          "classification": "emitted_card_no_tentative"
        }
      ],
      "shape_classification": "H3b-alone"
    }
  ],
  "overall_classification": "H3b-alone on shapes 12/13/14/16/17/18/19; H3b-alone on shape 15 (tentative); H3b-alone on shape 20 (negative-control)"
}
```

`session_id` lives at the shape level (one per shape, shared across that shape's 3 runs). `session_label` at the top level identifies the run (human-readable label, no UUID).

- [ ] **Step 6: Diff scope expectation (Y2 split)**

Commit 1 (post-Task-8, pre-paid-run):

| File | Status | Approx delta |
|---|---|---|
| `scripts/oi3-m1-validation.ts` | New | ~400 lines |

Commit 2 (post-Task-11, post-paid-run):

| File | Status | Approx delta |
|---|---|---|
| `docs/07_governance/friction-journal.md` | Modified | +30-50 lines (run-record summary entry) |

The run-record JSON files at `$HOME/chounting-logs/oi3-m1-{dry-run,run}-${TS}.json` are NOT in the diff — they're output artifacts, not tracked files (matches the EC-2 run pattern).

- [ ] **Step 7: Surface plan to operator**

Wait for operator approval. Specifically gate on:
- Harness shape (Option iii vs iv for usage capture).
- 9 prompts verbatim — any need to deviate from EC-2 verbatim?
- Classification logic — any of the 6 outcome categories need refinement?
- Halt logic ($0.75 cumulative ceiling, $0.15 per-call) — confirm.
- Two-commit shape (Y2): harness commit pre-paid-run, run record commit post-paid-run.
- Diff scope — 1 new file (Commit 1) + 1 modified file (Commit 2).

**Do not begin any code edit or run any paid API calls until operator approves the plan.**

---

## Task 4: Implement the harness

After plan approval.

- [ ] **Step 1: Author `scripts/oi3-m1-validation.ts`**

Per the design from Task 3. House style match: TS via `pnpm tsx` invocation (parallels `scripts/verify-ec-2.ts`), header docstring with convention reference, idempotent failure modes (incremental run-record write).

**Per-shape session_id minting:** the harness mints 9 UUIDs at startup (one per shape), upserts 9 `agent_sessions` rows scoped to `SEED.ORG_REAL_ESTATE`, and threads the shape-specific session_id through each of that shape's 3 invocations.

**Skeleton-before-invocation JSON write:** for each shape × run, write a skeleton run-record entry (`shape_num`, `run_num`, `trace_id`, `started_at`, `status: 'in_flight'`) BEFORE the paid invocation fires; update with `completed_at`, `response`, `ai_actions_row`, `usage`, `classification`, `status: 'complete'` AFTER. A halt mid-invocation preserves all prior evidence + the in-flight skeleton; operator can cross-reference against the Anthropic dashboard if the in-flight call shape matters.

**Atomic-rewrite mechanics:** for ~30 entries, full read-mutate-write per JSON write is fine (no need for JSONL-style streaming).

- [ ] **Step 2: Run with `--first-shape-only` flag against the real API**

```bash
pnpm tsx scripts/oi3-m1-validation.ts \
  --session-start="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --output-json="$HOME/chounting-logs/oi3-m1-dry-run-$(date -u +%Y%m%dT%H%M%SZ).json" \
  --first-shape-only
```

This mode runs shape 12 once against the real Anthropic API (cost: ~$0.05-$0.10) for full wiring validation. Validates:
- Session row creation (per-shape session_id minted)
- Account/period UUID lookups
- Logger threading or stderr capture (Option iii vs iv)
- Run-record JSON serialization with real usage data
- Halt logic (verify per-call-ceiling check fires correctly when artificially set low)
- **Cumulative cost counter starts at $0.00 + actual real-API shape-12 cost.**

The dry-run cost counts toward the $0.75 cumulative ceiling per cost-continuity. The paid run (Task 9) reads this run-record JSON via `--resume-from=<dry-run-output>` to seed the cumulative cost counter, then resumes from shape 12 run 2.

If wiring bugs surface, fix and re-run. **Do not advance to Task 8 (commit harness) with broken harness wiring.**

- [ ] **Step 3: Surface dry-run output to operator**

Show the run-record JSON, the harness's stdout/stderr, and any wiring issues encountered. The shape-12 run-record entry shows actual response, actual cost, actual classification — operator's first signal of whether the prompt-surgery is working.

- [ ] **Step 4: Operator goes/no-goes the harness commit**

Operator examines dry-run output, confirms harness behaves as expected. Authorization here is for the harness commit (Task 8), not the full paid run (Task 9 has its own authorization gate).

---

## Task 5: (RESERVED — no Task 5; numbering preserved for symmetry with prior briefs.)

Skipping Task 5 number to preserve task-numbering symmetry with prior briefs that had a "diff scope verification" task at this slot. S20's diff scope is verified incrementally at Tasks 8 and 11.

---

## Task 6: (RESERVED)

Skipping Task 6 number for the same reason.

---

## Task 7: (RESERVED)

Skipping Task 7 number for the same reason.

---

## Task 8: Commit harness (founder review 1 — pre-paid-run)

- [ ] **Step 1: Surface the harness diff for review**

Present:
1. The harness file `scripts/oi3-m1-validation.ts` (full content — ~400 lines).
2. The dry-run output from Task 4 Step 2 (run-record JSON from dry-run, including the one real shape-12 invocation).
3. Cumulative dry-run cost (per cost-continuity, this counts toward the $0.75 ceiling — should be ~$0.05-$0.10).
4. Diff scope: 1 new file (`scripts/oi3-m1-validation.ts`).

Wait for operator approval. Lower-stakes review than Commit 2 — paid spend has not yet fired beyond the dry-run shape.

- [ ] **Step 2: Apply revisions if requested**

Re-run dry-run after every revision pass. Re-surface for re-approval.

- [ ] **Step 3: Stage and commit harness**

```bash
git add scripts/oi3-m1-validation.ts
git status --short

export COORD_SESSION='S20-oi-3-m1-paid-validation' && git commit -m "$(cat <<'EOF'
feat(scripts): OI-3 M1 paid-API validation harness

- Adds scripts/oi3-m1-validation.ts: synthetic-prompt harness
  driving handleUserMessage directly from Node, designed for
  9 EC-2 shapes × 3 runs per OI-3 scoping doc §6 Part 5.
- Run shape: sequential shape-major iteration (shape 12 run 1
  → 2 → 3 → shape 13 run 1...). Halts at $0.75 cumulative
  ceiling or $0.15 per-call ceiling. Writes incremental
  run-record JSON for halt-resilience.
- Per-invocation captures: response template_id, canvas_directive
  presence, card.tentative state, ai_actions row presence,
  per-trace_id usage tokens.
- Per-shape classification across 6 outcome categories:
  emitted_card_no_tentative | emitted_card_tentative |
  emitted_natural_no_card | emitted_natural_with_orphan_row |
  emitted_clarify_template | threw_or_errored.
- Overall hypothesis-discrimination: H3b-alone | H3-also-live |
  over-correction | inconclusive (mix possible).
- Dry-run mode (--first-shape-only flag) executes shape 12
  once against real API for full wiring validation; cost
  counts toward cumulative ceiling. Paid run uses
  --resume-from=<dry-run-JSON> to seed the cumulative counter
  and resume from shape 12 run 2.
- Reusable durable infrastructure parallel to verify-ec-2.ts.
  Run record from this session lands in Commit 2 (this
  session's friction-journal entry references the harness
  commit's SHA).

Session: S20-oi-3-m1-paid-validation

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: Verify Commit 1 landed**

```bash
git log -1 --stat
```

Expected: 1 new file, ~400 lines.

---

## Task 9: Run the paid harness

- [ ] **Step 1: Operator goes/no-goes the paid run**

Operator examines:
- The dry-run output from Task 4 Step 2 (already reviewed at Task 8).
- The harness commit at HEAD.
- The remaining cost ceiling: `$0.75 - <dry-run cost>` ≈ $0.65-$0.70.

Operator authorizes the paid invocation. **Without explicit authorization in chat, do not run the paid harness.**

- [ ] **Step 2: Launch the paid run**

```bash
pnpm tsx scripts/oi3-m1-validation.ts \
  --resume-from="$HOME/chounting-logs/oi3-m1-dry-run-<TS>.json" \
  --output-json="$HOME/chounting-logs/oi3-m1-run-$(date -u +%Y%m%dT%H%M%SZ).json"
```

The harness reads the dry-run JSON to seed the cumulative cost counter (per cost-continuity), then resumes from shape 12 run 2 (since shape 12 run 1 already fired during dry-run). Drives the remaining 26 invocations sequentially.

Expected duration: 26 × ~5s/invocation ≈ 2-3 minutes wall time, plus rate-limit backoff if any.

- [ ] **Step 3: Surface the run output in chat**

After completion (or halt), surface:
- Run status (clean completion / halted-near-ceiling / halted-per-call-ceiling)
- Cumulative cost (dry-run + paid combined)
- Per-shape classification
- Overall hypothesis-discrimination classification
- Path to the run-record JSON file

- [ ] **Step 4: Halt-and-surface on partial completion**

If the run halted before all 27 invocations, the in-memory state matches the run-record JSON's last entry. Per Meta A's PARTIAL-closure discipline, all three dimensions must be populated:
- **Coverage:** verified shapes / attempted-but-failed / untried (shapes the run didn't reach due to halt).
- **Cost:** verification spend / discovery spend / total against ceiling.
- **Hypothesis-discrimination:** per-shape classification + overall mix.

Surface PARTIAL run-record to operator with all three dimensions populated. The run-record itself is the deliverable; do not retry without operator direction.

---

## Task 10: Friction-journal entry

- [ ] **Step 1: Draft the friction-journal entry summarizing the run**

Append to `docs/07_governance/friction-journal.md` Phase 2 section (active journal). The entry follows the established format:

```markdown
- 2026-04-27 NOTE — OI-3 Part 5 M1 paid-API validation completed.
  Cumulative cost $X.XX of $0.75 ceiling. 27 invocations across
  9 shapes × 3 runs. Overall classification: <H3b-alone | H3-also-live
  | over-correction | inconclusive | mix>. Run record at
  $HOME/chounting-logs/oi3-m1-run-<TS>.json.
```

If the run produced a clean H3b-alone classification:
```markdown
- 2026-04-27 NOTE — OI-3 Part 5 M1 paid-API validation: H3b-alone
  confirmed. All productive shapes (12, 13, 14, 16, 17, 18, 19) emit
  card 3/3; shape 15 (tentative) emits tentative card 3/3; shape 20
  (negative-control) emits natural-no-card or clarify 3/3. Cumulative
  cost $X.XX. Class 2 fix-stack collapses into OI-3's coverage; no
  Phase 2 follow-on needed. Run record: <path>.
```

If the run revealed H3-also-live:
```markdown
- 2026-04-27 NOTE — OI-3 Part 5 M1 paid-API validation: H3-also-live.
  Shapes <X, Y, Z> stale despite §4a/§4b/§4c surgery. <N>/27 runs
  emit emitted_natural_with_orphan_row. Cumulative cost $X.XX. Class 2
  fix-stack extends OI-3 with model-cognitive intervention; Phase 2
  scopes follow-on. Run record: <path>.
```

If over-correction:
```markdown
- 2026-04-27 NOTE — OI-3 Part 5 M1 paid-API validation: over-correction
  on shape 20 (negative-control). <N>/3 runs emit a card despite
  expected no-card. Prompt-surgery routes too aggressively toward
  emission; §4c rubric needs revision to handle proposal-vs-non-proposal
  more carefully. Cumulative cost $X.XX. Run record: <path>.
```

If inconclusive:
```markdown
- 2026-04-27 NOTE — OI-3 Part 5 M1 paid-API validation: inconclusive.
  Variance across 3 runs per shape too high to classify cleanly. <N>
  shapes show 1/3 + 2/3 splits. Suggests H3 nondeterminism is meaningful
  factor; prompt-surgery is necessary but emission is not deterministic.
  Cumulative cost $X.XX. Phase 2 follow-on may need 5-runs-per-shape
  re-validation. Run record: <path>.
```

The exact entry text adapts to the actual classification. Halt-and-surface to operator before writing for confirmation if the run produced a mix or unexpected classification.

- [ ] **Step 2: Surface the friction-journal entry for operator review**

Wait for operator approval before commit.

---

## Task 11: Commit run record (founder review 2 — post-paid-run)

- [ ] **Step 1: Surface the diff for review**

Present:
1. The friction-journal entry draft (full content).
2. The run-record JSON file path + summary table from the run.
3. Cumulative cost (combined dry-run + paid run) and classification verdict.
4. Diff scope: 1 modified file (`docs/07_governance/friction-journal.md`).

The harness commit (Commit 1) is already at HEAD~1 from Task 8; Commit 2 anchors against that.

Wait for operator approval. Heavier review than Commit 1 — this captures the run's evidence and classification verdict.

- [ ] **Step 2: Apply revisions if requested**

- [ ] **Step 3: Stage and commit run record**

```bash
git add docs/07_governance/friction-journal.md
git status --short

export COORD_SESSION='S20-oi-3-m1-paid-validation' && git commit -m "$(cat <<'EOF'
docs(governance): OI-3 Part 5 M1 paid validation run record

- Run executed using harness at <Commit 1 SHA>: 27 invocations
  across 9 shapes × 3 runs against the real Anthropic API.
- Cumulative cost $X.XX of $0.75 ceiling (combined dry-run +
  paid). Per-call ceiling: $0.15.
- Classification verdict: <H3b-alone | H3-also-live |
  over-correction | inconclusive | mix>.
- Per-shape outcomes: <summary>.
- Run record at $HOME/chounting-logs/oi3-m1-run-<TS>.json
  (out-of-tree; preserved for Phase 2 reference).
- Friction-journal entry summarizes classification + Phase 2
  implications.
- Phase 2 next: <follow-on workstream depending on
  classification>.
- Closes OI-3 Part 5 per scoping doc 161bff8.

Session: S20-oi-3-m1-paid-validation

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: Verify Commit 2 landed**

```bash
git log -1 --stat
```

Expected: 1 modified file, ~30-50 line append.

---

## Task 12: Post-commit verification + session-end

- [ ] **Step 1: Surface confirmation to operator**

Audit chain extension:
- 8b1e92c — S19 Commit 3 ([ROUTE?] entries)
- (S20 brief at HEAD~2) — this brief
- (Commit 1 SHA) — Part 5 harness
- (Commit 2 SHA) — Part 5 run record

The OI-3 implementation arc closes here (Parts 1-5 all shipped).

- [ ] **Step 2: Run session-end**

```bash
bash scripts/session-end.sh
```

---

## Out of scope (do not do)

- Re-running prompt-surgery on §4a/§4b/§4c surfaces (the validation surface must not change mid-validation).
- Adding more shapes beyond the 9 named (scope creep — extends to Phase 2 follow-on).
- Adding more runs beyond 3 per shape (cost — would exceed ceiling; may be appropriate for Phase 2 if inconclusive).
- DEV_WORKFLOW.md drafting (next session, informed by S18/S19/S20 cumulative experience).
- Class 2 fix-stack implementation (next session if H3-also-live; otherwise collapsed into OI-3 by this validation).
- Schema or orchestrator code changes (S20 is validation-only).

## Halt conditions

- Any verification step in Task 2 fails (prompt-surgery not at HEAD, missing CoA accounts, non-empty pending ai_actions for prior session_ids).
- Cumulative cost > $0.75 OR single-invocation cost > $0.15.
- Anthropic API auth failure (401/403) — terminal; surface and halt.
- Anthropic API rate limit (429) after retry exhaustion — halt and surface; resume after backoff window per operator direction.
- Run-record JSON write fails (disk full, permissions) — terminal; cannot capture evidence.
- Dry-run reveals harness wiring bugs (Task 4 Step 2) — fix and re-dry-run; do not advance to **Task 8 (commit harness)**.
- Operator does not authorize harness commit after dry-run review (**Task 4 Step 4**) — halt at Task 8; harness gets revised or brief gets revised/closed.
- Operator does not authorize paid run after Task 9 Step 1 review — halt at Task 9; harness commit stands at HEAD as durable infrastructure but the run does not fire.
- Run produces unexpected classification mix not covered by the four named categories — halt at friction-journal drafting (Task 10) and surface to operator before writing.
