import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Rule 8: SUPABASE_TEST_URL → SUPABASE_URL → error
const SUPABASE_URL =
  process.env.SUPABASE_TEST_URL ??
  process.env.SUPABASE_URL ??
  (() => { throw new Error('SUPABASE_TEST_URL or SUPABASE_URL must be set'); })();

// Rule 8: SUPABASE_TEST_SERVICE_ROLE_KEY → SUPABASE_SERVICE_ROLE_KEY → error
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_TEST_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  (() => { throw new Error('SUPABASE_TEST_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY must be set'); })();

const ANON_KEY =
  process.env.SUPABASE_ANON_KEY_LOCAL ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  (() => { throw new Error('SUPABASE_ANON_KEY_LOCAL or NEXT_PUBLIC_SUPABASE_ANON_KEY must be set'); })();

export function adminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const SEED = {
  USER_EXECUTIVE:     '00000000-0000-0000-0000-000000000001',
  USER_CONTROLLER:    '00000000-0000-0000-0000-000000000002',
  USER_AP_SPECIALIST: '00000000-0000-0000-0000-000000000003',
  ORG_HOLDING:        '11111111-1111-1111-1111-111111111111',
  ORG_REAL_ESTATE:    '22222222-2222-2222-2222-222222222222',
} as const;

export async function userClientFor(email: string, password: string): Promise<SupabaseClient> {
  const c = createClient(SUPABASE_URL, ANON_KEY);
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return c;
}