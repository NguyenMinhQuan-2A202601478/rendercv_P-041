import { test as base, expect } from '@playwright/test';
import { ACCOUNT_POOL_SIZE, SESSION_COOKIE_NAME, cookieForAccount } from './testAccount';

/**
 * The `test` every spec in this suite imports, instead of Playwright's.
 *
 * It does one thing Playwright's does not: put a signed-in session cookie
 * on the browser context before the test body runs, taking the next
 * account from the pool `globalSetup` seeded. Since the editor became
 * account-only, a context without one lands on the sign-in gate and never
 * reaches anything a spec is trying to test.
 *
 * Why a fixture rather than `storageState` in the config: `storageState`
 * is one fixed state shared by every test, and these tests need an account
 * each -- see `testAccount.ts`. The fixture also gives specs an explicit
 * way to opt out (`test.use({ signedIn: false })`) for the cases that are
 * *about* not being signed in.
 */

let nextAccount = 0;

export const test = base.extend<{ signedIn: boolean; account: number }>({
	// Opt out with `test.use({ signedIn: false })` in a describe block.
	signedIn: [true, { option: true }],

	/**
	 * The pool index this test owns. Exposed so a spec can tell two
	 * contexts apart when it deliberately needs the same account twice.
	 */
	account: [
		// eslint-disable-next-line no-empty-pattern
		async ({}, use) => {
			const index = nextAccount++;
			if (index >= ACCOUNT_POOL_SIZE) {
				throw new Error(
					`e2e account pool exhausted (${ACCOUNT_POOL_SIZE}); raise ACCOUNT_POOL_SIZE in e2e/testAccount.ts`
				);
			}
			await use(index);
		},
		{ scope: 'test' }
	],

	context: async ({ context, signedIn, account }, use) => {
		if (signedIn) {
			await context.addCookies([
				{
					name: SESSION_COOKIE_NAME,
					value: cookieForAccount(account),
					domain: 'localhost',
					path: '/',
					httpOnly: true,
					secure: false,
					sameSite: 'Lax'
				}
			]);
		}
		await use(context);
	}
});

export { expect };
