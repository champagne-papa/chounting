# Ring 1 — Pre-ADR Verification Pass

**Date:** 2026-05-26
**Status:** Verification output (read-only; no decisions; not committed). Closes the three "verify before migration" footnotes flagged in `docs/09_briefs/post-mvp/2026-05-26-ring1-substrate-brainstorm.md` §8.
**HEAD anchor:** `baeeb862`, branch `staging`.
**Purpose:** the ADR draft references these findings so each Decision lands with disk grounding, not TBD markers. No leans are reopened; no calls are made here.

---

## Verification 1 — `bundle_type` enum value set (ADR-0012 §12)

**Result: no discrepancy.** ADR-0012 §12 and ADR-0017's restatement agree on the v1 enum membership. Ring 1 can create the enum to match ADR-0012 §12 with no amendment to either ADR.

### ADR-0012 §12 (canonical) — `docs/07_governance/adr/0012-proposed-mutation-bundle.md:616-657`

```
$ rg -n "born_paid_bill|final_invoice|vendor_credit_applied|intercompany|multi_entity_payment|vendor_credit_with_refund" docs/07_governance/adr/0012-*.md
```

§12 defines a **two-band** membership. The bands matter for the Ring 1 `CREATE TYPE`:

**Ships in the enum at v1 schema time** (per ADR-0010 reserved-enum-states discipline) — 3 values:

- `born_paid_bill` — **v1 active value** (the only value v1 write paths emit). Quote (`:625`): "the born-paid bill bundle. Children: `post_bill` followed by `record_bill_payment`."
- `final_invoice_with_applied_deposit` — **reserved**, ratified by ADR-0015 in Tier 4 (`:632`).
- `vendor_credit_applied_to_bill` — **reserved**, ratified by ADR-0015 in Tier 4 (`:637`).

**Does NOT ship at v1** — "Other reserved candidates … their schema reservation lands when their respective ADRs scope, not in v1" (`:641-643`):

- `intercompany_due_to_due_from` (`:645`, post-v1)
- `multi_entity_payment_split` (`:647`, post-v1)
- `vendor_credit_with_refund` (`:649`, post-v1)

So the **v1 `bundle_type` enum membership per ADR-0012 §12 is exactly `{born_paid_bill, final_invoice_with_applied_deposit, vendor_credit_applied_to_bill}`** — three values. The three "other candidates" are explicitly excluded from the v1 enum by §12 itself.

Note on authority split (`:652-657`): ADR-0012 owns the **discriminator and its membership**; **ADR-0015** owns per-bundle-type child composition. The Ring 1 enum `CREATE TYPE` reads from ADR-0012 §12 membership; child-composition is out of Ring 1 scope.

### ADR-0017 restatement — `docs/07_governance/adr/0017-vendor-template-substrate.md`

```
$ rg -n "bundle_type|born_paid_bill|final_invoice|vendor_credit_applied" docs/07_governance/adr/0017-*.md
```

ADR-0017 consistently references "the closed `bundle_type` enum from ADR-0012 §12" and does not redefine it:
- `:286` schema block — `bundle_type bundle_type not null, -- closed enum from ADR-0012 §12`.
- `:325-328` — "references the closed `bundle_type` enum from ADR-0012 §12. v1 active value is `born_paid_bill`; reserved values (`final_invoice_with_applied_deposit`, `vendor_credit_applied_to_bill`) ship in the enum per ADR-0010".
- `:1175-1177` — explicitly acknowledges the band split: "ADR-0012 §12 reserves two more … and names three additional" (i.e., ADR-0017 already knows the three additional candidates are *not* shipped at v1).

**Discrepancy check:** none on the value set. ADR-0017 defers to ADR-0012 §12 verbatim and the two are aligned on the 3-value v1 membership. The ADR draft creates the 3-value enum and matches both ADRs; no ADR-0012 amendment, no ADR-0017 mismatch.

**Confirmed absent at HEAD** (re-verified): `rg -n "bundle_type" supabase/migrations/` → empty; `rg -n "bundle_type" apps/web/src` → empty. The enum and column genuinely do not exist; Ring 1 creates both.

---

## Verification 2 — `legal_entity_id` nullability precedent

**Result: the dominant precedent is nullable-with-no-DB-default, and `legal_entity_id` has never appeared in a unique constraint anywhere in the live schema.** There is no existing precedent for either of the brainstorm's candidate paths (NOT NULL DEFAULT org_id, or a COALESCE expression unique index). Ring 1 is the first to put `legal_entity_id` in a unique constraint and chooses fresh. (No recommendation — reporting only.)

### Findings table

```
$ rg -n "legal_entity_id" supabase/migrations/ apps/web/src/db/types.ts
$ rg -ni "unique.*legal_entity_id|legal_entity_id.*unique" supabase/migrations/   # → empty
$ rg -ni "coalesce" supabase/migrations/                                          # → no unique-index uses
```

| Table | Source | Column definition | Nullable | DB DEFAULT | In any UNIQUE constraint/index | NULL-handling notes |
|---|---|---|---|---|---|---|
| `source_documents` | `20240135…storage_substrate.sql:182` | `legal_entity_id uuid REFERENCES organizations(org_id) ON DELETE RESTRICT` | **Yes** | **None** | **No** | Immutability trigger compares `IS DISTINCT FROM` (`:389`); comment "legal_entity_id may be NULL" (`:383`) |
| `vendor_prepayments` | `20240138…vendor_prepayment_substrate.sql:188` | `legal_entity_id uuid REFERENCES organizations(org_id) ON DELETE RESTRICT` | **Yes** | **None** | **No** | Comment: "self-references organizations per v1 1:1 org-entity mapping" (`:181`) |
| `vendor_credits` | `20240156…vendor_credits_substrate.sql:34` | `legal_entity_id uuid REFERENCES organizations(org_id) ON DELETE RESTRICT` | **Yes** | **None** | **No** | — |
| (generated types) | `apps/web/src/db/types.ts:2524, 2761, 2895` | `legal_entity_id: string \| null` for all three tables | **Yes** | — | — | FKs `*_legal_entity_id_fkey` → organizations |

### Conventions observed

1. **Uniform column shape:** `legal_entity_id uuid REFERENCES organizations(org_id) ON DELETE RESTRICT`, **nullable**, across all three tables that carry it. No table uses `NOT NULL`.
2. **"Defaults to org_id in v1" is an application/service convention, NOT a DB `DEFAULT`.** The exact comment (`20240135…:178-181`): *"Defaults to org_id in v1 where the org-entity mapping is 1-1. Nullable to support v1 implicit-org case + post-v1 explicit legal-entity routing. FK target may shift to a separate `legal_entities` table when multi-entity activates post-v1."* The create-RPCs insert `NULLIF(payload->>'legal_entity_id','')::uuid` (`20240137…:101`, `20240153…:93`, `20240152…:516`) — i.e., the column is genuinely **NULL when not supplied**, not defaulted at the DB. The "defaults to org_id" behavior, where it happens, is done by the caller, not the schema.
3. **FK target is `organizations(org_id)`** (no `legal_entities` table exists); the storage-substrate comment explicitly forward-points to a possible future target shift.
4. **NULL-safe comparisons** are the established discipline where the column participates in logic: immutability triggers use `IS DISTINCT FROM` (`20240135…:389`, `20240153…:259`).
5. **No unique-constraint precedent:** `rg "unique.*legal_entity_id"` is empty across all migrations. `legal_entity_id` has never been part of a unique key.
6. **No COALESCE-expression-unique-index precedent:** every `COALESCE` hit in migrations is an aggregate (balance/sum RPCs) or a payload default (`COALESCE((p->>'x')::t, default)`); none is a unique index. The "expression unique index with COALESCE" path the brainstorm names has no precedent in this codebase.

### Implication for the ADR draft (reported, not decided)

The ADR-0017 unique constraint `(org_id, legal_entity_id, vendor_id, bundle_type)` puts `legal_entity_id` into a unique key for the first time in the schema. With the established nullable shape, a plain unique constraint does **not** enforce when `legal_entity_id IS NULL` (Postgres NULL ≠ NULL). The three candidate paths (NOT NULL DEFAULT org_id / COALESCE expression index / partial index) each break or extend a precedent: `NOT NULL` breaks the uniform-nullable convention *and* the "FK may shift to `legal_entities`" forward-compat note; a COALESCE expression index establishes a pattern with no prior instance. The ADR makes the call; this pass only records that no path is precedent-backed.

---

## Verification 3 — actor-reference shape (system / agent actors)

**Result: a project standard EXISTS** — ADR-0007 Q78 / **Path X**, ratified 2026-05-24 in the auto-commit arc. `created_by` columns are `uuid REFERENCES auth.users(id)`; the human-vs-system distinction lives at the **service-context layer**, not in a DB `actor_type` column, and collapses to a seeded service-account uuid at write time. **ADR-0017's `created_by text` is drift; live `vendor_rules.created_by uuid REFERENCES auth.users(id)` already matches the standard.**

### The standard — ADR-0007 §Q78 / Path X

```
$ rg -n "Q78|Path X|SYSTEM_ACTOR|system_actor|created_by" docs/07_governance/adr/0007-three-tier-agent-architecture.md
```

Verbatim (`docs/07_governance/adr/0007-three-tier-agent-architecture.md:299-320`):

> *Created-by + audit attribution — Path X (ratified 2026-05-24).* … Resolution: **one seeded service-account `auth.users` row** (`SYSTEM_ACTOR_USER_ID`, `system_actor = 'pipeline_orchestrator'`) with **no memberships or roles** … at the commit gate `withInvariants` bypasses the identity invariants and **adapts** the system-actor context to a verified `ServiceContext` whose `user_id` is that uuid, so `created_by` **and** audit `user_id` resolve to it automatically downstream — **no ledger-service changes** … **no `audit_log` schema change is required** (the service-account uuid in `user_id` is the attribution; this supersedes an earlier draft that proposed a nullable `audit_log.system_actor` column). `caller.user_id` stays `null` for the authorization discriminant; the service-account uuid is used only for attribution, never for authorization.

### The runtime shape — `apps/web/src/services/middleware/serviceContext.ts:58-78`

- `SYSTEM_ACTOR_USER_ID = '00000000-0000-0000-0000-0000000000a1'` (`:67`) — "the seeded service-account `auth.users` row that system actors attribute ledger writes to (`created_by` + audit `user_id`) per ADR-0007 Q78 Path X."
- `SystemActorCaller` (`:69-78`): `user_id: null`, `system_actor: string` (names the invocation source), optional `system_user_id` (the service-account uuid the actor commits as).
- Seeded in `scripts/seed-auth-users.ts` + `apps/web/src/db/seed/dev.sql:116` — those literals "MUST match this constant."
- Live consumers: `withInvariants.ts:87-100` (rejects a system actor with no `system_user_id`); `ingestDocument.ts:60-78, 446`; `runOCR.ts:53`; `postmark-inbound/route.ts:107, 300`.

### What the project standardized

- **`created_by` is `uuid REFERENCES auth.users(id)`.** No `created_by text`, no `actor_type` / `created_by_actor_type` column anywhere (`rg "actor_type|created_by_actor"` → no schema hits).
- **Human vs. system is a service-context discriminant, not a column.** `caller.user_id` (uuid for humans, `null` for system) + `caller.system_actor` (string label) carry the distinction; at the DB write a system actor commits **as** `SYSTEM_ACTOR_USER_ID`, so the `uuid REFERENCES auth.users(id)` column is satisfied with a real, joinable identity.
- **No `audit_log` schema change** is the ratified path (a nullable `audit_log.system_actor` column was explicitly considered and rejected).
- `agent_autonomy_model.md` does **not** define an actor-reference shape (`rg` for actor terms across `docs/02_specs/` returned no actor-convention hits there); ADR-0007 Q78 is the sole canonical home.

### Implication for the ADR draft (reported, not decided)

ADR-0017's `created_by text` is the drifted form. Live `vendor_rules.created_by uuid REFERENCES auth.users(id)` already matches the Path X standard — so for Ring 1's new tables (`rule_registry`, `rule_track_records`), copying the *live* `created_by` shape is correct, while copying ADR-0017's *text* would not be. Rule proposals are system-generated, so writes attribute via the `withInvariants` service-account adaptation (`SYSTEM_ACTOR_USER_ID`); no new actor column is implied. The ADR makes the call; this pass records that the standard exists and is `uuid → auth.users(id)` + service-account attribution.

---

## Summary

| # | Item | Finding | Net for ADR draft |
|---|---|---|---|
| 1 | `bundle_type` enum value set | ADR-0012 §12 and ADR-0017 agree; v1 membership = 3 values (`born_paid_bill` + 2 reserved); 3 further candidates explicitly excluded from v1 | Create 3-value enum; no amendment to either ADR |
| 2 | `legal_entity_id` nullability | Uniformly nullable, no DB default, never in a unique constraint; no COALESCE-unique-index precedent | First unique-constraint use; all candidate paths are precedent-setting — ADR chooses fresh |
| 3 | actor-reference shape | Standard exists: ADR-0007 Q78 / Path X — `created_by uuid → auth.users(id)` + service-account (`SYSTEM_ACTOR_USER_ID`) attribution; no `actor_type` column | Use live `vendor_rules.created_by` shape (uuid), not ADR-0017's `text` |

*End verification pass. Next artifact (separate prompt): the Ring 1 substrate ADR draft. Not committed; not pushed.*
