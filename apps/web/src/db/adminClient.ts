// src/db/adminClient.ts
// Service-role Supabase client that bypasses RLS.
// Server-only — must never be imported by any client component.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/shared/env';

/**
 * Returns a fresh Supabase admin client using the service role key.
 * Each call creates a new instance — no shared mutable state.
 * Auth session persistence is disabled since this is a server-side-only client.
 */
export function adminClient(): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
