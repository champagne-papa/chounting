// tests/integration/confidenceToPolicy.integration.test.ts
//
// Wave 5 D2 — confidence-to-policy validation. The confidence-driven policy is
// the classifier's per-document-type threshold gate: accept the classification
// iff confidence >= CONFIDENCE_THRESHOLDS[type], else route to Tier D 'unknown'
// (tierCoordination consumes `valid && confidenceAboveThreshold`). The values
// are governed ADR-0019 calibration (ADR-0014 §7 Q65 v1-provisional). Unlike D1
// (a MEASURED baseline), this policy is DETERMINISTIC — so D2 hard-asserts.
//
// Fixture-offline: reads the exported threshold map + the pure dispositionFor
// Action; applies the `>=` policy in-test against the exported map. NO live AI
// (callClaude mocked to throw), NO adminClient/persisted-read (mocked to throw).
//
// Scope: classifier confidence thresholds + the ActionType→Disposition mapping
// (ADR-0030). The Router Subsystem-2 ambiguity-margin (ADR-0019 §13) is a
// DISTINCT confidence surface in a different subsystem (document-relationship
// router; margin_threshold V1_PROVISIONAL in
// shared/schemas/document-platform/documentRelationshipCandidate.schema.ts) —
// carried forward NAMED against ADR-0019 §13, not folded (separate substrate).

import { describe, it, expect, vi } from 'vitest';

// Cautionary-tale teeth: the eval suite must reach neither the live-AI call nor
// an RLS-bypassing client. aiFallback.ts (source of CONFIDENCE_THRESHOLDS)
// imports both; mocking them to THROW means a suite pass proves neither fired.
vi.mock('@/agent/orchestrator/callClaude', () => ({
  callClaude: () => {
    throw new Error(
      'Wave 5 D2: the live-AI path (callClaude) must NOT be reachable from the eval suite',
    );
  },
}));
vi.mock('@/db/adminClient', () => ({
  adminClient: () => {
    throw new Error(
      'Wave 5 D2: adminClient / persisted-read must NOT be reachable from the eval suite',
    );
  },
}));

import { CONFIDENCE_THRESHOLDS } from '@/agent/orchestrator/extraction/classifier/aiFallback';
import { dispositionForAction, type Disposition } from '@/shared/rules/disposition';
import { Constants } from '@/db/types';
import type { DocumentType } from '@/agent/orchestrator/extraction/types';
import type { ActionType } from '@/shared/rules/types';

// Governed snapshot — ADR-0014 §7 Q65 v1-provisional + ADR-0019 calibration
// governance. One-directional ratchet: any drift fails until re-frozen HERE in
// the same commit, routed through ADR-0019 governance, with a why. `unknown:1.0`
// is the always-exception sentinel (its path forces confidence:0, so it never
// accepts).
const GOVERNED_THRESHOLDS: Record<DocumentType, number> = {
  vendor_invoice: 0.85,
  receipt: 0.8,
  payment_confirmation: 0.85,
  unknown: 1.0,
};

const EPS = 0.0001;
const DISPOSITIONS: Disposition[] = ['auto_posted', 'blocked', 'routed', 'pending'];

// The production policy, mirrored against the exported map (aiFallback.ts:~366
// `validated.confidence >= CONFIDENCE_THRESHOLDS[type]`).
const accepts = (type: DocumentType, confidence: number): boolean =>
  confidence >= CONFIDENCE_THRESHOLDS[type];

describe('Wave 5 D2 — confidence-to-policy validation', () => {
  it('threshold snapshot: governed per-type values match (incl. unknown:1.0 sentinel)', () => {
    expect(CONFIDENCE_THRESHOLDS).toEqual(GOVERNED_THRESHOLDS);
  });

  it('boundary: confidence == threshold accepts (>=); just below routes to Tier D unknown', () => {
    for (const type of Object.keys(CONFIDENCE_THRESHOLDS) as DocumentType[]) {
      const t = CONFIDENCE_THRESHOLDS[type];
      expect(accepts(type, t), `${type} at threshold`).toBe(true);
      expect(accepts(type, t - EPS), `${type} just below`).toBe(false);
      if (t + EPS <= 1) {
        expect(accepts(type, t + EPS), `${type} just above`).toBe(true);
      }
    }
  });

  it("unknown sentinel: 1.0 threshold + the unknown path's confidence:0 ⇒ never accepts", () => {
    expect(accepts('unknown', 0)).toBe(false); // the actual unknown-path confidence
    expect(accepts('unknown', 0.99)).toBe(false);
    expect(accepts('unknown', 1.0)).toBe(true); // only an (unreachable) perfect score
  });

  it('disposition totality: every live action_type arm maps to a Disposition (exhaustive, no fallthrough)', () => {
    const arms = Constants.public.Enums.action_type;
    const seen = new Set<Disposition>();
    for (const arm of arms) {
      const d = dispositionForAction(arm as ActionType);
      expect(d, `arm '${arm}' produced no disposition`).toBeDefined();
      expect(DISPOSITIONS, `arm '${arm}' → '${d}'`).toContain(d);
      seen.add(d);
    }
    // Guard: a new enum arm forces a deliberate dispositionForAction update.
    expect(arms.length).toBe(5);
    // The 5 arms cover all 4 dispositions.
    expect([...seen].sort()).toEqual([...DISPOSITIONS].sort());
  });

  it('dispositionForAction is synchronous/pure (no async/AI path)', () => {
    const r = dispositionForAction('block_with_reason' as ActionType);
    expect((r as unknown) instanceof Promise).toBe(false);
    expect(r).toBe('blocked');
  });
});
