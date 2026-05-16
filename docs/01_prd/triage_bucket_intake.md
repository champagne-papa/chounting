# Triage Bucket Intake — Phase 2 Brief

A vertical intake rail on the far right of the canvas. Users
drag-and-drop raw files (PDFs, emails, scanned receipts) into the
Bucket. The agent picks them up, OCRs them, and as each file is
processed it visually moves from the Bucket into the Pending
column of the Mutation Lifecycle view. The user sees work
progressing in real time from raw input to proposed mutation.

Before data hits the agent, it is usually a mess of PDFs and
emails sitting in the user's inbox or on their desktop. The
transition from "I have receipts" to "I have journal entries for
those receipts" is opaque in traditional accounting software —
the user uploads and waits without feedback. The Triage Bucket
makes the processing visible and stoppable: the user can see
which files are queued, which are being processed, and which
have produced draft entries.

**Status:** Phase 2 pattern, captured during the agent autonomy
design sprint (2026-04-16). Not yet scoped, not yet specified
beyond this stub.

## What this is NOT

- Not an OCR or extraction service itself — the OCR/extraction
  is a separate Phase 2 tool that the Bucket surfaces rather
  than replaces. The Bucket is a UX pattern, not a pipeline.
- Not a persistent inbox — files sitting in the Bucket are
  transient; once processed, they move to the Lifecycle View
  as Pending mutations.
- Not a replacement for file attachment on individual journal
  entries (see the existing `journal_entry_attachments` schema
  reservation in `docs/02_specs/data_model.md`).

## Cross-references

- `docs/02_specs/mutation_lifecycle.md` §2 and §5 (Pending
  state, Lifecycle View — the destination for processed files).
- `docs/07_governance/adr/0004-ghost-rows-visual-contract.md`
  (draft rows produced by the Bucket honor the four-signal
  contract).
- `docs/07_governance/friction-journal.md` entry 2026-04-16.
