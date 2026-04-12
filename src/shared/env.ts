const REQUIRED_SERVER = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY',
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
  LOG_LEVEL:                 process.env.LOG_LEVEL ?? 'info',
  NODE_ENV:                  process.env.NODE_ENV ?? 'development',
} as const;