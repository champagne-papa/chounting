// tests/setup/getSystemPromptText.ts
// S22 caching enablement compat-shim. Returns the system prompt as
// a flat string regardless of whether the orchestrator passed
// `system` as a string (pre-S22) or as an Array<TextBlockParam>
// (post-S22 caching). Used by tests that read lastParams.system
// via __getLastClaudeCallParams() and assert text content.
//
// Sole consumer at S22 commit time: tests/integration/
// soft8EntryEightReplay.test.ts. Pattern for any future test
// reading lastParams.system as text: import this helper rather
// than casting `as string`.

import type Anthropic from '@anthropic-ai/sdk';

export function getSystemPromptText(
  params: Anthropic.Messages.MessageCreateParams | null,
): string {
  if (!params) return '';
  const sys = params.system;
  if (typeof sys === 'string') return sys;
  if (Array.isArray(sys)) {
    return sys
      .filter(
        (b): b is { type: 'text'; text: string } =>
          b.type === 'text' && typeof b.text === 'string',
      )
      .map((b) => b.text)
      .join('');
  }
  return '';
}
