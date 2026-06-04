/**
 * Wave 6 D2.3 — stranded-case sweep operator runner.
 *
 * Thin runner over sweepStrandedCases() (the orchestrator-layer seam —
 * a future scheduler is a caller of the same method, not a refactor).
 * Mirrors scripts/tier-c-empirical-exercise.ts: arg parsing + env
 * loading + one call. No logic lives here.
 *
 * DRY-RUN IS THE DEFAULT. The dry-run report previews exact buckets —
 * and the B3 count, which IS the OCR/Claude spend — before --execute.
 *
 * Invocation (from repo root; cwd must be apps/web for the @/ alias):
 *   cd apps/web
 *   pnpm exec tsx scripts/sweep-stranded-cases.ts                      # dry-run, all orgs
 *   pnpm exec tsx scripts/sweep-stranded-cases.ts --org-id <uuid>
 *   pnpm exec tsx scripts/sweep-stranded-cases.ts --staleness-minutes 60
 *   pnpm exec tsx scripts/sweep-stranded-cases.ts --execute            # acts
 *
 * Output: JSON SweepReport to stdout (IDs only — no document content).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const SCRIPT_DIR = path.dirname(process.argv[1] ?? __filename ?? '');
const APP_WEB_DIR = path.resolve(SCRIPT_DIR, '..');

// --- CLI args ---
function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

// --- env (mirror tier-c-empirical-exercise.ts) ---
function loadEnvLocal(): void {
  const envPath = path.join(APP_WEB_DIR, '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main(): Promise<void> {
  loadEnvLocal();

  // Dynamic import AFTER env is loaded — the module graph reads env at
  // import time (adminClient).
  const { sweepStrandedCases } = await import(
    '../src/agent/orchestrator/maintenance/sweepStrandedCases'
  );

  const stalenessArg = arg('staleness-minutes');
  const report = await sweepStrandedCases({
    org_id: arg('org-id'),
    staleness_minutes:
      stalenessArg !== undefined ? Number(stalenessArg) : undefined,
    execute: flag('execute'),
  });

  // eslint-disable-next-line no-console -- operator runner output surface
  console.log(JSON.stringify(report, null, 2));
  if (report.dry_run) {
    // eslint-disable-next-line no-console -- operator runner output surface
    console.log(
      `\nDRY RUN — no writes performed. B3 count (${report.counts.B3}) is the re-run OCR/Claude spend. Re-invoke with --execute to act.`,
    );
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console -- operator runner failure surface
  console.error('sweep-stranded-cases failed:', err);
  process.exit(1);
});
