# real-ocr/source-pdfs/ — founder document drop target

Drop point for the Phase 8 dedicated-fix-chunk Task 5 real-OCR fixture
corpus (Sub-option E overfit guard). Created at Session 72 Phase A.

## What to drop here

~2-3 **real** documents per type, from **different vendors/formats** than
the Figma/Zoho demo set (self-dogfooding per Session 69 open-decision-1):

- **vendor_invoice** — e.g. a non-Figma SaaS / hosting / tooling bill.
- **receipt** — e.g. a retail or restaurant receipt.
- **payment_confirmation** — e.g. a bank or e-transfer confirmation.

Different vendors/formats are the point: validating against the same 3
fixtures the rules were tuned on (Session 71) would be circular and would
not exercise the overfit guard.

## What happens next (Task 7 → Task 5, inverted ordering)

The Session 71 `db:reset` wiped the Session 68 demo OCR, so the demo's
real `document_artifacts.lines` must be repopulated before capture:

1. **Task 7** — re-fire the demo (`apps/web/scripts/phase-7-v1-close-demo.ts`)
   against the real Modal sidecar; this repopulates real OCR for the 3
   demo docs and is the first real Tier C exercise.
2. **Task 5** — run these dropped PDFs through OCR, capture the line-text
   of all docs (demo + dropped) into committed `real-ocr/*.ts` fixtures,
   and extend the `classifier*.integration.test.ts` corpus assertions.

## Privacy note (resolve at capture time)

These are real documents and may contain personal/financial data. Only the
captured OCR **line-text** goes into committed `.ts` fixtures — decide at
capture whether the source PDFs themselves should be committed or
`.gitignore`d (and whether any line-text needs redaction).
