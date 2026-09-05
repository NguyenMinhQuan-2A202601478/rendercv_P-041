"""Contract tests for the RenderCV Web Editor API.

Why:
    Each endpoint (validate/render/schema/themes) is exercised for its happy
    path, its error classes, the size cap, and the render cache, per
    `docs/plans/completed/cv-editor-web-app.md` (Phase 0) and the
    api-implementation skill.
"""

from typing import Any

import pytest
from fastapi.testclient import TestClient
from rendercv_web import app as app_module
from rendercv_web.app import app
from rendercv_web.cache import render_cache
from rendercv_web.models import MAX_DOCUMENT_BYTES

MINIMAL_CV_YAML = "cv:\n  name: John Doe\n  sections: {}\n"


@pytest.fixture
def client() -> TestClient:
    """A FastAPI test client for the app, with a clean render cache per test."""
    render_cache.entries.clear()
    return TestClient(app)


def minimal_request(**overrides: str) -> dict[str, str]:
    """Build a minimal valid request body, with optional field overrides."""
    body = {
        "cv_yaml": MINIMAL_CV_YAML,
        "design_yaml": "",
        "locale_yaml": "",
        "settings_yaml": "",
    }
    body.update(overrides)
    return body


class TestValidate:
    """Contract tests for `POST /api/validate`."""

    def test_valid_document_returns_valid_true(self, client: TestClient) -> None:
        response = client.post("/api/validate", json=minimal_request())

        assert response.status_code == 200
        assert response.json() == {"valid": True}

    def test_invalid_yaml_syntax_returns_422_with_yaml_location(
        self, client: TestClient
    ) -> None:
        response = client.post(
            "/api/validate", json=minimal_request(cv_yaml="cv:\n  name: [unterminated")
        )

        assert response.status_code == 422
        body = response.json()
        assert body["errors"]
        error = body["errors"][0]
        assert error["yaml_source"] == "main_yaml_file"
        assert "not a valid YAML file" in error["message"]

    def test_schema_violation_returns_422_with_location(
        self, client: TestClient
    ) -> None:
        # An unknown field is rejected by `BaseModelWithoutExtraKeys`; this is
        # a schema violation (not a YAML syntax error).
        response = client.post(
            "/api/validate",
            json=minimal_request(
                cv_yaml="cv:\n  name: John Doe\n  bogus_field: true\n  sections: {}\n"
            ),
        )

        assert response.status_code == 422
        body = response.json()
        assert body["errors"]
        locations = [error["location"] for error in body["errors"]]
        assert any(location and "bogus_field" in location for location in locations)

    def test_design_overlay_theme_is_validated(self, client: TestClient) -> None:
        response = client.post(
            "/api/validate",
            json=minimal_request(design_yaml="design:\n  theme: not-a-real-theme\n"),
        )

        assert response.status_code == 422
        body = response.json()
        assert any(
            error["yaml_source"] == "design_yaml_file" for error in body["errors"]
        )

    def test_oversized_document_returns_413(self, client: TestClient) -> None:
        oversized = "cv:\n  name: " + ("a" * (MAX_DOCUMENT_BYTES + 1)) + "\n"

        response = client.post("/api/validate", json=minimal_request(cv_yaml=oversized))

        assert response.status_code == 413


class TestRender:
    """Contract tests for `POST /api/render`."""

    def test_happy_path_returns_pdf_bytes(self, client: TestClient) -> None:
        response = client.post("/api/render", json=minimal_request())

        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"
        assert response.content.startswith(b"%PDF-")

    def test_invalid_document_returns_422(self, client: TestClient) -> None:
        response = client.post(
            "/api/render",
            json=minimal_request(
                cv_yaml="cv:\n  name: John Doe\n  bogus_field: true\n  sections: {}\n"
            ),
        )

        assert response.status_code == 422
        assert response.json()["errors"]

    def test_oversized_document_returns_413(self, client: TestClient) -> None:
        oversized = "cv:\n  name: " + ("a" * (MAX_DOCUMENT_BYTES + 1)) + "\n"

        response = client.post("/api/render", json=minimal_request(cv_yaml=oversized))

        assert response.status_code == 413

    def test_identical_request_is_served_from_cache(self, client: TestClient) -> None:
        first = client.post("/api/render", json=minimal_request())
        assert first.status_code == 200
        assert len(render_cache.entries) == 1

        second = client.post("/api/render", json=minimal_request())

        assert second.status_code == 200
        assert second.content == first.content
        # Still exactly one cache entry: the second request was a cache hit,
        # not a second render being cached under a new key.
        assert len(render_cache.entries) == 1


class TestSchema:
    """Contract tests for `GET /api/schema`."""

    def test_returns_json_schema_document(self, client: TestClient) -> None:
        response = client.get("/api/schema")

        assert response.status_code == 200
        body: dict[str, Any] = response.json()
        assert "$schema" in body


class TestThemes:
    """Contract tests for `GET /api/themes`."""

    def test_lists_built_in_themes_with_defaults(self, client: TestClient) -> None:
        response = client.get("/api/themes")

        assert response.status_code == 200
        themes = response.json()
        names = [theme["name"] for theme in themes]
        assert "classic" in names

        classic = next(theme for theme in themes if theme["name"] == "classic")
        assert classic["design_defaults"]["theme"] == "classic"
        assert "page" in classic["design_defaults"]


class TestAllowedOrigins:
    """CORS origins: a wrong list silently breaks logging in and saving."""

    def test_defaults_to_the_dev_server_when_unset(self, monkeypatch) -> None:
        monkeypatch.delenv(app_module.ALLOWED_ORIGINS_ENV_VAR, raising=False)

        assert app_module.resolve_allowed_origins() == ["http://localhost:5173"]

    def test_reads_a_comma_separated_list(self, monkeypatch) -> None:
        monkeypatch.setenv(
            app_module.ALLOWED_ORIGINS_ENV_VAR,
            "https://cv.example.com, https://www.example.com",
        )

        assert app_module.resolve_allowed_origins() == [
            "https://cv.example.com",
            "https://www.example.com",
        ]

    def test_a_blank_value_falls_back_rather_than_allowing_nothing(
        self, monkeypatch
    ) -> None:
        # An empty list would reject every browser request, which is a
        # worse failure than keeping the documented default.
        monkeypatch.setenv(app_module.ALLOWED_ORIGINS_ENV_VAR, "  , ,")

        assert app_module.resolve_allowed_origins() == ["http://localhost:5173"]
