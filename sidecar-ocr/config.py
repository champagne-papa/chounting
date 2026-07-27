"""Deployment-target names for the OCR sidecar.

Parameterizes the three Modal resource names so a SEPARATE, fully isolated
dev sidecar can be deployed without editing tracked source:

    MODAL_APP_NAME          -> modal.App(...)                 (main.py)
    MODAL_OCR_SECRET_NAME   -> modal.Secret.from_name(...)    (main.py)
    MODAL_OCR_VOLUME_NAME   -> modal.Volume.from_name(...)    (main.py)

THE DEFAULTS ARE LOAD-BEARING. They must remain byte-identical to the
values prod is deployed with — a wrong default silently retargets the next
`modal deploy` at a different app/secret/volume. test_config.py pins all
three against the literal prod strings for exactly this reason.

NOT parameterized: the INNER key of the secret, which stays the literal
`MODAL_OCR_HMAC_SECRET` that `run_ocr` reads from os.environ (main.py).
Only the secret's NAME in the Modal store varies. Getting this backwards
yields a 503 ("MODAL_OCR_HMAC_SECRET missing"), not a 401 — the trap
generate-secret.sh has warned about since the Session 42 fix-forward.

Volume isolation: a dev deployment MUST use its own volume name. run_ocr
mounts the volume READ-WRITE (main.py `volumes={PADDLE_HOME: ...}`), so a
dev app sharing prod's `paddleocr-models` would hold write access to the
weights prod's OCR depends on. Own volume costs one `populate_models` run;
sharing reintroduces prod blast radius.

Deploy dev:

    MODAL_APP_NAME=chounting-ocr-sidecar-dev \
    MODAL_OCR_SECRET_NAME=modal-ocr-hmac-secret-dev \
    MODAL_OCR_VOLUME_NAME=paddleocr-models-dev \
    modal deploy main.py

Dependency-free (stdlib `os` only) so it is importable — and testable —
without `modal` or `pydantic` installed.
"""

from __future__ import annotations

import os

# Prod values. Changing these changes what an un-overridden deploy targets.
DEFAULT_APP_NAME = "chounting-ocr-sidecar"
DEFAULT_SECRET_NAME = "modal-ocr-hmac-secret"
DEFAULT_VOLUME_NAME = "paddleocr-models"


def app_name() -> str:
    """Modal app name; defaults to the prod app."""
    return os.environ.get("MODAL_APP_NAME", DEFAULT_APP_NAME)


def secret_name() -> str:
    """Modal secret NAME (not its inner key); defaults to the prod secret."""
    return os.environ.get("MODAL_OCR_SECRET_NAME", DEFAULT_SECRET_NAME)


def volume_name() -> str:
    """Modal weights-volume name; defaults to the prod volume."""
    return os.environ.get("MODAL_OCR_VOLUME_NAME", DEFAULT_VOLUME_NAME)
