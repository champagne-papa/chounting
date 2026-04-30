// tests/integration/verifyAuditCoverageRoundTrip.test.ts
//
// **Plumbing test, not INV-AUDIT-001 enforcement.**
//
// This test exercises the DB-reading wrapper of the audit coverage
// verifier (`scripts/audit/verifyAuditCoverage.ts`) end-to-end against
// a real Postgres + seeded fixture: it confirms the SELECT queries,
// entity-row synthesis, and the report-shape contract work against
// the actual schema. The pure-function unit tests in
// `tests/unit/verifyAuditCoverage.test.ts` cover all eight
// gap-detection scenarios; this file's job is the round-trip plumbing,
// nothing more.
//
// **Why the assertion shape changed.**
// The verifier is correct given current DB state; the previous test
// assertion was invalid because it assumed a controlled DB state that
// does not hold within a multi-file vitest run. Earlier in this file's
// life it locked to `report.gaps.length === 1` (the one known
// seed-data gap — the locked fiscal_period for org 22222222 in
// `src/db/seed/dev.sql`). That locked assertion fails as soon as
// other integration tests in the same vitest run create entity rows
// (orgs, addresses, journal entries, recurring runs, etc.) whose
// audit-pairing state belongs to those tests, not to this one.
// Containment-not-equality is the correct shape: this test asserts
// the verifier *finds the known seed gap*, not that it finds *only*
// the known seed gap.
//
// **Where INV-AUDIT-001 enforcement actually lives.**
// The authoritative gate against `recordMutation()` regressions is
// the daily CI cron in `.github/workflows/verify-audit-coverage.yml`,
// which runs the verifier against a fresh seed in an isolated
// environment where total-gap-count equality *is* a meaningful
// assertion. See `docs/05_operations/audit_verification.md` for the
// full operational context — the runbook for triaging cron failures,
// the seed-gap follow-up, and the relationship between this
// integration plumbing test, the unit tests, and the cron.
//
// **What this test does NOT catch.**
// A regression in `recordMutation()` coverage — a service mutation
// path that stops writing its `audit_log` row — will not fail this
// test, because containment cannot detect "more gaps than expected"
// when the expected count is unbounded. That regression is caught by
// the daily CI cron against a fresh seed (where total gap count is
// the meaningful assertion), and by the per-action audit pairing in
// the integration tests for each mutation. This test only catches
// regressions that break the verifier's own plumbing — the SELECTs,
// the synthesis, the report shape.

import { describe, it, expect } from 'vitest';
import { adminClient } from '../setup/testDb';
import { runVerifier } from '../../scripts/audit/verifyAuditCoverage';

describe('runVerifier (integration round-trip against seeded DB)', () => {
  it('plumbing: verifier runs against the seeded DB and finds the known seed-data gap among its results', async () => {
    const db = adminClient();
    const report = await runVerifier(db);

    // Containment, not equality: this assertion only requires that
    // the known seed gap (locked fiscal_period for org 22222222,
    // seeded via direct SQL in src/db/seed/dev.sql with no paired
    // period.locked audit_log row) is present in the verifier's
    // output. Other gaps may exist in `report.gaps` — they belong to
    // other tests in the same vitest run that created entity rows
    // whose audit-pairing state belongs to those tests. See header
    // comment for the operational rationale.
    expect(report.gaps).toContainEqual(
      expect.objectContaining({
        kind: 'missing_audit_row',
        entity_type: 'fiscal_period',
        org_id: '22222222-2222-2222-2222-222222222222',
      }),
    );
    expect(report.scanned_entity_count).toBeGreaterThan(0);
    expect(report.scanned_audit_count).toBeGreaterThan(0);
  });
});
