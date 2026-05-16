// tests/unit/forwarded_mailbox.serviceComposition.test.ts
//
// Phase 6 chunk 6.3a — unit tests for service-layer composition helpers
// that don't require DB. Focuses on:
//   1. composeEmailBodyFilename (Sub-Q7 filename composition)
//   2. positional convention p_documents[0] ↔ p_case_sources[0]
//      .source_document_id (Sub-Q5 lock)
//
// p_case_sources positional convention is tested via the public
// service-level integration tests at
// forwardedMailbox.handleForwardedMailbox.integration.test.ts. This
// unit file isolates the synthetic filename composition surface for
// fast, deterministic, no-DB testing.

import { describe, it, expect } from 'vitest';
import { composeEmailBodyFilename } from '@/services/document-platform/ingestionService';

describe('composeEmailBodyFilename (Sub-Q7 lock)', () => {
  it('subject under 100 chars: returns subject.eml with no truncation', () => {
    const name = composeEmailBodyFilename({
      subject: 'Invoice from Acme Corp - Q1 2026',
      message_id: '<msg-abc@example.com>',
    });
    expect(name).toBe('Invoice from Acme Corp - Q1 2026.eml');
  });

  it('subject exactly 100 chars: returns full subject + .eml', () => {
    const subj = 'A'.repeat(100);
    const name = composeEmailBodyFilename({
      subject: subj,
      message_id: '<m@e>',
    });
    expect(name).toBe(`${subj}.eml`);
    expect(name.length).toBe(104); // 100 + '.eml'
  });

  it('subject over 100 chars: truncates at exact char-100 (no ellipsis)', () => {
    const subj = 'A'.repeat(150);
    const name = composeEmailBodyFilename({
      subject: subj,
      message_id: '<m@e>',
    });
    expect(name).toBe(`${'A'.repeat(100)}.eml`);
    // No ellipsis character
    expect(name).not.toContain('…');
    expect(name).not.toContain('...');
  });

  it('subject with invalid filename chars: replaces with dash', () => {
    const name = composeEmailBodyFilename({
      subject: 'Invoice/2026: Q1 <important>',
      message_id: '<m@e>',
    });
    // All of / : < > are replaced with -
    expect(name).toBe('Invoice-2026- Q1 -important-.eml');
  });

  it('empty subject: falls back to email-body-<msg_id_short>.eml', () => {
    const name = composeEmailBodyFilename({
      subject: '',
      message_id: '<msg-abc-12345@example.com>',
    });
    expect(name).toMatch(/^email-body-/);
    expect(name).toMatch(/\.eml$/);
  });

  it('whitespace-only subject: also falls back to email-body fallback', () => {
    const name = composeEmailBodyFilename({
      subject: '   ',
      message_id: '<msg-zzzz@e>',
    });
    expect(name).toMatch(/^email-body-/);
    expect(name).toMatch(/\.eml$/);
  });

  it('subject with all invalid chars: sanitized result still produces valid .eml name', () => {
    const name = composeEmailBodyFilename({
      subject: '<><:|*?"/\\',
      message_id: '<m@e>',
    });
    expect(name).toMatch(/\.eml$/);
    // No invalid filesystem chars remain
    expect(name).not.toMatch(/[/\\:*?"<>|]/);
  });
});
