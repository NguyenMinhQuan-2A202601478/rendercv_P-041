# Session Handoff — RenderCV Web Editor

Last updated: 2026-08-27 (during Phase 5 wave 2). Read this together with
[cv-editor-web-app.md](cv-editor-web-app.md) (the execution plan, phase
ticks carry verification evidence) to resume work in a fresh session.

## Where things stand

Branch `quan` (tracks origin/quan; PR target is `develop`; `main` is
protected by a PreToolUse guardrail hook). All pushed through commit
`b1319d1`:

- Phase 0 `69be36e`+`b562719` — web/backend (FastAPI wrapping the core)
  + web/frontend (SvelteKit) scaffold, end-to-end render works.
- Phase 1 `ff7b46b` — CodeMirror YAML editor, inline validation errors.
- Phase 2 `f35f4b8` — schema-driven CV form + two-way YAML sync
  (parse/patch endpoints, ruamel round-trip preserves comments).
- Phase 3 `9ba08f1` — theme switcher (9 themes) + Design/Locale/Settings
  forms; minimal-YAML + effective-value-overlay semantics.
- Phase 4 `93bb15b` — persistence: SQLAlchemy+alembic (users/cvs/
  cv_versions/preferences), anonymous device-session cookie, /api/cvs
  CRUD + versions/restore, autosave with 409 conflict bar, real sidebar.
- Phase 5 wave 1 `b1319d1` — form UI parity with the reference, /welcome
  landing page, and three root-cause fixes: ruamel thread-safety
  (per-call parsers, concurrency regression tests both layers), alembic
  env.py logging swallow, codespell "thay".

## In flight when this file was written

Two frontend-engineer agents running in parallel (strict file ownership):

- **5a WASM preview** — owns `src/lib/wasm/`, `renderController.ts`,
  `package.json`, `vite.config.ts`, `static/wasm/`. Goal: optional
  client-side render (Pyodide runs the core → .typ source; typst.ts
  compiles to PDF) behind localStorage flag `rendercv.wasmPreview`,
  server render stays canonical. R&D honesty clause: partial delivery +
  feasibility report acceptable. Recipe starting point:
  `tests/test_pyodide.py`.
- **5b dark mode** — owns .svelte styling, `app.css`, `+layout.svelte`,
  theme store, `app.html` pre-paint script. Toggle top bar; persists as
  preference `ui_theme` + localStorage mirror `rendercv.uiTheme`.

If a fresh session finds their work uncommitted on disk: run the gates
below, reconcile 5a's integration notes (it was forbidden to edit
.svelte files), get user approval, then commit as "Phase 5 wave 2".

## Orchestration workflow (how this project is run)

1. Per phase: present plan → user approves → dispatch specialized agents
   (`.claude/agents/`: product-analyst, database-architect,
   backend-engineer, frontend-engineer, qa-engineer,
   documentation-writer; each loads its `.claude/skills/` playbook).
2. Agents never commit. Orchestrator independently reruns all gates,
   exercises the app live in a browser, screenshots proof, reports to
   the user, and commits only after user approval.
3. Push via HTTPS URL (SSH is broken on this machine):
   `git push https://github.com/NguyenMinhQuan-2A202601478/rendercv_P-041.git quan:quan`

## Gates (all must be green before any commit)

- Repo: `just check` (ruff+ty+prek), `just test` (core; expect
  2 Windows skips; pyodide test needs an idle machine or it times out).
- Backend: `cd web/backend && uv run pytest -q` (75 tests).
- Frontend: `cd web/frontend && npm run check && npm run test &&
  npm run build && npx playwright test` (247+ unit, 18+ e2e; e2e needs
  backend on 8000 with a THROWAWAY DB:
  `$env:RENDERCV_WEB_DATABASE_URL="sqlite:///<temp>.db"` — never run
  e2e against `web/backend/data/rendercv_web.db`, it pollutes dev data
  and bootstrap-order tests flake).

## Running the app for the user

```
cd web/backend && uv run uvicorn rendercv_web.app:app --port 8000
cd web/frontend && npm run dev        # http://localhost:5173
```

Log capture (uvicorn access + tracebacks): run uvicorn with
`--log-config` pointing at a FileHandler config, else Windows pipe
buffering hides everything. Kill orphans:
`Get-NetTCPConnection -LocalPort 8000` → Stop-Process (TaskStop alone
can orphan the python child).

## Known follow-ups / debt

- Photo field: web context needs URL or upload; local paths 422 (by
  design, message is clear).
- `defaults.py` (backend) duplicates the frontend seed documents —
  no shared source of truth.
- Dev secret fallback in auth.py is a known hardcoded string (loud
  warning); must set `RENDERCV_WEB_SECRET` before any deploy.
- Versions/history panel has no e2e coverage.
- Harness payload files (`.agents/`, `.harness-core/`,
  `docs/assets/rendercv_skill.zip`) sit modified-by-hooks, uncommitted —
  commit separately as chore or discard, user's call.
- `full_repository/` and `image/` are untracked scratch dirs at repo
  root (user's), leave them alone.

## After the build roadmap (user-approved direction)

Phase 6 (optional, needs user credentials + decisions): landing-first
routing (`/` → landing, editor → `/app` or gated), Google OAuth
("Continue with Google" like the reference — schema seam exists in
users table), deploy with managed Postgres (Neon/Railway; code only
needs `RENDERCV_WEB_DATABASE_URL`). Then: photo upload, share links,
PDF import — none scoped yet.
