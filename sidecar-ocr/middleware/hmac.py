"""HMAC-SHA256 verification middleware per ADR-0014 §3.

The TS-side client at apps/web/src/agent/orchestrator/extraction/sidecar/client.ts
computes HMAC-SHA256(request_body, MODAL_OCR_HMAC_SECRET) and sends it as
the X-Auth-HMAC header (hex-encoded). The sidecar re-computes the HMAC over
the same body using the shared secret pulled from Modal secret store and
compares constant-time.

Mismatch → 401 Unauthorized; routes to PIPELINE_UNAVAILABLE on TS side
per ADR-0014 §12.2 persistent unavailable.
"""

from __future__ import annotations

import hmac
import hashlib


def verify_hmac(body_bytes: bytes, provided_signature_hex: str, secret: str) -> bool:
    """Constant-time HMAC-SHA256 verification.

    Returns True iff hex(HMAC-SHA256(body_bytes, secret)) == provided_signature_hex.
    Constant-time compare prevents timing attacks per OWASP guidance.
    """
    if not provided_signature_hex or not secret:
        return False

    expected = hmac.new(
        key=secret.encode("utf-8"),
        msg=body_bytes,
        digestmod=hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(expected, provided_signature_hex)


def compute_hmac(body_bytes: bytes, secret: str) -> str:
    """Companion to verify_hmac; produces hex-encoded HMAC-SHA256 signature.

    Used in test fixtures + as reference for the TS-side client
    implementation. Production sidecar only verifies; client computes.
    """
    return hmac.new(
        key=secret.encode("utf-8"),
        msg=body_bytes,
        digestmod=hashlib.sha256,
    ).hexdigest()
