# Phase 8 Dedicated Fix Chunk — Close Report (Tier A real-OCR recalibration, Sub-option E)

- **Status:** impl-COMPLETE (Tasks 1–8).
- **Sessions:** brief Session 70 (`f913c73`) → impl Session 71 (Tasks 1–4+6) → impl-validation Session 72 (Tasks 5+7) → close Session 73 (Task 8).
- **Brief:** `docs/09_briefs/phase-8/chunks/2026-05-23-phase-8-dedicated-fix-chunk-tier-a-real-ocr-recalibration.md`
- **Branch:** `staging`, banked locally (no push; Candidate #13 push fires at Phase 8 retro close).

## §1 — Outcome

The chunk restored Tier A's designed high-precision-low-recall property
(ADR-0014 §7). Session 68 found Tier A misclassifying 2 of 3 real demo
docs as `vendor_invoice` (over-matching field-label cross-references like
"Invoice number" / "Bill Number"). Sub-option E: tighten Tier A precision,
arbitrate conflicts in coordination, and lean on the already-robust Tier C
(Claude) fallback for the residual — **not** broaden positives (which would
overfit N=3).

Result: on a 10-doc real-OCR corpus (3 demo + 7 founder-supplied from
different vendors/formats), Tier A produced **zero misclassifications** —
7 correct, 3 abstain → Tier C. The fix generalized beyond the calibration
trio and never guessed wrong.

## §2 — What shipped (per-task commits)

| Task | Commit | Substance |
|------|--------|-----------|
| 1 | `e6bc7d0` | `vendorInvoiceRules` — field-label negative-lookahead positives + document-kind-defining negatives (stop the over-match) |
| 2 | `6b419cd` | `receiptRules` — "Receipt" title + paid-signal carve-out (skips invoice cross-ref suppression) |
| 3 | `91003ba` | `paymentConfirmationRules` — voucher-header positives ("PAYMENTS MADE", "Amount Paid", "Payment Date/Mode") |
| 4 | `e94b688` | `tierCoordination` — asymmetric precedence (receipt/payment outrank vendor_invoice on multi-match) |
| 6 | (folded) | unit coverage folded into Tasks 1–4 per TDD-throughout |
| 7 | `f46c605` | chunk 1 demo re-fire evidence (3-of-3, correct per-type via Tier A) |
| 5 | `ed7f6a4` | real-OCR fixture corpus + `evaluateTierA` seam + corpus regression test |

Tier C `aiFallback.ts` unchanged (already robust; this chunk only causes
it to actually run for residual formats).

## §3 — Close gate (Task 8)

- `pnpm typecheck` — green.
- `pnpm test` — 1385 pass / 0 fail / 2 skipped (the brief's "acceptable"
  pre-existing StorageApiError does not occur on a clean DB).
- `pnpm agent:validate` — 26/26 green (incl. no-hardcoded-URLs grep + 5
  Category A floor tests).
- **Chunk 6 substrate-readiness gate 1 SATISFIED** — chunk 1 demo re-fire
  3-of-3 `committed` with correct per-type classification (Session 72).

## §4 — Overfit-guard validation (the load-bearing result)

10-doc real-OCR corpus through Tier A (`classifierRealOcr.integration.test.ts`):

| outcome | docs |
|---------|------|
| correct via Tier A (7) | demo×3 + mattjanzen_invoice, amazon_invoice, delara_receipt, bestbuy_receipt |
| abstain → Tier C (3) | adobe_invoice, mattjanzen_receipt, mattjanzen_payment |

Zero misclassifications. 4 of 7 founder docs classified correctly via Tier A
(generalization beyond the calibration set); the other 3 abstained rather
than guess wrong (low-recall by design → Tier C).

## §5 — Carry-forward to Phase 8 retrospective

- **Tier C classification remains empirically unexercised.** Tier A handled
  the demo trio; the corpus test is Tier-A-only. The 3 abstaining docs above
  are what would exercise Tier C in the real pipeline — running them through
  full `ingestDocument` (real Claude) would be the true Tier C exercise.
- **Demo runner is hardcoded** to the 3 demo PDFs + writes to the Phase 7
  output path (copy to Phase 8 + restore Phase 7 artifact each run).
- **PII**: `real-ocr/corpus.ts` holds founder-authorized real business-record
  text (names, GST#, amounts); source binaries git-ignored. Push deferred to
  ~Session 77 retro — scrub window open until then.
- **Two test-first refinements banked** (Session 71): dropped `#` from the
  invoice/bill exclusion (over-restriction would regress "Invoice #12345");
  precedence red-tests use a synthetic "Statement" multi-match (post-Tasks-1-3
  the 3 real fixtures single-match).
- **Task 7→Task 5 ordering inversion** (Session 72): the Session 71 `db:reset`
  wiped the demo OCR, so the demo had to repopulate it before capture.
- `document_cases.document_type` stays `'unknown'` on demo runs — by design
  (case-state write out of scope per brief §2.2/§3.4), not a bug.
