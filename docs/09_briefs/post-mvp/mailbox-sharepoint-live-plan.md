# Plan — mailbox-sharepoint-live Phase 1 (code auth fix)

**Status:** RATIFIED 2026-06-08 (advisor-cleared the verification seat; ratify + commit-under-lock
delegated to the executor). Committed under lock `mailbox-sharepoint-live`. Push + lock-release
remain Phil's.
**Realizes:** spec `acd6e451` (charter → spec → **plan** → execute).
**Anchored at:** base `42fa8277`; charter `63729742`; spec `acd6e451`. Lock
`mailbox-sharepoint-live`. All code read `[disk]` first-hand.
**Boundary:** Phase-1 code only. Live ops + green discharge are Phil's; push + lock-release Phil's
at arc close (UNIT-PROVEN ≠ PROVEN).

---

## Task ordering rationale

The env-var rename is mechanical and orthogonal to the auth logic, so it is **isolated** as Task 1
(suite green throughout — no behavior change) from the substance in Task 2 (suite green after).
Two commits, each green, each independently reviewable + rollback-able. The rename is **internally
atomic within Task 1** because it is coupled at module load: `assertEnv` (`env.ts:34-57`) + the
route's `env.<NAME>` read + the local `.env.local` value must all agree, or boot/typecheck breaks.

TDD: Task 2 rewrites the test first (RED against the still-HMAC handler), then swaps the logic
(GREEN). Both land in Task 2's single commit.

## Task 1 — atomic env-var rename (no behavior change)

Rename `POSTMARK_INBOUND_WEBHOOK_SECRET` → `POSTMARK_INBOUND_BASIC_AUTH_PASSWORD`. **Auth logic and
the test are untouched** — the route still does HMAC, reading the renamed var (same value); the
test still mints HMAC with its hardcoded value (unchanged) → suite stays green.

Sites (spec §3):
- `env.ts:25` `REQUIRED_SERVER` entry.
- `env.ts:67` export property + `process.env[...]` read.
- `env.ts:19-25` comment block (keep accurate for now; final Basic-Auth wording lands in Task 2 with
  the logic — or do it here; either is fine as long as it isn't left asserting HMAC after Task 2).
- `route.ts:213` `env.<NAME>` read (the only route line in Task 1).
- `apps/web/.env.example:25` key + placeholder.
- `apps/web/.env.local` (gitignored, local) — rename key; value unchanged.
- `apps/web/.env.local.example` — verify; add the new key iff the local-test convention lists it.

**Known transient (named, not a defect):** after Task 1 the var is named
`POSTMARK_INBOUND_BASIC_AUTH_PASSWORD` but is still consumed as an HMAC secret until Task 2 lands —
an expected intermediate, visible in the Task 1 diff. Acceptable because both commits bank locally
and the arc closes coherent (nothing reaches origin mid-split).

**Verify gate:** `pnpm typecheck` clean; the mailbox integration test green (still HMAC, unchanged);
`pnpm test:full` green. **Commit** (atomic rename).

**Read-back focus:** rename atomic across every site (no half-rename boot-fatal) — in particular
both the `env.ts` export **property name** and its `process.env[...]` **key** flip together (a
property-only or key-only rename is the classic boot-fatal); zero behavior change; suite green.

## Task 2 — Basic Auth swap + test rewrite + comment corrections

**Sub-step order (TDD):**

1. **Rewrite the test → RED.** `forwardedMailbox.handleForwardedMailbox.integration.test.ts`:
   - Drop `import { createHmac }` (`:16`).
   - `signedRequest` → `authedRequest` (`:99-122`): build `Authorization: Basic
     base64('postmark:' + password)`; overrides for omit-header / malformed-scheme / wrong-cred.
   - Fixture `TEST_SECRET` → `TEST_BASIC_AUTH_PASSWORD` (`:42-48`) + update the `.env.local` comment
     to the new var name.
   - Happy-path tests (#1, #1b, #1c, #3) call `authedRequest` (valid creds) — bodies unchanged.
   - Rewrite **Test #2** (`:339-364`) → Basic Auth failures: **missing header**, **malformed
     scheme**, **wrong credential**, each → **401** + `forwarded_mailbox.auth_invalid` audit; zero
     ingest rows. (Parametrized or separate `it`s.)
   - Run the test → expect RED (handler still HMAC).
2. **Implement → GREEN.** `route.ts`:
   - `:31` import swap: `createHmac` → `createHash` (keep `timingSafeEqual`).
   - `:70-90` replace `verifyPostmarkSignature` with `verifyBasicAuth` per spec §2 (fixed username
     const `'postmark'`; parse scheme/credential; missing/malformed/wrong → false; constant-time
     `timingSafeEqual(sha256(credential), sha256(expectedB64))`).
   - `:208-232` Step-2 block: read `authorization` header; call `verifyBasicAuth`; on fail emit
     `forwarded_mailbox.auth_invalid` with `before_state {auth_present}` + log `{auth_present}`;
     401.
   - Correct comments: taxonomy row 1 (`:9-17`), the `verifyPostmarkSignature` doc (`:63-68`),
     `:19` and `:68` "signature_invalid" mentions → Basic Auth / `auth_invalid`.
   - Run the test → expect GREEN.
3. **Grep-clean** acceptance: `createHmac` / `x-postmark-signature` / `signature_invalid` return
   **zero** hits in `route.ts` and the test file.

**Do NOT touch** `apps/web/src/agent/orchestrator/extraction/sidecar/client.ts` — its `createHmac`
is the Modal OCR sidecar's own auth (chounting signs requests to its own endpoint; opposite
direction, legitimate). The removal is scoped to `route.ts` + the test.

**Verify gate:** `pnpm typecheck` clean; the mailbox integration test green (valid Basic Auth →
accepted; missing/malformed/wrong → 401 + `auth_invalid`); grep-clean; `pnpm test:full` green.
**Commit.**

**Read-back focus:** `verifyBasicAuth` constant-time + length-guarded with all three 401 paths;
the test exercises realistic Basic Auth shapes and is grep-clean; the false "Postmark signs the
body" comments are corrected; `sidecar/client.ts` untouched.

## Deploy / ops dependency (NOT a code task — Phase-2 / Phil)

- The renamed Vercel env var `POSTMARK_INBOUND_BASIC_AUTH_PASSWORD` must exist in Production +
  Preview + staging **before/with** the deploy, or `assertEnv` boot-fatals (the
  "required-var-missing-on-deploy" class the production-promotion arc hit). Phase-2 runbook step.
- The Postmark webhook URL must spell out username **`postmark`** exactly
  (`https://postmark:<password>@chounting.chou.ca/api/webhooks/postmark-inbound`) — a wrong
  username 401s every delivery as a silent `auth_invalid` (spec §7 carry). Phase-2 runbook step.

## Verification (arc-level, what Phase-1 proves)

`pnpm typecheck` + the rewritten integration test + grep-clean + `pnpm test:full` green. **Not
provable by Phase 1:** real Postmark Basic-Auth deliveries flowing end-to-end — the live discharge
(Phase 2 / Phil) proves that. A passing route test is readiness, not PROVEN.

## Per-task read-back protocol

After each task's commit, present the diff + verify-gate output and **hold** for read-back before
starting the next task (per the cadence; the advisor reads each task against disk).
