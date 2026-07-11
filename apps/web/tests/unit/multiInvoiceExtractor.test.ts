// apps/web/tests/unit/multiInvoiceExtractor.test.ts
//
// Board #4 slice-2 T2b — the AI-multi-extract core (pre-check + call + Zod +
// reconciliation gate). Unit test via the callClaude fixture branch (no DB, no
// real API). The load-bearing assertion is the RECONCILIATION GATE isolation:
// a well-formed (Zod-VALID) N-invoice array whose amounts do NOT sum to the
// document total degrades with reason 'reconciliation_failed' — proving the
// GATE catches it, not an incidental Zod failure. If that ever passes as
// 'zod_validation_failed', the gate isn't the thing guarding the split.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { __setMockFixtureQueue } from '@/agent/orchestrator/callClaude';
import {
  runAiMultiExtract,
  looksMultiInvoice,
  __resetSegmentationBudgetForTests,
} from '@/agent/orchestrator/extraction/multiInvoiceExtractor';
import type { SystemActorServiceContext } from '@/services/middleware/serviceContext';

function buildFixture(text: string): Anthropic.Messages.Message {
  return {
    id: 'msg_test',
    type: 'message',
    role: 'assistant',
    model: 'claude-sonnet-4-5',
    stop_reason: 'end_turn',
    stop_sequence: null,
    content: [{ type: 'text', text, citations: null }],
    usage: {
      input_tokens: 10,
      output_tokens: 10,
      cache_creation_input_tokens: null,
      cache_read_input_tokens: null,
      server_tool_use: null,
      service_tier: 'standard',
    },
  } as Anthropic.Messages.Message;
}

const ctx = {
  trace_id: 'trace-t2b',
  caller: { user_id: null, system_actor: 'test' },
  org_id: '',
} as unknown as SystemActorServiceContext;

// The three real Amazon sub-invoices (14.55 + 11.19 + 15.65 = 41.39).
const THREE_INVOICES = [
  { amount: 14.55, currency: 'CAD', vendor_name: 'Amazon', vendor_invoice_number: 'CA56SWET7X6I', source_locator: 'CA56SWET7X6I' },
  { amount: 11.19, currency: 'CAD', vendor_name: 'Amazon', vendor_invoice_number: 'CA542WJGEUEI', source_locator: 'CA542WJGEUEI' },
  { amount: 15.65, currency: 'CAD', vendor_name: 'Amazon', vendor_invoice_number: 'CA5KJ23M1ZFI', source_locator: 'CA5KJ23M1ZFI' },
];

const input = {
  ocrText: 'irrelevant — the fixture drives the response',
  source_document_id: '00000000-0000-0000-0000-000000000001',
  trace_id: 'trace-t2b',
};

beforeEach(() => {
  __resetSegmentationBudgetForTests();
  __setMockFixtureQueue(null);
});
afterEach(() => {
  __setMockFixtureQueue(null);
});

describe('looksMultiInvoice (D-1 permissive trigger)', () => {
  it('fires on > 1 distinct invoice-number token', () => {
    const text =
      'Invoice CA56SWET7X6I ... Invoice CA542WJGEUEI ... Invoice CA5KJ23M1ZFI';
    expect(looksMultiInvoice(text)).toBe(true);
  });

  it('does NOT fire on a single invoice number', () => {
    expect(
      looksMultiInvoice('Invoice CA56SWET7X6I total $14.55 due 2024-01-15'),
    ).toBe(false);
  });

  it('does NOT fire on empty / token-less text', () => {
    expect(looksMultiInvoice('')).toBe(false);
    expect(looksMultiInvoice('total due today')).toBe(false);
  });
});

describe('runAiMultiExtract', () => {
  it('valid: N invoices whose amounts reconcile to document_total', async () => {
    __setMockFixtureQueue([
      buildFixture(
        JSON.stringify({ invoices: THREE_INVOICES, document_total: 41.39 }),
      ),
    ]);
    const r = await runAiMultiExtract(input, ctx);
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.extraction.invoices).toHaveLength(3);
      expect(r.extraction.invoices[0].vendor_invoice_number).toBe('CA56SWET7X6I');
      expect(r.extraction.invoices[0].source_locator).toBe('CA56SWET7X6I');
    }
  });

  it('RECONCILIATION GATE (isolated): Zod-VALID array, wrong sum → reason=reconciliation_failed (NOT zod)', async () => {
    // Well-formed 3-invoice array (Zod passes) but document_total is wrong:
    // 14.55 + 11.19 + 15.65 = 41.39 ≠ 99.99. The GATE must be what rejects it.
    __setMockFixtureQueue([
      buildFixture(
        JSON.stringify({ invoices: THREE_INVOICES, document_total: 99.99 }),
      ),
    ]);
    const r = await runAiMultiExtract(input, ctx);
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.reason).toBe('reconciliation_failed');
      // Explicitly NOT a Zod failure — proves the gate guards, not Zod.
      expect(r.reason).not.toBe('zod_validation_failed');
    }
  });

  it('reconciliation gate also fails when an invoice amount is missing', async () => {
    const missingAmount = [
      { ...THREE_INVOICES[0] },
      { currency: 'CAD', vendor_name: 'Amazon', vendor_invoice_number: 'CA542WJGEUEI' }, // no amount
      { ...THREE_INVOICES[2] },
    ];
    __setMockFixtureQueue([
      buildFixture(
        JSON.stringify({ invoices: missingAmount, document_total: 41.39 }),
      ),
    ]);
    const r = await runAiMultiExtract(input, ctx);
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.reason).toBe('reconciliation_failed');
  });

  it('parse_failed on non-JSON', async () => {
    __setMockFixtureQueue([buildFixture('this is not json at all')]);
    const r = await runAiMultiExtract(input, ctx);
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.reason).toBe('parse_failed');
  });

  it('zod_validation_failed on well-formed JSON missing document_total', async () => {
    __setMockFixtureQueue([
      buildFixture(JSON.stringify({ invoices: THREE_INVOICES })),
    ]);
    const r = await runAiMultiExtract(input, ctx);
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.reason).toBe('zod_validation_failed');
  });

  it('budget_exhausted on the second call for the same document', async () => {
    __setMockFixtureQueue([
      buildFixture(
        JSON.stringify({ invoices: THREE_INVOICES, document_total: 41.39 }),
      ),
    ]);
    const first = await runAiMultiExtract(input, ctx);
    expect(first.valid).toBe(true);
    // Second call: budget check returns before callClaude (no fixture needed).
    const second = await runAiMultiExtract(input, ctx);
    expect(second.valid).toBe(false);
    if (!second.valid) expect(second.reason).toBe('budget_exhausted');
  });
});
