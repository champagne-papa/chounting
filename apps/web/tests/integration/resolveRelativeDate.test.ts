// tests/integration/resolveRelativeDate.test.ts
// OI-2 fix-stack item 2 (foundation commit). Server-side relative-
// date resolver that the orchestrator calls before buildSystemPrompt
// so the agent receives a deterministically-resolved entry_date
// rather than performing date arithmetic against the temporal-anchor
// block. Foundation commit consumes 'resolved' (augments prompt) and
// 'none' (no-op); 'span' is detected here for the validation commit
// to short-circuit on.

import { describe, it, expect } from 'vitest';
import { resolveRelativeDate } from '@/agent/dateResolution/resolveRelativeDate';

// 2026-04-25T14:00:00Z is a Saturday at 14:00 UTC.
// In America/Vancouver (UTC-7 PDT), that's Saturday 07:00 local — same date.
// In America/New_York (UTC-4 EDT), that's Saturday 10:00 local — same date.
const NOW_SAT_NOON_UTC = new Date('2026-04-25T14:00:00Z');

describe('resolveRelativeDate — point tokens', () => {
  it('today resolves to today (UTC)', () => {
    const r = resolveRelativeDate('Book today lunch', NOW_SAT_NOON_UTC, 'UTC');
    expect(r).toEqual({ kind: 'resolved', date: '2026-04-25', source_phrase: 'today' });
  });

  it('yesterday resolves to today minus one (UTC)', () => {
    const r = resolveRelativeDate("yesterday's lunch", NOW_SAT_NOON_UTC, 'UTC');
    expect(r).toEqual({ kind: 'resolved', date: '2026-04-24', source_phrase: 'yesterday' });
  });

  it('tomorrow resolves to today plus one (UTC)', () => {
    const r = resolveRelativeDate("tomorrow's expense", NOW_SAT_NOON_UTC, 'UTC');
    expect(r).toEqual({ kind: 'resolved', date: '2026-04-26', source_phrase: 'tomorrow' });
  });

  it('case-insensitive: TODAY emits lowercase source_phrase', () => {
    const r = resolveRelativeDate('Book TODAY lunch', NOW_SAT_NOON_UTC, 'UTC');
    expect(r).toEqual({ kind: 'resolved', date: '2026-04-25', source_phrase: 'today' });
  });
});

describe('resolveRelativeDate — weekday tokens (today=Sat 2026-04-25)', () => {
  it('last Friday from Saturday = 1 day ago', () => {
    const r = resolveRelativeDate('last Friday', NOW_SAT_NOON_UTC, 'UTC');
    expect(r).toEqual({
      kind: 'resolved',
      date: '2026-04-24',
      source_phrase: 'last friday',
    });
  });

  it('last Saturday from Saturday = 7 days ago (not today)', () => {
    const r = resolveRelativeDate("last Saturday's payroll", NOW_SAT_NOON_UTC, 'UTC');
    expect(r).toEqual({
      kind: 'resolved',
      date: '2026-04-18',
      source_phrase: 'last saturday',
    });
  });

  it('this Monday = ISO-week Monday (Sat is in the week of Mon 2026-04-20)', () => {
    const r = resolveRelativeDate('this Monday', NOW_SAT_NOON_UTC, 'UTC');
    expect(r).toEqual({
      kind: 'resolved',
      date: '2026-04-20',
      source_phrase: 'this monday',
    });
  });

  it('this Sunday = ISO-week Sunday (Sat is in the week of Sun 2026-04-26)', () => {
    const r = resolveRelativeDate('this Sunday', NOW_SAT_NOON_UTC, 'UTC');
    expect(r).toEqual({
      kind: 'resolved',
      date: '2026-04-26',
      source_phrase: 'this sunday',
    });
  });

  it('next Wednesday = 4 days forward', () => {
    const r = resolveRelativeDate('next Wednesday', NOW_SAT_NOON_UTC, 'UTC');
    expect(r).toEqual({
      kind: 'resolved',
      date: '2026-04-29',
      source_phrase: 'next wednesday',
    });
  });

  it('next Saturday from Saturday = 7 days forward (not today)', () => {
    const r = resolveRelativeDate('next Saturday', NOW_SAT_NOON_UTC, 'UTC');
    expect(r).toEqual({
      kind: 'resolved',
      date: '2026-05-02',
      source_phrase: 'next saturday',
    });
  });
});

describe('resolveRelativeDate — span tokens', () => {
  it('last week → span week', () => {
    const r = resolveRelativeDate("Book last week's totals", NOW_SAT_NOON_UTC, 'UTC');
    expect(r).toEqual({
      kind: 'span',
      source_phrase: 'last week',
      span_kind: 'week',
    });
  });

  it('this month → span month', () => {
    const r = resolveRelativeDate('this month review', NOW_SAT_NOON_UTC, 'UTC');
    expect(r).toEqual({
      kind: 'span',
      source_phrase: 'this month',
      span_kind: 'month',
    });
  });

  it('next quarter → span quarter', () => {
    const r = resolveRelativeDate('plan for next quarter', NOW_SAT_NOON_UTC, 'UTC');
    expect(r).toEqual({
      kind: 'span',
      source_phrase: 'next quarter',
      span_kind: 'quarter',
    });
  });

  it('last year → span year', () => {
    const r = resolveRelativeDate("last year's depreciation", NOW_SAT_NOON_UTC, 'UTC');
    expect(r).toEqual({
      kind: 'span',
      source_phrase: 'last year',
      span_kind: 'year',
    });
  });
});

describe('resolveRelativeDate — kind: none', () => {
  it('explicit ISO date passes through (none)', () => {
    const r = resolveRelativeDate('Post on 2026-04-17', NOW_SAT_NOON_UTC, 'UTC');
    expect(r).toEqual({ kind: 'none' });
  });

  it('English-style explicit date passes through (none)', () => {
    const r = resolveRelativeDate('Post on April 17', NOW_SAT_NOON_UTC, 'UTC');
    expect(r).toEqual({ kind: 'none' });
  });

  it('no relative token at all', () => {
    const r = resolveRelativeDate('post my office rent', NOW_SAT_NOON_UTC, 'UTC');
    expect(r).toEqual({ kind: 'none' });
  });
});

describe('resolveRelativeDate — leftmost-wins precedence', () => {
  it('point and span in same message, point appears first', () => {
    const r = resolveRelativeDate("today's last quarter summary", NOW_SAT_NOON_UTC, 'UTC');
    expect(r).toEqual({
      kind: 'resolved',
      date: '2026-04-25',
      source_phrase: 'today',
    });
  });

  it('span appears before point', () => {
    const r = resolveRelativeDate("last quarter and today's totals", NOW_SAT_NOON_UTC, 'UTC');
    expect(r).toEqual({
      kind: 'span',
      source_phrase: 'last quarter',
      span_kind: 'quarter',
    });
  });

  it('two point tokens — leftmost wins', () => {
    const r = resolveRelativeDate(
      'today and tomorrow comparison',
      NOW_SAT_NOON_UTC,
      'UTC',
    );
    expect(r).toEqual({
      kind: 'resolved',
      date: '2026-04-25',
      source_phrase: 'today',
    });
  });
});

describe('resolveRelativeDate — timezone rollover', () => {
  // 2026-04-26T03:00:00Z = Saturday 20:00 PDT (UTC-7) in Vancouver
  // = Saturday 23:00 EDT (UTC-4) in New York
  // = Sunday 12:00 JST (UTC+9) in Tokyo
  const NOW_ROLLOVER = new Date('2026-04-26T03:00:00Z');

  it('today in Vancouver (UTC-7) is still 2026-04-25 when UTC is already 2026-04-26', () => {
    const r = resolveRelativeDate('today', NOW_ROLLOVER, 'America/Vancouver');
    expect(r).toEqual({
      kind: 'resolved',
      date: '2026-04-25',
      source_phrase: 'today',
    });
  });

  it('today in Tokyo (UTC+9) is 2026-04-26 — same as UTC', () => {
    const r = resolveRelativeDate('today', NOW_ROLLOVER, 'Asia/Tokyo');
    expect(r).toEqual({
      kind: 'resolved',
      date: '2026-04-26',
      source_phrase: 'today',
    });
  });

  it('yesterday in Vancouver = 2026-04-24 (one day before local today)', () => {
    const r = resolveRelativeDate('yesterday', NOW_ROLLOVER, 'America/Vancouver');
    expect(r).toEqual({
      kind: 'resolved',
      date: '2026-04-24',
      source_phrase: 'yesterday',
    });
  });

  it('yesterday in Tokyo = 2026-04-25 (one day before local today)', () => {
    const r = resolveRelativeDate('yesterday', NOW_ROLLOVER, 'Asia/Tokyo');
    expect(r).toEqual({
      kind: 'resolved',
      date: '2026-04-25',
      source_phrase: 'yesterday',
    });
  });

  it('weekday "last Friday" computed in tz: Vancouver Saturday (today) → Friday 2026-04-24', () => {
    const r = resolveRelativeDate('last Friday', NOW_ROLLOVER, 'America/Vancouver');
    expect(r).toEqual({
      kind: 'resolved',
      date: '2026-04-24',
      source_phrase: 'last friday',
    });
  });
});
