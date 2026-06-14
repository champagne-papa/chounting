> **STATUS — 2026-06-14 (added when this doc was reconciled into `main`):** this is the
> historical planning/audit record for the staging→main substrate release. That release
> **has since been applied** — prod (`ollyqiiwdvbpbngqgjqk`) is at migration
> `20240180000000` with the full document-platform / rule substrate present
> (`org_settings`, `document_cases`, `rule_track_records`, `rule_evaluation_log` all
> verified live this session). Read below as the record of a plan that was carried out,
> not pending work. Reconciliation: CURRENT_STATE.md "Track A Step 4 HALTED … 2026-06-09"
> + its 2026-06-14 supersession.

# staging→main Substrate Release — parking notes + read-only audit brief

**Status:** Advisory parking doc for a **not-yet-scoped** release. NOT a ratified
charter or plan; authorizes no work. It exists so the plan + the read-only audit
brief survive the session boundary, not to start the release.

**Anchored at:** 2026-06-09. The latest `staging` commit observed this session was
`540a1f94` (the GRAPH_* turbo.json commit); the session-start *local* HEAD
`874babd0` was already behind it. Prod `main`'s commit-distance (~468 behind) is
`[handoff]`-derived and **not** verified this session — see the PROD-SERVED-CODE
audit step. **Every `[disk]`
/ `[live]` specific below is point-in-time and MUST be re-confirmed live when the
release opens** — the local migration chain is still evolving on `staging`, and the
remote state can drift. The disk-side classification map is **deliberately held and
built fresh at release time** for the same reason: a stale map reads authoritative
while being subtly wrong, which is the exact failure mode this whole arc was about.

**Legend:** `[disk]` = grounded from repo/migrations this session · `[live]` =
read from the remote DB / deploy this session · `[handoff]` = carried from the
prior handoff / advisor notes, NOT verified this session · `[decided]` = a call
made in the originating thread.

## Correction — 2026-06-09 (same-day, post-DDL-map-pass): the "not a clean prefix" framing is superseded

**The "`vendor_rules` present / `org_settings` absent ⇒ out-of-order ⇒ not a clean
prefix ⇒ reconciliation-not-push" framing throughout this doc (facts section,
decision rationale, audit-brief context) is SUPERSEDED — it was a misread.** A
same-day DDL-map pass read the `CREATE TABLE` sites directly: `vendor_rules` is an
**initial-schema** table (`20240101000000_initial_schema.sql:347`, ≤`20240132`;
verified first-hand, no later DROP/recreate — the `20240163`+ rule migrations
*extend* it). So its presence on the remote is **exactly what a clean `20240132`
prefix looks like, not an anomaly.** Every probed datapoint agrees:
vendor_rules@`20240101` present ✓; source_documents@`20240135`,
document_cases@`20240143`, ingest_batches+document_jobs@`20240152`,
org_settings@`20240158` all >132 and absent ✓.

**Leading picture is now a clean ordered forward-apply** of `20240133→20240180`, not
an out-of-order reconciliation project. **UNCHANGED — the real risk:**
- the confirmed **live-prod hazard set `{133, 138, 139, 156}`** — initial-schema
  tables (`journal_entries`/`journal_lines`, `bills`/`bill_lines`/`payments`) prod
  writes today; `138/139` add columns + `_v1_active` CHECKs + a `payment_purpose`
  trigger; `156` does an `UPDATE bills` live-data backfill;
- the **main-compat** question on those four;
- the **prod-shared** blast radius + the manual `pg_dump` precondition.

**STILL OWED (token-gated):** the live full inventory remains the authority on
"fully clean." The one way the clean-prefix hypothesis still breaks: if the >132
rule substrate is **present** on the remote, that is genuine out-of-order application
— canonical absence-test list in the Hazard map below (`rule_registry`@`20240163`,
`rule_evaluation_log`@`20240164`, `rule_branches`+`rule_conditions`@`20240169`). The audit's
PHYSICAL OBJECT INVENTORY (step 2, which already spans `20240133→20240180`) covers
them. Until then: strongly supported by every disk datapoint, confirmed by none of
the live full set yet.

*(The original "not a clean prefix" framing below is left intact per the additive-
correction discipline — read it through this correction. This correction is the
arc's own verify-the-source lesson turned on our own conclusion: the claim rested on
a single table misattributed from its naming.)*

## Hazard map — complete (2026-06-09, post-full-DDL-classification)

All 48 migrations `20240133→20240180` are DDL-classified. **Confirmed live-prod
hazard set = `{133, 138, 139, 156, 158, 163}`** (Class B — alter/trigger/backfill on
a ≤132 table that's on prod; each membership verified first-hand against the
migration DDL + the ≤132 boundary). Everything else is **Class A** (new >132 objects
— document platform, rules registry/branches/log, workflow, evidence, autonomy log,
RPCs, views), **A\*** (alter / CHECK-broaden / ADD VALUE on >132 objects — apply-order
only: 144, 150, 151, 153, 157, 159, 160, 161, 174, 176, 177, 178, 179, 180 + the
source_documents alters), or **Class C** (additive permission INSERTs into ≤132
permission tables: 140, 141, 142, 162, 166, 167). None of A / A\* / C touches a ≤132
table structurally.

| # | ≤132 table | apply-time failure? | live-data write? | post-apply behavior change |
|---|---|---|---|---|
| 133 | journal_entries / journal_lines | No (triggers don't validate existing rows) | No | **Yes** — `BEFORE INSERT` period-range trigger (`:162`, rejects entry_date outside its fiscal period) + journal_line account-org trigger (`:199`) + UPDATE/DELETE/TRUNCATE immutability — changes the live posting path |
| 138 | payments | No (new cols `DEFAULT` into the new CHECKs) | No | Yes — payment_purpose immutability trigger + new CHECKs on the payments write path |
| 139 | bills / bill_lines / payments | No (ADD COLUMN nullable / NOT NULL DEFAULT) | No | Minor — additive columns |
| 156 | bills | No | **Yes** — `UPDATE bills` (`:170`) flips **all** bills + 1 audit row each | No |
| 158 | organizations | No | Backfill into new org_settings (not existing org rows) | Yes — `AFTER INSERT` trigger on the live org-creation path (benign/additive) |
| 163 | vendor_rules | **YES — sharpest** (dup-preflight RAISE + FK backfill coverage + bundle_type NOT-NULL backfill) | Yes (bundle_type + rule_registry backfill) | DROP cols/type — negligible vs `625c7df3` [served-code verified; **contingent on prod still serving that SHA** — re-confirm at apply, see checks] |

**Read-only pre-apply checks the live audit carries** (each reads prod data, applies
nothing):
- **163** — apply-time risk reduces to `SELECT count(*) FROM vendor_rules` (the
  migration's §d/§f note vendor_rules is empty — zero app writers; **0 ⇒ dup-preflight +
  FK backfill + bundle_type NOT-NULL all no-op → clean apply**). If >0: `… GROUP BY
  org_id, vendor_id HAVING count(*)>1` (dup-preflight aborts) + `rule_id` null /
  cross-org checks. **Scope:** this is the apply-time *data* risk only — 163's DROP of
  cols/type is the *post-apply* risk, resolved independently by the served-code check.
- **156** — [corrected] the `UPDATE bills` predicate (`:170`) references
  `bills.override_evidence_completeness` (@138) + `source_document_links` (@~147),
  **neither on prod pre-apply**, so the full predicate isn't runnable now. In ordered
  apply `source_document_links` is empty ⇒ `NOT IN (empty)` holds for every bill ⇒
  **156 flips `override_evidence_completeness=true` on ALL bills + one audit row each.**
  Magnitude check (runnable now): `SELECT count(*) FROM bills;` — all of them, not
  "some lacking links."
- **133 / 138 / 158** — post-apply / behavioral; resolved by the served-code check
  (done for 163 vs `origin/main = 625c7df3`; the exact *deployed* SHA + per-table
  read is the audit's PROD-SERVED-CODE step).

**Refined clean-prefix confirmation test:** the audit's PHYSICAL OBJECT INVENTORY
should confirm **absence** of the >132 rule-substrate tables — `rule_registry`@163,
`rule_evaluation_log`@164, `rule_branches`+`rule_conditions`@169. *Their presence*
would be genuine out-of-order application (the rules arc partially applied).
`vendor_rules` presence is **not** a signal (≤132, expected on any clean prefix — the
dissolved misattribution; see the Correction above).

**Net:** clean ordered forward-apply is the right *mechanism* (the prefix is clean on
every disk datapoint), but the apply is **not low-risk** — `163` is the sharpest
(data-driven apply-failure) and `133` changes the live posting path. Both are
checkable read-only before anything touches prod, which was the point of the
disk-first pass. Gates unchanged: the live audit (token-gated) running the checks
above; main-compat re-confirm at apply (the 163 served-code finding is contingent on
prod still serving `625c7df3` — re-run if a promotion intervenes); the manual
`pg_dump` (Free tier, no PITR); per-batch apply on explicit go.

## Live-audit run-sheet — read-only (2026-06-09, advisor-verified against the hazard map)

Phase-1 of the release. **Applies nothing; stops at "report findings."** Needs a
read-only DB credential — a **read-only Postgres role** (least-privilege, recommended;
`SELECT`-only / `default_transaction_read_only=on`) is preferred over the Supabase MCP
OAuth (which only issues its fixed broad scope ⇒ time-boxed + revoke if used).
`database:write` is **not** needed. Vercel deployment metadata via the existing MCP
(no new grant). Re-confirm the refs/endpoint at run time (point-in-time).

**(a) APPLIED LIST**
```sql
SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version;
-- expect tail 20240132_add_recurring_journal_permissions; flag ANY version > 20240132.
```

**(b) PHYSICAL OBJECT INVENTORY / clean-prefix test**
```sql
-- MUST be ABSENT (NULL) — present ⇒ genuine out-of-order:
SELECT obj, to_regclass('public.'||obj) FROM unnest(ARRAY[
  'rule_registry','rule_evaluation_log','rule_track_records','rule_branches','rule_conditions',
  'source_documents','document_cases','org_settings','ingest_batches','document_jobs',
  'source_document_links']) obj;
-- MUST be PRESENT (≤132 hazard targets the forward-apply alters):
SELECT obj, to_regclass('public.'||obj) FROM unnest(ARRAY[
  'vendor_rules','bills','bill_lines','payments','organizations','journal_entries','journal_lines']) obj;
-- pre-163 shape: autonomy_tier/created_at/created_by PRESENT, bundle_type/legal_entity_id ABSENT:
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='vendor_rules'
  AND column_name IN ('autonomy_tier','created_at','created_by','bundle_type','legal_entity_id');
```

**(c) 163 — apply-time risk reduces to: is vendor_rules empty?**
```sql
SELECT count(*) FROM vendor_rules;     -- 0 ⇒ clean apply (preflight/backfill/NOT-NULL all no-op)
-- only if > 0:
SELECT org_id, vendor_id, count(*) FROM vendor_rules GROUP BY 1,2 HAVING count(*)>1;        -- dup-preflight aborts
SELECT count(*) FROM vendor_rules WHERE rule_id IS NULL;                                     -- FK-orphan
SELECT rule_id, count(DISTINCT org_id) FROM vendor_rules GROUP BY 1 HAVING count(DISTINCT org_id)>1;  -- composite-FK mismatch
```

**(d) 156 — blast magnitude**
```sql
SELECT count(*) AS bills_backfilled_by_156 FROM bills;   -- 156 flips override=true on ALL of them + 1 audit row each
```

**(e) PROD-SERVED-CODE — pin the *actual* deployed SHA (not the 625c7df3 proxy)**
1. Vercel MCP → the chounting **production** deployment's `githubCommitSha`.
2. `git grep -nE 'autonomy_tier|vendor_rules\.(created_at|created_by)' <that-SHA> -- apps/web/src`
   (exclude generated `db/types.ts`) → confirm no runtime read of the cols/type 163 drops.
   (Clean at `625c7df3`; re-run vs the real SHA — 163's post-apply safety is pinned to it.)

**Discipline:** read-only credential; re-confirm every `[live]` result first-hand;
flag provenance; **stop at report**. Nothing migrates without per-batch go + a verified
`pg_dump`.

## Live-audit RESULTS — read-only, 2026-06-09 (advisor-verified against the hazard map)

Ran (a)–(e) read-only against `ollyqiiwdvbpbngqgjqk` (broad MCP token, SELECT-only
conduct). **Point-in-time as of 2026-06-09 — re-confirm at release open.** Nothing applied.

| Check | Result |
|---|---|
| (a) applied list | clean prefix `20240101–20240132` (32 rows), **nothing > 132** |
| (b) inventory | all 11 >132 tables **absent** (incl. `rule_registry`/`rule_evaluation_log`/`rule_track_records`/`rule_branches`/`rule_conditions`); 7 ≤132 hazard targets **present**; `vendor_rules` pre-163 shape (`autonomy_tier`/`created_at`/`created_by` present, `bundle_type`/`legal_entity_id` absent) |
| (c) 163 | `count(*) vendor_rules` = **0** ⇒ dup-preflight + FK backfill + bundle_type NOT-NULL all **no-op** |
| (d) 156 | `count(*) bills` = **0** ⇒ `UPDATE bills` writes **zero rows** (`journal_entries`=0, `organizations`=2) |
| (e) served-code | prod runs **≤ `625c7df3`**; no runtime read of the dropped cols/type across that range |

**Synthesis:** clean ordered forward-apply **confirmed live**; **data blast radius ~nil**
(near-empty instance — AP/ledger tables at 0 rows, 2 orgs); **schema/behavioral exposure
unchanged** (133/138/158 still alter the live posting/payment/org paths for *future*
writes; prod's stale old code doesn't exercise the new AP paths). Every data-driven
apply-time hazard (163/156/138/139) is **empirically a no-op** against actual prod data.

**(e) is a bound argument with named dependencies** (not an exact-SHA pin): (1) the
upper-bound grep of `625c7df3` shows no runtime read of the dropped cols/type [first-hand
git read; relayed to the read-only advisor]; (2) the residual interval *below* the bound
is covered by "the rule/`autonomy_tier`-reading code is all post-`625c7df3`
(staging-only)." **Point-in-time on two axes:** the row counts, AND the prod-deploy state —
if the failing `main` pipeline (below) is fixed and a newer deploy goes READY before apply,
prod could advance toward/past `625c7df3` and **(e) must be re-run** against whatever's
then live.

**Material side-finding (beyond audit scope, worth independent attention):** prod's
**production pipeline is currently failing** — every recent `main` deploy in Vercel history
is `state: ERROR`, so `chounting.chou.ca` serves a **stale, older successful deploy**
(~`v0.1.0-mvp` era; the prod response carried a ~6.4-day cache age). Prod hasn't had a
successful deploy in the recent window. Relevant to (e) (it's *why* the served-code bound
is safe), but also just true on its own.

**Token:** the broad MCP OAuth (SELECT-only for this audit) to be revoked operator-side now —
the DB reads are done.

## Reconcile — proposed ordered-apply plan, 2026-06-09 (advisor-verified; read-only, applies nothing)

Re-ground (this session): history `2952d5d3`/`fcaf85d7`/`540a1f94` intact; `origin/main`
still `625c7df3` (served-code bound holds); endpoint `20240180`. Migrations apply in
**strict version order** (Supabase enforces) — "batches" are **operator checkpoints**
(pause / dump / **read-only verify**), not a reordering.

**⚠️ Boundary checks are read/introspection ONLY — never a write to the prod-shared DB.**
Use `pg_get_triggerdef` / `pg_proc` / `to_regclass` / `information_schema` /
`schema_migrations`. Any *functional* write-test (post/reject behavior) runs **only on a
local `db:reset` dry-run**, never on prod — because `133` makes `journal_entries`
append-only, so a "test post" would be a **permanent, un-removable** prod-ledger row.

| Batch | Migrations | Carries | Read-only boundary check |
|---|---|---|---|
| 1 | `133` | HAZARD | `pg_get_triggerdef`: the 3 triggers (immutability + period-range + line-org) exist with expected defs. Functional post/reject test → **local dry-run only** |
| 2 | `134–137` | additive | `pg_proc`/`to_regclass`: `write_journal_entry_atomic` + `create_source_document_with_audit` exist; `source_documents`/`_versions` created |
| 3 | `138–139` | HAZARDS | `information_schema`: new cols present + defaulted; `_v1_active` CHECKs exist; payment_purpose trigger def present |
| 4 | `140–155` | A/A*/C | doc-platform tables/RPCs/views exist (`to_regclass`); no ≤132 structural change |
| 5 | `156` | HAZARD | `vendor_credits` created; **`bills` rowcount unchanged** (backfill no-op on empty) — read, not write |
| 6 | `157–158` | HAZARD (158) | org-create trigger def present; `org_settings` rowcount = existing-org count (backfill); **no test org created** |
| 7 | `159–162` | A*/C | additive |
| 8 | `163` | HAZARD (sharpest) | **isolate.** introspect `vendor_rules`: `bundle_type`/`legal_entity_id` present, `autonomy_tier`/`created_*` gone; `autonomy_tier` type dropped; `rule_registry` created |
| 9 | `164–180` | A/A* | new tables/RPCs exist; `179` adds the org_settings storage cols (after which Track-A Step-4's one-row write is finally possible) |

**Main-compat (vs prod-served `≤625c7df3`) — additive-safe, holds *either way*:**
- New cols/tables/triggers: prod's old code doesn't read/write them → additive-safe.
- `write_journal_entry_atomic` (134/175): signature **byte-identical** 134→175 [disk,
  first-hand] (`source_external_id` rides inside `p_entry` JSONB via `NULLIF(…,'')` ⇒
  absent-key callers get NULL). **Whether prod calls it or not, the apply is safe:** if
  it doesn't → purely additive; if it does → prod is already calling an RPC **absent on
  the 132 DB**, so that path is already non-functional and the apply **fixes** it. *(That
  second branch implies prod may be more degraded than "frozen" — consistent with the
  failing-build finding.)*
- `163` drops: not read by prod at runtime (grep-clean) + empty table.
- `133` period-range trigger: enforces an invariant correct posting respects; low-risk (0 entries).

**The "0-rows ⇒ no-op" checks are a PRECONDITION, not hygiene.** Every hazard's safety
rests on the audit's counts (0 vendor_rules / 0 bills / 0 journal_entries / 2 orgs),
which are `[relayed]/STALE` from `2952d5d3`. **A fresh read-only DB re-read at apply-time
(token-gated) is the load-bearing gate** — if *anything* wrote to prod between audit and
apply (incl. fixing the build and prod taking traffic), the hazards stop being no-ops.
Re-ground, don't inherit, bites hardest here.

**Backup / rollback:** full `pg_dump` before batch 1 (sole restore point — Free tier, no
PITR) + a fresh dump before each hazard batch (1/3/5/6/8; cheap, data tiny). Forward-only
⇒ rollback = restore-the-dump + reset `schema_migrations` to `20240132`. **The restore is
itself a destructive overwrite of the prod-shared DB — its own deliberate operator action
with its own go, not an automatic safety net.**

**Gates (unchanged):** nothing applies without (a) this plan verified vs `fcaf85d7`+`2952d5d3`
[done], (b) the fresh live re-read [token-gated; NOT done], (c) a verified `pg_dump`, (d)
per-batch operator go. **This is a plan; it applies / links / pushes / migrates nothing.**

## Why this exists

Track A "Step 4" arrived framed as a one-row DATA write (point the staging org's
`org_settings` row at `sharepoint_drive`), explicitly "no migration, no schema
change." It **halted at the pre-write verification gate**: the target table
`org_settings` does not exist on the database the deploys actually read. The
substrate it belongs to was never migrated to the remote — so the "one-row write"
is really a **staging→main production schema release**. Full record:
`CURRENT_STATE.md` 2026-06-09 "Track A Step 4 HALTED" section + friction-journal
2026-06-09 "Track A Step 4 HALTED" entry.

## Established facts — point-in-time as of 2026-06-09 (re-confirm live at release)

- `[live]` Target DB = **`ollyqiiwdvbpbngqgjqk`** ("CHOUnting", FREE / NANO,
  ca-central-1). **Prod-shared:** staging (`apps/web/.env.staging`
  `NEXT_PUBLIC_SUPABASE_URL`) and production (`chounting.chou.ca` bundle) both read
  it. Corroborates the 2026-05-01 "single Supabase project … shared with staging"
  note.
- `[live]` Remote **last-applied migration = `20240132000000_add_recurring_journal_permissions`**.
  `org_settings` is **absent** (checked all schemas); of the document-platform / AP
  tables only **`vendor_rules` is present** — a later-era object present while the
  earlier `org_settings` is absent ⇒ the remote is **NOT a clean prefix at
  `20240132`** (a present object with no migration-history row would be a
  hand-applied out-of-band change; confirm at audit).
- `[disk]` Target chain = **`20240133`→`20240180`** (~47 migrations, the
  document-platform → Charter-B substrate). **Local-dev-only to date:** `db:migrate`
  is `supabase migration up --local`; every `db:*` script is local; CI
  (`ci.yml` + `verify-audit-coverage.yml`) has **no** `db push` / `link` /
  `SUPABASE_ACCESS_TOKEN` — its one migration-applying job targets an **ephemeral
  local** instance (`db:start` + `db:reset --local`). So nothing ever migrated the
  remote forward.
- `[disk]` **Dependency ladder (blind `db push` will collide):** later migrations
  ALTER/REPLACE objects earlier ones create — e.g. `20240175` is a
  `CREATE OR REPLACE` of `write_journal_entry_atomic` (which only exists from
  `20240134`); `20240178` does `ALTER TABLE source_documents DROP/ADD CONSTRAINT`
  (assumes `source_documents` + its `_v1_active` constraint already exist). They
  must apply in order; several will fail against a remote missing/out-of-order on a
  predecessor.
- `[live]` The `.mcp.json` pin **`rkriihsmxbuwzzbgqekb` is a wrong-DB trap** —
  neither staging nor prod, not even in the authorized Supabase org. A pinned MCP
  `project_ref` is **not** evidence of the deployment target's DB.
- `[handoff]` Prod (`chounting.chou.ca`) is **believed** to serve **`main`** (~468
  commits behind the substrate chain, Phase-6 era) — handoff-derived, **NOT verified
  this session**. This is precisely what the audit's **PROD-SERVED-CODE check (live)
  must establish** — treat it as the question the audit answers, not a fact. So
  **main-compatibility of the breaking alters is a live question**, not a disk one.

## Sequencing

1. **Track A Step 3** — parallel, anytime, independent of all of this. Per-site
   grant (`New-MgSitePermission` write for app `705a0eea-…` — confirm against
   `GRAPH_CLIENT_ID` first; app stays `Sites.Selected`; verify with
   `Get-MgSitePermission`). Closes Track A at Steps 1–3.
2. **The substrate release — THE gate** (everything downstream needs it). Its own
   session, its own internal order (below).
3. **OCR / Postmark / first forwarded email** — only after the schema lands. Stage-2
   OCR in staging (`MODAL_OCR_HMAC_SECRET` + `MODAL_OCR_SIDECAR_URL` + deployed
   sidecar — operator-confirm), Postmark webhook (username exactly `postmark`,
   pointed at the staging alias, **not** `chounting.chou.ca`), then the first
   forwarded email = the real end-to-end proof. Runbook:
   `docs/09_briefs/post-mvp/runbooks/mailbox-sharepoint-onboarding.md`.

## The release — internal order (the gated project)

1. **Disk-side classification map** (built **fresh** at release, read-only):
   `20240133`→`20240180`, creates-new-table vs alters-existing-object, with the
   dependency edges and the `vendor_rules` cluster called out.
2. **Live remote audit** (read-only, narrow-scoped token — see brief below) — runs
   in parallel; the two are the inputs.
3. **Reconcile** the two → a safe-migration plan (what to skip-mark / repair given
   the out-of-order remote; what order to apply).
4. **Prod-served-code + backward-compat check** (live; can't be answered from
   disk) — confirm what `main` actually serves and whether the breaking alters are
   compatible with it.
5. **Manual `pg_dump` backup** (Free tier ⇒ no PITR) — operator.
6. **Per-batch apply**, each batch with explicit operator go.
7. **Verify** → then the trivial Step-4 `org_settings` row write.

**Nothing is applied without per-batch operator go AND a verified `pg_dump` in
hand.**

## Parked: read-only live-audit brief (phase-1 of the release)

> Run this when the release opens. It is **AUDIT ONLY** — no writes, no schema
> changes, no `supabase db push`. It needs a **fresh, tighter-scoped** Supabase
> token (the broad account-level one used for the 2026-06-09 verification was
> revoked — correctly). Output is a reconciliation report for the operator's go
> decision, paired with the fresh disk-side classification map.

**Context (re-confirm live — point-in-time as of 2026-06-09):** `ollyqiiwdvbpbngqgjqk`
is prod-shared; last-applied observed = `20240132…`; `org_settings` absent,
`vendor_rules` present (out-of-order, not a clean prefix) **[SUPERSEDED — see the
Correction at top: `vendor_rules` is initial-schema @`20240101`, so its presence is
consistent with a clean `20240132` prefix, NOT out-of-order]**; target chain
`20240133`→`20240180` is a dependency ladder (`20240175` CREATE OR REPLACE of
`write_journal_entry_atomic` from `20240134`; `20240178` ALTERs `source_documents`
constraints); a blind push fails wherever a predecessor is missing or an object
already exists.

Produce (all read-only):

1. **APPLIED LIST** — read `supabase_migrations.schema_migrations` in full (not just
   the tail). List every applied version. Flag any entry > `20240132` and whether
   `vendor_rules`-era migrations appear there or NOT (a present object with no
   history row = hand-applied outside the migration system).
2. **PHYSICAL OBJECT INVENTORY** — for each migration `20240133`→`20240180`, check
   whether its target object actually exists (tables, RPCs/functions, enums, named
   CHECK constraints, views, triggers) via information_schema / pg_catalog. Produce
   a per-migration matrix: target object | exists? | has schema_migrations row? |
   divergence class (clean-absent / present-no-history / history-no-object /
   partial).
3. **PROD-SERVED-CODE CHECK** — confirm the commit `chounting.chou.ca` currently
   serves (Vercel deployment metadata) and what DB objects that code depends on.
   Specifically: does prod's served code call `write_journal_entry_atomic` (absent
   on a `20240132` DB) or reference document-platform tables? If yes, surface how
   prod is functioning against a DB that lacks them — do not assume; report what you
   find. This is the main-compatibility input.
4. **HAZARD CLASSIFICATION** for the eventual apply, two kinds: (a)
   behaviour-change-under-live-prod — migrations that ALTER objects prod's running
   code uses that DO exist on the remote (e.g. `20240133` journal-immutability
   triggers on `journal_entries`) — can affect the live app the moment they apply;
   (b) apply-failure — migrations depending on objects missing/out-of-order on the
   remote (the ladder breaks).
5. **REMEDIATION SHAPE** — propose (do not execute) how to reconcile migration-state
   before any forward apply: which versions to repair/skip-mark, what order, where a
   manual fix-up is needed. Pair with the disk-side classification map.

**Constraints:** read-only credential, narrowest scope that lists migrations +
introspects schema + reads Vercel metadata. No `db push` / `link` / apply. Report
findings; stop.

## Discipline guardrails

- **Re-ground first.** Every `[disk]`/`[live]` fact above is as-of-2026-06-09 and
  must be re-verified live when the release opens — the chain is still moving on
  `staging`.
- **Map built fresh, never pre-built** — same stale-authority reason.
- **Read-only until** per-batch operator go + a verified `pg_dump`.
- **This doc applies nothing.** It is a parked plan + brief.
