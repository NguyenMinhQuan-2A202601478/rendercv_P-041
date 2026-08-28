import { request as playwrightRequest, type APIRequestContext } from '@playwright/test';

const BASE_URL = 'http://localhost:5199';
const MAX_WAIT_MS = 60_000;
const POLL_INTERVAL_MS = 500;

async function waitUntilReachable(context: APIRequestContext): Promise<void> {
	const deadline = Date.now() + MAX_WAIT_MS;
	while (Date.now() < deadline) {
		try {
			await context.get('/');
			return;
		} catch {
			await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
		}
	}
}

/**
 * Warms up the backend's very first Typst render before any test runs.
 *
 * Why: a freshly-started `uvicorn` process pays a one-time cost on its
 * first `/api/render` -- font loading, Python import warm-up, first-call
 * JIT-ish overhead in the `typst` bindings -- on top of whatever a test
 * itself asks for. Without this, whichever test happens to run first
 * against a just-restarted backend absorbs that cost itself, which can
 * occasionally push its own (already generous) wait past its timeout --
 * observed directly: an otherwise-stable suite failing only its first test
 * immediately after restarting the backend, never once the backend had
 * served a render already. This pays that cost once, up front, with its
 * own long timeout, so it never eats into an individual test's budget.
 *
 * Why it polls for reachability first rather than assuming the frontend
 * dev server (`webServer`) is already up: Playwright's `globalSetup` vs
 * `webServer` start-order isn't a contract this file should depend on --
 * polling makes it correct either way.
 */
export default async function globalSetup(): Promise<void> {
	const context = await playwrightRequest.newContext({ baseURL: BASE_URL });
	try {
		await waitUntilReachable(context);
		await context.post('/api/render', {
			data: {
				cv_yaml: 'cv:\n  name: Warmup\n  sections: {}\n',
				design_yaml: '',
				locale_yaml: '',
				settings_yaml: ''
			},
			timeout: 60_000
		});
	} catch {
		// Best-effort only: if the backend never became reachable (or this
		// warmup call itself fails), every test's own wait is still the
		// authoritative check -- this is a latency optimization, not a
		// correctness dependency.
	} finally {
		await context.dispose();
	}
}
