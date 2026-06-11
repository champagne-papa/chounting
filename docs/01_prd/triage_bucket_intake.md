> **STATUS — SUPERSEDED 2026-05-16**
>
> This triage-bucket-intake-rail vision is superseded by the
> chat-input drop entry-point shipped at Phase 6.5 amendment
> cycle (cycle closeout 2026-05-16 at commit 79a6ceb).
>
> Per Phase 6.5 substrate cuts:
>
> - Cut 1 (Flow (a) substrate exclusively at v1; Flow (b)
>   deferred past v1)
> - Sub-Q4 lock (DocumentIntakeRail removed entirely;
>   PendingDocumentsView ports the `idle_with_recent_cards`
>   state machine to chat-drop entry-point at Phase 6.5 chunk 3)
> - Sub-Q9 lock (staged-with-explicit-ingest at chat input;
>   tray above input per Sub-Q9.b.α; unified Send fires both
>   ingest + chat message per Sub-Q9.c.α)
> - Sub-Q11 Cut 9 (drop opens new canvas tab with
>   PendingDocumentsView per Pattern γ source-driven routing)
>
> The intake-rail vision in this document operated on Phase 2
> brief-stub grain (2026-04-16 capture; not yet scoped, not
> yet specified beyond this stub). Phase 6.5 reframed intake
> as chat-input-drop entry-point per token-economy reframe
> (cycle closeout brief §2.1) — backend-routing-driven AI
> agent invocation on document drop, not UI-rail-driven.
>
> The PendingDocumentsView state machine
> (`idle_with_recent_cards` / `showing_batch` transitions)
> inherits semantic structure from this document's vision-of-
> pending-mutations-moving-into-Lifecycle-View. Implementation
> in Phase 6.5 chunk 3 per chunk-3 brief (Session 11; not yet
> drafted).
>
> Cross-reference: cycle closeout brief at
> `docs/09_briefs/phase-6.5/2026-05-16-document-drop-and-shell-consolidation-scope-lock-cycle-close.md`
>
> This `triage_bucket_intake.md` document preserved as
> historical record per ADR-0022 §2 supersession discipline.
> All content below this header is unchanged.

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
