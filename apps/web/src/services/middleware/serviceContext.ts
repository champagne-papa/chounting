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

export interface SystemActorCaller {
  user_id: null;
  system_actor: string;
}

export interface SystemActorServiceContext {
  trace_id: string;
  caller: SystemActorCaller;
  org_id: string;
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
