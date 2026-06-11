# Wave 5 — AP Eval Harness — build plan

**Status:** DRAFT — plan read-back pending (Advisor). Plan only; no
implementation, commit, or push authorized by this document.
**Anchored at:** HEAD `2fb15598` (= `origin/staging`, branch `staging`).
**Wave:** 5 of the V1 wave plan (`docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md` §5).
**Deliverable type:** **build wave — NOT ADR-bearing.** Grounds: §5 Wave-5
line carries no ADR number (contrast Waves 1–4); §4 reserved block maps
0028–0033 to Waves 0–4, 0034/0035 to V2, 0036 deferred — none maps to Wave 5;
all six V1-wave ADRs (0028–0033) are authored + ratified on disk; §6 maps no
R-reservation to Wave 5. Cadence is therefore the **build cadence**: this plan →
Advisor green-light → implement (TDD) → artifact read-back, not the four-gate
ADR lifecycle.
**Lock:** `wave-5-ap-eval-harness` (held).

---

## 0. What this plan does

Opens Wave 5 by scoping and sequencing the **AP eval harness** — the validation
layer over the already-shipped AP extraction / classification / rule-evaluation
substrate. It builds **test/validation artifacts and fixtures**, plus a small
set of **additive, behavior-preserving exports** (the only `src` touches) so the
governed logic is testable fixture-offline without firing live AI: three named
no-AI Tier-A extraction entrypoints (D1, one per extractor, mirroring the shipped
`evaluateTierA`) and the `CONFIDENCE_THRESHOLDS` map (D2). It builds **no new
runtime control**. It extends shipped substrate rather than re-specifying it
(§2). **Phil FYI:** these exports are not controls and do not change the §5
charter scope — a harness needs its code-under-test reachable without firing live
AI; flagged for acknowledgment, not gated.

Charter provenance: Decision 9 ("minimal eval harness folded into Ring 2B + AP
wedge", ratified 2026-05-31) seeds the eval track; Wave A folded in eval items
1–3 (golden set / shadow scoring / Disposition reconciliation — all shipped, §2);
Wave 5 is the next layer — the four AP-specific sub-deliverables named in §5.

---

## 1. Scope

The four §5 sub-deliverables (verbatim: *"AP eval harness — extraction golden
set + accuracy; confidence-to-policy validation; unsafe-output /
input-contamination suite"*):

- **D1 — Extraction golden set + accuracy.**
- **D2 — Confidence-to-policy validation.**
- **D3 — Unsafe-output suite.**
- **D4 — Input-contamination suite.**

### Non-goals (explicit — guard the charter line)

1. **No new runtime control.** Wave 5 is scoped in §5 as an eval *harness*
   (validation). It does NOT build the INV-2 input-side sanitization control;
   D4 characterizes the gap and the control is deferred + named (§6, Fork 2).
   Building a control here would silently exceed the wave's charter line. *(The
   three additive Tier-A export entrypoints are NOT controls — they are
   named, behavior-preserving re-exposures of existing pure functions for
   testability, the same pattern as the shipped `evaluateTierA`. §0 + §D1.)*
2. **No auto-commit / no ledger writes.** Consistent with INV-5 (no autonomous
   commit at V1) and the A-now bleed-stop (`de607fdb`). The harness asserts; it
   never posts.
3. **No persisted-read facet by default.** Fixture-offline (§3, §5). Any
   exception carries the per-facet read-scoping audit explicitly.
4. **No vendor-identity accuracy.** Structurally blocked by the §7 matcher-gap
   until Wave 6 (D1 detail + §6).

---

## 2. Grounding inventory — shipped substrate this plan extends

All paths below verified on disk at HEAD `2fb15598`.

| Concern | Shipped artifact | Wave-5 relationship |
|---|---|---|
| Shadow scoring (eval item 2) | `apps/web/src/agent/orchestrator/extraction/stages/shadowRuleEvaluation.ts` (Ring 2B Seam-1, ADR-0027 D5/6; gated `RING2B_SHADOW_EVAL`, fail-safe, txn-isolated, card-only; writes `rule_evaluation_log`, no auto-post) + `apps/web/tests/integration/shadowRuleEvaluation.integration.test.ts` | Read, not extended. The only persisted-read exception surface (§5). |
| Disposition reconciliation (eval item 3) | `apps/web/src/shared/rules/disposition.ts` — `dispositionForAction(action: ActionType): Disposition` (pure; maps gate effective_action → `rule_evaluation_log.disposition` per ADR-0025 §6; lives in `shared/rules/` per ADR-0020 / ADR-0025 §5 D5; reconciliation canonized by ADR-0030 / Decision 11) | Consumed by D2. |
| Classification golden set (eval item 1) | `apps/web/tests/fixtures/classifier/real-ocr/corpus.sanitized.ts` — real-OCR `lines` + `expectedType` labels (vendor_invoice / receipt / payment_confirmation) only | **Classification** golden set; D1's **extraction** golden set reuses the `lines` but adds expected-*field* labels — extend, not duplicate. |
| Extractors | `apps/web/src/agent/orchestrator/extraction/{vendorInvoiceExtractor,receiptExtractor,paymentConfirmationExtractor}.ts` | Run in-process by D1. |
| Vendor-invoice extraction schema | `apps/web/src/shared/schemas/extraction/vendorInvoiceExtractionSchema.ts:36` — fields: `amount, currency, vendor_id (uuid, nullable), vendor_invoice_number, accounting_date, account_code, tax_code_id, due_date, line_items, tax_amount` | Defines D1's scorable field set. **No vendor-name field**; `vendor_id` slot exists but per §7 the extractor never populates it → null for every vendor_invoice. |
| Confidence substrate | ADR-0019 confidence-calibration-policy (ratified 2026-05-04); `confidence` present across the extraction/classifier layer (grep counts, non-load-bearing) incl. `tierCoordination.ts` | Consumed by D2. |
| Rules services | `apps/web/src/services/rules/` — exactly 7 services incl. `ruleEvaluationService` | Context for D2/D3; not mutated. |

**Demoted (net-new, not proven-absent):** an extraction-accuracy harness and an
input-sanitization control were searched across term-variants and not found;
treated as net-new pending final plan-grounding at implementation onset (the
verify-from-disk-at-impl-onset discipline).

---

## 3. Design

### I/O posture — fixture-offline (cautionary-tale-aware default)

Every sub-deliverable runs **golden/adversarial fixtures → component in-process →
compare to expected**, with **no `adminClient`, no DB, no persisted reads**. This
keeps the entire harness off the RLS-bypassing read surface, so the Wave-2 IDOR
class cannot recur here. The one real exception is named and gated in §5. The
mechanical teeth that make this posture a *tested* property (not an intent) were
codified at the Wave-5 close — see `docs/04_engineering/conventions/testing.md`
"Fixture-offline eval-suite teeth (N=4)".

### Three-way field taxonomy (impl-onset refinement — supersedes the earlier two-way)

Reading the three `tryExtractTierA` bodies + the AI prompts (D1 discovery) shows
the field set is **three-way**, not two-way (populated vs `vendor_id`). The
fixture-offline baseline scores **only the Tier-A-producible** subset:

| Class | Definition | Wave-5 treatment |
|---|---|---|
| **Tier-A-producible** | the no-AI regex path populates it | **the scored set** |
| **Tier-C(AI)-only** | the AI prompt produces it; Tier A does not | out of fixture-offline baseline → named Tier-C carry-forward (§6) |
| **Downstream-resolved** | neither tier extracts it (resolved by services) | dropped from extraction scoring entirely (§6 note) |

Per-type Tier-A-producible scored sets (verified against each `tryExtractTierA`):

- **vendor_invoice (5):** `amount, currency, vendor_invoice_number, accounting_date, due_date`
  — Tier-C-only: `line_items, tax_amount`; downstream-resolved: `account_code, tax_code_id, vendor_id`.
- **receipt (6):** `total, subtotal, date, payment_method, last_4, currency`
  — Tier-C-only: `merchant_text, tax_amount, merchant_identifier, auth_ref, transaction_reference`.
- **payment_confirmation (5):** `payment_amount, payment_date, payment_reference, payment_method, currency`
  — Tier-C-only: `vendor_text, auth_ref, transaction_id, cited_invoice_number, cited_bill_id`.

### Data-driven scored-field config (Fork 1 structural refinement)

The scored set per document type is a **config object**, not hardcoded in the
harness:

```
SCORED_FIELDS: Record<DocumentType, FieldSpec[]>
```

So adding vendor-identity accuracy at Wave 6 (when Tier A/C gain the field) is a
**config entry + label + expected-value addition — zero harness change**. This
makes "fixture extension, not rebuild" structural rather than aspirational.

### Named no-AI Tier-A export entrypoints (the one `src` touch)

Each extractor gains an additive named entrypoint, e.g.
`extractVendorInvoiceFieldsTierA(ocrText: string): Partial<VendorInvoiceExtraction>`,
wrapping the existing private `tryExtractTierA` (NOT exposing the helper raw —
intention-revealing, and decoupled from the helper's name so refactors don't
break the eval API). Mirrors the shipped `evaluateTierA`. The harness feeds these
the production OCR text via `extractOcrText(artifact)` on a synthetic
`DocumentArtifactRow` built from corpus `lines` (the `classifierRealOcr`
`artifactWithLines` pattern) — so the baseline sees exactly what production Tier A
sees, never a live AI call.

### Components (each: purpose / interface / deps)

- **Extraction golden fixtures** — *purpose:* expected per-field extraction
  values for a set of source documents. *Interface:* a typed fixture array,
  keyed to the same real-OCR documents as `corpus.sanitized.ts` (reuse `lines`).
  *Deps:* the corpus fixture; the extraction schema types.
- **`scoreExtraction(fixture, output, SCORED_FIELDS)`** — *purpose:* pure
  field-by-field accuracy scoring for the configured fields. **Absent ≠ wrong
  (load-bearing):** every extraction field is `.optional()` — per the schema
  header (`vendorInvoiceExtractionSchema.ts:30–34`), an `.optional()` field is an
  "extraction target per §2.1; nullable for v1 partial-coverage — extractor
  attempts extraction but absence is valid." So scoring CANNOT be plain
  exact-match: it must split **coverage** (did the extractor attempt/populate the
  field?) from **correctness** (when populated, is the value right?) — i.e. a
  precision/recall or explicit coverage-vs-correctness pair, never a single
  "accuracy" number that conflates a partial-coverage miss with an extraction
  error. The scored set is the **Tier-A-producible** subset only (the three-way
  taxonomy above); Tier-C-only and downstream-resolved fields (incl. `vendor_id`,
  §7-blocked) are not scored. *Interface:* returns a per-field {covered, correct}
  result + aggregate coverage and correctness. *Deps:* `SCORED_FIELDS` config
  only. No I/O.
- **Confidence-to-policy validators** — *purpose:* assert confidence values map
  to the correct policy/disposition outcome. *Interface:* table-driven cases →
  expected `Disposition`. *Deps:* `dispositionForAction`, the tier confidence
  thresholds. Pure.
- **Adversarial fixtures (D3 / D4)** — *purpose:* crafted malicious/malformed
  outputs (D3) and contaminated input text (D4). *Interface:* fixture arrays.
  *Deps:* none beyond the component under test.
- **Vitest runners** — one per sub-deliverable, asserting thresholds /
  rejection / characterized behavior. Category-A-style; fixture-offline.

---

## 4. Build breakdown (sequence; each step TDD)

**D1 — Extraction golden set + accuracy**
0. Add the three named no-AI Tier-A export entrypoints (one per extractor;
   additive, behavior-preserving; §3 "Named no-AI…").
1. `SCORED_FIELDS` config (data-driven) = the **Tier-A-producible** subset per
   type (§3 three-way taxonomy): vendor_invoice 5 / receipt 6 /
   payment_confirmation 5. Downstream-resolved fields (incl. `vendor_id`) carry
   a config-level pointer to the §7 matcher-gap / §6 carry-forwards.
2. Extraction golden fixtures reusing `corpus.sanitized.ts` `lines` (fed through
   `extractOcrText` → the Tier-A entrypoint).
3. `scoreExtraction` (pure), with the **absent-vs-wrong** semantics pinned above
   (coverage split from correctness; absence is valid, not an error) + runner
   asserting per-type **coverage and correctness** thresholds separately.

**D2 — Confidence-to-policy validation** (deterministic ⇒ hard-asserted)
4. Additive map-only export `CONFIDENCE_THRESHOLDS` from `aiFallback.ts`
   (`const` → `export const`; zero logic change — the comparison is a one-line
   `>=`, so no refactor of the live-AI function). Three validators, fixture-
   offline (`callClaude` + `adminClient` mocked to throw):
   (a) **threshold snapshot** — the 4 governed values
   `{vendor_invoice:0.85, receipt:0.80, payment_confirmation:0.85, unknown:1.0}`
   match exactly, incl. the `unknown:1.0` always-exception sentinel; ratchet
   re-frozen only via ADR-0019 calibration governance (ADR-0014 §7 Q65
   provenance);
   (b) **boundary** — `confidence == threshold` accepts (`>=`), just-below routes
   to Tier D `'unknown'`; the `unknown` sentinel never accepts (its path forces
   `confidence:0`);
   (c) **disposition totality** — every live `action_type` arm (the 5-arm DB
   enum via `Constants`) maps exhaustively to a `Disposition` (ADR-0030), no
   fallthrough.

**D3 — Unsafe-output suite** (boundary deterministic ⇒ 1+2 hard-asserted; 3 characterized)
5. The INV-2 output boundary is `schema.safeParse` over the SAME exported schema
   symbols the extractor/classifier pass it (`runAiExtractFallback:217` extraction
   schemas; `runAiFallback:328` `ClassificationOutputSchema`) — so schema-direct
   tests ARE boundary tests, fixture-offline (no `src` export; schemas already
   exported). `callClaude` + `adminClient` mocked to throw.
   (1) **Rejects structural violations** — wrong types (`amount:"abc"`,
   `line_items:{}`), invalid discriminant (`document_type:"evil"`), out-of-range
   (`confidence:1.5`), missing required → `safeParse` fails.
   (2) **Strips unknown/injected keys** — `posted`/`auto_commit`/`__proto__`
   absent from parsed output (no `.passthrough()` leak, no prototype pollution);
   a genuine safety lock.
   (3) **Characterized limit** — a valid-but-malicious *string* in a valid field
   PASSES (structure/type/enum only, not semantic content); semantic safety rests
   on the proposal-only + human-review backstop (INV-5), the same chain as D4.

**D4 — Input-contamination suite** (instruction-inert hard-asserted; content-injectable characterized)
6. Fixture-offline over the no-AI Tier-A path (D1 `…TierA` exports +
   `evaluateTierA`; `callClaude`/`adminClient` mocked to throw). The threat on
   the no-AI path is **content-injection, NOT prompt-injection** (no LLM to
   instruct). Two properties, tested separately:
   (1) **HARD-ASSERT instruction-following immunity** (permanent invariant) — a
   trigger-free instruction string (proven trigger-free: abstains + extracts
   `{}`) appended to a baseline changes NEITHER classification NOR extraction.
   Tier-A responds to pattern presence, not instruction semantics; a regression
   is a real bug, asserted forever.
   (2) **CHARACTERIZE content-injectability** (diagnostic, NO ratchet) — injected
   trigger keyword / value flows through (no input sanitization). The
   unfulfilled INV-2 input-side obligation (deferred, Fork-2(b), §6/§8). No
   ratchet: no "more is better" direction; Wave-6 sanitization is meant to
   change it.
   Backstop: INV-2 output (D3) + INV-5 (proposal-only + human review) ⇒
   contaminated input cannot auto-post bad truth at V1.

---

## 5. Cautionary-tale / IDOR posture

Default fixture-offline (§3) ⇒ the harness reads no persisted, org-scoped data,
so the per-facet cross-tenant read-scoping audit has no surface to apply to.

**The one concrete exception:** `shadowRuleEvaluation.ts` writes
`rule_evaluation_log` via `adminClient` (RLS-bypassing). **Any** harness path that
scores against those shadow-eval rows reads org-scoped data through an
RLS-bypassing path ⇒ the per-facet audit applies in full (every read facet
derived from org-verified rows, never raw/polymorphic ids). **Plan posture:** D1–D4
are designed to NOT read `rule_evaluation_log` — accuracy is scored against
in-process extractor output, not persisted shadow rows. If implementation finds a
sub-deliverable that genuinely needs persisted shadow-eval rows, that path STOPS
and surfaces for the IDOR audit before it is written. The artifact read-back will
specifically confirm the harness carries no unexpected `adminClient` /
persisted-read facet.

---

## 6. Deferred controls & carry-forwards (named, not buried)

- **INV-2 input-side sanitization control (Fork 2 (b)).** D4 characterizes an
  **unfulfilled INV-2 input-side obligation** — §2 Invariant 2 explicitly names
  "input side (extraction-input sanitization)". Wave 5 does NOT build the
  control (charter line = eval suite, not control-build). **Why the deferral is
  defensible at V1:** the backstop chain — INV-5 (no autonomous commit at V1;
  proposals park, human approve→post at Wave 6) + INV-2 output side (proposal-
  only, validated) — means contaminated input cannot auto-post bad truth at V1.
  **Natural home:** the control is owed *before governed auto-commit returns*
  (post-V1, gated on the eval harness per §2 Inv 5) — that is when input-side
  hardening stops being defense-in-depth and becomes load-bearing. **For Phil
  (§8):** exact home (Wave 6 vs a post-V1 track) is a CTO call.
- **Vendor-identity extraction accuracy → §7 matcher-gap MUST-FIX.** Excluded
  from D1's scored set (the field does not exist; §2). Tracked explicitly
  **against the charter §7 matcher-gap Wave-6 MUST-FIX**, not as a loose note —
  it lands when the Stage-4 schema + Tier A/C gain a vendor-identity field. The
  `SCORED_FIELDS` config carries the pointer so the tie is visible in code.
- **Tier-C (AI) extraction accuracy harness — named carry-forward.** D1 scores
  only the Tier-A (no-AI) baseline (fixture-offline; the thesis-relevant
  deterministic path). The Tier-C-only fields (vendor_invoice `line_items`,
  `tax_amount`; the receipt/payment AI-only fields, §3 taxonomy) need a
  **separate, paid, non-deterministic** AI-accuracy harness — out of
  fixture-offline scope. Named here so it is not silently dropped; home is a
  post-V1 eval track (alongside the §6 governed-auto-commit gate).
- **Downstream-resolved fields — dropped, not deferred.** Top-level
  `account_code`, `tax_code_id` (AI prompt explicitly excludes them) and
  `vendor_id` (§7) are resolved by downstream services, never extracted by either
  tier — so they are **not extraction-accuracy targets at all** and carry no
  Tier-C work; noted here only to record the disposition.
- **Router Subsystem-2 ambiguity-margin → named carry-forward (ADR-0019 §13).**
  D2 scopes to the classifier confidence thresholds + the disposition mapping.
  ADR-0019 names a *second* confidence surface — the document-relationship
  Router's ambiguity-margin (`margin_threshold` V1_PROVISIONAL, in
  `shared/schemas/document-platform/documentRelationshipCandidate.schema.ts`,
  a distinct subsystem). NOT folded (separate substrate, not cheap); carried
  forward named against **ADR-0019 §13** so this governed confidence surface
  does not silently drop. Home: a confidence-margin eval pass when the Router is
  next touched.
- **`.strict()` output-boundary hardening → named carry-forward (Wave 6 / post-V1).**
  D3 confirmed the extraction/classifier output schemas STRIP unknown keys (Zod
  default) — safe for downstream (keys dropped) but **silent**: an off-contract
  key from the AI (a possible injection tripwire) is dropped with no audit event,
  whereas `.strict()` would surface it as `zod_validation_failed`. That
  observability gain trades against noisier failures on benign AI extras — a
  control-design trade-off. Changing the schema to `.strict()` is modifying a
  runtime control (non-goal 1: eval, not fix), so D3 **characterizes** the strip
  and **names** the `.strict()`-hardening candidate here, tied to the same INV-5
  backstop reasoning as D4's Fork-2(b). NOT built in Wave 5.
- **Double Entry Agent AI-output boundary → named carry-forward (post-V1 / next
  agent touch).** D3's unsafe-output suite is scoped (ruling (a)) to the AP
  document pipeline, whose AI-output boundary set is exactly {classification,
  extraction} — both covered; Stages 5 (`vendorService` matcher) and 7
  (`proposalBuilder`) invoke no AI. The **third** `callClaude` site is a distinct
  subsystem: the conversational **Double Entry Agent** (`handleUserMessage`,
  `src/agent/orchestrator/index.ts`). Its AI-output boundary is
  **shape-different** from the pipeline's — per-tool `zodSchema.safeParse`
  (tool-call validation, main-loop step 7, ~`:457`) + `ProposedEntryCardSchema`
  **`.parse`** (~`:886`, which *throws* on invalid rather than the pipeline's
  `safeParse`→graceful-degrade). A dedicated agent-safety eval would assert the
  throw is caught and handled safely (no crash, no leak, no post) — a different
  assertion than the AP boundary, which is why it's a separate surface, not a
  trivial fold. **Deferral defensible at V1:** the ProposedEntryCard is
  ledger-bound but sits behind the same INV-5 proposal-only + human-review
  backstop (a human approves before it posts) as D3 validator-3 and D4
  Fork-2(b). NOT built in Wave 5; named so it does not silently drop.

---

## 6a. Recorded eval finding — Tier-A no-AI baseline (D1)

Harness-computed over the 12-doc real-OCR corpus (frozen `BASELINE_TALLY`):

| type | coverage | correctness |
|---|---|---|
| vendor_invoice | 10/16 = 63% | **3/10 = 30%** |
| receipt | 8/18 = 44% | 6/8 = 75% |
| payment_confirmation | 8/14 = 57% | 7/8 = 88% |

**The finding:** the no-AI Tier-A extractor — calibrated on synthetic mockSidecar
OCR (its own header) — **mis-extracts on real OCR**, most acutely
`vendor_invoice_number` (0/4 correct: grabs the word after "Invoice") and
`amount` (grabs tax / line-item / product-number instead of the total). Clean
synthetic docs extract correctly. **Recorded, not pre-tuned** (Wave 5 = eval,
not fix).

**Thesis framing (so Wave 6 + the Tier-C carry-forward inherit it correctly):** a
poor automated no-AI *extraction* baseline does **not** contradict "the system
runs without the AI." The load-bearing non-AI guarantee is the **human manual
route** (the ADR-0031 form/API producers) — a human can post and correct with no
AI. The precise reading: automated no-AI extraction is low-quality on real OCR ⇒
the no-AI mode **leans on human manual entry/correction**, and Tier-C (AI)
carries automated quality. This **reinforces Wave 6** (the human review /
approve→post UI is exactly where poor extraction gets corrected) and **feeds the
§7 matcher-gap** (vendor identity). The 30% vendor correctness is a Wave-6
hardening target, surfaced here as a measured input, not an alarm.

## 6b. Recorded eval finding — content-injectability (D4)

Measured on the no-AI Tier-A path and **asserted as a qualitative property**
(`injected ≠ baseline`) — not a numeric ratchet: it fires exactly ONCE, at
gap-closure (when INV-2 input-side sanitization lands and the injection stops
flowing), which is precisely the event worth surfacing:

- **Instruction-inert (hard invariant, holds):** a trigger-free instruction
  string appended to a vendor_invoice baseline changes neither the classification
  nor the extraction. Tier-A keys on pattern presence, not instruction meaning —
  this is NOT prompt-injection.
- **Content-injectable (the finding):** an injected `Total: $1.00` line flows
  into extraction (`{vendor_invoice_number:"Invoice"}` → `{…, amount:1}`); an
  injected receipt-signature line **disrupts** the confident classification
  (`vendor_invoice` → **abstain**, which would route to Tier-C, the AI-injectable
  surface). The no-AI path has no input sanitization, so attacker-controlled OCR
  can inject field values and knock the classifier off its verdict.

**Reading:** this is the unfulfilled **INV-2 input-side obligation** made
concrete — the named deferred control (Fork-2(b), §6/§8). It does not breach V1
safety: the **INV-2 output (D3) + INV-5 (proposal-only + human review)** backstop
means contaminated input cannot auto-post bad truth. The sanitization control is
owed before governed auto-commit returns (post-V1); recorded here as a measured
input to that work, not an alarm.

---

## 7. Invariants posture

Wave 5 is **validation**; under register-on-enforcement it registers **no new
INV-ID**. It exercises INV-2 (both sides) and INV-5's backstop, and **surfaces**
(does not close) the INV-2 input-side gap. None of the reserved IDs
(`INV-WORKFLOW-*`, `INV-AUTONOMY-GATE-001`, `INV-EVIDENCE-*`, `INV-LEARNING-001`)
belong to Wave 5; none is touched.

---

## 8. Open items for Phil

1. **Home for the deferred INV-2 input-side sanitization control** — Wave 6 vs a
   named post-V1 track (§6). The plan defers + names it; where it lands is the
   CTO call.

---

## 9. What "done" means (Wave 5)

1. D1–D4 implemented fixture-offline; `pnpm agent:validate` green; the new
   suites green; full suite green (Condition 1).
2. `SCORED_FIELDS` data-driven; vendor-identity exclusion carries the §7 pointer;
   `scoreExtraction` splits coverage from correctness (absent ≠ wrong).
3. No `adminClient` / persisted-read facet in the harness (artifact read-back
   confirms), or any exception carries a cleared IDOR audit.
4. The deferred INV-2 input-side control is named with its backstop rationale and
   surfaced to Phil; the vendor-identity carry-forward is tied to §7.
5. Plan ↔ artifact consistency confirmed at the artifact read-back.

---

**Cadence reminder.** This is the plan artifact. Implement waits for the Advisor
green-light on this plan; commit waits for the artifact read-back clear under the
lock; push waits for Phil's explicit terminal go. No-stack: nothing proceeds
until the prior read-back clears.
