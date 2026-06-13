#!/usr/bin/env bash
# Phase 7 chunk 7.1b — Modal sidecar deployment wrapper.
#
# Invokes `modal deploy main.py` from sidecar-ocr/. Founder runs this
# after Modal account setup + HMAC secret provisioning (see README.md).
#
# Usage:
#   cd sidecar-ocr
#   bash deploy.sh
#
# Output: Modal prints the deployed endpoint URL on success. Copy URL
# into apps/web/.env.local as MODAL_OCR_SIDECAR_URL=<url>.

set -euo pipefail

cd "$(dirname "$0")"

if ! command -v modal &>/dev/null; then
  echo "ERROR: modal CLI not found. Install via: pip install modal" >&2
  echo "Then authenticate: modal token new" >&2
  exit 1
fi

if ! modal token info &>/dev/null; then
  echo "ERROR: Modal CLI not authenticated. Run: modal token new" >&2
  exit 1
fi

# Verify HMAC secret exists in Modal secret store (best-effort).
if ! modal secret list 2>/dev/null | grep -q "modal-ocr-hmac-secret"; then
  echo "WARNING: modal-ocr-hmac-secret not found in Modal secret store." >&2
  echo "Run: modal secret create modal-ocr-hmac-secret MODAL_OCR_HMAC_SECRET=\$(bash generate-secret.sh)" >&2
  # KEY name must be MODAL_OCR_HMAC_SECRET (matches main.py:75 env-var lookup).
  # README chunk-7.1b documented `value=<secret>` was incorrect; Phase 7 v1
  # close demo Session 42 fix-forward 2026-05-20 corrected both surfaces.
  echo "Continuing deploy; sidecar will return 503 on requests until secret is set." >&2
fi

echo "Deploying chounting-ocr-sidecar to Modal..."
modal deploy main.py

echo ""
echo "Deployment complete. Copy the printed URL into apps/web/.env.local:"
echo "  MODAL_OCR_SIDECAR_URL=<url>"
echo ""
echo "FRESH MODAL ENVIRONMENT ONLY — populate the model-weights Volume once:"
echo "  modal run main.py::populate_models"
echo "(Skip on routine redeploys; the paddleocr-models Volume persists. An empty"
echo " Volume makes run_ocr return HTTP 503 'weights missing from Volume'.)"
