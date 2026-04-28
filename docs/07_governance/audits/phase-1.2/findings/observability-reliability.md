# Observability & Reliability — Findings Log

**Scanner:** Observability & Reliability (Phase 1.2 Category B re-split)  
**Phase:** Phase 1.2 (concurrent with hypotheses generation)  
**Date:** 2026-04-27  
**Audit Scope:** Full codebase (Phase 0 + Phase 1.1 + Phase 1.2 at HEAD = 32760e1)  
**Category Status:** Sparse (Phase 1.1) → Split (Phase 1.2) due to agent surface expansion

---

## Category Evolution Note

This category was **collapsed into Infrastructure & DevOps** during Phase 1.1 audit planning because the project had minimal observability infrastructure (no metrics, no tracing, no alerting). Phase 1.2 added a significant observability surface through the agent orchestrator path: structured logging of usage tokens, trace_id propagation across service boundaries, and audit-trail emission patterns. The Phase 1.2 orientation decision split this category back into a full scan to investigate these new surfaces.

---

## Baseline

Observability infrastructure at Phase 1.2 includes:
- **Structured logging:** Pino logger with redaction config for secrets (tokens, API keys, financial PII like tax_id, bank_account_number); configured at `/src/shared/logger/pino.ts`
- **Trace_id propagation:** Generated at request entry in `buildServiceContext`, bound to child loggers via `loggerWith({trace_id, org_id, user_id})` at every service invocation
- **Audit trail:** `recordMutation()` writes synchronously to append-only `audit_log` table with org_id, action, entity_type, before_state, and trace_id on every data mutation
- **Error classification:** Agent path classifies Anthropic SDK errors (401/403/429/5xx/network) and maps to ServiceError with appropriate retry budgets per `callClaude.ts`
- **Usage logging:** Agent orchestrator logs usage tokens (input, output, cache_read, cache_creation) at `callClaude` return per C6 telemetry pattern
- **Health endpoint:** GET `/api/health` returns `{ status: 'ok' }` (static response)

No metrics, no alerting, no distributed tracing, no rate-limit dashboards, no production health checks beyond endpoint existence.

---

## Findings

### OBSERVE-001: Audit-emit failures swallowed with pino-only logging, no alerting surface

**Severity:** Medium  
**Category mapping:** H-08 (Audit-emit failures swallowed in agent paths)  
**Status:** Confirmed

**Description:**

Four agent audit-emit call sites wrap `recordMutation()` in try/catch blocks and swallow errors on failure:

1. `loadOrCreateSession.ts:152–179` — `agent.session_created` and `agent.session_org_switched` emits wrapped in try/catch; on failure, logs `log.error` with "tx-atomicity gap per Clarification F" rationale
2. `orchestrator/index.ts:187–205` — `agent.message_processed` emit wrapped in try/catch with identical swallow pattern
3. `orchestrator/index.ts:1272–1295` — `agent.tool_executed` emit wrapped in try/catch (within the finally block of `executeTool`)

**Design rationale:** Per "Clarification F" comments in the code, audit emits are wrapped because they occur outside of service transactions. If `recordMutation` throws, unwrapping the error would poison the user-facing request (a HTTP 500 response) even though the core mutation may have succeeded. The trade-off: swallowed errors mean the agent can perform data mutations without producing forensic audit breadcrumbs.

**Evidence:**
- `/src/agent/orchestrator/index.ts:199–204`, `/src/agent/orchestrator/loadOrCreateSession.ts:169–179`, `/src/agent/orchestrator/index.ts:1289–1293` — three try/catch swallow sites
- No structured error metric, incident_type marker, or alerting rule exists to surface swallowed audit-emit failures
- Pino logger emits at level `error` only; no distinct counter or high-cardinality metric on swallowed events
- No test validates the swallow behavior or asserts observability on repeated failures

**Consequence:**

If the `audit_log` INSERT fails (e.g., due to constraint violation, RLS policy, or DB unavailability), the agent continues and the user sees a successful response, but:
- The session-level breadcrumb (who invoked the agent, when, under which session) is lost
- Forensic reconstruction of which agent session posted a given journal entry requires the `agent.session_created` row; without it, cross-referencing is incomplete
- Repeated failures go undetected unless an operator manually queries `audit_log` row counts vs `agent_sessions` or reviews logs, which is not operationalized

Phase 2 obligations move this to the events table with transaction wrapping; until then, swallowed errors are a silent data-quality gap.

---

### OBSERVE-002: Pino redaction excludes email, phone, and display_name despite PII in service logs

**Severity:** Medium  
**Category mapping:** H-10 (PII in audit_log JSONB and pino logs)  
**Status:** Confirmed

**Description:**

`REDACT_CONFIG.paths` in `/src/shared/logger/pino.ts` covers auth tokens, secrets, and financial PII (tax_id, sin, bank_account_number, card_number) but **does not list** email, phone, first_name, last_name, or display_name.

Meanwhile, `/src/services/org/invitationService.ts:92` emits a plaintext log:

```
log.info({ org_id, email, invitation_id }, 'User invited')
```

**Evidence:**
- `/src/shared/logger/pino.ts:18–42` — REDACT_CONFIG paths; email/phone/names are absent
- `/src/services/org/invitationService.ts:92` — invitation email logged in plaintext
- No systematic audit of all service-layer `log.info`/`log.error` calls to identify PII emission; grep shows at least one case

**Consequence:**

Invitation emails (personally identifiable) land in the application's pino logger output. If the log stream is consumed by a third-party analytics platform, or archived to cold storage without PII classification, the data retention posture may violate PIPEDA expectations. This is an operational concern rather than a code defect — the codebase correctly uses structured logging — but the gap is unintentional and unmonitored.

The audit_log PII issue (concern 8b) is orthogonal and already identified in known-concerns.md.

---

### OBSERVE-003: Usage token logging (cache_read/cache_creation) lacks validation for SDK shape evolution

**Severity:** Low  
**Category mapping:** H-14 (SDK shape drift — cache_read/cache_creation tokens)  
**Status:** Confirmed (shape-aware logging, no compatibility test)

**Description:**

`callClaude.ts:272–284` logs usage tokens with optional-chaining fallback:

```typescript
usage: {
  input_tokens: resp.usage.input_tokens,
  output_tokens: resp.usage.output_tokens,
  cache_read_input_tokens: resp.usage.cache_read_input_tokens ?? null,
  cache_creation_input_tokens: resp.usage.cache_creation_input_tokens ?? null,
}
```

The `?? null` pattern handles shape drift gracefully: if the Anthropic SDK changes and omits these fields, the log emits `null` rather than crashing. However, there is **no test that validates this fallback behavior** under a mock response with missing cache fields.

**Evidence:**
- `/src/agent/orchestrator/callClaude.ts:278–280` — optional-chaining fallback
- `tests/integration/callClaudeErrorClassification.test.ts` — covers 401/429/5xx but does not test cache-token field absence
- S22 caching enablement (commit 856dcc7) added these fields; no regression test for field-optional scenarios

**Consequence:**

If a future SDK version drops or renames cache token fields, the logging silently emits `null` and the signal is lost without alerting. The code is defensive, but the test suite does not exercise this defense, so the guarantee is not mechanical — it relies on code inspection.

This is lower severity than other findings because the fallback is present and logging still succeeds, unlike the audit-emit case above.

---

### OBSERVE-004: Conversation history unbounded; no saturation observability or rotation trigger

**Severity:** Medium  
**Category mapping:** H-13 (Context-window saturation at high turn counts)  
**Status:** Confirmed (no rotation, no saturation test)

**Description:**

`loadOrCreateSession.ts:194` loads conversation history with no windowing or truncation:

```typescript
conversation: (raw.conversation as unknown[]) ?? []
```

The field is unbounded JSONB. `handleUserMessage` appends every user turn and assistant response indefinitely across a session's lifetime. Known-concerns.md §12 documents EC-2 Entry 12's AGENT_STRUCTURED_RESPONSE_INVALID failure after 32+ turns, attributed to context saturation.

**Current state:**
- No TTL-based session rotation (sessions have a 30-day idle TTL, but not a turn-count threshold)
- No check on conversation length before calling Claude
- No test exercises the saturation curve; the 32-turn incident is a production datapoint, not a characterized test case
- `STRUCTURAL_MAX_RETRIES = 1` caps per-turn validation retries but not conversation depth

**Evidence:**
- `/src/agent/orchestrator/loadOrCreateSession.ts:194` — unbounded load
- `/src/agent/orchestrator/index.ts:244` — full history appended: `...(session.conversation as Anthropic.Messages.MessageParam[])`
- No test named `agentContextSaturation.test.ts` or similar; search for "saturation" / "32.*turn" yields zero test results
- known-concerns.md §12 documents the failure mode without a regression test

**Consequence:**

Sessions may accumulate context cost without bound. The C6 cost analysis in Phase 1.2 did not surface a projected saturation point, but the EC-2 datapoint suggests it is reachable within a session. Phase 2 obligations may include conversation pruning; until then, operators have no observability on which sessions are saturated and should be rotated.

---

### OBSERVE-005: Health endpoint returns static 200 without dependency connectivity checks

**Severity:** Low  
**Category mapping:** Sparse category — health checking baseline

**Status:** Confirmed

**Description:**

GET `/api/health` (defined in `/src/app/api/health/route.ts`) returns a static `{ status: 'ok' }` response with no verification of downstream dependencies (database, Anthropic API, Supabase Auth).

```typescript
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
```

**Consequence:**

Kubernetes or container orchestration health checks cannot distinguish a live but unhealthy deployment (e.g., database connectivity down) from a healthy one. This is appropriate for Phase 1 (pre-production, single-instance deployments) but would fail operational expectations in a multi-region setup.

This is low severity and expected at this phase.

---

### OBSERVE-006: Trace_id propagation complete to service layer; audit_log capture verified

**Severity:** N/A (positive finding)  
**Category mapping:** Trace_id propagation completeness

**Status:** Verified

**Description:**

Trace_id generation and propagation across the stack is complete and tested:

- Generated at request entry in `buildServiceContext.ts:64` as `crypto.randomUUID()`
- Bound to child loggers at orchestrator entry via `loggerWith({ trace_id, org_id, user_id })` (`orchestrator/index.ts:134`)
- Threaded through service calls via `ServiceContext.trace_id`
- Written to `audit_log.trace_id` on every mutation via `recordMutation()` (`recordMutation.ts:65`)
- Written to `ai_actions.trace_id` on dry-run ledger calls (`orchestrator/index.ts:1143`)
- Propagated in AgentResponse return value (`orchestrator/index.ts:915, 945, 1043`)

**Test coverage:**
- `agentTracePropagation.test.ts` (CA-47) verifies trace_id flows from ctx → AgentResponse and → ai_actions dry-run rows

**Consequence:**

Request correlation is mechanically enforced. No log emission escapes the trace_id binding. No AI action or mutation lacks the connection to the originating request. This is a well-implemented cross-cutting concern.

---

### OBSERVE-007: Error classification surface complete for Anthropic SDK errors; retry budgets documented

**Severity:** N/A (positive finding)  
**Category mapping:** Error handling resilience

**Status:** Verified

**Description:**

`callClaude.ts` implements comprehensive error classification with appropriate retry budgets:

- **401/403** (auth/permission) → AGENT_UNAVAILABLE, no retry (terminal)
- **429** (rate limit) → retry with exponential backoff: 1s, 2s, 4s (max 3 attempts)
- **5xx** (server error) → retry with exponential backoff: 1s, 2s (max 2 attempts)
- **Network timeout** → retry with linear backoff: 2s, 2s (max 2 attempts)
- **Malformed response** (empty content or missing stop_reason) → AGENT_TOOL_VALIDATION_FAILED (feeds structural retry)

**Test coverage:**
- `callClaudeErrorClassification.test.ts` (CA-55 through CA-59) exhaustively covers each class

**Consequence:**

Transient failures are recoverable; permanent failures are detected early. Retry budgets prevent infinite loops. The orchestrator's Q13 validation retry (max 2) and structural retry (max 1) layer on top of callClaude's retry, creating a two-level retry stack appropriate for the failure modes.

---

## Category Summary

This category was sparse at Phase 1.1 (no metrics, tracing, alerting) and remains sparse at Phase 1.2 in terms of operational observability infrastructure. However, the agent path adds three new observable surfaces: **audit-emit reliability, usage token logging, and context saturation**. Two findings are substantive (OBSERVE-001 audit-emit swallow, OBSERVE-002 email PII in logs), one is low-severity defensive coding (OBSERVE-003 cache-token shape handling), and one is expected for Phase 1 (OBSERVE-005 health endpoint). Trace_id propagation and error classification are well-implemented (positive findings).

**Future audit triggers:**
- When production traffic begins and swallowed audit-emit failures occur: implement alerting on `log.error` patterns matching "agent audit write failed"
- When conversation pruning or session rotation is implemented (Phase 2 obligations): measure saturation curves and validate rotation triggers
- When metrics infrastructure is deployed: migrate audit-emit resilience from pino-only to high-cardinality error counters
- When audit_log design is settled (before_state redaction vs access gating): revisit email/PII emission across all service log sites

---

## Cross-Reference to Hypotheses

- **H-08** (audit-emit swallow) — OBSERVE-001
- **H-10** (PII in audit_log and logs) — OBSERVE-002 (pino surface only; audit_log PII captured in known-concerns.md §8b and §10)
- **H-13** (context saturation) — OBSERVE-004
- **H-14** (SDK shape drift) — OBSERVE-003
- **H-17 / H-18** (test coverage gaps) — OBSERVE-001, OBSERVE-004 (lack of regression tests)

---

## Audit Integrity Note

This scanner is the observability specialist performing a read-only code scan. The finding on audit-emit swallow (OBSERVE-001) confirms what the code comments already state: it is a known trade-off documented as "Clarification F." The finding is not a surprise but rather a formal verification that the design choice exists and is unmonitored. PII in logs (OBSERVE-002) was expected per known-concerns.md but is confirmed as a real surface, not theoretical.
