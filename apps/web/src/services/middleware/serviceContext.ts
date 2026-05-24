// src/services/middleware/serviceContext.ts
// The ServiceContext is the envelope every service function receives
// alongside its typed input. It carries:
//   - trace_id (REQUIRED) — propagated from the API route or orchestrator
//   - caller (REQUIRED) — verified user identity + memberships
//   - locale (optional) — for any service that returns user-facing strings
//
// This type matches Bible Section 1c (request lifecycle) and Section 15e
// (service middleware enforcement).
//
// Phase 6 chunk 6.3a addition: SystemActorServiceContext sister type for
// webhook-invoked services that bypass user-session withInvariants flow
// (Sub-Q6 Artifact 3 + β-3 Approach B amendment). ServiceContext shape
// unchanged; 111 existing consumer sites untouched. handleForwardedMailbox
// (and future cron / webhook / scheduled-task system-actor surfaces)
// accepts SystemActorServiceContext explicitly. recordMutation widens its
// accepted ctx shape to a structural union accepting both.

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/shared/env';
import { ServiceError } from '@/services/errors/ServiceError';

export interface VerifiedCaller {
  user_id: string;
  email: string;
  verified: true;        // set ONLY by buildServiceContext after JWT validation
  org_ids: string[];     // memberships, used by withInvariants Invariant 3
}

export interface ServiceContext {
  trace_id: string;       // REQUIRED — UUID generated at the request entry point
  caller: VerifiedCaller; // REQUIRED — never trust claimed identity
  locale?: 'en' | 'fr-CA' | 'zh-Hant';
}

// =====================================================================
// SystemActorServiceContext — system-actor sister type (chunk 6.3a)
//
// Used by webhook route handlers and other system-actor surfaces (cron,
// scheduled tasks) that bypass the user-session withInvariants flow per
// Sub-Q6 Artifact 3. Constructed directly at the route-handler entry
// point after caller authentication (e.g., HMAC verify) and org
// resolution (e.g., resolveOrgFromMailboxHash).
//
// user_id is null at runtime; system_actor names the invocation source
// (e.g., 'postmark_inbound_webhook'). recordMutation handles user_id=null
// for audit_log rows per migration 113 (audit_log.user_id nullable).
//
// org_id is REQUIRED at this shape — system-actor invocation derives
// org from the invocation context (MailboxHash for Postmark) rather than
// from caller memberships. Pre-resolution errors (HMAC fail, malformed
// payload, invalid_recipient) emit audits directly at the route handler
// via recordMutation with a route-handler-grade context shape (user_id
// null, org_id null) — those bypass SystemActorServiceContext entirely.
// =====================================================================

// SYSTEM_ACTOR_USER_ID — the seeded service-account auth.users row that
// system actors attribute ledger writes to (created_by + audit user_id)
// per ADR-0007 Q78 Path X. System actors bypass authorization at
// withInvariants (caller.user_id stays null for the auth discriminant) but
// commit AS this service account, so created_by NOT NULL FKs (e.g.
// bills.created_by -> auth.users) are satisfied and audit rows carry a
// real, joinable identity rather than null. Seeded in
// scripts/seed-auth-users.ts + src/db/seed/dev.sql — those literals MUST
// match this constant.
export const SYSTEM_ACTOR_USER_ID = '00000000-0000-0000-0000-0000000000a1';

export interface SystemActorCaller {
  user_id: null;
  system_actor: string;
  // system_user_id — the service-account auth.users uuid this system actor
  // commits as (created_by + audit attribution per ADR-0007 Q78 Path X).
  // Optional: set by system actors that write created_by-bearing ledger
  // rows (the pipeline orchestrator); omitted by actors that never do
  // (the inbound-mailbox webhook).
  system_user_id?: string;
}

export interface SystemActorServiceContext {
  trace_id: string;
  caller: SystemActorCaller;
  org_id: string;
}

/**
 * Resolves the auth.users id a write should be attributed to (created_by,
 * audit user_id) for either caller shape. Human callers resolve to
 * caller.user_id; system actors resolve to caller.system_user_id (the
 * service account per ADR-0007 Q78 Path X), or null when the actor carries
 * no service-account identity (e.g. the mailbox webhook, which writes no
 * created_by-bearing ledger rows).
 */
export function actingUserId(
  ctx: ServiceContext | SystemActorServiceContext,
): string | null {
  if (ctx.caller.user_id !== null) return ctx.caller.user_id;
  return ctx.caller.system_user_id ?? null;
}

/**
 * Type guard: is this a system-actor context? Discriminates the
 * ServiceContext | SystemActorServiceContext union by caller.user_id
 * (null only for system actors). Narrows to SystemActorServiceContext so
 * callers can read ctx.org_id + caller.system_user_id.
 */
export function isSystemActorContext(
  ctx: ServiceContext | SystemActorServiceContext,
): ctx is SystemActorServiceContext {
  return ctx.caller.user_id === null;
}

/**
 * Builds a ServiceContext for an incoming Next.js API route request.
 * Validates the Supabase Auth JWT, fetches the caller's memberships,
 * generates a trace_id, and returns a ready-to-use ServiceContext.
 *
 * THIS is the only function in the codebase that creates a verified caller.
 * Tests use a separate helper that bypasses JWT validation but otherwise
 * returns the same shape.
 */
export async function buildServiceContext(_req: Request): Promise<ServiceContext> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}, // no-op for API routes
      },
    },
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new ServiceError('UNAUTHENTICATED', 'No valid session');
  }

  // Fetch memberships for this user (used by withInvariants Invariant 3)
  const { data: memberships } = await supabase
    .from('memberships')
    .select('org_id')
    .eq('user_id', user.id)
    .eq('status', 'active');

  const trace_id = crypto.randomUUID();

  return {
    trace_id,
    caller: {
      user_id: user.id,
      email: user.email!,
      verified: true,
      org_ids: (memberships ?? []).map((m: { org_id: string }) => m.org_id),
    },
    locale: 'en', // populated from URL in Phase 1.2
  };
}
