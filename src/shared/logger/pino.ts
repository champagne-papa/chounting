// src/shared/logger/pino.ts
// Structured logger with redact list configured at boot.
// Every log line includes trace_id, org_id, user_id when available.

import pino from 'pino';
import { env } from '@/shared/env';

export const logger = pino({
  level: env.LOG_LEVEL,
  base: {
    // Identifies which process emitted the log line.
    service: 'the-bridge',
    env: env.NODE_ENV,
  },
  // Redact list — applied to every log line.
  // Anything matching these paths is replaced with [REDACTED].
  redact: {
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
  },
  // Pretty-print in dev only.
  transport: env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
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
