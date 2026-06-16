// apps/web/tests/helpers/structuredOutputEval.ts
//
// Board #2 — pure helpers for the structured-output extraction eval.
// No AI, no DB, no fs. Shared by the (paid) capture runner and the (free)
// scoring test.
import crypto from 'crypto';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { z } from 'zod';
import type { DocumentType } from './extractionEval';
import { VendorInvoiceExtractionSchema } from '@/shared/schemas/extraction/vendorInvoiceExtractionSchema';
import { ReceiptExtractionSchema } from '@/shared/schemas/extraction/receiptExtractionSchema';
import { PaymentConfirmationExtractionSchema } from '@/shared/schemas/extraction/paymentConfirmationExtractionSchema';
import { SYSTEM_PROMPT_CONTENT as VENDOR_PROMPT } from '@/agent/orchestrator/extraction/vendorInvoiceExtractor';
import { SYSTEM_PROMPT_CONTENT as RECEIPT_PROMPT } from '@/agent/orchestrator/extraction/receiptExtractor';
import { SYSTEM_PROMPT_CONTENT as PAYMENT_PROMPT } from '@/agent/orchestrator/extraction/paymentConfirmationExtractor';

// Must match aiFallbackExtractorBase.ts:30-31 (verified).
export const EVAL_MODEL = 'claude-sonnet-4-5';
export const EVAL_MAX_TOKENS = 4096;

export type ExtractorVersion = 'freetext' | 'structured';

export const PER_TYPE_CONFIG: Record<
  DocumentType,
  { systemPrompt: string; schema: z.ZodTypeAny; structuredSchema: z.ZodTypeAny }
> = {
  // `schema` = full prod schema. `structuredSchema` = what the structured
  // (output_config) call actually sends. Vendor omits `line_items` — a nested
  // array-of-objects that exceeds the structured-outputs complexity limit
  // ("Schema is too complex." 400, observed 2026-06-16) and is UNSCORED (not in
  // SCORED_FIELDS), so dropping it is scope-preserving (design §6.4). Free-text
  // keeps the full prompt unchanged.
  vendor_invoice: {
    systemPrompt: VENDOR_PROMPT,
    schema: VendorInvoiceExtractionSchema,
    structuredSchema: VendorInvoiceExtractionSchema.omit({ line_items: true }),
  },
  receipt: {
    systemPrompt: RECEIPT_PROMPT,
    schema: ReceiptExtractionSchema,
    structuredSchema: ReceiptExtractionSchema,
  },
  payment_confirmation: {
    systemPrompt: PAYMENT_PROMPT,
    schema: PaymentConfirmationExtractionSchema,
    structuredSchema: PaymentConfirmationExtractionSchema,
  },
};

/** sha256 of the production OCR text — the fixture key (the harness only hands
 *  the extractor (ocrText, type), never the label, so the key derives from
 *  ocrText). */
export function ocrTextHash(ocrText: string): string {
  return crypto.createHash('sha256').update(ocrText).digest('hex');
}

/** Verbatim mirror of aiFallbackExtractorBase.ts:144 (verified). */
export function buildUserMessage(documentType: DocumentType, ocrText: string): string {
  return `OCR text for ${documentType} document:\n\n${ocrText}\n\nReturn the JSON object per the extraction schema. JSON only — no markdown fences.`;
}

// Supported string formats — Anthropic structured-outputs doc (2026-06-15):
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

/** Mirror the SDK's structured-outputs transform OFFLINE (we hand-derive, so it
 *  isn't done for us): strip unsupported numeric/string/array constraints,
 *  filter string `format` to the supported list (keeps uuid; drops unsupported),
 *  add additionalProperties:false to every object. Makes the derived schema
 *  provably API-clean offline. */
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

/** Make a single property schema nullable (accept JSON null) without changing
 *  its non-null shape: scalar `type` → `[type,'null']`; an existing `anyOf`
 *  gains a `{type:'null'}` member; a typeless node is wrapped in `anyOf`. */
function nullable(schema: Record<string, unknown>): Record<string, unknown> {
  if (Array.isArray(schema.anyOf)) {
    const members = schema.anyOf as Array<Record<string, unknown>>;
    return members.some((m) => m.type === 'null')
      ? schema
      : { ...schema, anyOf: [...members, { type: 'null' }] };
  }
  const t = schema.type;
  if (typeof t === 'string') return t === 'null' ? schema : { ...schema, type: [t, 'null'] };
  if (Array.isArray(t)) {
    return (t as string[]).includes('null') ? schema : { ...schema, type: [...(t as string[]), 'null'] };
  }
  return { anyOf: [schema, { type: 'null' }] };
}

/** Collapse the constrained-decoding grammar: make every object property
 *  REQUIRED + nullable. All-`.optional()` schemas explode the present/absent
 *  state space (2^N subsets) and overrun grammar compilation ("Grammar
 *  compilation timed out." 400, observed 2026-06-16); required-nullable removes
 *  the present/absent branch (every field present, value-or-null) → grammar
 *  linear in field count. Scope-preserving: the scorer reads `null` as
 *  not-populated, identical to an omitted/absent field (design §6.4). */
function makeRequiredNullable(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(makeRequiredNullable);
  if (node && typeof node === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      out[k] = makeRequiredNullable(v);
    }
    if (out.type === 'object' && out.properties && typeof out.properties === 'object') {
      const props = out.properties as Record<string, Record<string, unknown>>;
      out.required = Object.keys(props);
      for (const key of Object.keys(props)) props[key] = nullable(props[key]);
    }
    return out;
  }
  return node;
}

/** Derive a structured-outputs json_schema from a prod Zod schema. Uses
 *  zod-to-json-schema (zod-v3 compatible) — NOT the SDK's zodOutputFormat,
 *  which throws against zod@3.25.76 — then mirrors the SDK transform
 *  (sdkTransform → API-clean offline) and collapses optionality
 *  (makeRequiredNullable → tractable grammar). */
export function deriveStructuredSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  const raw = zodToJsonSchema(schema, { $refStrategy: 'none', target: 'jsonSchema7' });
  return makeRequiredNullable(sdkTransform(raw)) as Record<string, unknown>;
}

// ---- Capture fixture types ----
export interface CapturedSample {
  raw: string; // raw model text, pre-Zod
  stop_reason: string | null;
  usage: { input_tokens: number; output_tokens: number };
  stamp: string; // "captured-sample · YYYY-MM-DD · claude-sonnet-4-5"
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
      // A valid extraction is a JSON object — null, a bare array, or a scalar
      // all count as "no extraction" → {} (honest zero coverage).
      return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  };
}
