# Application Runbook: Enabling Google sign-in and Postgres

## Scope

The two configuration jobs the web editor still needs from an operator before
it can be deployed: turning on Google sign-in, and moving off the local SQLite
file onto managed Postgres.

Both are configuration, not code. The application runs correctly without
either — anonymous sessions and a SQLite file are a supported mode, and the
sign-in UI stays hidden when no provider is configured.

Both have now been run for real, and both turned up something the tests could
not. The Postgres path failed outright on a first attempt -- migrations
bypassed the driver rewrite entirely (fixed; see **Deterministic State**).
Google sign-in completed end to end against a real client, and the resulting
database showed the promote-in-place path working: one row, carrying the
account identity, still owning the CV written before signing in.

What the automated tests still cannot cover stays true: they patch
`oauth.fetch_google_identity` because the real flow ends at a consent screen
a test cannot drive. So re-run the **Interface** section by hand after any
change to the sign-in flow.

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
2. **Google Auth Platform → Branding**: fill in the app name and the two
   email fields (*User support email* and *Developer contact information*).
   Leave the logo and every *App domain* field empty — a logo forces the app
   through verification, and the domain fields need a domain you have
   registered under *Authorized domains*. Under **Data Access**, nothing
   needs adding: `openid email profile` are requested by the application at
   run time and are all non-sensitive.

   The Console section is named *Google Auth Platform* and splits Branding,
   Audience and Clients into separate pages; older documentation (including
   earlier revisions of this file) calls it *APIs & Services → OAuth consent
   screen*, which no longer exists.
3. **Google Auth Platform → Clients → Create client**, type **Web
   application**, and add the redirect URI for the environment:

   | Environment | Authorized redirect URI |
   | --- | --- |
   | Local | `http://localhost:5173/api/auth/google/callback` |
   | Deployment | `https://<your-domain>/api/auth/google/callback` |

   The match is exact: scheme, host, port and path, with no trailing slash.
   Port `5173` is the frontend dev server, not the backend's `8000`, because
   the browser must land back on the origin that holds the session cookie. A
   mismatch fails with `redirect_uri_mismatch` before the application is ever
   reached.

   Both environments need their own entry; adding the production URI does
   not cover localhost.

4. Let other people in by adding their addresses under **Audience → Test
   users**. Left in Testing, Google refuses everyone outside that list *on
   Google's own screen* -- the request never reaches this server, so no
   amount of application code can soften it, and since the editor requires
   an account that is a locked door. The project owner is the exception and
   signs in even with an empty list, which is why verifying this needs a
   second Google account. The list holds 100 addresses and takes effect
   immediately.

5. **Publishing to production is a separate job that needs a deployment, so
   it is not part of this local setup.** Google refuses to switch an app out
   of Testing until *Branding* carries a valid **homepage url** and
   **privacy policy url**, and those must live on a domain registered under
   *Authorized domains* -- `localhost` cannot satisfy either. The button
   stays greyed out with a tooltip saying exactly that. Come back to this
   after the app is deployed, and **remove the logo from *Branding* first**:
   a logo forces the app through Google's verification review, which the
   three scopes it requests (`openid email profile`, all non-sensitive)
   would otherwise not require.

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
| `GOOGLE_OAUTH_CLIENT_ID` / `_SECRET` / `_REDIRECT_URI` | Yes | The editor opens only for a signed-in account, so without these nobody can get in. |

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
the deployment, not against localhost. **It has now been run there**, on
2026-09-06, against `https://rendercv-web-uk68.onrender.com`.

It was run as a listed test user rather than as the project owner, which is
the only version of it that proves anything. Google lets a project's owner
through in every configuration -- with the *Test users* list empty, with the
allowlist misconfigured -- so the owner signing in successfully is
compatible with the deployment being broken for everyone else. An account
with no privileges gets in only because the configuration is right.

Checked from outside before that, in this order, each answering a question
the next depends on:

| Check | Answer |
| --- | --- |
| `GET /openapi.json` | `RenderCV Web Editor API` -- the deployment is this app |
| `GET /api/auth/me` | `provider_available: true` -- the server read both credentials |
| `GET /api/auth/google/start` | sends `redirect_uri=https://<host>/api/auth/google/callback` |
| Following that to Google | Google's sign-in page, not `redirect_uri_mismatch` -- the URI is registered |

The first version of `GOOGLE_OAUTH_REDIRECT_URI` on the deployment was the
bare host, with no path. Worth naming because of how it fails: Google would
send the user to the landing page, no callback handler would run, no cookie
would be set, and the browser would show a page that looks fine. There is no
error anywhere in that sequence.

## Unknowns

Three of the four entries here were answered by the deployment on
2026-09-06; what is left is narrower.

- **Whether the deployment is really on Postgres.** `render.yaml` wires
  `RENDERCV_WEB_DATABASE_URL` from the managed database, and signing in
  wrote a row -- so *a* database works, migrations ran, and writes succeed.
  But the code falls back to a SQLite file when that variable is missing,
  and a container on SQLite behaves identically until it restarts, at which
  point every CV is gone. Nothing observed from outside distinguishes the
  two. Settle it by restarting the service and signing in again: the CVs
  survive on Postgres and do not on SQLite.
- **Everything past the publish gate.** The Console refuses to switch the
  app to production without a homepage and privacy-policy URL on an
  authorized domain (confirmed 2026-09-06 by reading the disabled button's
  tooltip). So whether the non-sensitive scopes really skip verification,
  and what a stranger's first consent screen looks like, are still
  unobserved -- and until then only listed test users can sign in, on the
  deployment as much as on localhost.
- **Where the deployment stores secrets.** They are Render environment
  variables now, which is where this runbook assumed they would be; it
  still does not choose a secret manager, and `RENDERCV_WEB_SECRET` being
  generated by `render.yaml` rather than by a person is the only reason it
  cannot be forgotten.

Answered, and recorded here so the next reader does not re-open them:

- The Postgres provider is Render's managed database, connected by
  `render.yaml` rather than by a pasted connection string, so its TLS and
  network policy never had to be worked out by hand.
- The production domain is `rendercv-web-uk68.onrender.com`, and the
  redirect URI is that host plus `/api/auth/google/callback`.
