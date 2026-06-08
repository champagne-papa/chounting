const REQUIRED_SERVER = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY',
  // Path A carve-out (Post-MVP, pre-Phase-2A): Upstash Redis
  // for rate-limiting POST /api/agent/message. Injected by the
  // Vercel-Marketplace Upstash Redis integration into chounting
  // project env (Production + Preview + staging scopes;
  // Development scope deliberately excluded per (γ) three-tier
  // injection pattern — local .env.local carries unreachable
  // placeholders that exercise the helper's soft-fail-open
  // path). Marketplace integration uses the KV-naming
  // convention (UPSTASH_REDIS_KV_REST_API_URL/_TOKEN) regardless
  // of any custom prefix; rateLimit.ts uses explicit Redis
  // construction to match. Required at boot per F1
  // environment-isomorphism finding — missing-on-deploy must
  // fire fatal-startup-message, not soft-fail at first request.
  'UPSTASH_REDIS_KV_REST_API_URL',
  'UPSTASH_REDIS_KV_REST_API_TOKEN',
  // Phase 6 chunk 6.3a: Postmark inbound webhook shared secret.
  // Required at boot per F1 environment-isomorphism finding —
  // missing-on-deploy must fire fatal-startup-message, not soft-fail
  // at first webhook hit. Vercel env scope: Production + Preview +
  // staging (mirror Upstash scoping); local .env.local carries a
  // deterministic test value for integration tests.
  'POSTMARK_INBOUND_WEBHOOK_SECRET',
] as const;

const REQUIRED_PUBLIC = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_APP_URL',
] as const;

function assertEnv() {
  const missing: string[] = [];
  for (const key of REQUIRED_SERVER) {
    if (!process.env[key]) missing.push(key);
  }
  for (const key of REQUIRED_PUBLIC) {
    if (!process.env[key]) missing.push(key);
  }
  if (missing.length > 0) {
    const msg = [
      'FATAL: missing required environment variables.',
      'Refusing to start.',
      '',
      'Missing:',
      ...missing.map((k) => `  - ${k}`),
      '',
      'Copy .env.example → .env.local and fill in the values.',
      'See Phase 1.1 Execution Brief Section 7 for details.',
    ].join('\n');
    throw new Error(msg);
  }
}

assertEnv();

export const env = {
  SUPABASE_URL:              process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY:         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  ANTHROPIC_API_KEY:         process.env.ANTHROPIC_API_KEY!,
  APP_URL:                   process.env.NEXT_PUBLIC_APP_URL!,
  UPSTASH_REDIS_KV_REST_API_URL:   process.env.UPSTASH_REDIS_KV_REST_API_URL!,
  UPSTASH_REDIS_KV_REST_API_TOKEN: process.env.UPSTASH_REDIS_KV_REST_API_TOKEN!,
  POSTMARK_INBOUND_WEBHOOK_SECRET: process.env.POSTMARK_INBOUND_WEBHOOK_SECRET!,
  // Charter B (a) sharepoint_drive provider — app-only Graph auth
  // (client certificate). OPTIONAL at boot (no `!`, not in
  // REQUIRED_SERVER): the provider is inert until the resolver
  // activates it (plan Task 6) and real auth is gated on the Azure app
  // registration (plan Task 8). graphClient.ts reads these lazily and
  // throws a typed ServiceError if absent when the provider is actually
  // used — so a missing value can't fatal-boot the live app.
  GRAPH_TENANT_ID:           process.env.GRAPH_TENANT_ID,
  GRAPH_CLIENT_ID:           process.env.GRAPH_CLIENT_ID,
  GRAPH_CLIENT_CERT_PATH:    process.env.GRAPH_CLIENT_CERT_PATH,
  LOG_LEVEL:                 process.env.LOG_LEVEL ?? 'info',
  NODE_ENV:                  process.env.NODE_ENV ?? 'development',
} as const;