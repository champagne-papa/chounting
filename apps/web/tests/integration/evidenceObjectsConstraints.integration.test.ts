// tests/integration/evidenceObjectsConstraints.integration.test.ts
//
// Wave 6 D5 T1 — evidence_objects persistence substrate (migration
// 20240177): UNIQUE (org_id, subject_type, subject_id), redundant
// idx_evidence_objects_org_subject dropped, status CHECK broadened
// additively v1_active → wave_6_active ('reserved'|'partial'|'complete').
// Direct-DB constraint tests (the T1 grain — the producer/service grain
// is T2's suite).
//
// evidence_objects has no append-only trigger (ADR-0033 Wave-2 substrate)
// — rows seeded here are cleaned up in afterAll.

import { describe, it, expect, afterAll } from 'vitest';
import crypto from 'crypto';
import { adminClient, SEED } from '../setup/testDb';

const db = adminClient();
const createdIds: string[] = [];

function row(overrides: Record<string, unknown> = {}) {
  const id = crypto.randomUUID();
  createdIds.push(id);
  return {
    id,
    org_id: SEED.ORG_HOLDING,
    subject_type: 'bill',
    subject_id: crypto.randomUUID(),
    trace_id: crypto.randomUUID(),
    status: 'partial',
    domain_extension: null,
    created_by: 'd5-t1-test',
    ...overrides,
  };
}

afterAll(async () => {
  if (createdIds.length > 0) {
    await db.from('evidence_objects').delete().in('id', createdIds);
  }
});

describe('Wave 6 D5 T1: evidence_objects persistence substrate', () => {
  it("CHECK broaden: 'partial' admitted (the producer's common write)", async () => {
    const { error } = await db.from('evidence_objects').insert(row({ status: 'partial' }));
    expect(error).toBeNull();
  });

  it("CHECK broaden: 'complete' admitted", async () => {
    const { error } = await db.from('evidence_objects').insert(row({ status: 'complete' }));
    expect(error).toBeNull();
  });

  it("CHECK broaden is additive: 'reserved' still admitted (strict-superset proof)", async () => {
    const { error } = await db.from('evidence_objects').insert(row({ status: 'reserved' }));
    expect(error).toBeNull();
  });

  it('UNIQUE (org_id, subject_type, subject_id): duplicate triple → 23505 naming evidence_objects_subject_unique', async () => {
    const subjectId = crypto.randomUUID();
    const { error: first } = await db
      .from('evidence_objects')
      .insert(row({ subject_id: subjectId }));
    expect(first).toBeNull();

    const { error: dup } = await db
      .from('evidence_objects')
      .insert(row({ subject_id: subjectId, trace_id: crypto.randomUUID() }));
    expect(dup).not.toBeNull();
    expect(dup!.code).toBe('23505');
    expect(dup!.message).toContain('evidence_objects_subject_unique');
  });

  it('UNIQUE is per-subject, not per-org: same org, different subject_id → both insert', async () => {
    const { error: a } = await db.from('evidence_objects').insert(row());
    const { error: b } = await db.from('evidence_objects').insert(row());
    expect(a).toBeNull();
    expect(b).toBeNull();
  });
});
