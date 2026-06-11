# A-now Hotfix — Part A Change-Spec (Wave -1 bleed-stop)

**Status:** DRAFT for review · 2026-05-31 · anchored at HEAD `7cb68895` (staging)
**Authorizing governance:** ADR-0007 §Tier 2 "V1 re-scoping of the Q78 auto-commit
exercise" (ratified 2026-05-31, commit `7cb68895`). This spec is the *enacting
change* that amendment named.
**Scope:** Part A only (stop the auto-post; park in `received`). Parts B/C and
decisions D2/D3 are recorded as Wave 6 (§7 below). No new capability; no toggle.
**Lane:** change-spec authored for review before implementation; implementer applies
against the seams cited to the line.

---

## 1. Objective

Stop the document-ingest pipeline from auto-posting bills/payments without a human.
The bleed is **wrong ledger entries** from ungoverned auto-post (hardcoded coding,
no rung/confidence gate). Part A neutralizes the post entirely. It does **not** route
to a review surface — that is illegal from the current case state and has no UI to
land in (both Wave 6); see §2.

## 2. Why this is "stop + park," not "route to needs_review" (load-bearing finding)

Verified end-to-end at HEAD `7cb68895`:

- The pipeline **never manages `document_cases.state`** — zero `transition()` /
  `update_document_case_state_with_audit` / `enqueueException` calls in
  `ingestDocument` or its stages. (The `'committed'` strings at
  `ingestDocument.ts:204/489/506/520` are the `IngestDocumentOutput.status` enum, not
  the case-state machine.)
- The case is in **`'received'`** at the commit composite: `ingestionService` creates
  it `state:'received'` (`ingestionService.ts:300, :685`; `createDocumentCase` →
  `'received'`, `documentCaseService.ts:93`) and nothing advances it.
  `resolveCandidates` is what drives `classified → matched`
  (`documentRouterService.ts:1599`) and enqueues exceptions, but the pipeline calls
  only `completeCandidate` (Subsystem 1, `ingestDocument.ts:314`) — `resolveCandidates`
  is never invoked inline.
- `received → needs_review` is **illegal**: `LEGAL_TRANSITIONS.received = ['extracting']`
  (`documentCaseService.ts:31`); `→needs_review` is legal only from `classified` /
  `matched` (`:33–34`). The RPC enforces the matrix (23514). `enqueue_exception_with_audit`
  *also* requires `classified|matched` source state (`documentExceptionService.ts:54–55`),
  so the silent-drop→exception path hits the same wall.

Therefore: routing to `needs_review` requires either driving the case through the
matrix (Wave 6 work) or amending the ADR-0011 §3 matrix (governance + migration) —
neither belongs in a bleed-stop. And there is no review UI to surface into
(`documents/cases` API is GET-only; no review route — verified). Part A parks the
document in `received` (unposted, no ledger write); review-surfacing lands in Wave 6
together with the legal transition path.

## 3. The change (to the line)

### 3.1 Add an honest return status (`types.ts`)
`IngestDocumentOutput.status` is currently
`'committed' | 'dedup_short_circuit' | 'pipeline_failed' | 'deferred_chunk_7_3b_pending_activation'`
(`types.ts:62–69`; the last is `@deprecated`). None fits a parked-unposted doc —
`committed` is a status-lie, `pipeline_failed` is false (the pipeline succeeded; it
declined to post by policy), the deprecated value is about chunk activation. **Add a
new additive member** `'parked_unposted'` (additive per ADR-0022, consistent with the
file's own precedent for the deprecated member). JSDoc it: parked by the Wave -1 A-now
bleed-stop; no ledger write; case remains in `document_cases.state='received'`;
cross-ref ADR-0007 §Tier 2 Q78 V1-re-scoping block. `proposal_id` is `null` and
`failure_class` is `null` on this status.

### 3.2 Neutralize the post in the two matched branches (`ingestDocument.ts`)
At the commit composite (`ingestDocument.ts:482–524`):

- **`proposed_entry_card` branch (`:482–494`):** remove the
  `commitProposedEntryCard(...)` call (its `:551`/`:560` `withInvariants(billService.post)`
  / `paymentService.record` posts). Return
  `{ status: 'parked_unposted', pipeline_trace, proposal_id: null, failure_class: null }`.
- **`proposed_mutation_bundle` branch (`:513–524`):** remove the
  `commitProposedMutationBundle(...)` call. Return the same parked shape.

Unconditional — **no feature flag / toggle** (a bleed-stop must not be flippable back
on by accident; per the architect refinement and the amendment's "not behind a
toggle").

### 3.3 Preserve the commit machinery (do not delete)
`commitProposedEntryCard`, `commitProposedMutationBundle`, and their transitive
helpers (`buildPostBillInput`, `buildRecordPaymentInput`,
`buildPostBillInputFromChildMutation`, `lookupBillCommitDefaults`) are **retained,
unreferenced**. They are the exact mechanism governed auto-commit re-wires to post-V1
(the four prerequisites in the ADR-0007 Q78 amendment: rung + confidence + eval + real
coding). Deleting them would force a rebuild later.

Because they become unreferenced, expect a lint/`tsc` unused-symbol signal. Handle it
**without deleting** — two acceptable mechanisms (implementer/architect pick):
- (a, minimal-diff) leave them in place with a block comment
  `// PRESERVED FOR POST-V1 GOVERNED AUTO-COMMIT — re-wired behind the gate per ADR-0007
  §Tier 2 Q78 V1-re-scoping block; intentionally unreferenced during the Wave -1
  bleed-stop` plus the minimal `eslint-disable` the repo's rules require (consistent
  with the repo's "comment explaining why" convention).
- (b, cleaner-but-larger) extract the cluster into a dedicated module (e.g.
  `extraction/commitComposite.ts`), imported but not called, so the "post-V1 re-wire
  point" is a single named seam.

**Decided: (a) annotate-in-place** (ratified by review 2026-05-31). Rationale: a Wave -1
bleed-stop should be minimal and surgical — smallest diff, easiest to review. (b) is
premature: the post-V1 re-wire (governed auto-commit, behind the gate, after eval +
real coding + gate-deciding land — the V2 track) is far off and its seam shape isn't
known yet; extracting now bakes in a guess, against Simplification-3 ("don't generalize
until the real consumer informs the shape"). (a) does not preclude (b): when governed
auto-commit is actually built, that work extracts to a module as part of its own
properly-scoped change. Either way, **machinery preserved, call neutralized.**

### 3.4 Out of scope — unchanged
- `proposed_attachment_card` branch (`:496–511`): non-ledger (ADR-0011 §11), emits via
  canvasDirective, no `withInvariants` post. Not a ledger write — **unchanged.**
- `unknown` short-circuit (`:206–213`): non-ledger, returns `committed`/`proposal_id:null` —
  pre-existing, **unchanged.**
- Ring 2B shadow eval (`:445`), and the Q78 auth mechanism (system-actor
  `withInvariants` bypass + Path X) — **unchanged.** Part A re-scopes *whether* the
  post fires, not *how* the auth model works.

### 3.5 Audit consumers of the new status (don't break or lie while fixing)
Adding `parked_unposted` is additive at the type, but consumers must (i) handle it where
they switch on `status`, and (ii) not move the status-lie up a layer (a route must not
report "bill posted" now that matched ingests come back `parked_unposted`).

**Audit at HEAD `7cb68895` — the ripple is contained (verified, not assumed):**
- The only reader of `IngestDocumentOutput` is `ingestDocument` itself (the writer);
  other mentions are comments in `proposalBuilder.ts`. **No production `switch(status)`
  exists** on this type.
- **Exactly one production caller** invokes `ingestDocument` (definitive grep across
  `apps/web/src`): drag-drop `ingestionService.ts:390` — `await` with no assignment,
  best-effort/fire-and-forget, discards the return, never reads `.status`.
  `handleForwardedMailbox` (Postmark) does **not** call `ingestDocument` at all — it
  creates `queued` jobs and returns `{status:'accepted', …}` (its `result.status`
  checks at `postmark-inbound/route.ts:321/327` are the *mailbox* result, a different
  enum). So Part A at the producer covers every current and future invoker.
- `postmark-inbound/route.ts:321/327`'s `result.status === 'rejected'/'idempotent'` is
  the **mailbox** result, a different enum — **not** a consumer of `IngestDocumentOutput`.
- **No document route reports a post** (no "posted"/commit message tied to ingest); HTTP
  responses return batch/mailbox info, not per-document commit status.

**Consequence:** no production switch-arm to add, and **no API-layer status-lie to
remove** — the only behavioral surface of the new status is the test assertions (§5).
Implementation requirement: if `tsc` flags any exhaustive `switch(status)` (it should
find none in production), add a real `parked_unposted` arm — **do not** add a catch-all
default that hides the case. Re-run the grep at implementation to confirm no consumer
appeared since this audit.

## 4. Refinement compliance (architect's three)
1. **Honest status** — §3.1: new `parked_unposted`; never emit `committed` for an
   unposted doc.
2. **Preserve machinery, neutralize call, no toggle** — §3.2 (unconditional) + §3.3
   (retain functions).
3. **Recoverable backlog + documented interim** — §6 (interim compromise) + §7 (Wave 6
   sweep is mandatory). To be recorded also in the V1 proposal Wave 6 and the memory
   checkpoint.

## 5. Test impact (verified per-test by reading, not assumed)
The inversion is narrow — only the matched **`proposed_entry_card` / `proposed_mutation_bundle`**
paths flip; the non-ledger (`proposed_attachment_card`, `unknown`) paths still return
`committed` (§3.4 unchanged), and the Q78 auth mechanism is untouched. Verified at HEAD:

- **`autoCommitGate.integration.test.ts` — UNAFFECTED, do NOT change.** It calls
  `withInvariants(billService.post / paymentService.record)` *directly* with a
  system-actor ctx (`:171, :219`), validating the **Q78 auth model** (system actor may
  cross `withInvariants` + Path X attribution). Part A preserves that mechanism; it only
  stops the *pipeline* from calling it. (My earlier draft wrongly listed this as
  breaking — corrected after reading it.)
- **`agentOrchestratorIngestDocument.integration.test.ts` — UPDATED (done).** Three
  vendor_invoice golden-path assertions (`:209/296/364`) flipped `committed →
  parked_unposted`; the dedup/NOT_FOUND assertions are unaffected; all trace assertions
  unchanged (the pipeline still runs every stage).
- **Gated e2e/sidecar (skipped by default — `RUN_MODAL_E2E`/`TEST_SIDECAR_E2E` + secrets):**
  only **`documentPipeline.vendorInvoice.e2e.test.ts`** flips (`:51` + title; vendor_invoice
  → `proposed_entry_card` → parked). The others stay `committed` — `sidecarE2E` ingests
  an `unknown` doc (short-circuit branch), `documentPipeline.paymentConfirmation` (no
  cited bill) and `documentPipeline.receipt` are `proposed_attachment_card` (non-ledger)
  paths. Updated the one; left the three. (Unrunnable here — no Modal/secrets; verified
  by path analysis.)

**No-ledger-write coverage:** the safety property ("a matched `vendor_invoice` ingest
produces no `journal_entries`/`bills`/`payments` row") is covered **transitively** by
the flipped status assertions above (parked return ⟹ commit\* uncalled ⟹ post sites
unreached). A **direct** ledger-row-delta test is **deferred to Wave 6** — it is
currently vacuous (the vendor-match gap null-gates the post regardless of the
bleed-stop). Full reasoning in §5.1.

### 5.1 No-ledger-write verification — via the status assertions (a direct DB-delta test is DEFERRED to Wave 6, because it is currently vacuous)
**Decision (2026-05-31, after verification): no dedicated DB-delta test for Wave -1.**
The earlier plan (assert "zero new bills/journal_entries/bill_payment_allocations
rows" for a matched ingest) was investigated and found **structurally vacuous against
the current pipeline** — verified by code-read + a reverted-bleed-stop scratch
experiment:

- The vendor_invoice extraction surface emits **no vendor name**: the Stage-4
  `VendorInvoiceExtractionSchema` (a stripping `z.object`) has no `vendor_name` field,
  and neither Tier A (regex emits only `vendor_invoice_number`/`amount`/
  `accounting_date`/`due_date`/`currency`) nor Tier C (the AI prompt explicitly says
  "do NOT include vendor_id … resolved by downstream services") emits a name. So
  `extractVendorFields(...)` yields no `vendor_name`/`vendor_text`/`merchant_text` →
  `matchVendor` skips its name strategies → `vendor_id` stays null →
  `buildPostBillInput` null-gates (`!vendor_match.vendor_id`) → **no bill posts even
  with the bleed-stop reverted.** A "zero rows" assertion is therefore true with OR
  without the bleed-stop — it proves nothing.
- A leaf spy on `withInvariants(billService.post)` is vacuous for the same reason (the
  null-gate sits before it). The only non-vacuous spy target is the module-internal
  `commitProposedEntryCard`/`commitProposedMutationBundle` (called *before* the
  null-gate) — but spying a same-module call cleanly requires the §3.3 (b) extraction,
  which is deferred (its real motivation is the post-V1 governed-auto-commit re-wire).
  Reopening §3.3 (b) to buy only the implausible "parks-in-status-but-writes-anyway"
  case is disproportionate for a bleed-stop.

**What covers the safety property non-vacuously instead: the flipped status
assertions (§5).** A reverted bleed-stop returns `{status:'committed',
proposal_id:null}` (committed-with-null under the matcher gap); the current code
returns `parked_unposted`. `expect(status).toBe('parked_unposted')` distinguishes
them — so re-enabling the commit branch **fails the three flipped assertions**. That
is exactly the realistic regression (someone re-wires the commit branch), caught with
no new code.

**Deferred to Wave 6:** the truly-direct ledger-row-delta test (a *matched, postable*
invoice produces zero rows) becomes non-vacuous only once the matcher gap is closed
(§7 Wave-6 must-fix) and the post path is reachable — at which point §3.3 (b)
extraction also happens naturally with the governed-auto-commit re-wire, so the direct
test and the clean module boundary arrive together, both motivated.

### 5.2 Severity correction — D-1's "actively auto-posting now" was overstated (verified)
For the record, scoped precisely (the arc's own grounding discipline applied to the
arc's record):

- **Verified:** the vendor_invoice → bill post path is **structurally unreachable** in
  the current pipeline (the matcher gap in §5.1). So the original D-1 framing —
  "actively auto-posting wrong bills onto staging now" — was **stronger than the
  verified reality**: for vendor_invoices the post was already null-gated and not
  firing.
- **But not harmless, and the bleed-stop is still necessary and correct.** The
  ungoverned commit *capability* is wired beneath the defect (the Q78 system-actor
  commit path with no rung/confidence/coding gate). The null-gating is an **accidental
  side-effect of a bug, not a control** — a defect is not a safety mechanism. The
  bleed-stop removes the capability deliberately and makes the parking **explicit**
  rather than incidental-to-a-matcher-gap. Do not over-rotate to "there was no problem."
- **Scope boundary (honest):** only the vendor_invoice → bill path was re-verified this
  pass. The born-paid bundle (`proposed_mutation_bundle`) and payment_confirmation
  paths are **reported** to dead-end via the same null-gate mechanism but were **not
  independently confirmed here** — treat as reported, not established.

## 6. Interim semantic compromise (must be recorded)
After Part A, a processed-but-unposted document sits in `document_cases.state='received'`
— **indistinguishable by state** from a freshly-arrived doc (distinguishable only by a
completed `pipeline_trace` / built proposal). This is deliberate and temporary. Record
it in: (a) this spec, (b) the V1 proposal Wave 6 section, (c) the memory checkpoint —
so nobody later reads a processed `received` case as unprocessed.

## 7. Deferred to Wave 6 (recorded, not dropped)
- **Part B — route to review.** Needs a legal `→needs_review` path. Lean: **proper
  advancement** (drive `received → extracting → classified → matched → needs_review` as
  the pipeline processes) so review cases have genuinely been through the pipeline —
  *not* a matrix amendment that lets unprocessed-looking cases jump to review (which
  weakens the invariant `needs_review ⇒ classified+matched`). Matrix amendment (B2) only
  if advancement proves impractical, as its own governance item. (D2)
- **Part C — silent-drop → exception queue.** The unmatched-vendor null-drop
  (`buildPostBillInput:685` → `commitProposedEntryCard:550` returns null) routes to
  `enqueueException`, mirroring `documentRouterService.ts:1491` branch (c). Gated on the
  same legal-source-state path as B. Deferring C does **not** reopen the ledger bleed —
  it is a data-completeness gap (unmatched docs unsurfaced), not a wrong-write; Part A
  actually cleans up the status-lie half (the dropped doc parks honestly instead of
  returning `committed`/null).
- **Exception reason (D3).** Lean: dedicated `unmatched_vendor` `ExceptionReason`
  (honest) over overloading `manual_route` (a routing-decision semantic) — at the cost
  of an ADR-0011 §13 amendment + migration. A Wave-6 call when Part C is built.
- **Parked-backlog sweep (mandatory in Wave 6).** A sweep must find parked cases
  (`state='received'` with a completed pipeline_trace / built proposal) and advance them
  through the legal matrix into the review surface — otherwise Part A's parked docs are
  orphaned.
- **ctx-type seam (applies to B/C).** `transition`/`enqueueException` take
  `ServiceContext`; the pipeline holds `SystemActorServiceContext`
  (`ingestDocument.ts:71`). Widen the automation-side entry point to the union (the
  chunk-10 `completeCandidate` precedent, `:301–305`); `audit_log.user_id` is nullable.
- **`transition()` is unusable from the pipeline (applies to B).** Its
  `AUTOMATION_ONLY_TRANSITIONS` guard rejects `matched/classified → needs_review` at the
  human boundary (`documentCaseService.ts:49–59, 186–191`); automation paths call the
  RPC directly (the comment at `:43–48`) or via a new automation-side wrapper.

- **Vendor-identity extraction gap (must-fix for the AP wedge).** The vendor_invoice
  extraction surface emits no vendor name/identity (§5.1), so `matchVendor` resolves
  `vendor_id=null` for *every* vendor_invoice today. This breaks more than auto-commit:
  even the intended **human review-and-post** flow cannot suggest a vendor/account
  coding without a vendor match. Wave 6 must add a vendor-identity field to the Stage-4
  `VendorInvoiceExtractionSchema` + the extractor (Tier A regex + Tier C prompt), so
  `matchVendor` can run. This also gates the §5.1 direct ledger-row-delta test
  (non-vacuous only once the post path is reachable) and is the natural point at which
  the §3.3 (b) commit-cluster extraction lands alongside the governed-auto-commit
  re-wire.

## 8. Acceptance criteria (Part A)
1. No `withInvariants(billService.post)` / `withInvariants(paymentService.record)` is
   reachable from the ingest pipeline for matched candidates. **Verified transitively**
   by the §5 status assertions: a parked return (`status:'parked_unposted'`) ⟹
   `commitProposedEntryCard`/`commitProposedMutationBundle` was not called ⟹ the post
   sites are unreached. (A direct ledger-row-delta test is currently vacuous — see
   §5.1 — and is deferred to Wave 6.)
2. Matched `proposed_entry_card` / `proposed_mutation_bundle` ingests return
   `status:'parked_unposted'`, `proposal_id:null`; the case stays `state='received'`.
3. Existing auto-commit assertions (§5) updated to the parked behavior; full suite green.
4. The commit machinery (§3.3) is preserved (present, unreferenced, annotated) — not
   deleted.
5. Unconditional — no toggle re-enables auto-post.
6. Consumers handle `parked_unposted` and **no route falsely reports a post** for a
   parked ingest. (Audit at HEAD: only the writer + tests read the status; no production
   `switch`, no route reporting a post — so no production consumer change is required.
   Re-verify the grep at implementation; if a consumer appeared, give it a real arm.)

## 9. Change-size estimate
Small. One additive type member (`types.ts`); two branch-body edits
(`ingestDocument.ts:482–494`, `:513–524`); preserve-and-annotate the commit cluster;
update the auto-commit test assertions (status flips). **No dedicated no-ledger-write
test** — deferred to Wave 6 per §5.1 (it is currently vacuous; covered transitively by
the flipped status assertions). No migration, no matrix change, no new service. Wave -1
stays a true bleed-stop.

---

**Endorsed 2026-05-31** with §3.3 = (a) annotate-in-place and the §3.5/§8.6 consumer-audit
addition. No open picks remain. Implement Part A; B/C/D2/D3 carry to Wave 6.
