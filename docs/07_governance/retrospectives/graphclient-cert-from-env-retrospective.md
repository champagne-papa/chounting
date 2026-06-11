# Retrospective — graphclient-cert-from-env arc

**Closed:** 2026-06-09 (UNIT-PROVEN; live Graph auth gated on operator ops).
**Chain:** base `3e0130b1` → charter `7dbdb046` → spec `749b2f8e` → plan `89c50dfa` →
execution `189b3a2a` → this closeout. Banked on `staging`; push + lock-release Phil's.
**Lock:** `graphclient-cert-from-env`.

## 1. What the arc did

Fixed a SharePoint-on-Vercel blocker surfaced by a de-risk pass on the `mailbox-sharepoint-live`
runbook: `graphClient` used `@azure/identity`'s **disk-path** `ClientCertificateCredential` overload
(PEM read from `GRAPH_CLIENT_CERT_PATH` on disk), which can't work on Vercel's read-only serverless
filesystem — the SharePoint `put` AND the pipeline's Stage-1 byte-fetch would fail at first Graph
use. Switched to the in-memory `{ certificate }` overload (`:51`), PEM from a base64 env var; renamed
`GRAPH_CLIENT_CERT_PATH` → `GRAPH_CLIENT_CERT_PEM`; added the first graphClient test
(`readGraphConfig`: missing / valid / malformed); doc-synced both SharePoint runbooks; secret
handling (private key → Sensitive).

## 2. The lesson (sharpened) — a rename's blast radius needs a repo-wide grep, not a hand table

The spec's change-surface table (§3) hand-enumerated the rename sites — and **missed the e2e
`RUN_E2E` gate's `GRAPH_CLIENT_CERT_PATH` reference**. The repo-wide grep caught it. The teeth: a
stale ref there fails **no test** — the e2e is skip-gated, so a stale `GRAPH_CLIENT_CERT_PATH` would
just silently keep `RUN_E2E` false (the gate never fires). Neither a targeted run **nor `test:full`**
would surface it; **only a repo-wide grep does.** So for a rename, the grep IS the blast-radius
authority — a hand-enumerated table is a starting point, not the proof.

**Codification disposition:** a graduation **candidate**, banked (not graduated). It reinforces the
codified disk-vs-text-grain / header-lags-the-edit class with a rename-specific, *silent-failure*
sharpening. Datapoint: this arc (the change-surface table missed the e2e gate). Sibling datapoint:
the `mailbox-sharepoint-live` arc's token-scoped grep missing two HMAC-*prose* comments. If it fires
again — the precise "rename → repo-wide grep, because some stale refs misbehave silently rather than
failing tests" shape at N≥3 — route through `codify-convention`.

## 3. What worked

- **The de-risk pass earned its keep:** it found a *code* prerequisite before any operator
  provisioned a real Azure tenant and hit the disk-path wall live. The chain:
  `mailbox-sharepoint-live` shipped UNIT-PROVEN → de-risk found SharePoint-on-Vercel needs
  cert-from-env → this arc.
- **Provenance routing:** §1's exact `{ certificate }` overload was version-confirmed
  (`@azure/identity@4.13.1`) but its definitive close was routed to the **execution typecheck**
  (compile-enforced SDK API), not a contested-source verification — the right backstop for a stable
  API, materially unlike the Postmark contract (which was contested across sources and warranted
  primary-source verification).
- **The malformed-input guard:** `Buffer.from(x,'base64')`'s lenience (Node drops non-base64 chars
  rather than throwing) would have surfaced a fat-fingered value as a cryptic `getToken` crash; the
  PEM-shape validation at the `readGraphConfig` choke point gives a clear typed error instead.

## 4. Carry-forwards

- **Live Graph auth is operator-gated** (Azure `Sites.Selected` + cert + `GRAPH_CLIENT_CERT_PEM` in
  Vercel + per-site grant). UNIT-PROVEN ≠ PROVEN; the first forwarded-email-to-SharePoint discharge
  (mailbox runbook §C) now has its cert prerequisite met **in code**.
- **Pre-existing ADR-0013 §14 drift** — its SharePoint sketch says "OAuth token storage with
  refresh-token discipline," which predates the shipped app-only **cert** auth (Charter B (a)). A
  pre-existing ADR-vs-impl drift, **not this arc's scope** (ratified-contract-scope) — banked.
- **Push precondition:** `GRAPH_CLIENT_CERT_PEM` joins the Vercel-var list, but it is
  **optional-at-boot** → it won't fatal the deploy (SharePoint stays inert until set), unlike the
  Postmark `REQUIRED_SERVER` var.

## 5. Push-readiness three-condition gate

- **C1:** `test:full` **1799 / 0 / 11** at execution `189b3a2a` (the first attempt died on a
  transient Supabase container-restart 502 — infra, not a result; the retry is the real run); the
  closeout commit is docs-only → the baseline carries.
- **C2:** the rename is doc-synced in `.env.example` + both runbooks; no canonical-doc or
  `types.ts` / invariant change. The ADR-0013 §14 drift is pre-existing, banked.
- **C3:** this retrospective + the friction-journal 2026-06-09 entry + the CURRENT_STATE section.
