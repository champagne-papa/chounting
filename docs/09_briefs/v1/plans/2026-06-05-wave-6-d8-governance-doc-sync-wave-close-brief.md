# Wave 6 D8 Brief — Governance Doc-Sync Close + Wave Close

**Deliverable:** D8, the ninth and final Wave 6 deliverable — reconcile the
governance debt deferred across the wave, then close the wave (retrospective +
lock release + Phil's terminal push).

**Posture (carried in every surface):** 55 commits banked-local on `staging` at
`c42a402f` (D7 close); `origin/staging` at `e571ceb5` (Wave 5 close); session
lock `wave-6-ap-review` HELD; **no push** without Phil's explicit go at the
terminal ceremony; the lock release is itself a D8 deliverable. The five
pre-existing untracked paths are not D8's to disposition.

**Class:** doc-and-ceremony, governance-class throughout. Every reconciliation
edit gets line-by-line read-back. Zero source-code edits expected; zero
migrations; zero new INV registrations (reconcile-only).

---

## 1. Grounded surface (verified from disk at `c42a402f`, 2026-06-05)

### 1.1 `invariants.md` — the frozen counts and the narrative

All anchors live in `docs/02_specs/invariants.md`:

| Anchor | Line(s) | Current bytes | Target |
|---|---|---|---|
| Intro line | 3 | "The canonical index for the 25 invariants." | 28 |
| Snapshot bullets | 33–37 | "**22 distinct INV-IDs** documented … (**15 Layer 1a**, **7 Layer 2**, 0 Layer 1b)" ×2 directions | 28 (16 / 12 / 0) |
| "Symmetric difference: empty" | 38–40 | claims literal empty | see Fork D-2 |
| Per-addition notes | 42–90 | last note = INV-RULE-004 (→25, ADR-0027, 2026-05-30) | +3 notes (→26, →27, →28) |
| Prior reconcile notes | 92–104 | Ring 2B close (24→25) + hygiene pass (20→24) precedent | +1 D8 note |
| Verification command | 108–111 | forward `ledger_truth_model.md` / reverse `apps/web/src/ supabase/migrations/` | unchanged |
| "Expected output: empty" | 113 | claims literal empty | see Fork D-2 |
| Section heading | 115 | `## The 25 invariants` | 28 |
| Layer sub-counts | 117–118 | "(16 invariants), then Layer 2 (9 invariants)" | 16 stays; 9 → 12 |

Rows 26 (INV-WORKFLOW-002), 27 (INV-EVIDENCE-001), 28 (INV-WORKFLOW-001)
**already exist in the table** (lines 149–151) — registered atomically at
D2.1 T3 / D5 T3 / D6 T3 per the three-artifact precedent. Only the frozen
counts and the narrative lag. Live count confirmed: **28 = 16 Layer-1a +
12 Layer-2** (Layer-1a stays 16; Layer-2 goes 9 → 12).

The three new per-addition notes carry the house pattern (what's novel about
each): INV-WORKFLOW-002 — runtime/structural, Layer 2 9→10, total 25→26
(Wave 6 D2.1; D2.3 sweep as the eventual-consistency backstop, Class-1
retired 2026-06-04); INV-EVIDENCE-001 — Layer-1 UNIQUE + runtime/structural
persist-before-marking, Layer 2 10→11, total 26→27 (Wave 6 D5; ADR-0033
Amendment 2026-06-05); INV-WORKFLOW-001 — **build-time structural, a new
Layer-2 enforcement sub-type**, Layer 2 11→12, total 27→28 (Wave 6 D6;
ADR-0031 amendment; Q2 `query` carve-out named in the invariant statement;
closed a reverse-only reachability window open since Wave 4). Registration
SHAs are read from `git log` at edit time, not transcribed from this brief
(SHA-corollary).

### 1.2 `control_matrix.md` — the twin counts

All anchors live in `docs/06_audit/control_matrix.md`:

| Anchor | Line | Current bytes | Target |
|---|---|---|---|
| Intro line | 3 | "Audit-side evidence for the 24 invariants." | 28 |
| Section heading | 42 | `## The 25 invariants — audit evidence` | 28 |
| Order note | 50–51 | "Layer 1 first (16 invariants), then Layer 2 (9 invariants)" | 16 stays; 9 → 12 |
| Layer-1a header | 53 | "(16 invariants)" | **correct — no edit** |
| Stale 1a body line | 56 | "All 15 invariants below are Layer 1a" | 16 |
| Layer-2 header | 176 | "Layer 2 — Operational Truth (9 invariants)" | 12 |
| Bottom check | 354 | "Expected: 24 distinct INV-IDs in both directions, empty symmetric diff" | 28 + Fork D-2 framing |

Note the intro (line 3) is staler than the heading — it still says **24**:
the Ring 2B close (24→25) updated the heading but missed line 3. This is the
already-carried-forward `control_matrix.md:3` exception from the hygiene-arc
Condition-2 gate (friction-journal, "the gate surfaced only pre-existing
drift"); D8 retires it inside the 28-reconcile.

Matrix entries for the three Wave-6 INVs **already exist** (lines 241, 248,
255) — counts only.

### 1.3 The symmetric-diff — run live, captured, and NOT literally empty

Run at `c42a402f` (2026-06-05), exact command from `invariants.md:109-110` /
`control_matrix.md:350-351`:

```
forward (doc):  29 distinct INV-IDs
reverse (code): 31 distinct INV-IDs
diff:           1a2,4  > INV-AGENT-002  > INV-AP-001  > INV-AP-002
                5d7    < INV-CHECKPOINT-001
```

**The intersection is exactly the 28 registered invariants — both directions
reach all 28, including INV-WORKFLOW-001's forward side (closed at D6 T3,
confirmed still closed).** The four outliers:

| Token | Side | Status |
|---|---|---|
| INV-CHECKPOINT-001 | doc-only | By-design reserved (Phase-2 Layer-1b stub, ADR-0008; leaf at `ledger_truth_model.md:2671`) |
| INV-AGENT-002 | code-only | By-design reserved (ADR-0029; comment-grain citations in `proposalJustification.schema.ts`, Phase 8) |
| INV-AP-001 / INV-AP-002 | code-only | Phase-5 registration gap — enforced-but-unregistered (Layer-2 comments in `billService.ts` et al., entered at B5-2 `3cffe746`); severity question already named |

**This is a pre-existing condition, not Wave-6 drift.** Forensic re-run at the
Ring 2B close commit (`11633dc6`, the last claimed-clean reconcile at 25)
returns the **same four outliers**. All four are already documented as
carry-forward exceptions at the hygiene-arc Condition-2 gate
(friction-journal ~17969–17979: "two by-design reserved … one Phase-5
registration gap … plus a stale `control_matrix.md:3` count — all
PRE-EXISTING"). The charter's "must return empty at 28" prediction was
ungrounded against the literal command; disposition is Fork D-2 below.
D8's own edits cannot move the diff: neither `invariants.md` nor
`control_matrix.md` nor `glossary.md` is in either grep's scope.

### 1.4 The glossary — D-0033.7's sentence-swap is ALREADY on disk

ADR-0033 D-0033.7 deferred: the `glossary.md` "empty reserved directories at
V1" line "is reconciled at the build to 'populated at Wave 2 as a
read/assembly surface; enforcement remains INV-DOC-001, generalized at
Wave 6'."

**Disk state:** the Evidence-object entry (`glossary.md:148-163`) already
carries exactly that target wording — landed at the Wave-2 build commit
`0bb6c696` ("ADR-0033 Wave-2 Canonical Evidence Object — assemble-on-read
substrate"). The charter-named swap is realized; D8 records it rather than
re-performing it.

**What IS stale post-D5** is the entry's tail (`glossary.md:161-163`):

> "The `evidence_objects` anchor ships inert (no row-producer); enforcement
> remains INV-DOC-001, generalized at Wave 6."

D5 shipped the row-producer (the approve→post persist-before-marking seam)
and registered INV-EVIDENCE-001. The ADR-0033 Amendment 2026-06-05 explicitly
leaves this to D8 ("the `glossary.md` 'empty reserved directories'
reconciliation sentence inside D-0033.7 is **not** touched here — D8's, per
the Wave-6 build plan"), and the D5 close docket carries the same hand-off.
Disposition is Fork D-3 below.

### 1.5 The push-readiness gate (Condition 1/2/3, per CLAUDE.md)

1. **Test-suite health** — `pnpm test:full` (clean reset prepended) green at
   HEAD, or deviations documented with mechanism + fix shape + carry-forward.
2. **Doc-sync reconciled** — `invariants.md` ↔ `control_matrix.md` ↔
   `ledger_truth_model.md` ↔ shipped code consistent; reachability diff clean
   or flagged exceptions documented; `types.ts` current (no Wave-6-D8 schema
   delta ⇒ regen-verify only); ADRs and arc-affected governance docs
   reconciled.
3. **Governance closeout** — retrospective written; friction-journal updated
   with arc-scope entries; conventions earned by fire count codified or filed
   with provenance.

Pre-push sanity sequence (from CLAUDE.md): ahead-count, clean `git status`,
`pnpm agent:validate` (26/26 — now self-exercises the D6 teeth),
`pnpm test:full`, `pnpm typecheck`. `verify-audit-coverage` needs
`set -a && source apps/web/.env.local && set +a` in the same shell.

### 1.6 The retrospective inventory (from the eight close dockets)

**Codified mid-wave (already done, retro records):**

- Fixture-offline eval-suite teeth — **N=4** → `conventions/testing.md`
  (2026-06-03).
- Versioned-CHECK naming discipline — **N=4** → `conventions/migrations.md`
  + `.claude/rules/migrations.md` (2026-06-03).

**Ready to codify at retro (routes through `codify-convention`):**

- **`*TierA` additive-named-export — N=3 reached at D3 T5** (classifier eval →
  extractor eval → review rebuild). Expected destination
  `conventions/testing.md`. NOTE a cross-check is owed: the friction-journal
  banked this at N=2 (2026-06-03) before D3's third fire — the retro
  reconciles the count trail.

**Banked below threshold (retro records, no codification):**

- `agent/orchestrator/maintenance/` sub-pattern — N=1 (D2.3; operator
  acknowledgment GIVEN; Class-1 retired).
- Ratchet vs one-time-fire vs pure-characterization heuristic — N=1
  comparative (D1 vs D4 contrast).
- Registry-honesty periodic audit (producer entries are claims) — D6 §6
  candidate.

**Carry-forwards by deliverable (retro enumerates; none absorbed into D8):**
D1 fast-follow extraction fields + Tier-C accuracy harness; D2.1 atomicity
window + proposal persistence; D3 ×6 (incl. bundle-at-review, Tier-A
number-amount latent INV-MONEY-001, `review_case_detail` deferral); D4 ×5
(incl. D-1 divergence watch, resolved-account display); D5 ×7 (incl.
crash-class-X operator guidance, JE→bill non-atomicity, completeness-upgrade
OQ-6, `verify-audit-coverage` seeded-locked-period gap); D6 ×5 (incl. Q2
re-include trigger, branch-protection residual); D7 none new. Plus the
pre-Wave-6 inherited set (INV-AP-001/002 severity question, state-narrative
docs refresh, friction-journal lint-debt).

---

## 2. Design decisions and forks (the read-back decides the forks)

### D-1 — The 25→28 reconcile is one atomic governance commit across both files

All §1.1 + §1.2 edits land in a single commit (the frozen-snapshot classes
move together, per the Ring 2B close precedent "the heading + control_matrix
counts reconcile in dedicated doc-sync passes"). The commit body names the
three compounding registrations (D2.1/D5/D6) and the retired
`control_matrix.md:3` carry-forward. Line-by-line read-back before commit.

### D-2 — FORK: the reachability statement cannot truthfully claim literal "empty"

The live command returns four known outliers (§1.3) — and did so at every
claimed-clean reconcile back to Ring 2B at least. Options:

- **(a) Named-exception reconcile — RECOMMENDED.** Update the snapshot to 28
  both directions **at the registered-set grain**, and add a short
  named-exception note beside the command in both files: the raw output
  carries INV-CHECKPOINT-001 (doc-side, Phase-2 reserved), INV-AGENT-002
  (code-side, ADR-0029 reserved), INV-AP-001/002 (code-side, Phase-5
  registration gap, carry-forward). "Expected output" becomes "the four named
  exceptions and nothing else." Truthful, additive, auditor-runnable,
  scope-respecting. The INV-AP-001/002 severity question stays a retro
  carry-forward (already named at the hygiene arc).
- **(b) Register INV-AP-001/002 now.** Rejected — out of the ratified D8
  charter (ratified-contract-scope); would move 28→30 mid-reconcile and
  requires its own leaf/matrix/annotation pass.
- **(c) Keep claiming "empty."** Rejected — perpetuates a statement that has
  been literally false under the documented command since at least Phase 8.

### D-3 — FORK: glossary reconcile = record-the-realized-swap + fix the stale tail

- **(a) RECOMMENDED.** No re-edit of the already-realized D-0033.7 wording
  (on disk at `0bb6c696`). One additive edit to the tail
  (`glossary.md:161-163`): the anchor is no longer inert — the row-producer
  shipped at D5 (persist-before-marking, approve→post route) and enforcement
  is now registered INV-EVIDENCE-001 (Layer-1 UNIQUE + persist-before-marking;
  INV-DOC-001 stays the live bill-evidence gate). Commit body records that
  the charter-named swap was found realized at `0bb6c696` (verify-from-disk
  divergence, surfaced not absorbed).
- **(b) Treat item 3 as a no-op** (charter wording satisfied on disk).
  Rejected — leaves a glossary sentence that contradicts registered live
  enforcement, defeating the reconcile's purpose.

### D-4 — Branch protection (D6 §6.2): answered empirically, decision stays Phil's

Read-only API query (2026-06-05, `champagne-papa/chounting`): **`main` is
protected but requires NO status checks** (PR-review rule at
`required_approving_review_count: 0`; `enforce_admins` false; no
`required_status_checks` configured). **`staging` is unprotected** (404).
Therefore INV-WORKFLOW-001's CI teeth currently sit **advisory** on both
branches — a red `intent-producers` run does not block merge. The leaf's
hedged headline ("blocks merge only where branch protection requires the
check — operator-grain") already covers this exactly; no leaf edit required.
Whether to require the check is Phil's operator-grain decision — recorded as
a residual, not acted on in D8. D8 records the empirical answer in the D6
§6.2 slot (close report / retro).

### D-5 — Scope fences (sharp)

- **No source-code edits, no migrations, no schema/`types.ts` delta.** D8
  touches `docs/` (+ the retro + friction-journal) only.
- **No new INV registrations** (Fork D-2(b) rejected); no leaf edits in
  `ledger_truth_model.md` (the three leaves shipped at D2.1/D5/D6; D8 is
  counts + narrative + glossary + ceremony).
- **The five pre-existing untracked paths stay untouched.**
- **No push, no lock release** before the terminal ceremony; both are
  ceremony steps, Phil-gated.
- Adjacent discoveries (e.g., other stale counts found mid-edit) get
  carry-forward framing per ratified-contract-scope, not absorbed.

---

## 3. Coarse task map (decomposition follows after this brief clears)

1. **T1 — The 25→28 reconcile** (§1.1 + §1.2 edit sets, one commit, Fork D-2
   resolution applied to both "expected" lines + the snapshot). Includes the
   three per-addition notes + the D8 reconcile note.
2. **T2 — The glossary reconcile** (Fork D-3 resolution; one commit).
3. **T3 — Symmetric-diff capture** — re-run at the post-T1/T2 HEAD, record
   28/28-at-registered-grain + the named exceptions + the verifying commit in
   the close report (command output is unchanged by doc-only edits; the
   re-run proves it).
4. **T4 — UI-screenshot closeout** — orchestrator drafts the capture sequence
   (2–5 shots, per-shot verifications; D3 review/inbox UI is the wave's UI
   footprint) against fresh `pnpm db:reset:clean && pnpm db:seed:all`;
   **Phil captures**; orchestrator spot-checks. Gate blocks wave close.
5. **T5 — Wave retrospective** — §1.6 inventory; `*TierA` routes through
   `codify-convention`; friction-journal arc-scope entries; rides the
   three-condition gate (incl. `pnpm test:full` from clean reset +
   `pnpm agent:validate` + `pnpm typecheck`).
6. **T6 — Close ceremony** — push-readiness sanity sequence surfaced;
   advisor confirms gate green; **Phil pushes** (terminal); post-push
   **confirm the `intent-producers` CI job ran green** (D6 §6.1 — its first
   dynamic execution; `gh run list/view` evidence into the close record);
   lock release LAST.

Per-task read-back throughout; governance commits get line-by-line read-back;
nothing proceeds past a surface until cleared.

## 4. Impl-onset must-confirms (re-verify at T1 onset)

1. HEAD still `c42a402f`; ahead-count still 55; status clean modulo the five
   untracked paths.
2. The §1.1/§1.2 anchor bytes unchanged (Read-before-Edit on every multi-line
   anchor per the Z1 #11.a discipline).
3. `COORD_SESSION='wave-6-ap-review'` exported in the committing shell; git
   from repo root; root-relative pathspecs (the four-failures-this-wave
   hazard).
4. Registration SHAs for the three per-addition notes read live from
   `git log` before transcription.

## 5. Phil-inputs into D8 (open)

1. **Fork D-2 / D-3 dispositions** — advisor read-back on this brief.
2. **Branch-protection residual** (D-4): require `intent-producers` on
   `main`/`staging`, or leave advisory? Either way the leaf stands; the
   answer is recorded, the setting-change (if any) is Phil's act, outside D8.
3. **Screenshot captures** (T4) — Phil's hands, when D8 reaches the UI gate.
4. **The terminal push + lock release go-ahead** (T6).

---

## 6. Advisor read-back ruling (2026-06-05, relayed)

**Brief CLEARED to decomposition**, contingent on two scope additions
(confirmed incorporated at the decomposition read-back, before any edit
lands). Verbatim dispositions:

- **Verifications held** — count anchors, the 28 = 16 + 12 composition, the
  four-outlier forward/reverse split, and the D-3 glossary state (swap landed
  at `0bb6c696`, tail stale post-D5) all independently confirmed. The
  friction-journal prior-documentation citation taken on the brief's citation
  (mid-file past the advisor's read cap) — non-gating, since the disposition
  rests on the outliers' verified pre-Wave-6 provenance.
- **D-2 → (a) endorsed**, the named-exception reconcile. The charter's
  "empty at 28" prediction was optimistic; the grounding catch is the
  two-seat system doing its job. (b) and (c) rejections confirmed.
- **D-3 → (a) endorsed.** No re-edit of the realized swap; one additive tail
  fix; commit body records the swap found realized at `0bb6c696`.
- **D-4 → recorded as correct** (advisor on backstop — cannot query the API
  from that seat). `main` protected with no required status checks,
  `staging` unprotected ⇒ INV-WORKFLOW-001 CI teeth advisory on both; the
  leaf's operator-grain hedge covers exactly this. Setting-flip stays Phil's,
  outside D8.
- **Ledger Summary confirmed out of scope** — "The 20 Phase 0-1.1 + Arc A
  Invariants" is a scoped historical summary (enumerates that era's 14
  Layer-1a invariants and says so), not a live count.
- **Scope addition 1 (the advisor's flag):** the glossary **Bidirectional
  reachability** entry (`glossary.md:77-82`) — "As of commit `65bcfe0`:
  17/17 with empty symmetric diff" — is a fourth stale snapshot site: a third
  stale count (staler than both files), repeats the "empty" claim D-2 just
  established is false, and is internally inconsistent (attributes 17/17 to
  the same `65bcfe0` that `invariants.md` attributes 22 to). Not an adjacent
  discovery — the same reconcile target in a fourth location, in a file T2
  already opens. **Folds into T2.**
- **Scope addition 2 (process):** before T1/T2, run a completeness sweep
  across `docs/` for the count shapes, enumerating every snapshot site, so
  the reconcile is provably complete rather than complete-by-inspection.
- D-1, D-5, and the T1–T6 map otherwise sound, including T6's ordering
  (advisor's last act = confirming the three-condition gate green from disk
  pre-push; then post-push CI-job confirmation; lock release last).

## 7. Completeness sweep (scope addition 2 — run 2026-06-05 at `c42a402f`)

Method: two grep families — reachability shapes
(`distinct INV|symmetric diff|symmetric difference|N/N with empty`) and
count shapes (`the N invariants|(N invariants)`) — over the live doc
surfaces (`docs/`, `CLAUDE.md`, `AGENTS.md`, `README.md`, `.claude/rules/`,
`.claude/skills/`), excluding the historical-record classes (briefs,
friction-journal, retrospectives, audits, round-2). Every hit classified:

**Live snapshot sites — reconcile targets (6 total):**

| # | Site | Current bytes | Status |
|---|---|---|---|
| 1 | `invariants.md` (§1.1 anchor set) | 25 / 22 / 16+9 / "empty" | charter |
| 2 | `control_matrix.md` (§1.2 anchor set) | 24 / 25 / 16+9 / "24 … empty" | charter |
| 3 | `glossary.md:148-163` Evidence-object tail | "ships inert (no row-producer)" | charter (D-3) |
| 4 | `glossary.md:77-82` Bidirectional reachability | "17/17 with empty symmetric diff" + pre-monorepo `src/` path | **ruled in** (advisor flag → T2) |
| 5 | `CLAUDE.md:14` tier-1 navigation | "`ledger_truth_model.md` — the 24 invariants." | **NEW — fold-in candidate, pending decomposition read-back** |
| 6 | `docs/03_architecture/authority-gradient.md:17` | "`ledger_truth_model.md` — the 20 invariants with…" | **NEW — fold-in candidate, pending decomposition read-back** |

Recommendation on #5/#6: fold into T2 — identical class to the ruled-in #4
(a live navigation-pointer count contradicting the freshly-synced docs;
`CLAUDE.md` is loaded every session). Notably,
`conventions/ratified-contract-scope.md` records its own origin as exactly
this shape — a same-file count straggler folded in at the hygiene arc.

**Historical / scoped — NO edit (provenance-preserving):**

| Site | Why no edit |
|---|---|
| `ledger_truth_model.md:5733/5763` ("14"/"6 invariants") | inside the scoped historical Summary the advisor ruled out of scope |
| ADR-0020:210 ("the 20 invariants") | ADR body — frozen provenance; amendments are additive only |
| ADR-0016:2085 ("20 → 21") | historical amendment narrative |
| `conventions/ratified-contract-scope.md:62` | evidence-basis citation of a past straggler (describes history) |
| `ledger_truth_model.md:2641` | descriptive INV-WORKFLOW-001 leaf text, no count |
| `glossary.md:807-813` push-readiness entry | describes the gate; "flagged exceptions documented" already accommodates D-2(a) |

Sweep side-finding folded into the T1 edit set: the `invariants.md:36`
snapshot bullet still carries the pre-monorepo `src/` path (the hygiene pass
corrected the command at :110 but not the bullet); the bullet rewrite fixes
it. Same fix inside site #4's entry.

---

*Brief drafted 2026-06-05 at `c42a402f`, grounded from disk per §1. Read-back
cleared per §6 (D-2(a), D-3(a), D-4 as-recorded) with two scope additions;
completeness sweep per §7. Decomposition follows as §8 — surfaced separately
and HELD for its own read-back before any edit lands.*
