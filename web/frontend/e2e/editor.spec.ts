import { test, expect, type Page } from '@playwright/test';

/**
 * End-to-end coverage for the Phase 1 YAML-first MVP: edit -> debounced
 * preview render, and inline validation errors at the right tab/line.
 *
 * Why one spec file with sequential steps instead of independent `test()`
 * blocks per scenario: each scenario builds on the CV document state left
 * behind by the previous one (matches how a real editing session unfolds),
 * and avoids re-waiting for the ~800ms debounce + first render from scratch
 * for every assertion.
 */

async function firstPreviewUrl(page: Page): Promise<string> {
	const iframe = page.getByTitle('CV PDF preview');
	await expect(iframe).toHaveAttribute('src', /^blob:/, { timeout: 15_000 });
	return (await iframe.getAttribute('src')) ?? '';
}

test.describe('CV editor: edit -> preview loop', () => {
	test('valid edit re-renders the preview with a new blob URL', async ({ page }) => {
		await page.goto('/');

		const initialUrl = await firstPreviewUrl(page);

		const editor = page.locator('.cm-content');
		await editor.click();
		// Land right after "John Doe" on the name line, and append to it (no
		// newline involved), so the document stays valid and visibly changes.
		await page.keyboard.press('Control+Home');
		await page.keyboard.press('ArrowDown'); // to the "  name: John Doe" line
		await page.keyboard.press('End');
		await page.keyboard.type(' Jr');

		await expect
			.poll(async () => (await page.getByTitle('CV PDF preview').getAttribute('src')) ?? '', {
				timeout: 15_000
			})
			.not.toBe(initialUrl);

		const updatedUrl = await page.getByTitle('CV PDF preview').getAttribute('src');
		expect(updatedUrl).toMatch(/^blob:/);
	});

	test('a schema error shows a gutter marker on the right tab/line, preview stays visible', async ({
		page
	}) => {
		await page.goto('/');
		const goodUrl = await firstPreviewUrl(page);

		const editor = page.locator('.cm-content');
		await editor.click();
		await page.keyboard.press('Control+Home');
		await page.keyboard.press('ArrowDown'); // "  name: John Doe"
		await page.keyboard.press('End');
		await page.keyboard.press('Enter'); // keeps the 2-space indent of the name line
		await page.keyboard.type('phone: abc');

		// The CV tab gets a red error dot.
		const cvTab = page.getByRole('tab', { name: /^CV/ });
		await expect(cvTab.locator('span[aria-label*="error"]')).toBeVisible({ timeout: 15_000 });

		// A gutter marker appears in the lint gutter, on the "phone: abc" line.
		const marker = page.locator('.cm-lint-marker-error');
		await expect(marker).toBeVisible({ timeout: 15_000 });

		// The line the marker sits on is the one we just typed.
		const phoneLineNumber = await page.evaluate(() => {
			const lines = Array.from(document.querySelectorAll('.cm-line'));
			return lines.findIndex((el) => el.textContent?.includes('phone: abc')) + 1;
		});
		expect(phoneLineNumber).toBeGreaterThan(0);

		// The error bar lists it under the CV tab with the message from the backend.
		await expect(page.getByRole('alert')).toContainText('phone');
		await expect(page.getByRole('alert')).toContainText(/not a valid phone number/i);

		// The last good preview is still visible (not blanked out).
		await expect(page.getByTitle('CV PDF preview')).toHaveAttribute('src', goodUrl);
	});

	test('fixing the error clears the gutter marker and the tab dot', async ({ page }) => {
		await page.goto('/');
		await firstPreviewUrl(page);

		const editor = page.locator('.cm-content');
		await editor.click();
		await page.keyboard.press('Control+Home');
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('End');
		await page.keyboard.press('Enter');
		await page.keyboard.type('phone: abc');

		await expect(page.locator('.cm-lint-marker-error')).toBeVisible({ timeout: 15_000 });

		// Fix it: select the whole "phone: abc" line and delete it.
		await page.keyboard.press('Home');
		await page.keyboard.press('Shift+End');
		await page.keyboard.press('Delete');
		await page.keyboard.press('Backspace'); // remove the now-empty line

		await expect(page.locator('.cm-lint-marker-error')).toHaveCount(0, { timeout: 15_000 });
		const cvTab = page.getByRole('tab', { name: /^CV/ });
		await expect(cvTab.locator('span[aria-label*="error"]')).toHaveCount(0, { timeout: 15_000 });
	});
});
