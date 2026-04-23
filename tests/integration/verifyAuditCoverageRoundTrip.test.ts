// tests/integration/verifyAuditCoverageRoundTrip.test.ts
// One plumbing test for the audit coverage verifier: runs against a
// freshly-seeded DB and asserts zero gaps with positive scan counts.
// Exercises the DB-reading wrapper (SELECTs + synthesis) end-to-end;
// gap-detection logic is covered by the pure-function unit tests.
//
// Intentionally does not construct gap scenarios. INV-AUDIT-002
// blocks audit_log DELETEs at the DB layer, making realistic gap
// construction against a real DB awkward. The pure-function unit
// tests in tests/unit/verifyAuditCoverage.test.ts cover all eight
// gap-detection scenarios; this integration test confirms the
// SELECTs + entity-row synthesis work against the actual schema.

import { describe, it, expect } from 'vitest';
import { adminClient } from '../setup/testDb';
import { runVerifier } from '../../scripts/audit/verifyAuditCoverage';

describe('runVerifier (integration round-trip against seeded DB)', () => {
  it('runs against seeded DB and reports exactly the one known seed-data gap', async () => {
    const db = adminClient();
    const report = await runVerifier(db);

    // Seed contains one pre-existing INV-AUDIT-001 gap: a locked
    // fiscal period ('FY Prior (LOCKED)' for org 22222222, seeded
    // via direct SQL in src/db/seed/dev.sql:122-126 with no paired
    // period.locked audit_log row because the seed predates Step
    // 3). The verifier correctly detects this. Locking the
    // assertion to exactly this one known gap (not zero, not
    // two-or-more) means a future service-layer regression that
    // adds a second gap fails this test loudly, and a future seed
    // fix that clears the gap also fails this test (correctly —
    // the fix session should tighten the assertion to
    // expect(report.gaps).toEqual([]) in the same commit).
    //
    // TODO: tighten to expect(report.gaps).toEqual([]) once the
    // seed fix lands — see
    // docs/05_operations/audit_verification.md §6
    // ("Known follow-ups — Seed-data audit coverage gap").
    expect(report.gaps).toHaveLength(1);
    expect(report.gaps[0]).toMatchObject({
      kind: 'missing_audit_row',
      entity_type: 'fiscal_period',
      org_id: '22222222-2222-2222-2222-222222222222',
    });
    expect(report.scanned_entity_count).toBeGreaterThan(0);
    expect(report.scanned_audit_count).toBeGreaterThan(0);
  });
});
