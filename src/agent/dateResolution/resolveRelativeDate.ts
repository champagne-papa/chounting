// src/agent/dateResolution/resolveRelativeDate.ts
// OI-2 fix-stack item 2 (foundation commit). Server-side detection
// and resolution of relative-date tokens in the user's message, so
// the orchestrator can pin entry_date deterministically rather than
// rely on the LLM's date arithmetic against the temporal-anchor
// block. Validation commit (items 3+4+5) consumes the same return
// shape: kind: 'span' triggers the clarification short-circuit and
// kind: 'resolved' is what dow validation cross-checks.
//
// Token detection list (locked per Phase E section (f) brief —
// resists silent broadening; surface back if a real-world prompt
// slips through and is still ambiguous):
//   Point  : today, yesterday, tomorrow, last/this/next <weekday>
//   Span   : last/this/next week|month|quarter|year
//   None   : explicit dates ("April 17", "2026-04-17"), or no
//            relative token detected.
//
// Detection runs in source order: the leftmost matching token in
// the message wins. This keeps multi-token prompts deterministic
// without requiring the resolver to reason about author intent
// across mixed point/span phrases.

const WEEKDAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

type WeekdayName = (typeof WEEKDAY_NAMES)[number];

type SpanKind = 'week' | 'month' | 'quarter' | 'year' | 'unresolved';

export type ResolveRelativeDateResult =
  | { kind: 'resolved'; date: string; source_phrase: string }
  | { kind: 'span'; source_phrase: string; span_kind: SpanKind }
  | { kind: 'none' };

interface Match {
  index: number;
  source_phrase: string;
  produce: () => ResolveRelativeDateResult;
}

const SPAN_TOKEN_RE = /\b(last|this|next)\s+(week|month|quarter|year)\b/i;
const SIMPLE_POINT_RE = /\b(today|yesterday|tomorrow)\b/i;
const WEEKDAY_RE = /\b(last|this|next)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i;

export function resolveRelativeDate(
  messageText: string,
  now: Date,
  tz: string,
): ResolveRelativeDateResult {
  const matches: Match[] = [];

  const spanMatch = messageText.match(SPAN_TOKEN_RE);
  if (spanMatch && spanMatch.index !== undefined) {
    const qualifier = spanMatch[1].toLowerCase();
    const unit = spanMatch[2].toLowerCase() as 'week' | 'month' | 'quarter' | 'year';
    matches.push({
      index: spanMatch.index,
      source_phrase: `${qualifier} ${unit}`,
      produce: () => ({
        kind: 'span',
        source_phrase: `${qualifier} ${unit}`,
        span_kind: unit,
      }),
    });
  }

  const simpleMatch = messageText.match(SIMPLE_POINT_RE);
  if (simpleMatch && simpleMatch.index !== undefined) {
    const token = simpleMatch[1].toLowerCase() as 'today' | 'yesterday' | 'tomorrow';
    matches.push({
      index: simpleMatch.index,
      source_phrase: token,
      produce: () => ({
        kind: 'resolved',
        date: shiftDays(todayInTz(now, tz), simplePointOffset(token)),
        source_phrase: token,
      }),
    });
  }

  const weekdayMatch = messageText.match(WEEKDAY_RE);
  if (weekdayMatch && weekdayMatch.index !== undefined) {
    const qualifier = weekdayMatch[1].toLowerCase() as 'last' | 'this' | 'next';
    const weekday = weekdayMatch[2].toLowerCase() as WeekdayName;
    const phrase = `${qualifier} ${weekday}`;
    matches.push({
      index: weekdayMatch.index,
      source_phrase: phrase,
      produce: () => ({
        kind: 'resolved',
        date: weekdayResolution(now, tz, qualifier, weekday),
        source_phrase: phrase,
      }),
    });
  }

  if (matches.length === 0) return { kind: 'none' };

  matches.sort((a, b) => a.index - b.index);
  return matches[0].produce();
}

function simplePointOffset(token: 'today' | 'yesterday' | 'tomorrow'): number {
  if (token === 'today') return 0;
  if (token === 'yesterday') return -1;
  return 1;
}

interface YMD {
  y: number;
  m: number;
  d: number;
}

function todayInTz(now: Date, tz: string): YMD {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(now);
  const y = Number(parts.find((p) => p.type === 'year')?.value ?? '0');
  const m = Number(parts.find((p) => p.type === 'month')?.value ?? '0');
  const d = Number(parts.find((p) => p.type === 'day')?.value ?? '0');
  return { y, m, d };
}

function shiftDays(ymd: YMD, deltaDays: number): string {
  // Anchor on UTC noon to avoid DST-edge surprises during the
  // arithmetic (the input ymd is a calendar date in tz; we add
  // whole days, so a 12:00 UTC anchor leaves us with the right
  // calendar date after toISOString().slice(0,10)).
  const anchor = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d, 12, 0, 0));
  anchor.setUTCDate(anchor.getUTCDate() + deltaDays);
  return anchor.toISOString().slice(0, 10);
}

function weekdayResolution(
  now: Date,
  tz: string,
  qualifier: 'last' | 'this' | 'next',
  weekday: WeekdayName,
): string {
  const ymd = todayInTz(now, tz);
  const targetDow = WEEKDAY_NAMES.indexOf(weekday); // 0=Sun .. 6=Sat
  // Compute today's day-of-week IN tz. Use the same anchor-on-noon
  // trick: a UTC-noon Date constructed from the tz-resolved YMD
  // has getUTCDay() equal to the calendar weekday in tz.
  const anchor = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d, 12, 0, 0));
  const todayDow = anchor.getUTCDay();

  let delta: number;
  if (qualifier === 'last') {
    // Most recent past occurrence of targetDow. If today is the
    // target weekday, "last <X>" = 7 days ago.
    delta = -(((todayDow - targetDow + 7) % 7) || 7);
  } else if (qualifier === 'next') {
    // Next future occurrence of targetDow. If today is the target
    // weekday, "next <X>" = 7 days forward.
    delta = ((targetDow - todayDow + 7) % 7) || 7;
  } else {
    // 'this <X>' = the targetDow within the current ISO week
    // (Monday-start). Convert to 1=Mon..7=Sun.
    const todayIso = todayDow === 0 ? 7 : todayDow;
    const targetIso = targetDow === 0 ? 7 : targetDow;
    delta = targetIso - todayIso;
  }

  return shiftDays(ymd, delta);
}
