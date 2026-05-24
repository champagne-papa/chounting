// src/services/middleware/withInvariants.ts
// INV-AUTH-001 (primary): every service call (read or mutation) is authorized before the function body runs.
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

import type {
  ServiceContext,
  SystemActorServiceContext,
} from './serviceContext';
import { actingUserId, isSystemActorContext } from './serviceContext';
import { ServiceError } from '@/services/errors/ServiceError';
import { loggerWith } from '@/shared/logger/pino';
import { canUserPerformAction, type ActionName } from '@/services/auth/canUserPerformAction';

type ServiceFn<I, O> = (input: I, ctx: ServiceContext) => Promise<O>;

// The wrapper accepts either caller shape. Human callers (ServiceContext)
// run the full four-invariant pre-flight. System actors
// (SystemActorServiceContext) bypass the identity-coupled invariants per
// ADR-0007 Q78 Option A and are adapted to a verified service-account
// ServiceContext (Path X) before the wrapped function runs.
type WrappedServiceFn<I, O> = (
  input: I,
  ctx: ServiceContext | SystemActorServiceContext,
) => Promise<O>;

interface WithInvariantsOptions {
  action?: ActionName;
}

// Cosmetic email on the adapted service-account context (matches the seeded
// pipeline service account in seed-auth-users.ts). Nothing keys on it; the
// service-account uuid (caller.user_id) is the attribution identity.
const SYSTEM_ACTOR_ADAPTED_EMAIL = 'pipeline@thebridge.local';

export function withInvariants<I, O>(
  fn: ServiceFn<I, O>,
  opts?: WithInvariantsOptions,
): WrappedServiceFn<I, O> {
  return async (input, ctx) => {
    const log = loggerWith({
      trace_id: ctx?.trace_id,
      user_id: ctx?.caller?.user_id ?? undefined,
    });

    // System-actor branch (ADR-0007 Q78 Option A + Path X). A trusted system
    // actor is authenticated at the boundary that constructs its
    // SystemActorServiceContext (route / job-queue / orchestrator), not via
    // role grants — so it BYPASSES the identity-coupled invariants (Inv 1
    // user_id presence, Inv 2 verified, Inv 4 role). It then commits AS the
    // seeded service account: we adapt to a verified ServiceContext whose
    // user_id is the service-account uuid, so created_by NOT NULL FKs and
    // audit attribution resolve to a real, joinable identity. The trace_id
    // and org-consistency (vs ctx.org_id) checks still run.
    if (isSystemActorContext(ctx)) {
      if (!ctx.trace_id) {
        throw new ServiceError('MISSING_TRACE_ID', 'ServiceContext.trace_id is required');
      }
      const claimedOrgId = (input as Record<string, unknown>)?.org_id;
      if (
        typeof claimedOrgId === 'string' &&
        claimedOrgId &&
        claimedOrgId !== ctx.org_id
      ) {
        throw new ServiceError(
          'ORG_ACCESS_DENIED',
          `System actor org mismatch: ctx.org_id=${ctx.org_id} vs input.org_id=${claimedOrgId}`,
        );
      }
      const actorId = actingUserId(ctx);
      if (actorId === null) {
        throw new ServiceError(
          'MISSING_CALLER',
          `System actor '${ctx.caller.system_actor}' carries no system_user_id; cannot attribute a ledger write (ADR-0007 Q78 Path X)`,
        );
      }
      const adaptedCtx: ServiceContext = {
        trace_id: ctx.trace_id,
        caller: {
          user_id: actorId,
          email: SYSTEM_ACTOR_ADAPTED_EMAIL,
          verified: true,
          org_ids: [ctx.org_id],
        },
      };
      log.debug(
        { fn: fn.name, system_actor: ctx.caller.system_actor },
        'withInvariants: system-actor bypass + service-account adapt',
      );
      try {
        return await fn(input, adaptedCtx);
      } catch (err) {
        log.error({ err, fn: fn.name }, 'Service function threw');
        throw err;
      }
    }

    // ---- Human caller path (existing four invariants, unchanged) ----
    // Invariant 1: ServiceContext shape
    if (!ctx) {
      throw new ServiceError('MISSING_CONTEXT', 'ServiceContext is required');
    }
    if (!ctx.trace_id) {
      throw new ServiceError('MISSING_TRACE_ID', 'ServiceContext.trace_id is required');
    }
    if (!ctx.caller || !ctx.caller.user_id) {
      throw new ServiceError('MISSING_CALLER', 'ServiceContext.caller.user_id is required');
    }

    // Invariant 2: caller identity is verified, not claimed.
    // ctx.caller.verified must be true — buildServiceContext sets this
    // after validating the Supabase Auth JWT.
    if (!ctx.caller.verified) {
      throw new ServiceError('UNVERIFIED_CALLER', 'Caller identity has not been verified');
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
      throw new ServiceError(
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
        throw new ServiceError('PERMISSION_DENIED', authResult.reason);
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
