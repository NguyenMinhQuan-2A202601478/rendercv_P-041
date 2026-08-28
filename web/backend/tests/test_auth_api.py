"""Contract tests for Phase 6: Google sign-in and the anonymous merge.

Why there is no real Google here:
    `oauth.fetch_google_identity` is the single seam that talks to Google,
    and it is monkeypatched per test. Everything around it -- the signed
    state check, account lookup, promoting an anonymous row, merging a
    second browser's CVs into an existing account, and the session cookie
    that comes back -- runs for real against a throwaway database. So these
    tests prove the parts that can silently lose a user's data, without
    needing credentials or a network.

    The one thing they cannot prove is that Google itself accepts our
    authorization request; that needs real credentials and a browser.
"""

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from rendercv_web import oauth
from rendercv_web.app import app
from rendercv_web.db.session import (
    build_session_factory,
    create_engine_from_url,
    get_session,
)


def make_client(tmp_path, monkeypatch, db_name: str = "auth.db") -> TestClient:
    """Build a `TestClient` on a throwaway database with OAuth configured.

    Args:
        tmp_path: pytest's per-test temporary directory.
        monkeypatch: pytest's monkeypatch fixture.
        db_name: Database file name, so two clients in one test can share
            a database on purpose (the two-browser merge case).

    Returns:
        A `TestClient` whose lifespan already migrated the throwaway
        database.
    """
    database_url = f"sqlite:///{tmp_path / db_name}"
    monkeypatch.setenv("RENDERCV_WEB_DATABASE_URL", database_url)
    monkeypatch.setenv("RENDERCV_WEB_SECRET", "test-secret")
    monkeypatch.setenv(oauth.CLIENT_ID_ENV_VAR, "test-client-id")
    monkeypatch.setenv(oauth.CLIENT_SECRET_ENV_VAR, "test-client-secret")

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
    """A `TestClient` against a fresh per-test database, OAuth configured."""
    test_client = make_client(tmp_path, monkeypatch)
    try:
        yield test_client
    finally:
        test_client.__exit__(None, None, None)
        app.dependency_overrides.pop(get_session, None)


def patch_identity(
    monkeypatch,
    subject: str = "google-subject-1",
    email: str | None = "person@example.com",
    display_name: str | None = "A Person",
) -> None:
    """Replace the Google round trip with a fixed identity.

    Args:
        monkeypatch: pytest's monkeypatch fixture.
        subject: The provider's stable subject id to report.
        email: The email to report.
        display_name: The display name to report.
    """

    def fake_fetch(code: str, config: oauth.OAuthConfig) -> oauth.GoogleIdentity:
        del code, config
        return oauth.GoogleIdentity(
            subject=subject, email=email, display_name=display_name
        )

    monkeypatch.setattr(oauth, "fetch_google_identity", fake_fetch)


def sign_in(client: TestClient, code: str = "auth-code") -> None:
    """Run a full start -> callback sign-in against the patched identity.

    Why it goes through `/google/start` rather than forging the state
    cookie: the state check is part of what these tests are proving.

    Args:
        client: The client to sign in.
        code: The authorization code to present on the callback.
    """
    start = client.get("/api/auth/google/start", follow_redirects=False)
    assert start.status_code == 307
    state = client.cookies[oauth.STATE_COOKIE_NAME].split(".")[0]

    callback = client.get(
        f"/api/auth/google/callback?code={code}&state={state}",
        follow_redirects=False,
    )
    assert callback.status_code == 303, callback.text


class TestAuthStatus:
    """`GET /api/auth/me` -- who am I, and is sign-in even offered here."""

    def test_anonymous_caller_is_reported_as_not_authenticated(
        self, client: TestClient
    ) -> None:
        body = client.get("/api/auth/me").json()

        assert body == {
            "authenticated": False,
            "email": None,
            "display_name": None,
            "provider_available": True,
        }

    def test_provider_unavailable_when_credentials_are_unset(
        self, client: TestClient, monkeypatch
    ) -> None:
        # A deployment with no Google credentials is supported: the client
        # must be able to hide the sign-in button rather than offer one
        # that can only fail.
        monkeypatch.delenv(oauth.CLIENT_ID_ENV_VAR)

        body = client.get("/api/auth/me").json()

        assert body["provider_available"] is False

    def test_start_reports_503_when_not_configured(
        self, client: TestClient, monkeypatch
    ) -> None:
        monkeypatch.delenv(oauth.CLIENT_SECRET_ENV_VAR)

        response = client.get("/api/auth/google/start", follow_redirects=False)

        assert response.status_code == 503


class TestSignInFlow:
    """The authorization-code round trip and its state check."""

    def test_start_redirects_to_google_with_a_signed_state_cookie(
        self, client: TestClient
    ) -> None:
        response = client.get("/api/auth/google/start", follow_redirects=False)

        assert response.status_code == 307
        location = response.headers["location"]
        assert location.startswith(oauth.GOOGLE_AUTH_ENDPOINT)
        assert "client_id=test-client-id" in location
        assert "scope=openid+email+profile" in location
        assert oauth.STATE_COOKIE_NAME in response.cookies

    def test_callback_signs_the_user_in(self, client: TestClient, monkeypatch) -> None:
        patch_identity(monkeypatch)

        sign_in(client)

        body = client.get("/api/auth/me").json()
        assert body["authenticated"] is True
        assert body["email"] == "person@example.com"
        assert body["display_name"] == "A Person"

    def test_callback_with_a_mismatched_state_is_rejected(
        self, client: TestClient, monkeypatch
    ) -> None:
        # Without this check a third party could complete a sign-in the
        # user never started.
        patch_identity(monkeypatch)
        client.get("/api/auth/google/start", follow_redirects=False)

        response = client.get(
            "/api/auth/google/callback?code=c&state=not-the-issued-state",
            follow_redirects=False,
        )

        assert response.status_code == 400
        assert client.get("/api/auth/me").json()["authenticated"] is False

    def test_callback_without_any_state_cookie_is_rejected(
        self, client: TestClient, monkeypatch
    ) -> None:
        patch_identity(monkeypatch)

        response = client.get(
            "/api/auth/google/callback?code=c&state=anything",
            follow_redirects=False,
        )

        assert response.status_code == 400

    def test_declined_consent_returns_to_the_editor_without_signing_in(
        self, client: TestClient, monkeypatch
    ) -> None:
        patch_identity(monkeypatch)

        response = client.get(
            "/api/auth/google/callback?error=access_denied",
            follow_redirects=False,
        )

        assert response.status_code == 303
        assert response.headers["location"] == oauth.POST_LOGIN_PATH
        assert client.get("/api/auth/me").json()["authenticated"] is False

    def test_logout_returns_the_browser_to_an_anonymous_session(
        self, client: TestClient, monkeypatch
    ) -> None:
        patch_identity(monkeypatch)
        sign_in(client)

        assert client.post("/api/auth/logout").status_code == 204

        assert client.get("/api/auth/me").json()["authenticated"] is False


class TestAnonymousWorkIsKept:
    """Signing in must never lose the CVs written before signing in."""

    def test_first_sign_in_keeps_the_anonymous_session_cvs(
        self, client: TestClient, monkeypatch
    ) -> None:
        patch_identity(monkeypatch)
        client.post("/api/cvs", json={"name": "Written while anonymous"})

        sign_in(client)

        names = [cv["name"] for cv in client.get("/api/cvs").json()]
        assert names == ["Written while anonymous"]

    def test_signing_in_again_on_the_same_browser_is_idempotent(
        self, client: TestClient, monkeypatch
    ) -> None:
        patch_identity(monkeypatch)
        client.post("/api/cvs", json={"name": "Only copy"})
        sign_in(client)

        sign_in(client, code="second-code")

        names = [cv["name"] for cv in client.get("/api/cvs").json()]
        assert names == ["Only copy"]

    def test_second_browser_merges_its_cvs_into_the_existing_account(
        self, tmp_path, monkeypatch
    ) -> None:
        # The case that silently loses work if `claim_anonymous_user` is
        # wrong: the account already exists, so the CVs written anonymously
        # in *this* browser would otherwise be stranded on a discarded row.
        patch_identity(monkeypatch)

        first = make_client(tmp_path, monkeypatch, db_name="shared.db")
        try:
            first.post("/api/cvs", json={"name": "From browser one"})
            sign_in(first)
        finally:
            first.__exit__(None, None, None)

        second = TestClient(app, cookies={})
        try:
            second.post("/api/cvs", json={"name": "From browser two"})
            sign_in(second, code="second-browser-code")

            names = sorted(cv["name"] for cv in second.get("/api/cvs").json())
            assert names == ["From browser one", "From browser two"]
        finally:
            app.dependency_overrides.pop(get_session, None)

    def test_account_preferences_win_over_the_anonymous_session(
        self, tmp_path, monkeypatch
    ) -> None:
        # The account's own settings are the durable ones; a throwaway
        # anonymous session should not silently redecorate them.
        patch_identity(monkeypatch)

        first = make_client(tmp_path, monkeypatch, db_name="prefs.db")
        try:
            first.put("/api/preferences", json={"key": "ui_theme", "value": "dark"})
            sign_in(first)
        finally:
            first.__exit__(None, None, None)

        second = TestClient(app, cookies={})
        try:
            second.put("/api/preferences", json={"key": "ui_theme", "value": "light"})
            second.put("/api/preferences", json={"key": "zoom", "value": "125"})
            sign_in(second, code="second-browser-code")

            preferences = second.get("/api/preferences").json()
            assert preferences["ui_theme"] == "dark"  # the account's value survives
            assert preferences["zoom"] == "125"  # a key it lacked is carried over
        finally:
            app.dependency_overrides.pop(get_session, None)
