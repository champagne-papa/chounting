// src/agent/prompts/suffixes/orgContextSummary.ts
// Phase 1.2 Session 4 — org-context summary suffix injected by
// buildSystemPrompt between the base persona prompt and the
// locale directive. Returns empty string when orgContext is
// null (onboarding path — the onboarding suffix carries the
// user through setup before an org exists).
//
// Pre-decision 1: names, not UUIDs. Carries Session 3's
// commit-2 lesson forward verbatim — UUIDs are token tax for
// Claude with zero reasoning benefit; keep them out of prompt
// prose unless the model needs them to call a tool. Tool calls
// receive UUIDs through their input arguments, not the prompt
// body.
//
// Fields surfaced:
//   - org_name, legal_name (when non-null)
//   - industry_display_name
//   - functional_currency
//   - fiscal_year_start_month (rendered as month name)
//   - fiscal_periods (period_name list, with current period
//     marked explicitly)
//   - controllers (display_name list)
//
// Fields deliberately excluded from the prose body:
//   org_id, fiscal_period_id, user_id, industry_id.

import type { OrgContext } from '@/agent/memory/orgContextManager';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function orgContextSummary(orgContext: OrgContext | null): string {
  if (orgContext === null) return '';

  const legalClause = orgContext.legal_name
    ? ` (legal name: ${orgContext.legal_name})`
    : '';

  const fiscalMonth =
    MONTH_NAMES[orgContext.fiscal_year_start_month - 1] ??
    `month ${orgContext.fiscal_year_start_month}`;

  const periodLine = summarizeFiscalPeriods(orgContext.fiscal_periods);
  const controllerLine = summarizeControllers(orgContext.controllers);

  const lines = [
    `## About this organization`,
    '',
    `You are working with ${orgContext.org_name}${legalClause}, a ${orgContext.industry_display_name} organization. The functional currency is ${orgContext.functional_currency}; the fiscal year starts in ${fiscalMonth}.`,
  ];

  if (periodLine) {
    lines.push('', periodLine);
  }
  if (controllerLine) {
    lines.push('', controllerLine);
  }

  return lines.join('\n');
}

function summarizeFiscalPeriods(periods: OrgContext['fiscal_periods']): string {
  if (periods.length === 0) {
    return 'No fiscal periods have been generated yet for this organization.';
  }
  const current = periods.find((p) => p.is_current);
  const names = periods.map((p) => p.period_name).join(', ');
  if (current) {
    return `Fiscal periods: ${names}. The current period is ${current.period_name}.`;
  }
  return `Fiscal periods: ${names}. No period contains today's date.`;
}

function summarizeControllers(controllers: OrgContext['controllers']): string {
  if (controllers.length === 0) {
    return 'No controllers are currently listed for this organization.';
  }
  const names = controllers.map((c) => c.display_name);
  if (names.length === 1) {
    return `The controller for this organization is ${names[0]}.`;
  }
  if (names.length === 2) {
    return `The controllers for this organization are ${names[0]} and ${names[1]}.`;
  }
  const head = names.slice(0, -1).join(', ');
  const last = names[names.length - 1];
  return `The controllers for this organization are ${head}, and ${last}.`;
}
