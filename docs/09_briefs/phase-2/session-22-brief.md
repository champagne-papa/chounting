# Session 22 — Anthropic prompt-caching enablement on the orchestrator's request shape

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Paid-API gate:** Task 7 fires real spend (~$0.05-$0.10) for shape 12 re-validation under caching-enabled conditions. Operator authorization required at Task 7 Step 1 before the re-validation invocation.

**Goal:** Enable Anthropic prompt caching on the orchestrator's `messages.create` request shape (cache_control breakpoints) such that:
- The system prompt + tool definitions go to the cache.
- `cache_read_input_tokens > 0` on second-and-later `callClaude` invocations within a single `handleUserMessage` flow.
- Per-invocation cost drops from S20's measured $0.119 (shape 12 baseline) to target $0.03-$0.05 (caches hit on calls 2-3 of a 3-call flow).
- No regression on any existing `pnpm test` suite (Soft tests, integration tests, unit tests).
- Re-validation: re-fire `scripts/oi3-m1-validation.ts --first-shape-only` against shape 12 with caching enabled; confirm `cache_read_tokens > 0` on calls 2+ and total invocation cost drops materially.

**Architecture (V1 minimal scope):**

Wrap the existing `system: string` in a single `TextBlockParam` with `cache_control: { type: 'ephemeral' }`, and add `cache_control: { type: 'ephemeral' }` to the last entry of the `tools` array. Both changes localize to `src/agent/orchestrator/index.ts` at the `callClaude` call site (line 368-381). `buildSystemPrompt`'s return type stays `string` (preserves all existing test assertions). Within a single `handleUserMessage` flow, the `system` arg is computed once outside the main loop (per `callClaude.ts:63` comment), so the cache key is identical across the 2-3 `callClaude` invocations — call 1 misses, calls 2-3 hit. Cross-turn caching (across separate `handleUserMessage` flows) is deferred to Phase 2+ because it requires reordering the system prompt to move per-turn variable content (temporal context, canvas_context) out of the cached prefix; that work is non-trivial because internal references like "the Current date above" couple variable content to position.

**Tech stack:** TypeScript, Anthropic SDK v0.90.0 (already supports `cache_control: CacheControlEphemeral` in stable namespace; verified via `node_modules/@anthropic-ai/sdk/resources/messages/messages.d.ts:1942` and the `system?: string | Array<TextBlockParam>` signature). No new dependencies. No schema changes.

---

**Anchor (parent) SHA:** `78ebaede7f0bddac3158b81c110f3854b29642e0` — the SHA of S21 Commit 1 (Phase 2 Class 2 fix-stack scope decision). WSL must verify HEAD's parent matches this anchor SHA via `git rev-parse HEAD~1`.

**Upstream authority:**
- S20 friction-journal cost-overshoot entry (`docs/07_governance/friction-journal.md` lines 80-88, commit `f362f0e`) — measured $0.119/invocation vs. scoping doc estimate $0.015-0.020; `cache_read_tokens=0` and `cache_creation_tokens=0` across all `callClaude` calls. The cost-driver finding that elevates this workstream.
- S21 Class 2 scope-decision artifact (`docs/09_briefs/phase-2/class-2-scope-decision.md`, commit `78ebaed`) — partial-collapse verdict; shape 15+20 re-validation gated on caching-enabled conditions. Caching enablement unblocks that follow-on.
- Phase 2 obligations.md §6 architectural follow-ups, item #6 ("Caching enablement"). This brief operationalizes that item.
- Anthropic prompt caching docs: cache_control in stable `messages` namespace, ephemeral type, ~5-minute TTL, applied to last block of cached prefix. SDK v0.90.0 type defs in `node_modules/@anthropic-ai/sdk/resources/messages/messages.d.ts`.
- Convention #11 Per-Entry Row-Card Pairing — assertion held across S20 paid runs; caching enablement should not change ai_actions row-card pairing semantics (verified by re-running test suite).
- Convention #8 Spec-to-Implementation Verification (N=3 fired in S20) — applies to this brief: any behavioral assumption is grep-confirmed against the codebase before brief-writing. Specifically, the `system` parameter shape, `cache_control` SDK support, and `__getLastClaudeCallParams` consumer set are all verified at brief-write time below.

---

## Session label
`S22-caching-enablement` — captures the architectural workstream explicitly. Continues the S-series.

## Hard constraints (do not violate)

- **Out of scope:** Cross-turn caching optimization (Phase 2+ extension; requires prompt reordering). Shape 15 + shape 20 re-validation (separate session, gated on this brief's commit). Class 2 fix-stack model-cognitive intervention (collapsed per S21 scope decision). Any change to §4a/§4b/§4c prompt-surgery surfaces (load-bearing for OI-3 emission discipline).
- **Spend ceilings:**
  - Cumulative ceiling: **$0.20** for Task 7 re-validation (single shape 12 dry-run; expected ~$0.05-$0.10 under caching, well under ceiling).
  - Per-call ceiling: **$0.10** (caching is expected to drop per-call cost; if a single invocation exceeds $0.10, that's a signal caching isn't firing as designed — halt and surface).
- **No prompt-text changes.** Caching enablement is a request-shape change only. The system prompt's text content (persona body, rules, contract, voice, tool descriptions, suffixes) is byte-identical pre- and post-caching. The change is at the SDK-call boundary, not the prompt builder.
- **No `buildSystemPrompt` return-type change.** `buildSystemPrompt(input): string` preserved verbatim. All 9+ tests that consume it via `expect(prompt).toContain(...)` continue to pass without modification.
- **`__getLastClaudeCallParams` compat-shim required.** Soft 8 (`tests/integration/soft8EntryEightReplay.test.ts`) currently casts `lastParams!.system as string`; under the new request shape `system` is `TextBlockParam[]`. A small helper that flattens either shape to text is added at the test-utility level (e.g., `tests/setup/getSystemPromptText.ts`) and Soft 8 is updated to use it. Other tests using `__getLastClaudeCallParams` adopt the same helper if they read `system` as text.
- **Test posture:** ALL existing tests green at HEAD post-caching. Floor: `pnpm agent:validate` clean (typecheck + no-hardcoded-urls + 26-test agent floor). Full suite: 538/540 with the two pre-existing `accountLedgerService.test.ts` carry-forwards (lines 269 + 346 per S19 Commit 3 `[ROUTE?]` entries) — unchanged from S20. No new failures attributable to caching.
- **Cache_control placement:** `cache_control: { type: 'ephemeral' }` on (a) the single `TextBlockParam` wrapping the system string, and (b) the LAST entry of the `tools` array. Both placements mark the END of a cacheable prefix. The two breakpoints are independent — tools array cached separately from system block (per Anthropic caching semantics).
- **Re-validation methodology:** re-fire `scripts/oi3-m1-validation.ts --first-shape-only` against shape 12 with `--output-json` to a fresh path. Compare against S20's dry-run record (`oi3-m1-dry-run-20260428T044025Z.json`) for `cache_read_tokens`, `cache_creation_tokens`, and `total_usd`. Surface comparison in Commit 2 friction-journal entry.
- **No paid-API spend authorization at brief-creation time.** Task 7 re-validation execution requires explicit operator authorization at Task 7 Step 1.
- **Y2 commit shape (two commits, two founder-review gates).** Commit 1 = caching implementation (`src/agent/orchestrator/index.ts` + `tests/setup/getSystemPromptText.ts` + Soft 8 update). Commit 2 = re-validation evidence (friction-journal entry summarizing the comparison). Matches the S20 product+governance attribution split.
- **Convention #8 N=3 carry-forward discipline.** Any behavioral assumption in the brief or the harness is grep-confirmed against the codebase before brief-write or implementation. The N=3 trigger fired in S20; behavior-level verification is a parked Phase 2 codification candidate. Operating discipline meanwhile: verify behavioral claims at execution time, surface deviations as `[ROUTE?]` entries.

---

## Task 1: Session-init, HEAD anchor, and Anthropic auth pre-flight

- [ ] **Step 1: Run session-init**

```bash
bash scripts/session-init.sh S22-caching-enablement
```

- [ ] **Step 2: Confirm HEAD points at the brief-creation commit, parent matches anchor**

```bash
git rev-parse HEAD~1
git log -1 --name-only --format='%H'
```

Expected: `HEAD~1` equals `78ebaede7f0bddac3158b81c110f3854b29642e0`. HEAD's single changed file is `docs/09_briefs/phase-2/session-22-brief.md`.

If either check fails, STOP per "Check HEAD before Step 2 Plan" convention.

- [ ] **Step 3: Verify Anthropic API auth is configured**

```bash
test -n "$ANTHROPIC_API_KEY" || (echo "ERROR: ANTHROPIC_API_KEY not set" && exit 2)
```

Per S20 L3 finding ([ROUTE?] entry at `docs/07_governance/friction-journal.md` lines 62-70): env vars exported in operator's terminal don't always propagate to WSL. If `ANTHROPIC_API_KEY` returns missing, source `.env.local`:

```bash
set -a && source .env.local && set +a
```

Re-run the check. If still missing, halt and surface to operator for env setup.

---

## Task 2: Verification before drafting

S22-shaped pre-flight reads: SDK type confirmation, request-shape current state, test-suite consumers of `system` shape, prompt-builder structure unchanged from S20.

- [ ] **Step 1: Verify SDK supports `cache_control` in stable namespace**

```bash
grep -c "cache_control" node_modules/@anthropic-ai/sdk/resources/messages/messages.d.ts
grep -n "system\?:" node_modules/@anthropic-ai/sdk/resources/messages/messages.d.ts
```

Expected: `cache_control` appears 15+ times in the stable messages.d.ts (not just beta); `system` field signature is `string | Array<TextBlockParam>`. If absent, halt — SDK upgrade required, which is out-of-scope for this brief.

- [ ] **Step 2: Confirm current `callClaude` call shape**

```bash
sed -n '365,385p' src/agent/orchestrator/index.ts
```

Expected: `callClaude({ model, max_tokens, system, messages, tools }, log)` at line 368-381. `system` is a string (return value of `buildSystemPrompt`). `tools` is `tools.map((t) => ({ name, description, input_schema }))`. No `cache_control` present. If drift, halt.

- [ ] **Step 3: Catalog test consumers of `system` parameter shape**

```bash
grep -rln "__getLastClaudeCallParams\b" tests/ src/
grep -rn "lastParams.*system\|params.*system" tests/ src/ | head -20
```

Expected hits:
- `tests/integration/soft8EntryEightReplay.test.ts` — currently casts `system as string`. Will need compat-shim under new shape.
- `src/agent/orchestrator/callClaude.ts:73` — declares `__getLastClaudeCallParams()` (test-only API).

If grep returns additional consumers in test files beyond Soft 8, surface — those are unexpected dependencies that need shim adoption too.

- [ ] **Step 4: Verify `buildSystemPrompt` return type unchanged**

```bash
grep -n "export function buildSystemPrompt\|^function buildSystemPrompt" src/agent/orchestrator/buildSystemPrompt.ts
```

Expected: `export function buildSystemPrompt(input: BuildSystemPromptInput): string` at line 66. Return type `string`. Caching enablement does NOT change this signature; existing tests that consume it stay green.

- [ ] **Step 5: Verify `tools` array structure**

```bash
sed -n '1,30p' src/agent/orchestrator/toolsForPersona.ts
```

Expected: tool definitions imported from `@/agent/tools`, each with `{ name, description, input_schema, zodSchema }`. The `cache_control` will be added at the orchestrator's `tools.map` call site, not at the tool definition source.

- [ ] **Step 6: Verification report to operator**

Surface:
1. SDK supports `cache_control` (Step 1).
2. Current `callClaude` shape unchanged from baseline (Step 2).
3. Test consumers of `system` shape: Soft 8 confirmed; flag any others (Step 3).
4. `buildSystemPrompt` return type still `string` (Step 4).
5. `tools` array shape consistent (Step 5).

Wait for operator acknowledgment before Task 3. Do not advance past any MISMATCH without operator direction.

---

## Task 3: Step 2 Plan — cache_control placement design + compat-shim shape

Produce a planning report and wait for operator approval before any code edit.

- [ ] **Step 1: Surface cache_control placement design**

**Two breakpoints, both `type: 'ephemeral'`:**

1. **System block:** wrap `system: string` in a single-element `TextBlockParam[]`:
   ```ts
   system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }]
   ```
2. **Tools array tail:** add `cache_control` to the last tool's definition:
   ```ts
   tools: tools.map((t, i, arr) => ({
     name: t.name,
     description: t.description,
     input_schema: t.input_schema as Anthropic.Messages.Tool.InputSchema,
     ...(i === arr.length - 1 ? { cache_control: { type: 'ephemeral' } } : {}),
   }))
   ```

**Why both breakpoints:** Anthropic caches contiguous prefixes from the start of each cacheable section. Marking the last block of `system` and the last entry of `tools` defines the END of each cached prefix. This caches the entire system text + entire tools array.

**What's NOT cached:** the `messages` array (conversation history) and `max_tokens`/`model` parameters. `messages` varies per turn (and within a turn — each tool result appends to messages); caching the messages array would require breakpoints inside it, which is Phase 2+ scope.

**Within-handleUserMessage cache hit pattern:**
- Call 1 (postTurn): cache miss, full input cost paid, `cache_creation_input_tokens` populated.
- Call 2 (tool_result): system + tools identical to call 1 → cache hit; `cache_read_input_tokens` populated; only delta tokens (tool result content) charge full input price.
- Call 3 (respondTurn): same cache hit; only delta tokens charge full price.

**Expected cost trajectory** (using S20 measurements as baseline, claude-sonnet-4-6 rates: input $3/MTok, output $15/MTok, cache_creation $3.75/MTok = 1.25× input, cache_read $0.30/MTok = 0.1× input):
- S20 shape 12 dry-run: 34,676 input + 1,001 output across 3 calls = $0.119.
- Estimated post-caching shape 12: call 1 ~$0.04 (~10K input incl. cache_creation surcharge), calls 2-3 ~$0.005 each (cache reads at 10× discount). Total ~$0.05. Drop ~58% on baseline. Materially better; doesn't quite hit scoping doc's $0.015-0.020 range (that estimate likely assumed cross-turn caching too).

- [ ] **Step 2: Surface compat-shim shape for `__getLastClaudeCallParams` consumers**

New utility file: `tests/setup/getSystemPromptText.ts`:

```ts
import type Anthropic from '@anthropic-ai/sdk';

/**
 * Returns the system prompt as a flat string, regardless of whether
 * the orchestrator passed `system` as a string (pre-caching) or as
 * an Array<TextBlockParam> (post-caching). Used by tests that read
 * lastParams.system via __getLastClaudeCallParams() and need to
 * assert text content.
 */
export function getSystemPromptText(
  params: Anthropic.Messages.MessageCreateParams | null,
): string {
  if (!params) return '';
  const sys = params.system;
  if (typeof sys === 'string') return sys;
  if (Array.isArray(sys)) {
    return sys
      .filter((b): b is { type: 'text'; text: string } => 
        b.type === 'text' && typeof b.text === 'string'
      )
      .map((b) => b.text)
      .join('');
  }
  return '';
}
```

**Soft 8 update** (`tests/integration/soft8EntryEightReplay.test.ts:166`):

```ts
// Before:
const systemPrompt = lastParams!.system as string;

// After:
import { getSystemPromptText } from '../setup/getSystemPromptText';
const systemPrompt = getSystemPromptText(lastParams);
```

Soft 8's existing `expect(systemPrompt).toContain(...)` assertions continue to pass — the shim flattens the new shape back to text.

- [ ] **Step 3: Surface diff scope expectation**

Commit 1 (caching implementation):

| File | Change | Approx delta |
|---|---|---|
| `src/agent/orchestrator/index.ts` | Lines 372 (`system`) + 374-378 (`tools.map`) — wrap system in TextBlockParam[]; add cache_control to last tool | ~+10 / -5 lines |
| `tests/setup/getSystemPromptText.ts` | New file — compat-shim helper | ~+30 lines |
| `tests/integration/soft8EntryEightReplay.test.ts` | Replace `as string` cast with shim helper call | ~+2 / -1 lines |
| **Total Commit 1** | **3 files** | **~+42 / -6 lines** |

Commit 2 (re-validation evidence):

| File | Change | Approx delta |
|---|---|---|
| `docs/07_governance/friction-journal.md` | New NOTE entry summarizing pre/post comparison + cache_read_tokens evidence | ~+10-12 lines |
| **Total Commit 2** | **1 file** | **~+12 lines** |

The re-validation run-record JSON at `$HOME/chounting-logs/oi3-m1-cached-run-${TS}.json` is NOT in the diff — output artifact, not tracked.

- [ ] **Step 4: Surface plan to operator**

Wait for operator approval. Specifically gate on:
- Two-breakpoint design (system + tools tail).
- Compat-shim helper at `tests/setup/getSystemPromptText.ts`.
- Diff scope (3 files Commit 1; 1 file Commit 2).
- Re-validation methodology (re-fire `--first-shape-only` against shape 12).
- Y2 commit shape.
- $0.20 cumulative / $0.10 per-call ceilings for Task 7 re-validation.

**Do not begin any code edit until operator approves the plan.**

---

## Task 4: Implement caching (Commit 1 candidate)

After plan approval.

- [ ] **Step 1: Update `src/agent/orchestrator/index.ts`**

At line 368-381 (the `callClaude` invocation inside the main retry loop), update the params object:

```ts
const resp = await callClaude(
  {
    model: MODEL,
    max_tokens: 4096,
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages,
    tools: tools.map((t, i, arr) => ({
      name: t.name,
      description: t.description,
      input_schema: t.input_schema as Anthropic.Messages.Tool.InputSchema,
      ...(i === arr.length - 1 ? { cache_control: { type: 'ephemeral' as const } } : {}),
    })),
  },
  log,
);
```

The `system` variable computed outside the loop stays a string (no `buildSystemPrompt` change). The wrapping happens at the SDK-call boundary.

- [ ] **Step 2: Author `tests/setup/getSystemPromptText.ts`**

Per the design from Task 3 Step 2. Header comment naming the convention reference (Soft 8 compat under caching enablement; pattern for any future test reading `lastParams.system`).

- [ ] **Step 3: Update Soft 8 to use the shim**

Edit `tests/integration/soft8EntryEightReplay.test.ts` line ~166 per Task 3 Step 2's diff. Add the import at the top of the test file.

- [ ] **Step 4: Run agent:validate**

```bash
pnpm agent:validate
```

Expected: clean. The caching change is at the SDK-call boundary; no schema or service code touched. Halt and surface if anything fails.

- [ ] **Step 5: Run targeted tests first**

```bash
pnpm test soft8EntryEightReplay buildSystemPromptComposition agentToolCallThenRespond agentOrchestratorHappyPath
```

Expected: all four test files pass. Soft 8's shim adoption is the load-bearing test for the compat path; the others verify nothing else broke.

- [ ] **Step 6: Run full test suite**

```bash
pnpm test
```

Expected: 538/540 — same baseline as S20. Two carry-forwards in `accountLedgerService.test.ts` (lines 269 + 346) per S19 Commit 3 [ROUTE?] entries; unchanged from S20.

If any new failures surface, halt and surface — they're caused by caching enablement and need triage.

---

## Task 5: Founder review gate (Commit 1)

- [ ] **Step 1: Surface to operator for review**

Present:
1. Three file diffs (orchestrator/index.ts, getSystemPromptText.ts, soft8 test).
2. `pnpm agent:validate` output.
3. `pnpm test` output (or documented deviation).
4. Diff scope summary from Task 3 Step 3.

Wait for operator approval. Do not commit before approval.

- [ ] **Step 2: Apply revisions if requested**

Re-run targeted tests + full suite after every revision pass. Re-surface for re-approval.

---

## Task 6: Commit 1

- [ ] **Step 1: Stage caching files**

```bash
git add src/agent/orchestrator/index.ts \
        tests/setup/getSystemPromptText.ts \
        tests/integration/soft8EntryEightReplay.test.ts
git status --short
```

- [ ] **Step 2: Create Commit 1**

```bash
export COORD_SESSION='S22-caching-enablement' && git commit -m "$(cat <<'EOF'
feat(agent): enable Anthropic prompt caching on orchestrator request shape

- Wraps system: string in single TextBlockParam[] with
  cache_control: { type: 'ephemeral' } at the callClaude
  invocation site (orchestrator/index.ts main loop). Adds
  cache_control to the last entry of the tools array.
- Two breakpoints: system block + tools array tail. Both
  cache the entire respective prefix; messages array stays
  uncached (per-turn variable; cross-turn caching deferred
  to Phase 2+ as it requires prompt reordering).
- buildSystemPrompt return type unchanged (string); all 9+
  consumers (mostly tests doing expect(prompt).toContain)
  continue to pass without modification.
- Adds tests/setup/getSystemPromptText.ts compat-shim that
  flattens system from either string or TextBlockParam[]
  back to text. Soft 8 (the only __getLastClaudeCallParams
  consumer reading system as text) updated to use the shim.
- Re-validation methodology (re-fire shape 12 dry-run under
  caching) lands in Commit 2 alongside the friction-journal
  evidence entry.
- Closes Phase 2 obligations §6 architectural follow-up #6
  (caching enablement). Unblocks Phase 2 OI-3 M1 completeness
  re-validation (shape 15+20 under caching-affordable cost).

Session: S22-caching-enablement

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Verify Commit 1 landed**

```bash
git log -1 --stat
```

Expected: 3 files, ~+42 / -6 lines.

---

## Task 7: Re-validation under caching (paid-API gate)

- [ ] **Step 1: Operator authorization gate**

Operator examines:
- Commit 1 at HEAD.
- Soft 8 + agent:validate green at HEAD.
- Pre-call cost projection: ~$0.05-$0.10 against $0.20 ceiling.

Operator authorizes the paid invocation. **Without explicit authorization in chat, do not run the re-validation.**

- [ ] **Step 2: Re-fire shape 12 dry-run under caching**

```bash
RE_RUN_PATH="$HOME/chounting-logs/oi3-m1-cached-run-$(date -u +%Y%m%dT%H%M%SZ).json"
echo "RE_RUN_PATH=$RE_RUN_PATH"
pnpm tsx --env-file=.env.local scripts/oi3-m1-validation.ts \
  --output-json="$RE_RUN_PATH" \
  --first-shape-only
```

The harness (commit `31166fb`) is unchanged; only the orchestrator's request shape changed. SDK-wrapper at A2 captures `cache_read_input_tokens` and `cache_creation_input_tokens` from the response object naturally.

Expected wall time: ~10-15s (similar to S20 dry-run; caching doesn't materially affect latency on a single 3-call flow).

- [ ] **Step 3: Surface re-validation output**

After completion, surface:
- Run-record JSON path.
- Per-call usage breakdown (input_tokens, output_tokens, cache_read_input_tokens, cache_creation_input_tokens).
- Per-call cost.
- Total cumulative cost.
- Comparison against S20 baseline (`oi3-m1-dry-run-20260428T044025Z.json` at `$HOME/chounting-logs/`):
  - Total input tokens: 34,676 → ?
  - Cache read tokens (S20): 0 → ?
  - Cache creation tokens (S20): 0 → ?
  - Total cost: $0.119 → ?
  - Drop %: ?

Expected verdict: cache_read_tokens > 0 on calls 2-3; total cost drops to $0.04-$0.06 range.

- [ ] **Step 4: Halt-and-surface if caching not firing**

Failure modes worth flagging:
- `cache_creation_input_tokens` and `cache_read_input_tokens` both still 0 across all calls → cache_control not registered by API; investigate placement.
- `cache_creation_input_tokens` populated on call 1, but `cache_read_input_tokens` still 0 on calls 2-3 → cache key unstable across calls within the same handleUserMessage; investigate `system` or `tools` mid-loop mutation.
- Total cost > $0.10 despite caching → caching is firing but the savings are smaller than projected; re-evaluate breakpoint placement or surface as Phase 2+ optimization candidate.

In any failure mode, halt and surface to operator. Re-validation evidence is the deliverable; do not retry without operator direction.

---

## Task 8: Friction-journal entry + Commit 2

- [ ] **Step 1: Draft the friction-journal entry**

Append to `docs/07_governance/friction-journal.md` Phase 2 section. Format:

```markdown
- 2026-XX-XX NOTE — S22 caching enablement: Anthropic prompt
  caching active on orchestrator request shape. Shape 12 dry-
  run cost dropped from $0.119 (S20 baseline) to $X.XX (-Y%).
  cache_read_input_tokens populated on calls 2-3 within
  handleUserMessage; calls within same flow now hit cache.
  Cross-turn caching deferred to Phase 2+ (requires prompt
  reordering). Closes Phase 2 obligations §6 item #6. Unblocks
  shape 15+20 re-validation. Run record:
  oi3-m1-cached-run-<TS>.json.
```

Adapt percentages and totals to actual measurements. ≤10 lines per the §10-second rule.

- [ ] **Step 2: Surface for operator review**

Wait for approval before commit.

- [ ] **Step 3: Stage and commit**

```bash
git add docs/07_governance/friction-journal.md
git status --short
export COORD_SESSION='S22-caching-enablement' && git commit -m "$(cat <<'EOF'
docs(governance): S22 caching enablement re-validation evidence

- Re-fired shape 12 dry-run under caching (commit <Commit 1
  SHA>). Per-invocation cost dropped from S20's $0.119 baseline
  to $X.XX (-Y%).
- cache_read_input_tokens populated on calls 2-3 within
  handleUserMessage; cache_creation_input_tokens populated on
  call 1. Within-flow caching active as designed.
- Cross-turn caching not optimized in V1 scope (per Phase 2+
  deferral on prompt reordering).
- Run record at $HOME/chounting-logs/oi3-m1-cached-run-<TS>.json
  (out-of-tree; preserved for Phase 2 reference).
- Friction-journal entry summarizes the comparison.
- Closes Phase 2 obligations §6 architectural follow-up #6.
- Phase 2 next: shape 15 + 20 re-validation under caching-
  enabled conditions; existing harness at scripts/oi3-m1-
  validation.ts (commit 31166fb) re-fires with --shapes=15,20.

Session: S22-caching-enablement

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: Verify Commit 2 landed**

```bash
git log -1 --stat
```

---

## Task 9: Post-commit verification + session-end

- [ ] **Step 1: Surface confirmation to operator**

Audit chain extension:
- 78ebaed — S21 Commit 1: Phase 2 Class 2 fix-stack scope decision
- (S22 brief at HEAD~2) — this brief
- (Commit 1 SHA) — caching implementation
- (Commit 2 SHA) — re-validation evidence

Phase 2 obligations §6 #6 closes. Phase 2 follow-on workstream queued: shape 15 + 20 re-validation under caching-enabled conditions.

- [ ] **Step 2: Run session-end**

```bash
bash scripts/session-end.sh
```

---

## Out of scope (do not do)

- Cross-turn caching optimization (Phase 2+ extension).
- Prompt reordering to move temporal/canvas variable content out of cacheable prefix (couples to internal prompt references; Phase 2+ scope).
- Shape 15 + shape 20 re-validation (separate session, gated on this brief's commit).
- Class 2 fix-stack model-cognitive intervention (collapsed per S21 scope decision).
- Any change to §4a/§4b/§4c prompt-surgery surfaces.
- New convention candidates (unless something fires during execution; if so, halt and surface — don't append silently).
- DEV_WORKFLOW.md (Phase 2 governance interlude; separate session).
- Schema or other src/ touches beyond `src/agent/orchestrator/index.ts`.

## Halt conditions

- Any verification step in Task 2 fails (SDK doesn't support cache_control; current request shape drift; unexpected `__getLastClaudeCallParams` consumers; `buildSystemPrompt` return-type changed).
- `pnpm agent:validate` or `pnpm test` regression caused by this session's edits.
- Any out-of-scope file appears in `git diff --stat`.
- Operator does not authorize Task 7 paid-API re-validation — halt at Task 6; Commit 1 stands as durable infrastructure but the re-validation does not fire.
- Caching not firing as designed (cache_read_tokens still 0 on calls 2+) — halt at Task 7 Step 4 and surface.
- Cumulative cost > $0.20 OR single-invocation cost > $0.10 during Task 7 — terminal halt.
- Anthropic API auth failure (401/403) — terminal; surface and halt.
