# RenderCV Web Editor

A browser editor for RenderCV: a three-pane UI (CV list, editor, live PDF
preview) where a CV is edited through four tabs -- **CV, Design, Locale,
Settings** -- each in two synchronized modes (schema-driven form or raw
YAML), with a theme switcher, autosave, and PDF download.

It is built **on top of this repository's Python core**, not as a
reimplementation: `web/backend` imports `rendercv` as an editable
dependency and calls the same pipeline the CLI does, so rendering and
validation cannot drift from the core.

```
web/backend    FastAPI service wrapping the core (validate, render,
               schema, themes, CV persistence, preferences)
web/frontend   SvelteKit + TypeScript + Tailwind UI
```

## Prerequisites

- **uv** (Python 3.12+) -- used for everything Python; never `pip` or a
  bare `python`.
- **Node.js 20+** with npm.

## Setup

Install both workspaces once:

```
cd web/backend
uv sync

cd ../frontend
npm install
```

The backend depends on the core at the repository root as an *editable*
path dependency, so core edits take effect without reinstalling.

## Running the app

Two processes, in two terminals:

```
cd web/backend
uv run uvicorn rendercv_web.app:app --port 8000
```

```
cd web/frontend
npm run dev
```

Open <http://localhost:5173>. The Vite dev server proxies `/api` to the
backend on port 8000, so both must be running.

The database schema is migrated **automatically on backend startup**
(`upgrade_to_head` in the app's lifespan) -- there is no manual
`alembic upgrade` step. With no configuration, the backend creates
`web/backend/data/rendercv_web.db` (SQLite) relative to its working
directory.

There is no login: a signed cookie gives each browser an anonymous
session, and CVs belong to that session.

## Configuration

| Variable | Default | Notes |
| --- | --- | --- |
| `RENDERCV_WEB_DATABASE_URL` | `sqlite:///./data/rendercv_web.db` | Any SQLAlchemy URL. Postgres works unmodified. |
| `RENDERCV_WEB_SECRET` | *(insecure dev default)* | Signs session cookies. **Must be set before any deployment** -- see below. |

## Tests

Each layer has its own gate. All of them should be green before a PR.

**Core** (from the repository root):

```
just check
just test
```

**Backend:**

```
cd web/backend
uv run pytest -q
```

**Frontend** (type-check, unit tests, production build):

```
cd web/frontend
npm run check
npm run test
npm run build
```

**End-to-end (Playwright).** These drive a real browser against a real
backend, so the backend must be running -- and this is the one place
where a mistake costs you data:

> **Always point the e2e backend at a throwaway database.** Running the
> suite against the default `web/backend/data/rendercv_web.db` writes
> test CVs into your development data and makes the bootstrap-ordering
> tests flake.

PowerShell:

```
$env:RENDERCV_WEB_DATABASE_URL = "sqlite:///$env:TEMP/rendercv_e2e.db"
cd web/backend
uv run uvicorn rendercv_web.app:app --port 8000
```

Then, in another terminal:

```
cd web/frontend
npm run test:e2e
```

Playwright starts its **own** frontend on port 5199 (not 5173), so it
never fights a dev server you already have open. It runs with
`workers: 1` deliberately: the dev backend is a single uvicorn process
whose CPU-bound Typst renders stall its own event loop under parallel
load.

## Optional: client-side (WASM) preview

The preview is normally rendered by the backend, which stays the
canonical renderer. There is also a fully client-side path -- Pyodide
runs the rendercv wheel to produce Typst source, and typst.ts compiles
it to a PDF in the browser with zero `/api/render` calls.

It is **off by default** and costs nothing until enabled. To try it,
build the assets once (~30 MB into the gitignored `static/wasm/`):

```
cd web/frontend
npm run build:wasm-assets
```

Then set the flag in the browser console and reload:

```
localStorage.setItem('rendercv.wasmPreview', 'true')
```

Known limits: classic-theme fonts only, Pyodide itself is fetched from
the jsdelivr CDN, and a few small pure-Python dependencies come from
PyPI at runtime. Cold start is roughly 17-20s; warm renders are well
under a second.

## Before deploying

- **Set `RENDERCV_WEB_SECRET`** to a long random value kept out of
  source control. The fallback is a hardcoded string committed to a
  public repository -- anyone can forge a validly-signed session cookie
  against it. The backend logs a warning when it is unset, but nothing
  enforces it.
- Point `RENDERCV_WEB_DATABASE_URL` at managed Postgres. No code change
  is needed; migrations run on startup as usual.

## Where to look next

- `docs/plans/active/cv-editor-web-app.md` -- the execution plan, with
  each phase's verification evidence.
- `graphify-out/GRAPH_REPORT.md` -- a generated map of how the core and
  the web layers connect.
- The repository root `CLAUDE.md` -- code conventions that govern the
  Python in `web/backend` as well as the core.
