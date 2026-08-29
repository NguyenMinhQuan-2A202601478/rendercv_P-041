import { test, expect, type Page } from '@playwright/test';
import { gotoReady } from './helpers';

/**
 * Phase 6 wave 3: what the auth controls render in each state the server
 * can report.
 *
 * Why `/api/auth/me` is intercepted rather than really signing in: the real
 * flow ends at Google's consent screen, which a test cannot drive and which
 * needs credentials this repository does not have. The backend half of the
 * flow -- state checking, account resolution, the anonymous merge -- is
 * covered for real in `web/backend/tests/test_auth_api.py`. What is left to
 * prove here is only that the UI renders the right thing for each answer,
 * and that is exactly what the interception fixes.
 *
 * Every case is intercepted, including the unconfigured one. Reading the
 * backend's real answer there would make the suite pass or fail based on
 * whether the person running it happens to have Google configured in their
 * own `.env`, which is not a property of the code under test.
 */

async function serveAuthStatus(
	page: Page,
	body: {
		authenticated: boolean;
		email: string | null;
		display_name: string | null;
		provider_available: boolean;
	}
): Promise<void> {
	await page.route('**/api/auth/me', (route) =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
	);
}

test.describe('Auth controls', () => {
	test('a deployment without Google credentials offers no sign-in at all', async ({ page }) => {
		// Intercepted like the others rather than relying on the backend's own
		// answer: a developer who has configured Google locally would
		// otherwise fail this test purely because of their `.env`, which is
		// not something the suite should have an opinion about. That the
		// server really does report `provider_available: false` when the
		// credentials are unset is covered where it belongs, in
		// `web/backend/tests/test_auth_api.py`.
		await serveAuthStatus(page, {
			authenticated: false,
			email: null,
			display_name: null,
			provider_available: false
		});

		await page.goto('/');
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Sign in' })).toHaveCount(0);

		await gotoReady(page);
		await expect(page.getByRole('link', { name: 'Sign in with Google' })).toHaveCount(0);
		await expect(page.getByRole('button', { name: 'Sign out' })).toHaveCount(0);
	});

	test('when sign-in is available the landing page offers it', async ({ page }) => {
		await serveAuthStatus(page, {
			authenticated: false,
			email: null,
			display_name: null,
			provider_available: true
		});

		await page.goto('/');

		const signIn = page.getByRole('link', { name: 'Sign in' });
		await expect(signIn).toBeVisible();
		await expect(signIn).toHaveAttribute('href', '/api/auth/google/start');
	});

	test('the editor sidebar offers sign-in when nobody is signed in', async ({ page }) => {
		await serveAuthStatus(page, {
			authenticated: false,
			email: null,
			display_name: null,
			provider_available: true
		});

		await gotoReady(page);

		const signIn = page.getByRole('link', { name: 'Sign in with Google' });
		await expect(signIn).toBeVisible();
		await expect(signIn).toHaveAttribute('href', '/api/auth/google/start');
		await expect(page.getByRole('button', { name: 'Sign out' })).toHaveCount(0);
	});

	test('the editor sidebar shows who is signed in, and a way out', async ({ page }) => {
		await serveAuthStatus(page, {
			authenticated: true,
			email: 'person@example.com',
			display_name: 'A Person',
			provider_available: true
		});

		await gotoReady(page);

		await expect(page.getByText('A Person')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Sign in with Google' })).toHaveCount(0);
	});

	test('signing out posts to the backend and returns to a signed-out view', async ({ page }) => {
		await serveAuthStatus(page, {
			authenticated: true,
			email: 'person@example.com',
			display_name: 'A Person',
			provider_available: true
		});
		let logoutCalls = 0;
		await page.route('**/api/auth/logout', (route) => {
			logoutCalls += 1;
			return route.fulfill({ status: 204, body: '' });
		});

		await gotoReady(page);
		// The reload after signing out must see the signed-out answer, or the
		// page would come back still showing the account.
		await serveAuthStatus(page, {
			authenticated: false,
			email: null,
			display_name: null,
			provider_available: true
		});
		await page.getByRole('button', { name: 'Sign out' }).click();

		await expect(page.getByRole('link', { name: 'Sign in with Google' })).toBeVisible();
		expect(logoutCalls).toBe(1);
	});
});
