import { describe, it, expect } from 'vitest';
import { generateMonthlyFiscalPeriods } from '@/services/org/generateFiscalPeriods';

describe('generateMonthlyFiscalPeriods', () => {
  const orgId = '11111111-1111-1111-1111-111111111111';

  it.each([1, 6, 7, 12])('generates 12 periods for startMonth=%i', (startMonth) => {
    const periods = generateMonthlyFiscalPeriods(startMonth, 2026, orgId);
    expect(periods).toHaveLength(12);
    expect(periods.every((p) => p.org_id === orgId)).toBe(true);
    expect(periods.every((p) => p.is_locked === false)).toBe(true);
  });

  it('startMonth=1 produces Jan-Dec same year', () => {
    const periods = generateMonthlyFiscalPeriods(1, 2026, orgId);
    expect(periods[0].start_date).toBe('2026-01-01');
    expect(periods[0].name).toContain('January');
    expect(periods[11].start_date).toBe('2026-12-01');
    expect(periods[11].name).toContain('December');
  });

  it('startMonth=7 wraps into next year', () => {
    const periods = generateMonthlyFiscalPeriods(7, 2026, orgId);
    expect(periods[0].start_date).toBe('2026-07-01');
    expect(periods[0].name).toContain('July');
    expect(periods[6].start_date).toBe('2027-01-01');
    expect(periods[6].name).toContain('January');
    expect(periods[11].start_date).toBe('2027-06-01');
  });

  it('has no gaps between consecutive periods', () => {
    const periods = generateMonthlyFiscalPeriods(7, 2026, orgId);
    for (let i = 1; i < periods.length; i++) {
      const prevEnd = new Date(periods[i - 1].end_date);
      const currStart = new Date(periods[i].start_date);
      const dayAfterPrevEnd = new Date(prevEnd);
      dayAfterPrevEnd.setDate(dayAfterPrevEnd.getDate() + 1);
      expect(currStart.toISOString().split('T')[0])
        .toBe(dayAfterPrevEnd.toISOString().split('T')[0]);
    }
  });

  it('handles leap year February (2024)', () => {
    const periods = generateMonthlyFiscalPeriods(1, 2024, orgId);
    const feb = periods[1];
    expect(feb.end_date).toBe('2024-02-29');
  });

  it('handles non-leap year February (2025)', () => {
    const periods = generateMonthlyFiscalPeriods(1, 2025, orgId);
    const feb = periods[1];
    expect(feb.end_date).toBe('2025-02-28');
  });
});
