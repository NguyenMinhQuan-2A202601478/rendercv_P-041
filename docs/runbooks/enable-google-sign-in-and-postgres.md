# Application Runbook: Enabling Google sign-in and Postgres

## Scope

The two configuration jobs the web editor still needs from an operator before
it can be deployed: turning on Google sign-in, and moving off the local SQLite
file onto managed Postgres.

Both are configuration, not code. The application runs correctly without
either — anonymous sessions and a SQLite file are a supported mode, and the
sign-in UI stays hidden when no provider is configured.

Neither could be verified from inside the repository. The backend tests patch
one seam (`oauth.fetch_google_identity`) because the real flow ends at
Google's consent screen, and the Postgres path was only exercised as far as
driver and dialect resolution, plus a full migration round trip on SQLite. So
the validation steps here are the first real proof either works.

## Prerequisites

- `uv` (Python 3.12+) and Node.js 20+, per `web/README.md`.
- A Google account able to create a project in Google Cloud Console.
- A Postgres provider account (Neon, Railway and Supabase all work; their
  connection strings are all accepted, see **Deterministic State**).
- Nothing is committed: `.env`, `.env.local` and `.env.production` are all
  gitignored. `.env.example` is deliberately still committable, for a template
  carrying names but no values.

**Never paste a client secret into a chat, an issue, or a commit.** It belongs
in `.env` locally and in the deployment's own secret store in production.

## Start

### Google OAuth client

In [Google Cloud Console](https://console.cloud.google.com):

1. Create or select a project.
2. **APIs & Services → OAuth consent screen**: User type **External**; fill in
   app name and the two email fields. No scopes need adding — `openid email
   profile` is requested by the application and needs no configuration here.
   While the app is in Testing, add your own address under **Test users**, or
   sign-in will be refused.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**,
   type **Web application**, and add the redirect URI for the environment:

   | Environment | Authorized redirect URI |
   | --- | --- |
   | Local | `http://localhost:5173/api/auth/google/callback` |
   | Deployment | `https://<your-domain>/api/auth/google/callback` |

   The match is exact: scheme, host, port and path, with no trailing slash.
   Port `5173` is the frontend dev server, not the backend's `8000`, because
   the browser must land back on the origin that holds the session cookie. A
   mismatch fails with `redirect_uri_mismatch` before the application is ever
   reached.

Both environments need their own entry; adding the production URI does not
cover localhost.

### Local run with sign-in enabled

Write the credentials to `web/backend/.env`:

```
GOOGLE_OAUTH_CLIENT_ID=<client id>
GOOGLE_OAUTH_CLIENT_SECRET=<client secret>
```

Then, in two terminals:

```
cd web/backend
uv run --env-file .env uvicorn rendercv_web.app:app --port 8000
```

```
cd web/frontend
npm run dev
```

`GOOGLE_OAUTH_REDIRECT_URI` can be left unset locally: it defaults to
`http://localhost:5173/api/auth/google/callback`, the same value registered
above. A deployment must set it explicitly.

## Readiness

Sign-in is configured when the server says so, rather than when the file
exists:

```
curl -s http://localhost:8000/api/auth/me
```

`"provider_available": true` means the credentials were read. It stays
`false` when either variable is missing, and the UI then renders no sign-in
control at all — that is the supported unconfigured mode, not a failure.

## Deterministic State

### Postgres

Install the driver. This step is easy to miss and the failure is at startup,
not at first query:

```
cd web/backend
uv sync --extra postgres
```

Postgres is an optional extra because development and the whole test suite run
on SQLite and need no driver.

Run the migration against the new database **before** pointing the application
at it, so a schema problem surfaces on its own rather than inside a failing
request:

```
cd web/backend
RENDERCV_WEB_DATABASE_URL="<connection string>" uv run alembic upgrade head
```

Two `Running upgrade` lines are expected: the baseline schema, then the OAuth
identity columns. Alembic also prints `Context impl PostgresqlImpl`, which is
worth reading -- it confirms the migration really ran against Postgres rather
than falling back to the SQLite default.

This path has now been exercised against a real PostgreSQL 16 server, not
only reasoned about: `alembic upgrade head` from a bare `postgresql://` URL,
the resulting schema inspected (all four tables, the four nullable auth
columns, the `uq_users_auth_provider_identity` constraint), a downgrade and
re-upgrade round trip, and the application started against an empty database
so its own startup migration ran unattended.

The connection string can be pasted exactly as the provider gives it.
`postgres://` (Railway, Heroku), `postgresql://` (Neon, Supabase) and
`postgresql+psycopg://` are all accepted — the first two are rewritten to the
installed driver, because SQLAlchemy has no `postgres` dialect and defaults
`postgresql` to psycopg2, which is not what the extra installs.

The application also migrates on startup, so no manual step is needed
afterwards.

### Isolation

The e2e suite must never run against a database anyone cares about — see
`web/README.md`. The same applies here: run these steps against a fresh
database, not one holding real CVs.

## Interface

Local sign-in, end to end:

1. Open <http://localhost:5173>. A **Sign in** link appears in the nav only
   when the server reported `provider_available: true`.
2. Follow it to Google's account chooser and pick an account.
3. You return to `/app`, and the sidebar footer shows the account's name or
   email with a **Sign out** control.

## Runtime Evidence

- `provider_available` from `GET /api/auth/me` is the single source of truth
  for whether the server sees credentials.
- With `GOOGLE_OAUTH_CLIENT_ID` or `GOOGLE_OAUTH_CLIENT_SECRET` missing,
  `GET /api/auth/google/start` returns **503** with a message naming both
  variables, rather than an opaque failure.
- `redirect_uri_mismatch` comes from Google, before any application code runs:
  compare the registered URI against `GOOGLE_OAUTH_REDIRECT_URI` character for
  character.
- The backend logs a warning on every start while `RENDERCV_WEB_SECRET` is
  unset. Nothing enforces it.

## Ownership And Cleanup

- `web/backend/.env` is local and gitignored; delete it to return the machine
  to the unconfigured state.
- Deleting the OAuth client in Google Cloud Console revokes it everywhere.
- A throwaway Postgres database can be dropped at the provider. Do not point
  these steps at a database holding real CVs.

## Validation

Before deployment, all of the following must hold:

| Environment variable | Required | Purpose |
| --- | --- | --- |
| `RENDERCV_WEB_SECRET` | Yes | Signs session cookies. |
| `RENDERCV_WEB_HTTPS` | Yes, over HTTPS | Marks the cookie `Secure`. |
| `RENDERCV_WEB_DATABASE_URL` | Effectively yes | Without it, SQLite in the container, lost on restart. |
| `RENDERCV_WEB_ALLOWED_ORIGINS` | Only across origins | Frontend origins allowed to call the API. |
| `GOOGLE_OAUTH_CLIENT_ID` / `_SECRET` / `_REDIRECT_URI` | Optional | Sign-in; omit for anonymous-only. |

Generate a secret with:

```
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

**`RENDERCV_WEB_SECRET` is the one that matters most and is easiest to
forget.** The fallback is a hardcoded string in a public repository, so anyone
can forge a validly signed session cookie and read other people's CVs. The
backend only logs a warning.

If the frontend and API are served from the same origin, CORS needs no
configuration. Across origins, an unlisted origin makes the browser refuse
credentialed requests: the page loads, sign-in and saving silently fail, and
the only clue is a CORS error in the console.

The journey that proves the outcome is the **Interface** section run against
the deployment, not against localhost.

## Unknowns

- Which Postgres provider will be used, and therefore the real connection
  string and its SSL requirements. The migration itself is no longer an
  unknown -- see **Deterministic State** -- but a managed provider adds
  TLS and network policy that a local server does not exercise.
- The production domain, and so the production redirect URI.
- Whether the Google app will stay in Testing (its user list is capped and
  restricted to named test users) or go through verification.
- Where the deployment stores secrets; this runbook assumes environment
  variables and does not choose a secret manager.
