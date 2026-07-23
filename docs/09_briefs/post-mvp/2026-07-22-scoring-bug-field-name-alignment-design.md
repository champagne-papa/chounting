# Scoring-bug remediation — extraction↔router field-name alignment (design)

**Date:** 2026-07-22
**Branch context:** authored from `feat/board-4-fork-c` @ `806aa935` (Fork C CLOSED
and pushed; no in-flight build). The finding itself is banked on `docs/scoring-bug`
@ `640c8057`.
**Status:** design ratified by the operator 2026-07-22; implementation plan to follow.
**Anti-scope:** not a Fork C item. This is the carry-forward the Fork C arc named and
deliberately did not absorb.

---

## 1. Problem

`documentRouterService.completeCandidate` scores a document against candidate ledger
entities by reading per-document-type projections out of `parsed.extracted_fields`.
It reads key names that **no extraction schema emits**. Every such read yields
`undefined`; the compute helpers degrade to `null`; `normalizeFeature` maps `null → 0`;
the weighted sum silently drops those axes to zero.

The seam that permits this is `documentRelationshipCandidate.schema.ts:155`:

```ts
extracted_fields: z.record(z.unknown()),
```

One untyped shape for all three scored document types. No per-type discrimination,
no remap layer anywhere in `apps/web/src/` (verified by exhaustive grep of every
assignment target of the reader-side names — the only hits are `rematchCandidate`'s
own reconstruction and two *candidate-side* DB column types on `payments`).

`ingestDocument.ts:770` and `:835` pass `extracted.fields` **verbatim** into
`completeCandidate`. Nothing reconciles the two vocabularies.

### 1.1 Root cause — an un-executed deferred obligation

`documentRelationshipCandidate.schema.ts:134-141` documents the whole thing:

```
// extracted_fields is permissive at chunk-1 — Subsystem 1 reads
// per-document-type field projections (e.g., for vendor_invoice:
// {invoice_amount, invoice_date, vendor_name, invoice_number}).
// The per-document-type field schemas are owned by ADR-0014 §6
// ... chunk-1 doesn't import those schemas because they don't yet
// exist on disk (Phase 7 territory).
// Lift to typed shape when Phase 7's per-type field schemas ship;
// same trigger as VendorMatchResultSchema lift-out.
```

At chunk-1 the reader **invented placeholder key names** because the real extraction
schemas did not exist yet, and left a deferred obligation with a named trigger.
Phase 7 then shipped those schemas — `vendorInvoiceExtractionSchema.ts`'s own header
reads *"Phase 7 chunk 7.3a brief Task 7.3a.1"*. **The trigger fired and the lift was
never performed.** The placeholders have been the live contract ever since.

This is not a typo, and the failure mode is not "strings instead of types" — it is
**an obligation with no watcher**. That framing drives §5.

### 1.2 Blast radius — all three scored types, asymmetric

The finding as banked on `docs/scoring-bug` scopes this to `vendor_invoice`. Disk
shows all three scored document types are affected, on different key sets.

| doc type | axis | reader key | extractor writes | live? | weight |
|---|---|---|---|---|---|
| **vendor_invoice** | amount | `invoice_amount` | `amount` | ✗ | 0.30 |
| | date | `invoice_date` | `accounting_date` | ✗ | 0.15 |
| | reference | `invoice_number` | `vendor_invoice_number` | ✗ | 0.25 |
| | vendor | *(from `vendor_match`)* | — | ✓ | 0.30 |
| **receipt** | amount | `receipt_amount` | `total` / `subtotal` | ✗ | 0.25 |
| | date | `receipt_date` | `date` | ✗ | 0.15 |
| | reference | `authorization_reference` | `auth_ref` | ✗ | 0.20 |
| | payment_method | `payment_method` | `payment_method` | ✓ | 0.15 |
| **payment_confirmation** | amount | `payment_amount` | `payment_amount` | ✓ | 0.25 |
| | date | `payment_date` | `payment_date` | ✓ | 0.10 |
| | reference | `authorization_reference` | `auth_ref` | ✗ | **0.35** |
| | payment_method | `payment_method` | `payment_method` | ✓ | 0.10 |

**Dead weight: vendor_invoice 0.70 · receipt 0.60 · payment_confirmation 0.35.**

Note the inversion at `payment_confirmation`: `V1_PROVISIONAL_WEIGHTS` sets
`reference_alignment` to 0.35 there (vs receipt's 0.20) *specifically because*
bank-issued authorization references are canonical — see `scoreComposition.ts:11-17`
and `documentRouterService.ts:1246-1252`. **The axis that rationale exists to weight
is the one that never fires.**

### 1.3 Observable consequences

- Score ranges today, given the vendor-confidence gate at `:896`
  (`vendor_invoice` 0.85 / `receipt` 0.80 / `payment_confirmation` 0.85):

  | branch | live axes | score range | margin |
  |---|---|---|---|
  | vendor_invoice → bill | vendor only | [0.255, 0.30] | **exactly 0** |
  | receipt → bill | vendor only | [0.20, 0.25] | **exactly 0** |
  | receipt → payment | vendor + payment_method | [0.20, 0.40] | can be ≠0 |
  | payment_confirmation → payment | vendor+amount+date+pm | [0.17, 0.65] | can be ≠0 |

- For the two vendor-only branches every candidate on a case scores identically
  (vendor match is a document-level property), so `ambiguity_margin` is exactly 0 and
  **every N≥2 case routes to branch (b) → exception queue**.
- N=1 still routes to branch (a) — there is **no** absolute-score gate anywhere;
  `aggregate_score` is only ever consumed as a *relative* margin (`:1500-1514`).
- The `:203-209` comment predicting the margin filter "activates when chunks-3+ ship
  multi-feature scoring" reads as current *by accident*: chunk 3 shipped
  `composeScore`, but the field-name break kept scoring effectively single-feature.

---

## 2. Scope — five sites

| # | site | lines | change |
|---|---|---|---|
| 1 | `vendor_invoice → bill` (Scenario B) | 932-970 | `invoice_amount`→`amount` · `invoice_date`→`accounting_date` · `invoice_number`→`vendor_invoice_number` |
| 2 | `receipt → payment` (Scenario A existing) | 1063-1108 | `receipt_amount`→`total` · `receipt_date`→`date` · `authorization_reference`→`auth_ref` · `payment_method` unchanged |
| 3 | `receipt → bill` (Scenario B) | 1137-1161 | `receipt_amount`→`total` · `receipt_date`→`date` |
| 4 | `payment_confirmation → payment` | 1256-1301 | `authorization_reference`→`auth_ref` · rest already correct |
| 5 | `rematchCandidate` reconstruction | 652-656 | see §2.2 |

Each of sites 1-4 touches the key in **two** places: the `compute*Feature` call and the
corresponding `*_raw_value.extracted` forensic field. Both must move together or the
audit trail misreports what was scored.

### 2.1 Explicitly untouched

- **Intended-null Scenario A sites — `:1001-1015` (vendor_invoice inferred-target) and
  `:1209-1223` (receipt inferred-target).** These pass literal `null` for
  amount/date/reference/payment_method and never read `extracted_fields` at all. That
  is deliberate per ADR-0015 §7 — an inferred target has no counterpart to compare
  against. A naive "re-activate the dead axes" pass would wrongly touch them.
- `composeScore`, `V1_PROVISIONAL_WEIGHTS`, `CONFIDENCE_THRESHOLDS_V1_PROVISIONAL`,
  `AMBIGUITY_MARGIN_V1_PROVISIONAL`. The scorer is correct — it faithfully sums what
  it is given, and `normalizeFeature`'s `null → 0` is by design. The defect is
  entirely at the reader-key/extractor-key seam.
- No migration. No schema change. No invariant change. No ADR amendment.

### 2.2 Site 5 is lossier than first assessed

Grounded at `:652-656`, the reconstruction currently writes exactly three keys:

```ts
extracted_fields: {
  invoice_amount: amountRaw?.extracted ?? null,
  invoice_date:   dateRaw?.extracted ?? null,
  receipt_amount: amountRaw?.extracted ?? null,
},
```

Cross-referenced against what each branch *reads*, the re-evaluation path is dead on
more axes than the live path — and would stay dead after a naive sites-1-4 fix:

| rematch of | amount | date | reference | payment_method |
|---|---|---|---|---|
| vendor_invoice | reconstructed | reconstructed | **never** | n/a (weight 0) |
| receipt | reconstructed | **never** (`receipt_date` not written) | **never** | **never** |
| payment_confirmation | **never** | **never** | **never** | **never** |

`payment_confirmation` re-evaluation reconstructs **nothing** — all four non-vendor
axes are null today and would remain null post-fix.

**Decision (operator-ratified): extend site 5 rather than document the lossiness.**
Leaving it would ship a scoped-down copy of the very bug being fixed, invisibly, in
the same change whose purpose is to end invisible dead axes. The raw values are
already persisted — `composeScore` stores `raw_value: rawValueForFeature(axis, signals)`
per axis into `candidate_features.features[]` — so the reference and payment-method
values are reachable by the same `features.find(f => f.feature_name === …)` lookup
already used for `vendor_match` / `amount_match` / `date_proximity`. Axis names are
`vendor_match`, `amount_match`, `date_proximity`, `reference_alignment`,
`payment_method_consistency`.

Post-fix site 5 writes extractor-vocabulary keys. All target keys are distinct across
types, so the existing unconditional-write pattern still holds:

```ts
extracted_fields: {
  amount:                amountRaw?.extracted ?? null,   // vendor_invoice
  accounting_date:       dateRaw?.extracted ?? null,     // vendor_invoice
  vendor_invoice_number: referenceRaw?.extracted ?? null,// vendor_invoice
  total:                 amountRaw?.extracted ?? null,   // receipt
  date:                  dateRaw?.extracted ?? null,     // receipt
  payment_amount:        amountRaw?.extracted ?? null,   // payment_confirmation
  payment_date:          dateRaw?.extracted ?? null,     // payment_confirmation
  auth_ref:              referenceRaw?.extracted ?? null,// receipt + payment_confirmation
  payment_method:        paymentMethodRaw?.extracted ?? null,
},
```

**Build-time verification (definition-of-done):** confirm the reference and
payment-method `raw_value.extracted` fields are genuinely populated on stored
candidates, so the extension is not itself a silent no-op.

### 2.3 `total`, not `subtotal`

The receipt extractor writes both. `total` is what a committed payment or bill amount
matches against; `subtotal` excludes tax and would systematically mismatch. The code
comment at the call site must state **"`subtotal` deliberately unread"** — the same
anti-invisibility discipline this whole fix exists to serve.

---

## 3. Test strategy — TDD, RED→GREEN watched

The existing fixtures **encode the reader's invented vocabulary** — 12 occurrences in
`documentRouterService.integration.test.ts` alone (its `buildInput` helper defaults to
`{ invoice_amount: 1000 }` at `:210`), across 6 files. That is the mechanism by which
100%-dead scoring shipped and stayed green. Order matters:

1. **RED** — new test seeding *real extractor* names (`amount` / `accounting_date` /
   `vendor_invoice_number`) and asserting genuine multi-axis scoring. Must fail today,
   with the score pinned at `0.3 × vendor_match_confidence`. Watch it fail.
2. **GREEN** — apply the sites 1-4 alignment.
3. **Fixture migration** — update the 6 files to extractor vocabulary. They go red at
   step 2 by construction; that redness is the proof the fix bites.
4. **Must-not-fire guard** — assert the two intended-null Scenario A sites *still*
   produce vendor-only scores; the fix must not leak into the inferred-target path.
5. **Site 5 coverage** — re-evaluation through `rematchCandidate` preserves all
   reconstructed axes, per type, including `payment_confirmation`.
6. **Pipeline-level** — one real-pipeline integration test with `callClaude` mocked,
   asserting aggregate > 0.3 for a matching invoice.

### 3.1 Step 4 is the definition-of-done anchor

This applies the lesson **banked at N=1 by the Fork C arc**: a change with a
legitimate adjacent case needs a *must-not-fire-on-the-adjacent-case* test, not just
fires-on-target plus a negative control. Its absence is what let the dup over-fire
ship until the full-suite gate caught it.

The shape transfers exactly. Fork C's was a route-to-human handler that must not fire
on a would-attach document; this one is an axis re-activation that must not fire on
the intended-null inferred-target path. Same structure, different surface. If this
fires as an N=2 observation, it routes through `codify-convention` (likely
`testing.md`).

### 3.2 Fixture convention

Step 6 follows the **Tier-A-sufficient live-pipeline fixtures** convention codified at
this arc's close (`docs/04_engineering/conventions/testing.md`, N=4): Stage-4
`tierASufficient` needs amount + `vendor_invoice_number` + `accounting_date` (labelled
`Invoice #<n>` / `Total: $x` / `Date:`), and Stage-2.5 `looksMultiInvoice` fires on ≥2
six-char letter-AND-digit tokens. Seed link/α substrate via the real RPCs, never raw
inserts.

---

## 4. Risk — why this ships safely now

Verified first-hand, not assumed:

- **No Stage 7 branch reaches a ledger write.** `commitProposedEntryCard`
  (`ingestDocument.ts:1131`) and `commitProposedMutationBundle` (`:1194`) have **zero
  call sites**; both carry `eslint-disable-next-line @typescript-eslint/no-unused-vars
  -- preserved for post-V1 re-wire`. Every
  `withInvariants(billService.post / paymentService.record)` in the file lives inside
  those two dead functions. The Wave -1 A-now bleed-stop is in force
  (ADR-0007 §Tier 2 Q78 V1-re-scoping).
- **Terminal case state is branch-invariant.** At `:1009-1014`, after parking,
  `advanceCaseAutomation({target_state:'needs_review'})` fires regardless of branch —
  branch (a) → `matched` → one hop → `needs_review`; branches (b)/(c) → already
  `needs_review` → idempotent no-op. **A human sees every case either way.**

So re-activating the axes changes exactly three things, none of them ledger or
human-visibility: the head-pointer write on branch (a), the absence of a
`multi_candidate_ambiguity` exception row, and the decision-record audit content. A
reviewer sees a pre-selected winner instead of an ambiguity exception.

**Fixing later is strictly worse.** The scoring bug is already a documented
pre-condition on governed auto-commit returning. Under the bleed-stop this change has
no ledger consequence; after auto-commit returns, the same change would shift the
margin distribution while the ledger is live.

### 4.1 Calibration is a downstream gate, not a blocker

`AMBIGUITY_MARGIN_V1_PROVISIONAL = 0.05` was set when margins were *structurally
always 0* — the `:203-209` comment says so outright. There is currently no signal to
calibrate against. **This fix is what generates the data the calibration needs**, and
the bleed-stop makes generating it free of ledger risk.

Per ADR-0019 the margin is surface 3.5, ratified by the first calibration cycle at
`v1_ship_at + 6 months`, and calibrates as a **coupled set** with the three classifier
thresholds — it is not an isolated knob, and moving it is a governed amendment
(CTO + Controller joint ratification), not a code edit. ADR-0019 also makes threshold
moves **prospective, not retroactive** (pre-commit candidates are not re-evaluated at
v1), which bounds this in our favour.

Sequence: **fix under the bleed-stop → observe real margins → calibrate → then
re-enable governed auto-commit.** The code's own warnings (`:211-214`, `:666-668`)
that parking "does not itself assert auto-commit is off" and must be re-verified when
it returns belong to that calibration step, not this one.

---

## 5. Obligation re-file — a tracked item, not a reworded comment

The failure mode here was **invisibility**: an obligation whose named trigger fired
with nothing watching. Hand-alignment is correct but not structural, so the obligation
survives this fix and must survive it *visibly*.

1. **Rewrite `documentRelationshipCandidate.schema.ts:134-141`.** Re-file the
   typed-lift obligation against **governed auto-commit return (ADR-0007 §Tier 2
   Q78)** — a real gate with an owner, not a trigger that can silently pass. State
   explicitly that hand-alignment is correct-but-not-structural and that the lift
   closes the bug class, so the next reader sees a *deliberate deferral*.
2. **Friction-journal entry** — the tracked artifact. Records the
   un-executed-deferred-obligation pattern, the full blast radius, and the re-filed
   trigger. This is the piece that makes the deferral visible; without it the
   re-file is just another comment.
3. **Amend the `docs/scoring-bug` finding** to the true radius: all three types
   (3/3/1 dead axes), the site-5 reconstruction gap, and the `payment_confirmation`
   rationale inversion.

---

## 6. Stale in-code claims

- **`:203-209`** — the branch-(a)-unreachable tombstone. **Correct it.** Post-fix the
  margin filter genuinely activates and branch (a)-via-margin becomes reachable; the
  comment's prediction finally comes true and its present tense becomes false.
- **`:1054-1055`** — "Scenario B aggregate_score capped at 0.65 max (vendor 0.25 +
  amount 0.25 + date 0.15)". Today's actual cap is **0.25**, because amount and date
  are dead too. Post-fix the arithmetic should reach 0.65. **Verify, don't edit** —
  the comment documented intent and the bug falsified it. Build-time check: confirm
  the receipt weight sum actually reaches 0.65 with the three live axes.

---

## 7. Definition of done

- `pnpm --filter @chounting/web typecheck` green
- `pnpm --filter @chounting/web test` green
- `pnpm agent:validate` — floor 26/26, 0 ERRORs
- `pnpm test:full` — Condition-1 evidence. Expect the known-red
  `ReviewCaseDetailView.test.tsx` carry-forward (stale-text divergence, byte-unchanged
  by this work); **STOP and report on anything else**
- `grep -c "callClaude: API call complete"` = 0 — no paid Claude calls in tests
- RED watched before GREEN on every TDD step
- §3 step 4 (must-not-fire guard) present and passing
- §2.2 build-time verification: reference / payment-method `raw_value.extracted`
  genuinely populated
- §2.3: `subtotal deliberately unread` comment present
- §6 `:1054-1055` arithmetic verified
- §5 all three artifacts landed (re-filed TODO + friction-journal entry +
  `docs/scoring-bug` amendment)

## 8. Open items carried, not absorbed

- The **typed lift** itself (§5 item 1) — deferred by design, re-filed against the
  governed-auto-commit trigger.
- The **margin/threshold calibration** — ADR-0019 cycle, gated on auto-commit return.
- `ingestDocument.ts:259` writes `extracted_fields: inv` on the multi-invoice α-row
  path, consumed by `reviewPreview` rather than `completeCandidate`. Different
  consumer, outside the five-site set; worth a look whenever the typed lift happens.
- The **payment_confirmation extractor `auth_ref` mapping** is grounded first-hand
  here (`paymentConfirmationExtractionSchema.ts:21`) but is the heaviest-axis site
  (0.35) — re-ground it at build before editing site 4.
