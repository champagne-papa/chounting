# CI runs no tests — what "all checks pass" actually means

**Found** 2026-07-31, grounded against `main` = `8a96a86e`.
**Status:** open finding. Not fixed; the operational takeaway in §5 applies
until it is.

---

## 1. The finding

`.github/workflows/ci.yml` defines **five** jobs:

| Job | What it proves |
|---|---|
| `typecheck (all workspaces)` | it compiles |
| `lint (all workspaces)` | it lints |
| `adr (lint + index drift)` | ADR frontmatter + index consistency |
| `intent-producers (INV-WORKFLOW-001)` | intent-producer coverage |
| `build (all workspaces)` | it builds |

**None invokes vitest.** A search for any `test`/`vitest` invocation across
both workflow files (`ci.yml`, `verify-audit-coverage.yml`) returns nothing.

**So "all checks pass" on any PR in this repo has never meant "the tests
pass." It has meant "it compiles and lints."** That has been true for every
PR this repo has merged.

The workflow's own header enumerates its scope — *"Runs typecheck, lint, adr
checks, the intent-producers coverage check … and build across all
workspaces"* — and never mentions tests, nor explains their absence.

## 2. It is not hypothetical — a correct guard was silenced and a bug shipped

On 2026-07-31 the `config.py` split (`a937858a`, PR #17) added a third local
Python module to `sidecar-ocr/` but did not register it in
`add_local_python_source`. Modal 1.x mounts only what that call names, so the
deployed image shipped without `config.py` while `main.py` imports it at module
level. Every invocation died:

```
File "/root/main.py", line 34, in <module>
    import config
ModuleNotFoundError: No module named 'config'
```

**A correct test for exactly this already existed.** `deploymentValidation`
N=5 was written at Session 42 against precisely this failure — its comment
says *"subpackages must be explicitly mounted via `.add_local_python_source()`,
otherwise cold-start fails with ModuleNotFoundError."* It would have caught the
omission the instant it was introduced.

It did not, because nothing ran it:

- CI does not run tests (§1), so PR #17 merged on five green checks that never
  executed the guard.
- The local gate missed it too: after the config fix only the sidecar Python
  unittest was run, not the vitest suite.

The bug reached `main` and surfaced only at a live `modal run` against the dev
sidecar. **The defense existed, was correct, and was silent.** Repaired at
`fd7fdcec` (PR #20), which also widened the assertion from an exact arg-list
literal to per-module membership — a guard that fails on legitimate changes
gets edited away, after which it guards nothing.

There is no reason to assume this was the only time.

## 3. Open question — deliberate exclusion, or never wired?

**This is the question that decides the fix, and it is not settled.** The two
readings have different remedies:

- **Deliberate:** integration tests need a live Postgres. `globalSetup.ts:46-66`
  requires `SUPABASE_TEST_URL`/`SUPABASE_URL` and shells out to
  `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres` to load
  `test_helpers.sql`. CI provisions no service containers — `ci.yml` declares no
  `services:` block, and its only Supabase reference is a build-time placeholder
  (`:189`). Fix = provision Postgres (or a Supabase service) in CI, then add the
  job.
- **Oversight:** someone intended to wire tests in and never did. Fix = add the
  job, discovering the Postgres requirement en route.

**Evidence, not proof, for "deliberate":** the Postgres dependency is real and
would have to be solved either way.

**Evidence for "oversight":** no ADR, doc, or workflow comment anywhere states
that tests are excluded from CI or why — a repo-wide search found none. In a
codebase that records rationale this thoroughly, the *absence* of a recorded
decision is weak evidence that no decision was made.

Do not collapse this. Answering it wrong sends the fix in the wrong direction.

## 4. Related shape — greens that mean less than they appear

This is the third instance found in one session of a signal treated as
verification that verifies less than assumed. Recording them together because
the pattern is the point:

1. **`pnpm test:full` turbo-cache replay** — can reset the DB, then replay
   cached stdout without executing a test, reporting `FULL TURBO` in ~344ms.
   Condition-1 push evidence is silently stale on a cache hit.
   (friction-journal 2026-07-27.)
2. **Substrate accumulation** — a full-suite number off an un-reset local DB is
   polluted; `cardsEndpoint.recentN` failed with a count growing 545 → 562
   against a 500 cap and passed clean after `db:reset:clean`.
   (`conventions/testing.md:171-186`.)
3. **This finding** — CI green, in the merge gate itself, where the false
   confidence does the most damage.

## 5. Operational takeaway — applies now, until §3 is answered and fixed

**Green checks in this repo mean compiles-and-lints, not tests-pass.**

Any security- or correctness-bearing PR therefore needs **deliberate
human-gated test evidence** recorded on the PR, because the gate cannot supply
it. Concretely, that means:

1. Run the relevant suite locally **on a clean substrate**
   (`pnpm db:reset:clean` first — see §4.2), and paste the result.
2. For a guard, **mutation-verify it**: break the thing it guards, confirm that
   specific test fails, restore, confirm it passes. A test that cannot fail is
   the same false-green one layer down.
3. State plainly in the PR that CI did not run tests, so the reader does not
   infer coverage from the green checks.

Precedent: PR #19 (a cross-org authorization boundary) and PR #20 merged this
way — clean-substrate suite runs plus mutation verification recorded in the PR
body, explicitly labelled as standing in for the CI job that does not exist.

## 6. Suggested fix shape (unassessed)

Answer §3 first. Then, most likely: provision Postgres in CI (service
container + `supabase` CLI or the migrations), add a `test` job, and gate
merges on it. Whether the full suite (~5 min, needs seeded data) belongs on
every PR or a subset runs per-PR with the full sweep on merge is a separate
call.

Until then §5 stands.
