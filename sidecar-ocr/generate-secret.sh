#!/usr/bin/env bash
# Phase 7 chunk 7.1b — HMAC secret generator.
#
# Produces 32-byte (256-bit) random secret as hex string. Output to
# stdout; operator pipes into Modal secret store + apps/web/.env.local.
#
# Usage:
#   bash generate-secret.sh           # prints secret to stdout
#   SECRET=$(bash generate-secret.sh)
#   modal secret create modal-ocr-hmac-secret MODAL_OCR_HMAC_SECRET="$SECRET"
#     ^ KEY must be MODAL_OCR_HMAC_SECRET (the container env-var name read at
#       main.py:81), NOT value= — a mismatched KEY → 503 at runtime.
#   echo "MODAL_OCR_HMAC_SECRET=$SECRET" >> apps/web/.env.local
#
# Per ADR-0014 §3 v1 manual rotation; runbook in README.md §"Secret
# rotation policy (v1 manual)".

set -euo pipefail

if command -v openssl &>/dev/null; then
  openssl rand -hex 32
elif [ -e /dev/urandom ]; then
  head -c 32 /dev/urandom | xxd -p -c 256
else
  echo "ERROR: no secure RNG available (need openssl or /dev/urandom)" >&2
  exit 1
fi
