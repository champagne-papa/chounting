export type FiscalPeriodInsert = {
  org_id: string;
  name: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  is_locked: boolean;
};

/**
 * Generates 12 monthly fiscal periods for a given fiscal year.
 *
 * @param startMonth - The month the fiscal year starts (1-12).
 *   Comes from organizations.fiscal_year_start_month.
 * @param currentYear - The calendar year to anchor the fiscal year to.
 *   If startMonth > 1, the fiscal year spans currentYear and currentYear+1.
 * @param orgId - The organization these periods belong to.
 */
export function generateMonthlyFiscalPeriods(
  startMonth: number, // 1-12
  currentYear: number,
  orgId: string,
): FiscalPeriodInsert[] {
  const periods: FiscalPeriodInsert[] = [];

  for (let i = 0; i < 12; i++) {
    const month = ((startMonth - 1 + i) % 12) + 1;
    const year = month < startMonth ? currentYear + 1 : currentYear;

    const startDate = new Date(year, month - 1, 1);
    // new Date(year, month, 0) gives the last day of `month` —
    // JavaScript's Date constructor handles month overflow, including
    // leap-year February (2024-02-29 vs 2025-02-28) automatically.
    const endDate = new Date(year, month, 0);

    const monthName = startDate.toLocaleString('en', { month: 'long' });

    periods.push({
      org_id: orgId,
      name: `${monthName} ${year}`,
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
      is_locked: false,
    });
  }

  return periods;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
