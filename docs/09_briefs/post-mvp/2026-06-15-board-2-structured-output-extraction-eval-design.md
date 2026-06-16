# Board #2 — Structured-Output Extraction Eval — Design + Plan

> **Status:** DRAFT — pending advisor verification + Phil approval. No code
> committed. The paid capture run is Phil's to execute.
> **Authored:** 2026-06-15 (WSL).
> **Design authority (parent):** `docs/09_briefs/post-mvp/2026-06-14-tier-c-eval-harness-design.md` §2.3/§2.4/§3/§3.1/§3.2/§7.
> **Buildable-now substrate (parent):** `origin/main @ 906dfa4c`.

---

## 1. Goal & metric

Score a **real-Claude structured-output extractor** through the existing
`runExtractionEval` over the same frozen corpus + the same `SCORED_FIELDS`,
and diff its per-type aggregates against the Tier-A `BASELINE_TALLY`. **That
delta is the metric** (parent §2.3).

The structured-output extractor uses **Anthropic JSON structured outputs**
(`output_config.format`, constrained decoding) on **the same production
extraction model, `claude-sonnet-4-5`** — model held fixed, so the delta is
not a model change. **Precise framing (advisor):** the delta measures the
structured-output *mechanism as a whole* — constrained decoding **plus the
SDK-injected format system prompt** that structured outputs adds. The model is
held fixed; the prompt is **not** held byte-fixed (SO injects its format
prompt on top of the prod prompt). That bundle is exactly the
adopt/don't-adopt question for prod, so it is the right thing to measure — but
§1/§4/§6 must not claim the prompt is held fully fixed.

Per parent §3.1 we also capture the **current free-text-JSON path** over the
same corpus as the "before" point, so the diff shows *exactly* what
structured outputs changed. The Zod-failing population (the cases that
matter, parent §3.1) exists only on the free-text side — under constrained
decoding the output conforms by construction — so capturing free-text raw is
load-bearing, not a nicety.

---

## 2. Grounding findings (verified first-hand against disk)

### 2.1 Q1 — wrap the existing extractor, or write new code? → New thin extractor

The existing AI path **cannot** be wrapped into the harness seam, for three
independent disk reasons:

1. **Shape mismatch.** `ExtractionFn` is *synchronous and pure* —
   `(ocrText, type) => Record<string, unknown>`
   (`apps/web/tests/helpers/extractionEval.ts:147-150`), invoked
   synchronously at `:207`. The AI path
   `runAiExtractFallback(input, schema, ctx)` is *async* and needs
   `ctx` / `systemPrompt` / `trace_id`
   (`apps/web/src/agent/orchestrator/extraction/aiFallbackExtractorBase.ts:90-94, 33-39`).
   A billed async extractor cannot be handed to the sync runner.
2. **Raw is discarded to callers.** On Zod failure the function returns
   `{valid:false, reason:'zod_validation_failed', trace_record}` with **no
   rawText** (`aiFallbackExtractorBase.ts:238-246`); raw survives only as a
   200-char log preview on parse-fail (`:190`), nothing on Zod-fail. Parent
   §3.1 requires raw *pre-Zod*, keyed by `(doc, version)` — wrapping cannot
   satisfy it.
3. **Production side-effects.** Every call consumes per-document budget
   (`tryConsumeCall`, `:116`) and writes DB audit events
   (`emitPipelineAuditEvent`, `:64`) — unwanted in an eval loop over fixtures.

→ #2 **reuses the prod prompt + model + `callClaude` seam** but adds its own
capture (no safeParse / budget / audit). It does **not** call
`runAiExtractFallback`.

### 2.2 Q2 — pre-safeParse capture point

`rawText` is taken at `aiFallbackExtractorBase.ts:177-178` (the model text
block), `JSON.parse` at `:185`, `safeParse` at `:216`. Raw exists *inside*
the function before Zod but is never returned, so the capture is a **new
function that holds rawText**. For the #2 free-text population, `JSON.parse`
usually still succeeds (Zod fails on shape, not JSON validity) → the
parsed-but-invalid object is scoreable; true parse failures → empty record →
honest zero coverage.

### 2.3 Q3 — gating + no-hardcoded-URL conventions (reuse board-#3)

Mirror `apps/web/tests/integration/classifyUnknownRepro.integration.test.ts:23-34`:
`const SHOULD_RUN = process.env.RUN_*_EVAL === '1' && Boolean(process.env.ANTHROPIC_API_KEY)`
+ `describe.skipIf(!SHOULD_RUN)`. No-hardcoded-URL cascade
`SUPABASE_TEST_URL → SUPABASE_URL → throw` (`tests/setup/testDb.ts:3-7`).
**Note:** the #2 capture path does **not** touch Supabase (the corpus is an
in-repo fixture; the only I/O is OCR-text → Claude), so no Supabase URL is
needed — simpler than board-#3. **Note:** board-#3 writes *no* disk artifact
(console only), so §3.1's stamped capture fixture is **new** — board-#3 sets
no precedent for it.

### 2.4 Harness contract (reuse byte-identical — do not perturb baseline)

`runExtractionEval(extractor, corpus, truthFor) → Record<DocumentType, DocScore[]>`
(`extractionEval.ts:195-214`);
`SCORED_FIELDS.vendor_invoice = [amount, currency, vendor_invoice_number, accounting_date, due_date]`
(`:31-37`); `EvalCorpusDoc = {label, expectedType, lines}` (`:156-160`);
`ocrTextFromLines` is exported (`:167`); `BASELINE_TALLY` frozen
(`tests/fixtures/extraction/extractionGolden.ts`: vendor 16/10/10/3, receipt
18/8/8/6, payment 14/8/8/7). #2 **adds** a second extractor path; it never
edits `extractionAccuracy.integration.test.ts` or `BASELINE_TALLY`.

### 2.5 Premise correction (recorded for honesty)

An earlier draft asserted `claude-sonnet-4-5` does **not** support structured
outputs and framed a three-way model/technique fork. **That premise was
wrong** (stale recall from a cached model-support list). Corrected by the
advisor and confirmed against the primary source:

- **Primary source** (`platform.claude.com/docs/en/build-with-claude/structured-outputs`,
  fetched 2026-06-15): structured outputs is **GA** "for Claude Fable 5 …
  Claude Sonnet 4.6, **Claude Sonnet 4.5**, Claude Opus 4.5, and Claude Haiku
  4.5," on the **standard `client.messages` endpoint, no beta header
  required**. `output_config.format` is canonical; `output_format` and the
  `structured-outputs-2025-11-13` beta header are deprecated transition
  aliases. `additionalProperties:false` is required (SDKs auto-add);
  numeric/string constraints are stripped from the wire schema and validated
  client-side.
- **Installed SDK** (`@anthropic-ai/sdk@0.90.0`): exposes structured outputs
  on the **non-beta** namespace — `client.messages.parse()`
  (`resources/messages/messages.d.ts:52`), `output_config.format` documented
  on non-beta `client.messages.create` (`resources/messages/messages.js:44-76`),
  and `zodOutputFormat()` from `helpers/zod.d.ts:12`.
- **Keystone confirmed both ways (2026-06-15).** Byte evidence:
  `resources/messages/messages.d.ts:1802` `interface MessageCreateParamsBase`
  → `:1908` `output_config?: OutputConfig;` (on the non-beta base);
  `:708 interface OutputConfig` → `:717 format?: JSONOutputFormat | null`;
  `:506 interface JSONOutputFormat`. Behavioral proof: a throwaway `tsc`
  probe (since deleted) building
  `const p: Anthropic.Messages.MessageCreateParams = { …, output_config: { format: zodOutputFormat(schema) } }`
  + `Anthropic['messages']['parse']` type-checked **exit 0** against the
  pinned SDK. So 0.90.0 sits on the GA side of the cutover; the "reuse the
  `callClaude` seam" sentence is no longer contingent.
  **Stamp provenance (honest):** the dispositive arbiter is the `tsc` probe
  (WSL's lane — it ran against whatever pnpm actually resolved), plus the
  advisor's first-hand confirmation that `callClaude` passes `params` straight
  to `client.messages.create(params)` with no field whitelist (nothing strips
  `output_config` at the seam). The `.d.ts` line-cites are corroboration: the
  advisor's mount could not reach the SDK internals (pnpm store / symlink
  resolution), so it accepts them **on report**, not first-hand. The keystone
  rests on tsc + the verified seam, not on the byte-cite alone.

Consequence: structured outputs **threads through the existing `callClaude`
seam** (which calls `client.messages.create(params)` on the standard
namespace — `callClaude.ts:99-102, 145`), passing `output_config` as a plain
param and reading the raw text block. No model bump, no beta namespace, no
seam rewrite.

---

## 3. Decision A — resolved

**The structured-output extractor uses JSON structured outputs
(`output_config.format` with a JSON schema **derived** from
`VendorInvoiceExtractionSchema` — see §6.4) on `claude-sonnet-4-5`, model held
fixed.** This dominates the three options
that were on the table once the premise is corrected:

- Beats *tool-forced-without-strict*: we get the real constrained-decoding
  guarantee.
- Beats *model-bump strict SO*: no model change ⇒ no "structured-output vs.
  newer-model" confound; the extractor under test still matches live prod's
  model.
- Beats *free-text-baseline-only*: it delivers the board's named deliverable,
  not a second baseline number.

We keep the free-text path too — as the captured "before" point (§1, parent
§3.1).

**Deliberate model discipline:** the claude-api skill default ("use
`claude-opus-4-8` unless told otherwise") is intentionally **not** applied —
the eval's purpose is to measure the *live* extractor, so the model is pinned
to the production value `claude-sonnet-4-5`.

---

## 4. Architecture — capture-then-replay (constraint-forced)

The harness is synchronous and free; parent §3.1 requires the score be
"re-computable deterministically and re-runnable without re-billing." Those
two facts force a two-piece shape:

```
  PAID, gated, on-demand                FREE, deterministic, CI-safe
  ──────────────────────                ────────────────────────────
  capture runner (Phil runs)            replay ExtractionFn + scoring test
  ───────────────────────────────────   ─────────────────────────────────
  for each corpus doc:                   read committed fixture
    ocrText = ocrTextFromLines(lines)    replayExtractor(version) =
    call Claude TWICE:                     (ocrText, type) =>
      • free-text params (prod-faithful)     parse(fixture[hash(ocrText)][version])
      • structured-output params           runExtractionEval(replay, CORPUS, truthFor)
    capture RAW text block (pre-Zod)       aggregate per type
    key by (ocrTextHash); stamp            diff vs BASELINE_TALLY  ← the metric
  write committed fixture
```

### 4.1 Component A — capture runner (NEW; gated; paid; Phil runs)

- A gated integration test
  (`tests/integration/structuredOutputExtractionEval.capture.integration.test.ts`,
  name TBD), `describe.skipIf(!SHOULD_RUN)` with
  `RUN_STRUCTURED_OUTPUT_EVAL=1 && ANTHROPIC_API_KEY` (board-#3 idiom).
- For each `REAL_OCR_CORPUS` doc: derive `ocrText` via the **exported**
  `ocrTextFromLines(doc.lines)` (so capture and harness see identical text),
  build the **production per-type system prompt**, and call `callClaude`
  **twice**:
  - **free-text** — params identical to prod
    (`aiFallbackExtractorBase.ts:137-147`: same model, max_tokens, system
    prompt, and the verbatim user message "Return the JSON object … JSON only
    — no markdown fences"). Faithfully represents the live path.
  - **structured-output** — same prompt/model/max_tokens **plus**
    `output_config: { format: { type:'json_schema', schema: deriveStructuredSchema(VendorInvoiceExtractionSchema) } }` — JSON schema **derived** from
    the prod Zod schema, NOT `zodOutputFormat` (which throws against
    `zod@3.25.76`; see §6.4).
- Capture the **raw text block** (`resp.content.find(b => b.type === 'text').text`)
  for each, pre-Zod, **plus `stop_reason` and `usage`** (advisor catch).
  Rationale: a structured call can be non-conforming on `stop_reason:
  "refusal"` or truncated at the inherited `max_tokens: 4096` (a many-line-item
  invoice is the realistic case) — and a truncated structured response replays
  as unparseable → `{}` → scored as a *genuine coverage miss*, indistinguishable
  from the model actually failing to find the field. Capturing `stop_reason`
  makes the truncation/refusal artifact diagnosable **without re-billing**, so
  it must land here (Task 2/3), before the paid run. Keep `max_tokens` at the
  prod value (4096) for faithfulness; surface truncation via `stop_reason`
  rather than silently raising the cap (which would diverge from prod). Do
  **not** safeParse, consume budget, or emit audit events.
- **Fixture-branch guard (advisor catch).** `callClaude`'s `__mockFixture`
  branch short-circuits before the real client (`callClaude.ts:108-123`): a
  non-null queue silently returns mock fixtures instead of hitting real
  Claude. The capture runner must ensure the queue is null
  (`__setMockFixtureQueue(null)`) at setup, or the "paid" run captures mock
  data. Same impl-onset check board-#3 carried.
- Write the capture fixture (Component C) **incrementally — persist after each
  doc, and resume-skip docs already captured (advisor catch)** — so a mid-loop
  failure keeps prior docs and a re-run only re-bills the missing ones (the run
  is the one expensive irreversible step). Phil executes; we build + verify the
  gate skips with the env unset.

### 4.2 Component B — replay ExtractionFn + scoring test (NEW; free; CI-safe)

- `replayExtractor(fixture, version): ExtractionFn` = `(ocrText, type) =>`
  look up `fixture[sha256(ocrText)][version].raw`, fence-strip + `JSON.parse`
  → `Record`; on missing/parse-fail return `{}` (honest zero coverage).
- **Diagnostic flag (paired with the `stop_reason` capture).** The scoring/report
  step flags any captured entry whose `stop_reason !== 'end_turn'` (refusal /
  `max_tokens` truncation) so a non-conformance artifact is **not silently
  scored as a coverage miss**. A flagged entry is reported separately, not
  folded into the delta as if it were a real extraction failure.
- A scoring test (un-gated; reads the committed fixture; no API) runs
  `runExtractionEval(replayExtractor(fixture,'structured'), REAL_OCR_CORPUS, truthFor)`,
  aggregates per type, and **reports** the delta vs `BASELINE_TALLY`. It also
  runs the `'freetext'` version for the before/after diff. Output: three
  columns per type — Tier-A baseline / free-text real-Claude /
  structured-output real-Claude.
- **No tight ratchet.** Per parent §3.2 a captured run is "the score of that
  sample," not the extractor's true accuracy — so the test reports and makes
  only loose sanity assertions (fixture present for every corpus doc; shapes
  well-formed), **not** an equality freeze. **Resolved default (advisor-endorsed):**
  **report-only for the first paid run.** A soft directional assertion (e.g.
  structured coverage ≥ free-text coverage) can fail legitimately on a small
  sample (one doc where structured drops a field), so defer it until the
  captured delta is seen stable across a run. Final toggle remains Phil's.
- **Single-sample noise (state it where the metric is read).** The delta is
  one draw per doc over a ~10–12-doc corpus — directional, not statistically
  settled. Any adopt/don't-adopt read off the structured-vs-free-text gap must
  carry that caveat; a per-type swing of a field or two is within sample
  noise, not signal.

### 4.3 Component C — capture fixture (NEW disk artifact; committed)

- Keyed by **`ocrTextHash`** (sha256 of the production `ocrText`), because
  the harness passes the extractor only `(ocrText, type)` — never the label —
  so the replay must look up by something derivable from `ocrText`. This keeps
  the harness **byte-identical** (no signature change). Each entry also stores
  the human-readable `label` for inspection.
- Per entry, per extractor-version (`freetext` / `structured`):
  `{ raw, stop_reason, usage, stamp }` where
  `stamp = "captured-sample · <YYYY-MM-DD> · claude-sonnet-4-5"` (parent §3.2).
  `stop_reason` + `usage` make truncation/refusal diagnosable without
  re-billing (§4.1). File header documents that it is a frozen sample of a
  non-deterministic model.
- Committed so the score is re-computable without re-billing (parent §3.1).
  PII note: the corpus is already sanitized (`corpus.sanitized.ts`); the
  captured raw is model output over sanitized input — confirm no PII
  re-introduction at capture review before commit.

---

## 5. Constraints honored

- **Baseline untouched.** `BASELINE_TALLY` and
  `extractionAccuracy.integration.test.ts` stay byte-identical; #2 adds a
  second extractor path. The ratchet is the proof.
- **`line_items` out of scope for *scoring*** (parent §2.4, deferred to #4).
  The 5-field `SCORED_FIELDS` core keeps #2 inside the verified scalar
  `valuesMatch`; the scorer never touches `line_items`.
- **Schema decision (advisor-flagged) — capture emits the FULL 11-field prod
  `VendorInvoiceExtractionSchema`, `line_items` included.** Rationale:
  *faithfulness*. The eval must measure what prod-with-structured-output would
  actually emit; reducing the schema to the 5 scored scalars would test a
  different, non-prod extractor and bias the delta. Consequence: the
  **derived-schema** translation (`deriveStructuredSchema`, §6.4) must cover
  the `line_items: z.array(...)` path — probed clean (§6.3/§6.4). We do **not**
  silently fall back
  to a reduced schema if translation chokes; we STOP-SURFACE and decide with
  Phil, because a reduced schema changes what is being measured.
- **`vendor_id` excluded** (matcher-gap, parent §7) — not in `SCORED_FIELDS`.
- **Paid run is Phil's.** We build + gate + verify-skipped; we never fire real
  Claude.
- **Single ground-truth home.** No `expectedExtraction?` on the fixture
  (parent §2.2); truth stays in `EXTRACTION_GROUND_TRUTH`.

---

## 6. Open items to verify at implementation onset (not yet resolved)

Flagged honestly per the verify-from-disk discipline — do **not** treat as
settled:

1. **RESOLVED (2026-06-15).** `output_config` is on the non-beta
   `MessageCreateParamsBase` in SDK 0.90.0 (`messages.d.ts:1908`), confirmed by
   byte read + a `tsc` probe (exit 0) — see §2.5. The "reuse the `callClaude`
   seam" path holds; no fallback needed. (Fallback, recorded for completeness:
   if a future SDK bump moves it beta-only, the capture runner calls
   `client.beta.messages` / `messages.parse` directly — bypasses only the
   seam's retry/classification reuse; the architecture is untouched.)
2. **Per-type system prompt source.** Locate where the prod extractor builds
   the `vendor_invoice` / `receipt` / `payment_confirmation` system prompts
   (referenced from `extractFields.ts`'s per-type modules) and reuse them
   verbatim across both calls, so the **prod** system prompt is held fixed.
   (The structured call additionally carries the SDK-injected format prompt —
   intrinsic to structured outputs, part of the mechanism under test, not a
   confound to remove; §1.)
3. **Schema translation — FIRED & RESOLVED at plan-authoring (see §6.4).** This
   was the predicted highest-risk item; the STOP-SURFACE fired. Outcome:
   `zodOutputFormat` is unusable (throws against `zod@3.25.76`), so the schema
   is **derived** via `zod-to-json-schema` (`deriveStructuredSchema`). The
   feared `line_items: z.array(<object>)` translation was probed first-hand and
   is clean (proper array-of-objects; `additionalProperties:false` forced;
   `vendor_id` → `anyOf[string|null]`). Full 11/12/11-field schemas retained —
   no silent reduction. The only residual is API-acceptance of the all-optional
   schema, confirmed at the paid run (§6.4 residual + union-cap caveat).
4. **Receipt / payment schemas** — the parent §4 seed names vendor-invoice
   docs; confirm whether #2 scores all three corpus types (the harness +
   `SCORED_FIELDS` already cover them) and that each type has a prod
   extraction schema to derive the structured-output JSON schema from (§6.4).
5. **`callClaude.ts` confirmation** — already read this session: standard
   namespace, passes `params` through, returns raw `Message` (`:99-102, 145`,
   `:248-285`). No further action; listed for the record.

### 6.4 Plan-authoring discovery (2026-06-15) — `zodOutputFormat` is NOT viable; derive the schema instead

**SUPERSEDES the `zodOutputFormat(...)` references in §4.1, §5, §6.3, and §7.**
The §6.3 STOP-SURFACE fired at plan-authoring — but the cause is broader than
the predicted `line_items` translation, and the fix preserves full fidelity
(no scope change).

- **Finding (probed first-hand).** `zodOutputFormat(schema)` from
  `@anthropic-ai/sdk@0.90.0` **throws at runtime** on *any* schema (trivial
  included): `TypeError: Cannot read properties of undefined (reading 'def')`.
  Root cause: a **zod v3-schema / v4-converter mismatch** — the prod extraction
  schemas are zod-v3 (`._def`), but the SDK helper calls zod's v4
  `toJSONSchema` (`.def`); `z.toJSONSchema` is not even a function on the
  installed `zod@3.25.76`. Env-independent (baked into the pinned versions),
  not a probe artifact. The earlier keystone `tsc` proof established *type*
  acceptance of `output_config`, **not** `zodOutputFormat`'s runtime viability
  — that gap is what plan-authoring grounding caught.
- **Resolution (fidelity-preserving).** Build `output_config.format.schema` by
  **deriving the JSON schema from the prod Zod schema** via
  `zod-to-json-schema@^3.25.2` (already a dependency, `apps/web/package.json:43`,
  pinned v3-compatible against `zod@3.25.76`), then **mirror the SDK's
  structured-outputs transform offline** (`deriveStructuredSchema` →
  `sdkTransform`): strip unsupported numeric/string/array constraints, filter
  `format` to the supported list, force `additionalProperties:false`. No drift
  (single source = the prod schema), no hand-authoring, no broken helper.
  `JSONOutputFormat` is `{ type: 'json_schema', schema: Record<string,unknown> }`
  (`messages.d.ts:506-514`) — a plain derived object fits. Full 11/12/11-field
  schemas (`line_items` included) retained; the converter handles arrays/objects
  natively, so the feared `line_items` translation risk is moot.
- **Offline cleanliness proven (advisor catch — 2026-06-15).** Because we
  hand-derive, the SDK transform does NOT run for us; without the mirror,
  `format:"uuid"` (and any constraint) would leak through Tasks 2-3 green and
  first meet the API at the *billed* Task 4. Empirically the only constraint
  feature across all three prod schemas is `format:"uuid"` — a **supported**
  format (structured-outputs doc), so it is kept. A Task-2 unit test asserts no
  unsupported constraint/format survives for *any* type, so the derived schema
  is **provably API-clean offline**; a future schema introducing an unsupported
  feature fails that test (STOP-SURFACE) rather than a 400 during the paid run.
- **Residual — the ONLY paid-run unknown (format/constraint cleanliness is
  closed offline, above).** Whether Anthropic structured outputs accepts an
  all-`.optional()` / empty-`required` schema (the advisor's "caps on optional
  params") cannot be settled without an API call. (Source-verified de-risk: the
  **24-optional-param budget is satisfied** — ~15 optional params across the
  vendor schema incl. nested line-items — so that limit won't bite; the genuine
  unknown is empty-`required` acceptance alone, and the union-cap-16 bites only
  IF the nullable-required fallback is invoked, with incremental-resume bounding
  the worst case to a one-doc re-bill.) If the paid run
  400s on the schema, STOP-SURFACE; the documented fallback is the standard
  structured-outputs adaptation — make each property nullable-and-required
  (`type: [T,'null']`, all keys in `required`) in the derived schema. **The
  fallback is not guaranteed trivial (advisor):** that adaptation makes every
  field a *union* type, and structured outputs caps union-typed parameters at
  **16**; the 11-field vendor schema + nested `line_items` sub-fields could
  brush that ceiling, needing a further step (e.g. drop `line_items` from the
  structured schema, or split). The metric/architecture are unchanged either
  way.
- **RESOLVED at the paid run (2026-06-16) — the residual fired in TWO stages,
  both fixed scope-preservingly.** (1) The vendor structured call → 400 "Schema
  is too complex." (the `line_items` nested array-of-objects). Fix: drop the
  unscored `line_items` from the vendor *structured* schema
  (`PER_TYPE_CONFIG.vendor_invoice.structuredSchema = …omit({ line_items: true })`).
  (2) Receipt + payment → 400 "Grammar compilation timed out." — exactly the
  advisor's predicted branch: the count budget (24) was satisfied, but the
  all-`.optional()` present/absent state space (2^N) overran grammar
  compilation. Fix: `makeRequiredNullable` in `deriveStructuredSchema` — every
  property becomes required + nullable (`type:[T,'null']`, all keys in
  `required`), collapsing the present/absent branching to a grammar linear in
  field count. Scope-preserving: the scorer reads `null` exactly like an
  absent/omitted field (unit-asserted: null and omitted yield an identical
  `DocScore`). A cheap per-type acceptance probe (in the capture test) confirmed
  all three schemas accepted **before** the billed loop. The union-cap-16
  concern did not bite (each field is just a `[T,'null']` union). Outcome: all
  12 corpus docs captured (free-text + structured, all `end_turn`). **Two
  measurement nuances for any reader of the delta:** (a) `line_items` is absent
  from the structured schema but present in the free-text prompt; (b)
  required-nullable forces the structured side to emit every field (value-or-
  `null`) where free-text may omit. Neither corrupts the scored-scalar delta
  (`null` ≡ absent), but the structured side operates under constraints the
  free-text side doesn't — read the delta as **"structured-outputs-as-it-would-
  actually-be-deployed vs free-text,"** not a clean technique-isolated A/B.
- **KEY FINDING — multi-invoice (`amazon_invoice`) divergence the scalar scorer
  masks (advisor catch; verified first-hand against the fixture 2026-06-16).**
  Both AI paths score **0/3 on `amazon_invoice`, for OPPOSITE reasons**, so
  "structured ≈ free-text" on the vendor row is misleading and must not be read
  as agreement there:
  - **Free-text extracted it CORRECTLY** — a 3-element JSON array (all three
    sub-invoices, full fields incl. line_items). But `makeReplayExtractor`'s
    array-guard routes a bare array → `{}` (a multi-invoice array is not a
    single-object field record), so the scorer sees zero. **Eval-shape
    artifact**, not a model miss — multi-invoice scoring is the deferred
    **board-#4** domain.
  - **Structured COLLAPSED** — the single-object required-nullable schema
    (`line_items` dropped) cannot represent three invoices, so the model
    returned **all 10 fields null**. A **genuine structured-outputs failure
    mode** on multi-invoice input.
  - Honest vendor read: **3 single-invoice docs (figma / mattjanzen / adobe)
    fully covered 13/13 by both — genuine structured≈free-text there — plus 1
    multi-invoice outlier (`amazon`) where they did opposite things but both
    scored 0.** For adopt/don't-adopt this is load-bearing: **structured outputs
    regress to all-null on multi-invoice, where free-text produces the data** —
    a disadvantage the scalar scorer cannot surface. Ties directly to board-#4.

---

## 7. Implementation plan (checkbox task form)

> Build order. The paid step (Task 4) is **Phil's**; everything else is
> ours and verifies with the gate skipped.

- [ ] **Task 1 — Impl-onset grounding (resolve §6 open items).**
  - [x] `tsc`/type-read: `output_config` on non-beta `MessageCreateParamsBase`
        — **RESOLVED 2026-06-15** (byte read + `tsc` probe exit 0; §2.5/§6.1).
  - [ ] Locate + cite the prod per-type system-prompt builders; confirm reuse
        path.
  - [x] Schema derivation via `deriveStructuredSchema` (`zod-to-json-schema`)
        — **RESOLVED 2026-06-15** (§6.4; probed first-hand on the full vendor
        schema incl. `line_items`; `zodOutputFormat` retired). Pinned as Task 2
        unit-test assertions in the plan.
  - [ ] Confirm receipt + payment prod schemas exist to derive from.
  - [ ] Record findings inline (verify-from-disk); STOP-SURFACE on any
        divergence from this design.

- [ ] **Task 2 — Capture runner (gated, paid; Component A).**
  - [ ] New gated integration test; `RUN_STRUCTURED_OUTPUT_EVAL=1 &&
        ANTHROPIC_API_KEY` + `describe.skipIf` (board-#3 idiom).
  - [ ] Per corpus doc: `ocrTextFromLines(doc.lines)` (reuse export); build
        prod system prompt; call `callClaude` twice (free-text params =
        prod-verbatim; structured-output params = + `output_config.format`).
  - [ ] Capture raw text block **+ `stop_reason` + `usage`** pre-Zod; **no**
        safeParse / budget / audit. (`stop_reason` makes truncation/refusal
        diagnosable without re-billing — §4.1; must land before Task 4.)
  - [ ] **Fixture-branch guard:** `__setMockFixtureQueue(null)` at setup so the
        paid run hits real Claude, not mock fixtures (`callClaude.ts:108-123`).
  - [ ] Assert the gate skips cleanly with the env unset (our verification).

- [ ] **Task 3 — Capture fixture writer + schema (Component C).**
  - [ ] Define the fixture shape: `{ [ocrTextHash]: { label,
        freetext:{raw,stop_reason,usage,stamp},
        structured:{raw,stop_reason,usage,stamp} } }`; stamp
        `captured-sample · <date> · claude-sonnet-4-5`.
  - [ ] Writer keyed by `sha256(ocrText)` (same hash both sides); header
        documents the non-deterministic-sample caveat.
  - [ ] (Phil, at capture time) PII spot-check the model output before commit.

- [ ] **Task 4 — PAID CAPTURE RUN (PHIL).**
  - [ ] Phil runs the gated capture with `RUN_STRUCTURED_OUTPUT_EVAL=1` +
        `ANTHROPIC_API_KEY`; produces + commits the fixture (~2 calls × corpus
        docs; small, on the order of the prior Tier-C exercise cost).

- [ ] **Task 5 — Replay ExtractionFn + scoring test (Component B; free,
      CI-safe).**
  - [ ] `replayExtractor(fixture, version): ExtractionFn` — hash-lookup →
        fence-strip + `JSON.parse` → `Record`; `{}` on miss/parse-fail.
  - [ ] Scoring test: `runExtractionEval` for `structured` (and `freetext`);
        aggregate per type; **report** the three-column delta vs
        `BASELINE_TALLY`; loose sanity assertions only (no equality freeze).
  - [ ] Flag any entry with `stop_reason !== 'end_turn'` (refusal/truncation)
        in the report — do not fold it into the delta as a coverage miss (§4.2).
  - [ ] Confirm the existing baseline test + `BASELINE_TALLY` remain
        byte-identical (diff clean).

- [ ] **Task 6 — Close.**
  - [ ] `pnpm typecheck` + the un-gated scoring test green with the committed
        fixture; gated capture verified-skipped in normal runs.
  - [ ] Hand the delta table to advisor + Phil; record the metric.

---

## 8. Out of scope / deferred

- **`line_items` line-item-aware scorer** — parent §2.4, deferred to #4. Not
  pulled forward.
- **`vendor_id` scoring** — matcher-gap, parent §7. Excluded.
- **Tight regression ratchet on the SO score** — inappropriate for a
  non-deterministic captured sample (parent §3.2); report-only by default.
