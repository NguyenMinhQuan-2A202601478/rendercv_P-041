import { test, expect, type Page } from '@playwright/test';
import { gotoReady, firstPreviewUrl } from './helpers';

/**
 * End-to-end coverage for Phase 3: the tab-bar theme switcher and the
 * Design/Locale form editors' effective-value overlay (approved semantics
 * — see the phase task). Each test is self-contained (its own `gotoReady`
 * call): a fresh browser context has no session cookie, so bootstrap always
 * creates a brand-new default CV (see `e2e/helpers.ts`).
 */

async function goToTab(page: Page, name: 'CV' | 'Design' | 'Locale' | 'Settings'): Promise<void> {
	await page.getByRole('tab', { name: new RegExp(`^${name}`) }).click();
}

async function yamlText(page: Page): Promise<string> {
	return (await page.locator('.cm-content').textContent()) ?? '';
}

async function setYamlMode(page: Page, on: boolean): Promise<void> {
	const toggle = page.getByRole('switch', { name: 'Toggle YAML editor' });
	const checked = (await toggle.getAttribute('aria-checked')) === 'true';
	if (checked !== on) {
		await toggle.click();
		await expect(toggle).toHaveAttribute('aria-checked', on ? 'true' : 'false', { timeout: 5_000 });
	}
}

test.describe('Theme switcher (tab bar, visible on every tab)', () => {
	test('cycling with the next-theme arrow patches only design.theme; the YAML stays minimal and the preview re-renders', async ({
		page
	}) => {
		await gotoReady(page);
		const initialPreviewUrl = await firstPreviewUrl(page);

		await goToTab(page, 'Design');
		await setYamlMode(page, true);

		// A fresh CV's design document is blank.
		expect((await yamlText(page)).trim()).toBe('');

		await page.getByRole('button', { name: 'Next Theme' }).click();

		await expect
			.poll(async () => yamlText(page), { timeout: 20_000 })
			.toMatch(/theme:\s*ember/);

		const designYaml = await yamlText(page);
		// Minimal: only the theme line, nothing else (no page/colors/... keys).
		expect(designYaml).not.toMatch(/page:|colors:|typography:/);

		await expect
			.poll(async () => (await page.getByTitle('CV PDF preview').getAttribute('src')) ?? '', {
				timeout: 25_000
			})
			.not.toBe(initialPreviewUrl);
	});

	test('the theme name dropdown opens, lists all 9 themes with a checkmark on the current one, and Escape closes it', async ({
		page
	}) => {
		await gotoReady(page);
		await firstPreviewUrl(page);

		const trigger = page.getByRole('button', { name: 'Theme', exact: true });
		await trigger.click();

		const listbox = page.getByRole('listbox', { name: 'Theme' });
		await expect(listbox).toBeVisible();
		await expect(listbox.getByRole('option')).toHaveCount(9);

		// The checkmark itself is `aria-hidden` (purely visual); the
		// authoritative "this is the current one" signal is `aria-selected`.
		const currentOption = listbox.getByRole('option', { name: 'classic', exact: true });
		await expect(currentOption).toHaveAttribute('aria-selected', 'true');
		await expect(currentOption).toContainText('✓');
		await expect(listbox.getByRole('option', { name: 'ember', exact: true })).toHaveAttribute(
			'aria-selected',
			'false'
		);

		await page.keyboard.press('Escape');
		await expect(listbox).not.toBeVisible();
	});
});

test.describe('Design form: effective-value overlay', () => {
	test('an override survives a theme switch while a non-overridden sibling field visibly changes; resetting removes it', async ({
		page
	}) => {
		await gotoReady(page);
		await firstPreviewUrl(page);

		await goToTab(page, 'Design');
		await setYamlMode(page, false);

		const topMargin = page.getByLabel('Top Margin', { exact: true });
		const bottomMargin = page.getByLabel('Bottom Margin', { exact: true });
		await expect(topMargin).toBeVisible({ timeout: 20_000 });

		const bottomMarginBefore = await bottomMargin.inputValue();
		expect(bottomMarginBefore).toBe('0.7'); // classic's default

		await topMargin.fill('0.5');
		await topMargin.blur();

		await setYamlMode(page, true);
		await expect.poll(async () => yamlText(page), { timeout: 20_000 }).toMatch(/top_margin:\s*0\.5in/);

		// Switch theme (classic -> ember): the override must survive, and the
		// un-overridden bottom_margin must now reflect ember's default.
		await page.getByRole('button', { name: 'Next Theme' }).click();
		await expect.poll(async () => yamlText(page), { timeout: 20_000 }).toMatch(/theme:\s*ember/);
		expect(await yamlText(page)).toMatch(/top_margin:\s*0\.5in/);

		await setYamlMode(page, false);
		await expect.poll(async () => bottomMargin.inputValue(), { timeout: 20_000 }).not.toBe(bottomMarginBefore);
		await expect.poll(async () => bottomMargin.inputValue()).toBe('0.6'); // ember's default
		await expect(topMargin).toHaveValue('0.5'); // the override itself is unaffected by the theme switch

		// Reset the override: the "reset to default" affordance next to the label.
		await page.getByRole('button', { name: 'Reset Top Margin to the theme default' }).click();

		await setYamlMode(page, true);
		await expect.poll(async () => yamlText(page), { timeout: 20_000 }).not.toMatch(/top_margin/);
		expect(await yamlText(page)).toMatch(/theme:\s*ember/); // the theme override is untouched by the reset
	});
});

test.describe('Locale form', () => {
	test('editing a month name updates the locale YAML', async ({ page }) => {
		await gotoReady(page);
		await firstPreviewUrl(page);

		await goToTab(page, 'Locale');
		await setYamlMode(page, false);

		const january = page.getByLabel('January', { exact: true });
		await expect(january).toBeVisible({ timeout: 20_000 });
		await expect(january).toHaveValue('January'); // effective default (English locale)

		await january.fill('Januarius');
		await january.blur();

		await setYamlMode(page, true);
		await expect.poll(async () => yamlText(page), { timeout: 20_000 }).toMatch(/Januarius/);
		expect(await yamlText(page)).toMatch(/month_names:/);
	});
});
