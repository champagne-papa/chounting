// tests/integration/e2e/documentPipeline.receipt.e2e.test.ts
//
// Phase 8 chunk 6 sub-chunk b — receipt end-to-end against the real Modal
// sidecar. Verifies the full orchestrator traversal (Stages 0-7) for the
// receipt fixture.
//
// SCOPE (Session 74, Sub-option 3 — observed-runtime assertions): the
// unseeded fixture commits with NO ledger mutation (proposal_id=null;
// receipt is a non-ledger ProposedAttachment route). The seeded
// matched-payment-candidate scenario is deferred to the Phase 8
// retrospective (see the chunk 6 close report).
//
// GATING (opt-in, per Session 74 δ-1): hits the real billable Modal
// sidecar; gated behind RUN_MODAL_E2E in addition to secret presence —
// routine `pnpm test` SKIPS it. To run:
//   cd apps/web && RUN_MODAL_E2E=1 pnpm test:integration tests/integration/e2e/documentPipeline.receipt.e2e

import { describe, it, expect } from 'vitest';
import { runIngestPipeline } from './ingestPipelineHarness';

const RUN_E2E = Boolean(
  process.env.MODAL_OCR_HMAC_SECRET &&
    process.env.MODAL_OCR_SIDECAR_URL &&
    process.env.RUN_MODAL_E2E,
);

const MODAL_TIMEOUT_MS = 180_000;

describe.skipIf(!RUN_E2E)(
  'Phase 8 chunk 6 — receipt end-to-end (deployed Modal sidecar)',
  () => {
    it(
      'receipt (unseeded, no matched candidate): full Stage 0-7 traversal → committed, no ledger mutation (proposal_id=null)',
      async () => {
        const { output } = await runIngestPipeline('receipt.pdf');

        expect(output.status).toBe('committed');
        expect(output.failure_class).toBeNull();

        const stages = output.pipeline_trace.map((s) => s.stage_name);
        expect(stages).toContain('run_ocr'); // Modal sidecar invoked
        expect(stages).toContain('classify_document_type');
        expect(stages).toContain('match_vendor');
        expect(stages).toContain('match_against_existing_state');
        expect(stages).toContain('router_match_against_state');
        expect(stages[stages.length - 1]).toBe('build_proposal');
        expect(stages.length).toBeGreaterThanOrEqual(9);

        // Receipt is a non-ledger ProposedAttachment route → proposal_id=null.
        expect(output.proposal_id).toBeNull();
      },
      MODAL_TIMEOUT_MS,
    );

    // DEFERRED to Phase 8 retrospective (Session 74 Sub-option 3): requires
    // seeding a payment matching the receipt's amount/date + a
    // document_relationship_candidate so the pipeline routes to
    // ProposedAttachmentCard attach_payment_evidence. See the chunk 6 close
    // report for the deferred-scenario inventory.
    it.skip(
      'receipt with matched payment candidate: ProposedAttachmentCard attach_payment_evidence → proposal_id=null [DEFERRED]',
      async () => {},
    );
  },
);
