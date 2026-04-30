// eslint-rules/__tests__/withInvariants-wrap-or-annotate.test.ts
//
// LT-01(b) custom rule unit tests. Uses ESLint's RuleTester to
// exercise the rule against synthetic source examples covering
// pass cases (Pattern A wrapped + canonical-annotated D/G2/I/B/G1)
// and fail cases (un-wrapped+un-annotated + non-canonical comment).

import { describe, it, expect } from 'vitest';
import { RuleTester } from 'eslint';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const rule = require('../withInvariants-wrap-or-annotate');

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

describe('withInvariants-wrap-or-annotate (LT-01(b) custom rule)', () => {
  it('passes RuleTester valid + invalid cases', () => {
    tester.run('withInvariants-wrap-or-annotate', rule, {
      valid: [
        {
          // Pattern A: wrapped at export site.
          code: `
            export const userService = {
              updateUser: withInvariants(updateUser),
            };
          `,
        },
        {
          // Pattern D: canonical-form annotation, method-shorthand.
          code: `
            export const userProfileService = {
              // withInvariants: skip-org-check (pattern-D: own-profile-only, route reads user_id from ctx.caller)
              async getProfile(input, ctx) { return null; },
            };
          `,
        },
        {
          // Pattern G2: canonical-form annotation, method-shorthand.
          code: `
            export const taxCodeService = {
              // withInvariants: skip-org-check (pattern-G2: globally-shared reference data; org-agnostic)
              async listShared(input, ctx) { return []; },
            };
          `,
        },
        {
          // Pattern I: canonical-form annotation, method-shorthand.
          code: `
            export const invitationService = {
              // withInvariants: skip-org-check (pattern-I: invitation flow; pre-auth via token)
              async acceptInvitation(input, ctx) { return null; },
            };
          `,
        },
        {
          // Pattern B with bare-property-reference shape.
          code: `
            export const journalEntryService = {
              // withInvariants: skip-org-check (pattern-B: route-handler-wrapped via withInvariants(action: 'journal_entry.post'))
              post,
            };
          `,
        },
        {
          // Pattern G1 with the route-handler-gate rationale.
          code: `
            export const orgService = {
              // withInvariants: skip-org-check (pattern-G1: route-handler-gated via caller.org_ids.includes(orgId) check; not withInvariants-wrapped per S30 hot-fix arc c617f58 + 5d58b36)
              async getOrgProfile(input, ctx) { return null; },
            };
          `,
        },
        {
          // Mixed: wrapped + annotated in same export.
          code: `
            export const mixedService = {
              mutating: withInvariants(mutating),
              // withInvariants: skip-org-check (pattern-D: own-profile-only)
              async readOnly(input, ctx) { return null; },
            };
          `,
        },
      ],
      invalid: [
        {
          // Un-wrapped + un-annotated: rule must fire.
          code: `
            export const brokenService = {
              async someExport(input, ctx) { return null; },
            };
          `,
          errors: [{ messageId: 'missingWrapOrAnnotate' }],
        },
        {
          // Bare property reference, un-annotated: rule must fire.
          code: `
            export const brokenService = {
              someExport,
            };
          `,
          errors: [{ messageId: 'missingWrapOrAnnotate' }],
        },
        {
          // Non-canonical comment shape — wrong prefix.
          code: `
            export const brokenService = {
              // skip-org-check (pattern-D: rationale)
              async someExport(input, ctx) { return null; },
            };
          `,
          errors: [{ messageId: 'missingWrapOrAnnotate' }],
        },
        {
          // Non-canonical comment shape — missing pattern enum.
          code: `
            export const brokenService = {
              // withInvariants: skip-org-check (rationale)
              async someExport(input, ctx) { return null; },
            };
          `,
          errors: [{ messageId: 'missingWrapOrAnnotate' }],
        },
        {
          // Non-canonical comment shape — wrong parens (square brackets).
          code: `
            export const brokenService = {
              // withInvariants: skip-org-check [pattern-D: rationale]
              async someExport(input, ctx) { return null; },
            };
          `,
          errors: [{ messageId: 'missingWrapOrAnnotate' }],
        },
      ],
    });
    // RuleTester throws on failure; reaching here means all cases passed.
    expect(true).toBe(true);
  });
});
