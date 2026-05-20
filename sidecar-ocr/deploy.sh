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

if ! modal token current &>/dev/null; then
  echo "ERROR: Modal CLI not authenticated. Run: modal token new" >&2
  exit 1
fi

# Verify HMAC secret exists in Modal secret store (best-effort).
if ! modal secret list 2>/dev/null | grep -q "modal-ocr-hmac-secret"; then
  echo "WARNING: modal-ocr-hmac-secret not found in Modal secret store." >&2
  echo "Run: modal secret create modal-ocr-hmac-secret value=\$(bash generate-secret.sh)" >&2
  echo "Continuing deploy; sidecar will return 503 on requests until secret is set." >&2
fi

echo "Deploying chounting-ocr-sidecar to Modal..."
modal deploy main.py

echo ""
echo "Deployment complete. Copy the printed URL into apps/web/.env.local:"
echo "  MODAL_OCR_SIDECAR_URL=<url>"
