# Spec — mailbox-sharepoint-live Phase 1 (code auth fix)

**Status:** RATIFIED 2026-06-08 (advisor-cleared the verification seat; ratify + commit-under-lock
delegated to the executor). Committed under lock `mailbox-sharepoint-live`. Push + lock-release
remain Phil's.
**Realizes:** charter `63729742` §5 Phase 1 (charter → **spec** → plan → execute).
**Anchored at:** `staging == origin/staging` base `42fa8277`, charter committed at `63729742`
(this session reads all code `[disk]` first-hand).
**Coordination:** session lock `mailbox-sharepoint-live`.
**Scope:** the code auth fix ONLY. The combined onboarding runbook is Phase 2 (charter §5);
the live ops + green discharge are Phil's (charter §7).
**Provenance legend:** `[disk]` grounded first-hand; `[docs]` Postmark primary docs (cited in the
charter); `[design]` decided here; `[charter]` fixed by the ratified charter.

---

## 1. Soundness-check result (the spec opens here)

The charter §5 enumeration was executed first-hand this session. Result — **eyes-open, and auth
is the only actual code *bug* in the chain:**

- **`resolveStorageProvider` is channel-agnostic** (`resolveStorageProvider.ts:19-36`: takes
  `org_id`, reads `org_settings.default_storage_provider`, no channel param). Mailbox→SharePoint
  routes purely by org default — no mailbox-specific storage path to harbor a separate bug. `[disk]`
- **The pipeline runs once, best-effort** (`ingestionService.ts:841-863`: `invokeIngest` in
  try/catch, logged-not-thrown). A pipeline failure does **not** 500. `[disk]`
- **A `put` failure → 500 → Postmark retry**, with prior puts orphaned (accepted-risk per ADR-0013
  items 1/4; **no GC runs in v1**). `[disk][charter]`
- **Verdict:** items 3–6 of the charter enumeration are never-combined-live *exposures* (latency,
  orphans), not bugs. **Only the auth boundary is a defect.** `[disk]`

**Scope-shift surfaced by the check (carried into §2):** the edge IP-allowlist must be the
**Vercel Firewall**, not Next middleware — `middleware.ts:28` matcher `'/((?!api|...).*)'` excludes
`/api`, and widening it would run intl + `enforceMfa` (keyed on a `/{locale}/{orgId}/` path shape
API routes lack) on every API route. So the **in-arc code change narrows to Basic Auth only**; IP
allowlisting becomes a Phase-2 Vercel-Firewall operator step. `[disk]`

## 2. Auth design — HTTP Basic Auth (replaces the HMAC check)

**Contract `[docs]`:** Postmark inbound webhooks authenticate via **HTTP Basic Auth** —
credentials embedded in the configured webhook URL (`https://user:pass@host/path`), transmitted as
an `Authorization: Basic <base64(user:pass)>` header. Postmark sends **no** body signature. The
replacement must match this real contract (not a second invented scheme).

**`verifyBasicAuth` (replaces `verifyPostmarkSignature`, `route.ts:70-90`):**

- Username is a **fixed code constant** `POSTMARK_BASIC_AUTH_USERNAME = 'postmark'`; the password
  comes from env (§3). Expected credential: `expectedB64 = base64(`${USERNAME}:${password}`)`.
- Read `req.headers.get('authorization')`. Parse: split on the first space → `[scheme, credential]`.
- **Failure cases — all → 401 `[design][charter]`:**
  1. **Missing** `Authorization` header (`null`).
  2. **Malformed** — no space / scheme (case-insensitive) ≠ `basic` / empty credential.
  3. **Wrong credentials** — `credential` ≠ `expectedB64`.
- **Constant-time + length-guarded compare** (preserving the original's discipline — the old check
  had a `length !== expected.length` pre-guard because `timingSafeEqual` throws on unequal-length
  buffers): hash both sides to a fixed 32 bytes and compare the digests —
  `timingSafeEqual(createHash('sha256').update(credential).digest(),
  createHash('sha256').update(expectedB64).digest())`. Equal length always (no throw, no length
  leak). `[design]`
- **We compare the base64 credential, not the decoded `user:pass`** — so malformed inner content
  (bad base64, no colon) cannot crash the handler; it simply fails to match → 401. This is
  deliberate: the bug we are fixing came from parsing assumptions, so the new check minimizes
  parse surface.
- Import change in `route.ts:31`: drop `createHmac`, add `createHash`, keep `timingSafeEqual` →
  `import { createHash, timingSafeEqual } from 'node:crypto';`.

**IP allowlist:** **NOT in code.** Documented as a Vercel-Firewall operator step in the Phase-2
runbook (Postmark's published webhook IP ranges `[docs]`), keeping changing IPs out of the
codebase. `[design][charter]`

## 3. Env var disposition — atomic rename

`POSTMARK_INBOUND_WEBHOOK_SECRET` → **`POSTMARK_INBOUND_BASIC_AUTH_PASSWORD`** (semantic clarity;
charter §5 refinement 2). **Atomic across every site or `assertEnv` boot-fatals** (a half-rename
leaves boot failing on the missing name):

| Site | Change | `[disk]` ref |
|---|---|---|
| `env.ts` `REQUIRED_SERVER` | rename array entry | `:25` |
| `env.ts` export | rename property + `process.env[...]` read | `:67` |
| `env.ts` comment block | update (Basic Auth password, not HMAC secret) | `:19-25` |
| `route.ts` read | `env.POSTMARK_INBOUND_BASIC_AUTH_PASSWORD` | `:213` |
| `apps/web/.env.example` | rename key + placeholder | `:25` |
| `apps/web/.env.local` (gitignored, operator/local) | rename; value = the test fixture password | — |
| `apps/web/.env.local.example` | verify; add the new key if the local-test convention lists it (it does not list the old one today) | — |
| integration test fixture | `TEST_SECRET` → `TEST_BASIC_AUTH_PASSWORD` | test `:48` |

**Deploy-ordering flag `[design]`:** the new var must exist in the deployed Vercel env
(Production + Preview + staging, mirroring Upstash) **before/with** the code deploy, or the app
boot-fatals (`assertEnv`, `env.ts:42-54`). This is a coordinated code+ops cutover — the Phase-2
runbook's Vercel-env step sets the new name. (The code banks locally; push/deploy is Phil's at arc
close, alongside the runbook ops — so the cutover is naturally co-sequenced, but it MUST be called
out so neither half ships alone.)

## 4. Rejection-taxonomy change

Of the 8-row taxonomy (`route.ts:9-17`), only **row 1** changes:

- **Was:** "HMAC signature invalid → 401 + audit".
- **Now:** "Basic Auth invalid/absent → 401 + audit".
- Audit action `forwarded_mailbox.signature_invalid` → **`forwarded_mailbox.auth_invalid`**
  (`route.ts:222`); `before_state` `{ signature_present }` → `{ auth_present }` (`:223-225`); log
  line `{ signature_present }` → `{ auth_present }` (`:216-219`). Uniform `auth_invalid` for all
  three 401 cases (missing/malformed/wrong) — single pre-resolution audit action.
- No production rows carry the old action (the channel never received real mail), so the rename has
  no historical-data concern. Rows 2–8 unaffected.

## 5. Test rewrite — the regression that would have caught this bug

`forwardedMailbox.handleForwardedMailbox.integration.test.ts` is route-level (imports `POST`) but
mints the HMAC itself (`signedRequest`, `:99-122`), validating a fictional contract. Rewrite it to
the Basic Auth contract:

- **Drop** `import { createHmac }` (`:16`). The rewritten helper needs no `node:crypto`.
- **`signedRequest` → `authedRequest`** (`:99-122`): build `Authorization: Basic
  base64('postmark:' + password)`; support overrides for the failure cases (omit header /
  malformed scheme / wrong credential).
- **Happy-path tests** (#1, #1b, #1c at `:179-337`, #3 at `:366`) call `authedRequest` with valid
  Basic Auth — their bodies are unchanged (they assert substrate shape + the once-on-attachment
  pipeline property + best-effort isolation; all still hold).
- **Rewrite Test #2** (`:339-364`): "Basic Auth failure → 401 + `auth_invalid` audit; zero ingest
  rows". Cover each failure input → 401 (parametrized or separate `it`s, per the read-back ask):
  **missing** `Authorization`, **malformed** (wrong scheme / no space), **wrong** credential. Audit
  assertion targets `forwarded_mailbox.auth_invalid`.
- **Fixture** (`:42-48`): `TEST_SECRET` → `TEST_BASIC_AUTH_PASSWORD`; update the `.env.local`
  comment to the new var name.
- **Acceptance:** a repo grep for `createHmac` / `x-postmark-signature` / `signature_invalid`
  returns **zero** hits in this test file afterward (the read-back ask).

## 6. Comment corrections (the false framing must go)

- `route.ts:63-68` (`verifyPostmarkSignature` doc) — the "Postmark signs the raw body … sends the
  hex digest in `X-Postmark-Signature`" claim is false; replace with the Basic Auth description.
- `route.ts:9-17` taxonomy row 1 wording; `:19` "signature_invalid" mention; `:68` "treated as
  signature_invalid". Reconcile all to `auth_invalid` / Basic Auth.

## 7. Out of scope / do-not-touch

- **`sidecar/client.ts:164` `createHmac` is the Modal sidecar's OWN auth** — unrelated to Postmark.
  **Do not touch.** (The `createHmac` removal is scoped to `route.ts` + the test, not a repo sweep.)
  `[disk]`
- **Phase 2** (combined runbook) and the **live ops + green discharge** — separate (charter §5/§7).
- **Carry to Phase 2 (record now so it doesn't slip):** the fixed username `postmark` + base64-blob
  compare means the operator's Postmark webhook URL must use **exactly** that username
  (`https://postmark:<password>@chounting.chou.ca/api/webhooks/postmark-inbound`). A different
  username 401s **every** delivery; since the audit is uniform `auth_invalid` it is a silent,
  hard-to-diagnose "all deliveries rejected" failure (the bug's own symptom, from a config
  mismatch). The Phase-2 runbook must spell out the username, not just "set the password."
- **Historical docs** (phase-6/7/8 briefs, retrospectives, friction-journal) are point-in-time
  records of what was built then — **not rewritten** (additive-correction discipline). Doc-sync is
  limited to any *present-tense canonical* assertion of the false contract; verify
  `post-v1-revisit-notes.md` framing. The chunk-6.3a brief is historical.
- Read methods (`previewUrl`/`fetchVersion`/`verifyIntegrity`/`delete`), the **multi-attachment
  picking gap**, and the §6-latency/orphan exposures (charter §6) — surfaced, not fixed here.

## 8. Change surface (in-arc files)

`route.ts` (auth fn + import + Step-2 block + audit action + taxonomy/doc comments) ·
`env.ts` (REQUIRED_SERVER + export + comment) · `apps/web/.env.example` · `apps/web/.env.local`
(+ `.env.local.example` verify) · `forwardedMailbox.handleForwardedMailbox.integration.test.ts`
(helper + fixture + Test #2). **Five code/config files + one test.** No migration, no schema, no
new dependency.

## 9. Verification (what Phase-1 proves — and does not)

- `pnpm typecheck` clean.
- The rewritten integration test green: valid Basic Auth → `accepted`; each auth-failure input →
  401 + `auth_invalid` audit; the happy-path substrate assertions still pass (provider mocked to
  `supabase_storage` as today).
- Grep clean: no `createHmac` / `x-postmark-signature` / `signature_invalid` in the route or test.
- `pnpm test:full` green (no regression).
- **Not provable by Phase 1, by design:** that real Postmark Basic-Auth deliveries flow end-to-end.
  A passing route-handler test is **readiness, not PROVEN** — the live discharge is Phase 2 / Phil's
  (charter §7; UNIT-PROVEN ≠ PROVEN).

## 10. Read-back asks

Closest attention on: (1) `verifyBasicAuth` is **constant-time + length-guarded** with **all**
failure paths (missing / malformed / wrong) → 401; (2) the rewritten test exercises **realistic**
Basic Auth request shapes and leaves **no** `createHmac`/signature references anywhere; (3) the env
rename is **atomic** across every §3 site and the **deploy-ordering** (Vercel var before/with
deploy) is honored; (4) the false "Postmark signs the body" comments are actually corrected; (5)
`sidecar/client.ts` is untouched.
