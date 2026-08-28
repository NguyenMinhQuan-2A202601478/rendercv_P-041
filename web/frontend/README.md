# rendercv-web-frontend

SvelteKit + TypeScript + Tailwind UI for the RenderCV Web Editor: the
three-pane layout, the four document tabs with form/YAML two-way sync,
the theme switcher, autosave, and the live PDF preview.

It talks to `web/backend` over `/api` (proxied to port 8000 in dev), and
optionally renders entirely in the browser via the client-side WASM
engine in `src/lib/wasm/`.

**Setup, how to run, and how to test everything are documented once, for
both halves of the app, in [`../README.md`](../README.md).** Start there.

Quick reference for the scripts in this workspace:

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 5173 (needs the backend on 8000). |
| `npm run check` | `svelte-check` type-check. |
| `npm run test` | Vitest unit tests, single run. |
| `npm run build` | Production build. |
| `npm run test:e2e` | Playwright. **Requires a backend on a throwaway database** -- see the root web README. |
| `npm run build:wasm-assets` | Builds the ~30 MB opt-in WASM preview assets into the gitignored `static/wasm/`. |
