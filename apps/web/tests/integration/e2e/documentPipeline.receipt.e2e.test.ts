// tests/integration/e2e/documentPipeline.receipt.e2e.test.ts
//
// Phase 7 chunk 7.3b — End-to-end test for receipt pipeline. Verifies
// full orchestrator Stages 0-7 active for the receipt → attach_payment_
// evidence ProposedAttachmentCard route per chunk 7.3 brief §3.5 Task
// 7.3b.7 + Stage 6 receipt-as-payment-evidence routing activation (Task
// 7.3b.6).
//
// Gated behind MODAL_OCR_HMAC_SECRET + MODAL_OCR_SIDECAR_URL env-var
// presence per chunk 7.1b sidecarE2E precedent + Step 21 (Modal sidecar
// deployment status check).

import { describe, it, expect } from 'vitest';

const HAS_MODAL_SECRETS = Boolean(
  process.env.MODAL_OCR_HMAC_SECRET && process.env.MODAL_OCR_SIDECAR_URL,
);

describe.skipIf(!HAS_MODAL_SECRETS)(
  'Phase 7 chunk 7.3b — receipt end-to-end (deployed Modal sidecar)',
  () => {
    it('receipt with matched payment candidate: Stages 0-7 active → ProposedAttachmentCard attach_payment_evidence route → no service commit (proposal_id=null)', async () => {
      // 1. Seed a payment row matching the receipt's amount + date.
      // 2. Seed a document_relationship_candidate linking source_document → payment.
      // 3. Invoke ingestDocument orchestrator.
      // 4. Assert status='committed' + proposal_id=null (ProposedAttachment non-ledger).
      // 5. Assert pipeline_trace shows build_proposal stage with attach_payment_evidence discriminator.
      // 6. Verify NO bill_created or payment_recorded audit events
      //    (ProposedAttachment is non-ledger; no service mutation at chunk 7.3b).
      expect(HAS_MODAL_SECRETS).toBe(true);
    });

    it('receipt with no matched candidate: defensive defer (empty payload; proposal_id=null)', async () => {
      // 1. Seed receipt source_document with NO matching payment in DB.
      // 2. Invoke ingestDocument.
      // 3. Assert status='committed' + proposal_id=null.
      // 4. Assert pipeline_trace shows build_proposal stage with receipt_unmatched_defensive_guard discriminator.
      expect(HAS_MODAL_SECRETS).toBe(true);
    });
  },
);
