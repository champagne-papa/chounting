# Spec — graphClient cert-from-env (Phase 1)

**Status:** RATIFIED 2026-06-09 (advisor-cleared the verification seat; ratify + commit-under-lock
delegated to the executor). §1's `:51` overload is WSL-read from installed types; its definitive
close is the execution typecheck (§6). Committed under lock `graphclient-cert-from-env`. Push +
lock-release remain Phil's.
**Realizes:** charter `7dbdb046` (charter → **spec** → plan → execute).
**Anchored at:** `staging == origin/staging == 3e0130b1`; charter `7dbdb046`. All code + installed
types read `[disk]` first-hand this session. Lock `graphclient-cert-from-env`.
**Provenance legend:** `[disk]` grounded first-hand; `[design]` decided here; `[charter]` fixed by
the charter.

---

## 1. Pinned overload (spec opens here)

`@azure/identity@4.13.1` `ClientCertificateCredential` has three constructor overloads (read from
the installed `dist/commonjs/credentials/clientCertificateCredential.d.ts`): `[disk]`

- `:29` `(tenantId, clientId, certificatePath: string, options?)` — the **current** (disk-path) call.
- `:40` `(…, configuration: ClientCertificatePEMCertificatePath, …)` — path via config object.
- `:51` `(…, configuration: ClientCertificatePEMCertificate, …)` — **the fix's overload**, where
  `ClientCertificatePEMCertificate = { certificate: string; certificatePassword?: string }`
  (`clientCertificateCredentialModels.d.ts`).

The fix calls `new ClientCertificateCredential(tenantId, clientId, { certificate: pemString })`.
Settled. `[disk]`

## 2. Settled decisions

- **base64 PEM env var + decode in `readGraphConfig`.** `[design]` The env var carries a
  **base64-encoded** PEM (a raw multi-line PEM risks newline-mangling across Vercel/shell).
  `readGraphConfig` reads it, base64-decodes to the PEM string, validates it (below), and returns
  `{ tenantId, clientId, certificatePem }`. `getGraphClient` passes `{ certificate: certificatePem }`
  to the `:51` overload. (Decode lives in `readGraphConfig` so the validation + the typed error sit
  at the single config-reading choke point.)
- **Replace (option A).** `[design][charter]` `GRAPH_CLIENT_CERT_PEM` **replaces**
  `GRAPH_CLIENT_CERT_PATH` (the only deployed consumer is Vercel; local dev uses mocks / the gated
  e2e and can base64 a local cert; the disk-path overload would reserve a capability with no
  consumer). The disk-path call site is removed.
- **Malformed-input validation → clear typed error.** `[design]` `Buffer.from(x, 'base64')` does
  **not** throw on invalid input (Node silently drops non-base64 chars), so a bad value would
  otherwise surface as a cryptic error at `getToken` time. `readGraphConfig` therefore validates the
  decoded string is **PEM-shaped** (contains `-----BEGIN` … `-----END`); if not, throw a typed
  `ServiceError('STORAGE_OPERATION_FAILED', 'GRAPH_CLIENT_CERT_PEM is not a valid base64-encoded
  PEM …', { stage: 'graph_config' })` — diagnosable, mirroring the existing missing-var error shape.
- **Secret handling.** `[charter]` `GRAPH_CLIENT_CERT_PEM` is a **private key** → never logged;
  `.env.example` + both runbooks document it as a **Sensitive** Vercel env var.
- **Test seam.** `[design]` Export `readGraphConfig` (alongside the existing
  `__resetGraphClientForTest` seam) so the missing / valid-base64 / malformed cases are unit-testable
  without constructing a real credential or touching Graph.

## 3. Change surface (in-arc) `[disk]`

| File | Change |
|---|---|
| `graphClient.ts` | `readGraphConfig` reads `GRAPH_CLIENT_CERT_PEM`, base64-decodes + PEM-validates, returns `certificatePem`; `getGraphClient` uses the `{ certificate }` overload (`:88-92`); export `readGraphConfig`; correct the `:79-80` disk-path comment. No `node:fs` (none today; confirm none introduced). |
| `env.ts:79` | rename export property **+** `process.env` key `GRAPH_CLIENT_CERT_PATH` → `GRAPH_CLIENT_CERT_PEM` (both flip; optional-at-boot, no `!`); update the `:68-74` comment. |
| `apps/web/.env.example:52` | rename key + placeholder; comment notes base64 + **Sensitive**. (`.env.local` has no GRAPH_* — no edit.) |
| `graphClient` test (new) | `readGraphConfig`: missing → `ServiceError` (right `missing` list); valid base64 PEM → decoded PEM; malformed-base64 / non-PEM → clear typed `ServiceError`. |
| both runbooks | doc-sync the disk-path cert step → `GRAPH_CLIENT_CERT_PEM` (base64, Sensitive). |

## 4. Boundary

- **In-arc:** the graphClient fix + env rename + the new test + doc-sync (both runbooks).
- **NOT in-arc:** live Graph auth (operator-gated — Azure `Sites.Selected` app + cert + the new
  `GRAPH_CLIENT_CERT_PEM` in Vercel + per-site grant). A passing `readGraphConfig` test is
  **readiness, not proof** that live Graph auth works — that's the SharePoint discharge.
  UNIT-PROVEN ≠ PROVEN.
- **No boot-fatal:** GRAPH_* optional-at-boot → a deploy with the renamed var absent does not crash
  the app; the `sharepoint_drive` provider stays inert/throws-on-use until set (the intended gated
  state).
- Env (staging vs prod) deferred to setup. Push + lock-release Phil's.

## 5. Plan (next phase) — likely one commit

The change is tightly coupled (env rename + graphClient read/use + test all reference the var), so
it lands as one green commit (TDD: write the `readGraphConfig` test → RED → implement → GREEN),
with the runbook doc-sync. Plan phase decides single-vs-split.

## 6. Verification (what Phase-1 proves)

`pnpm typecheck` clean (the `{ certificate }` overload is the pinned `:51` signature); the new
graphClient test green (missing / valid / malformed); `pnpm test:full` green. **Not provable:** live
Graph auth (the discharge).

## 7. Read-back asks

Closest attention on: (1) §1's pinned overload is the right one (`:51` `{ certificate }`); (2) §2's
malformed-input validation actually produces a clear typed error (the `Buffer.from` lenience point);
(3) the §2 replace (A) decision + secret handling; (4) §3's rename is atomic (env.ts property + key
both flip) and the test seam (`readGraphConfig` export) is the right shape.
