// tests/unit/agent/draftVendorRuleSchema.test.ts
//
// Ring 2A-authoring commit (d) (ADR-0026 §1). DraftVendorRuleInputSchema is the
// tool's NL-hint input boundary (.strict()).

import { describe, it, expect } from 'vitest';
import { DraftVendorRuleInputSchema } from '@/agent/tools/schemas/draftVendorRule.schema';

describe('DraftVendorRuleInputSchema', () => {
  it('accepts a full draft (vendor_text + optional hints)', () => {
    const r = DraftVendorRuleInputSchema.safeParse({
      vendor_text: 'Spotify',
      bundle_type_hint: 'recurring bill',
      account_hint: 'subscriptions',
    });
    expect(r.success).toBe(true);
  });

  it('accepts vendor_text alone (hints optional)', () => {
    expect(DraftVendorRuleInputSchema.safeParse({ vendor_text: 'Spotify' }).success).toBe(true);
  });

  it('rejects empty vendor_text', () => {
    expect(DraftVendorRuleInputSchema.safeParse({ vendor_text: '' }).success).toBe(false);
  });

  it('rejects unknown fields (.strict())', () => {
    expect(
      DraftVendorRuleInputSchema.safeParse({ vendor_text: 'Spotify', vendor_id: 'x' }).success,
    ).toBe(false);
  });
});
