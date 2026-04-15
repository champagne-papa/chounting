// src/services/middleware/withInvariants.ts
// INV-AUTH-001 (primary): every mutating service call is authorized before the function body runs.
// The universal service wrapper. Every service function in src/services/
// is invoked through this. Performs pre-flight checks before the function
// body runs:
//   - ServiceContext is well-formed
//   - trace_id is present
//   - caller identity is verified (not just claimed)
//   - org_id (if present in input) is consistent with caller's memberships
//
// Bible Section 15e ("Layer 2 — Service middleware") and the enforcement
// sentence in the Two Laws restatement reference this file by name.
//
// IMPORTANT: this is enforcement, not convention. Every PR that introduces
// a service function MUST wire it through withInvariants. Code review
// rejects PRs that bypass this wrapper.

import type { ServiceContext } from './serviceContext';
import { InvariantViolationError } from './errors';
import { loggerWith } from '@/shared/logger/pino';
import { canUserPerformAction, type ActionName } from '@/services/auth/canUserPerformAction';

type ServiceFn<I, O> = (input: I, ctx: ServiceContext) => Promise<O>;

interface WithInvariantsOptions {
  action?: ActionName;
}

export function withInvariants<I, O>(
  fn: ServiceFn<I, O>,
  opts?: WithInvariantsOptions,
): ServiceFn<I, O> {
  return async (input, ctx) => {
    const log = loggerWith({ trace_id: ctx?.trace_id, user_id: ctx?.caller?.user_id });

    // Invariant 1: ServiceContext shape
    if (!ctx) {
      throw new InvariantViolationError('MISSING_CONTEXT', 'ServiceContext is required');
    }
    if (!ctx.trace_id) {
      throw new InvariantViolationError('MISSING_TRACE_ID', 'ServiceContext.trace_id is required');
    }
    if (!ctx.caller || !ctx.caller.user_id) {
      throw new InvariantViolationError('MISSING_CALLER', 'ServiceContext.caller.user_id is required');
    }

    // Invariant 2: caller identity is verified, not claimed.
    // ctx.caller.verified must be true — buildServiceContext sets this
    // after validating the Supabase Auth JWT.
    if (!ctx.caller.verified) {
      throw new InvariantViolationError('UNVERIFIED_CALLER', 'Caller identity has not been verified');
    }

    // Invariant 3: org_id consistency.
    // If the input claims an org_id, it must match a membership for the caller.
    // We check this here as defense-in-depth — RLS catches it at the DB level
    // too, but failing fast with a clear error is better than RLS silently
    // returning empty results.
    const claimedOrgId = (input as Record<string, unknown>)?.org_id;
    if (
      typeof claimedOrgId === 'string' &&
      claimedOrgId &&
      ctx.caller.org_ids &&
      !ctx.caller.org_ids.includes(claimedOrgId)
    ) {
      throw new InvariantViolationError(
        'ORG_ACCESS_DENIED',
        `Caller does not have access to org_id=${claimedOrgId}`,
      );
    }

    // Invariant 4: role-based authorization.
    // If an action is specified and the input carries an org_id,
    // check that the caller's role permits the action.
    if (opts?.action && typeof claimedOrgId === 'string' && claimedOrgId) {
      const authResult = await canUserPerformAction(ctx, opts.action, claimedOrgId);
      if (!authResult.permitted) {
        throw new InvariantViolationError('PERMISSION_DENIED', authResult.reason);
      }
    }

    log.debug({ fn: fn.name }, 'withInvariants: pre-flight passed');

    // Execute the wrapped function
    try {
      const result = await fn(input, ctx);
      return result;
    } catch (err) {
      log.error({ err, fn: fn.name }, 'Service function threw');
      throw err;
    }
  };
}
