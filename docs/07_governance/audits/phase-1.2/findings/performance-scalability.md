# Performance & Scalability — Phase 1.2 Audit Findings

**Status:** Sparse baseline (Phase 1.2 local development only; no production load testing, no real concurrency).

**Audit scope:** HEAD = 32760e1, cumulative Phase 0 + 1.1 + 1.2 + Arc A (orientation phase only).

---

## Phase 1.2 Baseline Assessment

Performance findings at Phase 1.2 are **measurement-limited**: no production load, no multi-user concurrency, no sustained traffic. The agent context-window saturation incident (EC-2 Entry 12, 32+ turns, AGENT_STRUCTURED_RESPONSE_INVALID) and API cost savings from S22 caching are the only empirical datapoints. This assessment establishes baseline assumptions and flags what must be measured in Phase 1.3+ before rigorous scalability claims are possible.

### Anthropic API Cost Dynamics

**S22 caching enablement (856dcc7)** shipped prompt-caching on all agent flows. Measured benefit: ~32% per-call cost reduction within a single `handleUserMessage` flow (cache hit rate ~68% observed during S22 runs). This applies within-session only; cross-turn caching behavior is **deferred to Phase 2** per obligations.md (M8 cross-turn-caching-infrastructure).

**No production cost baseline yet.** S4 paid-API journal-entry posting (Session 4 live Claude runs) consumed ~0.025 tokens/call observed; S20/S22 agent runs showed 14–19s wall-time per tool call (SDK latency wall observed, not SDK-only latency). Cost model assumes Sonnet 3.5, but no multi-user, multi-day production cost projections exist.

### Conversation Context Window Growth (Deferred, Known-Concern 12)

**Known issue:** EC-2 Entry 12 (Phase E, CURRENT_STATE) produced AGENT_STRUCTURED_RESPONSE_INVALID after 32+ turns in the same `agent_sessions.conversation` without explicit truncation. Root cause hypothesis: context-window saturation (Sonnet ~200k token budget, conversation is unbounded JSONB).

**Current posture:** 
- `loadOrCreateSession.ts:194` loads `(raw.conversation as unknown[]) ?? []` with **no truncation or windowing**.
- `STRUCTURAL_MAX_RETRIES = 1` (per-turn retry budget) does not cap turn count.
- No test characterizes saturation behavior; EC-2 incident is the only datapoint.
- No TTL-based rotation or turn-count threshold triggers session rotation.

**Deferred fix:** Phase 2 obligations (M8) include session-rotation infrastructure and cross-turn caching. This audit does **not rediscover** concern 12; it is **referenced and flagged for Phase 2 activation**.

### Index Coverage & Query Performance

**Single-turn observation:** Agent tool calls execute in 14–19s wall-time (observed in S20/S22 SDK integration tests). Breakdown: time-to-first-token ~2–4s (SDK latency wall), tool dispatch ~3–5s, response streaming and parsing ~8–12s. No database query slow logs captured; agent tool dispatch path is traced informally only (Session 8 C6–C8 reviewed execution trees).

**Schema indexes:** 32 migrations define the schema, but index strategy is not documented. Hypothetical high-traffic queries (`journal_entries` by `(org_id, entry_date)`, `ai_actions` by `(session_id, created_at)`) should have covering indexes; verification deferred to Phase 1.3 with production query logs.

**RLS policy performance:** Row-Level Security (RLS) policies on all data tables enforce org-scoped access. No query-plan analysis of RLS filter cost; Phase 1.2 exercises RLS only locally (single user, single org). Production cross-org queries and multi-user contention unknown.

---

## What Must Change for Phase 1.3 Scalability Findings

1. **Production load baseline:** Multi-user concurrency test (e.g., 5–10 concurrent sessions, 32+ turns each) to measure:
   - Token consumption under saturation.
   - Database connection pooling behavior (disabled in Phase 1.2; needs Phase 1.3 config).
   - RLS policy filtering cost at scale.

2. **Context-window rotation policy:** Implement and measure session-rotation thresholds (turn count or token-budget-aware) to prevent saturation failure.

3. **Query profiling:** Enable Postgres slow-query logs and analyze agent tool dispatch paths. Identify missing indexes on high-traffic queries.

4. **Cost model refinement:** Establish production cost-per-operation baseline (journal entry post, agent query, etc.) to inform pricing and usage limits.

5. **Caching hit-rate measurement:** Track prompt-cache hit rates across multi-user, multi-day production traffic to validate S22 savings and inform cross-turn caching design (M8).

---

## Immediate Concerns Despite Low Exercise Level

**PERF-001: Context-window saturation risk (known-concern 12, hypothesis H-13)** — EC-2 Entry 12 failed at 32+ turns in same session. `agent_sessions.conversation` is unbounded; no rotation policy exists. Phase 2 M8 addresses this, but the risk window remains open through Phase 1.3. Recommend add a **temporary turn-count limit** (e.g., rotate at 50 turns) as a pre-Phase-2 circuit breaker.

**PERF-002: Cross-turn caching deferred (obligations M8)** — S22 within-turn cost savings (~32%) apply only to single `handleUserMessage` flows. Multi-turn sessions accumulate context without cache reuse across turns. Phase 1.3 production load will expose cumulative cost growth; no architectural mitigation in place until Phase 2.

**PERF-003: Agent tool dispatch wall-time baseline rough (S20/S22 observation)** — 14–19s observed per tool call is not decomposed into SDK latency, service-layer dispatch, database roundtrips, and Anthropic API call latency. No integration test measures end-to-end latency under load. Phase 1.3 flame-graph or structured timings needed.

**PERF-004: Index coverage unknown** — Schema has 32 migrations but no documented indexing strategy. Hypothetical agent queries on `journal_entries`, `ai_actions`, and junction tables may benefit from covering indexes. Deferred to Phase 1.3 query-plan analysis with slow-query logs.

---

## Performance-Relevant Phase 1.2 Decisions

- **Single agent per user:** Each user has at most one concurrent `agent_session`. Multi-turn conversation in one session, not parallel sessions. Simplifies concurrency model but increases risk of saturation within a session.
- **Unbounded conversation JSONB:** No schema-level limit on message array size. Contrast with audit_log append-only triggers: intentional, but creates asymmetry (ledger bounded by audit trail; agent conversation uncontrolled).
- **Vitest fileParallelism=false:** Test suite runs sequentially (integration tests exclusive locks on local DB). Correct for local dev, but Phase 1.3 CI must parallelize if test count grows.

---

## Token Budget & Scaling Assumptions

Anthropic SDK integration assumes Claude Sonnet 3.5 (200k token budget). No explicit checks enforce token limit per request. `STRUCTURAL_MAX_RETRIES = 1` provides per-turn retry budget for malformed responses, not token-overflow mitigation. Phase 2 design must reconcile token limit (200k hard cap) with session growth (M8, M9 Phase 2 obligations on extended-context flows).

---

## Self-Audit Bias Note

This baseline was constructed by the same Claude instance that measured S22 caching performance and participated in EC-2 Phase E incident triage. The assessment may inadvertently accept the current context-window behavior as inevitable rather than challenging whether 32+ turns in one session is an intentional product design.

