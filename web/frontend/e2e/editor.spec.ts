import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { gotoReady, firstPreviewUrl } from './helpers';

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

/**
 * Puts the cursor at the end of the editor line containing `text`.
 *
 * Why the tests reach for an existing line rather than inserting one: the
 * starter CV is the core's sample and already declares `phone:`, so typing
 * a second one made a duplicate key -- a YAML syntax error, not the schema
 * error these tests are about. One of them failed outright; the other kept
 * passing, because a syntax error raises a lint marker too, and quietly
 * stopped testing what its name says.
 */
async function cursorAtEndOfLine(page: Page, text: string): Promise<void> {
	const line = page.locator('.cm-line', { hasText: text }).first();
	await line.click();
	await page.keyboard.press('End');
}

test.describe('CV editor: edit -> preview loop', () => {
	test('valid edit re-renders the preview with a new blob URL', async ({ page }) => {
		await gotoReady(page);

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
				timeout: 25_000
			})
			.not.toBe(initialUrl);

		const updatedUrl = await page.getByTitle('CV PDF preview').getAttribute('src');
		expect(updatedUrl).toMatch(/^blob:/);
	});

	test('a schema error shows a gutter marker on the right tab/line, preview stays visible', async ({
		page
	}) => {
		await gotoReady(page);
		const goodUrl = await firstPreviewUrl(page);

		// The sample ships `phone:` with no value; filling it with something
		// unparsable is a schema error and nothing else.
		await cursorAtEndOfLine(page, 'phone:');
		await page.keyboard.type(' abc');

		// The CV tab gets a red error dot.
		const cvTab = page.getByRole('tab', { name: /^CV/ });
		await expect(cvTab.locator('span[aria-label*="error"]')).toBeVisible({ timeout: 25_000 });

		// A gutter marker appears in the lint gutter, on the phone line.
		const marker = page.locator('.cm-lint-marker-error');
		await expect(marker).toBeVisible({ timeout: 25_000 });

		// The line the marker sits on is the one just edited.
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
		await gotoReady(page);
		await firstPreviewUrl(page);

		await cursorAtEndOfLine(page, 'phone:');
		await page.keyboard.type(' abc');

		await expect(page.locator('.cm-lint-marker-error')).toBeVisible({ timeout: 25_000 });

		// Fix it: take the four characters back off, leaving `phone:` empty
		// again, which is how the sample ships it.
		for (let i = 0; i < 4; i += 1) {
			await page.keyboard.press('Backspace');
		}

		await expect(page.locator('.cm-lint-marker-error')).toHaveCount(0, { timeout: 25_000 });
		const cvTab = page.getByRole('tab', { name: /^CV/ });
		await expect(cvTab.locator('span[aria-label*="error"]')).toHaveCount(0, { timeout: 25_000 });
	});
});


test.describe('Downloading the YAML source', () => {
	// The PDF is the output; the YAML is the source, and the only one of the
	// two that can be edited again -- here, or by RenderCV's own CLI. This
	// exists because the deployment's database is disposable, so "get your
	// work out" has to be a button rather than a console snippet.

	test('the menu offers the source as well as the PDF', async ({ page }) => {
		await gotoReady(page);

		await page.getByRole('button', { name: 'More download options' }).click();

		const menu = page.getByRole('menu', { name: 'Download options' });
		await expect(menu.getByRole('menuitem', { name: 'Download PDF' })).toBeVisible();
		await expect(menu.getByRole('menuitem', { name: 'Download YAML' })).toBeVisible();
	});

	test('it saves one file that RenderCV could read back', async ({ page }) => {
		await gotoReady(page);

		await page.getByRole('button', { name: 'More download options' }).click();
		const downloadStarted = page.waitForEvent('download');
		await page.getByRole('menuitem', { name: 'Download YAML' }).click();
		const download = await downloadStarted;

		// Named after the CV, and sharing its stem with the PDF so both files
		// sort together in a downloads folder.
		expect(download.suggestedFilename()).toMatch(/\.yaml$/);

		const stream = await download.createReadStream();
		const chunks: Buffer[] = [];
		for await (const chunk of stream) chunks.push(Buffer.from(chunk));
		const text = Buffer.concat(chunks).toString('utf-8');

		// One file carrying the documents as top-level keys is exactly the
		// shape `rendercv render` accepts -- that is the whole reason the
		// export concatenates rather than zipping four files.
		expect(text).toContain('cv:');
		expect(text).toContain('settings:');
		// The starter CV's name, proving it exported the open document rather
		// than an empty shell.
		expect(text).toContain('name:');
		expect(text.endsWith('\n')).toBe(true);
	});

	test('the menu closes after the download starts', async ({ page }) => {
		await gotoReady(page);

		await page.getByRole('button', { name: 'More download options' }).click();
		const downloadStarted = page.waitForEvent('download');
		await page.getByRole('menuitem', { name: 'Download YAML' }).click();
		await downloadStarted;

		await expect(page.getByRole('menu', { name: 'Download options' })).toHaveCount(0);
	});
});


test.describe('Importing a YAML file', () => {
	// The other half of the export. A backup you cannot put back is a file,
	// not a backup, so the test that matters is the round trip rather than
	// either direction alone.

	test('a file this app exported comes back in as a new CV', async ({ page }, testInfo) => {
		await gotoReady(page);

		await page.getByRole('button', { name: 'More download options' }).click();
		const downloadStarted = page.waitForEvent('download');
		await page.getByRole('menuitem', { name: 'Download YAML' }).click();
		// Saved under a name we choose: the CV is named after the file, and
		// Playwright's own temporary name for a download is random.
		const saved = testInfo.outputPath('round-trip.yaml');
		await (await downloadStarted).saveAs(saved);

		// Set on the input directly rather than clicking the button, which
		// would open the operating system's file dialog.
		await page.getByLabel('YAML file to import').setInputFiles(saved);

		const list = page.getByRole('navigation', { name: 'Saved CVs' });
		await expect(list.getByText('round-trip')).toBeVisible({ timeout: 15_000 });
	});

	test('the imported CV really holds the imported text, after a reload', async ({
		page
	}, testInfo) => {
		// Reloaded on purpose: the import writes through the autosave, and
		// the failure worth catching is the one where the editor shows the
		// right thing and the server was never told.
		await gotoReady(page);

		await page.getByRole('button', { name: 'More download options' }).click();
		const downloadStarted = page.waitForEvent('download');
		await page.getByRole('menuitem', { name: 'Download YAML' }).click();
		const saved = testInfo.outputPath('persisted.yaml');
		await (await downloadStarted).saveAs(saved);

		await page.getByLabel('YAML file to import').setInputFiles(saved);
		await expect(page.getByRole('navigation', { name: 'Saved CVs' }).getByText('persisted')).toBeVisible({
			timeout: 15_000
		});
		// Let the debounced save land before throwing the page away.
		await expect(page.getByText(/saved/i).first()).toBeVisible({ timeout: 20_000 });

		await page.reload();
		await expect(page.locator('.cm-content')).toContainText('name:', { timeout: 25_000 });
	});

	test('a file that is not a RenderCV file is refused, and nothing is created', async ({
		page
	}, testInfo) => {
		await gotoReady(page);
		const list = page.getByRole('navigation', { name: 'Saved CVs' });
		const before = await list.getByRole('button').count();

		const notACv = testInfo.outputPath('not-a-cv.yaml');
		await writeFile(notACv, 'Nguyen Minh Quan\nData Scientist\n');
		await page.getByLabel('YAML file to import').setInputFiles(notACv);

		await expect(page.getByRole('alert')).toContainText('does not start with');
		expect(await list.getByRole('button').count()).toBe(before);
	});
});
