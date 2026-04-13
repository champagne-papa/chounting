# Known Concerns — Phase 1.1 Audit

Pre-execution artifact. These concerns were identified during the
Phase 1.1 build sessions but were not fully resolved. The orientation
agent should generate hypotheses targeting these specifically, and
the category scanners should investigate them deeply.

These are not the only concerns — they are the ones where prior
evidence exists. The orientation agent should generate additional
hypotheses beyond these four.

---

## 1. Uncommitted foundation infrastructure risk

Task 16 session start discovered 14 files of multi-tenant routing
and auth infrastructure that had been running but never committed
to git. This was remediated in commits `58567cf`, `adc167a`,
`3c20d62`.

**Question for audit:** Are there other load-bearing files that
exist in the working tree but aren't yet committed, or whose
purpose isn't documented? Are there "hidden dependencies" where
the system relies on code whose provenance isn't clear?

---

## 2. Seeding and membership state

Sign-in flow requires creating a new organization on every fresh
`db:reset` because seeded auth users don't have memberships in
seeded orgs after the reset cycle. Workaround is manual org
creation via the form. Integration tests are unaffected — they
use `adminClient` with hard-coded seed UUIDs and bypass the
membership check.

**Question for audit:** Is this the only seeding gap, or are
there others? What else in the seed path is broken or incomplete?
Are there test paths that silently depend on accumulated state
rather than clean seed state?

---

## 3. Runtime-vs-compile-time type gaps

Phase 1.1 discovered three classes of bug where TypeScript types
didn't match runtime shapes:

- React hook re-render semantics (`form.watch` vs `useWatch`)
- PostgREST embed shapes (many-to-one returned as object, not array)
- Postgres NUMERIC serialization (returned as JS numbers, not strings)

The `toMoneyAmount` / `toFxRate` coercion helpers patched the money
case at service boundaries.

**Question for audit:** Are there other external-system boundaries
where types and runtime shapes diverge? Look specifically at:

- (a) Service return types that claim branded types but whose
  Supabase driver returns might not conform
- (b) Form state that receives data from fetches and passes it
  to other systems
- (c) Date/time fields that cross JSON serialization boundaries
- (d) Enum values that the TypeScript type allows but the database
  enum doesn't (or vice versa)

---

## 4. Shared-state integration test isolation

Integration tests share database state across files; Phase 16A
invented a baseline-delta pattern for report tests to avoid
collisions. Earlier tests (Phase 12A) hit entry_number UNIQUE
violations from shared state.

**Question for audit:** Are there other tests vulnerable to the
same shared-state issue that haven't hit it yet? Does the test
suite enforce isolation, or rely on author discipline? Would
running tests in a different order produce different results?
