# ADR-0032 — Canonical Autonomy Gate Seam (recording at V1) — Design Spec

**Status:** DRAFT · 2026-06-01 · **read-back CLEARED** (CTO verify-against-disk; OQ direction set, §8.1) ·
pre-ratification design spec (lifecycle stage 1 of 3: `specs/` → `ratification-packages/` → ratified
ADR in `docs/07_governance/adr/`).
**Reserves:** ADR-0032 (V1 Governance Plan, `docs/09_briefs/v1/plans/2026-05-31-v1-governance-plan.md`
§4 Wave 3 / §6 reservation R1; charter table line 107; R1 detail lines 166–168; Wave-3 row
lines 148–150).
**Anchored at:** HEAD `a2a0b2dc` (branch `staging`, level with `origin/staging`).
**Posture:** the Canonical Autonomy Gate Seam is the **single point on the live ingest commit path
where the autonomy gate's disposition is recorded for each autonomous commit attempt** — a **live
recording producer at V1** that **records and then parks unconditionally** (Invariant 5; no
autonomous commit at V1). The seam sits at the already-existing auto-commit *decision branch* in
`ingestDocument` (not at the `journalEntryService.post` chokepoint, which only human posts reach at
V1). Recording → deciding is a config flip at this same seam (V2 Track 1.1 governed auto-commit).
Reserves and shapes; authors no ADR body, ships no migration, registers no invariant, writes
nothing live. Six structural forks were settled by the CTO at spec-onset (§2–§5, recorded inline);
residual shape choices are carried as open questions (§8).

> **What stays OPEN here.** The exact column set of the reserved `autonomy_gate_log` record, the
> attempt-grain key (per-branch-invocation vs. per-bundle-child), and the config-flip flag shape are
> §8 OQs, decided at the first migration / build. The macro-spine — seam **location** (the decision
> branch, Fork 1=A), **V1 posture** (live recording producer, Fork 2), **record shape** (a net-new
> attempt-grain log, not `rule_evaluation_log` reuse, Fork 3), the **recording-not-deciding
> boundary** (Fork 4 principle), **register-on-enforcement** for `INV-AUTONOMY-GATE-001` (Fork 5),
> and **org-scoping of the live writer** (Fork 6) — is settled and recorded as closed.

---

## 0. What this ADR does (and does not do)

- **Does:** reserve the **single live-path seam** at the two ledger-committing branches of the
  `ingestDocument` Stage-7 commit composite (`proposed_entry_card`, `ingestDocument.ts:485`;
  `proposed_mutation_bundle`, `ingestDocument.ts:521`) where the autonomy gate's disposition is
  **computed and recorded per autonomous commit attempt**, after which the attempt **parks
  unconditionally** (`status:'parked_unposted'`, `ingestDocument.ts:496–501` / `526–531`). Reserve
  a **net-new, attempt-grain** record (`autonomy_gate_log` — one row per autonomous commit attempt,
  holding the gate's would-be `ActionType`/`Disposition` plus the realized outcome). Name
  **`INV-AUTONOMY-GATE-001`** over this seam. Establish the **recording-not-deciding** boundary as
  the load-bearing V1 control, and the **recording → deciding config flip** at this same seam as the
  post-V1 path (V2 Track 1.1).
- **Does NOT:** grant the gate any authority to **block or allow** a commit at V1 (Invariant 5 — the
  park is unconditional and is **not** a function of the recorded disposition; any "the gate decides"
  framing is out of scope and flagged); place the seam at the `journalEntryService.post` /
  `write_journal_entry_atomic` chokepoint (`journalEntryService.ts:179`) — that records human posts,
  not autonomous attempts (Fork 1=B, rejected); reuse or re-enable the **shadow** seam
  (`shadowRuleEvaluation.ts:57`, default-OFF diagnostic) or its flag (kept distinct, §2.4); reuse
  `rule_evaluation_log` as the record (wrong grain + conceptually distinct artifact, §2.3); **register**
  any invariant (recording ≠ enforcing ⇒ ADR-0021 register-on-enforcement ⇒ `INV-AUTONOMY-GATE-001`
  stays reserved until the gate gains commit authority post-V1, §6); author the ADR body; ship a
  migration; write anything live.

---

## 1. Context — the live commit path, the shadow seam, and what records gate dispositions today

The ingest pipeline's Stage-7 commit composite (`ingestDocument.ts:456`) branches on
`ProposalResult.kind` (3-value union, `ingestDocument.ts:18`):

| Branch | Site | Ledger? | V1 behavior on disk |
|---|---|---|---|
| `proposed_entry_card` | `ingestDocument.ts:485` | **yes** (`billService.post` / `paymentService.record`) | parks → `status:'parked_unposted'`, `proposal_id:null` (`:496–501`) |
| `proposed_mutation_bundle` | `ingestDocument.ts:521` | **yes** (born-paid bill; per-child `withInvariants`) | parks → `status:'parked_unposted'` (`:526–531`) |
| `proposed_attachment_card` | `ingestDocument.ts:504` | **no** (non-ledger, ADR-0011 §11) | returns `status:'committed'` (`:513–518`) — **not a seam** |

The two **ledger-committing** branches are the autonomous commit path. The ungoverned auto-post they
once performed was **disabled at Wave -1** (the A-now bleed-stop, ADR-0007 §Tier 2 Q78 V1-re-scoping,
commit `de607fdb`): `commitProposedEntryCard` / `commitProposedMutationBundle` are **preserved but
not called** (`ingestDocument.ts:552` / `:600`), matched proposals **park**, and the branch's own
comment names the config flip — *"Governed auto-commit returns per-rule post-V1 … which re-wires this
branch back to `commitProposedEntryCard`"* (`ingestDocument.ts:493–495`). The auth mechanism (Q78
Option A + Path X: `withInvariants` admits + adapts the system actor, `withInvariants.ts:68`) stays
intact; only its **exercise** is disabled (`ingestDocument.ts:458–468`).

Immediately above the commit composite sits the **shadow** seam (`ingestDocument.ts:445`,
`shadowRuleEvaluation.ts:57`): a Ring-2B diagnostic that evaluates rules and records to
`rule_evaluation_log`, positioned *"BEFORE the live auto-commit below so it cannot influence it"*
(`ingestDocument.ts:443`). It is **deliberately powerless forever** — default-OFF
(`RING2B_SHADOW_EVAL`, `shadowRuleEvaluation.ts:49`), fail-safe, `Promise<void>` with its result
discarded. Three orthogonal mechanisms isolate it from the commit.

**The gap this wave fills.** The autonomy gate (`gate.ts:36`, `gate(...): ActionType`) composes
rule-match + caps + limits + track-record into an `effective_action`/`Disposition`. But **in
production today nothing records the gate's disposition for an autonomous commit attempt**: the
shadow seam is OFF, and auto-commit is disabled, so the gate never runs on the live path. ADR-0032
makes the gate's disposition a **live, always-on, attempt-grain production record** at the decision
branch — without granting it any commit authority at V1.

**The spine tension (verified against code at HEAD `a2a0b2dc`).** The charter says *"gate records a
disposition on the LIVE commit path at a SINGLE seam"* (charter `:148–150`), but Invariant 5
(charter `:54–60`) says **no autonomous commit happens at V1** — proposals park, and the
`journalEntryService.post` chokepoint is reached only by **human** posts. The only placement
consistent with *live path* **and** *one result per autonomous attempt* **and** Invariant 5 is the
**decision branch itself** (the parked_unposted site), where the gate's would-be disposition is
recorded and the attempt parks. This is confirmed in code, not just headers (the shadow call at
`:445` sits before the decision branch at `:485`/`:521`).

---

## 2. Decision — the seam, the boundary, the record, distinct from shadow, the flip

### 2.1 Seam location — the decision branch (Fork 1 = A, CTO-settled)

The single seam is the **Stage-7 commit-composite decision** at the two ledger-committing branches
(`ingestDocument.ts:485` and `:521`). The build wires, at each branch, in order: **invoke the gate**
on the matched proposal → **record** the attempt result (§2.3) → **park** (`status:'parked_unposted'`,
unchanged at V1). The `proposed_attachment_card` branch (`:504`) is non-ledger and is **not** a
recording site.

Rejected: **Fork 1 = B** (the seam at `journalEntryService.post` / `write_journal_entry_atomic`,
`journalEntryService.ts:179`). At V1 autonomous traffic parks **before** the chokepoint; only human
posts reach it. A chokepoint seam would record human posts as "attempts" (false grain) and record
nothing autonomous at V1. The config flip also re-wires the **decision branch**
(`ingestDocument.ts:493–495`), not the chokepoint — so the decision branch is where recording and
deciding share one seam.

### 2.2 The recording-not-deciding boundary (Fork 4 principle, CTO-settled — load-bearing)

At V1 the gate **computes and records** a disposition; the **park is unconditional and is NOT a
function of that disposition**. The recorded `gate_disposition` (what the gate would do) and the
`realized_outcome` (what actually happened) are **distinct fields**, and at V1 `realized_outcome` is
**always `parked`** regardless of `gate_disposition`. This is the disk-checkable evidence of
recording-not-deciding: an auditor (or the reviewer) can confirm that no V1 row has a
`realized_outcome` that varies with `gate_disposition`. Invariant 5 holds in code by construction:
the branch returns `parked_unposted` on every path. Any design in which the disposition gates
park-vs-commit at V1 is **out of scope** and must be rejected at review.

### 2.3 The record — a net-new attempt-grain `autonomy_gate_log` (Fork 3 = new, CTO-settled)

The seam records to a **net-new, reserved** append-only table (working name `autonomy_gate_log`),
**one row per autonomous commit attempt**. Reserved shape (exact columns pinned at the first
migration, OQ-1): a stable `id`; `org_id`; an attempt key (`trace_id` + `source_document_id`); the
seam branch (`proposed_entry_card` | `proposed_mutation_bundle`); the gate's `effective_action`
(`ActionType`) and `gate_disposition` (`Disposition`); the `realized_outcome` (`parked` at V1;
follows disposition post-flip); `created_at`. Append-only on the user path (RLS `USING(false)` for
UPDATE/DELETE, no user INSERT), append-only on the service path by single-writer discipline — the
`rule_evaluation_log` precedent (migration `20240164000000`).

**Why net-new rather than reuse `rule_evaluation_log`** (decided on conceptual/grain grounds,
independent of substrate cost):

1. **Grain mismatch.** R1 wants **one row per autonomous attempt**; `rule_evaluation_log` is
   **row-per-rule-evaluation** (N rows per proposal, winner-attributed). "One result per attempt"
   does not map cleanly onto a rule-grain log.
2. **Distinct artifact.** A *rule-evaluation* log and an *autonomy-gate* log are conceptually
   different records — the same "distinct logs, one `trace_id`, none subsuming another" discipline
   the charter applied across Waves 1–2 (workflow log vs. audit log vs. rule-eval log).
3. **Clean invariant home.** A dedicated table gives `INV-AUTONOMY-GATE-001` an unambiguous subject
   (§6), rather than overloading INV-RULE-001's table.

> Corroborating (grounded in the Wave-3 grounding pass; **not** load-bearing for the New decision,
> and not independently re-verified this turn): `rule_evaluation_log`'s sole writer is
> `ruleEvaluationService.recordEvaluation` (named SOLE append site, INV-RULE-003), so a second seam
> writing directly would break single-writer discipline. This only matters if the reviewer leans
> toward reuse — in which case confirm the row-per-rule grain and the INV-RULE-003 sole-writer claim
> before drafting the ratification package.

### 2.4 Distinct from the shadow seam (charter requirement, CTO-confirmed)

R1's seam is a **separate call site** at the two ledger branches, **not** a re-enabling of the
shadow seam and **not** sharing its flag. The distinction is **architectural position + trajectory,
not behavior**:

| | Shadow seam (`shadowRuleEvaluation.ts`) | R1 autonomy-gate seam (this spec) |
|---|---|---|
| Position | **before** the decision branch (`:445`) | **at** the decision branch (`:485` / `:521`) |
| Default | **OFF** (`RING2B_SHADOW_EVAL`), diagnostic | **on** in production (recording at V1) |
| Grain / target | rule-grain → `rule_evaluation_log` | attempt-grain → `autonomy_gate_log` |
| Trajectory | powerless forever (cannot influence commit) | positioned so a config flip grants commit authority post-V1 |

No double-recording: the two write to **different tables at different grains**. The shadow seam may
continue as the broader, toggleable rule-grain diagnostic; R1 is the always-on attempt-grain
production record at the decision branch.

### 2.5 The recording → deciding config flip (Fork 4 shape — principle settled, flag = OQ)

For the flip to be **config, not code**, the seam computes the disposition **identically** in both
modes; only the **act-on-it** step is gated. V1: `compute → record → park` (unconditional). Post-V1
(V2 Track 1.1): `compute → record → act` (disposition drives park-vs-commit, re-wiring to
`commitProposedEntryCard` / `commitProposedMutationBundle`, the preserved fns at `:552` / `:600`).
The exact flag shape (per-rule rung gate vs. a global flag vs. config row) is **OQ-3**.

---

## 3. Code home & layer placement

The gate already lives at `apps/web/src/agent/policies/agent-ladder/gate.ts` and the capping table
at `apps/web/src/shared/rules/capping.ts` (both per ADR-0020 / ADR-0030). The **seam wiring** is an
orchestrator concern (it lives in `ingestDocument` at the Stage-7 composite). The **recording
writer** is a **service-layer** concern (a single append site, the `rule_evaluation_log` /
`ruleEvaluationService` precedent), under `services/` — **not** agent-layer (services↛agent import
boundary, ADR-0020; `agent-first-import-boundaries` ESLint). Pure disposition/outcome helpers (e.g.
`dispositionForAction`, `shared/rules/disposition.ts`) are reused as-is. Exact module layout (a new
`services/autonomy/` home vs. extending an existing rules service) is deferred to the build
(ADR-0020 item-6 opportunistic migration), as in Waves 1–2 — **OQ-4**.

---

## 4. Safety — org-scoping of the live writer (Fork 6, in scope now)

Because Fork 2 ships a **live recording producer** at V1, the writer's tenant-isolation is designed
**now**, not deferred. The commit path uses the RLS-bypassing `adminClient`
(`journalEntryService.ts:101`, `db/adminClient.ts`), so RLS is **not** the write-path guard; the
service layer is. Binding constraints for the build:

1. **`org_id` is derived from the org-verified upstream row, never a caller-supplied id.** The
   attempt's `org_id` comes from the ingest `input.org_id` / the `document_case` row already
   org-verified upstream in the pipeline (and consistent with the `withInvariants` system-actor
   org-consistency check, `withInvariants.ts:73–81`) — not from any raw caller input. This is the
   ADR-0033 IDOR lesson made binding (commit `a2a0b2dc`, "org-scope all evidence-object facets —
   close cross-tenant IDOR"): every record derives from org-verified rows.
2. **Read surfaces ship `security_invoker = true`.** Any future view over `autonomy_gate_log` carries
   `WITH (security_invoker = true)` so it genuinely inherits the table's RLS for the querying user —
   the `rule_evaluation_30d_view` precedent (migration `20240164000000`; closes the
   `document_cards_view` owner-rights footgun).
3. **Append-only.** User-path RLS denies UPDATE/DELETE (`USING(false)`) with no user-path INSERT
   policy; SELECT via `user_has_org_access(org_id)`. Service-path append-only is single-writer
   discipline (the documented `rule_evaluation_log` shape; ADR-0024 specifies RLS-only, no triggers).

The reviewer should treat the org-scoping derivation as a **commit precondition** for the eventual
build, per the IDOR carry-forward.

---

## 5. Sequencing & V1 posture (Fork 2 = live recording producer, CTO-leaning; scope call recorded)

**This spec authors no migration and writes nothing live.** The **build** (ratification package)
ships the live recording producer: the reserved `autonomy_gate_log` table, the seam wiring at
`ingestDocument.ts:485`/`:521`, and the service-layer writer with the §4 org-scoping.

**Posture choice, recorded honestly.** R1's framing — *"records … so recording → deciding is a config
flip"* — only holds if recording is **live at V1**; if the seam shipped **inert** (reserved-only,
like Waves 1–2), the flip would degrade from a config change to a code/build step. That is the
principled reading of R1, and it is the recorded direction: **live recording producer**, with §4
designing the safety. The counterweight is explicit: this is the **first live producer of the V1
sequence** — it writes records in production via the RLS-bypassing `adminClient`, more scope and more
risk than the inert Wave-1/Wave-2 substrate reservations. **Documented fallback:** the reviewer may
elect inert-reserve at read-back (a one-line posture downgrade), in which case the spec must state
plainly that the config-flip framing weakens to a small build. Either way, no commit until the
read-back clears.

Wave-6 interaction: parked attempts route `received → needs_review` for human approve→post under the
human's identity (Invariant 5, charter `:54–60`); `autonomy_gate_log` is the recording substrate that
the V2 governed-auto-commit eval harness reads.

---

## 6. Reserved invariant IDs (named; none registered)

`INV-AUTONOMY-GATE-001` is **named, registered by no one** at Wave 3. It is reserved-unregistered in
the charter (`:117–120`) and confirmed absent from `docs/02_specs/invariants.md` and
`docs/02_specs/ledger_truth_model.md` at HEAD. **Recording ≠ enforcing** ⇒ ADR-0021
register-on-enforcement ⇒ the invariant registers only when the gate **gains commit authority**
(post-V1 deciding), exactly the ADR-0033 precedent (*"assembling ≠ enforcing ⇒ `INV-EVIDENCE-001`
stays reserved"*) and the ADR-0028 precedent (`INV-WORKFLOW-002/003/004` reserved though the
substrate landed). Its eventual predicate (recorded for the body, OQ-5): *the autonomy gate records
exactly one disposition per autonomous commit attempt at the single canonical seam, and at V1 that
record never decides the commit.*

---

## 7. Consequences

- **Positive:** the gate's disposition becomes a live, auditable, attempt-grain record on the real
  ingest path for the first time; recording → deciding is a genuine config flip at one seam (no
  re-architecture post-V1); the seam is provably distinct from the powerless shadow seam; Invariant 5
  is enforced by construction (unconditional park) and is disk-checkable (`realized_outcome` never
  varies with `gate_disposition` at V1).
- **Live-producer cost / risk:** Wave 3 ships **real code that writes in production** — the first V1
  wave to do so — via the RLS-bypassing `adminClient`. The mitigation is §4 (org_id derived from
  org-verified rows; `security_invoker` reads; append-only) treated as a commit precondition.
- **Carried risk:** the seam must never let `gate_disposition` gate park-vs-commit at V1 (the
  recording-vs-deciding line); the review must verify the unconditional park survives in code.
- **Doc surface:** adds the ADR; reserves `autonomy_gate_log`; names `INV-AUTONOMY-GATE-001` in prose.
  No invariant-doc registration at Wave 3 (nothing enforces). Glossary may gain an "autonomy gate
  seam" line at the build.

---

## 8. Open questions for the ADR body / reviewer

- **OQ-1 — `autonomy_gate_log` column set + attempt key.** The §2.3 reserved shape (`id`, `org_id`,
  `trace_id`, `source_document_id`, branch kind, `effective_action`, `gate_disposition`,
  `realized_outcome`, `created_*`) vs. additions (e.g. a `proposal`/attempt id, the gate's
  `evaluation_trace`). Recommendation: the §2.3 shape; pin at the first migration.
- **OQ-2 — bundle grain.** For `proposed_mutation_bundle` (born-paid, multiple child mutations): one
  row per **bundle attempt** (recommended — matches "one result per autonomous attempt") vs. one row
  per **child mutation**. Decide at the first migration.
- **OQ-3 — config-flip flag shape.** Per-rule rung gate (rung + confidence + eval, per the in-branch
  comment `:493–495`) vs. a global flag vs. a config row. The §2.5 principle (compute identically,
  gate only the act step) holds regardless; the flag shape is a build detail.
- **OQ-4 — `services/autonomy/` module layout** — a new service home vs. extending an existing rules
  service; deferred to the build (ADR-0020 item-6), as in Waves 1–2.
- **OQ-5 — `INV-AUTONOMY-GATE-001` wording** for the eventual (post-V1) registration predicate —
  named now, registered when the gate gains commit authority.
- **OQ-6 — V1 posture confirmation (Fork 2).** Confirm **live recording producer** (recorded
  direction) vs. **inert-reserve** fallback (§5). If inert, the spec restates the config-flip framing
  as a small build rather than a config flip.
- **OQ-7 — reuse-path verification (only if Fork 3 is reopened).** If the reviewer leans toward
  reusing `rule_evaluation_log`, independently verify the row-per-rule grain and the INV-RULE-003
  sole-writer claim (§2.3 corroborating note) before drafting.

### 8.1 Read-back resolutions (CTO verify-against-disk, 2026-06-01)

Read-back **cleared** — the three load-bearing items verified against disk: seam anchors at both
ledger branches (`:485` `proposed_entry_card`; `:521` `proposed_mutation_bundle`, the `commitProposed*`
fns JSDoc-marked *"Intentionally unreferenced during the Wave -1 bleed-stop"*); recording-not-deciding
(both branches return `parked_unposted` **unconditionally** — no disposition check gates the return);
§4 org-scoping (record `org_id` derives from `ctx.org_id = input.org_id` / the `document_case`,
structurally distinct from the ADR-0033 caller-supplied-`subject_id` IDOR). OQ direction:

- **OQ-1** — endorse the §2.3 shape; keep it **lean**: do **not** absorb the gate's `evaluation_trace`
  (that is `rule_evaluation_log` / Logic-Receipt / ADR-0035 territory). The attempt-grain record holds
  the gate's output (`effective_action`/`gate_disposition`) + `realized_outcome`, referenced to the
  trace (reference-don't-subsume, ADR-0033 discipline).
- **OQ-2** — **one row per bundle attempt**, not per child (the born-paid bundle commits atomically;
  attempt-grain matches "one result per autonomous attempt").
- **OQ-3** — defer to build; lean **per-rule rung gate** (autonomy ladder is rule-attached, ADR-0029;
  in-branch "rung + confidence + eval", `:493–495`). The §2.5 principle holds regardless.
- **OQ-4** — defer to build (ADR-0020 item-6 opportunistic migration), as Waves 1–2.
- **OQ-5** — defer the registration predicate to post-V1; the §6 draft suffices for naming now.
- **OQ-6 (posture — the consequential call)** — **CONFIRMED: live recording producer.** R1's
  config-flip framing requires recording live at V1; the scope/risk is consciously accepted — this is
  the first V1 wave to write in production via the RLS-bypassing `adminClient`, mitigated by §4 and
  **re-gated at the build read-back** (the spec posture commits to *designing* live; the production
  write lands at the package/migration, separately verified). Inert-reserve (§5) remains the
  documented fallback but is **not** taken.
- **OQ-7** — **dormant**; Fork 3 stays = new. Reopen only on a reuse lean, then verify the
  row-per-rule grain + INV-RULE-003 sole-writer claim first.

**Build-readiness note (not a spec blocker).** Invoking the gate at `:485`/`:521` requires its inputs
(`matchResult`, the `rule_registry` row, `limitContext`) reachable at the branch. The shadow seam
self-contains its evaluation (`shadowEvaluateRules` takes `proposalKind`/`vendorId`/ids and evaluates
internally); the live seam can do likewise. Confirm at the package/build that the seam **derives** the
gate's inputs at the branches rather than assuming they are already threaded there.

---

## 9. Lifecycle next steps (not this spec)

1. CTO read-back of this design spec (verify-against-disk) → confirm the seam anchor lines
   (`ingestDocument.ts:485`/`521`), the recording-not-deciding boundary, the §4 org-scoping, and
   resolve OQ-1..OQ-7 direction.
2. **Ratification package** under `docs/09_briefs/v1/ratification-packages/` enacting ADR-0032 (the
   ADR body; the first migration for `autonomy_gate_log`; the seam wiring at the two branches; the
   service-layer writer with §4 org-scoping; the `security_invoker` read surface if any).
3. Ratified **ADR-0032** lands in `docs/07_governance/adr/`.
4. Design spec preserved as historical context (per ADR README §"Pre-ratification design specs").

This spec **reserves and shapes**; it authors no ADR body, ships no migration, registers no
invariant, and writes nothing live (the gate gains **no** commit authority at V1 — it records, and
the attempt parks). No commit until the read-back clears.
