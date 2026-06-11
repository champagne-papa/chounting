// tests/fixtures/classifier/mockAiFallback.ts
//
// Phase 7 chunk 7.2 — Tier C AI fallback mock harness per brief §4 Task
// 7.2.10 + directive Iteration 3 §2 Task 7.2.10 (η-candidate canonical
// fixtures location: tests/fixtures/.. wins over co-located __tests__/).
//
// Canonical fixtures location per chunk 7.1b (η-candidate) precedent
// (N=2 banking; reaffirmation at chunk 7.2 Task 7.2.10).
//
// Used by Task 7.2.11.E (aiFallback unit test) + Task 7.2.13 (classifier
// integration test). Provides two complementary mock surfaces:
//
//   - seedClaudeFixturesForClassifier(opts): seeds callClaude.ts's
//     internal __mockFixture queue with an Anthropic.Messages.Message
//     fixture that aiFallback's invokeWithRetry will receive. Used by
//     unit tests that exercise aiFallback's full code path (Zod
//     validation, confidence-threshold gating, audit emission).
//
//   - createMockRunAiFallback(opts): factory for a vi.fn() replacing
//     runAiFallback directly. Used by integration tests that want to
//     control TierCOutput without invoking the callClaude → Anthropic
//     pipeline. Mirrors mockSidecar's createMockInvokeSidecar shape.

import { vi, type Mock } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { __setMockFixtureQueue } from '@/agent/orchestrator/callClaude';
import type {
  ClassificationOutput,
} from '@/shared/schemas/extraction';
import type {
  AiFallbackResult,
} from '@/agent/orchestrator/extraction/classifier/aiFallback';
import crypto from 'crypto';

export type MockAiFallbackFailureMode =
  | 'timeout'
  | 'auth_failure'
  | 'non_validating'
  | null;

export interface MockAiFallbackOptions {
  /** Inject a specific ClassificationOutput as the AI response. */
  mockResponse?: ClassificationOutput;
  /** Override mockResponse with a typed failure path. */
  failureMode?: MockAiFallbackFailureMode;
}

/**
 * Build an Anthropic.Messages.Message fixture that emits the provided
 * JSON as the assistant's text content. Stamps a minimal-but-valid
 * usage block + stop_reason 'end_turn'.
 */
function buildAnthropicFixture(jsonText: string): Anthropic.Messages.Message {
  return {
    id: `msg_mock_${crypto.randomBytes(4).toString('hex')}`,
    type: 'message',
    role: 'assistant',
    model: 'claude-sonnet-4-5',
    stop_reason: 'end_turn',
    stop_sequence: null,
    content: [
      {
        type: 'text',
        text: jsonText,
        citations: null,
      },
    ],
    usage: {
      input_tokens: 100,
      output_tokens: 50,
      cache_creation_input_tokens: null,
      cache_read_input_tokens: null,
      server_tool_use: null,
      service_tier: 'standard',
    },
  } as Anthropic.Messages.Message;
}

/**
 * Seed the callClaude.ts __mockFixture queue with a synthesized
 * Anthropic.Messages.Message fixture matching opts.mockResponse, or a
 * synthesized failure fixture per opts.failureMode.
 *
 * For 'timeout' + 'auth_failure' failure modes, the test instead
 * needs to set the queue to throw — use seedClaudeThrowFixture below.
 */
export function seedClaudeFixturesForClassifier(
  opts: MockAiFallbackOptions = {},
): void {
  if (opts.failureMode === 'non_validating') {
    // Return JSON that doesn't match the discriminated union (missing
    // document_type literal). Zod validation fails downstream.
    const malformed = JSON.stringify({
      document_type: 'totally_not_in_enum',
      confidence: 0.5,
      rationale: 'mock non-validating response',
      fields: {},
    });
    __setMockFixtureQueue([buildAnthropicFixture(malformed)]);
    return;
  }

  if (opts.mockResponse) {
    __setMockFixtureQueue([
      buildAnthropicFixture(JSON.stringify(opts.mockResponse)),
    ]);
    return;
  }

  // Default: a vendor_invoice classification at threshold.
  const defaultResponse: ClassificationOutput = {
    document_type: 'vendor_invoice',
    confidence: 0.9,
    rationale: 'mock default classification',
    fields: {},
  };
  __setMockFixtureQueue([
    buildAnthropicFixture(JSON.stringify(defaultResponse)),
  ]);
}

/**
 * Clear the callClaude.ts __mockFixture queue (back to production
 * path). Call in afterEach / afterAll to prevent cross-test pollution.
 */
export function clearClaudeFixtures(): void {
  __setMockFixtureQueue(null);
}

/**
 * Build a vi.fn() that replaces runAiFallback. Used by integration
 * tests that want TierCOutput-level control without going through
 * the callClaude → Anthropic → Zod chain.
 *
 * The returned Mock has the same signature as runAiFallback:
 * `(input, ctx) => Promise<AiFallbackResult>`.
 */
export function createMockRunAiFallback(
  opts: MockAiFallbackOptions = {},
): Mock {
  return vi.fn().mockImplementation(async (): Promise<AiFallbackResult> => {
    const traceRecordBase = {
      stage_name: 'ai_fallback_classify',
      input_hash: 'mock_input_hash',
      model: 'claude-sonnet-4-5',
      timestamp: new Date().toISOString(),
    };

    if (opts.failureMode === 'timeout' || opts.failureMode === 'auth_failure') {
      return {
        output: { valid: false, reason: 'invocation_failed' },
        trace_record: {
          ...traceRecordBase,
          output_hash: crypto
            .createHash('sha256')
            .update(opts.failureMode)
            .digest('hex'),
        },
      };
    }

    if (opts.failureMode === 'non_validating') {
      return {
        output: { valid: false, reason: 'zod_validation_failed' },
        trace_record: {
          ...traceRecordBase,
          output_hash: crypto
            .createHash('sha256')
            .update('zod_validation_failed')
            .digest('hex'),
        },
      };
    }

    // Default or mockResponse — return valid TierCOutput.
    const response: ClassificationOutput = opts.mockResponse ?? {
      document_type: 'vendor_invoice',
      confidence: 0.9,
      rationale: 'mock default classification',
      fields: {},
    };

    // Per-document-type confidence thresholds per ADR-0014 §7.
    const thresholds: Record<string, number> = {
      vendor_invoice: 0.85,
      receipt: 0.8,
      payment_confirmation: 0.85,
      unknown: 1.0,
    };
    const threshold = thresholds[response.document_type] ?? 1.0;

    return {
      output: {
        valid: true,
        documentType: response.document_type,
        confidence: response.confidence,
        rationale: response.rationale,
        confidenceAboveThreshold: response.confidence >= threshold,
      },
      trace_record: {
        ...traceRecordBase,
        output_hash: crypto
          .createHash('sha256')
          .update(JSON.stringify(response))
          .digest('hex'),
      },
    };
  });
}
