# Audit and permissions conventions

The two distinct namespaces for "what may the caller do?" vs. "what
happened?" The discipline that keeps the permission catalog and the
audit log internally consistent, even as both evolve.

See [`README.md`](./README.md) for the routing rule that determines
when a rule belongs here vs. another topical file.

Audit-action naming split (dot-namespaced vs. underscored) is
currently in repo-root `CLAUDE.md` under "Audit-action naming
convention split"; it relocates to this file at Commit D of the v2.2
reorg (see `docs/09_briefs/phase-6.5/reorg-proposal-v2.md` §4.1).

---

## Permission Keys vs Audit Action Keys

Two distinct string namespaces that must not be merged:

- **Permission keys** (used in `canUserPerformAction` ActionName
  type and `withInvariants({ action })` calls): **imperative
  verbs**, dot-separated. Examples: `org.profile.update`,
  `org.address.create`, `journal_entry.post`, `period.lock`.
  These answer "what may the caller do?"

- **Audit action keys** (written to `audit_log.action` by
  `recordMutation`): **past-tense verbs**. Examples:
  `org.profile_updated`, `org.address_added`,
  `org.address_removed`. These answer "what happened?"

Phase 1.1 established this split implicitly; Phase 1.5A made it
explicit after catching a collision where both namespaces used the
same past-tense strings.

---
**Origin:**
- First codified: Phase 1.5A, 2026-04-15 (made explicit; Phase 1.1
  established implicitly)
- Evidence basis: Phase 1.5A collision incident (both namespaces
  used the same past-tense strings)
- Promoted from: Phase 1.5A convention codification batch
- Cross-references: `canUserPerformAction`,
  `withInvariants({ action })`, `audit_log.action`

---

## Permission Catalog Count Drift

When a migration adds, removes, or reshapes rows in `permissions`
or `role_permissions`, the sub-brief MUST include a grep
verification step before execution:

```bash
grep -rn 'toHaveLength\|toBe(' tests/ | grep -E 'permissions|role_permissions'
```

Every hit is a hardcoded count that will fail when the catalog
changes. The parity invariant is checked at multiple layers:

- **CA-27** (`permissionParity.test.ts`) — dynamic set-equality
  between `ACTION_NAMES` and the `permissions` table. Requires no
  edit when the catalog changes; passes automatically once both
  sides carry the new key.
- **CA-28** (`permissionCatalogSeed.test.ts`) — hardcoded counts
  and role-grant lists via the admin client. Breaks on catalog
  change.
- **CA-37** (`crossOrgRlsIsolation.test.ts`) — hardcoded counts
  via the RLS surface (authenticated-user client). Breaks on
  catalog change.

Update all hardcoded counts in the same commit as the
`ACTION_NAMES` addition. The intermediate state between "migration
applied, DB has N+1 rows" and "`ACTION_NAMES` + CA-28 + CA-37
updated" fails tests; splitting the fix across commits leaves a
red intermediate that must either be squashed or kept in a single
atomic push.

Codified from Phase 1.2 Session 1 (2026-04-18) where the sub-brief
named only CA-28. The full `pnpm test` at commit 4 surfaced
CA-37's two hardcoded assertions (`toBe(16)` and `toBe(22)`);
executor correctly stopped and flagged rather than silently
extending scope. See `docs/07_governance/friction-journal/phase-1.2.md`
entry 2026-04-18 (CA-37 sub-brief gap).

---
**Origin:**
- First codified: Phase 1.5A, 2026-04-15
- Evidence basis: N=1 first-instance precedent (Phase 1.2 Session 1
  CA-28 sub-brief gap → CA-37 surfacing)
- Promoted from: Phase 1.5A convention codification batch (codified
  from Phase 1.2 Session 1)
- Cross-references:
  `docs/07_governance/friction-journal/phase-1.2.md` entry
  2026-04-18 (CA-37 sub-brief gap); CA-27, CA-28, CA-37 tests

---

## Audit `before_state` Convention

- **Inserts**: `before_state = null` (explicitly passed as
  `before_state: undefined` in the service call so the absence is
  deliberate, not accidental). The row did not exist before.
- **Updates and deletes**: `before_state` = full pre-mutation
  entity row as `jsonb`. Consumers reconstruct field-level diffs
  by comparing `before_state` to the current row.

This convention means the presence/absence of `before_state`
distinguishes "created" from "mutated" when reading the audit log.

---
**Origin:**
- First codified: Phase 1.5A, 2026-04-15
- Evidence basis: N=multiple (every audit-emitting service)
- Promoted from: Phase 1.5A convention codification batch
- Cross-references: ADR-0009 (before-state-capture convention);
  `recordMutation` service
