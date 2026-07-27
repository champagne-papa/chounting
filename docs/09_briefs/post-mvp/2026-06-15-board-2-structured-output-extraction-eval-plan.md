# Board #2 — Structured-Output Extraction Eval — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Score a real-Claude *structured-output* extractor (Anthropic JSON structured outputs on the prod model `claude-sonnet-4-5`, model held fixed) through the existing `runExtractionEval` over the frozen real-OCR corpus + `SCORED_FIELDS`, and diff its per-type aggregates against the Tier-A `BASELINE_TALLY`.

**Architecture:** Capture-then-replay. A **gated, paid** capture runner calls Claude twice per corpus doc (free-text params = prod-verbatim; structured params = prod + `output_config.format`), capturing the raw pre-Zod text **plus `stop_reason` + `usage`**, keyed by `sha256(ocrText)`, into a committed fixture. A **free, deterministic** scoring test replays the fixture through the *unmodified* `runExtractionEval` and reports the per-type delta. The Tier-A baseline harness stays byte-identical.

**Tech Stack:** TypeScript, Vitest, `@anthropic-ai/sdk@0.90.0` (structured outputs via `output_config.format`, JSON schema **derived** from the prod Zod schema with `zod-to-json-schema@^3.25.2` — see design §6.4), the existing `callClaude` seam, the existing `extractionEval.ts` harness.

**Design authority:** `docs/09_briefs/post-mvp/2026-06-15-board-2-structured-output-extraction-eval-design.md` (advisor + Phil approved; §6.4 records the `zodOutputFormat`→`zod-to-json-schema` correction discovered at plan-authoring).

**Lane rules (binding):** WSL (implementer) authors code + runs un-paid suites + grounding. **Phil executes ALL commits AND the single paid capture run (Task 4 — real billed Claude).** The implementer never commits, never pushes, never fires real Claude. Every "commit" step below is a **hand-off to Phil** with the exact command, not something the implementer runs.

---

## File Structure

| File | Responsibility |
|---|---|
| `apps/web/tests/helpers/structuredOutputEval.ts` | **Create.** Pure, I/O-free helpers shared by capture + scoring: per-type config (prod prompt + Zod schema), `EVAL_MODEL`/`EVAL_MAX_TOKENS`, `buildUserMessage`, `deriveStructuredSchema`, `ocrTextHash`, fixture types, `replayExtractor`. No AI, no DB, no fs. |
| `apps/web/tests/helpers/structuredOutputEval.test.ts` | **Create.** Unit tests (TDD) for the pure helpers. |
| `apps/web/tests/integration/structuredOutputExtractionEval.capture.integration.test.ts` | **Create.** Gated **paid** capture runner (real Claude via `callClaude`); writes the fixture. |
| `apps/web/tests/fixtures/extraction/structuredOutputCaptures.json` | **Create (by the paid run; Phil commits).** The captured sample, keyed by `ocrTextHash`. |
| `apps/web/tests/integration/structuredOutputExtractionEval.scoring.integration.test.ts` | **Create.** Free, CI-safe replay + scoring test; reports the three-column delta. |
| `apps/web/src/agent/orchestrator/extraction/{vendorInvoiceExtractor,receiptExtractor,paymentConfirmationExtractor}.ts` | **Possibly modify (Task 1, conditional):** add `export` to the module-local `SYSTEM_PROMPT_CONTENT` if not already exported. Additive, non-behavioral; never touches the Tier-A path. |

**Untouched (proof of the no-perturbation invariant):** `apps/web/tests/helpers/extractionEval.ts`, `apps/web/tests/fixtures/extraction/extractionGolden.ts` (incl. `BASELINE_TALLY`), `apps/web/tests/integration/extractionAccuracy.integration.test.ts`.

---

## Task 1: Impl-onset grounding (STOP-SURFACE on divergence)

**Files:** read-only verification, plus the conditional `export` edits above.

Most of this is pre-grounded in the design (§2, §6.4); this task re-verifies against disk at execution time (the repo may have drifted) and resolves the two items that bind later code.

- [ ] **Step 1: Verify the prod prompt exports.** Confirm each module exports a `SYSTEM_PROMPT_CONTENT` string constant:

Run:
```bash
cd apps/web
grep -n "export const SYSTEM_PROMPT_CONTENT" \
  src/agent/orchestrator/extraction/vendorInvoiceExtractor.ts \
  src/agent/orchestrator/extraction/receiptExtractor.ts \
  src/agent/orchestrator/extraction/paymentConfirmationExtractor.ts
```
Expected: three hits. **If a module declares `const SYSTEM_PROMPT_CONTENT` without `export`,** add the keyword (additive, non-behavioral) and note it in the Task-1 close for Phil's commit. **If the constant name differs**, record the real name and adjust the imports in Task 2 Step 1 — STOP-SURFACE if any module builds its prompt some other way (e.g. a template fn), do not guess.

- [ ] **Step 2: Verify the prod call constants still match.** Confirm `aiFallbackExtractorBase.ts` still uses model `claude-sonnet-4-5`, max_tokens `4096`, and the user-message template:

Run:
```bash
cd apps/web
grep -n "ANTHROPIC_MODEL = \|ANTHROPIC_MAX_TOKENS = \|OCR text for \${input.documentType}" \
  src/agent/orchestrator/extraction/aiFallbackExtractorBase.ts
```
Expected: `claude-sonnet-4-5`, `4096`, and the `OCR text for ... JSON only — no markdown fences.` template. **If any differ**, update `EVAL_MODEL`/`EVAL_MAX_TOKENS`/`buildUserMessage` in Task 2 to match (the eval must mirror prod) and STOP-SURFACE the drift.

- [ ] **Step 3: Confirm the schema-derivation path in-repo (the §6.4 correction).** This was probed first-hand at plan-authoring and works; re-confirm against the live tree:

Run:
```bash
cd apps/web
node -e "const {zodToJsonSchema}=require('zod-to-json-schema'); console.log(typeof zodToJsonSchema)" 2>/dev/null || echo "ESM-only; confirm via the Task 2 unit test instead"
grep -n '"zod-to-json-schema"' package.json
```
Expected: `zod-to-json-schema` is a dependency. The real confirmation is the Task 2 `deriveStructuredSchema` unit tests (Step 4) — including the **API-clean-across-all-three** assertion. Empirically (probed at plan-authoring) the only constraint feature across all three prod schemas is `format:"uuid"` (a **supported** format — structured-outputs doc 2026-06-15); the transform keeps it and the test proves no unsupported feature leaks for any type. STOP-SURFACE if that test fails (a schema introduced an unsupported `format`/constraint). **Do NOT use `zodOutputFormat` — it throws against `zod@3.25.76` (design §6.4).**

- [ ] **Step 4: Confirm `JSONOutputFormat` shape.** Confirm the SO format literal is `{ type: 'json_schema', schema }` with no other required field:

Run:
```bash
cd apps/web
sed -n '506,514p' node_modules/@anthropic-ai/sdk/resources/messages/messages.d.ts
```
Expected: `interface JSONOutputFormat { schema: {...}; type: 'json_schema' }`. If a `name`/`strict` field became required in a future SDK bump, add it in Task 3.

- [ ] **Step 5: Close Task 1.** Record findings inline. If any export was added, stage it for Phil:

**[PHIL] Commit (only if an `export` was added):**
```bash
git add apps/web/src/agent/orchestrator/extraction/*Extractor.ts
git commit -m "chore(extraction): export SYSTEM_PROMPT_CONTENT for eval reuse (non-behavioral)"
```

---

## Task 2: Pure helpers + unit tests (TDD)

**Files:**
- Create: `apps/web/tests/helpers/structuredOutputEval.ts`
- Test: `apps/web/tests/helpers/structuredOutputEval.test.ts`

- [ ] **Step 1: Write the helper module.**

```typescript
// apps/web/tests/helpers/structuredOutputEval.ts
//
// Board #2 — pure helpers for the structured-output extraction eval.
// No AI, no DB, no fs. Shared by the (paid) capture runner and the (free)
// scoring test. Design: docs/09_briefs/post-mvp/2026-06-15-board-2-*-design.md.
import crypto from 'crypto';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { z } from 'zod';
import type { DocumentType } from './extractionEval';
// Prod extraction schemas (the SO json_schema is DERIVED from these — design §6.4):
import { VendorInvoiceExtractionSchema } from '@/shared/schemas/extraction/vendorInvoiceExtractionSchema';
import { ReceiptExtractionSchema } from '@/shared/schemas/extraction/receiptExtractionSchema';
import { PaymentConfirmationExtractionSchema } from '@/shared/schemas/extraction/paymentConfirmationExtractionSchema';
// Prod system prompts (reused verbatim so only the OUTPUT MODE differs — Task 1):
import { SYSTEM_PROMPT_CONTENT as VENDOR_PROMPT } from '@/agent/orchestrator/extraction/vendorInvoiceExtractor';
import { SYSTEM_PROMPT_CONTENT as RECEIPT_PROMPT } from '@/agent/orchestrator/extraction/receiptExtractor';
import { SYSTEM_PROMPT_CONTENT as PAYMENT_PROMPT } from '@/agent/orchestrator/extraction/paymentConfirmationExtractor';

// Must match aiFallbackExtractorBase.ts:30-31 (verified Task 1).
export const EVAL_MODEL = 'claude-sonnet-4-5';
export const EVAL_MAX_TOKENS = 4096;

export type ExtractorVersion = 'freetext' | 'structured';

export const PER_TYPE_CONFIG: Record<
  DocumentType,
  { systemPrompt: string; schema: z.ZodTypeAny }
> = {
  vendor_invoice: { systemPrompt: VENDOR_PROMPT, schema: VendorInvoiceExtractionSchema },
  receipt: { systemPrompt: RECEIPT_PROMPT, schema: ReceiptExtractionSchema },
  payment_confirmation: { systemPrompt: PAYMENT_PROMPT, schema: PaymentConfirmationExtractionSchema },
};

/** sha256 of the production OCR text — the fixture key (harness only hands the
 *  extractor (ocrText, type), never the label, so the key derives from ocrText). */
export function ocrTextHash(ocrText: string): string {
  return crypto.createHash('sha256').update(ocrText).digest('hex');
}

/** Verbatim mirror of aiFallbackExtractorBase.ts:144 (verified Task 1). */
export function buildUserMessage(documentType: DocumentType, ocrText: string): string {
  return `OCR text for ${documentType} document:\n\n${ocrText}\n\nReturn the JSON object per the extraction schema. JSON only — no markdown fences.`;
}

// Supported string formats — structured-outputs doc (fetched 2026-06-15):
// "date-time, time, date, duration, email, hostname, uri, ipv4, ipv6, uuid".
export const SUPPORTED_FORMATS = new Set([
  'date-time', 'time', 'date', 'duration', 'email', 'hostname', 'uri', 'ipv4', 'ipv6', 'uuid',
]);
// Constraint keywords the SDK transform REMOVES (structured-outputs doc §"How
// SDK transformation works"). We hand-derive, so the SDK does not run this for
// us — we must. $schema is stripped too (the API doesn't want it).
const STRIP_KEYS = new Set([
  '$schema', 'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum',
  'multipleOf', 'minLength', 'maxLength', 'minItems', 'maxItems', 'uniqueItems',
]);

/** Mirror the SDK's structured-outputs transform OFFLINE (advisor catch — we
 *  hand-derive, so it isn't done for us): strip unsupported numeric/string/array
 *  constraints, filter string `format` to the supported list (keeps uuid;
 *  drops anything unsupported), add additionalProperties:false to every object.
 *  Makes the derived schema provably API-clean offline, so the PAID run only
 *  meets genuine API behavior (all-optional acceptance), not a free-knowable
 *  defect. */
function sdkTransform(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(sdkTransform);
  if (node && typeof node === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (STRIP_KEYS.has(k)) continue;
      if (k === 'format' && typeof v === 'string' && !SUPPORTED_FORMATS.has(v)) continue;
      out[k] = sdkTransform(v);
    }
    if (out.type === 'object') out.additionalProperties = false;
    return out;
  }
  return node;
}

/** Derive a structured-outputs json_schema from a prod Zod schema. Uses
 *  zod-to-json-schema (zod-v3 compatible) — NOT the SDK's zodOutputFormat,
 *  which throws against zod@3.25.76 (design §6.4) — then mirrors the SDK
 *  transform via sdkTransform so the result is API-clean offline. */
export function deriveStructuredSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  const raw = zodToJsonSchema(schema, { $refStrategy: 'none', target: 'jsonSchema7' });
  return sdkTransform(raw) as Record<string, unknown>;
}

// ---- Capture fixture types ----
export interface CapturedSample {
  raw: string;            // raw model text, pre-Zod
  stop_reason: string | null;
  usage: { input_tokens: number; output_tokens: number };
  stamp: string;          // "captured-sample · YYYY-MM-DD · claude-sonnet-4-5"
}
export interface CaptureEntry {
  label: string;
  expectedType: DocumentType;
  freetext: CapturedSample;
  structured: CapturedSample;
}
/** Keyed by ocrTextHash. */
export type CaptureFixture = Record<string, CaptureEntry>;

/** Strip markdown fences, mirroring aiFallbackExtractorBase.ts:182-184. */
export function stripFences(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

/** Build a SYNC ExtractionFn that replays one captured version. Looks up by
 *  ocrTextHash; parse-fail / miss → {} (honest zero coverage). */
export function makeReplayExtractor(fixture: CaptureFixture, version: ExtractorVersion) {
  return (ocrText: string): Record<string, unknown> => {
    const entry = fixture[ocrTextHash(ocrText)];
    if (!entry) return {};
    try {
      const parsed = JSON.parse(stripFences(entry[version].raw));
      // object only — null / bare array / scalar all count as no extraction → {}
      return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  };
}
```

- [ ] **Step 2: Write the failing unit tests.**

```typescript
// apps/web/tests/helpers/structuredOutputEval.test.ts
import { describe, it, expect } from 'vitest';
import {
  deriveStructuredSchema,
  SUPPORTED_FORMATS,
  ocrTextHash,
  buildUserMessage,
  stripFences,
  makeReplayExtractor,
  PER_TYPE_CONFIG,
  type CaptureFixture,
} from './structuredOutputEval';

describe('deriveStructuredSchema', () => {
  it('forces additionalProperties:false top-level and on nested array items', () => {
    const s = deriveStructuredSchema(PER_TYPE_CONFIG.vendor_invoice.schema);
    expect(s.additionalProperties).toBe(false);
    const props = s.properties as Record<string, any>;
    expect(props.line_items.type).toBe('array');
    expect(props.line_items.items.additionalProperties).toBe(false);
  });
  it('strips $schema and emits no unsupported numeric/string constraints', () => {
    const s = JSON.stringify(deriveStructuredSchema(PER_TYPE_CONFIG.receipt.schema));
    expect(s).not.toContain('$schema');
    expect(s).not.toMatch(/"(minimum|maximum|minLength|maxLength|multipleOf)"/);
  });
  it('derives all three prod schemas without throwing', () => {
    for (const t of ['vendor_invoice', 'receipt', 'payment_confirmation'] as const) {
      expect(() => deriveStructuredSchema(PER_TYPE_CONFIG[t].schema)).not.toThrow();
    }
  });
  // The offline API-cleanliness proof (advisor catch): no unsupported
  // constraint or unsupported `format` survives the transform, for ANY type.
  // If a future schema introduces one, THIS fails — the STOP-SURFACE before
  // the paid run, not a 400 during it.
  it('is provably API-clean across all three schemas (no unsupported constraint/format leak)', () => {
    const BAD = /"(minimum|maximum|exclusiveMinimum|exclusiveMaximum|multipleOf|minLength|maxLength|minItems|maxItems|uniqueItems)"/;
    for (const t of ['vendor_invoice', 'receipt', 'payment_confirmation'] as const) {
      const s = JSON.stringify(deriveStructuredSchema(PER_TYPE_CONFIG[t].schema));
      expect(s, `${t}: unsupported constraint leaked`).not.toMatch(BAD);
      expect(s, `${t}: $ref/$schema leaked`).not.toMatch(/"\$(ref|schema)"/);
      for (const f of [...s.matchAll(/"format":"([^"]+)"/g)].map((m) => m[1])) {
        expect(SUPPORTED_FORMATS.has(f), `${t}: unsupported format ${f}`).toBe(true);
      }
    }
  });
});

describe('ocrTextHash', () => {
  it('is deterministic and 64 hex chars', () => {
    expect(ocrTextHash('abc')).toBe(ocrTextHash('abc'));
    expect(ocrTextHash('abc')).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('buildUserMessage', () => {
  it('mirrors the prod template verbatim', () => {
    expect(buildUserMessage('receipt', 'LINE')).toBe(
      'OCR text for receipt document:\n\nLINE\n\nReturn the JSON object per the extraction schema. JSON only — no markdown fences.',
    );
  });
});

describe('makeReplayExtractor', () => {
  const fixture: CaptureFixture = {
    [ocrTextHash('OCRTEXT')]: {
      label: 'x', expectedType: 'vendor_invoice',
      freetext: { raw: '{"amount": 10}', stop_reason: 'end_turn', usage: { input_tokens: 1, output_tokens: 1 }, stamp: 's' },
      structured: { raw: '```json\n{"amount": 20}\n```', stop_reason: 'end_turn', usage: { input_tokens: 1, output_tokens: 1 }, stamp: 's' },
    },
  };
  it('parses raw, strips fences', () => {
    expect(makeReplayExtractor(fixture, 'freetext')('OCRTEXT')).toEqual({ amount: 10 });
    expect(makeReplayExtractor(fixture, 'structured')('OCRTEXT')).toEqual({ amount: 20 });
  });
  it('returns {} on miss and on parse failure', () => {
    expect(makeReplayExtractor(fixture, 'freetext')('MISSING')).toEqual({});
    const bad: CaptureFixture = { [ocrTextHash('B')]: { ...fixture[ocrTextHash('OCRTEXT')], freetext: { raw: 'not json', stop_reason: 'max_tokens', usage: { input_tokens: 1, output_tokens: 1 }, stamp: 's' } } };
    expect(makeReplayExtractor(bad, 'freetext')('B')).toEqual({});
  });
});

describe('stripFences', () => {
  it('removes ```json fences', () => {
    expect(stripFences('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail (module not yet importable / logic gaps).**

Run: `cd apps/web && pnpm vitest run tests/helpers/structuredOutputEval.test.ts`
Expected: FAIL initially if you wrote the test before the module; once Step 1 is in place, all green. (Note: this is a unit test under `tests/helpers/` — it still triggers the global setup, so `SUPABASE_TEST_URL` must be set in the env like any test run; it uses no DB.)

- [ ] **Step 4: Run the tests to verify they pass.**

Run: `cd apps/web && pnpm vitest run tests/helpers/structuredOutputEval.test.ts`
Expected: PASS (all describe blocks). This is also the live confirmation of the §6.4 derivation (replaces the broken `zodOutputFormat`).

- [ ] **Step 5: [PHIL] Commit.**
```bash
git add apps/web/tests/helpers/structuredOutputEval.ts apps/web/tests/helpers/structuredOutputEval.test.ts
git commit -m "feat(eval): board-#2 structured-output eval pure helpers (derive schema, replay, hash)"
```

---

## Task 3: Capture runner (gated, paid) + fixture writer

**Files:**
- Create: `apps/web/tests/integration/structuredOutputExtractionEval.capture.integration.test.ts`

This is the only file that calls real Claude. It is **gated** and **Phil-run** (Task 4). The implementer writes it and verifies it **skips** when the gate env is unset.

- [ ] **Step 1: Write the capture runner.**

```typescript
// apps/web/tests/integration/structuredOutputExtractionEval.capture.integration.test.ts
//
// Board #2 capture runner (LIVE, gated, PAID). Calls real Claude TWICE per
// corpus doc (free-text = prod-verbatim; structured = prod + output_config),
// captures raw pre-Zod text + stop_reason + usage, writes a committed fixture
// keyed by ocrTextHash. NOT a CI assertion target. Phil executes the paid run.
// Design: docs/09_briefs/post-mvp/2026-06-15-board-2-*-design.md §4.1.
import fs from 'fs';
import path from 'path';
import type Anthropic from '@anthropic-ai/sdk';
import { describe, it, expect } from 'vitest';
import { callClaude, __setMockFixtureQueue } from '@/agent/orchestrator/callClaude';
import { loggerWith } from '@/shared/logger/pino';
import { REAL_OCR_CORPUS } from '@/../tests/fixtures/classifier/real-ocr/corpus.sanitized';
import {
  ocrTextFromLines,
  type DocumentType,
} from '../helpers/extractionEval';
import {
  EVAL_MODEL,
  EVAL_MAX_TOKENS,
  PER_TYPE_CONFIG,
  buildUserMessage,
  deriveStructuredSchema,
  ocrTextHash,
  type CaptureFixture,
  type CapturedSample,
} from '../helpers/structuredOutputEval';

const SHOULD_RUN =
  process.env.RUN_STRUCTURED_OUTPUT_EVAL === '1' &&
  Boolean(process.env.ANTHROPIC_API_KEY);

const FIXTURE_PATH = path.resolve(
  process.cwd(),
  'tests/fixtures/extraction/structuredOutputCaptures.json',
);

// today's date as YYYY-MM-DD for the §3.2 stamp (capture time, real clock).
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function textBlock(resp: Anthropic.Messages.Message): string {
  const b = resp.content.find((x) => x.type === 'text');
  return b && b.type === 'text' ? b.text.trim() : '';
}

function toSample(resp: Anthropic.Messages.Message): CapturedSample {
  return {
    raw: textBlock(resp),
    stop_reason: resp.stop_reason ?? null,
    usage: {
      input_tokens: resp.usage.input_tokens,
      output_tokens: resp.usage.output_tokens,
    },
    stamp: `captured-sample · ${today()} · ${EVAL_MODEL}`,
  };
}

describe.skipIf(!SHOULD_RUN)(
  'board-#2 — structured-output extraction eval CAPTURE (LIVE, paid Claude)',
  () => {
    it('captures free-text + structured raw for every corpus doc', async () => {
      // Fixture-branch guard: ensure callClaude hits REAL Claude, not mocks
      // (callClaude.ts:108-123 short-circuits on a non-null mock queue).
      __setMockFixtureQueue(null);
      const log = loggerWith({ trace_id: 'board2-capture' });

      // Resume + incremental persist (advisor catch): load any partial fixture,
      // skip docs already captured, and write after EACH doc — so a mid-loop
      // throw (e.g. one structured call 400-ing) keeps every prior doc and a
      // re-run only re-bills the missing ones. Protects the paid spend.
      const fixture: CaptureFixture = fs.existsSync(FIXTURE_PATH)
        ? (JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8')) as CaptureFixture)
        : {};
      const persist = () =>
        fs.writeFileSync(FIXTURE_PATH, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8');

      for (const doc of REAL_OCR_CORPUS) {
        const type = doc.expectedType as DocumentType;
        const cfg = PER_TYPE_CONFIG[type];
        const ocrText = ocrTextFromLines(doc.lines);
        const key = ocrTextHash(ocrText);
        if (fixture[key]) continue; // already captured — resume, no re-bill

        const userMessage = buildUserMessage(type, ocrText);
        const baseParams: Anthropic.Messages.MessageCreateParams = {
          model: EVAL_MODEL,
          max_tokens: EVAL_MAX_TOKENS,
          system: cfg.systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        };

        // free-text: prod-verbatim, no output_config.
        const freeResp = await callClaude(baseParams, log);

        // structured: identical params + derived json_schema (design §6.4).
        const structuredParams: Anthropic.Messages.MessageCreateParams = {
          ...baseParams,
          output_config: {
            format: { type: 'json_schema', schema: deriveStructuredSchema(cfg.schema) },
          },
        } as Anthropic.Messages.MessageCreateParams;
        const structResp = await callClaude(structuredParams, log);

        fixture[key] = {
          label: doc.label,
          expectedType: type,
          freetext: toSample(freeResp),
          structured: toSample(structResp),
        };
        persist(); // incremental — survive a later-doc failure
        // eslint-disable-next-line no-console
        console.log(`board-#2 capture: ${doc.label} done (${Object.keys(fixture).length}/${REAL_OCR_CORPUS.length})`);
      }
      expect(Object.keys(fixture).length).toBe(REAL_OCR_CORPUS.length);
    });
  },
);
```

> **Note on the corpus import path:** confirm the real import specifier for `REAL_OCR_CORPUS` at write time (the existing `extractionAccuracy.integration.test.ts` imports it — copy that exact specifier rather than the illustrative `@/../tests/...` above). STOP-SURFACE if the alias differs.

> **Note on `output_config` typing:** the `as Anthropic.Messages.MessageCreateParams` cast guards against a future SDK type bump; if `output_config` is directly assignable (it is in 0.90.0 — `messages.d.ts:1908`), drop the cast.

- [ ] **Step 2: Verify the runner SKIPS when the gate is unset (the implementer's verification — no spend).**

Run: `cd apps/web && pnpm vitest run tests/integration/structuredOutputExtractionEval.capture.integration.test.ts`
Expected: the suite reports **skipped** (0 tests run) because `RUN_STRUCTURED_OUTPUT_EVAL` is unset. Confirm no real API call occurred.

- [ ] **Step 3: Typecheck.**

Run: `cd apps/web && pnpm typecheck`
Expected: clean (this proves `output_config` threads through the real types — design §2.5 keystone).

- [ ] **Step 4: [PHIL] Commit the runner (code only; no fixture yet).**
```bash
git add apps/web/tests/integration/structuredOutputExtractionEval.capture.integration.test.ts
git commit -m "feat(eval): board-#2 gated PAID structured-output capture runner (skipped by default)"
```

---

## Task 4: PAID CAPTURE RUN — **PHIL EXECUTES**

**The implementer does NOT run this.** It bills real Claude (~2 calls × `REAL_OCR_CORPUS` docs ≈ 26 calls; small, on the order of the prior Tier-C exercise).

> **Precondition (advisor gate):** Task 2's `deriveStructuredSchema` **API-clean-across-all-three** test passes — the derived schema is provably API-clean offline (no unsupported `format`/constraint for any type). The only thing the paid run can newly discover is genuine API behavior (the all-optional / `required`-set acceptance, §6.4 residual + union-cap caveat), not a free-knowable schema defect.

- [ ] **Step 1: [PHIL] Run the gated capture.**
```bash
cd apps/web
RUN_STRUCTURED_OUTPUT_EVAL=1 ANTHROPIC_API_KEY=sk-... SUPABASE_TEST_URL=<test-url> \
  pnpm vitest run tests/integration/structuredOutputExtractionEval.capture.integration.test.ts
```
Expected: 1 test passes; console prints `wrote N entries`; `tests/fixtures/extraction/structuredOutputCaptures.json` is created.

- [ ] **Step 2: [PHIL] STOP-SURFACE check — schema acceptance.** If any structured call 400s on the schema (Anthropic SO rejecting the all-optional / no-`required` schema — design §6.4 residual), do **not** blindly retry. **The fallback is NOT guaranteed trivial (advisor catch):** the nullable-required adaptation (every property → `type:[T,'null']`, all keys in `required`) turns *every* field — including nested `line_items` sub-fields — into a **union type**, and structured outputs **caps union-typed parameters at 16**. The 11-field vendor schema plus line-item sub-fields could brush that ceiling, so the fix may need further adaptation (e.g. keep scalars nullable-required but leave `line_items` out of the structured schema, or split). Apply, then re-run — **the runner resumes** (Task 3 incremental write skips already-captured docs, so only the failed/missing docs re-bill). Surface to the implementer + advisor before spending again.

- [ ] **Step 3: [PHIL] PII spot-check, then commit the fixture.** The captured `raw` is model output over the already-sanitized corpus; eyeball it for any PII before committing.
```bash
git add apps/web/tests/fixtures/extraction/structuredOutputCaptures.json
git commit -m "feat(eval): board-#2 captured-sample fixture (structured + free-text, claude-sonnet-4-5)"
```

---

## Task 5: Scoring test (free, CI-safe)

**Files:**
- Create: `apps/web/tests/integration/structuredOutputExtractionEval.scoring.integration.test.ts`

Reads the committed fixture, replays through the **unmodified** `runExtractionEval`, reports the per-type delta. No API, no DB.

- [ ] **Step 1: Write the scoring test.**

```typescript
// apps/web/tests/integration/structuredOutputExtractionEval.scoring.integration.test.ts
//
// Board #2 scoring (FREE, deterministic, CI-safe). Replays the committed
// capture fixture through the existing runExtractionEval and reports the
// per-type delta vs the frozen Tier-A BASELINE_TALLY. Report-only (design
// §4.2): a captured sample is "the score of that sample", not true accuracy —
// no equality freeze. Flags non-end_turn captures so truncation/refusal is not
// scored as a coverage miss.
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import {
  runExtractionEval,
  aggregate,
  type DocumentType,
  type AggregateTally,
} from '../helpers/extractionEval';
import { REAL_OCR_CORPUS } from '@/../tests/fixtures/classifier/real-ocr/corpus.sanitized';
import { EXTRACTION_GROUND_TRUTH, BASELINE_TALLY } from '../fixtures/extraction/extractionGolden';
import {
  makeReplayExtractor,
  ocrTextHash,
  type CaptureFixture,
} from '../helpers/structuredOutputEval';
import { ocrTextFromLines } from '../helpers/extractionEval';

const FIXTURE_PATH = path.resolve(
  process.cwd(),
  'tests/fixtures/extraction/structuredOutputCaptures.json',
);
const TYPES: DocumentType[] = ['vendor_invoice', 'receipt', 'payment_confirmation'];

function loadFixture(): CaptureFixture {
  return JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8')) as CaptureFixture;
}

// describe.skipIf — if the paid run hasn't happened yet, the fixture is absent;
// skip rather than fail (the runner code + helpers are still proven by Tasks 2-3).
const FIXTURE_EXISTS = fs.existsSync(FIXTURE_PATH);

describe.skipIf(!FIXTURE_EXISTS)('board-#2 — structured-output scoring (free)', () => {
  const fixture = FIXTURE_EXISTS ? loadFixture() : ({} as CaptureFixture);
  const truthFor = (label: string) => EXTRACTION_GROUND_TRUTH[label] ?? {};

  it('every corpus doc has a captured entry', () => {
    for (const doc of REAL_OCR_CORPUS) {
      expect(fixture[ocrTextHash(ocrTextFromLines(doc.lines))], `missing capture for ${doc.label}`).toBeDefined();
    }
  });

  it('reports the three-column per-type delta (report-only, no ratchet)', () => {
    const freeByType = runExtractionEval(makeReplayExtractor(fixture, 'freetext'), REAL_OCR_CORPUS, truthFor);
    const structByType = runExtractionEval(makeReplayExtractor(fixture, 'structured'), REAL_OCR_CORPUS, truthFor);
    const fmt = (t: AggregateTally) => `cov ${t.covered}/${t.trulyPresent}  corr ${t.correct}/${t.populated}`;
    for (const t of TYPES) {
      // eslint-disable-next-line no-console
      console.log(
        `[${t}]\n  tierA(base): ${fmt(BASELINE_TALLY[t])}\n  freetext  : ${fmt(aggregate(freeByType[t]))}\n  structured: ${fmt(aggregate(structByType[t]))}`,
      );
    }
    // Loose, non-ratchet sanity: both replays scored EVERY corpus doc.
    const scored = (byType: Record<DocumentType, unknown[]>) =>
      TYPES.reduce((n, t) => n + byType[t].length, 0);
    expect(scored(freeByType)).toBe(REAL_OCR_CORPUS.length);
    expect(scored(structByType)).toBe(REAL_OCR_CORPUS.length);
  });

  it('flags non-end_turn captures (refusal / truncation) instead of scoring them as misses', () => {
    const flagged = Object.values(fixture).flatMap((e) =>
      (['freetext', 'structured'] as const)
        .filter((v) => e[v].stop_reason !== 'end_turn')
        .map((v) => `${e.label}:${v}=${e[v].stop_reason}`),
    );
    if (flagged.length) {
      // eslint-disable-next-line no-console
      console.warn('board-#2 NON-end_turn captures (interpret with care, not coverage misses):', flagged);
    }
    expect(Array.isArray(flagged)).toBe(true); // report-only; never fails the build
  });
});
```

> **Confirm import specifiers** for `EXTRACTION_GROUND_TRUTH`/`BASELINE_TALLY` and `REAL_OCR_CORPUS` against `extractionAccuracy.integration.test.ts` at write time; copy its exact paths.

- [ ] **Step 2: Run the scoring test BEFORE the fixture exists (verify graceful skip).**

Run: `cd apps/web && pnpm vitest run tests/integration/structuredOutputExtractionEval.scoring.integration.test.ts`
Expected (pre-Task-4): suite **skipped** (fixture absent) — proves the test is safe to land before the paid run.

- [ ] **Step 3: Run the scoring test AFTER Phil's Task-4 fixture lands.**

Run: `cd apps/web && pnpm vitest run tests/integration/structuredOutputExtractionEval.scoring.integration.test.ts`
Expected: PASS; console prints the three-column per-type table; any non-`end_turn` captures are warned, not failed.

- [ ] **Step 4: Confirm the Tier-A baseline is untouched (the no-perturbation proof).**

Run: `cd apps/web && pnpm vitest run tests/integration/extractionAccuracy.integration.test.ts && git diff --stat apps/web/tests/helpers/extractionEval.ts apps/web/tests/fixtures/extraction/extractionGolden.ts`
Expected: baseline ratchet PASS; `git diff --stat` shows **no changes** to the harness or `extractionGolden.ts`.

- [ ] **Step 5: [PHIL] Commit the scoring test.**
```bash
git add apps/web/tests/integration/structuredOutputExtractionEval.scoring.integration.test.ts
git commit -m "feat(eval): board-#2 free CI-safe structured-output scoring + three-column delta report"
```

---

## Task 6: Close

- [ ] **Step 1: Full validation.**

Run: `cd apps/web && pnpm typecheck && pnpm lint` (and from repo root `pnpm agent:validate` if the new tests fall under Category A).
Expected: green. The capture runner stays **skipped** in normal runs; the scoring test runs against the committed fixture.

- [ ] **Step 2: Hand the delta to advisor + Phil.** Capture the three-column table from the scoring test output into the close report; interpret with the **single-sample-noise** caveat (design §4.2) — directional, not statistically settled.

- [ ] **Step 3: [PHIL] Final close commit (docs/close report), if any.**
```bash
git add docs/09_briefs/post-mvp/
git commit -m "docs(eval): board-#2 close — structured-vs-free-text delta + interpretation"
```

---

## Self-Review

**Spec coverage (design §7 + §6.4):** Task 1 ↔ §6 grounding (prompt source, prod-constant drift, derivation, JSONOutputFormat); Tasks 2-3 ↔ §4.1 capture (raw + stop_reason + usage, fixture-branch guard, §6.4 derived schema); Task 4 ↔ Phil paid run + §6.4 residual STOP-SURFACE; Task 5 ↔ §4.2 replay/scoring (report-only, diagnostic flag, single-sample caveat) + §5 baseline-untouched proof; Task 6 ↔ §7 close. The §5 full-schema decision is realized by deriving from the prod Zod schema (line_items retained). The `vendor_id`/§7 matcher-gap exclusion holds (not in `SCORED_FIELDS`).

**Placeholder scan:** No "TBD/TODO". The two "confirm import specifier" notes are concrete verify-at-write-time steps with a named source file (`extractionAccuracy.integration.test.ts`), not placeholders. The §6.4 residual (API schema acceptance) is a genuine paid-run-only unknown with a fully-specified fallback — not a gap.

**Type consistency:** `CaptureFixture`/`CaptureEntry`/`CapturedSample`, `makeReplayExtractor`, `deriveStructuredSchema`, `ocrTextHash`, `buildUserMessage`, `EVAL_MODEL`/`EVAL_MAX_TOKENS`, `PER_TYPE_CONFIG` are defined once in Task 2 and used with the same signatures in Tasks 3 + 5. `runExtractionEval`/`aggregate`/`BASELINE_TALLY`/`REAL_OCR_CORPUS`/`EXTRACTION_GROUND_TRUTH`/`ocrTextFromLines` are existing exports (grounded). `ExtractionFn` is satisfied structurally — `makeReplayExtractor` returns `(ocrText) => Record`, and the harness calls `extractor(ocrText, type)` (the unused `type` arg is fine).

**Lane fidelity:** every commit step is tagged `[PHIL]`; Task 4 is `[PHIL]`-only and is the sole real-Claude spend; the implementer's steps only ever run skipped/unit/typecheck.
