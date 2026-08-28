"""Contract tests for Phase 4b: session identity, `/api/cvs`, `/api/preferences`.

Why:
    Every test runs against a throwaway SQLite file under `tmp_path`
    (guardrail: never touch a real or shared database) with `get_session`
    overridden so requests hit that file directly. Entering the app via
    `with TestClient(app) as client:` also exercises the real startup path
    (`db.migrate.upgrade_to_head`, docs/plans/completed/cv-editor-web-app.md,
    Phase 4) instead of a shortcut like `Base.metadata.create_all`, so the
    "uvicorn just works against a brand-new DB" guarantee is covered by the
    same tests as the endpoints themselves.
"""

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from rendercv_web.app import app
from rendercv_web.db.session import (
    build_session_factory,
    create_engine_from_url,
    get_session,
)

DEFAULT_CV_YAML = "cv:\n  name: John Doe\n  sections: {}\n"
DEFAULT_SETTINGS_YAML = "settings:\n  pdf_title: NAME - CV\n"


def make_client(tmp_path, monkeypatch, db_name: str = "test.db") -> TestClient:
    """Build a `TestClient` wired to its own throwaway SQLite database.

    Args:
        tmp_path: pytest's per-test temporary directory.
        monkeypatch: pytest's monkeypatch fixture.
        db_name: File name for the throwaway database, so two clients in
            the same test can share (or not share) a database on purpose.

    Returns:
        A `TestClient` whose lifespan already ran migrations against the
        throwaway database, and whose `get_session` dependency is
        overridden to use it.
    """
    database_url = f"sqlite:///{tmp_path / db_name}"
    monkeypatch.setenv("RENDERCV_WEB_DATABASE_URL", database_url)
    monkeypatch.setenv("RENDERCV_WEB_SECRET", "test-secret")

    engine = create_engine_from_url(database_url)
    session_factory = build_session_factory(engine)

    def override_get_session() -> Iterator:
        session = session_factory()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_session] = override_get_session
    client = TestClient(app)
    client.__enter__()
    return client


@pytest.fixture
def client(tmp_path, monkeypatch) -> Iterator[TestClient]:
    """A `TestClient` against a fresh per-test database, cookies enabled."""
    test_client = make_client(tmp_path, monkeypatch)
    try:
        yield test_client
    finally:
        test_client.__exit__(None, None, None)
        app.dependency_overrides.pop(get_session, None)


def create_default_cv(client: TestClient, name: str = "My CV") -> dict:
    """Create a CV via the API and return its parsed JSON body."""
    response = client.post("/api/cvs", json={"name": name})
    assert response.status_code == 201
    return response.json()


class TestSessionCookie:
    """The signed session cookie: issued once, stable, and session-scoping."""

    def test_first_request_issues_a_session_cookie(self, client: TestClient) -> None:
        response = client.get("/api/cvs")

        assert response.status_code == 200
        assert "rendercv_session" in response.cookies

    def test_cookie_is_stable_across_requests(self, client: TestClient) -> None:
        client.get("/api/cvs")
        cookie_value = client.cookies["rendercv_session"]

        second = client.get("/api/cvs")

        # A cookie that already decodes successfully is never re-issued.
        assert "rendercv_session" not in second.cookies
        assert client.cookies["rendercv_session"] == cookie_value

    def test_two_clients_see_disjoint_cv_lists(self, tmp_path, monkeypatch) -> None:
        client_a = make_client(tmp_path, monkeypatch, db_name="shared.db")
        try:
            create_default_cv(client_a, name="A's CV")

            client_b = TestClient(app, cookies={})
            try:
                # A brand-new client with no cookie jar gets its own session.
                response = client_b.get("/api/cvs")
                assert response.status_code == 200
                assert response.json() == []

                response_a = client_a.get("/api/cvs")
                assert len(response_a.json()) == 1
            finally:
                client_b.close()
        finally:
            client_a.__exit__(None, None, None)
            app.dependency_overrides.pop(get_session, None)


class TestCvCrud:
    """`GET/POST/PUT/DELETE /api/cvs` happy paths."""

    def test_create_seeds_the_frontend_default_documents(
        self, client: TestClient
    ) -> None:
        body = create_default_cv(client, name="My CV")

        assert body["name"] == "My CV"
        assert body["documents"]["cv_yaml"] == DEFAULT_CV_YAML
        assert body["documents"]["design_yaml"] == ""
        assert body["documents"]["locale_yaml"] == ""
        assert body["documents"]["settings_yaml"] == DEFAULT_SETTINGS_YAML
        assert "id" in body
        assert "updated_at" in body

    def test_create_without_a_name_uses_a_default_name(
        self, client: TestClient
    ) -> None:
        response = client.post("/api/cvs", json={})

        assert response.status_code == 201
        assert response.json()["name"] == "Untitled CV"

    def test_list_orders_newest_updated_first(self, client: TestClient) -> None:
        first = create_default_cv(client, name="First")
        second = create_default_cv(client, name="Second")
        client.put(
            f"/api/cvs/{first['id']}",
            json={
                "name": "First",
                "documents": first["documents"],
                "seen_updated_at": first["updated_at"],
            },
        )

        listed = client.get("/api/cvs").json()

        assert [cv["id"] for cv in listed] == [first["id"], second["id"]]

    def test_get_returns_the_full_document_set(self, client: TestClient) -> None:
        created = create_default_cv(client)

        response = client.get(f"/api/cvs/{created['id']}")

        assert response.status_code == 200
        assert response.json() == created

    def test_update_happy_path_bumps_updated_at(self, client: TestClient) -> None:
        created = create_default_cv(client)
        new_documents = {**created["documents"], "cv_yaml": "cv:\n  name: Jane Doe\n"}

        response = client.put(
            f"/api/cvs/{created['id']}",
            json={
                "name": "Renamed",
                "documents": new_documents,
                "seen_updated_at": created["updated_at"],
            },
        )

        assert response.status_code == 200
        assert response.json()["updated_at"] >= created["updated_at"]

        fetched = client.get(f"/api/cvs/{created['id']}").json()
        assert fetched["name"] == "Renamed"
        assert fetched["documents"]["cv_yaml"] == "cv:\n  name: Jane Doe\n"

    def test_update_rejects_an_oversized_document(self, client: TestClient) -> None:
        created = create_default_cv(client)
        oversized = "a" * (512 * 1024 + 1)

        response = client.put(
            f"/api/cvs/{created['id']}",
            json={
                "name": created["name"],
                "documents": {**created["documents"], "cv_yaml": oversized},
                "seen_updated_at": created["updated_at"],
            },
        )

        assert response.status_code == 413

    def test_update_conflict_returns_409_with_current_state(
        self, client: TestClient
    ) -> None:
        created = create_default_cv(client)
        stale_seen_at = created["updated_at"]

        # A first writer wins.
        first_write = client.put(
            f"/api/cvs/{created['id']}",
            json={
                "name": "First writer",
                "documents": created["documents"],
                "seen_updated_at": stale_seen_at,
            },
        )
        assert first_write.status_code == 200

        # A second writer, still holding the now-stale `seen_updated_at`,
        # must be told about the conflict instead of overwriting it.
        second_write = client.put(
            f"/api/cvs/{created['id']}",
            json={
                "name": "Second writer",
                "documents": created["documents"],
                "seen_updated_at": stale_seen_at,
            },
        )

        assert second_write.status_code == 409
        body = second_write.json()
        assert body["current"]["updated_at"] == first_write.json()["updated_at"]
        assert body["current"]["documents"] == created["documents"]

    def test_update_returns_404_for_missing_cv(self, client: TestClient) -> None:
        response = client.put(
            "/api/cvs/999999",
            json={
                "name": "X",
                "documents": {
                    "cv_yaml": DEFAULT_CV_YAML,
                    "design_yaml": "",
                    "locale_yaml": "",
                    "settings_yaml": "",
                },
                "seen_updated_at": "2020-01-01T00:00:00",
            },
        )

        assert response.status_code == 404

    def test_duplicate_creates_a_named_copy(self, client: TestClient) -> None:
        created = create_default_cv(client, name="Original")

        response = client.post(f"/api/cvs/{created['id']}/duplicate")

        assert response.status_code == 201
        copy = response.json()
        assert copy["name"] == "Copy of Original"
        assert copy["id"] != created["id"]
        assert copy["documents"] == created["documents"]
        assert len(client.get("/api/cvs").json()) == 2

    def test_delete_removes_the_cv(self, client: TestClient) -> None:
        created = create_default_cv(client)

        response = client.delete(f"/api/cvs/{created['id']}")

        assert response.status_code == 204
        assert client.get(f"/api/cvs/{created['id']}").status_code == 404

    def test_delete_returns_404_for_missing_cv(self, client: TestClient) -> None:
        response = client.delete("/api/cvs/999999")

        assert response.status_code == 404


class TestCrossSessionIsolation:
    """A CV id belonging to another session must look exactly like 404."""

    def test_get_another_sessions_cv_is_404(self, tmp_path, monkeypatch) -> None:
        client_a = make_client(tmp_path, monkeypatch, db_name="isolation.db")
        try:
            created = create_default_cv(client_a, name="Private")

            client_b = TestClient(app, cookies={})
            try:
                response = client_b.get(f"/api/cvs/{created['id']}")
                assert response.status_code == 404
            finally:
                client_b.close()
        finally:
            client_a.__exit__(None, None, None)
            app.dependency_overrides.pop(get_session, None)


class TestVersions:
    """`GET /api/cvs/{id}/versions` and version restore."""

    def test_versions_list_grows_with_each_successful_update(
        self, client: TestClient
    ) -> None:
        created = create_default_cv(client)

        client.put(
            f"/api/cvs/{created['id']}",
            json={
                "name": created["name"],
                "documents": created["documents"],
                "seen_updated_at": created["updated_at"],
            },
        )

        versions = client.get(f"/api/cvs/{created['id']}/versions").json()

        assert len(versions) == 1
        assert "id" in versions[0]
        assert "created_at" in versions[0]

    def test_versions_returns_404_for_another_sessions_cv(
        self, tmp_path, monkeypatch
    ) -> None:
        client_a = make_client(tmp_path, monkeypatch, db_name="versions.db")
        try:
            created = create_default_cv(client_a)

            client_b = TestClient(app, cookies={})
            try:
                response = client_b.get(f"/api/cvs/{created['id']}/versions")
                assert response.status_code == 404
            finally:
                client_b.close()
        finally:
            client_a.__exit__(None, None, None)
            app.dependency_overrides.pop(get_session, None)

    def test_restore_applies_the_snapshot_as_a_new_update(
        self, client: TestClient
    ) -> None:
        created = create_default_cv(client)
        first_update = client.put(
            f"/api/cvs/{created['id']}",
            json={
                "name": created["name"],
                "documents": {
                    **created["documents"],
                    "cv_yaml": "cv:\n  name: First Edit\n",
                },
                "seen_updated_at": created["updated_at"],
            },
        )
        assert first_update.status_code == 200
        after_first_edit = client.get(f"/api/cvs/{created['id']}").json()

        second_update = client.put(
            f"/api/cvs/{created['id']}",
            json={
                "name": created["name"],
                "documents": {
                    **created["documents"],
                    "cv_yaml": "cv:\n  name: Second Edit\n",
                },
                "seen_updated_at": after_first_edit["updated_at"],
            },
        )
        assert second_update.status_code == 200

        versions = client.get(f"/api/cvs/{created['id']}/versions").json()
        # Newest first: index 1 is the snapshot taken right after the first edit.
        version_to_restore = versions[1]

        restore_response = client.post(
            f"/api/cvs/{created['id']}/versions/{version_to_restore['id']}/restore"
        )

        assert restore_response.status_code == 200
        restored = client.get(f"/api/cvs/{created['id']}").json()
        assert restored["documents"]["cv_yaml"] == "cv:\n  name: First Edit\n"
        # The restore itself is recorded as a fourth version.
        assert len(client.get(f"/api/cvs/{created['id']}/versions").json()) == 3

    def test_restore_returns_404_for_missing_version(self, client: TestClient) -> None:
        created = create_default_cv(client)

        response = client.post(f"/api/cvs/{created['id']}/versions/999999/restore")

        assert response.status_code == 404

    def test_prune_keeps_only_the_newest_50_versions(self, client: TestClient) -> None:
        created = create_default_cv(client)
        seen_at = created["updated_at"]

        for i in range(55):
            response = client.put(
                f"/api/cvs/{created['id']}",
                json={
                    "name": created["name"],
                    "documents": {
                        **created["documents"],
                        "cv_yaml": f"cv:\n  name: Edit {i}\n",
                    },
                    "seen_updated_at": seen_at,
                },
            )
            assert response.status_code == 200
            seen_at = response.json()["updated_at"]

        versions = client.get(f"/api/cvs/{created['id']}/versions").json()

        assert len(versions) == 50


class TestPreferences:
    """`GET/PUT /api/preferences`."""

    def test_roundtrip(self, client: TestClient) -> None:
        assert client.get("/api/preferences").json() == {}

        response = client.put("/api/preferences", json={"key": "zoom", "value": "125"})
        assert response.status_code == 204

        assert client.get("/api/preferences").json() == {"zoom": "125"}

    def test_upsert_overwrites_an_existing_key(self, client: TestClient) -> None:
        client.put("/api/preferences", json={"key": "zoom", "value": "100"})

        client.put("/api/preferences", json={"key": "zoom", "value": "150"})

        assert client.get("/api/preferences").json() == {"zoom": "150"}

    def test_preferences_are_scoped_per_session(self, tmp_path, monkeypatch) -> None:
        client_a = make_client(tmp_path, monkeypatch, db_name="prefs.db")
        try:
            client_a.put("/api/preferences", json={"key": "zoom", "value": "100"})

            client_b = TestClient(app, cookies={})
            try:
                assert client_b.get("/api/preferences").json() == {}
            finally:
                client_b.close()
        finally:
            client_a.__exit__(None, None, None)
            app.dependency_overrides.pop(get_session, None)


class TestDesignDiscriminatorRegression:
    """A design document missing its `theme` discriminator must 422, not 500."""

    def test_validate_returns_422_for_a_design_without_a_theme_key(
        self, client: TestClient
    ) -> None:
        response = client.post(
            "/api/validate",
            json={
                "cv_yaml": DEFAULT_CV_YAML,
                "design_yaml": "design:\n  page:\n    top_margin: 0.5in\n",
                "locale_yaml": "",
                "settings_yaml": "",
            },
        )

        assert response.status_code == 422
        body = response.json()
        assert body["errors"]
        assert "theme" in body["errors"][0]["message"].lower()

    def test_render_returns_422_for_a_design_without_a_theme_key(
        self, client: TestClient
    ) -> None:
        response = client.post(
            "/api/render",
            json={
                "cv_yaml": DEFAULT_CV_YAML,
                "design_yaml": "design:\n  page:\n    top_margin: 0.5in\n",
                "locale_yaml": "",
                "settings_yaml": "",
            },
        )

        assert response.status_code == 422
