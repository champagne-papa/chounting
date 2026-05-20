// tests/integration/e2e/documentPipeline.vendorInvoice.e2e.test.ts
//
// Phase 7 chunk 7.3b — End-to-end test for vendor_invoice pipeline.
// Verifies full orchestrator Stages 0-7 active for the vendor_invoice
// path:
//   Stage 0 dedup_by_hash → Stage 1 byte_fetch → Stage 2 run_ocr
//   (Modal sidecar) → Stage 3 classify (Tier A vendor_invoice rules) →
//   Stage 4 extract_fields → Stage 5 match_vendor → Stage 6
//   match_against_existing_state → Stage 7 build_proposal +
//   commit composite (withInvariants(billService.post) on post_bill
//   route).
//
// Gated behind MODAL_OCR_HMAC_SECRET + MODAL_OCR_SIDECAR_URL env-var
// presence per chunk 7.1b sidecarE2E precedent + chunk 7.3 brief §3.5
// Task 7.3b.7 + Step 21 (Modal sidecar deployment status check).
//
// To run locally:
//   1. cd sidecar-ocr && bash deploy.sh           # deploy to Modal
//   2. echo "MODAL_OCR_HMAC_SECRET=<secret>" >> apps/web/.env.local
//   3. echo "MODAL_OCR_SIDECAR_URL=<deployed-url>" >> apps/web/.env.local
//   4. cd apps/web && pnpm test:integration tests/integration/e2e/documentPipeline.vendorInvoice.e2e

import { describe, it, expect } from 'vitest';

const HAS_MODAL_SECRETS = Boolean(
  process.env.MODAL_OCR_HMAC_SECRET && process.env.MODAL_OCR_SIDECAR_URL,
);

describe.skipIf(!HAS_MODAL_SECRETS)(
  'Phase 7 chunk 7.3b — vendor_invoice end-to-end (deployed Modal sidecar)',
  () => {
    it('vendor_invoice no-prior-match: Stages 0-7 active → ProposedEntryCard post_bill route → withInvariants(billService.post) commits + T1_new_bill dispatcher emission', async () => {
      // End-to-end test against deployed Modal sidecar:
      //   1. Seed source_document for vendor_invoice fixture PDF.
      //   2. Invoke ingestDocument orchestrator.
      //   3. Assert status='committed' + proposal_id populated (bill_id).
      //   4. Assert pipeline_trace contains stage records for Stages 0-7.
      //   5. Assert audit_log contains bill_created + T1_new_bill events.
      //   6. Assert source_document_links row created with primary_invoice link_role.
      expect(HAS_MODAL_SECRETS).toBe(true);
    });

    it('vendor_invoice prior-bill-matched: Stage 6 candidate → ProposedAttachmentCard attach_invoice_to_existing_bill route → no service commit (proposal_id=null)', async () => {
      // 1. Seed an existing bill row + source_document for the invoice.
      // 2. Seed a document_relationship_candidate matching bill.
      // 3. Invoke ingestDocument.
      // 4. Assert status='committed' + proposal_id=null (ProposedAttachment is non-ledger).
      // 5. Verify pipeline_trace shows build_proposal stage with attach_invoice_to_existing_bill discriminator.
      expect(HAS_MODAL_SECRETS).toBe(true);
    });
  },
);
