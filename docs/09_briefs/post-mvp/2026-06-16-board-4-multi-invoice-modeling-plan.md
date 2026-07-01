# Board #4 — Multi-Invoice Modeling — Implementation Plan

> **Status:** DRAFT — pending advisor verification + Phil approval. No code
> committed; no prod writes.
> **Authored:** 2026-06-16 (WSL).
> **Design authority (parent):**
> `docs/09_briefs/post-mvp/2026-06-16-board-4-multi-invoice-modeling-design.md`.
> **Buildable-now substrate:** code `main @ b749179d`.
> **Lane:** WSL authors; Phil owns commits + fork locks + prod action.

This plan is **fork-gated**. Per the design §8, the slice-2 cardinality model
depends on **Fork A**, so only **Phase 0 (the detector)** is buildable now;
everything past it is sequenced behind a decision gate or a grounding gate, and
the phase tasks are deliberately coarse until those gates clear. Phases are
listed in dependency order, not necessarily execution-parallel.

---

## Dependency map

```
  Phase 0  Detector            ── buildable NOW (no fork dependency)
              │
  Phase 1  Slice-2 ratification ── GATE: Fork A locked + §10 onset items traced
              │                       (design decision phase; produces a slice-2 build spec)
              ├───────────────┐
  Phase 2  Spine            Phase 3  Slice-2 build
   (Fork C; partly           (GATE: Phase 1 output)
    independent of
    slice-2 cardinality)
```

---

## Phase 0 — Detector (buildable now; the only no-fork-dependency work)

**Goal:** convert the slice-1 no-ledger invisibility (design §2.2) into a typed,
traceable signal at the exact drop point, with **no cardinality change**. TDD.

- [ ] **0.1 — Onset grounding (STOP-SURFACE on divergence).**
  - [ ] Re-read `strandedCaseReadService.ts:179-182` (the `nonImage` pick / drop
        point) and confirm the `≥2 non-image attachments` condition is the right
        predicate for "a real document is about to be dropped."
  - [ ] Resolve design §10 item 4: does the audit emission need an `ACTION_NAMES`
        entry (`canUserPerformAction.ts`) / permission, or ride `recordMutation`
        as a system-actor event? Decide + record inline.
- [ ] **0.2 — Detector (TDD).**
  - [ ] Emit a typed audit event (working name
        `forwarded_mailbox.multi_document_dropped`) when a case resolves with ≥2
        non-image attachments; carry the case_id, the dropped source_document
        ids, and their mime types (non-PII fields only).
  - [ ] Decide the seam: inside `resolvePrimaryIngestSource` vs a sibling
        read-only probe the sync invoker + sweep both call (avoid coupling a
        read-function to an audit write if it violates the read/write asymmetry —
        check service-layer convention at onset).
  - [ ] Unit test: ≥2-non-image → fires; 1 PDF + 1 signature PNG → does **not**
        fire (the airtight 0/13 prod pattern stays silent); single attachment →
        does not fire.
- [ ] **0.3 — Close.** `pnpm agent:validate` green; the detector verified-silent
      against the current prod attachment pattern (1 PDF + signature PNG) in a
      fixture test. Hand to Phil. **Trigger recorded:** first real fire promotes
      slice-1's structural fix from latent → active (design §6).

---

## Phase 1 — Slice-2 ratification (GATE: Fork A + onset grounding)

**Not a build phase — a design-decision phase** that produces the slice-2 build
spec. Cannot start until **Fork A is locked** and the design §10 onset items are
traced first-hand.

- [ ] **1.1 — Lock Fork A** (Phil): one-case-N-bills vs fan-to-N. The lean is
      one-case-N-bills (design §8-A).
- [ ] **1.2 — Trace the case→bill posting path + linkage** (design §10.1):
      first-hand, how an approved `document_case` becomes a `bill` today, and
      whether any case↔bill linkage exists (`bills` has no `document_case_id`
      FK). This is the precondition for choosing the N-home.
- [ ] **1.3 — Pick the N-home** (design §4.3 α/β/γ) against the traced posting
      path + locked Fork A. Record the decision + its interaction with the
      `document_type` single-column persist gap (design §10.2).
- [ ] **1.4 — Define the extraction contract for N** — the extractor must emit
      an **array** of invoices (the board-#2 KEY FINDING: free-text already does;
      structured collapses). Specify the array schema + how it threads the
      existing extraction seam, and the segmentation step (design §4.4 / Fork B).
- [ ] **1.5 — Design the fan** — N structured results → N proposals → N bills
      under the originating case; the audit/idempotency shape for N.
- [ ] **1.6 — Output:** a slice-2 build spec (its own design+plan, or an
      extension of this one) for advisor verification + Phil approval. **No build
      until 1.6 is approved.**

---

## Phase 2 — Spine (Fork C; partly independent of slice-2 cardinality)

**Goal:** make route-uncertain-to-human explicit / typed / instrumented (design
§5), and add explicit handlers for the dangerous-when-uncertain set in Fork-C
lean order. Can proceed in parallel with Phase 1 where it doesn't depend on the
N-model.

- [ ] **2.1 — Make route-to-human explicit + typed.** Replace the incidental
      "Zod-reject → degrade → needs_review" path with a deliberate, reason-coded
      decision; instrument every route-to-human with a typed audit signal (design
      §5.4) so the long tail is measurable.
- [ ] **2.2 — Dangerous-when-uncertain handlers** (Fork C, lean order — Phil
      confirms/locks the set + order):
  - [ ] Duplicate detection (semantic, beyond byte-identical `dedupByHash`).
  - [ ] Bank-detail / remittance-change (fraud-redirect).
  - [ ] Statement-vs-invoice (double-count guard).
- [ ] **2.3 — Defer + instrument the long tail** — everything else routes to a
      human with a reason code; no special-casing (design §5.2).
- [ ] **2.4 — Close.** Each handler covered by tests asserting route-to-human
      fires even under confident extraction; `pnpm agent:validate` green.

---

## Phase 3 — Slice-2 build (GATE: Phase 1 output)

Built strictly against the Phase-1 spec (substrate + extraction contract + fan).
Tasks are intentionally not decomposed here — they are determined by the §1.3
N-home choice and §1.4 contract. Standard chounting build discipline applies:
migration review cadence, NOT-NULL blast radius, Zod-at-boundary, atomic
INSERT-with-audit RPCs, withInvariants wrap-site discipline, integration tests.

- [ ] **3.x** — decomposed in the Phase-1 build spec, not before.

---

## Self-Review (run before handing the brief to advisor + Phil)

- [ ] **Placeholder scan** — every "TBD" is an *intentional* onset/fork item, not
      an unfinished thought; each is listed in design §10 or §8.
- [ ] **Internal consistency** — the cut (option 1), the fork leans, and the
      phase gating agree across design + plan; slice-1 is "detector now, fix
      deferred" everywhere.
- [ ] **Scope** — fork-gated phasing is explicit; no phase past 0 claims to be
      buildable without its gate.
- [ ] **Grounding** — every load-bearing claim in the design carries a `file:line`
      or a re-runnable `SELECT`; nothing asserted that wasn't verified first-hand
      this session (untraced items are flagged in §10, not stated as fact).
- [ ] **Lane** — no commits, no prod writes, no fork pre-decided.
