## Phase 1.5A

- 2026-04-15 NOTE   Session start: Phase 1.5A execution begins
  against approved brief at docs/09_briefs/phase-1.5/brief.md
  (approval commit ec6cc51). Four OQs resolved inline in brief
  §15: OQ-06 (two audit rows for primary-address demotion),
  OQ-07 (read-only service functions are not
  withInvariants()-wrapped), OQ-08 (region accepts two-letter
  codes only; "British Columbia" rejected), OQ-09 (family_office
  bridges to holding_company CoA provisionally). Execution order:
  four migrations (108, 109, 110, 111) with pnpm db:reset between
  each; Zod schemas under src/shared/schemas/organization/;
  service code (orgService extension + new addressService); eight
  API routes; types regeneration; ten Category A+B tests;
  exit-criteria matrix closeout.
- 2026-04-15 WRONG  Migration 111 added source_system NOT NULL
  without DEFAULT, breaking every existing test and the seed
  script that directly inserts journal_entries rows. Phase 1.1's
  test_helpers.sql and crossOrgRlsIsolation.test.ts needed
  source_system: 'manual' added to their INSERT calls.
  journalEntryService.post() also needed source_system: parsed.source.
  dev.sql needed industry_id + business_structure added to the
  organizations INSERT. Fix was mechanical but should have been
  caught before running the existing suite — future additive
  NOT NULL columns with no DEFAULT should include a "what breaks"
  grep checklist in the brief.
- 2026-04-15 NOTE   Phase 1.5B execution session start. Brief
  approved at docs/09_briefs/phase-1.5/1.5B-brief.md. Six OQs
  resolved: OQ-01 (ownership transfer deferred), OQ-02 (token
  format {invitation_id}:{random} — O(1) PK lookup), OQ-03
  (last_login_at on sign-in only), OQ-04 (audit_log.org_id
  nullable for auth events), OQ-05 (bcryptjs, no native build),
  OQ-06 (lazy expiration at query time).
- 2026-04-15 WRONG  CA-25 test initially asserted /unique|duplicate/
  but hit the membership_owner_must_be_controller CHECK first because
  test set is_org_owner=true on an executive (not a controller).
  Fix: set role=controller first, then test the partial unique.
  Lesson: when testing a partial unique index, ensure ALL other
  constraints (CHECKs, FKs) pass first so the index is the failure
  point, not a preceding constraint.
- 2026-04-15 WRONG  listOrgUsers PostgREST embed
  memberships→user_profiles failed because PostgREST couldn't
  infer the join when both tables share user_id with multiple FK
  relationships. Fix: manual two-query join in TypeScript. This is
  a known PostgREST limitation for cross-table embeds with
  ambiguous FK paths.
- 2026-04-15 WRONG  Three bugs found in invitationService during
  closeout review. (1) Dead INSERT created a bogus 'invited'
  membership for the inviter (silently failed due to UNIQUE).
  Deleted — membership created on accept, not invite. (2) Dead
  existing-member check: two queries assigned and never read, no
  USER_ALREADY_MEMBER thrown. Replaced with admin.listUsers()
  email lookup + active membership check. (3) acceptInvitation
  audit row missing before_state despite being an UPDATE (pending
  → accepted). Added invitation as before_state. Lesson: code
  with silent-failure error handling needs special review — two
  of three bugs were hidden because errors were caught and
  swallowed, so tests passed on the happy path.
- 2026-04-15 NOTE   Phase 1.5C execution session start. Brief
  approved at docs/09_briefs/phase-1.5/1.5C-brief.md. Three
  adjustments applied during execution: (1) ACTION_NAMES runtime
  constant array derives ActionName type — parity test imports it
  instead of duplicating, (2) canUserPerformAction short-circuits
  on ctx.caller.org_ids miss before DB query, (3) CA-36 is a
  regression gate not a new test file — 11 new tests + 1 gate.
  OQ-01 (role column drop) and OQ-02 (org_invitations.role
  migration) deferred to Phase 1.6/Phase 2.
- 2026-04-15 WRONG  Migration 116 initially included user_has_permission()
  SQL helper alongside the permission catalog tables. Function body
  references memberships.role_id which doesn't exist until migration
  117. Postgres SQL-language function validation rejects column
  references at CREATE FUNCTION time. Relocated to 117. Lesson: SQL
  helper functions with cross-migration column dependencies must land
  in (or after) the migration that adds the dependency. Migration 113
  got this right by bundling the RLS helper rewrites with the
  memberships.status column addition.


