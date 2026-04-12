// src/services/middleware/serviceContext.ts
// The ServiceContext is the envelope every service function receives
// alongside its typed input. It carries:
//   - trace_id (REQUIRED) — propagated from the API route or orchestrator
//   - caller (REQUIRED) — verified user identity + memberships
//   - locale (optional) — for any service that returns user-facing strings
//
// This type matches Bible Section 1c (request lifecycle) and Section 15e
// (service middleware enforcement).

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
    .eq('user_id', user.id);

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
