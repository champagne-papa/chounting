// tests/integration/e2e/documentPipeline.paymentConfirmation.e2e.test.ts
//
// Phase 8 chunk 6 sub-chunk b — payment_confirmation end-to-end against the
// real Modal sidecar. Verifies the full orchestrator traversal (Stages 0-7)
// for the payment_confirmation fixture.
//
// SCOPE (Session 74, Sub-option 3 — observed-runtime assertions): the
// unseeded fixture commits with NO ledger mutation (proposal_id=null) —
// without a cited bill / seeded candidate, no payment is recorded. The
// seeded scenarios (cited-bill-matched record_bill_payment, no-cited-bill
// matched-candidate, born-paid bundle) are deferred to the Phase 8
// retrospective (see the chunk 6 close report).
//
// GATING (opt-in, per Session 74 δ-1): hits the real billable Modal
// sidecar; gated behind RUN_MODAL_E2E in addition to secret presence —
// routine `pnpm test` SKIPS it. To run:
//   cd apps/web && RUN_MODAL_E2E=1 pnpm test:integration tests/integration/e2e/documentPipeline.paymentConfirmation.e2e

import { describe, it, expect } from 'vitest';
import { runIngestPipeline } from './ingestPipelineHarness';

const RUN_E2E = Boolean(
  process.env.MODAL_OCR_HMAC_SECRET &&
    process.env.MODAL_OCR_SIDECAR_URL &&
    process.env.RUN_MODAL_E2E,
);

const MODAL_TIMEOUT_MS = 180_000;

describe.skipIf(!RUN_E2E)(
  'Phase 8 chunk 6 — payment_confirmation end-to-end (deployed Modal sidecar)',
  () => {
    it(
      'payment_confirmation (unseeded, no cited bill): full Stage 0-7 traversal → committed, no ledger mutation (proposal_id=null)',
      async () => {
        const { output } = await runIngestPipeline('payment_confirmation.pdf');

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

        // No cited bill / matched candidate → no payment recorded → committed
        // with no ledger mutation.
        expect(output.proposal_id).toBeNull();
      },
      MODAL_TIMEOUT_MS,
    );

    // DEFERRED to Phase 8 retrospective (Session 74 Sub-option 3): each
    // requires substantial seeding matched to OCR-extracted fields —
    //  - cited-bill matched → ProposedEntryCard record_bill_payment (seed bill);
    //  - no-cited-bill + matched candidate → ProposedAttachmentCard (seed payment + candidate);
    //  - born-paid bundle → ProposedMutationBundle + partial-commit reconciliation.
    // See the chunk 6 close report for the deferred-scenario inventory.
    it.skip('payment_confirmation cited-bill matched: ProposedEntryCard record_bill_payment → proposal_id=payment_id [DEFERRED]', async () => {});
    it.skip('payment_confirmation no-cited-bill + matched candidate: ProposedAttachmentCard attach_payment_evidence → proposal_id=null [DEFERRED]', async () => {});
    it.skip('payment_confirmation born-paid (cited invoice + payment): ProposedMutationBundle born_paid_bill + partial-commit reconciliation [DEFERRED]', async () => {});
  },
);
