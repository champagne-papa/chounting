// src/shared/logger/pino.ts
// Structured logger with redact list configured at boot.
// Every log line includes trace_id, org_id, user_id when available.

import pino from 'pino';
import { env } from '@/shared/env';

/**
 * Redact list — applied to every log line through the production
 * logger. Anything matching these paths is replaced with the
 * censor value.
 *
 * Exported so the redaction regression test
 * (tests/unit/pinoRedaction.test.ts, CA-83) can construct a
 * matching logger without duplicating the path list. Adding a
 * new redact path here automatically gains test coverage.
 */
export const REDACT_CONFIG = {
  paths: [
    // Auth tokens and headers
    'headers.authorization',
    'headers.cookie',
    'req.headers.authorization',
    'req.headers.cookie',
    // Generic secrets
    '*.password',
    '*.api_key',
    '*.apiKey',
    '*.secret',
    '*.token',
    // Specific env-var leaks
    'env.SUPABASE_SERVICE_ROLE_KEY',
    'env.ANTHROPIC_API_KEY',
    // Financial / PII
    '*.bank_account_number',
    '*.account_number_last_four',
    '*.tax_id',
    '*.sin',
    '*.card_number',
  ],
  censor: '[REDACTED]',
};

export const logger = pino({
  level: env.LOG_LEVEL,
  base: {
    // Identifies which process emitted the log line.
    service: 'the-bridge',
    env: env.NODE_ENV,
  },
  redact: REDACT_CONFIG,
  // Pretty-printing disabled — pino-pretty's worker thread
  // doesn't bundle under Next.js 15's server bundler (missing
  // thread-stream/lib/worker.js in .next/server/vendor-chunks).
  // Default behavior: raw JSON on stdout. See fix commit
  // for full rationale.
});

// Helper: returns a child logger with trace_id / org_id / user_id bound.
// Every service function takes a ServiceContext and creates one of these
// at the start of its execution. See Section 11.
export function loggerWith(ctx: {
  trace_id: string;
  org_id?: string;
  user_id?: string;
}) {
  return logger.child(ctx);
}
