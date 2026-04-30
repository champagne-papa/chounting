// tests/setup/makeTestContext.ts
// Phase 1.2 Session 2 — ServiceContext factory for orchestrator
// and service-layer tests. Bypasses buildServiceContext's JWT
// validation (unavailable in integration tests) but returns the
// same shape.

import type { ServiceContext, VerifiedCaller } from '@/services/middleware/serviceContext';
import { SEED } from './testDb';

export interface MakeTestContextOptions {
  user_id?: string;
  email?: string;
  org_ids?: string[];
  locale?: 'en' | 'fr-CA' | 'zh-Hant';
  trace_id?: string;
}

const SEED_EMAILS: Record<string, string> = {
  [SEED.USER_EXECUTIVE]: 'executive@thebridge.local',
  [SEED.USER_CONTROLLER]: 'controller@thebridge.local',
  [SEED.USER_AP_SPECIALIST]: 'ap@thebridge.local',
};

export function makeTestContext(opts: MakeTestContextOptions = {}): ServiceContext {
  const user_id = opts.user_id ?? SEED.USER_CONTROLLER;
  const caller: VerifiedCaller = {
    user_id,
    email: opts.email ?? SEED_EMAILS[user_id] ?? `test-${user_id}@thebridge.local`,
    verified: true,
    org_ids: opts.org_ids ?? [SEED.ORG_HOLDING],
  };
  return {
    trace_id: opts.trace_id ?? crypto.randomUUID(),
    caller,
    locale: opts.locale ?? 'en',
  };
}
