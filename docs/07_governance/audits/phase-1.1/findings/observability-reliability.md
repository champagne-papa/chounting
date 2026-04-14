# Observability & Reliability — Findings Log

Scanner: Observability & Reliability
Phase: End of Phase 1.1
Date: 2026-04-13
Category status: Sparse — no metrics, distributed tracing, alerting, or error reporting service at this phase.

## Baseline

Pino structured logging is configured in `src/shared/logger/pino.ts` with a comprehensive redaction list covering auth tokens, headers, secrets, and financial PII (bank account numbers, SINs, card numbers). The `loggerWith()` helper creates child loggers bound to `trace_id`, `org_id`, and `user_id` — used consistently across service functions. Zero `console.log/error/warn` calls exist in `src/` (verified by grep). `trace_id` is generated in `buildServiceContext` (`serviceContext.ts:63`) and propagated through `ServiceContext` to every service call and the audit_log. The health endpoint (`/api/health`) returns a static `{ status: "ok" }` without verifying database connectivity. In development, pino uses `pino-pretty` for colorized output; in production it would emit raw JSON.

## Findings

### OBSERVE-001: Health endpoint does not verify database connectivity

- **Severity:** Low
- **Description:** `src/app/api/health/route.ts` returns `{ status: "ok" }` unconditionally. It does not query the database, check Supabase availability, or verify that the service-role key is valid. A monitoring system polling this endpoint would report "healthy" even if the database is unreachable.
- **Evidence:**
  - `src/app/api/health/route.ts:6-8` — static response, no dependency check
- **Consequence:** No impact in Phase 1.1 (local dev, no monitoring). When Phase 1.3 deploys to a hosted environment with health-check-based routing (e.g., Vercel health checks, load balancer probes), a static health endpoint would mask database outages. A simple `adminClient().from('organizations').select('org_id').limit(1)` query would verify the full stack.
- **Cross-references:**
  - Infrastructure & DevOps — health checking becomes relevant at deployment

## Future Audit Triggers

- When production deployment introduces a monitoring target (Vercel, Datadog, Sentry), this category should verify: structured log ingestion, error reporting integration, alert thresholds.
- When agent-driven mutations (Phase 1.2) add a second mutation source, trace_id correlation across manual and agent paths should be verified end-to-end.
- When SLOs are defined for the accounting platform (e.g., "journal entry post completes in < 2 seconds"), performance monitoring and error budgets become relevant.
- Phase 1.2 obligations list a "Pino redaction verification script" (`scripts/verify-pino-redaction.ts`) — when implemented, it should be included in CI.

## Category Summary

The observability foundation is stronger than typical for Phase 1.1: structured logging with pino, comprehensive PII redaction, trace_id propagation through ServiceContext, no stray console.log calls. The single gap is the static health endpoint, which is low-severity until deployment. The audit_log serves as a reliable observability proxy for mutations — every journal entry post and reversal is recorded with trace_id, user_id, org_id, and action type.
