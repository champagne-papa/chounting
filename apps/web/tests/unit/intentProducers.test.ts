// apps/web/tests/unit/intentProducers.test.ts
//
// ADR-0031 Wave-4 — No-AI-Only-Paths producer registry + coverage check.
// Unit-level (pure module, no DB/agent): registry shape, the gap-finder, and the
// grounded Wave-4 outcome (Query is the only warn-gap; every ledger Mutation and
// Navigation has a non-AI producer).

import { describe, it, expect } from 'vitest';
import {
  INTENT_PRODUCERS,
  intentsLackingNonAiProducer,
  V1_TEETH_SCOPE_OUT,
  runCheck,
  type IntentKey,
  type IntentProducer,
} from '@/core/intent/producers';

describe('ADR-0031 intent producer registry', () => {
  it('registers all three intent types (Navigation, Query, and the ledger Mutations)', () => {
    const keys = Object.keys(INTENT_PRODUCERS) as IntentKey[];
    expect(keys).toEqual(
      expect.arrayContaining([
        'navigation',
        'query',
        'mutation:journal_entry.post',
        'mutation:journal_entry.adjust',
        'mutation:bill.post',
        'mutation:bill.record_payment',
        'mutation:payment.record',
        'mutation:bill.reverse',
      ]),
    );
  });

  it('every registered producer has a valid kind and a provenance site', () => {
    for (const producers of Object.values(INTENT_PRODUCERS)) {
      expect(producers.length).toBeGreaterThan(0);
      for (const p of producers) {
        expect(['ai', 'non-ai']).toContain(p.kind);
        expect(p.name.length).toBeGreaterThan(0);
        expect(p.site.length).toBeGreaterThan(0);
      }
    }
  });

  it('every ledger Mutation has a non-AI producer (no AI-only ledger path)', () => {
    const mutationKeys = (Object.keys(INTENT_PRODUCERS) as IntentKey[]).filter((k) =>
      k.startsWith('mutation:'),
    );
    expect(mutationKeys.length).toBeGreaterThanOrEqual(6);
    for (const key of mutationKeys) {
      const hasNonAi = INTENT_PRODUCERS[key].some((p) => p.kind === 'non-ai');
      expect(hasNonAi, `${key} must have a non-AI producer`).toBe(true);
    }
  });

  it('Navigation has a non-AI producer (Mainframe/palette/drill-down)', () => {
    expect(INTENT_PRODUCERS.navigation.some((p) => p.kind === 'non-ai')).toBe(true);
  });

  it('Query is the only Wave-4 warn-gap (no non-AI producer — Phase-2, deferred to Wave 6)', () => {
    expect(intentsLackingNonAiProducer()).toEqual(['query']);
  });

  it('the gap-finder reports a key whose producers are all AI', () => {
    const synthetic = {
      'mutation:test.aiOnly': [{ name: 'agent', kind: 'ai' as const, site: 'test' }],
      'mutation:test.covered': [
        { name: 'form', kind: 'non-ai' as const, site: 'test' },
        { name: 'agent', kind: 'ai' as const, site: 'test' },
      ],
    };
    expect(intentsLackingNonAiProducer(synthetic)).toEqual(['mutation:test.aiOnly']);
  });
});

// ---------------------------------------------------------------------------
// Wave 6 D6 T1 — INV-WORKFLOW-001 teeth + the Q2 query scope-out (brief
// D-1/D-2/D-3; decomposition T1). The pure check core (runCheck) lives in
// producers.ts beside intentsLackingNonAiProducer — the in-file precedent —
// so no cross-root import and no script import-side-effect exists (the
// decomposition ask-(b) gotcha dissolved by placement; the script keeps its
// unconditional main()).

describe('Wave 6 D6 T1: INV-WORKFLOW-001 teeth + Q2 scope-out', () => {
  it('FLIP-SAFETY PROOF (executable): live gap set exactly [query]; the carve-out covers it; exit 0', () => {
    expect(intentsLackingNonAiProducer()).toEqual(['query']);
    expect([...V1_TEETH_SCOPE_OUT]).toEqual(['query']);

    const result = runCheck();
    expect(result.gaps).toEqual(['query']);
    expect(result.scopedOut).toEqual(['query']);
    expect(result.effectiveGaps).toEqual([]);
    expect(result.exitCode).toBe(0);
  });

  it('THE TEETH BITE: a synthetic unscoped no-non-AI intent → exit 1; the same gap scoped out → 0, carve-out visible', () => {
    const synth: Record<string, readonly IntentProducer[]> = {
      covered: [{ name: 'manual form', kind: 'non-ai', site: 'synthetic' }],
      naked: [{ name: 'agent only', kind: 'ai', site: 'synthetic' }],
    };

    const bites = runCheck(synth, []);
    expect(bites.gaps).toEqual(['naked']);
    expect(bites.scopedOut).toEqual([]);
    expect(bites.effectiveGaps).toEqual(['naked']);
    expect(bites.exitCode).toBe(1);

    const scoped = runCheck(synth, ['naked']);
    expect(scoped.gaps).toEqual(['naked']);
    expect(scoped.scopedOut).toEqual(['naked']); // visible at the data grain
    expect(scoped.effectiveGaps).toEqual([]);
    expect(scoped.exitCode).toBe(0);
  });

  it('scopedOut reports only carve-outs doing work (the intersection, not the raw list)', () => {
    const synth: Record<string, readonly IntentProducer[]> = {
      covered: [{ name: 'manual form', kind: 'non-ai', site: 'synthetic' }],
    };
    // Scoping out a covered intent is inert — the visibility lines must
    // not claim an exemption that exempts nothing.
    const result = runCheck(synth, ['covered']);
    expect(result.gaps).toEqual([]);
    expect(result.scopedOut).toEqual([]);
    expect(result.exitCode).toBe(0);
  });

  it('CARVE-OUT INTEGRITY: query keeps its AI producer recorded (don\'t-erase); still no non-AI (the gap premise pinned)', () => {
    const query = INTENT_PRODUCERS.query;
    expect(query.some((p) => p.kind === 'ai')).toBe(true);
    expect(query.some((p) => p.kind === 'non-ai')).toBe(false);
  });
});
