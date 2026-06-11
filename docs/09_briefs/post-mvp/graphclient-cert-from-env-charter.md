# Charter — graphClient cert-from-env (SharePoint-on-Vercel prerequisite)

**Status:** RATIFIED 2026-06-09 (advisor-cleared the verification seat; ratify + commit-under-lock
delegated to the executor). rev.1 folds read-back: secret-handling (private key → Sensitive, never
log), the malformed-input test case, the (A)-replace lean, and the §2 overload-pin provenance note.
Committed under lock `graphclient-cert-from-env`. Push + lock-release remain Phil's.
**Anchored at:** `staging == origin/staging == 3e0130b1` (re-baselined this session; all code read
`[disk]` first-hand). Reflog/log tail = the just-shipped `mailbox-sharepoint-live` arc.
**Coordination:** session lock `graphclient-cert-from-env`.
**Provenance legend:** `[disk]` grounded first-hand this session; `[design]` a steer for the spec;
`[charter]` fixed here.

A small **code arc** (charter → spec → plan → execute) and the **gating prerequisite** for the
mailbox→SharePoint live discharge on Vercel. Surfaced by a de-risk pass on the
`mailbox-sharepoint-live` runbook.

---

## 1. The blocker (load-bearing)

`graphClient.ts:88-92` builds Graph auth with the **disk-path** overload:
`new ClientCertificateCredential(tenantId, clientId, certificatePath)`, reading the PEM from
`GRAPH_CLIENT_CERT_PATH` — the code's own comment (`:79-80`) says it "reads the certificate from
disk at the configured path." `[disk]`

**`chounting.chou.ca` is a Vercel (serverless) deployment** — the runtime filesystem is read-only
except an ephemeral per-invocation `/tmp`, so **there is no stable path to place a PEM file.** The
SharePoint half of the discharge would fail at first Graph use (the `readGraphConfig` path resolving
to a nonexistent file). This is the same class as the Postmark bug just fixed: an assumption ("place
it on the deploy host") that doesn't hold against the real runtime. `[disk]`

**It gates the whole goal, both halves:** `handleForwardedMailbox`'s SharePoint `put` AND the
pipeline's **Stage 1 byte-fetch** (which re-reads the bytes back from Graph) both need working Graph
auth — so until this lands, no file lands in SharePoint and no card is produced. `[disk]`

## 2. The fix (confirmed available)

`@azure/identity@4.13.1` ships the **in-memory PEM overload** `ClientCertificatePEMCertificate
{ certificate: string }` alongside the path one — so
`new ClientCertificateCredential(tenantId, clientId, { certificate: pemString })`, with the PEM read
from an env var, is the serverless-correct pattern. Contained: ~one function. `[disk]`

**Provenance:** `apps/web/package.json` declares `"@azure/identity": "^4.13.1"` `[disk]`; the
`ClientCertificatePEMCertificate { certificate: string }` config type is read from the installed
`@azure/identity` types `[disk]`. The exact **constructor overload** accepting that config object is
pinned against the installed `.d.ts` at spec-open (the spec must, to write correct code) — a stable
v4 core API; any mismatch fails typecheck immediately, so this is not a contested-external-contract
situation.

## 3. Confirmed blast radius `[disk]`

- **`graphClient.ts`** — `readGraphConfig` (`:46-76`: read + missing-check + return) and
  `getGraphClient` (`:88-92`: the call site); comments `:14`, `:79-80`.
- **`env.ts:79`** — `GRAPH_CLIENT_CERT_PATH` export property **+** its `process.env` read (both flip
  together). **OPTIONAL at boot** (no `!`, NOT in `REQUIRED_SERVER`) → **no boot-fatal risk** on
  rename (contrast the Postmark `REQUIRED_SERVER` rename). The comment block `:68-74` describes the
  GRAPH_* trio.
- **`apps/web/.env.example:52`** — the templated `GRAPH_CLIENT_CERT_PATH=...` line (+ its comment
  `:42-48`). **`.env.local` has no GRAPH_*** (optional, unset locally → no local edit).
- **Test gap:** no dedicated graphClient test exists — the `sharepointDriveProvider` tests inject a
  mock `GraphIo`, bypassing `getGraphClient`/`ClientCertificateCredential` entirely. The auth
  construction is **untested**; the fix adds the first graphClient test (same gap-shape as the
  route-auth test in the prior arc).

## 4. Spec decisions to settle (against disk)

- **Introduce `GRAPH_CLIENT_CERT_PEM`** (base64 PEM). Whether it **renames** or is **added
  alongside** `GRAPH_CLIENT_CERT_PATH` is the replace-vs-augment decision below; if a rename, it is
  atomic across the §3 sites (optional-at-boot, but the export property + `process.env` read still
  flip together — same atomic-rename discipline, lighter blast radius). `[design]`
- **Raw vs base64-encoded PEM in the env var.** `[design]` steer: **base64** (a raw multi-line PEM
  in an env var risks newline-mangling across Vercel/shell); `graphClient` base64-decodes before
  passing to `{ certificate }`. The spec settles this and **where** the decode happens
  (`readGraphConfig` vs `getGraphClient`).
- **Test shape.** Cover `readGraphConfig`: missing var → typed `ServiceError` with the right
  `missing` list; present (base64) var → decoded PEM returned; **malformed-base64 / non-PEM value →
  a clear typed `ServiceError`** (diagnosable, not a cryptic credential-construction crash — same
  spirit as the prior arc's username-trap clarity). (Live credential construction + Graph auth stay
  gated to the operator discharge — UNIT-PROVEN ≠ PROVEN.)
- **Replace vs augment `GRAPH_CLIENT_CERT_PATH`** (decide deliberately, don't default): **(A)
  replace** — `GRAPH_CLIENT_CERT_PEM` supersedes the path var; single Vercel-correct auth path,
  cleanest, but drops the disk-path overload. **(B) augment** — support both; prefer the PEM var if
  present, else fall back to the path var, preserving the disk-path overload for non-Vercel /
  traditional hosts + local dev (a two-source `readGraphConfig`, slightly more code). No deployed
  consumer exists today, so either is migration-safe; the call is whether the disk-path capability
  is worth keeping. **Lean (A) replace** — the only deployed consumer is Vercel; local dev exercises
  Graph via mocks / the gated e2e (it can use a base64'd local cert too), so the path overload
  reserves a capability with no consumer. Spec confirms. `[design]`
- **Secret handling — `GRAPH_CLIENT_CERT_PEM` is a PRIVATE KEY.** Treat it as a secret: set it
  **Sensitive** in Vercel, never log it (higher-stakes than the Postmark password; same class as the
  prior arc's URL-credential-leak flag). `readGraphConfig` / `getGraphClient` must not log the
  value; the §6 runbook doc-sync carries "set Sensitive, never log." `[design]`

## 5. Boundary

- **In-arc:** the graphClient in-memory-overload fix + the env rename + the first graphClient test +
  **doc-sync into BOTH SharePoint runbooks** (§6).
- **NOT in-arc:** the live Graph auth proof (operator-gated — Azure `Sites.Selected` app + cert +
  the new `GRAPH_CLIENT_CERT_PEM` in Vercel + per-site grant). A passing `readGraphConfig` test is
  readiness, not proof that live Graph auth works — that's the SharePoint discharge.
- **No boot-fatal, lighter deploy concern:** GRAPH_* are optional-at-boot, so a deploy with the
  renamed var absent does NOT crash the app; the `sharepoint_drive` provider simply stays
  inert/throws-on-use until the operator sets `GRAPH_CLIENT_CERT_PEM` — the intended gated state.
- **Env choice (staging vs prod)** is downstream and deferred to setup time; this fix is
  env-agnostic.
- Push + lock-release remain Phil's at arc close.

## 6. Disk-vs-doc reconciliation (in-arc doc-sync)

Both SharePoint runbooks encode the traditional-host disk-path assumption and must be reconciled to
cert-from-env:
- **`runbooks/charter-b-sharepoint-onboarding.md` step 2** ("place the private key PEM on the deploy
  host; set `GRAPH_CLIENT_CERT_PATH`").
- **`runbooks/mailbox-sharepoint-onboarding.md` §A** (cross-references the above + names
  `GRAPH_CLIENT_CERT_PATH`).

Both must document setting `GRAPH_CLIENT_CERT_PEM` (base64 PEM) as a **Sensitive** Vercel env var,
never logged.

## 7. Read-back asks

Closest attention on: (1) §1's blocker + §3's blast radius match disk (esp. the optional-at-boot
no-boot-fatal contrast); (2) the §4 spec cut is right (rename + base64 + test + hard-rename); (3)
§5 holds the UNIT-PROVEN≠PROVEN line (the test is readiness, live Graph auth is the discharge); (4)
§6 names both runbooks' stale cert step.
