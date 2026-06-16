// apps/web/tests/integration/structuredOutputExtractionEval.capture.integration.test.ts
//
// Board #2 capture runner (LIVE, gated, PAID). Calls real Claude TWICE per
// corpus doc (free-text = prod-verbatim; structured = prod + output_config),
// captures raw pre-Zod text + stop_reason + usage, writes a committed fixture
// keyed by ocrTextHash. NOT a CI assertion target. The operator executes the
// paid run; by default this is skipped.
import fs from 'fs';
import path from 'path';
import type Anthropic from '@anthropic-ai/sdk';
import { describe, it, expect } from 'vitest';
import { callClaude, __setMockFixtureQueue } from '@/agent/orchestrator/callClaude';
import { loggerWith } from '@/shared/logger/pino';
import { REAL_OCR_CORPUS } from '../fixtures/classifier/real-ocr/corpus.sanitized';
import { ocrTextFromLines, type DocumentType } from '../helpers/extractionEval';
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

// Cheap acceptance probe — run this FIRST (it filters to its own name). Fires
// ONE minimal structured call per type using the EXACT derived artifact the
// billed loop sends, and records the per-type error string. A "Schema is too
// complex" 400 is deterministic at request-validation, so this de-risks the
// spend: confirm all three accepted before billing the generation loop.
describe.skipIf(!SHOULD_RUN)(
  'board-#2 — structured schema acceptance PROBE (LIVE, paid, minimal)',
  () => {
    it('each type structured schema is accepted (not too complex)', async () => {
      __setMockFixtureQueue(null);
      const log = loggerWith({ trace_id: 'board2-probe' });
      const results: Record<string, string> = {};
      for (const type of [
        'vendor_invoice',
        'receipt',
        'payment_confirmation',
      ] as const) {
        const cfg = PER_TYPE_CONFIG[type];
        const params = {
          model: EVAL_MODEL,
          max_tokens: 64, // minimal — a too-complex schema 400s at request-validation regardless
          system: cfg.systemPrompt,
          messages: [{ role: 'user', content: buildUserMessage(type, 'probe') }],
          output_config: {
            format: { type: 'json_schema', schema: deriveStructuredSchema(cfg.structuredSchema) },
          },
        } as Anthropic.Messages.MessageCreateParams;
        try {
          const resp = await callClaude(params, log);
          results[type] = `ACCEPTED (stop_reason=${resp.stop_reason})`;
        } catch (e) {
          results[type] = `REJECTED: ${e instanceof Error ? e.message : String(e)}`;
        }
      }
      console.log('board-#2 schema acceptance probe:', JSON.stringify(results, null, 2));
      const rejected = Object.entries(results).filter(([, v]) => v.startsWith('REJECTED'));
      expect(rejected, 'schema(s) rejected — STOP before billed loop').toEqual([]);
    });
  },
);

describe.skipIf(!SHOULD_RUN)(
  'board-#2 — structured-output extraction eval CAPTURE (LIVE, paid Claude)',
  () => {
    it('captures free-text + structured raw for every corpus doc', async () => {
      // Fixture-branch guard: ensure callClaude hits REAL Claude, not the mock
      // queue (callClaude short-circuits on a non-null mock queue).
      __setMockFixtureQueue(null);
      const log = loggerWith({ trace_id: 'board2-capture' });

      // Resume + incremental persist: load any partial fixture, skip docs
      // already captured, and write after EACH doc — a mid-loop failure keeps
      // prior docs; a re-run only re-bills the missing ones.
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

        // structured: identical params + derived json_schema (structuredSchema
        // = vendor minus line_items; see PER_TYPE_CONFIG).
        const structuredParams = {
          ...baseParams,
          output_config: {
            format: { type: 'json_schema', schema: deriveStructuredSchema(cfg.structuredSchema) },
          },
        } as Anthropic.Messages.MessageCreateParams;
        const structResp = await callClaude(structuredParams, log);

        fixture[key] = {
          label: doc.label,
          expectedType: type,
          freetext: toSample(freeResp),
          structured: toSample(structResp),
        };
        persist();
        console.log(
          `board-#2 capture: ${doc.label} done (${Object.keys(fixture).length}/${REAL_OCR_CORPUS.length})`,
        );
      }
      expect(Object.keys(fixture).length).toBe(REAL_OCR_CORPUS.length);
    });
  },
);
