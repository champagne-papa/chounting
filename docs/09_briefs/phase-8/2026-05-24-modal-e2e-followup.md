# Modal-e2e seeded scenarios — run outcome (auto-commit arc follow-up)

*2026-05-24. The deeper-coverage follow-up to the auto-commit arc: exercise
the 3 fixture-covered deferred scenarios end-to-end through **real Modal OCR**
+ seeded ledger state. The Option II gate (`autoCommitGate.integration.test.ts`)
validated the commit path with **synthesized** fields; this run validates it
through the **real relationship scorer against real OCR**.*

## What was run

`RUN_MODAL_E2E=1` (sequential, `--no-file-parallelism` to avoid concurrent
duplicate-vendor ambiguity) on the 3 `documentPipeline.*.e2e.test.ts` files.
The 3 demo fixtures (Figma invoice, Figma receipt, Zoho payment) classify via
**Tier A** per the corpus, so the run was **Modal-OCR-only (no Claude)**.
Cost: **~$0.05–0.15** (one ~129s cold-start + warm calls). Seeds (matched to
`corpus.sanitized.ts`): vendor `Figma, Inc.` (GST `100000000RT9999`) + an
approved open bill (`1ABCD23M-0001` / cited `1ABCD23M0001`) / a paid payment,
all CA$282.24.

## What happened per scenario

| Scenario | Outcome |
|---|---|
| receipt matched-payment → attach → `proposal_id=null` | **PASS** — a payment-candidate generated (linked_entity_id present); attach route → null. |
| vendor_invoice prior-bill-matched → attach → `proposal_id=null` | **FAIL** — no bill-candidate generated against the seeded open bill. |
| payment_confirmation cited-bill → record_bill_payment → `proposal_id=payment_id` | **FAIL** — no bill-candidate → `billId` unresolved → no commit (`proposal_id=null`). |
| (3 unseeded baselines) | PASS (unchanged). |

## What we learned (the finding)

Only **one** relationship candidate was generated across the whole run — the
receipt→payment candidate, at **confidence 0.25**. The vendor_invoice→bill and
payment_confirmation→bill matches produced **no candidate at all**.

- **Relationship-candidate generation against seeded ledger state is weak /
  inconsistent on real OCR.** Bill-candidate generation (the path the two
  failing scenarios + auto-commit-via-real-OCR depend on) did not fire;
  payment-candidate generation fired but scored only 0.25. Note this is **not**
  a confidence-threshold issue — emission is not threshold-gated (0.25 < the
  0.80 receipt threshold, yet it emitted), so an earlier "fuzzy-match below
  0.85" hypothesis was wrong and corrected by querying the emitted candidates.
- The auto-commit **gate (ADR-0007 Q78) remains satisfied** by the Option II
  integration test, which bypasses matching with synthesized extracted fields.
  This run shows the deeper, real-OCR matching path is **not yet reliable for
  bill-routing**.
- **Root cause deferred** (not fix-forward): the per-doc-type vendor-match
  outcome + `scoreComposition` inputs for bill candidates need investigation.
  Friction-journal 2026-05-24.

## Disposition

- **receipt scenario: kept unskipped** (passes; validates payment-candidate
  generation + attach routing on real OCR).
- **vendor_invoice + payment_confirmation cited-bill: re-skipped** (`it.skip`)
  with the finding; bodies preserved + ready to re-enable once bill-candidate
  matching is investigated.
- The **2 NEEDS-FIXTURE scenarios** (no-cited-bill payment, born-paid) remain
  `it.skip` — no existing fixture drives them.

Harness extensions (`seedVendor` / `seedApprovedBill` / `seedPayment` /
`getCandidatesForCase` / `getPaymentById` / `cleanupSeededVendor`) are durable
test infrastructure regardless of scenario outcomes.
