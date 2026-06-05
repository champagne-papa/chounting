# Wave 6 D6 Brief — INV-WORKFLOW-001 Teeth-Flip + CI Wiring

**Status:** DRAFT — surfaced for advisor read-back.
**Charter (plan-of-record §3, verbatim):** "`INV-WORKFLOW-001`
teeth-flip — Query-gap scope-out (§2) → `exit(gaps>0?1:0)` → **wire
`check-intent-producers.ts` into CI** (`.github/workflows/ci.yml`; it
is wired into no CI today)." Registers: **`INV-WORKFLOW-001`** (row
28). Amends: **ADR-0031 D-0031.3**. IDOR surface: — (the registry is
pure/code-defined; D-0031.5's no-IDOR premise holds — no new read
facet).
**Grounding HEAD:** `304a3796` (46 banked-local; D1 + D2.1 + D2.3 +
D3 + D4 + D5 closed).
**Governance footprint:** crosses the spec/governance fences (the D5
class — registration + ADR amendment, four-gate-verified) **plus a
fence class this wave has not yet carried: `.github/workflows/` CI
wiring.** The CI change's close check is "exactly one new job in
`ci.yml`, consuming no untrusted context, with its dynamic execution
deferred to the wave-close push" (§3.7, §5.4).

---

## 1. Grounded surface (what exists at HEAD)

### 1.1 The check is self-documenting and warn-only

`scripts/check-intent-producers.ts` reads the pure registry via
`intentsLackingNonAiProducer()`, prints one stdout warning per gap,
and `process.exit(0)` (`:43`). Its own header (`:13-18`) prescribes
the Wave-6 change verbatim — replace the exit with
`process.exit(gaps.length > 0 ? 1 : 0)`, register INV-WORKFLOW-001 —
**with the load-bearing precondition:** "Before flipping, the Query
gap must be dispositioned (a non-AI producer lands, or Query is
formally scoped out with a Phase-2 rationale)." Flipping first would
make every run exit 1 — a permanently-red gate.

### 1.2 The registry and the gap set (the flip-safety fact)

`apps/web/src/core/intent/producers.ts`: 8 intent keys (`navigation`,
`query`, 6 `mutation:*`). **The gap set today is exactly `['query']`**
(verified key-by-key: navigation has 3 non-AI producers; every
mutation key has ≥1 non-AI producer). The `query` entry (`:71-83`)
carries its own WAVE-6 DISPOSITION comment naming the two options. A
shape precedent worth honoring: the navigation block's `rule.create`
note (`:61-67`) — "don't scope out a known AI producer" — records AI
producers rather than deleting them; the scope-out mechanism must not
erase `query`'s registered AI producer.

### 1.3 Q2 — RATIFIED scope-out, with binding requirements (plan §2)

Verbatim obligations: "**formally scope `query` out of the V1 teeth**
with a documented Phase-2 rationale — per `intent_model.md §5`,
`QuerySpec` is a reserved Phase-2 shape; at V1 transient views are
produced via the **Navigation** path, which *has* non-AI producers, so
there is no AI-only path for queries at V1. Document the rationale
**visibly in the check + `producers.ts`** (not silent), with the
**re-include trigger named**: when `QuerySpec` lands in Phase 2 and
`query` separates from `navigation`, `query` rejoins the teeth and
needs its own non-AI producer. (Building a non-AI Query producer now
is rejected as premature Phase-2 work.)"

### 1.4 Invocation reality (sweep at HEAD)

The check runs **nowhere automatically**: it is the root npm task
`intent-producers:check` only — absent from `ci.yml` (4 jobs:
typecheck, lint, adr-check, build), from `agent:validate`
(typecheck && no-hardcoded-urls && agent:floor), from turbo, and from
the hooks. The build-plan's "wired into no CI today" is accurate and
extends to "no automated gate at all." **Named drift:** ADR-0031
D-0031.2 says the Wave-4 check was "wired into the validation
harness" — it never was. The D6 amendment owns this (D-6 below).

### 1.5 `ci.yml` (the new fence class's substrate)

Triggers: `push`/`pull_request` on `[main, staging]` +
`workflow_dispatch`; concurrency-cancel per ref. **Security-note
property (binding on the new job):** the workflow consumes no
user-controlled context (no `github.event.*` interpolation) — the new
job must preserve this. The `adr-check` job is the structural
template (checkout → pnpm → node → install → `pnpm <task>`; no turbo
cache needed — and it proves the tsx-script-via-pnpm-task pattern
runs in CI). A **separate daily `verify-audit-coverage.yml` workflow
exists and is untouched by D6.** The `adr-check` job also means the
registry-first ADR ordering (T3 before T4) is CI-enforced, as at D5.

### 1.6 Registration precedent (twice-proven) + one D6-specific twist

The D2.1/D5 shape: atomic three-artifact (row + matrix entry + leaf)
+ code annotation; frozen heading (D8's — **target now 25→28**, the
advisor's boundary correction); ADR frontmatter rides the ADR commit.
**The twist:** unlike D5 (where T2 opened the reverse-grep window),
`INV-WORKFLOW-001` tokens already exist in code (the script and
`producers.ts` have carried them since Wave 4; the INV-WORKFLOW-002
leaf deliberately cited the reserved block "de-tokenized" to keep D6's
registration visible in the reachability diff). The leaf **closes an
already-open reverse window** rather than opening a new one.

---

## 2. Design decisions (positions for read-back)

### D-1 — Scope-out mechanism: a named carve-out constant, visible in both files

A new exported constant in `producers.ts`:

```ts
export const V1_TEETH_SCOPE_OUT: readonly IntentKey[] = ['query'];
```

carrying the Q2 rationale + the re-include trigger as its doc comment
(QuerySpec is Phase-2-reserved; V1 transient views ride Navigation
which has non-AI producers; **re-include: when QuerySpec lands and
`query` separates from `navigation`, it rejoins the teeth and needs
its own non-AI producer**). The `query` registry entry is
**unchanged** — its AI producer stays recorded (the `rule.create`
precedent; deleting the key would erase a known AI producer and make
the scope-out silent). The check subtracts the carve-out and prints
scoped-out keys **visibly** as informational lines (key + "scoped out
of V1 teeth (Q2 ratified)" + the re-include trigger) — Q2's
"visible in the check + producers.ts, not silent" discharged in both
files. Rejected: deleting the `query` key (silent + erases the AI
producer); a check-only exclusion list (visible in one file, not
both); a fake non-AI producer entry (a lie in the registry).

### D-2 — The teeth: exactly the script's own prescription

`process.exit(effectiveGaps.length > 0 ? 1 : 0)` where
`effectiveGaps = intentsLackingNonAiProducer() ∖ V1_TEETH_SCOPE_OUT`.
Unscoped gaps print as **error** lines (warning wording retired).
Post-scope-out the effective gap set is **empty** (the §1.2 grounded
fact) — the flip lands green; the §5 tests pin both halves (the live
registry's gap set, and that a synthetic unscoped gap actually
produces exit 1 — teeth that bite, not teeth declared).

### D-3 — Testability refactor: extract the pure core from the script

`main()` currently computes-prints-exits monolithically; `process.exit`
makes the script untestable as-is. Extract a pure
`runCheck(registry, scopeOut) → { gaps, scopedOut, effectiveGaps,
exitCode }` (exported; the script body becomes print + exit on its
result). Minimal, preserves the adr:lint-pattern shape, and gives the
§5 unit tests a real surface. (Home: the script file itself exports
it, or a sibling `scripts/lib/`; pinned at decomposition.)

### D-4 — CI wiring: one new blocking job, adr-check-shaped

New `intent-producers` job in `ci.yml`: checkout → pnpm → node →
install → `pnpm intent-producers:check`. Blocking by construction (a
failing step fails the job fails the workflow); triggers inherited
(push/PR main/staging + dispatch); **no `github.event.*` context**
(the security-note property preserved — the job references nothing
user-controlled); no turbo cache (two-file tsx traversal). The
workflow's header comment gains the job in its inventory sentence.
`verify-audit-coverage.yml` untouched.

### D-5 — Harness wiring (ask (a) — exceeds the row's letter, closes the D-0031.2 drift)

Position: ALSO wire the check into the **root** `agent:validate`
wrapper (`package.json`: `"agent:validate": "pnpm --filter
@chounting/web agent:validate && pnpm intent-producers:check"`).
One line; gives local push-readiness parity with CI; and converts the
D-0031.2 drift ("wired into the validation harness" — never landed at
Wave 4) into realized-late rather than perpetually-false. The
alternative — ci.yml-only per the row's letter, recording the drift
as a standing note — is clean too; **explicitly the advisor's call.**
Either way the amendment (D-6) records the truth.

### D-6 — Registration + amendment (the D5 shape, target 28)

- **Registration (T3, governance commit #1):** `invariants.md` row 28
  + `control_matrix.md` entry + `ledger_truth_model.md` leaf +
  annotation. Heading and counts stay frozen (D8's, now 25→28).
  Draft statement: *"Every Intent in the producer registry carries ≥1
  non-AI producer (no AI-only path to any intent; `query` carved out
  at V1 by the Q2 ratified scope-out, re-include trigger named).
  Enforcement: build-time structural — the producer-coverage check
  exits non-zero on any unscoped gap, wired as a blocking CI job
  (+ the validation harness per ask (a))."* Enforcement class is
  **build-time structural** — a new sub-type in the registry (neither
  runtime nor DB); the leaf classifies it honestly with residuals
  (D-7).
- **Amendment (T4, governance commit #2):** ADR-0031
  `## Amendment 2026-06-05` block (ADR-0022 §2) + frontmatter
  `invariants: ["INV-WORKFLOW-001"]`. Records: the teeth realization;
  the Q2 scope-out + re-include trigger; the CI wiring; **the
  D-0031.2 drift owned** (harness wiring never landed at Wave 4 —
  landing at D6 per ask (a), or recorded as deferred); D-0031 body
  byte-preserved.

### D-7 — Honest residuals (the leaf's named non-coverage)

1. **The registry is self-declared.** The check verifies that
   *declared* producers cover every intent; it does not verify the
   declarations (a stale/wrong `site:` or a producer that no longer
   exists compiles and passes). Registry honesty is code-review
   discipline — the runtime/structural sibling of INV-RULE-003's
   residual, at build grain.
2. **CI-blocking ⇔ branch protection.** A red workflow blocks a merge
   only if the repo's branch protection requires the check — a
   GitHub-settings grain that is operator-owned and **not verifiable
   from disk**. Must-confirm with Phil (§4); the leaf names it either
   way. Direct pushes to staging run CI but are not blocked by it.
3. **The dynamic CI execution is deferred to the wave-close push.**
   CI fires on push/PR; the wave's no-push invariant means the new
   job's first real execution is Phil's terminal push. Verified
   statically until then (§5.4) — named, not hidden.
4. **The scope-out carve-out itself** — `query` is exempt at V1,
   visibly, with the re-include trigger named (the carve-out is part
   of the invariant's honest statement, not a hole in it).

---

## 3. What D6 does NOT do (scope fences)

1. **No non-AI Query producer** (Q2: rejected as premature Phase-2
   work).
2. **No registry restructuring** — R7's data-entry extensibility shape
   preserved; `query`'s AI producer stays recorded.
3. **`INV-AUTONOMY-GATE-001` stays reserved** (post-V1; plan §2).
4. **No other workflow files** — `verify-audit-coverage.yml`
   untouched; no trigger/concurrency changes to `ci.yml`'s existing
   jobs.
5. **Heading / counts / glossary = D8's** (target 25→28 after this
   registration).
6. **No runtime code paths touched** — the registry is pure; no
   services, routes, migrations, or DB objects change. (`agent:floor`
   / Category A untouched.)

---

## 4. Impl-onset must-confirms (verify-from-disk before T1)

1. `pnpm adr:check` script composition (assumed `adr:lint` +
   `adr:index --check` — read it; the new job mirrors its shape).
2. The root-task import path from `scripts/` into `apps/web/src`
   (`../apps/web/src/core/intent/producers` — confirm tsx resolves it
   in CI exactly as adr-check's scripts resolve theirs; the adr-check
   job is the existence proof for the pattern, confirm no
   apps/web-specific tsconfig/paths dependency in producers.ts — it
   is import-free per D-0031.5, expect clean).
3. **Branch protection (Phil, operator grain):** do `main`/`staging`
   require the CI workflow's checks to merge? Answer shapes residual
   D-7.2's wording, not the build.
4. Unit-test home for the extracted `runCheck` (root-level script
   tests vs apps/web `tests/unit/` importing across — pin at
   decomposition; producers.ts itself is importable from apps/web
   tests trivially).
5. The exact `intent_model.md §5` QuerySpec citation for the
   carve-out doc comment (transcribe-from-disk).
6. INV-WORKFLOW-002 leaf's "de-tokenized" citation device — confirm
   the new leaf's registration doesn't break that deliberate
   de-tokenization (read the sentence before drafting the leaf).

## 5. Test surface (summary — full TDD decomposition at plan stage)

1. **Gap-set pin (the flip-safety proof):**
   `intentsLackingNonAiProducer()` against the live registry returns
   exactly `['query']`; `V1_TEETH_SCOPE_OUT` equals `['query']`;
   effective gaps = **empty** ⇒ exit code 0.
2. **The teeth bite:** a synthetic registry with an unscoped non-AI-less
   intent ⇒ `runCheck` exit code 1; the same gap listed in
   `V1_TEETH_SCOPE_OUT` ⇒ 0 with the scoped-out line present
   (visibility asserted, not just exit codes).
3. **Carve-out integrity:** `query`'s registry entry still carries its
   AI producer (the don't-erase precedent, asserted).
4. **CI job, static verification (the named deferral):** YAML
   well-formedness via the repo's own tooling at close
   (`git diff` review at the read-back grain — the job is
   adr-check-isomorphic, consumes no event context, inherits
   triggers); local equivalence run `pnpm intent-producers:check`
   exit 0 surfaced in the run evidence. **Dynamic execution lands at
   Phil's terminal push** — recorded in the close report as the
   fence-class deferral, with the post-push verification step named
   (the wave-close checklist gains "confirm the intent-producers job
   ran green on the push").
5. Existing suites untouched (no runtime change); `agent:validate` +
   typecheck as standard gates (+ the D-5 harness addition validating
   itself if ask (a) lands).

## 6. Cadence

This brief → advisor read-back (**HOLD**) → decomposition →
read-back (**HOLD**) → task-by-task (per-task read-back, code + runs
together) → commit under `COORD_SESSION='wave-6-ap-review'` from the
repo root. Expected ~5 tasks (T1 scope-out + teeth + runCheck
extraction + tests; T2 CI job + harness wiring per ask (a); T3
registration; T4 ADR-0031 amendment + frontmatter; T5 close — gates +
the two-class fence: governance diff = exactly registration +
amendment + generated README; CI diff = exactly the one job). No
push; terminal push is Phil's at wave close.
