# Wave 6 D5 — Close Report

**Status:** DRAFT — surfaced for advisor read-back (T5, the final D5
surface).
**Refs:** brief `eeb9a9ed` (LOCKED), decomposition `f9f6dcfd` (LOCKED),
T1 `d5041449`, T2 `077be5cb`, T3 `9510173d`, T4 `2e3f9d9b`. Grounding
HEAD: `2e3f9d9b` (45 banked-local; origin `e571ceb5` untouched).
**Charter discharged:** "Evidence-object persistence + subject↔trace
tightening (`evidenceObjectService`)." Registers: INV-EVIDENCE-001
(row 27). Amends: ADR-0033 D-0033.7 (realization block) + frontmatter.
IDOR surface: yes — the persist-grain subject-ownership guard.

---

## 1. What shipped (five commits)

- **T1** (`d5041449`): migration `20240177` — `evidence_objects_subject_unique`
  UNIQUE, redundant index drop, status CHECK `v1_active → wave_6_active`
  (additive strict superset); 5 constraint tests; types regen no-op.
- **T2** (`077be5cb`): `evidenceObjectService.persist` (org-scoped
  subject-ownership guard → assemble → idempotent upsert) + the
  approve→post persist-before-marking seam (the `INV-EVIDENCE-001`
  annotation site) + `POSTING_RECOVERY_UNREPAIRABLE` (409,
  non-retryable) + the Option-A crash-class-X disposition (D3 fixture
  amended additively; new crash-X test); 8-test suite.
- **T3** (`9510173d`): INV-EVIDENCE-001 registered — `invariants.md`
  row 27 + `control_matrix.md` entry + `ledger_truth_model.md` leaf;
  residuals named; the sole-commit-path enumeration in the commit body.
- **T4** (`2e3f9d9b`): ADR-0033 `## Amendment 2026-06-05` (four
  decision items) + frontmatter `invariants: ["INV-EVIDENCE-001"]` +
  the regenerated `adr/README.md` grouping.
- **T5**: this report.

## 2. Gates (run at close HEAD, against a clean-reset DB)

- `pnpm agent:validate`: 26/26. `pnpm typecheck`: clean.
- Five-suite sweep: **35/35** — `evidenceObjectPersistence` 8/8 (the
  teeth test; crash-class-X; both persist-grain IDOR negatives;
  two-user idempotence), amended `reviewApprovePost` 10/10,
  `reviewApprovePostDefaultAccount` 8/8 byte-unchanged,
  `evidenceObjectAssembly`, `evidenceObjectsConstraints`. The clean
  reset (run at T3 for the verifier) means every suite re-proved
  against a from-scratch DB — migration ordering included.
- **Lint, scoped:** zero new findings in D5-touched files across T1/T2
  (the route's pre-existing Class A/B baseline stands; the one sweep
  warning traced to `documentCaseSourceService.integration.test.ts:12`,
  pre-existing).
- `verify-audit-coverage`: dirty-DB 69 gaps (68 journal_entry + 1
  fiscal_period; **zero evidence-class**) → clean-DB **1 gap** — the
  pre-existing seeded-locked-period artifact in ORG_REAL_ESTATE (seed
  writes the lock without an audit row; predates D5; named exception).
  The 68 JE gaps proven test-residue.
- ADR tooling: `adr:lint` 13/0/0; `adr:index --check` clean at T4
  commit (the pre-commit hook fired live and passed — and the tooling
  itself enforced T3-before-T4: the frontmatter↔registry cross-check
  fires only when an ADR is staged).

## 3. The inverted fence (the framing that separated D5 from D3/D4)

`git diff eeb9a9ed..HEAD -- docs/02_specs docs/07_governance
docs/06_audit` contains **exactly five files** and nothing else:

| File | Delta | Verified |
|---|---|---|
| `invariants.md` | +1 line (row 27) | only T3 touched it in the span; heading "the 25 invariants" byte-untouched |
| `ledger_truth_model.md` | +117, **single insertion hunk** at `:2449` | INV-DOC-001 leaf untouched (zero diff mentions) |
| `control_matrix.md` | +7, single hunk | section counts frozen (D8's) |
| `adr/0033-…md` | +70−1 | D-0033.1–.8 byte-preserved incl. the glossary sentence |
| `adr/README.md` | +4 | exactly the generated INV-EVIDENCE-001 grouping |

The INV-WORKFLOW-002 "Class-1 RETIRED 2026-06-04" edits fall **outside
the span** (pre-`eeb9a9ed`) — confirmed by the per-file commit log: not
a registration-scope leak. `glossary.md` diff: zero lines.

## 4. Brief-vs-shipped (D-1 … D-8)

| Position | Shipped state |
|---|---|
| **D-1 route-seam producer** | FAITHFUL. Persist between post-success and the committed marking, both branches + recovery; `billService.post` untouched (OQ-2 honored); preserved composite untouched. |
| **D-2 structural teeth** | FAITHFUL + strengthened at the crash-class-X fork: persist-fail ⇒ approved-hold proven by the teeth test; the unrepairable class got a **typed non-retryable** refusal (Option A, advisor-ruled) instead of the brief's implicit generic failure. Ledger never rolled back (asserted, not implied). |
| **D-3 subject-ownership guard** | FAITHFUL to the read-back-amended brief (the B-axis blocker resolution): org-scoped `LINKED_ENTITY_TABLE_MAP` resolution before any write; foreign ≡ missing; persist-grain negatives are the real tests. One naming delta: `LINKED_ENTITY_NOT_FOUND` reused instead of minting `SUBJECT_NOT_FOUND` (ask (d) pre-authorized reuse-if-equivalent; the equivalent existed). |
| **D-4 subject↔trace** | FAITHFUL. UNIQUE triple + redundant-index drop (one migration); successful-commit trace anchor with the resume nuance in the leaf; `created_by` INSERT-only (two-user test); upsert refreshes status + trace only. |
| **D-5 status mapping + CHECK** | FAITHFUL. empty→partial collapse named in the leaf; additive broaden; first-instance successor name (`wave_6_active`) grounded against both precedent families. |
| **D-6 registration** | FAITHFUL to the A-axis condition: claims only what is enforced; residuals explicit in leaf + matrix (INV-WORKFLOW-002 idiom); fresh sole-commit-path enumeration in the T3 commit body, with the strongest leg (transition() barred) advisor-corroborated via `AUTOMATION_ONLY_TRANSITIONS` and the leaf citation aligned to that mechanism (T3 flag 1). |
| **D-7 ADR amendment** | FAITHFUL. ADR-0022 §2 block; D-0033.7 body untouched; frontmatter rode T4 (ask (a)); temporal-layering Status note (ADR-0024 shape). |
| **D-8 IDOR** | FAITHFUL. Persist-grain centerpiece negatives (foreign-org → refusal + zero rows; missing → identical); route 403/404 demoted to defense-in-depth; assemble's cross-tenant guard regression-locked. |

## 5. Named deviations (all read-back-authorized, none absorbed)

1. **Brief §5.7 "D3 + D4 suites green byte-unchanged" — falsified for
   the D3 suite.** D5's chartered behavior change
   (persist-before-marking) is contradictory with the D3 23505-RECOVERY
   fixture's JE-only shape: that shape asserts `committed`, the
   invariant forbids committed-without-row. Option A ruled at the
   crash-class-X STOP-surface (the authorization point): the fixture
   amended **additively** (vendor+bill seed; every original assertion
   byte-untouched), the JE-only shape moved to the D5 suite as the
   crash-class-X test encoding the new semantics. The D4 suite stayed
   byte-unchanged as promised.
2. **`SUBJECT_NOT_FOUND` → `LINKED_ENTITY_NOT_FOUND`** (ask (d)
   reuse-check fired; zero catalog churn).
3. **Minor, recorded:** the new leaf does not itself cite INV-DOC-001;
   the pair's cross-link rides the existing Wave-2 reframe in
   INV-DOC-001's own leaf ("first bill realization of reserved
   INV-EVIDENCE-001") — directional, not bidirectional, at the leaf
   pair grain. D8's reachability narrative pass may tighten if desired.

## 6. Carry-forward docket

1. **Crash-class-X is a live manual-repair class** — operator guidance:
   `POSTING_RECOVERY_UNREPAIRABLE` (409) means do NOT retry; the JE
   exists, the bill does not, and re-approving cannot create it. Repair
   is manual (the runbook note this docket entry constitutes); the case
   sits operator-visible at `approved`.
2. **JE→bill non-atomicity root cause** (post-V1): make
   `billService.post`'s JE + bill writes one transaction/RPC — closes
   crash-class-X entirely rather than routing it to manual repair.
3. **Completeness enforcement upgrade** (post-V1; OQ-6): row status is
   descriptive; "complete bundle required" is the named evolution.
4. **Preserved-composite producer adoption** at the post-V1 governed
   auto-commit re-wire (the helper is route-orchestrated; the composite
   needs its own persist call when it returns).
5. **Payment-branch reachability** returns with Tier-C-at-review /
   persisted proposals (post-V1); the persist wiring is in place, the
   recovery sub-branch fails loudly by design (no JE→payment column
   path — joins carry-forward 2's atomicity fix surface).
6. **D8 handoff (compounding):** heading "the 25 invariants" → 27;
   `control_matrix.md` intro/section/Layer-2 counts; **the reachability
   narrative live-count** (advisor flag 2 — stale at 25 with no
   per-addition notes for 26/27); the symmetric-diff re-run.
7. **`verify-audit-coverage` pre-existing gap** — the seeded
   locked-period (no `period.locked` audit row) in the demo org; a
   seed-data fix, unscheduled, not D5's.

## 7. Wave 6 position after D5

D1 + D2.1 + D2.3 + D3 + D4 + **D5 complete**. Remaining: **D6**
(INV-WORKFLOW-001 teeth-flip + `check-intent-producers.ts` CI wiring),
**D7** (the positive human-approve→post row-delta test), **D8**
(governance doc-sync first-class: the 25→27 heading math + narrative
live-count + reachability + wave UI-screenshot closeout). Terminal push
remains Phil's at wave close.
