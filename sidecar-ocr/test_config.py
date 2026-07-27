"""Tests for config.py deployment-target name resolution.

Stdlib unittest (no pytest dependency) and imports only config.py, which is
dependency-free — so these run without `modal` or `pydantic` installed.

Run:  cd sidecar-ocr && python3 -m unittest -v
"""

from __future__ import annotations

import os
import pathlib
import unittest

import config

ENV_KEYS = ("MODAL_APP_NAME", "MODAL_OCR_SECRET_NAME", "MODAL_OCR_VOLUME_NAME")


class _CleanEnv(unittest.TestCase):
    """Removes the three override vars so defaults are exercised honestly."""

    def setUp(self) -> None:
        self._saved = {k: os.environ.pop(k, None) for k in ENV_KEYS}

    def tearDown(self) -> None:
        for k, v in self._saved.items():
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v


class TestDefaultsAreProdValues(_CleanEnv):
    """With NO env vars set the names MUST be the prod values.

    Pinned against literal strings rather than config.DEFAULT_* so that
    editing a default fails here instead of silently retargeting the next
    prod `modal deploy` at a different app, secret, or volume.
    """

    def test_app_name_defaults_to_prod(self) -> None:
        self.assertEqual(config.app_name(), "chounting-ocr-sidecar")

    def test_secret_name_defaults_to_prod(self) -> None:
        self.assertEqual(config.secret_name(), "modal-ocr-hmac-secret")

    def test_volume_name_defaults_to_prod(self) -> None:
        self.assertEqual(config.volume_name(), "paddleocr-models")


class TestOverridesApply(_CleanEnv):
    """With the env vars set the names MUST follow them."""

    def test_app_name_override(self) -> None:
        os.environ["MODAL_APP_NAME"] = "chounting-ocr-sidecar-dev"
        self.assertEqual(config.app_name(), "chounting-ocr-sidecar-dev")

    def test_secret_name_override(self) -> None:
        os.environ["MODAL_OCR_SECRET_NAME"] = "modal-ocr-hmac-secret-dev"
        self.assertEqual(config.secret_name(), "modal-ocr-hmac-secret-dev")

    def test_volume_name_override(self) -> None:
        os.environ["MODAL_OCR_VOLUME_NAME"] = "paddleocr-models-dev"
        self.assertEqual(config.volume_name(), "paddleocr-models-dev")

    def test_overrides_are_independent(self) -> None:
        """Overriding one must not disturb the other two."""
        os.environ["MODAL_APP_NAME"] = "chounting-ocr-sidecar-dev"
        self.assertEqual(config.app_name(), "chounting-ocr-sidecar-dev")
        self.assertEqual(config.secret_name(), "modal-ocr-hmac-secret")
        self.assertEqual(config.volume_name(), "paddleocr-models")


class TestInnerSecretKeyNotParameterized(unittest.TestCase):
    """The secret's INNER key must stay the literal MODAL_OCR_HMAC_SECRET.

    Only the secret's NAME in the Modal store is parameterized. run_ocr reads
    os.environ["MODAL_OCR_HMAC_SECRET"] inside the container; parameterizing
    that would yield a 503 "MODAL_OCR_HMAC_SECRET missing" rather than a 401 —
    the trap generate-secret.sh has warned about since the Session 42
    fix-forward. This pins it against a well-meaning future refactor.
    """

    def test_main_reads_literal_inner_key(self) -> None:
        src = (pathlib.Path(__file__).parent / "main.py").read_text()
        self.assertIn('os.environ.get("MODAL_OCR_HMAC_SECRET")', src)

    def test_config_does_not_parameterize_inner_key(self) -> None:
        self.assertFalse(
            hasattr(config, "hmac_secret_key"),
            "the inner secret key must not become configurable",
        )


class TestConfigShipsToContainer(unittest.TestCase):
    """config.py MUST be in add_local_python_source or the container dies.

    main.py does `import config` at module level, which runs INSIDE the
    Modal container as well as locally. Modal 1.x does not automount loose
    sibling modules — only what add_local_python_source names. Omitting
    "config" deploys cleanly and then ModuleNotFoundError's on every
    invocation, which is a latent PROD-deploy breakage, not just a dev one.

    Caught empirically 2026-07-27 by `modal run populate_models` failing with
    `No module named 'config'` — the unit tests above could not catch it,
    because they import config from the local filesystem where it exists.
    """

    def test_config_is_added_as_local_python_source(self) -> None:
        src = (pathlib.Path(__file__).parent / "main.py").read_text()
        self.assertIn('add_local_python_source("middleware", "schemas", "config")', src)

    def test_every_local_import_in_main_is_shipped(self) -> None:
        """Generalized: each local module main.py imports must be shipped."""
        src = (pathlib.Path(__file__).parent / "main.py").read_text()
        here = pathlib.Path(__file__).parent
        local = {
            p.stem for p in here.glob("*.py") if p.stem not in ("main", "test_config")
        } | {d.name for d in here.iterdir() if d.is_dir() and (d / "__init__.py").exists()}
        for mod in sorted(local):
            if f"\nimport {mod}" in src or f"\nfrom {mod} import" in src:
                self.assertIn(
                    f'"{mod}"', src.split("add_local_python_source(")[1].split(")")[0],
                    f"main.py imports local module {mod!r} but it is not in "
                    "add_local_python_source — it will ModuleNotFoundError in-container",
                )


if __name__ == "__main__":
    unittest.main()
