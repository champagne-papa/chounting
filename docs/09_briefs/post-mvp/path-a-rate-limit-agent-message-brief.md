# Path A Sub-brief — Rate-limit `/api/agent/message` (Pre-Phase-2A Carve-out)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to work this brief task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **No paid-API spend in this session** (rate-limit infrastructure + one route edit + one integration test; no orchestrator request fires). The integration test mocks `callClaude` per the `apiAgentMessage.test.ts` precedent.

**Phase placement.** This is a **Path A carve-out** from the original Phase 1.3 deployment-readiness scope (CORS / CSRF / rate-limiting). Path A as a whole is being deferred to Post-MVP cleanup after Phase 2 closeout per the 2026-05-01 phase-restructuring decision. This single carve-out lands before Phase 2A starts because the gap it closes — unbounded paid-API spend on a public-internet production endpoint — grows monotonically across Phase 2A's PDF-extractor + accounting-logic build-out, which raises per-action Anthropic cost. CORS audit, CSRF Origin-check sweep, and rate-limit extension to non-agent routes are explicitly **not in scope here** and stay deferred to Post-MVP.

---

## 1. Goal

Add user-keyed rate-limiting to `POST /api/agent/message` — the orchestrator entry point that calls Anthropic — so a single authenticated user (legitimate buggy retry loop, compromised invited account, future debugging mistake) cannot blow through the Anthropic budget.

**Two deliverables in a single bundled commit:**

1. **Rate-limit helper** at `apps/web/src/app/api/_helpers/rateLimit.ts` — wraps `@upstash/ratelimit` against `Redis.fromEnv()`, exports a `rateLimitAgentMessage(identifier)` function returning `{ success: boolean }`. Soft-fail-open posture: if Redis is unreachable, log and allow the request (availability over strict enforcement; documented in the file header as a deliberate posture choice).
2. **Route integration** at `apps/web/src/app/api/agent/message/route.ts` — call the helper after `buildServiceContext` (so we have `ctx.caller.user_id`) and before `handleUserMessage`; return 429 on rate-limit miss with `{ error: 'RATE_LIMITED', retry_after_seconds }` body.

Plus one regression test, structured-log instrumentation, and a friction-journal entry codifying the posture choice.

**Three agent endpoints OUT OF SCOPE this session:** `/api/agent/conversation` (GET, no Anthropic call), `/api/agent/confirm` (POST, no Anthropic call — DB write only), `/api/agent/reject` (POST, no Anthropic call — state update only). Rate-limiting these three has different cost-shape (DB / read fragility, not paid-API), and folding them in is scope-creep against the "minimal carve-out before Phase 2A" framing. They go to Post-MVP with the rest of Path A.

---

## 2. Anchor SHA

**TBD** — set by orchestrating session at execution kickoff. Verify HEAD at Task 1: anchor must be at or after the most recent S31 closeout commit (Path C arc Gate 5; LT-02 closure). The S31 closeout commit is the single bundled commit on `staging` referenced in the friction-journal entry dated 2026-05-01 — verify at execution by checking `docs/09_briefs/CURRENT_STATE.md`'s Phase Status / current-tip section. Halt and surface if HEAD precedes that anchor.

---

## 3. Upstream authority

The framing in §§4–5 is downstream of, and accountable to:

- `docs/03_architecture/phase_plan.md` — Phase 1.3 (originally Reality Check, restructured 2026-05-01 to Phase 2RC) §"DND-01 CORS/CSRF/rate-limiting" carry-forward; this brief is the targeted carve-out.
- `docs/09_briefs/phase-2/obligations.md` — Phase 2 architectural follow-ups; this brief does NOT add a row (the Path A umbrella row stays as carry-forward; this carve-out closes a sub-finding only).
- `docs/07_governance/friction-journal.md` 2026-05-01 production-promotion arc — `chounting.chou.ca` is live serving `apps/web` from merge commit `9f0ebb3`; rate-limiting is currently zero across the stack.
- `apps/web/src/app/api/agent/message/route.ts` — POST handler. Pattern: zod parse → `buildServiceContext(req)` → `handleUserMessage(input, ctx)` → return 200. The rate-limit check inserts between context-build and orchestrator-call.
- `apps/web/src/app/api/_helpers/serviceErrorToStatus.ts` — ServiceError → HTTP status mapping. NEW status mapping required: add `RATE_LIMITED` → 429.
- `apps/web/src/services/errors/ServiceError.ts` — `ServiceErrorCode` union. NEW code required: add `'RATE_LIMITED'` to the union; categorize under a new "Rate limiting (Path A carve-out)" section header.
- `apps/web/src/shared/env.ts` — env-var wiring. NEW required-server vars: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (added by the Vercel-Marketplace Upstash Redis integration; injected automatically into Vercel project env after operator clicks the integration's Install button). Add to `REQUIRED_SERVER` const so missing-on-deploy fires the same fatal-startup-message pattern as `SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY` — the F1 environment-isomorphism finding from the production-promotion arc explicitly motivates this defense-in-depth.
- `apps/web/tests/integration/apiAgentMessage.test.ts` (CA-60) — canonical test pattern for this route. The new rate-limit regression test mirrors its `vi.mock('@/services/middleware/serviceContext', ...)` shape and `__setMockFixtureQueue` pattern; mocks the rate-limit helper to return `{ success: false }` and asserts 429.
- `apps/web/src/shared/logger/pino.ts` — `loggerWith` pattern. The route's structured log on rate-limit miss includes `{ trace_id, user_id, action: 'agent.message.rate_limited', limit, window_seconds, remaining: 0 }`. No new redact paths required (no PII in rate-limit output).
- `@upstash/ratelimit` v2.0.8 + `@upstash/redis` (latest) — net-new dependencies. Verify versions at `pnpm add` time; `Ratelimit.slidingWindow(N, "M s")` is the API surface used.
- `CLAUDE.md` repo standing rules — the `service-architecture` skill does NOT apply (this brief edits route handlers and a route-helper, not `src/services/`). Standard test conventions apply to the new integration test.
- `AGENTS.md` — Next.js breaking-change discipline does not apply this session (no middleware, no routing, no edge-runtime touches; the route stays Node.js runtime).

---

## 4. Hard constraints (do not violate)

- **Out of scope (defer to Post-MVP):**
  - Rate-limiting on `/api/agent/conversation`, `/api/agent/confirm`, `/api/agent/reject` (different cost shape; bundle separately).
  - Rate-limiting on `/api/orgs/[orgId]/*` mutating routes (~30 routes; bigger sweep).
  - CORS header audit (Path A subset).
  - CSRF Origin-header validation sweep (Path A subset).
  - Per-IP rate-limiting (anonymous endpoints don't exist on this surface; user-keyed is the right granularity).
  - Multi-region Upstash Redis (single-region is fine for one-org-real-bookkeeping load).
  - Dynamic limits / `setDynamicLimit` (static-policy is sufficient; dynamic is a Phase 2+ ergonomics concern).
  - Token-based limits (request-count is the right primitive; token-counting belongs in Phase 2 cost-observability work).
  - Edge runtime migration (route stays Node runtime; matches existing pattern).
  - Rate-limit policy tuning beyond V1 numbers (§5).

- **Test posture floor.** `pnpm agent:validate` passes 26/26 green at HEAD post-edit. Full-suite fresh-post-reset baseline at HEAD must remain at the post-S31 baseline plus +1 for the new integration test. If pre-existing carry-forward failures (e.g., the 5-test pollution cluster from `CURRENT_STATE.md`) surface, document but do not address; halt criteria per Task 6 Step 3 = drift beyond fresh-run baseline (post-`db:reset:clean && db:seed:all`) halts execution; carry-forward stays unchanged.

- **No schema changes.** Rate-limit state lives in Upstash Redis, not Postgres. No migration files. No type regeneration.

- **No paid-API spend.** Mocked `callClaude` per CA-60 pattern.

- **Soft-fail-open posture is load-bearing.** If Upstash Redis is unreachable (network blip, Upstash outage, env-var missing post-deploy), the helper logs the failure with `action: 'agent.message.rate_limit_check_failed'` and returns `{ success: true }`. Rationale documented in helper file header: the rate-limiter's purpose is budget protection, not auth; an outage that downgrades to "no rate-limit for the duration of the outage" is preferable to one that locks all users out of the agent. Anthropic's own per-key spend caps (operator-set in the Anthropic console) are the second line of defense against runaway-during-outage scenarios.

---

## 5. Architecture (V1 minimal scope)

### 5a. Rate-limit policy

Two sliding-window limits, both keyed on `user_id`:

- **Burst limit:** 30 requests / minute / user.
- **Hour ceiling:** 200 requests / hour / user.

Helper checks both; either tripping returns `{ success: false }`. The hour ceiling exists to catch slow-rate sustained loops that stay under the per-minute burst threshold (e.g., 25/minute × 60 minutes = 1500 requests = ~$150 in Anthropic spend if average per-call is $0.10).

**Rationale for V1 numbers:** a real one-org-real-month close, per the Phase 2RC framing, is dominated by interactive bookkeeping turns — operator estimates 50-200 message turns per close per month. Per-minute peaks during active sessions are <5/minute. 30/minute leaves 6× headroom; 200/hour leaves ~10× headroom against worst-case-active-month load. Real users won't notice; loops trip in <60 seconds.

V1 numbers are deliberately conservative-permissive (bias toward false-negatives over false-positives, since false-positives lock real users out of the agent and false-negatives just trigger investigation). Tuning is explicitly Phase 2 work.

### 5b. Helper file shape

```typescript
// apps/web/src/app/api/_helpers/rateLimit.ts
// Path A carve-out (Post-MVP cleanup, pre-Phase-2A): user-keyed
// rate-limit on POST /api/agent/message — the only route in this
// session's scope. Other agent endpoints and the org-mutating
// routes stay deferred.
//
// POSTURE: soft-fail-open. If Upstash Redis is unreachable, log
// and allow the request. Rationale: rate-limiting protects the
// Anthropic budget, not auth; a Redis outage that becomes a
// user-facing outage is a worse failure mode than one that
// degrades to no-limit-during-outage. The Anthropic console's
// per-key spend cap is the second line of defense.

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { loggerWith } from '@/shared/logger/pino';

const redis = Redis.fromEnv();

const burstLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 m'),
  prefix: 'rl:agent.message:burst',
  analytics: false,
});

const hourLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(200, '1 h'),
  prefix: 'rl:agent.message:hour',
  analytics: false,
});

export interface RateLimitResult {
  success: boolean;
  retry_after_seconds?: number;
  reason?: 'burst' | 'hour';
}

export async function rateLimitAgentMessage(
  identifier: string,
  trace_id: string,
): Promise<RateLimitResult> {
  const log = loggerWith({ trace_id, user_id: identifier });
  try {
    const burst = await burstLimit.limit(identifier);
    if (!burst.success) {
      const retry = Math.max(1, Math.ceil((burst.reset - Date.now()) / 1000));
      log.warn(
        { action: 'agent.message.rate_limited', reason: 'burst', limit: 30, window_seconds: 60, remaining: 0, retry_after_seconds: retry },
        'agent message rate-limited (burst)',
      );
      return { success: false, retry_after_seconds: retry, reason: 'burst' };
    }
    const hour = await hourLimit.limit(identifier);
    if (!hour.success) {
      const retry = Math.max(1, Math.ceil((hour.reset - Date.now()) / 1000));
      log.warn(
        { action: 'agent.message.rate_limited', reason: 'hour', limit: 200, window_seconds: 3600, remaining: 0, retry_after_seconds: retry },
        'agent message rate-limited (hour ceiling)',
      );
      return { success: false, retry_after_seconds: retry, reason: 'hour' };
    }
    return { success: true };
  } catch (err) {
    log.error(
      { action: 'agent.message.rate_limit_check_failed', err: err instanceof Error ? err.message : String(err) },
      'rate-limit check failed; soft-failing open per documented posture',
    );
    return { success: true };
  }
}
```

### 5c. Route integration

In `apps/web/src/app/api/agent/message/route.ts`, after `const ctx = await buildServiceContext(req);` and before `const response = await handleUserMessage(...)`:

```typescript
const rateLimit = await rateLimitAgentMessage(ctx.caller.user_id, ctx.trace_id);
if (!rateLimit.success) {
  return NextResponse.json(
    {
      error: 'RATE_LIMITED',
      message: 'Too many requests. Please slow down.',
      retry_after_seconds: rateLimit.retry_after_seconds,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(rateLimit.retry_after_seconds ?? 60),
      },
    },
  );
}
```

**Note:** NOT throwing a `ServiceError('RATE_LIMITED', ...)` and routing through the catch block. The `ServiceErrorCode` union gets `RATE_LIMITED` added for future service-layer use (e.g., if Phase 2 adds rate-limited service-internal calls), but at the route layer we return 429 directly. This avoids the indirection through `serviceErrorToStatus` for what is conceptually a route-layer policy decision, and keeps the `Retry-After` header logic local to the route handler. The `RATE_LIMITED` → 429 mapping lands in `serviceErrorToStatus` anyway as defense-in-depth for any future service-layer firing.

### 5d. Test surface

NEW `apps/web/tests/integration/apiAgentMessageRateLimit.test.ts`:

- 1 it-block: POST with rate-limit helper mocked to return `{ success: false, retry_after_seconds: 42, reason: 'burst' }` returns 429 with body `{ error: 'RATE_LIMITED', message: ..., retry_after_seconds: 42 }` and header `Retry-After: 42`.
- 1 it-block: POST with rate-limit helper mocked to return `{ success: true }` proceeds normally to the orchestrator (mocked `callClaude` via `__setMockFixtureQueue([respondToUserHappyPath])` per CA-60); returns 200 with `AgentResponse` body.

Mock the helper at the import site:

```typescript
vi.mock('@/app/api/_helpers/rateLimit', () => ({
  rateLimitAgentMessage: vi.fn(),
}));
```

then `vi.mocked(rateLimitAgentMessage).mockResolvedValueOnce({...})` per case. Test does NOT exercise live Upstash Redis (the helper is unit-testable separately if desired, but V1 ships without that — Upstash is mock-shaped at the integration layer).

### 5e. Friction-journal entry

Append to `docs/07_governance/friction-journal.md` under Phase 2 section:

```markdown
- 2026-05-01 NOTE — Path A carve-out: rate-limit on
  /api/agent/message lands pre-Phase-2A (single bundled commit;
  brief at docs/09_briefs/post-mvp/path-a-rate-limit-agent-
  message-brief.md). Soft-fail-open posture deliberately chosen:
  Redis outage → no-limit-during-outage, NOT user-facing outage.
  Anthropic per-key spend cap is second line of defense. Other
  three agent endpoints (conversation/confirm/reject) and the
  ~30 org-mutating routes stay deferred to Post-MVP Path A
  cleanup. Codification candidate at N=2 if a future deferred
  carve-out from a multi-item phase-cleanup arc lands the same
  way (single-route surgical extraction with explicit deferral
  of siblings).
```

### 5f. Tech stack

TypeScript, Next.js Route Handlers, Vitest, `@upstash/ratelimit ^2.0.8`, `@upstash/redis` (latest at install time). Net-new dependencies; no schema changes; no migrations; no orchestrator or prompt edits.

---

## 6. Tasks

- [ ] **Task 1 — Pre-flight & lock acquisition.**
  - [ ] Step 1: `bash scripts/session-init.sh path-a-ratelimit` (or repo-current init script name; verify against most recent session's kickoff).
  - [ ] Step 2: `git rev-parse HEAD` and verify against §2 anchor expectation. Halt and surface on mismatch.
  - [ ] Step 3: substrate-fidelity check — confirm `apps/web/src/app/api/agent/message/route.ts` line numbers match brief §5c expectations; confirm `serviceErrorToStatus.ts` and `ServiceError.ts` signatures unchanged from S31 closeout state. Halt-and-surface on any drift.
  - [ ] Step 4: `pnpm db:reset:clean && pnpm db:seed:all && pnpm test 2>&1 | tail -30` to capture baseline. Record post-reset failure count (expected: same as S31 closeout, modulo any new pollution cluster items per CURRENT_STATE.md).

- [ ] **Task 2 — Operator pre-flight (out-of-band, NOT chat-driven).**
  This task requires operator action in external surfaces (Vercel dashboard, Anthropic console). Halt for operator confirmation before Task 3.
  - [ ] Step 1 (operator): in Vercel dashboard, install the Upstash Redis Marketplace integration on the chounting project. Choose "let Vercel manage" if no existing Upstash account; pick smallest-region single-region instance; confirm `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` appear in chounting Vercel project's Environment Variables for both Production and Preview environments. (F1 finding from production-promotion arc: do NOT trust that staging-set env vars propagate to production. Verify both independently.)
  - [ ] Step 2 (operator): in Anthropic console → Billing → Usage alerts, set a spend alert at a level you'd be unhappy but not devastated by ($200 suggested for this stage). This is the second line of defense and is mandatory regardless of whether this brief ships — record the alert threshold in the friction-journal NOTE for audit traceability.
  - [ ] Step 3 (operator): pull updated env vars locally for development (`vercel env pull .env.local` or paste `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` into `.env.local` directly).
  - [ ] Step 4: confirm operator-completed Step 1 and Step 2 in chat before assistant proceeds.

- [ ] **Task 3 — Add deps; extend env.ts; extend ServiceError + serviceErrorToStatus.**
  - [ ] Step 1: `pnpm --filter @chounting/web add @upstash/ratelimit @upstash/redis`. Verify `apps/web/package.json` shows both. `pnpm install` if needed to refresh lockfile.
  - [ ] Step 2: extend `apps/web/src/shared/env.ts` `REQUIRED_SERVER` const to add `'UPSTASH_REDIS_REST_URL'` and `'UPSTASH_REDIS_REST_TOKEN'`. Add corresponding entries to the exported env object (`UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL!`, etc.). Verify `pnpm typecheck` passes.
  - [ ] Step 3: extend `apps/web/src/services/errors/ServiceError.ts` `ServiceErrorCode` union to add `| 'RATE_LIMITED'` under a new `// Rate limiting (Path A carve-out)` section header. Verify `pnpm typecheck` passes.
  - [ ] Step 4: extend `apps/web/src/app/api/_helpers/serviceErrorToStatus.ts` to add a new `// Rate limiting` section with `case 'RATE_LIMITED': return 429;`. Verify `pnpm typecheck` passes.

- [ ] **Task 4 — Implement helper.**
  - [ ] Step 1: create `apps/web/src/app/api/_helpers/rateLimit.ts` per §5b verbatim. File-top comment block matches §5b's posture-rationale prose.
  - [ ] Step 2: `pnpm typecheck` passes. `pnpm --filter @chounting/web exec eslint src/app/api/_helpers/rateLimit.ts` returns 0 errors (warnings acceptable if pre-existing pattern).

- [ ] **Task 5 — Wire into route.**
  - [ ] Step 1: edit `apps/web/src/app/api/agent/message/route.ts` per §5c. Import added: `import { rateLimitAgentMessage } from '@/app/api/_helpers/rateLimit';` near other route helper imports.
  - [ ] Step 2: insertion point is between `const ctx = await buildServiceContext(req);` (currently route line ~52) and `const response = await handleUserMessage(...)` (route line ~54). The 429 early-return precedes the orchestrator call.
  - [ ] Step 3: `pnpm typecheck` passes. `pnpm --filter @chounting/web exec eslint src/app/api/agent/message/route.ts` returns 0 errors.

- [ ] **Task 6 — Regression test.**
  - [ ] Step 1: create `apps/web/tests/integration/apiAgentMessageRateLimit.test.ts` per §5d. Mirror CA-60's `vi.mock('@/services/middleware/serviceContext', ...)` shape and `__setMockFixtureQueue` import.
  - [ ] Step 2: run new test in isolation: `pnpm --filter @chounting/web exec vitest run tests/integration/apiAgentMessageRateLimit.test.ts`. Both it-blocks pass.
  - [ ] Step 3: run `pnpm db:reset:clean && pnpm db:seed:all && pnpm test` for full-suite. **Compare to Task 1 Step 4 baseline (the freshly-captured measurement, NOT against S31's reported numbers — S31 numbers are historical reference only).** Expected delta: +2 passed (the two new it-blocks). No new failures vs Task 1 Step 4 baseline. Halt and surface if any test that was passing at baseline now fails.

- [ ] **Task 7 — Friction-journal entry + closeout NOTE.**
  - [ ] Step 1: append §5e entry to `docs/07_governance/friction-journal.md` under the Phase 2 section. Date the entry today. Include the operator-set Anthropic spend-alert threshold from Task 2 Step 2.
  - [ ] Step 2: write a Path A carve-out closeout NOTE at the friction-journal tail (date-stamped, sibling-shape to the 2026-05-01 production-promotion entry). Document: what shipped, what stayed deferred (the three other agent endpoints + ~30 org-mutating routes + CORS audit + CSRF Origin checks), the soft-fail-open posture rationale, the Anthropic spend-alert level, and the V1 policy numbers (30/min, 200/hour) with the "tuning is Phase 2 work" disposition.

- [ ] **Task 8 — Push-readiness verification.**
  - [ ] Step 1: `pnpm typecheck && pnpm lint && pnpm test` final fresh-post-reset run. Confirm green-modulo-known-carry-forward.
  - [ ] Step 2: `git diff --stat` review. Expected files touched: `apps/web/package.json`, `pnpm-lock.yaml`, `apps/web/src/shared/env.ts`, `apps/web/src/services/errors/ServiceError.ts`, `apps/web/src/app/api/_helpers/serviceErrorToStatus.ts`, NEW `apps/web/src/app/api/_helpers/rateLimit.ts`, `apps/web/src/app/api/agent/message/route.ts`, NEW `apps/web/tests/integration/apiAgentMessageRateLimit.test.ts`, `docs/07_governance/friction-journal.md`, NEW `docs/09_briefs/post-mvp/path-a-rate-limit-agent-message-brief.md`. Halt and surface on unexpected files.
  - [ ] Step 3: stage but DO NOT commit. Operator review gate.
  - [ ] Step 4 (operator-driven): operator reviews diff; on approval, single bundled commit subject under 70 chars: `feat(security): rate-limit /api/agent/message (Path A carve-out)`. Push to `staging`.
  - [ ] Step 5 (operator-driven, post-merge to main): verify production deploy succeeds (the new env-var requirement at boot will fail-fast if Vercel-Production-env is missing UPSTASH_* vars — F1 mitigation in action). Hit POST /api/agent/message 31 times in quick succession with valid auth; confirm request 31 returns 429.

- [ ] **Task 9 — Session-end housekeeping.**
  - [ ] Step 1: `pnpm db:reset:clean` to discard test-run state.
  - [ ] Step 2: release session lock per `scripts/session-init.sh` closeout convention.

---

## 7. Exit criteria

| # | Criterion | Verification |
|---|---|---|
| 1 | `@upstash/ratelimit` and `@upstash/redis` appear in `apps/web/package.json` dependencies. | `cat apps/web/package.json \| grep upstash` returns 2 matches. |
| 2 | `env.ts` requires `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` at boot. | Remove either env var locally → `pnpm dev` exits with the F1-style fatal-startup-message naming the missing var. |
| 3 | `RATE_LIMITED` exists in `ServiceErrorCode` union and maps to 429 in `serviceErrorToStatus`. | `pnpm typecheck` passes; grep both files. |
| 4 | Helper `rateLimitAgentMessage` exists with documented soft-fail-open posture. | `cat apps/web/src/app/api/_helpers/rateLimit.ts` shows §5b shape and posture comment. |
| 5 | Route handler calls helper between `buildServiceContext` and `handleUserMessage`. | `cat apps/web/src/app/api/agent/message/route.ts` shows §5c insertion at expected location. |
| 6 | New integration test file exists with 2 passing it-blocks. | `pnpm --filter @chounting/web exec vitest run tests/integration/apiAgentMessageRateLimit.test.ts` returns 2 passed. |
| 7 | Full test suite shows +2 passed vs Task 1 Step 4 baseline; no regressions. | `pnpm test` post-reset comparison. |
| 8 | Friction-journal NOTE entry added with brief reference, posture rationale, V1 numbers, and Anthropic spend-alert level. | `tail -50 docs/07_governance/friction-journal.md`. |
| 9 | Operator confirmed: Upstash Redis integration installed in Vercel chounting project (Production AND Preview envs); Anthropic per-key spend alert set. | Operator confirmation in chat (Task 2 Step 4). |
| 10 | Single bundled commit on `staging` with subject under 70 chars; commits-on-main reachable post-merge. | `git log -1 --oneline` post-merge. |
| 11 | Production smoke test: 31st rapid-fire POST returns 429. | Operator-executed Task 8 Step 5. |

---

## 8. Halt conditions

Halt and surface to operator (do not advance) on any of:

- Anchor SHA mismatch at Task 1 Step 2.
- Substrate drift at Task 1 Step 3 (line numbers, signatures, or file existence differ from brief expectations).
- Operator has not confirmed Task 2 Step 1 (Vercel Upstash integration installed) or Task 2 Step 2 (Anthropic spend alert set).
- `pnpm typecheck` fails at any task step.
- `pnpm test` baseline-comparison at Task 6 Step 3 surfaces a regression on previously-passing tests.
- `git diff --stat` at Task 8 Step 2 shows unexpected files touched.
- Production smoke test at Task 8 Step 5 does NOT return 429 on the 31st request (suggests rate-limit not wired correctly OR Upstash creds missing in Production env — both are halt-blockers).

---

## 9. Open questions / pre-decisions

- **OQ 1 — Use shared `apiAgentMessage.test.ts` file vs new test file?** Default: NEW file (`apiAgentMessageRateLimit.test.ts`). Rationale: clean separation between happy-path orchestrator tests and rate-limit-policy tests; test-file naming-by-concern precedent (sibling: `apiAgentConfirmIdempotent` / `apiAgentConfirmNotFound` / `apiAgentConfirmStale` rather than one bundled `apiAgentConfirm.test.ts`). Default holds.
- **OQ 2 — Set `analytics: true` on the Ratelimit instances?** Default: false (analytics off). Rationale: V1 doesn't need Upstash analytics dashboard; structured pino logs at the helper layer give us the same visibility via existing observability stack. Phase 2 can flip if needed.
- **OQ 3 — Helper unit-tests against live Upstash?** Default: NO. Rationale: V1 integration test mocks the helper; helper logic is straightforward enough that an integration-against-live-Upstash unit test is high-cost-low-value. Phase 2 can add if Upstash behavior surprises.
- **OQ 4 — Retry-After header value source.** Default: derive from `result.reset` (millisecond timestamp returned by `@upstash/ratelimit`) → seconds. Rationale: gives the client an honest retry window; floor of 1 second to avoid 0-second responses on edge timing.
- **OQ 5 — Should the route emit a structured log on rate-limit miss in addition to the helper's log?** Default: NO. Rationale: the helper logs once with full context; double-logging would just add noise. The route's existing `trace_id` flow ensures the helper's log is correlatable with the request.
- **OQ 6 — Vercel Preview deploys need rate-limit env vars too?** Default: YES. Rationale: F1 motivates this — env-var divergence between environments was the root cause of the production-promotion failure. Preview deploys hitting the agent endpoint with rate-limit env vars missing would soft-fail-open per posture, but Preview CI runs against Preview env, so the env-validation startup check would fire-fast at Preview-build time and catch the misconfiguration earlier than at promotion.

---

**Brief author:** chat-side, 2026-05-01.
**Estimated execution time:** 3–4 hours single session.
**Estimated paid-API spend:** $0 (no orchestrator calls; mocked tests).
**Estimated infrastructure cost:** ~$0–$1/month Upstash Redis (free tier covers anticipated load indefinitely; sliding-window algorithm uses ~2 commands per `limit()` call).

---

**Meta-notes (post-execution-kickoff additions):**

- **Pre-execution amendment (operator, 2026-05-01):** Task 6 Step 3 baseline-comparison framing clarified — comparison is against the freshly-captured Task 1 Step 4 measurement, NOT against S31's reported numbers. S31 numbers are historical reference only. If the `crossOrgRlsIsolation` state-pollution carry-forward heals on fresh `db:reset:clean && db:seed:all` (which S31 finding category v item 5 anticipated), Task 1 Step 4's measurement is the new floor.
- **Session-naming convention (operator, 2026-05-01):** Post-MVP carve-out sessions use `path-{letter}-{thematic-slug}` rather than `S{N}-{slug}` because Post-MVP isn't a numbered build phase. N=1; codification candidate at N=2 if a second Post-MVP carve-out adopts the same shape.
- **Brief-as-docs-file decision (operator, 2026-05-01):** brief landed at `docs/09_briefs/post-mvp/path-a-rate-limit-agent-message-brief.md` (this file). Adds Task 0 to the implementation flow: write brief to docs path before Task 1 Step 1. The friction-journal NOTE template's filesystem-path reference resolves to a real file, and `docs/09_briefs/post-mvp/` becomes the seeded home directory for the larger Post-MVP cleanup phase.
