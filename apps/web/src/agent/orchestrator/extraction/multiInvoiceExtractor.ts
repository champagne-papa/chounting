// multiInvoiceExtractor.ts — board #4 slice-2 T2b (AI-assisted multi-invoice
// segmentation; option A + D fallback).
//
// Grounding (T2b design doc): deterministic bbox segmentation is infeasible on
// the real artifact (document_artifacts.pages = {count}, no per-line page
// attribution), so the split is AI-assisted. The SAFETY property is the
// deterministic ARITHMETIC RECONCILIATION GATE (Σ invoice amounts =
// document_total), NOT the model's self-assessed confidence and NOT the
// trigger: whichever way the trigger fires, a bad split fails the sum and the
// caller degrades to N=1 → needs_review. A bad or unsure split therefore never
// silently mis-posts.
//
// This module is PURE + additive — it does not touch the live single-invoice
// pipeline. The thin branch that calls it (regex pre-check → call → loop
// createExtractedInvoice per invoice, else N=1) is T2c wiring.
//
// FREE-TEXT → parse → Zod (mirrors runAiExtractFallback); NOT structured output
// (board-2 proved structured collapses on the N-element array).

import type Anthropic from '@anthropic-ai/sdk';
import { callClaude } from '../callClaude';
import { loggerWith } from '@/shared/logger/pino';
import {
  MultiInvoiceExtractionSchema,
  type MultiInvoiceExtraction,
} from '@/shared/schemas/extraction/multiInvoiceExtractionSchema';
import type { SystemActorServiceContext } from '@/services/middleware/serviceContext';

const ANTHROPIC_MODEL = 'claude-sonnet-4-5';
const ANTHROPIC_MAX_TOKENS = 4096;
// Reconciliation tolerance: one cent (OCR/round-trip float slack).
const RECONCILIATION_TOLERANCE = 0.01;

// -----------------------------------------------------------------------
// D-2 — dedicated per-document segmentation budget.
// Distinct from the Stage-3/4 extract budget (aiFallbackBudget.ts) so the
// multi-invoice call can neither starve nor be starved by the single-invoice
// Tier-C fallback. Max 1 segmentation call per source document.
// -----------------------------------------------------------------------
const MAX_SEGMENTATION_CALLS = 1;
const segmentationCounters = new Map<string, number>();

export function tryConsumeSegmentationCall(source_document_id: string): boolean {
  const current = segmentationCounters.get(source_document_id) ?? 0;
  if (current >= MAX_SEGMENTATION_CALLS) return false;
  segmentationCounters.set(source_document_id, current + 1);
  return true;
}

/** Test-only reset of the segmentation budget. */
export function __resetSegmentationBudgetForTests(): void {
  segmentationCounters.clear();
}

// -----------------------------------------------------------------------
// D-1 — the trigger: permissive, deterministic multi-invoice pre-check.
// Counts DISTINCT invoice-number-shaped tokens (6+ char alphanumeric with at
// least one letter AND one digit) in the OCR text; > 1 ⇒ attempt the split.
//
// Tuned PERMISSIVELY (bias to over-detection) because the failure modes are
// asymmetric: a FALSE POSITIVE costs a cheap AI call that returns 1 invoice →
// N=1 (safe); a FALSE NEGATIVE drops a real multi-invoice doc to the single
// path (the costlier direction). The reconciliation gate — not this trigger —
// carries safety, so over-firing is fine.
// -----------------------------------------------------------------------
const INVOICE_NUMBER_TOKEN =
  /\b(?=[A-Za-z0-9]*[A-Za-z])(?=[A-Za-z0-9]*[0-9])[A-Za-z0-9]{6,}\b/g;

export function looksMultiInvoice(ocrText: string): boolean {
  const distinct = new Set<string>();
  for (const m of ocrText.matchAll(INVOICE_NUMBER_TOKEN)) {
    distinct.add(m[0].toUpperCase());
    if (distinct.size > 1) return true; // early out
  }
  return distinct.size > 1;
}

// -----------------------------------------------------------------------
export type MultiExtractResult =
  | { valid: true; extraction: MultiInvoiceExtraction }
  | {
      valid: false;
      reason:
        | 'budget_exhausted'
        | 'invocation_failed'
        | 'parse_failed'
        | 'zod_validation_failed'
        | 'reconciliation_failed';
    };

const SYSTEM_PROMPT = `You extract accounting fields from an OCR'd document that may contain MULTIPLE distinct invoices (each with its own invoice number and total).

Return a single JSON object with this shape (JSON only — no markdown fences):
{
  "invoices": [
    {
      "amount": <this invoice's total as a number>,
      "currency": "<ISO 4217>",
      "vendor_name": "<the vendor/supplier name>",
      "vendor_invoice_number": "<this invoice's number>",
      "accounting_date": "<YYYY-MM-DD>",
      "due_date": "<YYYY-MM-DD>",
      "source_locator": "<the invoice-number string or short line span you drew this invoice from>"
    }
    // one object per distinct invoice
  ],
  "document_total": <the document's stated grand total as a number>
}

Include every distinct invoice. "amount" is per-invoice; "document_total" is the whole document's stated total. Do NOT invent values you cannot read.`;

/**
 * AI-multi-extract: free-text call → parse → Zod → reconciliation gate.
 * Returns the validated N-invoice extraction, or a typed degrade reason. The
 * caller (T2c) treats ANY {valid:false} as "degrade to N=1 → needs_review".
 */
export async function runAiMultiExtract(
  input: { ocrText: string; source_document_id: string; trace_id: string },
  ctx: SystemActorServiceContext,
): Promise<MultiExtractResult> {
  const log = loggerWith({
    trace_id: input.trace_id,
    user_id: ctx.caller.user_id ?? undefined,
  });

  if (!tryConsumeSegmentationCall(input.source_document_id)) {
    return { valid: false, reason: 'budget_exhausted' };
  }

  const params: Anthropic.Messages.MessageCreateParams = {
    model: ANTHROPIC_MODEL,
    max_tokens: ANTHROPIC_MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `OCR text:\n\n${input.ocrText}\n\nReturn the JSON object. JSON only — no markdown fences.`,
      },
    ],
  };

  let resp: Anthropic.Messages.Message;
  try {
    resp = await callClaude(params, log);
  } catch (err) {
    log.warn(
      { err: err instanceof Error ? err.message : String(err) },
      'multiInvoiceExtractor: callClaude failed',
    );
    return { valid: false, reason: 'invocation_failed' };
  }

  const textBlock = resp.content.find((b) => b.type === 'text');
  const rawText =
    textBlock && textBlock.type === 'text' ? textBlock.text.trim() : '';

  let parsed: unknown;
  try {
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '');
    parsed = JSON.parse(cleaned);
  } catch {
    log.warn(
      { raw_preview: rawText.slice(0, 200) },
      'multiInvoiceExtractor: JSON parse failed',
    );
    return { valid: false, reason: 'parse_failed' };
  }

  const zod = MultiInvoiceExtractionSchema.safeParse(parsed);
  if (!zod.success) {
    log.warn(
      { zod_errors: zod.error.errors.slice(0, 5) },
      'multiInvoiceExtractor: Zod validation failed',
    );
    return { valid: false, reason: 'zod_validation_failed' };
  }

  // ---- RECONCILIATION GATE (primary safety; deterministic) ----
  // Σ invoice amounts must equal document_total (within a cent). A missing
  // amount, or a sum mismatch, means the split is not trustworthy → degrade.
  // Independent of the model's confidence: a mis-split that drops or
  // double-counts an invoice fails the sum arithmetically.
  const amounts = zod.data.invoices.map((inv) => inv.amount);
  if (amounts.some((a) => typeof a !== 'number')) {
    log.info(
      { document_total: zod.data.document_total },
      'multiInvoiceExtractor: reconciliation gate — an invoice amount is missing; degrading',
    );
    return { valid: false, reason: 'reconciliation_failed' };
  }
  const sum = (amounts as number[]).reduce((acc, a) => acc + a, 0);
  if (Math.abs(sum - zod.data.document_total) > RECONCILIATION_TOLERANCE) {
    log.info(
      { sum, document_total: zod.data.document_total },
      'multiInvoiceExtractor: reconciliation gate — Σ amounts ≠ document_total; degrading',
    );
    return { valid: false, reason: 'reconciliation_failed' };
  }

  return { valid: true, extraction: zod.data };
}
