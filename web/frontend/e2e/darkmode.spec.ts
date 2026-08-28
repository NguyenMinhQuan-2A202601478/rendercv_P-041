import { test, expect } from '@playwright/test';
import { gotoReady, firstPreviewUrl } from './helpers';

/**
 * End-to-end coverage for Phase 5b: the light/dark theme toggle.
 *
 * Why `context.clearCookies()` + clearing the localStorage mirror in
 * `beforeEach`: the session-cookie-scoped `ui_theme` preference (and the
 * `rendercv.uiTheme` localStorage mirror) would otherwise leak between
 * tests/runs -- every test in this file starts from a known light-mode,
 * no-saved-preference state, matching a first-time visitor.
 */
test.describe('Dark mode toggle', () => {
	test.beforeEach(async ({ page, context }) => {
		await context.clearCookies();
		await page.addInitScript(() => window.localStorage.removeItem('rendercv.uiTheme'));
	});

	test('toggle adds the dark class on <html>, and it survives a reload (preference restored)', async ({
		page
	}) => {
		await gotoReady(page);
		await firstPreviewUrl(page);

		const html = page.locator('html');
		await expect(html).not.toHaveClass(/dark/);

		const toggle = page.getByRole('button', { name: /switch to dark theme/i });
		await toggle.click();

		await expect(html).toHaveClass(/dark/);
		// The toggle immediately relabels itself for the opposite action.
		await expect(page.getByRole('button', { name: /switch to light theme/i })).toBeVisible();

		// `PUT /api/preferences` has no debounce for this key -- give the fetch
		// a moment to land before reloading, so bootstrap's `GET` sees it.
		await page.waitForTimeout(500);

		await gotoReady(page);
		await expect(page.locator('html')).toHaveClass(/dark/);
	});

	test('toggling back to light removes the class', async ({ page }) => {
		await gotoReady(page);
		await firstPreviewUrl(page);

		const html = page.locator('html');
		const toggle = page.getByRole('button', { name: /switch to (dark|light) theme/i });

		await toggle.click();
		await expect(html).toHaveClass(/dark/);

		await toggle.click();
		await expect(html).not.toHaveClass(/dark/);
	});

	test('the YAML editor pane and the form pane are visibly restyled in dark mode', async ({ page }) => {
		await gotoReady(page);
		await firstPreviewUrl(page);

		const appRoot = page.locator('[data-app-ready="true"]');
		const lightRootBg = await appRoot.evaluate((el) => getComputedStyle(el).backgroundColor);

		// The div directly wrapping the CodeMirror editor (see `EditorPane.svelte`'s
		// `bg-white dark:bg-neutral-900` panel) -- two levels up from `.cm-editor`.
		const editorWrapper = page.locator('.cm-editor').locator('xpath=../..');
		const lightEditorBg = await editorWrapper.evaluate((el) => getComputedStyle(el).backgroundColor);

		await page.getByRole('button', { name: /switch to dark theme/i }).click();
		await expect(page.locator('html')).toHaveClass(/dark/);

		const darkRootBg = await appRoot.evaluate((el) => getComputedStyle(el).backgroundColor);
		const darkEditorBg = await editorWrapper.evaluate((el) => getComputedStyle(el).backgroundColor);

		expect(darkRootBg).not.toBe(lightRootBg);
		expect(darkEditorBg).not.toBe(lightEditorBg);

		// Switch to the form view: a text input's background (`FieldRow`'s
		// `bg-white dark:bg-neutral-900` input class) also restyles.
		await page.getByRole('switch', { name: 'Toggle YAML editor' }).click();
		const nameInput = page.getByLabel('Name', { exact: true });
		await expect(nameInput).toBeVisible();
		const darkInputBg = await nameInput.evaluate((el) => getComputedStyle(el).backgroundColor);

		await page.getByRole('button', { name: /switch to light theme/i }).click();
		await expect(page.locator('html')).not.toHaveClass(/dark/);
		const lightInputBg = await nameInput.evaluate((el) => getComputedStyle(el).backgroundColor);

		expect(darkInputBg).not.toBe(lightInputBg);
	});
});
