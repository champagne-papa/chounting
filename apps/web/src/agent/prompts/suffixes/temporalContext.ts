// src/agent/prompts/suffixes/temporalContext.ts
// O3 Site 1 / OI-2 fix-stack item 1. Injects current-date context
// into the system prompt as either a single UTC line (when no
// browser timezone is available) or dual UTC + org-local stamps
// (when a real IANA timezone is supplied by the request).
//
// Filename uses the "suffix" naming convention for filesystem
// consistency with sibling helpers in this folder
// (orgContextSummary.ts, onboardingSuffix.ts, canvasContextSuffix.ts).
// Positioned as a PREFIX in buildSystemPrompt's composition order
// (before basePersonaPrompt) because the persona body's
// availableToolsSection() renders tool descriptions that reference
// "the Current date above" — those references must resolve to a
// block that physically precedes them in the rendered prompt.
//
// OI-2 fix-stack foundation commit replaced the Phase-1.2 dual-UTC
// placeholder. The browser supplies its IANA timezone via the
// /api/agent/message request; the route falls back to 'UTC' for
// non-browser callers, in which case this helper emits a single
// line with no placeholder boilerplate.

function isoDateInTz(now: Date, timezone: string): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // en-CA's date format is YYYY-MM-DD, which matches ISO 8601
  // calendar-date format directly. Use formatToParts to be robust
  // to runtime locale-data variations.
  const parts = fmt.formatToParts(now);
  const y = parts.find((p) => p.type === 'year')?.value ?? '0000';
  const m = parts.find((p) => p.type === 'month')?.value ?? '00';
  const d = parts.find((p) => p.type === 'day')?.value ?? '00';
  return `${y}-${m}-${d}`;
}

export function temporalContextSuffix(now: Date, timezone: string): string {
  const utcIso = now.toISOString().slice(0, 10);
  if (timezone === 'UTC') {
    return `Current date: ${utcIso} (ISO 8601, UTC)`;
  }
  const localIso = isoDateInTz(now, timezone);
  return [
    `Current date: ${utcIso} (ISO 8601, UTC)`,
    `Today (org-local): ${localIso} (${timezone})`,
  ].join('\n');
}

// Companion section that surfaces a server-resolved entry_date
// when the orchestrator's resolveRelativeDate identified a point-
// date token in the user's message. Rendered immediately after the
// temporal block so postJournalEntry's "Use the resolved entry_date
// from the temporal context above" instruction has a true positional
// anchor.
export function resolvedEntryDateSection(
  resolved: { date: string; sourcePhrase: string },
): string {
  return `Resolved entry_date for this turn: ${resolved.date} (from phrase: "${resolved.sourcePhrase}")`;
}

