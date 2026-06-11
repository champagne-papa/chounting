# chounting-ocr-sidecar

Modal sidecar for PaddleOCR inference. Phase 7 chunk 7.1b substrate.

## Architecture

Per ADR-0014 §3 (Python sidecar topology + language boundary):

- **Platform:** Modal (containerized Python deployment with GPU support).
- **Engine:** PaddleOCR PP-OCRv4 (deterministic; preserves Q30 byte-for-byte reproducibility).
- **Topology:** Request/response over HTTP; stateless sidecar; HMAC-authenticated.
- **Schema boundary:** TS Zod (source of truth) → JSON Schema → Pydantic (this repo).

## Deployment runbook

### One-time Modal account setup

1. Create a Modal account at https://modal.com (founder grade).
2. Install Modal CLI: `pip install modal`.
3. Authenticate: `modal token new`.
4. Verify: `modal token current` (prints account info).

### HMAC secret provisioning

The Next.js app and Modal sidecar share a 32-byte HMAC secret used to
sign + verify request bodies. v1 ships manual rotation per ADR-0014 §3.

1. Generate the secret: `bash generate-secret.sh` (outputs to stdout).
2. Set on Next.js side: append to `apps/web/.env.local`:
   ```
   MODAL_OCR_HMAC_SECRET=<secret>
   ```
3. Set on Modal side: `modal secret create modal-ocr-hmac-secret MODAL_OCR_HMAC_SECRET=<secret>`.
   **Important:** the KEY name must be exactly `MODAL_OCR_HMAC_SECRET` (not
   `value`); the KEY becomes the env var name inside the deployed Modal
   container, and `main.py:75` reads `os.environ.get("MODAL_OCR_HMAC_SECRET")`.
   Mismatched KEY → 503 `MODAL_OCR_HMAC_SECRET missing` at runtime. Chunk
   7.1b shipped with `value=<secret>` documentation; Phase 7 v1 close demo
   surfaced the mismatch + corrected per chunk-7.1b-impl-grade local-deploy-
   substrate-gap sub-pattern N=6 (Session 42 fix-forward 2026-05-20).

### Deploy

```bash
cd sidecar-ocr
bash deploy.sh
```

This invokes `modal deploy main.py`. Modal prints the deployed endpoint
URL (e.g., `https://<workspace>--chounting-ocr-sidecar-run-ocr.modal.run`).

### Wire endpoint into Next.js

Append the deployed endpoint URL to `apps/web/.env.local`:

```
MODAL_OCR_SIDECAR_URL=https://<workspace>--chounting-ocr-sidecar-run-ocr.modal.run
```

### Run E2E test

With both `MODAL_OCR_HMAC_SECRET` and `MODAL_OCR_SIDECAR_URL` set:

```bash
cd apps/web
pnpm test:integration tests/integration/sidecarE2E.integration.test.ts
```

The E2E test skips automatically when either env var is missing (CI
default; founder runs locally post-deployment).

## Secret rotation policy (v1 manual)

1. Generate new secret: `bash generate-secret.sh`.
2. Update Modal secret: `modal secret update modal-ocr-hmac-secret MODAL_OCR_HMAC_SECRET=<new>` (KEY name must match container's env var lookup; see HMAC secret provisioning step 3).
3. Update Next.js `.env.local` + Vercel production env: `MODAL_OCR_HMAC_SECRET=<new>`.
4. Restart Next.js (Vercel auto-redeploys on env var change).

Post-v1: automated rotation with key versioning + multi-secret overlap
windows (ADR-0014 §3 forward-pointed; not v1 scope).

## File layout

- `main.py` — Modal app + `@modal.web_endpoint` for `run_ocr`.
- `schemas/extraction.py` — Pydantic models mirroring TS Zod schemas.
- `middleware/hmac.py` — HMAC-SHA256 verification.
- `modal.yaml` — Modal config (app name + dependencies + runtime).
- `requirements.txt` — Python deps (modal, paddleocr, paddlepaddle, pydantic).
- `deploy.sh` — Modal CLI invocation wrapper.
- `generate-secret.sh` — 32-byte random secret generator.
- `schemas/json/` — JSON Schema files synced from TS Zod (chunk 7.1b Task 7.1b.4).

## Per-stage budget

Per ADR-0014 §12.1 + 2026-05-20 chunk 7.1b amendment: Stage 2 (OCR) uses
~30s wall-clock budget accommodating Modal cold-start (5-8s typical) +
up to 3 retries with exponential backoff. The TS-side client at
`apps/web/src/agent/orchestrator/extraction/sidecar/client.ts` enforces
a 60s per-request timeout via `AbortController` (`PER_REQUEST_TIMEOUT_MS = 60_000`).
