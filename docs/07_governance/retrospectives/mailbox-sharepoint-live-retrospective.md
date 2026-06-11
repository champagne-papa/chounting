# Retrospective — mailbox-sharepoint-live arc

**Closed:** 2026-06-09 (UNIT-PROVEN; live transfer gated on operator ops).
**Chain:** base `42fa8277` → charter `63729742` → spec `acd6e451` → plan `8e4fcbaa` →
Task 1 `8ebfb0cc` → Task 2 `1f461e0d` → follow-up `a463c73e` → Phase-2 runbook `4f67edd8` →
this closeout. Banked on `staging`; push + lock-release Phil's.
**Lock:** `mailbox-sharepoint-live`.

## 1. What the arc did

- Found and fixed a shipped provider-contract bug: `POST /api/webhooks/postmark-inbound` required
  an `X-Postmark-Signature` HMAC that **Postmark never sends** (its inbound security is HTTP Basic
  Auth + IP allowlist). Every real delivery 401'd; the mailbox channel had never received live mail.
- Replaced the HMAC check with HTTP Basic Auth (constant-time, length-guarded via fixed-length
  SHA-256 digests; all failure paths → 401 + uniform `auth_invalid`); atomic env rename; corrected
  the false comments; rewrote the route test to the documented contract.
- Shipped the combined mailbox→SharePoint onboarding runbook (gated operator tail).

## 2. The core lesson (WRONG → the test validated a fiction)

The bug shipped because the route's only test **self-minted the very `X-Postmark-Signature` HMAC
the handler expected** (`createHmac(...).digest('hex')`), validating a contract Postmark does not
implement. The test passed green against a fiction. This is a **prediction-grounding failure at the
test boundary**: an ungrounded prediction about an external system's behavior, baked into code +
comment + test, none of which checked it against the real contract. The fix's test now constructs
the **documented** contract (RFC 7617 Basic Auth, per Postmark's docs) — honest readiness, with the
live discharge proving the real flow.

## 3. What worked

- **charter→spec→plan→execute with per-task read-back.** Every gate caught something. The spec's
  downstream-path soundness check (added at read-back) surfaced (a) the never-combined-live
  enumeration and (b) the IP-allowlist-belongs-at-the-Vercel-Firewall scope-shift (`middleware.ts`
  matcher excludes `/api`). The env-rename was isolated as a green Task 1; the two-task split kept
  each commit green and reviewable.
- **The soundness check earned its keep twice:** it resolved a `[to-verify]` into a correction
  (`handleForwardedMailbox` = N+1 `storageProvider.put()` + one batch RPC, not `createSourceDocument`)
  and surfaced the firewall scope-shift — both before any live discharge.
- **Widened grep scope at read-back.** The token-scoped grep-clean
  (`createHmac`/`x-postmark-signature`/`signature_invalid`) missed two HMAC-*prose* comments;
  a prose-level grep (`-i hmac`) + the read-back flag caught them (`a463c73e`).
- **Scope protection (load-bearing).** `sidecar/client.ts`'s `createHmac` is the Modal OCR
  sidecar's OWN auth (chounting signs requests to its own endpoint — opposite direction,
  legitimate, both ends controlled). A repo-wide `createHmac` sweep would have broken the OCR
  pipeline; the removal was scoped to `route.ts` + test.

## 4. Codification disposition

No new convention graduated. The arc reinforces two already-codified disciplines:
**prediction-grounding** (the test-validated-a-fiction lesson is its test-boundary instance) and the
**disk-vs-text-grain / header-lags-the-edit** class (the prose-comment residue + the widened grep
scope). Candidate noted (below N≥3): *"a test that self-mints the contract it asserts validates
nothing"* — a sharp anti-pattern worth watching across arcs before graduating.

## 5. Carry-forwards

- **The live discharge is operator-gated** (Azure `Sites.Selected` + cert + `GRAPH_*` in prod
  Vercel + per-site grant + org provisioning + Postmark Basic Auth setup) — no agent can perform it.
  First forwarded email = the PROVEN-LIVE event (runbook §C).
- **Multi-attachment picking gap** (banked, prioritized) still applies.
- **Deploy-ordering** (the renamed boot-required var must be in Vercel before/with deploy) and
  **username-exactness** (`postmark`) — both carried into the runbook flags.

## 6. Push-readiness three-condition gate

- **C1 test-suite health:** `test:full` green (1796 passed / 0 failed / 11 skipped) at the last
  code commit `a463c73e`; subsequent commits are docs-only → the baseline carries.
- **C2 doc-sync:** no schema / invariant / `types.ts` change. The renamed audit action reconciled
  in canonical `audit-permissions.md`; the falsified "HMAC-verified" claim superseded (additive) in
  `post-v1-revisit-notes.md`; historical briefs (phase-6/7/8) left as point-in-time per the
  additive-correction discipline.
- **C3 governance closeout:** this retrospective + the friction-journal 2026-06-09 entry +
  CURRENT_STATE update.
