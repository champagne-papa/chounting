# Board #4 Fork C — Stage-5.5 route-to-human vs. Phase-4 attachment seam (dup over-fire fix)

**Date:** 2026-07-22
**Status:** Design — operator-approved direction (Option 1 + accept documented override gap), pending spec review → plan.
**Arc:** Board #4 Fork C, post-tranche-3. Remediates a regression introduced by tranche 1 (semantic-dup, `612b05a9`), surfaced by the first full-suite run at push-readiness.
**Push posture:** `feat/board-4-fork-c` (4 commits) is HELD from origin until this lands green.

---

## 1. Problem (grounded first-hand)

The semantic-duplicate handler (Fork C tranche 1, Stage 5.5) **over-fires**: it preempts the
Phase-4 attachment/match path (Stage 6) for a first-arrival invoice whose `(vendor_id,
bill_number)` matches a live bill, routing it to a human under `duplicate_invoice_suspected`
instead of letting it attach. This **breaks INV-WORKFLOW-002** — specifically the Wave 6 D2.1 T4
**"ATTACHMENT EXIT"** governance behavior: a first-arrival invoice against an existing bill is
*designed* to route as a matched attachment with the head pointer
(`document_cases.current_relationship_candidate_id`) set, then park at `needs_review`.

Evidence:
- `tests/integration/routingTerminalDisposition.integration.test.ts` — "ATTACHMENT EXIT (bill
  seeded)" fails at line 381 (`current_relationship_candidate_id` is `null`, expected not-null).
  Line 380 (`state === 'needs_review'`) passes — the case reaches `needs_review` via the dup
  exception, but **without** the head pointer because Stage 6 was skipped.
- **Deterministic in isolation** (1 failed / 4 passed running the file alone) — not full-suite
  ordering.
- The runtime log confirms the cause first-hand: `"exception_reason":"duplicate_invoice_suspected"
  ,"msg":"Exception enqueued"`.
- The test file is **byte-unchanged** on the branch (`git diff origin/main..HEAD` empty) and
  **passes on origin/main** (no handler, no dup enum) → the Fork-C arc introduced it, latent until
  the first `test:full`.

## 2. Root cause

The dup handler's trigger — `(vendor_id, bill_number)` matches a live (non-voided/cancelled) bill,
plus a matched vendor and an extracted invoice number — is **also the precondition for a
legitimate first-arrival attachment**. From `(vendor, number)` alone the handler cannot tell a
**re-book duplicate** (a second document arriving for a bill already sourced from a prior document)
from a **first-arrival attachment** (the first document for a bill created another way — manual
entry, PO conversion). It collapses a *designed two-outcome routing* (attach vs. duplicate) into
one.

**Shared-seam context (why this is a seam design, not a one-off patch).** All three Stage-5.5
route-to-human handlers (bank-detail, statement, dup) short-circuit **before Stage 6**
(`documentRouterService.completeCandidate`) — the dup failure *proves* this ordering (Stage 6
skipped ⇒ null head pointer). So structurally any of the three firing on a would-attach document
preempts the attachment path. But the triggers differ **in kind**:

- **Dup is intrinsic/acute:** its trigger *is* bill-existence, the exact attachment precondition
  → it collides with the attachment invariant on the core attachment scenario. It asserts *document
  identity* ("this is the same invoice already booked"), which is **false** for a first-arrival
  attachment → a **wrong disposition**, a correctness defect.
- **Bank-detail & statement are conditional/latent:** their triggers (fraud-coordinate shape /
  statement shape) are **orthogonal** to bill-existence — claims about the *document's own content*
  that stay true whether or not it would also attach. They collide only in the narrow intersection
  *(OCR-trigger ∧ matches-a-live-bill)*, which **no existing test exercises** (confirmed: of the 5
  tests asserting the head-pointer/`'matched'` invariant, none carry a bank-detail or statement OCR
  marker; `test:full` showed only the dup collision).

## 3. The discriminator (grounded)

The signal that distinguishes re-book from first-arrival attachment is **bill provenance: was the
matched bill sourced from a document?** The precise, groundable form of that signal:

> **The discriminator is: the matched bill has a LIVE (`link_status='created'`) `primary_invoice`
> `source_document_links` row — full stop.**

Everything else in the envelope (§5) derives from that single predicate.

- **Representation:** a `source_document_links` row with `linked_entity_type='bill'`,
  `linked_entity_id=<bill_id>`, `link_role='primary_invoice'`, `link_status='created'` — **not** a
  column on the bill. `BillRow` has no `primary_document_id` field. So the check is a **join /
  second-read into `source_document_links`**, keyed by `(linked_entity_id, link_role=
  'primary_invoice', link_status='created')`. Migration `20240147` provides
  `source_document_links_entity_status_idx` on `(linked_entity_type, linked_entity_id,
  link_status)` — the lookup lands on it.
- **Why `link_status='created'` is load-bearing, not a nicety (grounded, `20240147`):** links are
  **never deleted — they are reversed** (a one-way `link_status` flip `created → reversed`, enforced
  by the GRANT + a trigger). When a bill is voided,
  `reverse_source_document_link_with_audit` **bulk-flips** its `primary_invoice` links to
  `reversed`. So a voided bill still carries a `primary_invoice` row — just `reversed`. A
  discriminator that queried link-*existence* without `link_status='created'` would read that stale
  reversed link as "document-sourced → fire" and flag a legitimate **re-book-after-void** as a
  duplicate — re-introducing an over-fire on exactly the population the dup handler's own
  non-voided/cancelled lifecycle filter was built to exclude. The provenance filter and the
  lifecycle filter **must agree**; `link_status='created'` is what makes them agree. (Belt-and-
  suspenders given `findLiveBillByVendorAndNumber` already excludes voided/cancelled bills — but the
  predicate is required for correctness, not optional.)
- **Write site + enforcement (INV-DOC-001):** `billService.post` takes `primary_document_id` as an
  *input*, **requires** it (throws `EVIDENCE_INCOMPLETE`) unless `override_evidence_completeness=
  true`, and on a non-override commit writes the `('bill','primary_invoice')` link via
  `createSourceDocumentLink` → `create_source_document_link_with_audit` (link created by the
  **service**, not by any DB default) (`billService.post:401‑416`). The pipeline passes it
  (`ingestDocument` sets `primary_document_id = input.source_document_id`). So a normally-committed
  bill **always** carries a live `primary_invoice` link; a manual/PO bill, or any commit path that
  doesn't route through `billService.post`, or an override commit, does not.
- **Grounding provenance:** the pair-validity CHECK (`('bill','primary_invoice')` first pair), the
  v1-active `linked_entity_type`/`link_role` enums, the `link_status` reversal mechanism + the
  `create`/`reverse` RPCs, and the `entity_status` index are grounded first-hand from `20240147`
  (advisor). The service-side write + INV-DOC-001 enforcement + the override bypass are grounded
  from `billService.post`.

**Honest gap (the override edge).** The discriminator is precisely *"has a live (created)
`primary_invoice` link,"* which is a **proxy** for *"is document-sourced."* They diverge on
`override_evidence_completeness=true` commits, which carry no link. So a genuinely-document-sourced
bill committed via override reads as "manual" → the dup handler would **not** fire on its
re-arrival → a real duplicate could slip (an **under-fire**, the inverse failure). This is accepted
(§6).

## 4. Design — Option 1 (operator-approved)

The three handlers answer different questions, so they get different treatment.

**4.1 Dup — provenance gate (the correctness fix).**
Fire the dup handler **only if the matched bill has a LIVE (`link_status='created'`)
`primary_invoice` `source_document_links` row** (→ document-sourced → a matching new invoice is a
re-book). If no such live link exists (manual/PO/override origin, or a voided bill's `reversed`
link), the match is a legitimate first-arrival attachment → **do not fire; fall through to Stage 6**
so `completeCandidate`/`resolveCandidates` set the head pointer and route the attachment normally.

Mechanism (to be settled in the plan): either
- extend `findLiveBillByVendorAndNumber` (`extractionReadService`) to also report an
  `is_document_sourced` flag via a join on `source_document_links` filtered
  `link_role='primary_invoice' AND link_status='created'`, or
- a follow-up read keyed on the returned `matched_bill_id` with the same predicate.

The join option keeps the read atomic and single-round-trip; the plan picks one and grounds the
exact `source_document_links` columns. **Either way the `link_status='created'` predicate is
mandatory** (§3).

**4.2 Bank-detail & statement — unchanged (the disposition is already correct).**
Their route-to-human is the **right** disposition even in the would-attach case: a
remittance-coordinate-bearing or statement-shaped document is one a human should see *before* it
attaches — the fraud/statement concern does not dissolve because a matching bill exists. A uniform
provenance-gate (rejected Option 2) would **silence a fraud-coordinate or statement-shaped document
into a silent attachment**, inverting the safety posture the spine exists for. Their only cost is
the **lost head pointer** — a convenience loss, not a wrong answer. That head-pointer preservation
is **deferred, not dropped** (§7). Each handler's comment records the intentional *"routes to a
human even when the document would also attach."*

## 5. Coverage envelope (one predicate, four consequences)

**The discriminator is: has a live (`link_status='created'`) `primary_invoice` link — full stop.**
The whole envelope derives from that single fact, so a later reader sees one predicate with four
consequences rather than a list that looks like special-casing:

- **Catches** (has a live link → document-sourced): a different-bytes re-arrival of an invoice whose
  `(vendor, bill_number)` matches such a bill → dup fires.
- **Delegates upstream** (never reaches the handler): byte-identical re-arrivals → Stage-0
  `dedupByHash`.
- **Correctly defers** (no live link → not document-sourced): first-arrival attachments to a
  **manual**, **PO-conversion**, **override-committed**, or **voided (reversed-link)** bill → falls
  through to Stage 6 and attaches with the head pointer set. Three of these are exactly right.
- **Accepts missing** (no live link, but *was* really an invoice): the one case where "no live link"
  is *wrong* about provenance — a genuinely-document-sourced bill committed via
  `override_evidence_completeness=true` → its re-book re-arrival is not caught. §6.

Signed off as an **envelope**, not a marginal gap — the two accepted blind spots (byte-identical
delegated to Stage-0; override re-book accepted here) are the net's shape, named so nobody
re-derives them.

## 6. Accepted gap — override-committed re-book miss

**Decision (operator-approved): accept it, documented in the coverage envelope above.**
Rationale: this is a route-to-human safety net whose job is the common case; the miss requires an
operator to have taken the `override_evidence_completeness` escape hatch — already a deliberate "I'm
committing without evidence" act. Closing it would pull the dup handler into second-guessing an
explicit operator override — the wrong place to enforce it. The acceptance is of the **combined**
envelope (§5), not a line-item: the discriminator's real predicate is "has a live `primary_invoice`
link," and manual / PO / override / voided all fall out of that one fact — three correctly
(defer→attach) and override-of-a-real-invoice as the accepted miss.

## 7. Deferred / out of scope

- **Bank-detail & statement head-pointer preservation.** Recovering the lost candidate pointer for
  those two (so a route-to-human case still carries its attachment candidate) is the Option-3-style
  change: run/record the Stage-6 match **before** the route-to-human short-circuit. That reorders
  Stage 6 ahead of the route-to-human decision and **re-touches the two-step-park state machine**
  (`PIPELINE_ORDER`; the `enqueueException` precondition requiring `classified|matched`; the
  reprocess no-op). It is **not** adopted here; it is reached as a *finding* only if the lost head
  pointer proves to materially harm human reconciliation. Tracked as a follow-up.
- **Seam-wide reorder (full Option 3).** Same reason — a larger state-machine change owed its own
  design if pursued.

## 8. Definition of done (tests — the durable output)

The grounding-gap lesson this whole episode taught: grounding a route-to-human handler as *"fires
on the danger case + negative control runs the pipeline"* is necessary but **not sufficient** — the
missing axis is *"does NOT fire on the adjacent legitimate case that shares the trigger
signature."* That assertion is the acceptance criterion, not just the code fix.

1. **Must-not-fire guard test (dup) — linked vs. unlinked.** Seed **both**: a bill with a live
   `primary_invoice` link on the signature (dup **must** fire — real re-book) **and** a raw/unlinked
   bill on the same signature (dup **must not** fire — legitimate attachment → falls through). The
   **linked fixture must seed the link via the real `create_source_document_link_with_audit` RPC
   (or `documentLinkService.create`)**, not a raw `source_document_links` insert — so it exercises
   the actual `('bill','primary_invoice','created')` write path the discriminator reads, at the
   fidelity the pipeline produces (same fixture-fidelity lesson as the Tier-A-sufficiency one banked
   this arc).
2. **Reversed-link must-not-fire case (the predicate guard).** A bill whose `primary_invoice` link
   has been **reversed** (via `reverse_source_document_link_with_audit`, i.e. the voided-bill path)
   → dup **must not** fire. This is the test that catches a loose implementation that queried
   link-existence without `link_status='created'`; it belongs in the definition of done precisely
   because it guards the §3 correctness predicate. (Nothing currently tests it.)
3. **Governance invariant, green for the right reason.** `routingTerminalDisposition` "ATTACHMENT
   EXIT" must pass **because** the raw-seeded bill reads as manual (no live link) and **Stage 6
   attaches with `current_relationship_candidate_id` set** — verified as an assertion (the head
   pointer + the `'matched'` transition), not a green count.
4. **Upgrade the dup positive test's fixture.** The current `semanticDuplicatePipelineWiring`
   positive test seeds a raw bill; under the fix that stops triggering dup. Its fixture upgrades to
   a **document-sourced (live-linked)** bill (via the RPC per obligation 1) so it still exercises
   the re-book path.
5. **Bank-detail / statement** get an analogous *"matches a live bill AND carries the OCR
   trigger"* case asserting the settled disposition (routes to human; head pointer deferred).
6. **Override miss is documented, not tested-as-caught** — it is an accepted envelope hole, not a
   guarantee.
7. **`test:full` green** at HEAD (the pre-existing baseline item — the `ReviewCaseDetailView`
   stale-text divergence — handled per its own carry-forward; not reintroduced).

## 9. Governance

- **No ADR required.** The fix **restores** a canonical invariant (INV-WORKFLOW-002); it does not
  deviate from a ratified doc. (The dup handler was added at tranche 1 without reconciling
  `routingTerminalDisposition`; this closes that.)
- **Convention candidate (already banked):** the *must-not-fire-on-legitimate-adjacent-case* test
  discipline for route-to-human handlers — carry alongside the N=4 Tier-A-fixture codification at
  Fork-C arc-close.
- The seam principle (route-to-human handlers must not preempt the Phase-4 attachment path for a
  legitimately-attaching document; provenance — a live `primary_invoice` link — is the dup
  discriminator) is recorded here as design rationale; whether it graduates to a convention is an
  arc-close question.

## 10. Lane seam (grounding provenance)

- **Grounded first-hand (WSL, execution/read):** the `routingTerminalDisposition` failure + isolation
  reproduction + the `duplicate_invoice_suspected` log line; the empty branch-diff; `test:full`'s
  2-failure result and the head-pointer-test survey; `billService.post` INV-DOC-001 enforcement + the
  `source_document_links` write (not a bill column) + the override bypass; `ingestDocument` passing
  `primary_document_id`; the `('bill','primary_invoice')` enum pair.
- **Grounded first-hand (advisor, `20240147` substrate):** the pair-validity CHECK, the v1-active
  enums, the **`link_status` reversal mechanism** (created→reversed, never deleted; the voided-bill
  bulk-flip), the `create`/`reverse` RPCs, and the `entity_status` index — the source of the §3
  `link_status='created'` predicate and the §8 RPC-seeded / reversed-link obligations.
- **Remaining to ground at build:** the exact `source_document_links` column set the join reads
  (§4.1 mechanism decision); confirm no code path auto-creates a link on override (the `20240147`
  read shows the link is service-created, consistent with the gap being exactly where §6 says).
- **Product/data, ungrounded by design:** the override-committed-bill population size — not
  determinable from code; the acceptance in §6 does not depend on it.

## 11. Open questions for the plan

1. Join in `findLiveBillByVendorAndNumber` vs. a follow-up read (§4.1) — pick one, ground the
   `source_document_links` column set. **The `link_status='created'` predicate is mandatory in
   either.**
2. Exact placement of the provenance check relative to the existing dup guard triple
   (`documentCaseId && documentType==='vendor_invoice' && vendorMatch.vendor_id &&
   extractedInvoiceNumber`) and the `findLiveBillByVendorAndNumber` call.
3. Confirm the reprocess-safety / two-step-park behavior is unaffected (the dup handler now
   *not-firing* on unlinked bills means those cases proceed to Stage 6 — verify no residual).
