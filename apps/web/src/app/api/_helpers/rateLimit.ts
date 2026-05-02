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
        {
          action: 'agent.message.rate_limited',
          reason: 'burst',
          limit: 30,
          window_seconds: 60,
          remaining: 0,
          retry_after_seconds: retry,
        },
        'agent message rate-limited (burst)',
      );
      return { success: false, retry_after_seconds: retry, reason: 'burst' };
    }
    const hour = await hourLimit.limit(identifier);
    if (!hour.success) {
      const retry = Math.max(1, Math.ceil((hour.reset - Date.now()) / 1000));
      log.warn(
        {
          action: 'agent.message.rate_limited',
          reason: 'hour',
          limit: 200,
          window_seconds: 3600,
          remaining: 0,
          retry_after_seconds: retry,
        },
        'agent message rate-limited (hour ceiling)',
      );
      return { success: false, retry_after_seconds: retry, reason: 'hour' };
    }
    return { success: true };
  } catch (err) {
    log.error(
      {
        action: 'agent.message.rate_limit_check_failed',
        err: err instanceof Error ? err.message : String(err),
      },
      'rate-limit check failed; soft-failing open per documented posture',
    );
    return { success: true };
  }
}
