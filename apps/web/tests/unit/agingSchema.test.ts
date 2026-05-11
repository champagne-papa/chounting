// Unit tests for aging.schema.ts Layer-2 Zod boundary (chunk B5-3-D1 substantive session #1).
//
// Tests the EC-A-3 AP aging input schema:
//   - org_id required + UUID format
//   - as_of_date optional; when present must be YYYY-MM-DD ISO date
//
// Pattern mirror: billSchema.test.ts (B5-2) for unit-test discipline at the
// Layer-2 Zod boundary. Mirrors the *Input + *InputRaw type-export discipline.

import { describe, it, expect } from 'vitest';
import { ApAgingInputSchema } from '@/shared/schemas/spend/reports/aging.schema';

const VALID_UUID = '11111111-1111-4111-8111-111111111111';

describe('ApAgingInputSchema (Layer-2 boundary)', () => {
  it('accepts valid org_id + valid as_of_date', () => {
    expect(() =>
      ApAgingInputSchema.parse({ org_id: VALID_UUID, as_of_date: '2026-05-10' }),
    ).not.toThrow();
  });

  it('accepts valid org_id without as_of_date (optional; service defaults to today)', () => {
    expect(() => ApAgingInputSchema.parse({ org_id: VALID_UUID })).not.toThrow();
  });

  it('rejects non-ISO date format for as_of_date', () => {
    expect(() =>
      ApAgingInputSchema.parse({ org_id: VALID_UUID, as_of_date: '05/10/2026' }),
    ).toThrow();
    expect(() =>
      ApAgingInputSchema.parse({ org_id: VALID_UUID, as_of_date: '2026-5-10' }),
    ).toThrow();
    expect(() =>
      ApAgingInputSchema.parse({ org_id: VALID_UUID, as_of_date: '05-10-2026' }),
    ).toThrow();
  });

  it('rejects non-string as_of_date', () => {
    expect(() =>
      ApAgingInputSchema.parse({ org_id: VALID_UUID, as_of_date: 12345 }),
    ).toThrow();
  });

  it('rejects missing org_id', () => {
    expect(() => ApAgingInputSchema.parse({})).toThrow();
    expect(() => ApAgingInputSchema.parse({ as_of_date: '2026-05-10' })).toThrow();
  });

  it('rejects malformed UUID for org_id', () => {
    expect(() => ApAgingInputSchema.parse({ org_id: 'not-a-uuid' })).toThrow();
  });

  it('rejects null org_id', () => {
    expect(() => ApAgingInputSchema.parse({ org_id: null })).toThrow();
  });
});
