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
  type IntentKey,
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
