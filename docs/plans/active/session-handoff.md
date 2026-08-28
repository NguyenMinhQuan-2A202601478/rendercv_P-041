# Session Handoff — RenderCV Web Editor

Last updated: 2026-08-28, after Phase 6 merged. Read this together with
[cv-editor-web-app.md](cv-editor-web-app.md), whose Progress section
carries the per-phase verification evidence.

## Where things stand

**The plan is complete.** Everything is merged to `develop`:

- PR #1 (`dd8250e`'s parent, `f831a58`) — phases 0-5, the build roadmap.
- PR #2 (`dd8250e`) — phase 6: landing-first routing, Google sign-in, and
  the fixes that made deployment actually possible.

`main` is untouched and still guarded by the PreToolUse hook. Branches
`quan` and `quan-phase6` are merged but not deleted.

Gates on `develop`: core 1540 passed (2 Windows skips), backend 104/104,
svelte-check 0 errors (366 files), Vitest 295/295, Playwright 35/35,
`just check` clean.

## What is left, and it is not code

Both need credentials this repository does not have:

1. **Google OAuth.** Create a client in Google Cloud Console and set
   `GOOGLE_OAUTH_CLIENT_ID` / `_SECRET` / `_REDIRECT_URI`. The exact
   redirect URI is in `web/README.md`. Until then the app runs anonymously
   and the sign-in UI stays hidden, which is a supported state, not a
   broken one. The backend tests patch one seam because the real flow ends
   at Google's consent screen, so **the first real sign-in still needs a
   human**.
2. **Postgres.** Pick a provider, then run the migration against it before
   anything else: only driver and dialect resolution were exercised here
   (the Docker daemon was unavailable), plus the full migration round trip
   on SQLite. `uv sync --extra postgres` is required; a pasted
   `postgres://` or `postgresql://` URL is normalized in code.

`RENDERCV_WEB_SECRET` and `RENDERCV_WEB_HTTPS` must both be set before any
deployment. `web/README.md` is the operator's document; this file is not.

## How this project was run

1. Per phase: present a change list → user approves → implement → run every
   gate → report → commit only after the user has seen the result.
2. Push over HTTPS; SSH is broken on this machine:
   `git push https://github.com/NguyenMinhQuan-2A202601478/rendercv_P-041.git <branch>`
3. `/code-review` after each PR, before merging. It earned its place: it
   found 10 real defects in PR #1 and 5 in PR #2, including one that
   destroyed a user's account when a second person signed in on the same
   browser. Both times the fixes came with regression tests that were
   verified to fail without them.

## Gates

- Repo: `just check`, `just test` (expect 2 Windows skips).
- Backend: `cd web/backend && uv run pytest -q`.
- Frontend: `npm run check && npm run test && npm run build`, then
  `npx playwright test` — the e2e suite needs a backend on port 8000 with a
  **throwaway** database, never `web/backend/data/rendercv_web.db`. See
  `web/README.md` for the exact commands.

## Known debt

None of it blocking, all of it recorded in the plan's Result section:

- Signing out is account-wide, not per-device: one account has one
  `session_token`, and per-device sessions need a `sessions` table. The
  safe direction of the two was chosen deliberately.
- The favicon is still the SvelteKit default.
- The photo field accepts a URL but not an upload; local paths 422 by
  design, with a clear message.
- Placeholder documents are defined twice — `web/backend/defaults.py` and
  the frontend's `createDefaultDocuments()` — with no shared source.
- The versions/history panel has no e2e coverage.
- Harness payload files (`.agents/`, `.harness-core/`,
  `docs/assets/rendercv_skill.zip`) and `graphify-out/` sit modified by
  hooks and uncommitted; commit as a chore or discard, the user's call.
- `full_repository/` and `image/` are the user's untracked scratch
  directories at the repository root — leave them alone.
