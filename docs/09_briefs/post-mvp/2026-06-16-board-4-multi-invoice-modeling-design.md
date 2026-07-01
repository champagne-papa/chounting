# Board #4 — Multi-Invoice Modeling — Design

> **Status:** DRAFT — **disk-verified, pending Phil approval.** Advisor
> verification pass: CLEAR (disk anchors checked first-hand; the prod-incidence
> + grep-absence claims accepted on WSL's lane). Independent subagent disk-audit
> (2026-06-16): all 10 anchors + 3 grep-absence claims MATCH at `b749179d` — ALL
> CLEAR (and `bills`-has-no-case/source-FK confirmed across the *full* migration
> history). No code committed; no prod writes; no fork pre-decided.
> **Authored:** 2026-06-16 (WSL).
> **Lane:** WSL grounds + authors; advisor verifies against disk; **Phil
> decides the forks + scope and owns all commits / prod action.**
> **Cut ratified this session (Phil):** option 1 — slice-2 + spine in depth;
> slice-1 demoted to *latent, deferred-with-trigger* + a detector specced now.
> Forks A/B/C presented as **open decisions with leans** (A lockable at review).
> **Grounding substrate:** code `main @ b749179d`; prod `ollyqiiwdvbpbngqgjqk`
> @ migration `20240180000000` (read-only). Cross-reference `git log` + a live
> `SELECT` at read time rather than trusting the SHA/counts here as live.

---

## 1. Goal & scope (the cut)

**Board #4 is the `case → N bills` gap** — the system models a document case
as yielding *one* document_type and *one* extraction, so it can produce at most
one bill. Two real-world inputs need *N* bills from one case:

- **One PDF, N invoices** (the live, observed manifestation): the Amazon
  `$41.39` PDF is **three distinct vendor invoices**
  (`CA56SWET7X6I` $14.55 / `CA542WJGEUEI` $11.19 / `CA5KJ23M1ZFI` $15.65; the
  sum is the filename total) — three invoice *numbers*, not three line items
  (CURRENT_STATE 2026-06-14, grounded against `document_artifacts.lines` for
  source_document `3433cfe3…`).
- **One email, N documents** (latent; see §2.1): a forwarded email carrying two
  genuine invoice attachments processes only one.

This brief, per the ratified cut, scopes:

- **Slice 2 (the real board #4):** the `case → N bills` model + OCR-level
  segmentation for the one-PDF-N-invoices case — **in depth** (§4).
- **The spine:** fail-safe *route-uncertain-to-human*, made explicit / typed /
  instrumented, extended to the dangerous-when-uncertain set — **in depth** (§5).
- **Slice 1 (mailbox multi-attachment):** demoted to *latent, deferred-with-
  trigger*, **plus a cheap detector specced now** (§6) so the latent gap can
  never drop a real document untraceably while slice 2 is built.

Forks A/B/C are surfaced as **open decisions with leans** (§8), not pre-decided.

---

## 2. Grounding findings (verified first-hand against disk + prod, 2026-06-16)

All claims below were re-verified this session from the bytes — not from the
advisor's summary. Anchors are `file:line` at `main @ b749179d`; prod reads are
read-only `SELECT`s against `ollyqiiwdvbpbngqgjqk`.

### 2.1 STEP 0 — mailbox ingest is LIVE in prod; slice-1 is latent (0/13), airtight

- **Live, and the only path run.** All **13** ingest batches are
  `forwarded_mailbox` (zero drag-drop); the document-platform substrate is
  present and prod is at migration head `20240180000000`. This settles the
  CURRENT_STATE 2026-06-09 "prod vs local-dev" tension first-hand (the
  2026-06-14 supersession already claimed it; this confirms + quantifies it).
- **The slice-1 leak is latent, not active.** Of 13 cases: 5 carry 1 attachment
  (1 PDF), **8 carry 2 attachments (1 PDF + 1 PNG)**. The picker
  (`resolvePrimaryIngestSource`) drops the *second* attachment in those 8 — but
  every dropped second attachment is the **same** image:

  | | count | distinct content-hashes | byte size |
  |---|---|---|---|
  | `image/png` attachments | 8 | **1** (`cfc3a998e4f9…`) | **101,519 B, identical across all 8** |
  | `application/pdf` attachments | 13 | 6 | 6.5 KB – 92 KB (varied) |

  Eight emails carrying one byte-identical ~99 KB image is an Outlook
  signature/letterhead, not eight distinct photographed invoices. The picker's
  image-exclusion logic (§2.4, claim 4) discards it correctly. **`cases dropping
  a real (≥2 non-image) document` = 0 of 13 — airtight, not inferred.** The code
  gap is real (a genuine second *real* document would drop); it has demonstrably
  not fired.
- **Re-verify (prod):**
  ```sql
  -- channel + fanout
  select ingest_channel, count(*) from ingest_batches group by 1;
  -- PNG byte-identity (the airtight evidence)
  select count(*), count(distinct original_content_hash), count(distinct original_byte_size)
  from source_documents where lower(mime_type) like 'image/png%';
  ```

### 2.2 No per-job processing ledger — `document_jobs.state` is vestigial

- `document_jobs.state` is **never advanced**: zero UPDATEs in app code
  (`rg -n "document_jobs" apps/web/src | rg -i "\.update|set state"` → none),
  and prod shows **all 34 jobs `queued`** (5×2 + 8×3 = 34). `document_jobs` is a
  write-once fan-out / lookup table (source_document ↔ case); its state machine
  is unused.
- **Consequence (load-bearing):** there is **no record that a fanned-out job was
  never processed**. That is *why* a dropped attachment is invisible — nothing
  marks the non-primary job as un-run. This is the fact the §6 detector exists to
  mitigate.
- **Re-verify (prod):** `select state, count(*) from document_jobs group by 1;`

### 2.3 No per-job drainer exists

The only invokers of the pipeline entry (`ingestDocument`) are:

- `ingestionService.handleDragDropUpload` — **per-file** loop, but each file is
  its own 1:1 case (`ingestionService.ts:416-433`).
- `ingestionService.handleForwardedMailbox` — **single** invoke on the resolved
  primary (`ingestionService.ts:842-849`).
- `sweepStrandedCases` — **per-case**, one primary, one `runIngest`
  (`sweepStrandedCases.ts:286,342`); the cron route only *triggers* the sweep.

The remaining `document_jobs` reads (`ingestDocument.ts:333`,
`extractionReadService.ts:114-132`) are case_id lookups, not drainers. **Nothing
loops over `queued` jobs.** Claims 3–5's "exactly one processed per case" holds.

### 2.4 Claims 1–6 — verdicts (advisor-grounded; re-verified first-hand)

| # | Claim | Verdict | Anchor |
|---|---|---|---|
| 1 | `document_case_sources` is many-to-many + v1-permissive | ✓ | `20240145…sql:45-71` (surrogate PK + `UNIQUE(case,source,role)`); header `:9-11` cites ADR-0011 Q75 *"v1-permissive, schema doesn't enforce one-primary-per-case"* |
| 2 | drag-drop 1:1 file:case:extraction | ✓ | `ingestionService.ts:317-329` (1 case/file), `:416-433` (per-file invoke) |
| 3 | mailbox 1 email → N+1 sources, 1 shared case, invoked once | ✓ | `ingestionService.ts:714-717` (single `case_id`), `:744` (N+1 jobs), `:842-849` (single invoke on primary) |
| 4 | picker returns one; multi-attach "picks arbitrarily"; PRIORITIZED follow-up | ✓ **+ refinement** | `strandedCaseReadService.ts:91-97` (verbatim "Known limitation … PRIORITIZED follow-up"). **Not arbitrary:** excludes `email_body` *and* prefers oldest non-image over image (signature dedup, incident 2026-06-11), `:122-182` |
| 5 | sweep case-grained, one primary, advances out of eligibility | ✓ | `sweepStrandedCases.ts:76-81,279,286,342` |
| 6 | no invoice entity distinct from case; case→invoice 1:1 | ✓ | `20240143…sql:62-79` (single `document_type` NOT NULL); `extraction_runs` is keyed **per source_document**, one structured result; no N-invoice substrate |

The **claim-4 refinement** is the reason §2.1 reads 0/13: the picker the advisor
characterised as "arbitrary" is exactly what discards the signature PNG.

### 2.5 `bills`/`bill_lines` is the AP ledger home — `invoices` is AR (not the target)

- **`bills`** (`20240101…sql:412-425`): `vendor_id` FK, `bill_number`, dates,
  `amount_*`, `fx_rate`. **`bill_lines`** (`:429-437`): `bill_id` FK,
  `account_id`, `description`, `amount`. This is where a posted vendor invoice
  lands.
- **`invoices`/`invoice_lines`** (`:381-406`) are the **AR** side (`customer_id`
  FK) — *not* the ingest target. The term matters: board #4 is `case → N
  **bills**`, not `N invoices` and not `N bill_lines`. Amazon's three distinct
  invoice *numbers* ⇒ **three bills**, each with its own `bill_lines` — not one
  bill with three lines.
- **Scope honesty:** confirmed only that the ledger *home exists with the right
  shape*. **`bills` carries no `document_case_id` (nor `source_document_id`) FK** —
  confirmed across the *full* migration history (the only later `ALTER TABLE
  bills`, `20240138`/`20240139`, add `lifecycle_state` / `posted_journal_entry_id`
  / tax / PO columns — none a case-or-source link). The case→bill linkage
  and the posting path are **not traced this session** (see §10, open item).

### 2.6 The two-layer gap (diagnosis)

| Layer | Status |
|---|---|
| inbound → sources | **Done** — mailbox fans to N+1 source_documents; bytes captured |
| sources → case (**slice 1**) | mailbox collapses N+1 sources → **1 case**; picker processes 1. **Latent, 0/13 firing** |
| case → bill (**slice 2 = real board #4**) | **1:1 always.** `case → N bills` is unreachable. Amazon (one PDF, 3 invoices) is the live manifestation — currently degrades via extraction-Zod-reject → `needs_review` |

---

## 3. Decision — the cut (resolved this session)

**Option 1 ratified by Phil:** scope the brief on slice-2 + spine in depth;
demote slice-1 to latent-with-detector; present forks A/B/C as open decisions.

Why option 1 dominates (recorded for the verifier):

- **Slice-1 is not urgent** — 0/13, airtight (§2.1). The cheap "fan-to-N-cases"
  fix would build a *second* cardinality model that slice 2 must then reconcile,
  and would discard the email-cohesion `document_case_sources` exists to
  preserve. With no leak, that cost isn't bought.
- **The detector** (§6) removes the *only* genuine risk slice-1 carries — a
  silent, untraceable drop (the no-ledger fact, §2.2) — without touching the
  cardinality model.
- **Slice 2 is the actual board #4.** Option 3 (spine-only) would ship a brief
  that routes Amazon to a human but never lets it become three bills — it
  doesn't move the real problem. Option 2 (also fully design slice-1's structural
  fix) over-invests in a latent path *and* pre-commits Fork A toward fan-to-N,
  which the grounding argues against.

---

## 4. Slice 2 design — `case → N bills` (the core)

### 4.1 The problem, precisely

Today: `document_case` → (classify → extract) → **one** structured result
(`document_type` + fields) → at most **one** proposed bill. The extraction
contract and every downstream stage assume a single document per case. Two
inputs break that assumption and must yield **N bills under their originating
case**:

1. **One PDF, N invoices** (Amazon) — N invoices live *inside one
   source_document's OCR text*; the extractor must emit an **array**, and the
   downstream must fan it to N proposals → N bills.
2. **One email, N documents** (post-Fork-A) — N invoices arrive as N
   attachments under one case (the slice-1 structural fix folds in here under
   the one-case-N-bills lean — §6/§8-A).

### 4.2 Live evidence the model is missing (board-#2 KEY FINDING)

The board-#2 paid run already produced the decisive datapoint
(`2026-06-15-board-2-structured-output-extraction-eval-design.md` §6.4 "KEY
FINDING — multi-invoice"): on the Amazon doc, **both AI paths score 0/3, for
opposite reasons** —

- **Free-text** extracted it *correctly* as a 3-element JSON array (all three
  sub-invoices, full fields) — but the eval's single-object scorer drops a bare
  array → `{}`.
- **Structured-output** *collapsed* — the single-object required-nullable schema
  can't represent three invoices, so the model returned all fields `null`.

So the extraction contract must (a) **admit N** (array-of-invoices), and (b)
have a downstream that **fans N → N proposals → N bills**. Neither exists. This
is the board-#4 work, and it is why "structured outputs regress to all-null on
multi-invoice" is tied directly to this board.

### 4.3 The modeling question — "where does N live?" (the design space, NOT a decision)

Surfaced against what's actually on disk; **the substrate choice is deferred to
slice-2 design onset** (and is partly downstream of Fork A). Candidate homes for
the N:

- **(α) A new `extracted_invoice` (or `case_invoice`) entity**, N-per-case, each
  → one proposed bill. Cleanest expression of "one case, N invoices"; preserves
  case cohesion. Cost: a new table + RPC + audit shape (the Phase-2 chunk
  pattern), and it sits between case and bill. **Phase-1.2b grounds this as the
  front-runner:** segmentation's per-invoice grouping (derivable from the
  persisted bbox-per-line artifact, §4.4) needs a home regardless, and α is it —
  so α buys auditable per-invoice provenance + per-invoice type (§10.2) for close
  to the marginal cost of persisting work segmentation already does.
- **(β) Extend `extraction_runs`** (currently keyed **per source_document**:
  `id, source_document_id, ocr_run_id, extraction_version` — `20240146`, in
  `…_document_artifacts_substrate.sql` despite the filename) to carry
  N structured results. Reuses substrate but overloads an OCR-run record with
  business-entity cardinality — likely the wrong axis.
- **(γ) Fan directly to N `bills`** at proposal/commit time. `bills` already
  supports N rows, and a **source→bill linkage already exists** via
  `source_document_links` (Phase 1.2 finding, §10.1) — so γ needs **no new linkage
  column on `bills`** (the earlier "needs a linkage column" framing is superseded).
  Its real cost is elsewhere: it pushes "N" all the way to the ledger with nothing
  auditable between case and bills, and it must re-key the `source_external_id`
  dedup scheme per-invoice (§10.1) — a re-key α needs too. **Sharpened at
  Phase-1.2 verification (advisor):** γ's link is structurally N-ready but
  **semantically coarse** — fanning one PDF to 3 bills writes 3 identical
  `(same source_document, 'bill', bill_id_i, 'primary_invoice')` rows, each
  pointing at the *whole* PDF, when each bill's real primary is one sub-invoice
  region. The quad-UNIQUE permits it, but that coarseness *is* the "nothing
  auditable between case and bill" cost, made concrete — and it couples γ-vs-α to
  Fork B (if segmentation yields per-invoice regions, those regions want a home).

**α LOCKED (Phil, 2026-06-29) — grounded, not a lean.** Of α/β/γ, **α** (a new
per-invoice `extracted_invoice` / `case_invoice` entity) is chosen on two grounded
axes: (1) **provenance** — the per-invoice grouping segmentation must produce
(Phase-1.2b, §4.4) has no home today; α is it, γ discards it; (2) **robustness to
segmentation difficulty (advisor)** — α is the right home for segmentation's
output whether that output is easy or hard to compute, so a hard-segmentation
discovery at §1.4 raises slice-2 *build cost* but cannot flip the α/γ *call*. β
(extend `extraction_runs`) is rejected as the wrong axis. The decision still
interacts with: Fork A (one-case-N vs fan-to-N), the case→bill posting
path (§10.1, **traced — Phase 1.2**), and the `document_cases.document_type` single-column
persist gap (CURRENT_STATE latent item — a case with N invoices of possibly
different types can't be expressed by one `document_type`).

### 4.4 OCR-level segmentation (Fork B)

The one-PDF-N-invoices case enters as a single source_document whose
`document_artifacts.lines` contains N invoices (the Amazon row's lines carry all
three sub-invoice numbers + amounts — CURRENT_STATE 2026-06-14). Producing N
structured results therefore needs a **segmentation step** that partitions one
artifact's OCR lines into N invoice regions *before* (or as part of) extraction.
Lean (§8-B): keep this inside slice 2; carve it to its own board only if the
segmentation problem balloons — a discovery made *during* slice 2, not now.

**Phase-1.2b finding (2026-06-28; first-hand by WSL, pending advisor disk-verification).**
Traced whether segmentation yields *addressable* per-invoice regions (the premise
the §4.3-α case rests on):
- **The persisted artifact retains addressable structure.** Prod
  `document_artifacts.lines` for the Amazon doc (`3433cfe3…`) is a **364-element
  array of `{ bbox, text, confidence }` objects** — every OCR line carries a
  4-point bounding box (read-only `SELECT`, first-hand). So N-invoice regions are
  **derivable from stored structure** (spatial/page clustering or `Invoice #`
  header anchoring), not re-derived from flat text. The advisor's worst case
  ("segmentation has only flat text to work with") is **false at the artifact
  layer.**
- **But the current extraction path flattens it.** `extractOcrText.ts:26-53`
  joins `lines[].text` into one string (header: *"flattens that shape into a
  single string"*); `vendorInvoiceExtractor.ts:155` + `aiFallbackExtractorBase.ts`
  feed Claude `ocrText: string` only. So today the bbox structure is **persisted
  but unused** by extraction.
- **No segmentation exists** (greenfield). Natural slot: a **Stage 2.5
  (segment)** between OCR (Stage 2) and classify (Stage 3), reading the
  structured artifact *before* the flatten, emitting N per-invoice line-groups →
  classify/extract run N times.
- **Net for §4.3-α:** segmentation must produce a per-invoice grouping regardless
  (that is its job), and that grouping **has no home today** — α IS the home, so
  α's marginal cost over γ is "persist the grouping segmentation already
  computes" + per-invoice provenance/type. This **grounds the "α nearly free"
  framing** — with one honest caveat: "nearly free" means *the entity is nearly
  free given segmentation is being built anyway*; **segmentation itself is still a
  real new stage**, not free.

---

## 5. The spine — fail-safe route-uncertain-to-human

### 5.1 It partly exists already

Amazon currently degrades to `needs_review` (extraction returns an
unrepresentable array/shape → Zod rejects → graceful degrade). So route-to-human
is *happening* — but **incidentally**, as a side effect of a Zod failure, not as
an explicit, typed, instrumented decision. The spine work is to make it
deliberate.

### 5.2 The principle (highest leverage vs the scenario explosion)

Build **explicit handlers only for scenarios that fail *dangerously* even when
the system is uncertain**; **defer + instrument** the long tail (route it to a
human and record that you did). This is what stops the "handle every scenario"
explosion from being the cost driver.

### 5.3 The dangerous-when-uncertain set (Fork C)

Lean order (§8-C):

1. **Duplicate detection** — re-paying / re-booking the same invoice. (Stage-0
   `dedupByHash` exists for *byte*-identical content; the dangerous case is the
   *semantic* duplicate — same invoice, different bytes.)
2. **Bank-detail / remittance-change** — a vendor's payment coordinates changing
   is the classic fraud-redirect; must route to a human even when extraction is
   confident.
3. **Statement-vs-invoice** — a vendor *statement* (a summary of prior invoices)
   booked as a new invoice double-counts. Close behind.

Everything else: route-to-human + instrument, don't special-case.

### 5.4 Instrumentation

Every route-to-human decision should emit a typed audit signal (reason-coded),
so the long tail is *measurable* — which scenarios actually recur becomes the
evidence for what to promote to an explicit handler next. This is the same
discipline as the §6 detector, generalized.

---

## 6. Slice 1 — latent, deferred-with-trigger + the detector (buildable now)

- **Status:** 0/13, airtight (§2.1). The **structural fix is deferred** and
  folds into slice-2's cardinality model under the one-case-N-bills lean (Fork
  A) — it is *not* built as a separate fan-to-N path.
- **The detector (spec now, the only buildable-now item):** at the picker's drop
  point — `strandedCaseReadService.ts:179-182`, where `nonImage` is selected and
  every other attachment is discarded — when a case resolves with **≥2 non-image
  attachments** (i.e. the picker is about to silently drop a *real* document),
  emit a typed audit/alert (working name `forwarded_mailbox.multi_document_
  dropped`; final action name + whether it needs an `ACTION_NAMES` entry is a
  §10 onset item). **The emit seam is itself a flagged micro-decision, not a
  drop-in at line 179:** `resolvePrimaryIngestSource` is read-only (the
  INV-SERVICE-001 read-function asymmetry, stated at the
  `strandedCaseReadService.ts:6-7` module header), so the audit write lands in a
  wrapping caller or a sibling read-only probe both invokers share — resolved at
  build (plan §0.2). This converts the no-ledger invisibility (§2.2) into a
  traceable signal **without** a cardinality change.
- **Trigger:** the first detector fire promotes the slice-1 structural fix from
  *latent/deferred* to *active* — the honest mitigation for "invisible when it
  fires, hasn't fired yet." Until then, slice 1 ships nothing but the detector.

---

## 7. Self-learning posture

Corrections feed **human-gated** teaching via the board-#2 eval harness
(operator corrections → accumulated ground truth → deliberate, measured model
changes). **Not** auto-adaptation — which would be un-auditable, poisonable, and
would launder unreviewed output into ground truth. No change to this stance; the
multi-invoice corpus simply extends the existing ground-truth home.

---

## 8. Forks for Phil (open decisions, with leans)

These are **Phil's** to lock or leave open. Leans recorded; not pre-decided.

- **A — Email case model.** *Lean: one-case-N-bills, solved once in slice 2, with
  the detector now — not fan-to-N-cases.* Rationale: with 0/13, the cheap path's
  only advantage (speed for a leak that isn't leaking) is gone, and fan-to-N
  builds a divergent cardinality model and discards email cohesion.
  **A is the one most worth locking now** — it shapes the core data model the
  rest of slice 2 builds on (and α/β/γ in §4.3 depend on it).
- **B — Amazon / segmentation placement.** *Lean: keep in slice 2* — it's the
  same `case → N bills` gap entering via OCR rather than attachments. Carve to
  its own board only if OCR segmentation balloons (a slice-2 discovery).
- **C — Dangerous-when-uncertain set + order.** *Lean: duplicate-detection +
  bank-detail/remittance-change first; statement-vs-invoice close behind* (§5.3).

Recommended posture (advisor-endorsed, Phil-ratified this session): **present
A/B/C as open decisions with these leans; lock A only if you want to narrow
slice-2 scope before the build plan hardens.**

---

## 9. Constraints honored / lane

- **No prod writes.** All prod interaction this session was read-only `SELECT`.
- **No commits.** WSL authored these files; Phil commits after advisor
  verification + approval (board-#2 precedent).
- **No fork pre-decided.** §4.3 surfaces the substrate space without picking;
  §8 leaves A/B/C to Phil.
- **Ledger untouched.** No change proposed to `bills`/`bill_lines`/journal
  semantics in this brief — slice-2 *uses* `bills` as the N-home target; any
  schema change (e.g. a `document_case_id` linkage) is a slice-2 design decision,
  flagged not made.
- **Grounding is verifiable.** Every load-bearing claim carries a `file:line` or
  a re-runnable `SELECT`; the advisor verifies against disk before this hardens.

---

## 10. Open items to verify at slice-2 design onset (NOT resolved here)

Flagged honestly per verify-from-disk — do **not** treat as settled:

1. **Case→bill posting path + linkage — RESOLVED (Phase 1.2, 2026-06-28;
   first-hand by WSL; advisor-verified clean against disk 2026-06-28, incl. the
   `source_document_links` quad-UNIQUE N-ready claim read first-hand by the advisor).** An approved case posts
   via `approve-post/route.ts:154-190` → `buildPostBillInput(card)` →
   `billService.post` → a single `.from('bills').insert(...).single()`. **The 1:1
   (one bill per case) is baked into LOGIC + DB, not merely permitted by schema:**
   - one `card` per case (route `:137-138`); `buildPostBillInput` returns ONE
     `PostBillInputRaw` with one hardcoded `bill_line`
     (`ingestDocument.ts:871-940`); `billService.post` inserts exactly one bill
     (`.single()`, `billService.ts:355-378`).
   - the dedup key is **child-type-suffixed, not invoice-suffixed** —
     `` `${caseId}:bill` `` (route `:155`) → threaded to `journalEntryService.post`
     as `source_external_id` (`billService.ts:345`) → guarded by the partial
     **UNIQUE** `idx_je_source_external (org_id, source_system, source_external_id)`
     (`20240111:65-67`; `20240175:16` comment: *"one post per case"*). A second
     bill from the same case collides → `DUPLICATE_SOURCE_EXTERNAL_ID` → the route
     treats it as **recovery of the already-posted bill, never a second bill**
     (route `:173-189`).
   - **Linkage DOES exist (correcting this item's original premise):** not a
     column on `bills`, but via `source_document_links` (source_document → bill,
     `link_role='primary_invoice'`; written at `billService.ts:406-416`;
     `20240147:201,217` — `('bill','primary_invoice')` valid pair +
     `UNIQUE(source_document_id, linked_entity_id, linked_entity_type, link_role)`).
     Grain is **source_document → bill**, and the UNIQUE permits one source_document
     → N bills (distinct `linked_entity_id`) — the linkage layer is already N-ready.
   - **Implication for §4.3 / Fork A:** the direction (one-case-N-bills) is
     unchanged, but the work is now precise. The bill-write layer already writes
     one-bill-per-call (callable N times); the 1:1 lives in (a) the
     **proposal→builder** chain (one card → one bill) and, decisively, (b) the
     **`source_external_id` keying + JE-uniqueness**, which must become per-invoice
     (e.g. `` `${caseId}:bill:${n}` `` or invoice-number-keyed) or N collapses to 1
     at Layer 1. This is exactly the Layer-1 constraint the advisor predicted could
     reshape Fork A: it does **not** flip the direction — it **defines the build**.
   - *Lane:* the call-chain breadth came from an Explore subagent; every
     load-bearing citation above was **re-read first-hand by WSL**. Advisor to
     verify against disk per the standing rhythm.
2. **`document_cases.document_type` single-column persist gap** (CURRENT_STATE
   latent item): the column is never updated post-ingest (reads `unknown` for
   every prod case). A case with N invoices of *different* types can't be
   expressed by one `document_type` — interacts with the §4.3 substrate choice.
   **Skimmed Phase-1.2b:** an α per-invoice entity carries its own type, subsuming
   this for the multi-invoice case; γ has no per-invoice-type home. (The persist
   gap itself — `document_type` never updated post-ingest — remains a separate
   open item, not resolved here.)
3. **`proposed_mutation_bundle` is NOT a DB table** (confirmed: no `CREATE TABLE`
   match) — it is a runtime/Zod intent shape. If slice 2 routes N through a
   bundle, confirm the runtime shape's N-capability; it is not substrate.
4. **Detector audit action.** Whether `forwarded_mailbox.multi_document_dropped`
   needs an `ACTION_NAMES` catalog entry (`canUserPerformAction.ts`) /
   permission, or rides `recordMutation` as a system-actor event — resolve at
   detector build (§6).
5. **Re-confirm the §2 grounding** against disk/prod at brief-review time (the
   advisor's stated step): the `bills`/`bill_lines` shape, the detector seam, and
   the prod incidence numbers (counts move as new mail arrives).

---

## 11. Anti-scope / deferred

- **Slice-1 structural fix** — deferred (folds into slice-2 cardinality under
  Fork A); only the detector ships now (§6).
- **Picking the slice-2 substrate (α/β/γ)** — a slice-2 design decision,
  downstream of Fork A; not made here (§4.3).
- **Ledger / journal re-architecture** — out of scope; slice 2 uses `bills` as
  the target, not a new ledger model.
- **The long tail of document scenarios** — deferred + instrumented, not
  explicitly handled (§5.2).
- **Auto-adaptation / self-learning automation** — explicitly excluded (§7).
