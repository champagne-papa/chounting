// tests/integration/canvasDirectiveSchemaExtensions.test.ts
// CA-74: Phase 1.2 Session 6 — canvasDirectiveSchema accepts the
// five new directive-type variants (user_profile, org_profile,
// org_users, invite_user, welcome), rejects unknown fields on
// each variant, and rejects unknown discriminator values.

import { describe, it, expect } from 'vitest';
import { canvasDirectiveSchema } from '@/shared/schemas/canvas/canvasDirective.schema';

const validOrg = '11111111-1111-1111-1111-111111111111';

describe('CA-74: canvasDirectiveSchema — Session 6 extensions', () => {
  it('accepts user_profile (no additional fields)', () => {
    const parsed = canvasDirectiveSchema.parse({ type: 'user_profile' });
    expect(parsed).toEqual({ type: 'user_profile' });
  });

  it('accepts welcome (no additional fields)', () => {
    const parsed = canvasDirectiveSchema.parse({ type: 'welcome' });
    expect(parsed).toEqual({ type: 'welcome' });
  });

  it('accepts org_profile + orgId', () => {
    const parsed = canvasDirectiveSchema.parse({ type: 'org_profile', orgId: validOrg });
    expect(parsed).toEqual({ type: 'org_profile', orgId: validOrg });
  });

  it('accepts org_users + orgId', () => {
    const parsed = canvasDirectiveSchema.parse({ type: 'org_users', orgId: validOrg });
    expect(parsed).toEqual({ type: 'org_users', orgId: validOrg });
  });

  it('accepts invite_user + orgId', () => {
    const parsed = canvasDirectiveSchema.parse({ type: 'invite_user', orgId: validOrg });
    expect(parsed).toEqual({ type: 'invite_user', orgId: validOrg });
  });

  it('rejects unknown fields on user_profile (.strict())', () => {
    expect(() => canvasDirectiveSchema.parse({ type: 'user_profile', extraneous: true })).toThrow();
  });

  it('rejects unknown fields on org_profile (.strict())', () => {
    expect(() => canvasDirectiveSchema.parse({ type: 'org_profile', orgId: validOrg, bogus: 1 })).toThrow();
  });

  it('rejects invalid UUID on org_profile', () => {
    expect(() => canvasDirectiveSchema.parse({ type: 'org_profile', orgId: 'not-a-uuid' })).toThrow();
  });

  it('rejects unknown discriminator type', () => {
    expect(() => canvasDirectiveSchema.parse({ type: 'not_a_directive', orgId: validOrg })).toThrow();
  });

  it('requires orgId on org_profile / org_users / invite_user', () => {
    expect(() => canvasDirectiveSchema.parse({ type: 'org_profile' })).toThrow();
    expect(() => canvasDirectiveSchema.parse({ type: 'org_users' })).toThrow();
    expect(() => canvasDirectiveSchema.parse({ type: 'invite_user' })).toThrow();
  });
});
