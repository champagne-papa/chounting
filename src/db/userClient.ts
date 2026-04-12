// src/db/userClient.ts
// User-scoped Supabase client that respects RLS.
// Server-only — uses @supabase/ssr for cookie-based auth in
// server components and API routes.

import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/shared/env';

/**
 * Creates an RLS-respecting Supabase client bound to the current user's
 * session cookie. Use this for all user-facing queries where RLS must apply.
 *
 * @param cookieStore - The cookie store from `await cookies()` in Next.js
 *   server components or API routes.
 */
export function createUserClient(
  cookieStore: {
    getAll: () => { name: string; value: string }[];
    set: (name: string, value: string, options?: Record<string, unknown>) => void;
  },
): SupabaseClient {
  return createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) => {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });
}
