# V1 Wave-5 (AP eval harness) — retrospective

**Arc:** Wave 5 of the V1 wave plan — the AP eval harness (the validation layer
over the already-shipped AP extraction / classification / rule-evaluation
substrate). A **build wave, NOT ADR-bearing** (every V1-wave ADR 0028–0033 is
ratified; no reserved ADR maps to Wave 5). **Window:** 2026-06-02 → 2026-06-03.
**Anchor:** `2fb15598` (Wave-4 close = `origin/staging`). **Commit range:**
`2fb15598..HEAD` — 8 banked-local commits on `staging` (four `feat(eval)` + four
`docs(v1)`, interleaved), unpushed; the closeout set (this retrospective + the
Wave-5 friction-journal block + the `testing.md` codification) lands at this
retrospective's close. Push waits for the CTO's explicit terminal go.

Source friction-journal entry: `docs/07_governance/friction-journal.md`
"V1 Wave-5 (AP eval harness)" (2026-06-02 / 2026-06-03).

---

## §1 Scope and timeline

Wave 5 delivered the four §5 sub-deliverables of the V1 governance charter's
AP eval harness: **D1** extraction golden set + accuracy; **D2**
confidence-to-policy validation; **D3** unsafe-output suite; **D4**
input-contamination suite. The wave is **validation, not feature** — it registers
no INV-ID, ships no migration, amends no ADR. The only `src` touches are
additive, behavior-preserving exports made so the governed logic is testable
fixture-offline without firing live AI.

The opening correction set the wave's character: the pickup handoff's drafting
instruction was conditional on Wave 5 being ADR-bearing; grounding the charter
§4/§5 + the ratified-ADR set on disk showed it is **not** (a build wave, like
Wave 6), so the four-gate ADR lifecycle did not fire — the build cadence (plan →
green-light → implement → artifact read-back) did.

## §2 Deliverables and commits

| # | Deliverable | feat | plan-refinement |
|---|---|---|---|
| plan | build-plan-of-record | — | `58865874` |
| D1 | no-AI Tier-A extraction accuracy harness | `c431aa24` | (in plan commit) |
| D2 | confidence-to-policy validation | `849439c4` | `f36a3154` |
| D3 | unsafe-output suite (INV-2 output boundary) | `041ac343` | `b64b153d` |
| D4 | input-contamination suite (INV-2 input side) | `7535901b` | `78597c19` |

- **D1** — `…TierA` no-AI export entrypoints (×3, additive, mirroring the
  shipped `evaluateTierA`); `scoreExtraction` with coverage⊥correctness
  (absent ≠ wrong); golden labels grounded in the real-OCR corpus; a
  harness-computed regression ratchet. Recorded finding: the no-AI Tier-A
  baseline is poor on real OCR (vendor_invoice 30% correctness) — recorded, not
  pre-tuned.
- **D2** — additive map-only export of `CONFIDENCE_THRESHOLDS`; deterministic
  hard-asserts: the 4 governed values (incl. the `unknown:1.0` sentinel),
  boundary behaviour, exhaustive `dispositionForAction` totality over the live
  `action_type` enum.
- **D3** — test-only (no `src`): `safeParse` over the exact exported boundary
  schemas; rejects structural violations + strips injected keys
  (`.passthrough()`-regression lock incl. `__proto__`); characterizes the
  semantic-content limit (INV-5 backstop).
- **D4** — test-only (reuses D1 exports + `evaluateTierA`): hard-asserts
  instruction-following immunity (a permanent invariant); characterizes
  content-injectability as a qualitative one-time-fire property.

**Condition-1 evidence:** `pnpm test:full` (db:reset:clean + full vitest) green
at HEAD — **1632 passed | 10 skipped (1642)**, 261 files. **Condition-2:**
doc-sync clean (no invariant / control-matrix / ledger / types / ADR doc
touched). Per-deliverable artifact read-backs cleared each commit.

## §3 Codification candidates

- **Fixture-offline eval-suite teeth — MINTED (N=4).** Mock `callClaude` +
  `adminClient` to throw; sync-return assertion; pure import graph ⇒
  no-live-AI / no-persisted-read provable by construction. Fired across all four
  deliverables. Codified at
  `docs/04_engineering/conventions/testing.md` "Fixture-offline eval-suite teeth
  (N=4)" via `codify-convention`.
- **Additive-named-export-for-eval — BANKED (N=2).** Re-expose a pure function /
  governed constant additively (behaviour-preserving) so an eval suite can test
  it fixture-offline, mirroring `evaluateTierA`. Fired at D1 (`…TierA`) and D2
  (`CONFIDENCE_THRESHOLDS`). Below the N=3 mint threshold; banked for the next
  fire.
- **Assertion-posture three-way — NOTE (judgment heuristic, not a mechanical
  convention).** For a measured property, choose: **numeric ratchet** when the
  metric is directional and regression-meaningful (D1 accuracy — freeze the
  floor, catch regressions); **qualitative one-time-fire** when the property has
  no direction but gap-closure is worth surfacing (D4 content-injectability —
  `injected ≠ baseline` fails once, when sanitization lands); **pure
  characterization** when there is no direction and no signal worth a CI failure.
  The D1-vs-D4 contrast crystallized the distinction. Recorded here, not minted.

## §4 Discipline graduations and bilateral catches

The arc ran on the references-are-claims / ground-from-disk discipline, caught
in both directions:

- **Handoff `0029/0030`-reserved error** (advisor-authored handoff drifted;
  write-side disk-catch corrected it) — the discipline applied to the handoff
  itself.
- **The relayed-count-is-a-claim pattern** fired three times (35-vs-37
  ACTION_NAMES; Q71→Q65 provenance; 3-vs-4 threshold map / `unknown:1.0`
  sentinel) — each corrected by reading the cited artifact.
- **View-rendering-is-not-disk** (two false corruption flags resolved by
  hex-from-disk; advisor corrected practice to hex-check before asserting
  corruption from glyphs).
- **D4 vacuous-assertion catch** (advisor read-back caught `toBeDefined()`
  testing nothing; strengthened to the qualitative property).
- **The advisor seat's content-grep limit** named as a structural verification
  boundary (enumeration / absence claims are write-side-grounded,
  advisor-corroborated only for named instances).

The standing pattern that earned restatement: **surface impl-onset structural
discoveries before building** — D1's fixture-offline-forces-Tier-A export, D2's
map-export, D3's boundary-set completeness enumeration (the third `callClaude`
site → ruling (a)) each paused the build to surface rather than guess.

## §5 Carry-forwards (Wave-5 → Wave-6 handoff surface)

Several Wave-5 findings depend on Wave 6's human-review UI; consolidated here as
the explicit handoff:

1. **INV-2 input-side sanitization control** (Fork-2(b), plan §6/§8) — the
   unfulfilled obligation D4 made concrete; owed before governed auto-commit
   returns (post-V1). **CTO open-item (plan §8):** exact home (Wave 6 vs a
   post-V1 track).
2. **Tier-C (AI) extraction-accuracy harness** — D1 scored only the no-AI
   baseline; the AI path needs a separate paid/non-deterministic eval (post-V1).
3. **Vendor-identity extraction accuracy → §7 matcher-gap MUST-FIX** — excluded
   from D1's scored set; lands when the Stage-4 schema + Tier A/C gain a
   vendor-identity field (Wave 6).
4. **Router Subsystem-2 ambiguity-margin** (ADR-0019 §13) — a distinct
   confidence surface, not folded into D2.
5. **`.strict()` output-boundary hardening** — D3's strip-vs-`.strict()`
   observability gap (Wave 6 / post-V1).
6. **Double Entry Agent AI-output boundary** — the conversational subsystem's
   `.parse`-throws boundary, out of the AP-pipeline scope (ruling (a)); a
   dedicated agent-safety eval at the next agent touch.

**Handoff discipline:** given this arc's opening handoff error, the next seat's
handoff carries the references-are-claims discipline explicitly — the receiver
grounds it against disk rather than trusting it, exactly as this seat did with
the `0029/0030` claim.
