// tests/unit/verifyAuditCoverage.test.ts
// Unit tests for the pure `reconcileAuditCoverage` function. No DB,
// no mocks — the pure function takes entity and audit row arrays
// and returns a GapReport. All assertions use toEqual against full
// expected GapReport literals (per the Step-5 Closure discipline):
// field drift in either direction fails loudly.
//
// INV-AUDIT-002 blocks audit_log DELETEs at the DB layer, so
// realistic gap construction in an integration test is awkward.
// These unit tests carry the gap-detection logic's full coverage;
// the integration round-trip test only exercises DB-reading
// plumbing against a freshly-seeded DB.

import { describe, it, expect } from 'vitest';
import {
  reconcileAuditCoverage,
  JOURNAL_ENTRY_ACTIONS,
  FISCAL_PERIOD_LOCK_ACTIONS,
  type EntityRow,
  type AuditRow,
  type GapReport,
} from '../../scripts/audit/verifyAuditCoverage';

describe('reconcileAuditCoverage (pure function)', () => {
  it('happy path — all entities have matching audit rows', () => {
    const entities: EntityRow[] = [
      {
        entity_type: 'journal_entry',
        entity_id: 'je-1',
        org_id: 'org-A',
        expected_action_set: JOURNAL_ENTRY_ACTIONS,
      },
      {
        entity_type: 'journal_entry',
        entity_id: 'je-2',
        org_id: 'org-A',
        expected_action_set: JOURNAL_ENTRY_ACTIONS,
      },
    ];
    const auditRows: AuditRow[] = [
      { action: 'journal_entry.post', entity_type: 'journal_entry', entity_id: 'je-1', org_id: 'org-A' },
      { action: 'journal_entry.reverse', entity_type: 'journal_entry', entity_id: 'je-2', org_id: 'org-A' },
    ];
    expect(reconcileAuditCoverage({ entities, auditRows })).toEqual<GapReport>({
      gaps: [],
      scanned_entity_count: 2,
      scanned_audit_count: 2,
    });
  });

  it('gap: journal_entries row with no matching audit_log row', () => {
    const entities: EntityRow[] = [
      {
        entity_type: 'journal_entry',
        entity_id: 'je-orphan',
        org_id: 'org-A',
        expected_action_set: JOURNAL_ENTRY_ACTIONS,
      },
    ];
    const auditRows: AuditRow[] = [];
    expect(reconcileAuditCoverage({ entities, auditRows })).toEqual<GapReport>({
      gaps: [
        {
          kind: 'missing_audit_row',
          entity_type: 'journal_entry',
          entity_id: 'je-orphan',
          org_id: 'org-A',
          expected_action_set: JOURNAL_ENTRY_ACTIONS,
        },
      ],
      scanned_entity_count: 1,
      scanned_audit_count: 0,
    });
  });

  it('gap: journal_entries row with audit row action NOT in allowed set', () => {
    const entities: EntityRow[] = [
      {
        entity_type: 'journal_entry',
        entity_id: 'je-1',
        org_id: 'org-A',
        expected_action_set: JOURNAL_ENTRY_ACTIONS,
      },
    ];
    const auditRows: AuditRow[] = [
      { action: 'journal_entry.zap', entity_type: 'journal_entry', entity_id: 'je-1', org_id: 'org-A' },
    ];
    expect(reconcileAuditCoverage({ entities, auditRows })).toEqual<GapReport>({
      gaps: [
        {
          kind: 'missing_audit_row',
          entity_type: 'journal_entry',
          entity_id: 'je-1',
          org_id: 'org-A',
          expected_action_set: JOURNAL_ENTRY_ACTIONS,
        },
      ],
      scanned_entity_count: 1,
      scanned_audit_count: 1,
    });
  });

  it('happy path: fiscal_period locked with matching period.locked audit row', () => {
    const entities: EntityRow[] = [
      {
        entity_type: 'fiscal_period',
        entity_id: 'period-Q1',
        org_id: 'org-A',
        expected_action_set: FISCAL_PERIOD_LOCK_ACTIONS,
        lifecycle_event: 'locked',
      },
    ];
    const auditRows: AuditRow[] = [
      { action: 'period.locked', entity_type: 'fiscal_period', entity_id: 'period-Q1', org_id: 'org-A' },
    ];
    expect(reconcileAuditCoverage({ entities, auditRows })).toEqual<GapReport>({
      gaps: [],
      scanned_entity_count: 1,
      scanned_audit_count: 1,
    });
  });

  it('gap: fiscal_period locked with matching entity_id but action not in allowed set', () => {
    const entities: EntityRow[] = [
      {
        entity_type: 'fiscal_period',
        entity_id: 'period-Q1',
        org_id: 'org-A',
        expected_action_set: FISCAL_PERIOD_LOCK_ACTIONS,
        lifecycle_event: 'locked',
      },
    ];
    const auditRows: AuditRow[] = [
      { action: 'period.locked_v2', entity_type: 'fiscal_period', entity_id: 'period-Q1', org_id: 'org-A' },
    ];
    expect(reconcileAuditCoverage({ entities, auditRows })).toEqual<GapReport>({
      gaps: [
        {
          kind: 'missing_audit_row',
          entity_type: 'fiscal_period',
          entity_id: 'period-Q1',
          org_id: 'org-A',
          lifecycle_event: 'locked',
          expected_action_set: FISCAL_PERIOD_LOCK_ACTIONS,
        },
      ],
      scanned_entity_count: 1,
      scanned_audit_count: 1,
    });
  });

  it('multiple entities, one gap (mixed)', () => {
    const entities: EntityRow[] = [
      {
        entity_type: 'journal_entry',
        entity_id: 'je-A',
        org_id: 'org-1',
        expected_action_set: JOURNAL_ENTRY_ACTIONS,
      },
      {
        entity_type: 'journal_entry',
        entity_id: 'je-B',
        org_id: 'org-1',
        expected_action_set: JOURNAL_ENTRY_ACTIONS,
      },
      {
        entity_type: 'journal_entry',
        entity_id: 'je-C',
        org_id: 'org-1',
        expected_action_set: JOURNAL_ENTRY_ACTIONS,
      },
    ];
    const auditRows: AuditRow[] = [
      { action: 'journal_entry.post', entity_type: 'journal_entry', entity_id: 'je-A', org_id: 'org-1' },
      { action: 'journal_entry.post', entity_type: 'journal_entry', entity_id: 'je-C', org_id: 'org-1' },
    ];
    expect(reconcileAuditCoverage({ entities, auditRows })).toEqual<GapReport>({
      gaps: [
        {
          kind: 'missing_audit_row',
          entity_type: 'journal_entry',
          entity_id: 'je-B',
          org_id: 'org-1',
          expected_action_set: JOURNAL_ENTRY_ACTIONS,
        },
      ],
      scanned_entity_count: 3,
      scanned_audit_count: 2,
    });
  });

  it('empty inputs — zero entities, zero audit rows, zero gaps', () => {
    expect(reconcileAuditCoverage({ entities: [], auditRows: [] })).toEqual<GapReport>({
      gaps: [],
      scanned_entity_count: 0,
      scanned_audit_count: 0,
    });
  });

  it('scan counts match input sizes (5 entities, 3 audit rows, 2 gaps)', () => {
    const entities: EntityRow[] = [
      { entity_type: 'journal_entry', entity_id: 'je-1', org_id: 'org-1', expected_action_set: JOURNAL_ENTRY_ACTIONS },
      { entity_type: 'journal_entry', entity_id: 'je-2', org_id: 'org-1', expected_action_set: JOURNAL_ENTRY_ACTIONS },
      { entity_type: 'journal_entry', entity_id: 'je-3', org_id: 'org-1', expected_action_set: JOURNAL_ENTRY_ACTIONS },
      { entity_type: 'journal_entry', entity_id: 'je-4', org_id: 'org-1', expected_action_set: JOURNAL_ENTRY_ACTIONS },
      { entity_type: 'journal_entry', entity_id: 'je-5', org_id: 'org-1', expected_action_set: JOURNAL_ENTRY_ACTIONS },
    ];
    const auditRows: AuditRow[] = [
      { action: 'journal_entry.post', entity_type: 'journal_entry', entity_id: 'je-1', org_id: 'org-1' },
      { action: 'journal_entry.post', entity_type: 'journal_entry', entity_id: 'je-3', org_id: 'org-1' },
      { action: 'journal_entry.post', entity_type: 'journal_entry', entity_id: 'je-5', org_id: 'org-1' },
    ];
    expect(reconcileAuditCoverage({ entities, auditRows })).toEqual<GapReport>({
      gaps: [
        {
          kind: 'missing_audit_row',
          entity_type: 'journal_entry',
          entity_id: 'je-2',
          org_id: 'org-1',
          expected_action_set: JOURNAL_ENTRY_ACTIONS,
        },
        {
          kind: 'missing_audit_row',
          entity_type: 'journal_entry',
          entity_id: 'je-4',
          org_id: 'org-1',
          expected_action_set: JOURNAL_ENTRY_ACTIONS,
        },
      ],
      scanned_entity_count: 5,
      scanned_audit_count: 3,
    });
  });
});
