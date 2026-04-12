// tests/setup/globalSetup.ts
//
// Loads test infrastructure into the test database before any integration
// test runs. This is the wiring that was previously missing — the
// test_helpers.sql functions were being applied manually and accumulated
// in the database between db:reset cycles, until Phase 1.1 closeout
// discovered the gap during Task 2 (see docs/friction-journal.md
// 2026-04-12).
//
// Test infrastructure (helpers, fixtures, setup SQL) belongs HERE, not in
// supabase/migrations/. Migration files contaminate production schema with
// test functions. globalSetup keeps the test/production boundary clean.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// globalSetup runs BEFORE setupFiles (loadEnv.ts), so we need to load
// env vars ourselves. Same logic as loadEnv.ts but runs earlier.
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  try {
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (key && !(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local not found — rely on environment variables already set
  }
}

export async function setup() {
  loadEnvLocal();

  const supabaseUrl = process.env.SUPABASE_TEST_URL ?? process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error(
      'globalSetup: SUPABASE_TEST_URL or SUPABASE_URL must be set. ' +
      'Run `supabase status` and export SUPABASE_URL in .env.test.local.',
    );
  }

  // Phase 1.1: local Supabase only per Q18. Hardcoding the local Postgres
  // connection because Supabase CLI exposes it on a fixed port. Phase 1.3
  // (remote Supabase) needs a separate mechanism — see friction journal
  // entry on Phase 1.3 obligations.
  const dbUrl = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

  const helpersPath = path.resolve(__dirname, 'test_helpers.sql');
  if (!existsSync(helpersPath)) {
    throw new Error(`globalSetup: test helpers SQL not found at ${helpersPath}`);
  }

  try {
    execFileSync('psql', [dbUrl, '-f', helpersPath], {
      stdio: 'pipe',
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `globalSetup: failed to load test_helpers.sql via psql.\n` +
      `Connection: ${dbUrl}\n` +
      `Error: ${errMsg}\n\n` +
      `Verify (1) Supabase is running (\`pnpm db:start\`), ` +
      `(2) psql is installed, ` +
      `(3) the test database is reachable.`,
    );
  }
}

export async function teardown() {
  // Optional cleanup. db:reset wipes the helpers anyway between runs.
  // Skipping explicit DROP FUNCTION calls to avoid masking real test
  // failures with teardown errors.
}
