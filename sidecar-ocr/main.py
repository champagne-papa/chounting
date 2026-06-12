"""Modal OCR sidecar — Phase 7 chunk 7.1b.

Per ADR-0014 §2 (PaddleOCR v1 locked) + §3 (Modal sidecar topology;
shared-secret HMAC authentication; X-Trace-Id propagation; Zod-bound
schema boundary). The sidecar runs PaddleOCR PP-OCRv4 inference and
returns structured output matching the TS-side OCRResponseSchema.

Statelessness: every request carries everything it needs; no session
state persists between requests; container restarts do not affect
correctness (ADR-0014 §3).

Authentication: HMAC-SHA256 over canonical request content (the
{bytes_b64, content_hash, trace_id} fields serialized as canonical
JSON) using MODAL_OCR_HMAC_SECRET; verified via middleware/hmac.py
before any OCR work. v1 ships the signature inside the JSON body
under __hmac_signature key (Modal @modal.fastapi_endpoint simplification);
ADR-0014 §3 X-Auth-HMAC header form is post-v1 amendment per chunk
7.1b §1.2 (ζ) divergence absorption.

Trace propagation: trace_id embedded in request body and echoed in
response body for cross-process tracing.

v1 manual deployment: `modal deploy main.py` from sidecar-ocr/. See
README.md for full deployment runbook.
"""

from __future__ import annotations

import json
import os

import modal

from middleware.hmac import verify_hmac
from schemas.extraction import OCRRequest, OCRResponse, DocumentArtifact


app = modal.App("chounting-ocr-sidecar")

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install_from_requirements("requirements.txt")
    .apt_install("libgl1", "libglib2.0-0")
    # Bake the PP-OCRv4 model weights into the image at BUILD time so the
    # FIRST (cold) request does not pay the ~50s runtime download.
    #
    # Incident 2026-06-11: PaddleOCR lazily downloads its det/rec/cls weights
    # on first construction. In production that download ran INSIDE the first
    # OCR request (~50s of bcebos.com `.tar` fetches), pushing the synchronous
    # webhook -> OCR -> classify chain past its function time budget so the
    # document_case stalled at `received` after classify. Warm runs are ~5s.
    #
    # Path resolution: PaddleOCR 2.7.x caches weights under
    # `~/.paddleocr/whl/{det,rec,cls}/...`. Modal builds AND runs debian_slim
    # as root (HOME=/root) in both this build step and the runtime container,
    # so weights downloaded here to /root/.paddleocr are found at runtime with
    # no re-download. The warm-up MUST mirror the runtime constructor args
    # (use_angle_cls=True, lang='en' in run_ocr) so the SAME three model sets
    # (en det + en rec + cls) are cached.
    .run_commands(
        "python -c \"from paddleocr import PaddleOCR; "
        "PaddleOCR(use_angle_cls=True, lang='en')\""
    )
    # Phase 7 v1 close demo fix-forward (2026-05-20; chunk-7.1b-impl-grade
    # local-deploy-substrate-gap N=5): Modal copies only the file
    # containing @app decorators by default; sibling middleware/ + schemas/
    # subpackages must be explicitly mounted, otherwise container crashes
    # at cold-start with `ModuleNotFoundError: No module named 'middleware'`.
    .add_local_python_source("middleware", "schemas")
)


def _canonical_signing_body(payload: dict) -> bytes:
    """Canonical JSON of the signed content fields per HMAC discipline.

    Signs only the content fields the TS-side client populates; excludes
    the __hmac_signature field itself (otherwise the signature would
    be circular with the body it signs).
    """
    signed_subset = {
        "bytes_b64": payload.get("bytes_b64", ""),
        "content_hash": payload.get("content_hash", ""),
        "trace_id": payload.get("trace_id", ""),
    }
    return json.dumps(signed_subset, sort_keys=True, separators=(",", ":")).encode(
        "utf-8"
    )


@app.function(image=image, secrets=[modal.Secret.from_name("modal-ocr-hmac-secret")])
@modal.fastapi_endpoint(method="POST")
def run_ocr(request: dict) -> dict:
    """OCR endpoint per ADR-0014 §3 topology contract.

    Input: JSON request body matching OCRRequest Pydantic shape plus
    __hmac_signature field (HMAC-SHA256 of canonical signed body).
    Output: JSON response body matching OCRResponse Pydantic shape.
    """
    from fastapi import HTTPException

    secret = os.environ.get("MODAL_OCR_HMAC_SECRET")
    if not secret:
        raise HTTPException(status_code=503, detail="MODAL_OCR_HMAC_SECRET missing")

    signing_body = _canonical_signing_body(request)
    signature = request.get("__hmac_signature", "")

    if not verify_hmac(signing_body, signature, secret):
        raise HTTPException(status_code=401, detail="HMAC verification failed")

    try:
        parsed = OCRRequest.model_validate(
            {
                "bytes_b64": request["bytes_b64"],
                "content_hash": request["content_hash"],
                "trace_id": request["trace_id"],
            }
        )
    except Exception as parse_err:  # pragma: no cover — Pydantic ValidationError
        raise HTTPException(
            status_code=400, detail=f"Pydantic validation failed: {parse_err}"
        ) from parse_err

    started_at = _isoformat_now()

    # PaddleOCR inference. Lazy-import to keep cold-start lean.
    import base64
    import uuid as _uuid

    try:
        from paddleocr import PaddleOCR

        ocr_engine = PaddleOCR(use_angle_cls=True, lang="en")
        bytes_decoded = base64.b64decode(parsed.bytes_b64)
        tmp_path = f"/tmp/{_uuid.uuid4()}.pdf"
        with open(tmp_path, "wb") as f:
            f.write(bytes_decoded)
        ocr_result = ocr_engine.ocr(tmp_path)
        os.unlink(tmp_path)
    except Exception as ocr_err:
        raise HTTPException(
            status_code=500, detail=f"OCR inference failed: {ocr_err}"
        ) from ocr_err

    completed_at = _isoformat_now()

    # Marshal PaddleOCR output into DocumentArtifact shape per
    # ADR-0011 §5 document_artifacts schema.
    lines = []
    if ocr_result and isinstance(ocr_result, list):
        for page_result in ocr_result:
            if page_result:
                for line in page_result:
                    if line and len(line) >= 2:
                        bbox = line[0]
                        text, confidence = line[1]
                        lines.append(
                            {
                                "text": text,
                                "bbox": bbox,
                                "confidence": float(confidence),
                            }
                        )

    artifact = DocumentArtifact(
        engine="paddleocr",
        engine_version="paddleocr-2.7-pp-ocrv4",
        pages={"count": len(ocr_result) if ocr_result else 0},
        lines=lines,
        words={"count": sum(len((line.get("text", "")).split()) for line in lines)},
        quality_flags=[],
        confidence=(
            sum(line["confidence"] for line in lines) / len(lines) if lines else None
        ),
    )

    response = OCRResponse(
        artifact=artifact,
        ocr_run={
            "engine": "paddleocr",
            "engine_version": "paddleocr-2.7-pp-ocrv4",
            "status": "completed",
            "started_at": started_at,
            "completed_at": completed_at,
        },
        extraction_run={
            "extraction_version": "pp-ocrv4-v1",
            "started_at": started_at,
            "completed_at": completed_at,
        },
        trace_id=parsed.trace_id,
    )

    return response.model_dump()


def _isoformat_now() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()
